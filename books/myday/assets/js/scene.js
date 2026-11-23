// MY DAY: the live scene behind window.BOOK_SCENE (storybook.js).
//
// One WebGL canvas, mounted once. Story steps, as books/longway: every page
// is ONE step (`step: 'arrive'`: the camera flies to the stop while the boy
// walks there; `step: 'act'`: the stop's routine) and plays on its own when
// the page is turned to; back plays it in reverse. A jump of more than one
// page (first / last buttons) sets that page's state at once, no replay.
// Tap / Space / Enter: finishes a running step and turns to the next page.
// The time of day slides with the page (dawn -> morning -> noon -> afternoon
// -> evening -> night: sun arc, sky colour, lit windows, street lamps, stars).
//
// Load: the board is built before the first frame, the rest one chunk per
// frame, then the shaders are compiled (compileAsync). Without WebGL the
// scene shows a still picture (cover.svg) instead.
(function () {
'use strict';
const C = window.MYDAY || {};

// --- key numbers -------------------------------------------------------------
const DPR_CAP = 2;
const DPR_TIER = [1.25, 1.5, 2];          // pixel ratio per quality tier
const SHADOW_TIER = [1024, 2048, 2048];
const FOV = 32;
const TOD_RATE = 0.7;                     // how fast the time of day catches up (per s)
const FOLLOW_W = 0.7;                     // how much the camera follows the boy outdoors
const HOUSE_LIGHT = 9, BED_LIGHT = 4, SCHOOL_LIGHT = 9;
const STILL = 'cover.svg';
// time-of-day keys: t 0 dawn .. 1 night
const TOD = [
  { t: 0.0,  sky: 0xf4c7a6, elev: 0.1,   sun: 0xffb27a, sunI: 1.6, hemi: 0xc4bedc, hemiI: 0.5,  env: 0.35, night: 0.55 },
  { t: 0.2,  sky: 0xc4e2f2, elev: 0.55,  sun: 0xfff0d8, sunI: 2.7, hemi: 0xdfeeff, hemiI: 0.62, env: 0.5,  night: 0.05 },
  { t: 0.42, sky: 0xa8d6f4, elev: 1.1,   sun: 0xffffff, sunI: 3.0, hemi: 0xe4f2ff, hemiI: 0.65, env: 0.55, night: 0 },
  { t: 0.6,  sky: 0xb3d8ee, elev: 0.7,   sun: 0xfff0d0, sunI: 2.8, hemi: 0xdfeeff, hemiI: 0.6,  env: 0.5,  night: 0 },
  { t: 0.8,  sky: 0xf2a983, elev: 0.12,  sun: 0xff9a5a, sunI: 1.7, hemi: 0xc8a8cc, hemiI: 0.45, env: 0.35, night: 0.55 },
  { t: 0.9,  sky: 0x4f5186, elev: -0.08, sun: 0x8f9ad8, sunI: 0.6, hemi: 0x5a6aa0, hemiI: 0.32, env: 0.2,  night: 0.9 },
  { t: 1.0,  sky: 0x141d3c, elev: -0.3,  sun: 0x8090d0, sunI: 0.45, hemi: 0x34447a, hemiI: 0.26, env: 0.14, night: 1 }
];
const SUN_X = 38;                         // the sun crosses from +x (dawn) to -x (evening)

const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const noTilt = window.matchMedia && window.matchMedia('(hover: none)').matches;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

let renderer, scene, camera, sun, hemi, world, host;
let built = false, ready = false, still = false, destroyed = false;
let activeKey = null;
let flight = null;
let tiltX = 0, tiltY = 0;
let todNow = 0, todTarget = 0;
let followW = 0;
let pendingShow = null;
let pageNow = null;                       // the page (story step) shown
let cur, followT;

function stopFor(i) {
  const pages = window.BOOK_PAGES || [];
  const p = pages[i] || {};
  const key = world.stops[p.stop] ? p.stop : 'wake';
  return { key, stop: world.stops[key], act: p.step === 'act' };
}
function camState(c) { return { t: new C.THREE.Vector3(...c.t), d: c.d, yaw: c.yaw, pitch: c.pitch }; }
function copyState(s) { return { t: s.t.clone(), d: s.d, yaw: s.yaw, pitch: s.pitch }; }

function show(i, { instant } = {}) {
  if (still) return;
  if (!world) { pendingShow = [i, instant]; return; }
  const { key, stop, act } = stopFor(i);
  const changed = key !== activeKey;
  const first = activeKey == null;
  // a jump of more than one page (first / last buttons): set the state at once
  const leap = !!instant || first || Math.abs(i - pageNow) > 1;
  const dir = pageNow == null || i >= pageNow ? 1 : -1;
  pageNow = i;
  activeKey = key;
  todTarget = stop.tod;
  world.setStep(key, act, { instant: leap, dir });
  const to = camState(stop.cam);
  if (leap || reduceMotion && !flight) {
    Object.assign(cur, copyState(to));
    todNow = todTarget;
    flight = null; followW = stop.follow ? FOLLOW_W : 0;
    world.boyPos(followT);
    return;
  }
  if (!changed) return;
  const { clamp } = C;
  const from = copyState(cur);
  const jump = from.t.distanceTo(to.t);
  // long hops lift up over the town on the way; short hops just arc
  const lift = jump > 8 ? Math.min(14, jump * 0.5) : jump * 0.35;
  const pitchLift = jump > 8 ? 0.22 : 0.06;
  let dyaw = to.yaw - from.yaw;
  dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
  to.yaw = from.yaw + dyaw;
  flight = { from, to, u: 0, lift, pitchLift, dur: reduceMotion ? 0.5 : clamp(1.2 + jump * 0.05, 1.2, 2.4) };
}

// tap / Space / Enter: finishes a running step at once and turns
// turns on (as webgl-stage.js: a synthetic ArrowRight for storybook.js)
function play() {
  if (still || !world) return;
  if (flight || world.running()) {
    if (flight) { Object.assign(cur, copyState(flight.to)); flight = null; }
    todNow = todTarget;
    world.snap();                 // finish this step cleanly, then go straight on
  }
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
}

function showStill() {
  still = true;
  const img = document.createElement('img');
  img.src = STILL;
  img.alt = 'A toy town: a boy\u2019s house, the road, the school and the playground.';
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;';
  host.appendChild(img);
  host.classList.add('is-ready');
}

function mount(el) {
  host = el;
  if (!C.THREE || !C.buildWorld || !webglOK()) { showStill(); return; }
  const { THREE, TIER } = C;
  const { RoomEnvironment } = THREE;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: TIER > 0, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { showStill(); return; }
  cur = { t: new THREE.Vector3(), d: 8, yaw: 0, pitch: 0.4 };
  followT = new THREE.Vector3();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_TIER[TIER], DPR_CAP));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label',
    'A 3D toy town: a boy\u2019s house, the road, the school and the playground. Tap the scene to go on.');
  host.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(TOD[0].sky);
  scene.fog = new THREE.Fog(TOD[0].sky, 70, 170);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 220);
  sun = new THREE.DirectionalLight(0xfff1dc, 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_TIER[TIER], SHADOW_TIER[TIER]);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -20, near: 1, far: 90 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  hemi = new THREE.HemisphereLight(0xdfeeff, 0x7a6a50, 0.6);
  scene.add(sun, sun.target, hemi);
  world = C.buildWorld(scene);
  world.chunks.shift()();            // the board, before the first frame
  if (pendingShow) { const [i, inst] = pendingShow; pendingShow = null; show(i, { instant: inst !== false }); }
  const resize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.setViewOffset(w, h, 0, -h * 0.03, w, h);  // as books/city: room for the caption
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();
  requestAnimationFrame(loop);
}

