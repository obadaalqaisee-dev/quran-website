#!/usr/bin/env node
// Generates the site's original artwork (no third-party images, so the licence is the project's own):
//   * assets/img/prayer/*.svg   — ten prayer-position diagrams (side or front view, faceless figure)
//   * assets/img/pattern.svg    — tileable eight-point-star (khatam) geometric pattern
//   * assets/img/backdrop.svg   — arch-and-pattern backdrop for the hero and the installed app
//   * assets/icons/*.png        — PWA / favicon icons, rasterised with the test suite's Chromium
//
// Usage: node scripts/generate_artwork.mjs            (needs `npm ci` in tests/ for the PNG icons)
//        node scripts/generate_artwork.mjs --svg-only

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel, data) => { mkdirSync(dirname(join(ROOT, rel)), { recursive: true }); writeFileSync(join(ROOT, rel), data); };

// --------------------------------------------------------------------------- palette
const C = {
  emerald: '#0f5a45', forest: '#0b3a2e', deep: '#082a22', ivory: '#fbf7ec', cream: '#f3ead3',
  gold: '#b8923f', goldSoft: '#d8bd7a', skin: '#0f5a45', garment: '#e9dfc4',
};

// --------------------------------------------------------------------------- prayer diagrams
// A figure is drawn from joints with rounded strokes; the figure faces the qibla (to the right).
const seg = (a, b, w, color = C.emerald) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
const poly = (pts, w, color = C.emerald) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const head = (c, r = 13) => `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${C.emerald}"/>`;
const dot = (p, r = 5) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${C.gold}" stroke="${C.ivory}" stroke-width="2"/>`;
const dashed = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="5 6" stroke-linecap="round"/>`;
const arrowHead = (p, angle) => `<path d="M0,0 L-10,-6 L-10,6 Z" fill="${C.gold}" transform="translate(${p[0]},${p[1]}) rotate(${angle})"/>`;

function frame(title, body, { qibla = true } = {}) {
  const kaaba = qibla
    ? `<g transform="translate(206,18)" aria-hidden="true"><rect width="20" height="20" rx="2" fill="${C.deep}"/><rect y="5" width="20" height="3" fill="${C.gold}"/></g>
       <path d="M176,28 h22" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>${arrowHead([200, 28], 0)}`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" role="img" aria-label="${title}">
<title>${title}</title>
<rect width="240" height="200" rx="18" fill="${C.ivory}"/>
<rect x="18" y="184" width="204" height="8" rx="4" fill="${C.goldSoft}"/>
${kaaba}
${body}
</svg>
`;
}

const standingLegs = [seg([110, 112], [111, 148], 15), seg([111, 148], [110, 180], 14), seg([110, 180], [126, 183], 9)];
const standingBody = [seg([110, 62], [110, 112], 24), seg([110, 50], [110, 60], 9), head([110, 36])];

