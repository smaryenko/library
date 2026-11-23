// WHERE IS THE CAT? One three.js table scene shared by all 8 pages.
//
// Realistic wooden toys on a dark walnut table in a softly blurred room (the
// look approved in books/preview/assets/js/woodtoys.js): a black painted
// beech cat, a blue painted box with a hinged lid, a little beech table, plus
// a toy door in a frame, a ramp, two block towers, a basket of wooden balls,
// one ball and a small white kitten. Every prop is built ONCE.
// Page 1 holds every preposition: it opens with the cat IN the box; each tap
// moves the cat to the next word (STATIONS) and swaps the red label and the
// page sentence; tap while moving snaps to the end; it cycles.
// Pages 2-8 are opposites: pose(u), u = 0 the first word, u = 1 the second;
// tap plays to the other end, tap while playing snaps.
// The camera auto-fits the props in use.
//
// One WebGL canvas, moved onto whichever page is shown (never onto the
// next-page prerender, `.obj-prerender`). Pages call window.buildWhereCat(i).
(function () {
'use strict';
const THREE = window.THREE;
if (!THREE) { window.buildWhereCat = () => '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"></svg>'; return; }

// ---- tune by eye -------------------------------------------------------------
const BOX = { w: 1.2, h: 0.5, d: 0.7, t: 0.055 };      // outer size, wall thickness
const LID_OPEN = 1.85;                                  // rad: open = tipped back past upright
const TABLE = { x: -1.45, h: 0.76, w: 0.66, d: 0.52, leg: 0.035, top: 0.05 };   // the little toy table
const DOOR = { w: 0.5, h: 0.86, post: 0.06, depth: 0.12, foot: 0.3, open: 1.75 };
const RAMP = { x0: -0.7, x1: 0.7, h: 0.45, d: 0.5, block: 0.35 };
const BLOCK = 0.2;                                      // cube edge
const TOWERS = { tallX: -0.3, shortX: 0.3, tall: 5, short: 2 };
const BASKET = { r: 0.27, h: 0.2, x: 0.75, z: 0.05, tip: 0.9 };
const BALL_R = 0.075, BALL_COUNT = 15, BIG_BALL_R = 0.08;
const CAT_S = 1.0, KITTEN_S = 0.55;
const CAT_PAINT = 0x161412, FACE_PAINT = 0xeedcb0, NOSE_PAINT = 0xd98f8f, COLLAR_PAINT = 0xa3322a;
const KITTEN_PAINT = 0xf2ede2, KITTEN_FACE = 0x3a2c24, KITTEN_COLLAR = 0x3f74a8;
const EYE_DOT = 0x2b1d14;
const BOX_PAINT = 0x3f74a8, DOOR_PAINT = 0x4f7a4a;
const BLOCK_PAINTS = [0xb8402e, 0xd9a53a, 0x5f8a4a, 0x3f74a8, null, 0xd9a53a, 0xb8402e];   // null = bare beech
const BALL_PAINTS = [0xb8402e, 0xd9a53a, 0x3f74a8, 0x5f8a4a, null];
const LIGHT = { key: 2.8, keyColor: 0xffe6c4, keyPos: [-3.6, 5.2, 2.6], hemi: 0.35, env: 0.55, exposure: 1.0 };
const WOOD = {
  oak: { light: [150, 104, 66], dark: [92, 58, 34], rings: 26, seed: 3 },     // dark walnut-like table top
  pine: { light: [226, 196, 150], dark: [190, 142, 92], rings: 14, seed: 7 },
  beech: { light: [222, 184, 142], dark: [190, 146, 106], rings: 9, seed: 11 }
};
// camera: view directions (from the look point towards the camera); distance is auto-fit
const FOV = 28;
const CAM_DIR = [0.5, 0.62, 3.3];        // low, close toy-photo angle
const CAM_SIDE = [2.2, 0.8, 2.55];       // "behind": swings round to see behind the box
const CAM_DOOR = [1.3, 0.72, 3.0];       // "through": a little from the side, so the cat shows behind the door
const CAM_LOW = [0.3, 0.4, 3.3];         // near / far: dolly in low towards the kitten
// auto-fit: every prop / cat pose in use is projected to the screen and the camera
// comes in until they fill the frame, leaving these margins (fraction of half-frame)
// page 1 is framed per station (that station's props + the cat at rest there);
// the camera eases between the previous and the next framing during a move
const FIT_MARGIN = 0.07, FIT_MARGIN_BOTTOM = 0.24;   // extra room at the bottom only, for the word label
const SHADOW_PAD = 0.8;                              // world units around the framed area kept inside the shadow camera
const FIT_MIN = 0.28;                                // half-size of the smallest area framed (one cat alone)
const FIT_ITER = 5;
const FIT_SAMPLES = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
// cat moves: a wooden toy pushed by hand. Slides along the table, small lean
// into the travel, a tiny rock as it stops; height changes are a short straight
// lift / drop (just clearing the edge), never an arc.
const MOVE_T = 0.95;                     // s per slide segment (path weight 1)
const LIFT_T = 0.6;                      // s per lift / drop segment (unless it gives its own weight)
const LIFT_W = LIFT_T / MOVE_T;
const segW = g => g.w || (g.kind === 'lift' ? LIFT_W : 1);
// camera: eases from one station's framing to the next over this part of the move
const CAM_EASE_FROM = 0.05, CAM_EASE_TO = 0.95;
const SLIDE_LEAN = 0.12, SLIDE_SETTLE = 0.06, SLIDE_TURN = 0.15;   // rad, rad, fraction of the move spent turning
const LIFT_CLEAR = 0.05;                 // how far above an edge a lift goes
// places around the box
const IN_Y = BOX.t, ON_Y = BOX.h + BOX.t;
const ORBIT = { rx: 0.98, rz: 0.8 };      // ellipse round the box that never touches it
const GAP_X = (-BOX.w / 2 + TABLE.x + TABLE.w / 2) / 2;   // between the box and the little table
const OVER_WALL = BOX.h + LIFT_CLEAR;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ease = t => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = t => (t = clamp(t, 0, 1), 0.5 - 0.5 * Math.cos(Math.PI * t));   // gentle in-out for slides / camera
const easeOut = t => (t = clamp(t, 0, 1), 1 - (1 - t) * (1 - t));
const easeBack = t => { t = clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
const orbit = a => [ORBIT.rx * Math.sin(a), 0, ORBIT.rz * Math.cos(a)];

const TIER = (() => {
  const c = document.createElement('canvas'), gl = c.getContext('webgl2');
  if (!gl) return -1;
  const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  const touch = matchMedia('(pointer: coarse)').matches;
  if (mem <= 2 || cores <= 2) return 0;
  if (!touch && mem >= 8 && cores >= 8) return 2;
  return 1;
})();
const Q = [{ tex: 512, shadow: 1024, dpr: 1 }, { tex: 1024, shadow: 2048, dpr: 1.5 }, { tex: 1024, shadow: 2048, dpr: 2 }][Math.max(0, TIER)];

// ---- procedural wood (as in the approved preview) ----------------------------------
function makeNoise(seed) {
  const P = new Uint8Array(512);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < 256; i++) P[i] = i;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const h = (x, y) => P[P[x & 255] + (y & 255)] / 255;
  // periodic value noise: lattice wraps every px / py cells, so a texture sampling
  // n(u * px, v * py) over u, v in [0, 1) tiles without a seam
  const wrap = (i, p) => (p ? ((i % p) + p) % p : i);
  return (x, y, px = 0, py = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = wrap(xi, px), x1 = wrap(xi + 1, px), y0 = wrap(yi, py), y1 = wrap(yi + 1, py);
    return lerp(lerp(h(x0, y0), h(x1, y0), u), lerp(h(x0, y1), h(x1, y1), u), v);
  };
}
function woodTextures(w) {
  const N = Q.tex, n = makeNoise(w.seed);
  const cc = document.createElement('canvas'), bc = document.createElement('canvas');
  cc.width = cc.height = bc.width = bc.height = N;
  const cx = cc.getContext('2d'), bx = bc.getContext('2d');
  const ci = cx.createImageData(N, N), bi = bx.createImageData(N, N);
  // every noise frequency is a whole number of cells across the texture, so it repeats seamlessly
  const F1 = Math.round(N * 0.35), F2 = Math.round(N * 0.8);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      const warp = n(u * 3, v * 2, 3, 2) * 1.6 + n(u * 9, v * 5, 9, 5) * 0.35;
      const r = (v * w.rings + warp * 2.2) % 1;
      const ring = Math.pow(Math.min(r, 1 - r) * 2, 0.55);
      const fibre = n(u * 6, v * F1, 6, F1) * 0.6 + n(u * 20, v * F2, 20, F2) * 0.4;
      const fleck = n(u * 60, v * 140, 60, 140) > 0.82 ? 0.12 : 0;
      const t = clamp(ring * 0.7 + fibre * 0.35 - fleck, 0, 1);
      const k = (y * N + x) * 4;
      for (let c = 0; c < 3; c++) ci.data[k + c] = lerp(w.dark[c], w.light[c], t);
      ci.data[k + 3] = 255;
      const b = clamp(ring * 0.6 + fibre * 0.4, 0, 1) * 255;
      bi.data[k] = bi.data[k + 1] = bi.data[k + 2] = b; bi.data[k + 3] = 255;
    }
  }
  cx.putImageData(ci, 0, 0); bx.putImageData(bi, 0, 0);
  const map = new THREE.CanvasTexture(cc), bump = new THREE.CanvasTexture(bc);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  return { map, bump };
}
function woodMat(tex, o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    map: tex.map, bumpMap: tex.bump, bumpScale: 1.2, roughness: 0.52,
    clearcoat: 0.22, clearcoatRoughness: 0.5, sheen: 0.1, sheenRoughness: 0.8
  }, o));
}
function paintMat(tex, color, o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color, bumpMap: tex.bump, bumpScale: 0.6, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4
  }, o));
}
function texFor(tex, rx, ry, ox, oy) {
  const m = tex.map.clone(), b = tex.bump.clone();
  for (const t of [m, b]) { t.repeat.set(rx, ry); t.offset.set(ox, oy); t.needsUpdate = true; }
  return { map: m, bump: b };
}
function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  // reaches 0 well inside the square (radius 58 of 64), so no plane edge or corner can show
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 58);
  gr.addColorStop(0, 'rgba(40,24,10,0.55)'); gr.addColorStop(0.45, 'rgba(40,24,10,0.22)');
  gr.addColorStop(0.8, 'rgba(40,24,10,0.05)'); gr.addColorStop(1, 'rgba(40,24,10,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ---- models -------------------------------------------------------------------------
const RBox = THREE.RoundedBoxGeometry;
const brass = () => new THREE.MeshPhysicalMaterial({ color: 0xb08a4a, metalness: 1, roughness: 0.38 });
function shadowy(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }

function buildBox(W) {
  const g = new THREE.Group(), { w, h, d, t } = BOX;
  const board = (sx, sy, sz, x, y, z, k) => {
    const m = new THREE.Mesh(new RBox(sx, sy, sz, 3, 0.012), paintMat(texFor(W.pine, 1, 0.5, k * 0.17, k * 0.31), BOX_PAINT, { roughness: 0.5 }));
    m.position.set(x, y, z); g.add(m); return m;
  };
  board(w, t, d, 0, t / 2, 0, 0);
  board(w, h - t, t, 0, t + (h - t) / 2, d / 2 - t / 2, 1);
  board(w, h - t, t, 0, t + (h - t) / 2, -d / 2 + t / 2, 2);
  board(t, h - t, d - 2 * t, -w / 2 + t / 2, t + (h - t) / 2, 0, 3);
  board(t, h - t, d - 2 * t, w / 2 - t / 2, t + (h - t) / 2, 0, 4);
  const hinge = new THREE.Group();
  hinge.position.set(0, h, -d / 2);
  const lid = new THREE.Mesh(new RBox(w + 0.02, t, d + 0.02, 3, 0.014), paintMat(texFor(W.pine, 1, 0.5, 0.6, 0.12), BOX_PAINT, { roughness: 0.5 }));
  lid.position.set(0, t / 2, d / 2);
  hinge.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), woodMat(W.beech, { roughness: 0.4 }));
  knob.scale.set(1, 0.7, 1); knob.position.set(0, t + 0.018, d - 0.06);
  hinge.add(knob);
  g.add(hinge);
  const b = brass();
  for (const x of [-0.35, 0.35]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 12).rotateZ(Math.PI / 2), b);
    p.position.set(x, h, -d / 2 - 0.004); g.add(p);
  }
  return { root: shadowy(g), hinge };
}

