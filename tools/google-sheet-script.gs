/* =========================================================================
   Website "database" in your Google Drive (free): instant reviews and the
   client project tracker. One sheet, one script, one link.

   REVIEWS tab: visitors' reviews are saved here and appear on the website
   straight away. To remove one, type  hide  in its "Status" cell.

   PROJECTS tab: your client projects. Change a project's Stage, Progress
   or Note here and the client sees it at /track/ within a minute when they
   enter their reference. Only someone who types the exact reference can
   see a project; nobody can list them. If you fill in "Client email", the
   client automatically gets an email each time you change the Stage.

   SUBMISSIONS tab: project briefs sent from the website, each with an
   automatic reference the client can track straight away. Change its
   Status (New → Reviewing → Quote sent → Accepted / Declined) and the
   client is emailed. "Accepted" moves it into the Projects tab for you.

   SETTINGS tab: control the website without code: availability badge,
   webinar day and time, and an announcement shown at the top of the site.

   ARTICLES tab: write an article in a Google Doc, paste its link here and
   set Status to "Published". Within about 30 minutes it appears on the
   website's CAD Tips blog as a full page (headings, lists, bold, links and
   photos from the Doc). Set it back to "Draft" to take it down.

   WORKS tab: add a new project (title, summary, highlights and photos from
   Google Drive) and set Status to "Published". It appears in "My work"
   with its own page within about 30 minutes.

   PRICING, CERTIFICATES, COURSES and RECORDINGS tabs: the website's
   packages and prices, certificates, training courses and webinar videos.
   They start filled with what the website shows today. Edit, add or
   remove rows (or set "Show on website" to No); the website follows
   within about 30 minutes, including the rate card and portfolio PDFs.
   The training intake date and starting price are in the Settings tab.

   INVOICES tab: quotes, invoices and receipts. Type the project reference
   (client name and email fill in), list the items, then set Action to
   "Send": a branded PDF is saved in your Google Drive ("Nexus CAD Studio
   invoices") and emailed to the client. A receipt marks the project's
   deposit as paid and updates its balance, and carries a PAID (or PART PAID)
   stamp. Unpaid invoices get a polite reminder email after 7 and 14 days
   (type Off in the reminders column to stop them for one invoice).

   TRAINEES tab: seat reservations from the training page land here, and
   each course's seats are counted (set "Next class" and "Seats" in the
   Courses tab; a full class shows "Fully booked" on the website). Set
   Status to "Confirmed" to draft their invoice, and to "Completed" to
   email them a certificate with a code anyone can check at /verify/.

   CLIENT APPROVALS: when a project is at "Review & revisions", the client
   can approve it or request changes on their tracking page. You get an
   email, and the Projects tab shows their decision and comments.

   SUBSCRIBERS tab: people who signed up for CAD tips by email. When an
   article goes live, it is emailed to them automatically (each email has
   an unsubscribe link).

   Every Monday morning you get a summary email: new briefs, active
   projects and due dates, balances, reviews and subscribers.
   Menu "Website" (top of the sheet) sends the summary or newsletter now.

   FIRST-TIME SET-UP (about 5 minutes)
   1. Go to sheets.google.com and create a blank sheet named "Website reviews".
   2. Menu: Extensions → Apps Script. Delete what's there and paste this
      whole file. Click the save icon.
   3. Click Deploy → New deployment → gear icon → Web app.
        Execute as:  Me          Who has access:  Anyone
      Click Deploy, allow the permissions, and copy the "Web app URL".

   UPDATING THIS SCRIPT LATER (the link stays the same)
   1. Extensions → Apps Script, select everything, paste the new version, save.
   2. Choose  setup  in the function list at the top and click Run. This
      creates any missing tabs and turns on the automatic client emails
      (allow the permissions Google asks for).
   3. Deploy → Manage deployments → pencil icon → Version: New version → Deploy.
   ========================================================================= */

const SHEET = 'Reviews';
const HEAD = ['Date', 'Name', 'Role / organisation', 'Service', 'Rating', 'Review', 'Project', 'Status'];
const MAX_PER_HOUR = 20;   // simple flood protection

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange('A1:H1').setFontWeight('bold');
  }
  return sh;
}

const clean_ = (v, max) => String(v || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.botcheck) return out_({ ok: true });                       // bots fill the hidden box
  if (p.action === 'brief') return out_(brief_(p));
  if (p.action === 'subscribe') return out_(subscribe_(p));
  if (p.action === 'reserve') return out_(reserve_(p));
  if (p.action === 'feedback') return out_(feedback_(p));
  const name = clean_(p.name, 80);
  const text = clean_(p.text, 1500);
  const rating = Math.round(Number(p.rating));
  if (!name || text.length < 10 || !(rating >= 1 && rating <= 5)) return out_({ ok: false, error: 'invalid' });

  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('count') || 0);
  if (count >= MAX_PER_HOUR) return out_({ ok: false, error: 'busy' });
  cache.put('count', String(count + 1), 3600);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const last = sh.getLastRow();
    if (last > 1 && sh.getRange(last, 6).getValue() === text) return out_({ ok: true });   // double click
    sh.appendRow([new Date(), name, clean_(p.role, 120), clean_(p.service, 60), rating, text, clean_(p.project, 120), 'live']);
  } finally {
    lock.releaseLock();
  }
  return out_({ ok: true });
}

/* ---------- Client project tracker ---------- */
const PROJECTS = 'Projects';
const STAGES = ['Brief received', 'Quote sent', 'Deposit received', 'Design in progress', 'Review & revisions', 'Delivered'];
const PHEAD = ['Reference', 'Project', 'Client', 'Stage', 'Progress %', 'Due date', 'Note to client', 'Deposit', 'Balance due (KES)', 'Files link', 'Last updated', 'Client email', 'Client approval (automatic)', 'Client feedback (automatic)'];
const SITE_URL = 'https://edisonengineer.github.io/MY-PAST-PROJECTS/';
const WHATSAPP = '254708639473';
const SENDER = 'Edison Ochieng · Nexus CAD Studio';

function projects_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PROJECTS);
  if (sh) return sh;
  sh = ss.insertSheet(PROJECTS);
  sh.appendRow(PHEAD);
  sh.appendRow(['DEMO-SHEET-01', 'Example: bracket drawings', 'Example client', 'Design in progress', 60, new Date(Date.now() + 14 * 864e5), 'This row is an example. Replace it with a real project.', 'Paid', 2500, '', new Date(), '']);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, PHEAD.length).setFontWeight('bold');
  sh.getRange('D2:D1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STAGES, true).build());
  sh.getRange('H2:H1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Paid', 'Due'], true).setAllowInvalid(true).build());
  sh.getRange('E2:E1000').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 100).setAllowInvalid(false).build());
  sh.getRange('F2:F1000').setNumberFormat('d mmm yyyy');
  sh.getRange('K2:K1000').setNumberFormat('d mmm yyyy');
  sh.setColumnWidth(7, 360);
  return sh;
}

/* ---------- Project briefs submitted on the website ---------- */
const SUBS = 'Submissions';
const SUB_STATUS = ['New', 'Reviewing', 'Quote sent', 'Accepted', 'Declined'];
const SHEAD = ['Reference', 'Received', 'Status', 'Name', 'Email', 'Phone / WhatsApp', 'Service', 'Project', 'Budget', 'Deadline', 'Brief details', 'Note to client', 'Moved to Projects'];

function subs_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SUBS);
  if (sh) return sh;
  sh = ss.insertSheet(SUBS);
  sh.appendRow(SHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, SHEAD.length).setFontWeight('bold');
  sh.getRange('C2:C2000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(SUB_STATUS, true).build());
  sh.getRange('B2:B2000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.setColumnWidth(11, 420);
  sh.setColumnWidth(12, 320);
  return sh;
}

const cleanLong_ = (v, max) => String(v || '').replace(/[\u0000-\u0008\u000b-\u001f<>]/g, ' ').trim().slice(0, max);

function brief_(p) {
  const ref = clean_(p.ref, 24).toUpperCase();
  const name = clean_(p.name, 80);
  const email = clean_(p.email, 120);
  if (!/^[A-Z0-9-]{8,24}$/.test(ref) || !name) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('brief-count') || 0);
  if (count >= 30) return { ok: false, error: 'busy' };
  cache.put('brief-count', String(count + 1), 3600);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = subs_();
    const refs = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map((r) => normRef_(r[0])) : [];
    if (refs.indexOf(normRef_(ref)) > -1) return { ok: true, ref: ref };          // sent twice
    sh.appendRow([ref, new Date(), 'New', name, email, clean_(p.phone, 40), clean_(p.service, 60), clean_(p.project, 160),
      clean_(p.budget, 80), clean_(p.deadline, 80), cleanLong_(p.details, 5000), '', '']);
  } finally {
    lock.releaseLock();
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    try {
      mail_(email, 'We received your project brief (' + ref + ')', name,
        'Thank you for your project brief' + (p.project ? ' for <b>' + html_(clean_(p.project, 160)) + '</b>' : '') + '. I will review it and get back to you with a quote and timeline as soon as possible.',
        'Brief received', 0, '', ref);
    } catch (err) { /* email quota reached: the brief is still saved */ }
  }
  return { ok: true, ref: ref };
}

/* ---------- Articles and Works written in the sheet (published by the website's GitHub automation) ---------- */
const ARTICLES = 'Articles';
const AHEAD = ['Title', 'Status', 'Date', 'Google Doc link', 'Summary (1–2 sentences)', 'Cover photo (Google Drive link)', 'Tags (comma separated)', 'Web address (automatic)', 'Email to subscribers?', 'Emailed (automatic)'];
const WORKS = 'Works';
const WHEAD = ['Title', 'Status', 'Category', 'Subtitle', 'Year', 'Summary', 'Highlights (one per line)', 'Software / tags (comma separated)', 'Photos (Drive folder link, or Drive photo links one per line)', 'Web address (automatic)'];

function contentTab_(name, head, widths, example) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  sh.appendRow(head);
  if (example) sh.appendRow(example);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setWrap(true);
  sh.getRange('B2:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Draft', 'Published'], true).build());
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, 1, 999, head.length).setVerticalAlignment('top').setWrap(true);
  return sh;
}
const articles_ = () => contentTab_(ARTICLES, AHEAD, [260, 100, 110, 280, 320, 260, 200, 220, 120, 220],
  ['Example: How I choose materials for a prototype', 'Draft', new Date(), 'Paste a Google Doc link here', 'One or two sentences shown on the blog card and in Google results.', '', 'Product design, Materials', '', 'Yes', '']);
const works_ = () => {
  const sh = contentTab_(WORKS, WHEAD, [240, 100, 150, 240, 70, 320, 340, 220, 320, 220],
    ['Example: Solar water pump housing', 'Draft', 'Engineering', 'Client project · 2027', '2027', 'One or two sentences about the project.', 'First highlight\nSecond highlight', 'SolidWorks, Sheet metal', 'Paste a Google Drive folder link with the photos', '']);
  sh.getRange('C2:C1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Engineering', 'Graphic Design'], true).build());
  return sh;
};

const slug_ = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '') || 'post';
const driveId_ = (link) => { const m = /(?:\/d\/|\/folders\/|[?&]id=)([\w-]{20,})/.exec(String(link || '')); return m ? m[1] : ''; };
const published_ = (r) => String(r[1]).trim().toLowerCase() === 'published' && String(r[0]).trim();

