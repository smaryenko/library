// THE LITTLE WIZARD'S LOST SPELLBOOK: one puzzle per page for the shared
// minigame kit (assets/js/minigame.js). Each generator is (seed, ctx) => spec
// and draws everything from ctx.rng (so ↻ gives new numbers), with the
// difficulty rising through the book with ctx.level (0..1). The small task
// art is flat card shapes in the book's palette (no filters: there can be
// many of them in one panel).
(function () {
'use strict';
const PAPER = window.PAPER;
const C = PAPER.C;
const f1 = window.DRAWKIT.f1;
const GOLD = '#e7bf55', GOLD_D = '#a87a2a';
const T = {};

// ---- helpers ------------------------------------------------------------------------------
const int = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
function shuffle(R, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
const svg = (vb, inner, style = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${style ? ` style="${style}"` : ''}>${inner}</svg>`;
const num = (x, y, n, size = 14, fill = C.ink) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-weight="800" font-family="inherit" text-anchor="middle" dominant-baseline="central" fill="${fill}">${n}</text>`;
const star4 = (cx, cy, r, fill = GOLD) => {
  let d = '';
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 - Math.PI / 2, rr = i % 2 ? r * 0.34 : r; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr); }
  return `<path d="${d}Z" fill="${fill}"/>`;
};
// number options: the answer plus close distractors (all distinct, >= min)
function numberOptions(R, ans, n = 4, min = 1) {
  const set = new Set([ans]);
  const near = shuffle(R, [ans - 1, ans + 1, ans - 2, ans + 2, ans + 3, ans - 3]);
  for (const v of near) { if (set.size >= n) break; if (v >= min) set.add(v); }
  for (let v = ans + 4; set.size < n; v++) set.add(v);
  return shuffle(R, [...set]).map(v => ({ html: `<b style="font-size:1.4em">${v}</b>`, ok: v === ans }));
}
// a little flat spellbook page card
const pageCard = (x, y, w, h, inner = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.page}" stroke="${GOLD_D}" stroke-width="1.2"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${f1(h * 0.16)}" rx="2" fill="${GOLD}"/>${inner}`;

// 1 intro: just tap Pip in the picture
T.intro = () => ({
  kind: 'tap',
  prompt: 'Tap Pip!',
  hit: [180, 138, 50, 50],          // Pip on the window sill (scenes.js: pip(204, 180, 0.85))
  hint: 'Tap the picture: Pip is the ginger cat by the window.'
});

// 2 potion: pick 2 bottles whose drops add up to the recipe
function bottleSvg(v, col) {
  return svg('0 0 40 56', `<path d="M8 54V24L15 18V8H25V18L32 24V54Z" fill="${col}"/>` +
    `<rect x="14" y="3" width="12" height="7" rx="1.5" fill="${C.woodL}"/>` +
    `<path d="M12 28V44" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>` +
    `<rect x="12" y="30" width="16" height="18" rx="2" fill="${C.page}"/>` + num(20, 39.5, v, 13));
}
T.potion = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const N = int(R, 6 + Math.round(L * 2), 12);
  const nB = L > 0.5 ? 6 : int(R, 5, 6);
  const a = int(R, 1, N - 1), b = N - a;
  const vals = [{ v: a, key: 0 }, { v: b, key: 1 }];
  // extra bottles: always fewer drops than the recipe (a bottle of N, or more,
  // is not "two that add up to N")
  while (vals.length < nB) vals.push({ v: int(R, 1, N - 1), key: -1 });
  const order = shuffle(R, vals);
  const cols = [C.pink, C.teal, C.green, C.blue, '#c9a0f0', C.red];
  const items = order.map((o, i) => ({ html: bottleSvg(o.v, cols[i % cols.length]), value: o.v }));
  const answer = [order.findIndex(o => o.key === 0), order.findIndex(o => o.key === 1)];
  const art = svg('0 0 200 90', `<ellipse cx="70" cy="56" rx="40" ry="28" fill="#211a42"/><ellipse cx="70" cy="34" rx="42" ry="8" fill="#2e2658"/>` +
    `<ellipse cx="70" cy="34" rx="35" ry="5.5" fill="#6fe08a"/><circle cx="58" cy="26" r="4" fill="#b6f5bf"/><circle cx="80" cy="20" r="3" fill="#b6f5bf"/>` +
    `<path d="M120 46q8 -18 18 -2q-9 14 -18 2z" fill="${C.blue}"/>` + num(168, 44, N, 30, C.ink) + `<text x="168" y="74" font-size="12" font-weight="700" text-anchor="middle" fill="${C.ink}">drops</text>`, 'max-height:16vh');
  return {
    kind: 'pick', prompt: `The potion needs ${N} drops. Pick 2 bottles that add up to ${N}.`,
    art, items, target: N, count: 2, answer, cols: 3,
    hint: `Try one bottle, then look for the number that makes ${N} with it.`
  };
};

// 3 library: count the flying books
function flyBookSvg(x, y, col, rot) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M-12 -1L-1 2V-7L-12 -10Z" fill="${col}"/><path d="M12 -1L1 2V-7L12 -10Z" fill="${col}"/>` +
    `<path d="M-10 -2L0 1L10 -2V-9L0 -6L-10 -9Z" fill="${C.page}"/><path d="M0 1V-6" stroke="${C.roof}" stroke-width=".8"/></g>`;
}
T.library = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const n = int(R, 5, Math.min(14, 9 + Math.round(L * 5)));
  const pts = [];
  for (let tries = 0; pts.length < n && tries < 2000; tries++) {
    const x = 16 + R() * 168, y = 16 + R() * 92;
    if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 24)) pts.push([x, y]);
  }
  const cols = [C.red, C.blue, C.green, C.teal, C.pink, C.book, C.robe];
  let inner = `<rect width="200" height="120" rx="10" fill="${C.wall}"/>`;
  pts.forEach(([x, y], i) => { inner += flyBookSvg(x, y, cols[i % cols.length], (R() - 0.5) * 40); });
  const count = pts.length;
  return {
    kind: 'choice', prompt: 'How many books are flying?',
    art: svg('0 0 200 120', inner), options: numberOptions(R, count), cols: 4,
    hint: 'Count them one by one, from left to right, and point at each one.'
  };
};

