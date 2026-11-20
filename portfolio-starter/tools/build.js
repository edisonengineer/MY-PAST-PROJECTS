#!/usr/bin/env node
/* =========================================================================
   Builds the job-application portfolio into site/ from the main site's data:
     content/cv.js            experience, education, skills, languages
     js/projects.js           projects you maintain by hand
     js/sheet-works.js        projects from the Google Sheet "Works" tab
     js/certificates.js       certificates (replaced by the sheet's list
     js/sheet-data.js           in sheet-data.js when the sheet has one)

   Nothing here is edited by hand: change the sheet (or the main repo) and
   this site follows on its next build. Filters live in portfolio.config.json.

   Run:  bash tools/pull-content.sh && node tools/build.js
   Or point at a local copy of the main repo:  SOURCE=../MY-PAST-PROJECTS node tools/build.js
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(ROOT, process.env.SOURCE || '_source');
const OUT = path.join(ROOT, 'site');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'portfolio.config.json'), 'utf8'));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'projects'), { recursive: true });

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const has = (rel) => !!rel && fs.existsSync(path.join(SRC, rel));
const copied = new Set();
function use(rel) {                       // copy a file from the main repo into the site, once
    if (!has(rel)) return '';
    if (!copied.has(rel)) {
        fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
        fs.copyFileSync(path.join(SRC, rel), path.join(OUT, rel));
        copied.add(rel);
    }
    return rel;
}
const small = (rel) => { const s = String(rel || '').replace(/(\.\w+)$/, '-800$1'); return has(s) ? s : rel; };
const link = (href) => /^(https?:|mailto:|tel:)/.test(href) ? href : CFG.mainSiteUrl + href;   // main-site pages stay on the main site

/* ---------- Data from the main repo ---------- */
if (!fs.existsSync(path.join(SRC, 'js/projects.js'))) {
    console.error('No main-site content in ' + SRC + '. Run: bash tools/pull-content.sh');
    process.exit(1);
}
const ctx = { window: {} };
['js/config.js', 'content/cv.js', 'js/projects.js', 'js/sheet-works.js', 'js/certificates.js', 'js/sheet-data.js']
    .filter(has).forEach((f) => vm.runInNewContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx));
const W = ctx.window;
const CV = W.CV;

const order = (p) => { const i = (CFG.projectOrder || []).indexOf(p.id); return i < 0 ? 999 : i; };
const projects = (W.PROJECTS || [])
    .filter((p) => p.portfolio !== false)                                  // sheet "Job portfolio" = No, or portfolio: false
    .filter((p) => (CFG.categories || ['engineering', 'graphic']).includes(p.category))
    .filter((p) => !(CFG.excludeProjects || []).includes(p.id))
    .map((p, i) => Object.assign({ _i: i }, p))
    .sort((a, b) => order(a) - order(b) || a._i - b._i);
const engineering = projects.filter((p) => p.category === 'engineering');
const graphic = projects.filter((p) => p.category === 'graphic');
const certificates = (W.CERTIFICATES || [])
    .filter((c) => c.portfolio !== false && !(CFG.excludeCertificates || []).includes(c.title));

/* ---------- Page parts ---------- */
const name = CV.name;
const headline = CFG.headline || CV.title;
const photo = use('images/profile/edison-portrait.jpg') || use('images/profile/edison.jpg');
const cvPdf = use('pdfs/edison-ochieng-cv.pdf');
const C = CFG.contact || {};
const contacts = [
    C.email && ['Email', 'mailto:' + C.email, C.email],
    C.phone && CV.phone && ['Phone', 'tel:' + CV.phone.replace(/\s+/g, ''), CV.phone],
    C.linkedin && CV.linkedin && ['LinkedIn', CV.linkedin, 'linkedin.com/in/' + CV.linkedin.replace(/\/$/, '').split('/').pop()],
    C.whatsapp && W.SITE_CONFIG && W.SITE_CONFIG.whatsapp && ['WhatsApp', 'https://wa.me/' + W.SITE_CONFIG.whatsapp, '+' + W.SITE_CONFIG.whatsapp]
].filter(Boolean);
['fonts/plus-jakarta-sans-latin.woff2', 'fonts/fraunces-latin.woff2', 'favicon.svg', 'favicon.ico'].forEach(use);

