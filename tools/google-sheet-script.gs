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
   with its own page within about 30 minutes. Optional "Before image" and
   "After image" (e.g. CAD model and FEA result) add a drag-to-compare
   slider to the project page; with only one of them, it is shown as a photo.
   To add a before / after pair to one of the projects already on the site
   (e.g. EV Battery Pack Cooling), add a row with exactly that project's
   title, fill in only the two images, and publish it.

   ACCOUNTS tab: people who made an account on the website (they log in with a
   code sent to their email; there are no passwords). Set Status to "Blocked" to
   switch one off. Their account page shows their exam pass / Quote Pro keys,
   training, projects and invoices from your other tabs, matched by email.
   EXAM RESULTS tab: practice exams finished by people who are logged in.
   CVS tab: the CV each account saved in the website's CV tailor (cv-tailor/),
   and when they accepted its terms. Only that person can read it from the
   website. To delete someone's CV (if they ask), delete their row.

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

   FAQ tab: the website's questions and answers. Formatting in answers:
   **bold**, [link text](#brief) or [link text](https://...). The site
   updates within about 30 minutes.

   EXPENSES tab: what you spend on the business. On the 1st of every month
   you get an email with last month's income (from receipts), expenses and
   profit, by service; this year's totals are in the Monday summary.

   FOLLOW-UPS: a day after you set a project to "Delivered", the client is
   asked for a review; a year later they get a friendly "anything new?"
   email. Type Off in the project's Follow-ups cell to skip both.

   BACKUPS: every Sunday a copy of this whole sheet is saved in your Drive
   folder "Nexus CAD Studio sheet backups" (the last 8 are kept).

   QUOTES: send a Quote from the Invoices tab and the client can accept it
   on their tracking page (the email has a "Review & accept" button). It
   then becomes a project on the tracker and its deposit invoice is sent
   (deposit % in Settings). A quote without a reference gets one.

   PAYMENTS tab: after paying by M-Pesa, clients type their confirmation
   code on the tracking page. You get an email; check your M-Pesa messages
   and set Status to "Confirmed": the receipt is created and sent for you.

   QUOTE PRO tab: paid licences for the quote tools (/quote/, /steel/) and
   the SolidWorks exam practice pass (/exams/, plan "Exams").
   Buyers pay by M-Pesa and send the code from the tool; you get an email.
   Set Status to "Confirmed" and their licence key and receipt are emailed
   for them. "Cancelled" switches a key off. Renewal reminders are automatic.

   DASHBOARD tab: charts and totals (income per month, projects by stage,
   income by service, ratings, trainees, profit per project). It refreshes
   every morning and whenever you open the sheet.

   REFERRALS tab: delivered clients get a personal referral code. A friend
   who uses it gets a discount, and once the friend pays, the client earns
   a reward they claim by using their own code on their next project.

   PROMO CODES tab: your own discount codes (e.g. TRAIN20 = 20% off
   training) with an expiry date and a usage limit. Clients type them on
   the brief, quote cart or training form; the discount is applied to
   their quote or invoice automatically.

   TIME LOG tab: hours worked per project reference. The monthly report
   and the dashboard show each project's profit and your real hourly rate.
   (The Expenses tab has a "Project reference" column for project costs.)

   DOWNLOADS tab: free resources (e.g. shortcut cheat sheets) that visitors
   get by email in exchange for their address; they join your Subscribers.

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
  if (p.cb || p.mpesa) return out_(mpesaCallback_(e));               // Safaricom: result of an M-Pesa prompt
  if (p.botcheck) return out_({ ok: true });                       // bots fill the hidden box
  if (p.action === 'brief') return out_(brief_(p));
  if (p.action === 'subscribe') return out_(subscribe_(p));
  if (p.action === 'reserve') return out_(reserve_(p));
  if (p.action === 'feedback') return out_(feedback_(p));
  if (p.action === 'accept') return out_(acceptQuote_(p));
  if (p.action === 'payment') return out_(payment_(p));
  if (p.action === 'download') return out_(download_(p));
  if (p.action === 'syllabus') return out_(syllabus_(p));
  if (p.action === 'pro') return out_(proRequest_(p));
  if (p.action === 'account-result' || p.action === 'account-update') return out_(accountPost_(p));
  if (p.action === 'cv-save' || p.action === 'cv-terms' || p.action === 'cv-delete') return out_(cvPost_(p));
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
const PHEAD = ['Reference', 'Project', 'Client', 'Stage', 'Progress %', 'Due date', 'Note to client', 'Deposit', 'Balance due (KES)', 'Files link', 'Last updated', 'Client email', 'Client approval (automatic)', 'Client feedback (automatic)', 'Follow-ups (automatic; type Off to skip)',
  'Final files link (Google Drive; the client\'s Download button appears at 100%)'];
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
const SHEAD = ['Reference', 'Received', 'Status', 'Name', 'Email', 'Phone / WhatsApp', 'Service', 'Project', 'Budget', 'Deadline', 'Brief details', 'Note to client', 'Moved to Projects', 'Discount / referral code (automatic)'];

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

// Instant Gmail alert to you (the sheet's owner) for a new request from the website.
// fields: [[label, value], ...]. Reply goes straight to the client; buttons for WhatsApp and the sheet.
function newRequestAlert_(o) {
  if (!/^yes$/i.test(setting_(o.setting) || 'Yes')) return;
  const me = Session.getEffectiveUser().getEmail();
  if (!me) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss.getSheetByName(o.tab);
  const sheetUrl = ss.getUrl() + (tab ? '#gid=' + tab.getSheetId() : '');
  let wa = String(o.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (/^0[17]\d{8}$/.test(wa)) wa = '254' + wa.slice(1);   // Kenyan 07.. / 01.. numbers
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(o.email || ''));
  const btn = (href, label, bg) => '<a href="' + html_(href) + '" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:999px;background:' + bg + ';color:#0e1a3a;font-weight:bold;text-decoration:none">' + label + '</a>';
  const rows = o.fields.filter((f) => String(f[1] == null ? '' : f[1]).trim()).map((f) =>
    '<tr><td style="padding:6px 12px 6px 0;color:#646a82;vertical-align:top;white-space:nowrap">' + html_(f[0]) + '</td><td style="padding:6px 0;vertical-align:top">' +
    html_(String(f[1])).replace(/\n/g, '<br>') + '</td></tr>').join('');
  MailApp.sendEmail({
    to: me, name: 'Nexus CAD Studio website', subject: o.subject,
    replyTo: validEmail ? o.email : undefined,
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;color:#0e1a3a">' +
      '<p style="margin:0 0 4px;color:#646a82;font-size:13px">' + html_(o.kicker) + '</p>' +
      '<h2 style="margin:0 0 14px;font-size:20px">' + html_(o.title) + '</h2>' +
      '<table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">' + rows + '</table>' +
      (validEmail ? btn('mailto:' + o.email + '?subject=' + encodeURIComponent('Re: ' + o.title), 'Reply by email', '#ffb627') : '') +
      (wa.length >= 9 ? btn('https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi ' + String(o.name || '').split(' ')[0] + ', this is Edison from Nexus CAD Studio. ' + o.waText), 'WhatsApp the client', '#25d366') : '') +
      btn(sheetUrl, 'Open in the sheet', '#e9edf5') +
      '<p style="color:#646a82;font-size:12px;margin-top:14px">Pressing Reply answers ' + html_(o.name || 'the client') + ' directly. Turn these emails off in the Settings tab ("' + html_(o.setting) + '").</p></div>'
  });
}

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
    const code = useCode_(p.code, { for: p.service, email: email, name: name, ref: ref });
    sh.appendRow([ref, new Date(), 'New', name, email, clean_(p.phone, 40), clean_(p.service, 60), clean_(p.project, 160),
      clean_(p.budget, 80), clean_(p.deadline, 80), cleanLong_(p.details, 5000), '', '', code]);
  } finally {
    lock.releaseLock();
  }
  try {
    const project = clean_(p.project, 160);
    newRequestAlert_({
      setting: 'Email me new project briefs', tab: SUBS, email: email, phone: p.phone, name: name,
      subject: '🆕 New project brief: ' + (project || clean_(p.service, 60) || 'quote request') + ' (' + ref + ')',
      kicker: 'New project brief from the website', title: (project || 'Quote request') + ', from ' + name,
      waText: 'Thanks for your brief (' + ref + ')' + (project ? ' for ' + project : '') + '.',
      fields: [['Reference', ref], ['Name', name], ['Email', email], ['Phone / WhatsApp', clean_(p.phone, 40)], ['Service', clean_(p.service, 60)],
        ['Project', project], ['Budget', clean_(p.budget, 80)], ['Deadline', clean_(p.deadline, 80)], ['Discount code', clean_(p.code, 30)], ['Details', cleanLong_(p.details, 5000)]]
    });
  } catch (err) { console.error('brief alert: ' + err); }   // the brief is saved either way
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
const WHEAD = ['Title', 'Status', 'Category', 'Subtitle', 'Year', 'Summary', 'Highlights (one per line)', 'Software / tags (comma separated)', 'Photos (Drive folder link, or Drive photo links one per line)', 'Web address (automatic)', 'Job portfolio (Yes/No; empty = Yes)', 'Client deliverables (comma separated, e.g. 3D assembly, Drawings, Renders)', 'Outcome (one line shown on the card)',
  'Before image (optional: CAD model or raw geometry, a Google Drive photo link)', 'After image (optional: FEA result or final prototype, a Google Drive photo link)', 'Before / after labels (optional, e.g. CAD model | FEA result)'];

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
    let photos = [], error = '', before = null, after = null;
    try { photos = photoIds_(r[8]); } catch (err) { error = 'Could not open the photos: ' + err.message; }
    // Before / after comparison slider on the project page (either image may be empty)
    try { if (driveId_(r[13])) before = fileRef_(DriveApp.getFileById(driveId_(r[13]))); } catch (err) { error += ' Could not open the before image: ' + err.message; }
    try { if (driveId_(r[14])) after = fileRef_(DriveApp.getFileById(driveId_(r[14]))); } catch (err) { error += ' Could not open the after image: ' + err.message; }
    return {
      slug: String(r[9]), title: String(r[0]).trim(),
      category: /graphic/i.test(r[2]) ? 'graphic' : 'engineering',
      subtitle: String(r[3] || '').trim(), year: String(r[4] || '').trim(), summary: String(r[5] || '').trim(),
      points: String(r[6] || '').split(/\n+/).map((t) => t.replace(/^[-•*]\s*/, '').trim()).filter(Boolean),
      tags: String(r[7] || '').split(',').map((t) => t.trim()).filter(Boolean),
      photos: photos, error: error,
      portfolio: !/^no$/i.test(String(r[10] == null ? '' : r[10]).trim()),   // "No" = main site only, hidden from the job-application portfolio
      deliverables: String(r[11] || '').split(',').map((t) => t.trim()).filter(Boolean),
      outcome: String(r[12] || '').trim(),
      compare: { before: before, after: after, labels: String(r[15] || '').trim() }
    };
  });
  return { articles: articles, works: works, site: siteLists_(), translations: translationsOut_(), campaign: campaignSafe_(true) };
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
      works_().getDataRange().getValues().slice(1).filter(published_).some((r) => driveId_(r[13]) === q.id || driveId_(r[14]) === q.id || photoIds_(r[8]).some((p) => p.id === q.id)) ||
      campaignRows_(false).some((c) => driveId_(c.r[7]) === q.id) ||
      studentsTab_().getDataRange().getValues().slice(1).filter(studentShown_).some((r) => photoIds_(r[3]).some((p) => p.id === q.id));
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
const CEHEAD = ['Certificate', 'Issued by', 'Credential link', 'Certificate image (Google Drive link, optional)', 'Show on website', 'Job portfolio (Yes/No; empty = Yes)'];
const COHEAD = ['Course', 'Tagline', 'Level', 'Topics (one per line)', 'Show on website', 'Next class (e.g. Saturdays from 7 Nov 2026)', 'Seats (empty = no limit)',
  'Sessions (e.g. 10 sessions of 2 hours)', 'Projects trainees build (one per line)',
  'Class starts (date, shows a countdown on the website)', 'Announce this class to interested people? (Yes)', 'Announced (automatic)'];
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
const FAQ = 'FAQ';
const FQHEAD = ['Question', 'Answer (**bold**, [link text](#brief or https://...))', 'Show on website'];
const SEED_FAQ = [["What services do you offer?", "Two kinds of work through Nexus CAD Studio. **Engineering design:** 3D CAD modelling, 2D manufacturing drawings, FEA/CFD simulation, sheet metal and fabrication design, product renders and CAD training. **Graphic design:** posters, branding, certificates, social media graphics, print layouts and motion graphics.", "Yes"], ["Which software do you work with?", "For engineering: SolidWorks (including CSWA exam preparation), Autodesk Inventor, AutoCAD, Fusion 360, Revit and Abaqus. For graphics: Adobe Illustrator, Photoshop, InDesign and Premiere Pro. If you need files in a specific program, just tell me in the project brief.", "Yes"], ["How do I start a project?", "Fill in the [project brief](#brief) above. It takes about two minutes and covers everything I need to understand your project. You can also message me directly on WhatsApp.", "Yes"], ["How much will my project cost?", "Pricing depends on complexity, the files you need and how soon you need them. Once I have your brief, I'll send a clear quote before any work starts, so there are no surprises.", "Yes"], ["How long does a project take?", "It depends on the scope. A single poster is much quicker than a full assembly with simulation. We agree on a timeline together when I send your quote, and I'll keep you updated along the way.", "Yes"], ["Can you work from my sketches, photos or existing files?", "Yes. Hand sketches with dimensions, photos, physical samples or existing CAD files are all great starting points. The more detail you share, the faster and more accurate the result.", "Yes"], ["What files will I receive?", "Whatever suits your project. For engineering: native CAD files, STEP/IGES, STL for 3D printing, DWG/DXF and PDF drawings. For graphics: print-ready PDFs and high-resolution PNG/JPG, with source files available on request.", "Yes"], ["Do you include revisions?", "Yes. Revisions are agreed as part of your quote, so we can refine the design until it's right for you.", "Yes"], ["How do I pay?", "Once you accept your quote, you pay the deposit shown on it to confirm your project, by M-Pesa to Buy Goods Till **8438334** (EDISON OCHIENG). Tap [Pay a deposit](#open:pay-modal) for the till number and QR code. International clients can pay by card or bank transfer: just ask me on WhatsApp.", "Yes"], ["Can I see your work in 3D before I hire you?", "Yes. Projects with a 3D badge have interactive models you can rotate and zoom in your browser (use the [3D models](#work) filter in my work). On a phone, tap **View in your room** to place the model in your own space at its real size.", "Yes"], ["Do you offer CAD training?", "Yes. I teach AutoCAD, SolidWorks (including CSWA exam preparation), Inventor and Fusion 360, one-on-one, in small groups or for company teams, online or in person in Nairobi. See the [training page](training/index.html) to reserve a seat.", "Yes"], ["Do you work with clients outside Nairobi?", "Yes. I work with clients remotely: briefs, files and reviews are shared online, and training can be delivered online or in person in Nairobi.", "Yes"], ["How do I join the free AutoCAD webinar?", "Tap [Reserve a seat](#open:webinar-modal), fill in the short form, and I'll send you the details for the next weekly session.", "Yes"]];
const faq_ = () => listTab_(FAQ, FQHEAD, SEED_FAQ, [320, 640, 110]);

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
    return { title: String(r[0]).trim(), issuer: String(r[1] || '').trim(), verify: /^https?:\/\//i.test(String(r[2]).trim()) ? String(r[2]).trim() : '', image: image,
      portfolio: !/^no$/i.test(String(r[5] == null ? '' : r[5]).trim()) };
  });
  const courses = rows(courses_()).filter((r) => shown_(r, 4)).map((r) => ({
    name: String(r[0]).trim(), tagline: String(r[1] || '').trim(), levels: String(r[2] || '').trim(), topics: lines_(r[3]),
    sessions: String(r[7] || '').trim(), projects: lines_(r[8])
  }));
  const recordings = rows(recordings_()).filter((r) => shown_(r, 2) && ytId_(r[0])).map((r) => ({ id: ytId_(r[0]), title: String(r[1] || '').trim() || 'Webinar recording' }));
  const faq = rows(faq_()).filter((r) => shown_(r, 2) && String(r[1]).trim()).map((r) => ({ q: String(r[0]).trim(), a: String(r[1]).trim() }));
  const downloads = rows(downloads_()).filter((r) => shown_(r, 3) && fileUrl_(r[2])).map((r) => ({ id: slug_(r[0]), title: String(r[0]).trim(), description: String(r[1] || '').trim(), file: fileUrl_(r[2]) }));
  const S = {};
  settings_().getDataRange().getValues().slice(1).forEach((r) => { S[String(r[0]).trim().toLowerCase()] = r[1]; });
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const intake = S['training next intake'] instanceof Date ? Utilities.formatDate(S['training next intake'], tz, 'd MMMM yyyy') : String(S['training next intake'] == null ? '' : S['training next intake']).trim();
  const price = Number(String(S['training starting price (kes)'] == null ? '' : S['training starting price (kes)']).replace(/[^\d.]/g, ''));
  return {
    packages: packages.length ? packages : null,
    certificates: certificates.length ? certificates : null,
    courses: courses.length ? courses : null,
    students: studentWork_(),
    recordings: recordings.length ? recordings : null,
    faq: faq.length ? faq : null,
    downloads: downloads,
    training: { intake: intake, price: price > 0 ? Math.round(price) : null, depositPct: Math.max(0, Math.min(100, num_(S['training seat deposit (%)'] == null ? 50 : S['training seat deposit (%)']))) }
  };
}

/* ---------- Automatic translations (French and Kiswahili) ----------
   The TRANSLATIONS tab holds one row per piece of website text that comes from this sheet.
   Every hour translateJob() adds rows for new text and fills EMPTY French / Kiswahili cells
   with Google Translate (free, built into Apps Script). It never overwrites a cell that has
   something in it, so you can correct any translation by typing over it. To get a fresh
   machine translation, clear the cell. "Used on website" shows which rows are still live.
   The website's GitHub automation picks the translations up with the rest of the content.
   It also translates the website's own text that has no hand-written translation (CV,
   projects, blog posts): the site lists that text in js/i18n-wanted.json at every rebuild,
   and translateJob reads it from the live site. Sheet content is translated first. */
const TRANSLATIONS = 'Translations';
const TRHEAD = ['English (automatic)', 'French', 'Kiswahili', 'Where it appears (automatic)', 'Used on website (automatic)', 'Translated on (automatic)'];
const TR_LANGS = ['fr', 'sw'];
const TR_MAX_CALLS_PER_RUN = 150;     // each French or Kiswahili cell is one call
const TR_MAX_CALLS_PER_DAY = 1500;    // stays well inside Apps Script's daily translation quota
const TR_MAX_MS = 4 * 60 * 1000;      // stop after 4 minutes (Apps Script allows 6)

const translations_ = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TRANSLATIONS);
  if (sh) return sh;
  sh = ss.insertSheet(TRANSLATIONS);
  sh.appendRow(TRHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, TRHEAD.length).setFontWeight('bold').setWrap(true);
  [360, 360, 360, 220, 110, 130].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(2, 1, 999, TRHEAD.length).setVerticalAlignment('top').setWrap(true);
  return sh;
};

// Same rules as the website: whitespace collapsed, trimmed. Text without letters (prices, years) is skipped.
const trKey_ = (t) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
const trWorth_ = (t) => t.length > 1 && t.length <= 4500 && /\p{L}/u.test(t) && !/^(https?:|mailto:)/i.test(t);
const unhtml_ = (t) => String(t).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// Answers with **bold** and [links](...) appear on the page as separate pieces of text: translate each piece
function mdPieces_(md) {
  const out = [];
  String(md || '').split(/\n/).forEach((line) => {
    line.replace(/\*\*(.+?)\*\*/g, '\u0001$1\u0001').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '\u0001$1\u0001')
      .split('\u0001').forEach((p) => out.push(p));
  });
  return out;
}
// Article bodies: every run of text between tags is one piece on the page
const htmlPieces_ = (html) => String(html || '').replace(/\{\{IMG:\d+\}\}/g, '').split(/<[^>]+>/).map(unhtml_);

// All website text that comes from this sheet right now: { english: where }
function sheetStrings_() {
  const found = {};
  const add = (t, where) => { const k = trKey_(t); if (trWorth_(k) && !found[k]) found[k] = where; };
  const rows = (sh) => sh.getDataRange().getValues().slice(1);
  rows(works_()).filter(published_).forEach((r) => {
    const w = 'Works: ' + String(r[0]).trim();
    [r[0], r[3], r[5]].forEach((t) => add(t, w));
    lines_(r[6]).forEach((t) => add(t, w));
    String(r[7] || '').split(',').forEach((t) => add(t, w));
    String(r[11] || '').split(',').forEach((t) => add(t, w));
    add(r[12], w);
  });
  rows(articles_()).filter(published_).forEach((r) => {
    const w = 'Articles: ' + String(r[0]).trim();
    add(r[0], w); add(r[4], w);
    String(r[6] || '').split(',').forEach((t) => add(t, w));
    const docId = driveId_(r[3]);
    if (docId) { try { htmlPieces_(docHtml_(docId).html).forEach((t) => add(t, w)); } catch (err) { /* Doc not readable: skipped */ } }
  });
  rows(pricing_()).filter((r) => shown_(r, 7)).forEach((r) => { const w = 'Pricing: ' + String(r[0]).trim(); add(r[0], w); add(r[4], w); lines_(r[5]).forEach((t) => add(t, w)); });
  rows(certs_()).filter((r) => shown_(r, 4)).forEach((r) => { add(r[0], 'Certificates'); add(r[1], 'Certificates'); });
  rows(courses_()).filter((r) => shown_(r, 4)).forEach((r) => { const w = 'Courses: ' + String(r[0]).trim(); [r[0], r[1], r[2]].forEach((t) => add(t, w)); lines_(r[3]).forEach((t) => add(t, w)); });
  rows(recordings_()).filter((r) => shown_(r, 2)).forEach((r) => add(r[1], 'Recordings'));
  rows(faq_()).filter((r) => shown_(r, 2)).forEach((r) => { add(r[0], 'FAQ'); mdPieces_(r[1]).forEach((t) => add(t, 'FAQ')); });
  rows(downloads_()).filter((r) => shown_(r, 3)).forEach((r) => { add(r[0], 'Free downloads'); add(r[1], 'Free downloads'); });
  const S = readSettings_();
  add(S.availability.text, 'Settings'); add(S.announcement.text, 'Settings');
  studentsTab_().getDataRange().getValues().slice(1).filter(studentShown_).forEach((r) => { add(r[2], 'Student work'); add(r[4], 'Student work'); });
  rows(courses_()).filter((r) => shown_(r, 4)).forEach((r) => { const w = 'Courses: ' + String(r[0]).trim(); add(r[7], w); lines_(r[8]).forEach((t) => add(t, w)); });
  campaignRows_(true).forEach((c) => {
    const w = 'Campaigns: ' + String(c.r[0]).trim();
    [c.r[4], c.r[5], c.r[6], c.r[8]].forEach((t) => add(t, w));
    String(c.r[6] || '').split(/\n+/).forEach((t) => add(t, w));
  });
  return found;
}

