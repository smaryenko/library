// MY DAY: the boy (and the other people in town), built in code.
//
// Toy-diorama figures with child proportions (head about 1/4.3 of the
// height): a neck, a smooth lathed torso (shirt over trousers), continuous
// capsule arms and legs whose joints are hidden by round shoulder / elbow /
// knee balls, mitten hands, shoes. Face: eye whites, a coloured iris, pupil
// and highlight, an upper lid that closes (blink / sleep), eyebrows, a small
// nose, ears and a closed smile line. The mouth only opens as a small dark
// shape (no tongue, no lip colour). Hair is built from a few overlapping
// shells and tufts; each person gets a style (`hair`), colours and skin tone.
// Poses are flat objects of numbers so any two can be blended (`blendPose`).
//
// Rig: root sits at the HIPS (so lying down pivots there). Local +z is the
// way the figure faces, +y up. The figure's left is local +x.
(function () {
'use strict';
const C = window.MYDAY;
if (!C.THREE) return;
const { THREE, paint, mesh, rbox, sphere, capsule, patternTex, lerp, dAngle } = C;

// --- body measurements (child, scale 1) ------------------------------------
const THIGH = 0.21, SHIN = 0.2, ANKLE = 0.04;   // ankle above the floor
const HIP_H = THIGH + SHIN + ANKLE;              // 0.45: hips above the floor
const HIP_X = 0.065;                             // hip pivots, left/right
const SHOULDER_Y = 0.285, SHOULDER_X = 0.135;
const UPPER_ARM = 0.15, FOREARM = 0.135;
const NECK_Y = 0.38;                             // head pivot (top of the neck)
const HEAD_R = 0.118, HEAD_CY = 0.115;           // skull radius / centre above the pivot
const TORSO_DEPTH = 0.75;                        // torso is this much flatter front-to-back
// walk: a natural child gait. Each step covers STEP_FRAC of the leg length,
// at CADENCE steps per second; the ground speed follows from both, and the
// thigh swing is solved from the step length, so the planted foot does not slide.
const LEG_LEN = THIGH + SHIN;                    // 0.41
const STEP_FRAC = 0.68;                          // step length / leg length
const CADENCE = 1.9;                             // steps per second
const STEP_LEN = STEP_FRAC * LEG_LEN;            // ~0.28 per step
const WALK_STRIDE = 2 * STEP_LEN;                // floor distance per full cycle (two steps)
const WALK_SPEED = STEP_LEN * CADENCE;           // ~0.53 units / s
const LEG_SWING = Math.asin(STEP_LEN / (2 * LEG_LEN));   // thigh swing each way (rad)
const KNEE_SWING = 0.55;                         // knee bend of the swinging leg
const ARM_SWING = 0.3;                           // arm swing each way, opposite to the legs
const ARM_BEND = 0.3;                            // elbows while walking
const WALK_BOB = 0.012;                          // body rise at mid-stance
const WALK_LEAN = 0.03;                          // slight forward lean
const LID_OPEN = -0.55, LID_SHUT = 1.55;         // upper eyelid rotation
const MOUTH_SHOW = 0.04;                         // mouth opening shows above this

// pose fields. Angles in radians:
//   yaw (facing; 0 = +z), pitch (whole body tips back < 0, lying = -PI/2)
//   spine (bend forward > 0), hy / hp (head turn left > 0 / nod down > 0)
//   la* / ra*: arm F = raise forward, S = out sideways, E = elbow bend
//   ll* / rl*: leg F = thigh forward, K = knee bend
//   eyes 1 open .. 0 shut; mouth 0 shut .. 1 open (kept small); bob = extra lift
const STAND = {
  x: 0, y: HIP_H, z: 0, yaw: 0, pitch: 0, roll: 0, spine: 0, hy: 0, hp: 0,
  laF: 0, laS: 0.14, laE: 0.15, raF: 0, raS: 0.14, raE: 0.15,
  llF: 0, llK: 0, rlF: 0, rlK: 0, eyes: 1, mouth: 0, bob: 0
};
const ANGLE_KEYS = new Set(['yaw']);
function pose(over) { return Object.assign({}, STAND, over); }
function blendPose(a, b, k, out = {}) {
  for (const key in STAND) {
    out[key] = ANGLE_KEYS.has(key) ? a[key] + dAngle(a[key], b[key]) * k : lerp(a[key], b[key], k);
  }
  return out;
}
// sitting on a seat whose top is at seatY (thighs level, shins down)
function sitPose(x, seatY, z, yaw, over) {
  return pose(Object.assign({ x, y: seatY + 0.07, z, yaw, llF: 1.5, rlF: 1.5, llK: 1.5, rlK: 1.5,
    laF: 0.5, raF: 0.5, laE: 0.6, raE: 0.6 }, over));
}
// sitting on the floor / in bed / in the bath, legs straight out
function sitLegsOut(x, floorY, z, yaw, over) {
  return pose(Object.assign({ x, y: floorY + 0.07, z, yaw, llF: 1.45, rlF: 1.45, llK: 0.08, rlK: 0.08,
    laF: 0.35, raF: 0.35, laE: 0.5, raE: 0.5 }, over));
}
// one frame of the walk cycle at `phase` (radians); amp 0..1
// a brisk walk (the zebra crossing): a step of `stepLen` instead of STEP_LEN.
// Returns the walkPose amp that swings the thigh just far enough for that step
// (so the planted foot does not slide); arms and knees swing a bit more too.
function strideAmp(stepLen) {
  return Math.asin(Math.min(0.95, stepLen / (2 * LEG_LEN))) / LEG_SWING;
}
function walkPose(P, phase, amp) {
  const s = Math.sin(phase), c = Math.cos(phase);
  // phase grows with distance: a thigh moving forward (its cos > 0) is the
  // swinging leg and bends its knee; the other is planted and straight
  P.llF = s * LEG_SWING * amp; P.rlF = -s * LEG_SWING * amp;
  P.llK = Math.max(0, c) * KNEE_SWING * amp; P.rlK = Math.max(0, -c) * KNEE_SWING * amp;
  P.laF = -s * ARM_SWING * amp; P.raF = s * ARM_SWING * amp;
  P.laE = ARM_BEND; P.raE = ARM_BEND;
  P.bob = Math.abs(c) * WALK_BOB * amp;          // highest when the legs pass (mid-stance)
  P.spine = WALK_LEAN * amp;
  return P;
}

// stripes for pyjamas
const PJ_TEX = patternTex(32, 32, (g, w, h) => {
  g.fillStyle = '#a9cdee'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h * 0.3);
}, [6, 6]);
const PJ = paint(0xffffff, { map: PJ_TEX, roughness: 0.85 });
const EYE_WHITE = paint(0xf7f4ee, { roughness: 0.3, roughnessMap: null });
const PUPIL = paint(0x121012, { roughness: 0.2, roughnessMap: null });
const GLINT = new THREE.MeshBasicMaterial({ color: 0xffffff });
const MOUTH_IN = paint(0x3a1c1a, { roughness: 0.8, roughnessMap: null });   // the dark inside of an open mouth

// slots: which parts change with the outfit
//   shirt: torso top, shoulder balls, sleeve tubes; arm: upper arm, elbow, forearm
//   pants: hips lathe; leg: thighs, knees, shins; feet: shoes (or bare feet)
function outfitsFor(o) {
  const skin = paint(o.skin || 0xeab48c, { roughness: 0.65 });
  const pants = paint(o.pants || 0x37588f, { roughness: 0.85 });
  return {
    skin,
    day: { shirt: paint(o.shirt || 0xd9503f, { roughness: 0.8 }), arm: o.longSleeves ? paint(o.shirt || 0xd9503f, { roughness: 0.8 }) : skin,
      pants, leg: pants, feet: paint(o.shoes || 0x2d3a4a, { roughness: 0.5 }) },
    pj: { shirt: PJ, arm: PJ, pants: PJ, leg: PJ, feet: skin },
    bath: { shirt: skin, arm: skin, pants: skin, leg: skin, feet: skin }
  };
}

// lathe profiles (radius, height) for the torso: shirt over trousers
const SHIRT_PROFILE = [[0.118, 0.03], [0.124, 0.1], [0.122, 0.17], [0.127, 0.235], [0.122, 0.278], [0.102, 0.312], [0.068, 0.333], [0.04, 0.344], [0.001, 0.35]];
const PANTS_PROFILE = [[0.001, -0.068], [0.07, -0.064], [0.11, -0.045], [0.127, -0.01], [0.13, 0.05], [0.127, 0.1], [0.112, 0.104]];
function lathe(profile, k, segs = 20) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y * k)), segs);
  g.scale(1, 1, TORSO_DEPTH);
  return g;
}
const tube = (r0, r1, h) => new THREE.CylinderGeometry(r0, r1, h, 14, 1, false);
const shell = (r, t0, t1, p0 = 0, pl = Math.PI * 2, ws = 20, hs = 10) => new THREE.SphereGeometry(r, ws, hs, p0, pl, t0, t1);

