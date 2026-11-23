// MY DAY: the town, the boy's walking route and every page's stop.
//
// One toy-diorama town on a wooden board (same look as books/city): the
// boy's house as a cutaway dollhouse (bedroom | bathroom | hall | kitchen,
// the front wall fades and the roof lifts when the camera flies in), the road
// with a zebra crossing, the school (a classroom), the playground (swings,
// slide, sand pit), the park with a pond, a little shop.
//
// The boy walks along ONE route (ROUTE, a polyline through the town in the
// order of the day). Each stop names the route node he stands at (`at`) and
// the pose he takes there (`base`). Turning the page walks him along the
// route to the new node (forwards or backwards), then he settles into the
// stop's pose. Every stop's `play(t, P, ctx)` is a pure function of time t
// (0 = rest pose, `dur` = end pose).
// Story steps (as books/longway): every page is one step, either `arrive` (he
// walks to the stop and settles into its rest pose) or `act` (the stop's
// routine plays from 0 to dur). setStep() plays a step forwards, back plays it
// in reverse (the routine runs back to 0, or he walks back and ends in the
// previous routine's end pose), `instant` sets a step's end state at once
// (page jumps). snap() lands a running step at its end.
(function () {
'use strict';
const C = window.MYDAY;
if (!C.THREE) return;
const {
  THREE, TIER, clamp, lerp, ease, easeOut, seg, bump, dAngle, canvas, tex, patternTex, labelTex, decal, softDot,
  paint, lamp, fader, M, mesh, box, rbox, cylY, cylX, cylZ, sphere, capsule, slab, part, bake, instanced, blob, seeded,
  LAYOUT: L, drawGround, makeKid, pose, blendPose, sitPose, sitLegsOut, walkPose, strideAmp, WALK_STRIDE, WALK_SPEED
} = C;
const V3 = THREE.Vector3;
const PI = Math.PI;

// --- key numbers -------------------------------------------------------------
const WALL_T = 0.12;          // wall thickness
// WALK_SPEED (kid.js): a natural child gait, ~0.53 units / s, matched to the leg cycle
const WALK_MAX_TIME = 2.2;    // s of walking per page; a longer route is skipped ahead
                              // (he starts this far from his spot, while the camera flies)
const DOOR_RUNUP = 0.5;       // ...unless a front door is near the end: then he starts this far before it
const DOOR_MAX_TIME = 2.8;    // (only if that walk is at most this long, s)
const DOOR_REACH = WALK_SPEED * DOOR_MAX_TIME - DOOR_RUNUP;
// the zebra crossing (route nodes 13 <-> 14, both kerbs right at the road edge):
// walked in full, briskly: CROSS_TIME s over the road at CROSS_CADENCE steps / s
// with a longer step (still a walk, no flight phase)
const CROSS_TIME = 3.0;
const CROSS_CADENCE = 2.4;
const DOOR_W = 0.84, DOOR_H = 1.75;          // house front door
const SCHOOL_DOOR_W = 0.5, SCHOOL_DOOR_H = 1.85;   // each of the school's two door leaves
const DOOR_NEAR = 1.35;       // a door swings open when he is this close
const DOOR_ANGLE = 1.45;      // how far it opens (rad, outwards)
const DOOR_RATE = 2.6;        // open / close speed (per s)
const BLEND_TIME = 0.55;      // s to settle from walking into a stop's pose
const MOUTH_BITE = 0.38;      // how far the mouth opens for a bite (small, no tongue)
const FADE_RATE = 2.2;        // front wall / roof fade speed (per s)
const ROOF_LIFT = 3.2;        // how high a roof lifts off when we look inside
const BED_TOP = L.house.floor + 0.44;      // mattress top
// the duvet: from the foot of the bed (x) back to `x0`, `h` above the mattress
const DUVET_FOOT = -17.34;
const DUVET = { made: { x0: -18.8, h: 0.2 }, sit: { x0: -18.44, h: 0.2 }, lie: { x0: -18.76, h: 0.27 } };
const CHAIR_SEAT = 0.32, TABLE_TOP = 0.55; // kitchen
const DESK_SEAT = 0.3, DESK_TOP = 0.52;    // classroom
const SWING_ROPE = L.swing.top - L.swing.seatY;
const SWING_AMP = 0.62, SWING_PERIOD = 1.9;
const BUBBLES = [8, 12, 16][TIER];
// classmates at their desks (they face the board, -x) and what each eats at lunch;
// t0 / per: when their first bite starts and how long one bite + chew takes
const CLASS_MATES = [
  { x: 3.85, z: -7.6, hy: -0.2, food: 'apple', t0: 0.4, per: 1.2,
    look: { shirt: 0xf0c23b, pants: 0x3a3f58, hair: 0x241710, hairStyle: 'curly', skin: 0x8a5a3c, iris: 0x3b2618 } },
  { x: 5.85, z: -7.6, hy: 0, food: 'banana', t0: 0.7, per: 1.35,
    look: { shirt: 0x7a5cc0, pants: 0x2f5a6a, hair: 0xd8a24a, hairStyle: 'pigtails', skin: 0xf1c9a5, iris: 0x4f86b0, tie: 0xe0457b } },
  { x: 5.85, z: -5.6, hy: 0.2, food: 'yogurt', t0: 0.25, per: 1.05,
    look: { shirt: 0x4f9a5a, pants: 0x3a3f58, hair: 0x1d1510, hairStyle: 'bob', skin: 0xd9a07a, iris: 0x2e2018, lip: 0x7a3e36 } }
];
const BOY_DAY = { shirt: 0xd9503f, pants: 0x37588f, shoes: 0x2d3a4a };
const BOY_LOOK = Object.assign({ outfit: 'pj', hair: 0x6a4126, hairStyle: 'tousled', skin: 0xeab48c, iris: 0x6a4a2a }, BOY_DAY);
const HF = L.house.floor, SF = L.school.floor;

// wallpapers / floors (small repeating canvases)
const PAPER = {
  bed: patternTex(64, 64, (g, w) => {
    g.fillStyle = '#a9c9e8'; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(255,255,255,.75)';
    [[12, 14], [44, 30], [24, 50], [54, 56]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.6, 0, PI * 2); g.fill(); });
  }, [6, 4]),
  bath: patternTex(32, 32, (g, w) => {
    g.fillStyle = '#e8f4f6'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#b9d6de'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, w);
  }, [10, 8]),
  hall: patternTex(32, 32, (g, w) => {
    g.fillStyle = '#f2d891'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#f7e6b4'; g.fillRect(0, 0, w * 0.4, w);
  }, [10, 1]),
  kitchen: patternTex(32, 32, (g, w) => {
    g.fillStyle = '#c4e6d1'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#e6f5ea'; g.fillRect(0, 0, w / 2, w / 2); g.fillRect(w / 2, w / 2, w / 2, w / 2);
  }, [12, 9]),
  class: patternTex(32, 32, (g, w) => {
    g.fillStyle = '#f3e3bd'; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(0,0,0,.04)'; g.fillRect(0, 0, w, 3);
  }, [8, 6])
};
const PLANKS = patternTex(64, 64, (g, w) => {
  g.fillStyle = '#c99d6b'; g.fillRect(0, 0, w, w);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? '#c0915e' : '#cfa575'; g.fillRect(0, i * 16, w, 15);
    g.fillStyle = 'rgba(70,40,20,.35)'; g.fillRect(0, i * 16 + 15, w, 1); g.fillRect((i * 23) % w, i * 16, 1, 15);
  }
}, [4, 3]);
const TILES = patternTex(32, 32, (g, w) => {
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#7fb0c8'; g.fillRect(0, 0, w / 2, w / 2); g.fillRect(w / 2, w / 2, w / 2, w / 2);
}, [6, 5]);
const MAT = {
  paper: k => paint(0xffffff, { map: PAPER[k], roughness: 0.85 }),
  planks: paint(0xffffff, { map: PLANKS, roughness: 0.7 }),
  tiles: paint(0xffffff, { map: TILES, roughness: 0.35 }),
  houseOut: paint(0xf2d7a6, { roughness: 0.8 }),
  schoolOut: paint(0xe6b88a, { roughness: 0.8 }),
  shopOut: paint(0xf0b7c0, { roughness: 0.8 }),
  plinth: paint(0xcabda6, { roughness: 0.9 }),
  bubble: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, envMapIntensity: 1.6 })
};

