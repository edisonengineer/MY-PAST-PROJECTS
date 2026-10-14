/* =========================================================================
   CV: used for the online CV page (cv/index.html) and the portfolio PDF.
   After editing run:  node tools/build-pages.js  and  node tools/build-portfolio.js
   The email address is never written here (it stays hidden on the site).
   ========================================================================= */
window.CV = {
    name: 'Edison Ochieng',
    title: 'Mechanical Design Engineer & Graphic Designer',
    tagline: 'Founder of Nexus CAD Studio · Nairobi, Kenya',
    phone: '+254 708 639 473',
    location: 'Nairobi, Kenya',
    linkedin: 'https://www.linkedin.com/in/edison-ochieng-870a37229/',
    summary: 'Mechanical Engineering graduate from the University of Nairobi with hands-on CAD experience in SolidWorks, Autodesk Inventor and Fusion 360. I produce 3D models, assemblies and 2D technical drawings for industrial prototypes, and run Nexus CAD Studio, a CAD and graphic design studio that has trained over 100 people. My final-year project used coupled FE simulation of sheet metal forming, reflecting strong manufacturing and design fundamentals. I am eager to contribute to product development, prototyping and technical support.',
    skills: [
        'CAD & engineering design: SolidWorks, Inventor, Fusion 360, AutoCAD, Revit',
        'Manufacturing processes & DFM principles',
        'Simulation & FEA: SolidWorks Simulation, Abaqus',
        'Technical drawing & documentation',
        'Prototype fabrication & lab testing',
        'Graphic design: Illustrator, Photoshop, InDesign, Premiere Pro',
        'CAD training & facilitation',
        'Leadership, collaboration & communication'
    ],
    experience: [
        {
            role: 'Founder',
            org: 'Nexus CAD Studio, Nairobi',
            dates: 'Dec 2024 – Present',
            points: [
                'Founded a CAD and graphic design studio delivering services in Revit, Inventor Professional, Fusion 360, SolidWorks and AutoCAD.',
                'Built CAD training programmes that have upskilled over 100 professionals and students.',
                'Delivered client projects including the design and thermal simulation of an EV battery cooling pack.'
            ]
        },
        {
            role: 'Industrial Attachment, Mechanical Engineering',
            org: 'Kenya Industrial Research and Development Institute (KIRDI), Nairobi',
            dates: 'Jun – Aug 2025 (12 weeks)',
            points: [
                'Designed and fabricated jiko stove components from sheet metal, applying DFM principles and manufacturing tolerances.',
                'Operated laser cutting machines to produce sheet-metal components to precise dimensional tolerances.',
                'Created 3D models, assemblies and 2D technical drawings in SolidWorks, Inventor and Fusion 360 for industrial prototypes.',
                'Contributed to the design and fabrication of a poultry de-feathering machine, from concept to mechanical assembly.',
                'Performed machine shop operations including shaft milling and lathe work.'
            ]
        },
        {
            role: 'Autodesk Fusion Design',
            org: 'KnowledgePoint Limited',
            dates: 'Jun – Jul 2025',
            points: [
                'Autodesk Designathon 2025, Honorable Mention: designed a solar-powered sustainable outdoor hub for a university campus, validated with 3D modelling and structural simulation in Fusion 360.'
            ]
        },
        {
            role: 'Leader, Workshop & Exhibition Planning',
            org: 'Women in Engineering Students Summit 4.0 (WIESS 4.0), University of Nairobi',
            dates: '2025 – 2026',
            points: []
        },
        {
            role: 'Academic Secretary',
            org: 'University of Nairobi Students Association (UNSA)',
            dates: 'Apr – Nov 2024',
            points: ['Secretary General of the UNSA academic committee, overseeing student academic affairs.']
        }
    ],
    projects: [
        { name: 'EV Battery Cooling Pack (freelance client)', text: 'Design and thermal simulation of an electric-vehicle battery cooling pack in SolidWorks and Inventor: 3D models, assemblies and thermal analysis to keep cells within their operating temperature range.' },
        { name: 'Final-year project (2025 – 2026)', text: "Forming limit curve prediction for AM AlSi10Mg through a GTN–Hill'48 coupled simulation of the Nakajima test: failure prediction for sheet-metal parts before they are manufactured." }
    ],
    education: [
        { title: 'BSc Mechanical Engineering', org: 'University of Nairobi', dates: '2021 – 2026', note: 'Coursework: Engineering Design I–III, CAD/CAM, Manufacturing Processes, Strength of Materials, Thermodynamics, Fluid Mechanics, Control Systems, Materials Science.' },
        { title: 'KCSE, Mean Grade A', org: 'Aoch Muga Secondary School, Homa Bay', dates: '2017 – 2020', note: 'Secretary, Student Council (2018 – 2020).' }
    ],
    memberships: ['Mechanical Engineering Students Association (MESA), University of Nairobi (2022 – 2026)', 'Engineering Students Association (ESA), University of Nairobi (2022 – 2026)'],
    languages: ['English (full professional)', 'French (native / bilingual)', 'Kiswahili (fluent)']
};
