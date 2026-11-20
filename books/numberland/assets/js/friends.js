// NUMBER CUBE LAND: the number friends (style approved in
// books/preview/assets/js/numbers.js). Smooth plastic cubes in each friend's
// colour, a face plane on the top row, small legs and arms, the numeral
// floating above. Each friend has its own face STYLE and every face changes
// with the story (MOODS). 1..16 are built; 11..16 = Ten with the extra
// friend's cubes stacked on top.
//   One red (one big eye) . Two orange . Three yellow (red crown, red dots)
//   Four green 2x2 . Five light blue (star hand) . Six indigo 2x3 (dice dots)
//   Seven rainbow (red at the bottom up to violet) . Eight magenta (mask,
//   eight arms) . Nine grey 3x3 . Ten white with red edge lines
// Layouts: { cols, flat } - cubes fill rows bottom-up, left to right; `flat`
// lays the rows on the ground (rows go back into the picture).
// Also: icon(n) small SVG for the puzzle panel, shadowSvg / shadowCanvas
// (the friend's silhouette), morph() between two layouts (split / merge /
// rearrange helpers for the world).
(function () {
'use strict';
const THREE = window.THREE;
const WS = window.WEBGL_STAGE || {};
const LEG = 0.34;
const INK = '#1c1c28';

const COLORS = { 1: '#e5232c', 2: '#f6921e', 3: '#ffd41c', 4: '#3cb44b', 5: '#3cc6ef', 6: '#6b46c1', 7: '#8e44ad', 8: '#e2339b', 9: '#9aa3ad', 10: '#f7f7f4' };
const LIMB = { 1: '#b8141c', 2: '#c76a0c', 3: '#e0a800', 4: '#23873a', 5: '#1d93bf', 6: '#4a2c94', 7: '#6a2c8e', 8: '#a81a6e', 9: '#6d757e', 10: '#d0201f' };
const RAINBOW = ['#e5232c', '#f6921e', '#ffd41c', '#3cb44b', '#3cc6ef', '#3f51b5', '#8e44ad'];
const TEN_RED = '#e0262c';
const NAMES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];

function cubeColor(n, i) {
  if (n === 7) return RAINBOW[i % 7];
  if (n >= 10) return i < 10 ? COLORS[10] : cubeColor(n - 10, i - 10);
  return COLORS[n] || '#cccccc';
}
const isTenCube = (n, i) => n >= 10 && i < 10;
const limbColor = n => (n > 10 ? LIMB[n - 10] : LIMB[n]) || '#888888';
const defaultCols = n => ({ 4: 2, 6: 2, 9: 3 })[n] || 1;
function shade(hex, f) {
  const v = parseInt(hex.slice(1), 16);
  const ch = s => Math.max(0, Math.min(255, Math.round(((v >> s) & 255) * f)));
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}

// ---- faces ------------------------------------------------------------------------
//   sleep     lids shut, tiny smile           happy   open eyes, own smile
//   surprised wide eyes, raised brows, "o"    joy     happy arcs, big laugh
//   look-up   eyes and brows up, open smile   brave   squeezed shut, teeth
//   sad       brows up in the middle, frown   think   eyes up-aside, one brow up
const MOODS = ['sleep', 'happy', 'surprised', 'joy', 'look-up', 'brave', 'sad', 'think'];
// eyes: [x, y, rx, ry] on a 256 canvas; mouth: small grin cheeky wide smile open
const STYLE = {
  1: { eyes: [[128, 96, 54, 64]], mouth: 'small' },
  2: { eyes: [[84, 94, 40, 50], [172, 94, 40, 50]], mouth: 'grin' },
  3: { eyes: [[86, 96, 38, 52], [170, 96, 38, 52]], mouth: 'cheeky', lashes: true },
  4: { eyes: [[82, 100, 36, 44], [174, 100, 36, 44]], mouth: 'wide', brows: 'flat' },
  5: { eyes: [[86, 94, 38, 48], [170, 94, 38, 48]], mouth: 'grin', cheeks: true },
  6: { eyes: [[86, 96, 36, 50], [170, 96, 36, 50]], mouth: 'smile', lashes: true },
  7: { eyes: [[84, 92, 40, 54], [172, 92, 40, 54]], mouth: 'open', brows: 'arch' },
  8: { eyes: [[84, 98, 36, 44], [172, 98, 36, 44]], mouth: 'grin', mask: '#7d0f50' },
  9: { eyes: [[86, 104, 32, 40], [170, 104, 32, 40]], mouth: 'small', brows: 'low' },
  10: { eyes: [[82, 94, 42, 52], [174, 94, 42, 52]], mouth: 'wide', brows: 'arch' }
};
const styleOf = n => STYLE[n] || STYLE[n - 10] || STYLE[10];
const mkCanvas = (w, h) => (WS.canvas ? WS.canvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }));

