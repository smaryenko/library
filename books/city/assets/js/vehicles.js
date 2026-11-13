// HARBOR CITY: every vehicle, machine, ship and plane, modelled in code.
//
// Convention: each builder returns a baked THREE.Group standing on y = 0,
// length along +x (front = +x). Moving parts are named groups, reachable as
// group.userData.parts.<name>; spinning wheels are in group.userData.wheels.
// Lights that blink get their own materials in group.userData.lamps.
// Realistic proportions, matte-to-satin paint with wear in the roughness, no
// faces, no outlines, made-up names and numbers (no real brands).
(function () {
'use strict';
const {
  THREE, M, paint, lamp, mesh, box, rbox, cylX, cylY, cylZ, sphere, prof, plan, part, wheel,
  bake, canvas, tex, labelTex, decal, seeded, contactShadow
} = window.CITY;
const labelPlate = paint(0xe9e6da, { roughness: 0.6 });

// shared head / tail light materials (the scene turns them up at night)
const HEAD = lamp(0xfff1d0, 0.15);
const TAIL = lamp(0xd8231a, 0.25);
const NIGHT_LAMPS = [HEAD, TAIL];

function finish(g, { shadow = true } = {}) {
  if (shadow) contactShadow(g);
  bake(g);
  const p = g.userData.parts;
  g.userData.wheels = Object.keys(p).filter(k => /^w\d+$/.test(k)).map(k => p[k]);
  return g;
}
function wheels(g, list, r, w, spin, rim) {
  const base = g.userData.wn || 0;      // unique names when called twice
  g.userData.wn = base + list.length;
  list.forEach(([x, z], i) => {
    if (spin) { const p = part('w' + (base + i), g, x, r, z); p.userData.r = r; wheel(r, w, p, 0, 0, 0, rim); }
    else wheel(r, w, g, x, r, z, rim);
  });
}
// Framed windows around a body: (x, y, z) is the centre of the window band,
// len/h/w its outer size (a touch larger than the body, so the panes sit just
// proud of it). Side windows are split by pillars; the front pane is the
// windscreen. Real cabs read as framed glass, not one black block.
function glassBand(g, x, y, len, h, w, mat = M.glass, { z = 0, front = true, rear = false, panes, frame = 0.03 } = {}) {
  const t = 0.008;
  const n = panes || Math.max(1, Math.round(len / 0.3));
  const pw = (len - frame * (n + 1)) / n, ph = h - frame;
  [-1, 1].forEach(s => {
    for (let i = 0; i < n; i++) mesh(box(pw, ph, t), mat, x - len / 2 + frame + pw / 2 + i * (pw + frame), y, z + s * (w / 2 - t / 2), g);
  });
  if (front) mesh(box(t, ph, w - 2 * frame), mat, x + len / 2 - t / 2, y, z, g);
  if (rear) mesh(box(t, ph, w - 2 * frame), mat, x - len / 2 + t / 2, y, z, g);
  // rubber window seals: thin dark strips along the top and bottom
  [-1, 1].forEach(s => mesh(box(len * 0.98, 0.008, w + 0.002), M.black, x, y + s * (ph / 2 + 0.004), z, g));
}
// small details used everywhere
function plate(g, x, y, w = 0.12, h = 0.035, flip = false) {
  const m = mesh(box(0.006, h, w), labelPlate, x, y, 0, g);
  return m;
}
function ram(g, a, b, r = 0.022) {           // hydraulic cylinder from a to b: barrel + chrome rod
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const mid = A.clone().lerp(B, 0.55);
  const put = (p, q, rad, mat) => {
    const len = p.distanceTo(q);
    const m = mesh(new THREE.CylinderGeometry(rad, rad, len, 10), mat, 0, 0, 0, g);
    m.position.copy(p).add(q).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
  };
  put(A, mid, r, M.dark);
  put(mid, B, r * 0.55, M.chrome);
}
function rail(g, pts, y, r = 0.008, mat = M.steel) {  // handrail along points [[x,z]...] with posts
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = mesh(box(len, r * 2, r * 2), mat, (x0 + x1) / 2, y, (z0 + z1) / 2, g);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    const posts = Math.max(1, Math.round(len / 0.15));
    for (let k = 0; k <= posts; k++) mesh(box(r * 1.6, 0.08, r * 1.6), mat, lerpN(x0, x1, k / posts), y - 0.04, lerpN(z0, z1, k / posts), g);
  }
}
const lerpN = (a, b, t) => a + (b - a) * t;
function workLight(g, x, y, z) {
  mesh(box(0.04, 0.03, 0.05), M.dark, x, y, z, g);
  mesh(box(0.006, 0.022, 0.04), HEAD, x + 0.022, y, z, g);
}
// horizontal slat grille texture
const GRILLE = (() => {
  const [c, x] = canvas(64, 64);
  x.fillStyle = '#18191b'; x.fillRect(0, 0, 64, 64);
  for (let i = 4; i < 64; i += 8) { x.fillStyle = '#5d6166'; x.fillRect(2, i, 60, 3); }
  x.strokeStyle = '#a8adb3'; x.lineWidth = 3; x.strokeRect(1, 1, 62, 62);
  return new THREE.MeshStandardMaterial({ map: tex(c), metalness: 0.7, roughness: 0.35 });
})();
function heads(g, x, y, w, size = 0.05) {
  [-1, 1].forEach(s => mesh(box(0.02, size * 0.7, size * 1.4), HEAD, x, y, s * (w / 2 - size), g));
}
function tails(g, x, y, w, size = 0.05) {
  [-1, 1].forEach(s => mesh(box(0.02, size * 0.8, size), TAIL, x, y, s * (w / 2 - size * 0.7), g));
}
function lightbar(g, x, y, w, len = 0.12, colors = [0x1d4fff, 0xff2020]) {
  const bar = part('bar', g, x, y, 0);
  const a = lamp(colors[0], 0.2), b = lamp(colors[1], 0.2);
  mesh(rbox(len, 0.035, w * 0.36), a, 0, 0, -w * 0.2, bar);
  mesh(rbox(len, 0.035, w * 0.36), b, 0, 0, w * 0.2, bar);
  mesh(box(len * 1.1, 0.012, w * 0.82), M.dark, 0, -0.022, 0, bar);
  g.userData.lamps = [a, b];
  return bar;
}

// ---------------------------------------------------------------------------
// CARS
const CAR = {
  sedan: { glass: [[0.42, 0.215], [0.13, 0.33], [-0.4, 0.335], [-0.68, 0.22]], h: 0.34 },
  hatch: { glass: [[0.42, 0.215], [0.12, 0.33], [-0.8, 0.33], [-0.94, 0.22]], h: 0.34 },
  cab:   { glass: [[0.4, 0.23], [0.24, 0.385], [-0.78, 0.39], [-0.93, 0.24]], h: 0.4 }
};
function car({ color = 0x34506b, len = 0.9, w = 0.42, kind = 'sedan', spin = true, metal = 0.35 } = {}) {
  const g = new THREE.Group();
  const L = len / 2, k = CAR[kind];
  const body = paint(color, { metalness: metal, roughness: 0.3, coat: true });
  // lower body up to the beltline
  mesh(prof([[-L, 0.08], [L - 0.02, 0.08], [L, 0.11], [L, 0.17], [L - 0.06, 0.205], [L * 0.45, 0.228],
    [-L * 0.7, 0.235], [-L + 0.015, 0.225], [-L, 0.17]], w * 0.94, 0.015), body, 0, 0, 0, g);
  // greenhouse (glass) and roof
  const gl = k.glass.map(([x, y]) => [x * L, y]);
  mesh(prof(gl, w * 0.8, 0.01), M.glass, 0, 0, 0, g);
  const top = Math.max(gl[1][1], gl[2][1]);
  mesh(prof([[gl[1][0] - 0.02, top - 0.012], [gl[2][0] + 0.02, top - 0.012], [gl[2][0], top + 0.008],
    [gl[1][0] - 0.03, top + 0.006]], w * 0.84, 0.006), body, 0, 0, 0, g);
  // pillars between front and rear side glass
  mesh(box(0.025, top - 0.23, w * 0.82), body, (gl[1][0] + gl[2][0]) / 2 + 0.03, (top + 0.23) / 2, 0, g);
  // sill, bumpers, mirrors
  mesh(box(len * 1.005, 0.045, w * 0.95), M.dark, 0, 0.095, 0, g);
  [-1, 1].forEach(s => {
    mesh(box(0.04, 0.025, 0.04), body, gl[0][0] - 0.04, 0.24, s * (w * 0.47 + 0.02), g);
    mesh(box(0.012, 0.018, 0.004), M.glass, gl[0][0] - 0.04, 0.24, s * (w * 0.47 + 0.042), g);
    // door shut lines and handles
    [gl[0][0] - 0.02, (gl[1][0] + gl[2][0]) / 2 + 0.03, gl[3][0] + 0.04].forEach(dx =>
      mesh(box(0.004, 0.13, 0.002), M.black, dx, 0.165, s * (w * 0.47 + 0.001), g));
    [gl[0][0] - 0.09, (gl[1][0] + gl[2][0]) / 2 - 0.04].forEach(dx =>
      mesh(box(0.03, 0.008, 0.006), M.chrome, dx, 0.205, s * (w * 0.47 + 0.003), g));
    // wheel arches: a dark recess around each wheel
    [L * 0.62, -L * 0.6].forEach(dx => mesh(cylZ(0.1, w * 0.955, 18), M.black, dx, 0.085, 0, g));
  });
  mesh(box(0.008, 0.05, w * 0.42), GRILLE, L + 0.002, 0.13, 0, g);
  heads(g, L + 0.002, 0.155, w);
  tails(g, -L - 0.002, 0.17, w);
  mesh(box(0.008, 0.035, 0.12), labelPlate, L + 0.006, 0.1, 0, g);
  mesh(box(0.008, 0.035, 0.12), labelPlate, -L - 0.006, 0.13, 0, g);
  wheels(g, [[L * 0.62, w / 2 - 0.035], [L * 0.62, -w / 2 + 0.035], [-L * 0.6, w / 2 - 0.035], [-L * 0.6, -w / 2 + 0.035]],
    0.085, 0.075, spin);
  g.userData.top = top;
  return g;
}

function sedan(color, o = {}) { return finish(car(Object.assign({ color }, o))); }

function taxiCab() {          // black London-style cab
  const g = car({ color: 0x0f1012, len: 0.92, w: 0.42, kind: 'cab', metal: 0.5 });
  const sign = lamp(0xffc23a, 0.6);
  mesh(rbox(0.1, 0.035, 0.16, 0.01), sign, 0.12, g.userData.top + 0.03, 0, g);
  g.userData.lamps = [sign];
  return finish(g);
}

function policeCar() {
  const g = car({ color: 0xf2f2ee, len: 0.95, w: 0.43, metal: 0.25 });
  // blue-yellow battenburg band along the sides
  const [c, x] = canvas(256, 32);
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#1b3fae' : '#f2d01a'; x.fillRect(i * 16, 0, 16, 16); x.fillStyle = i % 2 ? '#f2d01a' : '#1b3fae'; x.fillRect(i * 16, 16, 16, 16); }
  const band = paint(0xffffff, { map: tex(c), roughness: 0.4, roughnessMap: null });
  mesh(box(0.86, 0.05, 0.43 * 0.95), band, 0, 0.17, 0, g);
  const word = decal(labelTex('POLICE', { fg: '#16328e', w: 512, h: 96 }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(0.3, 0.05), word, -0.08, 0.215, s * 0.206, g);
    m.rotation.y = s > 0 ? 0 : Math.PI;
  });
  lightbar(g, -0.04, g.userData.top + 0.025, 0.43);
  return finish(g);
}

function brokenCar() {       // little silver hatchback with hazards on
  const g = car({ color: 0x9aa2a8, len: 0.82, w: 0.4, kind: 'hatch', metal: 0.6 });
  const amber = lamp(0xffa21a, 0.2);
  [[0.41, 1], [0.41, -1], [-0.41, 1], [-0.41, -1]].forEach(([x, s]) =>
    mesh(box(0.025, 0.025, 0.04), amber, x, 0.2, s * 0.16, g));
  g.userData.lamps = [amber];
  return finish(g);
}

// ---------------------------------------------------------------------------
// TRUCK BASE: chassis, cab with windscreen band, wheels. Returns the group
// and a few handy heights; the caller adds the body behind the cab.
function truck({ len = 2, w = 0.5, cabLen = 0.48, cabH = 0.5, color = 0xcc2a1e, r = 0.11,
  axles = null, spin = false, cabOver = true } = {}) {
  const g = new THREE.Group();
  const L = len / 2, cabBot = r * 1.25;
  const paintM = paint(color, { metalness: 0.3, roughness: 0.34, coat: true });
  mesh(box(len * 0.94, 0.08, w * 0.62), M.iron, -0.02, r + 0.02, 0, g);              // frame
  const cx = L - cabLen / 2;
  mesh(rbox(cabLen, cabH, w, 0.04), paintM, cx, cabBot + cabH / 2, 0, g);           // cab
  glassBand(g, L - cabLen * 0.3 + 0.006, cabBot + cabH * 0.66, cabLen * 0.6, cabH * 0.36, w + 0.012, M.glass, { panes: 1 });
  // windscreen wipers, sun visor, roof marker lights
  [-1, 1].forEach(s => { const wp = mesh(box(0.004, 0.006, w * 0.3), M.black, L + 0.012, cabBot + cabH * 0.5, s * w * 0.18, g); wp.rotation.x = s * 0.3; });
  mesh(box(0.05, 0.015, w * 0.9), paintM, L + 0.01, cabBot + cabH * 0.86, 0, g);
  const amber = lamp(0xffa21a, 0.4);
  for (let i = -2; i <= 2; i++) mesh(box(0.02, 0.012, 0.025), amber, L - 0.03, cabBot + cabH + 0.006, i * w * 0.15, g);
  // grille, bumper with fog lights, number plate, steps, door seams and handles
  mesh(box(0.012, cabH * 0.3, w * 0.66), GRILLE, L + 0.004, cabBot + cabH * 0.22, 0, g);
  mesh(box(0.06, 0.07, w * 1.02), M.dark, L + 0.01, cabBot - 0.01, 0, g);
  [-1, 1].forEach(s => mesh(box(0.008, 0.02, 0.04), HEAD, L + 0.042, cabBot - 0.01, s * w * 0.38, g));
  mesh(box(0.006, 0.035, 0.12), labelPlate, L + 0.043, cabBot - 0.01, 0, g);
  [-1, 1].forEach(s => {
    mesh(box(0.05, 0.06, 0.02), M.dark, L - 0.04, cabBot + cabH * 0.62, s * (w / 2 + 0.035), g);      // mirrors
    mesh(box(0.008, 0.04, 0.03), M.steel, L - 0.04, cabBot + cabH * 0.62, s * (w / 2 + 0.05), g);
    // (the cab-step box that sat here poked through the cab's rounded lower
    // edge and showed as a dark smear on every truck door; removed)
  });
  heads(g, L + 0.03, cabBot + 0.05, w);
  tails(g, -L + 0.01, r + 0.08, w);
  const ax = axles || [L - cabLen * 0.5, -L * 0.55];
  const list = [];
  ax.forEach(x => { list.push([x, w / 2 - 0.06], [x, -w / 2 + 0.06]); });
  wheels(g, list, r, 0.1, spin);
  // fuel tank + battery box between the axles
  if (ax.length > 1) {
    const mx = (ax[0] + ax[1]) / 2;
    mesh(cylX(0.06, 0.26, 14), M.chrome, mx, r + 0.03, w / 2 - 0.1, g);
    mesh(box(0.16, 0.1, 0.1), M.dark, mx, r + 0.02, -w / 2 + 0.1, g);
  }
  // mudguards and mud flaps
  // The mudguard's outer face used to sit exactly on the cab/body side
  // (z = w/2): two coplanar faces z-fight, which was the dark streaky smear
  // above the front wheel on every truck. Keep it 2.5 cm inside the side so
  // it never shares a plane with any body built on this base.
  ax.forEach(x => [-1, 1].forEach(s => mesh(box(r * 2.3, 0.02, 0.09), M.dark, x, r * 2.08, s * (w / 2 - 0.07), g)));
  [-1, 1].forEach(s => mesh(box(0.008, r * 1.1, 0.11), M.rubber, ax[ax.length - 1] - r * 1.25, r * 0.95, s * (w / 2 - 0.06), g));
  return { g, paintM, L, cabBot, cabTop: cabBot + cabH, bodyFront: L - cabLen - 0.03, w, r };
}

