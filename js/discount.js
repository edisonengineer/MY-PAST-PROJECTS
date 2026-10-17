/* =========================================================================
   Discount and referral codes on the website's forms (brief, quote cart,
   training). Typing a code checks it against the "Promo codes" and
   "Referrals" tabs of the Google Sheet and shows what it gives. The code is
   sent with the form and applied to the quote or invoice in the sheet.

   <input data-discount                      the code box
          data-discount-for="Training"       what it's for (or data-discount-for-radio="Service type")
          data-discount-email="#c-email"     who uses it (their own referral code = their reward)
          data-discount-price="4500">        optional: show the discounted price
   <p class="discount-msg" hidden></p>       the message, next to the box
   ========================================================================= */
(function () {
    'use strict';
    const C = window.SITE_CONFIG || {};
    const api = C.trackerApi || C.reviewsApi;
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = (n) => (window.Currency ? window.Currency.fmt(n) : 'KES ' + Math.round(n).toLocaleString('en-US'));
    const REASONS = {
        unknown: "This code isn't valid. Please check it.",
        expired: 'This code has expired.',
        inactive: "This code isn't active at the moment.",
        'used up': 'This code has already been fully used.',
        own: 'This is your own referral code. You can use it once a friend you referred has paid for their project.',
        busy: "The code couldn't be checked just now. I'll check it when I prepare your quote."
    };
    const state = {};
    window.Discount = { get: (id) => state[id] || null };

    function forOf(input) {
        if (input.dataset.discountForRadio) {
            const r = input.form && input.form.querySelector('input[name="' + input.dataset.discountForRadio + '"]:checked');
            return r ? r.value : '';
        }
        return input.dataset.discountFor || '';
    }

    function show(input, html, kind) {
        const msg = input.closest('.field').querySelector('.discount-msg');
        if (!msg) return;
        msg.className = 'discount-msg' + (kind ? ' is-' + kind : '');
        msg.innerHTML = html;
        msg.hidden = !html;
    }

    function done(input, result) {
        state[input.id] = result && result.valid ? result : null;
        input.dispatchEvent(new CustomEvent('discountchange', { bubbles: true, detail: state[input.id] }));
    }

    async function check(input) {
        const code = input.value.trim().toUpperCase();
        if (!code) { show(input, ''); done(input, null); return; }
        if (!api || code.length < 3) { show(input, ''); done(input, null); return; }
        if (input.dataset.checked === code + '|' + forOf(input)) return;
        input.dataset.checked = code + '|' + forOf(input);
        show(input, '<span class="spinner" aria-hidden="true"></span> ' + esc(t('Checking the code…')));
        const emailEl = input.dataset.discountEmail ? document.querySelector(input.dataset.discountEmail) : null;
        const q = new URLSearchParams({ action: 'code', c: code, for: forOf(input), email: emailEl ? emailEl.value.trim() : '' });
        try {
            const r = await (await fetch(api + (api.includes('?') ? '&' : '?') + q.toString())).json();
            if (input.value.trim().toUpperCase() !== code) return;   // changed meanwhile
            if (!r || !r.valid) {
                const reason = r && r.reason === 'not for this' && r.only
                    ? t('This code is only for') + ' ' + esc(r.only) + '.'
                    : esc(t(REASONS[(r && r.reason) || 'unknown'] || REASONS.unknown));
                show(input, reason, r && r.reason === 'busy' ? '' : 'bad');
                done(input, null);
                return;
            }
            const price = Number(input.dataset.discountPrice) || 0;
            const after = price ? Math.max(0, r.percent ? price * (1 - r.percent / 100) : price - r.amount) : 0;
            show(input, '<svg aria-hidden="true"><use href="#i-check"/></svg> <strong>' + esc(r.label) + '</strong> ' +
                (price ? '<span>' + esc(t('Starting price')) + '</span> <s>' + esc(money(price)) + '</s> <strong>' + esc(money(after)) + '</strong>'
                    : '<span>' + esc(t('will be applied to your quote.')) + '</span>'), 'good');
            done(input, r);
        } catch (e) {
            show(input, esc(t(REASONS.busy)));
            done(input, null);
        }
    }

    let timer;
    document.addEventListener('input', (e) => {
        const input = e.target.closest('[data-discount]');
        if (!input) return;
        clearTimeout(timer);
        timer = setTimeout(() => check(input), 700);
    });
    document.addEventListener('change', (e) => {
        const input = e.target.closest('[data-discount]');
        if (input) { clearTimeout(timer); check(input); return; }
        // The service or email changed: check the code again for it
        document.querySelectorAll('[data-discount]').forEach((el) => {
            const related = (el.dataset.discountEmail && e.target.matches(el.dataset.discountEmail)) || (el.dataset.discountForRadio && e.target.name === el.dataset.discountForRadio);
            if (el.value.trim() && related) { el.dataset.checked = ''; check(el); }
        });
    });
    document.addEventListener('currencychange', () => {
        document.querySelectorAll('[data-discount]').forEach((el) => { if (el.value.trim()) { el.dataset.checked = ''; check(el); } });
    });
    // A code in the link (e.g. ?code=TRAIN20) fills in the box
    const fromLink = new URLSearchParams(location.search).get('code');
    if (fromLink) {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-discount]').forEach((el) => { el.value = fromLink.slice(0, 30).toUpperCase(); check(el); });
        });
    }
})();
