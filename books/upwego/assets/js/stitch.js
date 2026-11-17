// UP WE GO: the embroidery kit. A page design is a list of stitches on a
// 0..200 "art" box (the inside of the hoop is a circle at 100,100, r 100).
// Generators: satin / long-and-short fills, back stitch, running stitch,
// chain stitch, French knots, star stitches. Rendering: one SVG per page:
// the book-page shadow, a wooden hoop, navy linen, the stitches with one
// shared thread-relief filter plus a sheen line per stitch, all split into
// `data-part` layers so the engine's pseudo-3D tilt gives the hoop depth.
//
//   const d = Stitch.design(seed);
//   d.part('ground', 0);            // depth layer (OBJ_DEPTH 'em-ground') + reveal group 0..2
//   d.mover('ship', [x, y]);        // stitches after this are drawn round x,y (local 0,0)
//   d.satin(d.inCirc(100, 60, 20), [80, 40, 120, 80], 30, '#3b7bc0');
//   return d.svg({ anims: { ship: { rest: 'translate(...)', frame: f => 'transform:...' } } });
//
// Reveal: max three appearances per page (group 0, 1, 2), in stop-motion
// steps. Tap: the engine sets `.is-playing` on the SVG for one run (keep it
// <= 2.4 s); each mover's `frame(f)` (f = 0..1) is sampled at 12 a second.
(function () {
'use strict';

// ---- tune by eye -------------------------------------------------------------
const W_THREAD = 1.15;          // cotton thread width (art units)
const GAP_K = 1.05;             // satin row spacing factor
const MAX_K = 0.9;              // long-and-short split length factor
const SATIN_FILL = 0.82;        // thread width as a share of the row spacing
const FPS = 12;
const REVEAL_AT = [0.2, 0.9, 1.6], REVEAL_TIME = 0.4;
const PLAY = 2.4;
const LINEN = '#1b2440', LINEN_HI = '#26325a', LINEN_LO = '#141b33';
const WOOD = [216, 176, 122];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => (Math.round(v * 10) / 10).toString();
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(i, j, seed) {
  let h = (i * 374761393 + j * 668265263 + seed * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), u), lerp(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), u), v);
}
function fbm(x, y, seed) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let o = 0; o < 4; o++) { s += a * vnoise(x * f, y * f, seed + o * 17); n += a; a *= 0.5; f *= 2; }
  return s / n;
}
const SHEEN = {};
function sheen(hex) {
  if (!SHEEN[hex]) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255], w = [255, 250, 238];
    SHEEN[hex] = 'rgb(' + c.map((v, i) => Math.round(v + (w[i] - v) * 0.45)).join(',') + ')';
  }
  return SHEEN[hex];
}

// thread colours shared by all pages
const C = {
  white: '#f1ede2', cream: '#e6dcc0', star: '#f4e3a6', grey: '#8a8b8e', greyL: '#b9bab8', greyD: '#5e5f63',
  moon1: '#bdbcb5', moon2: '#9c9b96', moon3: '#6e6d6b', moonHi: '#d8d6cf',
  sea: '#3b7bc0', seaD: '#1f3c6c', sky: '#9cc6ec', land: '#5f9b4e', landD: '#2f4b32', sand: '#d2ae6c', sandD: '#8a6c3c',
  grass: '#4f8a3e', grassD: '#2f5a2a', bark: '#6b4a2e', skin: '#e3b48e', hair: '#4a3020',
  red: '#b5313b', redD: '#7d1f27', orange: '#e0782f', flame: '#f2b13a', yellow: '#f3d35a', navy: '#1e2d66',
  black: '#141418', gold: '#e0b65c', goldD: '#a77c2e', silver: '#cfd2d8', purple: '#8a6fb0', mars: '#b8573a', marsD: '#7e3524', marsL: '#d98a5e',
  blue: '#4b7fd0', blueL: '#8fb3e8', jup1: '#d9b48a', jup2: '#a8774e', sat1: '#e3cf9a', sat2: '#b89c62'
};

