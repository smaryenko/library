// MY DAY: shared 3D kit. Materials, geometry helpers, canvas textures,
// instancing and the `bake()` step that merges a model's static parts into a
// few meshes. Helpers copied from books/city/assets/js/kit.js (this book does
// not load the city's files).
//
// Units: 1 unit ≈ 1 m. The boy is ~1.05 tall, a room 2.6 high. The town is a
// toy diorama on a 46 × 32 board (x -23..23, z -16..16, y up, the near edge
// of the board at +z).
// Plain script (not an ES module) so the book also opens from file://.
// three.js comes from assets/vendor/three/three.global.min.js as window.THREE.
(function () {
'use strict';
const THREE = window.THREE;
if (!THREE) { window.MYDAY = { THREE: null }; return; }
const { mergeGeometries, RoundedBoxGeometry } = THREE;

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const rand = seeded(17);

// quality tier: 0 low (small/old phones), 1 phones/tablets, 2 desktop
const TIER = (() => {
  const small = Math.min(screen.width, screen.height) < 820;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (small && (cores <= 4 || mem <= 3)) return 0;
  return small ? 1 : 2;
})();

// --- easing / timing ----------------------------------------------------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
// progress of t inside [a, b], eased (0 before, 1 after)
const seg = (t, a, b, f = ease) => f(clamp((t - a) / (b - a)));
// up and back down inside [a, b] (0 outside), smooth
const bump = (t, a, b) => { const u = clamp((t - a) / (b - a)); return Math.sin(u * Math.PI); };
// shortest signed angle from a to b
const dAngle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// --- canvas textures ----------------------------------------------------
function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { repeat = false, srgb = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}
// grey noise: a roughness map that reads as handled, painted wood / card
function noiseTex(size, lo, hi) {
  const [c, g] = canvas(size, size);
  const img = g.createImageData(size, size), r = seeded(size + lo);
  for (let i = 0; i < size * size; i++) {
    const v = lo + r() * (hi - lo);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = clamp(v, 0, 255);
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = tex(c, { repeat: true, srgb: false });
  t.repeat.set(2, 2);
  return t;
}
const grime = noiseTex(128, 150, 235);

// a pattern drawn by fn(g, w, h) on a small repeating canvas
function patternTex(w, h, fn, rep = [1, 1]) {
  const [c, g] = canvas(w, h);
  fn(g, w, h);
  const t = tex(c, { repeat: true });
  t.repeat.set(rep[0], rep[1]);
  return t;
}

// lettering on a transparent or solid canvas
function labelTex(text, { w = 512, h = 128, fg = '#fff', bg = null, font } = {}) {
  const [c, g] = canvas(w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = Math.round(h * 0.6);
  const face = f => font ? font.replace(/\d+px/, f + 'px') : `bold ${f}px "Helvetica Neue", Arial, sans-serif`;
  g.font = face(size);
  while (size > 8 && g.measureText(text).width > w * 0.92) { size -= 2; g.font = face(size); }
  g.fillText(text, w / 2, h / 2);
  return tex(c, { aniso: 8 });
}
function decal(texture, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({
    map: texture, transparent: true, roughness: 0.6, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  }, o));
}
// soft round sprite (glow, stars, bubbles)
function softDot(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 64) {
  const [c, g] = canvas(size, size);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return tex(c);
}

// --- materials ----------------------------------------------------------
// The toy-diorama look: painted wood and card, low metalness, a little
// roughness variation from `grime`.
const cache = new Map();
function paint(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0.05, roughnessMap: grime }, o));
  cache.set(key, m);
  return m;
}
// a light: its own material so it can glow at night independently
function lamp(color, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.35 });
}
// a part that fades (cutaway front walls, roofs): its own material, never cached
function fader(color, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0, roughnessMap: grime,
    transparent: true, opacity: 1 }, o));
}

const M = {
  white:   paint(0xf1eee6, { roughness: 0.55 }),
  cream:   paint(0xeee2c6, { roughness: 0.7 }),
  grey:    paint(0x8d9096, { roughness: 0.6 }),
  dark:    paint(0x2b2d31, { roughness: 0.6 }),
  black:   paint(0x141416, { roughness: 0.45 }),
  chrome:  paint(0xd4d8dc, { metalness: 0.9, roughness: 0.2, roughnessMap: null }),
  glass:   paint(0x9fc4d6, { metalness: 0.2, roughness: 0.08, roughnessMap: null, transparent: true, opacity: 0.45 }),
  wood:    paint(0xb07d4f, { roughness: 0.75 }),
  darkWood: paint(0x6b4a2e, { roughness: 0.8 }),
  red:     paint(0xd0473a, { roughness: 0.55 }),
  orange:  paint(0xe88a2c, { roughness: 0.55 }),
  yellow:  paint(0xf0c23b, { roughness: 0.55 }),
  green:   paint(0x5fa04e, { roughness: 0.7 }),
  leaf:    paint(0x4f8f3f, { roughness: 0.85 }),
  leaf2:   paint(0x6aa84a, { roughness: 0.85 }),
  blue:    paint(0x3f7fc0, { roughness: 0.55 }),
  sky:     paint(0x8cc4e8, { roughness: 0.55 }),
  pink:    paint(0xe98aa6, { roughness: 0.6 }),
  purple:  paint(0x8a6cc0, { roughness: 0.6 }),
  sand:    paint(0xe2c98f, { roughness: 1, roughnessMap: null }),
  board:   paint(0x8a6a48, { roughness: 0.8 }),          // the diorama base's edge
  roof:    paint(0xb5543c, { roughness: 0.75 }),
  water:   paint(0x9ad3ea, { roughness: 0.15, metalness: 0.05, roughnessMap: null, transparent: true, opacity: 0.85 }),
  rubber:  paint(0x1c1c1e, { roughness: 0.9, roughnessMap: null }),
  skin:    paint(0xe7b48f, { roughness: 0.7 })
};