function translateJob() {
  const started = Date.now();
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'Africa/Nairobi', 'yyyy-MM-dd');
  if (props.getProperty('trStopped') === today) return 'Google Translate quota reached today; continuing tomorrow.';
  let usedToday = props.getProperty('trDay') === today ? Number(props.getProperty('trCalls')) || 0 : 0;

  const sh = translations_();
  const live = sheetStrings_();
  const WEB = 'Website (CV, projects, blog)';
  let webOk = true;   // if the site can't be read, its rows keep their current "Used" state
  try {
    const res = UrlFetchApp.fetch(SITE_URL + 'js/i18n-wanted.json?t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
    JSON.parse(res.getContentText()).slice(0, 3000).forEach((t) => { const k = trKey_(t); if (trWorth_(k) && !live[k]) live[k] = WEB; });
  } catch (err) { webOk = false; console.error('website text list: ' + err.message); }
  const data = sh.getDataRange().getValues().slice(1).map((r) => r.slice(0, TRHEAD.length));
  const index = {};
  data.forEach((r, i) => { index[trKey_(r[0])] = i; });
  Object.keys(live).forEach((k) => { if (!(k in index)) { index[k] = data.length; data.push([k, '', '', live[k], 'Yes', '']); } });
  data.forEach((r) => { const k = trKey_(r[0]); r[4] = live[k] ? 'Yes' : !webOk && r[3] === WEB ? r[4] : 'No'; if (live[k] && !r[3]) r[3] = live[k]; });

  let calls = 0, note = '';
  const queue = data.filter((r) => r[3] !== WEB).concat(data.filter((r) => r[3] === WEB));   // sheet content first
  outer:
  for (const r of queue) {
    if (r[4] !== 'Yes') continue;
    for (let c = 0; c < TR_LANGS.length; c++) {
      if (String(r[1 + c]).trim()) continue;                  // filled (by hand or earlier): never overwritten
      if (calls >= TR_MAX_CALLS_PER_RUN || usedToday >= TR_MAX_CALLS_PER_DAY) { note = 'limit for this run reached; the rest follows next hour.'; break outer; }
      if (Date.now() - started > TR_MAX_MS) { note = 'time limit reached; the rest follows next hour.'; break outer; }
      try {
        r[1 + c] = LanguageApp.translate(String(r[0]), 'en', TR_LANGS[c], { contentType: 'text' });
        r[5] = new Date();
        calls++; usedToday++;
      } catch (err) {
        if (/too many times|quota|limit/i.test(err.message)) { props.setProperty('trStopped', today); note = 'Google Translate quota reached; continuing tomorrow.'; break outer; }
        console.error('translate: ' + err.message);
      }
    }
  }
  props.setProperties({ trDay: today, trCalls: String(usedToday) });
  if (data.length) sh.getRange(2, 1, data.length, TRHEAD.length).setValues(data);
  const msg = calls + ' translation(s) added. ' + (note || 'Everything on the website is translated.');
  console.log(msg);
  return msg;
}

function translateNow() {
  const msg = translateJob();
  try { SpreadsheetApp.getUi().alert(msg); } catch (err) { /* run from the editor */ }
}

// For the website: { fr: { english: french }, sw: {...} }, only rows used on the website
function translationsOut_() {
  const out = { fr: {}, sw: {} };
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRANSLATIONS);
  if (!sh) return out;
  sh.getDataRange().getValues().slice(1).forEach((r) => {
    const k = trKey_(r[0]);
    if (!k || String(r[4]).trim() !== 'Yes') return;
    TR_LANGS.forEach((l, c) => { const t = trKey_(r[1 + c]); if (t && t !== k) out[l][k] = t; });
  });
  return out;
}

/* ---------- Campaigns: the popup poster on the website's homepage ----------
   One row per campaign (Black November, a new training cohort, a special offer...).
   The website shows the first row that is Active = Yes and within its dates. It arrives
   with the reviews and Settings the homepage already loads, so it costs no extra request.
   Its text is translated into French and Kiswahili by translateJob, like the rest.
   Test a campaign before its start date by opening the website with ?promo=preview. */
const CAMPAIGNS = 'Campaigns';
const CAHEAD = ['Campaign name (yours, not shown)', 'Active', 'Start date (empty = now)', 'End date (empty = no end)', 'Badge (e.g. Black November)',
  'Title', 'Message', 'Poster image (Google Drive link shared "Anyone with the link", a website file such as images/promos/x.jpg, or an https link; optional)',
  'Button text', 'Button link (#brief, #pricing, training/index.html, whatsapp, or https://...)', 'Show it', 'Delay (seconds)'];
const CA_SHOW = ['Once per visit', 'Once a day', 'Once a week', 'Every page view'];
const SEED_CAMPAIGNS = [['Example: Black November', 'No', '', '', 'Black November', '20% off all CAD projects',
  'Book any 3D modelling, drawing or simulation project in November and save 20%. Mention BLACKNOV in your brief.', '', 'Start a project', '#brief', 'Once a day', 3]];

const campaigns_ = () => {
  const sh = listTab_(CAMPAIGNS, CAHEAD, SEED_CAMPAIGNS, [200, 80, 130, 130, 170, 260, 380, 340, 160, 260, 140, 90], [['K2:K500', CA_SHOW]], 2);
  sh.getRange('C2:D500').setNumberFormat('d mmm yyyy');
  return sh;
};

const caDate_ = (d, tz) => (d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : '');

// Website-safe link: in-page anchors, site pages, whatsapp, or https
function campaignLink_(raw) {
  const t = String(raw || '').trim();
  if (/^whats ?app$/i.test(t)) return 'whatsapp';
  if (/^#[\w:-]*$/.test(t) || /^https:\/\/\S+$/i.test(t) || /^[\w][\w./-]*\.html(#[\w-]*)?$/.test(t)) return t;
  return '#brief';
}
// Drive links become a public thumbnail URL; site files and https links are kept as they are
function campaignImage_(raw) {
  const t = String(raw || '').trim();
  const id = driveId_(t);
  if (id) return { url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600', id: id };
  if (/^https:\/\/\S+$/i.test(t) || /^[\w][\w./-]*\.(jpe?g|png|webp|gif)$/i.test(t)) return { url: t, id: '' };
  return null;
}

// Campaign rows that are switched on and not over yet. now = today's yyyy-MM-dd in the sheet's time zone
function campaignRows_(includeUpcoming) {
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  return campaigns_().getDataRange().getValues().slice(1)
    .filter((r) => String(r[0]).trim() && /^yes$/i.test(String(r[1]).trim()) && (String(r[5]).trim() || String(r[7]).trim()))
    .map((r) => ({ r: r, start: caDate_(r[2], tz), end: caDate_(r[3], tz) }))
    .filter((c) => (!c.end || c.end >= today) && (includeUpcoming || !c.start || c.start <= today));
}

// The campaign for the website right now (or null), with its translations.
// withFile: also the poster's Drive file details, so the automation can save a copy for the shareable offer page
function campaign_(withFile) {
  const c = campaignRows_(false)[0];
  if (!c) return null;
  const r = c.r;
  const img = campaignImage_(r[7]);
  const out = {
    id: slug_(r[0]) + '-' + (c.start || 'now'),   // a new name or start date shows it again to visitors who closed it
    badge: trKey_(r[4]), title: trKey_(r[5]), text: String(r[6] || '').trim(),
    image: img ? img.url : '',
    button: trKey_(r[8]), link: campaignLink_(r[9]),
    show: CA_SHOW.indexOf(String(r[10]).trim()) > -1 ? String(r[10]).trim() : 'Once per visit',
    delay: Math.min(30, Math.max(0, Number(r[11]) || 0)),
    start: c.start, end: c.end
  };
  if (withFile && img && img.id) { try { out.imageFile = fileRef_(DriveApp.getFileById(img.id)); } catch (err) { /* not readable */ } }
  out.i18n = translationsFor_([out.badge, out.title, out.text, out.button].concat(out.text.split(/\n+/)));
  return out;
}

const campaignSafe_ = (withFile) => { try { return campaign_(withFile); } catch (err) { console.error('campaign: ' + err); return null; } };

// Translations for a few strings, straight from the Translations tab (so the popup is translated without waiting for the website sync)
function translationsFor_(list) {
  const want = {};
  list.forEach((t) => { const k = trKey_(t); if (k) want[k] = 1; });
  const out = { fr: {}, sw: {} };
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRANSLATIONS);
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach((r) => {
    const k = trKey_(r[0]);
    if (!want[k]) return;
    TR_LANGS.forEach((l, c) => { const t = trKey_(r[1 + c]); if (t && t !== k) out[l][k] = t; });
  });
  return out;
}

/* ---------- Student work: trainees' projects on the training page ----------
   Only rows where the student agreed to be shown AND "Show on website" is not No appear.
   Use first name and initial only (e.g. Brian O.). */
const STUDENTS = 'Student work';
const STHEAD = ['Student (first name and initial, e.g. Brian O.)', 'Course (as in the Courses tab)', 'Project (e.g. Bench vise)',
  'Photos (Drive folder link, or Drive photo links one per line)', 'What the student said (optional)', 'Student agreed to be shown? (Yes/No)', 'Show on website'];
const studentsTab_ = () => listTab_(STUDENTS, STHEAD, [], [220, 200, 200, 340, 380, 150, 110], [['F2:F500', YESNO]], 7);
const studentShown_ = (r) => shown_(r, 6) && /^yes$/i.test(String(r[5]).trim());
function studentWork_() {
  const out = [];
  studentsTab_().getDataRange().getValues().slice(1).filter(studentShown_).forEach((r) => {
    let photos = [];
    try { photos = photoIds_(r[3]).slice(0, 4); } catch (err) { /* not readable: shown without photos */ }
    out.push({ name: trKey_(r[0]).slice(0, 40), course: trKey_(r[1]).slice(0, 80), project: trKey_(r[2]).slice(0, 80), quote: String(r[4] || '').trim().slice(0, 400), photos: photos });
  });
  return out;
}

/* ---------- Quotes, invoices and receipts ---------- */
const INVOICES = 'Invoices';
const IHEAD = ['Number (automatic)', 'Type', 'Date', 'Project reference', 'Client', 'Client email', 'Items (one per line: description - amount)', 'Total (KES, automatic if empty)', 'Amount paid (KES)', 'Note to client', 'Action', 'PDF (automatic)', 'Sent (automatic)', 'Payment reminders (automatic; type Off to stop)', 'Quote accepted (automatic)', 'Discount code (optional; filled in for you)'];
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
  [150, 90, 100, 150, 170, 200, 360, 120, 120, 260, 80, 200, 150, 230, 170, 200].forEach((w, i) => sh.setColumnWidth(i + 1, w));
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
        '<td style="vertical-align:top"><table cellspacing="0" cellpadding="0" style="margin:0 0 0 auto">' +
        (d.discount ? line('Subtotal', kes_(d.total + d.discount.amount)) + line(html_(d.discount.label), '<span style="color:#137a49">−' + kes_(d.discount.amount) + '</span>') : '') +
        line('Total', kes_(d.total), d.type === 'Quote') +
        (d.type !== 'Quote' ? line(d.type === 'Receipt' ? 'Amount received' : 'Paid so far', kes_(d.paid)) + line(d.type === 'Receipt' ? 'Balance remaining' : 'Balance due', kes_(d.balance), true) : '') + '</table></td>' +
      '</tr></table>' +
    '</div>' +
    (d.note ? '<div style="margin:18px 30px 0;padding:12px 14px;background:#fbf6ec;border-left:4px solid #ffb627">' + html_(d.note) + '</div>' : '') +
    (d.type === 'Receipt'
      ? '<div style="margin:22px 30px 0;color:#1fae6a;font-weight:bold;font-size:14px">Thank you for your payment.</div>'
      : '<div style="margin:22px 30px 0;padding:14px 16px;border:1px solid #ece4d6"><b>How to pay</b><br>M-Pesa · Lipa na M-Pesa · Buy Goods Till <b>' + MPESA_TILL + '</b> (' + MPESA_NAME + ')' + (d.ref ? '<br>After paying, enter your M-Pesa confirmation code on your tracking page (link below), or message it to me with your reference <b>' + html_(d.ref) + '</b>.' : '<br>After paying, please message me the M-Pesa confirmation code.') + (d.type === 'Quote' && d.ref ? '<br>This quote is valid for 30 days. Accept it on your tracking page: ' + SITE_URL + 'track/?ref=' + encodeURIComponent(d.ref) : '') + '</div>') +
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
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const date = r[2] instanceof Date ? r[2] : new Date();
  // A quote always gets a reference, so the client can accept it on the tracking page
  let ref = String(r[3] || '').trim();
  if (!ref && type === 'Quote') { ref = newId_('NCS'); sh.getRange(row, 4).setValue(ref); }
  if (type === 'Quote') quoteBrief_(ref, String(r[4] || '').trim(), email, items[0].text);
  // Discount: a code typed in column P, or the one the client used on the website
  let total = num_(r[7]) || items.reduce((a, it) => a + (it.amount || 0), 0);
  let discount = null;
  const dcell = String(r[15] || '').trim();
  const applied = /\(−KES ([\d,]+)\)/.exec(dcell);
  if (applied && num_(r[7])) {
    discount = { label: discountLabel_(codeOf_(dcell)), amount: num_(applied[1]) };   // sent before: the total already includes it
  } else if (type !== 'Receipt' && !/^(none|no|off)\b/i.test(dcell)) {
    const code = codeOf_(dcell) || (dcell ? '' : autoCode_(sh, row, type, ref));
    const dsc = code ? discountFor_(code, email, total, ref) : null;
    if (dsc && dsc.amount > 0) {
      discount = dsc;
      total = Math.max(0, total - dsc.amount);
      sh.getRange(row, 16).setValue(code + ' (−KES ' + Math.round(dsc.amount).toLocaleString('en-US') + ')');
      sh.getRange(row, 8).setValue(total);
      if (dsc.reward) claimReward_(dsc.reward, ref || email);
    } else if (dcell && code) sh.getRange(row, 16).setValue('⚠ ' + code + ': unknown code, not applied');
  }
  const paid = num_(r[8]);
  let number = String(r[0] || '').trim();
  if (!number) {
    const prefix = { Quote: 'QUO', Invoice: 'INV', Receipt: 'RCT' }[type] + '-' + Utilities.formatDate(date, tz, 'yyyy') + '-';
    const used = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues().map((x) => String(x[0])).filter((x) => x.indexOf(prefix) === 0).length;
    number = prefix + String(used + 1).padStart(3, '0');
    sh.getRange(row, 1).setValue(number);
  }
  const d = { type, number, date: Utilities.formatDate(date, tz, 'd MMMM yyyy'), ref, client: String(r[4] || '').trim(), email, items, total, paid, balance: Math.max(0, total - paid), note: String(r[9] || '').trim(), discount };
  const pdf = Utilities.newBlob(invoiceHtml_(d), 'text/html', number + '.html').getAs('application/pdf').setName(number + ' - ' + (d.client || 'client') + '.pdf');
  const file = invoiceFolder_().createFile(pdf);
  const trackLink = SITE_URL + 'track/?ref=' + encodeURIComponent(ref);
  const message = {
    Quote: 'Please find attached your quote <b>' + html_(number) + '</b> for <b>' + kes_(total) + '</b>' + (discount ? ' (including ' + html_(discount.label) + ')' : '') + '. You can review and accept it online with the button below, or reply with any questions. The quote is valid for 30 days.',
    Invoice: 'Please find attached invoice <b>' + html_(number) + '</b>. The balance due is <b>' + kes_(d.balance) + '</b>, payable by M-Pesa to Buy Goods Till <b>' + MPESA_TILL + '</b> (' + MPESA_NAME + ').' + (ref ? ' After paying, you can send me your M-Pesa confirmation code on your tracking page.' : ''),
    Receipt: 'Thank you for your payment of <b>' + kes_(paid) + '</b>. Your receipt <b>' + html_(number) + '</b> is attached.' + (d.balance > 0 ? ' The remaining balance is <b>' + kes_(d.balance) + '</b>.' : '')
  }[type];
  const body = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
    '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · ' + type.toUpperCase() + '</p>' +
    '<p>Hello' + (d.client ? ' ' + html_(d.client) : '') + ',</p><p>' + message + '</p>' +
    (d.note ? '<p style="border-left:4px solid #ffb627;background:#fbf6ec;padding:10px 12px">' + html_(d.note) + '</p>' : '') +
    (ref ? '<p><a href="' + trackLink + '" style="background:' + (type === 'Quote' ? '#ffb627;color:#0e1a3a' : '#0e1a3a;color:#fff') + ';padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:bold">' + (type === 'Quote' ? 'Review &amp; accept your quote' : type === 'Invoice' ? 'Pay &amp; track your project' : 'Track your project') + '</a></p>' : '') +
    '<p style="font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
    '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>';
  MailApp.sendEmail({ to: email, subject: type + ' ' + number + ' from Nexus CAD Studio', htmlBody: body, body: message.replace(/<[^>]+>/g, '') + (ref ? ' ' + trackLink : ''), name: SENDER, attachments: [pdf] });
  sh.getRange(row, 12).setValue(file.getUrl());
  sh.getRange(row, 13).setValue('Sent ' + Utilities.formatDate(new Date(), tz, 'd MMM yyyy, HH:mm'));
  sh.getRange(row, 11).setValue('Sent');
  if (!num_(r[7]) && !discount) sh.getRange(row, 8).setValue(total);
  // Keep the project's tracker in step
  if (ref && type !== 'Quote') {
    const P = projects_(), rows = P.getDataRange().getValues();
    const i = rows.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(ref));
    if (i > 0) {
      P.getRange(i + 1, 9).setValue(d.balance);
      if (type === 'Receipt') {
        P.getRange(i + 1, 8).setValue('Paid');
        // The first payment moves a project that is waiting for its deposit forward
        const st = STAGES.findIndex((x) => x.toLowerCase() === String(rows[i][3]).trim().toLowerCase());
        if (st < 2) { P.getRange(i + 1, 4).setValue(STAGES[2]); P.getRange(i + 1, 5).setValue(Math.max(num_(rows[i][4]), 40)); }
      } else if (!rows[i][7]) P.getRange(i + 1, 8).setValue('Due');
      P.getRange(i + 1, 11).setValue(new Date());
    }
    if (type === 'Receipt' && i < 1) {
      const T = trainees_(), tr = T.getDataRange().getValues();
      const j = tr.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(ref));
      if (j > 0 && /^(reserved|waiting list|confirmed)$/i.test(String(tr[j][8]).trim())) T.getRange(j + 1, 9).setValue('Paid');
    }
    if (type === 'Receipt') { try { referralPaid_(ref); } catch (err) { console.error('referral: ' + err); } }
  }
}

/* ---------- Promo codes and referral codes ---------- */
const PROMOS = 'Promo codes';
const PCHEAD = ['Code', 'Discount (e.g. 20% or 1000 for KES 1,000)', 'For', 'Expires on (optional)', 'Max uses (empty = no limit)', 'Uses (automatic)', 'Active', 'Notes'];
const PC_FOR = ['Everything', 'Engineering design', 'Graphic design', 'Training'];
const REFERRALS = 'Referrals';
const RFHEAD = ['Code', 'Client', 'Client email', 'Project reference', 'Created', 'Times used', 'Rewards earned', 'Rewards claimed', 'History (automatic)'];

