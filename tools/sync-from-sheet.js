#!/usr/bin/env node
/* =========================================================================
   Publishes the Articles and Works tabs of the Google Sheet to the website.
   Run by .github/workflows/sync-sheet.yml every 30 minutes (or by hand:
   node tools/sync-from-sheet.js).

   Articles → content/blog/<web-address>.html   (+ photos in images/blog/<web-address>/)
   Works    → js/sheet-works.js                   (+ photos in images/works/<web-address>/)

   Only rows marked "Published" are ever sent by the sheet. Files this script
   created are listed in content/sheet-manifest.json, so it can remove them
   again when a row goes back to "Draft". It never touches anything else.
   New photo paths are written to the file given as the first argument, so
   tools/optimize-images.py can shrink them.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const abs = (p) => path.join(ROOT, p);
const MANIFEST = 'content/sheet-manifest.json';
const WORKS_JS = 'js/sheet-works.js';
const THEMES = ['teal', 'blue', 'sun', 'coral', 'violet', 'rose', 'green'];
const newImages = [];

const cfg = (() => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(abs('js/config.js'), 'utf8'), c); return c.window.SITE_CONFIG || {}; })();
const API = process.env.SHEET_API || cfg.trackerApi || cfg.reviewsApi;   // SHEET_API: for testing
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeSlug = (s) => /^[a-z0-9][a-z0-9-]{0,80}$/.test(String(s || ''));
const theme = (slug) => THEMES[[...slug].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % THEMES.length];
const short = (id) => String(id || '').replace(/[^\w-]/g, '').slice(0, 8);

async function get(params, tries = 3) {
    const url = API + (API.includes('?') ? '&' : '?') + new URLSearchParams(params).toString();
    for (let i = 1; ; i++) {
        try {
            const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            if (i >= tries) throw err;
            await new Promise((r) => setTimeout(r, 3000 * i));
        }
    }
}

// Downloads a photo through the sheet's script (only works for Published items) unless it's already saved
async function photo(rel, params) {
    if (fs.existsSync(abs(rel))) return true;
    const r = await get(Object.assign({ action: 'image' }, params));
    if (!r || !r.ok || !r.data) { console.warn('  ! photo not available:', rel); return false; }
    fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
    fs.writeFileSync(abs(rel), Buffer.from(r.data, 'base64'));
    newImages.push(rel);
    console.log('  + photo', rel);
    return true;
}

// Removes files in a folder that are no longer used (only inside folders this script owns)
function prune(dir, keep) {
    if (!fs.existsSync(abs(dir))) return;
    fs.readdirSync(abs(dir)).forEach((f) => {
        const rel = dir + '/' + f;
        const base = rel.replace(/-800(\.\w+)$/, '$1');
        if (!keep.has(rel) && !keep.has(base)) { fs.rmSync(abs(rel)); console.log('  - removed', rel); }
    });
}

// Keep only simple, safe markup from the Doc
function sanitize(html) {
    return String(html || '')
        .replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (m, close, tag, attrs) => {
            tag = tag.toLowerCase();
            if (!['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'a'].includes(tag)) return '';
            if (close) return '</' + tag + '>';
            if (tag === 'a') {
                const href = /href="([^"]*)"/i.exec(attrs);
                return href && /^(https?:|mailto:)/i.test(href[1].replace(/&amp;/g, '&')) ? '<a href="' + href[1] + '" target="_blank" rel="noopener">' : '<a>';
            }
            return '<' + tag + '>';
        });
}

async function main() {
    if (!API) { console.log('No Google Sheet link in js/config.js: nothing to sync.'); return; }
    const manifest = fs.existsSync(abs(MANIFEST)) ? JSON.parse(fs.readFileSync(abs(MANIFEST), 'utf8')) : { articles: [], works: [] };
    let data;
    try {
        data = await get({ action: 'content' });
    } catch (err) {
        console.log('The Google Sheet could not be reached (' + err.message + '). Nothing changed; will try again next time.');
        return;
    }
    if (!data || !Array.isArray(data.articles) || !Array.isArray(data.works)) {
        console.log('The sheet script is an older version without Articles/Works. Update it (tools/google-sheet-script.gs).');
        return;
    }

    /* ---------- Articles ---------- */
    const ownPosts = new Set(manifest.articles || []);
    const doneArticles = [];
    for (const a of data.articles) {
        if (!safeSlug(a.slug) || !a.title) continue;
        const file = 'content/blog/' + a.slug + '.html';
        if (fs.existsSync(abs(file)) && !ownPosts.has(a.slug)) { console.warn('! "' + a.title + '": an article called ' + a.slug + ' already exists; skipped.'); continue; }
        if (a.error) console.warn('! "' + a.title + '": ' + a.error);
        if (!a.html) { console.warn('! "' + a.title + '": the Google Doc is empty or not readable; skipped.'); continue; }
        console.log('Article:', a.title);
        const dir = 'images/blog/' + a.slug;
        const keep = new Set();
        let cover = '';
        if (a.cover && a.cover.id) {
            const rel = dir + '/cover-' + short(a.cover.id) + '-' + a.cover.v + '.jpg';
            if (await photo(rel, { id: a.cover.id })) { cover = rel; keep.add(rel); }
        }
        const imgs = [];
        for (let n = 0; n < (a.images || []).length; n++) {
            const rel = dir + '/photo-' + String(a.images[n]).replace(/[^a-f0-9]/g, '') + '.jpg';
            imgs[n] = (await photo(rel, { doc: a.doc, n })) ? rel : '';
            if (imgs[n]) keep.add(rel);
        }
        let body = sanitize(a.html);
        body = body.replace(/^(?:\{\{IMG:\d+\}\}\s*)+$/gm, (line) => line.replace(/\{\{IMG:(\d+)\}\}/g, (m, n) =>
            imgs[n] ? '<figure><img src="../' + imgs[n] + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async"></figure>' : ''));
        body = body.replace(/\{\{IMG:(\d+)\}\}/g, (m, n) => imgs[n] ? '<img src="../' + imgs[n] + '" alt="' + esc(a.title) + '" loading="lazy" decoding="async">' : '');
        const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const description = a.summary || (text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, '') + '…' : text);
        const meta = {
            title: a.title,
            description,
            date: /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : new Date().toISOString().slice(0, 10),
            tags: (a.tags || []).slice(0, 6),
            theme: theme(a.slug),
            icon: 'doc',
            source: 'Google Sheet (Articles tab): edit it there, not here'
        };
        const card = cover || imgs.find(Boolean);
        if (card) meta.image = card;
        const html = '<!--' + JSON.stringify(meta, null, 2) + '-->\n' + body.split(/\n+/).filter(Boolean).join('\n\n') + '\n';
        if (!fs.existsSync(abs(file)) || fs.readFileSync(abs(file), 'utf8') !== html) { fs.writeFileSync(abs(file), html); console.log('  wrote', file); }
        prune(dir, keep);
        doneArticles.push(a.slug);
    }
    for (const slug of ownPosts) {
        if (doneArticles.includes(slug) || !safeSlug(slug)) continue;
        // Back to Draft (or deleted): take it down, unless the sheet just failed to read it this time
        if (data.articles.some((a) => a.slug === slug)) { doneArticles.push(slug); continue; }
        for (const f of ['content/blog/' + slug + '.html', 'blog/' + slug + '.html']) if (fs.existsSync(abs(f))) { fs.rmSync(abs(f)); console.log('- removed', f); }
        if (fs.existsSync(abs('images/blog/' + slug))) fs.rmSync(abs('images/blog/' + slug), { recursive: true });
    }

    /* ---------- Works ---------- */
    const ownWorks = new Set(manifest.works || []);
    const handIds = (() => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(abs('js/projects.js'), 'utf8'), c); return new Set((c.window.PROJECTS || []).map((p) => p.id)); })();
    const works = [];
    for (const w of data.works) {
        if (!safeSlug(w.slug) || !w.title) continue;
        if (handIds.has(w.slug)) { console.warn('! "' + w.title + '": a project called ' + w.slug + ' already exists; skipped.'); continue; }
        if (w.error) console.warn('! "' + w.title + '": ' + w.error);
        console.log('Work:', w.title);
        const dir = 'images/works/' + w.slug;
        const keep = new Set();
        const gallery = [];
        let k = 1;
        for (const ph of w.photos || []) {
            const rel = dir + '/' + String(k).padStart(2, '0') + '-' + short(ph.id) + '-' + ph.v + '.jpg';
            if (await photo(rel, { id: ph.id })) { gallery.push(rel); keep.add(rel); k++; }
        }
        prune(dir, keep);
        const graphic = w.category === 'graphic';
        works.push({
            id: w.slug,
            title: w.title,
            subtitle: w.subtitle || (graphic ? 'Graphic design' : 'Engineering design'),
            category: graphic ? 'graphic' : 'engineering',
            theme: theme(w.slug),
            icon: graphic ? 'brush' : 'cube',
            year: w.year || '',
            cover: gallery[0] || '',
            gallery,
            summary: w.summary || '',
            points: (w.points || []).slice(0, 10),
            meta: [['Category', graphic ? 'Graphic design' : 'Engineering design']].concat(w.year ? [['Year', w.year]] : []),
            tags: (w.tags || []).slice(0, 8),
            pdf: null
        });
    }
    for (const slug of ownWorks) {
        if (works.some((w) => w.id === slug) || !safeSlug(slug)) continue;
        if (fs.existsSync(abs('projects/' + slug + '.html'))) { fs.rmSync(abs('projects/' + slug + '.html')); console.log('- removed projects/' + slug + '.html'); }
        if (fs.existsSync(abs('images/works/' + slug))) fs.rmSync(abs('images/works/' + slug), { recursive: true });
    }
    const js = '/* Generated from the Works tab of the Google Sheet by tools/sync-from-sheet.js: edit the sheet, not this file. */\n' +
        'window.PROJECTS = (window.PROJECTS || []).concat(' + JSON.stringify(works, null, 2) + ');\n';
    if (!fs.existsSync(abs(WORKS_JS)) || fs.readFileSync(abs(WORKS_JS), 'utf8') !== js) { fs.writeFileSync(abs(WORKS_JS), js); console.log('wrote', WORKS_JS); }

    const next = JSON.stringify({ articles: doneArticles.sort(), works: works.map((w) => w.id).sort() }, null, 2) + '\n';
    if (!fs.existsSync(abs(MANIFEST)) || fs.readFileSync(abs(MANIFEST), 'utf8') !== next) fs.writeFileSync(abs(MANIFEST), next);
    if (process.argv[2]) fs.writeFileSync(process.argv[2], newImages.join('\n') + (newImages.length ? '\n' : ''));
    console.log('Done: ' + doneArticles.length + ' article(s), ' + works.length + ' work(s) from the sheet; ' + newImages.length + ' new photo(s).');
}

main().catch((err) => { console.error(err); process.exit(1); });
