// HOW A LIGHTHOUSE WORKS: the nine coloured-pencil pictures (viewBox 0..300).
// Each builder makes one finished picture with the kit (assets/js/pencil.js)
// and its own tap motion (svg.is-playing, 2.4 s) that shows the page's fact.
(function () {
'use strict';
const K = window.PENCIL, D = window.DRAWKIT;
const { C, PLAY, tower, gulls, gullCss } = K;
const { f1, smoothPath, straight, circle, ellipse, rect, bbox, blob } = D;
const T = PLAY + 's';

// ---- shared bits -------------------------------------------------------------------
// a dusk / day / night sky over the top of the picture
function sky(P, { top, mid, low, y0 = 22, y1 = 172, edge = C.indigo, pts = null }) {
  const SKY = pts || [[20, y1], [16, 120], [26, 66], [56, 36], [118, y0], [192, y0 + 2], [252, 34], [282, 68], [288, 128], [288, y1]];
  const g = P.lin(P.gname('sky'), 0, y0, 0, y1, [[0, top, 1], [0.55, mid, 0.95], [1, low, 1]]);
  const e = P.lin(P.gname('se'), 0, y0, 0, (y0 + y1) * 0.6, [[0, edge, 0.7], [1, edge, 0]]);
  P.area('pc-sky', SKY, g, 'h4', 1, true);
  P.area('pc-sky', SKY, e, 'h1', 1, true);
}
function clouds(P, list, top = C.cloudT, bottom = C.cloudB) {
  const g = P.lin(P.gname('cl'), 0, 30, 0, 130, [[0, top, 1], [1, bottom, 0.95]]);
  for (const [cx, cy, rx, ry] of list) {
    const pts = blob(cx, cy, rx, ry, P.R, 18, 0.18);
    P.area('pc-sky', pts, g, 'h4', 1, true);
    P.accent('pc-sky', `M${f1(cx - rx * 0.8)} ${f1(cy + ry * 0.7)}Q${cx} ${f1(cy + ry * 1.3)} ${f1(cx + rx * 0.8)} ${f1(cy + ry * 0.6)}`, bottom, 0.7, 0.6);
  }
}
function sea(P, { y0 = 171, y1 = 256, far = C.seaFar, mid = C.seaMid, near = C.seaNear, part = 'pc-sea', violet = true }) {
  const SEA = [[14, y0], [288, y0], [290, (y0 + y1) / 2], [286, y1 - 4], [200, y1], [100, y1 + 2], [20, y1 - 4], [12, (y0 + y1) / 2]];
  P.area(part, SEA, P.lin(P.gname('sea'), 0, y0, 0, y1, [[0, far, 1], [0.25, mid, 1], [1, near, 1]]), 'h4');
  P.area(part, SEA, P.lin(P.gname('st'), 0, y0 + 20, 0, y1, [[0, C.seaT, 0.2], [1, C.seaT, 0.8]]), 'h2');
  if (violet) P.area(part, SEA, P.lin(P.gname('sv'), 0, y0 + 44, 0, y1, [[0, C.violet, 0], [1, C.violet, 0.75]]), 'h1');
  P.accent(part, `M14 ${y0 + 0.2}Q150 ${y0 - 0.6} 288 ${y0}`, C.indigo, 0.4, 0.45);
}
function waves(P, part, n, y0, y1, xMax = 250, skip = null, c = C.seaNear) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const y = y0 + P.R() * (y1 - y0), x = 20 + P.R() * xMax, w = 5 + (y - y0) * 0.12 + P.R() * 4;
    if (skip && skip(x, y)) continue;
    d += `M${f1(x)} ${f1(y)}q${f1(w * 0.5)} ${f1(-1.6 - P.R())} ${f1(w)} 0`;
  }
  P.accent(part, d, c, 0.7, 0.6);
}
function rocks(P, pts, part = 'pc-rocks', { light = C.rockL, dark = C.rockD } = {}) {
  const [x0, y0, x1, y1] = bbox(pts), d = smoothPath(pts, false) + 'Z';
  P.contour(part, smoothPath(pts, false), C.sepia, 0.8);
  P.tone(part, d, bbox(pts), P.lin(P.gname('rk'), x0, y0, x1, y1, [[0, light, 1], [0.55, '#6e5442', 1], [1, dark, 1]]), 'h1');
  P.tone(part, d, bbox(pts), P.lin(P.gname('rv'), x0 + (x1 - x0) * 0.3, 0, x1, 0, [[0, C.rockV, 0.1], [0.6, C.rockV, 0.7], [1, C.rockV, 0.95]]), 'h2');
  let cracks = '';
  for (let i = 0; i < 6; i++) { const x = x0 + 10 + P.R() * (x1 - x0 - 20), y = y0 + 8 + P.R() * (y1 - y0 - 12); cracks += `M${f1(x)} ${f1(y)}q${f1(4 + P.R() * 6)} ${f1(-3 + P.R() * 6)} ${f1(8 + P.R() * 8)} ${f1(-2 + P.R() * 4)}`; }
  P.accent(part, cracks, dark, 0.7, 0.55);
}
function tufts(P, part, list) {
  let d = '';
  for (const [x, y] of list) for (let k = 0; k < 4; k++) d += `M${f1(x + k * 1.4)} ${y}l${f1((P.R() - 0.4) * 2.4)} ${f1(-2.5 - P.R() * 2.5)}`;
  P.accent(part, d, C.grass, 0.6, 0.9);
}
function boat(P, part, x, y, s = 1, c = C.boat) {
  const hull = [[x - 14 * s, y], [x + 14 * s, y], [x + 9 * s, y + 6 * s], [x - 10 * s, y + 6 * s]];
  const sail = [[x, y - 2 * s], [x, y - 27 * s], [x + 12 * s, y - 2 * s]];
  P.contour(part, straight(hull) + straight(sail) + `M${x} ${y}L${x} ${f1(y - 31 * s)}`, C.indigo, 0.55);
  P.area(part, hull, c, 'h1', 0.9);
  P.area(part, sail, '#d9a98a', 'h3', 0.7);
  P.accent(part, `M${f1(x - 16 * s)} ${f1(y + 7.5 * s)}Q${x} ${f1(y + 6.6 * s)} ${f1(x + 16 * s)} ${f1(y + 7.5 * s)}`, C.seaNear, 0.9, 0.6);
}
const ROCKS1 = [[164, 250], [170, 226], [184, 207], [203, 196], [222, 191], [244, 194], [262, 206], [277, 226], [286, 250]];

