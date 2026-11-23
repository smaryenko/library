// THE ANT AND THE CRUMB: the one cutaway anthill world and what happens on each page.
//
// One tall rounded mound of clay, cut away at the front, standing on a strip
// of ground with a picnic blanket at the far left. Every page is a camera
// stop somewhere in this one world (STOPS); the renderer (clay.js) flies the
// camera between stops when the page turns. the ant walks one path from the
// blanket to the deepest store, carrying her crumb.
//
// This file is plain data + plain JS (no WebGL): the layout (rooms, tunnels,
// props), the page scripts (who walks where, when), and the GLSL for the
// static world, generated from the same numbers so the ants' paths and the
// carved tunnels always agree.
//
// Coordinates: x right, y up, z towards the camera. The front face of the
// slice is z = SLAB.z1; tunnels and rooms are carved into it. The ant is
// about 0.36 long (scale 1).
(function () {
'use strict';

// ---- tune by eye -------------------------------------------------------------
const GROUND = 1.2;                                   // flat ground either side of the mound
const HILL = { top: 3.3, slope: 1.0, soft: 0.04, wob: 0.015 }; // mound height = top - slope*sqrt(x^2+soft)
const FOOT_K = 0.15;                                  // how softly the mound meets the ground
const SLAB = { x0: -5.2, x1: 2.6, y0: 0.0, z0: -0.4, z1: 0.25, round: 0.08 };
const CRUST = 0.085;                                  // pine-needle crust thickness
const TZ = SLAB.z1;                                   // tunnels are carved around this plane
const TR = 0.17;                                      // main tunnel radius
const ANT_Z = 0.16;                                   // depth the ants walk at
const ANT_H = 0.066;                                  // ant centre above the floor (scale 1)
const ROOM_RZ = 0.3, QUEEN_RZ = 0.36, STORE_RZ = 0.32;
const SPEED = 0.38;                                   // walk speed, units per second
const STRIDE = 0.075;                                 // one leg cycle per this much travel (unit ant)
const TURN_D = 0.05;                                  // facing / pitch blend distance at path corners
// keeping the ant level: she never stands on her head, even in a steep tunnel
const PITCH_MAX = 0.52;                               // body pitch clamp while walking (~30 deg)
const REST_SLACK = 0.44;                              // at rest, floors up to this slope (~25 deg) give a level body
const PITCH_EASE = 0.35;                              // seconds to ease from walking pitch to rest pitch
const FACE_MIN = 0.72;                                // facing mirror never gets thinner than this (no end-on squash)
const RES_MAX = 0.47;                                 // tan of the floor slope the legs can still reach (~25 deg)
const BODY_BACK = 0.2, BODY_FRONT = 0.14;             // body underside reach behind / ahead of centre (unit ant)
const CRUMB_R = 0.075, CRUMB_R_SHARED = 0.068, PIECE_R = 0.026;
const CRUMB_LOCAL = [0.205, 0.035];                   // crumb held up in the mandibles (unit ant)
const ITEM_LOCAL = [0.19, 0.0];                       // eggs, husks, pellets in the mandibles
const BLANKET = { x0: -5.25, x1: -4.03, z0: -0.37, z1: 0.23, h: 0.04 };
const TRAIL = { x0: -3.7, x1: -0.62, cell: 0.11 };    // scent dots along the surface
const BEETLE_H = 0.057;
const WORM_R = 0.075, WORM_Z = 0.2, WORM_TIME = 2.2;
const DROP_TIME = 0.8;
const FLY_TIME = 1.6;                                 // camera flight between page stops, seconds
const MAXA = 4;                                       // detailed ants evaluated per picture
const NC = 18;                                        // capsules per ant (6 legs x 2, antennae x 2, mandibles)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pulse = (t, a, b) => sstep(a, a + 0.2, t) * (1 - sstep(b - 0.2, b, t));
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };

// ---- the ground line (same formula as surfY in the shader) ----------------------
function surfY(x) {
  const hill = HILL.top - HILL.slope * Math.sqrt(x * x + HILL.soft) + HILL.wob * Math.sin(x * 9);
  const gr = GROUND + 0.01 * Math.sin(x * 7 + 1);
  return -smin(-hill, -gr, FOOT_K);
}

// ---- rooms (centre x, y; radii; all carved around z = TZ) ---------------------------
const room = (x, y, rx, ry, rz) => ({ x, y, rx, ry, rz: rz || ROOM_RZ });
const ROOMS = {
  nursery: room(-0.48, 1.62, 0.6, 0.19),
  pupae: room(-1.0, 0.98, 0.5, 0.2),
  rubbish: room(0.36, 1.93, 0.3, 0.13),
  niche: room(0.42, 2.17, 0.14, 0.08),
  queen: room(0.78, 0.5, 0.75, 0.25, QUEEN_RZ),
  store: room(-1.25, 0.36, 0.5, 0.2, STORE_RZ),
  // empty side rooms, so the whole colony reads as many chambers
  side1: room(1.45, 0.95, 0.22, 0.1),
  side2: room(-1.75, 0.75, 0.2, 0.1),
  side3: room(1.9, 0.75, 0.2, 0.1),
  side4: room(-1.5, 1.42, 0.18, 0.09)
};
// floor of a room under (x, z)
function floorAt(r, x, z) {
  const dx = (x - r.x) / r.rx, dz = ((z === undefined ? ANT_Z : z) - TZ) / r.rz;
  return r.y - r.ry * Math.sqrt(Math.max(0, 1 - dx * dx - dz * dz));
}

// ---- tunnel centre points ---------------------------------------------------------
const P = {
  // shaft, f and sh1 were nearly vertical; moved sideways so no stretch is steeper than ~55 deg
  door: [-0.36, 3.02], shaft: [-0.1, 2.72], c: [0.2, 2.47], d: [0.6, 2.32], e: [0.86, 2.0], f: [0.98, 1.82],
  dig0: [0.74, 1.6], h: [0.18, 1.58], nurseIn: [0.0, 1.56], digEnd: [1.1, 1.36],
  down0: [0.05, 1.575], down1: [0.14, 1.32],
  sh0: [-0.22, 1.52], sh1: [-0.72, 1.06],
  w0: [-0.52, 0.88], w1: [0.05, 0.64],
  st0: [0.1, 0.42], st1: [-0.45, 0.33], st2: [-0.8, 0.3]
};
const WORM = { a: [0.0, 1.05], b: [-0.27, 0.54] };
const TUNNELS = [            // [from, to, radius]
  [P.door, P.shaft, TR], [P.shaft, P.c, TR], [P.c, P.d, TR], [P.d, P.e, TR], [P.e, P.f, TR], [P.f, P.dig0, TR],
  [P.dig0, P.h, TR], [P.h, P.nurseIn, TR],
  [[0.86, 1.96], [0.62, 1.9], 0.13],                     // into the rubbish room
  [P.dig0, P.digEnd, 0.15], [P.digEnd, [1.4, 1.0], 0.1], [[1.6, 0.92], [1.82, 0.78], 0.09],
  [P.down0, P.down1, 0.13],                              // the diggers' shaft
  [P.sh0, P.sh1, 0.15],                                  // nursery down to the pupae
  [P.w0, P.w1, TR],                                      // past the worm, to the queen
  [P.st0, P.st1, TR], [P.st1, P.st2, TR],                // down to the store
  [[-1.6, 0.45], [-1.72, 0.68], 0.08], [[-1.05, 1.6], [-1.38, 1.46], 0.08],
  [WORM.a, WORM.b, WORM_R]                               // the worm's own tunnel
];

// ---- path helpers: where an ant's centre is --------------------------------------
const off = r => Math.sqrt(r * r - (TZ - ANT_Z) * (TZ - ANT_Z)) - ANT_H;  // tunnel centre -> ant centre
const onLine = (a, b, x) => [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])];
const S = x => [x, surfY(x) + ANT_H];                                      // on the surface
function Sr(x0, x1) {                                                      // along the surface, finely
  const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 0.07)), out = [];
  for (let i = 0; i <= n; i++) out.push(S(lerp(x0, x1, i / n)));
  return out;
}
const T = (pt, r) => [pt[0], pt[1] - off(r || TR)];                       // in a tunnel
const TL = (a, b, x, r) => T(onLine(a, b, x), r);
const R = (rm, x, z, scale) => [x, floorAt(rm, x, z) + ANT_H * (scale || 1)]; // on a room floor
const W = s => ({ wait: s });

