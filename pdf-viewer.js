/* =========================================================================
   PDF WORKS: Flipbook logic
   ========================================================================= */

window.showPdfWorks = function (event) {
    if (typeof window.resetToHome === 'function') window.resetToHome();
    document.getElementById('album-grid').classList.remove('active');
    document.querySelectorAll('.top-nav .nav-link').forEach((l) => l.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    document.querySelectorAll('.software-nav').forEach((n) => n.classList.add('hidden'));
    const section = document.getElementById('pdf-works');
    if (section) section.classList.add('active');
};

(function () {
    'use strict';

    const PDF_WORKS = [
        { title: 'Simba Corp Prep Guide', subtitle: 'Interview Prep', file: 'simba-corp-prep-guide.pdf' }
    ];

    const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const $ = (id) => document.getElementById(id);
    const grid = $('pdf-grid'), viewer = $('pdf-viewer'), stage = $('pdf-stage');

    if (!grid || !viewer) return;
    if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

    let pdfDoc = null, flipBook = null, pageElements = [], currentToken = 0, pageRatio = 1.414;
    const renderedPages = new Set(), renderingQueue = new Set();

    /* --- Thumbnails --- */
    function initGrid() {
        grid.innerHTML = '';
        PDF_WORKS.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.innerHTML = `<div class="pdf-thumb"></div><div class="pdf-card-title">${item.title}</div>`;
            card.addEventListener('click', () => openViewer(item));
            grid.appendChild(card);
            loadThumb(item, card.querySelector('.pdf-thumb'));
        });
    }

    async function loadThumb(item, el) {
        try {
            const doc = await pdfjsLib.getDocument(item.file).promise;
            const page = await doc.getPage(1);
            const vp = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width; canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            el.appendChild(canvas);
            doc.destroy();
        } catch (e) { el.innerText = "Error"; }
    }

    /* --- Viewer --- */
    function showLoading(show, text = 'Loading...') {
        const box = $('pdf-loading');
        if (box) box.classList.toggle('show', show);
        const txt = $('pdf-loading-text');
        if (txt) txt.textContent = text;
    }

    function destroyBook() {
        if (flipBook) flipBook.destroy();
        flipBook = null;
        stage.innerHTML = '';
        pageElements = [];
        renderedPages.clear();
        renderingQueue.clear();
        if (pdfDoc) pdfDoc.destroy();
        pdfDoc = null;
    }

    async function openViewer(item) {
        destroyBook();
        const myToken = ++currentToken;
        $('pdf-title').textContent = item.title;
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        showLoading(true);

        try {
            const doc = await pdfjsLib.getDocument(item.file).promise;
            if (myToken !== currentToken) return;
            pdfDoc = doc;
            const first = await doc.getPage(1);
            pageRatio = first.getViewport({ scale: 1 }).height / first.getViewport({ scale: 1 }).width;
            initFlipbook(doc.numPages);
            showLoading(false);
        } catch (e) { showLoading(true, "Error loading PDF"); }
    }

    function initFlipbook(num) {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'pdf-book';
        stage.appendChild(bookDiv);

        for (let i = 0; i < num; i++) {
            const pg = document.createElement('div');
            pg.className = 'pdf-page';
            if (i === 0 || i === num - 1) pg.dataset.density = 'hard';
            pageElements.push(pg);
        }

        flipBook = new St.PageFlip(bookDiv, {
            width: 500, height: Math.round(500 * pageRatio),
            size: "stretch", // Critical for fitting within padded Stage
            minWidth: 200, maxWidth: 1200,
            minHeight: 300, maxHeight: 1600,
            showCover: true,
            drawShadow: true,
            flippingTime: 800,
            usePortrait: true
        });

        flipBook.loadFromHTML(pageElements);
        const slider = $('pdf-slider');
        if (slider) { slider.max = num; slider.value = 1; }

        flipBook.on('flip', (e) => updateUI(e.data));
        flipBook.on('changeOrientation', () => updateUI(flipBook.getCurrentPageIndex()));
        updateUI(0);
    }

    function updateUI(idx) {
        if (!pdfDoc) return;
        const total = pdfDoc.numPages;
        const slider = $('pdf-slider');
        const counter = $('pdf-counter');
        const isSpread = flipBook.getOrientation() === 'landscape' && idx > 0 && idx < total - 1;

        if (slider) slider.value = idx + 1;
        if (counter) counter.textContent = (isSpread ? `${idx + 1}-${idx + 2}` : idx + 1) + ` / ${total}`;

        [idx, idx + 1, idx - 1, idx + 2].forEach(i => renderPage(i));
    }

    async function renderPage(idx) {
        if (!pdfDoc || idx < 0 || idx >= pdfDoc.numPages || renderedPages.has(idx) || renderingQueue.has(idx)) return;
        renderingQueue.add(idx);
        try {
            const page = await pdfDoc.getPage(idx + 1);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width; canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            if (pageElements[idx]) {
                pageElements[idx].innerHTML = '';
                pageElements[idx].appendChild(canvas);
                renderedPages.add(idx);
            }
        } finally { renderingQueue.delete(idx); }
    }

    $('pdf-close').addEventListener('click', () => {
        viewer.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(destroyBook, 400);
    });

    $('pdf-prev').addEventListener('click', () => flipBook && flipBook.flipPrev());
    $('pdf-next').addEventListener('click', () => flipBook && flipBook.flipNext());
    $('pdf-slider').addEventListener('input', (e) => flipBook && flipBook.turnToPage(parseInt(e.target.value) - 1));

    initGrid();
})();