function buildTable(W) {
  const g = new THREE.Group(), { h, w, d, leg, top } = TABLE;
  const mat = woodMat(texFor(W.beech, 1, 0.6, 0.3, 0.5));
  const t = new THREE.Mesh(new RBox(w, top, d, 3, 0.015), mat);
  t.position.set(0, h - top / 2, 0); g.add(t);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(leg, leg * 0.85, h - top, 16), mat);
    l.position.set(sx * (w / 2 - 0.06), (h - top) / 2, sz * (d / 2 - 0.06)); g.add(l);
  }
  return { root: shadowy(g) };
}

// a beech frame on two feet; a painted door hinged on the left post, opens away from the camera
function buildDoor(W) {
  const g = new THREE.Group(), { w, h, post, depth, foot } = DOOR;
  const frame = woodMat(texFor(W.beech, 0.5, 1, 0.2, 0.1));
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new RBox(post, h + post, depth, 3, 0.012), frame);
    p.position.set(s * (w / 2 + post / 2), (h + post) / 2, 0); g.add(p);
    const f = new THREE.Mesh(new RBox(post + 0.05, 0.06, foot, 3, 0.015), frame);
    f.position.set(s * (w / 2 + post / 2), 0.03, 0); g.add(f);
  }
  const lintel = new THREE.Mesh(new RBox(w + 2 * post + 0.04, post, depth + 0.02, 3, 0.012), frame);
  lintel.position.set(0, h + post / 2, 0); g.add(lintel);
  const hinge = new THREE.Group();
  hinge.position.set(-w / 2, 0, 0);
  const paint = paintMat(texFor(W.pine, 0.6, 1, 0.4, 0.2), DOOR_PAINT, { roughness: 0.5 });
  const pw = w - 0.012, ph = h - 0.015;
  const panel = new THREE.Mesh(new RBox(pw, ph, 0.035, 3, 0.01), paint);
  panel.position.set(pw / 2 + 0.004, 0.01 + ph / 2, 0); hinge.add(panel);
  for (const s of [-1, 1]) for (const y of [0.27, 0.62]) {        // raised panels, both faces
    const r = new THREE.Mesh(new RBox(pw * 0.66, ph * 0.26, 0.012, 2, 0.004), paint);
    r.position.set(pw / 2 + 0.004, 0.01 + ph * y, s * 0.019); hinge.add(r);
  }
  const b = brass();
  for (const s of [-1, 1]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), b);
    k.position.set(pw - 0.06, h * 0.48, s * 0.034); hinge.add(k);
  }
  g.add(hinge);
  return { root: shadowy(g), hinge };
}

// a wedge from the table up to a flat block at the top (climbs towards +x)
function buildRamp(W) {
  const g = new THREE.Group(), { x0, x1, h, d, block } = RAMP;
  const mat = woodMat(texFor(W.beech, 0.7, 0.7, 0.1, 0.6));
  const sh = new THREE.Shape();
  sh.moveTo(x0, 0); sh.lineTo(x1, 0); sh.lineTo(x1, h); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  geo.translate(0, 0, -d / 2);
  g.add(new THREE.Mesh(geo, mat));
  const top = new THREE.Mesh(new RBox(block, h, d, 3, 0.012), mat);
  top.position.set(x1 + block / 2, h / 2, 0); g.add(top);
  return { root: shadowy(g) };
}

