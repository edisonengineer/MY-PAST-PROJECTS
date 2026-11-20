/* =========================================================================
   Steel gate, grill & railing estimator (/steel/)
   Builds a cut list from the sizes, fits the pieces onto stock lengths,
   and prices steel, sheet, rods & discs, paint, labour and fittings.
   Pro licences, the Go Pro window and business details: js/pro.js.
   ========================================================================= */
(function () {
    'use strict';

    const NP = window.NexusPro;
    if (!NP) return;
    const { $, $$, store, esc, num, kes, fmt, today, fill, read, isPro, openPro, nextNumber } = NP;

    const forms = { job: $('#st-job'), costs: $('#st-costs'), cust: $('#st-cust'), biz: $('#nq-biz') };
    if (!forms.job) return;

    /* ---------- Steel sections. b = face width seen from the front (mm) ---------- */
    const STEEL = 7850;   // kg/m³
    const SEC = {};
    const add = (key, label, b, area, perim) => { SEC[key] = { label, b, kgm: area * STEEL / 1e6, perim: perim / 1000 }; };
    const shs = (b, t) => add('shs' + b, 'SHS ' + b + ' × ' + b + ' × ' + t, b, b * b - (b - 2 * t) * (b - 2 * t), 4 * b);
    [[20, 1.2], [25, 1.5], [38, 1.5], [50, 2], [75, 3], [100, 3]].forEach(([b, t]) => shs(b, t));
    add('rhs50', 'RHS 50 × 25 × 1.5', 50, 50 * 25 - 47 * 22, 150);
    add('rhs75', 'RHS 75 × 50 × 2', 75, 75 * 50 - 71 * 46, 250);
    add('fb25x3', 'Flat bar 25 × 3', 25, 75, 56);
    add('fb25x5', 'Flat bar 25 × 5', 25, 125, 60);
    add('fb40x5', 'Flat bar 40 × 5', 40, 200, 90);
    add('rb12', 'Round bar 12 mm', 12, Math.PI * 36, Math.PI * 12);
    add('rb16', 'Round bar 16 mm', 16, Math.PI * 64, Math.PI * 16);
    add('sb12', 'Square bar 12 mm', 12, 144, 48);
    add('sb16', 'Square bar 16 mm', 16, 256, 64);
    add('ang25', 'Angle 25 × 25 × 3', 25, 3 * (50 - 3), 100);
    add('ang40', 'Angle 40 × 40 × 4', 40, 4 * (80 - 4), 160);
    const SHEETS = { g18: { label: 'Gauge 18 (1.2 mm) sheet', t: 1.2 }, g16: { label: 'Gauge 16 (1.5 mm) sheet', t: 1.5 }, g14: { label: 'Gauge 14 (2.0 mm) sheet', t: 2 } };
    const SHEET_M2 = 1.22 * 2.44;
    const KG_PRICE = 170;   // example: KES per kg of steel, for the starting prices
    const round10 = (n) => Math.round(n / 10) * 10;
    const defaultLength = (k) => round10(SEC[k].kgm * 6 * KG_PRICE);
    const defaultSheet = (g) => Math.round(SHEET_M2 * SHEETS[g].t * STEEL / 1000 * KG_PRICE / 50) * 50;
    const KERF = 3;

    $$('[data-sections]').forEach((sel) => {
        sel.innerHTML = Object.keys(SEC).map((k) => '<option value="' + k + '">' + esc(SEC[k].label) + '</option>').join('');
    });

    const DEFAULTS = {
        swing: { name: 'Main gate', qty: 1, w: 3600, h: 2100, leaves: 2, frame: 'shs50', rail: 'shs38', rails: 1, infill: 'bars', bar: 'shs25', gap: 100, gauge: 'g18', posts: true, gpost: 'shs100', bury: 600 },
        sliding: { name: 'Sliding gate', qty: 1, w: 4000, h: 2100, overlap: 300, frame: 'shs50', rail: 'shs38', rails: 1, infill: 'half', bar: 'shs25', gap: 100, gauge: 'g16', posts: true, gpost: 'shs100', bury: 600, track: 'ang40' },
        grill: { name: 'Window grill', qty: 4, w: 1200, h: 1500, frame: 'fb25x5', rail: 'fb25x5', rails: 1, infill: 'bars', bar: 'sb12', gap: 120 },
        railing: { name: 'Balcony railing', qty: 1, w: 4000, h: 900, pspace: 1500, frame: 'shs25', top: 'rhs50', post: 'shs50', bar: 'shs20', gap: 100 }
    };
    const TYPE_LABEL = { swing: 'swing gate', sliding: 'sliding gate', grill: 'window grill', railing: 'railing' };

    /* =====================================================================
       Building the item: pieces, sheet and fittings for ONE item
       ===================================================================== */
    function build(j) {
        const W = num(j.w), H = num(j.h), warn = [], errors = [];
        const pieces = [], draw = [], fittings = [];
        let sheet = 0;
        const piece = (sec, len, label, qty) => { if (len > 0) pieces.push({ sec, len, label, qty: qty || 1 }); };
        const rect = (x, y, w, h, cls) => draw.push([x, y, w, h, cls]);
        if (!(W >= 100) || !(H >= 100)) return { errors: ['Enter the width and height in millimetres (at least 100).'] };

        // Rails and infill inside one frame panel (gate leaf or grill)
        function panel(x0, pw) {
            const fb = SEC[j.frame].b, rb = SEC[j.rail].b, bb = j.bar ? SEC[j.bar].b : 0, gap = Math.max(20, num(j.gap, 100));
            let m = Math.max(0, Math.min(10, Math.round(num(j.rails))));
            if (j.infill === 'half' && m < 1) { m = 1; warn.push('Sheet at the bottom needs a middle rail, so one is included.'); }
            const Wi = pw - 2 * fb, Hi = H - 2 * fb;
            if (Wi <= 0 || Hi - m * rb <= 0) { errors.push('The frame is too big for this size. Choose a smaller section or fewer rails.'); return; }
            piece(j.frame, H, 'Frame upright', 2);
            piece(j.frame, Wi, 'Frame top & bottom', 2);
            rect(x0, 0, fb, H, 'frame'); rect(x0 + pw - fb, 0, fb, H, 'frame');
            rect(x0 + fb, 0, Wi, fb, 'frame'); rect(x0 + fb, H - fb, Wi, fb, 'frame');
            const s = (Hi - m * rb) / (m + 1);
            for (let k = 1; k <= m; k++) { piece(j.rail, Wi, 'Middle rail'); rect(x0 + fb, fb + k * s + (k - 1) * rb, Wi, rb, 'rail'); }
            const barBays = j.infill === 'bars' ? m + 1 : j.infill === 'half' ? Math.ceil((m + 1) / 2) : 0;
            for (let k = 0; k <= m; k++) {
                const y = fb + k * (s + rb);
                if (k < barBays) {
                    const nb = Wi > gap ? Math.ceil((Wi - gap) / (gap + bb)) : 0;
                    const sp = (Wi - nb * bb) / (nb + 1);
                    if (nb) piece(j.bar, s, 'Bar', nb);
                    for (let i = 0; i < nb; i++) rect(x0 + fb + sp + i * (sp + bb), y, bb, s, 'bar');
                } else if (j.infill === 'sheet' || j.infill === 'half') {
                    sheet += Wi * s / 1e6;
                    rect(x0 + fb, y, Wi, s, 'sheet');
                }
            }
        }
        function gatePosts(left, right) {
            if (!j.posts) return;
            const pb = SEC[j.gpost].b;
            piece(j.gpost, H + 100 + Math.max(0, num(j.bury)), 'Gate post (incl. ' + fmt(num(j.bury)) + ' mm in the ground)', 2);
            rect(left - pb - 20, -50, pb, H + 100, 'post'); rect(right + 20, -50, pb, H + 100, 'post');
        }

        if (j.type === 'swing') {
            const n = num(j.leaves) === 1 ? 1 : 2, gapL = 10, pw = (W - (n - 1) * gapL) / n;
            for (let i = 0; i < n; i++) panel(i * (pw + gapL), pw);
            gatePosts(0, W);
            fittings.push(['Hinges', (H > 1500 ? 3 : 2) * n, 'hinge']);
            if (n === 2) fittings.push(['Drop bolts', 2, 'bolt']);
            fittings.push(['Lock & handle', 1, 'lock']);
        } else if (j.type === 'sliding') {
            const pw = W + Math.max(0, num(j.overlap));
            panel(0, pw);
            gatePosts(0, W);
            const tl = W + pw;
            piece(j.track, tl, 'Track (opening + parking)');
            rect(0, H + 30, tl, 6, 'track');
            fittings.push(['Wheels', 2, 'wheel'], ['Guide rollers', 1, 'guide'], ['Lock & handle', 1, 'lock']);
            draw.push(['open', W]);
        } else if (j.type === 'grill') {
            panel(0, W);
            piece(j.frame, 100, 'Fixing lug', 4);
        } else {
            // Railing: posts, top rail, bottom rail 100 mm above the floor, balusters between
            const tb = SEC[j.top].b, fb = SEC[j.frame].b, pb = SEC[j.post].b, bb = SEC[j.bar].b, gap = Math.max(20, num(j.gap, 100));
            const spans = Math.max(1, Math.ceil(W / Math.max(300, num(j.pspace, 1500))));
            const pitch = (W - pb) / spans, bl = H - 100 - fb - tb;
            if (bl <= 0) return { errors: ['The railing is too low for these sections.'] };
            piece(j.post, H - tb, 'Post', spans + 1);
            piece(j.top, W, 'Top rail');
            piece(j.frame, W - (spans + 1) * pb, 'Bottom rail (between posts)');
            rect(0, 0, W, tb, 'frame');
            rect(0, H - 100 - fb, W, fb, 'rail');
            for (let i = 0; i <= spans; i++) rect(i * pitch, tb, pb, H - tb, 'post');
            const clear = pitch - pb, nb = clear > gap ? Math.ceil((clear - gap) / (gap + bb)) : 0, sp = (clear - nb * bb) / (nb + 1);
            if (nb) piece(j.bar, bl, 'Baluster', nb * spans);
            for (let i = 0; i < spans; i++) for (let k = 0; k < nb; k++) rect(i * pitch + pb + sp + k * (sp + bb), tb, bb, bl, 'bar');
            if (gap > 100) warn.push('Gaps over 100 mm let small children through. Most building rules ask for 100 mm or less.');
        }
        if (errors.length) return { errors };
        return { errors, warn, pieces, sheet, fittings, draw, W, H };
    }

    /* ---------- Fit the pieces onto stock lengths (longest first) ---------- */
    function pack(lengths, stock) {
        const bars = [];
        lengths.sort((a, b) => b - a).forEach((len) => {
            const bar = bars.find((r) => r.left >= len);
            if (bar) bar.left -= len + KERF; else bars.push({ left: stock - len - KERF });
        });
        return bars.length;
    }

    /* =====================================================================
       Prices
       ===================================================================== */
    const prices = Object.assign({ len: {}, sheet: {} }, store.get('st-prices', {}));
    const lengthPrice = (k) => (prices.len[k] != null ? prices.len[k] : defaultLength(k));
    const sheetPrice = (g) => (prices.sheet[g] != null ? prices.sheet[g] : defaultSheet(g));

    function compute() {
        const j = Object.assign({ type: 'swing' }, read(forms.job));
        const c = read(forms.costs);
        const qty = Math.max(1, Math.round(num(j.qty, 1)));
        const b = build(j);
        if (b.errors.length) return { errors: b.errors };
        const stock = Math.max(1000, num(c.barlen, 6000));
        const warn = b.warn.slice();

        // Join pieces longer than a stock length
        const cut = [];
        b.pieces.forEach((p) => {
            const parts = Math.ceil(p.len / (stock - KERF));
            if (parts > 1) {
                warn.push(p.label + ' (' + fmt(p.len) + ' mm) is longer than a ' + fmt(stock) + ' mm length, so it is made from ' + parts + ' pieces joined.');
                for (let i = 0; i < parts; i++) cut.push({ sec: p.sec, len: p.len / parts, label: p.label + ' (part ' + (i + 1) + ' of ' + parts + ')', qty: p.qty });
            } else cut.push(p);
        });
        // Steel to buy, per section
        const buy = {};
        cut.forEach((p) => {
            const s = buy[p.sec] || (buy[p.sec] = { lens: [], metres: 0 });
            for (let i = 0; i < p.qty * qty; i++) s.lens.push(p.len);
            s.metres += p.len * p.qty * qty / 1000;
        });
        let steel = 0, bars = 0, used = 0, weight = 0, paintArea = 0;
        Object.keys(buy).forEach((k) => {
            const s = buy[k];
            s.bars = pack(s.lens.slice(), stock);
            s.cost = s.bars * lengthPrice(k);
            steel += s.cost; bars += s.bars; used += s.metres;
            weight += s.metres * SEC[k].kgm;
            paintArea += s.metres * SEC[k].perim;
        });
        const waste = bars ? 1 - used / (bars * stock / 1000) : 0;
        const sheetM2 = b.sheet * qty;
        const sheets = sheetM2 ? Math.ceil(sheetM2 * 1.1 / SHEET_M2) : 0;
        const sheetCost = sheets * sheetPrice(j.gauge || 'g18');
        if (sheetM2) { weight += sheetM2 * SHEETS[j.gauge || 'g18'].t * STEEL / 1000; paintArea += sheetM2 * 2; }

        const cons = (steel + sheetCost) * num(c.cons) / 100;
        const paint = paintArea * num(c.paint);
        const labour = weight * num(c.labour);
        const fitCost = b.fittings.reduce((a, f) => a + f[1] * qty * num(c[f[2]]), 0);
        const install = num(c.install) * qty;
        const lines = [
            ['Steel: ' + bars + ' lengths' + (sheets ? ' + ' + sheets + ' sheet' + (sheets > 1 ? 's' : '') : ''), steel + sheetCost],
            ['Welding rods, discs & gas', cons],
            ['Primer & paint: ' + fmt(paintArea, 1) + ' m²', paint],
            ['Labour: ' + fmt(weight) + ' kg of steel', labour],
            ['Fittings: ' + b.fittings.map((f) => f[1] * qty + ' ' + f[0].toLowerCase()).join(', '), fitCost],
            ['Fitting on site', install]
        ].filter((l) => l[1] > 0);
        const cost = lines.reduce((a, l) => a + l[1], 0);
        const markup = 1 + num(c.markup) / 100;
        const price = cost * markup;

        // Cut list: the same piece grouped
        const list = {};
        cut.forEach((p) => {
            const key = p.sec + '|' + Math.round(p.len) + '|' + p.label;
            (list[key] = list[key] || { sec: p.sec, len: Math.round(p.len), label: p.label, qty: 0 }).qty += p.qty * qty;
        });
        const cutList = Object.values(list).sort((a, b2) => (a.sec === b2.sec ? b2.len - a.len : a.sec < b2.sec ? -1 : 1));

        const infillTxt = j.type === 'railing' ? 'balusters ' + SEC[j.bar].label + ' at ≤ ' + fmt(num(j.gap)) + ' mm gaps' :
            { bars: 'bars ' + SEC[j.bar].label + ' at ≤ ' + fmt(num(j.gap)) + ' mm gaps', sheet: SHEETS[j.gauge].label.toLowerCase() + ' infill', half: 'sheet at the bottom, ' + SEC[j.bar].label + ' bars on top', none: 'frame only' }[j.infill];
        const desc = [
            (j.type === 'swing' ? (num(j.leaves) === 1 ? 'One-leaf' : 'Two-leaf') + ' swing gate' : j.type === 'sliding' ? 'Sliding gate' : j.type === 'grill' ? 'Window grill' : 'Railing') +
                ' ' + fmt(num(j.w)) + (j.type === 'railing' ? ' mm long × ' : ' × ') + fmt(num(j.h)) + ' mm high',
            (j.type === 'railing' ? SEC[j.top].label + ' top rail' : SEC[j.frame].label + ' frame'), infillTxt,
            (j.type === 'swing' || j.type === 'sliding') && j.posts ? '2 posts ' + SEC[j.gpost].label : '',
            j.type === 'sliding' ? 'track, wheels & guide' : '',
            num(c.paint) > 0 ? 'primed & painted' : '', num(c.install) > 0 ? 'fitted on site' : ''
        ].filter(Boolean).join(', ');
        return {
            errors: [], warn, j, qty, b, buy, bars, waste, weight, paintArea, sheets, sheetM2, lines, cost, markup, price, unit: price / qty,
            cutList, stock, desc, name: String(j.name || '').trim() || TYPE_LABEL[j.type]
        };
    }

    /* ---------- Front view drawing ---------- */
    const COLORS = { frame: '#0e1a3a', rail: '#2b3c7d', bar: '#13a89e', sheet: 'rgba(19,168,158,.25)', post: '#646a82', track: '#ff6b4a' };
    function drawSvg(r) {
        const shapes = r.b.draw.filter((d) => d[0] !== 'open');
        const xs = [], ys = [];
        shapes.forEach((d) => { xs.push(d[0], d[0] + d[2]); ys.push(d[1], d[1] + d[3]); });
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = Math.max(maxX - minX, maxY - minY) * 0.06;
        const vb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad + pad * 2.5];
        const fs = vb[2] / 26;
        const ground = r.j.type === 'railing' ? r.b.H : r.b.H + 50;
        const open = r.b.draw.find((d) => d[0] === 'open');
        return '<svg viewBox="' + vb.map((v) => v.toFixed(1)).join(' ') + '" role="img" aria-label="Front view">' +
            '<line x1="' + vb[0].toFixed(1) + '" x2="' + (vb[0] + vb[2]).toFixed(1) + '" y1="' + ground + '" y2="' + ground + '" stroke="#b9a98d" stroke-width="' + (fs / 4).toFixed(1) + '"/>' +
            shapes.map((d) => '<rect x="' + d[0].toFixed(1) + '" y="' + d[1].toFixed(1) + '" width="' + Math.max(d[2], 1).toFixed(1) + '" height="' + Math.max(d[3], 1).toFixed(1) + '" fill="' + COLORS[d[4]] + '"/>').join('') +
            (open ? '<line x1="0" x2="' + open[1] + '" y1="' + (ground + pad * 1.2).toFixed(1) + '" y2="' + (ground + pad * 1.2).toFixed(1) + '" stroke="#ff6b4a" stroke-dasharray="' + fs + ' ' + fs / 2 + '" stroke-width="' + (fs / 5).toFixed(1) + '"/>' : '') +
            '<text x="' + ((minX + maxX) / 2).toFixed(1) + '" y="' + (maxY + pad * 2.6).toFixed(1) + '" text-anchor="middle" font-size="' + fs.toFixed(1) + '" fill="currentColor">' +
                fmt(r.b.W) + ' × ' + fmt(r.b.H) + ' mm' + (open ? ' (opening; dashes)' : '') + '</text></svg>';
    }

    /* =====================================================================
       Screen
       ===================================================================== */
    let current = null, items = [], quoteNo = '', committed = false;
    function paintFields() {
        const j = read(forms.job), type = j.type || 'swing';
        const gateOrGrill = type !== 'railing';
        $$('[data-for]').forEach((el) => { el.hidden = el.dataset.for.split(' ').indexOf(type) < 0; });
        $$('[data-infill]').forEach((el) => {
            const show = type === 'railing' ? el.dataset.infill.indexOf('bars') > -1 && !el.closest('#st-costs') : gateOrGrill && el.dataset.infill.split(' ').indexOf(j.infill) > -1;
            el.hidden = !show;
        });
        $$('[data-posts]').forEach((el) => { el.hidden = !j.posts; });
        $('#s-w-label').textContent = type === 'railing' ? 'Length of railing (mm)' : 'Width of opening (mm)';
        $('#s-frame-label').textContent = type === 'railing' ? 'Bottom rail' : 'Frame';
        $('#s-bar-label').textContent = type === 'railing' ? 'Balusters' : 'Bars';
        $('#r-unit-label').textContent = 'Price per ' + TYPE_LABEL[type];
    }
    function paintPriceRows(r) {
        const keys = r ? Object.keys(r.buy) : [];
        const tb = $('#st-price-rows');
        const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.sec : null;
        if (focused && tb.contains(document.activeElement)) return;   // don't redraw while typing
        tb.innerHTML = keys.map((k) => '<tr><td>' + esc(SEC[k].label) + '</td><td>' + fmt(SEC[k].kgm, 2) + '</td><td><input type="number" inputmode="decimal" min="0" step="any" data-sec="' + k + '" value="' + lengthPrice(k) + '" aria-label="Price per length of ' + esc(SEC[k].label) + '"></td></tr>').join('');
        const g = read(forms.job).gauge || 'g18';
        if (document.activeElement !== forms.costs.elements.sheet) forms.costs.elements.sheet.value = sheetPrice(g);
    }

    function update() {
        paintFields();
        const r = compute();
        current = r.errors.length ? null : r;
        $('#r-error').hidden = !r.errors.length;
        $('#r-error').textContent = r.errors.join(' ');
        $('#q-add').disabled = !current;
        if (!current) {
            ['#r-unit', '#r-total', '#r-weight', '#r-bars', '#r-paint', '#r-waste'].forEach((s) => { $(s).textContent = '–'; });
            ['#r-warn', '#r-buy', '#r-cut', '#r-break', '#r-draw'].forEach((s) => { $(s).innerHTML = ''; });
            paintQuote();
            return;
        }
        $('#r-unit').textContent = kes(r.unit);
        $('#r-qty').textContent = r.qty;
        $('#r-total').textContent = kes(r.price);
        $('#r-weight').textContent = fmt(r.weight) + ' kg';
        $('#r-bars').textContent = r.bars + (r.sheets ? ' + ' + r.sheets + ' sheet' + (r.sheets > 1 ? 's' : '') : '');
        $('#r-paint').textContent = fmt(r.paintArea, 1) + ' m²';
        $('#r-waste').textContent = Math.round(r.waste * 100) + '%';
        $('#r-warn').innerHTML = r.warn.map((w) => '<li>' + esc(w) + '</li>').join('');
        $('#r-draw').innerHTML = drawSvg(r);
        $('#r-buy').innerHTML = Object.keys(r.buy).map((k) => '<tr><td>' + esc(SEC[k].label) + ' <small>' + fmt(r.buy[k].metres, 1) + ' m used</small></td><td>' + r.buy[k].bars + ' × ' + fmt(r.stock / 1000, 1) + ' m</td></tr>').join('') +
            (r.sheets ? '<tr><td>' + esc(SHEETS[r.j.gauge].label) + ' <small>' + fmt(r.sheetM2, 2) + ' m² used</small></td><td>' + r.sheets + ' × 1220 × 2440</td></tr>' : '');
        $('#r-cut').innerHTML = '<tr class="is-sub"><td>Piece</td><td>Steel</td><td>Length</td><td>Qty</td></tr>' +
            r.cutList.map((p) => '<tr><td>' + esc(p.label) + '</td><td>' + esc(SEC[p.sec].label) + '</td><td>' + fmt(p.len) + '</td><td>' + p.qty + '</td></tr>').join('');
        $('#r-break').innerHTML = r.lines.map((l) => '<tr><td>' + esc(l[0]) + '</td><td>' + kes(l[1]) + '</td></tr>').join('') +
            '<tr class="is-sub"><td>Your cost</td><td>' + kes(r.cost) + '</td></tr>' +
            '<tr><td>Markup ' + fmt((r.markup - 1) * 100, 1) + '%</td><td>' + kes(r.price - r.cost) + '</td></tr>' +
            '<tr class="is-sub"><td>Price for ' + r.qty + '</td><td>' + kes(r.price) + '</td></tr>';
        paintPriceRows(r);
        paintQuote();
    }

    /* ---------- The quote ---------- */
    const snapshot = (r) => ({
        name: r.name, desc: r.desc, qty: r.qty, unit: r.unit, total: r.price,
        lines: r.lines.map((l) => [l[0], l[1] * r.markup]), svg: drawSvg(r),
        inputs: read(forms.job)
    });
    const quoteParts = () => (items.length ? items : current ? [snapshot(current)] : []);
    function totals(parts) {
        const c = read(forms.costs);
        const sub = parts.reduce((a, p) => a + p.total, 0), delivery = num(c.delivery);
        const vat = c.vat ? (sub + delivery) * 0.16 : 0;
        return { sub, delivery, vat, total: sub + delivery + vat };
    }
    function paintQuote() {
        if (!quoteNo) quoteNo = nextNumber(false);
        $('#qt-number').textContent = quoteNo;
        $('#qt-items').innerHTML = items.map((it, i) =>
            '<li><div><strong>' + esc(it.name) + '</strong> <span>× ' + it.qty + '</span><small>' + esc(it.desc) + '</small></div>' +
            '<div class="nq-item-end"><b>' + kes(it.total) + '</b><span><button type="button" class="nq-link" data-edit="' + i + '">Edit</button> <button type="button" class="nq-link" data-del="' + i + '">Remove</button></span></div></li>').join('');
        $('#qt-empty').hidden = items.length > 0;
        const parts = quoteParts(), t = totals(parts);
        $('#qt-sum').innerHTML = parts.length ?
            '<div><dt>Items</dt><dd>' + kes(t.sub) + '</dd></div>' + (t.delivery ? '<div><dt>Transport</dt><dd>' + kes(t.delivery) + '</dd></div>' : '') +
            (t.vat ? '<div><dt>VAT 16%</dt><dd>' + kes(t.vat) + '</dd></div>' : '') + '<div class="is-total"><dt>Total</dt><dd>' + kes(t.total) + '</dd></div>' : '';
        $('#qt-pdf').disabled = $('#qt-wa').disabled = !parts.length;
    }
    $('#qt-items').addEventListener('click', (e) => {
        const d = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]');
        if (d) { items.splice(+d.dataset.del, 1); paintQuote(); }
        if (ed) {
            const it = items.splice(+ed.dataset.edit, 1)[0];
            loadJob(it.inputs);
            forms.job.scrollIntoView({ behavior: 'smooth', block: 'start' });
            $('#q-add span').textContent = 'Put this back in the quote';
        }
    });
    $('#q-add').addEventListener('click', () => {
        if (!current) return;
        items.push(snapshot(current));
        $('#q-add span').textContent = 'Add this to the quote';
        paintQuote();
        $('#q-add').classList.add('is-done');
        setTimeout(() => $('#q-add').classList.remove('is-done'), 900);
    });
    $('#qt-new').addEventListener('click', () => {
        if (items.length && !confirm('Start a new, empty quote?')) return;
        items = []; quoteNo = ''; committed = false; forms.cust.reset(); store.set('st-cust', read(forms.cust)); paintQuote();
    });

    function quoteHtml(parts) {
        const c = read(forms.cust), t = totals(parts);
        const rows = parts.map((p) => {
            const main = '<tr><td><strong>' + esc(p.name) + '</strong><small>' + esc(p.desc) + '</small></td><td class="n">' + p.qty + '</td><td class="n">' + kes(p.unit) + '</td><td class="n">' + kes(p.total) + '</td></tr>';
            if (!c.itemise) return main;
            return '<tr><td colspan="4"><strong>' + esc(p.name) + '</strong> × ' + p.qty + '<small>' + esc(p.desc) + '</small></td></tr>' +
                p.lines.map((l) => '<tr class="sub"><td>' + esc(l[0]) + '</td><td></td><td></td><td class="n">' + kes(l[1]) + '</td></tr>').join('');
        }).join('');
        const sketches = parts.slice(0, 4).map((p) => '<figure class="st-fig"><div class="sk">' + p.svg + '</div><figcaption>' + esc(p.name) + '</figcaption></figure>').join('');
        return NP.docTop({ no: quoteNo, validDays: c.valid, cust: c }) +
            '<table class="qd-table"><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr></thead><tbody>' + rows +
                (t.delivery ? '<tr><td>Transport</td><td class="n">1</td><td class="n">' + kes(t.delivery) + '</td><td class="n">' + kes(t.delivery) + '</td></tr>' : '') + '</tbody>' +
                '<tfoot>' + (t.vat ? '<tr><td colspan="3">Subtotal</td><td class="n">' + kes(t.sub + t.delivery) + '</td></tr><tr><td colspan="3">VAT 16%</td><td class="n">' + kes(t.vat) + '</td></tr>' : '') +
                '<tr class="tot"><td colspan="3">Total' + (t.vat ? ' (incl. VAT)' : '') + '</td><td class="n">' + kes(t.total) + '</td></tr></tfoot></table>' +
            '<section class="qd-sketch">' + sketches + '</section>' +
            NP.docBottom({ notes: c.notes, small: 'Prices in Kenya shillings. Sizes in millimetres. Drawings show the layout only.', tool: 'gate & grill estimator', path: 'steel' });
    }
    $('#qt-pdf').addEventListener('click', () => {
        const parts = quoteParts();
        if (!parts.length || !NP.pdfAllowed()) return;
        if (!committed) { quoteNo = nextNumber(true); committed = true; }
        NP.countPdf();
        if (isPro()) saveQuote(parts);
        NP.printDoc(quoteHtml(parts), quoteNo + ' ' + (read(forms.cust).cname || 'quote'));
        paintQuote();
        NP.track('steel-pdf' + (isPro() ? '-pro' : ''));
    });
    $('#qt-wa').addEventListener('click', () => {
        const parts = quoteParts();
        if (!parts.length) return;
        const c = read(forms.cust), b = NP.biz(), t = totals(parts);
        const lines = ['*Quotation ' + quoteNo + '*' + (b.bname ? ' from ' + b.bname : ''), c.cname ? 'For: ' + c.cname : '', ''];
        parts.forEach((p) => { lines.push('• ' + p.name + ' × ' + p.qty + ' @ ' + kes(p.unit) + ' = ' + kes(p.total)); lines.push('   ' + p.desc); });
        if (t.delivery) lines.push('• Transport: ' + kes(t.delivery));
        if (t.vat) lines.push('VAT 16%: ' + kes(t.vat));
        lines.push('', '*Total: ' + kes(t.total) + '*', 'Valid for ' + Math.max(1, num(c.valid, 14)) + ' days.');
        if (c.notes) lines.push(c.notes);
        if (isPro() && b.bpay) lines.push('Payment: ' + b.bpay);
        window.open(NP.waLink(c.cphone, lines.filter((l, i) => l || i > 1).join('\n')), '_blank', 'noopener');
        NP.track('steel-whatsapp');
    });

    /* ---------- Workshop cut sheet (Pro): no prices ---------- */
    $('#r-cutsheet').addEventListener('click', () => {
        if (!current) return;
        if (!isPro()) { openPro('buy', 'The printable workshop cut sheet is part of Pro.'); return; }
        const r = current, b = NP.biz();
        const html = '<header class="qd-head"><div class="qd-from"><strong>' + esc(b.bname || 'Workshop') + '</strong><span>Cut sheet · ' + new Date().toLocaleDateString('en-GB') + '</span></div>' +
                '<div class="qd-meta"><h1>CUT LIST</h1><dl><dt>Job</dt><dd>' + esc(r.name) + ' × ' + r.qty + '</dd><dt>Customer</dt><dd>' + esc(read(forms.cust).cname || '–') + '</dd></dl></div></header>' +
            '<p class="qd-small" style="margin-top:10px">' + esc(r.desc) + '</p>' +
            '<table class="qd-table"><thead><tr><th>Piece</th><th>Steel</th><th class="n">Length (mm)</th><th class="n">Qty</th><th class="n">Done</th></tr></thead><tbody>' +
                r.cutList.map((p) => '<tr><td>' + esc(p.label) + '</td><td>' + esc(SEC[p.sec].label) + '</td><td class="n"><strong>' + fmt(p.len) + '</strong></td><td class="n">' + p.qty + '</td><td class="n">☐</td></tr>').join('') + '</tbody></table>' +
            '<table class="qd-table"><thead><tr><th>Buy</th><th class="n">Lengths</th><th class="n">Metres used</th></tr></thead><tbody>' +
                Object.keys(r.buy).map((k) => '<tr><td>' + esc(SEC[k].label) + '</td><td class="n">' + r.buy[k].bars + ' × ' + fmt(r.stock) + ' mm</td><td class="n">' + fmt(r.buy[k].metres, 1) + '</td></tr>').join('') +
                (r.sheets ? '<tr><td>' + esc(SHEETS[r.j.gauge].label) + '</td><td class="n">' + r.sheets + ' × 1220 × 2440</td><td class="n">' + fmt(r.sheetM2, 2) + ' m²</td></tr>' : '') + '</tbody></table>' +
            '<section class="qd-sketch"><figure class="st-fig st-fig-big"><div class="sk">' + drawSvg(r) + '</div><figcaption>Front view</figcaption></figure></section>' +
            (r.b.fittings.length ? '<p class="qd-notes"><strong>Fittings:</strong> ' + r.b.fittings.map((f) => f[1] * r.qty + ' × ' + esc(f[0].toLowerCase())).join(', ') + '</p>' : '');
        NP.printDoc(html, 'Cut list ' + r.name);
        NP.track('steel-cutsheet');
    });

    /* ---------- Saved quotes (Pro) ---------- */
    function saveQuote(parts) {
        const all = store.get('st-quotes', []);
        const entry = { no: quoteNo, date: today(), cust: read(forms.cust), total: totals(parts).total, items: parts.map((p) => Object.assign({}, p)) };
        const i = all.findIndex((q) => q.no === quoteNo);
        if (i > -1) all.splice(i, 1);
        all.unshift(entry);
        all.length = Math.min(all.length, 60);
        while (!store.set('st-quotes', all) && all.length > 1) all.pop();
        paintSaved();
    }
    function paintSaved() {
        const pro = isPro(), all = pro ? store.get('st-quotes', []) : [];
        $('#qt-saved').innerHTML = all.slice(0, 15).map((q, i) => '<li><button type="button" data-open="' + i + '"><strong data-no-i18n>' + esc(q.no) + '</strong> <span>' + esc(q.cust.cname || 'No customer') + ' · ' + esc(q.date) + '</span><b>' + kes(q.total) + '</b></button></li>').join('');
        $('#qt-saved-note').hidden = pro && all.length > 0;
        $('#qt-saved-note').textContent = pro ? 'Quotes you download are saved here on this device.' : 'With Pro, every quote you download is saved here, so you can reopen, change and resend it.';
    }
    $('#qt-saved').addEventListener('click', (e) => {
        const b = e.target.closest('[data-open]');
        if (!b) return;
        const q = store.get('st-quotes', [])[+b.dataset.open];
        if (!q) return;
        items = q.items.slice(); quoteNo = q.no; committed = true;
        fill(forms.cust, q.cust); store.set('st-cust', q.cust);
        if (items[0]) loadJob(items[0].inputs); else paintQuote();
        $('.nq-quote').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* =====================================================================
       Remembering inputs; switching item type
       ===================================================================== */
    const jobs = store.get('st-jobs', {});   // the last inputs for each type
    let type = 'swing';
    function loadJob(data) {
        const d = Object.assign({}, DEFAULTS[data.type || 'swing'], data);
        forms.job.reset();
        fill(forms.job, d);
        type = d.type || 'swing';
        const radio = $('input[name=type][value="' + type + '"]', forms.job);
        if (radio) radio.checked = true;
        update();
    }
    function saveJob() { jobs[type] = read(forms.job); store.set('st-jobs', jobs); store.set('st-type', type); }

    forms.job.addEventListener('change', (e) => {
        if (e.target.name === 'type') {
            saveJob();
            loadJob(Object.assign({ type: e.target.value }, jobs[e.target.value] || {}, { type: e.target.value }));
            saveJob();
            return;
        }
        update(); saveJob();
    });
    forms.job.addEventListener('input', (e) => { if (e.target.name !== 'type') { update(); saveJob(); } });
    forms.costs.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.sec) prices.len[t.dataset.sec] = num(t.value);
        if (t.name === 'sheet') prices.sheet[read(forms.job).gauge || 'g18'] = num(t.value);
        store.set('st-prices', prices);
        store.set('st-costs', read(forms.costs));
        update();
    });
    forms.costs.addEventListener('change', () => { store.set('st-costs', read(forms.costs)); update(); });
    $('#st-price-rows').addEventListener('focusout', () => setTimeout(() => update(), 0));
    forms.cust.addEventListener('input', () => { store.set('st-cust', read(forms.cust)); paintQuote(); });
    forms.cust.addEventListener('change', () => { store.set('st-cust', read(forms.cust)); paintQuote(); });
    if (forms.biz) forms.biz.addEventListener('input', (e) => { if (e.target.name === 'bprefix' && !committed) quoteNo = ''; paintQuote(); });
    $('#c-reset').addEventListener('click', () => {
        if (!confirm('Put back the example prices? Your own prices on this device will be replaced.')) return;
        prices.len = {}; prices.sheet = {};
        store.set('st-prices', prices);
        forms.costs.reset();
        $('#st-price-rows').innerHTML = '';
        store.set('st-costs', read(forms.costs));
        update();
    });
    [forms.job, forms.costs, forms.cust].forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

    /* ---------- Start ---------- */
    fill(forms.costs, store.get('st-costs', null));
    fill(forms.cust, store.get('st-cust', null));
    const startType = store.get('st-type', 'swing');
    NP.onPlan(() => { paintSaved(); });
    loadJob(Object.assign({ type: startType }, jobs[startType] || {}, { type: startType }));
    NP.start();
})();
