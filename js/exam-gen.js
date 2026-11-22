/* =========================================================================
   Exam generator (/exams/): endless CSWP-style problems, made in the browser.
   No server and no AI service: everything here is maths, so it runs free forever.

   1. Parametric parts (TEMPLATES). Each part is built from simple solids whose
      volume and centroid have exact formulas (boxes, extruded polygons, circles,
      sectors, strips of a circle, a draft frustum). Adding (+1) and cutting (-1)
      them gives the exact volume, mass and centre of mass of the whole part.
      Each part draws its own front, top and right views (third-angle).
      Problems come in 3 stages: build it, then change sizes twice.
   2. Theory questions (THEORY_GEN): configurations, design tables, equations,
      advanced mates, interference, sheet metal, simulation and mass properties,
      with new numbers and shuffled choices every time.

   No page code here (exams.js shows the questions), so it can be tested in Node:
     node tools/test-exam-gen.js
   How to add a part: see "Adding a template" at the end of this file.
   ========================================================================= */
(function (root) {
    'use strict';

    const PI = Math.PI;
    let RNG = Math.random;
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const rnd = (a, b, step) => { step = step || 1; return r3(a + step * Math.floor(RNG() * (Math.floor((b - a) / step + 1e-9) + 1))); };
    const pick = (arr) => arr[Math.floor(RNG() * arr.length)];
    const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const N = (v) => String(+(+v).toFixed(2));                 // 12.5 -> "12.5", 12 -> "12"
    const fx = (v, d) => (+v).toFixed(d == null ? 2 : d);
    const deg = (a) => a * PI / 180;

    /* =====================================================================
       Exact geometry. A region is a flat shape in a plane (u, v) with its
       area A and first moments Mu = ∫u dA, Mv = ∫v dA, plus an "inside" test
       (used only by the tests, to check that the pieces fit together).
       ===================================================================== */
    function pip(pts, u, v) {
        let c = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c;
        }
        return c;
    }
    const inArc = (a, a0, a1) => { while (a < a0) a += 2 * PI; while (a >= a0 + 2 * PI) a -= 2 * PI; return a <= a1; };
    const Reg = {
        poly(pts) {   // any simple polygon (shoelace formula)
            let A = 0, Mu = 0, Mv = 0;
            for (let i = 0; i < pts.length; i++) {
                const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], c = x1 * y2 - x2 * y1;
                A += c; Mu += (x1 + x2) * c; Mv += (y1 + y2) * c;
            }
            A /= 2; Mu /= 6; Mv /= 6;
            if (A < 0) { A = -A; Mu = -Mu; Mv = -Mv; }
            return { A, Mu, Mv, in: (u, v) => pip(pts, u, v) };
        },
        rect(u0, v0, u1, v1) { return Reg.poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]); },
        circle(cu, cv, r) { const A = PI * r * r; return { A, Mu: A * cu, Mv: A * cv, in: (u, v) => (u - cu) ** 2 + (v - cv) ** 2 < r * r }; },
        // Ring sector between radii r1 and r2, angles a0..a1 (radians, anticlockwise)
        sector(cu, cv, r1, r2, a0, a1) {
            const A = (a1 - a0) / 2 * (r2 * r2 - r1 * r1), k = (r2 ** 3 - r1 ** 3) / 3;
            return { A, Mu: A * cu + k * (Math.sin(a1) - Math.sin(a0)), Mv: A * cv + k * (Math.cos(a0) - Math.cos(a1)),
                in: (u, v) => { const r = Math.hypot(u - cu, v - cv); return r > r1 && r < r2 && inArc(Math.atan2(v - cv, u - cu), a0, a1); } };
        },
        // The part of a disc inside the strip |u - cu| < w, on one side of its centre (dir +1: v > cv; -1: v < cv)
        strip(cu, cv, r, w, dir) {
            const A = w * Math.sqrt(r * r - w * w) + r * r * Math.asin(w / r);
            return { A, Mu: A * cu, Mv: A * cv + dir * (r * r * w - w ** 3 / 3),
                in: (u, v) => Math.abs(u - cu) < w && (v - cv) * dir > 0 && (u - cu) ** 2 + (v - cv) ** 2 < r * r };
        },
        diff(a, b) { return { A: a.A - b.A, Mu: a.Mu - b.Mu, Mv: a.Mv - b.Mv, in: (u, v) => a.in(u, v) && !b.in(u, v) }; },     // b must lie inside a
        add(a, b) { return { A: a.A + b.A, Mu: a.Mu + b.Mu, Mv: a.Mv + b.Mv, in: (u, v) => a.in(u, v) || b.in(u, v) }; },      // a and b must not overlap
        // Circular segment between the chord and the arc a0..a1
        segment(cu, cv, r, a0, a1) {
            return Reg.diff(Reg.sector(cu, cv, 0, r, a0, a1), Reg.poly([[cu, cv], [cu + r * Math.cos(a0), cv + r * Math.sin(a0)], [cu + r * Math.cos(a1), cv + r * Math.sin(a1)]]));
        },
        // What a corner fillet of radius r takes off a square corner at (cu, cv); su, sv = +1/-1 point into the part
        spandrel(cu, cv, r, su, sv) {
            const sq = Reg.rect(Math.min(cu, cu + su * r), Math.min(cv, cv + sv * r), Math.max(cu, cu + su * r), Math.max(cv, cv + sv * r));
            const a0 = Math.atan2(-sv, -su) - PI / 4;
            return Reg.diff(sq, Reg.sector(cu + su * r, cv + sv * r, 0, r, a0, a0 + PI / 2));
        },
        // Straight slot (obround), overall length len, width w, along u or v
        slot(cu, cv, len, w, along) {
            const r = w / 2, L = len - w;
            if (along === 'v') return Reg.add(Reg.add(Reg.rect(cu - r, cv - L / 2, cu + r, cv + L / 2), Reg.sector(cu, cv + L / 2, 0, r, 0, PI)), Reg.sector(cu, cv - L / 2, 0, r, PI, 2 * PI));
            return Reg.add(Reg.add(Reg.rect(cu - L / 2, cv - r, cu + L / 2, cv + r), Reg.sector(cu + L / 2, cv, 0, r, -PI / 2, PI / 2)), Reg.sector(cu - L / 2, cv, 0, r, PI / 2, 3 * PI / 2));
        },
        hex(cu, cv, af) { const R = af / Math.sqrt(3); return Reg.poly([0, 1, 2, 3, 4, 5].map((i) => [cu + R * Math.cos(i * PI / 3), cv + R * Math.sin(i * PI / 3)])); }
    };

    /* Solids. ext() extrudes a region along an axis between s0 and s1.
       The region's (u, v) are: axis 'z' -> (x, y), axis 'y' -> (x, z), axis 'x' -> (y, z). */
    function ext(reg, axis, s0, s1) {
        const L = s1 - s0, V = reg.A * L, mu = reg.Mu * L, mv = reg.Mv * L, ms = V * (s0 + s1) / 2;
        const M = axis === 'z' ? [mu, mv, ms] : axis === 'y' ? [mu, ms, mv] : [ms, mu, mv];
        const split = axis === 'z' ? (x, y, z) => [x, y, z] : axis === 'y' ? (x, y, z) => [x, z, y] : (x, y, z) => [y, z, x];
        return { V, M, in(x, y, z) { const [u, v, s] = split(x, y, z); return s > s0 && s < s1 && reg.in(u, v); } };
    }
    const box = (x0, y0, z0, x1, y1, z1) => ext(Reg.rect(x0, y0, x1, y1), 'z', z0, z1);
    const cyl = (axis, cu, cv, r, s0, s1) => ext(Reg.circle(cu, cv, r), axis, s0, s1);
    // Rectangular boss rising along +Y from y0, base P (along x) × Q (along z), height h, every side drafted inwards by angle (t = tan)
    function frustumY(xc, zc, P, Q, y0, h, t) {
        const V = P * Q * h - (P + Q) * t * h * h + 4 / 3 * t * t * h ** 3;
        const Ms = P * Q * h * h / 2 - 2 / 3 * (P + Q) * t * h ** 3 + t * t * h ** 4;
        return { V, M: [xc * V, y0 * V + Ms, zc * V], in(x, y, z) { const s = y - y0; return s > 0 && s < h && Math.abs(x - xc) < (P - 2 * t * s) / 2 && Math.abs(z - zc) < (Q - 2 * t * s) / 2; } };
    }
    // Volume (mm³) and centre of mass (mm) of a list of [+1 or -1, solid]
    function props(body) {
        let V = 0; const M = [0, 0, 0];
        body.forEach(([s, b]) => { V += s * b.V; for (let i = 0; i < 3; i++) M[i] += s * b.M[i]; });
        return { V, c: M.map((m) => m / V) };
    }
    const count = (body, x, y, z) => body.reduce((n, [s, b]) => n + (b.in(x, y, z) ? s : 0), 0);   // tests: must be 0 or 1 everywhere

    /* =====================================================================
       Materials (densities as in the SOLIDWORKS material library)
       ===================================================================== */
    const MATERIALS = [
        { name: '1060 Alloy', rho: 2700 },
        { name: '6061-T6 (SS)', rho: 2700 },
        { name: 'Plain Carbon Steel', rho: 7800 },
        { name: 'ABS', rho: 1020 },
        { name: 'AISI 304', rho: 8000 },
        { name: 'Brass', rho: 8500 }
    ];
    const gmm3 = (rho) => +(rho / 1e6).toPrecision(4);   // 2700 kg/m³ -> 0.0027 g/mm³

    /* =====================================================================
       Drawings: three views in model millimetres, scaled to fit
       Front: X right, Y up. Top (above it): X right, Z down the page (front edge
       nearest the front view). Right (beside it): Z leftwards, Y up.
       ===================================================================== */
    function Draft(size) {
        const els = [], box = [Infinity, Infinity, -Infinity, -Infinity];
        const fs = Math.max(size / 26, 2.4), off = fs * 1.9, ah = fs * 0.55;
        const grow = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
        const n = (v) => +v.toFixed(2);
        const d = {
            fs, off,
            line(x1, y1, x2, y2, k) { els.push('<line class="' + (k || 'o') + '" x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '"/>'); grow(x1, y1); grow(x2, y2); },
            circ(cx, cy, r, k) { els.push('<circle class="' + (k || 'o') + '" cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '"/>'); grow(cx - r, cy - r); grow(cx + r, cy + r); },
            poly(pts, k) { els.push('<polygon class="' + (k || 'o') + '" points="' + pts.map((p) => n(p[0]) + ',' + n(p[1])).join(' ') + '"/>'); pts.forEach((p) => grow(p[0], p[1])); },
            pline(pts, k) { els.push('<polyline class="' + (k || 'o') + '" points="' + pts.map((p) => n(p[0]) + ',' + n(p[1])).join(' ') + '"/>'); pts.forEach((p) => grow(p[0], p[1])); },
            text(x, y, t, anchor, rot, cls) {
                els.push('<text' + (cls ? ' class="' + cls + '"' : '') + ' x="' + n(x) + '" y="' + n(y) + '" font-size="' + n(cls === 'v' ? fs * 0.8 : fs) + '" text-anchor="' + (anchor || 'middle') + '"' + (rot ? ' transform="rotate(-90 ' + n(x) + ' ' + n(y) + ')"' : '') + '>' + esc(t) + '</text>');
                const w = String(t).length * fs * 0.6;
                if (rot) { grow(x - fs, y - w / 2); grow(x + fs * 0.3, y + w / 2); } else { const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2; grow(x0, y - fs); grow(x0 + w, y + fs * 0.3); }
            },
            arrow(x, y, dx, dy) {
                const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
                els.push('<polygon class="a" points="' + n(x) + ',' + n(y) + ' ' + n(x - ux * ah - uy * ah * 0.35) + ',' + n(y - uy * ah + ux * ah * 0.35) + ' ' + n(x - ux * ah + uy * ah * 0.35) + ',' + n(y - uy * ah - ux * ah * 0.35) + '"/>');
            },
            hdim(x1, x2, yRef, y, t) {
                if (x1 > x2) [x1, x2] = [x2, x1];
                const s = Math.sign(y - yRef) || 1;
                d.line(x1, yRef + s * fs * 0.25, x1, y + s * fs * 0.3, 'd'); d.line(x2, yRef + s * fs * 0.25, x2, y + s * fs * 0.3, 'd');
                d.line(x1, y, x2, y, 'd'); d.arrow(x1, y, -1, 0); d.arrow(x2, y, 1, 0);
                d.text((x1 + x2) / 2, y - fs * 0.3, t);
            },
            vdim(y1, y2, xRef, x, t) {
                if (y1 > y2) [y1, y2] = [y2, y1];
                const s = Math.sign(x - xRef) || 1;
                d.line(xRef + s * fs * 0.25, y1, x + s * fs * 0.3, y1, 'd'); d.line(xRef + s * fs * 0.25, y2, x + s * fs * 0.3, y2, 'd');
                d.line(x, y1, x, y2, 'd'); d.arrow(x, y1, 0, -1); d.arrow(x, y2, 0, 1);
                d.text(x - fs * 0.35, (y1 + y2) / 2, t, 'middle', true);
            },
            leader(x, y, tx, ty, t) {
                d.line(x, y, tx, ty, 'd'); d.arrow(x, y, x - tx, y - ty);
                const s = tx >= x ? 1 : -1;
                d.line(tx, ty, tx + s * fs * 0.8, ty, 'd');
                d.text(tx + s * fs, ty + fs * 0.35, t, s > 0 ? 'start' : 'end');
            },
            origin(x, y) {   // the part origin, with the X and Y directions
                const r = fs * 0.35, L = fs * 1.7;
                els.push('<circle class="og" cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(r) + '"/>');
                d.line(x, y, x + L, y, 'og'); d.arrow(x + L, y, 1, 0); d.line(x, y, x, y - L, 'og'); d.arrow(x, y - L, 0, -1);
                d.text(x + L + fs * 0.2, y + fs * 0.35, 'X', 'start', false, 'og'); d.text(x, y - L - fs * 0.25, 'Y', 'middle', false, 'og');
                d.text(x - fs * 0.5, y + fs * 1.1, 'O', 'end', false, 'og');
            },
            svg(label) {
                const p = fs;
                return '<svg class="ex-draw" viewBox="' + [box[0] - p, box[1] - p, box[2] - box[0] + 2 * p, box[3] - box[1] + 2 * p].map(n).join(' ') + '" role="img" aria-label="' + esc(label || 'Dimensioned drawing') + '">' + els.join('') + '</svg>';
            }
        };
        return d;
    }
    // A sheet with the three views. bx, by, bz: the part's [min, max] in x, y, z.
    function sheet(bx, by, bz) {
        const size = Math.max(bx[1] - bx[0] + bz[1] - bz[0], by[1] - by[0] + bz[1] - bz[0]);
        const d = Draft(size), g = d.off * 4;
        const view = (m) => {
            const v = {
                P: m,
                line(a1, b1, a2, b2, k) { const p = m(a1, b1), q = m(a2, b2); d.line(p[0], p[1], q[0], q[1], k); },
                rect(a0, b0, a1, b1, k) { v.poly([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], k); },
                poly(pts, k) { d.poly(pts.map((p) => m(p[0], p[1])), k); },
                pline(pts, k) { d.pline(pts.map((p) => m(p[0], p[1])), k); },
                arc(a, b, r, t0, t1, k) { const pts = [], n = Math.max(8, Math.ceil(Math.abs(t1 - t0) / 7.5)); for (let i = 0; i <= n; i++) { const t = deg(t0 + (t1 - t0) * i / n); pts.push([a + r * Math.cos(t), b + r * Math.sin(t)]); } v.pline(pts, k); },
                circ(a, b, r, k) { const p = m(a, b); d.circ(p[0], p[1], r, k); },
                cross(a, b, r) { v.line(a - r * 1.25, b, a + r * 1.25, b, 'c'); v.line(a, b - r * 1.25, a, b + r * 1.25, 'c'); },
                hdim(a1, a2, bRef, side, level, t) { const p = m(a1, bRef), q = m(a2, bRef); d.hdim(p[0], q[0], p[1], p[1] + side * d.off * level, t); },
                vdim(b1, b2, aRef, side, level, t) { const p = m(aRef, b1), q = m(aRef, b2); d.vdim(p[1], q[1], p[0], p[0] + side * d.off * level, t); },
                note(a, b, ta, tb, t) { const p = m(a, b), q = m(ta, tb); d.leader(p[0], p[1], q[0], q[1], t); },
                origin(a, b) { const p = m(a, b); d.origin(p[0], p[1]); }
            };
            return v;
        };
        const F = view((x, y) => [x, -y]);
        const T = view((x, z) => [x, -by[1] - g - (bz[1] - z)]);
        const R = view((z, y) => [bx[1] + g + (bz[1] - z), -y]);
        return {
            d, F, T, R, off: d.off,
            svg(title) {
                const cx = (bx[0] + bx[1]) / 2, low = -by[0] + d.off * 3.4;
                d.text(cx, low, 'FRONT', 'middle', false, 'v');
                d.text(cx, T.P(0, bz[0])[1] - d.off * 3.2, 'TOP', 'middle', false, 'v');
                d.text(R.P((bz[0] + bz[1]) / 2, 0)[0], low, 'RIGHT', 'middle', false, 'v');
                return d.svg(title + ': front, top and right views');
            }
        };
    }

    /* =====================================================================
       Parametric part templates
       Each template:
         title, letters  what A, B, C, D mean
         range           sizes A–D can take (min, max, step)
         make()          random fixed sizes and a first set of A–D
         ok(p)           true when the sizes make a sensible part
         notes(p)        the sizes and rules written under the drawing
         origin          where the origin O is
         body(p)         the solids: [[+1, solid], [-1, cut], ...]
         draw(p)         the drawing (SVG)
       ===================================================================== */
    const T_ = {};

    T_.lbracket = {
        title: 'L-bracket with a rib and a counterbored hole',
        letters: { A: 'base length', B: 'width', C: 'height', D: 'rib leg' },
        range: { A: [90, 150, 5], B: [40, 70, 5], C: [55, 100, 5], D: [15, 45, 5] },
        make() { const Dh = pick([8, 10]); return { A: rnd(90, 150, 5), B: rnd(40, 70, 5), C: rnd(55, 100, 5), D: rnd(15, 40, 5), T: pick([8, 10, 12]), tr: pick([6, 8]), Dh, Dc: Dh + pick([6, 8]), cd: pick([4, 5]), e: pick([15, 18, 20]) }; },
        ok: (p) => p.D <= p.C - p.T - 8 && p.A - p.e - p.Dc / 2 >= p.T + p.D + 4 && p.B >= p.Dc + 12 && p.cd <= p.T - 3,
        notes: (p) => ['Base and upright: ' + N(p.T) + ' mm thick', 'Rib: ' + N(p.tr) + ' mm thick, centred on the width; both legs are D long, measured from the inside faces',
            'Hole: Ø' + N(p.Dh) + ' through, counterbore Ø' + N(p.Dc) + ' × ' + N(p.cd) + ' deep from the top, ' + N(p.e) + ' mm from the right end, centred on the width'],
        origin: 'the bottom back corner on the outside of the upright',
        body(p) {
            const zc = p.B / 2, xh = p.A - p.e;
            return [[1, box(0, 0, 0, p.A, p.T, p.B)], [1, box(0, p.T, 0, p.T, p.C, p.B)],
                [1, ext(Reg.poly([[p.T, p.T], [p.T + p.D, p.T], [p.T, p.T + p.D]]), 'z', zc - p.tr / 2, zc + p.tr / 2)],
                [-1, cyl('y', xh, zc, p.Dh / 2, 0, p.T - p.cd)], [-1, cyl('y', xh, zc, p.Dc / 2, p.T - p.cd, p.T)]];
        },
        draw(p) {
            const s = sheet([0, p.A], [0, p.C], [0, p.B]), { F, T, R } = s, t = p.T, xh = p.A - p.e, zc = p.B / 2, o = s.off;
            F.poly([[0, 0], [p.A, 0], [p.A, t], [t, t], [t, p.C], [0, p.C]]); F.line(t + p.D, t, t, t + p.D);
            [-1, 1].forEach((k) => { F.line(xh + k * p.Dh / 2, 0, xh + k * p.Dh / 2, t - p.cd, 'h'); F.line(xh + k * p.Dc / 2, t - p.cd, xh + k * p.Dc / 2, t, 'h'); });
            F.line(xh - p.Dc / 2, t - p.cd, xh + p.Dc / 2, t - p.cd, 'h'); F.line(xh, -o * 0.4, xh, t + o * 0.4, 'c');
            F.hdim(0, p.A, 0, 1, 2, 'A'); F.hdim(t, t + p.D, 0, 1, 1, 'D'); F.vdim(0, p.C, 0, -1, 1, 'C'); F.vdim(0, t, p.A, 1, 1, N(t)); F.origin(0, 0);
            T.rect(0, 0, p.A, p.B); T.line(t, 0, t, p.B); T.line(t, zc - p.tr / 2, t + p.D, zc - p.tr / 2); T.line(t, zc + p.tr / 2, t + p.D, zc + p.tr / 2);
            T.circ(xh, zc, p.Dc / 2); T.circ(xh, zc, p.Dh / 2); T.cross(xh, zc, p.Dc / 2);
            T.vdim(0, p.B, 0, -1, 1, 'B'); T.hdim(xh, p.A, 0, -1, 1, N(p.e));
            T.note(xh + p.Dc * 0.35, zc + p.Dc * 0.35, p.A + o, p.B + o * 0.6, 'Ø' + N(p.Dh) + ' THRU, C\'BORE Ø' + N(p.Dc) + ' × ' + N(p.cd));
            R.rect(0, 0, p.B, p.C); R.line(0, t, p.B, t); R.rect(zc - p.tr / 2, t, zc + p.tr / 2, t + p.D); R.hdim(zc - p.tr / 2, zc + p.tr / 2, p.C, -1, 1, N(p.tr));
            return s.svg(this.title);
        }
    };

    T_.angleplate = {
        title: 'Mounting plate with an angled corner and a pocket',
        letters: { A: 'length', B: 'width', C: 'thickness', D: 'corner cut length' },
        range: { A: [100, 170, 5], B: [60, 110, 5], C: [10, 24, 2], D: [15, 45, 5] },
        make() { return { A: rnd(100, 160, 5), B: rnd(60, 100, 5), C: rnd(10, 20, 2), D: rnd(20, 40, 5), th: pick([30, 45, 60]), e: pick([10, 12, 15]), P: rnd(30, 50, 5), e2: pick([12, 15]), h: pick([8, 10, 12]) }; },
        ok(p) {
            const Dz = p.D * Math.tan(deg(p.th));
            if (Dz > p.B - 25 || p.e + p.P > p.A - p.D - 6 || p.e + p.P + 6 > p.A - p.e2 - p.h / 2 || p.B - 2 * p.e < 15 || p.C % 2) return false;
            const x = p.A - p.e2, z = p.B - p.e2, dist = ((x - (p.A - p.D)) * Dz + (z - p.B) * p.D) / Math.hypot(Dz, p.D);
            return -dist >= p.h / 2 + 3 && p.e2 >= p.h / 2 + 3;
        },
        notes: (p) => ['Corner cut: D along the front edge, at ' + p.th + '° to the front edge',
            'Pocket: ' + N(p.P) + ' mm long, ' + N(p.e) + ' mm in from the left, back and front edges, depth C/2 (equation)',
            '2 holes Ø' + N(p.h) + ' through, ' + N(p.e2) + ' mm from the right edge and from the back and front edges'],
        origin: 'the bottom back left corner',
        body(p) {
            const Dz = p.D * Math.tan(deg(p.th)), C = p.C;
            return [[1, ext(Reg.poly([[0, 0], [p.A, 0], [p.A, p.B - Dz], [p.A - p.D, p.B], [0, p.B]]), 'y', 0, C)],
                [-1, box(p.e, C / 2, p.e, p.e + p.P, C, p.B - p.e)],
                [-1, cyl('y', p.A - p.e2, p.e2, p.h / 2, 0, C)], [-1, cyl('y', p.A - p.e2, p.B - p.e2, p.h / 2, 0, C)]];
        },
        draw(p) {
            const s = sheet([0, p.A], [0, p.C], [0, p.B]), { F, T, R } = s, C = p.C, Dz = p.D * Math.tan(deg(p.th)), xh = p.A - p.e2, o = s.off;
            T.poly([[0, 0], [p.A, 0], [p.A, p.B - Dz], [p.A - p.D, p.B], [0, p.B]]); T.rect(p.e, p.e, p.e + p.P, p.B - p.e);
            [p.e2, p.B - p.e2].forEach((z) => { T.circ(xh, z, p.h / 2); T.cross(xh, z, p.h / 2); });
            T.hdim(0, p.A, 0, -1, 1, 'A'); T.vdim(0, p.B, 0, -1, 1, 'B'); T.hdim(p.A - p.D, p.A, p.B, 1, 1, 'D');
            T.note(p.A - p.D * 0.5, p.B - Dz * 0.5, p.A + o * 0.8, p.B - Dz - o * 0.3, p.th + '°');
            T.note(xh + p.h * 0.35, p.e2 - p.h * 0.35, p.A + o, -o * 0.4, '2X Ø' + N(p.h) + ' THRU');
            F.rect(0, 0, p.A, C); F.line(p.A - p.D, 0, p.A - p.D, C);
            F.line(p.e, C / 2, p.e, C, 'h'); F.line(p.e + p.P, C / 2, p.e + p.P, C, 'h'); F.line(p.e, C / 2, p.e + p.P, C / 2, 'h');
            [-1, 1].forEach((k) => F.line(xh + k * p.h / 2, 0, xh + k * p.h / 2, C, 'h'));
            F.vdim(0, C, 0, -1, 1, 'C'); F.vdim(C / 2, C, p.A, 1, 1, 'C/2'); F.origin(0, 0);
            R.rect(0, 0, p.B, C); R.line(p.B - Dz, 0, p.B - Dz, C); R.line(p.e, C / 2, p.B - p.e, C / 2, 'h'); R.line(p.e, C / 2, p.e, C, 'h'); R.line(p.B - p.e, C / 2, p.B - p.e, C, 'h');
            return s.svg(this.title);
        }
    };

    T_.collar = {
        title: 'Split shaft collar with a keyway',
        letters: { A: 'outside diameter', B: 'bore diameter', C: 'length', D: 'slot width' },
        range: { A: [50, 95, 5], B: [20, 44, 2], C: [12, 40, 2], D: [3, 10, 1] },
        make() { return { A: rnd(55, 90, 5), B: rnd(20, 40, 2), C: rnd(14, 34, 2), D: rnd(3, 8, 1), k: pick([5, 6, 8]), kd: pick([2, 2.5, 3]) }; },
        ok: (p) => p.A - p.B >= 2 * (p.kd + 6) && p.D <= p.B - 6 && p.k <= p.B / 2 && p.D >= 2,
        notes: (p) => ['Slot D wide, straight through the top wall and along the full length', 'Keyway at the bottom of the bore: ' + N(p.k) + ' mm wide, ' + N(p.kd) + ' mm deep below the bore'],
        origin: 'the centre of the bore, on the back face',
        body(p) {
            const rA = p.A / 2, rB = p.B / 2, C = p.C;
            return [[1, cyl('z', 0, 0, rA, 0, C)], [-1, cyl('z', 0, 0, rB, 0, C)],
                [-1, ext(Reg.strip(0, 0, rA, p.D / 2, 1), 'z', 0, C)], [1, ext(Reg.strip(0, 0, rB, p.D / 2, 1), 'z', 0, C)],
                [-1, box(-p.k / 2, -(rB + p.kd), 0, p.k / 2, 0, C)], [1, ext(Reg.strip(0, 0, rB, p.k / 2, -1), 'z', 0, C)]];
        },
        draw(p) {
            const rA = p.A / 2, rB = p.B / 2, w = p.D / 2, kw = p.k / 2, s = sheet([-rA, rA], [-rA, rA], [0, p.C]), { F, T, R } = s, o = s.off;
            const a = Math.asin(w / rA) * 180 / PI, b = Math.asin(w / rB) * 180 / PI, g = Math.asin(kw / rB) * 180 / PI;
            F.arc(0, 0, rA, 90 + a, 450 - a); F.arc(0, 0, rB, 90 + b, 270 - g); F.arc(0, 0, rB, 270 + g, 450 - b);
            [-1, 1].forEach((k) => { F.line(k * w, Math.sqrt(rB * rB - w * w), k * w, Math.sqrt(rA * rA - w * w)); F.line(k * kw, -Math.sqrt(rB * rB - kw * kw), k * kw, -(rB + p.kd)); });
            F.line(-kw, -(rB + p.kd), kw, -(rB + p.kd)); F.cross(0, 0, rA);
            F.note(rA * 0.707, -rA * 0.707, rA + o * 0.6, -rA - o * 0.6, 'Ø A'); F.note(-rB * 0.707, rB * 0.707, -rA - o * 0.6, rA + o * 0.4, 'Ø B');
            F.hdim(-w, w, rA, -1, 1, 'D'); F.note(kw, -(rB + p.kd), rA * 0.5 + o, -rA - o * 1.6, 'KEYWAY ' + N(p.k) + ' × ' + N(p.kd));
            F.origin(0, 0);
            T.rect(-rA, 0, rA, p.C); T.line(-w, 0, -w, p.C); T.line(w, 0, w, p.C); T.line(-rB, 0, -rB, p.C, 'h'); T.line(rB, 0, rB, p.C, 'h'); T.line(0, -o * 0.4, 0, p.C + o * 0.4, 'c');
            T.vdim(0, p.C, -rA, -1, 1, 'C');
            const yt = Math.sqrt(rA * rA - w * w);
            R.rect(0, -rA, p.C, yt); R.line(0, Math.sqrt(rB * rB - w * w), p.C, Math.sqrt(rB * rB - w * w), 'h'); R.line(0, -(rB + p.kd), p.C, -(rB + p.kd), 'h'); R.line(-o * 0.4, 0, p.C + o * 0.4, 0, 'c');
            return s.svg(this.title);
        }
    };

    T_.gusset = {
        title: 'Sheet metal angle bracket with a gusset',
        letters: { A: 'base flange length', B: 'upright flange height', C: 'width', D: 'gusset leg' },
        range: { A: [60, 120, 5], B: [50, 110, 5], C: [40, 90, 5], D: [18, 50, 2] },
        make() { return { A: rnd(60, 110, 5), B: rnd(55, 100, 5), C: rnd(40, 80, 5), D: rnd(20, 44, 2), T: pick([2, 2.5, 3, 4]), R: pick([2, 3, 4, 5]), h: pick([6, 8]), e: pick([12, 15]) }; },
        ok(p) {
            const c = p.T + p.R;
            return p.D >= c + 8 && p.D <= p.A - 5 && p.A - p.e - p.h / 2 >= c + 2 && p.B - p.e - p.h / 2 >= p.D + 2 &&
                p.C / 4 - p.h / 2 >= 3 && p.C / 4 + p.h / 2 + 3 <= p.C / 2 - p.T / 2;
        },
        notes: (p) => ['Sheet thickness ' + N(p.T) + ' mm, inside bend radius ' + N(p.R) + ' mm, one 90° bend; A and B are outside sizes',
            'Gusset: same thickness, centred on the width, fills the inside corner (touching the bend); legs D, measured from the outside corner',
            '2 holes Ø' + N(p.h) + ' in the base, ' + N(p.e) + ' mm from its end, at C/4 and 3C/4; 1 hole Ø' + N(p.h) + ' in the upright, ' + N(p.e) + ' mm from its top, centred'],
        origin: 'the virtual sharp: where the two outside faces meet, on the back edge',
        body(p) {
            const c = p.T + p.R, C = p.C, z0 = C / 2 - p.T / 2, z1 = C / 2 + p.T / 2;
            return [[1, box(c, 0, 0, p.A, p.T, C)], [1, box(0, c, 0, p.T, p.B, C)], [1, ext(Reg.sector(c, c, p.R, c, PI, 1.5 * PI), 'z', 0, C)],
                [1, ext(Reg.poly([[c, p.T], [p.D, p.T], [p.T, p.D], [p.T, c]]), 'z', z0, z1)], [1, ext(Reg.segment(c, c, p.R, PI, 1.5 * PI), 'z', z0, z1)],
                [-1, cyl('y', p.A - p.e, C / 4, p.h / 2, 0, p.T)], [-1, cyl('y', p.A - p.e, 3 * C / 4, p.h / 2, 0, p.T)], [-1, cyl('x', p.B - p.e, C / 2, p.h / 2, 0, p.T)]];
        },
        draw(p) {
            const c = p.T + p.R, t = p.T, s = sheet([0, p.A], [0, p.B], [0, p.C]), { F, T, R } = s, o = s.off;
            F.line(c, 0, p.A, 0); F.line(p.A, 0, p.A, t); F.line(p.A, t, c, t); F.arc(c, c, c, 180, 270); F.arc(c, c, p.R, 180, 270);
            F.line(0, c, 0, p.B); F.line(0, p.B, t, p.B); F.line(t, p.B, t, c); F.line(p.D, t, t, p.D);
            F.hdim(0, p.A, 0, 1, 2, 'A'); F.hdim(0, p.D, 0, 1, 1, 'D'); F.vdim(0, p.B, 0, -1, 1, 'B');
            F.note(c - p.R * 0.707, c - p.R * 0.707, p.A * 0.55, p.B * 0.75, 'R' + N(p.R) + ' INSIDE, T = ' + N(t)); F.origin(0, 0);
            T.rect(0, 0, p.A, p.C); T.line(t, 0, t, p.C); T.line(t, p.C / 2 - t / 2, p.D, p.C / 2 - t / 2); T.line(t, p.C / 2 + t / 2, p.D, p.C / 2 + t / 2);
            [p.C / 4, 3 * p.C / 4].forEach((z) => { T.circ(p.A - p.e, z, p.h / 2); T.cross(p.A - p.e, z, p.h / 2); });
            T.vdim(0, p.C, 0, -1, 1, 'C'); T.hdim(p.A - p.e, p.A, 0, -1, 1, N(p.e)); T.note(p.A - p.e + p.h * 0.35, 3 * p.C / 4 + p.h * 0.35, p.A + o, p.C + o * 0.5, '2X Ø' + N(p.h) + ' THRU');
            R.rect(0, 0, p.C, p.B); R.line(0, t, p.C, t); R.rect(p.C / 2 - t / 2, t, p.C / 2 + t / 2, p.D);
            R.circ(p.C / 2, p.B - p.e, p.h / 2); R.cross(p.C / 2, p.B - p.e, p.h / 2); R.vdim(p.B - p.e, p.B, 0, 1, 1, N(p.e));
            return s.svg(this.title);
        }
    };

    T_.stepdraft = {
        title: 'Stepped block with a drafted boss and fillets',
        letters: { A: 'length', B: 'width', C: 'block height', D: 'boss height' },
        range: { A: [80, 150, 5], B: [50, 90, 5], C: [16, 34, 2], D: [8, 26, 1] },
        make() { return { A: rnd(85, 140, 5), B: rnd(55, 85, 5), C: rnd(16, 30, 2), D: rnd(10, 24, 1), r: pick([4, 5, 6, 8]), S: pick([20, 25, 30]), m: pick([8, 10]), th: pick([3, 5, 8, 10]), h: pick([8, 10, 12]) }; },
        ok(p) {
            const t = Math.tan(deg(p.th)), P = p.A - p.S - 2 * p.m, Q = p.B - 2 * p.m;
            return P >= 25 && Q >= 25 && Math.min(P, Q) - 2 * p.D * t >= p.h + 8 && 2 * p.r < p.S && p.r <= p.m && p.C % 2 === 0;
        },
        notes: (p) => ['Step at the right end: ' + N(p.S) + ' mm long, C/2 deep (equation)', '4 vertical corner edges filleted R' + N(p.r),
            'Boss: ' + N(p.m) + ' mm in from the left, back and front edges and from the step; D high; draft ' + p.th + '° on all 4 sides',
            'Hole Ø' + N(p.h) + ' through the centre of the boss and the block'],
        origin: 'the bottom back left corner (the sharp corner before filleting)',
        body(p) {
            const t = Math.tan(deg(p.th)), P = p.A - p.S - 2 * p.m, Q = p.B - 2 * p.m, xc = p.m + P / 2, zc = p.B / 2, C2 = p.C / 2;
            return [[1, box(0, 0, 0, p.A, p.C, p.B)], [-1, box(p.A - p.S, C2, 0, p.A, p.C, p.B)],
                [-1, ext(Reg.spandrel(0, 0, p.r, 1, 1), 'y', 0, p.C)], [-1, ext(Reg.spandrel(0, p.B, p.r, 1, -1), 'y', 0, p.C)],
                [-1, ext(Reg.spandrel(p.A, 0, p.r, -1, 1), 'y', 0, C2)], [-1, ext(Reg.spandrel(p.A, p.B, p.r, -1, -1), 'y', 0, C2)],
                [1, frustumY(xc, zc, P, Q, p.C, p.D, t)], [-1, cyl('y', xc, zc, p.h / 2, 0, p.C + p.D)]];
        },
        draw(p) {
            const t = Math.tan(deg(p.th)), P = p.A - p.S - 2 * p.m, Q = p.B - 2 * p.m, xc = p.m + P / 2, zc = p.B / 2, C2 = p.C / 2, Dt = p.D * t, r = p.r;
            const s = sheet([0, p.A], [0, p.C + p.D], [0, p.B]), { F, T, R } = s, o = s.off;
            F.poly([[0, 0], [p.A, 0], [p.A, C2], [p.A - p.S, C2], [p.A - p.S, p.C], [0, p.C]]);
            F.pline([[p.m, p.C], [p.m + Dt, p.C + p.D], [p.m + P - Dt, p.C + p.D], [p.m + P, p.C]]);
            [-1, 1].forEach((k) => F.line(xc + k * p.h / 2, 0, xc + k * p.h / 2, p.C + p.D, 'h')); F.line(xc, -o * 0.4, xc, p.C + p.D + o * 0.4, 'c');
            F.hdim(0, p.A, 0, 1, 1, 'A'); F.vdim(0, p.C, 0, -1, 1, 'C'); F.vdim(p.C, p.C + p.D, p.m + P, 1, (p.A - p.m - P) / o + 1, 'D');
            F.hdim(p.A - p.S, p.A, p.C, -1, 1, N(p.S)); F.vdim(0, C2, p.A, 1, 1, 'C/2');
            F.note(p.m + Dt / 2, p.C + p.D / 2, p.m - o * 0.8, p.C + p.D + o * 1.2, 'DRAFT ' + p.th + '°'); F.origin(0, 0);
            T.line(r, 0, p.A - r, 0); T.line(p.A, r, p.A, p.B - r); T.line(p.A - r, p.B, r, p.B); T.line(0, p.B - r, 0, r);
            T.arc(r, r, r, 180, 270); T.arc(p.A - r, r, r, 270, 360); T.arc(p.A - r, p.B - r, r, 0, 90); T.arc(r, p.B - r, r, 90, 180);
            T.line(p.A - p.S, 0, p.A - p.S, p.B); T.rect(p.m, p.m, p.m + P, p.m + Q); T.rect(p.m + Dt, p.m + Dt, p.m + P - Dt, p.m + Q - Dt);
            [[p.m, p.m, 1, 1], [p.m + P, p.m, -1, 1], [p.m + P, p.m + Q, -1, -1], [p.m, p.m + Q, 1, -1]].forEach(([x, z, sx, sz]) => T.line(x, z, x + sx * Dt, z + sz * Dt));
            T.circ(xc, zc, p.h / 2); T.cross(xc, zc, p.h / 2);
            T.vdim(0, p.B, 0, -1, 1, 'B'); T.hdim(0, p.m, 0, -1, 1, N(p.m)); T.note(p.A - r + r * 0.707, r - r * 0.707, p.A + o, -o * 0.4, '4X R' + N(r));
            R.rect(0, 0, p.B, p.C); R.line(0, C2, p.B, C2); R.pline([[p.m, p.C], [p.m + Dt, p.C + p.D], [p.B - p.m - Dt, p.C + p.D], [p.B - p.m, p.C]]);
            return s.svg(this.title);
        }
    };

    T_.pillow = {
        title: 'Pillow block (bearing housing)',
        letters: { A: 'base length', B: 'base width', C: 'bore centre height', D: 'bore diameter' },
        range: { A: [90, 160, 5], B: [40, 75, 5], C: [30, 65, 5], D: [14, 40, 2] },
        make() { return { A: rnd(100, 150, 5), B: rnd(45, 70, 5), C: rnd(35, 60, 5), D: rnd(16, 36, 2), T: pick([10, 12, 14]), w: pick([8, 10, 12]), E: pick([20, 25, 30]), h: pick([8, 10, 12]), e: pick([10, 12, 15]) }; },
        ok(p) { const Rb = p.D / 2 + p.w; return p.C - p.D / 2 >= p.T + 4 && p.A / 2 - Rb - (p.e + p.h / 2) >= 4 && p.E <= p.B - 10 && p.e >= p.h / 2 + 3 && p.B / 2 >= p.h / 2 + 3; },
        notes: (p) => ['Base ' + N(p.T) + ' mm thick', 'Upright ' + N(p.E) + ' mm thick, centred on the base; its top is a half circle of radius R = D/2 + ' + N(p.w) + ' (equation), centred on the bore',
            'Bore Ø D through the upright', '2 holes Ø' + N(p.h) + ' through the base, ' + N(p.e) + ' mm from each end, centred on the width'],
        origin: 'the bottom back left corner of the base',
        body(p) {
            const Rb = p.D / 2 + p.w, z0 = (p.B - p.E) / 2, z1 = z0 + p.E, xc = p.A / 2;
            return [[1, box(0, 0, 0, p.A, p.T, p.B)], [1, box(xc - Rb, p.T, z0, xc + Rb, p.C, z1)], [1, ext(Reg.sector(xc, p.C, 0, Rb, 0, PI), 'z', z0, z1)],
                [-1, cyl('z', xc, p.C, p.D / 2, z0, z1)], [-1, cyl('y', p.e, p.B / 2, p.h / 2, 0, p.T)], [-1, cyl('y', p.A - p.e, p.B / 2, p.h / 2, 0, p.T)]];
        },
        draw(p) {
            const Rb = p.D / 2 + p.w, z0 = (p.B - p.E) / 2, z1 = z0 + p.E, xc = p.A / 2, t = p.T;
            const s = sheet([0, p.A], [0, p.C + Rb], [0, p.B]), { F, T, R } = s, o = s.off;
            F.pline([[xc - Rb, p.C], [xc - Rb, t], [0, t], [0, 0], [p.A, 0], [p.A, t], [xc + Rb, t], [xc + Rb, p.C]]); F.arc(xc, p.C, Rb, 0, 180);
            F.circ(xc, p.C, p.D / 2); F.cross(xc, p.C, Rb * 0.85); F.line(xc + Rb, p.C, p.A + o * 0.3, p.C, 'c');
            [p.e, p.A - p.e].forEach((x) => [-1, 1].forEach((k) => F.line(x + k * p.h / 2, 0, x + k * p.h / 2, t, 'h')));
            F.hdim(0, p.A, 0, 1, 1, 'A'); F.vdim(0, p.C, p.A, 1, 1, 'C'); F.vdim(0, t, 0, -1, 1, N(t));
            F.note(xc + p.D / 2 * 0.707, p.C + p.D / 2 * 0.707, xc + Rb + o * 0.8, p.C + Rb + o * 0.7, 'Ø D THRU');
            F.note(xc - Rb * 0.707, p.C + Rb * 0.707, xc - Rb - o * 1.5, p.C + Rb + o * 0.4, 'R = D/2 + ' + N(p.w)); F.origin(0, 0);
            T.rect(0, 0, p.A, p.B); T.rect(xc - Rb, z0, xc + Rb, z1); T.line(xc - p.D / 2, z0, xc - p.D / 2, z1, 'h'); T.line(xc + p.D / 2, z0, xc + p.D / 2, z1, 'h');
            [p.e, p.A - p.e].forEach((x) => { T.circ(x, p.B / 2, p.h / 2); T.cross(x, p.B / 2, p.h / 2); });
            T.vdim(0, p.B, 0, -1, 1, 'B'); T.vdim(z0, z1, xc + Rb, 1, (p.A - xc - Rb) / o + 1, N(p.E)); T.hdim(0, p.e, 0, -1, 1, N(p.e));
            T.note(p.e + p.h * 0.35, p.B / 2 + p.h * 0.35, p.e + o, p.B + o * 0.9, '2X Ø' + N(p.h) + ' THRU');
            R.rect(0, 0, p.B, t); R.rect(z0, t, z1, p.C + Rb); R.line(z0, p.C - p.D / 2, z1, p.C - p.D / 2, 'h'); R.line(z0, p.C + p.D / 2, z1, p.C + p.D / 2, 'h'); R.line(z0 - o * 0.4, p.C, z1 + o * 0.4, p.C, 'c');
            return s.svg(this.title);
        }
    };

    T_.hexspacer = {
        title: 'Hex spacer with a shoulder',
        letters: { A: 'hex across flats', B: 'hex length', C: 'shoulder diameter', D: 'shoulder length' },
        range: { A: [20, 44, 2], B: [12, 45, 1], C: [12, 36, 2], D: [8, 45, 1] },
        make() { const h = pick([6, 8, 10]); return { A: rnd(24, 40, 2), B: rnd(15, 35, 1), C: rnd(16, 32, 2), D: rnd(10, 35, 1), h, hc: h + pick([4, 6]), hd: pick([4, 5, 6]) }; },
        ok: (p) => p.C <= p.A - 4 && p.hc <= p.C - 6 && p.hc <= p.A - 8 && p.hd <= p.B - 4,
        notes: (p) => ['Hex: flats at the top and bottom; across flats A', 'Hole Ø' + N(p.h) + ' through, on the axis', 'Counterbore Ø' + N(p.hc) + ' × ' + N(p.hd) + ' deep in the back (hex) face'],
        origin: 'the centre of the back (hex) face',
        body(p) {
            return [[1, ext(Reg.hex(0, 0, p.A), 'z', 0, p.B)], [1, cyl('z', 0, 0, p.C / 2, p.B, p.B + p.D)],
                [-1, cyl('z', 0, 0, p.hc / 2, 0, p.hd)], [-1, cyl('z', 0, 0, p.h / 2, p.hd, p.B + p.D)]];
        },
        draw(p) {
            const Rc = p.A / Math.sqrt(3), L = p.B + p.D, s = sheet([-Rc, Rc], [-p.A / 2, p.A / 2], [0, L]), { F, T, R } = s, o = s.off;
            F.poly([0, 1, 2, 3, 4, 5].map((i) => [Rc * Math.cos(i * PI / 3), Rc * Math.sin(i * PI / 3)])); F.circ(0, 0, p.C / 2); F.circ(0, 0, p.h / 2); F.circ(0, 0, p.hc / 2, 'h'); F.cross(0, 0, Rc);
            F.vdim(-p.A / 2, p.A / 2, -Rc / 2, -1, Rc / 2 / o + 1, 'A');
            F.note(p.C / 2 * 0.707, -p.C / 2 * 0.707, Rc + o * 0.4, -p.A / 2 - o * 0.7, 'Ø C'); F.note(-p.h / 2 * 0.707, p.h / 2 * 0.707, -Rc * 0.6 - o, p.A / 2 + o * 0.9, 'Ø' + N(p.h) + ' THRU');
            F.origin(0, 0);
            T.rect(-Rc, 0, Rc, p.B); T.line(-Rc / 2, 0, -Rc / 2, p.B); T.line(Rc / 2, 0, Rc / 2, p.B); T.rect(-p.C / 2, p.B, p.C / 2, L);
            [-1, 1].forEach((k) => { T.line(k * p.h / 2, p.hd, k * p.h / 2, L, 'h'); T.line(k * p.hc / 2, 0, k * p.hc / 2, p.hd, 'h'); });
            T.line(-p.hc / 2, p.hd, p.hc / 2, p.hd, 'h'); T.line(0, -o * 0.4, 0, L + o * 0.4, 'c');
            T.vdim(0, p.B, -Rc, -1, 1, 'B'); T.vdim(p.B, L, -p.C / 2, -1, (Rc - p.C / 2) / o + 1, 'D');
            T.note(p.hc / 2, p.hd * 0.5, Rc + o, -o * 0.3, 'C\'BORE Ø' + N(p.hc) + ' × ' + N(p.hd));
            R.rect(0, -p.A / 2, p.B, p.A / 2); R.line(0, 0, p.B, 0); R.rect(p.B, -p.C / 2, L, p.C / 2);
            [-1, 1].forEach((k) => R.line(p.hd, k * p.h / 2, L, k * p.h / 2, 'h'));
            return s.svg(this.title);
        }
    };

    T_.channel = {
        title: 'U-channel with slots and side holes',
        letters: { A: 'length', B: 'outside width', C: 'outside height', D: 'slot length' },
        range: { A: [100, 220, 10], B: [40, 90, 5], C: [30, 70, 5], D: [16, 50, 2] },
        make() { return { A: rnd(110, 200, 10), B: rnd(45, 80, 5), C: rnd(30, 60, 5), D: rnd(20, 44, 2), T: pick([4, 5, 6, 8]), w: pick([8, 10, 12]), h: pick([8, 10]) }; },
        ok: (p) => p.D <= p.A / 2 - 10 && p.D >= p.w + 4 && p.w <= p.B - 2 * p.T - 6 && p.h / 2 + 3 <= (p.C - p.T) / 2,
        notes: (p) => ['Wall and base: ' + N(p.T) + ' mm thick', '2 slots through the base, D long overall and ' + N(p.w) + ' mm wide, centred on the width, at A/4 and 3A/4 from the back end',
            'Hole Ø' + N(p.h) + ' through both side walls, halfway along, at height (C + ' + N(p.T) + ')/2'],
        origin: 'the bottom back left corner',
        body(p) {
            const yh = (p.C + p.T) / 2;
            return [[1, ext(Reg.poly([[0, 0], [p.B, 0], [p.B, p.C], [p.B - p.T, p.C], [p.B - p.T, p.T], [p.T, p.T], [p.T, p.C], [0, p.C]]), 'z', 0, p.A)],
                [-1, ext(Reg.slot(p.B / 2, p.A / 4, p.D, p.w, 'v'), 'y', 0, p.T)], [-1, ext(Reg.slot(p.B / 2, 3 * p.A / 4, p.D, p.w, 'v'), 'y', 0, p.T)],
                [-1, cyl('x', yh, p.A / 2, p.h / 2, 0, p.T)], [-1, cyl('x', yh, p.A / 2, p.h / 2, p.B - p.T, p.B)]];
        },
        draw(p) {
            const s = sheet([0, p.B], [0, p.C], [0, p.A]), { F, T, R } = s, t = p.T, yh = (p.C + t) / 2, r = p.w / 2, L = p.D - p.w, o = s.off;
            F.poly([[0, 0], [p.B, 0], [p.B, p.C], [p.B - t, p.C], [p.B - t, t], [t, t], [t, p.C], [0, p.C]]);
            [-1, 1].forEach((k) => { F.line(p.B / 2 + k * r, 0, p.B / 2 + k * r, t, 'h'); F.line(0, yh + k * p.h / 2, t, yh + k * p.h / 2, 'h'); F.line(p.B - t, yh + k * p.h / 2, p.B, yh + k * p.h / 2, 'h'); });
            F.hdim(0, p.B, 0, 1, 1, 'B'); F.vdim(0, p.C, 0, -1, 1, 'C'); F.hdim(p.B - t, p.B, p.C, -1, 1, N(t)); F.origin(0, 0);
            T.rect(0, 0, p.B, p.A); T.line(t, 0, t, p.A); T.line(p.B - t, 0, p.B - t, p.A);
            [p.A / 4, 3 * p.A / 4].forEach((z) => { T.line(p.B / 2 - r, z - L / 2, p.B / 2 - r, z + L / 2); T.line(p.B / 2 + r, z - L / 2, p.B / 2 + r, z + L / 2); T.arc(p.B / 2, z + L / 2, r, 0, 180); T.arc(p.B / 2, z - L / 2, r, 180, 360); });
            [-1, 1].forEach((k) => { T.line(0, p.A / 2 + k * p.h / 2, t, p.A / 2 + k * p.h / 2, 'h'); T.line(p.B - t, p.A / 2 + k * p.h / 2, p.B, p.A / 2 + k * p.h / 2, 'h'); });
            T.vdim(0, p.A, 0, -1, 1, 'A'); T.vdim(0, p.A / 4, p.B, 1, 1, 'A/4'); T.vdim(0, 3 * p.A / 4, p.B, 1, 2, '3A/4');
            T.note(p.B / 2 + r, 3 * p.A / 4 + L / 2, p.B + o * 3, 3 * p.A / 4 + p.D, '2X SLOT D × ' + N(p.w));
            R.rect(0, 0, p.A, p.C); R.line(0, t, p.A, t, 'h'); R.circ(p.A / 2, yh, p.h / 2); R.cross(p.A / 2, yh, p.h / 2);
            R.vdim(0, yh, 0, 1, 1, '(C+' + N(t) + ')/2'); R.note(p.A / 2 + p.h * 0.35, yh + p.h * 0.35, p.A / 2 - o, p.C + o, 'Ø' + N(p.h) + ' THRU BOTH WALLS');
            return s.svg(this.title);
        }
    };

    T_.clevis = {
        title: 'Clevis (fork) with a pin hole',
        letters: { A: 'overall width', B: 'depth', C: 'pin hole height', D: 'gap between the arms' },
        range: { A: [50, 100, 5], B: [24, 50, 2], C: [35, 85, 5], D: [14, 44, 2] },
        make() { return { A: rnd(55, 90, 5), B: rnd(26, 44, 2), C: rnd(40, 75, 5), D: rnd(18, 40, 2), E: pick([12, 15, 18, 20]), h: pick([8, 10, 12]), hb: pick([8, 10, 12]) }; },
        ok: (p) => (p.A - p.D) / 2 >= 8 && p.C - p.h / 2 >= p.E + 4 && p.h / 2 <= p.B / 2 - 4 && p.hb <= p.D - 4 && p.hb <= p.B - 8,
        notes: (p) => ['Base ' + N(p.E) + ' mm high; 2 equal arms, D apart, with rounded tops of radius B/2 centred on the pin hole',
            'Pin hole Ø' + N(p.h) + ' through both arms, at height C, centred on the depth', 'Hole Ø' + N(p.hb) + ' through the base, in the middle'],
        origin: 'the bottom back left corner',
        body(p) {
            const t = (p.A - p.D) / 2, rect = Reg.rect(p.E, 0, p.C, p.B), half = Reg.sector(p.C, p.B / 2, 0, p.B / 2, -PI / 2, PI / 2), out = [[1, box(0, 0, 0, p.A, p.E, p.B)]];
            [[0, t], [p.A - t, p.A]].forEach(([x0, x1]) => { out.push([1, ext(rect, 'x', x0, x1)], [1, ext(half, 'x', x0, x1)], [-1, cyl('x', p.C, p.B / 2, p.h / 2, x0, x1)]); });
            out.push([-1, cyl('y', p.A / 2, p.B / 2, p.hb / 2, 0, p.E)]);
            return out;
        },
        draw(p) {
            const t = (p.A - p.D) / 2, top = p.C + p.B / 2, s = sheet([0, p.A], [0, top], [0, p.B]), { F, T, R } = s, o = s.off;
            F.poly([[0, 0], [p.A, 0], [p.A, top], [p.A - t, top], [p.A - t, p.E], [t, p.E], [t, top], [0, top]]);
            [-1, 1].forEach((k) => { F.line(0, p.C + k * p.h / 2, t, p.C + k * p.h / 2, 'h'); F.line(p.A - t, p.C + k * p.h / 2, p.A, p.C + k * p.h / 2, 'h'); F.line(p.A / 2 + k * p.hb / 2, 0, p.A / 2 + k * p.hb / 2, p.E, 'h'); });
            F.line(-o * 0.4, p.C, p.A + o * 0.4, p.C, 'c');
            F.hdim(0, p.A, 0, 1, 1, 'A'); F.hdim(t, p.A - t, top, -1, 1, 'D'); F.vdim(0, p.C, p.A, 1, 1, 'C'); F.vdim(0, p.E, 0, -1, 1, N(p.E)); F.origin(0, 0);
            R.pline([[0, p.C], [0, 0], [p.B, 0], [p.B, p.C]]); R.arc(p.B / 2, p.C, p.B / 2, 0, 180); R.circ(p.B / 2, p.C, p.h / 2); R.cross(p.B / 2, p.C, p.B / 2 * 0.8);
            [-1, 1].forEach((k) => R.line(p.B / 2 + k * p.hb / 2, 0, p.B / 2 + k * p.hb / 2, p.E, 'h'));
            R.hdim(0, p.B, 0, 1, 1, 'B'); R.note(p.B / 2 - p.h * 0.35, p.C + p.h * 0.35, -o * 0.3, top + o * 0.6, 'Ø' + N(p.h) + ' THRU BOTH, R = B/2');
            T.rect(0, 0, p.A, p.B); T.line(t, 0, t, p.B); T.line(p.A - t, 0, p.A - t, p.B); T.circ(p.A / 2, p.B / 2, p.hb / 2); T.cross(p.A / 2, p.B / 2, p.hb / 2);
            [-1, 1].forEach((k) => { T.line(0, p.B / 2 + k * p.h / 2, t, p.B / 2 + k * p.h / 2, 'h'); T.line(p.A - t, p.B / 2 + k * p.h / 2, p.A, p.B / 2 + k * p.h / 2, 'h'); });
            T.note(p.A / 2 + p.hb * 0.35, p.B / 2 - p.hb * 0.35, p.A + o, -o * 0.3, 'Ø' + N(p.hb) + ' THRU');
            return s.svg(this.title);
        }
    };

    const TEMPLATES = T_;
    const LETTERS = ['A', 'B', 'C', 'D'];

    /* =====================================================================
       Problems: 3 stages of one part
       ===================================================================== */
    function makeValid(tpl) {
        const t = TEMPLATES[tpl];
        for (let i = 0; i < 500; i++) { const p = t.make(); if (t.ok(p)) return p; }
        throw new Error('No valid sizes for ' + tpl);
    }
    function changeSizes(tpl, p, keys) {
        const t = TEMPLATES[tpl];
        for (let i = 0; i < 400; i++) {
            const q = Object.assign({}, p), ch = [];
            keys.forEach((k) => { const r = t.range[k]; let v; do { v = rnd(r[0], r[1], r[2]); } while (v === p[k]); q[k] = v; ch.push({ key: k, from: p[k], to: v }); });
            if (t.ok(q)) return { p: q, changes: ch };
        }
        return null;
    }
    // A whole problem: Stage 1 build, Stage 2 change 2 sizes, Stage 3 change 1 or 2 more (and maybe the material)
    function problem(tpl) {
        for (let tries = 0; tries < 50; tries++) {
            const p1 = makeValid(tpl), mat1 = pick(MATERIALS);
            const order = shuffle(LETTERS), s2 = changeSizes(tpl, p1, order.slice(0, 2));
            if (!s2) continue;
            const s3 = changeSizes(tpl, s2.p, RNG() < 0.5 ? order.slice(2, 4) : [order[2]]);
            if (!s3) continue;
            const mat3 = RNG() < 0.4 ? pick(MATERIALS.filter((m) => m.rho !== mat1.rho)) : mat1;
            return { tpl, stages: [{ p: p1, mat: mat1, changes: [] }, { p: s2.p, mat: mat1, changes: s2.changes }, { p: s3.p, mat: mat3, changes: s3.changes, matFrom: mat3 !== mat1 ? mat1 : null }] };
        }
        throw new Error('Could not make a problem for ' + tpl);
    }
    // Exact answers for a part: volume mm³, mass g, centre of mass mm
    function solve(tpl, p, mat) {
        const r = props(TEMPLATES[tpl].body(p));
        return { V: r.V, mass: r.V * mat.rho / 1e6, com: r.c };
    }
    // CSWP-style marking: within 1%. For a centre of mass near 0, within 0.01 mm.
    const within = (typed, exact) => { const v = parseFloat(String(typed).replace(',', '.')); return isFinite(v) && Math.abs(v - exact) <= Math.max(Math.abs(exact) * 0.01, 0.01); };

    /* =====================================================================
       Theory questions with new numbers every time
       Each generator returns { topic, q, options (first one right), explain, table? }
       ===================================================================== */
    function numOpts(right, wrong, dec, unit) {
        const f = (v) => fx(v, dec) + (unit ? ' ' + unit : '');
        const out = [f(right)];
        wrong.forEach((w) => { if (out.length < 4 && isFinite(w) && w > 0 && !out.includes(f(w))) out.push(f(w)); });
        for (let k = 1; out.length < 4 && k < 40; k++) { const v = right * (1 + (k % 2 ? 1 : -1) * (0.08 + 0.05 * Math.ceil(k / 2))); if (v > 0 && !out.includes(f(v))) out.push(f(v)); }
        return out;
    }
    const concept = (topic, list) => () => { const c = pick(list); return { topic, q: c[0], options: c[1], explain: c[2] }; };
    const YIELD = [['Plain Carbon Steel', 220.6], ['AISI 304', 206.8], ['6061-T6 (SS)', 275], ['1060 Alloy', 27.57], ['AISI 1020', 351.6]];
    const E_MOD = [['steel', 210000], ['aluminium alloy', 69000]];

    const GEN = {
        /* ---------- Sheet metal ---------- */
        smBA() {
            const th = pick([45, 60, 90, 120, 135]), R = pick([1, 1.5, 2, 3, 4, 5]), T = pick([1, 1.5, 2, 2.5, 3]), K = pick([0.3, 0.33, 0.4, 0.44, 0.45]);
            const ba = deg(th) * (R + K * T);
            return { topic: 'Sheet metal', q: 'A ' + th + '° bend has an inside radius of ' + R + ' mm in ' + T + ' mm sheet, with a K-factor of ' + K + '. What is the bend allowance?',
                options: numOpts(ba, [deg(th) * (R + 0.5 * T), deg(th) * (R + T), deg(th) * R, deg(th) * (R + K * T) * 2], 2, 'mm'),
                explain: 'Bend allowance is the arc length of the neutral axis: BA = θ × π/180 × (R + K × T) = ' + th + ' × π/180 × (' + R + ' + ' + K + ' × ' + T + ') = ' + fx(ba) + ' mm.' };
        },
        smK() {
            const th = pick([90, 90, 120, 60]), R = pick([1, 2, 3, 4]), T = pick([1.5, 2, 2.5, 3]), K = pick([0.32, 0.35, 0.38, 0.4, 0.42, 0.45]);
            const ba = +fx(deg(th) * (R + K * T), 3), k = (ba / deg(th) - R) / T;
            return { topic: 'Sheet metal', q: 'A test piece in ' + T + ' mm sheet, bent ' + th + '° with an inside radius of ' + R + ' mm, has a measured bend allowance of ' + ba + ' mm. What K-factor should you use?',
                options: numOpts(k, [k + 0.1, k - 0.08, 0.5, (ba / deg(th)) / T], 3, ''),
                explain: 'From BA = θ(R + K·T): K = (BA ÷ θ − R) ÷ T = (' + ba + ' ÷ ' + fx(deg(th), 4) + ' − ' + R + ') ÷ ' + T + ' = ' + fx(k, 3) + '. θ is in radians.' };
        },
        smFlat() {
            const L1 = rnd(30, 120, 5), L2 = rnd(20, 90, 5), R = pick([1, 2, 3]), T = pick([1, 1.5, 2, 3]), K = pick([0.33, 0.4, 0.44]);
            const ba = PI / 2 * (R + K * T), bd = 2 * (R + T) - ba, flat = L1 + L2 - bd;
            return { topic: 'Sheet metal', q: 'An L-shaped part has outside flange lengths of ' + L1 + ' mm and ' + L2 + ' mm, one 90° bend, ' + T + ' mm sheet, inside radius ' + R + ' mm and K-factor ' + K + '. What is the flat length?',
                options: numOpts(flat, [L1 + L2, L1 + L2 - 2 * T, L1 + L2 - ba, L1 + L2 - 2 * (R + T)], 2, 'mm'),
                explain: 'BA = π/2 × (' + R + ' + ' + K + ' × ' + T + ') = ' + fx(ba) + ' mm. For 90° the outside setback is R + T = ' + (R + T) + ' mm, so the bend deduction BD = 2 × ' + (R + T) + ' − ' + fx(ba) + ' = ' + fx(bd) + ' mm. Flat length = ' + L1 + ' + ' + L2 + ' − ' + fx(bd) + ' = ' + fx(flat) + ' mm.' };
        },
        smBD() {
            const th = pick([60, 120, 135, 45]), R = pick([1, 2, 3]), T = pick([1, 2, 2.5, 3]), K = pick([0.33, 0.4, 0.45]);
            const ba = deg(th) * (R + K * T), os = Math.tan(deg(th) / 2) * (R + T), bd = 2 * os - ba;
            return { topic: 'Sheet metal', q: 'For a ' + th + '° bend with inside radius ' + R + ' mm, sheet ' + T + ' mm and K-factor ' + K + ', what is the bend deduction?',
                options: numOpts(bd, [2 * os, ba, 2 * (R + T) - ba, os - ba / 2 + 1], 3, 'mm'),
                explain: 'Outside setback OSSB = tan(θ/2) × (R + T) = ' + fx(os, 3) + ' mm. BA = θ × π/180 × (R + K·T) = ' + fx(ba, 3) + ' mm. BD = 2 × OSSB − BA = ' + fx(bd, 3) + ' mm.' };
        },
        smConcept: concept('Sheet metal', [
            ['What does the K-factor describe?', ['Where the neutral axis lies, as a fraction of the thickness from the inside face', 'The ratio of the bend radius to the thickness', 'The springback after bending', 'The ratio of the bend angle to 90°'], 'K = t ÷ T, where t is the distance from the inside face to the neutral axis. It is usually 0.3–0.5.'],
            ['If you increase the K-factor (same radius, thickness and angle), the bend allowance…', ['Increases', 'Decreases', 'Stays the same', 'Becomes zero'], 'BA = θ(R + K·T): a larger K moves the neutral axis outwards, making it longer.'],
            ['Which method lets SOLIDWORKS read bend allowances from a table of radius, thickness and angle?', ['Bend table', 'K-factor', 'Bend deduction', 'Gauge table'], 'A bend table lists BA (or BD) values for each combination; a gauge table mainly stores thickness and radius per gauge.'],
            ['In SOLIDWORKS sheet metal, which command shows the flat pattern?', ['Flatten (or unsuppress Flat-Pattern)', 'Unfold every bend by hand', 'Convert to Bends only', 'Split line'], 'Flatten toggles the Flat-Pattern feature at the bottom of the tree.'],
            ['A Sketched Bend in SOLIDWORKS…', ['Bends a flat sheet along a sketched line', 'Adds a flange along an edge', 'Closes a corner gap', 'Makes a louvre'], 'Sketched Bend uses a line on a face as the bend line.']
        ]),

        /* ---------- Equations ---------- */
        eqLinear() {
            const W = rnd(40, 160, 5), k = pick([2, 3, 4]), c = rnd(3, 15, 1), op = pick(['-', '+']);
            const v = op === '-' ? W / k - c : W / k + c;
            return { topic: 'Equations', q: 'The global variable "W" = ' + W + '. The equation "D1@Sketch1" = "W" / ' + k + ' ' + op + ' ' + c + '. What value does D1 take?',
                options: numOpts(v, [W / k, op === '-' ? (W - c) / k : (W + c) / k, op === '-' ? W / k + c : W / k - c, W * k - c], 2, 'mm'),
                explain: 'Division comes before ' + (op === '-' ? 'subtraction' : 'addition') + ': ' + W + ' ÷ ' + k + ' ' + op + ' ' + c + ' = ' + fx(v) + ' mm.' };
        },
        eqIIF() {
            const lim = rnd(50, 120, 10), W = rnd(30, 150, 5), a = pick([4, 6, 8]), b = pick([2, 3]), v = W > lim ? a : b;
            return { topic: 'Equations', q: '"W" = ' + W + '. The hole count is set by "N" = IIF("W" > ' + lim + ', ' + a + ', ' + b + '). How many holes does the pattern have?',
                options: numOpts(v, [v === a ? b : a, a + b, Math.round(W / 20)], 0, ''),
                explain: 'IIF(test, if true, if false): ' + W + ' > ' + lim + ' is ' + (W > lim ? 'true' : 'false') + ', so N = ' + v + '.' };
        },
        eqSpacing() {
            const L = rnd(150, 400, 10), e = rnd(10, 25, 5), pmax = rnd(30, 60, 5), n = Math.floor((L - 2 * e) / pmax) + 1, sp = (L - 2 * e) / (n - 1);
            return { topic: 'Equations', q: 'A plate is ' + L + ' mm long. Holes start ' + e + ' mm from each end. "N" = int(("L" − 2 × "E") / ' + pmax + ') + 1 sets the count, and "S" = ("L" − 2 × "E") / ("N" − 1) the spacing. With "L" = ' + L + ' and "E" = ' + e + ', what is S?',
                options: numOpts(sp, [pmax, (L - 2 * e) / n, L / (n - 1), (L - e) / (n - 1)], 2, 'mm'),
                explain: 'N = int(' + (L - 2 * e) + ' ÷ ' + pmax + ') + 1 = ' + n + ' holes. S = ' + (L - 2 * e) + ' ÷ ' + (n - 1) + ' = ' + fx(sp) + ' mm.' };
        },
        eqChain() {
            const W = rnd(60, 140, 10), f = pick([0.5, 0.6, 0.75]), T = rnd(4, 12, 1), H = W * f, D = H - 2 * T;
            return { topic: 'Equations', q: '"H" = "W" × ' + f + ' and "D2@Sketch2" = "H" − 2 × "T". If "W" = ' + W + ' and "T" = ' + T + ', what is D2?',
                options: numOpts(D, [H, H - T, W - 2 * T, (W - 2 * T) * f + 1], 2, 'mm'),
                explain: 'H = ' + W + ' × ' + f + ' = ' + N(H) + '; D2 = ' + N(H) + ' − 2 × ' + T + ' = ' + N(D) + ' mm.' };
        },
        eqConcept: concept('Equations', [
            ['How is a dimension named in a SOLIDWORKS equation?', ['"D1@Sketch1" (dimension name @ feature or sketch, in quotes)', 'Sketch1.D1', '[D1]', 'D1 without quotes'], 'Dimensions and global variables are written in double quotes, e.g. "D1@Boss-Extrude1".'],
            ['A dimension that an equation drives…', ['Can no longer be edited directly; it shows the Σ symbol', 'Can still be edited by double-clicking it', 'Is deleted', 'Becomes a reference dimension in the drawing only'], 'Driven dimensions show Σ; change the equation or the variable instead.'],
            ['What is a global variable?', ['A named value, e.g. "Width" = 80, that equations can use', 'A dimension shared between two parts automatically', 'A material property', 'A custom property for the BOM'], 'Global variables keep design intent in one place: change the value, and everything linked updates.'],
            ['Where do you check or edit all the equations of a part?', ['Tools > Equations (Equations, Global Variables and Dimensions dialog)', 'Mass Properties', 'Design Library', 'Configuration Publisher'], 'The Equations dialog lists global variables, feature suppression and equations.']
        ]),

        /* ---------- Design tables ---------- */
        dtLookup() {
            const names = shuffle(['Small', 'Medium', 'Large', 'XL', 'Short', 'Long', 'Std']).slice(0, 4), rows = names.map(() => [rnd(20, 90, 5), rnd(5, 30, 1), pick(['S', 'U'])]);
            const i = Math.floor(RNG() * 4), ask = pick(['D1', 'D2']);
            const col = ask === 'D1' ? 0 : 1, v = rows[i][col];
            return { topic: 'Design tables', q: 'Using this design table, what is ' + ask + ' in configuration "' + names[i] + '"?',
                table: { head: ['', 'D1@Sketch1', 'D2@Boss-Extrude1', '$STATE@Fillet1'], rows: rows.map((r, k) => [names[k]].concat(r)) },
                options: numOpts(v, [rows[i][1 - col]].concat(rows.filter((r, k) => k !== i).map((r) => r[col])), 0, 'mm'),
                explain: 'Each row is a configuration and each column header names a parameter: in row "' + names[i] + '", the ' + ask + ' column is ' + v + '.' };
        },
        dtState() {
            const names = shuffle(['Cfg-A', 'Cfg-B', 'Cfg-C', 'Cfg-D', 'Cfg-E']).slice(0, 4), st = shuffle(['S', 'U', 'U', 'U']);
            const i = st.indexOf('S');
            return { topic: 'Design tables', q: 'In which configuration is Fillet1 suppressed?',
                table: { head: ['', 'D1@Sketch1', '$STATE@Fillet1'], rows: names.map((n, k) => [n, rnd(20, 60, 5), st[k]]) },
                options: [names[i]].concat(names.filter((n, k) => k !== i)),
                explain: '$STATE@Feature controls suppression: S = suppressed, U = unsuppressed. Only "' + names[i] + '" has S.' };
        },
        dtMass() {
            const W = rnd(20, 50, 5), H = rnd(10, 30, 5), m = pick(MATERIALS), names = ['L-100', 'L-150', 'L-200'], Ls = [rnd(60, 100, 5), rnd(110, 150, 5), rnd(160, 220, 10)];
            const i = Math.floor(RNG() * 3), mass = Ls[i] * W * H * m.rho / 1e6;
            return { topic: 'Design tables', q: 'A ' + W + ' × ' + H + ' mm bar in ' + m.name + ' (' + m.rho + ' kg/m³) has its length set by this design table. What is the mass of configuration "' + names[i] + '"?',
                table: { head: ['', 'Length@Extrude1'], rows: names.map((n, k) => [n, Ls[k]]) },
                options: numOpts(mass, Ls.filter((L, k) => k !== i).map((L) => L * W * H * m.rho / 1e6).concat([mass * 7800 / m.rho, mass / 10]), 2, 'g'),
                explain: 'V = ' + Ls[i] + ' × ' + W + ' × ' + H + ' = ' + Ls[i] * W * H + ' mm³; mass = V × ' + gmm3(m.rho) + ' g/mm³ = ' + fx(mass) + ' g.' };
        },
        dtConcept: concept('Design tables', [
            ['In a SOLIDWORKS design table, what does the first column hold?', ['The configuration names', 'The dimension names', 'The material', 'The feature tree order'], 'Row headers (first column) are configurations; column headers are the parameters they control.'],
            ['Which header controls a custom property in a design table?', ['$PRP@Description', '$STATE@Description', '$COLOR@Description', 'D1@Description'], '$PRP@name sets a configuration-specific custom property.'],
            ['Which values does a $STATE column accept?', ['S / U (suppressed / unsuppressed)', 'Yes / No', '1 / 2', 'On / Off only'], 'S or Suppressed, U or Unsuppressed.'],
            ['What program does SOLIDWORKS use to edit an embedded design table?', ['Microsoft Excel', 'Notepad', 'eDrawings', 'The Equations dialog'], 'Design tables are Excel worksheets embedded in the part or assembly.']
        ]),

        /* ---------- Configurations ---------- */
        cfgHoles() {
            const L = rnd(80, 160, 10), W = rnd(40, 90, 5), T = rnd(5, 15, 1), n = pick([2, 4, 6]), d = pick([6, 8, 10, 12]), m = pick(MATERIALS);
            const dm = n * PI / 4 * d * d * T * m.rho / 1e6;
            return { topic: 'Configurations', q: 'A ' + L + ' × ' + W + ' × ' + T + ' mm plate in ' + m.name + ' (' + m.rho + ' kg/m³) has ' + n + ' through holes of Ø' + d + '. The configuration "Blank" suppresses the holes. How much heavier is "Blank"?',
                options: numOpts(dm, [n * PI * d * d * T * m.rho / 1e6, dm / n, PI / 4 * d * d * T * m.rho / 1e5 * n], 2, 'g'),
                explain: 'The extra metal is ' + n + ' × π/4 × ' + d + '² × ' + T + ' = ' + fx(n * PI / 4 * d * d * T) + ' mm³, × ' + gmm3(m.rho) + ' g/mm³ = ' + fx(dm) + ' g.' };
        },
        cfgScope() {
            const names = ['Short', 'Mid', 'Long'], L = [rnd(40, 60, 5), rnd(70, 90, 5), rnd(100, 130, 5)], j = Math.floor(RNG() * 3), nv = rnd(140, 180, 5), k = (j + 1 + Math.floor(RNG() * 2)) % 3, all = RNG() < 0.4;
            const v = all ? nv : L[k];
            return { topic: 'Configurations', q: 'A part has 3 configurations with lengths Short = ' + L[0] + ', Mid = ' + L[1] + ', Long = ' + L[2] + ' mm. In "' + names[j] + '" you change the length to ' + nv + ' mm with "' + (all ? 'All configurations' : 'This configuration') + '". What is the length in "' + names[k] + '" now?',
                options: numOpts(v, [all ? L[k] : nv, L[j], L[(k + 1) % 3] === v ? L[(k + 2) % 3] : L[(k + 1) % 3]], 0, 'mm'),
                explain: all ? '"All configurations" applies the new value everywhere: ' + nv + ' mm.' : '"This configuration" changes only "' + names[j] + '", so "' + names[k] + '" keeps ' + L[k] + ' mm.' };
        },
        cfgConcept: concept('Configurations', [
            ['What is a derived configuration?', ['A child configuration that inherits from a parent and overrides some values', 'A configuration made by a design table only', 'A copy of the part file', 'A configuration of a drawing sheet'], 'Derived configurations sit under a parent and inherit everything they do not change.'],
            ['You suppress a feature in one configuration. What happens in the others?', ['Nothing, if "This configuration" was used', 'It is suppressed everywhere', 'The part is deleted', 'The others become derived configurations'], 'Suppression is configuration-specific by default.'],
            ['In an assembly, what can a configuration change?', ['Which components and component configurations are used, their suppression and mates', 'Only the colours', 'Only the file name', 'Only the drawing scale'], 'Assembly configurations can suppress components, mates and change referenced configurations.'],
            ['What is the difference between a display state and a configuration?', ['Display states change only appearance and visibility; configurations can change geometry', 'They are the same', 'Display states change dimensions', 'Configurations change only colours'], 'Use display states for looks, configurations for geometry and suppression.']
        ]),

        /* ---------- Advanced mates ---------- */
        mtCoupler() {
            const a = pick([1, 2, 3]), b = pick([2, 3, 4, 5]), x = rnd(6, 40, 2), v = x * b / a;
            return { topic: 'Advanced mates', q: 'A linear/linear coupler mate has a ratio of ' + a + ' mm : ' + b + ' mm. Component 1 moves ' + x + ' mm. How far does component 2 move?',
                options: numOpts(v, [x * a / b, x, x + b - a, x * b], 2, 'mm'),
                explain: 'Distance 2 = distance 1 × ' + b + ' ÷ ' + a + ' = ' + fx(v) + ' mm.' };
        },
        mtGear() {
            const n1 = pick([16, 18, 20, 24, 30]), n2 = pick([32, 36, 40, 45, 48, 60]), r = rnd(1, 6, 0.5), v = r * n1 / n2;
            return { topic: 'Advanced mates', q: 'A gear mate links a ' + n1 + '-tooth pinion to a ' + n2 + '-tooth gear (ratio set by the teeth). The pinion turns ' + r + ' revolutions. How many revolutions does the gear turn?',
                options: numOpts(v, [r * n2 / n1, r, r * n1 / n2 * 2, r - n1 / n2], 3, 'rev'),
                explain: 'Rev(gear) = rev(pinion) × N1 ÷ N2 = ' + r + ' × ' + n1 + ' ÷ ' + n2 + ' = ' + fx(v, 3) + '.' };
        },
        mtRack() {
            const d = rnd(20, 60, 5), rev = rnd(1, 5, 0.5), v = PI * d * rev;
            return { topic: 'Advanced mates', q: 'A rack and pinion mate uses a pinion with a pitch diameter of ' + d + ' mm. The pinion turns ' + rev + ' revolutions. How far does the rack travel?',
                options: numOpts(v, [d * rev, 2 * PI * d * rev, PI * d * d / 4 * rev, PI * d / 2 * rev], 2, 'mm'),
                explain: 'Travel per revolution = π × pitch diameter = ' + fx(PI * d) + ' mm. × ' + rev + ' rev = ' + fx(v) + ' mm.' };
        },
        mtScrew() {
            const p = pick([1, 1.25, 1.5, 2, 2.5, 3, 5]), x = rnd(10, 60, 2), rev = x / p;
            return { topic: 'Advanced mates', q: 'A screw mate has a pitch of ' + p + ' mm per revolution. How many turns move the nut ' + x + ' mm?',
                options: numOpts(rev, [x * p, x / (2 * p), x / p + 1], 2, 'rev'),
                explain: 'Turns = distance ÷ pitch = ' + x + ' ÷ ' + p + ' = ' + fx(rev) + '.' };
        },
        mtLimit() {
            const min = rnd(0, 20, 2), max = min + rnd(20, 80, 5), cur = rnd(min + 2, max - 2, 1), dir = pick(['open', 'close']), v = dir === 'open' ? max - cur : cur - min;
            return { topic: 'Advanced mates', q: 'A distance limit mate allows ' + min + ' mm to ' + max + ' mm between two faces; they are now ' + cur + ' mm apart. How much further can the faces ' + (dir === 'open' ? 'move apart' : 'move together') + '?',
                options: numOpts(v, [max - min, dir === 'open' ? cur - min : max - cur, max, cur], 0, 'mm'),
                explain: (dir === 'open' ? 'Up to the maximum: ' + max + ' − ' + cur : 'Down to the minimum: ' + cur + ' − ' + min) + ' = ' + v + ' mm.' };
        },
        mtConcept: concept('Advanced mates', [
            ['Which mate centres a tab between the two faces of a slot?', ['Width', 'Symmetric', 'Coincident', 'Path'], 'A width mate centres one pair of faces (or a feature) between another pair.'],
            ['Which mate keeps two components mirror-images about a plane?', ['Symmetric', 'Width', 'Parallel', 'Lock'], 'Symmetric makes two entities symmetric about a plane or planar face.'],
            ['Which mate moves a point of a component along a curve or a set of edges?', ['Path mate', 'Cam mate', 'Gear mate', 'Profile center'], 'Path mates constrain a point to a path, with optional pitch/yaw control.'],
            ['A cam-follower mate is made between…', ['A cylinder, plane or point and a set of tangent extruded faces', 'Two gears', 'Two planes only', 'A screw and a nut'], 'The follower stays in contact with the cam profile.'],
            ['Which mate type keeps two components from moving relative to each other?', ['Lock', 'Hinge', 'Slot', 'Universal joint'], 'Lock fixes the position and orientation of one component relative to another.']
        ]),

        /* ---------- Interference & collision ---------- */
        ifBoxes() {
            const a = [rnd(40, 80, 5), rnd(20, 50, 5), rnd(20, 50, 5)], o = a.map((s) => rnd(5, s - 5, 1)), b = [rnd(30, 70, 5), rnd(20, 50, 5), rnd(20, 50, 5)];
            const ov = a.map((s, i) => Math.max(0, Math.min(s, o[i] + b[i]) - o[i])), v = ov[0] * ov[1] * ov[2];
            return { topic: 'Interference & collision', q: 'Block 1 spans 0–' + a[0] + ' (X), 0–' + a[1] + ' (Y), 0–' + a[2] + ' (Z) mm. Block 2 is ' + b[0] + ' × ' + b[1] + ' × ' + b[2] + ' mm with its corner at (' + o.join(', ') + '). What interference volume will Interference Detection report?',
                options: numOpts(v, [b[0] * b[1] * b[2], ov[0] * ov[1] * Math.min(a[2], b[2]), (a[0] - o[0]) * (a[1] - o[1]) * (a[2] - o[2]) + 1, v * 2], 0, 'mm³'),
                explain: 'Overlap in each direction: X ' + ov[0] + ', Y ' + ov[1] + ', Z ' + ov[2] + ' mm, so the volume is ' + ov.join(' × ') + ' = ' + v + ' mm³.' };
        },
        ifPin() {
            const D = rnd(8, 30, 1), dd = pick([-0.2, -0.1, -0.05, 0.03, 0.05, 0.1, 0.2]), d = r3(D + dd), L = rnd(10, 40, 5);
            if (d > D) {
                const v = PI / 4 * (d * d - D * D) * L;
                return { topic: 'Interference & collision', q: 'A Ø' + d + ' mm pin sits in a Ø' + D + ' mm hole, engaged ' + L + ' mm. What interference volume does Interference Detection report?',
                    options: numOpts(v, [PI / 4 * (d - D) ** 2 * L, PI * (d * d - D * D) * L, PI * d * (d - D) * L * 2, v / 2], 2, 'mm³'),
                    explain: 'The pin is larger than the hole, so they overlap in a thin ring: π/4 × (' + d + '² − ' + D + '²) × ' + L + ' = ' + fx(v) + ' mm³.' };
            }
            return { topic: 'Interference & collision', q: 'A Ø' + d + ' mm pin sits in a Ø' + D + ' mm hole. What does Interference Detection report for this pair?',
                options: ['No interference: there is ' + fx(D - d, 2) + ' mm diametral clearance', 'Interference of ' + fx(D - d, 2) + ' mm', 'Interference, because the faces are concentric', 'An error: concentric cylinders cannot be checked'],
                explain: 'The pin is smaller than the hole, so the parts do not overlap. Clearance = ' + D + ' − ' + d + ' = ' + fx(D - d, 2) + ' mm on the diameter.' };
        },
        ifConcept: concept('Interference & collision', [
            ['Interference Detection checks the assembly…', ['In its current position only', 'Through its whole range of motion', 'Only in the exploded view', 'Only for fasteners'], 'To catch clashes during motion, use Collision Detection while dragging or a motion study.'],
            ['What does "Treat coincidence as interference" do?', ['Reports faces that touch as interference', 'Hides coincident mates', 'Ignores touching faces', 'Makes the check faster'], 'With it on, touching faces (zero volume) are listed too.'],
            ['While you drag a component with Collision Detection and "Stop at collision" on…', ['The component stops when it touches another one', 'Other components are pushed out of the way', 'The mates are deleted', 'Interference volumes are listed'], 'Physical Dynamics would instead push the other components.'],
            ['Which tool reports the smallest gap between selected components?', ['Clearance Verification', 'Interference Detection', 'Hole Alignment', 'AssemblyXpert'], 'Clearance Verification lists clearances below a value you set.']
        ]),

        /* ---------- Simulation (FEA) ---------- */
        feFoS() {
            const m = pick(YIELD), s = r3(m[1] / (1 + RNG() * 3)), f = m[1] / s;
            return { topic: 'Simulation (FEA)', q: 'A part in ' + m[0] + ' (yield strength ' + m[1] + ' MPa) has a maximum von Mises stress of ' + fx(s, 1) + ' MPa. What is its factor of safety against yielding?',
                options: numOpts(f, [s / m[1], f * 2, (m[1] - s) / s, f / 2], 2, ''),
                explain: 'FoS = yield strength ÷ maximum von Mises stress = ' + m[1] + ' ÷ ' + fx(s, 1) + ' = ' + fx(f) + '. Above 1 means no yielding.' };
        },
        feAxial() {
            const F = rnd(2, 40, 1), d = rnd(6, 30, 1), s = F * 1000 / (PI * d * d / 4);
            return { topic: 'Simulation (FEA)', q: 'A Ø' + d + ' mm rod carries an axial pull of ' + F + ' kN. What is the axial stress?',
                options: numOpts(s, [F * 1000 / (PI * d * d), F / (PI * d * d / 4), F * 1000 / (PI * d), s * 2], 2, 'MPa'),
                explain: 'σ = F ÷ A = ' + F * 1000 + ' N ÷ (π × ' + d + '² ÷ 4 = ' + fx(PI * d * d / 4) + ' mm²) = ' + fx(s) + ' MPa (N/mm²).' };
        },
        feDefl() {
            const E = pick(E_MOD), F = rnd(100, 2000, 50), L = rnd(100, 500, 50), b = rnd(10, 40, 5), h = rnd(5, 30, 5), I = b * h ** 3 / 12, dl = F * L ** 3 / (3 * E[1] * I);
            return { topic: 'Simulation (FEA)', q: 'A ' + E[0] + ' cantilever (E = ' + E[1] / 1000 + ' GPa), ' + L + ' mm long, ' + b + ' mm wide and ' + h + ' mm deep (in the load direction), carries ' + F + ' N at its free end. What tip deflection should the simulation show?',
                options: numOpts(dl, [F * L ** 3 / (3 * E[1] * (h * b ** 3 / 12)), F * L ** 3 / (8 * E[1] * I), F * L ** 3 / (48 * E[1] * I), dl * 4], 3, 'mm'),
                explain: 'I = b·h³/12 = ' + fx(I, 1) + ' mm⁴. δ = F·L³ ÷ (3·E·I) = ' + F + ' × ' + L + '³ ÷ (3 × ' + E[1] + ' × ' + fx(I, 1) + ') = ' + fx(dl, 3) + ' mm. A good hand check for a simulation.' };
        },
        feBend() {
            const F = rnd(100, 3000, 50), L = rnd(50, 400, 25), b = rnd(10, 40, 5), h = rnd(10, 40, 5), s = 6 * F * L / (b * h * h);
            return { topic: 'Simulation (FEA)', q: 'A cantilever ' + L + ' mm long with a ' + b + ' mm wide × ' + h + ' mm deep section carries ' + F + ' N at the free end. What is the maximum bending stress at the fixed end?',
                options: numOpts(s, [6 * F * L / (h * b * b), 3 * F * L / (b * h * h), F * L / (b * h * h), 12 * F * L / (b * h * h)], 2, 'MPa'),
                explain: 'M = F·L = ' + F * L + ' N·mm. σ = M·c ÷ I = 6·M ÷ (b·h²) = ' + fx(s) + ' MPa.' };
        },
        feConcept: concept('Simulation (FEA)', [
            ['How do you know a mesh is fine enough?', ['Refine it until the result of interest stops changing much (convergence)', 'Use the coarsest mesh to save time', 'When the mesh looks blue', 'When there are more than 1000 elements'], 'A mesh convergence check is the standard way to trust a result.'],
            ['A linear static study assumes…', ['Small deflections, linear elastic material, loads applied slowly', 'Large rotations and plastic material', 'Vibrating loads', 'Contact that changes over time'], 'Outside these, use a nonlinear or dynamic study.'],
            ['Which result is usually compared with the yield strength of a ductile metal?', ['von Mises stress', 'Displacement', 'Strain energy', 'Reaction force'], 'von Mises combines the stress components into one value to compare with yield.'],
            ['Why is a "Fixed Geometry" support often too stiff?', ['Real supports flex a little, so fixed faces can over-predict stiffness and create stress hot spots', 'It removes the load', 'It doubles the mesh size', 'It ignores gravity'], 'Model supports as realistically as you can, and read results away from fixed edges.']
        ]),

        /* ---------- Mass properties ---------- */
        mpStack() {
            const a = [rnd(40, 100, 5), rnd(10, 30, 2), rnd(30, 60, 5)], b = [rnd(15, 40, 5), rnd(15, 50, 5), rnd(15, 40, 5)];
            const V1 = a[0] * a[1] * a[2], V2 = b[0] * b[1] * b[2], y = (V1 * a[1] / 2 + V2 * (a[1] + b[1] / 2)) / (V1 + V2);
            return { topic: 'Mass properties', q: 'A block ' + a.join(' × ') + ' mm (X × Y × Z) sits on the origin plane Y = 0. A ' + b.join(' × ') + ' mm block (same material) stands on its top face. What is the Y coordinate of the centre of mass?',
                options: numOpts(y, [(a[1] / 2 + a[1] + b[1] / 2) / 2, (a[1] + b[1]) / 2, a[1], (V1 * a[1] / 2 + V2 * b[1] / 2) / (V1 + V2)], 2, 'mm'),
                explain: 'Volumes ' + V1 + ' and ' + V2 + ' mm³ with centres at Y = ' + N(a[1] / 2) + ' and ' + N(a[1] + b[1] / 2) + '. Y = (' + V1 + ' × ' + N(a[1] / 2) + ' + ' + V2 + ' × ' + N(a[1] + b[1] / 2) + ') ÷ ' + (V1 + V2) + ' = ' + fx(y) + ' mm.' };
        },
        mpConvert() {
            const V = rnd(20, 900, 1), m = pick(MATERIALS), g = V * m.rho / 1000;
            return { topic: 'Mass properties', q: 'Mass Properties shows a volume of ' + V + ' cm³ for a part in ' + m.name + ' (' + m.rho + ' kg/m³). What is its mass?',
                options: numOpts(g, [V * m.rho / 1e6, V * m.rho / 100, V * m.rho, g / 10], 2, 'g'),
                explain: m.rho + ' kg/m³ = ' + m.rho / 1000 + ' g/cm³, so mass = ' + V + ' × ' + m.rho / 1000 + ' = ' + fx(g) + ' g.' };
        },
        mpSwap() {
            const a = pick(MATERIALS), b = pick(MATERIALS.filter((x) => x.rho !== a.rho)), m = rnd(50, 3000, 1), v = m * b.rho / a.rho;
            return { topic: 'Mass properties', q: 'A part weighs ' + m + ' g in ' + a.name + ' (' + a.rho + ' kg/m³). What will it weigh in ' + b.name + ' (' + b.rho + ' kg/m³)?',
                options: numOpts(v, [m * a.rho / b.rho, m, m + (b.rho - a.rho) / 10], 2, 'g'),
                explain: 'Same volume, so the mass scales with density: ' + m + ' × ' + b.rho + ' ÷ ' + a.rho + ' = ' + fx(v) + ' g.' };
        }
    };
    // Which generators belong to which group (the exam builder's topic list)
    const GROUPS = {
        seg2: { name: 'Configurations, design tables and equations', gens: ['eqLinear', 'eqIIF', 'eqSpacing', 'eqChain', 'eqConcept', 'dtLookup', 'dtState', 'dtMass', 'dtConcept', 'cfgHoles', 'cfgScope', 'cfgConcept', 'mpConvert', 'mpSwap'] },
        seg3: { name: 'Assemblies: advanced mates and interference', gens: ['mtCoupler', 'mtGear', 'mtRack', 'mtScrew', 'mtLimit', 'mtConcept', 'ifBoxes', 'ifPin', 'ifConcept', 'mpStack'] },
        sheet: { name: 'Sheet metal (K-factor, bend allowance)', gens: ['smBA', 'smK', 'smFlat', 'smBD', 'smConcept'] },
        fea: { name: 'Simulation (FEA) hand checks', gens: ['feFoS', 'feAxial', 'feDefl', 'feBend', 'feConcept'] }
    };
    GROUPS.all = { name: 'All topics', gens: Object.keys(GEN) };
    const GEN_TOPIC = {};
    Object.keys(GEN).forEach((g) => { GEN_TOPIC[g] = GEN[g]().topic; });
    const TOPICS = Array.from(new Set(Object.values(GEN_TOPIC)));

    // One theory question. group: a GROUPS key, or a topic name. Shuffled choices: order[i] is the option shown in place i.
    function theory(group, avoid) {
        const gens = GROUPS[group] ? GROUPS[group].gens : Object.keys(GEN).filter((g) => GEN_TOPIC[g] === group);
        for (let i = 0; i < 30; i++) {
            const g = pick(gens), q = GEN[g]();
            if (avoid && avoid.has(q.q) && i < 29) continue;
            if (avoid) avoid.add(q.q);
            return Object.assign({ kind: 'gen', gen: g, order: shuffle([0, 1, 2, 3].slice(0, q.options.length)) }, q);
        }
    }

    /* =====================================================================
       Adding a template (a new part type)
       1. Copy one of the templates above (T_.pillow is a good start) and give it a new key.
       2. letters: say what A, B, C, D are. range: the sizes they can take in stages 2 and 3.
       3. make(): random sizes. ok(p): reject sizes that would give a broken part.
       4. body(p): build the part from box(), cyl(), ext(Reg.poly/rect/circle/sector/strip/slot/hex/
          spandrel/segment), frustumY(). +1 adds material, -1 cuts it. Cuts must lie inside material,
          and added pieces must not overlap (split them where they meet).
       5. draw(p): use the F (front), T (top) and R (right) views; letters A–D in the dimensions.
       6. Run: node tools/test-exam-gen.js — it checks thousands of random parts of every template
          against an independent point-by-point measurement, and that every drawing draws.
       ===================================================================== */
    const API = { TEMPLATES, MATERIALS, GROUPS, TOPICS, GEN, Reg, ext, box, cyl, frustumY, props, count, problem, solve, within, theory, gmm3, N, fx, esc,
        setRandom(fn) { RNG = fn || Math.random; } };
    if (typeof module === 'object' && module.exports) module.exports = API;
    root.ExamGen = API;
})(typeof window !== 'undefined' ? window : globalThis);
