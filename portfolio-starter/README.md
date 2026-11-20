# Job-application portfolio

A clean, portfolio-only site for job applications: projects, experience,
education, skills, certificates and a CV download. It has no prices, services,
training, webinars, shop, reviews or blog.

**You never edit content here.** This repo reads the files your main site
(`edisonengineer/MY-PAST-PROJECTS`) already keeps up to date from the Google
Sheet. Change the sheet once and both sites update.

```
Google Sheet ──(every 30 min)──▶ MY-PAST-PROJECTS ──(hourly)──▶ this repo ──▶ portfolio site
                                  (full site)                    (filters + rebuilds)
```

## What decides what shows up

| Content | Where you edit it | How to hide it from this portfolio |
|---|---|---|
| Projects added in the sheet | Sheet → **Works** tab | Column **K "Job portfolio"** = `No` |
| Hand-written projects | `js/projects.js` in the main repo | Add `portfolio: false` to the project |
| Certificates | Sheet → **Certificates** tab | Column **F "Job portfolio"** = `No` |
| Experience, education, skills | `content/cv.js` in the main repo | (always shown) |
| CV PDF | `pdfs/edison-ochieng-cv.pdf` in the main repo | (always shown) |
| Order, categories, headline, contact | `portfolio.config.json` here | `excludeProjects`, `categories`, … |

The sheet's **Articles, Pricing, Courses, Recordings, FAQ, Settings** tabs feed
the main site only, so this portfolio ignores them.

## portfolio.config.json

- `headline`: the line under your name (e.g. "Mechanical Design Engineer").
- `intro`: leave empty to use the summary from `content/cv.js`, or write a
  version for job applications.
- `categories`: `["engineering"]` hides all graphic design work.
- `excludeProjects`: project ids to hide, e.g. `["evening-sermon"]`.
- `projectOrder`: the ids to show first, in order.
- `contact.email`: add the email address you want recruiters to use (it is
  empty by default because the main site keeps your email hidden).
- `linkToMainSite`: `true` adds a small footer link to the freelance site.

## Build it on your computer (optional)

```bash
bash tools/pull-content.sh
```

```bash
node tools/build.js
```

Then open `site/index.html`. Or build from a local copy of the main repo:
`SOURCE=../MY-PAST-PROJECTS node tools/build.js`.

## Updates

`.github/workflows/build.yml` rebuilds and publishes the site every hour, when
you push to this repo, and when you run **Actions → Build portfolio → Run
workflow**. The output (`site/`) goes straight to GitHub Pages and is never
committed, so this repo stays small.