// Fills the automatic "Web address" once, so it never changes even if you edit the title
function ensureSlugs_(sh, col) {
  const rows = sh.getDataRange().getValues();
  const taken = {};
  rows.slice(1).forEach((r) => { if (r[col]) taken[r[col]] = 1; });
  rows.slice(1).forEach((r, i) => {
    if (!published_(r) || r[col]) return;
    let s = slug_(r[0]), n = 2;
    while (taken[s]) s = slug_(r[0]) + '-' + n++;
    taken[s] = 1;
    sh.getRange(i + 2, col + 1).setValue(s);
    r[col] = s;
  });
  return rows.slice(1);
}

// Google Doc → simple, safe HTML. Photos become {{IMG:n}} placeholders the automation downloads.
function docHtml_(docId) {
  const body = DocumentApp.openById(docId).getBody();
  const out = [];
  let list = null, img = 0;
  const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
  function inline(el) {
    let h = '';
    for (let i = 0; i < el.getNumChildren(); i++) {
      const c = el.getChild(i), type = c.getType();
      if (type === DocumentApp.ElementType.TEXT) {
        const t = c.asText(), str = t.getText(), idx = t.getTextAttributeIndices();
        for (let k = 0; k < idx.length; k++) {
          const a = idx[k], b = k + 1 < idx.length ? idx[k + 1] : str.length;
          let piece = html_(str.slice(a, b)).replace(/\r|\n/g, '<br>');
          if (!piece) continue;
          if (t.isBold(a)) piece = '<strong>' + piece + '</strong>';
          if (t.isItalic(a)) piece = '<em>' + piece + '</em>';
          const url = t.getLinkUrl(a);
          if (url && /^(https?:|mailto:)/i.test(url)) piece = '<a href="' + html_(url) + '" target="_blank" rel="noopener">' + piece + '</a>';
          h += piece;
        }
      } else if (type === DocumentApp.ElementType.INLINE_IMAGE) {
        h += '{{IMG:' + (img++) + '}}';
      }
    }
    return h.trim();
  }
  for (let i = 0; i < body.getNumChildren(); i++) {
    const el = body.getChild(i), type = el.getType();
    if (type === DocumentApp.ElementType.LIST_ITEM) {
      const li = el.asListItem();
      const g = li.getGlyphType();
      const tag = g === DocumentApp.GlyphType.NUMBER || g === DocumentApp.GlyphType.LATIN_LOWER || g === DocumentApp.GlyphType.LATIN_UPPER ||
        g === DocumentApp.GlyphType.ROMAN_LOWER || g === DocumentApp.GlyphType.ROMAN_UPPER ? 'ol' : 'ul';
      if (list !== tag) { closeList(); out.push('<' + tag + '>'); list = tag; }
      const t = inline(li);
      if (t) out.push('<li>' + t + '</li>');
      continue;
    }
    closeList();
    if (type !== DocumentApp.ElementType.PARAGRAPH) continue;
    const para = el.asParagraph(), t = inline(para);
    if (!t) continue;
    const hd = para.getHeading(), H = DocumentApp.ParagraphHeading;
    if (/^(\{\{IMG:\d+\}\}\s*)+$/.test(t)) out.push(t);                    // a photo on its own line
    else if (hd === H.TITLE) continue;                                         // the Doc title: the sheet's Title is used
    else if (hd === H.HEADING1 || hd === H.HEADING2 || hd === H.SUBTITLE) out.push('<h2>' + t + '</h2>');
    else if (hd !== H.NORMAL) out.push('<h3>' + t + '</h3>');
    else out.push('<p>' + t + '</p>');
  }
  closeList();
  // A short fingerprint per photo, so the website only downloads photos that changed
  const hashes = body.getImages().slice(0, img).map((im) =>
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, im.getBlob().getBytes()).slice(0, 5)
      .map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''));
  return { html: out.join('\n'), images: hashes };
}

function docImage_(docId, n) {
  const imgs = DocumentApp.openById(docId).getBody().getImages();
  return imgs[n] ? imgs[n].getBlob() : null;
}

const fileRef_ = (f) => ({ id: f.getId(), v: f.getLastUpdated().getTime().toString(36) });   // v changes when the photo is replaced

