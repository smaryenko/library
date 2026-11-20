// THE TOY SHOP AFTER MIDNIGHT: the puzzles for the shared minigame kit
// (assets/js/minigame.js). Each generator is (seed, ctx) => spec and draws
// everything from ctx.rng, so ↻ gives new numbers, a new maze or a new order.
// The detour pages (h-attic, u-dark) get the bigger 7x7 maze. The small task
// art is flat shapes in the toy palette (no filters: there can be many of
// them in one panel).
(function () {
'use strict';
const C = window.TOYS.C;
const gearD = window.TOYS.gearD;
const f1 = window.DRAWKIT.f1;
const T = {};

// ---- helpers ------------------------------------------------------------------------------
const int = (R, a, b) => a + Math.floor(R() * (b - a + 1));
function shuffle(R, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
const svg = (vb, inner, style = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${style ? ` style="${style}"` : ''}>${inner}</svg>`;
const txt = (x, y, s, size = 14, fill = C.ink) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-weight="800" font-family="inherit" text-anchor="middle" dominant-baseline="central" fill="${fill}">${s}</text>`;
function numberOptions(R, ans, n = 4, min = 1) {
  const set = new Set([ans]);
  for (const v of shuffle(R, [ans - 1, ans + 1, ans - 2, ans + 2, ans + 3])) { if (set.size >= n) break; if (v >= min) set.add(v); }
  for (let v = ans + 4; set.size < n; v++) set.add(v);
  return shuffle(R, [...set]).map(v => ({ html: `<b style="font-size:1.4em">${v}</b>`, ok: v === ans }));
}
const star5 = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr); } return d + 'Z'; };
// shapes for the jigsaw gaps (path d centred on cx, cy, radius r)
function shapeD(kind, cx, cy, r) {
  const pt = (x, y) => `${f1(cx + x * r)} ${f1(cy + y * r)}`;
  if (kind === 'star') return star5(cx, cy, r);
  if (kind === 'moon') return `M${pt(0.3, -0.95)}A${f1(r)} ${f1(r)} 0 1 0 ${pt(0.3, 0.95)}A${f1(r * 1.1)} ${f1(r * 1.1)} 0 0 1 ${pt(0.3, -0.95)}Z`;
  if (kind === 'heart') return `M${pt(0, 0.95)}C${pt(-1.3, 0)} ${pt(-0.7, -1.1)} ${pt(0, -0.45)}C${pt(0.7, -1.1)} ${pt(1.3, 0)} ${pt(0, 0.95)}Z`;
  if (kind === 'triangle') return `M${pt(0, -1)}L${pt(0.95, 0.8)}L${pt(-0.95, 0.8)}Z`;
  if (kind === 'square') return `M${pt(-0.8, -0.8)}L${pt(0.8, -0.8)}L${pt(0.8, 0.8)}L${pt(-0.8, 0.8)}Z`;
  return `M${pt(1, 0)}A${f1(r)} ${f1(r)} 0 1 1 ${pt(-1, 0)}A${f1(r)} ${f1(r)} 0 1 1 ${pt(1, 0)}Z`;
}
const SHAPES = ['star', 'moon', 'heart', 'triangle', 'square', 'circle'];

// shrink: just tap the picture
T.shrink = () => ({
  kind: 'tap',
  prompt: 'Tap the picture to shrink to toy size!',
  hint: 'Tap anywhere on the picture.'
});

// h-theatre: which curtain hides the gear? the one with a + b stars
function curtainSvg(n) {
  let s = `<rect x="2" y="2" width="56" height="66" rx="3" fill="#8e2a22"/><rect x="8" y="12" width="44" height="52" fill="${C.red}"/>`;
  for (let x = 13; x < 52; x += 8) s += `<path d="M${x} 13V63" stroke="#7a0c14" stroke-width="2.4" opacity=".6"/>`;
  s += `<path d="M4 6H56V14H4Z" fill="#a8121c"/><path d="M4 6H56" stroke="${C.gold}" stroke-width="2"/>`;
  const cols = n > 4 ? 3 : 2, rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const rowN = Math.min(cols, n - r * cols);
    const x = 30 + (c - (rowN - 1) / 2) * 13, y = 38 + (r - (rows - 1) / 2) * 13;
    s += `<path d="${star5(x, y, 5.4)}" fill="${C.gold}" stroke="${C.goldD}" stroke-width=".6"/>`;
  }
  return svg('0 0 60 70', s, 'max-height:11vh');
}
T.theatre = (seed, ctx) => {
  const R = ctx.rng;
  const target = int(R, 3, 7);
  const a = int(R, 1, target - 1), b = target - a;
  const counts = new Set([target]);
  for (const v of shuffle(R, [target - 1, target + 1, target - 2, target + 2])) { if (counts.size >= 3) break; if (v >= 1 && v <= 9) counts.add(v); }
  const options = shuffle(R, [...counts]).map(v => ({ html: curtainSvg(v), ok: v === target }));
  const art = svg('0 0 200 70', `<path d="M40 64L52 30L64 64Z" fill="${C.purple}"/><circle cx="52" cy="22" r="10" fill="${C.skin}"/><path d="M42 20C42 8 62 8 62 20C58 15 46 15 42 20Z" fill="${C.yarn}"/>` +
    `<circle cx="48.6" cy="22.4" r="1.3" fill="${C.ink}"/><circle cx="55.4" cy="22.4" r="1.3" fill="${C.ink}"/><path d="M48.6 26.6Q52 29 55.4 26.6" stroke="#c4505a" stroke-width="1.2" fill="none"/>` +
    `<path d="M76 10H184Q192 10 192 18V44Q192 52 184 52H96L82 62L86 52H84Q76 52 76 44V18Q76 10 84 10Z" fill="#fff8ea" stroke="#e6d8bd" stroke-width="1.4"/>` +
    `<path d="${star5(100, 31, 8)}" fill="${C.gold}"/>` + txt(140, 31, `${a} + ${b}`, 18), 'max-height:12vh');
  return {
    kind: 'choice', prompt: `The puppet whispers: the gear is behind the curtain with ${a} + ${b} stars.`,
    art, options, cols: 3,
    hint: `${a} + ${b}: start at ${a} and count on ${b} more. Then count the stars on each curtain.`
  };
};

