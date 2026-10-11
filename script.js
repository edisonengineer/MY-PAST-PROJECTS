/* =========================================================================
   Edison Ochieng | Portfolio interactions
   Header, mobile menu, smooth scroll, reveal-on-scroll, project filters,
   image fallbacks, lightbox and report buttons (opened via pdf-viewer.js).
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Header state ---------- */
    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Mobile menu ---------- */
    const menuToggle = $('#menu-toggle');
    const nav = $('#site-nav');

    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        header.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    /* ---------- Smooth scrolling for in-page links ---------- */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href');
        const target = id === '#top' ? document.body : $(id);
        if (!target) return;

        e.preventDefault();
        setMenu(false);
        const y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
        window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
    });

    /* ---------- Highlight the nav link for the section in view ---------- */
    const navLinks = $$('.site-nav a[href^="#"]');
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        navLinks.forEach((a) => {
            const section = $(a.getAttribute('href'));
            if (section) spy.observe(section);
        });
    }

    /* ---------- Gentle fade-in on scroll ---------- */
    const revealEls = $$('[data-reveal]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const revealer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealEls.forEach((el) => revealer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Project filters ---------- */
    const filters = $$('.filter');
    const workItems = $$('.work-item');

    filters.forEach((btn) => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.filter;
            filters.forEach((b) => {
                const active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-pressed', String(active));
            });
            workItems.forEach((item) => {
                const show = category === 'all' || item.dataset.category === category;
                item.classList.toggle('is-hidden', !show);
                if (show) {
                    // Replay the soft fade for items coming back into view
                    item.classList.remove('is-visible');
                    requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add('is-visible')));
                }
            });
        });
    });

    /* ---------- Placeholder when a cover image hasn't been uploaded yet ---------- */
    function markPlaceholder(img) {
        const media = img.closest('.work-media');
        if (!media) return;
        media.classList.add('is-placeholder');
        media.setAttribute('aria-disabled', 'true');
        media.setAttribute('aria-label', (media.dataset.title || 'Project') + ' (images coming soon)');
    }
    $$('.work-media img').forEach((img) => {
        if (img.complete && img.naturalWidth === 0 && img.currentSrc) markPlaceholder(img);
        img.addEventListener('error', () => markPlaceholder(img), { once: true });
    });

    /* ---------- Lightbox ---------- */
    const lightbox = $('#lightbox');
    const lbImg = $('#lightbox-img');
    const lbTitle = $('#lightbox-title');
    const lbCount = $('#lightbox-count');
    let images = [];
    let index = 0;
    let lastFocus = null;

    function showImage(i) {
        index = (i + images.length) % images.length;
        lbImg.classList.remove('is-loaded');
        lbImg.src = images[index];
        lbImg.alt = lbTitle.textContent + ', image ' + (index + 1);
        lbCount.textContent = images.length > 1 ? (index + 1) + ' / ' + images.length : '';
        // Preload the neighbour so stepping through feels instant
        if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    }

    function openLightbox(media) {
        images = (media.dataset.gallery || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (!images.length) return;
        lastFocus = media;
        lbTitle.textContent = media.dataset.title || '';
        lightbox.classList.toggle('is-single', images.length === 1);
        showImage(0);
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        $('#lightbox-close').focus({ preventScroll: true });
    }

    function closeLightbox() {
        if (!lightbox.classList.contains('is-open')) return;
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    lbImg.addEventListener('load', () => lbImg.classList.add('is-loaded'));
    lbImg.addEventListener('error', () => {
        // Skip images that are missing from a gallery
        if (images.length > 1) {
            images.splice(index, 1);
            lightbox.classList.toggle('is-single', images.length === 1);
            showImage(index);
        }
    });

    $$('.work-media').forEach((media) => {
        media.addEventListener('click', () => {
            if (!media.classList.contains('is-placeholder')) openLightbox(media);
        });
    });

    $('#lightbox-close').addEventListener('click', closeLightbox);
    $('#lightbox-prev').addEventListener('click', () => showImage(index - 1));
    $('#lightbox-next').addEventListener('click', () => showImage(index + 1));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-stage')) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight' && images.length > 1) showImage(index + 1);
        else if (e.key === 'ArrowLeft' && images.length > 1) showImage(index - 1);
    });

    let touchX = null;
    lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        if (touchX === null || images.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) showImage(index + (dx < 0 ? 1 : -1));
        touchX = null;
    });

    /* ---------- Report buttons: appear once the PDF exists in pdfs/ ---------- */
    $$('.work-report[data-pdf]').forEach((btn) => {
        const file = btn.dataset.pdf;
        const title = btn.dataset.pdfTitle || btn.closest('.work-item').querySelector('.work-title').textContent;

        if (location.protocol !== 'file:') {
            fetch(file, { method: 'HEAD' })
                .then((res) => { if (res.ok) btn.hidden = false; })
                .catch(() => { /* not uploaded yet: keep hidden */ });
        }

        btn.addEventListener('click', () => {
            if (typeof window.openPdfWork === 'function') window.openPdfWork({ title, file });
            else window.open(file, '_blank', 'noopener');
        });
    });

    /* ---------- Footer year ---------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
