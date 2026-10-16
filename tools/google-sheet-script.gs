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
const PHEAD = ['Reference', 'Project', 'Client', 'Stage', 'Progress %', 'Due date', 'Note to client', 'Deposit', 'Balance due (KES)', 'Files link', 'Last updated', 'Client email'];
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
const AHEAD = ['Title', 'Status', 'Date', 'Google Doc link', 'Summary (1–2 sentences)', 'Cover photo (Google Drive link)', 'Tags (comma separated)', 'Web address (automatic)'];
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
const articles_ = () => contentTab_(ARTICLES, AHEAD, [260, 100, 110, 280, 320, 260, 200, 220],
  ['Example: How I choose materials for a prototype', 'Draft', new Date(), 'Paste a Google Doc link here', 'One or two sentences shown on the blog card and in Google results.', '', 'Product design, Materials', '']);
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
  return { articles: articles, works: works };
}

// A photo, only if it belongs to something Published (nothing else in your Drive can be fetched)
function image_(q) {
  const arts = articles_().getDataRange().getValues().slice(1).filter(published_);
  let blob = null;
  if (q.doc) {
    if (arts.some((r) => driveId_(r[3]) === q.doc) && Number(q.n) >= 0) blob = docImage_(q.doc, Number(q.n));
  } else if (q.id) {
    const ok = arts.some((r) => driveId_(r[5]) === q.id) ||
      works_().getDataRange().getValues().slice(1).filter(published_).some((r) => photoIds_(r[8]).some((p) => p.id === q.id));
    if (ok) blob = DriveApp.getFileById(q.id).getBlob();
  }
  if (!blob) return { ok: false };
  return { ok: true, type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
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
  ['Announcement link', '', 'Optional: where the announcement goes when tapped, e.g. #pricing or a full https:// link']
];

function settings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS);
  if (sh) return sh;
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
  settings_();
  subs_();
  articles_();
  works_();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'notifyClient')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('notifyClient').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
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
  return out_(reviews_());
}

function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