// 4 corridors: trace the maze from the hat to the gold page
T.corridor = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const size = 5 + Math.round(L * 2 + R() * 0.6);
  const n = Math.min(7, size);
  return {
    kind: 'maze', prompt: 'Find the way through the corridors to the gold page.',
    cols: n, rows: n, seed: Math.floor(R() * 1e9) + 1, start: [0, 0], goal: [n - 1, n - 1],
    color: C.wall, pathColor: '#ff9a3a',
    startSvg: (x, y) => `<path d="M${f1(x - 0.38)} ${f1(y + 0.3)}H${f1(x + 0.38)}L${f1(x + 0.12)} ${f1(y - 0.1)}L${f1(x + 0.06)} ${f1(y - 0.36)}L${f1(x + 0.32)} ${f1(y - 0.42)}L${f1(x - 0.08)} ${f1(y - 0.3)}Z" fill="${C.robe}"/>` +
      `<rect x="${f1(x - 0.4)}" y="${f1(y + 0.22)}" width=".8" height=".14" fill="${GOLD}"/>`,
    goalSvg: (x, y) => `<rect x="${f1(x - 0.26)}" y="${f1(y - 0.34)}" width=".52" height=".68" rx=".05" fill="${C.page}" stroke="${GOLD_D}" stroke-width=".06"/>` +
      `<rect x="${f1(x - 0.26)}" y="${f1(y - 0.34)}" width=".52" height=".14" fill="${GOLD}"/>`,
    hint: 'Slide your finger from the hat along the open paths. If you hit a wall, go back and try another way.'
  };
};

