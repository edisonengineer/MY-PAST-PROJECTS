/* Generated from the Google Sheet (Pricing, Certificates, Courses, Recordings, FAQ and Settings tabs)
   by tools/sync-from-sheet.js: edit the sheet, not this file. A list missing here keeps the website's built-in one. */
(function (d) {
    if (d.packages) window.PACKAGES = d.packages;
    if (d.certificates) window.CERTIFICATES = d.certificates;
    if (d.faq) window.SITE_FAQ = d.faq;
    if (d.downloads) window.SITE_DOWNLOADS = d.downloads;
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
  "faq": [
    {
      "q": "What services do you offer?",
      "a": "Two kinds of work through Nexus CAD Studio. **Engineering design:** 3D CAD modelling, 2D manufacturing drawings, FEA/CFD simulation, sheet metal and fabrication design, product renders and CAD training. **Graphic design:** posters, branding, certificates, social media graphics, print layouts and motion graphics."
    },
    {
      "q": "Which software do you work with?",
      "a": "For engineering: SolidWorks (including CSWA exam preparation), Autodesk Inventor, AutoCAD, Fusion 360, Revit and Abaqus. For graphics: Adobe Illustrator, Photoshop, InDesign and Premiere Pro. If you need files in a specific program, just tell me in the project brief."
    },
    {
      "q": "How do I start a project?",
      "a": "Fill in the [project brief](#brief) above. It takes about two minutes and covers everything I need to understand your project. You can also message me directly on WhatsApp."
    },
    {
      "q": "How much will my project cost?",
      "a": "Pricing depends on complexity, the files you need and how soon you need them. Once I have your brief, I'll send a clear quote before any work starts, so there are no surprises."
    },
    {
      "q": "How long does a project take?",
      "a": "It depends on the scope. A single poster is much quicker than a full assembly with simulation. We agree on a timeline together when I send your quote, and I'll keep you updated along the way."
    },
    {
      "q": "Can you work from my sketches, photos or existing files?",
      "a": "Yes. Hand sketches with dimensions, photos, physical samples or existing CAD files are all great starting points. The more detail you share, the faster and more accurate the result."
    },
    {
      "q": "What files will I receive?",
      "a": "Whatever suits your project. For engineering: native CAD files, STEP/IGES, STL for 3D printing, DWG/DXF and PDF drawings. For graphics: print-ready PDFs and high-resolution PNG/JPG, with source files available on request."
    },
    {
      "q": "Do you include revisions?",
      "a": "Yes. Revisions are agreed as part of your quote, so we can refine the design until it's right for you."
    },
    {
      "q": "How do I pay?",
      "a": "Once you accept your quote, you pay the deposit shown on it to confirm your project, by M-Pesa to Buy Goods Till **8438334** (EDISON OCHIENG). Tap [Pay a deposit](#open:pay-modal) for the till number and QR code. International clients can pay by card or bank transfer: just ask me on WhatsApp."
    },
    {
      "q": "Can I see your work in 3D before I hire you?",
      "a": "Yes. Projects with a 3D badge have interactive models you can rotate and zoom in your browser (use the [3D models](#work) filter in my work). On a phone, tap **View in your room** to place the model in your own space at its real size."
    },
    {
      "q": "Do you offer CAD training?",
      "a": "Yes. I teach AutoCAD, SolidWorks (including CSWA exam preparation), Inventor and Fusion 360, one-on-one, in small groups or for company teams, online or in person in Nairobi. See the [training page](training/index.html) to reserve a seat."
    },
    {
      "q": "Do you work with clients outside Nairobi?",
      "a": "Yes. I work with clients remotely: briefs, files and reviews are shared online, and training can be delivered online or in person in Nairobi."
    },
    {
      "q": "How do I join the free AutoCAD webinar?",
      "a": "Tap [Reserve a seat](#open:webinar-modal), fill in the short form, and I'll send you the details for the next weekly session."
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
