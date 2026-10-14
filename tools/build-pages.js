#!/usr/bin/env node
/* =========================================================================
   Builds the extra pages from the site's data:
     projects/<id>.html   one case-study page per project in js/projects.js
     blog/<slug>.html     one page per article in content/blog/*.html
     blog/index.html      the CAD Tips list
     index.html           refreshes the "Latest CAD tips" cards on the homepage
     sitemap.xml          every page above

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
const CSS_V = 'css/style.css?v=16';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); console.log('  wrote ' + f); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const LABEL = { engineering: 'Engineering', graphic: 'Graphic design' };

/* ---------- Data ---------- */
function loadProjects() {
    const ctx = { window: {} };
    vm.runInNewContext(read('js/projects.js'), ctx);
    return ctx.window.PROJECTS;
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
                    <form class="newsletter-form" data-web3 novalidate>
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

/* ---------- Shared page chrome ---------- */
const index = read('index.html');
const SPRITE = index.match(/<svg width="0" height="0"[\s\S]*?<\/defs>\s*<\/svg>/)[0];

function head({ title, description, url, image, type, jsonld }) {
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
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="Edison Ochieng">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:locale" content="en_KE">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">
    <link rel="icon" href="../favicon.ico" sizes="any">
    <link rel="icon" href="../favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="../apple-touch-icon.png">
    <link rel="manifest" href="../site.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
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
            <a href="../index.html" class="brand" aria-label="Edison Ochieng, home">
                <span class="brand-mark">EO</span>
                <span class="brand-text">Edison Ochieng<small>Nexus CAD Studio</small></span>
            </a>

            <nav class="site-nav" id="site-nav" aria-label="Primary">
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
                <p>Mechanical design engineer and graphic designer based in Nairobi, Kenya.</p>
            </div>
            <nav class="footer-col" aria-label="Footer">
                <h2>Explore</h2>
                <a href="../index.html#services">Services</a>
                <a href="../index.html#work">Work</a>
                <a href="../blog/index.html">CAD Tips</a>
                <a href="../training/index.html">CAD training</a>
                <a href="../calculators/index.html">Free tools</a>
                <a href="../index.html#pricing">Pricing</a>
                <a href="../index.html#brief">Start a project</a>
                <a href="../track/index.html">Track your project</a>
                <a href="../cv/index.html">Online CV</a>
                <a href="../index.html#faq">FAQ</a>
            </nav>
            <div class="footer-col">
                <h2>Connect</h2>
                <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>
                <a href="../index.html#contact" class="js-email" data-user="edisonochieng24" data-domain="gmail.com">Email</a>
                <a href="https://www.linkedin.com/in/edison-ochieng-870a37229/" target="_blank" rel="noopener">LinkedIn</a>
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

${extraScripts}    <script defer src="../js/i18n-fr.js?v=15"></script>
    <script defer src="../js/i18n-sw.js?v=12"></script>
    <script defer src="../js/i18n.js?v=3"></script>
    <script defer src="../js/pages.js?v=5"></script>
    <script defer src="../js/search.js?v=1"></script>
</body>
</html>
`;
}

const cover = (o, cls) => `<div class="${cls} theme-${esc(o.theme || 'blue')}" aria-hidden="true">
                        <span class="pc-cover-icon">${icon(o.icon || 'cube')}</span>
                    </div>`;

/* ---------- Project pages ---------- */
function projectPage(p, i, all) {
    const url = SITE + 'projects/' + p.id + '.html';
    const imgs = Array.from(new Set(p.gallery && p.gallery.length ? p.gallery : (p.cover ? [p.cover] : [])));
    const image = SITE + (p.cover || 'og-image.jpg');
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

                    <h2 class="case-h">Highlights</h2>
                    <ul class="pm-points">
${(p.points || []).map((t) => `                        <li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n')}
                    </ul>

                    <dl class="pm-meta">
${(p.meta || []).map((m) => `                        <div><dt>${esc(m[0])}</dt><dd>${esc(m[1])}</dd></div>`).join('\n')}
                    </dl>

                    <ul class="chip-row">
${(p.tags || []).map((t) => `                        <li class="chip">${esc(t)}</li>`).join('\n')}
                    </ul>

                    <div class="pm-actions">
                        ${p.pdf ? `<a class="btn btn-navy" href="../${esc(p.pdf)}" target="_blank" rel="noopener" data-if-exists hidden>${icon('doc')} Read report</a>` : ''}
                        <a class="btn btn-green" href="https://wa.me/${WHATSAPP}?text=${msg}" target="_blank" rel="noopener">${icon('whatsapp')} Discuss a similar project</a>
                        <a class="btn btn-outline" href="../index.html#brief">Start a project</a>
                    </div>
                </div>
            </div>
        </section>

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
                        ${cover(post, 'post-cover')}
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
    const image = SITE + 'og-image.jpg';
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
    return head({ title: post.title + ' | CAD Tips', description: post.description, url, image, type: 'article', jsonld }) + '\n' + header('blog') + `
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
` : ''}${newsletter()}    </main>
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
    return head({ title: 'CAD Tips | Edison Ochieng', description, url, image: SITE + 'og-image.jpg', type: 'website', jsonld }) + '\n' + header('blog') + `
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
${newsletter()}    </main>
` + footer();
}