function cross2(a1, a2, b1, b2) {
  const d = (a2[0] - a1[0]) * (b2[1] - b1[1]) - (a2[1] - a1[1]) * (b2[0] - b1[0]);
  const u = ((b1[0] - a1[0]) * (b2[1] - b1[1]) - (b1[1] - a1[1]) * (b2[0] - b1[0])) / d;
  return [lerp(a1[0], a2[0], u), lerp(a1[1], a2[1], u)];
}

// ---- named spots --------------------------------------------------------------------
const BUMP_C = [0.5, onLine(P.dig0, P.h, 0.5)[1] - Math.sqrt(TR * TR - (TZ - ANT_Z) * (TZ - ANT_Z)), ANT_Z];
const BUMP_R = [0.11, 0.065, 0.2];
const BUMP_TOP = BUMP_C[1] + BUMP_R[1];
const BEETLE_A = (() => { const c = onLine(P.c, P.d, 0.42); return [0.42, c[1] - (off(TR) + ANT_H) + BEETLE_H, ANT_Z]; })();
const BEETLE_B = [0.42, floorAt(ROOMS.niche, 0.42) + BEETLE_H, ANT_Z];
const LARVA = [-0.544, floorAt(ROOMS.nursery, -0.544) + 0.032, ANT_Z];
const EGG_SET = [-0.66, floorAt(ROOMS.nursery, -0.66, 0.08) + 0.024, 0.08];
const COCOON = [-1.2, floorAt(ROOMS.pupae, -1.2) + 0.034, ANT_Z];
const HUSK_DROP = [0.21, floorAt(ROOMS.rubbish, 0.21) + 0.05, ANT_Z];
const QUEEN_EGG = [1.27, floorAt(ROOMS.queen, 1.27, 0.14) + 0.026, 0.14];
const STORE_TOP = [-1.22, floorAt(ROOMS.store, -1.22) + 0.06 + CRUMB_R_SHARED * 0.6, ANT_Z];
const STRAWBERRY = [-4.32, GROUND + BLANKET.h + 0.088, -0.02];
const CROSS = cross2(P.w0, P.w1, WORM.a, WORM.b);           // where the worm crosses the ant's tunnel
const PELLETS = [[-0.05, 0.028, 0.03], [0.02, 0.022, -0.02], [0.07, 0.025, 0.0]].map(([dx, r, dz]) => {
  const c = onLine(P.w0, P.w1, CROSS[0] + dx)[1];
  const fl = c - Math.sqrt(TR * TR - (TZ - ANT_Z) * (TZ - ANT_Z));
  return { x: CROSS[0] + dx, top: c + 0.12, floor: fl + r * 0.8, z: ANT_Z + dz, r };
});
const WORM_LEN = Math.hypot(WORM.b[0] - WORM.a[0], WORM.b[1] - WORM.a[1]);

// ---- camera stops, one per page ------------------------------------------------------
const stop = (pos, tgt, fov, dusk) => ({ pos, tgt, fov: fov || 34, dusk: dusk || 0 });
const STOPS = [
  stop([-3.45, 1.8, 2.05], [-3.62, 1.36, 0.1]),        // 1 the crumb by the blanket
  stop([-2.65, 1.85, 2.2], [-2.8, 1.38, 0.1]),         // 2 the scent trail
  stop([-0.5, 3.3, 2.35], [-0.62, 2.82, 0.05]),        // 3 the door and the guards
  stop([0.18, 2.6, 2.15], [0.12, 2.4, 0.15]),          // 4 the first tunnel, the beetle
  stop([0.66, 2.18, 2.15], [0.6, 2.0, 0.15]),          // 5 the rubbish room
  stop([0.58, 1.72, 2.2], [0.55, 1.55, 0.15]),         // 6 the diggers
  stop([-0.38, 1.78, 2.05], [-0.42, 1.6, 0.15]),       // 7 the nursery
  stop([-0.86, 1.18, 2.05], [-0.9, 1.0, 0.15]),        // 8 the pupae room
  stop([-0.2, 0.95, 2.1], [-0.25, 0.78, 0.15]),        // 9 the worm
  stop([0.64, 0.72, 2.45], [0.66, 0.52, 0.1]),         // 10 the queen
  stop([-1.0, 0.62, 2.15], [-1.05, 0.42, 0.15]),       // 11 the store
  stop([-1.05, 2.5, 11.8], [-1.3, 1.55, 0.0], 38, 0.85) // 12 the whole colony at dusk
];

