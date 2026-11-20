// THE LITTLE WIZARD'S LOST SPELLBOOK: the fourteen cut-paper pictures
// (viewBox 0..300), built with the kit in assets/js/paper.js. Each builder is
// side-effect free (a fresh kit / uid per call), puts its card pieces on the
// flat `pp-*` depth layers and embeds its own one-shot tap motion (<= 2.4 s,
// back to the start pose at the end). From page 2 on every room hides one
// recovered gold page.
(function () {
'use strict';
const K = window.PAPER;
const PLAY = K.PLAY;
const f1 = window.DRAWKIT.f1;
const S = {};

// ---- shared little motions ------------------------------------------------------------
const hop = (k, name, h = 8, delay = 0, dur = 0.7) => k.anim(name, `0%,100%{transform:none}35%{transform:translateY(${-h}px)}60%{transform:translateY(1px)}80%{transform:none}`, { dur, delay });
const hop2 = (k, name, h = 6, delay = 0, dur = 1.2) => k.anim(name, `0%,50%,100%{transform:none}20%{transform:translateY(${-h}px)}70%{transform:translateY(${-h}px)}`, { dur, delay });
const hat = (k, n = 'wiz', delay = 0.2) => k.origin(n + '-hat', '50% 100%') + k.anim(n + '-hat', '0%,100%{transform:none}25%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}75%{transform:rotate(-2deg)}', { dur: 1.2, delay });
const wave = (k, n = 'wiz', delay = 0) => k.origin(n + '-arm', '0% 80%') + k.anim(n + '-arm', '0%,100%{transform:none}20%{transform:rotate(-18deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-12deg)}80%{transform:rotate(4deg)}', { dur: 1.4, delay });
const tail = (k, n = 'pip', delay = 0) => k.origin(n + '-tail', '0% 100%') + k.anim(n + '-tail', '0%,100%{transform:none}25%{transform:rotate(-16deg)}55%{transform:rotate(12deg)}80%{transform:rotate(-5deg)}', { dur: 1.6, delay });
const nod = (k, n, delay = 0, deg = 10) => k.origin(n + '-head', '50% 90%') + k.anim(n + '-head', `0%,100%{transform:none}30%{transform:rotate(${-deg}deg)}60%{transform:rotate(${deg * 0.6}deg)}`, { dur: 1.2, delay });
const flare = (k, name, delay = 0, dur = 1.6) => k.origin(name, '50% 100%') + k.anim(name, '0%,100%{transform:none}30%{transform:scale(1.35,1.5)}55%{transform:scale(.9,1.1)}75%{transform:scale(1.2,1.3)}', { dur, delay });
const shimmer = (k, name = 'gp', delay = 0.6) => k.anim(name, '0%,100%{transform:none}30%{transform:scale(1.18) rotate(-6deg)}60%{transform:scale(.96) rotate(4deg)}', { dur: 1.4, delay });
// a small loose page (no glow) drawn round the origin
const fpage = k => `<rect x="-5" y="-6.5" width="10" height="13" fill="${k.C.page}"${k.F}/><rect x="-5" y="-6.5" width="10" height="2.4" fill="${k.GOLD}"/>` +
  `<path d="M-3 -1.5h6M-3 1h5M-3 3.5h6" stroke="${k.C.roof}" stroke-width=".7"/>`;
// loop offsets that start and end at 0 (for things flying round in circles)
function orbit(r, phase, turns = 1, ry = r) {
  let fr = '';
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, a = phase + t * turns * 6.2832;
    fr += `${Math.round(t * 100)}%{transform:translate(${f1(Math.cos(a) * r - Math.cos(phase) * r)}px,${f1(Math.sin(a) * ry - Math.sin(phase) * ry)}px)}`;
  }
  return fr;
}
// the papercut cloud band
function scallop(k, part, y, r, sd, fill) {
  const pts = [[-6, y + 30]];
  for (let x = -6; x <= 306; x += 4) pts.push([x, y - Math.abs(Math.sin((x + sd * 7) / r)) * r * 0.7 - k.R() * 1.2]);
  pts.push([306, y + 30]);
  k.piece(part, pts, fill, { j: 0.6 });
}
// arch outline points (round top) for windows, doors and mirrors
function archPts(x, y, w, h, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; pts.push([x + w / 2 + Math.cos(a) * w / 2, y + w / 2 + Math.sin(a) * w / 2]); }
  return pts.concat([[x + w, y + h], [x, y + h]]);
}
const archD = (x, y, w, h) => `M${x} ${y + h}V${f1(y + w / 2)}A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${x + w} ${f1(y + w / 2)}V${y + h}Z`;

// 1 the classroom: Pip on the window sill next to the spellbook;
//   tap: Pip swats it, the book tips out of the window and its pages fly off
S.classroom = function () {
  const k = K.kit(101), C = k.C;
  k.wall('pp-sky', '#46358c', '#382a7a', 236);
  k.piece('pp-sky', [[152, -4], [171, -4], [171, 40], [161.5, 33], [152, 40]], C.book, { soft: false, j: 0.4 });
  k.add('pp-sky', k.foil(161.5, 18, 5));
  // the big window: night, the moon, a castle tower outside
  k.archWindow('pp-far', 180, 44, 92, 132, { bars: false, stars: false, inside: k.linear('#1a1040', '#3b2a78') });
  k.add('pp-far', k.glow(248, 82, 24, '#ffe48a', 0.45) + k.disc(248, 82, 9, k.GOLD));
  for (const [x, y, r] of [[196, 70, 2.2], [214, 100, 1.6], [262, 120, 1.8], [236, 58, 1.4]]) k.add('pp-far', k.foil(x, y, r, { flat: true }));
  k.tower('pp-far', 206, 176, 14, 46, 20);
  k.add('pp-far', `<path d="M226 47V176M180 124H272" stroke="${C.lilac}" stroke-width="2.6"/>`);
  // blackboard with chalk drawings
  k.piece('pp-castle', k.box(16, 56, 150, 140), C.wood, { soft: false, j: 0.5 });
  k.piece('pp-castle', k.box(22, 62, 144, 134), '#26434a', { soft: false, j: 0.4 });
  k.add('pp-castle', `<g fill="none" stroke="#eef4f0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".75">` +
    `<path d="${K.shapeD('star', 48, 92, 14)}"/><path d="M76 124L102 124L94 106L98 90L86 100Z"/><path d="M112 100q8 -12 18 -2q-6 16 -18 6q2 -8 8 -6"/>` +
    `<path d="M32 124h22M110 124h22M124 76l8 -6"/></g>`);
  k.piece('pp-castle', k.box(18, 138, 148, 143), C.woodL, { soft: false, j: 0.3 });
  k.piece('pp-castle', k.box(30, 136, 38, 139), C.white, { soft: false, j: 0.2 });
  k.floor('pp-cloud', 236, '#2c1f5c', '#221650', 'planks');
  // desks, an ink pot, a candle, a pile of school books
  k.piece('pp-near', k.box(6, 220, 94, 227), C.woodL, { soft: false, j: 0.4 });
  k.piece('pp-near', k.box(12, 227, 88, 262), C.wood, { soft: false, j: 0.4 });
  k.piece('pp-near', k.box(16, 232, 84, 256), C.woodD, { soft: false, j: 0.3 });
  k.add('pp-near', k.disc(26, 215, 5, C.ink) + k.p(k.box(23, 208, 29, 212), C.ink, { soft: false, j: 0.2 }));
  k.add('pp-near', `<path d="M27 210Q34 196 44 192Q38 202 28 211" fill="${C.white}"${k.F}/>`);
  k.add('pp-near', k.candle(76, 221, 0.8, 'flame'));
  k.piece('pp-near', k.box(226, 250, 306, 257), C.woodL, { soft: false, j: 0.4 });
  k.piece('pp-near', k.box(232, 257, 306, 300), C.wood, { soft: false, j: 0.4 });
  k.piece('pp-near', k.box(240, 236, 286, 250), C.red, { soft: false, j: 0.3 });
  k.piece('pp-near', k.box(244, 226, 282, 236), C.teal, { soft: false, j: 0.3 });
  k.add('pp-near', `<path d="M240 243h46M244 231h38" stroke="${k.GOLD}" stroke-width="1.2"/>`);
  // the little wizard, Pip and the spellbook on the sill
  k.add('pp-chars', k.wizard(124, 272, 1.15));
  k.add('pp-chars', k.pip(204, 180, 0.85, { flip: true }));
  k.add('pp-chars', k.spellbook(240, 175, 0.9));
  // the pages that fly out (hidden until the tap)
  const B = [240, 172];
  const FLY = [[-40, -80, 200, 0.5], [10, -110, -160, 0.58], [-20, -40, 240, 0.66], [24, -66, 150, 0.74], [-54, -110, -220, 0.82], [-6, -94, 180, 0.9]];
  let pages = '', css = `.${k.cls('fp')}{transform-box:view-box;transform-origin:0 0;opacity:0;transform:translate(${B[0]}px,${B[1]}px)}`;
  FLY.forEach(([dx, dy, rot, delay], i) => {
    pages += `<g class="${k.cls('fp')} ${k.cls('fp' + i)}">${fpage(k)}</g>`;
    css += k.anim('fp' + i, `0%{opacity:0;transform:translate(${B[0]}px,${B[1]}px) scale(.3) rotate(0)}12%{opacity:1}` +
      `45%{transform:translate(${f1(B[0] + dx * 0.55)}px,${f1(B[1] + dy * 0.75)}px) scale(1) rotate(${rot / 2}deg)}80%{opacity:1}` +
      `100%{opacity:0;transform:translate(${B[0] + dx}px,${B[1] + dy}px) scale(.55) rotate(${rot}deg)}`, { dur: PLAY - delay, delay, ease: 'cubic-bezier(.2,.7,.4,1)' });
  });
  k.add('pp-pages', pages);
  css += k.origin('pip-paw', '100% 50%') + k.anim('pip-paw', '0%,100%{transform:none}30%{transform:translate(1px,-4px) rotate(25deg)}55%{transform:translate(-7px,-1px) rotate(-12deg)}80%{transform:none}', { dur: 0.6 });
  css += k.origin('pip', '50% 100%') + k.anim('pip', '0%,100%{transform:none}10%{transform:scale(1.04,.94)}20%{transform:translateX(-2px) scale(.98,1.04)}32%{transform:none}', { dur: 1.6 });
  css += tail(k, 'pip', 0.3);
  css += k.anim('book', '0%,14%{transform:none;opacity:1}24%{transform:translate(4px,-6px) rotate(20deg)}40%{transform:translate(12px,-26px) rotate(60deg) scale(.8);opacity:1}55%{transform:translate(4px,-48px) rotate(110deg) scale(.4);opacity:0}86%{transform:none;opacity:0}100%{transform:none;opacity:1}');
  css += hop(k, 'wiz', 9, 0.45, 0.8) + hat(k, 'wiz', 0.5) + flare(k, 'flame', 0.2, 1.2);
  return k.end({ css });
};