// ---- the design builder -----------------------------------------------------------
function design(seed) {
  const ops = [];
  const R = rng(seed || 1);
  const j = s => (R() - 0.5) * s;
  let PART = 'ground', GROUP = 0, MOVER = null, ORIGIN = [0, 0];
  // after mover(name, origin) the scenes draw in the mover's own local
  // coordinates (0,0 = origin); the wrapper <g> places it at the origin
  const push = op => ops.push(Object.assign(op, { part: PART, group: GROUP, mover: MOVER, origin: ORIGIN }));
  const st = (ax, ay, bx, by, c, w = W_THREAD) => push({ k: 's', c, ax, ay, bx, by, w });
  const kn = (x, y, c, w = 1.5) => push({ k: 'k', c, ax: x, ay: y, bx: x, by: y, w });

  const d = {
    R, C, fbm, rng,
    // depth layer + reveal group (0, 1 or 2) for the stitches that follow
    part(name, group) { PART = name; GROUP = clamp(group | 0, 0, 2); MOVER = null; ORIGIN = [0, 0]; return d; },
    // the following stitches move together on tap; drawn round `origin`
    mover(name, origin = [0, 0]) { MOVER = name; ORIGIN = origin; return d; },
    still() { MOVER = null; ORIGIN = [0, 0]; return d; },
    stitch(...a) { st(...a); return d; },
    knot(...a) { kn(...a); return d; },
    satin(inside, box, deg, color, o = {}) {
      const gap = (o.gap || 1.0) * GAP_K, max = (o.max || 1e9) * MAX_K, w = o.w || W_THREAD;
      const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const toArt = (u, v) => [u * ca - v * sa, u * sa + v * ca];
      const cs = [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]].map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
      const u0 = Math.min(...cs.map(c => c[0])), u1 = Math.max(...cs.map(c => c[0]));
      const v0 = Math.min(...cs.map(c => c[1])), v1 = Math.max(...cs.map(c => c[1]));
      const colorAt = typeof color === 'function' ? color : () => color;
      const emit = (uA, uB, v, col, row) => {
        const len = uB - uA; if (len < 0.8) return;
        const n = Math.max(1, Math.ceil(len / max)), seg = len / n;
        const shift = n > 1 && row % 2 ? seg * 0.5 : 0;
        const cuts = [uA];
        for (let u = uA + seg - shift; u < uB - 0.9; u += seg) if (u > uA + 0.9) cuts.push(u + j(seg * 0.3));
        cuts.push(uB);
        for (let i = 0; i + 1 < cuts.length; i++) {
          const A = toArt(cuts[i] + j(0.4), v + j(0.22)), B = toArt(cuts[i + 1] + j(0.4), v + j(0.22));
          st(A[0], A[1], B[0], B[1], col, Math.min(w, gap * SATIN_FILL / 0.85));
        }
      };
      let row = 0;
      const du = Math.min(0.4, (u1 - u0) / 8 || 0.4);
      for (let v = v0 + gap * 0.5; v < v1; v += gap, row++) {
        let runStart = 0, runCol = null;
        for (let u = u0; u <= u1 + du; u += du) {
          const [x, y] = toArt(u, v);
          const col = u <= u1 && inside(x, y) ? colorAt(x, y) : null;
          if (col !== runCol) { if (runCol !== null) emit(runStart, u, v, runCol, row); runStart = u; runCol = col; }
        }
      }
      return d;
    },
    back(pts, len, c, o = {}) {
      const wk = walk(pts), n = Math.max(1, Math.round(wk.tot / len));
      for (let i = 0; i < n; i++) { const A = wk.at(wk.tot * i / n), B = wk.at(wk.tot * (i + 1) / n); st(A[0], A[1], B[0], B[1], c, o.w || W_THREAD); }
      return d;
    },
    running(pts, len, gapL, c, o = {}) {
      const wk = walk(pts);
      for (let s = 0; s + len <= wk.tot; s += len + gapL) { const A = wk.at(s), B = wk.at(s + len); st(A[0], A[1], B[0], B[1], c, o.w || W_THREAD); }
      return d;
    },
    chain(pts, len, c, o = {}) {
      const wk = walk(pts), n = Math.max(1, Math.round(wk.tot / len)), cw = o.w || 0.95;
      for (let i = 0; i < n; i++) {
        const A = wk.at(wk.tot * i / n), B = wk.at(wk.tot * (i + 1) / n);
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        const w = dl * 0.34, nx = -(B[1] - A[1]) / dl * w, ny = (B[0] - A[0]) / dl * w;
        st(A[0], A[1], mx + nx, my + ny, c, cw); st(mx + nx, my + ny, B[0], B[1], c, cw);
        st(A[0], A[1], mx - nx, my - ny, c, cw); st(mx - nx, my - ny, B[0], B[1], c, cw);
      }
      return d;
    },
    star(x, y, r, c = C.gold) {
      const q = r * 0.5;
      st(x - r, y, x + r, y, c); st(x, y - r, x, y + r, c);
      st(x - q, y - q, x + q, y + q, c, W_THREAD * 0.8); st(x - q, y + q, x + q, y - q, c, W_THREAD * 0.8);
      return d;
    },
    // a scatter of French-knot stars wherever free(x, y) allows
    stars(n, free, o = {}) {
      for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
        const x = 6 + R() * 188, y = 6 + R() * 188;
        if (!(d.inCirc(100, 100, 92)(x, y) && free(x, y))) continue;
        made++; kn(x, y, R() < 0.3 ? C.star : C.white, (o.size || 1.1) + R() * 0.8);
      }
      return d;
    },
    ring(cx, cy, rx, ry, n = 28, a0 = 0, a1 = Math.PI * 2) {
      const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p;
    },
    inCirc: (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < r * r,
    inEll: (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1,
    inRect: (x0, y0, x1, y1) => (x, y) => x > x0 && x < x1 && y > y0 && y < y1,
    inPoly: pts => (x, y) => {
      let c = false;
      for (let i = 0, k = pts.length - 1; i < pts.length; k = i++) {
        const [xi, yi] = pts[i], [xk, yk] = pts[k];
        if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) c = !c;
      }
      return c;
    },
    hoop: (x, y) => (x - 100) ** 2 + (y - 100) ** 2 < 96.5 * 96.5,
    // a filled shape the quick way: satin over a polygon's own bounding box
    fillPoly(pts, deg, color, o) {
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      return d.satin(d.inPoly(pts), [Math.min(...xs) - 1, Math.min(...ys) - 1, Math.max(...xs) + 1, Math.max(...ys) + 1], deg, color, o);
    },
    fillCirc(cx, cy, r, deg, color, o) { return d.satin(d.inCirc(cx, cy, r), [cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1], deg, color, o); },
    fillEll(cx, cy, rx, ry, deg, color, o) { return d.satin(d.inEll(cx, cy, rx, ry), [cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1], deg, color, o); },
    fillRect(x0, y0, x1, y1, deg, color, o) { return d.satin(d.inRect(x0, y0, x1, y1), [x0 - 1, y0 - 1, x1 + 1, y1 + 1], deg, color, o); },
    // the curve of Earth across the bottom of the hoop, seen from orbit
    earthCurve(cy = 250, r = 120, o = {}) {
      const inside = (x, y) => d.hoop(x, y) && (x - 100) ** 2 + (y - cy) ** 2 < r * r;
      const col = (x, y) => {
        const n = fbm(x * 0.03 + (o.seed || 0), y * 0.05, 5);
        const edge = Math.hypot(x - 100, y - cy) > r - 4;
        if (edge) return C.sky;
        if (n > 0.6) return C.white;                       // clouds
        return n > 0.47 ? C.land : C.sea;
      };
      d.satin(inside, [0, cy - r - 2, 200, 200], 8, col, { max: 9 });
      return d;
    },
    svg(o) { return render(ops, o || {}); }
  };
  return d;
}
function walk(pts) {
  const seg = []; let tot = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); tot += l; }
  const at = s => {
    s = clamp(s, 0, tot);
    for (let i = 0; i < seg.length; i++) {
      if (s <= seg[i] || i === seg.length - 1) { const t = seg[i] ? clamp(s / seg[i], 0, 1) : 0; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; }
      s -= seg[i];
    }
    return pts[pts.length - 1];
  };
  return { tot, at };
}