function fireTruck() {
  const t = truck({ len: 2.1, w: 0.5, cabLen: 0.55, cabH: 0.52, color: 0xb51d16, r: 0.11, axles: [0.72, -0.55], spin: true });
  const { g, paintM, L, cabBot, bodyFront, w } = t;
  const bodyLen = bodyFront + L - 0.02;
  mesh(rbox(bodyLen, 0.46, w, 0.03), paintM, (bodyFront - L) / 2, cabBot + 0.23, 0, g);
  // roller-shutter lockers on both sides
  const [c, x] = canvas(64, 64);
  x.fillStyle = '#c9ccd0'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 4) { x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, i, 64, 1); }
  const shutter = paint(0xffffff, { map: tex(c, { repeat: true }), metalness: 0.7, roughness: 0.35 });
  [-1, 1].forEach(s => {
    for (let i = 0; i < 3; i++) mesh(box(bodyLen * 0.28, 0.3, 0.012), shutter, bodyFront - 0.18 - i * bodyLen * 0.31, cabBot + 0.22, s * (w / 2 + 0.004), g);
  });
  mesh(box(bodyLen, 0.03, w * 1.01), paint(0xe8e2c8), (bodyFront - L) / 2, cabBot + 0.42, 0, g); // reflective stripe
  lightbar(g, L - 0.26, t.cabTop + 0.02, w);
  // turntable + ladder (two sections; the fly section slides out)
  const turret = part('turret', g, -0.5, cabBot + 0.48, 0);
  mesh(cylY(0.17, 0.08, 20), M.steel, 0, 0.04, 0, turret);
  mesh(box(0.22, 0.12, 0.24), paintM, 0, 0.12, 0, turret);
  const ladder = part('ladder', turret, -0.02, 0.18, 0);
  ladderSection(ladder, 1.6, 0.2, M.steel);
  const fly = part('fly', ladder, 0, 0.04, 0);
  ladderSection(fly, 1.4, 0.15, M.chrome);
  const tip = part('tip', fly, 1.4, 0.03, 0);
  mesh(cylX(0.018, 0.12, 8), M.chrome, 0.06, 0, 0, tip);
  ladder.rotation.z = 0;           // lies along the truck, pointing forward
  return finish(g);
}
function ladderSection(parent, len, wd, mat) {
  [-1, 1].forEach(s => mesh(box(len, 0.035, 0.022), mat, len / 2, 0, s * wd / 2, parent));
  for (let i = 0.05; i < len; i += 0.11) mesh(box(0.012, 0.012, wd), mat, i, 0, 0, parent);
}

function towTruck() {
  const t = truck({ len: 1.75, w: 0.48, cabLen: 0.5, cabH: 0.48, color: 0xe2e2dc, r: 0.1, axles: [0.55, -0.45], spin: true });
  const { g, L, cabBot, bodyFront, w } = t;
  const orange = paint(0xe86a12);
  mesh(box(bodyFront + L, 0.06, w), M.iron, (bodyFront - L) / 2, cabBot + 0.03, 0, g); // deck
  mesh(box(0.1, 0.36, w * 0.9), orange, bodyFront - 0.05, cabBot + 0.2, 0, g);         // headboard
  lightbar(g, L - 0.24, t.cabTop + 0.02, w, 0.1, [0xffa21a, 0xffa21a]);
  // boom + wheel lift at the rear
  const boom = part('boom', g, -0.2, cabBot + 0.1, 0);
  mesh(box(0.7, 0.07, 0.08), orange, -0.33, 0.08, 0, boom);
  mesh(cylY(0.006, 0.25, 4), M.dark, -0.66, -0.06, 0, boom);
  mesh(box(0.05, 0.04, 0.04), M.chrome, -0.66, -0.19, 0, boom);
  boom.rotation.z = -0.35;
  // wheel lift: the arm used to float level behind the truck with nothing
  // holding it. Now a drop bracket comes down from the frame end, the arm
  // starts inside it, and orange wheel-cradle forks sit on the cross-bar.
  mesh(box(0.07, 0.16, 0.14), M.iron, -L + 0.0, 0.17, 0, g);
  [-1, 1].forEach(s => ram(g, [-L + 0.12, cabBot + 0.04, s * 0.09], [-L - 0.01, 0.15, s * 0.05], 0.012));
  const lift = part('lift', g, -L + 0.03, 0.12, 0);
  mesh(box(0.37, 0.04, 0.05), M.iron, -0.2, 0, 0, lift);
  mesh(box(0.06, 0.05, 0.36), M.iron, -0.37, 0.01, 0, lift);
  [-1, 1].forEach(s => [-0.33, -0.41].forEach(dx => mesh(box(0.012, 0.035, 0.03), paint(0xe86a12), dx, 0.04, s * 0.15, lift)));
  return finish(g);
}

function ambulance() {
  const t = truck({ len: 1.35, w: 0.47, cabLen: 0.42, cabH: 0.42, color: 0xf4f2ea, r: 0.095, axles: [0.43, -0.4], spin: true });
  const { g, paintM, L, cabBot, bodyFront, w } = t;
  const bodyLen = bodyFront + L;
  mesh(rbox(bodyLen, 0.62, w * 1.02, 0.04), paintM, (bodyFront - L) / 2, cabBot + 0.28, 0, g);
  // green-yellow battenburg band + word
  const [c, x] = canvas(256, 32);
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#1c8f3a' : '#f0d81a'; x.fillRect(i * 16, 0, 16, 16); x.fillStyle = i % 2 ? '#f0d81a' : '#1c8f3a'; x.fillRect(i * 16, 16, 16, 16); }
  const band = paint(0xffffff, { map: tex(c), roughness: 0.4, roughnessMap: null });
  mesh(box(bodyLen * 0.99, 0.09, w * 1.03), band, (bodyFront - L) / 2, cabBot + 0.13, 0, g);
  mesh(box(0.42, 0.09, w + 0.006), band, L - 0.21, cabBot + 0.13, 0, g);
  const word = decal(labelTex('AMBULANCE', { fg: '#1c8f3a', w: 512, h: 96 }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(0.5, 0.06), word, -0.2, cabBot + 0.42, s * (w * 0.51 + 0.004), g);
    m.rotation.y = s > 0 ? 0 : Math.PI;
  });
  const cross = decal(labelTex('+', { fg: '#1c8f3a', w: 128, h: 128 }));
  mesh(new THREE.PlaneGeometry(0.16, 0.16), cross, -L - 0.004, cabBot + 0.4, 0, g).rotation.y = Math.PI;
  lightbar(g, L - 0.2, t.cabTop + 0.02, w);
  return finish(g);
}

function garbageTruck() {
  const t = truck({ len: 1.9, w: 0.5, cabLen: 0.5, cabH: 0.5, color: 0xe9e9e4, r: 0.11, axles: [0.62, -0.5], spin: true });
  const { g, L, cabBot, bodyFront, w } = t;
  const green = paint(0x2f7d3c, { roughness: 0.4 });
  const bodyLen = bodyFront + L;
  mesh(rbox(bodyLen * 0.8, 0.56, w * 1.02, 0.05), green, bodyFront - bodyLen * 0.4, cabBot + 0.3, 0, g);
  mesh(prof([[0, 0], [0.32, 0], [0.32, 0.5], [0.05, 0.62], [0, 0.6]], w * 1.02, 0.02), M.grey, -L - 0.02, cabBot - 0.02, 0, g);
  lightbar(g, L - 0.25, t.cabTop + 0.02, w, 0.08, [0xffa21a, 0xffa21a]);
  // side arm with a grabber (kerb side, -z: the city drives on the left)
  const arm = part('arm', g, 0.05, cabBot + 0.08, -w / 2 - 0.03);
  mesh(box(0.06, 0.06, 0.32), M.iron, 0, 0, -0.16, arm);
  const grab = part('grab', arm, 0, 0, -0.32);
  mesh(box(0.16, 0.12, 0.03), M.steel, 0, 0, 0, grab);
  return finish(g);
}
function wheelieBin() {
  const g = new THREE.Group();
  const green = paint(0x2e5f34, { roughness: 0.6 });
  mesh(rbox(0.13, 0.2, 0.12, 0.012), green, 0, 0.11, 0, g);
  mesh(box(0.145, 0.015, 0.135), green, 0, 0.215, 0, g);
  return finish(g);
}

function cementMixer() {
  const t = truck({ len: 1.95, w: 0.5, cabLen: 0.48, cabH: 0.5, color: 0xf0ede4, r: 0.11, axles: [0.68, -0.4, -0.66] });
  const { g, L, cabBot, w } = t;
  const drumHolder = part('holder', g, -0.18, cabBot + 0.32, 0);
  drumHolder.rotation.z = -0.17;              // the drum tilts up at the back
  const drum = part('drum', drumHolder, 0, 0, 0);
  // lathe drum, its spiral stripes show the rotation
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, x = -0.62 + u * 1.2;
    const r = 0.06 + 0.26 * Math.sin(Math.PI * Math.pow(u, 0.75)) + (u < 0.1 ? 0.05 : 0);
    pts.push(new THREE.Vector2(Math.max(0.05, r), x));
  }
  const geo = new THREE.LatheGeometry(pts, 24).rotateZ(-Math.PI / 2);   // opening at the rear (-x)
  const [c, x] = canvas(256, 128);
  x.fillStyle = '#e8e4da'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#c4342a'; x.lineWidth = 14;
  for (let i = -256; i < 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); }
  // the lathe is a single open surface: draw both sides so it never looks
  // sliced open, and close both ends with caps (the rear one is the dark mouth)
  const dm = mesh(geo, paint(0xffffff, { map: tex(c, { repeat: true }), metalness: 0.35, roughness: 0.4 }), 0, 0, 0, drum);
  dm.material.side = THREE.DoubleSide;
  mesh(cylX(0.11, 0.02, 20), M.dark, -0.62, 0, 0, drum);
  mesh(cylX(0.07, 0.03, 16), M.steel, 0.59, 0, 0, drum);
  mesh(box(0.12, 0.3, 0.1), M.iron, 0.55, -0.2, 0, drumHolder);
  // rear drum stand, rollers, water tank, ladder. Drum mouth (in truck
  // coords) is at x ≈ -0.79, y ≈ cabBot + 0.43; the hopper sits on top of
  // it and the collector funnel under it feeds the chute, so the three
  // parts touch instead of floating apart.
  mesh(box(0.08, 0.3, 0.36), M.iron, -0.66, cabBot + 0.15, 0, g);
  [-1, 1].forEach(s => mesh(cylZ(0.035, 0.05, 12), M.steel, -0.66, cabBot + 0.3, s * 0.12, g));
  mesh(prof([[0.04, 0], [-0.12, 0.13], [0.06, 0.13]], 0.2, 0.01), M.steel, -0.84, cabBot + 0.48, 0, g);   // hopper
  [-1, 1].forEach(s => mesh(box(0.02, 0.2, 0.02), M.iron, -0.84, cabBot + 0.4, s * 0.1, g));          // hopper legs
  mesh(prof([[0.05, 0.1], [-0.06, 0.1], [-0.03, 0], [0.02, 0]], 0.14, 0.008), M.steel, -0.86, cabBot + 0.28, 0, g);  // collector
  mesh(box(0.08, 0.28, 0.06), M.iron, -0.9, cabBot + 0.14, 0, g);                                   // chute post
  mesh(cylY(0.07, 0.3, 14), M.steel, 0.42, cabBot + 0.18, -0.15, g);                                // water tank behind the cab
  [-0.1, 0.1].forEach(dz => mesh(box(0.015, 0.6, 0.015), M.steel, -0.8, cabBot + 0.3, w * 0.25 + dz * 0.4, g));
  for (let i = 0; i < 6; i++) mesh(box(0.012, 0.012, 0.09), M.steel, -0.8, cabBot + 0.06 + i * 0.1, w * 0.25, g);
  // spiral blades visible in the mouth
  for (let i = 0; i < 3; i++) { const bl = mesh(box(0.01, 0.16, 0.02), M.iron, -0.6, 0, 0, drum); bl.rotation.x = i * Math.PI / 3; }
  // chute at the back
  const chute = part('chute', g, -0.88, cabBot + 0.29, 0);       // hinged under the collector
  mesh(prof([[0, 0], [-0.4, -0.12], [-0.4, -0.07], [0, 0.04]], 0.12), M.steel, 0, 0, 0, chute);
  return finish(g);
}

function dumpTruck() {
  const t = truck({ len: 1.9, w: 0.54, cabLen: 0.5, cabH: 0.5, color: 0xe2731c, r: 0.12, axles: [0.64, -0.38, -0.64], spin: true });
  const { g, L, cabBot, bodyFront, w } = t;
  const bed = part('bed', g, -L + 0.06, cabBot + 0.02, 0);       // hinge at the rear
  const bedLen = bodyFront + L - 0.08;
  const grey = paint(0x5d6166, { metalness: 0.5, roughness: 0.5 });
  mesh(box(bedLen, 0.04, w * 0.98), grey, bedLen / 2, 0.02, 0, bed);
  [-1, 1].forEach(s => mesh(box(bedLen, 0.3, 0.03), grey, bedLen / 2, 0.17, s * w * 0.48, bed));
  mesh(box(0.04, 0.4, w * 0.98), grey, bedLen + 0.01, 0.2, 0, bed);
  mesh(box(0.035, 0.26, w * 0.96), grey, 0.012, 0.15, 0, bed);
  const load = part('load', bed, bedLen / 2, 0.2, 0);
  mesh(new THREE.SphereGeometry(0.42, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.4, 0.36, 0.6), M.gravel, 0, 0, 0, load);
  return finish(g);
}