// 2 the potion room: a bubbling cauldron, shelves of bottles; tap: it bubbles over
S.potions = function () {
  const k = K.kit(202), C = k.C;
  k.wall('pp-sky', '#2f3570', '#252a5e', 234);
  k.add('pp-sky', k.glow(150, 176, 130, '#7fe08a', 0.2));
  const cols = [C.pink, C.teal, C.green, C.blue, C.red, '#c9a0f0', C.flame, C.tealD];
  let ci = 0;
  for (const [x0, x1, y] of [[8, 92, 86], [8, 92, 140], [208, 292, 78], [208, 292, 134]]) {
    k.shelf('pp-far', x0, x1, y);
    const stop = (y === 78 && x0 === 208) ? 258 : x1 - 6;
    for (let x = x0 + 6; x < stop - 8;) {
      const w = k.rnd(9, 14), h = k.rnd(16, 28);
      k.add('pp-far', k.bottle(x + w / 2, y, w, h, cols[ci++ % cols.length], { round: k.R() < 0.4, label: k.R() < 0.5 }));
      x += w + k.rnd(3, 6);
    }
  }
  k.add('pp-far', k.goldPage(276, 62, 0.8, { rot: 8 }));
  // hanging herbs
  for (const x of [118, 182]) {
    k.add('pp-castle', `<path d="M${x} 0V30" stroke="${C.woodD}" stroke-width="1.2"/>`);
    for (let i = 0; i < 5; i++) k.piece('pp-castle', [[x, 30], [x - 8 + i * 4, 52 + (i % 2) * 6], [x - 5 + i * 4, 54 + (i % 2) * 6]], i % 2 ? C.green : C.greenD, { soft: false, j: 0.3 });
  }
  k.floor('pp-cloud', 234, '#262056', '#1d1848', 'flags');
  // fire and the cauldron
  k.piece('pp-near', [[112, 262], [118, 256], [186, 250], [188, 256], [120, 266]], C.woodD, { j: 0.4 });
  k.piece('pp-near', [[188, 262], [182, 256], [114, 250], [112, 256], [180, 266]], C.wood, { j: 0.4 });
  k.add('pp-near', k.g('fire', k.glow(150, 248, 44, '#ff9a3a', 0.55) +
    k.p([[126, 256], [132, 236], [140, 248], [150, 228], [160, 248], [168, 236], [174, 256]], C.flameD, { j: 0.6, flat: true }) +
    k.p([[136, 256], [142, 244], [150, 238], [158, 244], [164, 256]], C.flame, { j: 0.4, flat: true })));
  let pot = '';
  pot += k.p(k.box(112, 230, 118, 250), '#1a1334', { soft: false, j: 0.2 }) + k.p(k.box(182, 230, 188, 250), '#1a1334', { soft: false, j: 0.2 });
  pot += k.p(k.ring(150, 218, 50, 30, 20), '#211a42', { j: 0.8 });
  pot += `<path d="M112 210Q120 240 150 246" stroke="#3a3070" stroke-width="3" fill="none" opacity=".8"/>`;
  pot += k.p(k.ring(150, 194, 52, 9, 20), '#2e2658', { j: 0.5 });
  pot += k.p(k.ring(150, 194, 45, 6.5, 18), '#6fe08a', { j: 0.4 });
  pot += k.disc(134, 193, 3.2, '#b6f5bf', { flat: true }) + k.disc(160, 195, 2.4, '#b6f5bf', { flat: true }) + k.disc(170, 192, 1.6, '#b6f5bf', { flat: true });
  k.add('pp-near', k.g('pot', pot));
  k.add('pp-trees', k.g('steam', k.glow(150, 150, 50, '#9df0a8', 0.5, 40)));
  // the bubbles (hidden until the tap)
  const BUB = [[128, 190, 4, 0.1], [150, 188, 6, 0.35], [168, 190, 3.5, 0.55], [140, 190, 5, 0.8], [160, 189, 4.5, 1.05]];
  let bubs = '', css = '';
  BUB.forEach(([x, y, r, d], i) => {
    bubs += k.g('bb' + i, `<circle cx="${x}" cy="${y}" r="${r}" fill="#b6f5bf" opacity=".85"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${f1(r * 0.3)}" fill="#fff"/>`);
    css += `.${k.cls('bb' + i)}{opacity:0}` + k.anim('bb' + i, `0%{opacity:0;transform:none}15%{opacity:1}80%{opacity:1;transform:translate(${(i % 2 ? 6 : -6)}px,-64px) scale(1.3)}100%{opacity:0;transform:translate(${(i % 2 ? 8 : -8)}px,-76px) scale(1.7)}`, { dur: 1.3, delay: d, ease: 'ease-out' });
  });
  k.add('pp-trees', bubs);
  k.add('pp-chars', k.wizard(238, 274, 1.05, { flip: true, wandUp: true }));
  k.add('pp-chars', k.pip(56, 270, 1.0));
  css += k.origin('pot', '50% 100%') + k.anim('pot', '0%,100%{transform:none}15%{transform:scale(1.04,.95)}30%{transform:scale(.97,1.04)}45%{transform:scale(1.03,.97)}60%{transform:none}', { dur: 1.6 });
  css += `.${k.cls('steam')}{opacity:.4}` + k.anim('steam', '0%,100%{opacity:.4;transform:none}50%{opacity:1;transform:translateY(-16px) scale(1.3)}');
  css += flare(k, 'fire', 0, 1.8) + wave(k, 'wiz', 0.1) + hat(k, 'wiz', 0.4) + nod(k, 'pip', 0.3) + tail(k, 'pip', 0.6) + shimmer(k, 'gp', 0.9);
  return k.end({ css });
};