// ---- SVG ----------------------------------------------------------------------------
function oneStitch(op) {
  if (op.k !== 's') {
    const r = op.w * 0.55;
    return `<circle cx="${f1(op.ax)}" cy="${f1(op.ay)}" r="${f1(r)}" fill="${op.c}"/>` +
      `<circle cx="${f1(op.ax - r * 0.3)}" cy="${f1(op.ay - r * 0.3)}" r="${f1(r * 0.4)}" fill="${sheen(op.c)}" opacity="0.7"/>`;
  }
  const w = op.w * 0.85, dx = op.bx - op.ax, dy = op.by - op.ay, len = Math.hypot(dx, dy) || 1;
  let out = `<line x1="${f1(op.ax)}" y1="${f1(op.ay)}" x2="${f1(op.bx)}" y2="${f1(op.by)}" stroke="${op.c}" stroke-width="${f1(w)}"/>`;
  if (len > w * 1.6) {
    let nx = -dy / len, ny = dx / len;
    if (nx + ny > 0) { nx = -nx; ny = -ny; }
    const o = w * 0.22, cut = Math.min(0.3, w * 0.7 / len);
    out += `<line x1="${f1(op.ax + dx * cut + nx * o)}" y1="${f1(op.ay + dy * cut + ny * o)}" x2="${f1(op.bx - dx * cut + nx * o)}" y2="${f1(op.by - dy * cut + ny * o)}" stroke="${sheen(op.c)}" stroke-width="${f1(Math.max(0.25, w * 0.28))}" opacity="0.75"/>`;
  }
  return out;
}

