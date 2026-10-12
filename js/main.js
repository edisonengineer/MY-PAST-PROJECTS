/* =========================================================================
   Edison Ochieng | Portfolio interactions
   Header, menu, smooth scroll, reveal animations, counters, role rotator,
   project cards + project window, lightbox, reports, contact form.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const WHATSAPP = '254708639473';

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';

    /* ---------- Scroll lock shared by the overlays ---------- */
    let locks = 0;
    const lock = () => { if (locks++ === 0) document.body.classList.add('no-scroll'); };
    const unlock = () => { locks = Math.max(0, locks - 1); if (!locks) document.body.classList.remove('no-scroll'); };
    window.Site = { lock, unlock };

    /* ---------- Header, progress bar, back-to-top ---------- */
    const header = $('#site-header');
    const progress = $('#scroll-progress');
    const fab = $('#fab-top');
    let ticking = false;
    function onScroll() {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle('is-scrolled', y > 10);
        progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        fab.classList.toggle('is-visible', y > window.innerHeight * 0.9);
        ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

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
    window.addEventListener('resize', () => { if (window.innerWidth > 960) setMenu(false); });

    /* ---------- Smooth scrolling for in-page links ---------- */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]:not(.js-email)');
        if (!link) return;
        const id = link.getAttribute('href');
        const target = id.length > 1 && document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        setMenu(false);
        if (link.dataset.service) presetService(link.dataset.service);
        const top = id === '#home' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight + 1;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', id === '#home' ? location.pathname + location.search : id);
    });

    /* ---------- Active nav link ---------- */
    const navLinks = $$('.site-nav a[href^="#"]:not(.nav-cta)');
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        ['home', 'services', 'work', 'experience', 'reviews', 'reports', 'brief', 'faq', 'contact'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) spy.observe(el);
        });
    }

    /* ---------- Rotating role in the hero ---------- */
    const rotator = $('#rotator');
    const roles = ['Mechanical Design Engineer', 'CAD Designer', 'Graphic Designer', 'CAD Trainer', 'Founder of Nexus CAD Studio'];
    if (rotator && !reduceMotion) {
        let r = 0;
        setInterval(() => {
            rotator.classList.add('is-out');
            setTimeout(() => {
                r = (r + 1) % roles.length;
                rotator.textContent = roles[r];
                rotator.classList.remove('is-out');
            }, 380);
        }, 2600);
    }

    /* ---------- Project cards (data from js/projects.js) ---------- */
    const PROJECTS = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
    const grid = $('#project-grid');
    const label = { engineering: 'Engineering', graphic: 'Graphic Design' };

    function cardHTML(p) {
        const tags = (p.tags || []).slice(0, 3).map((t) => '<li class="chip">' + esc(t) + '</li>').join('');
        return (
            '<article class="project-card theme-' + esc(p.theme || 'blue') + (p.featured ? ' is-featured' : '') + '" data-category="' + esc(p.category) + '" data-reveal>' +
                '<div class="pc-media">' +
                    '<div class="pc-cover" aria-hidden="true">' +
                        '<span class="pc-cover-icon">' + icon(p.icon || 'cube') + '</span>' +
                        '<span class="pc-cover-title">' + esc(p.title) + '</span>' +
                    '</div>' +
                    (p.cover ? '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async" oncontextmenu="return false;">' : '') +
                    '<span class="pc-badge">' + esc(label[p.category] || p.category) + '</span>' +
                    '<span class="pc-view">View project ' + icon('arrow') + '</span>' +
                '</div>' +
                '<div class="pc-body">' +
                    '<p class="pc-sub">' + esc(p.subtitle) + '</p>' +
                    '<h3><button class="pc-open" data-id="' + esc(p.id) + '">' + esc(p.title) + '</button></h3>' +
                    '<ul class="chip-row">' + tags + '</ul>' +
                '</div>' +
            '</article>'
        );
    }

    if (grid) {
        grid.innerHTML = PROJECTS.map(cardHTML).join('');
        $$('.project-card img', grid).forEach((img) => {
            const card = img.closest('.project-card');
            const ok = () => card.classList.add('has-image');
            const bad = () => img.remove();
            if (img.complete) { img.naturalWidth ? ok() : bad(); }
            img.addEventListener('load', ok, { once: true });
            img.addEventListener('error', bad, { once: true });
        });
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (!card) return;
            const id = card.querySelector('.pc-open').dataset.id;
            openProject(id, card.querySelector('.pc-open'));
        });
        // Soft spotlight that follows the cursor
        if (finePointer && !reduceMotion) {
            grid.addEventListener('pointermove', (e) => {
                const card = e.target.closest('.project-card');
                if (!card) return;
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
                card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
            });
        }
    }

    /* ---------- Filters ---------- */
    const filters = $$('.filter');
    filters.forEach((btn) => btn.addEventListener('click', () => {
        const cat = btn.dataset.filter;
        filters.forEach((b) => {
            const on = b === btn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', String(on));
        });
        $$('.project-card', grid).forEach((card) => {
            const show = cat === 'all' || card.dataset.category === cat;
            card.classList.toggle('is-hidden', !show);
            if (show) {
                card.classList.remove('is-visible');
                requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('is-visible')));
            }
        });
    }));

    /* ---------- Reveal on scroll + number counters ---------- */
    function countUp(el) {
        const end = parseInt(el.dataset.count, 10);
        if (reduceMotion || !end) { el.textContent = end; return; }
        const start = performance.now(), dur = 1400;
        const step = (t) => {
            const k = Math.min(1, (t - start) / dur);
            el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    const revealEls = $$('[data-reveal]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                en.target.classList.add('is-visible');
                $$('[data-count]', en.target).forEach(countUp);
                io.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Report availability (button only shows if the PDF exists) ---------- */
    const pdfChecks = new Map();
    function pdfExists(file) {
        if (!file || location.protocol === 'file:') return Promise.resolve(false);
        if (!pdfChecks.has(file)) {
            pdfChecks.set(file, fetch(file, { method: 'HEAD' }).then((r) => r.ok).catch(() => false));
        }
        return pdfChecks.get(file);
    }

    function imageLoads(src) {
        return new Promise((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im.naturalWidth > 0);
            im.onerror = () => resolve(false);
            im.src = src;
        });
    }

    /* ---------- Project window ---------- */
    const modal = $('#project-modal');
    const pm = {
        media: $('#pm-media'), cat: $('#pm-cat'), title: $('#pm-title'), sub: $('#pm-sub'),
        summary: $('#pm-summary'), points: $('#pm-points'), meta: $('#pm-meta'),
        tags: $('#pm-tags'), actions: $('#pm-actions')
    };
    let modalReturn = null;
    let modalToken = 0;

    function coverBlock(p, note) {
        return '<div class="pm-cover theme-' + esc(p.theme || 'blue') + '">' +
            '<span class="pc-cover-icon">' + icon(p.icon || 'cube') + '</span>' +
            '<span class="pm-cover-title">' + esc(p.title) + '</span>' +
            (note ? '<span class="pm-cover-note">' + esc(note) + '</span>' : '') +
        '</div>';
    }

    function openProject(id, trigger) {
        const p = PROJECTS.find((x) => x.id === id);
        if (!p) return;
        const token = ++modalToken;
        modalReturn = trigger || document.activeElement;

        pm.cat.textContent = (label[p.category] || p.category) + (p.year ? ' · ' + p.year : '');
        pm.cat.className = 'pm-cat cat-' + p.category;
        pm.title.textContent = p.title;
        pm.sub.textContent = p.subtitle || '';
        pm.summary.textContent = p.summary || '';
        pm.points.innerHTML = (p.points || []).map((t) => '<li>' + icon('check') + '<span>' + esc(t) + '</span></li>').join('');
        pm.meta.innerHTML = (p.meta || []).map((m) => '<div><dt>' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>').join('');
        pm.tags.innerHTML = (p.tags || []).map((t) => '<li class="chip">' + esc(t) + '</li>').join('');
        pm.media.innerHTML = coverBlock(p, '');
        pm.media.className = 'pm-media theme-' + esc(p.theme || 'blue');

        const msg = encodeURIComponent('Hi Edison, I saw your "' + p.title + '" project on your portfolio and would like to discuss a similar project.');
        pm.actions.innerHTML =
            '<a class="btn btn-green" href="https://wa.me/' + WHATSAPP + '?text=' + msg + '" target="_blank" rel="noopener">' + icon('whatsapp') + ' Discuss a similar project</a>';

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        lock();
        $('.modal-close', modal).focus({ preventScroll: true });
        $('.modal-panel', modal).scrollTop = 0;
        history.replaceState(null, '', '#project-' + p.id);

        // Gallery: only show images that actually exist
        const list = Array.from(new Set(p.gallery && p.gallery.length ? p.gallery : (p.cover ? [p.cover] : [])));
        Promise.all(list.map(imageLoads)).then((ok) => {
            if (token !== modalToken) return;
            const imgs = list.filter((_, i) => ok[i]);
            if (!imgs.length) {
                pm.media.innerHTML = coverBlock(p, 'Project images coming soon');
                return;
            }
            pm.media.className = 'pm-media has-images';
            pm.media.innerHTML =
                '<button class="pm-main" aria-label="View images full screen"><img src="' + esc(imgs[0]) + '" alt="' + esc(p.title) + '" oncontextmenu="return false;"><span class="pm-zoom">' + icon('image') + ' ' + imgs.length + (imgs.length > 1 ? ' images' : ' image') + '</span></button>' +
                (imgs.length > 1 ? '<div class="pm-thumbs">' + imgs.map((src, i) =>
                    '<button class="pm-thumb' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Image ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>').join('') + '</div>' : '');
            let current = 0;
            pm.media.onclick = (e) => {
                const th = e.target.closest('.pm-thumb');
                if (th) {
                    current = +th.dataset.i;
                    $('.pm-main img', pm.media).src = imgs[current];
                    $$('.pm-thumb', pm.media).forEach((b) => b.classList.toggle('is-active', b === th));
                    return;
                }
                if (e.target.closest('.pm-main')) openLightbox(imgs, current, p.title);
            };
            pm.actions.insertAdjacentHTML('beforeend', '<button class="btn btn-outline" data-act="images">' + icon('image') + ' View images</button>');
            $('[data-act="images"]', pm.actions).addEventListener('click', () => openLightbox(imgs, 0, p.title));
        });

        // Report button
        pdfExists(p.pdf).then((ok) => {
            if (!ok || token !== modalToken) return;
            pm.actions.insertAdjacentHTML('afterbegin', '<button class="btn btn-navy" data-act="pdf">' + icon('doc') + ' Read report</button>');
            $('[data-act="pdf"]', pm.actions).addEventListener('click', () => {
                closeProject(false);
                if (typeof window.openPdfWork === 'function') window.openPdfWork({ title: p.title + ': Report', file: p.pdf });
                else window.open(p.pdf, '_blank', 'noopener');
            });
        });
    }

    function closeProject(restoreFocus = true) {
        if (!modal.classList.contains('is-open')) return;
        modalToken++;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        unlock();
        history.replaceState(null, '', '#work');
        if (restoreFocus && modalReturn) modalReturn.focus({ preventScroll: true });
    }

    modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeProject(); });

    // Keep keyboard focus inside the project window
    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const f = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modal).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Shareable links: yoursite/#project-designathon-hub opens that project
    const hashMatch = location.hash.match(/^#project-(.+)$/);
    if (hashMatch && PROJECTS.some((p) => p.id === hashMatch[1])) {
        const work = $('#work');
        if (work) window.scrollTo(0, work.offsetTop - 60);
        setTimeout(() => openProject(hashMatch[1]), 250);
    }

    /* ---------- Lightbox ---------- */
    const lb = $('#lightbox');
    const lbImg = $('#lightbox-img');
    let lbList = [], lbIndex = 0;

    function lbShow(i) {
        lbIndex = (i + lbList.length) % lbList.length;
        lbImg.classList.remove('is-loaded');
        lbImg.src = lbList[lbIndex];
        lbImg.alt = $('#lightbox-title').textContent + ', image ' + (lbIndex + 1);
        $('#lightbox-count').textContent = lbList.length > 1 ? (lbIndex + 1) + ' / ' + lbList.length : '';
    }
    function openLightbox(list, start, title) {
        lbList = list;
        $('#lightbox-title').textContent = title || '';
        lb.classList.toggle('is-single', list.length < 2);
        lbShow(start || 0);
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        lock();
        $('#lightbox-close').focus({ preventScroll: true });
    }
    function closeLightbox() {
        if (!lb.classList.contains('is-open')) return;
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        unlock();
    }
    lbImg.addEventListener('load', () => lbImg.classList.add('is-loaded'));
    $('#lightbox-close').addEventListener('click', closeLightbox);
    $('#lightbox-prev').addEventListener('click', () => lbShow(lbIndex - 1));
    $('#lightbox-next').addEventListener('click', () => lbShow(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox-stage')) closeLightbox(); });
    let touchX = null;
    lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
        if (touchX === null || lbList.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
        touchX = null;
    });

    /* ---------- Keyboard ---------- */
    document.addEventListener('keydown', (e) => {
        const pdf = $('#pdf-viewer');
        if (pdf && pdf.classList.contains('active')) return; // pdf-viewer.js handles its own keys
        if (lb.classList.contains('is-open')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight' && lbList.length > 1) lbShow(lbIndex + 1);
            else if (e.key === 'ArrowLeft' && lbList.length > 1) lbShow(lbIndex - 1);
            return;
        }
        if (e.key === 'Escape') {
            if (modal.classList.contains('is-open')) closeProject();
            else if (nav.classList.contains('is-open')) setMenu(false);
        }
    });

    /* ---------- Email links: the address is assembled on click, never shown ---------- */
    const emailAddress = (el) => el.dataset.user + '@' + el.dataset.domain;
    $$('.js-email').forEach((link) => link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'mailto:' + emailAddress(link) + '?subject=' + encodeURIComponent('Project enquiry via your portfolio');
    }));

    /* ---------- Contact form: opens WhatsApp or email with the message ready ---------- */
    const form = $('#contact-form');
    const serviceSelect = $('#cf-service');
    function presetService(name) {
        if (!serviceSelect) return;
        const opt = Array.from(serviceSelect.options).find((o) => o.text === name);
        if (opt) serviceSelect.value = opt.value;
    }
    if (form) {
        let via = 'whatsapp';
        $$('[data-via]', form).forEach((b) => b.addEventListener('click', () => { via = b.dataset.via; }));
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.name.value.trim();
            const service = form.service.value;
            const message = form.message.value.trim();
            const err = $('#form-error');
            if (!name || !message) {
                err.hidden = false;
                (name ? form.message : form.name).focus();
                return;
            }
            err.hidden = true;
            const text = 'Hi Edison, my name is ' + name + '.\nI\'m interested in: ' + service + '.\n\n' + message;
            if (via === 'email') {
                const mailLink = $('.js-email');
                window.location.href = 'mailto:' + emailAddress(mailLink) +
                    '?subject=' + encodeURIComponent(service + ' enquiry from ' + name) +
                    '&body=' + encodeURIComponent(text);
            } else {
                window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
            }
        });
    }

    /* ---------- Footer year ---------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
