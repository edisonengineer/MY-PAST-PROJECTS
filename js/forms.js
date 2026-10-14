/* =========================================================================
   Forms: project brief (assessment), reviews section and review form.
   Submissions are delivered to Edison's email through Web3Forms.
   ========================================================================= */
(function () {
    'use strict';

    // Settings live in js/config.js. The Web3Forms key is public by design:
    // it can only send to the inbox it was created for.
    const CONFIG = window.SITE_CONFIG || {};
    const WEB3FORMS_KEY = CONFIG.web3formsKey;
    const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
    const WHATSAPP = CONFIG.whatsapp || '254708639473';
    const track = (name) => { if (typeof window.track === 'function') window.track(name); };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lock = () => (window.Site ? window.Site.lock() : document.body.classList.add('no-scroll'));
    const unlock = () => (window.Site ? window.Site.unlock() : document.body.classList.remove('no-scroll'));
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

    async function sendToWeb3Forms(fields) {
        const res = await fetch(WEB3FORMS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.assign({ access_key: WEB3FORMS_KEY }, fields))
        });
        let data = {};
        try { data = await res.json(); } catch (e) { /* non-JSON response */ }
        if (!res.ok || !data.success) throw new Error(data.message || 'Request failed (' + res.status + ')');
        return data;
    }

    function setLoading(btn, loading, label) {
        if (loading) {
            btn.dataset.label = btn.innerHTML;
            btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> ' + (label || 'Sending…');
            btn.disabled = true;
        } else if (btn.dataset.label) {
            btn.innerHTML = btn.dataset.label;
            btn.disabled = false;
        }
    }

    /* ======================================================================
       PROJECT BRIEF WIZARD
       ====================================================================== */
    const form = $('#brief-form');
    if (form) {
        const allSteps = $$('.step', form);
        const stepLabels = $$('.wizard-steps li', form);
        const bar = $('#wizard-bar');
        const progressText = $('#wizard-progress');
        const btnBack = $('#brief-back');
        const btnNext = $('#brief-next');
        const btnSubmit = $('#brief-submit');
        const errorBox = $('#brief-error');
        const done = $('#brief-done');
        let index = 0;

        // Due date can't be in the past
        const due = $('#b-due');
        const today = new Date();
        due.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

        const serviceType = () => { const c = $('input[name="Service type"]:checked', form); return c ? c.value : ''; };

        // The path through the form depends on the chosen service
        function path() {
            const type = serviceType();
            return allSteps.filter((s) => !s.dataset.branch || s.dataset.branch === type);
        }

        function valuesOf(name) {
            return $$('[name="' + CSS.escape(name) + '"]', form)
                .filter((el) => (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value)
                .map((el) => el.value);
        }

        // Show/hide follow-up questions (e.g. print size only when printing)
        function updateConditionals() {
            $$('[data-when-name]', form).forEach((q) => {
                const want = q.dataset.whenValues.split(',');
                const have = valuesOf(q.dataset.whenName);
                q.hidden = !want.some((w) => have.includes(w));
            });
        }

        function isShown(el) {
            return !el.closest('[hidden]') && el.closest('.step') && path().includes(el.closest('.step'));
        }

        function show(i) {
            const steps = path();
            index = Math.max(0, Math.min(i, steps.length - 1));
            allSteps.forEach((s) => s.classList.toggle('is-active', s === steps[index]));
            stepLabels.forEach((li, n) => {
                li.classList.toggle('is-active', n === index);
                li.classList.toggle('is-done', n < index);
            });
            bar.style.width = ((index + 1) / steps.length * 100) + '%';
            progressText.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
            btnBack.hidden = index === 0;
            btnNext.hidden = index === steps.length - 1;
            btnSubmit.hidden = index !== steps.length - 1;
            errorBox.hidden = true;
            if (index === steps.length - 1) renderSummary();
        }

        function scrollToForm() {
            const header = $('#site-header');
            const top = form.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 16;
            if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top, behavior: 'smooth' });
        }

        function validate(step) {
            $$('.is-invalid', step).forEach((el) => el.classList.remove('is-invalid'));
            const problems = [];

            $$('.q[data-required="group"]', step).forEach((q) => {
                if (q.hidden) return;
                if (!$$('input', q).some((i) => i.checked)) {
                    q.classList.add('is-invalid');
                    problems.push(q);
                }
            });
            $$('input[required]:not([type="radio"]):not([type="checkbox"]), select[required], textarea[required]', step).forEach((el) => {
                if (!isShown(el)) return;
                const v = el.value.trim();
                let bad = !v;
                if (!bad && el.type === 'email') bad = !isEmail(v);
                if (!bad && el.type === 'date' && el.min) bad = v < el.min;
                if (bad) { el.closest('.field').classList.add('is-invalid'); problems.push(el); }
            });
            // Step 1: a service type must be picked
            const radios = $$('input[type="radio"][required]', step);
            if (radios.length && !radios.some((r) => r.checked)) {
                const g = radios[0].closest('.type-grid');
                g.classList.add('is-invalid');
                problems.push(g);
            }

            if (problems.length) {
                errorBox.textContent = problems.length === 1 ? 'Please complete the highlighted question.' : 'Please complete the ' + problems.length + ' highlighted questions.';
                errorBox.hidden = false;
                const first = problems[0];
                const focusable = first.matches('input, select, textarea') ? first : $('input, select, textarea', first);
                if (focusable) focusable.focus({ preventScroll: true });
                first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            errorBox.hidden = true;
            return true;
        }

        // Gather answers from the visible questions, in order
        function collect() {
            const data = {};
            path().forEach((step) => {
                $$('input, select, textarea', step).forEach((el) => {
                    if (!el.name || el.name === 'botcheck' || !isShown(el)) return;
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        if (!el.checked) return;
                        data[el.name] = data[el.name] ? data[el.name] + ', ' + el.value : el.value;
                    } else if (el.value.trim()) {
                        data[el.name] = el.value.trim();
                    }
                });
            });
            return data;
        }

        const LABELS = { name: 'Name', email: 'Email' };
        function renderSummary() {
            const data = collect();
            const skip = ['name', 'email', 'Phone / WhatsApp', 'Organisation', 'Preferred contact', 'Heard about me via'];
            const rows = Object.keys(data).filter((k) => !skip.includes(k))
                .map((k) => '<div><dt>' + esc(LABELS[k] || k) + '</dt><dd>' + esc(data[k]) + '</dd></div>').join('');
            $('#brief-summary').innerHTML = '<h4>Your brief at a glance</h4><dl>' + rows + '</dl><button type="button" class="link-btn" data-goto="0">Edit answers</button>';
        }

        const clearResolved = () => { if (!$('.step.is-active .is-invalid', form)) errorBox.hidden = true; };
        form.addEventListener('change', (e) => {
            updateConditionals();
            const field = e.target.closest('.field, .q, .type-grid');
            if (field) field.classList.remove('is-invalid');
            clearResolved();
            if (e.target.name === 'Service type') {
                // Clear the error and move on automatically
                setTimeout(() => { show(1); scrollToForm(); }, 260);
            }
        });
        form.addEventListener('input', (e) => {
            const field = e.target.closest('.field');
            if (field) field.classList.remove('is-invalid');
            clearResolved();
        });
        form.addEventListener('click', (e) => {
            const g = e.target.closest('[data-goto]');
            if (g) { show(+g.dataset.goto); scrollToForm(); }
        });

        btnNext.addEventListener('click', () => {
            if (!validate(path()[index])) return;
            show(index + 1);
            scrollToForm();
        });
        btnBack.addEventListener('click', () => { show(index - 1); scrollToForm(); });

        // Enter key moves forward instead of submitting early
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !btnNext.hidden) {
                e.preventDefault();
                btnNext.click();
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const steps = path();
            for (let i = 0; i < steps.length; i++) {
                if (!validate(steps[i])) { show(i); return; }
            }
            if (form.botcheck.checked) return;

            const data = collect();
            const type = data['Service type'] || 'Project';
            setLoading(btnSubmit, true, 'Sending brief…');
            try {
                await sendToWeb3Forms(Object.assign({
                    subject: 'New project brief: ' + type + ' from ' + data.name,
                    from_name: 'Portfolio: Project Brief',
                    replyto: data.email
                }, data));

                const wa = 'Hi Edison, I just submitted a ' + type.toLowerCase() + ' project brief on your portfolio' +
                    (data['Project name'] ? ' ("' + data['Project name'] + '")' : '') + '. My name is ' + data.name + '.';
                $('#brief-wa').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(wa);
                form.hidden = true;
                done.hidden = false;
                done.focus({ preventScroll: true });
                scrollToForm();
                track('brief-submitted');
                form.reset();
                updateConditionals();
            } catch (err) {
                const text = 'Hi Edison, here is my project brief:\n\n' + Object.keys(data).map((k) => (LABELS[k] || k) + ': ' + data[k]).join('\n');
                errorBox.innerHTML = 'Sorry, the brief couldn\'t be sent right now (' + esc(err.message) + '). ' +
                    '<a href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">Send it on WhatsApp instead</a>.';
                errorBox.hidden = false;
            } finally {
                setLoading(btnSubmit, false);
            }
        });

        $('#brief-again').addEventListener('click', () => {
            done.hidden = true;
            form.hidden = false;
            show(0);
            scrollToForm();
        });

        // "Start an engineering/design project" links pre-select the service
        window.BriefForm = {
            preset(type) {
                const radio = $$('input[name="Service type"]', form).find((r) => r.value === type);
                if (!radio) return;
                done.hidden = true;
                form.hidden = false;
                radio.checked = true;
                updateConditionals();
                show(1);
            }
        };
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-brief]');
            if (link) window.BriefForm.preset(link.dataset.brief);
        });

        updateConditionals();
        show(0);
    }

    /* ======================================================================
       REVIEWS SECTION
       ====================================================================== */
    const grid = $('#review-grid');
    const reviews = Array.isArray(window.REVIEWS) ? window.REVIEWS : [];
    const tones = ['sun', 'teal', 'coral', 'violet', 'blue'];
    const starRow = (n) => '<span class="review-stars" role="img" aria-label="' + n + ' out of 5 stars">' +
        [1, 2, 3, 4, 5].map((i) => '<svg class="' + (i <= n ? 'on' : '') + '" aria-hidden="true"><use href="#i-star"/></svg>').join('') + '</span>';

    if (grid) {
        if (reviews.length) {
            grid.innerHTML = reviews.map((r, i) => {
                const initials = String(r.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                const rating = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
                return '<figure class="review-card" data-reveal style="--d:' + (i % 3) * 100 + 'ms">' +
                    '<div class="review-top">' + starRow(rating) + (r.service ? '<span class="chip">' + esc(r.service) + '</span>' : '') + '</div>' +
                    '<blockquote>' + esc(r.text) + '</blockquote>' +
                    '<figcaption><span class="review-avatar bg-' + tones[i % tones.length] + '">' + esc(initials) + '</span>' +
                    '<span><strong>' + esc(r.name) + '</strong>' + esc([r.role, r.date].filter(Boolean).join(' · ')) + '</span></figcaption>' +
                '</figure>';
            }).join('');
        } else {
            grid.innerHTML =
                '<div class="review-empty" data-reveal>' +
                    '<span class="review-empty-stars">' + starRow(5) + '</span>' +
                    '<h3>Be the first to leave a review</h3>' +
                    '<p>Reviews from clients, trainees and collaborators will appear here.</p>' +
                '</div>';
        }
        // Reveal the freshly rendered cards
        const els = $$('[data-reveal]', grid);
        if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const io = new IntersectionObserver((entries) => entries.forEach((en) => {
                if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
            }), { rootMargin: '0px 0px -8% 0px' });
            els.forEach((el) => io.observe(el));
        } else {
            els.forEach((el) => el.classList.add('is-visible'));
        }
    }

    /* ======================================================================
       REVIEW FORM (popup)
       ====================================================================== */
    const rModal = $('#review-modal');
    const rForm = $('#review-form');
    if (rModal && rForm) {
        const rDone = $('#review-done');
        const rError = $('#review-error');
        let returnTo = null;

        function openReview() {
            returnTo = document.activeElement;
            rForm.hidden = false;
            rDone.hidden = true;
            rError.hidden = true;
            rModal.classList.add('is-open');
            rModal.setAttribute('aria-hidden', 'false');
            lock();
            setTimeout(() => $('#rs5').focus({ preventScroll: true }), 50);
        }
        function closeReview() {
            if (!rModal.classList.contains('is-open')) return;
            rModal.classList.remove('is-open');
            rModal.setAttribute('aria-hidden', 'true');
            unlock();
            if (returnTo) returnTo.focus({ preventScroll: true });
        }

        $('#open-review').addEventListener('click', openReview);
        rModal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeReview(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && rModal.classList.contains('is-open')) closeReview(); });
        const rClear = (e) => {
            const f = e.target.closest('.field, .q');
            if (f) f.classList.remove('is-invalid');
            if (!$('.is-invalid', rForm)) rError.hidden = true;
        };
        // Review-request links: index.html?review=1&name=Jane&project=Bracket%20design&service=Engineering%20Design
        // (made with request-review/index.html) open this form ready to fill in
        const rq = new URLSearchParams(location.search);
        if (rq.has('review')) {
            const name = (rq.get('name') || '').slice(0, 80);
            const project = (rq.get('project') || '').slice(0, 120);
            const service = rq.get('service') || '';
            if (name) rForm.name.value = name;
            if (project) { $('#rv-project').value = project; $('#rv-for-name').textContent = project; $('#rv-for').hidden = false; }
            const opt = Array.from(rForm['Service received'].options).find((o) => o.value === service);
            if (opt) rForm['Service received'].value = opt.value;
            window.addEventListener('load', () => {
                const sec = document.getElementById('reviews');
                if (sec) sec.scrollIntoView({ block: 'start' });
                openReview();
                track('review-link-opened');
            });
        }
        const resetProject = () => { $('#rv-for').hidden = true; };
        rForm.addEventListener('reset', resetProject);

        rForm.addEventListener('change', rClear);
        rForm.addEventListener('input', rClear);

        rForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            $$('.is-invalid', rForm).forEach((el) => el.classList.remove('is-invalid'));
            const rating = $('input[name="Rating"]:checked', rForm);
            const name = rForm.name.value.trim();
            const email = rForm.email.value.trim();
            const text = rForm.Review.value.trim();
            const bad = [];
            if (!rating) bad.push($('.stars', rForm).closest('.q'));
            if (!name) bad.push(rForm.name.closest('.field'));
            if (email && !isEmail(email)) bad.push(rForm.email.closest('.field'));
            if (!text) bad.push(rForm.Review.closest('.field'));
            if (bad.length) {
                bad.forEach((el) => el.classList.add('is-invalid'));
                rError.textContent = 'Please add a rating, your name and a short review.';
                rError.hidden = false;
                return;
            }
            if (rForm.botcheck.checked) return;

            const btn = $('#review-submit');
            setLoading(btn, true, 'Sending review…');
            try {
                const fields = {
                    subject: 'New review: ' + rating.value + '/5 from ' + name,
                    from_name: 'Portfolio: Review',
                    name: name,
                    Rating: rating.value + ' / 5',
                    'Role / organisation': rForm['Role / organisation'].value.trim(),
                    'Service received': rForm['Service received'].value,
                    Project: $('#rv-project').value.trim(),
                    Review: text,
                    'Permission to publish': rForm['Permission to publish'].checked ? 'Yes' : 'No'
                };
                if (email) { fields.email = email; fields.replyto = email; }
                Object.keys(fields).forEach((k) => { if (fields[k] === '') delete fields[k]; });
                await sendToWeb3Forms(fields);
                track('review-submitted');
                rForm.reset();
                rForm.hidden = true;
                rDone.hidden = false;
                rDone.focus({ preventScroll: true });
            } catch (err) {
                rError.textContent = 'Sorry, your review couldn\'t be sent right now (' + err.message + '). Please try again in a moment.';
                rError.hidden = false;
            } finally {
                setLoading(btn, false);
            }
        });
    }

    /* ======================================================================
       POPUP FORMS: webinar registration, cheat sheet download
       Any <form class="web3-form"> inside a .form-modal is handled here.
       ====================================================================== */
    let openFormModal = null;
    let formReturn = null;

    function openModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        formReturn = document.activeElement;
        const f = $('form', m), d = $('.form-done', m);
        if (f) { f.hidden = false; $('.form-error', f).hidden = true; }
        if (d) d.hidden = true;
        m.classList.add('is-open');
        m.setAttribute('aria-hidden', 'false');
        lock();
        openFormModal = m;
        setTimeout(() => { const first = $('input:not([type=hidden]):not(.hp), select', m); if (first) first.focus({ preventScroll: true }); }, 60);
    }
    function closeModal() {
        if (!openFormModal) return;
        openFormModal.classList.remove('is-open');
        openFormModal.setAttribute('aria-hidden', 'true');
        openFormModal = null;
        unlock();
        if (formReturn) formReturn.focus({ preventScroll: true });
    }
    document.addEventListener('click', (e) => {
        const opener = e.target.closest('[data-open-modal]');
        if (opener) { e.preventDefault(); openModal(opener.dataset.openModal); return; }
        if (openFormModal && e.target.closest('[data-close]') && openFormModal.contains(e.target)) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openFormModal) closeModal(); });

    $$('form.web3-form').forEach((f) => {
        const err = $('.form-error', f);
        const done = f.parentElement.querySelector('.form-done');
        const submit = $('button[type="submit"]', f);
        const clear = (e) => {
            const box = e.target.closest('.field, .q');
            if (box) box.classList.remove('is-invalid');
            if (!$('.is-invalid', f)) err.hidden = true;
        };
        f.addEventListener('input', clear);
        f.addEventListener('change', clear);

        f.addEventListener('submit', async (e) => {
            e.preventDefault();
            $$('.is-invalid', f).forEach((el) => el.classList.remove('is-invalid'));
            const bad = [];
            $$('input[required], select[required], textarea[required]', f).forEach((el) => {
                const v = el.value.trim();
                if (!v || (el.type === 'email' && !isEmail(v))) bad.push(el.closest('.field'));
            });
            $$('.q[data-required="group"]', f).forEach((q) => { if (!$$('input', q).some((i) => i.checked)) bad.push(q); });
            if (bad.length) {
                bad.forEach((b) => b.classList.add('is-invalid'));
                err.textContent = 'Please fill in the highlighted fields.';
                err.hidden = false;
                const first = $('input, select, textarea', bad[0]);
                if (first) first.focus();
                return;
            }
            if (f.botcheck && f.botcheck.checked) return;

            const data = {};
            $$('input, select, textarea', f).forEach((el) => {
                if (!el.name || el.name === 'botcheck') return;
                if (el.type === 'checkbox' || el.type === 'radio') {
                    if (el.checked) data[el.name] = data[el.name] ? data[el.name] + ', ' + el.value : el.value;
                } else if (el.value.trim()) data[el.name] = el.value.trim();
            });
            const subject = (f.dataset.subject || 'New message from {name}').replace('{name}', data.name || 'website visitor');

            setLoading(submit, true);
            try {
                await sendToWeb3Forms(Object.assign({ subject, from_name: f.dataset.from || 'Portfolio', replyto: data.email }, data));
                track(f.dataset.track || 'form-submitted');
                f.reset();
                f.hidden = true;
                if (done) {
                    done.hidden = false;
                    done.focus({ preventScroll: true });
                    const auto = $('[data-autodownload]', done);
                    if (auto) setTimeout(() => auto.click(), 400);
                }
            } catch (ex) {
                err.textContent = 'Sorry, that didn\'t go through (' + ex.message + '). Please try again in a moment.';
                err.hidden = false;
            } finally {
                setLoading(submit, false);
            }
        });
    });
})();
