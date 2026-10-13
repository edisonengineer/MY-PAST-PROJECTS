/* =========================================================================
   Site search: press the magnifier, "/" or Ctrl+K.
   Searches projects, CAD Tips articles, services, FAQ and page sections.
   The list it searches (js/search-index.js) is built by tools/build-pages.js
   and only downloaded the first time someone opens search.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);

    // Site root, worked out from this script's own address (works on sub-pages too)
    const me = document.currentScript && document.currentScript.src;
    const ROOT = me ? me.replace(/js\/search\.js.*$/, '') : '';
    const here = location.href.split('#')[0].split('?')[0];
    const onHome = /\/(index\.html)?$/.test(here) && here.replace(/index\.html$/, '') === ROOT;

    const KIND = { project: 'Project', article: 'Article', service: 'Service', faq: 'FAQ', page: 'Section' };
    const SUGGEST = ['SolidWorks', 'AutoCAD', 'Simulation', 'Poster', 'Training', 'M-Pesa'];

    let box = null, input, list, status, items = [], active = -1, lastFocus = null, loading = null;

    function loadIndex() {
        if (window.SEARCH_INDEX) return Promise.resolve();
        if (loading) return loading;
        loading = new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = ROOT + 'js/search-index.js?v=' + Date.now().toString(36).slice(0, -4);
            s.onload = resolve;
            s.onerror = resolve;
            document.head.appendChild(s);
        });
        return loading;
    }

    function build() {
        box = document.createElement('div');
        box.className = 'search-overlay';
        box.id = 'site-search';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Search the site');
        box.hidden = true;
        box.innerHTML =
            '<div class="search-backdrop" data-search-close></div>' +
            '<div class="search-panel">' +
                '<div class="search-field">' +
                    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
                    '<input type="search" id="search-input" placeholder="Search projects, articles, services..." autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" aria-label="Search the site">' +
                    '<button type="button" class="search-close" data-search-close aria-label="Close search"><kbd>Esc</kbd></button>' +
                '</div>' +
                '<p class="search-status" id="search-status" aria-live="polite"></p>' +
                '<ul class="search-results" id="search-results" role="listbox" aria-label="Search results"></ul>' +
                '<div class="search-suggest" id="search-suggest"><span>Try</span>' +
                    SUGGEST.map((s) => '<button type="button" data-q="' + esc(s) + '" data-no-i18n>' + esc(s) + '</button>').join('') +
                '</div>' +
            '</div>';
        document.body.appendChild(box);
        input = $('#search-input', box);
        list = $('#search-results', box);
        status = $('#search-status', box);

        input.addEventListener('input', run);
        input.addEventListener('keydown', (e) => {
            const rows = list.querySelectorAll('a');
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!rows.length) return;
                setActive((active + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length);
            } else if (e.key === 'Enter' && rows.length) {
                e.preventDefault();
                rows[Math.max(active, 0)].click();
            }
        });
        box.addEventListener('click', (e) => {
            if (e.target.closest('[data-search-close]')) { close(); return; }
            const q = e.target.closest('[data-q]');
            if (q) { input.value = q.dataset.q; run(); input.focus(); return; }
            const a = e.target.closest('.search-results a');
            if (a) go(e, a);
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
            if (e.key === 'Tab') { // keep focus inside
                const f = [...box.querySelectorAll('input, button, a')].filter((el) => el.offsetParent !== null);
                if (!f.length) return;
                if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
            }
        });
    }

    function setActive(i) {
        const rows = list.querySelectorAll('a');
        rows.forEach((r, k) => r.setAttribute('aria-selected', String(k === i)));
        active = i;
        if (rows[i]) { input.setAttribute('aria-activedescendant', rows[i].id); rows[i].scrollIntoView({ block: 'nearest' }); }
    }

    function score(item, words) {
        const title = fold(item.t + ' ' + t(item.t));
        const desc = fold(item.d + ' ' + t(item.d));
        const extra = fold(item.x);
        let total = 0;
        for (const w of words) {
            let s = 0;
            if (title.split(/[^a-z0-9]+/).some((x) => x.startsWith(w))) s = 10;
            else if (title.includes(w)) s = 7;
            else if (desc.includes(w)) s = 4;
            else if (extra.includes(w)) s = 2;
            if (!s) return 0;
            total += s;
        }
        return total + ({ project: 1.5, article: 1.2, service: 1, page: 0.8, faq: 0.5 }[item.k] || 0);
    }

    function hrefFor(u) {
        if (onHome && u.startsWith('index.html#')) return u.slice(10);
        return ROOT + u;
    }

    function run() {
        const q = fold(input.value).trim();
        const words = q.split(/\s+/).filter(Boolean);
        $('#search-suggest', box).hidden = !!words.length;
        active = -1;
        input.removeAttribute('aria-activedescendant');
        if (!words.length) { list.innerHTML = ''; status.textContent = ''; input.setAttribute('aria-expanded', 'false'); return; }
        items = (window.SEARCH_INDEX || [])
            .map((it) => ({ it, s: score(it, words) }))
            .filter((r) => r.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 12)
            .map((r) => r.it);
        input.setAttribute('aria-expanded', String(items.length > 0));
        status.textContent = items.length ? '' : 'No results. Try another word, or ask me on WhatsApp.';
        list.innerHTML = items.map((it, i) =>
            '<li><a id="sr-' + i + '" role="option" aria-selected="false" href="' + esc(hrefFor(it.u)) + '" data-u="' + esc(it.u) + '">' +
                '<span class="sr-kind kind-' + esc(it.k) + '">' + esc(KIND[it.k] || 'Page') + '</span>' +
                '<span class="sr-text"><strong' + (it.k === 'article' ? ' data-no-i18n' : '') + '>' + esc(it.t) + '</strong>' +
                (it.d ? '<span' + (it.k === 'article' ? ' data-no-i18n' : '') + '>' + esc(it.d) + '</span>' : '') +
                (it.p ? '<em class="sr-price">' + esc(it.p) + '</em>' : '') + '</span>' +
            '</a></li>').join('');
        if (items.length) setActive(0);
    }

    function go(e, a) {
        const u = a.dataset.u;
        if (window.goatcounter && window.goatcounter.count) {
            try { window.goatcounter.count({ path: 'search-' + fold(input.value).slice(0, 40), title: 'Search', event: true }); } catch (err) { /* ignore */ }
        }
        if (onHome && u.startsWith('index.html#')) {
            e.preventDefault();
            close(false);
            const hash = u.slice(10);
            if (hash === '#pay') { const p = $('[data-open-modal="pay-modal"]'); if (p) p.click(); return; }
            const link = document.createElement('a');
            link.href = hash;
            link.hidden = true;
            document.body.appendChild(link);
            link.click();          // reuse the page's smooth scrolling
            link.remove();
            const target = document.getElementById(hash.slice(1));
            if (target && target.hidden) location.hash = hash;
        }
    }

    function open() {
        if (!box) build();
        lastFocus = document.activeElement;
        box.hidden = false;
        document.body.classList.add('no-scroll');
        requestAnimationFrame(() => box.classList.add('is-open'));
        input.focus();
        input.select();
        loadIndex().then(() => { if (input.value) run(); });
        const nav = document.getElementById('site-nav');
        const menuBtn = document.getElementById('menu-toggle');
        if (nav && nav.classList.contains('is-open') && menuBtn) menuBtn.click();
    }

    function close(restore = true) {
        if (!box || box.hidden) return;
        box.classList.remove('is-open');
        box.hidden = true;
        document.body.classList.remove('no-scroll');
        if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-search-open]')) { e.preventDefault(); open(); }
    });
    document.addEventListener('keydown', (e) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
        if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
            if (box && !box.hidden) return;
            e.preventDefault();
            open();
        }
    });
    // Links like index.html?q=autocad open search straight away
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) document.addEventListener('DOMContentLoaded', () => { open(); input.value = q0; loadIndex().then(run); });
})();
