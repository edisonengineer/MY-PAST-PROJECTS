/* =========================================================================
   Client project tracker (track/index.html)
   Clients enter the reference you gave them. The project is looked up in
   the "Projects" tab of the Google Sheet (config trackerApi), which only
   returns a project for its exact reference. If it isn't there, the
   encrypted js/tracker-data.js is tried (unlocked with the reference).
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const icon = (n) => '<svg aria-hidden="true"><use href="#i-' + n + '"/></svg>';
    const STAGES = ['Brief received', 'Quote sent', 'Deposit received', 'Design in progress', 'Review & revisions', 'Delivered'];
    const WHATSAPP = ((window.SITE_CONFIG || {}).whatsapp) || '254708639473';

    const form = $('#track-form');
    if (!form) return;
    const input = $('#track-ref');
    const out = $('#track-result');
    const err = $('.form-error', form);
    const btn = $('button[type="submit"]', form);

    const norm = (ref) => String(ref || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const enc = new TextEncoder();

    let sheetDown = false;
    // 1. The "Projects" tab of the Google Sheet (updated by Edison, read live)
    async function findInSheet(ref) {
        const api = (window.SITE_CONFIG || {}).trackerApi;
        if (!api) return null;
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl && setTimeout(() => ctrl.abort(), 12000);
        try {
            const res = await fetch(api + (api.includes('?') ? '&' : '?') + 'action=track&ref=' + encodeURIComponent(ref), ctrl ? { signal: ctrl.signal } : {});
            const data = await res.json();
            if (data && data.error) sheetDown = true;
            return data && data.found && data.project ? data.project : null;
        } catch (e) {
            sheetDown = true;
            return null;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    // 2. js/tracker-data.js (encrypted, built from content/tracker.private.js)
    async function find(ref) {
        const fromSheet = await findInSheet(ref);
        if (fromSheet) return fromSheet;
        const data = window.TRACKER;
        if (!data || !window.crypto || !crypto.subtle) throw new Error('unsupported');
        const id = hex(await crypto.subtle.digest('SHA-256', enc.encode('ncs-track:' + ref))).slice(0, 24);
        const item = data.items.find((x) => x.id === id);
        if (!item) return null;
        const base = await crypto.subtle.importKey('raw', enc.encode(ref), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(item.s), iterations: data.n, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(item.i) }, key, b64(item.d));
        return JSON.parse(new TextDecoder().decode(plain));
    }

    const day = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString(document.documentElement.lang === 'en' ? 'en-GB' : document.documentElement.lang, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
    const money = (n) => (window.Currency ? window.Currency.fmt(n) : 'KES ' + Number(n).toLocaleString('en-US'));

    // At "Review & revisions" the client can approve the design or ask for changes (saved to the Google Sheet)
    const sheetApi = (window.SITE_CONFIG || {}).trackerApi || (window.SITE_CONFIG || {}).reviewsApi;
    let shownRef = '';
    function reviewBox(p) {
        if (p.declined || +p.stage !== 4 || !sheetApi || !p.ref) return '';
        const a = p.approval || {};
        if (a.state === 'approved') {
            return '<div class="track-review is-approved">' + icon('check') + '<p><strong>You approved this design</strong>' +
                (a.date ? ' <span>on</span> <span data-no-i18n>' + esc(a.date) + '</span>' : '') + '. <span>Thank you!</span></p></div>';
        }
        return '<div class="track-review" id="track-review">' +
            '<h3>Ready for your review</h3>' +
            '<p>' + (a.state === 'changes'
                ? '<span>You requested changes</span>' + (a.date ? ' <span>on</span> <span data-no-i18n>' + esc(a.date) + '</span>' : '') + '. <span>Once the design is updated, you can approve it here.</span>'
                : '<span>Take a look at the latest design, then approve it or tell me what to change.</span>') + '</p>' +
            '<label for="tr-msg">Comments <small>(needed when you request changes)</small></label>' +
            '<textarea id="tr-msg" rows="3" maxlength="1500" placeholder="e.g. Please make the flange 2 mm thicker"></textarea>' +
            '<div class="tr-actions">' +
                '<button type="button" class="btn btn-green" data-decision="approve">' + icon('check') + ' Approve design</button>' +
                '<button type="button" class="btn btn-outline" data-decision="changes">Request changes</button>' +
            '</div><p class="form-error" role="alert" hidden></p></div>';
    }
    out.addEventListener('click', (e) => {
        const b = e.target.closest('[data-decision]');
        if (!b) return;
        const box = $('#track-review'), msgEl = $('#tr-msg', box), errEl = $('.form-error', box);
        const decision = b.dataset.decision, message = msgEl.value.trim();
        errEl.hidden = true;
        if (decision === 'changes' && message.length < 3) { errEl.textContent = t('Please describe the changes you would like.'); errEl.hidden = false; msgEl.focus(); return; }
        if (decision === 'approve' && !window.confirm(t('Approve this design? Edison will be notified and will prepare your final files.'))) return;
        $$('button', box).forEach((x) => { x.disabled = true; });
        fetch(sheetApi, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'feedback', ref: shownRef, decision, message }) })
            .then(() => {
                box.className = 'track-review is-approved';
                box.innerHTML = icon('check') + '<p><strong>' + (decision === 'approve' ? 'Thank you for approving the design!' : 'Thank you, your changes have been sent.') + '</strong> <span>Edison has been notified and will get back to you.</span></p>';
                if (typeof window.track === 'function') window.track(decision === 'approve' ? 'design-approved' : 'changes-requested');
            })
            .catch(() => {
                $$('button', box).forEach((x) => { x.disabled = false; });
                errEl.textContent = t("This couldn't be sent just now. Please try again, or message me on WhatsApp.");
                errEl.hidden = false;
            });
    });

    function render(p) {
        shownRef = p.ref || '';
        const stage = Math.max(0, Math.min(STAGES.length - 1, +p.stage || 0));
        const done = stage === STAGES.length - 1;
        const progress = typeof p.progress === 'number' ? Math.max(0, Math.min(100, p.progress)) : Math.round(stage / (STAGES.length - 1) * 100);
        const msg = encodeURIComponent('Hi Edison, I am checking on my project ' + (p.ref || '') + (p.project ? ' (' + p.project + ')' : '') + '.');
        out.innerHTML =
            '<article class="track-card">' +
                '<header class="track-head">' +
                    '<div><p class="track-ref" data-no-i18n>' + esc(p.ref || '') + '</p><h2 data-no-i18n>' + esc(p.project || '') + '</h2>' + (p.client ? '<p class="track-client"><span>For</span> <span data-no-i18n>' + esc(p.client) + '</span></p>' : '') + '</div>' +
                    '<span class="track-badge' + (done ? ' is-done' : '') + (p.declined ? ' is-declined' : '') + '">' + esc(p.status || STAGES[stage]) + '</span>' +
                '</header>' +
                (p.declined ? '' :
                '<div class="track-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '" aria-label="Progress"><span style="width:' + progress + '%"></span></div>' +
                '<p class="track-pct"><strong>' + progress + '%</strong> <span>complete</span></p>' +
                '<ol class="track-steps">' + STAGES.map((s, i) =>
                    '<li class="' + (i < stage || done ? 'is-done' : i === stage ? 'is-current' : '') + '"><span class="ts-dot">' + (i < stage || done ? icon('check') : i + 1) + '</span><span class="ts-label">' + esc(s) + '</span></li>').join('') + '</ol>') +
                '<dl class="pm-meta track-meta">' +
                    (p.due ? '<div><dt>Due date</dt><dd data-no-i18n>' + esc(day(p.due)) + '</dd></div>' : '') +
                    (p.updated ? '<div><dt>Last update</dt><dd data-no-i18n>' + esc(day(p.updated)) + '</dd></div>' : '') +
                    (p.deposit ? '<div><dt>Deposit</dt><dd>' + (p.deposit === 'paid' ? 'Paid' : 'Due') + '</dd></div>' : '') +
                    (typeof p.amountDue === 'number' && p.amountDue > 0 ? '<div><dt>Balance due</dt><dd data-kes="' + p.amountDue + '">' + esc(money(p.amountDue)) + '</dd></div>' : '') +
                '</dl>' +
                (p.note ? '<div class="track-note"><span>Latest update from Edison</span><p data-no-i18n>' + esc(p.note) + '</p></div>' : '') +
                reviewBox(p) +
                '<div class="pm-actions">' +
                    (p.files ? '<a class="btn btn-sun" href="' + esc(p.files) + '" target="_blank" rel="noopener">' + icon('doc') + ' Download your files</a>' : '') +
                    (p.deposit === 'due' || (typeof p.amountDue === 'number' && p.amountDue > 0) ? '<a class="btn btn-navy" href="../index.html#pay">' + icon('wallet') + ' Pay by M-Pesa</a>' : '') +
                    '<a class="btn btn-green" href="https://wa.me/' + WHATSAPP + '?text=' + msg + '" target="_blank" rel="noopener">' + icon('whatsapp') + ' Ask about this project</a>' +
                '</div>' +
            '</article>';
        out.hidden = false;
        out.focus({ preventScroll: true });
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function lookup(raw) {
        const ref = norm(raw);
        err.hidden = true;
        out.hidden = true;
        if (ref.length < 6) { err.textContent = t('Please enter the project reference from your quote or message.'); err.hidden = false; input.focus(); return; }
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> ' + t('Checking…');
        try {
            sheetDown = false;
            const p = await find(ref);
            if (!p && sheetDown) {
                err.textContent = t("The tracker couldn't connect just now. Please try again in a minute, or message me on WhatsApp.");
                err.hidden = false;
            } else if (!p) {
                err.textContent = t("We couldn't find that reference. Check it matches the one I sent you, or message me on WhatsApp.");
                err.hidden = false;
            } else {
                render(p);
                if (typeof window.track === 'function') window.track('project-tracked');
                history.replaceState(null, '', location.pathname);
            }
        } catch (e) {
            err.textContent = t('Sorry, your browser could not open the tracker. Please message me on WhatsApp for an update.');
            err.hidden = false;
        } finally {
            btn.disabled = false;
            btn.innerHTML = label;
        }
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); lookup(input.value); });
    form.addEventListener('click', (e) => { const d = e.target.closest('[data-demo]'); if (d) { input.value = d.dataset.demo; lookup(d.dataset.demo); } });
    const q = new URLSearchParams(location.search).get('ref');
    if (q) { input.value = q; window.addEventListener('load', () => lookup(q)); }
})();