function drawFace(x, st, mood) {
  x.strokeStyle = INK; x.fillStyle = INK; x.lineCap = 'round'; x.lineJoin = 'round';
  const shut = mood === 'sleep' || mood === 'joy' || mood === 'brave';
  const wide = mood === 'surprised' ? 1.12 : 1;
  const lookY = mood === 'look-up' ? -0.42 : mood === 'think' ? -0.3 : mood === 'sad' ? 0.36 : mood === 'surprised' ? 0 : 0.22;
  const lookX = mood === 'think' ? 0.3 : 0;
  if (st.mask) {                                   // Eight's mask: a dark band behind the eyes
    const e0 = st.eyes[0], e1 = st.eyes[st.eyes.length - 1];
    const y0 = e0[1] - e0[3] - 14, y1 = e0[1] + e0[3] + 12;
    x.save(); x.fillStyle = st.mask;
    x.beginPath(); x.moveTo(e0[0] - e0[2] - 26, y0 + 8); x.quadraticCurveTo(128, y0 - 10, e1[0] + e1[2] + 26, y0 + 8);
    x.lineTo(e1[0] + e1[2] + 16, y1); x.quadraticCurveTo(128, y1 + 18, e0[0] - e0[2] - 16, y1); x.closePath(); x.fill();
    x.restore();
  }
  if (st.cheeks) {
    x.save(); x.fillStyle = 'rgba(255,120,150,.45)';
    for (const cx of [56, 200]) { x.beginPath(); x.ellipse(cx, 170, 20, 13, 0, 0, 6.283); x.fill(); }
    x.restore();
  }
  for (const [ex, ey0, rx0, ry0] of st.eyes) {
    const rx = rx0 * wide, ry = ry0 * wide, ey = ey0 + (mood === 'look-up' ? -6 : 0);
    const inward = st.eyes.length > 1 ? (ex < 128 ? 1 : -1) : 0;
    if (shut) {
      x.lineWidth = 13; x.beginPath();
      if (mood === 'sleep') x.ellipse(ex, ey + ry * 0.15, rx * 0.8, ry * 0.42, 0, 0.12 * Math.PI, 0.88 * Math.PI);
      else if (mood === 'joy') x.ellipse(ex, ey + ry * 0.35, rx * 0.8, ry * 0.55, 0, 1.12 * Math.PI, 1.88 * Math.PI);
      else {
        const s = inward || 1;
        x.moveTo(ex - s * rx * 0.6, ey - ry * 0.35); x.lineTo(ex + s * rx * 0.5, ey); x.lineTo(ex - s * rx * 0.6, ey + ry * 0.35);
      }
      x.stroke();
    } else {
      x.lineWidth = 11; x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, 0, 6.283); x.fill(); x.stroke();
      const pr = rx * (mood === 'surprised' ? 0.38 : 0.52);
      const px = ex + inward * rx * 0.2 + lookX * rx, py = ey + ry * lookY;
      x.fillStyle = INK; x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px - pr * 0.35, py - pr * 0.38, pr * 0.3, 0, 6.283); x.fill();
    }
    if (st.lashes && mood !== 'brave') {
      x.lineWidth = 7;
      const set = st.eyes.length > 1 && STYLE[6] === st ? [-0.6, -0.2] : [-0.5, 0, 0.5];
      for (const a0 of set) {
        const a = inward ? a0 * inward : a0;
        const ang = -Math.PI / 2 + a - inward * 0.25, r0 = shut ? ry * 0.2 : ry;
        const bx = ex + Math.sin(a) * rx * 0.75, by = ey - Math.cos(a) * r0;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(ang) * 20, by + Math.sin(ang) * 20); x.stroke();
      }
    }
    // brows: the mood's own, else the friend's own style
    let b = null;
    if (mood === 'surprised' || mood === 'look-up') b = 'up';
    else if (mood === 'brave') b = 'down';
    else if (mood === 'sad') b = 'sad';
    else if (mood === 'think') b = ex >= 128 || inward === 0 ? 'up' : st.brows || null;
    else b = st.brows || null;
    if (b) {
      x.lineWidth = 10; x.beginPath();
      const s = inward || 1;
      const lift = b === 'up' ? 18 : b === 'down' ? 2 : b === 'low' ? 0 : b === 'sad' ? 12 : 10;
      const by = ey - ry - lift;
      const tilt = b === 'down' ? 14 * s : b === 'sad' ? -12 * s : b === 'low' ? 6 * s : -4 * s;
      const bend = b === 'flat' || b === 'low' ? 0 : b === 'arch' ? 16 : 10;
      x.moveTo(ex - rx * 0.7, by - tilt); x.quadraticCurveTo(ex, by - bend, ex + rx * 0.7, by + tilt); x.stroke();
    }
  }
  const M = f => { x.beginPath(); f(); x.lineWidth = 8; x.stroke(); };
  const openMouth = (x0, x1, top, bottom, tongue = true) => {
    const path = () => { x.beginPath(); x.moveTo(x0, top); x.quadraticCurveTo(128, top + 6, x1, top); x.quadraticCurveTo(x1 - 8, bottom, 128, bottom); x.quadraticCurveTo(x0 + 8, bottom, x0, top); x.closePath(); };
    path(); x.fillStyle = '#3a1418'; x.fill();
    if (tongue) { x.save(); x.clip(); x.fillStyle = '#e8566a'; x.beginPath(); x.ellipse(128, bottom, (x1 - x0) * 0.32, 14, 0, 0, 6.283); x.fill(); x.restore(); }
    path(); x.lineWidth = 7; x.stroke();
  };
  const t = st.mouth;
  if (mood === 'sleep') M(() => x.arc(128, 196, 13, 0.2 * Math.PI, 0.8 * Math.PI));
  else if (mood === 'surprised') { x.beginPath(); x.ellipse(128, 206, 13, 17, 0, 0, 6.283); x.fillStyle = '#3a1418'; x.fill(); x.lineWidth = 7; x.stroke(); }
  else if (mood === 'joy') openMouth(88, 168, 180, 236);
  else if (mood === 'sad') M(() => { x.moveTo(100, 210); x.quadraticCurveTo(128, 188, 156, 210); });
  else if (mood === 'think') M(() => { x.moveTo(106, 202); x.quadraticCurveTo(130, 206, 152, 194); });
  else if (mood === 'brave') {
    x.beginPath(); x.moveTo(92, 188); x.quadraticCurveTo(128, 196, 164, 188); x.quadraticCurveTo(160, 222, 128, 222); x.quadraticCurveTo(96, 222, 92, 188); x.closePath();
    x.fillStyle = '#ffffff'; x.fill(); x.lineWidth = 7; x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(94, 204); x.lineTo(162, 204); for (const tx of [110, 128, 146]) { x.moveTo(tx, 192); x.lineTo(tx, 220); } x.stroke();
  } else if (t === 'small') {
    if (mood === 'look-up') openMouth(110, 146, 190, 216, false);
    else M(() => x.arc(128, 184, 22, 0.2 * Math.PI, 0.8 * Math.PI));
  } else if (t === 'grin') openMouth(92, 164, 180, 226);
  else if (t === 'cheeky') {
    if (mood === 'look-up') openMouth(98, 158, 184, 222);
    else M(() => { x.moveTo(92, 186); x.quadraticCurveTo(124, 226, 166, 178); });
  } else if (t === 'wide') {
    if (mood === 'look-up') openMouth(90, 166, 184, 224);
    else M(() => x.arc(128, 168, 44, 0.18 * Math.PI, 0.82 * Math.PI));
  } else if (t === 'smile') {
    if (mood === 'look-up') openMouth(102, 154, 186, 218, false);
    else M(() => x.arc(128, 178, 30, 0.2 * Math.PI, 0.8 * Math.PI));
  } else openMouth(108, 148, 184, 216, mood !== 'look-up');
}