function photoIds_(cell) {
  const list = [];
  String(cell || '').split(/[\s,]+/).forEach((part) => {
    const id = driveId_(part);
    if (!id) return;
    if (/\/folders\//.test(part)) {
      const files = [];
      const it = DriveApp.getFolderById(id).getFiles();
      while (it.hasNext()) { const f = it.next(); if (/^image\//.test(f.getMimeType())) files.push(f); }
      files.sort((a, b) => a.getName().localeCompare(b.getName(), undefined, { numeric: true }));
      files.slice(0, 12).forEach((f) => list.push(fileRef_(f)));
    } else list.push(fileRef_(DriveApp.getFileById(id)));
  });
  return list;
}

// Everything that is Published (drafts are never shared)
function content_() {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const articles = ensureSlugs_(articles_(), 7).filter(published_).map((r) => {
    const docId = driveId_(r[3]);
    let doc = { html: '', images: [] }, cover = null, error = '';
    try { if (docId) doc = docHtml_(docId); } catch (err) { error = 'Could not open the Google Doc: ' + err.message; }
    try { if (driveId_(r[5])) cover = fileRef_(DriveApp.getFileById(driveId_(r[5]))); } catch (err) { error += ' Could not open the cover photo: ' + err.message; }
    return {
      slug: String(r[7]), title: String(r[0]).trim(),
      date: r[2] instanceof Date ? Utilities.formatDate(r[2], tz, 'yyyy-MM-dd') : Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'),
      summary: String(r[4] || '').trim(), tags: String(r[6] || '').split(',').map((t) => t.trim()).filter(Boolean),
      cover: cover, doc: docId, html: doc.html, images: doc.images, error: error.trim()
    };
  });
  const works = ensureSlugs_(works_(), 9).filter(published_).map((r) => {
    let photos = [], error = '';
    try { photos = photoIds_(r[8]); } catch (err) { error = 'Could not open the photos: ' + err.message; }
    return {
      slug: String(r[9]), title: String(r[0]).trim(),
      category: /graphic/i.test(r[2]) ? 'graphic' : 'engineering',
      subtitle: String(r[3] || '').trim(), year: String(r[4] || '').trim(), summary: String(r[5] || '').trim(),
      points: String(r[6] || '').split(/\n+/).map((t) => t.replace(/^[-•*]\s*/, '').trim()).filter(Boolean),
      tags: String(r[7] || '').split(',').map((t) => t.trim()).filter(Boolean),
      photos: photos, error: error
    };
  });
  return { articles: articles, works: works, site: siteLists_() };
}

// A photo, only if it belongs to something Published (nothing else in your Drive can be fetched)
function image_(q) {
  const arts = articles_().getDataRange().getValues().slice(1).filter(published_);
  let blob = null;
  if (q.doc) {
    if (arts.some((r) => driveId_(r[3]) === q.doc) && Number(q.n) >= 0) blob = docImage_(q.doc, Number(q.n));
  } else if (q.id) {
    const ok = arts.some((r) => driveId_(r[5]) === q.id) ||
      certs_().getDataRange().getValues().slice(1).some((r) => shown_(r, 4) && driveId_(r[3]) === q.id) ||
      works_().getDataRange().getValues().slice(1).filter(published_).some((r) => photoIds_(r[8]).some((p) => p.id === q.id));
    if (ok) blob = DriveApp.getFileById(q.id).getBlob();
  }
  if (!blob) return { ok: false };
  return { ok: true, type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ---------- Pricing, certificates, courses and webinar recordings ---------- */
const SEED_PRICING = [["3D Part Model","Engineering",1000,"Yes","A single part modelled from your sketch, dimensions or physical sample.","Parametric 3D model\nNative CAD file + STEP\nClean product renders","cube","Yes"],["Assembly & Drawings","Engineering",4500,"Yes","Multi-part assemblies with manufacturing-ready drawings.","Full 3D assembly\nDimensioned 2D drawings (PDF / DWG)\nBill of materials\nExploded views","gear","Yes"],["Simulation Study","Engineering",4500,"Yes","FEA or thermal analysis to validate a design before it is built.","Model preparation & meshing\nLoads & boundary conditions\nResult plots\nShort technical report","chart","Yes"],["Social Media Pack","Graphic Design",3500,"Yes","A set of on-brand posts and stories for your campaign or event.","Designs sized for your platforms\nPNG / JPG exports\nEditable source on request","image","Yes"],["Poster & Print","Graphic Design",500,"Yes","Posters, flyers, certificates and banners that stand out.","Price per design\nPrint-ready PDF\nDigital version for sharing\nPrinting from KES 1,000 per m²","layout","Yes"],["Brand Identity","Graphic Design",7500,"Yes","A logo and visual identity that makes your business recognisable.","Logo concepts\nColour palette & fonts\nLogo files for print & web\nMini brand guide","brush","Yes"],["CAD Training","Training",4500,"Yes","One-on-one or group training, online or in person in Nairobi.","AutoCAD, SolidWorks, Inventor or Fusion 360\nBeginner to advanced\nPractical, project-based exercises\nPractice files to keep","cap","Yes"]];
const SEED_CERTS = [["Certified SOLIDWORKS Associate (CSWA) Cert Prep","LinkedIn Learning","https://www.linkedin.com/learning/certificates/02dd967cc0613a683c80a08ea44bbfa46d1d73ca0be389a0979e2d0e829e80e2","","Yes"],["CSWA Exam Preparation (SOLIDWORKS)","Udemy","https://www.udemy.com/certificate/UC-09090316-a037-4c81-a287-30a8dc798a72/","","Yes"],["Autodesk Inventor Design Certification","LinkedIn Learning","","","Yes"],["Autodesk Designathon 2025, Honorable Mention","Autodesk","","","Yes"],["Autodesk Designathon 2026, Participant","Autodesk","","","Yes"],["SOLIDWORKS 2024 Essential Training","LinkedIn Learning","https://www.linkedin.com/learning/certificates/02dd967cc0613a683c80a08ea44bbfa46d1d73ca0be389a0979e2d0e829e80e2","","Yes"],["Premiere Pro Essential Training","LinkedIn Learning","https://www.linkedin.com/learning/certificates/e274dcccc2f54a1828948722cabe58f6e0139d7b03f2031937cdca995df90a6d","","Yes"]];
const SEED_COURSES = [["AutoCAD","2D drafting and technical drawings","Beginner to intermediate","Interface, command aliases and drafting settings\nDrawing and editing tools with precision (object snaps, ortho, polar)\nLayers, linetypes and drawing organisation\nDimensions, text and annotation styles\nBlocks and reusable details\nLayouts, viewports, scales and plotting to PDF\nIntroduction to 3D modelling","Yes"],["SolidWorks","3D parts, assemblies and drawings","Beginner to advanced","Sketching with relations and dimensions\nPart modelling features and design intent\nAssemblies, mates and motion checks\nManufacturing drawings with dimensions and BOMs\nSheet metal parts and flat patterns\nIntro to simulation (FEA) studies\nCSWA exam preparation and practice","Yes"],["Autodesk Inventor","Mechanical design for machines and products","Beginner to advanced","Parametric sketches and part features\nAssemblies, constraints and joints\nDrawings, parts lists and annotation\nSheet metal design\nFrame Generator for structures\nExploded views and presentations\nWorking with AutoCAD DWG files","Yes"],["Fusion 360","Design, render and make, all in one","Beginner to intermediate","Sketching and solid modelling\nComponents, joints and assemblies\nRendering and product visuals\nPreparing parts for 3D printing\nIntroduction to CAM and CNC toolpaths\nIntroduction to simulation\nCloud collaboration and sharing designs","Yes"]];
const SEED_RECORDINGS = [["https://www.youtube.com/watch?v=MrBvUttpKN4","Webinar recording","Yes"]];
const SEED_TRAINING = {"intake":"","price":4500};

const YESNO = ['Yes', 'No'];
const PRICING = 'Pricing', CERTS = 'Certificates', COURSES = 'Courses', RECORDINGS = 'Recordings';
const PRHEAD = ['Package', 'Category', 'Price (KES)', 'Starting from?', 'Description', "What's included (one per line)", 'Icon', 'Show on website'];
const CEHEAD = ['Certificate', 'Issued by', 'Credential link', 'Certificate image (Google Drive link, optional)', 'Show on website'];
const COHEAD = ['Course', 'Tagline', 'Level', 'Topics (one per line)', 'Show on website', 'Next class (e.g. Saturdays from 7 Nov 2026)', 'Seats (empty = no limit)'];
const REHEAD = ['YouTube link', 'Title', 'Show on website'];
const ICONS = ['cube', 'gear', 'chart', 'image', 'layout', 'brush', 'cap', 'hub', 'battery', 'leaf', 'pen', 'award', 'play', 'users', 'doc'];

function listTab_(name, head, seed, widths, rules, showCol) {
  showCol = showCol || head.length;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  sh.appendRow(head);
  if (seed.length) sh.getRange(2, 1, seed.length, head.length).setValues(seed.map((r) => r.concat(Array(Math.max(0, head.length - r.length)).fill(''))));
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setWrap(true);
  sh.getRange(2, 1, 499, head.length).setVerticalAlignment('top').setWrap(true);
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, showCol, 499, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(YESNO, true).build());
  (rules || []).forEach((r) => sh.getRange(r[0]).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(r[1], true).build()));
  return sh;
}
const pricing_ = () => listTab_(PRICING, PRHEAD, SEED_PRICING, [200, 140, 110, 110, 320, 320, 90, 110],
  [['B2:B500', ['Engineering', 'Graphic Design', 'Training']], ['D2:D500', YESNO], ['G2:G500', ICONS]]);
const certs_ = () => listTab_(CERTS, CEHEAD, SEED_CERTS, [320, 160, 320, 300, 110]);
const courses_ = () => listTab_(COURSES, COHEAD, SEED_COURSES, [180, 260, 180, 420, 110, 260, 120], null, 5);
const recordings_ = () => listTab_(RECORDINGS, REHEAD, SEED_RECORDINGS, [340, 340, 110]);

const shown_ = (r, col) => String(r[0]).trim() && !/^no$/i.test(String(r[col]).trim());
const lines_ = (t) => String(t || '').split(/\n+/).map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
const ytId_ = (t) => { const m = /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{6,})/.exec(String(t || '')) || /^([\w-]{11})$/.exec(String(t || '').trim()); return m ? m[1] : ''; };

// Site lists for the automation. A tab with no rows to show sends null, so the website keeps its built-in list.
function siteLists_() {
  const rows = (sh) => sh.getDataRange().getValues().slice(1);
  const packages = rows(pricing_()).filter((r) => shown_(r, 7)).map((r) => {
    const n = Number(String(r[2]).replace(/[^\d.]/g, ''));
    return {
      name: String(r[0]).trim(),
      category: /graphic/i.test(r[1]) ? 'graphic' : /train/i.test(r[1]) ? 'training' : 'engineering',
      price: n > 0 ? 'KES ' + Math.round(n).toLocaleString('en-US') : '',
      from: !/^no$/i.test(String(r[3]).trim()),
      description: String(r[4] || '').trim(),
      includes: lines_(r[5]),
      icon: ICONS.indexOf(String(r[6]).trim()) > -1 ? String(r[6]).trim() : ''
    };
  });
  const certificates = rows(certs_()).filter((r) => shown_(r, 4)).map((r) => {
    let image = null;
    try { if (driveId_(r[3])) image = fileRef_(DriveApp.getFileById(driveId_(r[3]))); } catch (err) { /* not readable */ }
    return { title: String(r[0]).trim(), issuer: String(r[1] || '').trim(), verify: /^https?:\/\//i.test(String(r[2]).trim()) ? String(r[2]).trim() : '', image: image };
  });
  const courses = rows(courses_()).filter((r) => shown_(r, 4)).map((r) => ({
    name: String(r[0]).trim(), tagline: String(r[1] || '').trim(), levels: String(r[2] || '').trim(), topics: lines_(r[3])
  }));
  const recordings = rows(recordings_()).filter((r) => shown_(r, 2) && ytId_(r[0])).map((r) => ({ id: ytId_(r[0]), title: String(r[1] || '').trim() || 'Webinar recording' }));
  const S = {};
  settings_().getDataRange().getValues().slice(1).forEach((r) => { S[String(r[0]).trim().toLowerCase()] = r[1]; });
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const intake = S['training next intake'] instanceof Date ? Utilities.formatDate(S['training next intake'], tz, 'd MMMM yyyy') : String(S['training next intake'] == null ? '' : S['training next intake']).trim();
  const price = Number(String(S['training starting price (kes)'] == null ? '' : S['training starting price (kes)']).replace(/[^\d.]/g, ''));
  return {
    packages: packages.length ? packages : null,
    certificates: certificates.length ? certificates : null,
    courses: courses.length ? courses : null,
    recordings: recordings.length ? recordings : null,
    training: { intake: intake, price: price > 0 ? Math.round(price) : null }
  };
}

/* ---------- Quotes, invoices and receipts ---------- */
const INVOICES = 'Invoices';
const IHEAD = ['Number (automatic)', 'Type', 'Date', 'Project reference', 'Client', 'Client email', 'Items (one per line: description - amount)', 'Total (KES, automatic if empty)', 'Amount paid (KES)', 'Note to client', 'Action', 'PDF (automatic)', 'Sent (automatic)', 'Payment reminders (automatic; type Off to stop)'];
const MPESA_TILL = '8438334', MPESA_NAME = 'EDISON OCHIENG';

function invoices_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(INVOICES);
  if (sh) return sh;
  sh = ss.insertSheet(INVOICES);
  sh.appendRow(IHEAD);
  sh.appendRow(['', 'Invoice', new Date(), 'DEMO-SHEET-01', 'Example client', '', 'Bracket 3D model - 1500\nManufacturing drawings (3 sheets) - 3000', '', 0, 'Example row: put your own email in Client email to test, then set Action to Send.', 'Draft', '', '']);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, IHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('B2:B1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Quote', 'Invoice', 'Receipt'], true).build());
  sh.getRange('K2:K1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Draft', 'Send', 'Sent'], true).build());
  sh.getRange('C2:C1000').setNumberFormat('d mmm yyyy');
  sh.getRange(2, 1, 999, IHEAD.length).setVerticalAlignment('top').setWrap(true);
  [150, 90, 100, 150, 170, 200, 360, 120, 120, 260, 80, 200, 150, 230].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

// Typing a project reference fills in the client's name and email
function fillInvoice_(sh, row) {
  const ref = normRef_(sh.getRange(row, 4).getValue());
  if (!ref) return;
  const p = projects_().getDataRange().getValues().slice(1).find((r) => normRef_(r[0]) === ref);
  const b = p ? null : subs_().getDataRange().getValues().slice(1).find((r) => normRef_(r[0]) === ref);
  const t = p || b ? null : trainees_().getDataRange().getValues().slice(1).find((r) => normRef_(r[0]) === ref);
  const name = p ? p[2] : b ? b[3] : t ? t[2] : '', email = p ? p[11] : b ? b[4] : t ? t[3] : '';
  if (name && !sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue(name);
  if (email && !sh.getRange(row, 6).getValue()) sh.getRange(row, 6).setValue(email);
  if (!sh.getRange(row, 2).getValue()) sh.getRange(row, 2).setValue('Invoice');
  if (!sh.getRange(row, 3).getValue()) sh.getRange(row, 3).setValue(new Date());
  if (!sh.getRange(row, 11).getValue()) sh.getRange(row, 11).setValue('Draft');
}

const kes_ = (n) => 'KES ' + Math.round(Number(n) || 0).toLocaleString('en-US');
const num_ = (v) => { const n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; };

function invoiceItems_(text) {
  return String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = /^(.*?)[\s:\-–|]*(?:KES|KSh|Ksh)?\s*([\d][\d,]*(?:\.\d+)?)\s*$/i.exec(l);
    return m && m[1].trim() ? { text: m[1].replace(/[\s:\-–|]+$/, '').trim(), amount: num_(m[2]) } : { text: l, amount: null };
  });
}

// Rubber-stamp style mark on receipts: PAID when nothing is owed, PART PAID otherwise
function stamp_(d) {
  if (d.type !== 'Receipt') return '';
  const full = d.balance <= 0, c = full ? '#1fae6a' : '#e08a00';
  return '<div style="display:inline-block;padding:6px 18px 4px;border:4px solid ' + c + ';border-radius:10px;color:' + c + ';text-align:center;' +
    'transform:rotate(-8deg);-webkit-transform:rotate(-8deg);opacity:.9">' +
    '<div style="font-size:' + (full ? 34 : 24) + 'px;font-weight:bold;letter-spacing:6px;line-height:1.1">' + (full ? 'PAID' : 'PART PAID') + '</div>' +
    '<div style="font-size:10px;letter-spacing:2px;font-weight:bold">' + html_(d.date).toUpperCase() + '</div></div>';
}

