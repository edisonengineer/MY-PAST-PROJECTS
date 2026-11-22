/* =========================================================================
   CV tailor page (cv-tailor/index.html). The logic is in js/cv-tailor-core.js,
   the facts in js/cv-master.js (built from content/cv.js, the projects and
   the certificates by tools/build-pages.js).

   Everything stays in this browser: the job description, your choices and
   your prompt are saved in localStorage, nothing is sent anywhere.
   The preview can only show lines from the master CV, word for word: to
   change a sentence, change it in content/cv.js (or the Google Sheet), so
   the website, the PDFs and every tailored CV stay the same and true.
   ========================================================================= */
(function () {
    'use strict';

    const C = window.CVTailor;
    const M = window.CV_MASTER;
    const app = document.getElementById('cvt-app');
    if (!app) return;
    if (!C || !M) { app.innerHTML = '<p class="cvt-error">The CV data did not load. Check your connection and reload the page.</p>'; return; }

    const KEY = { draft: 'cvTailor.draft.v1', jobs: 'cvTailor.jobs.v1', prompt: 'cvTailor.prompt.v1', preset: 'cvTailor.preset.v1' };
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode / full: keep working without saving */ } },
        del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    };
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

    const blank = () => ({ jd: '', role: '', company: '', focus: 'auto', length: 1, include: {}, order: {}, photo: false, email: true });
    let state = Object.assign(blank(), store.get(KEY.draft, {}));
    let analysis = null, result = null;

    const el = {
        jd: $('cvt-jd'), role: $('cvt-role'), company: $('cvt-company'), focus: $('cvt-focus'), length: $('cvt-length'),
        photo: $('cvt-photo'), email: $('cvt-email'), status: $('cvt-status'),
        match: $('cvt-match'), pick: $('cvt-pick'), paper: $('cvt-paper'), stage: $('cvt-stage'), pages: $('cvt-pages'),
        instructions: $('cvt-instructions'), preset: $('cvt-preset'), prompt: $('cvt-prompt'),
        jobs: $('cvt-jobs'), check: $('cvt-check-text'), checkOut: $('cvt-check-out')
    };

    /* ---------- form <-> state ---------- */
    Object.keys(C.FOCUS).forEach((k) => el.focus.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(C.FOCUS[k].label) + '</option>'));
    Object.keys(C.PRESETS).forEach((k) => el.preset.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(C.PRESETS[k].label) + '</option>'));
    function fillForm() {
        el.jd.value = state.jd; el.role.value = state.role; el.company.value = state.company;
        el.focus.value = C.FOCUS[state.focus] ? state.focus : 'auto'; el.length.value = String(state.length === 2 ? 2 : 1);
        el.photo.checked = !!state.photo; el.email.checked = state.email !== false;
    }
    const save = debounce(() => store.set(KEY.draft, state), 250);
    function say(msg) { el.status.textContent = msg; clearTimeout(say.t); say.t = setTimeout(() => { el.status.textContent = ''; }, 4000); }

    /* ---------- 2. match analysis ---------- */
    function renderMatch() {
        if (!state.jd.trim()) {
            el.match.innerHTML = '<p class="cvt-empty">Paste a job description above to see which of its requirements your real experience covers.</p>';
            return;
        }
        const a = analysis;
        const LEVEL = { required: 'Required', mentioned: 'Mentioned', preferred: 'Nice to have' };
        const STATUS = { matched: 'You have it', partial: 'Course only', gap: 'Not in your CV' };
        const chip = (t) => '<li class="cvt-chip is-' + t.status + '" title="' + esc(STATUS[t.status] + ' · ' + LEVEL[t.level] + (t.evidence.length ? '\nFound in: ' + t.evidence.slice(0, 6).map((e) => e.label).join('\n') : '') + (t.note ? '\n' + t.note : '')) + '">' +
            '<span class="cvt-dot" aria-hidden="true"></span>' + esc(t.label) + (t.level === 'required' ? ' <b class="cvt-req">required</b>' : t.level === 'preferred' ? ' <i class="cvt-pref">nice to have</i>' : '') +
            '<span class="sr-only"> (' + STATUS[t.status] + ')</span></li>';
        const groups = Object.keys(C.GROUPS).map((g) => {
            const list = a.terms.filter((t) => t.group === g);
            if (!list.length) return '';
            const ordered = list.slice().sort((x, y) => ['matched', 'partial', 'gap'].indexOf(x.status) - ['matched', 'partial', 'gap'].indexOf(y.status));
            return '<div class="cvt-group"><h4>' + esc(C.GROUPS[g]) + '</h4><ul class="cvt-chips">' + ordered.map(chip).join('') + '</ul></div>';
        }).join('');
        const warn = a.terms.filter((t) => t.status === 'partial').map((t) => '<li><strong>' + esc(t.label) + ':</strong> ' + esc(t.note) + '</li>')
            .concat(a.checks.map((c) => '<li>' + esc(c) + '</li>'));
        const gapsReq = a.terms.filter((t) => t.level === 'required' && t.status === 'gap' && t.group !== 'other');
        const evidence = a.terms.filter((t) => t.status !== 'gap' && t.group !== 'other').map((t) =>
            '<li><strong>' + esc(t.label) + '</strong><span>' + t.evidence.slice(0, 5).map((e) => esc(e.label)).join(' · ') + (t.evidence.length > 5 ? ' · +' + (t.evidence.length - 5) + ' more' : '') + '</span></li>').join('');
        el.match.innerHTML =
            '<div class="cvt-score"><div class="cvt-meter" role="img" aria-label="' + a.coverage + '% of the weighted requirements are covered by your CV"><span style="width:' + a.coverage + '%"></span></div>' +
            '<p><strong>' + a.coverage + '%</strong> of what the job asks for is backed by your real CV · ' + a.counts.matched + ' matched, ' + a.counts.partial + ' course only, ' + a.counts.gap + ' gaps' +
            (a.counts.required ? ' · ' + (a.counts.required - a.counts.requiredGaps) + ' of ' + a.counts.required + ' required' : '') + '</p></div>' +
            (gapsReq.length ? '<p class="cvt-gapnote"><strong>Required but not in your CV:</strong> ' + gapsReq.map((t) => esc(t.label)).join(', ') + '. The tailored CV will not claim these.</p>' : '') +
            (warn.length ? '<ul class="cvt-warnings">' + warn.join('') + '</ul>' : '') +
            '<div class="cvt-legend"><span class="cvt-chip is-matched"><span class="cvt-dot"></span>You have it</span><span class="cvt-chip is-partial"><span class="cvt-dot"></span>Course only, don\'t claim</span><span class="cvt-chip is-gap"><span class="cvt-dot"></span>Not in your CV</span></div>' +
            groups +
            (evidence ? '<details class="cvt-evidence"><summary>Where each match was found</summary><ul>' + evidence + '</ul></details>' : '');
    }

    /* ---------- 3. choose & order ---------- */
    function order(key) { return result.order(key); }
    function bar(id) {
        const s = result.ranking.score[id] || 0;
        const why = result.ranking.why[id] || [];
        const max = Math.max(1, ...Object.values(result.ranking.score));
        return '<span class="cvt-rel" title="' + esc(why.length ? 'Matches: ' + why.join(', ') : 'No direct match with this job') + '"><span style="width:' + Math.round(100 * s / max) + '%"></span></span>';
    }
    function row(id, label, sub, container, i, n, cls) {
        const on = result.included(id);
        return '<li class="cvt-row' + (cls ? ' ' + cls : '') + (on ? '' : ' is-off') + '" data-id="' + esc(id) + '">' +
            '<label><input type="checkbox" data-inc="' + esc(id) + '"' + (on ? ' checked' : '') + '><span><span class="cvt-row-t">' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>' +
            bar(id) +
            (container ? '<span class="cvt-move"><button type="button" data-move="' + esc(container) + '" data-dir="-1" data-id="' + esc(id) + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                '<button type="button" data-move="' + esc(container) + '" data-dir="1" data-id="' + esc(id) + '" aria-label="Move down"' + (i === n - 1 ? ' disabled' : '') + '>↓</button></span>' : '') + '</li>';
    }
    function renderPick() {
        const byId = (list) => new Map(list.map((x) => [x.id, x]));
        const exp = byId(M.experience), prj = byId(M.projects), sk = byId(M.skills), ce = byId(M.certificates), ed = byId(M.education);
        const sub = (list, key) => { const ids = order(key); return '<ul class="cvt-sub">' + ids.map((id, i) => row(id, esc(list.get(id).text), '', key, i, ids.length, 'is-bullet')).join('') + '</ul>'; };
        const section = (title, body, hint) => '<div class="cvt-sec"><h4>' + title + (hint ? ' <small>' + hint + '</small>' : '') + '</h4>' + body + '</div>';
        const ex = order('experience');
        const pr = order('projects');
        const ks = result.cv.keySkills;
        let html = section('Profile', '<ul class="cvt-list">' + row(M.summary.id, 'Profile summary', esc(M.summary.text.slice(0, 120)) + '…') +
            row('key-skills', 'Relevant skills line', ks.length ? esc(ks.join(' · ')) : 'Only skills the job asks for that your CV proves') + '</ul>');
        html += section('Experience', '<ul class="cvt-list">' + ex.map((id, i) => {
            const x = exp.get(id);
            return row(id, esc(x.role), esc(x.org + ' · ' + x.dates), 'experience', i, ex.length) + (x.points.length ? '<li class="cvt-nest">' + sub(byId(x.points), id) + '</li>' : '');
        }).join('') + '</ul>', 'kept in date order by default');
        html += section('Projects', '<ul class="cvt-list">' + pr.map((id, i) => {
            const p = prj.get(id);
            return row(id, esc(p.title), esc([p.category === 'graphic' ? 'Graphic design' : 'Engineering', p.year, p.tags.slice(0, 4).join(', ')].filter(Boolean).join(' · ')), 'projects', i, pr.length) + (p.points.length && result.included(id) ? '<li class="cvt-nest">' + sub(byId(p.points), id) + '</li>' : '');
        }).join('') + '</ul>', 'most relevant first');
        const sl = order('skills');
        html += section('Skills', '<ul class="cvt-list">' + sl.map((id, i) => row(id, esc(sk.get(id).text), '', 'skills', i, sl.length)).join('') + '</ul>');
        const el2 = order('education');
        html += section('Education', '<ul class="cvt-list">' + el2.map((id, i) => row(id, esc(ed.get(id).title), esc(ed.get(id).org + ' · ' + ed.get(id).dates), 'education', i, el2.length)).join('') + '</ul>');
        const cl = order('certificates');
        const KIND = { certification: 'Certificate', award: 'Award', course: 'Training course (not the certification)' };
        html += section('Certifications &amp; training', '<ul class="cvt-list">' + cl.map((id, i) => row(id, esc(ce.get(id).title), esc(ce.get(id).issuer + ' · ' + KIND[ce.get(id).kind]), 'certificates', i, cl.length)).join('') + '</ul>' +
            (M.hidden.certificates ? '<p class="cvt-hint">' + M.hidden.certificates + ' certificate(s) marked "not for the job portfolio" are left out.</p>' : ''));
        html += section('Other', '<ul class="cvt-list">' + row('languages', 'Languages', esc(M.languages.join(' · '))) + row('memberships', 'Memberships', esc(M.memberships.length + ' listed')) + '</ul>' +
            (M.hidden.projects ? '<p class="cvt-hint">' + M.hidden.projects + ' project(s) marked "not for the job portfolio" are left out.</p>' : ''));
        el.pick.innerHTML = html;
    }

    /* ---------- the tailored CV preview (only master lines, never edited text) ---------- */
    function renderPaper() {
        const cv = result.cv, p = cv.person;
        const mail = el.paper.dataset.user && el.paper.dataset.domain ? el.paper.dataset.user + '@' + el.paper.dataset.domain : '';
        const site = p.website.replace(/^https:\/\//, '').replace(/\/$/, '');
        const contact = [esc(p.location), esc(p.phone), state.email !== false && mail ? esc(mail) : '', '<a href="' + esc(p.linkedin) + '">linkedin.com/in/edison-ochieng</a>', '<a href="' + esc(p.website) + '">' + esc(site) + '</a>'].filter(Boolean).join('<span aria-hidden="true"> · </span>');
        const h = (t) => '<h2>' + t + '</h2>';
        let html = '<header class="cvp-head">' + (state.photo ? '<img class="cvp-photo" src="../images/profile/edison.jpg?v=2" alt="" onerror="this.remove()">' : '') +
            '<div><h1>' + esc(p.name) + '</h1><p class="cvp-title">' + esc(p.title) + '</p><p class="cvp-contact">' + contact + '</p></div></header>';
        if (cv.summary) html += '<section>' + h('Profile') + '<p>' + esc(cv.summary.text) + '</p>' + (cv.keySkills.length ? '<p class="cvp-key"><strong>Relevant skills:</strong> ' + cv.keySkills.map(esc).join(' · ') + '</p>' : '') + '</section>';
        else if (cv.keySkills.length) html += '<section><p class="cvp-key"><strong>Relevant skills:</strong> ' + cv.keySkills.map(esc).join(' · ') + '</p></section>';
        if (cv.experience.length) html += '<section>' + h('Experience') + cv.experience.map((x) => '<article class="cvp-item"><header><h3>' + esc(x.role) + '</h3><span>' + esc(x.dates) + '</span></header><p class="cvp-org">' + esc(x.org) + '</p>' +
            (x.points.length ? '<ul>' + x.points.map((b) => '<li>' + esc(b.text) + '</li>').join('') + '</ul>' : '') + '</article>').join('') + '</section>';
        if (cv.projects.length) html += '<section>' + h('Selected projects') + cv.projects.map((pr) => '<article class="cvp-item"><header><h3>' + esc(pr.title) + '</h3><span>' + esc(pr.year) + '</span></header>' +
            (pr.subtitle ? '<p class="cvp-org">' + esc(pr.subtitle) + '</p>' : '') + '<p>' + esc(pr.summary) + '</p>' +
            (pr.points.length ? '<ul>' + pr.points.map((b) => '<li>' + esc(b.text) + '</li>').join('') + '</ul>' : '') +
            (pr.tags.length ? '<p class="cvp-tags">' + pr.tags.map(esc).join(' · ') + '</p>' : '') + '</article>').join('') + '</section>';
        if (cv.education.length) html += '<section>' + h('Education') + cv.education.map((e) => '<article class="cvp-item"><header><h3>' + esc(e.title) + '</h3><span>' + esc(e.dates) + '</span></header><p class="cvp-org">' + esc(e.org) + '</p>' + (e.note ? '<p>' + esc(e.note) + '</p>' : '') + '</article>').join('') + '</section>';
        const side = [];
        if (cv.skills.length) side.push('<section>' + h('Skills') + '<ul>' + cv.skills.map((s) => '<li>' + esc(s.text) + '</li>').join('') + '</ul></section>');
        if (cv.certificates.length) side.push('<section>' + h('Certifications &amp; training') + '<ul class="cvp-certs">' + cv.certificates.map((c) => '<li><strong>' + esc(c.title) + '</strong> · ' + esc(c.issuer) + '</li>').join('') + '</ul></section>');
        if (cv.languages.length) side.push('<section>' + h('Languages') + '<p>' + cv.languages.map(esc).join(' · ') + '</p></section>');
        if (cv.memberships.length) side.push('<section>' + h('Memberships') + '<ul>' + cv.memberships.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul></section>');
        el.paper.classList.toggle('is-compact', state.length !== 2);
        el.paper.innerHTML = html + (side.length ? '<div class="cvp-cols">' + side.join('') + '</div>' : '');
        fitPaper();
    }
    // Shrink the A4 sheet to fit the column on screen (printing always uses the real size)
    function fitPaper() {
        const w = el.stage.clientWidth;
        const pw = el.paper.offsetWidth;
        const s = pw ? Math.min(1, w / pw) : 1;
        el.paper.style.transform = s < 1 ? 'scale(' + s + ')' : '';
        el.stage.style.height = Math.ceil(el.paper.offsetHeight * s) + 'px';
        // Printed: A4 with 12 mm top/bottom margins (css/cv-tailor.css @page), so 273 mm of text per page
        const mm = el.paper.offsetWidth / 210, cs = getComputedStyle(el.paper);
        const last = el.paper.lastElementChild;
        const content = last ? last.offsetTop + last.offsetHeight - parseFloat(cs.paddingTop) : 0;   // the sheet has a min-height, so measure the text
        const pages = content / (273 * mm);
        el.pages.textContent = '≈ ' + (Math.ceil(pages * 10) / 10).toFixed(1) + ' page' + (pages > 1.05 ? 's' : '') + ' (A4)';
        el.pages.classList.toggle('is-over', pages > (state.length === 2 ? 2.02 : 1.02));
        return pages;
    }
    // Untick the least relevant lines, one at a time, until the CV fits the chosen length
    function fitToLength() {
        const max = state.length === 2 ? 2 : 1;
        let removed = 0;
        for (let guard = 0; guard < 40 && fitPaper() > max + 0.005; guard++) {
            const id = C.trimOrder(result).find((x) => result.included(x));
            if (!id) break;
            state.include[id] = false;
            removed++;
            result = C.compose(M, analysis, { length: state.length }, state);
            renderPaper();
        }
        renderPick(); renderPrompt(); save();
        return removed;
    }

    /* ---------- 4. AI hand-off ---------- */
    const target = () => ({ role: state.role.trim(), company: state.company.trim(), jd: state.jd, length: state.length });
    function renderPrompt() {
        el.prompt.value = state.jd.trim() ? C.prompt(result.cv, analysis, target(), el.instructions.value) : 'Paste a job description first: the prompt is built from it and from the lines you ticked.';
    }

    function refresh(full) {
        if (full || !analysis) analysis = C.analyse(state.jd, M, state.focus, target());
        result = C.compose(M, analysis, { length: state.length }, state);
        if (full) renderMatch();
        renderPick();
        renderPaper();
        renderPrompt();
    }
    const refreshSoon = debounce(() => {
        refresh(true);
        if (state.jd.trim() && !Object.keys(state.include).length && !Object.keys(state.order).length) {
            const n = fitToLength();
            if (n) say('Unticked ' + n + ' less relevant line(s) to fit ' + (state.length === 2 ? '2 pages' : '1 page') + '.');
        }
    }, 350);

    /* ---------- events ---------- */
    app.addEventListener('input', (e) => {
        const t = e.target;
        if (t === el.jd || t === el.role || t === el.company) {
            state[t === el.jd ? 'jd' : t === el.role ? 'role' : 'company'] = t.value;
            save(); refreshSoon();
        } else if (t === el.instructions) {
            store.set(KEY.prompt, t.value); renderPrompt();
        }
    });
    app.addEventListener('change', (e) => {
        const t = e.target;
        if (t === el.focus) { state.focus = t.value; save(); refresh(true); }
        else if (t === el.length) { state.length = t.value === '2' ? 2 : 1; save(); refresh(false); if (fitPaper() > state.length + 0.02) say('Over ' + state.length + ' page(s): use "Fit to length" or untick lines in step 3.'); }
        else if (t === el.photo || t === el.email) { state[t === el.photo ? 'photo' : 'email'] = t.checked; save(); renderPaper(); }
        else if (t.dataset.inc) { state.include[t.dataset.inc] = t.checked; save(); refresh(false); }
        else if (t === el.preset) {
            const p = C.PRESETS[t.value];
            if (!p) return;
            if (el.instructions.value.trim() && el.instructions.value !== (C.PRESETS[store.get(KEY.preset, 'balanced')] || {}).text && !confirm('Replace your prompt with the "' + p.label + '" preset?')) { t.value = store.get(KEY.preset, 'balanced'); return; }
            el.instructions.value = p.text; store.set(KEY.prompt, p.text); store.set(KEY.preset, t.value); renderPrompt();
        }
    });
    app.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.move) {
            const key = b.dataset.move, ids = order(key), i = ids.indexOf(b.dataset.id), j = i + Number(b.dataset.dir);
            if (i < 0 || j < 0 || j >= ids.length) return;
            [ids[i], ids[j]] = [ids[j], ids[i]];
            state.order[key] = ids; save(); refresh(false);
            const again = el.pick.querySelector('button[data-move="' + CSS.escape(key) + '"][data-id="' + CSS.escape(b.dataset.id) + '"][data-dir="' + b.dataset.dir + '"]');
            if (again && !again.disabled) again.focus();
            return;
        }
        const act = b.dataset.act;
        if (!act) return;
        const name = () => ['cv', state.company, state.role, new Date().toISOString().slice(0, 10)].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-');
        if (act === 'analyse') { refresh(true); el.match.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else if (act === 'fit') { const n = fitToLength(); say(n ? 'Unticked ' + n + ' of the least relevant line(s) so it fits. Tick any of them again in step 3.' : 'It already fits.'); }
        else if (act === 'reset-choices') { state.include = {}; state.order = {}; save(); refresh(false); say('Choices reset to the job\'s ranking.'); }
        else if (act === 'new') {
            if ((state.jd.trim() || Object.keys(state.include).length) && !confirm('Clear this job and start a new one? Saved jobs and your prompt are kept.')) return;
            state = Object.assign(blank(), { photo: state.photo, email: state.email, focus: state.focus, length: state.length });
            store.set(KEY.draft, state); fillForm(); refresh(true); el.jd.focus(); say('Cleared. Paste the next job description.');
        } else if (act === 'save-job') {
            const jobs = store.get(KEY.jobs, []);
            const label = [state.role, state.company].filter(Boolean).join(' · ') || 'Job ' + new Date().toLocaleDateString();
            const idx = jobs.findIndex((j) => j.label === label);
            const item = { label, saved: new Date().toISOString(), state: JSON.parse(JSON.stringify(state)) };
            if (idx >= 0) jobs[idx] = item; else jobs.unshift(item);
            store.set(KEY.jobs, jobs.slice(0, 25)); renderJobs(label); say('Saved "' + label + '" in this browser.');
        } else if (act === 'load-job') {
            const j = store.get(KEY.jobs, []).find((x) => x.label === el.jobs.value);
            if (!j) return;
            state = Object.assign(blank(), j.state); store.set(KEY.draft, state); fillForm(); refresh(true); say('Loaded "' + j.label + '".');
        } else if (act === 'delete-job') {
            const v = el.jobs.value;
            if (!v || !confirm('Delete the saved job "' + v + '"?')) return;
            store.set(KEY.jobs, store.get(KEY.jobs, []).filter((x) => x.label !== v)); renderJobs(); say('Deleted.');
        } else if (act === 'reset-prompt') {
            el.instructions.value = C.PRESETS.balanced.text; el.preset.value = 'balanced'; store.del(KEY.prompt); store.set(KEY.preset, 'balanced'); renderPrompt(); say('Prompt reset to the default.');
        } else if (act === 'copy-prompt') copy(el.prompt.value, 'Prompt copied. Check every line the AI gives you against this CV.');
        else if (act === 'copy-md') copy(C.markdown(result.cv, target()), 'Markdown CV copied.');
        else if (act === 'copy-json') copy(JSON.stringify(C.payload(result.cv, analysis, target()), null, 2), 'JSON copied.');
        else if (act === 'dl-md') download(name() + '.md', C.markdown(result.cv, target()), 'text/markdown');
        else if (act === 'dl-json') download(name() + '.json', JSON.stringify(Object.assign({ job_description: state.jd }, C.payload(result.cv, analysis, target())), null, 2), 'application/json');
        else if (act === 'print') {
            const before = document.title;
            document.title = [M.person.name, 'CV', state.company, state.role].filter(Boolean).join(' - ');
            const back = () => { document.title = before; window.removeEventListener('afterprint', back); };
            window.addEventListener('afterprint', back);
            window.print();
            setTimeout(back, 1500);
        } else if (act === 'check') renderCheck();
    });
    window.addEventListener('resize', debounce(fitPaper, 120));
    window.addEventListener('beforeprint', () => { el.paper.style.transform = ''; });
    window.addEventListener('afterprint', fitPaper);

    function renderJobs(selected) {
        const jobs = store.get(KEY.jobs, []);
        el.jobs.innerHTML = jobs.length ? jobs.map((j) => '<option' + (j.label === selected ? ' selected' : '') + ' value="' + esc(j.label) + '">' + esc(j.label) + ' (' + esc(j.saved.slice(0, 10)) + ')</option>').join('') : '<option value="">No saved jobs yet</option>';
        el.jobs.disabled = !jobs.length;
    }

    function copy(text, msg) {
        const done = () => say(msg);
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
        function fallback() {
            const ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { say('Copy failed: select the text and copy it by hand.'); }
            ta.remove();
        }
    }
    function download(file, text, type) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
        a.download = file;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        say('Downloaded ' + file + '.');
    }

    /* ---------- 5. fact check pasted AI text ---------- */
    function renderCheck() {
        const text = el.check.value;
        if (!text.trim()) { el.checkOut.innerHTML = '<p class="cvt-empty">Paste the text an AI assistant wrote for you, then check it.</p>'; return; }
        const flags = C.factCheck(text, M);
        const KIND = { number: 'Number', term: 'Tool / skill', cert: 'Certification', claim: 'Wording', id: 'Source id', name: 'Name' };
        el.checkOut.innerHTML = flags.length
            ? '<p class="cvt-gapnote"><strong>' + flags.length + ' thing(s) to check</strong> before you use this text. Remove anything that isn\'t true, or add it to your master CV first if it is.</p><ul class="cvt-flags">' +
                flags.map((f) => '<li><span class="cvt-flag-k">' + esc(KIND[f.kind] || f.kind) + '</span> <strong>' + esc(f.text) + '</strong><span>' + esc(f.note) + '</span></li>').join('') + '</ul>'
            : '<p class="cvt-ok">No unknown numbers, tools, certifications or names found. Still read it once against your CV: this check can\'t judge meaning.</p>';
    }

    /* ---------- start ---------- */
    el.instructions.value = store.get(KEY.prompt, null) || C.PRESETS.balanced.text;
    el.preset.value = store.get(KEY.preset, 'balanced');
    fillForm();
    renderJobs();
    refresh(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPaper);
})();
