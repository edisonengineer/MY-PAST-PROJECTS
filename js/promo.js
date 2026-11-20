/* =========================================================================
   CAMPAIGN POPUP: the poster set in the "Campaigns" tab of the Google Sheet
   (Black November, a new training cohort, a special offer...).

   It arrives with the reviews and Settings the homepage already loads
   (js/live-data.js), so it costs no extra request. Its text is translated
   by the sheet's Translations tab like everything else.

   "Show it" in the sheet decides how often a visitor sees it:
     Once per visit · Once a day · Once a week · Every page view
   A new campaign name or start date shows it again to people who closed it.

   Test a campaign before its start date:  ?promo=preview
   Hide it while you work on the site:     ?promo=off
   ========================================================================= */
(function () {
    'use strict';
    if (!window.LiveData) return;

    const q = new URLSearchParams(location.search).get('promo');
    if (q === 'off') return;
    const preview = q === 'preview';
    const KEY = 'promo-seen:';
    const WAIT = { 'Once a day': 864e5, 'Once a week': 7 * 864e5 };

    const today = () => {
        try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); }
    };
    function seen(c) {
        if (c.show === 'Every page view') return false;
        try {
            if (c.show === 'Once per visit' || !WAIT[c.show]) return sessionStorage.getItem(KEY + c.id) === '1';
            const t = Number(localStorage.getItem(KEY + c.id));
            return t > 0 && Date.now() - t < WAIT[c.show];
        } catch (e) { return false; }   // storage blocked: show it
    }
    function remember(c) {
        try {
            if (c.show === 'Once per visit' || !WAIT[c.show]) sessionStorage.setItem(KEY + c.id, '1');
            else localStorage.setItem(KEY + c.id, String(Date.now()));
        } catch (e) { /* storage blocked */ }
    }
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

    function link(c) {
        const cfg = window.SITE_CONFIG || {};
        if (c.link === 'whatsapp' && cfg.whatsapp) {
            return { href: 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('Hi Edison, I saw "' + c.title + '" on your website and would like to know more.'), external: true };
        }
        if (/^#open:[\w-]+$/.test(c.link)) return { modal: c.link.slice(6) };
        if (/^https:\/\//i.test(c.link)) return { href: c.link, external: true };
        return { href: c.link && c.link !== 'whatsapp' ? c.link : '#brief' };
    }

    function show(c) {
        if (window.I18N && c.i18n) { window.I18N.add('fr', c.i18n.fr); window.I18N.add('sw', c.i18n.sw); }

        const modal = el('div', 'modal promo-modal');
        modal.id = 'promo-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'promo-title');
        const backdrop = el('div', 'modal-backdrop');
        const panel = el('div', 'modal-panel promo-panel');
        const close = el('button', 'modal-close');
        close.type = 'button';
        close.setAttribute('aria-label', 'Close');
        close.innerHTML = '<svg aria-hidden="true"><use href="#i-close"/></svg>';
        panel.appendChild(close);

        if (c.image) {
            const fig = el('div', 'promo-media');
            const img = new Image();
            img.alt = c.title || c.badge || '';
            img.decoding = 'async';
            img.onerror = () => { fig.remove(); panel.classList.add('no-image'); };   // e.g. a Drive file that isn't shared publicly
            img.src = c.image;
            fig.appendChild(img);
            panel.appendChild(fig);
        } else panel.classList.add('no-image');

        const body = el('div', 'promo-body');
        if (c.badge) body.appendChild(el('p', 'promo-badge', c.badge));
        const h = el('h2', 'promo-title', c.title || c.badge || '');
        h.id = 'promo-title';
        body.appendChild(h);
        String(c.text || '').split(/\n+/).map((t) => t.trim()).filter(Boolean).forEach((t) => body.appendChild(el('p', 'promo-text', t)));
        const actions = el('div', 'promo-actions');
        if (c.button) {
            const L = link(c);
            const cta = el('a', 'btn btn-sun btn-lg promo-cta', c.button);
            cta.href = L.href || '#';
            if (L.external) { cta.target = '_blank'; cta.rel = 'noopener'; }
            if (L.modal) cta.setAttribute('data-open-modal', L.modal);
            cta.addEventListener('click', () => {
                if (window.track) window.track('promo-click');
                hide();
            });
            actions.appendChild(cta);
        }
        const later = el('button', 'promo-later', 'Maybe later');
        later.type = 'button';
        actions.appendChild(later);
        body.appendChild(actions);
        panel.appendChild(body);
        modal.append(backdrop, panel);
        document.body.appendChild(modal);

        const opener = document.activeElement;
        const prevOverflow = document.documentElement.style.overflow;
        function onKey(e) {
            if (e.key === 'Escape') hide();
            if (e.key === 'Tab') {   // keep keyboard focus inside the popup
                const f = [...panel.querySelectorAll('a[href], button')];
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }
        function hide() {
            if (!modal.isConnected) return;
            remember(c);
            modal.classList.remove('is-open');
            document.documentElement.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
            setTimeout(() => modal.remove(), 400);
            if (opener && opener.focus) opener.focus({ preventScroll: true });
        }
        close.addEventListener('click', hide);
        backdrop.addEventListener('click', hide);
        later.addEventListener('click', hide);
        document.addEventListener('keydown', onKey);

        requestAnimationFrame(() => {
            modal.classList.add('is-open');
            document.documentElement.style.overflow = 'hidden';
            (panel.querySelector('.promo-cta') || close).focus({ preventScroll: true });
        });
        if (window.track) window.track('promo-shown');
    }

    window.LiveData.then((d) => {
        const c = d && d.campaign;
        if (!c || !c.id || !(c.title || c.badge)) return;
        const now = today();
        if (!preview && ((c.start && c.start > now) || (c.end && c.end < now) || seen(c))) return;
        // Don't interrupt someone who is already in another popup or filling in the brief
        const busy = () => document.querySelector('.modal.is-open') || (document.activeElement && document.activeElement.closest('form'));
        const delay = Math.min(30, Math.max(0, Number(c.delay) || 0)) * 1000;
        let tries = 0;
        function attempt() {
            if (busy()) { if (tries++ < 20) setTimeout(attempt, 3000); return; }   // wait up to a minute, then give up for this visit
            show(c);
        }
        setTimeout(attempt, delay);
    }).catch(() => { /* no campaign */ });
})();
