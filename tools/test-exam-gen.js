#!/usr/bin/env node
/* =========================================================================
   Checks the exam generator (js/exam-gen.js).

   Parts: every template is described here a second time, independently, as
   "is this point inside the part?" (plain inequalities, no shared code).
   For thousands of random parts (all 3 stages) it checks that:
     1. at every sampled point, the generator's pieces (+1 / -1) add up to
        exactly 1 inside the part and 0 outside: the pieces fit together with
        no gaps, double counting or cuts in empty space;
     2. a point-sampling measurement of the volume and centre of mass agrees
        with the exact formulas;
     3. the drawing draws (no NaN) and shows the letters A, B, C and D.
   Theory: every question generator gives 4 different, finite choices.

   Run:  node tools/test-exam-gen.js          (add --long for 10× more samples)
   ========================================================================= */
'use strict';

const path = require('path');
const G = require(path.join(__dirname, '..', 'js', 'exam-gen.js'));

// Repeatable random numbers for the test (the site uses Math.random)
let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
G.setRandom(rand);

const LONG = process.argv.includes('--long');
const PROBLEMS = LONG ? 60 : 12, SAMPLES = LONG ? 400000 : 120000;
const hyp = Math.hypot, tanD = (a) => Math.tan(a * Math.PI / 180);
const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return hyp(px - ax - t * dx, py - ay - t * dy); };
const inside = (v, a, b) => v > a && v < b;

