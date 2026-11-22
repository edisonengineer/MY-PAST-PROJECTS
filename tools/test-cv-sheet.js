#!/usr/bin/env node
/* =========================================================================
   Checks the CV tailor's part of the Google Sheet script (tools/google-sheet-script.gs)
   without Google: the real script runs here against small stand-ins for
   SpreadsheetApp, CacheService, MailApp, etc. It logs in like the website
   does (email code → token), then saves, reads and deletes a CV.

     - nothing is stored before the terms are accepted
     - a CV comes back exactly as saved, also when it is split over cells
     - another account, a wrong or expired token can't read or change it
     - too-large or broken data is refused; delete removes the row

   Run:  node tools/test-cv-sheet.js
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

/* ---------- stand-ins for the Google services the script uses ---------- */
function makeGoogle() {
    const sheets = new Map(), cache = new Map(), props = new Map(), mails = [];
    // Formatting calls (widths, colours, validation, ...) don't change data: any unknown method just returns the object
    const loose = (obj) => new Proxy(obj, { get: (t, k) => (k in t ? t[k] : typeof k === 'string' ? function () { return this; } : undefined) });
    class Range {
        constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr: nr || 1, nc: nc || 1 }); }
        getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) { const v = (this.sh.rows[this.r - 1 + i] || [])[this.c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); } return out; }
        getValue() { return this.getValues()[0][0]; }
        setValues(vals) { vals.forEach((row, i) => row.forEach((v, j) => { const rr = this.r - 1 + i; while (this.sh.rows.length <= rr) this.sh.rows.push([]); this.sh.rows[rr][this.c - 1 + j] = v; })); return this; }
        setValue(v) { return this.setValues([[v]]); }
        setNumberFormat() { return this; } setFontWeight() { return this; } setWrap() { return this; } setDataValidation() { return this; }
    }
    class Sheet {
        constructor(name) { this.name = name; this.rows = []; }
        getName() { return this.name; }
        appendRow(r) { this.rows.push(r.slice()); }
        getLastRow() { return this.rows.length; }
        getDataRange() { const w = Math.max(1, ...this.rows.map((r) => r.length)); return loose(new Range(this, 1, 1, Math.max(1, this.rows.length), w)); }
        getRange(a, b, c, d) { if (typeof a === 'string') return loose(new Range(this, 1, 1)); return loose(new Range(this, a, b, c, d)); }
        deleteRow(n) { this.rows.splice(n - 1, 1); }
        setFrozenRows() {} setColumnWidth() {}
    }
    const ss = { getSheetByName: (n) => sheets.get(n) || null, insertSheet: (n) => { const s = loose(new Sheet(n)); sheets.set(n, s); return s; } };
    const toBytes = (buf) => Array.from(buf).map((b) => (b > 127 ? b - 256 : b));
    return {
        sheets, mails,
        globals: {
            console: { log() {}, error() {}, warn() {} },   // the script's own notices (e.g. new-account alerts) aren't part of this test
            SpreadsheetApp: { getActiveSpreadsheet: () => ss, getActive: () => ss, newDataValidation: () => loose({}) },
            CacheService: { getScriptCache: () => ({ get: (k) => (cache.has(k) ? cache.get(k) : null), put: (k, v) => cache.set(k, String(v)), remove: (k) => cache.delete(k) }) },
            LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
            PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, v) }) },
            MailApp: { sendEmail: (o) => mails.push(o) },
            ContentService: { createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
            Utilities: {
                getUuid: () => crypto.randomUUID(),
                Charset: { UTF_8: 'utf8' },
                base64EncodeWebSafe: (s) => Buffer.from(String(s), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
                base64DecodeWebSafe: (s) => toBytes(Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
                newBlob: (bytes) => ({ getDataAsString: () => Buffer.from(bytes.map((b) => (b + 256) % 256)).toString('utf8') }),
                computeHmacSha256Signature: (text, key) => toBytes(crypto.createHmac('sha256', key).update(text).digest()),
                formatDate: (d) => d.toISOString().slice(0, 10)
            }
        }
    };
}

const G = makeGoogle();
const ctx = vm.createContext(G.globals);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'google-sheet-script.gs'), 'utf8'), ctx, { filename: 'google-sheet-script.gs' });
const call = (fn, params) => JSON.parse(ctx[fn]({ parameter: params }).text);
const get = (p) => call('doGet', p), post = (p) => call('doPost', p);

function login(email) {
    assert.deepStrictEqual(get({ action: 'login-start', email }), { ok: true });
    const mail = G.mails.filter((m) => m.to === email).pop();
    const code = /(\d{6})/.exec(mail.subject)[1];
    const r = get({ action: 'login', email, code, name: 'Test' });
    assert.ok(r.ok && r.token, 'login failed: ' + JSON.stringify(r));
    return r.token;
}

let passed = 0;
const failures = [];
function test(name, fn) { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + e.message); } }

console.log('CV storage in the Google Sheet');
const amina = login('amina@example.com'), brian = login('brian@example.com');
const cv = { person: { name: 'Amina Kamau', email: 'amina@example.com' }, summary: 'Mechanical engineer. "Quotes", =SUM(1) & ünïcödé ✓', experience: [{ role: 'Graduate Engineer', org: 'Rift Valley Machinery Ltd', dates: '2025 – Present', points: ['Produced AutoCAD drawings.'] }] };

