/* =========================================================================
   Sheet-metal quote tool (/quote/)
   Everything is worked out in the browser. Prices, business details and
   (with Pro) saved quotes stay in this device's localStorage.
   Pro licences, the Go Pro window and business details: js/pro.js.
   ========================================================================= */
(function () {
    'use strict';

    const NP = window.NexusPro;
    if (!NP) return;
    const { $, $$, store, esc, num, kes, fmt, today, fill, read, isPro, openPro, nextNumber } = NP;
    const rad = (d) => d * Math.PI / 180;

    /* ---------- Example prices (KES). Fabricators put in their own. ---------- */
    const MATERIALS = {
        ms: { label: 'Mild steel', density: 7850, kg: 160 },
        gi: { label: 'Galvanised steel', density: 7850, kg: 180 },
        ss: { label: 'Stainless steel 304', density: 7930, kg: 600 },
        al: { label: 'Aluminium 5052', density: 2680, kg: 700 }
    };
    const CUTS = {
        laser: { label: 'Laser cutting', rate: 80, pierce: 10 },
        plasma: { label: 'CNC plasma cutting', rate: 50, pierce: 5 },
        shear: { label: 'Shearing', rate: 20, pierce: 0 },
        none: { label: 'No cutting', rate: 0, pierce: 0 }
    };
    const FINISHES = {
        none: { label: 'No finish', rate: 0 },
        powder: { label: 'Powder coating', rate: 1200 },
        paint: { label: 'Spray painting', rate: 600 },
        galv: { label: 'Hot-dip galvanising', rate: 1500 }
    };
    const SHAPES = {
        flat: { flanges: [200], bends: [] },
        L: { flanges: [50, 30], bends: [{ a: 90, d: 1 }] },
        U: { flanges: [25, 60, 25], bends: [{ a: 90, d: 1 }, { a: 90, d: 1 }] },
        Z: { flanges: [30, 50, 30], bends: [{ a: 90, d: 1 }, { a: 90, d: -1 }] },
        hat: { flanges: [20, 30, 40, 30, 20], bends: [{ a: 90, d: -1 }, { a: 90, d: 1 }, { a: 90, d: 1 }, { a: 90, d: -1 }] }
    };
    const EDGE = 10, GAP = 5;   // nesting: margin round the sheet and space between parts (mm)

    const forms = { part: $('#nq-part'), costs: $('#nq-costs'), cust: $('#nq-cust'), biz: $('#nq-biz') };
    if (!forms.part) return;

    /* =====================================================================
       Saved state
       ===================================================================== */
    // Per-material / per-method prices the user typed, so switching back keeps them
    const prices = Object.assign({ kg: {}, cut: {}, pierce: {}, fin: {} }, store.get('prices', {}));
    let flanges = SHAPES.L.flanges.slice();
    let bends = SHAPES.L.bends.map((b) => Object.assign({}, b));
    let items = [];           // parts added to the current quote
    let quoteNo = '';
    let committed = false;    // the current quote's number has been used on a PDF

    /* =====================================================================
       Part editor: flanges and bends
       ===================================================================== */
    const list = $('#q-flanges');
    function drawFlanges() {
        list.innerHTML = flanges.map((f, i) => {
            const b = bends[i];
            return '<li><div class="nq-flange">' +
                '<label><span>Flange ' + (i + 1) + '</span><input type="number" inputmode="decimal" step="any" min="0" data-f="' + i + '" value="' + esc(f) + '" aria-label="Flange ' + (i + 1) + ' outside length (mm)"></label>' +
                (b ? '<label><span>then bend</span><input type="number" inputmode="decimal" step="any" min="1" max="179" data-a="' + i + '" value="' + esc(b.a) + '" aria-label="Bend ' + (i + 1) + ' angle (degrees)"><em>°</em></label>' +
                    '<label><span class="sr-only">Direction</span><select data-d="' + i + '" aria-label="Bend ' + (i + 1) + ' direction"><option value="1"' + (b.d > 0 ? ' selected' : '') + '>up</option><option value="-1"' + (b.d < 0 ? ' selected' : '') + '>down</option></select></label>' : '') +
                (flanges.length > 1 ? '<button type="button" class="nq-x" data-rm="' + i + '" aria-label="Remove flange ' + (i + 1) + '"><svg aria-hidden="true"><use href="#i-close"/></svg></button>' : '') +
                '</div></li>';
        }).join('');
    }
    list.addEventListener('input', (e) => {
        const t = e.target;
        if (t.dataset.f !== undefined) flanges[+t.dataset.f] = num(t.value);
        if (t.dataset.a !== undefined) bends[+t.dataset.a].a = num(t.value);
        if (t.dataset.d !== undefined) bends[+t.dataset.d].d = num(t.value, 1);
        update();
    });
    list.addEventListener('change', (e) => { if (e.target.dataset.d !== undefined) { bends[+e.target.dataset.d].d = num(e.target.value, 1); update(); } });
    list.addEventListener('click', (e) => {
        const rm = e.target.closest('[data-rm]');
        if (!rm) return;
        const i = +rm.dataset.rm;
        flanges.splice(i, 1);
        bends.splice(Math.min(i, bends.length - 1), 1);
        drawFlanges(); update();
    });
    $('#q-add-flange').addEventListener('click', () => {
        if (flanges.length >= 12) return;
        bends.push({ a: 90, d: 1 });
        flanges.push(30);
        drawFlanges(); update();
        const last = $$('[data-f]', list).pop();
        if (last) last.focus();
    });
    $$('[data-shape]').forEach((b) => b.addEventListener('click', () => {
        const s = SHAPES[b.dataset.shape];
        flanges = s.flanges.slice();
        bends = s.bends.map((x) => Object.assign({}, x));
        drawFlanges(); update();
    }));

    /* =====================================================================
       The maths
       ===================================================================== */
    function compute() {
        const p = read(forms.part), c = read(forms.costs);
        const T = num(p.t), R = num(p.r), K = num(p.k), W = num(p.w), qty = Math.max(1, Math.round(num(p.qty, 1)));
        const errors = [], warn = [];
        if (!(T > 0)) errors.push('Enter the material thickness.');
        if (!(W > 0)) errors.push('Enter the width along the bend.');
        if (K < 0 || K > 1) errors.push('The K-factor should be between 0 and 1.');
        if (flanges.some((f) => !(f > 0))) errors.push('Every flange needs a length.');
        if (bends.some((b) => !(b.a >= 1 && b.a <= 179))) errors.push('Bend angles must be between 1° and 179°.');
        if (errors.length) return { errors };

        const bd = bends.map((b) => {
            const ba = rad(b.a) * (R + K * T), ossb = Math.tan(rad(b.a) / 2) * (R + T);
            return { ba, ossb, bd: 2 * ossb - ba, a: b.a, d: b.d };
        });
        const L = flanges.reduce((a, f) => a + f, 0) - bd.reduce((a, b) => a + b.bd, 0);
        // Straight lengths between bends on the flat blank, and where each bend line sits
        const straight = flanges.map((f, i) => f - (i > 0 ? bd[i - 1].ossb : 0) - (i < bd.length ? bd[i].ossb : 0));
        const lines = [];
        let x = 0;
        straight.forEach((s, i) => { x += s; if (bd[i]) { lines.push(x + bd[i].ba / 2); x += bd[i].ba; } });
        if (straight.some((s) => s < 0)) errors.push('A flange is shorter than its bend, so the part cannot be bent as drawn. Make the short flanges longer.');
        else if (bd.length && straight.some((s) => s < 2 * T)) warn.push('A flange is very short for its thickness. Check that your press-brake tooling can hold it.');
        if (bd.length && R < T * 0.5 && MATERIALS[c.mat] && c.mat === 'al') warn.push('Aluminium bent this tight can crack. An inside radius of at least the thickness is safer.');
        if (errors.length) return { errors };

        const mat = MATERIALS[c.mat] || MATERIALS.ms;
        const [SW, SL] = String(c.sheet || '1220x2440').split('x').map(Number);
        const areaM2 = L * W / 1e6;
        const weight = L * W * T * mat.density / 1e9;   // kg per part
        const fit = (a, b) => Math.floor((SW - 2 * EDGE + GAP) / (a + GAP)) * Math.floor((SL - 2 * EDGE + GAP) / (b + GAP));
        const perSheet = Math.max(fit(W, L), fit(L, W));
        const kgPrice = num(c.kg);
        const sheetPrice = num(c.sprice) > 0 ? num(c.sprice) : SW * SL * T * mat.density / 1e9 * kgPrice;
        let sheets = 0, matCost, util = 0;
        if (perSheet < 1) {
            if (c.charge === 'sheet') return { errors: ['The blank (' + fmt(L, 1) + ' × ' + fmt(W, 1) + ' mm) is bigger than the sheet. Choose a bigger sheet or charge by weight.'] };
            warn.push('The blank is bigger than the chosen sheet.');
        } else {
            sheets = Math.ceil(qty / perSheet);
            util = qty * L * W / (sheets * SW * SL);
        }
        if (c.charge === 'sheet') matCost = sheets * sheetPrice;
        else matCost = qty * weight * kgPrice * (1 + num(c.scrap) / 100);
        if (c.charge === 'sheet' && util < 0.45 && qty > 1) warn.push('Only ' + Math.round(util * 100) + '% of the sheet is used. If you can sell the offcut, charging by weight may be fairer.');

        const holes = Math.max(0, Math.round(num(p.holes)));
        const cut = CUTS[c.cut] || CUTS.laser;
        const cutM = (2 * (L + W) + num(p.hcut)) / 1000;
        const cutCost = c.cut === 'none' ? 0 : qty * (cutM * num(c.cutrate) + (c.cut === 'shear' ? 0 : (holes + 1) * num(c.pierce)));
        const bendCost = qty * bends.length * num(c.bend);
        const fin = FINISHES[c.fin] || FINISHES.none;
        const finCost = c.fin === 'none' ? 0 : qty * areaM2 * num(c.sides, 2) * num(c.finrate);
        const labour = qty * num(c.labour);
        const setup = num(c.setup);
        const cost = matCost + cutCost + bendCost + finCost + labour + setup;
        const m = 1 + num(c.markup) / 100;
        const price = cost * m;

        const desc = [mat.label + ' ' + fmt(T, 2) + ' mm', 'blank ' + fmt(L, 1) + ' × ' + fmt(W, 1) + ' mm',
            bends.length ? bends.length + ' bend' + (bends.length > 1 ? 's' : '') : 'flat', c.cut !== 'none' ? cut.label.toLowerCase() : '',
            c.fin !== 'none' ? fin.label.toLowerCase() : ''].filter(Boolean).join(', ');
        return {
            errors: [], warn, T, R, K, W, L, qty, bd, lines, weight, areaM2, perSheet, sheets, util, sheetPrice, SW, SL, cutM, holes,
            lines_: [
                ['Material: ' + mat.label + ' ' + fmt(T, 2) + ' mm' + (c.charge === 'sheet' ? ', ' + sheets + ' sheet' + (sheets === 1 ? '' : 's') + ' ' + SW + ' × ' + SL : ', ' + fmt(qty * weight, 1) + ' kg + ' + num(c.scrap) + '% scrap'), matCost],
                [cut.label + (c.cut !== 'none' ? ': ' + fmt(cutM * qty, 1) + ' m' + (c.cut === 'shear' ? '' : ', ' + (holes + 1) * qty + ' pierces') : ''), cutCost],
                ['Bending: ' + bends.length * qty + ' bends', bendCost],
                [fin.label + (c.fin !== 'none' ? ': ' + fmt(areaM2 * num(c.sides, 2) * qty, 2) + ' m²' : ''), finCost],
                ['Other labour', labour],
                ['Set-up', setup]
            ].filter((l) => l[1] > 0),
            cost, markup: m, price, unit: price / qty, desc,
            name: String(p.name || 'Part').trim() || 'Part',
            profile: bends.map((b, i) => ({ f: flanges[i], a: b.a, d: b.d })).concat([{ f: flanges[flanges.length - 1] }])
        };
    }

    /* =====================================================================
       Drawings (SVG strings, used on screen and in the PDF)
       ===================================================================== */
    function profileSvg(r) {
        if (!r.bd.length) {
            return '<svg viewBox="0 0 300 70" role="img" aria-label="Flat plate"><rect x="20" y="28" width="260" height="10" rx="2" fill="#13a89e" opacity=".85"/><text x="150" y="60" text-anchor="middle" font-size="12" fill="currentColor">' + fmt(r.L, 1) + ' mm</text></svg>';
        }
        const pts = [[0, 0]];
        let dir = 0, x = 0, y = 0;
        r.profile.forEach((s) => {
            x += Math.cos(dir) * s.f; y += Math.sin(dir) * s.f;
            pts.push([x, y]);
            if (s.a) dir -= s.d * rad(s.a);
        });
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const span = Math.max(maxX - minX, maxY - minY, 1), pad = span * 0.16;
        const vb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad];
        const sw = span / 50, fs = span / 9;
        const labels = r.profile.map((s, i) => {
            const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len * fs * 0.9, ny = dx / len * fs * 0.9;
            return '<text x="' + (mx + nx).toFixed(2) + '" y="' + (my + ny + fs * 0.35).toFixed(2) + '" text-anchor="middle" font-size="' + fs.toFixed(2) + '" fill="currentColor">' + fmt(s.f, 1) + '</text>';
        }).join('');
        return '<svg viewBox="' + vb.map((v) => v.toFixed(2)).join(' ') + '" role="img" aria-label="Side view of the bent part">' +
            '<polyline points="' + pts.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ') + '" fill="none" stroke="#13a89e" stroke-width="' + sw.toFixed(2) + '" stroke-linejoin="round" stroke-linecap="round"/>' + labels + '</svg>';
    }
    function flatSvg(r) {
        const Wd = 300, maxH = 150, s = Math.min((Wd - 60) / r.L, (maxH - 40) / r.W);
        const w = r.L * s, h = r.W * s, x0 = (Wd - w) / 2, y0 = 14, H = y0 + h + 34;
        const bl = r.lines.map((x) => '<line x1="' + (x0 + x * s).toFixed(1) + '" y1="' + y0 + '" x2="' + (x0 + x * s).toFixed(1) + '" y2="' + (y0 + h).toFixed(1) + '" stroke="#ff6b4a" stroke-width="1.2" stroke-dasharray="4 3"/>').join('');
        return '<svg viewBox="0 0 ' + Wd + ' ' + H.toFixed(0) + '" role="img" aria-label="Flat blank ' + fmt(r.L, 1) + ' by ' + fmt(r.W, 1) + ' millimetres">' +
            '<rect x="' + x0.toFixed(1) + '" y="' + y0 + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="rgba(19,168,158,.12)" stroke="#13a89e" stroke-width="1.5"/>' + bl +
            '<text x="' + (Wd / 2) + '" y="' + (y0 + h + 22).toFixed(1) + '" text-anchor="middle" font-size="12" fill="currentColor">' + fmt(r.L, 1) + ' mm</text>' +
            '<text x="' + (x0 - 8).toFixed(1) + '" y="' + (y0 + h / 2 + 4).toFixed(1) + '" text-anchor="end" font-size="12" fill="currentColor">' + fmt(r.W, 1) + '</text></svg>';
    }

    /* =====================================================================
       Screen
       ===================================================================== */
    let current = null;
    function update() {
        const r = compute();
        current = r.errors.length ? null : r;
        const err = $('#r-error');
        err.hidden = !r.errors.length;
        err.textContent = r.errors.join(' ');
        $('#q-add').disabled = !current;
        if (!current) {
            ['#r-unit', '#r-total', '#r-blank', '#r-weight', '#r-nest', '#r-sheets'].forEach((s) => { $(s).textContent = '–'; });
            $('#r-warn').innerHTML = ''; $('#r-break').innerHTML = '';
            paintQuote();
            return;
        }
        $('#r-unit').textContent = kes(r.unit);
        $('#r-qty').textContent = r.qty;
        $('#r-total').textContent = kes(r.price);
        $('#r-blank').textContent = fmt(r.L, 1) + ' × ' + fmt(r.W, 1) + ' mm';
        $('#r-weight').textContent = fmt(r.weight, 2) + ' kg';
        $('#r-nest').textContent = r.perSheet > 0 ? String(r.perSheet) : '–';
        $('#r-sheets').textContent = r.sheets ? r.sheets + ' (' + Math.round(r.util * 100) + '% used)' : '–';
        $('#r-warn').innerHTML = r.warn.map((w) => '<li>' + esc(w) + '</li>').join('');
        $('#r-profile').innerHTML = profileSvg(r);
        $('#r-flat').innerHTML = flatSvg(r);
        $('#r-break').innerHTML = r.lines_.map((l) => '<tr><td>' + esc(l[0]) + '</td><td>' + kes(l[1]) + '</td></tr>').join('') +
            '<tr class="is-sub"><td>Your cost</td><td>' + kes(r.cost) + '</td></tr>' +
            '<tr><td>Markup ' + fmt((r.markup - 1) * 100, 1) + '%</td><td>' + kes(r.price - r.cost) + '</td></tr>' +
            '<tr class="is-sub"><td>Price for ' + r.qty + ' part' + (r.qty === 1 ? '' : 's') + '</td><td>' + kes(r.price) + '</td></tr>' +
            (bendSummary(r));
        paintQuote();
    }
    const bendSummary = (r) => r.bd.length ? '<tr class="is-note"><td colspan="2">Bend deduction ' + r.bd.map((b) => fmt(b.bd, 2)).join(', ') + ' mm · bend lines at ' + r.lines.map((x) => fmt(x, 1)).join(', ') + ' mm from the left</td></tr>' : '';

    function snapshot(r) {
        return {
            name: r.name, desc: r.desc, qty: r.qty, unit: r.unit, total: r.price, L: r.L, W: r.W,
            lines: r.lines_.map((l) => [l[0], l[1] * r.markup]),
            svg: profileSvg(r), flat: flatSvg(r),
            inputs: { part: read(forms.part), costs: read(forms.costs), flanges: flanges.slice(), bends: bends.map((b) => Object.assign({}, b)) }
        };
    }
    function quoteParts() { return items.length ? items : (current ? [snapshot(current)] : []); }
    function totals(parts) {
        const c = read(forms.costs);
        const sub = parts.reduce((a, p) => a + p.total, 0);
        const delivery = num(c.delivery);
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
            '<div><dt>Parts</dt><dd>' + kes(t.sub) + '</dd></div>' +
            (t.delivery ? '<div><dt>Delivery</dt><dd>' + kes(t.delivery) + '</dd></div>' : '') +
            (t.vat ? '<div><dt>VAT 16%</dt><dd>' + kes(t.vat) + '</dd></div>' : '') +
            '<div class="is-total"><dt>Total</dt><dd>' + kes(t.total) + '</dd></div>' : '';
        $('#qt-pdf').disabled = !parts.length;
        $('#qt-wa').disabled = !parts.length;
    }
    $('#qt-items').addEventListener('click', (e) => {
        const d = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]');
        if (d) { items.splice(+d.dataset.del, 1); paintQuote(); }
        if (ed) {
            const it = items.splice(+ed.dataset.edit, 1)[0];
            loadInputs(it.inputs);
            paintQuote();
            forms.part.scrollIntoView({ behavior: 'smooth', block: 'start' });
            $('#q-add span').textContent = 'Put this part back in the quote';
        }
    });
    function loadInputs(inp) {
        fill(forms.part, inp.part);
        fill(forms.costs, inp.costs);
        flanges = inp.flanges.slice();
        bends = inp.bends.map((b) => Object.assign({}, b));
        drawFlanges(); update();
    }
    $('#q-add').addEventListener('click', () => {
        if (!current) return;
        items.push(snapshot(current));
        $('#q-add span').textContent = 'Add this part to the quote';
        paintQuote();
        const btn = $('#q-add');
        btn.classList.add('is-done');
        setTimeout(() => btn.classList.remove('is-done'), 900);
    });
    $('#qt-new').addEventListener('click', () => {
        if (items.length && !confirm('Start a new, empty quote?')) return;
        items = []; quoteNo = ''; committed = false; forms.cust.reset(); saveCust(); paintQuote();
    });

    /* =====================================================================
       PDF quote (the browser's "Save as PDF")
       ===================================================================== */
    function quoteHtml(parts) {
        const c = read(forms.cust), t = totals(parts);
        const rows = parts.map((p) => {
            const main = '<tr><td><strong>' + esc(p.name) + '</strong><small>' + esc(p.desc) + '</small></td><td class="n">' + p.qty + '</td><td class="n">' + kes(p.unit) + '</td><td class="n">' + kes(p.total) + '</td></tr>';
            if (!c.itemise) return main;
            return '<tr><td colspan="4"><strong>' + esc(p.name) + '</strong> × ' + p.qty + '<small>' + esc(p.desc) + '</small></td></tr>' +
                p.lines.map((l) => '<tr class="sub"><td>' + esc(l[0]) + '</td><td></td><td></td><td class="n">' + kes(l[1]) + '</td></tr>').join('');
        }).join('');
        const sketches = parts.slice(0, 4).map((p) => '<figure><div class="sk">' + p.svg + '</div><div class="sk">' + p.flat + '</div><figcaption>' + esc(p.name) + ': blank ' + fmt(p.L, 1) + ' × ' + fmt(p.W, 1) + ' mm</figcaption></figure>').join('');
        return NP.docTop({ no: quoteNo, validDays: c.valid, cust: c }) +
            '<table class="qd-table"><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr></thead><tbody>' + rows +
                (t.delivery ? '<tr><td>Delivery</td><td class="n">1</td><td class="n">' + kes(t.delivery) + '</td><td class="n">' + kes(t.delivery) + '</td></tr>' : '') + '</tbody>' +
                '<tfoot>' + (t.vat ? '<tr><td colspan="3">Subtotal</td><td class="n">' + kes(t.sub + t.delivery) + '</td></tr><tr><td colspan="3">VAT 16%</td><td class="n">' + kes(t.vat) + '</td></tr>' : '') +
                '<tr class="tot"><td colspan="3">Total' + (t.vat ? ' (incl. VAT)' : '') + '</td><td class="n">' + kes(t.total) + '</td></tr></tfoot></table>' +
            '<section class="qd-sketch">' + sketches + '</section>' +
            NP.docBottom({ notes: c.notes, small: 'Prices in Kenya shillings. Dimensions are outside sizes in millimetres; flat blank sizes are calculated and may be adjusted to suit the tooling.', tool: 'sheet-metal quote tool', path: 'quote' });
    }

    $('#qt-pdf').addEventListener('click', () => {
        const parts = quoteParts();
        if (!parts.length || !NP.pdfAllowed()) return;
        // Use up its number (once), count it and, with Pro, save it
        if (!committed) { quoteNo = nextNumber(true); committed = true; }
        NP.countPdf();
        if (isPro()) saveQuote(parts);
        NP.printDoc(quoteHtml(parts), quoteNo + ' ' + (read(forms.cust).cname || 'quote'));
        paintQuote();
        NP.track('quote-pdf' + (isPro() ? '-pro' : ''));
    });

    /* ---------- WhatsApp ---------- */
    $('#qt-wa').addEventListener('click', () => {
        const parts = quoteParts();
        if (!parts.length) return;
        const c = read(forms.cust), b = NP.biz(), t = totals(parts);
        const lines = ['*Quotation ' + quoteNo + '*' + (b.bname ? ' from ' + b.bname : ''), c.cname ? 'For: ' + c.cname : '', ''];
        parts.forEach((p) => { lines.push('• ' + p.name + ' × ' + p.qty + ' @ ' + kes(p.unit) + ' = ' + kes(p.total)); lines.push('   ' + p.desc); });
        if (t.delivery) lines.push('• Delivery: ' + kes(t.delivery));
        if (t.vat) lines.push('VAT 16%: ' + kes(t.vat));
        lines.push('', '*Total: ' + kes(t.total) + '*', 'Valid for ' + Math.max(1, num(c.valid, 14)) + ' days.');
        if (c.notes) lines.push(c.notes);
        if (isPro() && b.bpay) lines.push('Payment: ' + b.bpay);
        window.open(NP.waLink(c.cphone, lines.filter((l, i) => l || i > 1).join('\n')), '_blank', 'noopener');
        NP.track('quote-whatsapp');
    });

    /* ---------- Saved quotes (Pro) ---------- */
    function saveQuote(parts) {
        const all = store.get('quotes', []);
        const c = read(forms.cust);
        const entry = { no: quoteNo, date: today(), cust: c, total: totals(parts).total, items: parts.map((p) => Object.assign({}, p)) };
        const i = all.findIndex((q) => q.no === quoteNo);
        if (i > -1) all.splice(i, 1);
        all.unshift(entry);
        all.length = Math.min(all.length, 60);
        while (!store.set('quotes', all) && all.length > 1) all.pop();   // storage full: drop the oldest
        paintSaved();
    }
    function paintSaved() {
        const ul = $('#qt-saved'), pro = isPro(), all = pro ? store.get('quotes', []) : [];
        ul.innerHTML = all.slice(0, 15).map((q, i) => '<li><button type="button" data-open="' + i + '"><strong data-no-i18n>' + esc(q.no) + '</strong> <span>' + esc(q.cust.cname || 'No customer') + ' · ' + esc(q.date) + '</span><b>' + kes(q.total) + '</b></button></li>').join('');
        $('#qt-saved-note').hidden = pro && all.length > 0;
        $('#qt-saved-note').textContent = pro ? 'Quotes you download are saved here on this device.' : 'With Pro, every quote you download is saved here, so you can reopen, change and resend it.';
    }
    $('#qt-saved').addEventListener('click', (e) => {
        const b = e.target.closest('[data-open]');
        if (!b) return;
        const q = store.get('quotes', [])[+b.dataset.open];
        if (!q) return;
        items = q.items.slice(); quoteNo = q.no; committed = true;
        fill(forms.cust, q.cust); saveCust();
        if (items[0]) loadInputs(items[0].inputs); else paintQuote();
        $('.nq-quote').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* =====================================================================
       Remembering prices and details
       ===================================================================== */
    const costs = forms.costs.elements;
    let lastMat = '', lastCut = '', lastFin = '';
    function applyDefaults(force) {
        const mat = costs.mat.value, cut = costs.cut.value, fin = costs.fin.value;
        if (force || mat !== lastMat) costs.kg.value = prices.kg[mat] != null ? prices.kg[mat] : MATERIALS[mat].kg;
        if (force || cut !== lastCut) {
            costs.cutrate.value = prices.cut[cut] != null ? prices.cut[cut] : CUTS[cut].rate;
            costs.pierce.value = prices.pierce[cut] != null ? prices.pierce[cut] : CUTS[cut].pierce;
            costs.cutrate.disabled = costs.pierce.disabled = cut === 'none';
            if (cut === 'shear') costs.pierce.disabled = true;
        }
        if (force || fin !== lastFin) {
            costs.finrate.value = prices.fin[fin] != null ? prices.fin[fin] : FINISHES[fin].rate;
            costs.finrate.disabled = costs.sides.disabled = fin === 'none';
        }
        lastMat = mat; lastCut = cut; lastFin = fin;
    }
    function saveCosts() {
        const c = read(forms.costs);
        prices.kg[c.mat] = num(c.kg);
        if (c.cut !== 'none') { prices.cut[c.cut] = num(c.cutrate); prices.pierce[c.cut] = num(c.pierce); }
        if (c.fin !== 'none') prices.fin[c.fin] = num(c.finrate);
        store.set('prices', prices);
        store.set('costs', c);
    }
    const saveCust = () => store.set('cust', read(forms.cust));
    const savePart = () => store.set('part', { part: read(forms.part), flanges, bends });

    forms.part.addEventListener('input', () => { update(); savePart(); });
    forms.costs.addEventListener('change', (e) => { if (/^(mat|cut|fin)$/.test(e.target.name)) applyDefaults(false); update(); saveCosts(); });
    forms.costs.addEventListener('input', (e) => { if (!/^(mat|cut|fin)$/.test(e.target.name)) { update(); saveCosts(); } });
    forms.cust.addEventListener('input', () => { paintQuote(); saveCust(); });
    forms.cust.addEventListener('change', () => { paintQuote(); saveCust(); });
    forms.biz.addEventListener('input', (e) => { if (e.target.name === 'bprefix' && !committed) quoteNo = ''; paintQuote(); });
    $('#q-reset-prices').addEventListener('click', () => {
        if (!confirm('Put back the example prices? Your own prices on this device will be replaced.')) return;
        prices.kg = {}; prices.cut = {}; prices.pierce = {}; prices.fin = {};
        forms.costs.reset();
        applyDefaults(true); saveCosts(); update();
    });
    [forms.part, forms.costs, forms.cust].forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

    /* =====================================================================
       Start
       ===================================================================== */
    const saved = store.get('part', null);
    if (saved && saved.flanges && saved.flanges.length) { fill(forms.part, saved.part); flanges = saved.flanges; bends = saved.bends || []; }
    while (bends.length < flanges.length - 1) bends.push({ a: 90, d: 1 });
    bends.length = Math.max(0, flanges.length - 1);
    const sc = store.get('costs', null);
    if (sc) fill(forms.costs, sc);
    lastMat = costs.mat.value; lastCut = costs.cut.value; lastFin = costs.fin.value;
    if (!sc) applyDefaults(true); else {
        costs.cutrate.disabled = costs.pierce.disabled = lastCut === 'none';
        if (lastCut === 'shear') costs.pierce.disabled = true;
        costs.finrate.disabled = costs.sides.disabled = lastFin === 'none';
    }
    fill(forms.cust, store.get('cust', null));
    drawFlanges();
    NP.onPlan(() => { paintSaved(); paintQuote(); });
    update();
    NP.start();
})();