function promos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PROMOS);
  if (sh) return sh;
  sh = ss.insertSheet(PROMOS);
  sh.appendRow(PCHEAD);
  sh.appendRow(['WELCOME10', '10%', 'Everything', '', '', 0, 'No', 'Example: set Active to Yes to switch it on']);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, PCHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('B2:B500').setNumberFormat('@');
  sh.getRange('C2:C500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PC_FOR, true).build());
  sh.getRange('D2:D500').setNumberFormat('d mmm yyyy');
  sh.getRange('G2:G500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(YESNO, true).build());
  [150, 200, 160, 140, 140, 110, 90, 300].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

function referrals_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(REFERRALS);
  if (sh) return sh;
  sh = ss.insertSheet(REFERRALS);
  sh.appendRow(RFHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, RFHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('E2:E2000').setNumberFormat('d mmm yyyy');
  [140, 180, 220, 160, 110, 100, 110, 110, 420].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

// The code at the start of a cell such as "TRAIN20 · 20% off" or "AMINA-7K3P (−KES 450)"
const codeOf_ = (v) => { const m = /^\s*([A-Za-z0-9][A-Za-z0-9-]{2,23})(?![A-Za-z0-9-])/.exec(String(v || '')); return m && !/^(none|no|off)$/i.test(m[1]) ? m[1].toUpperCase() : ''; };
const forKey_ = (t) => (/engineer/i.test(t) ? 'engineering design' : /graphic/i.test(t) ? 'graphic design' : /train/i.test(t) ? 'training' : '');

// "20%", 0.2 (a cell formatted as %), "20" → 20% ; "1000" → KES 1,000
function parseDiscount_(v) {
  if (typeof v === 'number') return v > 0 && v < 1 ? { percent: Math.round(v * 1000) / 10 } : v >= 1 && v <= 100 ? { percent: v } : v > 100 ? { amount: v } : null;
  const t = String(v || '').trim(), n = num_(t);
  if (!n) return null;
  return /%/.test(t) || n <= 100 ? { percent: Math.min(100, n) } : { amount: n };
}

function addHistory_(sh, row, text) {
  const cur = String(sh.getRange(row, 9).getValue() || '');
  sh.getRange(row, 9).setValue(([Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd MMM yyyy') + ': ' + text].concat(cur ? [cur] : [])).join('\n').slice(0, 5000));
}

// Is this code valid? opts: for (service), email (who uses it), ref, honour (it was accepted earlier: skip expiry, limits and Active)
function codeInfo_(raw, opts) {
  opts = opts || {};
  const code = codeOf_(raw);
  if (!code) return { valid: false, reason: 'unknown' };
  const P = promos_(), prow = P.getDataRange().getValues();
  const i = prow.findIndex((x, k) => k > 0 && normRef_(x[0]) && normRef_(x[0]) === normRef_(code));
  if (i > 0) {
    const x = prow[i], d = parseDiscount_(x[1]);
    if (!d) return { valid: false, reason: 'inactive' };
    if (!opts.honour) {
      if (!/^yes$/i.test(String(x[6]).trim())) return { valid: false, reason: 'inactive' };
      if (x[3] instanceof Date && ymdLocal_(x[3]) < ymdLocal_(new Date())) return { valid: false, reason: 'expired' };
      const max = Math.round(num_(x[4]));
      if (max && num_(x[5]) >= max) return { valid: false, reason: 'used up' };
      const f = String(x[2] || '').trim().toLowerCase();
      if (opts.for && f && f !== 'everything' && forKey_(opts.for) !== f) return { valid: false, reason: 'not for this', only: String(x[2]).trim() };
    }
    return Object.assign({ valid: true, kind: 'promo', code: String(x[0]).trim().toUpperCase(), row: i + 1, label: d.percent ? d.percent + '% off' : kes_(d.amount) + ' off' }, d);
  }
  const R = referrals_(), rrow = R.getDataRange().getValues();
  const j = rrow.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(code));
  if (j > 0) {
    const x = rrow[j];
    const own = opts.email && String(x[2]).trim().toLowerCase() === String(opts.email).trim().toLowerCase();
    if (own) {
      // The referrer's own code claims a reward they earned
      const pct = Math.min(100, num_(setting_('Referral reward (%)')));
      const claimedHere = opts.ref && String(x[8]).toUpperCase().indexOf('CLAIMED ON ' + String(opts.ref).toUpperCase()) > -1;
      if (!pct || (!claimedHere && num_(x[6]) <= num_(x[7]))) return { valid: false, reason: 'own' };
      return { valid: true, kind: 'reward', code: String(x[0]).trim(), row: j + 1, percent: pct, label: pct + '% referral reward' };
    }
    const pct = Math.min(100, num_(setting_('Referral discount for new clients (%)')));
    if (!pct || (!opts.honour && /^no$/i.test(setting_('Referral programme')))) return { valid: false, reason: 'inactive' };
    return { valid: true, kind: 'referral', code: String(x[0]).trim(), row: j + 1, percent: pct, label: pct + '% referral discount' };
  }
  return { valid: false, reason: 'unknown' };
}

// Website check while typing (nothing private is returned)
function codeCheck_(q) {
  const cache = CacheService.getScriptCache();
  const misses = Number(cache.get('code-miss') || 0);
  if (misses >= 60) return { valid: false, reason: 'busy' };
  const c = codeInfo_(q.c, { for: q.for || '', email: q.email || '' });
  if (!c.valid) { if (c.reason === 'unknown') cache.put('code-miss', String(misses + 1), 600); return { valid: false, reason: c.reason, only: c.only || '' }; }
  return { valid: true, code: c.code, kind: c.kind, label: c.label, percent: c.percent || null, amount: c.amount || null };
}

// A code typed on a website form: counted and saved with the brief or reservation
function useCode_(raw, opts) {
  const typed = clean_(raw, 30);
  if (!typed) return '';
  const c = codeInfo_(typed, opts);
  if (!c.valid) return '⚠ ' + typed.toUpperCase() + ' (not applied: ' + c.reason + ')';
  if (c.kind === 'promo') { const P = promos_(); P.getRange(c.row, 6).setValue(num_(P.getRange(c.row, 6).getValue()) + 1); }
  if (c.kind !== 'promo') {
    const R = referrals_();
    if (c.kind === 'referral') R.getRange(c.row, 6).setValue(num_(R.getRange(c.row, 6).getValue()) + 1);
    addHistory_(R, c.row, (c.kind === 'referral' ? 'Used by ' : 'Reward requested by ') + (opts.name || 'a client') + ' (' + opts.ref + ')');
  }
  return c.code + ' · ' + c.label;
}

// The discount a code gives on an amount when a quote or invoice is sent
function discountFor_(code, email, base, ref) {
  const c = codeInfo_(code, { email: email, ref: ref, honour: true });
  if (!c.valid || !(base > 0)) return null;
  const amount = Math.min(base, Math.round(c.percent ? base * c.percent / 100 : c.amount));
  return { label: c.label + ' (' + c.code + ')', amount: amount, reward: c.kind === 'reward' ? c.row : 0 };
}
const discountLabel_ = (code) => 'Discount' + (code ? ' (' + code + ')' : '');

function claimReward_(row, ref) {
  const R = referrals_();
  if (String(R.getRange(row, 9).getValue()).toUpperCase().indexOf('CLAIMED ON ' + String(ref).toUpperCase()) > -1) return;
  R.getRange(row, 8).setValue(num_(R.getRange(row, 8).getValue()) + 1);
  addHistory_(R, row, 'Reward claimed on ' + ref);
}

// The code the client used on the website, for their first quote (or first invoice when there is no quote)
function autoCode_(sh, row, type, ref) {
  if (!ref) return '';
  const n = normRef_(ref);
  const b = subs_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  const t = b ? null : trainees_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  const code = codeOf_(b ? b[13] : t ? t[13] : '');
  if (!code || type === 'Quote') return code;
  const used = sh.getDataRange().getValues().some((x, k) => k > 0 && k !== row - 1 && normRef_(x[3]) === n &&
    (String(x[1]).trim() === 'Quote' || /\(−KES/.test(String(x[15] || ''))));
  return used ? '' : code;
}

// A delivered client's personal referral code (created once per email address)
function referralFor_(name, email, ref) {
  const R = referrals_(), rows = R.getDataRange().getValues();
  const mine = rows.find((x, k) => k > 0 && String(x[2]).trim().toLowerCase() === String(email).trim().toLowerCase());
  if (mine) return String(mine[0]).trim();
  const taken = rows.map((x) => normRef_(x[0])).concat(promos_().getDataRange().getValues().map((x) => normRef_(x[0])));
  const first = String(name || '').trim().split(/\s+/)[0].normalize('NFD').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'NCS';
  let code;
  do {
    code = first + '-' + Utilities.getUuid().replace(/[^a-z0-9]/gi, '').toUpperCase().replace(/[01OI]/g, '').slice(0, 4);
  } while (taken.indexOf(normRef_(code)) > -1);
  R.appendRow([code, name, email, ref, new Date(), 0, 0, 0, '']);
  return code;
}

// After a referred client pays: the referrer earns a reward (once per project) and is thanked
function referralPaid_(ref) {
  if (/^no$/i.test(setting_('Referral programme'))) return;
  const n = normRef_(ref);
  const b = subs_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  const t = b ? null : trainees_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  const src = b ? { code: b[13], name: b[3], email: b[4] } : t ? { code: t[13], name: t[2], email: t[3] } : null;
  const code = src && codeOf_(src.code);
  if (!code) return;
  const R = referrals_(), rows = R.getDataRange().getValues();
  const j = rows.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(code));
  if (j < 1) return;
  const x = rows[j];
  if (String(x[2]).trim().toLowerCase() === String(src.email).trim().toLowerCase()) return;   // their own reward, not a referral
  if (String(x[8]).toUpperCase().indexOf('REWARD EARNED FROM ' + String(ref).toUpperCase()) > -1) return;
  R.getRange(j + 1, 7).setValue(num_(x[6]) + 1);
  addHistory_(R, j + 1, 'Reward earned from ' + ref + ' (' + src.name + ' paid)');
  const pct = num_(setting_('Referral reward (%)'));
  if (validEmail_(x[2]) && pct) {
    const friend = String(src.name || '').trim().split(/\s+/)[0];
    MailApp.sendEmail({ to: String(x[2]).trim(), name: SENDER, subject: 'Thank you for the referral! ' + pct + '% off your next project',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
        '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · REFERRAL REWARD</p>' +
        '<p>Hello ' + html_(x[1]) + ',</p>' +
        '<p>Thank you for recommending me' + (friend ? ' to <b>' + html_(friend) + '</b>' : '') + '! Their project has started, so you have earned <b>' + pct + '% off</b> your next project.</p>' +
        '<p>To claim it, type your code <b style="font-size:16px;letter-spacing:1px">' + html_(x[0]) + '</b> in the "Discount or referral code" box on your next project brief. Your rewards add up: one for each friend who becomes a client.</p>' +
        '<p><a href="' + SITE_URL + '#brief" style="background:#0e1a3a;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Start a new project</a></p>' +
        '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>',
      body: 'Thank you for the referral! You have earned ' + pct + '% off your next project. Use your code ' + x[0] + ' on your next brief: ' + SITE_URL + '#brief' });
  }
}

function referralBlock_(code) {
  const give = num_(setting_('Referral discount for new clients (%)')), get = num_(setting_('Referral reward (%)'));
  return '<div style="border:2px dashed #ffb627;border-radius:14px;padding:14px 16px;margin:18px 0">' +
    '<b>Know someone who needs design work?</b><br>Share your personal code <b style="font-size:16px;letter-spacing:1px">' + html_(code) + '</b>.' +
    (give ? ' They get <b>' + give + '% off</b> their first project' : '') + (get ? (give ? ', and' : '') + ' once they pay, you get <b>' + get + '% off</b> your next one' : '') + '.</div>';
}

/* ---------- Quotes the client accepts on the tracking page ---------- */
// A quote for someone who didn't send a brief: listed in Submissions so the tracker knows it
function quoteBrief_(ref, client, email, title) {
  const n = normRef_(ref);
  if (projects_().getDataRange().getValues().slice(1).some((x) => normRef_(x[0]) === n)) return;
  const S = subs_(), rows = S.getDataRange().getValues();
  const i = rows.findIndex((x, k) => k > 0 && normRef_(x[0]) === n);
  if (i > 0) { if (/^(new|reviewing)$/i.test(String(rows[i][2]).trim())) S.getRange(i + 1, 3).setValue('Quote sent'); return; }
  if (/^TRN/i.test(n)) return;
  S.appendRow([ref, new Date(), 'Quote sent', client, email, '', '', title, '', '', 'Created from a quote sent in the Invoices tab', '', '', '']);
}

function quoteFor_(ref) {
  const n = normRef_(ref);
  const rows = invoices_().getDataRange().getValues().slice(1).filter((x) => x[0] && normRef_(x[3]) === n && String(x[1]).trim() === 'Quote' && String(x[10]).trim() === 'Sent');
  if (!rows.length) return null;
  const q = rows[rows.length - 1];
  const acc = /^accepted\s*(.*)$/i.exec(String(q[14] || '').trim());
  const date = q[2] instanceof Date ? q[2] : null;
  const until = date ? new Date(date.getTime() + 30 * 864e5) : null;
  const disc = /\(−KES ([\d,]+)\)/.exec(String(q[15] || ''));
  return {
    number: String(q[0]).trim(), date: ymd_(date), validUntil: until ? ymd_(until) : '',
    total: num_(q[7]) || invoiceItems_(q[6]).reduce((a, it) => a + (it.amount || 0), 0),
    items: invoiceItems_(q[6]).slice(0, 20),
    discount: disc ? { label: discountLabel_(codeOf_(q[15])), amount: num_(disc[1]) } : null,
    state: acc ? 'accepted' : until && Date.now() > until.getTime() + 864e5 ? 'expired' : 'open',
    acceptedOn: acc ? acc[1] : ''
  };
}

function acceptQuote_(p) {
  const want = normRef_(p.ref), number = clean_(p.number, 30);
  if (want.length < 6 || !number) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('accept-count') || 0);
  if (count >= 30) return { ok: false, error: 'busy' };
  cache.put('accept-count', String(count + 1), 3600);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = invoices_(), rows = sh.getDataRange().getValues();
    const i = rows.findIndex((x, k) => k > 0 && String(x[0]).trim() === number && normRef_(x[3]) === want && String(x[1]).trim() === 'Quote' && String(x[10]).trim() === 'Sent');
    if (i < 1) return { ok: false };
    const q = rows[i];
    if (/^accepted/i.test(String(q[14]))) return { ok: true };
    if (q[2] instanceof Date && Date.now() > q[2].getTime() + 31 * 864e5) return { ok: false, error: 'expired' };
    const when = Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd MMM yyyy');
    sh.getRange(i + 1, 15).setValue('Accepted ' + when);
    const ref = String(q[3]).trim(), items = invoiceItems_(q[6]);
    const total = num_(q[7]) || items.reduce((a, it) => a + (it.amount || 0), 0);
    const pctRaw = String(setting_('Deposit for accepted quotes (%)')).trim();
    const pct = pctRaw === '' ? 50 : Math.max(0, Math.min(100, num_(pctRaw)));
    const auto = !/^no$/i.test(setting_('Send the deposit invoice automatically'));
    const deposit = pct > 0 && total > 0 ? Math.round(total * pct / 100) : 0;
    // The project on the tracker
    const P = projects_(), prow = P.getDataRange().getValues();
    const j = prow.findIndex((x, k) => k > 0 && normRef_(x[0]) === want);
    const S = subs_(), srow = S.getDataRange().getValues();
    const k = srow.findIndex((x, n) => n > 0 && normRef_(x[0]) === want);
    const b = k > 0 ? srow[k] : null;
    const client = String(q[4] || '').trim() || (b ? String(b[3]) : ''), email = String(q[5] || '').trim() || (b ? String(b[4]) : '');
    const title = (j > 0 && prow[j][1]) || (b && (b[7] || b[6])) || items[0].text;
    const note = 'Quote ' + number + ' accepted on ' + when + '.' + (deposit ? (auto ? ' Your deposit invoice has been emailed to you.' : ' Your deposit invoice follows shortly.') : '');
    if (j > 0) { P.getRange(j + 1, 7).setValue(note); P.getRange(j + 1, 11).setValue(new Date()); }
    else if (!/^TRN/i.test(want)) P.appendRow([ref, title, client, 'Quote sent', 20, b ? b[9] || '' : '', note, deposit ? 'Due' : '', deposit || total, '', new Date(), email]);
    if (k > 0) { S.getRange(k + 1, 3).setValue('Accepted'); if (!srow[k][12]) S.getRange(k + 1, 13).setValue('Yes, ' + when + ' (quote accepted)'); }
    // The deposit invoice
    if (deposit) {
      sh.appendRow(['', 'Invoice', new Date(), ref, client, email, (pct >= 100 ? 'Full payment' : 'Deposit (' + pct + '%)') + ' for quote ' + number + ' - ' + deposit, deposit, 0,
        'Thank you for accepting quote ' + number + ' (' + kes_(total) + '). ' + (pct >= 100 ? 'This payment confirms your project.' : 'This deposit confirms your project; the balance of ' + kes_(total - deposit) + ' is due on delivery.'),
        'Draft', '', 'Drafted when the client accepted quote ' + number + (auto ? '' : ': check it, then set Action to Send'), '', '', 'None']);
      if (auto && validEmail_(email)) sendInvoice_(sh, sh.getLastRow());
    }
    if ((!deposit || !auto) && validEmail_(email)) {
      mail_(email, 'Quote ' + number + ' accepted: thank you!', client,
        'Thank you for accepting quote <b>' + html_(number) + '</b> (' + kes_(total) + ') for <b>' + html_(title) + '</b>. ' + (deposit ? 'I will send your deposit invoice shortly.' : 'I will be in touch about the next steps.'),
        'Quote sent', 20, '', ref);
    }
    const me = Session.getEffectiveUser().getEmail();
    if (me) MailApp.sendEmail({ to: me, name: 'Nexus CAD Studio website', subject: '✅ Quote accepted: ' + number + ' · ' + client + ' · ' + kes_(total),
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0e1a3a"><p><b>' + html_(client) + '</b> accepted quote <b>' + html_(number) + '</b> (' + kes_(total) + ') for <b>' + html_(title) + '</b> (' + html_(ref) + ').</p>' +
        '<p>' + (deposit ? (auto ? 'The deposit invoice (' + kes_(deposit) + ') was emailed automatically.' : 'A deposit invoice (' + kes_(deposit) + ') is drafted in the Invoices tab: set its Action to Send.') : 'No deposit invoice (deposit set to 0% in Settings).') + ' The project is on the tracker.</p>' +
        '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open your sheet</a></p></div>' });
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/* ---------- M-Pesa payments the client reports on the tracking page ---------- */
const PAYMENTS = 'Payments';
const PYHEAD = ['Received', 'Reference', 'Client', 'M-Pesa code', 'Amount (KES)', 'Paid from (name / number)', 'Status', 'Receipt (automatic)', 'Notes'];
const PY_STATUS = ['To confirm', 'Confirmed', 'Not received'];

function payments_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PAYMENTS);
  if (sh) return sh;
  sh = ss.insertSheet(PAYMENTS);
  sh.appendRow(PYHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, PYHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('A2:A3000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.getRange('G2:G3000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PY_STATUS, true).build());
  [140, 160, 180, 140, 120, 200, 120, 220, 300].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

// Who a reference belongs to (project, brief or trainee)
function clientOf_(ref) {
  const n = normRef_(ref);
  if (!n) return null;
  const p = projects_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  if (p) return { name: String(p[2] || ''), email: String(p[11] || '').trim(), title: String(p[1] || ''), balance: String(p[8]).trim() === '' ? null : num_(p[8]) };
  const b = subs_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  if (b) return { name: String(b[3] || ''), email: String(b[4] || '').trim(), title: String(b[7] || b[6] || ''), balance: null };
  const t = trainees_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === n);
  if (t) return { name: String(t[2] || ''), email: String(t[3] || '').trim(), title: String(t[5] || '') + ' training', balance: null };
  return null;
}

const mpesaCode_ = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// How a payment reference reads on a receipt (prompt payments without a receipt number yet carry Safaricom's request ID)
const payNote_ = (code) => (/^ws_CO_/i.test(String(code || '')) ? 'Paid by M-Pesa prompt (request ' + String(code).slice(-6) + ')' : 'M-Pesa confirmation code ' + code);

function payment_(p) {
  const want = normRef_(p.ref), code = mpesaCode_(p.code), amount = Math.round(num_(p.amount));
  if (want.length < 6 || !/^[A-Z0-9]{8,12}$/.test(code) || !(amount > 0 && amount < 1e7)) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('pay-count') || 0);
  if (count >= 20) return { ok: false, error: 'busy' };
  cache.put('pay-count', String(count + 1), 3600);
  const who = clientOf_(want);
  if (!who) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let ref;
  try {
    const sh = payments_(), rows = sh.getDataRange().getValues().slice(1);
    if (rows.some((x) => mpesaCode_(x[3]) === code)) return { ok: true };            // sent twice
    ref = String(p.ref).trim().toUpperCase();
    sh.appendRow([new Date(), ref, who.name, code, amount, clean_(p.payer, 80), 'To confirm', '', '']);
  } finally {
    lock.releaseLock();
  }
  const me = Session.getEffectiveUser().getEmail();
  if (me) MailApp.sendEmail({ to: me, name: 'Nexus CAD Studio website', subject: '💰 Payment to confirm: ' + kes_(amount) + ' from ' + (who.name || ref),
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0e1a3a"><p><b>' + html_(who.name || 'A client') + '</b> says they paid <b>' + kes_(amount) + '</b> by M-Pesa for <b>' + html_(who.title || ref) + '</b> (' + html_(ref) + ').</p>' +
      '<p style="font-size:18px">M-Pesa code: <b style="letter-spacing:1px">' + html_(code) + '</b>' + (p.payer ? '<br><span style="font-size:13px;color:#555">Paid from: ' + html_(clean_(p.payer, 80)) + '</span>' : '') + '</p>' +
      '<p>Check your M-Pesa messages for this code, then set its Status in the <b>Payments</b> tab to <b>Confirmed</b>: the receipt is created and emailed for you. If you can\'t find it, choose <b>Not received</b> and the client is asked to check.</p>' +
      '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open your sheet</a></p></div>' });
  return { ok: true };
}

function paymentChanged_(sh, row) {
  const r = sh.getRange(row, 1, 1, PYHEAD.length).getValues()[0];
  const status = String(r[6] || '').trim(), ref = String(r[1] || '').trim(), code = String(r[3] || '').trim(), amount = num_(r[4]);
  const who = clientOf_(ref) || { name: String(r[2] || ''), email: '', title: '', balance: null };
  const when = Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd MMM yyyy');
  if (status === 'Confirmed' && !String(r[7]).trim()) {
    if (!amount) { sh.getRange(row, 9).setValue('⚠ Add the amount, then set Status to Confirmed again.'); return; }
    const inv = invoices_(), rows = inv.getDataRange().getValues(), n = normRef_(ref);
    // What it pays for: the latest sent invoice that is still open, else the project balance
    let item = '', total = 0;
    const invs = rows.filter((x, k) => k > 0 && n && normRef_(x[3]) === n && String(x[1]).trim() === 'Invoice' && String(x[10]).trim() === 'Sent');
    const last = invs[invs.length - 1];
    if (last) {
      const since = rows.filter((x, k) => k > 0 && normRef_(x[3]) === n && String(x[1]).trim() === 'Receipt' && String(x[10]).trim() === 'Sent' &&
        x[2] instanceof Date && last[2] instanceof Date && x[2] >= last[2]).reduce((a, x) => a + num_(x[8]), 0);
      const owed = Math.max(0, num_(last[7]) - num_(last[8]) - since);
      if (owed > 0) { item = 'Invoice ' + last[0] + ' - ' + owed; total = owed; }
    }
    if (!item && who.balance > 0) { item = 'Balance for ' + (who.title || ref) + ' - ' + who.balance; total = who.balance; }
    if (!item) { item = 'Payment for ' + (who.title || ref) + ' - ' + amount; total = amount; }
    inv.appendRow(['', 'Receipt', new Date(), ref, who.name, who.email, item, Math.max(total, amount), amount, payNote_(code), 'Draft', '', 'Created from the Payments tab', '', '', 'None']);
    const ir = inv.getLastRow();
    if (!validEmail_(who.email)) { sh.getRange(row, 8).setValue('⚠ Receipt drafted in Invoices row ' + ir + ': add the client email there, then set Action to Send'); return; }
    sendInvoice_(inv, ir);
    sh.getRange(row, 8).setValue(String(inv.getRange(ir, 1).getValue()) + ' sent ' + when);
    // A training deposit confirmed: the seat is confirmed too
    if (/^TRN-/i.test(ref)) {
      const tr = trainees_(), trows = tr.getDataRange().getValues();
      const ti = trows.findIndex((x, k) => k > 0 && normRef_(x[0]) === normRef_(ref));
      if (ti > 0 && /^(reserved|waiting list)$/i.test(String(trows[ti][8]).trim())) tr.getRange(ti + 1, 9).setValue('Confirmed');
    }
  } else if (status === 'Not received' && !/client asked/i.test(String(r[8]))) {
    if (validEmail_(who.email)) {
      mail_(who.email, 'About your M-Pesa payment (' + ref + ')', who.name,
        'Thank you for sending your M-Pesa code <b>' + html_(code) + '</b> (' + kes_(amount) + '). I couldn\'t find this payment in my M-Pesa messages yet. Please check the code in your M-Pesa confirmation SMS and send it again on your tracking page, or message me on WhatsApp so we can sort it out.',
        '', null, '', ref);
    }
    sh.getRange(row, 9).setValue([String(r[8] || ''), 'Client asked to check ' + when].filter(Boolean).join(' · '));
  }
}

function paymentsFor_(ref) {
  const n = normRef_(ref);
  return payments_().getDataRange().getValues().slice(1).filter((x) => normRef_(x[1]) === n).slice(-5).map((x) => ({
    code: mpesaCode_(x[3]).replace(/^(.{3}).*(.{3})$/, '$1••••$2'), amount: num_(x[4]), date: ymd_(x[0]),
    status: /^confirmed$/i.test(String(x[6]).trim()) ? 'confirmed' : /^not received$/i.test(String(x[6]).trim()) ? 'declined' : 'pending'
  }));
}

/* ---------- Time log: hours per project ---------- */
const TIMELOG = 'Time log';
const TLHEAD = ['Date', 'Project reference', 'Hours (e.g. 1.5 or 1:30)', 'What you did', 'Project (automatic)'];

function timelog_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TIMELOG);
  if (sh) return sh;
  sh = ss.insertSheet(TIMELOG);
  sh.appendRow(TLHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, TLHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('A2:A10000').setNumberFormat('d mmm yyyy');
  sh.getRange('C2:C10000').setNumberFormat('@');   // keep 1:30 as typed
  [110, 170, 140, 380, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

// "1.5", "1:30", "90m", "1h 30m", "2 h" → hours
function hours_(v) {
  if (v instanceof Date) return v.getHours() + v.getMinutes() / 60;
  if (typeof v === 'number') return v > 0 ? v : 0;
  const t = String(v || '').trim().toLowerCase();
  let m;
  if ((m = /^(\d+):(\d{1,2})$/.exec(t))) return +m[1] + +m[2] / 60;
  if ((m = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?|s)?)?)?$/.exec(t)) && (m[1] || m[2])) return (+m[1] || 0) + (+m[2] || 0) / 60;
  return num_(t);
}
const round1_ = (n) => Math.round(n * 10) / 10;