// ---- walkers: an ant following a list of points, with pauses ------------------------
// pts: [x, y] points and { wait: s } pauses (a pause holds at the point before it).
// Everything is a pure function of time, so a tap can snap straight to the end.
function walker(o) {
  const pts = [], waits = [];
  let delay = o.delay || 0, tail = 0;
  for (const e of o.pts) {
    if (Array.isArray(e)) pts.push(e);
    else if (!pts.length) delay += e.wait;
    else waits[pts.length - 1] = (waits[pts.length - 1] || 0) + e.wait;
  }
  if (waits[pts.length - 1]) { tail = waits[pts.length - 1]; waits[pts.length - 1] = 0; }
  const speed = o.speed || SPEED, segs = [], pauses = [];
  let s = 0, t = delay, f = 0, block = null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    if (l < 1e-6) continue;
    if (Math.abs(dx) > 0.25 * l) f = Math.sign(dx);
    const w = waits[i - 1] || 0;
    if (w > 0) pauses.push([t, t + w]);
    t += w;
    if (!block || w > 0) block = { b0: t, b1: t };
    const g = { a, b, s, l, f, pitch: Math.atan2(dy, Math.abs(dx)), t0: t, t1: t + l / speed, block };
    block.b1 = g.t1;
    segs.push(g);
    t = g.t1; s += l;
  }
  // vertical stretches keep the facing of their neighbours
  let first = segs.find(g => g.f) ? segs.find(g => g.f).f : (o.face0 || 1);
  if (o.face0 && segs.length && !segs[0].f) first = o.face0;
  let cur = first;
  for (const g of segs) { if (g.f) cur = g.f; else g.f = cur; }
  return { o, pts, segs, len: s, speed, pauses, dur: t + tail, end: t,
    face0: segs.length ? segs[0].f : (o.face0 || 1) };
}
function blendAt(w, d, key) {
  const segs = w.segs;
  let i = segs.findIndex(g => d <= g.s + g.l);
  if (i < 0) i = segs.length - 1;
  const g = segs[i], u = d - g.s;
  if (i > 0) {
    const dl = Math.min(TURN_D, g.l / 2, segs[i - 1].l / 2);
    if (u < dl) return lerp(segs[i - 1][key], g[key], 0.5 + 0.5 * u / dl);
  }
  if (i < segs.length - 1) {
    const dl = Math.min(TURN_D, g.l / 2, segs[i + 1].l / 2);
    if (g.l - u < dl) return lerp(g[key], segs[i + 1][key], 0.5 - 0.5 * (g.l - u) / dl);
  }
  return g[key];
}
function at(w, t) {
  const o = w.o, scale = o.scale || 1;
  if (!w.segs.length) {
    const p = w.pts[0];
    return { x: p[0], y: p[1], pitch: o.pitch0 || 0, face: o.face0 || 1, phase: 0, amp: 0, d: 0 };
  }
  let d = w.len, amp = 0, mv = 0;
  for (const g of w.segs) {
    if (t < g.t0) { d = g.s; break; }
    if (t < g.t1) {
      d = g.s + (t - g.t0) * w.speed;
      const into = Math.min(t - g.block.b0, g.block.b1 - t);
      amp = clamp(into / 0.15, 0, 1);
      mv = sstep(0, 1, into / PITCH_EASE);
      break;
    }
  }
  let i = w.segs.findIndex(g => d <= g.s + g.l);
  if (i < 0) i = w.segs.length - 1;
  const g = w.segs[i], u = g.l ? clamp((d - g.s) / g.l, 0, 1) : 0;
  // floor slope under her; the body only follows part of it
  const raw = blendAt(w, d, 'pitch');
  const walkP = clamp(raw, -PITCH_MAX, PITCH_MAX);
  const restP = clamp(Math.sign(raw) * Math.max(0, Math.abs(raw) - REST_SLACK), -PITCH_MAX, PITCH_MAX);
  const pitch = lerp(restP, walkP, mv);
  // what is left of the slope: lift the body clear of the floor, the legs reach down to it
  const res = clamp(Math.tan(raw - pitch), -RES_MAX, RES_MAX);
  const lift = Math.max(0, -BODY_BACK * res, BODY_FRONT * res);
  // facing: flip quickly at a turn instead of thinning the ant to a sliver
  const fb = blendAt(w, d, 'f');
  const face = (fb >= 0 ? 1 : -1) * Math.max(Math.abs(fb), FACE_MIN);
  return {
    x: lerp(g.a[0], g.b[0], u), y: lerp(g.a[1], g.b[1], u) + lift * scale,
    pitch, face, res, lift,
    phase: d / (STRIDE * scale) * Math.PI * 2, amp, d
  };
}
// the ant's full state for the renderer
function ant(w, t, extra) {
  const o = w.o;
  return Object.assign({ z: o.z !== undefined ? o.z : ANT_Z, scale: o.scale || 1, pale: o.pale || 0, gs: o.gs || 1,
    wave: 0, sniff: 0, seed: o.seed || 0 }, at(w, t), extra || {});
}
const fxOf = f => (f >= 0 ? Math.max(f, 0.12) : Math.min(f, -0.12));
// a point held in an ant's mandibles (local, unit ant) in world space
function held(a, local) {
  const c = Math.cos(a.pitch), s = Math.sin(a.pitch);
  const lx = local[0] * a.scale, ly = local[1] * a.scale;
  return [a.x + fxOf(a.face) * (c * lx - s * ly), a.y + s * lx + c * ly, a.z];
}
const carry = (a, r) => held(a, CRUMB_LOCAL).concat([r]);
const item = (p, r, m) => ({ p, r, m });

