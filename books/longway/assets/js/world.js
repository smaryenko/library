// THE LONG WAY HOME: one continuous toy-cube world on a table, laid out left
// to right. Each page is a camera stop further right; Theo travels LEFT to
// RIGHT. Hosted by the shared assets/js/webgl-stage.js (kind "longway").
//
// Story steps: every page is two steps, its event and then the travel on to
// the next page (the page turn). The whole story is ONE number `s`: page i
// rests at s = 2i, its event ends at 2i + 1, the travel runs 2i + 1 -> 2i + 2.
// Every visible thing is a pure function of s (eval(s)), so a step can be
// snapped to its end, played backwards (going back) or entered at its end.
// Inputs (webgl-stage.js): forward() / back() play the event or undo it and
// return false when the page is done, so the engine turns the page, which
// calls show(i) = the travel.
//
// Layout of the world (cube x): 1 hill town + quay (-16..12), 2 lighthouse
// rock (36), 3 open sea with dolphins (60), 4 the wind cloud (86), 5 the
// giant's island (112), 6 the orchard island (142), 7 singing seals' rocks
// (160), 8 the strait with the whirlpool and the octopus (188), 9 the night
// storm (210), 10 home beach and road (228..), 11 the white house (260).
(function () {
'use strict';
const G = window.WEBGL_STAGE, D = window.DRAWKIT, K = window.LONGWAY_CUBES;
const { THREE, TIER } = G;
const { clamp, lerp, ease, easeBack, sub } = D;
const { M, skin, box, figure } = K;
const PI = Math.PI;

// ---- tune by eye -------------------------------------------------------------
const GZ = 14;                           // grid depth (z towards the reader)
const INTRO_DELAY = 0.3, DROP_TIME = 0.45, DROP_H = 5, DROP_RANGE = 22;
const STEP_TIME = 0.3, RUN_TIME = 0.2, JUMP_TIME = 0.9, SAIL_SPEED = 6;   // cubes a second
const CAM_FOV = 30, CAM_PITCH = 0.62, TARGET_Y = 2.6, TARGET_Z = 0.8;
const FACE_SEA = 0.87;                   // Theo aboard: facing right, a little towards the reader
// camera x of each page
const CAM_X = [-1, 34, 60, 86, 110, 138, 162, 188, 210, 238, 258];
// light of each page: background (and fog), sun colour, sun strength, sky
// light, environment, sun height
const LIGHT = [
  { bg: '#e4ded3', sun: '#fff4e6', si: 2.3, hemi: 0.8, env: 0.5, el: 26 },    // 1 midday
  { bg: '#dfe4e2', sun: '#fff6ea', si: 2.3, hemi: 0.8, env: 0.5, el: 26 },    // 2
  { bg: '#d6e6ea', sun: '#ffffff', si: 2.4, hemi: 0.85, env: 0.5, el: 28 },   // 3 calm, bright
  { bg: '#c9ccd2', sun: '#e8ecf2', si: 1.7, hemi: 0.7, env: 0.45, el: 24 },   // 4 windy grey
  { bg: '#efe2c4', sun: '#fff0d0', si: 2.2, hemi: 0.8, env: 0.5, el: 24 },    // 5 warm afternoon
  { bg: '#f2dcae', sun: '#ffe2a8', si: 2.1, hemi: 0.8, env: 0.5, el: 22 },    // 6 golden, sleepy
  { bg: '#f2c9a2', sun: '#ffb27a', si: 2.0, hemi: 0.75, env: 0.45, el: 18 },  // 7 evening
  { bg: '#c9a3a8', sun: '#ff9c80', si: 1.6, hemi: 0.65, env: 0.4, el: 14 },   // 8 dusk
  { bg: '#1d2440', sun: '#9fb4ff', si: 0.8, hemi: 0.35, env: 0.18, el: 22 },  // 9 night storm
  { bg: '#f4c6b8', sun: '#ffc2a0', si: 1.8, hemi: 0.75, env: 0.45, el: 10 },  // 10 dawn
  { bg: '#f6dcc0', sun: '#ffe0b8', si: 2.0, hemi: 0.78, env: 0.48, el: 16 }   // 11 early morning, the lamp still burning
];
const wz = z => z - GZ / 2 + 0.5;
const ZB = wz(10) + 0.5;                 // the line the boat sails along (between grid rows 10 and 11)

// ---- the ground ------------------------------------------------------------------
// islands: centre x, z, radius x, z, peak height, kind
const ISLES = [
  [36, 4, 5, 3.5, 2, 'stone'],    // 2 lighthouse rock
  [44, 1.5, 2, 1.5, 1, 'stone'],
  [64, 1, 3, 1.5, 1, 'stone'],    // 3 a far rock
  [97, 0.5, 2.5, 1.2, 1, 'grass'],   // 4 far off: the island with home's lamp (so close!)
  [112, 4.5, 13, 5.5, 5, 'grass'],   // 5 the giant's island
  [142, 4.5, 10, 5.5, 2, 'grass'],   // 6 the orchard
  [160, 4, 3, 2.5, 2, 'stone'], [167, 5, 2.5, 2, 1, 'stone'], [155, 2, 2, 1.5, 1, 'stone'],   // 7 seals' rocks
  [181, 2, 4, 4, 5, 'stone'], [195, 2, 4, 4, 5, 'stone'],   // 8 the strait
  [180, 13, 1.6, 1.2, 2, 'stone'], [196, 13, 1.6, 1.2, 2, 'stone']
];
const X_MIN = -16, X_MAX = 278;
function land(x, z) {
  if (x >= X_MIN && x <= 12) {                      // 1 the hill town
    if (z >= 10) return x < -3 ? { h: 1, top: 'sand', fill: 'sand' } : null;
    if (z >= 8 && x >= 2 && x <= 10) return { h: 2, top: 'stone', fill: 'stone' };   // the quay
    if (z >= 8 && x > 10) return null;
    return { h: 2 + clamp(Math.round((8.5 - z) * 0.7 + (2 - x) * 0.12 + 0.8 * Math.sin(x * 0.55 + 0.4)), 0, 7), top: 'grass', fill: 'dirt' };
  }
  if (x >= 228 && x <= X_MAX) {                     // 10, 11 home
    if (z >= 10 && x < 240) return null;
    const sandy = x < 234;
    return { h: 1 + clamp(Math.round((x - 228) * 0.14 + (9 - z) * 0.35), 0, 8), top: sandy ? 'sand' : 'grass', fill: sandy ? 'sand' : 'dirt' };
  }
  for (const [cx, cz, rx, rz, peak, kind] of ISLES) {
    const d = Math.pow(Math.abs(x - cx) / rx, 3) + Math.pow(Math.abs(z - cz) / rz, 3);
    if (d >= 1) continue;
    const h = 1 + Math.round((1 - d) * peak);
    if (kind === 'stone') return { h, top: 'stone', fill: 'stone' };
    return d > 0.6 ? { h, top: 'sand', fill: 'sand' } : { h, top: 'grass', fill: 'dirt' };
  }
  return null;
}

// paths as turning points; every cell between them is path
const PATHS = [
  [[-8, 4], [-4, 4], [-4, 6], [2, 6], [2, 8], [6, 8]],          // 1 down the hill to the quay
  [[103, 9], [106, 9], [106, 7]],                                // 5 up from the beach
  [[135, 9], [137, 9], [137, 7]],                                // 6 into the orchard
  [[232, 9], [237, 9], [237, 7], [250, 7], [250, 5], [255, 5], [261, 5], [261, 4]]   // 10, 11 the road home
];
const cellsOf = pts => {
  const out = [pts[0]];
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
    for (let s = 1; s <= n; s++) out.push([ax + Math.sign(bx - ax) * s, az + Math.sign(bz - az) * s]);
  }
  return out;
};
const HOUSES = [[-13, 1, 3, 2, 3], [-9, 1, 3, 2, 3], [-4, 0, 3, 2, 3], [1, 2, 3, 2, 2], [6, 1, 3, 2, 3], [-12, 5, 2, 2, 2]];   // x, z, w, d, h
const TREES = [[-6, 7], [-1, 3], [9, 6], [-14, 4], [116, 2], [241, 5], [268, 3]];
const FRUIT_TREES = [[139, 5], [140, 2], [144, 5], [147, 2], [134, 5], [149, 6]];
const TOWER = [4, 5];                    // the town's little stone tower
const LIGHTHOUSE = [37, 3];
const HUT = [33, 4];                     // keeper's hut, 2 x 2, door at (34, 5)
const HOME = [259, 1, 4, 3, 3];          // Theo's white house, door at (261, 3)
const HOME_ROCK = [234, 6];              // "I know this rock" (2 x 2)

function buildGround() {
  const key = (x, z) => (x + 100) * 16 + z;
  const H = new Map(), TOP = new Map();
  for (let x = X_MIN; x <= X_MAX; x++) for (let z = 0; z < GZ; z++) {
    const l = land(x, z);
    H.set(key(x, z), l ? l.h : 0);
    if (l) TOP.set(key(x, z), l);
  }
  const flatten = (x0, z0, w, d, h) => {
    if (h == null) { h = 99; for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) h = Math.min(h, H.get(key(x, z))); }
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) H.set(key(x, z), h);
    return h;
  };
  for (const [x0, z0, w, d] of HOUSES) flatten(x0, z0, w, d);
  const homeY = flatten(HOME[0], HOME[1], HOME[2], HOME[3], H.get(key(HOME[0] + 1, HOME[1] + HOME[3])));
  flatten(HOME[0] - 2, HOME[1] + HOME[3], HOME[2] + 4, 2, homeY);   // a flat yard in front of the door
  const onPath = new Set();
  for (const p of PATHS) for (const [x, z] of cellsOf(p)) onPath.add(key(x, z));

  const cells = new Map();
  const put = (t, x, y, z) => cells.set(x + ',' + y + ',' + z, { t, x, y, z });
  const del = (x, y, z) => cells.delete(x + ',' + y + ',' + z);
  for (let x = X_MIN; x <= X_MAX; x++) for (let z = 0; z < GZ; z++) {
    const h = H.get(key(x, z)), l = TOP.get(key(x, z));
    if (!h) { put('water', x, 0, z); continue; }
    for (let y = 0; y < h; y++) put(y < h - 1 ? l.fill : onPath.has(key(x, z)) ? 'path' : l.top, x, y, z);
  }
  const house = ([x0, z0, w, d, h], wall, win, roof) => {
    const y0 = H.get(key(x0, z0)), front = z0 + d - 1, mid = x0 + (w >> 1);
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) for (let y = y0; y < y0 + h; y++) {
      let t = wall;
      if (z === front && x === mid && y === y0) t = 'door';
      else if (y === y0 + 1 && (z === front || x === x0 || x === x0 + w - 1) && (x + z) % 2 === 0) t = win;
      put(t, x, y, z);
    }
    for (let k = 0; ; k++) {                   // stepped gable roof with a small overhang
      const a = x0 - 1 + k, b = x0 + w - k;
      if (a > b) break;
      for (let x = a; x <= b; x++) for (let z = z0; z < z0 + d; z++) put(roof, x, y0 + h + k, z);
    }
    return y0;
  };
  for (const h of HOUSES) house(h, 'brick', 'window', 'roof');
  house(HOME, 'plaster', 'homeWindow', 'tile');
  const tree = (x, z, leaf, tall = 3) => {
    const y0 = H.get(key(x, z));
    for (let y = y0; y < y0 + tall; y++) put('log', x, y, z);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (dx || dz) put(leaf, x + dx, y0 + tall - 1, z + dz);
      if (!(dx && dz)) put(leaf, x + dx, y0 + tall, z + dz);
    }
    put(leaf, x, y0 + tall + 1, z);
  };
  for (const [x, z] of TREES) tree(x, z, 'leaf');
  for (const [x, z] of FRUIT_TREES) tree(x, z, 'fruitLeaf', 2);
  { const [x, z] = TOWER, y0 = H.get(key(x, z));
    for (let y = y0; y < y0 + 4; y++) put(y === y0 + 2 ? 'window' : 'stone', x, y, z);
    put('roof', x, y0 + 4, z); }
  { const [x, z] = LIGHTHOUSE, y0 = H.get(key(x, z));   // white and red bands, the lamp, a roof
    for (let y = y0; y < y0 + 7; y++) put(Math.floor((y - y0) / 2) % 2 ? 'brick' : 'whiteBrick', x, y, z);
    put('lamp', x, y0 + 7, z); put('roof', x, y0 + 8, z); }
  let hutY = 0;
  { const [x0, z0] = HUT; hutY = H.get(key(x0 + 1, z0 + 1));
    for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
      for (let y = Math.min(hutY, H.get(key(x, z))); y < hutY; y++) put('stone', x, y, z);
      put('plank', x, hutY, z); put(x === x0 && z === z0 + 1 ? 'window' : 'plank', x, hutY + 1, z); put('roof', x, hutY + 2, z);
    }
    for (let z = z0; z < z0 + 2; z++) { put('roof', x0 - 1, hutY + 2, z); put('roof', x0 + 2, hutY + 2, z); }
    del(x0 + 1, hutY, z0 + 1); }                // the door is its own mesh (it swings open)
  { const [x0, z0] = HOME_ROCK, y0 = H.get(key(x0, z0));
    for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) for (let y = y0; y < y0 + 2; y++) put('stone', x, y, z); }
  { const y = H.get(key(97, 0));               // a tiny far house with a lit window
    put('plaster', 96, y, 0); put('lamp', 97, y, 0); put('tile', 96, y + 1, 0); put('tile', 97, y + 1, 0); }
  const ground = (x, z) => H.get(key(x, z)) || 0;
  return { cells, ground, hutY, homeY };
}