function blockLayout() {
  // [loose x, loose z, loose yaw] -> [target x, level]; the two base blocks start in place
  const L = [];
  for (let i = 0; i < TOWERS.tall; i++) L.push({ tx: TOWERS.tallX, lvl: i });
  for (let i = 0; i < TOWERS.short; i++) L.push({ tx: TOWERS.shortX, lvl: i });
  const loose = [[-0.8, 0.55, 0.4], [-0.5, 0.62, -0.3], [-0.2, 0.55, 0.7], [0.08, 0.64, 0.2], [0.55, 0.58, -0.5]];
  let j = 0;
  for (const b of L) if (b.lvl > 0) b.loose = loose[j++];
  return L;
}
const BLOCKS = blockLayout();
function buildBlocks(W) {
  const g = new THREE.Group(), items = [];
  BLOCKS.forEach((b, i) => {
    const c = BLOCK_PAINTS[i % BLOCK_PAINTS.length], tex = texFor(W.beech, 0.3, 0.3, i * 0.13, i * 0.29);
    const m = new THREE.Mesh(new RBox(BLOCK, BLOCK, BLOCK, 3, 0.016), c == null ? woodMat(tex) : paintMat(tex, c));
    g.add(m); items.push(m);
  });
  return { root: shadowy(g), items };
}

// a turned, banded wooden basket; the pivot sits on its -x bottom edge so it tips towards the box
function buildBasket(W) {
  const pivot = new THREE.Group(), inner = new THREE.Group(), { r, h } = BASKET;
  const prof = [[0, 0], [r * 0.82, 0], [r * 0.97, h * 0.18], [r * 1.03, h], [r * 0.95, h], [r * 0.9, h * 0.22], [r * 0.74, 0.03], [0, 0.03]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), woodMat(texFor(W.pine, 2, 0.6, 0.2, 0.4))));
  const band = woodMat(texFor(W.beech, 2, 0.3, 0.5, 0.1), { color: 0xc9a27a });
  for (const k of [0.35, 0.7, 0.98]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r * lerp(0.98, 1.035, k), 0.009, 8, 48), band);
    t.rotation.x = Math.PI / 2; t.position.y = h * k; inner.add(t);
  }
  inner.position.x = r;
  pivot.add(inner);
  return { root: shadowy(pivot), inner };
}
// ball rest spots inside the basket (basket-local) and in the box (box-local)
const BALLS_IN_BASKET = (() => {
  const out = [], f = 0.03 + BALL_R;
  out.push([0, f, 0]);
  for (let i = 0; i < 6; i++) out.push([Math.cos(i * Math.PI / 3) * 0.155, f, Math.sin(i * Math.PI / 3) * 0.155]);
  for (let i = 0; i < 6; i++) out.push([Math.cos(i * Math.PI / 3 + 0.5) * 0.09, f + 0.11, Math.sin(i * Math.PI / 3 + 0.5) * 0.09]);
  out.push([0.03, f + 0.2, 0.02], [-0.05, f + 0.19, -0.04]);
  return out.slice(0, BALL_COUNT);
})();
const BALLS_IN_BOX = (() => {
  const out = [];
  for (const z of [-0.17, 0, 0.17]) for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) out.push([x, IN_Y + BALL_R, z]);
  return out.slice(0, BALL_COUNT);
})();
function ballMesh(W, r, i) {
  const c = BALL_PAINTS[i % BALL_PAINTS.length], tex = texFor(W.beech, 0.4, 0.4, i * 0.21, i * 0.37);
  return new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), c == null ? woodMat(tex, { roughness: 0.42 }) : paintMat(tex, c));
}
function buildBalls(W) {
  const g = new THREE.Group(), items = [];
  for (let i = 0; i < BALL_COUNT; i++) { const m = ballMesh(W, BALL_R, i); g.add(m); items.push(m); }
  return { root: shadowy(g), items };
}
function buildBall(W) { const m = ballMesh(W, BIG_BALL_R, 0); return { root: shadowy(m) }; }

// the cat (and, smaller and white, the kitten): turned body, round head, painted face
function buildCat(W, o) {
  const g = new THREE.Group();
  const wood = paintMat(W.beech, o.paint, { roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45, bumpScale: 0.9 });
  const prof = [[0, 0], [0.16, 0.0], [0.19, 0.04], [0.195, 0.1], [0.175, 0.2], [0.14, 0.29], [0.1, 0.35], [0.07, 0.38], [0, 0.39]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), wood);
  body.scale.set(1, 1, 0.85); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 40, 28), wood);
  head.scale.set(1.12, 0.94, 0.9); head.position.set(0, 0.47, 0.01); g.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.09, 24, 1), wood);
    ear.position.set(s * 0.085, 0.575, -0.01); ear.rotation.z = -s * 0.38; ear.scale.set(1, 1, 0.5); g.add(ear);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), wood);
    tip.position.set(s * 0.1, 0.612, -0.01); tip.scale.set(1, 1, 0.6); g.add(tip);
  }
  for (const s of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), wood);
    paw.scale.set(0.9, 0.6, 1.3); paw.position.set(s * 0.065, 0.028, 0.15); g.add(paw);
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 14, 40, Math.PI * 0.95), wood);
  tail.rotation.x = Math.PI / 2; tail.rotation.z = -0.2; tail.position.set(0, 0.03, 0); g.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), wood);
  tailTip.position.set(Math.cos(Math.PI * 0.95 - 0.2) * 0.19, 0.03, Math.sin(Math.PI * 0.95 - 0.2) * 0.19); g.add(tailTip);
  // face: asleep / default = closed smiling eyes (two arcs); awake = painted dot eyes with a highlight
  const face = paintMat(W.beech, o.face, { roughness: 0.4, clearcoat: 0.5 });
  const closed = new THREE.Group(), open = new THREE.Group();
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0045, 8, 20, Math.PI), face);
    eye.position.set(s * 0.052, 0.49, 0.118); eye.rotation.y = s * 0.4; closed.add(eye);
    const e = new THREE.Group();
    e.position.set(s * 0.052, 0.492, 0.116); e.rotation.y = s * 0.4;
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 14), face);
    white.scale.set(1, 1.15, 0.35); e.add(white);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 18, 12), paintMat(W.beech, EYE_DOT, { roughness: 0.3, clearcoat: 0.7 }));
    dot.scale.set(1, 1.1, 0.35); dot.position.set(-s * 0.002, -0.002, 0.006); e.add(dot);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 }));
    shine.scale.set(1, 1, 0.5); shine.position.set(-0.005, 0.004, 0.0105); e.add(shine);
    open.add(e);
  }
  open.visible = false;
  g.add(closed, open);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.013, 14, 10), paintMat(W.beech, NOSE_PAINT));
  nose.scale.set(1.3, 0.85, 0.5); nose.position.set(0, 0.458, 0.128); g.add(nose);
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0035, 8, 16, Math.PI), face);
    m.rotation.z = Math.PI; m.rotation.y = s * 0.15; m.position.set(s * 0.012, 0.447, 0.127); g.add(m);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.013, 12, 40), paintMat(W.beech, o.collar));
  collar.rotation.x = Math.PI / 2; collar.scale.set(1, 0.86, 1); collar.position.set(0, 0.368, 0.004); g.add(collar);
  if (o.tag) {
    const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 20).rotateX(Math.PI / 2),
      new THREE.MeshPhysicalMaterial({ color: 0xc9a04e, metalness: 1, roughness: 0.32 }));
    tag.position.set(0, 0.338, 0.085); g.add(tag);
  }
  g.scale.setScalar(o.scale);
  const pivot = new THREE.Group(); pivot.add(g);           // leans / rocks about the base
  return { root: shadowy(pivot), inner: g, base: o.scale, closed, open };
}