// --- hair styles (head-local; c = skull centre) -------------------------------
// back + sides shell: phi is measured so that the back of the head (-z) is 3PI/2
function backShell(R, down, width) { return shell(R, 0, Math.PI * down, Math.PI * 1.5 - width / 2, width, 18, 10); }
const HAIR = {
  tousled(add, R, c) {                       // the boy: short, a messy fringe and a tuft
    add(shell(R * 1.07, 0, Math.PI * 0.42), 0, c, 0, -0.28);
    add(backShell(R * 1.055, 0.66, 3.4), 0, c, 0);
    [[-0.062, 0.3], [-0.022, -0.15], [0.022, 0.2], [0.062, -0.3]].forEach(([x, rz], i) => {
      const m = add(sphere(0.042, 12, 8), x, c + 0.088 - Math.abs(x) * 0.25, 0.082 - Math.abs(x) * 0.25, 0, rz);
      m.scale.set(1.15, 0.55, 0.8);
      if (i === 1) m.position.y += 0.008;
    });
    add(sphere(0.042, 12, 8), 0.018, c + 0.112, -0.03, 0.25).scale.set(1, 0.65, 1.3);
    add(sphere(0.03, 10, 8), -0.025, c + 0.122, 0.0, -0.4).scale.set(0.8, 0.8, 1.2);
    [-1, 1].forEach(s => add(sphere(0.04, 10, 8), s * 0.1, c + 0.045, -0.015).scale.set(0.55, 0.95, 1.05));
  },
  bun(add, R, c) {                           // swept back, a bun on top (the teacher)
    add(shell(R * 1.06, 0, Math.PI * 0.4), 0, c, 0, -0.2);
    add(backShell(R * 1.05, 0.7, 3.6), 0, c, 0);
    add(sphere(0.06, 14, 10), 0, c + 0.105, -0.085);
    add(sphere(0.05, 12, 8), 0.03, c + 0.09, 0.075, 0, -0.5).scale.set(1.5, 0.5, 0.75);
  },
  curly(add, R, c) {                         // tight curls all over
    add(shell(R * 1.05, 0, Math.PI * 0.45), 0, c, 0, -0.2);
    add(backShell(R * 1.04, 0.62, 3.6), 0, c, 0);
    const n = 22, g = sphere(0.034, 8, 6);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i + 0.5) / n * 1.3, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 0.55 && y < 0.62) continue;    // keep the face clear
      add(g, x * R * 1.06, c + y * R * 1.06, z * R * 1.06);
    }
  },
  pigtails(add, R, c, tie) {                 // centre parting, two bunches
    add(shell(R * 1.06, 0, Math.PI * 0.43), 0, c, 0, -0.22);
    add(backShell(R * 1.05, 0.68, 3.5), 0, c, 0);
    [-1, 1].forEach(s => {
      add(sphere(0.05, 12, 8), s * 0.135, c - 0.005, -0.045).scale.set(0.85, 1.25, 0.9);
      add(sphere(0.018, 8, 6), s * 0.112, c + 0.04, -0.035, 0, 0, tie);
      add(sphere(0.04, 10, 8), s * 0.04, c + 0.09, 0.08, 0, s * 0.35).scale.set(1.3, 0.5, 0.8);
    });
  },
  bob(add, R, c) {                           // straight bob with a full fringe
    add(shell(R * 1.07, 0, Math.PI * 0.44), 0, c, 0, -0.18);
    add(backShell(R * 1.07, 0.72, 3.9), 0, c - 0.005, 0);
    add(sphere(0.07, 14, 8), 0, c + 0.082, 0.07).scale.set(1.45, 0.45, 0.75);
  }
};

