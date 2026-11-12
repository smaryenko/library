// POP-UP CASTLE — real pop-up spreads from photo cut-outs.
//
// A spread is two things (storybook.js `popup` layout):
//   1) page.ground(): the PRINTED ground, flat on the paper (drawn inside the
//      tilted book, so it lies in perspective): meadow, road, harbour water.
//   2) page.build(): the STANDING pieces, each a die-cut photo (white paper
//      rim baked into the image, see README) on its own depth layer, with a
//      cast shadow lying on the page behind it. No background rectangle: the
//      paper and the table show between the pieces, like a real pop-up.
//
// Coordinates: pieces are placed by where they STAND on the ground, (u, v)
// in ground units (u 0..1600 across both pages, v 0 = far edge .. 800 = near
// edge). The scene SVG carries data-floor so the engine maps its rows
// FLOOR..1000 onto the page as seen; toScene() converts (u, v).
(function (root) {
  'use strict';
  const IMG = 'assets/img/';
  // natural sizes of the cut-outs (px), for the aspect ratio
  const SIZE = {
    castle: [900, 683], 'house-hall': [900, 980], 'house-red': [900, 1097],
    'house-narrow': [744, 1131], 'house-corner': [744, 1137], oak: [900, 1130], cog: [845, 934]
  };
  const W = 1600, H = 1000, FLOOR = 520;
  const f = n => Math.round(n * 10) / 10;
  let uidN = 0;

  // ground point -> scene point. The far edge is a little narrower on screen
  // than the near edge, so x is pulled toward the centre with distance.
  function toScene(u, v) {
    const t = v / 800;
    return [800 + (u - 800) * (0.86 + 0.14 * t), FLOOR + t * (H - FLOOR)];
  }

  // One standing piece: cast shadow on the page + the die-cut photo.
  // w = width in scene units; flip mirrors it; lean tilts the shadow.
  function piece(u, part, img, gu, gv, w, o) {
    o = o || {};
    const [iw, ih] = SIZE[img];
    const h = w * ih / iw;
    const [x, y] = toScene(gu, gv);
    const sink = o.sink == null ? 0.02 : o.sink;      // tuck the base into the page
    const top = y - h * (1 - sink), left = x - w / 2;
    const flip = o.flip ? ` transform="translate(${f(2 * x)} 0) scale(-1 1)"` : '';
    const href = IMG + img + '.webp';
    // cast shadow: the silhouette squashed flat onto the ground, falling back
    // and to the right (light from the front-left)
    const shadow = `<g transform="translate(${f(x)} ${f(y)}) skewX(${o.skew || -34}) scale(1 ${o.shadowLen || 0.32}) translate(${f(-x)} ${f(-y)})">` +
      `<image href="${href}" x="${f(left)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" filter="url(#${u}sil)"${flip}/></g>`;
    const contact = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * 0.46)}" ry="${f(Math.max(6, w * 0.035))}" fill="#1e140a" opacity=".32" filter="url(#${u}blur)"/>`;
    return `<g data-part="${part}">${shadow}${contact}` +
      `<image href="${href}" x="${f(left)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" filter="url(#${u}lift)"${flip}/></g>`;
  }

  function defs(u) {
    return `<filter id="${u}sil" x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="matrix" values="0 0 0 0 .1  0 0 0 0 .07  0 0 0 0 .03  0 0 0 .38 0"/>
        <feGaussianBlur stdDeviation="5"/></filter>
      <filter id="${u}lift" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="3" dy="4" stdDeviation="3" flood-color="#1e140a" flood-opacity=".35"/></filter>
      <filter id="${u}blur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>`;
  }

  // --- spread 1: Harbourtown ---------------------------------------------
  // Printed ground: a green hill rising to the castle, a cobbled road winding
  // up from the near edge, the harbour on the right with a stone quay.
  function groundHarbourtown() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gMeadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5f7d3a"/><stop offset=".55" stop-color="#7d9a48"/><stop offset="1" stop-color="#8fae55"/>
    </linearGradient>
    <linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4c8fb0"/><stop offset="1" stop-color="#2f6f93"/>
    </linearGradient>
    <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b7a382"/><stop offset="1" stop-color="#cdb994"/>
    </linearGradient>
    <pattern id="gCob" width="22" height="12" patternUnits="userSpaceOnUse">
      <rect x="1" y="1" width="9" height="4.5" rx="2" fill="#000" fill-opacity=".08"/>
      <rect x="12" y="1.5" width="8" height="4" rx="2" fill="#fff" fill-opacity=".08"/>
      <rect x="6" y="7" width="10" height="4" rx="2" fill="#000" fill-opacity=".06"/>
    </pattern>
    <pattern id="gStone" width="40" height="18" patternUnits="userSpaceOnUse">
      <path d="M0 .6H40M0 9.6H40M.6 0V9M20.6 9V18" stroke="#000" stroke-opacity=".2" fill="none"/>
    </pattern>
    <filter id="gPaint" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .1  0 0 0 0 .16  0 0 0 0 .02  0 0 0 .5 -.12"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="gGrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .08  0 0 0 -1.5 .8"/></filter>
  </defs>
  <rect width="1600" height="800" fill="url(#gMeadow)"/>
  <rect width="1600" height="800" fill="#000" filter="url(#gPaint)"/>
  <!-- the castle's rocky hill, printed darker at the back -->
  <path d="M520 0H1300Q1270 150 1080 200Q900 240 720 190Q560 140 520 0Z" fill="#4f6a33"/>
  <path d="M640 40Q760 110 900 100Q1060 90 1180 30" stroke="#8a8a78" stroke-width="26" fill="none" opacity=".55"/>
  <path d="M700 120Q820 160 960 150" stroke="#7a7868" stroke-width="16" fill="none" opacity=".45"/>
  <!-- harbour water with a stone quay -->
  <path d="M1600 300Q1380 330 1260 430Q1140 540 1150 800H1600Z" fill="url(#gSea)"/>
  <path d="M1600 300Q1380 330 1260 430Q1140 540 1150 800" stroke="#9a9484" stroke-width="30" fill="none"/>
  <path d="M1600 300Q1380 330 1260 430Q1140 540 1150 800" stroke="url(#gStone)" stroke-width="30" fill="none"/>
  ${[...Array(36)].map((_, i) => {
    const x = 1250 + (i * 97) % 340, y = 360 + (i * 53) % 430;
    return `<path d="M${x} ${y}q14 -5 28 0" stroke="#d6ecf4" stroke-width="2.5" fill="none" opacity=".6"/>`;
  }).join('')}
  <!-- the cobbled road winding up to the castle gate -->
  <path d="M640 800Q700 640 640 540Q570 420 700 330Q820 250 880 170L930 175Q900 270 790 350Q690 430 760 540Q830 650 960 800Z" fill="url(#gRoad)"/>
  <path d="M640 800Q700 640 640 540Q570 420 700 330Q820 250 880 170L930 175Q900 270 790 350Q690 430 760 540Q830 650 960 800Z" fill="url(#gCob)"/>
  <!-- a side lane to the houses and to the quay -->
  <path d="M700 330Q520 360 300 420L310 450Q520 400 720 360Z" fill="url(#gRoad)"/>
  <path d="M790 560Q980 520 1180 520L1170 560Q990 560 800 600Z" fill="url(#gRoad)"/>
  <!-- printed hedges, flowers and paths -->
  ${[...Array(70)].map((_, i) => {
    const x = (i * 211) % 1600, y = 260 + (i * 137) % 520;
    if (x > 600 && x < 980 && y > 300) return '';
    if (x > 1140 && y > 320) return '';
    const c = ['#e8c547', '#f4f0e6', '#d9544a', '#c98ad0'][i % 4];
    return `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x + 9}" cy="${y + 4}" r="4" fill="${c}"/>`;
  }).join('')}
  <path d="M0 560Q160 520 300 560" stroke="#4d6a2e" stroke-width="22" stroke-linecap="round" fill="none"/>
  <path d="M1000 300Q1080 270 1150 300" stroke="#4d6a2e" stroke-width="18" stroke-linecap="round" fill="none"/>
  <rect width="1600" height="800" filter="url(#gGrain)" opacity=".35"/>
