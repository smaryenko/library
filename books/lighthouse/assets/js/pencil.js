// HOW A LIGHTHOUSE WORKS: the coloured-pencil kit (from the style preview).
// An illustrator's finished piece, not a sketch:
//  - tone, not outlines: every area is dense, fine, directional pencil
//    strokes (a tiling stroke pattern used as a mask) over a tonal gradient,
//    so forms are modelled light -> core shadow -> reflected light;
//  - two or three layers per area in different stroke directions (warm base,
//    cool shadow), paper tooth speckled through by one filter;
//  - contours only where an illustrator would draw them (sepia on warm
//    things, indigo on cool ones), two passes of different pressure; no
//    outline on sky, sea or glow (lost edges);
//  - atmospheric perspective: far things pale and cool, near things warm.
// The picture is complete from the first frame; a tap plays one small motion.
// Exposes window.PENCIL: { C, page(seed), tower(P, opts), gulls(P, part, list) }.
(function () {
'use strict';
const D = window.DRAWKIT;
const { rng, f1, smoothPath, straight, circle, bbox } = D;

// ---- tune by eye -------------------------------------------------------------
const PLAY = 2.4;                // tap animation length (the engine clears is-playing at 2.5 s)
const TILE = 30;                 // stroke tile size (viewBox units)
const C = {
  sepia: '#4a3b33', indigo: '#2c3554',
  skyTop: '#53699f', skyMid: '#b48fb4', skyLow: '#f1bf86',
  sun: '#ffd87a', glow: '#f6b25e',
  cliff: '#8a87ad', cliffD: '#5c5f8a',
  seaFar: '#c592a0', seaMid: '#41709f', seaNear: '#1e3a62', seaT: '#2f8a95',
  rockL: '#b08b66', rockD: '#3f3029', rockV: '#5b5378',
  redL: '#e0644a', redD: '#80242c', whiteS: '#7a7898', iron: '#3c3e4a',
  cloudT: '#f7c08e', cloudB: '#9a7fae', grass: '#6f8a3c', foam: '#cfe2ea', violet: '#3a2f5e',
  cottage: '#e9d6c4', glowWin: '#ffcf5c',
  lamp: '#ffe08a', lampO: '#f08a32', beam: '#ffe39a', boat: '#2c2a3a',
  night: '#1b2546', nightLow: '#33406a', paper: '#efe3c8', paperD: '#c9b48a',
  brass: '#c9a24a', brassD: '#7a5a22', glass: '#bfe3ea', glassD: '#5f9aa8',
  fog: '#d9dde2', fogD: '#9aa3b0', weed: '#4f6a2a', dawnTop: '#8fa7d0', dawnLow: '#ffc79a'
};
let seq = 0;

// A page: collects defs and per-part markup, returns the finished SVG.
function page(seed = 1) {
  const uid = 'pc' + (++seq);
  const R = rng(seed);
  const defs = [], parts = {};
  const out = (part, s) => { parts[part] = (parts[part] || '') + s; };
  const id = n => `${uid}-${n}`;
  let mk = 0, gid = 0;

  // pencil-stroke tiles: many fine parallel strokes of uneven pressure with
  // small breaks, rotated per direction; drawn in white (used as masks)
  const hatchTile = (name, deg, gap, s0) => {
    const r = rng(s0);
    let s = '';
    for (let y = gap / 2; y < TILE; y += gap * (0.85 + r() * 0.3)) {
      let x = -4;
      while (x < TILE + 4) {
        // heavier pressure than a light sketch (was o 0.6-1, w 0.55-0.95): the
        // strokes cover more paper, so colours read stronger, not washed out
        const len = 8 + r() * 20, o = 0.8 + r() * 0.2, w = 0.72 + r() * 0.4, dy = (r() - 0.5) * 0.4;
        s += `<path d="M${f1(x)} ${f1(y)}l${f1(len)} ${f1(dy)}" stroke="#fff" stroke-opacity="${o.toFixed(2)}" stroke-width="${w.toFixed(2)}" stroke-linecap="round"/>`;
        x += len + r() * 1.6;
      }
    }
    defs.push(`<pattern id="${id(name)}" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse" patternTransform="rotate(${deg})">${s}</pattern>`);
  };
  hatchTile('h1', -32, 0.95, 3);   // main direction (right-handed, up-right)
  hatchTile('h2', 28, 1.15, 4);    // cross layer for shadows
  hatchTile('h3', -70, 1.0, 5);    // steep, for upright forms
  hatchTile('h4', -4, 0.95, 6);    // near-horizontal, for water and sky

  const stops = s => s.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  const P = {
    uid, R, id, C,
    cls: n => `${uid}-${n}`,
    lin(name, x1, y1, x2, y2, s) { defs.push(`<linearGradient id="${id(name)}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">${stops(s)}</linearGradient>`); return name; },
    rad(name, cx, cy, r, s) { defs.push(`<radialGradient id="${id(name)}" gradientUnits="userSpaceOnUse" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}">${stops(s)}</radialGradient>`); return name; },
    gname: base => base + (gid++),
    // one tonal layer: colour / gradient rect masked by (stroke tile ∩ shape)
    tone(part, d, box, fill, hatch = 'h1', o = 1) {
      const m = id('m' + (mk++)), [x0, y0, x1, y1] = box;
      defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="${f1(x0 - 4)}" y="${f1(y0 - 4)}" width="${f1(x1 - x0 + 8)}" height="${f1(y1 - y0 + 8)}"><path d="${d}" fill="url(#${id(hatch)})"/></mask>`);
      const f = fill.startsWith('#') ? fill : `url(#${id(fill)})`;
      out(part, `<rect x="${f1(x0 - 2)}" y="${f1(y0 - 2)}" width="${f1(x1 - x0 + 4)}" height="${f1(y1 - y0 + 4)}" fill="${f}" opacity="${o}" mask="url(#${m})"/>`);
    },
    // tone over a point list (smooth or straight outline)
    area(part, pts, fill, hatch, o = 1, soft = false) { P.tone(part, soft ? smoothPath(pts, true) : straight(pts), bbox(pts), fill, hatch, o); },
    // a contour: two passes of different pressure
    contour(part, d, c, w = 0.7) {
      out(part, `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="0.8" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(w * 0.5 * 10) / 10}" opacity="0.4" transform="translate(0.5 0.35)" stroke-linecap="round" stroke-linejoin="round"/>`);
    },
    // a free pencil line (accents: darks, glints, waves, cracks)
    accent(part, d, c, w, o = 0.8, extra = '') { out(part, `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`); },
    raw(part, s) { out(part, s); },
    // wrap everything fn() adds to `part` in a group (for tap motions)
    group(part, cls, fn, style = '') {
      const before = (parts[part] || '').length;
      fn();
      const all = parts[part] || '';
      parts[part] = all.slice(0, before) + `<g class="${uid}-${cls}"${style ? ` style="${style}"` : ''}>${all.slice(before)}</g>`;
    },
    // order: data-part layers back to front; css uses the uid prefix (P.cls)
    end({ order, css = '', fit = '8 14 284 250', hit = '20 20 260 240' }) {
      const body = order.map(p => `<g data-part="${p}" filter="url(#${id('tooth')})">${parts[p] || ''}</g>`).join('');
      return `<svg data-pencil="${uid}" viewBox="0 0 300 300" data-fit="${fit}" data-hit="${hit}" xmlns="http://www.w3.org/2000/svg">
    <style>${css}</style>
    <defs>
      <filter id="${id('tooth')}" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="5" result="n"/>
        <!-- paper tooth: lighter than before (was -1.4 / 1.45, which knocked out
             up to half of every stroke), so the colour isn't greyed by paper -->
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.4" result="m"/>
        <!-- richer pigment: more saturated colour, same hues -->
        <feColorMatrix in="SourceGraphic" type="saturate" values="1.35" result="s"/>
        <feComposite in="s" in2="m" operator="in" result="g"/>
        <feDisplacementMap in="g" in2="n" scale="0.8" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      ${defs.join('\n      ')}
    </defs>
    ${body}
  </svg>`;
    },
    PLAY
  };
  return P;
}

// ---- shared pieces ------------------------------------------------------------------
// A lighthouse tower: white with three red bands, iron gallery, glass lantern
// with the lamp, red roof. Shaded as a cylinder lit from the left. Scales with
// its height (the preview's tower is 100 tall). Returns the lamp centre.
// opts: cx, base, top, part, lit (0..1 lamp brightness), halo (radius factor),
// haloCls (a class on the halo for tap motions), bands, far (paler, cooler).
function tower(P, { cx, base, top, part = 'pc-tower', lit = 1, halo = 1, haloCls = '', bands = true, far = false, haloPart = null }) {
  const s = (base - top) / 100, wb = 14 * s, wt = 9 * s;
  const LX = y => cx - wb + (base - y) / (base - top) * (wb - wt), RX = y => cx + wb - (base - y) / (base - top) * (wb - wt);
  const body = [[cx - wb, base], [cx - wt, top], [cx + wt, top], [cx + wb, base]];
  const gal = [[cx - 17 * s, top - 6 * s], [cx + 17 * s, top - 6 * s], [cx + 17 * s, top], [cx - 17 * s, top]];
  const lan = [[cx - 8 * s, top - 24 * s], [cx + 8 * s, top - 24 * s], [cx + 8 * s, top - 6 * s], [cx - 8 * s, top - 6 * s]];
  const roof = [[cx - 12 * s, top - 24 * s], [cx + 12 * s, top - 24 * s], [cx, top - 39 * s]];
  const lamp = [cx, top - 15 * s];
  const k = P.gname('tw');
  const cyl = (n, light, dark, a0) => P.lin(n, cx - wb, 0, cx + wb, 0, [[0, light, a0 * 0.8], [0.3, light, a0 * 0.5], [0.72, dark, a0], [0.9, dark, a0 * 0.85], [1, dark, a0 * 0.55]]);
  cyl(k + 'w', far ? '#c9b8c4' : '#d9a49a', far ? '#9a98b4' : C.whiteS, far ? 0.7 : 0.95);
  cyl(k + 'r', far ? '#c98a86' : C.redL, far ? '#8a5a6a' : C.redD, 1);
  P.lin(k + 'f', cx - 12 * s, 0, cx + 12 * s, 0, [[0, C.redL, 0.9], [0.55, C.redD, 0.95], [1, C.redD, 0.8]]);
  P.rad(k + 'l', lamp[0], lamp[1], 12 * s, [[0, '#fff6c8', 1], [0.5, C.lamp, lit], [1, C.lampO, 0.9 * lit]]);
  const w = Math.max(0.35, Math.min(0.8, 0.7 * s));
  P.contour(part, straight(body), C.sepia, w);
  P.contour(part, straight(gal) + straight(lan) + straight(roof), C.sepia, w * 0.85);
  P.tone(part, straight(body), bbox(body), k + 'w', 'h3', 1);
  if (bands) {
    const h = base - top, band = (a, b) => { const y0 = base - h * b, y1 = base - h * a; return [[LX(y0), y0], [RX(y0), y0], [RX(y1), y1], [LX(y1), y1]]; };
    const d = [[0, 0.2], [0.4, 0.6], [0.8, 1]].map(([a, b]) => straight(band(a, b))).join('');
    P.tone(part, d, bbox(body), k + 'r', 'h3', 1);
    P.tone(part, d, bbox(body), k + 'r', 'h2', 0.55);
  }
  P.tone(part, straight(gal), bbox(gal), C.iron, 'h1', 0.85);
  P.tone(part, straight(lan), bbox(lan), k + 'l', 'h3', 1);
  P.tone(part, straight(roof), bbox(roof), k + 'f', 'h1', 1);
  P.accent(part, `M${f1(RX(base) - 1.5 * s)} ${f1(base)}L${f1(RX(top + 1) - s)} ${f1(top + 1)}`, C.redD, 0.9 * s, 0.5);   // core shadow
  P.accent(part, `M${f1(cx - 3 * s)} ${f1(top - 23 * s)}L${f1(cx - 3 * s)} ${f1(top - 7 * s)}M${f1(cx + 3 * s)} ${f1(top - 23 * s)}L${f1(cx + 3 * s)} ${f1(top - 7 * s)}`, C.iron, 0.6 * s, 0.85);
  P.accent(part, Array.from({ length: 9 }, (_, i) => `M${f1(cx - 15 * s + i * 4 * s)} ${f1(top - 6 * s)}L${f1(cx - 15 * s + i * 4 * s)} ${f1(top - 10.5 * s)}`).join('') + `M${f1(cx - 17 * s)} ${f1(top - 10.5 * s)}L${f1(cx + 17 * s)} ${f1(top - 10.5 * s)}`, C.iron, 0.45 * s, 0.8);
  P.accent(part, `M${f1(cx - 4 * s)} ${f1(base)}L${f1(cx - 4 * s)} ${f1(base - 8 * s)}Q${f1(cx)} ${f1(base - 13 * s)} ${f1(cx + 4 * s)} ${f1(base - 8 * s)}L${f1(cx + 4 * s)} ${f1(base)}`, C.sepia, 1.1 * s, 0.75);
  if (halo > 0) {
    const hr = 26 * s * halo, hp = haloPart || 'pc-beam', hn = k + 'h';
    P.rad(hn, lamp[0], lamp[1], hr, [[0, C.lamp, 0.9 * lit], [1, C.lamp, 0]]);
    const draw = () => P.tone(hp, straight(circle(lamp[0], lamp[1], hr)), [lamp[0] - hr, lamp[1] - hr, lamp[0] + hr, lamp[1] + hr], hn, 'h4', 1);
    if (haloCls) P.group(hp, haloCls, draw, `transform-box:view-box;transform-origin:${f1(lamp[0])}px ${f1(lamp[1])}px`);
    else draw();
  }
  return { lamp, s, body };
}

// gulls: little "m" strokes; class `gull` flaps on tap when the page's css says so
function gulls(P, part, list) {
  list.forEach(([x, y, s], i) => P.raw(part,
    `<g class="${P.cls('gull')}" style="transform-box:view-box;transform-origin:${x}px ${y}px;animation-delay:${(i * 0.13).toFixed(2)}s"><path d="M${f1(x - s)} ${f1(y + s * 0.15)}Q${f1(x - s * 0.45)} ${f1(y - s * 0.65)} ${x} ${y}Q${f1(x + s * 0.45)} ${f1(y - s * 0.65)} ${f1(x + s)} ${f1(y + s * 0.15)}" fill="none" stroke="${C.indigo}" stroke-width="0.75" opacity="0.85" stroke-linecap="round"/></g>`));
}
const gullCss = P => `.${P.cls('gull')}{transform-box:view-box}
  svg.is-playing .${P.cls('gull')}{animation:${P.cls('fl')} 0.4s ease-in-out 6 both}
  @keyframes ${P.cls('fl')}{0%,100%{transform:scale(1,1)}50%{transform:scale(1.08,-0.6) translateY(1px)}}`;

window.PENCIL = { C, PLAY, page, tower, gulls, gullCss };
})();