const HOOP_R0 = 101.8, HOOP_R1 = 109.2, HOOP_N = 10;
const HOOP_BANDS = Array.from({ length: HOOP_N }, (_, i) => {
  const s = (i + 0.5) / HOOP_N, r = HOOP_R0 + (HOOP_R1 - HOOP_R0) * s;
  const b = 0.55 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.1)), 0.7);
  const c = WOOD.map(v => Math.round(Math.min(255, v * b)));
  return `<circle cx="100" cy="100" r="${r.toFixed(2)}" fill="none" stroke="rgb(${c})" stroke-width="${((HOOP_R1 - HOOP_R0) / HOOP_N + 0.08).toFixed(2)}"/>`;
}).join('');

let uidN = 0;
function render(ops, o) {
  const uid = 'uw' + (++uidN) + Math.random().toString(36).slice(2, 6);
  const anims = o.anims || {};
  const n = Math.round(PLAY * FPS);
  let css = `
    .${uid}-in{opacity:0;animation:${uid}-in ${REVEAL_TIME}s steps(1,end) both}
    @keyframes ${uid}-in{0%{opacity:0}25%{opacity:.35}50%{opacity:.7}75%,100%{opacity:1}}
    @media (prefers-reduced-motion: reduce){.${uid}-in{opacity:1;animation:none}}`;
  // Placement: each mover sits in an outer <g transform="translate(origin)">
  // (an SVG attribute, so it holds even where CSS transforms on SVG fail);
  // its inner group is animated by CSS. The scenes write rest / frame
  // transforms in hoop coordinates, so they are made relative to the
  // origin here.
  const origins = {};
  ops.forEach(op => { if (op.mover) origins[op.mover] = op.origin; });
  const rel = (str, name) => {
    const [ox, oy] = origins[name] || [0, 0];
    return str.replace(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/, (_, x, y) => `translate(${f1(+x - ox)}px,${f1(+y - oy)}px)`);
  };
  // rest pose and tap frames as SVG transform attributes (see play() below)
  const restAttr = {}, framesAttr = {};
  Object.entries(anims).forEach(([name, a]) => {
    if (a.rest) restAttr[name] = toAttr(rel(a.rest, name));
    if (a.frame) {
      const fr = [];
      for (let i = 0; i <= n; i++) { const q = toAttr(rel(a.frame(i / n), name)); fr.push(q.t + '~' + q.o); }
      framesAttr[name] = fr.join('|');
    }
  });


  // parts in first-use order; inside each, plain stitches then each mover group
  const parts = [];
  ops.forEach(op => { if (!parts.includes(op.part)) parts.push(op.part); });
  const partSvg = parts.map(p => {
    const mine = ops.filter(op => op.part === p);
    const group = mine[0].group;
    const still = mine.filter(op => !op.mover).map(oneStitch).join('');
    const movers = [];
    mine.forEach(op => { if (op.mover && !movers.includes(op.mover)) movers.push(op.mover); });
    const mv = movers.map(m => {
      const [ox, oy] = origins[m] || [0, 0];
      const r = restAttr[m] || { t: '', o: 1 };
      const fr = framesAttr[m] ? ` data-frames="${framesAttr[m]}" data-rest="${r.t};${r.o}"` : '';
      return `<g transform="translate(${f1(ox)} ${f1(oy)})"><g class="${uid}-m-${m}"${r.t ? ` transform="${r.t}"` : ''} opacity="${r.o}"${fr}>${mine.filter(op => op.mover === m).map(oneStitch).join('')}</g></g>`;
    }).join('');
    return `<g data-part="em-${p}" class="${uid}-in" style="animation-delay:${REVEAL_AT[group]}s">${still}${mv}</g>`;
  }).join('');

  const a1 = 3.55, a2 = 4.75, hr = 106.6;
  return `
  <svg data-stitch viewBox="-16 -24 236 248" data-fit="-12 -18 226 232" data-hit="-6 -10 212 212" xmlns="http://www.w3.org/2000/svg">
    <style>${css}</style>
    <defs>
      <pattern id="${uid}-weave" width="1.6" height="1.6" patternUnits="userSpaceOnUse">
        <rect width="1.6" height="1.6" fill="${LINEN}"/>
        <rect y="0.15" width="0.8" height="0.6" fill="${LINEN_HI}"/><rect x="0.8" y="0.95" width="0.8" height="0.6" fill="${LINEN_HI}"/>
        <rect x="0.15" y="0.8" width="0.6" height="0.8" fill="${LINEN_LO}"/><rect x="0.95" width="0.6" height="0.8" fill="${LINEN_LO}"/>
      </pattern>
      <radialGradient id="${uid}-drum" cx="0.38" cy="0.34" r="0.75">
        <stop offset="0" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/>
      </radialGradient>
      <radialGradient id="${uid}-rim" cx="100" cy="100" r="101" gradientUnits="userSpaceOnUse">
        <stop offset="0.93" stop-color="#000" stop-opacity="0"/><stop offset="0.975" stop-color="#000" stop-opacity="0.35"/>
        <stop offset="0.99" stop-color="#fff" stop-opacity="0.10"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/>
      </radialGradient>
      <linearGradient id="${uid}-light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff3da" stop-opacity="0.35"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0d02" stop-opacity="0.45"/>
      </linearGradient>
      <linearGradient id="${uid}-lug" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a5e33"/><stop offset="0.35" stop-color="#e3c08a"/><stop offset="0.7" stop-color="#c69a62"/><stop offset="1" stop-color="#7a5129"/>
      </linearGradient>
      <linearGradient id="${uid}-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f3dc9a"/><stop offset="0.5" stop-color="#c49a4c"/><stop offset="1" stop-color="#7d5d26"/>
      </linearGradient>
      <filter id="${uid}-grain" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="3" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -1.1" result="g"/>
        <feComposite in="g" in2="SourceAlpha" operator="in"/>
      </filter>
      <filter id="${uid}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
      <filter id="${uid}-contact" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
      <filter id="${uid}-blur1" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1"/></filter>
      <filter id="${uid}-blur05" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.5"/></filter>
      <filter id="${uid}-thread" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.16" result="b"/>
        <feSpecularLighting in="b" surfaceScale="2" specularConstant="0.55" specularExponent="14" lighting-color="#fff8ea" result="sp">
          <feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
        <feComposite in="sp" in2="SourceAlpha" operator="in" result="spc"/>
        <feDiffuseLighting in="b" surfaceScale="2" diffuseConstant="1" lighting-color="#fff" result="df">
          <feDistantLight azimuth="225" elevation="50"/></feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="df" operator="arithmetic" k1="1.25" result="lit"/>
        <feOffset in="SourceAlpha" dx="0.35" dy="0.5" result="o"/><feGaussianBlur in="o" stdDeviation="0.35" result="ob"/>
        <feFlood flood-color="#000" flood-opacity="0.6"/><feComposite in2="ob" operator="in" result="sh"/>
        <feMerge><feMergeNode in="sh"/><feMergeNode in="lit"/><feMergeNode in="spc"/></feMerge>
      </filter>
      <clipPath id="${uid}-clip"><circle cx="100" cy="100" r="100.5"/></clipPath>
    </defs>
    <g data-part="em-shadow">
      <circle cx="106" cy="109" r="108" fill="#2a1e10" opacity="0.30" filter="url(#${uid}-soft)"/>
      <circle cx="101.5" cy="102.5" r="109" fill="#1e140a" opacity="0.45" filter="url(#${uid}-contact)"/>
    </g>
    <g data-part="em-cloth">
      <circle cx="100" cy="100" r="101" fill="url(#${uid}-weave)"/>
      <circle cx="100" cy="100" r="101" fill="url(#${uid}-drum)"/>
      <circle cx="100" cy="100" r="101" fill="url(#${uid}-rim)"/>
    </g>
    <g clip-path="url(#${uid}-clip)"><g filter="url(#${uid}-thread)" stroke-linecap="round">${partSvg}</g></g>
    <g data-part="em-ringshadow"><circle cx="101.2" cy="101.8" r="101.6" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="2.2" filter="url(#${uid}-blur1)" clip-path="url(#${uid}-clip)"/></g>
    <g data-part="em-ring">
      ${HOOP_BANDS}
      <circle cx="100" cy="100" r="105.5" fill="none" stroke="#000" stroke-width="7.4" opacity="0.32" filter="url(#${uid}-grain)"/>
      <circle cx="100" cy="100" r="105.5" fill="none" stroke="url(#${uid}-light)" stroke-width="7.4"/>
      <path d="M ${f1(100 + hr * Math.cos(a1))} ${f1(100 + hr * Math.sin(a1))} A ${hr} ${hr} 0 0 1 ${f1(100 + hr * Math.cos(a2))} ${f1(100 + hr * Math.sin(a2))}"
        fill="none" stroke="#fff6e2" stroke-width="1.1" stroke-linecap="round" opacity="0.75" filter="url(#${uid}-blur05)"/>
      <circle cx="100" cy="100" r="101.85" fill="none" stroke="#4a2f16" stroke-width="0.5" opacity="0.9"/>
      <circle cx="100" cy="100" r="109.15" fill="none" stroke="#3e2712" stroke-width="0.5" opacity="0.9"/>
    </g>
    <g data-part="em-clamp">
      <rect x="92.6" y="-14.5" width="6.4" height="11" rx="1.6" fill="url(#${uid}-lug)" stroke="#4a2f16" stroke-width="0.45"/>
      <rect x="101" y="-14.5" width="6.4" height="11" rx="1.6" fill="url(#${uid}-lug)" stroke="#4a2f16" stroke-width="0.45"/>
      <rect x="99" y="-12" width="2" height="8" fill="#2a1a0c" opacity="0.7"/>
      <rect x="86" y="-10.6" width="28" height="3.4" rx="1.7" fill="url(#${uid}-brass)"/>
      ${Array.from({ length: 11 }, (_, i) => `<line x1="${87.5 + i * 2.4}" y1="-10.5" x2="${88.3 + i * 2.4}" y2="-7.3" stroke="#6b4f1e" stroke-width="0.35" opacity="0.8"/>`).join('')}
      <rect x="113" y="-14" width="5.4" height="10.2" rx="1.6" fill="url(#${uid}-brass)" stroke="#5e4416" stroke-width="0.45"/>
      ${[0, 1, 2, 3].map(i => `<line x1="${113.9 + i * 1.2}" y1="-13.4" x2="${113.9 + i * 1.2}" y2="-4.4" stroke="#6b4f1e" stroke-width="0.3"/>`).join('')}
      <rect x="113.6" y="-13.5" width="1.2" height="9" rx="0.6" fill="#fff4cf" opacity="0.6"/>
      <ellipse cx="84.6" cy="-8.9" rx="1.6" ry="2.3" fill="url(#${uid}-brass)" stroke="#5e4416" stroke-width="0.35"/>
    </g>
  </svg>`;
}