</svg>`;
  }

  function buildHarbourtownPopup() {
    const u = 'pu' + (++uidN) + 'x';
    // back to front (later = nearer)
    const pieces = [
      piece(u, 'pc-castle', 'castle', 905, 70, 640, { sink: 0.04, shadowLen: 0.22 }),
      piece(u, 'pc-oak-back', 'oak', 1480, 210, 210, { flip: true }),
      piece(u, 'pc-house-red', 'house-red', 480, 300, 190),
      piece(u, 'pc-house-narrow', 'house-narrow', 1110, 300, 130),
      piece(u, 'pc-house-corner', 'house-corner', 560, 470, 175),
      piece(u, 'pc-house-hall', 'house-hall', 290, 480, 300),
      piece(u, 'pc-cog', 'cog', 1360, 640, 330, { sink: 0.07, shadowLen: 0.12 }),
      piece(u, 'pc-oak', 'oak', 110, 700, 300)
    ].join('');
    const anim = typeof root.buildAnim === 'function' ? root.buildAnim(u, { tracks: [
      { parts: 'pc-cog', box: 'fill-box', origin: '50% 92%',
        keyframes: '0%,100%{transform:rotate(0)}20%{transform:rotate(-3deg) translateY(-4px)}45%{transform:rotate(2.5deg)}70%{transform:rotate(-1.5deg) translateY(-2px)}',
        timing: '2.2s ease-in-out' },
      { parts: ['pc-oak', 'pc-oak-back'], box: 'fill-box', origin: '50% 100%',
        keyframes: '0%,100%{transform:skewX(0)}30%{transform:skewX(-2.5deg)}65%{transform:skewX(1.8deg)}',
        timing: '2s ease-in-out' }
    ] }) : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-floor="${FLOOR}">` +
      `<defs>${defs(u)}</defs>${anim}${pieces}</svg>`;
  }

  const B = { buildHarbourtownPopup, groundHarbourtown };
  Object.assign(root, B);
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(typeof window !== 'undefined' ? window : globalThis);
