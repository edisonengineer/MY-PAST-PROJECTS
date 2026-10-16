/* =========================================================================
   Service worker: makes the site installable and usable offline.
   - Pages: network first (always fresh when online), cached copy offline.
   - CSS/JS/images/fonts: served from cache, refreshed in the background.
   Bump VERSION to clear old caches after big changes.
   ========================================================================= */
const VERSION = 'v17';
const CACHE = 'eo-portfolio-' + VERSION;
const PRECACHE = [
    './',
    'index.html',
    'offline.html',
    'css/style.css',
    'js/config.js', 'js/currency.js', 'js/projects.js', 'js/reviews.js', 'js/packages.js', 'js/rates.js',
    'js/i18n-fr.js', 'js/i18n-sw.js', 'js/i18n.js', 'js/main.js', 'js/forms.js', 'js/shop.js',
    'js/instagram-snapshot.js', 'js/certificates.js', 'js/extras.js', 'js/analytics.js', 'js/pages.js', 'js/search.js', 'js/colours.js',
    'favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('eo-portfolio-') && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Pages: network first, fall back to cache, then the offline page
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
                .catch(() => caches.match(req).then((hit) => hit || caches.match('offline.html')))
        );
        return;
    }

    // Same-site assets and Google Fonts: cache first, refresh in the background
    const sameSite = url.origin === self.location.origin;
    const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
    if (!sameSite && !fonts) return;
    if (sameSite && /\.pdf$/i.test(url.pathname)) return; // let PDFs stream normally

    // Project tracker statuses: always try for the latest, use the saved copy only offline
    if (sameSite && /tracker-data\.js$/.test(url.pathname)) {
        event.respondWith(
            fetch(req, { cache: 'no-store' })
                .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
                .catch(() => caches.match(req))
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE).then((cache) =>
            cache.match(req).then((hit) => {
                const network = fetch(req).then((res) => {
                    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
                    return res;
                }).catch(() => hit);
                return hit || network;
            })
        )
    );
});
