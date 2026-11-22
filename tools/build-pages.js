#!/usr/bin/env node
/* =========================================================================
   Builds the extra pages from the site's data:
     projects/<id>.html   one case-study page per project in js/projects.js
     blog/<slug>.html     one page per article in content/blog/*.html
     blog/index.html      the CAD Tips list
     index.html           refreshes the "Latest CAD tips" cards on the homepage
     sitemap.xml          every page above
     js/cv-master.js      the master CV for cv-tailor/ (tools/cv-master.js)

   Run it after editing projects or articles:   node tools/build-pages.js

   Article files start with a JSON block inside an HTML comment:
     <!--{ "title": "...", "description": "...", "date": "2026-10-13",
           "tags": ["..."], "theme": "teal", "icon": "cube" }-->
   followed by the article body in plain HTML (<p>, <h2>, <ul>...).
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://edisonengineer.github.io/MY-PAST-PROJECTS/';
const WHATSAPP = '254708639473';
const CSS_V = 'css/style.css?v=46';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const written = {};   // every page built in this run, for the translation list at the end
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); written[f] = s; console.log('  wrote ' + f); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const LABEL = { engineering: 'Engineering', graphic: 'Graphic design' };

/* ---------- Data ---------- */
function loadProjects() {
    const ctx = { window: {} };
    vm.runInNewContext(read('js/projects.js'), ctx);
    // Works published from the Google Sheet (tools/sync-from-sheet.js)
    if (fs.existsSync(path.join(ROOT, 'js/sheet-works.js'))) vm.runInNewContext(read('js/sheet-works.js'), ctx);
    // Before / after images the sheet adds to projects written here (Works tab rows with the same title)
    const extras = ctx.window.PROJECT_EXTRAS || {};
    return ctx.window.PROJECTS.map((p) => (extras[p.id] ? Object.assign({}, p, extras[p.id]) : p));
}

function loadReviews() {
    const ctx = { window: {} };
    vm.runInNewContext(read('js/reviews.js'), ctx);
    return ctx.window.REVIEWS || [];
}

function loadPosts() {
    const dir = path.join(ROOT, 'content/blog');
    return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        const m = src.match(/^\s*<!--\s*(\{[\s\S]*?\})\s*-->/);
        if (!m) throw new Error(f + ': missing the <!--{ ... }--> header');
        const meta = JSON.parse(m[1]);
        const body = src.slice(m[0].length).trim();
        const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        return Object.assign({ slug: f.replace(/\.html$/, ''), body, minutes: Math.max(1, Math.round(words / 200)) }, meta);
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));
}

const fmtDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* ---------- Newsletter sign-up (sub-pages) ---------- */
const CFG = (() => { const c = { window: {} }; vm.runInNewContext(read('js/config.js'), c); return c.window.SITE_CONFIG; })();

function newsletter() {
    return `
        <section class="newsletter-band">
            <div class="container newsletter">
                <div class="newsletter-copy">
                    <span class="newsletter-icon">${icon('mail')}</span>
                    <div>
                        <h2>Get new CAD tips by email</h2>
                        <p>Short, practical tips and webinar reminders. No spam, and you can unsubscribe any time.</p>
                    </div>
                </div>
                <div class="newsletter-box">
                    <form class="newsletter-form" data-web3${CFG.trackerApi || CFG.reviewsApi ? ` data-sheet="${esc(CFG.trackerApi || CFG.reviewsApi)}"` : ''} novalidate>
                        <input type="hidden" name="access_key" value="${esc(CFG.web3formsKey)}">
                        <input type="hidden" name="subject" value="New CAD Tips subscriber">
                        <input type="hidden" name="from_name" value="Portfolio: newsletter">
                        <input type="hidden" name="List" value="CAD Tips newsletter">
                        <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <div class="field"><label class="sr-only" for="nl-email">Email address</label><input id="nl-email" name="email" type="email" autocomplete="email" placeholder="Your email address" required></div>
                        <button type="submit" class="btn btn-sun">Subscribe</button>
                        <p class="form-error" role="alert" hidden></p>
                    </form>
                    <div class="form-done newsletter-done" hidden tabindex="-1">${icon('check')} <span>You're subscribed. Thank you!</span></div>
                </div>
            </div>
        </section>
`;
}

/* ---------- Free downloads (Downloads tab of the Google Sheet) ---------- */
const DEFAULT_DOWNLOADS = [
    { id: 'autocad-shortcuts-cheat-sheet', title: 'AutoCAD shortcuts cheat sheet', description: 'The command aliases, function keys and object snaps I teach in every AutoCAD class, on one printable page.', file: 'pdfs/autocad-shortcuts-cheat-sheet.pdf' },
    { id: 'solidworks-shortcuts-cheat-sheet', title: 'SolidWorks shortcuts cheat sheet', description: 'View, selection and sketching shortcuts plus mouse gestures that make SolidWorks faster, on one printable page.', file: 'pdfs/solidworks-shortcuts-cheat-sheet.pdf' }
];
const DOWNLOADS = (() => {
    const ctx = { window: {} };
    try { vm.runInNewContext(read('js/sheet-data.js'), ctx); } catch (e) { /* no sheet data yet */ }
    const list = Array.isArray(ctx.window.SITE_DOWNLOADS) ? ctx.window.SITE_DOWNLOADS : DEFAULT_DOWNLOADS;
    return list.filter((d) => d && d.id && d.title && d.file);
})();

