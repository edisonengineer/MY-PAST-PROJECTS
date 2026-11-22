#!/usr/bin/env python3
"""
Fixed-weight ("static") copies of the website's fonts, for the printed CV and cover letter
(cv-tailor/). The website's own fonts are variable fonts (one file for every weight). When
Chrome saves a page with a variable font as PDF, it embeds the letters as "Type 3" drawings
instead of a real font: PDF viewers then draw thin letters (l, I, i, 1, .) unevenly darker,
and some CV-reading software (ATS) struggles with the text. Static fonts are embedded as
normal TrueType fonts, so the PDF looks clean everywhere.

Writes fonts/print/*.woff2 (used by css/cv-tailor.css). Run again only if the fonts change:
    pip install fonttools brotli skia-pathops
    python3 tools/build-print-fonts.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'fonts', 'print')
JOBS = [
    ('plus-jakarta-sans-latin.woff2', 'cv-sans', [400, 600, 700], 'CV Sans'),
    ('fraunces-latin.woff2', 'cv-serif', [600], 'CV Serif'),
]

os.makedirs(OUT, exist_ok=True)
for src, stem, weights, family in JOBS:
    for w in weights:
        font = TTFont(os.path.join(ROOT, 'fonts', src))
        axes = {a.axisTag: a for a in font['fvar'].axes}
        loc = {'wght': w}
        # Other axes (e.g. Fraunces' optical size and softness) are fixed at their defaults
        for tag, a in axes.items():
            if tag != 'wght':
                loc[tag] = a.defaultValue
        static = instancer.instantiateVariableFont(font, loc, overlap=instancer.OverlapMode.REMOVE)
        # A clear, separate family name, so it never mixes with the variable web font
        name = static['name']
        for rec in list(name.names):
            if rec.nameID in (1, 4, 6, 16, 17):
                name.removeNames(nameID=rec.nameID)
        style = {400: 'Regular', 600: 'SemiBold', 700: 'Bold'}[w]
        name.setName(family, 1, 3, 1, 0x409)
        name.setName(family + ' ' + style, 4, 3, 1, 0x409)
        name.setName((family + '-' + style).replace(' ', ''), 6, 3, 1, 0x409)
        static['OS/2'].usWeightClass = w
        static.flavor = 'woff2'
        path = os.path.join(OUT, '%s-%d.woff2' % (stem, w))
        static.save(path)
        print('wrote', os.path.relpath(path, ROOT), os.path.getsize(path), 'bytes')