// 3 the library: tall bookcases and books flying round; tap: they circle the room
S.library = function () {
  const k = K.kit(303), C = k.C;
  k.wall('pp-sky', '#3d2a6e', '#30215e', 238);
  k.archWindow('pp-sky', 118, 36, 64, 118, { inside: k.linear('#1a1040', '#3b2a78') });
  k.add('pp-sky', k.disc(160, 62, 6, k.GOLD));
  for (const [x0, x1] of [[4, 98], [202, 296]]) {
    k.piece('pp-far', k.box(x0, 22, x1, 244), C.wood, { soft: false, j: 0.6 });
    k.piece('pp-far', k.box(x0 + 6, 30, x1 - 6, 240), C.woodD, { soft: false, j: 0.4 });
    k.piece('pp-far', [[x0 - 4, 22], [x1 + 4, 22], [x1, 14], [x0, 14]], C.woodL, { soft: false, j: 0.4 });
    for (const y of [72, 114, 156, 198, 240]) {
      k.bookRow('pp-far', x0 + 8, x1 - 8, y - 2, 18, 32);
      k.shelf('pp-far', x0 + 4, x1 - 4, y - 2);
    }
  }
  k.floor('pp-cloud', 240, '#2a1c55', '#20154a', 'planks');
  k.add('pp-near', k.p(k.ring(150, 266, 76, 16, 22), '#8a3a6a', { j: 1 }) + `<ellipse cx="150" cy="266" rx="64" ry="11" fill="none" stroke="${k.GOLD}" stroke-width="1.6"/>`);
  // the ladder against the right bookcase
  const lx = y => 228 + (252 - y) / 212 * 26;
  k.add('pp-near', `<path d="M${f1(lx(252))} 252L${f1(lx(40))} 40M${f1(lx(252) + 16)} 252L${f1(lx(40) + 16)} 40" stroke="${C.woodL}" stroke-width="3.2" stroke-linecap="round"${k.F}/>`);
  let rungs = '';
  for (let y = 236; y > 50; y -= 22) rungs += `M${f1(lx(y))} ${y}h16`;
  k.add('pp-near', `<path d="${rungs}" stroke="${C.woodL}" stroke-width="2.4"${k.F}/>`);
  k.add('pp-trees', k.pip(lx(170) + 9, 170, 0.75, { flip: true }));
  // books flying round, the gold page among them
  const BOOKS = [[110, 74, C.red], [190, 66, C.blue], [94, 132, C.green], [206, 128, C.teal], [120, 186, C.pink], [182, 180, C.book], [150, 46, C.robe]];
  let css = k.origin('fw', '50% 100%') + k.anim('fw', '0%,25%,50%,75%,100%{transform:none}12%,37%,62%,87%{transform:scaleY(.55)}');
  BOOKS.forEach(([x, y, col], i) => {
    const wings = k.p([[-15, -2], [-1, 2], [-1, -8], [-15, -13]], col, { soft: false, j: 0.3 }) + k.p([[15, -2], [1, 2], [1, -8], [15, -13]], col, { soft: false, j: 0.3 });
    const pages = k.p([[-12, -3], [0, 0], [12, -3], [12, -11], [0, -8], [-12, -11]], C.page, { soft: false, j: 0.2, flat: true }) + `<path d="M0 0V-8" stroke="${C.roof}" stroke-width=".8"/>`;
    k.add('pp-pages', `<g transform="translate(${x} ${y}) rotate(${(i % 3 - 1) * 12})">${k.g('fb' + i, k.g('fw', wings) + pages)}</g>`);
    css += k.anim('fb' + i, orbit(12 + (i % 3) * 4, i * 0.9, 1, 8 + (i % 2) * 4), { ease: 'linear' });
  });
  k.add('pp-pages', k.goldPage(150, 120, 1.0, { rot: -6 }));
  k.add('pp-chars', k.wizard(150, 274, 1.0, { open: true }));
  css += hop(k, 'wiz', 6, 0.2) + hat(k, 'wiz', 0.3) + tail(k, 'pip', 0.2) + k.anim('gp', '0%,100%{transform:none}50%{transform:rotate(360deg) scale(1.1)}', { dur: 2.0, delay: 0.2 });
  return k.end({ css });
};

// 4 the castle corridors: arches and torches, the gold page far down the hall;
//   tap: the torches flare and the friends hurry on
S.corridor = function () {
  const k = K.kit(404), C = k.C;
  k.add('pp-sky', `<rect width="300" height="300" fill="#2a1e5a"/>`);
  k.piece('pp-sky', [[-6, -6], [306, -6], [188, 96], [112, 96]], '#1e1546', { soft: false, j: 0.5 });
  k.piece('pp-sky', k.box(112, 96, 188, 204), '#5c4aa6', { soft: false, j: 0.4 });
  k.add('pp-sky', k.glow(150, 176, 40, '#ffd98a', 0.5));
  k.piece('pp-sky', archPts(134, 150, 32, 54), '#ffcf7a', { soft: false, j: 0.3 });
  // side walls with stone rows running to the far end
  const yt = x => -6 + (x + 6) * (102 / 118), yb = x => 306 - (x + 6) * (102 / 118);
  k.piece('pp-far', [[-6, -6], [112, 96], [112, 204], [-6, 306]], '#3a2b78', { soft: false, j: 0.6 });
  k.piece('pp-far', [[306, -6], [188, 96], [188, 204], [306, 306]], '#33266c', { soft: false, j: 0.6 });
  let dl = '';
  for (const y of [30, 70, 110, 190, 230, 270]) {
    const yy = y + (150 - y) * (112 / 150);
    dl += `M-6 ${y}L112 ${f1(yy)}M306 ${y}L188 ${f1(yy)}`;
  }
  for (const x of [20, 50, 76, 96]) dl += `M${x} ${f1(yt(x))}V${f1(yb(x))}M${300 - x} ${f1(yt(x))}V${f1(yb(x))}`;
  k.add('pp-far', `<path d="${dl}" stroke="#2a1e5a" stroke-width="1.6" fill="none" opacity=".8"/>`);
  // portraits on the walls
  k.piece('pp-far', [[50, 104], [74, 116], [74, 160], [50, 166]], k.GOLD, { soft: false, j: 0.3 });
  k.piece('pp-far', [[54, 110], [70, 119], [70, 157], [54, 161]], '#4a3a8a', { soft: false, j: 0.2, flat: true });
  k.add('pp-far', k.disc(62, 128, 4, C.cloud, { flat: true }) + k.p([[56, 158], [62, 140], [68, 156]], C.robe, { soft: false, flat: true }));
  k.piece('pp-far', [[250, 104], [226, 116], [226, 160], [250, 166]], k.GOLD, { soft: false, j: 0.3 });
  k.piece('pp-far', [[246, 110], [230, 119], [230, 157], [246, 161]], '#4a3a8a', { soft: false, j: 0.2, flat: true });
  k.add('pp-far', k.foil(238, 130, 6, { flat: true }) + k.disc(238, 148, 5, C.cat, { flat: true }));
  // arches
  k.add('pp-castle', `<path d="M86 226V124A64 44 0 0 1 214 124V226" stroke="${C.lilacD}" stroke-width="5" fill="none"${k.F}/>`);
  k.add('pp-castle', `<path d="M47 254V110A103 70 0 0 1 253 110V254" stroke="${C.lilac}" stroke-width="8" fill="none"${k.F}/>`);
  k.add('pp-castle', k.foil(150, 42, 4.5) + k.foil(150, 82, 3));
  // floor, flagstones running away, the long red rug
  k.piece('pp-cloud', [[112, 204], [188, 204], [306, 306], [-6, 306]], '#241a4e', { soft: false, j: 0.5 });
  let fl = '';
  for (let xb = -90; xb <= 390; xb += 60) fl += `M${f1(150 + (xb - 150) * 0.245)} 204L${xb} 300`;
  for (const y of [212, 226, 246, 276]) fl += `M0 ${y}H300`;
  k.add('pp-cloud', `<path d="${fl}" stroke="#1a1240" stroke-width="1.5" fill="none"/>`);
  k.piece('pp-near', [[140, 204], [160, 204], [204, 306], [96, 306]], C.redD, { soft: false, j: 0.5 });
  k.add('pp-near', `<path d="M143 206L106 300M157 206L194 300" stroke="${k.GOLD}" stroke-width="1.4"/>`);
  k.add('pp-near', k.goldPage(150, 194, 0.62));
  // torches
  k.add('pp-trees', k.torch(26, 150, 1.0, 't0') + k.torch(274, 150, 1.0, 't1') + k.torch(88, 146, 0.55, 't2') + k.torch(212, 146, 0.55, 't3'));
  k.add('pp-chars', k.wizard(116, 292, 1.0));
  k.add('pp-chars', k.pip(190, 294, 0.9, { flip: true }));
  let css = flare(k, 't0', 0) + flare(k, 't1', 0.15) + flare(k, 't2', 0.3) + flare(k, 't3', 0.45);
  css += hop2(k, 'wiz', 7, 0.4) + hat(k, 'wiz', 0.5) + hop2(k, 'pip', 6, 0.55) + tail(k, 'pip', 0.6) + shimmer(k, 'gp', 1.0);
  return k.end({ css });
};

