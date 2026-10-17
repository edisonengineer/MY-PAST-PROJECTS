/* =========================================================================
   Certificate verification (verify/index.html): asks the Google Sheet
   (Trainees tab) whether a certificate code belongs to a trainee who
   completed a course. Works with links like verify/?code=NCS-7KQ4-X9TB.
   ========================================================================= */
(function () {
    'use strict';
    const $ = (s) => document.querySelector(s);
    const form = $('#verify-form');
    if (!form) return;
    const C = window.SITE_CONFIG || {};
    const api = C.trackerApi || C.reviewsApi;
    const input = $('#verify-code'), out = $('#verify-result'), err = $('.form-error', form), btn = $('button[type="submit"]', form);
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (n) => '<svg aria-hidden="true"><use href="#i-' + n + '"/></svg>';

    async function check(raw) {
        const code = String(raw || '').trim().toUpperCase();
        err.hidden = true;
        out.hidden = true;
        if (code.replace(/[^A-Z0-9]/g, '').length < 8) { err.textContent = t('Please enter the code printed on the certificate.'); err.hidden = false; input.focus(); return; }
        if (!api) { err.textContent = t('Verification is not available right now. Please message me on WhatsApp.'); err.hidden = false; return; }
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> ' + t('Checking…');
        try {
            const res = await fetch(api + (api.includes('?') ? '&' : '?') + 'action=verify&code=' + encodeURIComponent(code));
            const d = await res.json();
            if (d && d.valid) {
                out.innerHTML = '<article class="track-card verify-card is-valid">' +
                    '<p class="verify-status">' + icon('check') + ' <span>Valid certificate</span></p>' +
                    '<h2 data-no-i18n>' + esc(d.name) + '</h2>' +
                    '<p class="verify-line"><span>Completed the</span> <strong data-no-i18n>' + esc(d.course) + '</strong> <span>training course</span></p>' +
                    '<dl class="pm-meta track-meta">' +
                        (d.date ? '<div><dt>Date of completion</dt><dd data-no-i18n>' + esc(d.date) + '</dd></div>' : '') +
                        '<div><dt>Certificate code</dt><dd data-no-i18n>' + esc(d.code) + '</dd></div>' +
                        '<div><dt>Issued by</dt><dd data-no-i18n>Nexus CAD Studio · Edison Ochieng</dd></div>' +
                    '</dl></article>';
                if (typeof window.track === 'function') window.track('certificate-verified');
            } else if (d && d.error) {
                out.innerHTML = '<article class="track-card verify-card"><p>' + esc(t('Too many checks right now. Please try again in a few minutes.')) + '</p></article>';
            } else {
                out.innerHTML = '<article class="track-card verify-card is-invalid">' +
                    '<p class="verify-status">' + icon('close') + ' <span>No certificate found</span></p>' +
                    '<p>' + esc(t('There is no completed certificate with this code. Check that it is typed exactly as printed, or contact me to confirm.')) + '</p></article>';
            }
            out.hidden = false;
            out.focus({ preventScroll: true });
            history.replaceState(null, '', location.pathname + '?code=' + encodeURIComponent(code));
        } catch (e) {
            err.textContent = t("The check couldn't connect just now. Please try again in a minute.");
            err.hidden = false;
        } finally {
            btn.disabled = false;
            btn.innerHTML = label;
        }
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); check(input.value); });
    const q = new URLSearchParams(location.search).get('code');
    if (q) { input.value = q; window.addEventListener('load', () => check(q)); }
})();