// ---- story actions -------------------------------------------------------------------
// state: Theo (t, rot, lie, aboard), boat b {x, z, r, roll, bob}, props p {name: k}.
// An action is { dur, prep(st)?, run(st, k) }: run reads the state it starts
// from, then writes; it is a pure function of (start state, k).
const cloneSt = s => ({ t: s.t.slice(), rot: s.rot, lie: s.lie, aboard: s.aboard, b: Object.assign({}, s.b), p: Object.assign({}, s.p), kind: null });
function deck(st, lx = 1) {
  const { x, z, r, bob } = st.b;
  return [x + Math.cos(r) * lx, 2 + (bob || 0), ZB + z - Math.sin(r) * lx];
}
function stick(st) { if (st.aboard) { st.t = deck(st); st.rot = st.b.r + FACE_SEA; } }
const turn = (a, b) => a + ((((b - a) % (2 * PI)) + 3 * PI) % (2 * PI) - PI);

function makeActions(ground) {
  const P = ([x, z]) => [x, ground(x, z), wz(z)];
  const hopTo = (st, from, to, f, g, hop) => {
    st.t = [lerp(from[0], to[0], g), lerp(from[1], to[1], to[1] > from[1] ? Math.sqrt(f) : g * g) + hop * Math.sin(PI * f), lerp(from[2], to[2], g)];
    if (f < 1 && (to[0] !== from[0] || to[2] !== from[2])) st.rot = Math.atan2(to[0] - from[0], to[2] - from[2]);
  };
  return {
    walk(pts, step = STEP_TIME) {
      const cells = cellsOf(pts).map(P), n = cells.length - 1;
      return { dur: n * step, run(st, k) {
        const a = k * n, i = Math.min(n - 1, Math.floor(a)), f = k >= 1 ? 1 : a - i;
        const p0 = cells[i], p1 = cells[i + 1], dy = p1[1] - p0[1];
        hopTo(st, p0, p1, f, f, dy < 0 ? 0.25 - dy * 0.25 : dy > 0 ? dy + 0.3 : 0.22);
        st.kind = 'walk';
      } };
    },
    board() {
      return { dur: JUMP_TIME, run(st, k) {
        const from = st.t.slice(), to = deck(st);
        hopTo(st, from, to, k, ease(k), 1.4);
        st.kind = 'walk';
        if (k >= 1) { st.aboard = true; st.rot = st.b.r + FACE_SEA; }
      } };
    },
    ashore(cell) {
      const to = P(cell);
      return { dur: JUMP_TIME, run(st, k) {
        const from = deck(st);
        st.aboard = false;
        hopTo(st, from, to, k, ease(k), 1.4);
        st.kind = 'walk';
        if (k >= 1) st.rot = 0;
      } };
    },
    sail(toX, { zig = 0 } = {}) {
      const a = { dur: 1, prep(st) { a.dur = Math.max(1.5, Math.abs(toX - st.b.x) / SAIL_SPEED); },
        run(st, k) {
          const x0 = st.b.x, e = ease(k), w = Math.sin(PI * k), T = k * a.dur;
          st.b.x = lerp(x0, toX, e);
          st.b.z = zig * Math.sin(PI * k * 2) * w;
          st.b.roll = Math.sin(T * 4) * 0.05 * w;
          st.b.bob = Math.abs(Math.sin(T * 3)) * 0.12 * w;
          if (zig) st.b.r = -Math.cos(PI * k * 2) * 0.25 * w * Math.sign(zig);
          stick(st);
        } };
      return a;
    },
    boat(fn, dur) { return { dur, run(st, k) { fn(st.b, k); stick(st); } }; },
    prop(name, dur) { return { dur, run(st, k) { st.p[name] = k; } }; },
    face(rot, dur = 0.3) { return { dur, run(st, k) { st.rot = lerp(st.rot, turn(st.rot, rot), ease(k)); } }; },
    lie(to, dur) { return { dur, run(st, k) { st.lie = lerp(st.lie, to, ease(k)); } }; },
    wait(dur) { return { dur, run() {} }; },
    par(...acts) {
      const a = { dur: 0, prep(st) { acts.forEach(b => b.prep && b.prep(st)); a.dur = Math.max(...acts.map(b => b.dur)); },
        run(st, k) { for (const b of acts) b.run(st, clamp(k * a.dur / b.dur, 0, 1)); } };
      return a;
    }
  };
}

