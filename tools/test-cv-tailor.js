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
     9. Clients' own CVs: pasted text, Word and PDF are sorted into the right
        places, untrusted data is cleaned, and a client's letters and emails
        contain only their own facts (never Edison's).
     8. Cover letters and application emails: every fact has a real source,
        only proven skills are named, nothing fails the fact check, gaps and
        prep courses are never claimed, and "Hiring Team" is the default.

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

console.log('Cover letter & application email');
const SPECIAL = new Set(['job', 'match', 'person', 'headline', 'languages']);
const masterIds = new Set(C.itemsOf(master).map((x) => x.id));
const TONES = { formal: '', warm: 'Warm and friendly tone.', concise: 'Keep it concise.' };
for (const [name, jd] of Object.entries(JDS)) {
    for (const focus of ['auto', 'cad', 'fea', 'dfm', 'web']) {
        for (const [toneName, ins] of Object.entries(TONES)) {
            test('letter + email: ' + name + ' / ' + focus + ' / ' + toneName, () => {
                const target = { role: 'Mechanical Design Engineer', company: 'Acme Fabrication Ltd', recipient: toneName === 'warm' ? 'Jane Wanjiku' : '', jd, length: 1 };
                const a = C.analyse(jd, master, focus, target);
                const r = C.compose(master, a, { length: 1 }, {});
                const L = C.coverLetter(r.cv, a, master, target, ins);
                const E = C.applicationEmail(r.cv, a, master, target, ins);
                // Every fact points at a real source
                L.paragraphs.flat().filter((x) => x.src).forEach((x) => assert.ok(SPECIAL.has(x.src) || masterIds.has(x.src), 'unknown source ' + x.src));
                // Named skills are proven ones only
                const proven = new Set(a.terms.filter((t) => t.status === 'matched').map((t) => t.label));
                L.paragraphs.flat().filter((x) => x.src === 'match').forEach((x) => x.t.split(/, | and /).forEach((lab) => assert.ok(proven.has(lab), 'unproven skill in letter: ' + lab)));
                E.proofs.forEach((p) => p.terms.forEach((lab) => assert.ok(proven.has(lab), 'unproven skill in email: ' + lab)));
                // Nothing the fact check can't find in your data (company / recipient names are yours to type)
                const body = L.paragraphs.map((p) => p.map((x) => x.t).join('')).join('\n') + '\n' + E.body;
                const flags = C.factCheck(body, master).filter((f) => f.kind !== 'name');
                assert.deepStrictEqual(flags, [], 'fact check: ' + JSON.stringify(flags));
                // Gaps and course-only terms are never named
                a.terms.filter((t) => t.status !== 'matched' && t.group !== 'other').forEach((t) => assert.ok(!L.plain.includes(t.label) && !E.body.includes(t.label), 'claims ' + t.label));
                // Recipient, length, references
                assert.ok(L.salutation === (target.recipient ? 'Dear Jane Wanjiku,' : 'Dear Hiring Team,'));
                assert.ok(L.signoff === (target.recipient ? 'Yours sincerely,' : 'Yours faithfully,'));
                assert.ok(L.words <= 420, 'letter too long for one page: ' + L.words + ' words');
                assert.ok(E.subjects.length >= 2 && E.subjects.length <= 3 && E.subjects.every((x) => x.includes(master.person.name)));
                assert.ok(/CV and cover letter attached/.test(E.body) && E.body.includes(master.person.portfolio));
                assert.ok(E.body.startsWith(target.recipient ? 'Dear Jane Wanjiku,' : 'Dear Hiring Team,'));
                const p = C.prompt(r.cv, a, target, ins, { letter: L, email: E });
                assert.ok(p.includes('cover_letter_draft') && p.includes('email_subject_options') && /cover letter/i.test(p));
            });
        }
    }
}
test('no recipient / role / company: clean defaults', () => {
    const a = C.analyse(JDS.fea, master, 'fea', {});
    const r = C.compose(master, a, { length: 1 }, {});
    const L = C.coverLetter(r.cv, a, master, { jd: JDS.fea }, '');
    const E = C.applicationEmail(r.cv, a, master, { jd: JDS.fea }, '');
    assert.ok(L.plain.includes('Dear Hiring Team,') && L.plain.includes('the advertised position') && !/undefined|null/.test(L.plain + E.body + E.subjects.join()));
});
test('a CSWA prep course is never named in a letter (true, but easy to misread)', () => {
    const a = C.analyse(JDS.sheetmetal, master, 'cad', {});
    const r = C.compose(master, a, { length: 2 }, {});
    const L = C.coverLetter(r.cv, a, master, { jd: JDS.sheetmetal }, '');
    assert.ok(!/CSWA|Certified SOLIDWORKS Associate/i.test(L.plain));
});
test('job reference and email address from the advert', () => {
    assert.strictEqual(C.jobRef('Requirements:\n- x\nRef: MDE-2026-04'), 'MDE-2026-04');
    assert.strictEqual(C.jobRef('Job ID #45821'), '45821');
    assert.strictEqual(C.jobRef('Requirements and references'), '');
    assert.strictEqual(C.jobEmail('Send your CV to careers@acme.co.ke.'), 'careers@acme.co.ke');
    const E = C.applicationEmail({ experience: [], projects: [] }, C.analyse('Ref: AB-123', master, 'auto', {}), master, { role: 'Engineer', jd: 'Ref: AB-123' }, '');
    assert.ok(E.subjects[0].includes('Ref AB-123'));
});
test('tone comes from the prompt box', () => {
    assert.deepStrictEqual(C.tone('Warm, friendly and concise'), { warm: true, concise: true });
    assert.deepStrictEqual(C.tone('Formal. Not too short.'), { warm: false, concise: false });
});

console.log('Clients\' own CVs');
const I = require(path.join(ROOT, 'js', 'cv-import.js'));
const SAMPLE = [
    'AMINA WANJIRU KAMAU', 'Mechanical Engineering Graduate', 'Nakuru, Kenya | +254 712 345 678 | amina.kamau@example.com | linkedin.com/in/amina-kamau-eng', '',
    'PROFILE', 'Mechanical engineering graduate with hands-on experience in AutoCAD, SolidWorks and workshop fabrication.', '',
    'WORK EXPERIENCE', 'Graduate Engineer Trainee | Rift Valley Machinery Ltd | Jan 2025 – Present',
    '• Produced 2D workshop drawings in AutoCAD for maize sheller frames.', '• Supported welding and assembly of 40 sheller units per month.',
    'Industrial Attachment, Kenya Power, Nakuru', 'May 2024 - Aug 2024', '- Inspected substation equipment with senior technicians.', '',
    'PROJECTS', 'Solar Water Pump Mount (2024)', 'Final-year project: designed and tested a tilting mount for a 1 kW solar array.', '• Modelled the mount in SolidWorks and ran a static FEA study.', '',
    'EDUCATION', 'BSc Mechanical Engineering, Egerton University, 2020 – 2024', 'Second Class Honours (Upper Division)', 'KCSE, Moi Forces Academy, 2016 – 2019', '',
    'SKILLS', 'AutoCAD, SolidWorks, MS Excel', 'Welding and fabrication', '',
    'CERTIFICATIONS', 'AutoCAD Essentials – Autodesk Design Academy, 2023', 'Certified SOLIDWORKS Associate (CSWA) – Dassault Systèmes, 2024', '',
    'LANGUAGES', 'English, Kiswahili, Kikuyu', '', 'REFEREES', 'Available on request'
].join('\n');
test('pasted CV text is sorted into the right places', () => {
    const { raw, warnings } = I.fromText(SAMPLE);
    assert.deepStrictEqual(warnings, []);
    assert.strictEqual(raw.person.name, 'Amina Wanjiru Kamau');
    assert.strictEqual(raw.person.title, 'Mechanical Engineering Graduate');
    assert.strictEqual(raw.person.location, 'Nakuru, Kenya');
    assert.strictEqual(raw.person.email, 'amina.kamau@example.com');
    assert.strictEqual(raw.person.phone, '+254 712 345 678');
    assert.ok(/linkedin\.com\/in\/amina-kamau-eng$/.test(raw.person.linkedin));
    assert.deepStrictEqual(raw.experience.map((x) => [x.role, x.org, x.dates, x.points.length]), [['Graduate Engineer Trainee', 'Rift Valley Machinery Ltd', 'Jan 2025 – Present', 2], ['Industrial Attachment', 'Kenya Power, Nakuru', 'May 2024 - Aug 2024', 1]]);
    assert.strictEqual(raw.projects[0].title, 'Solar Water Pump Mount');
    assert.strictEqual(raw.projects[0].year, '2024');
    assert.deepStrictEqual(raw.education.map((e) => [e.title, e.org]), [['BSc Mechanical Engineering', 'Egerton University'], ['KCSE', 'Moi Forces Academy']]);
    assert.deepStrictEqual(raw.languages, ['English', 'Kiswahili', 'Kikuyu']);
    assert.ok(!JSON.stringify(raw).includes('Available on request'), 'referees section should be skipped');
    const kinds = C.normalizeMaster(raw).certificates.map((c) => c.kind);
    assert.deepStrictEqual(kinds, ['course', 'certification']);
});
test('a CV with no headings still loads, with a warning', () => {
    const r = I.fromText('Jane Doe\nI fix machines and draw parts in AutoCAD for local workshops.');
    assert.strictEqual(r.raw.person.name, 'Jane Doe');
    assert.ok(r.warnings.length >= 1);
});
test('cleaning: anything goes in, a valid CV comes out', () => {
    const r = C.sanitizeRaw({ person: { name: 'X'.repeat(500), linkedin: 'javascript:alert(1)', email: 'not an email', website: 'example.com/me' }, experience: [{ role: 'A', points: ['ok', 7, null, ''] }, 'junk', null], skills: 'not a list', certificates: [{ title: 'T', kind: 'hacked' }] });
    assert.strictEqual(r.person.name.length, 100);
    assert.strictEqual(r.person.linkedin, '');
    assert.strictEqual(r.person.email, '');
    assert.strictEqual(r.person.website, 'https://example.com/me');
    assert.deepStrictEqual(r.experience, [{ role: 'A', org: '', dates: '', points: ['ok', '7'] }]);
    assert.deepStrictEqual(r.skills, []);
    assert.strictEqual(r.certificates[0].kind, 'certification');
    assert.deepStrictEqual(C.sanitizeRaw(null), C.sanitizeRaw({}));
});
test('a client\'s CV goes through the same honesty rules', () => {
    const m = C.normalizeMaster(I.fromText(SAMPLE).raw);
    const jd = 'Requirements: SolidWorks, AutoCAD drawings, FEA, CSWA certification. Nice to have: ANSYS, Python.';
    const target = { role: 'Design Engineer', company: 'Acme', jd };
    const a = C.analyse(jd, m, 'cad', target);
    assert.strictEqual(a.terms.find((t) => t.id === 'cswa').status, 'matched', 'a real CSWA certification counts');
    assert.strictEqual(a.terms.find((t) => t.id === 'ansys').status, 'gap');
    const r = C.compose(m, a, { length: 1 }, {});
    assert.deepStrictEqual(C.grounded(r.cv, m), []);
    const L = C.coverLetter(r.cv, a, m, target, ''), E = C.applicationEmail(r.cv, a, m, target, '');
    const body = L.paragraphs.map((p) => p.map((x) => x.t).join('')).join('\n') + '\n' + E.body;
    assert.ok(!/Edison|KIRDI|Nexus|undefined|null/.test(body + L.plain + E.subjects.join()), 'someone else\'s details or a gap in a client\'s letter');
    assert.ok(!/^Portfolio:/m.test(E.body) && !/My portfolio is at/.test(L.plain), 'no portfolio link when the client has none');
    assert.ok(E.body.includes('LinkedIn: https://linkedin.com/in/amina-kamau-eng'));
    const own = body.split(target.role).join(' ').split(target.company).join(' ');   // the job title and company are what you typed, not claims
    assert.deepStrictEqual(C.factCheck(own, m).filter((f) => f.kind !== 'name'), []);
});
test('an empty CV doesn\'t break anything', () => {
    const m = C.normalizeMaster(C.emptyRaw());
    const a = C.analyse(JDS.sheetmetal, m, 'auto', {});
    const r = C.compose(m, a, { length: 1 }, {});
    C.coverLetter(r.cv, a, m, {}, ''); C.applicationEmail(r.cv, a, m, {}, ''); C.prompt(r.cv, a, { jd: 'x' }, '', null);
    assert.ok(C.rawStats(C.emptyRaw()).empty);
});

const asyncTests = [];
const testAsync = (name, fn) => asyncTests.push([name, fn]);
testAsync('Word (.docx): headings, bullets, tabs and text boxes are read in page order', async () => {
    const makeDocx = require('./make-test-docx.js');
    const buf = makeDocx(['> Brian Otieno Odhiambo', 'Design Engineer | Mombasa, Kenya | brian@example.com', '# Experience', 'Design Engineer\tCoast Marine Works Ltd\tMar 2023 – Present',
        '- Drafted fabrication drawings in AutoCAD & Inventor.', '* Junior Draughtsman, Bamburi Fabricators', 'Jun 2021 – Feb 2023', '- Prepared cutting lists.', '# Skills', '- AutoCAD'].join('\n'));
    const lines = I.docxLines(await I.unzipText(buf, 'word/document.xml'));
    assert.strictEqual(lines[0].text, 'Brian Otieno Odhiambo', 'the text box should be read where it sits');
    assert.ok(lines.find((l) => /Drafted/.test(l.text)).bullet);
    assert.ok(lines.find((l) => l.text === 'Experience').heading);
    const { raw } = I.parse(lines);
    assert.strictEqual(raw.person.name, 'Brian Otieno Odhiambo');
    assert.deepStrictEqual(raw.experience.map((x) => [x.role, x.org, x.dates]), [['Design Engineer', 'Coast Marine Works Ltd', 'Mar 2023 – Present'], ['Junior Draughtsman', 'Bamburi Fabricators', 'Jun 2021 – Feb 2023']]);
    assert.strictEqual(raw.experience[0].points[0], 'Drafted fabrication drawings in AutoCAD & Inventor.');
    await assert.rejects(I.unzipText(Buffer.from('not a zip at all'), 'word/document.xml'), /not-docx/);
});
testAsync('PDF text with positions becomes lines, a sidebar is read column by column', async () => {
    const it = (s, x, y) => ({ s, x, y, w: s.length * 5, h: 10, bold: false });
    const items = [];
    for (let i = 0; i < 8; i++) { items.push(it('Side ' + i, 20, 800 - i * 20)); items.push(it('Main line ' + i, 250, 800 - i * 20)); }
    const rows = I.rowsOf(items).map((r) => r.text);
    assert.deepStrictEqual(rows.slice(0, 2), ['Side 0', 'Side 1'], 'two columns should not be mixed line by line');
    assert.ok(rows.includes('Main line 0'));
    const one = I.rowsOf([it('Hello', 10, 100), it('world', 42, 100)]).map((r) => r.text);
    assert.deepStrictEqual(one, ['Hello world']);
});

(async () => {
    for (const [name, fn] of asyncTests) {
        try { await fn(); passed++; console.log('  ok  ' + name); } catch (e) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + e.message.split('\n').join('\n       ')); }
    }
    console.log('\n' + passed + ' passed, ' + failures.length + ' failed.');
    if (failures.length) process.exit(1);
})();