const faceCache = {};
function faceTex(n, mood) {
  const st = styleOf(n), key = (STYLE[n] ? n : n > 10 ? n - 10 : 10) + ':' + mood;
  if (faceCache[key]) return faceCache[key];
  const c = mkCanvas(256, 256);
  drawFace(c.getContext('2d'), st, mood);
  return (faceCache[key] = WS.texture(c));
}
const numCache = {};
function numTex(n) {
  if (numCache[n]) return numCache[n];
  const c = mkCanvas(256, 128), x = c.getContext('2d');
  x.font = 'bold 100px "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.lineWidth = 12; x.strokeStyle = 'rgba(255,255,255,.85)'; x.strokeText(String(n), 128, 70);
  x.fillStyle = INK; x.fillText(String(n), 128, 70);
  return (numCache[n] = WS.texture(c));
}
let tenTex = null;
function tenEdgeTex() {                 // Ten's cubes: white with red lines along every edge
  if (tenTex) return tenTex;
  const c = mkCanvas(128, 128), x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = TEN_RED; x.lineWidth = 9; x.strokeRect(9, 9, 110, 110);
  return (tenTex = WS.texture(c));
}
let diceTex = null;
function sixDiceTex() {                 // Six's dice dots: two columns of three
  if (diceTex) return diceTex;
  const c = mkCanvas(256, 256), x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  for (const px of [72, 184]) for (const py of [54, 128, 202]) { x.beginPath(); x.arc(px, py, 26, 0, 6.283); x.fill(); }
  return (diceTex = WS.texture(c));
}