// --- per-frame -----------------------------------------------------------------
let last = performance.now(), time = 0, slow = 0;
function loop(now) {
  if (destroyed) return;
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (document.hidden) return;       // paused while the tab is hidden
  time += dt;
  if (!built && world.chunks.length) {
    world.chunks.shift()();
    if (!world.chunks.length) {
      built = true;
      const warm = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve();
      warm.catch(() => {});
    }
  }
  updateFlight(dt);
  if (built) world.update(dt, time, !!flight);
  applyTime(dt, time);
  placeCamera(dt);
  renderer.render(scene, camera);
  if (!ready && built) { ready = true; host.classList.add('is-ready'); }
  // drop resolution a notch if frames run slow for a while
  slow = dt > 0.03 ? slow + dt : Math.max(0, slow - dt * 0.5);
  if (slow > 3 && renderer.getPixelRatio() > 1) {
    renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - 0.25));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    slow = 0;
  }
}

function updateFlight(dt) {
  if (!flight) return;
  const { ease, lerp } = C;
  const f = flight;
  f.u = Math.min(1, f.u + dt / f.dur);
  const k = ease(f.u), arc = Math.sin(Math.PI * f.u);
  cur.t.lerpVectors(f.from.t, f.to.t, k);
  cur.d = lerp(f.from.d, f.to.d, k) + f.lift * arc;
  cur.yaw = lerp(f.from.yaw, f.to.yaw, k);
  cur.pitch = lerp(f.from.pitch, f.to.pitch, k) + f.pitchLift * arc;
  if (f.u >= 1) flight = null;
}

const tgt = { v: null };
function placeCamera(dt) {
  const { lerp, clamp, THREE } = C;
  const stop = world.stops[activeKey];
  if (!stop) return;
  // outdoors the camera keeps the walking boy in view
  followW = lerp(followW, stop.follow && built ? FOLLOW_W : 0, Math.min(1, dt * 1.5));
  if (built) followT.lerp(world.boyPos(tgt.v || (tgt.v = new THREE.Vector3())), Math.min(1, dt * 3));
  const target = new THREE.Vector3().lerpVectors(cur.t, followT, followW);
  // narrow screens: back off so the same width stays in view
  const fit = Math.pow(Math.max(1, 1.55 / camera.aspect), 0.85);
  const d = cur.d * fit;
  const yaw = cur.yaw + tiltX * 0.04, pitch = clamp(cur.pitch - tiltY * 0.025, 0.12, 1.3);
  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * d,
    target.y + Math.sin(pitch) * d,
    target.z + Math.cos(yaw) * Math.cos(pitch) * d);
  camera.lookAt(target);
}