function makeKid(o = {}) {
  const scale = o.scale || 1;
  const legK = o.legK || 1, torsoK = o.torsoK || 1, armK = o.armK || 1, headK = o.headK || 1;
  const thigh = THIGH * legK, shin = SHIN * legK;
  const hipH = (thigh + shin + ANKLE);
  const outfits = outfitsFor(o);
  const skin = outfits.skin;
  const hairMat = paint(o.hair || 0x5a3a22, { roughness: 0.75 });
  const browMat = paint(new THREE.Color(o.hair || 0x5a3a22).multiplyScalar(0.7).getHex(), { roughness: 0.8 });
  const lineMat = paint(o.lip || 0x8a4a3e, { roughness: 0.8, roughnessMap: null });
  const irisMat = paint(o.iris || 0x6b4a2b, { roughness: 0.3, roughnessMap: null });
  const root = new THREE.Group();
  root.rotation.order = 'YXZ';                     // yaw applied last
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);
  const slot = { shirt: [], arm: [], pants: [], leg: [], feet: [] };
  const put = (geo, kind, x, y, z, parent) => { const m = mesh(geo, outfits.day[kind], x, y, z, parent); slot[kind].push(m); return m; };

  // --- torso ---
  const torso = new THREE.Group(); body.add(torso);
  const shirtGeo = lathe(SHIRT_PROFILE, torsoK);
  put(shirtGeo, 'shirt', 0, 0, 0, torso);
  put(lathe(PANTS_PROFILE, 1), 'pants', 0, 0, 0, torso);
  const shY = SHOULDER_Y * torsoK, neckY = NECK_Y * torsoK + (o.adult ? 0.03 : 0);
  mesh(tube(0.036, 0.04, neckY - shY + 0.05), skin, 0, (neckY + shY) / 2 - 0.005, -0.004, torso);
  // --- head ---
  const head = new THREE.Group(); head.position.y = neckY; head.scale.setScalar(headK); torso.add(head);
  const R = HEAD_R, c = HEAD_CY;
  mesh(sphere(R, 24, 18), skin, 0, c, 0, head).scale.set(1, 1, 0.95);
  mesh(sphere(0.095, 18, 12), skin, 0, c - 0.04, 0.018, head);                 // cheeks / jaw
  [-1, 1].forEach(s => mesh(sphere(0.028, 10, 8), skin, s * 0.114, c - 0.008, -0.005, head).scale.set(0.5, 1, 0.8));
  mesh(sphere(0.014, 10, 8), skin, 0, c - 0.02, 0.114, head).scale.set(1.1, 0.85, 0.9);   // nose
  // eyes: white, iris, pupil, highlight; a skin-coloured upper lid that rolls down
  const lids = [];
  [-1, 1].forEach(s => {
    const e = new THREE.Group(); e.position.set(s * 0.043, c + 0.006, 0.092); head.add(e);
    mesh(sphere(0.024, 16, 12), EYE_WHITE, 0, 0, 0, e);
    const front = new THREE.Group(); front.position.z = 0.0236; e.add(front);
    mesh(new THREE.CircleGeometry(0.0145, 18), irisMat, 0, -0.001, 0, front).castShadow = false;
    mesh(new THREE.CircleGeometry(0.0075, 14), PUPIL, 0, -0.001, 0.0006, front).castShadow = false;
    mesh(new THREE.CircleGeometry(0.0034, 10), GLINT, 0.005, 0.005, 0.0012, front).castShadow = false;
    const lid = mesh(shell(0.0262, 0, Math.PI / 2, 0, Math.PI * 2, 16, 6), skin, 0, 0, 0, e);
    lids.push(lid);
    const brow = mesh(capsule(0.0055, 0.03, 6), browMat, s * 0.003, 0.045, 0.006, e);
    brow.rotation.z = Math.PI / 2 - s * 0.18;
  });
  // mouth: a gentle closed smile line; a small dark opening for bites and yawns
  const SMILE_ARC = Math.PI * 0.62;
  const smile = mesh(new THREE.TorusGeometry(0.021, 0.0032, 6, 14, SMILE_ARC), lineMat, 0, c - 0.052, 0.113, head);
  smile.rotation.set(-0.25, 0, -Math.PI / 2 - SMILE_ARC / 2);
  smile.castShadow = false;
  const mouth = mesh(sphere(0.017, 14, 10), MOUTH_IN, 0, c - 0.056, 0.109, head);
  mouth.castShadow = false;
  const mouthAt = new THREE.Group(); mouthAt.position.set(0, c - 0.055, 0.12); head.add(mouthAt);
  // hair
  const add = (geo, x, y, z, rx = 0, rz = 0, mat = hairMat) => {
    const m = mesh(geo, mat, x, y, z, head); m.rotation.set(rx, 0, rz); return m;
  };
  (HAIR[o.hairStyle] || HAIR.tousled)(add, R, c, paint(o.tie || 0xe0457b));
  // --- arms ---
  const ua = UPPER_ARM * armK, fa = FOREARM * armK;
  const arm = side => {
    const sh = new THREE.Group(); sh.position.set(side * SHOULDER_X, shY, 0); torso.add(sh);
    put(sphere(0.05, 14, 10), 'shirt', 0, 0, 0, sh);
    put(tube(0.05, 0.046, 0.075), 'shirt', 0, -0.04, 0, sh);
    put(capsule(0.036, ua - 0.04), 'arm', 0, -ua / 2, 0, sh);
    const el = new THREE.Group(); el.position.y = -ua; sh.add(el);
    put(sphere(0.036, 12, 8), 'arm', 0, 0, 0, el);
    put(capsule(0.033, fa - 0.045), 'arm', 0, -fa / 2 + 0.004, 0, el);
    const hand = new THREE.Group(); hand.position.y = -fa; el.add(hand);
    mesh(sphere(0.04, 14, 10), skin, 0, -0.008, 0, hand).scale.set(0.8, 1.12, 0.95);   // mitten
    mesh(sphere(0.016, 8, 6), skin, -side * 0.02, 0.0, 0.026, hand).scale.set(1, 1.3, 1);   // thumb
    return { sh, el, hand };
  };
  const L = arm(1), Rt = arm(-1);
  // --- legs ---
  const leg = side => {
    const hip = new THREE.Group(); hip.position.set(side * HIP_X, 0, 0); body.add(hip);
    put(capsule(0.056, thigh - 0.03), 'leg', 0, -thigh / 2 + 0.01, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -thigh; hip.add(knee);
    put(sphere(0.05, 12, 8), 'leg', 0, 0, 0, knee);
    put(capsule(0.044, shin - 0.035), 'leg', 0, -shin / 2, 0, knee);
    put(rbox(0.085, 0.056, 0.15, 0.026), 'feet', 0, -shin - 0.012, 0.028, knee);
    return { hip, knee };
  };
  const LL = leg(1), RL = leg(-1);
  // the chest point: things held in both hands (a book) hang here
  const chest = new THREE.Group(); chest.position.set(0, 0.17 * torsoK, 0.12); torso.add(chest);

  function setOutfit(name) {
    const f = outfits[name] || outfits.day;
    for (const k in slot) slot[k].forEach(m => { m.material = f[k]; });
  }
  setOutfit(o.outfit || 'day');

  function apply(P) {
    root.position.set(P.x, P.y + P.bob * scale, P.z);
    root.rotation.set(P.pitch, P.yaw, P.roll);
    torso.rotation.x = P.spine;
    head.rotation.set(P.hp, P.hy, 0);
    L.sh.rotation.set(-P.laF, 0, P.laS); L.el.rotation.x = -P.laE;
    Rt.sh.rotation.set(-P.raF, 0, -P.raS); Rt.el.rotation.x = -P.raE;
    LL.hip.rotation.x = -P.llF; LL.knee.rotation.x = P.llK;
    RL.hip.rotation.x = -P.rlF; RL.knee.rotation.x = P.rlK;
    const lid = lerp(LID_SHUT, LID_OPEN, Math.max(0, Math.min(1, P.eyes)));
    lids.forEach(l => { l.rotation.x = lid; });
    const m = Math.max(0, Math.min(1, P.mouth));
    mouth.visible = m > MOUTH_SHOW;
    mouth.scale.set(0.75 + m * 0.3, 0.25 + m * 0.75, 0.45);
    smile.visible = m < 0.3;
  }
  apply(pose({ y: hipH * scale }));
  return { root, torso, head, handL: L.hand, handR: Rt.hand, chest, mouthAt, apply, setOutfit, scale,
    hipH: hipH * scale, shirtGeo };
}

window.MYDAY = Object.assign(window.MYDAY, {
  makeKid, pose, blendPose, sitPose, sitLegsOut, walkPose, strideAmp, STAND, HIP_H, WALK_STRIDE, WALK_SPEED
});
})();
