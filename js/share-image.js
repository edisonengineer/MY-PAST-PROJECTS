/* =========================================================================
   WhatsApp status / Instagram story image maker (share/index.html).
   Draws a 1080 x 1920 image for the current campaign or for any course's
   next class, ready to download or share straight to WhatsApp from a phone.
   Data: window.SHARE_DATA (built by tools/build-pages.js) + live next class
   and seats from the Google Sheet (action=training).
   ========================================================================= */
(function () {
    'use strict';
    const D = window.SHARE_DATA;
    if (!D) return;
    const $ = (s) => document.querySelector(s);
    const canvas = $('#share-canvas'), ctx = canvas.getContext('2d');
    const W = 1080, H = 1920, PAD = 90;
    const pick = $('#share-pick'), status = $('#share-status');
    const live = {};
    const imgCache = {};

    const fonts = Promise.all([
        new FontFace('Fraunces', 'url(../fonts/fraunces-latin.woff2)', { weight: '300 900' }).load(),
        new FontFace('Jakarta', 'url(../fonts/plus-jakarta-sans-latin.woff2)', { weight: '200 800' }).load()
    ]).then((f) => f.forEach((x) => document.fonts.add(x))).catch(() => { /* system fonts */ });

    function loadImg(src) {
        if (!src) return Promise.resolve(null);
        if (!imgCache[src]) imgCache[src] = new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = '../' + src; });
        return imgCache[src];
    }

    // Wrap text to a width; returns the lines (max lines, last one ends with … if cut)
    function wrap(text, font, width, max) {
        ctx.font = font;
        const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
        let line = '';
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > width && line) { lines.push(line); line = w; } else line = t;
        }
        if (line) lines.push(line);
        if (lines.length > max) { lines.length = max; lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, '') + '…'; }
        return lines;
    }
    function rounded(x, y, w, h, r) {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    // What the selected option promotes: { badge, title, lines[], image, cta }
    function content() {
        const v = pick.value;
        if (v === 'campaign' && D.campaign) {
            const c = D.campaign;
            return { badge: c.badge || 'Special offer', title: c.title || c.badge, lines: String(c.text || '').split(/\n+/).filter(Boolean), image: c.image, cta: c.button || 'Find out more', ends: c.end };
        }
        const t = (D.tools || []).find((x) => x.id === v);
        if (t) return { badge: t.badge, title: t.title, lines: t.lines.slice(), art: t.art, cta: t.cta, url: t.url };
        const c = D.courses.find((x) => x.id === v);
        if (!c) return null;
        const l = live[c.name.toLowerCase()] || {};
        const lines = [];
        if (l.nextClass) lines.push('Next class: ' + l.nextClass);
        if (c.length) lines.push(c.length);
        lines.push(c.tagline);
        if (typeof l.left === 'number' && !l.full) lines.push(l.left === 1 ? 'Only 1 seat left' : 'Only ' + l.left + ' seats left');
        if (l.full) lines.push('This class is full: join the waiting list');
        return { badge: 'CAD training · Nairobi & online', title: c.name + ' training', lines, image: c.image, cta: l.full ? 'Join the waiting list' : 'Reserve your seat', starts: l.starts };
    }

    async function draw() {
        const c = content();
        if (!c) return;
        await fonts;
        // Background
        ctx.fillStyle = '#0e1a3a'; ctx.fillRect(0, 0, W, H);
        const g1 = ctx.createRadialGradient(W * 0.9, 120, 40, W * 0.9, 120, 760); g1.addColorStop(0, 'rgba(255,182,39,.55)'); g1.addColorStop(1, 'rgba(255,182,39,0)');
        ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
        const g2 = ctx.createRadialGradient(80, H - 160, 40, 80, H - 160, 820); g2.addColorStop(0, 'rgba(226,69,122,.45)'); g2.addColorStop(1, 'rgba(226,69,122,0)');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
        let y = 150;
        // Brand
        ctx.fillStyle = '#ffb627'; ctx.font = '800 34px Jakarta, Arial'; ctx.fillText('NEXUS CAD STUDIO', PAD, y);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 30px Jakarta, Arial'; ctx.fillText('Edison Ochieng · Nairobi', PAD, y + 48);
        y += 140;
        // Badge
        ctx.font = '800 32px Jakarta, Arial';
        const bw = Math.min(W - 2 * PAD, ctx.measureText(c.badge.toUpperCase()).width + 64);
        rounded(PAD, y, bw, 70, 35); ctx.fillStyle = '#ffb627'; ctx.fill();
        ctx.fillStyle = '#0e1a3a'; ctx.fillText(c.badge.toUpperCase(), PAD + 32, y + 47, bw - 64);
        y += 130;
        // Title
        const tl = wrap(c.title, '600 104px Fraunces, Georgia', W - 2 * PAD, 4);
        ctx.fillStyle = '#ffffff';
        tl.forEach((t) => { ctx.fillText(t, PAD, y + 90); y += 116; });
        y += 30;
        // Countdown / end date join the detail lines; lay those out first so nothing important is cut
        if (c.starts) {
            const days = Math.round((Date.parse(c.starts + 'T00:00:00Z') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 864e5);
            if (days >= 0) c.lines.unshift(days === 0 ? 'Starts TODAY' : days === 1 ? 'Starts TOMORROW' : 'Starts in ' + days + ' days');
        }
        if (c.ends) c.lines.push('Offer ends ' + new Date(c.ends + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }));
        const laid = c.lines.map((line) => wrap(line, '500 44px Jakarta, Arial', W - 2 * PAD, 3));
        const textH = laid.reduce((a, ls) => a + ls.length * 60 + 14, 0);
        const bottom = H - 380;                                   // the button starts below this
        // Picture: as big as fits (up to 620px), never below 260px
        const img = await loadImg(c.image);
        if (!img && c.art) {
            const ih = Math.max(300, Math.min(560, bottom - y - textH - 60)), iw = W - 2 * PAD;
            rounded(PAD, y, iw, ih, 36); ctx.fillStyle = '#fbf6ee'; ctx.fill();
            drawArt(c.art, PAD, y, iw, ih);
            y += ih + 60;
        } else if (img) {
            const ih = Math.max(260, Math.min(620, bottom - y - textH - 60)), iw = W - 2 * PAD;
            ctx.save(); rounded(PAD, y, iw, ih, 36); ctx.clip();
            ctx.fillStyle = '#f3eadb'; ctx.fillRect(PAD, y, iw, ih);
            const s = Math.max(iw / img.width, ih / img.height), dw = img.width * s, dh = img.height * s;
            ctx.drawImage(img, PAD + (iw - dw) / 2, y + (ih - dh) / 2, dw, dh);
            ctx.restore();
            y += ih + 60;
        }
        // Detail lines (the countdown / seats left in the highlight colour)
        ctx.font = '500 44px Jakarta, Arial';
        laid.forEach((ls, i) => {
            ctx.fillStyle = /^(Starts|Only|Offer ends)/.test(c.lines[i]) ? '#ffb627' : 'rgba(255,255,255,.9)';
            for (const t of ls) { if (y + 40 > bottom) return; ctx.fillText(t, PAD, y + 40); y += 60; }
            y += 14;
        });
        // Call to action + contacts (pinned to the bottom)
        const by = H - 330;
        rounded(PAD, by, W - 2 * PAD, 130, 65); ctx.fillStyle = '#ffb627'; ctx.fill();
        ctx.fillStyle = '#0e1a3a'; ctx.font = '800 50px Jakarta, Arial'; ctx.textAlign = 'center';
        ctx.fillText(c.cta, W / 2, by + 82, W - 2 * PAD - 60);
        ctx.fillStyle = '#ffffff'; ctx.font = '600 40px Jakarta, Arial';
        ctx.fillText('WhatsApp ' + D.whatsapp, W / 2, H - 120);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 32px Jakarta, Arial';
        ctx.fillText(c.url || D.site, W / 2, H - 68, W - 2 * PAD);
        ctx.textAlign = 'left';
    }

    // Simple drawings for the quote tools (no photo needed)
    function drawArt(kind, x, y, w, h) {
        ctx.save();
        const cx = x + w / 2, cy = y + h / 2;
        if (kind === 'gate') {
            const gw = w * 0.74, gh = h * 0.62, gx = cx - gw / 2, gy = cy - gh / 2 - 10, f = 14, leaf = (gw - 10) / 2;
            ctx.fillStyle = '#646a82'; ctx.fillRect(gx - 46, gy - 24, 30, gh + 54); ctx.fillRect(gx + gw + 16, gy - 24, 30, gh + 54);
            ctx.fillStyle = '#b9a98d'; ctx.fillRect(x + 40, gy + gh + 30, w - 80, 6);
            for (let i = 0; i < 2; i++) {
                const lx = gx + i * (leaf + 10);
                ctx.fillStyle = '#13a89e';
                for (let k = 1; k < 12; k++) ctx.fillRect(lx + k * leaf / 12 - 3, gy, 7, gh);
                ctx.strokeStyle = '#0e1a3a'; ctx.lineWidth = f; ctx.strokeRect(lx + f / 2, gy + f / 2, leaf - f, gh - f);
                ctx.fillStyle = '#2b3c7d'; ctx.fillRect(lx, gy + gh / 2 - 6, leaf, 12);
            }
        } else if (kind === 'sheet') {
            // A U channel and its flat pattern with bend lines
            ctx.strokeStyle = '#13a89e'; ctx.lineWidth = 16; ctx.lineJoin = 'round';
            const ux = x + w * 0.12, uy = y + h * 0.2, uw = w * 0.3, uh = h * 0.55;
            ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy + uh); ctx.lineTo(ux + uw, uy + uh); ctx.lineTo(ux + uw, uy); ctx.stroke();
            const fx = x + w * 0.55, fy = y + h * 0.18, fw = w * 0.34, fh = h * 0.6;
            ctx.fillStyle = 'rgba(19,168,158,.18)'; ctx.fillRect(fx, fy, fw, fh);
            ctx.strokeStyle = '#13a89e'; ctx.lineWidth = 6; ctx.strokeRect(fx, fy, fw, fh);
            ctx.strokeStyle = '#ff6b4a'; ctx.setLineDash([22, 14]); ctx.lineWidth = 6;
            [0.32, 0.68].forEach((p) => { ctx.beginPath(); ctx.moveTo(fx + fw * p, fy); ctx.lineTo(fx + fw * p, fy + fh); ctx.stroke(); });
            ctx.setLineDash([]);
            ctx.fillStyle = '#0e1a3a'; ctx.font = '700 34px Jakarta, Arial'; ctx.textAlign = 'center';
            ctx.fillText('KES 264 each', ux + uw / 2, y + h - 30); ctx.fillText('flat 104 × 120', fx + fw / 2, y + h - 30);
            ctx.textAlign = 'left';
        } else {
            // A quotation page
            const pw = w * 0.56, ph = h * 0.84, px = cx - pw / 2, py = cy - ph / 2;
            ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(14,26,58,.2)'; ctx.shadowBlur = 30; ctx.fillRect(px, py, pw, ph); ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffb627'; rounded(px + 30, py + 30, 110, 70, 14); ctx.fill();
            ctx.fillStyle = '#0e1a3a'; ctx.font = '800 26px Jakarta, Arial'; ctx.fillText('LOGO', px + 50, py + 74);
            ctx.font = '600 40px Fraunces, Georgia'; ctx.textAlign = 'right'; ctx.fillText('QUOTATION', px + pw - 30, py + 76); ctx.textAlign = 'left';
            ctx.fillStyle = '#13a89e'; ctx.fillRect(px + 30, py + 124, pw - 60, 6);
            ctx.fillStyle = '#0e1a3a'; ctx.fillRect(px + 30, py + 160, pw - 60, 40);
            ctx.fillStyle = '#e3e6ee'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 30, py + 228 + i * 46, pw - 60 - (i % 2) * 80, 18);
            ctx.fillStyle = '#0e1a3a'; ctx.font = '800 34px Jakarta, Arial'; ctx.textAlign = 'right'; ctx.fillText('KES 69,798', px + pw - 30, py + ph - 40); ctx.textAlign = 'left';
        }
        ctx.restore();
    }

    function fileName() { return 'nexus-cad-studio-' + (pick.value === 'campaign' ? 'offer' : pick.value) + '-status.png'; }
    $('#share-download').addEventListener('click', () => {
        canvas.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fileName(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
    });
    const shareBtn = $('#share-native');
    if (navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })) {
        shareBtn.hidden = false;
        shareBtn.addEventListener('click', () => canvas.toBlob((b) => {
            navigator.share({ files: [new File([b], fileName(), { type: 'image/png' })] }).catch(() => { /* cancelled */ });
        }, 'image/png'));
    }
    pick.addEventListener('change', draw);

    // Live next class, seats and start date from the sheet
    if (D.api) {
        status.textContent = 'Getting the next class dates from your sheet…';
        fetch(D.api + (D.api.includes('?') ? '&' : '?') + 'action=training').then((r) => r.json()).then((d) => {
            (d.courses || []).forEach((c) => { live[String(c.name).toLowerCase()] = c; });
            status.textContent = '';
            draw();
        }).catch(() => { status.textContent = 'Could not reach the sheet: the image shows the course without class dates.'; });
    }
    draw();
})();