// time of day: interpolate the TOD keys
const cA = new (window.THREE ? window.THREE.Color : Object)(), cB = new (window.THREE ? window.THREE.Color : Object)();
const K = {};
function sampleTod(t) {
  const { lerp, clamp } = C;
  let i = 1;
  while (i < TOD.length - 1 && TOD[i].t < t) i++;
  const a = TOD[i - 1], b = TOD[i];
  const k = clamp((t - a.t) / (b.t - a.t || 1));
  ['elev', 'sunI', 'hemiI', 'env', 'night'].forEach(n => { K[n] = lerp(a[n], b[n], k); });
  K.sky = (K.sky || new C.THREE.Color()).set(a.sky).lerp(cB.set(b.sky), k);
  K.sun = (K.sun || new C.THREE.Color()).set(a.sun).lerp(cB.set(b.sun), k);
  K.hemi = (K.hemi || new C.THREE.Color()).set(a.hemi).lerp(cB.set(b.hemi), k);
  return K;
}
function applyTime(dt, time) {
  const { lerp, clamp } = C;
  todNow += clamp(todTarget - todNow, -dt * TOD_RATE, dt * TOD_RATE);
  const T = sampleTod(todNow), n = T.night;
  const W = world.W, N = world.N;
  scene.background.copy(T.sky);
  scene.fog.color.copy(T.sky);
  // sun light: from the near side, moving with the sun across x
  const sx = lerp(SUN_X, -SUN_X, todNow);
  const e = Math.max(T.elev, 0.3);
  sun.position.set(lerp(sx * 0.45, -10, n), 8 + e * 22, 22);
  sun.color.copy(T.sun);
  sun.intensity = T.sunI;
  hemi.color.copy(T.hemi);
  hemi.intensity = T.hemiI;
  scene.environmentIntensity = T.env;
  N.skyPanes.forEach(m => m.color.copy(T.sky));
  if (!built) return;
  // the visible sun and moon behind the town
  W.sun.position.set(sx, -2 + T.elev * 28, -62);
  W.sun.material.opacity = clamp(T.elev / 0.12 + 0.6);
  W.sunGlow.material.opacity = W.sun.material.opacity * 0.8;
  W.sun.material.color.copy(cA.set(0xffe9a8).lerp(T.sun, 0.5));
  W.moon.position.set(-18 + todNow * 8, 16 + todNow * 4, -62);
  W.moon.material.opacity = clamp((n - 0.5) * 2.2);
  W.stars.material.opacity = clamp((n - 0.6) * 2.5) * (0.85 + Math.sin(time * 2.3) * 0.1);
  N.clouds.color.copy(cA.set(0xffffff).lerp(T.sky, 0.25)).lerp(cB.set(0x4a5480), n * 0.7);
  // indoor lights and windows come on as it gets dark; the bedroom lamp goes off at "sleep"
  const lampOn = W.bedLamp;
  N.lights.house.intensity = n * HOUSE_LIGHT * lerp(0.3, 1, lampOn);
  N.lights.bed.intensity = n * BED_LIGHT * lampOn;
  N.lights.school.intensity = n * SCHOOL_LIGHT;
  N.windows.forEach(m => { m.emissiveIntensity = n * 1.3; });
  N.frontGlass.forEach(m => { m.emissiveIntensity = n * 1.1; });
  N.bedLamp.emissiveIntensity = (0.25 + n * 1.6) * lampOn;
  N.glowStars.emissiveIntensity = W.glow * 1.8;
  N.street.emissiveIntensity = 0.05 + n * 2.4;
  N.beacon.emissiveIntensity = 0.4 + (Math.sin(time * 3.2) > 0 ? 0.9 : 0.1) * (0.4 + n);
}

// --- teardown (as books/city): free the GPU before going back to the shelf --------
function destroy() {
  if (destroyed || !renderer) return;
  destroyed = true;
  try {
    const seen = new Set();
    const free = x => { if (x && !seen.has(x) && x.dispose) { seen.add(x); x.dispose(); } };
    scene.traverse(o => {
      free(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
        if (!m) return;
        Object.values(m).forEach(v => { if (v && v.isTexture) free(v); });
        free(m);
      });
      if (o.shadow && o.shadow.map) free(o.shadow.map);
    });
    if (scene.environment) free(scene.environment);
    renderer.renderLists && renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  } catch (e) { /* best effort: we're leaving anyway */ }
  scene = world = null;
}
window.addEventListener('pagehide', destroy);
document.addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('.library-btn')) destroy();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Esc') destroy(); }, true);
window.addEventListener('pageshow', e => { if (e.persisted && destroyed) location.reload(); });

window.BOOK_SCENE = {
  destroy, mount, show, play,
  tilt(x, y) {
    if (noTilt || !built) { tiltX = tiltY = 0; return; }
    tiltX = x; tiltY = y;
  }
};
})();
