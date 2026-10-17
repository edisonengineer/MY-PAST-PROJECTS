/* =========================================================================
   Training page: live seats per course from the Google Sheet
   (Courses tab "Next class" and "Seats", counted from the Trainees tab).
   A full class shows "Fully booked" and new requests join the waiting list.
   ========================================================================= */
(function () {
    'use strict';
    const C = window.SITE_CONFIG || {};
    const api = C.trackerApi || C.reviewsApi;
    if (!api) return;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

    fetch(api + (api.includes('?') ? '&' : '?') + 'action=training')
        .then((r) => r.json())
        .then((d) => {
            (d.courses || []).forEach((c) => {
                const el = Array.from(document.querySelectorAll('[data-seats]')).find((x) => same(x.dataset.seats, c.name));
                if (el) {
                    const parts = [];
                    if (c.full) parts.push('<span class="cs-badge">Fully booked</span> <span>Reserve to join the waiting list</span>');
                    else {
                        if (c.nextClass) parts.push('<span>Next class:</span> <strong data-no-i18n>' + esc(c.nextClass) + '</strong>');
                        if (typeof c.left === 'number') parts.push('<span class="cs-left">' + (c.left === 1 ? '1 seat left' : c.left + ' seats left') + '</span>');
                    }
                    if (parts.length) {
                        el.innerHTML = parts.join(' · ');
                        el.classList.toggle('is-full', !!c.full);
                        el.classList.toggle('is-low', !c.full && typeof c.left === 'number' && c.left <= 3);
                        el.hidden = false;
                    }
                }
                const opt = Array.from(document.querySelectorAll('#tr-course option')).find((o) => same(o.value, c.name));
                if (opt && c.full && !/waiting list/i.test(opt.textContent)) opt.textContent = c.name + ' (fully booked: waiting list)';
            });
        })
        .catch(() => { /* sheet unreachable: the page works as before */ });
})();
