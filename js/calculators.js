/* =========================================================================
   Free tools (calculators/index.html)
   1. Sheet-metal bend allowance / flat length
   2. Print size & DPI (with a local image check: nothing is uploaded)
   3. Engineering unit converter
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const num = (el) => { const v = parseFloat(String(el.value).replace(',', '.')); return isFinite(v) ? v : NaN; };
    const fmt = (v, d = 2) => (isFinite(v) ? Number(v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d }) : '–');
    const track = (n) => { if (typeof window.track === 'function') window.track(n); };
    let tracked = {};
    const once = (n) => { if (!tracked[n]) { tracked[n] = 1; track(n); } };

    /* ======================================================================
       1. BEND ALLOWANCE
       BA   = angle(rad) × (R + K × T)
       OSSB = tan(angle / 2) × (R + T)        outside setback
       BD   = 2 × OSSB − BA                    bend deduction
       Flat = A + B − BD                       A, B = outside flange lengths
       ====================================================================== */
    const bend = $('#bend-form');
    if (bend) {
        const f = bend.elements;
        const out = (id, v, unit) => { $('#' + id).textContent = isFinite(v) ? fmt(v, unit === 'in' ? 4 : 2) + ' ' + unit : '–'; };
        function calc() {
            const unit = f.unit.value;
            const T = num(f.thickness), R = num(f.radius), K = num(f.k), deg = num(f.angle), A = num(f.flangeA), B = num(f.flangeB);
            $$('.unit-label', bend).forEach((el) => { el.textContent = unit; });
            const err = $('#bend-error');
            let msg = '';
            if (!(T > 0)) msg = 'Enter the material thickness.';
            else if (!(R >= 0)) msg = 'Enter the inside bend radius (0 or more).';
            else if (!(deg > 0 && deg < 180)) msg = 'The bend angle must be between 0° and 180°.';
            else if (!(K >= 0 && K <= 1)) msg = 'The K-factor is usually between 0.3 and 0.5 (it must be between 0 and 1).';
            err.textContent = msg ? t(msg) : '';
            err.hidden = !msg;
            if (msg) { ['bend-ba', 'bend-bd', 'bend-ossb', 'bend-flat'].forEach((id) => { $('#' + id).textContent = '–'; }); drawBend(90, 1, 1, 40, 40); return; }
            const rad = deg * Math.PI / 180;
            const BA = rad * (R + K * T);
            const OSSB = Math.tan(rad / 2) * (R + T);
            const BD = 2 * OSSB - BA;
            out('bend-ba', BA, unit);
            out('bend-bd', BD, unit);
            out('bend-ossb', OSSB, unit);
            const flat = A + B - BD;
            out('bend-flat', A > 0 && B > 0 ? flat : NaN, unit);
            $('#bend-flat-note').hidden = !(A > 0 && B > 0 && (A < OSSB || B < OSSB));
            drawBend(deg, T, R, A > 0 ? A : 40, B > 0 ? B : 40);
            once('tool-bend-used');
        }
        // Side view of the bent part, scaled to fit (flange lengths capped so the bend stays visible)
        function drawBend(deg, T, R, A, B) {
            const svg = $('#bend-svg');
            const s = 120 / Math.max(A, B, R + T, 1);
            const tk = Math.max(3, Math.min(14, T * s));
            const rm = Math.min(R * s, 60) + tk / 2;           // mid-surface radius
            const a = Math.min(A * s, 140), b = Math.min(B * s, 140);
            const th = deg * Math.PI / 180;
            const x0 = 0, y0 = 0;
            const cx = x0 + a, cy = y0 - rm;                    // bend centre
            const ex = cx + rm * Math.sin(th), ey = cy + rm * Math.cos(th);
            const px = ex + b * Math.cos(th), py = ey - b * Math.sin(th);
            const xs = [x0, cx, ex, px, cx + rm], ys = [y0, ey, py, cy];
            const pad = 26;
            const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
            svg.setAttribute('viewBox', [minX, minY, maxX - minX, maxY - minY].map((v) => v.toFixed(1)).join(' '));
            const arc = 'M ' + cx.toFixed(1) + ' ' + y0 + ' A ' + rm.toFixed(1) + ' ' + rm.toFixed(1) + ' 0 0 0 ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
            svg.innerHTML =
                '<path d="M ' + x0 + ' ' + y0 + ' L ' + cx.toFixed(1) + ' ' + y0 + ' ' + arc.slice(arc.indexOf('A')) + ' L ' + px.toFixed(1) + ' ' + py.toFixed(1) + '" fill="none" stroke="var(--blue)" stroke-width="' + tk.toFixed(1) + '" stroke-linejoin="round"/>' +
                '<path d="' + arc + '" fill="none" stroke="var(--sun)" stroke-width="' + (tk + 1).toFixed(1) + '"/>' +
                '<text x="' + (a / 2).toFixed(1) + '" y="' + (y0 + tk / 2 + 16).toFixed(1) + '" text-anchor="middle" class="svg-label">A</text>' +
                '<text x="' + ((ex + px) / 2 + 16 * Math.sin(th)).toFixed(1) + '" y="' + ((ey + py) / 2 + 16 * Math.cos(th) + 4).toFixed(1) + '" text-anchor="middle" class="svg-label">B</text>' +
                '<text x="' + (cx - 8).toFixed(1) + '" y="' + (cy - 4).toFixed(1) + '" text-anchor="end" class="svg-label svg-angle">' + Math.round(deg) + '°</text>';
        }
        bend.addEventListener('input', calc);
        bend.addEventListener('change', calc);
        bend.addEventListener('submit', (e) => e.preventDefault());
        bend.addEventListener('click', (e) => { const k = e.target.closest('[data-k]'); if (k) { f.k.value = k.dataset.k; calc(); } });
        calc();
    }

    /* ======================================================================
       2. PRINT SIZE & DPI
       pixels = size(in) × DPI ;  1 in = 25.4 mm
       ====================================================================== */
    const print = $('#print-form');
    if (print) {
        const f = print.elements;
        const SIZES = {
            A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148],
            card: [85, 55], rollup: [850, 2000], flyer: [99, 210]
        };
        let img = null; // dimensions read from a chosen file
        function size() {
            const key = f.size.value;
            let w, h;
            if (key === 'custom') {
                const u = f.cunit.value === 'in' ? 25.4 : f.cunit.value === 'cm' ? 10 : 1;
                w = num(f.cw) * u; h = num(f.ch) * u;
            } else [w, h] = SIZES[key];
            if (f.orient.value === 'landscape' && h > w || f.orient.value === 'portrait' && w > h) [w, h] = [h, w];
            const bleed = f.bleed.checked ? 3 : 0;
            return { w: w + bleed * 2, h: h + bleed * 2, tw: w, th: h, bleed };
        }
        function calc() {
            $('#custom-size').hidden = f.size.value !== 'custom';
            const s = size(), dpi = num(f.dpi);
            if (!(s.w > 0 && s.h > 0) || !(dpi > 0)) { $('#print-px').textContent = '–'; return; }
            const pw = Math.round(s.w / 25.4 * dpi), ph = Math.round(s.h / 25.4 * dpi);
            $('#print-px').textContent = pw.toLocaleString('en-US') + ' × ' + ph.toLocaleString('en-US') + ' px';
            $('#print-mp').textContent = fmt(pw * ph / 1e6, 1) + ' MP';
            $('#print-mm').textContent = fmt(s.tw, 0) + ' × ' + fmt(s.th, 0) + ' mm' + (s.bleed ? ' + 3 mm bleed' : '');
            $('#print-in').textContent = fmt(s.w / 25.4, 2) + ' × ' + fmt(s.h / 25.4, 2) + ' in';
            // Image check
            const box = $('#img-result');
            const iw = img ? img.w : num(f.iw), ih = img ? img.h : num(f.ih);
            if (iw > 0 && ih > 0) {
                const fitDpi = Math.min(iw / (s.w / 25.4), ih / (s.h / 25.4));
                const v = fitDpi >= 300 ? ['great', 'Great for print: sharp even up close.']
                    : fitDpi >= 200 ? ['ok', 'Good: fine for most prints viewed at arm\'s length.']
                    : fitDpi >= 120 ? ['fair', 'OK for banners and posters viewed from a distance, soft up close.']
                    : ['low', 'Too small: it will look blurry. Use a bigger image or a smaller print size.'];
                box.hidden = false;
                box.className = 'img-result is-' + v[0];
                $('#img-dpi').textContent = Math.floor(fitDpi) + ' DPI';
                $('#img-verdict').textContent = t(v[1]);
                const ratioImg = iw / ih, ratioPrint = s.w / s.h;
                $('#img-crop').hidden = Math.abs(ratioImg - ratioPrint) / ratioPrint < 0.04;
            } else box.hidden = true;
            once('tool-print-used');
        }
        print.addEventListener('input', calc);
        print.addEventListener('change', calc);
        print.addEventListener('submit', (e) => e.preventDefault());
        f.photo.addEventListener('change', () => {
            const file = f.photo.files && f.photo.files[0];
            if (!file) { img = null; calc(); return; }
            const url = URL.createObjectURL(file);
            const im = new Image();
            im.onload = () => {
                img = { w: im.naturalWidth, h: im.naturalHeight };
                f.iw.value = img.w; f.ih.value = img.h;
                URL.revokeObjectURL(url);
                img = null; // values now live in the boxes, which the visitor can still edit
                calc();
            };
            im.onerror = () => { URL.revokeObjectURL(url); };
            im.src = url;
        });
        calc();
    }

    /* ======================================================================
       3. UNIT CONVERTER
       ====================================================================== */
    const conv = $('#units-form');
    if (conv) {
        const f = conv.elements;
        const U = {
            length: { base: 'm', units: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048, yd: 0.9144 } },
            area: { base: 'm²', units: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1, 'in²': 0.00064516, 'ft²': 0.09290304 } },
            mass: { base: 'kg', units: { g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237 } },
            force: { base: 'N', units: { N: 1, kN: 1000, kgf: 9.80665, lbf: 4.4482216152605 } },
            pressure: { base: 'Pa', units: { Pa: 1, kPa: 1e3, MPa: 1e6, 'N/mm²': 1e6, GPa: 1e9, bar: 1e5, psi: 6894.757293168, ksi: 6894757.293168 } },
            torque: { base: 'N·m', units: { 'N·m': 1, 'kgf·m': 9.80665, 'lbf·ft': 1.3558179483314, 'lbf·in': 0.1129848290276 } },
            temperature: { units: { '°C': 1, '°F': 1, K: 1 } }
        };
        const toC = { '°C': (v) => v, '°F': (v) => (v - 32) * 5 / 9, K: (v) => v - 273.15 };
        const fromC = { '°C': (v) => v, '°F': (v) => v * 9 / 5 + 32, K: (v) => v + 273.15 };
        const pretty = (v) => {
            if (!isFinite(v)) return '–';
            const a = Math.abs(v);
            if (a !== 0 && (a < 1e-4 || a >= 1e9)) return v.toExponential(4).replace('e', ' × 10^').replace('+', '');
            return Number(v.toPrecision(7)).toLocaleString('en-US', { maximumFractionDigits: 6 });
        };
        function fillUnits() {
            const cat = U[f.cat.value];
            f.from.innerHTML = Object.keys(cat.units).map((u) => '<option value="' + u + '">' + u + '</option>').join('');
            const defaults = { length: 'mm', area: 'mm²', mass: 'kg', force: 'N', pressure: 'MPa', torque: 'N·m', temperature: '°C' };
            f.from.value = defaults[f.cat.value];
        }
        function calc() {
            if (!(f.from.value in U[f.cat.value].units)) fillUnits();   // quantity just changed
            const cat = U[f.cat.value], from = f.from.value, v = num(f.value);
            const rows = Object.keys(cat.units).filter((u) => u !== from).map((u) => {
                let r;
                if (f.cat.value === 'temperature') r = fromC[u](toC[from](v));
                else r = v * cat.units[from] / cat.units[u];
                return '<li><strong data-no-i18n>' + pretty(r) + '</strong><span data-no-i18n>' + u + '</span></li>';
            });
            $('#units-out').innerHTML = isFinite(v) ? rows.join('') : '<li class="units-empty">' + t('Enter a number to convert.') + '</li>';
            once('tool-units-used');
        }
        conv.addEventListener('change', (e) => { if (e.target === f.cat) fillUnits(); calc(); });
        conv.addEventListener('input', calc);
        conv.addEventListener('submit', (e) => e.preventDefault());
        fillUnits();
        calc();
    }

    document.addEventListener('langchange', () => { [bend, print, conv].forEach((fm) => fm && fm.dispatchEvent(new Event('change'))); });
})();
