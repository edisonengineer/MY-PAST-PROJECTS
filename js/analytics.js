/* =========================================================================
   Visitor analytics with GoatCounter (free, privacy-friendly, no cookies).
   Turn it on by setting `goatcounter` in js/config.js.
   Also counts key actions: WhatsApp clicks, emails, briefs, reviews, downloads.
   ========================================================================= */
(function () {
    'use strict';
    const code = (window.SITE_CONFIG || {}).goatcounter;
    const queue = [];

    window.track = function (name) {
        if (!code) return;
        const send = () => window.goatcounter.count({ path: 'event/' + name, title: name, event: true });
        if (window.goatcounter && window.goatcounter.count) send(); else queue.push(send);
    };
    if (!code) return;

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = 'https://' + code + '.goatcounter.com/count';
    s.onload = () => { while (queue.length) queue.shift()(); };
    document.head.appendChild(s);

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a, button');
        if (!a) return;
        if (a.href && a.href.indexOf('wa.me') > -1) window.track('whatsapp-click');
        else if (a.classList.contains('js-email')) window.track('email-click');
        else if (a.href && /cv\.pdf$/.test(a.href)) window.track('cv-download');
    });
})();