/* ---------- The same parts, described independently ---------- */
const SHAPES = {
    lbracket: (p) => ({
        box: [[0, p.A], [0, p.C], [0, p.B]],
        in(x, y, z) {
            if (!inside(z, 0, p.B)) return false;
            const zc = p.B / 2, xh = p.A - p.e, r = hyp(x - xh, z - zc);
            const base = inside(x, 0, p.A) && inside(y, 0, p.T), up = inside(x, 0, p.T) && inside(y, 0, p.C);
            const rib = Math.abs(z - zc) < p.tr / 2 && x > p.T && y > p.T && (x - p.T) + (y - p.T) < p.D;
            const hole = (y < p.T - p.cd && r < p.Dh / 2) || (y >= p.T - p.cd && y < p.T && r < p.Dc / 2);
            return (base || up || rib) && !hole;
        }
    }),
    angleplate: (p) => ({
        box: [[0, p.A], [0, p.C], [0, p.B]],
        in(x, y, z) {
            const Dz = p.D * tanD(p.th);
            if (!(inside(x, 0, p.A) && inside(y, 0, p.C) && inside(z, 0, p.B))) return false;
            if ((x - (p.A - p.D)) * Dz + (z - p.B) * p.D > 0) return false;                    // corner cut
            if (inside(x, p.e, p.e + p.P) && inside(z, p.e, p.B - p.e) && y > p.C / 2) return false;  // pocket
            if (hyp(x - (p.A - p.e2), z - p.e2) < p.h / 2 || hyp(x - (p.A - p.e2), z - (p.B - p.e2)) < p.h / 2) return false;
            return true;
        }
    }),
    collar: (p) => ({
        box: [[-p.A / 2, p.A / 2], [-p.A / 2, p.A / 2], [0, p.C]],
        in(x, y, z) {
            const r = hyp(x, y);
            if (!inside(z, 0, p.C) || r >= p.A / 2 || r <= p.B / 2) return false;
            if (Math.abs(x) < p.D / 2 && y > 0) return false;
            if (Math.abs(x) < p.k / 2 && y < 0 && y > -(p.B / 2 + p.kd)) return false;
            return true;
        }
    }),
    gusset: (p) => ({
        box: [[0, p.A], [0, p.B], [0, p.C]],
        in(x, y, z) {
            if (!inside(z, 0, p.C)) return false;
            const c = p.T + p.R, rc = hyp(x - c, y - c);
            const base = inside(x, c, p.A) && inside(y, 0, p.T), up = inside(x, 0, p.T) && inside(y, c, p.B);
            const bend = x < c && y < c && rc > p.R && rc < c;
            const gus = Math.abs(z - p.C / 2) < p.T / 2 && x > p.T && y > p.T && x + y < p.D + p.T && !(x < c && y < c && rc > p.R);
            const holes = (y < p.T && (hyp(x - (p.A - p.e), z - p.C / 4) < p.h / 2 || hyp(x - (p.A - p.e), z - 3 * p.C / 4) < p.h / 2)) ||
                (x < p.T && hyp(y - (p.B - p.e), z - p.C / 2) < p.h / 2);
            return (base || up || bend || gus) && !holes;
        }
    }),
    stepdraft: (p) => ({
        box: [[0, p.A], [0, p.C + p.D], [0, p.B]],
        in(x, y, z) {
            const t = tanD(p.th), P = p.A - p.S - 2 * p.m, Q = p.B - 2 * p.m, xc = p.m + P / 2, zc = p.B / 2, r = p.r;
            if (hyp(x - xc, z - zc) < p.h / 2) return false;
            let block = inside(x, 0, p.A) && inside(z, 0, p.B) && inside(y, 0, x > p.A - p.S ? p.C / 2 : p.C);
            if (block) {
                for (const [cx, cz] of [[r, r], [p.A - r, r], [r, p.B - r], [p.A - r, p.B - r]]) {
                    const nearX = cx === r ? x < r : x > p.A - r, nearZ = cz === r ? z < r : z > p.B - r;
                    if (nearX && nearZ && hyp(x - cx, z - cz) > r) block = false;
                }
            }
            const s = y - p.C, boss = s > 0 && s < p.D && Math.abs(x - xc) < P / 2 - s * t && Math.abs(z - zc) < Q / 2 - s * t;
            return block || boss;
        }
    }),
    pillow: (p) => ({
        box: [[0, p.A], [0, p.C + p.D / 2 + p.w], [0, p.B]],
        in(x, y, z) {
            const Rb = p.D / 2 + p.w, z0 = (p.B - p.E) / 2, xc = p.A / 2, rb = hyp(x - xc, y - p.C);
            const base = inside(x, 0, p.A) && inside(y, 0, p.T) && inside(z, 0, p.B) && hyp(x - p.e, z - p.B / 2) >= p.h / 2 && hyp(x - (p.A - p.e), z - p.B / 2) >= p.h / 2;
            const up = inside(z, z0, z0 + p.E) && ((Math.abs(x - xc) < Rb && inside(y, p.T, p.C)) || (y >= p.C && rb < Rb)) && rb >= p.D / 2;
            return base || up;
        }
    }),
    hexspacer: (p) => ({
        box: [[-p.A / Math.sqrt(3), p.A / Math.sqrt(3)], [-p.A / 2, p.A / 2], [0, p.B + p.D]],
        in(x, y, z) {
            const r = hyp(x, y);
            if (z < p.hd ? r < p.hc / 2 : r < p.h / 2) return false;
            if (inside(z, 0, p.B)) return Math.abs(y) < p.A / 2 && Math.sqrt(3) * Math.abs(x) + Math.abs(y) < p.A;
            return inside(z, p.B, p.B + p.D) && r < p.C / 2;
        }
    }),
    channel: (p) => ({
        box: [[0, p.B], [0, p.C], [0, p.A]],
        in(x, y, z) {
            if (!inside(z, 0, p.A)) return false;
            const yh = (p.C + p.T) / 2, L = p.D - p.w;
            const web = inside(x, 0, p.B) && inside(y, 0, p.T), wl = inside(x, 0, p.T) && inside(y, 0, p.C), wr = inside(x, p.B - p.T, p.B) && inside(y, 0, p.C);
            if (!(web || wl || wr)) return false;
            if (y < p.T && [p.A / 4, 3 * p.A / 4].some((zc) => segDist(x, z, p.B / 2, zc - L / 2, p.B / 2, zc + L / 2) < p.w / 2)) return false;
            if ((x < p.T || x > p.B - p.T) && hyp(y - yh, z - p.A / 2) < p.h / 2) return false;
            return true;
        }
    }),
    clevis: (p) => ({
        box: [[0, p.A], [0, p.C + p.B / 2], [0, p.B]],
        in(x, y, z) {
            if (!(inside(x, 0, p.A) && inside(z, 0, p.B))) return false;
            const t = (p.A - p.D) / 2, rp = hyp(y - p.C, z - p.B / 2);
            const base = y > 0 && y < p.E && hyp(x - p.A / 2, z - p.B / 2) >= p.hb / 2;
            const arm = (x < t || x > p.A - t) && (inside(y, p.E, p.C) || (y >= p.C && rp < p.B / 2)) && rp >= p.h / 2;
            return base || arm;
        }
    })
};