// --- the walking route (x, z, floor y), in the order of the day ------------------
const ROUTE = [
  [-16.6, -6.0, HF],   //  0 bedside
  [-15.0, -4.65, HF],  //  1 door bedroom | bathroom
  [-12.9, -6.2, HF],   //  2 the sink
  [-15.0, -4.65, HF],  //  3
  [-15.75, -6.2, HF],  //  4 the wardrobe
  [-15.0, -4.65, HF],  //  5
  [-12.0, -4.65, HF],  //  6 door bathroom | hall
  [-9.2, -4.65, HF],   //  7 door hall | kitchen
  [-8.4, -7.0, HF],    //  8 the kitchen table
  [-9.2, -4.65, HF],   //  9
  [-10.6, -4.3, HF],   // 10 inside the front door
  [-10.6, -3.0, 0],    // 11 the doorstep
  [-10.6, 1.5, 0],     // 12 garden gate
  [-4.6, 1.5, 0],      // 13 the kerb at the crossing (road edge)
  [-1.4, 1.5, 0],      // 14 the far kerb (road edge)
  [5.0, 1.5, 0],       // 15
  [9.5, 1.5, 0],       // 16
  [9.5, -3.0, 0],      // 17 school steps
  [9.5, -4.4, SF],     // 18 entrance hall
  [8.0, -4.65, SF],    // 19 classroom door
  [4.6, -4.75, SF],    // 20 in front of the desks
  [4.5, -5.6, SF],     // 21 the boy's desk
  [4.6, -4.75, SF],    // 22
  [8.0, -4.65, SF],    // 23
  [9.5, -4.4, SF],     // 24
  [9.5, -3.0, 0],      // 25
  [9.5, 1.5, 0],       // 26
  [5.0, 1.5, 0],       // 27
  [5.0, 3.9, 0],       // 28 playground gate
  [5.6, 5.75, 0],      // 29 the swing
  [5.0, 3.9, 0],       // 30
  [5.0, 1.5, 0],       // 31
  [-1.4, 1.5, 0],      // 32
  [-4.6, 1.5, 0],      // 33
  [-6.5, 4.5, 0],      // 34 into the park
  [-9.0, 8.5, 0],      // 35
  [-12.5, 7.6, 0],     // 36 by the pond
  [-10.6, 4.4, 0],     // 37
  [-10.6, 1.5, 0],     // 38
  [-10.6, -3.0, 0],    // 39
  [-10.6, -4.3, HF],   // 40
  [-11.0, -6.2, HF],   // 41 the hall rug (blocks)
  [-9.2, -4.65, HF],   // 42
  [-8.4, -7.0, HF],    // 43 the kitchen table
  [-9.2, -4.65, HF],   // 44
  [-12.0, -4.65, HF],  // 45
  [-13.9, -6.3, HF],   // 46 the bath
  [-13.6, -5.0, HF],   // 47
  [-15.0, -4.65, HF],  // 48
  [-16.6, -6.0, HF]    // 49 bedside
];
const CUM = [0];
for (let i = 1; i < ROUTE.length; i++) {
  const a = ROUTE[i - 1], b = ROUTE[i];
  CUM.push(CUM[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
}
// where the route passes a front door (house 10-11 / 39-40, school 17-18 / 24-25)
const DOOR_S = [[10, 11, L.house.z1], [39, 40, L.house.z1], [17, 18, L.school.z1], [24, 25, L.school.z1]].map(([a, b, z]) => {
  const k = clamp((z - ROUTE[a][1]) / (ROUTE[b][1] - ROUTE[a][1]));
  return CUM[a] + (CUM[b] - CUM[a]) * k;
});
function routeAt(s, out) {
  s = clamp(s, 0, CUM[CUM.length - 1]);
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < s) i++;
  const a = ROUTE[i - 1], b = ROUTE[i], len = CUM[i] - CUM[i - 1] || 1;
  const k = clamp((s - CUM[i - 1]) / len);
  out.x = lerp(a[0], b[0], k); out.z = lerp(a[1], b[1], k); out.y = lerp(a[2], b[2], k);
  out.dir = Math.atan2(b[0] - a[0], b[1] - a[1]);   // yaw facing a -> b
  return out;
}

// =============================================================================
function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const chunks = [];
  const stops = {};
  const updaters = [];
  const W = {};                // named things the stops and scene.js use
  // night-light hooks for scene.js
  const N = {
    windows: [],               // lit-window materials (emissive)
    skyPanes: [],              // inside faces of windows: show the sky colour
    street: lamp(0xfff0c0, 0.05),
    lights: {},                // indoor point lights
    glowStars: lamp(0xe9f7a8, 0),
    bedLamp: lamp(0xffd68a, 0.3),
    clouds: paint(0xffffff, { roughness: 1, roughnessMap: null })
  };
  W.bedLamp = 1; W.glow = 0;   // stop-driven: bedroom lamp on (1) / off; glow stars

  // props that the stops move: restored to their rest state every frame,
  // then the active stop poses them (so nothing lingers from another page)
  const props = [];
  const prop = obj => { props.push({ obj, vis: obj.visible, p: obj.position.clone(), r: obj.rotation.clone(), s: obj.scale.clone() }); return obj; };
  const restoreProps = () => props.forEach(q => { q.obj.visible = q.vis; q.obj.position.copy(q.p); q.obj.rotation.copy(q.r); q.obj.scale.copy(q.s); });

  // a fading cutaway: front wall + roof of a building
  const fades = {};
  // (built a few frames after the first show(): start in the active stop's state,
  // or page 1 would look at the closed house front from inside the bedroom view)
  // --- eating: find the right-arm pose that brings the hand just in front of
  // the mouth (searched once at build time), then point a held thing at the mouth
  const _m = new V3(), _h = new V3(), _f = new V3(), _q = new THREE.Quaternion();
  function mouthFrame(kid) {
    kid.root.updateMatrixWorld(true);
    kid.mouthAt.getWorldPosition(_m);
    kid.head.getWorldQuaternion(_q);
    _f.set(0, 0, 1).applyQuaternion(_q);
  }
  function solveReach(kid, base, gap) {
    let best = null, bestS = Infinity;
    const P = Object.assign({}, base);
    for (let raF = 0.4; raF <= 1.8; raF += 0.1) for (let raE = 0.8; raE <= 2.6; raE += 0.1) for (let raS = -0.8; raS <= 0.2; raS += 0.1) {
      P.raF = raF; P.raE = raE; P.raS = raS;
      kid.apply(P); mouthFrame(kid);
      kid.handR.getWorldPosition(_h);
      // aim: `gap` in front of the mouth, a little below it
      const s = _h.distanceTo(_m.clone().addScaledVector(_f, gap).add(new V3(0, -0.03 * kid.scale, 0)));
      if (s < bestS) { bestS = s; best = { raF, raE, raS }; }
    }
    return best;
  }
  function aimTool(kid, tool, P, tip) {
    kid.apply(P); mouthFrame(kid);
    const loc = kid.handR.worldToLocal(_m.clone());
    const d = loc.length(), dir = loc.clone().divideScalar(d || 1);
    tool.quaternion.setFromUnitVectors(new V3(0, -1, 0), dir);
    tool.position.copy(dir).multiplyScalar(Math.max(0, d - tip));
  }
  // set up eating for a kid: solve the bite pose from `rest`, aim the tool
  function setupBite(kid, rest, tool, tip, gap) {
    const base = Object.assign({}, rest, { spine: 0.05, hp: -0.06 });
    const B = Object.assign(base, solveReach(kid, base, gap));
    aimTool(kid, tool, B, tip);
    kid.apply(rest);
    return B;
  }
  // one bite cycle every `per` s from t0, n bites: the hand comes up, the mouth
  // opens a little as the food arrives, closes, then he chews with a closed mouth
  function eatCycle(t, P, B, t0, per, n) {
    const k = (t - t0) / per;
    if (t > t0 && k < n) {
      const u = k - Math.floor(k);
      const up = u < 0.42 ? seg(u, 0.05, 0.42) : 1 - seg(u, 0.6, 0.95);
      P.raF = lerp(P.raF, B.raF, up); P.raE = lerp(P.raE, B.raE, up); P.raS = lerp(P.raS, B.raS, up);
      P.spine = lerp(P.spine, B.spine, up); P.hp = lerp(P.hp, B.hp, up);
      P.mouth = bump(u, 0.3, 0.52) * MOUTH_BITE;
      if (u > 0.52) P.hp += Math.max(0, Math.sin((u - 0.52) / 0.48 * PI * 2 * 3)) * 0.035;   // chew
    }
    return clamp((t - t0 - per * 0.45) / (per * n), 0, 1);   // how much is eaten
  }
  // classmates' food (held in the right hand, or a cup on the desk + spoon)
  function buildFood(kind, kid) {
    const hold = part(kind, kid.handR);
    let tip = 0.09, gap = 0.07;
    if (kind === 'apple') {
      mesh(sphere(0.042, 14, 10), M.red, 0, -0.045, 0, hold).scale.set(1, 0.92, 1);
      mesh(cylY(0.004, 0.025), M.darkWood, 0.0, -0.045, 0.045, hold).rotation.x = PI / 2;
    } else if (kind === 'banana') {
      const b = mesh(capsule(0.017, 0.12, 8), M.yellow, 0, -0.07, 0, hold); b.rotation.z = 0.12;
      mesh(sphere(0.01, 6, 4), M.darkWood, 0.008, 0.0, 0, hold);
      tip = 0.145; gap = 0.09;
    } else {   // yogurt: a spoon in the hand, the pot on the desk
      mesh(cylY(0.008, 0.13), M.chrome, 0, -0.06, 0, hold);
      mesh(sphere(0.022, 10, 6), M.chrome, 0, -0.13, 0, hold).scale.set(1, 1.3, 0.5);
      tip = 0.15; gap = 0.1;
      const pot = part('pot', root, kid.cfgX - 0.42, SF + DESK_TOP, kid.cfgZ + 0.08);
      mesh(cylY(0.04, 0.08, 16, 0.045), M.white, 0, 0.04, 0, pot);
      mesh(cylY(0.04, 0.005), M.pink, 0, 0.078, 0, pot);
      pot.visible = false; prop(pot);
      kid.pot = pot;
    }
    const B = setupBite(kid, kid.rest, hold, tip, gap);
    hold.visible = false; prop(hold);
    return { hold, B };
  }
  function setDuvet(a, b, k = 0) {
    if (!W.duvet) return;
    const x0 = b ? lerp(a.x0, b.x0, k) : a.x0, h = b ? lerp(a.h, b.h, k) : a.h;
    W.duvet.scale.set(DUVET_FOOT - x0, h + 0.03, 1);
  }
  function makeFade(key, mats, roof) {
    const open = stops[activeKey] && stops[activeKey].inside === key ? 1 : 0;
    fades[key] = { mats, roof, v: open, target: open };
  }
  // doors that swing open when the boy comes near
  const doors = [];

  // --- windows ---------------------------------------------------------------
  const skyPane = new THREE.MeshBasicMaterial({ color: 0xbfe0f2 });
  N.skyPanes.push(skyPane);
  const houseWin = lamp(0xffd27a, 0), schoolWin = lamp(0xffe2a0, 0), shopWin = lamp(0xffe7b0, 0.05);
  N.windows.push(houseWin, schoolWin, shopWin);
  // a window in a back wall (inside face at zIn, outside face at zOut)
  function backWindow(g, cx, cy, w, h, zIn, zOut, glow) {
    const fr = 0.06;
    [[cx, cy + h / 2, w + fr * 2, fr], [cx, cy - h / 2, w + fr * 2, fr]].forEach(([x, y, ww, hh]) => {
      mesh(box(ww, hh, zIn - zOut + 0.04), M.white, x, y, (zIn + zOut) / 2, g);
    });
    [cx - w / 2, cx + w / 2, cx].forEach((x, i) => mesh(box(i < 2 ? fr : 0.035, h, zIn - zOut + 0.04), M.white, x, cy, (zIn + zOut) / 2, g));
    mesh(box(w, 0.035, zIn - zOut + 0.03), M.white, cx, cy, (zIn + zOut) / 2, g);
    mesh(new THREE.PlaneGeometry(w, h), skyPane, cx, cy, zIn + 0.004, g);
    const o = mesh(new THREE.PlaneGeometry(w, h), glow, cx, cy, zOut - 0.004, g);
    o.rotation.y = PI;
    mesh(box(w + 0.2, 0.05, 0.12), M.white, cx, cy - h / 2 - 0.05, zIn + 0.05, g);   // sill
  }
  // a window on a (fading) front wall, outside face at z
  function frontWindow(g, cx, cy, w, h, z, frame, glass) {
    const fr = 0.07;
    mesh(box(w + fr * 2, h + fr * 2, 0.05), frame, cx, cy, z + 0.02, g);
    mesh(box(w, h, 0.05), glass, cx, cy, z + 0.035, g);
    mesh(box(0.04, h, 0.07), frame, cx, cy, z + 0.05, g);
    mesh(box(w, 0.04, 0.07), frame, cx, cy, z + 0.05, g);
    mesh(box(w + 0.24, 0.06, 0.14), frame, cx, cy - h / 2 - 0.08, z + 0.07, g);
  }
  // a gable roof along x over [x0,x1] × [z0,z1] at height y
  function gableRoof(parent, mat, x0, x1, z0, z1, y, rise, over = 0.35) {
    const s = new THREE.Shape([
      new THREE.Vector2(-(z0 - over), 0), new THREE.Vector2(-(z1 + over), 0), new THREE.Vector2(-(z0 + z1) / 2, rise)
    ]);
    const geo = new THREE.ExtrudeGeometry(s, { depth: x1 - x0 + over * 2, bevelEnabled: false });
    geo.rotateY(PI / 2);
    const m = mesh(geo, mat, x0 - over, y, 0, parent);
    return m;
  }
  // a five-point star (glow stickers)
  function starGeo(r) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r;
      i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    return new THREE.ShapeGeometry(s);
  }

  // ===========================================================================
  // CHUNK 1: the board and the printed ground
  chunks.push(() => {
    const B = L.board;
    mesh(rbox(B.w + 0.6, B.edge, B.d + 0.6, 0.18), M.board, 0, -B.edge / 2, 0, root).castShadow = false;
    const ground = mesh(new THREE.PlaneGeometry(B.w, B.d).rotateX(-PI / 2),
      new THREE.MeshStandardMaterial({ map: tex(drawGround(), { aniso: 8 }), roughness: 0.95, metalness: 0 }), 0, 0.002, 0, root);
    ground.castShadow = false;
  });

  // ===========================================================================
  // CHUNK 2: the house (cutaway dollhouse) and everything in it
  chunks.push(() => {
    const H = L.house, g = new THREE.Group(); root.add(g);
    const T = WALL_T, F = HF, top = F + H.h, D = H.z1 - H.z0;
    slab(g, MAT.plinth, H.x0 - 0.15, 0, H.z0 - 0.15, H.x1 - H.x0 + 0.3, F, D + 0.45);
    slab(g, MAT.plinth, H.frontDoorX - 0.6, 0, H.z1 + 0.25, 1.2, F * 0.5, 0.45);      // doorstep
    const rooms = [
      { x0: H.x0, x1: H.walls[0], paper: 'bed', floor: MAT.planks },
      { x0: H.walls[0], x1: H.walls[1], paper: 'bath', floor: MAT.tiles },
      { x0: H.walls[1], x1: H.walls[2], paper: 'hall', floor: MAT.planks },
      { x0: H.walls[2], x1: H.x1, paper: 'kitchen', floor: MAT.tiles }
    ];
    rooms.forEach(r => {
      slab(g, r.floor, r.x0, F - 0.005, H.z0, r.x1 - r.x0, 0.01, D);
      slab(g, MAT.paper(r.paper), r.x0, F, H.z0, r.x1 - r.x0, H.h, T);
      slab(g, M.white, r.x0, F, H.z0 + T, r.x1 - r.x0, 0.1, 0.02);              // skirting
    });
    slab(g, MAT.houseOut, H.x0 - T, F, H.z0, T, H.h, D);                          // side walls
    slab(g, MAT.houseOut, H.x1, F, H.z0, T, H.h, D);
    slab(g, MAT.paper('bed'), H.x0, F, H.z0 + T, 0.01, H.h, D - T);               // inside faces
    slab(g, MAT.paper('kitchen'), H.x1 - 0.01, F, H.z0 + T, 0.01, H.h, D - T);
    // inside walls with doorways
    H.walls.forEach(wx => {
      const a = H.doorZ - H.doorW / 2, b = H.doorZ + H.doorW / 2;
      slab(g, M.cream, wx - T / 2, F, H.z0 + T, T, H.h, a - H.z0 - T);
      slab(g, M.cream, wx - T / 2, F, b, T, H.h, H.z1 - T - b);
      slab(g, M.cream, wx - T / 2, F + 1.8, a, T, H.h - 1.8, H.doorW);
    });
    // cut edges: a white rim along the top of the walls, like card
    slab(g, M.white, H.x0 - T, top, H.z0, H.x1 - H.x0 + 2 * T, 0.05, T);
    slab(g, M.white, H.x0 - T, top, H.z0, T, 0.05, D);
    slab(g, M.white, H.x1, top, H.z0, T, 0.05, D);
    // back windows
    backWindow(g, -17.8, F + 1.65, 1.0, 0.8, H.z0 + T, H.z0, houseWin);   // bedroom, above the bed
    backWindow(g, -12.8, F + 1.75, 0.6, 0.6, H.z0 + T, H.z0, houseWin);   // bathroom
    backWindow(g, -7.6, F + 1.6, 1.0, 0.7, H.z0 + T, H.z0, houseWin);     // kitchen

    // --- bedroom ---
    slab(g, M.wood, -19.35, F, -7.88, 2.1, 0.3, 1.1, 0.04);                 // bed frame
    slab(g, M.wood, -19.48, F, -7.9, 0.1, 0.85, 1.14, 0.03);                // headboard
    slab(g, M.wood, -17.3, F, -7.9, 0.08, 0.55, 1.14, 0.03);                // footboard
    slab(g, M.white, -19.35, F + 0.3, -7.85, 2.03, 0.14, 1.04, 0.06);       // mattress
    mesh(rbox(0.36, 0.1, 0.62, 0.05), M.white, -19.1, BED_TOP + 0.05, -7.33, g);            // pillow
    // the duvet: pivots at the foot of the bed; updateBoy stretches it over him
    W.duvet = part('duvet', g, DUVET_FOOT, BED_TOP - 0.03, -7.33);
    mesh(rbox(1, 1, 1.14, 0.1), M.blue, -0.5, 0.5, 0, W.duvet);
    mesh(rbox(0.07, 1.03, 1.16, 0.03), M.yellow, -0.965, 0.5, 0, W.duvet);   // the turned-down edge
    setDuvet(DUVET.made);
    slab(g, M.darkWood, -17.15, F, -7.85, 0.45, 0.45, 0.42, 0.03);          // nightstand
    mesh(cylY(0.07, 0.04), M.white, -16.93, F + 0.47, -7.62, g);
    mesh(cylY(0.015, 0.22), M.chrome, -16.93, F + 0.58, -7.62, g);
    const shade = mesh(cylY(0.13, 0.16, 16, 0.07), N.bedLamp, -16.93, F + 0.74, -7.62, g);
    slab(g, M.sky, -16.4, F, -7.88, 1.15, 1.9, 0.58, 0.04);                 // wardrobe
    slab(g, M.white, -15.84, F + 0.1, -7.31, 0.02, 1.7, 0.02);
    [-15.92, -15.76].forEach(x => mesh(sphere(0.03), M.chrome, x, F + 1.0, -7.29, g));
    mesh(cylY(0.9, 0.012, 28), M.pink, -17.4, F + 0.006, -5.6, g).scale.set(1, 1, 0.7);      // round rug
    slab(g, M.red, -19.3, F, -5.0, 0.6, 0.4, 0.45, 0.05);                   // toy box
    mesh(sphere(0.12), M.yellow, -19.0, F + 0.52, -4.78, g);                // a ball on it
    slab(g, M.white, -16.2, F + 2.15, -7.88 + 0.0, 0.5, 0.36, 0.03);        // a picture
    slab(g, M.green, -16.15, F + 2.2, -7.86, 0.4, 0.26, 0.02);
    // glow-in-the-dark stars on the bedroom wall: they shine when the light goes off
    const sg = starGeo(0.07), sr = seeded(3);
    for (let i = 0; i < 14; i++) {
      const st = mesh(sg, N.glowStars, -19.2 + sr() * 3.9, F + 1.95 + sr() * 0.55, H.z0 + T + 0.006, g);
      st.rotation.z = sr() * PI; st.scale.setScalar(0.7 + sr() * 0.6); st.castShadow = false;
    }
    // --- bathroom ---
    const tx0 = -14.9, tx1 = -13.4, tz0 = -7.88, tz1 = -6.98, th = 0.5;
    slab(g, M.white, tx0, F, tz0, tx1 - tx0, 0.08, tz1 - tz0);
    slab(g, M.white, tx0, F, tz0, 0.07, th, tz1 - tz0, 0.03);
    slab(g, M.white, tx1 - 0.07, F, tz0, 0.07, th, tz1 - tz0, 0.03);
    slab(g, M.white, tx0, F, tz0, tx1 - tx0, th, 0.07, 0.03);
    slab(g, M.white, tx0, F, tz1 - 0.07, tx1 - tx0, th, 0.07, 0.03);
    W.water = mesh(new THREE.PlaneGeometry(tx1 - tx0 - 0.12, tz1 - tz0 - 0.12).rotateX(-PI / 2), M.water, (tx0 + tx1) / 2, F + 0.38, (tz0 + tz1) / 2, g);
    W.water.userData.solo = true; W.water.castShadow = false;
    mesh(cylZ(0.02, 0.18), M.chrome, tx1 - 0.05, F + 0.62, -7.8, g);        // bath tap
    slab(g, M.chrome, tx1 - 0.08, F + 0.5, -7.88, 0.06, 0.14, 0.06);
    // sink on the right wall, mirror above
    slab(g, M.white, -12.36, F, -6.72, 0.2, 0.62, 0.24, 0.05);
    mesh(rbox(0.42, 0.14, 0.5, 0.06), M.white, -12.3, F + 0.68, -6.6, g);
    mesh(cylX(0.016, 0.14), M.chrome, -12.18, F + 0.82, -6.6, g);
    slab(g, M.chrome, -12.07, F + 1.0, -6.95, 0.02, 0.62, 0.7, 0.01);       // mirror
    mesh(cylY(0.045, 0.12), M.sky, -12.2, F + 0.81, -6.85, g);              // toothbrush cup
    // toilet, front left
    slab(g, M.white, -14.86, F, -5.9, 0.45, 0.38, 0.4, 0.08);
    slab(g, M.white, -14.86, F + 0.2, -5.9, 0.15, 0.5, 0.4, 0.05);
    // the duck
    const duck = prop(part('duck', g, -13.75, F + 0.39, -7.3));
    mesh(sphere(0.07), M.yellow, 0, 0.04, 0, duck).scale.set(1.2, 0.8, 1);
    mesh(sphere(0.045), M.yellow, 0.06, 0.1, 0, duck);
    mesh(cylX(0.015, 0.05, 8, 0.005), M.orange, 0.11, 0.095, 0, duck);
    W.duck = duck;
    // --- hall ---
    mesh(rbox(1.3, 0.015, 0.9, 0.005), M.red, -10.6, F + 0.008, -6.5, g);   // rug
    slab(g, M.darkWood, -11.6, F + 1.5, -7.86, 1.1, 0.08, 0.06);            // coat hooks
    [-11.4, -11.05, -10.7].forEach((x, i) => {
      mesh(cylZ(0.02, 0.1), M.chrome, x, F + 1.5, -7.78, g);
      if (i < 2) slab(g, [M.yellow, M.green][i], x - 0.15, F + 0.85, -7.82, 0.3, 0.62, 0.1, 0.04);
    });
    slab(g, M.wood, -9.95, F, -7.85, 0.6, 0.3, 0.35, 0.03);                  // shoe bench
    slab(g, M.red, -9.85, F + 0.3, -7.75, 0.16, 0.08, 0.24, 0.03);
    slab(g, M.blue, -9.62, F + 0.3, -7.75, 0.16, 0.08, 0.24, 0.03);
    // building blocks (the pile; play() builds a tower from them)
    W.blocks = [];
    const blockCols = [M.red, M.yellow, M.blue, M.green, M.orange];
    const pile = [[-11.62, -6.55, 0.2], [-11.75, -6.3, 0.9], [-11.5, -6.25, 0.4], [-11.68, -6.72, 1.3], [-11.62, -6.48, 0.1]];
    blockCols.forEach((m, i) => {
      const b = part('block' + i, g, pile[i][0], F + 0.075 + (i === 4 ? 0.15 : 0), pile[i][1]);
      b.rotation.y = pile[i][2];
      prop(b);
      mesh(rbox(0.15, 0.15, 0.15, 0.025), m, 0, 0, 0, b);
      W.blocks.push(b);
    });
    // --- kitchen ---
    slab(g, M.white, -9.08, F, -7.88, 0.9, 0.85, 0.55, 0.03);               // counter + oven
    slab(g, M.dark, -9.0, F + 0.85, -7.8, 0.74, 0.02, 0.4);
    slab(g, M.grey, -8.95, F + 0.15, -7.33, 0.62, 0.42, 0.02);
    [-8.85, -8.6, -8.35].forEach(x => mesh(cylZ(0.02, 0.04), M.dark, x, F + 0.73, -7.32, g));
    mesh(cylY(0.12, 0.12), M.red, -8.82, F + 0.93, -7.6, g);                // a pot
    slab(g, M.white, -6.75, F, -7.88, 0.62, 1.8, 0.62, 0.05);               // fridge
    slab(g, M.grey, -6.7, F + 1.2, -7.26, 0.02, 0.02, 0.02);
    mesh(cylY(0.015, 0.5), M.chrome, -6.22, F + 1.1, -7.24, g);
    slab(g, M.wood, -8.15, F + TABLE_TOP - 0.05, -6.6, 1.1, 0.05, 0.7, 0.02);   // table
    [[-8.1, -6.55], [-7.1, -6.55], [-8.1, -5.95], [-7.1, -5.95]].forEach(([x, z]) => mesh(cylY(0.025, TABLE_TOP - 0.05), M.wood, x, F + (TABLE_TOP - 0.05) / 2, z, g));
    const chair = (x, z, ry) => {
      const c = new THREE.Group(); c.position.set(x, F, z); c.rotation.y = ry; g.add(c);
      slab(c, M.red, -0.2, CHAIR_SEAT - 0.04, -0.2, 0.4, 0.04, 0.4, 0.015);
      slab(c, M.red, -0.2, CHAIR_SEAT, -0.22, 0.4, 0.4, 0.04, 0.015);
      [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([a, b]) => mesh(cylY(0.018, CHAIR_SEAT - 0.04), M.red, a, (CHAIR_SEAT - 0.04) / 2, b, c));
    };
    chair(-7.6, -6.95, 0);
    chair(-6.65, -6.25, -PI / 2);
    mesh(cylY(0.05, 0.14), M.glass, -7.25, F + TABLE_TOP + 0.07, -6.4, g);   // a glass of milk
    mesh(cylY(0.043, 0.11), M.white, -7.25, F + TABLE_TOP + 0.055, -6.4, g);
    // breakfast bowl + cereal; dinner plate + food
    const bowl = prop(part('bowl', g, -7.6, F + TABLE_TOP, -6.45)); bowl.visible = false;
    mesh(new THREE.SphereGeometry(0.11, 16, 8, 0, PI * 2, PI / 2, PI / 2), M.yellow, 0, 0.1, 0, bowl).material = paint(0xf0c23b, { side: THREE.DoubleSide });
    W.cereal = part('cereal', bowl, 0, 0.075, 0);
    mesh(cylY(0.095, 0.02), paint(0xe0b06a, { roughness: 0.95 }), 0, 0, 0, W.cereal);
    props[props.length - 1].vis = false;
    W.bowl = bowl;
    const plate = prop(part('plate', g, -7.6, F + TABLE_TOP, -6.45));
    mesh(cylY(0.16, 0.02, 24, 0.12), M.white, 0, 0.012, 0, plate);
    W.food = part('food', plate, 0, 0.03, 0);
    mesh(sphere(0.06), M.cream, -0.04, 0.01, 0.01, W.food).scale.set(1, 0.6, 1);           // mash
    for (let i = 0; i < 7; i++) mesh(sphere(0.018, 8, 6), M.green, 0.05 + (i % 3) * 0.03, 0.0, -0.04 + Math.floor(i / 3) * 0.03, W.food);
    mesh(rbox(0.07, 0.03, 0.05, 0.01), M.orange, 0.0, 0.0, 0.07, W.food);
    plate.visible = false; props[props.length - 1].vis = false;
    W.plate = plate;
    // a hall/kitchen ceiling lamp hangs from the (lifting) roof? no: it hangs on the wall
    // indoor lights (no shadows): whole house + the bedroom lamp
    const hl = new THREE.PointLight(0xffd59a, 0, 16, 1.4); hl.position.set(-12.7, F + 2.2, -5.4); root.add(hl);
    const bl = new THREE.PointLight(0xffcf8a, 0, 6, 1.4); bl.position.set(-17.1, F + 1.2, -6.6); root.add(bl);
    N.lights.house = hl; N.lights.bed = bl;

    // --- the front wall (fades) and the roof (lifts) ---
    const wallF = fader(0xf2d7a6), trimF = fader(0xffffff), glassF = fader(0x9fc4d6, { emissive: 0xffc870, emissiveIntensity: 0 });
    const doorF = fader(0x3f7fc0), roofF = fader(0xb5543c), chimF = fader(0xc9a27a);
    N.frontGlass = [glassF];
    const front = part('front', g);
    const dx0 = H.frontDoorX - DOOR_W / 2, dx1 = H.frontDoorX + DOOR_W / 2;
    slab(front, wallF, H.x0 - T, F, H.z1 - T, dx0 - (H.x0 - T), H.h, T);      // wall with a doorway
    slab(front, wallF, dx1, F, H.z1 - T, H.x1 + T - dx1, H.h, T);
    slab(front, wallF, dx0, F + DOOR_H, H.z1 - T, DOOR_W, H.h - DOOR_H, T);
    frontWindow(front, -17.3, F + 1.35, 1.1, 0.8, H.z1, trimF, glassF);
    frontWindow(front, -13.5, F + 1.45, 0.6, 0.55, H.z1, trimF, glassF);
    frontWindow(front, -7.6, F + 1.35, 1.1, 0.8, H.z1, trimF, glassF);
    // the front door: hinged on its left edge, swings out
    const door = part('houseDoor', front, dx0, F, H.z1 + 0.03);
    slab(door, doorF, 0, 0, -0.03, DOOR_W, DOOR_H, 0.06, 0.02);
    mesh(sphere(0.04), trimF, DOOR_W - 0.14, 0.9, 0.05, door);
    doors.push({ leaf: door, x: H.frontDoorX, z: H.z1, dir: -1, v: 0 });
    slab(front, trimF, H.frontDoorX - 0.6, F + 1.9, H.z1, 1.2, 0.07, 0.4);
    // flower boxes under the windows
    [-17.3, -7.6].forEach(x => slab(front, trimF, x - 0.55, F + 0.82, H.z1, 1.1, 0.12, 0.16));
    const roof = part('roof', g);
    gableRoof(roof, roofF, H.x0 - T, H.x1 + T, H.z0, H.z1, top, 1.7);
    slab(roof, chimF, -8.2, top + 0.6, H.z0 + 0.9, 0.5, 1.6, 0.5);
    bake(g);
    makeFade('house', [wallF, trimF, glassF, doorF, roofF, chimF], roof);
    W.front = front;
  });

  // ===========================================================================
  // CHUNK 3: the school (classroom cutaway), teacher, classmates
  chunks.push(() => {
    const S = L.school, g = new THREE.Group(); root.add(g);
    const T = WALL_T, F = SF, D = S.z1 - S.z0, top = F + S.h;
    slab(g, MAT.plinth, S.x0 - 0.15, 0, S.z0 - 0.15, S.x1 - S.x0 + 0.3, F, D + 0.45);
    [0, 1].forEach(i => slab(g, MAT.plinth, S.frontDoorX - 0.8 + i * 0.1, 0, S.z1 + 0.25 + i * 0.25, 1.6 - i * 0.2, F * (1 - i * 0.5), 0.5));
    slab(g, MAT.planks, S.x0, F - 0.005, S.z0, S.x1 - S.x0, 0.01, D);
    slab(g, MAT.paper('class'), S.x0, F, S.z0, S.x1 - S.x0, S.h, T);
    slab(g, MAT.schoolOut, S.x0 - T, F, S.z0, T, S.h, D);
    slab(g, MAT.schoolOut, S.x1, F, S.z0, T, S.h, D);
    slab(g, MAT.paper('class'), S.x0, F, S.z0 + T, 0.01, S.h, D - T);
    slab(g, MAT.paper('class'), S.x1 - 0.01, F, S.z0 + T, 0.01, S.h, D - T);
    const a = L.house.doorZ - 0.5, b = L.house.doorZ + 0.5;
    slab(g, M.cream, S.classX1 - T / 2, F, S.z0 + T, T, S.h, a - S.z0 - T);
    slab(g, M.cream, S.classX1 - T / 2, F, b, T, S.h, S.z1 - T - b);
    slab(g, M.cream, S.classX1 - T / 2, F + 1.9, a, T, S.h - 1.9, 1.0);
    slab(g, M.white, S.x0 - T, top, S.z0, S.x1 - S.x0 + 2 * T, 0.05, T);
    slab(g, M.white, S.x0 - T, top, S.z0, T, 0.05, D);
    slab(g, M.white, S.x1, top, S.z0, T, 0.05, D);
    backWindow(g, 3.4, F + 1.7, 1.3, 0.9, S.z0 + T, S.z0, schoolWin);
    backWindow(g, 6.2, F + 1.7, 1.3, 0.9, S.z0 + T, S.z0, schoolWin);
    // blackboard on the left wall, facing the desks
    slab(g, M.darkWood, S.x0 + 0.01, F + 0.9, -8.3, 0.06, 1.05, 2.9, 0.02);
    const board = mesh(new THREE.PlaneGeometry(2.7, 0.9), new THREE.MeshStandardMaterial({ map: blackboardTex(), roughness: 0.9 }), S.x0 + 0.075, F + 1.42, -6.85, g);
    board.rotation.y = PI / 2;
    slab(g, M.darkWood, S.x0 + 0.06, F + 0.88, -8.2, 0.12, 0.03, 2.7);
    // alphabet strip and a clock on the back wall
    const abc = mesh(new THREE.PlaneGeometry(4.6, 0.3), decal(labelTex('A B C D E F G H I J K', { w: 1024, h: 72, fg: '#c0392b', bg: '#fff8e8' })), 4.5, F + 2.45, S.z0 + T + 0.006, g);
    abc.userData.solo = true;
    mesh(cylZ(0.2, 0.04, 24), M.white, 7.4, F + 2.1, S.z0 + T + 0.02, g);
    slab(g, M.black, 7.39, F + 2.1, S.z0 + T + 0.04, 0.02, 0.15, 0.01);
    slab(g, M.black, 7.39, F + 2.09, S.z0 + T + 0.04, 0.11, 0.02, 0.01);
    // teacher's desk
    slab(g, M.wood, 1.6, F, -8.7, 0.7, 0.7, 1.1, 0.03);
    mesh(sphere(0.08), M.red, 1.95, F + 0.78, -8.5, g);       // an apple for the teacher
    // pupils' desks (facing the board, -x) and chairs
    const desk = (x, z) => {
      slab(g, M.yellow, x - 0.25, F + DESK_TOP - 0.04, z - 0.4, 0.5, 0.04, 0.8, 0.015);
      [[-0.21, -0.36], [0.21, -0.36], [-0.21, 0.36], [0.21, 0.36]].forEach(([dx, dz]) => mesh(cylY(0.02, DESK_TOP - 0.04), M.grey, x + dx, F + (DESK_TOP - 0.04) / 2, z + dz, g));
      const cx = x + 0.55;
      slab(g, M.blue, cx - 0.17, F + DESK_SEAT - 0.03, z - 0.17, 0.34, 0.03, 0.34, 0.012);
      slab(g, M.blue, cx + 0.15, F + DESK_SEAT, z - 0.17, 0.03, 0.34, 0.34, 0.012);
      [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([dx, dz]) => mesh(cylY(0.015, DESK_SEAT - 0.03), M.grey, cx + dx, F + (DESK_SEAT - 0.03) / 2, z + dz, g));
      slab(g, M.white, x - 0.12, F + DESK_TOP, z - 0.12, 0.22, 0.01, 0.3);            // an exercise book
      mesh(cylZ(0.008, 0.16), M.red, x + 0.05, F + DESK_TOP + 0.01, z + 0.2, g);       // pencil
    };
    [[3.3, -7.6], [5.3, -7.6], [3.3, -5.6], [5.3, -5.6]].forEach(([x, z]) => desk(x, z));
    // entrance hall: pegs with bags, a plant
    slab(g, M.darkWood, 8.4, F + 1.3, S.z0 + T, 2.2, 0.08, 0.06);
    [8.7, 9.3, 9.9, 10.5].forEach((x, i) => slab(g, [M.red, M.green, M.purple, M.orange][i], x - 0.15, F + 0.85, S.z0 + T + 0.04, 0.3, 0.4, 0.14, 0.05));
    mesh(cylY(0.18, 0.35, 16, 0.14), M.orange, 10.6, F + 0.18, -4.3, g);
    mesh(sphere(0.32), M.leaf, 10.6, F + 0.65, -4.3, g);
    // lunchbox on the boy's desk (lunch page)
    const lb = prop(part('lunchbox', g, 3.25, F + DESK_TOP, -5.6)); lb.visible = false;
    slab(lb, M.sky, -0.14, 0, -0.2, 0.28, 0.1, 0.4, 0.02);
    const lid = part('lid', lb, -0.14, 0.1, 0); lid.rotation.z = 1.9;
    slab(lid, M.sky, -0.28, 0, -0.2, 0.28, 0.02, 0.4, 0.01);
    mesh(sphere(0.055), M.red, 0, 0.13, 0.08, lb);
    props[props.length - 1].vis = false;
    W.lunchbox = lb;
    const sl = new THREE.PointLight(0xffe2a8, 0, 16, 1.4); sl.position.set(5.5, F + 2.4, -5.8); root.add(sl);
    N.lights.school = sl;
    // front wall + sign (fade), flat roof with a little bell tower (lifts)
    const wallF = fader(0xe6b88a), trimF = fader(0xffffff), glassF = fader(0x9fc4d6, { emissive: 0xffd890, emissiveIntensity: 0 });
    const doorF = fader(0xc0392b), roofF = fader(0x8a8f96), bellF = fader(0xd0473a);
    const signF = fader(0xffffff, { map: labelTex('SCHOOL', { w: 512, h: 128, fg: '#ffffff', bg: '#2f6f8c' }) });
    N.frontGlass.push(glassF);
    const front = part('front', g);
    const sx0 = S.frontDoorX - SCHOOL_DOOR_W, sx1 = S.frontDoorX + SCHOOL_DOOR_W;
    slab(front, wallF, S.x0 - T, F, S.z1 - T, sx0 - (S.x0 - T), S.h, T);      // wall with a doorway
    slab(front, wallF, sx1, F, S.z1 - T, S.x1 + T - sx1, S.h, T);
    slab(front, wallF, sx0, F + SCHOOL_DOOR_H, S.z1 - T, sx1 - sx0, S.h - SCHOOL_DOOR_H, T);
    [2.3, 4.5, 6.7].forEach(x => frontWindow(front, x, F + 1.4, 1.2, 0.9, S.z1, trimF, glassF));
    // two door leaves, hinged at the outer edges, both swing out
    [[sx0, 1], [sx1, -1]].forEach(([hx, s], i) => {
      const leaf = part('schoolDoor' + i, front, hx, F, S.z1 + 0.03);
      slab(leaf, doorF, s > 0 ? 0 : -SCHOOL_DOOR_W, 0, -0.03, SCHOOL_DOOR_W, SCHOOL_DOOR_H, 0.06, 0.02);
      slab(leaf, trimF, s > 0 ? SCHOOL_DOOR_W - 0.04 : -SCHOOL_DOOR_W, 0, 0.02, 0.04, SCHOOL_DOOR_H, 0.03);
      doors.push({ leaf, x: S.frontDoorX, z: S.z1, dir: -s, v: 0 });
    });
    mesh(new THREE.PlaneGeometry(1.9, 0.48), signF, S.frontDoorX, F + 2.3, S.z1 + 0.02, front);
    const roof = part('roof', g);
    slab(roof, roofF, S.x0 - 0.35, top, S.z0 - 0.35, S.x1 - S.x0 + 0.7, 0.22, D + 0.7, 0.05);
    slab(roof, wallF, 8.9, top + 0.22, -7.2, 1.2, 1.0, 1.2);
    gableRoof(roof, bellF, 8.9, 10.1, -7.2, -6.0, top + 1.22, 0.8, 0.15);
    mesh(cylZ(0.3, 0.05, 24), trimF, 9.5, top + 0.75, -5.97, roof);
    bake(g);
    makeFade('school', [wallF, trimF, glassF, doorF, roofF, bellF, signF], roof);
    // flag pole
    const fp = new THREE.Group(); root.add(fp);
    mesh(cylY(0.04, 4.2), M.white, 11.8, 2.1, -2.6, fp);
    W.flag = part('flag', fp, 11.8, 3.85, -2.6);
    mesh(box(0.9, 0.55, 0.02), M.red, 0.47, 0, 0, W.flag);
    mesh(box(0.9, 0.16, 0.025), M.yellow, 0.47, 0, 0, W.flag);
    updaters.push((dt, t) => { W.flag.rotation.y = Math.sin(t * 1.7) * 0.25; });
    // the teacher (an adult: longer legs and body, smaller head) and three classmates
    W.teacher = makeKid({ scale: 1.32, adult: true, legK: 1.3, torsoK: 1.15, armK: 1.22, headK: 0.8,
      shirt: 0x5f8f6a, longSleeves: true, pants: 0x4a3c34, hair: 0x2c1d14, hairStyle: 'bun', skin: 0xb57a55,
      iris: 0x3b2a1c, shoes: 0x3a2a20 });
    root.add(W.teacher.root);
    W.teacherPose = pose({ x: 1.75, y: SF + W.teacher.hipH, z: -6.3, yaw: PI / 2, laF: 0.1, raF: 0.1 });
    W.teacher.apply(W.teacherPose);
    // classmates: each eats something different at lunch (see CLASS_FOOD)
    W.mates = CLASS_MATES.map(m => {
      const k = makeKid(m.look);
      root.add(k.root);
      k.rest = sitPose(m.x, SF + DESK_SEAT, m.z, -PI / 2, { hy: m.hy, raF: 0.9, laF: 0.9, raE: 0.9, laE: 0.9, spine: 0.15 });
      k.cfg = m; k.cfgX = m.x; k.cfgZ = m.z;
      k.food = buildFood(m.food, k);
      k.apply(k.rest);
      return k;
    });
  });

  // ===========================================================================
  // CHUNK 4: playground, park, shop, street furniture, the car
  chunks.push(() => {
    const g = new THREE.Group(); root.add(g);
    // --- swings: the bar runs along z, seats swing along x ---
    const Sw = L.swing;
    [Sw.z0, Sw.z1].forEach(z => {
      [-1, 1].forEach(s => {
        const leg = mesh(cylY(0.06, 2.15), M.red, Sw.x + s * 0.29, 1.0, z, g);
        leg.rotation.z = s * 0.27;
      });
    });
    mesh(cylZ(0.07, Sw.z1 - Sw.z0 + 0.2), M.red, Sw.x, Sw.top, (Sw.z0 + Sw.z1) / 2, g);
    W.swings = [Sw.seatZ, Sw.z0 + Sw.z1 - Sw.seatZ].map((z, i) => {
      const p = prop(part('swing' + i, root, Sw.x, Sw.top, z));
      [-0.22, 0.22].forEach(dz => mesh(cylY(0.012, SWING_ROPE), M.dark, 0, -SWING_ROPE / 2, dz, p));
      mesh(rbox(0.3, 0.05, 0.52, 0.02), M.yellow, 0, -SWING_ROPE, 0, p);
      return p;
    });
    // --- slide: ladder, platform, chute ---
    const Sl = L.slide;
    [[-0.3, -0.3], [-0.3, 0.3], [0.3, -0.3], [0.3, 0.3]].forEach(([dx, dz]) => mesh(cylY(0.05, 1.5), M.blue, Sl.x + dx, 0.75, Sl.z + dz, g));
    slab(g, M.yellow, Sl.x - 0.36, 1.45, Sl.z - 0.36, 0.72, 0.08, 0.72, 0.02);
    for (let i = 1; i < 6; i++) mesh(cylZ(0.025, 0.6), M.blue, Sl.x - 0.33, i * 0.25, Sl.z, g);
    const chute = mesh(rbox(2.2, 0.05, 0.56, 0.02), M.red, Sl.x + 1.25, 0.82, Sl.z, g);
    chute.rotation.z = -0.62;
    [-0.27, 0.27].forEach(dz => { const r = mesh(box(2.2, 0.12, 0.03), M.red, Sl.x + 1.25, 0.9, Sl.z + dz, g); r.rotation.z = -0.62; });
    // --- sand pit with a bucket ---
    const Sp = L.sandpit;
    slab(g, M.wood, Sp.x - Sp.w / 2, 0, Sp.z - Sp.d / 2, Sp.w, 0.15, 0.1);
    slab(g, M.wood, Sp.x - Sp.w / 2, 0, Sp.z + Sp.d / 2 - 0.1, Sp.w, 0.15, 0.1);
    slab(g, M.wood, Sp.x - Sp.w / 2, 0, Sp.z - Sp.d / 2, 0.1, 0.15, Sp.d);
    slab(g, M.wood, Sp.x + Sp.w / 2 - 0.1, 0, Sp.z - Sp.d / 2, 0.1, 0.15, Sp.d);
    slab(g, M.sand, Sp.x - Sp.w / 2 + 0.1, 0, Sp.z - Sp.d / 2 + 0.1, Sp.w - 0.2, 0.08, Sp.d - 0.2);
    mesh(cylY(0.12, 0.2, 14, 0.09), M.blue, Sp.x + 0.6, 0.18, Sp.z, g);
    mesh(sphere(0.25, 12, 8), M.sand, Sp.x - 0.5, 0.06, Sp.z + 0.1, g).scale.set(1, 0.6, 1);
    // bench
    const bench = (x, z, ry) => {
      const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b);
      slab(b, M.wood, -0.7, 0.4, -0.2, 1.4, 0.05, 0.4, 0.02);
      slab(b, M.wood, -0.7, 0.55, -0.24, 1.4, 0.3, 0.05, 0.02);
      [-0.6, 0.6].forEach(dx => slab(b, M.dark, dx - 0.03, 0, -0.2, 0.06, 0.4, 0.4));
    };
    bench(13.2, 5.0, -PI / 2);
    bench(-10.0, 10.0, PI);
    // --- park: pond rim stones, a duck house, flowers are printed ---
    const Pd = L.pond, sr = seeded(8), stones = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * PI * 2;
      stones.push({ x: Pd.x + Math.cos(a) * (Pd.rx + 0.15), y: 0.04, z: Pd.z + Math.sin(a) * (Pd.rz + 0.15), ry: sr() * 3, s: [1 + sr() * 0.6, 0.5 + sr() * 0.3, 1] });
    }
    instanced(g, sphere(0.16, 8, 6), M.grey, stones);
    const pondWater = mesh(new THREE.CircleGeometry(1, 32).rotateX(-PI / 2), M.water, Pd.x, 0.03, Pd.z, g);
    pondWater.scale.set(Pd.rx, 1, Pd.rz); pondWater.userData.solo = true;
    // --- shop ---
    const Sh = L.shop;
    slab(g, MAT.shopOut, Sh.x0, 0, Sh.z0, Sh.x1 - Sh.x0, Sh.h, Sh.z1 - Sh.z0);
    slab(g, M.white, Sh.x0 - 0.15, Sh.h, Sh.z0 - 0.15, Sh.x1 - Sh.x0 + 0.3, 0.2, Sh.z1 - Sh.z0 + 0.3, 0.04);
    const awn = paint(0xffffff, { map: patternTex(32, 8, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#3f9a6a'; c.fillRect(0, 0, w / 2, h); }, [8, 1]) });
    const aw = mesh(box(Sh.x1 - Sh.x0 - 0.4, 0.05, 1.0), awn, (Sh.x0 + Sh.x1) / 2, 1.95, Sh.z1 + 0.45, g);
    aw.rotation.x = 0.35;
    mesh(box(3.2, 1.1, 0.05), shopWin, 16.0, 1.0, Sh.z1 + 0.03, g);
    slab(g, M.white, 14.35, 0.4, Sh.z1, 3.3, 0.08, 0.1);
    slab(g, M.green, 17.9, 0, Sh.z1, 0.9, 1.75, 0.06, 0.02);
    const sign = mesh(new THREE.PlaneGeometry(2.6, 0.5), decal(labelTex('SHOP', { w: 512, h: 100, fg: '#ffffff', bg: '#3f9a6a' })), 17.0, 2.15, Sh.z1 + 0.04, g);
    sign.userData.solo = true;
    [[14.8, M.red], [15.6, M.orange], [16.4, M.green]].forEach(([x, m]) => {
      slab(g, M.wood, x - 0.32, 0, Sh.z1 + 0.6, 0.64, 0.3, 0.45, 0.02);
      for (let i = 0; i < 6; i++) mesh(sphere(0.08, 10, 8), m, x - 0.2 + (i % 3) * 0.2, 0.36, Sh.z1 + 0.72 + Math.floor(i / 3) * 0.2, g);
    });
    // --- street: lamps (instanced), beacons at the crossing ---
    const R = L.road, lampSpots = [];
    [[-5.7, -12], [-5.7, -5], [-5.7, 8], [-5.7, 14], [-0.3, -12], [-0.3, -5.5], [-0.3, 6.5], [-0.3, 13]].forEach(([x, z]) => lampSpots.push({ x, z }));
    instanced(g, cylY(0.05, 2.4), M.dark, lampSpots.map(p => ({ x: p.x, y: 1.2, z: p.z })));
    instanced(g, sphere(0.16), N.street, lampSpots.map(p => ({ x: p.x, y: 2.5, z: p.z })), { shadow: false });
    const beacon = lamp(0xffb02e, 0.5);
    N.beacon = beacon;
    [[R.x0 - 0.55, L.crossZ - 1.1], [R.x1 + 0.55, L.crossZ - 1.1]].forEach(([x, z]) => {
      for (let i = 0; i < 6; i++) mesh(cylY(0.04, 0.25), i % 2 ? M.white : M.black, x, 0.125 + i * 0.25, z, g);
      mesh(sphere(0.14), beacon, x, 1.6, z, g).userData.solo = true;
    });
    // --- hedges along the house garden, and fence round the playground ---
    const Hs = L.house;
    slab(g, M.leaf, Hs.x0 - 0.5, 0, -0.45, (Hs.frontDoorX - 0.6) - (Hs.x0 - 0.5), 0.5, 0.4, 0.15);
    slab(g, M.leaf, Hs.frontDoorX + 0.6, 0, -0.45, (L.road.x0 - 1.2) - (Hs.frontDoorX + 0.6), 0.5, 0.4, 0.15);
    const P = L.play, pickets = [];
    for (let x = P.x0; x <= P.x1; x += 0.3) {
      if (Math.abs(x - P.gateX) > 0.7) pickets.push({ x, y: 0.3, z: P.z0 });
      pickets.push({ x, y: 0.3, z: P.z1 });
    }
    for (let z = P.z0 + 0.3; z < P.z1; z += 0.3) { pickets.push({ x: P.x0, y: 0.3, z }); pickets.push({ x: P.x1, y: 0.3, z }); }
    instanced(g, box(0.07, 0.6, 0.04), M.white, pickets);
    bake(g);
    // --- the car waiting at the crossing (drives on after the boy crosses) ---
    const car = prop(part('car', root, (R.x0 + R.x1) / 2 + 0.7, 0, L.crossZ - 2.6));
    slab(car, M.blue, -0.42, 0.14, -0.85, 0.84, 0.36, 1.7, 0.12);
    slab(car, M.blue, -0.38, 0.48, -0.5, 0.76, 0.34, 0.85, 0.1);
    slab(car, M.glass, -0.385, 0.53, -0.47, 0.77, 0.24, 0.79, 0.05);
    [[-0.4, -0.55], [0.4, -0.55], [-0.4, 0.55], [0.4, 0.55]].forEach(([x, z]) => {
      mesh(cylX(0.16, 0.12, 16), M.rubber, x, 0.16, z, car);
      mesh(cylX(0.08, 0.13, 12), M.chrome, x, 0.16, z, car);
    });
    [-0.26, 0.26].forEach(x => mesh(sphere(0.06), N.street, x, 0.35, 0.86, car));
    blob(car, 1.2, 2.1, 0, 0.012, 0);
    W.car = car;
  });

  // ===========================================================================
  // CHUNK 5: trees (instanced), clouds, sun, moon, stars
  chunks.push(() => {
    const spots = [
      // park
      [-20, 5, 1.1], [-18.4, 12.8, 1.2], [-16, 13.4, 0.9], [-13.2, 12.4, 1.05], [-20.6, 9.5, 1], [-12.8, 5.6, 0.85],
      [-7.6, 12.6, 1], [-8.9, 5.5, 0.8], [-18.2, 6.8, 0.75], [-11.6, 10.6, 0.7],
      // behind the houses / school / shop
      [-21.6, -10.5, 1.1], [-18.5, -12.6, 1.2], [-14.6, -11.2, 0.95], [-10.4, -12.8, 1.15], [-6.8, -10.6, 0.9],
      [0.8, -12.4, 1.1], [4.2, -11.6, 0.85], [8.6, -12.6, 1.2], [12.8, -10.9, 1], [16.8, -11.8, 1.1], [21.0, -9.6, 0.95],
      [21.4, -2.2, 0.9], [19.2, 2.4, 1.05], [17.4, 8.8, 1.1], [20.4, 12.6, 1], [16.6, 14.2, 0.85],
      // gardens
      [-20.8, -2.0, 0.8], [-7.4, -1.6, 0.7], [12.6, -2.0, 0.8], [0.6, 13.6, 0.9], [-2.0, 14.3, 0.7]
    ];
    const trunks = [], crownA = [], crownB = [], r = seeded(21);
    spots.forEach(([x, z, s], i) => {
      trunks.push({ x, y: 0.55 * s, z, s: [s, s, s] });
      const list = i % 2 ? crownA : crownB;
      list.push({ x, y: 1.55 * s, z, ry: r() * 3, s: [s, s * (0.95 + r() * 0.2), s] });
      list.push({ x: x + 0.3 * s, y: 2.15 * s, z: z - 0.1 * s, s: s * 0.68 });
    });
    instanced(root, cylY(0.11, 1.1, 8, 0.07), M.darkWood, trunks);
    instanced(root, sphere(0.78, 14, 10), M.leaf, crownA);
    instanced(root, sphere(0.78, 14, 10), M.leaf2, crownB);
    // clouds: puffs of a few balls, drifting slowly
    W.clouds = [];
    const cr = seeded(33);
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const m = mesh(sphere(0.6 + cr() * 0.6, 12, 8), N.clouds, (k - 2) * 0.75, cr() * 0.4, cr() * 0.5, c);
        m.castShadow = false; m.receiveShadow = false;
      }
      c.position.set(-24 + i * 9 + cr() * 3, 9 + cr() * 3, -13 - cr() * 6);
      c.userData.speed = 0.15 + cr() * 0.15;
      root.add(c);
      W.clouds.push(c);
    }
    updaters.push(dt => W.clouds.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > 28) c.position.x = -28; }));
    // the sun and moon move across the sky behind the town (scene.js sets them)
    W.sun = mesh(sphere(1.8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe9a8, fog: false, transparent: true }), 0, 10, -60, root);
    W.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot('rgba(255,236,170,.9)', 'rgba(255,236,170,0)'), fog: false, transparent: true, depthWrite: false }));
    W.sunGlow.scale.set(11, 11, 1); W.sun.add(W.sunGlow);
    W.moon = mesh(sphere(1.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f1dc, fog: false, transparent: true, opacity: 0 }), -22, 18, -60, root);
    [W.sun, W.moon].forEach(m => { m.castShadow = m.receiveShadow = false; });
    const n = [160, 260, 420][TIER], pos = new Float32Array(n * 3), sr = seeded(45);
    for (let i = 0; i < n; i++) {
      const a = (sr() - 0.5) * PI * 1.6, e = 0.08 + sr() * 1.2, R = 85;
      pos.set([Math.sin(a) * Math.cos(e) * R, Math.sin(e) * R, -Math.cos(a) * Math.cos(e) * R], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    W.stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.1, map: softDot(), color: 0xfff8e0, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    W.stars.frustumCulled = false;
    root.add(W.stars);
  });

  // ===========================================================================
  // CHUNK 6: the boy and the things he holds
  let boy = null;
  const P = pose({}), target = pose({}), snap = pose({}), scratch = pose({});
  const walker = { s: 0, phase: 0, yaw: 0, walking: false, mode: '', blend: 1 };
  let outfitNow = '';
  chunks.push(() => {
    boy = makeKid(BOY_LOOK);
    root.add(boy.root);
    boy.shadow = blob(root, 0.7, 0.7);
    const H = boy.handR;
    // things held in the right hand point along their local -y, the far end at `tip`;
    // setupBite aims each one at the mouth for that stop's bite pose
    const tool = (name, build, rest, tip, gap) => {
      const p = part(name, H);
      build(p);
      const B = setupBite(boy, rest, p, tip, gap);
      p.visible = false; prop(p);
      return [p, B];
    };
    [W.spoon, W.biteTable] = tool('spoon', p => {
      mesh(cylY(0.008, 0.13), M.chrome, 0, -0.06, 0, p);
      mesh(sphere(0.022, 10, 6), M.chrome, 0, -0.135, 0, p).scale.set(1, 1.3, 0.5);
      mesh(sphere(0.016, 8, 6), paint(0xe0b06a, { roughness: 0.95 }), 0, -0.138, 0.006, p).scale.set(1, 1, 0.5);   // cereal
    }, stops.breakfast.base, 0.155, 0.1);
    [W.fork] = tool('fork', p => {
      mesh(cylY(0.008, 0.13), M.chrome, 0, -0.06, 0, p);
      [-0.01, 0, 0.01].forEach(x => mesh(cylY(0.0035, 0.04), M.chrome, x, -0.14, 0, p));
      mesh(sphere(0.016, 8, 6), M.green, 0, -0.15, 0, p);
    }, stops.dinner.base, 0.165, 0.1);
    [W.brush, W.biteBrush] = tool('brush', p => {
      mesh(rbox(0.022, 0.15, 0.018, 0.007), M.sky, 0, -0.065, 0, p);
      mesh(box(0.024, 0.03, 0.026), M.white, 0, -0.13, 0.012, p);
    }, stops.wash.base, 0.15, 0.08);
    [W.sandwich, W.biteDesk] = tool('sandwich', p => {
      mesh(rbox(0.1, 0.11, 0.022, 0.008), M.cream, 0, -0.055, -0.018, p);
      mesh(box(0.1, 0.1, 0.012), M.green, 0, -0.055, 0, p);
      mesh(rbox(0.1, 0.11, 0.022, 0.008), M.cream, 0, -0.055, 0.018, p);
    }, stops.lunch.base, 0.11, 0.075);
    // toothpaste foam round the mouth
    W.foam = part('foam', boy.mouthAt, 0, 0, -0.005); W.foam.visible = false;
    [[-0.03, 0, 0, 0.018], [0.03, 0.003, 0, 0.017], [0, -0.016, 0.004, 0.019], [-0.015, 0.014, 0.004, 0.013], [0.018, -0.012, 0.003, 0.015], [0.0, 0.01, 0.01, 0.012]]
      .forEach(([x, y, z, r]) => mesh(sphere(r, 10, 8), M.white, x, y, z, W.foam));
    prop(W.foam);
    // the T-shirt that drops on (get dressed): the boy's own shirt shape, a bit bigger
    const tee = paint(BOY_DAY.shirt, { roughness: 0.8 });
    W.tshirt = part('tshirt', root); W.tshirt.visible = false;
    W.tshirt.rotation.order = 'YXZ';
    mesh(boy.shirtGeo, tee, 0, 0, 0, W.tshirt).scale.set(1.08, 1.03, 1.1);
    [-1, 1].forEach(s => mesh(sphere(0.056, 12, 8), tee, s * 0.135, 0.285, 0, W.tshirt));
    prop(W.tshirt);
    // the storybook: held at the chest, three pages turn
    W.book = part('book', boy.chest, 0, -0.02, 0.03); W.book.visible = false;
    W.book.rotation.x = -0.95;
    prop(W.book);
    slab(W.book, M.red, -0.18, -0.012, -0.12, 0.36, 0.012, 0.24, 0.005);
    slab(W.book, M.white, -0.17, 0, -0.115, 0.165, 0.02, 0.23);
    slab(W.book, M.white, 0.005, 0, -0.115, 0.165, 0.02, 0.23);
    W.pages = [0, 1, 2].map(i => {
      const pg = prop(part('page' + i, W.book, 0, 0.022 + i * 0.002, 0));
      const leaf = mesh(new THREE.PlaneGeometry(0.165, 0.23).rotateX(-PI / 2), paint(0xffffff, { side: THREE.DoubleSide, map: pageTex(i) }), -0.0825, 0, 0, pg);
      leaf.castShadow = false;
      return pg;
    });
    props[props.length - 1 - 3].vis = false;
    // bath bubbles: floating ones and a foam heap on the water
    W.bubbles = [];
    const br = seeded(61);
    for (let i = 0; i < BUBBLES; i++) {
      const b = prop(mesh(sphere(0.03 + br() * 0.035, 12, 8), MAT.bubble, -14.15, HF + 0.4, -7.43, root));
      b.castShadow = false; b.visible = false; props[props.length - 1].vis = false;
      b.userData.seed = [br(), br(), br()];
      W.bubbles.push(b);
    }
    W.heap = [];
    for (let i = 0; i < 12; i++) {
      const h = prop(mesh(sphere(0.07 + br() * 0.06, 12, 8), M.white, -14.6 + br() * 1.1, HF + 0.38, -7.75 + br() * 0.6, root));
      h.scale.set(1, 0.6, 1); h.castShadow = false; h.visible = false; props[props.length - 1].vis = false;
      W.heap.push(h);
    }
  });

  // ===========================================================================
  // STOPS. cam: target, dist, yaw (0 = from the near edge), pitch.
  // at: route node; inside: which cutaway opens; tod: time of day 0 dawn .. 1 night;
  // outfit: what he wears there; base: rest pose; play(t, P, ctx): t 0..dur.
  const S = (key, o) => { stops[key] = Object.assign({ inside: null, follow: false, outfit: 'day', play: () => {}, dur: 3 }, o); };
  const stand = (x, z, yaw, floor, over) => pose(Object.assign({ x, y: floor + C.HIP_H, z, yaw }, over));
  // in bed: on his back, head on the pillow (the duvet follows his pitch, see updateBoy)
  const LIE = pose({ x: -18.45, y: BED_TOP + 0.11, z: -7.33, yaw: PI / 2, pitch: -1.42,
    laF: 0.1, raF: 0.1, laE: 0.25, raE: 0.25, laS: 0.16, raS: 0.16, eyes: 0 });
  const LIE_AWAKE = Object.assign(pose(LIE), { eyes: 1 });
  const BEDSIT = sitLegsOut(-18.62, BED_TOP, -7.33, PI / 2, { pitch: -0.12 });
  const sitAtTable = (over) => sitPose(-7.6, HF + CHAIR_SEAT, -6.95, 0, Object.assign({ spine: 0.12, laF: 0.75, laE: 0.6 }, over));
  const sitAtDesk = (over) => sitPose(3.85, SF + DESK_SEAT, -5.6, -PI / 2, Object.assign({ spine: 0.1, laF: 0.9, laE: 0.8, raF: 0.9, raE: 0.8 }, over));
  const PROP_IN = 0.05;      // an act's props appear just after it starts (never in the arrive pose)

  S('wake', { cam: { t: [-17.4, 1.0, -6.6], d: 7.2, yaw: 0.18, pitch: 0.4 }, at: 0, inside: 'house', bed: true, tod: 0, outfit: 'pj', dur: 3.6,
    base: LIE,
    play(t, P) {
      blendPose(LIE, BEDSIT, seg(t, 0.5, 1.5), P);
      P.eyes = seg(t, 0.1, 0.5) * (1 - bump(t, 1.6, 2.7) * 0.75);
      const up = seg(t, 1.5, 2.1) * (1 - seg(t, 2.8, 3.4));
      P.laF = lerp(P.laF, 2.85, up); P.raF = lerp(P.raF, 2.85, up);
      P.laS = lerp(P.laS, 0.35, up); P.raS = lerp(P.raS, 0.35, up);
      P.laE = lerp(P.laE, 0.15, up); P.raE = lerp(P.raE, 0.15, up);
      P.pitch -= up * 0.12; P.hp = -0.25 * up;
      P.mouth = bump(t, 1.6, 2.8) * 0.75;           // a yawn: a small dark oval
    } });

  S('wash', { cam: { t: [-13.4, 1.0, -6.4], d: 6.2, yaw: -0.12, pitch: 0.36 }, at: 2, inside: 'house', tod: 0.06, outfit: 'pj', dur: 4.2,
    base: stand(-12.74, -6.6, PI / 2, HF),
    play(t, P) {
      W.brush.visible = t > 0.25 && t < 3.6;
      const up = seg(t, 0.25, 0.8) * (1 - seg(t, 3.3, 3.8)), B = W.biteBrush || P;
      P.raF = lerp(P.raF, B.raF, up); P.raE = lerp(P.raE, B.raE, up); P.raS = lerp(P.raS, B.raS, up);
      if (t > 0.9 && t < 3.0) P.raS += Math.sin(t * 22) * 0.06 * up;
      P.spine = 0.08 + bump(t, 3.0, 3.8) * 0.3;
      P.hp = bump(t, 3.0, 3.8) * 0.3;
      const f = seg(t, 1.0, 1.7) * (1 - seg(t, 3.05, 3.45));
      W.foam.visible = f > 0.02;
      W.foam.scale.setScalar(Math.max(0.01, f));
      P.eyes = 1 - bump(t, 3.0, 3.7) * 0.8;
      P.mouth = bump(t, 0.6, 1.0) * 0.3;
    } });

  S('dress', { cam: { t: [-16.2, 1.0, -6.4], d: 6.4, yaw: -0.08, pitch: 0.36 }, at: 4, inside: 'house', tod: 0.12, outfit: 'pj', dur: 2.8,
    base: stand(-15.75, -6.6, 0, HF),
    play(t, P, ctx) {
      const up = seg(t, 0.1, 0.5) * (1 - seg(t, 1.25, 1.7));
      P.laF = P.raF = lerp(0, 2.9, up); P.laS = P.raS = lerp(0.08, 0.2, up); P.laE = P.raE = lerp(0.15, 0.1, up);
      const drop = seg(t, 0.45, 1.2, easeOut);
      W.tshirt.visible = t > 0.35 && t < 1.2;
      W.tshirt.position.set(P.x, P.y + 0.02 + (1 - drop) * 1.1, P.z);
      W.tshirt.rotation.set(0, P.yaw, 0);
      if (t >= 1.2) ctx.outfit = 'day';
      P.bob = bump(t, 1.9, 2.4) * 0.14;
      P.llK = P.rlK = bump(t, 1.85, 2.0) * 0.5 + bump(t, 2.35, 2.55) * 0.5;
      P.mouth = t > 2.2 ? 0.2 : 0;
      P.hp = -bump(t, 0.1, 1.2) * 0.25;
    } });

  S('breakfast', { cam: { t: [-7.7, 0.95, -6.5], d: 5.6, yaw: -0.18, pitch: 0.38 }, at: 8, inside: 'house', tod: 0.18, dur: 3.4,
    base: sitAtTable({ raF: 0.8, raE: 0.6, raS: -0.15 }),
    play(t, P) {
      // the bowl and spoon belong to the act (not the arrive pose)
      W.bowl.visible = W.spoon.visible = t > PROP_IN;
      const eaten = eatCycle(t, P, W.biteTable, 0.15, 1.05, 3);
      W.cereal.position.y = 0.075 - eaten * 0.055;
      W.cereal.scale.setScalar(1 - eaten * 0.25);
    } });

  S('walk', { cam: { t: [-3.6, 0.6, 1.0], d: 12.5, yaw: 0.28, pitch: 0.46 }, at: 13, follow: true, tod: 0.25, dur: 2.8,
    base: stand(-4.6, 1.5, PI / 2, 0),
    play(t, P) {
      // traffic drives on the LEFT (Malta, UK): the near lane comes from his right,
      // so: look right, left, right again (hy < 0 = his right, +z)
      P.hy = -0.9 * seg(t, 0.15, 0.55) * (1 - seg(t, 0.85, 1.2))
           + 0.9 * seg(t, 1.2, 1.55) * (1 - seg(t, 1.85, 2.2))
           - 0.9 * seg(t, 2.2, 2.5) * (1 - seg(t, 2.65, 2.8));
    } });
  // across the road: the whole crossing is walked (fullWalk, no skip ahead); the
  // car waits, then drives on while he waves
  S('cross', { cam: { t: [-2.6, 0.6, 1.0], d: 12.5, yaw: 0.22, pitch: 0.46 }, at: 14, follow: true, fullWalk: true, tod: 0.27, dur: 2.2,
    base: stand(-1.4, 1.5, PI / 2, 0),
    play(t, P) {
      const up = seg(t, 0.1, 0.45) * (1 - seg(t, 1.7, 2.2));
      P.raF = lerp(P.raF, 2.6, up); P.raE = lerp(P.raE, 0.45, up);
      P.raS = lerp(P.raS, 0.25, up) + Math.sin(t * 11) * 0.22 * up;
      P.mouth = up * 0.25;
      W.car.position.z += seg(t, 0.3, 1.9, x => x * x) * 9;
    } });

  S('class', { cam: { t: [4.2, 1.1, -6.5], d: 9, yaw: 0.05, pitch: 0.38 }, at: 21, inside: 'school', tod: 0.33, dur: 2.8,
    base: sitAtDesk(),
    play(t, P) {
      const up = seg(t, 0.1, 0.55) * (1 - seg(t, 2.0, 2.5));
      P.raF = lerp(0.9, 2.95, up); P.raE = lerp(0.8, 0.1, up); P.raS = lerp(0.08, 0.15, up);
      P.raS += Math.sin(t * 11) * 0.12 * bump(t, 0.6, 1.9);
      P.bob = bump(t, 0.5, 0.9) * 0.04;
      P.spine = 0.1 - up * 0.1;
      P.mouth = bump(t, 0.6, 1.8) * 0.4;
      // the teacher turns, points to him, nods
      const tp = W.teacherPose;
      tp.hy = -0.55 * seg(t, 0.3, 0.9) * (1 - seg(t, 2.2, 2.7));
      tp.raF = 1.4 * bump(t, 0.6, 2.2); tp.raS = 0.3 * bump(t, 0.6, 2.2);
      tp.hp = 0.18 * bump(t, 1.6, 2.1);
    } });

  // lunch: the whole class eats, each something different, each on its own beat
  S('lunch', { cam: { t: [4.5, 0.95, -6.5], d: 7.2, yaw: -0.2, pitch: 0.38 }, at: 21, inside: 'school', tod: 0.42, dur: 4.4,
    base: sitAtDesk({ raF: 0.8, raE: 0.6, raS: -0.15 }),
    play(t, P) {
      W.lunchbox.visible = t > PROP_IN;
      const eaten = eatCycle(t, P, W.biteDesk, 0.15, 1.1, 3);
      W.sandwich.visible = t > PROP_IN && eaten < 0.98;
      W.sandwich.scale.set(1, Math.max(0.05, 1 - eaten * 0.9), 1);
      W.mateT = t;
    } });

  const Sw = L.swing;
  const swingAngle = t => SWING_AMP * seg(t, 0, 1.6, x => x) * (1 - seg(t, 5.8, 7.4, x => x)) * Math.sin(t / SWING_PERIOD * PI * 2);
  S('playground', { cam: { t: [6.6, 1.1, 6.2], d: 10.5, yaw: 0.12, pitch: 0.3 }, at: 29, follow: true, tod: 0.55, dur: 7.4,
    base: pose({ x: Sw.x, y: Sw.seatY + 0.06, z: Sw.seatZ, yaw: PI / 2, llF: 1.4, rlF: 1.4, llK: 1.4, rlK: 1.4,
      laF: 0.75, raF: 0.75, laE: 1.3, raE: 1.3, laS: 0.25, raS: 0.25 }),
    play(t, P) {
      const th = swingAngle(t), w = Math.cos(t / SWING_PERIOD * PI * 2);
      W.swings[0].rotation.x = 0; W.swings[0].rotation.z = th;
      P.x = Sw.x + Math.sin(th) * SWING_ROPE;
      P.y = Sw.top - Math.cos(th) * SWING_ROPE + 0.06;
      P.pitch = -th;
      // pump: legs out on the way forward, tucked on the way back
      const amp = Math.abs(th) > 0.02 ? 1 : 0;
      P.llK = P.rlK = lerp(1.4, 0.4 + 0.9 * (1 - w) / 2, amp);
      P.mouth = Math.abs(th) > 0.35 ? 0.45 : 0.1;
    } });

  S('home', { cam: { t: [-10.9, 0.75, -6.4], d: 5.8, yaw: 0.1, pitch: 0.42 }, at: 41, inside: 'house', tod: 0.66, dur: 4.6,
    base: sitLegsOut(-11.0, HF, -6.85, 0, { laF: 0.6, raF: 0.6, laE: 0.6, raE: 0.6, spine: 0.15 }),
    play(t, P) {
      const tower = [-10.4, -6.62];
      W.blocks.forEach((b, i) => {
        const t0 = 0.3 + i * 0.8, u = seg(t, t0, t0 + 0.65);
        if (u <= 0) return;
        const from = props.find(q => q.obj === b);
        b.position.set(lerp(from.p.x, tower[0], u), lerp(from.p.y, HF + 0.075 + i * 0.15, u) + bump(u, 0, 1) * 0.45, lerp(from.p.z, tower[1], u));
        b.rotation.y = lerp(from.r.y, 0, u);
        const reach = bump(u, 0, 1);
        P.raF = lerp(0.6, 1.3, reach); P.raE = lerp(0.6, 0.3, reach);
        P.laF = lerp(0.6, 1.2, reach * u); P.laS = lerp(0.08, 0.4, reach * u);
        P.hy = lerp(0.5, -0.6, u) * reach;
      });
      P.hp = 0.15 - seg(t, 4.0, 4.4) * 0.35;
      P.mouth = t > 4.2 ? 0.3 : 0;
      P.bob = bump(t, 4.1, 4.5) * 0.03;
    } });

  S('dinner', { cam: { t: [-7.6, 0.95, -6.5], d: 5.8, yaw: 0.2, pitch: 0.38 }, at: 43, inside: 'house', tod: 0.8, dur: 3.4,
    base: sitAtTable({ raF: 0.8, raE: 0.6, raS: -0.15 }),
    play(t, P) {
      W.plate.visible = W.fork.visible = t > PROP_IN;
      const eaten = eatCycle(t, P, W.biteTable, 0.15, 1.05, 3);
      W.food.scale.setScalar(Math.max(0.02, 1 - eaten * 0.95));
    } });

  const tubY = HF + 0.06;
  S('bath', { cam: { t: [-13.9, 0.75, -7.1], d: 5.2, yaw: 0.22, pitch: 0.46 }, at: 46, inside: 'house', tod: 0.88, outfit: 'bath', dur: 4.8,
    base: sitLegsOut(-14.6, tubY, -7.43, PI / 2, { laF: 0.5, raF: 0.5, laE: 0.8, raE: 0.8, laS: 0.3, raS: 0.3, pitch: -0.1 }),
    play(t, P) {
      const sp = bump(t, 0.15, 1.8);
      P.laF = 0.5 + sp * (0.6 + Math.sin(t * 14) * 0.35); P.raF = 0.5 + sp * (0.6 + Math.sin(t * 14 + 1.6) * 0.35);
      P.mouth = sp * 0.5 + (t > 3 ? 0.25 : 0);
      P.hy = Math.sin(t * 2.2) * 0.25 * seg(t, 1.8, 2.4);
      W.heap.forEach((h, i) => { const k = seg(t, 0.2 + i * 0.08, 0.9 + i * 0.08); h.visible = k > 0.01; h.scale.set(k, k * 0.6, k); });
      W.bubbles.forEach((b, i) => {
        const [r1, r2, r3] = b.userData.seed, t0 = 0.3 + i * (3.0 / BUBBLES), life = 1.6 + r1;
        const u = (t - t0) / life;
        b.visible = u > 0 && u < 1;
        if (!b.visible) return;
        b.position.set(-14.7 + r2 * 1.2 + Math.sin(u * 6 + r3 * 6) * 0.08, HF + 0.42 + u * 1.1, -7.7 + r3 * 0.55);
        b.scale.setScalar(u > 0.92 ? Math.max(0.01, (1 - u) / 0.08) : 1);
      });
      W.duck.position.x = -13.75 - seg(t, 0.3, 3.5) * 0.3;
      W.duck.position.y += Math.sin(t * 5) * 0.02 * (1 - seg(t, 3.8, 4.6));
    } });

  // arrive: he sits up in bed, hands on the duvet, no book yet. The act: the
  // book comes up and opens, three pages turn, then it is put away (so the
  // next page, lying down, starts from an empty-handed sitting pose)
  const READ = { laF: 1.0, raF: 1.0, laE: 1.2, raE: 1.2, laS: -0.25, raS: -0.25, hp: 0.35 };
  S('story', { cam: { t: [-18.3, 0.95, -7.0], d: 5.0, yaw: 0.38, pitch: 0.36 }, at: 49, inside: 'house', bed: true, tod: 0.95, outfit: 'pj', dur: 5.4,
    base: pose(BEDSIT),
    play(t, P) {
      const hold = seg(t, 0.05, 0.6) * (1 - seg(t, 4.7, 5.3));
      for (const k in READ) P[k] = lerp(P[k], READ[k], hold);
      W.book.visible = t > 0.25 && t < 5.0;
      W.book.scale.setScalar(Math.max(0.01, seg(t, 0.25, 0.6) * (1 - seg(t, 4.75, 5.0))));
      W.pages.forEach((pg, i) => {
        const t0 = 0.9 + i * 1.25, u = seg(t, t0, t0 + 0.8);
        pg.rotation.z = -u * (PI - 0.02 * (2 - i));
        if (u > 0 && u < 1) P.raF = 1.0 + bump(u, 0, 1) * 0.25;
      });
      P.hy = Math.sin(t * 1.3) * 0.1 * hold;
      P.mouth = bump(t, 4.2, 4.9) * 0.25;
    } });

  // good night: he lies down as the page arrives (blend from the story pose);
  // the play: a last yawn, eyes close, light off, the glow stars come out
  S('sleep', { cam: { t: [-17.9, 0.9, -6.8], d: 6.2, yaw: 0.12, pitch: 0.42 }, at: 49, inside: 'house', bed: true, tod: 1, outfit: 'pj', dur: 3.8,
    settle: 1.2, base: LIE_AWAKE,
    play(t, P) {
      P.mouth = bump(t, 0.15, 0.85) * 0.55;          // a last yawn
      P.hy = -0.15 * seg(t, 0.2, 0.8);              // head turns a little into the pillow
      P.eyes = 1 - seg(t, 0.9, 1.7) - bump(t, 0.5, 0.7) * 0.6;
      W.bedLamp = 1 - seg(t, 2.0, 2.15, x => x);
      W.glow = seg(t, 2.15, 3.4);
    } });

  // =========================================================================
  // per-frame: the boy's walk / pose, the active stop's animation, faders
  let activeKey = null;
  let animT = 0;                    // seconds into the active stop's play
  let animGoal = 0;                 // where animT is heading: 0 (arrive step) or dur (act step)
  let settleNow = false;            // next frame: doors and cutaways jump to their state
  const ctx = { outfit: 'pj' };
  // one story step: `act` false = arrive at the stop (rest pose), true = its routine.
  // dir < 0 (going back) to another stop: he walks back and ends in its end pose.
  function setStep(key, act, { instant = false, dir = 1 } = {}) {
    const st = stops[key];
    if (!st) return;
    if (key !== activeKey) {
      const prev = stops[activeKey];
      // the crossing is walked in full: forwards onto it, or back over it to the kerb
      walker.full = dir > 0 ? !!st.fullWalk : !!(prev && prev.fullWalk);
      activeKey = key;
      animT = dir < 0 && act ? st.dur : 0;
      Object.keys(fades).forEach(k => { fades[k].target = st.inside === k ? 1 : 0; });
    }
    animGoal = act ? st.dur : 0;
    if (instant) snapStep();
  }
  // land the running step at its end: routine at its goal, boy at his spot, settled
  function snapStep() {
    const st = stops[activeKey];
    if (!st) return;
    animT = animGoal;
    walker.s = CUM[st.at]; walker.goal = null; walker.walking = false; walker.jump = false;
    walker.mode = 'stop:' + activeKey; walker.blend = 1;
    settleNow = true;
  }
  function running() {
    const st = stops[activeKey];
    return !!st && (animT !== animGoal || walker.walking || walker.blend < 1 ||
      Math.abs(CUM[st.at] - walker.s) > 0.01 || walker.mode !== 'stop:' + activeKey);
  }
  const rp = {};
  const CROSS_SPEED = (CUM[14] - CUM[13]) / CROSS_TIME;
  const CROSS_STRIDE = 2 * CROSS_SPEED / CROSS_CADENCE;     // two steps
  const CROSS_AMP = strideAmp(CROSS_STRIDE / 2);
  // is the boy (x, z) inside building k (house / school)? The cutaway opens
  // only while the active stop is inside it and he is in (or not walking)
  function inBuilding(k, x, z) {
    const b = L[k];
    return x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 - 0.05;
  }
  function updateBoy(dt, st, camBusy) {
    const goal = CUM[st.at], ds = goal - walker.s;
    walker.walking = Math.abs(ds) > 0.01;
    let speed = 0;
    if (walker.walking) {
      // a new goal: never more than WALK_MAX_TIME of walking. A longer route is
      // skipped ahead (he reappears closer, while the camera is flying), except
      // that a door near the end is kept so he walks in through it.
      if (walker.goal !== goal) {
        walker.goal = goal;
        const max = WALK_SPEED * WALK_MAX_TIME, sg = Math.sign(ds);
        if (Math.abs(ds) > max && !walker.full) {
          let start = goal - sg * max;
          DOOR_S.forEach(sd => {
            const before = (sd - walker.s) * sg > 0 && (goal - sd) * sg > 0;
            if (before && Math.abs(goal - sd) <= DOOR_REACH && Math.abs(goal - sd) + DOOR_RUNUP > max) start = sd - sg * DOOR_RUNUP;
          });
          walker.s = start;
          walker.jump = true;
        }
      }
      speed = walker.full ? CROSS_SPEED : WALK_SPEED;
      const dsNow = goal - walker.s;
      const step = Math.sign(dsNow) * Math.min(Math.abs(dsNow), speed * dt);
      walker.s += step;
      walker.phase += Math.abs(step) / (walker.full ? CROSS_STRIDE : WALK_STRIDE) * PI * 2;
    } else walker.goal = null;
    const mode = walker.walking ? 'walk' : 'stop:' + activeKey;
    if (mode !== walker.mode) { Object.assign(snap, P); walker.blend = 0; walker.mode = mode; }
    // the stop's own pose + animation (props are posed even while he walks)
    restoreProps();
    W.bedLamp = 1; W.glow = 0; W.mateT = null;
    ctx.outfit = st.outfit;
    const t = animT;
    Object.assign(scratch, st.base);
    st.play(t, scratch, ctx);
    if (walker.walking) {
      routeAt(walker.s, rp);
      const dir = rp.dir + (ds < 0 ? PI : 0);
      walker.yaw = walker.jump ? dir : walker.yaw + dAngle(walker.yaw, dir) * Math.min(1, dt * 10);
      Object.assign(target, C.STAND, { x: rp.x, y: rp.y + C.HIP_H, z: rp.z, yaw: walker.yaw });
      walkPose(target, walker.phase, walker.full ? CROSS_AMP : 1);
      if (walker.jump) { Object.assign(snap, target); walker.blend = 1; walker.jump = false; }
    } else {
      Object.assign(target, scratch);
      walker.yaw = target.yaw;
    }
    walker.outside = walker.walking && !(st.inside && inBuilding(st.inside, rp.x, rp.z));
    walker.blend = Math.min(1, walker.blend + dt / (walker.walking ? BLEND_TIME : st.settle || BLEND_TIME));
    blendPose(snap, target, ease(walker.blend), P);
    // the duvet: over his legs when he sits up, up to his chest when he lies down
    if (st.bed && !walker.walking) setDuvet(DUVET.sit, DUVET.lie, clamp((-P.pitch - 0.12) / 1.3));
    else setDuvet(DUVET.made);
    // on the way he wears what the next stop needs (but never walks in bath mode)
    if (walker.walking) ctx.outfit = st.outfit === 'bath' ? (outfitNow && outfitNow !== 'bath' ? outfitNow : 'day') : st.outfit;
    if (ctx.outfit !== outfitNow) { boy.setOutfit(ctx.outfit); outfitNow = ctx.outfit; }
    boy.apply(P);
    boy.shadow.position.set(P.x, (walker.walking ? rp.y : ROUTE[st.at][2]) + 0.012, P.z);
    boy.shadow.visible = P.pitch > -0.5 && st.key !== 'bath';
  }

  function update(dt, t, camBusy) {
    updaters.forEach(u => u(dt, t));
    const st = stops[activeKey];
    if (st && boy) {
      st.key = activeKey;
      // the animation waits for the camera and for him to arrive
      const ready = !camBusy && !walker.walking && walker.blend >= 1;
      if (ready && animT !== animGoal) animT = animGoal > animT ? Math.min(animGoal, animT + dt) : Math.max(animGoal, animT - dt);
      updateBoy(dt, st, camBusy);
      if (activeKey !== 'class') Object.assign(W.teacherPose, { hy: 0, raF: 0.1, raS: 0.08, hp: 0 });
      W.teacher.apply(W.teacherPose);
      // classmates: sitting still, or eating at lunch (each on its own beat)
      W.mates.forEach(k => {
        const mp = Object.assign(k.mp || (k.mp = pose({})), k.rest);
        if (W.mateT != null) {
          const c = k.cfg, eaten = eatCycle(W.mateT, mp, k.food.B, c.t0, c.per, 3);
          k.food.hold.visible = eaten < 0.98;
          if (c.food === 'apple') k.food.hold.scale.setScalar(1 - eaten * 0.45);
          if (c.food === 'banana') k.food.hold.scale.set(1, Math.max(0.05, 1 - eaten * 0.85), 1);
          if (k.pot) k.pot.visible = true;
        }
        k.apply(mp);
      });
      // doors swing open while he is near them
      doors.forEach(d => {
        const near = Math.hypot(P.x - d.x, P.z - d.z) < DOOR_NEAR;
        d.v = settleNow ? (near ? 1 : 0) : clamp(d.v + (near ? dt : -dt) * DOOR_RATE);
        d.leaf.rotation.y = d.dir * ease(d.v) * DOOR_ANGLE;
      });
    }
    // cutaways: a pure function of the step. Open while the active stop is in
    // that building, except while he is still walking up to it outdoors (it
    // opens as he goes through the door); jumps and snaps land at once
    for (const k in fades) {
      const f = fades[k];
      f.target = st && st.inside === k && !(boy && walker.outside) ? 1 : 0;
      if (settleNow) f.v = f.target;
      else f.v += clamp(f.target - f.v, -dt * FADE_RATE, dt * FADE_RATE);
      const o = 1 - ease(f.v);
      f.mats.forEach(m => { m.opacity = o; m.depthWrite = o > 0.98; m.visible = o > 0.02; });
      f.roof.position.y = ease(f.v) * ROOF_LIFT;
    }
    if (boy) settleNow = false;
  }
  function boyPos(out) { return out.set(P.x, P.y + 0.2, P.z); }
  function busy() { return walker.walking; }

  return { root, chunks, stops, W, N, update, setStep, snap: snapStep, running, boyPos, busy,
    get activeKey() { return activeKey; } };
}

