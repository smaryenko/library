// Preview art for "Harbor City" — consumed by tools/build-previews.js (node
// only; not loaded by the book page). The book itself is a live three.js
// scene, so this is a hand-built vector of the same pop-up diorama: an open
// book with the harbour printed on its pages and the city standing up from
// them — cruise ship, container crane, old town, skyline, control tower, red
// double-decker, fire truck, digger — with the sun, gulls and a climbing jet
// floating above the open top, like the book's transparent sky.
//
// One scene is drawn in the 1200 × 630 og frame; the cover reuses it through
// a 4:3 viewBox, without the title.
module.exports = (h) => {
  const R = h.rand(2026);
  const f = n => n.toFixed(1);

  const defs = `
  <defs>
    <linearGradient id="hcSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bcd8ea"/><stop offset=".55" stop-color="#e4eef2"/><stop offset="1" stop-color="#f4ecdc"/>
    </linearGradient>
    <radialGradient id="hcSun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff8dc"/><stop offset=".35" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hcSea" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2f6f84"/><stop offset=".6" stop-color="#1d4f66"/><stop offset="1" stop-color="#143c52"/>
    </linearGradient>
    <linearGradient id="hcGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#93ae66"/><stop offset="1" stop-color="#7a9a4e"/>
    </linearGradient>
    <linearGradient id="hcSpine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hcGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9cc0d8"/><stop offset=".45" stop-color="#4f7d9e"/><stop offset="1" stop-color="#2c4f6a"/>
    </linearGradient>
    <linearGradient id="hcGlassSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3d6584"/><stop offset="1" stop-color="#1f3a50"/>
    </linearGradient>
    <linearGradient id="hcConc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9c5bc"/><stop offset=".4" stop-color="#eeece6"/><stop offset="1" stop-color="#b4b0a6"/>
    </linearGradient>
    <linearGradient id="hcRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0352c"/><stop offset="1" stop-color="#9c1414"/>
    </linearGradient>
    <linearGradient id="hcYel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6c638"/><stop offset="1" stop-color="#c8900c"/>
    </linearGradient>
    <linearGradient id="hcNavy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a3d63"/><stop offset="1" stop-color="#141f38"/>
    </linearGradient>
    <linearGradient id="hcCrane" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a7cb6"/><stop offset="1" stop-color="#22598c"/>
    </linearGradient>
    <pattern id="hcWin" width="11" height="13" patternUnits="userSpaceOnUse">
      <rect x="2.5" y="2.5" width="6" height="7.5" fill="#2b3f52"/><rect x="2.5" y="2.5" width="6" height="2.5" fill="#7c9bb4"/>
    </pattern>
    <pattern id="hcMull" width="9" height="16" patternUnits="userSpaceOnUse">
      <rect width="1.2" height="16" fill="#d9e6ee" opacity=".55"/><rect width="9" height="1.2" fill="#1c3346" opacity=".5"/>
    </pattern>
    <pattern id="hcBalc" width="7" height="12" patternUnits="userSpaceOnUse">
      <rect width="7" height="12" fill="#f4f3ef"/><rect y="3" width="7" height="5" fill="#2d3e50"/><rect y="3" width="7" height="1.3" fill="#8aa3b6"/><rect width=".9" height="12" fill="#dcdcd6"/>
    </pattern>
    <pattern id="hcBrick" width="8" height="5" patternUnits="userSpaceOnUse">
      <rect width="8" height="5" fill="#b4573c"/><path d="M0 4.6h8M4 0v2.3M0 2.3h8M0 2.3v2.3" stroke="#8e3f2a" stroke-width=".7"/>
    </pattern>
    <filter id="hcSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`;

  // ---- helpers ---------------------------------------------------------
  const shadow = (cx, cy, rx, ry, o = 0.2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}" filter="url(#hcSoft)"/>`;
  // a box seen slightly from the right/above: front face, side face, roof
  const block = (x, base, w, hh, d, front, side, roof, overlay = '') => {
    const t = base - hh, dx = d * 0.7, dy = d * 0.45;
    return `<path d="M${x + w} ${base}l${dx} ${-dy}v${-hh}l${-dx} ${dy}z" fill="${side}"/>
      <path d="M${x} ${t}l${dx} ${-dy}h${w}l${-dx} ${dy}z" fill="${roof}"/>
      <rect x="${x}" y="${t}" width="${w}" height="${hh}" fill="${front}"/>${overlay ? `<rect x="${x}" y="${t}" width="${w}" height="${hh}" fill="${overlay}"/>` : ''}`;
  };
  const tower = (x, base, w, hh, kind) => {
    const glass = kind === 'glass';
    let s = block(x, base, w, hh, 18, glass ? 'url(#hcGlass)' : '#e9e3d6', glass ? 'url(#hcGlassSide)' : '#b9b2a3', glass ? '#8aa6ba' : '#d3ccbd', glass ? 'url(#hcMull)' : 'url(#hcWin)');
    // crown: parapet, plant box, sometimes a setback or spire
    s += `<rect x="${x - 1}" y="${base - hh - 3}" width="${w + 2}" height="3" fill="${glass ? '#cdd8de' : '#f4f0e6'}"/>`;
    s += `<rect x="${x + w * 0.25}" y="${base - hh - 10}" width="${w * 0.35}" height="7" fill="#9aa0a4"/>`;
    return s;
  };
  const house = (x, base, w, hh, wall, roof) => {
    const rh = w * 0.45;
    return block(x, base, w, hh, 12, wall, shadeHex(wall, -0.25), shadeHex(wall, -0.1), 'url(#hcWin)') +
      `<path d="M${x - 2} ${base - hh}l${w / 2 + 2} ${-rh}l${w / 2 + 2} ${rh}z" fill="${roof}"/>
       <path d="M${x + w / 2} ${base - hh - rh}l8.4 -5.4l${w / 2 + 2} ${rh}l-8.4 5.4z" fill="${shadeHex(roof, -0.25)}"/>
       <rect x="${x + w * 0.68}" y="${base - hh - rh * 0.85}" width="5" height="${rh * 0.5}" fill="#8e3f2a"/>
       <rect x="${x}" y="${base - 14}" width="${w}" height="14" fill="${shadeHex(wall, -0.35)}"/>
       <rect x="${x + 3}" y="${base - 12}" width="${w - 6}" height="9" fill="#2b3f52"/>
       <rect x="${x}" y="${base - 17}" width="${w}" height="4" fill="${roof}"/>`;
  };
  function shadeHex(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const wheel = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b1b1d"/><circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="#c9ccd0"/><circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="#55595e"/>`;
  const tree = (x, base, s) => `${shadow(x + 6, base, 18 * s, 5 * s, 0.22)}
    <path d="M${x - 2 * s} ${base}l1 ${-22 * s}h${2 * s}l1 ${22 * s}z" fill="#5a4232"/>
    <circle cx="${x - 8 * s}" cy="${base - 30 * s}" r="${13 * s}" fill="#4f7d34"/>
    <circle cx="${x + 8 * s}" cy="${base - 32 * s}" r="${12 * s}" fill="#5d8c3c"/>
    <circle cx="${x}" cy="${base - 42 * s}" r="${14 * s}" fill="#6a9a45"/>
    <circle cx="${x - 4 * s}" cy="${base - 46 * s}" r="${6 * s}" fill="#86b25a" opacity=".8"/>`;

  // ---- sky (floats above the book's open top) --------------------------
  const sky = `
  <rect x="-300" y="-300" width="1800" height="1300" fill="url(#hcSky)"/>
  <circle cx="1065" cy="105" r="120" fill="url(#hcSun)"/>
  <circle cx="1065" cy="105" r="38" fill="#fff6d2"/>
  ${[[860, 92, 1], [960, 250, 0.8], [250, 300, 0.7]].map(([x, y, s]) => `<g fill="#fbf7ee" opacity=".9">
    <ellipse cx="${x}" cy="${y}" rx="${50 * s}" ry="${14 * s}"/><ellipse cx="${x - 22 * s}" cy="${y - 9 * s}" rx="${22 * s}" ry="${14 * s}"/><ellipse cx="${x + 14 * s}" cy="${y - 14 * s}" rx="${26 * s}" ry="${18 * s}"/></g>`).join('')}
  ${[[430, 250, 1], [455, 232, 0.8], [960, 330, 0.9], [990, 315, 0.7]].map(([x, y, s]) =>
    `<path d="M${x - 10 * s} ${y}q${5 * s} ${-6 * s} ${10 * s} 0q${5 * s} ${-6 * s} ${10 * s} 0" fill="none" stroke="#3b4652" stroke-width="${2.2 * s}" stroke-linecap="round"/>`).join('')}
  <!-- jet climbing out, with a faint trail -->
  <path d="M640 300 L860 205" stroke="#ffffff" stroke-width="6" opacity=".55" stroke-linecap="round"/>
  <g transform="translate(905 185) rotate(-22)">
    <path d="M-62 -2 L-48 -30 L-38 -30 L-34 -4 Z" fill="#1f4f9a"/>
    <path d="M-8 2 L-40 34 L-28 34 L16 4 Z" fill="#d9dcdf"/>
    <path d="M-70 -6 Q-70 -11 -60 -11 L48 -11 Q66 -10 74 -2 Q66 6 48 7 L-60 7 Q-70 7 -70 0 Z" fill="#f4f4f1"/>
    <path d="M-66 1 L60 1" stroke="#1f4f9a" stroke-width="2.5"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${-44 + i * 6}" y="-6" width="3" height="3" fill="#1c2530"/>`).join('')}
    <path d="M58 -8 Q66 -7 70 -3 L60 -3 Z" fill="#1c2530"/>
    <path d="M-6 -4 L-34 -28 L-24 -28 L14 -6 Z" fill="#c8cbcf"/>
    <ellipse cx="-4" cy="14" rx="11" ry="5" fill="#b9bdc2"/>
    <path d="M-60 -2 L-74 -16 L-66 -16 L-52 -3 Z" fill="#d9dcdf"/>
  </g>`;

  // ---- the book ---------------------------------------------------------
  const book = `
  ${shadow(600, 612, 600, 26, 0.35)}
  <path d="M38 606 L1162 606 L1152 588 L48 588 Z" fill="#6b2a24"/>
  <path d="M48 588 L1152 588 L1146 600 L54 600 Z" fill="#7e3229"/>
  <path d="M62 588 L1138 588 L1134 596 L66 596 Z" fill="#efe6d2"/>
  ${Array.from({ length: 6 }, (_, i) => `<path d="M64 ${589 + i * 1.2}H1136" stroke="#c9bb9c" stroke-width=".5"/>`).join('')}
  <!-- printed pages: grass everywhere, then sea, quay, roads, runway -->
  <path d="M70 586 L1130 586 L1060 408 L140 408 Z" fill="url(#hcGrass)"/>
  ${Array.from({ length: 260 }, () => { const y = 410 + R() * 175, t = (y - 408) / 178, x0 = 140 - 70 * t, x1 = 1060 + 70 * t, x = x0 + R() * (x1 - x0);
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(6 + R() * 16)}" ry="${f(2 + R() * 4)}" fill="${R() < 0.5 ? '#6f8f45' : '#a3bb72'}" opacity=".45"/>`; }).join('')}
  <path d="M70 586 L372 586 L412 408 L140 408 Z" fill="url(#hcSea)"/>
  ${Array.from({ length: 70 }, () => { const y = 414 + R() * 168, t = (y - 408) / 178, x0 = 148 - 70 * t, x1 = 404 - 34 * t, x = x0 + R() * (x1 - x0);
    return `<path d="M${f(x)} ${f(y)}q5 -2 10 0" stroke="#c9e2ec" stroke-width="1" fill="none" opacity="${f(0.25 + R() * 0.3)}"/>`; }).join('')}
  <path d="M372 586 L438 586 L470 408 L412 408 Z" fill="#c4bdb0"/>
  <path d="M372 586 L378 586 L417 408 L412 408 Z" fill="#e0b31a"/>
  <path d="M438 586 L480 586 L506 408 L470 408 Z" fill="#4b4d50"/>
  <path d="M459 586 L493 408" stroke="#efe9d8" stroke-width="1.6" stroke-dasharray="10 9"/>
  <path d="M482 563 L1121 563 L1113 540 L486 540 Z" fill="#4b4d50"/>
  <path d="M484 551.5 L1117 551.5" stroke="#efe9d8" stroke-width="1.6" stroke-dasharray="14 12"/>
  <path d="M482 566 L1122 566" stroke="#d9d4c8" stroke-width="3"/>
  <path d="M740 432 L1068 432 L1063 418 L745 418 Z" fill="#45474a"/>
  <path d="M748 425 L1065 425" stroke="#f2f0ea" stroke-width="1.4" stroke-dasharray="12 10"/>
  <path d="M590 408 L610 408 L612 586 L588 586 Z" fill="url(#hcSpine)"/>`;

  // ---- pop-ups, back to front ------------------------------------------
  const skyline = [
    [522, 40, 165, 'office'], [568, 46, 232, 'glass'], [620, 54, 290, 'glass'],
    [680, 42, 205, 'office'], [728, 46, 250, 'glass'], [780, 38, 150, 'office']
  ].map(([x, w, hh, k]) => tower(x, 432, w, hh, k)).join('') +
    // the spire on the tallest one
    `<rect x="649" y="96" width="2.5" height="46" fill="#9aa0a4"/>`;
  const tvTower = `
    <path d="M500 432 L506 205 L510 205 L516 432 Z" fill="url(#hcConc)"/>
    <ellipse cx="508" cy="230" rx="20" ry="11" fill="url(#hcGlass)"/>
    <ellipse cx="508" cy="223" rx="20" ry="4" fill="#cfd9df"/>
    <rect x="507" y="150" width="2" height="62" fill="#e7e3da"/>`;
  // control tower: tapered shaft, flared neck, outward-leaning glass, roof
  const ctrl = `
    ${shadow(1022, 446, 26, 5)}
    <ellipse cx="1020" cy="440" rx="20" ry="5" fill="#a7a296"/>
    <path d="M1009 440 L1013 300 L1027 300 L1031 440 Z" fill="url(#hcConc)"/>
    ${[360, 400].map(y => `<path d="M${1009 + (440 - y) * 0.03} ${y}H${1031 - (440 - y) * 0.03}" stroke="#a9a59b" stroke-width="1"/>`).join('')}
    <path d="M1013 300 L1027 300 L1042 286 L998 286 Z" fill="#dcd8cf"/>
    <path d="M996 286 L1044 286 L1040 283 L1000 283 Z" fill="#33383c"/>
    <path d="M1000 283 L1040 283 L1046 263 L994 263 Z" fill="#26384a"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = 1000 + i * 6.66, b = 994 + i * 8.66; return `<path d="M${f(a)} 283 L${f(b)} 263" stroke="#3a4248" stroke-width="1"/>`; }).join('')}
    <path d="M997 270 L1043 270" stroke="#7fa0b8" stroke-width="2" opacity=".6"/>
    <path d="M990 263 L1050 263 L1050 258 L990 258 Z" fill="#2f3337"/>
    <path d="M992 258 L1048 258 L1046 252 L994 252 Z" fill="#f2f0ea"/>
    <rect x="1018" y="244" width="4" height="8" fill="#8c9196"/>
    <rect x="1008" y="241" width="24" height="3" fill="#e9e9e4"/>
    <rect x="999" y="226" width="1.5" height="26" fill="#a0a5aa"/><circle cx="999.7" cy="226" r="2" fill="#ff3b2a"/>`;
  // container crane on the quay, boom out over the water
  const crane = `
    ${shadow(452, 505, 46, 6)}
    <path d="M424 505 L430 318 L436 318 L432 505 Z" fill="url(#hcCrane)"/>
    <path d="M470 498 L474 318 L480 318 L478 498 Z" fill="url(#hcCrane)"/>
    <path d="M428 430 L478 426 M428 380 L478 376" stroke="#2c6aa0" stroke-width="5"/>
    <path d="M430 430 L476 380 M430 380 L476 426" stroke="#2c6aa0" stroke-width="2.5"/>
    <path d="M232 318 L540 318 L540 310 L232 310 Z" fill="#2c6aa0"/>
    <path d="M232 318 L540 318" stroke="#1d4f7c" stroke-width="1.5"/>
    ${Array.from({ length: 18 }, (_, i) => `<path d="M${240 + i * 16} 318 L${248 + i * 16} 310" stroke="#6fa0cc" stroke-width="1.2"/>`).join('')}
    <path d="M440 310 L455 262 L470 310" fill="none" stroke="#2c6aa0" stroke-width="5"/>
    <path d="M455 262 L240 312 M455 262 L536 312" stroke="#d6dde2" stroke-width="1.4"/>
    <rect x="482" y="300" width="30" height="16" fill="#e8ac10"/>
    <rect x="300" y="318" width="22" height="8" fill="#e8ac10"/>
    <path d="M304 326 L304 378 M318 326 L318 378" stroke="#2b2b2b" stroke-width="1.2"/>
    <rect x="290" y="378" width="42" height="5" fill="#e8ac10"/>
    <rect x="292" y="383" width="38" height="16" fill="#2f5e8c"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${294 + i * 4}" y="385" width="1.3" height="12" fill="#244b72"/>`).join('')}
    ${[[436, 498, '#b3392b'], [462, 498, '#3f7f46'], [436, 482, '#c98a1e'], [462, 482, '#d6d3cb'], [449, 466, '#1f4058']].map(([x, y, c]) =>
      `<rect x="${x}" y="${y - 16}" width="26" height="16" fill="${c}"/><path d="M${x + 26} ${y}l7 -4v-16l-7 4z" fill="${shadeHex(c, -0.3)}"/><path d="M${x} ${y - 16}l7 -4h26l-7 4z" fill="${shadeHex(c, 0.15)}"/>` +
      Array.from({ length: 6 }, (_, i) => `<rect x="${x + 2 + i * 4}" y="${y - 14}" width="1.2" height="12" fill="${shadeHex(c, -0.2)}"/>`).join('')).join('')}`;
  // cruise ship alongside the quay
  const decks = [0, 1, 2, 3, 4].map(i => {
    const y = 506 - i * 14, x0 = 118 + i * 9, x1 = 352 - i * 14;
    return `<path d="M${x0} ${y} L${x1} ${y} L${x1 + 6} ${y - 14} L${x0 + 4} ${y - 14} Z" fill="url(#hcBalc)"/>
      <path d="M${x0 + 4} ${y - 14} L${x1 + 6} ${y - 14}" stroke="#ffffff" stroke-width="2"/>`;
  }).join('');
  const ship = `
    ${shadow(250, 552, 170, 10, 0.25)}
    <path d="M96 538 L388 538 L372 556 L112 556 Z" fill="#183247" opacity=".35"/>
    <path d="M92 508 L404 506 Q398 528 380 546 L110 546 Q98 530 92 508 Z" fill="url(#hcNavy)"/>
    <path d="M110 546 L380 546 L376 550 L114 550 Z" fill="#9e2b22"/>
    <path d="M92 508 L404 506" stroke="#f4f3ef" stroke-width="3"/>
    ${Array.from({ length: 40 }, (_, i) => `<circle cx="${112 + i * 7}" cy="520" r="1.1" fill="#e7edf2"/>`).join('')}
    ${decks}
    <path d="M150 436 L312 436 L318 432 L154 432 Z" fill="#f4f3ef"/>
    <path d="M300 444 L336 444 L338 436 L300 436 Z" fill="#f4f3ef"/>
    <path d="M302 441 L336 441" stroke="#1a2630" stroke-width="3"/>
    <path d="M150 432 L178 432 L174 398 L156 398 Z" fill="url(#hcNavy)"/>
    <path d="M156 398 L174 398 L175 404 L155 404 Z" fill="#0d1118"/>
    <rect x="210" y="426" width="34" height="5" fill="#3ea8c9"/>
    <path d="M262 431 q8 -18 16 -10 q6 6 -4 10" fill="none" stroke="#e8641c" stroke-width="3"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${132 + i * 23}" y="${470}" width="15" height="6" rx="3" fill="#f07a1a"/>`).join('')}
    <text x="350" y="530" font-family="Georgia,serif" font-size="9" font-weight="bold" fill="#eae6da">AURORA</text>
    <!-- tug pushing at the bow -->
    ${shadow(395, 578, 30, 4)}
    <path d="M362 566 L418 566 Q414 576 402 578 L370 578 Z" fill="#141516"/>
    <path d="M362 566 L418 566" stroke="#2b2b2b" stroke-width="3"/>
    <rect x="372" y="552" width="28" height="14" fill="#b8261c"/>
    <rect x="380" y="542" width="16" height="10" fill="#f4f2ea"/><rect x="382" y="544" width="12" height="4" fill="#1c2530"/>
    <rect x="374" y="540" width="4" height="12" fill="#1b1b1d"/>`;
  // old town + fire station
  const town = [
    [628, 496, 34, 72, '#d6a851', '#8c3b2a'], [664, 498, 30, 88, '#b45a3e', '#3d4348'],
    [696, 497, 36, 66, '#e2d6b6', '#8c3b2a'], [734, 499, 32, 82, '#6e8f6a', '#3d4348'],
    [768, 498, 34, 70, '#d9c07a', '#a84a30']
  ].map(([x, b, w, hh, wall, roof]) => house(x, b, w, hh, wall, roof)).join('') + `
    ${block(812, 505, 76, 58, 16, 'url(#hcBrick)', '#8a3f2b', '#a14c34')}
    <rect x="812" y="447" width="76" height="4" fill="#e9e2cf"/>
    ${[0, 1, 2].map(i => `<rect x="${817 + i * 24}" y="478" width="19" height="27" fill="#b51d16"/><path d="M${817 + i * 24} ${484}h19M${817 + i * 24} 490h19M${817 + i * 24} 496h19" stroke="#8e1410" stroke-width=".8"/>`).join('')}
    <rect x="826" y="456" width="48" height="10" fill="#a71e16"/>
    <text x="850" y="464" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" font-weight="bold" fill="#fff">FIRE STATION</text>`;
  const trees = [[606, 526, 0.9], [902, 520, 0.85], [952, 528, 0.95], [1080, 522, 0.8], [575, 530, 0.75]].map(a => tree(...a)).join('');
  // street: black cab, red double-decker, fire truck, digger
  const cab = `
    ${shadow(658, 566, 26, 4)}
    <path d="M636 562 L682 562 L682 550 L676 548 L670 538 L646 538 L640 548 L636 550 Z" fill="#141518"/>
    <path d="M648 540 L668 540 L673 548 L643 548 Z" fill="#33485a"/><path d="M658 540v8" stroke="#141518" stroke-width="2"/>
    <rect x="653" y="534" width="10" height="4" fill="#ffc23a"/>
    ${wheel(646, 562, 5)}${wheel(673, 562, 5)}`;
  const bus = `
    ${shadow(752, 566, 58, 5)}
    <rect x="700" y="496" width="106" height="66" rx="7" fill="url(#hcRed)"/>
    <rect x="706" y="502" width="94" height="17" rx="2" fill="#1a2630"/>
    <rect x="706" y="528" width="76" height="17" rx="2" fill="#1a2630"/>
    ${[1, 2, 3, 4].map(i => `<rect x="${704 + i * 19}" y="502" width="2.4" height="17" fill="#b8171b"/>`).join('')}
    ${[1, 2, 3].map(i => `<rect x="${704 + i * 19}" y="528" width="2.4" height="17" fill="#b8171b"/>`).join('')}
    <rect x="700" y="522" width="106" height="3.5" fill="#efe6cf"/>
    <rect x="786" y="528" width="14" height="30" fill="#2a3a48"/>
    <rect x="708" y="504" width="40" height="3" fill="#7d9bb4" opacity=".6"/>
    <rect x="770" y="497" width="26" height="4" fill="#1a1a1a"/><text x="783" y="500.6" text-anchor="middle" font-family="Arial" font-size="3.6" fill="#ffcf3a">12 HARBOUR</text>
    <rect x="802" y="550" width="4" height="4" fill="#fff2c0"/>
    ${wheel(720, 562, 8)}${wheel(785, 562, 8)}`;
  const fireTruck = `
    ${shadow(880, 569, 62, 5)}
    <rect x="828" y="528" width="80" height="34" rx="3" fill="url(#hcRed)"/>
    <path d="M908 562 L936 562 L936 532 Q936 522 926 522 L908 522 Z" fill="url(#hcRed)"/>
    <path d="M913 527 L929 527 Q933 527 933 531 L933 540 L913 540 Z" fill="#1a2630"/>
    ${[0, 1, 2].map(i => `<rect x="${833 + i * 24}" y="533" width="20" height="20" fill="#c9ccd0"/>` + Array.from({ length: 6 }, (_, k) => `<rect x="${833 + i * 24}" y="${535 + k * 3}" width="20" height="0.9" fill="#9aa0a6"/>`).join('')).join('')}
    <rect x="828" y="555" width="108" height="3" fill="#efe6cf"/>
    <rect x="830" y="522" width="86" height="5" fill="#c9ccd0"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${832 + i * 7}" y="519" width="1.6" height="8" fill="#8e9398"/>`).join('')}
    <rect x="828" y="519" width="90" height="2" fill="#a9aeb3"/>
    <rect x="914" y="517" width="18" height="5" rx="2" fill="#2f6bff"/><rect x="923" y="517" width="9" height="5" rx="2" fill="#ff3020"/>
    ${wheel(846, 563, 8)}${wheel(866, 563, 8)}${wheel(922, 563, 8)}`;
  const digger = `
    ${shadow(1040, 574, 52, 5)}
    <rect x="1000" y="556" width="74" height="16" rx="8" fill="#2a2b2d"/>
    ${[0, 1, 2, 3, 4].map(i => `<circle cx="${1009 + i * 14}" cy="564" r="4" fill="#55585c"/>`).join('')}
    <rect x="1006" y="536" width="56" height="20" rx="2" fill="url(#hcYel)"/>
    <rect x="1008" y="512" width="24" height="25" rx="2" fill="url(#hcYel)"/>
    <rect x="1011" y="515" width="18" height="16" fill="#16212b"/>
    <path d="M1056 540 L1092 498 L1100 504 L1066 546 Z" fill="url(#hcYel)"/>
    <path d="M1092 498 L1116 528 L1109 533 L1088 507 Z" fill="url(#hcYel)"/>
    <path d="M1104 530 L1124 536 L1118 552 L1102 546 Z" fill="#3a3b3d"/>
    <path d="M1062 532 L1088 504" stroke="#2a2b2d" stroke-width="3"/><path d="M1070 524 L1086 506" stroke="#d8dde2" stroke-width="1.6"/>
    <rect x="1044" y="531" width="6" height="6" fill="#2a2b2d"/>`;

  const scene = sky + book + skyline + tvTower + ctrl + crane + ship + town + trees + cab + bus + fireTruck + digger;
  const note = `
  <!-- Preview art for "Harbor City" — generated by tools/build-previews.js
       from books/city/preview.js. Original vector of the book's pop-up
       diorama; nothing traced. -->`;
  return {
    cover: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 0 880 660" width="400" height="300">${note}${defs}${scene}</svg>\n`,
    og: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${note}${defs}${scene}
  ${h.title(['Harbor', 'City'], ['#ffe08a', '#ffd54a'], '#0d3047', 60, 130)}
</svg>\n`
  };
};