function roadRoller() {
  const g = new THREE.Group();
  const yel = paint(0xe8b10c, { roughness: 0.45 });
  const drum = part('drum', g, 0.42, 0.2, 0);
  mesh(cylZ(0.2, 0.5, 24), M.steel, 0, 0, 0, drum);
  mesh(box(0.1, 0.04, 0.04), M.dark, 0.1, 0, 0, drum);       // a mark to see it roll
  mesh(box(0.34, 0.12, 0.58), yel, 0.42, 0.36, 0, g);         // drum frame
  mesh(rbox(0.7, 0.32, 0.46, 0.04), yel, -0.16, 0.3, 0, g);
  // ROPS canopy
  [[0.08, 1], [0.08, -1], [-0.32, 1], [-0.32, -1]].forEach(([x, s]) => mesh(box(0.025, 0.42, 0.025), M.dark, x, 0.66, s * 0.2, g));
  mesh(box(0.5, 0.03, 0.48), yel, -0.12, 0.88, 0, g);
  mesh(box(0.14, 0.12, 0.14), M.dark, -0.1, 0.52, 0, g);     // seat + console
  wheels(g, [[-0.32, 0.2], [-0.32, -0.2]], 0.17, 0.16, false);
  // --- roller detail -------------------------------------------------------
  const blk = paint(0x232427, { roughness: 0.6, metalness: 0.3 });
  // drum: raised end rims, scraper bars front and back, water spray bar
  [-1, 1].forEach(s => mesh(cylZ(0.205, 0.03, 24), M.iron, 0, 0, s * 0.24, drum));
  [0.2, -0.2].forEach(dx => mesh(box(0.02, 0.02, 0.5), blk, 0.42 + dx * 1.12, 0.12, 0, g));
  mesh(cylZ(0.01, 0.5, 6), M.steel, 0.66, 0.3, 0, g);
  // articulated joint + steering rams between the drum frame and the body
  mesh(cylY(0.05, 0.16, 12), blk, 0.22, 0.3, 0, g);
  [-1, 1].forEach(s => ram(g, [0.12, 0.28, s * 0.14], [0.3, 0.28, s * 0.1], 0.014));
  // engine hood: cooling louvres, exhaust stack with rain cap, side
  // access doors, rear lights and a warning beacon on the canopy
  for (let i = 0; i < 6; i++) mesh(box(0.05, 0.004, 0.3), blk, -0.42 + i * 0.05, 0.465, 0, g);
  [-1, 1].forEach(s => {
    mesh(box(0.26, 0.2, 0.004), blk, -0.28, 0.3, s * 0.234, g);           // door shut lines
    mesh(box(0.22, 0.16, 0.003), yel, -0.28, 0.3, s * 0.237, g);
    mesh(box(0.03, 0.008, 0.006), M.chrome, -0.2, 0.36, s * 0.241, g);
    mesh(box(0.06, 0.02, 0.02), blk, 0.08, 0.17, s * 0.24, g);             // step
    mesh(box(0.012, 0.03, 0.04), TAIL, -0.512, 0.36, s * 0.17, g);
  });
  mesh(cylY(0.018, 0.22, 8), blk, -0.36, 0.56, 0.12, g);
  mesh(cylY(0.026, 0.01, 8), blk, -0.36, 0.675, 0.12, g);
  mesh(box(0.008, 0.06, 0.16), labelPlate, -0.515, 0.24, 0, g);
  // operator: seat back, steering wheel on a column, armrest console, mirrors
  mesh(box(0.03, 0.12, 0.13), blk, -0.17, 0.64, 0, g);
  mesh(cylY(0.012, 0.14, 6), blk, 0.0, 0.58, 0, g);
  const sw = mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 16), blk, 0.02, 0.66, 0, g); sw.rotation.x = Math.PI / 2; sw.rotation.y = -0.5;
  mesh(box(0.08, 0.05, 0.04), blk, -0.08, 0.6, 0.09, g);
  [-1, 1].forEach(s => mesh(box(0.012, 0.05, 0.04), M.glass, 0.1, 0.8, s * 0.26, g));
  const beacon = lamp(0xffa21a, 0.5);
  mesh(cylY(0.025, 0.04, 10), beacon, -0.3, 0.915, 0.15, g);
  // canopy roof edge trim + work lights
  mesh(box(0.52, 0.012, 0.5), blk, -0.12, 0.865, 0, g);
  [-1, 1].forEach(s => workLight(g, 0.12, 0.86, s * 0.18));
  g.userData.lamps = [beacon];
  return finish(g);
}

// ---------------------------------------------------------------------------
// CONSTRUCTION MACHINES (crawlers)
function trackUnit(g, len, z, h = 0.2, wd = 0.2) {
  // drive sprocket, idler, bottom rollers and the track frame, then the belt
  [len / 2 - h * 0.48, -len / 2 + h * 0.48].forEach(x => mesh(cylZ(h * 0.42, wd * 1.04, 14), M.iron, x, h / 2, z, g));
  for (let i = 1; i < 5; i++) mesh(cylZ(h * 0.16, wd * 1.03, 10), M.steel, -len / 2 + h * 0.5 + i * (len - h) / 5, h * 0.22, z, g);
  const [c, x] = canvas(64, 16);
  x.fillStyle = '#2b2a28'; x.fillRect(0, 0, 64, 16);
  for (let i = 0; i < 64; i += 8) { x.fillStyle = '#4a4744'; x.fillRect(i, 0, 3, 16); }
  const m = paint(0xffffff, { map: tex(c, { repeat: true }), metalness: 0.5, roughness: 0.8, roughnessMap: null });
  m.map.repeat.set(len * 6, 1);
  mesh(rbox(len, h, wd, Math.min(h, wd) * 0.45), m, 0, h / 2, z, g);
  mesh(box(len * 0.8, h * 0.5, wd * 1.02), M.iron, 0, h / 2, z, g);
}

function excavator() {
  const g = new THREE.Group();
  const y = paint(0xe8ac10, { roughness: 0.46 });
  trackUnit(g, 1.15, 0.3, 0.22, 0.22);
  trackUnit(g, 1.15, -0.3, 0.22, 0.22);
  mesh(box(0.7, 0.1, 0.4), M.iron, 0, 0.2, 0, g);
  const house = part('house', g, 0, 0.27, 0);
  mesh(cylY(0.26, 0.06, 20), M.iron, 0, 0.03, 0, house);
  mesh(rbox(0.9, 0.32, 0.66, 0.04), y, -0.05, 0.22, 0, house);
  mesh(rbox(0.3, 0.34, 0.62, 0.08), M.dark, -0.42, 0.27, 0, house);        // counterweight (no shared faces with the body)
  // engine-cover vents, handrails and steps
  for (let i = 0; i < 6; i++) mesh(box(0.02, 0.004, 0.22), M.dark, -0.32 + i * 0.04, 0.382, 0.16, house);
  rail(house, [[-0.45, 0.33], [0.05, 0.33]], 0.46);
  rail(house, [[-0.45, -0.02], [-0.45, 0.33]], 0.46);
  mesh(box(0.12, 0.012, 0.06), M.steel, 0.3, 0.06, 0.36, house);
  // cab on the left front: framed glass, a roof, work lights, wiper
  mesh(rbox(0.34, 0.4, 0.28, 0.03), y, 0.22, 0.56, -0.17, house);
  glassBand(house, 0.22, 0.6, 0.35, 0.26, 0.29, M.glass, { z: -0.17, rear: true, panes: 2 });
  mesh(box(0.36, 0.02, 0.3), M.dark, 0.22, 0.77, -0.17, house);
  workLight(house, 0.4, 0.8, -0.05); workLight(house, 0.4, 0.8, -0.29);
  mesh(cylY(0.025, 0.14, 8), M.dark, -0.25, 0.44, 0.2, house);              // exhaust
  mesh(cylY(0.03, 0.02, 8), M.dark, -0.25, 0.52, 0.2, house);
  ram(house, [0.2, 0.12, 0.1], [0.55, 0.42, 0.1]);                           // boom lift ram
  // boom / stick / bucket
  const boom = part('boom', house, 0.32, 0.28, 0.1);
  // banana boom: two tapered sections, ram + hose runs along the top
  mesh(prof([[0, -0.06], [0.62, -0.05], [1.15, -0.04], [1.15, 0.05], [0.62, 0.09], [0, 0.06]], 0.13, 0.012), y, 0, 0, 0, boom);
  ram(boom, [0.45, 0.1, 0], [1.05, 0.12, 0], 0.024);                         // stick ram
  mesh(cylX(0.007, 1.0, 6), M.black, 0.55, 0.075, 0.045, boom);
  mesh(cylX(0.007, 1.0, 6), M.black, 0.55, 0.075, -0.045, boom);
  const stick = part('stick', boom, 1.12, 0, 0);
  mesh(prof([[-0.08, -0.05], [0.8, -0.03], [0.8, 0.03], [-0.08, 0.07]], 0.1, 0.01), y, 0, 0, 0, stick);
  ram(stick, [0.05, 0.07, 0], [0.7, 0.05, 0], 0.02);                         // bucket ram
  const bucket = part('bucket', stick, 0.8, 0, 0);
  mesh(prof([[0, 0.04], [0.16, 0.02], [0.24, -0.12], [0.18, -0.24], [0.02, -0.22], [-0.02, -0.06]], 0.3, 0.01), M.iron, 0, 0, 0, bucket);
  for (let i = 0; i < 5; i++) mesh(new THREE.ConeGeometry(0.012, 0.05, 6).rotateZ(Math.PI * 0.8), M.steel, 0.2, -0.25, -0.12 + i * 0.06, bucket);
  const soil = part('soil', bucket, 0.1, -0.08, 0);
  mesh(sphere(0.12, 8, 6).scale(1, 0.7, 1.1), M.soil, 0, 0, 0, soil);
  boom.rotation.z = 0.55; stick.rotation.z = -1.55; bucket.rotation.z = -0.4;
  const g2 = finish(g);
  g2.userData.parts.soil.visible = false;
  return g2;
}

function bulldozer() {
  const g = new THREE.Group();
  const y = paint(0xe8ac10, { roughness: 0.46 });
  trackUnit(g, 1.05, 0.28, 0.26, 0.2);
  trackUnit(g, 1.05, -0.28, 0.26, 0.2);
  mesh(rbox(0.9, 0.32, 0.4, 0.03), y, 0, 0.36, 0, g);
  mesh(rbox(0.46, 0.2, 0.42, 0.03), y, 0.22, 0.58, 0, g);                 // engine hood
  mesh(cylY(0.025, 0.18, 8), M.dark, 0.32, 0.76, 0.1, g);                  // exhaust
  mesh(rbox(0.36, 0.36, 0.44, 0.03), y, -0.2, 0.7, 0, g);                  // cab
  glassBand(g, -0.2, 0.74, 0.37, 0.24, 0.45, M.glass, { rear: true, panes: 2 });
  mesh(box(0.4, 0.025, 0.48), M.dark, -0.2, 0.895, 0, g);                   // ROPS roof
  workLight(g, -0.0, 0.92, 0.18); workLight(g, -0.0, 0.92, -0.18);
  for (let i = 0; i < 7; i++) mesh(box(0.004, 0.12, 0.38), M.dark, 0.06 + i * 0.045, 0.6, 0, g);  // hood louvres
  [-1, 1].forEach(s => {
    ram(g, [0.1, 0.42, s * 0.24], [0.6, 0.24, s * 0.3], 0.025);              // blade lift rams
    rail(g, [[-0.42, s * 0.22], [0.0, s * 0.22]], 0.6);
  });
  // blade on push arms
  const blade = part('blade', g, 0.62, 0.05, 0);
  mesh(prof([[0, 0], [0.06, 0], [0.12, 0.12], [0.1, 0.36], [0.05, 0.38], [0.04, 0.12]], 0.86, 0.01), y, 0, 0, 0, blade);
  mesh(box(0.04, 0.03, 0.86), M.steel, 0.07, 0.012, 0, blade);
  [-1, 1].forEach(s => mesh(box(0.5, 0.06, 0.05), y, -0.24, 0.12, s * 0.33, blade));
  // ripper
  mesh(box(0.08, 0.3, 0.05), M.iron, -0.6, 0.18, 0, g);
  return finish(g);
}

function backhoe() {
  const g = new THREE.Group();
  const y = paint(0xe8ac10, { roughness: 0.46 });
  mesh(rbox(1.0, 0.28, 0.46, 0.04), y, 0, 0.36, 0, g);
  mesh(rbox(0.36, 0.22, 0.42, 0.04), y, 0.36, 0.58, 0, g);               // engine hood
  mesh(rbox(0.42, 0.44, 0.48, 0.03), y, -0.1, 0.74, 0, g);               // cab
  glassBand(g, -0.1, 0.78, 0.43, 0.26, 0.49, M.glass, { rear: true, panes: 2 });   // top below the cab roof (was coplanar: flicker)
  mesh(box(0.46, 0.025, 0.52), M.dark, -0.1, 0.975, 0, g);
  workLight(g, 0.13, 1.0, 0.18); workLight(g, 0.13, 1.0, -0.18);
  mesh(sphere(0.025, 8, 6), lamp(0xffa21a, 0.6), -0.1, 1.0, 0, g);         // beacon
  for (let i = 0; i < 5; i++) mesh(box(0.004, 0.12, 0.36), M.dark, 0.26 + i * 0.04, 0.58, 0, g);
  [-1, 1].forEach(s => ram(g, [0.05, 0.5, s * 0.26], [0.45, 0.42, s * 0.28], 0.022));
  mesh(cylY(0.022, 0.2, 8), M.dark, 0.44, 0.78, 0.12, g);
  wheels(g, [[0.36, 0.22], [0.36, -0.22]], 0.15, 0.12, false);
  wheels(g, [[-0.28, 0.24], [-0.28, -0.24]], 0.24, 0.16, false);
  // front loader
  const loader = part('loader', g, 0.05, 0.5, 0);
  [-1, 1].forEach(s => mesh(box(0.66, 0.06, 0.05), y, 0.32, -0.12, s * 0.28, loader));
  const lbucket = part('lbucket', loader, 0.66, -0.2, 0);
  mesh(prof([[0, 0.14], [0.08, 0.16], [0.16, -0.02], [0.14, -0.06], [-0.02, -0.06]], 0.66, 0.01), M.iron, 0, 0, 0, lbucket);
  loader.rotation.z = -0.15;
  // stabiliser legs
  [-1, 1].forEach(s => mesh(box(0.06, 0.32, 0.06), M.iron, -0.54, 0.2, s * 0.26, g));
  // backhoe arm at the rear (points backwards: -x)
  const swing = part('swing', g, -0.58, 0.42, 0);
  const boom = part('bboom', swing, 0, 0, 0);
  mesh(box(0.8, 0.09, 0.09), y, -0.4, 0, 0, boom);
  const stick = part('bstick', boom, -0.8, 0, 0);
  mesh(box(0.55, 0.07, 0.07), y, -0.27, 0, 0, stick);
  const bucket = part('bbucket', stick, -0.55, 0, 0);
  mesh(prof([[0, 0.03], [-0.12, 0.02], [-0.18, -0.09], [-0.13, -0.18], [0, -0.16]], 0.2, 0.008), M.iron, 0, 0, 0, bucket);
  const soil = part('bsoil', bucket, -0.08, -0.06, 0);
  mesh(sphere(0.08, 8, 6), M.soil, 0, 0, 0, soil);
  boom.rotation.z = -0.9; stick.rotation.z = 1.9; bucket.rotation.z = 0.5;
  const g2 = finish(g);
  g2.userData.parts.bsoil.visible = false;
  return g2;
}

