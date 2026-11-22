/* =========================================================================
   CV import for the CV tailor: reads a CV from a Word file (.docx), a PDF
   or pasted text, and sorts it into a "raw" CV (see normalizeMaster in
   js/cv-tailor-core.js): contact details, profile, roles with their
   bullets, projects, education, skills, certificates, languages.

   Everything happens in the visitor's browser: the file is never uploaded.
   Only the checked CV is saved to their account, when they choose to.

   Reading CVs is guesswork (every template is different), so the page
   always shows the result in an editor to check before it is used.

   No page code here, so the sorting can be tested in Node:
     node tools/test-cv-tailor.js
   ========================================================================= */
(function (root) {
    'use strict';

    const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';            // same copy as js/pdf-viewer.js
    const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const MAX_BYTES = 10 * 1024 * 1024;

    /* ---------------- Word (.docx): a zip with word/document.xml inside ---------------- */
    async function unzipText(buf, name) {
        const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        let eocd = -1;
        for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        if (eocd < 0) throw new Error('not-docx');
        const count = dv.getUint16(eocd + 10, true);
        let off = dv.getUint32(eocd + 16, true);
        for (let k = 0; k < count && off + 46 <= u8.length; k++) {
            if (dv.getUint32(off, true) !== 0x02014b50) break;
            const method = dv.getUint16(off + 10, true), size = dv.getUint32(off + 20, true);
            const nlen = dv.getUint16(off + 28, true), xlen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true), local = dv.getUint32(off + 42, true);
            const fname = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nlen));
            if (fname === name) {
                const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
                const data = u8.subarray(start, start + size);
                if (method === 0) return new TextDecoder().decode(data);
                if (method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('old-browser');
                const out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
                return new TextDecoder().decode(out);
            }
            off += 46 + nlen + xlen + clen;
        }
        throw new Error('not-docx');
    }
    const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    const decodeXml = (t) => t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e.toLowerCase()] != null ? ENT[e.toLowerCase()] : m));
    // document.xml → lines { text, bullet, heading }
    function docxLines(xml) {
        // Text boxes hold paragraphs inside paragraphs: take them out, and read each where it sits
        const boxes = [];
        xml = xml.replace(/<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/g, (m, inner) => '<w:boxref n="' + (boxes.push(inner) - 1) + '"/>');
        const out = [];
        const read = (chunk, depth) => {
            for (const m of chunk.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)) {
                const p = m[0];
                if (depth < 3) for (const b of p.matchAll(/<w:boxref n="(\d+)"\/>/g)) read(boxes[Number(b[1])] || '', depth + 1);
                const style = (p.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || '';
                let text = '';
                for (const t of p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br[^>]*\/>|<w:cr\/>/g)) {
                    if (t[1] != null) text += decodeXml(t[1]);
                    else if (/<w:tab/.test(t[0])) text += '\t';
                    else text += '\n';
                }
                const bold = /<w:b\/>|<w:b w:val="(?:1|true)"\/>/.test(p) && !/<w:b w:val="(?:0|false)"\/>/.test(p);
                const bullet = /<w:numPr>/.test(p) || /list/i.test(style);
                const heading = /heading|title/i.test(style);
                text.split('\n').forEach((piece, i) => { if (piece.trim()) out.push({ text: piece, bullet: bullet && i === 0, heading: heading || (bold && piece.trim().length < 45 && !/[.]$/.test(piece.trim())) }); });
            }
        };
        read(xml, 0);
        return out;
    }

    /* ---------------- PDF: text with positions (pdf.js), put back into lines ---------------- */
    function loadPdfJs() {
        if (root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = PDFJS;
            s.onload = () => { if (!root.pdfjsLib) return reject(new Error('pdf-load')); root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; resolve(root.pdfjsLib); };
            s.onerror = () => reject(new Error('pdf-load'));
            document.head.appendChild(s);
        });
    }
    async function pdfLines(buf, lib) {
        const pdf = await lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
        const all = [];
        const sizes = [];
        for (let n = 1; n <= Math.min(pdf.numPages, 8); n++) {
            const page = await pdf.getPage(n);
            const tc = await page.getTextContent();
            const items = tc.items.filter((it) => it.str != null).map((it) => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0, h: Math.abs(it.transform[3]) || it.height || 10, bold: /bold|black|heavy|semibold/i.test((tc.styles[it.fontName] || {}).fontFamily || it.fontName || '') }));
            items.forEach((it) => { if (it.s.trim()) sizes.push(it.h); });
            all.push(rowsOf(items));
        }
        sizes.sort((a, b) => a - b);
        const body = sizes[Math.floor(sizes.length / 2)] || 10;
        const out = [];
        all.forEach((rows) => rows.forEach((r) => out.push({ text: r.text, bullet: false, heading: r.h > body * 1.15 || (r.bold && r.text.length < 45) })));
        return out;
    }
    // Items on (about) the same baseline make a line; sidebars (two columns) are read column by column
    function rowsOf(items) {
        const live = items.filter((it) => it.s.trim() || it.w > 0);
        if (!live.length) return [];
        const xs = live.filter((it) => it.s.trim()).map((it) => it.x);
        const pageW = Math.max(...live.map((it) => it.x + it.w), 1);
        // A clear vertical gap shared by most lines = two columns
        let split = null;
        for (let cut = pageW * 0.22; cut <= pageW * 0.5; cut += pageW * 0.01) {
            const crossing = live.filter((it) => it.s.trim() && it.x < cut && it.x + it.w > cut + 2).length;
            const left = xs.filter((x) => x < cut).length, right = xs.filter((x) => x >= cut).length;
            if (!crossing && left > 6 && right > 6) { split = cut; break; }
        }
        const groups = split ? [live.filter((it) => it.x < split), live.filter((it) => it.x >= split)] : [live];
        const rows = [];
        groups.forEach((g) => {
            const sorted = g.slice().sort((a, b) => b.y - a.y || a.x - b.x);
            let cur = null;
            sorted.forEach((it) => {
                if (cur && Math.abs(cur.y - it.y) <= Math.max(2, it.h * 0.35)) cur.items.push(it);
                else { cur = { y: it.y, items: [it] }; rows.push(cur); }
            });
        });
        return rows.map((r) => {
            const its = r.items.sort((a, b) => a.x - b.x);
            let text = '', end = null;
            its.forEach((it) => {
                if (end != null && it.x - end > it.h * 0.25 && !/\s$/.test(text) && !/^\s/.test(it.s)) text += it.x - end > it.h * 3 ? '\t' : ' ';
                text += it.s;
                end = it.x + it.w;
            });
            return { text: text.replace(/\s+$/, ''), h: Math.max(...its.map((i) => i.h)), bold: its.every((i) => i.bold || !i.s.trim()) };
        }).filter((r) => r.text.trim());
    }

    /* ---------------- pasted text ---------------- */
    function textLines(text) {
        return String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim()).map((l) => ({ text: l, bullet: false, heading: false }));
    }

    /* ---------------- sorting lines into a CV ---------------- */
    const BULLET = /^\s*(?:[•●○◦▪▫■□◆◇►▶➢➤✓✔·*‣⁃▪-]|–|—|\d{1,2}[.)])\s+/;
    const SECTIONS = [
        ['skip', /^(?:referees?|references?|hobbies|interests|hobbies (?:and|&) interests|personal (?:details|information|data)|contact(?: details| information| me)?|declaration)$/],
        ['summary', /^(?:(?:professional|career|personal|executive)\s+)?(?:summary|profile|objective|statement)$|^about(?: me)?$|^career objective$|^personal statement$/],
        ['experience', /experience|employment|work history|career history|internships?|attachments?|positions? (?:held|of responsibility)|leadership(?: roles?)?|volunteer(?:ing)?/],
        ['projects', /projects?|portfolio|selected work/],
        ['education', /education|academic|qualifications?$|schooling|studies/],
        ['certificates', /certific|licen[cs]es?|awards?|honou?rs|achievements|accomplishments|courses|trainings?/],
        ['skills', /skills|competenc|proficienc|software|tools|expertise|strengths|technolog/],
        ['languages', /^languages?(?: spoken)?$/],
        ['memberships', /membership|affiliation|associations|professional bodies|societies/]
    ];
    const MON = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
    const DATE = new RegExp('(?:(?:' + MON + '\\s*)?(?:\\d{1,2}[/.-])?(?:19|20)\\d{2}|' + MON + ')\\s*(?:[-–—]|to|until)\\s*(?:(?:' + MON + '\\s*)?(?:\\d{1,2}[/.-])?(?:19|20)\\d{2}|present|current|now|date|ongoing)|(?:' + MON + '\\s*)?(?:19|20)\\d{2}(?:\\s*\\([^)]{1,20}\\))?', 'i');
    const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
    const URL = /(?:https?:\/\/|www\.)[^\s|,;]+|(?:linkedin\.com|github\.com|behance\.net)\/[^\s|,;]+/i;

    const tidy = (t) => String(t || '').replace(/\t+/g, ' | ').replace(/\s+/g, ' ').replace(/^[\s|,;:–—-]+|[\s|,;:–—-]+$/g, '').trim();
    function sectionOf(line) {
        const raw = tidy(line.text.replace(BULLET, ''));
        const t = raw.toLowerCase().replace(/[:：]\s*$/, '').replace(/&/g, 'and').trim();
        if (!t || t.length > 42 || /\d{3}/.test(t) || /[.!?]$/.test(raw)) return null;
        const words = t.split(/\s+/).length;
        if (words > 5) return null;
        const looksHead = line.heading || raw === raw.toUpperCase() || /:\s*$/.test(line.text) || words <= 3;
        if (!looksHead) return null;
        const hit = SECTIONS.find(([, re]) => re.test(t));
        return hit ? hit[0] : null;
    }
    // "Skills: SolidWorks, AutoCAD" → heading + content on one line
    function inlineSection(line) {
        const m = tidy(line.text).match(/^([A-Za-z &/]{3,32}):\s+(.{3,})$/);
        if (!m) return null;
        const sec = sectionOf({ text: m[1], heading: true });
        return sec ? { sec, rest: m[2] } : null;
    }

    function splitDates(text) {
        const m = text.match(DATE);
        if (!m) return { text: tidy(text), dates: '' };
        return { text: tidy(text.replace(m[0], ' ').replace(/\(\s*\)/g, ' ')), dates: tidy(m[0]) };
    }
    const parts = (t) => tidy(t).split(/\s+[|•·–—]\s+|\s+-\s+|\s*\|\s*|\t+|\s{3,}/).map(tidy).filter(Boolean);

    // A block of lines (one section) → entries of { head: [lines], points: [], body: [] }
    function entries(lines, longIsPoint, startsNew) {
        const out = [];
        let cur = null;
        const start = () => { cur = { head: [], points: [], body: [] }; out.push(cur); };
        lines.forEach((ln) => {
            const isB = ln.bullet || BULLET.test(ln.text);
            const text = tidy(ln.text.replace(BULLET, ''));
            if (!text) return;
            const sentence = text.length > 90 || (/[.;]$/.test(text) && text.split(/\s+/).length >= 7);
            if (isB) { if (!cur) start(); cur.points.push(text); return; }
            // A line that is only dates belongs to the entry being read; a line after dates that isn't a heading is its description
            if (cur && !cur.points.length && !cur.body.length && splitDates(text).text === '') { cur.head.push(text); return; }
            if (sentence) { if (!cur) start(); (longIsPoint ? cur.points : cur.body).push(text); return; }
            // A second date (or a second degree) means a new entry has begun
            const dated = (t) => !!splitDates(t).dates;
            if (!cur || cur.points.length || cur.body.length || cur.head.length >= 3 || (dated(text) && cur.head.some(dated)) || (startsNew && startsNew(text, cur))) start();
            cur.head.push(text);
        });
        return out.filter((e) => e.head.length || e.points.length || e.body.length);
    }
    function roleOrg(head) {
        let dates = '';
        const bits = [];
        head.forEach((h) => { const d = splitDates(h); if (d.dates && !dates) dates = d.dates; else if (d.dates) d.text = tidy(h); bits.push(...parts(d.text)); });
        let role = bits[0] || '', org = bits.slice(1).join(', ');
        if (!org && / at /i.test(role)) { const k = role.search(/ at /i); org = role.slice(k + 4); role = role.slice(0, k); }
        if (!org && role.includes(',')) { const k = role.indexOf(','); org = role.slice(k + 1); role = role.slice(0, k); }
        return { role: tidy(role), org: tidy(org), dates };
    }

    function parse(lines) {
        const warnings = [];
        const raw = { person: { name: '', title: '', tagline: '', location: '', phone: '', email: '', linkedin: '', website: '', portfolio: '' }, summary: '',
            experience: [], projects: [], education: [], skills: [], certificates: [], languages: [], memberships: [] };
        const blocks = { header: [] };
        let sec = 'header';
        let found = 0;
        lines.forEach((ln) => {
            if (!tidy(ln.text)) return;
            const s = sectionOf(ln);
            if (s) { sec = s; found++; blocks[sec] = blocks[sec] || []; return; }
            const inl = inlineSection(ln);
            if (inl && inl.sec !== 'summary') { found++; (blocks[inl.sec] = blocks[inl.sec] || []).push({ text: inl.rest, bullet: false }); sec = inl.sec; return; }
            (blocks[sec] = blocks[sec] || []).push(ln);
        });
        if (!found) warnings.push('No section headings were found (like "Experience" or "Education"), so most of the text is in your profile. Move each part to the right place below.');

        // Contact details: anywhere in the header (or the whole CV for email / phone / links)
        // Links and addresses that a PDF wrapped onto the next line ("…amina-kamau-" / "eng") are joined again
        const allText = lines.map((l) => l.text).join('\n').replace(/([\w.%+/-]*(?:linkedin\.com|github\.com|@|www\.|https?:\/\/)[\w.%+/@-]*-)\n([a-z0-9][\w.%+/-]*)/gi, '$1$2');
        const email = allText.match(EMAIL);
        if (email) raw.person.email = email[0];
        const urls = (allText.match(new RegExp(URL.source, 'gi')) || []).map((u) => u.replace(/[).]+$/, ''));
        const li = urls.find((u) => /linkedin\.com/i.test(u));
        if (li) raw.person.linkedin = /^https?:/i.test(li) ? li : 'https://' + li.replace(/^www\./i, 'www.');
        const site = urls.find((u) => !/linkedin\.com/i.test(u) && !EMAIL.test(u));
        if (site) raw.person.website = /^https?:/i.test(site) ? site : 'https://' + site;
        const headerLines = blocks.header || [];
        const phoneLine = headerLines.map((l) => l.text).join(' | ').match(PHONE) || allText.match(PHONE);
        if (phoneLine) raw.person.phone = tidy(phoneLine[0]);
        const rest = [];
        headerLines.forEach((ln) => {
            parts(ln.text).forEach((p) => {
                const clean = tidy(p.replace(EMAIL, '').replace(new RegExp(URL.source, 'gi'), '').replace(PHONE, '').replace(/^(?:e-?mail|phone|tel|mobile|cell|linkedin|website|address|location)\s*[:.]?\s*/i, ''));
                if (clean && !/^[|,·•\s]+$/.test(clean)) rest.push({ text: clean, heading: ln.heading });
            });
        });
        const isNameLike = (t) => /^[A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+){1,4}$/.test(t) && !/\b(?:cv|curriculum|resume|résumé|vitae)\b/i.test(t) && t.length <= 50;
        const ni = rest.findIndex((r) => isNameLike(r.text));
        if (ni >= 0) {
            const n = rest.splice(ni, 1)[0].text;
            raw.person.name = n === n.toUpperCase() ? n.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : n;
        }
        const loc = rest.findIndex((r) => /,/.test(r.text) && r.text.length <= 60 && !/\d{3}/.test(r.text) && r.text.split(/\s+/).length <= 6 || /\b(?:kenya|uganda|tanzania|rwanda|nigeria|ghana|south africa|nairobi|mombasa|kisumu|nakuru|eldoret|kampala|dar es salaam|kigali|lagos|accra)\b/i.test(r.text) && r.text.length <= 60);
        if (loc >= 0) raw.person.location = rest.splice(loc, 1)[0].text;
        const title = rest.findIndex((r) => r.text.length <= 90 && r.text.split(/\s+/).length <= 10 && !/[.]$/.test(r.text));
        if (title >= 0) raw.person.title = rest.splice(title, 1)[0].text;
        const longHeader = rest.filter((r) => r.text.length > 80).map((r) => r.text);
        if (blocks.summary) raw.summary = tidy(blocks.summary.map((l) => tidy(l.text.replace(BULLET, ''))).join(' '));
        if (!raw.summary && longHeader.length) raw.summary = tidy(longHeader.join(' '));

        // Experience & projects
        entries(blocks.experience || [], true).forEach((e) => {
            const h = roleOrg(e.head);
            raw.experience.push({ role: h.role, org: h.org, dates: h.dates, points: e.points.concat(e.body) });
        });
        entries(blocks.projects || [], false).forEach((e) => {
            const h = roleOrg(e.head);
            raw.projects.push({ title: h.role || (e.points[0] || '').slice(0, 80), subtitle: h.org, year: h.dates, summary: e.body.join(' '), points: e.points, tags: [] });
        });
        // Education
        const DEG = /\b(?:bsc|b\.sc|bachelor|ba\b|b\.?a\.|beng|b\.eng|btech|diploma|certificate|kcse|kcpe|o-?level|a-?level|igcse|msc|m\.sc|master|mba|phd|doctor|degree|high school|secondary)/i;
        const SCH = /\b(?:university|college|school|institute|academy|polytechnic|technical|faculty)\b/i;
        entries(blocks.education || [], false, (t, cur) => DEG.test(t) && cur.head.some((h) => DEG.test(h))).forEach((e) => {
            let dates = '';
            const bits = [];
            e.head.forEach((h) => { const d = splitDates(h); if (d.dates && !dates) dates = d.dates; parts(d.text).forEach((pt) => bits.push(...(SCH.test(pt) || DEG.test(pt) ? pt.split(/,\s+/) : [pt]).map(tidy).filter(Boolean))); });
            let title = bits.find((b) => DEG.test(b)) || bits.find((b) => !SCH.test(b)) || bits[0] || '';
            let org = bits.find((b) => b !== title && SCH.test(b)) || bits.find((b) => b !== title) || '';
            if (!org && title.includes(',') && SCH.test(title)) { const k = title.split(','); title = tidy(k[0]); org = tidy(k.slice(1).join(',')); }
            const others = bits.filter((b) => b !== title && b !== org);
            raw.education.push({ title, org, dates, note: tidy(others.concat(e.body, e.points).join('. ').replace(/\.\s*\./g, '.')) });
        });
        // Simple lists
        const items = (k) => (blocks[k] || []).map((l) => tidy(l.text.replace(BULLET, ''))).filter(Boolean);
        raw.skills = items('skills').slice(0, 60);
        raw.languages = items('languages').flatMap((l) => l.split(/\s*[,;·|]\s*/)).map(tidy).filter(Boolean).slice(0, 20);
        raw.memberships = items('memberships').slice(0, 20);
        raw.certificates = items('certificates').map((l) => {
            const d = splitDates(l);
            const ps = parts(d.text).length > 1 ? parts(d.text) : d.text.split(/,\s+(?=[A-Z][^,]{2,40}$)/);
            return { title: tidy(ps[0]), issuer: tidy(ps.slice(1).join(', ')) };
        }).filter((c) => c.title).slice(0, 40);
        if (!raw.person.name) warnings.push('Your name wasn\'t found: type it in at the top.');
        if (!raw.experience.length && !raw.projects.length) warnings.push('No roles or projects were recognised. Add them below, or paste the text of those sections.');
        return { raw, warnings };
    }

    /* ---------------- entry points for the page ---------------- */
    async function fromFile(file) {
        if (!file) throw new Error('no-file');
        if (file.size > MAX_BYTES) throw new Error('too-big');
        const name = String(file.name || '').toLowerCase();
        const buf = await file.arrayBuffer();
        if (/\.docx$/.test(name) || /officedocument\.wordprocessingml/.test(file.type)) return parse(docxLines(await unzipText(buf, 'word/document.xml')));
        if (/\.pdf$/.test(name) || file.type === 'application/pdf') {
            const lines = await pdfLines(buf, await loadPdfJs());
            if (lines.length < 3) throw new Error('pdf-image');   // a scanned CV is a picture: no text to read
            return parse(lines);
        }
        if (/\.doc$/.test(name)) throw new Error('old-doc');
        if (/\.(txt|md)$/.test(name) || /^text\//.test(file.type)) return parse(textLines(new TextDecoder().decode(buf)));
        throw new Error('type');
    }
    const fromText = (text) => parse(textLines(text));

    const API = { fromFile, fromText, parse, docxLines, unzipText, textLines, rowsOf, MAX_BYTES };
    if (typeof module === 'object' && module.exports) module.exports = API;
    root.CVImport = API;
})(typeof window !== 'undefined' ? window : globalThis);