// ---- shared geometry / materials ---------------------------------------------------
let G = null;
function geo() {
  if (G) return G;
  const star = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.075 : 0.18;
    if (k) star.lineTo(Math.cos(a) * r, Math.sin(a) * r); else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  G = {
    cube: new THREE.RoundedBoxGeometry(1, 1, 1, 3, 0.07),
    face: new THREE.PlaneGeometry(0.9, 0.9),
    leg: new THREE.CapsuleGeometry(0.1, LEG - 0.12, 4, 10),
    arm: new THREE.CapsuleGeometry(0.08, 0.36, 4, 10),
    crown: new THREE.ConeGeometry(0.13, 0.34, 12),
    dot: new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16).rotateX(Math.PI / 2),
    dice: new THREE.PlaneGeometry(1.8, 1.8),
    star: new THREE.ExtrudeGeometry(star, { depth: 0.06, bevelEnabled: false }).translate(0, 0, -0.03)
  };
  return G;
}
const matCache = {};
function mat(color, rough = 0.4, map = null) {
  const key = color + rough + (map ? 'm' : '');
  if (!matCache[key]) matCache[key] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, map });
  return matCache[key];
}

// ---- layouts ----------------------------------------------------------------------------
function cellOf(i, cols) { return [i % cols, Math.floor(i / cols)]; }
function layoutInfo(n, L) {
  const cols = Math.max(1, Math.min(n, L.cols || 1)), rows = Math.ceil(n / cols);
  const topCount = n - (rows - 1) * cols, full = topCount === cols ? rows - 1 : rows - 2;
  return { cols, rows, topCount, rf: Math.max(0, full), flat: !!L.flat };
}
function cubePos(i, n, L, out) {
  const I = layoutInfo(n, L), [c, r] = cellOf(i, I.cols);
  const x = c - (I.cols - 1) / 2;
  if (I.flat) out.set(x, 0.5, (I.rows - 1) / 2 - r);
  else out.set(x, LEG + 0.5 + r, 0);
  return out;
}

