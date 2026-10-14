/* =========================================================================
   Colour picker for design briefs
   Clients drag to choose colours (or type RGB, CMYK or HEX values), build a
   palette of up to 6 colours, and add it to their project brief. The palette
   is sent with the brief as HEX + RGB + CMYK values.
   Opened by any element with  data-colour-open.
   ========================================================================= */
(function () {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const t = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
    const MAX = 6;
    const KEY = 'briefPalette';
    const PRESETS = ['#0E1A3A', '#2F6BFF', '#13A89E', '#1FAE6A', '#FFB627', '#FF6B4A', '#E2457A', '#7457F2', '#000000', '#FFFFFF', '#BB0000', '#006600'];

    /* ---------- Colour maths ---------- */
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
    const rgbToHex = ({ r, g, b }) => ('#' + hex2(r) + hex2(g) + hex2(b)).toUpperCase();
    function hexToRgb(h) {
        let s = String(h).trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
        if (!/^[0-9a-f]{6}$/i.test(s)) return null;
        return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
    }
    function rgbToCmyk({ r, g, b }) {
        const R = r / 255, G = g / 255, B = b / 255;
        const k = 1 - Math.max(R, G, B);
        if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
        return { c: Math.round((1 - R - k) / (1 - k) * 100), m: Math.round((1 - G - k) / (1 - k) * 100), y: Math.round((1 - B - k) / (1 - k) * 100), k: Math.round(k * 100) };
    }
    const cmykToRgb = ({ c, m, y, k }) => ({ r: 255 * (1 - c / 100) * (1 - k / 100), g: 255 * (1 - m / 100) * (1 - k / 100), b: 255 * (1 - y / 100) * (1 - k / 100) });
    function rgbToHsv({ r, g, b }) {
        const R = r / 255, G = g / 255, B = b / 255;
        const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
        let h = 0;
        if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
        return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
    }
    function hsvToRgb({ h, s, v }) {
        const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
        const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        return { r: (R + m) * 255, g: (G + m) * 255, b: (B + m) * 255 };
    }
    const round = ({ r, g, b }) => ({ r: Math.round(r), g: Math.round(g), b: Math.round(b) });
    const describe = (hex) => {
        const rgb = hexToRgb(hex), c = rgbToCmyk(rgb);
        return { hex, rgb: 'RGB ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b, cmyk: 'CMYK ' + c.c + ', ' + c.m + ', ' + c.y + ', ' + c.k };
    };
    const readable = (hex) => { const { r, g, b } = hexToRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0e1a3a' : '#ffffff'; };

    /* ---------- State ---------- */
    let palette = [];
    try { palette = (JSON.parse(localStorage.getItem(KEY)) || []).filter((h) => hexToRgb(h)).slice(0, MAX); } catch (e) { palette = []; }
    let hsv = rgbToHsv(hexToRgb(palette[0] || '#2F6BFF'));
    let editing = -1; // index of the palette colour being edited, -1 = new colour
    let box = null, lastFocus = null;

    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(palette)); } catch (e) { /* storage blocked */ } };
    const current = () => round(hsvToRgb(hsv));

    /* ---------- Brief field ---------- */
    function syncBrief() {
        const chips = $('#brief-palette');
        const input = $('#brief-colours');
        if (input) input.value = palette.map((h) => { const d = describe(h); return d.hex + ' (' + d.rgb + ' · ' + d.cmyk + ')'; }).join('; ');
        if (chips) {
            chips.innerHTML = palette.length
                ? palette.map((h) => '<span class="pal-chip" style="--c:' + h + '" title="' + h + '"><span data-no-i18n>' + h + '</span></span>').join('')
                : '<span class="pal-empty">' + t('No colours chosen yet') + '</span>';
        }
        $$('[data-colour-count]').forEach((el) => { el.textContent = palette.length ? '(' + palette.length + ')' : ''; });
    }

    /* ---------- Studio ---------- */
    function build() {
        box = document.createElement('div');
        box.className = 'modal form-modal colour-modal';
        box.id = 'colour-modal';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-labelledby', 'cs-title');
        box.setAttribute('aria-hidden', 'true');
        const slider = (id, label, max, cls) => '<label class="cs-slider ' + cls + '"><span class="cs-sl-name">' + label + '</span><input type="range" id="' + id + '" min="0" max="' + max + '" step="1"><input type="number" class="cs-num" data-for="' + id + '" min="0" max="' + max + '" inputmode="numeric" aria-label="' + label + '"></label>';
        box.innerHTML =
            '<div class="modal-backdrop" data-cs-close></div>' +
            '<div class="modal-panel form-panel colour-panel">' +
                '<button class="modal-close" data-cs-close aria-label="Close"><svg><use href="#i-close"/></svg></button>' +
                '<p class="kicker">Colour picker</p>' +
                '<h3 id="cs-title">Choose your colours</h3>' +
                '<p class="cs-intro">Drag to pick a colour, or type exact RGB, CMYK or HEX values. Add up to 6 colours to your palette.</p>' +
                '<div class="cs-grid">' +
                    '<div class="cs-left">' +
                        '<div class="cs-sv" id="cs-sv" tabindex="0" role="slider" aria-label="Saturation and brightness" aria-valuetext=""><span class="cs-thumb" id="cs-thumb"></span></div>' +
                        '<input type="range" class="cs-hue" id="cs-hue" min="0" max="359" step="1" aria-label="Hue">' +
                        '<div class="cs-presets" aria-label="Quick colours">' + PRESETS.map((h) => '<button type="button" class="cs-preset" data-hex="' + h + '" style="--c:' + h + '" aria-label="' + h + '"></button>').join('') +
                            ('EyeDropper' in window ? '<button type="button" class="cs-eyedrop" id="cs-eyedrop" title="Pick a colour from your screen" aria-label="Pick a colour from your screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5l5 5M17 2l5 5-3 3-5-5zM14 7l-9 9-1 4 4-1 9-9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg></button>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="cs-right">' +
                        '<div class="cs-preview" id="cs-preview"><strong id="cs-hex-label" data-no-i18n></strong><span id="cs-codes" data-no-i18n></span></div>' +
                        '<div class="cs-tabs" role="tablist">' +
                            '<button type="button" role="tab" class="cs-tab is-active" data-cs-tab="rgb" aria-selected="true">RGB <small>screens</small></button>' +
                            '<button type="button" role="tab" class="cs-tab" data-cs-tab="cmyk" aria-selected="false">CMYK <small>print</small></button>' +
                        '</div>' +
                        '<div class="cs-pane" data-cs-pane="rgb">' + slider('cs-r', 'R', 255, 'sl-r') + slider('cs-g', 'G', 255, 'sl-g') + slider('cs-b', 'B', 255, 'sl-b') + '</div>' +
                        '<div class="cs-pane" data-cs-pane="cmyk" hidden>' + slider('cs-c', 'C', 100, 'sl-c') + slider('cs-m', 'M', 100, 'sl-m') + slider('cs-y', 'Y', 100, 'sl-y') + slider('cs-k', 'K', 100, 'sl-k') + '</div>' +
                        '<label class="cs-hexrow"><span>HEX</span><input type="text" id="cs-hex" maxlength="7" spellcheck="false" autocomplete="off" data-no-i18n></label>' +
                        '<button type="button" class="btn btn-navy btn-block" id="cs-add"></button>' +
                    '</div>' +
                '</div>' +
                '<div class="cs-palette-wrap">' +
                    '<p class="cs-pal-label">Your palette <small id="cs-pal-count"></small></p>' +
                    '<ul class="cs-palette" id="cs-palette"></ul>' +
                    '<p class="cs-note">CMYK values are converted from RGB. Printed colours vary with the printer and paper, so I\'ll confirm exact print colours with you.</p>' +
                '</div>' +
                '<div class="cs-actions">' +
                    '<button type="button" class="btn btn-sun" id="cs-use"><svg aria-hidden="true"><use href="#i-check"/></svg> Use in my brief</button>' +
                    '<button type="button" class="btn btn-outline" id="cs-copy">Copy colour codes</button>' +
                    '<button type="button" class="btn btn-outline" id="cs-clear">Clear palette</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(box);

        const sv = $('#cs-sv', box);
        function fromPointer(e) {
            const r = sv.getBoundingClientRect();
            hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
            hsv.v = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
            render('sv');
        }
        sv.addEventListener('pointerdown', (e) => { e.preventDefault(); sv.setPointerCapture(e.pointerId); sv.focus({ preventScroll: true }); fromPointer(e); });
        sv.addEventListener('pointermove', (e) => { if (sv.hasPointerCapture(e.pointerId)) fromPointer(e); });
        sv.addEventListener('keydown', (e) => {
            const step = e.shiftKey ? 0.1 : 0.02;
            const map = { ArrowLeft: ['s', -step], ArrowRight: ['s', step], ArrowUp: ['v', step], ArrowDown: ['v', -step] };
            if (!map[e.key]) return;
            e.preventDefault();
            hsv[map[e.key][0]] = clamp(hsv[map[e.key][0]] + map[e.key][1], 0, 1);
            render('sv');
        });
        $('#cs-hue', box).addEventListener('input', (e) => { hsv.h = +e.target.value; render('hue'); });

        const setRgb = (rgb, from) => { hsv = rgbToHsv(rgb); if (!rgb.r && !rgb.g && !rgb.b) hsv.s = hsv.s || 0; render(from); };
        ['r', 'g', 'b'].forEach((ch) => {
            const handler = (e) => {
                const v = clamp(parseInt(e.target.value, 10) || 0, 0, 255);
                const rgb = current(); rgb[ch] = v;
                setRgb(rgb, 'rgb');
            };
            $('#cs-' + ch, box).addEventListener('input', handler);
            $('[data-for="cs-' + ch + '"]', box).addEventListener('change', handler);
        });
        ['c', 'm', 'y', 'k'].forEach((ch) => {
            const handler = (e) => {
                const cm = { c: +$('#cs-c', box).value, m: +$('#cs-m', box).value, y: +$('#cs-y', box).value, k: +$('#cs-k', box).value };
                cm[ch] = clamp(parseInt(e.target.value, 10) || 0, 0, 100);
                setRgb(round(cmykToRgb(cm)), 'cmyk');
                // keep the exact numbers the visitor typed
                Object.keys(cm).forEach((k) => { $('#cs-' + k, box).value = cm[k]; $('[data-for="cs-' + k + '"]', box).value = cm[k]; });
            };
            $('#cs-' + ch, box).addEventListener('input', handler);
            $('[data-for="cs-' + ch + '"]', box).addEventListener('change', handler);
        });
        $('#cs-hex', box).addEventListener('input', (e) => { const rgb = hexToRgb(e.target.value); if (rgb) setRgb(rgb, 'hex'); });
        box.addEventListener('click', (e) => {
            const p = e.target.closest('[data-hex]');
            if (p) { setRgb(hexToRgb(p.dataset.hex), 'preset'); return; }
            const tab = e.target.closest('[data-cs-tab]');
            if (tab) {
                $$('[data-cs-tab]', box).forEach((b) => { const on = b === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
                $$('[data-cs-pane]', box).forEach((p2) => { p2.hidden = p2.dataset.csPane !== tab.dataset.csTab; });
                return;
            }
            const edit = e.target.closest('[data-edit]');
            if (edit) { editing = +edit.dataset.edit; setRgb(hexToRgb(palette[editing]), 'edit'); renderPalette(); return; }
            const rm = e.target.closest('[data-remove]');
            if (rm) { palette.splice(+rm.dataset.remove, 1); editing = -1; save(); renderPalette(); syncBrief(); render(); return; }
            if (e.target.closest('[data-cs-close]')) close();
        });
        $('#cs-add', box).addEventListener('click', () => {
            const hex = rgbToHex(current());
            if (editing >= 0) palette[editing] = hex;
            else if (palette.length < MAX) palette.push(hex);
            editing = -1;
            save(); renderPalette(); syncBrief(); render();
        });
        $('#cs-clear', box).addEventListener('click', () => { palette = []; editing = -1; save(); renderPalette(); syncBrief(); render(); });
        $('#cs-copy', box).addEventListener('click', (e) => {
            const text = palette.map((h) => { const d = describe(h); return d.hex + '  ' + d.rgb + '  ' + d.cmyk; }).join('\n') || describe(rgbToHex(current())).hex;
            const btn = e.currentTarget;
            const done = () => { const l = btn.textContent; btn.textContent = t('Copied!'); setTimeout(() => { btn.textContent = l; }, 1600); };
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {}); else done();
        });
        $('#cs-use', box).addEventListener('click', () => {
            if (!palette.length) { palette.push(rgbToHex(current())); save(); syncBrief(); }
            close(false);
            useInBrief();
        });
        const eye = $('#cs-eyedrop', box);
        if (eye) eye.addEventListener('click', () => { new window.EyeDropper().open().then((r) => setRgb(hexToRgb(r.sRGBHex), 'eye')).catch(() => {}); });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
            if (e.key === 'Tab') {
                const f = $$('button, input, [tabindex="0"]', box).filter((el) => el.offsetParent !== null && !el.disabled);
                if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
            }
        });
    }

    function render(from) {
        if (!box) return;
        const rgb = current();
        const hex = rgbToHex(rgb);
        const cm = rgbToCmyk(rgb);
        const sv = $('#cs-sv', box);
        sv.style.setProperty('--hue', 'hsl(' + hsv.h + ', 100%, 50%)');
        const thumb = $('#cs-thumb', box);
        thumb.style.left = (hsv.s * 100) + '%';
        thumb.style.top = ((1 - hsv.v) * 100) + '%';
        thumb.style.background = hex;
        sv.setAttribute('aria-valuetext', hex);
        if (from !== 'hue') $('#cs-hue', box).value = Math.round(hsv.h);
        const set = (k, v) => { $('#cs-' + k, box).value = v; $('[data-for="cs-' + k + '"]', box).value = v; };
        if (from !== 'rgb') { set('r', rgb.r); set('g', rgb.g); set('b', rgb.b); }
        if (from !== 'cmyk') { set('c', cm.c); set('m', cm.m); set('y', cm.y); set('k', cm.k); }
        if (from !== 'hex') $('#cs-hex', box).value = hex;
        const prev = $('#cs-preview', box);
        prev.style.background = hex;
        prev.style.color = readable(hex);
        $('#cs-hex-label', box).textContent = hex;
        $('#cs-codes', box).textContent = 'RGB ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + '  ·  CMYK ' + cm.c + ', ' + cm.m + ', ' + cm.y + ', ' + cm.k;
        const add = $('#cs-add', box);
        add.disabled = editing < 0 && palette.length >= MAX;
        add.textContent = t(editing >= 0 ? 'Update colour' : palette.length >= MAX ? 'Palette full (6 colours)' : 'Add to palette');
    }

    function renderPalette() {
        const ul = $('#cs-palette', box);
        $('#cs-pal-count', box).textContent = palette.length + ' / ' + MAX;
        ul.innerHTML = palette.length ? palette.map((h, i) => {
            const d = describe(h);
            return '<li class="cs-chip' + (i === editing ? ' is-editing' : '') + '"><button type="button" class="cs-chip-swatch" data-edit="' + i + '" style="--c:' + h + '" aria-label="' + t('Edit colour') + ' ' + h + '"></button>' +
                '<span class="cs-chip-text" data-no-i18n><strong>' + d.hex + '</strong><small>' + d.rgb + '</small><small>' + d.cmyk + '</small></span>' +
                '<button type="button" class="cs-chip-x" data-remove="' + i + '" aria-label="' + t('Remove colour') + ' ' + h + '"><svg><use href="#i-close"/></svg></button></li>';
        }).join('') : '<li class="cs-empty">' + t('No colours yet. Pick one above and press "Add to palette".') + '</li>';
    }

    function open() {
        if (!box) build();
        lastFocus = document.activeElement;
        editing = -1;
        render(); renderPalette();
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        if (window.Site && window.Site.lock) window.Site.lock(); else document.body.classList.add('no-scroll');
        setTimeout(() => $('#cs-sv', box).focus({ preventScroll: true }), 60);
        if (typeof window.track === 'function') window.track('colour-picker-opened');
    }
    function close(restore = true) {
        if (!box || !box.classList.contains('is-open')) return;
        box.classList.remove('is-open');
        box.setAttribute('aria-hidden', 'true');
        if (window.Site && window.Site.unlock) window.Site.unlock(); else document.body.classList.remove('no-scroll');
        if (restore && lastFocus) lastFocus.focus({ preventScroll: true });
    }

    // Take the visitor to the graphic-design part of the brief with their palette in it
    function useInBrief() {
        const brief = $('#brief');
        const graphic = $('#brief-form input[name="Service type"][value="Graphic Design"]');
        if (graphic && !graphic.checked) graphic.click();
        if (brief) setTimeout(() => {
            const target = $('#brief-palette') && $('#brief-palette').offsetParent ? $('#brief-palette').closest('.q') : brief;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, graphic && !graphic.checked ? 0 : 350);
        if (typeof window.track === 'function') window.track('colour-palette-used');
    }

    document.addEventListener('click', (e) => { if (e.target.closest('[data-colour-open]')) { e.preventDefault(); open(); } });
    document.addEventListener('langchange', () => { syncBrief(); if (box && box.classList.contains('is-open')) { render(); renderPalette(); } });
    const form = $('#brief-form');
    if (form) form.addEventListener('reset', () => { palette = []; save(); syncBrief(); });
    syncBrief();
})();