function invoiceHtml_(d) {
  const accent = d.type === 'Receipt' ? '#1fae6a' : d.type === 'Quote' ? '#7457f2' : '#ff6b4a';
  const rows = d.items.map((it) => '<tr><td style="padding:9px 10px;border-bottom:1px solid #ece4d6">' + html_(it.text) + '</td><td style="padding:9px 10px;border-bottom:1px solid #ece4d6;text-align:right;white-space:nowrap">' + (it.amount === null ? '' : kes_(it.amount)) + '</td></tr>').join('');
  const line = (label, value, strong) => '<tr><td style="padding:6px 10px;text-align:right;color:#555">' + label + '</td><td style="padding:6px 10px;text-align:right;white-space:nowrap' + (strong ? ';font-weight:bold;font-size:15px;color:#0e1a3a' : '') + '">' + value + '</td></tr>';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>table{font-size:12px;color:#18203a}</style></head><body style="font-family:Arial,Helvetica,sans-serif;color:#18203a;font-size:12px;margin:0">' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="background:#0e1a3a;color:#ffffff"><tr>' +
      '<td style="padding:26px 30px"><table cellspacing="0" cellpadding="0"><tr><td style="background:#ffb627;color:#0e1a3a;font-weight:bold;font-size:16px;width:40px;height:40px;text-align:center">EO</td>' +
      '<td style="padding-left:12px"><div style="font-size:18px;font-weight:bold;color:#ffffff">Nexus CAD Studio</div><div style="font-size:10px;letter-spacing:2px;color:#c9d0ea">EDISON OCHIENG · NAIROBI, KENYA</div></td></tr></table></td>' +
      '<td style="padding:26px 30px;text-align:right"><div style="font-size:26px;font-weight:bold;color:' + accent + '">' + d.type.toUpperCase() + '</div><div style="color:#c9d0ea">' + html_(d.number) + '</div></td>' +
    '</tr></table>' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px"><tr>' +
      '<td style="padding:0 30px;vertical-align:top"><div style="font-size:10px;letter-spacing:1.5px;color:#888">' + (d.type === 'Receipt' ? 'RECEIVED FROM' : 'BILL TO') + '</div><div style="font-size:14px;font-weight:bold;margin-top:4px">' + html_(d.client || '') + '</div>' + (d.email ? '<div style="color:#555">' + html_(d.email) + '</div>' : '') + '</td>' +
      '<td style="padding:0 30px;vertical-align:top;text-align:right"><div style="font-size:10px;letter-spacing:1.5px;color:#888">DATE</div><div style="margin-top:4px">' + html_(d.date) + '</div>' +
        (d.ref ? '<div style="font-size:10px;letter-spacing:1.5px;color:#888;margin-top:8px">PROJECT REFERENCE</div><div style="margin-top:4px">' + html_(d.ref) + '</div>' : '') + '</td>' +
    '</tr></table>' +
    '<div style="padding:22px 30px 0"><table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">' +
      '<tr><td style="padding:9px 10px;background:#f6f1e7;font-size:10px;letter-spacing:1.5px;color:#666">DESCRIPTION</td><td style="padding:9px 10px;background:#f6f1e7;font-size:10px;letter-spacing:1.5px;color:#666;text-align:right">AMOUNT</td></tr>' +
      rows + '</table>' +
      '<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px"><tr>' +
        '<td style="vertical-align:middle;padding:10px 0 0 6px">' + stamp_(d) + '</td>' +
        '<td style="vertical-align:top"><table cellspacing="0" cellpadding="0" style="margin:0 0 0 auto">' + line('Total', kes_(d.total), d.type === 'Quote') +
        (d.type !== 'Quote' ? line(d.type === 'Receipt' ? 'Amount received' : 'Paid so far', kes_(d.paid)) + line(d.type === 'Receipt' ? 'Balance remaining' : 'Balance due', kes_(d.balance), true) : '') + '</table></td>' +
      '</tr></table>' +
    '</div>' +
    (d.note ? '<div style="margin:18px 30px 0;padding:12px 14px;background:#fbf6ec;border-left:4px solid #ffb627">' + html_(d.note) + '</div>' : '') +
    (d.type === 'Receipt'
      ? '<div style="margin:22px 30px 0;color:#1fae6a;font-weight:bold;font-size:14px">Thank you for your payment.</div>'
      : '<div style="margin:22px 30px 0;padding:14px 16px;border:1px solid #ece4d6"><b>How to pay</b><br>M-Pesa · Lipa na M-Pesa · Buy Goods Till <b>' + MPESA_TILL + '</b> (' + MPESA_NAME + ')<br>Please use your project reference' + (d.ref ? ' <b>' + html_(d.ref) + '</b>' : '') + ' when you message me the confirmation code.' + (d.type === 'Quote' ? '<br>This quote is valid for 30 days.' : '') + '</div>') +
    '<div style="margin:26px 30px 0;padding-top:12px;border-top:1px solid #ece4d6;color:#666;font-size:11px">WhatsApp +254 708 639 473 · ' + SITE_URL.replace(/^https:\/\//, '').replace(/\/$/, '') + (d.ref ? ' · Track your project: ' + SITE_URL + 'track/?ref=' + encodeURIComponent(d.ref) : '') + '</div>' +
    '</body></html>';
}

function invoiceFolder_() {
  const name = 'Nexus CAD Studio invoices';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function sendInvoice_(sh, row) {
  const r = sh.getRange(row, 1, 1, IHEAD.length).getValues()[0];
  const fail = (msg) => { sh.getRange(row, 13).setValue('⚠ ' + msg); sh.getRange(row, 11).setValue('Draft'); };
  const type = ['Quote', 'Invoice', 'Receipt'].indexOf(String(r[1]).trim()) > -1 ? String(r[1]).trim() : 'Invoice';
  const email = String(r[5] || '').trim();
  const items = invoiceItems_(r[6]);
  if (!validEmail_(email)) return fail('Add the client email (column F), then set Action to Send again.');
  if (!items.length) return fail('Add at least one item (column G), then set Action to Send again.');
  const total = num_(r[7]) || items.reduce((a, it) => a + (it.amount || 0), 0);
  const paid = num_(r[8]);
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const date = r[2] instanceof Date ? r[2] : new Date();
  let number = String(r[0] || '').trim();
  if (!number) {
    const prefix = { Quote: 'QUO', Invoice: 'INV', Receipt: 'RCT' }[type] + '-' + Utilities.formatDate(date, tz, 'yyyy') + '-';
    const used = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues().map((x) => String(x[0])).filter((x) => x.indexOf(prefix) === 0).length;
    number = prefix + String(used + 1).padStart(3, '0');
    sh.getRange(row, 1).setValue(number);
  }
  const d = { type, number, date: Utilities.formatDate(date, tz, 'd MMMM yyyy'), ref: String(r[3] || '').trim(), client: String(r[4] || '').trim(), email, items, total, paid, balance: Math.max(0, total - paid), note: String(r[9] || '').trim() };
  const pdf = Utilities.newBlob(invoiceHtml_(d), 'text/html', number + '.html').getAs('application/pdf').setName(number + ' - ' + (d.client || 'client') + '.pdf');
  const file = invoiceFolder_().createFile(pdf);
  const message = {
    Quote: 'Please find attached your quote <b>' + html_(number) + '</b> for <b>' + kes_(total) + '</b>. Let me know if you have any questions, or reply to accept it.',
    Invoice: 'Please find attached invoice <b>' + html_(number) + '</b>. The balance due is <b>' + kes_(d.balance) + '</b>, payable by M-Pesa to Buy Goods Till <b>' + MPESA_TILL + '</b> (' + MPESA_NAME + ').',
    Receipt: 'Thank you for your payment of <b>' + kes_(paid) + '</b>. Your receipt <b>' + html_(number) + '</b> is attached.' + (d.balance > 0 ? ' The remaining balance is <b>' + kes_(d.balance) + '</b>.' : '')
  }[type];
  const body = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
    '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · ' + type.toUpperCase() + '</p>' +
    '<p>Hello' + (d.client ? ' ' + html_(d.client) : '') + ',</p><p>' + message + '</p>' +
    (d.note ? '<p style="border-left:4px solid #ffb627;background:#fbf6ec;padding:10px 12px">' + html_(d.note) + '</p>' : '') +
    (d.ref ? '<p><a href="' + SITE_URL + 'track/?ref=' + encodeURIComponent(d.ref) + '" style="background:#0e1a3a;color:#fff;padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:bold">Track your project</a></p>' : '') +
    '<p style="font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
    '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>';
  MailApp.sendEmail({ to: email, subject: type + ' ' + number + ' from Nexus CAD Studio', htmlBody: body, body: message.replace(/<[^>]+>/g, ''), name: SENDER, attachments: [pdf] });
  sh.getRange(row, 12).setValue(file.getUrl());
  sh.getRange(row, 13).setValue('Sent ' + Utilities.formatDate(new Date(), tz, 'd MMM yyyy, HH:mm'));
  sh.getRange(row, 11).setValue('Sent');
  if (!num_(r[7])) sh.getRange(row, 8).setValue(total);
  // Keep the project's tracker in step
  if (d.ref && type !== 'Quote') {
    const P = projects_(), rows = P.getDataRange().getValues();
    const i = rows.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(d.ref));
    if (i > 0) {
      P.getRange(i + 1, 9).setValue(d.balance);
      if (type === 'Receipt') P.getRange(i + 1, 8).setValue('Paid');
      else if (!rows[i][7]) P.getRange(i + 1, 8).setValue('Due');
      P.getRange(i + 1, 11).setValue(new Date());
    }
    if (type === 'Receipt' && i < 1) {
      const T = trainees_(), tr = T.getDataRange().getValues();
      const j = tr.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(d.ref));
      if (j > 0 && /^(reserved|waiting list|confirmed)$/i.test(String(tr[j][8]).trim())) T.getRange(j + 1, 9).setValue('Paid');
    }
  }
}

/* ---------- Payment reminders for unpaid invoices (daily, 9am) ---------- */
const REMIND_DAYS = [7, 14];

// Has this invoice been paid? (a receipt for the same project or client sent on/after it, or no balance left on the project)
function invoicePaid_(inv, rows) {
  const ref = normRef_(inv[3]), email = String(inv[5] || '').trim().toLowerCase();
  const day = (v) => (v instanceof Date ? new Date(v.getFullYear(), v.getMonth(), v.getDate()).getTime() : 0);
  const receipt = rows.some((r) => String(r[1]).trim() === 'Receipt' && String(r[10]).trim() === 'Sent' && day(r[2]) >= day(inv[2]) &&
    ((ref && normRef_(r[3]) === ref) || (!ref && email && String(r[5]).trim().toLowerCase() === email)));
  if (receipt) return true;
  if (ref) {
    const p = projects_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === ref);
    if (p && String(p[8]).trim() !== '' && num_(p[8]) === 0 && /^paid$/i.test(String(p[7]).trim())) return true;
  }
  return false;
}