// 5 locked door: drag each key into the keyhole with its shape
T.door = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const n = L > 0.35 ? 4 : 3;
  const shapes = shuffle(R, PAPER.SHAPES).slice(0, n);
  const slots = shapes.map(s => ({ key: s, html: svg('0 0 40 40', `<rect width="40" height="40" rx="6" fill="${C.wood}"/><path d="${PAPER.shapeD(s, 20, 20, 13)}" fill="${C.ink}" stroke="${C.woodD}" stroke-width="1.5"/>`, 'max-height:7vh') }));
  const pieces = shuffle(R, shapes).map(s => ({
    key: s,
    html: svg('0 0 56 32', `<rect x="26" y="13" width="26" height="6" rx="2" fill="${GOLD_D}"/><rect x="42" y="19" width="4" height="7" fill="${GOLD_D}"/><rect x="48" y="19" width="4" height="9" fill="${GOLD_D}"/>` +
      `<path d="${PAPER.shapeD(s, 16, 16, 13)}" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5"/>`, 'max-height:6vh')
  }));
  return {
    kind: 'drag', prompt: 'Put each key into the keyhole with the same shape.',
    slots: shuffle(R, slots), pieces,
    hint: 'Look at the end of each key: a star key fits the star hole.'
  };
};

// 6 paper-bird post: which bird carries the letter for this time?
function clockSvg(cx, cy, r, h, m) {
  const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r + 2.5}" fill="${GOLD}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.page}"/>`;
  let d = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? r * 0.82 : r * 0.7; d += `M${f1(cx + Math.sin(a) * r0)} ${f1(cy - Math.cos(a) * r0)}L${f1(cx + Math.sin(a) * r * 0.94)} ${f1(cy - Math.cos(a) * r * 0.94)}`; }
  s += `<path d="${d}" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `<path d="M${cx} ${cy}L${f1(cx + Math.sin(ma) * r * 0.8)} ${f1(cy - Math.cos(ma) * r * 0.8)}" stroke="${C.roof}" stroke-width="1.8" stroke-linecap="round"/>`;
  s += `<path d="M${cx} ${cy}L${f1(cx + Math.sin(ha) * r * 0.5)} ${f1(cy - Math.cos(ha) * r * 0.5)}" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round"/>`;
  return s + `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${C.ink}"/>`;
}
function birdClockSvg(h, m) {
  return svg('0 0 60 76', `<path d="M8 16L40 13L48 8L45 17L18 22Z" fill="${C.white}" stroke="${C.cloudD}" stroke-width="1"/>` +
    `<path d="M18 16L34 14L26 0Z" fill="${C.cloud}" stroke="${C.cloudD}" stroke-width="1"/><path d="M8 16L3 8L16 17Z" fill="${C.cloudD}"/>` +
    `<circle cx="42" cy="12" r="1.2" fill="${C.ink}"/><path d="M30 20V30" stroke="${C.roof}" stroke-width="1.2"/>` + clockSvg(30, 52, 19, h, m), 'max-height:11vh');
}
const timeText = (h, m) => (m ? `half past ${h}` : `${h} o'clock`);
T.post = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const half = L > 0.55 && R() < 0.7;
  const n = L > 0.45 ? 4 : 3;
  const h = int(R, 1, 12), m = half ? 30 : 0;
  const times = [[h, m]];
  const key = (a, b) => a * 100 + b;
  const used = new Set([key(h, m)]);
  const add = (a, b) => { a = ((a - 1 + 12) % 12) + 1; if (!used.has(key(a, b)) && times.length < n) { used.add(key(a, b)); times.push([a, b]); } };
  if (half) { add(h, 0); add(h + 1, 0); }
  while (times.length < n) add(int(R, 1, 12), half && R() < 0.5 ? 30 : 0);
  const options = shuffle(R, times).map(([a, b]) => ({ html: birdClockSvg(a, b), ok: a === h && b === m }));
  return {
    kind: 'choice', prompt: `Which bird carries the ${timeText(h, m)} letter?`,
    options, cols: n === 4 ? 2 : 3,
    hint: half ? 'Half past: the long hand points down to 6 and the short hand is just past the hour.' : "At o'clock the long hand points straight up to 12. The short hand shows the hour."
  };
};

// 7 greenhouse: sort the magic seeds into the "less than 10" and "more than 10" pots
function seedSvg(v, col) {
  return svg('0 0 40 44', `<path d="M20 2C32 14 36 24 34 32C32 40 26 42 20 42C14 42 8 40 6 32C4 24 8 14 20 2Z" fill="${col}"/>` +
    `<path d="M14 14Q11 22 12 28" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>` + num(20, 29, v, 15, C.ink), 'max-height:6.5vh');
}
const potSvg = (txt) => svg('0 0 60 46', `<path d="M10 14H50L45 44H15Z" fill="#c4704e"/><rect x="6" y="8" width="48" height="9" rx="2" fill="#d98a62"/>` +
  `<path d="M30 8V0M30 4Q22 -2 18 4M30 4Q38 -2 42 4" stroke="${C.greenD}" stroke-width="2" fill="none"/>` + num(30, 30, txt, 12, C.page), 'max-height:7vh');
