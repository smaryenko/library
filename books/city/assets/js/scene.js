// HARBOR CITY: the live scene behind window.BOOK_SCENE (storybook.js).
//
// One WebGL canvas, mounted once, transparent above the pop-up (the table
// backdrop shows around the skyline). Turning a page flies the camera to that
// page's stop; pressing again mid-flight retargets from wherever the camera
// is, and going back plays the same arc in reverse. Tap / Space / Enter plays
// the stop's animation (queued until the camera arrives).
//
// Load: chunk 1 (the book and printed pages) is built before the first frame;
// the rest is built one chunk per frame while the reader looks at page 1,
// then every shader is compiled with compileAsync, so later page turns only
// draw frames.
(function () {
'use strict';
const { THREE, TIER, clamp, lerp, ease, buildWorld } = window.CITY;
const { RoomEnvironment } = THREE;

const V3 = THREE.Vector3;
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, sun, hemi, world, host;
let built = false, ready = false;
let activeKey = 'overview';
const cur = { t: new V3(0, 0, 0), d: 58, yaw: 0, pitch: 0.7 };
let flight = null;            // { from, to, u, dur, lift, pitchLift, resetStop }
let anim = null;              // { stop, t, waiting }
let tiltX = 0, tiltY = 0;
let nightNow = 0, nightTarget = 0;
let followW = 0;
const followT = new V3();
let pendingShow = null;

function stopFor(i) {
  const pages = window.BOOK_PAGES || [];
  const key = (pages[i] && pages[i].stop) || 'overview';
  return { key, stop: world.stops[key] || world.stops.overview };
}

function camState(c) { return { t: new V3(...c.t), d: c.d, yaw: c.yaw, pitch: c.pitch }; }
function copyState(s) { return { t: s.t.clone(), d: s.d, yaw: s.yaw, pitch: s.pitch }; }

function show(i, { instant } = {}) {
  if (!world) { pendingShow = [i, instant]; return; }
  const { key, stop } = stopFor(i);
  const prevStop = world.stops[activeKey];
  const changed = key !== activeKey;
  activeKey = key;
  nightTarget = stop.night || 0;
  if (anim && changed) anim = null;
  const to = camState(stop.cam);
  if (instant || reduceMotion && !flight) {
    if (changed && built && prevStop) prevStop.reset();
    Object.assign(cur, copyState(to));
    flight = null; followW = 0;
    return;
  }
  const from = copyState(cur);
  const jump = from.t.distanceTo(to.t);
  // long hops lift up toward the overview on the way; short hops just arc
  const lift = jump > 16 ? Math.max(0, 46 - (from.d + to.d) / 2) : jump * 0.45;
  const pitchLift = jump > 16 ? 0.18 : 0.06;
  let dyaw = to.yaw - from.yaw;
  dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
  to.yaw = from.yaw + dyaw;
  flight = {
    from, to, u: 0, lift, pitchLift,
    dur: reduceMotion ? 0.5 : clamp(1.1 + jump * 0.028, 1.1, 2.1),
    resetStop: changed && prevStop ? prevStop : (flight && flight.resetStop) || null
  };
}

function play() {
  if (!built) return;
  const stop = world.stops[activeKey];
  if (!stop) return;
  stop.reset();
  anim = { stop, t: 0, waiting: !!flight };
}

function mount(el) {
  host = el;
  renderer = new THREE.WebGLRenderer({ antialias: TIER > 0, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, [1.25, 1.5, 2][TIER]));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label',
    'A 3D pop-up harbour city on an open book. Tap the scene to make the vehicles move.');
  host.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);

  // stronger key light, weaker fill: more contrast and form (flat, even
  // light was part of the toy look)
  sun = new THREE.DirectionalLight(0xfff1dc, 3.1);
  sun.position.set(-16, 26, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(TIER ? 2048 : 1024, TIER ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 18, bottom: -18, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  hemi = new THREE.HemisphereLight(0xdfeeff, 0x7a6a50, 0.6);
  scene.add(sun, sun.target, hemi);

  world = buildWorld(scene);
  world.chunks.shift()();            // the book itself, before the first frame
  if (pendingShow) { const [i, inst] = pendingShow; pendingShow = null; show(i, { instant: inst !== false }); }

  const resize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // lift the picture above the caption label at the bottom
    camera.setViewOffset(w, h, 0, -h * 0.03, w, h);   // sits a little low; the caption is small
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();
  requestAnimationFrame(loop);
}

// --- per-frame -----------------------------------------------------------------
let last = performance.now(), time = 0, slow = 0;
const col = new THREE.Color(), cA = new THREE.Color(), cB = new THREE.Color();

function loop(now) {
  if (destroyed) return;             // torn down on the way to the library
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (document.hidden) return;
  time += dt;

  // keep building, one chunk per frame, then warm the shaders
  if (!built && world.chunks.length) {
    world.chunks.shift()();
    if (!world.chunks.length) {
      built = true;
      Object.values(world.stops).forEach(s => s.reset());   // every rest pose
      const warm = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve();
      warm.catch(() => {});
    }
  }

  if (built) world.update(dt, time, activeKey);
  updateFlight(dt);
  if (built && anim && !anim.waiting) {
    anim.t += dt;
    if (anim.stop.play(anim.t)) anim = null;
  }
  applyNight(dt);
  placeCamera(dt);
  renderer.render(scene, camera);

  if (!ready) { ready = true; host.classList.add('is-ready'); }

  // drop resolution a notch if frames run slow for a while
  slow = dt > 0.03 ? slow + dt : Math.max(0, slow - dt * 0.5);
  if (slow > 3 && renderer.getPixelRatio() > 1) {
    renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - 0.25));
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    slow = 0;
  }
}

