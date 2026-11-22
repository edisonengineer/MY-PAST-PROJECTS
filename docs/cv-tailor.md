# CV tailor: a true CV, cover letter and email for every job

**Address:** `https://edisonengineer.github.io/MY-PAST-PROJECTS/cv-tailor/`, linked from the site footer ("Free CV tailor"), the account page and the site search.

**Who can use it:** anyone with a (free) Nexus CAD Studio account. A shared link always opens the log-in screen first; after logging in (a code by email, no password) the visitor comes straight back to the tool. The first time, and whenever the terms change, they must tick that they accept the [Terms and conditions](../cv-tailor/terms.html) and the [Privacy notice](../cv-tailor/privacy.html).

## ⚠️ One-time set-up: update the Google Sheet script

Saving CVs to accounts needs the new version of `tools/google-sheet-script.gs` (it adds the **CVs** tab):

1. Open your Google Sheet → **Extensions → Apps Script**. Select everything, paste the whole of `tools/google-sheet-script.gs`, save.
2. Choose **setup** in the function list and click **Run** (this creates the CVs tab).
3. **Deploy → Manage deployments → pencil icon → Version: New version → Deploy.** The link stays the same.

Until you do this, logged-in visitors can still use the tool, but their CV is only kept on their own device and the page says it couldn't reach their account.

## For clients (and you): My CV

Step **0 · My CV** holds the person's own CV:

- **Upload CV (PDF or Word):** the file is read *in the browser* (never uploaded). Word `.docx` and text PDFs work; old `.doc` files must be saved as `.docx` or PDF first, and scanned (picture) PDFs have no text to read, so paste the text instead.
- **Paste CV text:** for anything else.
- **Check / edit my CV:** the result is always shown in an editor (name and contact, profile, roles with one point per line, projects, education, skills, certificates with *what it is*: certification / course / award, languages, memberships). Reading CVs is guesswork, so people are asked to check it.
- Every change is saved on the device at once and **in their account** a few seconds later ("Saved in your account · date"). On another computer they log in and their CV is there.
- **Download backup / Restore a backup:** a `.json` file of their CV. **Delete my CV:** removes it from their account and the device.
- **Log out** removes everything the tool kept on that device (CV copy, saved jobs, drafts, prompt). Tell clients to log out on shared computers.

**Your own account** (`SITE_CONFIG.cvTailor.owner` in `js/config.js`) also gets a "CV to use" choice: *the website CV* (built from `content/cv.js`, your projects and certificates, as before) or *the CV saved in my account*.

**Where client CVs are kept:** the **CVs** tab of your Google Sheet: one row per account (email, last saved, terms version and date, size, and the CV as text over the "CV data" columns). Only the logged-in owner of a row can read or change it from the website; nobody can list CVs. If someone asks you to delete their data, delete their row there (and in *Accounts*). The weekly sheet backups keep copies for up to 8 weeks, as the privacy notice says.

**Terms and privacy:** the text is in `tools/build-pages.js` (`cvTermsPage`, `cvPrivacyPage`). If you change them in a way that matters, change `LEGAL_DATE` there and `TERMS_VERSION` in `js/cv-mycv.js`: everyone is asked to accept again. The texts were written for this tool and Kenya's Data Protection Act, 2019, but they are not legal advice: have them checked if you want certainty, and make sure what they promise stays true (e.g. deleting accounts within 30 days when asked).

## Daily use (steps 1–5)

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

### Cover letter and application email

The output area has three tabs: **Tailored CV**, **Cover Letter** and **Application Email**. All three use the same job description, the same ticked lines and the same master data. Add the **hiring manager / recipient** in step 1 if you know it. If it's empty, the letter and email say *Dear Hiring Team*.

