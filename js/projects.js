/* =========================================================================
   PROJECTS: edit this file to add, remove or update your work.

   Each project:
     id        unique short name (no spaces)
     title     project name
     subtitle  one-line context (client, event, date...)
     category  'engineering' or 'graphic'  (drives the filter buttons)
     theme     cover colours when there's no image yet:
               'teal' | 'blue' | 'sun' | 'coral' | 'violet' | 'rose' | 'green'
     icon      cover icon: 'hub' | 'gear' | 'chart' | 'battery' | 'leaf' | 'brush' | 'layout' | 'cube'
     year      shown on the card
     cover     main image (optional). If the file doesn't exist yet,
               a designed colour cover is shown instead, so it's safe
               to list images before you upload them.
     gallery   extra images shown inside the project (optional)
     summary   short paragraph
     deliverables  what the client received, shown as chips on the card
               (optional; falls back to tags), e.g. ['3D assembly', 'Renders']
     outcome   one-line result shown on the card (optional)
     course    a training course name from the Courses tab (e.g. 'SolidWorks'):
               the project appears under "What you'll build" on that course's page
     points    key highlights (bullet list)
     meta      label/value details shown in the project window
     tags      software / skills
     pdf       report in pdfs/ (optional). The "Read report" button only
               appears once the file actually exists.
     featured  true = larger card on desktop
     story     case study shown on the project page (optional):
               { brief, approach, result, link: { href, label } }
     model     3D model (.glb) in models/ (optional). Visitors can spin and
               zoom it in the browser. The "View in 3D" button only appears
               once the file exists. Export .glb from Fusion 360 / SolidWorks
               (via a GLTF exporter) / Inventor, or convert a STEP/STL online.
     portfolio false = show on this site only, not on the separate
               job-application portfolio or the CV tailor (cv-tailor/)
               (optional; default: shown on both).
               Projects from the sheet use its "Job portfolio" column instead.
   ========================================================================= */