/* ---------- CAD training page ---------- */
function loadTraining() {
    const ctx = { window: {} };
    vm.runInNewContext(read('content/courses.js'), ctx);
    return ctx.window.TRAINING;
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
    return head({ title: 'CAD Training: AutoCAD, SolidWorks, Inventor & Fusion 360 | Edison Ochieng', description, url, image: SITE + 'og-image.jpg', type: 'website', jsonld }) + '\n' + header('training') + `
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
                        <h4>What you'll learn</h4>
                        <ul class="pm-points">
${c.topics.map((t) => `                            <li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n')}
                        </ul>
                        <a class="btn btn-outline course-cta" href="#reserve" data-course="${esc(c.name)}">Reserve a seat ${icon('arrow')}</a>
                    </article>`).join('\n')}
                </div>
            </div>
        </section>

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
                    <form class="reserve-form" id="reserve-form" data-web3 novalidate>
                        <input type="hidden" name="access_key" value="${esc(key)}">
                        <input type="hidden" name="subject" value="New CAD training seat request">
                        <input type="hidden" name="from_name" value="Portfolio: CAD training">
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
                        <p class="form-error" role="alert" hidden></p>
                        <button type="submit" class="btn btn-sun btn-lg btn-block">Reserve my seat</button>
                        <button type="button" class="btn btn-green btn-block" data-wa-form>${icon('whatsapp')} Send on WhatsApp instead</button>
                    </form>
                    <div class="form-done" hidden tabindex="-1">
                        <span class="done-icon">${icon('check')}</span>
                        <h3>Seat request sent!</h3>
                        <p>Thank you. I'll get back to you within a day with the schedule and fees.</p>
                        <a class="btn btn-outline" href="../index.html#webinar">Join the free webinar meanwhile</a>
                    </div>
                </div>
            </div>
        </section>
${newsletter()}    </main>
` + footer('    <script defer src="../js/config.js?v=8"></script>\n    <script defer src="../js/currency.js?v=1"></script>\n');
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
    return head({ title: 'Free Tools: Bend Allowance, Print DPI & Unit Converter | Edison Ochieng', description, url, image: SITE + 'og-image.jpg', type: 'website', jsonld }) + '\n' + header('calculators') + `
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
            <div class="container">${cta('Need the full part modelled with flat patterns and drawings?', '../index.html#brief', 'Engineering Design')}</div>
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
    return head({ title: 'CV | ' + cv.name, description, url, image: SITE + 'og-image.jpg', type: 'profile', jsonld }) + '\n' + header('cv') + `
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

/* ---------- Review-request link maker (for Edison) ---------- */
function reviewLinkPage() {
    const url = SITE + 'request-review/';
    const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
    return head({ title: 'Request a review | Nexus CAD Studio', description: 'Create a link that asks a client for a review.', url, image: SITE + 'og-image.jpg', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Request a review', url } })
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
function trackPage() {
    const url = SITE + 'track/';
    const description = 'Check the status of your Nexus CAD Studio project with the reference Edison sent you.';
    return head({ title: 'Track your project | Nexus CAD Studio', description, url, image: SITE + 'og-image.jpg', type: 'website', jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Track your project', url, description } }).replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">') + '\n' + header('track') + `
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
` + footer('    <script defer src="../js/config.js?v=8"></script>\n    <script defer src="../js/currency.js?v=1"></script>\n    <script defer src="../js/tracker-data.js"></script>\n    <script defer src="../js/tracker.js?v=1"></script>\n');
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
        u('blog/', '0.8', 'weekly'),
        u('training/', '0.8', 'monthly'),
        u('cv/', '0.8', 'monthly'),
        u('calculators/', '0.9', 'monthly'),
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
    const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const faqs = [...index.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="faq-body">([\s\S]*?)<\/div>/g)]
        .map((m) => ({ k: 'faq', t: strip(m[1]), d: '', u: 'index.html#faq', x: strip(m[2]) }));
    const items = [
        ...SECTIONS.map(([t, d, h, x]) => ({ k: 'page', t, d, u: 'index.html' + h, x })),
        ...projects.map((p) => ({ k: 'project', t: p.title, d: p.subtitle || '', u: 'projects/' + p.id + '.html', x: [p.summary, (p.tags || []).join(' '), (p.points || []).join(' '), (p.meta || []).map((m) => m[1]).join(' '), p.category].join(' ') })),
        { k: 'page', t: 'CAD training courses', d: 'AutoCAD, SolidWorks, Inventor and Fusion 360 training. Reserve a seat.', u: 'training/index.html', x: 'training course class lessons learn autocad solidworks inventor fusion cswa tutor teacher student' },
        { k: 'page', t: 'Bend allowance calculator', d: 'Free sheet-metal bend allowance, bend deduction and flat length calculator.', u: 'calculators/index.html#bend', x: 'sheet metal bend allowance deduction k-factor flat pattern blank length calculator fabrication tool free' },
        { k: 'page', t: 'Print size & DPI calculator', d: 'Pixels needed for A4, A3, A1, banners and business cards, and check if your image is big enough.', u: 'calculators/index.html#print', x: 'print size dpi pixels resolution a4 a3 a2 a1 a0 banner roll-up bleed poster image quality calculator tool free' },
        { k: 'page', t: 'Engineering unit converter', d: 'Convert length, area, mass, force, pressure, torque and temperature units.', u: 'calculators/index.html#units', x: 'unit converter mm inch mpa psi newton lbf torque nm kg lb celsius fahrenheit conversion tool free' },
        { k: 'page', t: 'Online CV', d: 'Experience, education, skills and certifications. Download as PDF.', u: 'cv/index.html', x: 'cv resume curriculum vitae hire job employment experience education skills portfolio pdf' },
        { k: 'page', t: 'Track your project', d: 'Check the status of your project with your reference.', u: 'track/index.html', x: 'status progress order client reference tracker delivery' },
        { k: 'page', t: 'CAD Tips', d: 'All articles on CAD software, DFM and working with a designer.', u: 'blog/index.html', x: 'blog articles tips tutorials' },
        ...posts.map((p) => ({ k: 'article', t: p.title, d: p.description, u: 'blog/' + p.slug + '.html', x: (p.tags || []).join(' ') + ' ' + strip(p.body).slice(0, 1200) })),
        ...ctxP.window.PACKAGES.map((p) => ({ k: 'service', t: p.name, d: p.description, p: p.price ? 'From ' + p.price : '', u: 'index.html#pricing', x: (p.includes || []).join(' ') + ' ' + p.category })),
        ...faqs
    ];
    return '/* Generated by tools/build-pages.js: do not edit by hand. */\nwindow.SEARCH_INDEX = ' + JSON.stringify(items, null, 1) + ';\n';
}

/* ---------- Build ---------- */
const projects = loadProjects();
const posts = loadPosts();

projects.forEach((p, i) => write('projects/' + p.id + '.html', projectPage(p, i, projects)));
posts.forEach((p, i) => write('blog/' + p.slug + '.html', postPage(p, i, posts)));
write('blog/index.html', blogIndex(posts));
write('training/index.html', trainingPage(loadTraining()));
write('track/index.html', trackPage());
write('cv/index.html', cvPage(loadCV()));
write('calculators/index.html', calculatorsPage());
write('request-review/index.html', reviewLinkPage());
write('sitemap.xml', sitemap(projects, posts));
write('js/search-index.js', searchIndex(projects, posts));

const START = '<!-- BLOG-CARDS:START -->', END = '<!-- BLOG-CARDS:END -->';
if (index.includes(START)) {
    const updated = index.replace(new RegExp(START + '[\\s\\S]*?' + END), START + '\n                    ' + homeCards(posts) + '\n                    ' + END);
    if (updated !== index) write('index.html', updated);
}
console.log('Done: ' + projects.length + ' projects, ' + posts.length + ' articles.');