T.greenhouse = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const n = L > 0.5 ? 6 : int(R, 5, 6);
  const spread = 4 + Math.round((1 - L) * 4);     // later: numbers closer to 10
  const nLo = int(R, 2, n - 2);
  const loPool = [], hiPool = [];
  for (let v = Math.max(1, 10 - spread - 4); v <= 9; v++) loPool.push(v);
  for (let v = 11; v <= Math.min(19, 10 + spread + 4); v++) hiPool.push(v);
  const lo = shuffle(R, loPool).slice(0, nLo), hi = shuffle(R, hiPool).slice(0, n - nLo);
  const cols = [C.pink, C.teal, '#c9a0f0', C.flame, C.green, C.blue];
  const pieces = shuffle(R, lo.map(v => ({ v, key: 'lo' })).concat(hi.map(v => ({ v, key: 'hi' })))).map((o, i) => ({ key: o.key, html: seedSvg(o.v, cols[i % cols.length]) }));
  return {
    kind: 'drag', prompt: 'Sort the magic seeds: less than 10 or more than 10?',
    slots: [{ key: 'lo', multi: true, html: potSvg('&lt;10') + '<div>less than 10</div>' }, { key: 'hi', multi: true, html: potSvg('&gt;10') + '<div>more than 10</div>' }],
    pieces,
    hint: 'Numbers like 7 and 9 come before 10. Numbers like 12 and 15 come after it.'
  };
};

// 8 spell circle: continue the rune pattern
const runeTile = (i, x = 0, y = 0, s = 30, gap = false) => (gap
  ? `<rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 4}" rx="5" fill="none" stroke="${GOLD}" stroke-width="2" stroke-dasharray="4 3"/>` + num(x + s / 2, y + s / 2 + 1, '?', 16, GOLD)
  : `<rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 4}" rx="5" fill="${C.wall}"/>` + PAPER.rune(i, x + s / 2, y + s / 2, s * 0.28, '#ffe9a0', 2.2));
T.circle = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const easy = ['AB', 'AAB', 'ABB'], hard = ['ABC', 'AABB', 'ABAC', 'ABBC'];
  const pat = pick(R, L > 0.55 ? (R() < 0.75 ? hard : easy) : easy);
  const letters = [...new Set(pat.split(''))];
  const glyphs = shuffle(R, [0, 1, 2, 3, 4, 5, 6]);
  const map = {}; letters.forEach((c, i) => { map[c] = glyphs[i]; });
  const len = pat.length * 2 + int(R, 0, pat.length - 1);
  const seq = []; for (let i = 0; i < len; i++) seq.push(map[pat[i % pat.length]]);
  const ans = map[pat[len % pat.length]];
  let inner = '';
  seq.forEach((g, i) => { inner += runeTile(g, i * 30, 0); });
  inner += runeTile(0, len * 30, 0, 30, true);
  const n = L > 0.55 ? 4 : 3;
  const opts = [ans];
  for (const g of letters.map(c => map[c]).concat(glyphs.slice(letters.length))) { if (opts.length >= n) break; if (!opts.includes(g)) opts.push(g); }
  return {
    kind: 'choice', prompt: 'Which rune comes next in the spell circle?',
    art: svg(`0 0 ${(len + 1) * 30} 30`, inner, 'max-height:9vh'),
    options: shuffle(R, opts).map(g => ({ html: svg('0 0 30 30', runeTile(g), 'max-height:8vh'), ok: g === ans })), cols: n,
    hint: 'Say the runes out loud, like a song. Which part keeps coming back?'
  };
};