window.PROJECTS = [
    {
        id: 'designathon-hub',
        title: 'Sustainable Outdoor Hub',
        subtitle: 'Autodesk Designathon 2025 · Honorable Mention',
        category: 'engineering',
        theme: 'teal',
        icon: 'hub',
        year: '2025',
        featured: true,
        cover: 'images/engineering/designathon/designathon-hub-01.jpg',
        gallery: [
            'images/engineering/designathon/designathon-hub-01.jpg',
            'images/engineering/designathon/designathon-hub-02.jpg',
            'images/engineering/designathon/designathon-hub-03.jpg',
            'images/engineering/designathon/designathon-hub-04.jpg'
        ],
        summary: 'A team design for an accessible, all-season outdoor workspace on a university campus, powered by renewable energy. The entry earned an Honorable Mention at the Autodesk Designathon 2025.',
        deliverables: ['Fusion 360 3D model', 'Structural simulation', 'Interactive 3D model'],
        outcome: 'Honorable Mention at the Autodesk Designathon 2025',
        points: [
            '9.5 m × 9.5 m structure supported on 3 m concrete pillars',
            '6 m radius recycled-polycarbonate roof with integrated solar panels',
            'Ergonomic charging stations for students working outdoors',
            'Validated through 3D modelling and structural simulation in Fusion 360'
        ],
        meta: [
            ['Event', 'Autodesk Designathon 2025'],
            ['Result', 'Honorable Mention'],
            ['Software', 'Autodesk Fusion 360']
        ],
        tags: ['Fusion 360', 'Sustainable design', 'Structural simulation'],
        model: 'models/designathon-hub.glb',
        story: {
            brief: 'Design an accessible, all-season outdoor workspace for a university campus that runs on renewable energy, so students can study and charge their devices outside.',
            approach: 'We sized the hub at 9.5 m × 9.5 m on 3 m concrete pillars and covered it with a 6 m radius curved roof of recycled polycarbonate. Solar panels built into the roof power ergonomic charging stations, so the hub supplies its own energy. The whole structure was modelled in Fusion 360 and checked with structural simulation.',
            result: 'An Honorable Mention at the Autodesk Designathon 2025, for a design that meets the brief on accessibility, all-season comfort and renewable power.'
        },
        pdf: null
    },
    {
        id: 'designathon-2026-hygiene-station',
        title: 'Emergency Hygiene Station',
        subtitle: 'Autodesk Designathon 2026',
        category: 'engineering',
        theme: 'blue',
        icon: 'hub',
        year: '2026',
        cover: 'images/engineering/designathon-2026/hygiene-station-01-800.jpg',
        gallery: [
            'images/engineering/designathon-2026/hygiene-station-01.jpg',
            'images/engineering/designathon-2026/hygiene-station-02.jpg',
            'images/engineering/designathon-2026/hygiene-station-03.jpg',
            'images/engineering/designathon-2026/hygiene-station-04.jpg',
            'images/engineering/designathon-2026/hygiene-station-05.jpg'
        ],
        summary: 'A compact, rapidly deployable hygiene station for communities displaced by natural disasters, designed for the Autodesk Designathon 2026 brief: a place to wash hands, get filtered water and keep up basic hygiene, all within a 2 m × 2 m footprint.',
        deliverables: ['Full Fusion 360 assembly', 'Interactive 3D model', 'Design write-up'],
        outcome: 'Every brief requirement met within a 2 m × 2 m footprint',
        points: [
            'Header tank fed by nine inverted 19-litre carboys, the water containers most easily available after a disaster',
            'Enclosed filtration chamber with three filter columns, visible through clear acrylic panels',
            'Twin stainless-steel basins with taps on opposite sides, so two people can wash their hands at once',
            'U-bend drains carry used water to a separate wastewater tank with a drain valve below',
            'Cross-braced steel frame and aluminium columns, with fasteners and realistic Fusion materials throughout'
        ],
        meta: [
            ['Event', 'Autodesk Designathon 2026'],
            ['Footprint', '2 m × 2 m'],
            ['Software', 'Autodesk Fusion 360']
        ],
        tags: ['Fusion 360', 'Humanitarian design', 'Water filtration'],
        model: 'models/designathon-2026-hygiene-station.glb',
        story: {
            brief: 'After a natural disaster, clean water and sanitation become the most urgent needs. The brief: a compact, rapidly deployable and sustainable station where people can wash their hands, get filtered water and keep up basic hygiene, within 2 m × 2 m and built around 19-litre carboys or 2.5-litre bottles.',
            approach: 'I arranged the station in layers that follow the water. Nine carboys on top feed a header tank, the water passes through three filter columns in an enclosed chamber, and filtered water reaches two taps over basins on opposite sides. Used water drains through U-bends into a separate wastewater tank at the base. A cross-braced steel frame carries the weight of the full carboys, about 170 kg of water.',
            result: 'A complete Fusion 360 assembly submitted to the Autodesk Designathon 2026 that covers every requirement in the brief: carboy integration, a filtration area, wastewater storage and a washing station for two people at once, all inside the 2 m × 2 m footprint.',
            link: { href: 'blog/designing-an-emergency-hygiene-station.html', label: 'Read the full design story' }
        },
        pdf: null
    },
    {
        id: 'coffee-machine',
        title: 'Espresso Coffee Machine',
        subtitle: 'Product design · May – June 2026',
        category: 'engineering',
        theme: 'coral',
        icon: 'cube',
        year: '2026',
        cover: 'images/engineering/coffee-machine/coffee-machine-01-800.jpg',
        gallery: [
            'images/engineering/coffee-machine/coffee-machine-01.jpg',
            'images/engineering/coffee-machine/coffee-machine-02.jpg',
            'images/engineering/coffee-machine/coffee-machine-03.jpg',
            'images/engineering/coffee-machine/coffee-machine-04.jpg',
            'images/engineering/coffee-machine/coffee-machine-05.jpg'
        ],
        summary: 'A compact countertop espresso machine designed from concept to photorealistic render: the full product, from the water supply and internal layout to the brew group and drip tray, modelled as one assembly in Fusion 360.',
        deliverables: ['Full 3D assembly', 'Section views', 'Photorealistic renders'],
        outcome: 'Taken from concept to photorealistic render in Fusion 360',
        points: [
            'Twin inverted-bottle water reservoirs that feed the machine from the top',
            'Clear acrylic side panel that shows the twin filter cartridges and internal layout',
            'Group head with a wooden-handled portafilter over a perforated stainless drip tray',
            'Material palette of dark bamboo trim, anodised aluminium, stainless steel and ABS',
            'Full 3D assembly, section views and photorealistic rendering in Fusion 360'
        ],
        meta: [
            ['Type', 'Product design'],
            ['Timeline', 'May – June 2026'],
            ['Software', 'Autodesk Fusion 360']
        ],
        tags: ['Fusion 360', 'Product design', 'Rendering'],
        model: 'models/coffee-machine.glb',
        story: {
            link: { href: 'blog/coffee-machine-from-concept-to-render.html', label: 'Read how I designed it' }
        },
        pdf: null
    },
    {
        id: 'bench-vise',
        title: 'Parallel-Guide Bench Vise',
        subtitle: 'SolidWorks training project · Nexus CAD Studio',
        category: 'engineering',
        theme: 'violet',
        icon: 'gear',
        year: '2026',
        cover: 'images/engineering/bench-vise/bench-vise-01-800.jpg',
        gallery: [
            'images/engineering/bench-vise/bench-vise-01.jpg',
            'images/engineering/bench-vise/bench-vise-02.jpg',
            'images/engineering/bench-vise/bench-vise-03.jpg',
            'images/engineering/bench-vise/bench-vise-04.jpg'
        ],
        summary: 'A small parallel-guide bench vise I designed as the end-of-course SolidWorks project for Nexus CAD Studio trainees. A lead screw drives a sliding jaw along two guide rods, giving a 100 mm jaw that opens to 80 mm. Trainees model it part by part over ten sessions, from fully defined sketches to a working assembly and a drawing set.',
        deliverables: ['10-session course brief', 'Reference 3D assembly', 'Part-by-part specifications'],
        outcome: 'A complete course project trainees build part by part in 10 sessions',
        points: [
            '10 parts: cast-iron jaw and bearing blocks, serrated jaw plates, guide rods, lead screw, handle, retaining pin and two sheet-metal plates',
            'M14 × 2.0 lead screw with a SolidWorks screw mate: one turn of the handle moves the jaw 2 mm',
            '100 mm jaws that open from 0 to 80 mm, set by distance-mate limits',
            '3 mm sheet-metal base plate with stiffening flanges, four slotted mounting holes and a flat pattern',
            'Serrated jaw plates: a 15-groove linear pattern with countersunk M5 holes',
            'Design change with Global Variables: the jaw width goes from 100 to 120 mm and everything rebuilds'
        ],
        meta: [
            ['Type', 'SolidWorks training project'],
            ['Course', '10 sessions'],
            ['Size', 'About 253 mm closed, 333 mm open'],
            ['Software', 'SOLIDWORKS']
        ],
        tags: ['SolidWorks', 'CAD training', 'Assembly & mates', 'Sheet metal'],
        course: 'SolidWorks',
        model: 'models/bench-vise.glb',
        story: {
            brief: 'Trainees finishing the SolidWorks course needed one project that brings everything together: clean sketches, solid features, editing, sheet metal and an assembly that actually moves. The vise is heavier on solid modelling than the course\'s sheet-metal toolbox project, so it builds speed with sketches, patterns and edits.',
            approach: 'I wrote a brief with a fixed coordinate system and a numbered spec for each part (VS-01 to VS-10), so every trainee models a share of the parts and assembles the full vise from the agreed class files. The ten sessions move from blocks and revolved parts to sheet metal, equations and a design change, then mates with limits, the screw mate, an exploded view, a section view and A3 drawings with a bill of materials.',
            result: 'The reference SolidWorks assembly shown here in 3D, with every part numbered as in the brief. Trainees check their own assembly against the brief\'s values: about 253 mm closed and 333 mm fully open, 2 mm of travel per handle turn, and no interference.'
        },
        pdf: null
    },
    {
        id: 'kirdi-fabrication',
        title: 'Sheet Metal Fabrication at KIRDI',
        subtitle: 'Industrial attachment · Jun – Aug 2025',
        category: 'engineering',
        theme: 'blue',
        icon: 'gear',
        year: '2025',
        cover: 'images/engineering/kirdi/kirdi-sheet-metal-01-800.jpg',
        gallery: [
            'images/engineering/kirdi/kirdi-sheet-metal-01.jpg',
            'images/engineering/kirdi/kirdi-sheet-metal-02.jpg',
            'images/engineering/kirdi/kirdi-sheet-metal-03.jpg',
            'images/engineering/kirdi/kirdi-sheet-metal-04.jpg'
        ],
        summary: 'A 12-week attachment at the Kenya Industrial Research and Development Institute’s Engineering Research and ICT Department, designing and fabricating real components for projects that support Kenyan MSMEs.',
        deliverables: ['3D models & 2D drawings', 'Sheet-metal parts', 'Machined components'],
        outcome: 'Prototype parts fabricated to precise tolerances',
        points: [
            'Designed and fabricated jiko stove components from sheet metal, applying DFM principles and manufacturing tolerances',
            'Helped design and build a poultry de-feathering machine, from concept to component iteration and assembly',
            '3D models, assemblies and 2D technical drawings in SolidWorks, Inventor and Fusion 360',
            'CNC laser cutting and bending of L-beams, car bumpers and machine casings to precise tolerances',
            'Arc and TIG welding, shaft milling and lathe work'
        ],
        meta: [
            ['Organisation', 'KIRDI, Nairobi'],
            ['Duration', '12 weeks'],
            ['Focus', 'Fabrication & machining']
        ],
        tags: ['DFM', 'Sheet metal', 'CNC laser cutting', 'SolidWorks'],
        pdf: 'pdfs/kirdi-industrial-attachment-report.pdf'
    },
    {
        id: 'final-year-project',
        title: 'Forming Limit Prediction for AM AlSi10Mg',
        subtitle: 'Final-year project · 2025 – 2026',
        category: 'engineering',
        theme: 'violet',
        icon: 'chart',
        year: '2026',
        cover: 'images/engineering/final-year-project/fyp-01-800.jpg',
        gallery: [
            'images/engineering/final-year-project/fyp-01.jpg',
            'images/engineering/final-year-project/fyp-02.jpg',
            'images/engineering/final-year-project/fyp-03.jpg',
            'images/engineering/final-year-project/fyp-04.jpg',
            'images/engineering/final-year-project/fyp-05.jpg'
        ],
        summary: 'Predicting the forming limit curve of additively manufactured AlSi10Mg sheet through a coupled GTN–Hill’48 simulation of the Nakajima test, so that sheet-metal parts can be checked for failure before they are made.',
        deliverables: ['Calibrated GTN–Hill’48 FE model', 'Lab tensile test data', 'Forming limit curve'],
        outcome: 'Sheet-metal failure predicted before parts are made',
        points: [
            'Coupled damage mechanics (GTN) with Hill’48 anisotropic plasticity',
            'Heat-treated and tensile-tested AlSi10Mg specimens in the lab to calibrate the GTN–Hill’48 model',
            'Simulated the Nakajima stretch-forming test to build the forming limit curve',
            'Practical failure prediction for sheet-metal parts before manufacture',
            'Insight into material behaviour under forming, failure and process optimisation'
        ],
        meta: [
            ['Type', 'Final-year project'],
            ['Material', 'AM AlSi10Mg'],
            ['Method', 'FE simulation & lab testing']
        ],
        tags: ['FEA', 'Damage mechanics', 'Sheet metal forming', 'Tensile testing'],
        pdf: 'pdfs/final-year-project-report.pdf'
    },
    {
        id: 'ev-battery-cooling',
        title: 'EV Battery Pack Cooling',
        subtitle: 'Freelance client project · Design & thermal simulation',
        category: 'engineering',
        theme: 'green',
        icon: 'battery',
        year: '',
        cover: 'images/engineering/ev-battery/ev-battery-cooling-01.jpg',
        gallery: [
            'images/engineering/ev-battery/ev-battery-cooling-01.jpg',
            'images/engineering/ev-battery/ev-battery-cooling-02.jpg',
            'images/engineering/ev-battery/ev-battery-cooling-03.jpg'
        ],
        summary: 'Designed and simulated a complete electric-vehicle battery cooling pack for a private client, covering 3D modelling, assembly and thermal performance analysis.',
        deliverables: ['3D models & assemblies', 'Thermal simulation results', 'Iterated cooling layout'],
        outcome: 'A complete design package delivered to the client',
        points: [
            'Full 3D model and assembly of the battery cooling pack',
            'Thermal simulation to keep the battery cells within their required operating temperature range',
            'Iterated the cooling geometry and layout based on the results',
            'Delivered a complete design package: 3D models, assemblies and simulation results'
        ],
        meta: [
            ['Client', 'Private client'],
            ['Software', 'SolidWorks & Inventor'],
            ['Focus', 'Thermal management']
        ],
        tags: ['SolidWorks', 'Inventor', 'Thermal simulation'],
        // model: 'models/ev-battery-cooling.glb',   // add back once the 3D file is uploaded
        pdf: 'pdfs/ev-battery-cooling-report.pdf'
    },
    {
        id: 'camp-meeting',
        title: 'Camp Meeting Appreciation',
        subtitle: 'Certificate series · SDA Church Ngong Road',
        category: 'graphic',
        theme: 'rose',
        icon: 'brush',
        year: '2026',
        cover: 'images/graphic/illustrator/web/APPRECIATION-02-1200.jpg',
        gallery: [
            'images/graphic/illustrator/web/APPRECIATION-02-1200.jpg',
            'images/graphic/illustrator/web/APPRECIATION-03-1200.jpg',
            'images/graphic/illustrator/web/APPRECIATION-04-1200.jpg',
            'images/graphic/illustrator/web/APPRECIATION-06-1200.jpg',
            'images/graphic/illustrator/web/APPRECIATION-06-06-1200.jpg'
        ],
        summary: 'A series of appreciation certificates recognising ministries for their contributions to the church’s Camp Meeting fundraising goal.',
        deliverables: ['Personalised certificate series'],
        outcome: 'One consistent design across the whole series',
        points: [
            'Consistent layout across the whole series, personalised per recipient',
            'Bold typography with a warm, celebratory colour palette'
        ],
        meta: [
            ['Client', 'SDA Church, Ngong Road'],
            ['Software', 'Adobe Illustrator']
        ],
        tags: ['Illustrator', 'Certificates', 'Print'],
        pdf: null
    },
    {
        id: 'mazingira-day',
        title: 'Mazingira Day Posters',
        subtitle: 'Environmental awareness campaign',
        category: 'graphic',
        theme: 'green',
        icon: 'leaf',
        year: '',
        cover: 'images/graphic/mazingira/mazingira-day-01.jpg',
        gallery: [
            'images/graphic/mazingira/mazingira-day-01.jpg',
            'images/graphic/mazingira/mazingira-day-02.jpg'
        ],
        summary: 'Campaign posters for Mazingira Day, encouraging care for the environment with clear messaging and vibrant visuals.',
        deliverables: ['Poster series for print & social media'],
        points: [
            'Poster series designed for print and social media'
        ],
        meta: [
            ['Type', 'Poster campaign']
        ],
        tags: ['Poster design', 'Campaign', 'Illustrator'],
        pdf: null
    },
    {
        id: 'evening-sermon',
        title: 'Evening Sermon',
        subtitle: 'Event graphic',
        category: 'graphic',
        theme: 'sun',
        icon: 'layout',
        year: '',
        cover: 'images/graphic/illustrator/web/Untitled-1-01-1200.jpg',
        gallery: [
            'images/graphic/illustrator/web/Untitled-1-01-1200.jpg'
        ],
        summary: 'A bold, widescreen event graphic announcing a daily evening sermon series.',
        deliverables: ['Event graphic'],
        points: [
            'Gradient headline typography paired with photography'
        ],
        meta: [
            ['Software', 'Adobe Illustrator']
        ],
        tags: ['Illustrator', 'Social media', 'Event'],
        pdf: null
    }
];
