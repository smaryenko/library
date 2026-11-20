// NUMBER CUBE LAND: one continuous three.js world (kind 'numberland'),
// laid out left to right. Page i = stop i at x = i * GAP, each with its own
// scenery. The puzzle is answered in the minigame panel; the world shows the
// situation (built from the same seeded task data, see tasks.js) and plays
// the RESULT when 'minigame-solved' arrives for the current stop. A stop
// entered already solved is posed in its solved state.
// Everything shown is a pure function of: sec (current stop), res (0..1 the
// result of the current stop), trav (walking to another stop, 0..1) and
// each stop's solved flag. pose() writes all transforms from those.
// The walking party: One, then Two and Three (from the river), then Six
// (from the low door). Friends met elsewhere wave and stay.
(function () {
'use strict';
const WS = window.WEBGL_STAGE;
if (!WS || !WS.THREE) return;
const THREE = WS.THREE, TIER = WS.TIER;
const NF = window.NUMBER_FRIENDS;
const RBox = THREE.RoundedBoxGeometry;
const LEG = NF.LEG;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const easeBack = t => { const c = 1.70158, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const sub = (k, a, b) => clamp((k - a) / (b - a), 0, 1);
const arc = k => Math.sin(Math.PI * clamp(k, 0, 1));
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- tune by eye -------------------------------------------------------------------
const N = 14, GAP = 26, X = i => i * GAP;
const SP = 1.5;                         // spacing in the walking line
const CAM_FOV = 30, CAM_PITCH = 0.2;
const COL = {
  grass: '#93d56a', hills: ['#a9de7c', '#86cc5e', '#9bd870', '#76bf52'], trunk: '#9a6a3e',
  crown: ['#4fae47', '#3f9c3c', '#5dbb52'], water: '#4fb8ee', bed: '#2f86c4', path: '#eadcae',
  skyTop: '#8fd1f6', skyLow: '#e6f6ff', fog: '#e3f3fb', hedge: '#4fae47', hedgeD: '#2f6d2a',
  wood: '#c98b4c', woodD: '#8a5a2e', stone: '#d9d2c4', sand: '#f0e2b6', soil: '#7a5232', rock: '#9c98ae'
};
const RAIN = NF.RAINBOW;
const PARTY = i => (i <= 1 ? [1] : i === 2 ? [1, 2, 3] : [1, 2, 3, 6]);

// ---- small helpers -------------------------------------------------------------------
const std = (color, roughness = 0.85, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness, metalness: 0 }, extra || {}));
function skyTex() {
  const c = WS.canvas(4, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, COL.skyTop); g.addColorStop(0.75, COL.skyLow); g.addColorStop(1, COL.skyLow);
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  return WS.texture(c);
}
function textCanvas(lines, w, h, { bg = null, color = '#3a2a1c', size = 60, round = 0 } = {}) {
  const c = WS.canvas(w, h), x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; if (round) { x.beginPath(); x.roundRect ? x.roundRect(0, 0, w, h, round) : x.rect(0, 0, w, h); x.fill(); } else x.fillRect(0, 0, w, h); }
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold ${size}px "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif`;
  lines.forEach((s, k) => x.fillText(s, w / 2, h / 2 + (k - (lines.length - 1) / 2) * size * 1.1));
  return c;
}
// a route: points {x, z, y?, hop?}; position at a distance along it.
// Before the start / past the end it carries on along x (the walking line).
function mkRoute(pts) {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  return { pts, len, L: len[len.length - 1] };
}
const straight = (a, b) => mkRoute([{ x: a, z: 0 }, { x: b, z: 0 }]);
function at(r, s, o) {
  const p = r.pts, L = r.L;
  if (p.length < 2 || s <= 0) { o.x = p[0].x + Math.min(0, s); o.z = p[0].z; o.y = p[0].y || 0; o.dx = 1; o.dz = 0; return o; }
  if (s >= L) { const q = p[p.length - 1]; o.x = q.x + (s - L); o.z = q.z; o.y = q.y || 0; o.dx = 1; o.dz = 0; return o; }
  let j = 0;
  while (j < p.length - 2 && r.len[j + 1] <= s) j++;
  const a = p[j], b = p[j + 1], seg = r.len[j + 1] - r.len[j] || 1, u = (s - r.len[j]) / seg;
  o.x = lerp(a.x, b.x, u); o.z = lerp(a.z, b.z, u);
  o.y = lerp(a.y || 0, b.y || 0, u) + (b.hop ? arc(u) * 0.6 : 0);
  o.dx = (b.x - a.x) / seg; o.dz = (b.z - a.z) / seg;
  return o;
}

