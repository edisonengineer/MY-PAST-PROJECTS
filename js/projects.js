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
     points    key highlights (bullet list)
     meta      label/value details shown in the project window
     tags      software / skills
     pdf       report in pdfs/ (optional). The "Read report" button only
               appears once the file actually exists.
     featured  true = larger card on desktop
     model     3D model (.glb) in models/ (optional). Visitors can spin and
               zoom it in the browser. The "View in 3D" button only appears
               once the file exists. Export .glb from Fusion 360 / SolidWorks
               (via a GLTF exporter) / Inventor, or convert a STEP/STL online.
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
            'images/engineering/designathon/designathon-hub-03.jpg'
        ],
        summary: 'A team design for an accessible, all-season outdoor workspace on a university campus, powered by renewable energy. The entry earned an Honorable Mention at the Autodesk Designathon 2025.',
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
        cover: 'images/engineering/kirdi/kirdi-sheet-metal-01.jpg',
        gallery: [
            'images/engineering/kirdi/kirdi-sheet-metal-01.jpg',
            'images/engineering/kirdi/kirdi-sheet-metal-02.jpg',
            'images/engineering/kirdi/kirdi-sheet-metal-03.jpg'
        ],
        summary: 'A 12-week attachment at the Kenya Industrial Research and Development Institute’s Engineering Research and ICT Department, designing and fabricating real components for projects that support Kenyan MSMEs.',
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
        pdf: 'pdfs/kirdi-sheet-metal-report.pdf'
    },
    {
        id: 'final-year-project',
        title: 'Forming Limit Prediction for AM AlSi10Mg',
        subtitle: 'Final-year project · 2025 – 2026',
        category: 'engineering',
        theme: 'violet',
        icon: 'chart',
        year: '2026',
        cover: 'images/engineering/final-year-project/fyp-01.jpg',
        gallery: [
            'images/engineering/final-year-project/fyp-01.jpg',
            'images/engineering/final-year-project/fyp-02.jpg',
            'images/engineering/final-year-project/fyp-03.jpg'
        ],
        summary: 'Predicting the forming limit curve of additively manufactured AlSi10Mg sheet through a coupled GTN–Hill’48 simulation of the Nakajima test, so that sheet-metal parts can be checked for failure before they are made.',
        points: [
            'Coupled damage mechanics (GTN) with Hill’48 anisotropic plasticity',
            'Simulated the Nakajima stretch-forming test to build the forming limit curve',
            'Practical failure prediction for sheet-metal parts before manufacture',
            'Insight into material behaviour under forming, failure and process optimisation'
        ],
        meta: [
            ['Type', 'Final-year project'],
            ['Material', 'AM AlSi10Mg'],
            ['Method', 'FE simulation']
        ],
        tags: ['FEA', 'Damage mechanics', 'Sheet metal forming'],
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
        model: 'models/ev-battery-cooling.glb',
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
            'images/graphic/illustrator/web/APPRECIATION-02.jpg',
            'images/graphic/illustrator/web/APPRECIATION-03.jpg',
            'images/graphic/illustrator/web/APPRECIATION-04.jpg',
            'images/graphic/illustrator/web/APPRECIATION-06.jpg',
            'images/graphic/illustrator/web/APPRECIATION-06-06.jpg'
        ],
        summary: 'A series of appreciation certificates recognising ministries for their contributions to the church’s Camp Meeting fundraising goal.',
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
            'images/graphic/illustrator/web/Untitled-1-01.jpg'
        ],
        summary: 'A bold, widescreen event graphic announcing a daily evening sermon series.',
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
