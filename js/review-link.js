/* =========================================================================
   Review-request link maker (request-review/index.html, for Edison only).
   Builds a link that opens the homepage review form already filled in.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const form = $('#rr-form');
    if (!form) return;
    const SITE = new URL('../', location.href).href;
    const out = $('#rr-link');
    const copyBtn = $('#rr-copy');

    function build() {
        const p = new URLSearchParams({ review: '1' });
        const name = form.client.value.trim();
        const project = form.project.value.trim();
        if (name) p.set('name', name);
        if (project) p.set('project', project);
        p.set('service', form.service.value);
        return SITE + 'index.html?' + p.toString() + '#reviews';
    }
    function message(link) {
        const first = form.client.value.trim().split(/\s+/)[0];
        const project = form.project.value.trim();
        return 'Hi' + (first ? ' ' + first : '') + ', thank you for working with me' + (project ? ' on ' + project : '') +
            '! If you have a minute, I would really appreciate a short review. It helps other clients find me: ' + link;
    }
    function update() {
        const link = build();
        out.value = link;
        const phone = form.phone.value.replace(/[^\d]/g, '').replace(/^0/, '254');
        $('#rr-wa').href = 'https://wa.me/' + (phone.length >= 11 ? phone : '') + '?text=' + encodeURIComponent(message(link));
        $('#rr-mail').href = 'mailto:?subject=' + encodeURIComponent('A quick review?') + '&body=' + encodeURIComponent(message(link));
        $('#rr-open').href = link;
        $('#rr-preview').textContent = message(link);
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    copyBtn.addEventListener('click', () => {
        const done = () => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy link'; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(done, () => { out.select(); document.execCommand('copy'); done(); });
        else { out.select(); document.execCommand('copy'); done(); }
    });
    update();
})();