// h-jigsaw: drag each piece into the gap with the same shape
T.jigsaw = (seed, ctx) => {
  const R = ctx.rng;
  const n = R() < 0.5 ? 3 : 4;
  const shapes = shuffle(R, SHAPES).slice(0, n);
  const cols = shuffle(R, [C.jackB, C.green, C.jackY, C.jackR, C.purple, C.felt]);
  const knobs = (x0, x1, fill) => `<path d="M${x0} 14H${x0 + 18}A5 5 0 0 0 ${x0 + 28} 14H${x1}V46H${x0 + 28}A5 5 0 0 1 ${x0 + 18} 46H${x0}Z" fill="${fill}"/>`;
  const slots = shapes.map(s => ({ key: s, html: svg('0 0 60 60', knobs(6, 54, '#4a2a16') + `<path d="${shapeD(s, 30, 30, 11)}" fill="#1a0d06" stroke="${C.gold}" stroke-width="1.4" stroke-dasharray="3 2"/>`, 'max-height:8vh') }));
  const pieces = shuffle(R, shapes).map(s => ({
    key: s,
    html: svg('0 0 60 60', knobs(6, 54, cols[shapes.indexOf(s)]) + `<path d="M6 14H54" stroke="#fff" stroke-width="1.4" opacity=".35"/><path d="${shapeD(s, 30, 30, 11)}" fill="#fff" opacity=".85"/>`, 'max-height:7vh')
  }));
  return {
    kind: 'drag', prompt: 'Mend the bridge: put each jigsaw piece into the gap with the same shape.',
    slots: shuffle(R, slots), pieces,
    hint: 'Look at the white shape on each piece and find the gap with the same shape.'
  };
};

// mazes ------------------------------------------------------------------------------------
const boatMark = (x, y) => `<path d="M${f1(x - 0.38)} ${f1(y + 0.05)}Q${x} ${f1(y + 0.42)} ${f1(x + 0.38)} ${f1(y + 0.05)}Z" fill="#c9a06a"/>` +
  `<path d="M${f1(x)} ${f1(y + 0.05)}V${f1(y - 0.4)}" stroke="#8a6038" stroke-width=".05"/><path d="M${f1(x + 0.03)} ${f1(y - 0.38)}V${f1(y - 0.02)}L${f1(x + 0.3)} ${f1(y - 0.05)}Z" fill="#fff8ea"/>`;
