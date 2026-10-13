/* =========================================================================
   COST ESTIMATOR RATES

   The estimator stays HIDDEN on the live site until `ready` is true, so
   visitors never see placeholder prices. To try it before then, open the
   site with ?preview=estimator at the end of the address.

   For each service set `min` and `max`: the price range in KES for ONE unit
   (one part, one design, one hour...) at "Standard" complexity and deadline.
   The numbers below are SAMPLES ONLY — replace them with your real rates.
   ========================================================================= */
window.ESTIMATOR = {
    ready: false,
    currency: 'KES',

    complexity: [
        { id: 'simple',   label: 'Simple',   factor: 0.75 },
        { id: 'standard', label: 'Standard', factor: 1 },
        { id: 'complex',  label: 'Complex',  factor: 1.6 }
    ],

    urgency: [
        { id: 'standard', label: 'Standard', factor: 1 },
        { id: 'priority', label: 'Priority', factor: 1.25 },
        { id: 'express',  label: 'Express',  factor: 1.5 }
    ],

    categories: [
        { id: 'engineering', label: 'Engineering' },
        { id: 'graphic',     label: 'Graphic Design' },
        { id: 'training',    label: 'Training' }
    ],

    services: [
        // Engineering
        { id: '3d-part',     category: 'engineering', label: '3D part model',              unit: 'Number of parts',     min: 2000,  max: 4000 },
        { id: 'assembly',    category: 'engineering', label: '3D assembly',                unit: 'Number of assemblies', min: 6000,  max: 12000 },
        { id: 'drawings',    category: 'engineering', label: '2D manufacturing drawings',  unit: 'Number of sheets',    min: 1500,  max: 3000 },
        { id: 'sheet-metal', category: 'engineering', label: 'Sheet metal / fabrication design', unit: 'Number of parts', min: 3000, max: 6000 },
        { id: 'fea',         category: 'engineering', label: 'FEA / thermal simulation',   unit: 'Number of studies',   min: 8000,  max: 18000 },
        { id: 'renders',     category: 'engineering', label: 'Product renders',            unit: 'Number of renders',   min: 1000,  max: 2500 },
        // Graphic design
        { id: 'poster',      category: 'graphic', label: 'Poster / flyer',                 unit: 'Number of designs',   min: 1500,  max: 3500 },
        { id: 'social',      category: 'graphic', label: 'Social media graphic',           unit: 'Number of designs',   min: 800,   max: 1500 },
        { id: 'certificate', category: 'graphic', label: 'Certificate',                    unit: 'Number of designs',   min: 1000,  max: 2000 },
        { id: 'logo',        category: 'graphic', label: 'Logo & brand identity',          unit: 'Number of brands',    min: 8000,  max: 20000 },
        { id: 'brochure',    category: 'graphic', label: 'Brochure / magazine',            unit: 'Number of pages',     min: 800,   max: 1800 },
        { id: 'motion',      category: 'graphic', label: 'Motion graphics / video',        unit: 'Length (×30 seconds)', min: 3000, max: 7000 },
        // Training
        { id: 'training-1to1',  category: 'training', label: 'One-on-one CAD training',    unit: 'Number of hours',     min: 1000,  max: 2000 },
        { id: 'training-group', category: 'training', label: 'Group CAD training (per trainee)', unit: 'Number of trainees', min: 3000, max: 6000 }
    ]
};