// ---- the twelve pages --------------------------------------------------------------
// each: dur (seconds), frame(t, out, clock) fills ants / crumb / items for that page;
// world(t, out) (optional) sets things that stay changed on later pages.
const PAGES = [];

// 1  the crumb by the picnic blanket: the ant walks up to it and lifts it
(() => {
  const mila = walker({ pts: [S(-3.35), S(-3.58), W(0.9), S(-3.62)].concat(Sr(-3.6, -3.3)), face0: -1 });
  const tA = mila.pauses[0][0], tB = mila.pauses[0][1];
  const m0 = ant(mila, tA), g = held(m0, CRUMB_LOCAL);
  const ground = [g[0], surfY(g[0]) + CRUMB_R * 0.75, ANT_Z];
  PAGES.push({ dur: mila.dur, frame(t, out) {
    const m = ant(mila, t, { sniff: 0.6 * (1 - sstep(tA, tB, t)), wave: pulse(t, tB, tB + 1.0) });
    out.ants.push(m);
    const c = carry(m, CRUMB_R);
    out.crumb = t <= tA ? ground.concat([CRUMB_R]) : lerp3(ground, c, ease((t - tA) / (tB - tA))).concat([CRUMB_R]);
    if (t >= tB) out.crumb = c;
  } });
})();

// 2  the scent trail: nose down, she follows the dots home
(() => {
  const mila = walker({ pts: Sr(-3.25, -2.3) });
  PAGES.push({ dur: mila.dur, frame(t, out) {
    const m = ant(mila, t, { sniff: t > 0 ? 1 : 0.5 });
    out.ants.push(m);
    out.crumb = carry(m, CRUMB_R);
    out.trail = [m.x + 0.3, t > 0 ? 1 : 0.35];
  } });
})();

// 3  the door: two guards tap her with their antennae, then she goes in
(() => {
  const mila = walker({ pts: Sr(-1.05, -0.95).concat([W(1.6)], Sr(-0.9, -0.52), [T(P.door), T(P.shaft)]) });
  const g1 = walker({ pts: [S(-0.58)], z: -0.04, face0: -1, seed: 1.3 });
  const g2 = walker({ pts: [S(-0.2)], z: -0.08, face0: -1, seed: 2.1 });
  const [p0, p1] = mila.pauses[0];
  PAGES.push({ dur: mila.dur, frame(t, out) {
    const tap = pulse(t, p0 - 0.1, p1);
    const m = ant(mila, t, { wave: tap * 0.6 });
    out.ants.push(m, ant(g1, t, { wave: tap }), ant(g2, t, { wave: tap * 0.8 }));
    out.crumb = carry(m, CRUMB_R);
  } });
})();

// 4  the first tunnel between the roots: a beetle shuffles aside into a niche
(() => {
  const mila = walker({ pts: [T(P.shaft), TL(P.shaft, P.c, -0.02), W(1.3), T(P.c), T(P.d)] });
  const pa = mila.pauses[0][0];
  const k = t => ease(clamp((t - pa - 0.1) / 1.0, 0, 1));
  PAGES.push({ dur: mila.dur,
    world(t, out) {
      const u = k(t);
      const b = lerp3(BEETLE_A, BEETLE_B, u);
      b[1] += Math.sin(t * 40) * 0.003 * (u > 0 && u < 1 ? 1 : 0);
      out.beetle = b;
    },
    frame(t, out) {
      const m = ant(mila, t, { wave: pulse(t, pa, pa + 1.3) });
      out.ants.push(m);
      out.crumb = carry(m, CRUMB_R);
    } });
})();

// 5  the rubbish room: a tidy ant drops an old seed husk on the pile
(() => {
  const mila = walker({ pts: [T(P.d), T(P.e), T(P.f)] });
  const tidy = walker({ pts: [R(ROOMS.rubbish, 0.6), R(ROOMS.rubbish, 0.42)], face0: -1, delay: 0.2, seed: 0.7 });
  const t0 = tidy.dur + 0.15;
  PAGES.push({ dur: Math.max(mila.dur, t0 + 1.2), frame(t, out) {
    const m = ant(mila, t), a = ant(tidy, t, { wave: pulse(t, t0 + 0.4, t0 + 1.4) });
    out.ants.push(m, a);
    out.crumb = carry(m, CRUMB_R);
    const h = held(a, ITEM_LOCAL);
    out.items.push(item(t < t0 ? h : lerp3(h, HUSK_DROP, ease((t - t0) / 0.5)), 0.036, 11));
  } });
})();

// 6  the diggers: one scoops a soil pellet, one comes up and helps over the bump
(() => {
  const mila = walker({ pts: [T(P.f), T(P.dig0), TL(P.dig0, P.h, 0.6), [0.5, BUMP_TOP + ANT_H], TL(P.dig0, P.h, 0.4)] });
  const d1end = [0.12, onLine(P.h, P.nurseIn, 0.12)[1] - off(TR)];
  const d1 = walker({ pts: [[0.13, 1.36], [0.07, 1.5], d1end], face0: 1, delay: 0.3, seed: 2.4 });
  const d2 = walker({ pts: [TL(P.dig0, P.digEnd, 0.98, 0.15), W(2.4), TL(P.dig0, P.digEnd, 0.82, 0.15)], face0: -1, seed: 0.4 });
  PAGES.push({ dur: Math.max(mila.dur, d2.dur) + 0.3, frame(t, out) {
    const m = ant(mila, t);
    const help = sstep(0.62, 0.55, m.x) * sstep(0.36, 0.44, m.x);
    out.ants.push(m,
      ant(d1, t, { wave: t > d1.dur ? 0.7 : 0 }),
      ant(d2, t, { pitch: ant(d2, t).pitch + (t < 2.3 ? Math.sin(t * 10) * 0.15 * sstep(0.2, 0.5, t) : 0) }));
    const c = carry(m, CRUMB_R);
    c[1] += 0.03 * help;
    out.crumb = c;
    const a2 = out.ants[2];
    out.items.push(item(held(a2, ITEM_LOCAL), 0.03 * sstep(0.3, 1.4, t), 12));
  } });
})();