// ---------------------------------------------------------------------------
// BUSES
function doubleDecker() {           // classic red London-style bus
  const g = new THREE.Group();
  const red = paint(0xb8171b, { roughness: 0.34, metalness: 0.2 });
  const cream = paint(0xe4d9b8);
  const L = 0.86, w = 0.5;
  mesh(rbox(1.72, 0.78, w, 0.08), red, 0, 0.5, 0, g);
  mesh(box(1.73, 0.035, w + 0.004), cream, 0, 0.52, 0, g);                  // between-decks band
  glassBand(g, 0.02, 0.38, 1.62, 0.17, w + 0.01);                             // lower deck windows
  glassBand(g, 0, 0.7, 1.64, 0.17, w + 0.01);                                 // upper deck windows
  mesh(box(0.02, 0.24, w * 0.8), M.glass, L + 0.003, 0.4, 0, g);             // windscreen
  mesh(box(0.02, 0.17, w * 0.86), M.glass, L - 0.002, 0.7, 0, g);
  // destination blind
  const blind = decal(labelTex('15  HARBOUR CITY', { fg: '#f5c84a', bg: '#111', w: 512, h: 64 }), { transparent: false });
  mesh(new THREE.PlaneGeometry(0.3, 0.05), blind, L + 0.012, 0.58, 0, g).rotation.y = Math.PI / 2;
  // open rear platform (dark recess) with the pole
  mesh(box(0.2, 0.26, 0.16), M.dark, -L + 0.08, 0.32, w / 2 - 0.07, g);
  mesh(cylY(0.008, 0.28, 6), M.chrome, -L + 0.14, 0.32, w / 2 - 0.01, g);
  mesh(box(0.02, 0.06, w * 0.96), M.dark, L, 0.16, 0, g);                    // bumper
  heads(g, L + 0.005, 0.2, w);
  tails(g, -L - 0.005, 0.2, w);
  wheels(g, [[0.55, 0.21], [0.55, -0.21], [-0.45, 0.21], [-0.45, -0.21]], 0.1, 0.09, true);
  return finish(g);
}

// a person, ~1.7 m: legs, coat, head
function person(coat = 0x3b4a66, legs = 0x2a2a30) {
  const g = new THREE.Group();
  mesh(box(0.05, 0.16, 0.07), paint(legs), 0, 0.08, 0, g);
  mesh(rbox(0.07, 0.15, 0.09, 0.02), paint(coat), 0, 0.235, 0, g);
  mesh(sphere(0.032, 10, 8), M.skin, 0, 0.34, 0, g);
  return finish(g);
}
function suitcase() {
  const g = new THREE.Group();
  mesh(rbox(0.09, 0.11, 0.05, 0.01), paint(0x8a2b3a), 0, 0.07, 0, g);
  return finish(g);
}

// ---------------------------------------------------------------------------
// SHIPS (length along x; waterline at y = 0, the scene's water sits at ~0.04)
// Textures for extruded hull / deck sides: ExtrudeGeometry side UVs run
// u = length in units, v = 1 - height, so repeat.y = 1 / height fits one row.
function sideTex(draw, w, h, perUnit, height) {
  const [c, x] = canvas(w, h);
  draw(x, w, h);
  const t = tex(c, { repeat: true });
  t.flipY = false;          // canvas top = top of the hull / deck
  t.repeat.set(perUnit, 1 / height);
  return t;
}
const BALCONY = (() => sideTex((x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#5b7186'); gr.addColorStop(0.6, '#26323d'); gr.addColorStop(1, '#1b232b');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(190,215,230,.35)'; x.fillRect(0, h * 0.55, w, h * 0.45);   // glass balustrade
  x.fillStyle = '#f3f2ee'; x.fillRect(0, 0, 4, h); x.fillRect(0, h * 0.53, w, 3);  // divider + rail
  x.fillStyle = '#f3f2ee'; x.fillRect(0, h - 4, w, 4);
}, 32, 32, 5, 0.075))();
function porthole(color, height, perUnit = 7) {
  return sideTex((x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(0, h * 0.82, w, 2);
    x.fillStyle = '#c9d3da';
    x.beginPath(); x.arc(w / 2, h * 0.14, 3, 0, Math.PI * 2); x.fill();
  }, 32, 128, perUnit, height);
}
// window rows for a box superstructure (BoxGeometry UVs: 0..1 per face)
function windowsMat(cols, rows, wall = '#efeee9', glass = '#2c3c4a', bridgeRow = true) {
  const [c, x] = canvas(256, 256);
  x.fillStyle = wall; x.fillRect(0, 0, 256, 256);
  const rh = 256 / rows, cw = 256 / cols;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    if (bridgeRow && r === 0) continue;
    x.fillStyle = glass; x.fillRect(k * cw + cw * 0.2, r * rh + rh * 0.3, cw * 0.6, rh * 0.4);
  }
  if (bridgeRow) { x.fillStyle = glass; x.fillRect(4, rh * 0.2, 248, rh * 0.55); x.fillStyle = wall; for (let k = 1; k < cols * 2; k++) x.fillRect(k * cw / 2, rh * 0.2, 2, rh * 0.55); }
  x.fillStyle = 'rgba(0,0,0,.08)'; for (let r = 1; r < rows; r++) x.fillRect(0, r * rh, 256, 2);
  return new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.5, metalness: 0.15 });
}
function lifeboat(g, x, y, z, s = 1, davit = true) {
  mesh(rbox(0.34 * s, 0.12 * s, 0.13 * s, 0.05 * s), paint(0xf07a1a, { roughness: 0.5 }), x, y, z, g);
  mesh(box(0.28 * s, 0.03 * s, 0.11 * s), M.white, x, y + 0.07 * s, z, g);
  if (davit) [-0.12, 0.12].forEach(dx => mesh(box(0.02, 0.18 * s, 0.02), M.grey, x + dx * s, y + 0.06 * s, z - Math.sign(z) * 0.07 * s, g));
}
function hullPlan(L, B, bowLen = 0.28, sternR = 0.12) {
  return [[-L, -B * 0.92], [-L + sternR, -B], [L * (1 - bowLen), -B], [L * 0.94, -B * 0.4], [L, 0],
    [L * 0.94, B * 0.4], [L * (1 - bowLen), B], [-L + sternR, B], [-L, B * 0.92]];
}
function scalePlan(p, s, sz = s) { return p.map(([x, z]) => [x * s, z * sz]); }

function cruiseShip() {
  const g = new THREE.Group();
  const L = 4.5, B = 0.8;
  const hp = hullPlan(L, B, 0.25);
  mesh(plan(scalePlan(hp, 0.994, 0.985), 0.3), paint(0x9e2b22, { roughness: 0.7 }), 0, -0.24, 0, g);   // underwater hull, inset so its sides never share a plane with the topsides        // antifouling
  mesh(plan(hp, 0.62), paint(0xffffff, { map: porthole('#1c2c4a', 0.62, 9), roughness: 0.4, metalness: 0.3, roughnessMap: null }), 0, 0.02, 0, g); // navy hull + portholes
  mesh(plan(scalePlan(hp, 1.003, 1.01), 0.03), M.white, 0, 0.6, 0, g);            // white sheer line
  // stacked white decks, each with a ribbon of balcony cabins
  const deckMat = paint(0xf3f2ee, { roughness: 0.35 });
  const balcony = new THREE.MeshStandardMaterial({ map: BALCONY, roughness: 0.25, metalness: 0.3 });
  let topP = null;
  for (let i = 0; i < 6; i++) {
    const s = 0.94 - i * 0.035, sz = 0.97 - i * 0.03;
    const p = scalePlan(hp, s, sz).map(([x, z]) => [x - 0.25 - i * 0.04, z]);
    const y = 0.64 + i * 0.2;
    mesh(plan(p, 0.2), deckMat, 0, y, 0, g);
    mesh(plan(scalePlan(p, 1.004, 1.02), 0.075), balcony, 0, y + 0.08, 0, g);
    topP = p;
  }
  // rail around the top deck, sun loungers, a water slide, radar mast
  rail(g, topP.map(([x, z]) => [x * 0.97, z * 0.95]).concat([[topP[0][0] * 0.97, topP[0][1] * 0.95]]), 1.9, 0.006, M.white);
  for (let i = 0; i < 10; i++) mesh(box(0.1, 0.02, 0.04), M.white, -1.4 + (i % 5) * 0.16, 1.86, i < 5 ? 0.42 : -0.42, g);
  // water slide: a real corkscrew tube from a small tower down to the deck
  // (it was a flat open ring hovering over the deck, which read as cut off)
  const slideM = paint(0xe8641c, { roughness: 0.3, coat: true });
  const hel = [];
  for (let i = 0; i <= 40; i++) {
    const a = i / 40 * Math.PI * 3;
    hel.push(new THREE.Vector3(0.3 + Math.cos(a) * 0.16, 2.3 - i / 40 * 0.42, 0.32 + Math.sin(a) * 0.16));
  }
  hel.push(new THREE.Vector3(0.62, 1.88, 0.32));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), 80, 0.028, 10), slideM, 0, 0, 0, g);
  mesh(cylY(0.03, 0.48, 8), M.white, 0.3, 2.08, 0.32, g);                    // centre column
  mesh(box(0.16, 0.02, 0.16), M.white, 0.46, 2.31, 0.32, g);                 // top platform
  [[0.4, 0.26], [0.52, 0.26], [0.4, 0.38], [0.52, 0.38]].forEach(([x, z]) => mesh(box(0.012, 0.47, 0.012), M.white, x, 2.075, z, g));
  mesh(box(0.14, 0.012, 0.1), paint(0x3ea8c9, { roughness: 0.1 }), 0.68, 1.85, 0.32, g);   // splash pool
  mesh(box(0.06, 0.4, 0.06), M.white, 1.9, 2.2, 0, g);
  mesh(box(0.3, 0.02, 0.04), M.white, 1.9, 2.36, 0, g);
  mesh(sphere(0.06, 10, 8), M.white, 1.9, 2.46, 0, g);
  mesh(box(0.28, 0.015, 0.03), M.dark, 1.9, 2.4, 0.1, g);
  // bridge, funnel, lifeboats, pool, mast
  mesh(box(0.42, 0.18, 1.6), deckMat, 2.6, 1.92, 0, g);
  glassBand(g, 2.7, 1.95, 0.24, 0.08, 1.62);
  const fun = paint(0x1c2c4a);
  mesh(prof([[-0.5, 0], [0.25, 0], [0.12, 0.62], [-0.38, 0.62]], 0.46, 0.06), fun, -2.2, 1.84, 0, g);
  mesh(prof([[-0.39, 0.5], [0.14, 0.5], [0.12, 0.62], [-0.38, 0.62]], 0.47, 0.06), M.black, -2.2, 1.84, 0, g);
  [-1, 1].forEach(s => { for (let i = 0; i < 7; i++) lifeboat(g, 1.8 - i * 0.55, 0.98, s * 0.8); });
  mesh(box(0.9, 0.04, 0.6), paint(0x3ea8c9, { roughness: 0.1, metalness: 0.2 }), -0.6, 1.85, 0, g);
  mesh(cylY(0.03, 0.6, 6), M.white, 2.2, 2.2, 0, g);
  // name on the bow
  const name = decal(labelTex('AURORA', { fg: '#f2efe6', w: 512, h: 96, font: 'bold 64px Georgia, serif' }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(0.9, 0.17), name, 3.0, 0.42, s * (B * 0.82 + 0.03), g);
    m.rotation.y = s > 0 ? 0.06 : Math.PI - 0.06;
  });
  const g2 = finish(g);
  g2.userData.funnel = new THREE.Vector3(-2.3, 2.5, 0);
  g2.userData.horn = new THREE.Vector3(-2.1, 2.5, 0);
  return g2;
}

function tugboat() {
  const g = new THREE.Group();
  const L = 0.7, B = 0.28;
  const hp = hullPlan(L, B, 0.4, 0.15);
  mesh(plan(scalePlan(hp, 0.994, 0.985), 0.2), paint(0x8d2a20, { roughness: 0.7 }), 0, -0.16, 0, g);   // underwater hull, inset so its sides never share a plane with the topsides
  mesh(plan(hp, 0.3), M.black, 0, 0.02, 0, g);
  mesh(plan(scalePlan(hp, 1.05, 1.12), 0.08), M.rubber, 0, 0.18, 0, g);   // rubber fendering
  mesh(rbox(0.5, 0.22, 0.4, 0.03), paint(0xb8261c), -0.05, 0.42, 0, g);
  mesh(rbox(0.26, 0.2, 0.32, 0.02), M.white, 0.1, 0.62, 0, g);                 // wheelhouse
  glassBand(g, 0.1, 0.66, 0.27, 0.08, 0.33);
  mesh(cylY(0.06, 0.24, 12), paint(0xb8261c), -0.18, 0.66, 0, g);
  mesh(cylY(0.062, 0.06, 12), M.black, -0.18, 0.79, 0, g);
  mesh(cylY(0.012, 0.3, 6), M.white, 0.12, 0.85, 0, g);
  const g2 = finish(g);
  g2.userData.funnel = new THREE.Vector3(-0.18, 0.84, 0);
  return g2;
}

