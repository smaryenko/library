// HARBOR CITY: the pop-up world on the open book, and each page's stop.
//
// buildWorld(scene) returns:
//   chunks  – build steps, run one per frame so the book opens fast
//   stops   – { key: { cam, night, play(t) -> done, reset(), active? } }
//   update(dt, time, activeKey) – ambient life: water, smoke, gulls, traffic…
//   night   – materials the scene brightens at dusk
//
// The layout follows print.js LAYOUT: sea + port on the far left, the
// construction site in front, town and skyline in the middle-back, main road
// across, hospital, race track front-right, airport back-right.
(function () {
'use strict';
const {
  THREE, M, paint, lamp, mesh, box, rbox, cylY, cylX, cylZ, sphere, prof, part, bake, canvas, tex,
  labelTex, decal, softDot, seeded, clamp, lerp, ease, easeIn, easeOut, seg, Spray, TIER,
  V, drawSpread, LAYOUT: L
} = window.CITY;
const { mergeGeometries } = THREE;

const V3 = THREE.Vector3;
const QUAY_Y = 0.12;

// --- helpers -----------------------------------------------------------------
function place(o, x, z, ry = 0, y = 0) { o.position.set(x, y, z); o.rotation.set(0, ry, 0); return o; }
function spin(o, ds) { (o.userData.wheels || []).forEach(w => { w.rotation.z -= ds / (w.userData.r || 0.1); }); }
// heading for a +x-forward model moving along (dx, dz)
const yaw = (dx, dz) => Math.atan2(-dz, dx);

class Path {
  constructor(pts, closed = false) {
    this.c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new V3(x, 0, z)), closed, 'centripetal');
    this.len = this.c.getLength();
  }
  // put o at distance s; returns distance moved since last call (for wheels)
  at(o, s, y = 0, reverse = false) {
    const u = this.c.closed ? ((s / this.len) % 1 + 1) % 1 : clamp(s / this.len);
    const p = this.c.getPointAt(u), t = this.c.getTangentAt(u);
    const prev = o.userData.pathS == null ? s : o.userData.pathS;
    o.position.set(p.x, y, p.z);
    o.rotation.set(0, reverse ? yaw(-t.x, -t.z) : yaw(t.x, t.z), 0);
    o.userData.pathS = s;
    spin(o, reverse ? -(s - prev) : s - prev);
  }
}

// Batches static geometry by material (buildings, scenery) into a few meshes.
class Batch {
  constructor() { this.m = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = 1, sz = 1) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(sx, sy, sz)));
    if (!this.m.has(mat)) this.m.set(mat, []);
    this.m.get(mat).push(g);
  }
  flush(parent, shadow = true) {
    for (const [mat, geos] of this.m) {
      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      const m = new THREE.Mesh(merged, mat);
      m.castShadow = shadow; m.receiveShadow = true;
      parent.add(m);
    }
    this.m.clear();
  }
}