// ---- pose helpers (called fresh every frame) ---------------------------------------------
// actor pose: position, yaw (0 = facing the camera side, +z), lean, squash
function put(a, p, yaw = 0, o = {}) {
  a.root.position.set(p[0], p[1], p[2]);
  a.root.rotation.set(o.rx || 0, 0, o.rz || 0);
  a.inner.rotation.y = yaw;
  const sx = o.sx || 1, sy = o.sy || 1;
  a.inner.scale.set(a.base * sx, a.base * sy, a.base * sx);
  a.closed.visible = !o.awake; a.open.visible = !!o.awake;
}
// turn from y0 to the travel direction at the start, back to y1 at the end
function travelYaw(A, B, k, y0, y1) {
  const dx = B[0] - A[0], dz = B[2] - A[2];
  if (Math.hypot(dx, dz) < 0.01) return lerpAngle(y0, y1, k);
  const tr = Math.atan2(dx, dz);
  return k < 0.2 ? lerpAngle(y0, tr, ease(k / 0.2)) : k > 0.8 ? lerpAngle(tr, y1, ease((k - 0.8) / 0.2)) : tr;
}
// tilt (rad) of a pushed toy at move progress k: lean into the travel, then a small rock as it stops
function pushTilt(k, lean = SLIDE_LEAN) {
  if (k <= 0 || k >= 1) return 0;
  if (k < 0.82) return lean * Math.sin(Math.PI * Math.min(1, k / 0.82));
  const s = seg(k, 0.82, 1);
  return -SLIDE_SETTLE * Math.sin(2 * Math.PI * s) * (1 - s);
}
// slide along a curve f(e), e in [0, 1]; the toy stops at k = 0.82, then settles
function slideAlong(a, f, k, o = {}) {
  const e = easeSine(seg(k, 0, 0.82)), y0 = o.y0 || 0, y1 = o.y1 != null ? o.y1 : y0;
  const p = f(e), q0 = f(Math.max(0, e - 0.01)), q1 = f(Math.min(1, e + 0.01));
  let dx = q1[0] - q0[0], dz = q1[2] - q0[2];
  const dl = Math.hypot(dx, dz), A = f(0), B = f(1);
  if (dl < 1e-6) { dx = B[0] - A[0]; dz = B[2] - A[2]; }
  const L = Math.hypot(dx, dz) || 1, t = pushTilt(k, o.lean);
  let yaw;
  if (o.noTurn || Math.hypot(B[0] - A[0], B[2] - A[2]) + (o.loop ? 1 : 0) < 0.01) yaw = lerpAngle(y0, y1, e);
  else {
    const tr = Math.atan2(dx, dz);
    yaw = k < SLIDE_TURN ? lerpAngle(y0, tr, ease(k / SLIDE_TURN))
      : k > 0.82 - SLIDE_TURN ? lerpAngle(tr, y1, ease(seg(k, 0.82 - SLIDE_TURN, 0.9))) : tr;
  }
  put(a, p, yaw, { rx: (dz / L) * t + (o.rx || 0), rz: -(dx / L) * t + (o.rz || 0), awake: o.awake });
}
function slide(a, A, B, k, o = {}) { slideAlong(a, e => lerp3(A, B, e), k, o); }
// along the ellipse round the box, angle a0 -> a1
function slideOrbit(a, a0, a1, k, o = {}) { slideAlong(a, e => orbit(lerp(a0, a1, e)), k, { ...o, loop: Math.abs(a1 - a0) > 6 }); }
// height change: straight up to `top` (just over the edge), across, straight down; no arc, no air time
function lift(a, A, B, k, o = {}) {
  const top = o.top != null ? o.top : Math.max(A[1], B[1]) + LIFT_CLEAR;
  const y0 = o.y0 || 0, y1 = o.y1 != null ? o.y1 : y0;
  const up = ease(seg(k, 0, 0.3)), across = ease(seg(k, 0.22, 0.68)), down = ease(seg(k, 0.6, 0.85));
  const p = lerp3(A, B, across);
  p[1] = down > 0 ? lerp(top, B[1], down) : lerp(A[1], top, up);
  const dx = B[0] - A[0], dz = B[2] - A[2], dl = Math.hypot(dx, dz) || 1;
  const t = k < 0.85 ? SLIDE_LEAN * 0.6 * Math.sin(Math.PI * seg(k, 0.22, 0.68)) : pushTilt(lerp(0.82, 1, seg(k, 0.85, 1)));
  const yaw = o.noTurn || dl < 0.01 ? lerpAngle(y0, y1, across) : travelYaw(A, B, across, y0, y1);
  put(a, p, yaw, { rx: (dz / dl) * t, rz: -(dx / dl) * t, awake: o.awake });
}
function place(root, x, z, ry = 0) { root.position.set(x, 0, z); root.rotation.set(0, ry, 0); }
const lid = (P, v) => { P.box.hinge.rotation.x = -v * LID_OPEN; };
const doorOpen = (P, v) => { P.door.hinge.rotation.y = v * DOOR.open; };
function rollBall(m, A, B, e, r) {
  const p = lerp3(A, B, e), dx = B[0] - A[0], dz = B[2] - A[2], L = Math.hypot(dx, dz) || 1;
  m.position.set(p[0], p[1], p[2]);
  m.quaternion.setFromAxisAngle(new THREE.Vector3(dz / L, 0, -dx / L), (e * L) / r);
}
const rampY = x => x < RAMP.x0 ? 0 : x < RAMP.x1 ? (x - RAMP.x0) / (RAMP.x1 - RAMP.x0) * RAMP.h : x < RAMP.x1 + RAMP.block ? RAMP.h : 0;
const RAMP_ANGLE = Math.atan2(RAMP.h, RAMP.x1 - RAMP.x0);
const onRamp = x => clamp((x - RAMP.x0) / 0.08, 0, 1) * clamp((RAMP.x1 - x) / 0.08, 0, 1);


