// HARBOR CITY: shared 3D kit (ES module).
// Materials, geometry helpers, canvas textures, particle sprays and the
// `bake()` step that merges a model's static parts into a few meshes.
//
// Units: 1 unit ≈ 5 m for buildings and road vehicles. Ships, planes and the
// big skyline are compressed (like a real pop-up), so a car is ~0.9 long and
// a cruise ship ~9.
// Plain script (not an ES module) so the book also opens from file://.
// three.js comes from assets/vendor/three/three.global.min.js as window.THREE.
(function () {
'use strict';
const THREE = window.THREE;
const { mergeGeometries, RoundedBoxGeometry } = THREE;

function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const rand = seeded(11);

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
// grey noise with faint vertical streaks: a roughness map that reads as wear
function noiseTex(size, lo, hi, streak) {
  const [c, g] = canvas(size, size);
  const img = g.createImageData(size, size), r = seeded(size + lo);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    let v = lo + r() * (hi - lo);
    if (streak) v += Math.sin(x * 0.4 + r() * 0.5) * 12;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = clamp(v, 0, 255);
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = tex(c, { repeat: true, srgb: false });
  t.repeat.set(2, 2);
  return t;
}
const grime = noiseTex(128, 140, 235, true);

// lettering / decals on a transparent or solid canvas
function labelTex(text, { w = 512, h = 128, fg = '#fff', bg = null, font, pad = 0 } = {}) {
  const [c, g] = canvas(w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // shrink the font until the whole text fits (long signs were cut off)
  let size = Math.round(h * 0.6);
  const face = f => font ? font.replace(/\d+px/, f + 'px') : `bold ${f}px "Helvetica Neue", Arial, sans-serif`;
  g.font = face(size);
  while (size > 8 && g.measureText(text).width > w * 0.92) { size -= 2; g.font = face(size); }
  g.fillText(text, w / 2, h / 2 + pad);
  return tex(c, { aniso: 8 });
}
function decal(texture, o = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({
    map: texture, transparent: true, roughness: 0.5, metalness: 0.1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  }, o));
}

// soft round sprite (glow, smoke, spray)
function softDot(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 64) {
  const [c, g] = canvas(size, size);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return tex(c);
}

// --- materials ----------------------------------------------------------
const cache = new Map();
function paint(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (cache.has(key)) return cache.get(key);
  // `coat: true` = car paint: a clear lacquer layer over the colour, which is
  // what makes real vehicles read as painted metal rather than plastic
  const { coat, ...rest } = o;
  const m = coat && TIER > 0
    ? new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.42, metalness: 0.35, roughnessMap: grime,
      clearcoat: 0.8, clearcoatRoughness: 0.18 }, rest))
    : new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0.15, roughnessMap: grime }, rest));
  cache.set(key, m);
  return m;
}
// soft contact shadow texture (the dark blur right under a vehicle)
let SHADOW_TEX = null;
function contactShadowTex() {
  if (SHADOW_TEX) return SHADOW_TEX;
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(20,16,10,.55)'); gr.addColorStop(0.55, 'rgba(20,16,10,.3)'); gr.addColorStop(1, 'rgba(20,16,10,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  SHADOW_TEX = tex(c);
  return SHADOW_TEX;
}
const SHADOW_MAT = () => new THREE.MeshBasicMaterial({ map: contactShadowTex(), transparent: true, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
let shadowMat = null;
function contactShadow(group, pad = 1.25) {
  const b = new THREE.Box3().setFromObject(group);
  if (b.isEmpty()) return;
  const sx = (b.max.x - b.min.x) * pad, sz = (b.max.z - b.min.z) * pad;
  if (!shadowMat) shadowMat = SHADOW_MAT();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz).rotateX(-Math.PI / 2), shadowMat);
  m.position.set((b.min.x + b.max.x) / 2, 0.012, (b.min.z + b.max.z) / 2);
  m.renderOrder = -1;
  m.userData.solo = true;
  group.add(m);
}
// a light: its own material so it can blink / glow at night independently
function lamp(color, intensity = 0.2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
}
const M = {
  steel:   paint(0xa9aeb4, { metalness: 0.85, roughness: 0.35 }),
  chrome:  paint(0xd9dde2, { metalness: 1, roughness: 0.16, roughnessMap: null }),
  iron:    paint(0x3a3c40, { metalness: 0.6, roughness: 0.6 }),
  dark:    paint(0x24262a, { metalness: 0.3, roughness: 0.62 }),
  black:   paint(0x121314, { metalness: 0.2, roughness: 0.5 }),
  rubber:  paint(0x1a1a1c, { metalness: 0, roughness: 0.92, roughnessMap: null }),
  track:   paint(0x2c2a28, { metalness: 0.4, roughness: 0.85 }),
  glass:   paint(0x2a3b48, { metalness: 0.9, roughness: 0.04, roughnessMap: null, envMapIntensity: 1.8 }),
  white:   paint(0xebebe6, { roughness: 0.42 }),
  offwhite: paint(0xdcd8cc, { roughness: 0.5 }),
  grey:    paint(0x8d9096, { roughness: 0.55 }),
  concrete: paint(0xb3ada2, { roughness: 0.9, metalness: 0 }),
  yellow:  paint(0xe8ac10, { roughness: 0.48 }),      // construction-machine yellow
  red:     paint(0xb3201a, { roughness: 0.38 }),       // fire red
  orange:  paint(0xe8641c, { roughness: 0.45 }),
  wood:    paint(0x6b4a2e, { roughness: 0.85, metalness: 0 }),
  sand:    paint(0xc9a66b, { roughness: 1, metalness: 0, roughnessMap: null }),
  soil:    paint(0x7a5a3c, { roughness: 1, metalness: 0, roughnessMap: null }),
  gravel:  paint(0x8f877c, { roughness: 1, metalness: 0, roughnessMap: null }),
  skin:    paint(0xd9a882, { roughness: 0.7, metalness: 0 })
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
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, r == null ? Math.min(w, h, d) * 0.12 : r);
const cylY = (r, h, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, h, seg);
const cylX = (r, len, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, len, seg).rotateZ(-Math.PI / 2);
const cylZ = (r, len, seg = 16, r2 = r) => new THREE.CylinderGeometry(r2, r, len, seg).rotateX(Math.PI / 2);
const sphere = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);