// --- geometry -----------------------------------------------------------
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, r == null ? Math.min(w, h, d) * 0.15 : r);
const cylY = (r, h, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg);
const cylX = (r, len, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, len, seg).rotateZ(-Math.PI / 2);
const cylZ = (r, len, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, len, seg).rotateX(Math.PI / 2);
const sphere = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
const capsule = (r, len, seg = 8) => new THREE.CapsuleGeometry(r, len, 4, seg);

// an axis-aligned box placed by its min corner + size (walls, floors)
function slab(parent, mat, x0, y0, z0, w, h, d, round = 0) {
  const g = round ? rbox(w, h, d, round) : box(w, h, d);
  return mesh(g, mat, x0 + w / 2, y0 + h / 2, z0 + d / 2, parent);
}

// a named moving part (kept separate by bake)
function part(name, parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name; g.userData.part = true;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// Merge every static mesh into one mesh per material, per moving part.
// Meshes flagged userData.solo (faders, glows) stay as they are.
function bake(root) {
  root.updateMatrixWorld(true);
  const nodes = [];
  root.traverse(o => { if (o === root || o.userData.part) nodes.push(o); });
  const parts = {};
  for (const node of nodes) {
    if (node !== root) parts[node.name] = node;
    const inv = new THREE.Matrix4().copy(node.matrixWorld).invert();
    const buckets = new Map(), kill = [];
    const walk = o => {
      for (const c of o.children) {
        if (c.userData.part) continue;
        if (c.isMesh && !c.isInstancedMesh && !c.userData.solo) {
          let g = c.geometry.clone();
          if (g.index) g = g.toNonIndexed();
          for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
          if (!g.attributes.uv) {
            g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
          }
          g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
          if (!buckets.has(c.material)) buckets.set(c.material, []);
          buckets.get(c.material).push(g);
          kill.push(c);
        }
        walk(c);
      }
    };
    walk(node);
    kill.forEach(k => {
      [...k.children].forEach(ch => node.attach(ch));
      k.removeFromParent();
    });
    for (const [mat, geos] of buckets) {
      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      if (!merged) continue;
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = m.receiveShadow = true;
      node.add(m);
    }
  }
  root.userData.parts = parts;
  return root;
}

// many copies of one geometry + material in one draw call.
// items: [{ x, y, z, ry, s }] (s may be a number or [sx, sy, sz])
function instanced(parent, geo, mat, items, { shadow = true } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, items.length);
  const o = new THREE.Object3D();
  items.forEach((it, i) => {
    o.position.set(it.x || 0, it.y || 0, it.z || 0);
    o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    const s = it.s == null ? 1 : it.s;
    if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.setScalar(s);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  });
  im.castShadow = shadow; im.receiveShadow = true;
  parent.add(im);
  return im;
}

// soft contact shadow under a thing (the dark blur right under it)
let SHADOW_TEX = null, shadowMat = null;
function contactShadowTex() {
  if (SHADOW_TEX) return SHADOW_TEX;
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(20,16,10,.5)'); gr.addColorStop(0.55, 'rgba(20,16,10,.25)'); gr.addColorStop(1, 'rgba(20,16,10,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  SHADOW_TEX = tex(c);
  return SHADOW_TEX;
}
function blob(parent, w, d, x = 0, y = 0.012, z = 0) {
  if (!shadowMat) shadowMat = new THREE.MeshBasicMaterial({ map: contactShadowTex(), transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), shadowMat);
  m.position.set(x, y, z);
  m.renderOrder = -1;
  m.userData.solo = true;
  parent.add(m);
  return m;
}

window.MYDAY = Object.assign(window.MYDAY || {}, {
  THREE, seeded, rand, TIER, clamp, lerp, ease, easeOut, easeIn, seg, bump, dAngle,
  canvas, tex, noiseTex, grime, patternTex, labelTex, decal, softDot,
  paint, lamp, fader, M, mesh, box, rbox, cylY, cylX, cylZ, sphere, capsule, slab,
  part, bake, instanced, blob
});
})();
