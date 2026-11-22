/* =========================================================================
   M-Pesa prompt (STK Push), shared by every page that takes payments:
   the exam pass and Quote Pro (pro.js), training seat deposits (below) and
   project payments (tracker.js). The client types their number, gets the
   M-Pesa PIN prompt on their phone, and this waits for Safaricom's answer
   from the Google Sheet script. Off until payments.stkPush is true in config.js.
   ========================================================================= */
(function () {
    'use strict';
    const CFG = window.SITE_CONFIG || {};
    const PAY = CFG.payments || {};
    const t = (s) => (window.I18N ? window.I18N.t(s) : s);
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ERR = {
        'not-set-up': 'Paying by M-Pesa prompt is not available right now. Please pay the till directly and enter the code.',
        phone: 'Enter a Safaricom number, like 0712 345 678.',
        busy: 'Too many attempts. Please wait a few minutes and try again.',
        invalid: 'Please check your details and try again.',
        ref: 'Your reference was not found yet. Wait a moment and try again, or pay the till directly.'
    };

    // 0712 345 678 / +254712345678 / 712345678 -> 254712345678, or '' if not a Safaricom number
    function normalize(v) {
        const d = String(v || '').replace(/\D/g, '');
        if (/^254[17]\d{8}$/.test(d)) return d;
        if (/^0[17]\d{8}$/.test(d)) return '254' + d.slice(1);
        if (/^[17]\d{8}$/.test(d)) return '254' + d;
        return '';
    }

    async function call(api, params) {
        const url = api + (api.indexOf('?') > -1 ? '&' : '?') + new URLSearchParams(params).toString();
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 45000) : 0;
        try { return await (await fetch(url, ctrl ? { signal: ctrl.signal } : {})).json(); } finally { clearTimeout(timer); }
    }

    let styled = false;
    function style() {
        if (styled) return;
        styled = true;
        const css = document.createElement('style');
        css.textContent =
            '.mp-panel{text-align:center;padding:14px 6px}' +
            '.mp-phone{width:46px;height:76px;margin:4px auto 12px;border:3px solid currentColor;border-radius:10px;display:grid;place-items:center}' +
            '.mp-phone span{width:20px;height:20px;border-radius:50%;background:#2e9b34;animation:mp-ping 1.4s ease-out infinite}' +
            '@keyframes mp-ping{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.6);opacity:0}}' +
            '.mp-panel h3{margin:0 0 6px}.mp-panel p{margin:6px 0}' +
            '.mp-wait{display:inline-flex;align-items:center;gap:8px;font-size:.9em;opacity:.85}' +
            '.mp-spin{width:16px;height:16px;border:3px solid rgba(46,155,52,.25);border-top-color:#2e9b34;border-radius:50%;animation:mp-spin 1s linear infinite}' +
            '@keyframes mp-spin{to{transform:rotate(360deg)}}' +
            '.mp-cancel{background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;font-size:.85em;opacity:.75;margin-top:6px}' +
            '.btn-mpesa{background:#2e9b34!important;color:#fff!important;border-color:#2e9b34!important}' +
            '.mp-tag{display:inline-block;background:#fff;color:#2e9b34;font-weight:900;border-radius:5px;padding:1px 6px;font-size:.8em;margin-right:6px;letter-spacing:.02em}' +
            '.mp-alt{margin-top:12px}.mp-alt summary{cursor:pointer;font-weight:600;font-size:.92em;opacity:.85}.mp-alt[open] summary{margin-bottom:10px}';
        document.head.appendChild(css);
    }

    /* Send the prompt and wait. opts: { api, params, panel (element to show progress in), amount,
       onPaid(result), onStop(message) }. onStop runs when it fails or the client gives up. */
    function pay(opts) {
        style();
        const panel = opts.panel;
        let stopped = false, timer = 0;
        const stop = (msg) => { if (stopped) return; stopped = true; clearTimeout(timer); opts.onStop(msg || ''); };
        panel.hidden = false;
        panel.innerHTML = '<div class="mp-panel"><p class="mp-wait"><span class="mp-spin" aria-hidden="true"></span> ' + esc(t('Sending the M-Pesa prompt to your phone…')) + '</p></div>';
        call(opts.api, Object.assign({ action: 'mpesa-pay' }, opts.params)).then((r) => {
            if (stopped) return;
            if (!r || !r.ok) { stop(r && r.message ? r.message : t(ERR[r && r.error] || 'M-Pesa could not send the prompt. Please try again.')); return; }
            panel.innerHTML = '<div class="mp-panel" role="status"><div class="mp-phone" aria-hidden="true"><span></span></div>' +
                '<h3>' + esc(t('Check your phone')) + '</h3>' +
                '<p>' + esc(t('Enter your M-Pesa PIN in the prompt to pay')) + ' <strong data-no-i18n>KES ' + Number(r.amount || opts.amount || 0).toLocaleString('en-US') + '</strong>' +
                (PAY.mpesaName ? ' ' + esc(t('to')) + ' <strong data-no-i18n>' + esc(PAY.mpesaName) + '</strong>' : '') + '.</p>' +
                '<p class="mp-wait"><span class="mp-spin" aria-hidden="true"></span> ' + esc(t('Waiting for M-Pesa… this updates by itself.')) + '</p><br>' +
                '<button type="button" class="mp-cancel">' + esc(t("Didn't get the prompt? Go back")) + '</button></div>';
            panel.querySelector('.mp-cancel').addEventListener('click', () => stop(''));
            const started = Date.now();
            const poll = () => {
                if (stopped) return;
                call(opts.api, { action: 'mpesa-status', id: r.id, token: r.token }).then((s) => {
                    if (stopped) return;
                    if (s && s.ok && (s.status === 'paid' || s.status === 'check')) { stopped = true; opts.onPaid(s); return; }
                    if (s && s.ok && s.status === 'failed') { stop(t(s.message || 'The payment did not go through.') + ' ' + t('You can try again.')); return; }
                    if (Date.now() - started > 4 * 60000) { stop(t('No answer from M-Pesa. If money left your account, message me on WhatsApp with the M-Pesa SMS.')); return; }
                    timer = setTimeout(poll, 3000);
                }).catch(() => { if (!stopped) timer = setTimeout(poll, 4000); });
            };
            timer = setTimeout(poll, 4000);
        }).catch(() => stop(t('Could not reach the payment service. Check your internet connection and try again.')));
        return { cancel: () => stop('') };
    }

    window.NexusMpesa = {
        enabled: () => !!(PAY.stkPush && (CFG.reviewsApi || CFG.trackerApi)),
        normalize, pay, style,
        button: (amount) => '<span class="mp-tag" aria-hidden="true">M-PESA</span>' + esc(t('Pay')) + ' <span data-no-i18n>KES ' + Number(amount || 0).toLocaleString('en-US') + '</span>'
    };
})();