// the puzzle data of stop i, exactly as the panel built it (same seed)
function specFor(i) {
  const P = window.BOOK_PAGES || [], p = P[i], MG = window.MINIGAME;
  if (!p || typeof p.task !== 'function') return { seed: 0, data: {} };
  const id = p.id || ('p' + i);
  const st = MG && MG.state ? MG.state() : { seeds: {}, solved: {} };
  const book = window.MINIGAME_BOOK || ((location.pathname.match(/books\/([^/]+)\//) || [])[1]) || 'book';
  const seed = st.seeds && st.seeds[id] != null ? st.seeds[id] : (MG && MG.hash ? MG.hash(book + ':' + id) % 100000 : 1);
  const ctx = { rng: MG && MG.rng ? MG.rng(seed) : rng(seed), seed, level: i / Math.max(1, P.length - 1), flags: {}, solved: !!(st.solved && st.solved[id]) };
  let spec = null;
  try { spec = p.task(seed, ctx); } catch (e) { spec = null; }
  let data = (spec && spec.data) || {};
  // a pick task: show the friends the child picked, not the textbook answer
  const picked = MG && MG.picked ? MG.picked(id) : null;
  if (picked && Array.isArray(data.answer)) data = Object.assign({}, data, { answer: picked });
  return { seed, data, key: seed + (picked ? ':' + picked.join(',') : '') };
}
function isSolved(i) {
  const p = (window.BOOK_PAGES || [])[i], MG = window.MINIGAME;
  if (!p || !p.task) return true;
  return !!(MG && MG.isSolved && MG.isSolved(p.id || ('p' + i)));
}

// ---- the world ------------------------------------------------------------------------------
function makeWorld(renderer) {
  const scene = new THREE.Scene();
  scene.background = skyTex();
  scene.fog = new THREE.Fog(COL.fog, 40, 140);
  scene.environment = WS.env(renderer);
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.5, 500);

  scene.add(new THREE.HemisphereLight('#eef8ff', '#8cc466', 1.35));
  const sun = new THREE.DirectionalLight('#fff6e6', 1.5);
  sun.castShadow = TIER > 0;
  sun.shadow.mapSize.set(TIER > 1 ? 2048 : 1024, TIER > 1 ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 16, bottom: -16, near: 2, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 6;
  scene.add(sun, sun.target);
  const shadowy = (o, cast = true) => { o.traverse(m => { if (m.isMesh) { m.castShadow = cast && TIER > 0; m.receiveShadow = true; } }); return o; };
  const add = (o, cast = true) => { scene.add(shadowy(o, cast)); return o; };
  const mesh = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return add(m, cast); };
  const mk = (n, opts) => { const F = NF.friend(n, opts); F.g.visible = false; scene.add(F.g); return F; };
  const drop = F => { if (!F) return; scene.remove(F.g); F.face.material.dispose(); };

  // ---- ground: grass with one real gap (the river at stop 1) ----
  const grassM = std(COL.grass, 0.95);
  const RL = X(1) - 3, RW = 6.5;          // river: left bank edge, widest gap
  const land = (x0, x1) => mesh(new RBox(x1 - x0, 3, 120, 2, 0.3), grassM, (x0 + x1) / 2, -1.5, -20, false);
  land(-60, RL); land(RL + RW, X(N - 1) + 60);
  const bank = mesh(new RBox(1, 3, 120, 2, 0.3), grassM, RL + RW, -1.5, -20, false);   // the near side of the far bank (moves with the gap)
  mesh(new THREE.BoxGeometry(RW + 0.2, 1, 120), std(COL.bed, 0.6), RL + RW / 2, -2.6, -20, false);
  const water = std(COL.water, 0.12, { transparent: true, opacity: 0.9 });
  mesh(new THREE.PlaneGeometry(RW + 0.2, 120).rotateX(-Math.PI / 2), water, RL + RW / 2, -0.8, -20, false);
  // the sandy path
  const pathM = std(COL.path, 0.95);
  const pathStrip = (x0, x1) => mesh(new THREE.PlaneGeometry(x1 - x0, 1.6).rotateX(-Math.PI / 2), pathM, (x0 + x1) / 2, 0.012, 0, false);
  pathStrip(-14, RL - 0.25); pathStrip(RL + RW + 0.25, X(N - 1) + 14);

  // ---- scenery along the whole land (instanced) ----
  const R = rng(9), pick = a => a[Math.floor(R() * a.length)];
  const KEEP = [[X(8), 6], [X(9), 7], [X(13), 8], [X(1), 4.5], [X(11), 5]];      // no trees in front of these
  const freeAt = (x, w) => !KEEP.some(([kx, kw]) => Math.abs(x - kx) < kw + w);
  const dummy = new THREE.Object3D(), tint = new THREE.Color();
  function instanced(geo, mat, items, cast = true) {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    items.forEach((it, k) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.scale.set(it.s[0], it.s[1], it.s[2]);
      dummy.rotation.set(0, it.r || 0, 0);
      dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix);
      if (it.c) im.setColorAt(k, tint.set(it.c));
    });
    im.count = items.length;
    im.castShadow = cast && TIER > 0; im.receiveShadow = true; im.frustumCulled = false;
    scene.add(im);
    return im;
  }
  const hills = [], trunks = [], crowns = [], apples = [], bushes = [], petals = [], stems = [], clouds = [];
  for (let x = -50; x < X(N - 1) + 50; x += 7 + R() * 4) {
    const r = 9 + R() * 10;
    hills.push({ p: [x, -r * 0.12, -34 - R() * 16], s: [r, r * (0.42 + R() * 0.2), r], c: pick(COL.hills) });
  }
  for (let x = -16; x < X(N - 1) + 20; x += 2.6 + R() * 3) {
    if (x > RL - 1.5 && x < RL + RW + 1.5) continue;
    const z = -10 - R() * 7, s = 0.8 + R() * 0.45;
    if (!freeAt(x, 1) && z > -14) continue;
    trunks.push({ p: [x, 0.85 * s, z], s: [s, s, s] });
    crowns.push({ p: [x, 2.3 * s, z], s: [1.15 * s, 1.06 * s, 1.15 * s], c: pick(COL.crown) });
    for (let k = 0; k < 4; k++) {
      const a = R() * 6.283, b = 0.2 + R() * 0.9;
      apples.push({ p: [x + Math.cos(a) * Math.cos(b) * 1.12 * s, 2.3 * s + Math.sin(b) * s, z + Math.sin(a) * Math.cos(b) * 1.12 * s], s: [s, s, s] });
    }
  }
  for (let x = -12; x < X(N - 1) + 14; x += 3 + R() * 4) {
    if (x > RL - 1.2 && x < RL + RW + 1.2) continue;
    if (Array.from({ length: N }, (_, i) => X(i)).some(sx => Math.abs(x - sx) < 6.5)) continue;
    const r = 0.6 + R() * 0.3;
    bushes.push({ p: [x, 0.2, -2.4 - R() * 2], s: [r, r * 0.7, r], c: pick(COL.crown) });
  }
  const petalC = ['#ffffff', '#ffe25a', '#ff8fc0', '#c9a7ff'];
  for (let i = 0; i < 260; i++) {
    const x = -14 + R() * (X(N - 1) + 28);
    if (x > RL - 0.4 && x < RL + RW + 0.4) continue;
    const z = 2.4 + R() * 5;
    petals.push({ p: [x, 0.22, z], s: [1, 1, 1], c: pick(petalC) });
    stems.push({ p: [x, 0.11, z], s: [1, 1, 1] });
  }
  for (let x = -30; x < X(N - 1) + 30; x += 9 + R() * 5) {
    const cy = 10 + R() * 4, cz = -40 - R() * 8;
    for (let k = 0; k < 4; k++) { const r = 1.2 + R() * 0.8; clouds.push({ p: [x + k * 1.3 - 2, cy + R() * 0.6, cz + R() * 0.5], s: [r, r * 0.7, r] }); }
  }
  const white = std('#ffffff', 0.95);
  instanced(new THREE.SphereGeometry(1, 40, 20), white, hills, false);
  instanced(new THREE.CylinderGeometry(0.16, 0.22, 1.7, 12), std(COL.trunk, 0.9), trunks);
  instanced(new THREE.SphereGeometry(1, 28, 18), std('#ffffff', 0.9), crowns);
  instanced(new THREE.SphereGeometry(0.11, 10, 8), std('#e5323a', 0.5), apples, false);
  instanced(new THREE.SphereGeometry(1, 20, 12), std('#ffffff', 0.9), bushes);
  instanced(new THREE.SphereGeometry(0.09, 8, 6), std('#ffffff', 0.6), petals, false);
  instanced(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 5), std('#3f9c3c', 0.9), stems, false);
  instanced(new THREE.SphereGeometry(1, 20, 12), std('#ffffff', 1), clouds, false);

  // shared bits for the stops
  const cubeGeo = new RBox(1, 1, 1, 3, 0.07);
  const smallCube = new RBox(0.45, 0.45, 0.45, 2, 0.05);
  const woodM = std(COL.wood, 0.8), woodDM = std(COL.woodD, 0.85), stoneM = std(COL.stone, 0.9);
  const hedgeM = std(COL.hedge, 0.95), hedgeDM = std(COL.hedgeD, 1);
  const flowerGeo = new THREE.SphereGeometry(0.12, 10, 8), stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 5);
  const stemM = std('#3f9c3c', 0.9), petalM = petalC.map(c => std(c, 0.6));
  const party = { 1: mk(1), 2: mk(2), 3: mk(3), 6: mk(6) };

  // ---- pose helpers ----
  const P = { x: 0, y: 0, z: 0, dx: 1, dz: 0 };
  function standAt(F, x, z, mood, y = 0) { NF.rest(F); F.g.position.set(x, y, z); if (mood) NF.setMood(F, mood); }
  function walkTo(F, ax, az, bx, bz, u, mood) {
    NF.rest(F);
    const e = ease(u), x = lerp(ax, bx, e), z = lerp(az, bz, e), moving = u > 0 && u < 1;
    const b = NF.walk(F, (x + z) * 5.3, moving);
    F.g.position.set(x, b, z);
    if (moving) F.g.rotation.y = Math.atan2(bx - ax, bz - az) * 0.8;
    if (mood) NF.setMood(F, mood);
  }
  function hopTo(F, a, b, u, h = 1.2) {             // a, b: [x, y, z]
    const e = ease(u);
    F.g.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e) + arc(u) * h, lerp(a[2], b[2], e));
    const sq = u > 0 && u < 1 ? 1 - arc(u) * 0.08 : 1;
    F.g.scale.set(1 / Math.sqrt(sq), sq + (u > 0 && u < 1 ? 0.1 : 0), 1 / Math.sqrt(sq));
  }
  const popScale = (F, u) => { const s = u <= 0 ? 0.001 : u >= 1 ? 1 : Math.max(0.001, easeBack(u)); F.g.scale.set(s, s, s); };
  // the walking line: party friends `list` along route r, lead at distance s
  // `skip`: numbers the stop shows with its own copy right now (a party friend
  // who is also in the stop's puzzle steps out of the line, so no twin)
  function line(list, r, s, moving, dir, mood, skip = []) {
    for (const n of [1, 2, 3, 6]) party[n].g.visible = false;
    list.forEach((n, m) => {
      if (skip.includes(n)) return;
      const F = party[n];
      NF.rest(F);
      at(r, s - m * SP, P);
      const bounce = NF.walk(F, (s - m * SP) * 5.3, moving);
      F.g.position.set(P.x, P.y + bounce, P.z);
      if (moving) F.g.rotation.y = Math.atan2(P.dx * dir, P.dz * dir) * 0.8;
      NF.setMood(F, mood);
    });
  }
  const slot = (list, n) => list.indexOf(n);

  // ---- the stops ----
  const STOPS = [];
  function stop(o) {
    const i = STOPS.length, x = X(i);
    // defaults go onto the stop's own object: its closures (`st`) stay the stop
    const s = o(x, i);
    const def = { i, x, arr: x - 5.5, post: x + 7, cam: { hh: 4.2, y: 1.8 }, dur: 4.5, idle: false, seed: null,
      lead: k => ease(sub(k, 0.55, 1)), setup() {}, pose() {} };
    for (const key of Object.keys(def)) if (!(key in s)) s[key] = def[key];
    if (!s.route) s.route = straight(s.arr, s.post);
    STOPS.push(s);
    return s;
  }

  // 0 VALLEY: One dozes in the grass; tap: One wakes, stretches and hops ----------------------
  stop(x => {
    const zs = [0, 1].map(i => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: WS.texture(textCanvas(['z'], 128, 128, { color: '#5a7fb8', size: 100 })), transparent: true, depthWrite: false }));
      sp.scale.setScalar(0.45 - i * 0.1); scene.add(sp); return sp;
    });
    // a mossy nook, scattered gate cubes (the wind), a signpost to the gate
    const moss = mesh(new THREE.SphereGeometry(1.4, 24, 12), std('#7cc25a', 0.95), x, -0.95, -0.3, false); moss.scale.y = 0.75;
    const scatter = [[-4.2, 1.2, 0], [-2.8, -1.8, 3], [2.4, 1.6, 1], [5.6, -2.6, 5], [-6.4, -2.2, 4], [3.6, 2.4, 2], [7.4, 1.0, 6]];
    scatter.forEach(([dx, dz, c], k) => { const m = mesh(smallCube, std(RAIN[c], 0.4), x + dx, 0.2, dz); m.rotation.set(0.1 * k, k * 0.7, 0.2 * (k % 3)); });
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 10), woodDM, x + 3.4, 1.1, -1.6);
    const sign = mesh(new RBox(2.2, 0.7, 0.12, 2, 0.05), woodM, x + 3.4, 1.9, -1.55);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 0.6),
      new THREE.MeshStandardMaterial({ map: WS.texture(textCanvas(['Rainbow Gate \u2192'], 512, 150, { bg: '#f3d9a8', size: 62 })), roughness: 0.8 }));
    board.position.z = 0.065; sign.add(board);
    sign.rotation.y = -0.15;
    return {
      arr: x, post: x, route: mkRoute([{ x, z: 0 }]), dur: 2.2, idle: true, cam: { hh: 3.6, y: 1.4 },
      lead: () => 0,
      pose(k, cur, t) {
        const F = party[1], asleep = k < 0.2;
        zs.forEach((s, i) => {
          const q = (t * 0.45 + i * 0.5) % 1;
          s.visible = cur && asleep;
          s.position.set(x + 0.6 + q * 0.7, LEG + 1.2 + q * 1.1, 0.3);
          s.material.opacity = Math.sin(Math.PI * q) * (1 - sub(k, 0, 0.2));
        });
        if (!cur || k >= 1) return;
        const stretch = arc(sub(k, 0.2, 0.55)), hop = arc(sub(k, 0.55, 0.9));
        F.g.position.set(x, hop * 0.6, 0);
        F.g.rotation.set(0, 0, (1 - sub(k, 0, 0.25)) * 0.1);
        const breath = asleep ? Math.sin(t * 2.2) * 0.025 : 0;
        F.g.scale.set(1 - stretch * 0.08, 1 + stretch * 0.18 + breath, 1);
        F.arms[0].rotation.z = -(0.45 + stretch * 2.3); F.arms[1].rotation.z = 0.45 + stretch * 2.3;
        NF.setMood(F, k <= 0.02 ? 'sleep' : k < 0.3 ? 'surprised' : k < 0.92 ? 'joy' : 'happy');
      }
    };
  });

  // 1 RIVER: the chosen friends lie down in the gap, One crosses, all hop out -------------------
  stop(x => {
    const L = { 2: mk(2), 3: mk(3), 4: mk(4, { cols: 1 }), 5: mk(5) };   // Four stands tall here (a 4-cube plank)
    const home = v => [RL - 8.4 + (v - 2) * 1.6, -2.2];
    const reed = std('#5f9e3a', 0.9), cat = std('#7a4a26', 0.8);
    for (let k = 0; k < 14; k++) {
      const side = k % 2 ? RL - 0.3 - Math.random() * 0.5 : RL + RW + 0.3 + Math.random() * 0.5, z = -7 + k * 0.9 + (k > 6 ? 3 : 0);
      if (Math.abs(z) < 1.4) continue;
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5), reed, side, 0.55, z, false);
      mesh(new THREE.CapsuleGeometry(0.06, 0.18, 3, 6), cat, side, 1.1, z, false);
    }
    const pad = std('#5cbf4a', 0.8);
    for (const [dx, z] of [[1.2, 4], [3.6, 6.2], [4.6, -5], [2.0, -8]]) { const m = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 20), pad, RL + dx, -0.78, z, false); m.rotation.y = dx; }
    let gap = 3, ans = [3], m = 1;
    // once the friends have hopped out of the gap a plank bridge stays, so the
    // walk to and from a solved river never goes over the water
    const plank = mesh(new RBox(1, 0.18, 1.5, 2, 0.05), woodM, RL + 1.5, -0.05, 0);
    plank.visible = false;
    const st = {
      arr: RL - 3, post: RL + RW + 3, cam: { hh: 4.2, y: 1.6 },
      lead: k => ease(sub(k, 0.42, 0.78)),
      setup(d) {
        gap = clamp(d.gap || 3, 3, 6); ans = (d.answer && d.answer.length ? d.answer : [gap]).slice(); m = ans.length;
        const w = RW - gap + 0.6;
        bank.geometry.dispose(); bank.geometry = new RBox(w, 3, 120, 2, 0.3);
        bank.position.x = RL + gap + w / 2;
        st.dur = 2.4 + m * 1.2 + 2.6;
        plank.scale.x = gap + 0.6; plank.position.x = RL + gap / 2;
      },
      pose(k, cur, t, s) {
        const pk = sub(k, 0.78, 0.86);              // laid while the friends still lie in the gap
        plank.visible = pk > 0;
        plank.position.y = -0.05 - (1 - pk) * 0.6;
        const list = PARTY(2);
        for (const v of [2, 3, 4, 5]) {
          const F = L[v], [hx, hz] = home(v), joins = v === 2 || v === 3, bi = ans.indexOf(v);
          if (k >= 1 && joins) { F.g.visible = false; continue; }
          NF.rest(F);
          if (bi >= 0) {
            let a = RL; for (let j = 0; j < bi; j++) a += ans[j];
            const lie = [a - LEG, -0.5, 0];
            if (k < 0.8) {
              const u = sub(k, 0.4 * bi / m, 0.4 * (bi + 1) / m);
              if (u < 0.5) walkTo(F, hx, hz, RL - 0.7, 0, u / 0.5, u > 0.3 ? 'brave' : 'happy');
              else {
                const p = (u - 0.5) / 0.5, e = ease(p);
                F.g.position.set(lerp(RL - 0.7, lie[0], e), lerp(0, lie[1], e) + arc(p) * 0.5, 0);
                F.g.rotation.z = -Math.PI / 2 * e;
                NF.tuck(F, 1 - p, 1);
                F.num.visible = p < 0.5;
                NF.setMood(F, p < 1 ? 'brave' : 'joy');
              }
            } else {
              const h = sub(k, 0.8, 0.97), e = ease(h);
              const to = joins ? [s.post - slot(list, v) * SP, 0, 0] : [RL + gap + 1.6 + (v - 4) * 1.6, 0, -2.2];
              F.g.position.set(lerp(lie[0], to[0], e), lerp(lie[1], to[1], e) + arc(h) * 1.4, lerp(0, to[2], e));
              F.g.rotation.z = -Math.PI / 2 * (1 - e);
              NF.tuck(F, h, 1);
              F.num.visible = h > 0.6;
              NF.setMood(F, h < 1 ? 'joy' : 'happy');
              if (!joins && h >= 1) NF.wave(F, t, arc(sub(k, 0.97, 1)));
            }
          } else if (joins) {
            // not in the bridge: falls in behind One and crosses too
            const b = ease(sub(k, 0.3, 0.42)), lead = st.lead(k) * st.route.L;
            at(st.route, lead - slot(list, v) * SP, P);
            const x0 = lerp(hx, P.x, b), z0 = lerp(hz, P.z, b), moving = k > 0.3 && k < 0.78;
            const bo = NF.walk(F, (x0 + z0) * 5.3, moving);
            F.g.position.set(x0, bo, z0);
            if (moving) F.g.rotation.y = Math.PI / 2 * 0.8;
            NF.setMood(F, k > 0.4 && k < 0.98 ? 'joy' : 'happy');
          } else {
            standAt(F, hx, hz, k > 0.85 && k < 1 ? 'joy' : 'happy');
            if (k > 0.85) NF.wave(F, t, arc(sub(k, 0.85, 1)));
          }
        }
        if (cur && k > 0 && k < 1) NF.setMood(party[1], k < 0.42 ? 'look-up' : 'joy');
      }
    };
    return st;
  });

  // 2 LOW DOOR: Six splits, both parts walk under the door and join again -------------------------
  stop(x => {
    const six = mk(6, { cols: 1 });           // stretched up tall; she goes back to her 2 x 3 after the door
    let A = null, B = null, H = 3, a = 3, b = 3;
    const topM = hedgeM;
    const top = mesh(new RBox(1.3, 1, 2.9, 2, 0.12), topM, x, 5, 0);
    mesh(new RBox(1.3, 7.6, 6.2, 2, 0.2), hedgeM, x, 3.8, -4.5);            // the hedge going back
    const hole = mesh(new THREE.PlaneGeometry(1.3, 1), hedgeDM, x, 0.5, -1.39, false);
    const beam = mesh(new THREE.BoxGeometry(1.42, 0.2, 3.0), woodM, x, 3, 0);
    for (const dz of [-1.4, 1.4]) mesh(new THREE.BoxGeometry(0.18, 1, 0.18), woodDM, x - 0.66, 0.5, dz);
    const posts = scene.children.slice(-2);
    const st = {
      arr: x - 5.5, post: x + 7, dur: 6.5, cam: { hh: 4.8, y: 2.8 },
      lead: k => ease(sub(k, 0.55, 0.95)),
      setup(d) {
        H = d.H || 3; a = d.a || 3; b = d.b || 3;
        drop(A); drop(B); A = mk(a, { cols: 1 }); B = mk(b, { cols: 1 });
        const hw = H + LEG + 0.12, ht = 7.6 - hw;
        top.geometry.dispose(); top.geometry = new RBox(1.3, ht, 2.9, 2, 0.12);
        top.position.y = hw + ht / 2;
        beam.position.y = hw + 0.1;
        hole.scale.y = hw; hole.position.y = hw / 2;
        posts.forEach(p => { p.scale.y = hw; p.position.y = hw / 2; });
      },
      pose(k, cur, t) {
        A.g.visible = B.g.visible = false;
        if (k >= 1) { six.g.visible = false; return; }
        const sx = x - 1.6, ex = x + 2.5;
        if (k < 0.2) {                                 // Six walks up to the door, too tall
          NF.place(six, { cols: 1 });
          walkTo(six, x - 2.6, -1.8, sx, 0, sub(k, 0, 0.12), k < 0.08 ? 'sad' : 'think');
          const sq = arc(sub(k, 0.14, 0.2));
          six.g.scale.set(1 + sq * 0.1, 1 - sq * 0.15, 1 + sq * 0.1);
        } else if (k < 0.6) {                          // two parts
          six.g.visible = false;
          const pop = sub(k, 0.2, 0.26), w = sub(k, 0.26, 0.5), mg = sub(k, 0.5, 0.6);
          for (const [F, off] of [[A, -0.6], [B, 0.6]]) {
            if (w < 1) walkTo(F, sx + off, 0, ex + off + 0.8, 0, w, 'joy');
            else { NF.rest(F); hopTo(F, [ex + off + 0.8, 0, 0], [ex, 0, 0], mg, 0.9); NF.setMood(F, 'joy'); }
            if (pop < 1) popScale(F, pop);
          }
          if (mg >= 1) A.g.visible = B.g.visible = false;
        } else {                                       // one again; steps aside while the others pass
          NF.rest(six);
          const back = ease(sub(k, 0.62, 0.72)) * (1 - ease(sub(k, 0.92, 1)));
          six.g.position.set(ex, 0, -1.4 * back);
          NF.morph(six, { cols: 1 }, { cols: 2 }, sub(k, 0.66, 0.82));
          popScale(six, sub(k, 0.6, 0.68));
          NF.setMood(six, k < 0.95 ? 'joy' : 'happy');
          if (k > 0.7 && k < 0.92) NF.wave(six, t, arc(sub(k, 0.7, 0.92)));
        }
      }
    };
    st.pose0 = st.pose;
    st.pose = (k, cur, t) => {
      if (k <= 0) { NF.place(six, { cols: 1 }); standAt(six, x - 2.6, -1.8, 'sad'); A.g.visible = B.g.visible = false; return; }
      st.pose0(k, cur, t);
    };
    return st;
  });

  // 3 SHADOW WALL: the friend behind the sheet steps out ---------------------------------------
  stop(x => {
    let F = null, n = 4;
    for (const dx of [-2.2, 2.2]) mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.6, 10), woodDM, x + dx, 2.8, -1.6);
    mesh(new THREE.BoxGeometry(4.6, 0.12, 0.12), woodDM, x, 5.5, -1.6);
    const sheet = mesh(new THREE.PlaneGeometry(4.2, 4.8), std('#fffaf0', 0.95, { side: THREE.DoubleSide }), x, 2.95, -1.62);
    sheet.material.emissive = new THREE.Color('#fff1c8'); sheet.material.emissiveIntensity = 0.25;
    const shadowM = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
    const shadow = mesh(new THREE.PlaneGeometry(4.0, 4.6), shadowM, x, 2.9, -1.58, false);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), woodDM, x, 1.2, -4.6);
    const lamp = mesh(new THREE.SphereGeometry(0.4, 20, 12), new THREE.MeshBasicMaterial({ color: '#fff2b0' }), x, 2.6, -4.6, false);
    lamp.castShadow = false;
    const st = {
      dur: 4.2, cam: { hh: 4.8, y: 2.8 },
      lead: k => ease(sub(k, 0.45, 1)),
      shows: k => (k > 0 ? [n] : []),
      setup(d) {
        n = d.n || 4;
        drop(F); F = mk(n);
        if (shadowM.map) shadowM.map.dispose();
        shadowM.map = WS.texture(NF.shadowCanvas(n, 256, 296)); shadowM.needsUpdate = true;
      },
      pose(k, cur, t) {
        const wig = Math.sin(sub(k, 0, 0.12) * Math.PI * 4) * 0.08;
        const out = sub(k, 0.12, 0.4);
        shadow.position.x = x + wig + out * 1.6;
        shadowM.opacity = 1 - out;
        shadow.visible = out < 1;
        if (k <= 0) { F.g.visible = false; return; }
        walkTo(F, x + 0.3, -3.2, x + 3.4, -1.0, out, out < 1 ? 'surprised' : 'joy');
        const j = sub(k, 0.4, 0.55);
        if (j > 0 && j < 1) { F.g.position.y = arc(j) * 0.7; NF.cheer(F, arc(j)); }
        if (k > 0.55 && k < 1) NF.wave(F, t, arc(sub(k, 0.55, 1)));
        if (k >= 1) NF.setMood(F, 'happy');
      }
    };
    return st;
  });

  // 4 GARDEN: Twelve becomes the rectangle that fills the bed, flowers come up ----------------
  stop(x => {
    let F = null, W = 3, H = 4, zc = -3, cols0 = 2;
    const bed = new THREE.Group(); scene.add(bed);
    const flowers = new THREE.Group(); scene.add(flowers);
    const can = new THREE.Group();
    can.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.55, 18), std('#3cc6ef', 0.5)));
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 8), std('#3cc6ef', 0.5)); spout.position.set(0.38, 0.1, 0); spout.rotation.z = -0.9; can.add(spout);
    can.position.set(x + 4.6, 0.28, -2.4); add(can);
    const soilM = std(COL.soil, 1);
    const st = {
      dur: 5.5, cam: { hh: 4.8, y: 2.8 },
      lead: k => ease(sub(k, 0.5, 1)),
      setup(d) {
        W = d.W || 3; H = d.H || 4; zc = -1.3 - H / 2;
        cols0 = W === 2 || W === 6 ? 3 : 2;            // Twelve waits in another shape
        drop(F); F = mk(12, { cols: cols0 });
        bed.clear(); flowers.clear();
        const soil = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, H), soilM); soil.position.set(x, 0.03, zc); bed.add(soil);
        for (const [w, h, px, pz] of [[W + 0.5, 0.25, x, zc - H / 2 - 0.125], [W + 0.5, 0.25, x, zc + H / 2 + 0.125]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, h), woodM); b.position.set(px, 0.15, pz); bed.add(b); }
        for (const px of [x - W / 2 - 0.125, x + W / 2 + 0.125]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, H), woodM); b.position.set(px, 0.15, zc); bed.add(b); }
        shadowy(bed);
        let k = 0;
        const ring = [];
        for (let i = 0; i <= W * 2; i++) ring.push([x - W / 2 - 0.45 + i * (W + 0.9) / (W * 2), zc - H / 2 - 0.45]);
        for (let i = 0; i <= H * 2; i++) { ring.push([x - W / 2 - 0.45, zc - H / 2 - 0.45 + i * (H + 0.9) / (H * 2)]); ring.push([x + W / 2 + 0.45, zc - H / 2 - 0.45 + i * (H + 0.9) / (H * 2)]); }
        for (const [fx, fz] of ring) {
          const f = new THREE.Group();
          const s = new THREE.Mesh(stemGeo, stemM); s.position.y = 0.15;
          const p = new THREE.Mesh(flowerGeo, petalM[k++ % petalM.length]); p.position.y = 0.32;
          f.add(s, p); f.position.set(fx, 0, fz); f.userData.k = k; flowers.add(f);
        }
      },
      pose(k, cur, t) {
        const home = [x - W / 2 - (cols0 === 3 ? 3 : 2.5), 0, -2.0];
        const A = { cols: cols0 }, B = { cols: W, flat: true };
        NF.rest(F);
        if (k < 0.3) {
          NF.place(F, A);
          hopTo(F, home, [x, 0.06, zc], sub(k, 0.1, 0.3), 2.2);
          NF.setMood(F, k < 0.1 ? 'think' : 'joy');
        } else {
          F.g.position.set(x, 0.06, zc);
          NF.morph(F, A, B, sub(k, 0.3, 0.75));
          NF.setMood(F, k < 0.9 ? 'joy' : 'happy');
          if (k < 0.75) F.num.visible = false;
        }
        const n = flowers.children.length;
        flowers.children.forEach((f, j) => { const s = easeBack(sub(k, 0.75 + j / n * 0.15, 0.82 + j / n * 0.15)); f.scale.setScalar(Math.max(0.001, s)); f.visible = s > 0.01; });
      }
    };
    return st;
  });

  // 5 SEESAW: the chosen friends hop on the high side, the seesaw levels ---------------------------
  stop(x => {
    const piv = [x, 0.8, -1.6], A0 = Math.asin(0.8 / 4.2);
    const plank = mesh(new RBox(8.4, 0.3, 1.3, 2, 0.1), woodM, x, 0.8, -1.6);
    const base = mesh(new THREE.CylinderGeometry(0.01, 0.75, 0.8, 3), std('#e5232c', 0.6), x, 0.4, -1.6); base.rotation.y = Math.PI / 2;
    let left = [], right = [], nums = [];
    function onPlank(F, lx, a) {
      F.g.position.set(piv[0] + lx * Math.cos(a) - 0.15 * Math.sin(a), piv[1] + lx * Math.sin(a) + 0.15 * Math.cos(a), piv[2]);
      F.g.rotation.z = a;
    }
    const LX = [-3.4, -1.9], RX = [1.9, 3.4];
    const st = {
      dur: 5, cam: { hh: 5, y: 3.2 },
      lead: k => ease(sub(k, 0.6, 1)),
      shows: k => (k > 0 ? nums : nums.slice(0, 2)),
      setup(d) {
        left.forEach(drop); right.forEach(drop);
        const lv = d.left || [3, 4], rv = (d.answer || [2, 5]).slice(0, RX.length);
        nums = lv.concat(rv);
        left = lv.map(v => mk(v, { cols: 1 }));
        right = rv.map(v => mk(v, { cols: 1 }));
      },
      pose(k, cur, t) {
        const lv = sub(k, 0.42, 0.7), wob = sub(k, 0.7, 1);
        const a = lerp(A0, 0, ease(lv)) + Math.sin(wob * Math.PI * 3) * 0.04 * (1 - wob);
        plank.rotation.z = a; plank.position.set(piv[0], piv[1], piv[2]);
        left.forEach((F, j) => { NF.rest(F); onPlank(F, LX[j], a); NF.setMood(F, k < 0.45 ? 'sad' : k < 0.98 ? 'joy' : 'happy'); if (k > 0.72 && k < 1) NF.cheer(F, arc(sub(k, 0.72, 1))); });
        right.forEach((F, j) => {
          // not before the answer: they are the answer (the child's pick)
          F.g.visible = k > 0;
          if (k <= 0) return;
          NF.rest(F);
          const u = sub(k, 0.08 + j * 0.14, 0.24 + j * 0.14), home = [x + 5.8 + j * 1.5, 0, -1.6];
          if (u < 1) {
            const lx = RX[j], ta = a;
            const to = [piv[0] + lx * Math.cos(ta) - 0.15 * Math.sin(ta), piv[1] + lx * Math.sin(ta) + 0.15 * Math.cos(ta), piv[2]];
            hopTo(F, home, to, u, 1.6);
            F.g.rotation.z = ta * ease(u);
          } else onPlank(F, RX[j], a);
          NF.setMood(F, k < 0.06 ? 'think' : k < 0.98 ? 'joy' : 'happy');
          if (k > 0.72 && k < 1) NF.cheer(F, arc(sub(k, 0.72, 1)));
        });
      }
    };
    return st;
  });

  // 6 STEPPING STONES: the path stones light up, everyone hops across ------------------------------
  stop(x => {
    const cols = 5, rows = 3, sx = c => x - 2.4 + c * 1.2, sz = r => -1.3 + r * 1.3;
    mesh(new THREE.PlaneGeometry(7.4, 4.8).rotateX(-Math.PI / 2), std(COL.water, 0.12, { transparent: true, opacity: 0.92 }), x, 0.025, 0, false);
    mesh(new THREE.PlaneGeometry(8.2, 5.6).rotateX(-Math.PI / 2), std(COL.sand, 1), x, 0.018, 0, false);
    const stoneGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.2, 24), capGeo = new THREE.CircleGeometry(0.42, 24).rotateX(-Math.PI / 2);
    const stones = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const m = mesh(stoneGeo, std(COL.stone, 0.85, { emissive: new THREE.Color('#ffd23a'), emissiveIntensity: 0 }), sx(c), 0.1, sz(r));
      const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, transparent: true }));
      cap.position.y = 0.101; m.add(cap);
      stones.push({ m, cap });
    }
    let path = [1, 1, 1, 1, 1];
    const st = {
      arr: x - 9, post: x + 9, dur: 6.5, cam: { hh: 4.2, y: 1.4 },
      lead: k => sub(k, 0.22, 1),
      setup(d) {
        path = d.path || path;
        const nums = d.nums || [];
        stones.forEach((s, i) => {
          if (s.cap.material.map) s.cap.material.map.dispose();
          s.cap.material.map = WS.texture(textCanvas([String(nums[i] != null ? nums[i] : '')], 128, 128, { color: '#4a3a2a', size: 70 }));
          s.cap.material.needsUpdate = true;
        });
        const pts = [{ x: st.arr, z: 0 }, { x: x - 4, z: 0 }];
        path.forEach((r, c) => pts.push({ x: sx(c), z: sz(r), y: 0.2, hop: true }));
        pts.push({ x: x + 4, z: 0, hop: true }, { x: st.post, z: 0 });
        st.route = mkRoute(pts);
      },
      pose(k) {
        stones.forEach((s, i) => {
          const c = i % cols, r = Math.floor(i / cols), on = path[c] === r;
          s.m.material.emissiveIntensity = on ? sub(k, 0.02 + c * 0.04, 0.08 + c * 0.04) * 0.45 : 0;
        });
      }
    };
    return st;
  });

  // 7 CUBE YARD: a ten-frame of gate cubes, some missing; solved: the missing ones drop in, the row
  // glows and flies off to the gate --------------------------------------------------------------------
  stop(x => {
    const yard = new THREE.Group(); scene.add(yard);
    const cubeG = new RBox(0.82, 0.82, 0.82, 2, 0.08), slotG = new THREE.PlaneGeometry(0.86, 0.86).rotateX(-Math.PI / 2);
    const tray = mesh(new RBox(5.6, 0.16, 2.4, 2, 0.06), woodM, x, 0.08, -1.6);
    const slotM = std('#c9b48e', 0.9);
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(slotG, slotM); m.position.set(x - 2.2 + (i % 5) * 1.1, 0.17, -2.15 + Math.floor(i / 5) * 1.1); yard.add(m); }
    for (const dx of [-5.2, 5.2]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8), woodDM, x + dx, 0.6, -0.9);
    let cubes = [], have = 5;
    const st = {
      dur: 4.6, cam: { hh: 4.2, y: 1.3 },
      lead: k => ease(sub(k, 0.5, 1)),
      setup(d) {
        have = d.have || 5;
        cubes.forEach(c => { scene.remove(c); c.material.dispose(); });
        cubes = [];
        for (let i = 0; i < 10; i++) {
          const c = new THREE.Mesh(cubeG, std(d.col || RAIN[2], 0.4, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 }));
          c.castShadow = TIER > 0; scene.add(c); cubes.push(c);
        }
        tray.visible = true;
      },
      pose(k) {
        cubes.forEach((c, i) => {
          const px = x - 2.2 + (i % 5) * 1.1, pz = -2.15 + Math.floor(i / 5) * 1.1, rest = 0.16 + 0.41;
          const j = i - have;                               // the missing ones drop in one by one
          const drop = j < 0 ? 1 : sub(k, 0.05 + j * 0.06, 0.18 + j * 0.06);
          const fly = sub(k, 0.7 + i * 0.012, 0.95);
          c.visible = drop > 0 && fly < 1;
          c.position.set(px + fly * fly * 9, rest + (1 - ease(drop)) * 4 + fly * 6 + arc(sub(k, 0.6, 0.7)) * 0.3, pz);
          c.rotation.set(fly * 3, fly * 4, 0);
          c.scale.setScalar(Math.max(0.001, 1 - fly * 0.7));
          c.material.emissiveIntensity = sub(k, 0.5, 0.62) * 0.35;
        });
      }
    };
    return st;
  });
  // 8 SQUARE POND: the square friends hop onto lily pads and stand as squares -------------------------
  stop(x => {
    const pz = -5.0, size = 7.6;
    mesh(new THREE.PlaneGeometry(size + 0.9, size + 0.9).rotateX(-Math.PI / 2), std('#cfc6b4', 1), x, 0.015, pz, false);
    mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), std(COL.water, 0.12, { transparent: true, opacity: 0.92 }), x, 0.022, pz, false);
    const rimG = new THREE.SphereGeometry(0.32, 12, 8);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) {
      const u = -size / 2 - 0.25 + j * (size + 0.5) / 11, side = size / 2 + 0.25;
      const p = [[u, -side], [u, side], [-side, u], [side, u]][i];
      const m = mesh(rimG, stoneM, x + p[0], 0.08, pz + p[1], false); m.scale.y = 0.5;
    }
    const padM = std('#5cbf4a', 0.8);
    let fs = [], values = [], squares = [], pads = [], spots = {};
    const st = {
      arr: x - 10.5, post: x + 10.5, dur: 6, cam: { hh: 5.6, y: 3.7 },
      route: mkRoute([{ x: x - 10.5, z: 0 }, { x: x - 5.6, z: 0 }, { x: x - 4.6, z: 1.3 }, { x: x + 4.6, z: 1.3 }, { x: x + 5.6, z: 0 }, { x: x + 10.5, z: 0 }]),
      lead: k => ease(sub(k, 0.55, 1)),
      shows: () => values,
      setup(d) {
        values = d.values || [1, 2, 4, 5, 7, 9]; squares = (d.squares || [1, 4, 9]).slice().sort((a, b) => a - b);
        fs.forEach(drop); pads.forEach(p => scene.remove(p));
        fs = values.map(v => mk(v, { cols: 1 }));
        spots = {}; pads = [];
        const ws = squares.map(v => Math.round(Math.sqrt(v))), tot = ws.reduce((a, b) => a + b, 0) + (ws.length - 1) * 0.9;
        let cx = x - tot / 2;
        squares.forEach((v, j) => {
          const w = ws[j]; spots[v] = [cx + w / 2, 0.08, pz + 0.6]; cx += w + 0.9;
          const p = mesh(new THREE.CylinderGeometry(w * 0.72, w * 0.72, 0.06, 28), padM, spots[v][0], 0.05, spots[v][2], false);
          pads.push(p);
        });
      },
      pose(k, cur, t) {
        pads.forEach(p => { const s = easeBack(sub(k, 0.12, 0.3)); p.scale.setScalar(Math.max(0.001, s)); p.visible = s > 0.01; });
        fs.forEach((F, j) => {
          const v = values[j], home = [x - 3.75 + j * 1.5, 0, -0.6], qi = squares.indexOf(v);
          NF.rest(F);
          if (qi < 0) {
            NF.place(F, F.L0); F.g.position.set(home[0], 0, home[2]);
            NF.setMood(F, k < 0.1 ? 'happy' : k < 0.8 ? 'think' : 'joy');
            if (k > 0.82 && k < 1) NF.wave(F, t, arc(sub(k, 0.82, 1)));
            return;
          }
          const s = Math.round(Math.sqrt(v)), u = sub(k, 0.1 + qi * 0.12, 0.3 + qi * 0.12);
          if (u < 1) { NF.place(F, F.L0); hopTo(F, home, spots[v], u, 2.4); }
          else { F.g.position.set(spots[v][0], spots[v][1], spots[v][2]); NF.morph(F, F.L0, { cols: s }, sub(k, 0.5, 0.82)); }
          NF.setMood(F, k < 0.08 ? 'think' : k < 0.98 ? 'joy' : 'happy');
        });
      }
    };
    return st;
  });

  // 9 GLOW CAVE: rows of crystal cubes, dim (counted in the panel); solved: they light row by row ----
  const CRYSTAL = ['#ff8fa3', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc', '#ffa94d'];
  stop(x => {
    const dome = mesh(new THREE.SphereGeometry(5.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), std(COL.rock, 0.95), x, 0, -6.5, false);
    dome.scale.set(1, 0.85, 0.75);
    const mouth = mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: '#1c1830' }), x, 2.0, -2.75, false);
    mouth.scale.set(2.6, 2.2, 1);
    for (const [dx, dy, s] of [[-3.5, 0.3, 0.9], [3.8, 0.25, 0.7], [-2.6, 0.2, 0.5]]) mesh(new THREE.DodecahedronGeometry(s, 0), std(COL.rock, 0.95), x + dx, dy, -2.2);
    const crystalGeo = new RBox(0.62, 0.62, 0.62, 2, 0.08);
    const glow = new THREE.PointLight('#ffe9b0', 0, 12, 1.6); glow.position.set(x, 2.2, -1.2); scene.add(glow);
    let crystals = [], rows = 2, cols = 3;
    const st = {
      dur: 4, cam: { hh: 4.4, y: 2.2 },
      lead: k => ease(sub(k, 0.55, 1)),
      setup(d) {
        rows = d.rows || 2; cols = d.cols || 3;
        crystals.forEach(c => { scene.remove(c.m); c.m.material.dispose(); });
        crystals = [];
        const sp = Math.min(0.82, 3.6 / cols, 2.9 / rows);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const col = CRYSTAL[r % CRYSTAL.length];
          const m = mesh(crystalGeo, std(col, 0.25, { emissive: new THREE.Color(col), emissiveIntensity: 0.05, transparent: true, opacity: 0.92 }),
            x + (c - (cols - 1) / 2) * sp, 2.0 + ((rows - 1) / 2 - r) * sp, -2.55);
          m.scale.setScalar(sp / 0.82); m.castShadow = false;
          crystals.push({ m, r, s: sp / 0.82 });
        }
      },
      pose(k) {
        crystals.forEach(({ m, r, s }) => {
          const u = sub(k, 0.05 + r * 0.12, 0.2 + r * 0.12);            // row by row
          m.material.emissiveIntensity = 0.05 + u * 1.1 + arc(u) * 0.5;
          m.scale.setScalar(s * (1 + arc(u) * 0.12));
        });
        glow.intensity = sub(k, 0.3, 0.6) * 18;
      }
    };
    return st;
  });
  // 10 MIRROR LAKE: the twin tower rises out of the water ----------------------------------------
  stop(x => {
    const lz = -3.4;
    mesh(new THREE.PlaneGeometry(9.5, 4.6).rotateX(-Math.PI / 2), std(COL.water, 0.08, { transparent: true, opacity: 0.9 }), x, 0.022, lz + 0.2, false);
    for (const dx of [-1.55, 1.55]) mesh(new RBox(3.2, 0.3, 1.4, 2, 0.1), std(COL.rock, 0.9), x + dx, 0.15, lz);
    const shimmer = mesh(new THREE.PlaneGeometry(0.06, 5.2), new THREE.MeshBasicMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.7 }), x, 2.6, lz, false);
    const curtain = mesh(new THREE.PlaneGeometry(4.4, 5.2), new THREE.MeshBasicMaterial({ color: '#d8f3ff', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }), x, 2.6, lz, false);
    curtain.rotation.y = Math.PI / 2;
    const group = new THREE.Group(); scene.add(group);
    let lefts = [], rights = [];
    const cyanM = std('#3cc6ef', 0.4, { emissive: new THREE.Color('#bff0ff'), emissiveIntensity: 0 });
    const st = {
      dur: 4.6, cam: { hh: 4.4, y: 2.2 },
      lead: k => ease(sub(k, 0.5, 1)),
      setup(d) {
        const h = d.h || [1, 3, 2];
        group.clear(); lefts = []; rights = [];
        h.forEach((hc, c) => { for (let r = 0; r < hc; r++) {
          const a = new THREE.Mesh(cubeGeo, cyanM); a.position.set(x - 2.5 + c, 0.8 + r, lz); group.add(a); lefts.push(a);
          const b = new THREE.Mesh(cubeGeo, cyanM); b.userData = { y: 0.8 + r, order: (2 - c) * 5 + r }; b.position.set(x + 0.5 + (2 - c), 0.8 + r, lz); group.add(b); rights.push(b);
        } });
        rights.sort((p, q) => p.userData.order - q.userData.order);
        shadowy(group);
      },
      pose(k) {
        const n = rights.length;
        rights.forEach((b, j) => {
          const u = sub(k, j / n * 0.5, j / n * 0.5 + 0.22);
          b.visible = u > 0;
          b.position.y = lerp(-1.2, b.userData.y, Math.min(1, easeBack(u)));
        });
        const sp = arc(sub(k, 0.7, 0.88));
        [...lefts, ...rights].forEach(m => m.scale.setScalar(1 + sp * 0.08));
        cyanM.emissiveIntensity = sp * 0.5;
        shimmer.material.opacity = 0.7 - sub(k, 0.7, 1) * 0.4;
      }
    };
    return st;
  });

  // 11 TUMBLING HILL: a staircase of cube towers 1..top up the hill with one gap; solved: it rises ----
  stop(x => {
    const hill = mesh(new THREE.SphereGeometry(6, 32, 16), std(COL.hills[1], 0.95), x + 2, -1.2, -10, false); hill.scale.y = 0.55;
    const stairs = new THREE.Group(); scene.add(stairs);
    const fill = new THREE.Group(); scene.add(fill);
    let top = 5, gap = 3, step = 0.9, xs = [];
    const st = {
      dur: 4, cam: { hh: 4.8, y: 2.6 },
      lead: k => ease(sub(k, 0.55, 1)),
      setup(d) {
        top = d.top || 5; gap = d.gap || 3;
        stairs.clear(); fill.clear();
        step = Math.min(0.9, 7 / top);
        const g = new RBox(step * 0.94, step * 0.94, step * 0.94, 2, 0.06);
        const x0 = x - (top - 1) * step / 2;
        xs = [];
        for (let h = 1; h <= top; h++) {
          const cx = x0 + (h - 1) * step; xs.push(cx);
          const grp = h === gap ? fill : stairs;
          for (let y = 0; y < h; y++) {
            const m = new THREE.Mesh(g, std(NF.COLORS[Math.min(h, 10)] || '#ccc', 0.5));
            m.position.set(cx, step * (y + 0.5), -1.6);
            grp.add(m);
          }
        }
        shadowy(stairs); shadowy(fill);
      },
      pose(k) {
        const u = sub(k, 0.1, 0.45), e = easeBack(u);
        fill.visible = u > 0;
        fill.scale.set(1, Math.max(0.001, e), 1);
        fill.position.y = 0;
        const shine = arc(sub(k, 0.45, 0.75));
        fill.children.forEach(m => { m.material.emissive = m.material.emissive || new THREE.Color(); m.material.emissive.set('#ffd23a'); m.material.emissiveIntensity = shine * 0.6; });
      }
    };
    return st;
  });
  // 12 ODD CAMP: everyone pairs up their cubes; the odd one's lonely cube bounces --------------------
  stop(x => {
    for (const [dx, dz, c] of [[-4.8, -5.6, '#f6921e'], [4.6, -6.0, '#3cc6ef'], [0.4, -7.2, '#e2339b']]) {
      const tent = mesh(new THREE.ConeGeometry(1.7, 2.5, 4), std(c, 0.8), x + dx, 1.25, dz); tent.rotation.y = Math.PI / 4;
      mesh(new THREE.PlaneGeometry(0.7, 1.1), std('#3a2a1c', 1), x + dx, 0.55, dz + 1.21, false);
    }
    const fire = new THREE.Group();
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8), woodDM); l.rotation.set(Math.PI / 2, k * 1.05, 0); l.position.y = 0.1; fire.add(l); }
    for (const [s, c, h] of [[0.36, '#ff7a1a', 0.9], [0.24, '#ffd23a', 0.65]]) {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(s, h, 12), new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 1.2 }));
      fl.position.y = 0.2 + h / 2; fire.add(fl);
    }
    fire.position.set(x, 0, -1.2); add(fire, false);
    const warm = new THREE.PointLight('#ffb36b', TIER > 0 ? 6 : 3, 7, 1.8); warm.position.set(x, 1.2, -1.2); scene.add(warm);
    let fs = [], values = [], odd = 3;
    const XS = [-3.3, -1.1, 1.1, 3.3];
    const st = {
      dur: 5, cam: { hh: 5.4, y: 3.5 },
      lead: k => ease(sub(k, 0.5, 1)),
      shows: () => values,
      setup(d) {
        values = d.values || [2, 3, 4, 6]; odd = d.odd || 3;
        fs.forEach(drop); fs = values.map(v => mk(v, { cols: 1 }));
      },
      pose(k, cur, t) {
        fs.forEach((F, j) => {
          const v = values[j];
          NF.rest(F); F.g.position.set(x + XS[j], 0, -3.0);
          NF.morph(F, F.L0, { cols: 2 }, sub(k, 0.15, 0.6));
          if (v === odd && k > 0.6) {
            const c = F.cubes[v - 1], b = sub(k, 0.62, 0.92);
            NF.cubePos(v - 1, v, { cols: 2 }, c.position);
            c.position.y += Math.abs(Math.sin(b * Math.PI * 3)) * 0.5;
            NF.setMood(F, b < 0.4 ? 'surprised' : k < 0.98 ? 'joy' : 'happy');
          } else NF.setMood(F, k <= 0 ? 'happy' : k < 0.15 ? 'think' : k < 0.98 ? 'joy' : 'happy');
          if (k > 0.88 && k < 1) NF.cheer(F, arc(sub(k, 0.88, 1)));
        });
      }
    };
    return st;
  });

  // 13 RAINBOW GATE: every friend fills a gap, the gate glows, a rainbow grows -----------------------
  stop(x => {
    const gz = -1.4, CX = [-3, -1, 1, 3];
    const gate = new THREE.Group(); scene.add(gate);
    const rowM = RAIN.map(c => std(c, 0.4, { emissive: new THREE.Color(c), emissiveIntensity: 0 }));
    const ghostM = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.4 });
    for (let c = -3; c <= 3; c++) { const m = new THREE.Mesh(cubeGeo, rowM[c + 3]); m.position.set(x + c, 7.5, gz); gate.add(m); }
    const rainbow = new THREE.Group();
    RAIN.forEach((c, j) => {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(6.4 - j * 0.32, 0.16, 8, 64, Math.PI), new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0.35, roughness: 0.6 }));
      rainbow.add(tor);
    });
    rainbow.position.set(x, 2.4, gz - 1.2); scene.add(rainbow);
    const plateau = mesh(new THREE.CylinderGeometry(9, 9.8, 0.3, 48), std('#a9de7c', 0.95), x + 1, -0.12, -3.5, false);
    plateau.receiveShadow = true;
    const L = { 4: mk(4), 5: mk(5) }, fans = [mk(7), mk(8), mk(9)];
    const cols = new THREE.Group(); gate.add(cols);
    let holes = [1, 2, 3, 4], ghosts = [];
    const who = v => party[v] || L[v];
    const startOf = v => {
      const pl = PARTY(13), m = pl.indexOf(v);
      return m >= 0 ? [x - 9 - m * SP, 0, 0] : [x + 5.2 + (v - 4) * 1.6, 0, -0.4];
    };
    const st = {
      arr: x - 9, post: x - 9, route: mkRoute([{ x: x - 9, z: 0 }]), dur: 7, cam: { hh: 5.6, y: 4.2 },
      lead: () => 0,
      setup(d) {
        holes = d.holes || holes;
        cols.clear(); ghosts = [];
        CX.forEach((cx, j) => {
          const h = holes[j];
          for (let y = 0; y < 7; y++) {
            const m = new THREE.Mesh(cubeGeo, y < h ? ghostM : rowM[y]);
            m.position.set(x + cx, y + 0.5, gz); cols.add(m);
            if (y < h) { m.castShadow = false; ghosts.push({ m, j }); }
          }
        });
        shadowy(gate);
        ghosts.forEach(g => { g.m.castShadow = false; });
      },
      pose(k, cur, t) {
        const glowK = sub(k, 0.66, 0.82);
        rowM.forEach(m => { m.emissiveIntensity = glowK * 0.45; });
        const rb = ease(sub(k, 0.68, 0.86));
        rainbow.scale.setScalar(Math.max(0.001, rb)); rainbow.visible = rb > 0.01;
        ghostM.opacity = 0.3;
        const cheerK = arc(sub(k, 0.82, 1));
        fans.forEach((F, j) => { standAt(F, x + 6.6 + j * 1.9 + (j === 2 ? 0.6 : 0), -3.6, k > 0.8 && k < 1 ? 'joy' : 'happy'); if (cheerK > 0) { NF.cheer(F, cheerK); F.g.position.y = cheerK * 0.4; } });
        const used = new Set();
        holes.forEach((v, j) => {
          const F = who(v), isParty = !!party[v];
          used.add(v);
          if (isParty && !cur) return;              // the walking line owns them away from the gate
          const u = sub(k, 0.04 + j * 0.14, 0.2 + j * 0.14), mo = sub(u, 0, 0.35), hp = sub(u, 0.35, 1);
          const s0 = startOf(v), hole = [x + CX[j], -LEG, gz];
          NF.rest(F);
          if (!isParty) F.g.visible = true;
          const col = { cols: 1 };
          if (hp <= 0) { F.g.position.set(s0[0], 0, s0[2]); NF.morph(F, F.L0, col, F.L0.cols === 1 ? 1 : mo); }
          else { NF.place(F, col); hopTo(F, s0, hole, hp, 2.6); NF.tuck(F, 1 - hp, 1); }
          NF.setMood(F, u <= 0 ? 'happy' : u < 1 ? 'brave' : k < 0.98 ? 'joy' : 'happy');
          if (hp >= 1 && cheerK > 0) NF.cheer(F, cheerK);
          ghosts.forEach(g => { if (g.j === j) g.m.visible = hp < 0.95; });
        });
        for (const v of [4, 5]) if (!used.has(v)) { standAt(L[v], x + 5.2 + (v - 4) * 1.6, -0.4, k > 0.8 && k < 1 ? 'joy' : 'happy'); if (cheerK > 0) NF.cheer(L[v], cheerK); }
        if (cur) for (const v of PARTY(13)) if (!used.has(v) && cheerK > 0) { NF.cheer(party[v], cheerK); party[v].g.position.y += cheerK * 0.4; NF.setMood(party[v], 'joy'); }
      }
    };
    return st;
  });

  // ---- story state ------------------------------------------------------------------------------
  let sec = 0, res = 0, anim = null, trav = null, pending = false, t = 0;
  function refresh(i) {
    const sp = specFor(i), S = STOPS[i];
    if (S.seed === sp.key && S.seed !== null) return false;
    S.seed = sp.key;
    S.setup(sp.data || {});
    if (!S.route) S.route = straight(S.arr, S.post);
    return true;
  }
  const restX = (j, sol) => (sol ? STOPS[j].route.pts[STOPS[j].route.pts.length - 1].x : STOPS[j].route.pts[0].x);
  function leadX(j, k) { const S = STOPS[j]; at(S.route, S.lead(k) * S.route.L, P); return P.x; }
  function camAt(j, k) { const S = STOPS[j]; return { x: S.x + 0.3 * clamp(leadX(j, k) - S.x, -9, 9), hh: S.cam.hh, y: S.cam.y }; }
  let cam = { x: 0, hh: 4, y: 1.6 };

  function pose() {
    const solved = STOPS.map((_, j) => isSolved(j));
    let list, route, s, moving = false, dir = 1;
    if (trav) {
      const k = ease(clamp(trav.t / trav.dur, 0, 1));
      const lo = Math.min(trav.from, trav.to), hi = Math.max(trav.from, trav.to);
      list = PARTY(lo + 1); route = trav.route;
      s = (trav.to > trav.from ? k : 1 - k) * route.L;
      moving = k > 0 && k < 1; dir = trav.to > trav.from ? 1 : -1;
      const a = camAt(lo, 1), b = camAt(hi, solved[hi] ? 1 : 0), kk = trav.to > trav.from ? k : 1 - k;
      cam = { x: lerp(a.x, b.x, kk), hh: lerp(a.hh, b.hh, kk), y: lerp(a.y, b.y, kk) };
    } else {
      const S = STOPS[sec];
      list = res >= 1 ? PARTY(sec + 1) : PARTY(sec);
      route = S.route; const f = S.lead(res); s = f * route.L;
      moving = !!anim && f > 0 && f < 1;
      cam = camAt(sec, res);
    }
    const skip = !trav && STOPS[sec].shows ? STOPS[sec].shows(res) : [];
    line(list, route, s, moving, dir, anim && res > 0.5 ? 'joy' : 'happy', skip);
    for (let j = 0; j < N; j++) {
      const cur = j === sec && !trav;
      // the stop being walked to keeps `res` too: solved mid-walk, its result
      // waits (pending) instead of jumping to the end pose before we arrive
      const k = j === sec ? res : solved[j] ? 1 : 0;
      STOPS[j].pose(k, cur, t, STOPS[j]);
    }
    sun.position.set(cam.x + 8, 22, 16);
    sun.target.position.set(cam.x, 0, -2);
  }
  function startAnim() {
    anim = { t: 0, dur: STOPS[sec].dur };
    res = 0; pending = false; world.dirty = true;
  }
  function snapAnim() { if (anim) { anim = null; res = 1; world.dirty = true; } }

  window.addEventListener('minigame-solved', e => {
    const i = e.detail && e.detail.index;
    if (i == null || i < 0 || i >= N) return;
    refresh(i);                                   // picks up the child's own pick
    if (i !== sec) return;
    if (trav) { pending = true; return; }
    if (anim) return;
    startAnim();
  });
  window.addEventListener('minigame-mounted', e => {
    const i = e.detail && e.detail.index;
    if (i == null || i < 0 || i >= N) return;
    const changed = refresh(i);
    // a new puzzle (↻) mid-animation: drop the old result, back to the start pose
    // (also mid-walk: a walk planned for the solved stop, e.g. going back with
    // Six already through the door, would end in the wrong place)
    if (i === sec && changed) { anim = null; pending = false; trav = null; }
    if (i === sec && !anim && !trav) res = isSolved(i) ? 1 : 0;
    world.dirty = true;
  });

  function enter(i = 0) {
    for (let j = 0; j < N; j++) refresh(j);
    anim = null; trav = null; pending = false;
    sec = clamp(i | 0, 0, N - 1);
    res = isSolved(sec) ? 1 : 0;
    pose(); world.dirty = true;
  }
  function show(i) {
    i = clamp(i | 0, 0, N - 1);
    snapAnim();
    if (trav) trav = null;
    if (i === sec) { res = isSolved(i) ? 1 : 0; world.dirty = true; return; }
    refresh(i);
    const from = sec;
    sec = i; pending = false;
    res = isSolved(i) ? 1 : 0;
    if (Math.abs(i - from) !== 1) { world.dirty = true; return; }       // a long jump: just be there
    const lo = Math.min(from, i), hi = Math.max(from, i);
    const xa = restX(lo, true), xb = restX(hi, isSolved(hi));
    trav = { from, to: i, t: 0, dur: clamp(Math.abs(xb - xa) / 4.5, 2, 4.5), route: straight(xa, xb) };
    world.dirty = true;
  }
  function forward() {
    if (window.MINIGAME && window.MINIGAME.pointerInPanel) return false;
    if (anim) { if (anim.t < 0.3) return true; snapAnim(); return true; }
    return false;
  }
  function back() {
    if (anim) { snapAnim(); return true; }
    return false;
  }
  function update(dt) {
    t += dt;
    let live = false;
    if (trav) {
      trav.t += dt; live = true;
      if (trav.t >= trav.dur) {
        trav = null;
        if (pending && isSolved(sec)) startAnim();
      }
    } else if (anim) {
      anim.t += dt; live = true;
      res = clamp(anim.t / anim.dur, 0, 1);
      if (res >= 1) anim = null;
    } else if (pending && isSolved(sec)) { startAnim(); live = true; }
    if (!trav && STOPS[sec].idle && res < 1) live = true;
    if (live || world.dirty) pose();
    return live;
  }

  // ---- camera: fit the stop above the caption ----
  let aspect = 1, freeF = 1, tx = 0, ty = 0, camKey = '';
  const tn = Math.tan(CAM_FOV * Math.PI / 360);
  function resize(w, h, free = h) {
    camera.aspect = w / h;
    // landscape: the caption + puzzle stand in a column on the right (pages.js
    // CSS); frame the stop in the space to its left, full height
    const cap = document.querySelector('.book-scene3d .obj-slot.is-caption');
    const r = cap && cap.getBoundingClientRect();
    let side = 0;
    if (r && r.width && w > h && r.left > w * 0.45) { side = w - r.left + 12; free = h; }
    aspect = (w - side) / h;
    freeF = Math.max(0.4, Math.min(1, free / h));
    camera.setViewOffset(w, h, side / 2, (h - free) / 2, w, h);
    camera.updateProjectionMatrix();
    camKey = '';
  }
  function placeCamera() {
    const halfW = aspect < 1 ? 5.6 : 9;
    const dist = Math.max(cam.hh / (tn * freeF), halfW / (tn * aspect));
    const pitch = CAM_PITCH + ty * 0.03, yaw = tx * 0.08;
    const key = pitch.toFixed(4) + yaw.toFixed(4) + dist.toFixed(2) + cam.x.toFixed(3) + cam.y.toFixed(3);
    if (key === camKey) return false;
    camKey = key;
    scene.fog.near = dist * 1.6; scene.fog.far = dist * 5.5;
    camera.position.set(cam.x + Math.sin(yaw) * Math.cos(pitch) * dist, cam.y + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(cam.x, cam.y, 0);
    return true;
  }

  const world = {
    scene, camera, enter, show, forward, back, resize, dpr: 1, dirty: true,
    play() { forward(); },
    label: 'Number Cube Land: a soft green land of hills, round trees and a river. Little One and the number friends travel from stop to stop towards the Rainbow Gate on the far hill.',
    update(dt) { const a = update(dt); return placeCamera() || a; },
    tilt(x, y) { tx = clamp(x, -1, 1); ty = clamp(y, -1, 1); }
  };
  return world;
}

WS.register('numberland', r => makeWorld(r));
})();