const sparkMark = (fill = '#ffd23a') => (x, y) => `<circle cx="${x}" cy="${y}" r=".36" fill="${fill}" opacity=".35"/><path d="${star5(x, y, 0.3)}" fill="${fill}"/>`;
const keyMark = (x, y) => `<circle cx="${x}" cy="${y}" r=".38" fill="#ffe48a" opacity=".45"/><path d="M${f1(x - 0.3)} ${y}C${f1(x - 0.3)} ${f1(y - 0.3)} ${f1(x + 0.05)} ${f1(y - 0.34)} ${f1(x + 0.05)} ${f1(y - 0.12)}C${f1(x + 0.05)} ${f1(y - 0.04)} ${f1(x - 0.08)} ${y} ${f1(x - 0.18)} ${y}C${f1(x - 0.08)} ${y} ${f1(x + 0.05)} ${f1(y + 0.04)} ${f1(x + 0.05)} ${f1(y + 0.12)}C${f1(x + 0.05)} ${f1(y + 0.34)} ${f1(x - 0.3)} ${f1(y + 0.3)} ${f1(x - 0.3)} ${y}Z" fill="${C.gold}"/><rect x="${f1(x - 0.42)}" y="${f1(y - 0.04)}" width=".14" height=".08" fill="${C.goldD}"/>`;
const torchMark = (x, y) => `<path d="M${f1(x - 0.3)} ${f1(y - 0.1)}L${f1(x + 0.12)} ${f1(y - 0.16)}V${f1(y + 0.16)}L${f1(x - 0.3)} ${f1(y + 0.1)}Z" fill="${C.jackR}"/><rect x="${f1(x + 0.1)}" y="${f1(y - 0.2)}" width=".12" height=".4" fill="${C.steel}"/><path d="M${f1(x + 0.22)} ${f1(y - 0.12)}L${f1(x + 0.44)} ${f1(y - 0.3)}V${f1(y + 0.3)}L${f1(x + 0.22)} ${f1(y + 0.12)}Z" fill="#fff0c0" opacity=".8"/>`;
function maze(R, n, o) {
  return Object.assign({ kind: 'maze', cols: n, rows: n, seed: Math.floor(R() * 1e9) + 1, start: [0, 0], goal: [n - 1, n - 1] }, o);
}
// u-boat: steer the cork boat across the spilled water
T.boat = (seed, ctx) => maze(ctx.rng, ctx.rng() < 0.5 ? 5 : 6, {
  prompt: 'Steer the cork boat across the spilled water to the shining marbles.',
  color: '#6e3f20', floor: '#cfe6f2', pathColor: '#ff7a3d', startSvg: boatMark, goalSvg: sparkMark(),
  hint: 'Slide your finger from the boat along the open water. If a plank is in the way, go back and try another way.'
});
// h-attic: the bigger maze through the dark attic of boxes
T.attic = (seed, ctx) => maze(ctx.rng, 7, {
  prompt: 'Find the way through the boxes in the dark attic, to the winding key.',
  color: '#6a4a2a', floor: '#ecdcbc', pathColor: '#e8742a', startSvg: torchMark, goalSvg: keyMark,
  hint: 'Start at the torch. Follow one open path; when it ends, go back to the last turn and try the other way.'
});
// u-dark: the bigger maze through the dark tunnel
T.dark = (seed, ctx) => maze(ctx.rng, 7, {
  prompt: 'Follow the glowing stars through the dark tunnel to the way out.',
  color: '#c9b6e8', floor: '#2e2236', pathColor: '#ffd76a', startSvg: torchMark, goalSvg: sparkMark('#d8f5a0'),
  hint: 'Start at the torch. Try one path at a time; dead ends are fine, just slide back.'
});