// 5 the locked door with four keyholes; tap: they light up one by one, the door rattles
S.door = function () {
  const k = K.kit(505), C = k.C;
  k.wall('pp-sky', '#3b2c76', '#2e2264', 252);
  k.piece('pp-far', archPts(76, 50, 148, 204, 14), C.lilacD, { soft: false, j: 0.6 });
  k.piece('pp-far', archPts(84, 58, 132, 196, 14), '#1a1030', { soft: false, j: 0.4 });
  for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; k.add('pp-far', `<path d="M${f1(150 + Math.cos(a) * 66)} ${f1(124 + Math.sin(a) * 66)}L${f1(150 + Math.cos(a) * 74)} ${f1(124 + Math.sin(a) * 74)}" stroke="${C.lilac}" stroke-width="2"/>`); }
  // the door: planks, iron bands, studs, a gold lock plate with four keyholes
  let door = k.p(archPts(90, 64, 120, 190, 14), C.wood, { soft: false, j: 0.5 });
  door += `<path d="M120 72V254M150 64V254M180 72V254" stroke="${C.woodD}" stroke-width="1.8"/>`;
  for (const y of [100, 214]) {
    door += k.p(k.box(90, y, 210, y + 8), C.iron, { soft: false, j: 0.3 });
    for (let x = 98; x < 210; x += 16) door += `<circle cx="${x}" cy="${y + 4}" r="1.6" fill="#8a82aa"/>`;
  }
  door += k.p(k.box(114, 126, 186, 198), k.GOLD, { soft: false, j: 0.4 });
  door += k.p(k.box(119, 131, 181, 193), '#c2973a', { soft: false, j: 0.3, flat: true });
  for (const [x, y] of [[117, 129], [183, 129], [117, 195], [183, 195]]) door += `<circle cx="${x}" cy="${y}" r="1.4" fill="#7a5a1a"/>`;
  const HOLES = [['star', 135, 147], ['moon', 165, 147], ['heart', 135, 177], ['triangle', 165, 177]];
  HOLES.forEach(([s, x, y], i) => {
    door += `<path d="${K.shapeD(s, x, y, 9)}" fill="${C.ink}"/>`;
    door += k.g('kh' + i, k.glow(x, y, 16, '#fff0b5', 0.9) + `<path d="${K.shapeD(s, x, y, 9)}" fill="#fff6d0"/>`);
  });
  door += k.p(k.ring(196, 160, 5, 5, 10), C.brassD, { j: 0.3 });
  k.add('pp-castle', k.g('door', door));
  k.floor('pp-cloud', 252, '#271c56', '#1c1446', 'flags');
  k.add('pp-cloud', k.glow(150, 254, 60, '#ffd98a', 0.4, 5));
  k.add('pp-near', k.goldPage(178, 252, 0.7, { rot: -14 }));
  k.add('pp-trees', k.torch(42, 150, 1.0, 't0') + k.torch(258, 150, 1.0, 't1'));
  k.add('pp-chars', k.wizard(54, 284, 1.0, { wandUp: true }));
  k.add('pp-chars', k.pip(252, 286, 0.95, { flip: true }));
  let css = '';
  HOLES.forEach((h, i) => { css += `.${k.cls('kh' + i)}{opacity:0}` + k.anim('kh' + i, '0%{opacity:0}30%,70%{opacity:1}100%{opacity:0}', { dur: 0.8, delay: 0.1 + i * 0.3 }); });
  css += k.origin('door', '0% 50%') + k.anim('door', '0%,52%,100%{transform:none}56%{transform:rotate(.8deg)}60%{transform:rotate(-.8deg)}64%{transform:rotate(.5deg)}68%{transform:none}80%{transform:scaleX(.94)}90%{transform:scaleX(.97)}');
  css += wave(k, 'wiz', 0) + flare(k, 't0', 0.2) + flare(k, 't1', 0.4) + nod(k, 'pip', 0.6) + tail(k, 'pip', 0.7) + shimmer(k, 'gp', 1.0);
  return k.end({ css });
};

// 6 the paper-bird post: pigeonholes, a big clock, paper birds with letters;
//   tap: the birds flap round the room and the clock's long hand spins
S.post = function () {
  const k = K.kit(606), C = k.C;
  k.wall('pp-sky', '#3d3079', '#302566', 230);
  // pigeonholes with letters
  k.piece('pp-far', k.box(10, 60, 132, 218), C.wood, { soft: false, j: 0.5 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 16 + c * 29, y = 66 + r * 37;
    k.piece('pp-far', k.box(x, y, x + 25, y + 32), C.woodD, { soft: false, j: 0.3, flat: true });
    if ((r * 4 + c) % 3 !== 1) {
      const rot = k.rnd(-8, 8);
      k.add('pp-far', `<g transform="translate(${x + 12.5} ${y + 22}) rotate(${f1(rot)})">${k.p(k.box(-9, -8, 9, 5), C.page, { soft: false, j: 0.2 })}<path d="M-9 -8L0 -1L9 -8" stroke="${C.roof}" stroke-width=".7" fill="none"/></g>`);
    }
  }
  // the big clock
  k.add('pp-castle', k.disc(232, 84, 34, k.GOLD, { n: 24 }) + k.disc(232, 84, 29, C.page, { n: 24 }));
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, r0 = i % 3 ? 24 : 21; ticks += `M${f1(232 + Math.sin(a) * r0)} ${f1(84 - Math.cos(a) * r0)}L${f1(232 + Math.sin(a) * 27)} ${f1(84 - Math.cos(a) * 27)}`; }
  k.add('pp-castle', `<path d="${ticks}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`);
  k.add('pp-castle', k.g('hh', `<path d="M232 84L248 84" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round"/>`));
  k.add('pp-castle', k.g('mh', `<path d="M232 88L232 62" stroke="${C.roof}" stroke-width="2.2" stroke-linecap="round"/>`));
  k.add('pp-castle', `<circle cx="232" cy="84" r="2.4" fill="${C.ink}"/>`);
  k.piece('pp-castle', k.box(228, 118, 236, 150), C.woodD, { soft: false, j: 0.3 });
  k.add('pp-castle', k.disc(232, 152, 7, k.GOLD));
  // the little wizard behind the counter
  k.add('pp-cloud', k.wizard(170, 266, 1.0, { wandUp: true }));
  // the counter, stamps and a letter pile
  k.piece('pp-near', k.box(-6, 224, 306, 233), C.woodL, { soft: false, j: 0.5 });
  k.piece('pp-near', k.box(-6, 233, 306, 306), C.wood, { soft: false, j: 0.5 });
  for (const x of [30, 110, 190, 270]) k.piece('pp-near', k.box(x - 30, 242, x + 30, 292), C.woodD, { soft: false, j: 0.4 });
  for (let i = 0; i < 4; i++) k.piece('pp-near', k.box(236 + i, 218 - i * 4, 266 + i, 223 - i * 4), C.page, { soft: false, j: 0.4 });
  k.add('pp-near', k.p(k.box(276, 212, 286, 224), C.red, { soft: false, j: 0.3 }) + k.p(k.box(279, 204, 283, 212), C.woodL, { soft: false, j: 0.2 }));
  k.add('pp-chars', k.pip(64, 226, 0.9));
  // paper birds with letters (one has the gold page)
  const BIRDS = [[150, 132, 1.0, true], [206, 172, 0.9, true], [266, 140, 0.8, true]];
  let css = '';
  BIRDS.forEach(([x, y, s, l], i) => {
    k.add('pp-pages', k.g('b' + i, k.paperBird(x, y, s, 'bw' + i, { letter: l })));
    css += k.origin('bw' + i + '-w', '50% 100%') + k.anim('bw' + i + '-w', '0%,20%,40%,60%,80%,100%{transform:none}10%,30%,50%,70%,90%{transform:scaleY(-.6)}', { dur: 2.2, delay: i * 0.08 });
    css += k.anim('b' + i, orbit(14, i * 2, 1, 9), { dur: 2.3, ease: 'linear' });
  });
  k.add('pp-pages', k.g('b3', k.paperBird(96, 112, 1.1, 'bw3') + k.goldPage(98, 130, 0.65, { rot: 6 })));
  css += k.origin('bw3-w', '50% 100%') + k.anim('bw3-w', '0%,20%,40%,60%,80%,100%{transform:none}10%,30%,50%,70%,90%{transform:scaleY(-.6)}', { dur: 2.2 });
  css += k.anim('b3', orbit(10, 4, 1, 6), { dur: 2.3, ease: 'linear' });
  css += `.${k.cls('mh')}{transform-box:view-box;transform-origin:232px 84px}` + k.anim('mh', '0%{transform:rotate(0)}100%{transform:rotate(360deg)}', { dur: 2.0, delay: 0.2 });
  css += wave(k, 'wiz', 0.3) + nod(k, 'pip', 0.2, 14) + tail(k, 'pip', 0.5);
  return k.end({ css });
};

