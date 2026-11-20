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
const DESIGN = '3';   // 3: green table layout   // bump to rebuild every PDF after changing the layout below
const BG = '#e8f4ec';   // page background (soft green)
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
    // Topics of a session: group headings in bold, topics separated by dots, so each session fits one table row
    const cell = (s) => s.groups.map((g) => `<p>${g.h ? `<b>${esc(g.h)}:</b> ` : ''}${g.items.map(esc).join(' · ')}</p>`).join('');
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} training syllabus</title><style>
@font-face { font-family: Jakarta; src: url(${font('plus-jakarta-sans-latin.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Fraunces; src: url(${font('fraunces-latin.woff2')}) format('woff2'); font-weight: 300 900; }
@page { size: A4; margin: 14mm 0 16mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { background: ${BG}; }
body { margin: 0; padding: 0 13mm; font: 9.4pt/1.5 Jakarta, Arial, sans-serif; color: #10241a; }
.cover { background: #0f3d2e; color: #fff; border-radius: 4mm; padding: 9mm 10mm 8mm; margin-bottom: 6mm; }
.brand { font-size: 8.2pt; letter-spacing: .14em; text-transform: uppercase; color: #ffd36b; font-weight: 800; }
h1 { font: 600 27pt/1.05 Fraunces, Georgia, serif; margin: 3mm 0 2mm; color: #fff; }
.sub { color: #e2f1e8; font-size: 10.5pt; margin: 0; }
.stats { display: flex; gap: 3.5mm; margin-top: 6mm; }
.stats div { flex: 1; background: #ffffff; border-radius: 2.5mm; padding: 3mm 4mm; }
.stats b { display: block; font: 700 14pt/1.15 Fraunces, Georgia, serif; color: #0f3d2e; }
.stats span { font-size: 8pt; color: #2f5143; font-weight: 600; }
table { width: 100%; border-collapse: separate; border-spacing: 0; background: #ffffff; border: 1px solid #b9d9c6; border-radius: 3mm; overflow: hidden; }
thead { display: table-header-group; }
th { background: #1b6b4a; color: #ffffff; text-align: left; font-size: 8.4pt; letter-spacing: .06em; text-transform: uppercase; padding: 2.6mm 3mm; }
td { padding: 3mm; vertical-align: top; border-top: 1px solid #d3e8db; color: #10241a; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) td { background: #f2f9f4; }
td.n { width: 11mm; text-align: center; font: 700 12pt/1.2 Fraunces, Georgia, serif; color: #1b6b4a; }
td.t { width: 46mm; font: 600 10.5pt/1.3 Fraunces, Georgia, serif; color: #0f3d2e; }
td.h { width: 19mm; font-weight: 800; white-space: nowrap; color: #10241a; }
td.c p { margin: 0 0 1.2mm; font-size: 8.8pt; line-height: 1.5; }
td.c p:last-child { margin: 0; }
td.c b { color: #0f3d2e; }
.total td { background: #dff0e6 !important; font-weight: 800; color: #0f3d2e; }
.end { break-inside: avoid; margin-top: 6mm; background: #ffffff; border: 1px solid #b9d9c6; border-left: 2mm solid #1b6b4a; border-radius: 3mm; padding: 5mm 6mm; }
.end h2 { font: 600 15pt/1.2 Fraunces, Georgia, serif; margin: 0 0 1.5mm; color: #0f3d2e; }
.end p { margin: 0 0 1.5mm; }
.end a { color: #0f3d2e; font-weight: 800; }
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
<table>
    <thead><tr><th>#</th><th>Session</th><th>Hours</th><th>What we cover</th></tr></thead>
    <tbody>
${c.sessions.map((s, i) => `        <tr><td class="n">${i + 1}</td><td class="t">${esc(s.title)}</td><td class="h">${esc(s.hours)}</td><td class="c">${cell(s)}</td></tr>`).join('\n')}
        <tr class="total"><td></td><td>Total</td><td>${esc(c.total)}</td><td>${c.sessions.length} sessions · ${topics} topics</td></tr>
    </tbody>
</table>
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
        const band = (h, inner) => '<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;position:absolute;left:0;right:0;' + h + ';background:' + BG + ';font:7.5pt Arial;color:#2f5143;padding:0 13mm;display:flex;align-items:center;justify-content:space-between">' + inner + '</div>';
        const pdf = await p.pdf({ format: 'A4', printBackground: true, displayHeaderFooter: true,
            headerTemplate: '<style>html{-webkit-print-color-adjust:exact}</style>' + band('top:0;height:14mm', ''),
            footerTemplate: '<style>html{-webkit-print-color-adjust:exact}</style>' + band('bottom:0;height:16mm', '<span>' + esc(c.name) + ' training syllabus · Nexus CAD Studio</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>'),
            margin: { top: '14mm', bottom: '16mm', left: '0', right: '0' } });
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