// u-marbles: count the marbles of one colour
const MCOL = [['red', '#d23a3a'], ['blue', '#3d6fa8'], ['green', '#3fbf6a'], ['yellow', '#f2c230']];
T.marbles = (seed, ctx) => {
  const R = ctx.rng;
  const [name, col] = MCOL[Math.floor(R() * MCOL.length)];
  const want = int(R, 4, 9), others = int(R, 6, 10);
  const list = shuffle(R, [...Array(want).fill(col), ...Array.from({ length: others }, () => { let c; do { c = MCOL[Math.floor(R() * MCOL.length)][1]; } while (c === col); return c; })]);
  const pts = [];
  for (let tries = 0; pts.length < list.length && tries < 4000; tries++) {
    const x = 14 + R() * 172, y = 14 + R() * 82;
    if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 17)) pts.push([x, y]);
  }
  const count = list.slice(0, pts.length).filter(c => c === col).length;
  let inner = `<rect width="200" height="110" rx="10" fill="#3a2416"/>`;
  pts.forEach(([x, y], i) => {
    inner += `<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="${list[i]}"/><path d="M${f1(x - 4)} ${f1(y + 0.6)}Q${f1(x)} ${f1(y - 3)} ${f1(x + 4)} ${f1(y + 1)}" stroke="#fff" stroke-width="1.4" fill="none" opacity=".5"/><circle cx="${f1(x - 2.4)}" cy="${f1(y - 2.6)}" r="1.6" fill="#fff" opacity=".8"/>`;
  });
  return {
    kind: 'choice', prompt: `The comb tooth is hidden in the ${name} marbles. How many ${name} marbles are there?`,
    art: svg('0 0 200 110', inner), options: numberOptions(R, count), cols: 4,
    hint: `Count only the ${name} ones. Point at each one as you count.`
  };
};

