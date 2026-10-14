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

Every project also has its own page (`projects/<id>.html`) for sharing on
LinkedIn or WhatsApp. After adding or editing a project, rebuild the pages
(needs Node.js):

    node tools/build-pages.js

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
After changing prices, rebuild the downloadable rate card
(`pdfs/nexus-cad-studio-rate-card.pdf`):

    node tools/build-rate-card.js

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

## French and Kiswahili translations
Translations live in `js/i18n-fr.js` and `js/i18n-sw.js`. The left side is
the exact English text on the page and the right side is the translation.
Anything new you add stays in English until you add a line for it.
Share a link in a language directly with `?lang=fr` or `?lang=sw`, e.g.
`https://edisonengineer.github.io/MY-PAST-PROJECTS/?lang=sw`

## CAD Tips blog
Articles live in `content/blog/`, one `.html` file each. Copy an existing
one, change the details block at the top (title, description, date, tags,
colour `theme` and `icon`), and write the article below it using `<p>`,
`<h2>` and `<ul><li>`. Then run `node tools/build-pages.js`. It creates the
page in `blog/`, updates the CAD Tips list, the 3 latest cards on the
homepage and `sitemap.xml`. Articles are shown in English in every language.

## Payments (M-Pesa / card)
In `js/config.js` → `payments`, fill in your Till number (`mpesaTill`) or
Paybill (`mpesaPaybill` + `mpesaAccount`), and optionally a Paystack payment
page link (`paystackUrl`). The "Make a payment" link and window appear only
once one of these is set.

## Webinar countdown and recordings
In `js/config.js` → `webinar`, set `day` (e.g. `'Saturday'`) and `time` in
Nairobi time (e.g. `'18:00'`) to show a live countdown. To list past
sessions, add YouTube videos to `recordings`:
`{ id: 'dQw4w9WgXcQ', title: 'AutoCAD basics' }` (the id is the part after
`v=` in the YouTube link).

## Certificates
Save a photo or scan of each certificate in `images/certificates/` with the
file name listed in `js/certificates.js` (e.g. `cswa.jpg`). The "View
certificate" button appears automatically. Add a `verify` link if the
issuer gives you one.

## CAD training page
Courses, topics, formats, FAQ and the next intake date are in
`content/courses.js`. Set `nextIntake` (e.g. `'Saturday classes from
7 November 2026'`) to replace "Dates on request". Seat requests arrive by
email through Web3Forms. Run `node tools/build-pages.js` after editing.

## KES / USD prices
All prices are written in KES. Visitors can switch to approximate US
dollars; set the exchange rate in `js/config.js` → `currency.usdRate`
(KES per 1 USD). Visitors outside Africa see USD first. Quote requests
always reach you in KES. Set `allowUsd: false` to hide the switch.

## Quote PDF
In the quote cart, "Download quote (PDF)" opens a printable quote with a
reference number, 14-day validity and your M-Pesa Till. Visitors choose
"Save as PDF" in the print window.

## Availability badge
At the top of the homepage. In `js/config.js` → `availability` set
`status` to `'available'` (green), `'limited'` (amber) or `'booked'` (red).
For `'booked'`, add `from: 'November'` to show "Fully booked. New projects
from November". Use `text` for your own message.

## Newsletter
"Get new CAD tips by email" forms are on the homepage CAD Tips section,
the blog and the training page. Each sign-up arrives in your inbox through
Web3Forms (subject "New CAD Tips subscriber"). Keep the addresses in a
list, and send tips as a BCC email, or import them into a free tool like
Mailchimp or Brevo when the list grows.

## Client project tracker (/track/)
Clients enter the reference you give them and see their project's stage,
progress, due date, your latest note, what's due and a download link.
1. Copy `content/tracker.example.js` to `content/tracker.private.js`.
   This copy stays on your computer and is never uploaded.
2. Add a block per project (the example explains every field). Give each
   project a hard-to-guess reference such as `NCS-2026-014-KQ`.
3. Run `node tools/build-tracker.js` and upload the new
   `js/tracker-data.js`. Projects are locked (encrypted) with their own
   reference, so nobody can read or list them without it.
The demo reference `DEMO-2026` shows visitors how it works. Remove that
block from your private file when you no longer want the demo.

## Online CV and portfolio PDF
- `cv/` is your online CV (with a print layout). Its content is in
  `content/cv.js`; certificates come from `js/certificates.js`.
- `pdfs/edison-ochieng-portfolio.pdf` is built from your CV, projects,
  certificates and prices. Project photos are added automatically once
  uploaded. Rebuild after changes:

      node tools/build-pages.js
      node tools/build-portfolio.js

## Asking clients for reviews
Open `request-review/` on your site (bookmark it; it isn't linked anywhere
or shown on Google). Type the client's name and project, then press
"Send on WhatsApp". The client's link opens your review form already
filled in with their name and project. Reviews arrive in your email;
copy the good ones into `js/reviews.js`.

## Google: Search Console and Business Profile
1. Search Console (shows your site in Google search):
   - Go to https://search.google.com/search-console and add a
     "URL prefix" property: `https://edisonengineer.github.io/MY-PAST-PROJECTS/`
   - Choose the "HTML tag" method, copy the `<meta name="google-site-verification" ...>`
     tag, and paste it into `index.html` on the line under the
     "Google Search Console" comment. Upload, wait a few minutes, press Verify.
   - Then open Sitemaps and submit `sitemap.xml`.
2. Google Business Profile (shows Nexus CAD Studio on Google Maps):
   - Go to https://business.google.com, create "Nexus CAD Studio",
     category "Engineering consultant" (add "Graphic designer" and
     "Computer training school" as extra categories).
   - Choose "I deliver goods and services to customers" with Nairobi as the
     service area if you don't want to show a street address.
   - Add phone +254 708 639 473, your website link and opening hours,
     then complete Google's verification (usually a video or postcard).
   - Ask happy clients to leave Google reviews there too.

## Site search
The magnifier in the header (or `/` / Ctrl+K) searches projects, articles,
services, FAQ and page sections. Its list is rebuilt by
`node tools/build-pages.js`, so run that after adding projects, articles,
packages or FAQ questions.

## Installable app
The site can be installed on phones and computers ("Install the app" in the
footer, or "Add to Home screen") and works offline. If you change a lot of
files, bump `VERSION` at the top of `sw.js` so visitors get the update.

## Settings
`js/config.js` holds the Web3Forms key, WhatsApp number and analytics code.

## Cost estimator
Rates live in `js/rates.js` (starting price per unit, in KES). To show a
range instead of "From KES ...", fill in `max`. You can also add optional
complexity or express-deadline surcharges there (instructions at the top).

## Booking calendar
Set in `js/config.js` → `bookingUrl` (currently your Google booking page's
embed link, which shows the calendar inside the site).
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