// the 21 story segments: event of page 1, travel 1 -> 2, event of page 2, ...
function script(A) {
  const { walk, board, ashore, sail, boat, prop, face, lie, wait, par } = A;
  return [
    // 1 the baker tosses Theo a loaf; he walks down to the quay, boards; the sail goes up
    [face(PI, 0.3), prop('loaf', 1.0), face(0, 0.3), walk([[2, 6], [2, 8], [6, 8]]), board(), prop('sail', 1.6)],
    [sail(36)],
    // 2 the keeper gives Theo a sack holding all the winds but the one that blows him home
    [prop('keeper', 3.2)],
    [sail(60)],
    // 3 a young dolphin is caught in a net; Theo cuts it free and its family leaps
    [prop('net', 3.6)],
    [sail(86)],
    // 4 home is in sight; Theo waves at it, a gull pecks the sack open, the winds blow him away
    [face(-0.6, 0.4), wait(0.3), par(prop('wind', 3.6), boat((b, k) => {
      const x0 = b.x, u = sub(k, 0.5, 1);
      b.x = x0 - 3 * ease(u);
      b.r = -0.6 * Math.sin(PI * u);
      b.roll = Math.sin(k * 26) * 0.1 * Math.sin(PI * u);
    }, 3.6)), face(FACE_SEA - 0.87, 0.3)],
    [sail(101, { zig: 1.3 }), ashore([103, 9])],
    // 5 the hungry giant: Theo shares his bread, the giant gives him soft wool and points the way
    [walk([[103, 9], [106, 9], [106, 7]]), face(2.45), prop('giant', 4.2)],
    [walk([[106, 7], [106, 9], [103, 9]]), board(), sail(133), ashore([135, 9])],
    // 6 sleepy in the orchard; a bee buzzes him awake; he picks fruit and runs back to the boat
    [walk([[135, 9], [137, 9], [137, 7]]), face(0), lie(1, 0.6), wait(0.4), prop('bee', 2.2), lie(0, 0.3), prop('fruit', 0.6), walk([[137, 7], [137, 9], [135, 9]], RUN_TIME), board()],
    [sail(160)],
    // 7 the seals' song makes sailors forget home: Theo plugs his ears with the giant's wool
    [prop('song', 1.8), par(prop('hat', 0.8), prop('song2', 1.6))],
    [prop('hatOff', 0.6), sail(185)],
    // 8 the whirlpool spins the boat; Theo throws fruit to the octopus, she pulls him free
    [par(prop('whirl', 3.4), boat((b, k) => {
      const q = sub(k, 0, 0.65), u = sub(k, 0.65, 1);
      if (k < 0.65) {
        const th = PI + 3 * PI * ease(q), r = 3 - 1.5 * q;
        b.x = 188 + r * Math.cos(th); b.z = r * Math.sin(th) * 0.6; b.r = -(th - PI);
      } else {
        b.x = lerp(189.5, 191, ease(u)); b.z = 0; b.r = u >= 1 ? 0 : -3 * PI - PI * ease(u);
      }
      b.roll = Math.sin(k * 30) * 0.06 * Math.sin(PI * k);
    }, 3.4))],
    [sail(210)],
    // 9 the storm: the mast snaps; the dolphins he freed come and push the boat to shore
    [par(prop('storm', 4), boat((b, k) => {
      const w = Math.sin(PI * k);
      b.roll = Math.sin(k * 34) * 0.24 * w;
      b.bob = Math.abs(Math.sin(k * 17)) * 0.5 * w;
    }, 4))],
    [sail(230), ashore([232, 9])],
    // 10 he knows this rock, this tree: it is his own island
    [walk([[232, 9], [237, 9]]), face(-2.36, 0.4), wait(0.5), face(2.36, 0.5), wait(0.5), face(0, 0.4)],
    [walk([[237, 9], [237, 7], [250, 7], [250, 5], [255, 5]], RUN_TIME)],
    // 11 Argos races down to meet him; the lamps come on
    [par(walk([[255, 5], [259, 5]], RUN_TIME), prop('home', 3))]
  ];
}

