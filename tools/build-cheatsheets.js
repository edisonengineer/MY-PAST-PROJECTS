#!/usr/bin/env node
/* =========================================================================
   Builds pdfs/solidworks-shortcuts-cheat-sheet.pdf, a free download
   (Downloads tab of the Google Sheet). Same look as the AutoCAD sheet.
   Run after editing the lists below:   node tools/build-cheatsheets.js
   Needs Playwright (npm i -g playwright) with Chromium installed.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdfs/solidworks-shortcuts-cheat-sheet.pdf');
let playwright;
try { playwright = require('playwright'); } catch (e) {
    playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// [colour, title, [[keys, what it does], ...]] (SOLIDWORKS default shortcuts)
const LEFT = [
    ['#2f6bff', 'View orientation', [
        ['Space', 'View selector / orientation'], ['Ctrl+1', 'Front'], ['Ctrl+2', 'Back'], ['Ctrl+3', 'Left'], ['Ctrl+4', 'Right'],
        ['Ctrl+5', 'Top'], ['Ctrl+6', 'Bottom'], ['Ctrl+7', 'Isometric'], ['Ctrl+8', 'Normal to selected face']]],
    ['#13a89e', 'Zoom, rotate & pan', [
        ['F', 'Zoom to fit'], ['Z', 'Zoom out'], ['Shift+Z', 'Zoom in'], ['G', 'Magnifying glass'],
        ['← → ↑ ↓', 'Rotate the view'], ['Shift+arrow', 'Rotate 90°'], ['Alt+← / →', 'Spin around the screen centre'],
        ['Ctrl+arrow', 'Pan'], ['F11', 'Full screen']]],
    ['#7457f2', 'Mouse', [
        ['Scroll', 'Zoom at the pointer'], ['Middle drag', 'Rotate'], ['Ctrl+middle', 'Pan'], ['Shift+middle', 'Zoom'],
        ['Middle ×2', 'Zoom to fit'], ['Right drag', 'Mouse gestures (quick commands)']]],
    ['#f2a20c', 'Interface', [
        ['F9', 'Show / hide the FeatureManager tree'], ['F10', 'Show / hide toolbars'], ['F5', 'Selection filter toolbar'], ['F6', 'Turn selection filters on / off'],
        ['C', 'Expand / collapse a tree branch'], ['Shift+C', 'Collapse the whole tree']]]
];
const RIGHT = [
    ['#ff6b4a', 'File & everyday', [
        ['Ctrl+N', 'New document'], ['Ctrl+O', 'Open'], ['Ctrl+S', 'Save'], ['Ctrl+P', 'Print'], ['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'],
        ['Ctrl+C / V', 'Copy / paste'], ['Ctrl+B', 'Rebuild'], ['Ctrl+Q', 'Force rebuild (everything)'], ['Ctrl+Tab', 'Next open document'],
        ['Enter', 'Repeat the last command'], ['Esc', 'Cancel / exit the tool'], ['S', 'Shortcut bar at the pointer'], ['D', 'Move the OK / cancel corner to the pointer']]],
    ['#e2457a', 'Sketching tips', [
        ['A', 'Switch line ↔ tangent arc while drawing'], ['Hold Ctrl', 'Sketch without automatic relations'], ['Ctrl+click', 'Select several entities to add a relation'],
        ['Shift+click arc', 'Dimension to the arc’s min / max point'], ['Double-click', 'End a chain of lines']]],
    ['#1fae6a', 'Assemblies', [
        ['Tab', 'Hide the component under the pointer'], ['Shift+Tab', 'Show the hidden component under the pointer'],
        ['Alt+drag', 'SmartMate: drag a face onto another'], ['Ctrl+drag', 'Copy a component'], ['Shift+click', 'Select a range in the tree']]]
];
const count = LEFT.concat(RIGHT).reduce((a, g) => a + g[2].length, 0);
const card = ([colour, title, rows]) => `<section class="card"><h2><span style="background:${colour}"></span>${esc(title)}</h2><table>${rows.map(([k, v]) =>
    `<tr><td class="k"><kbd style="background:${colour}">${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`).join('')}</table></section>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18203a; font-size: 8.6pt; background: #f6f1e7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 296.5mm; overflow: hidden; padding: 8mm; display: flex; flex-direction: column; gap: 4mm; }
header { flex: none; background: #0e1a3a; color: #fff; border-radius: 5mm; padding: 7mm 8mm; display: flex; gap: 6mm; align-items: center; position: relative; overflow: hidden; }
header::after { content: ''; position: absolute; right: -24mm; top: -26mm; width: 70mm; height: 70mm; border-radius: 50%; background: #7457f2; opacity: .35; filter: blur(8mm); }
.mark { flex: none; width: 15mm; height: 15mm; border-radius: 4mm; display: grid; place-items: center; background: linear-gradient(135deg, #ffb627, #ff6b4a); color: #0e1a3a; font: 600 16pt 'Fraunces', Georgia, serif; }
h1 { font: 600 21pt/1.08 'Fraunces', Georgia, serif; letter-spacing: -.01em; }
h1 em { font-style: normal; color: #ffb627; }
.sub { margin-top: 1.5mm; color: rgba(255,255,255,.75); }
.how { position: relative; z-index: 1; margin-left: auto; max-width: 62mm; padding: 3mm 4mm; border-radius: 3mm; background: rgba(255,255,255,.08); border: 1px solid rgba(255,182,39,.5); line-height: 1.45; }
.how b { color: #ffb627; }
main { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; align-items: start; }
.col { display: flex; flex-direction: column; gap: 3.5mm; }
.card { background: #fff; border-radius: 4mm; padding: 3mm 4mm; box-shadow: 0 1px 0 #e9e0d0; }
h2 { display: flex; align-items: center; gap: 2mm; font-size: 10pt; font-weight: 800; margin-bottom: 2mm; color: #0e1a3a; }
h2 span { width: 3mm; height: 3mm; border-radius: 50%; }
table { width: 100%; border-collapse: collapse; }
td { padding: .45mm 0; vertical-align: middle; color: #2a3250; }
td.k { width: 27mm; padding-right: 2mm; }
kbd { display: inline-block; min-width: 9mm; padding: .5mm 2mm; border-radius: 1.5mm; color: #fff; font: 700 7.6pt 'Plus Jakarta Sans', sans-serif; text-align: center; white-space: nowrap; }
footer { flex: none; display: flex; justify-content: space-between; gap: 4mm; padding: 0 2mm; font-size: 7.8pt; color: #4c5470; }
footer b { color: #0e1a3a; }
</style></head><body><div class="page">
<header>
    <span class="mark">EO</span>
    <div><h1>SolidWorks <em>Shortcuts</em> Cheat Sheet</h1><p class="sub">${count} keyboard and mouse shortcuts to model faster</p></div>
    <p class="how"><b>Tip:</b> press <b>S</b> for the shortcut bar and <b>Space</b> for views. Add your own keys in <b>Tools › Customize › Keyboard</b>.</p>
</header>
<main>
    <div class="col">${LEFT.map(card).join('')}</div>
    <div class="col">${RIGHT.map(card).join('')}</div>
</main>
<footer>
    <div><b>Edison Ochieng</b> · Nexus CAD Studio · SolidWorks, Inventor, AutoCAD &amp; Fusion 360 training</div>
    <div>WhatsApp <b>+254 708 639 473</b> · edisonengineer.github.io/MY-PAST-PROJECTS</div>
</footer>
</div></body></html>`;

(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await browser.close();
    console.log('wrote ' + path.relative(ROOT, OUT));
})();