function fillTimelog_(sh, row) {
  const who = clientOf_(sh.getRange(row, 2).getValue());
  sh.getRange(row, 5).setValue(who ? who.title + (who.name ? ' · ' + who.name : '') : '⚠ Reference not found in Projects');
  if (!sh.getRange(row, 1).getValue()) sh.getRange(row, 1).setValue(new Date());
}

// Hours, money in, costs and profit per project (from, to: optional period for "hours in period")
function projectStats_(from, to) {
  const inRange = (d) => !from || (d instanceof Date && d >= from && d < to);
  const projects = projects_().getDataRange().getValues().slice(1).filter((r) => r[0] && !/^DEMO/i.test(String(r[0])));
  const log = timelog_().getDataRange().getValues().slice(1).filter((x) => x[1]);
  const receipts = invoices_().getDataRange().getValues().slice(1).filter((x) => String(x[1]).trim() === 'Receipt' && String(x[10]).trim() === 'Sent');
  const exp = expenses_().getDataRange().getValues().slice(1).filter((x) => x[7]);
  return projects.map((p) => {
    const n = normRef_(p[0]);
    const mine = log.filter((x) => normRef_(x[1]) === n);
    const hours = mine.reduce((a, x) => a + hours_(x[2]), 0);
    const paid = receipts.filter((x) => normRef_(x[3]) === n).reduce((a, x) => a + num_(x[8]), 0);
    const costs = exp.filter((x) => normRef_(x[7]) === n).reduce((a, x) => a + num_(x[3]), 0);
    return {
      ref: String(p[0]), title: String(p[1] || p[0]), client: String(p[2] || ''), stage: String(p[3] || ''),
      hours: round1_(hours), periodHours: round1_(mine.filter((x) => inRange(x[0])).reduce((a, x) => a + hours_(x[2]), 0)),
      paid, costs, profit: paid - costs, perHour: hours ? Math.round((paid - costs) / hours) : null,
      lastWork: mine.reduce((a, x) => (x[0] instanceof Date && x[0] > a ? x[0] : a), p[10] instanceof Date ? p[10] : new Date(0))
    };
  }).filter((s) => s.hours || s.paid || s.costs);
}

function projectsSection_(from, to) {
  const stats = projectStats_(from, to).filter((s) => s.periodHours || s.paid);
  if (!stats.length) return '';
  const hours = stats.reduce((a, s) => a + s.periodHours, 0);
  const rows = stats.sort((a, b) => b.periodHours - a.periodHours || b.paid - a.paid).slice(0, 15).map((s) =>
    '<tr><td style="padding:5px 0"><b>' + html_(s.title) + '</b><br><span style="font-size:11px;color:#777">' + html_(s.ref) + (s.periodHours ? ' · ' + s.periodHours + ' h this month' : '') + '</span></td>' +
    '<td style="padding:5px 6px;text-align:right">' + s.hours + ' h</td><td style="padding:5px 6px;text-align:right">' + kes_(s.profit) + '</td>' +
    '<td style="padding:5px 0;text-align:right;font-weight:bold">' + (s.perHour === null ? '–' : kes_(s.perHour) + '/h') + '</td></tr>').join('');
  return '<h3 style="margin:22px 0 6px;font-size:15px">Projects: time and profit</h3>' +
    '<p style="margin:0 0 6px;font-size:13px;color:#555">Hours logged this month: <b>' + round1_(hours) + '</b>. Totals per project (all time): hours, profit (paid minus project costs) and what you earned per hour.</p>' +
    '<table width="100%" style="font-size:13px"><tr style="color:#777;font-size:11px"><td>PROJECT</td><td style="text-align:right">HOURS</td><td style="text-align:right">PROFIT</td><td style="text-align:right">PER HOUR</td></tr>' + rows + '</table>';
}

/* ---------- Dashboard tab: charts and totals ---------- */
const DASHBOARD = 'Dashboard';

function dashboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(DASHBOARD);
  if (sh) return sh;
  sh = ss.insertSheet(DASHBOARD, 0);
  [230, 140, 30, 110, 110, 110, 110, 30, 150, 80, 30, 160, 120, 30, 160, 90, 30, 90, 80].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

function refreshDashboard() {
  const sh = dashboard_(), tz = 'Africa/Nairobi', now = new Date();
  const month0 = new Date(now.getFullYear(), now.getMonth(), 1), year0 = new Date(now.getFullYear(), 0, 1), soon = new Date(now.getTime() + 1000);
  const m = money_(month0, soon), y = money_(year0, soon);
  const projects = projects_().getDataRange().getValues().slice(1).filter((r) => r[0] && !/^DEMO/i.test(String(r[0])));
  const active = projects.filter((r) => !/^delivered$/i.test(String(r[3]).trim()));
  const invRows = invoices_().getDataRange().getValues().slice(1);
  const unpaid = invRows.filter((r) => String(r[1]).trim() === 'Invoice' && String(r[10]).trim() === 'Sent' && num_(r[7]) - num_(r[8]) > 0 && !invoicePaid_(r, invRows));
  const toConfirm = payments_().getDataRange().getValues().slice(1).filter((r) => /^to confirm$/i.test(String(r[6]).trim()));
  const reviews = sheet_().getDataRange().getValues().slice(1).filter((r) => r[1] && r[5] && !/^(hide|hidden|no|spam|delete)$/i.test(String(r[7]).trim()));
  const avg = reviews.length ? reviews.reduce((a, r) => a + (Number(r[4]) || 5), 0) / reviews.length : 0;
  const trainees = trainees_().getDataRange().getValues().slice(1).filter((r) => r[0] && r[1] instanceof Date && r[1] >= year0 && !/^cancelled$/i.test(String(r[8]).trim()));
  const subs = subscribers_().getDataRange().getValues().slice(1).filter((r) => r[0] && !/^unsub/i.test(String(r[4])));
  const stats = projectStats_(year0, soon);
  const yHours = stats.reduce((a, s) => a + s.periodHours, 0);
  const openQuotes = invRows.filter((r) => String(r[1]).trim() === 'Quote' && String(r[10]).trim() === 'Sent' && !r[14] && r[2] instanceof Date && now - r[2] < 30 * 864e5);

  sh.getRange('A1:S80').clearContent();
  sh.getRange('A1').setValue('Nexus CAD Studio dashboard').setFontWeight('bold').setFontSize(18);
  sh.getRange('A2').setValue('Updated ' + Utilities.formatDate(now, tz, 'd MMM yyyy, HH:mm') + ' · refreshes every morning and when you open the sheet (or menu Website → Refresh the dashboard)').setFontColor('#666666');

  const kpis = [
    ['THIS MONTH', ''],
    ['Income', m.income], ['Expenses', m.expenses], ['Profit', m.income - m.expenses],
    ['THIS YEAR', ''],
    ['Income', y.income], ['Expenses', y.expenses], ['Profit', y.income - y.expenses],
    ['Hours logged', round1_(yHours)], ['Earned per hour (logged projects)', yHours ? Math.round(stats.reduce((a, s) => a + (s.periodHours ? s.profit : 0), 0) / yHours) : ''],
    ['Trainees', trainees.length],
    ['RIGHT NOW', ''],
    ['Active projects', active.length], ['Balances to collect', active.reduce((a, r) => a + num_(r[8]), 0)],
    ['Unpaid invoices', unpaid.length], ['Quotes waiting for an answer', openQuotes.length], ['Payments to confirm', toConfirm.length],
    ['Average rating', reviews.length ? Math.round(avg * 10) / 10 + ' ★ (' + reviews.length + ' reviews)' : 'No reviews yet'],
    ['Subscribers', subs.length]
  ];
  sh.getRange(4, 1, kpis.length, 2).setValues(kpis);
  kpis.forEach((k, i) => { if (k[1] === '' && /^[A-Z ]+$/.test(k[0])) sh.getRange(4 + i, 1).setFontWeight('bold').setFontColor('#c4422a'); });
  ['B5:B7', 'B9:B11', 'B13', 'B17'].forEach((a) => sh.getRange(a).setNumberFormat('"KES "#,##0'));

  // Last 12 months
  const months = [['Month', 'Income', 'Expenses', 'Profit']];
  for (let k = 11; k >= 0; k--) {
    const a = new Date(now.getFullYear(), now.getMonth() - k, 1), b = new Date(now.getFullYear(), now.getMonth() - k + 1, 1);
    const x = money_(a, b);
    months.push([Utilities.formatDate(a, tz, 'MMM yy'), x.income, x.expenses, x.income - x.expenses]);
  }
  sh.getRange(4, 4, 13, 4).setValues(months);
  sh.getRange('E5:G16').setNumberFormat('#,##0');

  const stages = [['Stage', 'Projects']].concat(STAGES.map((s) => [s, projects.filter((r) => String(r[3]).trim().toLowerCase() === s.toLowerCase()).length]));
  sh.getRange(4, 9, stages.length, 2).setValues(stages);

  const services = ['Engineering design', 'Graphic design', 'Training', 'Design projects', 'Other'];
  sh.getRange(4, 12, 6, 2).setValues([['Service', 'Income this year']].concat(services.map((s) => [s, y.byService[s] || 0])));
  sh.getRange('M5:M9').setNumberFormat('#,##0');

  const courses = {};
  trainees.forEach((r) => { const c = String(r[5] || 'Other').trim() || 'Other'; courses[c] = (courses[c] || 0) + 1; });
  const crow = Object.keys(courses).sort((a, b) => courses[b] - courses[a]).slice(0, 10).map((c) => [c, courses[c]]);
  while (crow.length < 10) crow.push(['', '']);
  sh.getRange(4, 15, 11, 2).setValues([['Course', 'Trainees this year']].concat(crow));

  sh.getRange(4, 18, 6, 2).setValues([['Rating', 'Reviews']].concat([5, 4, 3, 2, 1].map((n) => ['★'.repeat(n), reviews.filter((r) => (Number(r[4]) || 5) === n).length])));

  // Profit per project
  const prow = stats.sort((a, b) => b.lastWork - a.lastWork).slice(0, 15).map((s) => [s.title + ' (' + s.ref + ')', s.hours, s.paid, s.costs, s.profit, s.perHour === null ? '' : s.perHour]);
  while (prow.length < 15) prow.push(['', '', '', '', '', '']);
  sh.getRange(19, 4).setValue('Profit per project (all time)').setFontWeight('bold').setFontColor('#c4422a');
  sh.getRange(20, 4, 16, 6).setValues([['Project', 'Hours', 'Paid', 'Costs', 'Profit', 'KES per hour']].concat(prow));
  sh.getRange('F21:I35').setNumberFormat('#,##0');
  [sh.getRange('D4:G4'), sh.getRange('I4:J4'), sh.getRange('L4:M4'), sh.getRange('O4:P4'), sh.getRange('R4:S4'), sh.getRange('D20:I20')].forEach((r) => r.setFontWeight('bold').setBackground('#f6f1e7'));

  // Charts (made once; they follow the numbers above)
  if (!sh.getCharts().length) {
    const chart = (type, range, row, col, title, opts) => {
      let b = sh.newChart().setChartType(type).addRange(sh.getRange(range)).setNumHeaders(1).setPosition(row, col, 0, 0)
        .setOption('title', title).setOption('width', 560).setOption('height', 300).setOption('legend', { position: 'bottom' });
      Object.keys(opts || {}).forEach((k) => { b = b.setOption(k, opts[k]); });
      sh.insertChart(b.build());
    };
    chart(Charts.ChartType.COLUMN, 'D4:F16', 38, 1, 'Income and expenses (last 12 months, KES)', { colors: ['#13a89e', '#ff6b4a'] });
    chart(Charts.ChartType.BAR, 'I4:J10', 38, 7, 'Projects by stage', { colors: ['#1f4fd1'], legend: { position: 'none' } });
    chart(Charts.ChartType.PIE, 'L4:M9', 54, 1, 'Income by service (this year)', { pieHole: 0.45, colors: ['#1f4fd1', '#ff6b4a', '#13a89e', '#ffb627', '#7457f2'] });
    chart(Charts.ChartType.COLUMN, 'R4:S9', 54, 7, 'Reviews by rating', { colors: ['#ffb627'], legend: { position: 'none' } });
    chart(Charts.ChartType.BAR, 'O4:P14', 70, 1, 'Trainees per course (this year)', { colors: ['#13a89e'], legend: { position: 'none' } });
  }
}

/* ---------- Free downloads in exchange for an email address ---------- */
const DOWNLOADS = 'Downloads';
const DLHEAD = ['Title', 'Description', 'File (a website file such as pdfs/x.pdf, or a Google Drive link shared with "Anyone with the link")', 'Show on website', 'Requests (automatic)'];
const SEED_DOWNLOADS = [
  ['AutoCAD shortcuts cheat sheet', 'The command aliases, function keys and object snaps I teach in every AutoCAD class, on one printable page.', 'pdfs/autocad-shortcuts-cheat-sheet.pdf', 'Yes', 0],
  ['SolidWorks shortcuts cheat sheet', 'View, selection and sketching shortcuts plus mouse gestures that make SolidWorks faster, on one printable page.', 'pdfs/solidworks-shortcuts-cheat-sheet.pdf', 'Yes', 0]
];
const downloads_ = () => listTab_(DOWNLOADS, DLHEAD, SEED_DOWNLOADS, [260, 420, 380, 110, 110], null, 4);
const fileUrl_ = (f) => { const t = String(f || '').trim(); return /^https?:\/\//i.test(t) ? t : t ? SITE_URL + t.replace(/^\/+/, '') : ''; };

function download_(p) {
  const email = clean_(p.email, 120).toLowerCase(), want = slug_(p.item);
  if (!validEmail_(email) || !want) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('dl-count') || 0);
  if (count >= 60) return { ok: false, error: 'busy' };
  cache.put('dl-count', String(count + 1), 3600);
  const sh = downloads_(), rows = sh.getDataRange().getValues();
  const i = rows.findIndex((r, k) => k > 0 && shown_(r, 3) && slug_(r[0]) === want);
  if (i < 1 || !fileUrl_(rows[i][2])) return { ok: false };
  const title = String(rows[i][0]).trim(), url = fileUrl_(rows[i][2]), name = clean_(p.name, 80);
  const join = !/^no$/i.test(String(p.subscribe || '').trim());
  if (join) subscribe_({ email: email, name: name, source: 'Free download: ' + title });
  sh.getRange(i + 1, 5).setValue(num_(rows[i][4]) + 1);
  const unsub = unsubLink_(email);
  MailApp.sendEmail({ to: email, name: SENDER, subject: 'Your free download: ' + title,
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">CAD TIPS · NEXUS CAD STUDIO</p>' +
      '<p>Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
      '<p>Here is your free <b>' + html_(title) + '</b>. Print it and keep it next to your keyboard!</p>' +
      '<p><a href="' + html_(url) + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Download ' + html_(title) + '</a></p>' +
      '<p>Want to go further? I run a free weekly AutoCAD webinar and hands-on <a href="' + SITE_URL + 'training/">CAD training</a> in AutoCAD, SolidWorks, Inventor and Fusion 360.</p>' +
      (join ? '<p>You will also get my occasional CAD tips by email.</p>' : '') +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p>' +
      (join ? '<p style="margin-top:24px;font-size:11px;color:#888"><a href="' + unsub + '" style="color:#888">Unsubscribe from CAD tips</a></p>' : '') + '</div>',
    body: 'Here is your free ' + title + ': ' + url + (join ? '\n\nUnsubscribe: ' + unsub : '') });
  return { ok: true };
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
const THEAD = ['Trainee ID (automatic)', 'Registered', 'Name', 'Email', 'Phone / WhatsApp', 'Course', 'Class', 'Format', 'Status', 'Completed on', 'Certificate code (automatic)', 'Certificate (automatic)', 'Notes', 'Discount / referral code (automatic)'];
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
  [150, 110, 180, 220, 150, 160, 220, 130, 120, 120, 170, 200, 260, 200].forEach((w, i) => sh.setColumnWidth(i + 1, w));
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
    const starts = r[9] instanceof Date && !isNaN(r[9]) ? Utilities.formatDate(r[9], SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd') : '';
    return { name, nextClass, seats, taken, left: seats ? Math.max(0, seats - taken) : null, full: !!seats && taken >= seats, starts };
  });
}
const trainingInfo_ = () => ({ courses: classes_().map((c) => ({ name: c.name, nextClass: c.nextClass, seats: c.seats || null, left: c.left, full: c.full, starts: c.starts })) });

/* ---------- Cohort launch: announce a new class to the people interested in that course ----------
   In the Courses tab, set "Announce this class to interested people?" to Yes. Once a day (or from the
   Website menu: Announce new classes now) everyone who downloaded that course's syllabus and is still
   subscribed, plus anyone on its waiting list, gets one email about the class with a Reserve link.
   People who already reserved this class are skipped. At most 60 emails per run, so a long list is
   finished over the next days. "Announced" shows the progress; clear it to announce again. */
