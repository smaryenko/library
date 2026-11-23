// Preview art for "My Day" — consumed by tools/build-previews.js (node only;
// not loaded by the book page, though scene.js shows cover.svg as the still
// picture when WebGL is missing). Hand-built vector of the book's little toy
// diorama town on its wooden board: the cutaway dollhouse home (bedroom,
// bathroom, kitchen, stairs), the school with its clock and flag, the
// playground, a school bus on the road, and the boy waving in front. The sky
// runs from dawn on the left to night on the right, like his whole day.
//
// One scene is drawn in the 1200 × 630 og frame; the cover reuses it through
// a 4:3 viewBox, without the title.
module.exports = (h) => {
  const R = h.rand(909);
  const f = n => n.toFixed(1);
  const defs = `
  <defs>
    <linearGradient id="mdSky" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffb98a"/><stop offset=".18" stop-color="#ffd9a8"/><stop offset=".4" stop-color="#a9d6f2"/>
      <stop offset=".66" stop-color="#7f9fd6"/><stop offset=".82" stop-color="#3e4f8c"/><stop offset="1" stop-color="#1b2450"/>
    </linearGradient>
    <linearGradient id="mdSkyV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".7" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/>
    </linearGradient>
    <radialGradient id="mdSun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff6d8"/><stop offset=".3" stop-color="#ffd86a"/><stop offset=".55" stop-color="#ffc060" stop-opacity=".5"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mdMoon" cx=".4" cy=".35" r=".7">
      <stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#e4dcb8"/>
    </radialGradient>
    <linearGradient id="mdDesk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2c08c"/><stop offset="1" stop-color="#b48a56"/>
    </linearGradient>
    <linearGradient id="mdGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fcf6a"/><stop offset="1" stop-color="#6fa646"/>
    </linearGradient>
    <linearGradient id="mdEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9925a"/><stop offset="1" stop-color="#8a5a30"/>
    </linearGradient>
    <linearGradient id="mdWall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff1d6"/><stop offset="1" stop-color="#f0d6a8"/>
    </linearGradient>
    <linearGradient id="mdRoof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d86a48"/><stop offset="1" stop-color="#a8442c"/>
    </linearGradient>
    <linearGradient id="mdSchool" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e8705a"/><stop offset="1" stop-color="#c24e3c"/>
    </linearGradient>
    <linearGradient id="mdYel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd84a"/><stop offset="1" stop-color="#e0a414"/>
    </linearGradient>
    <radialGradient id="mdSkin" cx=".38" cy=".32" r=".75">
      <stop offset="0" stop-color="#ffe0c2"/><stop offset=".6" stop-color="#f2bf94"/><stop offset="1" stop-color="#d89a6c"/>
    </radialGradient>
    <radialGradient id="mdTree" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#a8dc78"/><stop offset=".6" stop-color="#5fa64a"/><stop offset="1" stop-color="#3c7a34"/>
    </radialGradient>
    <radialGradient id="mdLamp" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff2b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
    </radialGradient>
    <filter id="mdBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>`;
  const shadow = (cx, cy, rx, ry, o = 0.28) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2a2010" opacity="${o}" filter="url(#mdBlur)"/>`;
  const hl = (x, y, rx, ry, o = 0.45) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}"/>`;
  // ---- sky, sun, moon, stars, desk ---------------------------------------
  const stars = Array.from({ length: 34 }, () => {
    const x = 880 + R() * 340, y = 10 + R() * 300, r = 0.8 + R() * 2;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${f(0.5 + R() * 0.5)}"/>`;
  }).join('');
  const sky = `
    <rect x="-200" y="-200" width="1600" height="1100" fill="url(#mdSky)"/>
    <rect x="-200" y="-200" width="1600" height="1100" fill="url(#mdSkyV)"/>
    <circle cx="120" cy="470" r="170" fill="url(#mdSun)"/><circle cx="120" cy="470" r="48" fill="#ffdc6a"/>${hl(106, 452, 18, 10, 0.5)}
    ${stars}
    <path d="M1124 56 A38 38 0 1 0 1144 124 A32 32 0 1 1 1124 56 Z" fill="url(#mdMoon)"/>
    <g fill="#fff" opacity=".85">
      <ellipse cx="560" cy="80" rx="60" ry="20"/><ellipse cx="596" cy="66" rx="40" ry="24"/><ellipse cx="530" cy="70" rx="30" ry="18"/>
    </g>
    <g fill="#fff" opacity=".35"><ellipse cx="820" cy="140" rx="50" ry="14"/><ellipse cx="846" cy="130" rx="30" ry="16"/></g>
    <rect x="-200" y="560" width="1600" height="300" fill="url(#mdDesk)"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M-20 ${572 + i * 8} C 400 ${568 + i * 8}, 800 ${578 + i * 8}, 1220 ${570 + i * 8}" fill="none" stroke="#9a7040" stroke-width="1" opacity=".35"/>`).join('')}`;
  // ---- the diorama board ---------------------------------------------------
  const board = `
    ${shadow(760, 598, 450, 14, 0.4)}
    <path d="M360 440 Q360 430 372 430 H1168 Q1180 430 1180 440 L1196 572 Q1197 584 1184 584 H344 Q331 584 332 572 Z" fill="url(#mdGrass)"/>
    <path d="M332 572 Q331 584 344 584 H1184 Q1197 584 1196 572 V598 Q1196 610 1184 610 H344 Q332 610 332 598 Z" fill="url(#mdEdge)"/>
    <path d="M340 586 H1188" stroke="#f0c48a" stroke-width="2" opacity=".6"/>
    <!-- road along the front -->
    <path d="M340 536 H1190 L1194 568 H336 Z" fill="#6b7078"/>
    <path d="M338 536 H1190" stroke="#d8d8d0" stroke-width="3"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${360 + i * 60}" y="550" width="30" height="4" rx="2" fill="#f6f2e0"/>`).join('')}
    <!-- path to the house -->
    <path d="M640 500 L700 500 L712 536 L628 536 Z" fill="#e8d6b0"/>`;
  // ---- cutaway dollhouse ---------------------------------------------------
  const hx = 520, hw = 300, base = 500, fh = 120;  // two floors of 120
  const top = base - fh * 2;
  const lamp = (x, y, r = 46) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#mdLamp)"/>`;
  const house = `
    ${shadow(hx + hw / 2, base + 2, hw / 2 + 20, 8)}
    <!-- side wall thickness (right) -->
    <path d="M${hx + hw} ${base} l26 -14 v${-fh * 2} l-26 14 Z" fill="#d9b886"/>
    <!-- back walls -->
    <rect x="${hx}" y="${top}" width="${hw}" height="${fh * 2}" fill="url(#mdWall)"/>
    <rect x="${hx}" y="${top}" width="150" height="${fh}" fill="#cfe4f4"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${hx + 6 + i * 21}" y="${top}" width="9" height="${fh}" fill="#b8d4ec" opacity=".7"/>`).join('')}
    <rect x="${hx + 150}" y="${top}" width="${hw - 150}" height="${fh}" fill="#e6f3ec"/>
    ${Array.from({ length: 6 }, (_, i) => Array.from({ length: 5 }, (_, j) => `<rect x="${hx + 156 + i * 24}" y="${top + 54 + j * 13}" width="22" height="11" fill="none" stroke="#b9d8c8" stroke-width="1.5"/>`).join('')).join('')}
    <rect x="${hx}" y="${top + fh}" width="${hw - 90}" height="${fh}" fill="#fbe6c0"/>
    <rect x="${hx + hw - 90}" y="${top + fh}" width="90" height="${fh}" fill="#f2dcc8"/>
    <!-- interior walls / floors -->
    <rect x="${hx + 146}" y="${top}" width="8" height="${fh}" fill="#e2c493"/>
    <rect x="${hx + hw - 94}" y="${top + fh}" width="8" height="${fh}" fill="#e2c493"/>
    <rect x="${hx - 6}" y="${top + fh - 6}" width="${hw + 12}" height="12" fill="#c9965c"/>
    <rect x="${hx - 6}" y="${top + fh - 6}" width="${hw + 12}" height="3" fill="#f0c890"/>
    <!-- bedroom: window at dawn, bed with blue blanket, lamp -->
    <rect x="${hx + 20}" y="${top + 16}" width="46" height="40" rx="3" fill="#ffd9a8" stroke="#fff" stroke-width="4"/>
    <path d="M${hx + 43} ${top + 16} v40 M${hx + 20} ${top + 36} h46" stroke="#fff" stroke-width="3"/>
    <rect x="${hx + 18}" y="${top + 70}" width="110" height="30" rx="6" fill="#8a5a34"/>
    <rect x="${hx + 14}" y="${top + 56}" width="12" height="50" rx="4" fill="#8a5a34"/>
    <rect x="${hx + 28}" y="${top + 62}" width="96" height="22" rx="8" fill="#4a8ad0"/>
    <path d="M${hx + 34} ${top + 66} h80" stroke="#8ec0f0" stroke-width="3" stroke-linecap="round"/>
    <rect x="${hx + 28}" y="${top + 58}" width="26" height="14" rx="6" fill="#fff"/>
    <rect x="${hx + 100}" y="${top + 30}" width="4" height="36" fill="#7a5a3a"/><path d="M${hx + 90} ${top + 30} h24 l-6 -16 h-12 Z" fill="#ffd27a"/>
    <!-- bathroom: tub, mirror, toothbrush cup -->
    <rect x="${hx + 176}" y="${top + 66}" width="100" height="36" rx="16" fill="#fff"/>
    <rect x="${hx + 176}" y="${top + 66}" width="100" height="8" rx="4" fill="#d8e6f0"/>
    ${[0, 1, 2, 3].map(i => `<circle cx="${hx + 196 + i * 18}" cy="${top + 62}" r="${7 + (i % 2) * 3}" fill="#fff" opacity=".9"/>`).join('')}
    <rect x="${hx + 186}" y="${top + 102}" width="8" height="10" fill="#d0d8e0"/><rect x="${hx + 258}" y="${top + 102}" width="8" height="10" fill="#d0d8e0"/>
    <ellipse cx="${hx + 254}" cy="${top + 30}" rx="16" ry="20" fill="#cfe8f6" stroke="#e0b060" stroke-width="4"/>
    <path d="M${hx + 248} ${top + 20} l6 14" stroke="#fff" stroke-width="3" opacity=".8"/>
    <!-- kitchen: table, chairs, fridge, bowls -->
    <rect x="${hx + 14}" y="${base - 86}" width="34" height="80" rx="4" fill="#f4f4f0"/><rect x="${hx + 14}" y="${base - 56}" width="34" height="2" fill="#c8c8c0"/>
    <rect x="${hx + 40}" y="${base - 78}" width="3" height="14" rx="1" fill="#a0a0a0"/>
    <rect x="${hx + 70}" y="${base - 52}" width="100" height="8" rx="3" fill="#c9884a"/>
    <rect x="${hx + 78}" y="${base - 44}" width="6" height="44" fill="#a8703a"/><rect x="${hx + 156}" y="${base - 44}" width="6" height="44" fill="#a8703a"/>
    <path d="M${hx + 96} ${base - 52} a10 6 0 0 0 20 0 Z" fill="#e8463a"/><path d="M${hx + 126} ${base - 52} a10 6 0 0 0 20 0 Z" fill="#4a8ad0"/>
    <rect x="${hx + 176}" y="${base - 40}" width="22" height="40" rx="3" fill="#e06a50"/><rect x="${hx + 176}" y="${base - 74}" width="5" height="40" fill="#e06a50"/>
    <path d="M${hx + 120} ${top + fh + 10} v14" stroke="#7a5a3a" stroke-width="2"/><path d="M${hx + 108} ${top + fh + 24} h24 l-4 10 h-16 Z" fill="#ffd27a"/>
    ${lamp(hx + 120, top + fh + 40)}
    <!-- hall with stairs -->
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${hx + hw - 86 + i * 14}" y="${base - 18 - i * 18}" width="${86 - i * 14}" height="18" fill="${i % 2 ? '#c08a52' : '#d29a5e'}"/>`).join('')}
    <!-- outer frame: floor slab and front edges -->
    <rect x="${hx - 8}" y="${base - 4}" width="${hw + 16}" height="12" rx="3" fill="#b88250"/>
    <rect x="${hx - 8}" y="${top}" width="10" height="${fh * 2}" fill="#f4dcae"/>
    <rect x="${hx + hw - 2}" y="${top}" width="10" height="${fh * 2}" fill="#e2c08c"/>
    <!-- roof -->
    <path d="M${hx - 30} ${top + 4} L${hx + hw / 2} ${top - 118} L${hx + hw + 30} ${top + 4} Z" fill="url(#mdRoof)"/>
    <path d="M${hx + hw + 30} ${top + 4} L${hx + hw / 2} ${top - 118} l26 -14 L${hx + hw + 56} ${top - 10} Z" fill="#8a3820"/>
    ${[1, 2, 3, 4].map(i => { const y = top - 118 + i * 24, w = (hw / 2 + 30) * i / 5; return `<path d="M${f(hx + hw / 2 - w)} ${y} H${f(hx + hw / 2 + w)}" stroke="#8a3820" stroke-width="2.4" opacity=".55"/>`; }).join('')}
    <path d="M${hx - 30} ${top + 4} L${hx + hw / 2} ${top - 118}" stroke="#f08a68" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <circle cx="${hx + hw / 2}" cy="${top - 46}" r="18" fill="#ffe9a8" stroke="#fff6e0" stroke-width="4"/><path d="M${hx + hw / 2} ${top - 64} v36 M${hx + hw / 2 - 18} ${top - 46} h36" stroke="#fff6e0" stroke-width="3"/>
    <rect x="${hx + hw - 70}" y="${top - 100}" width="26" height="50" fill="#b85a3e"/><rect x="${hx + hw - 74}" y="${top - 106}" width="34" height="10" rx="2" fill="#8a3820"/>`;
  // ---- school ----------------------------------------------------------------
  const sx = 860, sw = 190, sb = 500, sh = 170;
  const win = (x, y, lit) => `<rect x="${x}" y="${y}" width="26" height="28" rx="3" fill="${lit ? '#ffe08a' : '#9cc8ea'}" stroke="#fff" stroke-width="3"/><path d="M${x + 13} ${y} v28" stroke="#fff" stroke-width="2"/>`;
  const school = `
    ${shadow(sx + sw / 2 + 10, sb + 2, sw / 2 + 20, 8)}
    <path d="M${sx + sw} ${sb} l30 -18 v${-sh} l-30 18 Z" fill="#a33e2e"/>
    <path d="M${sx - 6} ${sb - sh} l30 -18 h${sw + 12} l-30 18 Z" fill="#7a5a4a"/>
    <rect x="${sx}" y="${sb - sh}" width="${sw}" height="${sh}" fill="url(#mdSchool)"/>
    ${Array.from({ length: 10 }, (_, j) => `<path d="M${sx} ${sb - sh + 14 + j * 16} h${sw}" stroke="#a8402e" stroke-width="1" opacity=".35"/>`).join('')}
    <rect x="${sx - 8}" y="${sb - sh - 6}" width="${sw + 16}" height="12" rx="2" fill="#f4efe4"/>
    <path d="M${sx + sw / 2 - 56} ${sb - sh - 6} L${sx + sw / 2} ${sb - sh - 50} L${sx + sw / 2 + 56} ${sb - sh - 6} Z" fill="#f4efe4"/>
    <circle cx="${sx + sw / 2}" cy="${sb - sh - 22}" r="16" fill="#fff" stroke="#3a3a48" stroke-width="3"/>
    <path d="M${sx + sw / 2} ${sb - sh - 32} v10 l7 4" fill="none" stroke="#3a3a48" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="${sx + sw - 20}" y="${sb - sh - 110}" width="4" height="110" fill="#d0d0d0"/>
    <path d="M${sx + sw - 16} ${sb - sh - 108} q20 -6 40 4 q-20 8 -40 14 Z" fill="#4a8ad0"/>
    ${win(sx + 20, sb - sh + 24, 0)}${win(sx + 82, sb - sh + 24, 0)}${win(sx + 144, sb - sh + 24, 1)}
    ${win(sx + 20, sb - sh + 84, 1)}${win(sx + 144, sb - sh + 84, 0)}
    <rect x="${sx + 72}" y="${sb - 70}" width="46" height="70" rx="4" fill="#3f6fb0"/><path d="M${sx + 95} ${sb - 70} v70" stroke="#2c5088" stroke-width="2"/>
    <circle cx="${sx + 88}" cy="${sb - 34}" r="2.4" fill="#ffd84a"/><circle cx="${sx + 102}" cy="${sb - 34}" r="2.4" fill="#ffd84a"/>
    <rect x="${sx + 62}" y="${sb - 6}" width="66" height="6" fill="#d8d0c0"/>`;
  // ---- playground ------------------------------------------------------------
  const play = `
    ${shadow(1130, 524, 60, 6)}
    <!-- swing set -->
    <path d="M1090 524 L1110 410 L1130 524 M1150 524 L1170 410 L1190 524" fill="none" stroke="#e8463a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1104 410 H1176" stroke="#c23028" stroke-width="8" stroke-linecap="round"/>
    <path d="M1128 412 V478 M1152 412 V478" stroke="#6a6a6a" stroke-width="2"/>
    <rect x="1122" y="476" width="36" height="7" rx="3" fill="#ffd84a"/>
    <!-- slide -->
    <path d="M1056 440 L1072 440 L1072 524 M1056 440 L1056 524" fill="none" stroke="#4a8ad0" stroke-width="6" stroke-linecap="round"/>
    ${[0, 1, 2, 3].map(i => `<path d="M1056 ${456 + i * 18} H1072" stroke="#4a8ad0" stroke-width="4"/>`).join('')}
    <path d="M1072 440 C 1050 470, 1030 500, 1004 520 L1012 528 C 1040 506, 1062 478, 1080 446 Z" fill="url(#mdYel)"/>
    <!-- sandbox -->
    <rect x="1000" y="508" width="40" height="18" rx="3" fill="#c9925a"/><rect x="1004" y="508" width="32" height="8" rx="3" fill="#f2dca0"/>`;
  // ---- trees -------------------------------------------------------------------
  const tree = (x, y, r) => `${shadow(x + 6, y + 2, r * 0.8, 5)}<rect x="${x - 5}" y="${y - r * 1.3}" width="10" height="${r * 1.3}" rx="3" fill="#8a5a34"/>
    <circle cx="${x}" cy="${y - r * 1.6}" r="${r}" fill="url(#mdTree)"/>${hl(x - r * 0.35, y - r * 1.95, r * 0.35, r * 0.2, 0.4)}`;
  const trees = tree(400, 520, 34) + tree(470, 510, 26) + tree(836, 512, 20);
  // ---- school bus ---------------------------------------------------------
  const wheel = (x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#22262c"/><circle cx="${x}" cy="${y}" r="5" fill="#b8bcc4"/>`;
  const bus = `
    ${shadow(450, 566, 80, 5)}
    <rect x="370" y="500" width="160" height="58" rx="12" fill="url(#mdYel)"/>
    <rect x="370" y="534" width="160" height="5" fill="#2a2a2a" opacity=".6"/>
    ${[0, 1, 2, 3].map(i => `<rect x="${384 + i * 30}" y="508" width="22" height="20" rx="3" fill="#bfe0f6"/>`).join('')}
    <rect x="504" y="508" width="20" height="26" rx="3" fill="#bfe0f6"/>
    <circle cx="526" cy="546" r="4" fill="#fff6c0"/><rect x="374" y="502" width="150" height="4" rx="2" fill="#fff4b0" opacity=".6"/>
    ${wheel(400, 560)}${wheel(500, 560)}`;
  // ---- the boy, waving (peg-doll toy figure) ----------------------------------
  const bx = 672, by = 556;   // feet
  const boy = `
    ${shadow(bx, by + 2, 34, 5, 0.35)}
    <rect x="${bx - 16}" y="${by - 34}" width="13" height="34" rx="6" fill="#2f4f86"/><rect x="${bx + 3}" y="${by - 34}" width="13" height="34" rx="6" fill="#2f4f86"/>
    <ellipse cx="${bx - 11}" cy="${by - 2}" rx="11" ry="6" fill="#e8463a"/><ellipse cx="${bx + 11}" cy="${by - 2}" rx="11" ry="6" fill="#e8463a"/>
    <rect x="${bx - 22}" y="${by - 52}" width="44" height="26" rx="8" fill="#3a66a8"/>
    <rect x="${bx - 30}" y="${by - 86}" width="12" height="34" rx="6" fill="#3f78c8"/>
    <path d="M${bx - 22} ${by - 50} Q${bx - 26} ${by - 90} ${bx} ${by - 92} Q${bx + 26} ${by - 90} ${bx + 22} ${by - 50} Z" fill="#ffb02e"/>
    <path d="M${bx - 14} ${by - 86} Q${bx - 4} ${by - 90} ${bx - 2} ${by - 70}" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>
    <path d="M${bx + 18} ${by - 84} Q${bx + 40} ${by - 100} ${bx + 42} ${by - 126}" fill="none" stroke="#ffb02e" stroke-width="12" stroke-linecap="round"/>
    <circle cx="${bx + 42}" cy="${by - 130}" r="8" fill="url(#mdSkin)"/>
    <path d="M${bx - 20} ${by - 82} Q${bx - 32} ${by - 66} ${bx - 26} ${by - 56}" fill="none" stroke="#ffb02e" stroke-width="12" stroke-linecap="round"/>
    <circle cx="${bx - 26}" cy="${by - 52}" r="7" fill="url(#mdSkin)"/>
    <circle cx="${bx}" cy="${by - 116}" r="27" fill="url(#mdSkin)"/>
    <path d="M${bx - 27} ${by - 118} Q${bx - 28} ${by - 148} ${bx} ${by - 146} Q${bx + 28} ${by - 148} ${bx + 27} ${by - 120} Q${bx + 14} ${by - 132} ${bx - 6} ${by - 128} Q${bx - 18} ${by - 126} ${bx - 27} ${by - 118} Z" fill="#6a3e1e"/>
    <path d="M${bx - 16} ${by - 140} q10 -6 22 -2" fill="none" stroke="#a06a3a" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <circle cx="${bx - 9}" cy="${by - 114}" r="3.4" fill="#2a1a10"/><circle cx="${bx + 9}" cy="${by - 114}" r="3.4" fill="#2a1a10"/>
    <circle cx="${bx - 8}" cy="${by - 115.4}" r="1.1" fill="#fff"/><circle cx="${bx + 10}" cy="${by - 115.4}" r="1.1" fill="#fff"/>
    <circle cx="${bx - 17}" cy="${by - 104}" r="5" fill="#f08a7a" opacity=".5"/><circle cx="${bx + 17}" cy="${by - 104}" r="5" fill="#f08a7a" opacity=".5"/>
    <path d="M${bx - 8} ${by - 102} Q${bx} ${by - 95} ${bx + 8} ${by - 102}" fill="none" stroke="#a0442a" stroke-width="2.6" stroke-linecap="round"/>
    ${hl(bx - 10, by - 128, 8, 4, 0.35)}`;
  // night windows glow on the right half
  const glow = `${lamp(sx + 157, sb - sh + 38, 34)}${lamp(sx + 33, sb - sh + 98, 34)}`;
  const scene = sky + board + trees + house + school + glow + play + bus + boy;
  const note = `
  <!-- Preview art for "My Day" — generated by tools/build-previews.js from
       books/myday/preview.js. Original vector of the book's toy diorama
       town; nothing traced. -->`;
  return {
    cover: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="322 20 880 660" width="400" height="300">${note}${defs}${scene}</svg>\n`,
    og: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${note}${defs}${scene}
  ${h.title(['My', 'Day'], ['#fff3d6', '#ffd54a'], '#1f3a66', 70, 130)}
</svg>\n`
  };
};
