# CV tailor: a true CV for each job

**Address:** `https://edisonengineer.github.io/MY-PAST-PROJECTS/cv-tailor/` (bookmark it).
The page isn't linked anywhere on the site, is hidden from search engines (`noindex` + `robots.txt`) and works offline once opened.
Nothing you paste leaves your browser.

## Daily use

1. **The job.** Paste the whole job advert. Optionally add the job title, company, a focus area (Mechanical CAD, FEA / Simulation, Sheet metal / DFM, Engineering + web / automation, Graphic design) and the length (1 or 2 pages).
2. **What the job asks for.** Every tool, method, standard and soft skill found in the advert, marked as *required*, *mentioned* or *nice to have*, and coloured:
   - **green**: you have it. Hover to see where it was found (which job, project or skill).
   - **amber**: course only. For example "CSWA Cert Prep" is a training course, *not* the CSWA certification. Don't claim it.
   - **red, dashed**: not in your CV. The tailored CV will never claim it.
   The page also points out things to check yourself, such as "3+ years of experience" or "MSc".
3. **Choose what goes in.** The most relevant lines are ticked and sorted for you. Untick lines, tick others, or use ↑ ↓ to reorder. **Fit to length** unticks the least relevant lines until the CV fits 1 or 2 pages. The page counter turns red if the CV is too long.
4. **Print / save as PDF.** In the print window choose *Save as PDF*, paper A4, margins *Default*, and turn off headers and footers. The file name is pre-filled with the company and role.
5. **Hand off to an AI assistant (optional).** Write your tone, length and emphasis rules in the prompt box, or pick a preset. **Copy prompt** copies strict anti-invention rules, your instructions, the job description and your selected CV lines (with source ids). Markdown and JSON copies or downloads are there too.
6. **Check text from an AI assistant.** Paste what it wrote. The checker lists numbers, tools, certifications, names and source ids that aren't in your data, such as "12 engineers" when your data only has "12 weeks". Remove those, or add them to your master CV first if they are true.

**Save job** keeps the job and your choices in this browser (up to 25). **Clear / new job** starts fresh. Saved jobs and your prompt are kept.

## Where the facts come from (the "master CV")

The tailor never has its own copy of your CV. `node tools/build-pages.js` (run automatically by GitHub after every edit and every sheet sync) builds `js/cv-master.js` from:

| What | Edit it in |
|---|---|
| Name, title, profile summary, experience bullets, education, skills, languages, memberships | `content/cv.js` |
| Projects | `js/projects.js` (by hand) or the Google Sheet *Works* tab |
| Certificates | the Google Sheet *Certificates* tab (or `js/certificates.js` if the sheet has none) |

Never edit `js/cv-master.js`: it is overwritten on every build.

**Rules for the master data**

- Only write what is true and checkable: tailored CVs reuse these exact words, and the tailor can't reword them.
- **Hiding something from job CVs:** set `portfolio: false` on a project in `js/projects.js`, or set *Job portfolio* to *No* in the sheet (Works or Certificates tab). Hidden items are left out of `js/cv-master.js` completely (only their count is kept), so they can't appear in the tailor, its prompt or its JSON.
- **CV project blurbs** in `content/cv.js` (`projects:`) can carry `id: '<project id>'`. The blurb then becomes that project's summary instead of a second copy of the project.
- **Certificate titles decide how a certificate counts.** Titles with *Prep*, *Preparation*, *Training* or *Course* are treated as training courses, and *Designathon*, *Mention* or *Participant* as awards. Everything else is treated as a certification. When you pass the real CSWA exam, add it as its own certificate (e.g. "Certified SOLIDWORKS Associate (CSWA)", issuer "Dassault Systèmes") and it will match "CSWA required".
- **Want credit for something?** Add it to the master data first. For example, web and automation work (this website's Node.js build scripts, GitHub Actions and Google Apps Script) isn't in `content/cv.js` yet, so the tailor shows those skills as gaps. If you want them to count, add a project or bullet that describes what you really did.

After editing locally: `node tools/build-pages.js && node tools/test-cv-tailor.js`.

## Changing the tailor

- **Keywords:** `TERMS` at the top of `js/cv-tailor-core.js`, with one line per term: `[id, label, group, pattern]`. Add the id to a `FOCUS` list to make it count extra for that focus area.
- **Prompt presets and the hard rules:** `PRESETS` and `RULES` in the same file. The rules are always added to the prompt and can't be switched off on the page.
- **Default lengths:** `LIMITS` (how many bullets, projects, skills and certificates are ticked for 1 and 2 pages).
- **Look of the printed CV:** `.cvt-paper` / `.cvp-*` in `css/cv-tailor.css`. After changing a file, raise its `?v=` number in `tools/build-pages.js` (`cvTailorPage`) and run the build, so browsers and the offline app fetch the new copy.

## Checks

- `node tools/test-cv-tailor.js` runs 85 checks. It confirms that hidden items never reach the master CV and that every tailored line is a master line, word for word, across 6 sample job adverts × every focus × both lengths. It also checks that prep courses never count as certifications, that the fact checker catches invented numbers, employers and tools, and that old saved choices don't break anything. GitHub runs it after every rebuild and sheet sync.
- `node tools/check-site.js` also loads `cv-tailor/` and `js/cv-master.js`.

Translations: the page's buttons and labels go to `js/i18n-wanted.json`, and the Google Sheet's hourly translation job fills in French and Kiswahili like the rest of the site. The CV sheet itself stays in English, like the online CV.