const ANNOUNCE_PER_RUN = 60;
const courseId_ = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function announceClasses() {
  const sh = courses_(), rows = sh.getDataRange().getValues();
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const props = PropertiesService.getScriptProperties();
  const subs = subscribers_().getDataRange().getValues().slice(1);
  const trainees = trainees_().getDataRange().getValues().slice(1);
  let budget = ANNOUNCE_PER_RUN;
  const done = [];
  for (let i = 1; i < rows.length && budget > 0; i++) {
    const r = rows[i];
    const name = String(r[0]).trim();
    if (!name || !shown_(r, 4) || !/^yes$/i.test(String(r[10]).trim()) || /^sent/i.test(String(r[11]).trim())) continue;
    const nextClass = String(r[5] || '').trim() || setting_('Training next intake');
    const starts = r[9] instanceof Date && !isNaN(r[9]) ? Utilities.formatDate(r[9], tz, 'EEEE d MMMM yyyy') : '';
    const lc = name.toLowerCase();
    const booked = new Set(trainees.filter((t) => String(t[5]).trim().toLowerCase() === lc && String(t[6]).trim() === nextClass &&
      /^(reserved|confirmed|paid|in training)$/i.test(String(t[8]).trim())).map((t) => String(t[3]).trim().toLowerCase()));
    const people = {};
    subs.filter((x) => /^subscribed$/i.test(String(x[4]).trim()) && String(x[3]).trim().toLowerCase() === 'syllabus: ' + lc)
      .forEach((x) => { people[String(x[0]).trim().toLowerCase()] = String(x[1] || '').trim(); });
    trainees.filter((t) => String(t[5]).trim().toLowerCase() === lc && /^waiting list$/i.test(String(t[8]).trim()))
      .forEach((t) => { people[String(t[3]).trim().toLowerCase()] = String(t[2] || '').trim(); });
    const all = Object.keys(people).filter((e) => validEmail_(e) && !booked.has(e));
    const key = 'announce:' + courseId_(name) + ':' + nextClass + ':' + starts;
    const sent = new Set(String(props.getProperty(key) || '').split(',').filter(Boolean));
    const page = SITE_URL + 'training/' + courseId_(name) + '.html';
    const reserve = SITE_URL + 'training/index.html?course=' + encodeURIComponent(name) + '#reserve';
    for (const email of all) {
      if (sent.has(email)) continue;
      if (budget <= 0) break;
      const first = String(people[email] || '').split(' ')[0];
      try {
        MailApp.sendEmail({ to: email, name: SENDER, subject: 'New ' + name + ' class' + (starts ? ': starts ' + Utilities.formatDate(r[9], tz, 'd MMM') : '') + ', reserve your seat',
          htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
            '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">CAD TRAINING · NEXUS CAD STUDIO</p>' +
            '<p>Hello' + (first ? ' ' + html_(first) : '') + ',</p>' +
            '<p>A new <b>' + html_(name) + '</b> class is open' + (nextClass ? ': <b>' + html_(nextClass) + '</b>' : '') + (starts ? ', starting <b>' + html_(starts) + '</b>' : '') + '.</p>' +
            '<p>You asked about this course, so you are hearing about it first.' + (num_(r[6]) ? ' Seats are limited to ' + Math.round(num_(r[6])) + '.' : '') + '</p>' +
            '<p><a href="' + html_(reserve) + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Reserve your seat</a></p>' +
            '<p>See the full syllabus: <a href="' + html_(page) + '#syllabus">' + html_(page.replace(/^https:\/\//, '')) + '</a>. Questions? Just reply to this email.</p>' +
            '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p>' +
            '<p style="margin-top:24px;font-size:11px;color:#888"><a href="' + unsubLink_(email) + '" style="color:#888">Unsubscribe</a></p></div>',
          body: 'A new ' + name + ' class is open' + (nextClass ? ': ' + nextClass : '') + (starts ? ', starting ' + starts : '') + '.\nReserve your seat: ' + reserve + '\n\nUnsubscribe: ' + unsubLink_(email),
          replyTo: Session.getEffectiveUser().getEmail() || undefined });
      } catch (err) {
        if (/too many times|quota|limit/i.test(err.message)) { budget = 0; break; }
        console.error('announce ' + email + ': ' + err.message);
      }
      sent.add(email);
      budget--;
    }
    props.setProperty(key, [...sent].join(','));
    const left = all.filter((e) => !sent.has(e)).length;
    const when = Utilities.formatDate(new Date(), tz, 'd MMM yyyy');
    sh.getRange(i + 1, 12).setValue(left ? 'Sending: ' + sent.size + ' of ' + all.length + ' (continues tomorrow)' : 'Sent to ' + sent.size + ' people on ' + when);
    done.push(name + ': ' + (left ? sent.size + ' of ' + all.length + ' so far' : 'sent to ' + sent.size));
  }
  return done.length ? done.join('\n') : 'No class is waiting to be announced. Set "Announce this class to interested people?" to Yes in the Courses tab.';
}
function announceClassesNow() {
  const msg = announceClasses();
  try { SpreadsheetApp.getUi().alert(msg); } catch (err) { console.log(msg); }
}

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
    const given = String(p.Reference || p.ref || '').trim().toUpperCase();
    id = /^TRN-\d{4}-[A-Z2-9]{5}$/.test(given) && !rows.some((r) => String(r[0]).trim().toUpperCase() === given) ? given : newId_('TRN');
    const code = useCode_(p['Discount code'] || p.code, { for: 'Training', email: email, name: name, ref: id });
    const notes = [p.Level ? 'Level: ' + clean_(p.Level, 60) : '', p['Preferred schedule'] ? 'Prefers: ' + clean_(p['Preferred schedule'], 80) : '', p.Message ? clean_(p.Message, 600) : ''].filter(Boolean).join(' · ');
    sh.appendRow([id, new Date(), name, email, clean_(p['Phone / WhatsApp'] || p.phone, 40), c ? c.name : course, klass, clean_(p.Format, 60), status, '', '', '', notes, code]);
  } finally {
    lock.releaseLock();
  }
  try {
    newRequestAlert_({
      setting: 'Email me new training seat requests', tab: TRAINEES, email: email, phone: p['Phone / WhatsApp'] || p.phone, name: name,
      subject: '🎓 Seat request: ' + course + (status === 'Waiting list' ? ' (waiting list)' : '') + ', ' + name,
      kicker: 'New training seat request from the website', title: course + ' training, ' + name,
      waText: 'Thanks for reserving a seat for ' + course + ' training.',
      fields: [['Reference', id], ['Name', name], ['Email', email], ['Phone / WhatsApp', clean_(p['Phone / WhatsApp'] || p.phone, 40)], ['Course', course],
        ['Class', klass], ['Status', status], ['Level', clean_(p.Level, 60)], ['Format', clean_(p.Format, 60)], ['Preferred schedule', clean_(p['Preferred schedule'], 80)],
        ['Discount code', clean_(p['Discount code'] || p.code, 30)], ['Message', clean_(p.Message, 600)]]
    });
  } catch (err) { console.error('seat alert: ' + err); }
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
      inv.appendRow(['', 'Invoice', new Date(), id, name, email, course + ' training' + (r[6] ? ' (' + r[6] + ')' : '') + (price ? ' - ' + price : ''), '', '', '', 'Draft', '', 'Drafted from the Trainees tab: check it, then set Action to Send', '', '', codeOf_(r[13])]);
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

/* ---------- Money: expenses and the monthly report ---------- */
const EXPENSES = 'Expenses';
const EHEAD = ['Date', 'Category', 'Description', 'Amount (KES)', 'Paid with', 'Receipt / proof (link, optional)', 'Notes', 'Project reference (optional)'];
const E_CATS = ['Software & subscriptions', 'Printing & materials', 'Transport', 'Data & airtime', 'Equipment', 'Marketing & ads', 'Training costs', 'Fees & charges', 'Other'];

function expenses_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(EXPENSES);
  if (sh) return sh;
  sh = ss.insertSheet(EXPENSES);
  sh.appendRow(EHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, EHEAD.length).setFontWeight('bold');
  sh.getRange('A2:A5000').setNumberFormat('d mmm yyyy');
  sh.getRange('B2:B5000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(E_CATS, true).setAllowInvalid(true).build());
  sh.getRange('E2:E5000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['M-Pesa', 'Cash', 'Bank', 'Card'], true).setAllowInvalid(true).build());
  [110, 190, 300, 120, 110, 260, 260, 170].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

// Which service a payment belongs to (from its reference)
function serviceOf_(ref) {
  const n = normRef_(ref);
  if (/^TRN/.test(n)) return 'Training';
  if (!n) return 'Other';
  const b = subs_().getDataRange().getValues().slice(1).find((r) => normRef_(r[0]) === n);
  if (b && /graphic/i.test(b[6])) return 'Graphic design';
  if (b && /engineer/i.test(b[6])) return 'Engineering design';
  return 'Design projects';
}

// Income (receipts sent) and expenses between two dates
function money_(from, to) {
  const inRange = (d) => d instanceof Date && d >= from && d < to;
  const receipts = invoices_().getDataRange().getValues().slice(1).filter((r) => String(r[1]).trim() === 'Receipt' && String(r[10]).trim() === 'Sent' && inRange(r[2]));
  const byService = {};
  receipts.forEach((r) => { const k = serviceOf_(r[3]); byService[k] = (byService[k] || 0) + num_(r[8]); });
  const exp = expenses_().getDataRange().getValues().slice(1).filter((r) => inRange(r[0]) && num_(r[3]) > 0);
  const byCat = {};
  exp.forEach((r) => { const k = String(r[1] || 'Other').trim() || 'Other'; byCat[k] = (byCat[k] || 0) + num_(r[3]); });
  return {
    income: receipts.reduce((a, r) => a + num_(r[8]), 0), receipts: receipts.length, byService,
    expenses: exp.reduce((a, r) => a + num_(r[3]), 0), byCat
  };
}

function moneyEmail_(title, from, to) {
  const me = Session.getEffectiveUser().getEmail();
  if (!me) return;
  const m = money_(from, to), profit = m.income - m.expenses;
  const y = money_(new Date(from.getFullYear(), 0, 1), to);
  const rows = (obj) => Object.keys(obj).sort((a, b) => obj[b] - obj[a]).map((k) => '<tr><td style="padding:5px 0">' + html_(k) + '</td><td style="padding:5px 0;text-align:right">' + kes_(obj[k]) + '</td></tr>').join('') || '<tr><td style="color:#777;padding:5px 0">None</td><td></td></tr>';
  const stat = (n, label, color) => '<td style="padding:12px;background:#f6f1e7;border-radius:12px;text-align:center"><div style="font-size:20px;font-weight:bold' + (color ? ';color:' + color : '') + '">' + n + '</div><div style="font-size:11px;color:#666">' + label + '</div></td>';
  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0e1a3a">' +
    '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · MONEY REPORT</p>' +
    '<h2 style="margin:0 0 14px">' + html_(title) + '</h2>' +
    '<table width="100%" cellspacing="6"><tr>' + stat(kes_(m.income), 'income (' + m.receipts + ' receipt' + (m.receipts === 1 ? '' : 's') + ')') + stat(kes_(m.expenses), 'expenses') + stat(kes_(profit), 'profit', profit >= 0 ? '#137a49' : '#b23a22') + '</tr></table>' +
    '<h3 style="margin:22px 0 6px;font-size:15px">Income by service</h3><table width="100%">' + rows(m.byService) + '</table>' +
    '<h3 style="margin:22px 0 6px;font-size:15px">Expenses by category</h3><table width="100%">' + rows(m.byCat) + '</table>' +
    projectsSection_(from, to) +
    '<p style="margin-top:22px">This year so far: income <b>' + kes_(y.income) + '</b> · expenses <b>' + kes_(y.expenses) + '</b> · profit <b>' + kes_(y.income - y.expenses) + '</b></p>' +
    '<p style="font-size:12px;color:#888">Income counts the receipts you sent from the Invoices tab; expenses come from the Expenses tab.</p>' +
    '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" style="background:#0e1a3a;color:#fff;padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:bold">Open your sheet</a></p></div>';
  MailApp.sendEmail({ to: me, name: 'Nexus CAD Studio website', subject: title + ': profit ' + kes_(profit), htmlBody: html });
}

function monthlyReport() {
  if (/^no$/i.test(setting_('Monthly money report'))) return;
  const now = new Date(), from = new Date(now.getFullYear(), now.getMonth() - 1, 1), to = new Date(now.getFullYear(), now.getMonth(), 1);
  moneyEmail_('Money report for ' + Utilities.formatDate(from, 'Africa/Nairobi', 'MMMM yyyy'), from, to);
}
function moneyReportNow() {
  const now = new Date();
  moneyEmail_('Money report for ' + Utilities.formatDate(now, 'Africa/Nairobi', 'MMMM yyyy') + ' (so far)', new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getTime() + 1000));
}

/* ---------- Follow-ups after delivery: review request (next day) and one-year check-in ---------- */
const ymdLocal_ = (d) => Utilities.formatDate(d, 'Africa/Nairobi', 'yyyy-MM-dd');

function markDelivered_(sh, row) {
  const cell = sh.getRange(row, 15), cur = String(cell.getValue() || '').trim();
  if (/^off/i.test(cur) || /delivered \d{4}-\d{2}-\d{2}/i.test(cur)) return;
  cell.setValue('Delivered ' + ymdLocal_(new Date()));
}

function followUpJob() {
  const sh = projects_(), rows = sh.getDataRange().getValues().slice(1);
  const today = ymdLocal_(new Date());
  const reviews = sheet_().getDataRange().getValues().slice(1);
  rows.forEach((r, i) => {
    const row = i + 2, f = String(r[14] || '').trim();
    const m = /delivered (\d{4}-\d{2}-\d{2})/i.exec(f);
    if (!m || /^off/i.test(f) || !/^delivered$/i.test(String(r[3]).trim())) return;
    const email = String(r[11] || '').trim(), name = String(r[2] || '').trim(), title = String(r[1] || r[0]);
    if (!validEmail_(email) || MailApp.getRemainingDailyQuota() <= 10) return;
    const delivered = new Date(m[1] + 'T09:00:00+03:00');
    let note = f;
    // 1. Thank-you the day after delivery: a review request (unless they already left one) and their referral code
    if (!/review asked|reviewed|thanked/i.test(f) && today > m[1]) {
      const already = reviews.some((x) => (name && String(x[1]).trim().toLowerCase() === name.toLowerCase()) || (x[6] && String(x[6]).trim().toLowerCase() === title.toLowerCase()));
      const ask = !already && !/^no$/i.test(setting_('Ask delivered clients for a review'));
      const code = !/^no$/i.test(setting_('Referral programme')) ? referralFor_(name, email, String(r[0])) : '';
      if (ask || code) {
        const b = subs_().getDataRange().getValues().slice(1).find((x) => normRef_(x[0]) === normRef_(r[0]));
        const service = b && /graphic/i.test(b[6]) ? 'Graphic Design' : 'Engineering Design';
        const link = SITE_URL + '?review=1&name=' + encodeURIComponent(name) + '&project=' + encodeURIComponent(title) + '&service=' + encodeURIComponent(service) + '#reviews';
        MailApp.sendEmail({ to: email, name: SENDER, subject: ask ? 'How did ' + title + ' turn out?' : 'Thank you for choosing Nexus CAD Studio',
          htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
            '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · THANK YOU</p>' +
            '<p>Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
            '<p>Thank you for choosing Nexus CAD Studio for <b>' + html_(title) + '</b>. I hope everything is working well for you.</p>' +
            (ask ? '<p>If you have a minute, a short review would mean a lot and helps other clients decide. It takes less than a minute:</p>' +
              '<p><a href="' + link + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">★ Leave a review</a></p>' : '') +
            (code ? referralBlock_(code) : '') +
            '<p style="font-size:13px;color:#555">If anything needs adjusting, just reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
            '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>',
          body: 'Thank you for choosing Nexus CAD Studio for ' + title + '.' + (ask ? ' A short review would mean a lot: ' + link : '') + (code ? ' Your referral code: ' + code : '') });
        note += ask ? ' · Review asked ' + today : ' · Thanked ' + today;
      }
      if (already) note += ' · Reviewed';
    }
    // 2. One year later: a friendly check-in
    const year = new Date(delivered.getTime()); year.setFullYear(year.getFullYear() + 1);
    if (!/year check-in/i.test(note) && new Date() >= year && !/^no$/i.test(setting_('One-year follow-up email'))) {
      MailApp.sendEmail({ to: email, name: SENDER, subject: 'One year since ' + title + '!',
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
          '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO</p>' +
          '<p>Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
          '<p>It is one year since we completed <b>' + html_(title) + '</b> together. Thank you again for your trust!</p>' +
          '<p>If you have a new design, drawings, simulation, poster or training need, I would be glad to help. As a returning client, just mention this email when you get in touch.</p>' +
          (function () { const c = /^no$/i.test(setting_('Referral programme')) ? '' : referralFor_(name, email, String(r[0])); return c ? referralBlock_(c) : ''; })() +
          '<p><a href="' + SITE_URL + '#brief" style="background:#0e1a3a;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Start a new project</a></p>' +
          '<p style="font-size:13px;color:#555">Or simply <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
          '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>',
        body: 'It is one year since we completed ' + title + '. If you have a new project, I would be glad to help: ' + SITE_URL + '#brief' });
      note += ' · Year check-in ' + today;
    }
    if (note !== f) sh.getRange(row, 15).setValue(note);
  });
}

/* ---------- Daily (9am) and weekly jobs ---------- */
function dailyJob() {
  try { reminderJob(); } catch (err) { console.error('reminders: ' + err); }
  try { followUpJob(); } catch (err) { console.error('follow-ups: ' + err); }
  try { refreshDashboard(); } catch (err) { console.error('dashboard: ' + err); }
  if (Utilities.formatDate(new Date(), 'Africa/Nairobi', 'd') === '1') { try { monthlyReport(); } catch (err) { console.error('money report: ' + err); } }
  try { announceClasses(); } catch (err) { console.error('announce classes: ' + err); }
  try { proReminderJob(); } catch (err) { console.error('quote pro reminders: ' + err); }
}

function backupFolder_() {
  const name = 'Nexus CAD Studio sheet backups';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}
function backupNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), folder = backupFolder_();
  DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' (backup ' + ymdLocal_(new Date()) + ')', folder);
  // Keep the newest 8 copies
  const files = [];
  const it = folder.searchFiles('trashed = false');
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(8).forEach((f) => f.setTrashed(true));
}
function backupJob() {
  if (/^no$/i.test(setting_('Weekly sheet backup'))) return;
  backupNow();
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

// "Get the syllabus as a PDF" on a course page: email the PDF link and add the person to Subscribers,
// with the source "Syllabus: <course>", so a new class of that course can be announced to them.
function syllabus_(p) {
  const email = clean_(p.email, 120).toLowerCase(), name = clean_(p.name, 80);
  const id = String(p.id || '').trim().toLowerCase(), course = clean_(p.course, 80);
  if (!validEmail_(email) || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(id) || !course) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('syl-count') || 0);
  if (count >= 60) return { ok: false, error: 'busy' };
  cache.put('syl-count', String(count + 1), 3600);
  subscribe_({ email: email, name: name, source: 'Syllabus: ' + course });
  const pdf = SITE_URL + 'pdfs/syllabus/' + id + '.pdf', page = SITE_URL + 'training/' + id + '.html';
  const unsub = unsubLink_(email);
  MailApp.sendEmail({ to: email, name: SENDER, subject: 'Your ' + course + ' training syllabus',
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">CAD TRAINING · NEXUS CAD STUDIO</p>' +
      '<p>Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
      '<p>Here is the full <b>' + html_(course) + '</b> training syllabus, session by session.</p>' +
      '<p><a href="' + html_(pdf) + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Download the syllabus (PDF)</a></p>' +
      '<p>When you are ready, <a href="' + html_(page) + '#syllabus">reserve a seat</a> or simply reply to this email with any question. I will also let you know when the next ' + html_(course) + ' class opens.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p>' +
      '<p style="margin-top:24px;font-size:11px;color:#888"><a href="' + unsub + '" style="color:#888">Unsubscribe</a></p></div>',
    body: 'Your ' + course + ' training syllabus: ' + pdf + '\n\nReserve a seat: ' + page + '\n\nUnsubscribe: ' + unsub,
    replyTo: Session.getEffectiveUser().getEmail() || undefined });
  return { ok: true };
}