const POSES = {
  qiyam: {
    title: 'القيام',
    body: [...standingLegs, ...standingBody, poly([[110, 64], [117, 94], [125, 82]], 10), dashed([118, 42], [170, 182]), dot([170, 182], 4)],
  },
  takbir: {
    title: 'تكبيرة الإحرام',
    body: [...standingLegs, ...standingBody, poly([[110, 64], [124, 86], [127, 50]], 10),
      `<rect x="121" y="34" width="11" height="18" rx="5" fill="${C.emerald}"/>`, dashed([140, 40], [140, 64]), dashed([140, 52], [150, 52])],
  },
  qabd: {
    title: 'وضع اليد اليمنى على اليسرى على الصدر',
    body: [
      // front view
      seg([105, 118], [103, 150], 15), seg([103, 150], [102, 180], 14), seg([135, 118], [137, 150], 15), seg([137, 150], [138, 180], 14),
      `<rect x="96" y="58" width="48" height="64" rx="16" fill="${C.emerald}"/>`, seg([120, 46], [120, 58], 9), head([120, 32]),
      poly([[98, 64], [93, 100], [130, 90]], 10, C.forest), // left arm (under)
      poly([[142, 64], [147, 100], [112, 88]], 10, C.emerald), // right arm (over)
      `<ellipse cx="114" cy="88" rx="9" ry="6" fill="${C.goldSoft}" stroke="${C.gold}" stroke-width="2"/>`,
    ],
    qibla: false,
  },
  ruku: {
    title: 'الركوع',
    body: [
      seg([96, 112], [98, 148], 15), seg([98, 148], [98, 180], 14), seg([98, 180], [114, 183], 9),
      seg([100, 112], [148, 110], 24), seg([152, 110], [160, 110], 9), head([172, 110]),
      seg([146, 114], [104, 146], 10), dashed([90, 96], [168, 94]),
    ],
  },
  itidal: {
    title: 'الرفع من الركوع والاعتدال قائمًا',
    body: [...standingLegs, ...standingBody, poly([[110, 64], [113, 98], [115, 126]], 10),
      `<path d="M78,150 v-60" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>${arrowHead([78, 86], -90)}`],
  },
  sujud: {
    title: 'السجود على الأعضاء السبعة',
    body: [
      seg([104, 130], [112, 180], 15), // thigh
      seg([112, 182], [72, 174], 13), // shin on the ground
      seg([72, 166], [78, 184], 9), // foot upright, toes on the ground
      seg([108, 128], [150, 150], 24), // back
      seg([154, 154], [164, 164], 9), head([176, 170], 12),
      poly([[150, 152], [146, 168], [164, 183]], 10), // elbow raised, palm on the ground
      dot([186, 181]), dot([166, 184]), dot([112, 186]), dot([78, 186]),
    ],
  },
  jalsa: {
    title: 'الجلوس بين السجدتين (الافتراش)',
    body: [
      seg([96, 160], [142, 176], 15), seg([142, 178], [92, 180], 13), seg([86, 166], [90, 184], 9),
      seg([98, 158], [100, 102], 24), seg([101, 90], [101, 98], 9), head([102, 76]),
      poly([[100, 106], [110, 136], [134, 166]], 10),
    ],
  },
  tashahhud: {
    title: 'التشهد والإشارة بالسبابة',
    body: [
      seg([96, 160], [142, 176], 15), seg([142, 178], [92, 180], 13), seg([86, 166], [90, 184], 9),
      seg([98, 158], [100, 102], 24), seg([101, 90], [101, 98], 9), head([102, 76]),
      poly([[100, 106], [112, 136], [134, 160]], 10), seg([136, 158], [150, 150], 4),
      dashed([154, 148], [176, 136]), dot([150, 150], 4),
    ],
  },
  tawarruk: {
    title: 'الجلوس للتشهد الأخير (التورك)',
    body: [
      seg([92, 176], [138, 166], 15), seg([140, 168], [104, 182], 13), seg([100, 168], [104, 184], 9),
      seg([118, 186], [150, 186], 9), // left foot coming out under the right shin
      seg([94, 174], [98, 118], 24), seg([99, 106], [99, 114], 9), head([100, 92]),
      poly([[98, 122], [108, 150], [130, 162]], 10), dot([92, 184], 4),
    ],
  },
  tasleem: {
    title: 'التسليم يمينًا ثم شمالًا',
    body: [
      // front view: the person's right is the viewer's left
      `<rect x="92" y="96" width="56" height="70" rx="18" fill="${C.emerald}"/>`,
      `<ellipse cx="120" cy="176" rx="46" ry="10" fill="${C.emerald}"/>`,
      seg([120, 84], [120, 96], 9), head([120, 68], 14),
      `<path d="M92,52 Q70,64 74,92" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>${arrowHead([74, 92], 100)}`,
      `<path d="M148,52 Q170,64 166,92" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>${arrowHead([166, 92], 80)}`,
      `<circle cx="60" cy="58" r="11" fill="${C.gold}"/><text x="60" y="63" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${C.ivory}">1</text>`,
      `<circle cx="180" cy="58" r="11" fill="${C.gold}"/><text x="180" y="63" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${C.ivory}">2</text>`,
    ],
    qibla: false,
  },
};

for (const [id, pose] of Object.entries(POSES)) {
  out(`assets/img/prayer/${id}.svg`, frame(pose.title, pose.body.join('\n'), { qibla: pose.qibla !== false }));
}