// 7  the nursery: a nurse sets an egg down; a larva gets a tiny piece of crumb
(() => {
  const mila = walker({ pts: [TL(P.h, P.nurseIn, 0.1), R(ROOMS.nursery, -0.05), R(ROOMS.nursery, -0.18)] });
  const nurse = walker({ pts: [R(ROOMS.nursery, -0.82)], face0: 1, seed: 1.9 });
  const tA = mila.dur;
  const mouth = [LARVA[0] + 0.07, LARVA[1] + 0.01, LARVA[2]];
  PAGES.push({ dur: tA + 3.2, frame(t, out, clock) {
    const m = ant(mila, t, { wave: pulse(t, tA + 0.8, tA + 2.6) * 0.5 });
    const n = ant(nurse, t, { wave: pulse(t, 1.2, 3.0) });
    out.ants.push(m, n);
    const r = lerp(CRUMB_R, CRUMB_R_SHARED, sstep(tA, tA + 0.3, t));
    out.crumb = carry(m, r);
    out.items.push(item(lerp3(held(n, ITEM_LOCAL), EGG_SET, ease((t - 0.4) / 0.8)), 0.028, 5));
    if (t > tA) {
      const front = held(m, [CRUMB_LOCAL[0] - 0.04, CRUMB_LOCAL[1] - 0.02]);
      const pr = PIECE_R * (1 - sstep(tA + 1.2, tA + 2.8, t));
      out.items.push(item(lerp3(front, mouth, ease((t - tA) / 0.6)), pr, 9));
    }
    out.larva = Math.sin(clock * 9) * sstep(tA, tA + 0.3, t) * (1 - sstep(tA + 2.6, tA + 3.2, t)) +
      Math.sin(clock * 2.1) * 0.15;
  } });
})();

// 8  the pupae room: a cocoon opens and a pale new ant wiggles out
(() => {
  const mila = walker({ pts: [TL(P.sh0, P.sh1, -0.47, 0.15), R(ROOMS.pupae, -0.62), R(ROOMS.pupae, -0.66)] });
  const young = walker({ pts: [R(ROOMS.pupae, -1.2), W(1.9), R(ROOMS.pupae, -1.12)], face0: 1, pale: 1, seed: 3.3 });
  PAGES.push({ dur: Math.max(mila.dur, young.dur) + 0.4,
    world(t, out) { out.cocoon = sstep(0.4, 1.5, t); },
    frame(t, out) {
      const m = ant(mila, t, { wave: pulse(t, 1.6, 3.4) });
      out.ants.push(m);
      out.crumb = carry(m, CRUMB_R_SHARED);
      if (t > 0.5) {
        const sc = lerp(0.55, 0.9, sstep(0.5, 1.8, t));
        const y = ant(young, t, { scale: sc, pale: 1 - 0.3 * sstep(1.8, 3.6, t), wave: pulse(t, 1.6, 3.4) });
        y.y -= ANT_H * (1 - sc);
        const wig = pulse(t, 0.5, 1.9);
        y.phase += t * 9 * wig; y.amp = Math.max(y.amp, 0.7 * wig);
        out.ants.push(y);
      }
    } });
})();

// 9  the worm: it wriggles across, a little soil trickles down, the ant waits
(() => {
  const mila = walker({ pts: [TL(P.w0, P.w1, -0.5), W(2.7), T(P.w1)] });
  PAGES.push({ dur: mila.dur, frame(t, out) {
    const m = ant(mila, t, { wave: pulse(t, 0.3, 2.7) });
    out.ants.push(m);
    out.crumb = carry(m, CRUMB_R_SHARED);
    if (t > 0.2 && t < 0.2 + WORM_TIME + 0.4) out.worm = (t - 0.2) / WORM_TIME * (WORM_LEN + 0.45);
    out.shake = 0.012 * pulse(t, 0.5, 1.9);
    if (t > 0.7) {
      const cx = out.crumb[0];
      out.fall = [sstep(0.7, 1.5, t)].concat(PELLETS.map(q => 1 - sstep(q.x - 0.32, q.x - 0.2, cx)));
    }
  } });
})();

// 10  the queen's chamber: she lays an egg, a helper picks it up
(() => {
  const mila = walker({ pts: [TL(P.w0, P.w1, -0.05), T(P.w1), R(ROOMS.queen, 0.1)] });
  const queen = walker({ pts: [R(ROOMS.queen, 0.95, 0.0, 1.35)], face0: -1, z: 0.0, scale: 1.35, gs: 1.5, seed: 0.9 });
  const h2 = walker({ pts: [R(ROOMS.queen, 0.6, 0.2)], face0: 1, z: 0.2, seed: 2.7 });
  const h1 = walker({ pts: [R(ROOMS.queen, 1.06, 0.2)], face0: 1, z: 0.2, seed: 1.5 });
  PAGES.push({ dur: Math.max(mila.dur, 3.0), frame(t, out) {
    const m = ant(mila, t);
    const lay = pulse(t, 0.5, 1.5);
    const q = ant(queen, t, { gs: 1.5 + 0.05 * Math.sin(t * 8) * lay, wave: 0.3 * lay });
    const a2 = ant(h2, t, { wave: t > 0 ? 0.8 : 0 });
    const a1 = ant(h1, t, { pitch: -0.12 * pulse(t, 1.5, 2.3) });
    out.ants.push(m, q, a2, a1);
    out.crumb = carry(m, CRUMB_R_SHARED);
    if (t > 0.9) {
      const up = held(a1, ITEM_LOCAL);
      up[1] += 0.01;
      out.items.push(item(lerp3(QUEEN_EGG, up, ease((t - 1.7) / 0.5)), 0.028 * sstep(0.9, 1.4, t), 5));
    }
  } });
})();

