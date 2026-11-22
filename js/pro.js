/* =========================================================================
   Quote Pro: shared by the quote tools (/quote/ sheet metal, /steel/ gates
   and grills). One licence works on every tool.
     - Pro licence keys, checked against the Google Sheet ("Quote Pro" tab,
       see tools/google-sheet-script.gs) and remembered on the device
     - the "Go Pro" / "Enter key" window (M-Pesa payment form)
     - "Your business on the quote" form and logo
     - free plan: PDF quotes per day; quote numbers; printing the PDF
   Load after config.js and before the tool's own script.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (s, el) => (el || document).querySelector(s);
    const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
    const CONFIG = window.SITE_CONFIG || {};
    const PRO_CFG = Object.assign({ monthly: 500, yearly: 4500, freePdfsPerDay: 3 }, CONFIG.quotePro || {});
    const PAY = CONFIG.payments || {};
    const API = CONFIG.reviewsApi || '';
    const WHATSAPP = CONFIG.whatsapp || '254708639473';

    const store = {
        get(k, d) { try { const v = localStorage.getItem('nq-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem('nq-' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
        del(k) { try { localStorage.removeItem('nq-' + k); } catch (e) { /* private mode */ } }
    };
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : (d === undefined ? 0 : d); };
    const kes = (n) => 'KES ' + Math.round(n || 0).toLocaleString('en-US');
    const fmt = (n, dp) => (Math.round(n * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0)).toLocaleString('en-US', { maximumFractionDigits: dp || 0 });
    const today = () => new Date().toISOString().slice(0, 10);
    const fill = (form, data) => {
        if (!form || !data) return;
        Object.keys(data).forEach((k) => {
            const el = form.elements[k];
            if (!el || el.type === 'file') return;
            if (el.type === 'checkbox') el.checked = !!data[k]; else el.value = data[k];
        });
    };
    const read = (form) => {
        const o = {};
        if (!form) return o;
        Array.from(form.elements).forEach((el) => {
            if (!el.name || el.type === 'file' || el.name === 'botcheck' || (el.type === 'radio' && !el.checked)) return;
            o[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        });
        return o;
    };
    const track = (path) => { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, event: true }); };

    // Which paid product this page sells: Quote Pro (the quote tools) or the exam pass (/exams/).
    // Each has its own licence keys: a Quote Pro key does not open the exams, and the other way round.
    const EXAMS = document.body.dataset.product === 'exams';
    const EX_CFG = Object.assign({ price: 500, days: 30 }, CONFIG.exams || {});
    const PRODUCT = EXAMS ? 'the exam practice pass' : 'Quote Pro';
    const LIC = EXAMS ? 'pro-exams' : 'pro';

    const bizForm = $('#nq-biz');
    const modal = $('#pro-modal');
    const hooks = [];

    /* ---------- Licence ---------- */
    let deviceId = store.get('device', '');
    if (!deviceId) {
        deviceId = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
        store.set('device', deviceId);
    }
    let licence = store.get(LIC, null);   // { key, business, expires, plan, checked }
    const isPro = () => !!(licence && licence.expires && licence.expires >= today());

    async function checkKey(key) {
        if (!API) return { ok: false, error: 'offline-setup' };
        const url = API + (API.includes('?') ? '&' : '?') + 'action=pro&key=' + encodeURIComponent(key) + '&device=' + deviceId;
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : 0;
        try {
            const res = await fetch(url, ctrl ? { signal: ctrl.signal } : {});
            return await res.json();
        } finally { clearTimeout(timer); }
    }
    const keyError = (r) => ({
        unknown: 'That key was not found. Check it against your email (letters and numbers only, e.g. NQP-AB2C-DE3F-GH4J).',
        expired: 'This key ended on ' + (r.expires || 'its end date') + '. Renew it to keep using Pro (your key stays the same).',
        cancelled: 'This key has been switched off. Please message me on WhatsApp.',
        devices: 'This key is already used on ' + (r.max || 3) + ' devices. Message me on WhatsApp to move it to this one.',
        busy: 'Too many checks right now. Please try again in a few minutes.',
        'offline-setup': 'Licence checks are not set up on this site yet.'
    }[r && r.error] || 'Could not check the key. Please try again.');

    async function activate(key) {
        const raw = String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const k = raw.length === 15 ? raw.slice(0, 3) + '-' + raw.slice(3, 7) + '-' + raw.slice(7, 11) + '-' + raw.slice(11) : raw;
        const r = await checkKey(k);
        if (r && r.ok && EXAMS !== (r.plan === 'Exams')) {
            return { ok: false, message: EXAMS ? 'That is a Quote Pro key (for the quote tools). Exam practice needs its own pass.' : 'That key is for exam practice, not Quote Pro. It works on the exams page.' };
        }
        if (r && r.ok) {
            licence = { key: k, business: r.business || '', expires: r.expires, plan: r.plan || '', checked: today() };
            store.set(LIC, licence);
            if (r.business && bizForm && !bizForm.elements.bname.value) { bizForm.elements.bname.value = r.business; saveBiz(); }
            paintPlan();
            return { ok: true };
        }
        return { ok: false, message: keyError(r) };
    }

    // Re-check a remembered key every few days; an unreachable sheet keeps Pro on until it ends
    async function recheck() {
        if (!licence || !licence.key) return;
        const age = (Date.parse(today()) - Date.parse(licence.checked || '2000-01-01')) / 864e5;
        if (age < 3) return;
        try {
            const r = await checkKey(licence.key);
            if (r && r.ok) { licence = Object.assign(licence, { expires: r.expires, business: r.business || licence.business, checked: today() }); store.set(LIC, licence); }
            else if (r && /^(unknown|cancelled|expired)$/.test(r.error)) { licence.expires = r.expires && r.error === 'expired' ? r.expires : '0000-00-00'; licence.checked = today(); store.set(LIC, licence); }
            paintPlan();
        } catch (e) { /* offline: try another day */ }
    }

    /* ---------- Free plan: PDFs per day (shared by all the tools) ---------- */
    const usedToday = () => { const u = store.get('pdfs', {}); return u.d === today() ? u.n : 0; };
    function paintLeft() {
        const el = $('#qt-left');
        if (!el) return;
        const left = Math.max(0, PRO_CFG.freePdfsPerDay - usedToday());
        el.innerHTML = isPro() ? 'Pro: unlimited PDF quotes.' :
            left + ' of ' + PRO_CFG.freePdfsPerDay + ' free PDF quotes left today. <button type="button" class="nq-link" data-pro-open>Go Pro for unlimited</button>';
    }
    // True if a PDF may be made now (opens the Pro window if not)
    function pdfAllowed() {
        if (isPro() || usedToday() < PRO_CFG.freePdfsPerDay) return true;
        openPro('buy', 'You have used today\'s ' + PRO_CFG.freePdfsPerDay + ' free PDF quotes. Go Pro for unlimited quotes, or send this one on WhatsApp for free.');
        return false;
    }
    function countPdf() { if (!isPro()) store.set('pdfs', { d: today(), n: usedToday() + 1 }); paintLeft(); }

    /* ---------- Quote numbers (one sequence for every tool) ---------- */
    function nextNumber(commit) {
        const prefix = (isPro() && bizForm && String(bizForm.elements.bprefix.value || '').trim()) || 'Q';
        const year = new Date().getFullYear();
        const n = store.get('counter', { year, n: 0 });
        if (n.year !== year) { n.year = year; n.n = 0; }
        const no = prefix.toUpperCase() + '-' + year + '-' + String(n.n + 1).padStart(3, '0');
        if (commit) { n.n += 1; store.set('counter', n); }
        return no;
    }

    /* ---------- Business details and logo ---------- */
    let logo = store.get('logo', '');
    const biz = () => read(bizForm);
    const saveBiz = () => store.set('biz', biz());
    function paintLogo() {
        if (!$('#b-logo-row')) return;
        $('#b-logo-row').hidden = !logo;
        if (logo) $('#b-logo-img').src = logo;
    }
    if (bizForm) {
        fill(bizForm, store.get('biz', null));
        bizForm.addEventListener('submit', (e) => e.preventDefault());
        bizForm.addEventListener('input', saveBiz);
        $('#b-logo').addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (!file) return;
            if (!isPro()) { openPro('buy', 'Your logo on the quote is part of Pro.'); return; }
            const img = new Image(), url = URL.createObjectURL(file);
            img.onload = () => {
                // Shrink to at most 480 × 200 so it fits in the device's storage
                const s = Math.min(1, 480 / img.width, 200 / img.height);
                const cv = document.createElement('canvas');
                cv.width = Math.max(1, Math.round(img.width * s)); cv.height = Math.max(1, Math.round(img.height * s));
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                logo = cv.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9);
                URL.revokeObjectURL(url);
                if (!store.set('logo', logo)) alert('That logo is too large to save on this device. Try a smaller image.');
                paintLogo();
            };
            img.onerror = () => { URL.revokeObjectURL(url); alert('That file could not be read as an image.'); };
            img.src = url;
        });
        $('#b-logo-clear').addEventListener('click', () => { logo = ''; store.del('logo'); paintLogo(); });
    }

    /* ---------- The printed quote: shared top and bottom ---------- */
    const longDate = (x) => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    function docTop(o) {
        const b = biz(), pro = isPro();
        const date = new Date(), valid = new Date(date.getTime() + Math.max(1, num(o.validDays, 14)) * 864e5);
        const from = [b.bname, pro ? b.baddr : '', b.bphone, pro ? b.bemail : '', pro && b.bpin ? 'KRA PIN ' + b.bpin : ''].filter(Boolean);
        const c = o.cust || {};
        return '<header class="qd-head"><div>' + (pro && logo ? '<img class="qd-logo" src="' + esc(logo) + '" alt="">' : '') +
                '<div class="qd-from">' + (from.length ? '<strong>' + esc(from[0]) + '</strong>' + from.slice(1).map((x) => '<span>' + esc(x) + '</span>').join('') : '') + '</div></div>' +
                '<div class="qd-meta"><h1>QUOTATION</h1><dl><dt>Number</dt><dd>' + esc(o.no) + '</dd><dt>Date</dt><dd>' + longDate(date) + '</dd><dt>Valid until</dt><dd>' + longDate(valid) + '</dd></dl></div></header>' +
            (c.cname || c.cphone ? '<section class="qd-to"><span>Prepared for</span><strong>' + esc(c.cname || '') + '</strong>' + (c.cphone ? '<span>' + esc(c.cphone) + '</span>' : '') + '</section>' : '');
    }
    function docBottom(o) {
        const b = biz(), pro = isPro();
        return '<section class="qd-notes">' + (o.notes ? '<p>' + esc(o.notes) + '</p>' : '') + (pro && b.bpay ? '<p><strong>Payment:</strong> ' + esc(b.bpay) + '</p>' : '') +
                (pro && b.bterms ? '<p><strong>Terms:</strong> ' + esc(b.bterms) + '</p>' : '') +
                (o.small ? '<p class="qd-small">' + esc(o.small) + '</p>' : '') + '</section>' +
            (pro ? '' : '<footer class="qd-brand">Free quote made with the Nexus CAD Studio ' + esc(o.tool) + ' · edisonengineer.github.io/MY-PAST-PROJECTS/' + esc(o.path) + '</footer>');
    }
    // Show the quote alone and open the browser's print / Save as PDF window
    function printDoc(html, title) {
        const box = $('#nq-print');
        box.innerHTML = '<div class="qd">' + html + '</div>';
        document.body.classList.add('nq-printing');
        const old = document.title;
        document.title = title;
        const done = () => { document.body.classList.remove('nq-printing'); document.title = old; window.removeEventListener('afterprint', done); };
        window.addEventListener('afterprint', done);
        setTimeout(() => { window.print(); setTimeout(done, 1000); }, 60);   // the timeout covers browsers without afterprint
    }
    // WhatsApp link to the customer's number (07… or 01… becomes 2547… / 2541…)
    function waLink(phone, text) {
        const p = String(phone || '').replace(/\D/g, '').replace(/^0(?=[17])/, '254');
        return 'https://wa.me/' + (p.length >= 11 ? p : '') + '?text=' + encodeURIComponent(text);
    }

    /* ---------- Plan badge ---------- */
    function paintPlan() {
        const pro = isPro();
        const until = pro ? new Date(licence.expires + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        if ($('#nq-plan')) { $('#nq-plan').textContent = pro ? (EXAMS ? 'Exam pass' : 'Pro') + ' · until ' + until : 'Free plan'; $('#nq-plan').classList.toggle('is-pro', pro); }
        if ($('#nq-pro-btn')) $('#nq-pro-btn').textContent = pro ? 'Renew Pro' : 'Go Pro';
        if ($('#nq-lock')) $('#nq-lock').hidden = pro;
        if ($('#nq-pro-fields')) $('#nq-pro-fields').classList.toggle('is-locked', !pro);
        $$('#nq-pro-fields input:not([type=file])').forEach((el) => { el.readOnly = !pro; });
        document.body.classList.toggle('nq-is-pro', pro);
        paintLeft();
        hooks.forEach((fn) => fn(pro));
    }

    /* ---------- The Pro window ---------- */
    let lastFocus = null;
    function openPro(pane, note) {
        if (!modal) return;
        lastFocus = document.activeElement;
        $$('[data-pane]', modal).forEach((p) => { p.hidden = p.dataset.pane !== pane; });
        const err = $(pane === 'key' ? '#key-error' : '#pro-error');
        err.hidden = !note; err.textContent = note || '';
        if (pane === 'buy') {
            $('#pro-form').hidden = false; $('#pro-done').hidden = true; $$('#pro-form + div', modal).forEach((d) => { if (!d.id) d.hidden = true; });
            const b = biz();
            if (!$('#pf-biz').value) $('#pf-biz').value = b.bname || (licence && licence.business) || '';
            if (!$('#pf-email').value) $('#pf-email').value = b.bemail || '';
            if (!$('#pf-phone').value) $('#pf-phone').value = b.bphone || '';
            if ($('#pf-ref') && !$('#pf-ref').value) $('#pf-ref').value = store.get('from', '');
        } else if (licence && licence.key) {
            $('#kf-key').value = licence.key;
            const ks = $('#key-status');
            ks.hidden = false;
            ks.innerHTML = isPro() ? 'Pro is on for <strong>' + esc(licence.business || 'this device') + '</strong> until ' + esc(licence.expires) + '.' : 'Your key ended on ' + esc(licence.expires) + '. Renew to turn Pro back on.';
        }
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';
        setTimeout(() => { const f = $('[data-pane]:not([hidden]) input:not([type=hidden]):not([type=radio]):not(.hp)', modal); if (f) f.focus(); }, 60);
    }
    function closePro() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (modal) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-pro-open]')) { e.preventDefault(); openPro('buy'); }
            else if (e.target.closest('[data-key-open]')) { e.preventDefault(); openPro('key'); }
            else if (e.target.closest('#pro-modal [data-close]')) closePro();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closePro(); });

        // Prices and payment details from the site settings
        const planOf = () => (EXAMS ? 'Exams' : $('input[name=plan]:checked', modal).value);
        const planAmount = () => (EXAMS ? EX_CFG.price : planOf() === 'Yearly' ? PRO_CFG.yearly : PRO_CFG.monthly);
        $$('[data-price=exams]').forEach((el) => { el.textContent = kes(EX_CFG.price); });
        $$('[data-exam-days]').forEach((el) => { el.textContent = EX_CFG.days; });
        $$('[data-price=monthly]').forEach((el) => { el.textContent = kes(PRO_CFG.monthly); });
        $$('[data-price=yearly]').forEach((el) => { el.textContent = kes(PRO_CFG.yearly); });
        $$('[data-save]').forEach((el) => { el.textContent = Math.max(0, Math.round((1 - PRO_CFG.yearly / (PRO_CFG.monthly * 12)) * 100)); });
        $$('[data-free-pdfs]').forEach((el) => { el.textContent = PRO_CFG.freePdfsPerDay; });
        if (PAY.mpesaTill) $$('[data-till]').forEach((el) => { el.textContent = PAY.mpesaTill; });
        if (PAY.mpesaName) $$('[data-till-name]').forEach((el) => { el.textContent = PAY.mpesaName; });
        const paintAmount = () => { $('#pro-amount').textContent = kes(planAmount()); };
        $$('input[name=plan]', modal).forEach((r) => r.addEventListener('change', paintAmount));
        paintAmount();
        $('#pro-wa').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hi Edison, I have a question about ' + (EXAMS ? 'the SolidWorks exam practice.' : 'Quote Pro (the fabrication quote tools).'));

        // M-Pesa prompt (when payments.stkPush is on): pay from the phone and Pro turns on by itself.
        // Paying the till by hand and typing the code still works, under "Paid the till directly?".
        let stkOn = false;
        const stkPanel = document.createElement('div');
        stkPanel.hidden = true;
        function paintPayBtn() {
            if (!stkOn) return;
            const btn = $('#pro-form button[type=submit]'), manual = !!$('#pf-code').value.trim();
            btn.classList.toggle('btn-mpesa', !manual);
            btn.innerHTML = manual ? 'I have paid: send my key' : window.NexusMpesa.button(planAmount());
        }
        document.addEventListener('DOMContentLoaded', () => {   // pages.js (which has the M-Pesa helper) loads after this file
            const MP = window.NexusMpesa;
            if (!MP || !MP.enabled()) return;
            stkOn = true;
            MP.style();
            const form = $('#pro-form'), steps = $('.pay-steps', modal), code = $('#pf-code');
            code.required = false;
            const phone = $('#pf-phone');
            phone.required = true;
            phone.placeholder = '0712 345 678';
            $('label[for=pf-phone]').textContent = 'M-Pesa number (the prompt is sent here)';
            const alt = document.createElement('details');
            alt.className = 'mp-alt';
            alt.innerHTML = '<summary>Paid the till directly instead? Enter the M-Pesa code</summary>';
            if (steps) alt.appendChild(steps);
            alt.appendChild(code.closest('.field'));
            form.insertBefore(alt, $('#pro-error'));
            const note = document.createElement('p');
            note.className = 'form-intro';
            note.textContent = 'Pay with M-Pesa: you get a prompt on your phone, enter your PIN, and ' + (EXAMS ? 'your pass' : 'Pro') + ' turns on straight away.';
            // Under the intro (exam pass) or the plan choice (Quote Pro, which has no intro)
            ($('[data-pane=buy] .form-intro', modal) || $('[data-pane=buy] .nq-plan-pick', modal) || $('[data-pane=buy] h2', modal)).after(note);
            form.after(stkPanel);
            code.addEventListener('input', paintPayBtn);
            $$('input[name=plan]', modal).forEach((r) => r.addEventListener('change', paintPayBtn));
            paintPayBtn();
        });

        $('#pro-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = e.target, err = $('#pro-error');
            const data = { business: f.business.value.trim(), code: f.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''), email: f.email.value.trim(), phone: f.phone.value.trim(), ref: f.ref ? f.ref.value.trim() : '' };
            if (stkOn && !data.code) {
                const MP = window.NexusMpesa, phone = MP.normalize(data.phone);
                const bad = !data.business ? (EXAMS ? 'Enter your name.' : 'Enter your business name.') :
                    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email) ? 'Enter the email address your key should go to.' :
                    !phone ? 'Enter your M-Pesa number, like 0712 345 678.' : '';
                err.hidden = !bad; err.textContent = bad;
                if (bad || f.botcheck.checked) return;
                f.hidden = true;
                MP.pay({
                    api: API, panel: stkPanel, amount: planAmount(),
                    params: { for: 'pro', plan: planOf(), business: data.business, email: data.email, phone, ref: data.ref, renew: licence && licence.key ? licence.key : '' },
                    onPaid: async (r) => {
                        stkPanel.hidden = true;
                        let msg;
                        if (r.key) {
                            let a = { ok: false };
                            try { a = await activate(r.key); } catch (x) { /* shown below */ }
                            msg = a.ok ? 'Payment received ✓ ' + (EXAMS ? 'Your exam pass' : 'Quote Pro') + ' is on until ' + licence.expires + '. Your key ' + r.key + ' was also emailed to you, for your other devices.' :
                                'Payment received ✓ Your key is ' + r.key + ' (also emailed). Choose "I already have a key" to turn it on.';
                        } else {
                            msg = r.status === 'check' ? 'Payment received. Edison will confirm it and email your key shortly.' : 'Payment received ✓ Your key is on its way to your email.';
                        }
                        $('#pro-done span').textContent = msg;
                        $('#pro-done').hidden = false;
                        $('#pro-done').focus();
                        track('quote-pro-mpesa');
                    },
                    onStop: (msg) => {
                        stkPanel.hidden = true;
                        f.hidden = false;
                        if (msg) { err.textContent = msg; err.hidden = false; }
                    }
                });
                return;
            }
            const bad = !data.business ? (EXAMS ? 'Enter your name.' : 'Enter your business name.') : !/^[A-Z0-9]{8,12}$/.test(data.code) ? 'Enter the M-Pesa code from your confirmation SMS (10 letters and numbers).' :
                !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email) ? 'Enter the email address your key should go to.' : '';
            err.hidden = !bad; err.textContent = bad;
            if (bad || f.botcheck.checked) return;
            const plan = planOf();
            const btn = $('button[type=submit]', f);
            btn.disabled = true;
            const fields = Object.assign({ action: 'pro', plan, amount: planAmount(), renew: licence && licence.key ? licence.key : '' }, data);
            let sent = false;
            if (API) {
                try { await fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(fields) }); sent = true; } catch (x) { sent = false; }
            }
            btn.disabled = false;
            if (!sent) {
                // No sheet (or offline): send the details on WhatsApp instead
                window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hi Edison, I have paid ' + kes(planAmount()) + ' for ' + PRODUCT + ' (' + plan + ').\n' + (EXAMS ? 'Name: ' : 'Business: ') + data.business + '\nM-Pesa code: ' + data.code + '\nEmail: ' + data.email + (fields.renew ? '\nRenewing key: ' + fields.renew : '') + (data.ref ? '\nTold about it by: ' + data.ref : '')), '_blank', 'noopener');
            }
            f.hidden = true;
            $('#pro-done').hidden = false;
            $('#pro-done').focus();
            track('quote-pro-paid');
        });

        $('#key-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = $('#key-error'), btn = $('button[type=submit]', e.target);
            const key = e.target.key.value;
            if (String(key).replace(/[^A-Z0-9]/gi, '').length !== 15) { err.hidden = false; err.textContent = 'A licence key looks like NQP-AB2C-DE3F-GH4J.'; return; }
            btn.disabled = true; btn.textContent = 'Checking…';
            let r;
            try { r = await activate(key); } catch (x) { r = { ok: false, message: 'Could not reach the licence check. Check your internet connection and try again.' }; }
            btn.disabled = false; btn.textContent = 'Turn on Pro';
            if (r.ok) { closePro(); return; }
            err.hidden = false; err.textContent = r.message;
        });
    }

    /* ---------- Word of mouth: "Share on WhatsApp" with the sharer's business name ---------- */
    document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-share-tool]')) return;
        const btn = e.target.closest('[data-share-tool]');
        const name = biz().bname || (licence && licence.business) || '';
        const url = location.origin + location.pathname + (name ? '?from=' + encodeURIComponent(name) : '');
        const what = /steel/.test(location.pathname) ? 'steel gates, grills and railings (cut list and steel to buy)' : 'sheet-metal parts (flat blank, cutting and bending)';
        const text = btn.dataset.shareText ? btn.dataset.shareText + '\n' + url : 'Free tool for pricing ' + what + ' and sending the quote on WhatsApp or PDF:\n' + url +
            '\n\nTool ya bure ya kupiga bei ya kazi za chuma na kutuma quote kwa mteja.';
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
        track('quote-share');
    });

    window.NexusPro = {
        $, $$, store, esc, num, kes, fmt, today, fill, read, track, cfg: PRO_CFG,
        isPro, openPro, biz, nextNumber, pdfAllowed, countPdf, docTop, docBottom, printDoc, waLink,
        activate, product: EXAMS ? 'exams' : 'quote',   // js/account.js turns on a pass the account owns
        onPlan(fn) { hooks.push(fn); fn(isPro()); },
        // Run once the tool has drawn itself: plan badge, logo, and a key from an email link
        start() {
            paintLogo();
            paintPlan();
            const params = new URLSearchParams(location.search);
            const from = String(params.get('from') || '').trim().slice(0, 80);
            if (from && !store.get('from', '')) store.set('from', from);
            if (from && !params.get('key')) history.replaceState(null, '', location.pathname + location.hash);
            if (params.get('key')) {
                const k = params.get('key');
                history.replaceState(null, '', location.pathname + location.hash);
                if (modal) $('#kf-key').value = k;
                activate(k).then((r) => { if (!r.ok) openPro('key', r.message); else openPro('key'); }).catch(() => openPro('key', 'Could not reach the licence check. Try again in a moment.'));
            } else if (params.get('renew')) openPro('buy');
            else recheck();
        }
    };
})();
