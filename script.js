let activeGalleryId = '';
let isGraphicProject = false;
let lightboxImages = [];
let currentLightboxIndex = 0;

// Assigned directly to the window so the PDF viewer can correctly wrap and clean it up!
window.resetToHome = function() {
    document.getElementById('hero-cover').classList.remove('active');
    document.getElementById('internal-gallery').classList.remove('active');
    
    // Safety fallback: strictly ensure the PDF Works section is hidden
    const pdfWorks = document.getElementById('pdf-works');
    if (pdfWorks) pdfWorks.classList.remove('active');
    
    document.getElementById('album-grid').classList.add('active');
    document.body.style.backgroundColor = '#1a1a1a';
};

function filterCategory(category, event) {
    // Calling the globally wrapped version ensures the PDF viewer closes properly
    window.resetToHome(); 
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    document.querySelectorAll('.software-nav').forEach(nav => nav.classList.add('hidden'));
    document.querySelectorAll('.software-link').forEach(link => link.classList.remove('active'));
    
    if (category === 'engineering') {
        document.getElementById('nav-engineering').classList.remove('hidden');
        document.querySelector('#nav-engineering .software-link').classList.add('active');
    } else if (category === 'graphic') {
        document.getElementById('nav-graphic').classList.remove('hidden');
        document.querySelector('#nav-graphic .software-link').classList.add('active');
    }

    const albums = document.querySelectorAll('.album-card');
    albums.forEach(album => {
        if (category === 'all' || album.classList.contains(category)) {
            album.style.display = 'block';
        } else {
            album.style.display = 'none';
        }
    });
}

function filterSoftware(category, software, event) {
    const currentNav = document.getElementById(`nav-${category}`);
    currentNav.querySelectorAll('.software-link').forEach(link => link.classList.remove('active'));
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

function openHero(title, date, bgImageUrl, galleryId, isGraphic, themeColor) {
    window.resetToHome(); // Safely reset everything first
    
    document.getElementById('album-grid').classList.remove('active');
    document.getElementById('hero-cover').classList.add('active');
    
    document.getElementById('hero-title').innerText = title;
    document.getElementById('hero-date').innerText = date;
    document.getElementById('hero-bg').style.backgroundImage = `url('${bgImageUrl}')`;
    
    activeGalleryId = galleryId;
    isGraphicProject = isGraphic;
    document.body.style.backgroundColor = themeColor || '#1a1a1a';
}

function openGallery() {
    document.getElementById('hero-cover').classList.remove('active');
    document.getElementById('internal-gallery').classList.add('active');
    
    const cadNav = document.getElementById('cad-views-nav');
    if (isGraphicProject) {
        cadNav.classList.add('hidden');
    } else {
        cadNav.classList.remove('hidden');
    }

    document.querySelectorAll('.project-images').forEach(project => {
        project.style.display = 'none';
    });
    
    if (activeGalleryId) {
        document.getElementById(activeGalleryId).style.display = 'block';
        if (!isGraphicProject) {
            filterGallery('isometric', null);
        } else {
            filterGallery('all-views', null);
        }
    }
}

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

function openLightbox(clickedElement) {
    const gallery = document.getElementById(activeGalleryId);
    
    const visibleItems = Array.from(gallery.querySelectorAll('.gallery-item')).filter(item => item.style.display === 'block');
    lightboxImages = visibleItems.map(item => item.querySelector('img').src);
    
    currentLightboxIndex = visibleItems.indexOf(clickedElement);
    
    document.getElementById('lightbox-img').src = lightboxImages[currentLightboxIndex];
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

function changeImage(direction, event) {
    event.stopPropagation();
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = lightboxImages.length - 1;
    } else if (currentLightboxIndex >= lightboxImages.length) {
        currentLightboxIndex = 0;
    }
    
    document.getElementById('lightbox-img').src = lightboxImages[currentLightboxIndex];
}