// ---- page 1: all the prepositions, one tap at a time --------------------------------------
// Each station is a resting pose (the cat sits where its word says) plus the
// move that gets there from the previous station. A station at k = 1 IS its
// word, so the page opens on station 0 already correct. Props a station needs
// grow in (show windows) and the ones it no longer needs shrink away (hide
// windows), both as fractions of the move. The page text for station i is
// window.WHERECAT_PREP[i] (pages.js); same order as STATIONS.
const OUT = [0, 0, 0.8], IN = [0, IN_Y, 0.02];
const RAMP_TOP = RAMP.x1 + RAMP.block / 2, RAMP_FOOT = RAMP.x0 - 0.4, RAMP_END = RAMP.x0 - 0.55;
const BALL_FROM = [-0.95, BIG_BALL_R, 1.0], BALL_TO = [TABLE.x, BIG_BALL_R, 0];
const PREP_PROPS = ['box', 'table', 'door', 'ramp', 'ball', 'cat'];
// path segments: slide (along the table / ramp), arc (along the ellipse round the
// box, angles a0 -> a1), lift (short straight lift / drop over an edge), wait.
// w = weight; one weight takes MOVE_T seconds. T is worked out from the path
// (and the `go` window) unless a station gives its own.
const arc = (a0, a1, o = {}) => ({ kind: 'arc', a0, a1, to: orbit(a1), ...o });
const PI = Math.PI;
const STATIONS = [
  { word: 'in', props: ['box'], go: [0.35, 1], show: { box: [0.05, 0.3] }, hide: { ramp: [0, 0.25] },
    set(P, k) { lid(P, ease(seg(k, 0.15, 0.35))); },
    path: [{ to: OUT, kind: 'slide' }, { to: IN, kind: 'lift', top: OVER_WALL }] },
  { word: 'on', props: ['box'],
    set(P, k) { lid(P, 1 - ease(seg(k, 0.4, 0.62))); },     // closes while the cat waits in front
    path: [{ to: OUT, kind: 'lift', top: OVER_WALL }, { to: [0, ON_Y, 0.02], kind: 'lift', noTurn: true }] },
  { word: 'under', props: ['box', 'table'],
    path: [{ to: [-0.5, 0, 0.8], kind: 'lift' }, { to: [TABLE.x, 0, 0.85], kind: 'slide' },
      { to: [TABLE.x, 0, 0.02], kind: 'slide', w: 0.8 }] },
  { word: 'behind', props: ['box', 'table'], cam: CAM_SIDE,
    path: [{ to: orbit(-PI / 2), kind: 'slide', w: 0.8 }, arc(-PI / 2, -PI, { y1: 0.6 })] },
  { word: 'in front of', props: ['box', 'table'],
    path: [arc(PI, 0, { w: 1.6 })] },
  { word: 'next to', props: ['box', 'table'],
    path: [arc(0, PI / 2)] },
  { word: 'between', props: ['box', 'table'],
    path: [arc(PI / 2, -PI / 2, { w: 1.6 }), { to: [GAP_X, 0, 0.02], kind: 'slide', w: 0.5 }] },
  { word: 'above / below', props: ['box', 'table', 'ball'], go: [0, 0.45], show: { ball: [0.35, 0.5] },
    set(P, k) { rollBall(P.ball.root, BALL_FROM, BALL_TO, easeOut(seg(k, 0.5, 1)), BIG_BALL_R); },
    path: [{ to: [TABLE.x, TABLE.h, 0], kind: 'lift' }] },
  { word: 'over', props: ['box'], hide: { table: [0.3, 0.5], ball: [0, 0.3] },
    path: [{ to: [-ORBIT.rx, 0, 0.45], kind: 'lift' }, { to: [-ORBIT.rx, 0, 0], kind: 'slide', w: 0.5 },
      { to: [ORBIT.rx, 0, 0], kind: 'lift', top: ON_Y + 0.12, w: 1.2 }] },
  { word: 'around', props: ['box'],
    path: [arc(PI / 2, PI / 2 + 2 * PI, { w: 3 })] },
  { word: 'through', props: ['door'], cam: CAM_DOOR, hide: { box: [0, 0.25] }, show: { door: [0.2, 0.45] },
    set(P, k) { doorOpen(P, ease(seg(k, 0.45, 0.6))); },
    path: [{ to: [0.75, 0, -0.75], kind: 'slide', w: 0.6 }, { to: [0, 0, -0.8], kind: 'slide', w: 0.5 },
      { kind: 'wait', w: 0.3 }, { to: [0, 0, 0.7], kind: 'slide', noTurn: true, w: 0.8 }] },
  { word: 'outside', props: ['box'], hide: { door: [0, 0.3] }, show: { box: [0.2, 0.5] }, go: [0, 0.4],
    set(P, k) { lid(P, ease(seg(k, 0.5, 0.9))); },
    path: [{ to: OUT, kind: 'slide' }] },
  { word: 'inside', props: ['box'],
    set(P) { lid(P, 1); },
    path: [{ to: IN, kind: 'lift', top: OVER_WALL, noTurn: true }] },
  { word: 'up', props: ['ramp'], T: MOVE_T * 3.4, at: [RAMP_TOP, RAMP.h, 0], hide: { box: [0.3, 0.45] }, show: { ramp: [0.4, 0.55] },
    move(k, P) {
      if (k < 0.3) { lift(P.cat, IN, [RAMP_FOOT, 0, 0], seg(k, 0, 0.3), { top: OVER_WALL }); return; }
      if (k < 0.55) { put(P.cat, [RAMP_FOOT, 0, 0], lerpAngle(0, PI / 2, ease(seg(k, 0.42, 0.55)))); return; }
      // slide up the ramp, facing up it, tilted with the slope
      const kk = seg(k, 0.55, 1), x = lerp(RAMP_FOOT, RAMP_TOP, ease(seg(kk, 0, 0.82)));
      const yaw = kk > 0.82 ? lerpAngle(PI / 2, 0, ease(seg(kk, 0.82, 1))) : PI / 2;
      put(P.cat, [x, rampY(x), 0], yaw, { rz: RAMP_ANGLE * onRamp(x) - pushTilt(kk) });
    } },
  { word: 'down', props: ['ramp'], T: MOVE_T * 2.2, at: [RAMP_END, 0, 0],
    move(k, P) {
      let x = RAMP_TOP, yaw;
      if (k < 0.15) yaw = lerpAngle(0, -PI / 2, ease(k / 0.15));
      else if (k < 0.85) { x = lerp(RAMP_TOP, RAMP_END, 1 - Math.pow(1 - seg(k, 0.15, 0.85), 2.2)); yaw = -PI / 2; }
      else { x = RAMP_END; yaw = lerpAngle(-PI / 2, 0, ease(seg(k, 0.85, 1))); }
      const rock = k > 0.85 ? pushTilt(lerp(0.82, 1, seg(k, 0.85, 1))) : 0;
      put(P.cat, [x, rampY(x), 0], yaw, { rz: RAMP_ANGLE * onRamp(x) + rock });
    } }
];
for (const s of STATIONS) {
  if (s.T) continue;
  const n = s.path.reduce((t, g) => t + segW(g), 0), go = s.go || [0, 1];
  s.T = n * MOVE_T / (go[1] - go[0]);
}
const lastSeg = s => s.path[s.path.length - 1];
const restAt = s => s.at || lastSeg(s).to;
const restYaw = s => (s.yaw != null ? s.yaw : s.path ? lastSeg(s).y1 || 0 : 0);
const prevOf = i => (i + STATIONS.length - 1) % STATIONS.length;
// the cat along a list of slides / arcs / lifts / waits, starting from the previous rest
function runPath(P, segs, A0, yaw0, k) {
  const tot = segs.reduce((t, g) => t + segW(g), 0);
  let acc = 0, A = A0, y0 = yaw0;
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i], len = segW(g) / tot;
    if (k <= acc + len || i === segs.length - 1) {
      const kk = clamp((k - acc) / len, 0, 1), o = { top: g.top, noTurn: g.noTurn, y0, y1: g.y1 || 0 };
      if (g.kind === 'wait') put(P.cat, A, y0);
      else if (g.kind === 'lift') lift(P.cat, A, g.to, kk, o);
      else if (g.kind === 'arc') slideOrbit(P.cat, g.a0, g.a1, kk, o);
      else slide(P.cat, A, g.to, kk, o);
      return;
    }
    acc += len;
    if (g.kind !== 'wait') { A = g.to; y0 = g.y1 || 0; }
  }
}
function applyStation(i, k) {
  const P = R.P, s = STATIONS[i], pv = STATIONS[prevOf(i)];
  for (const n of PREP_PROPS) {
    if (n === 'cat') continue;
    const a = pv.props.includes(n), b = s.props.includes(n);
    const win = (m, d) => (m && m[n]) || d;
    const sc = a && b ? 1 : b ? ease(seg(k, ...win(s.show, [0, 0.3]))) : a ? 1 - ease(seg(k, ...win(s.hide, [0, 0.3]))) : 0;
    P[n].root.scale.setScalar(Math.max(sc, 1e-4));
    P[n].root.visible = sc > 0.001;
  }
  if (pv.set) pv.set(P, 1);       // props leaving keep the previous station's pose while they shrink
  if (s.set) s.set(P, k);
  const kk = s.go ? seg(k, s.go[0], s.go[1]) : k;
  if (s.move) s.move(kk, P);
  else runPath(P, s.path, restAt(pv), restYaw(pv), kk);
}
const camK = k => easeSine(seg(k, CAM_EASE_FROM, CAM_EASE_TO));
function stationCam(i, k) {
  const a = STATIONS[prevOf(i)].cam || CAM_DIR, b = STATIONS[i].cam || CAM_DIR;
  return { dir: lerp3(a, b, camK(k)) };
}
const PREP_PAGE = { stations: STATIONS, props: PREP_PROPS };