// Free guides offered on the website for an email address. The key is the sign-up's source tag.
const LEAD_MAGNETS = {
  'lead-magnet-cswp': { title: 'SolidWorks CSWP quick-reference cheat sheet', file: 'pdfs/cswp-cheat-sheet.pdf', page: 'downloads/cswp-cheat-sheet.html', label: 'CSWP cheat sheet' }
};
function sendLeadMagnet_(email, name, m) {
  const unsub = unsubLink_(email), url = SITE_URL + m.file;
  MailApp.sendEmail({ to: email, name: SENDER, subject: 'Your free ' + m.title,
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">CAD TIPS · NEXUS CAD STUDIO</p>' +
      '<p>Hello' + (name ? ' ' + html_(name) : '') + ',</p>' +
      '<p>Here is your free <b>' + html_(m.title) + '</b>. Print it and keep it next to your keyboard while you practise.</p>' +
      '<p><a href="' + html_(url) + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Download the PDF</a></p>' +
      '<p>Or <a href="' + html_(SITE_URL + m.page) + '">open it in your browser</a>.</p>' +
      '<p>Ready to test yourself? Try the free timed <a href="' + SITE_URL + 'exams/">CSWP-style practice exam</a>: parts to model in 3 stages, with the mass and centre of mass marked straight away.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p>' +
      '<p style="margin-top:24px;font-size:11px;color:#888"><a href="' + unsub + '" style="color:#888">Unsubscribe from CAD tips</a></p></div>',
    body: 'Here is your free ' + m.title + ': ' + url + '\n\nPractise for the exam: ' + SITE_URL + 'exams/\n\nUnsubscribe: ' + unsub });
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
  let isNew = false, total = 0;
  const source = clean_(p.source, 60) || 'Website', name = clean_(p.name, 80);
  try {
    const sh = subscribers_();
    const rows = sh.getDataRange().getValues();
    const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
    if (i > 0) sh.getRange(i + 1, 5).setValue('Subscribed');
    else { sh.appendRow([email, name, new Date(), source, 'Subscribed']); isNew = true; }
    total = rows.slice(1).filter((r) => /^subscribed$/i.test(String(r[4]).trim())).length + (isNew ? 1 : 0);
  } finally {
    lock.releaseLock();
  }
  // A free guide from the website (e.g. the CSWP cheat sheet): email them a copy
  const magnet = LEAD_MAGNETS[source.toLowerCase()];
  if (magnet) { try { sendLeadMagnet_(email, name, magnet); } catch (err) { console.error('lead magnet email: ' + err); } }
  // Gmail alert to you for each genuinely new subscriber (not for someone already on the list)
  if (isNew) {
    try {
      const what = magnet ? magnet.label : /^syllabus: /i.test(source) ? source.replace(/^syllabus: /i, '') + ' syllabus' : /^free download: /i.test(source) ? source.replace(/^free download: /i, '') : /webinar/i.test(source) ? 'webinar' : 'newsletter';
      newRequestAlert_({
        setting: 'Email me new subscribers', tab: SUBSCRIBERS, email: email, phone: '', name: name,
        subject: '📬 New subscriber: ' + (name || email) + ' (' + what + ')',
        kicker: 'New subscriber from the website', title: (name || email) + ' joined your list',
        waText: '', fields: [['Email', email], ['Name', name], ['Signed up for', source], ['Subscribers now', total]]
      });
    } catch (err) { console.error('subscriber alert: ' + err); }
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
  const toConfirm = payments_().getDataRange().getValues().slice(1).filter((r) => /^to confirm$/i.test(String(r[6]).trim()));
  const openQuotes = invRows.filter((r) => String(r[1]).trim() === 'Quote' && String(r[10]).trim() === 'Sent' && !r[14] && r[2] instanceof Date && now - r[2] < 30 * 864e5);

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
    section('M-Pesa payments to confirm', toConfirm.map((r) => '<b>' + kes_(r[4]) + '</b> · ' + html_(r[2] || r[1]) + ' · code ' + html_(r[3]) + ' · ' + fmt(r[0])), 'None waiting.') +
    section('Quotes waiting for an answer', openQuotes.map((r) => '<b>' + html_(r[0]) + '</b> · ' + html_(r[4]) + ' · ' + kes_(r[7]) + ' · sent ' + fmt(r[2])), 'None.') +
    section('Unpaid invoices', unpaid.map((r) => '<b>' + html_(r[0]) + '</b> · ' + html_(r[4]) + ' · ' + kes_(num_(r[7]) - num_(r[8])) + ' · sent ' + fmt(r[2]) + (r[13] ? ' <span style="color:#777">(' + html_(r[13]) + ')</span>' : '')), 'No unpaid invoices.') +
    section('New reviews', reviews.map((r) => '★'.repeat(Math.min(5, Number(r[4]) || 5)) + ' <b>' + html_(r[1]) + '</b>: “' + html_(String(r[5]).slice(0, 140)) + (String(r[5]).length > 140 ? '…' : '') + '”'), 'No new reviews this week.') +
    '<p style="margin-top:22px">Subscribers: <b>' + subsAll.length + '</b> (' + subsNew.length + ' new this week)</p>' +
    (function () { const y = money_(new Date(now.getFullYear(), 0, 1), now); return '<p>This year so far: income <b>' + kes_(y.income) + '</b> · expenses <b>' + kes_(y.expenses) + '</b> · profit <b style="color:' + (y.income - y.expenses >= 0 ? '#137a49' : '#b23a22') + '">' + kes_(y.income - y.expenses) + '</b></p>'; })() +
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
  ['Email me new project briefs', 'Yes', 'Yes = the moment someone sends a project brief / quote request on the website, you get the full details in Gmail (press Reply to answer the client)'],
  ['Deliver files only when fully paid', 'No', 'Yes = the client\'s "Download project files" button (account page) appears only once their balance is 0. No = it appears at 100% progress'],
  ['Email me new accounts', 'Yes', 'Yes = you get an email in Gmail when someone creates an account on the website. No = they are only added to the Accounts tab'],
  ['Email me new subscribers', 'Yes', 'Yes = you get an email in Gmail for each new subscriber (newsletter, syllabus downloads, free downloads). No = they are only added to the Subscribers tab'],
  ['Email me new training seat requests', 'Yes', 'Yes = you get an email in Gmail each time someone reserves a training seat'],
  ['Monday summary email', 'Yes', 'Yes = every Monday morning you get an email summary of briefs, projects, balances, reviews and subscribers'],
  ['Email new articles to subscribers', 'Yes', 'Yes = each new article is emailed to the Subscribers tab once it is live on the website'],
  ['Payment reminders', 'Yes', 'Yes = unpaid invoices get a polite reminder email after 7 and 14 days (stops once you send a receipt)'],
  ['Monthly money report', 'Yes', 'Yes = on the 1st of each month you get last month\'s income, expenses and profit by email'],
  ['Ask delivered clients for a review', 'Yes', 'Yes = a day after a project is Delivered, the client gets a friendly review request'],
  ['One-year follow-up email', 'Yes', 'Yes = a year after delivery, past clients get a short "anything new we can help with?" email'],
  ['Weekly sheet backup', 'Yes', 'Yes = every Sunday a copy of this sheet is saved to the Drive folder "Nexus CAD Studio sheet backups"'],
  ['Training seat deposit (%)', '50', 'After reserving a training seat online, the trainee is asked to pay this % of the training starting price by M-Pesa to hold the seat (0 = no deposit step)'],
  ['Deposit for accepted quotes (%)', '50', 'When a client accepts a quote on the tracking page, a deposit invoice for this % of the total is made (0 = none, 100 = full payment)'],
  ['Send the deposit invoice automatically', 'Yes', 'Yes = the deposit invoice is emailed straight away. No = it waits in the Invoices tab for you to check and send'],
  ['Referral programme', 'Yes', 'Yes = delivered clients get a personal referral code in their thank-you email'],
  ['Referral discount for new clients (%)', '10', 'Discount a new client gets on their first quote when they use a referral code'],
  ['Referral reward (%)', '10', 'Discount the referring client earns (once their friend pays), claimed by using their own code on their next brief']
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
  accounts_();
  examResults_();
  cvs_();
  const p = projects_();
  if (!p.getRange(1, 12).getValue()) p.getRange(1, 12).setValue('Client email').setFontWeight('bold');
  if (!p.getRange(1, 13).getValue()) p.getRange(1, 13, 1, 2).setValues([[PHEAD[12], PHEAD[13]]]).setFontWeight('bold');
  if (!p.getRange(1, 15).getValue()) p.getRange(1, 15).setValue(PHEAD[14]).setFontWeight('bold').setWrap(true);
  if (!p.getRange(1, 16).getValue()) { p.getRange(1, 16).setValue(PHEAD[15]).setFontWeight('bold').setWrap(true); p.setColumnWidth(16, 260); }
  faq_();
  const ex = expenses_();
  if (!ex.getRange(1, 8).getValue()) ex.getRange(1, 8).setValue(EHEAD[7]).setFontWeight('bold');
  const sb = subs_();
  if (!sb.getRange(1, 14).getValue()) sb.getRange(1, 14).setValue(SHEAD[13]).setFontWeight('bold');
  const tn = trainees_();
  if (!tn.getRange(1, 14).getValue()) tn.getRange(1, 14).setValue(THEAD[13]).setFontWeight('bold').setWrap(true);
  promos_();
  referrals_();
  payments_();
  mpesaTab_();
  pro_().getRange('E2:E3000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(PRO_PLANS), true).build());   // adds new plans (Exams) to the list
  timelog_();
  downloads_();
  const co = courses_();
  if (!co.getRange(1, 6).getValue()) co.getRange(1, 6, 1, 2).setValues([[COHEAD[5], COHEAD[6]]]).setFontWeight('bold').setWrap(true);
  if (!co.getRange(1, 8).getValue()) { co.getRange(1, 8, 1, 2).setValues([[COHEAD[7], COHEAD[8]]]).setFontWeight('bold').setWrap(true); co.setColumnWidth(8, 220); co.setColumnWidth(9, 320); }
  if (!co.getRange(1, 10).getValue()) {
    co.getRange(1, 10, 1, 3).setValues([[COHEAD[9], COHEAD[10], COHEAD[11]]]).setFontWeight('bold').setWrap(true);
    [10, 11, 12].forEach((c) => co.setColumnWidth(c, 200));
    co.getRange('J2:J500').setNumberFormat('d mmm yyyy');
    co.getRange('K2:K500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(YESNO, true).build());
  }
  studentsTab_();
  trainees_();
  settings_();
  subs_();
  articles_();
  // "Job portfolio" columns (Works K, Certificates F): add the heading and a Yes/No list to tabs made before they existed
  [[works_(), 11, WHEAD[10]], [certs_(), 6, CEHEAD[5]]].forEach(([sh, col, label]) => {
    if (!sh.getRange(1, col).getValue()) sh.getRange(1, col).setValue(label).setFontWeight('bold').setWrap(true);
    sh.getRange(2, col, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(YESNO, true).build());
  });
  // Works: "Client deliverables" (L) and "Outcome" (M) columns for tabs made before they existed
  const wk = works_();
  // ... and the before / after comparison columns (N, O, P)
  [12, 13, 14, 15, 16].forEach((col) => { if (!wk.getRange(1, col).getValue()) { wk.getRange(1, col).setValue(WHEAD[col - 1]).setFontWeight('bold').setWrap(true); wk.setColumnWidth(col, 280); } });
  pricing_();
  courses_();
  recordings_();
  const inv = invoices_();
  if (!inv.getRange(1, 14).getValue()) inv.getRange(1, 14).setValue(IHEAD[13]).setFontWeight('bold').setWrap(true);
  if (!inv.getRange(1, 15).getValue()) inv.getRange(1, 15, 1, 2).setValues([[IHEAD[14], IHEAD[15]]]).setFontWeight('bold').setWrap(true);
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
    .filter((t) => ['notifyClient', 'weeklySummary', 'newsletterJob', 'reminderJob', 'dailyJob', 'backupJob', 'translateJob'].indexOf(t.getHandlerFunction()) > -1)
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('notifyClient').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('weeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).inTimezone('Africa/Nairobi').create();
  ScriptApp.newTrigger('newsletterJob').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1).atHour(9).inTimezone('Africa/Nairobi').create();
  try { refreshDashboard(); } catch (err) { console.error('dashboard: ' + err); }
  ScriptApp.newTrigger('backupJob').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).inTimezone('Africa/Nairobi').create();
  translations_();
  campaigns_();
  ScriptApp.newTrigger('translateJob').timeBased().everyHours(1).create();
}

// "Website" menu at the top of the sheet
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website')
    .addItem('Send me the weekly summary now', 'weeklySummary')
    .addItem('Email new articles to subscribers now', 'newsletterJob')
    .addItem('Send me this month\'s money report so far', 'moneyReportNow')
    .addItem('Back up this sheet now', 'backupNow')
    .addItem('Refresh the dashboard', 'refreshDashboard')
    .addItem('Translate new website text now', 'translateNow')
    .addItem('Announce new classes now', 'announceClassesNow')
    .addItem('Test the M-Pesa connection', 'mpesaTest')
    .addItem('Send a test M-Pesa prompt to my phone', 'mpesaTestPrompt')
    .addSeparator()
    .addItem('Set up / repair (run after updating the script)', 'setup')
    .addToUi();
  try { refreshDashboard(); } catch (err) { /* first run: setup creates it */ }
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
  if (sh.getName() === PAYMENTS && e.range.getColumn() === 7) return paymentChanged_(sh, e.range.getRow());
  if (sh.getName() === PRO && e.range.getColumn() === 8) return proChanged_(sh, e.range.getRow());
  if (sh.getName() === PROJECTS && [5, 16].indexOf(e.range.getColumn()) > -1) return filesReady_(sh, e.range.getRow());
  if (sh.getName() !== PROJECTS || e.range.getColumn() !== 4) return;
  if (/^delivered$/i.test(String(e.value || '').trim())) { markDelivered_(sh, e.range.getRow()); try { filesReady_(sh, e.range.getRow()); } catch (err) { console.error('files ready: ' + err); } }
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
  if (sh.getName() === TIMELOG && e.range.getColumn() === 2 && e.range.getRow() > 1 && e.range.getNumRows() === 1) return fillTimelog_(sh, e.range.getRow());
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
    if (sub) return { found: true, project: extras_(fromSubmission_(sub)) };
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
  return { found: true, project: extras_(p) };
}

// The latest quote (to accept) and reported M-Pesa payments, for the tracking page
function extras_(p) {
  try {
    const q = quoteFor_(p.ref);
    if (q && !p.declined && (q.state !== 'accepted' || (+p.stage || 0) < 2)) p.quote = q;
    const pay = paymentsFor_(p.ref);
    if (pay.length) p.payments = pay;
  } catch (err) { console.error('tracker extras: ' + err); }
  return p;
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

/* ---------- Quote Pro: paid licences for the sheet-metal quote tool (/quote/) ----------
   A fabricator pays by M-Pesa and sends the code from the tool's "Go Pro" window.
   The request lands in the "Quote Pro" tab and you get an email. Check your M-Pesa
   messages, then set Status to "Confirmed": a licence key is made, the buyer is emailed
   the key and a receipt (counted in your monthly money report). "Cancelled" switches a
   key off straight away. Paying again with the same key (or email) extends it.
   Five days before a key runs out, the buyer gets a renewal reminder. */
const PRO = 'Quote Pro';
const PROHEAD = ['Received', 'Business', 'Email', 'Phone', 'Plan', 'Amount (KES)', 'M-Pesa code', 'Status', 'Licence key (automatic)', 'Expires', 'Renewal reminder (automatic)', 'Notes'];
const PRO_STATUS = ['To confirm', 'Confirmed', 'Not received', 'Cancelled'];
const PRO_PLANS = { Monthly: 31, Yearly: 366, Exams: 31 };   // Exams: the SolidWorks exam practice pass (/exams/)
const isExam_ = (plan) => String(plan || '').trim() === 'Exams';
const proName_ = (plan) => (isExam_(plan) ? 'SolidWorks exam pass' : 'Quote Pro');
const PRO_DEVICES = 3;   // phones / computers one key can be used on

function pro_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PRO);
  if (sh) return sh;
  sh = ss.insertSheet(PRO);
  sh.appendRow(PROHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, PROHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('A2:A3000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.getRange('J2:J3000').setNumberFormat('d mmm yyyy');
  sh.getRange('E2:E3000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(PRO_PLANS), true).build());
  sh.getRange('H2:H3000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PRO_STATUS, true).build());
  [140, 180, 200, 130, 90, 100, 130, 110, 190, 110, 150, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

const proKey_ = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function newProKey_() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I
  const used = pro_().getRange(2, 9, Math.max(1, pro_().getLastRow() - 1), 1).getValues().map((x) => proKey_(x[0]));
  for (;;) {
    let s = '';
    for (let i = 0; i < 12; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
    const key = 'NQP-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
    if (used.indexOf(proKey_(key)) < 0) return key;
  }
}

// From the tool: "I have paid"
function proRequest_(p) {
  const code = mpesaCode_(p.code), email = String(p.email || '').trim(), plan = PRO_PLANS[p.plan] ? p.plan : '';
  const business = clean_(p.business, 100);
  if (!/^[A-Z0-9]{8,12}$/.test(code) || !validEmail_(email) || !plan || !business) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('pro-count') || 0);
  if (count >= 20) return { ok: false, error: 'busy' };
  cache.put('pro-count', String(count + 1), 3600);
  const amount = Math.round(num_(p.amount));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = pro_(), rows = sh.getDataRange().getValues().slice(1);
    if (rows.some((x) => mpesaCode_(x[6]) === code)) return { ok: true };   // sent twice
    const renew = proKey_(p.renew);
    sh.appendRow([new Date(), business, email, clean_(p.phone, 30), plan, amount || '', code, 'To confirm',
      renew && rows.some((x) => proKey_(x[8]) === renew) ? String(p.renew).trim().toUpperCase() : '', '', '',
      [renew ? 'Renewal' : '', p.ref ? 'Told about it by: ' + clean_(p.ref, 80) : ''].filter(Boolean).join(' · ')]);
  } finally {
    lock.releaseLock();
  }
  const me = Session.getEffectiveUser().getEmail();
  if (me) MailApp.sendEmail({ to: me, name: 'Nexus CAD Studio website', subject: '💰 ' + proName_(plan) + ' to confirm: ' + plan + ' · ' + business + (amount ? ' · ' + kes_(amount) : ''),
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0e1a3a"><p><b>' + html_(business) + '</b> (' + html_(email) + ') says they paid ' + (amount ? '<b>' + kes_(amount) + '</b> ' : '') + 'for <b>' + proName_(plan) + (isExam_(plan) ? '' : ', ' + html_(plan)) + '</b>.</p>' +
      '<p style="font-size:18px">M-Pesa code: <b style="letter-spacing:1px">' + html_(code) + '</b></p>' +
      '<p>Check your M-Pesa messages for this code, then set its Status in the <b>Quote Pro</b> tab to <b>Confirmed</b>: their licence key and receipt are emailed for you.</p>' +
      (p.ref ? '<p style="border-left:4px solid #25d366;background:#effaf3;padding:10px 12px"><b>Referral:</b> they were told about Quote Pro by <b>' + html_(clean_(p.ref, 80)) + '</b>. To thank them with a free month, find their latest row in the Quote Pro tab and add 31 days to its Expires date.</p>' : '') +
      '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Open your sheet</a></p></div>' });
  return { ok: true };
}

// You changed a Status in the Quote Pro tab
function proChanged_(sh, row) {
  const r = sh.getRange(row, 1, 1, PROHEAD.length).getValues()[0];
  const status = String(r[7] || '').trim(), email = String(r[2] || '').trim(), business = String(r[1] || '').trim();
  const plan = PRO_PLANS[String(r[4]).trim()] ? String(r[4]).trim() : 'Monthly';
  if (status !== 'Confirmed' || (r[9] instanceof Date && String(r[8]).trim())) return;   // done before
  const rows = sh.getDataRange().getValues();
  let key = String(r[8] || '').trim().toUpperCase();
  if (!key) {   // the same buyer paying again keeps their key
    const prev = rows.filter((x, k) => k > 0 && k !== row - 1 && String(x[2]).trim().toLowerCase() === email.toLowerCase() && String(x[8]).trim() && String(x[7]).trim() === 'Confirmed' && isExam_(x[4]) === isExam_(plan));
    if (prev.length) key = String(prev[prev.length - 1][8]).trim().toUpperCase();
  }
  if (!key) key = newProKey_();
  const now = new Date();
  const until = proUntil_(key, row);
  const start = until && until > now ? until : now;
  const expires = r[9] instanceof Date ? r[9] : new Date(start.getTime() + PRO_PLANS[plan] * 864e5);
  sh.getRange(row, 9).setValue(key);
  sh.getRange(row, 10).setValue(expires);
  const tz = 'Africa/Nairobi', when = Utilities.formatDate(expires, tz, 'd MMMM yyyy');
  if (!validEmail_(email)) { sh.getRange(row, 12).setValue('⚠ No valid email: send the key ' + key + ' on WhatsApp'); return; }
  const exam = isExam_(plan), name = proName_(plan);
  const link = SITE_URL + (exam ? 'exams/' : 'quote/') + '?key=' + encodeURIComponent(key);
  const howTo = exam ?
    'The button turns on your exam pass: all full practice exams, practice by topic and answer reviews. On another phone or computer, open the exams page, choose <b>Enter key</b> and type the key above (up to ' + PRO_DEVICES + ' devices).' :
    'The button switches Pro on for you. The same key works on both tools: the <a href="' + SITE_URL + 'quote/">sheet-metal quote tool</a> and the <a href="' + SITE_URL + 'steel/">gate &amp; grill estimator</a>. On another phone or computer, open a tool, choose <b>Enter key</b> and type the key above (up to ' + PRO_DEVICES + ' devices).';
  MailApp.sendEmail({ to: email, name: SENDER, subject: 'Your ' + name + ' key' + (until ? ' (renewed)' : ''),
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · ' + name.toUpperCase() + '</p>' +
      '<p>Hello ' + html_(business) + ',</p><p>Thank you! Your payment is confirmed and your ' + name + ' is ' + (until ? 'renewed' : 'ready') + '. It is valid until <b>' + when + '</b>.</p>' +
      '<p style="font-size:20px;background:#fbf6ec;border-left:4px solid #ffb627;padding:12px 14px;letter-spacing:2px"><b>' + html_(key) + '</b></p>' +
      '<p><a href="' + link + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">' + (exam ? 'Start practising' : 'Open Quote Pro') + '</a></p>' +
      '<p style="font-size:13px;color:#555">' + howTo + '</p>' +
      '<p style="font-size:13px;color:#555">Questions? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Nexus CAD Studio</span></p></div>',
    body: 'Your ' + name + ' key: ' + key + ' (valid until ' + when + '). Open it here: ' + link });
  // A receipt, so the money shows in your monthly report
  const amount = num_(r[5]);
  if (amount > 0) {
    const inv = invoices_();
    inv.appendRow(['', 'Receipt', new Date(), '', business, email, (exam ? 'SolidWorks exam practice pass' : 'Quote Pro licence, ' + plan.toLowerCase()) + ' (until ' + when + ') - ' + amount, amount, amount, payNote_(String(r[6] || '')) + '. Licence key ' + key, 'Draft', '', 'Created from the Quote Pro tab', 'Off', '', 'None']);
    try { sendInvoice_(inv, inv.getLastRow()); } catch (err) { console.error('pro receipt: ' + err); }
  }
  sh.getRange(row, 12).setValue([String(r[11] || ''), 'Key emailed ' + Utilities.formatDate(now, tz, 'd MMM yyyy')].filter(Boolean).join(' · '));
}

// Latest expiry of a key (other than one row), or null
function proUntil_(key, skipRow) {
  const k = proKey_(key);
  let best = null;
  pro_().getDataRange().getValues().forEach((x, i) => {
    if (i === 0 || i === skipRow - 1 || proKey_(x[8]) !== k || String(x[7]).trim() !== 'Confirmed' || !(x[9] instanceof Date)) return;
    if (!best || x[9] > best) best = x[9];
  });
  return best;
}

// From the tool: is this key valid? Also counts the devices it is used on.
function proCheck_(q) {
  const k = proKey_(q.key);
  if (k.length !== 15) return { ok: false, error: 'unknown' };
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('pro-check') || 0);
  if (count >= 300) return { ok: false, error: 'busy' };
  cache.put('pro-check', String(count + 1), 3600);
  const rows = pro_().getDataRange().getValues().slice(1).filter((x) => proKey_(x[8]) === k);
  if (!rows.length) return { ok: false, error: 'unknown' };
  if (rows.some((x) => String(x[7]).trim() === 'Cancelled')) return { ok: false, error: 'cancelled' };
  const until = proUntil_(k, -1);
  if (!until) return { ok: false, error: 'unknown' };
  const last = rows[rows.length - 1];
  if (until < new Date()) return { ok: false, error: 'expired', expires: ymd_(until), business: String(last[1] || '') };
  const device = String(q.device || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
  if (device) {
    const props = PropertiesService.getScriptProperties(), name = 'pro-dev-' + k;
    let list = [];
    try { list = JSON.parse(props.getProperty(name) || '[]'); } catch (err) { list = []; }
    if (list.indexOf(device) < 0) {
      if (list.length >= PRO_DEVICES) return { ok: false, error: 'devices', max: PRO_DEVICES };
      list.push(device);
      props.setProperty(name, JSON.stringify(list));
    }
  }
  return { ok: true, business: String(last[1] || ''), expires: ymd_(until), plan: String(last[4] || '') };
}

// Daily: a friendly reminder five days before a key runs out
function proReminderJob() {
  const sh = pro_(), rows = sh.getDataRange().getValues(), now = new Date();
  const seen = {};
  for (let i = rows.length - 1; i > 0; i--) {
    const x = rows[i], k = proKey_(x[8]);
    if (!k || seen[k] || String(x[7]).trim() !== 'Confirmed' || !(x[9] instanceof Date)) continue;
    seen[k] = true;
    const until = proUntil_(k, -1);
    if (!until || until.getTime() !== x[9].getTime() || String(x[10]).trim()) continue;
    const days = (until - now) / 864e5;
    if (days > 5 || days < 0) continue;
    const email = String(x[2] || '').trim();
    if (!validEmail_(email)) continue;
    const key = String(x[8]).trim(), when = Utilities.formatDate(until, 'Africa/Nairobi', 'd MMMM yyyy');
    const exam = isExam_(x[4]), name = proName_(x[4]);
    MailApp.sendEmail({ to: email, name: SENDER, subject: 'Your ' + name + ' ends on ' + when,
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a"><p>Hello ' + html_(String(x[1] || '')) + ',</p>' +
        (exam ? '<p>Your SolidWorks exam pass <b>' + html_(key) + '</b> ends on <b>' + when + '</b>. Still preparing? Renew it on the exams page: choose <b>Renew</b>, pay by M-Pesa and send the code. Your key stays the same and the new time is added to the end. Good luck with the exam!</p>' :
          '<p>Your Quote Pro licence <b>' + html_(key) + '</b> ends on <b>' + when + '</b>. To keep your logo, unlimited PDF quotes and saved quotes, renew it in the quote tool: choose <b>Renew</b>, pay by M-Pesa and send the code. Your key stays the same and the new time is added to the end.</p>') +
        '<p><a href="' + SITE_URL + (exam ? 'exams/' : 'quote/') + '?renew=1" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Renew ' + name + '</a></p>' +
        '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Nexus CAD Studio</span></p></div>' });
    sh.getRange(i + 1, 11).setValue('Sent ' + Utilities.formatDate(now, 'Africa/Nairobi', 'd MMM yyyy'));
  }
}

/* ---------- M-Pesa prompt (STK Push): clients pay without typing a code ----------
   The website sends a Lipa na M-Pesa prompt to the client's phone. They enter their PIN and
   Safaricom tells this script the result. A Quote Pro / exam pass is then confirmed and the
   key emailed (and shown on screen); a deposit or project payment is confirmed and the receipt
   emailed. All automatically. Every prompt is logged in the "M-Pesa prompts" tab.

   SET-UP (once, after Safaricom gives you the keys):
   1. Apps Script editor → Project Settings (gear icon) → Script properties → Add:
        MPESA_ENV              sandbox   (or production when you go live)
        MPESA_CONSUMER_KEY     from your app on developer.safaricom.co.ke
        MPESA_CONSUMER_SECRET  from the same app
        MPESA_PASSKEY          the Lipa na M-Pesa Online passkey Safaricom emails you
        MPESA_TYPE             till      (or paybill)
        MPESA_SHORTCODE        till: your store / head-office number;  paybill: the paybill number
        MPESA_TILL             8438334   (till only: the number clients pay to)
      Sandbox test values: MPESA_TYPE paybill, MPESA_SHORTCODE 174379, the sandbox passkey from the portal.
   2. Menu Website → "Test the M-Pesa connection".
   3. Deploy → Manage deployments → edit → New version → Deploy.
   4. In js/config.js set  payments.stkPush: true  so the website shows "Pay with M-Pesa".
   Optional: MPESA_CALLBACK_URL if Safaricom should call a different address than this web app. */
const MPESA = 'M-Pesa prompts';
const MPHEAD = ['Sent', 'For', 'Reference / plan', 'Name', 'Email', 'Phone', 'Amount (KES)', 'Status', 'M-Pesa receipt', 'Result', 'Request ID (automatic)', 'Token (automatic)', 'Details (automatic)'];
// Prices charged by the M-Pesa prompt. Keep these the same as quotePro / exams in js/config.js.
const PRO_PRICE = { Monthly: 500, Yearly: 4500, Exams: 500 };
const MP_RESULT = {
  0: 'Paid', 1: 'Not enough money in the M-Pesa account', 1001: 'Another M-Pesa payment is in progress on this phone. Wait a moment and try again.',
  1019: 'The prompt expired. Please try again.', 1025: 'M-Pesa could not send the prompt. Please try again.', 1032: 'You cancelled the payment on your phone',
  1037: 'Your phone could not be reached (off or no network). Please try again.', 2001: 'Wrong M-Pesa PIN entered', 9999: 'M-Pesa could not send the prompt. Please try again.'
};

function mpesaTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(MPESA);
  if (sh) return sh;
  sh = ss.insertSheet(MPESA);
  sh.appendRow(MPHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, MPHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('A2:A5000').setNumberFormat('d mmm yyyy, HH:mm');
  [140, 80, 120, 160, 180, 120, 90, 100, 120, 260, 200, 60, 200].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

function mpesaCfg_() {
  const p = PropertiesService.getScriptProperties();
  const get = (k) => String(p.getProperty(k) || '').trim();
  const c = { env: get('MPESA_ENV') === 'production' ? 'production' : 'sandbox', key: get('MPESA_CONSUMER_KEY'), secret: get('MPESA_CONSUMER_SECRET'),
    passkey: get('MPESA_PASSKEY'), type: get('MPESA_TYPE') === 'paybill' ? 'paybill' : 'till', shortcode: get('MPESA_SHORTCODE'), till: get('MPESA_TILL') };
  if (!c.key || !c.secret || !c.passkey || !c.shortcode || (c.type === 'till' && !c.till)) return null;
  c.host = c.env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  return c;
}

// 0712 345 678 / +254712345678 / 712345678 -> 254712345678 (Safaricom numbers start 2547 or 2541)
function mpesaPhone_(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(d)) return d;
  if (/^0[17]\d{8}$/.test(d)) return '254' + d.slice(1);
  if (/^[17]\d{8}$/.test(d)) return '254' + d;
  return '';
}

function mpesaToken_(c) {
  const cache = CacheService.getScriptCache(), ck = 'mp-token-' + c.env + '-' + c.key.slice(0, 8);
  const hit = cache.get(ck);
  if (hit) return hit;
  const res = UrlFetchApp.fetch(c.host + '/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(c.key + ':' + c.secret) }, muteHttpExceptions: true });
  let body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (err) { body = {}; }
  if (!body.access_token) throw new Error('Safaricom rejected the consumer key / secret (' + (body.errorMessage || 'HTTP ' + res.getResponseCode()) + ')');
  cache.put(ck, body.access_token, 3000);   // tokens last an hour
  return body.access_token;
}

function mpesaCall_(c, path, payload) {
  const res = UrlFetchApp.fetch(c.host + path, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload),
    headers: { Authorization: 'Bearer ' + mpesaToken_(c) }, muteHttpExceptions: true });
  let body = {};
  try { body = JSON.parse(res.getContentText() || '{}'); } catch (err) { body = {}; }
  return { code: res.getResponseCode(), body };
}

function mpesaAuth_(c) {
  const ts = Utilities.formatDate(new Date(), 'Africa/Nairobi', 'yyyyMMddHHmmss');
  return { BusinessShortCode: c.shortcode, Password: Utilities.base64Encode(c.shortcode + c.passkey + ts), Timestamp: ts };
}

function mpesaSecret_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('MPESA_CALLBACK_SECRET');
  if (!s) { s = Utilities.getUuid().replace(/-/g, ''); p.setProperty('MPESA_CALLBACK_SECRET', s); }
  return s;
}
function mpesaCallbackUrl_() {
  const custom = PropertiesService.getScriptProperties().getProperty('MPESA_CALLBACK_URL');
  return (custom || ScriptApp.getService().getUrl()) + '?cb=' + mpesaSecret_();
}

// From the website: send the prompt. The amount is worked out here, never trusted from the page.
function mpesaPay_(q) {
  const c = mpesaCfg_();
  if (!c) return { ok: false, error: 'not-set-up' };
  const phone = mpesaPhone_(q.phone);
  if (!phone) return { ok: false, error: 'phone' };
  const cache = CacheService.getScriptCache();
  const all = Number(cache.get('mp-count') || 0), mine = Number(cache.get('mp-' + phone) || 0);
  if (all >= 120 || mine >= 5) return { ok: false, error: 'busy' };
  cache.put('mp-count', String(all + 1), 3600);
  cache.put('mp-' + phone, String(mine + 1), 900);

  let what, ref, name, email, amount, accountRef, details;
  if (q.for === 'pro') {
    const plan = PRO_PRICE[q.plan] ? q.plan : '';
    name = clean_(q.business, 100); email = String(q.email || '').trim();
    if (!plan || !name || !validEmail_(email)) return { ok: false, error: 'invalid' };
    const renew = proKey_(q.renew);
    what = 'pro'; ref = plan; amount = PRO_PRICE[plan]; accountRef = isExam_(plan) ? 'ExamPass' : 'QuotePro';
    details = { renew: renew.length === 15 ? String(q.renew).trim().toUpperCase() : '', from: clean_(q.ref, 80) };
  } else if (q.for === 'payment') {
    const who = clientOf_(q.ref);
    amount = Math.round(num_(q.amount));
    if (!who || !(amount >= 1 && amount <= 1000000)) return { ok: false, error: who ? 'invalid' : 'ref' };
    what = 'payment'; ref = String(q.ref).trim().toUpperCase(); name = who.name; email = who.email; accountRef = normRef_(ref).slice(0, 12);
    details = { payer: clean_(q.payer, 80) };
  } else return { ok: false, error: 'invalid' };

  let r;
  try {
    r = mpesaCall_(c, '/mpesa/stkpush/v1/processrequest', Object.assign(mpesaAuth_(c), {
      TransactionType: c.type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
      Amount: amount, PartyA: phone, PartyB: c.type === 'till' ? c.till : c.shortcode, PhoneNumber: phone,
      CallBackURL: mpesaCallbackUrl_(), AccountReference: accountRef || 'Payment', TransactionDesc: 'Payment' }));
  } catch (err) {
    console.error('M-Pesa push: ' + err);
    return { ok: false, error: 'mpesa', message: 'M-Pesa is not reachable right now. Please try again, or pay the till directly.' };
  }
  if (String(r.body.ResponseCode) !== '0' || !r.body.CheckoutRequestID) {
    console.error('M-Pesa push refused: ' + JSON.stringify(r.body));
    return { ok: false, error: 'mpesa', message: r.body.errorMessage || r.body.CustomerMessage || 'M-Pesa could not send the prompt. Please try again.' };
  }
  const token = Utilities.getUuid().replace(/-/g, '');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    mpesaTab_().appendRow([new Date(), what, ref, name, email, "'" + phone, amount, 'Waiting', '', '', r.body.CheckoutRequestID, token, JSON.stringify(details)]);
  } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
  return { ok: true, id: r.body.CheckoutRequestID, token, amount, phone: phone.slice(0, 6) + '***' + phone.slice(-3) };
}

function mpesaRow_(id) {
  const sh = mpesaTab_(), rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i > 0; i--) if (String(rows[i][10]) === String(id)) return { sh, row: i + 1, r: rows[i] };
  return null;
}

