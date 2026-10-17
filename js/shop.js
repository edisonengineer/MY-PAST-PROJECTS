/* =========================================================================
   Cost estimator, quote cart, booking calendar and Instagram feed.
   Settings: js/rates.js (estimator prices) and js/config.js (booking link,
   Instagram feed). Quote requests are emailed through Web3Forms.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
    const CONFIG = window.SITE_CONFIG || {};
    const WHATSAPP = CONFIG.whatsapp || '254708639473';
    const lock = () => (window.Site ? window.Site.lock() : document.body.classList.add('no-scroll'));
    const unlock = () => (window.Site ? window.Site.unlock() : document.body.classList.remove('no-scroll'));
    const track = (name) => { if (typeof window.track === 'function') window.track(name); };
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const C = () => window.Currency;
    // Prices are stored in KES; shown in the visitor's chosen currency (js/currency.js)
    const money = (n, cur) => ((!cur || cur === 'KES') && C() ? C().fmt(n) : (cur || 'KES') + ' ' + Math.round(n).toLocaleString('en-US'));
    const rangeText = (min, max, code) => (C() ? C().range(min, max, code) : (max == null ? 'From ' : '') + 'KES ' + Math.round(min).toLocaleString('en-US') + (max != null && max !== min ? ' – ' + Math.round(max).toLocaleString('en-US') : ''));
    // A cart line's price: worked out again from its numbers, so it follows the currency switch
    const itemEstimate = (i, code) => (typeof i.min === 'number' ? rangeText(i.min, typeof i.max === 'number' ? i.max : null, code) : (i.estimate || ''));

    /* ======================================================================
       TOAST
       ====================================================================== */
    const toastEl = $('#toast');
    let toastTimer = null;
    function toast(text, showAction) {
        if (!toastEl) return;
        $('#toast-text').textContent = text;
        $('#toast-action').hidden = !showAction;
        toastEl.hidden = false;
        requestAnimationFrame(() => toastEl.classList.add('is-visible'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('is-visible');
            setTimeout(() => { toastEl.hidden = true; }, 300);
        }, 3800);
    }

    /* ======================================================================
       QUOTE CART
       ====================================================================== */
    const KEY = 'quoteCart';
    const drawer = $('#cart');
    const list = $('#cart-list');
    const countEl = $('#cart-count');
    const form = $('#cart-form');
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked: cart lasts for this visit */ }
        render();
    }

    function totals() {
        const priced = cart.filter((i) => typeof i.min === 'number');
        if (!priced.length) return null;
        const open = priced.some((i) => typeof i.max !== 'number');
        return {
            min: priced.reduce((a, i) => a + i.min, 0),
            max: open ? null : priced.reduce((a, i) => a + i.max, 0),
            partial: priced.length < cart.length
        };
    }
    const totalText = (t, code) => rangeText(t.min, t.max, code);

    function render() {
        const n = cart.length;
        countEl.textContent = n;
        countEl.hidden = n === 0;
        $('#cart-btn').setAttribute('aria-label', n ? 'Open your quote (' + n + ' items)' : 'Open your quote');
        list.innerHTML = cart.map((i) =>
            '<li class="cart-item">' +
                '<span class="cart-item-icon bg-' + esc(i.tone || 'blue') + '">' + icon(i.icon || 'cube') + '</span>' +
                '<div class="cart-item-body">' +
                    '<strong>' + esc(i.title) + '</strong>' +
                    (i.detail ? '<span>' + esc(i.detail) + '</span>' : '') +
                    (itemEstimate(i) ? '<em>' + esc(itemEstimate(i)) + '</em>' : '') +
                '</div>' +
                '<button type="button" class="cart-remove" data-remove="' + esc(i.uid) + '" aria-label="Remove ' + esc(i.title) + '">' + icon('close') + '</button>' +
            '</li>'
        ).join('');
        $('#cart-empty').hidden = n > 0;
        form.hidden = n === 0 || !$('#cart-done').hidden;
        const t = totals();
        const totalEl = $('#cart-total');
        totalEl.hidden = !t;
        const d = window.Discount && window.Discount.get('cart-code');
        if (t) totalEl.innerHTML = '<span>Estimated total</span><strong>' + totalText(t) + '</strong>' +
            (t.partial ? '<small>Plus items priced on request</small>' : '') +
            (d && d.percent ? '<small class="cart-disc"><span>' + esc(d.label) + '</span>: <span>' + esc(totalText({ min: t.min * (1 - d.percent / 100), max: t.max == null ? null : t.max * (1 - d.percent / 100) })) + '</span></small>' : '') +
            (d && d.amount ? '<small class="cart-disc"><span>' + esc(d.label) + '</span></small>' : '');
        const tools = $('.cart-tools', drawer);
        if (tools) tools.hidden = n === 0 || !$('#cart-done').hidden;
        const pdfBtn = $('#cart-pdf');
        if (pdfBtn) pdfBtn.hidden = n === 0;
    }

    function addItem(item) {
        item.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        cart.push(item);
        save();
        countEl.classList.remove('bump');
        void countEl.offsetWidth;
        countEl.classList.add('bump');
        toast('Added to your quote', true);
        track('quote-item-added');
    }

    let cartReturn = null;
    function openCart() {
        cartReturn = document.activeElement;
        $('#cart-done').hidden = true;
        render();
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        lock();
        setTimeout(() => $('.modal-close', drawer).focus({ preventScroll: true }), 50);
    }
    function closeCart() {
        if (!drawer.classList.contains('is-open')) return;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        unlock();
        if (cartReturn) cartReturn.focus({ preventScroll: true });
    }

    if (drawer) {
        render();
        document.addEventListener('currencychange', render);
        $('#cart-btn').addEventListener('click', openCart);
        $('#toast-action').addEventListener('click', openCart);
        drawer.addEventListener('click', (e) => {
            const rm = e.target.closest('[data-remove]');
            if (rm) { cart = cart.filter((i) => i.uid !== rm.dataset.remove); save(); return; }
            if (e.target.closest('[data-cart-close]')) closeCart();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeCart(); });

        // "Add to quote" on package cards
        document.addEventListener('click', (e) => {
            const b = e.target.closest('[data-add-pkg]');
            if (!b) return;
            const k = (window.PACKAGES || [])[+b.dataset.addPkg];
            if (!k) return;
            const label = { engineering: 'Engineering', graphic: 'Graphic Design', training: 'Training' }[k.category] || k.category;
            const amount = k.price ? parseInt(String(k.price).replace(/[^\d]/g, ''), 10) : NaN;
            addItem({
                title: k.name, detail: label + ' package',
                estimate: k.price ? (k.from ? 'From ' : '') + k.price : 'Custom quote',
                min: isNaN(amount) ? undefined : amount,
                max: isNaN(amount) || k.from ? undefined : amount,
                icon: k.icon, tone: 'sun'
            });
        });

        /* ---------- Download the quote as a PDF (print / "Save as PDF") ---------- */
        function quoteHtml() {
            const pay = (window.SITE_CONFIG || {}).payments || {};
            const code = C() ? C().code : 'KES';
            const now = new Date();
            const valid = new Date(now.getTime() + 14 * 864e5);
            const day = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const ref = 'Q' + now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
            const name = ($('#cart-name') && $('#cart-name').value.trim()) || '';
            const t = totals();
            const rows = cart.map((i, k) => '<tr><td>' + (k + 1) + '</td><td><strong>' + esc(i.title) + '</strong>' + (i.detail ? '<br><span>' + esc(i.detail) + '</span>' : '') + '</td><td class="r">' + esc(itemEstimate(i) || 'On request') + '</td></tr>').join('');
            return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Quote ' + ref + ' | Nexus CAD Studio</title><style>' +
                '@page{size:A4;margin:14mm}*{box-sizing:border-box;margin:0;padding:0}body{font:14px/1.5 "Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#18203a;background:#f3eadb;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
                '.sheet{max-width:800px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(14,26,58,.15)}' +
                'header{background:#0e1a3a;color:#fff;padding:28px 32px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start}' +
                '.brand{display:flex;gap:12px;align-items:center}.mark{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#ffb627,#ff6b4a);color:#0e1a3a;font:600 18px Georgia,serif}.brand b{display:block;font:600 20px Georgia,serif}.brand small{opacity:.75;font-size:11px;letter-spacing:.12em;text-transform:uppercase}' +
                'h1{font:500 28px Georgia,serif;text-align:right}h1 em{color:#ffb627;font-style:normal}.ref{text-align:right;font-size:12px;opacity:.8}' +
                'main{padding:28px 32px}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px}.meta div{background:#fbf6ee;border-radius:10px;padding:10px 12px}.meta dt{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#646a82}.meta dd{font-weight:600}' +
                'table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#646a82;border-bottom:2px solid #0e1a3a;padding:8px 6px}td{padding:10px 6px;border-bottom:1px solid #e9e0d0;vertical-align:top}td span{color:#4c5470;font-size:12.5px}.r{text-align:right;white-space:nowrap;font-weight:600}' +
                '.total{display:flex;justify-content:flex-end;gap:18px;align-items:baseline;margin-top:14px;font-size:16px}.total strong{font:600 22px Georgia,serif;color:#0e1a3a}' +
                '.notes{margin-top:22px;padding:14px 16px;border-radius:10px;background:#fbf6ee;font-size:12.5px;color:#4c5470}.notes li{margin:4px 0 0 16px}.pay{margin-top:14px;padding:14px 16px;border-radius:10px;background:rgba(31,174,106,.1);font-size:13px}.pay b{font-size:16px;letter-spacing:.05em}' +
                'footer{padding:16px 32px 24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:12px;color:#4c5470;border-top:1px solid #e9e0d0}footer b{color:#0e1a3a}' +
                '.bar{max-width:800px;margin:16px auto 0;display:flex;gap:10px;justify-content:center}.bar button{font:600 14px inherit;padding:12px 22px;border-radius:999px;border:0;background:#ffb627;color:#0e1a3a;cursor:pointer}.bar button+button{background:#fff}' +
                '@media print{body{background:#fff}.sheet{box-shadow:none;margin:0;border-radius:0;max-width:none}.bar{display:none}}' +
                '</style></head><body>' +
                '<div class="bar"><button onclick="print()">Save as PDF / Print</button><button onclick="close()">Close</button></div>' +
                '<div class="sheet"><header><div class="brand"><span class="mark">EO</span><div><b>Nexus CAD Studio</b><small>Edison Ochieng · Nairobi, Kenya</small></div></div>' +
                '<div><h1>Quote <em>estimate</em></h1><p class="ref">Ref. ' + ref + '</p></div></header><main>' +
                '<dl class="meta">' + (name ? '<div><dt>Prepared for</dt><dd>' + esc(name) + '</dd></div>' : '') +
                '<div><dt>Date</dt><dd>' + day(now) + '</dd></div><div><dt>Valid until</dt><dd>' + day(valid) + '</dd></div><div><dt>Currency</dt><dd>' + (code === 'USD' ? 'US dollars (approx.)' : 'Kenyan shillings') + '</dd></div></dl>' +
                '<table><thead><tr><th>#</th><th>Item</th><th class="r">Estimate</th></tr></thead><tbody>' + rows + '</tbody></table>' +
                (t ? '<p class="total"><span>Estimated total</span><strong>' + esc(totalText(t)) + '</strong></p>' + (t.partial ? '<p class="total" style="font-size:12px;margin-top:2px">Plus items priced on request</p>' : '') : '') +
                '<div class="notes"><strong>Good to know</strong><ul>' +
                    '<li>These are starting prices. Your final quote depends on complexity, scope and deadline, and is confirmed after I review your brief.</li>' +
                    (code === 'USD' ? '<li>US dollar amounts are approximate and based on the current exchange rate.</li>' : '') +
                    '<li>A deposit may be needed before work starts on larger projects.</li></ul></div>' +
                (pay.mpesaTill ? '<div class="pay">Pay by M-Pesa: <strong>Buy Goods Till</strong> <b>' + esc(pay.mpesaTill) + '</b> (' + esc(pay.mpesaName || 'Edison Ochieng') + ')</div>' : '') +
                '</main><footer><div><b>WhatsApp</b><br>+' + esc(WHATSAPP).replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4') + '</div><div><b>Website</b><br>' + esc(location.host + location.pathname.replace(/index\.html$/, '')) + '</div><div><b>Next step</b><br>Send this quote request from the website or on WhatsApp</div></footer></div>' +
                '<script>window.addEventListener("load",function(){setTimeout(function(){print()},400)})<\/script></body></html>';
        }

        $('#cart-pdf').addEventListener('click', () => {
            const html = quoteHtml();
            const w = window.open('', '_blank');
            if (w && w.document) {
                w.document.open();
                w.document.write(html);
                w.document.close();
            } else {
                const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
                const a = document.createElement('a');
                a.href = url; a.target = '_blank'; a.rel = 'noopener';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
            track('quote-pdf');
        });

        // Random, hard-to-guess reference like the brief form's: NCS-YYMM-XXXXX
        function newRef() {
            const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const bytes = new Uint8Array(5);
            window.crypto.getRandomValues(bytes);
            const d = new Date();
            return 'NCS-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + '-' + Array.from(bytes, (b) => abc[b % abc.length]).join('');
        }
        document.addEventListener('discountchange', (e) => { if (e.target.id === 'cart-code') render(); });

        function summaryText() {
            const usd = C() && C().code === 'USD';
            const lines = cart.map((i, n) => (n + 1) + '. ' + i.title + (i.detail ? ' (' + i.detail + ')' : '') + (itemEstimate(i, 'KES') ? ': ' + itemEstimate(i, 'KES') : ''));
            const t = totals();
            if (t) lines.push('', 'Estimated total: ' + totalText(t, 'KES') + (usd ? ' (about ' + totalText(t, 'USD').replace(/^From /, '') + ')' : '') + (t.partial ? ' + items priced on request' : ''));
            if (usd) lines.push('Client viewed prices in USD.');
            return lines.join('\n');
        }

        const err = $('#cart-error');
        form.addEventListener('input', (e) => {
            const f = e.target.closest('.field');
            if (f) f.classList.remove('is-invalid');
            if (!$('.is-invalid', form)) err.hidden = true;
        });

        function validate() {
            $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
            const bad = [];
            if (!form.name.value.trim()) bad.push(form.name);
            if (!isEmail(form.email.value.trim())) bad.push(form.email);
            if (bad.length) {
                bad.forEach((el) => el.closest('.field').classList.add('is-invalid'));
                err.textContent = 'Please add your name and a valid email.';
                err.hidden = false;
                bad[0].focus();
                return false;
            }
            return true;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validate() || form.botcheck.checked) return;
            const btn = $('#cart-send');
            const label = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
            const name = form.name.value.trim(), email = form.email.value.trim();
            const code = (form['Discount code'] && form['Discount code'].value.trim().toUpperCase()) || '';
            // Saved in the Google Sheet too (Submissions tab), with a reference the client can track
            const sheetApi = CONFIG.trackerApi || CONFIG.reviewsApi;
            const ref = sheetApi ? newRef() : '';
            const fields = {
                access_key: CONFIG.web3formsKey,
                subject: 'Quote request: ' + cart.length + (cart.length === 1 ? ' item' : ' items') + ' from ' + name,
                from_name: 'Portfolio: Quote Cart',
                name: name, email: email, replyto: email,
                'Phone / WhatsApp': form['Phone / WhatsApp'].value.trim(),
                'Requested items': summaryText(),
                Notes: form.Notes.value.trim(),
                'Discount code': code,
                Reference: ref
            };
            Object.keys(fields).forEach((k) => { if (fields[k] === '') delete fields[k]; });
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(fields)
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.success) throw new Error(data.message || 'Request failed (' + res.status + ')');
                let saved = false;
                if (ref) {
                    saved = await fetch(sheetApi, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({
                        action: 'brief', ref, name, email, phone: fields['Phone / WhatsApp'] || '', service: 'Quote cart',
                        project: cart.map((i) => i.title).join(', ').slice(0, 150), details: summaryText() + (fields.Notes ? '\n\nNotes: ' + fields.Notes : ''), code
                    }) }).then(() => true, () => false);
                }
                const refBox = $('#cart-ref');
                if (refBox) {
                    refBox.hidden = !saved;
                    if (saved) { $('#cart-ref-code').textContent = ref; $('#cart-track').href = 'track/?ref=' + encodeURIComponent(ref); }
                }
                track('quote-sent');
                cart = [];
                save();
                form.reset();
                form.hidden = true;
                $('#cart-done').hidden = false;
                $('#cart-done').focus({ preventScroll: true });
            } catch (ex) {
                err.textContent = 'Sorry, that didn\'t go through (' + ex.message + '). Please try again or send it on WhatsApp.';
                err.hidden = false;
            } finally {
                btn.disabled = false;
                btn.innerHTML = label;
            }
        });

        $('#cart-wa').addEventListener('click', () => {
            const name = form.name.value.trim();
            const text = 'Hi Edison' + (name ? ', my name is ' + name : '') + '. I\'d like a quote for:\n\n' + summaryText() +
                (form.Notes.value.trim() ? '\n\nNotes: ' + form.Notes.value.trim() : '');
            track('quote-whatsapp');
            window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        });
    }

    /* ======================================================================
       COST ESTIMATOR
       ====================================================================== */
    const E = window.ESTIMATOR;
    const estSection = $('#estimator');
    const preview = new URLSearchParams(location.search).get('preview') === 'estimator';
    if (E && estSection && (E.ready || preview)) {
        estSection.hidden = false;
        $$('[data-estimator-link]').forEach((a) => { a.hidden = false; });
        if (!E.ready) {
            $('.section-head', estSection).insertAdjacentHTML('beforeend',
                '<p class="est-preview" role="note">Preview mode: these are sample prices and this section is hidden from visitors until real rates are set in js/rates.js.</p>');
        }

        const complexity = E.complexity || [], urgency = E.urgency || [];
        const state = {
            cat: E.categories[0].id, service: null, qty: 1,
            complexity: (complexity.find((x) => x.factor === 1) || complexity[0] || {}).id,
            urgency: (urgency.find((x) => x.factor === 1) || urgency[0] || {}).id
        };
        if (!complexity.length) $('#est-complexity').closest('.q').hidden = true;
        if (!urgency.length) $('#est-urgency').closest('.q').hidden = true;
        const svcSelect = $('#est-service');
        const qty = $('#est-qty');
        const pct = (f) => (f === 1 ? '' : ' (' + (f > 1 ? '+' : '−') + Math.round(Math.abs(f - 1) * 100) + '%)');
        const radios = (name, items, current) => items.map((it) =>
            '<label class="opt"><input type="radio" name="' + name + '" value="' + esc(it.id) + '"' + (it.id === current ? ' checked' : '') + '><span>' + esc(it.label) + '</span></label>').join('');

        $('#est-cats').innerHTML = radios('est-cat', E.categories, state.cat);
        $('#est-complexity').innerHTML = radios('est-complexity', complexity, state.complexity);
        $('#est-urgency').innerHTML = urgency.map((it) =>
            '<label class="opt"><input type="radio" name="est-urgency" value="' + esc(it.id) + '"' + (it.id === state.urgency ? ' checked' : '') + '><span>' + esc(it.label) + '</span>' +
            (it.factor !== 1 ? '<small class="opt-tag">' + esc(pct(it.factor).trim()) + '</small>' : '') + '</label>').join('');

        function fillServices() {
            const items = E.services.filter((s) => s.category === state.cat);
            svcSelect.innerHTML = items.map((s) => '<option value="' + esc(s.id) + '">' + esc(s.label) + '</option>').join('');
            state.service = items[0] && items[0].id;
        }

        function current() {
            const s = E.services.find((x) => x.id === state.service);
            const c = complexity.find((x) => x.id === state.complexity) || { factor: 1, label: '' };
            const u = urgency.find((x) => x.id === state.urgency) || { factor: 1, label: '' };
            if (!s) return null;
            const n = Math.max(1, Math.min(999, parseInt(state.qty, 10) || 1));
            const round = (v) => Math.round(v / 50) * 50;
            const f = c.factor * u.factor;
            const min = round(s.min * n * f);
            const max = typeof s.max === 'number' ? round(s.max * n * f) : null;
            const text = (!E.currency || E.currency === 'KES') ? rangeText(min, max) : (max == null ? 'From ' + money(min, E.currency) : money(min, E.currency) + ' – ' + max.toLocaleString('en-US'));
            return { s, c, u, n, min, max, text };
        }

        function update() {
            const r = current();
            if (!r) return;
            $('#est-qty-label').textContent = r.s.unit || 'Quantity';
            $('#est-price').textContent = r.text;
            $('#est-breakdown').innerHTML =
                '<div><dt>Service</dt><dd>' + esc(r.s.label) + '</dd></div>' +
                '<div><dt>Starting price</dt><dd>' + money(r.s.min, E.currency) + '</dd></div>' +
                '<div><dt>Quantity</dt><dd>' + r.n + '</dd></div>' +
                (r.c.label ? '<div><dt>Complexity</dt><dd>' + esc(r.c.label) + '</dd></div>' : '') +
                (r.u.label ? '<div><dt>Deadline</dt><dd>' + esc(r.u.label) + '</dd></div>' : '');
            $('#est-brief').dataset.brief = state.cat === 'graphic' ? 'Graphic Design' : 'Engineering Design';
        }

        estSection.addEventListener('change', (e) => {
            const t = e.target;
            if (t.name === 'est-cat') { state.cat = t.value; fillServices(); }
            else if (t === svcSelect) state.service = t.value;
            else if (t.name === 'est-complexity') state.complexity = t.value;
            else if (t.name === 'est-urgency') state.urgency = t.value;
            update();
        });
        qty.addEventListener('input', () => { state.qty = qty.value; update(); });
        estSection.addEventListener('click', (e) => {
            const b = e.target.closest('.stepper-btn');
            if (!b) return;
            qty.value = Math.max(1, Math.min(999, (parseInt(qty.value, 10) || 1) + +b.dataset.step));
            state.qty = qty.value;
            update();
        });
        $('#est-add').addEventListener('click', () => {
            const r = current();
            if (!r) return;
            const cat = E.categories.find((x) => x.id === state.cat);
            addItem({
                title: r.s.label,
                detail: [r.n + ' × ' + (r.s.unit || 'unit').replace(/^Number of /i, '').replace(/^Area \(square metres\)$/, 'm²'),
                    r.c.label, r.u.label ? r.u.label + ' deadline' : ''].filter(Boolean).join(' · '),
                estimate: r.text,
                min: r.min, max: r.max,
                icon: state.cat === 'graphic' ? 'brush' : state.cat === 'training' ? 'cap' : 'cube',
                tone: state.cat === 'graphic' ? 'coral' : state.cat === 'training' ? 'teal' : 'blue',
                category: cat ? cat.label : ''
            });
            track('estimate-added');
        });

        fillServices();
        document.addEventListener('currencychange', update);
        update();
    }

    /* ======================================================================
       BOOKING CALENDAR (Calendly / Google appointment page)
       ====================================================================== */
    const bookingUrl = (CONFIG.bookingUrl || '').trim();
    const bModal = $('#booking-modal');
    if (bookingUrl && bModal) {
        $$('[data-booking], [data-booking-item]').forEach((el) => { el.hidden = false; });
        $('#booking-open').href = bookingUrl;
        // Calendly and Google "embed" links (with gv=true) can be shown inside the site;
        // other links (e.g. calendar.app.google short links) open in a new tab.
        const embeddable = /calendly\.com|[?&]gv=true/.test(bookingUrl);
        let src = bookingUrl;
        if (/calendly\.com/.test(bookingUrl)) {
            src += (bookingUrl.indexOf('?') > -1 ? '&' : '?') + 'embed_type=Inline&hide_gdpr_banner=1&embed_domain=' + encodeURIComponent(location.hostname);
        }
        let bReturn = null;
        const openBooking = () => {
            if (!embeddable) {
                track('booking-opened');
                window.open(bookingUrl, '_blank', 'noopener');
                return;
            }
            bReturn = document.activeElement;
            const frame = $('#booking-frame');
            if (!frame.firstChild) frame.innerHTML = '<iframe src="' + esc(src) + '" title="Booking calendar" loading="lazy"></iframe>';
            bModal.classList.add('is-open');
            bModal.setAttribute('aria-hidden', 'false');
            lock();
            track('booking-opened');
        };
        const closeBooking = () => {
            if (!bModal.classList.contains('is-open')) return;
            bModal.classList.remove('is-open');
            bModal.setAttribute('aria-hidden', 'true');
            unlock();
            if (bReturn) bReturn.focus({ preventScroll: true });
        };
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-booking]')) { e.preventDefault(); openBooking(); }
            else if (e.target.closest('[data-booking-close]')) closeBooking();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBooking(); });
    }

    /* ======================================================================
       INSTAGRAM FEED (Behold.so JSON feed)
       ====================================================================== */
    const igGrid = $('#insta-grid');
    const handle = CONFIG.instagramHandle || 'e_d_i_s_o_n_engineer';
    const profile = 'https://www.instagram.com/' + handle + '/';

    function followCard() {
        igGrid.classList.add('is-follow');
        igGrid.innerHTML =
            '<a class="insta-follow" href="' + profile + '" target="_blank" rel="noopener">' +
                '<span class="insta-follow-icon">' + icon('instagram') + '</span>' +
                '<span class="insta-follow-copy"><strong>Follow @' + esc(handle) + '</strong>' +
                '<span>Behind-the-scenes CAD work, new designs and webinar updates.</span></span>' +
                '<span class="btn btn-sun">Follow on Instagram ' + icon('arrow') + '</span>' +
            '</a>';
    }

    function renderPosts(list) {
        const posts = (list || []).slice(0, 6);
        if (!posts.length) return false;
        igGrid.classList.remove('is-follow');
        igGrid.innerHTML = posts.map((p) => {
            const img = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
            const caption = (p.prunedCaption || p.caption || '').slice(0, 120);
            const video = p.mediaType === 'VIDEO' || p.isReel;
            return '<a class="insta-post" href="' + esc(p.permalink || profile) + '" target="_blank" rel="noopener">' +
                '<img src="' + esc(img) + '" alt="' + esc(caption ? '' : (p.altText || 'Instagram post')) + '" loading="lazy">' +
                (video ? '<span class="insta-badge">' + icon('play') + '</span>' : '') +
                '<span class="insta-overlay">' + icon('instagram') + (caption ? '<span>' + esc(caption) + '</span>' : '') + '</span>' +
            '</a>';
        }).join('');
        return true;
    }
    const fallback = () => { if (!renderPosts(window.INSTAGRAM_SNAPSHOT)) followCard(); };

    if (igGrid) {
        const feed = (CONFIG.instagramFeedUrl || '').trim();
        if (!feed) {
            fallback();
        } else {
            const ctrl = 'AbortController' in window ? new AbortController() : null;
            const timer = setTimeout(() => ctrl && ctrl.abort(), 8000);
            fetch(feed, ctrl ? { signal: ctrl.signal } : {})
                .then((r) => r.json())
                .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then((data) => { if (!renderPosts(Array.isArray(data) ? data : data.posts)) fallback(); })
                .catch(fallback)
                .finally(() => clearTimeout(timer));
        }
    }
})();