// side profile (x along the length, y up) extruded across the width (z),
// centred on z. The quickest way to get believable car / cab / hull shapes.
function prof(pts, width, bevel = 0) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const depth = Math.max(0.001, width - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.6,
    bevelSegments: 2, curveSegments: 6
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
// plan shape (x, z) extruded upward by h: decks, wings, hulls seen from above
function plan(pts, h, bevel = 0) {
  const g = prof(pts.map(([x, z]) => [x, -z]), h, bevel);
  g.rotateX(-Math.PI / 2);          // extrusion axis z -> y
  g.translate(0, h / 2, 0);
  return g;
}

// a named moving part (kept separate by bake)
function part(name, parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name; g.userData.part = true;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// Wheel: a lathed tyre with rounded shoulders and a tread texture, and a rim
// face (spokes or a steel disc, wheel nuts, a dark gap to the tyre) each side.
let TREAD = null;
function treadMat() {
  if (TREAD) return TREAD;
  const [c, g] = canvas(16, 128);
  g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, 16, 128);
  for (let y = 0; y < 128; y += 6) { g.fillStyle = '#0e0e0f'; g.fillRect(3, y, 10, 2); }
  const t = tex(c, { repeat: true }); t.repeat.set(1, 3);
  TREAD = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  return TREAD;
}
const RIMS = {};
function rimMat(kind) {
  if (RIMS[kind]) return RIMS[kind];
  const [c, g] = canvas(128, 128);
  const C = 64;
  g.fillStyle = '#0d0d0e'; g.fillRect(0, 0, 128, 128);
  const base = kind === 'dark' ? '#3a3c40' : '#c7ccd2';
  const shade = kind === 'dark' ? '#222326' : '#8d9298';
  g.fillStyle = base; g.beginPath(); g.arc(C, C, 58, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#16171a';
  if (kind === 'steel') {        // trucks and machines: steel disc with hand-holes
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.arc(C + Math.cos(a) * 38, C + Math.sin(a) * 38, 7, 0, Math.PI * 2); g.fill(); }
  } else {                       // cars: five spokes
    for (let i = 0; i < 5; i++) {
      const a0 = i * Math.PI * 2 / 5 + 0.28, a1 = a0 + Math.PI * 2 / 5 - 0.56;
      g.beginPath(); g.moveTo(C + Math.cos(a0) * 20, C + Math.sin(a0) * 20);
      g.arc(C, C, 52, a0, a1); g.lineTo(C + Math.cos(a1) * 20, C + Math.sin(a1) * 20); g.closePath(); g.fill();
    }
  }
  g.fillStyle = shade; g.beginPath(); g.arc(C, C, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e2e5e8';
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; g.beginPath(); g.arc(C + Math.cos(a) * 10, C + Math.sin(a) * 10, 2.2, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(C, C, 57, 0, Math.PI * 2); g.stroke();
  RIMS[kind] = new THREE.MeshStandardMaterial({ map: tex(c), metalness: 0.75, roughness: 0.32 });
  return RIMS[kind];
}
function tyreGeo(r, w) {
  const s = Math.min(r * 0.22, w * 0.3), pts = [], ri = r * 0.68;
  pts.push(new THREE.Vector2(ri, -w / 2));
  for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - s + Math.cos(a) * s, -w / 2 + s + Math.sin(a) * s)); }
  for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - s + Math.cos(a) * s, w / 2 - s + Math.sin(a) * s)); }
  pts.push(new THREE.Vector2(ri, w / 2));
  return new THREE.LatheGeometry(pts, 22).rotateX(Math.PI / 2);
}
function wheel(r, w, parent, x, y, z, rim = M.steel) {
  const g = new THREE.Group();
  mesh(tyreGeo(r, w), treadMat(), 0, 0, 0, g);
  const kind = rim === M.dark ? 'dark' : r > 0.095 ? 'steel' : 'alloy';
  const face = rimMat(kind);
  [-1, 1].forEach(s => {
    const d = mesh(new THREE.CircleGeometry(r * 0.7, 20), face, 0, 0, s * (w / 2 - 0.004), g);
    d.rotation.y = s > 0 ? 0 : Math.PI;
  });
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// Merge every static mesh into one mesh per material, per moving part. A
// model built from 80 little boxes becomes ~6 draw calls. Meshes flagged
// userData.keep (blinking lights, decals with their own material) stay too,
// but are merged by material like the rest.
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
      // keep any child parts that hung off a merged mesh
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
  // drop empty helper groups
  root.userData.parts = parts;
  return root;
}