// 11  the store: the ant adds her crumb to the seeds and crumbs
(() => {
  const mila = walker({ pts: [R(ROOMS.queen, 0.1), T(P.st0), T(P.st1), T(P.st2), R(ROOMS.store, -1.0)], face0: -1 });
  const keeper = walker({ pts: [R(ROOMS.store, -1.55)], face0: 1, seed: 0.2 });
  const tA = mila.end;
  PAGES.push({ dur: tA + DROP_TIME + 0.8, frame(t, out) {
    const m = ant(mila, t, { wave: pulse(t, tA + DROP_TIME, tA + DROP_TIME + 0.8) });
    out.ants.push(m, ant(keeper, t, { wave: pulse(t, tA, tA + 1.6) * 0.7 }));
    const c = carry(m, CRUMB_R_SHARED);
    out.crumb = t <= tA ? c : lerp3(c, STORE_TOP, ease((t - tA) / DROP_TIME)).concat([CRUMB_R_SHARED]);
  } });
})();

// 12  the whole colony at dusk; up top another ant finds a strawberry
(() => {
  const mila = walker({ pts: [R(ROOMS.store, -1.0)], face0: -1 });
  const queen = walker({ pts: [R(ROOMS.queen, 0.95, 0.0, 1.35)], face0: -1, z: 0.0, scale: 1.35, gs: 1.5, seed: 0.9 });
  const guard = walker({ pts: [S(-0.58)], z: -0.04, face0: -1, seed: 1.3 });
  const finder = walker({ pts: [S(-3.55), S(-4.0), [-4.06, GROUND + BLANKET.h + ANT_H]], face0: -1, seed: 2.2 });
  PAGES.push({ dur: finder.dur + 1.4, frame(t, out) {
    out.ants.push(ant(mila, t), ant(queen, t), ant(guard, t),
      ant(finder, t, { wave: t > finder.end ? 1 : 0, sniff: t > 0 && t < finder.end ? 0.5 : 0 }));
    out.crumb = STORE_TOP.concat([CRUMB_R_SHARED]);
  } });
})();

// one picture: persistent world first (earlier pages done, later ones untouched)
function frame(p, t, clock) {
  const out = { ants: [], crumb: [0, 0, 0, 0], items: [], beetle: BEETLE_A, cocoon: 0, worm: -1,
    fall: [0, 0, 0, 0], larva: Math.sin(clock * 2.1) * 0.15, trail: [TRAIL.x0, 0.2], shake: 0 };
  PAGES.forEach((pg, k) => { if (pg.world) pg.world(k < p ? pg.dur : k === p ? t : 0, out); });
  PAGES[p].frame(t, out, clock);
  out.ants.length = Math.min(out.ants.length, MAXA);
  return out;
}

// ---- static props (each group behind its own bounding sphere) -------------------------
const f = v => (+v).toFixed(4);
const v3 = a => `vec3(${f(a[0])}, ${f(a[1])}, ${f(a[2])})`;
const E = (c, s, m) => ({ e: c, s, m });
const CAP = (a, b, r, m) => ({ cap: [a, b, r], m });
const onFloor = (rm, x, z, h) => [x, floorAt(rm, x, z) + h, z];
const GROUPS = [];
// grass tufts at the foot of the mound and along the ground
[[-3.15, -0.22], [-2.7, -0.28], [-2.05, 0.12], [-1.95, -0.2], [2.15, 0.1], [2.45, -0.12], [-3.6, -0.3]].forEach(([x, z], i) => {
  const y = surfY(x) - 0.02, blades = [];
  for (let j = 0; j < 5; j++) {
    const a = (j - 2) * 0.55 + Math.sin(i * 3.1 + j) * 0.3, h = 0.3 + 0.12 * Math.abs(Math.sin(i * 1.7 + j * 2.3));
    const bx = x + (j - 2) * 0.025, bz = z + Math.sin(i + j * 1.9) * 0.05;
    blades.push(CAP([bx, y, bz], [bx + Math.sin(a) * h * 0.3, y + h, bz + Math.cos(a * 1.3) * 0.05], 0.019, 6));
  }
  GROUPS.push(blades);
});
// pebbles pressed into the cut face
[[-2.6, 0.6, 0.06], [-3.4, 0.9, 0.05], [-4.4, 0.5, 0.07], [1.9, 0.35, 0.06], [1.2, 0.9, 0.05], [-0.2, 1.1, 0.045],
  [0.4, 1.15, 0.05], [-1.6, 1.1, 0.05], [2.2, 1.0, 0.045], [-3.0, 0.25, 0.06], [-4.0, 1.0, 0.05], [0.9, 2.45, 0.04]].forEach(([x, y, r]) =>
  GROUPS.push([E([x, y, TZ - 0.03], [r * 1.3, r, r], 2)]));
