/* =========================================================================
   Shared behaviour for the project and CAD Tips pages:
   header, theme, menu, email links, gallery + image viewer, offline app.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    /* ---------- Header + progress bar ---------- */
    const header = $('#site-header');
    const progress = $('#scroll-progress');
    let ticking = false;
    function onScroll() {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle('is-scrolled', y > 10);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* ---------- Light / dark theme ---------- */
    const themeBtn = $('#theme-toggle');
    const themeMeta = $('meta[name="theme-color"]');
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        if (themeMeta) themeMeta.content = t === 'dark' ? '#0a1128' : '#0e1a3a';
    }
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    themeBtn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
    });

    /* ---------- Mobile menu ---------- */
    const menuBtn = $('#menu-toggle');
    const nav = $('#site-nav');
    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        header.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    window.addEventListener('resize', () => { if (window.innerWidth > 1280) setMenu(false); });

    /* ---------- Footer year + email links (address assembled on click) ---------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
    $$('.js-email').forEach((link) => link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'mailto:' + link.dataset.user + '@' + link.dataset.domain + '?subject=' + encodeURIComponent('Project enquiry via your portfolio');
    }));

    /* ---------- Buttons that need a file: only shown once it exists ---------- */
    $$('[data-if-exists]').forEach((el) => {
        fetch(el.getAttribute('href'), { method: 'HEAD', cache: 'no-store' })
            .then((r) => { if (r.ok && !/text\/html/.test(r.headers.get('content-type') || '')) el.hidden = false; })
            .catch(() => {});
    });

    /* ---------- Project gallery: hide images that aren't uploaded yet ---------- */
    const gallery = $('[data-gallery]');
    const lb = $('#lightbox');
    if (gallery) {
        const grid = $('.case-gallery', gallery);
        const shots = $$('.case-shot', grid);
        let pending = shots.length;
        const done = () => {
            if (--pending > 0) return;
            const ok = $$('.case-shot', grid);
            if (!ok.length) return;
            ok.forEach((b, i) => { b.dataset.i = i; });
            grid.hidden = false;
            grid.classList.toggle('is-single', ok.length === 1);
            $('[data-cover]', gallery).hidden = true;
        };
        shots.forEach((b) => {
            const img = $('img', b);
            const fail = () => { b.remove(); done(); };
            if (img.complete) { img.naturalWidth ? done() : fail(); return; }
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', fail, { once: true });
            img.loading = 'eager';
        });

        grid.addEventListener('click', (e) => {
            const b = e.target.closest('.case-shot');
            if (b) openLightbox($$('.case-shot img', grid).map((i) => i.src), +b.dataset.i, gallery.dataset.title, b);
        });
    }

    /* ---------- Image viewer ---------- */
    let list = [], index = 0, returnTo = null;
    const lbImg = $('#lightbox-img');
    function show(i) {
        index = (i + list.length) % list.length;
        lbImg.classList.remove('is-loaded');
        lbImg.src = list[index];
        lbImg.alt = $('#lightbox-title').textContent + ', image ' + (index + 1);
        $('#lightbox-count').textContent = list.length > 1 ? (index + 1) + ' / ' + list.length : '';
    }
    function openLightbox(srcs, start, title, from) {
        list = srcs; returnTo = from || null;
        $('#lightbox-title').textContent = title || '';
        lb.classList.toggle('is-single', list.length < 2);
        show(start || 0);
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        $('#lightbox-close').focus({ preventScroll: true });
    }
    function closeLightbox() {
        if (!lb.classList.contains('is-open')) return;
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        if (returnTo) returnTo.focus({ preventScroll: true });
    }
    if (lb) {
        lbImg.addEventListener('load', () => lbImg.classList.add('is-loaded'));
        $('#lightbox-close').addEventListener('click', closeLightbox);
        $('#lightbox-prev').addEventListener('click', () => show(index - 1));
        $('#lightbox-next').addEventListener('click', () => show(index + 1));
        lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox-stage')) closeLightbox(); });
        let touchX = null;
        lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', (e) => {
            if (touchX === null || list.length < 2) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
            touchX = null;
        });
    }
    document.addEventListener('keydown', (e) => {
        if (lb && lb.classList.contains('is-open')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight' && list.length > 1) show(index + 1);
            else if (e.key === 'ArrowLeft' && list.length > 1) show(index - 1);
            return;
        }
        if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    /* ---------- Forms sent with Web3Forms (training seat requests) ---------- */
    const tr = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    $$('form[data-web3]').forEach((form) => {
        const err = $('.form-error', form);
        const done = form.parentElement.querySelector('.form-done');
        const submit = $('button[type="submit"]', form);
        const label = submit.textContent;
        const showError = (msg) => { err.textContent = tr(msg); err.hidden = false; };
        function check() {
            let bad = 0;
            $$('[required]', form).forEach((f) => {
                const ok = f.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()) : !!f.value.trim();
                f.closest('.field').classList.toggle('is-invalid', !ok);
                if (!ok) bad++;
            });
            if (bad) { showError('Please fill in the highlighted fields.'); $('.is-invalid input, .is-invalid select', form).focus(); }
            return !bad;
        }
        form.addEventListener('input', (e) => {
            const f = e.target.closest('.field');
            if (f) f.classList.remove('is-invalid');
            if (!$('.is-invalid', form)) err.hidden = true;
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            err.hidden = true;
            if (!check()) return;
            const data = Object.fromEntries(new FormData(form).entries());
            if (form.botcheck && form.botcheck.checked) return;
            delete data.botcheck;
            data.replyto = data.email;
            submit.disabled = true;
            submit.textContent = tr('Sending…');
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data)
            })
                .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok && j.success !== false, j })))
                .then(({ ok, j }) => {
                    if (!ok) throw new Error(j.message || 'error');
                    form.hidden = true;
                    done.hidden = false;
                    done.focus();
                    if (typeof window.track === 'function') window.track('training-seat-request');
                })
                .catch(() => showError('Sorry, that didn\'t go through. Please try again or send it on WhatsApp.'))
                .finally(() => { submit.disabled = false; submit.textContent = label; });
        });
        const wa = $('[data-wa-form]', form);
        if (wa) wa.addEventListener('click', () => {
            const d = new FormData(form);
            const lines = ['Hi Edison, I would like to reserve a seat for CAD training.'];
            ['name', 'Course', 'Level', 'Format', 'Preferred schedule', 'Message'].forEach((k) => {
                const v = (d.get(k) || '').toString().trim();
                if (v) lines.push((k === 'name' ? 'Name' : k) + ': ' + v);
            });
            window.open('https://wa.me/254708639473?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
        });
    });
    // "Reserve a seat" on a course card picks that course in the form
    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-course]');
        const sel = document.getElementById('tr-course');
        if (b && sel) sel.value = b.dataset.course;
    });

    /* ---------- Offline app ---------- */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));
    }
})();