function fireboat() {
  const g = new THREE.Group();
  const L = 0.95, B = 0.3;
  const hp = hullPlan(L, B, 0.35, 0.12);
  mesh(plan(scalePlan(hp, 0.994, 0.985), 0.18), M.black, 0, -0.14, 0, g);   // underwater hull, inset so its sides never share a plane with the topsides
  mesh(plan(hp, 0.3), paint(0xc0221a, { roughness: 0.4 }), 0, 0.02, 0, g);
  mesh(rbox(0.6, 0.24, 0.42, 0.03), M.white, -0.15, 0.44, 0, g);
  glassBand(g, -0.06, 0.5, 0.44, 0.09, 0.43);
  mesh(rbox(0.3, 0.12, 0.3, 0.02), paint(0xc0221a), -0.12, 0.62, 0, g);
  const mons = [];
  [[0.5, 0.4, 0], [-0.05, 0.75, 0]].forEach(([x, y, z], i) => {
    const m = part('mon' + i, g, x, y, z);
    mesh(cylY(0.04, 0.06, 10), M.chrome, 0, 0, 0, m);
    mesh(cylX(0.018, 0.16, 8), M.chrome, 0.08, 0.04, 0, m);
    mons.push(m);
  });
  const amber = lamp(0x1d4fff, 0.2);
  mesh(box(0.05, 0.04, 0.1), amber, -0.1, 0.71, 0, g);
  // --- fireboat detail ---------------------------------------------------
  // heavy rubber fendering along the sheer, white hull band, deck rail
  // top at 0.30, below the deck (0.32): level with it, the two tops z-fought
  mesh(plan(scalePlan(hp, 1.04, 1.1), 0.05), M.rubber, 0, 0.25, 0, g);
  mesh(plan(scalePlan(hp, 1.003, 1.01), 0.025), M.white, 0, 0.17, 0, g);
  const fe = scalePlan(hp, 0.95, 0.88);
  rail(g, fe.concat([fe[0]]), 0.4, 0.004, M.white);
  // foredeck: monitor platform, bitts, hose reels; aft deck: towing bitt,
  // fire pump intake, rolled hoses, life rings on the wheelhouse
  mesh(cylY(0.07, 0.04, 14), M.dark, 0.5, 0.34, 0, g);
  [-1, 1].forEach(s => {
    mesh(cylY(0.014, 0.04, 8), M.dark, 0.72, 0.34, s * 0.08, g);
    mesh(cylZ(0.05, 0.04, 14), paint(0xd8cf3a, { roughness: 0.5 }), -0.62, 0.38, s * 0.12, g);
    mesh(new THREE.TorusGeometry(0.038, 0.012, 6, 14), M.black, -0.62, 0.38, s * 0.145, g);
    mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 14), paint(0xf06a1a, { roughness: 0.5 }), -0.2, 0.47, s * 0.213, g);
    // side monitors on the wheelhouse roof corners
    mesh(cylY(0.02, 0.04, 8), M.chrome, 0.1, 0.59, s * 0.16, g);
    mesh(cylX(0.01, 0.08, 6), M.chrome, 0.14, 0.61, s * 0.16, g);
  });
  mesh(cylY(0.03, 0.05, 10), M.dark, -0.82, 0.345, 0, g);
  // mast with radar scanner, nav lights, searchlight and horn
  mesh(cylY(0.012, 0.32, 6), M.white, -0.22, 0.84, 0, g);
  mesh(box(0.02, 0.012, 0.14), M.white, -0.22, 0.92, 0, g);
  mesh(box(0.16, 0.012, 0.025), M.dark, -0.22, 1.0, 0, g);
  mesh(sphere(0.012, 8, 6), lamp(0xfff2c0, 0.3), -0.22, 1.01, 0, g);
  [[0x20d040, 1], [0xe02020, -1]].forEach(([c, s]) => mesh(box(0.02, 0.02, 0.012), lamp(c, 0.3), 0.05, 0.6, s * 0.21, g));
  mesh(cylX(0.022, 0.04, 10), M.chrome, 0.04, 0.7, 0.1, g);
  mesh(box(0.03, 0.03, 0.03), M.dark, 0.0, 0.69, 0.1, g);
  // exhaust stacks aft of the wheelhouse, bow name
  [-1, 1].forEach(s => mesh(cylY(0.018, 0.16, 8), M.dark, -0.4, 0.62, s * 0.1, g));
  const fn = decal(labelTex('FIRE 1', { fg: '#ffffff', w: 256, h: 64 }));
  [-1, 1].forEach(s => { const m = mesh(new THREE.PlaneGeometry(0.22, 0.055), fn, 0.35, 0.24, s * (B + 0.006), g); m.rotation.y = s > 0 ? 0 : Math.PI; });
  g.userData.lamps = [amber];
  return finish(g);
}

// shipping container texture (corrugation), tinted per instance
const CONTAINER_MAT = (() => {
  const [c, x] = canvas(128, 64);
  x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 128; i += 5) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i, 0, 2, 64); }
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, 128, 3); x.fillRect(0, 61, 128, 3);
  return new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6, metalness: 0.3 });
})();
const CONTAINER_COLORS = [0xb3392b, 0x2f5e8c, 0x3f7f46, 0xc98a1e, 0x8a8f96, 0x6e3a2e, 0xd6d3cb, 0x1f4058];
const CONTAINER_GEO = new THREE.BoxGeometry(0.6, 0.26, 0.25);
function container(color) {
  const m = new THREE.Mesh(CONTAINER_GEO, CONTAINER_MAT.clone());
  m.material.color.set(color);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function containerStack(list) {   // list of [x, y, z, colorIndex, rotY]
  const im = new THREE.InstancedMesh(CONTAINER_GEO, CONTAINER_MAT, list.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach(([x, y, z, ci, ry = 0], i) => {
    o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, c.set(CONTAINER_COLORS[ci % CONTAINER_COLORS.length]));
  });
  im.castShadow = im.receiveShadow = true;
  return im;
}

function freightShip() {
  const g = new THREE.Group();
  const L = 4.0, B = 0.72;
  const hp = hullPlan(L, B, 0.22);
  mesh(plan(scalePlan(hp, 0.994, 0.985), 0.3), paint(0x8f2a20, { roughness: 0.7 }), 0, -0.24, 0, g);   // underwater hull, inset so its sides never share a plane with the topsides
  mesh(plan(hp, 0.58), paint(0x23395c, { roughness: 0.55, metalness: 0.3 }), 0, 0.02, 0, g);
  mesh(plan(scalePlan(hp, 0.985, 0.96), 0.02), paint(0x6d2a24), 0, 0.6, 0, g);      // deck
  // hatch covers under the bays, lashing bridges between them
  for (let b = 0; b < 5; b++) {
    mesh(box(0.66, 0.05, 1.22), paint(0x5f6a72, { roughness: 0.6 }), 1.95 - b * 0.95, 0.64, 0, g);
    if (b < 4) [-1, 1].forEach(s => mesh(box(0.05, 0.6, 0.05), paint(0xd8cf3a), 1.47 - b * 0.95, 0.95, s * 0.6, g));
    if (b < 4) mesh(box(0.05, 0.04, 1.2), paint(0xd8cf3a), 1.47 - b * 0.95, 1.24, 0, g);
  }
  // forecastle with mast, anchors, mooring winches
  mesh(box(0.5, 0.12, 1.0), paint(0x6d2a24), 3.3, 0.66, 0, g);
  mesh(cylY(0.025, 0.7, 6), paint(0xd8cf3a), 3.4, 1.05, 0, g);
  [-1, 1].forEach(s => { mesh(cylZ(0.05, 0.1, 10), M.dark, 3.15, 0.72, s * 0.3, g); mesh(box(0.08, 0.1, 0.03), M.dark, 3.5, 0.4, s * 0.62, g); });
  // superstructure at the stern: decks of cabins, wheelhouse with bridge wings
  const sup = windowsMat(5, 5);
  mesh(box(0.6, 1.0, 1.1), [sup, sup, M.white, M.white, sup, sup], -3.2, 1.1, 0, g).userData.solo = true;   // multi-material: not merged
  mesh(box(0.25, 0.06, 1.5), M.white, -2.98, 1.63, 0, g);                      // bridge wings
  rail(g, [[-3.5, 0.55], [-2.9, 0.55]], 1.68, 0.005, M.white);
  rail(g, [[-3.5, -0.55], [-2.9, -0.55]], 1.68, 0.005, M.white);
  mesh(rbox(0.3, 0.5, 0.34, 0.04), paint(0x23395c), -3.45, 1.8, 0, g);
  mesh(cylY(0.02, 0.4, 6), M.white, -3.2, 1.85, 0, g);
  mesh(box(0.3, 0.015, 0.03), M.dark, -3.2, 2.0, 0, g);                        // radar
  lifeboat(g, -3.65, 1.0, 0, 1.1, false);
  // containers: 5 bays x 4 rows x 2-3 tiers
  const list = [], r = seeded(5);
  for (let b = 0; b < 5; b++) for (let row = 0; row < 4; row++) {
    const tiers = 2 + Math.round(r());
    for (let t = 0; t < tiers; t++) list.push([1.95 - b * 0.95, 0.75 + t * 0.27, -0.42 + row * 0.28, Math.floor(r() * 8), 0]);
  }
  const stack = containerStack(list);
  g.add(stack);
  const name = decal(labelTex('NORDIC STAR', { fg: '#f2efe6', w: 512, h: 64 }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(1.0, 0.12), name, 2.6, 0.42, s * (B * 0.82 + 0.03), g);
    m.rotation.y = s > 0 ? 0.05 : Math.PI - 0.05;
  });
  const g2 = finish(g);
  g2.userData.funnel = new THREE.Vector3(-3.45, 2.08, 0);
  return g2;
}

function oilTanker() {
  const g = new THREE.Group();
  const L = 4.0, B = 0.72;
  const hp = hullPlan(L, B, 0.2);
  mesh(plan(scalePlan(hp, 0.994, 0.985), 0.3), paint(0x8f2a20, { roughness: 0.7 }), 0, -0.24, 0, g);   // underwater hull, inset so its sides never share a plane with the topsides
  mesh(plan(hp, 0.5), paint(0x161718, { roughness: 0.55, metalness: 0.3 }), 0, 0.02, 0, g);
  mesh(plan(scalePlan(hp, 0.985, 0.96), 0.02), paint(0x5f6e4a, { roughness: 0.8 }), 0, 0.52, 0, g);
  // pipe runs and walkway along the deck
  [-0.15, 0, 0.15].forEach(z => mesh(cylX(0.025, 5.6, 8), paint(0xb0b8b4, { metalness: 0.5 }), 0.1, 0.6, z, g));
  mesh(box(5.6, 0.02, 0.18), M.steel, 0.1, 0.72, 0.38, g);
  for (let x = -2.6; x < 2.9; x += 0.7) mesh(box(0.05, 0.16, 0.05), M.steel, x, 0.62, 0.38, g);
  // manifold amidships with a hose crane
  mesh(box(0.3, 0.12, 1.2), M.steel, 0, 0.62, 0, g);
  mesh(cylY(0.03, 0.6, 8), M.white, 0.25, 0.85, -0.3, g);
  const hoses = part('hoses', g, 0, 0.64, -0.66);
  [-0.08, 0.08].forEach(x => mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 14, Math.PI), M.black, x, -0.2, 0, hoses).rotation.set(0, Math.PI / 2, Math.PI));
  // deck cranes + catwalk posts + foam monitors
  [-1.6, 1.6].forEach(x => { mesh(cylY(0.04, 0.5, 8), paint(0xd8cf3a), x, 0.8, -0.3, g); const j = mesh(box(0.7, 0.04, 0.04), paint(0xd8cf3a), x + 0.3, 1.02, -0.3, g); j.rotation.z = 0.3; });
  [-2.0, -0.8, 0.8, 2.0].forEach(x => mesh(box(0.06, 0.06, 0.6), M.steel, x, 0.6, 0.1, g));
  // superstructure aft
  const sup = windowsMat(5, 5);
  mesh(box(0.6, 0.9, 1.05), [sup, sup, M.white, M.white, sup, sup], -3.15, 0.98, 0, g).userData.solo = true;   // multi-material: not merged
  mesh(box(0.25, 0.06, 1.45), M.white, -2.94, 1.46, 0, g);
  lifeboat(g, -3.6, 0.95, 0, 1.1, false);
  mesh(rbox(0.3, 0.5, 0.34, 0.04), paint(0xb8261c), -3.42, 1.65, 0, g);
  mesh(cylY(0.02, 0.35, 6), M.white, -3.1, 1.6, 0, g);
  // --- tanker detail -----------------------------------------------------
  const tred = paint(0x8f2a20, { roughness: 0.7 }), tyel = paint(0xd8cf3a, { roughness: 0.5 });
  const deckG = paint(0x5f6e4a, { roughness: 0.8 });
  // deck-edge railing all round, white boot-top line just above the water
  const edge = scalePlan(hp, 0.975, 0.93);
  rail(g, edge.concat([edge[0]]), 0.63, 0.005, M.white);
  mesh(plan(scalePlan(hp, 1.002, 1.008), 0.015), M.white, 0, 0.07, 0, g);
  // raised forecastle with bulwark, anchor windlasses, foremast + bow light
  mesh(box(0.5, 0.1, 1.0), tred, L * 0.88, 0.57, 0, g);
  [-1, 1].forEach(s => {
    mesh(cylZ(0.05, 0.12, 12), M.dark, L * 0.86, 0.66, s * 0.22, g);
    mesh(cylY(0.035, 0.04, 10), M.dark, L * 0.93, 0.64, s * 0.12, g);
    mesh(box(0.09, 0.07, 0.02), M.dark, L * 0.9, 0.42, s * (B * 0.6), g);           // anchor in its pocket
  });
  mesh(cylY(0.018, 0.55, 6), tyel, L * 0.9, 0.9, 0, g);
  mesh(sphere(0.02, 8, 6), lamp(0xfff2c0, 0.3), L * 0.9, 1.18, 0, g);
  // cargo tank domes + expansion trunks in two rows, deck lights, P/V mast
  for (let x = -2.4; x <= 2.6; x += 0.62) [-0.3, 0.3].forEach(z => {
    mesh(cylY(0.06, 0.05, 12), deckG, x, 0.565, z, g);
    mesh(cylY(0.02, 0.04, 8), M.steel, x, 0.61, z, g);
  });
  [-2.2, -0.6, 1.0, 2.4].forEach(x => { mesh(cylY(0.008, 0.3, 4), M.white, x, 0.69, -0.42, g); mesh(box(0.03, 0.02, 0.03), lamp(0xfff2c0, 0.2), x, 0.85, -0.42, g); });
  mesh(cylY(0.03, 0.4, 8), M.steel, -2.5, 0.74, 0.25, g);
  // mooring bollards + fairleads along both sides
  [-2.6, -1.4, 1.4, 2.6].forEach(x => [-1, 1].forEach(s => {
    [-0.04, 0.04].forEach(dx => mesh(cylY(0.018, 0.05, 8), M.dark, x + dx, 0.565, s * 0.55, g));
  }));
  // superstructure: bridge wings, wheelhouse windows band, radar mast with
  // two scanners, funnel with a company band and black top, davit lifeboat
  glassBand(g, -3.15, 1.33, 0.62, 0.1, 1.07, M.glass, { panes: 6 });
  [-1, 1].forEach(s => mesh(box(0.12, 0.03, 0.02), M.white, -2.94, 1.5, s * 0.72, g));
  mesh(box(0.04, 0.4, 0.04), M.white, -3.15, 1.69, 0, g);
  mesh(box(0.22, 0.012, 0.02), M.dark, -3.15, 1.84, 0, g);
  mesh(box(0.16, 0.012, 0.02), M.dark, -3.15, 1.76, 0.0, g);
  mesh(box(0.31, 0.06, 0.35), paint(0x2f5e8c), -3.42, 1.72, 0, g);
  mesh(box(0.31, 0.05, 0.35), M.black, -3.42, 1.88, 0, g);
  [-1, 1].forEach(s => {
    lifeboat(g, -3.0, 1.12, s * 0.6, 0.9);
    // accommodation ladder folded along the hull side
    const lad = mesh(box(0.5, 0.02, 0.04), M.steel, -2.4, 0.4, s * (B + 0.025), g); lad.rotation.z = 0.3;
  });
  const name = decal(labelTex('OCEAN PEARL', { fg: '#f2efe6', w: 512, h: 64 }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(1.0, 0.12), name, 2.6, 0.36, s * (B + 0.006), g);   // on the hull side (was inside it)
    m.rotation.y = s > 0 ? 0 : Math.PI;
  });
  const g2 = finish(g);
  g2.userData.funnel = new THREE.Vector3(-3.42, 1.92, 0);
  return g2;
}