// 9 kitchen: share the cookies fairly among the goblins
const goblinHead = (x, y, col) => `<path d="M${x - 10} ${y - 2}L${x - 19} ${y - 8}L${x - 9} ${y + 4}Z M${x + 10} ${y - 2}L${x + 19} ${y - 8}L${x + 9} ${y + 4}Z" fill="${col}"/>` +
  `<ellipse cx="${x}" cy="${y}" rx="10" ry="9" fill="${col}"/><circle cx="${x - 3.6}" cy="${y - 1.5}" r="1.3" fill="${C.ink}"/><circle cx="${x + 3.6}" cy="${y - 1.5}" r="1.3" fill="${C.ink}"/>` +
  `<path d="M${x - 2.6} ${y + 3}Q${x} ${y + 5.4} ${x + 2.6} ${y + 3}" stroke="${C.ink}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
const cookieSvg = (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${C.cookie}" stroke="${C.cookieD}" stroke-width="1"/><circle cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.2)}" r="${f1(r * 0.17)}" fill="${C.choc}"/><circle cx="${f1(x + r * 0.3)}" cy="${f1(y + r * 0.3)}" r="${f1(r * 0.17)}" fill="${C.choc}"/>`;
T.kitchen = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const G = int(R, 2, L > 0.5 ? 4 : 3);
  const each = int(R, 2, G === 4 ? 4 : 5);
  const total = G * each;
  const w = 220;
  let inner = `<rect width="${w}" height="120" rx="10" fill="#4a2f6e"/>`;
  const gc = [C.goblin, '#7fc9a0', '#a9d86a', '#8fcf9a'];
  for (let i = 0; i < G; i++) inner += goblinHead(w / (G + 1) * (i + 1), 24, gc[i]);
  const perRow = Math.min(10, Math.ceil(total / 2));
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / perRow), c = i % perRow, rowN = Math.min(perRow, total - r * perRow);
    inner += cookieSvg(w / 2 + (c - (rowN - 1) / 2) * 19, 66 + r * 22, 8);
  }
  return {
    kind: 'choice', prompt: `Share ${total} cookies fairly among ${G} goblins. How many does each goblin get?`,
    art: svg(`0 0 ${w} 120`, inner), options: numberOptions(R, each), cols: 4,
    hint: `Give one cookie to each goblin, then another, until all ${total} are gone.`
  };
};

// 10 tower stairs: which way does the last gear turn?
function gearSvg(cx, cy, r, nT, fill) {
  let d = '';
  const step = 6.2832 / nT, ri = r * 0.8;
  for (let i = 0; i < nT; i++) {
    const a0 = i * step, a1 = a0 + step / 2;
    for (const [a, rr] of [[a0, ri], [a0 + step * 0.12, r], [a1 - step * 0.12, r], [a1, ri]]) d += (d ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr);
  }
  return `<path d="${d}Z" fill="${fill}"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.3)}" fill="${GOLD_D}"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.12)}" fill="${C.ink}"/>`;
}
// a curved arrow round (cx, cy): clockwise or anticlockwise
function turnArrow(cx, cy, r, cw, col = C.red, w = 3) {
  const a0 = cw ? -2.5 : -0.64, a1 = cw ? -0.64 : -2.5;
  const p = a => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const tx = cw ? -Math.sin(a1) : Math.sin(a1), ty = cw ? Math.cos(a1) : -Math.cos(a1);   // direction of travel at the end
  const hx = x1 + tx * w * 1.8, hy = y1 + ty * w * 1.8, nx = -ty * w * 1.4, ny = tx * w * 1.4;
  return `<path d="M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 ${cw ? 1 : 0} ${f1(x1)} ${f1(y1)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${f1(hx)} ${f1(hy)}L${f1(x1 + nx)} ${f1(y1 + ny)}L${f1(x1 - nx)} ${f1(y1 - ny)}Z" fill="${col}"/>`;
}
T.stairs = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const n = Math.min(6, int(R, 3, 4 + Math.round(L * 2)));
  const r = 15, dx = 27;
  let inner = '';
  const w = n * dx + 26;
  const ys = []; for (let i = 0; i < n; i++) ys.push(44 + (i % 2 ? 8 : -6) + (R() - 0.5) * 4);
  for (let i = 0; i < n; i++) inner += gearSvg(18 + i * dx, ys[i], r, 9, i % 2 ? '#c9a24a' : C.brass);
  inner += turnArrow(18, ys[0], r + 7, true, C.red, 2.6);
  inner += num(18 + (n - 1) * dx, ys[n - 1] + r + 12, '?', 14, C.ink);
  const lastCw = n % 2 === 1;
  const btn = cw => svg('0 0 60 50', `<circle cx="30" cy="26" r="12" fill="${C.brass}"/><circle cx="30" cy="26" r="4" fill="${GOLD_D}"/>` + turnArrow(30, 26, 19, cw, C.roof, 3.2), 'max-height:9vh');
  return {
    kind: 'choice', prompt: 'The first gear turns this way. Which way does the last gear turn?',
    art: svg(`0 0 ${w} 90`, `<rect width="${w}" height="90" rx="10" fill="${C.page}" opacity=".9"/>` + inner),
    options: [{ html: btn(true) + '<div>clockwise</div>', ok: lastCw }, { html: btn(false) + '<div>anticlockwise</div>', ok: !lastCw }], cols: 2,
    hint: 'Two gears that touch turn opposite ways. Go along the chain: this way, that way, this way...'
  };
};