let fails = 0, checks = 0;
const fail = (msg) => { fails++; if (fails < 25) console.error('  ✗ ' + msg); };

/* ---------- Parts ---------- */
const names = Object.keys(G.TEMPLATES);
if (names.length < 8) fail('fewer than 8 templates');
for (const k of names) {
    if (!SHAPES[k]) { fail(k + ': no independent shape in the test'); continue; }
    let worstV = 0, worstC = 0, bad = 0, parts = 0;
    for (let n = 0; n < PROBLEMS; n++) {
        const pr = G.problem(k);
        pr.stages.forEach((st, si) => {
            parts++;
            const t = G.TEMPLATES[k], body = t.body(st.p), exact = G.props(body), sh = SHAPES[k](st.p), bx = sh.box;
            if (!t.ok(st.p)) fail(k + ' stage ' + (si + 1) + ': sizes not ok');
            if (!(exact.V > 0)) fail(k + ': volume not positive');
            // Sampling (stratified on a jittered grid, so the estimate is steady)
            const vol = (bx[0][1] - bx[0][0]) * (bx[1][1] - bx[1][0]) * (bx[2][1] - bx[2][0]);
            const fill = exact.V / vol, m = Math.round(Math.cbrt(SAMPLES * Math.min(8, Math.max(1, 0.15 / fill)))); let hit = 0; const M = [0, 0, 0];   // thin parts (sheet metal) get more samples
            for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) for (let l = 0; l < m; l++) {
                const x = bx[0][0] + (i + rand()) / m * (bx[0][1] - bx[0][0]), y = bx[1][0] + (j + rand()) / m * (bx[1][1] - bx[1][0]), z = bx[2][0] + (l + rand()) / m * (bx[2][1] - bx[2][0]);
                const a = sh.in(x, y, z), c = G.count(body, x, y, z);
                if (c !== (a ? 1 : 0)) { bad++; if (bad < 4) fail(k + ': pieces give ' + c + ' at (' + [x, y, z].map((v) => v.toFixed(2)).join(', ') + ') but the part is ' + (a ? 'there' : 'not there') + ' ' + JSON.stringify(st.p)); }
                if (a) { hit++; M[0] += x; M[1] += y; M[2] += z; }
            }
            const Vs = hit / (m * m * m) * vol, cs = M.map((v) => v / hit);
            worstV = Math.max(worstV, Math.abs(Vs - exact.V) / exact.V);
            const size = Math.max(...bx.map((b) => b[1] - b[0]));
            worstC = Math.max(worstC, ...cs.map((v, i) => Math.abs(v - exact.c[i]) / size));
            // Drawing
            const svg = t.draw(st.p);
            if (/NaN|Infinity|undefined/.test(svg)) fail(k + ': drawing has NaN');
            ['A', 'B', 'C', 'D'].forEach((L) => { if (!new RegExp('>[^<]*\\b' + L + '\\b[^<]*</text>').test(svg)) fail(k + ': drawing has no dimension ' + L); });
            checks++;
        });
    }
    if (worstV > (LONG ? 0.004 : 0.008)) fail(k + ': sampled volume differs by ' + (worstV * 100).toFixed(3) + '%');
    if (worstC > (LONG ? 0.003 : 0.006)) fail(k + ': sampled centre of mass differs by ' + (worstC * 100).toFixed(3) + '% of the part size');
    console.log((bad ? '✗ ' : '✓ ') + k.padEnd(11) + parts + ' parts, pieces fit at every point' + (bad ? ' EXCEPT ' + bad : '') + '; sampled volume within ' + (worstV * 100).toFixed(3) + '%, centre within ' + (worstC * 100).toFixed(3) + '% of size');
}