// ---- the world -------------------------------------------------------------------------
G.register('longway', function (renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(LIGHT[0].bg);
  scene.fog = new THREE.Fog(LIGHT[0].bg, 60, 140);
  scene.environment = G.env(renderer);
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.5, 400);

  const sun = new THREE.DirectionalLight(0xfff4e6, 2.3);
  sun.castShadow = TIER > 0;
  sun.shadow.mapSize.set(TIER > 1 ? 2048 : 1024, TIER > 1 ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 2, far: 90 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  const hemi = new THREE.HemisphereLight(0xf4f6ff, 0x8a7a60, 0.8);
  scene.add(sun, sun.target, hemi);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(700, 300).rotateX(-PI / 2),
    new THREE.MeshStandardMaterial({ color: '#ebe6dc', roughness: 0.6 }));
  table.position.x = 130;
  table.receiveShadow = true; scene.add(table);

  const { cells, ground, hutY, homeY } = buildGround();
  const shadowy = m => { m.castShadow = m.receiveShadow = true; return m; };
  const cube = (mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = shadowy(new THREE.Mesh(box, mat)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };

  // one instanced mesh per cube type; cubes boxed in on all six sides are skipped
  const byType = {};
  for (const c of cells.values()) {
    const hidden = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
      .every(([dx, dy, dz]) => c.y + dy < 0 || cells.has((c.x + dx) + ',' + (c.y + dy) + ',' + (c.z + dz)));
    if (!hidden) (byType[c.t] = byType[c.t] || []).push(c);
  }
  const groups = Object.entries(byType).map(([t, list]) => {
    const mesh = new THREE.InstancedMesh(box, skin(t), list.length);
    mesh.castShadow = mesh.receiveShadow = true;
    // bounds are taken while the cubes are hidden / in the air: never cull,
    // or whole cube types vanish once the camera moves
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, list };
  });
  const m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  let introEnd = 0;
  // drop-in: cubes near the first camera stop fall in, bottom layer first;
  // the rest (off screen) and the columns under Theo and the boat are there at once
  function planIntro(camX, keep) {
    introEnd = 0;
    for (const { list } of groups) for (const c of list) {
      const dx = Math.abs(c.x - camX);
      c.d = dx > DROP_RANGE || keep(c.x, c.z) ? -1 : INTRO_DELAY + c.y * 0.12 + (dx * 0.03 + c.z * 0.05) * 0.6;
      introEnd = Math.max(introEnd, c.d + DROP_TIME);
    }
  }
  function placeCubes(t) {
    for (const { mesh, list } of groups) {
      list.forEach((c, i) => {
        const k = (t - c.d) / DROP_TIME;
        if (k <= 0) mesh.setMatrixAt(i, zero);
        else m4.makeTranslation(c.x, c.y + 0.5 + DROP_H * Math.pow(1 - Math.min(1, k), 2), wz(c.z)), mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---- the boat: plank hull, a rig (mast + white sail cubes) that can snap --------
  const boat = new THREE.Group();
  boat.rotation.order = 'YXZ';
  scene.add(boat);
  for (let dx = -2; dx <= 2; dx++) for (const dz of [-0.5, 0.5]) for (let y = 1; y <= (Math.abs(dx) === 2 ? 2 : 1); y++) boat.add(cube(M('plank'), dx, y + 0.5, dz));
  const rig = new THREE.Group();
  rig.position.set(0, 2, 0);
  boat.add(rig);
  const mast = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.28, 4, 0.28), M('logSide')));
  mast.position.y = 2; rig.add(mast);
  const SAIL = [[-1, 1.5], [-1, 2.5], [-1, 3.5], [-2, 1.5], [-2, 2.5]];
  const sail = SAIL.map(([x, y]) => { const m = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.6), M('wool'))); m.position.set(x, y, 0); rig.add(m); return m; });
  // the wind-keeper's sack, carried in the boat from page 2
  const sack = new THREE.Group();
  sack.add(cube(M('sack'), 0, 0.28, 0, 0.55, 0.55, 0.55));
  const tie = cube(M('rope'), 0, 0.6, 0, 0.3, 0.12, 0.3);
  sack.add(tie);
  boat.add(sack);
  const SACK_LOCAL = new THREE.Vector3(-0.55, 2, 0.32);

  // ---- Theo ----------------------------------------------------------------------
  const theoFig = figure();
  const theo = theoFig.group;
  // the giant's wool, pushed into both ears on page 7
  const hat = new THREE.Group();
  for (const sd of [-1, 1]) hat.add(cube(M('wool'), sd * 0.44, -0.05, 0, 0.16, 0.3, 0.3));
  theoFig.head.add(hat);
  // things Theo carries: the baker's loaf, the giant's wool, the orchard fruit
  const bread = cube(M('bread'), 0, 0, 0, 0.5, 0.3, 0.32);
  const woolBall = cube(M('wool'), 0, 0, 0, 0.36, 0.3, 0.3);
  const fruit = cube(M('fruit'), 0, 0, 0, 0.32, 0.32, 0.32);
  const half = cube(M('bread'), 0, 0, 0, 0.26, 0.3, 0.32);   // the half he breaks off for the giant
  scene.add(theo, bread, woolBall, fruit, half);
  const HAND_R = new THREE.Vector3(0.5, 0.55, 0.3), HAND_L = new THREE.Vector3(-0.5, 0.55, 0.3);   // at his sides, below the head
  // the baker at the door of the house above Theo's start
  const baker = figure({ body: 'wool' });
  const BAKER = [2, 4];
  baker.group.position.set(BAKER[0], ground(BAKER[0], BAKER[1]), wz(BAKER[1]));
  scene.add(baker.group);
  // page 3: a fishing net floating on the water, a young dolphin caught in it
  const NET = [63.5, ZB - 2.4];
  const net = new THREE.Group();
  net.position.set(NET[0], 1.06, NET[1]);
  for (let i = -2; i <= 2; i++) { net.add(cube(M('rope'), i * 0.5, 0, 0, 0.06, 0.06, 2.2)); net.add(cube(M('rope'), 0, 0, i * 0.5, 2.2, 0.06, 0.06)); }
  for (const [x, z] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) net.add(cube(M('plank'), x, 0.05, z, 0.22, 0.18, 0.22));   // floats
  scene.add(net);

  // ---- people and animals ----------------------------------------------------------
  const keeper = figure({ body: 'keeperBody', face: 'keeperFace', side: 'keeperSide', top: 'navy', back: 'keeperSide' });
  scene.add(keeper.group);
  const door = new THREE.Group();                  // hinge on the door's left edge
  door.position.set(HUT[0] + 0.5, hutY, wz(HUT[1] + 1) + 0.5);
  door.add(cube(M('door'), 0.5, 0.5, -0.06, 1, 1, 0.12));
  scene.add(door);

  const dolphins = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    g.add(cube(M('dolphin'), 0, 0, 0, 1.6, 0.55, 0.55), cube(M('dolphinFace'), 1.05, 0, 0, 0.5, 0.45, 0.45),
      cube(M('dolphin'), 0, 0.42, 0, 0.45, 0.35, 0.15), cube(M('dolphin'), -1.0, 0.1, 0, 0.3, 0.2, 0.7));
    scene.add(g); return g;
  });

  const gull = new THREE.Group();
  gull.add(cube(M('gull'), 0, 0, 0, 0.7, 0.35, 0.35), cube(M('sand'), 0.42, -0.02, 0, 0.18, 0.1, 0.12));
  const wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.z = sd * 0.15; w.add(cube(M('gull'), 0, 0, sd * 0.4, 0.4, 0.06, 0.8)); gull.add(w); return w; });
  scene.add(gull);
  const cloud = new THREE.Group();
  cloud.position.set(93, 5.5, wz(6));
  cloud.rotation.y = -0.5;
  cloud.add(shadowy(new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 1.6), [M('wool'), M('wool'), M('wool'), M('wool'), M('windFace'), M('wool')])));
  for (const [x, y, z, s] of [[-1.7, 0.3, 0, 1.3], [1.7, 0.2, 0, 1.2], [0, 1.5, 0, 1.3], [-1, 1.2, -0.3, 1], [1.1, 1.1, -0.2, 1], [-2.6, -0.3, 0.2, 0.8]]) cloud.add(cube(M('wool'), x, y, z, s, s, s));
  scene.add(cloud);
  const streaks = Array.from({ length: 7 }, () => { const m = cube(M('wool'), 0, 0, 0, 1.6, 0.14, 0.14); m.castShadow = false; scene.add(m); return m; });

  const giant = new THREE.Group();
  const GIANT_Y = 3;                     // tune: how high on the back slope he stands
  giant.position.set(113, GIANT_Y - 4, wz(0) - 1.8);
  giant.add(cube(M('tunic'), 0, 3.2, 0, 2.6, 3, 1.5), cube(M('tunic'), -0.6, 0.9, 0, 0.9, 1.8, 0.9), cube(M('tunic'), 0.6, 0.9, 0, 0.9, 1.8, 0.9));
  const gFaceAwake = M('giantAwake'), gFaceSleep = M('giantSleep');
  const gHeadMats = [M('giantSide'), M('giantSide'), M('giantHair'), M('giantSide'), gFaceSleep, M('giantHair')];
  const gHead = shadowy(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), gHeadMats));
  gHead.position.y = 5.7; giant.add(gHead);
  const arms = [-1, 1].map(sd => {
    const a = new THREE.Group(); a.position.set(sd * 1.7, 4.5, 0);
    a.add(cube(M('tunic'), 0, -0.6, 0, 0.8, 1.2, 0.8), cube(M('gskin'), 0, -1.75, 0, 0.75, 1.1, 0.75));
    giant.add(a); return a;
  });
  scene.add(giant);
  const SHEEP = [[108, 6], [117, 5], [119, 7]];
  const sheep = SHEEP.map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, ground(x, z), wz(z)); g.rotation.y = i % 2 ? -0.6 : 0.5;
    g.add(cube(M('wool'), 0, 0.55, 0, 1, 0.75, 0.7));
    const hd = cube(M('sheepFace'), 0.62, 0.7, 0, 0.42, 0.42, 0.42);
    hd.material = [M('wool'), M('wool'), M('wool'), M('wool'), M('wool'), M('wool')];
    hd.material[0] = M('sheepFace');
    g.add(hd);
    for (const [lx, lz] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]]) g.add(cube(M('storm'), lx, 0.1, lz, 0.18, 0.2, 0.18));
    scene.add(g); return { g, hd };
  });

  const bee = new THREE.Group();
  bee.add(cube(M('bee'), 0, 0, 0, 0.32, 0.22, 0.22), cube(M('glass'), 0, 0.16, 0, 0.12, 0.04, 0.34));
  scene.add(bee);

  const SEALS = [[159, 3, 0.4], [161, 5, -0.5], [167, 5, 0.2]];
  const seals = SEALS.map(([x, z, r]) => {
    const g = new THREE.Group(); g.position.set(x, ground(x, z), wz(z)); g.rotation.y = r;
    g.add(cube(M('grey'), 0, 0.3, 0, 0.6, 0.6, 1.3));
    const hd = new THREE.Group(); hd.position.set(0, 0.85, 0.5);
    hd.add(shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), [M('grey'), M('grey'), M('grey'), M('grey'), M('sealFace'), M('grey')])));
    g.add(hd);
    scene.add(g); return { g, hd };
  });
  const NOTE_MATS = ['brick', 'lamp', 'water', 'octo'].map(M);
  const notes = Array.from({ length: 9 }, (_, i) => { const m = cube(NOTE_MATS[i % 4], 0, 0, 0, 0.25, 0.25, 0.25); m.castShadow = false; scene.add(m); return m; });

  const whirl = new THREE.Group();
  whirl.position.set(188, 1.02, ZB);
  for (const [r, n] of [[1, 6], [2, 12], [3, 18]]) for (let i = 0; i < n; i++) {
    const a = i / n * 2 * PI + r, m = new THREE.Mesh(box, M('deep'));
    m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.6); m.rotation.y = -a; m.scale.set(0.95, 0.08, 0.7);
    m.receiveShadow = true; whirl.add(m);
  }
  scene.add(whirl);
  const octo = new THREE.Group();
  octo.position.set(191.5, -3, wz(7));
  octo.add(shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.6), [M('octo'), M('octo'), M('octo'), M('octo'), M('octoFace'), M('octo')])));
  octo.children[0].position.y = 1.6;
  const tentacles = [0, 1, 2, 3, 4].map(i => {
    const a = new THREE.Group(), ang = -0.3 + i * (PI + 0.6) / 4;   // spread round the front
    a.position.set(0, 0.85, 0); a.rotation.y = -ang + PI / 2;
    for (let s = 0; s < 3; s++) a.add(cube(M('octo'), 0, 0, 0.6 + s * 0.55, 0.42 - s * 0.08, 0.36 - s * 0.06, 0.55));
    octo.add(a); return a;
  });
  scene.add(octo);

  // the storm: extra water cubes stacked as waves, a moon behind dark clouds
  const W_X0 = 199, W_X1 = 225, W_UP = 3;
  const waves = new THREE.InstancedMesh(box, M('water'), (W_X1 - W_X0 + 1) * GZ * W_UP);
  waves.frustumCulled = false; waves.castShadow = waves.receiveShadow = true;
  scene.add(waves);
  const moon = cube(new THREE.MeshStandardMaterial({ map: K.tex('moon'), emissive: new THREE.Color('#f4f0d0'), emissiveIntensity: 0.9, emissiveMap: K.tex('moon') }), 214, 12, wz(0) - 4, 2.4, 2.4, 0.6);
  moon.castShadow = false; scene.add(moon);
  const stormClouds = new THREE.Group();
  for (const [x, y, s] of [[-2, 0.4, 2], [0, 0.9, 2.4], [2.2, 0.3, 1.8], [-4, 0, 1.6], [4, 0.7, 1.6], [1, -0.6, 1.6]]) stormClouds.add(cube(M('storm'), x, y, 0, s * 1.3, s * 0.7, 1));
  stormClouds.position.set(213, 11.8, wz(0) - 2.8);
  scene.add(stormClouds);

  // home: mum and dad at the door, Argos the dog
  const mum = figure({ body: 'mumBody', face: 'mumFace', side: 'mumSide', top: 'mumHair', back: 'mumHair' });
  const dad = figure({ body: 'dadBody', face: 'dadFace' });
  mum.group.position.set(262, homeY, wz(4)); dad.group.position.set(260, homeY, wz(4));
  mum.group.rotation.y = -0.4; dad.group.rotation.y = -0.2;
  scene.add(mum.group, dad.group);
  const dog = new THREE.Group();
  dog.add(cube(M('fur'), 0, 0.42, 0, 0.5, 0.42, 0.95), cube(M('fur'), 0, 0.75, 0.48, 0.45, 0.42, 0.42), cube(M('fur'), 0, 0.62, -0.5, 0.12, 0.12, 0.35));
  dog.children[1].material = [M('fur'), M('fur'), M('fur'), M('fur'), M('dogFace'), M('fur')];
  for (const [lx, lz] of [[-0.16, -0.32], [0.16, -0.32], [-0.16, 0.32], [0.16, 0.32]]) dog.add(cube(M('fur'), lx, 0.1, lz, 0.14, 0.22, 0.14));
  scene.add(dog);
  const DOG_PATH = [[261, 4], [261, 5], [260, 5]].map(([x, z]) => [x, ground(x, z), wz(z)]);
  const winMat = M('homeWindow');

  // ---- the story --------------------------------------------------------------------
  const A = makeActions(ground);
  const st0 = { t: [2, ground(2, 6), wz(6)], rot: 0, lie: 0, aboard: false, b: { x: 7, z: 0, r: 0, roll: 0, bob: 0 }, p: {}, kind: null };
  const SEGS = script(A).map(acts => ({ acts }));
  { let st = cloneSt(st0);
    for (const seg of SEGS) {
      seg.start = cloneSt(st);
      let t = 0;
      for (const a of seg.acts) {
        if (a.prep) a.prep(st);
        a.t0 = t; a.snap = cloneSt(st);
        a.run(st, 1); st.kind = null;
        t += a.dur;
      }
      seg.dur = Math.max(0.3, t);
    }
    SEGS.end = cloneSt(st); }
  const N = SEGS.length;           // 21
  function evalAt(s) {
    s = clamp(s, 0, N);
    const i = Math.min(N - 1, Math.floor(s)), seg = SEGS[i], lt = (s - i) * seg.dur;
    if (lt <= 0) return cloneSt(seg.start);
    let a = seg.acts[0];
    for (const b of seg.acts) if (b.t0 < lt) a = b;
    const st = cloneSt(a.snap);
    a.run(st, clamp((lt - a.t0) / a.dur, 0, 1));
    return st;
  }

  // ---- apply a state to the scene ------------------------------------------------------
  const v3 = new THREE.Vector3();
  const BG = LIGHT.map(l => new THREE.Color(l.bg)), SUNC = LIGHT.map(l => new THREE.Color(l.sun));
  let camX = CAM_X[0], flash = 0;
  function setLight(i, j, e) {
    const a = LIGHT[i], b = LIGHT[j];
    scene.background.lerpColors(BG[i], BG[j], e);
    scene.fog.color.copy(scene.background);
    sun.color.lerpColors(SUNC[i], SUNC[j], e);
    sun.intensity = lerp(a.si, b.si, e) + flash * 3;
    hemi.intensity = lerp(a.hemi, b.hemi, e) + flash * 1.5;
    scene.environmentIntensity = lerp(a.env, b.env, e);
    sun.position.set(camX - 14, lerp(a.el, b.el, e), 18);
    sun.target.position.set(camX, 0, 0);
  }
  function placeStage(s) {
    const i = Math.min(N - 1, Math.floor(s)), f = s - i;
    const sec = i >> 1, travel = i % 2 === 1, e = travel ? ease(f) : 0;
    const j = travel ? sec + 1 : sec;
    camX = lerp(CAM_X[sec], CAM_X[j], e);
    setLight(sec, j, e);
  }
  let lastWaves = '';
  function apply(st, dir) {
    const p = st.p, b = st.b;
    boat.position.set(b.x, b.bob || 0, ZB + b.z);
    boat.rotation.set(b.roll || 0, b.r, 0);
    // sail stacks up cube by cube (page 1); the mast snaps in the storm (page 9)
    sail.forEach((m, k) => { const v = easeBack(((p.sail || 0) * 1.6 - k * 0.22) / 0.4); m.visible = v > 0.001; m.scale.setScalar(Math.max(0.001, v)); });
    rig.rotation.x = -1.35 * ease(sub(p.storm || 0, 0.45, 0.55));
    boat.updateMatrixWorld(true);

    // Theo (walking backwards when the story runs back: turn him round)
    const back = dir < 0 && st.kind === 'walk';
    theo.position.set(st.t[0], st.t[1] + 0.3 * st.lie, st.t[2]);
    theo.rotation.set(-st.lie * PI / 2, st.rot + (back ? PI : 0), 0);
    const hatOn = p.hat || 0, hatOff = p.hatOff || 0;
    hat.visible = hatOn > 0.3 && hatOff < 1;
    hat.scale.setScalar(Math.max(0.001, ease(sub(hatOn, 0.3, 1)) * (1 - ease(hatOff))));
    theo.updateMatrixWorld(true);
    const handR = theo.localToWorld(HAND_R.clone()), handL = theo.localToWorld(HAND_L.clone());

    // 1 the baker waves and tosses the loaf; Theo carries it until page 5
    const lk = p.loaf || 0;
    baker.group.rotation.z = 0.2 * Math.sin(sub(lk, 0, 0.3) * PI * 2);
    const bakerHand = v3.set(BAKER[0] + 0.45, ground(BAKER[0], BAKER[1]) + 0.9, wz(BAKER[1]) + 0.3).clone();

    // 2 the keeper: door swings open, he steps out, the sack arcs into the boat
    const kp = p.keeper || 0;
    door.rotation.y = -1.6 * ease(sub(kp, 0, 0.15)) * (1 - ease(sub(kp, 0.9, 1)) * 0.8);
    keeper.group.visible = kp > 0.08;
    const kz = lerp(HUT[1] + 1, HUT[1] + 3, ease(sub(kp, 0.12, 0.45))), kx = HUT[0] + 1;
    const kzc = Math.round(kz);
    keeper.group.position.set(kx, ground(kx, Math.min(kzc, HUT[1] + 3)) + 0.15 * Math.abs(Math.sin(sub(kp, 0.12, 0.45) * PI * 4)), wz(kz));
    keeper.group.rotation.set(0, 0.25 * Math.sin(sub(kp, 0.85, 1) * PI * 3), 0);
    const give = sub(kp, 0.5, 0.85);
    sack.visible = kp > 0.08;
    if (give < 1) {
      v3.set(keeper.group.position.x + 0.45, keeper.group.position.y + 0.8, keeper.group.position.z + 0.3);
      if (give > 0) {
        const to = boat.localToWorld(SACK_LOCAL.clone());
        v3.lerp(to, ease(give)); v3.y += 2.2 * Math.sin(PI * give);
      }
      sack.position.copy(boat.worldToLocal(v3));
    } else sack.position.copy(SACK_LOCAL);
    sack.rotation.set(0, 0, 0);

    // 3 the young dolphin wriggles in the net; Theo cuts the net (it sinks
    // away), the dolphin and its family leap off. Page 9: the same dolphins
    // come back and push the broken boat to the shore.
    const nk = p.net || 0, cut = sub(nk, 0.25, 0.4), leap = sub(nk, 0.4, 1);
    net.visible = cut < 1;
    net.scale.setScalar(Math.max(0.001, 1 - ease(cut)));
    net.position.y = 1.06 - 0.6 * cut;
    theo.rotation.x += nk > 0 && nk < 0.4 ? -0.5 * Math.sin(PI * sub(nk, 0, 0.4)) : 0;   // he leans over the side
    const escort = (p.storm || 0) > 0.6 && st.aboard;
    dolphins.forEach((g, j) => {
      g.rotation.set(0, 0, 0);
      if (escort) {                                   // nudging the boat along, one each side and one behind
        const e = ease(sub(p.storm, 0.6, 0.85));
        g.visible = e > 0;
        const [dx, dz] = [[-3, 0.2], [0.5, 1.4], [0.5, -1.4]][j];
        g.position.set(b.x + dx, lerp(-0.5, 0.75 + 0.2 * Math.sin(b.x * 3 + j * 2), e), ZB + b.z + dz);
        return;
      }
      if (nk < 0.4) {                                 // only the young one, caught in the net
        g.visible = j === 0;
        g.position.set(NET[0], 1.0, NET[1]);
        g.rotation.set(0.25 * Math.sin(nk * 60), 0.4 * Math.sin(nk * 40), 0);
        return;
      }
      const u = leap * 2.4 - j * 0.2, ph = u - Math.floor(u), y = 0.5 + 2.1 * Math.sin(PI * ph);
      g.visible = u > 0 && u < 2 && leap < 1 && y > 0.75;
      g.position.set(NET[0] + leap * 8 + j * 1.6, y, NET[1] - j * 0.9);
      g.rotation.set(0, 0, (0.5 - ph) * 1.8);
    });

    // 4 the gull pecks the sack open; the wind cloud blows
    const wk = p.wind || 0;
    const sackWorld = boat.localToWorld(SACK_LOCAL.clone()).add(new THREE.Vector3(0, 0.6, 0));
    const gIn = sub(wk, 0, 0.35), gOut = sub(wk, 0.45, 0.65);
    gull.visible = wk > 0 && wk < 0.65;
    if (gOut > 0) gull.position.copy(sackWorld).lerp(v3.set(80, 10, ZB - 5), ease(gOut));
    else gull.position.copy(v3.set(95, 10, ZB - 3)).lerp(sackWorld, ease(gIn));
    gull.rotation.set(0, gOut > 0 ? 2.6 : PI, wk > 0.35 && wk < 0.45 ? 0.5 * Math.sin(wk * 300) : 0);
    wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * 0.7 * Math.sin(wk * 60); });
    const opened = sub(wk, 0.38, 0.45);
    tie.visible = opened < 1;
    tie.position.set(0, 0.6 + 1.5 * opened, 0);
    sack.children[0].scale.set(0.55, 0.55 * (1 - 0.3 * opened), 0.55);
    const cg = ease(sub(wk, 0.4, 0.6));
    cloud.visible = cg > 0;
    cloud.scale.setScalar(Math.max(0.001, cg));
    const blow = sub(wk, 0.5, 1);
    streaks.forEach((m, j) => {
      const u = (blow * 3 + j * 0.17) % 1;
      m.visible = blow > 0 && blow < 1;
      m.position.set(91 - u * 11, 2.6 + (j % 3) * 0.6, ZB - 1.5 + (j % 4) * 0.5);
    });

    // 5 the giant rises, opens his eye, takes the bread and points the way
    const gk = p.giant || 0;
    // he stands on the far slope of the hill: risen, his hands are above the top
    giant.position.y = GIANT_Y - 4 * (1 - ease(sub(gk, 0, 0.25)));
    gHeadMats[4] = gk > 0.28 ? gFaceAwake : gFaceSleep;
    gHead.material = gHeadMats;
    gHead.rotation.z = 0.12 * Math.sin(sub(gk, 0.3, 0.4) * PI * 2);
    // his left arm comes forward for the bread, eats it (a nod), then gives wool
    arms[0].rotation.x = -1.5 * ease(sub(gk, 0.28, 0.36)) * (1 - ease(sub(gk, 0.84, 0.92)));
    arms[1].rotation.z = 1.5 * ease(sub(gk, 0.86, 1));
    gHead.rotation.x = 0.25 * Math.sin(PI * sub(gk, 0.56, 0.66));
    giant.updateMatrixWorld(true);
    const hand = arms[0].localToWorld(new THREE.Vector3(0, -2.3, 0));
    // the loaf: tossed by the baker (page 1), carried, given to the giant (page 5)
    const bk = sub(gk, 0.36, 0.56);
    // he breaks the loaf in two: one half flies to the giant, he keeps the other for home
    const halved = gk > 0.36;
    bread.visible = lk > 0;
    bread.scale.set(halved ? 0.26 : 0.5, 0.3, 0.32);
    half.visible = halved && bk < 1;
    half.position.copy(handR).lerp(hand, ease(bk)); half.position.y += 3.5 * Math.sin(PI * bk);
    if (lk < 1) { const f = ease(sub(lk, 0.3, 0.8)); bread.position.copy(bakerHand).lerp(handR, f); bread.position.y += 1.2 * Math.sin(PI * f); }
    else bread.position.copy(handR);
    // the wool: from the giant's hand to Theo (page 5), into his ears (page 7)
    const wk2 = sub(gk, 0.64, 0.86);
    woolBall.visible = gk > 0.64 && hatOn < 0.3;
    woolBall.position.copy(hand).lerp(handL, ease(wk2)); woolBall.position.y += 3.5 * Math.sin(PI * wk2);
    if (hatOn > 0) woolBall.position.copy(handL).lerp(theo.localToWorld(new THREE.Vector3(0, 1.4, 0)), ease(sub(hatOn, 0, 0.3)));
    sheep.forEach(({ hd }, i) => { hd.position.y = 0.7 - 0.25 * Math.max(0, Math.sin(gk * PI * 6 + i)); });

    // 6 the bee buzzes round sleepy Theo's head
    const bz = p.bee || 0;
    bee.visible = bz > 0 && bz < 1;
    const head = [137, ground(137, 7) + 0.35, wz(7) - 1.4];
    if (bz < 0.2) bee.position.set(lerp(139, head[0], ease(bz / 0.2)), lerp(ground(139, 5) + 3.5, head[1] + 0.6, ease(bz / 0.2)), lerp(wz(5), head[2], ease(bz / 0.2)));
    else if (bz < 0.8) { const a = (bz - 0.2) / 0.6 * PI * 6; bee.position.set(head[0] + Math.cos(a) * 0.8, head[1] + 0.6 + 0.2 * Math.sin(a * 3), head[2] + Math.sin(a) * 0.8); }
    else bee.position.set(head[0] + (bz - 0.8) * 20, head[1] + 0.6 + (bz - 0.8) * 15, head[2]);
    bee.rotation.y = bz * 40;

    // the fruit: picked in the orchard (page 6), thrown to the octopus (page 8)
    const fk = p.fruit || 0, ok0 = p.whirl || 0, throwK = sub(ok0, 0.42, 0.56);
    fruit.visible = fk > 0 && throwK < 1;
    fruit.scale.setScalar(Math.max(0.001, 0.32 * ease(fk)));   // cube() sized it by scale: keep 0.32
    if (throwK > 0) {
      octo.updateMatrixWorld(true);
      const mouth = octo.localToWorld(new THREE.Vector3(0, 1.2, 0.9));
      fruit.position.copy(handR).lerp(mouth, ease(throwK)); fruit.position.y += 2 * Math.sin(PI * throwK);
    } else fruit.position.copy(handR);

    // 7 the seals sing: heads sway, coloured notes float up
    const song = Math.max(p.song || 0, 0) + (p.song2 || 0);
    const singing = (p.song || 0) > 0 && (p.song2 || 0) < 1;
    seals.forEach(({ hd }, i) => { hd.rotation.x = singing ? -0.35 - 0.2 * Math.sin(song * 18 + i) : 0; });
    notes.forEach((m, j) => {
      const sl = SEALS[j % 3], u = (song * 1.6 + j * 0.37) % 1;
      m.visible = singing;
      m.position.set(sl[0] + 0.6 * Math.sin(u * 8 + j), ground(sl[0], sl[1]) + 1.2 + u * 3, wz(sl[1]) + 0.5);
      m.rotation.set(0, u * 6, u * 3);
    });

    // 8 the whirlpool turns; the octopus rises and nudges the boat free
    const ok = p.whirl || 0;
    whirl.rotation.y = -ok * 8 * PI;
    whirl.scale.setScalar(1 - 0.5 * ease(sub(ok, 0.8, 1)));
    octo.position.y = lerp(-3, 0, ease(sub(ok, 0.25, 0.42)));
    octo.visible = ok > 0.25;
    tentacles.forEach((t, i) => { t.rotation.x = (i === 2 ? -0.5 * Math.sin(PI * sub(ok, 0.62, 0.85)) : 0) + 0.12 * Math.sin(ok * 20 + i); });

    // 9 the storm: waves rise and fall, lightning, clouds part from the moon
    const sk = p.storm || 0;
    flash = Math.max(0, 1 - Math.abs(sk - 0.3) * 30) + Math.max(0, 1 - Math.abs(sk - 0.52) * 30);
    const amp = sk < 0.5 ? lerp(1.2, 3, ease(sk / 0.5)) : lerp(3, 0.3, ease((sk - 0.5) / 0.5)), phase = sk * 14;
    const wkey = amp.toFixed(2) + phase.toFixed(2) + Math.round(b.x);
    if (wkey !== lastWaves) {
      lastWaves = wkey;
      let n = 0;
      for (let x = W_X0; x <= W_X1; x++) for (let z = 0; z < GZ; z++) {
        const edge = Math.min(1, (x - W_X0) / 4, (W_X1 - x) / 4);
        const calm = Math.abs(x - b.x) < 4 && z >= 8 ? 0 : 1;
        const hgt = Math.round(amp * edge * calm * (0.5 + 0.5 * Math.sin(x * 0.7 - phase + z * 0.35)));
        for (let y = 0; y < W_UP; y++) {
          if (y < hgt) m4.makeTranslation(x, 1.5 + y, wz(z)), waves.setMatrixAt(n, m4);
          else waves.setMatrixAt(n, zero);
          n++;
        }
      }
      waves.instanceMatrix.needsUpdate = true;
    }
    stormClouds.position.x = 213 + 5 * ease(sk);

    // 11 Argos runs down to meet Theo and jumps for joy; the lamp has burned all night
    const hk = p.home || 0, run = sub(hk, 0.1, 0.5), jump = sub(hk, 0.5, 1);
    const di = Math.min(1, Math.floor(run * 2)), df = run >= 1 ? 1 : run * 2 - di;
    const d0 = DOG_PATH[di], d1 = DOG_PATH[di + 1];
    dog.position.set(lerp(d0[0], d1[0], df), lerp(d0[1], d1[1], df) + 0.25 * Math.sin(PI * df) + 0.6 * Math.abs(Math.sin(jump * PI * 4)), lerp(d0[2], d1[2], df));
    dog.rotation.y = run < 0.5 ? 0 : -PI / 2;
    winMat.emissiveIntensity = 1.8;   // the lamp Mum and Dad kept burning all night
    const wave = Math.sin(sub(hk, 0.5, 1) * PI * 4) * 0.25;
    mum.group.rotation.z = wave; dad.group.rotation.z = -wave;
  }

  // ---- state & stepping ---------------------------------------------------------------
  let t = 0, intro = true, introStarted = false, s = 0, target = 0, page = 0, dir = 1, dirty = true;
  const segDur = i => SEGS[clamp(i, 0, N - 1)].dur;
  function finish() { if (s !== target) { s = target; dirty = true; } }
  // every story step is its own page: page j rests at s = j, and turning
  // from page j to j + 1 plays segment j (an event or a journey). The
  // engine turns the pages; forward() / back() never keep an input.
  const LAST = N;                    // 22 pages: s = 0 .. 21
  function enter(i = 0) {
    page = clamp(i | 0, 0, LAST);
    s = target = page; dir = 1;
    if (!introStarted) {
      introStarted = true; t = 0; intro = true;
      const st = evalAt(s);
      const keep = (x, z) => (Math.abs(x - Math.round(st.t[0])) < 1 && Math.abs(wz(z) - st.t[2]) < 1) || (Math.abs(x - st.b.x) <= 3 && z >= 9);
      planIntro(CAM_X[Math.min(10, page >> 1)], keep);
      placeCubes(0);
    }
    dirty = true;
  }
  const forward = () => false, back = () => false;
  function show(j) {
    j = clamp(j | 0, 0, LAST);
    if (j === page) return;
    finish();
    if (Math.abs(j - page) > 1) s = j;            // a jump: no animation
    target = j; dir = j > page ? 1 : -1;
    page = j; dirty = true;
  }
  function update(dt) {
    t += dt;
    let moving = false;
    if (intro) { placeCubes(t); moving = true; if (t > introEnd + 0.05) { intro = false; placeCubes(1e9); } }
    if (s !== target) {
      moving = true;
      if (target > s) s = Math.min(target, s + dt / segDur(Math.floor(s)));
      else s = Math.max(target, s - dt / segDur(Math.ceil(s) - 1));
    }
    if (moving || dirty) { placeStage(s); apply(evalAt(s), dir); }
    const r = moving || dirty; dirty = false;
    return r;
  }

  // ---- camera -----------------------------------------------------------------------------
  let dist = 50, tx = 0, ty = 0, camKey = '';
  function resize(w, h, free = h) {
    camera.aspect = w / h;
    const tn = Math.tan(CAM_FOV * PI / 360);
    // fit the scene into the area above the caption (`free` px from the top);
    // on tall screens the open sea at the sides crops rather than shrinking
    const f = Math.max(0.4, Math.min(1, free / h));
    const halfW = camera.aspect < 1 ? 10.5 : 12.4;
    dist = Math.max((camera.aspect < 1 ? 9.2 : 10.2) / (tn * f), halfW / (tn * camera.aspect));
    // the target sits below the visual middle (roofs and trees stand tall): shift down
    camera.setViewOffset(w, h, 0, (h - free) / 2 - free * 0.13, w, h);
    // fog relative to the distance (a fixed fog washed phones out)
    scene.fog.near = dist * 1.4; scene.fog.far = dist * 3.2;
    camera.updateProjectionMatrix();
    camKey = '';
  }
  function placeCamera() {
    const pitch = CAM_PITCH + ty * 0.03, yaw = tx * 0.08;
    const key = pitch.toFixed(4) + yaw.toFixed(4) + dist.toFixed(2) + camX.toFixed(3);
    if (key === camKey) return false;
    camKey = key;
    camera.position.set(camX + Math.sin(yaw) * Math.cos(pitch) * dist, TARGET_Y + Math.sin(pitch) * dist, TARGET_Z + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(camX, TARGET_Y, TARGET_Z);
    return true;
  }

  return {
    scene, camera, enter, show, forward, back, resize,
    play() {},
    label: 'A world of toy building cubes on a table: Theo travels from his hill town across the sea and back home.',
    update(dt) { const a = update(dt); return placeCamera() || a; },
    tilt(x, y) { tx = clamp(x, -1, 1); ty = clamp(y, -1, 1); }
  };
});
})();