// roots: along the wall and hanging through the first tunnel
// The wall roots used to sit almost on the face (z 0.245, pale): long pale rods
// that read as a stick lying across the cut. Now short, kinked, tapering pieces
// pressed mostly into the face (ROOT_SINK), in a darker root brown (material 8).
const ROOT_SINK = 0.012;
const wallRoot = pts => pts.slice(1).map((b, i) => {
  const a = pts[i], r = 0.013 * (1 - 0.3 * i / pts.length);
  return CAP([a[0], a[1], TZ - ROOT_SINK], [b[0], b[1], TZ - ROOT_SINK], r, 8);
});
GROUPS.push([
  ...wallRoot([[-0.95, 2.3], [-0.82, 2.37], [-0.66, 2.36], [-0.5, 2.41]]),
  ...wallRoot([[-0.9, 1.95], [-0.76, 2.02], [-0.62, 2.0], [-0.5, 2.1]]),
  CAP([0.05, 2.72, 0.2], [0.24, 2.6, 0.19], 0.016, 8), CAP([0.24, 2.6, 0.19], [0.33, 2.57, 0.18], 0.011, 8)
]);
// the rubbish pile: old husks, a bit of beetle shell, dark old food
(() => {
  const rm = ROOMS.rubbish, it = [];
  [[0.12, 0.14], [0.19, 0.08], [0.25, 0.17], [0.09, 0.05], [0.3, 0.07]].forEach(([x, z]) => it.push(E(onFloor(rm, x, z, 0.016), [0.05, 0.018, 0.035], 11)));
  it.push(E(onFloor(rm, 0.17, 0.12, 0.045), [0.045, 0.017, 0.03], 11));
  it.push(E(onFloor(rm, 0.27, 0.1, 0.03), [0.035, 0.012, 0.028], 17));
  it.push(E(onFloor(rm, 0.06, 0.12, 0.022), [0.03, 0.024, 0.028], 11));
  GROUPS.push(it);
})();
// the nursery: eggs heaped at the back, two more larvae
(() => {
  const rm = ROOMS.nursery, it = [];
  [[-0.8, 0.07, 0], [-0.74, 0.1, 0], [-0.69, 0.05, 0], [-0.63, 0.09, 0], [-0.76, 0.04, 0.032], [-0.7, 0.08, 0.034], [-0.58, 0.04, 0]].forEach(([x, z, dy]) =>
    it.push(E([x, floorAt(rm, x, z) + 0.02 + dy, z], [0.03, 0.021, 0.021], 5)));
  it.push({ raw: `larva(p - ${v3([-0.95, floorAt(rm, -0.95, 0.05) + 0.032, 0.05])}, 0.0)`, c: [-0.95, 1.46, 0.05], ext: 0.1, m: 18 });
  it.push({ raw: `larva(p - ${v3([-0.32, floorAt(rm, -0.32, 0.04) + 0.032, 0.04])}, 0.3)`, c: [-0.32, 1.46, 0.04], ext: 0.1, m: 18 });
  GROUPS.push(it);
})();
// the pupae room: cocoons along the back
(() => {
  const rm = ROOMS.pupae, it = [];
  [[-1.38, 0.08, 0], [-1.26, 0.03, 0], [-1.32, 0.1, 0.05], [-0.95, 0.05, 0], [-0.84, 0.08, 0]].forEach(([x, z, dy]) =>
    it.push(E([x, floorAt(rm, x, z) + 0.034 + dy, z], [0.07, 0.034, 0.036], 19)));
  GROUPS.push(it);
})();
// the queen's chamber: her eggs at the back
(() => {
  const rm = ROOMS.queen, it = [];
  [[0.27, 0.0], [0.33, 0.04], [0.39, -0.02], [0.3, 0.08], [0.45, 0.03]].forEach(([x, z]) => it.push(E([x, floorAt(rm, x, z) + 0.021, z], [0.03, 0.021, 0.021], 5)));
  it.push(E([0.33, floorAt(rm, 0.33, 0.02) + 0.055, 0.02], [0.03, 0.021, 0.021], 5));
  GROUPS.push(it);
})();
// the store: seeds and old crumbs, heaped
(() => {
  const rm = ROOMS.store, it = [];
  const seed = (x, z, dy) => it.push(E([x, floorAt(rm, x, z) + 0.03 + dy, z], [0.045, 0.03, 0.032], 7));
  [[-1.36, 0.16], [-1.28, 0.17]].forEach(([x, z]) => seed(x, z, 0));
  [[-1.55, 0.06], [-1.46, 0.05], [-1.36, 0.06], [-1.27, 0.05], [-1.18, 0.06]].forEach(([x, z]) => seed(x, z, 0));
  [[-1.42, 0.1], [-1.33, 0.12], [-1.24, 0.1]].forEach(([x, z]) => seed(x, z, 0.05));
  seed(-1.3, 0.08, 0.1);
  it.push(E(onFloor(rm, -1.64, 0.12, 0.035), [0.045, 0.036, 0.04], 9));
  it.push(E(onFloor(rm, -1.1, 0.05, 0.032), [0.04, 0.032, 0.036], 9));
  it.push(E(onFloor(rm, -0.95, 0.04, 0.03), [0.04, 0.03, 0.034], 7));
  GROUPS.push(it);
})();
// the picnic blanket's hem and a strawberry on it
GROUPS.push([
  { raw: `sdRoundBox(p - ${v3([(BLANKET.x0 + BLANKET.x1) / 2, GROUND + BLANKET.h / 2, (BLANKET.z0 + BLANKET.z1) / 2])}, ${v3([(BLANKET.x1 - BLANKET.x0) / 2, BLANKET.h / 2, (BLANKET.z1 - BLANKET.z0) / 2])}, 0.012)`,
    c: [(BLANKET.x0 + BLANKET.x1) / 2, GROUND, (BLANKET.z0 + BLANKET.z1) / 2], ext: 0.75, m: 14 },
  CAP([BLANKET.x1, GROUND + 0.026, BLANKET.z0], [BLANKET.x1, GROUND + 0.026, BLANKET.z1], 0.026, 14)
]);
GROUPS.push([
  { raw: `smin(sdEll(p - ${v3(STRAWBERRY)}, vec3(0.085, 0.09, 0.085)), sdEll(p - ${v3([STRAWBERRY[0] - 0.035, STRAWBERRY[1] - 0.03, STRAWBERRY[2]])}, vec3(0.06, 0.06, 0.065)), 0.03)`, c: STRAWBERRY, ext: 0.12, m: 15 },
  CAP([STRAWBERRY[0], STRAWBERRY[1] + 0.08, STRAWBERRY[2]], [STRAWBERRY[0] + 0.06, STRAWBERRY[1] + 0.1, STRAWBERRY[2] + 0.03], 0.014, 6),
  CAP([STRAWBERRY[0], STRAWBERRY[1] + 0.08, STRAWBERRY[2]], [STRAWBERRY[0] - 0.05, STRAWBERRY[1] + 0.1, STRAWBERRY[2] - 0.04], 0.014, 6),
  CAP([STRAWBERRY[0], STRAWBERRY[1] + 0.08, STRAWBERRY[2]], [STRAWBERRY[0] + 0.01, STRAWBERRY[1] + 0.13, STRAWBERRY[2]], 0.01, 6)
]);
// thumb prints pressed into the cut face here and there
const PRINTS = [[-3.4, 0.8], [-2.6, 0.95], [-0.75, 2.6], [0.55, 2.55], [1.05, 1.8], [-0.1, 1.3], [-0.8, 1.27],
  [-0.6, 0.55], [0.6, 0.95], [-1.3, 0.66], [1.7, 0.4], [-4.2, 0.7]];

