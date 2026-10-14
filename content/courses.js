/* =========================================================================
   CAD TRAINING COURSES: shown on training/index.html.
   After editing, run:  node tools/build-pages.js

   nextIntake  e.g. 'Saturday classes from 7 November 2026'. Leave '' to
               show "Dates on request".
   price       starting price per trainee in KES (number)
   ========================================================================= */
window.TRAINING = {
    nextIntake: '',
    price: 4500,
    formats: [
        { icon: 'users', title: 'One-on-one', text: 'Lessons built around your goals and pace, online or in person in Nairobi.' },
        { icon: 'cap', title: 'Small group', text: 'Learn with classmates on a shared schedule. Great for students and friends learning together.' },
        { icon: 'gear', title: 'Company team', text: 'Training for your engineers or technicians, focused on the work your team actually does.' }
    ],
    courses: [
        {
            id: 'autocad',
            name: 'AutoCAD',
            theme: 'coral',
            icon: 'layout',
            tagline: '2D drafting and technical drawings',
            levels: 'Beginner to intermediate',
            topics: [
                'Interface, command aliases and drafting settings',
                'Drawing and editing tools with precision (object snaps, ortho, polar)',
                'Layers, linetypes and drawing organisation',
                'Dimensions, text and annotation styles',
                'Blocks and reusable details',
                'Layouts, viewports, scales and plotting to PDF',
                'Introduction to 3D modelling'
            ]
        },
        {
            id: 'solidworks',
            name: 'SolidWorks',
            theme: 'blue',
            icon: 'cube',
            tagline: '3D parts, assemblies and drawings',
            levels: 'Beginner to advanced',
            topics: [
                'Sketching with relations and dimensions',
                'Part modelling features and design intent',
                'Assemblies, mates and motion checks',
                'Manufacturing drawings with dimensions and BOMs',
                'Sheet metal parts and flat patterns',
                'Intro to simulation (FEA) studies',
                'CSWA exam preparation and practice'
            ]
        },
        {
            id: 'inventor',
            name: 'Autodesk Inventor',
            theme: 'violet',
            icon: 'gear',
            tagline: 'Mechanical design for machines and products',
            levels: 'Beginner to advanced',
            topics: [
                'Parametric sketches and part features',
                'Assemblies, constraints and joints',
                'Drawings, parts lists and annotation',
                'Sheet metal design',
                'Frame Generator for structures',
                'Exploded views and presentations',
                'Working with AutoCAD DWG files'
            ]
        },
        {
            id: 'fusion',
            name: 'Fusion 360',
            theme: 'teal',
            icon: 'hub',
            tagline: 'Design, render and make, all in one',
            levels: 'Beginner to intermediate',
            topics: [
                'Sketching and solid modelling',
                'Components, joints and assemblies',
                'Rendering and product visuals',
                'Preparing parts for 3D printing',
                'Introduction to CAM and CNC toolpaths',
                'Introduction to simulation',
                'Cloud collaboration and sharing designs'
            ]
        }
    ],
    faq: [
        ['Do I need my own software?', 'Yes, you will need the software installed on your laptop. Autodesk and SolidWorks offer free or low-cost licences for students and educators, and I will help you choose and set up the right option before the first lesson.'],
        ['What kind of computer do I need?', 'A laptop that meets the software\'s minimum requirements and a mouse with a scroll wheel. Tell me your laptop model when you reserve a seat and I will check it for you.'],
        ['I have never used CAD before. Can I join?', 'Absolutely. Every course starts from the basics and builds up step by step with practical, project-based exercises.'],
        ['How are the lessons scheduled?', 'We agree on the days and times together. Evening and weekend sessions are available, online or in person in Nairobi.'],
        ['How do I pay?', 'Once we agree on the schedule, you can pay by M-Pesa. Prices start from KES 4,500 per trainee, depending on the course length and format.']
    ]
};