// ship-to-shore container crane: legs straddle the quay, boom reaches over the
// water toward -x; the trolley runs along the boom, the spreader hangs below.
function containerCrane() {
  const g = new THREE.Group();
  const blue = paint(0x2c6aa0, { roughness: 0.45, metalness: 0.4 });
  const white = paint(0xe9e9e4);
  const H = 3.4;
  [[0.7, 0.6], [0.7, -0.6], [-0.7, 0.6], [-0.7, -0.6]].forEach(([x, z]) => {
    mesh(box(0.1, H, 0.1), blue, x, H / 2, z, g);
    mesh(box(0.22, 0.1, 0.16), M.iron, x, 0.05, z, g);
  });
  [0.7, -0.7].forEach(x => mesh(box(0.08, 0.08, 1.3), blue, x, 1.2, 0, g));
  [0.6, -0.6].forEach(z => { mesh(box(1.5, 0.12, 0.1), blue, 0, H, z, g); mesh(box(1.5, 0.08, 0.08), blue, 0, 1.25, z, g); });
  // diagonal braces
  [0.6, -0.6].forEach(z => { const b = mesh(box(2.4, 0.05, 0.05), blue, 0, 2.3, z, g); b.rotation.z = 0.83; });
  // boom (forward over the water, toward -x) and back-reach
  [0.18, -0.18].forEach(z => mesh(box(6.2, 0.14, 0.07), white, -1.5, H + 0.3, z, g));
  for (let x = -4.4; x < 1.4; x += 0.4) mesh(box(0.04, 0.12, 0.36), white, x, H + 0.3, 0, g);
  mesh(rbox(0.7, 0.4, 0.7, 0.03), white, 0.9, H + 0.6, 0, g);                 // machinery house
  // boom lattice: diagonals along both girders, walkway with a rail
  [0.18, -0.18].forEach(z => {
    for (let x = -4.4; x < 1.4; x += 0.4) { const d = mesh(box(0.42, 0.02, 0.02), white, x + 0.2, H + 0.3, z, g); d.rotation.z = 0.5; }
  });
  mesh(box(5.8, 0.01, 0.12), M.steel, -1.6, H + 0.38, 0.27, g);
  rail(g, [[-4.4, 0.33], [1.2, 0.33]], H + 0.46, 0.005, paint(0xe8ac10));
  // hazard stripes on the leg feet, a ladder up one leg, the main hoist ropes
  const [hc, hx] = canvas(64, 64);
  for (let i = -64; i < 128; i += 16) { hx.fillStyle = '#e8ac10'; hx.beginPath(); hx.moveTo(i, 0); hx.lineTo(i + 8, 0); hx.lineTo(i + 72, 64); hx.lineTo(i + 64, 64); hx.fill(); }
  hx.globalCompositeOperation = 'destination-over'; hx.fillStyle = '#18191b'; hx.fillRect(0, 0, 64, 64);
  const hazard = new THREE.MeshStandardMaterial({ map: tex(hc), roughness: 0.6 });
  [[0.7, 0.6], [0.7, -0.6], [-0.7, 0.6], [-0.7, -0.6]].forEach(([x, z]) => mesh(box(0.12, 0.4, 0.12), hazard, x, 0.3, z, g));
  [-0.04, 0.04].forEach(dz => mesh(box(0.01, H - 0.4, 0.01), M.steel, 0.78, H / 2 + 0.2, 0.6 + dz, g));
  for (let y = 0.5; y < H; y += 0.12) mesh(box(0.01, 0.008, 0.09), M.steel, 0.78, y, 0.6, g);
  [0.14, -0.14].forEach(z => mesh(box(6.0, 0.006, 0.006), M.dark, -1.5, H + 0.22, z, g));
  mesh(box(0.08, 1.0, 0.08), blue, 0.3, H + 0.75, 0.3, g);                     // A-frame
  mesh(box(0.08, 1.0, 0.08), blue, 0.3, H + 0.75, -0.3, g);
  // stays from A-frame to boom tip
  const stay = mesh(box(4.6, 0.025, 0.025), M.steel, -2.0, H + 0.82, 0, g); stay.rotation.z = -0.17;
  const trolley = part('trolley', g, -2.4, H + 0.2, 0);
  mesh(box(0.34, 0.12, 0.44), M.dark, 0, 0, 0, trolley);
  mesh(rbox(0.22, 0.2, 0.22, 0.02), white, 0.06, -0.18, 0.16, trolley);       // operator cab
  const cable = part('cable', trolley, 0, -0.06, 0);
  mesh(box(0.012, 1, 0.012), M.dark, 0, -0.5, 0.08, cable);
  mesh(box(0.012, 1, 0.012), M.dark, 0, -0.5, -0.08, cable);
  const spreader = part('spreader', trolley, 0, -1.2, 0);
  mesh(box(0.62, 0.05, 0.26), paint(0xe8ac10), 0, 0, 0, spreader);
  const g2 = finish(g);
  g2.userData.H = H;
  return g2;
}

function lighthouse() {
  const g = new THREE.Group();
  const red = paint(0xb3261e, { roughness: 0.6 }), wh = paint(0xeeeae0, { roughness: 0.6 });
  for (let i = 0; i < 5; i++) {
    const r0 = 0.32 - i * 0.035, r1 = 0.32 - (i + 1) * 0.035;
    mesh(cylY(r0, 0.4, 18, r1), i % 2 ? red : wh, 0, 0.2 + i * 0.4, 0, g);
  }
  mesh(cylY(0.24, 0.04, 18), M.dark, 0, 2.02, 0, g);
  mesh(cylY(0.14, 0.2, 12), paint(0x8fb3c2, { metalness: 0.6, roughness: 0.1 }), 0, 2.14, 0, g);
  mesh(cylY(0.16, 0.18, 12, 0.02), red, 0, 2.33, 0, g);          // lantern roof
  const light = lamp(0xfff3c4, 0.4);
  mesh(sphere(0.07, 10, 8), light, 0, 2.14, 0, g);
  const beam = part('beam', g, 0, 2.14, 0);
  const bm = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 16, 1, true).rotateZ(Math.PI / 2).translate(2, 0, 0),
    new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  bm.userData.solo = true;
  beam.add(bm);
  g.userData.lamps = [light];
  g.userData.beamMat = bm.material;
  return finish(g);
}

// ---------------------------------------------------------------------------
// AIR
function helicopter() {
  const g = new THREE.Group();
  // air ambulance (EC135-like): lathed pod, framed glass nose, sliding doors,
  // engine cowling, fenestron-style tail, skids on curved cross tubes
  const red = paint(0xc32a1e, { roughness: 0.32, metalness: 0.3, coat: true });
  const yel = paint(0xf2c419, { roughness: 0.35, coat: true });
  // ONE closed lathe for cabin + tail boom, so the boom grows out of the pod
  // with no hole or seam (the old separate pod was open at its back end and
  // the boom poked into that hole). The boom is then bent up toward the tail.
  const podR = x => {           // x: -1.42 (tail tip) .. 0.5 (nose)
    const u = (x + 0.55) / 1.05;
    const cab = u > 0 ? 0.27 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.02 + 0.98 * Math.min(1, u)))), 0.6) : 0;
    const boom = x < -0.55 ? 0.03 + 0.045 * (x + 1.4) / 0.85 : 0.075 * Math.max(0, 1 - (x + 0.55) / 0.5);
    return Math.max(cab, boom, 0.001);
  };
  const latheOf = (from, to, n, grow = 1) => {
    const p = [new THREE.Vector2(0.001, from)];
    for (let i = 0; i <= n; i++) { const x = from + (to - from) * i / n; p.push(new THREE.Vector2(podR(x) * grow, x)); }
    p.push(new THREE.Vector2(0.001, to));
    return p;
  };
  const bend = geo => {          // raise the boom: 0 at the cabin, +0.11 at the tip
    const pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); if (x < -0.3) pa.setY(i, pa.getY(i) + (-0.3 - x) * 0.1); }
    geo.computeVertexNormals();
    return geo;
  };
  const shape = geo => bend(geo.rotateZ(-Math.PI / 2).scale(1, 0.95, 0.82));
  mesh(shape(new THREE.LatheGeometry(latheOf(-1.42, 0.5, 60), 32)), red, 0, 0.42, 0, g);
  // glass nose: a slightly larger shell over the front, open at the bottom
  mesh(shape(new THREE.LatheGeometry(latheOf(0.12, 0.5, 14, 1.025), 32, Math.PI * 1.05, Math.PI * 0.9)), M.glass, 0, 0.42, 0, g);
  // yellow lower half: a thin shell over the belly of the cabin (phi ≈ π/2
  // ends up underneath after the lathe is turned onto its side)
  mesh(shape(new THREE.LatheGeometry(latheOf(-0.42, 0.34, 24, 1.01).slice(1, -1), 32, Math.PI / 2 - 0.95, 1.9)), yel, 0, 0.42, 0, g);
  [-1, 1].forEach(s => {
    mesh(box(0.22, 0.13, 0.008), M.glass, -0.08, 0.48, s * 0.215, g);
    mesh(box(0.3, 0.008, 0.008), M.steel, -0.08, 0.4, s * 0.22, g);
    mesh(cylX(0.022, 0.06, 8), M.dark, -0.32, 0.66, s * 0.08, g);
  });
  mesh(rbox(0.42, 0.13, 0.3, 0.05), red, -0.15, 0.66, 0, g);
  // tail boom tapering to the shrouded tail rotor and fin
  // shrouded tail rotor sits on the end of the boom (boom axis y ≈ 0.53 there)
  mesh(new THREE.TorusGeometry(0.08, 0.025, 10, 24), red, -1.4, 0.55, 0, g);
  mesh(prof([[0.06, 0], [-0.08, 0], [-0.12, 0.28], [-0.02, 0.28]], 0.025, 0.006), red, -1.36, 0.6, 0, g);
  // horizontal stabiliser through the boom, small end fins
  mesh(prof([[0.06, -0.006], [-0.08, -0.006], [-0.08, 0.006], [0.06, 0.008]], 0.4, 0.004), red, -1.12, 0.5, 0, g);
  [-1, 1].forEach(s => mesh(prof([[0.03, -0.04], [-0.05, -0.03], [-0.06, 0.06], [0.0, 0.05]], 0.012, 0.003), red, -1.13, 0.5, s * 0.2, g));
  // skids: two rails on curved cross tubes
  [-1, 1].forEach(s => {
    mesh(cylX(0.014, 0.95, 8), M.dark, 0.0, 0.03, s * 0.25, g);
    mesh(cylX(0.014, 0.08, 8), M.dark, 0.5, 0.06, s * 0.25, g).rotation.z = 0.6;
  });
  [0.22, -0.2].forEach(x => {
    const tube = mesh(new THREE.TorusGeometry(0.25, 0.012, 6, 16, Math.PI), M.dark, x, 0.03, 0, g);
    tube.rotation.y = Math.PI / 2; tube.scale.set(1, 0.6, 1);
  });
  // beacon, nav lights, rotor mast and hub
  const beacon = lamp(0x1d4fff, 0.4);
  mesh(sphere(0.02, 8, 6), beacon, -0.3, 0.73, 0, g);
  mesh(cylY(0.035, 0.14, 10), M.steel, -0.05, 0.78, 0, g);
  const rotor = part('rotor', g, -0.05, 0.86, 0);
  mesh(cylY(0.06, 0.04, 12), M.dark, 0, 0, 0, rotor);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group(); arm.rotation.y = i * Math.PI / 2; rotor.add(arm);
    mesh(prof([[0.05, -0.005], [1.15, -0.005], [1.15, 0.005], [0.05, 0.007]], 0.07), M.dark, 0, 0, 0, arm);
    mesh(box(0.04, 0.008, 0.072), yel, 1.12, 0.004, 0, arm);              // painted blade tips
  }
  const trotor = part('trotor', g, -1.4, 0.56, 0);
  for (let i = 0; i < 8; i++) { const bl = mesh(box(0.012, 0.13, 0.006), M.dark, 0, 0, 0, new THREE.Group()); bl.parent.rotation.z = i * Math.PI / 8; trotor.add(bl.parent); }
  g.userData.lamps = [beacon];
  return finish(g);
}

