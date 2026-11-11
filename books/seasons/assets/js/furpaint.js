// SEASONS book — the "fur painter": turns a silhouette polygon into a
// realistic, painted-looking furry shape.
//
//   1) the polygon is smoothed (Catmull-Rom) and filled with a base colour;
//   2) thousands of short, slightly curved hair strokes are scattered inside
//      it. Each hair's direction comes from a flow function (fur grows away
//      from the nose, down the legs, along the tail) and its colour from a
//      colour function (orange coat, white bib, black stockings…) times a
//      light function (sun from the top-left, darker underside);
//   3) hairs that start near the edge poke past it, which gives the soft
//      fur silhouette.
// Hairs are binned by colour + width into a handful of <path> elements so a
// shape is a few dozen DOM nodes, not thousands. Deterministic (seeded).
(function () {
  'use strict';
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }
  const f1 = n => (Math.round(n * 10) / 10).toString();

  // closed Catmull-Rom spline through pts -> SVG path
  function smooth(pts) {
    const n = pts.length;
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + 'Z';
  }
  // sample the smoothed outline densely, for point-in-polygon tests
  function densify(pts) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let k = 0; k < 6; k++) {
        const t = k / 6, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
          (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    return out;
  }
  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function mix(a, b, t) { a = hex(a); b = hex(b); return toHex(a.map((v, i) => v + (b[i] - v) * t)); }
  function shade(c, k) { return toHex(hex(c).map(v => v * k)); }
  function quant(c, step) { return toHex(hex(c).map(v => Math.round(v / step) * step)); }

  // opts: { pts, seed, density (hairs per 100 sq units), len [min,max],
  //   width [min,max], flow(x,y)->angle rad, color(x,y)->hex, light(x,y)->k,
  //   base (fill hex or url), opacity, edgeOut (how far edge hairs poke out) }
  function paint(o) {
    const r = rng(o.seed || 1);
    const poly = densify(o.pts);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    poly.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    const area = (x1 - x0) * (y1 - y0);
    const n = Math.round(area / 100 * (o.density || 6));
    const len = o.len || [3, 7], wid = o.width || [0.7, 1.4];
    const light = o.light || (() => 1);
    const bins = {};
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
      if (!inside(poly, x, y)) continue;
      const a = o.flow(x, y) + (r() * 2 - 1) * 0.28;
      const L = len[0] + r() * (len[1] - len[0]);
      const w = wid[0] + r() * (wid[1] - wid[0]);
      const bend = (r() * 2 - 1) * L * 0.25;
      const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      const mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
      let c = o.color(x, y, r);
      const j = o.jitter == null ? 0.08 : o.jitter;
      const k = light(x, y) * (1 - j + r() * 2 * j);
      c = quant(shade(c, k), 10);
      const key = c + '|' + (w > (wid[0] + wid[1]) / 2 ? 1 : 0);
      (bins[key] = bins[key] || []).push(`M${f1(x)} ${f1(y)}Q${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}`);
    }
    const wLo = f1(wid[0] + (wid[1] - wid[0]) * 0.25), wHi = f1(wid[0] + (wid[1] - wid[0]) * 0.75);
    let hairs = '';
    Object.keys(bins).forEach(key => {
      const [c, wb] = key.split('|');
      hairs += `<path d="${bins[key].join('')}" stroke="${c}" stroke-width="${wb === '1' ? wHi : wLo}"/>`;
    });
    const d = smooth(o.pts);
    return `<path d="${d}" fill="${o.base}"/>
      <g fill="none" stroke-linecap="round" opacity="${o.opacity || 0.8}">${hairs}</g>` +
      (o.overlay ? `<path d="${d}" fill="${o.overlay}"/>` : '');
  }

  window.FurPaint = { paint, smooth, mix, shade, rng, inside, densify };
})();
