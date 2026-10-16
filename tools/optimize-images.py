#!/usr/bin/env python3
"""Keeps newly uploaded project photos light so pages load fast.

For each JPG passed on the command line (the GitHub automation passes the
photos added or changed in the latest upload, so older photos are never
touched), inside images/engineering or images/graphic:
  - photos wider than 1600 px, or heavier than 450 KB, are resized to
    1200 px wide (quality 78), turned the right way up, and stripped of
    hidden camera data (GPS location etc.)
  - a smaller "-800" copy is made for thumbnails if it doesn't exist yet

Safe to run again and again: finished photos are left alone.
Run: python3 tools/optimize-images.py images/engineering/x/photo.jpg ...
(needs: pip install pillow)
"""
import os
import sys
from PIL import Image, ImageOps
try:  # iPhone photos (HEIC), if pillow-heif is installed
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FOLDERS = ['images/engineering', 'images/graphic', 'images/blog', 'images/works']  # only photos in these folders
EXTS = ('.jpg', '.jpeg')
MAX_W, FULL_W, THUMB_W, MAX_BYTES, QUALITY = 1600, 1200, 800, 450 * 1024, 78

def save(im, path):
    if im.mode in ('RGBA', 'LA', 'P'):  # transparent PNGs: white background instead of black
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    im.convert('RGB').save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)

changed = 0
for arg in sys.argv[1:]:
    path = os.path.join(ROOT, arg)
    rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
    dirpath, f = os.path.split(path)
    base, ext = os.path.splitext(f)
    if not os.path.isfile(path) or ext.lower() not in EXTS or not any(rel.startswith(d + '/') for d in FOLDERS):
        continue
    if base.endswith('-800') or base.endswith('-1200'):
        continue
    try:
        im = Image.open(path)
        im.load()
    except Exception as e:  # not a real image: leave it
        print('skip', rel, e)
        continue
    # Photos from Google Drive are saved as .jpg whatever their real format (PNG, WEBP, HEIC...)
    if im.width > MAX_W or os.path.getsize(path) > MAX_BYTES or im.format != 'JPEG':
        im = ImageOps.exif_transpose(im)
        if im.width > FULL_W:
            im = im.resize((FULL_W, round(im.height * FULL_W / im.width)), Image.LANCZOS)
        save(im, path)
        print('resized', rel, im.size)
        changed += 1
    thumb = os.path.join(dirpath, base + '-800' + ext)
    if not os.path.exists(thumb) and im.width > THUMB_W:
        t = ImageOps.exif_transpose(im)
        t = t.resize((THUMB_W, round(t.height * THUMB_W / t.width)), Image.LANCZOS)
        save(t, thumb)
        print('thumbnail', os.path.relpath(thumb, ROOT))
        changed += 1
print('done:', changed, 'file(s) updated')
sys.exit(0)