function page({ title, description, body, depth = 0, extraHead = '' }) {
    const up = depth ? '../'.repeat(depth) : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    ${photo ? `<meta property="og:image" content="${esc(CFG.siteUrl + photo)}">` : ''}
    <link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="${up}css/portfolio.css">
    ${extraHead}
</head>
<body>
    <header class="top"><div class="wrap">
        <a class="brand" href="${up}index.html">${esc(name)}</a>
        <nav aria-label="Primary">
            <a href="${up}index.html#projects">Projects</a>
            <a href="${up}index.html#experience">Experience</a>
            <a href="${up}index.html#certificates">Certificates</a>
            ${cvPdf ? `<a class="btn small" href="${up}${cvPdf}" download>Download CV</a>` : ''}
        </nav>
    </div></header>
    <main>${body}</main>
    <footer class="foot"><div class="wrap">
        <span>© ${new Date().getFullYear()} ${esc(name)}</span>
        ${CFG.linkToMainSite ? `<a href="${esc(CFG.mainSiteUrl)}">Freelance studio site</a>` : ''}
    </div></footer>
</body>
</html>
`;
}

const card = (p) => {
    const img = use(small(p.cover)) || use(p.cover);
    return `<a class="card" href="projects/${esc(p.id)}.html">
                <div class="card-img theme-${esc(p.theme || 'blue')}">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : ''}</div>
                <div class="card-body">
                    <span class="eyebrow">${esc([p.year, p.subtitle].filter(Boolean).join(' · '))}</span>
                    <h3>${esc(p.title)}</h3>
                    <p>${esc(p.summary)}</p>
                    <ul class="tags">${(p.tags || []).slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
                </div>
            </a>`;
};

/* ---------- Home ---------- */
const intro = CFG.intro || CV.summary;
const home = page({
    title: name + ' | ' + headline,
    description: intro.slice(0, 160),
    body: `
    <section class="hero"><div class="wrap hero-grid">
        <div>
            <p class="eyebrow">${esc(CV.location)}</p>
            <h1>${esc(name)}</h1>
            <p class="lead">${esc(headline)}</p>
            <p>${esc(intro)}</p>
            <div class="actions">
                ${cvPdf ? `<a class="btn" href="${cvPdf}" download>Download CV (PDF)</a>` : ''}
                <a class="btn ghost" href="#contact">Contact me</a>
            </div>
        </div>
        ${photo ? `<img class="portrait" src="${photo}" alt="${esc(name)}" width="320" height="400">` : ''}
    </div></section>

    <section class="section" id="projects"><div class="wrap">
        <h2>Engineering projects</h2>
        <div class="grid">${engineering.map(card).join('')}</div>
        ${graphic.length ? `<h2 class="${CFG.showGraphicDesignAsSecondary ? 'h-secondary' : ''}">Graphic design</h2>
        <div class="grid ${CFG.showGraphicDesignAsSecondary ? 'grid-small' : ''}">${graphic.map(card).join('')}</div>` : ''}
    </div></section>

    <section class="section alt" id="experience"><div class="wrap two-col">
        <div>
            <h2>Experience</h2>
            ${CV.experience.map((e) => `<article class="item">
                <h3>${esc(e.role)}</h3>
                <p class="meta">${esc(e.org)} · ${esc(e.dates)}</p>
                ${e.points.length ? `<ul>${e.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
            </article>`).join('')}
        </div>
        <div>
            <h2>Education</h2>
            ${CV.education.map((e) => `<article class="item">
                <h3>${esc(e.title)}</h3>
                <p class="meta">${esc(e.org)} · ${esc(e.dates)}</p>
                ${e.note ? `<p>${esc(e.note)}</p>` : ''}
            </article>`).join('')}
            <h2>Skills</h2>
            <ul class="skills">${CV.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
            ${CV.languages ? `<h2>Languages</h2><p>${CV.languages.map(esc).join(' · ')}</p>` : ''}
        </div>
    </div></section>

    ${certificates.length ? `<section class="section" id="certificates"><div class="wrap">
        <h2>Certificates &amp; honours</h2>
        <ul class="certs">${certificates.map((c) => {
            const f = use(c.file);
            return `<li><strong>${esc(c.title)}</strong><span>${esc(c.issuer)}</span>
                ${c.verify ? `<a href="${esc(c.verify)}" target="_blank" rel="noopener">Verify</a>` : f ? `<a href="${esc(f)}" target="_blank" rel="noopener">View</a>` : ''}</li>`;
        }).join('')}</ul>
    </div></section>` : ''}

    <section class="section alt" id="contact"><div class="wrap">
        <h2>Contact</h2>
        <ul class="contact">${contacts.map(([k, href, label]) => `<li><span>${k}</span><a href="${esc(href)}"${/^https/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a></li>`).join('')}</ul>
    </div></section>`
});

/* ---------- Project pages ---------- */
function projectPage(p) {
    const gallery = (p.gallery && p.gallery.length ? p.gallery : [p.cover]).map((g) => use(g)).filter(Boolean);
    const model = use(p.model);
    const pdf = use(p.pdf);
    const s = p.story || {};
    return page({
        depth: 1,
        title: p.title + ' | ' + name,
        description: p.summary,
        extraHead: model ? `<script type="module" src="${esc((W.SITE_CONFIG && W.SITE_CONFIG.modelViewerSrc) || 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js')}"></script>` : '',
        body: `
    <article class="section"><div class="wrap narrow">
        <a class="back" href="../index.html#projects">← All projects</a>
        <p class="eyebrow">${esc([p.year, p.subtitle].filter(Boolean).join(' · '))}</p>
        <h1>${esc(p.title)}</h1>
        <p class="lead">${esc(p.summary)}</p>
        ${(p.meta || []).length ? `<dl class="facts">${p.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${model ? `<model-viewer class="model" src="../${esc(model)}" alt="3D model of ${esc(p.title)}" camera-controls auto-rotate ar shadow-intensity="1"></model-viewer>` : ''}
        ${s.brief ? `<h2>The brief</h2><p>${esc(s.brief)}</p>` : ''}
        ${s.approach ? `<h2>My approach</h2><p>${esc(s.approach)}</p>` : ''}
        ${(p.points || []).length ? `<h2>Highlights</h2><ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${s.result ? `<h2>Result</h2><p>${esc(s.result)}</p>` : ''}
        <div class="actions">
            ${pdf ? `<a class="btn" href="../${esc(pdf)}" target="_blank" rel="noopener">Read the report (PDF)</a>` : ''}
            ${s.link && s.link.href ? `<a class="btn ghost" href="${esc(link(s.link.href))}" target="_blank" rel="noopener">${esc(s.link.label || 'Read more')}</a>` : ''}
        </div>
        ${(p.tags || []).length ? `<ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <div class="gallery">${gallery.map((g) => `<a href="../${esc(g)}" target="_blank" rel="noopener"><img src="../${esc(use(small(g)) || g)}" alt="${esc(p.title)}" loading="lazy" decoding="async"></a>`).join('')}</div>
    </div></article>`
    });
}

/* ---------- Write ---------- */
fs.writeFileSync(path.join(OUT, 'index.html'), home);
projects.forEach((p) => fs.writeFileSync(path.join(OUT, 'projects', p.id + '.html'), projectPage(p)));
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'css/portfolio.css'), path.join(OUT, 'css/portfolio.css'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');

const left = (W.PROJECTS || []).length - projects.length;
console.log(`Built site/: ${engineering.length} engineering + ${graphic.length} graphic project(s)` +
    (left ? `, ${left} hidden by filters` : '') + `, ${certificates.length} certificate(s), ${copied.size} file(s) copied.`);
