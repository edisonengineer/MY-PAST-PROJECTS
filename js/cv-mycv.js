/* =========================================================================
   CV tailor: "My CV" (cv-tailor/index.html).

   1. Log in first: the page shows a log-in screen until the visitor is
      logged in to their (free) account (js/account.js), so a shared link
      always lands on the log-in.
   2. Terms: the first time (and when the terms change, TERMS_VERSION), the
      visitor must tick that they accept the Terms and the Privacy notice.
      Nothing is stored in their account before that.
   3. Their CV: loaded from their account (Google Sheet, "CVs" tab, see
      tools/google-sheet-script.gs), so it follows them to any device. It can
      be uploaded (PDF / Word, read in the browser by js/cv-import.js), pasted,
      edited, backed up to a file, restored and deleted. Every change is saved
      on this device at once and to the account a few seconds later.
   4. Edison (the account in SITE_CONFIG.cvTailor.owner) can use the website's
      own CV (js/cv-master.js, built from content/cv.js) instead.

   When the visitor logs out, everything the tool kept on this device is
   removed (CV copy, jobs, drafts, prompt).
   ========================================================================= */
(function () {
    'use strict';

    const TERMS_VERSION = '2026-11-22';   // change this (and the terms pages) to ask everyone to accept new terms
    const C = window.CVTailor, I = window.CVImport;
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
        del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    };
    const debounce = (fn, ms) => { let t; const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; f.now = (...a) => { clearTimeout(t); fn(...a); }; return f; };
    const el = {
        gate: $('cvt-gate'), login: $('cvt-gate-login'), consent: $('cvt-gate-consent'), loading: $('cvt-gate-loading'), agree: $('cvt-agree'), agreeGo: $('cvt-agree-go'), gateMsg: $('cvt-gate-msg'),
        app: $('cvt-app'), status: $('cvt-my-status'), stats: $('cvt-my-stats'), who: $('cvt-my-who'), editor: $('cvt-editor'), editWrap: $('cvt-editor-wrap'),
        file: $('cvt-file'), restore: $('cvt-restore'), pasteWrap: $('cvt-paste-wrap'), paste: $('cvt-paste'), notes: $('cvt-import-notes'),
        sourceWrap: $('cvt-source-wrap'), source: $('cvt-source'), mycv: $('cvt-mycv')
    };
    if (!el.app || !C || !I) return;
    const accountScript = document.querySelector('script[src*="account.js"]');
    const API = (accountScript && accountScript.dataset.api) || '';
    const CFG = window.SITE_CONFIG || {};
    const OWNER = ((CFG.cvTailor && CFG.cvTailor.owner) || []).join('@').toLowerCase();

    let user = null, prefix = '', RAW = C.emptyRaw(), source = 'account', remoteOk = false, dirty = false;
    const K = (k) => prefix + k;
    const isOwner = () => !!user && !!OWNER && user.email.toLowerCase() === OWNER;

    /* ---------- talking to the account (Google Sheet) ---------- */
    async function apiGet(params) {
        if (!API) return { ok: false, error: 'setup' };
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 20000);
        try { return await (await fetch(API + (API.includes('?') ? '&' : '?') + new URLSearchParams(params), { signal: ctrl.signal })).json(); }
        catch (e) { return { ok: false, error: 'network' }; } finally { clearTimeout(timer); }
    }
    async function apiPost(params) {
        if (!API) return { ok: false, error: 'setup' };
        try {
            const res = await fetch(API, { method: 'POST', body: new URLSearchParams(params) });
            return await res.json();
        } catch (e) {
            // Some browsers can't read the reply: send it the simple way, then check that it arrived
            try { await fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(params) }); } catch (err) { return { ok: false, error: 'network' }; }
            if (params.action !== 'cv-save') return { ok: true };
            const back = await apiGet({ action: 'cv-get', t: params.t });
            return back.ok && JSON.stringify(back.cv) === JSON.stringify(JSON.parse(params.cv)) ? { ok: true, updated: back.updated } : { ok: false, error: back.error || 'network' };
        }
    }

    /* ---------- screens: log in, accept the terms, the tool ---------- */
    function showGate(which, msg) {
        el.gate.hidden = false;
        el.app.hidden = true;
        el.login.hidden = which !== 'login';
        el.consent.hidden = which !== 'consent';
        el.loading.hidden = which !== 'loading';
        el.gateMsg.textContent = msg || '';
        el.gateMsg.hidden = !msg;
    }
    function showApp() { el.gate.hidden = true; el.app.hidden = false; }

    async function route(session) {
        user = session;
        if (!user || !user.email) return showGate('login');
        prefix = 'cvTailor.' + C.hash(user.email.toLowerCase()) + '.';
        showGate('loading');
        const local = store.get(K('cv'), null), localTerms = store.get(K('terms'), '');
        dirty = !!store.get(K('dirty'), false);
        const r = await apiGet({ action: 'cv-get', t: user.t });
        if (r.error === 'login') {
            if (window.NexusAccount) window.NexusAccount.logout();
            return;
        }
        remoteOk = !!r.ok;
        const accepted = (remoteOk && r.terms === TERMS_VERSION) || localTerms === TERMS_VERSION;
        // Your newest copy wins: unsaved changes on this device, else the account's copy
        if (remoteOk && r.cv && !dirty) RAW = C.sanitizeRaw(r.cv);
        else if (local) RAW = C.sanitizeRaw(local);
        else if (remoteOk && r.cv) RAW = C.sanitizeRaw(r.cv);
        else RAW = C.emptyRaw();
        if (remoteOk) store.set(K('updated'), r.updated || '');
        if (!accepted) {
            showGate('consent');
            el.agree.checked = false;
            el.agreeGo.disabled = true;
            return;
        }
        if (remoteOk && r.terms !== TERMS_VERSION) apiPost({ action: 'cv-terms', t: user.t, terms: TERMS_VERSION });
        launch();
    }
    el.agree.addEventListener('change', () => { el.agreeGo.disabled = !el.agree.checked; });
    el.agreeGo.addEventListener('click', async () => {
        if (!el.agree.checked || !user) return;
        el.agreeGo.disabled = true;
        store.set(K('terms'), TERMS_VERSION);
        const r = await apiPost({ action: 'cv-terms', t: user.t, terms: TERMS_VERSION });
        if (!r.ok && r.error === 'login') { if (window.NexusAccount) window.NexusAccount.logout(); return; }
        launch();
    });

    async function launch() {
        source = isOwner() ? store.get(K('source'), 'site') : 'account';
        el.sourceWrap.hidden = !isOwner();
        el.source.value = source;
        showApp();
        const master = await currentMaster();
        window.CVTailorUI.boot(master, { prefix, email: user.email, photo: isOwner() && source === 'site' ? '../images/profile/edison.jpg?v=2' : '' });
        renderMy();
        if (dirty) saveSoon();
        if (source === 'account' && C.rawStats(RAW).empty) openEditor(false);
    }
    function loadSiteMaster() {
        if (window.CV_MASTER) return Promise.resolve(window.CV_MASTER);
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = '../js/cv-master.js';
            s.onload = () => resolve(window.CV_MASTER || C.normalizeMaster(C.emptyRaw()));
            s.onerror = () => resolve(C.normalizeMaster(C.emptyRaw()));
            document.head.appendChild(s);
        });
    }
    async function currentMaster() {
        if (source === 'site') return loadSiteMaster();
        return C.normalizeMaster(RAW);
    }

    /* ---------- the "My CV" card ---------- */
    function renderMy(msg) {
        const st = C.rawStats(RAW), site = source === 'site';
        el.who.textContent = user ? 'Logged in as ' + user.email : '';
        el.mycv.classList.toggle('is-empty', !site && st.empty);
        el.mycv.querySelectorAll('[data-my-account]').forEach((b) => { b.hidden = site; });
        if (site) {
            el.stats.textContent = 'Using the website CV (content/cv.js, your projects and certificates). Edit those files to change it.';
            el.status.textContent = '';
            return;
        }
        el.stats.textContent = st.empty ? 'No CV yet. Upload your current CV (PDF or Word) or paste it, then check it below.'
            : [st.roles + ' role' + (st.roles === 1 ? '' : 's'), st.bullets + ' bullet points', st.projects + ' project' + (st.projects === 1 ? '' : 's'), st.education + ' education', st.skills + ' skills', st.certificates + ' certificate' + (st.certificates === 1 ? '' : 's')].join(' · ');
        const upd = store.get(K('updated'), '');
        el.status.className = 'cvt-my-status' + (dirty ? ' is-pending' : '');
        el.status.textContent = msg || (dirty ? 'Saved on this device; not yet in your account.' : upd ? 'Saved in your account · ' + new Date(upd).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : st.empty ? '' : 'Saved in your account.');
    }

    /* ---------- changes: on this device at once, in the account a few seconds later ---------- */
    const rebuild = debounce(async () => { window.CVTailorUI.setMaster(await currentMaster()); renderMy(); }, 350);
    function changed() {
        RAW = C.sanitizeRaw(RAW);
        dirty = true;
        store.set(K('cv'), RAW);
        store.set(K('dirty'), true);
        rebuild();
        saveSoon();
        renderMy();
    }
    const saveSoon = debounce(async () => {
        if (!user || source === 'site') return;
        renderMy('Saving to your account…');
        const r = await apiPost({ action: 'cv-save', t: user.t, cv: JSON.stringify(RAW), terms: TERMS_VERSION });
        if (r.ok) {
            dirty = false;
            store.set(K('dirty'), false);
            store.set(K('updated'), r.updated || new Date().toISOString());
            renderMy();
        } else if (r.error === 'login') renderMy('Your login has expired: log in again to save (your changes are kept on this device).');
        else if (r.error === 'too-big') renderMy('Your CV is too long to save in your account. Shorten it, or keep a backup file.');
        else renderMy('Couldn\'t reach your account (offline?). Your changes are kept on this device and will be saved when you are back online.');
    }, 2500);
    window.addEventListener('online', () => { if (dirty) saveSoon.now(); });

    /* ---------- the editor ---------- */
    const LISTS = {
        experience: { label: 'Experience', one: 'role', blank: () => ({ role: '', org: '', dates: '', points: [] }) },
        projects: { label: 'Projects', one: 'project', blank: () => ({ title: '', subtitle: '', year: '', summary: '', points: [], tags: [] }) },
        education: { label: 'Education', one: 'qualification', blank: () => ({ title: '', org: '', dates: '', note: '' }) },
        certificates: { label: 'Certificates, awards & training', one: 'certificate', blank: () => ({ title: '', issuer: '', kind: 'certification', verify: '' }) }
    };
    let uid = 0;
    function field(label, path, value, o) {
        o = o || {};
        const id = 'ed-' + (++uid);
        const input = o.rows
            ? '<textarea id="' + id + '" data-k="' + path + '" data-lines="' + (o.lines ? 1 : 0) + '" rows="' + o.rows + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(o.lines ? (value || []).join('\n') : value) + '</textarea>'
            : o.options
                ? '<select id="' + id + '" data-k="' + path + '">' + o.options.map(([v, t]) => '<option value="' + v + '"' + (v === value ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>'
                : '<input id="' + id + '" data-k="' + path + '"' + (o.comma ? ' data-comma="1"' : '') + ' type="' + (o.type || 'text') + '" value="' + esc(o.comma ? (value || []).join(', ') : value) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' autocomplete="off">';
        return '<div class="field' + (o.wide ? ' cvt-ed-wide' : '') + '"><label for="' + id + '">' + label + (o.hint ? ' <small>' + o.hint + '</small>' : '') + '</label>' + input + '</div>';
    }
    function card(list, i, n, inner) {
        const L = LISTS[list];
        return '<div class="cvt-ed-card"><div class="cvt-ed-card-h"><strong>' + esc(L.one.charAt(0).toUpperCase() + L.one.slice(1)) + ' ' + (i + 1) + '</strong><span>' +
            '<button type="button" class="cvt-ed-btn" data-ed-move="' + list + '.' + i + '" data-dir="-1" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" class="cvt-ed-btn" data-ed-move="' + list + '.' + i + '" data-dir="1" aria-label="Move down"' + (i === n - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button type="button" class="cvt-ed-btn is-del" data-ed-del="' + list + '.' + i + '">Remove</button></span></div><div class="cvt-ed-grid">' + inner + '</div></div>';
    }
    const KINDS = [['certification', 'Certification (you passed / hold it)'], ['course', 'Course / training (completed, not a certification)'], ['award', 'Award / competition']];
    function renderEditor() {
        uid = 0;
        const r = RAW, sec = (title, body, count, open) => '<details class="cvt-ed-sec"' + (open ? ' open' : '') + '><summary>' + title + (count != null ? ' <small>' + count + '</small>' : '') + '</summary><div class="cvt-ed-body">' + body + '</div></details>';
        let h = sec('Name, headline &amp; contact', '<div class="cvt-ed-grid">' +
            field('Full name', 'person.name', r.person.name) + field('Headline / job title', 'person.title', r.person.title, { ph: 'e.g. Mechanical Engineer' }) +
            field('Location', 'person.location', r.person.location, { ph: 'e.g. Nairobi, Kenya' }) + field('Phone', 'person.phone', r.person.phone, { type: 'tel' }) +
            field('Email on your CV', 'person.email', r.person.email, { type: 'email', ph: user ? user.email : '' }) + field('LinkedIn', 'person.linkedin', r.person.linkedin, { ph: 'linkedin.com/in/…' }) +
            field('Website', 'person.website', r.person.website) + field('Portfolio link', 'person.portfolio', r.person.portfolio, { hint: '(for letters and emails)' }) + '</div>', '', true);
        h += sec('Profile summary', field('A short paragraph about you', 'summary', r.summary, { rows: 4, wide: true }), r.summary ? '' : 'empty', true);
        h += sec('Experience', r.experience.map((x, i) => card('experience', i, r.experience.length,
            field('Job title / role', 'experience.' + i + '.role', x.role) + field('Organisation', 'experience.' + i + '.org', x.org) + field('Dates', 'experience.' + i + '.dates', x.dates, { ph: 'e.g. Jan 2024 – Present' }) +
            field('What you did', 'experience.' + i + '.points', x.points, { rows: Math.max(3, x.points.length + 1), lines: true, wide: true, hint: '(one point per line)' }))).join('') +
            '<button type="button" class="btn btn-outline cvt-sm" data-ed-add="experience">+ Add a role</button>', r.experience.length, true);
        h += sec('Projects', r.projects.map((x, i) => card('projects', i, r.projects.length,
            field('Project name', 'projects.' + i + '.title', x.title) + field('Context', 'projects.' + i + '.subtitle', x.subtitle, { ph: 'e.g. Final-year project' }) + field('Year', 'projects.' + i + '.year', x.year) +
            field('Short description', 'projects.' + i + '.summary', x.summary, { rows: 2, wide: true }) +
            field('Highlights', 'projects.' + i + '.points', x.points, { rows: Math.max(2, x.points.length + 1), lines: true, wide: true, hint: '(one per line)' }) +
            field('Tools used', 'projects.' + i + '.tags', x.tags, { comma: true, wide: true, hint: '(separate with commas)' }))).join('') +
            '<button type="button" class="btn btn-outline cvt-sm" data-ed-add="projects">+ Add a project</button>', r.projects.length, false);
        h += sec('Education', r.education.map((x, i) => card('education', i, r.education.length,
            field('Qualification', 'education.' + i + '.title', x.title, { ph: 'e.g. BSc Mechanical Engineering' }) + field('School / university', 'education.' + i + '.org', x.org) + field('Dates', 'education.' + i + '.dates', x.dates) +
            field('Details', 'education.' + i + '.note', x.note, { rows: 2, wide: true, hint: '(grade, coursework…)' }))).join('') +
            '<button type="button" class="btn btn-outline cvt-sm" data-ed-add="education">+ Add a qualification</button>', r.education.length, false);
        h += sec('Skills', field('Your skills', 'skills', r.skills, { rows: Math.max(4, r.skills.length + 1), lines: true, wide: true, hint: '(one per line, e.g. "CAD: SolidWorks, AutoCAD")' }), r.skills.length, false);
        h += sec('Certificates, awards &amp; training', '<p class="cvt-help">Be exact about what each one is: a prep course is not the certification itself, and the tool never claims more than you choose here.</p>' +
            r.certificates.map((x, i) => card('certificates', i, r.certificates.length,
                field('Title', 'certificates.' + i + '.title', x.title) + field('Issued by', 'certificates.' + i + '.issuer', x.issuer) +
                field('What it is', 'certificates.' + i + '.kind', x.kind, { options: KINDS }) + field('Link to check it', 'certificates.' + i + '.verify', x.verify, { hint: '(optional)' }))).join('') +
            '<button type="button" class="btn btn-outline cvt-sm" data-ed-add="certificates">+ Add a certificate</button>', r.certificates.length, false);
        h += sec('Languages &amp; memberships', '<div class="cvt-ed-grid">' + field('Languages', 'languages', r.languages, { rows: 3, lines: true, hint: '(one per line)' }) +
            field('Memberships', 'memberships', r.memberships, { rows: 3, lines: true, hint: '(one per line)' }) + '</div>', '', false);
        el.editor.innerHTML = h;
    }
    function openEditor(scroll) {
        renderEditor();
        el.editWrap.hidden = false;
        if (scroll) el.editWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const pathGet = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), RAW);
    function pathSet(path, value) {
        const ks = path.split('.'), last = ks.pop();
        const obj = ks.reduce((o, k) => o[k], RAW);
        if (obj) obj[last] = value;
    }
    el.editor.addEventListener('input', (e) => {
        const t = e.target, k = t.dataset && t.dataset.k;
        if (!k) return;
        const v = t.dataset.lines === '1' ? t.value.split('\n').map((x) => x.trim()).filter(Boolean) : t.dataset.comma ? t.value.split(',').map((x) => x.trim()).filter(Boolean) : t.value;
        pathSet(k, v);
        dirty = true;
        store.set(K('cv'), RAW);
        store.set(K('dirty'), true);
        rebuild();
        saveSoon();
        renderMy();
    });
    el.editor.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.k) changed(); });   // tidy (e.g. links) once a field is left
    el.editor.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.edAdd) { RAW[b.dataset.edAdd].push(LISTS[b.dataset.edAdd].blank()); changed(); renderEditor(); const cards = el.editor.querySelectorAll('[data-k^="' + b.dataset.edAdd + '.' + (RAW[b.dataset.edAdd].length - 1) + '."]'); if (cards[0]) { cards[0].closest('details').open = true; cards[0].focus(); } return; }
        const ref = b.dataset.edDel || b.dataset.edMove;
        if (!ref) return;
        const [list, idx] = ref.split('.'), i = Number(idx), arr = RAW[list];
        if (b.dataset.edDel) {
            const it = arr[i], name = it.role || it.title || '';
            if (!confirm('Remove ' + (name ? '"' + name + '"' : 'this ' + LISTS[list].one) + ' from your CV?')) return;
            arr.splice(i, 1);
        } else {
            const j = i + Number(b.dataset.dir);
            if (j < 0 || j >= arr.length) return;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const open = [...el.editor.querySelectorAll('details')].map((d) => d.open);
        changed(); renderEditor();
        el.editor.querySelectorAll('details').forEach((d, k) => { d.open = open[k]; });
    });

    /* ---------- upload, paste, backup, restore, delete ---------- */
    const ERR = {
        'too-big': 'That file is larger than 10 MB. Save a smaller copy, or paste the text.',
        'old-doc': 'That is an old Word file (.doc). In Word choose File → Save As → Word Document (.docx), or save it as PDF, then upload it again.',
        'pdf-image': 'This PDF looks like a scanned picture, so there is no text to read. Upload the Word file instead, or paste the text.',
        'pdf-load': 'The PDF reader didn\'t load (are you offline?). Try again, upload the Word file, or paste the text.',
        'not-docx': 'This Word file couldn\'t be read. Save it again as .docx (or PDF) and upload that.',
        'old-browser': 'Your browser can\'t open Word files. Update it, or upload a PDF, or paste the text.',
        type: 'Upload a PDF or a Word file (.docx), or paste the text.'
    };
    function useImported(result, from) {
        if (!C.rawStats(RAW).empty && !confirm('Replace your current CV with the one read from ' + from + '?\n\nTip: "Download backup" first if you want to keep the current one.')) return;
        const raw = C.sanitizeRaw(result.raw);
        if (!raw.person.email && user) raw.person.email = user.email;
        RAW = raw;
        changed();
        openEditor(true);
        el.notes.hidden = false;
        el.notes.innerHTML = '<p><strong>Check your CV below.</strong> Reading a CV is guesswork, and your tailored CVs, letters and emails will use these exact words: fix anything in the wrong place, and add anything missing.</p>' +
            (result.warnings.length ? '<ul>' + result.warnings.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul>' : '') +
            '<button type="button" class="btn btn-navy cvt-sm" data-act-my="checked">I\'ve checked it</button>';
        window.CVTailorUI.say('Read ' + from + '. Check every section of My CV.');
    }
    el.file.addEventListener('change', async () => {
        const f = el.file.files[0];
        el.file.value = '';
        if (!f) return;
        renderMy('Reading ' + f.name + '…');
        try { useImported(await I.fromFile(f), '"' + f.name + '"'); }
        catch (err) { renderMy(); alert(ERR[err.message] || ('This file couldn\'t be read (' + err.message + '). Try the other format, or paste the text.')); }
    });
    el.restore.addEventListener('change', async () => {
        const f = el.restore.files[0];
        el.restore.value = '';
        if (!f) return;
        try {
            const data = JSON.parse(await f.text());
            const raw = data && data.format === 'nexus-cv-tailor' ? data.cv : data;
            if (!raw || typeof raw !== 'object' || !raw.person) throw new Error('format');
            if (!C.rawStats(RAW).empty && !confirm('Replace your current CV with the backup "' + f.name + '"?')) return;
            RAW = C.sanitizeRaw(raw);
            changed(); openEditor(false);
            window.CVTailorUI.say('Backup restored.');
        } catch (e) { alert('That file is not a CV backup from this page.'); }
    });
    el.mycv.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-act-my]');
        if (!b) return;
        const act = b.dataset.actMy;
        if (act === 'upload') el.file.click();
        else if (act === 'paste') { el.pasteWrap.hidden = !el.pasteWrap.hidden; if (!el.pasteWrap.hidden) el.paste.focus(); }
        else if (act === 'read-paste') {
            if (!el.paste.value.trim()) return el.paste.focus();
            useImported(I.fromText(el.paste.value), 'the pasted text');
            el.paste.value = ''; el.pasteWrap.hidden = true;
        } else if (act === 'edit') { if (el.editWrap.hidden) openEditor(true); else el.editWrap.hidden = true; }
        else if (act === 'checked') el.notes.hidden = true;
        else if (act === 'backup') {
            const name = 'my-cv-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: 'nexus-cv-tailor', version: 1, saved: new Date().toISOString(), cv: RAW }, null, 2)], { type: 'application/json' }));
            a.download = name; document.body.appendChild(a); a.click(); a.remove();
            window.CVTailorUI.say('Downloaded ' + name + '.');
        } else if (act === 'restore') el.restore.click();
        else if (act === 'delete') {
            if (!confirm('Delete your CV from your account and from this device?\n\nThis can\'t be undone. "Download backup" first if you want to keep a copy.')) return;
            renderMy('Deleting…');
            const r = await apiPost({ action: 'cv-delete', t: user.t });
            if (!r.ok) { renderMy(r.error === 'login' ? 'Log in again to delete your CV.' : 'Couldn\'t reach your account: nothing was deleted. Try again when you are online.'); return; }
            RAW = C.emptyRaw();
            ['cv', 'dirty', 'updated'].forEach((k) => store.del(K(k)));
            dirty = false;
            el.notes.hidden = true;
            window.CVTailorUI.setMaster(C.normalizeMaster(RAW));
            openEditor(false);
            renderMy('Your CV was deleted from your account and this device.');
        }
    });
    el.source.addEventListener('change', async () => {
        source = el.source.value === 'site' ? 'site' : 'account';
        store.set(K('source'), source);
        el.editWrap.hidden = true;
        window.CVTailorUI.boot(await currentMaster(), { prefix, email: user.email, photo: source === 'site' ? '../images/profile/edison.jpg?v=2' : '' });
        renderMy();
    });

    /* ---------- start (after js/account.js has loaded) ---------- */
    // Logging out removes everything this tool kept on the device (for every account)
    function wipeDevice() {
        try { Object.keys(localStorage).filter((k) => k.indexOf('cvTailor.') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    }
    function start() {
        const A = window.NexusAccount;
        if (!A) { showGate('login', 'The account service didn\'t load. Check your connection and reload the page.'); return; }
        A.onChange((s) => {
            if (!s) { wipeDevice(); RAW = C.emptyRaw(); user = null; showGate('login', 'You are logged out. Nothing from the CV tailor is left on this device.'); }
            else if (!user || user.email !== s.email) route(s);
        });
        route(A.user());
    }
    // js/account.js loads after this file: start once it is there (it always is by DOMContentLoaded)
    if (window.NexusAccount || document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