// chalk on the blackboard
function blackboardTex() {
  const [c, g] = canvas(768, 256);
  g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, 768, 256);
  g.fillStyle = 'rgba(255,255,255,.05)';
  for (let i = 0; i < 40; i++) g.fillRect(Math.random() * 768, Math.random() * 256, 60, 6);
  g.fillStyle = '#f4f1e4'; g.font = 'bold 76px "Comic Sans MS", "Chalkboard SE", sans-serif';
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('1 + 2 = ?', 40, 90);
  g.font = 'bold 58px "Comic Sans MS", "Chalkboard SE", sans-serif';
  g.fillStyle = '#f6d36b'; g.fillText('A  b  C', 470, 90);
  g.strokeStyle = '#f4f1e4'; g.lineWidth = 6;
  g.beginPath(); g.arc(130, 190, 34, 0, Math.PI * 2); g.stroke();                 // a chalk sun
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(130 + Math.cos(a) * 44, 190 + Math.sin(a) * 44); g.lineTo(130 + Math.cos(a) * 60, 190 + Math.sin(a) * 60); g.stroke(); }
  g.beginPath(); g.moveTo(300, 225); g.lineTo(360, 160); g.lineTo(420, 225); g.closePath(); g.stroke();   // a house
  g.strokeRect(310, 225, 100, 0.1);
  return tex(c);
}
// a picture-book page: a few coloured shapes and lines of "text"
function pageTex(i) {
  const [c, g] = canvas(128, 176);
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 128, 176);
  g.fillStyle = ['#f0c23b', '#5fa04e', '#3f7fc0'][i];
  g.beginPath(); g.arc(64, 60, 32, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#9a8f80';
  for (let k = 0; k < 4; k++) g.fillRect(18, 112 + k * 14, 92 - (k % 2) * 24, 5);
  return tex(c);
}

window.MYDAY = Object.assign(window.MYDAY, { buildWorld, ROUTE });
})();