// 7 the greenhouse at night: glowing magic plants in pots; tap: they grow and bloom
S.greenhouse = function () {
  const k = K.kit(707), C = k.C;
  k.nightSky('pp-sky', 16, [64, 54, 30]);
  k.moon(64, 54, 16);
  // glass house: tinted panes, lilac frame clipped to the arch
  const ARCH = 'M14 240V110Q14 30 150 30Q286 30 286 110V240Z';
  k.add('pp-far', `<path d="${ARCH}" fill="#c8d4ff" opacity=".1"/>`);
  const cp = k.clip(`<path d="${ARCH}"/>`);
  let bars = '';
  for (const x of [60, 105, 150, 195, 240]) bars += `M${x} 0V240`;
  for (const y of [80, 130, 180]) bars += `M0 ${y}H300`;
  k.add('pp-far', `<g clip-path="${cp}"><path d="${bars}" stroke="${C.lilacD}" stroke-width="2.6" fill="none"/></g>`);
  k.add('pp-far', `<path d="M14 240V110Q14 30 150 30Q286 30 286 110V240" stroke="${C.lilac}" stroke-width="5" fill="none"${k.F}/>`);
  k.floor('pp-cloud', 240, '#263058', '#1d2448', 'flags');
  // the bench
  k.piece('pp-near', k.box(16, 204, 284, 212), C.woodL, { soft: false, j: 0.5 });
  k.piece('pp-near', k.box(16, 212, 284, 216), C.woodD, { soft: false, j: 0.3 });
  for (const x of [26, 146, 266]) k.piece('pp-near', k.box(x, 216, x + 8, 244), C.wood, { soft: false, j: 0.3 });
  // pots and the magic plants (each grows from its pot on the tap)
  const PL = [[52, 52, C.pink], [100, 70, C.teal], [150, 108, C.flame], [200, 64, '#c9a0f0'], [248, 48, C.green]];
  let css = '';
  PL.forEach(([x, h, col], i) => {
    let pl = '';
    const top = 204 - 16 - h, bend = (i % 2 ? 1 : -1) * 10;
    pl += `<path d="M${x} 190C${x + bend} ${f1(190 - h * 0.4)} ${x - bend} ${f1(190 - h * 0.7)} ${x} ${top}" stroke="${C.greenD}" stroke-width="2.6" fill="none" stroke-linecap="round"${k.F}/>`;
    for (let j = 0; j < 3; j++) {
      const ly = 186 - (j + 0.6) * h / 3.6, sd = j % 2 ? 1 : -1;
      pl += k.p([[x, ly], [x + sd * 9, ly - 6], [x + sd * 16, ly - 2], [x + sd * 8, ly + 2]], j % 2 ? C.leaf : C.green, { j: 0.3 });
    }
    // curly tendril
    pl += `<path d="M${x} ${f1(top + h * 0.3)}q${-bend} -4 ${-bend * 0.6} -10q4 -3 3 2" stroke="${C.leaf}" stroke-width="1.2" fill="none"/>`;
    let bloom = k.glow(x, top, 16, col, 0.6);
    for (let j = 0; j < 5; j++) { const a = j / 5 * 6.2832; bloom += k.disc(x + Math.cos(a) * 5, top + Math.sin(a) * 5, 4, col, { j: 0.2 }); }
    bloom += k.disc(x, top, 3, '#fff3b8', { flat: true });
    if (i === 2) bloom = k.goldPage(x, top - 4, 0.85, { rot: 6 });
    pl += k.g('bl' + i, bloom);
    k.add('pp-trees', k.g('pl' + i, pl));
    // the pot
    k.add('pp-trees', k.p([[x - 14, 188], [x + 14, 188], [x + 10, 204], [x - 10, 204]], '#c4704e', { soft: false, j: 0.3 }) + k.p(k.box(x - 16, 184, x + 16, 190), '#d98a62', { soft: false, j: 0.3 }));
    css += k.origin('pl' + i, '50% 100%') + k.anim('pl' + i, '0%,100%{transform:none}40%{transform:scale(1.06,1.22)}65%{transform:scale(.98,1.12)}', { dur: 1.6, delay: i * 0.15 });
    if (i !== 2) css += k.anim('bl' + i, '0%,100%{transform:none}45%{transform:scale(1.5) rotate(40deg)}', { dur: 1.4, delay: 0.3 + i * 0.15 });
  });
  css += shimmer(k, 'gp', 0.6);
  // sparkles that rise from the plants
  let sp = '';
  for (let i = 0; i < 7; i++) {
    const x = 40 + i * 36, y = 150 - (i % 3) * 14;
    sp += k.g('sp' + i, k.foil(x, y, 2.6, { flat: true }));
    css += `.${k.cls('sp' + i)}{opacity:0}` + k.anim('sp' + i, '0%{opacity:0;transform:none}30%{opacity:1}100%{opacity:0;transform:translateY(-40px) rotate(90deg)}', { dur: 1.1, delay: 0.5 + i * 0.12, ease: 'ease-out' });
  }
  k.add('pp-pages', sp);
  k.add('pp-chars', k.wizard(62, 292, 0.95, { wandUp: true }));
  k.add('pp-chars', k.pip(238, 292, 0.9, { flip: true }));
  css += wave(k, 'wiz', 0) + hat(k, 'wiz', 0.3) + nod(k, 'pip', 0.5) + tail(k, 'pip', 0.4);
  return k.end({ css, sky: ['#120a30', '#2c3a78'] });
};

// 8 the spell circle: a gold rune ring on the floor, candles round it, the gold
//   page floating above; tap: the ring turns, a beam of light lifts the page
S.circle = function () {
  const k = K.kit(808), C = k.C;
  k.wall('pp-sky', '#241a50', '#1c1342', 204);
  // round window with star tracery
  k.add('pp-sky', k.disc(150, 70, 38, C.lilacD, { n: 24 }) + k.disc(150, 70, 32, k.SKY, { n: 24 }));
  k.add('pp-sky', `<path d="${K.shapeD('star', 150, 70, 30)}" stroke="${C.lilacD}" stroke-width="2.4" fill="none"/>` + k.foil(150, 70, 5, { flat: true }));
  // pillars
  for (const x of [22, 248]) {
    k.piece('pp-far', k.box(x, 26, x + 30, 214), C.lilacD, { soft: false, j: 0.5 });
    k.piece('pp-far', k.box(x + 18, 26, x + 30, 214), '#7e68c2', { soft: false, j: 0.3, flat: true });
    k.piece('pp-far', k.box(x - 6, 16, x + 36, 28), C.lilac, { soft: false, j: 0.4 });
    k.piece('pp-far', k.box(x - 6, 208, x + 36, 218), C.lilac, { soft: false, j: 0.4 });
    k.add('pp-far', k.foil(x + 15, 60, 4));
  }
  k.piece('pp-cloud', [[-6, 306], [-6, 218], [306, 218], [306, 306]], '#2a1f5e', { soft: false, j: 0.6 });
  // the rune ring, seen at a slant
  k.add('pp-near', k.glow(150, 246, 140, '#ffd98a', 0.28, 44));
  let ring = `<circle r="112" fill="none" stroke="${k.GOLD}" stroke-width="4.5"/><circle r="90" fill="none" stroke="${k.GOLD}" stroke-width="3"/>`;
  let st = '';
  for (let i = 0; i < 7; i++) { const a = i * 3 / 7 * 6.2832 - Math.PI / 2; st += (i ? 'L' : 'M') + f1(Math.cos(a) * 88) + ' ' + f1(Math.sin(a) * 88); }
  ring += `<path d="${st}Z" fill="none" stroke="${k.GOLD}" stroke-width="2.4"/>`;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; ring += K.rune(i, Math.cos(a) * 101, Math.sin(a) * 101, 6.5, '#ffe9a0', 2.2); }
  k.add('pp-near', `<g transform="translate(150 246) scale(1 .3)">${k.g('circ', ring)}</g>`);
  // candles round the ring (smaller at the back)
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * 6.2832 + 0.5, x = 150 + Math.cos(a) * 124, y = 246 + Math.sin(a) * 38;
    k.add(Math.sin(a) < 0 ? 'pp-near' : 'pp-trees', k.candle(x, y, Math.sin(a) < 0 ? 0.7 : 0.95, 'cf', { h: 14 + (i % 2) * 6 }));
  }
  k.add('pp-chars', k.wizard(150, 250, 1.05, { wandUp: true }));
  k.add('pp-chars', k.pip(262, 280, 0.9, { flip: true }));
  k.add('pp-pages', k.g('beam', `<ellipse cx="150" cy="160" rx="44" ry="120" fill="${k.radial('#fff0b5', 0.55)}"/>`));
  k.add('pp-pages', k.goldPage(150, 112, 1.0));
  let css = k.anim('circ', '0%{transform:rotate(0)}100%{transform:rotate(360deg)}', { dur: 2.4 });
  css += `.${k.cls('beam')}{opacity:0}` + k.anim('beam', '0%,100%{opacity:0}35%,70%{opacity:1}', { dur: 2.2, delay: 0.1 });
  css += k.anim('gp', '0%,100%{transform:none}45%{transform:translateY(-16px) rotate(180deg) scale(1.1)}75%{transform:translateY(-12px) rotate(360deg)}', { dur: 2.2, delay: 0.15 });
  css += flare(k, 'cf', 0.1, 1.8) + hop(k, 'wiz', 6, 0.3) + wave(k, 'wiz', 0.6) + hat(k, 'wiz', 0.4) + tail(k, 'pip', 0.3) + nod(k, 'pip', 0.8);
  return k.end({ css, sky: ['#130b33', '#2e2468'] });
};