// helpers for tap animations: a transform keyframe string
const tr = (x, y, deg = 0, s = 1) => `transform:translate(${f1(x)}px,${f1(y)}px) rotate(${f1(deg)}deg) scale(${s})`;

// 'transform:translate(1px,2px) rotate(3deg) scale(1);opacity:0' -> SVG attribute values
function toAttr(css) {
  const num = re => { const m = css.match(re); return m ? m.slice(1).map(Number) : null; };
  const t = num(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px/) || [0, 0];
  const r = num(/rotate\(\s*(-?[\d.]+)deg/) || [0];
  const sc = num(/scale\(\s*(-?[\d.e-]+)/) || [1];
  const o = num(/opacity:\s*(-?[\d.]+)/) || [1];
  return { t: `translate(${f1(t[0])} ${f1(t[1])}) rotate(${f1(r[0])}) scale(${sc[0]})`, o: o[0] };
}

// Tap / Space / Enter on a hoop: step every mover through its frames at 12 a
// second (all layer copies at once), then back to rest. JS-driven SVG
// attributes, so it works wherever CSS transforms on SVG are unreliable.
let playing = null;
function play(host) {
  if (playing) cancelAnimationFrame(playing.raf);
  const els = [...host.querySelectorAll('[data-frames]')].map(el => ({
    el, frames: el.getAttribute('data-frames').split('|').map(x => { const [t, o] = x.split('~'); return { t, o }; }),
    rest: el.getAttribute('data-rest').split(';')
  }));
  if (!els.length) return;
  const t0 = performance.now();
  const step = now => {
    const i = Math.floor((now - t0) / 1000 * FPS);
    const done = i >= els[0].frames.length;
    els.forEach(({ el, frames, rest }) => {
      const f = done ? { t: rest[0], o: rest[1] } : frames[i];
      if (f.t) el.setAttribute('transform', f.t); else el.removeAttribute('transform'); el.setAttribute('opacity', f.o);
    });
    playing = done ? null : { raf: requestAnimationFrame(step) };
  };
  playing = { raf: requestAnimationFrame(step) };
}
const hostOf = t => { const h = t && t.closest ? t.closest('.obj-host') : null; return h && !h.closest('.obj-prerender') && h.querySelector('svg[data-stitch]') ? h : null; };
window.addEventListener('pointerdown', e => { const h = hostOf(e.target); if (h) play(h); }, true);
window.addEventListener('picture-activate', e => { const h = hostOf(e.target); if (h) play(h); });

window.Stitch = { design, C, tr, f1, clamp, lerp, PLAY, FPS };
})();
