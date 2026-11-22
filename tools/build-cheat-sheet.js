#!/usr/bin/env node
/* =========================================================================
   Makes the free CSWP cheat sheet files from downloads/cswp-cheat-sheet.html
   (built by tools/build-pages.js from content/cswp-cheat-sheet.html):
     pdfs/cswp-cheat-sheet.pdf              the download (A4)
     images/cswp-cheat-sheet-preview.jpg    the small page-1 preview on the sign-up card
   Run after changing the cheat sheet:  node tools/build-pages.js && node tools/build-cheat-sheet.js
   (needs Playwright with Chromium)
   ========================================================================= */
'use strict';

const path = require('path');
const fs = require('fs');

function loadPlaywright() {
    try { return require('playwright'); } catch (e) {
        return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
    }
}

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'downloads', 'cswp-cheat-sheet.html');

(async () => {
    if (!fs.existsSync(PAGE)) throw new Error('Run node tools/build-pages.js first (downloads/cswp-cheat-sheet.html is missing).');
    const browser = await loadPlaywright().chromium.launch();
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto('file://' + PAGE, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(path.join(ROOT, 'pdfs', 'cswp-cheat-sheet.pdf'), pdf);
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log('wrote pdfs/cswp-cheat-sheet.pdf (' + Math.round(pdf.length / 1024) + ' KB, ' + pages + ' page' + (pages === 1 ? '' : 's') + ')');
    // Preview of page 1, the shape of an A4 sheet (320 × 453)
    const shot = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 320 / 794 });
    await shot.goto('file://' + PAGE, { waitUntil: 'load' });
    await shot.evaluate(() => document.fonts.ready);
    await shot.emulateMedia({ media: 'print' });
    await shot.addStyleTag({ content: 'body { padding: 38px; background: #fff; }' });
    await shot.screenshot({ path: path.join(ROOT, 'images', 'cswp-cheat-sheet-preview.jpg'), type: 'jpeg', quality: 78, clip: { x: 0, y: 0, width: 794, height: 1123 } });
    console.log('wrote images/cswp-cheat-sheet-preview.jpg');
    await browser.close();
    if (pages > 2) { console.error('The cheat sheet runs to ' + pages + ' pages; shorten it to 2.'); process.exitCode = 1; }
})().catch((err) => { console.error(err); process.exit(1); });
