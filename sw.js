/* =========================================================================
   Service worker: makes the site installable and usable offline.
   - Pages: network first (always fresh when online), cached copy offline.
   - CSS/JS/images/fonts: served from cache, refreshed in the background.
     Pages ask for them with ?v=…, so a new version is a new file.
   - Site data (sheet data, translations, search list): network first.
   The list of files saved on install, and VERSION, are written by
   tools/build-pages.js from the pages' own <link> and <script> tags:
   any change to those files gives a new VERSION, and the old cache is
   deleted when the new worker takes over. Don't edit between the markers.
   ========================================================================= */
/* PRECACHE:START */
const VERSION = 'b47e56a100';
const PRECACHE = [
    "./",
    "index.html",
    "favicon.ico",
    "favicon.svg",
    "apple-touch-icon.png",
    "site.webmanifest",
    "css/style.css?v=46",
    "js/config.js",
    "js/live-data.js?v=2",
    "js/currency.js?v=1",
    "js/projects.js",
    "js/sheet-works.js",
    "js/reviews.js",
    "js/packages.js",
    "js/certificates.js",
    "js/sheet-data.js",
    "js/rates.js?v=2",
    "js/i18n.js?v=6",
    "js/i18n-fr.js?v=39",
    "js/i18n-sw.js?v=36",
    "js/i18n-sheet-fr.js",
    "js/i18n-sheet-sw.js",
    "js/main.js?v=11",
    "js/discount.js?v=1",
    "js/forms.js?v=13",
    "js/instagram-snapshot.js?v=1",
    "js/shop.js?v=5",
    "js/extras.js?v=10",
    "js/account.js?v=4",
    "js/analytics.js?v=3",
    "js/promo.js?v=1",
    "js/search.js?v=1",
    "js/colours.js?v=1",
    "js/pdf-viewer.js?v=3",
    "offline.html",
    "start/index.html",
    "js/pages.js?v=20",
    "account/index.html",
    "pay/index.html",
    "js/pay.js?v=3",
    "exams/index.html",
    "css/quote.css?v=5",
    "js/pro.js?v=6",
    "js/exam-gen.js?v=1",
    "js/exams.js?v=3",
    "training/index.html",
    "js/training.js?v=2",
    "calculators/index.html",
    "js/calculators.js?v=1",
    "fonts/plus-jakarta-sans-latin.woff2",
    "fonts/fraunces-latin.woff2",
    "fonts/fraunces-italic-latin.woff2",
    "icon-192.png",
    "icon-512.png"
];
/* PRECACHE:END */
const CACHE = 'eo-portfolio-' + VERSION;

self.addEventListener('install', (event) => {
    // One missing file must not stop the install: save what we can
    event.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('eo-portfolio-') && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Saved pages and data under their address without ?…, so ?lang=fr or ?next=… still find them
const bare = (url) => url.origin + url.pathname;

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Pages: network first, fall back to the saved copy, then the offline page
    if (req.mode === 'navigate') {
        if (url.origin !== self.location.origin) return;
        event.respondWith(
            fetch(req)
                .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(bare(url), copy)); } return res; })
                .catch(() => caches.open(CACHE).then(async (c) =>
                    (await c.match(bare(url))) || (url.pathname.endsWith('/') && await c.match(bare(url) + 'index.html')) ||
                    (await c.match(req, { ignoreSearch: true })) || c.match('offline.html')))
        );
        return;
    }

    // Same-site assets and Google Fonts: cache first, refresh in the background
    const sameSite = url.origin === self.location.origin;
    const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
    if (!sameSite && !fonts) return;
    if (sameSite && /\.pdf$/i.test(url.pathname)) return; // let PDFs stream normally

    // Site data (projects, reviews, sheet translations, search list...): always try for the latest, use the saved copy only offline
    if (sameSite && /\/js\/(tracker-data|projects|sheet-works|sheet-data|reviews|certificates|packages|config|i18n-sheet-fr|i18n-sheet-sw|search-index)\.js$/.test(url.pathname)) {
        event.respondWith(
            fetch(req, { cache: 'no-store' })
                .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(bare(url), copy)); } return res; })
                .catch(() => caches.open(CACHE).then((c) => c.match(bare(url))))
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
