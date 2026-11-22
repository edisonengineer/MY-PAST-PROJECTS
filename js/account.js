/* =========================================================================
   Accounts: log in with a 6-digit code sent by email (no passwords).
   Loaded on every page (after pro.js where there is one).
   - Header: "Log in" button, or the person's initials once logged in.
   - Pages with an exam pass or Quote Pro (pro.js): a pass the account owns
     is turned on automatically, on any phone or computer.
   - account/index.html: the log-in form and "My account" (#account-app).
   - window.NexusAccount: user(), data(force), saveResult(r), logout(), onChange(fn)
   The Google Sheet (tools/google-sheet-script.gs, "Accounts" section) sends the
   codes, keeps the Accounts and Exam results tabs, and checks every request.
   ========================================================================= */
(function () {
    'use strict';

    const me = document.currentScript;
    const API = (me && me.dataset.api) || '';
    const ROOT = me ? me.src.replace(/js\/account\.js.*$/, '') : '../';
    const SESSION = 'nca-account', CACHED = 'nca-data';
    const tr = (t) => t;   // English here: js/i18n.js translates new text and labels as they appear
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const save = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

    let session = load(SESSION);   // { t, email, name, exp }
    if (session && !(session.exp > Date.now())) { session = null; save(SESSION, null); save(CACHED, null); }
    const hooks = [];
    const changed = () => { paintButton(); hooks.forEach((fn) => { try { fn(session); } catch (e) { /* ignore */ } }); };

    async function get(params) {
        if (!API) return { ok: false, error: 'setup' };
        const ctrl = 'AbortController' in window ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : 0;
        try {
            const res = await fetch(API + (API.includes('?') ? '&' : '?') + new URLSearchParams(params).toString(), ctrl ? { signal: ctrl.signal } : {});
            return await res.json();
        } catch (e) { return { ok: false, error: 'network' }; } finally { clearTimeout(timer); }
    }
    const post = (params) => (API ? fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(params) }).catch(() => {}) : Promise.resolve());

    function login(r) {
        session = { t: r.token, email: r.account.email, name: r.account.name || '', exp: Date.now() + 29 * 864e5 };
        save(SESSION, session);
        save(CACHED, { at: Date.now(), account: r.account });
        if (typeof window.track === 'function') window.track(r.isNew ? 'account-created' : 'account-login');
        changed();
    }
    function logout() { session = null; save(SESSION, null); save(CACHED, null); changed(); }
    // The account's details from the sheet (kept for 5 minutes unless force)
    async function data(force) {
        if (!session) return null;
        const c = load(CACHED);
        if (!force && c && c.account && Date.now() - c.at < 5 * 60000) return c.account;
        const r = await get({ action: 'account', t: session.t });
        if (r && r.ok) {
            save(CACHED, { at: Date.now(), account: r.account });
            if (r.account.name !== session.name) { session.name = r.account.name; save(SESSION, session); paintButton(); }
            return r.account;
        }
        if (r && r.error === 'login') { logout(); return null; }
        return c ? c.account : null;   // offline: what we had
    }
    function saveResult(x) {
        if (!session) return Promise.resolve();
        const c = load(CACHED);
        if (c && c.account) {   // show it straight away, before the sheet has it
            c.account.results = [{ date: new Date().toISOString().slice(0, 10), test: x.test, score: x.score, points: x.points, minutes: x.minutes }].concat(c.account.results || []);
            save(CACHED, c);
        }
        return post({ action: 'account-result', t: session.t, test: x.test, score: x.score, points: x.points || '', minutes: x.minutes || 0, topics: x.topics || '', date: x.date || '' });
    }

    /* ---------- Header button ---------- */
    const initials = (s) => {
        const n = (s.name || '').trim() || s.email.split('@')[0];
        return n.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
    };
    function paintButton() {
        const tools = document.querySelector('.header-tools');
        if (!tools) return;
        let b = tools.querySelector('.acct-btn');
        if (!b) {
            b = document.createElement('a');
            b.className = 'acct-btn';
            tools.insertBefore(b, tools.querySelector('.theme-toggle') || null);
        }
        const here = /\/account\/(index\.html)?$/.test(location.pathname);
        const rootHref = new URL(ROOT, location.href).href, rel = location.href.split('#')[0].slice(rootHref.length);
        b.href = ROOT + 'account/index.html' + (session || here || !rel ? '' : '?next=' + encodeURIComponent(rel));
        if (session) {
            b.innerHTML = '<span class="acct-initials" data-no-i18n>' + esc(initials(session)) + '</span>';
            b.setAttribute('aria-label', tr('My account') + ': ' + session.email);
            b.title = session.email;
        } else {
            b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 20c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
            b.setAttribute('aria-label', tr('Log in or create an account'));
            b.title = tr('Log in or create an account');
        }
    }

    /* ---------- Exam pass / Quote Pro: on automatically for the account's own pass ---------- */
    function unlockPass() {
        const NP = window.NexusPro;
        if (!session || !NP || !NP.activate || NP.isPro()) return;
        data().then((acc) => {
            const pass = acc && (acc.passes || []).find((p) => p.product === NP.product && p.active);
            if (!pass || NP.isPro()) return;
            NP.activate(pass.key).then((r) => {
                if (r && r.ok) toast(NP.product === 'exams' ? 'Your exam pass is on: it comes with your account.' : 'Quote Pro is on: it comes with your account.');
                else if (r && r.message) toast(r.message);
            });
        });
    }
    function toast(text) {
        const t = document.createElement('div');
        t.className = 'acct-toast';
        t.setAttribute('role', 'status');
        t.textContent = tr(text);
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('is-out'), 4500);
        setTimeout(() => t.remove(), 5200);
    }

    /* ---------- account/index.html ---------- */
    const app = document.getElementById('account-app');
    const fmtDate = (d) => { const x = new Date(String(d).length === 10 ? d + 'T12:00:00' : d); return isNaN(x) ? String(d || '') : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
    const kes = (n) => 'KES ' + Math.round(n || 0).toLocaleString('en-US');
    const ERR = {
        invalid: 'Please enter a valid email address.',
        busy: 'Too many attempts. Please wait a few minutes and try again.',
        blocked: 'This account is switched off. Please message me on WhatsApp.',
        wrong: 'That code is not right. Check the latest email and try again.',
        expired: 'That code has expired. Ask for a new one.',
        network: 'Could not reach the server. Check your connection and try again.',
        setup: 'Accounts are not set up on this site yet.'
    };
    const err = (r) => tr(ERR[r && r.error] || 'Something went wrong. Please try again.') + (r && r.error === 'wrong' && r.left ? ' (' + r.left + ' ' + tr('tries left') + ')' : '');
    // Where to go after logging in: only pages of this site
    const nextPage = () => { const n = new URLSearchParams(location.search).get('next') || ''; return /^(?:[\w-]+\/)?(?:[\w.-]+\.html)?(?:\?[\w=&%.+-]*)?$/.test(n) && n && !/^account\//.test(n) ? ROOT + n : ''; };

    function renderLogin(email, step) {
        app.innerHTML = `<div class="acct-card acct-login">
            <h2>${step === 2 ? tr('Check your email') : tr('Log in or create an account')}</h2>
            ${step === 2 ? `<p>${tr('We sent a 6-digit code to')} <strong data-no-i18n>${esc(email)}</strong>. ${tr('It works for 10 minutes.')}</p>` :
                `<p>${tr('No password needed: type your email and we\'ll send you a 6-digit code. New here? The same step creates your account.')}</p>`}
            <form id="acct-form" novalidate>
                ${step === 2 ? `<div class="field"><label for="acct-code">${tr('6-digit code')}</label><input id="acct-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" placeholder="123456" required></div>
                <div class="field"><label for="acct-name">${tr('Your name')} <small>${tr('(for new accounts)')}</small></label><input id="acct-name" name="name" type="text" autocomplete="name" maxlength="80"></div>` :
                `<div class="field"><label for="acct-email">${tr('Email address')}</label><input id="acct-email" name="email" type="email" autocomplete="email" required value="${esc(email || '')}"></div>`}
                <p class="form-error" role="alert" hidden></p>
                <button type="submit" class="btn btn-sun btn-block">${step === 2 ? tr('Log in') : tr('Email me a code')}</button>
            </form>
            ${step === 2 ? `<p class="acct-alt"><button type="button" class="link-btn" data-acct="resend">${tr('Send a new code')}</button> · <button type="button" class="link-btn" data-acct="other">${tr('Use a different email')}</button></p>` : ''}
            <ul class="acct-why">
                <li>${tr('Your exam pass and Quote Pro on every phone and computer')}</li>
                <li>${tr('Your practice exam results, saved')}</li>
                <li>${tr('Your training, projects and invoices in one place')}</li>
            </ul>
        </div>`;
        const form = app.querySelector('#acct-form'), box = form.querySelector('.form-error'), btn = form.querySelector('button[type=submit]');
        const fail = (r) => { box.textContent = err(r); box.hidden = false; btn.disabled = false; };
        form.querySelector('input').focus();
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            box.hidden = true;
            if (step === 1) {
                const v = form.email.value.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { fail({ error: 'invalid' }); return; }
                btn.disabled = true;
                const r = await get({ action: 'login-start', email: v });
                if (r && r.ok) renderLogin(v, 2); else fail(r);
            } else {
                const code = form.code.value.replace(/\D/g, '');
                if (code.length !== 6) { fail({ error: 'wrong' }); return; }
                btn.disabled = true;
                const r = await get({ action: 'login', email, code, name: form.name.value.trim() });
                if (r && r.ok) { login(r); const n = nextPage(); if (n) location.href = n; else renderAccount(r.account); } else fail(r);
            }
        });
        app.querySelectorAll('[data-acct]').forEach((b) => b.addEventListener('click', async () => {
            if (b.dataset.acct === 'other') { renderLogin(email, 1); return; }
            b.disabled = true;
            const r = await get({ action: 'login-start', email });
            b.disabled = false;
            if (r && r.ok) { box.textContent = tr('A new code is on its way.'); box.hidden = false; } else fail(r);
        }));
    }

    function section(title, body, cls) { return `<section class="acct-card ${cls || ''}"><h2>${tr(title)}</h2>${body}</section>`; }
    function renderAccount(a) {
        if (!a) { app.innerHTML = `<div class="acct-card"><p>${tr('Could not load your account. Check your connection and try again.')}</p><button type="button" class="btn btn-navy" data-acct="retry">${tr('Try again')}</button></div>`; app.querySelector('[data-acct=retry]').addEventListener('click', () => start(true)); return; }
        const pass = (product) => (a.passes || []).filter((p) => p.product === product).sort((x, y) => (y.active - x.active) || (y.expires > x.expires ? 1 : -1))[0];
        const passCard = (product, name, open, label) => {
            const p = pass(product);
            const status = !p ? `<p class="acct-status">${tr('Not on your account yet.')}</p>` :
                p.active ? `<p class="acct-status is-on"><span class="acct-dot"></span>${tr('Active until')} <strong data-no-i18n>${esc(fmtDate(p.expires))}</strong></p>` :
                    `<p class="acct-status is-off">${tr('Ended on')} <strong data-no-i18n>${esc(fmtDate(p.expires))}</strong></p>`;
            return `<div class="acct-pass">
                <h3>${tr(name)}</h3>${status}
                ${p ? `<p class="acct-key">${tr('Key')}: <code data-no-i18n>${esc(p.key)}</code></p>` : ''}
                <div class="acct-actions">
                    ${p && p.active ? `<a class="btn btn-sun" href="${ROOT}${open}">${tr(label)}</a>` : `<a class="btn btn-sun" href="${ROOT}${open}${p ? '?renew=1' : ''}">${tr(p ? 'Renew' : 'Get it')}</a>`}
                </div>
            </div>`;
        };
        const results = (a.results || []).slice(0, 12);
        app.innerHTML = `<div class="acct-hello">
                <span class="acct-avatar" data-no-i18n>${esc(initials({ name: a.name, email: a.email }))}</span>
                <div><h2>${a.name ? tr('Hello') + ', <span data-no-i18n>' + esc(a.name.split(' ')[0]) + '</span>' : tr('Welcome!')}</h2><p data-no-i18n>${esc(a.email)}</p></div>
                <button type="button" class="btn btn-outline" data-acct="logout">${tr('Log out')}</button>
            </div>
            <div class="acct-grid">
            ${section('Your passes', `<div class="acct-passes">${passCard('exams', 'SolidWorks exam pass', 'exams/index.html', 'Open exam practice')}${passCard('quote', 'Quote Pro', 'quote/index.html', 'Open the quote tool')}</div>
                <p class="acct-note">${tr('Log in on any phone or computer and your pass turns on by itself (up to 3 devices).')}</p>`, 'acct-wide')}
            ${section('Practice exam results', results.length ? `<table class="acct-table"><thead><tr><th>${tr('Date')}</th><th>${tr('Test')}</th><th>${tr('Score')}</th></tr></thead><tbody>${results.map((r) => `<tr><td data-no-i18n>${esc(fmtDate(r.date))}</td><td data-no-i18n>${esc(r.test)}</td><td><strong data-no-i18n>${esc(r.score)}%</strong> ${r.score >= 70 ? `<span class="acct-pill is-on">${tr('Pass')}</span>` : ''}</td></tr>`).join('')}</tbody></table>` :
                `<p>${tr('No results yet.')} <a href="${ROOT}exams/index.html">${tr('Try a free practice test')}</a></p>`)}
            ${section('Your training', (a.training || []).length ? `<ul class="acct-list">${a.training.map((t) => `<li><strong data-no-i18n>${esc(t.course)}</strong>${t.cls ? ' <span data-no-i18n>· ' + esc(t.cls) + '</span>' : ''}${t.format ? ' <span data-no-i18n>· ' + esc(t.format) + '</span>' : ''}
                <span class="acct-pill" data-no-i18n>${esc(t.status || '')}</span>${t.certificate ? ` <a href="${ROOT}verify/index.html?code=${encodeURIComponent(t.certificate)}">${tr('View certificate')}</a>` : ''}</li>`).join('')}</ul>` :
                `<p>${tr('No courses yet.')} <a href="${ROOT}training/index.html">${tr('See the courses')}</a></p>`)}
            ${section('Your projects', (a.projects || []).length ? `<ul class="acct-list">${a.projects.map((p) => `<li><strong data-no-i18n>${esc(p.project || p.ref)}</strong> <span class="acct-muted" data-no-i18n>${esc(p.ref)}</span>
                <span class="acct-progress" role="img" aria-label="${esc(p.progress)}%"><span style="width:${Math.max(0, Math.min(100, Number(p.progress) || 0))}%"></span></span>
                <span data-no-i18n>${esc(p.stage)}</span> · <a href="${ROOT}track/index.html?ref=${encodeURIComponent(p.ref)}">${tr('Track')}</a></li>`).join('')}</ul>` :
                `<p>${tr('No projects yet.')} <a href="${ROOT}index.html#brief">${tr('Start a project')}</a></p>`)}
            ${section('Invoices and receipts', (a.documents || []).length ? `<table class="acct-table"><thead><tr><th>${tr('Document')}</th><th>${tr('Date')}</th><th>${tr('Total')}</th><th>${tr('Paid')}</th></tr></thead><tbody>${a.documents.map((d) => `<tr><td><span data-no-i18n>${esc(d.type)} ${esc(d.number)}</span></td><td data-no-i18n>${esc(fmtDate(d.date))}</td><td data-no-i18n>${esc(kes(d.total))}</td><td data-no-i18n>${esc(kes(d.paid))}</td></tr>`).join('')}</tbody></table><p class="acct-note">${tr('The PDF of each one was emailed to you.')}</p>` :
                `<p>${tr('Nothing yet.')}</p>`)}
            ${section('Your details', `<form id="acct-profile" class="acct-profile" novalidate>
                <div class="field"><label for="ap-name">${tr('Name')}</label><input id="ap-name" name="name" type="text" maxlength="80" autocomplete="name" value="${esc(a.name)}"></div>
                <div class="field"><label for="ap-phone">${tr('Phone / WhatsApp')}</label><input id="ap-phone" name="phone" type="tel" maxlength="30" autocomplete="tel" value="${esc(a.phone)}"></div>
                <button type="submit" class="btn btn-navy">${tr('Save')}</button> <span class="acct-saved" role="status" hidden>${tr('Saved')}</span>
            </form>`)}
            </div>`;
        app.querySelector('[data-acct=logout]').addEventListener('click', () => { logout(); renderLogin('', 1); window.scrollTo(0, 0); });
        const pf = app.querySelector('#acct-profile');
        pf.addEventListener('submit', (e) => {
            e.preventDefault();
            post({ action: 'account-update', t: session.t, name: pf.name.value.trim(), phone: pf.phone.value.trim() });
            const c = load(CACHED);
            if (c && c.account) { c.account.name = pf.name.value.trim(); c.account.phone = pf.phone.value.trim(); save(CACHED, c); }
            session.name = pf.name.value.trim(); save(SESSION, session); paintButton();
            const s = pf.querySelector('.acct-saved'); s.hidden = false; setTimeout(() => { s.hidden = true; }, 2500);
        });
    }
    async function start(force) {
        if (!app) return;
        if (!session) { renderLogin('', 1); return; }
        const c = load(CACHED);
        if (c && c.account) renderAccount(c.account);   // instantly, then fresh from the sheet
        else app.innerHTML = `<div class="acct-card"><p class="acct-loading">${tr('Loading your account…')}</p></div>`;
        const a = await data(true);
        if (!session) { renderLogin('', 1); return; }
        if (a || !c || force) renderAccount(a);
    }

    window.NexusAccount = { user: () => session, data, saveResult, logout, onChange(fn) { hooks.push(fn); } };
    const ready = () => { paintButton(); start(); unlockPass(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