// --- facades -------------------------------------------------------------------
// One 256px tile = 4 bays x 4 storeys. Windows come with an emissive map with
// a random mix of lit / dark rooms for the evening page.
const BAY = 0.7, STOREY = 0.6;
const facadeMats = [];
function facade({ wall, glass = ['#9db4c4', '#2b3b4a'], frame = '#ece8de', style = 'punched', seed = 1, metal = 0, rough = 0.85, lit = 0.55, brick = false }) {
  const [c, g] = canvas(256, 256), [e, ge] = canvas(256, 256);
  const r = seeded(seed);
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  if (brick) {                     // brick courses with mortar and colour variation
    for (let yy = 0; yy < 256; yy += 4) for (let xx = (yy / 4) % 2 ? -4 : 0; xx < 256; xx += 9) {
      g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,220'},${0.04 + r() * 0.08})`; g.fillRect(xx, yy, 8, 3);
    }
    g.fillStyle = 'rgba(230,220,205,.12)';
    for (let yy = 3; yy < 256; yy += 4) g.fillRect(0, yy, 256, 1);
  }
  for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.05)'; g.fillRect(r() * 256, r() * 256, 2, 2); }
  // rain streaks and a darker band at the base: weathering
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,.035)'; g.fillRect(r() * 256, r() * 200, 2 + r() * 3, 30 + r() * 50); }
  ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 256);
  const glassFill = (x, y, w, h) => {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, glass[0]); gr.addColorStop(1, glass[1]);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  };
  for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) {
    const x = bx * 64, y = fy * 64, on = r() < lit;
    ge.fillStyle = on ? `rgb(255,${200 + r() * 40 | 0},${120 + r() * 60 | 0})` : '#050403';
    if (style === 'punched') {
      // stone lintel, painted frame, sash bars, a reflection, curtains in
      // some rooms, a stone sill with its shadow
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + 12, y + 8, 40, 5);
      g.fillStyle = frame; g.fillRect(x + 15, y + 13, 34, 38);
      glassFill(x + 18, y + 16, 28, 32);
      if (r() < 0.35) { g.fillStyle = r() < 0.5 ? 'rgba(230,220,200,.55)' : 'rgba(160,60,50,.45)'; g.fillRect(x + 18, y + 16, 7, 32); g.fillRect(x + 39, y + 16, 7, 32); }
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.beginPath(); g.moveTo(x + 18, y + 16); g.lineTo(x + 30, y + 16); g.lineTo(x + 18, y + 34); g.fill();
      g.fillStyle = frame; g.fillRect(x + 31, y + 16, 2, 32); g.fillRect(x + 18, y + 30, 28, 2);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 12, y + 51, 40, 4);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x + 13, y + 55, 38, 2);
      ge.fillRect(x + 18, y + 16, 28, 32);
    } else if (style === 'ribbon') {
      glassFill(x, y + 16, 64, 30);
      g.fillStyle = frame; g.fillRect(x, y + 16, 3, 30);
      ge.fillRect(x + 3, y + 16, 61, 30);
    } else if (style === 'curtain') {
      glassFill(x + 1, y + 1, 62, 62);
      g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.08})`; g.fillRect(x + 1, y + 1, 62, 62);
      g.fillStyle = frame; g.fillRect(x, y, 64, 2); g.fillRect(x, y, 2, 64);
      ge.fillRect(x + 2, y + 2, 60, 60);
    } else if (style === 'shed') {
      for (let i = 0; i < 64; i += 6) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + i, y, 2, 64); }
      if (fy === 3) { glassFill(x + 8, y + 6, 48, 10); ge.fillRect(x + 8, y + 6, 48, 10); }
    }
  }
  const map = tex(c, { repeat: true }), em = tex(e, { repeat: true });
  const m = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffd08a, emissiveIntensity: 0,
    roughness: rough, metalness: metal });
  facadeMats.push(m);
  return m;
}
// ground-floor shopfront strip: shop windows with goods, a door, a sign band
function shopMat() {
  const [c, g] = canvas(512, 64), [e, ge] = canvas(512, 64);
  const r = seeded(91);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, 512, 64);
  const signs = ['#23395c', '#2f5e4a', '#8a2b2b', '#3a3c40', '#6b4a2e'];
  for (let i = 0; i < 4; i++) {
    const x = i * 128;
    g.fillStyle = '#2a2b2e'; g.fillRect(x, 0, 128, 64);
    g.fillStyle = signs[i % signs.length]; g.fillRect(x + 2, 0, 124, 13);
    g.fillStyle = '#e9e2cf'; for (let k = 0; k < 6; k++) g.fillRect(x + 18 + k * 15, 4, 10, 4);
    const gr = g.createLinearGradient(0, 16, 0, 62);
    gr.addColorStop(0, '#9fb6c6'); gr.addColorStop(1, '#2f3d48');
    g.fillStyle = gr; g.fillRect(x + 6, 16, 80, 44);
    for (let k = 0; k < 8; k++) { g.fillStyle = `hsl(${r() * 360},40%,${45 + r() * 20}%)`; g.fillRect(x + 10 + k * 9, 44 - r() * 10, 7, 14); }
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(x + 6, 16); g.lineTo(x + 40, 16); g.lineTo(x + 6, 50); g.fill();
    g.fillStyle = '#4a2e1c'; g.fillRect(x + 94, 18, 26, 46);           // door
    g.fillStyle = '#9fb6c6'; g.fillRect(x + 98, 22, 18, 20);
    ge.fillStyle = '#ffd59a'; ge.fillRect(x + 6, 16, 80, 44);
  }
  const m = new THREE.MeshStandardMaterial({ map: tex(c, { repeat: true }), emissiveMap: tex(e, { repeat: true }), emissive: 0xffd08a, emissiveIntensity: 0, roughness: 0.4, metalness: 0.2 });
  facadeMats.push(m);
  return m;
}
// box with facade UVs scaled to its size (roof + floor faces get plain wall)
function facadeBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, span = [d, d, 0, 0, w, w];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f === 2 || f === 3) { uv.setXY(i, 0.02, 0.02); continue; }
    uv.setXY(i, uv.getX(i) * span[f] / (BAY * 4), uv.getY(i) * h / (STOREY * 4));
  }
  return g;
}

function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const chunks = [];
  const stops = {};
  const updaters = [];         // (dt, t, active) => void
  const night = { facades: facadeMats, lamps: [...V.NIGHT_LAMPS], street: null, beam: null, water: null };
  const blinkers = [];         // { mats, rate, always }
  const smokers = [];          // { obj, local }
  const W = {};                // named objects for the stops

  // --- shared particles ---
  const smoke = new Spray(root, { count: TIER ? 240 : 120, size: 0.5, color: 0x9a9896, opacity: 0.28, gravity: 0.5, life: 3.2, drag: 0.02 });
  const steam = new Spray(root, { count: 120, size: 0.6, color: 0xffffff, opacity: 0.55, gravity: 1.2, life: 1.6, drag: 0.04 });
  const water = new Spray(root, { count: TIER ? 900 : 450, size: 0.13, color: 0xdcefff, opacity: 0.8, gravity: -5, life: 1.8, drag: 0.004 });
  const dirt = new Spray(root, { count: 200, size: 0.09, color: 0x6e5236, opacity: 1, gravity: -6, life: 1.2 });
  const fire = new Spray(root, { count: 260, size: 0.6, color: 0xff7a1a, opacity: 0.9, gravity: 1.6, life: 0.75, additive: true, drag: 0.02 });
  const sparks = new Spray(root, { count: 700, size: 0.22, opacity: 1, gravity: -1.6, life: 1.7, additive: true, drag: 0.02 });
  const concrete = new Spray(root, { count: 160, size: 0.08, color: 0x9a968e, opacity: 1, gravity: -5, life: 0.9 });
  [smoke, steam, water, dirt, fire, sparks, concrete].forEach(s => updaters.push(dt => s.update(dt)));

  // =========================================================================
  // CHUNK 1: the book and its printed pages, the water
  chunks.push(() => {
    const cv = drawSpread();
    const full = tex(cv, { aniso: 8 });
    // fine detail on top of the printed spread (which is only 48 px per unit,
    // so up close it went soft and blocky): a tileable layer of short blades /
    // grain, used as a bump map and as a light/dark multiply. The multiply is
    // strongest where the print is green, so roads only get a faint grain.
    const [gc, gg] = canvas(256, 256), gr0 = seeded(91);
    gg.fillStyle = '#808080'; gg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5200; i++) {
      const x = gr0() * 256, y = gr0() * 256, len = 3 + gr0() * 7, a = -Math.PI / 2 + (gr0() - 0.5) * 1.2;
      const v = Math.floor(70 + gr0() * 120);
      gg.strokeStyle = `rgb(${v},${v},${v})`; gg.lineWidth = 0.6 + gr0() * 0.9;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        gg.beginPath(); gg.moveTo(x + ox, y + oy); gg.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len); gg.stroke();
      }
    }
    const grain = tex(gc, { repeat: true, srgb: false, aniso: 8 });
    const pageMat = new THREE.MeshStandardMaterial({ map: full, roughness: 0.92, metalness: 0,
      bumpMap: grain, bumpScale: 0.4 });
    grain.repeat.set(140, 90);     // the page UVs span u 0..0.5 per 20 units, v 0..1 per 26
    pageMat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        {
          float gd = texture2D(bumpMap, vBumpMapUv).r;
          float gd2 = texture2D(bumpMap, vBumpMapUv * 0.23 + 0.31).r;   // larger clumps
          vec3 c = diffuseColor.rgb;
          float green = clamp((c.g - max(c.r, c.b)) * 8.0, 0.0, 1.0);
          float k = mix(0.08, 0.38, green);
          diffuseColor.rgb *= 1.0 + (gd - 0.5) * k * 2.0 + (gd2 - 0.5) * k;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 1.04, 0.86), green * (gd2 - 0.3));
        }`);
    };
    // paper block with stacked page edges, cloth cover under it
    const [ec, eg] = canvas(16, 64);
    eg.fillStyle = '#f2ead6'; eg.fillRect(0, 0, 16, 64);
    for (let i = 0; i < 64; i += 3) { eg.fillStyle = 'rgba(120,100,70,.18)'; eg.fillRect(0, i, 16, 1); }
    const edge = new THREE.MeshStandardMaterial({ map: tex(ec, { repeat: true }), roughness: 0.95 });
    const block = mesh(box(40.4, 0.5, 26.4), edge, 0, -0.27, 0, root);
    block.castShadow = false;
    const cover = mesh(rbox(41.4, 0.3, 27.2, 0.12), paint(0x6b2a24, { roughness: 0.8 }), 0, -0.62, 0, root);
    cover.castShadow = false;
    const pm = pageMat;
    [0, 1].forEach(side => {
      const geo = new THREE.PlaneGeometry(20, 26).rotateX(-Math.PI / 2);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + side * 0.5);   // one texture, two halves
      // flat, just above the paper block (a tilt toward the spine sank half of
      // each page under the block's top and washed out the middle)
      const p = mesh(geo, pm, side ? 10 : -10, 0, 0, root);
      p.castShadow = false;
    });
    // water: a satin surface with scrolling ripples over the printed sea
    const nrm = rippleNormals();
    // opaque, and exactly over the printed sea (it used to overhang the paper
    // margin, and its transparency doubled the printed waves underneath)
    // colour map: deep blue-green offshore, lighter and greener near the quay,
    // soft current streaks, and a band of churned foam along the quay wall
    const [wc, wg] = canvas(512, 512), wr = seeded(77);
    const wgr = wg.createLinearGradient(0, 0, 512, 0);
    wgr.addColorStop(0, '#0f3346'); wgr.addColorStop(0.55, '#174a5e'); wgr.addColorStop(0.92, '#25606a'); wgr.addColorStop(1, '#2f6c70');
    wg.fillStyle = wgr; wg.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 160; i++) {
      const x = wr() * 512, y = wr() * 512, rx = 30 + wr() * 120;
      const gr = wg.createRadialGradient(x, y, 0, x, y, rx);
      const col = wr() < 0.5 ? '8,30,44' : '60,110,120';
      gr.addColorStop(0, `rgba(${col},.18)`); gr.addColorStop(1, `rgba(${col},0)`);
      wg.fillStyle = gr; wg.fillRect(x - rx, y - rx, rx * 2, rx * 2);
    }
    for (let i = 0; i < 900; i++) {      // foam flecks hugging the quay, thinning out
      const d = Math.pow(wr(), 3) * 26;
      wg.fillStyle = `rgba(225,238,240,${0.5 * (1 - d / 26)})`;
      wg.fillRect(512 - 2 - d, wr() * 512, 1 + wr() * 2, 1 + wr() * 3);
    }
    const wmap = tex(wc, { aniso: 8 });
    // roughness > 0.2 spreads the sun into a soft sheen instead of pin-point
    // sparkles; the clearcoat keeps a gentle sky reflection on top
    const wm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: wmap, roughness: 0.28, metalness: 0.0,
      normalMap: nrm, normalScale: new THREE.Vector2(0.12, 0.12), clearcoat: 0.6, clearcoatRoughness: 0.18,
      specularIntensity: 1, ior: 1.33, envMapIntensity: 1.6 });
    // two ripple layers scrolling in different directions at different
    // scales, blended in the shader: real water never repeats one pattern
    const wT = { value: 0 };
    wm.onBeforeCompile = sh => {
      sh.uniforms.uWT = wT;
      sh.fragmentShader = 'uniform float uWT;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `
        vec2 wuv = vNormalMapUv;
        vec3 n1 = texture2D(normalMap, wuv + vec2(uWT * 0.012, uWT * 0.02)).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D(normalMap, wuv * 2.3 + vec2(-uWT * 0.03, uWT * 0.011)).xyz * 2.0 - 1.0;
        vec3 n3 = texture2D(normalMap, wuv * 0.37 + vec2(uWT * 0.004, -uWT * 0.006)).xyz * 2.0 - 1.0;
        // mostly the broad swell (n3) with a light touch of the small chop
        // only the broad swell plus a faint mid layer: the fine layers caught
        // the sun as thousands of white glints that read as noise from afar
        vec3 mapN = normalize(vec3(n3.xy + n1.xy * 0.25 + n2.xy * 0.0, 1.0));
        mapN.xy *= normalScale;
        normal = normalize(tbn * mapN);`);
    };
    const wx0 = -19.6, wx1 = L.quayX;
    const wmesh = mesh(new THREE.PlaneGeometry(wx1 - wx0, 25.2).rotateX(-Math.PI / 2), wm, (wx0 + wx1) / 2, 0.045, 0, root);
    wmesh.castShadow = false;
    nrm.repeat.set(3, 7);       // big, calm ripples (smaller tiles read as noise)
    // a paper edge around the sea, like the die-cut border of the page
    mesh(box(0.06, 0.08, 25.2), paint(0xe9e2cf, { roughness: 0.9 }), wx0 - 0.03, 0.04, 0, root).castShadow = false;
    [-12.63, 12.63].forEach(z => mesh(box(wx1 - wx0 + 0.06, 0.08, 0.06), paint(0xe9e2cf, { roughness: 0.9 }), (wx0 + wx1) / 2, 0.04, z, root).castShadow = false);
    // rubber fenders hanging on the quay wall
    const fen = new Batch();
    for (let z = -12.0; z < 12.4; z += 0.8) fen.add(cylZ(0.05, 0.26, 10), M.rubber, L.quayX - 0.04, 0.07, z);
    fen.flush(root);
    night.water = wm;
    updaters.push(dt => { wT.value += dt; });
    // quay slab + jetty + breakwater (3D edges, so they read as built)
    const conc = paint(0xb7b0a2, { roughness: 0.9, metalness: 0 });
    mesh(box(L.quayInner - L.quayX, QUAY_Y, 26.1), conc, (L.quayX + L.quayInner) / 2, QUAY_Y / 2, 0, root);
    mesh(box(7.7, 0.14, 0.5), conc, L.quayX - 3.8, 0.1, L.jettyZ, root);
    for (let x = -16; x < -9; x += 1.1) mesh(cylY(0.06, 0.4, 8), M.concrete, x, -0.05, L.jettyZ + 0.2, root);
    mesh(rbox(4.6, 0.3, 0.55, 0.1), paint(0x8f8a80, { roughness: 1 }), -17.7, 0.1, -12.3, root);
    // bollards along the quay
    const bol = new Batch();
    for (let z = -12.4; z < 12.6; z += 1.2) bol.add(cylY(0.05, 0.1, 8), M.dark, L.quayX + 0.18, QUAY_Y + 0.05, z);
    bol.flush(root);
  });

  // =========================================================================
  // CHUNK 2: skyline + town + landmarks (batched)
  chunks.push(() => {
    const F = {
      brick: facade({ wall: '#8a4a36', seed: 2, brick: true }),
      cream: facade({ wall: '#dccfae', seed: 3 }),
      ochre: facade({ wall: '#cf9a3e', seed: 4 }),
      rust: facade({ wall: '#ad5238', seed: 5, brick: true }),
      slate: facade({ wall: '#5f7c90', seed: 6 }),
      green: facade({ wall: '#6f8a5f', seed: 7 }),
      office: facade({ wall: '#a9a59c', style: 'ribbon', frame: '#8e8a82', seed: 8 }),
      glass: facade({ wall: '#33495e', style: 'curtain', glass: ['#a9c3d6', '#3a5a76'], frame: '#c3cbd2', seed: 9, metal: 0.55, rough: 0.22, lit: 0.45 }),
      glass2: facade({ wall: '#355a52', style: 'curtain', glass: ['#b9d2cc', '#365e58'], frame: '#c9d2cf', seed: 10, metal: 0.55, rough: 0.22, lit: 0.45 }),
      white: facade({ wall: '#eeece6', style: 'ribbon', frame: '#d0d0cc', glass: ['#b8cad6', '#41566a'], seed: 11 }),
      shed: facade({ wall: '#8f969b', style: 'shed', seed: 12, metal: 0.4, rough: 0.6 })
    };
    W.F = F;
    const roofFlat = paint(0x6d6a66, { roughness: 0.9, metalness: 0 });
    const roofTile = paint(0x8c3b2a, { roughness: 0.85, metalness: 0 });
    const roofSlate = paint(0x3d4348, { roughness: 0.8, metalness: 0.1 });
    const b = new Batch();
    const cornice = paint(0xe6e0d2, { roughness: 0.7, metalness: 0 });
    const pipe = paint(0x4a4c50, { roughness: 0.6 });
    const awnings = [0x2f5e4a, 0x8a2b2b, 0x23395c, 0xc98a1e].map(c => paint(c, { roughness: 0.8, metalness: 0 }));
    const shop = shopMat();
    const rr = seeded(77);
    // shopfront on the +z face of a building (a box on the ground floor)
    const shopfront = (x, z, w, d, ry, y0) => {
      const c = Math.cos(ry), s = Math.sin(ry);
      const off = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
      const [sx, sz] = off(0, d / 2 + 0.012);
      b.add(box(w * 0.94, 0.5, 0.02), shop, sx, y0 + 0.25, sz, ry);
      const [ax, az] = off(0, d / 2 + 0.02);
      const aw = prof([[0, 0], [0.18, -0.08], [0.18, -0.1], [0, -0.03]], w * 0.9);
      b.add(aw.rotateY(-Math.PI / 2), awnings[Math.floor(rr() * awnings.length)], ax, y0 + 0.6, az, ry);
    };
    const corner = (x, z, dx, dz, ry) => [x + dx * Math.cos(ry) + dz * Math.sin(ry), z - dx * Math.sin(ry) + dz * Math.cos(ry)];
    const building = (x, z, w, d, h, fac, roof = 'flat', ry = 0, y0 = 0, opts = {}) => {
      b.add(facadeBox(w, h, d), fac, x, y0 + h / 2, z, ry);
      // plinth and a cornice line at the top
      b.add(box(w + 0.02, 0.08, d + 0.02), M.concrete, x, y0 + 0.04, z, ry);
      b.add(box(w + 0.05, 0.05, d + 0.05), cornice, x, y0 + h - 0.025, z, ry);
      if (opts.shop) shopfront(x, z, w, d, ry, y0);
      // a drainpipe on one corner
      if (opts.pipe) {
        const [px, pz] = corner(x, z, w / 2 - 0.03, d / 2 + 0.014, ry);
        b.add(cylY(0.012, h, 6), pipe, px, y0 + h / 2, pz, 0);
      }
      if (roof === 'flat' && opts.bare) {
        b.add(box(w + 0.06, 0.06, d + 0.06), roofFlat, x, y0 + h + 0.03, z, ry);
      } else if (roof === 'flat') {
        b.add(box(w + 0.06, 0.06, d + 0.06), roofFlat, x, y0 + h + 0.03, z, ry);
        // parapet + roof plant: AC units, a stair house, sometimes a water tank
        [[0, d / 2], [0, -d / 2]].forEach(([, dz]) => b.add(box(w + 0.06, 0.08, 0.03), cornice, x, y0 + h + 0.09, z + dz, ry));
        b.add(box(w * 0.28, 0.18, d * 0.3), M.grey, x + w * 0.18, y0 + h + 0.15, z, ry);
        for (let i = 0; i < 2 + Math.floor(rr() * 3); i++) b.add(box(0.12, 0.08, 0.12), M.offwhite, x - w * 0.3 + rr() * w * 0.4, y0 + h + 0.1, z + (rr() - 0.5) * d * 0.5, ry);
        if (h > 3 && rr() < 0.4) { b.add(cylY(0.12, 0.25, 12), M.wood, x - w * 0.25, y0 + h + 0.33, z - d * 0.2); b.add(new THREE.ConeGeometry(0.13, 0.08, 12), M.dark, x - w * 0.25, y0 + h + 0.5, z - d * 0.2); }
      } else {
        const rh = Math.min(w, d) * 0.5;
        const tri = prof([[-w / 2 - 0.05, 0], [w / 2 + 0.05, 0], [0, rh]], d + 0.08);
        b.add(tri, roof === 'tile' ? roofTile : roofSlate, x, y0 + h, z, ry);
        // chimney with a cap, a dormer
        b.add(box(0.1, 0.32, 0.12), F.brick, x + w * 0.22, y0 + h + rh * 0.55, z - d * 0.2, ry);
        b.add(box(0.13, 0.03, 0.15), M.concrete, x + w * 0.22, y0 + h + rh * 0.55 + 0.17, z - d * 0.2, ry);
        if (w > 1.0) b.add(box(0.24, 0.2, 0.2), fac, x - w * 0.15, y0 + h + rh * 0.3, z + d * 0.3, ry);
      }
    };
    // downtown skyline at the back
    const r = seeded(21);
    [
      [-4.4, -11.4, 1.8, 1.6, 7.2, 'office'], [-2.2, -11.8, 1.7, 1.7, 10.5, 'glass'],
      [0.2, -11.2, 2.0, 1.9, 13.2, 'glass2'], [2.6, -11.9, 1.6, 1.6, 9.0, 'office'],
      [4.6, -11.1, 1.6, 1.5, 11.4, 'glass'], [6.2, -12.0, 1.2, 1.2, 6.0, 'office'],
      [-5.1, -9.4, 1.2, 1.2, 4.6, 'cream'], [-1.0, -9.3, 1.5, 1.0, 5.4, 'brick'],
      [1.8, -9.4, 1.4, 1.1, 4.2, 'white'], [4.3, -9.3, 1.6, 1.1, 5.8, 'office']
    ].forEach(([x, z, w, d, h, f]) => {
      building(x, z, w, d, h, F[f]);
      if (f.startsWith('glass') && h > 10) building(x, z, w * 0.66, d * 0.66, 1.8, F[f], 'flat', 0, h);   // setback crown
    });
    // spire + TV tower
    b.add(cylY(0.05, 2.2, 6, 0.01), M.steel, 0.2, 13.2 + 1.8 + 1.1, -11.2);
    b.add(cylY(0.22, 12, 12, 0.12), M.concrete, -5.65, 6, -12.4);
    b.add(sphere(0.55, 16, 10).scale(1, 0.55, 1), F.glass, -5.65, 9.8, -12.4);
    b.add(cylY(0.03, 2.2, 6, 0.01), M.white, -5.65, 13.1, -12.4);
    // old town inside the ring: rows of narrow gabled houses
    const R = L.ring, cols = ['ochre', 'rust', 'cream', 'slate', 'green', 'brick'];
    [[R.z0 + 0.95, 0], [R.z1 - 0.95, 1]].forEach(([z, row]) => {
      let x = R.x0 + 0.75;
      while (true) {
        const w = 0.8 + r() * 0.6, h = 1.8 + Math.floor(r() * 3) * 0.6;
        // stop before the ring road's inner edge (a house used to stand in the road)
        if (x + w > R.x1 - R.w / 2 - 0.15) break;
        // row 1 faces the ring road toward the main road: shops on the ground floor
        building(x + w / 2, z, w, 1.15, h, F[cols[Math.floor(r() * cols.length)]], r() < 0.6 ? 'tile' : 'slate', row === 1 ? 0 : Math.PI, 0, { shop: true, pipe: true });
        x += w + 0.04;
      }
    });
    // fire station (west end of the ring) and police station (on the main road)
    building(-4.15, -4.6, 1.6, 1.4, 1.5, F.brick);   // east of the ring road (it used to overlap the lane)
    building(-1.4, -0.45, 2.2, 1.1, 1.6, F.office);
    // harbour terminal for the cruise ship, warehouses, the burning one
    building(-7.85, -8.5, 1.7, 4.6, 1.2, F.glass, 'flat', 0, QUAY_Y);
    building(-7.85, 8.9, 1.6, 2.0, 1.25, F.shed, 'slate', Math.PI / 2, QUAY_Y);   // the one that catches fire
    // hospital
    building(4.5, 3.8, 3.0, 2.2, 2.4, F.white, 'flat', 0, 0, { bare: true });   // clear roof for the helipad
    // airport terminal + control tower + hangar
    building(10.6, -1.9, 4.4, 1.3, 1.1, F.glass, 'flat');
    // control tower, modelled on modern regional towers: a tapered round
    // concrete shaft, a flared neck, an outward-leaning glazed cab (glass
    // tilts out so it doesn't reflect the room) with slim mullions, a deep
    // dark roof overhang and a white fascia. No box parts.
    {
      // stands on the grass strip between the apron (ends z -0.7) and the
      // main road (starts z 0.45); at z -1.6 it was in the middle of the
      // apron and the crash tender drove through its base
      const TX = 14.9, TZ = -0.12;
      const towerConc = paint(0xd9d6cf, { roughness: 0.82, metalness: 0 });
      const towerDark = paint(0x2f3337, { roughness: 0.6, metalness: 0.3 });
      const cabGlass = new THREE.MeshPhysicalMaterial({ color: 0x24343e, metalness: 0.4, roughness: 0.04,
        clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.8 });
      b.add(cylY(0.3, 2.0, 32, 0.25), towerConc, TX, 1.5, TZ);                 // shaft
      [0.95, 1.55, 2.15].forEach(y => b.add(cylY(0.3 - (y - 0.5) * 0.025 + 0.004, 0.012, 32), M.grey, TX, y, TZ));  // pour joints
      b.add(cylY(0.25, 0.26, 32, 0.5), towerConc, TX, 2.63, TZ);               // flared neck
      b.add(cylY(0.53, 0.05, 32), towerDark, TX, 2.785, TZ);                   // cab floor / walkway
      b.add(cylY(0.45, 0.4, 16, 0.55), cabGlass, TX, 3.01, TZ);                // leaning glass
      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
        const A = new THREE.Vector3(TX + s * 0.452, 2.81, TZ + c * 0.452), B = new THREE.Vector3(TX + s * 0.552, 3.21, TZ + c * 0.552);
        const geo = cylY(0.007, A.distanceTo(B), 4);
        geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, B.clone().sub(A).normalize()));
        const m = A.clone().add(B).multiplyScalar(0.5);
        b.add(geo, towerDark, m.x, m.y, m.z);
      }
      b.add(cylY(0.62, 0.05, 32), towerDark, TX, 3.235, TZ);                  // overhang soffit
      b.add(cylY(0.62, 0.09, 32, 0.6), M.white, TX, 3.305, TZ);               // fascia
      b.add(cylY(0.5, 0.04, 32), M.grey, TX, 3.37, TZ);                       // roof deck
      // round glazed foyer at the foot (fits the strip, no square wing)
      b.add(cylY(0.42, 0.42, 32), towerConc, TX, 0.21, TZ);
      b.add(cylY(0.425, 0.24, 32), cabGlass, TX, 0.17, TZ);
      b.add(cylY(0.46, 0.05, 32), roofFlat, TX, 0.445, TZ);
      b.add(cylY(0.3, 0.1, 32, 0.3), towerConc, TX, 0.52, TZ);
    }
    // --- civic buildings: extra detail -------------------------------------
    const blue = paint(0x1d3f8f, { roughness: 0.5 }), red = paint(0xc4231b, { roughness: 0.5 });
    // police station (front faces +z at z = 0.1): portico, glass doors,
    // chequered band, flagpole, roof radio mast
    b.add(box(0.8, 0.04, 0.24), M.concrete, -1.4, 0.02, 0.22);
    b.add(box(0.7, 0.03, 0.12), M.concrete, -1.4, 0.055, 0.16);
    b.add(box(0.46, 0.5, 0.02), F.glass, -1.4, 0.3, 0.11);
    b.add(box(0.5, 0.03, 0.03), M.steel, -1.4, 0.56, 0.115);
    b.add(box(0.86, 0.05, 0.24), M.offwhite, -1.4, 0.66, 0.22);
    [-0.38, 0.38].forEach(dx => b.add(cylY(0.022, 0.64, 10), M.offwhite, -1.4 + dx, 0.32, 0.31));
    for (let i = 0; i < 22; i++) b.add(box(0.1, 0.05, 0.012), i % 2 ? M.white : blue, -2.45 + i * 0.1, 1.08, 0.106);
    b.add(cylY(0.014, 1.5, 6), M.steel, -2.7, 0.75, 0.25);
    b.add(box(0.26, 0.16, 0.01), blue, -2.57, 1.38, 0.25);
    b.add(cylY(0.01, 0.9, 6), M.steel, -0.7, 2.11, -0.7);
    [1.9, 2.15, 2.4].forEach(y => b.add(box(0.12, 0.01, 0.01), M.steel, -0.7, y, -0.7));
    // hospital (front faces -z at z = 2.7): main entrance canopy + sliding
    // doors, ambulance bay, red crosses, floor ledges, roof rail + lift house
    b.add(box(0.62, 0.5, 0.02), F.glass, 3.9, 0.27, 2.69);
    b.add(box(1.3, 0.05, 0.42), M.white, 3.9, 0.7, 2.5);
    b.add(box(1.31, 0.03, 0.43), red, 3.9, 0.66, 2.5);
    [-0.58, 0.58].forEach(dx => b.add(cylY(0.022, 0.68, 10), M.steel, 3.9 + dx, 0.34, 2.33));
    b.add(box(1.0, 0.05, 0.5), M.white, 5.4, 0.9, 2.46);
    b.add(box(1.01, 0.04, 0.51), paint(0xf2c419, { roughness: 0.5 }), 5.4, 0.86, 2.46);
    [-0.45, 0.45].forEach(dx => b.add(cylY(0.022, 0.88, 10), M.steel, 5.4 + dx, 0.44, 2.25));
    b.add(box(0.7, 0.55, 0.02), M.grey, 5.4, 0.3, 2.69);
    [[3.25, 1.95], [5.75, 1.95]].forEach(([x, y]) => {
      b.add(box(0.26, 0.26, 0.012), M.white, x, y, 2.688);
      b.add(box(0.2, 0.065, 0.016), red, x, y, 2.685);
      b.add(box(0.065, 0.2, 0.016), red, x, y, 2.685);
    });
    [0.82, 1.62].forEach(y => b.add(box(3.02, 0.025, 0.03), M.offwhite, 4.5, y, 2.69));
    [[4.5, 2.7, 3.0, 0], [4.5, 4.9, 3.0, 0], [3.0, 3.8, 2.2, Math.PI / 2], [6.0, 3.8, 2.2, Math.PI / 2]].forEach(([x, z, len, ry]) => {
      b.add(box(len, 0.012, 0.012), M.steel, x, 2.6, z, ry);
      b.add(box(len, 0.012, 0.012), M.steel, x, 2.53, z, ry);
    });
    b.add(box(0.5, 0.3, 0.5), M.offwhite, 3.4, 2.62, 4.4);
    b.add(box(0.3, 0.2, 0.02), F.glass, 3.4, 2.58, 4.14);
    b.add(box(0.5, 0.14, 0.4), M.grey, 3.4, 2.54, 3.35);
    // airport terminal (landside +z face at z = -1.25): wide floating roof,
    // forecourt columns, glazing fins, revolving-door vestibules, skylight
    b.add(box(4.9, 0.05, 1.9), M.white, 10.6, 1.2, -1.9);
    b.add(box(4.92, 0.03, 1.92), M.steel, 10.6, 1.17, -1.9);
    b.add(box(3.8, 0.04, 0.32), F.glass, 10.6, 1.24, -1.9);
    for (let i = 0; i < 7; i++) b.add(cylY(0.022, 1.16, 10), M.steel, 8.6 + i * 0.667, 0.58, -1.02);
    for (let i = 0; i < 15; i++) b.add(box(0.014, 0.8, 0.03), M.steel, 8.5 + i * 0.3, 0.42, -1.24);
    [9.5, 10.6, 11.7].forEach(x => {
      b.add(box(0.38, 0.42, 0.14), F.glass, x, 0.21, -1.18);
      b.add(box(0.4, 0.03, 0.16), M.steel, x, 0.43, -1.18);
    });
    b.add(box(4.6, 0.02, 0.3), M.concrete, 10.6, 0.01, -1.1);
    // control tower: wide base block, catwalk ring, aerials
    // tower roof: radar plinth, two aerial masts with a red obstruction light
    b.add(cylY(0.08, 0.06, 16), M.grey, 14.9, 3.42, -0.12);
    [-0.32, 0.32].forEach(dx => b.add(cylY(0.007, 0.5, 6, 0.004), M.steel, 14.9 + dx, 3.64, -0.12));
    b.add(sphere(0.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 1.5 }), 14.58, 3.9, -0.12);
    building(19.0, -1.7, 1.2, 1.6, 1.2, F.shed, 'flat');
    // pit building + grandstand
    building(14.3, 6.0, 3.2, 0.8, 0.6, F.white);        // pit building, behind the grandstand
    // grandstand in the infield, facing the near straight (rows rise toward the
    // back). It used to stand between the main road and the track, where it hid
    // the bus and the taxi on the street page.
    const gz = 8.6;
    for (let i = 0; i < 4; i++) b.add(box(4.0, 0.12 * (i + 1), 0.2), M.concrete, 14.3, 0.06 * (i + 1), gz - i * 0.2);
    b.add(box(4.2, 0.04, 1.0), paint(0xd9d6cf), 14.3, 0.95, gz - 0.3);
    [-1.9, 0, 1.9].forEach(dx => b.add(box(0.05, 0.95, 0.05), M.steel, 14.3 + dx, 0.48, gz - 0.75));
    const crowdR = seeded(44), crowdCols = [0xc4231b, 0x1e5fb4, 0xf2c419, 0xf2f2ee, 0x2f7d3c];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 22; k++) {
      if (crowdR() < 0.3) continue;
      b.add(box(0.07, 0.1, 0.07), paint(crowdCols[k % 5], { roughness: 0.8 }), 12.45 + k * 0.175, 0.12 * (i + 1) + 0.05, gz - i * 0.2);
    }
    b.flush(root);

    // signs (decals on fronts)
    const sign = (text, x, y, z, w, h, ry, fg, bg) => {
      const m = mesh(new THREE.PlaneGeometry(w, h), decal(labelTex(text, { fg, bg, w: 512, h: 96 }), { transparent: !bg }), x, y, z, root);
      m.rotation.y = ry; m.castShadow = false;
    };
    sign('POLICE', -1.4, 1.35, 0.13, 1.0, 0.2, 0, '#fff', '#1d3f8f');
    sign('FIRE STATION', -4.15, 1.3, -3.88, 1.2, 0.18, 0, '#fff', '#a71e16');
    sign('HOSPITAL', 4.5, 2.15, 2.69, 1.4, 0.22, 0, '#c4231b', '#fff');
    sign('HARBOUR CITY AIRPORT', 10.6, 0.98, -1.24, 2.6, 0.2, 0, '#22324a', '#eef1f3');
    sign('CRUISE TERMINAL', -6.99, 1.12, -8.5, 2.2, 0.22, Math.PI / 2, '#fff', '#22324a');
    // fire station doors on its front
    for (let i = 0; i < 3; i++) mesh(box(0.38, 0.6, 0.02), paint(0xa71e16, { roughness: 0.4 }), -4.65 + i * 0.5, 0.3, -3.89, root);
    // helipad on the hospital roof
    const pad = mesh(cylY(0.75, 0.05, 28), decal(labelTex('H', { fg: '#f2f2ee', bg: '#2e7d4a', w: 256, h: 256, font: 'bold 200px Arial' }), { transparent: false }), 4.9, 2.47, 3.8, root);
    pad.material.map.rotation = 0;
    // radar on the tower + windsock
    W.radar = part('radar', root, 14.9, 3.45, -0.12);
    mesh(box(0.5, 0.08, 0.04), M.white, 0, 0.08, 0, W.radar);
    mesh(cylY(0.02, 0.1, 6), M.steel, 0, 0, 0, W.radar);
    mesh(cylY(0.02, 0.8, 6), M.white, 19.0, 0.4, -12.3, root);
    W.sock = new THREE.Group(); W.sock.position.set(19.0, 0.78, -12.3); root.add(W.sock);
    mesh(cylX(0.03, 0.4, 10, 0.06), paint(0xf06a1a, { roughness: 0.7 }), -0.2, 0, 0, W.sock);
    updaters.push((dt, t) => {
      W.radar.rotation.y += dt * 1.6;
      W.sock.rotation.y = 0.4 + Math.sin(t * 0.7) * 0.25; W.sock.rotation.z = -0.15 + Math.sin(t * 2.3) * 0.05;
    });
    // jet bridge (fixed) from the terminal to the front door
    mesh(box(0.3, 0.28, 1.35), F.glass, 11.06, 0.72, -3.22, root);
    mesh(box(0.06, 0.58, 0.06), M.steel, 11.06, 0.29, -3.7, root);
    // start-light gantry over the start/finish line
    const T = L.track, fz = T.c1[1] + T.r;
    [-0.7, 0.7].forEach(dz => mesh(box(0.06, 1.1, 0.06), M.steel, 15.2, 0.55, fz + dz, root));
    mesh(box(0.12, 0.2, 1.5), M.black, 15.2, 1.1, fz, root);
    W.startLights = [];
    for (let i = 0; i < 5; i++) {
      const m = lamp(0xff1a10, 0.02);
      mesh(sphere(0.045, 8, 6), m, 15.26, 1.12, fz - 0.4 + i * 0.2, root);
      W.startLights.push(m);
    }
    // marshal's chequered flag
    mesh(cylY(0.015, 0.7, 6), M.steel, 15.5, 0.35, fz + 0.75, root);
    W.flag = part('flag', root, 15.5, 0.66, fz + 0.75);
    const [fc, fg] = canvas(64, 48);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { fg.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f0'; fg.fillRect(i * 8, j * 8, 8, 8); }
    const flagM = new THREE.MeshStandardMaterial({ map: tex(fc), side: THREE.DoubleSide, roughness: 0.8 });
    const fl = mesh(new THREE.PlaneGeometry(0.32, 0.22, 6, 1).translate(0.16, 0, 0), flagM, 0, 0, 0, W.flag);
    W.flag.visible = false;
    W.flagGeo = fl.geometry;
    // runway edge lights + taxi lights
    const rl = lamp(0xfff0c8, 0.15);
    night.lamps.push(rl);
    const pts = [];
    for (let x = L.runwayX0 + 0.2; x < L.runwayX1; x += 0.7) pts.push([x, L.runwayZ - 0.88], [x, L.runwayZ + 0.88]);
    const rim = new THREE.InstancedMesh(sphere(0.04, 6, 4), rl, pts.length);
    const o = new THREE.Object3D();
    pts.forEach(([x, z], i) => { o.position.set(x, 0.04, z); o.updateMatrix(); rim.setMatrixAt(i, o.matrix); });
    root.add(rim);
  });

  // =========================================================================
  // CHUNK 3: trees, street lamps, construction-site props, containers
  chunks.push(() => {
    const r = seeded(33);
    const trees = [];
    const addTrees = (x0, z0, x1, z1, n) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), s = 0.28 + r() * 0.2;
        if (Math.hypot(x - 3.6, z - 9.0) < 1.3) continue;      // keep the ice cream van's spot clear
        trees.push([x, z, s]);
      }
    };
    addTrees(2.4, 6.4, 7.6, 12.4, TIER ? 34 : 20);   // park
    // town avenue: on the pavement strip between the ring road (ends at
    // z -1.25) and the main road, clear of the west ring lane and the
    // police station (x -2.6..-0.2); canopies used to hang over the road
    addTrees(-4.6, -1.0, -2.8, -0.9, 2);
    addTrees(0.2, -1.0, 4.8, -0.9, 5);
    // (no trees on the near side of the track: the camera looks across it)
    addTrees(10.0, 6.2, 11.2, 8.4, 2);               // infield ends
    addTrees(17.4, 6.2, 18.6, 8.4, 2);
    addTrees(8.1, -12.6, 19.4, -12.2, 10);           // airport fence line
    addTrees(-19.4, 12.0, -10.0, 12.5, 0);
    // indexed sphere, so the jittered canopy gets smooth normals (the faceted
    // icosahedron read as low-poly cartoon)
    const canopyGeo = new THREE.SphereGeometry(1, 14, 10);
    const pos = canopyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      // seam-safe jitter: same offset for the same direction
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const k = 0.88 + 0.12 * Math.sin(x * 7.1 + y * 5.3) * Math.cos(z * 6.7 - y * 3.1) + 0.06 * Math.sin(x * 17 + z * 13);
      pos.setXYZ(i, x * k, y * k * 0.92, z * k);
    }
    canopyGeo.computeVertexNormals();
    // leaf texture: dense clumps with dark gaps and sunlit tips, so a canopy
    // reads as foliage rather than a smooth ball
    const [lc, lg] = canvas(256, 128);
    lg.fillStyle = '#3d5a2a'; lg.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 2600; i++) {
      const v = r();
      lg.fillStyle = v < 0.3 ? 'rgba(20,34,14,.6)' : v < 0.8 ? 'rgba(88,122,56,.55)' : 'rgba(160,190,100,.5)';
      lg.beginPath(); lg.ellipse(r() * 256, r() * 128, 2 + r() * 3, 1.5 + r() * 2, r() * 3, 0, Math.PI * 2); lg.fill();
    }
    const leafTex = tex(lc, { repeat: true }); leafTex.repeat.set(3, 2);
    const leaves = new THREE.MeshStandardMaterial({ color: 0xffffff, map: leafTex, roughness: 0.95, metalness: 0 });
    // each tree = 3 overlapping clumps + a trunk with a fork
    const LUMPS = [[0, 1.6, 0, 1], [0.35, 1.35, 0.15, 0.7], [-0.3, 1.4, -0.2, 0.72]];
    const canopy = new THREE.InstancedMesh(canopyGeo, leaves, trees.length * LUMPS.length);
    const trunk = new THREE.InstancedMesh(cylY(0.05, 1, 7, 0.032), paint(0x5a4232, { roughness: 1, metalness: 0 }), trees.length * 2);
    const o = new THREE.Object3D(), c = new THREE.Color();
    trees.forEach(([x, z, s], i) => {
      const hue = 0.22 + r() * 0.07, lum = 0.5 + r() * 0.25, ry = r() * 6;
      LUMPS.forEach(([dx, dy, dz, k], j) => {
        const cx = dx * Math.cos(ry) - dz * Math.sin(ry), cz = dx * Math.sin(ry) + dz * Math.cos(ry);
        o.position.set(x + cx * s, s * dy, z + cz * s); o.scale.set(s * k, s * k * 0.9, s * k); o.rotation.set(0, ry + j, 0); o.updateMatrix();
        canopy.setMatrixAt(i * 3 + j, o.matrix);
        canopy.setColorAt(i * 3 + j, c.setHSL(hue, 0.35, lum * (j ? 0.9 : 1)));
      });
      o.rotation.set(0, 0, 0);
      o.position.set(x, s * 0.5, z); o.scale.set(1, s * 1.1, 1); o.updateMatrix();
      trunk.setMatrixAt(i * 2, o.matrix);
      o.position.set(x + 0.06 * s, s * 1.05, z); o.rotation.set(0, 0, -0.5); o.scale.set(0.6, s * 0.6, 0.6); o.updateMatrix();
      trunk.setMatrixAt(i * 2 + 1, o.matrix);
    });
    canopy.castShadow = canopy.receiveShadow = trunk.castShadow = true;
    root.add(canopy, trunk);
    // street lamps along the main road and the quay road
    const sl = lamp(0xffd99a, 0.05);
    night.street = sl;
    const lamps = [];
    for (let x = -5.8; x < 19.4; x += 2.2) lamps.push([x, L.mainZ - L.mainW / 2 - 0.2], [x + 1.1, L.mainZ + L.mainW / 2 + 0.2]);
    for (let z = -12; z < 12.4; z += 2.4) lamps.push([L.quayRoadX + 0.55, z]);
    const pole = new THREE.InstancedMesh(cylY(0.018, 0.7, 6), M.dark, lamps.length);
    const head = new THREE.InstancedMesh(box(0.1, 0.035, 0.07), sl, lamps.length);
    lamps.forEach(([x, z], i) => {
      o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
      o.position.set(x, 0.35, z); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
      o.position.set(x, 0.71, z); o.updateMatrix(); head.setMatrixAt(i, o.matrix);
    });
    pole.castShadow = true;
    root.add(pole, head);
    // raised kerbs along the main road and the quay road (crisp road edges)
    const kerbs = new Batch(), kerbM = paint(0xc9c4b8, { roughness: 0.9, metalness: 0 });
    [L.mainZ - L.mainW / 2, L.mainZ + L.mainW / 2].forEach(z => kerbs.add(box(25.6, 0.035, 0.05), kerbM, 6.8, 0.017, z));
    kerbs.add(box(0.05, 0.035, 25.2), kerbM, L.quayRoadX - 0.4, 0.017, 0);
    // inner kerb, open where the main road joins
    const jz0 = L.mainZ - L.mainW / 2, jz1 = L.mainZ + L.mainW / 2;
    kerbs.add(box(0.05, 0.035, jz0 + 12.6), kerbM, L.quayRoadX + 0.4, 0.017, (jz0 - 12.6) / 2);
    kerbs.add(box(0.05, 0.035, 12.6 - jz1), kerbM, L.quayRoadX + 0.4, 0.017, (jz1 + 12.6) / 2);
    // benches, bins, bollards and a post box along the pavements
    for (let x = -4.5; x < 19; x += 3.1) {
      kerbs.add(box(0.26, 0.03, 0.08), M.wood, x, 0.09, L.mainZ + L.mainW / 2 + 0.22);
      kerbs.add(box(0.26, 0.08, 0.015), M.wood, x, 0.13, L.mainZ + L.mainW / 2 + 0.26);
      kerbs.add(cylY(0.03, 0.1, 8), M.dark, x + 0.4, 0.05, L.mainZ + L.mainW / 2 + 0.22);
    }
    kerbs.add(rbox(0.07, 0.14, 0.07, 0.02), paint(0xb8171b), 8.4, 0.07, L.mainZ + L.mainW / 2 + 0.2);
    kerbs.flush(root);
    // construction site: fence, cabin, cones, piles, formwork
    const b = new Batch();
    // mesh site fence (see-through wire panels, not a solid wall)
    const [fc, fg] = canvas(64, 64);
    fg.strokeStyle = '#c9ccd0'; fg.lineWidth = 2;
    for (let i = 0; i <= 64; i += 8) { fg.beginPath(); fg.moveTo(i, 0); fg.lineTo(i, 64); fg.stroke(); fg.beginPath(); fg.moveTo(0, i); fg.lineTo(64, i); fg.stroke(); }
    fg.lineWidth = 5; fg.strokeRect(1, 1, 62, 62);
    const fenceTex = tex(fc, { repeat: true });
    const fenceM = new THREE.MeshStandardMaterial({ map: fenceTex, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.45 });
    fenceTex.format = THREE.RGBAFormat;
    for (let x = -5.7; x < 1.8; x += 0.5) {
      b.add(new THREE.PlaneGeometry(0.5, 0.3), fenceM, x + 0.25, 0.17, 2.05);
      b.add(box(0.06, 0.03, 0.08), M.concrete, x, 0.015, 2.05);            // fence feet
    }
    for (let z = 2.1; z < 12.4; z += 0.5) {
      b.add(new THREE.PlaneGeometry(0.5, 0.3), fenceM, 1.82, 0.17, z + 0.25, Math.PI / 2);
      b.add(box(0.08, 0.03, 0.06), M.concrete, 1.82, 0.015, z);
    }
    b.add(rbox(1.0, 0.45, 0.5, 0.03), paint(0x2f6aa8), -5.1, 0.24, 7.0);                   // site cabin
    b.add(box(0.5, 0.18, 0.52), M.glass, -5.1, 0.28, 7.0);
    for (let i = 0; i < 6; i++) b.add(new THREE.ConeGeometry(0.05, 0.14, 8), M.orange, -1.4 + i * 0.5, 0.07, 10.75);
    b.add(sphere(0.9, 14, 8, 0).scale(1, 0.4, 0.8), M.sand, -0.2, 0, 4.0);
    b.add(box(1.3, 0.14, 1.0), M.wood, -2.9, 0.07, 11.3);                                  // formwork frame
    b.flush(root);
    // container yard on the quay
    const list = [];
    [-8.35, -8.07, -7.79, -7.51].forEach(x => {
      for (let i = 0; i < 4; i++) {
        const tiers = 1 + Math.floor(r() * 3);
        for (let t = 0; t < tiers; t++) list.push([x, QUAY_Y + 0.13 + t * 0.26, 2.6 + i * 0.66, Math.floor(r() * 8), Math.PI / 2]);
      }
    });
    root.add(V.containerStack(list));
  });

  // =========================================================================
  // CHUNK 4: ships, crane, lighthouse, gulls, clouds, sun
  chunks.push(() => {
    W.cruise = place(V.cruiseShip(), -9.92, -7.5, -Math.PI / 2); root.add(W.cruise);
    W.tug = place(V.tugboat(), -12.4, -9.8, 0); root.add(W.tug);
    W.freight = place(V.freightShip(), -9.8, 1.6, -Math.PI / 2); root.add(W.freight);
    W.crane = place(V.containerCrane(), -7.9, 1.2, 0, QUAY_Y); root.add(W.crane);
    // moored bow toward the far edge, so it can leave bow-first; its hose
    // manifold faces the jetty (+x)
    W.tanker = place(V.oilTanker(), -17.4, L.jettyZ, Math.PI / 2); root.add(W.tanker);
    W.tanker.userData.parts.hoses.position.z = 0.66;
    W.light = place(V.lighthouse(), -15.7, -12.3, 0, 0.22); root.add(W.light);
    night.beam = W.light.userData.beamMat;
    night.lamps.push(...W.light.userData.lamps);
    // the container the crane moves
    W.box = V.container(0xc98a1e);
    root.add(W.box);
    W.boxRest = new V3(-9.8, 1.56, 1.2);
    W.box.position.copy(W.boxRest); W.box.rotation.y = Math.PI / 2;
    W.crane.userData.parts.spreader.rotation.y = Math.PI / 2;
    [W.cruise, W.freight, W.tanker, W.tug].forEach(s => smokers.push(s));
    // ships bob on the swell
    const bobbers = [[W.cruise, 0.0, 0.012], [W.freight, 1.3, 0.014], [W.tanker, 2.1, 0.014], [W.tug, 0.6, 0.03]];
    updaters.push((dt, t) => {
      bobbers.forEach(([s, ph, a]) => {
        s.position.y = Math.sin(t * 0.9 + ph) * a;
        s.rotation.x = Math.sin(t * 0.7 + ph) * a * 0.6;
      });
      W.light.userData.parts.beam.rotation.y += dt * (W.lightFast ? 5 : 0.9);
    });
    // gulls
    const gullM = paint(0xf4f4f0, { roughness: 0.7 }), wingTip = paint(0x3a3c40);
    const gulls = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      mesh(sphere(0.05, 8, 6).scale(2.2, 0.8, 0.9), gullM, 0, 0, 0, g);
      const wl = new THREE.Group(), wr = new THREE.Group();
      mesh(box(0.06, 0.008, 0.2), gullM, 0, 0, 0.1, wl); mesh(box(0.04, 0.008, 0.06), wingTip, 0, 0, 0.22, wl);
      mesh(box(0.06, 0.008, 0.2), gullM, 0, 0, -0.1, wr); mesh(box(0.04, 0.008, 0.06), wingTip, 0, 0, -0.22, wr);
      g.add(wl, wr);
      g.userData = { wl, wr, ph: i * 1.7, rad: 1.6 + (i % 3) * 0.9, cx: -12 + (i % 4) * 2.2, cz: -4 + (i % 3) * 4, y: 3.2 + (i % 4) * 0.7, sp: 0.35 + (i % 3) * 0.08 };
      root.add(g); gulls.push(g);
    }
    W.gullBoost = 0;
    updaters.push((dt, t) => {
      W.gullBoost = Math.max(0, W.gullBoost - dt * 0.25);
      gulls.forEach(g => {
        const u = g.userData, a = t * u.sp * (1 + W.gullBoost) + u.ph;
        g.position.set(u.cx + Math.cos(a) * u.rad, u.y + Math.sin(t * 0.5 + u.ph) * 0.3 + W.gullBoost * 1.5, u.cz + Math.sin(a) * u.rad);
        g.rotation.set(0, -a - Math.PI / 2 + Math.PI, Math.sin(a * 2) * 0.1);
        const f = Math.sin(t * (6 + W.gullBoost * 6) + u.ph) * 0.5;
        u.wl.rotation.x = -f; u.wr.rotation.x = f;
      });
    });
    // floating sky pieces: clouds and the sun (the canvas is transparent)
    const cloudTex = (() => {
      const [c, g] = canvas(256, 128);
      for (let i = 0; i < 14; i++) {
        const x = 40 + Math.random() * 176, y = 50 + Math.random() * 40, rr = 22 + Math.random() * 26;
        const gr = g.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
      return tex(c);
    })();
    const clouds = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, depthWrite: false }));
      s.position.set(-26 + i * 8.5, 11 + (i % 3) * 1.6, -16 + (i % 2) * 5);
      s.scale.set(7 + (i % 3) * 2, 3.2 + (i % 2), 1);
      root.add(s); clouds.push(s);
    }
    W.clouds = clouds;
    W.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot('rgba(255,244,214,1)', 'rgba(255,214,140,0)', 128), transparent: true, depthWrite: false }));
    W.sun.scale.set(9, 9, 1);
    W.sun.position.set(-24, 19, -24);
    W.sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot('rgba(255,252,240,1)', 'rgba(255,248,226,0)', 64), transparent: true, depthWrite: false }));
    W.sunCore.scale.set(3, 3, 1); W.sunCore.position.copy(W.sun.position);
    W.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot('rgba(238,242,255,1)', 'rgba(200,214,255,0)', 64), transparent: true, depthWrite: false, opacity: 0 }));
    W.moon.scale.set(2.4, 2.4, 1); W.moon.position.set(18, 17, -22);
    root.add(W.sun, W.sunCore, W.moon);
    updaters.push(dt => clouds.forEach(s => { s.position.x += dt * 0.25; if (s.position.x > 32) s.position.x = -32; }));
  });

  // =========================================================================
  // CHUNK 5: construction machines
  chunks.push(() => {
    W.exc = place(V.excavator(), -4.0, 4.3, 0); root.add(W.exc);
    W.doz = place(V.bulldozer(), -1.6, 2.75, Math.PI); root.add(W.doz);
    W.soilPile = mesh(sphere(0.45, 12, 6, 0).scale(1, 0.5, 1), M.soil, -3.54, 0, 2.75, root);
    W.soilPile.scale.set(0.6, 0.3, 0.6);
    W.bh = place(V.backhoe(), -1.6, 7.4, 0); root.add(W.bh);
    W.dump = place(V.dumpTruck(), -3.25, 7.75, -Math.PI / 2); root.add(W.dump);
    W.gravelPile = mesh(sphere(0.5, 12, 6).scale(1, 0.5, 1), M.gravel, -3.25, 0, 8.3, root);
    W.gravelPile.visible = false;
    W.mixer = place(V.cementMixer(), -4.4, 11.3, Math.PI); root.add(W.mixer);
    W.slab = mesh(box(1.2, 0.1, 0.9), paint(0x9e9a92, { roughness: 0.95, metalness: 0 }), -2.9, 0.05, 11.3, root);
    W.roller = place(V.roadRoller(), -0.9, 11.4, 0); root.add(W.roller);
    W.asphalt = mesh(box(1, 0.02, 0.6), paint(0x1e1f21, { roughness: 0.35, metalness: 0 }), -1.3, 0.012, 11.4, root);
    W.asphalt.castShadow = false;
    smokers.push(W.exc, W.doz, W.bh);
  });

  // =========================================================================
  // CHUNK 6: emergency vehicles, street scene
  chunks.push(() => {
    // fire truck on the quay road in front of the shed, nose toward it
    W.fireTruck = place(V.fireTruck(), L.quayRoadX + 0.05, 11.0, Math.PI / 2); root.add(W.fireTruck);
    W.fireboat = place(V.fireboat(), -10.7, 9.8, -Math.PI / 2); root.add(W.fireboat);
    W.broken = place(V.brokenCar(), -0.4, 1.28, Math.PI); root.add(W.broken);
    W.police = place(V.policeCar(), 0.9, 1.28, Math.PI); root.add(W.police);
    W.tow = place(V.towTruck(), -5.0, 1.28, Math.PI); root.add(W.tow);
    W.amb = V.ambulance(); root.add(W.amb);
    W.heli = V.helicopter(); root.add(W.heli);
    W.bus = place(V.doubleDecker(), 9.3, 1.28, Math.PI); root.add(W.bus);
    W.garbage = place(V.garbageTruck(), 6.4, 0.72, 0); root.add(W.garbage);
    W.bin = place(V.wheelieBin(), 6.45, 0.22, 0, 0); root.add(W.bin);
    W.taxi = place(V.taxiCab(), 12.2, 0.72, 0); root.add(W.taxi);
    W.traveller = place(V.person(0x8a5a3a), 12.1, 0.2, Math.PI / 2); root.add(W.traveller);
    W.case = place(V.suitcase(), 12.0, 0.26, 0); root.add(W.case);
    W.riders = [0x3b4a66, 0x7a2a2a, 0x2f5f3a].map((c, i) => { const p = place(V.person(c), 8.8 + i * 0.22, 1.95, -Math.PI / 2); root.add(p); return p; });
    // bus shelter
    mesh(box(0.9, 0.03, 0.3), M.glass, 9.0, 0.5, 2.0, root);
    mesh(box(0.9, 0.42, 0.015), paint(0x9fb6c4, { metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.5 }), 9.0, 0.26, 2.14, root);
    smokers.push(W.bus, W.garbage);
    // ice cream van (static) on the grass by the main road, between the
    // hospital and the bus stop, so it shows on the hospital, street and
    // overview pages; the family queues at the hatch on the pavement side
    root.add(place(V.iceCreamTruck(), 7.85, 2.75, 0));
    [[V.person(0x3f6a8a), 7.55, 2.1], [V.child(0xe8b10c), 7.75, 2.15], [V.person(0x8a3a4a, 0x3a3030), 8.05, 2.05],
     [V.child(0xd9544a), 8.25, 2.18], [V.child(0x5f9a5a), 7.4, 1.98]].forEach(([p, x, z]) => root.add(place(p, x, z, -Math.PI / 2)));
    // ambulance + helicopter rest where they end up
    W.ambPath = new Path([[-3.0, 0.72], [1.0, 0.72], [2.8, 0.85], [3.5, 1.45], [3.75, 2.0]]);
    W.ambPath.at(W.amb, W.ambPath.len);
    W.heliPad = new V3(4.9, 2.5, 3.8);
    W.heli.position.copy(W.heliPad); W.heli.rotation.y = 0.6;
  });

  // =========================================================================
  // CHUNK 7: airport + race track vehicles, town traffic, the overflying plane
  chunks.push(() => {
    W.jet = V.jetliner(); root.add(W.jet);
    W.jetRest = () => { W.jet.position.set(10.6, W.jet.userData.groundY, -5.9); W.jet.rotation.set(0, -Math.PI / 2, 0); W.jet.userData.parts.gear.scale.y = 1; };
    W.jetRest();
    W.ptug = place(V.pushbackTug(), 10.6, -3.0, Math.PI / 2); root.add(W.ptug);
    W.cargo = V.jetliner({ tail: 0xe0661c, cargo: true }); root.add(W.cargo);
    W.cargo.position.set(16.8, W.cargo.userData.groundY, -5.9); W.cargo.rotation.y = -Math.PI / 2;
    W.loader = place(V.uldLoader(), 16.8, -2.4, -Math.PI / 2); root.add(W.loader);
    W.ulds = [0, 1].map(i => { const m = mesh(rbox(0.3, 0.26, 0.4, 0.03), paint(0xb9bec4, { metalness: 0.7, roughness: 0.4 }), 0, 0, 0, root); return m; });
    W.tender = place(V.crashTender(), 13.7, -1.0, -Math.PI / 2 - 0.5); root.add(W.tender);
    // overflying plane (a second jet, high up, crossing the sky now and then)
    W.flyer = V.jetliner({ tail: 0x2f8a6a }); W.flyer.scale.setScalar(0.7); root.add(W.flyer);
    W.flyer.userData.parts.gear.visible = false;
    // race grid
    W.f1 = V.f1Car(); W.gt = V.gtCar(); W.bike1 = V.motoGP(0xf2c419, 0x1a2a6a, '46'); W.bike2 = V.motoGP(0x1e5fb4, 0xd8d8d2, '93');
    W.racers = [[W.f1, 2.6, -0.2, 5.2], [W.gt, 2.0, 0.2, 6.1], [W.bike1, 1.4, -0.2, 5.6], [W.bike2, 0.9, 0.2, 5.8]];
    W.racers.forEach(([o, s, off]) => { root.add(o); trackAt(o, s, off); });
    // town traffic on the ring road (drive on the left)
    const R = L.ring;
    const ring = [];
    const inset = -0.17;
    const corners = [[R.x0 - inset, R.z1 + inset], [R.x1 + inset, R.z1 + inset], [R.x1 + inset, R.z0 - inset], [R.x0 - inset, R.z0 - inset]];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
      for (let k = 0; k < 6; k++) ring.push([lerp(ax, bx, 0.06 + k * 0.176), lerp(az, bz, 0.06 + k * 0.176)]);
    }
    W.ring = new Path(ring, true);
    W.traffic = [V.sedan(0x34506b), V.sedan(0x8a8f94), V.taxiCab(), V.sedan(0x6e2a2a), V.doubleDecker(), V.sedan(0xd8d6cf)];
    W.traffic.forEach((c, i) => { root.add(c); c.userData.s = i * W.ring.len / W.traffic.length; });
    smokers.push(W.tender);
  });

  // --- the race track as a path ------------------------------------------------
  const T = L.track, straight = T.c2[0] - T.c1[0], arc = Math.PI * T.r, LAP = 2 * straight + 2 * arc;
  function trackPoint(s, off = 0) {
    s = ((s % LAP) + LAP) % LAP;
    let x, z, tx, tz, k = 0;
    if (s < straight) { x = T.c1[0] + s; z = T.c1[1] + T.r; tx = 1; tz = 0; }
    else if (s < straight + arc) { const a = (s - straight) / T.r; x = T.c2[0] + T.r * Math.sin(a); z = T.c2[1] + T.r * Math.cos(a); tx = Math.cos(a); tz = -Math.sin(a); k = 1; }
    else if (s < 2 * straight + arc) { const d = s - straight - arc; x = T.c2[0] - d; z = T.c1[1] - T.r; tx = -1; tz = 0; }
    else { const b = (s - 2 * straight - arc) / T.r; x = T.c1[0] - T.r * Math.sin(b); z = T.c1[1] - T.r * Math.cos(b); tx = -Math.cos(b); tz = Math.sin(b); k = 1; }
    return { x: x + off * tz, z: z - off * tx, tx, tz, k };
  }
  function trackAt(o, s, off) {
    const p = trackPoint(s, off);
    const prev = o.userData.trackS == null ? s : o.userData.trackS;
    o.position.set(p.x, 0, p.z); o.rotation.set(0, yaw(p.tx, p.tz), 0);
    spin(o, s - prev); o.userData.trackS = s;
    const lean = o.userData.parts && o.userData.parts.lean;
    if (lean) lean.rotation.x = lerp(lean.rotation.x, -p.k * 0.7, 0.15);
  }

  // =========================================================================
  // STOPS (one per page). cam: target, dist, yaw (0 = from the near edge),
  // pitch (radians above the page).
  const S = (key, cam, play, reset, extra = {}) => { stops[key] = Object.assign({ cam, play, reset: reset || (() => {}), night: 0 }, extra); };
  const tmp = new V3(), tmp2 = new V3();
  const funnelAt = (ship, v = ship.userData.funnel) => ship.localToWorld(tmp.copy(v));

  // a moment t0 passed since the previous frame (for one-shot bursts)
  const lastT = {};
  const crossed = (key, t, t0) => { const p = lastT[key] == null || t < lastT[key] ? -1 : lastT[key]; return p < t0 && t >= t0; };
  W.beamFlash = 0;
  S('overview', { t: [0, 0, -0.5], d: 58, yaw: 0, pitch: 0.7 }, t => {
    W.lightFast = t < 4;
    W.beamFlash = t < 4 ? 0.4 * Math.min(1, t * 2) : 0;
    if (crossed('ov', t, 0)) W.gullBoost = 1;
    [W.cruise, W.freight, W.tanker, W.tug].forEach((s, i) => {
      if (crossed('ov', t, 0.4 + i * 0.5)) for (let k = 0; k < 18; k++) steam.emit(funnelAt(s), new V3((Math.random() - 0.5) * 0.6, 1.2 + Math.random(), (Math.random() - 0.5) * 0.6));
    });
    lastT.ov = t;
    return t > 4.5;
  }, () => { W.lightFast = false; W.beamFlash = 0; lastT.ov = null; });

  S('cruise', { t: [-10.6, 0.9, -7.2], d: 15.5, yaw: -0.5, pitch: 0.36 }, t => {
    // tug comes in, nudges the hull, ship sounds its horn, tug backs off
    const a = seg(t, 0, 2.2), b = seg(t, 3.6, 5.6);
    const x = lerp(-12.4, -11.42, a - b * 0.9);
    W.tug.position.x = x; W.tug.position.z = -9.8 + Math.sin(a * Math.PI) * 0.2;
    if (t > 2.2 && t < 3.6) W.cruise.position.x = -9.92 + Math.sin(seg(t, 2.2, 3.6, x => x) * Math.PI) * 0.05;
    if (t > 2.6 && t < 3.6) steam.stream(1 / 60, 40, funnelAt(W.cruise, W.cruise.userData.horn), new V3(0, 1, 0.1), 1.5, 0.35);
    return t > 6;
  }, () => { W.tug.position.set(-12.4, 0, -9.8); W.cruise.position.x = -9.92; });

  const crane = () => W.crane.userData.parts;
  const setDrop = Ldrop => {
    crane().cable.scale.y = Ldrop - 0.06;
    crane().spreader.position.y = -Ldrop;
  };
  S('freight', { t: [-9.4, 1.6, 1.4], d: 15, yaw: -0.7, pitch: 0.34 }, t => {
    const P = crane();
    const over = -1.9, land = 0.4, rest = -0.6;
    let tx = rest, Ld = 1.2;
    // drop lengths: the trolley runs at y ≈ 3.72 (crane stands on the quay)
    const pick = 2.005, put = 3.315;
    if (t < 1.5) tx = lerp(rest, over, seg(t, 0, 1.5));
    else if (t < 2.6) { tx = over; Ld = lerp(1.2, pick, seg(t, 1.5, 2.6)); }
    else if (t < 3.6) { tx = over; Ld = lerp(pick, 1.0, seg(t, 2.6, 3.6)); }
    else if (t < 5.6) { tx = lerp(over, land, seg(t, 3.6, 5.6)); Ld = 1.0; }
    else if (t < 6.8) { tx = land; Ld = lerp(1.0, put, seg(t, 5.6, 6.8)); }
    else if (t < 7.9) { tx = land; Ld = lerp(put, 1.2, seg(t, 6.9, 7.9)); }
    else { tx = lerp(land, rest, seg(t, 7.9, 9)); }
    P.trolley.position.x = tx; setDrop(Ld);
    if (t > 2.6 && t < 6.85) {     // the box hangs under the spreader
      P.spreader.getWorldPosition(tmp);
      W.box.position.set(tmp.x, tmp.y - 0.155, tmp.z);
    } else if (t >= 6.85) W.box.position.set(-7.9 + land, QUAY_Y + 0.13, 1.2);
    return t > 9.2;
  }, () => {
    crane().trolley.position.x = -0.6; setDrop(1.2);
    W.box.position.copy(W.boxRest);
  });

  S('tanker', { t: [-16.4, 0.6, 7.2], d: 13.5, yaw: -0.3, pitch: 0.4 }, t => {
    const P = W.tanker.userData.parts;
    P.hoses.rotation.z = -seg(t, 0, 1.2) * 1.2;
    P.hoses.position.y = 0.64 + seg(t, 0, 1.2) * 0.25;
    if (t > 1.3 && t < 2.3) steam.stream(1 / 60, 40, funnelAt(W.tanker), new V3(0, 1, 0), 1.6, 0.3);
    const m = seg(t, 2.2, 10, x => x * x * (3 - 2 * x));
    W.tanker.position.z = L.jettyZ - m * 6;
    W.tanker.position.x = -17.4 - Math.sin(m * Math.PI / 2) * 0.6;
    W.tanker.rotation.y = Math.PI / 2 - Math.sin(m * Math.PI) * 0.08;
    if (m > 0.02 && m < 0.98) {     // bow wave
      W.tanker.localToWorld(tmp.set(4.0, 0.05, 0));
      water.stream(1 / 60, 30, tmp, new V3(0, 0.5, 0), 0.8, 1.2);
    }
    return t > 10.5;
  }, () => {
    const P = W.tanker.userData.parts;
    P.hoses.rotation.z = 0; P.hoses.position.y = 0.64;
    place(W.tanker, -17.4, L.jettyZ, Math.PI / 2);
  });

  S('exdoz', { t: [-2.6, 0.4, 4.0], d: 7.5, yaw: 0.35, pitch: 0.42 }, t => {
    const P = W.exc.userData.parts;
    // dig: boom down, stick in, curl, lift, swing, dump, swing back
    const down = seg(t, 0, 1.2), curl = seg(t, 1.2, 2.2), up = seg(t, 2.2, 3.0), sw = seg(t, 3.0, 4.0), dump = seg(t, 4.0, 4.7), back = seg(t, 4.8, 5.8);
    P.boom.rotation.z = 0.55 - down * 0.65 + up * 0.75 - back * 0.1;
    P.stick.rotation.z = -1.55 + down * 0.4 - curl * 0.5 + back * 0.1;
    P.bucket.rotation.z = -0.4 - curl * 1.3 + dump * 1.6 - back * 0.3 * 0;
    P.house.rotation.y = sw * 1.3 - back * 1.3;
    P.soil.visible = curl > 0.5 && dump < 0.4;
    if (t > 1.3 && t < 2.0) { P.bucket.getWorldPosition(tmp); dirt.stream(1 / 60, 20, tmp, new V3(0, 1, 0), 0.6, 1.2); }
    if (dump > 0.2 && dump < 0.9) { P.bucket.getWorldPosition(tmp); dirt.stream(1 / 60, 60, tmp, new V3(0, -1, 0), 0.6, 0.9); }
    W.soilPile.scale.setScalar(0.6 + dump * 0.25); W.soilPile.scale.y = 0.3 + dump * 0.15;
    // the dozer pushes the pile flat
    const pushIn = seg(t, 5.6, 7.6), pushBack = seg(t, 8.0, 9.4);
    const dx = pushIn * 1.0 - pushBack * 1.0;
    W.doz.position.x = -1.6 - dx;
    spin(W.doz, 0);
    W.doz.userData.parts.blade.position.y = 0.05 + (t > 7.6 ? seg(t, 7.6, 8.0) * 0.1 : 0) - pushBack * 0.1;
    if (pushIn > 0.4) {
      const f = (pushIn - 0.4) / 0.6;
      W.soilPile.position.x = -3.54 - f * 0.45;
      W.soilPile.scale.y = lerp(0.45, 0.14, f); W.soilPile.scale.x = lerp(0.85, 1.4, f);
    }
    return t > 9.6;
  }, () => {
    const P = W.exc.userData.parts;
    P.boom.rotation.z = 0.55; P.stick.rotation.z = -1.55; P.bucket.rotation.z = -0.4; P.house.rotation.y = 0; P.soil.visible = false;
    W.doz.position.x = -1.6; W.doz.userData.parts.blade.position.y = 0.05;
    W.soilPile.position.set(-3.54, 0, 2.75); W.soilPile.scale.set(0.6, 0.3, 0.6);
  });

  S('bhdump', { t: [-2.3, 0.4, 8.1], d: 7.5, yaw: -0.15, pitch: 0.42 }, t => {
    const P = W.bh.userData.parts, D = W.dump.userData.parts;
    // two scoops: swing out to the trench, dig, lift, swing over the truck, drop
    const t0 = t < 3.2 ? 0 : 3.2;
    const out = seg(t, t0, t0 + 0.5), dig = seg(t, t0 + 0.5, t0 + 1.3), lift = seg(t, t0 + 1.3, t0 + 1.9),
      back = seg(t, t0 + 1.9, t0 + 2.6), drop = seg(t, t0 + 2.6, t0 + 3.1);
    P.swing.rotation.y = 1.1 * (out - back);
    P.bboom.rotation.z = -0.9 + dig * 0.5 - lift * 0.6 + drop * 0.1 * 0;
    P.bstick.rotation.z = 1.9 - dig * 0.5 + drop * 0.5;
    P.bbucket.rotation.z = 0.5 + dig * 0.8 - drop * 1.3;
    P.bsoil.visible = dig > 0.6 && drop < 0.5;
    if (dig > 0.2 && dig < 0.8) { P.bbucket.getWorldPosition(tmp); dirt.stream(1 / 60, 16, tmp, new V3(0, 1, 0), 0.5, 1.2); }
    if (drop > 0.1 && drop < 0.9) { P.bbucket.getWorldPosition(tmp); dirt.stream(1 / 60, 60, tmp, new V3(0, -1, 0), 0.5, 0.8); }
    if (t >= 6.4) { P.swing.rotation.y = 0; P.bboom.rotation.z = -0.9; P.bstick.rotation.z = 1.9; P.bbucket.rotation.z = 0.5; }
    D.load.visible = t > 2.9;
    D.load.scale.set(1, t > 6.1 ? 1 : 0.55, 1);
    // the truck drives off and tips its load
    const go = seg(t, 6.6, 8.6);
    const z0 = 7.75, z1 = 9.7;
    const prevZ = W.dump.position.z;
    W.dump.position.z = lerp(z0, z1, go);
    spin(W.dump, W.dump.position.z - prevZ);
    const tip = seg(t, 9.0, 10.2) - seg(t, 11.2, 12.2);
    D.bed.rotation.z = tip * 0.85;
    if (t > 9.6 && t < 11.0) {
      W.dump.localToWorld(tmp.set(-1.0, 0.25, 0));
      dirt.stream(1 / 60, 80, tmp, new V3(0, -0.5, -1).normalize(), 0.8, 0.9, 0x8f877c);
      W.gravelPile.visible = true;
      W.gravelPile.position.set(-3.25, 0, z1 - 1.45);
      W.gravelPile.scale.setScalar(seg(t, 9.6, 11.0) * 0.9 + 0.05);
      W.gravelPile.scale.y *= 0.5;
    }
    if (t > 10.6) D.load.visible = false;
    return t > 12.4;
  }, () => {
    const P = W.bh.userData.parts, D = W.dump.userData.parts;
    P.swing.rotation.y = 0; P.bboom.rotation.z = -0.9; P.bstick.rotation.z = 1.9; P.bbucket.rotation.z = 0.5; P.bsoil.visible = false;
    D.bed.rotation.z = 0; D.load.visible = false;
    W.dump.position.z = 7.75; W.gravelPile.visible = false;
  });

  S('mixroll', { t: [-2.9, 0.3, 11.2], d: 7.8, yaw: 0.25, pitch: 0.44 }, t => {
    const P = W.mixer.userData.parts;
    P.chute.rotation.z = -seg(t, 0.3, 1.2) * 0.3 + seg(t, 5.0, 5.8) * 0.3;
    W.mixSpeed = 1 + seg(t, 0, 1) * 4 - seg(t, 5, 6) * 4;
    if (t > 1.2 && t < 5.0) {
      W.mixer.localToWorld(tmp.set(-1.38, 0.12, 0));
      concrete.stream(1 / 60, 90, tmp, new V3(0.6, -1, 0).normalize(), 0.9, 0.3);
    }
    W.slab.scale.y = 1 + seg(t, 1.2, 5.0) * 1.6;
    W.slab.position.y = 0.05 * W.slab.scale.y;
    // the roller lays a fresh, shiny strip
    const r = seg(t, 2.0, 7.5, x => x);
    const x0 = -0.9, x1 = 1.2;
    const prev = W.roller.position.x;
    W.roller.position.x = lerp(x0, x1, r);
    W.roller.userData.parts.drum.rotation.z -= (W.roller.position.x - prev) / 0.2;
    const tail = W.roller.position.x - 0.5;
    W.asphalt.scale.x = Math.max(0.01, tail - -1.35);
    W.asphalt.position.x = (-1.35 + tail) / 2;
    return t > 8;
  }, () => {
    W.mixer.userData.parts.chute.rotation.z = 0; W.mixSpeed = 1;
    W.slab.scale.y = 1; W.slab.position.y = 0.05;
    W.roller.position.x = -0.9; W.asphalt.scale.x = 0.45; W.asphalt.position.x = -1.13;
  });
  W.mixSpeed = 1;
  updaters.push(dt => { if (W.mixer) W.mixer.userData.parts.drum.rotation.x += dt * 1.2 * W.mixSpeed; });

  // fire on the dock: burns while this page is open, until it's put out
  W.fireLevel = 1;
  // seen from the land side: fire truck in front, the burning shed and the
  // fireboat behind it (from the sea side the shed hid the truck)
  S('fire', { t: [-7.8, 0.8, 9.8], d: 9.5, yaw: 0.3, pitch: 0.4 }, t => {
    const P = W.fireTruck.userData.parts, B = W.fireboat.userData.parts;
    P.turret.rotation.y = seg(t, 0, 1.2) * 0.5;
    P.ladder.rotation.z = seg(t, 0.6, 2.0) * 0.72;
    P.fly.position.x = seg(t, 1.6, 3.0) * 1.0;
    B.mon0.rotation.y = Math.PI / 2 - 0.2 + Math.sin(t * 1.5) * 0.08;
    B.mon1.rotation.y = Math.PI / 2 + 0.1 + Math.sin(t * 1.2) * 0.1;
    const spraying = t > 3.0 && t < 9.5;
    if (spraying) {
      P.tip.getWorldPosition(tmp);
      tmp2.set(1, 0, 0).transformDirection(P.tip.matrixWorld); tmp2.y -= 0.25; tmp2.normalize();
      water.stream(1 / 60, 110, tmp, tmp2, 3.0, 0.08);
      [B.mon0, B.mon1].forEach(m => {
        m.getWorldPosition(tmp);
        tmp2.set(1, 0, 0).transformDirection(m.matrixWorld); tmp2.y = 0.9; tmp2.normalize();
        water.stream(1 / 60, 90, tmp, tmp2, 4.2, 0.1);
      });
    }
    if (t > 4.5) W.fireLevel = Math.max(0, 1 - seg(t, 4.5, 9.0, x => x));
    if (t > 9.5) {
      P.fly.position.x = 1.0 - seg(t, 9.5, 10.6);
      P.ladder.rotation.z = 0.72 * (1 - seg(t, 10.2, 11.6));
      P.turret.rotation.y = 0.5 * (1 - seg(t, 10.8, 12));
    }
    return t > 12.2;
  }, () => {
    const P = W.fireTruck.userData.parts;
    P.turret.rotation.y = 0; P.ladder.rotation.z = 0; P.fly.position.x = 0;
    W.fireLevel = 1;
  }, { active: true });
  updaters.push((dt, t, active) => {
    if (active !== 'fire' || W.fireLevel <= 0) return;
    const f = W.fireLevel;
    tmp.set(-7.85 + (Math.random() - 0.5) * 1.4, QUAY_Y + 1.45 + Math.random() * 0.3, 8.9 + (Math.random() - 0.5) * 1.2);
    fire.stream(dt, 90 * f, tmp, new V3(0, 1, 0), 0.7, 0.6);
    smoke.stream(dt, 14 * f, tmp.set(-7.85, QUAY_Y + 2.0, 8.9), new V3(0.15, 1, 0), 0.7, 0.4);
  });

  S('police', { t: [-1.2, 0.4, 1.3], d: 6.5, yaw: 0.25, pitch: 0.38 }, t => {
    W.sirenFast = t < 11;
    // tow truck reverses up, lifts the car, tows it away
    const back = seg(t, 0, 3.5, easeOut);
    const xr = lerp(-5.0, -1.74, back);
    const lift = seg(t, 4.0, 5.2);
    const go = seg(t, 5.8, 10, x => x * x * (3 - 2 * x));
    const prev = W.tow.position.x;
    const xt = xr - go * 3.2;
    W.tow.position.x = xt; spin(W.tow, -(xt - prev));
    W.tow.userData.parts.lift.position.y = 0.12 + lift * 0.06;
    W.tow.userData.parts.lift.rotation.z = -lift * 0.1;
    if (t > 5.2 || lift > 0) {
      W.broken.position.x = -0.4 - go * 3.2;
      W.broken.position.y = lift * 0.09;
      W.broken.rotation.z = lift * 0.16;
      spin(W.broken, -(xt - prev));
    }
    return t > 11;
  }, () => {
    W.sirenFast = false;
    place(W.tow, -5.0, 1.28, Math.PI); W.tow.userData.parts.lift.position.y = 0.12; W.tow.userData.parts.lift.rotation.z = 0;
    place(W.broken, -0.4, 1.28, Math.PI);
  });

  S('hospital', { t: [3.6, 1.2, 2.8], d: 9, yaw: 0.05, pitch: 0.42 }, t => {
    // helicopter comes down onto the roof, ambulance pulls up to the door
    const d = seg(t, 0, 6, easeOut);
    W.heli.position.set(W.heliPad.x - (1 - d) * 4, W.heliPad.y + (1 - d) * 5, W.heliPad.z - (1 - d) * 3);
    W.heli.rotation.set((1 - d) * 0.12, 0.6 + (1 - d) * 0.4, 0);
    W.rotor = t < 7 ? 1 : Math.max(0, 1 - (t - 7) / 3);
    W.ambPath.at(W.amb, W.ambPath.len * seg(t, 1.0, 7.0, x => 1 - Math.pow(1 - x, 2)));
    W.ambFast = t < 7.5;
    return t > 10;
  }, () => {
    W.heli.position.copy(W.heliPad); W.heli.rotation.set(0, 0.6, 0); W.rotor = 0; W.ambFast = false;
    W.ambPath.at(W.amb, W.ambPath.len);
  });
  W.rotor = 0;
  updaters.push(dt => {
    if (!W.heli) return;
    const P = W.heli.userData.parts;
    P.rotor.rotation.y += dt * 26 * W.rotor; P.trotor.rotation.z += dt * 40 * W.rotor;
  });

  S('bus', { t: [10.2, 0.5, 1.3], d: 7, yaw: 0.15, pitch: 0.34 }, t => {
    // garbage truck empties the bin; bus stops, riders board, bus leaves;
    // the traveller takes the taxi to the airport
    const G = W.garbage.userData.parts;
    const out = seg(t, 0, 0.8), up = seg(t, 0.8, 1.6), down = seg(t, 2.4, 3.2), back = seg(t, 3.2, 3.9);
    G.arm.scale.z = 1 + out * 0.4 - back * 0.4;
    G.grab.position.y = (up - down) * 0.42;
    W.bin.position.set(6.45, (up - down) * 0.42, 0.22 + out * 0.02);
    W.bin.rotation.x = -(up - down) * 1.9 * seg(t, 1.2, 1.6);
    const arrive = seg(t, 0, 3.0, easeOut), leave = seg(t, 6.0, 9.5, easeIn);
    const xb = lerp(14.0, 9.3, arrive) - leave * 6.5;
    const prev = W.bus.position.x;
    W.bus.position.x = xb; spin(W.bus, -(xb - prev));
    W.riders.forEach((p, i) => {
      const k = seg(t, 3.2 + i * 0.6, 4.0 + i * 0.6);
      p.position.set(lerp(8.8 + i * 0.22, 9.85, k), 0, lerp(1.95, 1.5, k));
      p.visible = k < 0.98;
    });
    const walk = seg(t, 6.0, 7.4);
    W.traveller.position.set(12.1, 0, lerp(0.2, 0.5, walk));
    W.case.position.set(12.0, 0, lerp(0.26, 0.55, walk));
    W.traveller.visible = W.case.visible = walk < 0.98;
    const tg = seg(t, 7.8, 11.5, easeIn);
    const prevT = W.taxi.position.x;
    W.taxi.position.x = 12.2 + tg * 7;
    spin(W.taxi, W.taxi.position.x - prevT);
    return t > 11.6;
  }, () => {
    place(W.bus, 9.3, 1.28, Math.PI);
    W.garbage.userData.parts.arm.scale.z = 1; W.garbage.userData.parts.grab.position.y = 0;
    place(W.bin, 6.45, 0.22, 0);
    W.riders.forEach((p, i) => { p.position.set(8.8 + i * 0.22, 0, 1.95); p.visible = true; });
    W.traveller.position.set(12.1, 0, 0.2); W.case.position.set(12.0, 0, 0.26);
    W.traveller.visible = W.case.visible = true;
    place(W.taxi, 12.2, 0.72, 0);
  });

  // quick launch (0–12 %), flat out at constant speed, short braking (last 15 %)
  const LV = 1 / (1 - (0.12 + 0.15) / 2);
  const launch = x => x < 0.12 ? LV * x * x / 0.24 : x > 0.85 ? 1 - LV * (1 - x) * (1 - x) / 0.3 : LV * (x - 0.06);
  S('race', { t: [14.3, 0, 8.3], d: 13, yaw: 0.05, pitch: 0.58 }, t => {
    // five red lights on one by one, lights out, two laps, chequered flag
    W.startLights.forEach((m, i) => { m.emissiveIntensity = t > 0.15 + i * 0.22 && t < 1.45 ? 2.2 : 0.02; });
    const go = t - 1.45;
    W.racers.forEach(([o, s0, off, T]) => {
      // two laps: hard launch, flat out, ease to a stop back on the grid
      const s = go <= 0 ? s0 : s0 + 2 * LAP * seg(go, 0, T, launch);
      trackAt(o, s, off);
    });
    W.flag.visible = go > 4.3;
    if (W.flag.visible) W.flag.rotation.y = Math.sin(t * 9) * 0.5;
    return t > 8.6;
  }, () => {
    W.startLights.forEach(m => { m.emissiveIntensity = 0.02; });
    W.racers.forEach(([o, s, off]) => { o.userData.trackS = null; trackAt(o, s, off); });
    W.flag.visible = false;
  });

  // jet: pushback, taxi, line up, take off over the harbour
  // pushback: tail-first, swinging the tail west so the nose ends up facing
  // east along the taxiway; then taxi east, turn onto the runway facing west
  // It now departs EASTWARD: taking off west sent it straight through the
  // downtown towers. Pushback swings the tail east (nose west), it taxis to
  // the west end of the runway, lines up facing east and climbs out over
  // the empty edge of the book.
  const pushPath = new Path([[10.6, -5.9], [10.6, -7.2], [11.2, -8.5], [12.0, -8.8]]);
  const taxiPath = new Path([[12.0, -8.8], [10.6, -8.8], [9.5, -8.8], [8.8, -9.5], [8.8, -10.5], [9.3, -11.0], [10.0, -11.0]]);
  S('jet', { t: [12.6, 0.8, -6.8], d: 15, yaw: 0.35, pitch: 0.42 }, t => {
    const J = W.jet, gy = J.userData.groundY;
    if (t < 3.5) {
      pushPath.at(J, pushPath.len * seg(t, 0, 3.5), gy, true);
      // the tug stays on the nose wheel
      J.localToWorld(tmp.set(2.9, 0, 0)); W.ptug.position.set(tmp.x, 0, tmp.z); W.ptug.rotation.y = J.rotation.y + Math.PI;
    } else if (t < 4.4) {
      // tug unhooks and drives back to the gate
      const k = seg(t, 3.5, 4.4);
      J.localToWorld(tmp.set(2.9, 0, 0));
      W.ptug.position.set(lerp(tmp.x, 10.6, k), 0, lerp(tmp.z, -3.0, k));
      W.ptug.rotation.y = lerp(J.rotation.y + Math.PI, Math.PI / 2, k);
    } else if (t < 9.5) {
      taxiPath.at(J, taxiPath.len * seg(t, 4.4, 9.5, x => x * x * (3 - 2 * x)), gy);
    } else {
      // take-off roll along the runway toward +x, rotate, climb out east
      const roll = seg(t, 9.5, 14, easeIn);
      const climb = seg(t, 13.2, 20, x => x);
      const x = lerp(10.0, 16.6, roll) + climb * 30;
      const y = gy + Math.pow(climb, 1.3) * 10;
      J.position.set(x, y, L.runwayZ - climb * 2.0);
      J.rotation.set(0, 0, seg(t, 12.8, 13.8) * 0.18 - seg(t, 17, 20) * 0.08);
      J.userData.parts.gear.scale.y = 1 - seg(t, 14.2, 15.4);
    }
    return t > 20;
  }, () => { W.jetRest(); place(W.ptug, 10.6, -3.0, Math.PI / 2); }, {
    follow: t => (t > 10 ? W.jet.position : null)
  });

  S('cargo', { t: [16.2, 0.7, -3.6], d: 11, yaw: 0.4, pitch: 0.4 }, t => {
    const C = W.cargo.userData.parts, Ld = W.loader.userData.parts;
    C.nose.rotation.z = seg(t, 0, 2.4) * 1.05 - seg(t, 8.6, 10.6) * 1.05;
    const up = seg(t, 2.2, 3.6) - seg(t, 7.2, 8.4);
    Ld.deck.position.y = 0.2 + up * 0.3; Ld.scissor.scale.y = 1 + up * 4;
    W.ulds.forEach((u, i) => {
      const k = seg(t, 3.8 + i * 1.2, 5.0 + i * 1.2);
      W.loader.localToWorld(tmp.set(-0.15 + i * 0.35, 0.2 + up * 0.3 + 0.16, 0));
      u.position.set(tmp.x, tmp.y, tmp.z - k * 1.4);
      u.visible = k < 0.95;
    });
    // water salute from the crash tender
    const T = W.tender.userData.parts;
    T.mon.rotation.y = Math.sin(t * 0.8) * 0.15;
    T.nozzle.rotation.z = 0.7;
    if (t > 1.2 && t < 9.5) {
      T.nozzle.getWorldPosition(tmp);
      tmp2.set(1, 0, 0).transformDirection(T.nozzle.matrixWorld).normalize();
      water.stream(1 / 60, 120, tmp, tmp2, 5.2, 0.06);
    }
    return t > 10.8;
  }, () => {
    const C = W.cargo.userData.parts, Ld = W.loader.userData.parts;
    C.nose.rotation.z = 0; Ld.deck.position.y = 0.2; Ld.scissor.scale.y = 1;
    W.ulds.forEach((u, i) => { W.loader.localToWorld(tmp.set(-0.15 + i * 0.35, 0.36, 0)); u.position.copy(tmp); u.visible = true; });
  });

  S('evening', { t: [0, 0, -0.5], d: 56, yaw: 0.1, pitch: 0.66 }, t => {
    for (let i = 0; i < 7; i++) {
      const tb = 0.3 + i * 0.85;
      if (crossed('eve', t, tb)) {
        const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.62);
        tmp.set(-15 + Math.random() * 12, 8 + Math.random() * 4, -9 + Math.random() * 12);
        for (let k = 0; k < 90; k++) {
          const v = new V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2.2 + Math.random() * 0.6);
          sparks.emit(tmp, v, c);
        }
      }
    }
    lastT.eve = t;
    return t > 7.5;
  }, () => { lastT.eve = null; }, { night: 1 });

  // --- ambient life ---------------------------------------------------------------
  let smokeAcc = 0;
  updaters.push((dt, t, active) => {
    // funnels and exhausts: a thin drift, more on the page in focus
    smokeAcc += dt;
    if (smokeAcc > 0.25) {
      smokeAcc = 0;
      smokers.forEach(s => {
        const v = s.userData.funnel || null;
        if (v) smoke.emit(s.localToWorld(tmp.copy(v)), new V3(0.15, 0.5, 0));
      });
    }
    // blinking emergency lights (faster when their page is playing)
    const fast = (on, rate) => (Math.sin(t * rate) > 0);
    const blink = (o, rate, alwaysOn = true) => {
      if (!o || !o.userData.lamps) return;
      const [a, b] = o.userData.lamps;
      const ph = fast(true, rate);
      a.emissiveIntensity = alwaysOn ? (ph ? 2.4 : 0.1) : 0.1;
      if (b) b.emissiveIntensity = alwaysOn ? (ph ? 0.1 : 2.4) : 0.1;
    };
    blink(W.police, W.sirenFast ? 18 : 7);
    blink(W.amb, W.ambFast ? 18 : 6, true);
    blink(W.fireTruck, 9);
    blink(W.fireboat, 6);
    blink(W.tow, 8);
    blink(W.tender, 7);
    if (W.broken) W.broken.userData.lamps[0].emissiveIntensity = Math.sin(t * 6) > 0 ? 2 : 0.1;
    if (W.garbage) blink(W.garbage, 7);
    // town traffic
    if (W.traffic) W.traffic.forEach(c => { c.userData.s += dt * 0.9; W.ring.at(c, c.userData.s); });
    // the overflying plane: every ~40 s, high across the sky
    if (W.flyer) {
      const p = (t % 40) / 40;
      W.flyer.visible = p < 0.45;
      W.flyer.position.set(lerp(-34, 34, p / 0.45), 9.5 + p * 4, -15);
      W.flyer.rotation.set(0, 0, 0.04);
    }
    // flag cloth ripple
    if (W.flagGeo && W.flag.visible) {
      const pa = W.flagGeo.attributes.position;
      for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 20 - t * 12) * 0.02 * pa.getX(i) * 4);
      pa.needsUpdate = true;
    }
  });

  return {
    root, chunks, stops, night, W,
    update(dt, t, active) { updaters.forEach(u => u(dt, t, active)); }
  };
}

// small tileable normal map from a few summed waves
function rippleNormals() {
  const N = 128, [c, g] = canvas(N, N), img = g.createImageData(N, N);
  // many small waves in different directions, so the tiling doesn't read as a pattern
  const waves = [[3, 1, 0.3], [1, 4, 1.1], [5, -2, 2.0], [-2, 3, 0.7], [7, 5, 2.6], [-6, 4, 1.7], [9, -3, 0.2],
    [2, -8, 2.9], [-11, -5, 1.3], [13, 7, 0.8], [-4, 12, 2.2], [15, -9, 1.9]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let dx = 0, dy = 0;
    waves.forEach(([kx, ky, ph]) => {
      const a = 2 * Math.PI * (kx * x + ky * y) / N + ph, k = 1 / Math.hypot(kx, ky);
      const amp = 0.5 / Math.sqrt(Math.hypot(kx, ky));
      dx += Math.cos(a) * kx * k * amp; dy += Math.cos(a) * ky * k * amp;
    });
    const nx = -dx, ny = -dy, nz = 1, l = Math.hypot(nx, ny, nz);
    const i = (y * N + x) * 4;
    img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
    img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, { repeat: true, srgb: false });
}

window.CITY.buildWorld = buildWorld;
})();
