// Dinosaurs — shared drawing kit for the layered pseudo-3D animals.
//
// Every animal is built from a few primitives in one viewBox ("-5 -5 380 310",
// ground line y = 292), the same space the T. rex in dino.js uses:
//   tube(points, widths)  a tapered limb / neck / tail / torso swept along a
//                         smooth curve through `points`, with half-widths
//                         `widths` spread evenly along it, round-capped;
//   shape(points)         a smooth closed outline (heads, frills, plates);
//   ell(cx, cy, rx, ry)   an ellipse as a shape.
// makeKit(palette) gives one animal its own gradients + filters (uid-scoped)
// and K.part(name, shapes, opts), which emits ONE flat data-part layer with
// the house volume shading: a user-space radial gradient across the whole
// part (highlight top-left, darker rim lower-right), a light scaly texture,
// optional pale-belly countershading and clipped shading overlays.
//
// Config, not forks: palettes keep colour axes as separate fields
// (light/mid/dark/deep/deepest/belly/claw/eye/horn …).

(function () {
  'use strict';

  const G = 292;
  const f = n => String(Math.round(n * 10) / 10);
  const pt = p => f(p[0]) + ' ' + f(p[1]);

  // Catmull-Rom point along an open polyline, t in 0..1
  function cr(pts, t) {
    const n = pts.length - 1;
    const fi = t * n;
    const i = Math.min(n - 1, Math.floor(fi));
    const u = fi - i, u2 = u * u, u3 = u2 * u;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const c = k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);
    return [c(0), c(1)];
  }
  function wAt(W, t) {
    const n = W.length - 1;
    if (n < 1) return W[0];
    const fi = t * n, i = Math.min(n - 1, Math.floor(fi)), u = fi - i, s = u * u * (3 - 2 * u);
    return W[i] + (W[i + 1] - W[i]) * s;
  }
  function boxOf(ps) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ps.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function unit(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }

  function tube(pts, W, N) {
    N = N || 28;
    const C = [];
    for (let i = 0; i <= N; i++) C.push(cr(pts, i / N));
    const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const t = unit(C[Math.max(0, i - 1)], C[Math.min(N, i + 1)]);
      const w = wAt(W, i / N);
      L.push([C[i][0] - t[1] * w, C[i][1] + t[0] * w]);
      R.push([C[i][0] + t[1] * w, C[i][1] - t[0] * w]);
    }
    const tE = unit(C[N - 1], C[N]), tS = unit(C[0], C[1]);
    const wE = wAt(W, 1), wS = wAt(W, 0);
    const cE = [C[N][0] + tE[0] * wE * 1.4, C[N][1] + tE[1] * wE * 1.4];
    const cS = [C[0][0] - tS[0] * wS * 1.4, C[0][1] - tS[1] * wS * 1.4];
    let d = 'M' + pt(L[0]);
    for (let i = 1; i <= N; i++) d += 'L' + pt(L[i]);
    d += 'Q' + pt(cE) + ' ' + pt(R[N]);
    for (let i = N - 1; i >= 0; i--) d += 'L' + pt(R[i]);
    d += 'Q' + pt(cS) + ' ' + pt(L[0]) + 'Z';
    return { d, box: boxOf(L.concat(R)) };
  }

  // smooth (Catmull-Rom -> cubic) path through points, open or closed
  function smoothD(ps, closed) {
    const n = ps.length;
    const P = i => closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + pt(ps[0]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' +
        pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
    }
    return d;
  }

  // An organic limb / torso: a centre line `pts` with separate half-widths
  // ABOVE (top[]) and BELOW (bot[]) it, so a belly can hang deeper than the
  // back. "Below" is the right-hand normal of the travel direction (for a line
  // running left->right that is downward). Returns one smooth outline plus
  // band(a, b): a strip between fractions a..b of the width (-1 = top edge,
  // +1 = bottom edge), used for the light / shadow bands that give volume.
  function body(pts, top, bot, N) {
    N = N || 48;
    bot = bot || top;
    const C = [], NR = [], WT = [], WB = [];
    for (let i = 0; i <= N; i++) C.push(cr(pts, i / N));
    for (let i = 0; i <= N; i++) {
      const t = unit(C[Math.max(0, i - 1)], C[Math.min(N, i + 1)]);
      NR.push([-t[1], t[0]]);
      WT.push(Math.max(0, wAt(top, i / N))); WB.push(Math.max(0, wAt(bot, i / N)));
    }
    const off = (i, k) => {
      const w = k < 0 ? WT[i] * -k : WB[i] * k;
      const s = k < 0 ? -1 : 1;
      return [C[i][0] + NR[i][0] * w * s, C[i][1] + NR[i][1] * w * s];
    };
    const ring = (a, b) => {
      const A = [], B = [];
      for (let i = 0; i <= N; i++) { A.push(off(i, a)); B.push(off(i, b)); }
      return A.concat(B.reverse());
    };
    // rounded end caps (an elliptical arc beyond each end) so no part ever
    // shows a flat cut
    const cap = (i, dir) => {
      const t = unit(C[Math.max(0, i - 1)], C[Math.min(N, i + 1)]);
      const out = [], depth = (WT[i] + WB[i]) * 0.45;
      for (let k = 1; k < 6; k++) {
        const a = (Math.PI * k) / 6;               // 0 = bottom side .. PI = top side
        const w = Math.cos(a) >= 0 ? WB[i] * Math.cos(a) : WT[i] * Math.cos(a);
        const along = Math.sin(a) * depth * dir;
        out.push([C[i][0] + NR[i][0] * w + t[0] * along, C[i][1] + NR[i][1] * w + t[1] * along]);
      }
      return out;
    };
    // walk: top edge 0..N, end cap (top->bottom), bottom edge N..0, start
    // cap (bottom->top). cap() runs bottom->top.
    const outline = [];
    for (let i = 0; i <= N; i++) outline.push(off(i, -1));
    cap(N, 1).reverse().forEach(p => outline.push(p));
    for (let i = N; i >= 0; i--) outline.push(off(i, 1));
    cap(0, -1).forEach(p => outline.push(p));
    return {
      d: smoothD(outline, true) , box: boxOf(outline),
      band: (a, b, i0, i1) => {
        i0 = i0 == null ? 0 : Math.round(i0 * N); i1 = i1 == null ? N : Math.round(i1 * N);
        const A = [], B = [];
        for (let i = i0; i <= i1; i++) { A.push(off(i, a)); B.push(off(i, b)); }
        return smoothD(A.concat(B.reverse()), true);
      },
      edge: (k, i0, i1) => {
        i0 = i0 == null ? 0 : Math.round(i0 * N); i1 = i1 == null ? N : Math.round(i1 * N);
        const A = []; for (let i = i0; i <= i1; i++) A.push(off(i, k));
        return smoothD(A, false);
      }
    };
  }

  function shape(pts) {
    const n = pts.length;
    let d = 'M' + pt(pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
    }
    return { d: d + 'Z', box: boxOf(pts) };
  }

  function ell(cx, cy, rx, ry, rot) {
    const a = (rot || 0) * Math.PI / 180, ps = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
      ps.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
    }
    return shape(ps);
  }

  // seeded RNG so textures are identical on every layer copy
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeKit(pal, ko) {
    ko = ko || {};
    const uid = 'k' + Math.random().toString(36).slice(2, 8);
    const id = n => uid + '-' + n;
    const url = n => `url(#${id(n)})`;
    const defs = [];
    let gi = 0;

    defs.push(`
      <!-- skin: the part's own silhouette, blurred, is used as a height map
           and lit (so every part reads as a rounded form with a soft
           terminator and a gentle sheen), times a fine pebbly scale bump. -->
      <filter id="${id('skin')}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${ko.round || 5}" result="b"/>
          <feOffset in="b" dx="-${ko.round ? (ko.round * 0.6).toFixed(1) : 3}" dy="-${ko.round ? (ko.round * 0.6).toFixed(1) : 3}" result="bl"/>
          <feColorMatrix in="bl" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="L"/>
          <feOffset in="b" dx="${ko.round ? (ko.round * 0.6).toFixed(1) : 3}" dy="${ko.round ? (ko.round * 0.6).toFixed(1) : 3}" result="bd"/>
          <feColorMatrix in="bd" type="matrix" values="0 0 0 -1 1  0 0 0 -1 1  0 0 0 -1 1  0 0 0 0 1" result="rim"/>
          <feTurbulence type="fractalNoise" baseFrequency="${ko.grain || 1.15}" numOctaves="2" seed="11" result="n"/>
          <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="grain"/>
          <feComposite in="SourceGraphic" in2="L" operator="arithmetic" k1="0.62" k2="0.5" result="shaded"/>
          <feComposite in="shaded" in2="grain" operator="arithmetic" k1="0.5" k2="0.75" result="lit"/>
          <feComposite in="rim" in2="SourceAlpha" operator="in" result="rim2"/>
          <feComposite in="lit" in2="rim2" operator="arithmetic" k2="1" k3="0.14" result="sum"/>
          <feComposite in="sum" in2="SourceGraphic" operator="in"/>
        </filter>
      <filter id="${id('blur')}" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${id('mist')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
      <radialGradient id="${id('cs')}"><stop offset="0" stop-color="#140d06" stop-opacity="0.5"/><stop offset="1" stop-color="#140d06" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id('hl')}"><stop offset="0" stop-color="#fff4dc" stop-opacity="0.5"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id('eye')}" cx="40%" cy="38%"><stop offset="0" stop-color="#f7d57e"/><stop offset="0.7" stop-color="${pal.eye || '#c98a2a'}"/><stop offset="1" stop-color="#5a3510"/></radialGradient>
      <linearGradient id="${id('horn')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.horn || '#efe4c8'}"/><stop offset="1" stop-color="#8f8166"/></linearGradient>
      <linearGradient id="${id('hornD')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8ab8c"/><stop offset="1" stop-color="#5e5442"/></linearGradient>
      <radialGradient id="${id('dirt')}"><stop offset="0" stop-color="#8f7650" stop-opacity="0.5"/><stop offset="1" stop-color="#8f7650" stop-opacity="0"/></radialGradient>`);

    function unionBox(shapes) {
      const ps = [];
      shapes.forEach(s => { ps.push([s.box.x, s.box.y], [s.box.x + s.box.w, s.box.y + s.box.h]); });
      return boxOf(ps);
    }

    // radial volume gradient over a box; returns its url()
    function gradUrl(cols, b) {
      const g = id('g' + (gi++));
      defs.push(`<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${f(b.x + b.w * 0.32)}" cy="${f(b.y + b.h * 0.24)}" r="${f(Math.max(b.w, b.h, 4) * 0.95)}">` +
        `<stop offset="0" stop-color="${cols[0]}"/><stop offset="0.55" stop-color="${cols[1]}"/><stop offset="1" stop-color="${cols[2]}"/></radialGradient>`);
      return `url(#${g})`;
    }

    const toneCols = tone => tone === 'dark'
      ? [pal.mid, pal.dark, pal.deepest]
      : [pal.light, pal.mid, pal.deep];

    // one flat data-part layer. opts:
    //   tone 'dark' (far-side parts) | colors [light, mid, deep]
    //   belly true|opacity   pale underside countershading
    //   clip  markup clipped to the part's outline (shading overlays)
    //   under / over  raw markup before / after the shaded body
    //   texture false  no scaly filter      transform  placement (static)
    //   hidden  start at opacity 0 (fx-* parts)
    function part(name, shapes, o) {
      o = o || {};
      shapes = [].concat(shapes);
      const b = unionBox(shapes);
      // one shared light across the whole animal (no colour seams at joins);
      // the skin filter gives each part its own roundness
      const g = gradUrl(o.colors || toneCols(o.tone), o.colors ? b : (ko.box || { x: 20, y: 120, w: 340, h: 172 }));
      const ds = shapes.map(s => `<path d="${s.d}"/>`).join('');
      let inner = (o.under || '') +
        `<g fill="${g}"${o.texture === false ? '' : ` filter="${url('skin')}"`}>${ds}</g>`;
      if (o.belly && pal.belly) {
        const bg = id('b' + (gi++));
        const op = o.belly === true ? 0.8 : o.belly;
        defs.push(`<linearGradient id="${bg}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(b.y + b.h * 0.45)}" x2="0" y2="${f(b.y + b.h)}">` +
          `<stop offset="0" stop-color="${pal.belly}" stop-opacity="0"/><stop offset="1" stop-color="${pal.belly}" stop-opacity="${op}"/></linearGradient>`);
        inner += `<g fill="url(#${bg})">${ds}</g>`;
      }
      if (o.tone === 'dark') inner += `<g fill="#140d06" opacity="0.18">${ds}</g>`;
      if (o.clip) {
        const c = id('c' + (gi++));
        defs.push(`<clipPath id="${c}">${ds}</clipPath>`);
        inner += `<g clip-path="url(#${c})">${o.clip}</g>`;
      }
      inner += o.over || '';
      if (o.transform) inner = `<g transform="${o.transform}">${inner}</g>`;
      return `<g data-part="${name}"${o.hidden ? ' opacity="0"' : ''}>${inner}</g>`;
    }

    const K = {
      uid, id, url, part, gradUrl,
      defs: () => `<defs>${defs.join('')}</defs>`,
      cs: (cx, cy, rx, ry, op) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${url('cs')}"${op != null ? ` opacity="${op}"` : ''}/>`,
      hl: (cx, cy, rx, ry, op) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${url('hl')}"${op != null ? ` opacity="${op}"` : ''}/>`,
      // small deep-set eye under a brow
      eye: (x, y, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 2)}" ry="${f(r * 1.4)}" fill="#140d06" opacity="0.4"/>` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${url('eye')}"/>` +
        `<circle cx="${f(x - r * 0.15)}" cy="${f(y)}" r="${f(r * 0.46)}" fill="#120b05"/>` +
        `<circle cx="${f(x - r * 0.45)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.22)}" fill="#fffbe8"/>` +
        `<path d="M${f(x - r * 2.2)} ${f(y - r * 1.2)} q${f(r * 2.4)} ${f(-r * 2)} ${f(r * 4.6)} ${f(-r * 0.4)}" fill="none" stroke="${pal.deepest}" stroke-width="${f(Math.max(0.8, r * 0.5))}" stroke-linecap="round" opacity="0.45"/>` +
        `<path d="M${f(x - r * 1.3)} ${f(y + r * 0.9)} q${f(r * 1.4)} ${f(r * 0.7)} ${f(r * 2.6)} 0" fill="none" stroke="${pal.deepest}" stroke-width="0.6" opacity="0.4"/>`,
      horn: (pts, W, dark) => `<path d="${tube(pts, W, 16).d}" fill="${url(dark ? 'hornD' : 'horn')}"/>`,
      fill: (sh, col, extra) => `<path d="${sh.d}" fill="${col}"${extra || ''}/>`,
      // a hooked claw at (x, y), pointing left (dir -1) or right (dir 1)
      claw: (x, y, s, dir) => {
        dir = dir || -1;
        return `<path d="M${f(x)} ${f(y - s * 0.7)} q${f(s * dir)} ${f(s * 0.1)} ${f(s * 1.3 * dir)} ${f(s * 0.9)} l${f(-s * 1.1 * dir)} ${f(-s * 0.05)} z" fill="${pal.claw || '#1f1810'}"/>`;
      },
      // short feather strokes scattered over a box
      feathers: (b, n, cols, seed) => {
        const r = rng(seed || 7);
        let out = '';
        for (let i = 0; i < n; i++) {
          const x = b.x + r() * b.w, y = b.y + r() * b.h, l = 3 + r() * 4;
          out += `<path d="M${f(x)} ${f(y)} q${f(l * 0.5)} ${f(l * 0.3)} ${f(l)} ${f(l * 0.7)}" fill="none" stroke="${cols[i % cols.length]}" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>`;
        }
        return out;
      },
      // scattered larger scales (tubercles): a soft dark ring + a lit cap
      tubercles: (b, n, seed, r0) => {
        const r = rng(seed || 3);
        let out = '';
        for (let i = 0; i < n; i++) {
          const x = b.x + r() * b.w, y = b.y + r() * b.h, s = (r0 || 1.6) * (0.6 + r() * 0.8);
          out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${pal.deepest}" opacity="0.22"/>` +
                 `<circle cx="${f(x - s * 0.25)}" cy="${f(y - s * 0.3)}" r="${f(s * 0.55)}" fill="${pal.light}" opacity="0.35"/>`;
        }
        return out;
      },
      // soft skin creases (an arc of short strokes) e.g. at knees and necks
      creases: (list, op) => `<g fill="none" stroke="${pal.deepest}" stroke-linecap="round" stroke-width="0.9" opacity="${op || 0.35}">` +
        list.map(c => `<path d="${c}"/>`).join('') + '</g>',
      // trampled dirt + soft contact shadows under the feet
      ground: (cx, rx, spots, scenery) =>
        (scenery === false ? '' : `<g data-part="dino-ground"><ellipse cx="${cx}" cy="${G + 2}" rx="${rx}" ry="16" fill="${url('dirt')}"/></g>`) +
        `<g data-part="shadow">${spots.map(s => `<ellipse cx="${f(s[0])}" cy="${f(s[1])}" rx="${f(s[2])}" ry="${f(s[3] || Math.max(2.5, s[2] * 0.16))}" fill="rgba(35,22,8,0.36)" filter="${url('blur')}"/>`).join('')}</g>`
    };
    return K;
  }

  // a child silhouette standing with feet at (x, g), h px tall
  function child(x, h, g) {
    g = g == null ? G : g;
    const s = h / 33;
    return `<g transform="translate(${f(x)} ${f(g)}) scale(${(s).toFixed(3)})">
      <ellipse cx="1.5" cy="0.4" rx="7.5" ry="1.5" fill="rgba(30,20,10,0.28)"/>
      <circle cx="0.6" cy="-29.6" r="3.6" fill="#2f3640"/>
      <path d="M-2.2 -26 L2.2 -26 C4.6 -25.6 5.4 -23.6 5.6 -20 L6.6 -13.5 L5 -13.2
               L4 -18.5 L3.8 -12 L3.4 -0.2 L0.8 -0.2 L0.4 -10 L-0.4 -10 L-0.8 -0.2
               L-3.4 -0.2 L-3.8 -12 L-4 -18.5 L-5 -13.2 L-6.6 -13.5 L-5.6 -20
               C-5.4 -23.6 -4.6 -25.6 -2.2 -26 Z" fill="#2f3640"/>
    </g>`;
  }

  function sceneAnim(tracks) {
    if (typeof buildAnim !== 'function') return '';
    return buildAnim('d' + Math.random().toString(36).slice(2, 8), { tracks });
  }

  // CSS transform that applies `base` (about the track origin O) and then a
  // rotation of `deg` about the hinge H — one element, one track.
  function hinge(base, H, O, deg) {
    const dx = H[0] - O[0], dy = H[1] - O[1];
    return `${base} translate(${dx}px,${dy}px) rotate(${deg}deg) translate(${-dx}px,${-dy}px)`;
  }

  function wrap(K, anim, body, vb) {
    // padded box: same design coordinates, drawn smaller so wings, tails and
    // heads near the edges stay on the page (the reef book's trick)
    return `<svg viewBox="${vb || '-40 -50 450 380'}" xmlns="http://www.w3.org/2000/svg">${K.defs()}${anim}${body}</svg>`;
  }

  // a builder's SVG as plain markup (no layers / no animation) for reuse
  // inside another picture (the size ladder and the to-scale line-up)
  function flatten(svg) {
    return svg
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .replace(/\sdata-part="[^"]*"/g, '')
      .replace(/^\s*<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '');
  }

  // place species `meta` at k px/metre with its left edge at x, feet on g
  function place(meta, k, x, g) {
    const sc = k / meta.s;
    const svg = meta.build({ child: false, scenery: false });
    return `<g transform="translate(${f(x)} ${f(g)}) scale(${sc.toFixed(4)}) translate(${-meta.x0} ${-G})">${flatten(svg)}</g>`;
  }

  window.DinoKit = { G, f, along: cr, body, smoothD, tube, shape, ell, rng, makeKit, child, sceneAnim, hinge, wrap, flatten, place };
  window.DINO_META = window.DINO_META || {};
})();