function reminderJob() {
  if (/^no$/i.test(setting_('Payment reminders'))) return;
  const sh = invoices_(), rows = sh.getDataRange().getValues().slice(1);
  const tz = 'Africa/Nairobi', now = new Date();
  rows.forEach((r, i) => {
    const row = i + 2, status = String(r[13] || '').trim();
    if (String(r[1]).trim() !== 'Invoice' || String(r[10]).trim() !== 'Sent' || !(r[2] instanceof Date)) return;
    if (/^(off|no|stop|paid)/i.test(status)) return;
    const balance = Math.max(0, num_(r[7]) - num_(r[8]));
    if (balance <= 0 || invoicePaid_(r, rows)) { sh.getRange(row, 14).setValue('Paid: no reminders needed'); return; }
    const sent = /^reminder (\d)/i.test(status) ? Number(/^reminder (\d)/i.exec(status)[1]) : 0;
    if (sent >= REMIND_DAYS.length) return;
    const age = Math.floor((now - r[2]) / 864e5);
    if (age < REMIND_DAYS[sent]) return;
    const email = String(r[5] || '').trim();
    if (!validEmail_(email) || MailApp.getRemainingDailyQuota() <= 5) return;
    let pdf = null;
    const id = driveId_(r[11]);
    try { if (id) pdf = DriveApp.getFileById(id).getBlob(); } catch (err) { /* file moved or deleted: send without it */ }
    const number = String(r[0]), ref = String(r[3] || '').trim(), client = String(r[4] || '').trim();
    const first = sent === 0;
    const body = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · PAYMENT REMINDER</p>' +
      '<p>Hello' + (client ? ' ' + html_(client) : '') + ',</p>' +
      '<p>' + (first ? 'A friendly reminder that invoice <b>' + html_(number) + '</b> is still open.' : 'Just following up on invoice <b>' + html_(number) + '</b>, which is still open.') +
      ' The balance due is <b>' + kes_(balance) + '</b>.</p>' +
      '<div style="padding:12px 14px;border:1px solid #ece4d6;margin:0 0 16px"><b>How to pay</b><br>M-Pesa · Buy Goods Till <b>' + MPESA_TILL + '</b> (' + MPESA_NAME + ')' +
      (ref ? '<br>Please mention your project reference <b>' + html_(ref) + '</b>.' : '') + '</div>' +
      '<p>If you have already paid, thank you, and please ignore this message' + (first ? '' : '. If anything is holding up the payment, just reply and let me know') + '.</p>' +
      (ref ? '<p><a href="' + SITE_URL + 'track/?ref=' + encodeURIComponent(ref) + '" style="background:#0e1a3a;color:#fff;padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:bold">View your project</a></p>' : '') +
      '<p style="font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>';
    const mail = { to: email, name: SENDER, subject: (first ? 'Reminder: ' : 'Second reminder: ') + 'invoice ' + number + ' (' + kes_(balance) + ')', htmlBody: body,
      body: 'Invoice ' + number + ' is still open. Balance due: ' + kes_(balance) + '. Pay by M-Pesa Buy Goods Till ' + MPESA_TILL + ' (' + MPESA_NAME + ').' };
    if (pdf) mail.attachments = [pdf];
    MailApp.sendEmail(mail);
    sh.getRange(row, 14).setValue('Reminder ' + (sent + 1) + ' sent ' + Utilities.formatDate(now, tz, 'd MMM yyyy'));
  });
}

/* ---------- Training: seats, trainees and certificates ---------- */
const TRAINEES = 'Trainees';
const THEAD = ['Trainee ID (automatic)', 'Registered', 'Name', 'Email', 'Phone / WhatsApp', 'Course', 'Class', 'Format', 'Status', 'Completed on', 'Certificate code (automatic)', 'Certificate (automatic)', 'Notes'];
const T_STATUS = ['Reserved', 'Waiting list', 'Confirmed', 'Paid', 'In training', 'Completed', 'Cancelled'];

function trainees_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TRAINEES);
  if (sh) return sh;
  sh = ss.insertSheet(TRAINEES);
  sh.appendRow(THEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, THEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('I2:I2000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(T_STATUS, true).build());
  sh.getRange('B2:B2000').setNumberFormat('d mmm yyyy');
  sh.getRange('J2:J2000').setNumberFormat('d mmm yyyy');
  [150, 110, 180, 220, 150, 160, 220, 130, 120, 120, 170, 200, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

const newId_ = (prefix) => prefix + '-' + Utilities.formatDate(new Date(), 'Africa/Nairobi', 'yyMM') + '-' +
  Utilities.getUuid().replace(/[^a-z0-9]/gi, '').toUpperCase().replace(/[01OI]/g, '').slice(0, 5);

// Each shown course with its next class and seats (seats are counted per class)
function classes_() {
  const fallback = setting_('Training next intake');
  const trainees = trainees_().getDataRange().getValues().slice(1);
  return courses_().getDataRange().getValues().slice(1).filter((r) => shown_(r, 4)).map((r) => {
    const name = String(r[0]).trim(), nextClass = String(r[5] || '').trim() || fallback;
    const seats = Math.round(num_(r[6]));
    const taken = trainees.filter((t) => String(t[5]).trim().toLowerCase() === name.toLowerCase() &&
      String(t[6]).trim() === nextClass && !/^(cancelled|waiting list)$/i.test(String(t[8]).trim())).length;
    return { name, nextClass, seats, taken, left: seats ? Math.max(0, seats - taken) : null, full: !!seats && taken >= seats };
  });
}
const trainingInfo_ = () => ({ courses: classes_().map((c) => ({ name: c.name, nextClass: c.nextClass, seats: c.seats || null, left: c.left, full: c.full })) });

function reserve_(p) {
  const name = clean_(p.name, 80), email = clean_(p.email, 120).toLowerCase(), course = clean_(p.Course || p.course, 80);
  if (!name || !validEmail_(email) || !course) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('reserve-count') || 0);
  if (count >= 40) return { ok: false, error: 'busy' };
  cache.put('reserve-count', String(count + 1), 3600);
  const c = classes_().find((x) => x.name.toLowerCase() === course.toLowerCase());
  const klass = c ? c.nextClass : '';
  const status = c && c.full ? 'Waiting list' : 'Reserved';
  let id;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = trainees_(), rows = sh.getDataRange().getValues().slice(1);
    const dup = rows.find((r) => String(r[3]).trim().toLowerCase() === email && String(r[5]).trim().toLowerCase() === course.toLowerCase() &&
      String(r[6]).trim() === klass && !/^cancelled$/i.test(String(r[8]).trim()));
    if (dup) return { ok: true };
    id = newId_('TRN');
    const notes = [p.Level ? 'Level: ' + clean_(p.Level, 60) : '', p['Preferred schedule'] ? 'Prefers: ' + clean_(p['Preferred schedule'], 80) : '', p.Message ? clean_(p.Message, 600) : ''].filter(Boolean).join(' · ');
    sh.appendRow([id, new Date(), name, email, clean_(p['Phone / WhatsApp'] || p.phone, 40), c ? c.name : course, klass, clean_(p.Format, 60), status, '', '', '', notes]);
  } finally {
    lock.releaseLock();
  }
  try {
    traineeMail_(email, name, status === 'Waiting list'
      ? 'Thank you for your interest in <b>' + html_(course) + '</b> training. The next class' + (klass ? ' (' + html_(klass) + ')' : '') + ' is full, so you are on the <b>waiting list</b>. I will contact you as soon as a seat opens or the next class is scheduled.'
      : 'Thank you for reserving a seat for <b>' + html_(course) + '</b> training' + (klass ? ' (' + html_(klass) + ')' : '') + '. I will confirm the schedule and fees within a day.',
      'Seat request received: ' + course, id);
  } catch (err) { /* email quota: the reservation is still saved */ }
  return { ok: true };
}

function traineeMail_(to, name, message, subject, id, attachment) {
  const body = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
    '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · CAD TRAINING</p>' +
    '<p>Hello ' + html_(name) + ',</p><p>' + message + '</p>' +
    (id ? '<p style="font-size:13px;color:#555">Your trainee ID: <b>' + html_(id) + '</b></p>' : '') +
    '<p style="font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
    '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">CAD Trainer · Nexus CAD Studio</span></p></div>';
  const mail = { to: to, name: SENDER, subject: subject, htmlBody: body, body: message.replace(/<[^>]+>/g, '') };
  if (attachment) mail.attachments = [attachment];
  MailApp.sendEmail(mail);
}

function traineeChanged_(sh, row) {
  const r = sh.getRange(row, 1, 1, THEAD.length).getValues()[0];
  const status = String(r[8] || '').trim(), name = String(r[2] || '').trim(), email = String(r[3] || '').trim(), course = String(r[5] || '').trim();
  let id = String(r[0] || '').trim();
  if (!id) { id = newId_('TRN'); sh.getRange(row, 1).setValue(id); }
  if (!sh.getRange(row, 2).getValue()) sh.getRange(row, 2).setValue(new Date());
  if (status === 'Confirmed') {
    // Draft the invoice once (you check the price and set Action to Send)
    const inv = invoices_(), invRows = inv.getDataRange().getValues();
    if (!invRows.some((x) => normRef_(x[3]) === normRef_(id))) {
      const price = num_(setting_('Training starting price (KES)'));
      inv.appendRow(['', 'Invoice', new Date(), id, name, email, course + ' training' + (r[6] ? ' (' + r[6] + ')' : '') + (price ? ' - ' + price : ''), '', '', '', 'Draft', '', 'Drafted from the Trainees tab: check it, then set Action to Send', '']);
    }
    sh.getRange(row, 13).setValue([String(r[12] || ''), 'Invoice drafted in the Invoices tab'].filter(Boolean).join(' · '));
    if (validEmail_(email)) traineeMail_(email, name, 'Good news: your seat for <b>' + html_(course) + '</b> training' + (r[6] ? ' (' + html_(r[6]) + ')' : '') + ' is <b>confirmed</b>. Your invoice follows shortly.', 'Seat confirmed: ' + course, id);
  } else if (status === 'Completed') {
    issueCertificate_(sh, row);
  }
}

function certCode_() {
  const raw = Utilities.getUuid().replace(/[^a-z0-9]/gi, '').toUpperCase().replace(/[01OI]/g, '');
  return 'NCS-' + raw.slice(0, 4) + '-' + raw.slice(4, 8);
}

function certificateHtml_(c) {
  const verify = SITE_URL + 'verify/?code=' + encodeURIComponent(c.code);
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:0}table{font-size:13px;color:#0e1a3a}</style></head>' +
    '<body style="margin:0;font-family:Georgia,\'Times New Roman\',serif;color:#0e1a3a">' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="border:14px solid #0e1a3a;height:790px"><tr><td style="border:3px solid #ffb627;padding:40px 50px;text-align:center;vertical-align:middle">' +
      '<table cellspacing="0" cellpadding="0" style="margin:0 auto"><tr><td style="background:#ffb627;color:#0e1a3a;font-family:Arial,sans-serif;font-weight:bold;font-size:18px;width:46px;height:46px;text-align:center">EO</td>' +
      '<td style="padding-left:12px;text-align:left;font-family:Arial,sans-serif"><div style="font-size:18px;font-weight:bold">Nexus CAD Studio</div><div style="font-size:10px;letter-spacing:2px;color:#666">CAD TRAINING · NAIROBI, KENYA</div></td></tr></table>' +
      '<div style="margin-top:40px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:6px;color:#c4422a;font-weight:bold">CERTIFICATE OF COMPLETION</div>' +
      '<div style="margin-top:34px;font-size:16px;color:#555;font-style:italic">This certifies that</div>' +
      '<div style="margin-top:12px;font-size:44px;font-weight:bold;letter-spacing:.5px">' + html_(c.name) + '</div>' +
      '<div style="width:60%;margin:8px auto 0;border-top:2px solid #ffb627"></div>' +
      '<div style="margin-top:16px;font-size:15px;color:#555;font-style:italic">has successfully completed the</div>' +
      '<div style="margin-top:8px;font-size:26px;font-weight:bold;color:#1f4fd1">' + html_(c.course) + ' training course</div>' +
      (c.klass ? '<div style="margin-top:6px;font-family:Arial,sans-serif;font-size:12px;color:#666">' + html_(c.klass) + '</div>' : '') +
      '<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:56px;font-family:Arial,sans-serif"><tr>' +
        '<td style="width:33%;text-align:center;vertical-align:bottom"><div style="font-size:14px;font-weight:bold">' + html_(c.date) + '</div><div style="border-top:1px solid #999;margin:6px 20px 0;padding-top:4px;font-size:10px;letter-spacing:2px;color:#666">DATE OF COMPLETION</div></td>' +
        '<td style="width:34%;text-align:center;vertical-align:bottom"><div style="display:inline-block;padding:8px 14px;border:3px solid #1fae6a;border-radius:50%;color:#1fae6a;font-size:11px;font-weight:bold;letter-spacing:1px;line-height:1.3">VERIFIED<br>NEXUS CAD<br>STUDIO</div></td>' +
        '<td style="width:33%;text-align:center;vertical-align:bottom"><div style="font-family:Georgia,serif;font-size:20px;font-style:italic">Edison Ochieng</div><div style="border-top:1px solid #999;margin:6px 20px 0;padding-top:4px;font-size:10px;letter-spacing:2px;color:#666">LEAD CAD TRAINER</div></td>' +
      '</tr></table>' +
      '<div style="margin-top:40px;font-family:Arial,sans-serif;font-size:11px;color:#666">Certificate code <b style="color:#0e1a3a">' + html_(c.code) + '</b> · Verify at ' + html_(verify) + '</div>' +
    '</td></tr></table></body></html>';
}

function certFolder_() {
  const name = 'Nexus CAD Studio certificates';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function issueCertificate_(sh, row) {
  const r = sh.getRange(row, 1, 1, THEAD.length).getValues()[0];
  const name = String(r[2] || '').trim(), email = String(r[3] || '').trim(), course = String(r[5] || '').trim();
  if (!name || !course) { sh.getRange(row, 13).setValue('⚠ Add the trainee name and course, then set Status to Completed again.'); return; }
  const done = r[9] instanceof Date ? r[9] : new Date();
  if (!(r[9] instanceof Date)) sh.getRange(row, 10).setValue(done);
  const code = String(r[10] || '').trim() || certCode_();
  sh.getRange(row, 11).setValue(code);
  const c = { name, course, klass: String(r[6] || '').trim(), code, date: Utilities.formatDate(done, 'Africa/Nairobi', 'd MMMM yyyy') };
  const pdf = Utilities.newBlob(certificateHtml_(c), 'text/html', code + '.html').getAs('application/pdf').setName('Certificate - ' + name + ' - ' + course + '.pdf');
  const file = certFolder_().createFile(pdf);
  sh.getRange(row, 12).setValue(file.getUrl());
  if (validEmail_(email)) {
    traineeMail_(email, name, 'Congratulations on completing <b>' + html_(course) + '</b> training! Your certificate is attached.<br><br>' +
      'Certificate code: <b>' + html_(code) + '</b><br>Anyone, such as an employer, can confirm it at <a href="' + SITE_URL + 'verify/?code=' + encodeURIComponent(code) + '">' + SITE_URL.replace(/^https:\/\//, '') + 'verify/</a>.<br><br>' +
      'If you enjoyed the course, I would be grateful for a short review: <a href="' + SITE_URL + '?review=1&name=' + encodeURIComponent(name) + '&service=' + encodeURIComponent('CAD Training / Webinar') + '#reviews">leave a review</a>.',
      'Your certificate: ' + course + ' training', String(r[0] || ''), pdf);
  }
}

// Public check of a certificate code (only Completed trainees; nothing else is shared)
function verify_(code) {
  const want = normRef_(code);
  if (want.length < 8) return { valid: false };
  const cache = CacheService.getScriptCache();
  const misses = Number(cache.get('verify-miss') || 0);
  if (misses >= 40) return { error: 'busy' };
  const r = trainees_().getDataRange().getValues().slice(1).find((x) => x[10] && normRef_(x[10]) === want && /^completed$/i.test(String(x[8]).trim()));
  if (!r) { cache.put('verify-miss', String(misses + 1), 600); return { valid: false }; }
  return { valid: true, code: String(r[10]), name: String(r[2]), course: String(r[5]), date: r[9] instanceof Date ? Utilities.formatDate(r[9], 'Africa/Nairobi', 'd MMMM yyyy') : '' };
}

/* ---------- Client approval from the tracking page ---------- */
function feedback_(p) {
  const want = normRef_(p.ref), decision = /^approve/i.test(p.decision) ? 'approve' : 'changes';
  const message = String(p.message || '').replace(/[\u0000-\u0008\u000b-\u001f<>]/g, ' ').trim().slice(0, 1500);
  if (want.length < 6 || (decision === 'changes' && message.length < 3)) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('feedback-count') || 0);
  if (count >= 30) return { ok: false, error: 'busy' };
  cache.put('feedback-count', String(count + 1), 3600);
  const sh = projects_(), rows = sh.getDataRange().getValues();
  const i = rows.findIndex((x, k) => k > 0 && x[0] && normRef_(x[0]) === want);
  if (i < 1) return { ok: false };
  const r = rows[i], tz = 'Africa/Nairobi', when = Utilities.formatDate(new Date(), tz, 'd MMM yyyy');
  const label = decision === 'approve' ? 'Approved' : 'Changes requested';
  sh.getRange(i + 1, 13).setValue(label + ' · ' + when);
  const history = String(r[13] || '');
  sh.getRange(i + 1, 14).setValue(('[' + Utilities.formatDate(new Date(), tz, 'd MMM, HH:mm') + '] ' + label + (message ? ': ' + message : '') + (history ? '\n' + history : '')).slice(0, 5000));
  sh.getRange(i + 1, 11).setValue(new Date());
  const me = Session.getEffectiveUser().getEmail();
  if (me) {
    MailApp.sendEmail({
      to: me, name: 'Nexus CAD Studio website',
      subject: (decision === 'approve' ? '✅ Approved: ' : '✏️ Changes requested: ') + String(r[1] || r[0]),
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0e1a3a"><p><b>' + html_(r[2] || 'Your client') + '</b> ' +
        (decision === 'approve' ? 'approved' : 'requested changes on') + ' <b>' + html_(r[1] || r[0]) + '</b> (' + html_(r[0]) + ').</p>' +
        (message ? '<p style="border-left:4px solid #ffb627;background:#fbf6ec;padding:10px 12px">' + html_(message).replace(/\n/g, '<br>') + '</p>' : '') +
        '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open your sheet</a></p></div>'
    });
  }
  return { ok: true };
}

/* ---------- Newsletter: subscribers and emailing new articles ---------- */
const SUBSCRIBERS = 'Subscribers';
const NHEAD = ['Email', 'Name', 'Subscribed on', 'Source', 'Status'];

function subscribers_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SUBSCRIBERS);
  if (sh) return sh;
  sh = ss.insertSheet(SUBSCRIBERS);
  sh.appendRow(NHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, NHEAD.length).setFontWeight('bold');
  sh.getRange('E2:E5000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Subscribed', 'Unsubscribed'], true).build());
  sh.getRange('C2:C5000').setNumberFormat('d mmm yyyy');
  [260, 180, 120, 160, 120].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