// ---- pages 2-8: opposites ---------------------------------------------------------------
// pose(u): u = 0 is the first word of the pair (what the text names first),
// u = 1 the second. Tap plays forward; the next tap plays back.
const PAGES = [
  PREP_PAGE,
  { word: u => (u < 0.5 ? 'open' : 'closed'), say: 'The box lid and the little door are open, then swing shut.', props: ['box', 'door', 'cat'], T: 2.2,
    pose(u, P) {
      place(P.box.root, -0.78, 0); place(P.door.root, 0.8, 0, -0.25);
      lid(P, 1 - ease(seg(u, 0.1, 0.5))); doorOpen(P, 0.7 * (1 - ease(seg(u, 0.45, 0.85))));
      put(P.cat, [0, 0, 0.55], lerp(-0.45, 0.45, ease(seg(u, 0.3, 0.6))));    // watches one, then the other
    } },
  { word: u => (u < 0.5 ? 'tall' : 'short'), say: 'A tall tower and a short tower of wooden blocks; the cat slides from one to the other.', props: ['blocks', 'cat'], T: MOVE_T * 1.4,
    pose(u, P) {
      BLOCKS.forEach((b, i) => { const m = P.blocks.items[i]; m.position.set(b.tx, BLOCK / 2 + b.lvl * BLOCK, 0); m.rotation.set(0, 0, 0); });
      slide(P.cat, [-0.78, 0, 0.35], [0.72, 0, 0.35], u, { y0: 0.5, y1: -0.5 });
    } },
  { word: u => (u < 0.4 ? 'big' : 'small'), say: 'The big black cat stands tall; the small white kitten rocks.', props: ['cat', 'kitten'], T: 1.4,
    pose(u, P) {
      const st = Math.sin(Math.PI * seg(u, 0, 0.35));
      put(P.cat, [-0.35, 0, 0], 0.35, { sy: 1 + 0.08 * st, sx: 1 - 0.04 * st });
      const K = [0.38, 0, 0.25];
      const r = seg(u, 0.45, 0.9);        // a quick side-to-side rock on the table, no air time
      put(P.kitten, K, -0.35, { rz: 0.16 * Math.sin(2 * Math.PI * r) * (1 - r) });
    } },
  { word: u => (u < 0.5 ? 'full' : 'empty'), say: 'The basket is full of wooden balls; the cat tips it and it is empty.', props: ['box', 'basket', 'balls', 'cat'], T: 3.4,
    pose(u, P) {
      const bx = -0.4;
      place(P.box.root, bx, 0); lid(P, 1);
      const bk = P.basket.root;
      bk.position.set(BASKET.x - BASKET.r, 0, BASKET.z);
      bk.rotation.set(0, 0, BASKET.tip * (ease(seg(u, 0.06, 0.25)) - ease(seg(u, 0.8, 1))));
      bk.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      P.balls.items.forEach((m, i) => {
        const s0 = 0.22 + i * 0.03, k = seg(u, s0, s0 + 0.3), e = ease(k);
        v.set(...BALLS_IN_BASKET[i]); P.basket.inner.localToWorld(v);
        const A = [v.x, v.y, v.z], t = BALLS_IN_BOX[i], B = [bx + t[0], t[1], t[2]];
        const p = lerp3(A, B, e);
        p[1] += (OVER_WALL + 0.1 - (A[1] + B[1]) / 2) * Math.sin(Math.PI * e);
        m.position.set(p[0], p[1], p[2]); m.rotation.set(e * 5 + i, e * 3, 0);
      });
      // the cat turns to the basket, gives it a nudge, turns back
      const push = Math.sin(Math.PI * seg(u, 0.02, 0.3));
      put(P.cat, [1.32 - 0.06 * push, 0, 0.08], lerpAngle(0, -1.3, ease(seg(u, 0, 0.08)) - ease(seg(u, 0.85, 1))), { rz: 0.22 * push });
    } },
  { word: 'near / far', say: 'The kitten is near; the cat is far away.', props: ['kitten', 'cat'], T: 2.2,
    cam: u => { const k = ease(u); return { dir: lerp3(CAM_DIR, CAM_LOW, k), zoom: lerp(1, 0.78, k), toward: [0.35, 0.15, 1.0], shift: 0.35 * k }; },
    pose(u, P) { put(P.kitten, [0.35, 0, 1.0], -0.2); put(P.cat, [-0.45, 0, -1.6], 0.15); } },
  { word: u => (u < 0.4 ? 'asleep' : 'awake'), say: 'The cat is asleep, then wakes up, stretches and sits up.', props: ['cat'], T: 2.4,
    pose(u, P, time) {
      const st = ease(seg(u, 0.12, 0.45)), back = ease(seg(u, 0.5, 0.8));
      const breathe = u === 0 ? 0.012 * Math.sin(time * 2.2) : 0;
      const sy = lerp(lerp(0.84, 1.14, st), 1, back) + breathe, sx = lerp(lerp(1.08, 0.94, st), 1, back);
      const rx = lerp(lerp(0.12, -0.12, st), 0, back);
      const bounce = 0.04 * Math.sin(Math.PI * seg(u, 0.75, 0.95));
      put(P.cat, [0, bounce, 0], 0, { rx, sx, sy, awake: u >= 0.4 });
    } },
  { word: 'together', say: 'The cat and the kitten are together in the box. Goodnight.', props: ['box', 'cat', 'kitten'], T: 3.0,
    pose(u, P) {
      lid(P, lerp(1, 0.55, ease(seg(u, 0, 0.4))));
      const k = seg(u, 0.4, 1), a = 0.06 * Math.sin(k * Math.PI * 4) * (1 - k);
      // rock the box on its bottom edges, the two cats inside with it
      const px = a > 0 ? -BOX.w / 2 : BOX.w / 2, c = Math.cos(a), s = Math.sin(a);
      const rot = (x, y) => [px + (x - px) * c - y * s, (x - px) * s + y * c];
      const b = rot(0, 0); P.box.root.position.set(b[0], b[1], 0); P.box.root.rotation.set(0, 0, a);
      const cp = rot(-0.2, IN_Y), kp = rot(0.3, IN_Y + 0.18);
      put(P.cat, [cp[0], cp[1], 0], 0.25, { rz: a });
      put(P.kitten, [kp[0], kp[1], 0.08], -0.3, { rz: a });
    } }
];