// A result from Safaricom (callback or status check). Safe to call more than once.
function mpesaApply_(id, resultCode, resultDesc, receipt, paid) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const f = mpesaRow_(id);
    if (!f) return false;
    const { sh, row, r } = f;
    const status = String(r[7]), now = new Date();
    let details = {};
    try { details = JSON.parse(r[12] || '{}'); } catch (err) { details = {}; }
    if (status === 'Paid') {
      // The status check got there first; the callback brings the M-Pesa receipt number later
      if (receipt && !String(r[8])) {
        sh.getRange(row, 9).setValue(receipt);
        sh.getRange(row, 13).setValue(JSON.stringify(Object.assign(details, { receipt })));
        if (details.sheet && details.row) SpreadsheetApp.getActiveSpreadsheet().getSheetByName(details.sheet).getRange(details.row, details.col).setValue(receipt);
      }
      return true;
    }
    if (resultCode !== 0) {
      if (status === 'Waiting') { sh.getRange(row, 8).setValue('Failed'); sh.getRange(row, 10).setValue(MP_RESULT[resultCode] || resultDesc || 'Not paid'); }
      return true;
    }
    if (paid != null && Number(paid) < Number(r[6])) {
      sh.getRange(row, 8).setValue('Check');
      if (receipt) sh.getRange(row, 9).setValue(receipt);
      sh.getRange(row, 10).setValue('Paid ' + paid + ', expected ' + r[6] + '. Check and confirm by hand.');
      return true;
    }
    // Second guard against doing a payment twice: the script cache is shared by all runs instantly.
    const cache = CacheService.getScriptCache(), doneKey = 'mp-done-' + id;
    if (cache.get(doneKey)) {
      if (receipt && !String(r[8])) sh.getRange(row, 9).setValue(receipt);
      return true;
    }
    cache.put(doneKey, '1', 21600);
    receipt = receipt || String(r[8] || '');   // keep a receipt that is already there
    const code = receipt || String(id);
    sh.getRange(row, 8).setValue('Paid');
    if (receipt) sh.getRange(row, 9).setValue(receipt);
    sh.getRange(row, 10).setValue(resultDesc || 'Paid');
    if (r[1] === 'test') return true;
    const tz = 'Africa/Nairobi', amount = Number(r[6]);
    if (r[1] === 'pro') {
      const pr = pro_();
      pr.appendRow([now, r[3], r[4], String(r[5]), r[2], amount, code, 'Confirmed', details.renew || '', '', '',
        ['Paid by M-Pesa prompt', details.renew ? 'Renewal' : '', details.from ? 'Told about it by: ' + details.from : ''].filter(Boolean).join(' · ')]);
      const pRow = pr.getLastRow();
      proChanged_(pr, pRow);   // makes the key, emails it and the receipt
      const done = pr.getRange(pRow, 1, 1, PROHEAD.length).getValues()[0];
      Object.assign(details, { sheet: PRO, row: pRow, col: 7, key: String(done[8] || ''), expires: ymd_(done[9]) });
    } else {
      const py = payments_();
      py.appendRow([now, r[2], r[3], code, amount, details.payer || String(r[5]), 'Confirmed', '', 'Paid by M-Pesa prompt']);
      const pRow = py.getLastRow();
      paymentChanged_(py, pRow);   // receipt emailed; a training seat is confirmed
      Object.assign(details, { sheet: PAYMENTS, row: pRow, col: 4 });
    }
    if (receipt) details.receipt = receipt;
    sh.getRange(row, 13).setValue(JSON.stringify(details));
    const me = Session.getEffectiveUser().getEmail();
    if (me) MailApp.sendEmail({ to: me, name: 'Nexus CAD Studio website', subject: '✅ Paid by M-Pesa: ' + kes_(amount) + ' · ' + (r[3] || r[2]),
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;color:#0e1a3a"><p><b>' + html_(String(r[3] || '')) + '</b> paid <b>' + kes_(amount) + '</b> by M-Pesa prompt for <b>' +
        html_(r[1] === 'pro' ? proName_(r[2]) : String(r[2])) + '</b>. Receipt: <b>' + html_(receipt || '(coming)') + '</b>.</p>' +
        '<p>Nothing to do: it is confirmed and the ' + (r[1] === 'pro' ? 'key and receipt were' : 'receipt was') + ' emailed automatically (' + Utilities.formatDate(now, tz, 'd MMM, HH:mm') + ').</p></div>' });
    return true;
  } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

// Safaricom calls this (the web app URL + ?cb=secret) when the client finishes the prompt
function mpesaCallback_(e) {
  const want = mpesaSecret_(), got = String((e.parameter || {}).cb || (e.parameter || {}).mpesa || '');
  if (got !== want) return { ResultCode: 1, ResultDesc: 'Rejected' };
  let body = {};
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { body = {}; }
  const cb = body.Body && body.Body.stkCallback;
  if (!cb || !cb.CheckoutRequestID) return { ResultCode: 0, ResultDesc: 'Accepted' };
  const items = {};
  ((cb.CallbackMetadata && cb.CallbackMetadata.Item) || []).forEach((x) => { items[x.Name] = x.Value; });
  mpesaApply_(String(cb.CheckoutRequestID), Number(cb.ResultCode), String(cb.ResultDesc || ''),
    items.MpesaReceiptNumber ? String(items.MpesaReceiptNumber) : '', items.Amount != null ? Number(items.Amount) : null);
  return { ResultCode: 0, ResultDesc: 'Accepted' };
}

// From the website, every few seconds while the client enters their PIN
function mpesaStatus_(q) {
  let f = mpesaRow_(q.id);
  if (!f || !q.token || String(f.r[11]) !== String(q.token)) return { ok: false, error: 'unknown' };
  const age = Date.now() - new Date(f.r[0]).getTime();
  if (String(f.r[7]) === 'Waiting' && age > 15000) {
    // No callback yet: ask Safaricom directly (at most every 8 seconds per prompt)
    const cache = CacheService.getScriptCache(), ck = 'mp-q-' + q.id;
    if (!cache.get(ck)) {
      cache.put(ck, '1', 8);
      const c = mpesaCfg_();
      try {
        const r = c && mpesaCall_(c, '/mpesa/stkpushquery/v1/query', Object.assign(mpesaAuth_(c), { CheckoutRequestID: String(q.id) }));
        if (r && r.body.ResultCode !== undefined) mpesaApply_(String(q.id), Number(r.body.ResultCode), String(r.body.ResultDesc || ''), '', null);
      } catch (err) { /* try again on the next check */ }
      f = mpesaRow_(q.id);
    }
    if (String(f.r[7]) === 'Waiting' && age > 180000) {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        f = mpesaRow_(q.id);
        if (String(f.r[7]) === 'Waiting') { f.sh.getRange(f.row, 8).setValue('Failed'); f.sh.getRange(f.row, 10).setValue('No answer from M-Pesa'); }
      } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
      f = mpesaRow_(q.id);
    }
  }
  const status = String(f.r[7]);
  let d = {};
  try { d = JSON.parse(f.r[12] || '{}'); } catch (err) { d = {}; }
  if (status === 'Paid') return { ok: true, status: 'paid', receipt: String(f.r[8] || ''), key: d.key || '', expires: d.expires || '' };
  if (status === 'Failed') return { ok: true, status: 'failed', message: String(f.r[9] || 'Not paid') };
  if (status === 'Check') return { ok: true, status: 'check', message: 'Payment received but the amount differs. Edison will confirm it by hand.' };
  return { ok: true, status: 'waiting' };
}

// Menu: send a KES 1 prompt to your own phone and wait for the answer (nothing is sold or recorded as income)
function mpesaTestPrompt() {
  const ui = SpreadsheetApp.getUi(), c = mpesaCfg_();
  if (!c) { ui.alert('M-Pesa is not set up yet', 'Add the MPESA_ Script properties first, then run "Test the M-Pesa connection".', ui.ButtonSet.OK); return; }
  const ans = ui.prompt('Send a test M-Pesa prompt', 'Your Safaricom number (e.g. 0712 345 678). A prompt for KES 1 is sent to it (' + c.env + ').', ui.ButtonSet.OK_CANCEL);
  if (ans.getSelectedButton() !== ui.Button.OK) return;
  const phone = mpesaPhone_(ans.getResponseText());
  if (!phone) { ui.alert('That is not a Safaricom number. Try again, e.g. 0712 345 678.'); return; }
  let r;
  try {
    r = mpesaCall_(c, '/mpesa/stkpush/v1/processrequest', Object.assign(mpesaAuth_(c), {
      TransactionType: c.type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline', Amount: 1, PartyA: phone,
      PartyB: c.type === 'till' ? c.till : c.shortcode, PhoneNumber: phone, CallBackURL: mpesaCallbackUrl_(), AccountReference: 'Test', TransactionDesc: 'Test' }));
  } catch (err) { ui.alert('M-Pesa problem', String(err.message || err), ui.ButtonSet.OK); return; }
  if (String(r.body.ResponseCode) !== '0') { ui.alert('Safaricom did not send the prompt', JSON.stringify(r.body), ui.ButtonSet.OK); return; }
  const id = r.body.CheckoutRequestID;
  mpesaTab_().appendRow([new Date(), 'test', 'Test prompt', 'You', '', "'" + phone, 1, 'Waiting', '', '', id, '', '{}']);
  SpreadsheetApp.flush();
  // Wait up to ~2 minutes: first for Safaricom's callback, then by asking Safaricom directly.
  let how = '';
  for (let i = 0; i < 24; i++) {
    Utilities.sleep(5000);
    let f = mpesaRow_(id);
    if (String(f.r[7]) !== 'Waiting') { how = 'callback'; break; }
    if (i >= 4) {
      const q = mpesaCall_(c, '/mpesa/stkpushquery/v1/query', Object.assign(mpesaAuth_(c), { CheckoutRequestID: id }));
      if (q.body.ResultCode !== undefined) { mpesaApply_(id, Number(q.body.ResultCode), String(q.body.ResultDesc || ''), '', null); how = 'query'; break; }
    }
  }
  const f = mpesaRow_(id), status = String(f.r[7]);
  const cbNote = how === 'callback' ? 'Safaricom sent the result to this script by itself. Everything works.' :
    how === 'query' ? 'The result was found by asking Safaricom. Its automatic message did not arrive (check MPESA_CALLBACK_URL); the website still works because it asks Safaricom too.' : '';
  if (status === 'Paid') ui.alert('Test prompt: paid ✅', 'Receipt: ' + (f.r[8] || '(arrives with the callback)') + '\n\n' + cbNote, ui.ButtonSet.OK);
  else if (status === 'Failed') ui.alert('Test prompt: not paid', String(f.r[9] || '') + '\n\nThat is fine for a test (e.g. you cancelled). ' + cbNote, ui.ButtonSet.OK);
  else ui.alert('No answer yet', 'Did the prompt appear on your phone? See the "M-Pesa prompts" tab in a minute.', ui.ButtonSet.OK);
}