function downloadsBand(prefix) {
    const api = CFG.trackerApi || CFG.reviewsApi;
    if (!DOWNLOADS.length || !api) return '';
    const href = (f) => (/^https?:\/\//.test(f) ? f.replace(SITE, prefix) : prefix + f);
    return `
        <section class="section downloads-band" id="downloads">
            <div class="container">
                <header class="section-head center">
                    <p class="kicker">Free downloads</p>
                    <h2 class="section-title">Free CAD <em>resources</em>.</h2>
                    <p class="section-lede">Printable guides from my training sessions. Enter your email to download, and I'll send you a copy too.</p>
                </header>
                <div class="dl-grid">
${DOWNLOADS.map((d) => `                    <article class="dl-card">
                        <span class="dl-icon">${icon('doc')}</span>
                        <h3 data-no-i18n>${esc(d.title)}</h3>
                        ${d.description ? `<p data-no-i18n>${esc(d.description)}</p>` : ''}
                        <form class="dl-form" data-download="${esc(d.id)}" data-sheet="${esc(api)}" novalidate>
                            <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                            <div class="field"><label class="sr-only" for="dl-${esc(d.id)}">Email address</label><input id="dl-${esc(d.id)}" name="email" type="email" autocomplete="email" placeholder="Your email address" required></div>
                            <button type="submit" class="btn btn-sun">${icon('doc')} Get it free</button>
                            <p class="form-error" role="alert" hidden></p>
                        </form>
                        <div class="dl-done" hidden tabindex="-1">
                            <p>${icon('check')} <span>Thank you! A copy is on its way to your inbox.</span></p>
                            <a class="btn btn-navy" href="${esc(href(d.file))}" target="_blank" rel="noopener" download>${icon('doc')} Download now</a>
                        </div>
                    </article>`).join('\n')}
                </div>
                <p class="dl-note">You'll also get occasional CAD tips by email. Unsubscribe any time.</p>
            </div>
        </section>
`;
}

/* ---------- Free CSWP cheat sheet: a lead magnet (email in, PDF out) ----------
   The cheat sheet itself is content/cswp-cheat-sheet.html, published as downloads/cswp-cheat-sheet.html
   (a printable page) and pdfs/cswp-cheat-sheet.pdf (node tools/build-cheat-sheet.js).
   The sign-up uses the sheet's "subscribe" action with the source lead-magnet-cswp. */
const LEAD = { id: 'lead-magnet-cswp', page: 'downloads/cswp-cheat-sheet.html', pdf: 'pdfs/cswp-cheat-sheet.pdf', thumb: 'images/cswp-cheat-sheet-preview.jpg' };
function leadMagnet(prefix, inline) {
    const api = CFG.trackerApi || CFG.reviewsApi;
    if (!api) return '';
    const has = (f) => fs.existsSync(path.join(ROOT, f));
    const card = `<div class="lead-card" id="cswp-sheet">
                <div class="lead-copy">
                    <span class="lead-badge">${icon('doc')} Free PDF</span>
                    <h2 class="lead-title">SolidWorks CSWP quick-reference <em>cheat sheet</em></h2>
                    <p>The formulas, settings and habits that matter in the exam, on two printable pages.</p>
                    <ul class="lead-points">
                        <li>${icon('check')}<span>Mass properties, materials and the centre of mass</span></li>
                        <li>${icon('check')}<span>Equations, design table headers and configurations</span></li>
                        <li>${icon('check')}<span>Mate rules: gear, rack and pinion, screw, coupler</span></li>
                        <li>${icon('check')}<span>Interference checks, sheet metal and FEA hand checks</span></li>
                    </ul>
                </div>
                <div class="lead-box">
                    ${has(LEAD.thumb) ? `<img class="lead-thumb" src="${prefix}${LEAD.thumb}" alt="Page 1 of the CSWP cheat sheet" width="320" height="453" loading="lazy" decoding="async">` : ''}
                    <form class="lead-form" data-lead="${LEAD.id}" data-sheet="${esc(api)}" data-pdf="${prefix}${LEAD.pdf}" novalidate>
                        <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <div class="field"><label for="lead-email-${inline ? 'b' : 'a'}">Your email address</label><input id="lead-email-${inline ? 'b' : 'a'}" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
                        <button type="submit" class="btn btn-sun btn-block">${icon('doc')} Get the free cheat sheet</button>
                        <p class="form-error" role="alert" hidden></p>
                        <p class="lead-note">You'll also get occasional CAD tips by email. Unsubscribe any time.</p>
                    </form>
                    <div class="lead-done" hidden tabindex="-1">
                        <p class="lead-done-msg">${icon('check')} <span>Your cheat sheet is downloading. A copy is on its way to your inbox too.</span></p>
                        <a class="btn btn-navy btn-block" href="${prefix}${LEAD.page}" target="_blank" rel="noopener">Open it in your browser</a>
                        <a class="btn btn-outline btn-block" href="${prefix}${LEAD.pdf}" download>${icon('doc')} Download the PDF again</a>
                    </div>
                </div>
            </div>`;
    return inline ? card : `
        <section class="section lead-band">
            <div class="container">
            ${card}
            </div>
        </section>
`;
}
function cheatSheetPage() {
    const url = SITE + LEAD.page;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SolidWorks CSWP quick-reference cheat sheet | Nexus CAD Studio</title>
    <meta name="description" content="The formulas, settings and habits that matter in the CSWP exam, on two printable pages.">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${url}">
    <link rel="icon" href="../favicon.ico" sizes="any">
    <link rel="icon" href="../favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="../css/cheat-sheet.css?v=1">
</head>
<body>
    <div class="cs-bar">
        <a href="../exams/index.html">← SolidWorks exam practice</a>
        <span>
            <button type="button" onclick="window.print()">Print</button>
            <a class="cs-btn" href="../${LEAD.pdf}" download>Download PDF</a>
        </span>
    </div>
    <main class="cs-page">
        <header class="cs-head">
            <div>
                <p class="cs-brand">Nexus CAD Studio · Edison Ochieng · Nairobi</p>
                <h1>SolidWorks CSWP <em>quick reference</em></h1>
                <p class="cs-sub">Formulas, settings and habits for the Certified SOLIDWORKS Professional exam</p>
            </div>
            <p class="cs-practice">Practise with timed CSWP-style parts:<br><b>edisonengineer.github.io/MY-PAST-PROJECTS/exams/</b></p>
        </header>
        <div class="cs-grid">
${read('content/cswp-cheat-sheet.html').replace(/^<!--[\s\S]*?-->\s*/, '')}
        </div>
        <footer class="cs-foot">An unofficial study aid by Nexus CAD Studio. SOLIDWORKS and CSWP are trademarks of Dassault Systèmes, which has no connection with it. Check the current exam guide for the rules of your exam.</footer>
    </main>
</body>
</html>
`;
}

/* ---------- Shared page chrome ---------- */
let index = read('index.html');   // the FAQ may be replaced from the Google Sheet below
const indexOriginal = index;
const SPRITE = index.match(/<svg width="0" height="0"[\s\S]*?<\/defs>\s*<\/svg>/)[0];

// Pixel size of a site image (JPEG or PNG), so link previews can lay out the card before the image loads
function imageSize(abs) {
    try {
        const b = fs.readFileSync(abs);
        if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
        if (b[0] === 0xff && b[1] === 0xd8) {
            for (let i = 2; i < b.length - 9;) {
                if (b[i] !== 0xff) { i++; continue; }
                const m = b[i + 1], len = b.readUInt16BE(i + 2);
                if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
                i += 2 + len;
            }
        }
    } catch (e) { /* not a readable image */ }
    return null;
}
function imageMeta(image, alt) {
    const local = String(image).startsWith(SITE) ? path.join(ROOT, String(image).slice(SITE.length).split('?')[0]) : '';
    const size = local ? imageSize(local) : null;
    return (size ? `
    <meta property="og:image:width" content="${size.w}">
    <meta property="og:image:height" content="${size.h}">` : '') + `
    <meta property="og:image:alt" content="${esc(alt)}">
    <meta name="twitter:image:alt" content="${esc(alt)}">`;
}

function head({ title, description, url, image, type, jsonld, article }) {
    const lang = (l) => url + (url.includes('?') ? '&' : '?') + 'lang=' + l;
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="Edison Ochieng">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#0e1a3a">
    <link rel="canonical" href="${url}">
    <link rel="alternate" hreflang="en" href="${url}">
    <link rel="alternate" hreflang="fr" href="${lang('fr')}">
    <link rel="alternate" hreflang="sw" href="${lang('sw')}">
    <link rel="alternate" hreflang="x-default" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="Nexus CAD Studio">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">${imageMeta(image, title)}
    <meta property="og:locale" content="en_KE">
    <meta property="og:locale:alternate" content="fr_FR">
    <meta property="og:locale:alternate" content="sw_KE">${article ? `
    <meta property="article:published_time" content="${esc(article.published)}">
    <meta property="article:modified_time" content="${esc(article.modified || article.published)}">
    <meta property="article:author" content="Edison Ochieng">${(article.tags || []).map((t) => `
    <meta property="article:tag" content="${esc(t)}">`).join('')}` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">
    <link rel="icon" href="../favicon.ico" sizes="any">
    <link rel="icon" href="../favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="../apple-touch-icon.png">
    <link rel="manifest" href="../site.webmanifest">
    <link rel="preload" href="../fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="../fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="../${CSS_V}">
    <script>
        document.documentElement.classList.add('js');
        (function () {
            var t = null;
            try { t = localStorage.getItem('theme'); } catch (e) {}
            if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', t);
        })();
    </script>
    <script type="application/ld+json">
${JSON.stringify(jsonld, null, 4).replace(/^/gm, '    ')}
    </script>
</head>`;
}

function header(current) {
    const a = (href, text, key) => `<a href="${href}"${key === current ? ' class="is-current" aria-current="page"' : ''}>${text}</a>`;
    return `<body class="subpage">

    <!-- Icon sprite -->
    ${SPRITE}

    <a class="skip-link" href="#main">Skip to content</a>
    <div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>

    <header class="site-header" id="site-header">
        <div class="container header-inner">
            <a href="../index.html" class="brand">
                <span class="brand-mark">EO</span>
                <span class="brand-text">Edison Ochieng<small>Nexus CAD Studio</small></span>
            </a>

            <nav class="site-nav" id="site-nav" aria-label="Primary">
                ${a('../start/index.html', 'Start here', 'start')}
                ${a('../index.html#services', 'Services')}
                ${a('../index.html#work', 'Work', 'work')}
                ${a('../blog/index.html', 'CAD Tips', 'blog')}
                ${a('../index.html#pricing', 'Pricing')}
                ${a('../training/index.html', 'Training', 'training')}
                ${a('../calculators/index.html', 'Free tools', 'calculators')}
                ${a('../index.html#contact', 'Contact')}
                <button type="button" class="nav-search" data-search-open><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Search</button>
                <a href="../index.html#brief" class="btn btn-sun nav-cta">Start a project</a>
            </nav>

            <div class="header-tools">
                <button type="button" class="search-btn" data-search-open aria-label="Search the site" aria-keyshortcuts="Control+K /">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
                <div class="lang-switch" role="group" aria-label="Language">
                    <button type="button" data-lang="en" aria-pressed="true">EN</button>
                    <button type="button" data-lang="fr" aria-pressed="false">FR</button>
                    <button type="button" data-lang="sw" aria-pressed="false">SW</button>
                </div>
                <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch to dark mode">
                    <svg class="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
                    <svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                </button>
            </div>

            <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>
`;
}

function footer(extraScripts = '') {
    return `
    <footer class="site-footer">
        <div class="container footer-grid">
            <div class="footer-brand">
                <a href="../index.html" class="brand brand-light">
                    <span class="brand-mark">EO</span>
                    <span class="brand-text">Edison Ochieng<small>Nexus CAD Studio</small></span>
                </a>
                <p>CAD design, FEA simulation and CAD training from Nairobi, Kenya.</p>
            </div>
            <nav class="footer-col" aria-label="Footer">
                <h2>Explore</h2>
                <a href="../start/index.html">Start here: choose your path</a>
                <a href="../account/index.html">My account</a>
                <a href="../pay/index.html">Make a payment</a>
                <a href="../index.html#services">Services</a>
                <a href="../index.html#work">Work</a>
                <a href="../blog/index.html">CAD Tips</a>
                <a href="../training/index.html">CAD training</a>
                <a href="../calculators/index.html">Free tools</a>
                <a href="../quote/index.html">Sheet-metal quote tool</a>
                <a href="../steel/index.html">Gate &amp; grill estimator</a>
                <a href="../exams/index.html">SolidWorks exam practice</a>
                <a href="../index.html#pricing">Pricing</a>
                <a href="../index.html#brief">Start a project</a>
                <a href="../track/index.html">Track your project</a>
                <a href="../verify/index.html">Verify a certificate</a>
                <a href="../cv/index.html">Online CV</a>
                <a href="../cv-tailor/index.html">Free CV tailor</a>
                <a href="../index.html#faq">FAQ</a>
            </nav>
            <div class="footer-col">
                <h2>Connect</h2>
                <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>
                <a href="../index.html#contact" class="js-email" data-user="edisonochieng24" data-domain="gmail.com">Email</a>
                <a href="https://www.linkedin.com/in/edison-ochieng-870a37229/" target="_blank" rel="noopener">LinkedIn</a>
                <a href="https://edisonengineer.github.io/" target="_blank" rel="noopener" class="footer-recruit">Job portfolio (for recruiters)</a>
                <a href="https://www.instagram.com/e_d_i_s_o_n_engineer/" target="_blank" rel="noopener">Instagram</a>
            </div>
        </div>
        <div class="container footer-bottom">
            <p>&copy; <span id="year">2026</span> Edison Ochieng &middot; Nexus CAD Studio</p>
            <div class="footer-bottom-links">
                <a href="#main">Back to top &uarr;</a>
            </div>
        </div>
    </footer>

    <a class="fab-wa" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon('whatsapp')}</a>

${extraScripts}    <script defer src="../js/i18n.js?v=6" data-fr="../js/i18n-fr.js?v=39" data-sw="../js/i18n-sw.js?v=36" data-fr-sheet="../js/i18n-sheet-fr.js" data-sw-sheet="../js/i18n-sheet-sw.js"></script>
    <script defer src="../js/pages.js?v=20"></script>
    <script defer src="../js/account.js?v=4" data-api="${esc(CFG.trackerApi || CFG.reviewsApi || '')}"></script>${CFG.goatcounter ? `\n    <script defer src="../js/analytics.js?v=3" data-code="${esc(CFG.goatcounter)}"></script>` : ''}
    <script defer src="../js/search.js?v=1"></script>
</body>
</html>
`;
}

const cover = (o, cls) => `<div class="${cls} theme-${esc(o.theme || 'blue')}" aria-hidden="true">
                        <span class="pc-cover-icon">${icon(o.icon || 'cube')}</span>
                    </div>`;

/* ---------- Before / after comparison slider (project pages) ----------
   p.compare = { before, after, beforeLabel, afterLabel }: e.g. the CAD model and the FEA result.
   Both images: a drag-to-compare slider (js/pages.js). Only one: shown as a plain photo. */
function compareSection(p, has) {
    const c = p.compare || {}, b = has(c.before) ? c.before : '', a = has(c.after) ? c.after : '';
    if (!b && !a) return '';
    const bl = c.beforeLabel || 'Before', al = c.afterLabel || 'After';
    const sz = imageSize(path.join(ROOT, a || b)) || { w: 1200, h: 800 };
    const dims = ` width="${sz.w}" height="${sz.h}"`;
    const body = b && a ? `<figure class="ba" data-ba style="--pos: 50%; aspect-ratio: ${sz.w} / ${sz.h}">
                    <img class="ba-img" src="../${esc(a)}" alt="${esc(p.title)}: ${esc(al)}"${dims} loading="lazy" decoding="async">
                    <div class="ba-before"><img class="ba-img" src="../${esc(b)}" alt="${esc(p.title)}: ${esc(bl)}"${dims} loading="lazy" decoding="async"></div>
                    <span class="ba-tag ba-tag-l">${esc(bl)}</span>
                    <span class="ba-tag ba-tag-r">${esc(al)}</span>
                    <span class="ba-handle" aria-hidden="true"><span class="ba-knob"><svg viewBox="0 0 24 24"><path d="M9 6 3 12l6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>
                    <input class="ba-range" type="range" min="0" max="100" value="50" step="1" aria-label="Compare ${esc(bl)} and ${esc(al)}: move to reveal more of either image">
                </figure>
                <p class="ba-hint">Drag the handle (or use the arrow keys) to compare.</p>` :
        `<figure class="ba-single"><img src="../${esc(a || b)}" alt="${esc(p.title)}: ${esc(a ? al : bl)}"${dims} loading="lazy" decoding="async"><figcaption>${esc(a ? al : bl)}</figcaption></figure>`;
    return `
        <section class="section case-compare" aria-labelledby="compare-title">
            <div class="container">
                <p class="kicker">${b && a ? 'Before &amp; after' : 'Project image'}</p>
                <h2 class="section-title" id="compare-title">${b && a ? `${esc(bl)} <em>vs</em> ${esc(al)}` : esc(a ? al : bl)}.</h2>
                ${body}
            </div>
        </section>
`;
}

/* ---------- Project pages ---------- */
function projectPage(p, i, all) {
    const url = SITE + 'projects/' + p.id + '.html';
    // Only photos that exist (placeholders for files not uploaded yet are left out; pages rebuild when they arrive)
    const has = (f) => f && fs.existsSync(path.join(ROOT, String(f).split('?')[0]));
    const imgs = Array.from(new Set(p.gallery && p.gallery.length ? p.gallery : (p.cover ? [p.cover] : []))).filter(has);
    const image = SITE + (has(p.cover) ? p.cover : 'og-image.jpg?v=2');
    const prev = all[(i - 1 + all.length) % all.length];
    const next = all[(i + 1) % all.length];
    const description = p.summary.length > 160 ? p.summary.slice(0, 157).replace(/\s+\S*$/, '') + '…' : p.summary;
    const msg = encodeURIComponent('Hi Edison, I saw your "' + p.title + '" project on your portfolio and would like to discuss a similar project.');

    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: p.title,
        description: p.summary,
        url,
        image,
        keywords: (p.tags || []).join(', '),
        creator: { '@type': 'Person', name: 'Edison Ochieng', url: SITE },
        ...(p.year ? { dateCreated: p.year } : {})
    };

    return head({ title: p.title + ' | Edison Ochieng', description, url, image, type: 'article', jsonld }) + '\n' + header('work') + `
    <main id="main">
        <section class="page-hero theme-${esc(p.theme || 'blue')}">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../index.html#work">Work</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.title)}</span>
                </nav>
                <p class="page-kicker">${esc(LABEL[p.category] || p.category)}${p.year ? ' · ' + esc(p.year) : ''}</p>
                <h1 class="page-title">${esc(p.title)}</h1>
                <p class="page-lede">${esc(p.subtitle || '')}</p>
            </div>
        </section>

        <section class="section case">
            <div class="container case-grid">
                <div class="case-media" data-gallery data-title="${esc(p.title)}">
                    <div class="case-cover theme-${esc(p.theme || 'blue')}" data-cover>
                        <span class="pc-cover-icon">${icon(p.icon || 'cube')}</span>
                        <span class="pm-cover-title">${esc(p.title)}</span>
                        <span class="pm-cover-note">Project images coming soon</span>
                    </div>
                    <div class="case-gallery" hidden>
${imgs.map((src, k) => {
        // Smaller copy (name-800.jpg) in the grid when it exists; the full photo opens on tap
        const thumb = src.replace(/(\.\w+)$/, '-800$1');
        const shown = k > 0 && fs.existsSync(path.join(ROOT, thumb)) ? thumb : src;
        return `                        <button type="button" class="case-shot" data-i="${k}" data-full="../${esc(src)}" aria-label="View image ${k + 1} full screen"><img src="../${esc(shown)}" alt="${esc(p.title)}, image ${k + 1}" loading="${k ? 'lazy' : 'eager'}" decoding="async"></button>`;
    }).join('\n')}
                    </div>
                </div>

                <div class="case-body">
                    <h2 class="case-h">Overview</h2>
                    <p class="case-summary">${esc(p.summary)}</p>
${p.outcome ? `                    <p class="pc-outcome pm-outcome">${icon('check')}<span>${esc(p.outcome)}</span></p>
` : ''}${(p.deliverables || []).length ? `                    <h2 class="case-h">What the client received</h2>
                    <ul class="chip-row">${p.deliverables.map((t) => `<li class="chip chip-deliv">${esc(t)}</li>`).join('')}</ul>
` : ''}
                    <h2 class="case-h">Highlights</h2>
                    <ul class="pm-points">
${(p.points || []).map((t) => `                        <li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n')}
                    </ul>

${REVIEWS.filter((r) => r.project === p.id).map((r) => `                    <figure class="case-quote">
                        <span class="review-stars" role="img" aria-label="${Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5))} out of 5 stars">${[1, 2, 3, 4, 5].map((n) => `<svg class="${n <= (parseInt(r.rating, 10) || 5) ? 'on' : ''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('')}</span>
                        <blockquote>${esc(r.text)}</blockquote>
                        <figcaption><strong>${esc(r.name)}</strong>${r.role ? ' <span class="cq-role">' + esc(r.role) + '</span>' : ''}</figcaption>
                    </figure>
`).join('')}                    <dl class="pm-meta">
${(p.meta || []).map((m) => `                        <div><dt>${esc(m[0])}</dt><dd>${esc(m[1])}</dd></div>`).join('\n')}
                    </dl>

                    <ul class="chip-row">
${(p.tags || []).map((t) => `                        <li class="chip">${esc(t)}</li>`).join('\n')}
                    </ul>

                    <div class="pm-actions">
                        ${has(p.model) ? `<button type="button" class="btn btn-sun" data-model="../${esc(p.model)}" data-viewer="${esc(CFG.modelViewerSrc || '')}" hidden>${icon('cube')} View in 3D</button>` : ''}
                        ${has(p.pdf) ? `<a class="btn btn-navy" href="../${esc(p.pdf)}" target="_blank" rel="noopener" data-if-exists hidden>${icon('doc')} Read report</a>` : ''}
                        ${p.story && p.story.link && !(p.story.brief || p.story.approach || p.story.result) ? `<a class="btn btn-navy" href="../${esc(p.story.link.href)}">${icon('doc')} ${esc(p.story.link.label)}</a>` : ''}
                        <a class="btn btn-green" href="https://wa.me/${WHATSAPP}?text=${msg}" target="_blank" rel="noopener">${icon('whatsapp')} Discuss a similar project</a>
                        <a class="btn btn-outline" href="../index.html#brief">Start a project</a>
                    </div>
                </div>
            </div>
        </section>

${compareSection(p, has)}
${p.story && (p.story.brief || p.story.approach || p.story.result) ? `
        <section class="section case-story" aria-labelledby="story-title">
            <div class="container">
                <p class="kicker">Case study</p>
                <h2 class="section-title" id="story-title">From brief to <em>result</em>.</h2>
                <div class="story-grid">
${[['brief', 'The brief', 'doc'], ['approach', 'My approach', 'gear'], ['result', 'The result', 'award']].filter((x) => p.story[x[0]]).map((x, k) => `                    <article class="story-card">
                        <span class="story-step">${k + 1}</span>
                        <h3>${esc(x[1])}</h3>
                        <p>${esc(p.story[x[0]])}</p>
                    </article>`).join('\n')}
                </div>
${p.story.link ? `                <p class="story-link"><a class="btn btn-outline" href="../${esc(p.story.link.href)}">${esc(p.story.link.label)}</a></p>\n` : ''}            </div>
        </section>
` : ''}
        <nav class="container pager" aria-label="More projects">
            <a class="pager-link prev" href="${esc(prev.id)}.html"><small>Previous project</small><span>${esc(prev.title)}</span></a>
            <a class="pager-link all" href="../index.html#work">All work</a>
            <a class="pager-link next" href="${esc(next.id)}.html"><small>Next project</small><span>${esc(next.title)}</span></a>
        </nav>
    </main>

    <!-- Image viewer -->
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true">
        <div class="lightbox-bar">
            <p class="lightbox-title" id="lightbox-title"></p>
            <p class="lightbox-count" id="lightbox-count"></p>
            <button class="lb-btn" id="lightbox-close" aria-label="Close">${icon('close')}</button>
        </div>
        <button class="lb-btn lb-nav prev" id="lightbox-prev" aria-label="Previous image"><svg viewBox="0 0 24 24"><path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <figure class="lightbox-stage"><img id="lightbox-img" src="" alt="" decoding="async"></figure>
        <button class="lb-btn lb-nav next" id="lightbox-next" aria-label="Next image"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
` + footer();
}

/* ---------- Blog ---------- */
function postCard(post, prefix, h = 'h3') {
    return `<article class="post-card">
                    <a href="${prefix}${esc(post.slug)}.html" class="post-link">
                        ${post.image ? `<div class="post-cover has-photo" aria-hidden="true"><img src="${prefix === 'blog/' ? '' : '../'}${esc(post.image)}" alt="" loading="lazy" decoding="async"></div>` : cover(post, 'post-cover')}
                        <div class="post-body" data-no-i18n>
                            <p class="post-meta"><time datetime="${esc(post.date)}">${esc(fmtDate(post.date))}</time> · ${post.minutes} min read</p>
                            <${h}>${esc(post.title)}</${h}>
                            <p>${esc(post.description)}</p>
                        </div>
                    </a>
                </article>`;
}

function postPage(post, i, all) {
    const url = SITE + 'blog/' + post.slug + '.html';
    const image = SITE + (post.image || 'og-image.jpg?v=2');
    const others = all.filter((x) => x !== post).slice(0, 3);
    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated || post.date,
        url,
        image,
        keywords: (post.tags || []).join(', '),
        inLanguage: 'en',
        author: { '@type': 'Person', name: 'Edison Ochieng', url: SITE },
        publisher: { '@type': 'Organization', name: 'Nexus CAD Studio' }
    };
    return head({ title: post.title + ' | CAD Tips', description: post.description, url, image, type: 'article', jsonld, article: { published: post.date, modified: post.updated || post.date, tags: post.tags } }) + '\n' + header('blog') + `
    <main id="main">
        <section class="page-hero theme-${esc(post.theme || 'blue')}">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">CAD Tips</a>
                </nav>
                <h1 class="page-title" data-no-i18n>${esc(post.title)}</h1>
                <p class="page-byline"><span>By Edison Ochieng</span> · <time datetime="${esc(post.date)}" data-no-i18n>${esc(fmtDate(post.date))}</time> · <span>${post.minutes} min read</span></p>
            </div>
        </section>

        <section class="section article-wrap">
            <div class="container narrow">
                <p class="article-lang-note">This article is available in English only.</p>
                <article class="article" data-no-i18n>
${post.body.replace(/^/gm, '                    ')}
                </article>

                <ul class="chip-row article-tags" data-no-i18n>
${(post.tags || []).map((t) => `                    <li class="chip">${esc(t)}</li>`).join('\n')}
                </ul>

                <aside class="article-cta">
                    <div>
                        <h2>Need help with a design?</h2>
                        <p>CAD modelling, simulation, technical drawings and training from Nexus CAD Studio.</p>
                    </div>
                    <div class="article-cta-actions">
                        <a class="btn btn-sun" href="../index.html#brief">Start a project</a>
                        <a class="btn btn-outline-light" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a>
                    </div>
                </aside>
            </div>
        </section>
${others.length ? `
        <section class="section more-posts">
            <div class="container">
                <h2 class="section-title more-title">More CAD tips</h2>
                <div class="post-grid">
                ${others.map((x) => postCard(x, '')).join('\n                ')}
                </div>
            </div>
        </section>
` : ''}${leadMagnet('../')}${downloadsBand('../')}${newsletter()}    </main>
` + footer();
}

function blogIndex(posts) {
    const url = SITE + 'blog/';
    const description = 'Practical CAD tips from Edison Ochieng: AutoCAD shortcuts, design for manufacturing, choosing CAD software and working with a designer.';
    const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'CAD Tips by Edison Ochieng',
        description,
        url,
        author: { '@type': 'Person', name: 'Edison Ochieng', url: SITE },
        blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + 'blog/' + p.slug + '.html', datePublished: p.date }))
    };
    return head({ title: 'CAD Tips | Edison Ochieng', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld }) + '\n' + header('blog') + `
    <main id="main">
        <section class="page-hero theme-blue">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">CAD Tips</span>
                </nav>
                <p class="page-kicker">Blog</p>
                <h1 class="page-title">CAD Tips</h1>
                <p class="page-lede">Practical advice on CAD software, design for manufacturing and getting your projects made, from my training sessions and client work.</p>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="post-grid">
                ${posts.map((x) => postCard(x, '', 'h2')).join('\n                ')}
                </div>
            </div>
        </section>
${leadMagnet('../')}${downloadsBand('../')}${newsletter()}    </main>
` + footer();
}

/* ---------- CAD training page ---------- */
function loadTraining() {
    const ctx = { window: {} };
    vm.runInNewContext(read('content/courses.js'), ctx);
    vm.runInNewContext(read('js/sheet-data.js'), ctx);   // Courses tab + training settings from the Google Sheet
    const T = ctx.window.TRAINING;
    T.students = ctx.window.STUDENT_WORK || [];         // Student work tab (only students who agreed)
    // Full syllabi from content/syllabus.json (tools/import-syllabus.py). Matched by name, ignoring "Autodesk".
    const key = (n) => String(n || '').toLowerCase().replace(/^autodesk\s+/, '').replace(/[^a-z0-9]+/g, '');
    const syl = fs.existsSync(path.join(ROOT, 'content/syllabus.json')) ? JSON.parse(read('content/syllabus.json')).courses : [];
    T.courses.forEach((c) => { c.syllabus = syl.find((s) => [s.name].concat(s.aliases || []).some((n) => key(n) === key(c.name))) || null; });
    // Courses with a syllabus and a "card" but not (yet) in the Courses tab are added after the others
    syl.filter((s) => s.card && !T.courses.some((c) => c.syllabus === s)).forEach((s) => T.courses.push({
        id: s.id, name: s.name, theme: s.card.theme || 'blue', icon: s.card.icon || 'cube', tagline: s.card.tagline || '', levels: s.card.levels || '',
        topics: s.sessions.slice(0, 8).map((x) => x.title), sessions: '', projects: [], syllabus: s
    }));
    T.courses.forEach((c) => {
        const s = c.syllabus;
        if (!s) return;
        c.syllabusSummary = s.sessions.length + ' sessions · ' + s.total;
        if (!c.sessions) c.sessions = c.syllabusSummary;
        if (!c.topics || !c.topics.length) c.topics = s.sessions.slice(0, 8).map((x) => x.title);
    });
    return T;
}

// "4 hours" / "2–4 hours" / "60–76 hours" -> ISO 8601 for structured data (lower bound)
const isoHours = (h) => { const n = parseFloat(String(h || '')); return n > 0 ? 'PT' + n + 'H' : undefined; };

