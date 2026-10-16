/* =========================================================================
   Website "database" in your Google Drive (free): instant reviews and the
   client project tracker. One sheet, one script, one link.

   REVIEWS tab: visitors' reviews are saved here and appear on the website
   straight away. To remove one, type  hide  in its "Status" cell.

   PROJECTS tab: your client projects. Change a project's Stage, Progress
   or Note here and the client sees it at /track/ within a minute when they
   enter their reference. Only someone who types the exact reference can
   see a project; nobody can list them.

   FIRST-TIME SET-UP (about 5 minutes)
   1. Go to sheets.google.com and create a blank sheet named "Website reviews".
   2. Menu: Extensions → Apps Script. Delete what's there and paste this
      whole file. Click the save icon.
   3. Click Deploy → New deployment → gear icon → Web app.
        Execute as:  Me          Who has access:  Anyone
      Click Deploy, allow the permissions, and copy the "Web app URL".

   UPDATING THIS SCRIPT LATER (the link stays the same)
   1. Extensions → Apps Script, select everything, paste the new version, save.
   2. Choose  setup  in the function list at the top and click Run (this
      creates the Projects tab with its drop-down lists).
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
const PHEAD = ['Reference', 'Project', 'Client', 'Stage', 'Progress %', 'Due date', 'Note to client', 'Deposit', 'Balance due (KES)', 'Files link', 'Last updated'];

function projects_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PROJECTS);
  if (sh) return sh;
  sh = ss.insertSheet(PROJECTS);
  sh.appendRow(PHEAD);
  sh.appendRow(['DEMO-SHEET-01', 'Example: bracket drawings', 'Example client', 'Design in progress', 60, new Date(Date.now() + 14 * 864e5), 'This row is an example. Replace it with a real project.', 'Paid', 2500, '', new Date()]);
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

// Run once from the editor after pasting this script (creates both tabs)
function setup() {
  sheet_();
  projects_();
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

function doGet(e) {
  const q = (e && e.parameter) || {};
  if (q.action === 'track') return out_(track_(q.ref));
  const rows = sheet_().getDataRange().getValues().slice(1);
  const hidden = /^(hide|hidden|no|spam|delete)$/i;
  const list = rows
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
  return out_(list);
}

function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