// 11 observatory: dot-to-dot, the stars make a shape
const CONST = {
  star: (() => { const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832 - Math.PI / 2, r = i % 2 ? 20 : 46; p.push([50 + Math.cos(a) * r, 53 + Math.sin(a) * r]); } return p; })(),
  cat: [[20, 40], [15, 8], [38, 28], [62, 28], [85, 8], [80, 40], [82, 70], [66, 92], [34, 92], [18, 70]],
  hat: [[8, 88], [92, 88], [74, 74], [62, 40], [66, 14], [88, 6], [54, 8], [40, 40], [26, 74]],
  moon: [[62, 6], [36, 10], [16, 28], [8, 50], [16, 72], [36, 90], [62, 94], [44, 76], [36, 50], [44, 24]],
  tower: [[28, 94], [28, 40], [20, 40], [50, 4], [80, 40], [72, 40], [72, 94]],
  fish: [[6, 50], [30, 24], [62, 22], [82, 40], [96, 22], [96, 78], [82, 60], [62, 78], [30, 76]],
  dragon: [[8, 60], [20, 40], [40, 34], [44, 14], [54, 30], [66, 30], [76, 14], [80, 34], [94, 50], [80, 64], [60, 66], [44, 88], [36, 66]]
};
T.observatory = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const name = pick(R, Object.keys(CONST));
  let pts = CONST[name].map(p => p.slice());
  // stars closer than a dot's width would overlap: keep only well-spaced ones
  pts = pts.filter((p, i) => pts.slice(0, i).every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) >= 14));
  const N = Math.max(pts.length, Math.min(15, int(R, 10, 11 + Math.round(L * 4))));
  while (pts.length < N) {           // split the longest side until there are N stars
    let best = 0, bl = -1;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(a[0] - b[0], a[1] - b[1]); if (l > bl) { bl = l; best = i; } }
    const a = pts[best], b = pts[(best + 1) % pts.length];
    pts.splice(best + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  const off = int(R, 0, pts.length - 1);
  pts = pts.slice(off).concat(pts.slice(0, off));
  if (R() < 0.5) pts = [pts[0]].concat(pts.slice(1).reverse());
  const items = pts.map(([x, y], i) => ({ html: `<b>${i + 1}</b>`, x: f1(7 + x * 0.86), y: f1(7 + y * 0.86) }));
  return {
    kind: 'order', prompt: `Join the stars from 1 to ${pts.length}. What shape do they make?`,
    items, order: items.map((it, i) => i), free: true, lines: true, closeLoop: true, aspect: 1,
    hint: 'Find number 1, then look for the next number nearby.'
  };
};

// 12 mirror hall: finish the picture so both halves match
// left halves, 4 columns wide (column 3 touches the mirror line), 6 rows
const HALVES = {
  tower: ['...#', '..##', '..#.', '..##', '..##', '.###'],
  cat: ['.#..', '.##.', '.###', '.#.#', '.###', '..##'],
  tree: ['...#', '..##', '.###', '..##', '.###', '...#'],
  star: ['...#', '..##', '####', '.###', '.##.', '.#..'],
  crown: ['#...', '#.#.', '####', '####', '.###', '.###']
};
T.mirrors = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const cols = L > 0.85 && R() < 0.6 ? 8 : 6, rows = 6, half = cols / 2;
  const pic = HALVES[pick(R, Object.keys(HALVES))];
  const given = [], target = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < half; c++) {
    if (pic[r][4 - half + c] !== '#') continue;
    given.push(c + ',' + r);
    target.push((cols - 1 - c) + ',' + r);
  }
  return {
    kind: 'cells', prompt: 'Finish the picture in the magic mirror: make the right side match the left.',
    cols, rows, given, target, color: '#c2973a', axis: half,
    hint: 'Each gold square has a twin on the other side of the line, just as far from it.'
  };
};

