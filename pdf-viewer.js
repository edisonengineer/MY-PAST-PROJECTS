/* =========================================================================
   PDF WORKS: Flipbook viewer (PDF.js + StPageFlip)
   ========================================================================= */

// 1. GLOBAL TRIGGER: This handles the navigation switch
window.showPdfWorks = function (event) {
    // Reset other views using the function in script.js
    if (typeof window.resetToHome === 'function') {
        window.resetToHome();
    }
    
    // Hide the main album grid
    const albumGrid = document.getElementById('album-grid');
    if (albumGrid) albumGrid.classList.remove('active');
    
    // Deactivate all top nav links, then activate the clicked one
    document.querySelectorAll('.top-nav .nav-link').forEach((l) => l.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Hide software sub-navs
    document.querySelectorAll('.software-nav').forEach((n) => n.classList.add('hidden'));
    
    // Show the PDF works section
    const pdfSection = document.getElementById('pdf-works');
    if (pdfSection) pdfSection.classList.add('active');
};

(function () {
    'use strict';

    /* ---------- CONFIGURATION ---------- */
    const PDF_WORKS = [
        { 
            title: 'Simba Corp Prep Guide', 
            subtitle: 'Mechanical Engineering', 
            file: 'simba-corp-prep-guide.pdf' // Ensure this file is in your root folder
        }
        // Add more PDF objects here as needed
    ];

    const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    /* ---------- SELECTORS ---------- */
    const $ = (id) => document.getElementById(id);
    const grid = $('pdf-grid');
    const viewer = $('pdf-viewer');
    const stage = $('pdf-stage');
    const loadingBox = $('pdf-loading');
    
    // Exit if essential elements are missing
    if (!grid || !viewer) return;

    // Initialize PDF.js Worker
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    }

    let pdfDoc = null;
    let flipBook = null;
    let pageElements = [];
    let currentToken = 0; // Prevents race conditions during loading
    let pageRatio = 1.414; // Default A4 ratio
    const renderedPages = new Set();
    const renderingQueue = new Set();

    /* ---------- 1. BUILD THE GRID (Thumbnails) ---------- */
    function initPdfGrid() {
        if (PDF_WORKS.length === 0) {
            grid.innerHTML = '<p class="pdf-empty">No PDF works available yet.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear existing
        PDF_WORKS.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.innerHTML = `
                <div class="pdf-thumb" id="thumb-${item.file.replace(/[^a-z0-9]/gi, '')}">
                    <div class="pdf-spinner"></div>
                </div>
                <div class="pdf-card-title">${item.title}</div>
                <div class="pdf-card-sub">${item.subtitle}</div>
            `;
            card.addEventListener('click', () => openPdfViewer(item));
            grid.appendChild(card);
            
            // Generate Thumbnail
            generateThumbnail(item, `thumb-${item.file.replace(/[^a-z0-9]/gi, '')}`);
        });
    }

    async function generateThumbnail(item, containerId) {
        const container = $(containerId);
        try {
            const loadingTask = pdfjsLib.getDocument(item.file);
            const doc = await loadingTask.promise;
            const page = await doc.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            container.innerHTML = '';
            container.appendChild(canvas);
            container.classList.add('loaded');
            doc.destroy();
        } catch (err) {
            console.error("Thumbnail error:", err);
            container.innerHTML = '<span style="font-size:10px">Preview Unavailable</span>';
        }
    }

    /* ---------- 2. VIEWER LOGIC ---------- */
    function showLoading(show, text = 'Loading...', isError = false) {
        if (!loadingBox) return;
        loadingBox.classList.toggle('show', show);
        const textEl = $('pdf-loading-text');
        if (textEl) textEl.textContent = text;
        if (isError) loadingBox.classList.add('error');
        else loadingBox.classList.remove('error');
    }

    function destroyFlipbook() {
        if (flipBook) {
            flipBook.destroy();
            flipBook = null;
        }
        stage.innerHTML = '';
        pageElements = [];
        renderedPages.clear();
        renderingQueue.clear();
        if (pdfDoc) {
            pdfDoc.destroy();
            pdfDoc = null;
        }
    }

    async function openPdfViewer(item) {
        if (!window.pdfjsLib || !window.St) {
            alert("Viewer libraries are still loading. Please try again in a moment.");
            return;
        }

        destroyFlipbook();
        const myToken = ++currentToken;
        
        $('pdf-title').textContent = item.title;
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        showLoading(true, 'Opening PDF...');

        try {
            const loadingTask = pdfjsLib.getDocument(item.file);
            
            // Update progress
            loadingTask.onProgress = (data) => {
                if (myToken === currentToken && data.total > 0) {
                    const percent = Math.round((data.loaded / data.total) * 100);
                    showLoading(true, `Loading ${percent}%`);
                }
            };

            const doc = await loadingTask.promise;
            if (myToken !== currentToken) { doc.destroy(); return; }
            
            pdfDoc = doc;
            
            // Calculate Ratio from first page
            const firstPage = await doc.getPage(1);
            const vp = firstPage.getViewport({ scale: 1 });
            pageRatio = vp.height / vp.width;

            initFlipbook(doc.numPages);
            showLoading(false);
        } catch (err) {
            console.error("Viewer error:", err);
            if (myToken === currentToken) showLoading(true, 'Error loading PDF.', true);
        }
    }

    function initFlipbook(numPages) {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'pdf-book';
        stage.appendChild(bookDiv);

        pageElements = [];
        for (let i = 0; i < numPages; i++) {
            const pg = document.createElement('div');
            pg.className = 'pdf-page';
            // Hard cover for first and last page
            if (i === 0 || i === numPages - 1) pg.dataset.density = 'hard';
            pageElements.push(pg);
        }

        // Initialize StPageFlip
        // Documentation: https://nodlik.github.io/StPageFlip/
        flipBook = new St.PageFlip(bookDiv, {
            width: 500,
            height: Math.round(500 * pageRatio),
            size: "stretch",
            minWidth: 300,
            maxWidth: 1000,
            minHeight: Math.round(300 * pageRatio),
            maxHeight: Math.round(1000 * pageRatio),
            showCover: true,
            usePortrait: true,
            drawShadow: true,
            flippingTime: 800,
            mobileScrollSupport: false
        });

        flipBook.loadFromHTML(pageElements);

        // Slider Setup
        const slider = $('pdf-slider');
        if (slider) {
            slider.max = numPages;
            slider.value = 1;
        }

        // Events
        flipBook.on('flip', (e) => updateUI(e.data));
        flipBook.on('changeOrientation', (e) => updateUI(flipBook.getCurrentPageIndex()));

        // Initial Page Render
        updateUI(0);
    }

    function updateUI(index) {
        const total = pdfDoc.numPages;
        const isLandscape = flipBook.getOrientation() === 'landscape';
        const slider = $('pdf-slider');
        const counter = $('pdf-counter');

        // Update Slider
        if (slider) slider.value = index + 1;

        // Update Page Numbers (handles 1 or 1-2 view)
        if (counter) {
            if (isLandscape && index > 0 && index < total - 1) {
                counter.textContent = `${index + 1}-${index + 2} / ${total}`;
            } else {
                counter.textContent = `${index + 1} / ${total}`;
            }
        }

        // Smart Render: Render current page, neighbors, and next spread
        const pagesToLoad = [index, index + 1, index - 1, index + 2];
        pagesToLoad.forEach(idx => renderPage(idx));
        
        // Cleanup memory: Remove pages far away from current view
        renderedPages.forEach(idx => {
            if (Math.abs(idx - index) > 10) clearPage(idx);
        });
    }

    async function renderPage(idx) {
        if (!pdfDoc || idx < 0 || idx >= pdfDoc.numPages) return;
        if (renderedPages.has(idx) || renderingQueue.has(idx)) return;

        renderingQueue.add(idx);
        try {
            const page = await pdfDoc.getPage(idx + 1);
            const viewport = page.getViewport({ scale: 2 }); // Scale 2 for sharpness
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            if (pageElements[idx]) {
                pageElements[idx].innerHTML = '';
                pageElements[idx].appendChild(canvas);
                renderedPages.add(idx);
            }
        } catch (err) {
            console.error("Render error on page", idx, err);
        } finally {
            renderingQueue.delete(idx);
        }
    }

    function clearPage(idx) {
        if (pageElements[idx]) {
            pageElements[idx].innerHTML = '';
            renderedPages.delete(idx);
        }
    }

    function closePdfViewer() {
        viewer.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(destroyFlipbook, 400); // Clean up after transition
    }

    /* ---------- 3. EVENT LISTENERS ---------- */
    $('pdf-close').addEventListener('click', closePdfViewer);
    $('pdf-prev').addEventListener('click', () => flipBook && flipBook.flipPrev());
    $('pdf-next').addEventListener('click', () => flipBook && flipBook.flipNext());
    
    $('pdf-slider').addEventListener('input', (e) => {
        if (!flipBook) return;
        const val = parseInt(e.target.value, 10) - 1;
        flipBook.turnToPage(val);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!viewer.classList.contains('active')) return;
        if (e.key === 'Escape') closePdfViewer();
        if (e.key === 'ArrowLeft') flipBook.flipPrev();
        if (e.key === 'ArrowRight') flipBook.flipNext();
    });

    // Run grid initialization
    initPdfGrid();

})();