function updateFlight(dt) {
  if (!flight) return;
  const f = flight;
  f.u = Math.min(1, f.u + dt / f.dur);
  const k = ease(f.u), arc = Math.sin(Math.PI * f.u);
  cur.t.lerpVectors(f.from.t, f.to.t, k);
  cur.d = lerp(f.from.d, f.to.d, k) + f.lift * arc;
  cur.yaw = lerp(f.from.yaw, f.to.yaw, k);
  cur.pitch = lerp(f.from.pitch, f.to.pitch, k) + f.pitchLift * arc;
  // reset the page we left once the camera is well away from it
  if (f.resetStop && f.u > 0.5 && built) { f.resetStop.reset(); f.resetStop = null; }
  if (f.u >= 1) {
    flight = null;
    if (anim) anim.waiting = false;
  }
}

function placeCamera(dt) {
  // follow a moving subject (the jet taking off) while its page plays
  const stop = world.stops[activeKey];
  const subject = !flight && anim && stop.follow ? stop.follow(anim.t) : null;
  followW = lerp(followW, subject ? 0.75 : 0, Math.min(1, dt * 1.2));
  if (subject) followT.lerp(subject, Math.min(1, dt * 3));
  else if (followW < 0.01) followT.copy(cur.t);
  const target = new V3().lerpVectors(cur.t, followT, followW);
  // narrow screens: back off so the same width of the city stays in view
  const fit = Math.pow(Math.max(1, 1.55 / camera.aspect), 0.9);
  const d = (cur.d + followW * 6) * fit;
  const yaw = cur.yaw + tiltX * 0.04, pitch = clamp(cur.pitch - tiltY * 0.025, 0.12, 1.35);
  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * d,
    target.y + Math.sin(pitch) * d,
    target.z + Math.cos(yaw) * Math.cos(pitch) * d);
  camera.lookAt(target);
}

// evening light: the sun sinks to a blue dusk, windows and lamps come on
function applyNight(dt) {
  nightNow += (nightTarget - nightNow) * Math.min(1, dt * 0.9);
  const n = nightNow, N = world.night, W = world.W;
  sun.intensity = lerp(3.1, 0.35, n);
  sun.color.copy(cA.set(0xfff1dc)).lerp(cB.set(0x7f8fd0), n);
  hemi.intensity = lerp(0.6, 0.3, n);
  hemi.color.copy(cA.set(0xdfeeff)).lerp(cB.set(0x3a4a80), n);
  scene.environmentIntensity = lerp(0.55, 0.18, n);
  N.facades.forEach(m => { m.emissiveIntensity = n * 1.15; });
  N.lamps.forEach(m => {
    if (m.userData.base == null) m.userData.base = m.emissiveIntensity;
    m.emissiveIntensity = m.userData.base + n * 2.2;
  });
  if (N.street) N.street.emissiveIntensity = 0.05 + n * 2.6;
  if (N.water) N.water.color.copy(cA.set(0x2c6684)).lerp(cB.set(0x13283f), n);
  if (N.beam) N.beam.opacity = Math.max(n * 0.28, W.beamFlash || 0);
  if (W.sun) {
    W.sun.material.opacity = 1 - n; W.sunCore.material.opacity = 1 - n;
    W.moon.material.opacity = n;
    W.clouds.forEach(s => s.material.color.copy(col.set(0xffffff).lerp(cB.set(0x6c7aa6), n)));
  }
}

// --- teardown -------------------------------------------------------------------
// Leaving for the library: the browser alone frees the WebGL scene slowly (or
// keeps it alive in the back/forward cache), so the shelf page started out
// starved of GPU memory, especially on phones/tablets. Stop the loop, free
// every geometry/material/texture and drop the GL context ourselves, as early
// as possible (the Library button press, before the navigation even starts).
let destroyed = false;
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
// coming back via the back/forward cache: the GL context is gone, rebuild
window.addEventListener('pageshow', e => { if (e.persisted && destroyed) location.reload(); });

window.BOOK_SCENE = {
  destroy,
  mount,
  show,
  play,
  tilt(x, y) { tiltX = x; tiltY = y; }
};
})();