/* =========================================================================
   Shared behaviour for the project and CAD Tips pages:
   header, theme, menu, email links, gallery + image viewer, offline app.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    /* ---------- Header + progress bar ---------- */
    const header = $('#site-header');
    const progress = $('#scroll-progress');
    let ticking = false;
    function onScroll() {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle('is-scrolled', y > 10);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* ---------- Light / dark theme ---------- */
    const themeBtn = $('#theme-toggle');
    const themeMeta = $('meta[name="theme-color"]');
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        if (themeMeta) themeMeta.content = t === 'dark' ? '#0a1128' : '#0e1a3a';
    }
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    themeBtn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    });

    /* ---------- Mobile menu ---------- */
    const menuBtn = $('#menu-toggle');
    const nav = $('#site-nav');
    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        header.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    window.addEventListener('resize', () => { if (window.innerWidth > 1280) setMenu(false); });

    /* ---------- Footer year + email links (address assembled on click) ---------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
    $$('.js-email').forEach((link) => link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'mailto:' + link.dataset.user + '@' + link.dataset.domain + '?subject=' + encodeURIComponent('Project enquiry via your portfolio');
    }));

    /* ---------- Buttons that need a file: only shown once it exists ---------- */
    $$('[data-if-exists]').forEach((el) => {
        fetch(el.getAttribute('href'), { method: 'HEAD', cache: 'no-store' })
            .then((r) => { if (r.ok && !/text\/html/.test(r.headers.get('content-type') || '')) el.hidden = false; })
            .catch(() => {});
    });

    /* ---------- Project gallery: hide images that aren't uploaded yet ---------- */
    const gallery = $('[data-gallery]');
    const lb = $('#lightbox');
    if (gallery) {
        const grid = $('.case-gallery', gallery);
        const shots = $$('.case-shot', grid);
        let pending = shots.length;
        const done = () => {
            if (--pending > 0) return;
            const ok = $$('.case-shot', grid);
            if (!ok.length) return;
            ok.forEach((b, i) => { b.dataset.i = i; });
            grid.hidden = false;
            grid.classList.toggle('is-single', ok.length === 1);
            $('[data-cover]', gallery).hidden = true;
        };
        // A quick HEAD check per photo, so photos further down still load lazily as people scroll
        shots.forEach((b) => {
            const img = $('img', b);
            const fail = () => { b.remove(); done(); };
            fetch(img.getAttribute('src'), { method: 'HEAD' })
                .then((r) => { if (r.ok && /^image\//.test(r.headers.get('content-type') || 'image/')) done(); else fail(); })
                .catch(() => {
                    // HEAD not available (e.g. offline): fall back to loading the image itself
                    if (img.complete) { img.naturalWidth ? done() : fail(); return; }
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', fail, { once: true });
                    img.loading = 'eager';
                });
        });

        grid.addEventListener('click', (e) => {
            const b = e.target.closest('.case-shot');
            if (b) openLightbox($$('.case-shot', grid).map((s) => s.dataset.full || $('img', s).src), +b.dataset.i, gallery.dataset.title, b);
        });
    }

    /* ---------- 3D model ("View in 3D", shown once the .glb file exists) ---------- */
    $$('[data-model]').forEach((btn) => {
        fetch(btn.dataset.model, { method: 'HEAD' }).then((r) => { if (r.ok) btn.hidden = false; }).catch(() => {});
        btn.addEventListener('click', () => {
            const media = gallery || $('.case-media');
            if (!media) return;
            media.classList.add('has-3d');
            media.innerHTML = '<div class="pm-3d-loading"><span class="spinner"></span> ' + tr('Loading 3D model…') + '</div>';
            const ready = customElements.get('model-viewer') ? Promise.resolve() : new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.type = 'module';
                s.src = btn.dataset.viewer || 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
                s.onload = () => customElements.whenDefined('model-viewer').then(resolve);
                s.onerror = reject;
                document.head.appendChild(s);
            });
            ready.then(() => {
                media.innerHTML = '<model-viewer src="' + btn.dataset.model + '" alt="' + tr('3D model of ') + (gallery ? gallery.dataset.title : '') + '" camera-controls auto-rotate shadow-intensity="1" exposure="1" touch-action="pan-y" interaction-prompt="auto" ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed">' +
                    '<button type="button" slot="ar-button" class="ar-btn"><svg aria-hidden="true"><use href="#i-cube"/></svg> ' + tr('View in your room') + '</button></model-viewer>' +
                    '<p class="pm-3d-hint">' + tr('Drag to rotate · Scroll or pinch to zoom') + '</p>';
                const mv = $('model-viewer', media), hint = $('.pm-3d-hint', media);
                mv.addEventListener('load', () => {
                    if (!mv.canActivateAR) hint.textContent = tr('Drag to rotate · Open on your phone to view it in your room');
                }, { once: true });
                media.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof window.track === 'function') window.track('model-3d-opened');
            }).catch(() => { media.innerHTML = '<div class="pm-3d-loading">' + tr('The 3D viewer couldn\'t load. Please check your connection.') + '</div>'; });
        });
    });

    /* ---------- Image viewer ---------- */
    let list = [], index = 0, returnTo = null;
    const lbImg = $('#lightbox-img');
    function show(i) {
        index = (i + list.length) % list.length;
        lbImg.classList.remove('is-loaded');
        lbImg.src = list[index];
        lbImg.alt = $('#lightbox-title').textContent + ', image ' + (index + 1);
        $('#lightbox-count').textContent = list.length > 1 ? (index + 1) + ' / ' + list.length : '';
    }
    function openLightbox(srcs, start, title, from) {
        list = srcs; returnTo = from || null;
        $('#lightbox-title').textContent = title || '';
        lb.classList.toggle('is-single', list.length < 2);
        show(start || 0);
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        $('#lightbox-close').focus({ preventScroll: true });
    }
    function closeLightbox() {
        if (!lb.classList.contains('is-open')) return;
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        if (returnTo) returnTo.focus({ preventScroll: true });
    }
    if (lb) {
        lbImg.addEventListener('load', () => lbImg.classList.add('is-loaded'));
        $('#lightbox-close').addEventListener('click', closeLightbox);
        $('#lightbox-prev').addEventListener('click', () => show(index - 1));
        $('#lightbox-next').addEventListener('click', () => show(index + 1));
        lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox-stage')) closeLightbox(); });
        let touchX = null;
        lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', (e) => {
            if (touchX === null || list.length < 2) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
            touchX = null;
        });
    }
    document.addEventListener('keydown', (e) => {
        if (lb && lb.classList.contains('is-open')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight' && list.length > 1) show(index + 1);
            else if (e.key === 'ArrowLeft' && list.length > 1) show(index - 1);
            return;
        }
        if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    /* ---------- Forms sent with Web3Forms (training seat requests) ---------- */
    const tr = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    $$('form[data-web3]').forEach((form) => {
        const err = $('.form-error', form);
        const done = form.parentElement.querySelector('.form-done');
        const submit = $('button[type="submit"]', form);
        const label = submit.textContent;
        const showError = (msg) => { err.textContent = tr(msg); err.hidden = false; };
        function check() {
            let bad = 0;
            $$('[required]', form).forEach((f) => {
                const ok = f.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()) : !!f.value.trim();
                f.closest('.field').classList.toggle('is-invalid', !ok);
                if (!ok) bad++;
            });
            if (bad) { showError('Please fill in the highlighted fields.'); $('.is-invalid input, .is-invalid select', form).focus(); }
            return !bad;
        }
        form.addEventListener('input', (e) => {
            const f = e.target.closest('.field');
            if (f) f.classList.remove('is-invalid');
            if (!$('.is-invalid', form)) err.hidden = true;
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            err.hidden = true;
            if (!check()) return;
            // Seat reservations get their reference here, so a deposit can be paid against it straight away
            const refField = form.querySelector('input[name="Reference"]');
            if (refField && !refField.value) {
                const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', d = new Date();
                refField.value = 'TRN-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
            }
            const data = Object.fromEntries(new FormData(form).entries());
            if (form.botcheck && form.botcheck.checked) return;
            delete data.botcheck;
            data.replyto = data.email;
            submit.disabled = true;
            submit.textContent = tr('Sending…');
            // Newsletter sign-ups go only to the Google Sheet (it emails you from Gmail); other forms also use Web3Forms
            const sheetOnly = form.classList.contains('newsletter-form') && form.dataset.sheet;
            (sheetOnly ? Promise.resolve({ ok: true, j: {} }) : fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data)
            })
                .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok && j.success !== false, j }))))
                .then(({ ok, j }) => {
                    if (!ok) throw new Error(j.message || 'error');
                    // Forms that also save to the Google Sheet (e.g. training seat reservations)
                    if (form.dataset.sheet && form.dataset.sheetAction) {
                        const fields = Object.assign({ action: form.dataset.sheetAction }, data);
                        ['access_key', 'subject', 'from_name', 'replyto', 'botcheck'].forEach((k) => { delete fields[k]; });
                        fetch(form.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(fields) }).catch(() => {});
                    }
                    // Newsletter sign-ups also go to the Subscribers tab of the Google Sheet
                    if (form.dataset.sheet && (/newsletter/i.test(data.List || '') || data['Webinar updates'] === 'Yes')) {
                        fetch(form.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'subscribe', email: data.email, name: data.name || '', source: 'Newsletter (' + location.pathname.split('/').filter(Boolean).slice(-2).join('/') + ')' }) }).catch(() => {});
                    }
                    form.hidden = true;
                    const refOut = done.querySelector('[data-seat-ref]');
                    if (refOut && refField) { refOut.textContent = refField.value; refOut.closest('.seat-ref').hidden = false; }
                    const dep = done.querySelector('.seat-deposit');
                    if (dep) {
                        const sel = form.querySelector('#tr-course');
                        const full = sel && sel.selectedOptions[0] && /waiting list/i.test(sel.selectedOptions[0].textContent);
                        dep.hidden = !!full;
                        dep.dataset.ref = refField ? refField.value : '';
                        dep.dataset.name = data.name || '';
                        dep.dataset.phone = data.phone || data.Phone || data.whatsapp || data.WhatsApp || '';
                        const ph = dep.querySelector('.seat-phone');
                        if (ph && !ph.value) ph.value = dep.dataset.phone;
                    }
                    done.hidden = false;
                    done.focus();
                    form.reset();   // the details are sent: clear them (a new reservation gets a new reference)
                    if (refField) refField.value = '';
                    if (typeof window.track === 'function') window.track('training-seat-request');
                })
                .catch(() => showError('Sorry, that didn\'t go through. Please try again or send it on WhatsApp.'))
                .finally(() => { submit.disabled = false; submit.textContent = label; });
        });
        const wa = $('[data-wa-form]', form);
        if (wa) wa.addEventListener('click', () => {
            const d = new FormData(form);
            const lines = ['Hi Edison, I would like to reserve a seat for CAD training.'];
            ['name', 'Course', 'Level', 'Format', 'Preferred schedule', 'Message', 'Discount code'].forEach((k) => {
                const v = (d.get(k) || '').toString().trim();
                if (v) lines.push((k === 'name' ? 'Name' : k) + ': ' + v);
            });
            window.open('https://wa.me/254708639473?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
        });
    });
    /* ---------- Free downloads: email in, download out (the sheet emails a copy and adds them to Subscribers) ---------- */
    $$('form[data-download]').forEach((form) => {
        const err = $('.form-error', form);
        const done = form.parentElement.querySelector('.dl-done');
        const email = $('input[type="email"]', form);
        form.addEventListener('input', () => { email.closest('.field').classList.remove('is-invalid'); err.hidden = true; });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.botcheck && form.botcheck.checked) return;
            const v = email.value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
                email.closest('.field').classList.add('is-invalid');
                err.textContent = tr('Please enter a valid email address.');
                err.hidden = false;
                email.focus();
                return;
            }
            const btn = $('button[type="submit"]', form);
            btn.disabled = true;
            fetch(form.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'download', item: form.dataset.download, email: v, source: location.pathname }) })
                .catch(() => { /* the download link still works */ })
                .finally(() => {
                    form.hidden = true;
                    form.reset();
                    done.hidden = false;
                    done.focus();
                    if (typeof window.track === 'function') window.track('download-' + form.dataset.download);
                });
        });
    });

    // "Reserve a seat" on a course card picks that course in the form
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-course]');
        const sel = document.getElementById('tr-course');
        if (b && sel) sel.value = b.dataset.course;
    });
    // Course syllabus: expand / collapse every session, and print the whole syllabus (all sessions open)
    const sylSessions = () => Array.from(document.querySelectorAll('.syl-session'));
    document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-syl-toggle]');
        if (t) {
            const open = !sylSessions().every((d) => d.open);
            sylSessions().forEach((d) => { d.open = open; });
            t.textContent = window.I18N ? window.I18N.t(open ? 'Collapse all' : 'Expand all') : (open ? 'Collapse all' : 'Expand all');
            return;
        }
        if (e.target.closest('[data-syl-print]')) window.print();
    });
    let sylWasOpen = null;
    window.addEventListener('beforeprint', () => { if (!sylSessions().length) return; if (!sylWasOpen) sylWasOpen = sylSessions().map((d) => d.open); sylSessions().forEach((d) => { d.open = true; }); });
    window.addEventListener('afterprint', () => { if (sylWasOpen) sylSessions().forEach((d, i) => { d.open = sylWasOpen[i]; }); sylWasOpen = null; });

    // Seat deposit: the M-Pesa code goes to the Payments tab of the sheet against the seat's reference
    document.querySelectorAll('.seat-deposit').forEach((dep) => {
        const form = dep.querySelector('.seat-code-form'), err = form.querySelector('.form-error'), input = form.querySelector('input');
        const t = (s) => (window.I18N ? window.I18N.t(s) : s);
        // Any amount: the suggested deposit, the full fee, or their own
        const amtEl = dep.querySelector('.seat-amount');
        const seatAmount = () => (amtEl ? Math.round(Number(amtEl.value) || 0) : Number(dep.dataset.deposit));
        const paintAmount = () => {
            const a = seatAmount();
            dep.querySelectorAll('.seat-amt-text').forEach((el) => { el.textContent = 'KES ' + (a > 0 ? a.toLocaleString('en-US') : '…'); });
            const b = dep.querySelector('.seat-stk .btn-mpesa');
            if (b && window.NexusMpesa) b.innerHTML = window.NexusMpesa.button(a > 0 ? a : 0);
            const chips = Array.from(dep.querySelectorAll('.amt-chip'));
            chips.forEach((c) => c.classList.toggle('is-on', c.dataset.amt ? Number(c.dataset.amt) === a : !chips.some((x) => x.dataset.amt && Number(x.dataset.amt) === a)));
        };
        const amountOk = (errEl) => {
            const a = seatAmount();
            if (a >= 1 && a <= 1000000) return true;
            errEl.textContent = t('Please enter the amount to pay.'); errEl.hidden = false; if (amtEl) amtEl.focus();
            return false;
        };
        if (amtEl) {
            amtEl.addEventListener('input', paintAmount);
            dep.querySelectorAll('.amt-chip').forEach((c) => c.addEventListener('click', () => { if (c.dataset.amt) amtEl.value = c.dataset.amt; else { amtEl.value = ''; amtEl.focus(); } paintAmount(); }));
        }
        // M-Pesa prompt: pay from the phone, no code to type. The till + code stay as "Paid the till directly?"
        const MP = window.NexusMpesa;
        if (MP && MP.enabled()) {
            MP.style();
            const box = document.createElement('div');
            box.className = 'seat-stk';
            box.innerHTML = '<label>' + t('Your M-Pesa number') + '</label>' +
                '<div class="seat-code-row"><input class="seat-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0712 345 678" aria-label="' + t('Your M-Pesa number') + '">' +
                '<button type="button" class="btn btn-mpesa">' + MP.button(dep.dataset.deposit) + '</button></div>' +
                '<p class="form-error" role="alert" hidden></p><p class="seat-stk-note">' + t('You will get an M-Pesa prompt on your phone. Enter your PIN and your seat is confirmed straight away.') + '</p>';
            const panel = document.createElement('div');
            panel.hidden = true;
            const alt = document.createElement('details');
            alt.className = 'mp-alt';
            alt.innerHTML = '<summary>' + t('Paid the till directly? Enter the M-Pesa code') + '</summary>';
            const steps = dep.querySelector('.seat-pay');
            dep.insertBefore(box, steps || form);
            box.after(panel);
            panel.after(alt);
            if (steps) alt.appendChild(steps);
            alt.appendChild(form);
            const phone = box.querySelector('.seat-phone'), perr = box.querySelector('.form-error');
            phone.addEventListener('input', () => { perr.hidden = true; });
            box.querySelector('button').addEventListener('click', () => {
                const num = MP.normalize(phone.value);
                if (!amountOk(perr)) return;
                if (!num) { perr.textContent = t('Enter a Safaricom number, like 0712 345 678.'); perr.hidden = false; phone.focus(); return; }
                const amt = seatAmount();
                box.hidden = true; alt.hidden = true;
                MP.pay({
                    api: dep.dataset.sheet, panel, amount: amt,
                    params: { for: 'payment', ref: dep.dataset.ref || '', amount: amt, payer: dep.dataset.name || '', phone: num },
                    onPaid: (r) => {
                        panel.hidden = true;
                        dep.querySelector('.seat-later').hidden = true;
                        const ok = dep.querySelector('.seat-paid');
                        ok.innerHTML = r.status === 'check' ? t('<strong>Payment received.</strong> I will confirm it and email your receipt.') :
                            '<strong>' + t('Payment received ✓') + '</strong> ' + t('Your seat is confirmed. The receipt is on its way to your email.') + (r.receipt ? ' <span data-no-i18n>(' + r.receipt + ')</span>' : '');
                        ok.hidden = false;
                        ok.focus();
                        if (typeof window.track === 'function') window.track('training-deposit-mpesa');
                    },
                    onStop: (msg) => {
                        panel.hidden = true; box.hidden = false; alt.hidden = false;
                        if (msg) { perr.textContent = msg; perr.hidden = false; }
                    }
                });
            });
        }
        paintAmount();
        input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); err.hidden = true; });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = input.value.trim();
            if (!/^[A-Z0-9]{10}$/.test(code)) { err.textContent = t('An M-Pesa code has 10 letters and numbers, e.g. SKL4ABCD12.'); err.hidden = false; input.focus(); return; }
            if (!amountOk(err)) return;
            form.querySelector('button').disabled = true;
            fetch(dep.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'payment', ref: dep.dataset.ref || '', code, amount: seatAmount(), payer: dep.dataset.name || '' }) })
                .catch(() => { /* recorded on WhatsApp instead if needed */ })
                .finally(() => {
                    form.hidden = true;
                    form.reset();
                    dep.querySelector('.seat-later').hidden = true;
                    const ok = dep.querySelector('.seat-paid');
                    ok.hidden = false;
                    ok.focus();
                    if (typeof window.track === 'function') window.track('training-deposit-code');
                });
        });
    });

    // "Get the syllabus as a PDF": the sheet emails the PDF and adds the person to Subscribers
    document.querySelectorAll('form.syl-form').forEach((form) => {
        const box = form.closest('.syl-get'), done = box.querySelector('.syl-done'), err = form.querySelector('.form-error');
        const email = form.querySelector('input[type="email"]');
        const t = (s) => (window.I18N ? window.I18N.t(s) : s);
        email.addEventListener('input', () => { err.hidden = true; });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.botcheck && form.botcheck.checked) return;
            const v = email.value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = t('Please enter a valid email address.'); err.hidden = false; email.focus(); return; }
            form.querySelector('button[type="submit"]').disabled = true;
            fetch(form.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'syllabus', id: form.dataset.id, course: form.dataset.course, email: v, name: form.name.value.trim() }) })
                .catch(() => { /* the direct download link still works */ })
                .finally(() => {
                    form.hidden = true;
                    form.reset();
                    box.querySelector('.syl-get-copy').hidden = true;
                    done.hidden = false;
                    done.focus();
                    if (typeof window.track === 'function') window.track('syllabus-' + form.dataset.id);
                });
        });
    });

    // Course pages on phones: a "Reserve a seat" bar once the top of the page has scrolled away,
    // hidden again near the reserve section and the footer so it never covers them
    (function () {
        const bar = document.querySelector('[data-course-bar]');
        if (!bar || !('IntersectionObserver' in window)) return;
        const hero = document.querySelector('.page-hero');
        const stops = [document.querySelector('.course-reserve-band'), document.querySelector('.site-footer')].filter(Boolean);
        let heroVisible = true;
        const near = new Set();
        const update = () => {
            const on = !heroVisible && !near.size;
            bar.classList.toggle('is-on', on);
            bar.setAttribute('aria-hidden', String(!on));
            bar.querySelector('a').tabIndex = on ? 0 : -1;
            document.body.classList.toggle('has-course-bar', on);
        };
        if (hero) new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; update(); }).observe(hero);
        const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target))); update(); });
        stops.forEach((el) => io.observe(el));
    })();

    // ...and so does a link from a course page: training/?course=SolidWorks#reserve
    (function () {
        const want = new URLSearchParams(location.search).get('course');
        const sel = document.getElementById('tr-course');
        if (!want || !sel) return;
        const o = Array.from(sel.options).find((x) => x.value.toLowerCase() === want.toLowerCase());
        if (o) sel.value = o.value;
    })();

    /* ---------- Free CSWP cheat sheet: email in, PDF out (the sheet's "subscribe" action, source lead-magnet-cswp) ---------- */
    $$('form[data-lead]').forEach((form) => {
        const err = $('.form-error', form), done = form.parentElement.querySelector('.lead-done'), email = $('input[type="email"]', form);
        form.addEventListener('input', () => { email.closest('.field').classList.remove('is-invalid'); err.hidden = true; });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.botcheck && form.botcheck.checked) return;
            const v = email.value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
                email.closest('.field').classList.add('is-invalid');
                err.textContent = tr('Please enter a valid email address.');
                err.hidden = false;
                email.focus();
                return;
            }
            const btn = $('button[type="submit"]', form);
            btn.disabled = true;
            fetch(form.dataset.sheet, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'subscribe', email: v, source: form.dataset.lead }) })
                .catch(() => { /* the download still works */ })
                .finally(() => {
                    form.hidden = true;
                    form.reset();
                    btn.disabled = false;
                    done.hidden = false;
                    done.focus();
                    // Start the download straight away (the buttons in the message stay as a fallback)
                    const a = document.createElement('a');
                    a.href = form.dataset.pdf; a.download = ''; a.hidden = true;
                    document.body.appendChild(a); a.click(); a.remove();
                    if (typeof window.track === 'function') window.track(form.dataset.lead);
                });
        });
    });

    /* ---------- Before / after slider (project pages): drag, tap or use the arrow keys ---------- */
    $$('[data-ba]').forEach((ba) => {
        const range = $('.ba-range', ba);
        const set = (v) => { v = Math.max(0, Math.min(100, v)); ba.style.setProperty('--pos', v + '%'); range.value = Math.round(v); };
        const at = (x) => { const r = ba.getBoundingClientRect(); set((x - r.left) / r.width * 100); };
        range.addEventListener('input', () => set(+range.value));
        range.addEventListener('focus', () => ba.classList.add('is-focus'));
        range.addEventListener('blur', () => ba.classList.remove('is-focus'));
        // Mouse and pen move it at once; a finger only once it moves sideways, so the page still scrolls
        let drag = null;
        ba.addEventListener('pointerdown', (e) => {
            if (e.button > 0) return;
            drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: e.pointerType !== 'touch' };
            if (drag.on) { ba.setPointerCapture(e.pointerId); at(e.clientX); ba.classList.add('is-drag'); e.preventDefault(); range.focus({ preventScroll: true }); }
        });
        ba.addEventListener('pointermove', (e) => {
            if (!drag || drag.id !== e.pointerId) return;
            if (!drag.on) {
                const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
                if (dx < 6 && dy < 6) return;
                if (dy > dx) { drag = null; return; }
                drag.on = true; ba.setPointerCapture(e.pointerId); ba.classList.add('is-drag');
            }
            at(e.clientX);
        });
        const end = (e) => {
            if (drag && !drag.on && e.type === 'pointerup') at(e.clientX);   // a tap moves the handle there
            if (drag && drag.on && typeof window.track === 'function' && !ba.dataset.used) { ba.dataset.used = '1'; window.track('before-after-used'); }
            drag = null; ba.classList.remove('is-drag');
        };
        ba.addEventListener('pointerup', end);
        ba.addEventListener('pointercancel', end);
    });

    /* ---------- Offline app ---------- */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));
    }
})();
