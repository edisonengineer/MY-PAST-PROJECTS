#!/usr/bin/env node
/* =========================================================================
   Builds pdfs/edison-ochieng-portfolio.pdf from the site's own data:
   content/cv.js, js/projects.js, js/packages.js, js/certificates.js.
   Project photos are included automatically once they're uploaded.
   Run:  node tools/build-portfolio.js   (needs Playwright with Chromium)
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdfs/edison-ochieng-portfolio.pdf');
const SITE = 'https://edisonengineer.github.io/MY-PAST-PROJECTS/';
let playwright;
try { playwright = require('playwright'); } catch (e) {
    playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
}

const ctx = { window: {} };
['content/cv.js', 'js/projects.js', 'js/sheet-works.js', 'js/packages.js', 'js/certificates.js', 'js/config.js', 'js/sheet-data.js']
    .forEach((f) => vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx));
const { CV, PROJECTS, PACKAGES, CERTIFICATES, SITE_CONFIG } = ctx.window;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataUri = (rel) => {
    const f = path.join(ROOT, rel || '');
    if (!rel || !fs.existsSync(f)) return null;
    const ext = path.extname(f).slice(1).toLowerCase().replace('jpg', 'jpeg');
    return 'data:image/' + ext + ';base64,' + fs.readFileSync(f).toString('base64');
};
const sprite = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<svg width="0" height="0"[\s\S]*?<\/defs>\s*<\/svg>/)[0];
const icon = (n) => '<svg class="ic"><use href="#i-' + n + '"/></svg>';
const COVERS = {
    teal: 'linear-gradient(135deg,#12b3a4,#1a73d9)', blue: 'linear-gradient(135deg,#3b7bff,#1b2f7a)', violet: 'linear-gradient(135deg,#8b6cff,#c24fd0)',
    green: 'linear-gradient(135deg,#22c07a,#0f7f6e)', rose: 'linear-gradient(135deg,#ff6f91,#b5245e)', sun: 'linear-gradient(135deg,#ffbe3d,#ff6b4a)', coral: 'linear-gradient(135deg,#ff7a59,#e2457a)'
};
const photo = dataUri('images/profile/edison-portrait.jpg') || dataUri('images/profile/edison.jpg');
const year = new Date().getFullYear();

function projectBlock(p) {
    // Same picture saved in two sizes (e.g. name-1200.jpg and name.jpg) counts once
    const seen = new Set();
    const imgs = [p.cover].concat(p.gallery || []).filter((f) => {
        const key = String(f || '').replace(/-\d{3,4}(?=\.\w+$)/, '');
        if (!f || seen.has(key) || !fs.existsSync(path.join(ROOT, f))) return false;
        seen.add(key);
        return true;
    }).slice(0, 3).map(dataUri);
    const media = imgs.length
        ? '<div class="pmedia imgs n' + imgs.length + '">' + imgs.map((s) => '<img src="' + s + '" alt="">').join('') + '</div>'
        : '<div class="pmedia cover" style="background:' + (COVERS[p.theme] || COVERS.blue) + '"><span class="cicon">' + icon(p.icon || 'cube') + '</span><b>' + esc(p.title) + '</b></div>';
    return '<article class="project">' + media +
        '<div class="pbody"><p class="pcat">' + (p.category === 'graphic' ? 'Graphic design' : 'Engineering') + (p.year ? ' · ' + esc(p.year) : '') + '</p>' +
        '<h3>' + esc(p.title) + '</h3><p class="psub">' + esc(p.subtitle || '') + '</p>' +
        '<p class="psum">' + esc(p.summary) + '</p>' +
        '<ul class="ticks">' + (p.points || []).slice(0, 4).map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        '<p class="ptags">' + (p.tags || []).map((t) => '<span>' + esc(t) + '</span>').join('') + '</p>' +
        '<p class="plink">' + esc(SITE.replace('https://', '') + 'projects/' + p.id + '.html') + '</p></div></article>';
}

const pairs = [];
for (let i = 0; i < PROJECTS.length; i += 2) pairs.push(PROJECTS.slice(i, i + 2));
const page = (inner, cls = '') => '<section class="page ' + cls + '">' + inner + '<footer class="pfoot"><span>Edison Ochieng · Nexus CAD Studio</span><span>' + esc(SITE.replace('https://', '')) + '</span></footer></section>';

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18203a; font-size: 9.5pt; line-height: 1.45; letter-spacing: -0.005em; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ic { width: 1em; height: 1em; }
h1, h2, h3, b.serif { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; font-weight: 500; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 20mm; position: relative; overflow: hidden; page-break-after: always; }
.pfoot { position: absolute; left: 16mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 8pt; color: #7b8199; border-top: 1px solid #e9e0d0; padding-top: 3mm; }
.kicker { font-size: 8pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #c43d22; }
h2 { font-size: 22pt; color: #0e1a3a; margin: 2mm 0 6mm; letter-spacing: -.01em; }
h2 em { color: #c43d22; }
/* cover */
.cover-page { background: #0e1a3a; color: #fff; padding: 0; }
.cover-page .pfoot { border-color: rgba(255,255,255,.15); color: rgba(255,255,255,.6); }
.blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; }
.b1 { width: 120mm; height: 120mm; background: #7457f2; top: -40mm; left: -40mm; }
.b2 { width: 110mm; height: 110mm; background: #ff6b4a; bottom: 20mm; right: -40mm; opacity: .45; }
.b3 { width: 80mm; height: 80mm; background: #13a89e; bottom: -30mm; left: 30mm; opacity: .4; }
.cover-inner { position: relative; z-index: 1; height: 100%; padding: 22mm 18mm; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 4mm; }
.mark { width: 13mm; height: 13mm; border-radius: 3.5mm; display: grid; place-items: center; background: linear-gradient(135deg,#ffb627,#ff6b4a); color: #0e1a3a; font: 600 15pt Georgia, serif; }
.brand b { display: block; font: 600 14pt Georgia, serif; }
.brand small { font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; opacity: .7; }
.cover-main { flex: 1; display: grid; grid-template-columns: 1.15fr .85fr; gap: 10mm; align-items: center; }
.cover-main .tag { display: inline-block; padding: 1.5mm 4mm; border-radius: 99px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); font-size: 8.5pt; font-weight: 600; }
.cover-main h1 { margin-top: 6mm; font-size: 44pt; line-height: 1.02; letter-spacing: -.02em; }
.cover-main h1 em { color: #ffb627; font-style: italic; }
.cover-main .sub { margin-top: 5mm; font-size: 13pt; color: rgba(255,255,255,.85); }
.cover-main .tl { margin-top: 2mm; color: #ffb627; font-weight: 600; font-size: 10pt; }
.photo { width: 100%; aspect-ratio: 2/3; border-radius: 6mm; object-fit: cover; box-shadow: 0 10mm 25mm rgba(0,0,0,.4); border: 2mm solid rgba(255,255,255,.9); }
.photo-ph { width: 100%; aspect-ratio: 2/3; border-radius: 6mm; background: linear-gradient(135deg,#172656,#0e1a3a); display: grid; place-items: center; font: 600 40pt Georgia, serif; color: #ffb627; }
.cover-contact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; font-size: 9pt; }
.cover-contact div { padding: 3.5mm 4mm; border-radius: 3mm; background: rgba(255,255,255,.07); }
.cover-contact span { display: block; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: #ffb627; font-weight: 700; }
/* about */
.about-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 9mm; }
.lead { font-size: 11pt; color: #4c5470; }
.stats { margin: 7mm 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.stats div { padding: 4mm; border-radius: 3mm; background: #fbf6ee; }
.stats b { display: block; font: 600 20pt Georgia, serif; color: #0e1a3a; }
.stats span { font-size: 8.5pt; color: #4c5470; }
h4 { font-size: 8pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #646a82; margin: 6mm 0 3mm; }
.ticks { list-style: none; display: grid; gap: 1.6mm; }
.ticks li { position: relative; padding-left: 5mm; color: #4c5470; }
.ticks li::before { content: ''; position: absolute; left: 0; top: 1.9mm; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: #1fae6a; }
.side { padding: 5mm 5.5mm; border-radius: 4mm; background: #fbf6ee; font-size: 8.6pt; line-height: 1.4; }
.side h4 { margin: 4mm 0 1.5mm; }
.side h4:first-child { margin-top: 0; }
.cert { margin-top: 1.6mm; }
.cert b { display: inline; font-weight: 600; color: #0e1a3a; }
.cert span { color: #646a82; }
.cert span::before { content: ' · '; }
.exp { margin-top: 2mm; }
.exp b { color: #0e1a3a; font-weight: 600; }
.exp span { display: block; font-size: 8pt; color: #646a82; }
/* projects */
.project { display: grid; grid-template-columns: 78mm 1fr; gap: 7mm; padding: 6mm 0; border-bottom: 1px solid #e9e0d0; height: 118mm; }
.project:last-of-type { border-bottom: 0; }
.pmedia { border-radius: 4mm; overflow: hidden; height: 100%; }
.pmedia.cover { position: relative; color: #fff; display: flex; flex-direction: column; justify-content: flex-end; gap: 4mm; padding: 7mm; }
.pmedia.cover::after { content: ''; position: absolute; right: -14mm; top: -14mm; width: 50mm; height: 50mm; border-radius: 50%; border: 7mm solid rgba(255,255,255,.12); }
.cicon { width: 13mm; height: 13mm; border-radius: 3.5mm; display: grid; place-items: center; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.3); font-size: 18pt; }
.pmedia.cover b { font: 600 17pt/1.15 Georgia, serif; }
.pmedia.imgs { display: grid; gap: 2mm; }
.pmedia.imgs img { width: 100%; height: 100%; object-fit: cover; border-radius: 2mm; min-height: 0; }
.pmedia.imgs.n2 { grid-template-rows: 1fr 1fr; }
.pmedia.imgs.n3 { grid-template-rows: 1.4fr 1fr; grid-template-columns: 1fr 1fr; }
.pmedia.imgs.n3 img:first-child { grid-column: 1 / -1; }
.pcat { font-size: 7.5pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #c43d22; }
.project h3 { font-size: 15pt; line-height: 1.2; color: #0e1a3a; margin-top: 1mm; }
.psub { font-size: 9pt; color: #646a82; font-weight: 600; margin-top: .5mm; }
.psum { margin: 3mm 0; color: #4c5470; }
.project .ticks { gap: 1mm; font-size: 9pt; }
.ptags { margin-top: 3mm; display: flex; flex-wrap: wrap; gap: 1.5mm; }
.ptags span { padding: .8mm 2.5mm; border-radius: 99px; background: #f3eadb; font-size: 7.5pt; font-weight: 600; color: #4c5470; }
.plink { margin-top: 3mm; font-size: 7.5pt; color: #2f6bff; }
/* services */
.svc { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; }
.svc div { padding: 4.5mm 5mm; border-radius: 3.5mm; border: 1px solid #e9e0d0; }
.svc b { font: 600 12pt Georgia, serif; color: #0e1a3a; }
.svc p { color: #4c5470; font-size: 9pt; margin-top: 1mm; }
.svc em { display: block; margin-top: 2mm; font-style: normal; font-weight: 700; color: #137a49; font-size: 9.5pt; }
.cta { margin-top: 8mm; padding: 8mm; border-radius: 5mm; background: #0e1a3a; color: #fff; display: grid; grid-template-columns: 1.2fr 1fr; gap: 6mm; align-items: center; }
.cta h3 { font-size: 18pt; }
.cta p { color: rgba(255,255,255,.75); margin-top: 2mm; }
.cta ul { list-style: none; display: grid; gap: 2mm; font-size: 9.5pt; }
.cta li span { display: block; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: #ffb627; font-weight: 700; }
</style></head><body>${sprite}

<section class="page cover-page">
    <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
    <div class="cover-inner">
        <div class="brand"><span class="mark">EO</span><div><b>Nexus CAD Studio</b><small>Engineering · Graphic design · Training</small></div></div>
        <div class="cover-main">
            <div>
                <span class="tag">Portfolio ${year}</span>
                <h1>Engineering precision. <em>Creative</em> design.</h1>
                <p class="sub">${esc(CV.name)}, ${esc(CV.title)}</p>
                <p class="tl">${esc(CV.tagline)}</p>
            </div>
            ${photo ? '<img class="photo" src="' + photo + '" alt="">' : '<div class="photo-ph">EO</div>'}
        </div>
        <div class="cover-contact">
            <div><span>WhatsApp</span>${esc(CV.phone)}</div>
            <div><span>Website</span>${esc(SITE.replace('https://', '').replace(/\/$/, ''))}</div>
            <div><span>LinkedIn</span>in/edison-ochieng</div>
        </div>
    </div>
    <footer class="pfoot"><span>Edison Ochieng · Nexus CAD Studio</span><span>Nairobi, Kenya</span></footer>
</section>

${page(`
    <p class="kicker">About me</p>
    <h2>Hello, I'm <em>Edison</em>.</h2>
    <div class="about-grid">
        <div>
            <p class="lead">${esc(CV.summary)}</p>
            <div class="stats">
                <div><b>100+</b><span>people trained in CAD</span></div>
                <div><b>3+ yrs</b><span>hands-on CAD experience</span></div>
                <div><b>Honorable Mention</b><span>Autodesk Designathon 2025</span></div>
            </div>
            <h4>What I do</h4>
            <ul class="ticks">${CV.skills.map((s) => '<li>' + esc(s) + '</li>').join('')}</ul>
        </div>
        <div class="side">
            <h4>Experience</h4>
            ${CV.experience.map((x) => '<div class="exp"><b>' + esc(x.role) + '</b><span>' + esc(x.org) + ' · ' + esc(x.dates) + '</span></div>').join('')}
            <h4>Education</h4>
            ${CV.education.map((x) => '<div class="exp"><b>' + esc(x.title) + '</b><span>' + esc(x.org) + ' · ' + esc(x.dates) + '</span></div>').join('')}
            <h4>Certifications</h4>
            ${CERTIFICATES.map((c) => '<div class="cert"><b>' + esc(c.title) + '</b><span>' + esc(c.issuer || '') + '</span></div>').join('')}
            <h4>Languages</h4>
            <p style="color:#4c5470">${CV.languages.map(esc).join(' · ')}</p>
        </div>
    </div>`)}

${pairs.map((pair, i) => page((i === 0 ? '<p class="kicker">Selected work</p><h2>Projects</h2>' : '') + pair.map(projectBlock).join(''), i === 0 ? 'first-projects' : '')).join('\n')}

${page(`
    <p class="kicker">Services &amp; pricing</p>
    <h2>How I can <em>help</em>.</h2>
    <div class="svc">
        ${PACKAGES.map((k) => '<div><b>' + esc(k.name) + '</b><p>' + esc(k.description) + '</p><em>' + (k.price ? (k.from ? 'From ' : '') + esc(k.price) : 'Custom quote') + '</em></div>').join('')}
    </div>
    <div class="cta">
        <div><h3>Let's work together.</h3><p>Send your project brief on the website or WhatsApp me. I reply within a day.</p></div>
        <ul>
            <li><span>WhatsApp</span>${esc(CV.phone)}</li>
            <li><span>Start a project</span>${esc(SITE.replace('https://', ''))}#brief</li>
            ${SITE_CONFIG.payments && SITE_CONFIG.payments.mpesaTill ? '<li><span>M-Pesa Buy Goods Till</span>' + esc(SITE_CONFIG.payments.mpesaTill) + '</li>' : ''}
        </ul>
    </div>`)}
</body></html>`;

(async () => {
    const browser = await playwright.chromium.launch();
    const pg = await browser.newPage();
    await pg.setContent(html, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);   // the website's fonts (Google Fonts)
    // Downscale photos so the PDF stays small enough to email
    await pg.evaluate(() => Promise.all([...document.images].filter((i) => i.src.startsWith('data:')).map((img) => {
        const max = img.classList.contains('photo') ? 900 : 1100;
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        img.src = c.toDataURL('image/jpeg', 0.8);
        return img.decode().catch(() => {});
    })));
    await pg.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await browser.close();
    console.log('wrote ' + path.relative(ROOT, OUT));
})();
