# Where to put your images

Upload images with **exactly** these names and they appear on the site
automatically. Until then, each project shows a designed colour cover.

Tip: export as JPG, about 2000–2400 px wide and under ~500 KB each.

| What | File path |
|---|---|
| Your photo (hero card) | `images/profile/edison.jpg` (square works best) |
| Sustainable Outdoor Hub (Designathon) | `images/engineering/designathon/designathon-hub-01.jpg`, `-02.jpg`, `-03.jpg` |
| Sheet Metal Fabrication, KIRDI | `images/engineering/kirdi/kirdi-sheet-metal-01.jpg`, `-02.jpg`, `-03.jpg` |
| Structural FEA in Abaqus | `images/engineering/abaqus/abaqus-fea-01.jpg`, `-02.jpg`, `-03.jpg` |
| EV Battery Pack Cooling | `images/engineering/ev-battery/ev-battery-cooling-01.jpg`, `-02.jpg`, `-03.jpg` |
| Mazingira Day Posters | `images/graphic/mazingira/mazingira-day-01.jpg`, `-02.jpg` |

The `-01` image is used as the project's cover.

## Reports

Put PDFs in `pdfs/` with these names and a **Read report** button appears
inside the project automatically:

- `pdfs/kirdi-sheet-metal-report.pdf`
- `pdfs/abaqus-fea-report.pdf`
- `pdfs/ev-battery-cooling-report.pdf`

To also list a PDF in the **Reports** section, add it to `PDF_WORKS`
at the top of `js/pdf-viewer.js`.

## Adding a new project

Open `js/projects.js`, copy one of the existing blocks, and change the
details. Use `category: 'engineering'` or `category: 'graphic'`.
