/* =========================================================================
   CORE PORTFOLIO LOGIC
   ========================================================================= */

let activeGalleryId = '';
let isGraphicProject = false;
let lightboxImages = [];
let currentLightboxIndex = 0;

/**
 * RESET TO HOME
 * Cleans up all view states, closes overlays, and returns to the main grid.
 * Assigned to window so it can be accessed by the PDF viewer script.
 */
window.resetToHome = function() {
    // 1. Hide Project Sections
    document.getElementById('hero-cover').classList.remove('active');
    document.getElementById('internal-gallery').classList.remove('active');
    
    // 2. Hide PDF Sections & Viewer
    const pdfWorks = document.getElementById('pdf-works');
    if (pdfWorks) pdfWorks.classList.remove('active');
    
    const pdfViewer = document.getElementById('pdf-viewer');
    if (pdfViewer) pdfViewer.classList.remove('active');
    
    // 3. Show Main Album Grid
    document.getElementById('album-grid').classList.add('active');
    
    // 4. Reset Global Styles
    document.body.style.backgroundColor = '#1a1a1a';
    document.body.style.overflow = ''; // Restore scrolling
    
    // 5. Reset Nav Links (if not calling from a specific filter)
    // This ensures that clicking the Logo resets the "Active" state on nav buttons
    if (!arguments[0] || arguments[0] !== 'keep-nav') {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector('.nav-link[onclick*="all"]').classList.add('active');
        document.querySelectorAll('.software-nav').forEach(nav => nav.classList.add('hidden'));
    }
};

/**
 * FILTER BY CATEGORY (Engineering vs Graphic Design)
 */
function filterCategory(category, event) {
    // Reset views but tell resetToHome we will handle the nav link states here
    window.resetToHome('keep-nav'); 
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    // Toggle software sub-navigation bars
    document.querySelectorAll('.software-nav').forEach(nav => nav.classList.add('hidden'));
    document.querySelectorAll('.software-link').forEach(link => link.classList.remove('active'));
    
    if (category === 'engineering') {
        const engNav = document.getElementById('nav-engineering');
        if (engNav) {
            engNav.classList.remove('hidden');
            engNav.querySelector('.software-link').classList.add('active');
        }
    } else if (category === 'graphic') {
        const graphNav = document.getElementById('nav-graphic');
        if (graphNav) {
            graphNav.classList.remove('hidden');
            graphNav.querySelector('.software-link').classList.add('active');
        }
    }

    // Filter Album Cards
    const albums = document.querySelectorAll('.album-card');
    albums.forEach(album => {
        if (category === 'all' || album.classList.contains(category)) {
            album.style.display = 'block';
        } else {
            album.style.display = 'none';
        }
    });
}

/**
 * FILTER BY SOFTWARE (SolidWorks, Photoshop, etc.)
 */
function filterSoftware(category, software, event) {
    const currentNav = document.getElementById(`nav-${category}`);
    if (currentNav) {
        currentNav.querySelectorAll('.software-link').forEach(link => link.classList.remove('active'));
    }
    if (event) event.currentTarget.classList.add('active');

    const albums = document.querySelectorAll('.album-card');
    albums.forEach(album => {
        if (software === 'all') {
            album.style.display = album.classList.contains(category) ? 'block' : 'none';
        } else {
            album.style.display = album.classList.contains(software) ? 'block' : 'none';
        }
    });
}

/**
 * OPEN HERO STATE (Cover Page)
 */
function openHero(title, date, bgImageUrl, galleryId, isGraphic, themeColor) {
    document.getElementById('album-grid').classList.remove('active');
    document.getElementById('hero-cover').classList.add('active');
    
    document.getElementById('hero-title').innerText = title;
    document.getElementById('hero-date').innerText = date;
    document.getElementById('hero-bg').style.backgroundImage = `url('${bgImageUrl}')`;
    
    activeGalleryId = galleryId;
    isGraphicProject = isGraphic;
    document.body.style.backgroundColor = themeColor || '#1a1a1a';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * OPEN INTERNAL GALLERY (Masonry View)
 */
function openGallery() {
    document.getElementById('hero-cover').classList.remove('active');
    document.getElementById('internal-gallery').classList.add('active');
    
    const cadNav = document.getElementById('cad-views-nav');
    if (isGraphicProject) {
        cadNav.classList.add('hidden');
    } else {
        cadNav.classList.remove('hidden');
    }

    // Hide all project containers first
    document.querySelectorAll('.project-images').forEach(project => {
        project.style.display = 'none';
    });
    
    // Show the active one
    if (activeGalleryId) {
        const activeGallery = document.getElementById(activeGalleryId);
        if (activeGallery) {
            activeGallery.style.display = 'block';
            // Default view filter
            if (!isGraphicProject) {
                filterGallery('isometric', null);
            } else {
                filterGallery('all-views', null);
            }
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * FILTER INTERNAL GALLERY VIEWS (Isometric, Front, etc.)
 */
function filterGallery(viewType, event) {
    const subLinks = document.querySelectorAll('.sub-link');
    subLinks.forEach(link => link.classList.remove('active'));
    
    if (event) {
        event.currentTarget.classList.add('active');
    } else {
        if (subLinks.length > 0) subLinks[0].classList.add('active');
    }

    if (activeGalleryId) {
        const items = document.querySelectorAll(`#${activeGalleryId} .gallery-item`);
        items.forEach(item => {
            if (viewType === 'all-views' || item.classList.contains(viewType)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

/* =========================================================================
   LIGHTBOX LOGIC (Full-screen image viewer)
   ========================================================================= */

function openLightbox(clickedElement) {
    const gallery = document.getElementById(activeGalleryId);
    if (!gallery) return;

    // Only get images that are currently visible (filtered)
    const visibleItems = Array.from(gallery.querySelectorAll('.gallery-item'))
                              .filter(item => item.style.display !== 'none');
    
    lightboxImages = visibleItems.map(item => item.querySelector('img').src);
    currentLightboxIndex = visibleItems.indexOf(clickedElement);
    
    updateLightboxImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock scroll
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    if (!document.getElementById('pdf-viewer').classList.contains('active')) {
        document.body.style.overflow = ''; // Restore scroll if PDF viewer isn't active
    }
}

function changeImage(direction, event) {
    if (event) event.stopPropagation();
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = lightboxImages.length - 1;
    } else if (currentLightboxIndex >= lightboxImages.length) {
        currentLightboxIndex = 0;
    }
    
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = document.getElementById('lightbox-img');
    if (img && lightboxImages[currentLightboxIndex]) {
        img.src = lightboxImages[currentLightboxIndex];
    }
}

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (document.getElementById('lightbox').classList.contains('active')) {
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'ArrowLeft') changeImage(-1);
    }
});