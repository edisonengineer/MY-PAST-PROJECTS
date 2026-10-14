/* =========================================================================
   KES / USD price switch
   Prices are written in Kenyan shillings everywhere on the site. Visitors
   can switch to approximate US dollars; the rate is in js/config.js
   (currency.usdRate). Any element with data-kes="1000" shows that amount
   in the chosen currency (add data-kes-max for a range, data-kes-from to
   prefix "From").
   ========================================================================= */
(function () {
    'use strict';

    const CFG = (window.SITE_CONFIG || {}).currency || {};
    const RATE = Number(CFG.usdRate) || 0;
    const ALLOW = CFG.allowUsd !== false && RATE > 0;

    function initial() {
        if (!ALLOW) return 'KES';
        const q = new URLSearchParams(location.search).get('currency');
        if (q && /^(kes|usd)$/i.test(q)) return q.toUpperCase();
        try { const s = localStorage.getItem('currency'); if (s === 'KES' || s === 'USD') return s; } catch (e) { /* storage blocked */ }
        // First visit: visitors outside Africa see dollars, everyone else shillings
        try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; if (tz && !/^Africa\//.test(tz)) return 'USD'; } catch (e) { /* old browser */ }
        return 'KES';
    }

    let code = initial();
    const usd = (kes) => { const v = kes / RATE; return v < 100 ? Math.ceil(v) : Math.ceil(v / 5) * 5; };
    const num = (n) => Math.round(n).toLocaleString('en-US');

    function fmt(kes, forceCode) {
        const c = forceCode || code;
        return c === 'USD' ? 'USD ' + num(usd(kes)) : 'KES ' + num(kes);
    }
    function range(min, max, forceCode) {
        if (max == null) return 'From ' + fmt(min, forceCode);
        if (max === min) return fmt(min, forceCode);
        const c = forceCode || code;
        return fmt(min, c) + ' – ' + num(c === 'USD' ? usd(max) : max);
    }

    function paint(root) {
        (root || document).querySelectorAll('[data-kes]').forEach((el) => {
            const min = +el.dataset.kes;
            if (!min && min !== 0) return;
            const max = el.dataset.kesMax ? +el.dataset.kesMax : null;
            el.textContent = (el.hasAttribute('data-kes-from') ? 'From ' : '') + (max != null ? range(min, max) : fmt(min));
        });
        document.querySelectorAll('[data-currency]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.currency === code)));
        document.querySelectorAll('[data-usd-note]').forEach((n) => { n.hidden = code !== 'USD'; });
        document.querySelectorAll('[data-usd-rate]').forEach((n) => { n.textContent = num(RATE); });
    }

    function set(next, save) {
        if (next !== 'KES' && next !== 'USD') return;
        if (next === 'USD' && !ALLOW) return;
        code = next;
        if (save) { try { localStorage.setItem('currency', next); } catch (e) { /* storage blocked */ } }
        paint();
        document.dispatchEvent(new CustomEvent('currencychange', { detail: { code } }));
    }

    window.Currency = {
        get code() { return code; },
        rate: RATE,
        fmt, range, paint,
        set: (c) => set(c, true)
    };

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-currency]');
        if (b) { set(b.dataset.currency, true); if (typeof window.track === 'function') window.track('currency-' + b.dataset.currency.toLowerCase()); }
    });
    document.addEventListener('DOMContentLoaded', () => {
        if (!ALLOW) document.querySelectorAll('.currency-switch').forEach((s) => { s.hidden = true; });
        paint();
    });
    window.addEventListener('load', () => paint());
})();