// ---- the room behind the table -------------------------------------------------------------
// A soft, out-of-focus photo backdrop: warm wall, window light from the left
// (same side as the key light), a blurred plant on the right, the room in
// shadow below the table edge, a vignette. Drawn tiny and scaled up, so the
// smoothing does the blur for free. No fog.
function roomBackground() {
  const s = document.createElement('canvas'); s.width = 64; s.height = 40;
  const g = s.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, '#f1dcbc'); gr.addColorStop(0.45, '#d8bb94'); gr.addColorStop(1, '#a58463');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 40);
  g.fillStyle = 'rgba(255,250,236,0.9)'; g.fillRect(4, 3, 16, 21);            // window panes
  g.fillStyle = 'rgba(170,138,104,0.6)';
  g.fillRect(11.4, 3, 1.4, 21); g.fillRect(4, 12.6, 16, 1.4);                  // mullions
  g.fillRect(3, 2, 18, 1.2); g.fillRect(3, 23.6, 18, 1.4);                     // frame top, sill
  gr = g.createRadialGradient(13, 14, 2, 13, 18, 42);                           // light spilling into the room
  gr.addColorStop(0, 'rgba(255,240,205,0.55)'); gr.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 40);
  g.fillStyle = 'rgba(176,112,72,0.85)'; g.fillRect(50, 21, 6, 6);              // plant pot
  for (const [x, y, r, c] of [[53, 16, 4.5, '#56704a'], [49.5, 18, 3.2, '#4a6340'], [56.5, 17.5, 3.4, '#61794f'], [53, 12.5, 3, '#6a8456']]) {
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  gr = g.createLinearGradient(0, 0, 0, 40);                                     // room in shadow below
  gr.addColorStop(0, 'rgba(70,44,24,0.08)'); gr.addColorStop(0.55, 'rgba(70,44,24,0)'); gr.addColorStop(1, 'rgba(60,36,20,0.55)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 40);

  const W = 1024, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(s, 0, 0, W, H);
  gr = x.createRadialGradient(W * 0.45, H * 0.45, H * 0.3, W * 0.5, H * 0.5, W * 0.7);   // vignette
  gr.addColorStop(0, 'rgba(40,24,12,0)'); gr.addColorStop(1, 'rgba(40,24,12,0.45)');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H), d = img.data;                          // a little film grain
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- scene ------------------------------------------------------------------------------
let R = null;
function setup() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = LIGHT.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.setAttribute('role', 'img');
  el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;border-radius:3%';
  // soft lens vignette over the picture (cheap CSS, no post-processing)
  const vig = document.createElement('div');
  vig.setAttribute('aria-hidden', 'true');
  vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;border-radius:3%;' +
    'background:radial-gradient(ellipse at 50% 48%, rgba(40,24,12,0) 58%, rgba(40,24,12,0.28) 100%)';

  const scene = new THREE.Scene();
  scene.background = roomBackground();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = LIGHT.env;

  const key = new THREE.DirectionalLight(LIGHT.keyColor, LIGHT.key);
  key.position.set(...LIGHT.keyPos);
  key.castShadow = true;
  key.shadow.mapSize.set(Q.shadow, Q.shadow);
  Object.assign(key.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 14 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015; key.shadow.radius = 3;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x8a6a48, LIGHT.hemi));

  const W = { oak: woodTextures(WOOD.oak), pine: woodTextures(WOOD.pine), beech: woodTextures(WOOD.beech) };
  // the table top: ends a little way behind the toys, so its back edge recedes against the room
  const TOP_BACK = -2.6, TOP_FRONT = 6, TOP_W = 12, TOP_D = TOP_FRONT - TOP_BACK;
  const top = texFor(W.oak, 3 * TOP_W / 10, 1.2 * TOP_D / 10, 0, 0);
  const floorMat = woodMat(top, { roughness: 0.62, clearcoat: 0.12, bumpScale: 0.8 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(TOP_W, TOP_D), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.z = (TOP_FRONT + TOP_BACK) / 2; floor.receiveShadow = true;
  scene.add(floor);
  const edge = new THREE.Mesh(new RBox(TOP_W, 0.06, 0.05, 2, 0.02), floorMat);     // rounded back edge catches the light
  edge.position.set(0, -0.03, TOP_BACK); scene.add(edge);

  const P = {
    box: buildBox(W), table: buildTable(W), door: buildDoor(W), ramp: buildRamp(W),
    blocks: buildBlocks(W), basket: buildBasket(W), balls: buildBalls(W), ball: buildBall(W),
    kitten: buildCat(W, { paint: KITTEN_PAINT, face: KITTEN_FACE, collar: KITTEN_COLLAR, tag: false, scale: KITTEN_S }),
    cat: buildCat(W, { paint: CAT_PAINT, face: FACE_PAINT, collar: COLLAR_PAINT, tag: true, scale: CAT_S })
  };
  for (const k in P) scene.add(P[k].root);

  // soft contact darkening under the pieces that stand on the table (fades with the prop's grow / shrink)
  const blobTex = blobTexture();
  const blob = (w, d, get, root) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; scene.add(m);
    return { m, get, root };
  };
  const wp = new THREE.Vector3();
  const at = o => { o.getWorldPosition(wp); return [wp.x, wp.y, wp.z]; };
  const blobs = [
    blob(BOX.w * 1.35, BOX.d * 1.5, () => at(P.box.root), P.box.root),
    blob(0.6, 0.6, () => at(P.cat.root), P.cat.root),
    blob(0.6 * KITTEN_S, 0.6 * KITTEN_S, () => at(P.kitten.root), P.kitten.root),
    blob(0.26, 0.26, () => at(P.ball.root).map((v, i) => (i === 1 ? v - BIG_BALL_R : v)), P.ball.root),
    blob(BASKET.r * 2.6, BASKET.r * 2.6, () => at(P.basket.inner), P.basket.root),
    blob(DOOR.w + 0.4, 0.45, () => at(P.door.root), P.door.root),
    blob(TABLE.w * 1.4, TABLE.d * 1.5, () => at(P.table.root), P.table.root)
  ];

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
  const label = document.createElement('div');
  label.setAttribute('aria-live', 'polite');
  label.style.cssText = 'position:absolute;left:50%;bottom:5%;transform:translateX(-50%);padding:0.15em 0.6em;' +
    'font:700 clamp(18px,5.5cqw,44px)/1.2 Georgia,serif;color:#c8231e;background:rgba(246,236,218,0.86);' +
    'border-radius:0.35em;box-shadow:0 2px 6px rgba(60,40,20,0.25);pointer-events:none;white-space:nowrap';
  R = { renderer, scene, camera, key, P, blobs, label, vig, el, fit: new THREE.Box3() };
}

// every prop back to its rest transform; then only the page's props are shown
function reset(page) {
  const P = R.P;
  for (const k in P) { P[k].root.visible = page.props.includes(k); P[k].root.scale.setScalar(1); }
  place(P.box.root, 0, 0); lid(P, 0);
  place(P.table.root, TABLE.x, 0);
  place(P.door.root, 0, 0); doorOpen(P, 0);
  place(P.ramp.root, 0, 0);
  place(P.basket.root, BASKET.x - BASKET.r, BASKET.z);
  P.ball.root.position.set(0, BIG_BALL_R, 0); P.ball.root.quaternion.identity();
  put(P.cat, [0, 0, 0]); put(P.kitten, [0.6, 0, 0.4]);
}
// u: the page's tap progress; on page 1, u is the move progress into station st
function applyPose(page, u, time, st) {
  reset(page);
  if (page.stations) applyStation(st, u);
  else page.pose(u, R.P, time || 0);
  R.scene.updateMatrixWorld(true);
  for (const b of R.blobs) {
    const on = b.root.visible;
    b.m.visible = on;
    if (!on) continue;
    const [x, y, z] = b.get();
    b.m.position.set(x, 0.002, z);
    b.m.material.opacity = clamp(1 - y / 0.5, 0, 1) * clamp(b.root.scale.x, 0, 1);
  }
}
// the area the camera must keep in view: every shown prop over the whole tap action
// (page 1: one set per station at rest; render() eases between them during a move)
// Result: R.fits[i] = { pts, box }, the corners of the actual bounding boxes (per prop, and the
// cats per sampled pose, so their whole path doesn't become one loose box);
// render() projects them and fits the camera.
const ACTORS = ['cat', 'kitten'];
function computeFit(page) {
  const props = {}, pts = [], b = new THREE.Box3();
  const addCorners = bx => {
    if (bx.isEmpty()) return;
    const y0 = Math.max(bx.min.y, 0);           // parts sunk out of sight (cat hiding in the box) don't count
    if (bx.max.y <= y0) return;
    for (let i = 0; i < 8; i++) pts.push(new THREE.Vector3(i & 1 ? bx.max.x : bx.min.x, i & 2 ? bx.max.y : y0, i & 4 ? bx.max.z : bx.min.z));
  };
  const grab = () => {
    for (const k of page.props) {
      const root = R.P[k].root;
      if (!root.visible || root.scale.x < 0.98) continue;       // props growing / shrinking count only at full size
      if (ACTORS.includes(k)) addCorners(b.makeEmpty().expandByObject(root));
      else (props[k] = props[k] || new THREE.Box3()).expandByObject(root);
    }
  };
  const finish = () => {
    for (const k in props) { addCorners(props[k]); delete props[k]; }
    const all = new THREE.Box3().setFromPoints(pts), c = all.getCenter(new THREE.Vector3());
    addCorners(b.setFromCenterAndSize(c, new THREE.Vector3(FIT_MIN * 2, FIT_MIN * 2, FIT_MIN * 2)));
    const set = { pts: pts.slice(), box: new THREE.Box3().setFromPoints(pts) };
    pts.length = 0;
    return set;
  };
  // page 1: one framing per station, at rest (its props at full size + the cat on its word)
  if (page.stations) R.fits = STATIONS.map((s, i) => { applyPose(page, 1, 0, i); grab(); return finish(); });
  else { for (const u of FIT_SAMPLES) { applyPose(page, u, 0); grab(); } R.fits = [finish()]; }
  R.fitPts = R.fits[0].pts; R.fit.copy(R.fits[0].box);
  fitShadow();
}
// keep the key light's shadow camera around everything this page frames (no clipped shadow edges)
function fitShadow() {
  const key = R.key, sc = key.shadow.camera, all = new THREE.Box3();
  for (const f of R.fits) all.union(f.box);
  all.min.y = 0;
  all.expandByScalar(SHADOW_PAD);
  sc.position.copy(key.position); sc.lookAt(key.target.position); sc.updateMatrixWorld(true);
  const inv = sc.matrixWorldInverse, p = new THREE.Vector3(), lb = new THREE.Box3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? all.max.x : all.min.x, i & 2 ? all.max.y : all.min.y, i & 4 ? all.max.z : all.min.z).applyMatrix4(inv);
    lb.expandByPoint(p);
  }
  Object.assign(sc, { left: lb.min.x, right: lb.max.x, bottom: lb.min.y, top: lb.max.y, near: Math.max(0.1, -lb.max.z - 1), far: -lb.min.z + 1 });
  sc.updateProjectionMatrix();
}

