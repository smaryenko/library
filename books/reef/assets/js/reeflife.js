// Reef creatures for "A Day on the Reef". Original layered SVG in the house
// style: detailed & believable, warm and kid-friendly.
//
// HOW THESE ARE USED (copied from the race book's pattern): every function
// here is a DRAW helper, not a whole-SVG builder. `drawX(o)` returns
//   { defs, <layer>: markup, ..., pt(lx, ly) }
// where each layer's markup is wrapped in a plain, NO-data-part placement
//   <g transform="translate(x y) scale(±s s) rotate(rot)">
// The scene (props.js) drops each layer into its own flat, role-named
// `<g data-part="...">` in ONE scene SVG, and collects every `defs` string at
// the SVG root (so gradients exist on every split layer). Animations target
// the role groups; `pt()` maps a creature-local point to scene coordinates so
// a scene can put pivots exactly on a flipper root, an eye, a claw.
//
// Placement options shared by all draw helpers:
//   o = { x, y, s, flip, rot }  — x,y = where the creature's local origin
//   lands; flip mirrors it left↔right about that origin.
//
// Kept art: clownfish, octopus, jellyfish (unchanged drawings).
// Redrawn to match the local references (.kiro/reference/underwater/, never
// traced or shipped): conch shell, hermit crab, seahorse, moray eel; and the
// pufferfish + green sea turtle redrawn naturalistically.

'use strict';

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function reefShade(hex, pct) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16),
        g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
  const f = v => Math.max(0, Math.min(255,
    Math.round(v + (pct < 0 ? v * pct : (255 - v) * pct))));
  const to = v => f(v).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

function reefUid() { return 'r' + Math.random().toString(36).slice(2, 8); }

// deterministic PRNG so scattered texture is identical on every split layer
function reefRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

const reefF = v => (+v).toFixed(1);

// placement transform + local→scene point mapping
function reefPlace(o) {
  const s = o.s || 1;
  return `translate(${reefF(o.x || 0)} ${reefF(o.y || 0)}) scale(${o.flip ? -s : s} ${s})` +
    (o.rot ? ` rotate(${o.rot})` : '');
}
function reefPt(o, lx, ly) {
  const s = o.s || 1, f = o.flip ? -1 : 1, a = (o.rot || 0) * Math.PI / 180;
  const rx = lx * Math.cos(a) - ly * Math.sin(a);
  const ry = lx * Math.sin(a) + ly * Math.cos(a);
  return [(o.x || 0) + f * s * rx, (o.y || 0) + s * ry];
}
function reefWrap(o, inner) { return `<g transform="${reefPlace(o)}">${inner}</g>`; }

// Catmull-Rom → cubic Bézier path through points
function reefSmooth(pts, closed) {
  const n = pts.length;
  let d = `M${reefF(pts[0][0])} ${reefF(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${reefF(c1x)} ${reefF(c1y)} ${reefF(c2x)} ${reefF(c2y)} ${reefF(p2[0])} ${reefF(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

// Offset a centre-line by a per-point width (skills §4 offsetStrip). L = the
// +normal side (normal = (-dy, dx)), R = the −normal side.
function reefSides(pts, widths) {
  const n = pts.length, L = [], R = [], N = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const nx = -dy, ny = dx, w = widths[i] / 2;
    N.push([nx, ny]);
    L.push([p[0] + nx * w, p[1] + ny * w]);
    R.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return { L, R, N };
}
function reefStrip(pts, widths) {
  const { L, R } = reefSides(pts, widths);
  return reefSmooth(L.concat(R.slice().reverse()), true);
}
// a sub-strip between two fractions across the width (0 = L edge, 1 = R edge)
function reefBand(pts, widths, f0, f1, wScale) {
  const { L, R } = reefSides(pts, widths);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const mid = pts.map((_, i) => lerp(L[i], R[i], (f0 + f1) / 2));
  const w = widths.map(v => v * Math.abs(f1 - f0) * (wScale || 1));
  return reefStrip(mid, w);
}

// A friendly round eye (kept for the clownfish / octopus / jellyfish art).
function reefEye(cx, cy, r, look) {
  const dx = (look || 0) * r * 0.32;
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="1"/>
    <circle cx="${(cx + dx).toFixed(1)}" cy="${cy}" r="${(r * 0.6).toFixed(1)}" fill="#2a1b12"/>
    <circle cx="${(cx + dx).toFixed(1)}" cy="${cy}" r="${(r * 0.32).toFixed(1)}" fill="#0c0805"/>
    <circle cx="${(cx + dx - r * 0.24).toFixed(1)}" cy="${(cy - r * 0.3).toFixed(1)}" r="${(r * 0.2).toFixed(1)}" fill="#ffffff"/>`;
}

