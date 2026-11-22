/* =========================================================================
   CV tailor, the logic (cv-tailor/). No page code here, so it runs in Node:
     node tools/test-cv-tailor.js

   1. analyse(jd, master, focus)   finds the tools, methods, standards and
      soft skills a job description asks for, decides for each one whether it
      is required / mentioned / preferred, and looks for real evidence of it
      in the master CV (yours from your account, or js/cv-master.js for Edison). Each term is then:
        matched  found in your experience, projects, skills or education
        partial  only found in a training course (e.g. "CSWA Cert Prep"),
                 which is not the same as holding the certification
        gap      not found anywhere: the tailor never claims it
   2. rank + compose               scores every bullet, project, skill and
      certificate against the job and builds the tailored CV from the
      master's exact words. compose() can only pick and order master lines,
      never write new ones, so nothing can be invented here.
   3. prompt / markdown / json     the hand-off for an outside AI assistant,
      with strict rules and source ids so you can check every line.
   4. factCheck(text, master)      paste text back from an AI assistant: it
      lists numbers, tools and certifications that are not in your data.

   Adding a keyword: add a line to TERMS: [id, label, group, pattern].
   The pattern is a regular expression (case doesn't matter) matched as a
   whole word; use | for alternatives. Add the id to a FOCUS list if it
   should count extra for that focus area.
   ========================================================================= */
