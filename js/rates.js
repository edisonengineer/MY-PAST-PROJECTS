/* =========================================================================
   COST ESTIMATOR RATES (KES)

   `min` = your starting price for ONE unit (one part, one design, one m²...).
   `max` = optional upper price per unit. Leave it as null to show
           "From KES ..." instead of a range.

   `complexity` / `urgency`: optional price multipliers. Leave a list empty
   to hide that question. Example to charge 30% more for express jobs:
       urgency: [
           { id: 'standard', label: 'Standard', factor: 1 },
           { id: 'express',  label: 'Express',  factor: 1.3 }
       ],

   Set `ready: false` to hide the estimator from visitors (preview it with
   ?preview=estimator at the end of the site address).
   ========================================================================= */
window.ESTIMATOR = {
    ready: true,
    currency: 'KES',

    complexity: [],
    urgency: [],

    categories: [
        { id: 'engineering', label: 'Engineering' },
        { id: 'graphic',     label: 'Graphic Design' },
        { id: 'training',    label: 'Training' }
    ],

    services: [
        // Engineering
        { id: '3d-part',    category: 'engineering', label: '3D part model',         unit: 'Number of parts',       min: 1000, max: null },
        { id: 'assembly',   category: 'engineering', label: 'Assembly & drawings',   unit: 'Number of assemblies',  min: 4500, max: null },
        { id: 'simulation', category: 'engineering', label: 'Simulation study',      unit: 'Number of studies',     min: 4500, max: null },
        // Graphic design
        { id: 'poster',     category: 'graphic',     label: 'Poster design',         unit: 'Number of designs',     min: 500,  max: null },
        { id: 'printing',   category: 'graphic',     label: 'Poster printing',       unit: 'Area (square metres)',  min: 1000, max: null },
        { id: 'social',     category: 'graphic',     label: 'Social media pack',     unit: 'Number of packs',       min: 3500, max: null },
        { id: 'brand',      category: 'graphic',     label: 'Brand identity',        unit: 'Number of brands',      min: 7500, max: null },
        // Training
        { id: 'training',   category: 'training',    label: 'CAD training',          unit: 'Number of trainees',    min: 4500, max: null }
    ]
};