// 9 the kitchen: three friendly goblins and a plate of cookies by the hearth;
//   tap: the goblins hop one after another, the fire crackles
S.kitchen = function () {
  const k = K.kit(909), C = k.C;
  k.wall('pp-sky', '#4a2f6e', '#3c245e', 238, { row: 18 });
  // hearth with a fire and a hanging pot
  k.piece('pp-far', k.box(4, 86, 98, 240), C.stone, { soft: false, j: 0.6 });
  k.piece('pp-far', k.box(-2, 80, 104, 92), C.stoneD, { soft: false, j: 0.4 });
  k.piece('pp-far', archPts(16, 112, 70, 128, 12), '#1a1030', { soft: false, j: 0.4 });
  k.add('pp-far', k.g('fire', k.glow(51, 226, 34, '#ff9a3a', 0.6) +
    k.p([[30, 238], [36, 216], [44, 228], [51, 206], [58, 228], [66, 216], [72, 238]], C.flameD, { j: 0.5, flat: true }) +
    k.p([[38, 238], [44, 224], [51, 218], [58, 224], [64, 238]], C.flame, { j: 0.3, flat: true })));
  k.add('pp-far', `<path d="M51 112V172" stroke="${C.iron}" stroke-width="1.6"/>` + k.p(k.ring(51, 188, 17, 14, 16), '#211a42', { j: 0.5 }) + k.p(k.box(32, 172, 70, 177), '#2e2658', { soft: false, j: 0.3 }));
  for (let i = 0; i < 3; i++) {
    k.add('pp-far', k.g('st' + i, k.disc(44 + i * 8, 164, 5 + i, C.cloud, { flat: true })));
  }
  // pan rail, shelves with jars
  k.add('pp-castle', `<path d="M112 40H180" stroke="${C.iron}" stroke-width="2.4"/>`);
  for (const [x, r] of [[124, 10], [150, 13], [172, 8]]) {
    k.add('pp-castle', `<path d="M${x} 40V${44 + r * 0.2}" stroke="${C.iron}" stroke-width="1.4"/>` + k.p(k.box(x - 1.5, 44, x + 1.5, 56), C.iron, { soft: false, j: 0.2 }) + k.disc(x, 56 + r, r, '#5a5280'));
  }
  const JAR = [C.cookie, C.teal, C.pink, C.flame, C.green];
  for (const y of [84, 132]) {
    k.shelf('pp-castle', 196, 296, y);
    for (let i = 0; i < 5; i++) k.add('pp-castle', k.bottle(208 + i * 19, y, 14, 18 + (i % 2) * 6, JAR[(i + y) % 5], { round: true, label: true }));
  }
  k.floor('pp-cloud', 238, '#3a2458', '#2c1a48', 'planks');
  // the goblins behind the table
  // two goblins behind the table, one in front by the hearth
  k.add('pp-chars', k.goblin(94, 216, 1.0, { name: 'g0', hat: true }) + k.goblin(206, 216, 1.05, { name: 'g2', coat: C.book }));
  k.piece('pp-chars', k.box(64, 212, 236, 220), C.woodL, { soft: false, j: 0.5 });
  k.piece('pp-chars', k.box(70, 220, 230, 256), C.wood, { soft: false, j: 0.5 });
  k.piece('pp-chars', k.box(76, 226, 224, 250), C.woodD, { soft: false, j: 0.4 });
  k.add('pp-chars', k.goblin(40, 286, 1.1, { name: 'g1', col: '#7fc9a0', colD: '#5aa67e', coat: C.blue }));
  k.add('pp-chars', k.goldPage(178, 208, 0.6, { rot: 72 }));
  k.add('pp-chars', k.p(k.ring(150, 210, 32, 6, 18), C.cloud, { j: 0.4 }));
  k.add('pp-chars', k.g('ck', k.cookie(136, 205, 7) + k.cookie(164, 205, 7) + k.cookie(150, 206, 7) + k.cookie(143, 197, 6.5) + k.cookie(157, 197, 6.5) + k.cookie(150, 189, 6)));
  // Pip on a stool
  k.piece('pp-chars', k.box(244, 262, 282, 268), C.woodL, { soft: false, j: 0.3 });
  k.piece('pp-chars', k.box(248, 268, 254, 298), C.wood, { soft: false, j: 0.3 });
  k.piece('pp-chars', k.box(272, 268, 278, 298), C.wood, { soft: false, j: 0.3 });
  k.add('pp-chars', k.pip(262, 263, 0.95, { flip: true }));
  let css = hop(k, 'g0', 10, 0.1) + hop(k, 'g1', 10, 0.45) + hop(k, 'g2', 10, 0.8);
  css += k.origin('ck', '50% 100%') + k.anim('ck', '0%,100%{transform:none}20%{transform:translateY(-6px) scale(1.04)}35%{transform:none}55%{transform:translateY(-4px)}70%{transform:none}', { dur: 1.4, delay: 0.9 });
  for (let i = 0; i < 3; i++) css += `.${k.cls('st' + i)}{opacity:0}` + k.anim('st' + i, '0%{opacity:0;transform:none}30%{opacity:.8}100%{opacity:0;transform:translate(6px,-40px) scale(2)}', { dur: 1.4, delay: 0.2 + i * 0.3, ease: 'ease-out' });
  css += flare(k, 'fire', 0, 1.8) + nod(k, 'pip', 0.4, 12) + tail(k, 'pip', 0.7) + shimmer(k, 'gp', 0.9);
  return k.end({ css });
};

// 10 the tower stairs: winding steps and a wall of gears with the gold page
//   caught between them; tap: the gears turn, the friends climb a step
S.stairs = function () {
  const k = K.kit(1010), C = k.C;
  k.wall('pp-sky', '#382a74', '#2c2062', 300, { row: 20 });
  k.add('pp-sky', k.glow(150, 140, 180, '#6a58b8', 0.45));
  k.archWindow('pp-sky', 246, 30, 22, 64, { bars: false, stars: true });
  // the gear chain (each gear turns the other way to its neighbour)
  const G = [[44, 60, 26, 12], [0, 0, 17, 8, 38], [0, 0, 22, 10, -18], [0, 0, 15, 8, 30], [0, 0, 20, 10, -10]];
  for (let i = 1; i < G.length; i++) {
    const [px, py, pr] = G[i - 1], r = G[i][2], a = G[i][4] * Math.PI / 180, dist = (pr + r) * 0.9;
    G[i][0] = px + Math.cos(a) * dist; G[i][1] = py + Math.sin(a) * dist;
  }
  k.add('pp-far', `<path d="M${G.map(g => f1(g[0]) + ' ' + f1(g[1])).join('L')}" stroke="${C.wallD}" stroke-width="6" stroke-linecap="round"/>`);
  let css = '';
  G.forEach(([x, y, r, n], i) => {
    k.add('pp-far', k.gear(x, y, r, n, i % 2 ? '#c9a24a' : C.brass, 'gr' + i));
    const ang = (i % 2 ? -1 : 1) * 3 * 360 / n;
    css += k.anim('gr' + i, `0%{transform:rotate(0)}100%{transform:rotate(${f1(ang)}deg)}`, { dur: 2.2 });
  });
  const last = G[G.length - 1];
  k.add('pp-castle', k.goldPage(last[0] + 24, last[1] + 30, 0.8, { rot: 18 }));
  // the lantern on a chain
  k.add('pp-trees', k.g('lant', `<path d="M212 0V56" stroke="${C.iron}" stroke-width="1.4"/>` + k.glow(212, 72, 30, '#ffd56a', 0.55) +
    k.p([[204, 58], [220, 58], [222, 82], [202, 82]], '#ffcf7a', { soft: false, j: 0.3 }) + k.p([[202, 56], [222, 56], [212, 48]], C.iron, { soft: false, j: 0.3 }) +
    k.p(k.box(200, 82, 224, 86), C.iron, { soft: false, j: 0.2 }) + `<path d="M212 58V82M204 70H220" stroke="${C.iron}" stroke-width="1.2"/>`));
  // the winding steps, highest first so the lower ones overlap
  for (let i = 6; i >= 0; i--) {
    const x0 = -4 + i * 44, top = 272 - i * 17;
    k.piece('pp-near', k.box(x0, top + 6, x0 + 48, 306), '#5d4f92', { soft: false, j: 0.5 });
    k.piece('pp-near', k.box(x0, top, x0 + 48, top + 7), '#8678b9', { soft: false, j: 0.4 });
    k.add('pp-near', `<path d="M${x0 + 6} ${top + 20}h${30}M${x0 + 18} ${top + 34}h26" stroke="#4a3e7e" stroke-width="1.4"/>`);
  }
  k.add('pp-chars', k.wizard(106, 239, 0.95));
  k.add('pp-chars', k.pip(196, 205, 0.85));
  css += k.origin('lant', '50% 0%') + k.anim('lant', '0%,100%{transform:none}25%{transform:rotate(6deg)}55%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}', { dur: 2.2 });
  css += hop(k, 'wiz', 9, 0.3) + hat(k, 'wiz', 0.4) + hop(k, 'pip', 8, 0.6) + tail(k, 'pip', 0.8) + shimmer(k, 'gp', 0.9);
  return k.end({ css });
};