// --- particles ------------------------------------------------------------
// A small pooled particle system: water spray, smoke, sparks, fireworks.
const DOT = softDot();
class Spray {
  constructor(parent, { count = 160, size = 0.14, color = 0xffffff, opacity = 0.85,
    gravity = -6, life = 1.4, additive = false, grow = 0, drag = 0 } = {}) {
    this.n = count; this.gravity = gravity; this.life = life; this.grow = grow; this.drag = drag;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.age = new Float32Array(count).fill(1e9);
    this.col = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size, map: DOT, color, transparent: true, opacity,
      depthWrite: false, vertexColors: true, sizeAttenuation: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    parent.add(this.points);
    this.next = 0; this.acc = 0;
    this.c = new THREE.Color();
  }
  // emit one particle at p (Vector3) with velocity v (Vector3)
  emit(p, v, color) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.c.set(color == null ? 0xffffff : color);
    this.col.set([this.c.r, this.c.g, this.c.b], i * 3);
    this.age[i] = 0;
  }
  // stream: emit `rate` per second from p along dir with jitter
  stream(dt, rate, p, dir, speed, jitter = 0.15, color) {
    this.acc += rate * dt;
    const v = new THREE.Vector3();
    while (this.acc >= 1) {
      this.acc -= 1;
      v.copy(dir).multiplyScalar(speed * (0.85 + Math.random() * 0.3));
      v.x += (Math.random() - 0.5) * jitter * speed;
      v.y += (Math.random() - 0.5) * jitter * speed;
      v.z += (Math.random() - 0.5) * jitter * speed;
      this.emit(p, v, color);
    }
  }
  update(dt) {
    const { pos, vel, age, n } = this;
    const k = Math.pow(1 - this.drag, dt * 60);
    let alive = false;
    for (let i = 0; i < n; i++) {
      if (age[i] > this.life) { pos[i * 3 + 1] = -999; continue; }
      alive = true;
      age[i] += dt;
      vel[i * 3 + 1] += this.gravity * dt;
      vel[i * 3] *= k; vel[i * 3 + 1] *= k; vel[i * 3 + 2] *= k;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.02 && this.gravity < 0) age[i] = 1e9;   // hit the page
    }
    this.points.visible = alive;
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
  clear() { this.age.fill(1e9); }
}

window.CITY = Object.assign(window.CITY || {}, {
  THREE, seeded, rand, TIER, clamp, lerp, ease, easeOut, easeIn, seg, canvas, tex, noiseTex, grime,
  labelTex, decal, softDot, paint, lamp, M, mesh, box, rbox, cylY, cylX, cylZ, sphere, prof, plan,
  part, wheel, bake, Spray, contactShadow
});
})();
