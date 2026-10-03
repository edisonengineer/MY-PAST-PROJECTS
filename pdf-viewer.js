/* =========================================================================
   PDF WORKS: flipbook viewer (PDF.js + StPageFlip)
   Additive only: does not modify script.js, it wraps resetToHome().
   ========================================================================= */
(function () {
    'use strict';

    /* ---------- EDIT THIS LIST TO ADD YOUR PDFs ----------
       file:  path to the PDF inside your repo (case-sensitive, no spaces)
       cover: optional image for the card; if omitted, page 1 is used     */
    const PDF_WORKS = [
        { title: 'Simba Corp Graduate Engineer Trainee: Prep Guide', subtitle: 'Interview & Written Prep Guide', file: 'simba-corp-prep-guide.pdf' },
        // { title: 'School Magazine, Oct-Nov 2026', subtitle: 'Layout & Design', file: 'pdfs/school-magazine.pdf' },
        // { title: 'Company Profile', subtitle: 'Brochure', file: 'pdfs/company-profile.pdf', cover: 'pdfs/company-cover.jpg' },
    ];

    const $ = (id) => document.getElementById(id);
    const section = $('pdf-works'), grid = $('pdf-grid'), viewer = $('pdf-viewer'), stage = $('pdf-stage');
    if (!section || !viewer) return;

    /* How much of the available screen the book fills: 0.8 = 80%. Change to taste (0.6 smaller, 0.95 bigger). */
    const FIT = 0.8;

    const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;

    let pdfDoc = null, flip = null, pageEls = [], current = null, token = 0, ratio = 1.414;
    const rendered = new Set(), rendering = new Set();

    /* ---------- Cards ---------- */
    function buildGrid() {
        if (!PDF_WORKS.length) {
            grid.innerHTML = '<p class="pdf-empty">PDF works coming soon.</p>';
            return;
        }
        const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                loadThumb(en.target._item, en.target.querySelector('.pdf-thumb'));
            });
        }, { rootMargin: '200px' }) : null;

        PDF_WORKS.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.innerHTML = '<div class="pdf-thumb"></div><div class="pdf-card-title"></div><div class="pdf-card-sub"></div>';
            card.querySelector('.pdf-card-title').textContent = item.title || 'Untitled';
            card.querySelector('.pdf-card-sub').textContent = item.subtitle || '';
            card._item = item;
            card.addEventListener('click', () => openPdf(item));
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPdf(item); } });
            grid.appendChild(card);
            io ? io.observe(card) : loadThumb(item, card.querySelector('.pdf-thumb'));
        });
    }

    async function loadThumb(item, el) {
        try {
            if (item.cover) {
                const img = new Image();
                img.loading = 'lazy'; img.decoding = 'async'; img.alt = item.title || '';
                img.src = item.cover;
                el.appendChild(img);
            } else {
                const doc = await pdfjsLib.getDocument(item.file).promise;
                const page = await doc.getPage(1);
                const base = page.getViewport({ scale: 1 });
                const vp = page.getViewport({ scale: 520 / base.width });
                const c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                el.appendChild(c);
                doc.destroy();
            }
            el.classList.add('loaded');
        } catch (e) {
            el.textContent = 'Preview unavailable';
        }
    }

    /* ---------- Viewer ---------- */
    function setLoading(show, text, isError) {
        const box = $('pdf-loading');
        box.classList.toggle('show', !!show);
        box.classList.toggle('error', !!isError);
        $('pdf-loading-text').textContent = text || '';
    }

    function teardown() {
        try { if (flip) flip.destroy(); } catch (e) { /* ignore */ }
        flip = null;
        stage.innerHTML = '';
        pageEls = [];
        rendered.clear(); rendering.clear();
        if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }
    }

    async function openPdf(item) {
        if (!window.pdfjsLib || !window.St) { alert('The PDF viewer libraries have not loaded yet. Check your internet connection and refresh the page.'); return; }
        teardown();
        const my = ++token;
        current = item;
        $('pdf-title').textContent = item.title || '';
        viewer.classList.add('active');
        viewer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setLoading(true, 'Loading...');
        try {
            const task = pdfjsLib.getDocument(item.file);
            task.onProgress = (p) => {
                if (my === token && p.total) setLoading(true, 'Loading ' + Math.min(100, Math.round((p.loaded / p.total) * 100)) + '%');
            };
            const doc = await task.promise;
            if (my !== token) { doc.destroy(); return; }
            pdfDoc = doc;
            const first = await doc.getPage(1);
            const vp = first.getViewport({ scale: 1 });
            ratio = vp.height / vp.width;
            buildBook(doc.numPages);
            setLoading(false);
        } catch (e) {
            console.error('PDF error:', e);
            if (my === token) setLoading(true, location.protocol === 'file:' ? 'Open the live website (GitHub Pages), not the file on your computer.' : 'Could not load this PDF (' + ((e && e.message) || 'unknown error') + '). Check the file path in PDF_WORKS.', true);
        }
    }

    /* Size the book box so BOTH pages always fit on screen, centred */
    function fitBook() {
        const book = stage.querySelector('.pdf-book');
        if (!book) return;
        const aw = stage.clientWidth, ah = stage.clientHeight;
        const portrait = aw < 640;
        const pageW = Math.min(portrait ? aw : aw / 2, ah / ratio) * FIT;
        const w = Math.round(pageW * (portrait ? 1 : 2)), h = Math.round(pageW * ratio);
        book.style.cssText = 'position:absolute;right:auto;bottom:auto;width:' + w + 'px;height:' + h + 'px;left:' + Math.round((aw - w) / 2) + 'px;top:' + Math.round((ah - h) / 2) + 'px;';
    }

    function buildBook(n) {
        const book = document.createElement('div');
        book.className = 'pdf-book';
        stage.appendChild(book);

        pageEls = [];
        for (let i = 0; i < n; i++) {
            const p = document.createElement('div');
            p.className = 'pdf-page';
            if (i === 0 || i === n - 1) p.dataset.density = 'hard';
            pageEls.push(p);
        }

        fitBook();
        flip = new St.PageFlip(book, {
            width: 400, height: Math.round(400 * ratio),
            size: 'stretch',
            minWidth: 120, maxWidth: 4000,
            minHeight: Math.round(120 * ratio), maxHeight: Math.round(4000 * ratio),
            showCover: true, usePortrait: true,
            drawShadow: true, maxShadowOpacity: 0.45,
            flippingTime: 700, mobileScrollSupport: false
        });
        flip.loadFromHTML(pageEls);

        const slider = $('pdf-slider');
        slider.max = n; slider.value = 1;

        flip.on('flip', (e) => sync(e.data));
        flip.on('changeOrientation', () => sync(flip.getCurrentPageIndex()));
        sync(0);
    }

    function sync(idx) {
        if (!pdfDoc || !flip) return;
        const n = pdfDoc.numPages;
        const spread = flip.getOrientation() === 'landscape' && idx > 0 && idx < n - 1;
        $('pdf-counter').textContent = (spread ? (idx + 1) + '-' + (idx + 2) : (idx + 1)) + ' / ' + n;
        $('pdf-slider').value = idx + 1;
        [0, 1, 2, -1, 3, 4, -2, 5].forEach((o) => renderPage(idx + o));
        rendered.forEach((r) => { if (Math.abs(r - idx) > 14) freePage(r); });
    }

    async function renderPage(j) {
        if (!pdfDoc || j < 0 || j >= pdfDoc.numPages || rendered.has(j) || rendering.has(j)) return;
        rendering.add(j);
        const doc = pdfDoc;
        try {
            const page = await doc.getPage(j + 1);
            const base = page.getViewport({ scale: 1 });
            const vp = page.getViewport({ scale: Math.min(2.5, 1200 / base.width) });
            const c = document.createElement('canvas');
            c.width = vp.width; c.height = vp.height;
            await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            if (doc !== pdfDoc) return;
            pageEls[j].replaceChildren(c);
            rendered.add(j);
        } catch (e) { /* page render cancelled or failed */ }
        finally { rendering.delete(j); }
    }

    function freePage(j) {
        const c = pageEls[j] && pageEls[j].firstChild;
        if (c) { c.width = 0; c.height = 0; }
        if (pageEls[j]) pageEls[j].replaceChildren();
        rendered.delete(j);
    }

    function closePdf() {
        if (!viewer.classList.contains('active')) return;
        const d = document;
        if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        token++;
        const t = token;
        panel.hidden = true; panel.innerHTML = '';
        viewer.classList.remove('active');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { if (t === token) teardown(); }, 350);
    }

    function toggleFullscreen() {
        const d = document;
        if (d.fullscreenElement || d.webkitFullscreenElement) {
            (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        } else {
            const req = viewer.requestFullscreen || viewer.webkitRequestFullscreen;
            if (req) req.call(viewer);
        }
    }

    function download() {
        if (!current) return;
        const a = document.createElement('a');
        a.href = current.file;
        a.download = current.file.split('/').pop() || 'document.pdf';
        document.body.appendChild(a); a.click(); a.remove();
    }

    /* ---------- Wiring ---------- */
    $('pdf-close').addEventListener('click', closePdf);
    $('pdf-download').addEventListener('click', download);
    $('pdf-fullscreen').addEventListener('click', toggleFullscreen);
    $('pdf-prev').addEventListener('click', () => flip && flip.flipPrev());
    $('pdf-next').addEventListener('click', () => flip && flip.flipNext());
    $('pdf-slider').addEventListener('input', (e) => {
        if (!flip) return;
        flip.turnToPage(parseInt(e.target.value, 10) - 1);
        sync(flip.getCurrentPageIndex());
    });
    if (!viewer.requestFullscreen && !viewer.webkitRequestFullscreen) $('pdf-fullscreen').hidden = true;

    document.addEventListener('keydown', (e) => {
        if (!viewer.classList.contains('active')) return;
        if (e.key === 'ArrowRight') flip && flip.flipNext();
        else if (e.key === 'ArrowLeft') flip && flip.flipPrev();
        else if (e.key === 'Escape' && !document.fullscreenElement) { if (!panel.hidden) panel.hidden = true; else closePdf(); }
    });

    const refit = () => { if (flip) { fitBook(); flip.update(); } };
    window.addEventListener('resize', refit);
    document.addEventListener('fullscreenchange', () => setTimeout(refit, 150));
    document.addEventListener('webkitfullscreenchange', () => setTimeout(refit, 150));

    /* Thumbnails, print, share */
    const panel = $('pdf-thumbs');
    $('pdf-grid-btn').addEventListener('click', () => {
        if (!pdfDoc) return;
        if (!panel.hidden) { panel.hidden = true; return; }
        if (!panel.childElementCount) buildThumbs();
        panel.hidden = false;
    });
    function buildThumbs() {
        const doc = pdfDoc;
        const io = new IntersectionObserver((entries) => entries.forEach(async (en) => {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            try {
                const pg = await doc.getPage(+en.target.dataset.n + 1);
                const b = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 170 / b.width });
                const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
                await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                en.target.prepend(c);
            } catch (e) { /* ignore */ }
        }), { root: panel });
        for (let i = 0; i < doc.numPages; i++) {
            const t = document.createElement('button');
            t.className = 'pdf-thumb-item'; t.dataset.n = i;
            t.innerHTML = '<span>' + (i + 1) + '</span>';
            t.addEventListener('click', () => { panel.hidden = true; flip.turnToPage(i); sync(flip.getCurrentPageIndex()); });
            panel.appendChild(t); io.observe(t);
        }
    }
    $('pdf-print').addEventListener('click', () => { if (current) window.open(current.file, '_blank'); });
    $('pdf-share').addEventListener('click', async () => {
        const url = location.href.split('#')[0], t = $('pdf-title'), old = t.textContent;
        try {
            if (navigator.share) await navigator.share({ title: current ? current.title : 'Portfolio', url });
            else { await navigator.clipboard.writeText(url); t.textContent = 'Link copied'; setTimeout(() => (t.textContent = old), 1800); }
        } catch (e) { /* cancelled */ }
    });

    /* Make the existing navigation also close/hide the PDF section */
    if (typeof window.resetToHome === 'function') {
        const original = window.resetToHome;
        window.resetToHome = function () {
            closePdf();
            document.body.classList.remove('pdf-mode');
            section.classList.remove('active');
            return original.apply(this, arguments);
        };
    }

    /* Called by the "PDF Works" nav button */
    window.showPdfWorks = function (event) {
        window.resetToHome();
        $('album-grid').classList.remove('active');
        document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
        if (event && event.currentTarget) event.currentTarget.classList.add('active');
        document.querySelectorAll('.software-nav').forEach((n) => n.classList.add('hidden'));
        document.querySelectorAll('.software-link').forEach((l) => l.classList.remove('active'));
        section.classList.add('active');
        document.body.classList.add('pdf-mode');
    };

    buildGrid();
})();
