#!/usr/bin/env node
/* =========================================================================
   Makes a branded PDF syllabus for every course in content/syllabus.json:
   pdfs/syllabus/<course>.pdf. People get it by email from the course page
   ("Get the syllabus as a PDF"), which also adds them to the Subscribers tab.

   A PDF is only rebuilt when its course's syllabus (or this design) changes,
   so the files don't change on every run.
   Run:  node tools/build-syllabus-pdfs.js        (needs Playwright with Chromium)
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const CHECK = process.argv.includes('--check');   // only report whether any PDF needs rebuilding (exit 2 = yes)
function loadPlaywright() {
    try { return require('playwright'); } catch (e) {
        return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
    }
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdfs', 'syllabus');
const HASHES = path.join(OUT, 'versions.json');
const SITE = 'https://edisonengineer.github.io/MY-PAST-PROJECTS/';
const DESIGN = '2';   // bump to rebuild every PDF after changing the layout below
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');

// Course pages use the Courses tab's web address when it has the same course (e.g. fusion-360)
function pageIds() {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content/courses.js'), 'utf8'), ctx);
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/sheet-data.js'), 'utf8'), ctx);
    return (ctx.window.TRAINING.courses || []);
}
const key = (n) => String(n || '').toLowerCase().replace(/^autodesk\s+/, '').replace(/[^a-z0-9]+/g, '');

function html(c, pageUrl) {
    const topics = c.sessions.reduce((a, s) => a + s.topics, 0);
    const cfg = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'), cfg);
    const wa = (cfg.window.SITE_CONFIG || {}).whatsapp || '';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} training syllabus</title><style>
@font-face { font-family: Jakarta; src: url(${font('plus-jakarta-sans-latin.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Fraunces; src: url(${font('fraunces-latin.woff2')}) format('woff2'); font-weight: 300 900; }
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.2pt/1.45 Jakarta, Arial, sans-serif; color: #18203a; }
.cover { background: #0e1a3a; color: #fff; border-radius: 4mm; padding: 9mm 10mm 8mm; margin-bottom: 7mm; }
.brand { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #ffb627; font-weight: 800; }
h1 { font: 600 26pt/1.05 Fraunces, Georgia, serif; margin: 3mm 0 2mm; }
.sub { color: #cfd6ea; font-size: 10.5pt; margin: 0; }
.stats { display: flex; gap: 4mm; margin-top: 6mm; }
.stats div { flex: 1; background: rgba(255,255,255,.08); border-radius: 2.5mm; padding: 3mm 4mm; }
.stats b { display: block; font: 600 14pt/1.1 Fraunces, Georgia, serif; color: #fff; }
.stats span { font-size: 7.6pt; color: #b8c1dd; }
.session { break-inside: avoid; border: 1px solid #e6e1d6; border-radius: 3mm; padding: 4mm 5mm; margin-bottom: 3.5mm; }
.shead { display: flex; align-items: baseline; gap: 3mm; border-bottom: 1px solid #efeadf; padding-bottom: 2mm; margin-bottom: 2.5mm; }
.num { font-size: 7.2pt; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; background: #fff1d2; color: #0e1a3a; padding: 1mm 2.4mm; border-radius: 9mm; white-space: nowrap; }
.stitle { font: 600 12pt/1.2 Fraunces, Georgia, serif; flex: 1; }
.hours { font-size: 8.4pt; font-weight: 700; white-space: nowrap; color: #4a5168; }
.cols { columns: 2; column-gap: 7mm; }
h3 { font-size: 7.4pt; letter-spacing: .07em; text-transform: uppercase; color: #8a8fa3; margin: 1.5mm 0 1mm; break-after: avoid; }
ul { list-style: none; margin: 0 0 1.5mm; padding: 0; }
li { padding-left: 3.6mm; position: relative; break-inside: avoid; }
li::before { content: ''; position: absolute; left: .6mm; top: 1.95mm; width: 1.5mm; height: 1.5mm; border-radius: 50%; background: #ffb627; }
.end { break-inside: avoid; margin-top: 6mm; background: #fbf6ee; border-radius: 3mm; padding: 5mm 6mm; }
.end h2 { font: 600 14pt/1.2 Fraunces, Georgia, serif; margin: 0 0 1.5mm; }
.end p { margin: 0 0 1.5mm; }
.end a { color: #0e1a3a; font-weight: 700; }
</style></head><body>
<section class="cover">
    <div class="brand">Nexus CAD Studio · CAD training · Nairobi &amp; online</div>
    <h1>${esc(c.name)} training</h1>
    <p class="sub">Full course syllabus, session by session</p>
    <div class="stats">
        <div><b>${esc(c.total)}</b><span>in total</span></div>
        <div><b>${c.sessions.length}</b><span>sessions</span></div>
        <div><b>${topics}</b><span>topics</span></div>
        <div><b>${esc(c.perDay || 'Flexible')}</b><span>per session</span></div>
    </div>
</section>
${c.sessions.map((s, i) => `<section class="session">
    <div class="shead"><span class="num">Session ${i + 1}</span><span class="stitle">${esc(s.title)}</span><span class="hours">${esc(s.hours)}</span></div>
    <div class="cols">${s.groups.map((g) => `${g.h ? `<h3>${esc(g.h)}</h3>` : ''}${g.items.length ? `<ul>${g.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`).join('')}</div>
</section>`).join('\n')}
<section class="end">
    <h2>Ready to start?</h2>
    <p>One-on-one, small group or company training, online or in person in Nairobi. Sessions follow this order at a pace that suits you.</p>
    <p>Reserve a seat: <a href="${esc(pageUrl)}">${esc(pageUrl.replace(/^https:\/\//, ''))}</a></p>
    ${wa ? `<p>WhatsApp: <a href="https://wa.me/${esc(wa)}">+${esc(wa)}</a></p>` : ''}
    <p>Edison Ochieng · Mechanical Design Engineer · Founder, Nexus CAD Studio</p>
</section>
</body></html>`;
}

(async () => {
    const syl = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/syllabus.json'), 'utf8')).courses;
    const courses = pageIds();
    fs.mkdirSync(OUT, { recursive: true });
    const versions = fs.existsSync(HASHES) ? JSON.parse(fs.readFileSync(HASHES, 'utf8')) : {};
    const keep = new Set(['versions.json']);
    let browser = null, made = 0;
    for (const c of syl) {
        const page = courses.find((x) => [c.name].concat(c.aliases || []).some((n) => key(n) === key(x.name)));
        const id = page ? page.id : c.id;
        const file = id + '.pdf';
        keep.add(file);
        const pageUrl = SITE + 'training/' + id + '.html';
        const hash = crypto.createHash('sha1').update(DESIGN + JSON.stringify(c) + pageUrl).digest('hex').slice(0, 12);
        if (versions[file] === hash && fs.existsSync(path.join(OUT, file))) continue;
        if (CHECK) { console.log('pdfs/syllabus/' + file + ' needs rebuilding'); process.exitCode = 2; continue; }
        if (!browser) browser = await loadPlaywright().chromium.launch();
        const p = await browser.newPage();
        await p.setContent(html(c, pageUrl), { waitUntil: 'load' });
        await p.evaluate(() => document.fonts.ready);
        const pdf = await p.pdf({ format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
            footerTemplate: '<div style="width:100%;font:7pt Arial;color:#8a8fa3;padding:0 14mm;display:flex;justify-content:space-between"><span>' + esc(c.name) + ' training syllabus · Nexus CAD Studio</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
            margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
        await p.close();
        fs.writeFileSync(path.join(OUT, file), pdf);
        versions[file] = hash;
        made++;
        console.log('wrote pdfs/syllabus/' + file + ' (' + Math.round(pdf.length / 1024) + ' KB)');
    }
    if (browser) await browser.close();
    if (CHECK) { if (!process.exitCode) console.log('Syllabus PDFs are up to date.'); return; }
    // Remove PDFs of courses that no longer have a syllabus
    fs.readdirSync(OUT).filter((f) => !keep.has(f)).forEach((f) => { fs.rmSync(path.join(OUT, f)); delete versions[f]; console.log('removed pdfs/syllabus/' + f); });
    Object.keys(versions).forEach((f) => { if (!keep.has(f)) delete versions[f]; });
    fs.writeFileSync(HASHES, JSON.stringify(versions, null, 1) + '\n');
    console.log(made ? made + ' syllabus PDF(s) made.' : 'Syllabus PDFs are up to date.');
})().catch((err) => { console.error(err); process.exit(1); });