- **Cover Letter** is a formal one-page letter: your headline and degree; your most relevant role, using its own bullets; your 2–3 most relevant projects (the ones you ticked first, and never the same work twice); only the skills the job asks for that your CV proves; real awards and certificates; and your portfolio link. Every fact is copied from your data. Tick *Show where each fact comes from* to see its source. The letter uses *Yours sincerely* with a named recipient and *Yours faithfully* with *Hiring Team*. Prep courses such as "CSWA Cert Prep" are never named in a letter: that's true, but easy to misread as the certification. **Copy Cover Letter** copies plain text, and **Print / save as PDF** prints just the letter.
- **Tone** comes from your prompt box in step 4. "warm", "friendly" or "enthusiastic" give a warmer letter and email. "concise", "short" or "brief" give a shorter letter (2 projects, 1 bullet, no degree line). Otherwise the tone is formal.
- **Application Email** gives 3 subject lines, each with its own **Copy** button; the one you select goes into the email-app link. A job reference in the advert (e.g. "Ref: MDE-2026-04") is added to the subject. The short body lists 2–3 lines of proof ("SolidWorks, Sheet metal and Fabrication: Sheet Metal Fabrication at KIRDI (2025)"), says your CV and cover letter are attached, and links your job portfolio and LinkedIn. **Copy Email** copies the body. **Open in my email app** opens it in your mail program, addressed to the email in the advert if it lists one (or whatever you type in *Send to*). Email links can't carry attachments, so attach the two PDFs yourself.
- **Copy full AI prompt** (step 4) now also contains the cover letter and email drafts, with instructions to improve them under the same rules: no new facts, and nothing about the company that isn't in the advert.

The job-portfolio link comes from `portfolio:` in `content/cv.js`.

**Save job** keeps the job and your choices in this browser (up to 25). **Clear / new job** starts fresh. Saved jobs and your prompt are kept.

## Your website CV (Edison's "master CV")

When you choose *the website CV*, the tailor never has its own copy of your CV. `node tools/build-pages.js` (run automatically by GitHub after every edit and every sheet sync) builds `js/cv-master.js` from:

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
- **Fonts on the printed CV and letter:** fixed-weight copies of the site fonts in `fonts/print/` (made by `tools/build-print-fonts.py`). The site's own fonts are variable fonts, which Chrome puts into a PDF as "Type 3" drawings: thin letters (l, I, i, 1, .) then look unevenly dark in many PDF viewers, and CV-reading software (ATS) reads them less reliably. With the static copies the PDF has real TrueType fonts. Keep the sheet's weights to 400, 600 and 700 (the ones that exist).
- **Look of the printed CV:** `.cvt-paper` / `.cvp-*` in `css/cv-tailor.css`. After changing a file, raise its `?v=` number in `tools/build-pages.js` (`cvTailorPage`) and run the build, so browsers and the offline app fetch the new copy.

## Checks

- `node tools/test-cv-tailor.js` runs 186 checks, including clients' CVs: pasted text, Word and PDF layouts are sorted into the right places, untrusted data is cleaned, and a client's CV, letter and email contain only their own facts.
- `node tools/test-cv-sheet.js` runs the real Google Sheet script against stand-ins for Google's services: nothing is stored before the terms are accepted, a CV comes back exactly as saved (also when split over cells), other accounts and wrong tokens are refused, delete removes the row.
- Earlier checks in `test-cv-tailor.js`: It confirms that hidden items never reach the master CV and that every tailored line is a master line, word for word, across 6 sample job adverts × every focus × both lengths. It also checks that prep courses never count as certifications, that the fact checker catches invented numbers, employers and tools, and that old saved choices don't break anything. For 90 combinations of job, focus and tone, it checks that every letter and email fact has a real source, that only proven skills are named, that nothing fails the fact check, and that "Hiring Team" is the default. GitHub runs both after every rebuild and sheet sync.
- `node tools/check-site.js` checks `cv-tailor/` (now in the sitemap), its terms and privacy pages, and `js/cv-master.js`.

Translations: the page's buttons and labels go to `js/i18n-wanted.json`, and the Google Sheet's hourly translation job fills in French and Kiswahili like the rest of the site. The CV sheet itself stays in English, like the online CV.
