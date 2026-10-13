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
const CSS_V = 'css/style.css?v=6';

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
                ${a('../index.html#faq', 'FAQ')}
                ${a('../index.html#contact', 'Contact')}
                <a href="../index.html#brief" class="btn btn-sun nav-cta">Start a project</a>
            </nav>

            <div class="header-tools">
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

function footer() {
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
                <h4>Explore</h4>
                <a href="../index.html#services">Services</a>
                <a href="../index.html#work">Work</a>
                <a href="../blog/index.html">CAD Tips</a>
                <a href="../index.html#pricing">Pricing</a>
                <a href="../index.html#brief">Start a project</a>
                <a href="../index.html#faq">FAQ</a>
            </nav>
            <div class="footer-col">
                <h4>Connect</h4>
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

    <script src="../js/i18n-fr.js?v=4"></script>
    <script src="../js/i18n-sw.js?v=1"></script>
    <script src="../js/i18n.js?v=2"></script>
    <script src="../js/pages.js?v=1"></script>
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
${imgs.map((src, k) => `                        <button type="button" class="case-shot" data-i="${k}" aria-label="View image ${k + 1} full screen"><img src="../${esc(src)}" alt="${esc(p.title)}, image ${k + 1}" loading="${k ? 'lazy' : 'eager'}" decoding="async"></button>`).join('\n')}
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
function postCard(post, prefix) {
    return `<article class="post-card">
                    <a href="${prefix}${esc(post.slug)}.html" class="post-link">
                        ${cover(post, 'post-cover')}
                        <div class="post-body" data-no-i18n>
                            <p class="post-meta"><time datetime="${esc(post.date)}">${esc(fmtDate(post.date))}</time> · ${post.minutes} min read</p>
                            <h3>${esc(post.title)}</h3>
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
` : ''}    </main>
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
                ${posts.map((x) => postCard(x, '')).join('\n                ')}
                </div>
            </div>
        </section>
    </main>
` + footer();
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
        ...posts.map((p) => u('blog/' + p.slug + '.html', '0.7', 'yearly', p.updated || p.date)),
        ...projects.map((p) => u('projects/' + p.id + '.html', '0.7', 'yearly'))
    ].join('\n')}
</urlset>
`;
}

/* ---------- Build ---------- */
const projects = loadProjects();
const posts = loadPosts();

projects.forEach((p, i) => write('projects/' + p.id + '.html', projectPage(p, i, projects)));
posts.forEach((p, i) => write('blog/' + p.slug + '.html', postPage(p, i, posts)));
write('blog/index.html', blogIndex(posts));
write('sitemap.xml', sitemap(projects, posts));

const START = '<!-- BLOG-CARDS:START -->', END = '<!-- BLOG-CARDS:END -->';
if (index.includes(START)) {
    const updated = index.replace(new RegExp(START + '[\\s\\S]*?' + END), START + '\n                    ' + homeCards(posts) + '\n                    ' + END);
    if (updated !== index) write('index.html', updated);
}
console.log('Done: ' + projects.length + ' projects, ' + posts.length + ' articles.');
