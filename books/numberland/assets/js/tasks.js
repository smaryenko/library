// NUMBER CUBE LAND: the puzzle of each stop (assets/js/minigame.js specs).
// Every generator is seeded (ctx.rng; the same seed gives the same puzzle)
// and returns the spec plus `data`: what the 3D world needs to show the
// situation and to play the result (world.js calls the same generator with
// the same seed). Answers are picked, never typed; art = small SVG icons of
// the friends in their own colours.
(function () {
'use strict';
const NF = window.NUMBER_FRIENDS;
const INK = '#1c1c28';
const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
function shuffle(R, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const svg = (w, h, inner, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"${label ? ` aria-label="${label}"` : ''}>${inner}</svg>`;
// an icon placed inside a bigger svg: nested <svg> with x / y / width
function put(iconSvg, x, y, w) {
  const m = iconSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const vw = +m[1], vh = +m[2], h = w * vh / vw;
  return iconSvg.replace('<svg ', `<svg x="${x.toFixed(1)}" y="${(y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `);
}
const iconW = iconSvg => +iconSvg.match(/viewBox="0 0 ([\d.]+)/)[1];
const label = (s, x, y, size = 13, fill = INK) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Rounded MT Bold, Nunito, system-ui, sans-serif" font-weight="800" font-size="${size}" fill="${fill}">${s}</text>`;
const grass = (w, y, h) => `<rect x="0" y="${y}" width="${w}" height="${h}" rx="6" fill="#93d56a"/>`;
const sky = (w, h) => `<rect width="${w}" height="${h}" rx="10" fill="#dff2fd"/>`;

const T = {};

// 1 Valley: tap One awake ------------------------------------------------------------------
T.n1 = () => ({
  kind: 'tap', prompt: 'Tap One to wake up!',
  note: `<span style="display:inline-block;width:3.2em">${NF.icon(1, { mood: 'sleep', cell: 22 })}</span> <span aria-hidden="true">z z z</span>`,
  data: {}
});

// 2 River: which friends lie down to fill the gap exactly ----------------------------------------
T.n2 = (seed, ctx) => {
  const R = ctx.rng, gap = ri(R, 3, 6);
  const values = [2, 3, 4, 5];                     // never One: One is the one who crosses
  const answer = gap <= 5 ? [gap] : [2, 4];        // the hint's bridge; the world shows the child's own pick
  const s = 16, W = 300, bankL = 70, gx = bankL;
  let art = sky(W, 92) + `<rect x="0" y="52" width="${gx}" height="40" fill="#93d56a"/><rect x="${gx + gap * s}" y="52" width="${W - gx - gap * s}" height="40" fill="#93d56a"/>`;
  art += `<rect x="${gx}" y="62" width="${gap * s}" height="30" fill="#4fb8ee"/>`;
  for (let k = 0; k < gap; k++) art += `<rect x="${gx + k * s + 1.5}" y="${53.5}" width="${s - 3}" height="${s - 3}" rx="3" fill="none" stroke="#2f86c4" stroke-width="1.5" stroke-dasharray="3 2"/>`;
  art += put(NF.icon(1, { cell: 12, label: false }), gx - 30, 52, 20);
  art += label(`${gap} cubes`, gx + gap * s / 2, 40, 13, '#2f6fa0');
  return {
    kind: 'pick', prompt: 'Who can lie down to fill the gap exactly?', cols: 4,
    art: svg(W, 92, art, `A river gap ${gap} cubes long`),
    items: values.map(v => ({ html: NF.icon(v, { cols: 1, lying: true, cell: 12 }), value: v })),
    target: gap, answer: answer.map(v => values.indexOf(v)),
    sumText: n => `${n} / ${gap} cubes`,
    hint: 'Count the dashed squares. Who is that many cubes long?',
    data: { gap, answer }
  };
};

// 3 Low door: how should Six split to fit under? ------------------------------------------------
T.n3 = (seed, ctx) => {
  const R = ctx.rng, H = R() < 0.5 ? 3 : 4;
  let right, wrong;
  if (H === 3) { right = [3, 3]; wrong = [[2, 4], [1, 5]]; }
  else { right = R() < 0.5 ? [2, 4] : [4, 2]; wrong = [[1, 5], [6, 0]]; }
  const opt = ([a, b]) => b ? `${NF.icon(a, { cols: 1, cell: 9 })}${NF.icon(b, { cols: 1, cell: 9 })}<span>${a} + ${b}</span>` : `${NF.icon(6, { cols: 1, cell: 9 })}<span>stay 6</span>`;
  const options = shuffle(R, [{ html: opt(right), ok: true }].concat(wrong.map(w => ({ html: opt(w), ok: false }))));
  const s = 11, W = 220, base = 112;
  let art = sky(W, 120) + grass(W, base, 8);
  const dx = 120;
  art += `<rect x="${dx - 22}" y="14" width="${70}" height="${base - 14}" rx="6" fill="#4fae47"/>`;
  art += `<rect x="${dx}" y="${base - H * s - 4}" width="${26}" height="${H * s + 4}" fill="#2f5d2a"/>`;
  for (let k = 0; k < H; k++) art += `<line x1="${dx + 28}" x2="${dx + 34}" y1="${base - k * s - s}" y2="${base - k * s - s}" stroke="#fff" stroke-width="1.5"/>`;
  art += label(`${H}`, dx + 40, base - H * s / 2 + 4, 12, '#fff');
  art += put(NF.icon(6, { cols: 1, cell: s, label: false }), 40, base, s + 9);
  return {
    kind: 'choice', prompt: `The door is ${H} cubes high. How can Six split to fit under?`, cols: 3,
    art: svg(W, 120, art, `Six next to a door ${H} cubes high`), options,
    hint: `Both parts must be ${H} cubes or less.`,
    data: { H, a: right[0], b: right[1] }
  };
};

// 4 Shadow wall: which friend made this shadow? --------------------------------------------------
T.n4 = (seed, ctx) => {
  const R = ctx.rng, pool = [2, 3, 4, 5, 6, 7, 8, 9];
  const four = shuffle(R, pool).slice(0, 4), n = four[0];
  const sh = NF.shadowSvg(n, { bare: true, scale: 12, color: '#3a3550' });
  const W = 220, H = 130, sc = Math.min(1, 110 / sh.H, 140 / sh.W);
  let art = `<rect width="${W}" height="${H}" rx="10" fill="#fff3c8"/><rect x="30" y="8" width="160" height="114" rx="4" fill="#fffdf6" stroke="#c9b48a" stroke-width="3"/>`;
  art += `<g transform="translate(${(W - sh.W * sc) / 2} ${H - 10 - sh.H * sc}) scale(${sc})">${sh.path}</g>`;
  return {
    kind: 'choice', prompt: 'Who is hiding behind the sheet?', cols: 4,
    art: svg(W, H, art, 'A shadow on a sheet'),
    options: shuffle(R, four.map(v => ({ html: NF.icon(v, { cell: 9 }), ok: v === n }))),
    hint: 'Look at the shape: how tall, how wide, and the arms.',
    data: { n }
  };
};

// 5 Garden: Twelve as the rectangle that fills the bed ------------------------------------------------
T.n5 = (seed, ctx) => {
  const R = ctx.rng, rects = [[3, 4], [4, 3], [2, 6], [6, 2]];
  const [W0, H0] = rects[Math.floor(R() * rects.length)];
  const others = shuffle(R, rects.filter(r => !(r[0] === W0 && r[1] === H0)).concat([[12, 1]]));
  const opts = [[W0, H0], [H0, W0]].concat(others.filter(r => !(r[0] === H0 && r[1] === W0)).slice(0, 2));
  const rectIcon = ([w, h]) => {
    const s = 10; let o = '';
    for (let i = 0; i < 12; i++) {
      const c = i % w, r = Math.floor(i / w), ten = i < 10;
      o += `<rect x="${c * s + 1.5}" y="${(h - 1 - r) * s + 1.5}" width="${s - 1}" height="${s - 1}" rx="2" fill="${ten ? '#f7f7f4' : NF.COLORS[2]}" stroke="${ten ? NF.TEN_RED : '#c76a0c'}" stroke-width="1.2"/>`;
    }
    return svg(w * s + 3, h * s + 3, o, `${w} by ${h}`) + `<span>${w} \u00d7 ${h}</span>`;
  };
  const s = 18, W = 40 + W0 * s, Hh = 30 + H0 * s;
  let art = `<rect width="${W}" height="${Hh}" rx="10" fill="#93d56a"/><rect x="18" y="14" width="${W0 * s + 4}" height="${H0 * s + 4}" rx="4" fill="#a8743f"/><rect x="20" y="16" width="${W0 * s}" height="${H0 * s}" fill="#6b4a2a"/>`;
  for (let k = 0; k <= W0; k++) art += `<line x1="${20 + k * s}" x2="${20 + k * s}" y1="${10}" y2="${15}" stroke="#2d5a22" stroke-width="2"/>`;
  for (let k = 0; k <= H0; k++) art += `<line x1="${13}" x2="${19}" y1="${16 + k * s}" y2="${16 + k * s}" stroke="#2d5a22" stroke-width="2"/>`;
  return {
    kind: 'choice', prompt: 'Which shape of Twelve fills the flower bed?', cols: 2,
    art: svg(W, Hh, art, `A flower bed ${W0} wide and ${H0} deep`),
    options: shuffle(R, opts.map(r => ({ html: rectIcon(r), ok: r[0] === W0 && r[1] === H0 }))),
    hint: 'Count the marks along the top and along the side.',
    data: { W: W0, H: H0 }
  };
};

// 6 Seesaw: who balances the other side? ---------------------------------------------------------------
T.n6 = (seed, ctx) => {
  const R = ctx.rng;
  let a, b, c, d, tries = 0;
  do {
    a = ri(R, 2, 5); b = ri(R, 2, 5);
    const S = a + b;
    c = ri(R, 1, Math.min(7, S - 1)); d = S - c;
    tries++;
  } while ((d < 1 || d > 7 || c === d || (Math.min(c, d) === Math.min(a, b) && Math.max(c, d) === Math.max(a, b))) && tries < 60);
  if (tries >= 60) { a = 3; b = 4; c = 2; d = 5; }
  const S = a + b;
  const pool = [1, 2, 3, 4, 5, 6, 7].filter(v => v !== c && v !== d);
  const values = shuffle(R, [c, d].concat(shuffle(R, pool).slice(0, 3)));
  const W = 260, H = 110;
  let art = sky(W, H) + grass(W, 100, 10) + `<path d="M122 100l8-22 8 22z" fill="#a8743f"/>`;
  art += `<g transform="rotate(-10 130 78)"><rect x="40" y="74" width="180" height="7" rx="3" fill="#c98b4c"/>`;
  art += put(NF.icon(a, { cell: 8, label: false }), 52, 74, 16) + put(NF.icon(b, { cell: 8, label: false }), 76, 74, 16);
  art += label('?', 190, 66, 18, '#c98b4c') + '</g>';
  art += label(`${a} + ${b}`, 70, 20, 13);
  return {
    kind: 'pick', prompt: `Pick two friends for the empty side: they must make ${S}.`, cols: 5, count: 2,
    art: svg(W, H, art, `A seesaw with ${a} and ${b} on one side`),
    items: values.map(v => ({ html: NF.icon(v, { cell: 7 }), value: v })),
    target: S, answer: [values.indexOf(c), values.indexOf(d)],
    hint: `${a} and ${b} make ${S}. Which two others make ${S} too?`,
    data: { left: [a, b], answer: [c, d] }
  };
};

// 7 Stepping stones: find the rule, tap the path left to right -------------------------------------
T.n7 = (seed, ctx) => {
  // count in 2s, 3s, 4s or 5s (bigger steps more likely later in the book)
  const R = ctx.rng, cols = 5, rows = 3;
  const steps = ctx.level < 0.3 ? [2, 3, 5] : [2, 3, 4, 5, 4, 5];
  const step = steps[Math.floor(R() * steps.length)], path = [], nums = [];
  // the other stones: numbers in the same range that are NOT on the count
  const bad = [];
  for (let v = 1; v <= step * cols + 2; v++) if (v % step) bad.push(v);
  for (let c = 0; c < cols; c++) path.push(ri(R, 0, rows - 1));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) nums.push(path[c] === r ? step * (c + 1) : bad[Math.floor(R() * bad.length)]);
  const stone = v => svg(40, 30, `<ellipse cx="20" cy="17" rx="18" ry="12" fill="#b9b1a4"/><ellipse cx="20" cy="15" rx="18" ry="11" fill="#e3ddd2"/>${label(v, 20, 20, 14)}`, `stone ${v}`);
  return {
    kind: 'order', prompt: `Hop on ${step}, ${step * 2}, ${step * 3}... Tap the stones from left to right.`, cols,
    items: nums.map(v => ({ html: stone(v) })),
    order: path.map((r, c) => r * cols + c),
    hint: `Count in ${['', '', 'twos', 'threes', 'fours', 'fives'][step]}: ${[1, 2, 3, 4, 5].map(k => k * step).join(', ')}.`,
    data: { cols, rows, path, nums, step }
  };
};

// 8 Cube yard: a ten-frame of gate cubes; how many more make ten? ------------------------------------
T.n8 = (seed, ctx) => {
  const R = ctx.rng, have = ri(R, 2, 8), need = 10 - have;
  const col = NF.RAINBOW[ri(R, 0, 6)];
  const s = 24, W = 5 * (s + 4) + 16, H = 2 * (s + 4) + 16;
  let art = `<rect width="${W}" height="${H}" rx="10" fill="#e8dcc0"/>`;
  for (let i = 0; i < 10; i++) {
    const c = i % 5, r = Math.floor(i / 5), x = 10 + c * (s + 4), y = 10 + r * (s + 4);
    art += i < have
      ? `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="4" fill="${col}" stroke="#0003"/>`
      : `<rect x="${x + 1}" y="${y + 1}" width="${s - 2}" height="${s - 2}" rx="4" fill="none" stroke="#b09a6e" stroke-width="1.6" stroke-dasharray="3 2"/>`;
  }
  const near = shuffle(R, [need - 1, need + 1, need + 2, need - 2, have].filter(v => v >= 1 && v <= 9 && v !== need));
  const opts = shuffle(R, [need].concat([...new Set(near)].slice(0, 3)));
  return {
    kind: 'choice', prompt: 'The gate needs a row of 10 cubes. How many more cubes do we need?', cols: 4,
    art: svg(W, H, art, `${have} cubes in a frame of 10`),
    options: opts.map(v => ({ html: `<b style="font-size:1.4em">${v}</b>`, ok: v === need })),
    hint: 'Count the empty squares.',
    data: { have, col }
  };
};

// 9 Square pond: which friends can stand as perfect squares? -------------------------------------------
T.n9 = (seed, ctx) => {
  const R = ctx.rng;
  let values, squares, tries = 0;
  for (;;) {
    squares = shuffle(R, [1, 4, 9]).slice(0, R() < 0.5 ? 2 : 3);
    values = shuffle(R, squares.concat(shuffle(R, [2, 3, 5, 6, 7, 8]).slice(0, 6 - squares.length)));
    // the picks are checked by their sum: no other group of the same size may share it
    const tgt = squares.reduce((s, v) => s + v, 0), k = squares.length;
    let clash = false;
    const rec = (i, left, sum, set) => {
      if (clash) return;
      if (left === 0) { if (sum === tgt && set.some(v => !squares.includes(v))) clash = true; return; }
      for (let j = i; j < values.length; j++) rec(j + 1, left - 1, sum + values[j], set.concat(values[j]));
    };
    rec(0, k, 0, []);
    if (!clash || ++tries > 40) break;
  }
  return {
    kind: 'pick', prompt: `Who can stand as a perfect square? Pick ${squares.length}.`, cols: 6,
    items: values.map(v => ({ html: NF.icon(v, { cols: 1, cell: 6 }), value: v })),
    target: squares.reduce((s, v) => s + v, 0), count: squares.length, showSum: false,
    answer: squares.map(v => values.indexOf(v)),
    hint: 'Try making rows: 2 rows of 2, 3 rows of 3...',
    data: { values, squares }
  };
};

// 10 Glow cave: crystals in rows; how many are there? (count the rows) ---------------------------
const CRYSTAL = ['#ff8fa3', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc', '#ffa94d'];
T.n10 = (seed, ctx) => {
  const R = ctx.rng, rows = ri(R, 2, 3 + Math.round(ctx.level)), cols = ri(R, 2, 4);
  const n = rows * cols, s = 26, W = cols * (s + 6) + 30, H = rows * (s + 6) + 24;
  let art = `<rect width="${W}" height="${H}" rx="12" fill="#24213a"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    art += `<rect x="${15 + c * (s + 6)}" y="${12 + r * (s + 6)}" width="${s}" height="${s}" rx="5" fill="${CRYSTAL[r % CRYSTAL.length]}"/>`;
  const near = shuffle(R, [n - 1, n + 1, n - 2, n + 2, n + cols, n - cols].filter(v => v > 0 && v !== n));
  const opts = shuffle(R, [n].concat([...new Set(near)].slice(0, 3)));
  return {
    kind: 'choice', prompt: `${rows} rows of ${cols} crystals. How many crystals light up?`, cols: 4,
    art: svg(W, H, art, `${rows} rows of ${cols} crystals`),
    options: opts.map(v => ({ html: `<b style="font-size:1.4em">${v}</b>`, ok: v === n })),
    hint: `Count one row: ${cols}. Then count on, row by row.`,
    data: { rows, cols }
  };
};

// 11 Mirror lake: build the other half -------------------------------------------------------------------
T.n11 = (seed, ctx) => {
  const R = ctx.rng, cols = 6, rows = 4, h = [];
  for (let c = 0; c < 3; c++) h.push(ri(R, 1, 4));
  if (h[0] === h[1] && h[1] === h[2]) h[ri(R, 0, 2)] = h[0] > 2 ? 1 : 4;
  const given = [], target = [];
  for (let c = 0; c < 3; c++) for (let k = 0; k < h[c]; k++) {
    const r = rows - 1 - k;
    given.push(c + ',' + r); target.push((cols - 1 - c) + ',' + r);
  }
  return {
    kind: 'cells', prompt: 'The lake is a mirror. Build the tower\u2019s twin on the other side.',
    cols, rows, axis: 3, given, target, color: '#3cc6ef',
    hint: 'The cubes next to the line come first. Copy each column, but flipped.',
    data: { h }
  };
};

// 12 Tumbling hill: the cube staircase on the hill has a gap; who fills it? -----------------------
T.n12 = (seed, ctx) => {
  const R = ctx.rng, top = ri(R, 5, 6 + Math.round(ctx.level * 2)), gap = ri(R, 2, top - 1);
  const s = 9, W = top * (s + 5) + 20, base = top * s + 16;
  let art = sky(W, base + 10) + grass(W, base, 10);
  for (let h = 1; h <= top; h++) {
    const x = 10 + (h - 1) * (s + 5);
    if (h === gap) { art += label('?', x + s / 2, base - 6, 13, '#c0392b'); continue; }
    art += put(NF.icon(h, { cols: 1, cell: s, label: false }), x, base, s);
  }
  const opts = shuffle(R, [gap].concat(shuffle(R, [gap - 1, gap + 1, gap + 2, gap - 2].filter(v => v >= 1 && v <= 9 && v !== gap)).slice(0, 3)));
  return {
    kind: 'choice', prompt: 'The friends made a staircase up the hill. Who is missing?', cols: 4,
    art: svg(W, base + 10, art, `A staircase from 1 to ${top} with a gap`),
    options: opts.map(v => ({ html: NF.icon(v, { cols: 1, cell: 7 }), ok: v === gap })),
    hint: 'Each step is one cube taller than the one before.',
    data: { top, gap }
  };
};

// 13 Odd camp: who has a cube without a partner? ----------------------------------------------------------
T.n13 = (seed, ctx) => {
  const R = ctx.rng;
  const odd = [3, 5, 7, 9][ri(R, 0, 3)];
  const values = shuffle(R, [odd].concat(shuffle(R, [2, 4, 6, 8]).slice(0, 3)));
  return {
    kind: 'choice', prompt: 'Everyone pairs up their cubes, two by two. Who has a cube left over?', cols: 4,
    options: values.map(v => ({ html: NF.icon(v, { cols: 1, cell: 7 }), ok: v === odd })),
    hint: 'Count in twos. Odd numbers always have one left over.',
    data: { values, odd }
  };
};

// 14 Rainbow Gate: every friend into the hole of their size -------------------------------------------
T.n14 = (seed, ctx) => {
  const R = ctx.rng, holes = shuffle(R, [1, 2, 3, 4, 5, 6]).slice(0, 4);
  // every gap on the same scale (room for 6 cubes), standing on the bottom:
  // square cube cells, softly filled, so the sizes compare at a glance
  const hole = v => {
    const s = 10, H = 6 * s + 4; let o = '';
    for (let k = 0; k < v; k++) {
      const y = H - 2 - (k + 1) * s;
      o += `<rect x="2" y="${y + 0.75}" width="${s - 1.5}" height="${s - 1.5}" rx="1" fill="#efe1f7" stroke="#8e44ad" stroke-width="1.2"/>`;
    }
    return svg(s + 2.5, H, o, `a gap ${v} cubes tall`);
  };
  return {
    kind: 'drag', prompt: 'Fit each friend into the gap of their size.',
    slots: holes.map(v => ({ html: hole(v), key: 'f' + v })),
    pieces: shuffle(R, holes).map(v => ({ html: NF.icon(v, { cols: 1, cell: 7 }), key: 'f' + v })),
    hint: 'Count the dashed squares in each gap.',
    data: { holes }
  };
};

window.NUMBERLAND_TASKS = T;
})();
