// HOW THINGS WORK AT HOME: the clay renderer.
//
// Each page is a normal object page; build() returns a transparent
// placeholder <svg data-clay3d data-machine="i">. When the engine mounts it,
// one shared WebGL canvas is laid over it (same trick as books/space), so
// the page tilt and layout work as usual. Only clay and its soft contact
// shadow are drawn; the book page shows everywhere else.
//
// Clay = a signed distance field of up to 16 simple pieces (ellipsoid,
// rounded box, capsule, torus, rounded cylinder upright or facing us) joined
// by smooth union, colours marbling where they meet. A machine is a list of
// pieces (machines.js). Turning the page morphs the machine you came from
// into the new one, slot by slot: pieces of the same kind flow into each
// other, different kinds blend their shapes, missing ones grow out of / sink
// into the body. Everything updates and renders 12 pictures a second (on
// twos) with a fresh surface "boil" each picture. After the morph the
// machine runs its loop; it plays its action once, and again on every tap.
(function () {
'use strict';
const THREE = window.THREE;

// ---- tune by eye -------------------------------------------------------------
const STEP = 1 / 12;
const MORPH = { delay: 0.12, stagger: 0.045, dur: 0.75, flow: 0.45, settle: 1.45 };
const AUTO_ACT = 0.35;             // seconds after settling before the first action
const CAM = { pos: [0.27, 1.47, 4.9], target: [0.05, 1.0, 0], fov: 34 };   // closer = bigger machines
const SHADOW_DARK = 0.42, EDGE_FADE = 0.1;
const N = 16;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeBack = t => { t = clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
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
const QUALITY = [
  { steps: 56, shadow: 12, ao: 2, dpr: 0.75 },
  { steps: 80, shadow: 20, ao: 3, dpr: 1 },
  { steps: 110, shadow: 28, ao: 4, dpr: 1.5 }
][Math.max(0, TIER)];

const TYPES = { ell: 1, box: 2, cap: 3, tor: 4, cyl: 5, cylz: 6 };

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec4 uA[${N}], uB[${N}], uC[${N}], uD[${N}];
uniform vec4 uA2[${N}], uB2[${N}], uC2[${N}], uD2[${N}];
uniform float uM[${N}];
uniform vec4 uG;                       // squash x, squash y, shift x, -
uniform float uSeed, uSteps, uShadowSteps, uAO, uFocal, uShadowDark, uEdge;
uniform vec3 uCam, uTgt;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdRCyl(vec3 q, float ra, float h, float rr) {
  float rb = min(rr, min(ra, h) * 0.98);
  vec2 d = vec2(length(q.xz) - ra + rb, abs(q.y) - h + rb);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}
float prim(vec3 p, vec4 A, vec4 B, vec4 D) {
  float t = A.w;
  if (t > 2.5 && t < 3.5) {                                    // capsule A.xyz -> B.xyz, radius B.w
    vec3 pa = p - A.xyz, ba = B.xyz - A.xyz;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h) - max(B.w, 0.002);
  }
  vec3 q = p - A.xyz;
  float cy = cos(D.z), sy = sin(D.z); q.xz = mat2(cy, -sy, sy, cy) * q.xz;
  float cz = cos(D.x), sz = sin(D.x); q.xy = mat2(cz, -sz, sz, cz) * q.xy;
  vec3 s = max(B.xyz, vec3(0.002));
  if (t < 1.5) return sdEllipsoid(q, s);
  if (t < 2.5) return sdRoundBox(q, s, min(B.w, min(s.x, min(s.y, s.z)) * 0.98));
  if (t < 4.5) {                                               // torus: B.x ring, B.y tube, B.z axis 0 Y / 1 Z / 2 X
    vec2 r = B.z < 0.5 ? vec2(length(q.xz) - B.x, q.y) : (B.z < 1.5 ? vec2(length(q.xy) - B.x, q.z) : vec2(length(q.yz) - B.x, q.x));
    return length(r) - max(B.y, 0.002);
  }
  if (t < 5.5) return sdRCyl(q, s.x, s.y, B.w);                // upright cylinder
  return sdRCyl(q.xzy, s.x, s.y, B.w);                         // cylinder facing the camera
}

// x: distance, yzw: colour; emissive returned through 'em'
vec4 scene(vec3 p, bool col, out float em) {
  p.x -= uG.z;
  p.xz /= uG.x; p.y /= uG.y;
  float sc = min(uG.x, uG.y);
  vec4 r = vec4(1e3, 0.8, 0.8, 0.8);
  em = 0.0;
  for (int i = 0; i < ${N}; i++) {
    if (uA[i].w < 0.5) continue;
    float d = prim(p, uA[i], uB[i], uD[i]);
    vec3 c = uC[i].rgb; float k = uC[i].w; float e = uD[i].y;
    if (uM[i] < 0.999) {
      float d2 = prim(p, uA2[i], uB2[i], uD2[i]);
      d = mix(d2, d, uM[i]); c = mix(uC2[i].rgb, c, uM[i]); k = mix(uC2[i].w, k, uM[i]); e = mix(uD2[i].y, e, uM[i]);
    }
    k = max(k, 0.002);
    float h = clamp(0.5 + 0.5 * (d - r.x) / k, 0.0, 1.0);     // 1 = keep what we had
    float dd = mix(d, r.x, h) - k * h * (1.0 - h);
    if (col) {
      float hc = clamp(h + (noise(p * 13.0) - 0.5) * 2.4 * h * (1.0 - h), 0.0, 1.0);
      r.yzw = mix(c, r.yzw, hc); em = mix(e, em, hc);
    }
    r.x = dd;
  }
  if (r.x < 0.06) {                                           // lumps, boil, a fingerprint
    float n = noise(p * 9.0 + uSeed) * 0.6 + noise(p * 23.0 + uSeed * 1.7) * 0.4;
    r.x += (n - 0.5) * 0.012;
    vec3 f1 = p - vec3(-0.25, 0.95, 0.55);
    r.x += sin(length(f1) * 150.0) * 0.0016 * smoothstep(0.22, 0.0, length(f1));
  }
  r.x *= sc;
  return r;
}
float map(vec3 p) { float e; return scene(p, false, e).x; }
vec3 normal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float shadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 40; i++) {
    if (float(i) >= uShadowSteps) break;
    float h = map(ro + rd * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.02, 0.25);
    if (res < 0.01 || t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++) {
    if (float(i) > uAO) break;
    float h = 0.04 * float(i) * float(i);
    o += (h - map(p + n * h)) * w; w *= 0.6;
  }
  return clamp(1.0 - o * 2.2, 0.0, 1.0);
}
float edgeMask() {
  vec2 e = gl_FragCoord.xy / uRes;
  vec2 m = smoothstep(vec2(0.0), vec2(uEdge), e) * smoothstep(vec2(0.0), vec2(uEdge), 1.0 - e);
  return m.x * m.y;
}
bool hitBound(vec3 ro, vec3 rd) {
  vec3 oc = ro - vec3(0.0, 1.1, 0.0);
  float b = dot(oc, rd), c = dot(oc, oc) - 2.7 * 2.7;
  return b * b - c > 0.0 && (b < 0.0 || c < 0.0);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCam, fw = normalize(uTgt - uCam), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw * uFocal + uv.x * rt + uv.y * up);
  vec3 L = normalize(vec3(-0.55, 0.85, 0.6));
  float tG = rd.y < 0.0 ? -ro.y / rd.y : 1e4;
  float t = 0.0, hit = -1.0;
  if (hitBound(ro, rd)) {
    t = max(0.0, length(ro - vec3(0.0, 1.1, 0.0)) - 2.75);
    for (int i = 0; i < 128; i++) {
      if (float(i) >= uSteps) break;
      float d = map(ro + rd * t);
      if (d < 0.0012 * t) { hit = t; break; }
      t += d * 0.9;
      if (t > tG || t > 14.0) break;
    }
  }
  if (hit > 0.0 && hit < tG) {
    vec3 p = ro + rd * hit;
    float em;
    vec4 sc = scene(p, true, em);
    vec3 n = normal(p);
    float sh = shadow(p + n * 0.01, L);
    float oc = ao(p, n);
    vec3 alb = sc.yzw;
    float dif = clamp((dot(n, L) + 0.45) / 1.45, 0.0, 1.0);
    vec3 key = vec3(1.0, 0.92, 0.80) * 1.45, sky = vec3(0.72, 0.80, 0.95) * 0.42, bounce = vec3(0.95, 0.82, 0.66) * 0.30;
    vec3 col = alb * (key * dif * mix(0.35, 1.0, sh) + sky * (0.55 + 0.45 * n.y) * oc + bounce * clamp(0.5 - 0.5 * n.y, 0.0, 1.0) * oc);
    col += alb * alb * (1.0 - dif) * 0.28 * oc;
    vec3 hv = normalize(L - rd);
    col += pow(clamp(dot(n, hv), 0.0, 1.0), 16.0) * 0.09 * sh * vec3(1.0, 0.95, 0.88);
    col += pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0) * 0.05 * sky;
    col = mix(col, alb * 1.25 + 0.15, clamp(em, 0.0, 1.0));     // glowing pieces
    gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), edgeMask());
  } else if (tG < 1e3) {
    vec3 p = ro + rd * tG;
    float near = 1.0 - smoothstep(2.2, 3.2, length(p.xz));
    float dark = 0.0;
    if (near > 0.0) {
      float sh = shadow(p + vec3(0, 0.002, 0), L);
      float oc = ao(p, vec3(0, 1, 0));
      dark = clamp((1.0 - sh) * 0.75 + (1.0 - oc) * 0.9, 0.0, 1.0) * near * uShadowDark;
    }
    gl_FragColor = vec4(0.16, 0.10, 0.05, dark * edgeMask());
  } else {
    gl_FragColor = vec4(0.0);
  }
}`;

// ---- pieces -> uniforms ---------------------------------------------------------
const linear = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };   // Color.set converts sRGB -> linear
function norm(p) {
  // a full, comparable record for any piece kind
  const o = { t: p.t, p: (p.p || p.a || [0, 0, 0]).slice(), s: (p.s || [0, 0, 0]).slice(), b: (p.b || [0, 0, 0]).slice(),
    r: p.r || 0, col: linear(p.c || '#cccccc'), k: p.k == null ? 0.06 : p.k, rz: p.rz || 0, ry: p.ry || 0, e: p.e || 0 };
  if (p.t === 'tor') o.s = [p.R || 0.3, p.r || 0.06, p.axis || 0];
  if (p.t === 'cyl' || p.t === 'cylz') o.s = [p.rad || 0.3, p.h || 0.2, 0];
  return o;
}
function pack(o, A, B, Cc, D) {
  const ty = TYPES[o.t] || 0;
  A.set(o.p[0], o.p[1], o.p[2], ty);
  if (o.t === 'cap') B.set(o.b[0], o.b[1], o.b[2], o.r);
  else if (o.t === 'tor') B.set(o.s[0], o.s[1], o.s[2], 0);
  else B.set(o.s[0], o.s[1], o.s[2], o.r);
  Cc.set(o.col[0], o.col[1], o.col[2], o.k);
  D.set(o.rz, o.e, o.ry, 0);
}
const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function lerpPiece(f, g, m, mp) {
  return { t: g.t, p: L3(f.p, g.p, mp), s: L3(f.s, g.s, m), b: L3(f.b, g.b, mp), r: lerp(f.r, g.r, m),
    col: L3(f.col, g.col, m), k: lerp(f.k, g.k, m), rz: lerp(f.rz, g.rz, m), ry: lerp(f.ry, g.ry, m), e: lerp(f.e, g.e, m) };
}
// the same piece shrunk to nothing at point c (to grow out of / sink into the body)
function seed(g, c) {
  const o = JSON.parse(JSON.stringify(g));
  const off = [c[0] - g.p[0], c[1] - g.p[1], c[2] - g.p[2]];
  o.p = c.slice();
  if (g.t === 'cap') o.b = [g.b[0] + off[0], g.b[1] + off[1], g.b[2] + off[2]].map((v, i) => lerp(c[i], v, 0.05));
  o.s = g.t === 'tor' ? [g.s[0] * 0.05, g.s[1] * 0.05, g.s[2]] : g.s.map(v => v * 0.05);
  o.r = g.r * 0.05;
  return o;
}
const centre = list => (list[0] ? list[0].p.slice() : [0, 0.6, 0]);

// ---- one shared renderer ------------------------------------------------------------
let renderer = null, uniforms = null, quad = null, ortho = null;
let active = null;
let lastMachine = null;                  // the machine shown before this one (to morph from)

const arr = () => Array.from({ length: N }, () => new THREE.Vector4());
function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uA: { value: arr() }, uB: { value: arr() }, uC: { value: arr() }, uD: { value: arr() },
    uA2: { value: arr() }, uB2: { value: arr() }, uC2: { value: arr() }, uD2: { value: arr() },
    uM: { value: new Float32Array(N).fill(1) }, uG: { value: new THREE.Vector4(1, 1, 0, 0) },
    uSeed: { value: 0 }, uSteps: { value: QUALITY.steps }, uShadowSteps: { value: QUALITY.shadow }, uAO: { value: QUALITY.ao },
    uFocal: { value: 1 / Math.tan(CAM.fov * Math.PI / 360) / 2 }, uShadowDark: { value: SHADOW_DARK }, uEdge: { value: EDGE_FADE },
    uCam: { value: new THREE.Vector3(...CAM.pos) }, uTgt: { value: new THREE.Vector3(...CAM.target) }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fragmentShader: FRAG,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending
  });
  quad = new THREE.Scene();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false; quad.add(m);
  ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}

// pieces for the current picture
function frame(s) {
  const M = window.ATHOME_MACHINES;
  const to = M[s.machine];
  const G = { sx: 1, sy: 1, jx: 0 };
  const t = s.t;
  // after the morph: the machine's own loop and action
  const settled = t - MORPH.settle;
  let target = to.pieces.map(norm);
  if (settled >= 0 && to.anim) {
    const raw = to.pieces.map(p => JSON.parse(JSON.stringify(p)));
    to.anim(raw, settled, s.act, G, s.frame);
    target = raw.map(norm);
  }
  // squash before the morph, a stretch while it flows, a wobble to settle
  const bump = (a, b) => smooth(a, (a + b) / 2, t) * (1 - smooth((a + b) / 2, b, t));
  if (s.from) {
    G.sy *= 1 - 0.18 * bump(0, 0.3) + 0.12 * bump(0.25, 1.0);
    if (t > MORPH.settle - 0.35) G.sy *= 1 + Math.sin((t - MORPH.settle + 0.35) * 22) * 0.05 * Math.exp(-(t - MORPH.settle + 0.35) * 5);
  }
  G.sx = 1 / Math.sqrt(G.sy);
  const out = [];
  if (!s.from || t >= MORPH.settle) {
    target.forEach(g => out.push({ main: g, m: 1 }));
  } else {
    const from = s.from.map(norm);
    const cF = centre(from), cT = centre(target);
    for (let i = 0; i < Math.max(from.length, target.length); i++) {
      const u = clamp((t - MORPH.delay - i * MORPH.stagger) / MORPH.dur, 0, 1);
      const m = easeBack(u), mp = ease(u);
      let f = from[i], g = target[i];
      if (!f && !g) continue;
      if (!f) f = seed(g, cF);
      if (!g) g = seed(f, cT);
      // mass flows through the body: pieces dip toward the centre mid-way
      const pull = MORPH.flow * Math.sin(Math.PI * mp);
      const mid = L3(cF, cT, mp);
      if (f.t === g.t) {
        const o = lerpPiece(f, g, m, mp);
        o.p = L3(o.p, mid, pull * (i ? 1 : 0.3));
        if (o.t === 'cap') o.b = L3(o.b, mid, pull);
        out.push({ main: o, m: 1 });
      } else {
        const a = JSON.parse(JSON.stringify(f)), b = JSON.parse(JSON.stringify(g));
        a.p = L3(a.p, mid, pull); b.p = L3(b.p, mid, pull);
        out.push({ main: b, alt: a, m: clamp(mp, 0, 1) });
      }
    }
  }
  return { out, G };
}

function draw(s) {
  const c = s.svg.parentNode;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * QUALITY.dpr * (s.quality || 1));
  renderer.setSize(c.clientWidth || 300, c.clientHeight || 300, false);
  uniforms.uRes.value.copy(renderer.getDrawingBufferSize(new THREE.Vector2()));
  const { out, G } = frame(s);
  const U = uniforms;
  for (let i = 0; i < N; i++) {
    const it = out[i];
    if (!it) { U.uA.value[i].set(0, 0, 0, 0); U.uM.value[i] = 1; continue; }
    pack(it.main, U.uA.value[i], U.uB.value[i], U.uC.value[i], U.uD.value[i]);
    if (it.alt) pack(it.alt, U.uA2.value[i], U.uB2.value[i], U.uC2.value[i], U.uD2.value[i]);
    U.uM.value[i] = it.alt ? it.m : 1;
  }
  U.uG.value.set(G.sx, G.sy, G.jx, 0);
  U.uSeed.value = (s.frame % 997) * 0.37;
  renderer.render(quad, ortho);
}

function mount(svg) {
  if (TIER < 0) return;
  if (!renderer) setup();
  const M = window.ATHOME_MACHINES, i = +svg.getAttribute('data-machine');
  const layer = svg.parentNode;
  if (getComputedStyle(layer).position === 'static') layer.style.position = 'relative';
  layer.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', M[i].label || 'A clay machine.');
  // morph from the machine shown before (a lump on the first page)
  const from = lastMachine != null && lastMachine !== i ? M[lastMachine].pieces : window.ATHOME_LUMP;
  lastMachine = i;
  active = { svg, machine: i, from, t: 0, acc: 0, frame: 0, act: -1, quality: 1, autoDone: false };
  draw(active);
}

let slow = 0, last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const s = active;
  if (!s || document.hidden) return;
  if (!s.svg.isConnected) { active = null; return; }
  s.t += dt; s.acc += dt;
  let tick = false;
  while (s.acc >= STEP) {
    s.acc -= STEP; s.frame++; tick = true;
    const M = window.ATHOME_MACHINES[s.machine];
    if (!s.autoDone && s.t > MORPH.settle + AUTO_ACT) { s.autoDone = true; s.act = 0; }
    if (s.act >= 0) { s.act += STEP; if (s.act > (M.actTime || 2.4)) s.act = -1; }
  }
  if (tick) {
    const t0 = performance.now();
    draw(s);
    slow = performance.now() - t0 > 40 ? slow + 1 : Math.max(0, slow - 0.5);
    if (slow > 6 && s.quality > 0.5) { s.quality *= 0.8; slow = 0; }
  }
}
requestAnimationFrame(loop);

new MutationObserver(() => {
  // the shown picture, not the next page's copy parked by the prerender
  const svg = [...document.querySelectorAll('.obj-host .layer > svg[data-clay3d]')].find(s => !s.closest('.obj-prerender'));
  if (svg && (!active || active.svg !== svg)) mount(svg);
}).observe(document.documentElement, { childList: true, subtree: true });

function hostOf(t) {
  const h = t && t.closest ? t.closest('.obj-host') : null;
  return h && h.querySelector('svg[data-clay3d]') ? h : null;
}
function act() {
  if (!active) return;
  if (active.t < MORPH.settle) active.t = MORPH.settle;
  active.autoDone = true;
  active.act = 0;
}
window.addEventListener('picture-activate', e => { if (hostOf(e.target)) act(); });
window.addEventListener('pointerdown', e => { if (hostOf(e.target)) act(); }, true);
window.addEventListener('pagehide', () => { if (renderer) { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* leaving */ } } });

window.buildClayMachine = function (i) {
  return `<svg data-clay3d data-machine="${i}" viewBox="0 0 300 300" data-fit="0 0 300 300" data-hit="40 20 220 260" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="none"/></svg>`;
};
window.ATHOME_KIT = { clamp, lerp, ease, easeBack, smooth };
})();