function extent(it) {
  if (it.e) return { c: it.e, x: Math.max(...it.s) };
  if (it.cap) { const [a, b, r] = it.cap; return { c: lerp3(a, b, 0.5), x: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2 + r }; }
  return { c: it.c, x: it.ext };
}
function emitItem(it) {
  if (it.e) return `U(r, sdEll(p - ${v3(it.e)}, ${v3(it.s)}), ${f(it.m)});`;
  if (it.cap) return `U(r, sdCap(p, ${v3(it.cap[0])}, ${v3(it.cap[1])}, ${f(it.cap[2])}), ${f(it.m)});`;
  return `U(r, ${it.raw}, ${f(it.m)});`;
}
function emitGroup(items) {
  const ex = items.map(extent);
  const c = [0, 1, 2].map(k => ex.reduce((s, e) => s + e.c[k], 0) / ex.length);
  const rad = Math.max(...ex.map(e => Math.hypot(e.c[0] - c[0], e.c[1] - c[1], e.c[2] - c[2]) + e.x)) + 0.03;
  return `  if (length(p - ${v3(c)}) < ${f(rad)}) {\n    ${items.map(emitItem).join('\n    ')}\n  }`;
}

// ---- GLSL for the static world (needs sdEll, sdRoundBox, sdCap, smin, smax, U, hash) ----
function glsl() {
  const sc = [(SLAB.x0 + SLAB.x1) / 2, (HILL.top + 0.2) / 2, (SLAB.z0 + SLAB.z1) / 2];
  const sh = [(SLAB.x1 - SLAB.x0) / 2, (HILL.top + 0.2) / 2, (SLAB.z1 - SLAB.z0) / 2];
  const door = [P.door[0], surfY(P.door[0]), -0.05];
  const caps = TUNNELS.map(([a, b, r]) => `t = min(t, sdCap(p, ${v3([a[0], a[1], TZ])}, ${v3([b[0], b[1], TZ])}, ${f(r)}));`).join('\n      ');
  const rooms = Object.values(ROOMS).map(r => `t = min(t, sdEll(p - ${v3([r.x, r.y, TZ])}, ${v3([r.rx, r.ry, r.rz])}));`).join('\n      ');
  const carveZ = TZ - Math.max(QUEEN_RZ, TR) - 0.03;
  const prints = PRINTS.map(([x, y], i) =>
    `q = p.xy - vec2(${f(x)}, ${f(y)}); a += sin(length(q * vec2(1.0, ${f(1 + (i % 3) * 0.15)})) * ${f(150 + (i % 4) * 8)}) * 0.0014 * smoothstep(0.15, 0.0, length(q));`).join('\n  ');
  return `
float surfY(float x) {
  float hill = ${f(HILL.top)} - ${f(HILL.slope)} * sqrt(x * x + ${f(HILL.soft)}) + ${f(HILL.wob)} * sin(x * 9.0);
  float gr = ${f(GROUND)} + 0.01 * sin(x * 7.0 + 1.0);
  return -smin(-hill, -gr, ${f(FOOT_K)});
}
// a larva, head towards +x, curled a little; w bends it (wiggle)
float larva(vec3 q, float w) {
  float d = sdEll(q - vec3(-0.05, 0.0, 0.0), vec3(0.042, 0.034, 0.034));
  d = smin(d, sdEll(q - vec3(-0.005, 0.008 + w * 0.004, 0.0), vec3(0.036, 0.03, 0.03)), 0.02);
  d = smin(d, sdEll(q - vec3(0.035, 0.012 + w * 0.012, 0.0), vec3(0.026, 0.023, 0.024)), 0.015);
  d = smin(d, sdEll(q - vec3(0.058, 0.004 + w * 0.02, 0.0), vec3(0.016, 0.016, 0.016)), 0.01);
  return d + sin(q.x * 140.0) * 0.0015;
}
float prints(vec3 p) {
  float a = 0.0; vec2 q;
  ${prints}
  return a;
}
vec2 world(vec3 p) {
  // the slice, cut to the mound on top and the flat ground either side
  float d = sdRoundBox(p - ${v3(sc)}, ${v3(sh)}, ${f(SLAB.round)});
  float top = surfY(p.x);
  d = smax(d, (p.y - top) * 0.65, 0.06);
  d = smin(d, sdEll(p - ${v3(door)}, vec3(0.18, 0.05, 0.16)), 0.05);      // rim behind the door
  // tunnels and rooms carved into the front face
  if (p.z > ${f(carveZ)}) {
    float t = 1e3;
    ${caps}
    ${rooms}
    d = smax(d, -t, 0.035);
  }
  d = smin(d, sdEll(p - ${v3(BUMP_C)}, ${v3(BUMP_R)}), 0.03);             // the bump in the diggers' tunnel
  // outer crust of pine needles and twigs, packed sandy soil inside
  vec2 r = vec2(d, top - p.y < ${f(CRUST)} ? 10.0 : 1.0);
  // scent dots along the surface
  if (p.x > ${f(TRAIL.x0)} && p.x < ${f(TRAIL.x1)} && abs(p.z - ${f(ANT_Z)}) < 0.06 && abs(p.y - top) < 0.05) {
    float cx = (floor(p.x / ${f(TRAIL.cell)}) + 0.5) * ${f(TRAIL.cell)};
    float jz = (hash(vec3(cx * 7.0, 1.0, 2.0)) - 0.5) * 0.04;
    U(r, sdEll(p - vec3(cx, surfY(cx) + 0.004, ${f(ANT_Z)} + jz), vec3(0.02, 0.008, 0.018)), 13.0);
  }
${GROUPS.map(emitGroup).join('\n')}
  return r;
}`;
}

window.ANTHILL = {
  // numbers the renderer needs
  MAXA, NC, ANT_Z, TZ, SLAB, HILL, GROUND, FLY_TIME, STRIDE,
  WORM: { a: [WORM.a[0], WORM.a[1], WORM_Z], b: [WORM.b[0], WORM.b[1], WORM_Z], len: WORM_LEN },
  PELLETS, LARVA, COCOON, TRAIL, ROOMS, TUNNELS, STOPS, BLANKET, STRAWBERRY,
  PAGES, frame, glsl, surfY, fxOf,
  count: PAGES.length
};
})();