function subscribe_(p) {
  const email = clean_(p.email, 120).toLowerCase();
  if (!validEmail_(email)) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('sub-count') || 0);
  if (count >= 60) return { ok: false, error: 'busy' };
  cache.put('sub-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = subscribers_();
    const rows = sh.getDataRange().getValues();
    const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
    if (i > 0) sh.getRange(i + 1, 5).setValue('Subscribed');
    else sh.appendRow([email, clean_(p.name, 80), new Date(), clean_(p.source, 60) || 'Website', 'Subscribed']);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function unsubToken_(email) {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('NL_SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('NL_SECRET', secret); }
  return Utilities.computeHmacSha256Signature(String(email).toLowerCase(), secret).slice(0, 10)
    .map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}
// The website's link to this script (also in js/config.js); used for unsubscribe links
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzhZ6fb-p7uUTFm7GCl3dvCEaiIM1p___NvuTYyAhejrTvfyUEGOq5fXxVbpROj9ok0/exec';
const unsubLink_ = (email) => (ScriptApp.getService().getUrl() || WEB_APP_URL).replace(/\/dev$/, '/exec') + '?action=unsubscribe&e=' + encodeURIComponent(email) + '&t=' + unsubToken_(email);

function unsubscribePage_(q) {
  const email = String(q.e || '').trim().toLowerCase();
  let ok = false;
  if (validEmail_(email) && q.t === unsubToken_(email)) {
    const sh = subscribers_(), rows = sh.getDataRange().getValues();
    const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
    if (i > 0) sh.getRange(i + 1, 5).setValue('Unsubscribed');
    ok = true;
  }
  return HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;max-width:480px;margin:60px auto;text-align:center;color:#0e1a3a">' +
    '<h2>' + (ok ? 'You have been unsubscribed' : 'This link is not valid') + '</h2>' +
    '<p>' + (ok ? 'You will no longer receive CAD tips by email. You can sign up again any time on the website.' : 'Please use the unsubscribe link from your latest email.') + '</p>' +
    '<p><a href="' + SITE_URL + '">Back to the website</a></p></div>').setTitle('Nexus CAD Studio');
}

function setting_(label) {
  const r = settings_().getDataRange().getValues().slice(1).find((x) => String(x[0]).trim().toLowerCase() === label.toLowerCase());
  return r ? String(r[1]).trim() : '';
}

// Hourly: emails each new article to subscribers once it is live on the website
function newsletterJob() {
  if (/^no$/i.test(setting_('Email new articles to subscribers'))) return;
  const sh = articles_();
  const rows = sh.getDataRange().getValues();
  const people = subscribers_().getDataRange().getValues().slice(1)
    .filter((r) => validEmail_(r[0]) && !/^unsub/i.test(String(r[4]))).map((r) => ({ email: String(r[0]).trim(), name: String(r[1] || '').trim() }));
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const status = String(r[9] || '');
    if (!published_(r) || !r[7] || /^no$/i.test(String(r[8]).trim()) || (status && !/^sending/i.test(status))) continue;
    const url = SITE_URL + 'blog/' + r[7] + '.html';
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) continue;                       // not live yet: try next hour
    const page = res.getContentText();
    const img = (/<meta property="og:image" content="([^"]+)"/.exec(page) || [])[1] || '';
    const title = String(r[0]).trim(), summary = String(r[4] || '').trim();
    let done = /^sending (\d+)/i.test(status) ? Number(/^sending (\d+)/i.exec(status)[1]) : 0;
    for (; done < people.length; done++) {
      if (MailApp.getRemainingDailyQuota() <= 10) break;                // keep some for client emails; carry on tomorrow
      const p = people[done];
      const unsub = unsubLink_(p.email);
      MailApp.sendEmail({
        to: p.email, name: SENDER, subject: 'New on CAD Tips: ' + title,
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
          '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 10px">CAD TIPS · NEXUS CAD STUDIO</p>' +
          (img ? '<a href="' + url + '"><img src="' + html_(img) + '" alt="" style="width:100%;border-radius:14px;display:block;margin-bottom:16px"></a>' : '') +
          '<h2 style="margin:0 0 10px;font-size:22px">' + html_(title) + '</h2>' +
          (summary ? '<p style="margin:0 0 18px;color:#333">' + html_(summary) + '</p>' : '') +
          '<p style="margin:0 0 22px"><a href="' + url + '" style="background:#0e1a3a;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Read the article</a></p>' +
          '<p style="font-size:13px;color:#555">Need help with a design? <a href="' + SITE_URL + '#brief">Start a project</a> or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
          '<p style="margin-top:24px;font-size:11px;color:#888">You are receiving this because you signed up for CAD tips on ' + SITE_URL.replace(/^https:\/\//, '').replace(/\/$/, '') + '. <a href="' + unsub + '" style="color:#888">Unsubscribe</a></p></div>',
        body: title + '\n\n' + summary + '\n\nRead it: ' + url + '\n\nUnsubscribe: ' + unsub
      });
    }
    sh.getRange(i + 1, 10).setValue(done >= people.length
      ? 'Sent to ' + people.length + ' subscriber' + (people.length === 1 ? '' : 's') + ' on ' + Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd MMM yyyy')
      : 'Sending ' + done + ' of ' + people.length + ' (continues tomorrow)');
    if (done < people.length) return;
  }
}