// ---- state + animation -----------------------------------------------------------
// page 1: S.st = station, S.k = move progress (1 = resting on its word).
// Tap at rest: start the move to the next station (cycles); tap while moving: snap to the end.
// Other pages: S.u in [0, 1], S.dir = +1 / -1. Tap at rest: play towards the other end; tap while playing: snap.
let S = null;
const wordOf = (page, u) => (typeof page.word === 'function' ? page.word(u) : page.word);
const plain = html => html.replace(/<[^>]*>/g, '');
function tap() {
  const s = S; if (!s) return;
  if (s.page.stations) {
    if (s.run) { s.k = 1; s.run = false; }
    else { s.st = (s.st + 1) % STATIONS.length; s.k = 0; s.run = true; }
    return;
  }
  if (s.run) { s.u = s.dir > 0 ? 1 : 0; s.run = false; }
  else { s.dir = s.u >= 1 ? -1 : 1; s.run = true; }
}
// page 1's sentence lives in the engine's text page (bodyHtml wraps it in
// [data-wherecat-text]); update the shown copy, never the prerender copy
function setPrepText(i) {
  const html = (window.WHERECAT_PREP || [])[i];
  if (!html) return;
  document.querySelectorAll('[data-wherecat-text]').forEach(el => {
    // the attribute holds the station shown (attribute changes don't wake the childList observer)
    if (el.closest('.obj-prerender') || el.getAttribute('data-wherecat-text') === String(i)) return;
    el.setAttribute('data-wherecat-text', String(i));
    el.innerHTML = html;
  });
  R.el.setAttribute('aria-label', plain(html));
}
// Project R.fitPts from a camera looking along -dir and move it (sideways and
// in / out, direction unchanged) until their screen bounds fill the frame minus
// the margins. A few fixed-point passes converge despite the perspective.
const fv = { p: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() };
function fitView(dir, cam, f = R.fits[0]) {
  const pts = f.pts, look = f.box.getCenter(new THREE.Vector3());
  const tv = Math.tan(FOV * Math.PI / 360), th = tv * cam.aspect;
  const xHalf = 1 - FIT_MARGIN, yHalf = (2 - FIT_MARGIN - FIT_MARGIN_BOTTOM) / 2, yMid = (FIT_MARGIN_BOTTOM - FIT_MARGIN) / 2;
  let dist = f.box.getSize(fv.p).length() / (2 * tv) + 1;
  for (let it = 0; it < FIT_ITER; it++) {
    cam.position.copy(look).addScaledVector(dir, dist); cam.lookAt(look); cam.updateMatrixWorld(true);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, behind = false;
    for (const q of pts) {
      const p = fv.p.copy(q).applyMatrix4(cam.matrixWorldInverse);
      if (p.z > -0.05) { behind = true; break; }
      const nx = p.x / (-p.z * th), ny = p.y / (-p.z * tv);
      if (nx < x0) x0 = nx; if (nx > x1) x1 = nx; if (ny < y0) y0 = ny; if (ny > y1) y1 = ny;
    }
    if (behind) { dist *= 2; continue; }
    fv.right.setFromMatrixColumn(cam.matrixWorld, 0); fv.up.setFromMatrixColumn(cam.matrixWorld, 1);
    look.addScaledVector(fv.right, (x0 + x1) / 2 * th * dist).addScaledVector(fv.up, ((y0 + y1) / 2 - yMid) * tv * dist);
    dist *= Math.max((x1 - x0) / 2 / xHalf, (y1 - y0) / 2 / yHalf);
  }
  return { look, dist };
}
function render() {
  const page = S.page, cam = R.camera;
  const c = S.svg.parentNode, w = c.clientWidth || 300, h = c.clientHeight || 300;
  R.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.dpr));
  R.renderer.setSize(w, h, false);
  cam.aspect = w / h; cam.updateProjectionMatrix();
  const v = page.stations ? stationCam(S.st, S.k) : page.cam ? page.cam(S.u) : {};
  const dir = new THREE.Vector3(...(v.dir || CAM_DIR)).normalize();
  let look, dist;
  if (page.stations) {
    // fit the previous and this station (each from its own view direction), then ease between them
    const i0 = prevOf(S.st), k = camK(S.k);
    const dA = new THREE.Vector3(...(STATIONS[i0].cam || CAM_DIR)).normalize();
    const dB = new THREE.Vector3(...(STATIONS[S.st].cam || CAM_DIR)).normalize();
    const A = fitView(dA, cam, R.fits[i0]), B = k > 0 ? fitView(dB, cam, R.fits[S.st]) : A;
    look = A.look.clone().lerp(B.look, k); dist = lerp(A.dist, B.dist, k);
  } else ({ look, dist } = fitView(dir, cam));
  if (v.toward) look.lerp(new THREE.Vector3(...v.toward), v.shift || 0);
  cam.position.copy(look).addScaledVector(dir, dist * (v.zoom || 1));
  cam.lookAt(look);
  R.renderer.render(R.scene, cam);
}
function update(dt, time) {
  const s = S;
  let word;
  if (s.page.stations) {
    if (s.run) { s.k = Math.min(1, s.k + dt / STATIONS[s.st].T); if (s.k >= 1) s.run = false; }
    applyPose(s.page, s.k, time, s.st);
    const shownSt = s.k >= 0.5 ? s.st : prevOf(s.st);     // word and sentence switch halfway through the move
    if (shownSt !== s.textSt) { s.textSt = shownSt; setPrepText(shownSt); }
    word = STATIONS[shownSt].word;
  } else {
    if (s.run) { s.u = clamp(s.u + s.dir * dt / s.page.T, 0, 1); if (s.u <= 0 || s.u >= 1) s.run = false; }
    applyPose(s.page, s.u, time);
    word = wordOf(s.page, s.u);
  }
  if (R.label.textContent !== word) R.label.textContent = word;
}

function mount(svg) {
  if (TIER < 0) return;
  if (!R) setup();
  const page = PAGES[clamp(parseInt(svg.getAttribute('data-wherecat'), 10) || 0, 0, PAGES.length - 1)];
  const layer = svg.parentNode;
  if (getComputedStyle(layer).position === 'static') layer.style.position = 'relative';
  layer.style.containerType = 'inline-size';
  layer.appendChild(R.el); layer.appendChild(R.vig); layer.appendChild(R.label);
  computeFit(page);
  // every page opens resting on its first word (page 1: station 0 fully arrived)
  S = { svg, page, u: 0, dir: 1, run: false, st: 0, k: 1, textSt: -1 };
  if (!page.stations) R.el.setAttribute('aria-label', page.say);
  update(0, performance.now() / 1000); render();
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!S || document.hidden) return;
  if (!S.svg.isConnected) { S = null; return; }
  update(dt, now / 1000); render();
}
requestAnimationFrame(loop);

// mount on the page that is shown, never on the next-page prerender copy
const shown = () => [...document.querySelectorAll('.obj-host .layer > svg[data-wherecat]')].find(x => !x.closest('.obj-prerender'));
new MutationObserver(() => {
  const svg = shown();
  if (svg && (!S || S.svg !== svg)) mount(svg);
  // the text page may be laid out after the picture: keep page 1's sentence in step
  else if (S && S.page.stations && S.textSt >= 0) setPrepText(S.textSt);
}).observe(document.documentElement, { childList: true, subtree: true });

function hostOf(t) {
  const h = t && t.closest ? t.closest('.obj-host') : null;
  return h && !h.closest('.obj-prerender') && S && h.contains(S.svg) ? h : null;
}
window.addEventListener('picture-activate', e => { if (hostOf(e.target)) tap(); });
window.addEventListener('pointerdown', e => { if (hostOf(e.target)) tap(); }, true);
window.addEventListener('pagehide', () => { if (R) { try { R.renderer.dispose(); R.renderer.forceContextLoss(); } catch (e) { /* leaving */ } } });

window.WHERECAT_PAGE_COUNT = PAGES.length;
window.buildWhereCat = function (i) {
  return '<svg data-wherecat="' + (i | 0) + '" viewBox="0 0 300 300" data-fit="0 0 300 300" data-hit="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="none"/></svg>';
};
})();