// 11 the observatory: the dome opens on the stars, a brass telescope, star charts;
//   tap: the stars twinkle, a shooting star, the telescope tips up
S.observatory = function () {
  const k = K.kit(1111), C = k.C;
  k.nightSky('pp-sky', 26);
  // a constellation in the slit
  const CON = [[122, 40], [138, 24], [160, 32], [176, 18], [168, 52]];
  let cl = '';
  CON.forEach(([x, y], i) => { cl += (i ? 'L' : 'M') + x + ' ' + y; });
  k.add('pp-moon', k.g('con', `<path d="${cl}" stroke="#ffe9a0" stroke-width="1" fill="none" opacity=".7"/>`));
  CON.forEach(([x, y], i) => k.add('pp-moon', k.g('tw' + i, k.foil(x, y, 4 + (i % 2) * 1.6, { flat: true }))));
  k.add('pp-moon', k.g('ss', `<path d="M-22 -10L0 0" stroke="#fff3c4" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>` + k.foil(0, 0, 4, { flat: true })));
  // the dome with its slit
  const dome = '#2f2468';
  k.piece('pp-far', k.box(-6, -6, 110, 240), dome, { soft: false, j: 0.5 });
  k.piece('pp-far', k.box(190, -6, 306, 240), dome, { soft: false, j: 0.5 });
  k.piece('pp-far', k.box(110, 176, 190, 240), dome, { soft: false, j: 0.5 });
  k.add('pp-far', `<path d="M110 10Q40 60 -6 160M110 90Q50 120 -6 230M190 10Q260 60 306 160M190 90Q250 120 306 230" stroke="#241a56" stroke-width="2.6" fill="none"/>`);
  k.piece('pp-far', k.box(104, -6, 112, 178), C.brassD, { soft: false, j: 0.3 });
  k.piece('pp-far', k.box(188, -6, 196, 178), C.brassD, { soft: false, j: 0.3 });
  k.piece('pp-far', k.box(104, 172, 196, 180), C.brass, { soft: false, j: 0.3 });
  for (let y = 12; y < 170; y += 22) k.add('pp-far', `<circle cx="108" cy="${y}" r="1.4" fill="${C.brass}"/><circle cx="192" cy="${y}" r="1.4" fill="${C.brass}"/>`);
  k.add('pp-far', k.goldPage(150, 96, 0.9, { rot: -8 }));
  k.floor('pp-cloud', 240, '#2a1d58', '#20154a', 'planks');
  // the desk with a star chart, a globe and a candle
  k.piece('pp-near', k.box(6, 196, 96, 203), C.woodL, { soft: false, j: 0.4 });
  k.piece('pp-near', k.box(12, 203, 18, 250), C.wood, { soft: false, j: 0.3 });
  k.piece('pp-near', k.box(84, 203, 90, 250), C.wood, { soft: false, j: 0.3 });
  k.add('pp-near', `<g transform="translate(66 190) rotate(-6)">${k.p(k.box(-16, -6, 16, 6), C.page, { soft: false, j: 0.3 })}<path d="M-10 2L-3 -3L4 1L10 -2" stroke="${C.roof}" stroke-width=".8" fill="none"/></g>`);
  k.add('pp-near', k.p(k.box(26, 186, 30, 196), C.brassD, { soft: false, j: 0.2 }) + k.disc(28, 176, 11, C.teal) + `<path d="M17 176Q28 170 39 176M28 165V187" stroke="${C.tealD}" stroke-width="1.2" fill="none"/>` +
    `<path d="M16 172A13 13 0 0 1 40 180" stroke="${C.brass}" stroke-width="1.6" fill="none"/>`);
  k.add('pp-near', k.candle(88, 196, 0.7, 'flame'));
  k.add('pp-trees', k.pip(52, 198, 0.8));
  // the telescope on its tripod (tube drawn already tilted)
  const P = [206, 196], dx = -0.55, dy = -0.835, nx = 0.835, ny = -0.55;
  const at = (t, w) => [P[0] + dx * t + nx * w, P[1] + dy * t + ny * w];
  k.add('pp-chars', `<path d="M206 196L180 264M206 196L206 268M206 196L234 264" stroke="${C.iron}" stroke-width="3" stroke-linecap="round"${k.F}/>`);
  let sc = k.p([at(-30, 5), at(74, 8.5), at(74, -8.5), at(-30, -5)], C.brass, { soft: false, j: 0.3 });
  sc += k.p([at(-30, 5), at(74, 8.5), at(74, 3), at(-30, 1.6)], C.brassD, { soft: false, j: 0.2, flat: true });
  for (const t of [10, 40, 66]) sc += k.p([at(t, 9.5), at(t + 5, 9.8), at(t + 5, -9.8), at(t, -9.5)], k.GOLD, { soft: false, j: 0.2 });
  sc += k.p([at(-40, 3), at(-30, 3.2), at(-30, -3.2), at(-40, -3)], C.ink, { soft: false, j: 0.2 });
  sc += k.disc(P[0], P[1], 4, C.iron);
  k.add('pp-chars', k.g('scope', sc));
  k.add('pp-chars', k.wizard(240, 272, 0.95, { flip: true, wand: false }));
  let css = `.${k.cls('scope')}{transform-box:view-box;transform-origin:206px 196px}` + k.anim('scope', '0%,100%{transform:none}35%{transform:rotate(9deg)}65%{transform:rotate(-4deg)}', { dur: 2.2 });
  CON.forEach((c, i) => { css += k.anim('tw' + i, '0%,100%{transform:none}50%{transform:scale(1.8) rotate(45deg)}', { dur: 0.8, delay: 0.1 + i * 0.25 }); });
  css += `.${k.cls('con')}{opacity:.5}` + k.anim('con', '0%,100%{opacity:.5}50%{opacity:1}', { dur: 1.8, delay: 0.2 });
  css += `.${k.cls('ss')}{transform-box:view-box;transform-origin:0 0;opacity:0;transform:translate(118px,30px)}` + k.anim('ss', '0%{opacity:0;transform:translate(118px,30px)}15%{opacity:1}100%{opacity:0;transform:translate(196px,70px)}', { dur: 1.0, delay: 0.9, ease: 'ease-in' });
  css += hop(k, 'wiz', 5, 0.5) + hat(k, 'wiz', 0.6) + tail(k, 'pip', 0.2) + nod(k, 'pip', 0.9) + shimmer(k, 'gp', 0.9);
  return k.end({ css, sky: ['#0c0626', '#3b2a78'] });
};

// 12 the mirror hall: three gold mirrors, the wizard and Pip seen in them;
//   tap: the wizard waves (so does the reflection), light sweeps the glass
S.mirrors = function () {
  const k = K.kit(1212), C = k.C;
  k.wall('pp-sky', '#3e2e7c', '#33256a', 200);
  k.piece('pp-sky', k.box(-6, 200, 306, 238), '#5a4a9c', { soft: false, j: 0.5 });
  k.add('pp-sky', `<path d="M0 206H300M0 232H300" stroke="#4a3a8a" stroke-width="2"/>`);
  // drapes across the top
  k.piece('pp-castle', [[-6, -6], [306, -6], [306, 20], [260, 34], [200, 22], [150, 36], [100, 22], [40, 34], [-6, 20]], C.book, { j: 0.8 });
  for (const x of [40, 150, 260]) k.add('pp-castle', `<path d="M${x} 34V46" stroke="${k.GOLD}" stroke-width="2"/>` + k.disc(x, 49, 3, k.GOLD));
  k.floor('pp-cloud', 238, '#6a58b0', '#3e3080', 'checker');
  // mirrors: frame, glass, reflections and a light sweep, all clipped to the glass
  const M = [[16, 86, 58, 118, 0.75], [100, 50, 100, 170, 1], [226, 86, 58, 118, 0.75]];
  const glass = k.linear('#b7c4f4', '#6a62c0');
  const shine = [];
  M.forEach(([x, y, w, h], i) => {
    k.piece('pp-far', archPts(x - 6, y - 6, w + 12, h + 12, 14), k.GOLD, { soft: false, j: 0.5 });
    k.add('pp-far', k.foil(x + w / 2, y - 8, 6) + k.disc(x - 4, y + h + 4, 3.4, k.GOLD) + k.disc(x + w + 4, y + h + 4, 3.4, k.GOLD));
    k.add('pp-far', `<path d="${archD(x, y, w, h)}" fill="${glass}"/>`);
    shine[i] = k.clip(`<path d="${archD(x, y, w, h)}"/>`);
  });
  // reflections
  k.add('pp-far', `<g clip-path="${shine[1]}">${k.wizard(150, 214, 0.85, { name: 'wizr', wandUp: true, flip: true, opacity: 0.55 })}</g>`);
  k.add('pp-far', `<g clip-path="${shine[2]}">${k.pip(256, 200, 0.7, { name: 'pipr', opacity: 0.55 })}</g>`);
  k.add('pp-far', `<g clip-path="${shine[0]}">${k.goldPage(46, 176, 0.6, { name: 'gpr' }).replace('<g transform', '<g opacity=".6"><g transform') + '</g>'}</g>`);
  let css = '';
  M.forEach(([x, y, w, h], i) => {
    k.add('pp-far', `<g clip-path="${shine[i]}">${k.g('sh' + i, `<path d="M${x - 40} ${y + h}L${x - 10} ${y + h}L${x + 30} ${y}L${x} ${y}Z" fill="#fff" opacity=".35"/>`)}</g>`);
    css += k.anim('sh' + i, `0%{transform:none}100%{transform:translateX(${w + 50}px)}`, { dur: 1.0, delay: 0.3 + i * 0.35, ease: 'ease-in-out' });
  });
  k.add('pp-near', k.goldPage(40, 262, 0.7, { rot: -10 }));
  k.add('pp-chars', k.wizard(84, 292, 1.05, { wandUp: true }));
  k.add('pp-chars', k.pip(236, 292, 0.95, { flip: true }));
  css += wave(k, 'wiz', 0.1) + wave(k, 'wizr', 0.1) + hat(k, 'wiz', 0.3) + hat(k, 'wizr', 0.3);
  css += tail(k, 'pip', 0.4) + tail(k, 'pipr', 0.4) + shimmer(k, 'gp', 0.8) + shimmer(k, 'gpr', 0.8);
  return k.end({ css });
};

