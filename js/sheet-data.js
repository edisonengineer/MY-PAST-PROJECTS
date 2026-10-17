/* Generated from the Google Sheet (Pricing, Certificates, Courses, Recordings and Settings tabs)
   by tools/sync-from-sheet.js: edit the sheet, not this file. A list missing here keeps the website's built-in one. */
(function (d) {
    if (d.packages) window.PACKAGES = d.packages;
    if (d.certificates) window.CERTIFICATES = d.certificates;
    if (d.faq) window.SITE_FAQ = d.faq;
    if (d.recordings && window.SITE_CONFIG) (window.SITE_CONFIG.webinar = window.SITE_CONFIG.webinar || {}).recordings = d.recordings;
    if (window.TRAINING) {
        if (d.courses) window.TRAINING.courses = d.courses;
        if (d.training) { window.TRAINING.nextIntake = d.training.intake; if (d.training.price) window.TRAINING.price = d.training.price; }
    }
})({
  "packages": [
    {
      "name": "3D Part Model",
      "category": "engineering",
      "icon": "cube",
      "theme": "blue",
      "description": "A single part modelled from your sketch, dimensions or physical sample.",
      "price": "KES 1,000",
      "from": true,
      "includes": [
        "Parametric 3D model",
        "Native CAD file + STEP",
        "Clean product renders"
      ],
      "brief": "Engineering Design"
    },
    {
      "name": "Assembly & Drawings",
      "category": "engineering",
      "icon": "gear",
      "theme": "teal",
      "description": "Multi-part assemblies with manufacturing-ready drawings.",
      "price": "KES 4,500",
      "from": true,
      "includes": [
        "Full 3D assembly",
        "Dimensioned 2D drawings (PDF / DWG)",
        "Bill of materials",
        "Exploded views"
      ],
      "brief": "Engineering Design"
    },
    {
      "name": "Simulation Study",
      "category": "engineering",
      "icon": "chart",
      "theme": "violet",
      "description": "FEA or thermal analysis to validate a design before it is built.",
      "price": "KES 4,500",
      "from": true,
      "includes": [
        "Model preparation & meshing",
        "Loads & boundary conditions",
        "Result plots",
        "Short technical report"
      ],
      "brief": "Engineering Design"
    },
    {
      "name": "Social Media Pack",
      "category": "graphic",
      "icon": "image",
      "theme": "coral",
      "description": "A set of on-brand posts and stories for your campaign or event.",
      "price": "KES 3,500",
      "from": true,
      "includes": [
        "Designs sized for your platforms",
        "PNG / JPG exports",
        "Editable source on request"
      ],
      "brief": "Graphic Design"
    },
    {
      "name": "Poster & Print",
      "category": "graphic",
      "icon": "layout",
      "theme": "sun",
      "description": "Posters, flyers, certificates and banners that stand out.",
      "price": "KES 500",
      "from": true,
      "includes": [
        "Price per design",
        "Print-ready PDF",
        "Digital version for sharing",
        "Printing from KES 1,000 per m²"
      ],
      "brief": "Graphic Design"
    },
    {
      "name": "Brand Identity",
      "category": "graphic",
      "icon": "brush",
      "theme": "rose",
      "description": "A logo and visual identity that makes your business recognisable.",
      "price": "KES 7,500",
      "from": true,
      "includes": [
        "Logo concepts",
        "Colour palette & fonts",
        "Logo files for print & web",
        "Mini brand guide"
      ],
      "brief": "Graphic Design"
    },
    {
      "name": "CAD Training",
      "category": "training",
      "icon": "cap",
      "theme": "green",
      "description": "One-on-one or group training, online or in person in Nairobi.",
      "price": "KES 4,500",
      "from": true,
      "includes": [
        "AutoCAD, SolidWorks, Inventor or Fusion 360",
        "Beginner to advanced",
        "Practical, project-based exercises",
        "Practice files to keep"
      ],
      "brief": "Engineering Design"
    }
  ],
  "certificates": [
    {
      "title": "Certified SOLIDWORKS Associate (CSWA) Cert Prep",
      "issuer": "LinkedIn Learning",
      "tone": "blue",
      "icon": "cube",
      "file": "",
      "verify": "https://www.linkedin.com/learning/certificates/02dd967cc0613a683c80a08ea44bbfa46d1d73ca0be389a0979e2d0e829e80e2"
    },
    {
      "title": "CSWA Exam Preparation (SOLIDWORKS)",
      "issuer": "Udemy",
      "tone": "violet",
      "icon": "cube",
      "file": "",
      "verify": "https://www.udemy.com/certificate/UC-09090316-a037-4c81-a287-30a8dc798a72/"
    },
    {
      "title": "Autodesk Inventor Design Certification",
      "issuer": "LinkedIn Learning",
      "tone": "teal",
      "icon": "gear",
      "file": "",
      "verify": ""
    },
    {
      "title": "Autodesk Designathon 2025, Honorable Mention",
      "issuer": "Autodesk",
      "tone": "sun",
      "icon": "award",
      "file": "",
      "verify": ""
    },
    {
      "title": "Autodesk Designathon 2026, Participant",
      "issuer": "Autodesk",
      "tone": "coral",
      "icon": "award",
      "file": "",
      "verify": ""
    },
    {
      "title": "SOLIDWORKS 2024 Essential Training",
      "issuer": "LinkedIn Learning",
      "tone": "green",
      "icon": "cube",
      "file": "",
      "verify": "https://www.linkedin.com/learning/certificates/02dd967cc0613a683c80a08ea44bbfa46d1d73ca0be389a0979e2d0e829e80e2"
    },
    {
      "title": "Premiere Pro Essential Training",
      "issuer": "LinkedIn Learning",
      "tone": "rose",
      "icon": "play",
      "file": "",
      "verify": "https://www.linkedin.com/learning/certificates/e274dcccc2f54a1828948722cabe58f6e0139d7b03f2031937cdca995df90a6d"
    }
  ],
  "courses": [
    {
      "id": "autocad",
      "name": "AutoCAD",
      "theme": "coral",
      "icon": "layout",
      "tagline": "2D drafting and technical drawings",
      "levels": "Beginner to intermediate",
      "topics": [
        "Interface, command aliases and drafting settings",
        "Drawing and editing tools with precision (object snaps, ortho, polar)",
        "Layers, linetypes and drawing organisation",
        "Dimensions, text and annotation styles",
        "Blocks and reusable details",
        "Layouts, viewports, scales and plotting to PDF",
        "Introduction to 3D modelling"
      ]
    },
    {
      "id": "solidworks",
      "name": "SolidWorks",
      "theme": "blue",
      "icon": "cube",
      "tagline": "3D parts, assemblies and drawings",
      "levels": "Beginner to advanced",
      "topics": [
        "Sketching with relations and dimensions",
        "Part modelling features and design intent",
        "Assemblies, mates and motion checks",
        "Manufacturing drawings with dimensions and BOMs",
        "Sheet metal parts and flat patterns",
        "Intro to simulation (FEA) studies",
        "CSWA exam preparation and practice"
      ]
    },
    {
      "id": "autodesk-inventor",
      "name": "Autodesk Inventor",
      "theme": "violet",
      "icon": "gear",
      "tagline": "Mechanical design for machines and products",
      "levels": "Beginner to advanced",
      "topics": [
        "Parametric sketches and part features",
        "Assemblies, constraints and joints",
        "Drawings, parts lists and annotation",
        "Sheet metal design",
        "Frame Generator for structures",
        "Exploded views and presentations",
        "Working with AutoCAD DWG files"
      ]
    },
    {
      "id": "fusion-360",
      "name": "Fusion 360",
      "theme": "teal",
      "icon": "hub",
      "tagline": "Design, render and make, all in one",
      "levels": "Beginner to intermediate",
      "topics": [
        "Sketching and solid modelling",
        "Components, joints and assemblies",
        "Rendering and product visuals",
        "Preparing parts for 3D printing",
        "Introduction to CAM and CNC toolpaths",
        "Introduction to simulation",
        "Cloud collaboration and sharing designs"
      ]
    }
  ],
  "recordings": [
    {
      "id": "MrBvUttpKN4",
      "title": "Webinar recording"
    }
  ],
  "training": {
    "intake": "",
    "price": 4500
  }
});