function syllabusSection(c) {
    const s = c.syllabus;
    if (!s) return '';
    const topics = s.sessions.reduce((a, x) => a + x.topics, 0);
    const pdf = 'pdfs/syllabus/' + c.id + '.pdf';
    const hasPdf = fs.existsSync(path.join(ROOT, pdf));
    const api = CFG.trackerApi || CFG.reviewsApi;
    return `
        <section class="section syllabus" id="syllabus">
            <div class="container">
                <header class="syl-head">
                    <div>
                        <p class="kicker">Course syllabus</p>
                        <h2 class="section-title">Everything we'll <em>cover</em>.</h2>
                    </div>
                    <div class="syl-tools">
                        <button type="button" class="btn btn-outline btn-sm" data-syl-toggle>Expand all</button>
                        ${hasPdf ? `<a class="btn btn-outline btn-sm" href="../${esc(pdf)}" download data-track="syllabus-pdf-${esc(c.id)}">${icon('doc')} Download PDF</a>` : `<button type="button" class="btn btn-outline btn-sm" data-syl-print>${icon('doc')} Print / save as PDF</button>`}
                    </div>
                </header>
                <ul class="syl-stats">
                    <li><strong>${esc(s.total)}</strong><span>in total</span></li>
                    <li><strong>${s.sessions.length}</strong><span>sessions</span></li>
                    <li><strong>${topics}</strong><span>topics</span></li>
                    ${s.perDay ? `<li><strong>${esc(s.perDay)}</strong><span>per session</span></li>` : '<li><strong>Online or Nairobi</strong><span>one-on-one or group</span></li>'}
                </ul>
                ${hasPdf && api ? `<div class="syl-get">
                    <div class="syl-get-copy">
                        <span class="syl-get-icon">${icon('doc')}</span>
                        <div><h3>Get the syllabus as a PDF</h3><p>Sent to your inbox, to read later or share with your employer.</p></div>
                    </div>
                    <form class="syl-form" data-sheet="${esc(api)}" data-id="${esc(c.id)}" data-course="${esc(c.name)}" novalidate>
                        <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <label class="sr-only" for="syl-name">Your name</label>
                        <input id="syl-name" name="name" type="text" autocomplete="name" placeholder="Your name (optional)">
                        <label class="sr-only" for="syl-email">Email</label>
                        <input id="syl-email" name="email" type="email" autocomplete="email" placeholder="Your email" required>
                        <button type="submit" class="btn btn-sun">Email me the PDF</button>
                        <p class="form-error" role="alert" hidden></p>
                    </form>
                    <div class="syl-done" hidden tabindex="-1">
                        <p><strong>Sent! Check your inbox.</strong> <span>Or download it now:</span> <a href="../${esc(pdf)}" target="_blank" rel="noopener" data-track="syllabus-download">${esc(c.name)} syllabus (PDF)</a></p>
                    </div>
                </div>` : ''}
                <ol class="syl-list">
${s.sessions.map((x, i) => `                    <li>
                        <details class="syl-session"${i === 0 ? ' open' : ''}>
                            <summary>
                                <span class="syl-num">Session ${i + 1}</span>
                                <span class="syl-title">${esc(x.title)}</span>
                                <span class="syl-meta"><span class="syl-hours">${icon('clock')} <span>${esc(x.hours)}</span></span><span class="syl-count">${x.topics} topics</span></span>
                            </summary>
                            <div class="syl-body" data-no-i18n>
${x.groups.map((g) => `                                <div class="syl-group">${g.h ? `<h3>${esc(g.h)}</h3>` : ''}${g.items.length ? `<ul>${g.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`).join('\n')}
                            </div>
                        </details>
                    </li>`).join('\n')}
                </ol>
                <p class="syl-note">Sessions follow this order, at a pace that suits you. One-on-one courses can skip what you already know or go deeper on what you need.</p>
            </div>
        </section>
`;
}

/* ---------- Training: student work and course pages ---------- */
const sameCourse = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
// Projects in js/projects.js / the Works tab that belong to a course (project field "course")
const courseProjects = (c) => projects.filter((p) => p.course && sameCourse(p.course, c.name));

function studentCard(st, prefix, T) {
    const c = T.courses.find((x) => sameCourse(x.name, st.course));
    const first = (st.photos || [])[0];
    const thumb = first && fs.existsSync(path.join(ROOT, first.replace(/(\.\w+)$/, '-800$1'))) ? first.replace(/(\.\w+)$/, '-800$1') : first;
    return `<figure class="student-card">
                        ${first ? `<a class="student-media" href="${esc(prefix + first)}" target="_blank" rel="noopener"><img src="${esc(prefix + thumb)}" alt="${esc(st.project + ' by ' + st.name)}" loading="lazy" decoding="async">${st.photos.length > 1 ? `<span class="student-count">${icon('image')} ${st.photos.length}</span>` : ''}</a>` : ''}
                        <figcaption>
                            <strong>${esc(st.project)}</strong>
                            <span class="student-by"><span data-no-i18n>${esc(st.name)}</span>${st.course ? ` · ${c ? `<a href="${esc(prefix + 'training/' + c.id + '.html')}">${esc(st.course)}</a>` : esc(st.course)}` : ''}</span>
                            ${st.quote ? `<blockquote>${esc(st.quote)}</blockquote>` : ''}
                        </figcaption>
                    </figure>`;
}
function studentSection(list, prefix, T, title) {
    if (!list.length) return '';
    return `
        <section class="section student-work" id="student-work">
            <div class="container">
                <header class="section-head center">
                    <p class="kicker">Student work</p>
                    <h2 class="section-title">${title}</h2>
                    <p class="section-lede">Projects my trainees modelled in class, shared with their permission.</p>
                </header>
                <div class="student-grid">
                    ${list.map((st) => studentCard(st, prefix, T)).join('\n                    ')}
                </div>
            </div>
        </section>
`;
}

function coursePage(c, T) {
    const url = SITE + 'training/' + c.id + '.html';
    const built = courseProjects(c);
    const students = T.students.filter((st) => sameCourse(st.course, c.name));
    const description = (c.name + ' training in Nairobi or online: ' + c.tagline + '. ' + c.levels + '.' + (c.sessions ? ' ' + c.sessions + '.' : '')).slice(0, 300);
    const cover = built.find((p) => p.cover && fs.existsSync(path.join(ROOT, p.cover)));
    const image = SITE + (cover ? cover.cover : 'og-image.jpg?v=2');
    const kes = (n) => 'KES ' + Number(n).toLocaleString('en-US');
    const reserve = 'index.html?course=' + encodeURIComponent(c.name) + '#reserve';
    const jsonld = {
        '@context': 'https://schema.org', '@type': 'Course', name: c.name + ' training', description, url,
        provider: { '@type': 'Organization', name: 'Nexus CAD Studio', sameAs: SITE },
        teaches: c.topics,
        offers: { '@type': 'Offer', category: 'Paid', price: T.price, priceCurrency: 'KES', url: SITE + 'training/' + reserve },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: ['Online', 'Onsite'], location: 'Nairobi, Kenya',
            ...(c.syllabus && isoHours(c.syllabus.total) ? { courseWorkload: isoHours(c.syllabus.total) } : c.sessions ? { courseWorkload: c.sessions } : {}) },
        ...(c.syllabus ? { syllabusSections: c.syllabus.sessions.map((x) => ({ '@type': 'Syllabus', name: x.title, timeRequired: isoHours(x.hours),
            description: x.groups.map((g) => (g.h ? g.h + ': ' : '') + g.items.join(', ')).join('; ').slice(0, 500) })) } : {})
    };
    const others = T.courses.filter((x) => x !== c).slice(0, 6);
    return head({ title: c.name + ' Training in Nairobi & Online | Nexus CAD Studio', description, url, image, type: 'website', jsonld }) + '\n' + header('training') + `
    <main id="main">
        <section class="page-hero theme-${esc(c.theme)}">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">CAD training</a><span aria-hidden="true">/</span><span aria-current="page">${esc(c.name)}</span>
                </nav>
                <p class="page-kicker">${esc(c.levels)}</p>
                <h1 class="page-title">${esc(c.name)} training.</h1>
                <p class="page-lede">${esc(c.tagline)}</p>
                <p class="course-seats course-seats-hero" data-seats="${esc(c.name)}" hidden></p>
                <div class="hero-actions page-actions">
                    <a class="btn btn-sun btn-lg" href="${esc(reserve)}" data-track="course-reserve">Reserve a seat ${icon('arrow')}</a>
                    ${c.syllabus ? `<a class="btn btn-outline-light btn-lg" href="#syllabus">See the full syllabus</a>` : ''}
                    <a class="btn btn-outline-light btn-lg" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Edison, I would like to know more about the ' + c.name + ' training.')}" target="_blank" rel="noopener">${icon('whatsapp')} Ask on WhatsApp</a>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="container course-detail">
                <div class="train-facts">
                    <div><span class="tf-label">Starting from</span><strong data-kes="${T.price}">${kes(T.price)}</strong><span class="tf-sub">per trainee</span></div>
                    <div><span class="tf-label">Length</span><strong class="tf-text">${c.sessions ? esc(c.sessions) : 'Set to your goals'}</strong><span class="tf-sub">Evenings and weekends available</span></div>
                    <div><span class="tf-label">Level</span><strong class="tf-text">${esc(c.levels)}</strong><span class="tf-sub">Hands-on from the first session</span></div>
                    <div><span class="tf-label">Where</span><strong class="tf-text">Online or Nairobi</strong><span class="tf-sub">One-on-one, group or company</span></div>
                </div>

                <div class="course-cols">
                    <div>
                        <h2 class="train-h">What you'll learn</h2>
                        <ul class="pm-points">
${c.topics.map((t) => `                            <li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n')}
                        </ul>
                    </div>
                    ${built.length || (c.projects || []).length ? `<div>
                        <h2 class="train-h">What you'll build</h2>
                        ${built.map((p) => `<a class="course-build" href="../projects/${esc(p.id)}.html">
                            ${p.cover && fs.existsSync(path.join(ROOT, p.cover)) ? `<img src="../${esc(p.cover)}" alt="" loading="lazy" decoding="async">` : `<span class="pc-cover-icon">${icon(p.icon || 'cube')}</span>`}
                            <span><strong>${esc(p.title)}</strong><span>${esc(p.outcome || p.subtitle || '')}</span>${p.model ? `<span class="course-build-3d">${icon('cube')} 3D model</span>` : ''}</span>
                        </a>`).join('\n                        ')}
                        ${(c.projects || []).filter((t) => !built.some((p) => sameCourse(p.title, t))).length ? `<ul class="pm-points">${c.projects.filter((t) => !built.some((p) => sameCourse(p.title, t))).map((t) => `<li>${icon('cube')}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
                    </div>` : ''}
                </div>
            </div>
        </section>
${syllabusSection(c)}${studentSection(students, '../', T, 'Built by ' + esc(c.name) + ' trainees.')}${/solidworks/i.test(c.id) ? `
        <section class="section course-exam-band">
            <div class="container verify-cta">
                <span class="verify-cta-icon">${icon('award')}</span>
                <div>
                    <h2>Going for the CSWA certificate?</h2>
                    <p>Try a free timed practice test: theory questions and drawings to model, marked straight away.</p>
                </div>
                <div class="band-actions"><a class="btn btn-navy" href="../exams/index.html">Free practice test ${icon('arrow')}</a></div>
            </div>
        </section>${leadMagnet('../')}` : ''}
        <section class="section course-reserve-band">
            <div class="container verify-cta">
                <span class="verify-cta-icon">${icon('cap')}</span>
                <div>
                    <h2>Ready to learn ${esc(c.name)}?</h2>
                    <p>Tell me when you're free and your level. I'll reply within a day with the schedule and fees.</p>
                </div>
                <div class="band-actions">
                    <a class="btn btn-sun" href="${esc(reserve)}">Reserve a seat ${icon('arrow')}</a>
                    ${CFG.bookingUrl ? `<a class="btn btn-outline" href="${esc(CFG.bookingUrl)}" target="_blank" rel="noopener" data-track="course-book-call">${icon('calendar')} Book a free call</a>` : ''}
                </div>
            </div>
        </section>

${(T.faq || []).length ? `        <section class="section course-faq" id="faq">
            <div class="container narrow">
                <h2 class="train-h">Questions before you start?</h2>
                <div class="faq-list">
${T.faq.map(([q, a], i) => `                    <details class="faq-item"${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><div class="faq-body"><p>${esc(a)}</p></div></details>`).join('\n')}
                </div>
                <p class="course-faq-more">Another question? <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Edison, I have a question about the ' + c.name + ' training.')}" target="_blank" rel="noopener">Ask on WhatsApp</a>${CFG.bookingUrl ? ` or <a href="${esc(CFG.bookingUrl)}" target="_blank" rel="noopener">book a free call</a>` : ''}.</p>
            </div>
            <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: T.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }).replace(/</g, '\\u003c')}</script>
        </section>
` : ''}
        <section class="section">
            <div class="container">
                <h2 class="train-h">Other courses</h2>
                <div class="course-links">
                    ${others.map((x) => `<a class="chip" href="${esc(x.id)}.html">${esc(x.name)}</a>`).join('\n                    ')}
                    <a class="chip" href="index.html#courses">All courses</a>
                </div>
            </div>
        </section>
        <div class="course-bar" data-course-bar aria-hidden="true">
            <div class="course-bar-text"><strong>${esc(c.name)}</strong><span>${esc(c.syllabusSummary || c.levels)}</span></div>
            <a class="btn btn-sun" href="${esc(reserve)}" tabindex="-1" data-track="course-bar-reserve">Reserve a seat</a>
        </div>
    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/currency.js?v=1"></script>\n    <script defer src="../js/training.js?v=2"></script>\n');
}

// After reserving a seat: pay a deposit by M-Pesa to hold it, then send the M-Pesa code (Payments tab of the sheet)
function seatDeposit(T) {
    const pay = CFG.payments || {};
    const pct = Number(T.depositPct) || 0;
    const amount = Math.round((Number(T.price) || 0) * pct / 100);
    const api = CFG.trackerApi || CFG.reviewsApi;
    if (!amount || !pay.mpesaTill || !api) return '';
    const qr = pay.mpesaQr && fs.existsSync(path.join(ROOT, pay.mpesaQr)) ? '../' + pay.mpesaQr : '';
    const full = Math.round(Number(T.price) || 0);
    return `                        <div class="seat-deposit" data-deposit="${amount}" data-sheet="${esc(api)}">
                            <h4>Hold your seat with a deposit</h4>
                            <p>Pay the suggested deposit, the full fee, or any amount you like by M-Pesa. It's part of your fee, not extra.</p>
                            <div class="amt-pick" role="group" aria-label="Amount">
                                <button type="button" class="amt-chip is-on" data-amt="${amount}"><span>Deposit</span> <strong data-no-i18n>KES ${amount.toLocaleString('en-US')}</strong></button>
                                ${full > amount ? `<button type="button" class="amt-chip" data-amt="${full}"><span>Full fee</span> <strong data-no-i18n>KES ${full.toLocaleString('en-US')}</strong></button>` : ''}
                                <button type="button" class="amt-chip" data-amt="">Other amount</button>
                            </div>
                            <div class="field amt-field"><label for="seat-amount">Amount (KES)</label><input id="seat-amount" class="seat-amount" type="number" min="1" max="1000000" step="1" inputmode="numeric" value="${amount}"></div>
                            <div class="seat-pay">
                                ${qr ? `<img src="${esc(qr)}" alt="M-Pesa till QR code" width="110" height="110" loading="lazy">` : ''}
                                <ol>
                                    <li>M-Pesa → Lipa na M-Pesa → <strong>Buy Goods and Services</strong></li>
                                    <li>Till number <strong data-no-i18n>${esc(pay.mpesaTill)}</strong>${pay.mpesaName ? ` (<span data-no-i18n>${esc(pay.mpesaName)}</span>)` : ''}</li>
                                    <li>Amount <strong class="seat-amt-text" data-no-i18n>KES ${amount.toLocaleString('en-US')}</strong>, then enter the M-Pesa code below</li>
                                </ol>
                            </div>
                            <form class="seat-code-form" novalidate>
                                <label for="seat-code">M-Pesa confirmation code</label>
                                <div class="seat-code-row">
                                    <input id="seat-code" name="code" type="text" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. SKL4ABCD12" required>
                                    <button type="submit" class="btn btn-sun">Send code</button>
                                </div>
                                <p class="form-error" role="alert" hidden></p>
                            </form>
                            <p class="seat-paid" hidden tabindex="-1"><strong>Thank you!</strong> I'll check the payment and email your receipt. Your seat is held.</p>
                            <p class="seat-later">Prefer to pay later? You can also pay when I confirm the schedule.</p>
                        </div>
`;
}

function trainingPage(T) {
    const url = SITE + 'training/';
    const description = 'Learn AutoCAD, SolidWorks, Autodesk Inventor or Fusion 360 with Edison Ochieng, SOLIDWORKS-trained CAD designer. One-on-one, group and company training, online or in Nairobi.';
    const cfg = { window: {} };
    vm.runInNewContext(read('js/config.js'), cfg);
    const key = cfg.window.SITE_CONFIG.web3formsKey;
    const kes = (n) => 'KES ' + Number(n).toLocaleString('en-US');
    const jsonld = {
        '@context': 'https://schema.org',
        '@graph': T.courses.map((c) => ({
            '@type': 'Course',
            name: c.name + ' training',
            description: c.tagline + '. ' + c.topics.join('; ') + '.',
            provider: { '@type': 'Organization', name: 'Nexus CAD Studio', sameAs: SITE },
            offers: { '@type': 'Offer', category: 'Paid', price: T.price, priceCurrency: 'KES' },
            hasCourseInstance: { '@type': 'CourseInstance', courseMode: ['Online', 'Onsite'], location: 'Nairobi, Kenya' }
        }))
    };
    const opt = (v, label) => `<option value="${esc(v)}">${esc(label || v)}</option>`;
    return head({ title: 'CAD Training: AutoCAD, SolidWorks, Inventor & Fusion 360 | Edison Ochieng', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld }) + '\n' + header('training') + `
    <main id="main">
        <section class="page-hero theme-teal">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">CAD training</span>
                </nav>
                <p class="page-kicker">CAD training</p>
                <h1 class="page-title">Learn CAD with a practising engineer.</h1>
                <p class="page-lede">Practical, project-based training in AutoCAD, SolidWorks, Autodesk Inventor and Fusion 360. Over 100 people trained so far.</p>
                <div class="hero-actions page-actions">
                    <a class="btn btn-sun btn-lg" href="#reserve">Reserve a seat ${icon('arrow')}</a>
                    <a class="btn btn-outline-light btn-lg" href="#courses">See the courses</a>
                </div>
            </div>
        </section>

        <section class="section training-intro">
            <div class="container">
                <div class="train-facts">
                    <div><span class="tf-label">Starting from</span><strong data-kes="${T.price}">${kes(T.price)}</strong><span class="tf-sub">per trainee</span></div>
                    <div><span class="tf-label">Next intake</span><strong class="tf-text">${T.nextIntake ? esc(T.nextIntake) : 'Dates on request'}</strong><span class="tf-sub">Evenings and weekends available</span></div>
                    <div><span class="tf-label">Where</span><strong class="tf-text">Online or Nairobi</strong><span class="tf-sub">Your choice</span></div>
                    <div class="tf-currency"><span class="tf-label">Show prices in</span>
                        <div class="currency-switch" role="group" aria-label="Currency">
                            <button type="button" data-currency="KES" aria-pressed="true">KES</button>
                            <button type="button" data-currency="USD" aria-pressed="false">USD</button>
                        </div>
                    </div>
                </div>

                <h2 class="train-h">Choose how you learn</h2>
                <div class="train-formats">
${T.formats.map((f) => `                    <article class="train-format"><span class="tfm-icon">${icon(f.icon)}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></article>`).join('\n')}
                </div>
            </div>
        </section>

        <section class="section course-compare" id="compare">
            <div class="container">
                <header class="section-head center">
                    <p class="kicker">Compare</p>
                    <h2 class="section-title">Which course is <em>right for you</em>?</h2>
                    <p class="section-lede">Every course at a glance. Open a course for its full syllabus, session by session.</p>
                </header>
                <div class="compare-wrap">
                    <table class="compare-table">
                        <thead><tr><th scope="col">Course</th><th scope="col">Best for</th><th scope="col">Level</th><th scope="col">Length</th><th scope="col"><span class="sr-only">Details</span></th></tr></thead>
                        <tbody>
${T.courses.map((c) => `                            <tr>
                                <th scope="row"><a href="${esc(c.id)}.html" class="cmp-name"><span class="cmp-icon theme-${esc(c.theme)}">${icon(c.icon)}</span><span>${esc(c.name)}</span></a></th>
                                <td><span class="cmp-label">Best for:</span> ${esc(c.tagline)}</td>
                                <td><span class="cmp-label">Level:</span> ${esc(c.levels)}</td>
                                <td><span class="cmp-label">Length:</span> ${c.syllabusSummary ? esc(c.syllabusSummary) : c.sessions ? esc(c.sessions) : 'Set to your goals'}</td>
                                <td class="cmp-go"><a href="${esc(c.id)}.html${c.syllabus ? '#syllabus' : ''}">${c.syllabus ? 'Syllabus' : 'Details'} ${icon('arrow')}</a></td>
                            </tr>`).join('\n')}
                        </tbody>
                    </table>
                </div>
                <p class="compare-note">Not sure? <a href="#reserve" data-course="Not sure yet">Tell me your goals</a> and I'll suggest the right course.</p>
            </div>
        </section>

        <section class="section training-courses" id="courses">
            <div class="container">
                <header class="section-head center">
                    <p class="kicker">Courses</p>
                    <h2 class="section-title">Pick your <em>software</em>.</h2>
                    <p class="section-lede">Every course mixes short demonstrations with hands-on exercises, and you keep all the practice files.</p>
                </header>
                <div class="course-grid">
${T.courses.map((c) => `                    <article class="course-card theme-${esc(c.theme)}" id="course-${esc(c.id)}">
                        <div class="course-top">
                            <span class="pc-cover-icon">${icon(c.icon)}</span>
                            <div><h3>${esc(c.name)}</h3><p>${esc(c.tagline)}</p></div>
                        </div>
                        <p class="course-level">${icon('award')} <span>${esc(c.levels)}</span></p>
                        ${c.syllabusSummary ? `<p class="course-length">${icon('clock')} <span>${esc(c.syllabusSummary)}</span></p>` : ''}
                        <p class="course-seats" data-seats="${esc(c.name)}" hidden></p>
                        <h4>What you'll learn</h4>
                        <ul class="pm-points">
${c.topics.map((t) => `                            <li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n')}
                        </ul>
                        <div class="course-ctas">
                            <a class="btn btn-outline course-cta" href="#reserve" data-course="${esc(c.name)}">Reserve a seat ${icon('arrow')}</a>
                            <a class="course-more" href="${esc(c.id)}.html${c.syllabus ? '#syllabus' : ''}">${c.syllabus ? 'Full syllabus' : 'Course details' + (courseProjects(c).length ? ' & projects' : '')} ${icon('arrow')}</a>
                        </div>
                    </article>`).join('\n')}
                </div>
            </div>
        </section>
${studentSection(T.students, '../', T, 'Made by my <em>trainees</em>.')}
        <section class="section training-reserve" id="reserve">
            <div class="container reserve-grid">
                <div class="reserve-intro">
                    <p class="kicker">Reserve a seat</p>
                    <h2 class="section-title">Ready to <em>start</em>?</h2>
                    <p class="section-lede">Tell me which course you'd like and when you're free. I'll reply within a day with the schedule and fees.</p>
                    <div class="faq-list train-faq">
${T.faq.map(([q, a], i) => `                        <details class="faq-item"${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><div class="faq-body"><p>${esc(a)}</p></div></details>`).join('\n')}
                    </div>
                </div>

                <div class="reserve-card">
                    <form class="reserve-form" id="reserve-form" data-web3${CFG.trackerApi || CFG.reviewsApi ? ` data-sheet="${esc(CFG.trackerApi || CFG.reviewsApi)}" data-sheet-action="reserve"` : ''} novalidate>
                        <input type="hidden" name="access_key" value="${esc(key)}">
                        <input type="hidden" name="subject" value="New CAD training seat request">
                        <input type="hidden" name="from_name" value="Portfolio: CAD training">
                        <input type="hidden" name="Reference" value="">
                        <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <div class="field-grid">
                            <div class="field"><label for="tr-name">Full name <span class="req">*</span></label><input id="tr-name" name="name" type="text" autocomplete="name" required></div>
                            <div class="field"><label for="tr-phone">Phone / WhatsApp <span class="req">*</span></label><input id="tr-phone" name="Phone / WhatsApp" type="tel" autocomplete="tel" required></div>
                        </div>
                        <div class="field"><label for="tr-email">Email <span class="req">*</span></label><input id="tr-email" name="email" type="email" autocomplete="email" required></div>
                        <div class="field-grid">
                            <div class="field"><label for="tr-course">Course <span class="req">*</span></label>
                                <select id="tr-course" name="Course" required>
                                    <option value="">Choose a course</option>
                                    ${T.courses.map((c) => opt(c.name)).join('')}
                                    ${opt('Not sure yet', 'Not sure yet, please advise')}
                                </select>
                            </div>
                            <div class="field"><label for="tr-level">Your level</label>
                                <select id="tr-level" name="Level">
                                    ${opt('Complete beginner')}${opt('Some experience')}${opt('Confident, want to go further')}
                                </select>
                            </div>
                        </div>
                        <div class="field-grid">
                            <div class="field"><label for="tr-format">Format</label>
                                <select id="tr-format" name="Format">
                                    ${opt('One-on-one online')}${opt('One-on-one in Nairobi')}${opt('Small group')}${opt('Company team')}
                                </select>
                            </div>
                            <div class="field"><label for="tr-when">Best time</label>
                                <select id="tr-when" name="Preferred schedule">
                                    ${opt('Weekday evenings')}${opt('Weekends')}${opt('Weekday daytime')}${opt('Flexible')}
                                </select>
                            </div>
                        </div>
                        <div class="field"><label for="tr-notes">Anything else? <small>(optional)</small></label><textarea id="tr-notes" name="Message" rows="3" placeholder="Your goals, e.g. CSWA exam, a school project, a new job..."></textarea></div>
                        <div class="field discount-field"><label for="tr-code">Discount or referral code <small>(optional)</small></label><input id="tr-code" name="Discount code" type="text" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. TRAIN20" data-discount data-discount-for="Training" data-discount-email="#tr-email" data-discount-price="${T.price}"><p class="discount-msg" aria-live="polite" hidden></p></div>
                        <p class="form-error" role="alert" hidden></p>
                        <button type="submit" class="btn btn-sun btn-lg btn-block">Reserve my seat</button>
                        <button type="button" class="btn btn-green btn-block" data-wa-form>${icon('whatsapp')} Send on WhatsApp instead</button>
                    </form>
                    <div class="form-done" hidden tabindex="-1">
                        <span class="done-icon">${icon('check')}</span>
                        <h3>Seat request sent!</h3>
                        <p>Thank you. I'll get back to you within a day with the schedule and fees.</p>
                        <p class="seat-ref" hidden>Your reference: <strong data-no-i18n data-seat-ref></strong></p>
${seatDeposit(T)}                        <a class="btn btn-outline" href="../index.html#webinar">Join the free webinar meanwhile</a>
                    </div>
                </div>
            </div>
        </section>

${leadMagnet('../')}${downloadsBand('../')}
        <section class="section verify-band">
            <div class="container verify-cta">
                <span class="verify-cta-icon">${icon('award')}</span>
                <div>
                    <h2>Trained with me?</h2>
                    <p>Every certificate has a unique code. Employers can check it online in seconds.</p>
                </div>
                <a class="btn btn-navy" href="../verify/">Verify a certificate ${icon('arrow')}</a>
            </div>
        </section>
${newsletter()}    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/currency.js?v=1"></script>\n    <script defer src="../js/training.js?v=2"></script>\n    <script defer src="../js/discount.js?v=1"></script>\n');
}

/* ---------- Free tools (calculators) ---------- */
function calculatorsPage() {
    const url = SITE + 'calculators/';
    const description = 'Free sheet-metal bend allowance calculator, print size & DPI calculator and engineering unit converter by Edison Ochieng, Nexus CAD Studio.';
    const jsonld = {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'WebApplication', name: 'Sheet metal bend allowance calculator', url: url + '#bend', applicationCategory: 'EngineeringApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'KES' } },
            { '@type': 'WebApplication', name: 'Print size and DPI calculator', url: url + '#print', applicationCategory: 'DesignApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'KES' } },
            { '@type': 'WebApplication', name: 'Engineering unit converter', url: url + '#units', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'KES' } }
        ]
    };
    const num = (name, label, value, attrs = '') => `<div class="field"><label for="c-${name}">${label}</label><input id="c-${name}" name="${name}" type="number" inputmode="decimal" step="any" value="${value}" ${attrs}></div>`;
    const cta = (text, href, brief) => `<p class="tool-cta"><span>${text}</span> <a class="btn btn-sun" href="${href}"${brief ? ` data-brief="${brief}"` : ''}>Start a project ${icon('arrow')}</a></p>`;
    return head({ title: 'Free Tools: Bend Allowance, Print DPI & Unit Converter | Edison Ochieng', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld }) + '\n' + header('calculators') + `
    <main id="main">
        <section class="page-hero theme-teal">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Free tools</span>
                </nav>
                <p class="page-kicker">Free tools</p>
                <h1 class="page-title">Handy calculators for makers and designers.</h1>
                <p class="page-lede">Quick answers for sheet-metal parts, print files and engineering units. Free, no sign-up, and everything runs in your browser.</p>
                <nav class="tool-nav" aria-label="Tools">
                    <a href="#bend">${icon('gear')} Bend allowance</a>
                    <a href="#print">${icon('image')} Print size &amp; DPI</a>
                    <a href="#units">${icon('chart')} Unit converter</a>
                    <a href="../quote/index.html">${icon('wallet')} Sheet-metal quote tool</a>
                    <a href="../steel/index.html">${icon('wallet')} Gate &amp; grill estimator</a>
                </nav>
            </div>
        </section>

        <section class="section tool" id="bend">
            <div class="container tool-grid">
                <div class="tool-intro">
                    <p class="kicker">Sheet metal</p>
                    <h2 class="tool-title">Bend allowance &amp; flat length</h2>
                    <p>Work out how long to cut a flat blank so it bends to the right size. Enter the outside lengths of the two flanges, the material thickness, the inside bend radius and the K-factor.</p>
                    <details class="tool-help">
                        <summary>How it's calculated</summary>
                        <ul>
                            <li><strong>Bend allowance</strong> BA = angle (radians) × (R + K × T)</li>
                            <li><strong>Outside setback</strong> OSSB = tan(angle ÷ 2) × (R + T)</li>
                            <li><strong>Bend deduction</strong> BD = 2 × OSSB − BA</li>
                            <li><strong>Flat length</strong> = A + B − BD</li>
                        </ul>
                        <p>The K-factor is where the neutral axis sits through the thickness. It depends on the material, tooling and bending method, and is usually 0.3 to 0.5. Ask your fabricator for theirs.</p>
                    </details>
                </div>
                <div class="tool-card">
                    <form id="bend-form" class="tool-form" novalidate>
                        <div class="field-grid">
                            <div class="field"><label for="c-unit">Units</label><select id="c-unit" name="unit"><option value="mm">Millimetres (mm)</option><option value="in">Inches (in)</option></select></div>
                            ${num('angle', 'Bend angle (°)', 90, 'min="1" max="179"')}
                        </div>
                        <div class="field-grid">
                            ${num('thickness', 'Thickness T (<span class="unit-label">mm</span>)', 2, 'min="0"')}
                            ${num('radius', 'Inside radius R (<span class="unit-label">mm</span>)', 2, 'min="0"')}
                        </div>
                        <div class="field">
                            <label for="c-k">K-factor</label>
                            <input id="c-k" name="k" type="number" inputmode="decimal" step="0.01" min="0" max="1" value="0.33">
                            <div class="k-presets"><span>Common:</span> <button type="button" data-k="0.33">0.33</button><button type="button" data-k="0.40">0.40</button><button type="button" data-k="0.44">0.44</button><button type="button" data-k="0.50">0.50</button></div>
                        </div>
                        <div class="field-grid">
                            ${num('flangeA', 'Flange A, outside (<span class="unit-label">mm</span>)', 50, 'min="0"')}
                            ${num('flangeB', 'Flange B, outside (<span class="unit-label">mm</span>)', 30, 'min="0"')}
                        </div>
                        <p class="form-error" id="bend-error" role="alert" hidden></p>
                    </form>
                    <div class="tool-result" aria-live="polite">
                        <svg id="bend-svg" class="bend-svg" viewBox="0 0 300 200" role="img" aria-label="Side view of the bent part"></svg>
                        <dl class="tool-out">
                            <div class="is-main"><dt>Flat length</dt><dd id="bend-flat">–</dd></div>
                            <div><dt>Bend allowance</dt><dd id="bend-ba">–</dd></div>
                            <div><dt>Bend deduction</dt><dd id="bend-bd">–</dd></div>
                            <div><dt>Outside setback</dt><dd id="bend-ossb">–</dd></div>
                        </dl>
                        <p class="tool-note" id="bend-flat-note" hidden>A flange is shorter than the outside setback, so the part may not be possible to bend as drawn.</p>
                    </div>
                </div>
            </div>
            <div class="container"><p class="tool-cta"><span>Quoting a job for a customer? Get the price, sheet nesting and a PDF quote.</span> <a class="btn btn-navy" href="../quote/index.html">Sheet-metal quote tool ${icon('arrow')}</a> <a class="btn btn-navy" href="../steel/index.html">Gate &amp; grill estimator ${icon('arrow')}</a></p>${cta('Need the full part modelled with flat patterns and drawings?', '../index.html#brief', 'Engineering Design')}</div>
        </section>

        <section class="section tool tool-alt" id="print">
            <div class="container tool-grid">
                <div class="tool-intro">
                    <p class="kicker">Print design</p>
                    <h2 class="tool-title">Print size &amp; DPI</h2>
                    <p>See how many pixels a design needs to print sharply, and check whether a photo or logo you already have is big enough.</p>
                    <details class="tool-help">
                        <summary>What DPI should I use?</summary>
                        <ul>
                            <li><strong>300 DPI</strong>: flyers, posters, certificates and anything seen up close.</li>
                            <li><strong>150 DPI</strong>: large banners and roll-ups viewed from a few metres.</li>
                            <li><strong>Bleed</strong>: an extra 3 mm around the edge so nothing white shows after trimming.</li>
                        </ul>
                    </details>
                </div>
                <div class="tool-card">
                    <form id="print-form" class="tool-form" novalidate>
                        <div class="field-grid">
                            <div class="field"><label for="p-size">Print size</label>
                                <select id="p-size" name="size">
                                    <option value="A4">A4 (210 × 297 mm)</option><option value="A5">A5 (148 × 210 mm)</option><option value="A3">A3 (297 × 420 mm)</option>
                                    <option value="A2">A2 (420 × 594 mm)</option><option value="A1">A1 (594 × 841 mm)</option><option value="A0">A0 (841 × 1189 mm)</option>
                                    <option value="A6">A6 (105 × 148 mm)</option><option value="flyer">DL flyer (99 × 210 mm)</option><option value="card">Business card (85 × 55 mm)</option>
                                    <option value="rollup">Roll-up banner (85 × 200 cm)</option><option value="custom">Custom size</option>
                                </select>
                            </div>
                            <div class="field"><label for="p-dpi">Resolution</label>
                                <select id="p-dpi" name="dpi"><option value="300">300 DPI (standard print)</option><option value="150">150 DPI (large banners)</option><option value="600">600 DPI (fine detail)</option><option value="72">72 DPI (screen preview)</option></select>
                            </div>
                        </div>
                        <div class="field-grid" id="custom-size" hidden>
                            <div class="field"><label for="p-cw">Width</label><input id="p-cw" name="cw" type="number" inputmode="decimal" step="any" min="0" value="600"></div>
                            <div class="field"><label for="p-ch">Height</label><input id="p-ch" name="ch" type="number" inputmode="decimal" step="any" min="0" value="900"></div>
                            <div class="field"><label for="p-cu">Unit</label><select id="p-cu" name="cunit"><option value="mm">mm</option><option value="cm">cm</option><option value="in">inches</option></select></div>
                        </div>
                        <div class="field-grid">
                            <div class="field"><label for="p-or">Orientation</label><select id="p-or" name="orient"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
                            <label class="consent tool-check"><input type="checkbox" name="bleed" checked> Add 3 mm bleed</label>
                        </div>
                        <fieldset class="img-check">
                            <legend>Check an image you have <small>(optional)</small></legend>
                            <div class="field-grid">
                                <div class="field"><label for="p-iw">Image width (px)</label><input id="p-iw" name="iw" type="number" inputmode="numeric" min="0" placeholder="e.g. 3000"></div>
                                <div class="field"><label for="p-ih">Image height (px)</label><input id="p-ih" name="ih" type="number" inputmode="numeric" min="0" placeholder="e.g. 4000"></div>
                            </div>
                            <label class="file-pick"><input type="file" name="photo" accept="image/*"> <span>${icon('image')} Or choose the image file</span></label>
                            <p class="tool-note">Your image stays on your device. Nothing is uploaded.</p>
                        </fieldset>
                    </form>
                    <div class="tool-result" aria-live="polite">
                        <dl class="tool-out">
                            <div class="is-main"><dt>Pixels needed</dt><dd id="print-px">–</dd></div>
                            <div><dt>Megapixels</dt><dd id="print-mp">–</dd></div>
                            <div><dt>Trim size</dt><dd id="print-mm">–</dd></div>
                            <div><dt>Size in inches</dt><dd id="print-in">–</dd></div>
                        </dl>
                        <div class="img-result" id="img-result" hidden>
                            <p><span>Your image prints at</span> <strong id="img-dpi">–</strong></p>
                            <p id="img-verdict"></p>
                            <p class="tool-note" id="img-crop" hidden>The image has a different shape from the print, so some cropping will be needed.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container">${cta('Want a print-ready design in the right size and colours?', '../index.html#brief', 'Graphic Design')}</div>
        </section>

        <section class="section tool" id="units">
            <div class="container tool-grid">
                <div class="tool-intro">
                    <p class="kicker">Engineering</p>
                    <h2 class="tool-title">Unit converter</h2>
                    <p>Convert between metric and imperial units for length, area, mass, force, pressure and stress, torque and temperature.</p>
                </div>
                <div class="tool-card">
                    <form id="units-form" class="tool-form" novalidate>
                        <div class="field-grid units-row">
                            <div class="field"><label for="u-cat">Quantity</label>
                                <select id="u-cat" name="cat"><option value="length">Length</option><option value="area">Area</option><option value="mass">Mass</option><option value="force">Force</option><option value="pressure">Pressure / stress</option><option value="torque">Torque</option><option value="temperature">Temperature</option></select>
                            </div>
                            <div class="field"><label for="u-val">Value</label><input id="u-val" name="value" type="number" inputmode="decimal" step="any" value="25.4"></div>
                            <div class="field"><label for="u-from">From</label><select id="u-from" name="from" data-no-i18n></select></div>
                        </div>
                    </form>
                    <div class="tool-result" aria-live="polite">
                        <ul class="units-out" id="units-out"></ul>
                    </div>
                </div>
            </div>
            <div class="container">${cta('Need calculations done properly, with a full simulation report?', '../index.html#brief', 'Engineering Design')}</div>
        </section>
${newsletter()}    </main>
` + footer('    <script defer src="../js/calculators.js?v=1"></script>\n');
}

/* ---------- Online CV ---------- */
function loadCV() {
    const ctx = { window: {} };
    vm.runInNewContext(read('content/cv.js'), ctx);
    vm.runInNewContext(read('js/certificates.js'), ctx);
    vm.runInNewContext(read('js/sheet-data.js'), ctx);   // Certificates tab of the Google Sheet
    return { cv: ctx.window.CV, certs: ctx.window.CERTIFICATES || [] };
}

function cvPage({ cv, certs }) {
    const url = SITE + 'cv/';
    const description = cv.name + ', ' + cv.title + '. ' + cv.summary.slice(0, 120).replace(/\s+\S*$/, '') + '…';
    const jsonld = {
        '@context': 'https://schema.org', '@type': 'ProfilePage', url,
        mainEntity: { '@type': 'Person', name: cv.name, jobTitle: cv.title, image: SITE + 'images/profile/edison.jpg', address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' }, sameAs: [cv.linkedin] }
    };
    const list = (a) => a.map((x) => `<li>${esc(x)}</li>`).join('');
    return head({ title: 'CV | ' + cv.name, description, url, image: SITE + 'og-image.jpg?v=2', type: 'profile', jsonld }) + '\n' + header('cv') + `
    <main id="main">
        <section class="page-hero theme-blue cv-hero">
            <div class="container cv-hero-inner">
                <img class="cv-photo" src="../images/profile/edison.jpg?v=2" alt="Portrait of ${esc(cv.name)}" width="160" height="160" onerror="this.remove()">
                <div>
                    <nav class="crumbs" aria-label="Breadcrumb">
                        <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">CV</span>
                    </nav>
                    <h1 class="page-title">${esc(cv.name)}</h1>
                    <p class="page-lede">${esc(cv.title)}</p>
                    <p class="cv-tagline">${esc(cv.tagline)}</p>
                    <div class="page-actions cv-actions">
                        <a class="btn btn-sun" href="../pdfs/edison-ochieng-cv.pdf" download>${icon('doc')} Download CV (PDF)</a>
                        <a class="btn btn-outline-light" href="../pdfs/edison-ochieng-portfolio.pdf" download data-if-exists hidden>${icon('image')} Portfolio (PDF)</a>
                        <button type="button" class="btn btn-outline-light" onclick="window.print()">Print</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="section cv-wrap">
            <div class="container">
                <p class="article-lang-note">This CV is available in English only.</p>
                <div class="cv-grid">
                    <div class="cv-main" data-no-i18n>
                        <section class="cv-block">
                            <h2>Profile</h2>
                            <p>${esc(cv.summary)}</p>
                        </section>
                        <section class="cv-block">
                            <h2>Experience</h2>
${cv.experience.map((x) => `                            <article class="cv-item">
                                <header><h3>${esc(x.role)}</h3><span class="cv-dates">${esc(x.dates)}</span></header>
                                <p class="cv-org">${esc(x.org)}</p>
                                ${x.points.length ? `<ul>${list(x.points)}</ul>` : ''}
                            </article>`).join('\n')}
                        </section>
                        <section class="cv-block">
                            <h2>Selected projects</h2>
${cv.projects.map((x) => `                            <article class="cv-item"><h3>${esc(x.name)}</h3><p>${esc(x.text)}</p></article>`).join('\n')}
                            <p class="cv-more"><a href="../index.html#work">See all projects ${icon('arrow')}</a></p>
                        </section>
                        <section class="cv-block">
                            <h2>Education</h2>
${cv.education.map((x) => `                            <article class="cv-item">
                                <header><h3>${esc(x.title)}</h3><span class="cv-dates">${esc(x.dates)}</span></header>
                                <p class="cv-org">${esc(x.org)}</p>
                                ${x.note ? `<p>${esc(x.note)}</p>` : ''}
                            </article>`).join('\n')}
                        </section>
                    </div>
                    <aside class="cv-side" data-no-i18n>
                        <section class="cv-card">
                            <h2>Contact</h2>
                            <ul class="cv-contact">
                                <li>${icon('pin')} <span>${esc(cv.location)}</span></li>
                                <li>${icon('whatsapp')} <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">${esc(cv.phone)}</a></li>
                                <li>${icon('mail')} <a href="../index.html#contact" class="js-email" data-user="edisonochieng24" data-domain="gmail.com">Email me</a></li>
                                <li>${icon('linkedin')} <a href="${esc(cv.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></li>
                                <li>${icon('globe')} <a href="${SITE}">edisonengineer.github.io/MY-PAST-PROJECTS</a></li>
                            </ul>
                        </section>
                        <section class="cv-card">
                            <h2>Skills</h2>
                            <ul class="cv-list">${list(cv.skills)}</ul>
                        </section>
                        <section class="cv-card">
                            <h2>Certifications</h2>
                            <ul class="cv-certs">${certs.map((c) => `<li><strong>${esc(c.title)}</strong><span>${esc(c.issuer || '')}${c.verify ? ` · <a href="${esc(c.verify)}" target="_blank" rel="noopener">View credential</a>` : ''}</span></li>`).join('')}</ul>
                        </section>
                        <section class="cv-card">
                            <h2>Languages</h2>
                            <ul class="cv-list">${list(cv.languages)}</ul>
                        </section>
                        <section class="cv-card">
                            <h2>Memberships</h2>
                            <ul class="cv-list">${list(cv.memberships)}</ul>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    </main>
` + footer();
}

/* ---------- CV tailor (for Edison): a CV for one job, from the master CV ----------
   The facts come from js/cv-master.js, written below from content/cv.js, the projects and
   the certificates (tools/cv-master.js). The page only picks and orders those lines. */
function cvTailorPage() {
    const url = SITE + 'cv-tailor/';
    const step = (n, title, body, id) => `<section class="cvt-card"${id ? ` id="${id}"` : ''}><h2 class="cvt-h"><span class="cvt-n">${n}</span> ${title}</h2>${body}</section>`;
    const description = 'Free CV tailor for members: upload your CV (PDF or Word), paste a job advert, and get a matching one-page CV, cover letter and application email built only from your real experience.';
    return head({ title: 'Free CV tailor: CV, cover letter & email for every job | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website',
        jsonld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'CV tailor', url, description, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'KES' } } })
        .replace('</head>', '    <link rel="stylesheet" href="../css/cv-tailor.css?v=4">\n</head>') + '\n' + header('').replace('<body class="subpage">', '<body class="subpage cvt-body">') + `
    <main id="main">
        <section class="page-hero theme-violet cvt-hero">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../cv/index.html">CV</a><span aria-hidden="true">/</span><span aria-current="page">CV tailor</span>
                </nav>
                <p class="page-kicker">Free with your account</p>
                <h1 class="page-title">Tailor your CV to every job.</h1>
                <p class="page-lede">Upload your CV once (PDF or Word). For each job advert you paste, see what it asks for and what you can prove, then print a matching CV and cover letter and send the application email.</p>
                <p class="cvt-truth">${icon('check')} <span>Built only from your own CV: the tool picks and orders your real experience for each job. It never adds a role, number, tool or certificate you don't have.</span></p>
            </div>
        </section>

        <section class="section cvt-wrap">
            <div class="container cvt-gate" id="cvt-gate">
                <noscript><p class="cvt-error">The CV tailor needs JavaScript. Turn it on in your browser and reload the page.</p></noscript>
                <p class="cvt-gate-msg" id="cvt-gate-msg" role="status" hidden></p>
                <div class="cvt-gate-card" id="cvt-gate-loading" hidden><p class="cvt-loading">Loading your CV…</p></div>
                <div class="cvt-gate-card" id="cvt-gate-login">
                    <h2>Log in to use the CV tailor</h2>
                    <p>It's free with a Nexus CAD Studio account. You log in with a code sent to your email (no password), and your CV is kept in your account, so you can use it on any phone or computer.</p>
                    <ul class="cvt-gate-list">
                        <li>${icon('check')} Upload your CV as a PDF or Word file, or paste it</li>
                        <li>${icon('check')} Paste any job advert: see which requirements you meet, honestly</li>
                        <li>${icon('check')} Print a one-page CV, a cover letter and an application email for that job</li>
                        <li>${icon('check')} Nothing is made up: everything comes from your own CV</li>
                    </ul>
                    <p class="cvt-actions"><a class="btn btn-sun btn-lg" href="../account/index.html?next=cv-tailor/index.html">Log in or create a free account ${icon('arrow')}</a></p>
                    <p class="cvt-help">By using the CV tailor you agree to its <a href="terms.html" target="_blank" rel="noopener">Terms and conditions</a> and <a href="privacy.html" target="_blank" rel="noopener">Privacy notice</a>.</p>
                </div>
                <div class="cvt-gate-card" id="cvt-gate-consent" hidden>
                    <h2>Before you start</h2>
                    <p>The CV tailor keeps <strong>your CV in your account</strong> so you can use it on any device. Job adverts, saved jobs and drafts stay on this device only. Files you upload are read in your browser and are never sent anywhere. Only you can see your CV, and you can download it or delete it at any time.</p>
                    <p>Please read the terms and the privacy notice (they open in a new tab):</p>
                    <p class="cvt-docs"><a class="btn btn-outline" href="terms.html" target="_blank" rel="noopener">Read the Terms and conditions</a> <a class="btn btn-outline" href="privacy.html" target="_blank" rel="noopener">Read the Privacy notice</a></p>
                    <label class="cvt-agree"><input type="checkbox" id="cvt-agree"> <span>I have read and I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms and conditions</a> and the <a href="privacy.html" target="_blank" rel="noopener">Privacy notice</a> of the CV tailor.</span></label>
                    <p class="cvt-actions"><button type="button" class="btn btn-navy" id="cvt-agree-go" disabled>Agree and continue</button></p>
                </div>
            </div>
            <div class="container cvt-app" id="cvt-app" hidden>
                <div class="cvt-ui">
                    <section class="cvt-card cvt-mycv" id="cvt-mycv">
                        <h2 class="cvt-h"><span class="cvt-n">0</span> My CV <small id="cvt-my-who"></small></h2>
                        <div class="field" id="cvt-source-wrap" hidden><label for="cvt-source">CV to use</label><select id="cvt-source"><option value="site">The website CV (content/cv.js, projects, certificates)</option><option value="account">The CV saved in my account</option></select></div>
                        <p class="cvt-my-stats" id="cvt-my-stats"></p>
                        <p class="cvt-my-status" id="cvt-my-status" role="status" aria-live="polite"></p>
                        <div class="cvt-actions" data-my-account>
                            <button type="button" class="btn btn-navy" data-act-my="upload">${icon('doc')} Upload CV (PDF or Word)</button>
                            <button type="button" class="btn btn-outline" data-act-my="paste">Paste CV text</button>
                            <button type="button" class="btn btn-outline" data-act-my="edit">Check / edit my CV</button>
                        </div>
                        <input type="file" id="cvt-file" accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
                        <input type="file" id="cvt-restore" accept=".json,application/json" hidden>
                        <div class="cvt-paste" id="cvt-paste-wrap" hidden data-my-account>
                            <div class="field"><label for="cvt-paste">Paste the text of your CV</label><textarea id="cvt-paste" rows="8" spellcheck="false" placeholder="Copy everything from your CV document and paste it here."></textarea></div>
                            <button type="button" class="btn btn-navy cvt-sm" data-act-my="read-paste">Read my CV</button>
                        </div>
                        <div class="cvt-import-notes" id="cvt-import-notes" hidden></div>
                        <div class="cvt-editor-wrap" id="cvt-editor-wrap" hidden data-my-account><div id="cvt-editor" data-no-i18n></div></div>
                        <p class="cvt-my-more" data-my-account>
                            <button type="button" class="cvt-link" data-act-my="backup">Download backup</button> ·
                            <button type="button" class="cvt-link" data-act-my="restore">Restore a backup</button> ·
                            <button type="button" class="cvt-link is-danger" data-act-my="delete">Delete my CV</button> ·
                            <a href="privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="terms.html" target="_blank" rel="noopener">Terms</a>
                        </p>
                        <p class="cvt-help">Your files are read in your browser and never uploaded. Only the CV you check is saved, in your account. On a shared computer, log out when you're done: that removes it from the device.</p>
                    </section>
                    ${step(1, 'The job', `
                    <div class="field-grid">
                        <div class="field"><label for="cvt-role">Job title <small>(optional)</small></label><input id="cvt-role" type="text" autocomplete="off" placeholder="e.g. Mechanical Design Engineer"></div>
                        <div class="field"><label for="cvt-company">Company <small>(optional)</small></label><input id="cvt-company" type="text" autocomplete="off" placeholder="e.g. Acme Fabrication Ltd"></div>
                    </div>
                    <div class="field-grid">
                        <div class="field"><label for="cvt-recipient">Hiring manager / recipient <small>(optional)</small></label><input id="cvt-recipient" type="text" autocomplete="off" placeholder="Hiring Team"></div>
                        <div class="field"><label for="cvt-focus">Focus area</label><select id="cvt-focus"></select></div>
                    </div>
                    <div class="field-grid">
                        <div class="field"><label for="cvt-length">CV length</label><select id="cvt-length"><option value="1">1 page</option><option value="2">2 pages</option></select></div>
                    </div>
                    <div class="field"><label for="cvt-jd">Job description</label><textarea id="cvt-jd" rows="12" spellcheck="false" placeholder="Paste the whole advert: responsibilities, requirements and nice-to-haves."></textarea></div>
                    <div class="cvt-actions">
                        <button type="button" class="btn btn-navy" data-act="analyse">Analyse the job</button>
                        <button type="button" class="btn btn-outline" data-act="save-job">Save job</button>
                        <button type="button" class="btn btn-outline" data-act="new">Clear / new job</button>
                    </div>
                    <div class="cvt-jobs">
                        <label for="cvt-jobs">Saved jobs</label>
                        <select id="cvt-jobs"></select>
                        <button type="button" class="btn btn-outline" data-act="load-job">Load</button>
                        <button type="button" class="btn btn-outline" data-act="delete-job">Delete</button>
                    </div>`)}
                    ${step(2, 'What the job asks for, and what you can prove', '<div id="cvt-match" aria-live="polite"></div>', 'cvt-match-card')}
                    ${step(3, 'Choose what goes in', `
                    <p class="cvt-help">Ticked lines are on the CV, in this order. The bar shows how well each line matches this job (hover for the words it matched). To change the wording of a line, edit it in My CV (step 0) so every CV stays true.</p>
                    <div class="cvt-opts">
                        <label><input type="checkbox" id="cvt-photo"> Photo</label>
                        <label><input type="checkbox" id="cvt-email" checked> Email address</label>
                        <button type="button" class="btn btn-outline" data-act="reset-choices">Reset to the job's ranking</button>
                    </div>
                    <div id="cvt-pick" data-no-i18n></div>`)}
                    ${step(4, 'Hand off to an AI assistant <small>(optional)</small>', `
                    <p class="cvt-warn">${icon('check')} <span>AI assistants can still make things up. The prompt below forbids it and asks for a source id after every bullet: check each line against this page before you send your CV. Then paste the result in step 5.</span></p>
                    <div class="field">
                        <div class="cvt-label-row"><label for="cvt-instructions">Your instructions: tone, length, emphasis</label>
                            <span><label class="sr-only" for="cvt-preset">Preset</label><select id="cvt-preset"></select> <button type="button" class="btn btn-outline cvt-sm" data-act="reset-prompt">Reset</button></span></div>
                        <textarea id="cvt-instructions" rows="5"></textarea>
                        <small>Saved in this browser. Also sets the cover letter and email tone: write "warm" or "friendly" for a warmer letter, "concise" or "short" for a shorter one (formal otherwise). The hard rules against invented facts are always added and can't be switched off.</small>
                    </div>
                    <div class="field"><label for="cvt-prompt">Full prompt to copy (rules + your instructions + job + your verified CV data + cover letter and email drafts)</label><textarea id="cvt-prompt" rows="10" readonly spellcheck="false"></textarea></div>
                    <div class="cvt-actions">
                        <button type="button" class="btn btn-navy" data-act="copy-prompt">Copy full AI prompt</button>
                        <button type="button" class="btn btn-outline" data-act="copy-md">Copy CV as Markdown</button>
                        <button type="button" class="btn btn-outline" data-act="copy-json">Copy JSON</button>
                        <button type="button" class="btn btn-outline" data-act="dl-md">Download .md</button>
                        <button type="button" class="btn btn-outline" data-act="dl-json">Download .json</button>
                    </div>`)}
                    ${step(5, 'Check text from an AI assistant', `
                    <div class="field"><label for="cvt-check-text">Paste what the AI wrote</label><textarea id="cvt-check-text" rows="6" spellcheck="false" placeholder="Paste the tailored summary or bullets here."></textarea></div>
                    <div class="cvt-actions"><button type="button" class="btn btn-navy" data-act="check">Check against my CV</button></div>
                    <div id="cvt-check-out" aria-live="polite"></div>`)}
                    <p class="cvt-status" id="cvt-status" role="status" aria-live="polite"></p>
                    <p class="track-privacy">${icon('check')} <span>Job adverts, saved jobs and drafts stay on this device. Only your CV is kept in your account. <a href="privacy.html">Privacy notice</a> · <a href="terms.html">Terms</a></span></p>
                </div>

                <div class="cvt-preview">
                    <div class="cvt-tabs" role="tablist" aria-label="Output">
                        <button type="button" role="tab" id="cvt-tab-cv" aria-controls="cvt-panel-cv" aria-selected="true">Tailored CV</button>
                        <button type="button" role="tab" id="cvt-tab-letter" aria-controls="cvt-panel-letter" aria-selected="false" tabindex="-1">Cover Letter</button>
                        <button type="button" role="tab" id="cvt-tab-email" aria-controls="cvt-panel-email" aria-selected="false" tabindex="-1">Application Email</button>
                    </div>
                    <div class="cvt-panel" id="cvt-panel-cv" role="tabpanel" aria-labelledby="cvt-tab-cv">
                        <div class="cvt-toolbar">
                            <p><strong>Tailored CV</strong> <span id="cvt-pages" class="cvt-pages"></span></p>
                            <span class="cvt-tools"><button type="button" class="btn btn-outline" data-act="fit">Fit to length</button>
                            <button type="button" class="btn btn-sun" data-act="print">${icon('doc')} Print / save as PDF</button></span>
                        </div>
                        <p class="cvt-help cvt-print-tip">In the print window choose "Save as PDF", paper A4, margins Default, and turn off headers and footers.</p>
                        <div class="cvt-stage" id="cvt-stage"><article class="cvt-paper" id="cvt-paper" data-no-i18n lang="en"></article></div>
                    </div>
                    <div class="cvt-panel" id="cvt-panel-letter" role="tabpanel" aria-labelledby="cvt-tab-letter" hidden>
                        <div class="cvt-toolbar">
                            <p><strong>Cover letter</strong> <span id="cvt-letter-pages" class="cvt-pages"></span></p>
                            <span class="cvt-tools"><button type="button" class="btn btn-outline" data-act="copy-letter">Copy Cover Letter</button>
                            <button type="button" class="btn btn-sun" data-act="print">${icon('doc')} Print / save as PDF</button></span>
                        </div>
                        <p class="cvt-help cvt-print-tip"><label class="cvt-inline"><input type="checkbox" id="cvt-sources"> Show where each fact comes from</label> Every fact is copied from your master CV; the wording around it claims nothing new. <span id="cvt-letter-tone"></span></p>
                        <div class="cvt-stage" id="cvt-letter-stage"><article class="cvt-paper cvt-letter" id="cvt-letter" data-no-i18n lang="en"></article></div>
                    </div>
                    <div class="cvt-panel cvt-email" id="cvt-panel-email" role="tabpanel" aria-labelledby="cvt-tab-email" hidden>
                        <div class="cvt-card">
                            <h3 class="cvt-sub-h">Subject line</h3>
                            <ul class="cvt-subjects" id="cvt-subjects" data-no-i18n></ul>
                            <div class="field cvt-to"><label for="cvt-to">Send to <small>(optional, filled in from the advert when it lists an email address)</small></label><input id="cvt-to" type="email" autocomplete="off" placeholder="e.g. careers@company.com"></div>
                            <h3 class="cvt-sub-h">Email body</h3>
                            <pre class="cvt-email-body" id="cvt-email-body" data-no-i18n lang="en"></pre>
                            <div class="cvt-actions">
                                <button type="button" class="btn btn-navy" data-act="copy-email">Copy Email</button>
                                <a class="btn btn-sun" id="cvt-mailto" href="mailto:">${icon('mail')} Open in my email app</a>
                            </div>
                            <p class="cvt-help cvt-mail-tip">Your email app can't attach files from a link: attach the CV and cover letter PDFs you saved from the other two tabs before you send.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/cv-tailor-core.js?v=3"></script>\n    <script defer src="../js/cv-import.js?v=1"></script>\n    <script defer src="../js/cv-tailor.js?v=3"></script>\n    <script defer src="../js/cv-mycv.js?v=1"></script>\n');
}

/* ---------- CV tailor: Terms and conditions, Privacy notice ----------
   Change the text here, then raise TERMS_VERSION in js/cv-mycv.js (and LEGAL_DATE below):
   everyone is asked to accept the new version the next time they open the CV tailor. */
const LEGAL_DATE = '22 November 2026';
function legalPage(file, title, description, kicker, body) {
    const url = SITE + 'cv-tailor/' + file;
    const contact = '<a href="../index.html#contact" class="js-email" data-user="edisonochieng24" data-domain="gmail.com">email</a> or <a href="https://wa.me/' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp ' + WHATSAPP.replace(/^254/, '+254 ').replace(/(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3') + '</a>';
    return head({ title: title + ' | CV tailor | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: title, url, dateModified: '2026-11-22' } }) + '\n' + header('') + `
    <main id="main">
        <section class="page-hero theme-violet">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">CV tailor</a><span aria-hidden="true">/</span><span aria-current="page">${esc(title)}</span>
                </nav>
                <p class="page-kicker">${esc(kicker)}</p>
                <h1 class="page-title">${esc(title)}</h1>
                <p class="page-byline"><span>Version of ${LEGAL_DATE}</span></p>
            </div>
        </section>
        <section class="section article-wrap">
            <div class="container narrow">
                <p class="article-lang-note">This page is available in English only, so that its meaning is exact.</p>
                <article class="article legal" data-no-i18n>
${body.replace(/\{contact\}/g, contact)}
                </article>
                <p class="cvt-legal-back"><a class="btn btn-navy" href="index.html">Back to the CV tailor ${icon('arrow')}</a></p>
            </div>
        </section>
    </main>
` + footer();
}

function cvTermsPage() {
    return legalPage('terms.html', 'Terms and conditions', 'The terms for using the free CV tailor of Nexus CAD Studio: your account, your CV, accuracy, AI assistants and availability.', 'CV tailor', `
<p>These terms apply when you use the CV tailor at <a href="index.html">edisonengineer.github.io/MY-PAST-PROJECTS/cv-tailor/</a>. It is run by Edison Ochieng, trading as Nexus CAD Studio, Nairobi, Kenya ("we", "us"). By ticking "I agree" and using the CV tailor, you accept these terms and our <a href="privacy.html">Privacy notice</a>. If you don't agree, please don't use it.</p>

<h2>1. The service</h2>
<p>The CV tailor helps you make a CV, cover letter and application email for a specific job, using only the information in the CV you give it. It is a free extra for anyone with a Nexus CAD Studio account. We may change it, add limits, or stop offering it at any time. When we can, we will tell you in advance, so keep a backup of your CV ("Download backup").</p>

<h2>2. Your account</h2>
<ul>
<li>You log in with a code sent to your email. Keep access to your email safe: anyone who can read it can log in to your account.</li>
<li>An account is for one person. Don't share it, and don't use someone else's.</li>
<li>On a shared or public computer, log out when you finish. Logging out removes the CV tailor's data from that device.</li>
</ul>

<h2>3. Your CV and content</h2>
<ul>
<li>Your CV stays yours. You allow us to store it and show it back to you only so that the CV tailor works for you (see the <a href="privacy.html">Privacy notice</a>).</li>
<li>Only upload or enter your own CV, or one you have permission to use.</li>
<li>Don't add anything unlawful, offensive or harmful, or anything that belongs to someone else without permission.</li>
<li>Leave out information employers don't need, such as your ID number, date of birth, religion, health or bank details.</li>
</ul>

<h2>4. Accuracy is your responsibility</h2>
<ul>
<li>The CV tailor only selects, orders and arranges what is in your CV. It does not check that your CV is true, and it can make mistakes when it reads files.</li>
<li><strong>Read every CV, cover letter and email before you send it</strong>, and correct anything that is wrong. Never claim a qualification, job, certificate or result you don't have.</li>
<li>The job match (what you have, what is missing) is an automatic guide, not career or legal advice. We can't promise that using the CV tailor will get you an interview or a job.</li>
</ul>

<h2>5. AI assistants</h2>
<p>The CV tailor itself does not send your information to any AI service. If you choose to copy its prompt into an AI assistant (for example ChatGPT, Claude or Gemini), that service's own terms and privacy policy apply, and it may get things wrong. Check its output against your CV; the "Check text" step helps, but it can't catch everything.</p>

<h2>6. Fair use</h2>
<p>Don't try to access other people's accounts or data, overload or attack the service, copy it in bulk with automated tools, or resell it. We may suspend or close accounts that break these terms or are used for fraud.</p>

<h2>7. Availability and liability</h2>
<p>The CV tailor is free and is provided "as is", without guarantees that it will always be available or error-free. As far as the law of Kenya allows, we are not responsible for any loss that comes from using it or from not being able to use it, including lost job opportunities or lost data. Nothing in these terms limits rights you have under the law that cannot be limited.</p>

<h2>8. Changes to these terms</h2>
<p>We may update these terms. The version date is at the top of this page. When the terms change in a way that matters, the CV tailor asks you to read and accept them again before you continue.</p>

<h2>9. Law</h2>
<p>These terms are governed by the laws of Kenya. If there is a problem, please contact us first so we can try to solve it together.</p>

<h2>10. Contact</h2>
<p>Questions about these terms: {contact}.</p>`);
}

function cvPrivacyPage() {
    return legalPage('privacy.html', 'Privacy notice', 'How the CV tailor and your Nexus CAD Studio account use your personal data: what is stored, where, for how long, and your rights under Kenya\'s Data Protection Act.', 'CV tailor', `
<p>This notice explains how we handle your personal data when you use your Nexus CAD Studio account and the CV tailor. We follow Kenya's Data Protection Act, 2019. The data controller is Edison Ochieng, trading as Nexus CAD Studio, Nairobi, Kenya. Contact: {contact}.</p>

<h2>What we keep, and why</h2>
<ul>
<li><strong>Your account:</strong> your email address, and your name and phone number if you add them, with the dates you created the account and last logged in. We use them to log you in and run your account.</li>
<li><strong>Your CV, in your account:</strong> the CV you upload, paste or type into the CV tailor (for example your contact details, experience, education, skills and certificates), the date it was last saved, and when you accepted the terms. We keep it so that you can use your CV on any device.</li>
</ul>

<h2>What stays on your device only</h2>
<ul>
<li><strong>Files you upload</strong> (PDF or Word) are read inside your browser. The file itself is never sent to us. Only the CV you check and save is stored in your account.</li>
<li><strong>Job descriptions, saved jobs, drafts, your prompt, cover letters and emails</strong> are made in your browser and kept in its storage on that device. We never receive them.</li>
<li>When you <strong>log out</strong>, the CV tailor removes everything it kept on that device.</li>
</ul>
<p>The website also counts page visits anonymously with GoatCounter, which doesn't use cookies.</p>

<h2>Why we are allowed to use it</h2>
<p>We use your data because you asked for the service and agreed to these terms (your consent), and because we need it to provide the account and the CV tailor to you. You can withdraw your consent at any time by deleting your CV (and, if you wish, your account).</p>

<h2>Where it is stored, and who can see it</h2>
<ul>
<li>Your account and saved CV are stored in a Google Sheet in our Google account. Google provides the storage as our service provider, and its servers may be outside Kenya; Google protects the data with its own security and contractual safeguards. A copy of the sheet is saved weekly as a backup in our Google Drive and kept for up to 8 weeks.</li>
<li>On the website, only you can see your CV, after logging in. Nobody else can list or search CVs.</li>
<li>As the administrator, Edison can technically open the sheet. We only look at a saved CV when you ask for help, to fix a problem, to stop abuse, or when the law requires it.</li>
<li>We <strong>don't sell</strong> your data, don't share your CV with employers or anyone else, and don't use it for advertising. You only get our newsletter if you subscribe to it separately.</li>
</ul>

<h2>How long we keep it</h2>
<ul>
<li>Your CV stays in your account until you delete it. <strong>"Delete my CV"</strong> removes it from your account and the device straight away; backup copies are gone within 8 weeks.</li>
<li>To delete your whole account, contact us and we will do it within 30 days.</li>
<li>We may delete CVs of accounts that haven't been used for 2 years.</li>
</ul>

<h2>Your rights</h2>
<p>Under the Data Protection Act you can ask to be informed about how your data is used, to see it, to correct it, to delete it, to object to its use, and to get a copy you can take elsewhere. You can do most of this yourself in the CV tailor ("Check / edit my CV", "Download backup", "Delete my CV"); for anything else, contact us. If you are not happy with how we handled your data, you can complain to the Office of the Data Protection Commissioner (<a href="https://www.odpc.go.ke/" target="_blank" rel="noopener">odpc.go.ke</a>).</p>

<h2>Keeping it safe</h2>
<p>You log in with a one-time code sent to your email, sessions end after 30 days, data travels over encrypted connections (HTTPS), and only your login can read your CV from the website. No system is completely secure, so please leave out information employers don't need (such as your ID number, date of birth or bank details), and log out on shared computers.</p>

<h2>AI assistants</h2>
<p>The CV tailor does not send your data to any AI service. If you copy its prompt into an AI assistant yourself, that service's privacy policy applies to what you paste there.</p>

<h2>Children</h2>
<p>If you are under 18, please use the CV tailor with the permission of a parent or guardian.</p>

<h2>Changes</h2>
<p>If this notice changes in a way that matters, the version date above changes and the CV tailor asks you to accept it again.</p>`);
}

/* ---------- Review-request link maker (for Edison) ---------- */
function reviewLinkPage() {
    const url = SITE + 'request-review/';
    const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
    return head({ title: 'Request a review | Nexus CAD Studio', description: 'Create a link that asks a client for a review.', url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Request a review', url } })
        .replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, nofollow">') + '\n' + header('') + `
    <main id="main">
        <section class="page-hero theme-sun">
            <div class="container page-hero-inner narrow">
                <p class="page-kicker">For Edison</p>
                <h1 class="page-title">Ask a client for a review.</h1>
                <p class="page-lede">Fill in the client's details and send them the link. It opens the review form on your website with their name and project already filled in.</p>
            </div>
        </section>
        <section class="section track-wrap">
            <div class="container narrow">
                <form class="track-form rr-form" id="rr-form" novalidate>
                    <div class="field-grid">
                        <div class="field"><label for="rr-client">Client name</label><input id="rr-client" name="client" type="text" placeholder="e.g. Jane Wanjiku"></div>
                        <div class="field"><label for="rr-phone">Client WhatsApp <small>(optional)</small></label><input id="rr-phone" name="phone" type="tel" placeholder="e.g. 0712 345 678"></div>
                    </div>
                    <div class="field-grid">
                        <div class="field"><label for="rr-project">Project</label><input id="rr-project" name="project" type="text" placeholder="e.g. Bracket assembly & drawings"></div>
                        <div class="field"><label for="rr-service">Service</label><select id="rr-service" name="service">${opt('Engineering Design')}${opt('Graphic Design')}${opt('CAD Training / Webinar')}${opt('Other')}</select></div>
                    </div>
                    <div class="field"><label for="rr-link">Review link</label>
                        <div class="track-row"><input id="rr-link" type="text" readonly><button type="button" class="btn btn-navy" id="rr-copy">Copy link</button></div>
                    </div>
                    <p class="rr-preview-label">Message preview</p>
                    <p class="rr-preview" id="rr-preview"></p>
                    <div class="pm-actions">
                        <a class="btn btn-green" id="rr-wa" href="#" target="_blank" rel="noopener">${icon('whatsapp')} Send on WhatsApp</a>
                        <a class="btn btn-outline" id="rr-mail" href="#">${icon('mail')} Send by email</a>
                        <a class="btn btn-outline" id="rr-open" href="#" target="_blank" rel="noopener">Test the link</a>
                    </div>
                </form>
                <p class="track-privacy">${icon('check')} <span>This page isn't linked anywhere on the site or shown in search engines. Bookmark it.</span></p>
            </div>
        </section>
    </main>
` + footer('    <script defer src="../js/review-link.js?v=1"></script>\n');
}

/* ---------- Client project tracker ---------- */
/* ---------- Shareable offer page: the current campaign from the Campaigns tab (content/campaign.json) ----------
   offer/ always exists, so a link shared earlier never breaks: between campaigns it points
   visitors to the services instead. Its link preview (WhatsApp, LinkedIn) shows the campaign. */
function loadCampaign() {
    try { return JSON.parse(read('content/campaign.json')); } catch (e) { return null; }
}
function offerPage(c) {
    const url = SITE + 'offer/';
    const local = (f) => /^[\w][\w./-]*$/.test(f || '') && fs.existsSync(path.join(ROOT, f));
    const image = c && c.image ? (local(c.image) ? SITE + c.image : /^https:\/\//.test(c.image) ? c.image : '') : '';
    const href = (l) => {
        if (!l || l === '#') return '../index.html#brief';
        if (l === 'whatsapp') return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hi Edison, I saw "' + c.title + '" on your website and would like to know more.');
        if (/^https:\/\//i.test(l)) return l;
        if (/^#open:/.test(l)) return '../index.html';
        if (l[0] === '#') return '../index.html' + l;
        return '../' + l;
    };
    const ends = c && c.end ? 'Offer ends ' + fmtDate(c.end) : '';
    const title = c ? (c.badge && c.title ? c.badge + ': ' + c.title : c.title || c.badge) + ' | Nexus CAD Studio' : 'Offers | Nexus CAD Studio';
    const firstLine = c ? String(c.text || '').split(/\n+/)[0] : '';
    const description = c ? (firstLine.length > 160 ? firstLine.slice(0, 157).replace(/\s+\S*$/, '') + '…' : firstLine || 'A limited-time offer from Nexus CAD Studio, Nairobi.')
        : 'Current offers on CAD design, simulation and CAD training from Nexus CAD Studio, Nairobi.';
    const jsonld = c ? {
        '@context': 'https://schema.org', '@type': 'Offer', name: c.title || c.badge, description, url,
        ...(image ? { image } : {}), ...(c.start ? { validFrom: c.start } : {}), ...(c.end ? { validThrough: c.end } : {}),
        seller: { '@type': 'Organization', name: 'Nexus CAD Studio', url: SITE }
    } : { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Offers', url, description };
    let html = head({ title, description, url, image: image || SITE + 'og-image.jpg?v=2', type: 'website', jsonld });
    if (!c) html = html.replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">');
    const L = c && href(c.link);
    const ext = L && /^https:/.test(L) ? ' target="_blank" rel="noopener"' : '';
    return html + '\n' + header('offer') + `
    <main id="main">
        <section class="page-hero theme-coral">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Offers</span>
                </nav>
                ${c ? `${c.badge ? `<p class="page-kicker">${esc(c.badge)}</p>` : ''}
                <h1 class="page-title">${esc(c.title || c.badge)}</h1>
                ${ends ? `<p class="page-lede">${esc(ends)}</p>` : ''}` : `<p class="page-kicker">Offers</p>
                <h1 class="page-title">No special offer right now.</h1>
                <p class="page-lede">Seasonal offers on CAD projects and training appear here. In the meantime, see what I can do for you.</p>`}
            </div>
        </section>

        <section class="section offer-wrap">
            <div class="container narrow offer-grid${c && image ? '' : ' no-image'}">
                ${c && image ? `<img class="offer-poster" src="${esc(local(c.image) ? '../' + c.image : c.image)}" alt="${esc(c.title || c.badge)}" decoding="async">` : ''}
                <div class="offer-copy">
                    ${c ? String(c.text || '').split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('\n                    ') : ''}
                    <div class="offer-actions">
                        ${c && c.button ? `<a class="btn btn-sun btn-lg" href="${esc(L)}"${ext} data-track="offer-click">${esc(c.button)} ${icon('arrow')}</a>` : ''}
                        <a class="btn ${c && c.button ? 'btn-ghost' : 'btn-sun btn-lg'}" href="../index.html#services">See all services</a>
                        <a class="btn btn-ghost" href="../training/index.html">CAD training</a>
                    </div>
                </div>
            </div>
        </section>
    </main>
` + footer();
}

/* ---------- WhatsApp status image maker (share/): for you, not linked from the site ----------
   Makes a 1080 x 1920 image for the current campaign or any course's next class (js/share-image.js). */
function sharePage(T, campaign) {
    const url = SITE + 'share/';
    const local = (f) => f && /^[\w][\w./-]*$/.test(f) && fs.existsSync(path.join(ROOT, f));
    const data = {
        site: SITE.replace(/^https:\/\//, '').replace(/\/$/, ''),
        whatsapp: '+' + WHATSAPP.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4'),
        api: CFG.trackerApi || CFG.reviewsApi || '',
        campaign: campaign ? { badge: campaign.badge, title: campaign.title, text: campaign.text, button: campaign.button, end: campaign.end, image: local(campaign.image) ? campaign.image : '' } : null,
        tools: (() => {
            const qp = Object.assign({ monthly: 500, yearly: 4500 }, CFG.quotePro || {});
            const kes = (n) => 'KES ' + Number(n).toLocaleString('en-US');
            const site = SITE.replace(/^https:\/\//, '');
            return [
                { id: 'tool-steel', label: 'Gate & grill estimator (English)', art: 'gate', badge: 'Free tool for welders', title: 'Price a gate in one minute.', lines: ['Cut list and 6 m lengths to buy', 'Steel, paint, labour & fittings priced', 'Send the quote on WhatsApp or as a PDF'], cta: 'Try it free on your phone', url: site + 'steel' },
                { id: 'tool-steel-sw', label: 'Gate & grill estimator (Kiswahili)', art: 'gate', badge: 'Bure kwa mafundi', title: 'Piga bei ya geti kwa dakika moja.', lines: ['Orodha ya vipande na urefu wa mita 6 wa kununua', 'Bei ya chuma, rangi, ufundi na vifaa', 'Tuma bei kwa mteja kwa WhatsApp au PDF'], cta: 'Jaribu bure kwa simu yako', url: site + 'steel' },
                { id: 'tool-quote', label: 'Sheet-metal quote tool', art: 'sheet', badge: 'Free tool for fabricators', title: 'Quote sheet-metal jobs in a minute.', lines: ['Flat blank, weight & parts per sheet', 'Laser cutting, bending & powder coating priced', 'A PDF or WhatsApp quote for your customer'], cta: 'Try it free on your phone', url: site + 'quote' },
                { id: 'tool-pro', label: 'Quote Pro (paid plan)', art: 'quote', badge: 'Quote Pro', title: 'Your logo on every quote.', lines: ['Unlimited PDF quotes, saved quotes & workshop cut sheets', 'One licence: gates, grills, railings & sheet metal', kes(qp.monthly) + ' a month by M-Pesa'], cta: 'Go Pro today', url: site + 'steel' }
            ];
        })(),
        courses: T.courses.map((c) => {
            const p = courseProjects(c).find((x) => local(x.cover));
            return { id: c.id, name: c.name, tagline: c.tagline, length: c.syllabusSummary || c.sessions || '', image: p ? p.cover : '' };
        })
    };
    const html = head({ title: 'Make a WhatsApp status image | Nexus CAD Studio', description: 'Status images for campaigns and new classes.', url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Status image maker', url } })
        .replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, nofollow">');
    return html + '\n' + header('share') + `
    <main id="main">
        <section class="section share-maker">
            <div class="container share-grid">
                <div class="share-controls">
                    <p class="kicker">For you</p>
                    <h1 class="section-title">WhatsApp status <em>image</em>.</h1>
                    <p>Pick what to promote. The image uses your current campaign from the Campaigns tab, a course with its next class, start date and seats from the Courses tab, or one of the quote tools for welders and fabricators.</p>
                    <label for="share-pick">Promote</label>
                    <select id="share-pick">
                        ${data.campaign ? `<option value="campaign">Current campaign: ${esc(data.campaign.title || data.campaign.badge)}</option>` : ''}
                        <optgroup label="Quote tools">
                        ${data.tools.map((t) => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join('\n                        ')}
                        </optgroup>
                        <optgroup label="Training">
                        ${data.courses.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} training</option>`).join('\n                        ')}
                        </optgroup>
                    </select>
                    <div class="share-actions">
                        <button type="button" class="btn btn-sun" id="share-download">${icon('doc')} Download image</button>
                        <button type="button" class="btn btn-outline" id="share-native" hidden>${icon('whatsapp')} Share</button>
                    </div>
                    <p class="share-status" id="share-status" aria-live="polite"></p>
                    <p class="share-tip">On your phone, tap <strong>Share</strong> and choose WhatsApp → My status. Bookmark this page: it always shows your latest campaign and class dates.</p>
                </div>
                <div class="share-preview"><canvas id="share-canvas" width="1080" height="1920" aria-label="Status image preview"></canvas></div>
            </div>
        </section>
    </main>
    <script>window.SHARE_DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};</script>
` + footer('    <script defer src="../js/share-image.js?v=3"></script>\n');
}

function trackPage() {
    const url = SITE + 'track/';
    const description = 'Check the status of your Nexus CAD Studio project with the reference Edison sent you.';
    return head({ title: 'Track your project | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Track your project', url, description } }).replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">') + '\n' + header('track') + `
    <main id="main">
        <section class="page-hero theme-violet">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Track your project</span>
                </nav>
                <p class="page-kicker">Clients</p>
                <h1 class="page-title">Track your project.</h1>
                <p class="page-lede">Enter the project reference I sent you to see where your project is, what's next and anything that's due.</p>
            </div>
        </section>

        <section class="section track-wrap">
            <div class="container narrow">
                <form class="track-form" id="track-form" novalidate>
                    <label for="track-ref">Project reference</label>
                    <div class="track-row">
                        <input id="track-ref" name="ref" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. NCS-2026-014" required>
                        <button type="submit" class="btn btn-sun">${icon('arrow')} Track project</button>
                    </div>
                    <p class="form-error" role="alert" hidden></p>
                    <p class="track-hint"><span>No reference yet? Try the demo:</span> <button type="button" class="link-btn" data-demo="DEMO-2026" data-no-i18n>DEMO-2026</button></p>
                </form>
                <div class="track-result" id="track-result" tabindex="-1" aria-live="polite" hidden></div>
                <p class="track-privacy">${icon('check')} <span>Your project details are locked with your reference and are only shown to people who know it.</span></p>
            </div>
        </section>
    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/currency.js?v=1"></script>\n    <script defer src="../js/tracker-data.js"></script>\n    <script defer src="../js/tracker.js?v=10"></script>\n');
}

/* ---------- Choose your path: homepage section and /start/ ----------
   Three routes through the site: hire me, learn CAD, practise for a SolidWorks exam.
   Links are relative to the site root; prefix is '' on the homepage and '../' on sub-pages. */
const PATHS = [
    { id: 'hire', letter: 'A', theme: 'blue', icon: 'gear', kicker: 'For clients', title: 'Hire me for CAD & FEA',
        text: '3D models, manufacturing drawings and FEA simulation for your product, machine or fabrication job.',
        cta: ['index.html#brief', 'Send a project brief'],
        links: [['index.html#services', 'Services'], ['index.html#estimator', 'Instant cost estimate'], ['index.html#pricing', 'Packages & prices'], ['index.html#work', 'Past projects']] },
    { id: 'train', letter: 'B', theme: 'teal', icon: 'cap', kicker: 'For learners', title: 'Join CAD training',
        text: 'SolidWorks, AutoCAD, Inventor, Fusion 360 and more: one-on-one, in small groups or for teams, online or in Nairobi.',
        cta: ['training/index.html#reserve', 'Reserve a seat'],
        links: [['training/index.html#compare', 'Compare the courses'], ['training/index.html#courses', 'Next classes & seats'], ['training/solidworks.html#syllabus', 'Full syllabus (free PDF)'], ['training/index.html#downloads', 'Free cheat sheets']] },
    { id: 'exam', letter: 'C', theme: 'violet', icon: 'award', kicker: 'For certification', title: 'Pass your SolidWorks exam',
        text: 'Timed CSWA and CSWP-style practice: parts to model, centre of mass, and an exam generator that never runs out.',
        cta: ['exams/index.html', 'Try a free practice test'],
        links: [['exams/index.html#ex-demo-card', 'Free CSWP-style demo'], ['exams/index.html#ex-gen-card', 'Exam generator'], ['exams/index.html#cswp-sheet', 'Free CSWP cheat sheet'], ['training/solidworks.html', 'SolidWorks course']] }
];
function pathCards(prefix, h = 'h3') {
    return PATHS.map((p) => `<article class="path-card theme-${p.theme}" id="path-${p.id}">
                        <div class="path-top"><span class="path-icon">${icon(p.icon)}</span><span class="path-letter" aria-hidden="true">${p.letter}</span></div>
                        <p class="path-kicker">${esc(p.kicker)}</p>
                        <${h} class="path-title">${esc(p.title)}</${h}>
                        <p class="path-text">${esc(p.text)}</p>
                        <ul class="path-links">
${p.links.map((l) => `                            <li><a href="${prefix}${l[0]}">${esc(l[1])} ${icon('arrow')}</a></li>`).join('\n')}
                        </ul>
                        <a class="btn btn-sun btn-block" href="${prefix}${p.cta[0]}" data-track="path-${p.id}">${esc(p.cta[1])} ${icon('arrow')}</a>
                    </article>`).join('\n                    ');
}
function pathsSection() {
    return `<section class="section paths" id="paths" aria-labelledby="paths-title">
            <div class="container">
                <header class="section-head center">
                    <p class="kicker">Choose your path</p>
                    <h2 class="section-title" id="paths-title">Where would you like to <em>start</em>?</h2>
                    <p class="section-lede">Pick what you need and go straight there.</p>
                </header>
                <div class="path-grid">
                    ${pathCards('')}
                </div>
            </div>
        </section>`;
}
function startPage() {
    const url = SITE + 'start/';
    const description = 'Hire Edison Ochieng for CAD and FEA, join CAD training in Nairobi or online, or practise for your SolidWorks certification. Pick your path and go straight there.';
    return head({ title: 'Start here: choose your path | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website',
        jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Start here', url, description,
            hasPart: PATHS.map((p) => ({ '@type': 'WebPage', name: p.title, url: SITE + p.cta[0].replace('index.html', '') })) } }) + '\n' + header('start') + `
    <main id="main">
        <section class="page-hero theme-blue">
            <div class="container page-hero-inner">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Start here</span>
                </nav>
                <p class="page-kicker">Start here</p>
                <h1 class="page-title">What brings you here today?</h1>
                <p class="page-lede">Pick the path that fits. Each one takes you straight to what you need.</p>
            </div>
        </section>

        <section class="section paths paths-page">
            <div class="container">
                <div class="path-grid">
                    ${pathCards('../', 'h2')}
                </div>
                <div class="path-help">
                    <p><strong>Still not sure?</strong> <span>Tell me what you need and I'll point you the right way.</span></p>
                    <a class="btn btn-green" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Edison, I found your website and would like some advice on where to start.')}" target="_blank" rel="noopener">${icon('whatsapp')} Ask on WhatsApp</a>
                </div>
            </div>
        </section>
    </main>
` + footer();
}

/* ---------- Make a payment (any amount, against a project or training reference: js/pay.js) ---------- */
function payPage() {
    const url = SITE + 'pay/';
    const description = 'Pay a deposit, an instalment or your full balance by M-Pesa, against your project or training reference. Your receipt is emailed to you.';
    return head({ title: 'Make a payment | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Make a payment', url, description } })
        .replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">') + '\n' + header('pay') + `
    <main id="main">
        <section class="page-hero theme-green">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Make a payment</span>
                </nav>
                <p class="page-kicker">Secure payment</p>
                <h1 class="page-title">Make a payment.</h1>
                <p class="page-lede">Pay a deposit, an instalment or your full balance, whenever suits you. Choose a suggested amount or type your own.</p>
            </div>
        </section>
        <section class="section pay-wrap">
            <div class="container narrow">
                <div id="pay-app" aria-live="polite"><noscript><p>Please turn on JavaScript to pay online, or pay M-Pesa Buy Goods Till <strong>${esc((CFG.payments || {}).mpesaTill || '')}</strong> and send me the code on WhatsApp.</p></noscript></div>
                <p class="acct-privacy">${icon('check')} <span>Every payment is recorded against your reference, and your receipt is emailed to you. Card or bank transfer? <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp me</a>.</span></p>
            </div>
        </section>
    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/pay.js?v=3"></script>\n');
}

/* ---------- My account (log in with an email code: js/account.js) ---------- */
function accountPage() {
    const url = SITE + 'account/';
    const description = 'Log in or create an account with a code sent to your email: your exam pass, Quote Pro, practice results, training, projects and invoices in one place.';
    return head({ title: 'My account | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'My account', url, description } })
        .replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">') + '\n' + header('account') + `
    <main id="main">
        <section class="page-hero theme-teal">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">My account</span>
                </nav>
                <p class="page-kicker">My account</p>
                <h1 class="page-title">Everything in one place.</h1>
                <p class="page-lede">Your exam pass, Quote Pro, practice results, training, projects and invoices, on any phone or computer. No password: you log in with a code sent to your email.</p>
            </div>
        </section>

        <section class="section acct-wrap">
            <div class="container">
                <div id="account-app" aria-live="polite">
                    <noscript><p>Please turn on JavaScript to log in.</p></noscript>
                </div>
                <p class="acct-privacy"><a class="btn btn-outline" href="../cv-tailor/index.html">Free CV tailor: a matching CV, cover letter and email for every job ${icon('arrow')}</a></p>
                <p class="acct-privacy">${icon('check')} <span>We only use your email to log you in and show your own records. Questions? <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp me</a>.</span></p>
            </div>
        </section>
    </main>
` + footer();
}

/* ---------- Certificate verification ---------- */
function verifyPage() {
    const url = SITE + 'verify/';
    const description = 'Check that a Nexus CAD Studio training certificate is genuine: enter the certificate code printed on it.';
    return head({ title: 'Verify a certificate | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg?v=2', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Verify a certificate', url, description } }) + '\n' + header('training') + `
    <main id="main">
        <section class="page-hero theme-green">
            <div class="container page-hero-inner narrow">
                <nav class="crumbs" aria-label="Breadcrumb">
                    <a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../training/index.html">CAD training</a><span aria-hidden="true">/</span><span aria-current="page">Verify a certificate</span>
                </nav>
                <p class="page-kicker">Certificates</p>
                <h1 class="page-title">Verify a certificate.</h1>
                <p class="page-lede">Every Nexus CAD Studio training certificate carries a unique code. Enter it below to confirm the certificate is genuine.</p>
            </div>
        </section>

        <section class="section track-wrap">
            <div class="container narrow">
                <form class="track-form" id="verify-form" novalidate>
                    <label for="verify-code">Certificate code</label>
                    <div class="track-row">
                        <input id="verify-code" name="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. NCS-7KQ4-X9TB" required>
                        <button type="submit" class="btn btn-sun">${icon('check')} Verify</button>
                    </div>
                    <p class="form-error" role="alert" hidden></p>
                </form>
                <div class="track-result" id="verify-result" tabindex="-1" aria-live="polite" hidden></div>
                <p class="track-privacy">${icon('check')} <span>Only the trainee's name, course and completion date are shown, and only for a valid code.</span></p>
            </div>
        </section>
    </main>
` + footer('    <script defer src="../js/config.js?v=14"></script>\n    <script defer src="../js/verify.js?v=1"></script>\n');
}

/* ---------- Homepage cards ---------- */
function homeCards(posts) {
    return posts.slice(0, 3).map((x) => postCard(x, 'blog/')).join('\n                    ');
}

/* ---------- Sitemap ---------- */
function sitemap(projects, posts) {
    const today = new Date().toISOString().slice(0, 10);
    const u = (loc, pr, freq, mod) => `    <url>\n        <loc>${SITE}${loc}</loc>\n        <lastmod>${mod || today}</lastmod>\n        <changefreq>${freq}</changefreq>\n        <priority>${pr}</priority>\n    </url>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
        u('', '1.0', 'monthly'),
        u('start/', '0.8', 'monthly'),
        u('blog/', '0.8', 'weekly'),
        u('training/', '0.8', 'monthly'),
        ...loadTraining().courses.map((c) => u('training/' + c.id + '.html', '0.7', 'monthly')),
        u('cv/', '0.8', 'monthly'),
        u('calculators/', '0.9', 'monthly'),
        u('quote/', '0.8', 'monthly'),
        u('cv-tailor/', '0.7', 'monthly'),
        u('cv-tailor/terms.html', '0.2', 'yearly'),
        u('cv-tailor/privacy.html', '0.2', 'yearly'),
        u('steel/', '0.8', 'monthly'),
        u('exams/', '0.8', 'monthly'),
        u('verify/', '0.4', 'yearly'),
        ...(loadCampaign() ? [u('offer/', '0.6', 'weekly')] : []),
        ...posts.map((p) => u('blog/' + p.slug + '.html', '0.7', 'yearly', p.updated || p.date)),
        ...projects.map((p) => u('projects/' + p.id + '.html', '0.7', 'yearly'))
    ].join('\n')}
</urlset>
`;
}

/* ---------- Site search index (js/search-index.js) ---------- */
const SECTIONS = [
    ['Services', 'Engineering design, CAD modelling, simulation, technical drawings, graphic design and CAD training.', '#services', 'services cad engineering graphic design training'],
    ['How I work', 'From brief to delivery: the steps of a project.', '#process', 'process steps brief delivery revisions'],
    ['Work', 'Engineering and graphic design projects.', '#work', 'portfolio projects case studies'],
    ['Free weekly webinar', 'Learn AutoCAD and CAD skills live, plus past session recordings.', '#webinar', 'webinar training youtube recordings autocad class'],
    ['Experience', 'Nexus CAD Studio, KIRDI, WIESS, KnowledgePoint and UNSA. Education at the University of Nairobi.', '#experience', 'cv resume career education university nairobi kirdi internship attachment languages'],
    ['Certifications & honours', 'CSWA, Autodesk Inventor, Designathon and more.', '#certifications', 'certificates cswa solidworks inventor autodesk designathon linkedin learning'],
    ['Services & pricing', 'Packages and starting prices in KES.', '#pricing', 'prices cost packages rates kes rate card pdf'],
    ['Cost estimator', 'Get an instant starting price for your project.', '#estimator', 'estimate calculator price quote cost'],
    ['Reviews', 'What clients say, and leave your own review.', '#reviews', 'testimonials feedback rating stars'],
    ['Free AutoCAD cheat sheet', 'Download the AutoCAD shortcuts cheat sheet.', '#freebie', 'download free autocad shortcuts cheat sheet pdf'],
    ['Reports', 'Technical reports and documents to read online.', '#reports', 'pdf reports documents read cv'],
    ['Start a project', 'Send a project brief in about two minutes.', '#brief', 'brief form quote hire order request'],
    ['FAQ', 'Answers to common questions.', '#faq', 'questions help answers'],
    ['Instagram', 'Latest posts from Instagram.', '#instagram', 'social media posts photos'],
    ['Contact', 'WhatsApp, email, LinkedIn and Instagram.', '#contact', 'whatsapp email phone call message linkedin instagram facebook'],
    ['Make a payment', 'Pay a deposit by M-Pesa.', '#pay', 'mpesa m-pesa till pay deposit lipa payment']
];

function searchIndex(projects, posts) {
    const ctxP = { window: {} };
    vm.runInNewContext(read('js/packages.js'), ctxP);
    vm.runInNewContext(read('js/sheet-data.js'), ctxP);   // Pricing tab of the Google Sheet
    const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const faqs = [...index.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="faq-body">([\s\S]*?)<\/div>/g)]
        .map((m) => ({ k: 'faq', t: strip(m[1]), d: '', u: 'index.html#faq', x: strip(m[2]) }));
    const items = [
        ...SECTIONS.map(([t, d, h, x]) => ({ k: 'page', t, d, u: 'index.html' + h, x })),
        ...projects.map((p) => ({ k: 'project', t: p.title, d: p.subtitle || '', u: 'projects/' + p.id + '.html', x: [p.summary, (p.tags || []).join(' '), (p.points || []).join(' '), (p.meta || []).map((m) => m[1]).join(' '), p.category].join(' ') })),
        { k: 'page', t: 'CAD training courses', d: 'AutoCAD, SolidWorks, Inventor and Fusion 360 training. Reserve a seat.', u: 'training/index.html', x: 'training course class lessons learn autocad solidworks inventor fusion cswa tutor teacher student' },
        { k: 'page', t: 'Make a payment', d: 'Pay a deposit, an instalment or your balance by M-Pesa, against your project or training reference.', u: 'pay/index.html', x: 'pay payment mpesa m-pesa deposit balance instalment installment till lipa receipt invoice amount' },
        { k: 'page', t: 'My account', d: 'Log in with a code sent to your email: exam pass, Quote Pro, results, training, projects and invoices.', u: 'account/index.html', x: 'account login log in sign in sign up register create account profile my exam pass key licence quote pro results invoices receipts' },
        { k: 'page', t: 'Start here: choose your path', d: 'Hire me for CAD and FEA, join CAD training, or practise for your SolidWorks certification.', u: 'start/index.html', x: 'start here begin help guide path choose hire training course learn exam certification cswa cswp where' },
        { k: 'page', t: 'SolidWorks exam practice (CSWA & CSWP-style)', d: 'Timed SolidWorks practice tests: parts to model in 3 stages, centre of mass, theory with new numbers every time, instant marking. Endless exam generator. Free sample test and demo.', u: 'exams/index.html', x: 'solidworks cswa cswp exam practice test certification mock quiz questions mass centre of mass model drawing student certificate generator configurations design tables equations mates sheet metal k-factor' },
        { k: 'page', t: 'Gate, grill & railing estimator', d: 'Price steel gates, window grills and railings: cut list, 6 m lengths to buy, weight, paint, labour and fittings, then a PDF or WhatsApp quote.', u: 'steel/index.html', x: 'steel gate grill railing balustrade sliding swing welding fabrication cost estimate quote cut list jua kali square tube shs price kenya' },
        { k: 'page', t: 'Sheet-metal quote tool', d: 'Price sheet-metal parts: flat blank, weight, sheet nesting, cutting, bending and finishing, then a PDF or WhatsApp quote.', u: 'quote/index.html', x: 'sheet metal quote price cost estimate fabrication laser cutting bending powder coating nesting pdf whatsapp workshop' },
        { k: 'page', t: 'Bend allowance calculator', d: 'Free sheet-metal bend allowance, bend deduction and flat length calculator.', u: 'calculators/index.html#bend', x: 'sheet metal bend allowance deduction k-factor flat pattern blank length calculator fabrication tool free' },
        { k: 'page', t: 'Print size & DPI calculator', d: 'Pixels needed for A4, A3, A1, banners and business cards, and check if your image is big enough.', u: 'calculators/index.html#print', x: 'print size dpi pixels resolution a4 a3 a2 a1 a0 banner roll-up bleed poster image quality calculator tool free' },
        { k: 'page', t: 'Engineering unit converter', d: 'Convert length, area, mass, force, pressure, torque and temperature units.', u: 'calculators/index.html#units', x: 'unit converter mm inch mpa psi newton lbf torque nm kg lb celsius fahrenheit conversion tool free' },
        { k: 'page', t: 'Online CV', d: 'Experience, education, skills and certifications. Download as PDF.', u: 'cv/index.html', x: 'cv resume curriculum vitae hire job employment experience education skills portfolio pdf' },
        { k: 'page', t: 'Free CV tailor', d: 'Upload your CV and make a matching CV, cover letter and application email for every job advert. Free with an account.', u: 'cv-tailor/index.html', x: 'cv resume tailor job application cover letter email ats keywords match advert vacancy graduate internship attachment' },
        { k: 'page', t: 'Verify a certificate', d: 'Check a Nexus CAD Studio training certificate with its code.', u: 'verify/index.html', x: 'verify certificate code training trainee check authentic employer' },
        { k: 'page', t: 'Track your project', d: 'Check the status of your project with your reference.', u: 'track/index.html', x: 'status progress order client reference tracker delivery' },
        { k: 'page', t: 'CAD Tips', d: 'All articles on CAD software, DFM and working with a designer.', u: 'blog/index.html', x: 'blog articles tips tutorials' },
        ...posts.map((p) => ({ k: 'article', t: p.title, d: p.description, u: 'blog/' + p.slug + '.html', x: (p.tags || []).join(' ') + ' ' + strip(p.body).slice(0, 1200) })),
        ...ctxP.window.PACKAGES.map((p) => ({ k: 'service', t: p.name, d: p.description, p: p.price ? 'From ' + p.price : '', u: 'index.html#pricing', x: (p.includes || []).join(' ') + ' ' + p.category })),
        ...faqs
    ];
    return '/* Generated by tools/build-pages.js: do not edit by hand. */\nwindow.SEARCH_INDEX = ' + JSON.stringify(items, null, 1) + ';\n';
}

/* ---------- FAQ from the Google Sheet (FAQ tab → js/sheet-data.js) ---------- */
// Answers use simple formatting: **bold**, [link text](#brief or https://...), [button text](#open:webinar-modal)
function faqItemsHtml(list) {
    const inline = (t) => esc(t)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, href) => {
            const h = href.replace(/&amp;/g, '&');
            if (/^#open:[\w-]+$/.test(h)) return '<button type="button" class="inline-link" data-open-modal="' + h.slice(6) + '">' + txt + '</button>';
            if (/^https?:\/\//i.test(h)) return '<a href="' + esc(h) + '" target="_blank" rel="noopener">' + txt + '</a>';
            if (/^(#[\w-]*|[\w./-]+\.html(#[\w-]*)?)$/.test(h)) return '<a href="' + esc(h) + '">' + txt + '</a>';
            return txt;
        });
    return list.map((f, i) => `                    <details class="faq-item"${i === 0 ? ' open' : ''}>
                        <summary>${esc(f.q)}</summary>
                        <div class="faq-body">${String(f.a).split(/\n\s*\n/).map((para) => '<p>' + inline(para.trim()).replace(/\n/g, '<br>') + '</p>').join('')}</div>
                    </details>`).join('\n') + '\n';
}
{
    const ctx = { window: {} };
    vm.runInNewContext(read('js/sheet-data.js'), ctx);
    const faq = (ctx.window.SITE_FAQ || []).filter((f) => f && f.q && f.a);
    if (faq.length && index.includes('<!-- FAQ:START -->')) {
        index = index.replace(/(<!-- FAQ:START -->\n)[\s\S]*?(\s*<!-- FAQ:END -->)/, (m, a, b) => a + faqItemsHtml(faq) + b.replace(/^\n/, ''));
    }
}

/* ---------- Build ---------- */
const REVIEWS = loadReviews();
const projects = loadProjects();
const posts = loadPosts();

projects.forEach((p, i) => write('projects/' + p.id + '.html', projectPage(p, i, projects)));
posts.forEach((p, i) => write('blog/' + p.slug + '.html', postPage(p, i, posts)));
write('blog/index.html', blogIndex(posts));
const TRAINING = loadTraining();
write('training/index.html', trainingPage(TRAINING));
// One page per course; pages for courses no longer in the sheet are removed
const courseFiles = new Set(TRAINING.courses.map((c) => c.id + '.html'));
TRAINING.courses.forEach((c) => write('training/' + c.id + '.html', coursePage(c, TRAINING)));
fs.readdirSync(path.join(ROOT, 'training')).filter((f) => f !== 'index.html' && f.endsWith('.html') && !courseFiles.has(f)).forEach((f) => { fs.rmSync(path.join(ROOT, 'training', f)); console.log('  removed training/' + f); });
write('track/index.html', trackPage());
const CAMPAIGN = loadCampaign();
write('offer/index.html', offerPage(CAMPAIGN));
write('share/index.html', sharePage(TRAINING, CAMPAIGN));
write('verify/index.html', verifyPage());
write('start/index.html', startPage());
write(LEAD.page, cheatSheetPage());
write('account/index.html', accountPage());
write('pay/index.html', payPage());
write('cv/index.html', cvPage(loadCV()));
{
    const CVM = require('./cv-master.js');
    const master = CVM.buildMaster(ROOT);
    write('js/cv-master.js', CVM.masterJs(master));
    write('cv-tailor/index.html', cvTailorPage());
    write('cv-tailor/terms.html', cvTermsPage());
    write('cv-tailor/privacy.html', cvPrivacyPage());
}
write('calculators/index.html', calculatorsPage());
write('request-review/index.html', reviewLinkPage());
write('sitemap.xml', sitemap(projects, posts));
write('js/search-index.js', searchIndex(projects, posts));

// FAQ structured data for Google, generated from the FAQ section of index.html
function faqSchema() {
    const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/ ([.,:;])/g, '$1').trim();
    const qa = [...index.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="faq-body">([\s\S]*?)<\/div>/g)];
    const data = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: qa.map((m) => ({ '@type': 'Question', name: strip(m[1]), acceptedAnswer: { '@type': 'Answer', text: strip(m[2]) } }))
    };
    return '<script type="application/ld+json">\n    ' + JSON.stringify(data) + '\n    </script>';
}

const START = '<!-- BLOG-CARDS:START -->', END = '<!-- BLOG-CARDS:END -->';
const PSTART = '<!-- PATHS:START -->', PEND = '<!-- PATHS:END -->';
// The exams page is written by hand; only its cheat-sheet card comes from here
{
    const LS = '<!-- CSWP-SHEET:START -->', LE = '<!-- CSWP-SHEET:END -->', ex = read('exams/index.html');
    if (ex.includes(LS)) { const next = ex.replace(new RegExp(LS + '[\\s\\S]*?' + LE), () => LS + '\n                    ' + leadMagnet('../', true) + '\n                    ' + LE); if (next !== ex) write('exams/index.html', next); }
}
const FSTART = '<!-- FAQ-SCHEMA:START -->', FEND = '<!-- FAQ-SCHEMA:END -->';
let updated = index;
if (updated.includes(START)) updated = updated.replace(new RegExp(START + '[\\s\\S]*?' + END), START + '\n                    ' + homeCards(posts) + '\n                    ' + END);
if (updated.includes(PSTART)) updated = updated.replace(new RegExp(PSTART + '[\\s\\S]*?' + PEND), () => PSTART + '\n        ' + pathsSection() + '\n        ' + PEND);
if (updated.includes(FSTART)) updated = updated.replace(new RegExp(FSTART + '[\\s\\S]*?' + FEND), () => FSTART + '\n    ' + faqSchema() + '\n    ' + FEND);
if (updated !== indexOriginal) write('index.html', updated);
/* ---------- Text still waiting for a French / Kiswahili translation ----------
   js/i18n-wanted.json lists every piece of text on the built pages (and in the CV and project data,
   which the homepage shows through JavaScript) that the hand-written dictionaries don't cover.
   The Google Sheet's hourly translateJob reads this file from the live site and translates it
   into its Translations tab; the next sheet sync brings the translations back in js/i18n-sheet-*.js. */
function wantedTranslations() {
    const dicts = ['fr', 'sw'].map((l) => {
        const c = { window: {} };
        vm.runInNewContext(read('js/i18n-' + l + '.js'), c);
        const U = l.toUpperCase();
        return { words: c.window['I18N_' + U] || {}, patterns: (c.window['I18N_' + U + '_PATTERNS'] || []).map((x) => x[0]) };
    });
    const known = (k) => dicts.every((d) => Object.prototype.hasOwnProperty.call(d.words, k) || d.patterns.some((re) => re.test(k)));
    const NAMED = { nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', copy: '\u00a9', middot: '\u00b7', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', times: '\u00d7', rarr: '\u2192', larr: '\u2190', uarr: '\u2191', darr: '\u2193', amp: '&' };
    const decode = (t) => t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (NAMED[e.toLowerCase()] != null ? NAMED[e.toLowerCase()] : m));
    const found = new Set();
    const add = (t) => {
        const k = decode(String(t == null ? '' : t)).replace(/\s+/g, ' ').trim();
        if (k.length > 1 && k.length <= 4500 && /\p{L}{2}/u.test(k) && !/^(https?:|mailto:|tel:)|@|\.(html|pdf|jpg|png|glb)\b/i.test(k) && !known(k)) found.add(k);
    };
    const fromHtml = (html) => {
        const h = html.replace(/<(script|style|svg|code|noscript|textarea)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<div class="syl-body" data-no-i18n>[\s\S]*?<\/details>/g, ' ');   // syllabus topics: kept in English, like the software menus
        for (const m of h.matchAll(/\s(?:alt|title|placeholder|aria-label)="([^"]*)"/g)) add(m[1]);
        h.replace(/^[\s\S]*?<body[^>]*>/i, '').split(/<[^>]+>/).forEach(add);
    };
    Object.keys(written).filter((f) => f.endsWith('.html') && !f.startsWith('share/') && !f.startsWith('downloads/') && !/^cv-tailor\/(terms|privacy)\.html$/.test(f)).forEach((f) => fromHtml(written[f]));   // pages only; share/ is for you, in English
    fromHtml(updated);
    const deep = (v) => { if (typeof v === 'string') add(v); else if (Array.isArray(v)) v.forEach(deep); else if (v && typeof v === 'object') pick(v); };
    const skip = new Set(['id', 'theme', 'icon', 'cover', 'gallery', 'pdf', 'model', 'href', 'category', 'file', 'verify', 'linkedin', 'phone', 'year', 'tone']);
    const pick = (o) => Object.keys(o).filter((k) => !skip.has(k)).forEach((k) => deep(o[k]));
    projects.forEach(pick);
    const cv = loadCV().cv;
    pick(cv);
    return [...found].sort().slice(0, 3000);
}
/* ---------- Offline app: the files sw.js saves on install, and its VERSION ----------
   Taken from the <link> and <script> tags of the pages people most need offline, with the exact
   ?v=… they use. VERSION is a fingerprint of those files, so any change to them replaces the old
   cache (pages are always fetched fresh when online, so their own text is not part of it). */
{
    const OFFLINE_PAGES = ['index.html', 'offline.html', 'start/index.html', 'account/index.html', 'pay/index.html', 'exams/index.html', 'training/index.html', 'calculators/index.html', 'cv-tailor/index.html'];
    const DATA = /\/(tracker-data|projects|sheet-works|sheet-data|reviews|certificates|packages|config|i18n-sheet-fr|i18n-sheet-sw|search-index|cv-master)\.js$/;
    const list = ['./'], files = [];
    const addFile = (rel) => { const clean = rel.split('#')[0]; if (!list.includes(clean) && fs.existsSync(path.join(ROOT, clean.split('?')[0]))) { list.push(clean); files.push(clean.split('?')[0]); } };
    OFFLINE_PAGES.forEach((pg) => {
        const html = pg === 'index.html' ? updated : (written[pg] || (fs.existsSync(path.join(ROOT, pg)) ? read(pg) : ''));
        if (!html) return;
        addFile(pg);
        const dir = path.posix.dirname(pg);
        const urls = [...html.matchAll(/<link[^>]*rel="(?:stylesheet|manifest|icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
        // A script tag can carry several files (i18n.js: src, data-fr, data-sw, ...)
        for (const m of html.matchAll(/<script\b[^>]*>/g)) for (const a of m[0].matchAll(/\s(?:src|data-fr|data-sw|data-fr-sheet|data-sw-sheet)="([^"]+)"/g)) urls.push(a[1]);
        for (const u of urls) {
            if (/^(https?:)?\/\//.test(u) || u.startsWith('data:')) continue;
            const rel = path.posix.normalize(path.posix.join(dir, u));
            if (rel.startsWith('..')) continue;
            addFile(DATA.test(rel.split('?')[0]) ? rel.split('?')[0] : rel);   // data files are looked up without ?v= (sw.js)
        }
    });
    ['fonts/plus-jakarta-sans-latin.woff2', 'fonts/fraunces-latin.woff2', 'fonts/fraunces-italic-latin.woff2', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.svg'].forEach(addFile);
    const hash = require('crypto').createHash('sha1');
    list.forEach((u) => hash.update(u + '\n'));
    files.filter((f) => !/\.html$/.test(f) && !DATA.test(f)).forEach((f) => hash.update(fs.readFileSync(path.join(ROOT, f))));   // data changes often and is fetched fresh anyway
    const block = '/* PRECACHE:START */\nconst VERSION = \'' + hash.digest('hex').slice(0, 10) + '\';\nconst PRECACHE = [\n' + list.map((u) => '    ' + JSON.stringify(u)).join(',\n') + '\n];\n/* PRECACHE:END */';
    const sw = read('sw.js'), next = sw.replace(/\/\* PRECACHE:START \*\/[\s\S]*?\/\* PRECACHE:END \*\//, block);
    if (next !== sw) write('sw.js', next);
}
const wanted = JSON.stringify(wantedTranslations(), null, 1) + '\n';
if (!fs.existsSync(path.join(ROOT, 'js/i18n-wanted.json')) || read('js/i18n-wanted.json') !== wanted) write('js/i18n-wanted.json', wanted);
console.log('Done: ' + projects.length + ' projects, ' + posts.length + ' articles.');
