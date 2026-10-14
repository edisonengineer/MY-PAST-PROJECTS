/* =========================================================================
   Deposit payments, webinar countdown + recordings, certificates gallery,
   and installable-app (PWA) support.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
    const CONFIG = window.SITE_CONFIG || {};
    const WHATSAPP = CONFIG.whatsapp || '254708639473';
    const track = (name) => { if (typeof window.track === 'function') window.track(name); };

    /* ======================================================================
       DEPOSIT PAYMENTS (M-Pesa Till / Paybill, optional Paystack)
       ====================================================================== */
    const pay = CONFIG.payments || {};
    const till = String(pay.mpesaTill || '').trim();
    const paybill = String(pay.mpesaPaybill || '').trim();
    const paystack = String(pay.paystackUrl || '').trim();
    if ((till || paybill || paystack) && $('#pay-modal')) {
        $$('[data-payment]').forEach((el) => { el.hidden = false; });
        $$('[data-till-number]').forEach((el) => { el.textContent = till; if (!till) el.closest('[data-payment]').hidden = true; });
        const name = pay.mpesaName || 'Nexus CAD Studio';
        let steps, number;
        if (till) {
            steps = ['Open <strong>M-PESA</strong> on your phone', 'Select <strong>Lipa na M-PESA</strong>', 'Choose <strong>Buy Goods and Services</strong>',
                'Enter Till Number <strong>' + esc(till) + '</strong>', 'Enter the deposit amount from your quote', 'Enter your PIN and confirm. The name shown is <strong>' + esc(name) + '</strong>'];
            number = '<span>Till number</span><strong>' + esc(till) + '</strong>';
        } else if (paybill) {
            const acc = pay.mpesaAccount ? '<strong>' + esc(pay.mpesaAccount) + '</strong>' : 'your <strong>full name</strong>';
            steps = ['Open <strong>M-PESA</strong> on your phone', 'Select <strong>Lipa na M-PESA</strong>', 'Choose <strong>Pay Bill</strong>',
                'Enter Business Number <strong>' + esc(paybill) + '</strong>', 'Enter Account Number: ' + acc, 'Enter the deposit amount from your quote, then your PIN'];
            number = '<span>Paybill</span><strong>' + esc(paybill) + '</strong>' + (pay.mpesaAccount ? '<span>Account</span><strong>' + esc(pay.mpesaAccount) + '</strong>' : '');
        }
        if (steps) {
            $('#mpesa-steps').innerHTML = steps.map((s) => '<li><span>' + s + '</span></li>').join('');
            $('#mpesa-number').innerHTML = number;
        }
        const qr = $('#mpesa-qr');
        if (till && pay.mpesaQr && qr && window.Site && window.Site.fileExists) {
            window.Site.fileExists(pay.mpesaQr).then((ok) => { if (!ok) return; $('img', qr).src = pay.mpesaQr; qr.hidden = false; });
        }
        const tabs = $$('[data-pay-tab]');
        const panes = $$('[data-pay-pane]');
        const show = (id) => {
            tabs.forEach((t) => { const on = t.dataset.payTab === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
            panes.forEach((p) => { p.hidden = p.dataset.payPane !== id; });
        };
        if (!steps) { tabs[0].hidden = true; show('card'); }
        if (!paystack) tabs[1].hidden = true; else $('#paystack-link').href = paystack;
        if (!steps || !paystack) $('#pay-tabs').classList.add('is-single');
        tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.payTab)));
        $('#pay-wa').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hi Edison, I have paid my project deposit. My name is ... and the M-Pesa confirmation code is ...');
        $('#pay-wa').addEventListener('click', () => track('payment-confirmation'));
        document.addEventListener('click', (e) => { if (e.target.closest('[data-open-modal="pay-modal"]')) track('payment-opened'); });
        // Links to index.html#pay open the payment window
        if (location.hash === '#pay') window.addEventListener('load', () => { const l = $('[data-open-modal="pay-modal"]'); if (l) l.click(); });
    }

    /* ======================================================================
       WEBINAR: countdown to the next weekly session + past recordings
       ====================================================================== */
    const W = CONFIG.webinar || {};
    const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIdx = DAYS.indexOf(String(W.day || '').toLowerCase());
    const tm = /^(\d{1,2}):(\d{2})$/.exec(String(W.time || '').trim());
    if (dayIdx > -1 && tm && $('#countdown')) {
        const EAT = 3; // Nairobi is UTC+3 all year
        const duration = (W.durationMinutes || 60) * 60000;
        function nextStart(now) {
            // Work in Nairobi wall-clock time, then convert back to a real instant
            const local = new Date(now.getTime() + EAT * 3600000);
            const start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), +tm[1], +tm[2]) - EAT * 3600000);
            let add = (dayIdx - local.getUTCDay() + 7) % 7;
            let s = new Date(start.getTime() + add * 86400000);
            if (s.getTime() + duration <= now.getTime()) s = new Date(s.getTime() + 7 * 86400000);
            return s;
        }
        const box = $('#countdown');
        box.hidden = false;
        const fmt = (d) => d.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' }) + ' (Nairobi time)';
        const pad = (n) => String(n).padStart(2, '0');
        let target = nextStart(new Date());
        function tick() {
            const now = new Date();
            if (now.getTime() >= target.getTime() + duration) target = nextStart(now);
            const diff = target.getTime() - now.getTime();
            const live = diff <= 0;
            $('#countdown-live').hidden = !live;
            $('.countdown-grid', box).hidden = live;
            $('#countdown-when').textContent = fmt(target);
            if (live) return;
            const s = Math.floor(diff / 1000);
            $('#cd-days').textContent = Math.floor(s / 86400);
            $('#cd-hours').textContent = pad(Math.floor((s % 86400) / 3600));
            $('#cd-mins').textContent = pad(Math.floor((s % 3600) / 60));
            $('#cd-secs').textContent = pad(s % 60);
        }
        tick();
        setInterval(tick, 1000);
    }

    const recs = (W.recordings || []).filter((r) => r && /^[\w-]{6,}$/.test(r.id || ''));
    if (recs.length && $('#recordings-grid')) {
        $('#webinar-recordings').hidden = false;
        $$('[data-recordings-link]').forEach((a) => { a.hidden = false; });
        $('#recordings-grid').innerHTML = recs.map((r) =>
            '<button type="button" class="recording" data-yt="' + esc(r.id) + '" aria-label="Play: ' + esc(r.title || 'Webinar recording') + '">' +
                '<span class="recording-thumb"><img src="https://i.ytimg.com/vi/' + esc(r.id) + '/hqdefault.jpg" alt="" loading="lazy"><span class="recording-play">' + icon('play') + '</span></span>' +
                '<span class="recording-title">' + esc(r.title || 'Webinar recording') + '</span>' +
            '</button>').join('');
        // Load the YouTube player only when a video is clicked (keeps the page fast)
        $('#recordings-grid').addEventListener('click', (e) => {
            const b = e.target.closest('[data-yt]');
            if (!b) return;
            const thumb = $('.recording-thumb', b);
            thumb.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(b.dataset.yt) + '?autoplay=1&rel=0" title="' + esc(b.getAttribute('aria-label')) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
            b.removeAttribute('data-yt');
            track('webinar-recording-played');
        });
    }

    /* ======================================================================
       CERTIFICATES GALLERY
       ====================================================================== */
    const certGrid = $('#certs-grid');
    const certs = Array.isArray(window.CERTIFICATES) ? window.CERTIFICATES : [];
    if (certGrid && certs.length) {
        certGrid.innerHTML = certs.map((c, i) =>
            '<article class="cert-card">' +
                '<span class="cert-icon bg-' + esc(c.tone || 'blue') + '">' + icon(c.icon || 'award') + '</span>' +
                '<div class="cert-body"><h4>' + esc(c.title) + '</h4><p>' + esc(c.issuer || '') + '</p>' +
                '<div class="cert-actions" data-cert="' + i + '"></div></div>' +
            '</article>').join('');
        const exists = (window.Site && window.Site.fileExists) || (() => Promise.resolve(false));
        certs.forEach((c, i) => {
            const box = $('[data-cert="' + i + '"]', certGrid);
            if (c.verify) box.insertAdjacentHTML('beforeend', '<a class="cert-link" href="' + esc(c.verify) + '" target="_blank" rel="noopener">Verify ' + icon('arrow') + '</a>');
            if (!c.file) return;
            exists(c.file).then((ok) => {
                if (!ok) return;
                const pdf = /\.pdf$/i.test(c.file);
                box.insertAdjacentHTML('afterbegin', pdf
                    ? '<a class="cert-link" href="' + esc(c.file) + '" target="_blank" rel="noopener">View certificate ' + icon('arrow') + '</a>'
                    : '<button type="button" class="cert-link" data-cert-img="' + esc(c.file) + '" data-cert-title="' + esc(c.title) + '">View certificate ' + icon('arrow') + '</button>');
            });
        });
        certGrid.addEventListener('click', (e) => {
            const b = e.target.closest('[data-cert-img]');
            if (b && window.Site && window.Site.openLightbox) window.Site.openLightbox([b.dataset.certImg], 0, b.dataset.certTitle);
        });
    }

    /* ======================================================================
       RATE CARD: the download button appears once the PDF exists
       ====================================================================== */
    $$('[data-if-pdf]').forEach((el) => {
        if (window.Site && window.Site.fileExists) window.Site.fileExists(el.getAttribute('href')).then((ok) => { if (ok) el.hidden = false; });
    });

    /* ======================================================================
       INSTALLABLE APP (PWA)
       ====================================================================== */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
        });
    }
    let deferredPrompt = null;
    const installBtn = $('#install-app');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.hidden = false;
    });
    if (installBtn) installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => null);
        if (choice && choice.outcome === 'accepted') track('app-installed');
        deferredPrompt = null;
        installBtn.hidden = true;
    });
    window.addEventListener('appinstalled', () => { if (installBtn) installBtn.hidden = true; });
})();
