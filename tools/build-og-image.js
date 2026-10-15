/* Builds og-image.jpg (1200×630), the picture shown when the site link is shared
   on WhatsApp, LinkedIn, Facebook, X, etc.  Run: node tools/build-og-image.js */
const path = require('path');
const fs = require('fs');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');

const ROOT = path.join(__dirname, '..');
const img = (p) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, p)).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">
<style>
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; color: #fff;
  background: radial-gradient(900px 600px at -10% -20%, #4b3fb0 0%, transparent 60%),
              radial-gradient(700px 520px at 105% 110%, #e2573f 0%, transparent 55%),
              radial-gradient(600px 400px at 40% 120%, #13a89e55 0%, transparent 60%), #0e1a3a; position: relative; }
.left { position: absolute; left: 72px; top: 64px; width: 640px; }
.brand { display: flex; align-items: center; gap: 14px; font-weight: 700; letter-spacing: .12em; font-size: 17px; color: #ffb627; }
.mark { width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(135deg, #ffb627, #ff6b4a); color: #0e1a3a; display: grid; place-items: center; font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px; letter-spacing: 0; }
h1 { margin-top: 38px; font-family: 'Fraunces', serif; font-weight: 600; font-size: 84px; line-height: .98; letter-spacing: -.02em; }
h1 em { font-style: italic; color: #ffb627; font-weight: 500; }
.role { margin-top: 20px; font-size: 27px; font-weight: 500; color: #dfe4f5; line-height: 1.3; }
.chips { margin-top: 30px; display: flex; gap: 10px; flex-wrap: wrap; }
.chip { padding: 9px 18px; border-radius: 999px; font-weight: 700; font-size: 18px; }
.foot { position: absolute; left: 72px; bottom: 50px; display: flex; gap: 12px; align-items: center; font-size: 19px; font-weight: 600; color: #c9d0ea; }
.foot b { color: #fff; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #ffb627; }
.right { position: absolute; right: 0; top: 0; width: 470px; height: 630px; }
.shot { position: absolute; border-radius: 22px; overflow: hidden; border: 4px solid rgba(255,255,255,.9); box-shadow: 0 24px 50px rgba(0,0,0,.45); background: #222; }
.shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.s2 img { object-position: 50% 60%; transform: scale(1.5); }
.s1 { width: 320px; height: 205px; right: 40px; top: 345px; transform: rotate(-4deg); }
.s2 { width: 190px; height: 190px; right: 330px; top: 300px; transform: rotate(-8deg); }
.portrait { position: absolute; right: 86px; top: 58px; width: 260px; height: 260px; border-radius: 50%; padding: 7px;
  background: conic-gradient(#ffb627, #ff6b4a, #7c5cff, #13a89e, #ffb627); box-shadow: 0 24px 60px rgba(0,0,0,.45); }
.portrait img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 6px solid #0e1a3a; display: block; }
.badge { position: absolute; right: 52px; top: 250px; padding: 10px 16px; border-radius: 16px; background: #fff; color: #0e1a3a; font-weight: 800; font-size: 16px; line-height: 1.15; box-shadow: 0 12px 30px rgba(0,0,0,.35); }
.badge small { display: block; font-weight: 600; font-size: 13px; color: #5a6385; }
</style></head><body>
<div class="left">
  <div class="brand"><span class="mark">EO</span>NEXUS CAD STUDIO · NAIROBI, KENYA</div>
  <h1>Edison<br><em>Ochieng</em></h1>
  <p class="role">Mechanical Design Engineer<br>&amp; Graphic Designer</p>
  <div class="chips">
    <span class="chip" style="background:#2f6bff">SolidWorks</span>
    <span class="chip" style="background:#ff6b4a">AutoCAD</span>
    <span class="chip" style="background:#13a89e">Inventor</span>
    <span class="chip" style="background:#7c5cff">Fusion 360</span>
  </div>
</div>
<div class="foot"><b>3D CAD</b><span class="dot"></span><b>Simulation</b><span class="dot"></span><b>Drawings</b><span class="dot"></span><b>Training</b><span class="dot"></span><b>Branding</b></div>
<div class="right">
  <div class="shot s2"><img src="${img('images/engineering/coffee-machine/coffee-machine-01-800.jpg')}"></div>
  <div class="shot s1"><img src="${img('images/engineering/designathon/designathon-hub-01.jpg')}"></div>
  <div class="portrait"><img src="${img('images/profile/edison.jpg')}"></div>
  <div class="badge">Autodesk Designathon<small>2025 Honorable Mention</small></div>
</div>
</body></html>`;

(async () => {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ROOT, 'og-image.jpg'), type: 'jpeg', quality: 86 });
    await b.close();
    console.log('wrote og-image.jpg');
})();