// --------------------------------------------------------------------------- geometric pattern
// Eight-point star (two overlapping squares) on a square lattice, with interlacing lines: a classic
// khatam sulaymani grid. One 80×80 tile repeats seamlessly.
function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.76;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
function patternTile(stroke, opacity) {
  return `<g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2">
    <polygon points="${star(40, 40, 22)}"/>
    <rect x="24.4" y="24.4" width="31.2" height="31.2" transform="rotate(45 40 40)"/>
    <rect x="24.4" y="24.4" width="31.2" height="31.2"/>
    <path d="M0,40 H18 M62,40 H80 M40,0 V18 M40,62 V80"/>
    <polygon points="${star(0, 0, 14)}"/><polygon points="${star(80, 0, 14)}"/><polygon points="${star(0, 80, 14)}"/><polygon points="${star(80, 80, 14)}"/>
  </g>`;
}
out('assets/img/pattern.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">${patternTile('#d8bd7a', 0.55)}</svg>\n`);

// --------------------------------------------------------------------------- backdrop (hero / installed app)
const backdrop = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
  <defs>
    <pattern id="khatam" width="80" height="80" patternUnits="userSpaceOnUse">${patternTile('#d8bd7a', 0.22)}</pattern>
    <radialGradient id="glow" cx="50%" cy="38%" r="60%">
      <stop offset="0" stop-color="#1b6b52"/><stop offset="0.55" stop-color="#0b3a2e"/><stop offset="1" stop-color="#062019"/>
    </radialGradient>
    <linearGradient id="archFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f5a45" stop-opacity="0.0"/><stop offset="1" stop-color="#041a14" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <rect width="1600" height="1000" fill="url(#khatam)"/>
  <!-- a pointed (Islamic) arch framing the centre -->
  <path d="M520,1000 V520 C520,330 640,210 800,120 C960,210 1080,330 1080,520 V1000 Z" fill="url(#archFill)" stroke="#d8bd7a" stroke-opacity="0.45" stroke-width="3"/>
  <path d="M560,1000 V530 C560,360 665,250 800,170 C935,250 1040,360 1040,530 V1000" fill="none" stroke="#d8bd7a" stroke-opacity="0.25" stroke-width="2"/>
  <!-- side arcades -->
  <g fill="none" stroke="#d8bd7a" stroke-opacity="0.18" stroke-width="2">
    <path d="M120,1000 V640 C120,540 180,480 250,440 C320,480 380,540 380,640 V1000"/>
    <path d="M1220,1000 V640 C1220,540 1280,480 1350,440 C1420,480 1480,540 1480,640 V1000"/>
  </g>
  <polygon points="${star(800, 340, 46)}" fill="none" stroke="#d8bd7a" stroke-opacity="0.6" stroke-width="2"/>
</svg>
`;
out('assets/img/backdrop.svg', backdrop);

// --------------------------------------------------------------------------- app icon
function iconSvg({ maskable = false } = {}) {
  const inset = maskable ? 0.2 : 0.06; // maskable icons keep content inside the 80 % safe zone
  const s = 512;
  const r = maskable ? 0 : 112;
  const k = (1 - inset * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1b6b52"/><stop offset="1" stop-color="#0b3a2e"/></radialGradient>
  <pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse">${patternTile('#d8bd7a', 0.16)}</pattern></defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#g)"/>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#p)"/>
  <g transform="translate(${s / 2} ${s / 2}) scale(${k}) translate(${-s / 2} ${-s / 2})">
    <polygon points="${star(256, 256, 176)}" fill="none" stroke="#d8bd7a" stroke-width="10"/>
    <!-- an open book (mushaf) on a stand -->
    <path d="M256,206 C214,180 160,176 118,186 V330 C160,320 214,324 256,350 Z" fill="#fbf7ec"/>
    <path d="M256,206 C298,180 352,176 394,186 V330 C352,320 298,324 256,350 Z" fill="#f3ead3"/>
    <path d="M256,206 V350" stroke="#b8923f" stroke-width="6"/>
    <path d="M140,214 C180,206 220,212 244,226 M140,240 C180,232 220,238 244,252 M140,266 C180,258 220,264 244,278 M140,292 C180,284 220,290 244,304" stroke="#0f5a45" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.7"/>
    <path d="M268,226 C292,212 332,206 372,214 M268,252 C292,238 332,232 372,240 M268,278 C292,264 332,258 372,266 M268,304 C292,290 332,284 372,292" stroke="#0f5a45" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.7"/>
    <path d="M196,372 L256,336 L316,372" stroke="#d8bd7a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}
out('assets/img/icon.svg', `${iconSvg()}\n`);

if (process.argv.includes('--svg-only')) process.exit(0);

// --------------------------------------------------------------------------- rasterise icons
const require = createRequire(join(ROOT, 'tests', 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
async function png(svg, size, rel) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`);
  out(rel, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }));
}
await png(iconSvg(), 192, 'assets/icons/icon-192.png');
await png(iconSvg(), 512, 'assets/icons/icon-512.png');
await png(iconSvg({ maskable: true }), 512, 'assets/icons/maskable-512.png');
await png(iconSvg({ maskable: true }), 180, 'assets/icons/apple-touch-icon.png');
await png(iconSvg(), 32, 'assets/icons/favicon-32.png');
await browser.close();
console.log('artwork generated');
