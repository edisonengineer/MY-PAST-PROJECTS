#!/usr/bin/env node
/* =========================================================================
   Builds pdfs/nexus-cad-studio-rate-card.pdf from js/packages.js.
   Run after changing prices:   node tools/build-rate-card.js
   Needs Playwright (npm i -g playwright) with Chromium installed.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdfs/nexus-cad-studio-rate-card.pdf');
let playwright;
try { playwright = require('playwright'); } catch (e) {
    playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
}

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/packages.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/sheet-data.js'), 'utf8'), ctx);   // Pricing tab of the Google Sheet
const PACKAGES = ctx.window.PACKAGES;
const cfg = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'), cfg);
const TILL = ((cfg.window.SITE_CONFIG || {}).payments || {}).mpesaTill || '';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GROUPS = [['engineering', 'Engineering design'], ['graphic', 'Graphic design'], ['training', 'Training']];
const COLOURS = { blue: '#2f6bff', teal: '#13a89e', violet: '#7457f2', coral: '#ff6b4a', sun: '#f2a20c', rose: '#e2457a', green: '#1fae6a' };
const logo = fs.readFileSync(path.join(ROOT, 'icon-192.png')).toString('base64');
const year = new Date().getFullYear();

const rows = (cat) => PACKAGES.filter((p) => p.category === cat).map((p) => `
        <tr>
            <td class="name"><div class="nm"><span class="dot" style="background:${COLOURS[p.theme] || '#2f6bff'}"></span><div><strong>${esc(p.name)}</strong><p>${esc(p.description)}</p></div></div></td>
            <td class="inc">${(p.includes || []).map(esc).join(' · ')}</td>
            <td class="price">${p.price ? (p.from ? '<small>From</small>' : '') + esc(p.price) : 'Custom quote'}</td>
        </tr>`).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18203a; font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
header { flex: none; background: #0e1a3a; color: #fff; padding: 11mm 16mm 8mm; position: relative; overflow: hidden; }
footer { flex: none; }
header::after { content: ''; position: absolute; right: -30mm; top: -30mm; width: 90mm; height: 90mm; border-radius: 50%; background: linear-gradient(135deg, #ffb627, #ff6b4a); opacity: .9; }
.brand { display: flex; align-items: center; gap: 4mm; position: relative; z-index: 1; }
.brand img { width: 13mm; height: 13mm; border-radius: 3mm; }
.brand b { display: block; font-family: 'Fraunces', Georgia, 'Times New Roman', serif; font-size: 15pt; }
.brand small { letter-spacing: .14em; text-transform: uppercase; font-size: 7.5pt; opacity: .75; }
h1 { position: relative; z-index: 1; margin-top: 6mm; font-family: 'Fraunces', Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 30pt; letter-spacing: -.01em; }
h1 em { color: #ffb627; }
.lede { position: relative; z-index: 1; margin-top: 2mm; max-width: 130mm; line-height: 1.5; color: rgba(255,255,255,.8); }
main { flex: 1; padding: 6mm 16mm 0; }
h2 { margin: 5mm 0 2mm; font-size: 8.5pt; letter-spacing: .16em; text-transform: uppercase; color: #ff6b4a; }
table { width: 100%; border-collapse: collapse; }
td { padding: 2.1mm 2mm; border-bottom: 1px solid #e9e0d0; vertical-align: top; }
td.name { width: 44%; }
.nm { display: flex; gap: 3mm; }
td.name p { color: #4c5470; font-size: 9pt; margin-top: .6mm; }
.dot { flex: 0 0 3mm; height: 3mm; border-radius: 50%; margin-top: 1.4mm; }
td.inc { color: #4c5470; font-size: 8.6pt; }
td.price { width: 24mm; text-align: right; font-weight: 700; white-space: nowrap; color: #0e1a3a; }
td.price small { display: block; font-weight: 600; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: #7b8199; }
.notes { margin-top: 6mm; padding: 4mm 5mm; border-radius: 3mm; background: #fbf6ee; font-size: 9pt; color: #4c5470; }
.notes li { margin-left: 4mm; margin-top: 1mm; }
footer { margin: 6mm 16mm 12mm; padding-top: 4mm; border-top: 2px solid #0e1a3a; display: flex; justify-content: space-between; gap: 6mm; font-size: 9pt; }
footer b { color: #0e1a3a; }
</style></head><body><div class="page">
<header>
    <div class="brand"><img src="data:image/png;base64,${logo}" alt=""><div><b>Nexus CAD Studio</b><small>Edison Ochieng · Nairobi, Kenya</small></div></div>
    <h1>Rate card <em>${year}</em></h1>
    <p class="lede">CAD design, simulation, graphic design and CAD training. Starting prices in Kenyan shillings.</p>
</header>
<main>
${GROUPS.map(([cat, title]) => `    <h2>${title}</h2>\n    <table>${rows(cat)}\n    </table>`).join('\n')}
    <div class="notes">
        <strong>Good to know</strong>
        <ul>
            <li>Prices are starting points. Your final quote depends on complexity, scope and deadline.</li>
            <li>Poster printing is charged per square metre. Training is priced per trainee.</li>
            <li>Larger projects may need a deposit before work starts${TILL ? `. Pay by M-Pesa: Buy Goods Till <strong>${esc(TILL)}</strong> (Edison Ochieng)` : ', payable by M-Pesa'}.</li>
        </ul>
    </div>
</main>
<footer>
    <div><b>WhatsApp</b><br>+254 708 639 473</div>
    <div><b>Website</b><br>edisonengineer.github.io/MY-PAST-PROJECTS</div>
    <div><b>Get a quote</b><br>Use the project form on the website</div>
</footer>
</div></body></html>`;

(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);   // the website's fonts (Google Fonts)
    await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await browser.close();
    console.log('wrote ' + path.relative(ROOT, OUT));
})();