// a jetliner fuselage: lathe sampled evenly so the window texture lines up
function fuselage(len, R, radiusAt, texture) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    pts.push(new THREE.Vector2(Math.max(0.002, R * radiusAt(u)), -len / 2 + u * len));
  }
  const geo = new THREE.LatheGeometry(pts, 28).rotateZ(-Math.PI / 2);
  return mesh(geo, texture);
}
function liveryTex(cheat, windowsFrom = 0.14, windowsTo = 0.82) {
  const [c, x] = canvas(512, 1024);         // x = around (u), y = along (v)
  x.fillStyle = '#f2f2ef'; x.fillRect(0, 0, 512, 1024);
  x.fillStyle = '#c7c9cb'; x.fillRect(64, 0, 128, 1024);            // belly (u ≈ .25)
  const rowU = [0.96, 0.54];               // window rows, just above the middle on both sides
  rowU.forEach(u => {
    x.fillStyle = cheat; x.fillRect(u * 512 - 28, 0, 14, 1024);
    x.fillStyle = '#1c2530';
    for (let v = windowsFrom; v < windowsTo; v += 0.018) x.fillRect(u * 512 - 8, (1 - v) * 1024, 10, 9);
  });
  // cockpit windows
  x.fillStyle = '#1c2530';
  [0.93, 0.97, 0.53, 0.57].forEach(u => x.fillRect(u * 512 - 10, (1 - 0.955) * 1024, 20, 12));
  const t = tex(c);
  return paint(0xffffff, { map: t, roughness: 0.3, metalness: 0.35, roughnessMap: null });
}
const FAN = (() => {
  const [c, x] = canvas(128, 128);
  x.fillStyle = '#121315'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#6b6f75'; x.lineWidth = 3;
  for (let i = 0; i < 22; i++) { const a = i * Math.PI * 2 / 22; x.beginPath(); x.moveTo(64 + Math.cos(a) * 12, 64 + Math.sin(a) * 12); x.lineTo(64 + Math.cos(a + 0.3) * 62, 64 + Math.sin(a + 0.3) * 62); x.stroke(); }
  x.fillStyle = '#d9dcdf'; x.beginPath(); x.arc(64, 64, 12, 0, Math.PI * 2); x.fill();
  return new THREE.MeshStandardMaterial({ map: tex(c), metalness: 0.7, roughness: 0.4 });
})();
const DOOR = decal((() => {
  const [c, x] = canvas(64, 96);
  x.strokeStyle = 'rgba(60,64,70,.8)'; x.lineWidth = 3; x.strokeRect(4, 4, 56, 88);
  x.fillStyle = 'rgba(28,37,48,.9)'; x.fillRect(22, 18, 20, 16);
  return tex(c);
})());
function jetliner({ tail = 0x1f4f9a, cargo = false } = {}) {
  const g = new THREE.Group();
  const len = cargo ? 5.6 : 5.0, R = cargo ? 0.32 : 0.28;
  const tailM = paint(tail, { roughness: 0.35, metalness: 0.3 });
  const body = liveryTex(cargo ? '#e0661c' : '#1f4f9a', cargo ? 2 : 0.14, cargo ? 2 : 0.8);
  const r = u => (u > 0.93 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.93) / 0.07, 2))) * 0.98 + 0.02
    : u < 0.2 ? 0.25 + 0.75 * Math.sqrt(u / 0.2) : 1);
  const noseCut = 0.88;
  if (cargo) {
    // main fuselage up to the nose cut; the nose is its own hinged part
    const pts = []; for (let i = 0; i <= 36; i++) { const u = i / 36 * noseCut; pts.push(new THREE.Vector2(Math.max(0.002, R * r(u)), -len / 2 + u * len)); }
    mesh(new THREE.LatheGeometry(pts, 28).rotateZ(-Math.PI / 2), body, 0, 0, 0, g);
    const nose = part('nose', g, -len / 2 + noseCut * len, R * 0.98, 0);
    const np = []; for (let i = 0; i <= 10; i++) { const u = noseCut + i / 10 * (1 - noseCut); np.push(new THREE.Vector2(Math.max(0.002, R * r(u)), -len / 2 + u * len)); }
    const ng = new THREE.LatheGeometry(np, 28).rotateZ(-Math.PI / 2).translate(-(-len / 2 + noseCut * len), -R * 0.98, 0);
    mesh(ng, body, 0, 0, 0, nose);
    // (the upper-deck hump was a squashed sphere poking out of the fuselage
    // with the cheat line smeared over it; this is now a clean 777F-style
    // freighter body with flight-deck windows on the nose instead)
    const fdw = paint(0x14191f, { roughness: 0.08, metalness: 0.5 });
    [-1, 1].forEach(s => {
      // nose part's origin is at the hinge, so subtract it; tilt each pane to
      // the hull's slope at that height (normal ≈ 33° above horizontal)
      const wnd = mesh(box(0.12, 0.045, 0.01), fdw, len * 0.41 - (-len / 2 + noseCut * len), R * 0.55 - R * 0.98, s * R * 0.84, nose);
      wnd.rotation.x = -s * 0.58;
    });
    mesh(cylX(0.27, 0.01, 6), M.dark, -len / 2 + noseCut * len, 0, 0, g);  // the cargo bay seen when open
  } else {
    g.add(fuselage(len, R, r, body));
  }
  const y0 = 0;
  // wings: swept, slight dihedral via two halves
  const span = cargo ? 2.9 : 2.5;
  [-1, 1].forEach(s => {
    const w = mesh(plan([[0.55, 0], [-0.25, 0], [-0.85, span * s], [-0.6, span * s]].map(([x, z]) => [x, z]), 0.05), M.offwhite, 0, y0 - R * 0.5, 0, g);
    w.rotation.x = s * 0.05;
    // winglet, flap-track fairings under the wing
    const wl = mesh(prof([[0, 0], [0.22, 0], [0.12, 0.3], [0.04, 0.3]], 0.02), M.offwhite, -0.85, y0 - R * 0.5 + 0.03, span * s, g);
    wl.rotation.x = -s * 0.25;
    for (let k = 1; k <= 3; k++) {
      const fz = s * span * (0.2 + k * 0.2);
      mesh(sphere(0.04, 8, 6).scale(4, 0.8, 1), M.offwhite, -0.25 - k * 0.15, y0 - R * 0.58, fz, g);
    }
    // engines on pylons: nacelle, fan face, exhaust cone
    const ez = s * span * 0.38, ex = 0.25 - span * 0.13, ey = y0 - R * 0.95;
    mesh(box(0.4, 0.12, 0.03), M.offwhite, ex + 0.05, ey + 0.11, ez, g);
    mesh(cylX(0.11, 0.55, 18, 0.13), paint(0xd9dadb, { metalness: 0.6, roughness: 0.3 }), ex, ey, ez, g);
    mesh(cylX(0.112, 0.02, 18), M.chrome, ex + 0.27, ey, ez, g);
    mesh(new THREE.CircleGeometry(0.11, 18).rotateY(Math.PI / 2), FAN, ex + 0.282, ey, ez, g);
    mesh(new THREE.ConeGeometry(0.06, 0.16, 12).rotateZ(Math.PI / 2), M.steel, ex - 0.34, ey, ez, g);
    if (cargo) {
      const ez2 = s * span * 0.7;
      mesh(cylX(0.11, 0.48, 16, 0.1), paint(0xd9dadb, { metalness: 0.6, roughness: 0.3 }), 0.0 - span * 0.25, y0 - R * 0.8, ez2, g);
    }
    // tailplane
    mesh(plan([[0.25, 0], [-0.12, 0], [-0.4, 0.9 * s], [-0.25, 0.9 * s]], 0.03), M.offwhite, -len / 2 + 0.42, y0 + R * 0.2, 0, g);
  });
  // fin with a dorsal fillet and the airline mark, APU exhaust at the tail
  mesh(prof([[0.35, 0], [-0.25, 0], [-0.55, 1.05], [-0.3, 1.05]], 0.05, 0.01), tailM, -len / 2 + 0.6, y0 + R * 0.6, 0, g);
  mesh(prof([[0.75, 0], [0.3, 0], [0.3, 0.12]], 0.04), tailM, -len / 2 + 0.6, y0 + R * 0.6, 0, g);
  const mark = decal(labelTex(cargo ? 'C' : 'H', { fg: '#ffffff', w: 128, h: 128, font: 'bold 100px Georgia, serif' }));
  [-1, 1].forEach(s => { const m = mesh(new THREE.PlaneGeometry(0.3, 0.3), mark, -len / 2 + 0.25, y0 + R * 0.6 + 0.55, s * 0.031, g); m.rotation.y = s > 0 ? 0 : Math.PI; });
  mesh(cylX(0.03, 0.05, 8), M.dark, -len / 2 - 0.01, 0, 0, g);
  // passenger doors (outlines) and the wing-to-body fairing
  if (!cargo) [-1, 1].forEach(s => [len * 0.38, len * 0.05, -len * 0.29].forEach(dx => {
    const d = mesh(new THREE.PlaneGeometry(0.1, 0.17), DOOR, dx, 0.02, s * (R + 0.002), g);
    d.rotation.y = s > 0 ? 0 : Math.PI;
  }));
  mesh(sphere(0.3, 14, 8).scale(3.2, 0.55, 1.05), M.offwhite, 0.1, y0 - R * 0.55, 0, g);
  // landing gear
  const gear = part('gear', g, 0, -R * 0.6, 0);
  mesh(box(0.03, 0.28, 0.03), M.steel, len * 0.36, -0.14, 0, gear);
  mesh(cylZ(0.05, 0.06, 10), M.rubber, len * 0.36, -0.3, 0, gear);
  [-1, 1].forEach(s => {
    mesh(box(0.04, 0.26, 0.04), M.steel, -0.15, -0.13, s * 0.35, gear);
    mesh(cylZ(0.07, 0.12, 12), M.rubber, -0.15, -0.3, s * 0.35, gear);
  });
  const nav = [lamp(0xff2a2a, 0.5), lamp(0x2aff5a, 0.5)];
  mesh(sphere(0.03, 6, 4), nav[0], -0.78, y0 - R * 0.5, -span, g);
  mesh(sphere(0.03, 6, 4), nav[1], -0.78, y0 - R * 0.5, span, g);
  const g2 = finish(g, { shadow: false });
  g2.userData.lamps = nav;
  g2.userData.groundY = R * 0.6 + 0.37;   // lift needed to stand on its wheels
  return g2;
}

function pushbackTug() {
  const g = new THREE.Group();
  const y = paint(0xe8b10c);
  mesh(rbox(0.6, 0.16, 0.36, 0.03), y, 0, 0.14, 0, g);
  mesh(rbox(0.16, 0.12, 0.2, 0.02), M.glass, -0.1, 0.27, 0.06, g);
  mesh(box(0.6, 0.03, 0.03), M.iron, 0.55, 0.14, 0, g);
  wheels(g, [[0.2, 0.15], [0.2, -0.15], [-0.2, 0.15], [-0.2, -0.15]], 0.07, 0.07, false);
  return finish(g);
}

function crashTender() {           // airport fire truck
  const g = new THREE.Group();
  const lime = paint(0xd3d81c, { roughness: 0.4, metalness: 0.2 });
  mesh(rbox(2.2, 0.7, 0.62, 0.06), lime, 0, 0.6, 0, g);
  mesh(rbox(0.6, 0.56, 0.64, 0.08), lime, 0.85, 0.55, 0, g);
  glassBand(g, 0.98, 0.72, 0.36, 0.28, 0.65);
  mesh(box(2.21, 0.05, 0.63), paint(0xc8261e), 0, 0.42, 0, g);
  wheels(g, [[0.7, 0.26], [0.7, -0.26], [-0.2, 0.26], [-0.2, -0.26], [-0.75, 0.26], [-0.75, -0.26]], 0.16, 0.14, false);
  const mon = part('mon', g, 0.6, 1.0, 0);
  mesh(cylY(0.06, 0.06, 10), M.chrome, 0, 0, 0, mon);
  const nz = part('nozzle', mon, 0, 0.05, 0);
  mesh(cylX(0.03, 0.34, 8), M.chrome, 0.17, 0, 0, nz);
  nz.rotation.z = 0.5;
  const bar = lightbar(g, 1.0, 0.86, 0.6, 0.1, [0xff2020, 0xff2020]);
  return finish(g);
}
function uldLoader() {           // scissor-lift loader for the cargo plane
  const g = new THREE.Group();
  const y = paint(0xe8b10c);
  mesh(box(1.0, 0.1, 0.6), M.iron, 0, 0.12, 0, g);
  wheels(g, [[0.35, 0.28], [0.35, -0.28], [-0.35, 0.28], [-0.35, -0.28]], 0.07, 0.06, false);
  const deck = part('deck', g, 0, 0.2, 0);
  mesh(box(1.0, 0.06, 0.62), y, 0, 0, 0, deck);
  mesh(rbox(0.2, 0.2, 0.2, 0.02), M.glass, -0.38, 0.13, 0.2, deck);
  const sc = part('scissor', g, 0, 0.17, 0);
  [-1, 1].forEach(s => { const a = mesh(box(0.9, 0.03, 0.03), M.steel, 0, 0, s * 0.25, sc); a.rotation.z = 0.12; const b = mesh(box(0.9, 0.03, 0.03), M.steel, 0, 0, s * 0.25, sc); b.rotation.z = -0.12; });
  return finish(g);
}

