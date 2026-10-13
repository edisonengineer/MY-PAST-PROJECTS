# Where to put your images

Upload images with **exactly** these names and they appear on the site
automatically. Until then, each project shows a designed colour cover.

Tip: export as JPG, about 2000–2400 px wide and under ~500 KB each.

| What | File path |
|---|---|
| Your photo (hero card) | `images/profile/edison.jpg` (square works best) |
| Sustainable Outdoor Hub (Designathon) | `images/engineering/designathon/designathon-hub-01.jpg`, `-02.jpg`, `-03.jpg` |
| Sheet Metal Fabrication, KIRDI | `images/engineering/kirdi/kirdi-sheet-metal-01.jpg`, `-02.jpg`, `-03.jpg` |
| Final-year project (Forming Limit Prediction) | `images/engineering/final-year-project/fyp-01.jpg`, `-02.jpg`, `-03.jpg` |
| EV Battery Pack Cooling | `images/engineering/ev-battery/ev-battery-cooling-01.jpg`, `-02.jpg`, `-03.jpg` |
| Mazingira Day Posters | `images/graphic/mazingira/mazingira-day-01.jpg`, `-02.jpg` |

The `-01` image is used as the project's cover.

## Reports

Put PDFs in `pdfs/` with these names and a **Read report** button appears
inside the project automatically:

- `pdfs/kirdi-sheet-metal-report.pdf`
- `pdfs/final-year-project-report.pdf`
- `pdfs/ev-battery-cooling-report.pdf`

To also list a PDF in the **Reports** section, add it to `PDF_WORKS`
at the top of `js/pdf-viewer.js`.

## Adding a new project

Open `js/projects.js`, copy one of the existing blocks, and change the
details. Use `category: 'engineering'` or `category: 'graphic'`.

---

# Other things you can add or change

## Your CV
The CV is at **`pdfs/edison-ochieng-cv.pdf`** (the web copy with your email
removed). To update it, upload a new file with the same name.

## 3D models ("View in 3D")
Create a folder called `models/` and upload `.glb` files:

- `models/designathon-hub.glb` (Sustainable Outdoor Hub)
- `models/ev-battery-cooling.glb` (EV Battery Pack Cooling)

A **View in 3D** button appears in that project's window once the file
exists. To add a model to another project, put `model: 'models/your-file.glb'`
in its block in `js/projects.js`.

How to get a `.glb`: Fusion 360 can export it directly. From SolidWorks or
Inventor, export STEP or STL and convert it with a free online converter.
Keep files under about 10 MB so they load quickly on phones.

## Prices
Open `js/packages.js` and type your price, e.g. `price: 'KES 3,500'`.
Leave it as `''` to show "Custom quote".

## Reviews
When a review arrives in your email, copy it into `js/reviews.js`
(an example is at the top of that file).

## Visitor analytics
1. Create a free account at https://www.goatcounter.com and pick a code
   (e.g. `edisonochieng`).
2. Put that code in `js/config.js` → `goatcounter: 'edisonochieng'`.
Your dashboard at `https://edisonochieng.goatcounter.com` then shows visits,
plus clicks on WhatsApp, email, CV downloads, briefs, reviews, webinar
sign-ups and cheat sheet downloads.

## French translation
Translations live in `js/i18n-fr.js`. The left side is the exact English text
on the page and the right side is the French. Anything new you add stays in
English until you add a line for it.
Share a French link directly with `?lang=fr`, e.g.
`https://edisonengineer.github.io/MY-PAST-PROJECTS/?lang=fr`

## Settings
`js/config.js` holds the Web3Forms key, WhatsApp number and analytics code.

## Cost estimator
Rates live in `js/rates.js` (starting price per unit, in KES). To show a
range instead of "From KES ...", fill in `max`. You can also add optional
complexity or express-deadline surcharges there (instructions at the top).

## Booking calendar
Set in `js/config.js` → `bookingUrl` (currently your Google booking link).
Short `calendar.app.google` links open in a new tab. To show the calendar
inside the site instead, open your booking page in Google Calendar, choose
Share → Website embed, copy the link inside `src="..."` (it ends in
`?gv=true`) and paste that as `bookingUrl`.

## Instagram feed
Create a free feed at https://behold.so, connect your Instagram, choose the
JSON format and paste the feed URL into `js/config.js` → `instagramFeedUrl`.
Until then the section shows a "Follow on Instagram" card.

## Quote cart
Works on its own: visitors add packages and estimates, then send one quote
request to your email (Web3Forms) or WhatsApp.