/* ---------- Monday summary email to you ---------- */
function weeklySummary() {
  if (/^no$/i.test(setting_('Monday summary email'))) return;
  const me = Session.getEffectiveUser().getEmail();
  if (!me) return;
  const tz = 'Africa/Nairobi', now = new Date(), weekAgo = new Date(now.getTime() - 7 * 864e5), soon = new Date(now.getTime() + 7 * 864e5);
  const fmt = (d) => d instanceof Date ? Utilities.formatDate(d, tz, 'd MMM') : String(d || '');
  const section = (title, items, empty) => '<h3 style="margin:22px 0 8px;font-size:15px">' + title + '</h3>' +
    (items.length ? '<ul style="margin:0;padding-left:18px">' + items.map((t) => '<li style="margin:4px 0">' + t + '</li>').join('') + '</ul>' : '<p style="margin:0;color:#777">' + empty + '</p>');

  const briefs = subs_().getDataRange().getValues().slice(1).filter((r) => r[0]);
  const newBriefs = briefs.filter((r) => r[1] instanceof Date && r[1] >= weekAgo);
  const waiting = briefs.filter((r) => /^(new|reviewing)$/i.test(String(r[2]).trim()));
  const projects = projects_().getDataRange().getValues().slice(1).filter((r) => r[0] && !/^delivered$/i.test(String(r[3]).trim()) && !/^DEMO/i.test(String(r[0])));
  const due = projects.filter((r) => r[5] instanceof Date && r[5] <= soon);
  const owed = projects.filter((r) => num_(r[8]) > 0);
  const reviews = sheet_().getDataRange().getValues().slice(1).filter((r) => r[0] instanceof Date && r[0] >= weekAgo && !/^(hide|hidden|no|spam|delete)$/i.test(String(r[7]).trim()));
  const subsAll = subscribers_().getDataRange().getValues().slice(1).filter((r) => r[0] && !/^unsub/i.test(String(r[4])));
  const subsNew = subsAll.filter((r) => r[2] instanceof Date && r[2] >= weekAgo);
  const owedTotal = owed.reduce((a, r) => a + num_(r[8]), 0);
  const invRows = invoices_().getDataRange().getValues().slice(1);
  const unpaid = invRows.filter((r) => String(r[1]).trim() === 'Invoice' && String(r[10]).trim() === 'Sent' && num_(r[7]) - num_(r[8]) > 0 && !invoicePaid_(r, invRows));

  const stat = (n, label) => '<td style="padding:12px;background:#f6f1e7;border-radius:12px;text-align:center"><div style="font-size:22px;font-weight:bold">' + n + '</div><div style="font-size:11px;color:#666">' + label + '</div></td>';
  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0e1a3a">' +
    '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · WEEKLY SUMMARY</p>' +
    '<h2 style="margin:0 0 14px">Good morning, Edison</h2>' +
    '<table width="100%" cellspacing="6"><tr>' + stat(newBriefs.length, 'new briefs') + stat(projects.length, 'active projects') + stat(kes_(owedTotal), 'balances due') + stat(subsAll.length, 'subscribers') + '</tr></table>' +
    section('New briefs this week', newBriefs.map((r) => '<b>' + html_(r[0]) + '</b> · ' + html_(r[3]) + ' · ' + html_(r[6]) + (r[7] ? ' · ' + html_(r[7]) : '') + ' <span style="color:#777">(' + html_(r[2]) + ')</span>'), 'No new briefs this week.') +
    section('Briefs waiting for you', waiting.map((r) => '<b>' + html_(r[0]) + '</b> · ' + html_(r[3]) + ' · ' + html_(r[2]) + ' since ' + fmt(r[1])), 'None: every brief has a reply.') +
    section('Due within 7 days or overdue', due.map((r) => '<b>' + html_(r[1] || r[0]) + '</b> · ' + html_(r[2]) + ' · due ' + fmt(r[5]) + (r[5] < now ? ' <b style="color:#c4422a">overdue</b>' : '') + ' · ' + html_(r[3])), 'Nothing due this week.') +
    section('Active projects', projects.map((r) => '<b>' + html_(r[1] || r[0]) + '</b> · ' + html_(r[2]) + ' · ' + html_(r[3]) + (r[5] instanceof Date ? ' · due ' + fmt(r[5]) : '')), 'No active projects.') +
    section('Balances to collect', owed.map((r) => '<b>' + html_(r[1] || r[0]) + '</b> · ' + html_(r[2]) + ' · ' + kes_(r[8])), 'All paid up.') +
    section('Unpaid invoices', unpaid.map((r) => '<b>' + html_(r[0]) + '</b> · ' + html_(r[4]) + ' · ' + kes_(num_(r[7]) - num_(r[8])) + ' · sent ' + fmt(r[2]) + (r[13] ? ' <span style="color:#777">(' + html_(r[13]) + ')</span>' : '')), 'No unpaid invoices.') +
    section('New reviews', reviews.map((r) => '★'.repeat(Math.min(5, Number(r[4]) || 5)) + ' <b>' + html_(r[1]) + '</b>: “' + html_(String(r[5]).slice(0, 140)) + (String(r[5]).length > 140 ? '…' : '') + '”'), 'No new reviews this week.') +
    '<p style="margin-top:22px">Subscribers: <b>' + subsAll.length + '</b> (' + subsNew.length + ' new this week)</p>' +
    '<p style="margin-top:22px"><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" style="background:#0e1a3a;color:#fff;padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:bold">Open your sheet</a></p>' +
    '<p style="font-size:11px;color:#888;margin-top:20px">Turn this email off in the Settings tab (Monday summary email: No).</p></div>';
  MailApp.sendEmail({ to: me, subject: 'Your week: ' + newBriefs.length + ' new brief' + (newBriefs.length === 1 ? '' : 's') + ', ' + projects.length + ' active project' + (projects.length === 1 ? '' : 's'), htmlBody: html, name: 'Nexus CAD Studio website' });
}

/* ---------- Settings tab ---------- */
const SETTINGS = 'Settings';
const SROWS = [
  ['Availability', 'available', 'available, limited or booked (choose from the list)'],
  ['Booked until', '', 'Only when booked: when you can take new projects, e.g. 30 November 2026'],
  ['Availability message', '', 'Optional: your own wording for the badge. Leave empty for the standard text'],
  ['Webinar day', '', 'Day of the weekly free webinar, e.g. Saturday. Leave empty to hide the countdown'],
  ['Webinar time', '', '24-hour Nairobi time, e.g. 18:00'],
  ['Announcement', '', 'Optional short message shown at the top of the homepage, e.g. Christmas offer: 15% off posters'],
  ['Announcement link', '', 'Optional: where the announcement goes when tapped, e.g. #pricing or a full https:// link'],
  ['Training next intake', SEED_TRAINING.intake, 'Training page: e.g. Saturday classes from 7 November 2026. Leave empty for "Dates on request"'],
  ['Training starting price (KES)', SEED_TRAINING.price, 'Training page: starting price per trainee, e.g. 4500'],
  ['Monday summary email', 'Yes', 'Yes = every Monday morning you get an email summary of briefs, projects, balances, reviews and subscribers'],
  ['Email new articles to subscribers', 'Yes', 'Yes = each new article is emailed to the Subscribers tab once it is live on the website'],
  ['Payment reminders', 'Yes', 'Yes = unpaid invoices get a polite reminder email after 7 and 14 days (stops once you send a receipt)']
];

function settings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS);
  if (sh) {
    // Add any settings introduced by a newer version of this script
    const have = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map((r) => String(r[0]).trim().toLowerCase());
    SROWS.filter((r) => have.indexOf(r[0].toLowerCase()) < 0).forEach((r) => {
      sh.appendRow(r);
      sh.getRange(sh.getLastRow(), 2).setNumberFormat('@');
      sh.getRange(sh.getLastRow(), 3).setFontColor('#666666');
    });
    return sh;
  }
  sh = ss.insertSheet(SETTINGS);
  sh.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'What it does']]).setFontWeight('bold');
  sh.getRange(2, 2, SROWS.length, 1).setNumberFormat('@');   // keep times like 18:00 as typed
  sh.getRange(2, 1, SROWS.length, 3).setValues(SROWS);
  sh.getRange('B2').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['available', 'limited', 'booked'], true).build());
  sh.getRange('B5').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], true).setAllowInvalid(true).build());
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 300);
  sh.setColumnWidth(3, 560);
  sh.getRange('C2:C20').setFontColor('#666666');
  return sh;
}