const S = {};

// 1 the lighthouse at dusk on its rock: the beam sweeps, gulls flap, the boat bobs
S.dusk = function () {
  const P = K.page(11);
  sky(P, { top: C.skyTop, mid: C.skyMid, low: C.skyLow });
  clouds(P, [[150, 50, 44, 6], [56, 70, 30, 5], [258, 112, 26, 4.5], [118, 122, 36, 4]]);
  const g = P.rad('glow', 70, 160, 60, [[0, C.sun, 1], [0.35, C.glow, 0.8], [1, C.glow, 0]]);
  P.tone('pc-sun', straight(circle(70, 160, 60)), [10, 100, 130, 220], g, 'h4');
  P.tone('pc-sun', straight(circle(70, 160, 11)), [58, 148, 82, 172], C.sun, 'h1');
  const CLIFF = [[20, 172], [32, 160], [56, 151], [84, 153], [112, 161], [134, 172]];
  P.contour('pc-cliff', smoothPath(CLIFF, false), C.cliffD, 0.45);
  P.tone('pc-cliff', smoothPath(CLIFF, false) + 'Z', bbox(CLIFF), P.lin('cliff', 0, 150, 0, 172, [[0, C.cliff, 0.95], [1, C.cliffD, 0.9]]), 'h1');
  sea(P, {});
  P.area('pc-sea', [[146, 170], [146, 162], [152, 170]], C.boat, 'h3', 0.8);   // far sail
  let glint = '';
  for (let k = 0; k < 9; k++) { const y = 176 + k * 3.2 + P.R(), w = 16 - k * 1.2 + P.R() * 4, x = 70 - w / 2 + (P.R() - 0.5) * 4; glint += `M${f1(x)} ${f1(y)}l${f1(w)} ${f1((P.R() - 0.5) * 0.6)}`; }
  P.accent('pc-sea', glint, C.sun, 1.1, 0.85);
  waves(P, 'pc-sea', 14, 206, 252, 250, (x, y) => x > 158 && y > 196);
  P.accent('pc-sea', 'M160 251q8 -3 14 -1q6 -4 12 0M276 238q5 2 8 6M164 246q4 -2 8 0', C.foam, 1.3, 0.9);
  P.group('pc-boat', 'bob', () => boat(P, 'pc-boat', 100, 207, 1), 'transform-box:view-box;transform-origin:100px 210px');
  rocks(P, ROCKS1);
  tufts(P, 'pc-rocks', [[176, 214], [182, 208], [204, 197], [242, 196], [252, 200], [262, 207]]);
  // the keeper's cottage, one window lit
  const COT = [[180, 191], [200, 191], [200, 207], [180, 209]], COT_ROOF = [[177, 191], [203, 191], [196, 182], [183, 182]];
  P.contour('pc-tower', straight(COT) + straight(COT_ROOF), C.sepia, 0.55);
  P.area('pc-tower', COT, P.lin('cot', 178, 0, 202, 0, [[0, C.cottage, 0.7], [0.6, '#b9a3a8', 0.9], [1, C.whiteS, 1]]), 'h3');
  P.area('pc-tower', COT_ROOF, C.redD, 'h1', 0.9);
  P.area('pc-tower', rect(184, 195, 190, 201), C.glowWin, 'h1');
  P.area('pc-tower', rect(193, 199, 197, 208), C.iron, 'h3', 0.9);
  const tw = tower(P, { cx: 220, base: 196, top: 96 });
  const [lx, ly] = tw.lamp;
  P.group('pc-beam', 'beam', () => P.area('pc-beam', [[lx, ly - 3], [118, 46], [110, 104], [lx, ly + 4]], P.lin('beam', lx, 0, 110, 0, [[0, C.beam, 0.85], [1, C.beam, 0]]), 'h4'), `transform-box:view-box;transform-origin:${lx}px ${ly}px`);
  gulls(P, 'pc-gulls', [[64, 104, 5.5], [80, 94, 4.5], [150, 66, 6], [168, 116, 4]]);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-sun', 'pc-cliff', 'pc-sea', 'pc-boat', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-gulls'], css: `
    svg.is-playing .${c('beam')}{animation:${c('bm')} ${T} ease-in-out both}
    svg.is-playing .${c('bob')}{animation:${c('bb')} ${T} ease-in-out both}
    @keyframes ${c('bm')}{0%{transform:rotate(0);opacity:1}25%{transform:rotate(14deg)}50%{opacity:0.35}75%{transform:rotate(-10deg);opacity:1}100%{transform:rotate(0);opacity:1}}
    @keyframes ${c('bb')}{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(1px,-1.5px) rotate(-3deg)}50%{transform:translate(2px,0) rotate(2deg)}75%{transform:translate(1px,-1px) rotate(-1.5deg)}}
    ${gullCss(P)}` });
};