/* ---------- Hand calculations (exact values worked out on paper) ---------- */
const close = (a, b, label) => { checks++; if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) fail(label + ': ' + a + ' ≠ ' + b); };
{
    // Hex spacer: hex (3√3/2·R²) × B + shoulder − counterbore − bore
    const p = { A: 30, B: 20, C: 24, D: 15, h: 8, hc: 12, hd: 5 }, R = 30 / Math.sqrt(3);
    const V = 1.5 * Math.sqrt(3) * R * R * 20 + Math.PI * 144 * 15 - Math.PI * 36 * 5 - Math.PI * 16 * 30;
    close(G.solve('hexspacer', p, { rho: 7800 }).V, V, 'hex spacer volume');
    close(G.solve('hexspacer', p, { rho: 7800 }).mass, V * 0.0078, 'hex spacer mass');
    // Plain plate as an L-bracket corner case check: a box's centre
    const b = G.props([[1, G.box(0, 0, 0, 100, 10, 50)]]);
    close(b.V, 50000, 'box volume'); close(b.c[0], 50, 'box X'); close(b.c[1], 5, 'box Y'); close(b.c[2], 25, 'box Z');
    // Half disc centroid 4r/3π
    const hd = G.Reg.sector(0, 0, 0, 10, 0, Math.PI); close(hd.Mv / hd.A, 40 / (3 * Math.PI), 'half-disc centroid');
    // Fillet spandrel: area r²(1 − π/4), centroid r(10 − 3π)/(12 − 3π) from the corner
    const sp = G.Reg.spandrel(0, 0, 6, 1, 1); close(sp.A, 36 * (1 - Math.PI / 4), 'spandrel area'); close(sp.Mu / sp.A, 6 * (10 - 3 * Math.PI) / (12 - 3 * Math.PI), 'spandrel centroid');
    // Draft frustum with no draft = box
    const f = G.frustumY(0, 0, 40, 30, 0, 10, 0); close(f.V, 12000, 'frustum (no draft) volume'); close(f.M[1] / f.V, 5, 'frustum centroid');
    // Frustum = pyramid when it closes: P = Q = 2th → V = (2th)²·h/3
    const t = 0.5, h = 20, py = G.frustumY(0, 0, 2 * t * h, 2 * t * h, 0, h, t); close(py.V, (2 * t * h) ** 2 * h / 3, 'pyramid volume'); close(py.M[1] / py.V, h / 4, 'pyramid centroid');
    // Strip of a disc with w = r: half disc
    const st = G.Reg.strip(0, 0, 10, 10, 1); close(st.A, Math.PI * 50, 'strip = half disc area'); close(st.Mv / st.A, 40 / (3 * Math.PI), 'strip centroid');
    // Marking: 1% band
    checks++; if (!G.within('101', 100) || G.within('101.1', 100) || !G.within('0.009', 0)) fail('1% marking band');
}

/* ---------- Theory generators ---------- */
for (const g of Object.keys(G.GEN)) {
    for (let i = 0; i < (LONG ? 3000 : 600); i++) {
        const q = G.GEN[g]();
        checks++;
        if (!q.topic || !q.q || !q.explain) { fail(g + ': missing text'); break; }
        if (q.options.length !== 4) { fail(g + ': ' + q.options.length + ' choices: ' + q.options.join(' | ')); break; }
        if (new Set(q.options).size !== 4) { fail(g + ': repeated choices: ' + q.options.join(' | ')); break; }
        if (q.options.concat([q.q, q.explain]).some((s) => /NaN|Infinity|undefined/.test(s))) { fail(g + ': NaN in ' + q.q); break; }
    }
}
['seg2', 'seg3', 'sheet', 'fea', 'all'].forEach((grp) => { const q = G.theory(grp); checks++; if (!q || q.kind !== 'gen' || q.order.length !== q.options.length) fail('theory(' + grp + ') broken'); });
console.log('✓ ' + Object.keys(G.GEN).length + ' theory question generators');

console.log(fails ? '\n' + fails + ' problem(s) found.' : '\nAll ' + checks + ' checks passed.');
process.exit(fails ? 1 : 0);