// A structured eye for the redrawn creatures: sclera, coloured iris ring,
// pupil, catchlights, and an upper lid in skin colour (lid = 0..0.5 of the
// eye covered) with a darker lid crease.
function reefEyeRich(cx, cy, r, opt) {
  opt = opt || {};
  const iris = opt.iris || '#6b4a22';
  const irisR = r * (opt.irisR || 0.68);
  const look = opt.look || 0;
  const ix = cx + look * r * 0.22, iy = cy + (opt.lookY || 0) * r * 0.2;
  let lid = '';
  if (opt.lid) {
    const ly = cy - r + 2 * r * opt.lid;
    const hw = Math.sqrt(Math.max(0, r * r - (ly - cy) * (ly - cy)));
    const la = opt.lid > 0.5 ? 1 : 0;
    const skin = opt.lidColor || '#8a6a3a';
    lid = `<path d="M${reefF(cx - hw - 0.6)} ${reefF(ly)} A${r + 0.6} ${r + 0.6} 0 ${la} 1 ${reefF(cx + hw + 0.6)} ${reefF(ly)}
             Q${reefF(cx)} ${reefF(ly + r * 0.2)} ${reefF(cx - hw - 0.6)} ${reefF(ly)} Z" fill="${skin}"/>
           <path d="M${reefF(cx - hw)} ${reefF(ly)} Q${reefF(cx)} ${reefF(ly + r * 0.2)} ${reefF(cx + hw)} ${reefF(ly)}"
             fill="none" stroke="${reefShade(skin, -0.4)}" stroke-width="${reefF(Math.max(1, r * 0.14))}" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="${cx}" cy="${cy}" r="${reefF(r + r * 0.16)}" fill="${opt.socket || 'rgba(0,0,0,0.18)'}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbfaf4"/>
    <circle cx="${reefF(ix)}" cy="${reefF(iy)}" r="${reefF(irisR)}" fill="${iris}"/>
    <circle cx="${reefF(ix)}" cy="${reefF(iy)}" r="${reefF(irisR * 0.78)}" fill="${reefShade(iris, 0.18)}" opacity="0.55"/>
    <circle cx="${reefF(ix)}" cy="${reefF(iy)}" r="${reefF(irisR * 0.55)}" fill="#0d0a08"/>
    <circle cx="${reefF(ix - irisR * 0.38)}" cy="${reefF(iy - irisR * 0.42)}" r="${reefF(r * 0.24)}" fill="#ffffff"/>
    <circle cx="${reefF(ix + irisR * 0.34)}" cy="${reefF(iy + irisR * 0.3)}" r="${reefF(r * 0.1)}" fill="#ffffff" opacity="0.8"/>
    ${lid}`;
}

// Which way should the clownfish face, and how much should she tilt, to look
// at a target? Art faces LEFT; flip = target is to her right. tilt is the
// local rotation (negative = nose down), clamped so she never stands on end.
function reefFaceToward(fx, fy, tx, ty, max) {
  max = max == null ? 24 : max;
  const dx = tx - fx, dy = ty - fy;
  let tilt = -Math.atan2(dy, Math.abs(dx) || 1) * 180 / Math.PI;
  tilt = Math.max(-max, Math.min(max, tilt));
  const len = Math.hypot(dx, dy) || 1;
  return { flip: dx > 0, tilt, ux: dx / len, uy: dy / len };
}

// ===========================================================================
// CLOWNFISH — the protagonist (art kept). Layers: back (tail + dorsal), body
// (body + bands), front (pectoral + face). Local origin = body centre.
// o.pose: calm | spot | chase | ride | startle | happy (mouth/brow + default
// tilt). o.tilt overrides the pose rotation (used to look at the shell).
// ===========================================================================
function drawClownfish(o) {
  o = o || {};
  const orange = o.body || '#f4701e';
  const oLight = reefShade(orange, 0.34);
  const oDark  = reefShade(orange, -0.28);
  const band   = '#fbfaf3';
  const edge   = '#20242b';
  const uid = o.uid || reefUid();
  const POSE = {
    calm:    { rot: 0,   dx: 0,  dy: 0,  mouth: 'smile', brow: 0 },
    spot:    { rot: -8,  dx: 0,  dy: 0,  mouth: 'o',     brow: 1 },
    chase:   { rot: 6,   dx: 0,  dy: 0,  mouth: 'smile', brow: -1 },
    ride:    { rot: -4,  dx: 0,  dy: 0,  mouth: 'smile', brow: 0 },
    startle: { rot: 10,  dx: 0,  dy: 0,  mouth: 'o',     brow: 2 },
    happy:   { rot: -6,  dx: 0,  dy: 0,  mouth: 'grin',  brow: 0 }
  }[o.pose || 'calm'] || { rot: 0, dx: 0, dy: 0, mouth: 'smile', brow: 0 };
  const rot = o.tilt != null ? o.tilt : POSE.rot;

  function mouthSVG() {
    if (POSE.mouth === 'o')
      return `<ellipse cx="97" cy="168" rx="6.5" ry="7.5" fill="${oDark}"/>
              <ellipse cx="97" cy="169" rx="3.4" ry="4.4" fill="#7a2a12"/>`;
    if (POSE.mouth === 'grin')
      return `<path d="M90 164 q14 14 30 4" fill="none" stroke="${oDark}" stroke-width="4" stroke-linecap="round"/>`;
    return `<path d="M92 166 q12 9 26 2" fill="none" stroke="${oDark}" stroke-width="3.4" stroke-linecap="round"/>`;
  }

  // every layer gets the SAME local frame: centre (180,160) → origin, pose
  // rotation about the centre
  const frame = inner => reefWrap(o,
    `<g transform="translate(-180 -160)"><g transform="rotate(${rot.toFixed(2)} 180 160) translate(${POSE.dx} ${POSE.dy})">${inner}</g></g>`);

  const defs = `
    <radialGradient id="cfBody-${uid}" cx="40%" cy="30%" r="78%">
      <stop offset="0%"  stop-color="${oLight}"/>
      <stop offset="55%" stop-color="${orange}"/>
      <stop offset="100%" stop-color="${oDark}"/>
    </radialGradient>
    <linearGradient id="cfFin-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${oLight}"/>
      <stop offset="100%" stop-color="${orange}"/>
    </linearGradient>`;

  const back = frame(`
    <path d="M250 160 q46 -40 80 -42 q-14 42 0 84 q-36 -2 -80 -42 z" fill="url(#cfFin-${uid})"/>
    <path d="M250 160 q46 -40 80 -42 q-14 42 0 84 q-36 -2 -80 -42 z"
          fill="none" stroke="${edge}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M150 96 q44 -26 92 -8 q-6 16 -16 24 q-40 -14 -78 -2 z" fill="url(#cfFin-${uid})"/>
    <path d="M150 96 q44 -26 92 -8" fill="none" stroke="${edge}" stroke-width="6" stroke-linecap="round"/>`);

  const body = frame(`
    <path d="M92 160 C 92 112, 140 92, 184 94 C 232 96, 262 126, 262 160
             C 262 194, 232 224, 184 226 C 140 228, 92 208, 92 160 Z"
          fill="url(#cfBody-${uid})"/>
    <path d="M126 116 C 160 100, 210 104, 238 124 C 206 112, 158 112, 126 132 Z"
          fill="${oLight}" opacity="0.5"/>
    <path d="M100 176 C 140 212, 210 212, 250 184 C 220 206, 150 210, 118 192 Z"
          fill="${oDark}" opacity="0.28"/>
    <path d="M138 98 C 128 134, 128 184, 140 222 C 154 216, 164 208, 170 198
             C 158 168, 158 150, 168 116 C 160 106, 150 100, 138 98 Z" fill="${band}"/>
    <path d="M138 98 C 128 134, 128 184, 140 222 M168 116 C 158 150, 158 166, 170 198"
          fill="none" stroke="${edge}" stroke-width="4" opacity="0.9"/>
    <path d="M204 100 C 196 136, 196 180, 206 220 C 216 216, 224 208, 228 200
             C 220 168, 220 152, 228 120 C 220 110, 212 104, 204 100 Z" fill="${band}"/>
    <path d="M204 100 C 196 136, 196 180, 206 220 M228 120 C 220 152, 220 166, 228 200"
          fill="none" stroke="${edge}" stroke-width="4" opacity="0.9"/>
    <path d="M248 118 C 242 140, 242 180, 250 202 C 256 198, 260 192, 262 186
             C 256 166, 256 154, 262 134 C 258 126, 254 121, 248 118 Z" fill="${band}"/>`);

  const front = frame(`
    <path d="M178 196 q18 40 4 64 q-30 -6 -40 -40 q14 -16 36 -24 z" fill="url(#cfFin-${uid})"/>
    <path d="M178 196 q18 40 4 64 q-30 -6 -40 -40 q14 -16 36 -24 z"
          fill="none" stroke="${edge}" stroke-width="5" stroke-linejoin="round"/>
    ${reefEye(120, 146, 15, -0.5)}
    ${POSE.brow > 0 ? `<path d="M106 124 q12 -7 26 -2" fill="none" stroke="${oDark}" stroke-width="3.5" stroke-linecap="round"/>` : ''}
    ${mouthSVG()}
    <ellipse cx="124" cy="176" rx="11" ry="7" fill="#ff9a66" opacity="0.38"/>`);

  return { defs, back, body, front, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// OCTOPUS (art kept). Layers: arms, mantle. Local origin = (176,180) of the
// original art; arms root at local (0,16).
// ===========================================================================
function drawOctopus(o) {
  o = o || {};
  const body = o.body || '#b4569b';
  const bLight = reefShade(body, 0.30);
  const bDark  = reefShade(body, -0.28);
  const uid = o.uid || reefUid();

  function arm(x, y, dir, len, w, col) {
    const tip = len, curl = dir * 30;
    return `<path d="M${x - w} ${y}
             C ${x - w} ${y + tip*0.4}, ${x - w + curl*0.3} ${y + tip*0.7}, ${x + curl*0.4} ${y + tip}
             C ${x + curl*0.6} ${y + tip*0.78}, ${x + w + curl*0.2} ${y + tip*0.4}, ${x + w} ${y} Z"
           fill="${col}"/>`;
  }
  const frame = inner => reefWrap(o, `<g transform="translate(-176 -180)">${inner}</g>`);

  const defs = `
    <radialGradient id="ocBody-${uid}" cx="42%" cy="26%" r="80%">
      <stop offset="0%"  stop-color="${bLight}"/>
      <stop offset="58%" stop-color="${body}"/>
      <stop offset="100%" stop-color="${bDark}"/>
    </radialGradient>`;

  const arms = frame(`
    ${arm(126, 196, -1, 92, 18, bDark)}
    ${arm(158, 198, -1, 84, 18, bDark)}
    ${arm(194, 198, 1, 84, 18, bDark)}
    ${arm(226, 196, 1, 92, 18, bDark)}
    ${arm(112, 196, -1, 100, 17, body)}
    ${arm(146, 200, -1, 90, 17, body)}
    ${arm(206, 200, 1, 90, 17, body)}
    ${arm(240, 196, 1, 100, 17, body)}
    <g fill="${bLight}" opacity="0.7">
      <circle cx="104" cy="248" r="4.5"/><circle cx="116" cy="270" r="4.5"/>
      <circle cx="248" cy="248" r="4.5"/><circle cx="236" cy="270" r="4.5"/>
    </g>`);

  const mantle = frame(`
    <path d="M94 158 c 0 -78, 54 -96, 82 -96 c 28 0, 82 18, 82 96
             c 0 30, -22 50, -50 58 c -24 6, -42 6, -64 0 c -28 -8, -50 -28 -50 -58 z"
          fill="url(#ocBody-${uid})"/>
    <path d="M120 96 q56 -26 112 2 q-58 -18 -112 8 z" fill="${bLight}" opacity="0.5"/>
    <circle cx="138" cy="92" r="7" fill="${bLight}" opacity="0.5"/>
    <circle cx="214" cy="92" r="7" fill="${bLight}" opacity="0.5"/>
    ${reefEye(146, 136, 19, -0.15)}
    ${reefEye(206, 136, 19, 0.15)}
    <path d="M160 172 q16 11 32 0" fill="none" stroke="${bDark}" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="124" cy="156" rx="11" ry="7" fill="#ff9ad1" opacity="0.4"/>
    <ellipse cx="228" cy="156" rx="11" ry="7" fill="#ff9ad1" opacity="0.4"/>`);

  return { defs, arms, mantle, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// JELLYFISH (art kept). One layer (bell + oral arms + tentacles). Local
// origin = (180,150) of the original art.
// ===========================================================================
function drawJellyfish(o) {
  o = o || {};
  const body = o.body || '#c58be0';
  const bLight = reefShade(body, 0.34);
  const bDark  = reefShade(body, -0.22);
  const edge   = '#20242b';
  const uid = o.uid || reefUid();

  const tentacles = [120, 142, 166, 196, 220, 242].map((x, i) => {
    const dir = i % 2 ? 1 : -1;
    return `<path d="M${x} 168 q${dir*16} 36 ${-dir*8} 64 q${dir*14} 26 ${-dir*6} 52"
             fill="none" stroke="${body}" stroke-width="5" stroke-linecap="round" opacity="0.75"/>`;
  }).join('');

  const defs = `
    <radialGradient id="jfBell-${uid}" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stop-color="${bLight}"/><stop offset="60%" stop-color="${body}"/>
      <stop offset="100%" stop-color="${bDark}"/>
    </radialGradient>`;

  const jelly = reefWrap(o, `<g transform="translate(-180 -150)">
    ${tentacles}
    <g fill="${reefShade(body, 0.1)}" opacity="0.85">
      <path d="M150 160 q-6 40 -22 58 q-4 -40 8 -60 z"/>
      <path d="M180 164 q0 44 -2 64 q-14 -38 -8 -64 z"/>
      <path d="M210 160 q8 40 22 58 q2 -40 -10 -60 z"/>
    </g>
    <path d="M88 156 C 88 92, 136 64, 180 64 C 224 64, 272 92, 272 156
             C 272 168, 260 172, 180 172 C 100 172, 88 168, 88 156 Z"
          fill="url(#jfBell-${uid})" stroke="${edge}" stroke-width="4" opacity="0.95"/>
    <path d="M118 96 q62 -36 128 0 q-64 -24 -128 8 z" fill="#ffffff" opacity="0.5"/>
    <g fill="${bLight}" opacity="0.5">
      <circle cx="140" cy="118" r="8"/><circle cx="180" cy="108" r="9"/>
      <circle cx="216" cy="120" r="8"/><circle cx="160" cy="136" r="6"/><circle cx="200" cy="136" r="6"/>
    </g>
    <path d="M88 156 q24 14 46 0 q24 14 48 0 q24 14 46 0 q22 14 44 0 q-8 12 -24 12 l-134 0 q-16 0 -26 -12 z"
          fill="${bDark}" opacity="0.4"/>
    ${reefEye(158, 128, 11, -0.1)}
    ${reefEye(202, 128, 11, 0.1)}
    <path d="M166 148 q14 10 28 0" fill="none" stroke="${bDark}" stroke-width="3.2" stroke-linecap="round"/>
  </g>`);

  return { defs, jelly, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// CONCH SHELL — the runaway shell, and later the hermit crab's house. Matches
// the reference conch: a stepped, knobbly SPIRE tapering to a point on the
// LEFT (tilted slightly up), a fat BODY WHORL with big blunt knobs along the
// shoulder, and a wide flared APERTURE on the RIGHT — cream scalloped lip,
// deep orange-pink ridged interior — sweeping down to a pointed siphonal
// canal at lower right. Warm orange-brown with axial ribs, spiral cords and
// rusty streaks; dark ink edge like the reference.
// Local frame: centre (0,0); spans x −153..154, y −90..80; rests on y≈64.
// ===========================================================================
function conchDefs(uid) {
  return `
    <radialGradient id="cnBody-${uid}" cx="36%" cy="26%" r="82%">
      <stop offset="0%"  stop-color="#f8d7a6"/>
      <stop offset="38%" stop-color="#e59c58"/>
      <stop offset="74%" stop-color="#c46a2e"/>
      <stop offset="100%" stop-color="#86421f"/>
    </radialGradient>
    <radialGradient id="cnKnob-${uid}" cx="38%" cy="30%" r="80%">
      <stop offset="0%"  stop-color="#fff5e2"/>
      <stop offset="55%" stop-color="#f0c690"/>
      <stop offset="100%" stop-color="#c3824a"/>
    </radialGradient>
    <linearGradient id="cnLip-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#fde6c6"/>
      <stop offset="50%" stop-color="#f4bb84"/>
      <stop offset="100%" stop-color="#d4864c"/>
    </linearGradient>
    <radialGradient id="cnIn-${uid}" cx="30%" cy="34%" r="88%">
      <stop offset="0%"  stop-color="#ffb894"/>
      <stop offset="42%" stop-color="#ee6c3c"/>
      <stop offset="78%" stop-color="#c4422a"/>
      <stop offset="100%" stop-color="#8c2a1d"/>
    </radialGradient>`;
}

function conchArt(uid) {
  const E = '#3b2214';
  const f = reefF;

  // a blunt rounded knob at base (bx,by) pointing angle `ang` (deg)
  function knob(bx, by, ang, len, w) {
    const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    const b1 = [bx + px * w, by + py * w], b2 = [bx - px * w, by - py * w];
    const tip = [bx + dx * len, by + dy * len];
    const d = `M${f(b1[0])} ${f(b1[1])}
      C${f(b1[0] + dx * len * 0.7)} ${f(b1[1] + dy * len * 0.7)} ${f(tip[0] + px * w * 0.6)} ${f(tip[1] + py * w * 0.6)} ${f(tip[0])} ${f(tip[1])}
      C${f(tip[0] - px * w * 0.6)} ${f(tip[1] - py * w * 0.6)} ${f(b2[0] + dx * len * 0.7)} ${f(b2[1] + dy * len * 0.7)} ${f(b2[0])} ${f(b2[1])}`;
    return `<path d="${d} Z" fill="url(#cnKnob-${uid})"/>
      <path d="${d}" fill="none" stroke="${E}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="${f(tip[0] - dx * len * 0.25 + px * w * 0.25)}" cy="${f(tip[1] - dy * len * 0.25 + py * w * 0.25)}"
               rx="${f(w * 0.32)}" ry="${f(w * 0.22)}" fill="#ffffff" opacity="0.6"/>`;
  }

  // --- spire: stepped whorls along an axis rising up-left to the tip -------
  const A0 = [-72, -28], TIP = [-152, -67];
  const ax = TIP[0] - A0[0], ay = TIP[1] - A0[1];
  const alen = Math.hypot(ax, ay), ux = ax / alen, uy = ay / alen;
  const nUp = [-uy, ux];                      // perpendicular, pointing up-right
  const nAng = Math.atan2(nUp[1], nUp[0]) * 180 / Math.PI;
  const axisAng = Math.atan2(uy, ux) * 180 / Math.PI - 180; // ≈ 26°
  const whorls = [
    { t: 0.80, rx: 8.5, ry: 10 },
    { t: 0.60, rx: 9.5, ry: 16 },
    { t: 0.38, rx: 12.5, ry: 23 },
    { t: 0.12, rx: 14.5, ry: 32 }
  ];
  let spire = '';
  // pointed apex
  const c4 = [A0[0] + ax * 0.8, A0[1] + ay * 0.8];
  spire += `<path d="M${f(c4[0] + nUp[0] * 7)} ${f(c4[1] + nUp[1] * 7)}
      Q${f(TIP[0] + 6)} ${f(TIP[1] - 4)} ${f(TIP[0])} ${f(TIP[1])}
      Q${f(TIP[0] + 4)} ${f(TIP[1] + 8)} ${f(c4[0] - nUp[0] * 7)} ${f(c4[1] - nUp[1] * 7)} Z"
      fill="url(#cnKnob-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>`;
  whorls.forEach((w, i) => {
    const cx = A0[0] + ax * w.t, cy = A0[1] + ay * w.t;
    spire += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${w.rx}" ry="${w.ry}"
        transform="rotate(${f(axisAng)} ${f(cx)} ${f(cy)})"
        fill="url(#cnBody-${uid})" stroke="${E}" stroke-width="2.4"/>
      <ellipse cx="${f(cx - nUp[0] * w.ry * 0.3)}" cy="${f(cy - nUp[1] * w.ry * 0.3)}" rx="${f(w.rx * 0.45)}" ry="${f(w.ry * 0.5)}"
        transform="rotate(${f(axisAng)} ${f(cx)} ${f(cy)})" fill="#a8502a" opacity="0.35"/>
      <ellipse cx="${f(cx + nUp[0] * w.ry * 0.35)}" cy="${f(cy + nUp[1] * w.ry * 0.35)}" rx="${f(w.rx * 0.35)}" ry="${f(w.ry * 0.3)}"
        transform="rotate(${f(axisAng)} ${f(cx)} ${f(cy)})" fill="#fff0d6" opacity="0.5"/>`;
    if (i > 0) {
      // knobs on both shoulders of each whorl (the bumpy spire)
      spire += knob(cx + nUp[0] * w.ry * 0.85, cy + nUp[1] * w.ry * 0.85, nAng, w.ry * 0.42, w.ry * 0.26);
      spire += knob(cx - nUp[0] * w.ry * 0.85, cy - nUp[1] * w.ry * 0.85, nAng + 180, w.ry * 0.34, w.ry * 0.24);
    }
  });

  // --- body whorl ------------------------------------------------------------
  const bodyD = 'M-70 -52 C-60 -66 -46 -74 -32 -76 C-12 -76 14 -64 34 -56 L60 30 C40 50 0 62 -40 62 C-70 62 -90 40 -90 8 C-90 -20 -82 -40 -70 -52 Z';
  let ribs = '';
  [-72, -54, -36, -18, 0, 18].forEach(x => {
    ribs += `<path d="M${x + 8} -62 C${x - 6} -30 ${x - 8} 20 ${x + 2} 58" fill="none" stroke="#9a5228" stroke-width="3" opacity="0.42" stroke-linecap="round"/>
             <path d="M${x + 13} -60 C${x - 1} -30 ${x - 3} 20 ${x + 7} 57" fill="none" stroke="#ffe3bb" stroke-width="2" opacity="0.42" stroke-linecap="round"/>`;
  });
  let cords = '';
  [-40, -20, 2, 24, 44].forEach(y => {
    cords += `<path d="M-88 ${y} C-50 ${y - 8} 0 ${y - 6} 40 ${y + 4}" fill="none" stroke="#7a3a1a" stroke-width="1.5" opacity="0.32"/>`;
  });

  // --- aperture lip (scalloped top edge) --------------------------------------
  const sc = [[30, -58], [38, -66], [46, -72], [55, -80], [64, -86]];
  let scal = `M${sc[0][0]} ${sc[0][1]}`;
  for (let i = 0; i < sc.length - 1; i++) {
    const a = sc[i], b = sc[i + 1];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    scal += ` Q${f(mx + (dy / L) * 6)} ${f(my - (dx / L) * 6)} ${b[0]} ${b[1]}`;
  }
  const lipD = `${scal} C84 -80 104 -50 116 -18 C128 14 140 46 154 80 C136 76 112 64 88 56 C68 50 50 46 38 40 C30 10 26 -30 30 -58 Z`;
  const inD = 'M42 -50 C58 -66 80 -62 96 -36 C110 -10 122 22 134 58 C112 52 86 44 62 38 C50 10 42 -20 42 -50 Z';
  let ridges = '';
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const s = [46 + 14 * t, -44 + 78 * t], e = [94 + 38 * t, -40 + 94 * t];
    const m = [(s[0] + e[0]) / 2 + 5, (s[1] + e[1]) / 2 - 5];
    ridges += `<path d="M${f(s[0])} ${f(s[1])} Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}" fill="none"
      stroke="${i % 2 ? '#ffb48e' : '#b0361d'}" stroke-width="${i % 2 ? 1.2 : 1.7}" opacity="${i % 2 ? 0.4 : 0.5}"/>`;
  }

  return `
    ${spire}
    <path d="${bodyD}" fill="url(#cnBody-${uid})" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="-46" cy="-6" rx="14" ry="26" transform="rotate(10 -46 -6)" fill="#b8442a" opacity="0.32"/>
    <ellipse cx="-6" cy="22" rx="12" ry="20" transform="rotate(-8 -6 22)" fill="#b8442a" opacity="0.3"/>
    <ellipse cx="16" cy="-28" rx="10" ry="18" fill="#b8442a" opacity="0.28"/>
    ${ribs}${cords}
    <ellipse cx="-42" cy="-42" rx="30" ry="14" transform="rotate(-18 -42 -42)" fill="#fff2da" opacity="0.38"/>
    <ellipse cx="22" cy="44" rx="30" ry="12" fill="#5a2a14" opacity="0.22"/>
    ${knob(-58, -62, -115, 16, 9)}
    ${knob(-30, -73, -92, 25, 12.5)}
    ${knob(-2, -67, -78, 16, 9.5)}
    ${knob(20, -58, -68, 11, 7)}
    ${knob(-62, 57, 122, 15, 10)}
    ${knob(-86, 30, 168, 11, 8)}
    <path d="${lipD}" fill="url(#cnLip-${uid})" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${inD}" fill="url(#cnIn-${uid})"/>
    ${ridges}
    <path d="M34 -52 C30 -20 32 12 40 38" fill="none" stroke="#fde3c2" stroke-width="6" opacity="0.75" stroke-linecap="round"/>
    <path d="M40 -48 C36 -18 38 12 46 36" fill="none" stroke="#a8502a" stroke-width="1.6" opacity="0.5"/>
    <path d="M66 -82 C84 -76 102 -48 113 -18 C124 12 136 42 148 72" fill="none" stroke="#fff3df" stroke-width="3" opacity="0.55" stroke-linecap="round"/>
    <path d="M100 58 C120 66 138 72 152 79" fill="none" stroke="#8e3a1c" stroke-width="2" opacity="0.5"/>`;
}

// drawConch(o) → { defs, shell, pt, ground }   (ground = local y it rests on)
function drawConch(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  return { defs: conchDefs(uid), shell: reefWrap(o, conchArt(uid)),
    pt: (lx, ly) => reefPt(o, lx, ly), ground: 64 };
}

// ===========================================================================
// HERMIT CRAB — wears the SAME conch as the runaway shell (that's the twist:
// "the shell was his house all along"). Crab modelled on the reference:
// jointed, speckled orange-tan walking legs with dark tips, one big chunky
// claw (darker, plum-brown, spotted) and a small one, glossy dark eyes on
// stalks, long antennae and feathery antennules — softened to be friendly
// (catchlights, a small smile). Faces RIGHT out of the aperture in local
// space; flip:true to face left.
// Layers: shell (the conch + dark aperture), crab (legs, small claw, body,
// eyes), claw (the big waving claw, front plane).
// Local frame: ground at y = 70. Handy local points:
//   body [80,8], clawRoot [94,16], hole [62,-14], shellBase [-6,36].
// ===========================================================================
function drawHermitCrab(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  const crab = o.crab || '#e08a4e';
  const crabL = reefShade(crab, 0.3), crabD = reefShade(crab, -0.3);
  const far = reefShade(crab, -0.18);
  const spot = '#6e2e16', tipC = '#3e2016';
  const E = '#3b2214';

  function seg(a, b, w0, w1, fill) {
    return `<path d="${reefStrip([a, b], [w0, w1])}" fill="${fill}" stroke="${E}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  // jointed leg: segments + joint knuckles + speckles + dark pointed tip
  function leg(pts, ws, fill) {
    let out = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const last = i === pts.length - 2;
      out += seg(pts[i], pts[i + 1], ws[i], ws[i + 1], last ? tipC : fill);
      if (!last) {
        const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        out += `<circle cx="${reefF(m[0] - 2)}" cy="${reefF(m[1] - 1)}" r="1.8" fill="${spot}" opacity="0.7"/>
                <circle cx="${reefF(m[0] + 3)}" cy="${reefF(m[1] + 1)}" r="1.4" fill="${spot}" opacity="0.6"/>
                <path d="M${reefF(pts[i][0])} ${reefF(pts[i][1] - ws[i] * 0.2)} L${reefF(pts[i + 1][0])} ${reefF(pts[i + 1][1] - ws[i + 1] * 0.2)}"
                      stroke="${crabL}" stroke-width="1.6" opacity="0.55" stroke-linecap="round"/>`;
      }
      if (i > 0) out += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${reefF(ws[i] * 0.52)}" fill="${fill}" stroke="${E}" stroke-width="1.4"/>`;
    }
    return out;
  }

  const defs = conchDefs(uid) + `
    <linearGradient id="hcBody-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${crabL}"/><stop offset="60%" stop-color="${crab}"/>
      <stop offset="100%" stop-color="${crabD}"/>
    </linearGradient>
    <radialGradient id="hcClaw-${uid}" cx="36%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#e3a070"/><stop offset="45%" stop-color="#b0613f"/>
      <stop offset="100%" stop-color="#6a3440"/>
    </radialGradient>`;

  const shell = reefWrap(o, `
    <g transform="translate(-10 -24) rotate(-6) scale(0.78)">${conchArt(uid)}</g>
    <ellipse cx="64" cy="-12" rx="25" ry="19" transform="rotate(30 64 -12)" fill="#2a0e08" opacity="0.5"/>`);

  const crabLayer = reefWrap(o, `
    ${leg([[100, 10], [132, -8], [168, 20], [182, 66]], [10, 9, 7, 2.5], far)}
    ${leg([[92, 18], [120, 6], [150, 34], [158, 70]], [10, 9, 7, 2.5], far)}
    ${leg([[70, 24], [56, 40], [48, 70]], [11, 8, 3], far)}
    <!-- small claw -->
    ${seg([98, 18], [112, 30], 9, 8, far)}
    ${seg([112, 30], [122, 28], 8, 8, far)}
    <ellipse cx="130" cy="30" rx="10" ry="7" transform="rotate(10 130 30)" fill="${far}" stroke="${E}" stroke-width="1.6"/>
    <path d="M136 26 C142 26 146 30 147 34 C142 33 138 32 135 31 Z" fill="${tipC}"/>
    <path d="M136 34 C141 35 145 36 147 38 C142 39 138 38 135 37 Z" fill="${tipC}"/>
    <!-- cephalothorax -->
    <path d="M54 -2 C58 -16 84 -20 104 -12 C116 -6 118 12 110 22 C98 32 70 32 58 22 C50 14 50 6 54 -2 Z"
          fill="url(#hcBody-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M62 -8 C76 -16 94 -14 104 -8 C90 -10 74 -8 62 -2 Z" fill="#ffffff" opacity="0.35"/>
    <g fill="${spot}" opacity="0.5">
      <circle cx="70" cy="4" r="2.2"/><circle cx="82" cy="-4" r="2"/><circle cx="92" cy="8" r="2.4"/>
      <circle cx="76" cy="16" r="1.8"/><circle cx="100" cy="0" r="1.6"/>
    </g>
    <!-- near walking legs -->
    ${leg([[96, 22], [124, 14], [142, 44], [144, 72]], [12, 11, 8, 3], crab)}
    ${leg([[84, 26], [104, 32], [116, 58], [112, 72]], [12, 11, 8, 3], crab)}
    <!-- antennae + feathery antennules -->
    <path d="M98 -14 C118 -48 140 -66 168 -72" fill="none" stroke="${crabD}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M106 -14 C130 -40 160 -54 196 -50" fill="none" stroke="#c86a3a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M104 -6 C112 -12 120 -8 124 -14" fill="none" stroke="${crabL}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M102 -2 C110 -4 116 0 122 -4" fill="none" stroke="${crab}" stroke-width="2.2" stroke-linecap="round"/>
    <!-- eye stalks + glossy eyes -->
    <path d="${reefStrip([[90, -6], [96, -32]], [6, 4.5])}" fill="${far}" stroke="${E}" stroke-width="1.4"/>
    <path d="${reefStrip([[100, -4], [110, -30]], [7, 5])}" fill="${crab}" stroke="${E}" stroke-width="1.4"/>
    ${reefEyeRich(96, -38, 7.5, { iris: '#2a1a14', irisR: 0.84, lid: 0.12, lidColor: far, look: 0.3 })}
    ${reefEyeRich(111, -36, 8.5, { iris: '#2a1a14', irisR: 0.84, lid: 0.12, lidColor: crab, look: 0.3 })}
    <!-- mouthparts + a small friendly smile -->
    <path d="M104 6 l6 6 M108 4 l6 5" stroke="${crabD}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M100 12 q7 6 14 0" fill="none" stroke="${tipC}" stroke-width="2" stroke-linecap="round"/>`);

  const claw = reefWrap(o, `
    ${seg([94, 16], [110, 34], 14, 13, 'url(#hcClaw-' + uid + ')')}
    ${seg([110, 34], [124, 30], 14, 13, 'url(#hcClaw-' + uid + ')')}
    <ellipse cx="142" cy="32" rx="21" ry="15" transform="rotate(12 142 32)" fill="url(#hcClaw-${uid})" stroke="${E}" stroke-width="2"/>
    <path d="M154 34 C164 38 174 40 182 46 C172 48 160 46 152 42 Z" fill="${tipC}" stroke="${E}" stroke-width="1.4"/>
    <path d="M152 22 C166 22 178 30 182 40 C172 36 162 32 150 30 Z" fill="${tipC}" stroke="${E}" stroke-width="1.4"/>
    <path d="M154 24 C164 25 172 30 176 36" fill="none" stroke="#8a5a4a" stroke-width="1.4" opacity="0.7"/>
    <g fill="#4a1e22" opacity="0.6">
      <circle cx="134" cy="26" r="2.4"/><circle cx="144" cy="24" r="2"/><circle cx="150" cy="34" r="2.2"/>
      <circle cx="138" cy="38" r="2"/><circle cx="128" cy="32" r="1.8"/><circle cx="116" cy="28" r="1.8"/>
    </g>
    <g fill="#ffe4c8" opacity="0.55">
      <circle cx="132" cy="22" r="1.4"/><circle cx="140" cy="20" r="1.2"/><circle cx="146" cy="28" r="1.2"/>
    </g>
    <ellipse cx="136" cy="24" rx="8" ry="4" transform="rotate(12 136 24)" fill="#ffffff" opacity="0.28"/>`);

  return { defs, shell, crab: crabLayer, claw, pt: (lx, ly) => reefPt(o, lx, ly), ground: 70 };
}

// ===========================================================================
// SEAHORSE — matches the reference: head at the top facing RIGHT with a spiky
// mauve CORONET, a long tubular SNOUT angled down-right with a pink tip, a big
// amber eye; a row of small SPINES down the back (left edge); a golden trunk
// with a darker back stripe and pale bony RING ridges ending in little knobs
// on the belly side; a yellow, red-tipped FAN FIN on the lower back; and a
// tail that sweeps down and CURLS into a tight spiral, blushing mauve and
// studded with tubercles. Body + tail are one offset strip (skills §4), so
// nothing can detach.
// Layers: fin (behind), body. Local frame: centre ≈ (-10,0), snout tip
// (76,-44); finRoot [-53,14].
// ===========================================================================
function drawSeahorse(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  const E = '#4a2a12';
  const f = reefF;
  const pts = [[-22, -126], [-34, -96], [-30, -62], [-22, -26], [-14, 8], [-8, 34], [2, 56],
    [14, 80], [20, 106], [12, 130], [-6, 142], [-26, 136], [-36, 118], [-30, 102], [-18, 100], [-14, 110]];
  const ws = [34, 56, 74, 84, 84, 62, 40, 30, 24, 20, 17, 14, 12, 10, 8, 6];
  const { L, R, N } = reefSides(pts, ws);

  // ring ridges (incl. half-steps on the trunk) ending in a belly knob
  let rings = '';
  const ringAt = (a, b, n, w) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const tx = n[1], ty = -n[0];                   // tangent (down the body)
    rings += `<path d="M${f(a[0])} ${f(a[1])} Q${f(mx + tx * 4)} ${f(my + ty * 4)} ${f(b[0])} ${f(b[1])}"
        fill="none" stroke="#9a6424" stroke-width="${f(1 + w * 0.02)}" opacity="0.45" transform="translate(${f(tx * 2.4)} ${f(ty * 2.4)})"/>
      <path d="M${f(a[0])} ${f(a[1])} Q${f(mx + tx * 4)} ${f(my + ty * 4)} ${f(b[0])} ${f(b[1])}"
        fill="none" stroke="#fbe38a" stroke-width="${f(1.2 + w * 0.035)}" opacity="0.85" stroke-linecap="round"/>
      <circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(1.4 + w * 0.025)}" fill="#fdeaa0" stroke="${E}" stroke-width="0.8"/>`;
  };
  for (let i = 1; i < pts.length - 1; i++) {
    ringAt(L[i], R[i], N[i], ws[i]);
    if (i < 7) {
      const mid = k => [(k[i][0] + k[i + 1][0]) / 2, (k[i][1] + k[i + 1][1]) / 2];
      ringAt(mid(L), mid(R), N[i], (ws[i] + ws[i + 1]) / 2);
    }
  }

  // back spines (outward = +N on the L side) and tail tubercles
  let spines = '';
  for (let i = 0; i < 9; i++) {
    for (let h = 0; h < 2; h++) {
      if (i === 8 && h) break;
      const p = h ? [(L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2] : L[i];
      const n = N[i], tx = n[1], ty = -n[0];
      const len = 9 - i * 0.45 - h * 1.5;
      spines += `<path d="M${f(p[0] - tx * 3)} ${f(p[1] - ty * 3)} L${f(p[0] + n[0] * len)} ${f(p[1] + n[1] * len)} L${f(p[0] + tx * 3)} ${f(p[1] + ty * 3)} Z"
        fill="#e0a640" stroke="${E}" stroke-width="0.9" stroke-linejoin="round"/>
        <circle cx="${f(p[0] + n[0] * (len - 1))}" cy="${f(p[1] + n[1] * (len - 1))}" r="1.1" fill="#d58a8a"/>`;
    }
  }
  let tubercles = '';
  for (let i = 6; i < 15; i++) {
    [L[i], R[i]].forEach(p => {
      tubercles += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(1.6 + ws[i] * 0.04)}" fill="#f4cdb6" stroke="#8a4a5a" stroke-width="0.8"/>`;
    });
  }

  // dorsal fan fin
  const C = [-56, 14], C2 = [-53, 14];
  let finEdge = 'M-62 -8', rays = '', tips = '';
  for (let k = 0; k < 7; k++) {
    const a = (205 - k * (65 / 6)) * Math.PI / 180;
    const tip = [C[0] + 46 * Math.cos(a), C[1] + 46 * Math.sin(a)];
    finEdge += ` L${f(tip[0])} ${f(tip[1])}`;
    if (k < 6) {
      const an = (205 - (k + 0.5) * (65 / 6)) * Math.PI / 180;
      finEdge += ` L${f(C[0] + 38 * Math.cos(an))} ${f(C[1] + 38 * Math.sin(an))}`;
    }
    rays += `<path d="M${C2[0]} ${C2[1]} L${f(tip[0])} ${f(tip[1])}" stroke="#e08a1c" stroke-width="1.4" opacity="0.6"/>`;
    tips += `<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="1.8" fill="#c0392b"/>`;
  }
  finEdge += ' L-44 36 Z';

  const defs = `
    <linearGradient id="shBody-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c4a22"/><stop offset="30%" stop-color="#c98a2e"/>
      <stop offset="62%" stop-color="#eab83f"/><stop offset="100%" stop-color="#f6d35c"/>
    </linearGradient>
    <linearGradient id="shTail-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b0607a" stop-opacity="0"/>
      <stop offset="50%" stop-color="#b0607a" stop-opacity="0"/>
      <stop offset="72%" stop-color="#aa5c76" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#96506a" stop-opacity="0.88"/>
    </linearGradient>
    <radialGradient id="shHead-${uid}" cx="40%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#f8dc6a"/><stop offset="60%" stop-color="#dca63a"/>
      <stop offset="100%" stop-color="#a8742a"/>
    </radialGradient>
    <linearGradient id="shCrown-${uid}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#c88aa0"/><stop offset="100%" stop-color="#9a5a72"/>
    </linearGradient>
    <linearGradient id="shFin-${uid}" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffd84e"/><stop offset="100%" stop-color="#f5a623"/>
    </linearGradient>`;

  const strip = reefStrip(pts, ws);
  const fin = reefWrap(o, `
    <path d="${finEdge}" fill="url(#shFin-${uid})" opacity="0.94" stroke="#c0392b" stroke-width="1" stroke-linejoin="round"/>
    ${rays}${tips}`);

  const body = reefWrap(o, `
    ${spines}
    <path d="${strip}" fill="url(#shBody-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${reefBand(pts.slice(0, 9), ws.slice(0, 9), 0, 0.42)}" fill="#7a4620" opacity="0.45"/>
    <path d="${reefBand(pts.slice(1, 7), ws.slice(1, 7), 0.62, 0.9)}" fill="#fff2a0" opacity="0.35"/>
    <path d="${strip}" fill="url(#shTail-${uid})"/>
    ${rings}${tubercles}
    <!-- small pectoral fin behind the head -->
    <path d="M-4 -88 C6 -98 14 -92 12 -82 C6 -78 -2 -80 -4 -88 Z" fill="#ffe27a" opacity="0.8" stroke="#c98a2e" stroke-width="0.8"/>
    <!-- coronet: mound + spikes -->
    <path d="M-20 -134 C-14 -150 20 -152 30 -134 Z" fill="url(#shCrown-${uid})"/>
    ${[[-16, -136, -24, -160], [-4, -143, -6, -172], [8, -145, 12, -174], [18, -142, 28, -166], [26, -136, 40, -152]]
      .map(([bx, by, tx, ty]) => `<path d="M${bx - 4} ${by} Q${(bx + tx) / 2 - 2} ${(by + ty) / 2} ${tx} ${ty} Q${(bx + tx) / 2 + 3} ${(by + ty) / 2} ${bx + 4} ${by} Z"
        fill="url(#shCrown-${uid})" stroke="${E}" stroke-width="1.2" stroke-linejoin="round"/>`).join('')}
    <!-- head + long down-angled snout -->
    <path d="M-40 -112 C-36 -140 -4 -150 20 -138 C36 -130 46 -116 52 -104 L76 -60
             C82 -52 80 -44 72 -42 C64 -44 60 -50 58 -56 L34 -82 C22 -84 10 -78 0 -70
             C-14 -72 -30 -86 -40 -112 Z"
          fill="url(#shHead-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M46 -100 L70 -60" stroke="#fbe58e" stroke-width="2.4" opacity="0.7" stroke-linecap="round"/>
    <path d="M40 -82 L60 -58" stroke="#a8742a" stroke-width="1.6" opacity="0.5"/>
    <g fill="#fbe58e" opacity="0.75">
      <circle cx="-6" cy="-128" r="2"/><circle cx="4" cy="-134" r="1.8"/><circle cx="-14" cy="-120" r="1.8"/>
      <circle cx="0" cy="-120" r="1.6"/><circle cx="10" cy="-126" r="1.5"/>
    </g>
    <path d="M6 -98 C2 -90 -2 -84 -8 -80" fill="none" stroke="#fbe58e" stroke-width="2" opacity="0.7" stroke-linecap="round"/>
    <ellipse cx="72" cy="-48" rx="7" ry="5" transform="rotate(-29 72 -48)" fill="#d87a7e"/>
    <ellipse cx="75" cy="-45" rx="3" ry="2" transform="rotate(-29 75 -45)" fill="#7a2a32"/>
    ${reefEyeRich(24, -112, 9.5, { iris: '#b8862a', irisR: 0.66, lid: 0.18, lidColor: '#c99434', look: 0.4 })}
    <ellipse cx="34" cy="-96" rx="7" ry="4" fill="#f4a07a" opacity="0.4"/>`);

  return { defs, fin, body, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// PUFFERFISH — a white-spotted puffer, drawn naturalistically in TWO forms:
//   deflated (at rest): a blunt, tapering olive-brown fish with white spots,
//     a pale striped belly, big golden eyes, a small beak mouth, a fan tail
//     and little rounded fins set far back;
//   ball (hidden at rest): the same fish inflated into a near-sphere of
//     stretched spotted skin covered in short prickles, fins and tail poking
//     out, eyes bulging.
// The scene cross-fades the two (that IS the puffing up). Faces LEFT.
// Layers: puffer (deflated), ball (inflated, opacity 0 at rest).
// Local frame: centre (0,0); deflated x −106..128, ball radius ≈ 82.
// ===========================================================================
function drawPuffer(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  const E = '#2e2a1c';
  const body = o.body || '#857a52';
  const bL = reefShade(body, 0.3), bD = reefShade(body, -0.38);
  const f = reefF;

  const defs = `
    <radialGradient id="pfBody-${uid}" cx="40%" cy="22%" r="80%">
      <stop offset="0%" stop-color="${bL}"/><stop offset="55%" stop-color="${body}"/>
      <stop offset="100%" stop-color="${bD}"/>
    </radialGradient>
    <linearGradient id="pfBelly-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4f2e6"/><stop offset="100%" stop-color="#d9d4bd"/>
    </linearGradient>
    <linearGradient id="pfFin-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${body}" stop-opacity="0.95"/><stop offset="100%" stop-color="#c9c08f" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="pfBall-${uid}" cx="38%" cy="30%" r="74%">
      <stop offset="0%" stop-color="${bL}"/><stop offset="60%" stop-color="${body}"/>
      <stop offset="100%" stop-color="${bD}"/>
    </radialGradient>`;

  // fan with rays between root points a,b out to a rounded edge through c
  function fan(d, rays) {
    return `<path d="${d}" fill="url(#pfFin-${uid})" stroke="${E}" stroke-width="1.6" stroke-linejoin="round"/>` +
      rays.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${bD}" stroke-width="1.1" opacity="0.5"/>`).join('');
  }

  // ---- deflated ---------------------------------------------------------
  const outline = 'M-96 4 C-96 -24 -70 -46 -30 -48 C10 -50 50 -36 72 -14 L86 -8 L86 10 C60 30 20 46 -30 44 C-70 42 -96 30 -96 4 Z';
  const bellyD = 'M-94 10 C-80 18 -40 22 0 18 C30 15 56 6 80 2 L86 10 C60 30 20 46 -30 44 C-70 42 -94 30 -94 10 Z';
  const rnd = reefRand(4021);
  let spots = '';
  for (let i = 0; i < 90 && spots.length < 4200; i++) {
    const x = -84 + rnd() * 160, y = -46 + rnd() * 58;
    const ex = (x + 8) / 90, ey = (y + 2) / 44;
    if (ex * ex + ey * ey > 0.8) continue;
    if (Math.hypot(x + 56, y + 18) < 17) continue;          // keep clear of the eye
    spots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.8 + rnd() * 2.2)}" fill="#fffbea" opacity="0.88"/>`;
  }
  let stripes = '';
  [24, 30, 36].forEach((y, i) => {
    stripes += `<path d="M${-70 + i * 6} ${y - 4} C-30 ${y + 4} 20 ${y - 2} ${60 - i * 10} ${y - 16}" fill="none" stroke="#a69f80" stroke-width="1.6" opacity="0.45"/>`;
  });

  const deflated = reefWrap(o, `
    ${fan('M84 -10 C104 -32 126 -26 130 0 C126 26 104 32 84 10 Z',
      [[88, 0, 126, -14], [88, 0, 129, 0], [88, 0, 126, 14], [88, 0, 116, -24], [88, 0, 116, 24]])}
    ${fan('M44 -34 C50 -56 70 -54 72 -22 Z', [[54, -36, 58, -50], [62, -30, 66, -48]])}
    ${fan('M44 32 C50 54 70 52 72 22 Z', [[54, 34, 58, 48], [62, 28, 66, 46]])}
    <path d="${outline}" fill="url(#pfBody-${uid})" stroke="${E}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${bellyD}" fill="url(#pfBelly-${uid})"/>
    ${stripes}
    ${spots}
    <path d="M-80 -30 C-56 -46 -10 -48 30 -38 C-6 -40 -50 -38 -80 -24 Z" fill="#ffffff" opacity="0.22"/>
    <path d="${outline}" fill="none" stroke="${E}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M-26 -6 C-22 2 -22 10 -26 16" fill="none" stroke="${bD}" stroke-width="2.2" opacity="0.7" stroke-linecap="round"/>
    ${fan('M-28 2 C-12 -12 2 -4 0 10 C-8 20 -24 14 -28 8 Z', [[-26, 5, -4, -4], [-26, 5, -1, 4], [-26, 5, -6, 13]])}
    <!-- small beak mouth with a hint of tooth plates + soft smile -->
    <path d="M-92 -2 C-102 -2 -106 4 -104 10 C-102 15 -94 15 -90 12 Z" fill="#d9cfa8" stroke="${E}" stroke-width="1.6"/>
    <path d="M-104 6 L-93 6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M-104 6.8 L-93 6.8" stroke="${E}" stroke-width="0.8"/>
    <path d="M-90 13 C-86 16 -82 16 -78 13" fill="none" stroke="${bD}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="-56" cy="-18" rx="17" ry="15" fill="${bL}" opacity="0.35"/>
    ${reefEyeRich(-56, -18, 12, { iris: '#d8a326', irisR: 0.7, lid: 0.2, lidColor: body, look: -0.4 })}
    <ellipse cx="-72" cy="6" rx="9" ry="5" fill="#f2b48a" opacity="0.35"/>`);

  // ---- inflated ball ----------------------------------------------------
  const R = 70;
  let prickles = '';
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2;
    const da = 0.05;
    const b1 = [Math.cos(a - da) * (R - 2), Math.sin(a - da) * (R - 2)];
    const b2 = [Math.cos(a + da) * (R - 2), Math.sin(a + da) * (R - 2)];
    const tp = [Math.cos(a) * (R + 11), Math.sin(a) * (R + 11)];
    const belly = Math.sin(a) > 0.25;
    prickles += `<path d="M${f(b1[0])} ${f(b1[1])} L${f(tp[0])} ${f(tp[1])} L${f(b2[0])} ${f(b2[1])} Z"
      fill="${belly ? '#e2dcc6' : bD}" stroke="${E}" stroke-width="0.8" stroke-linejoin="round"/>`;
  }
  const rnd2 = reefRand(911);
  let ballSpots = '', surf = '';
  for (let i = 0; i < 70; i++) {
    const a = rnd2() * Math.PI * 2, rr = Math.sqrt(rnd2()) * (R - 8);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (y > 14) continue;
    if (Math.hypot(x + 40, y + 26) < 18) continue;
    ballSpots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.6 + rnd2() * 2.8)}" fill="#fffbea" opacity="0.85"/>`;
  }
  for (let i = 0; i < 34; i++) {
    const a = rnd2() * Math.PI * 2, rr = Math.sqrt(rnd2()) * (R - 10);
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr, ang = Math.atan2(y, x);
    surf += `<path d="M${f(x)} ${f(y)} l${f(Math.cos(ang) * 4)} ${f(Math.sin(ang) * 4)}" stroke="${y > 14 ? '#bdb69c' : bD}" stroke-width="1.3" opacity="0.6" stroke-linecap="round"/>`;
  }
  const ball = reefWrap(o, `
    ${fan('M66 -10 C84 -26 100 -20 102 0 C100 20 84 26 66 10 Z', [[70, 0, 98, -10], [70, 0, 101, 0], [70, 0, 98, 10]])}
    ${fan('M30 -62 C34 -80 50 -80 52 -56 Z', [[38, -64, 42, -76]])}
    ${fan('M30 62 C34 80 50 80 52 56 Z', [[38, 64, 42, 76]])}
    ${prickles}
    <circle cx="0" cy="0" r="${R}" fill="url(#pfBall-${uid})" stroke="${E}" stroke-width="2.4"/>
    <path d="M-68 14 C-40 26 40 26 68 14 C60 46 30 70 0 70 C-30 70 -60 46 -68 14 Z" fill="url(#pfBelly-${uid})"/>
    <path d="M-62 20 C-30 30 30 30 62 20" fill="none" stroke="#a69f80" stroke-width="1.4" opacity="0.4"/>
    <path d="M-50 36 C-20 46 20 46 50 36" fill="none" stroke="#a69f80" stroke-width="1.4" opacity="0.4"/>
    ${ballSpots}${surf}
    <ellipse cx="-24" cy="-40" rx="26" ry="13" transform="rotate(-24 -24 -40)" fill="#ffffff" opacity="0.28"/>
    ${fan('M-34 12 C-20 2 -8 8 -10 20 C-18 28 -32 22 -34 16 Z', [[-32, 15, -12, 8], [-32, 15, -13, 20]])}
    <circle cx="-40" cy="-26" r="17" fill="${bL}" opacity="0.4"/>
    ${reefEyeRich(-40, -26, 13, { iris: '#d8a326', irisR: 0.7, lid: 0.12, lidColor: body, look: -0.5 })}
    <ellipse cx="-70" cy="6" rx="7" ry="8" fill="#d9cfa8" stroke="${E}" stroke-width="1.6"/>
    <ellipse cx="-71" cy="6" rx="3.4" ry="4.4" fill="#6a3a2a"/>
    <ellipse cx="-54" cy="10" rx="9" ry="5" fill="#f2b48a" opacity="0.4"/>`);

  return { defs, puffer: deflated, ball, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// GREEN SEA TURTLE — naturalistic, seen from the side and a little above,
// swimming LEFT. Carapace with real scutes (a vertebral row along the ridge,
// costals either side) each shaded amber-to-umber with radiating streaks and
// cream seams, plus a rim of marginal scutes; a pale plastron below; a
// rounded head with a horn-coloured beak, heavy-lidded eye and cream-edged
// head scales; long wing-like front flippers (scaled, cream leading edge) and
// small rounded rear flippers.
// Layers: far (far front flipper, behind), body, flipper (near front flipper).
// Local frame: centre ≈ (-10,0); carapace top (18,-68); flipperRoot [-56,16],
// farRoot [-48,10].
// ===========================================================================
function drawTurtle(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  const E = '#2e2414';
  const seam = '#eadba6';
  const skin = '#7a6a3e', skinD = '#4f4224', skinL = '#a8975e';
  const f = reefF;

  const outline = 'M-86 -4 C-82 -44 -30 -68 18 -68 C70 -66 106 -40 110 -6 C112 18 88 40 40 44 C-10 48 -60 38 -78 20 C-86 12 -88 4 -86 -4 Z';
  const U = [[-60, -34], [-26, -48], [12, -53], [50, -47], [84, -30], [100, -14]];
  const Lw = [[-62, -16], [-28, -26], [12, -31], [50, -26], [86, -12], [100, -6]];
  const Rr = [[-72, 10], [-32, 28], [10, 35], [52, 31], [88, 14], [100, 0]];
  const T = [[-54, -48], [-20, -60], [16, -63], [54, -57], [86, -38], [100, -18]];

  function scute(poly) {
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    const d = 'M' + poly.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
    let streaks = '';
    poly.forEach((p, i) => {
      const q = poly[(i + 1) % poly.length];
      const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      [p, m].forEach(e => {
        streaks += `<path d="M${f(cx)} ${f(cy)} L${f(cx + (e[0] - cx) * 0.86)} ${f(cy + (e[1] - cy) * 0.86)}"
          stroke="#3e2a12" stroke-width="1.5" opacity="0.32" stroke-linecap="round"/>`;
      });
    });
    return `<path d="${d}" fill="url(#tuScute-${uid})"/>${streaks}
      <ellipse cx="${f(cx - 2)}" cy="${f(cy - 2)}" rx="5" ry="3.4" fill="#f2d38a" opacity="0.45"/>
      <path d="${d}" fill="none" stroke="${seam}" stroke-width="2.2" stroke-linejoin="round" opacity="0.92"/>`;
  }
  let scutes = scute([T[0], U[0], Lw[0], Rr[0], [-84, -4]]);
  for (let i = 0; i < 5; i++) {
    scutes += scute([T[i], T[i + 1], U[i + 1], U[i]]);
    scutes += scute([Lw[i], Lw[i + 1], Rr[i + 1], Rr[i]]);
    scutes += scute([U[i], U[i + 1], Lw[i + 1], Lw[i]]);
  }

  // tiles along a flipper from root a to tip b (rows of cream-edged scales)
  function flipperScales(a, b, w0, w1, n) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    let out = '';
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const cx = a[0] + (b[0] - a[0]) * t, cy = a[1] + (b[1] - a[1]) * t;
      const w = w0 + (w1 - w0) * t;
      out += `<rect x="${f(cx - w * 0.42)}" y="${f(cy - w * 0.3)}" width="${f(w * 0.84)}" height="${f(w * 0.6)}" rx="${f(w * 0.16)}"
        transform="rotate(${f(ang)} ${f(cx)} ${f(cy)})" fill="${skinD}" stroke="${seam}" stroke-width="1.2" opacity="0.9"/>`;
    }
    return out;
  }

  const defs = `
    <clipPath id="tuClip-${uid}"><path d="${outline}"/></clipPath>
    <radialGradient id="tuScute-${uid}" cx="46%" cy="44%" r="62%">
      <stop offset="0%" stop-color="#d9b45c"/><stop offset="42%" stop-color="#a8762e"/>
      <stop offset="82%" stop-color="#6a4a22"/><stop offset="100%" stop-color="#4a331a"/>
    </radialGradient>
    <linearGradient id="tuSkin-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skinL}"/><stop offset="55%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skinD}"/>
    </linearGradient>
    <linearGradient id="tuPlas-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2e4ae"/><stop offset="100%" stop-color="#c9b47a"/>
    </linearGradient>`;

  const far = reefWrap(o, `
    <path d="M-52 4 C-34 -2 -6 8 24 26 C48 40 70 50 84 58 C62 62 30 54 2 44 C-22 34 -42 24 -54 16 Z"
          fill="${skinD}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>
    ${flipperScales([-40, 14], [70, 54], 12, 6, 6)}`);

  const bodyLayer = reefWrap(o, `
    <!-- far rear flipper + tail -->
    <path d="M92 -4 C108 -6 124 -2 132 6 C120 14 104 12 90 6 Z" fill="${skinD}" stroke="${E}" stroke-width="1.8"/>
    <path d="M100 10 C110 12 116 16 118 20 C110 20 104 18 98 16 Z" fill="${skin}" stroke="${E}" stroke-width="1.4"/>
    <!-- neck -->
    <path d="M-64 -20 C-76 -22 -86 -16 -90 -8 C-92 4 -90 14 -84 20 C-76 24 -66 22 -60 16 Z"
          fill="url(#tuSkin-${uid})" stroke="${E}" stroke-width="2"/>
    <path d="M-84 -8 C-80 0 -80 8 -84 16 M-76 -12 C-72 -2 -72 8 -76 18" fill="none" stroke="${skinD}" stroke-width="1.4" opacity="0.6"/>
    <!-- plastron -->
    <path d="M-80 10 C-60 46 10 62 64 54 C86 50 100 36 104 20 L90 30 C60 46 0 48 -60 36 Z"
          fill="url(#tuPlas-${uid})" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-40 44 L-36 36 M0 52 L0 44 M40 52 L38 44" stroke="#a8945a" stroke-width="1.4" opacity="0.7"/>
    <!-- near rear flipper -->
    <path d="M70 24 C88 30 108 40 120 56 C104 62 84 52 66 36 Z" fill="url(#tuSkin-${uid})" stroke="${E}" stroke-width="2"/>
    ${flipperScales([74, 32], [112, 54], 9, 5, 3)}
    <!-- carapace: rim (marginal scutes = dashed cream seams), scutes, sheen -->
    <path d="${outline}" fill="#5a4220" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#tuClip-${uid})">
      <path d="${outline}" fill="none" stroke="${seam}" stroke-width="10" stroke-dasharray="2.2 13" opacity="0.75"/>
    </g>
    ${scutes}
    <path d="M-60 -40 C-30 -62 20 -66 60 -54 C20 -60 -24 -56 -60 -34 Z" fill="#ffffff" opacity="0.18"/>
    <path d="M-76 22 C-40 44 40 50 100 10" fill="none" stroke="#2a1c0c" stroke-width="5" opacity="0.18"/>
    <!-- head -->
    <path d="M-80 -12 C-92 -24 -116 -28 -134 -20 C-146 -14 -154 -4 -152 6 C-150 14 -144 18 -134 20
             C-118 24 -100 22 -88 18 C-82 14 -78 6 -80 -12 Z"
          fill="url(#tuSkin-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    ${[
      [[-132, -18], [-120, -24], [-110, -20], [-116, -12], [-128, -12]],
      [[-110, -20], [-98, -24], [-88, -18], [-94, -10], [-106, -12]],
      [[-142, -10], [-132, -18], [-128, -12], [-134, -4]],
      [[-116, -12], [-106, -12], [-104, -2], [-114, 0]],
      [[-94, -10], [-86, -12], [-84, 0], [-96, 2]],
      [[-114, 0], [-104, -2], [-98, 8], [-110, 10]],
      [[-98, 8], [-86, 4], [-86, 14], [-96, 16]]
    ].map(p => `<path d="M${p.map(q => q.join(' ')).join(' L')} Z" fill="${skinD}" stroke="${seam}" stroke-width="1.4" stroke-linejoin="round"/>`).join('')}
    <path d="M-146 -6 C-154 -4 -157 4 -152 10 C-148 14 -142 14 -138 10 C-140 4 -142 -2 -146 -6 Z"
          fill="#cbb68a" stroke="${E}" stroke-width="1.6"/>
    <path d="M-151 8 C-142 13 -128 15 -116 11" fill="none" stroke="${E}" stroke-width="2" stroke-linecap="round"/>
    <path d="M-150 1 l3 0" stroke="${E}" stroke-width="1.6" stroke-linecap="round"/>
    ${reefEyeRich(-126, -6, 7.5, { iris: '#4a2e14', irisR: 0.78, lid: 0.34, lidColor: skin, look: -0.4 })}
    <path d="M-133 1 C-128 4 -122 4 -118 1" fill="none" stroke="${skinD}" stroke-width="1.4"/>`);

  const flipper = reefWrap(o, `
    <path d="M-62 8 C-46 6 -20 22 10 42 C34 58 54 70 66 80 C46 82 16 74 -10 62 C-34 50 -54 38 -64 26 C-68 18 -68 12 -62 8 Z"
          fill="url(#tuSkin-${uid})" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    ${flipperScales([-52, 20], [52, 72], 15, 6, 8)}
    ${flipperScales([-44, 32], [30, 70], 9, 5, 5)}
    <path d="M-60 8 C-44 8 -18 24 12 44 C36 60 54 72 64 79" fill="none" stroke="#efe2b4" stroke-width="3" opacity="0.9" stroke-linecap="round"/>
    <path d="M-8 30 l4 -3 l1 5 z" fill="#efe2b4"/>`);

  return { defs, far, body: bodyLayer, flipper, pt: (lx, ly) => reefPt(o, lx, ly) };
}

// ===========================================================================
// MORAY EEL — matches the reference pose and markings: head on the LEFT with
// a long pointed snout, the body arching up and over to the right, hooking
// down and back, the tail sweeping round at the bottom (a big S / question
// mark). Olive-gold skin covered in dense dark-brown reticulated mottling, a
// plainer yellow-green head, a low dorsal-fin ridge running the whole back.
// Friendly on purpose: closed smiling mouth (no teeth), a big pale eye with a
// soft brow. Body + head are ONE offset strip, so the head can't detach.
// Layers: body, eye (separate so it can blink). Local frame ≈ centre (0,0);
// snout tip (-122,-40); eye [-96,-60]; tail tip (82,65).
// ===========================================================================
function drawEel(o) {
  o = o || {};
  const uid = o.uid || reefUid();
  const E = '#2a240e';
  const f = reefF;
  const pts = [[-122, -40], [-104, -50], [-84, -62], [-61, -72], [-17, -92], [27, -102], [68, -92],
    [99, -61], [99, -20], [78, 14], [37, 31], [-10, 41], [-31, 65], [-24, 92], [10, 99], [51, 85], [82, 65]];
  const ws = [10, 26, 36, 38, 38, 40, 40, 38, 36, 34, 30, 26, 22, 18, 14, 10, 5];
  const { N } = reefSides(pts, ws);
  const strip = reefStrip(pts, ws);

  // dorsal fin ridge along the back (the −normal side)
  const finPts = [], finWs = [];
  for (let i = 3; i < pts.length; i++) {
    const w = ws[i] / 2 + 2.6;
    finPts.push([pts[i][0] - N[i][0] * w, pts[i][1] - N[i][1] * w]);
    finWs.push(Math.max(1.5, 5.5 * (1 - (i - 3) / (pts.length - 3) * 0.6)));
  }

  // reticulated mottling (seeded), skipping the snout
  const rnd = reefRand(7331);
  let mottle = '';
  for (let k = 0; k < 175; k++) {
    const i = 2 + Math.floor(rnd() * (pts.length - 3));
    const t = rnd();
    const a = pts[i], b = pts[i + 1];
    const w = ws[i] + (ws[i + 1] - ws[i]) * t;
    const off = (rnd() - 0.5) * w * 0.95;
    const x = a[0] + (b[0] - a[0]) * t + N[i][0] * off;
    const y = a[1] + (b[1] - a[1]) * t + N[i][1] * off;
    const sc = i < 4 ? 0.6 : 1;
    mottle += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f((1.6 + rnd() * 2.6) * sc)}" ry="${f((1.1 + rnd() * 1.5) * sc)}" transform="rotate(${Math.round(rnd() * 180)} ${f(x)} ${f(y)})"/>`;
  }

  const defs = `
    <clipPath id="eeClip-${uid}"><path d="${strip}"/></clipPath>
    <linearGradient id="eeBody-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c9bb5e"/><stop offset="55%" stop-color="#a39443"/>
      <stop offset="100%" stop-color="#7a6d2c"/>
    </linearGradient>`;

  const body = reefWrap(o, `
    <path d="${reefStrip(finPts, finWs)}" fill="#8f8a2e" stroke="#d8d06a" stroke-width="1" stroke-linejoin="round"/>
    <path d="${strip}" fill="url(#eeBody-${uid})"/>
    <g clip-path="url(#eeClip-${uid})">
      <path d="${reefBand(pts, ws, 0, 0.32)}" fill="#e2d88a" opacity="0.35"/>
      <g fill="#3e3114" opacity="0.78">${mottle}</g>
      <path d="${reefBand(pts, ws, 0.72, 1)}" fill="#2a2410" opacity="0.22"/>
      <ellipse cx="-98" cy="-54" rx="34" ry="21" transform="rotate(-28 -98 -54)" fill="#cfc246" opacity="0.62"/>
      <path d="M-118 -44 C-104 -52 -90 -60 -74 -66 M-112 -38 C-98 -44 -84 -50 -70 -56 M-80 -48 C-74 -54 -70 -62 -68 -70"
            fill="none" stroke="#8a7a2a" stroke-width="1" opacity="0.45"/>
      <path d="${reefBand(pts, ws, 0.5, 0.78, 0.7)}" fill="#fff6c0" opacity="0.14"/>
    </g>
    <path d="${strip}" fill="none" stroke="${E}" stroke-width="2.2" stroke-linejoin="round"/>
    <!-- friendly closed mouth, paler lower jaw, nostril tube, gill hole -->
    <path d="M-118 -36 C-106 -38 -96 -42 -88 -46" fill="none" stroke="#efe6a6" stroke-width="1.8" opacity="0.7"/>
    <path d="M-121 -39 C-112 -40 -100 -44 -90 -50" fill="none" stroke="#3a3010" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-90 -50 q4 -3 7 -1" fill="none" stroke="#3a3010" stroke-width="2" stroke-linecap="round"/>
    <path d="M-115 -47 l-3 -5" stroke="#6a5e22" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="-56" cy="-58" rx="3" ry="2" fill="#2a240e" opacity="0.6"/>
    <ellipse cx="-88" cy="-44" rx="7" ry="4" fill="#e8b04a" opacity="0.3"/>`);

  const eye = reefWrap(o, `
    ${reefEyeRich(-96, -60, 7, { iris: '#c9d2d2', irisR: 0.74, lid: 0.16, lidColor: '#b8ad40', look: -0.3 })}
    <path d="M-104 -70 q8 -5 16 0" fill="none" stroke="#6a5e22" stroke-width="2.4" stroke-linecap="round"/>`);

  return { defs, body, eye, pt: (lx, ly) => reefPt(o, lx, ly) };
}

if (typeof module !== 'undefined') {
  module.exports = {
    drawClownfish, drawOctopus, drawJellyfish, drawConch, drawHermitCrab,
    drawSeahorse, drawPuffer, drawTurtle, drawEel,
    reefShade, reefEye, reefEyeRich, reefPt, reefFaceToward
  };
}
