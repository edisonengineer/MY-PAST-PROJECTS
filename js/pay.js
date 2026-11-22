/* =========================================================================
   Make a payment (pay/index.html): any amount, against a project or
   training reference.
   1. The reference (from ?ref=, typed, or picked from the account's projects).
   2. What it owes, from the Google Sheet (action=pay-info): total, paid,
      balance, and quick amounts (50% deposit, full balance) or any amount.
   3. Pay by M-Pesa prompt (js/pages.js, NexusMpesa), or pay the till and
      enter the M-Pesa code (action=payment). Either way the exact amount is
      recorded against the reference in the Payments tab; a prompt payment is
      confirmed and its receipt emailed automatically.
   ========================================================================= */
(function () {
    'use strict';

    const app = document.getElementById('pay-app');
    if (!app) return;
    const CFG = window.SITE_CONFIG || {}, PAY = CFG.payments || {};
    const API = CFG.trackerApi || CFG.reviewsApi || '';
    const ROOT = '../';
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const kes = (n) => 'KES ' + Math.round(Number(n) || 0).toLocaleString('en-US');
    const params = new URLSearchParams(location.search);
    const MP = () => window.NexusMpesa;
    let info = null;

    async function get(q) {
        const res = await fetch(API + (API.includes('?') ? '&' : '?') + new URLSearchParams(q).toString());
        return res.json();
    }

    /* ---------- Step 1: the reference ---------- */
    function renderStart(ref, msg) {
        app.innerHTML = `<div class="pay-card">
            <h2>Which project are you paying for?</h2>
            <p>Enter the reference from your quote, invoice or emails (e.g. NCS-2026-014, or TRN-… for training).</p>
            <form id="pay-ref-form" class="pay-ref-row" novalidate>
                <label class="sr-only" for="pay-ref">Reference</label>
                <input id="pay-ref" name="ref" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NCS-2026-014" value="${esc(ref || '')}" required>
                <button type="submit" class="btn btn-sun">Continue</button>
            </form>
            <p class="form-error" role="alert"${msg ? '' : ' hidden'}>${esc(msg || '')}</p>
            <div id="pay-mine"></div>
        </div>`;
        const form = app.querySelector('#pay-ref-form');
        form.addEventListener('submit', (e) => { e.preventDefault(); lookup(form.ref.value.trim()); });
        mine();
    }
    // Logged in: their projects with something to pay, one tap each
    function mine() {
        const A = window.NexusAccount, box = app.querySelector('#pay-mine');
        if (!box || !A || !A.user()) return;
        A.data().then((acc) => {
            const list = ((acc && acc.projects) || []).filter((p) => p.money && (p.money.balance > 0 || (p.money.total && !p.money.paid)));
            if (!list.length || !app.contains(box)) return;
            box.innerHTML = '<p class="pay-mine-title">Your projects</p><div class="pay-mine">' + list.map((p) => `<button type="button" class="pay-mine-btn" data-ref="${esc(p.ref)}">
                <strong data-no-i18n>${esc(p.project || p.ref)}</strong><span data-no-i18n>${esc(p.ref)}</span>
                <em>${p.money.balance > 0 ? '<span>Balance</span> <span data-no-i18n>' + esc(kes(p.money.balance)) + '</span>' : '<span>Total</span> <span data-no-i18n>' + esc(kes(p.money.total)) + '</span>'}</em></button>`).join('') + '</div>';
            box.querySelectorAll('[data-ref]').forEach((b) => b.addEventListener('click', () => lookup(b.dataset.ref)));
        });
    }
    async function lookup(ref) {
        const err = app.querySelector('.form-error'), btn = app.querySelector('#pay-ref-form button');
        if (!/^[A-Za-z0-9-]{6,30}$/.test(ref || '')) { if (err) { err.textContent = t('Please enter your reference, e.g. NCS-2026-014.'); err.hidden = false; } return; }
        if (!API) { renderStart(ref, t('Payments are not set up on this site yet.')); return; }
        if (btn) btn.disabled = true;
        let r;
        try { r = await get({ action: 'pay-info', ref }); } catch (e) { r = { error: 'network' }; }
        if (r && r.found) { info = r; renderPay(); history.replaceState(null, '', location.pathname + '?ref=' + encodeURIComponent(r.ref) + (params.get('amount') ? '&amount=' + encodeURIComponent(params.get('amount')) : '')); return; }
        renderStart(ref, t(r && r.error === 'busy' ? 'Too many attempts. Please wait a few minutes and try again.' : r && r.error === 'network' ? 'Could not reach the server. Check your connection and try again.' :
            'That reference was not found. Check it against your quote or emails, or message me on WhatsApp.'));
    }

    /* ---------- Step 2: amount and payment ---------- */
    function renderPay() {
        const i = info, stk = MP() && MP().enabled();
        if (stk) MP().style();
        const want = Math.round(Number(params.get('amount')) || 0);
        const opts = (i.options || []).map((o) => ({ amount: o.amount, label: o.kind === 'deposit' ? '50% deposit' : 'Full balance' }));
        const first = want > 0 ? want : opts.length ? opts[0].amount : '';
        const qr = PAY.mpesaQr ? ROOT + PAY.mpesaQr : '';
        app.innerHTML = `<div class="pay-card">
            <p class="pay-for"><span>Paying for</span> <strong data-no-i18n>${esc(i.title || i.ref)}</strong> <span class="pay-ref-tag" data-no-i18n>${esc(i.ref)}</span>
                <button type="button" class="link-btn" data-pay="change">Change</button></p>
            ${i.total || i.paid || i.balance !== null ? `<dl class="pay-sum">
                ${i.total ? `<div><dt>Total</dt><dd data-no-i18n>${esc(kes(i.total))}</dd></div>` : ''}
                <div><dt>Paid so far</dt><dd data-no-i18n>${esc(kes(i.paid))}</dd></div>
                ${i.balance !== null && i.balance !== undefined ? `<div class="is-due"><dt>Balance due</dt><dd data-no-i18n>${esc(kes(i.balance))}</dd></div>` : ''}
            </dl>` : ''}
            ${i.pending ? `<p class="pay-pending"><span data-no-i18n>${esc(kes(i.pending))}</span> <span>you sent is waiting for my confirmation.</span></p>` : ''}
            <h2>How much would you like to pay?</h2>
            <div class="amt-pick" role="group" aria-label="Amount">
                ${opts.map((o) => `<button type="button" class="amt-chip${o.amount === first ? ' is-on' : ''}" data-amt="${o.amount}"><span>${o.label}</span> <strong data-no-i18n>${esc(kes(o.amount))}</strong></button>`).join('')}
                <button type="button" class="amt-chip${!opts.some((o) => o.amount === first) ? ' is-on' : ''}" data-amt="">Other amount</button>
            </div>
            <div class="field amt-field"><label for="pay-amount">Amount (KES)</label><input id="pay-amount" type="number" min="1" max="1000000" step="1" inputmode="numeric" value="${esc(first)}" placeholder="e.g. 5000"></div>
            ${stk ? `<div class="pay-stk">
                <div class="field"><label for="pay-phone">Your M-Pesa number</label><input id="pay-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0712 345 678"></div>
                <p class="form-error" role="alert" hidden></p>
                <button type="button" class="btn btn-mpesa btn-block" data-pay="stk"></button>
                <p class="pay-note">You get an M-Pesa prompt on your phone. Enter your PIN and the payment is confirmed and your receipt emailed straight away.</p>
            </div><div class="pay-panel" hidden></div>` : ''}
            <details class="pay-till"${stk ? '' : ' open'}>
                <summary>${stk ? 'Paid the till directly? Enter the M-Pesa code' : 'Pay by M-Pesa till'}</summary>
                <div class="pay-till-body">
                    ${qr ? `<img src="${esc(qr)}" alt="M-Pesa till QR code" width="110" height="110" loading="lazy">` : ''}
                    <ol>
                        <li>M-Pesa → Lipa na M-Pesa → <strong>Buy Goods and Services</strong></li>
                        <li>Till number <strong data-no-i18n>${esc(PAY.mpesaTill || '')}</strong>${PAY.mpesaName ? ` (<span data-no-i18n>${esc(PAY.mpesaName)}</span>)` : ''}</li>
                        <li>Amount <strong class="pay-amt-text" data-no-i18n></strong>, then your PIN</li>
                        <li>Enter the M-Pesa code from your SMS below</li>
                    </ol>
                </div>
                <form id="pay-code-form" novalidate>
                    <div class="pay-code-grid">
                        <div class="field"><label for="pay-code">M-Pesa code</label><input id="pay-code" type="text" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. SKL4ABCD12"></div>
                        <div class="field"><label for="pay-payer">Paid from <small>(name or number, optional)</small></label><input id="pay-payer" type="text" maxlength="80" autocomplete="name"></div>
                    </div>
                    <p class="form-error" role="alert" hidden></p>
                    <button type="submit" class="btn btn-navy btn-block">Send the code</button>
                </form>
            </details>
        </div>`;
        const amountEl = app.querySelector('#pay-amount');
        const amount = () => Math.round(Number(amountEl.value) || 0);
        const paint = () => {
            const a = amount();
            app.querySelectorAll('.pay-amt-text').forEach((el) => { el.textContent = a > 0 ? kes(a) : '…'; });
            const b = app.querySelector('[data-pay=stk]');
            if (b) b.innerHTML = MP().button(a > 0 ? a : 0);
            app.querySelectorAll('.amt-chip').forEach((c) => c.classList.toggle('is-on', c.dataset.amt ? Number(c.dataset.amt) === a : !opts.some((o) => o.amount === a)));
        };
        paint();
        amountEl.addEventListener('input', paint);
        app.querySelectorAll('.amt-chip').forEach((c) => c.addEventListener('click', () => {
            if (c.dataset.amt) amountEl.value = c.dataset.amt; else { amountEl.value = ''; amountEl.focus(); }
            paint();
        }));
        app.querySelector('[data-pay=change]').addEventListener('click', () => { info = null; history.replaceState(null, '', location.pathname); renderStart(''); });
        const badAmount = (errEl) => {
            const a = amount();
            if (a >= 1 && a <= 1000000) return false;
            errEl.textContent = t('Please enter the amount to pay.'); errEl.hidden = false; amountEl.focus();
            return true;
        };
        // M-Pesa prompt
        const stkBtn = app.querySelector('[data-pay=stk]');
        if (stkBtn) stkBtn.addEventListener('click', () => {
            const box = app.querySelector('.pay-stk'), err = box.querySelector('.form-error'), phoneEl = app.querySelector('#pay-phone');
            err.hidden = true;
            if (badAmount(err)) return;
            const phone = MP().normalize(phoneEl.value);
            if (!phone) { err.textContent = t('Enter a Safaricom number, like 0712 345 678.'); err.hidden = false; phoneEl.focus(); return; }
            const panel = app.querySelector('.pay-panel'), till = app.querySelector('.pay-till'), a = amount();
            box.hidden = true; till.hidden = true;
            MP().pay({
                api: API, panel, amount: a,
                params: { for: 'payment', ref: info.ref, amount: a, payer: '', phone },
                onPaid: (r) => done(a, r.status === 'check' ? 'check' : 'paid', r.receipt),
                onStop: (msg) => { panel.hidden = true; box.hidden = false; till.hidden = false; if (msg) { err.textContent = msg; err.hidden = false; } }
            });
        });
        // Till + M-Pesa code
        const codeForm = app.querySelector('#pay-code-form'), codeEl = app.querySelector('#pay-code');
        codeEl.addEventListener('input', () => { codeEl.value = codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
        codeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const err = codeForm.querySelector('.form-error');
            err.hidden = true;
            if (badAmount(err)) return;
            if (!/^[A-Z0-9]{10}$/.test(codeEl.value)) { err.textContent = t('An M-Pesa code has 10 letters and numbers, e.g. SKL4ABCD12.'); err.hidden = false; codeEl.focus(); return; }
            codeForm.querySelector('button').disabled = true;
            const a = amount();
            fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'payment', ref: info.ref, code: codeEl.value, amount: a, payer: app.querySelector('#pay-payer').value.trim() }) })
                .catch(() => { /* the WhatsApp button below still works */ })
                .finally(() => done(a, 'code'));
        });
    }
    function done(amount, how, receipt) {
        const wa = 'https://wa.me/' + (CFG.whatsapp || '254708639473') + '?text=' + encodeURIComponent('Hi Edison, I have paid ' + kes(amount) + ' for ' + info.ref + '.');
        app.innerHTML = `<div class="pay-card pay-done" tabindex="-1">
            <span class="pay-done-icon" aria-hidden="true">✓</span>
            <h2>${how === 'paid' ? 'Payment received' : 'Thank you!'}</h2>
            <p><strong data-no-i18n>${esc(kes(amount))}</strong> · <span data-no-i18n>${esc(info.ref)}</span>${receipt ? ' · <span data-no-i18n>' + esc(receipt) + '</span>' : ''}</p>
            <p>${how === 'paid' ? 'Your payment is confirmed and the receipt is on its way to your email.' : 'I will check the payment and email your receipt, usually within a few hours.'}</p>
            <div class="pay-done-actions">
                <a class="btn btn-sun" href="${ROOT}track/index.html?ref=${encodeURIComponent(info.ref)}">Track your project</a>
                <a class="btn btn-outline" href="${ROOT}account/index.html">My account</a>
                <a class="btn btn-green" href="${wa}" target="_blank" rel="noopener">Tell me on WhatsApp</a>
            </div>
        </div>`;
        app.querySelector('.pay-done').focus();
        if (typeof window.track === 'function') window.track('payment-' + how);
    }

    // Start once js/account.js has loaded (it runs after this file), so "Your projects" can show
    const go = () => { const ref = (params.get('ref') || '').trim(); if (ref) lookup(ref); else renderStart(''); };
    // (deferred scripts run before DOMContentLoaded, while readyState is already "interactive")
    if (document.readyState === 'complete') go(); else document.addEventListener('DOMContentLoaded', go);
})();