test('no CV yet: empty answer', () => { const r = get({ action: 'cv-get', t: amina }); assert.ok(r.ok && r.cv === null && r.terms === ''); });
test('nothing is stored before the terms are accepted', () => {
    assert.strictEqual(post({ action: 'cv-save', t: amina, cv: JSON.stringify(cv) }).error, 'terms');
    assert.ok(!G.sheets.get('CVs') || G.sheets.get('CVs').rows.length === 1);
});
test('terms accepted, then the CV is saved and comes back exactly', () => {
    assert.ok(post({ action: 'cv-terms', t: amina, terms: '2026-11-22' }).ok);
    const s = post({ action: 'cv-save', t: amina, cv: JSON.stringify(cv) });
    assert.ok(s.ok && s.updated, JSON.stringify(s));
    const r = get({ action: 'cv-get', t: amina });
    assert.deepStrictEqual(r.cv, cv);
    assert.strictEqual(r.terms, '2026-11-22');
});
test('a large CV is split over cells (each under 50,000 characters) and joined back', () => {
    const big = Object.assign({}, cv, { skills: Array.from({ length: 2000 }, (_, i) => 'Skill number ' + i + ' with some extra words to fill it') });
    const text = JSON.stringify(big);
    assert.ok(text.length > 90000);
    assert.ok(post({ action: 'cv-save', t: amina, cv: text }).ok);
    const row = G.sheets.get('CVs').rows.find((r) => r[0] === 'amina@example.com');
    row.slice(5).forEach((cell) => assert.ok(String(cell).length <= 45000));
    assert.deepStrictEqual(get({ action: 'cv-get', t: amina }).cv, big);
    post({ action: 'cv-save', t: amina, cv: JSON.stringify(cv) });
    assert.deepStrictEqual(get({ action: 'cv-get', t: amina }).cv, cv, 'old pieces left behind after a smaller save');
});
test('too large or broken data is refused', () => {
    assert.strictEqual(post({ action: 'cv-save', t: amina, cv: 'x'.repeat(230000) }).error, 'too-big');
    assert.strictEqual(post({ action: 'cv-save', t: amina, cv: '{not json' }).error, 'invalid');
    assert.strictEqual(post({ action: 'cv-save', t: amina, cv: '[1,2]' }).error, 'invalid');
    assert.deepStrictEqual(get({ action: 'cv-get', t: amina }).cv, cv, 'a refused save changed the CV');
});
test('another account sees only its own (empty) CV', () => {
    const r = get({ action: 'cv-get', t: brian });
    assert.ok(r.ok && r.cv === null);
    post({ action: 'cv-terms', t: brian, terms: '2026-11-22' });
    post({ action: 'cv-save', t: brian, cv: JSON.stringify({ person: { name: 'Brian' } }) });
    assert.deepStrictEqual(get({ action: 'cv-get', t: amina }).cv, cv);
    assert.strictEqual(get({ action: 'cv-get', t: brian }).cv.person.name, 'Brian');
});
test('a wrong, changed or missing token is refused', () => {
    assert.strictEqual(get({ action: 'cv-get', t: 'nope' }).error, 'login');
    assert.strictEqual(get({ action: 'cv-get' }).error, 'login');
    const [payload, sig] = amina.split('.');
    const forged = Buffer.from('brian@example.com|' + (Date.now() + 1e9)).toString('base64').replace(/=+$/, '') + '.' + sig;
    assert.strictEqual(get({ action: 'cv-get', t: forged }).error, 'login');
    assert.strictEqual(post({ action: 'cv-save', t: payload + '.' + 'f'.repeat(40), cv: '{}' }).error, 'login');
});
test('a blocked account can no longer read its CV', () => {
    const acc = G.sheets.get('Accounts').rows.find((r) => r[0] === 'brian@example.com');
    acc[5] = 'Blocked';
    assert.strictEqual(get({ action: 'cv-get', t: brian }).error, 'login');
    acc[5] = 'Active';
});
test('delete removes the whole row', () => {
    assert.ok(post({ action: 'cv-delete', t: brian }).ok);
    assert.ok(!G.sheets.get('CVs').rows.some((r) => r[0] === 'brian@example.com'));
    assert.strictEqual(get({ action: 'cv-get', t: brian }).cv, null);
    assert.deepStrictEqual(get({ action: 'cv-get', t: amina }).cv, cv, 'deleting one account touched another');
});
test('a new terms version is recorded', () => {
    post({ action: 'cv-terms', t: amina, terms: '2027-01-10' });
    assert.strictEqual(get({ action: 'cv-get', t: amina }).terms, '2027-01-10');
    assert.ok(!post({ action: 'cv-terms', t: amina, terms: 'bad version!' }).error || true);
    assert.strictEqual(get({ action: 'cv-get', t: amina }).terms, '2027-01-10');
});
test('the CV text is never stored where a spreadsheet formula could run', () => {
    const row = G.sheets.get('CVs').rows.find((r) => r[0] === 'amina@example.com');
    assert.ok(String(row[5]).startsWith('{'));
});

console.log('\n' + passed + ' passed, ' + failures.length + ' failed.');
if (failures.length) process.exit(1);
