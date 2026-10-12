/* =========================================================================
   PACKAGES & PRICING: edit names, descriptions and prices here.

   price     e.g. 'KES 3,500'. Leave '' to show "Custom quote" instead.
   from      true  = shows "Starting from" above the price
   category  'engineering' | 'graphic' | 'training'  (drives the filter)
   brief     which project type the "Get a quote" button pre-selects
   ========================================================================= */
window.PACKAGES = [
    {
        name: '3D Part Model',
        category: 'engineering',
        icon: 'cube',
        theme: 'blue',
        description: 'A single part modelled from your sketch, dimensions or physical sample.',
        price: '',
        from: true,
        includes: ['Parametric 3D model', 'Native CAD file + STEP', 'Clean product renders'],
        brief: 'Engineering Design'
    },
    {
        name: 'Assembly & Drawings',
        category: 'engineering',
        icon: 'gear',
        theme: 'teal',
        description: 'Multi-part assemblies with manufacturing-ready drawings.',
        price: '',
        from: true,
        includes: ['Full 3D assembly', 'Dimensioned 2D drawings (PDF / DWG)', 'Bill of materials', 'Exploded views'],
        brief: 'Engineering Design'
    },
    {
        name: 'Simulation Study',
        category: 'engineering',
        icon: 'chart',
        theme: 'violet',
        description: 'FEA or thermal analysis to validate a design before it is built.',
        price: '',
        from: true,
        includes: ['Model preparation & meshing', 'Loads & boundary conditions', 'Result plots', 'Short technical report'],
        brief: 'Engineering Design'
    },
    {
        name: 'Social Media Pack',
        category: 'graphic',
        icon: 'image',
        theme: 'coral',
        description: 'A set of on-brand posts and stories for your campaign or event.',
        price: '',
        from: true,
        includes: ['Designs sized for your platforms', 'PNG / JPG exports', 'Editable source on request'],
        brief: 'Graphic Design'
    },
    {
        name: 'Poster & Print',
        category: 'graphic',
        icon: 'layout',
        theme: 'sun',
        description: 'Posters, flyers, certificates and banners that stand out.',
        price: '',
        from: true,
        includes: ['Print-ready PDF', 'Digital version for sharing', 'Printing coordination on request'],
        brief: 'Graphic Design'
    },
    {
        name: 'Brand Identity',
        category: 'graphic',
        icon: 'brush',
        theme: 'rose',
        description: 'A logo and visual identity that makes your business recognisable.',
        price: '',
        from: true,
        includes: ['Logo concepts', 'Colour palette & fonts', 'Logo files for print & web', 'Mini brand guide'],
        brief: 'Graphic Design'
    },
    {
        name: 'CAD Training',
        category: 'training',
        icon: 'cap',
        theme: 'green',
        description: 'One-on-one or group training, online or in person in Nairobi.',
        price: '',
        from: true,
        includes: ['AutoCAD, SolidWorks, Inventor or Fusion 360', 'Beginner to advanced', 'Practical, project-based exercises', 'Practice files to keep'],
        brief: 'Engineering Design'
    }
];