// ---------------------------------------------------------------------------
// RACING
function rider(g, color, x, y, lean = 0.9) {
  const suit = paint(color, { roughness: 0.5 });
  const t = mesh(rbox(0.16, 0.07, 0.08, 0.02), suit, x, y, 0, g); t.rotation.z = -lean * 0.4;
  mesh(sphere(0.04, 16, 12), paint(0xf2f2f2, { roughness: 0.2, metalness: 0.3 }), x + 0.09, y + 0.03, 0, g);
  // tinted visor, helmet stripe, aero hump on the back
  mesh(new THREE.SphereGeometry(0.041, 14, 8, Math.PI - 0.9, 1.8, 1.1, 0.7), paint(0x15181c, { roughness: 0.05, metalness: 0.6 }), x + 0.09, y + 0.03, 0, g);
  mesh(new THREE.TorusGeometry(0.04, 0.005, 6, 18), suit, x + 0.09, y + 0.03, 0, g).rotation.y = Math.PI / 2;
  mesh(rbox(0.07, 0.035, 0.05, 0.015), suit, x - 0.02, y + 0.045, 0, g);
  const white = paint(0xf2f2ee, { roughness: 0.5 }), blk = paint(0x18181a, { roughness: 0.6 });
  [-1, 1].forEach(s => {
    const leg = mesh(box(0.1, 0.035, 0.035), suit, x - 0.06, y - 0.06, s * 0.06, g); leg.rotation.z = 0.6;
    const shin = mesh(box(0.08, 0.03, 0.03), suit, x - 0.07, y - 0.1, s * 0.07, g); shin.rotation.z = -0.9;
    mesh(box(0.04, 0.02, 0.02), blk, x - 0.11, y - 0.14, s * 0.07, g);                 // boot on the peg
    mesh(box(0.025, 0.02, 0.012), white, x - 0.015, y - 0.085, s * 0.08, g);           // knee slider
    const arm = mesh(box(0.09, 0.025, 0.025), suit, x + 0.08, y - 0.02, s * 0.06, g); arm.rotation.z = -0.5;
    mesh(box(0.02, 0.02, 0.02), blk, x + 0.12, y - 0.04, s * 0.05, g);                 // glove
    mesh(box(0.07, 0.012, 0.004), white, x, y + 0.005, s * 0.042, g);                  // leathers stripe
  });
}
function motoGP(color = 0xf2c419, suit = 0x1a2a6a, num = '46') {
  const g = new THREE.Group();
  const lean = part('lean', g, 0, 0, 0);          // rolls into corners
  const body = paint(color, { roughness: 0.28, metalness: 0.35 });
  mesh(prof([[0.2, 0.09], [0.16, 0.2], [0.06, 0.22], [-0.04, 0.2], [-0.14, 0.2], [-0.2, 0.16], [-0.12, 0.1], [0.05, 0.07]], 0.08, 0.012), body, 0, 0, 0, lean);
  mesh(prof([[0.2, 0.2], [0.13, 0.24], [0.1, 0.22]], 0.07, 0.005), M.glass, 0, 0, 0, lean);
  [[0.15], [-0.15]].forEach(([x]) => {
    mesh(cylZ(0.062, 0.035, 18), M.rubber, x, 0.062, 0, lean);
    mesh(cylZ(0.04, 0.038, 10), M.dark, x, 0.062, 0, lean);
    mesh(cylZ(0.012, 0.05, 8), M.steel, x, 0.062, 0, lean);            // axle
  });
  const carbon = paint(0x1c1d20, { roughness: 0.35, metalness: 0.4 });
  const gold = paint(0xc8a032, { roughness: 0.3, metalness: 0.8 });
  // front brake discs + calipers (both sides), rear disc on the right
  [-1, 1].forEach(s => {
    mesh(cylZ(0.036, 0.004, 18), M.steel, 0.15, 0.062, s * 0.024, lean);
    mesh(box(0.025, 0.018, 0.01), paint(0xc4231b), 0.13, 0.085, s * 0.028, lean);
  });
  mesh(cylZ(0.026, 0.004, 14), M.steel, -0.15, 0.062, 0.024, lean);
  // upside-down gold fork legs, triple clamp, clip-on bars
  [-1, 1].forEach(s => {
    const f = mesh(cylY(0.008, 0.15, 8), gold, 0.133, 0.13, s * 0.03, lean); f.rotation.z = 0.28;
    const fl = mesh(cylY(0.006, 0.06, 8), M.chrome, 0.146, 0.09, s * 0.03, lean); fl.rotation.z = 0.28;
    mesh(box(0.025, 0.006, 0.006), M.dark, 0.105, 0.215, s * 0.045, lean);
  });
  mesh(box(0.03, 0.01, 0.08), M.steel, 0.115, 0.205, 0, lean);
  // aluminium twin-spar frame showing under the fairing, swingarm, chain
  [-1, 1].forEach(s => {
    const sa = mesh(box(0.14, 0.022, 0.008), M.steel, -0.085, 0.08, s * 0.03, lean); sa.rotation.z = 0.28;
    const fr = mesh(box(0.13, 0.018, 0.006), M.steel, 0.03, 0.15, s * 0.043, lean); fr.rotation.z = -0.2;
  });
  mesh(box(0.15, 0.006, 0.005), M.dark, -0.08, 0.078, 0.038, lean);
  mesh(cylZ(0.016, 0.006, 12), M.dark, -0.02, 0.09, 0.038, lean);         // front sprocket
  // titanium exhaust up under the tail, carbon tip
  const ex = mesh(cylX(0.013, 0.11, 10), paint(0x9a8c7a, { roughness: 0.3, metalness: 0.9 }), -0.12, 0.13, -0.03, lean); ex.rotation.z = 0.35;
  mesh(cylX(0.015, 0.02, 10), carbon, -0.175, 0.15, -0.03, lean).rotation.z = 0.35;
  // aero winglets, belly pan, tail hump, number board on the nose
  [-1, 1].forEach(s => {
    const wl = mesh(box(0.05, 0.004, 0.03), carbon, 0.15, 0.165, s * 0.05, lean); wl.rotation.x = s * 0.4;
  });
  mesh(box(0.18, 0.02, 0.07), carbon, 0.0, 0.065, 0, lean);
  mesh(rbox(0.07, 0.035, 0.07, 0.012), body, -0.16, 0.215, 0, lean);
  const nb = mesh(new THREE.PlaneGeometry(0.045, 0.035), decal(labelTex(num, { fg: '#111', bg: '#f2f2ee', w: 128, h: 96 }), { transparent: false }), 0.205, 0.155, 0, lean);
  nb.rotation.y = Math.PI / 2; nb.rotation.x = -0.5;
  // mirrors are off for racing; a little tail light instead
  mesh(box(0.004, 0.01, 0.03), new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 0.6 }), -0.197, 0.21, 0, lean);
  rider(lean, suit, -0.03, 0.25);
  const n = decal(labelTex(num, { fg: '#111', bg: null, w: 128, h: 128 }));
  [-1, 1].forEach(s => { const m = mesh(new THREE.PlaneGeometry(0.06, 0.06), n, 0.08, 0.15, s * 0.042, lean); m.rotation.y = s > 0 ? 0 : Math.PI; });
  return finish(g);
}
function f1Car(color = 0xf06a10, accent = 0x1b2a5a, num = '4') {
  const g = new THREE.Group();
  const body = paint(color, { roughness: 0.25, metalness: 0.35 });
  const acc = paint(accent, { roughness: 0.3, metalness: 0.3 });
  mesh(prof([[0.58, 0.05], [0.3, 0.08], [0.06, 0.12], [-0.06, 0.15], [-0.3, 0.17], [-0.48, 0.12], [-0.52, 0.05]], 0.16, 0.02), body, 0, 0, 0, g);
  mesh(prof([[0.18, 0.05], [0.0, 0.1], [-0.38, 0.11], [-0.42, 0.05]], 0.36, 0.02), acc, 0, 0, 0, g);   // sidepods
  mesh(box(0.1, 0.012, 0.42), acc, 0.58, 0.035, 0, g);                       // front wing
  [-1, 1].forEach(s => mesh(box(0.1, 0.05, 0.008), acc, 0.58, 0.055, s * 0.21, g));
  mesh(box(0.08, 0.03, 0.32), acc, -0.55, 0.24, 0, g);                       // rear wing
  [-1, 1].forEach(s => mesh(box(0.1, 0.14, 0.008), body, -0.55, 0.17, s * 0.16, g));
  mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 12, Math.PI), M.dark, -0.02, 0.15, 0, g).rotation.y = Math.PI / 2;
  mesh(sphere(0.035, 12, 8), paint(0xf2f2f2, { roughness: 0.2 }), -0.08, 0.17, 0, g);
  wheels(g, [[0.38, 0.2], [0.38, -0.2], [-0.4, 0.2], [-0.4, -0.2]], 0.07, 0.085, true, M.dark);
  const carbon = paint(0x1c1d20, { roughness: 0.35, metalness: 0.4 });
  // carbon floor + plank, diffuser strakes, double-element wings with endplates
  mesh(box(1.0, 0.008, 0.34), carbon, -0.05, 0.025, 0, g);
  for (let i = -2; i <= 2; i++) { const st = mesh(box(0.08, 0.04, 0.004), carbon, -0.52, 0.05, i * 0.05, g); st.rotation.z = -0.3; }
  mesh(box(0.06, 0.008, 0.4), acc, 0.62, 0.05, 0, g);
  mesh(box(0.06, 0.008, 0.32), body, -0.58, 0.27, 0, g);
  [-1, 1].forEach(s => mesh(box(0.12, 0.035, 0.006), carbon, 0.6, 0.05, s * 0.2, g));
  // wishbones + pushrods to every wheel
  [[0.38, 0.1], [-0.4, 0.11]].forEach(([x, y]) => [-1, 1].forEach(sd => {
    [y - 0.02, y + 0.015].forEach(yy => mesh(box(0.012, 0.006, 0.15), carbon, x, yy, sd * 0.11, g));
    const pr = mesh(box(0.008, 0.006, 0.15), carbon, x - 0.02, y, sd * 0.11, g); pr.rotation.x = sd * 0.35;
  }));
  // airbox above the driver, T-cam, mirrors, engine-cover fin, rain light
  mesh(prof([[0.0, 0.16], [-0.1, 0.24], [-0.16, 0.22], [-0.2, 0.16]], 0.08, 0.01), body, 0, 0, 0, g);
  mesh(box(0.06, 0.04, 0.04), M.dark, -0.07, 0.25, 0, g);
  mesh(box(0.03, 0.012, 0.02), M.black, -0.05, 0.275, 0, g);
  mesh(prof([[-0.18, 0.17], [-0.48, 0.24], [-0.48, 0.13]], 0.006), body, 0, 0, 0, g);
  [-1, 1].forEach(s => {
    mesh(cylY(0.003, 0.04, 4), carbon, 0.1, 0.14, s * 0.1, g);
    mesh(box(0.012, 0.015, 0.03), carbon, 0.1, 0.165, s * 0.11, g);
  });
  mesh(box(0.004, 0.02, 0.04), new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 0.8 }), -0.53, 0.07, 0, g);
  // tyre sidewall stripes (team-colour soft compound)
  [[0.38, 0.2], [0.38, -0.2], [-0.4, 0.2], [-0.4, -0.2]].forEach(([x, z]) =>
    mesh(new THREE.TorusGeometry(0.058, 0.004, 6, 24), paint(0xd82020, { roughness: 0.6 }), x, 0.07, z + Math.sign(z) * 0.044, g));
  const n = decal(labelTex(num, { fg: '#fff', w: 128, h: 128 }));
  mesh(new THREE.PlaneGeometry(0.06, 0.06), n, 0.3, 0.091, 0, g).rotation.set(-Math.PI / 2 + 0.1, 0, -Math.PI / 2);
  return finish(g);
}
function gtCar(color = 0xf2f2ee, accent = 0xc4231b, num = '7') {
  const g = new THREE.Group();
  const body = paint(color, { roughness: 0.25, metalness: 0.4 });
  const L = 0.5, w = 0.46;
  mesh(prof([[-L, 0.06], [L, 0.06], [L + 0.02, 0.1], [L - 0.06, 0.15], [L * 0.3, 0.18], [-L * 0.5, 0.2], [-L, 0.17]], w, 0.02), body, 0, 0, 0, g);
  mesh(prof([[L * 0.32, 0.175], [L * 0.05, 0.26], [-L * 0.4, 0.26], [-L * 0.62, 0.19]], w * 0.72, 0.012), M.glass, 0, 0, 0, g);
  mesh(prof([[L * 0.04, 0.255], [-L * 0.38, 0.258], [-L * 0.4, 0.272], [L * 0.02, 0.27]], w * 0.76, 0.005), body, 0, 0, 0, g);
  mesh(box(L * 2.02, 0.03, w * 1.01), paint(accent), 0, 0.13, 0, g);       // livery stripe
  mesh(box(0.08, 0.015, w * 0.9), M.black, -L + 0.03, 0.3, 0, g);           // rear wing
  [-1, 1].forEach(s => mesh(box(0.04, 0.1, 0.01), M.black, -L + 0.04, 0.25, s * w * 0.35, g));
  mesh(box(0.06, 0.02, w * 1.02), M.black, L - 0.01, 0.07, 0, g);
  heads(g, L + 0.01, 0.11, w);
  const n = decal(labelTex(num, { fg: '#111', bg: '#fff', w: 128, h: 128 }), { transparent: false });
  [-1, 1].forEach(s => { const m = mesh(new THREE.CircleGeometry(0.06, 16), n, 0, 0.13, s * (w / 2 + 0.006), g); m.rotation.y = s > 0 ? 0 : Math.PI; });
  wheels(g, [[L * 0.62, w / 2 - 0.04], [L * 0.62, -w / 2 + 0.04], [-L * 0.6, w / 2 - 0.04], [-L * 0.6, -w / 2 + 0.04]], 0.08, 0.09, true, M.dark);
  const carbon = paint(0x1c1d20, { roughness: 0.35, metalness: 0.4 });
  // splitter lip, rear diffuser, side skirts, wing endplates
  mesh(box(0.06, 0.008, w * 1.05), carbon, L + 0.02, 0.055, 0, g);
  for (let i = -2; i <= 2; i++) mesh(box(0.06, 0.04, 0.004), carbon, -L - 0.01, 0.07, i * w * 0.15, g);
  [-1, 1].forEach(s => {
    mesh(box(L * 1.1, 0.02, 0.01), carbon, 0, 0.07, s * (w / 2 + 0.004), g);
    mesh(box(0.1, 0.06, 0.004), M.black, -L + 0.03, 0.3, s * w * 0.46, g);
    // wing mirrors, door intake, fender louvres
    mesh(box(0.03, 0.02, 0.03), body, L * 0.3, 0.2, s * (w / 2 + 0.01), g);
    mesh(box(0.08, 0.03, 0.006), M.black, -L * 0.25, 0.15, s * (w / 2 + 0.004), g);
    for (let k = 0; k < 4; k++) mesh(box(0.05, 0.004, 0.02), M.black, L * 0.62 - 0.02, 0.175, s * (w / 2 - 0.05 - k * 0.025), g);
  });
  // bonnet vents, fuel filler, tow hooks, roof aerial, rear lights
  [-1, 1].forEach(s => mesh(box(0.07, 0.004, 0.05), M.black, L * 0.55, 0.155, s * 0.08, g));
  mesh(cylY(0.015, 0.006, 10), M.chrome, -L * 0.3, 0.265, w * 0.3, g);
  mesh(box(0.02, 0.02, 0.015), paint(0xc4231b), L + 0.025, 0.08, w * 0.3, g);
  mesh(box(0.02, 0.02, 0.015), paint(0xc4231b), -L - 0.025, 0.09, -w * 0.3, g);
  mesh(cylY(0.003, 0.06, 4), M.black, -L * 0.2, 0.3, 0, g);
  mesh(box(0.006, 0.02, w * 0.9), new THREE.MeshStandardMaterial({ color: 0xd01818, emissive: 0xd01818, emissiveIntensity: 0.6 }), -L - 0.003, 0.15, 0, g);
  return finish(g);
}

// ---------------------------------------------------------------------------
// PARK: ice cream van (static) and a child
function iceCreamTruck() {
  const t = truck({ len: 1.3, w: 0.46, cabLen: 0.4, cabH: 0.42, color: 0xf3ede0, r: 0.09, axles: [0.42, -0.38] });
  const { g, L, cabBot, bodyFront, w } = t;
  const pink = paint(0xe98bb0, { roughness: 0.4 }), mint = paint(0x9fd8c4, { roughness: 0.4 });
  const bodyLen = bodyFront + L;
  mesh(rbox(bodyLen, 0.6, w * 1.02, 0.05), M.white, (bodyFront - L) / 2, cabBot + 0.3, 0, g);
  mesh(box(bodyLen * 0.99, 0.1, w * 1.03), pink, (bodyFront - L) / 2, cabBot + 0.07, 0, g);   // pink skirt
  mesh(box(bodyLen * 0.99, 0.04, w * 1.03), mint, (bodyFront - L) / 2, cabBot + 0.15, 0, g);
  // serving hatch on the kerb side (-z), open, with an awning and a counter
  mesh(box(0.42, 0.2, 0.012), M.dark, -0.15, cabBot + 0.38, -w * 0.51 - 0.002, g);
  const awn = mesh(box(0.48, 0.015, 0.14), pink, -0.15, cabBot + 0.5, -w * 0.51 - 0.06, g);
  awn.rotation.x = -0.35;
  mesh(box(0.44, 0.025, 0.07), M.steel, -0.15, cabBot + 0.28, -w * 0.51 - 0.03, g);
  // a big cone on the roof
  mesh(new THREE.ConeGeometry(0.07, 0.2, 12).rotateX(Math.PI), paint(0xc98a4a, { roughness: 0.8 }), -0.2, cabBot + 0.72, 0, g);
  mesh(sphere(0.075, 12, 8), pink, -0.2, cabBot + 0.85, 0, g);
  const word = decal(labelTex('ICE CREAM', { fg: '#d0457a', w: 512, h: 96 }));
  [-1, 1].forEach(s => {
    const m = mesh(new THREE.PlaneGeometry(0.46, 0.07), word, -0.1, cabBot + 0.56 - (s < 0 ? 0.0 : 0.1), s * (w * 0.51 + 0.004), g);
    m.rotation.y = s > 0 ? 0 : Math.PI;
  });
  return finish(g);
}
function child(coat = 0xd9544a, legs = 0x2a3a5a) {
  const g = person(coat, legs);
  g.scale.setScalar(0.6);
  return g;
}

Object.assign(window.CITY, { V: {
  HEAD, TAIL, NIGHT_LAMPS, car, sedan, taxiCab, policeCar, brokenCar, fireTruck, towTruck, ambulance,
  garbageTruck, wheelieBin, cementMixer, dumpTruck, roadRoller, excavator, bulldozer, backhoe,
  doubleDecker, person, suitcase, cruiseShip, tugboat, fireboat, CONTAINER_MAT, CONTAINER_COLORS,
  CONTAINER_GEO, container, containerStack, freightShip, oilTanker, containerCrane, lighthouse,
  helicopter, jetliner, pushbackTug, crashTender, uldLoader, motoGP, f1Car, gtCar, iceCreamTruck, child
} });
})();
