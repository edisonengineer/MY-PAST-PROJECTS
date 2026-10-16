/* =========================================================================
   Language switch (English / Français / Kiswahili)

   The page is written in English. When another language is selected, every
   piece of visible text found in its dictionary (js/i18n-fr.js,
   js/i18n-sw.js) is swapped for the translation, including text added later
   (project windows, form messages...). Switching back restores the English.

   To change a translation, edit the dictionary file. Missing entries simply
   stay in English, so new content never breaks the page.

   The dictionaries are only downloaded when French or Kiswahili is chosen
   (their paths are on this script's tag: data-fr / data-sw), so English
   visitors don't load them.
   ========================================================================= */
(function () {
    'use strict';

    const LANGS = ['en', 'fr', 'sw'];
    const DICT = { fr: window.I18N_FR || null, sw: window.I18N_SW || null };
    const PATTERNS = { fr: window.I18N_FR_PATTERNS || [], sw: window.I18N_SW_PATTERNS || [] };
    const me = document.currentScript;
    const loading = {};
    // Downloads a dictionary the first time its language is needed
    function load(l) {
        if (l === 'en' || DICT[l]) return Promise.resolve();
        if (loading[l]) return loading[l];
        const src = me && me.dataset[l];
        loading[l] = new Promise((resolve) => {
            if (!src) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.onload = s.onerror = () => {
                const U = l.toUpperCase();
                DICT[l] = window['I18N_' + U] || null;
                PATTERNS[l] = window['I18N_' + U + '_PATTERNS'] || [];
                if (!DICT[l]) delete loading[l];   // failed (offline?): allow another try
                resolve();
            };
            document.head.appendChild(s);
        });
        return loading[l];
    }
    const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
    const SKIP = 'script, style, noscript, textarea, [data-no-i18n], .brand-text, .marquee, code';
    const textState = new WeakMap();   // text node -> { en, tr }
    const attrState = new WeakMap();   // element   -> { attr: { en, tr } }
    const norm = (s) => s.replace(/\s+/g, ' ').trim();

    let lang = 'en';
    let observer = null;

    function translate(en, to) {
        const key = norm(en);
        if (!key || to === 'en') return null;
        const dict = DICT[to] || {};
        if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
        for (const [re, rep] of PATTERNS[to] || []) {
            if (re.test(key)) return key.replace(re, rep);
        }
        return null;
    }

    function skipped(node) {
        const el = node.nodeType === 1 ? node : node.parentElement;
        return !el || !!el.closest(SKIP);
    }

    function doText(node) {
        if (skipped(node)) return;
        const cur = node.nodeValue;
        let st = textState.get(node);
        // The page changed this text since we last touched it: treat it as new English
        if (st && cur !== st.tr && cur !== st.en) st = null;
        const en = st ? st.en : cur;
        if (lang === 'en') {
            if (st && cur !== st.en) node.nodeValue = st.en;
            return;
        }
        const tr = translate(en, lang);
        if (tr == null) return;
        const lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
        const out = lead + tr + trail;
        textState.set(node, { en, tr: out });
        if (cur !== out) node.nodeValue = out;
    }

    function doAttrs(el) {
        // A textarea's own text is the visitor's input, but its placeholder can be translated
        if (el.tagName === 'TEXTAREA' ? (el.parentElement && skipped(el.parentElement)) : skipped(el)) return;
        let st = attrState.get(el);
        ATTRS.forEach((a) => {
            if (!el.hasAttribute(a)) return;
            const cur = el.getAttribute(a);
            let s = st && st[a];
            if (s && cur !== s.tr && cur !== s.en) s = null;
            const en = s ? s.en : cur;
            if (lang === 'en') { if (s && cur !== s.en) el.setAttribute(a, s.en); return; }
            const tr = translate(en, lang);
            if (tr == null) return;
            if (!st) { st = {}; attrState.set(el, st); }
            st[a] = { en, tr };
            if (cur !== tr) el.setAttribute(a, tr);
        });
    }

    function walk(root) {
        if (!root) return;
        if (root.nodeType === 3) { doText(root); return; }
        if (root.nodeType !== 1) return;
        doAttrs(root);
        const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let n;
        while ((n = tw.nextNode())) n.nodeType === 3 ? doText(n) : doAttrs(n);
    }

    let titleEn = null, descEn = null;
    function apply() {
        if (observer) observer.disconnect();
        walk(document.body);
        // Page title + description
        const desc = document.querySelector('meta[name="description"]');
        if (titleEn === null) titleEn = document.title;
        if (desc && descEn === null) descEn = desc.content;
        document.title = (lang !== 'en' && translate(titleEn, lang)) || titleEn;
        if (desc) desc.content = (lang !== 'en' && translate(descEn, lang)) || descEn;
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
        observe();
    }

    function observe() {
        if (!observer) {
            observer = new MutationObserver((records) => {
                observer.disconnect();
                records.forEach((r) => {
                    if (r.type === 'characterData') doText(r.target);
                    else if (r.type === 'attributes') doAttrs(r.target);
                    else r.addedNodes.forEach(walk);
                });
                observe();
            });
        }
        observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }

    function setLang(next, save) {
        if (LANGS.indexOf(next) < 0) return;
        if (next !== 'en' && !DICT[next]) {
            document.documentElement.classList.add('i18n-loading');
            load(next).then(() => {
                document.documentElement.classList.remove('i18n-loading');
                if (DICT[next]) setLang(next, save);
            });
            return;
        }
        lang = next;
        if (save) { try { localStorage.setItem('lang', next); } catch (e) { /* storage blocked */ } }
        apply();
        document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    }

    window.I18N = {
        get lang() { return lang; },
        set: (l) => setLang(l, true),
        t: (en) => (lang === 'en' ? en : translate(en, lang) || en)
    };

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lang]');
        if (b) setLang(b.dataset.lang, true);
    });

    // Initial language: ?lang=fr / ?lang=sw in the link, then the visitor's last choice
    let initial = 'en';
    const q = new URLSearchParams(location.search).get('lang');
    try { initial = localStorage.getItem('lang') || initial; } catch (e) { /* storage blocked */ }
    if (q === 'fr' || q === 'sw' || q === 'en') initial = q;
    if (LANGS.indexOf(initial) < 0) initial = 'en';
    if (initial !== 'en') load(initial);   // start downloading now, while the page finishes loading
    document.addEventListener('DOMContentLoaded', () => setLang(initial, false));
})();