// 2 cut-away of the tower: stores, kitchen, bedroom, watch room, the lamp at
// the top; a ship far out past the curve of the sea. Tap: the keeper climbs.
S.cutaway = function () {
  const P = K.page(21);
  sky(P, { top: '#6f86b8', mid: '#c3a8c4', low: '#f4cf9e', y0: 12, y1: 236, pts: [[10, 236], [8, 100], [20, 30], [80, 12], [220, 12], [290, 30], [292, 100], [292, 236]] });
  clouds(P, [[70, 60, 36, 5], [150, 34, 30, 4], [60, 120, 24, 3.5]]);
  // the sea curves away (exaggerated): the far ship sits low behind the bulge
  const curve = []; for (let x = 8; x <= 292; x += 12) curve.push([x, 228 + Math.pow((x - 118) / 120, 2) * 12]);
  const SEA = curve.concat([[292, 292], [8, 292]]);
  P.area('pc-sea', SEA, P.lin('sea', 0, 226, 0, 292, [[0, C.seaFar, 1], [0.3, C.seaMid, 1], [1, C.seaNear, 1]]), 'h4');
  P.area('pc-sea', SEA, P.lin('st', 0, 240, 0, 292, [[0, C.seaT, 0.2], [1, C.seaT, 0.8]]), 'h2');
  P.accent('pc-sea', smoothPath(curve, false), C.indigo, 0.5, 0.55);
  waves(P, 'pc-sea', 12, 244, 288, 140);
  // far ship: hull hidden behind the curve, masts and sails showing
  P.area('pc-boat', [[30, 228], [52, 228], [50, 232], [32, 232]], C.boat, 'h1', 0.8);
  for (const [x, h] of [[36, 22], [46, 18]]) { P.accent('pc-boat', `M${x} 228L${x} ${228 - h}`, C.indigo, 0.5, 0.8); P.area('pc-boat', [[x - 5, 226], [x + 5, 226], [x + 4, 228 - h + 2], [x - 4, 228 - h + 2]], '#e8cfae', 'h3', 0.8); }
  // the sight line from the lamp grazes the sea to the ship's masts
  const cx = 205, base = 272, top = 100, s = (base - top) / 100;
  P.accent('pc-gulls', `M${cx} ${f1(top - 15 * s)}L40 205`, C.lampO, 0.8, 0.8, ' stroke-dasharray="3 3"');
  // the rock and the tower
  rocks(P, [[140, 292], [146, 280], [160, 272], [190, 268], [230, 270], [252, 276], [266, 292]]);
  const tw = tower(P, { cx, base, top, halo: 1.2 });
  // the cut: the front wall is taken away, showing the inside between two walls
  const lx = y => cx - 14 * s + (272 - y) / (272 - top) * (5 * s), rx = y => cx + 14 * s - (272 - y) / (272 - top) * (5 * s), wall = 4;
  const INSIDE = [[lx(270) + wall, 270], [lx(top + 2) + wall, top + 2], [rx(top + 2) - wall, top + 2], [rx(270) - wall, 270]];
  P.area('pc-fx', INSIDE, P.lin('in', cx - 20, 0, cx + 20, 0, [[0, '#f3dcb4', 1], [0.6, '#d9b88a', 1], [1, '#a8845e', 1]]), 'h3');
  P.area('pc-fx', INSIDE, P.lin('ins', 0, top, 0, 270, [[0, '#8a6a4a', 0.2], [1, '#5a4030', 0.45]]), 'h2');
  P.contour('pc-fx', straight(INSIDE), C.sepia, 0.6);
  const FLOORS = [227, 182, 141];
  let fl = '';
  for (const y of FLOORS) fl += `M${f1(lx(y) + wall)} ${y}L${f1(rx(y) - wall)} ${y}`;
  P.accent('pc-fx', fl, C.sepia, 1.6, 0.85);
  // spiral stairs: one flight per floor, zig-zag up the wall
  const levels = [270].concat(FLOORS, [top + 2]);
  let st = '', path = [];
  for (let i = 0; i < levels.length - 1; i++) {
    const yb = levels[i], yt = levels[i + 1], left = i % 2 === 0;
    const xa = left ? lx(yb) + wall + 3 : rx(yb) - wall - 3, xb = left ? rx(yt) - wall - 8 : lx(yt) + wall + 8;
    const n = 7;
    for (let k = 0; k < n; k++) {
      const x0 = xa + (xb - xa) * k / n, x1 = xa + (xb - xa) * (k + 1) / n, y0 = yb - (yb - yt + 4) * k / n, y1 = yb - (yb - yt + 4) * (k + 1) / n;
      st += `M${f1(x0)} ${f1(y0)}L${f1(x0)} ${f1(y1)}L${f1(x1)} ${f1(y1)}`;
    }
    path.push([xa, yb], [xb, yt + 4]);
  }
  P.accent('pc-fx', st, '#6e4a2a', 0.8, 0.85);
  // rooms: oil store (barrels), kitchen (stove), bedroom (bunk), watch room (desk, clock)
  for (const bx of [cx - 10, cx - 3]) { P.area('pc-fx', ellipse(bx, 262, 3.5, 7, 12), '#8a5a32', 'h3', 1); P.accent('pc-fx', `M${bx - 3.5} 259h7M${bx - 3.5} 265h7`, C.sepia, 0.5, 0.7); }
  P.area('pc-fx', rect(cx + 4, 214, cx + 14, 227), C.iron, 'h1', 0.9);
  P.accent('pc-fx', `M${cx + 9} 214L${cx + 9} 188`, C.iron, 1, 0.8);
  P.area('pc-fx', rect(cx + 6, 216, cx + 12, 220), C.lampO, 'h1', 0.9);
  P.area('pc-fx', rect(cx - 13, 172, cx + 2, 176), '#b8433a', 'h1', 0.9);
  P.area('pc-fx', rect(cx - 13, 162, cx + 2, 165), '#b8433a', 'h1', 0.9);
  P.accent('pc-fx', `M${cx - 13} 160L${cx - 13} 182M${cx + 2} 160L${cx + 2} 182`, '#6e4a2a', 0.8, 0.8);
  P.area('pc-fx', rect(cx + 2, 130, cx + 12, 133), '#8a5a32', 'h1', 0.9);
  P.area('pc-fx', circle(cx - 6, 122, 4, 16), '#f4e6c8', 'h1', 1);
  P.accent('pc-fx', `M${cx - 6} 122l0 -3M${cx - 6} 122l2 1`, C.sepia, 0.5, 0.9);
  // the keeper (cap, blue coat), climbing on tap
  const [kx, ky] = path[0];
  P.group('pc-near', 'keeper', () => {
    P.area('pc-near', [[kx - 2.6, ky], [kx + 2.6, ky], [kx + 2.2, ky - 8], [kx - 2.2, ky - 8]], '#2c3f78', 'h3', 1);
    P.area('pc-near', circle(kx, ky - 10.5, 2.4, 12), '#e3b08e', 'h1', 1);
    P.area('pc-near', rect(kx - 2.6, ky - 13.6, kx + 2.6, ky - 12), C.indigo, 'h1', 1);
    P.contour('pc-near', straight([[kx - 2.6, ky], [kx - 2.2, ky - 8], [kx + 2.2, ky - 8], [kx + 2.6, ky]], false), C.indigo, 0.4);
  }, `transform-box:view-box`);
  // halo of the lamp, the lamp room, the label lines
  P.accent('pc-gulls', `M${f1(tw.lamp[0] + 10)} ${f1(tw.lamp[1])}l24 -10`, C.sepia, 0.5, 0.7);
  gulls(P, 'pc-gulls', [[110, 70, 5], [128, 58, 4]]);
  const c = P.cls.bind(P);
  const kf = path.map(([x, y], i) => `${(i / (path.length - 1) * 100).toFixed(1)}%{transform:translate(${f1(x - kx)}px,${f1(y - ky)}px)}`).join('');
  return P.end({ order: ['pc-sky', 'pc-sea', 'pc-boat', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-fx', 'pc-near', 'pc-gulls'], fit: '8 10 284 284', hit: '120 20 170 270', css: `
    svg.is-playing .${c('keeper')}{animation:${c('kc')} ${T} linear both}
    @keyframes ${c('kc')}{${kf}}
    ${gullCss(P)}` });
};

// 3 the big glass lens round a small lamp: tap draws the light rays bending
// through the prisms into one strong beam
S.lens = function () {
  const P = K.page(31);
  // lamp room at night: dark glass panes with diagonal bars, the sea far below
  P.area('pc-sky', rect(10, 10, 290, 290), P.lin('room', 0, 10, 0, 290, [[0, C.night, 1], [0.7, C.nightLow, 1], [1, '#4a3a5a', 1]]), 'h4');
  P.area('pc-sky', rect(10, 10, 290, 290), C.indigo, 'h2', 0.4);
  let bars = '';
  for (let x = -120; x < 300; x += 46) bars += `M${x} 290L${x + 140} 10M${x + 140} 290L${x} 10`;
  P.accent('pc-far', bars, '#11182e', 1.4, 0.7);
  P.accent('pc-far', 'M10 236Q150 230 290 236', C.seaMid, 0.6, 0.5);
  // the lamp: a small flame in a glass chimney
  const L = [92, 150];
  P.area('pc-mid', ellipse(L[0], L[1] + 2, 5, 8, 16), P.rad('flame', L[0], L[1], 9, [[0, '#fffbe0', 1], [0.5, C.lamp, 1], [1, C.lampO, 1]]), 'h1');
  P.contour('pc-mid', straight(rect(L[0] - 7, L[1] - 14, L[0] + 7, L[1] + 14)), C.glassD, 0.4);
  P.area('pc-mid', rect(L[0] - 10, L[1] + 14, L[0] + 10, L[1] + 40), P.lin('stand', L[0] - 10, 0, L[0] + 10, 0, [[0, C.brass, 1], [1, C.brassD, 1]]), 'h3');
  P.rad('lg', L[0], L[1], 40, [[0, C.lamp, 0.8], [1, C.lamp, 0]]);
  P.area('pc-mid', circle(L[0], L[1], 40), 'lg', 'h4', 0.8);
  // the lens in section: a bullseye in the middle, prism rings above and below
  const LX = 146;
  P.area('pc-tower', [[LX - 6, 118], [LX + 4, 124], [LX + 9, 150], [LX + 4, 176], [LX - 6, 182], [LX - 2, 150]], P.lin('glass', LX - 6, 0, LX + 9, 0, [[0, C.glass, 0.9], [1, C.glassD, 0.9]]), 'h3');
  const prisms = [];
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
    const y0 = 150 + sd * (34 + i * 22), y1 = y0 + sd * 18;
    const p = sd < 0 ? [[LX - 4 - i * 2, y0], [LX + 8 - i, y0], [LX - 4 - i * 2, y1]] : [[LX - 4 - i * 2, y0], [LX + 8 - i, y0], [LX - 4 - i * 2, y1]];
    prisms.push([y0, y1]);
    P.area('pc-tower', p, 'glass', 'h3', 0.95);
    P.contour('pc-tower', straight(p), C.glassD, 0.45);
  }
  P.contour('pc-tower', `M${LX - 6} 118L${LX + 4} 124L${LX + 9} 150L${LX + 4} 176L${LX - 6} 182`, C.glassD, 0.5);
  P.area('pc-tower', rect(LX - 10, 50, LX - 6, 250), P.lin('fr', LX - 10, 0, LX - 6, 0, [[0, C.brass, 1], [1, C.brassD, 1]]), 'h3');
  P.area('pc-tower', rect(LX - 14, 44, LX + 12, 52), C.brassD, 'h1', 1);
  P.area('pc-tower', rect(LX - 14, 248, LX + 12, 256), C.brassD, 'h1', 1);
  // rays: lamp -> lens (fanning), lens -> beam (parallel); drawn on tap
  const hits = [150, 124, 176].concat(prisms.map(([a, b]) => (a + b) / 2));
  let fan = '', beam = '';
  for (const y of hits) { fan += `M${L[0]} ${L[1]}L${LX} ${f1(y)}`; beam += `M${LX + 6} ${f1(y)}L288 ${f1(y)}`; }
  P.accent('pc-fx', fan, C.lamp, 0.9, 0.85, ` class="${P.cls('fan')}" pathLength="1"`);
  P.accent('pc-fx', beam, C.lamp, 1.1, 0.9, ` class="${P.cls('ray')}" pathLength="1"`);
  P.group('pc-beam', 'beam', () => P.area('pc-beam', rect(LX + 6, 40, 290, 260), P.lin('bm', LX, 0, 290, 0, [[0, C.beam, 0.55], [1, C.beam, 0.15]]), 'h4'));
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-far', 'pc-mid', 'pc-beam', 'pc-tower', 'pc-fx'], fit: '10 10 280 280', hit: '10 10 280 280', css: `
    .${c('fan')},.${c('ray')}{stroke-dasharray:1 1}
    svg.is-playing .${c('fan')}{animation:${c('dr')} 0.9s ease-out both}
    svg.is-playing .${c('ray')}{animation:${c('dr')} 1.1s ease-out 0.8s both}
    svg.is-playing .${c('beam')}{animation:${c('bg')} ${T} ease-in-out both}
    @keyframes ${c('dr')}{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
    @keyframes ${c('bg')}{0%,35%{opacity:0.15}80%{opacity:1}100%{opacity:1}}` });
};

// 4 a night coast with three lighthouses: tap and each flashes its own code
S.codes = function () {
  const P = K.page(41);
  sky(P, { top: '#141c38', mid: C.night, low: '#3a4a78', y0: 14, y1: 190, edge: '#0a0f22', pts: [[12, 190], [10, 60], [30, 16], [150, 12], [270, 16], [290, 60], [290, 190]] });
  let stars = '';
  for (let i = 0; i < 40; i++) { const x = 20 + P.R() * 260, y = 20 + P.R() * 120; stars += `M${f1(x)} ${f1(y)}l0.6 0.2`; }
  P.accent('pc-sky', stars, '#f4f0d8', 1.2, 0.8);
  // the coast: a long headland, an island, a near cliff
  const COAST = [[10, 192], [40, 176], [70, 170], [96, 178], [120, 174], [150, 182], [176, 186], [200, 188], [290, 190]];
  P.area('pc-far', COAST.concat([[290, 196], [10, 196]]), P.lin('coast', 0, 168, 0, 196, [[0, '#4a4a6e', 1], [1, '#2a2a48', 1]]), 'h1');
  sea(P, { y0: 190, y1: 290, far: '#3a4a78', mid: '#22305a', near: '#121a36', violet: false });
  const NEAR = [[200, 290], [210, 250], [226, 226], [250, 214], [276, 212], [292, 220], [292, 290]];
  rocks(P, NEAR, 'pc-rocks', { light: '#5a4a5e', dark: '#1a1420' });
  // three towers: far small, middle, near tall; their lamps flash on tap
  const A = tower(P, { cx: 58, base: 172, top: 150, far: true, halo: 1.6, haloCls: 'fa', lit: 1 });
  const B = tower(P, { cx: 160, base: 184, top: 154, far: true, halo: 1.5, haloCls: 'fb', lit: 1 });
  const Cn = tower(P, { cx: 250, base: 214, top: 150, halo: 1.3, haloCls: 'fc', lit: 1 });
  waves(P, 'pc-sea', 14, 210, 286, 180, null, '#4a6aa0');
  // little reflections under each light
  for (const t of [A, B, Cn]) P.accent('pc-sea', `M${f1(t.lamp[0] - 5)} ${f1(Math.max(196, t.body[0][1] + 6))}l10 0M${f1(t.lamp[0] - 3)} ${f1(Math.max(200, t.body[0][1] + 10))}l6 0`, C.lamp, 1, 0.6);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-far', 'pc-sea', 'pc-rocks', 'pc-beam', 'pc-tower'], fit: '10 12 282 280', hit: '10 10 280 280', css: `
    svg.is-playing .${c('fa')}{animation:${c('a')} 0.8s linear 3 both}
    svg.is-playing .${c('fb')}{animation:${c('b')} 1.2s linear 2 both}
    svg.is-playing .${c('fc')}{animation:${c('c')} 2.4s linear 1 both}
    @keyframes ${c('a')}{0%,100%{opacity:0.25}10%,30%{opacity:1}}
    @keyframes ${c('b')}{0%,100%{opacity:0.25}8%,18%{opacity:1}22%,28%{opacity:0.25}32%,42%{opacity:1}46%{opacity:0.25}}
    @keyframes ${c('c')}{0%,100%{opacity:0.25}4%,34%{opacity:1}38%,50%{opacity:0.25}54%,62%{opacity:1}66%{opacity:0.25}}` });
};

// 5 the rock at high tide; tap: the tide goes out, rocks, weed and pools appear, then it comes back
S.tides = function () {
  const P = K.page(51);
  sky(P, { top: '#4a6aa6', mid: '#9aa6cf', low: '#e6c8b0', y1: 150 });
  P.tone('pc-sun', straight(circle(70, 62, 13)), [56, 48, 84, 76], P.rad('moon', 66, 58, 14, [[0, '#fffbe6', 1], [1, '#d9d2b4', 1]]), 'h1');
  P.accent('pc-sun', 'M64 58l2 1M74 66l1.5 0.5M70 54l1 0', '#b8ae8a', 1, 0.7);
  P.tone('pc-sun', straight(circle(70, 62, 30)), [40, 32, 100, 92], P.rad('mh', 70, 62, 30, [[0, '#fff6d8', 0.6], [1, '#fff6d8', 0]]), 'h4');
  // low-tide things (behind the water): weed-covered rocks, a pool, a crab
  const LOW = [[60, 262], [84, 236], [120, 226], [160, 222], [200, 226], [236, 236], [262, 262]];
  rocks(P, LOW, 'pc-far', { light: '#8a7a5e', dark: '#3a3024' });
  let weed = '';
  for (let i = 0; i < 26; i++) { const x = 80 + P.R() * 170, y = 228 + P.R() * 24; weed += `M${f1(x)} ${f1(y)}q${f1(2 - P.R() * 4)} 4 ${f1(1 - P.R() * 2)} 7`; }
  P.accent('pc-far', weed, C.weed, 1.2, 0.85);
  P.area('pc-far', ellipse(110, 246, 14, 4, 20), P.lin('pool', 96, 0, 124, 0, [[0, C.glass, 1], [1, C.seaMid, 1]]), 'h4');
  P.area('pc-far', ellipse(196, 248, 5, 3, 12), '#d05a3a', 'h1');
  P.accent('pc-far', 'M191 247l-3 -2M201 247l3 -2M192 250l-3 2M200 250l3 2', '#a03a22', 0.6, 0.9);
  // the water: high tide; it drops on tap
  P.group('pc-sea', 'tide', () => sea(P, { y0: 216, y1: 292 }));
  // the tower's rock (above the high-water line) and the tower
  rocks(P, [[150, 222], [158, 204], [176, 194], [200, 192], [218, 200], [226, 222]]);
  P.accent('pc-rocks', 'M152 214q30 -3 72 0', C.weed, 1.4, 0.6);   // the dark band the water leaves
  tower(P, { cx: 188, base: 194, top: 92, lit: 0.6, halo: 0.6 });
  gulls(P, 'pc-gulls', [[230, 90, 5], [246, 104, 4]]);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-sun', 'pc-far', 'pc-sea', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-gulls'], fit: '10 14 282 280', css: `
    .${c('tide')}{transform-box:view-box}
    svg.is-playing .${c('tide')}{animation:${c('td')} ${T} ease-in-out both}
    @keyframes ${c('td')}{0%,100%{transform:translateY(0)}40%,62%{transform:translateY(40px)}}
    ${gullCss(P)}` });
};

// 6 waves rolling in to the rocks; tap: a wave rolls in, grows tall and breaks
S.waves = function () {
  const P = K.page(61);
  sky(P, { top: '#6f8ec4', mid: '#b7c6dc', low: '#eef0e6', y1: 160 });
  clouds(P, [[90, 50, 40, 6], [220, 70, 34, 5], [150, 110, 28, 4]], '#ffffff', '#a8b4cc');
  sea(P, { y0: 160, y1: 292, far: '#8fb0c8', mid: '#3a7aa0', near: '#1a4a6a', violet: false });
  waves(P, 'pc-sea', 18, 170, 230, 250, null, '#2a5a80');
  // the big wave, in profile: deep at the base, see-through green under the crest
  const WAVE = [[10, 262], [40, 250], [70, 232], [96, 206], [114, 190], [130, 186], [142, 192], [146, 202], [138, 206], [132, 200], [124, 204], [120, 224], [128, 248], [150, 262]];
  P.group('pc-mid', 'wave', () => {
    P.area('pc-mid', WAVE, P.lin('wv', 0, 186, 0, 262, [[0, '#7ac8c0', 1], [0.45, '#2e8aa0', 1], [1, '#16466a', 1]]), 'h1', 1, true);
    P.area('pc-mid', WAVE, P.lin('wl', 60, 0, 150, 0, [[0, '#9adfd0', 0], [1, '#c8f0e6', 0.7]]), 'h3', 1, true);
    P.accent('pc-mid', smoothPath([[96, 206], [114, 190], [130, 186], [142, 192], [146, 202]], false), '#ffffff', 2.2, 0.9);
    P.accent('pc-mid', 'M120 196q6 -4 12 -2M104 204q4 -3 8 -3M136 190q4 1 6 4', '#ffffff', 1.1, 0.85);
    P.contour('pc-mid', smoothPath(WAVE.slice(0, 10), false), C.indigo, 0.5);
  }, 'transform-box:view-box;transform-origin:120px 262px');
  // foam that bursts on the rocks (shown on tap)
  P.group('pc-fx', 'foam', () => {
    let d = '';
    for (let i = 0; i < 16; i++) { const a = -0.3 - P.R() * 2.5, r = 8 + P.R() * 20; d += `M${f1(212 + Math.cos(a) * r * 0.4)} ${f1(214 + Math.sin(a) * r * 0.3)}l${f1(Math.cos(a) * r * 0.5)} ${f1(Math.sin(a) * r * 0.6)}`; }
    P.accent('pc-fx', d, '#ffffff', 1.6, 0.95);
    for (const [x, y, r] of [[200, 200, 6], [214, 192, 8], [228, 198, 6], [242, 206, 5]]) P.area('pc-fx', blob(x, y, r, r * 0.8, P.R, 12, 0.2), '#f4fbff', 'h4', 0.95, true);
  }, 'transform-box:view-box;transform-origin:214px 216px');
  rocks(P, [[180, 292], [184, 252], [196, 228], [216, 214], [246, 212], [270, 222], [290, 246], [292, 292]]);
  P.accent('pc-rocks', 'M184 260q8 -4 16 -2M196 240q10 -6 20 -4', C.foam, 1.3, 0.8);
  tower(P, { cx: 254, base: 214, top: 150, lit: 0.6, halo: 0.6 });
  gulls(P, 'pc-gulls', [[60, 100, 5], [76, 92, 4], [180, 60, 5]]);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-sea', 'pc-mid', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-fx', 'pc-gulls'], fit: '8 20 284 272', css: `
    .${c('foam')}{opacity:0}
    svg.is-playing .${c('wave')}{animation:${c('wr')} ${T} cubic-bezier(.45,0,.6,1) both}
    svg.is-playing .${c('foam')}{animation:${c('fm')} ${T} ease-out both}
    @keyframes ${c('wr')}{0%{transform:translateX(-70px) scale(0.75,0.55)}55%{transform:translateX(10px) scale(1,1.1)}72%{transform:translateX(40px) scale(1.05,1.2) skewX(-14deg)}86%{transform:translateX(58px) scale(1,0.5);opacity:1}100%{transform:translateX(64px) scale(1,0.3);opacity:0}}
    @keyframes ${c('fm')}{0%,68%{opacity:0;transform:scale(0.3)}80%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.3) translateY(-6px)}}
    ${gullCss(P)}` });
};

// 7 fog: the light is hard to see, the foghorn sounds; tap: rings of sound spread out
S.fog = function () {
  const P = K.page(71);
  P.area('pc-sky', rect(10, 14, 290, 292), P.lin('fogsky', 0, 14, 0, 292, [[0, '#c7ccd6', 1], [0.6, C.fog, 1], [1, '#b4bcc8', 1]]), 'h4');
  P.area('pc-sky', rect(10, 14, 290, 292), C.fogD, 'h2', 0.35);
  sea(P, { y0: 200, y1: 292, far: '#c3c9d2', mid: '#8a9aac', near: '#5a6a80', violet: false });
  // a ship, dim in the fog
  P.area('pc-boat', [[40, 214], [96, 214], [90, 222], [46, 222]], '#7a8090', 'h1', 0.55);
  P.area('pc-boat', rect(56, 202, 76, 214), '#8a90a0', 'h3', 0.45);
  P.accent('pc-boat', 'M66 202L66 186', '#7a8090', 0.6, 0.5);
  P.area('pc-boat', circle(70, 210, 1.6, 8), C.lamp, 'h1', 0.8);
  rocks(P, [[150, 292], [156, 262], [172, 240], [200, 230], [236, 232], [262, 248], [276, 292]], 'pc-rocks', { light: '#9a8a7a', dark: '#4a4248' });
  const tw = tower(P, { cx: 210, base: 232, top: 110, lit: 0.8, halo: 1.6, haloCls: 'halo' });
  // the foghorn: a trumpet on the gallery, pointing out to sea
  const hx = 210 - 17 * tw.s, hy = 110 - 4 * tw.s;
  P.area('pc-tower', [[hx, hy - 2], [hx - 14, hy - 7], [hx - 14, hy + 5], [hx, hy + 2]], P.lin('horn', hx - 14, 0, hx, 0, [[0, C.redL, 1], [1, C.redD, 1]]), 'h1');
  P.contour('pc-tower', straight([[hx, hy - 2], [hx - 14, hy - 7], [hx - 14, hy + 5], [hx, hy + 2]]), C.sepia, 0.5);
  // rings of sound (tap)
  for (let i = 0; i < 4; i++) P.group('pc-gulls', 'ring' + i, () => P.accent('pc-gulls', `M${f1(hx - 18)} ${f1(hy - 16)}Q${f1(hx - 30)} ${f1(hy - 1)} ${f1(hx - 18)} ${f1(hy + 14)}`, C.indigo, 1.4, 0.85), `transform-box:view-box;transform-origin:${f1(hx - 14)}px ${f1(hy - 1)}px`);
  // fog banks in front, lighter and darker bands drawn sideways
  for (const [y, h, o, part] of [[150, 40, 0.75, 'pc-fx'], [196, 30, 0.6, 'pc-near'], [86, 30, 0.55, 'pc-near']]) {
    const pts = [[6, y]]; for (let x = 6; x <= 294; x += 24) pts.push([x, y - h / 2 + P.R() * 8]); pts.push([294, y]); for (let x = 294; x >= 6; x -= 24) pts.push([x, y + h / 2 - P.R() * 8]);
    P.area(part, pts, P.lin(P.gname('fg'), 0, y - h / 2, 0, y + h / 2, [[0, '#ffffff', 0], [0.5, '#f2f4f6', o], [1, '#ffffff', 0]]), 'h4', 1, true);
  }
  const c = P.cls.bind(P);
  const rings = [0, 1, 2, 3].map(i => `svg.is-playing .${c('ring' + i)}{animation:${c('rg')} 1.2s ease-out ${(i * 0.36).toFixed(2)}s both}`).join('\n');
  return P.end({ order: ['pc-sky', 'pc-sea', 'pc-boat', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-fx', 'pc-near', 'pc-gulls'], fit: '10 14 280 280', css: `
    [class*="${c('ring')}"]{opacity:0}
    ${rings}
    svg.is-playing .${c('halo')}{animation:${c('hl')} ${T} ease-in-out both}
    @keyframes ${c('rg')}{0%{opacity:0;transform:scale(0.4)}15%{opacity:1}100%{opacity:0;transform:scale(4)}}
    @keyframes ${c('hl')}{0%,100%{opacity:0.5}50%{opacity:0.8}}` });
};

// 8 a ship's chart, compass and the lighthouse on the horizon; tap: the needle swings to north
S.chart = function () {
  const P = K.page(81);
  // the chart paper: coastline, land tint, depth lines, soundings, compass rose
  const PAPER = [[14, 70], [286, 66], [290, 290], [10, 292]];
  P.area('pc-paper', PAPER, P.lin('paper', 0, 66, 0, 292, [[0, '#f4ead2', 1], [1, '#e2d1ac', 1]]), 'h4');
  P.area('pc-paper', PAPER, C.paperD, 'h2', 0.35);
  P.contour('pc-paper', straight(PAPER), C.sepia, 0.6);
  const LAND = [[14, 70], [120, 68], [132, 96], [118, 122], [92, 136], [66, 170], [40, 182], [14, 186]];
  P.area('pc-paper', LAND, '#d8c08a', 'h1', 0.9, true);
  P.contour('pc-paper', smoothPath(LAND.slice(1, -1), false), C.sepia, 0.7);
  for (const off of [8, 18, 30]) P.accent('pc-paper', smoothPath(LAND.slice(1, -1).map(([x, y]) => [x + off * 0.9, y + off * 0.7]), false), '#5f9aa8', 0.5, 0.6, ' stroke-dasharray="2 2"');
  let nums = '';
  for (let i = 0; i < 14; i++) { const x = 150 + P.R() * 120, y = 90 + P.R() * 70; nums += `M${f1(x)} ${f1(y)}l2 0l-2 3l2 0`; }
  P.accent('pc-paper', nums, '#5a5a6a', 0.45, 0.8);
  // the lighthouse symbol: a star with a magenta flare
  P.accent('pc-paper', 'M118 110l3 -8l3 8l-7 -5h8z', C.sepia, 0.6, 0.9);
  P.area('pc-paper', [[121, 104], [150, 92], [146, 112]], '#c0408a', 'h4', 0.6);
  // course line with a ship on it
  P.accent('pc-paper', 'M270 280L150 120', C.redD, 0.8, 0.8, ' stroke-dasharray="5 3"');
  // the view ahead: a strip of sea with the lighthouse on the horizon
  P.area('pc-far', rect(14, 14, 286, 60), P.lin('vs', 0, 14, 0, 60, [[0, '#7c96c6', 1], [1, '#f0c8a0', 1]]), 'h4');
  P.area('pc-far', rect(14, 46, 286, 60), P.lin('vsea', 0, 46, 0, 60, [[0, C.seaMid, 1], [1, C.seaNear, 1]]), 'h4');
  P.contour('pc-far', straight(rect(14, 14, 286, 60)), C.sepia, 0.8);
  tower(P, { cx: 200, base: 47, top: 31, part: 'pc-far', halo: 1.8, haloPart: 'pc-far', far: true });
  // dividers lying on the chart
  P.accent('pc-mid', 'M60 270L100 210L118 268', C.iron, 1.2, 0.9);
  P.area('pc-mid', circle(100, 210, 3, 12), C.brass, 'h1', 1);
  // the compass: brass bowl, card, needle
  const [cx, cy, r] = [200, 210, 54];
  P.area('pc-near', circle(cx + 4, cy + 6, r + 4), '#3a2a1a', 'h2', 0.35);
  P.area('pc-near', circle(cx, cy, r + 6), P.rad('brass', cx - 20, cy - 20, r + 30, [[0, '#f2d98a', 1], [0.5, C.brass, 1], [1, C.brassD, 1]]), 'h1');
  P.area('pc-near', circle(cx, cy, r), P.rad('card', cx - 14, cy - 14, r * 1.3, [[0, '#fffaf0', 1], [1, '#e2d4b4', 1]]), 'h4');
  P.contour('pc-near', straight(circle(cx, cy, r + 6, 48)) + straight(circle(cx, cy, r, 48)), C.sepia, 0.6);
  let ticks = '';
  for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI, r0 = i % 8 ? r - 5 : r - 10; ticks += `M${f1(cx + Math.sin(a) * r0)} ${f1(cy - Math.cos(a) * r0)}L${f1(cx + Math.sin(a) * (r - 1))} ${f1(cy - Math.cos(a) * (r - 1))}`; }
  P.accent('pc-near', ticks, C.sepia, 0.6, 0.85);
  // N E S W in pencil strokes
  P.accent('pc-near', `M${cx - 3} ${cy - r + 20}l0 -8l6 8l0 -8M${cx + r - 18} ${cy - 4}l-5 0l0 8l5 0M${cx + r - 23} ${cy}l4 0M${cx + 3} ${cy + r - 20}C${cx + 2} ${cy + r - 22} ${cx - 3} ${cy + r - 22} ${cx - 3} ${cy + r - 19.5}C${cx - 3} ${cy + r - 17.3} ${cx + 3} ${cy + r - 17.7} ${cx + 3} ${cy + r - 15}C${cx + 3} ${cy + r - 12.4} ${cx - 2} ${cy + r - 12} ${cx - 3} ${cy + r - 14}M${cx - r + 14} ${cy - 4}l2 8l2 -5l2 5l2 -8`, C.indigo, 0.9, 0.9);
  P.group('pc-gulls', 'needle', () => {
    P.area('pc-gulls', [[cx, cy - r + 14], [cx + 5, cy], [cx - 5, cy]], P.lin('nn', cx - 5, 0, cx + 5, 0, [[0, C.redL, 1], [1, C.redD, 1]]), 'h3');
    P.area('pc-gulls', [[cx, cy + r - 14], [cx + 5, cy], [cx - 5, cy]], P.lin('ns', cx - 5, 0, cx + 5, 0, [[0, '#9aa0b0', 1], [1, '#4a5060', 1]]), 'h3');
    P.contour('pc-gulls', straight([[cx, cy - r + 14], [cx + 5, cy], [cx, cy + r - 14], [cx - 5, cy]]), C.sepia, 0.5);
    P.area('pc-gulls', circle(cx, cy, 3, 12), C.brass, 'h1');
  }, `transform-box:view-box;transform-origin:${cx}px ${cy}px`);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-paper', 'pc-far', 'pc-mid', 'pc-near', 'pc-gulls'], fit: '8 12 284 282', hit: '10 10 280 282', css: `
    svg.is-playing .${c('needle')}{animation:${c('sw')} ${T} cubic-bezier(.3,.6,.4,1) both}
    @keyframes ${c('sw')}{0%{transform:rotate(80deg)}22%{transform:rotate(-45deg)}42%{transform:rotate(25deg)}60%{transform:rotate(-12deg)}76%{transform:rotate(6deg)}90%{transform:rotate(-2deg)}100%{transform:rotate(0)}}` });
};

// 9 dawn: the light goes out, a ship safe in the harbour; tap: the lamp dims as the sun rises
S.dawn = function () {
  const P = K.page(91);
  sky(P, { top: C.dawnTop, mid: '#e8b8c0', low: C.dawnLow, y1: 180 });
  clouds(P, [[120, 60, 40, 5], [230, 90, 30, 4], [60, 110, 26, 4]], '#ffe0c0', '#c89ab0');
  P.group('pc-sun', 'sun', () => {
    P.tone('pc-sun', straight(circle(236, 180, 50)), [186, 130, 286, 230], P.rad('dg', 236, 180, 50, [[0, '#fff2c0', 1], [0.4, C.dawnLow, 0.8], [1, C.dawnLow, 0]]), 'h4');
    P.tone('pc-sun', straight(circle(236, 182, 13)), [222, 168, 250, 196], '#ffe8a0', 'h1');
  }, 'transform-box:view-box');
  sea(P, { y0: 180, y1: 292, far: '#e8b8b0', mid: '#6a8ab8', near: '#2a4a78' });
  waves(P, 'pc-sea', 10, 200, 240, 120);
  // the harbour: a stone quay with a moored ship, bollards, a lamp post
  const QUAY = [[120, 236], [292, 230], [292, 252], [120, 258]];
  P.area('pc-rocks', QUAY, P.lin('q', 0, 230, 0, 258, [[0, '#c8b89a', 1], [1, '#7a6a5a', 1]]), 'h1');
  P.contour('pc-rocks', straight(QUAY), C.sepia, 0.6);
  let blocks = '';
  for (let x = 130; x < 290; x += 16) blocks += `M${x} ${f1(236 - (x - 120) * 0.035)}L${x} ${f1(258 - (x - 120) * 0.035)}`;
  P.accent('pc-rocks', blocks + 'M120 247L292 241', '#6a5a4a', 0.5, 0.6);
  // the ship: hull, cabin, mast, a coil of rope
  const HULL = [[150, 228], [262, 224], [252, 240], [160, 242]];
  P.area('pc-boat', HULL, P.lin('hull', 0, 224, 0, 242, [[0, '#3a5a8a', 1], [1, '#1a2a4a', 1]]), 'h1');
  P.area('pc-boat', [[150, 228], [262, 224], [261, 227], [151, 231]], C.redD, 'h1', 0.9);
  P.area('pc-boat', rect(188, 210, 222, 226), P.lin('cab', 188, 0, 222, 0, [[0, '#f4ead8', 1], [1, '#b8a8a0', 1]]), 'h3');
  P.area('pc-boat', rect(194, 214, 200, 220), C.glowWin, 'h1');
  P.area('pc-boat', rect(208, 214, 214, 220), C.glowWin, 'h1');
  P.accent('pc-boat', 'M238 225L238 172M238 186L262 196M238 186L214 196', C.iron, 0.8, 0.85);
  P.contour('pc-boat', straight(HULL) + straight(rect(188, 210, 222, 226)), C.indigo, 0.55);
  P.accent('pc-boat', 'M160 244Q205 242 252 241', C.seaNear, 0.9, 0.55);
  // the lighthouse at the harbour mouth, on the left
  rocks(P, [[14, 292], [18, 236], [36, 216], [62, 210], [86, 218], [104, 240], [110, 292]]);
  tufts(P, 'pc-rocks', [[34, 220], [70, 214], [90, 224]]);
  tower(P, { cx: 60, base: 214, top: 96, lit: 1, halo: 1.2, haloCls: 'halo' });
  gulls(P, 'pc-gulls', [[150, 120, 5], [170, 108, 4], [260, 140, 4.5]]);
  const c = P.cls.bind(P);
  return P.end({ order: ['pc-sky', 'pc-sun', 'pc-sea', 'pc-boat', 'pc-rocks', 'pc-beam', 'pc-tower', 'pc-gulls'], fit: '8 20 284 272', css: `
    svg.is-playing .${c('halo')}{animation:${c('dim')} ${T} ease-in both}
    svg.is-playing .${c('sun')}{animation:${c('up')} ${T} ease-out both}
    @keyframes ${c('dim')}{0%{opacity:1;transform:scale(1)}70%,100%{opacity:0;transform:scale(0.5)}}
    @keyframes ${c('up')}{0%{transform:translateY(0)}100%{transform:translateY(-16px)}}
    ${gullCss(P)}` });
};

window.LIGHTHOUSE_SCENES = S;
})();