(function (root) {
    'use strict';

    const GROUPS = {
        cad: 'CAD tools & modelling',
        cae: 'Simulation & analysis',
        mfg: 'Manufacturing & DFM',
        std: 'Standards, drawings & quality',
        cert: 'Certifications',
        domain: 'Domain & product',
        web: 'Software, web & automation',
        graphic: 'Graphic design',
        soft: 'Soft skills & leadership',
        lang: 'Languages',
        other: 'Other keywords'
    };

    /* [id, label, group, pattern] */
    const TERMS = [
        // CAD
        ['solidworks', 'SolidWorks', 'cad', 'solid ?works|sw cad'],
        ['inventor', 'Autodesk Inventor', 'cad', '(?:autodesk )?inventor(?: professional)?'],
        ['fusion', 'Fusion 360', 'cad', 'fusion ?360|autodesk fusion'],
        ['autocad', 'AutoCAD', 'cad', 'autocad|auto cad'],
        ['revit', 'Revit', 'cad', 'revit'],
        ['catia', 'CATIA', 'cad', 'catia'],
        ['creo', 'Creo / Pro/E', 'cad', 'creo|pro/?engineer|ptc creo'],
        ['nx', 'Siemens NX', 'cad', 'siemens nx|unigraphics|nx cad'],
        ['solidedge', 'Solid Edge', 'cad', 'solid ?edge'],
        ['onshape', 'Onshape', 'cad', 'onshape'],
        ['rhino', 'Rhino', 'cad', 'rhino(?:ceros)?'],
        ['sketchup', 'SketchUp', 'cad', 'sketch ?up'],
        ['modelling', '3D modelling', 'cad', '3d (?:cad )?model(?:l)?(?:ing|s)?|3d cad|solid model(?:l)?ing|parametric(?: model(?:l)?ing)?|cad model(?:l)?ing|cad design|cad software'],
        ['assembly', 'Assemblies', 'cad', 'assembl(?:y|ies)(?! line)|mates|top-down design'],
        ['drawings', '2D technical drawings', 'std', 'technical drawings?|engineering drawings?|2d drawings?|detail(?:ed)? drawings?|manufacturing drawings?|working drawings?|drafting|draughting|shop drawings?'],
        ['surfacing', 'Surface modelling', 'cad', 'surface model(?:l)?ing|surfacing|class.a'],
        ['sheetmetal', 'Sheet metal', 'mfg', 'sheet[- ]metal'],
        ['weldments', 'Weldments / frames', 'mfg', 'weldments?|structural frames?|steel frames?'],
        ['bom', 'Bill of materials (BOM)', 'std', 'bill of materials?|boms?'],
        ['rendering', 'Rendering & visualisation', 'cad', 'render(?:ing|s)?|keyshot|visuali[sz]ation|photorealistic'],
        ['pdm', 'PDM / PLM', 'std', 'pdm|plm|vault|windchill|teamcenter|product data management|product lifecycle'],
        // Simulation & analysis
        ['fea', 'FEA', 'cae', 'fea|fem|finite[- ]element(?: analysis| method)?|fe simulation|fe analysis|coupled fe'],
        ['cfd', 'CFD', 'cae', 'cfd|computational fluid(?: dynamics)?|flow simulation'],
        ['structural', 'Structural analysis', 'cae', 'structural (?:analysis|simulation|integrity|validation|design)|stress analysis|static analysis|load(?:ing)? analysis'],
        ['thermal', 'Thermal analysis', 'cae', 'thermal (?:analysis|simulation|management|design)|heat transfer|cooling (?:system|pack|design)'],
        ['simulation', 'Engineering simulation', 'cae', 'simulations?|cae|virtual testing'],
        ['abaqus', 'Abaqus', 'cae', 'abaqus'],
        ['ansys', 'ANSYS', 'cae', 'ansys|ansys fluent|mechanical apdl'],
        ['swsim', 'SolidWorks Simulation', 'cae', 'solid ?works simulation|simulation ?xpress'],
        ['comsol', 'COMSOL', 'cae', 'comsol'],
        ['nastran', 'Nastran / Femap', 'cae', 'nastran|femap|hypermesh|optistruct'],
        ['fatigue', 'Fatigue & durability', 'cae', 'fatigue|durability|life prediction'],
        ['modal', 'Vibration / modal analysis', 'cae', 'modal analysis|vibrations?|frequency analysis|nvh'],
        ['topology', 'Topology optimisation', 'cae', 'topology optimi[sz]ation|generative design|lightweighting'],
        ['failure', 'Failure & damage prediction', 'cae', 'failure (?:analysis|prediction|criteria)|damage mechanics|fracture|forming limit|gtn'],
        ['materials', 'Materials & material models', 'cae', 'materials? (?:science|selection|model(?:l)?ing|models?|testing|characteri[sz]ation)|constitutive|plasticity|anisotrop(?:y|ic)|hill.?48|alsi10mg'],
        ['matlab', 'MATLAB / Simulink', 'cae', 'matlab|simulink'],
        ['calc', 'Engineering calculations', 'cae', 'engineering calculations?|hand calculations?|design calculations?|sizing'],
        // Manufacturing
        ['dfm', 'DFM / DFA', 'mfg', 'dfm|dfa|dfma|design for (?:manufactur(?:e|ing|ability)|assembly)|manufacturability'],
        ['machining', 'Machining (lathe / milling / CNC)', 'mfg', 'machining|machine shop|cnc|milling|lathes?|turning|machinist'],
        ['laser', 'Laser cutting', 'mfg', 'laser[- ]cut(?:ting|ter)?|cnc laser|plasma cutting'],
        ['fabrication', 'Fabrication', 'mfg', 'fabricat(?:e|ed|ion|ing)|metalwork|workshop'],
        ['welding', 'Welding', 'mfg', 'weld(?:ing|er|s)?|mig|tig'],
        ['prototyping', 'Prototyping', 'mfg', 'prototyp(?:e|es|ing)|proof of concept|mock-?ups?'],
        ['testing', 'Testing & validation', 'mfg', '(?:lab(?:oratory)? )?test(?:ing|s)?|validat(?:e|ed|ion|ing)|verification|tensile|nakajima|experiments?'],
        ['additive', '3D printing / additive', 'mfg', '3d print(?:ing|ed)?|additive(?:ly)? manufactur(?:e|ed|ing)|fdm|sla|slm'],
        ['tolerances', 'Tolerances & fits', 'std', 'toleranc(?:e|es|ing)|fits and tolerances|tolerance stack(?:-?up)?'],
        ['gdt', 'GD&T', 'std', 'gd ?& ?t|gd and t|geometric dimensioning(?: and tolerancing)?'],
        ['asme', 'ASME Y14.5', 'std', 'asme(?: y14\\.?5)?|y14\\.5'],
        ['iso', 'ISO standards', 'std', 'iso ?\\d{3,5}(?:[-:]\\d+)?|iso standards?'],
        ['fmea', 'FMEA', 'std', 'd?p?fmea|failure modes?(?: and effects?)?(?: analysis)?'],
        ['rca', 'Root cause analysis', 'std', 'root cause(?: analysis)?|rca|8d|5 whys'],
        ['quality', 'Quality control & inspection', 'std', 'quality (?:control|assurance|inspection|management)|qa/qc|qc|inspection|metrology|cmm'],
        ['lean', 'Lean / Six Sigma', 'std', 'lean(?: manufacturing)?|six sigma|kaizen|continuous improvement'],
        ['moulding', 'Injection moulding / casting', 'mfg', 'injection mou?ld(?:ing|ed)?|casting|die cast(?:ing)?|plastic parts'],
        ['forming', 'Metal forming & stamping', 'mfg', '(?:sheet |metal )?forming|stamping|press brake|bending|deep drawing'],
        ['manufacturing', 'Manufacturing processes', 'mfg', 'manufacturing(?: processes| engineering)?|production(?: processes)?'],
        ['ecn', 'Engineering change (ECO / ECN)', 'std', 'eco|ecn|ecr|engineering change(?: orders?| notices?| requests?)?'],
        // Certifications
        ['cswa', 'CSWA certification', 'cert', 'cswa|certified solid ?works associate'],
        ['cswp', 'CSWP certification', 'cert', 'cswp|certified solid ?works professional'],
        ['cswe', 'CSWE certification', 'cert', 'cswe|certified solid ?works expert'],
        ['autodeskcert', 'Autodesk certification', 'cert', 'autodesk certified(?: professional| user)?|acp'],
        ['pe', 'PE / registered engineer', 'cert', 'p\\.?e\\.? licen[cs]e|professional engineer|registered engineer|ebk|eit|graduate engineer registration'],
        // Domain
        ['mechdesign', 'Mechanical design', 'domain', 'mechanical design|machine design|mechanical engineering design|design engineer(?:ing)?'],
        ['product', 'Product design & development', 'domain', 'product (?:design|development)|new product introduction|npi|concept(?:ual)? design|concept to'],
        ['renewable', 'Renewable / sustainable design', 'domain', 'solar|renewable|sustainab(?:le|ility)|green energy|clean energy'],
        ['ev', 'EV / battery systems', 'domain', 'electric vehicles?|evs?|batter(?:y|ies)|battery pack'],
        ['hvac', 'HVAC', 'domain', 'hvac|heating,? ventilation'],
        ['humanitarian', 'Water / humanitarian design', 'domain', 'humanitarian|water (?:filtration|treatment|supply)|hygiene|sanitation|wash'],
        ['automotive', 'Automotive', 'domain', 'automotive|vehicle'],
        ['agri', 'Agricultural / food machinery', 'domain', 'agricultur(?:e|al)|agri-?|food processing|poultry'],
        ['building', 'Buildings / BIM', 'domain', 'bim|building information|architectur(?:e|al)'],
        ['research', 'Research', 'domain', 'research(?:er)?|r&d|research and development|literature review'],
        // Software / web / automation
        ['javascript', 'JavaScript', 'web', 'javascript|js|typescript|es6'],
        ['node', 'Node.js', 'web', 'node(?:\\.?js)?'],
        ['html', 'HTML & CSS', 'web', 'html5?|css3?'],
        ['python', 'Python', 'web', 'python'],
        ['git', 'Git / GitHub', 'web', 'git|github|gitlab|version control'],
        ['ci', 'CI / GitHub Actions', 'web', 'ci/cd|github actions|continuous integration|ci pipelines?'],
        ['appsscript', 'Google Apps Script / Sheets', 'web', 'apps script|google sheets?|google workspace'],
        ['automation', 'Automation & scripting', 'web', 'automat(?:e|ed|ion|ing)|scripting|macros?|vba|api(?: programming)?'],
        ['webdev', 'Web development', 'web', 'web (?:development|developer|design|apps?)|websites?|front-?end'],
        ['sql', 'SQL / databases', 'web', 'sql|databases?|postgres|mysql'],
        ['excel', 'Excel / spreadsheets', 'web', 'excel|spreadsheets?'],
        ['data', 'Data analysis', 'web', 'data analy(?:sis|tics)|data processing|dashboards?'],
        ['cprog', 'C / C++ / embedded', 'web', 'c\\+\\+|embedded|arduino|microcontrollers?|plc'],
        // Graphic design
        ['illustrator', 'Adobe Illustrator', 'graphic', '(?:adobe )?illustrator'],
        ['photoshop', 'Adobe Photoshop', 'graphic', '(?:adobe )?photoshop'],
        ['indesign', 'Adobe InDesign', 'graphic', '(?:adobe )?in ?design(?! review| thinking| for)'],
        ['premiere', 'Premiere Pro / After Effects', 'graphic', 'premiere(?: pro)?|after effects|video editing'],
        ['graphicdesign', 'Graphic design', 'graphic', 'graphic design(?:er)?|visual design|layout design|branding|brand identity'],
        ['print', 'Print design', 'graphic', 'print(?:-ready| design| production)?|posters?|flyers?|brochures?'],
        // Soft skills
        ['leadership', 'Leadership', 'soft', 'lead(?:ership|er|ing|s)?|led|head(?:ed)?|captain'],
        ['communication', 'Communication', 'soft', 'communicat(?:e|ion|ions|ing)|presentations?|present(?:ing)? to'],
        ['teamwork', 'Teamwork & collaboration', 'soft', 'team(?:s|work| player)?|collaborat(?:e|ion|ive|ing)|cross-functional|multidisciplinary'],
        ['training', 'Training & mentoring', 'soft', 'train(?:ing|ed|er|s)?|mentor(?:ing|ed)?|coach(?:ing)?|teach(?:ing)?|tutor(?:ing)?|facilitat(?:e|ion|ing|or)|upskill(?:ed|ing)?|workshops?'],
        ['pm', 'Project management & planning', 'soft', 'project management|project manager|manage projects|planning|schedul(?:e|ing)|deadlines?|timelines?|organi[sz](?:e|ing|ation|ational)'],
        ['problem', 'Problem solving', 'soft', 'problem[- ]solv(?:ing|er)|troubleshoot(?:ing)?|analytical'],
        ['client', 'Client & stakeholder work', 'soft', 'clients?|customers?|stakeholders?|customer-facing|technical support'],
        ['entrepreneur', 'Entrepreneurship', 'soft', 'founder|founded|entrepreneur(?:ship|ial)?|start-?up|own business|business development'],
        ['documentation', 'Technical documentation & reports', 'soft', 'documentation|document(?:ing|ed)?|technical (?:reports?|writing)|reports?|specifications?'],
        ['detail', 'Attention to detail', 'soft', 'attention to detail|detail-oriented|precise|precision|accura(?:te|cy)'],
        ['initiative', 'Initiative & self-motivation', 'soft', 'self-?motivated|self-?starter|initiative|proactive|independent(?:ly)?|eager'],
        ['events', 'Events & exhibitions', 'soft', 'events?|exhibitions?|summit|conference'],
        // Languages
        ['english', 'English', 'lang', 'english'],
        ['french', 'French', 'lang', 'french|fran[cç]ais'],
        ['swahili', 'Kiswahili', 'lang', 'kiswahili|swahili']
    ];

    const FOCUS = {
        auto: { label: 'Let the job decide', terms: [] },
        cad: { label: 'Mechanical CAD & design', terms: ['solidworks', 'inventor', 'fusion', 'autocad', 'modelling', 'assembly', 'drawings', 'bom', 'mechdesign', 'product', 'gdt', 'tolerances', 'rendering', 'prototyping', 'surfacing', 'pdm'] },
        fea: { label: 'FEA / Simulation', terms: ['fea', 'cfd', 'structural', 'thermal', 'simulation', 'abaqus', 'ansys', 'swsim', 'failure', 'materials', 'matlab', 'testing', 'fatigue', 'modal', 'calc', 'research'] },
        dfm: { label: 'Sheet metal / DFM', terms: ['sheetmetal', 'dfm', 'laser', 'fabrication', 'machining', 'welding', 'forming', 'tolerances', 'manufacturing', 'prototyping', 'drawings', 'weldments', 'quality', 'testing'] },
        web: { label: 'Engineering + web / automation', terms: ['javascript', 'node', 'html', 'python', 'git', 'ci', 'appsscript', 'automation', 'webdev', 'excel', 'data', 'modelling', 'drawings', 'training'] },
        graphic: { label: 'Graphic design', terms: ['illustrator', 'photoshop', 'indesign', 'premiere', 'graphicdesign', 'print', 'rendering', 'client'] }
    };

    const LIMITS = {
        1: { bullets: 3, weakBullets: 1, projects: 2, projectBullets: 1, skills: 4, certs: 3, keySkills: 10 },
        2: { bullets: 5, weakBullets: 2, projects: 4, projectBullets: 3, skills: 99, certs: 5, keySkills: 14 }
    };

    /* Starting points for the prompt box (your own text is saved in the browser) */
    const PRESETS = {
        balanced: { label: 'Balanced (default)', text: 'Tone: confident, plain and specific. No buzzwords, no "passionate", no first person in bullets.\nLength: fit one A4 page.\nEmphasis: lead with the experience and projects that match the job\'s required skills; keep the exact tool names the job uses where my data has them.\nSummary: 2–3 sentences aimed at this role and company.' },
        concise: { label: 'Concise 1-page', text: 'Length: strictly one A4 page. At most 3 bullets per role and 3 projects with 2 bullets each.\nEach bullet under 22 words, starting with a strong verb.\nDrop anything that does not support this job.\nSummary: 2 sentences.' },
        detailed: { label: 'Detailed 2-page', text: 'Length: up to two A4 pages.\nKeep all relevant roles with 3–5 bullets each and up to 6 projects.\nInclude a short "Selected projects" section with what I did, the tools I used and the result, exactly as in my data.\nSummary: 3–4 sentences.' },
        technical: { label: 'Technical (FEA / simulation)', text: 'Audience: an engineering hiring manager.\nEmphasis: simulation method, software, boundary conditions, materials and validation, only where my data mentions them.\nKeep technical terms exactly as written (material names, standards, test and simulation methods).\nLength: one page if possible.' },
        ats: { label: 'Recruiter / ATS friendly', text: 'Audience: a recruiter and an applicant tracking system.\nUse the job description\'s own words for skills I really have (same spelling), in the summary and skills line.\nSimple formatting: no tables, no columns, standard headings (Profile, Experience, Projects, Education, Skills, Certifications).\nLength: one page.' }
    };

    /* ---------------- text helpers ---------------- */
    const norm = (s) => String(s == null ? '' : s).replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
    const COMPILED = TERMS.map(([id, label, group, src]) => ({ id, label, group, re: new RegExp('(?:^|[^a-z0-9+#&])(?:' + src + ')(?=$|[^a-z0-9+#&])', 'i'), reG: new RegExp('(?:^|[^a-z0-9+#&])(?:' + src + ')(?=$|[^a-z0-9+#&])', 'gi') }));
    const TERM = Object.fromEntries(COMPILED.map((t) => [t.id, t]));
    const has = (t, text) => t.re.test(' ' + norm(text).toLowerCase() + ' ');

    const STOP = new Set(('a about above across after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself ' +
        'create creating run running prepare preparing build develop developing maintain perform assist review deliver handle carry out ltd limited inc plc llc group plus able ability abilities apply applicant applicants candidate candidates role roles job jobs position positions company companies team teams work working works year years experience experienced experiences skill skills strong excellent good great knowledge understanding including include includes etc must required requirements require requires preferred plus bonus nice ideal ideally minimum least new within across ensure ensuring provide providing support supporting using use used based level levels high highly well per day days time join us we\'re you\'ll you\'re our opportunity opportunities responsibilities responsibility qualifications qualification duties key relevant related various other others like similar demonstrated proven familiarity familiar proficiency proficient hands-on hands degree bachelor bachelors bsc masters equivalent field environment environments office full part salary benefits location remote hybrid onsite apply application deadline closing date send cv resume email kenya nairobi please looking seeking want wanted help make making get take').split(/\s+/));
    const stem = (w) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(sses)$/, 'ss').replace(/([^s])s$/, '$1').replace(/(ing|ed)$/, '');
    const words = (text) => (norm(text).toLowerCase().match(/[a-z][a-z0-9+#.\-']*[a-z0-9+#]|[a-z]/g) || []);

    /* ---------------- the master CV: one shape for everyone ----------------
       A "raw" CV is what a person edits (or what tools/cv-master.js reads from the website):
         { person: { name, title, tagline, location, phone, email, linkedin, website, portfolio },
           summary, experience: [{ role, org, dates, points: [] }],
           projects: [{ title, subtitle, year, category, summary, points: [], tags: [], url }],
           education: [{ title, org, dates, note }], skills: [], languages: [], memberships: [],
           certificates: [{ title, issuer, kind: 'certification' | 'course' | 'award', verify }] }
       normalizeMaster() cleans it (types, lengths, counts) and gives every line a stable id made
       from its own text, so choices can be remembered and an AI assistant can cite its sources. */
    const LIM = { text: 1200, short: 200, list: 40, points: 25 };
    const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || LIM.short);
    const arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n || LIM.list);
    const strs = (v, n, len) => arr(v, n).map((x) => str(x, len || LIM.text)).filter(Boolean);
    const okUrl = (u) => { const s = str(u, 300); return /^https?:\/\/[^\s<>"]+$/i.test(s) ? s : /^(www\.|linkedin\.com|[a-z0-9-]+\.[a-z]{2,}\/)/i.test(s) ? 'https://' + s : ''; };
    const okEmail = (e) => { const s = str(e, 120); return /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(s) ? s : ''; };
    function slug(s, n) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, n || 24).replace(/-$/, '') || 'item'; }
    function hash(s) { let h = 0x811c9dc5; const t = String(s); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6); }
    function latestYear(d) {
        if (/present|current|now|to date|ongoing/i.test(d || '')) return new Date().getFullYear();
        const ys = String(d || '').match(/\b(19|20)\d{2}\b/g);
        return ys ? Math.max(...ys.map(Number)) : null;
    }
    // What a certificate really is, so a prep course is never presented as the certification itself
    function certKind(c) {
        const t = (String(c.title || '') + ' ' + String(c.issuer || '')).toLowerCase();
        if (/designathon|award|honou?rable|mention|winner|finalist|participant|prize|scholarship|dean'?s list/.test(t)) return 'award';
        if (/\bprep\b|preparation|essential training|\btraining\b|\bcourse\b|bootcamp|tutorial|masterclass|workshop|\bessentials\b|fundamentals|introduction to|\bbasics\b/.test(t)) return 'course';
        return 'certification';
    }
    const KINDS = ['certification', 'course', 'award'];
    function emptyRaw() {
        return { person: { name: '', title: '', tagline: '', location: '', phone: '', email: '', linkedin: '', website: '', portfolio: '' }, summary: '',
            experience: [], projects: [], education: [], skills: [], certificates: [], languages: [], memberships: [] };
    }
    // Cleans anything (a file, an old save, a typo) into a valid raw CV
    function sanitizeRaw(raw) {
        const r = raw && typeof raw === 'object' ? raw : {}, p = r.person && typeof r.person === 'object' ? r.person : {};
        return {
            person: { name: str(p.name, 100), title: str(p.title, 160), tagline: str(p.tagline, 200), location: str(p.location, 120), phone: str(p.phone, 40),
                email: okEmail(p.email), linkedin: okUrl(p.linkedin), website: okUrl(p.website), portfolio: okUrl(p.portfolio) },
            summary: str(r.summary, 2000),
            experience: arr(r.experience).map((x) => ({ role: str(x && x.role), org: str(x && x.org), dates: str(x && x.dates, 80), points: strs(x && x.points, LIM.points) })).filter((x) => x.role || x.org || x.points.length),
            projects: arr(r.projects).map((x) => ({ title: str(x && x.title), subtitle: str(x && x.subtitle), year: str(x && x.year, 40), category: x && x.category === 'graphic' ? 'graphic' : 'engineering',
                summary: str(x && x.summary, 1500), points: strs(x && x.points, LIM.points), tags: strs(x && x.tags, 20, 60), url: okUrl(x && x.url), source: str(x && x.source, 120) })).filter((x) => x.title || x.summary || x.points.length),
            education: arr(r.education).map((x) => ({ title: str(x && x.title), org: str(x && x.org), dates: str(x && x.dates, 80), note: str(x && x.note, 600) })).filter((x) => x.title || x.org),
            skills: strs(r.skills, 60, 400),
            certificates: arr(r.certificates).map((x) => {
                const c = { title: str(x && x.title), issuer: str(x && x.issuer, 120), verify: okUrl(x && x.verify) };
                c.kind = KINDS.includes(x && x.kind) ? x.kind : certKind(c);
                return c;
            }).filter((c) => c.title),
            languages: strs(r.languages, 20, 120),
            memberships: strs(r.memberships, 20, 300)
        };
    }
    function normalizeMaster(raw, meta) {
        const r = sanitizeRaw(raw), m = meta || {};
        const lines = (list, prefix) => list.map((text) => ({ id: prefix + '-' + hash(text), text }));
        const p = r.person;
        const master = {
            about: m.about || 'Your CV, as saved in your account. Every tailored CV, letter and email is built only from these lines.',
            person: { name: p.name, title: p.title, tagline: p.tagline, location: p.location, phone: p.phone, email: p.email, linkedin: p.linkedin, website: p.website, portfolio: p.portfolio || p.website },
            summary: { id: 'summary-' + hash(r.summary), text: r.summary },
            experience: r.experience.map((x) => {
                const abbr = (x.org.match(/\(([A-Z][A-Za-z0-9 .]{1,12})\)/) || [])[1];   // "(KIRDI)" → kirdi
                const id = 'exp-' + slug(abbr || x.org.split(/[,(]/)[0] || 'role', 18) + '-' + slug(x.role, 14);
                return { id, role: x.role, org: x.org, dates: x.dates, year: latestYear(x.dates), points: lines(x.points, id) };
            }),
            projects: r.projects.map((x) => {
                const id = 'prj-' + slug(x.source && !/\.js$/.test(x.source) ? x.source : x.title, 30);
                return { id, source: x.source || '', title: x.title, subtitle: x.subtitle, category: x.category, year: x.year, summary: x.summary, outcome: '',
                    points: lines(x.points, id), tags: x.tags, deliverables: [], url: x.url };
            }),
            skills: lines(r.skills, 'skill'),
            education: r.education.map((x) => ({ id: 'edu-' + slug(x.title || x.org, 20), title: x.title, org: x.org, dates: x.dates, note: x.note })),
            certificates: r.certificates.map((c) => ({ id: 'cert-' + slug(c.title, 22) + '-' + hash(c.title), title: c.title, issuer: c.issuer, kind: c.kind, verify: c.verify })),
            languages: r.languages,
            memberships: r.memberships,
            hidden: m.hidden || { projects: 0, certificates: 0 }
        };
        // Outcomes (one-line results) from the website's projects
        arr(raw && raw.projects).forEach((x, i) => { if (master.projects[i] && x && x.outcome) master.projects[i].outcome = str(x.outcome, 300); });
        // Ids must be unique, or a choice would apply to two lines at once
        const seen = new Set();
        [master.summary].concat(master.experience, master.experience.flatMap((x) => x.points), master.projects, master.projects.flatMap((q) => q.points), master.skills, master.education, master.certificates).forEach((it) => {
            let id = it.id, k = 2;
            while (seen.has(id)) id = it.id + '-' + k++;
            it.id = id;
            seen.add(id);
        });
        return master;
    }
    // How full a CV is, for the "My CV" card
    function rawStats(raw) {
        const r = sanitizeRaw(raw);
        return { roles: r.experience.length, bullets: r.experience.reduce((a, x) => a + x.points.length, 0) + r.projects.reduce((a, x) => a + x.points.length, 0),
            projects: r.projects.length, skills: r.skills.length, education: r.education.length, certificates: r.certificates.length,
            empty: !r.person.name && !r.summary && !r.experience.length && !r.projects.length };
    }

    /* ---------------- master → searchable items ---------------- */
    function itemsOf(master) {
        const out = [];
        const add = (id, kind, label, text, extra) => out.push(Object.assign({ id, kind, label, text: norm(text) }, extra || {}));
        add('headline', 'headline', 'Your CV title', master.person.title + '. ' + master.person.tagline);
        add(master.summary.id, 'summary', 'Profile summary', master.summary.text);
        master.experience.forEach((x) => {
            add(x.id, 'role', x.role + ' · ' + x.org, x.role + ' ' + x.org + ' (' + x.dates + ')');
            x.points.forEach((b) => add(b.id, 'bullet', x.org.split(',')[0] + ': ' + b.text.slice(0, 60) + (b.text.length > 60 ? '…' : ''), b.text, { parent: x.id }));
        });
        master.projects.forEach((p) => {
            add(p.id, 'project', 'Project: ' + p.title, [p.title, p.subtitle, p.summary, p.outcome].concat(p.tags, p.deliverables).join('. '), { category: p.category });
            p.points.forEach((b) => add(b.id, 'pbullet', p.title + ': ' + b.text.slice(0, 50) + (b.text.length > 50 ? '…' : ''), b.text, { parent: p.id, category: p.category }));
        });
        master.skills.forEach((s) => add(s.id, 'skill', 'Skill: ' + s.text.split(':')[0], s.text));
        master.education.forEach((e) => add(e.id, 'education', e.title + ', ' + e.org, [e.title, e.org, e.dates, e.note].join('. ')));
        master.certificates.forEach((c) => add(c.id, 'cert', (c.kind === 'course' ? 'Course: ' : c.kind === 'award' ? 'Award: ' : 'Certificate: ') + c.title, c.title + ' ' + c.issuer, { certKind: c.kind }));
        (master.languages || []).forEach((l, i) => add('lang-' + i, 'language', 'Language: ' + l, l));
        (master.memberships || []).forEach((m, i) => add('member-' + i, 'membership', 'Membership: ' + m.split('(')[0].trim(), m));
        return out;
    }

    /* ---------------- 1. job description analysis ---------------- */
    const REQ_HEAD = /^(?:requirements?|qualifications?|must[- ]haves?|what (?:you|we) (?:need|require|bring|are looking for)|who you are|minimum|essential|required|skills (?:and|&) (?:experience|qualifications)|your profile|about you)\b/i;
    const PREF_HEAD = /^(?:nice[- ]to[- ]haves?|preferred|desirable|bonus|plus|good to have|it would be great|advantageous|added advantage)\b/i;
    const DUTY_HEAD = /^(?:responsibilities|duties|what you(?:'| wi)ll do|the role|key (?:responsibilities|tasks)|your (?:role|tasks|mission)|job description|day to day)\b/i;
    const REQ_CUE = /\b(?:must|required|requirement|essential|mandatory|minimum|at least|need to|needs to|you have|you will have|proven|strong (?:knowledge|experience)|proficien)/i;
    const PREF_CUE = /\b(?:prefer(?:red|ably)?|desirable|nice to have|a plus|an advantage|added advantage|bonus|ideally|familiarity with|exposure to|would be)\b/i;

    function analyse(jd, master, focus, target) {
        const own = new Set(words(((target && target.company) || '') + ' ' + ((target && target.role) || '')).map(stem));
        const text = norm(String(jd || '').replace(/\r/g, '')).length ? String(jd).replace(/\r/g, '') : '';
        const items = itemsOf(master);
        const focusSet = new Set((FOCUS[focus] || FOCUS.auto).terms);
        // Split into lines, then sentences, remembering which section each one sits in
        let ctx = 'mentioned';
        const sentences = [];
        text.split(/\n+/).forEach((raw) => {
            const line = raw.replace(/^[\s•*\-–·\d.)]+/, '').trim();
            if (!line) return;
            const headish = line.length < 70 && /:$|^[A-Z][A-Za-z '&/-]+$/.test(line.replace(/\s+$/, ''));
            if (REQ_HEAD.test(line) && (headish || line.length < 40)) { ctx = 'required'; return; }
            if (PREF_HEAD.test(line) && (headish || line.length < 40)) { ctx = 'preferred'; return; }
            if (DUTY_HEAD.test(line) && (headish || line.length < 40)) { ctx = 'mentioned'; return; }
            line.split(/(?<=[.;!?])\s+(?=[A-Z(])/).forEach((s) => {
                const level = PREF_CUE.test(s) ? 'preferred' : REQ_CUE.test(s) ? 'required' : ctx;
                sentences.push({ s, level });
            });
        });
        const RANK = { required: 3, mentioned: 2, preferred: 1 };
        const terms = [];
        const covered = new Set();   // words that belong to a known term, so "other keywords" doesn't repeat them
        COMPILED.forEach((t) => {
            let count = 0, level = null;
            const quotes = [];
            sentences.forEach(({ s, level: lv }) => {
                const hits = (' ' + norm(s) + ' ').match(t.reG);
                if (!hits) return;
                count += hits.length;
                hits.forEach((h) => words(h).forEach((w) => covered.add(stem(w))));
                if (!level || RANK[lv] > RANK[level]) level = lv;
                if (quotes.length < 2) quotes.push(s.length > 160 ? s.slice(0, 157) + '…' : s);
            });
            if (!count) return;
            const evidence = items.filter((it) => has(t, it.text));
            const solid = evidence.filter((it) => !(it.kind === 'cert' && it.certKind === 'course'));
            const status = solid.length ? 'matched' : evidence.length ? 'partial' : 'gap';
            const note = status === 'partial' ? 'Only found in a training course (' + evidence.map((e) => e.label.replace(/^Course: /, '')).join('; ') + '). That is not the certification itself: don\'t claim it.' : '';
            terms.push({ id: t.id, label: t.label, group: t.group, level, count, status, note, quotes, focus: focusSet.has(t.id), evidence: evidence.map((e) => ({ id: e.id, label: e.label, kind: e.kind })) });
        });

        // Other frequent words the taxonomy doesn't know (e.g. a company's own product names)
        const corpus = new Set(items.flatMap((it) => words(it.text).map(stem)));
        const freq = new Map();
        sentences.forEach(({ s, level }) => words(s).forEach((w) => {
            const k = stem(w);
            if (w.length < 3 || STOP.has(w) || STOP.has(k) || covered.has(k) || own.has(k) || /^\d/.test(w)) return;
            const f = freq.get(k) || { word: w, n: 0, level };
            f.n++;
            if (RANK[level] > RANK[f.level]) f.level = level;
            freq.set(k, f);
        }));
        const other = [...freq.entries()].filter(([, f]) => f.n >= 2 || /[A-Z]/.test((text.match(new RegExp('\\b' + f.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')) || [''])[0].charAt(0)))
            .sort((a, b) => b[1].n - a[1].n || a[1].word.localeCompare(b[1].word)).slice(0, 14)
            .map(([k, f]) => ({ id: 'kw-' + k, label: f.word, group: 'other', level: f.level, count: f.n, status: corpus.has(k) ? 'matched' : 'gap', note: '', quotes: [], focus: false, stem: k,
                evidence: corpus.has(k) ? items.filter((it) => words(it.text).some((w) => stem(w) === k)).map((e) => ({ id: e.id, label: e.label, kind: e.kind })) : [] }));

        // Things to check by hand: years of experience, degree, licences
        const checks = [];
        const yrs = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)(?:'|’)?\s*(?:of\s+)?(?:[a-z-]+\s+){0,3}experience/i);
        if (yrs) checks.push('Asks for ' + yrs[0].replace(/\s+/g, ' ') + '. Compare with your real dates; don\'t stretch them.');
        if (/\b(?:master'?s|msc|m\.sc|meng|mba|phd|doctorate)\b/i.test(text) && !master.education.some((e) => /\b(?:master|msc|m\.sc|meng|mba|phd|doctor)/i.test(e.title)))
            checks.push('Mentions a postgraduate degree (MSc / PhD). Your CV doesn\'t list one: don\'t imply it.');
        if (/\b(?:driving licen[cs]e|driver'?s licen[cs]e)\b/i.test(text)) checks.push('Mentions a driving licence: not in your data, answer honestly if asked.');
        if (/\b(?:security clearance|citizenship|work permit|visa)\b/i.test(text)) checks.push('Mentions clearance / work authorisation: not in your CV data.');

        const scored = terms.concat(other);
        const counted = scored.filter((t) => t.group !== 'other');
        const weightOf = (t) => ({ required: 3, mentioned: 2, preferred: 1 }[t.level] || 1) * (t.group === 'soft' || t.group === 'lang' ? 0.6 : 1) * (t.focus ? 1.5 : 1);
        const total = counted.reduce((s, t) => s + weightOf(t), 0);
        const got = counted.reduce((s, t) => s + (t.status === 'matched' ? weightOf(t) : t.status === 'partial' ? weightOf(t) * 0.25 : 0), 0);
        return {
            terms: scored, checks, focus: FOCUS[focus] ? focus : 'auto', sentences: sentences.length,
            coverage: total ? Math.round(100 * got / total) : 0,
            counts: {
                matched: scored.filter((t) => t.status === 'matched').length,
                partial: scored.filter((t) => t.status === 'partial').length,
                gap: scored.filter((t) => t.status === 'gap').length,
                required: counted.filter((t) => t.level === 'required').length,
                requiredGaps: counted.filter((t) => t.level === 'required' && t.status !== 'matched').length
            }
        };
    }

    /* ---------------- 2. ranking ---------------- */
    function rank(master, analysis) {
        const focusSet = new Set((FOCUS[analysis.focus] || FOCUS.auto).terms);
        const now = new Date().getFullYear();
        const W = { required: 3, mentioned: 2, preferred: 1.5 };
        const live = analysis.terms.filter((t) => t.status !== 'gap');
        const score = {};
        const why = {};
        itemsOf(master).forEach((it) => {
            let s = 0;
            const hits = [];
            live.forEach((t) => {
                const hit = t.group === 'other' ? words(it.text).some((w) => stem(w) === t.stem) : has(TERM[t.id], it.text);
                if (!hit) return;
                const w = (t.group === 'other' ? 0.5 : W[t.level] || 1) * (t.group === 'soft' || t.group === 'lang' ? 0.6 : 1) * (1 + 0.15 * Math.min(t.count - 1, 3)) * (focusSet.has(t.id) ? 1.5 : 1);
                s += w;
                hits.push(t.label);
            });
            focusSet.forEach((id) => { if (!live.some((t) => t.id === id) && has(TERM[id], it.text)) s += 0.4; });
            score[it.id] = Math.round(s * 10) / 10;
            why[it.id] = hits;
        });
        master.experience.forEach((x) => { if (x.year && now - x.year <= 1) score[x.id] = (score[x.id] || 0) + 0.3; });
        master.projects.forEach((p) => { const y = parseInt(p.year, 10); if (y && now - y <= 1) score[p.id] = (score[p.id] || 0) + 0.3; });
        // A role is as relevant as its best lines
        master.experience.forEach((x) => { score[x.id] = Math.round(((score[x.id] || 0) + x.points.reduce((s, b) => s + (score[b.id] || 0), 0) * 0.5) * 10) / 10; });
        master.projects.forEach((p) => { score[p.id] = Math.round(((score[p.id] || 0) + p.points.reduce((s, b) => s + (score[b.id] || 0), 0) * 0.3) * 10) / 10; });
        return { score, why };
    }

    // Two lines saying the same thing (e.g. a project bullet that repeats a job bullet): keep one
    const bag = (t) => new Set(words(t).map(stem).filter((w) => w.length > 2 && !STOP.has(w)));
    function similar(a, b) {
        const A = bag(a), B = bag(b);
        if (!A.size || !B.size) return false;
        let n = 0;
        A.forEach((w) => { if (B.has(w)) n++; });
        return n / Math.min(A.size, B.size) >= 0.7;
    }

    const byScore = (score, list) => list.map((x, i) => [x, i]).sort((a, b) => (score[b[0].id] || 0) - (score[a[0].id] || 0) || a[1] - b[1]).map((a) => a[0]);

    /* What is ticked and in which order before you change anything: the job decides */
    function defaults(master, analysis, ranking, length) {
        const L = LIMITS[length] || LIMITS[1];
        const sc = ranking.score;
        const on = new Set([master.summary.id, 'key-skills']);
        const order = {};
        order.experience = master.experience.map((x) => x.id);   // newest first, as written in the CV
        const top = Math.max(0.1, ...master.experience.map((x) => sc[x.id] || 0));
        const chosen = [];
        master.experience.forEach((x) => {
            if (length === 2 || sc[x.id] > 0 || !x.points.length && master.experience.length < 4) on.add(x.id);   // 1 page: a role with nothing in common with the job starts unticked
            const sorted = byScore(sc, x.points);
            order[x.id] = sorted.map((b) => b.id);
            const cap = (sc[x.id] || 0) >= top * 0.25 ? L.bullets : length === 1 && !(sc[x.id] > 0) ? 0 : L.weakBullets;   // weakly related roles keep fewer lines
            const good = sorted.filter((b) => sc[b.id] > 0).slice(0, cap);
            (good.length ? good : sorted.slice(0, Math.min(cap, length === 2 ? 2 : 1))).forEach((b) => { on.add(b.id); chosen.push(b.text); });
        });
        const graphicJob = analysis.focus === 'graphic' || analysis.terms.filter((t) => t.group === 'graphic').length > analysis.terms.filter((t) => ['cad', 'cae', 'mfg'].includes(t.group)).length;
        const projects = byScore(sc, master.projects);
        order.projects = projects.map((p) => p.id);
        const picked = projects.filter((p) => sc[p.id] > 0.3).slice(0, L.projects);
        projects.filter((p) => !picked.includes(p) && (graphicJob || p.category === 'engineering')).slice(0, Math.max(0, L.projects - picked.length)).forEach((p) => picked.push(p));
        picked.forEach((p) => on.add(p.id));
        master.projects.forEach((p) => {
            const sorted = byScore(sc, p.points);
            order[p.id] = sorted.map((b) => b.id);
            sorted.filter((b) => !chosen.some((t) => similar(t, b.text))).slice(0, L.projectBullets).forEach((b) => on.add(b.id));
        });
        const skills = byScore(sc, master.skills);
        order.skills = skills.map((s) => s.id);
        skills.slice(0, L.skills).forEach((s) => on.add(s.id));
        const KIND = { certification: 2, award: 1, course: 0 };
        const cs = (c) => (sc[c.id] || 0) + KIND[c.kind] * 2;   // a real certificate or award beats a prep course of similar relevance
        const certs = master.certificates.map((c, i) => [c, i]).sort((a, b) => cs(b[0]) - cs(a[0]) || a[1] - b[1]).map((a) => a[0]);
        order.certificates = certs.map((c) => c.id);
        certs.slice(0, L.certs).forEach((c) => on.add(c.id));
        master.education.forEach((e, i) => { if (length === 2 || i === 0) on.add(e.id); });   // 1 page: highest qualification only
        order.education = master.education.map((e) => e.id);
        on.add('languages');
        if (length === 2) on.add('memberships');
        return { on, order };
    }

    // Saved order first (dropping lines that no longer exist), then any new lines in their default place
    function mergeOrder(saved, fallback) {
        const keep = (saved || []).filter((id) => fallback.includes(id));
        return keep.concat(fallback.filter((id) => !keep.includes(id)));
    }

    /* ---------------- composing the tailored CV (master lines only) ---------------- */
    function compose(master, analysis, opts, state) {
        const length = opts && opts.length === 2 ? 2 : 1;
        const ranking = rank(master, analysis);
        const def = defaults(master, analysis, ranking, length);
        const st = state || {};
        const inc = (id) => (st.include && Object.prototype.hasOwnProperty.call(st.include, id) ? !!st.include[id] : def.on.has(id));
        const ord = (key) => mergeOrder(st.order && st.order[key], def.order[key] || []);
        const pick = (list, key) => { const map = new Map(list.map((x) => [x.id, x])); return ord(key).map((id) => map.get(id)).filter(Boolean); };
        const L = LIMITS[length];
        const keySkills = analysis.terms.filter((t) => t.status === 'matched' && t.group !== 'other' && t.group !== 'soft' && t.group !== 'lang')
            .sort((a, b) => ({ required: 3, mentioned: 2, preferred: 1 }[b.level] - { required: 3, mentioned: 2, preferred: 1 }[a.level]) || b.count - a.count)
            .slice(0, L.keySkills).map((t) => t.label);
        const cv = {
            person: Object.assign({}, master.person),
            summary: inc(master.summary.id) ? master.summary : null,
            keySkills: inc('key-skills') ? keySkills : [],
            experience: pick(master.experience, 'experience').filter((x) => inc(x.id)).map((x) => Object.assign({}, x, { points: pick(x.points, x.id).filter((b) => inc(b.id)) })),
            projects: pick(master.projects, 'projects').filter((p) => inc(p.id)).map((p) => Object.assign({}, p, { points: pick(p.points, p.id).filter((b) => inc(b.id)) })),
            skills: pick(master.skills, 'skills').filter((s) => inc(s.id)),
            education: pick(master.education, 'education').filter((e) => inc(e.id)),
            certificates: pick(master.certificates, 'certificates').filter((c) => inc(c.id)),
            languages: inc('languages') ? master.languages.slice() : [],
            memberships: inc('memberships') ? master.memberships.slice() : []
        };
        return { cv, ranking, defaults: def, included: inc, order: ord, length };
    }

    /* Lines that can go when the CV is too long, least relevant first (never the profile, roles or degree) */
    function trimOrder(result) {
        const sc = result.ranking.score, cv = result.cv, out = [];
        const add = (id, extra) => out.push({ id, s: (sc[id] || 0) + extra });
        cv.experience.forEach((x) => x.points.forEach((b, i) => { if (x.points.length > 1 || !(sc[x.id] > 0)) add(b.id, i === 0 ? 0.5 : 0); }));
        cv.projects.forEach((p) => p.points.forEach((b) => add(b.id, -0.5)));
        if (cv.projects.length > 1) cv.projects.forEach((p) => add(p.id, 3));
        cv.skills.forEach((s, i) => { if (i > 1) add(s.id, 0.2); });
        cv.certificates.forEach((c, i) => { if (i > 0) add(c.id, 0.2); });
        cv.education.forEach((e, i) => { if (i > 0) add(e.id, -1); });
        if (cv.memberships.length) add('memberships', -2);
        return out.sort((a, b) => a.s - b.s).map((x) => x.id);
    }

    /* Every line of a composed CV must be a line of the master, word for word (used by the tests) */
    function grounded(cv, master) {
        const problems = [];
        const texts = new Set();
        const items = itemsOf(master);
        items.forEach((it) => texts.add(it.text));
        const known = new Map();
        [master.summary].concat(master.experience.flatMap((x) => x.points), master.projects.flatMap((p) => p.points), master.skills).forEach((x) => known.set(x.id, x.text));
        const check = (x) => { if (!known.has(x.id) || known.get(x.id) !== x.text) problems.push('Not in the master CV: ' + x.id); };
        if (cv.summary) check(cv.summary);
        cv.experience.forEach((x) => { if (!master.experience.some((m) => m.id === x.id && m.role === x.role && m.org === x.org && m.dates === x.dates)) problems.push('Unknown role ' + x.id); x.points.forEach(check); });
        cv.projects.forEach((p) => { if (!master.projects.some((m) => m.id === p.id && m.title === p.title)) problems.push('Unknown project ' + p.id); p.points.forEach(check); });
        cv.skills.forEach(check);
        cv.certificates.forEach((c) => { if (!master.certificates.some((m) => m.id === c.id && m.title === c.title && m.issuer === c.issuer)) problems.push('Unknown certificate ' + c.id); });
        cv.education.forEach((e) => { if (!master.education.some((m) => m.id === e.id && m.title === e.title)) problems.push('Unknown education ' + e.id); });
        return problems;
    }

    /* ---------------- 3. hand-off: markdown, JSON, prompt ---------------- */
    function markdown(cv, target) {
        const p = cv.person;
        const out = ['# ' + p.name, '**' + p.title + '**  ', [p.location, p.phone, p.linkedin, p.website].filter(Boolean).join(' · '), ''];
        if (target && (target.role || target.company)) out.push('_Tailored for: ' + [target.role, target.company].filter(Boolean).join(' at ') + '_', '');
        if (cv.summary) out.push('## Profile', cv.summary.text, '');
        if (cv.keySkills.length) out.push('**Relevant skills:** ' + cv.keySkills.join(' · '), '');
        if (cv.experience.length) {
            out.push('## Experience');
            cv.experience.forEach((x) => { out.push('### ' + x.role + ' | ' + x.org + ' | ' + x.dates); x.points.forEach((b) => out.push('- ' + b.text)); out.push(''); });
        }
        if (cv.projects.length) {
            out.push('## Selected projects');
            cv.projects.forEach((pr) => { out.push('### ' + pr.title + (pr.year ? ' (' + pr.year + ')' : ''), pr.summary); pr.points.forEach((b) => out.push('- ' + b.text)); if (pr.tags.length) out.push('_Tools: ' + pr.tags.join(', ') + '_'); out.push(''); });
        }
        if (cv.education.length) { out.push('## Education'); cv.education.forEach((e) => out.push('- **' + e.title + '**, ' + e.org + ' (' + e.dates + ')' + (e.note ? ' ' + e.note : ''))); out.push(''); }
        if (cv.skills.length) { out.push('## Skills'); cv.skills.forEach((s) => out.push('- ' + s.text)); out.push(''); }
        if (cv.certificates.length) { out.push('## Certifications & training'); cv.certificates.forEach((c) => out.push('- ' + c.title + ' (' + c.issuer + ')' + (c.verify ? ' ' + c.verify : ''))); out.push(''); }
        if (cv.languages.length) out.push('## Languages', cv.languages.join(' · '), '');
        if (cv.memberships.length) { out.push('## Memberships'); cv.memberships.forEach((m) => out.push('- ' + m)); out.push(''); }
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    /* ---------------- 3b. cover letter & application email ----------------
       Built like the CV: every fact (role, organisation, dates, project, bullet, skill, certificate)
       is copied from the master data and carries its source id; the words around them are fixed
       phrases that claim nothing. Only "matched" terms (real evidence) are ever named.
       Your prompt box sets the tone: words like "warm" / "friendly" / "enthusiastic" give a warmer
       letter, "concise" / "short" / "brief" a shorter one; otherwise it is formal. */
    function tone(instructions) {
        const s = String(instructions || '').toLowerCase();
        return { warm: /\b(warm|friendly|enthusias|personable|conversational)/.test(s), concise: /\b(concise|short|brief|tight|succinct)\b/.test(s) && !/\bnot (?:too )?(?:concise|short|brief)\b/.test(s) };
    }
    const recipientOf = (target) => String((target && target.recipient) || '').trim() || 'Hiring Team';
    const roleOf = (target) => String((target && target.role) || '').trim();
    const companyOf = (target) => String((target && target.company) || '').trim();
    const firstSentence = (t) => { const m = String(t || '').match(/^.+?[.!?](?=\s+[A-Z(]|$)/); return (m ? m[0] : String(t || '')).trim(); };
    const VERB = /^(?:[A-Z][a-z]+ed|Built|Led|Ran|Made|Won|Taught|Drew|Wrote|Set|Grew|Kept|Held|Gave|Took|Ran|Brought|Sold|Ran)\b/;
    const LOWER_START = /^(?:A|An|The|This|These|Design|Designed|Forming|Built|Created|Modelled|Modeled|Simulated)\b/;
    const lc1 = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const dropStop = (t) => t.replace(/[.\s]+$/, '');
    const dates = (d) => String(d || '').replace(/\s*\(([^)]*)\)/g, ', $1');            // "Jun – Aug 2025 (12 weeks)" → "Jun – Aug 2025, 12 weeks"
    const abbrOf = (org) => (String(org).match(/\(([A-Z][A-Za-z0-9 .]{1,12})\)/) || [])[1] || '';
    const shortOrg = (org) => abbrOf(org) || String(org).split(',')[0];
    const theOrg = (org) => (/^(university|kenya|institute|department|ministry|council|association)\b/i.test(org) ? 'the ' : '') + org;
    // Terms proven by real work (a role, a bullet, a project or a skill), not only by your own headline or summary
    const proven = (t) => t.status === 'matched' && !['other', 'soft', 'lang'].includes(t.group) && t.evidence.some((e) => !['headline', 'summary', 'language', 'membership'].includes(e.kind));
    // A project that is the same work as a role (e.g. "Sheet Metal Fabrication at KIRDI" and the KIRDI attachment)
    function sameWork(master, a, b) {
        const x = master.experience.find((e) => e.id === a || e.id === b), p = master.projects.find((q) => q.id === a || q.id === b);
        if (!x || !p) return false;
        const k = abbrOf(x.org) || x.org.split(',')[0];
        return new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(p.title + ' ' + p.subtitle + ' ' + p.summary);
    }
    function listJoin(a) { return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
    function jobRef(jd) {
        for (const m of String(jd || '').matchAll(/\b(?:ref(?:erence)?|job (?:id|code|ref)|req(?:uisition)?(?: id)?|vacancy (?:no|number|ref))\b\.?\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{2,24})\b/gi)) if (/\d/.test(m[1])) return m[1];
        return '';
    }
    function jobEmail(jd) { const m = String(jd || '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/); return m ? m[0] : ''; }

    // The strongest proof for the job: places (a role or a project) and the matched terms each one proves
    function proofs(cv, analysis, master, n) {
        const items = itemsOf(master);
        const unitOf = (it) => it.kind === 'bullet' || it.kind === 'pbullet' ? it.parent : it.kind === 'role' || it.kind === 'project' ? it.id : null;
        const picked = new Set(cv.experience.map((x) => x.id).concat(cv.projects.map((p) => p.id)));
        const L = { required: 3, mentioned: 2, preferred: 1 };
        const terms = analysis.terms.filter(proven);
        const units = new Map();
        terms.forEach((t) => t.evidence.forEach((e) => {
            const it = items.find((x) => x.id === e.id);
            const u = it && unitOf(it);
            if (!u) return;
            if (!units.has(u)) units.set(u, new Map());
            units.get(u).set(t.id, t);
        }));
        const out = [], used = new Set();
        for (let k = 0; k < n; k++) {
            let best = null, bestScore = 0;
            units.forEach((ts, u) => {
                if (out.some((o) => o.unit === u || sameWork(master, o.unit, u))) return;
                const fresh = [...ts.values()].filter((t) => !used.has(t.id));
                const s = fresh.reduce((a, t) => a + L[t.level] * (t.focus ? 1.5 : 1), 0) * (picked.has(u) ? 1.5 : 1);
                if (s > bestScore) { bestScore = s; best = { unit: u, terms: fresh.sort((a, b) => L[b.level] - L[a.level] || b.count - a.count).slice(0, 3) }; }
            });
            if (!best) break;
            best.terms.forEach((t) => used.add(t.id));
            const x = master.experience.find((e) => e.id === best.unit), p = master.projects.find((q) => q.id === best.unit);
            best.label = x ? x.role + ', ' + shortOrg(x.org) + ' (' + dates(x.dates) + ')' : p.title + (p.year ? ' (' + p.year + ')' : '');
            out.push(best);
        }
        return out;
    }

    function coverLetter(cv, analysis, master, target, instructions) {
        const T = tone(instructions), ranking = rank(master, analysis), sc = ranking.score;
        const role = roleOf(target), company = companyOf(target), who = recipientOf(target);
        const P = [];   // paragraphs: arrays of parts { t, src? }
        const f = (t, src) => ({ t, src }), s = (t) => ({ t });
        const matched = analysis.terms.filter(proven);
        const L = { required: 3, mentioned: 2, preferred: 1 };
        const top = matched.slice().sort((a, b) => L[b.level] - L[a.level] || b.count - a.count);
        // 1. Why I'm writing
        const pos = role ? [s('the '), f(role, 'job'), s(' position')] : [s('the advertised position')];
        const at = company ? [s(' at '), f(company, 'job')] : [];
        const p1 = T.warm ? [s('I was pleased to see your advert for ')].concat(pos, at, [s(', and I would like to apply.')]) : [s('I am writing to apply for ')].concat(pos, at, [s('.')]);
        const edu = cv.education[0] || master.education[0];
        const eduParts = edu && !T.concise && edu.title ? [s('studied '), f(edu.title, edu.id)].concat(edu.org ? [s(' at '), f(theOrg(edu.org), edu.id)] : [], edu.dates ? [s(' ('), f(edu.dates, edu.id), s(')')] : []) : [];
        if (master.person.title) { p1.push(s(' I am '), s(/^[aeiou]/i.test(master.person.title) ? 'an ' : 'a '), f(master.person.title, 'headline')); if (eduParts.length) p1.push(s(' and ')); }
        else if (eduParts.length) p1.push(s(' I '));
        if (master.person.title || eduParts.length) { p1.push(...eduParts); p1.push(s('.')); }
        if (top.length >= 2) p1.push(s(' The role\'s focus on '), f(listJoin(top.slice(0, 2).map((t) => t.label)), 'match'), s(' matches the work described below and in my attached CV.'));
        P.push(p1);
        // 2. The most relevant role, in its own words
        const roles = cv.experience.filter((x) => x.points.length).sort((a, b) => (sc[b.id] || 0) - (sc[a.id] || 0));
        if (roles.length) {
            const x = roles[0];
            const stint = /attachment|internship|placement|apprentice|volunteer/i.test(x.role);
            const p2 = (stint ? [s('During my '), f(x.role, x.id)] : [s(T.warm ? 'I have most recently been working as ' : 'In my role as '), f(x.role, x.id)])
                .concat([s(' at '), f(theOrg(x.org), x.id), s(' ('), f(dates(x.dates), x.id), s(')'), s(T.warm && !stint ? ', where ' : ', ')]);
            x.points.slice(0, T.concise ? 1 : 2).forEach((b, i) => {
                if (i) p2.push(s(i === 1 ? ' I also ' : ' '));
                const txt = dropStop(b.text);
                if (VERB.test(txt)) p2.push(...(i ? [] : [s('I ')]), f(i ? lc1(txt) : lc1(txt), b.id), s('.'));
                else p2.push(...(i ? [s('worked on the following: ')] : [s('my work included the following: ')]), f(txt, b.id), s('.'));
            });
            P.push(p2);
        }
        // 3. Two or three matched projects
        const want = T.concise ? 2 : 3, usedRole = roles.length ? roles[0].id : '';
        const notDup = (p) => !usedRole || !sameWork(master, usedRole, p.id);
        // Your ticked projects first (in your order), then other real projects that match this job
        let projects = cv.projects.filter(notDup);
        if (projects.length < 2) projects = projects.concat(master.projects.filter((p) => !projects.some((q) => q.id === p.id) && notDup(p) && (sc[p.id] || 0) > 1).sort((a, b) => sc[b.id] - sc[a.id]));
        projects = projects.slice(0, want);
        if (projects.length) {
            const p3 = [s(projects.length > 1 ? (T.warm ? 'A few projects I am proud of are especially relevant here.' : 'Several of my projects are directly relevant to this role.') : 'One project is directly relevant to this role.')];
            projects.forEach((pr) => {
                const sum = dropStop(firstSentence(pr.summary));
                p3.push(s(' '), f(pr.title, pr.id));
                if (pr.subtitle) p3.push(s(' ('), f(pr.subtitle.replace(/\s*·\s*/g, ', '), pr.id), s(')'));
                p3.push(s(': '), f(LOWER_START.test(sum) ? lc1(sum) : sum, pr.id), s('.'));
            });
            P.push(p3);
        }
        // 4. Skills with proof, and certificates / awards exactly as they are
        const p4 = [];
        const named = top.slice(0, T.concise ? 5 : 7).map((t) => t.label);
        if (named.length) p4.push(s('My attached CV shows experience with '), f(listJoin(named), 'match'), s('.'));
        const certs = cv.certificates.filter((c) => c.kind !== 'course').slice(0, 2);
        // A prep course whose title names a certification (e.g. "CSWA Cert Prep") is left out of letters: true, but easy to misread
        const course = cv.certificates.find((c) => c.kind === 'course' && !COMPILED.some((t) => t.group === 'cert' && has(t, c.title)));
        certs.forEach((c, i) => {
            p4.push(s(i ? ' I also ' : (p4.length ? ' ' : '') + 'I '), s(c.kind === 'award' ? 'received the ' : 'hold the '), f(c.title, c.id), s(' ('), f(c.issuer, c.id), s(').'));
        });
        if (course && !T.concise) p4.push(s((p4.length ? ' ' : '') + 'I have completed the '), f(course.title, course.id), s(' course ('), f(course.issuer, course.id), s(').'));
        const langs = analysis.terms.filter((t) => t.group === 'lang' && t.status === 'matched').map((t) => master.languages.find((l) => has(TERM[t.id], l))).filter(Boolean);
        if (langs.length) p4.push(s((p4.length ? ' ' : '') + 'I speak '), f(listJoin(langs), 'languages'), s('.'));
        if (p4.length) P.push(p4);
        // 5. Close
        P.push([s(T.warm ? 'I would love the chance to talk about how I could contribute to ' : 'I would welcome the opportunity to discuss how my experience could contribute to ')].concat(company ? [f(company, 'job')] : [s('your team')],
            (master.person.portfolio || master.person.website ? [s('. My portfolio is at '), f(master.person.portfolio || master.person.website, 'person')] : []), [s('. Thank you for your time and consideration.')]));
        const salutation = 'Dear ' + who + ',';
        const signoff = who === 'Hiring Team' || /^(hiring|recruit|sir|madam|team)/i.test(who) ? 'Yours faithfully,' : 'Yours sincerely,';
        const plainP = P.map((parts) => parts.map((x) => x.t).join('').replace(/\s+([.,])/g, '$1'));
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const head = [master.person.name, master.person.location, master.person.phone, master.person.email, master.person.linkedin].filter(Boolean).join('\n');
        const to = [who === 'Hiring Team' ? 'Hiring Team' : who, company].filter(Boolean).join('\n');
        const plain = [head, '', date, '', to, ''].concat(role ? ['Re: Application for ' + role, ''] : [], [salutation, '', plainP.join('\n\n'), '', signoff, master.person.name]).join('\n');
        return { paragraphs: P, salutation, signoff, date, recipient: who, company, role, plain, words: plain.split(/\s+/).filter(Boolean).length, tone: T };
    }

    function applicationEmail(cv, analysis, master, target, instructions) {
        const T = tone(instructions);
        const role = roleOf(target), company = companyOf(target), who = recipientOf(target), name = master.person.name;
        const ref = jobRef(target && target.jd);
        const proof = proofs(cv, analysis, master, 3).filter((p) => p.terms.length);
        const L = { required: 3, mentioned: 2, preferred: 1 };
        const tops = analysis.terms.filter(proven).sort((a, b) => L[b.level] - L[a.level] || b.count - a.count).slice(0, 2).map((t) => t.label);
        const r = role || master.person.title || 'the advertised position';
        const subjects = [];
        const add = (x) => { if (x && !subjects.includes(x)) subjects.push(x); };
        const by = name ? ' – ' + name : '';
        add('Application: ' + r + (ref ? ' (Ref ' + ref + ')' : '') + by);
        add(company ? 'Application for ' + r + ' at ' + company + by : r + ' application' + by + (master.person.title && role ? ', ' + master.person.title : ''));
        if (tops.length) add((name ? name + ' – ' : '') + r + ' (' + tops.join(', ') + ')');
        const position = (role ? 'the ' + role + ' position' : 'the advertised position') + (company ? ' at ' + company : '') + (ref ? ' (Ref ' + ref + ')' : '');
        const lines = [
            'Dear ' + who + ',',
            '',
            (T.warm ? 'I would love to be considered for ' : 'I am applying for ') + position + '. Please find my CV and cover letter attached.',
            ''
        ];
        if (proof.length) {
            lines.push(proof.length > 1 ? 'Why I am a good fit:' : 'Why I am a good fit:');
            proof.forEach((p) => lines.push('• ' + listJoin(p.terms.map((t) => t.label)) + ': ' + p.label));
            lines.push('');
        }
        const links = [];
        if (master.person.portfolio || master.person.website) links.push('Portfolio: ' + (master.person.portfolio || master.person.website));
        if (master.person.linkedin) links.push('LinkedIn: ' + master.person.linkedin);
        if (links.length) lines.push(...links, '');
        lines.push(T.warm ? 'Thank you for considering my application. I would be glad to talk at any time.' : 'Thank you for your time and consideration. I look forward to hearing from you.', '', 'Kind regards,', name || '');
        if (master.person.phone) lines.push(master.person.phone);
        return { subjects, body: lines.join('\n'), to: jobEmail(target && target.jd), proofs: proof.map((p) => ({ source: p.unit, label: p.label, terms: p.terms.map((t) => t.label) })), ref };
    }

    function payload(cv, analysis, target, extras) {
        const t = (list) => list.map((x) => ({ term: x.label, level: x.level, evidence: x.evidence.map((e) => e.id) }));
        return {
            target: { role: target.role || '', company: target.company || '', focus: (FOCUS[analysis.focus] || FOCUS.auto).label, length: target.length === 2 ? '2 pages' : '1 page' },
            match: {
                coverage_percent: analysis.coverage,
                matched: t(analysis.terms.filter((x) => x.status === 'matched')),
                course_only_do_not_claim: analysis.terms.filter((x) => x.status === 'partial').map((x) => ({ term: x.label, note: x.note })),
                gaps_do_not_claim: analysis.terms.filter((x) => x.status === 'gap').map((x) => ({ term: x.label, level: x.level })),
                check_by_hand: analysis.checks
            },
            verified_cv: {
                person: { name: cv.person.name, title: cv.person.title, location: cv.person.location, linkedin: cv.person.linkedin, website: cv.person.website },
                summary: cv.summary ? { id: cv.summary.id, text: cv.summary.text } : null,
                relevant_skills_with_evidence: cv.keySkills,
                experience: cv.experience.map((x) => ({ id: x.id, role: x.role, organisation: x.org, dates: x.dates, bullets: x.points.map((b) => ({ id: b.id, text: b.text })) })),
                projects: cv.projects.map((p) => ({ id: p.id, title: p.title, context: p.subtitle, year: p.year, summary: p.summary, bullets: p.points.map((b) => ({ id: b.id, text: b.text })), tools: p.tags, link: p.url })),
                education: cv.education.map((e) => ({ id: e.id, title: e.title, institution: e.org, dates: e.dates, note: e.note })),
                skills: cv.skills.map((s) => ({ id: s.id, text: s.text })),
                certificates_and_training: cv.certificates.map((c) => ({ id: c.id, title: c.title, issuer: c.issuer, kind: c.kind, link: c.verify })),
                languages: cv.languages,
                memberships: cv.memberships
            },
            ...(extras ? { application_drafts: {
                recipient: recipientOf(target), company: companyOf(target), role: roleOf(target),
                cover_letter_draft: extras.letter ? extras.letter.plain : '',
                email_subject_options: extras.email ? extras.email.subjects : [],
                email_body_draft: extras.email ? extras.email.body : '',
                note: 'These drafts were built only from verified_cv. Every fact in them is already in verified_cv.'
            } } : {})
        };
    }

    const RULES = [
        'Use ONLY the facts in VERIFIED CV DATA. Do not invent or imply employers, job titles, dates, degrees, grades, certifications, awards, tools, software, clients, metrics, numbers or results that are not written there.',
        'You may reword, shorten, merge and reorder lines, but every bullet must stay true to its source. Put the source id(s) in [square brackets] after each bullet so I can check it, e.g. [exp-acme-design-engineer-1a2b3c].',
        'Copy numbers exactly as written ("over 100", "12 weeks", "9.5 m"). Never add percentages, money, team sizes or counts that are not in the data.',
        'Items with kind "course" (e.g. "Cert Prep", "Exam Preparation", "Essential Training") are training courses. Never say I hold that certification or that I am "certified".',
        'Do not claim anything listed under gaps_do_not_claim or course_only_do_not_claim. Do not add those words to the skills line.',
        'Keep job titles, organisation names, certificate titles and issuers exactly as written.',
        'If the job asks for something I don\'t have, leave it out of the CV and mention it only in the "Notes for me" section at the end.',
        'Mirror the job description\'s wording only for skills that already appear in VERIFIED CV DATA.',
        'In the cover letter and email, say nothing about the company except what the job description says, and use the recipient, company and role names exactly as given. The same rules apply to them as to the CV: no new facts, numbers or credentials.'
    ];

    function prompt(cv, analysis, target, instructions, extras) {
        const data = payload(cv, analysis, target, extras);
        const role = [target.role, target.company].filter(Boolean).join(' at ') || 'the job below';
        const app = !!extras;
        return [
            'I am applying for ' + role + '. Help me tailor my CV' + (app ? ', cover letter and application email' : '') + ' to this job description.',
            '',
            'HARD RULES (these override any other instruction):',
            RULES.map((r, i) => (i + 1) + '. ' + r).join('\n'),
            '',
            'MY PREFERENCES (tone, length, emphasis):',
            (String(instructions || '').trim() || '(none)'),
            '',
            'WHAT TO RETURN:',
            '1. A tailored profile summary (plain text).',
            '2. Experience: each role exactly as titled, with improved bullets and their [source ids].',
            '3. Selected projects with bullets and [source ids].',
            '4. A skills line using only skills with evidence.',
            ...(app ? [
                '5. A cover letter that fits one A4 page (at most about 350 words), addressed to "' + recipientOf(target) + '"' + (target.company ? ' at ' + String(target.company).trim() : '') + '. Start from cover_letter_draft in application_drafts: improve the flow and tone, mention my 2–3 most relevant projects and matched skills, and keep every fact traceable (list the source ids used below the letter, not inside it).',
                '6. The application email: pick or improve one of email_subject_options (keep my name and the role in it), and a short email body (3–4 short lines or bullets about my fit) that says my CV and cover letter are attached and gives my portfolio link. Start from email_body_draft.',
                '7. "Notes for me": gaps, things you were unsure about, and anything I should check before sending. Do not put these in the CV, letter or email.'
            ] : ['5. "Notes for me": gaps, things you were unsure about, and anything I should check before sending. Do not put these in the CV.']),
            '',
            'JOB DESCRIPTION:',
            '"""',
            String(target.jd || '').trim(),
            '"""',
            '',
            'VERIFIED CV DATA (JSON, my real experience; the only source of facts):',
            JSON.stringify(data, null, 2)
        ].join('\n');
    }

    /* ---------------- 4. fact check for text written by an AI assistant ---------------- */
    function factCheck(text, master) {
        const items = itemsOf(master);
        const corpus = ' ' + items.map((it) => it.text.toLowerCase()).join(' \n ') + ' ' + [master.person.name, master.person.title, master.person.tagline, master.person.location, master.person.phone].join(' ').toLowerCase() + ' ';
        const flags = [];
        const t = norm(text);
        if (!t) return flags;
        // Numbers: every number must already be in your data (source ids in [brackets] are skipped)
        const body = t.replace(/\[[^\]]*\]/g, ' ').replace(/(?:https?:\/\/|www\.)\S+/gi, ' ');
        const seenNum = new Set();
        const rawLines = String(text).replace(/\[[^\]]*\]/g, ' ').replace(/(?:https?:\/\/|www\.)\S+/gi, ' ').split(/\n+/);
        for (const m of rawLines.flatMap((ln) => [...norm(ln).matchAll(/([A-Za-z][A-Za-z-]*\s)?(\d+(?:[.,]\d+)?)\s?(%)?[ \t]*([A-Za-z][a-z-]*)?/g)])) {
            const prev = (m[1] || '').trim().toLowerCase(), plain = m[2], pct = !!m[3], next = (m[4] || '').toLowerCase();
            if (prev && corpus.includes(' ' + prev + ' ' + plain)) continue;   // part of a name you have, e.g. "Fusion 360"
            const key = plain + (pct ? '%' : '') + ' ' + next;
            if (seenNum.has(key)) continue;
            seenNum.add(key);
            const numRe = '(^|[^0-9.,])' + plain.replace(/[.,]/g, '[.,]') + '(?![0-9])';
            const shown = plain + (pct ? '%' : '') + (next && !pct ? ' ' + next : '');
            if (pct) { if (!new RegExp(numRe + '\\s?%').test(corpus)) flags.push({ kind: 'number', text: shown, note: 'A percentage that is not in your data.' }); continue; }
            if (!new RegExp(numRe).test(corpus)) { flags.push({ kind: 'number', text: shown, note: 'This number is not in your data.' }); continue; }
            // The number exists, but is it about the same thing? ("12 weeks" in your data is not "12 engineers")
            if (next && next.length > 2 && !STOP.has(next) && !new RegExp(numRe + '\\s?(?:[a-z-]+\\s){0,2}' + stem(next).replace(/[.*+?^${}()|[\]\\]/g, '')).test(corpus)) {
                const ctx = (corpus.match(new RegExp(numRe + '\\s?[a-z%-]*(?:\\s[a-z-]+)?')) || [''])[0].replace(/^[^0-9]/, '').trim();
                flags.push({ kind: 'number', text: shown, note: 'Your data has ' + plain + ' only as "' + ctx + '". Check it means the same thing.' });
            }
        }
        // Tools, methods, certifications: must be backed by real evidence
        COMPILED.forEach((term) => {
            if (term.group === 'soft' || term.group === 'lang' || !term.re.test(' ' + body.toLowerCase() + ' ')) return;
            const ev = items.filter((it) => has(term, it.text));
            const solid = ev.filter((it) => !(it.kind === 'cert' && it.certKind === 'course'));
            if (!ev.length) flags.push({ kind: 'term', text: term.label, note: 'Not in your data: remove it unless it is true and you add it to your master CV.' });
            else if (!solid.length || term.group === 'cert' && !items.some((it) => it.kind === 'cert' && it.certKind === 'certification' && has(term, it.text))) {
                if (term.group === 'cert' || !solid.length) flags.push({ kind: 'cert', text: term.label, note: 'Your data only has a training course for this, not the certification.' });
            }
        });
        // "Certified" is fine inside the exact title of a certification you really hold
        const realCerts = master.certificates.filter((c) => c.kind === 'certification').map((c) => c.title.toLowerCase());
        const claimText = realCerts.reduce((t, title) => t.split(title).join(' '), body.toLowerCase());
        if (/\b(?:certified|certification holder|licensed|chartered)\b/i.test(claimText)) flags.push({ kind: 'claim', text: (body.match(/\b(?:certified|certification holder|licensed|chartered)\b/i) || [''])[0], note: 'Check this wording: make sure it matches a real certificate in your list, not a prep course.' });
        // Ids that don't exist
        (t.match(/\[([^\]]+)\]/g) || []).forEach((b) => b.slice(1, -1).split(/[,;\s]+/).filter((x) => /^(?:exp|prj|skill|summary|edu|cert)-/.test(x)).forEach((id) => {
            if (!items.some((it) => it.id === id)) flags.push({ kind: 'id', text: id, note: 'This source id does not exist in your master CV.' });
        }));
        // Words that look like names (Capitalised) and appear nowhere in your data
        const names = new Set();
        (body.match(/(?:^|[^.!?:\n]\s)([A-Z][a-zA-Z&]+(?:\s+[A-Z][a-zA-Z&]+)*)/g) || []).forEach((m) => {
            const w = m.replace(/^[^A-Z]*/, '').trim();
            if (w.length < 3 || corpus.includes(w.toLowerCase()) || COMMON_CAPS.has(w.toLowerCase())) return;
            if (w.split(/\s+/).every((p) => corpus.includes(p.toLowerCase()) || COMMON_CAPS.has(p.toLowerCase()))) return;
            names.add(w);
        });
        [...names].slice(0, 15).forEach((n) => flags.push({ kind: 'name', text: n, note: 'A name that does not appear in your data: check it is real and yours.' }));
        return flags;
    }
    const COMMON_CAPS = new Set('profile summary experience projects project education skills skill certifications certification languages memberships notes for me selected relevant tools the a an and of in at i my with to on by key core technical professional bsc mechanical engineering engineer design designer graphic june july august december april november jan feb mar apr may jun jul aug sep sept oct nov dec january february march september october present cad 3d 2d kenya nairobi university dear yours sincerely faithfully kind regards thank thanks please why portfolio linkedin hiring team re application during several finally one in my most i\'m i\'ve as'.split(' '));

    const API = { TERMS, GROUPS, FOCUS, LIMITS, PRESETS, RULES, itemsOf, analyse, rank, defaults, compose, trimOrder, grounded, markdown, payload, prompt, factCheck, norm, tone, normalizeMaster, sanitizeRaw, emptyRaw, rawStats, certKind, hash, slug, coverLetter, applicationEmail, jobRef, jobEmail, proofs };
    if (typeof module === 'object' && module.exports) module.exports = API;
    root.CVTailor = API;
})(typeof window !== 'undefined' ? window : globalThis);