// ---- a number friend: feet at the origin, facing +z ----------------------------------------
function friend(n, opts = {}) {
  const g0 = geo();
  const L0 = { cols: opts.cols || defaultCols(n), flat: false };
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  const cubes = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(g0.cube, isTenCube(n, i) ? mat('#ffffff', 0.4, tenEdgeTex()) : mat(cubeColor(n, i)));
    m.castShadow = m.receiveShadow = true;
    body.add(m); cubes.push(m);
  }
  const face = new THREE.Mesh(g0.face, new THREE.MeshStandardMaterial({ map: faceTex(n, 'happy'), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
  body.add(face);
  const lm = mat(limbColor(n), 0.5);
  const legs = [0, 1].map(() => {
    const pv = new THREE.Group();
    const m = new THREE.Mesh(g0.leg, lm); m.position.y = -LEG / 2 + 0.04; m.castShadow = true;
    pv.add(m); body.add(pv); return pv;
  });
  const armN = n === 8 ? 8 : 2;
  const arms = [];
  for (let k = 0; k < armN; k++) {
    const pv = new THREE.Group();
    const m = new THREE.Mesh(g0.arm, lm); m.position.y = -0.22; m.castShadow = true;
    pv.add(m); body.add(pv); arms.push(pv);
  }
  if (n === 5) {                          // Five's star-shaped hand on the right arm
    const s = new THREE.Mesh(g0.star, mat(COLORS[5], 0.45)); s.position.y = -0.5; s.castShadow = true;
    arms[1].add(s);
  }
  // decorations: only in the friend's own shape
  const deco = new THREE.Group(); body.add(deco);
  if (n === 3) {
    for (const x0 of [-0.32, 0, 0.32]) { const m = new THREE.Mesh(g0.crown, mat(COLORS[1], 0.45)); m.position.set(x0, LEG + 3 + 0.16, 0); m.castShadow = true; deco.add(m); }
    for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(g0.dot, mat(COLORS[1], 0.45)); m.position.set(0, LEG + 0.5 + i, 0.51); deco.add(m); }
  }
  if (n === 6 && L0.cols === 2) {
    const m = new THREE.Mesh(g0.dice, new THREE.MeshStandardMaterial({ map: sixDiceTex(), transparent: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(0, LEG + 1, 0.506); deco.add(m);
  }
  const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: numTex(n), depthWrite: false }));
  num.scale.set(1.0, 0.5, 1);
  g.add(num);
  const F = { n, g, body, cubes, face, legs, arms, deco, num, L0, L: null, mood: 'happy', name: NAMES[n] || String(n) };
  place(F, L0);
  return F;
}
function setMood(F, mood) {
  if (F.mood === mood) return;
  F.mood = mood;
  F.face.material.map = faceTex(F.n, mood); F.face.material.needsUpdate = true;
}
const sameL = (a, b) => a && b && a.cols === b.cols && !!a.flat === !!b.flat;
// limb / face / numeral spots for a layout
function rig(F, L) {
  const I = layoutInfo(F.n, L), top = LEG + I.rows;
  const fx = (I.topCount - 1) / 2 - (I.cols - 1) / 2;
  const r = {
    I, face: I.flat ? [-(I.cols - 1) / 2 + (Math.min(I.cols, F.n) - 1) / 2, 1.006, (I.rows - 1) / 2, -Math.PI / 2] : [fx, LEG + I.rows - 0.5, 0.506, 0],
    legX: I.cols === 1 ? 0.24 : (I.cols - 1) / 2,
    armX: I.cols / 2,
    armY: k => LEG + I.rf + 0.45 - k * 0.8,
    numY: I.flat ? 1.6 : top + (F.n === 3 && sameL(L, F.L0) ? 0.75 : 0.5)
  };
  if (I.flat) r.face[0] = (Math.min(I.cols, F.n) - 1) / 2 - (I.cols - 1) / 2;
  return r;
}
function setRig(F, R, limbs) {
  F.face.position.set(R.face[0], R.face[1], R.face[2]);
  F.face.rotation.set(R.face[3], 0, 0);
  F.legs[0].position.set(-R.legX, LEG, 0); F.legs[1].position.set(R.legX, LEG, 0);
  F.arms.forEach((a, k) => {
    const side = k % 2 ? 1 : -1, row = Math.floor(k / 2);
    a.position.set(side * R.armX, Math.max(LEG + 0.3, R.armY(row)), 0);
  });
  F.num.position.set(0, R.numY, 0);
  const s = Math.max(0.001, limbs);
  F.legs.forEach(l => l.scale.setScalar(s));
  F.arms.forEach(a => a.scale.setScalar(s));
}
const _v = THREE ? new THREE.Vector3() : null, _w = THREE ? new THREE.Vector3() : null;
// put the friend in a layout (no animation)
function place(F, L) {
  if (sameL(F.L, L)) return;
  F.L = { cols: L.cols, flat: !!L.flat };
  for (let i = 0; i < F.n; i++) F.cubes[i].position.copy(cubePos(i, F.n, F.L, _v));
  setRig(F, rig(F, F.L), F.L.flat ? 0 : 1);
  F.deco.visible = sameL(F.L, F.L0);
}
// rearrange the cubes from layout A to B (k 0..1): each cube hops on its own,
// limbs tuck in on the way and come out in the new shape
function morph(F, A, B, k) {
  if (k <= 0) { place(F, A); return; }
  if (k >= 1) { place(F, B); return; }
  F.L = { cols: -1 };                       // "in between": the next place() redoes it
  const n = F.n;
  for (let i = 0; i < n; i++) {
    const a = i / n * 0.45, ki = Math.max(0, Math.min(1, (k - a) / 0.55));
    const e = ki * ki * (3 - 2 * ki);
    cubePos(i, n, A, _v); cubePos(i, n, B, _w);
    F.cubes[i].position.lerpVectors(_v, _w, e);
    F.cubes[i].position.y += Math.sin(Math.PI * ki) * 0.7;
  }
  const RA = rig(F, A), RB = rig(F, B), R = k < 0.5 ? RA : RB;
  const e = k * k * (3 - 2 * k);
  const fr = RA.face.map((v, j) => v + (RB.face[j] - v) * e);
  setRig(F, Object.assign({}, R, { face: fr, numY: RA.numY + (RB.numY - RA.numY) * e }),
    k < 0.5 ? (A.flat ? 0 : 1 - k * 2) : (B.flat ? 0 : k * 2 - 1));
  F.deco.visible = false;
}
// neutral pose (call before a pose function writes its own)
function rest(F) {
  F.g.visible = true;
  F.g.rotation.set(0, 0, 0);
  F.g.scale.set(1, 1, 1);
  F.legs.forEach(l => l.rotation.set(0, 0, 0));
  F.arms.forEach((a, k) => a.rotation.set(0, 0, (k % 2 ? 1 : -1) * 0.45));
  const s = F.L && F.L.flat ? 0.001 : 1;          // limbs out again (a pose may have tucked them in)
  F.legs.forEach(l => l.scale.setScalar(s));
  F.arms.forEach(a => a.scale.setScalar(s));
  F.num.visible = true;
}
function tuck(F, legs, arms = legs) {          // 1 = out, 0 = tucked in
  F.legs.forEach(l => l.scale.setScalar(Math.max(0.001, legs)));
  F.arms.forEach(a => a.scale.setScalar(Math.max(0.001, arms)));
}
function walk(F, ph, moving) {
  const s = moving ? Math.sin(ph) : 0;
  F.legs[0].rotation.x = s * 0.6; F.legs[1].rotation.x = -s * 0.6;
  F.arms.forEach((a, k) => { a.rotation.x = (k % 2 ? 1 : -1) * s * 0.5; });
  return moving ? Math.abs(Math.sin(ph)) * 0.12 : 0;     // bounce
}
function wave(F, t, amt = 1) {               // right arm up, waving
  const a = F.arms[1];
  a.rotation.z = 0.45 + amt * (2.2 + Math.sin(t * 9) * 0.35);
}
function cheer(F, amt = 1) {                 // every arm up
  F.arms.forEach((a, k) => { a.rotation.z = (k % 2 ? 1 : -1) * (0.45 + amt * 2.3); });
}

// ---- SVG icons for the puzzle panel -----------------------------------------------------------
// o: { cols, lying, cell, mood, label, legs }
function icon(n, o = {}) {
  const cols = o.cols || defaultCols(n), rows = Math.ceil(n / cols), s = o.cell || 14;
  const lying = !!o.lying, legs = o.legs !== false && !lying;
  const gw = (lying ? rows : cols) * s, gh = (lying ? cols : rows) * s;
  const crown = n === 3 && !lying && cols === 1 ? s * 0.5 : 0;
  const lab = o.label === false ? 0 : s * 1.05;
  const legH = legs ? s * 0.34 : 0, armW = lying ? 0 : s * 0.4;
  const W = gw + armW * 2 + 2, H = lab + crown + gh + legH + 2;
  const ox = armW + 1, oy = lab + crown + 1;
  let out = '';
  const cellXY = i => {
    const [c, r] = cellOf(i, cols);
    return lying ? [ox + r * s, oy + (cols - 1 - c) * s] : [ox + c * s, oy + (rows - 1 - r) * s];
  };
  if (legs) {
    const lc = limbColor(n), lx = cols === 1 ? [0.28, 0.72] : [0.5, cols - 0.5];
    for (const f of lx) out += `<rect x="${ox + f * s - s * 0.09}" y="${oy + gh - 1}" width="${s * 0.18}" height="${legH + 1}" rx="${s * 0.09}" fill="${lc}"/>`;
  }
  if (!lying) {
    const lc = limbColor(n), I = layoutInfo(n, { cols });
    const ay = oy + (rows - 1 - I.rf) * s + s * 0.45;
    out += `<path d="M${ox} ${ay}l${-s * 0.28} ${s * 0.38}M${ox + gw} ${ay}l${s * 0.28} ${s * 0.38}" stroke="${lc}" stroke-width="${s * 0.15}" stroke-linecap="round" fill="none"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = cellXY(i), ten = isTenCube(n, i), col = cubeColor(n, i);
    out += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="${s * 0.16}" fill="${col}" stroke="${ten ? TEN_RED : shade(col, 0.72)}" stroke-width="${ten ? 1.6 : 1}"/>`;
  }
  if (crown) for (const f of [0.18, 0.5, 0.82]) out += `<path d="M${ox + f * s - s * 0.14} ${oy}l${s * 0.14} ${-crown}l${s * 0.14} ${crown}z" fill="${COLORS[1]}"/>`;
  // face on the top row (lying: the end cube)
  const I = layoutInfo(n, { cols });
  let fx, fy;
  if (lying) { fx = ox + (rows - 1) * s + s / 2; fy = oy + (cols - 1) * s + s / 2; }
  else { fx = ox + ((I.topCount - 1) / 2 + 0.5) * s; fy = oy + s / 2; }
  const mood = o.mood || 'happy', ex = n === 1 ? [0] : [-0.2, 0.2];
  for (const d of ex) {
    if (mood === 'sleep') out += `<path d="M${fx + d * s - s * 0.1} ${fy - s * 0.05}q${s * 0.1} ${s * 0.09} ${s * 0.2} 0" stroke="${INK}" stroke-width="${s * 0.06}" fill="none" stroke-linecap="round"/>`;
    else out += `<ellipse cx="${fx + d * s}" cy="${fy - s * 0.08}" rx="${s * (n === 1 ? 0.17 : 0.11)}" ry="${s * (n === 1 ? 0.2 : 0.14)}" fill="#fff" stroke="${INK}" stroke-width="${s * 0.04}"/><circle cx="${fx + d * s}" cy="${fy - s * 0.04}" r="${s * (n === 1 ? 0.09 : 0.06)}" fill="${INK}"/>`;
  }
  out += `<path d="M${fx - s * 0.13} ${fy + s * 0.2}q${s * 0.13} ${s * 0.13} ${s * 0.26} 0" stroke="${INK}" stroke-width="${s * 0.06}" fill="none" stroke-linecap="round"/>`;
  if (lab) out += `<text x="${W / 2}" y="${lab * 0.82}" text-anchor="middle" font-family="Arial Rounded MT Bold, Nunito, system-ui, sans-serif" font-weight="800" font-size="${s * 0.95}" fill="${INK}">${n}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}" role="img" aria-label="${NAMES[n] || n}">${out}</svg>`;
}

// ---- silhouette (the shadow wall): polygons in cube units, y up ------------------------------
function parts(n) {
  const cols = defaultCols(n), rows = Math.ceil(n / cols), P = [];
  const rect = (x, y, w, h) => P.push([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  rect(-cols / 2, LEG, cols, rows);
  const lx = cols === 1 ? 0.24 : (cols - 1) / 2;
  rect(-lx - 0.1, 0, 0.2, LEG + 0.05); rect(lx - 0.1, 0, 0.2, LEG + 0.05);
  const I = layoutInfo(n, { cols }), armN = n === 8 ? 4 : 1;
  for (let k = 0; k < armN; k++) for (const s of [-1, 1]) {
    const sx = s * cols / 2, sy = Math.max(LEG + 0.3, LEG + I.rf + 0.45 - k * 0.8);
    const dx = s * Math.sin(0.45), dy = -Math.cos(0.45), len = 0.5, t = 0.09;
    const ex = sx + dx * len, ey = sy + dy * len, px = -dy * t, py = dx * t;
    P.push([[sx + px, sy + py], [ex + px, ey + py], [ex - px, ey - py], [sx - px, sy - py]]);
    if (n === 5 && s === 1) {
      const st = [];
      for (let q = 0; q < 10; q++) { const a = Math.PI / 2 + q * Math.PI / 5, r = q % 2 ? 0.09 : 0.21; st.push([ex + dx * 0.1 + Math.cos(a) * r, ey + dy * 0.1 + Math.sin(a) * r]); }
      P.push(st);
    }
  }
  if (n === 3) for (const x0 of [-0.32, 0, 0.32]) P.push([[x0 - 0.13, LEG + 3], [x0 + 0.13, LEG + 3], [x0, LEG + 3.34]]);
  const x0 = -cols / 2 - 0.55, x1 = cols / 2 + 0.55, y1 = LEG + rows + (n === 3 ? 0.4 : 0.1);
  return { P, x0, x1, y0: 0, y1 };
}
function shadowSvg(n, o = {}) {
  const { P, x0, x1, y1 } = parts(n), sc = o.scale || 14, pad = 0.4;
  const W = (x1 - x0 + pad * 2) * sc, H = (y1 + pad * 2) * sc;
  const X = x => ((x - x0 + pad) * sc).toFixed(1), Y = y => ((y1 + pad - y) * sc).toFixed(1);
  const d = P.map(p => 'M' + p.map(([x, y]) => X(x) + ' ' + Y(y)).join('L') + 'Z').join('');
  // a bare <path> (o.bare) to drop into a bigger picture, else a whole <svg>
  if (o.bare) return { path: `<path d="${d}" fill="${o.color || '#3a3550'}"/>`, W, H };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}"><path d="${d}" fill="${o.color || '#3a3550'}"/></svg>`;
}
// the silhouette drawn into a canvas of w x h, feet at the bottom, centred
function shadowCanvas(n, w, h, color = 'rgba(40,36,70,.82)') {
  const c = mkCanvas(w, h), x = c.getContext('2d');
  const { P, x0, x1, y1 } = parts(n);
  const sc = Math.min(w * 0.8 / (x1 - x0), h * 0.86 / y1);
  x.fillStyle = color;
  x.beginPath();
  for (const p of P) p.forEach(([px, py], j) => { const X = w / 2 + px * sc, Y = h - h * 0.05 - py * sc; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); });
  x.fill('nonzero');
  return c;
}

window.NUMBER_FRIENDS = {
  LEG, COLORS, LIMB, RAINBOW, TEN_RED, NAMES, STYLE, MOODS, INK,
  cubeColor, isTenCube, limbColor, defaultCols, shade, layoutInfo, cubePos,
  friend, setMood, place, morph, rest, tuck, walk, wave, cheer, faceTex,
  icon, parts, shadowSvg, shadowCanvas
};
})();
