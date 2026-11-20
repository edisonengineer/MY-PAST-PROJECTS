#!/usr/bin/env python3
"""Turns a course-structure document (.odt, as written in LibreOffice / Google Docs
"Download as ODT") into content/syllabus.json, which tools/build-pages.js shows as
the full syllabus on each course page (training/<course>.html).

How the document is read (keep this layout when you add courses):
  - bold "<Name> Training Course Structure"           -> a course
  - bold "Session 3 Creating Sketches   4 Hours"        -> a session with its hours
    (also "Sketching (2-4 Hours)" without "Session N")
  - bold line without hours inside a session            -> a topic group heading
  - normal lines                                        -> topics
  - bold "Total Duration of Course: 60 to 76 Hours" or
    "Total Course Duration: 58 Hours"                    -> the course's total
  - bold "Day Training session: 2 Hours"                -> hours per day

Courses already in content/syllabus.json keep their id and card details
(tagline, level, colours); a course in the document replaces its old syllabus.
Run:  python3 tools/import-syllabus.py "Course Structure.odt"
"""
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'content', 'syllabus.json')
T = '{urn:oasis:names:tc:opendocument:xmlns:text:1.0}'
ST = '{urn:oasis:names:tc:opendocument:xmlns:style:1.0}'
FO = '{urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0}'
OFFICE = '{urn:oasis:names:tc:opendocument:xmlns:office:1.0}'

SMALL = {'a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'v/s', 'vs', 'with'}


def tidy(t):
    t = re.sub(r'\s+', ' ', t).strip().strip(':').strip()
    # LINES WRITTEN IN CAPITALS -> Title Case (keeps short acronyms like CAD, FEA, MBD)
    letters = re.sub(r'[^A-Za-z]', '', t)
    if len(letters) > 6 and letters.isupper():
        words = t.lower().split(' ')
        t = ' '.join(w if (i and w in SMALL) else w[:1].upper() + w[1:] for i, w in enumerate(words))
    return t


def hours(h):
    h = re.sub(r'\s*(?:-|–|to)\s*', '–', h.strip(), flags=re.I)
    n = re.match(r'^([\d.]+(?:–[\d.]+)?)', h).group(1)
    return n + (' hour' if n == '1' else ' hours')


def slug(name):
    s = re.sub(r'^autodesk\s+', 'autodesk ', name.strip().lower())
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def parse(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('content.xml'))
    bold = set()
    for s in root.iter(ST + 'style'):
        tp = s.find(ST + 'text-properties')
        if tp is not None and tp.get(FO + 'font-weight') == 'bold':
            bold.add(s.get(ST + 'name'))

    def text(p):
        return re.sub(r'\s+', ' ', ''.join(p.itertext())).strip()

    def is_bold(p):
        if p.get(T + 'style-name') in bold:
            return True
        spans = [c for c in p.iter(T + 'span') if ''.join(c.itertext()).strip()]
        return bool(spans) and all(s.get(T + 'style-name') in bold for s in spans) and not (p.text or '').strip()

    courses, course, session = [], None, None
    for p in root.find('.//' + OFFICE + 'text').iter():
        if p.tag not in (T + 'p', T + 'h'):
            continue
        t = text(p)
        if not t:
            continue
        b = is_bold(p) or p.tag == T + 'h'
        if b and re.search(r'course structure$', t, re.I):
            name = re.sub(r'\s*(training\s+)?course structure$', '', t, flags=re.I).strip()
            course = {'name': name, 'total': '', 'perDay': '', 'sessions': []}
            courses.append(course)
            session = None
            continue
        if course is None:
            continue
        m = re.match(r'^total (?:duration of (?:the )?course|course duration)\s*:?\s*(.+)$', t, re.I)
        if m:
            course['total'] = re.sub(r'\s*hours?$', '', m.group(1).strip(), flags=re.I).replace(' to ', '–') + ' hours'
            continue
        m = re.match(r'^day training session\s*:?\s*(.+)$', t, re.I)
        if m:
            course['perDay'] = hours(m.group(1))
            continue
        if re.match(r'^course info$', t, re.I):
            continue
        m = re.match(r'^(?:session\s*\d+\s*:?\s*)?(.+?)\s*\(?\s*(\d+(?:\.\d+)?(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?)\s*hours?\s*\)?$', t, re.I)
        if b and m:
            session = {'title': tidy(m.group(1)).strip(' –-'), 'hours': hours(m.group(2)), 'groups': []}
            course['sessions'].append(session)
            continue
        if session is None:
            continue
        if b:
            session['groups'].append({'h': tidy(t), 'items': []})
        else:
            if not session['groups'] or session['groups'][-1].get('_loose'):
                if not session['groups']:
                    session['groups'].append({'h': '', 'items': [], '_loose': True})
            session['groups'][-1]['items'].append(tidy(t))

    # A bold "group" with nothing under it is really a topic: fold runs of them into one list
    for c in courses:
        for s in c['sessions']:
            groups = []
            for g in s['groups']:
                g.pop('_loose', None)
                if not g['items'] and g['h']:
                    if groups and not groups[-1]['h']:
                        groups[-1]['items'].append(g['h'])
                    else:
                        groups.append({'h': '', 'items': [g['h']]})
                else:
                    groups.append(g)
            s['groups'] = groups
            s['topics'] = sum(len(g['items']) for g in groups) + sum(1 for g in groups if g['h'])
        if not c['total']:
            lo = sum(float(s['hours'].split()[0].split('–')[0]) for s in c['sessions'])
            hi = sum(float(s['hours'].split()[0].split('–')[-1]) for s in c['sessions'])
            fmt = lambda x: str(int(x)) if x == int(x) else str(x)
            c['total'] = (fmt(lo) if lo == hi else fmt(lo) + '–' + fmt(hi)) + ' hours'
    return courses


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    new = parse(sys.argv[1])
    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {'courses': []}
    by_name = {c['name'].lower(): c for c in old['courses']}
    for c in new:
        prev = by_name.get(c['name'].lower(), {})
        c['id'] = prev.get('id') or slug(c['name'])
        for k in ('card', 'aliases'):
            if k in prev:
                c[k] = prev[k]
        by_name[c['name'].lower()] = c
    out = {'_help': 'Made by tools/import-syllabus.py from your course-structure document. '
                    'Each course page shows its syllabus. "card" holds the tagline, level, colour and icon '
                    'for courses that are not in the Courses tab of the Google Sheet. '
                    '"aliases" are other names the Courses tab may use for the same course.',
           'courses': [{k: c[k] for k in ('id', 'name', 'aliases', 'card', 'total', 'perDay', 'sessions') if k in c} for c in by_name.values()]}
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')
    for c in new:
        print('%-28s %2d sessions, %4d topics, %s' % (c['name'], len(c['sessions']), sum(s['topics'] for s in c['sessions']), c['total']))
    print('wrote', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
