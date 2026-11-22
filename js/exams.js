/* =========================================================================
   SolidWorks exam practice (/exams/): CSWA-style practice tests.
   Original questions (not from the real exam). Two kinds:
     - theory: multiple choice on drawings, sketching, features, assemblies, mass
     - modelling: a dimensioned drawing with new random sizes every attempt;
       the student models it and enters the mass. The exact mass is worked
       out here, and answers within 1% count as right.
   Free: the sample test and a CSWP-style demo. The exam pass (js/pro.js,
   plan "Exams") opens the full exams, the endless exam generator (parts in
   3 stages, centre of mass, generated theory: js/exam-gen.js), practice by
   topic and the printable summary. Attempts and scores stay on the device.
   ========================================================================= */
(function () {
    'use strict';

    const NP = window.NexusPro;
    if (!NP || !document.getElementById('ex-home')) return;
    const { $, $$, store, esc, fmt, isPro, openPro } = NP;
    const EG = window.ExamGen;
    const rnd = (a, b, step) => { step = step || 1; return a + step * Math.floor(Math.random() * (Math.floor((b - a) / step) + 1)); };
    const even = (a, b) => rnd(Math.ceil(a / 2) * 2, b, 2);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const PI = Math.PI;

    /* =====================================================================
       Theory questions (original)
       ===================================================================== */
    const THEORY = [
        ['Drawings', 'In third-angle projection (common on ANSI drawings), where is the top view placed?', ['Above the front view', 'Below the front view', 'To the left of the front view', 'Anywhere, as long as it is labelled'], 'In third-angle projection the top view goes above the front view and the right view to its right. In first-angle (ISO) it is the other way round.'],
        ['Drawings', 'Which projection method is the default on ISO drawings, used widely in Kenya and Europe?', ['First-angle', 'Third-angle', 'Isometric', 'Oblique'], 'ISO drawings normally use first-angle projection; the symbol in the title block tells you which one a drawing uses.'],
        ['Drawings', 'On an engineering drawing, a thin dashed line usually shows…', ['Edges hidden from view', 'The centre of a hole', 'Where a section is cut', 'Parts of a nearby component'], 'Dashed lines are hidden lines. Centre lines are long-and-short dashes; cutting planes are thick with arrows.'],
        ['Drawings', 'A thin line of alternating long and short dashes is a…', ['Centre line', 'Hidden line', 'Break line', 'Dimension line'], 'Centre lines mark axes of holes and cylinders and lines of symmetry.'],
        ['Drawings', 'What does "4X Ø10 THRU" on a drawing mean?', ['Four holes of 10 mm diameter that go all the way through', 'One 10 mm hole, drilled four times deeper', 'Four 10 mm deep holes', 'A 10 mm radius on four corners'], '"4X" means four of the same feature, "Ø" means diameter and "THRU" means through the whole part.'],
        ['Drawings', 'An auxiliary view is used to…', ['Show the true size and shape of an inclined face', 'Show a small area enlarged', 'Show the inside of a part', 'Show the part in 3D'], 'An inclined face looks shortened in the standard views; an auxiliary view looks straight at it.'],
        ['Drawings', 'A detail view is used to…', ['Show a small area of a view at a larger scale', 'Show hidden edges', 'Show a part with a quarter cut away', 'List the parts in an assembly'], 'Detail views circle an area and redraw it at a larger scale, e.g. 2:1.'],
        ['Drawings', 'A drawing scale of 1:2 means the drawing is…', ['Half the real size', 'Twice the real size', 'The real size', 'Scaled differently in each direction'], 'The first number is the drawing, the second is the real part: 1 mm on paper is 2 mm on the part.'],
        ['Drawings', 'Which view best shows the inside grooves and steps of a turned shaft or bushing?', ['A section view cut along its axis', 'The top view', 'An isometric view', 'A detail view of the outside'], 'Cutting along the axis shows the inside profile with solid lines instead of confusing hidden lines.'],
        ['Sketching', 'In SolidWorks, what colour are the lines of a fully defined sketch?', ['Black', 'Blue', 'Red', 'Yellow'], 'Blue = under defined (can still move), black = fully defined, red/yellow = over defined or a problem.'],
        ['Sketching', 'Which sketch relation makes two circles share the same centre point?', ['Concentric', 'Tangent', 'Equal', 'Collinear'], 'Concentric = same centre. Coradial = same centre AND the same radius.'],
        ['Sketching', 'What is the difference between Concentric and Coradial?', ['Coradial also forces the same radius', 'Concentric also forces the same radius', 'There is no difference', 'Coradial only works on arcs in different sketches'], 'Coradial is concentric plus equal radius.'],
        ['Sketching', 'What do you need before you can use Mirror Entities in a sketch?', ['A line or centreline to mirror about', 'A fully defined sketch', 'An existing feature', 'A reference plane at 90°'], 'Mirror Entities copies the selected entities about a line or centreline and adds symmetric relations.'],
        ['Sketching', 'What is construction geometry in a sketch used for?', ['Helping to position and size other geometry; it is not used to make the feature', 'Making thin walls', 'Making the feature twice as thick', 'Marking the sketch as finished'], 'Construction lines (shown dashed) guide the sketch but are ignored when the feature is built.'],
        ['Sketching', 'Which relation keeps two lines at 90° to each other?', ['Perpendicular', 'Parallel', 'Collinear', 'Coincident'], 'Perpendicular = 90°. Parallel = same direction. Collinear = on the same infinite line.'],
        ['Features', 'The "Mid Plane" end condition of an Extruded Boss…', ['Extrudes equally in both directions from the sketch plane', 'Extrudes to the middle of the part', 'Extrudes half the distance you type', 'Extrudes up to the next face'], 'Mid Plane is handy for symmetric parts: a 40 mm mid-plane extrusion goes 20 mm each side.'],
        ['Features', 'A Revolve feature needs…', ['A sketch and an axis (centreline or edge) it does not cross', 'Two sketches on parallel planes', 'A sketch and a path', 'A face to shell'], 'The profile spins about the axis; it must stay on one side of it.'],
        ['Features', 'What does the Shell feature do?', ['Hollows the part, leaving walls of a set thickness and removing the faces you pick', 'Adds a thin skin of material on the outside', 'Makes a sheet-metal version of the part', 'Rounds all the edges'], 'Shell is the quick way to make boxes, covers and housings.'],
        ['Features', 'Why use the Hole Wizard instead of sketching a circle and cutting?', ['It makes standard holes (counterbored, countersunk, tapped) with the right sizes and drawing callouts', 'It is the only way to make a through hole', 'It makes the part lighter', 'It works without a sketch plane'], 'Hole Wizard holes carry their standard size and type, so drawings label them correctly.'],
        ['Features', 'A Sweep feature needs…', ['A profile and a path', 'Two or more profiles', 'A profile and an axis', 'A face and a thickness'], 'Sweep moves one profile along a path. Loft blends between two or more profiles.'],
        ['Features', 'The Draft feature is used to…', ['Taper faces so a moulded or cast part can come out of the mould', 'Make a quick sketch of the part', 'Show the part in a drawing', 'Thin a wall'], 'Draft angles (often 1–3°) let parts release from moulds and casting patterns.'],
        ['Features', 'What does a Linear Pattern do?', ['Copies features in rows along one or two directions', 'Copies features around an axis', 'Mirrors a feature about a plane', 'Makes a feature longer'], 'Circular Pattern copies around an axis; Mirror copies about a plane.'],
        ['Features', 'Which end condition cuts through the whole part in one direction, whatever its size?', ['Through All', 'Blind', 'Up To Vertex', 'Offset From Surface'], 'Through All keeps working if the part gets thicker later; a Blind depth would not.'],
        ['Features', 'What is the difference between a fillet and a chamfer?', ['A fillet rounds an edge; a chamfer bevels it with a flat angled face', 'A fillet bevels; a chamfer rounds', 'Fillets only work inside corners', 'Chamfers only work on holes'], 'Both remove sharp edges; fillets give a radius, chamfers a flat cut (e.g. 1 × 45°).'],
        ['Assemblies', 'In a new assembly, the first component you insert is…', ['Fixed in place', 'Free to move in all directions', 'Mated to the origin by a concentric mate', 'Hidden'], 'The first component is fixed (shown with (f)); others are positioned with mates.'],
        ['Assemblies', 'How many degrees of freedom does a free rigid body have in space?', ['6', '3', '4', '12'], 'Three translations (x, y, z) and three rotations about x, y and z.'],
        ['Assemblies', 'A concentric mate between a pin and a hole still lets the pin…', ['Turn about the axis and slide along it', 'Only turn', 'Only slide', 'Do nothing: it is fully fixed'], 'Concentric removes 4 degrees of freedom and leaves rotation and sliding along the axis.'],
        ['Assemblies', 'A coincident mate between two flat faces makes them…', ['Touch, lying in the same plane', 'Parallel at a set distance', 'At 90° to each other', 'Share the same centre'], 'Coincident puts the faces in the same plane; Distance keeps them a set gap apart.'],
        ['Assemblies', 'What does Interference Detection in an assembly find?', ['Parts that overlap each other', 'Parts with missing mates', 'Parts with no material', 'Parts that are too far apart'], 'Overlapping volumes usually mean a design mistake or wrong mates.'],
        ['Assemblies', 'An exploded view…', ['Shows the parts pulled apart to show how they go together', 'Shows the parts that failed in a simulation', 'Deletes the mates', 'Shows the part in section'], 'Exploded views are used in assembly instructions and on drawings with a bill of materials.'],
        ['Mass & units', 'What does the unit system "MMGS" stand for?', ['Millimetre, gram, second', 'Metre, megagram, second', 'Millimetre, gigapascal, second', 'Millimetre, gram, standard'], 'MMGS is the usual choice for exam mass questions: lengths in mm and mass in grams.'],
        ['Mass & units', 'AISI 1020 steel has a density of 7900 kg/m³. In g/mm³ that is…', ['0.0079', '7.9', '0.79', '0.000079'], '7900 kg/m³ = 7 900 000 g / 1 000 000 000 mm³ = 0.0079 g/mm³.'],
        ['Mass & units', 'If you double every dimension of a solid part, its mass becomes…', ['8 times bigger', '2 times bigger', '4 times bigger', '6 times bigger'], 'Volume grows with the cube of the scale: 2 × 2 × 2 = 8.'],
        ['Mass & units', 'A part weighs 100 g in 6061 aluminium (2700 kg/m³). About how much in AISI 1020 steel (7900 kg/m³)?', ['293 g', '34 g', '100 g', '527 g'], 'Same volume, so mass scales with density: 100 × 7900 / 2700 ≈ 293 g.'],
        ['Mass & units', 'The centre of mass of a part made of one uniform material depends on…', ['Its shape only', 'Its material only', 'Both shape and material', 'The units chosen'], 'With one uniform density, the centre of mass is the centre of the volume.'],
        ['Mass & units', 'In Mass Properties, the mass is wrong but the volume is right. What is the most likely cause?', ['The wrong material (density) is applied', 'A missing fillet', 'The wrong unit for angles', 'The sketch is under defined'], 'Mass = volume × density. A right volume and a wrong mass points to the material.'],
        ['Features', 'What are configurations in a SolidWorks part?', ['Different versions of the part (e.g. sizes) kept in one file', 'Copies of the file in different folders', 'Saved camera views', 'Assembly mates'], 'Configurations let one file hold, for example, M8, M10 and M12 versions of a bolt.'],
        ['Features', 'Why link dimensions with equations or global variables?', ['So changing one value updates all the related dimensions', 'To make the part heavier', 'To hide dimensions on drawings', 'To speed up rendering'], 'Equations capture design intent, e.g. hole spacing = width − 2 × edge distance.']
    ].map((q, i) => ({ id: 't' + i, topic: q[0], q: q[1], options: q[2], explain: q[3] }));

    /* =====================================================================
       Drawing helper: views in millimetres, scaled to fit
       ===================================================================== */
    function Draft(size) {
        const els = [], box = [Infinity, Infinity, -Infinity, -Infinity];
        const fs = Math.max(size / 17, 3), off = fs * 1.9, ah = fs * 0.55;
        const grow = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
        const n = (v) => +v.toFixed(2);
        const cls = { o: 'o', h: 'h', c: 'c', d: 'd' };
        const d = {
            fs, off,
            line(x1, y1, x2, y2, k) { els.push('<line class="' + cls[k || 'o'] + '" x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '"/>'); grow(x1, y1); grow(x2, y2); },
            rect(x, y, w, h, k) { els.push('<rect class="' + cls[k || 'o'] + '" x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"/>'); grow(x, y); grow(x + w, y + h); },
            circ(cx, cy, r, k) { els.push('<circle class="' + cls[k || 'o'] + '" cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '"/>'); grow(cx - r, cy - r); grow(cx + r, cy + r); },
            poly(pts, k) { els.push('<polygon class="' + cls[k || 'o'] + '" points="' + pts.map((p) => n(p[0]) + ',' + n(p[1])).join(' ') + '"/>'); pts.forEach((p) => grow(p[0], p[1])); },
            text(x, y, t, anchor, rot) {
                els.push('<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + n(fs) + '" text-anchor="' + (anchor || 'middle') + '"' + (rot ? ' transform="rotate(-90 ' + n(x) + ' ' + n(y) + ')"' : '') + '>' + esc(t) + '</text>');
                const w = String(t).length * fs * 0.6;
                if (rot) { grow(x - fs, y - w / 2); grow(x + fs * 0.3, y + w / 2); } else { const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2; grow(x0, y - fs); grow(x0 + w, y + fs * 0.3); }
            },
            arrow(x, y, dx, dy) {   // arrowhead at (x, y) pointing along (dx, dy)
                const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
                els.push('<polygon class="a" points="' + n(x) + ',' + n(y) + ' ' + n(x - ux * ah - uy * ah * 0.35) + ',' + n(y - uy * ah + ux * ah * 0.35) + ' ' + n(x - ux * ah + uy * ah * 0.35) + ',' + n(y - uy * ah - ux * ah * 0.35) + '"/>');
            },
            hdim(x1, x2, yRef, y, t) {   // horizontal dimension at height y, extension lines from yRef
                const s = Math.sign(y - yRef) || 1;
                d.line(x1, yRef + s * fs * 0.25, x1, y + s * fs * 0.3, 'd'); d.line(x2, yRef + s * fs * 0.25, x2, y + s * fs * 0.3, 'd');
                d.line(x1, y, x2, y, 'd'); d.arrow(x1, y, -1, 0); d.arrow(x2, y, 1, 0);
                d.text((x1 + x2) / 2, y - fs * 0.3, t);
            },
            vdim(y1, y2, xRef, x, t) {
                const s = Math.sign(x - xRef) || 1;
                d.line(xRef + s * fs * 0.25, y1, x + s * fs * 0.3, y1, 'd'); d.line(xRef + s * fs * 0.25, y2, x + s * fs * 0.3, y2, 'd');
                d.line(x, y1, x, y2, 'd'); d.arrow(x, y1, 0, -1); d.arrow(x, y2, 0, 1);
                d.text(x - fs * 0.35, (y1 + y2) / 2, t, 'middle', true);
            },
            leader(x, y, tx, ty, t) {
                d.line(x, y, tx, ty, 'd'); d.arrow(x, y, x - tx, y - ty);
                d.line(tx, ty, tx + (tx >= x ? 1 : -1) * fs * 0.8, ty, 'd');
                d.text(tx + (tx >= x ? 1 : -1) * fs, ty + fs * 0.35, t, tx >= x ? 'start' : 'end');
            },
            cross(cx, cy, r) { d.line(cx - r * 1.3, cy, cx + r * 1.3, cy, 'c'); d.line(cx, cy - r * 1.3, cx, cy + r * 1.3, 'c'); },
            label(x, y, t) { els.push('<text class="v" x="' + n(x) + '" y="' + n(y) + '" font-size="' + n(fs * 0.8) + '" text-anchor="middle">' + esc(t) + '</text>'); grow(x, y); },
            svg() {
                const p = fs;
                return '<svg class="ex-draw" viewBox="' + [box[0] - p, box[1] - p, box[2] - box[0] + 2 * p, box[3] - box[1] + 2 * p].map(n).join(' ') + '" role="img" aria-label="Dimensioned drawing">' + els.join('') + '</svg>';
            }
        };
        return d;
    }

    /* =====================================================================
       Modelling templates: random sizes, exact volume (mm³), drawing
       Letters (A, B, C) are given in the question text; the rest are on the drawing.
       ===================================================================== */
    const MATERIALS = [['AISI 1020 steel', 0.0079], ['6061 aluminium alloy', 0.0027], ['Brass', 0.0085], ['Grey cast iron', 0.0072], ['Copper', 0.0089]];
    const TPL = {
        plate: {
            title: 'Plate with four holes',
            make: () => ({ A: rnd(90, 140, 5), B: rnd(50, 90, 5), T: rnd(6, 16), D: even(6, 12), e: rnd(10, 15) }),
            change: 'A', range: [90, 160, 5],
            vol: (p) => p.A * p.B * p.T - 4 * PI * Math.pow(p.D / 2, 2) * p.T,
            draw(p) {
                const d = Draft(Math.max(p.A, p.B + p.T)), r = p.D / 2, y0 = p.B + d.off * 2.4;
                d.rect(0, 0, p.A, p.B);
                [[p.e, p.e], [p.A - p.e, p.e], [p.e, p.B - p.e], [p.A - p.e, p.B - p.e]].forEach(([x, y]) => { d.circ(x, y, r); d.cross(x, y, r); });
                d.hdim(0, p.A, 0, -d.off * 2, 'A'); d.hdim(0, p.e, 0, -d.off, String(p.e));
                d.vdim(0, p.B, 0, -d.off, 'B'); d.vdim(0, p.e, p.A, p.A + d.off, String(p.e));
                d.leader(p.A - p.e + r * 0.7, p.B - p.e + r * 0.7, p.A + d.off * 0.8, p.B + d.off * 0.9, '4X Ø' + p.D + ' THRU');
                d.rect(0, y0, p.A, p.T);
                [p.e, p.A - p.e].forEach((x) => { d.line(x - r, y0, x - r, y0 + p.T, 'h'); d.line(x + r, y0, x + r, y0 + p.T, 'h'); });
                d.vdim(y0, y0 + p.T, p.A, p.A + d.off, String(p.T));
                d.label(p.A / 2, -d.off * 2 - d.fs * 1.4, 'TOP'); d.label(p.A / 2, y0 + p.T + d.fs * 1.8, 'FRONT');
                return d.svg();
            }
        },
        bracket: {
            title: 'L-bracket with a hole',
            make: () => { const T = rnd(8, 14), B = rnd(55, 90, 5), D = even(8, 14); return { A: rnd(60, 110, 5), B, T, W: rnd(30, 60, 5), D, h: Math.round(T + (B - T) / 2) }; },
            change: 'A', range: [60, 130, 5],
            vol: (p) => p.W * (p.A * p.T + (p.B - p.T) * p.T) - PI * Math.pow(p.D / 2, 2) * p.T,
            draw(p) {
                const d = Draft(Math.max(p.A, p.B)), r = p.D / 2, x0 = p.A + d.off * 3, hy = p.B - p.h;
                d.poly([[0, 0], [p.T, 0], [p.T, p.B - p.T], [p.A, p.B - p.T], [p.A, p.B], [0, p.B]]);
                d.line(0, hy - r, p.T, hy - r, 'h'); d.line(0, hy + r, p.T, hy + r, 'h'); d.line(-d.fs * 0.6, hy, p.T + d.fs * 0.6, hy, 'c');
                d.hdim(0, p.A, p.B, p.B + d.off, 'A'); d.vdim(0, p.B, 0, -d.off, 'B');
                d.hdim(0, p.T, 0, -d.off, String(p.T)); d.vdim(p.B - p.T, p.B, p.A, p.A + d.off, String(p.T));
                d.rect(x0, 0, p.W, p.B); d.line(x0, p.B - p.T, x0 + p.W, p.B - p.T);
                d.circ(x0 + p.W / 2, hy, r); d.cross(x0 + p.W / 2, hy, r);
                d.hdim(x0, x0 + p.W, p.B, p.B + d.off, String(p.W)); d.vdim(hy, p.B, x0 + p.W, x0 + p.W + d.off, String(p.h));
                d.leader(x0 + p.W / 2 + r * 0.7, hy - r * 0.7, x0 + p.W + d.off * 0.7, -d.off * 0.4, 'Ø' + p.D + ' THRU');
                d.label(p.A / 2, p.B + d.off * 2.2, 'FRONT'); d.label(x0 + p.W / 2, p.B + d.off * 2.2, 'RIGHT (hole centred)');
                return d.svg();
            }
        },
        shaft: {
            title: 'Stepped shaft',
            make: () => { const D1 = even(36, 50), D2 = even(24, D1 - 8), D3 = even(14, D2 - 6); return { D1, L1: rnd(20, 35), D2, A: rnd(35, 60), D3, L3: rnd(20, 40) }; },
            change: 'A', range: [30, 80, 5],
            vol: (p) => PI / 4 * (p.D1 * p.D1 * p.L1 + p.D2 * p.D2 * p.A + p.D3 * p.D3 * p.L3),
            draw(p) {
                const L = p.L1 + p.A + p.L3, d = Draft(Math.max(L, p.D1)), y1 = p.D1 / 2;
                d.rect(0, -p.D1 / 2, p.L1, p.D1); d.rect(p.L1, -p.D2 / 2, p.A, p.D2); d.rect(p.L1 + p.A, -p.D3 / 2, p.L3, p.D3);
                d.line(-d.fs, 0, L + d.fs, 0, 'c');
                d.hdim(0, p.L1, y1, y1 + d.off, String(p.L1)); d.hdim(p.L1, p.L1 + p.A, p.D2 / 2, y1 + d.off, 'A'); d.hdim(p.L1 + p.A, L, p.D3 / 2, y1 + d.off, String(p.L3));
                d.vdim(-p.D1 / 2, p.D1 / 2, 0, -d.off, 'Ø' + p.D1);
                d.leader(p.L1 + p.A * 0.5, -p.D2 / 2, p.L1 + p.A * 0.5 + d.off * 0.4, -y1 - d.off * 0.8, 'Ø' + p.D2);
                d.leader(p.L1 + p.A + p.L3 * 0.5, -p.D3 / 2, p.L1 + p.A + p.L3 * 0.5 + d.off * 0.4, -y1 - d.off * 0.2, 'Ø' + p.D3);
                const cx = L + d.off * 2.5 + p.D1 / 2;
                [p.D1, p.D2, p.D3].forEach((D) => d.circ(cx, 0, D / 2)); d.cross(cx, 0, p.D1 / 2);
                d.label(L / 2, y1 + d.off * 2.3, 'FRONT'); d.label(cx, y1 + d.off * 2.3, 'RIGHT');
                return d.svg();
            }
        },
        flange: {
            title: 'Flange with bolt holes',
            make: () => {
                for (;;) {
                    const A = rnd(100, 160, 10), d = even(30, 50), h = even(8, 14), P = Math.round((A + d) / 2 / 5) * 5;
                    if (P + h < A - 8 && P - h > d + 8) return { A, B: rnd(10, 20), d, n: pick([4, 6]), h, P };
                }
            },
            change: 'B', range: [8, 26, 1],
            vol: (p) => p.B * PI / 4 * (p.A * p.A - p.d * p.d - p.n * p.h * p.h),
            draw(p) {
                const d = Draft(p.A), R = p.A / 2;
                d.circ(0, 0, R); d.circ(0, 0, p.d / 2); d.circ(0, 0, p.P / 2, 'c'); d.cross(0, 0, R);
                for (let i = 0; i < p.n; i++) { const a = i * 2 * PI / p.n + PI / 2, x = Math.cos(a) * p.P / 2, y = -Math.sin(a) * p.P / 2; d.circ(x, y, p.h / 2); }
                d.leader(R * 0.707, -R * 0.707, R + d.off * 0.6, -R - d.off * 0.3, 'Ø' + p.A);
                d.leader(-p.d / 2 * 0.707, p.d / 2 * 0.707, -R - d.off * 0.6, R + d.off * 0.6, 'Ø' + p.d + ' THRU');
                d.leader(p.h / 2 * 0.7, -p.P / 2 - p.h / 2 * 0.7, R * 0.2 + d.off, -R - d.off * 1.2, p.n + 'X Ø' + p.h + ' THRU, EQ. SP. ON Ø' + p.P);
                const x0 = R + d.off * 3.2;
                d.rect(x0, -R, p.B, p.A); d.line(x0, -p.d / 2, x0 + p.B, -p.d / 2, 'h'); d.line(x0, p.d / 2, x0 + p.B, p.d / 2, 'h'); d.line(x0 - d.fs, 0, x0 + p.B + d.fs, 0, 'c');
                d.hdim(x0, x0 + p.B, R, R + d.off, 'B');
                d.label(0, R + d.off * 2.2, 'FRONT'); d.label(x0 + p.B / 2, R + d.off * 2.2, 'RIGHT');
                return d.svg();
            }
        },
        slotblock: {
            title: 'Block with a slot',
            make: () => { const B = rnd(40, 70, 5), H = rnd(30, 50, 5); return { A: rnd(80, 140, 5), B, H, s: rnd(Math.round(B * 0.4), Math.round(B * 0.6)), p: rnd(Math.round(H * 0.4), Math.round(H * 0.7)) }; },
            change: 'A', range: [70, 160, 5],
            vol: (p) => p.A * (p.B * p.H - p.s * p.p),
            draw(p) {
                const d = Draft(p.A + p.H), a = (p.B - p.s) / 2, b = (p.B + p.s) / 2;
                d.poly([[0, 0], [a, 0], [a, p.p], [b, p.p], [b, 0], [p.B, 0], [p.B, p.H], [0, p.H]]);
                d.hdim(0, p.B, p.H, p.H + d.off, String(p.B)); d.vdim(0, p.H, 0, -d.off, String(p.H));
                d.hdim(a, b, p.p, -d.off, String(p.s)); d.vdim(0, p.p, p.B, p.B + d.off, String(p.p));
                const y0 = -d.off * 2.6 - p.A;
                d.rect(0, y0, p.B, p.A); d.line(a, y0, a, y0 + p.A); d.line(b, y0, b, y0 + p.A);
                d.vdim(y0, y0 + p.A, 0, -d.off, 'A');
                d.label(p.B / 2, p.H + d.off * 2.2, 'FRONT (slot centred)'); d.label(p.B / 2, y0 - d.fs * 0.8, 'TOP');
                return d.svg();
            }
        },
        bushing: {
            title: 'Flanged bushing',
            make: () => { const OD = even(24, 40), C = even(OD + 12, OD + 24); return { OD, ID: even(12, OD - 8), C, tc: rnd(5, 10), A: rnd(35, 70, 5) }; },
            change: 'A', range: [30, 90, 5],
            vol: (p) => PI / 4 * ((p.C * p.C - p.ID * p.ID) * p.tc + (p.OD * p.OD - p.ID * p.ID) * (p.A - p.tc)),
            draw(p) {
                const d = Draft(Math.max(p.A, p.C)), R = p.C / 2;
                d.rect(0, -R, p.tc, p.C); d.rect(p.tc, -p.OD / 2, p.A - p.tc, p.OD);
                d.line(0, -p.ID / 2, p.A, -p.ID / 2, 'h'); d.line(0, p.ID / 2, p.A, p.ID / 2, 'h'); d.line(-d.fs, 0, p.A + d.fs, 0, 'c');
                d.hdim(0, p.A, R, R + d.off * 2, 'A'); d.hdim(0, p.tc, R, R + d.off, String(p.tc));
                d.vdim(-R, R, 0, -d.off, 'Ø' + p.C);
                const cx = p.A + d.off * 2.5 + R;
                d.circ(cx, 0, R); d.circ(cx, 0, p.OD / 2); d.circ(cx, 0, p.ID / 2); d.cross(cx, 0, R);
                d.leader(cx + p.OD / 2 * 0.707, -p.OD / 2 * 0.707, cx + R + d.off * 0.5, -R - d.off * 0.4, 'Ø' + p.OD);
                d.leader(cx - p.ID / 2 * 0.707, p.ID / 2 * 0.707, cx - R - d.off * 0.3, R + d.off * 0.8, 'Ø' + p.ID + ' THRU');
                d.label(p.A / 2, R + d.off * 3.1, 'FRONT'); d.label(cx, R + d.off * 2.2, 'RIGHT');
                return d.svg();
            }
        },
        cbore: {
            title: 'Block with a counterbored hole',
            make: () => { const D = even(8, 12); return { A: rnd(50, 90, 5), B: rnd(40, 70, 5), C: rnd(25, 40), D, Dc: even(D + 6, D + 10), c: rnd(5, 10) }; },
            change: 'C', range: [20, 50, 1],
            vol: (p) => p.A * p.B * p.C - PI / 4 * (p.Dc * p.Dc * p.c + p.D * p.D * (p.C - p.c)),
            draw(p) {
                const d = Draft(Math.max(p.A, p.B + p.C)), cx = p.A / 2, cy = p.B / 2, y0 = p.B + d.off * 2.4;
                d.rect(0, 0, p.A, p.B); d.circ(cx, cy, p.Dc / 2); d.circ(cx, cy, p.D / 2); d.cross(cx, cy, p.Dc / 2);
                d.hdim(0, p.A, 0, -d.off, 'A'); d.vdim(0, p.B, 0, -d.off, 'B');
                d.leader(cx + p.Dc / 2 * 0.707, cy - p.Dc / 2 * 0.707, p.A + d.off * 0.6, -d.off * 0.4, 'Ø' + p.D + ' THRU, C\'BORE Ø' + p.Dc + ' × ' + p.c + ' DEEP');
                d.rect(0, y0, p.A, p.C);
                d.line(cx - p.Dc / 2, y0, cx - p.Dc / 2, y0 + p.c, 'h'); d.line(cx + p.Dc / 2, y0, cx + p.Dc / 2, y0 + p.c, 'h');
                d.line(cx - p.Dc / 2, y0 + p.c, cx + p.Dc / 2, y0 + p.c, 'h');
                d.line(cx - p.D / 2, y0 + p.c, cx - p.D / 2, y0 + p.C, 'h'); d.line(cx + p.D / 2, y0 + p.c, cx + p.D / 2, y0 + p.C, 'h');
                d.line(cx, y0 - d.fs * 0.6, cx, y0 + p.C + d.fs * 0.6, 'c');
                d.vdim(y0, y0 + p.C, p.A, p.A + d.off, 'C');
                d.label(cx, y0 + p.C + d.fs * 1.8, 'FRONT'); d.label(cx, -d.off - d.fs * 1.4, 'TOP (hole centred)');
                return d.svg();
            }
        },
        ibeam: {
            title: 'I-beam section',
            make: () => ({ A: rnd(100, 220, 10), h: rnd(60, 100, 5), b: rnd(40, 70, 5), tf: rnd(5, 10), tw: rnd(4, 8) }),
            change: 'A', range: [80, 260, 10],
            vol: (p) => p.A * (2 * p.b * p.tf + (p.h - 2 * p.tf) * p.tw),
            draw(p) {
                const d = Draft(Math.max(p.A, p.h + p.b)), bx = p.b / 2, wx = p.tw / 2;
                d.poly([[-bx, 0], [bx, 0], [bx, p.tf], [wx, p.tf], [wx, p.h - p.tf], [bx, p.h - p.tf], [bx, p.h], [-bx, p.h], [-bx, p.h - p.tf], [-wx, p.h - p.tf], [-wx, p.tf], [-bx, p.tf]]);
                d.hdim(-bx, bx, p.h, p.h + d.off, String(p.b)); d.vdim(0, p.h, -bx, -bx - d.off, String(p.h));
                d.vdim(0, p.tf, bx, bx + d.off, String(p.tf));
                d.leader(wx, p.h / 2, bx + d.off * 0.6, p.h / 2 + d.off * 0.4, 'web ' + p.tw);
                const x0 = bx + d.off * 4.5;
                d.rect(x0, 0, p.A, p.h); d.line(x0, p.tf, x0 + p.A, p.tf); d.line(x0, p.h - p.tf, x0 + p.A, p.h - p.tf);
                d.hdim(x0, x0 + p.A, p.h, p.h + d.off, 'A');
                d.label(0, p.h + d.off * 2.2, 'SECTION (END)'); d.label(x0 + p.A / 2, p.h + d.off * 2.2, 'SIDE');
                return d.svg();
            }
        },
        pocket: {
            title: 'Block with a pocket',
            make: () => { const A = rnd(80, 130, 5), B = rnd(50, 80, 5), H = rnd(20, 35); return { A, B, H, a: rnd(Math.round(A * 0.5), Math.round(A * 0.7)), w: rnd(Math.round(B * 0.4), Math.round(B * 0.6)), C: rnd(Math.round(H * 0.3), Math.round(H * 0.6)) }; },
            change: 'C', range: [4, 18, 1],
            vol: (p) => p.A * p.B * p.H - p.a * p.w * p.C,
            draw(p) {
                const d = Draft(Math.max(p.A, p.B + p.H)), x1 = (p.A - p.a) / 2, y1 = (p.B - p.w) / 2, y0 = p.B + d.off * 2.4;
                d.rect(0, 0, p.A, p.B); d.rect(x1, y1, p.a, p.w);
                d.hdim(0, p.A, 0, -d.off * 2, 'A'); d.hdim(x1, x1 + p.a, y1, -d.off, String(p.a));
                d.vdim(0, p.B, 0, -d.off * 2, 'B'); d.vdim(y1, y1 + p.w, x1, -d.off, String(p.w));
                d.rect(0, y0, p.A, p.H);
                d.line(x1, y0, x1, y0 + p.C, 'h'); d.line(x1 + p.a, y0, x1 + p.a, y0 + p.C, 'h'); d.line(x1, y0 + p.C, x1 + p.a, y0 + p.C, 'h');
                d.vdim(y0, y0 + p.H, p.A, p.A + d.off * 2, String(p.H)); d.vdim(y0, y0 + p.C, p.A, p.A + d.off, 'C');
                d.label(p.A / 2, y0 + p.H + d.fs * 1.8, 'FRONT'); d.label(p.A / 2, -d.off * 2 - d.fs * 1.4, 'TOP (pocket centred)');
                return d.svg();
            }
        }
    };

    /* =====================================================================
       Exams
       ===================================================================== */
    const POINTS = { theory: 5, model: 15, gen: 5, cad: 15 };
    const PASS = 0.7;
    const EXAMS = {
        sample: { name: 'Sample test', minutes: 30, free: true, items: ['T', 'T', 'T', 'T', 'plate', 'bracket', 'bracket+', 'shaft'] },
        exam1: { name: 'Practice exam 1', minutes: 90, items: ['T', 'T', 'T', 'T', 'T', 'T', 'plate', 'plate+', 'flange', 'slotblock', 'slotblock+', 'cbore', 'ibeam', 'pocket', 'bushing'] },
        exam2: { name: 'Practice exam 2', minutes: 90, items: ['T', 'T', 'T', 'T', 'T', 'T', 'bracket', 'bracket+', 'shaft', 'shaft+', 'bushing', 'cbore', 'pocket', 'flange', 'ibeam'] },
        exam3: { name: 'Practice exam 3', minutes: 90, items: ['T', 'T', 'T', 'T', 'T', 'T', 'pocket', 'pocket+', 'ibeam', 'bushing', 'bushing+', 'slotblock', 'plate', 'shaft', 'cbore'] }
    };

    function modelQ(tpl) { return { kind: 'model', tpl, p: TPL[tpl].make(), mat: pick(MATERIALS) }; }
    function followQ(prev) {
        const t = TPL[prev.tpl], k = t.change, r = t.range;
        let v;
        do { v = rnd(r[0], r[1], r[2]); } while (v === prev.p[k]);
        const p = Object.assign({}, prev.p, { [k]: v });
        // keep the hole height inside a changed bracket
        return { kind: 'model', tpl: prev.tpl, p, mat: prev.mat, follow: { key: k, from: prev.p[k], to: v } };
    }
    function theoryQ(id) { const t = THEORY.find((x) => x.id === id); return { kind: 'theory', id, order: shuffle(t.options.map((o, i) => i)) }; }
    function build(examId) {
        const ex = EXAMS[examId], pool = shuffle(THEORY.map((t) => t.id));
        const qs = [];
        ex.items.forEach((it) => {
            if (it === 'T') qs.push(theoryQ(pool.pop()));
            else if (it.endsWith('+')) { const prev = qs[qs.length - 1]; qs.push(followQ(prev)); qs[qs.length - 1].followOf = qs.length - 1; }
            else qs.push(modelQ(it));
        });
        return { exam: examId, started: Date.now(), minutes: ex.minutes, qs, answers: qs.map(() => ''), flags: qs.map(() => false), at: 0 };
    }
    const massOf = (q) => TPL[q.tpl].vol(q.p) * q.mat[1];

    /* =====================================================================
       Generated exams (js/exam-gen.js): a new exam every time
       Each CSWP-style part gives 4 questions: the mass after stages 1, 2 and 3,
       then the centre of mass of the stage 3 part.
       ===================================================================== */
    const DEMO_PARTS = ['lbracket', 'pillow', 'clevis'];
    const GEN_SIZES = {   // [parts, theory questions, minutes]
        cswp: { short: [1, 3, 35], std: [2, 6, 75], long: [3, 10, 120] },
        parts: { short: [1, 0, 30], std: [2, 0, 60], long: [4, 0, 120] },
        theory: { short: [0, 10, 20], std: [0, 20, 40], long: [0, 40, 80] }
    };
    const STYLE_NAMES = { cswp: 'CSWP-style exam', parts: 'CSWP-style parts', theory: 'Theory exam' };
    const LEN_NAMES = { short: 'short', std: 'standard', long: 'long' };
    function cadQs(tpl, start) {
        const pr = EG.problem(tpl), qs = pr.stages.map((st, k) => ({ kind: 'cad', tpl, stage: k + 1, ask: 'mass', p: st.p, mat: st.mat, changes: st.changes, matFrom: st.matFrom ? st.matFrom.name : '', first: start, prev: start + k - 1 }));
        qs.push(Object.assign({}, qs[2], { ask: 'com', prev: start + 2 }));
        return qs;
    }
    function buildGen(cfg) {
        // cfg: { id, name, parts, theory, minutes, group, pool }
        const qs = [], seen = new Set();
        shuffle(cfg.pool || Object.keys(EG.TEMPLATES)).slice(0, cfg.parts).forEach((t) => { cadQs(t, qs.length).forEach((q) => qs.push(q)); });
        for (let i = 0; i < cfg.theory; i++) qs.push(EG.theory(cfg.group || 'all', seen));
        return { exam: cfg.id, name: cfg.name, started: Date.now(), minutes: cfg.minutes, qs, answers: qs.map(() => ''), flags: qs.map(() => false), at: 0 };
    }
    const genConfig = () => {
        const style = $('#gen-style').value, len = $('#gen-len').value, sz = GEN_SIZES[style][len], timed = $('#gen-timed').checked;
        return { id: 'gen-' + style, name: STYLE_NAMES[style] + ' (' + LEN_NAMES[len] + ')', parts: sz[0], theory: sz[1], minutes: timed ? sz[2] : 0, group: $('#gen-topic').value };
    };
    function paintGenSummary() {
        const c = genConfig(), n = c.parts * 4 + c.theory;
        $('#gen-sum').textContent = n + ' questions' + (c.parts ? ' · ' + c.parts + ' part' + (c.parts > 1 ? 's' : '') + ' in 3 stages' : '') + (c.theory ? ' · ' + c.theory + ' theory' : '') + ' · ' + (c.minutes ? c.minutes + ' minutes' : 'untimed');
        $('#gen-topic').disabled = !c.theory;
    }
    const nameOf = (a) => a.name || (EXAMS[a.exam] || {}).name || 'Practice test';
    const solved = (q) => EG.solve(q.tpl, q.p, q.mat);
    const comText = (c) => 'X ' + fmt(c[0], 2) + ', Y ' + fmt(c[1], 2) + ', Z ' + fmt(c[2], 2) + ' mm';
    const isRight = (q, ans) => {
        if (ans === '' || ans == null) return false;
        if (q.kind === 'theory' || q.kind === 'gen') return +ans === 0;   // option 0 is always the right one (shown shuffled)
        if (q.kind === 'cad') {
            const a = String(ans).split('|'), s = solved(q);
            if (q.ask === 'mass') return EG.within(a[0], s.mass);
            const com = q.ask === 'com' ? a : a.slice(1);
            return (q.ask === 'com' || EG.within(a[0], s.mass)) && com.length === 3 && com.every((v, k) => EG.within(v, s.com[k]));
        }
        const v = parseFloat(String(ans).replace(',', '.'));
        const m = massOf(q);
        return isFinite(v) && Math.abs(v - m) <= m * 0.01;
    };
    const letters = (q) => Object.keys(q.p).filter((k) => /^[ABC]$/.test(k)).sort().map((k) => k + ' = ' + q.p[k] + ' mm').join(', ');

    /* =====================================================================
       Screens
       ===================================================================== */
    const screens = { home: $('#ex-home'), run: $('#ex-run'), result: $('#ex-result'), practice: $('#ex-practice') };
    function show(name) {
        Object.keys(screens).forEach((k) => { screens[k].hidden = k !== name; });
        window.scrollTo({ top: Math.max(0, screens[name].getBoundingClientRect().top + window.scrollY - 90), behavior: 'smooth' });
    }

    /* ---------- Home ---------- */
    function paintHome() {
        const pro = isPro();
        $$('[data-exam]').forEach((card) => {
            const ex = EXAMS[card.dataset.exam];
            const locked = !ex.free && !pro;
            card.classList.toggle('is-locked', locked);
            const btn = $('button', card);
            btn.textContent = locked ? 'Get the exam pass' : 'Start';
            const best = (store.get('ex-history', []).filter((h) => h.exam === card.dataset.exam).sort((a, b) => b.score - a.score)[0]);
            $('.ex-best', card).textContent = best ? 'Best: ' + best.score + '%' : '';
        });
        $('#ex-practice-open').textContent = pro ? 'Open practice' : 'Get the exam pass';
        $('#ex-practice-card').classList.toggle('is-locked', !pro);
        const hist = store.get('ex-history', []);
        $('#ex-history').innerHTML = hist.length ? hist.slice(0, 10).map((h) => '<tr><td>' + esc(h.name || (EXAMS[h.exam] ? EXAMS[h.exam].name : h.exam)) + '</td><td>' + esc(h.date) + '</td><td>' + h.score + '%</td><td>' + (h.score >= PASS * 100 ? '<span class="ex-pass">Pass</span>' : '<span class="ex-fail">Not yet</span>') + '</td></tr>').join('') :
            '<tr><td colspan="4">No attempts yet. Start with the free sample test.</td></tr>';
        paintAccountHistory();
        const resume = store.get('ex-attempt', null);
        $('#ex-resume').hidden = !(resume && remaining(resume) > 0);
        if (resume) $('#ex-resume-name').textContent = nameOf(resume);
        // Demo and generator cards
        const best = (pre) => { const b = hist.filter((h) => h.exam.indexOf(pre) === 0).sort((x, y) => y.score - x.score)[0]; return b ? 'Best: ' + b.score + '%' : ''; };
        $('#ex-demo-card .ex-best').textContent = best('demo');
        $('#ex-gen-card .ex-best').textContent = best('gen-');
        $('#ex-gen-card').classList.toggle('is-locked', !pro);
        $('#gen-start').textContent = pro ? 'Generate my exam' : 'Get the exam pass';
        paintGenSummary();
    }
    // Start a test; checks for an unfinished one first
    function begin(a) {
        const cur = store.get('ex-attempt', null);
        if (cur && remaining(cur) > 0 && !confirm('You have an unfinished ' + nameOf(cur) + '. Start a new test anyway?')) return;
        attempt = a;
        store.set('ex-attempt', attempt);
        startRun();
        NP.track('exam-start-' + a.exam);
    }
    $('#ex-demo-card button').addEventListener('click', () => begin(buildGen({ id: 'demo', name: 'CSWP-style demo', parts: 1, theory: 1, minutes: 30, pool: DEMO_PARTS })));
    $('#gen-start').addEventListener('click', () => {
        if (!isPro()) { openPro('buy', 'The exam generator is part of the exam pass.'); return; }
        begin(buildGen(genConfig()));
    });
    ['#gen-style', '#gen-len', '#gen-timed'].forEach((sel) => $(sel).addEventListener('change', paintGenSummary));
    $('#gen-topic').innerHTML = ['all', 'seg2', 'seg3', 'sheet', 'fea'].map((g) => '<option value="' + g + '">' + esc(EG.GROUPS[g].name) + '</option>').join('');
    $$('[data-exam] button').forEach((b) => b.addEventListener('click', () => {
        const id = b.closest('[data-exam]').dataset.exam;
        if (!EXAMS[id].free && !isPro()) { openPro('buy', 'The full practice exams are part of the exam pass.'); return; }
        begin(build(id));
    }));
    $('#ex-resume-btn').addEventListener('click', () => { attempt = store.get('ex-attempt', null); if (attempt) startRun(); });

    // Typed answers of a question; a centre of mass is "x|y|z" (blank when nothing is typed)
    const collect = (box) => { const v = $$('[data-ans]', box).map((el) => el.value.trim()); return v.every((x) => x === '') ? '' : v.join('|'); };

    /* ---------- Running an exam ---------- */
    let attempt = null, tick = 0;
    const remaining = (a) => (a.minutes ? a.started + a.minutes * 60000 - Date.now() : Infinity);   // untimed: never runs out
    function startRun() {
        show('run');
        $('#ex-run-name').textContent = nameOf(attempt);
        clearInterval(tick);
        tick = setInterval(paintTimer, 1000);
        paintTimer();
        paintQ();
    }
    function paintTimer() {
        const ms = remaining(attempt);
        if (ms === Infinity) {   // untimed: show the time spent
            const e = Date.now() - attempt.started, m = Math.floor(e / 60000), s = Math.floor(e / 1000) % 60;
            $('#ex-timer').textContent = 'Untimed · ' + m + ':' + String(s).padStart(2, '0');
            return;
        }
        if (ms <= 0) { clearInterval(tick); finish(true); return; }
        const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
        $('#ex-timer').textContent = m + ':' + String(s).padStart(2, '0');
        $('#ex-timer').classList.toggle('is-low', ms < 5 * 60000);
    }
    function optionsHtml(q, i, ans, review, texts) {
        return '<div class="ex-options" role="radiogroup">' + q.order.map((o) => '<label class="ex-opt' + (review ? (o === 0 ? ' is-right' : String(ans) === String(o) ? ' is-wrong' : '') : '') + '"><input type="radio" name="ans-' + i + '" value="' + o + '"' + (String(ans) === String(o) ? ' checked' : '') + (review ? ' disabled' : '') + '> <span>' + esc(texts[o]) + '</span></label>').join('') + '</div>';
    }
    // A generated theory question (new numbers every time), with an optional table (design tables)
    function genHtml(q, i, ans, review) {
        const tb = q.table ? '<div class="ex-table-wrap"><table class="ex-dt"><thead><tr>' + q.table.head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
            q.table.rows.map((r) => '<tr>' + r.map((c, k) => (k ? '<td>' : '<th>') + esc(c) + (k ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</tbody></table></div>' : '';
        return '<p class="ex-topic">' + esc(q.topic) + ' · ' + POINTS.gen + ' points</p><h3 class="ex-q">' + esc(q.q) + '</h3>' + tb + optionsHtml(q, i, ans, review, q.options) +
            (review ? '<p class="ex-explain">' + esc(q.explain) + '</p>' : '');
    }
    // A CSWP-style part: stage 1 build, stages 2 and 3 change sizes, then the centre of mass
    function cadHtml(q, i, ans, review) {
        const t = EG.TEMPLATES[q.tpl], s = solved(q), a = String(ans || '').split('|'), ro = review ? ' disabled' : '';
        const ref = (k) => (typeof i === 'number' && k >= 0 ? 'question ' + (k + 1) : 'the previous stage');
        let head = '', title;
        if (q.ask === 'com') { head = '<p class="ex-follow">Use your stage 3 part from ' + ref(q.prev) + ', with no changes.</p>'; title = 'Find the centre of mass, measured from the origin O.'; }
        else if (q.stage > 1) {
            head = '<p class="ex-follow">Stage ' + q.stage + ': open your part from ' + ref(q.prev) + '. Change ' + q.changes.map((c) => '<strong>' + c.key + '</strong> from ' + EG.N(c.from) + ' mm to <strong>' + EG.N(c.to) + ' mm</strong>').join(' and ') +
                (q.matFrom ? ', and change the material from ' + esc(q.matFrom) + ' to <strong>' + esc(q.mat.name) + '</strong>' : '') + '. Everything else stays the same.</p>';
            title = 'What is the mass now?';
        } else title = esc(t.title) + ': build it and find its ' + (q.ask === 'all' ? 'mass and centre of mass.' : 'mass.');
        const changed = new Set(q.ask === 'com' ? [] : q.changes.map((c) => c.key)), L = ['A', 'B', 'C', 'D'];
        const vals = '<div class="ex-table-wrap"><table class="ex-vals"><tr>' + L.map((k) => '<th>' + k + ' <small>' + esc(t.letters[k]) + '</small></th>').join('') + '</tr><tr>' +
            L.map((k) => '<td' + (changed.has(k) ? ' class="is-changed"' : '') + '>' + EG.N(q.p[k]) + ' mm</td>').join('') + '</tr></table></div>';
        const given = '<ul class="ex-given"><li>Material: <strong>' + esc(q.mat.name) + '</strong>, density ' + q.mat.rho + ' kg/m³ (' + EG.gmm3(q.mat.rho) + ' g/mm³)</li>' +
            '<li>Units: MMGS (millimetre, gram, second), 2 decimal places. Third-angle projection.</li>' +
            '<li>Origin O: ' + esc(t.origin) + '. X to the right, Y up, Z towards you in the front view.</li>' + t.notes(q.p).map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>';
        const fld = (k, label, ph, v) => '<div class="field ex-mass"><label for="ans-' + i + '-' + k + '">' + label + '</label><input id="ans-' + i + '-' + k + '" data-ans type="text" inputmode="decimal" autocomplete="off" value="' + esc(v || '') + '"' + ro + ' placeholder="' + ph + '"></div>';
        let inputs;
        if (q.ask === 'mass') inputs = fld(0, 'Mass (grams)', 'e.g. 1234.56', a[0]);
        else {
            const c = q.ask === 'com' ? a : a.slice(1);
            inputs = '<div class="ex-com">' + (q.ask === 'all' ? fld(0, 'Mass (grams)', 'e.g. 1234.56', a[0]) : '') + ['X', 'Y', 'Z'].map((x, k) => fld(k + 1, x + ' (mm)', 'e.g. 12.34', c[k])).join('') + '</div>';
        }
        const exp = review ? '<p class="ex-explain">' + (q.ask !== 'com' ? 'Correct mass: <strong>' + fmt(s.mass, 2) + ' g</strong> (volume ' + fmt(s.V, 2) + ' mm³ × ' + EG.gmm3(q.mat.rho) + ' g/mm³). ' : '') +
            (q.ask !== 'mass' ? 'Centre of mass: <strong>' + comText(s.com) + '</strong>. ' : '') + 'Answers within 1% count as right' + (q.ask !== 'mass' ? ' (within 0.01 mm for a value close to 0)' : '') + '.' +
            (ans !== '' && !isRight(q, ans) ? ' If you were far off, check the material, the origin and that every cut goes the right depth.' : '') + '</p>' : '';
        return '<p class="ex-topic">CSWP-style part · ' + (q.ask === 'com' ? 'centre of mass' : 'stage ' + q.stage + ' of 3') + ' · ' + POINTS.cad + ' points</p>' + head + '<h3 class="ex-q">' + title + '</h3>' +
            vals + given + '<div class="ex-drawing">' + t.draw(q.p) + '</div>' + inputs + exp;
    }
    function questionHtml(q, i, ans, review) {
        if (q.kind === 'gen') return genHtml(q, i, ans, review);
        if (q.kind === 'cad') return cadHtml(q, i, ans, review);
        if (q.kind === 'theory') {
            const t = THEORY.find((x) => x.id === q.id);
            return '<p class="ex-topic">' + esc(t.topic) + ' · ' + POINTS.theory + ' points</p><h3 class="ex-q">' + esc(t.q) + '</h3>' +
                '<div class="ex-options" role="radiogroup">' + q.order.map((o) => '<label class="ex-opt' + (review ? (o === 0 ? ' is-right' : String(ans) === String(o) ? ' is-wrong' : '') : '') + '"><input type="radio" name="ans-' + i + '" value="' + o + '"' + (String(ans) === String(o) ? ' checked' : '') + (review ? ' disabled' : '') + '> <span>' + esc(t.options[o]) + '</span></label>').join('') + '</div>' +
                (review ? '<p class="ex-explain">' + esc(t.explain) + '</p>' : '');
        }
        const t = TPL[q.tpl], m = massOf(q), v = TPL[q.tpl].vol(q.p);
        const intro = q.follow ?
            '<p class="ex-follow">Use the part from question ' + (q.followOf) + '. Change <strong>' + q.follow.key + '</strong> from ' + q.follow.from + ' mm to <strong>' + q.follow.to + ' mm</strong>. Everything else stays the same.</p>' : '';
        return '<p class="ex-topic">Part modelling · ' + POINTS.model + ' points</p>' + intro +
            '<h3 class="ex-q">' + esc(t.title) + ': model the part and find its mass.</h3>' +
            '<ul class="ex-given"><li><strong>' + esc(letters(q)) + '</strong></li><li>Material: <strong>' + esc(q.mat[0]) + '</strong> (density ' + q.mat[1] + ' g/mm³)</li><li>Units: MMGS (millimetre, gram, second), 2 decimal places</li><li>All holes go through unless shown otherwise. Third-angle projection.</li></ul>' +
            '<div class="ex-drawing">' + t.draw(q.p) + '</div>' +
            '<div class="field ex-mass"><label for="mass-' + i + '">Mass (grams)</label><input id="mass-' + i + '" data-ans type="text" inputmode="decimal" autocomplete="off" value="' + esc(ans) + '"' + (review ? ' disabled' : '') + ' placeholder="e.g. 1234.56"></div>' +
            (review ? '<p class="ex-explain">Correct mass: <strong>' + fmt(m, 2) + ' g</strong> (volume ' + fmt(v, 2) + ' mm³ × ' + q.mat[1] + ' g/mm³). Answers within 1% count as right.' +
                (ans !== '' && !isRight(q, ans) ? ' If you were far off, check the material and that every hole and cut goes the right depth.' : '') + '</p>' : '');
    }
    function paintQ() {
        const i = attempt.at, q = attempt.qs[i];
        $('#ex-count').textContent = 'Question ' + (i + 1) + ' of ' + attempt.qs.length;
        $('#ex-question').innerHTML = questionHtml(q, i, attempt.answers[i], false);
        $('#ex-flag').textContent = attempt.flags[i] ? 'Unflag' : 'Flag for review';
        $('#ex-prev').disabled = i === 0;
        $('#ex-next').hidden = i === attempt.qs.length - 1;
        $('#ex-nav').innerHTML = attempt.qs.map((x, k) => '<button type="button" data-go="' + k + '" class="' + [k === i ? 'is-current' : '', attempt.answers[k] !== '' ? 'is-done' : '', attempt.flags[k] ? 'is-flag' : ''].join(' ') + '" aria-label="Question ' + (k + 1) + '">' + (k + 1) + '</button>').join('');
    }
    $('#ex-question').addEventListener('change', (e) => {
        if (e.target.type === 'radio') { attempt.answers[attempt.at] = e.target.value; store.set('ex-attempt', attempt); paintNav(); }
    });
    $('#ex-question').addEventListener('input', (e) => {
        if (e.target.dataset.ans !== undefined) { attempt.answers[attempt.at] = collect($('#ex-question')); store.set('ex-attempt', attempt); paintNav(); }
    });
    // After moving to another question, bring its top into view (below the sticky bar)
    function toTop() {
        const y = $('#ex-nav').getBoundingClientRect().top + window.scrollY - 150;
        if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
    const paintNav = () => { $$('#ex-nav button').forEach((b, k) => b.classList.toggle('is-done', attempt.answers[k] !== '')); };
    $('#ex-nav').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { attempt.at = +b.dataset.go; store.set('ex-attempt', attempt); paintQ(); toTop(); } });
    $('#ex-prev').addEventListener('click', () => { if (attempt.at > 0) { attempt.at--; store.set('ex-attempt', attempt); paintQ(); toTop(); } });
    $('#ex-next').addEventListener('click', () => { if (attempt.at < attempt.qs.length - 1) { attempt.at++; store.set('ex-attempt', attempt); paintQ(); toTop(); } });
    $('#ex-flag').addEventListener('click', () => { attempt.flags[attempt.at] = !attempt.flags[attempt.at]; store.set('ex-attempt', attempt); paintQ(); });
    $('#ex-submit').addEventListener('click', () => {
        const blank = attempt.answers.filter((a) => a === '').length;
        if (!confirm(blank ? 'You have ' + blank + ' unanswered question' + (blank > 1 ? 's' : '') + '. Submit anyway?' : 'Submit your answers?')) return;
        finish(false);
    });
    $('#ex-quit').addEventListener('click', () => { clearInterval(tick); show('home'); paintHome(); });

    /* ---------- Results ---------- */
    function finish(timeUp) {
        clearInterval(tick);
        const a = attempt;
        let got = 0, total = 0;
        a.qs.forEach((q, i) => { const pts = POINTS[q.kind]; total += pts; if (isRight(q, a.answers[i])) got += pts; });
        const score = Math.round(got / total * 100);
        const used = a.minutes ? Math.min(a.minutes * 60000, Date.now() - a.started) : Date.now() - a.started;
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const hist = store.get('ex-history', []);
        hist.unshift({ exam: a.exam, name: nameOf(a), date, iso: new Date().toISOString().slice(0, 10), score, points: got + ' of ' + total, minutes: Math.round(used / 60000) });
        hist.length = Math.min(hist.length, 30);
        if (acct()) { saveToAccount(hist[0]); hist[0].s = 1; }   // logged in: also kept on the account
        store.set('ex-history', hist);
        store.del('ex-attempt');
        NP.track('exam-done-' + a.exam);
        const pass = score >= PASS * 100;
        $('#ex-score').textContent = score + '%';
        $('#ex-score-box').classList.toggle('is-pass', pass);
        $('#ex-verdict').textContent = (timeUp ? 'Time is up. ' : '') + (pass ? 'Pass! You scored ' + got + ' of ' + total + ' points.' : 'Not yet: ' + got + ' of ' + total + ' points. You need ' + Math.round(PASS * 100) + '% to pass.');
        $('#ex-used').textContent = a.minutes ? Math.round(used / 60000) + ' of ' + a.minutes + ' minutes used' : Math.round(used / 60000) + ' minutes (untimed)';
        // Keep a running tally by topic, for the summary
        const stats = store.get('ex-stats', {});
        a.qs.forEach((q, i) => { const t = topicOf(q), r = stats[t] || [0, 0]; r[1]++; if (isRight(q, a.answers[i])) r[0]++; stats[t] = r; });
        store.set('ex-stats', stats);
        last = { a, score, got, total, used, date, timeUp, pass };
        const theory = a.qs.filter((q) => q.kind === 'theory' || q.kind === 'gen'), model = a.qs.filter((q) => q.kind === 'model' || q.kind === 'cad');
        const right = (list) => list.filter((q) => isRight(q, a.answers[a.qs.indexOf(q)])).length;
        $('#ex-split').innerHTML = '<li>Theory: <strong>' + right(theory) + ' of ' + theory.length + '</strong></li><li>Part modelling: <strong>' + right(model) + ' of ' + model.length + '</strong></li>';
        $('#ex-review').innerHTML = a.qs.map((q, i) => '<details class="ex-rev ' + (isRight(q, a.answers[i]) ? 'is-right' : 'is-wrong') + '"><summary><span>' + (i + 1) + '</span> ' +
            esc(shortQ(q)) +
            '<b>' + (isRight(q, a.answers[i]) ? '✓' : a.answers[i] === '' ? 'No answer' : '✗') + '</b></summary>' + questionHtml(q, i, a.answers[i], true) + '</details>').join('');
        $('#ex-upsell').hidden = isPro();
        show('result');
    }
    $('#ex-again').addEventListener('click', () => { show('home'); paintHome(); });

    /* ---------- Performance summary: print / PDF and CSV (exam pass) ---------- */
    let last = null;
    function topicOf(q) {
        if (q.kind === 'theory') return THEORY.find((x) => x.id === q.id).topic;
        if (q.kind === 'gen') return q.topic;
        if (q.kind === 'cad') return q.ask === 'com' ? 'CSWP parts: centre of mass' : 'CSWP parts: mass';
        return 'Part modelling (CSWA)';
    }
    function shortQ(q) {
        if (q.kind === 'theory') return THEORY.find((x) => x.id === q.id).q;
        if (q.kind === 'gen') return q.q;
        if (q.kind === 'cad') return EG.TEMPLATES[q.tpl].title + (q.ask === 'com' ? ': centre of mass' : ': stage ' + q.stage + ' mass');
        return TPL[q.tpl].title + (q.follow ? ' (changed ' + q.follow.key + ')' : '');
    }
    function answerText(q, ans) {
        if (ans === '' || ans == null) return '';
        if (q.kind === 'theory') return THEORY.find((x) => x.id === q.id).options[+ans];
        if (q.kind === 'gen') return q.options[+ans];
        if (q.kind === 'cad' && q.ask === 'com') return String(ans).split('|').map((v, k) => 'XYZ'[k] + ' ' + (v || '–')).join(', ');
        return String(ans) + ' g';
    }
    function correctText(q) {
        if (q.kind === 'theory') return THEORY.find((x) => x.id === q.id).options[0];
        if (q.kind === 'gen') return q.options[0];
        if (q.kind === 'cad') { const s = solved(q); return q.ask === 'com' ? comText(s.com) : fmt(s.mass, 2) + ' g'; }
        return fmt(massOf(q), 2) + ' g';
    }
    function topicRows(pairs) {
        return Object.keys(pairs).sort().map((t) => { const [r, n] = pairs[t]; return '<tr><td>' + esc(t) + '</td><td>' + r + ' of ' + n + '</td><td>' + Math.round(r / n * 100) + '%</td></tr>'; }).join('');
    }
    function printSummary() {
        if (!last) return;
        if (!isPro()) { openPro('buy', 'The printable summary is part of the exam pass.'); return; }
        const { a } = last, mine = {};
        a.qs.forEach((q, i) => { const t = topicOf(q), r = mine[t] || [0, 0]; r[1]++; if (isRight(q, a.answers[i])) r[0]++; mine[t] = r; });
        const hist = store.get('ex-history', []), avg = hist.length ? Math.round(hist.reduce((x, h) => x + h.score, 0) / hist.length) : 0;
        const html = '<div class="ex-sum">' +
            '<p class="ex-sum-brand">Nexus CAD Studio · SolidWorks exam practice</p><h1>Performance summary</h1>' +
            '<p class="ex-sum-meta">' + esc(nameOf(a)) + ' · ' + esc(last.date) + ' · ' + Math.round(last.used / 60000) + ' minutes' + (a.minutes ? ' of ' + a.minutes : ' (untimed)') + (last.timeUp ? ' · time ran out' : '') + '</p>' +
            '<div class="ex-sum-score ' + (last.pass ? 'is-pass' : '') + '"><b>' + last.score + '%</b><span>' + (last.pass ? 'Pass' : 'Not yet (pass mark 70%)') + ' · ' + last.got + ' of ' + last.total + ' points</span></div>' +
            '<h2>By topic (this test)</h2><table><thead><tr><th>Topic</th><th>Right</th><th>Score</th></tr></thead><tbody>' + topicRows(mine) + '</tbody></table>' +
            '<h2>Question by question</h2><table class="ex-sum-q"><thead><tr><th>#</th><th>Question</th><th>Your answer</th><th>Correct answer</th><th></th></tr></thead><tbody>' +
            a.qs.map((q, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(shortQ(q)) + '</td><td>' + esc(answerText(q, a.answers[i]) || 'No answer') + '</td><td>' + esc(correctText(q)) + '</td><td>' + (isRight(q, a.answers[i]) ? '✓' : '✗') + '</td></tr>').join('') + '</tbody></table>' +
            '<h2>All your practice so far</h2><p>' + hist.length + ' test' + (hist.length === 1 ? '' : 's') + ' · average ' + avg + '% · best ' + Math.max(0, ...hist.map((h) => h.score)) + '%</p>' +
            '<table><thead><tr><th>Topic</th><th>Right</th><th>Score</th></tr></thead><tbody>' + topicRows(store.get('ex-stats', {})) + '</tbody></table>' +
            '<p class="ex-sum-foot">Practise again: edisonengineer.github.io/MY-PAST-PROJECTS/exams/ · Original practice questions; not questions from the real exam.</p></div>';
        NP.printDoc(html, 'Exam practice summary ' + last.date);
        NP.track('exam-summary-print');
    }
    function downloadCsv() {
        if (!last) return;
        if (!isPro()) { openPro('buy', 'Downloading your results is part of the exam pass.'); return; }
        const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const rows = [['Test', nameOf(last.a)], ['Date', last.date], ['Score', last.score + '%'], ['Points', last.got + ' of ' + last.total], [], ['#', 'Topic', 'Question', 'Your answer', 'Correct answer', 'Result']]
            .concat(last.a.qs.map((q, i) => [i + 1, topicOf(q), shortQ(q), answerText(q, last.a.answers[i]), correctText(q), isRight(q, last.a.answers[i]) ? 'Right' : 'Wrong']));
        const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'exam-results-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        NP.track('exam-summary-csv');
    }
    $('#ex-print').addEventListener('click', printSummary);
    $('#ex-csv').addEventListener('click', downloadCsv);

    /* ---------- Practice by topic (exam pass) ---------- */
    const TOPICS = [['theory-all', 'Theory: all topics']].concat(['Drawings', 'Sketching', 'Features', 'Assemblies', 'Mass & units'].map((t) => ['theory-' + t, 'Theory: ' + t]))
        .concat(EG.TOPICS.map((t) => ['gen-' + t, 'New numbers: ' + t]))
        .concat(Object.keys(EG.TEMPLATES).map((k) => ['cad-' + k, 'CSWP part: ' + EG.TEMPLATES[k].title]))
        .concat(Object.keys(TPL).map((k) => ['model-' + k, 'Modelling: ' + TPL[k].title]));
    $('#pr-topic').innerHTML = TOPICS.map((t) => '<option value="' + t[0] + '">' + esc(t[1]) + '</option>').join('');
    let pq = null, done = 0, ok = 0;
    function nextPractice() {
        const v = $('#pr-topic').value;
        if (v.startsWith('model-')) pq = modelQ(v.slice(6));
        else if (v.startsWith('cad-')) pq = Object.assign(cadQs(v.slice(4), 0)[0], { ask: 'all', prev: -1 });
        else if (v.startsWith('gen-')) pq = EG.theory(v.slice(4));
        else {
            const topic = v.slice(7), list = THEORY.filter((t) => topic === 'all' || t.topic === topic);
            pq = theoryQ(pick(list).id);
        }
        pq.ans = '';
        $('#pr-q').innerHTML = questionHtml(pq, 'p', '', false);
        $('#pr-check').hidden = false; $('#pr-next').hidden = true;
    }
    $('#pr-q').addEventListener('change', (e) => { if (e.target.type === 'radio') pq.ans = e.target.value; });
    $('#pr-q').addEventListener('input', (e) => { if (e.target.dataset.ans !== undefined) pq.ans = collect($('#pr-q')); });
    $('#pr-check').addEventListener('click', () => {
        if (pq.ans === '') return;
        done++; if (isRight(pq, pq.ans)) ok++;
        $('#pr-q').innerHTML = '<p class="ex-feedback ' + (isRight(pq, pq.ans) ? 'is-right' : 'is-wrong') + '">' + (isRight(pq, pq.ans) ? '✓ Right' : '✗ Not quite') + '</p>' + questionHtml(pq, 'p', pq.ans, true);
        $('#pr-score').textContent = ok + ' of ' + done + ' right this session';
        $('#pr-check').hidden = true; $('#pr-next').hidden = false;
    });
    $('#pr-next').addEventListener('click', () => { nextPractice(); window.scrollTo({ top: Math.max(0, screens.practice.getBoundingClientRect().top + window.scrollY - 90), behavior: 'smooth' }); });
    $('#pr-topic').addEventListener('change', nextPractice);
    $('#ex-practice-open').addEventListener('click', () => {
        if (!isPro()) { openPro('buy', 'Practice by topic is part of the exam pass.'); return; }
        show('practice'); nextPractice();
    });
    $('#pr-back').addEventListener('click', () => { show('home'); paintHome(); });

    /* ---------- Account (js/account.js): results kept on every device ---------- */
    const acct = () => (window.NexusAccount && window.NexusAccount.user() ? window.NexusAccount : null);
    const histName = (h) => h.name || (EXAMS[h.exam] ? EXAMS[h.exam].name : h.exam);
    const saveToAccount = (h) => acct().saveResult({ test: histName(h), score: h.score, points: h.points || '', minutes: h.minutes || 0, date: h.iso || h.date });
    // Results from before logging in go up to the account once
    function uploadLocal() {
        if (!acct()) return;
        const hist = store.get('ex-history', []);
        let n = 0;
        hist.slice().reverse().forEach((h) => { if (!h.s) { saveToAccount(h); h.s = 1; n++; } });
        if (n) store.set('ex-history', hist);
    }
    function paintAccountHistory() {
        const A = acct();
        $('#ex-acct-link').hidden = !!A || !$('#ex-acct-link').dataset.api;
        $('#ex-hist-note').textContent = A ? 'Saved to your account, on every device. Pass mark: 70%.' : 'Saved on this device. Pass mark: 70%.';
        if (!A) return;
        A.data().then((acc) => {
            if (!acc || !acct() || !(acc.results || []).length) return;
            const day = (d) => { const x = new Date(d + 'T12:00:00'); return isNaN(x) ? d : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
            $('#ex-history').innerHTML = acc.results.slice(0, 10).map((h) => '<tr><td>' + esc(h.test) + '</td><td>' + esc(day(h.date)) + '</td><td>' + h.score + '%</td><td>' + (h.score >= PASS * 100 ? '<span class="ex-pass">Pass</span>' : '<span class="ex-fail">Not yet</span>') + '</td></tr>').join('');
        });
    }
    document.addEventListener('DOMContentLoaded', () => { uploadLocal(); paintAccountHistory(); });   // js/account.js has loaded by then

    /* ---------- Start ---------- */
    NP.onPlan(paintHome);
    NP.start();
    // Developer check: open with #check to verify every template draws and has a positive volume
    if (location.hash === '#check') {
        Object.keys(TPL).forEach((k) => { for (let i = 0; i < 50; i++) { const p = TPL[k].make(); if (!(TPL[k].vol(p) > 0)) console.error('bad volume', k, p); TPL[k].draw(p); } });
        console.log('templates ok');
    }
    window.__exams = { TPL, THEORY, massOf, build, buildGen, isRight, solved };   // for automated tests
})();
