// SHARED drawing kit: small math, seeded randomness, noise and 2D shape
// helpers used by the code-drawn books (coloured pencil, crayon, toy cubes,
// the style preview). Content-agnostic; plain script, sets window.DRAWKIT.
// (Moved here from books/preview/assets/js/core.js.)
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeBack = t => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// k of a sub-range [a, b] of 0..1
const sub = (k, a, b) => clamp((k - a) / (b - a), 0, 1);
const f1 = v => Math.round(v * 10) / 10;

// seeded random numbers 0..1 (mulberry32)
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
// value noise; `period` (integer) makes it tile, 0 = no tiling
function vnoise(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const m = period ? a => ((a % period) + period) % period : a => a;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(m(xi), m(yi), seed), b = hash2(m(xi + 1), m(yi), seed);
  const c = hash2(m(xi), m(yi + 1), seed), d = hash2(m(xi + 1), m(yi + 1), seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, period, seed, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let o = 0; o < oct; o++) {
    s += a * vnoise(x * f, y * f, period * f, seed + o * 17);
    n += a; a *= 0.5; f *= 2;
  }
  return s / n;
}

// ---- 2D shapes (point lists [[x, y], ...]) --------------------------------------
// pieces of parallel lines (angle a, spacing s) that lie inside polygon pts
function spans(pts, a, s, phase = 0.5) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const rp = pts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
  let v0 = Infinity, v1 = -Infinity;
  for (const p of rp) { v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  const out = [], back = (u, v) => [u * ca - v * sa, u * sa + v * ca];
  for (let v = v0 + s * phase; v < v1; v += s) {
    const xs = [];
    for (let i = 0; i < rp.length; i++) {
      const [u1, w1] = rp[i], [u2, w2] = rp[(i + 1) % rp.length];
      if ((w1 <= v) !== (w2 <= v)) xs.push(u1 + (v - w1) / (w2 - w1) * (u2 - u1));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) out.push([back(xs[k], v), back(xs[k + 1], v)]);
  }
  return out;
}
function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// splits a segment [p, q] and keeps the pieces OUTSIDE polygon `hole`
function cutOut(hole) {
  return ([p, q]) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], ts = [0, 1];
    for (let i = 0; i < hole.length; i++) {
      const [ax, ay] = hole[i], [bx, by] = hole[(i + 1) % hole.length];
      const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - p[0]) * ey - (ay - p[1]) * ex) / den, u = ((ax - p[0]) * dy - (ay - p[1]) * dx) / den;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
    }
    ts.sort((a, b) => a - b);
    const out = [];
    for (let k = 0; k + 1 < ts.length; k++) {
      const m = (ts[k] + ts[k + 1]) / 2;
      if (ts[k + 1] - ts[k] > 0.01 && !inside(hole, p[0] + dx * m, p[1] + dy * m))
        out.push([[p[0] + dx * ts[k], p[1] + dy * ts[k]], [p[0] + dx * ts[k + 1], p[1] + dy * ts[k + 1]]]);
    }
    return out;
  };
}
// a wobbly closed loop (n points) round an ellipse
function blob(cx, cy, rx, ry, R, n = 24, wob = 0.08) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, k = 1 + (R() - 0.5) * 2 * wob;
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283) * r, cy + Math.sin(i / n * 6.283) * r]);
const ellipse = (cx, cy, rx, ry, n = 32) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283) * rx, cy + Math.sin(i / n * 6.283) * ry]);
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

// ---- SVG path strings ---------------------------------------------------------
// catmull-rom through the points -> smooth cubic path (soft shapes)
function smoothPath(pts, closed) {
  const n = pts.length, at = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
const straight = (pts, closed = true) => 'M' + pts.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L') + (closed ? 'Z' : '');

window.DRAWKIT = {
  clamp, lerp, ease, easeOut, easeBack, smooth, sub, f1,
  rng, hash2, vnoise, fbm,
  spans, inside, cutOut, blob, circle, ellipse, rect, bbox,
  smoothPath, straight
};
})();