// 13 dragon's nest: pay the dragon the exact price
const coinSvg = v => svg('0 0 44 44', `<circle cx="22" cy="22" r="20" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="2"/><circle cx="22" cy="22" r="15" fill="none" stroke="${GOLD_D}" stroke-width="1"/>` + num(22, 23, v, v >= 10 ? 15 : 17, '#6a4a12'), 'max-height:7vh');
T.dragon = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const P = int(R, 5 + Math.round(L * 5), 20);
  const D = [10, 5, 2, 1];
  const sol = [];
  let left = P;
  while (left > 0) {
    const ok = D.filter(d => d <= left);
    const d = ok.length > 1 && R() < 0.35 ? ok[1] : ok[0];
    sol.push(d); left -= d;
  }
  const extra = [];
  const nExtra = Math.max(2, Math.min(4, 8 - sol.length));
  for (let i = 0; i < nExtra; i++) extra.push(pick(R, D));
  const all = shuffle(R, sol.map(v => ({ v, s: true })).concat(extra.map(v => ({ v, s: false }))));
  const items = all.map(o => ({ html: coinSvg(o.v), value: o.v }));
  const answer = []; all.forEach((o, i) => { if (o.s) answer.push(i); });
  const art = svg('0 0 200 90', `<ellipse cx="60" cy="60" rx="34" ry="24" fill="${C.dragon}"/><ellipse cx="60" cy="66" rx="20" ry="14" fill="${C.belly}"/>` +
    `<path d="M40 40L34 24L46 36ZM78 40L86 24L74 36Z" fill="${C.belly}"/><circle cx="50" cy="50" r="3" fill="${C.ink}"/><circle cx="70" cy="50" r="3" fill="${C.ink}"/>` +
    `<path d="M52 60Q60 66 68 60" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<path d="M112 26H176L184 45L176 64H112Z" fill="${C.page}" stroke="${GOLD_D}" stroke-width="2"/><circle cx="120" cy="45" r="3" fill="${GOLD_D}"/>` + num(150, 46, P, 26) , 'max-height:14vh');
  return {
    kind: 'pick', prompt: `The dragon asks ${P} gold coins for the page. Pick coins that make exactly ${P}.`,
    art, items, target: P, answer, cols: 4,
    hint: 'Start with the biggest coin that fits, then add smaller ones.'
  };
};

// 14 big spell: put the spellbook pages back in order
T.fireworks = (seed, ctx) => {
  const R = ctx.rng, L = ctx.level;
  const n = L > 0.9 ? 6 : int(R, 5, 6);
  const dots = R() < 0.5;
  const card = v => {
    let inner = '';
    if (dots) {
      for (let i = 0; i < v; i++) { const c = i % 3, r = Math.floor(i / 3); inner += star4(12 + c * 9, 20 + r * 11, 4.2, GOLD_D); }
    } else inner = num(21, 27, v, 18, C.roof);
    return svg('0 0 42 46', pageCard(3, 3, 36, 40, inner), 'max-height:9vh');
  };
  const vals = shuffle(R, Array.from({ length: n }, (_, i) => i + 1));
  const items = vals.map(v => ({ html: card(v) }));
  const order = []; for (let v = 1; v <= n; v++) order.push(vals.indexOf(v));
  return {
    kind: 'order', prompt: dots ? `Put the pages in order: tap the page with 1 star, then 2, up to ${n}.` : `Put the pages back in order: tap 1, 2, 3... up to ${n}.`,
    items, order, cols: 3,
    hint: dots ? 'Count the stars on each page. Start with the page that has just one.' : 'Find the smallest number first, then the next one.'
  };
};

window.SPELLBOOK_TASKS = T;
})();
