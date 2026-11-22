#!/usr/bin/env node
/* =========================================================================
   Checks the CV tailor (cv-tailor/): that it can never put something on a
   CV that isn't in your master data, and never shows hidden items.

     1. js/cv-master.js is up to date with content/cv.js, the projects and
        the certificates (else: run node tools/build-pages.js).
     2. Projects / certificates marked portfolio: false never reach it, and
        neither does an email address.
     3. Every id is unique.
     4. For many job descriptions, focus areas and lengths, every line of
        the tailored CV (and of its Markdown / JSON / prompt) is a line of
        the master CV, word for word.
     5. A prep course is never counted as the certification itself.
     6. The fact check catches invented numbers, employers, tools and
        certificates, and stays quiet on your own words.
     7. Old saved choices (lines you have since edited or deleted) don't
        break anything.

   Run:  node tools/test-cv-tailor.js
   ========================================================================= */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const CVM = require('./cv-master.js');
const C = require(path.join(ROOT, 'js', 'cv-tailor-core.js'));

let passed = 0;
const failures = [];
function test(name, fn) {
    try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + e.message.split('\n').join('\n       ')); }
}

const master = CVM.buildMaster(ROOT);

console.log('Master CV');
test('js/cv-master.js matches the source files (run node tools/build-pages.js if not)', () => {
    const file = path.join(ROOT, 'js', 'cv-master.js');
    assert.ok(fs.existsSync(file), 'js/cv-master.js is missing');
    assert.strictEqual(fs.readFileSync(file, 'utf8'), CVM.masterJs(master), 'js/cv-master.js is out of date');
});
test('no email address anywhere in the master CV', () => {
    assert.ok(!/@[a-z0-9-]+\.[a-z]/i.test(JSON.stringify(master)), 'found something that looks like an email address');
});
test('every id is unique', () => {
    const ids = [master.summary.id].concat(master.experience.map((x) => x.id), master.experience.flatMap((x) => x.points.map((b) => b.id)),
        master.projects.map((p) => p.id), master.projects.flatMap((p) => p.points.map((b) => b.id)), master.skills.map((s) => s.id),
        master.education.map((e) => e.id), master.certificates.map((c) => c.id));
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepStrictEqual(dup, [], 'duplicate ids: ' + dup.join(', '));
});
test('CV blurbs linked to a project are not listed twice', () => {
    const titles = master.projects.map((p) => p.title.toLowerCase());
    assert.ok(!master.projects.some((p) => p.source === 'content/cv.js' && /battery|final-year/i.test(p.title)), 'a linked CV project appears as its own project');
    assert.strictEqual(new Set(titles).size, titles.length);
});
test('portfolio: false projects and certificates are left out', () => {
    // A copy of the data with one hidden project and one hidden certificate added
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvt-'));
    try {
        for (const f of CVM.SOURCES) {
            fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true });
            if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
        }
        fs.appendFileSync(path.join(dir, 'js/sheet-works.js'), "\nwindow.PROJECTS.push({ id: 'secret-client-job', title: 'Secret Client Job', category: 'engineering', summary: 'Private work for a client under NDA', points: ['Hidden bullet'], tags: ['ANSYS'], portfolio: false });\n");
        fs.appendFileSync(path.join(dir, 'js/sheet-data.js'), "\nwindow.CERTIFICATES.push({ title: 'Private Certificate XYZ', issuer: 'Nobody', portfolio: false });\n");
        fs.appendFileSync(path.join(dir, 'content/cv.js'), "\nwindow.CV.projects.push({ id: 'secret-client-job', name: 'Secret Client Job', text: 'Should stay hidden' });\n");
        const m = CVM.buildMaster(dir);
        const json = JSON.stringify(m);
        assert.ok(!/Secret Client Job|Hidden bullet|Private Certificate XYZ|Should stay hidden|NDA/.test(json), 'a hidden item leaked into the master CV');
        assert.strictEqual(m.hidden.projects, 1);
        assert.strictEqual(m.hidden.certificates, 1);
        const a = C.analyse('We need ANSYS and a Private Certificate XYZ.', m, 'auto');
        assert.strictEqual(a.terms.find((t) => t.id === 'ansys').status, 'gap', 'a hidden project still counted as evidence');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

console.log('Tailored CVs only use master lines');
const JDS = {
    sheetmetal: 'Mechanical Design Engineer - Sheet Metal\nResponsibilities:\n- 3D models, assemblies and 2D drawings in SolidWorks.\n- Apply DFM and GD&T (ASME Y14.5).\n- FEA of brackets; BOMs and ECNs.\nRequirements:\n- BSc Mechanical Engineering.\n- 3+ years of experience.\n- CSWA certification required.\nNice to have:\n- ANSYS, Python, PDM.',
    fea: 'Simulation Engineer (FEA/CFD)\nWe are looking for an engineer with strong Abaqus or ANSYS experience, material modelling (plasticity, damage), fatigue and thermal analysis. MATLAB is a plus. You must write clear technical reports and validate models against lab testing.',
    web: 'Engineering Automation Developer. Must know JavaScript/Node.js, Python and Git. Build internal web tools, automate CAD workflows (SolidWorks API, VBA macros) and Google Sheets reports. Nice to have: GitHub Actions, SQL.',
    graphic: 'Graphic Designer: Adobe Illustrator, Photoshop and InDesign. Print-ready posters, branding, social media. Premiere Pro is an advantage.',
    empty: '',
    weird: '!!! ??? 12345 %%% — — — \n\n\n<script>alert(1)</script> CATIA CATIA CATIA'
};
for (const [name, jd] of Object.entries(JDS)) {
    for (const focus of Object.keys(C.FOCUS)) {
        for (const length of [1, 2]) {
            test(name + ' / ' + focus + ' / ' + length + ' page', () => {
                const a = C.analyse(jd, master, focus, { company: 'Acme Ltd' });
                const r = C.compose(master, a, { length }, {});
                assert.deepStrictEqual(C.grounded(r.cv, master), []);
                // Key skills are only terms the job asked for AND you have evidence for
                r.cv.keySkills.forEach((k) => { const t = a.terms.find((x) => x.label === k); assert.ok(t && t.status === 'matched' && t.evidence.length, 'unproven key skill ' + k); });
                const data = C.payload(r.cv, a, { role: 'X', company: 'Acme Ltd', length });
                const facts = JSON.stringify(data.verified_cv);
                a.terms.filter((t) => t.status === 'gap' && t.group !== 'other').forEach((t) => assert.ok(!r.cv.keySkills.includes(t.label), 'gap in key skills: ' + t.label));
                assert.ok(!/@/.test(facts), 'email in the AI payload');
                const p = C.prompt(r.cv, a, { role: 'X', company: 'Acme Ltd', jd, length }, 'Be brief.');
                C.RULES.forEach((rule) => assert.ok(p.includes(rule), 'a hard rule is missing from the prompt'));
                const md = C.markdown(r.cv, {});
                r.cv.experience.forEach((x) => x.points.forEach((b) => assert.ok(md.includes(b.text))));
            });
        }
    }
}

console.log('Honesty rules');
test('a CSWA prep course is "partial", never "matched"', () => {
    const t = C.analyse('CSWA certification required.', master, 'cad').terms.find((x) => x.id === 'cswa');
    const hasRealCswa = master.certificates.some((c) => c.kind === 'certification' && /cswa|certified solid ?works associate/i.test(c.title));
    if (hasRealCswa) assert.strictEqual(t.status, 'matched');
    else { assert.strictEqual(t.status, 'partial'); assert.ok(/not the certification/.test(t.note)); }
});
test('certificate kinds', () => {
    assert.strictEqual(CVM.certKind({ title: 'Certified SOLIDWORKS Associate (CSWA) Cert Prep' }), 'course');
    assert.strictEqual(CVM.certKind({ title: 'CSWA Exam Preparation (SOLIDWORKS)' }), 'course');
    assert.strictEqual(CVM.certKind({ title: 'Certified SOLIDWORKS Associate (CSWA)', issuer: 'Dassault Systèmes' }), 'certification');
    assert.strictEqual(CVM.certKind({ title: 'Autodesk Designathon 2025, Honorable Mention' }), 'award');
});
test('"fluent" in a language line is not ANSYS Fluent', () => {
    assert.strictEqual(C.analyse('ANSYS experience', master, 'auto').terms.find((x) => x.id === 'ansys').status, 'gap');
});
test('requirement levels from headings and wording', () => {
    const a = C.analyse('Requirements:\n- SolidWorks\nNice to have:\n- Python\nResponsibilities:\n- AutoCAD drawings', master, 'auto');
    const lv = (id) => a.terms.find((t) => t.id === id).level;
    assert.strictEqual(lv('solidworks'), 'required');
    assert.strictEqual(lv('python'), 'preferred');
    assert.strictEqual(lv('autocad'), 'mentioned');
});

console.log('Fact check of AI text');
test('flags invented numbers, employers, tools and certification claims', () => {
    const flags = C.factCheck('Led a team of 12 engineers at Bosch, cutting costs by 30%. CSWA certified, expert in ANSYS. [exp-made-up-123]', master);
    const has = (kind, re) => flags.some((f) => f.kind === kind && re.test(f.text));
    assert.ok(has('number', /^12 engineers/), '12 engineers not flagged');
    assert.ok(has('number', /^30%/), '30% not flagged');
    assert.ok(has('name', /Bosch/), 'Bosch not flagged');
    assert.ok(has('term', /ANSYS/), 'ANSYS not flagged');
    assert.ok(has('cert', /CSWA/), 'CSWA claim not flagged');
    assert.ok(has('id', /exp-made-up-123/), 'fake source id not flagged');
});
test('your own lines pass without number / tool / id flags', () => {
    const lines = master.experience.flatMap((x) => x.points.map((b) => b.text + ' [' + b.id + ']')).concat(master.projects.flatMap((p) => p.points.map((b) => b.text)));
    const flags = C.factCheck(lines.join('\n'), master).filter((f) => f.kind !== 'name' && f.kind !== 'claim');
    assert.deepStrictEqual(flags, []);
});

console.log('Saved choices');
test('stale ids and orders from an old draft are ignored safely', () => {
    const a = C.analyse(JDS.sheetmetal, master, 'dfm');
    const r = C.compose(master, a, { length: 1 }, { include: { 'exp-gone-123': true, 'prj-deleted': true }, order: { projects: ['prj-deleted', master.projects[master.projects.length - 1].id], experience: ['nope'] } });
    assert.deepStrictEqual(C.grounded(r.cv, master), []);
    assert.strictEqual(r.order('projects')[0], master.projects[master.projects.length - 1].id);
    assert.strictEqual(r.order('projects').length, master.projects.length);
});
test('unticking and reordering are respected', () => {
    const a = C.analyse(JDS.fea, master, 'fea');
    const first = C.compose(master, a, { length: 2 }, {});
    const drop = first.cv.projects[0].id;
    const order = first.order('experience').slice().reverse();
    const r = C.compose(master, a, { length: 2 }, { include: { [drop]: false }, order: { experience: order } });
    assert.ok(!r.cv.projects.some((p) => p.id === drop));
    assert.deepStrictEqual(r.cv.experience.map((x) => x.id), order.filter((id) => r.included(id)));
});

console.log('\n' + passed + ' passed, ' + failures.length + ' failed.');
if (failures.length) process.exit(1);