// hide-march: tap the toys into marching order, smallest first
function marchToy(h, coat) {
  const s = h / 60, y0 = 64 - h;
  const g = `<g transform="translate(15 ${f1(y0)}) scale(${f1(s * 100) / 100})">` +
    `<path d="M-6 13C-7 4 -5 -2 0 -2C5 -2 7 4 6 13Z" fill="${C.black}"/><circle cx="0" cy="16" r="4.6" fill="${C.skin}"/>` +
    `<circle cx="-1.7" cy="15.6" r=".8" fill="${C.black}"/><circle cx="1.7" cy="15.6" r=".8" fill="${C.black}"/><path d="M-1.6 18Q0 19.4 1.6 18" stroke="${C.redD}" stroke-width=".7" fill="none"/>` +
    `<path d="M-7 21H7V40H-7Z" fill="${coat}"/><path d="M-6.4 21.6L6.4 39M6.4 21.6L-6.4 39" stroke="#fff" stroke-width="1.6"/>` +
    `<path d="M-4 40V60M4 40V60" stroke="${C.black}" stroke-width="3.4"/><ellipse cx="0" cy="61" rx="8" ry="2" fill="${C.black}"/></g>`;
  return svg('0 0 30 66', g, 'max-height:12vh');
}
T.march = (seed, ctx) => {
  const R = ctx.rng;
  const n = R() < 0.5 ? 4 : 5;
  const heights = shuffle(R, [22, 30, 38, 46, 54, 62]).slice(0, n);
  const coats = [C.red, C.jackB, C.green, C.purple, C.jackR, C.felt];
  const items = heights.map((h, i) => ({ html: marchToy(h, coats[i % coats.length]) }));
  const order = heights.map((h, i) => [h, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return {
    kind: 'order', prompt: 'Line up for the march: tap the toys from the smallest to the biggest.',
    items, order, cols: n,
    hint: 'Find the very smallest toy first, then the next one up, and so on.'
  };
};

// hide-freeze: copy the statue pose: which ballerina matches?
function poseSvg(arm, leg) {
  let s = `<circle cx="30" cy="14" r="5" fill="${C.porc}" stroke="${C.porcD}" stroke-width=".6"/><circle cx="30" cy="8.4" r="2.4" fill="${C.bun}"/>`;
  s += `<path d="M26.5 19H33.5L32.5 30H27.5Z" fill="${C.tutuD}"/><ellipse cx="30" cy="30" rx="13" ry="3.6" fill="${C.tutu}"/>`;
  const A = { up: 'M27 20C20 16 21 6 27 4M33 20C40 16 39 6 33 4', out: 'M27 20Q18 19 11 23M33 20Q42 19 49 23', one: 'M27 20C20 16 21 6 27 4M33 20Q42 19 49 23', low: 'M27 20Q21 26 19 32M33 20Q39 26 41 32' }[arm];
  s += `<path d="${A}" stroke="${C.porcD}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const L = { pointe: 'M29 33V56M31 33V56', passe: 'M29.4 33V56M30.6 33L38 41L31 45', arabesque: 'M29.4 33V56M30.6 33L50 30' }[leg];
  s += `<path d="${L}" stroke="${C.tights}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<ellipse cx="30" cy="58" rx="9" ry="2.4" fill="${C.gold}"/>`;
  return s;
}
T.freeze = (seed, ctx) => {
  const R = ctx.rng;
  const arms = ['up', 'out', 'one', 'low'], legs = ['pointe', 'passe', 'arabesque'];
  const all = [];
  for (const a of arms) for (const l of legs) all.push([a, l]);
  const pool = shuffle(R, all);
  const target = pool[0];
  // distractors: close ones first (same arms or same legs), then any
  const near = pool.slice(1).filter(p => p[0] === target[0] || p[1] === target[1]);
  const opts = [target, ...near.slice(0, 3)];
  const options = shuffle(R, opts).map(p => ({ html: svg('0 0 60 62', poseSvg(p[0], p[1]), 'max-height:11vh'), ok: p === target }));
  const art = svg('0 0 200 66', `<rect width="200" height="66" rx="10" fill="#f6e6c8"/><g transform="translate(70 2)">${poseSvg(target[0], target[1])}</g>` + txt(150, 33, 'Freeze!', 16, C.boxD), 'max-height:12vh');
  return {
    kind: 'choice', prompt: 'Freeze like a statue! Which ballerina is in exactly the same pose?',
    art, options, cols: 2,
    hint: 'Look at the arms first, then at the legs. Both must match.'
  };
};

// fix: drag the key, the gear and the tooth onto their places on the music box
T.fix = (seed, ctx) => {
  const R = ctx.rng;
  const ST = 'max-height:8vh';
  const slotArt = {
    key: svg('0 0 60 50', `<rect x="2" y="6" width="34" height="38" rx="3" fill="${C.box}"/><path d="M36 10L44 4V40L36 44Z" fill="${C.boxD}"/><rect x="44" y="21" width="8" height="4" fill="#2a140a"/><path d="M50 12C58 14 58 32 50 34" stroke="${C.gold}" stroke-width="1.4" stroke-dasharray="3 2" fill="none"/>`, ST),
    gear: svg('0 0 60 50', `<rect x="4" y="6" width="52" height="38" rx="3" fill="${C.box}"/><circle cx="30" cy="25" r="14" fill="${C.gold}"/><circle cx="30" cy="25" r="11.5" fill="#2a140a"/><circle cx="30" cy="25" r="9" fill="none" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="3 2"/>`, ST),
    tooth: svg('0 0 60 50', `<rect x="4" y="6" width="52" height="38" rx="3" fill="#3a1a0c"/><rect x="38" y="10" width="16" height="30" rx="1.5" fill="${C.steel}"/>` +
      Array.from({ length: 7 }, (_, i) => i === 3 ? `<rect x="10" y="${f1(12 + i * 4)}" width="28" height="2.4" fill="none" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="2 1.4"/>` : `<rect x="10" y="${f1(12 + i * 4)}" width="28" height="2.4" fill="${C.steel}"/>`).join(''), ST)
  };
  const pieceArt = {
    key: svg('0 0 60 40', `<rect x="4" y="18" width="14" height="4" fill="${C.goldD}"/><path d="M16 20C16 6 40 3 40 13C40 17 30 18.6 24 20C30 21.4 40 23 40 27C40 37 16 34 16 20Z" fill="${C.gold}" stroke="${C.goldD}" stroke-width="1"/><circle cx="32" cy="13" r="2" fill="${C.goldD}"/><circle cx="32" cy="27" r="2" fill="${C.goldD}"/>`, 'max-height:7vh'),
    gear: svg('0 0 40 40', `<path d="${gearD(20, 20, 16, 10)}" fill="${C.gold}" stroke="${C.goldD}" stroke-width="1"/><circle cx="20" cy="20" r="5" fill="${C.goldD}"/>`, 'max-height:7vh'),
    tooth: svg('0 0 60 20', `<rect x="4" y="6" width="52" height="8" rx="3" fill="${C.steel}" stroke="${C.steelD}" stroke-width="1"/><rect x="10" y="8" width="30" height="1.6" fill="#fff"/>`, 'max-height:5vh')
  };
  const keys = ['key', 'gear', 'tooth'];
  return {
    kind: 'drag', prompt: 'Mend the music box: put the key, the gear and the comb tooth back in their places.',
    slots: shuffle(R, keys).map(k => ({ key: k, html: slotArt[k] })),
    pieces: shuffle(R, keys).map(k => ({ key: k, html: pieceArt[k] })),
    hint: 'The key goes in the little hole on the side, the gear in the round window, the tooth in the gap in the comb.'
  };
};

window.TOYSHOP_TASKS = T;
})();