// 13 the dragon's nest: a friendly dragon on a heap of gold coins;
//   tap: it flaps its wings, wags its tail and puffs smoke rings
S.dragon = function () {
  const k = K.kit(1313), C = k.C;
  k.add('pp-sky', `<rect width="300" height="300" fill="#24183f"/>`);
  k.add('pp-sky', k.disc(150, 34, 24, k.SKY, { n: 20 }) + k.foil(144, 28, 2.4, { flat: true }) + k.foil(158, 40, 1.8, { flat: true }));
  k.add('pp-sky', k.glow(140, 230, 150, '#ffd56a', 0.25));
  // cave walls and stalactites
  k.piece('pp-far', [[-6, -6], [96, -6], [76, 40], [44, 90], [32, 160], [48, 232], [-6, 242]], '#3a2c66', { j: 1.2 });
  k.piece('pp-far', [[306, -6], [204, -6], [232, 50], [264, 100], [272, 180], [252, 236], [306, 242]], '#33275e', { j: 1.2 });
  k.piece('pp-far', [[96, -6], [204, -6], [204, 4], [188, 6], [182, 30], [174, 8], [160, 10], [150, 4], [138, 10], [128, 36], [120, 8], [96, 4]], '#2e2258', { j: 0.8 });
  for (const [x, y, s] of [[42, 120, 1], [266, 150, 0.8], [60, 214, 0.6]]) {
    k.add('pp-castle', k.glow(x, y, 22 * s, '#7fe8e0', 0.45));
    k.add('pp-castle', k.place(x, y, s, k.p([[-8, 6], [-10, -6], [-4, -18], [0, 6]], C.teal, { soft: false, j: 0.3 }) + k.p([[0, 6], [2, -22], [8, -8], [6, 6]], '#8ff0e8', { soft: false, j: 0.3 }) + k.p([[6, 6], [12, -4], [14, 6]], C.tealD, { soft: false, j: 0.3 })));
  }
  k.piece('pp-cloud', [[-6, 306], [-6, 236], [80, 232], [200, 238], [306, 234], [306, 306]], '#2a1f4e', { j: 1 });
  // the nest of sticks
  let sticks = '';
  for (let i = 0; i < 26; i++) { const a = k.rnd(-0.5, 0.5), x = 120 + i * 7 + k.rnd(-4, 4), y = 254 + k.rnd(-6, 6); sticks += `M${f1(x - 14 * Math.cos(a))} ${f1(y - 14 * Math.sin(a))}L${f1(x + 14 * Math.cos(a))} ${f1(y + 14 * Math.sin(a))}`; }
  k.add('pp-near', k.p(k.ring(210, 254, 92, 18, 20), C.woodD, { j: 1 }) + `<path d="${sticks}" stroke="${C.woodL}" stroke-width="2.4" stroke-linecap="round"${k.F}/>`);
  // the heap of coins
  k.piece('pp-near', [[64, 248], [80, 226], [100, 210], [120, 204], [140, 212], [158, 232], [166, 250]], k.GOLD, { j: 1 });
  let coins = '';
  for (let i = 0; i < 22; i++) { const x = 78 + k.R() * 80, y = 214 + k.R() * 34; if (y < 222 - Math.abs(x - 118) * 0.2) continue; coins += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="4.6" ry="2.6" fill="none" stroke="#9a7524" stroke-width=".9"/>`; }
  k.add('pp-near', coins);
  const CN = [[96, 240], [136, 236], [118, 226]];
  CN.forEach(([x, y], i) => k.add('pp-near', k.g('cn' + i, k.disc(x, y, 5, k.GOLD, { n: 12 }) + `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#9a7524" stroke-width=".8"/>`)));
  k.add('pp-near', k.goldPage(118, 196, 0.75, { rot: -10 }));
  k.add('pp-chars', k.dragon(218, 256, 1.0));
  k.add('pp-chars', k.wizard(46, 286, 0.95, { wandUp: true }));
  k.add('pp-chars', k.pip(90, 290, 0.8));
  // smoke rings from the dragon's nose (hidden until the tap)
  let rings = '', css = '';
  for (let i = 0; i < 3; i++) {
    rings += k.g('sr' + i, `<ellipse cx="160" cy="190" rx="6" ry="4" fill="none" stroke="${C.cloud}" stroke-width="2"/>`);
    css += `.${k.cls('sr' + i)}{opacity:0}` + k.anim('sr' + i, '0%{opacity:0;transform:none}20%{opacity:.9}100%{opacity:0;transform:translate(-26px,-50px) scale(2.4)}', { dur: 1.1, delay: 0.7 + i * 0.3, ease: 'ease-out' });
  }
  k.add('pp-pages', rings);
  css += k.origin('dragon-wing', '10% 100%') + k.anim('dragon-wing', '0%,100%{transform:none}15%,45%,75%{transform:rotate(-14deg) scaleY(1.1)}30%,60%,90%{transform:rotate(6deg) scaleY(.85)}', { dur: 2.2 });
  css += k.origin('dragon-tail', '0% 60%') + k.anim('dragon-tail', '0%,100%{transform:none}20%,60%{transform:rotate(-10deg)}40%,80%{transform:rotate(8deg)}', { dur: 2.2 });
  css += k.origin('dragon-head', '90% 100%') + k.anim('dragon-head', '0%,100%{transform:none}25%{transform:rotate(6deg)}45%{transform:rotate(-4deg)}', { dur: 1.6, delay: 0.3 });
  CN.forEach((c, i) => { css += hop(k, 'cn' + i, 8, 0.2 + i * 0.2, 0.6); });
  css += wave(k, 'wiz', 0.1) + hat(k, 'wiz', 0.3) + nod(k, 'pip', 0.5) + tail(k, 'pip', 0.2) + shimmer(k, 'gp', 1.0);
  return k.end({ css });
};

// 14 the big spell: the whole book again, wand up on the hill below the castle;
//   tap: fireworks burst over the castle
S.fireworks = function () {
  const k = K.kit(1414), C = k.C;
  k.nightSky('pp-sky', 12, [244, 60, 44]);
  k.moon(244, 60, 24);
  k.piece('pp-far', k.wave(176, 22, 18, 3), C.far, { j: 1 });
  k.add('pp-castle', k.castle(190, 182, 1));
  scallop(k, 'pp-cloud', 196, 11, 5, C.cloudD);
  scallop(k, 'pp-cloud', 204, 9, 9, C.cloud);
  k.piece('pp-near', [[-6, 300], [-6, 214], [40, 210], [90, 212], [135, 214], [175, 222], [230, 228], [306, 224], [306, 300]], C.near, { j: 1 });
  k.piece('pp-near', [[-6, 300], [-6, 236], [60, 232], [140, 238], [220, 244], [306, 238], [306, 300]], C.nearD, { j: 1 });
  for (const [x, b, h] of [[252, 232, 46], [272, 230, 60], [292, 232, 40], [16, 220, 34]]) k.add('pp-trees', k.pine(x, b, h));
  // the stone with the finished book, open and glowing
  k.piece('pp-chars', k.box(184, 222, 210, 236), C.stone, { soft: false, j: 0.5 });
  k.piece('pp-chars', k.box(198, 222, 210, 236), C.stoneD, { soft: false, j: 0.3 });
  k.add('pp-chars', k.g('bglow', k.glow(197, 206, 34, '#ffe48a', 0.6)));
  k.add('pp-chars', k.spellbook(197, 220, 0.8, { open: true }));
  k.add('pp-chars', k.wizard(92, 232, 1.1, { wandUp: true }));
  k.add('pp-chars', k.pip(146, 236, 1.0, { flip: true }));
  // fireworks: a spark rises from the wand, then the burst opens
  const FW = [[70, 70, '#ffd76a'], [150, 46, '#f07fb0'], [212, 108, '#7fe0d0'], [112, 116, '#b9a6ee'], [196, 30, '#ffd76a'], [40, 128, '#7fdc6a']];
  const TIP = [110, 163];                 // the raised wand's star
  let fw = '', css = '';
  FW.forEach(([x, y, col], i) => {
    const d = 0.35 + i * 0.3, dur = Math.min(1.0, PLAY - d);
    let b = '';
    for (let j = 0; j < 12; j++) { const a = j / 12 * 6.2832; b += `M${f1(x + Math.cos(a) * 5)} ${f1(y + Math.sin(a) * 5)}L${f1(x + Math.cos(a) * 20)} ${f1(y + Math.sin(a) * 20)}`; }
    let dots = '';
    for (let j = 0; j < 12; j++) { const a = (j + 0.5) / 12 * 6.2832; dots += `<circle cx="${f1(x + Math.cos(a) * 25)}" cy="${f1(y + Math.sin(a) * 25)}" r="1.8" fill="${col}"/>`; }
    fw += k.g('fw' + i, `<path d="${b}" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>${dots}` + k.foil(x, y, 5, { flat: true }));
    css += `.${k.cls('fw' + i)}{opacity:0}` + k.anim('fw' + i, '0%{opacity:0;transform:scale(.1)}15%{opacity:1}60%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.15)}', { dur, delay: d, ease: 'ease-out' });
    fw += k.g('tr' + i, k.foil(0, 0, 2.6, { flat: true }));
    css += `.${k.cls('tr' + i)}{transform-box:view-box;transform-origin:0 0;opacity:0;transform:translate(${TIP[0]}px,${TIP[1]}px)}` +
      k.anim('tr' + i, `0%{opacity:1;transform:translate(${TIP[0]}px,${TIP[1]}px)}90%{opacity:1}100%{opacity:0;transform:translate(${x}px,${y}px)}`, { dur: 0.33, delay: d - 0.33, ease: 'ease-out' });
  });
  k.add('pp-pages', fw);
  css += wave(k, 'wiz', 0) + hat(k, 'wiz', 0.3) + nod(k, 'pip', 0.4, 14) + tail(k, 'pip', 0.6);
  css += k.anim('bglow', '0%,100%{opacity:1;transform:none}50%{opacity:1;transform:scale(1.5)}', { dur: 2.2 });
  return k.end({ css });
};

window.SPELLBOOK_SCENES = S;
})();
