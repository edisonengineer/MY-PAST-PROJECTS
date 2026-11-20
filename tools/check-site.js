#!/usr/bin/env node
/* =========================================================================
   Site health check: finds broken pages, links, images, scripts, styles,
   3D models and PDFs, and checks that the Google Sheet answers.

     node tools/check-site.js                       checks the files in this folder
     node tools/check-site.js https://edisonengineer.github.io/MY-PAST-PROJECTS/
     node tools/check-site.js <url> --no-sheet      skip the Google Sheet check

   PROBLEMS (exit code 1, so the weekly GitHub check emails you):
     - a page, file or internal link that doesn't load
     - the Google Sheet not answering
   WARNINGS (listed, never fail): files the site hides until they exist
   (e.g. a project report PDF not uploaded yet), images without alt text,
   very heavy images, and project photos listed in js/projects.js but missing.
   Used by .github/workflows/site-health.yml every Monday.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const target = args.find((a) => /^https?:\/\//.test(a));
const checkSheet = !args.includes('--no-sheet');
const problems = [];
const warnings = [];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.glb': 'model/gltf-binary', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

// Serve this folder on a free local port when no URL is given
function serveLocal() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
            if (p.endsWith('/')) p += 'index.html';
            const file = path.join(ROOT, p);
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': fs.statSync(file).size });
            if (req.method === 'HEAD') return res.end();
            fs.createReadStream(file).pipe(res);
        }).listen(0, '127.0.0.1', () => resolve({ server, base: 'http://127.0.0.1:' + server.address().port + '/' }));
    });
}

async function get(url, method = 'GET', tries = 2) {
    for (let i = 1; ; i++) {
        try {
            const r = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'site-health-check' } });
            return r;
        } catch (err) {
            if (i >= tries) return { ok: false, status: 0, error: err.message };
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
}

const decode = (t) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Every reference in a page: <a href>, <link href>, <script src>, <img src/srcset>, model-viewer src, og:image
function refs(html) {
    const out = [];
    const tagRe = /<(a|link|script|img|source|model-viewer|meta|iframe)\b([^>]*)>/gi;
    let m;
    while ((m = tagRe.exec(html))) {
        const tag = m[1].toLowerCase(), attrs = m[2];
        const attr = (n) => { const x = new RegExp('\\s' + n + '="([^"]*)"', 'i').exec(attrs); return x ? decode(x[1]) : null; };
        // Elements the site shows only once their file exists (hidden + data-needs-file / data-if-pdf)
        const optional = /\shidden\b/.test(attrs) || /\sdata-(needs-file|if-pdf)\b/.test(attrs);
        const add = (u, kind) => { if (u) out.push({ url: u.trim(), kind, tag, optional, alt: attr('alt') }); };
        if (tag === 'a') add(attr('href'), 'link');
        else if (tag === 'link' && !/preconnect|dns-prefetch|alternate|canonical/i.test(attr('rel') || '')) add(attr('href'), 'asset');
        else if (tag === 'script' || tag === 'img' || tag === 'model-viewer' || tag === 'iframe') add(attr('src'), 'asset');
        else if (tag === 'meta' && /og:image$|twitter:image$/i.test(attr('property') || attr('name') || '')) add(attr('content'), 'asset');
        if ((tag === 'img' || tag === 'source') && attr('srcset')) attr('srcset').split(',').forEach((s) => add(s.trim().split(/\s+/)[0], 'asset'));
        if (tag === 'img' && attr('alt') === null && !/aria-hidden="true"/.test(attrs)) out.push({ url: attr('src'), kind: 'no-alt', tag, optional: true });
    }
    // data-* attributes that hold file paths (e.g. language dictionaries)
    for (const d of html.matchAll(/\sdata-(?:fr|sw|fr-sheet|sw-sheet)="([^"]+)"/g)) out.push({ url: decode(d[1]), kind: 'asset', tag: 'script', optional: false });
    return out;
}

async function main() {
    let local = null, base = target;
    if (!base) { local = await serveLocal(); base = local.base; }
    if (!base.endsWith('/')) base += '/';
    const origin = new URL(base).origin;
    const inside = (u) => u.startsWith(base) || u === base.slice(0, -1);
    console.log('Checking ' + (target || 'the local files') + ' ...');

    const status = new Map();          // url -> status code (0 = network error)
    const pages = [base];
    const seen = new Set([base]);
    try {
        const sm = await get(base + 'sitemap.xml');
        const locs = sm.ok ? [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]) : [];
        // The sitemap lists the published addresses: map them onto the site being checked (e.g. a local copy)
        const root = locs.reduce((r, u) => (u.length < r.length ? u : r), locs[0] || '').replace(/[^/]*$/, '');
        for (const loc of locs) {
            const u = root && loc.startsWith(root) ? base + loc.slice(root.length) : loc;
            if (!seen.has(u)) { seen.add(u); pages.push(u); }
        }
    } catch (e) { /* no sitemap: just crawl from the home page */ }

    const pending = [];                  // { url, from, optional, kind }
    for (let i = 0; i < pages.length; i++) {
        const pageUrl = pages[i];
        const r = await get(pageUrl);
        status.set(pageUrl.split('#')[0], r.status);
        if (!r.ok) { problems.push('Page does not load (' + (r.status || r.error) + '): ' + pageUrl); continue; }
        if (!/html/.test(r.headers.get('content-type') || '')) continue;
        const html = await r.text();
        for (const ref of refs(html)) {
            if (!ref.url || /^(mailto:|tel:|javascript:|data:|#)/i.test(ref.url)) continue;
            let abs;
            try { abs = new URL(ref.url, pageUrl).href; } catch (e) { problems.push('Bad address "' + ref.url + '" on ' + pageUrl); continue; }
            if (ref.kind === 'no-alt') { warnings.push('Image without alt text on ' + pageUrl.replace(base, '') + ': ' + ref.url); continue; }
            if (new URL(abs).origin !== origin || !inside(abs)) continue;          // external sites aren't checked (they change on their own)
            const clean = abs.split('#')[0];
            const noQuery = clean.split('?')[0];
            if (ref.kind === 'link' && /\.html?$|\/$/.test(noQuery) && !seen.has(noQuery)) { seen.add(noQuery); pages.push(noQuery); }
            pending.push({ url: clean, from: pageUrl, optional: ref.optional });
        }
    }

    // Check every distinct file once (in small parallel batches)
    const unique = [...new Set(pending.map((p) => p.url))].filter((u) => !status.has(u));
    for (let i = 0; i < unique.length; i += 8) {
        await Promise.all(unique.slice(i, i + 8).map(async (u) => {
            let r = await get(u, 'HEAD');
            if (r.status === 405 || r.status === 0) r = await get(u);
            status.set(u, r.status);
            const size = Number(r.headers && r.headers.get && r.headers.get('content-length')) || 0;
            if (r.ok && /\.(jpe?g|png|webp)$/i.test(u.split('?')[0]) && size > 600 * 1024) warnings.push('Heavy image (' + Math.round(size / 1024) + ' KB): ' + u.replace(base, ''));
        }));
    }
    const reported = new Set();
    for (const p of pending) {
        const s = status.get(p.url);
        if (s >= 200 && s < 400) continue;
        const key = p.url + (p.optional ? '?' : '');
        if (reported.has(key)) continue;
        reported.add(key);
        const msg = '(' + (s || 'no response') + ') ' + p.url.replace(base, '') + '  on ' + (p.from.replace(base, '') || 'home page');
        (p.optional ? warnings : problems).push((p.optional ? 'Not uploaded yet, hidden on the site ' : 'Broken ') + msg);
    }

    // Project photos and models listed in the data files (cards are built by JavaScript, so they aren't in the HTML above)
    try {
        const ctx = { window: {} };
        for (const f of ['js/projects.js', 'js/sheet-works.js']) {
            const r = await get(base + f);
            if (r.ok) vm.runInNewContext(await r.text(), ctx);
        }
        const files = new Set();
        (ctx.window.PROJECTS || []).forEach((p) => [p.cover].concat(p.gallery || [], p.model ? [p.model] : []).filter(Boolean).forEach((f) => files.add(f)));
        for (const f of files) {
            const r = await get(base + f, 'HEAD');
            if (!r.ok) warnings.push('Project file listed but missing (the site shows a colour cover instead): ' + f);
        }
        // Certificate images (the "View" button appears once the file exists)
        const cc = { window: {} };
        for (const f of ['js/certificates.js', 'js/sheet-data.js']) { const r = await get(base + f); if (r.ok) vm.runInNewContext(await r.text(), cc); }
        for (const c of cc.window.CERTIFICATES || []) {
            if (!c.file) continue;
            const r = await get(base + c.file, 'HEAD');
            if (!r.ok) warnings.push('Certificate image not uploaded yet: ' + c.file + ' (' + c.title + ')');
        }
    } catch (e) { warnings.push('Could not read the project list: ' + e.message); }

    // The Google Sheet (reviews, availability, campaign popup, forms) must answer
    if (checkSheet) {
        try {
            const cfgR = await get(base + 'js/config.js');
            const ctx = { window: {} };
            vm.runInNewContext(await cfgR.text(), ctx);
            const api = (ctx.window.SITE_CONFIG || {}).trackerApi || (ctx.window.SITE_CONFIG || {}).reviewsApi;
            if (api) {
                const r = await get(api + (api.includes('?') ? '&' : '?') + 'action=settings', 'GET', 3);
                let okJson = false;
                try { okJson = r.ok && typeof (await r.json()) === 'object'; } catch (e) { /* not JSON */ }
                if (!okJson) problems.push('The Google Sheet did not answer (' + (r.status || r.error) + '). Reviews, the campaign popup and the forms\' sheet features need it: open Apps Script and check the latest deployment.');
            }
        } catch (e) { problems.push('Could not check the Google Sheet: ' + e.message); }
    }

    if (local) local.server.close();
    console.log('\n' + pages.length + ' pages and ' + status.size + ' files checked.');
    if (warnings.length) console.log('\nWarnings (' + warnings.length + '):\n  - ' + [...new Set(warnings)].join('\n  - '));
    if (problems.length) {
        console.log('\nPROBLEMS (' + problems.length + '):\n  - ' + [...new Set(problems)].join('\n  - '));
        process.exit(1);
    }
    console.log('\nNo problems found.');
}

main().catch((err) => { console.error(err); process.exit(1); });