// Menu: check the Script properties work
function mpesaTest() {
  const ui = SpreadsheetApp.getUi(), c = mpesaCfg_();
  if (!c) { ui.alert('M-Pesa is not set up', 'Add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE (and MPESA_TILL for a till) in Project Settings → Script properties. Instructions are at the top of the M-Pesa section of the script.', ui.ButtonSet.OK); return; }
  try {
    mpesaToken_(c);
    mpesaTab_();
    ui.alert('M-Pesa works ✅', 'Safaricom accepted your keys (' + c.env + ', ' + c.type + ' ' + (c.type === 'till' ? c.till : c.shortcode) + ').\n\nPayment results will be sent to:\n' + mpesaCallbackUrl_().replace(/cb=.*/, 'cb=…') +
      '\n\nNext: Deploy → Manage deployments → New version, then set payments.stkPush: true in js/config.js.', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('M-Pesa problem', String(err.message || err), ui.ButtonSet.OK);
  }
}

/* ---------- Money per project reference: quoted total, paid, balance (pay page and accounts) ----------
   Total: the latest sent quote, else the latest sent invoice, else balance + paid.
   Paid: the receipts sent for that reference (each confirmed payment makes one).
   Balance: the project's "Balance due" column (kept up to date when receipts are sent), else total - paid.
   Pending: payments the client reported that you haven't confirmed yet. */
function moneyTabs_() {
  return { inv: invoices_().getDataRange().getValues().slice(1), pay: payments_().getDataRange().getValues().slice(1), proj: projects_().getDataRange().getValues().slice(1) };
}
function money_(ref, t) {
  t = t || moneyTabs_();
  const n = normRef_(ref);
  const sent = (type) => t.inv.filter((x) => normRef_(x[3]) === n && String(x[1]).trim() === type && String(x[10]).trim() === 'Sent');
  const docTotal = (x) => num_(x[7]) || invoiceItems_(x[6]).reduce((a, it) => a + (it.amount || 0), 0);
  const quotes = sent('Quote'), invoices = sent('Invoice'), receipts = sent('Receipt');
  const paid = receipts.reduce((a, x) => a + num_(x[8]), 0);
  const pending = t.pay.filter((x) => normRef_(x[1]) === n && /^to confirm$/i.test(String(x[6]).trim())).reduce((a, x) => a + num_(x[4]), 0);
  const p = t.proj.find((x) => normRef_(x[0]) === n);
  const colBalance = p && String(p[8]).trim() !== '' && !isNaN(num_(p[8])) ? num_(p[8]) : null;
  let total = quotes.length ? docTotal(quotes[quotes.length - 1]) : invoices.length ? docTotal(invoices[invoices.length - 1]) : 0;
  if (!total && colBalance !== null) total = colBalance + paid;
  const balance = colBalance !== null ? colBalance : total ? Math.max(0, total - paid) : null;
  return { total: total, paid: paid, balance: balance, pending: pending };
}
// The pay page: what a reference owes, with suggested amounts (anyone who knows the reference, like /track/)
function payInfo_(ref) {
  const want = normRef_(ref);
  if (want.length < 6) return { found: false };
  const cache = CacheService.getScriptCache(), misses = Number(cache.get('track-miss') || 0);
  if (misses >= 40) return { error: 'busy' };
  const who = clientOf_(want);
  if (!who) { cache.put('track-miss', String(misses + 1), 600); return { found: false }; }
  const m = money_(want);
  const out = { found: true, ref: String(ref).trim().toUpperCase(), title: who.title || '', name: String(who.name || '').split(/\s+/)[0] || '',
    total: m.total, paid: m.paid, balance: m.balance, pending: m.pending, options: [] };
  if (m.total && !m.paid) out.options.push({ kind: 'deposit', amount: Math.round(m.total / 2) });
  if (m.balance > 0) out.options.push({ kind: 'balance', amount: Math.round(m.balance) });
  return out;
}
// Final files: shown at 100% (or "Delivered") when a link is in the Projects tab; optionally only once fully paid
function finalFiles_(r, m) {
  const link = String(r[15] || '').trim();
  if (!/^https?:\/\//i.test(link)) return '';
  const done = /^delivered$/i.test(String(r[3]).trim()) || num_(r[4]) >= 100;
  if (!done) return '';
  if (/^yes$/i.test(setting_('Deliver files only when fully paid')) && m && m.balance > 0) return 'unpaid';
  return link;
}
// Projects tab edit: progress, stage or the final files link → email the client once when their files unlock
function filesReady_(sh, row) {
  const r = sh.getRange(row, 1, 1, PHEAD.length).getValues()[0];
  const ref = String(r[0] || '').trim(), to = String(r[11] || '').trim();
  if (!ref || !validEmail_(to)) return;
  const link = finalFiles_(r, money_(ref));
  if (!link || link === 'unpaid') return;
  const props = PropertiesService.getScriptProperties(), key = 'files-sent-' + normRef_(ref);
  if (props.getProperty(key) === link) return;
  props.setProperty(key, link);
  const title = String(r[1] || 'your project');
  MailApp.sendEmail({ to: to, name: SENDER, subject: 'Your files are ready: ' + title,
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · ' + html_(ref) + '</p>' +
      '<p>Hello' + (r[2] ? ' ' + html_(String(r[2])) : '') + ',</p><p>Good news: the final files for <b>' + html_(title) + '</b> are ready.</p>' +
      '<p><a href="' + html_(link) + '" style="background:#ffb627;color:#0e1a3a;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Download your project files</a></p>' +
      '<p>They are also in <a href="' + SITE_URL + 'account/">your account</a> (log in with this email), with your receipts and project history.</p>' +
      '<p style="font-size:13px;color:#555">Questions or changes? Reply to this email or <a href="https://wa.me/' + WHATSAPP + '">message me on WhatsApp</a>.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Mechanical Design Engineer · Nexus CAD Studio</span></p></div>',
    body: 'The final files for ' + title + ' are ready: ' + link + '\n\nThey are also in your account: ' + SITE_URL + 'account/' });
  sh.getRange(row, 11).setValue(new Date());
}

/* ---------- Accounts: log in with a code sent by email (no passwords) ----------
   ACCOUNTS tab: one row per person. "Blocked" in Status switches an account off at once.
   EXAM RESULTS tab: the practice exams each account has finished.
   A login is a signed token kept in the browser for 30 days. The account page shows the
   person's own rows from your other tabs, matched by their email: exam pass and Quote Pro
   keys (Quote Pro tab), training (Trainees), projects (Projects) and invoices (Invoices). */
const ACCOUNTS = 'Accounts', EXRESULTS = 'Exam results';
const ACHEAD = ['Email', 'Name', 'Phone', 'Created', 'Last login', 'Status (Active / Blocked)', 'Notes'];
const XRHEAD = ['Date', 'Email', 'Test', 'Score %', 'Points', 'Minutes', 'By topic'];
const ACCT_DAYS = 30;
function accounts_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ACCOUNTS);
  if (sh) return sh;
  sh = ss.insertSheet(ACCOUNTS);
  sh.appendRow(ACHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, ACHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('D2:E3000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.getRange('F2:F3000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Active', 'Blocked'], true).build());
  [220, 160, 130, 140, 140, 130, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}
function examResults_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(EXRESULTS);
  if (sh) return sh;
  sh = ss.insertSheet(EXRESULTS);
  sh.appendRow(XRHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, XRHEAD.length).setFontWeight('bold');
  sh.getRange('A2:A5000').setNumberFormat('d mmm yyyy, HH:mm');
  [140, 220, 220, 80, 90, 80, 360].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}
function acctSecret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('ACCT_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('ACCT_SECRET', s); }
  return s;
}
const hex_ = (bytes) => bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
const acctSig_ = (text) => hex_(Utilities.computeHmacSha256Signature(text, acctSecret_())).slice(0, 40);
function acctToken_(email) {
  const payload = email + '|' + (Date.now() + ACCT_DAYS * 864e5);
  return Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8).replace(/=+$/, '') + '.' + acctSig_(payload);
}
// The account a token belongs to: { email, row (1-based), r } or null (bad, expired or blocked)
function acctFromToken_(t) {
  const parts = String(t || '').split('.');
  if (parts.length !== 2) return null;
  let payload = '';
  try { payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0] + '==='.slice((parts[0].length + 3) % 4))).getDataAsString(); } catch (err) { return null; }
  if (acctSig_(payload) !== parts[1]) return null;
  const m = /^(.+)\|(\d+)$/.exec(payload);
  if (!m || Number(m[2]) < Date.now()) return null;
  const email = m[1], rows = accounts_().getDataRange().getValues();
  const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
  if (i < 1 || /^blocked$/i.test(String(rows[i][5]).trim())) return null;
  return { email: email, row: i + 1, r: rows[i] };
}
// Step 1: email a 6-digit code (valid 10 minutes)
function loginStart_(q) {
  const email = clean_(q.email, 120).toLowerCase();
  if (!validEmail_(email)) return { ok: false, error: 'invalid' };
  const cache = CacheService.getScriptCache();
  const all = Number(cache.get('login-all') || 0), mine = Number(cache.get('login-n:' + email) || 0);
  if (all >= 120 || mine >= 5) return { ok: false, error: 'busy' };
  cache.put('login-all', String(all + 1), 3600);
  cache.put('login-n:' + email, String(mine + 1), 900);
  const blocked = accounts_().getDataRange().getValues().some((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email && /^blocked$/i.test(String(r[5]).trim()));
  if (blocked) return { ok: false, error: 'blocked' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('login:' + email, JSON.stringify({ h: acctSig_('code|' + email + '|' + code), tries: 0 }), 600);
  MailApp.sendEmail({ to: email, name: SENDER, subject: code + ' is your Nexus CAD Studio login code',
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0e1a3a">' +
      '<p style="font-size:13px;letter-spacing:.08em;color:#c4422a;font-weight:bold;margin:0 0 6px">NEXUS CAD STUDIO · MY ACCOUNT</p>' +
      '<p>Your login code is:</p><p style="font-size:30px;letter-spacing:8px;font-weight:bold;background:#fbf6ec;border-left:4px solid #ffb627;padding:12px 16px">' + code + '</p>' +
      '<p>Type it on the website within 10 minutes. If you didn\'t ask for it, ignore this email: nobody can log in without the code.</p>' +
      '<p>Edison Ochieng<br><span style="color:#555;font-size:13px">Nexus CAD Studio</span></p></div>',
    body: 'Your Nexus CAD Studio login code is ' + code + '. It works for 10 minutes. If you did not ask for it, ignore this email.' });
  return { ok: true };
}
// Step 2: check the code; makes the account the first time
function loginVerify_(q) {
  const email = clean_(q.email, 120).toLowerCase(), code = String(q.code || '').replace(/\D/g, '');
  const cache = CacheService.getScriptCache(), key = 'login:' + email;
  let c = null;
  try { c = JSON.parse(cache.get(key) || 'null'); } catch (err) { c = null; }
  if (!c) return { ok: false, error: 'expired' };
  if (c.h !== acctSig_('code|' + email + '|' + code)) {
    c.tries++;
    if (c.tries >= 5) { cache.remove(key); return { ok: false, error: 'expired' }; }
    cache.put(key, JSON.stringify(c), 600);
    return { ok: false, error: 'wrong', left: 5 - c.tries };
  }
  cache.remove(key);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let isNew = false;
  try {
    const sh = accounts_(), rows = sh.getDataRange().getValues();
    const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
    if (i > 0) sh.getRange(i + 1, 5).setValue(new Date());
    else { sh.appendRow([email, clean_(q.name, 80), '', new Date(), new Date(), 'Active', '']); isNew = true; }
  } finally {
    lock.releaseLock();
  }
  if (isNew) {
    try {
      newRequestAlert_({ setting: 'Email me new accounts', tab: ACCOUNTS, email: email, phone: '', name: clean_(q.name, 80),
        subject: '👤 New account: ' + email, kicker: 'New account on the website', title: email + ' created an account', waText: '',
        fields: [['Email', email], ['Accounts now', accounts_().getLastRow() - 1]] });
    } catch (err) { console.error('account alert: ' + err); }
  }
  return { ok: true, token: acctToken_(email), isNew: isNew, account: accountData_(email) };
}
const ymdOr_ = (v) => (v instanceof Date ? ymd_(v) : String(v || '').trim());
// Everything the account page shows, matched by email
function accountData_(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), tab = (n) => ss.getSheetByName(n);
  const same = (v) => String(v || '').trim().toLowerCase() === email;
  const rowsOf = (n) => (tab(n) ? tab(n).getDataRange().getValues().slice(1) : []);
  const acc = accounts_().getDataRange().getValues().find((r, k) => k > 0 && same(r[0])) || [];
  // Exam pass and Quote Pro keys
  const keys = {};
  rowsOf(PRO).forEach((x) => { const k = proKey_(x[8]); if (k && same(x[2]) && String(x[7]).trim() === 'Confirmed') keys[k] = x; });
  const passes = Object.keys(keys).map((k) => {
    const x = keys[k], until = proUntil_(k, -1), cancelled = rowsOf(PRO).some((y) => proKey_(y[8]) === k && String(y[7]).trim() === 'Cancelled');
    return { product: isExam_(x[4]) ? 'exams' : 'quote', plan: String(x[4] || ''), key: String(x[8]).trim().toUpperCase(), expires: until ? ymd_(until) : '',
      active: !cancelled && !!until && until >= new Date() };
  }).sort((a, b) => (b.expires > a.expires ? 1 : -1));
  const results = examResults_().getDataRange().getValues().slice(1).filter((x) => same(x[1])).slice(-60).reverse()
    .map((x) => ({ date: ymdOr_(x[0]), test: String(x[2] || ''), score: num_(x[3]), points: String(x[4] || ''), minutes: num_(x[5]) }));
  const training = rowsOf(TRAINEES).filter((x) => same(x[3])).map((x) => ({ id: String(x[0] || ''), course: String(x[5] || ''), cls: String(x[6] || ''),
    format: String(x[7] || ''), status: String(x[8] || ''), completed: ymdOr_(x[9]), certificate: String(x[10] || '') }));
  // Projects (and briefs not yet moved to Projects), each with its money and files
  const mt = moneyTabs_(), projRows = rowsOf(PROJECTS);
  const projects = projRows.filter((x) => same(x[11]) && String(x[0]).trim()).map((x) => {
    const ref = String(x[0]).trim(), m = money_(ref, mt), q = quoteFor_(ref);
    let stage = STAGES.findIndex((st) => st.toLowerCase() === String(x[3]).trim().toLowerCase());
    if (stage < 0) stage = Math.max(0, Math.min(5, parseInt(String(x[3]), 10) || 0));
    const delivered = stage === STAGES.length - 1, progress = x[4] !== '' && !isNaN(Number(x[4])) ? num_(x[4]) : Math.round(stage / (STAGES.length - 1) * 100);
    const files = finalFiles_(x, m);
    return { ref: ref, project: String(x[1] || ''), stage: STAGES[stage], progress: delivered ? Math.max(progress, 100) : progress, due: ymdOr_(x[5]),
      working: /^https?:\/\//i.test(String(x[9] || '')) ? String(x[9]).trim() : '', final: files === 'unpaid' ? '' : files, finalLocked: files === 'unpaid',
      quote: q ? { number: q.number, total: q.total, state: q.state } : null, money: m };
  });
  const moved = new Set(projRows.map((x) => normRef_(x[0])));
  rowsOf(SUBS).filter((x) => same(x[4]) && String(x[0]).trim() && !moved.has(normRef_(x[0])) && !/^declined$/i.test(String(x[2]).trim())).forEach((x) => {
    const ref = String(x[0]).trim(), q = quoteFor_(ref);
    projects.push({ ref: ref, project: String(x[7] || x[6] || ''), stage: /quote sent|accepted/i.test(String(x[2])) ? 'Quote sent' : 'Brief received',
      progress: /quote sent|accepted/i.test(String(x[2])) ? 20 : 5, due: ymdOr_(x[9]), working: '', final: '', finalLocked: false,
      quote: q ? { number: q.number, total: q.total, state: q.state } : null, money: money_(ref, mt), brief: true });
  });
  // Sent invoices and receipts, with what a printable copy needs (the PDFs themselves stay private in your Drive)
  const documents = rowsOf(INVOICES).filter((x) => same(x[5]) && String(x[10]).trim() === 'Sent' && /^(invoice|receipt)$/i.test(String(x[1]).trim())).map((x) => {
    const total = num_(x[7]) || invoiceItems_(x[6]).reduce((a, it) => a + (it.amount || 0), 0), paid = num_(x[8]);
    return { number: String(x[0] || ''), type: String(x[1] || '').trim(), date: ymdOr_(x[2]), ref: String(x[3] || ''), client: String(x[4] || ''),
      items: invoiceItems_(x[6]).slice(0, 20), total: total, paid: paid, balance: Math.max(0, total - paid), note: String(x[9] || '').slice(0, 200) };
  }).reverse();
  const pending = rowsOf(PAYMENTS).filter((x) => /^to confirm$/i.test(String(x[6]).trim()) && projects.some((p) => normRef_(p.ref) === normRef_(x[1])))
    .map((x) => ({ ref: String(x[1]), amount: num_(x[4]), date: ymdOr_(x[0]) }));
  return { email: email, name: String(acc[1] || ''), phone: String(acc[2] || ''), created: ymdOr_(acc[3]),
    passes: passes, results: results, training: training, projects: projects, documents: documents, pending: pending };
}
function accountGet_(q) {
  const a = acctFromToken_(q.t);
  if (!a) return { ok: false, error: 'login' };
  const cache = CacheService.getScriptCache(), n = Number(cache.get('acct-get:' + a.email) || 0);
  if (n >= 120) return { ok: false, error: 'busy' };
  cache.put('acct-get:' + a.email, String(n + 1), 3600);
  return { ok: true, account: accountData_(a.email) };
}
// From the website: a finished practice exam, or new profile details
function accountPost_(p) {
  const a = acctFromToken_(p.t);
  if (!a) return { ok: false, error: 'login' };
  const cache = CacheService.getScriptCache(), n = Number(cache.get('acct-post:' + a.email) || 0);
  if (n >= 60) return { ok: false, error: 'busy' };
  cache.put('acct-post:' + a.email, String(n + 1), 3600);
  if (p.action === 'account-result') {
    const score = Math.max(0, Math.min(100, Math.round(num_(p.score))));
    const d = p.date ? new Date(p.date) : null, when = d && !isNaN(d) && d <= new Date() && d > new Date(Date.now() - 400 * 864e5) ? d : new Date();   // results from before logging in keep their date
    examResults_().appendRow([when, a.email, clean_(p.test, 80), score, clean_(p.points, 20), Math.max(0, Math.round(num_(p.minutes))), clean_(p.topics, 900)]);
    return { ok: true };
  }
  if (p.action === 'account-update') {
    const sh = accounts_();
    if (p.name != null) sh.getRange(a.row, 2).setValue(clean_(p.name, 80));
    if (p.phone != null) sh.getRange(a.row, 3).setValue(clean_(p.phone, 30));
    return { ok: true };
  }
  return { ok: false };
}

/* ---------- CV tailor: each account's own CV (cv-tailor/ on the website) ----------
   CVS tab: one row per account that accepted the CV tailor terms or saved a CV.
   The CV is stored as text (JSON) over the "CV data" columns, because one cell holds
   at most 50,000 characters. Only the person logged in to that account can read,
   change or delete their row (with their login token); nobody can list CVs.
   If someone asks you to delete their data, delete their row here (and their
   row in Accounts). Weekly backups of the sheet keep a copy for up to 8 weeks. */
const CVS = 'CVs';
const CVHEAD = ['Email', 'Updated', 'Terms version accepted', 'Terms accepted on', 'Size (characters)', 'CV data 1', 'CV data 2', 'CV data 3', 'CV data 4', 'CV data 5'];
const CV_CHUNK = 45000, CV_PARTS = 5, CV_MAX = CV_CHUNK * CV_PARTS;
function cvs_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CVS);
  if (sh) return sh;
  sh = ss.insertSheet(CVS);
  sh.appendRow(CVHEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, CVHEAD.length).setFontWeight('bold').setWrap(true);
  sh.getRange('B2:B3000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.getRange('D2:D3000').setNumberFormat('d mmm yyyy, HH:mm');
  sh.getRange('F2:J3000').setNumberFormat('@');   // plain text: a piece starting with "=" must never become a formula
  [220, 140, 150, 140, 110, 260, 120, 120, 120, 120].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}
function cvRowOf_(sh, email) {
  const rows = sh.getDataRange().getValues();
  const i = rows.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === email);
  return i > 0 ? { row: i + 1, r: rows[i] } : null;
}
function cvBusy_(email, kind, max) {
  const cache = CacheService.getScriptCache(), key = 'cv-' + kind + ':' + email, n = Number(cache.get(key) || 0);
  if (n >= max) return true;
  cache.put(key, String(n + 1), 3600);
  return false;
}
const cvTerms_ = (v) => (/^[\w.-]{1,30}$/.test(String(v || '')) ? String(v) : '');
const iso_ = (d) => (d instanceof Date ? d.toISOString() : String(d || ''));
// Your CV, terms and when it was last saved
function cvGet_(q) {
  const a = acctFromToken_(q.t);
  if (!a) return { ok: false, error: 'login' };
  if (cvBusy_(a.email, 'get', 300)) return { ok: false, error: 'busy' };
  const f = cvRowOf_(cvs_(), a.email);
  if (!f) return { ok: true, cv: null, updated: '', terms: '', accepted: '' };
  const text = f.r.slice(5, 5 + CV_PARTS).map((x) => String(x == null ? '' : x)).join('');
  let cv = null;
  try { cv = text ? JSON.parse(text) : null; } catch (err) { cv = null; }
  return { ok: true, cv: cv, updated: iso_(f.r[1]), terms: String(f.r[2] || ''), accepted: iso_(f.r[3]) };
}
// From the website: save the CV, record that the terms were accepted, or delete everything
function cvPost_(p) {
  const a = acctFromToken_(p.t);
  if (!a) return { ok: false, error: 'login' };
  if (cvBusy_(a.email, 'post', 200)) return { ok: false, error: 'busy' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = cvs_(), found = cvRowOf_(sh, a.email), now = new Date();
    if (p.action === 'cv-delete') {
      if (found) sh.deleteRow(found.row);
      return { ok: true };
    }
    const terms = cvTerms_(p.terms);
    let row = found ? found.row : 0;
    if (!row) {
      if (!terms) return { ok: false, error: 'terms' };   // nothing is stored before the terms are accepted
      sh.appendRow([a.email, '', terms, now, 0]);
      row = sh.getLastRow();
    } else if (terms && String(found.r[2]) !== terms) {
      sh.getRange(row, 3, 1, 2).setValues([[terms, now]]);
    }
    if (p.action === 'cv-terms') return { ok: true, terms: terms || String(found && found.r[2] || '') };
    if (p.action !== 'cv-save') return { ok: false };
    const text = String(p.cv || '');
    if (text.length > CV_MAX) return { ok: false, error: 'too-big' };
    let cv;
    try { cv = JSON.parse(text); } catch (err) { return { ok: false, error: 'invalid' }; }
    if (!cv || typeof cv !== 'object' || Array.isArray(cv)) return { ok: false, error: 'invalid' };
    const json = JSON.stringify(cv), parts = [];
    for (let i = 0; i < CV_PARTS; i++) parts.push(json.slice(i * CV_CHUNK, (i + 1) * CV_CHUNK));
    sh.getRange(row, 6, 1, CV_PARTS).setNumberFormat('@').setValues([parts]);
    sh.getRange(row, 2).setValue(now);
    sh.getRange(row, 5).setValue(json.length);
    return { ok: true, updated: now.toISOString(), size: json.length };
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.action === 'track') return out_(track_(q.ref));
  if (q.action === 'site') return out_({ reviews: reviews_(), settings: readSettings_(), campaign: campaignSafe_() });   // homepage: one request
  if (q.action === 'settings') return out_(readSettings_());
  if (q.action === 'content') return out_(content_());          // used by the website's GitHub automation
  if (q.action === 'image') return out_(image_(q));
  if (q.action === 'unsubscribe') return unsubscribePage_(q);
  if (q.action === 'training') return out_(trainingInfo_());
  if (q.action === 'verify') return out_(verify_(q.code));
  if (q.action === 'code') return out_(codeCheck_(q));
  if (q.action === 'pro') return out_(proCheck_(q));
  if (q.action === 'mpesa-pay') return out_(mpesaPay_(q));
  if (q.action === 'mpesa-status') return out_(mpesaStatus_(q));
  if (q.action === 'login-start') return out_(loginStart_(q));
  if (q.action === 'login') return out_(loginVerify_(q));
  if (q.action === 'account') return out_(accountGet_(q));
  if (q.action === 'cv-get') return out_(cvGet_(q));
  if (q.action === 'pay-info') return out_(payInfo_(q.ref));
  return out_(reviews_());
}

function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