function readSettings_() {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const map = {};
  settings_().getDataRange().getValues().slice(1).forEach((r) => {
    let v = r[1];
    if (v instanceof Date) v = v.getFullYear() < 1901 ? Utilities.formatDate(v, tz, 'HH:mm') : Utilities.formatDate(v, tz, 'd MMMM yyyy');
    map[String(r[0]).trim().toLowerCase()] = String(v == null ? '' : v).trim();
  });
  const status = (map['availability'] || 'available').toLowerCase();
  const link = map['announcement link'] || '';
  return {
    availability: {
      status: ['available', 'limited', 'booked'].indexOf(status) > -1 ? status : 'available',
      from: map['booked until'] || '',
      text: map['availability message'] || ''
    },
    webinar: { day: map['webinar day'] || '', time: map['webinar time'] || '' },
    announcement: { text: map['announcement'] || '', link: /^(https?:\/\/|#)/i.test(link) ? link : '' }
  };
}

// Run once from the editor after pasting this script: creates the tabs and
// turns on the automatic client emails (Google will ask for permission).
function setup() {
  sheet_();
  const p = projects_();
  if (!p.getRange(1, 12).getValue()) p.getRange(1, 12).setValue('Client email').setFontWeight('bold');
  if (!p.getRange(1, 13).getValue()) p.getRange(1, 13, 1, 2).setValues([[PHEAD[12], PHEAD[13]]]).setFontWeight('bold');
  const co = courses_();
  if (!co.getRange(1, 6).getValue()) co.getRange(1, 6, 1, 2).setValues([[COHEAD[5], COHEAD[6]]]).setFontWeight('bold').setWrap(true);
  trainees_();
  settings_();
  subs_();
  articles_();
  works_();
  pricing_();
  certs_();
  courses_();
  recordings_();
  const inv = invoices_();
  if (!inv.getRange(1, 14).getValue()) inv.getRange(1, 14).setValue(IHEAD[13]).setFontWeight('bold').setWrap(true);
  subscribers_();
  const a = articles_();
  if (!a.getRange(1, 9).getValue()) {
    a.getRange(1, 9, 1, 2).setValues([['Email to subscribers?', 'Emailed (automatic)']]).setFontWeight('bold');
    // Articles already published before the newsletter existed are not emailed
    const n = a.getLastRow() - 1;
    if (n > 0) a.getRange(2, 10, n, 1).setValues(a.getRange(2, 2, n, 1).getValues().map((r) => [/published/i.test(r[0]) ? 'Published before the newsletter' : '']));
    a.getRange(2, 9, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(YESNO, true).build());
  }
  ScriptApp.getProjectTriggers()
    .filter((t) => ['notifyClient', 'weeklySummary', 'newsletterJob', 'reminderJob'].indexOf(t.getHandlerFunction()) > -1)
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('notifyClient').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('weeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).inTimezone('Africa/Nairobi').create();
  ScriptApp.newTrigger('newsletterJob').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('reminderJob').timeBased().everyDays(1).atHour(9).inTimezone('Africa/Nairobi').create();
}

// "Website" menu at the top of the sheet
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website')
    .addItem('Send me the weekly summary now', 'weeklySummary')
    .addItem('Email new articles to subscribers now', 'newsletterJob')
    .addSeparator()
    .addItem('Set up / repair (run after updating the script)', 'setup')
    .addToUi();
}

/* ---------- Automatic email to the client when you change a project's Stage ---------- */
const html_ = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// One email layout for every client update
function mail_(to, subject, name, message, stageLabel, progress, note, ref) {
  const link = SITE_URL + 'track/?ref=' + encodeURIComponent(String(ref));
  const bar = progress === null ? '' :
    '<div style="background:#eef0f6;border-radius:99px;height:10px;margin:0 0 6px"><div style="background:#13a89e;height:10px;border-radius:99px;width:' + Math.max(3, Math.min(100, progress)) + '%"></div></div>' +
    '<p style="margin:0 0 16px;font-size:13px;color:#555">' + html_(stageLabel) + ' · ' + progress + '% complete</p>';
  const body =
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · PROJECT UPDATE</p>' +
      '<p style="margin:0 0 10px">Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
      '<p style="margin:0 0 14px">' + message + '</p>' + bar +
      (note ? '<div style="border-left:4px solid #ffb627;background:#fbf6ec;padding:12px 14px;margin:0 0 18px"><b style="font-size:12px;color:#555">NOTE FROM EDISON</b><br>' + html_(note) + '</div>' : '') +
      '<p style="margin:0 0 20px"><a href="' + link + '" style="background:#0e1a3a;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Track your project</a></p>' +
      '<p style="margin:0 0 4px;font-size:13px;color:#555">Your reference: <b>' + html_(ref) + '</b></p>' +
      '<p style="margin:0;font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
      '<p style="margin:18px 0 0">Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p>' +
    '</div>';
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: body, name: SENDER,
    body: message.replace(/<[^>]+>/g, '') + (note ? ' Note: ' + note : '') + ' Track it here: ' + link + ' (reference ' + ref + ')' });
}

const validEmail_ = (t) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(t || '').trim());

// Runs on every edit (installed by setup): client emails + moving accepted briefs
function notifyClient(e) {
  if (!e || !e.range || e.range.getNumRows() !== 1 || e.range.getRow() < 2) return;
  const sh = e.range.getSheet();
  if (e.oldValue !== undefined && String(e.oldValue) === String(e.value)) return;
  if (sh.getName() === SUBS && e.range.getColumn() === 3) return submissionChanged_(sh, e.range.getRow());
  if (sh.getName() === INVOICES && e.range.getColumn() === 11 && /^send$/i.test(String(e.value || ''))) return sendInvoice_(sh, e.range.getRow());
  if (sh.getName() === TRAINEES && e.range.getColumn() === 9) return traineeChanged_(sh, e.range.getRow());
  if (sh.getName() !== PROJECTS || e.range.getColumn() !== 4) return;
  const r = sh.getRange(e.range.getRow(), 1, 1, 12).getValues()[0];
  const to = String(r[11] || '').trim();
  const stage = String(r[3] || '').trim();
  if (!validEmail_(to) || !stage || !r[0]) return;
  const i = STAGES.findIndex((s) => s.toLowerCase() === stage.toLowerCase());
  const progress = r[4] !== '' && !isNaN(Number(r[4])) ? Number(r[4]) : Math.round(Math.max(0, i) / (STAGES.length - 1) * 100);
  const name = String(r[1] || 'your project');
  const done = i === STAGES.length - 1;
  mail_(to, (done ? 'Delivered: ' : 'Project update: ') + name + (done ? '' : ' is now at "' + stage + '"'), String(r[2] || ''),
    done ? 'Good news: <b>' + html_(name) + '</b> is <b>delivered</b>.' : '<b>' + html_(name) + '</b> has moved to a new stage: <b>' + html_(stage) + '</b>.',
    stage, progress, String(r[6] || ''), String(r[0]));
  sh.getRange(e.range.getRow(), 11).setValue(new Date());
}

function submissionChanged_(sh, row) {
  const r = sh.getRange(row, 1, 1, SHEAD.length).getValues()[0];
  const ref = String(r[0] || ''), status = String(r[2] || '').trim(), name = String(r[3] || ''), email = String(r[4] || '').trim();
  const title = String(r[7] || r[6] || 'your project'), note = String(r[11] || '');
  if (!ref) return;
  if (status === 'Accepted' && !r[12]) {
    // Into the Projects tab, ready for the deposit
    projects_().appendRow([ref, title, name, 'Quote sent', '', r[9] || '', note, 'Due', '', '', new Date(), email]);
    sh.getRange(row, 13).setValue('Yes, ' + Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd MMM yyyy'));
  }
  if (!validEmail_(email)) return;
  const msg = {
    'Reviewing': 'I am now reviewing your brief for <b>' + html_(title) + '</b>. I will send you a quote and timeline shortly.',
    'Quote sent': 'Your quote for <b>' + html_(title) + '</b> is ready. Please check your messages, and let me know if you have any questions.',
    'Accepted': 'Great news: I have accepted <b>' + html_(title) + '</b>. Once the deposit is paid, the design work begins. You can pay by M-Pesa from your tracking page.',
    'Declined': 'Thank you for considering me for <b>' + html_(title) + '</b>. Unfortunately I can\'t take on this project at the moment.'
  }[status];
  if (!msg) return;
  const stage = status === 'Accepted' || status === 'Quote sent' ? 'Quote sent' : 'Brief received';
  mail_(email, 'Project update (' + ref + '): ' + (status === 'Declined' ? 'about your brief' : status.toLowerCase()), name, msg,
    stage, status === 'Declined' ? null : (stage === 'Quote sent' ? 20 : 5), note, ref);
}

// Stamps "Last updated" whenever you edit a project row
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() === INVOICES && e.range.getColumn() === 4 && e.range.getRow() > 1) return fillInvoice_(sh, e.range.getRow());
  if (sh.getName() !== PROJECTS || e.range.getRow() < 2 || e.range.getColumn() === 11) return;
  sh.getRange(e.range.getRow(), 11).setValue(new Date());
}

const normRef_ = (r) => String(r || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const ymd_ = (d) => (d instanceof Date ? Utilities.formatDate(d, 'Africa/Nairobi', 'yyyy-MM-dd') : String(d || ''));

function track_(ref) {
  const want = normRef_(ref);
  if (want.length < 6) return { found: false };
  // Slow down anyone guessing references: after 40 misses in 10 minutes, pause lookups
  const cache = CacheService.getScriptCache();
  const misses = Number(cache.get('track-miss') || 0);
  if (misses >= 40) return { error: 'busy' };
  const rows = projects_().getDataRange().getValues().slice(1);
  const r = rows.find((x) => x[0] && normRef_(x[0]) === want);
  if (!r) {
    const sub = subs_().getDataRange().getValues().slice(1).find((x) => x[0] && normRef_(x[0]) === want);
    if (sub) return { found: true, project: fromSubmission_(sub) };
    cache.put('track-miss', String(misses + 1), 600);
    return { found: false };
  }
  const stageTxt = String(r[3] || '').trim();
  let stage = STAGES.findIndex((s) => s.toLowerCase() === stageTxt.toLowerCase());
  if (stage < 0) stage = Math.max(0, Math.min(5, parseInt(stageTxt, 10) || 0));
  const p = {
    ref: String(r[0]),
    project: String(r[1] || ''),
    client: String(r[2] || ''),
    stage: stage,
    due: ymd_(r[5]),
    note: String(r[6] || ''),
    deposit: String(r[7] || '').trim().toLowerCase(),
    files: /^https?:\/\//i.test(String(r[9] || '')) ? String(r[9]) : '',
    updated: ymd_(r[10])
  };
  if (r[4] !== '' && !isNaN(Number(r[4]))) p.progress = Number(r[4]);
  if (r[8] !== '' && !isNaN(Number(r[8]))) p.amountDue = Number(r[8]);
  const appr = String(r[12] || '');
  if (appr) p.approval = { state: /^approved/i.test(appr) ? 'approved' : 'changes', date: (/·\s*(.+)$/.exec(appr) || [])[1] || '' };
  return { found: true, project: p };
}

function reviews_() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const hidden = /^(hide|hidden|no|spam|delete)$/i;
  return rows
    .filter((r) => r[1] && r[5] && !hidden.test(String(r[7]).trim()))
    .reverse()
    .slice(0, 60)
    .map((r) => ({
      name: String(r[1]),
      role: String(r[2] || ''),
      service: String(r[3] || ''),
      rating: Number(r[4]) || 5,
      text: String(r[5]),
      project: String(r[6] || ''),
      date: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Africa/Nairobi', 'MMM yyyy') : ''
    }));
}

// A brief that hasn't been moved to Projects yet
function fromSubmission_(r) {
  const status = String(r[2] || 'New').trim();
  const label = { 'New': 'Brief received', 'Reviewing': 'Reviewing your brief', 'Quote sent': 'Quote sent', 'Accepted': 'Accepted', 'Declined': 'Not taken on' }[status] || 'Brief received';
  const defaults = {
    'New': 'Thank you, your brief has arrived. I will review it and send you a quote and timeline soon.',
    'Reviewing': 'I am reviewing your brief and will send you a quote and timeline soon.',
    'Quote sent': 'Your quote has been sent. Let me know if you have any questions.',
    'Accepted': 'Your project has been accepted. Once the deposit is paid, the design work begins.',
    'Declined': 'Unfortunately I can\'t take on this project at the moment. Thank you for thinking of me.'
  };
  return {
    ref: String(r[0]),
    project: String(r[7] || r[6] || ''),
    client: String(r[3] || ''),
    stage: status === 'Quote sent' || status === 'Accepted' ? 1 : 0,
    status: label,
    declined: status === 'Declined',
    note: String(r[11] || '') || defaults[status] || defaults['New'],
    updated: ymd_(r[1])
  };
}

function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.action === 'track') return out_(track_(q.ref));
  if (q.action === 'site') return out_({ reviews: reviews_(), settings: readSettings_() });   // homepage: one request
  if (q.action === 'settings') return out_(readSettings_());
  if (q.action === 'content') return out_(content_());          // used by the website's GitHub automation
  if (q.action === 'image') return out_(image_(q));
  if (q.action === 'unsubscribe') return unsubscribePage_(q);
  if (q.action === 'training') return out_(trainingInfo_());
  if (q.action === 'verify') return out_(verify_(q.code));
  return out_(reviews_());
}

function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
