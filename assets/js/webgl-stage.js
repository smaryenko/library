// SHARED WebGL stage: hosts a live three.js world inside an otherwise normal
// book, with no storybook.js edits. (Moved here from the style preview's
// scene.js + core.js; used by books/longway and books/preview.)
//
// - A page's build() returns WEBGL_STAGE.placeholder(kind, section): a
//   transparent <svg data-popup3d="<kind>">. When the engine mounts it, one
//   full-stage canvas is laid over the stage and the CSS book is hidden (the
//   world draws its own table). Leaving for a normal page removes it again.
// - Worlds are registered with WEBGL_STAGE.register(kind, renderer => world)
//   and built once, on first show. One renderer is shared.
// - Consecutive pages with the same kind are ONE continuous world: the turn
//   calls world.show(section) instead of restarting it (no leaf flip).
// - World API: { scene, camera, label, enter(section, atEnd), show(section),
//   update(dt) -> needs render, resize(w, h, free), tilt(x, y), play(),
//   optional forward() / back() -> true if the input was used }.
// - Story steps (worlds with forward/back): every forward input (Space,
//   Enter, arrows / PageDown, next button, right tap, leftward swipe, a tap
//   on the picture) is one step; back inputs one step back. false from the
//   world lets the engine turn the page.
// Also exports small three.js helpers (canvas, texture, env, quality tier).
// Needs window.THREE (assets/vendor/three/three.global.min.js) loaded first.
(function () {
'use strict';
const THREE = window.THREE;

// ---- helpers --------------------------------------------------------------------
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
function texture(c, { srgb = true, repeat = null, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = aniso;
  return t;
}
// grayscale height canvas (red channel, wraps) -> tangent-space normal canvas
function normalFromHeight(hc, strength) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h), ctx = out.getContext('2d');
  const img = ctx.createImageData(w, h), d = img.data;
  const H = (x, y) => src[((((y + h) % h) * w) + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), k = (y * w + x) * 4;
    d[k] = (-dx / l * 0.5 + 0.5) * 255;
    d[k + 1] = (dy / l * 0.5 + 0.5) * 255;
    d[k + 2] = (1 / l * 0.5 + 0.5) * 255;
    d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}
// quality tier: -1 no WebGL2, 0 low, 1 medium, 2 high
function detectTier() {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2');
  if (!gl) return -1;
  const lose = gl.getExtension('WEBGL_lose_context');
  if (lose) lose.loseContext();
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  const touch = matchMedia('(pointer: coarse)').matches;
  const px = Math.max(screen.width, screen.height) * (devicePixelRatio || 1);
  let tier = 1;
  if (mem <= 2 || cores <= 2) tier = 0;
  else if (!touch && mem >= 8 && cores >= 8) tier = 2;
  if (touch && px > 2600) tier = Math.min(tier, 1);   // big school boards: weak GPUs
  return tier;
}
const TIER = THREE ? detectTier() : -1;
let envTex = null;
function env(renderer) {
  if (!envTex) {
    const pm = new THREE.PMREMGenerator(renderer);
    envTex = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }
  return envTex;
}

// ---- host -----------------------------------------------------------------------
const FACTORY = {};
let firstKind = null;
let renderer = null, world = null, wrap = null, holder = null, raf = 0, quality = 1;
let liveKind = null, lostAt = 0;
const worlds = {};
const GRACE_MS = 700;   // a page turn may unmount the old placeholder before the new one mounts
// WebGL pages: the caption goes to the bottom, above the nav buttons, so it
// never covers the scene (the scene is framed above it in resize())
document.head.insertAdjacentHTML('beforeend', `<style>
  .book-scene3d .obj-slot.is-caption{position:fixed!important;left:50%!important;top:auto!important;bottom:84px!important;
    width:min(560px,90vw)!important;height:auto!important;transform:translateX(-50%)!important;pointer-events:none}
</style>`);

function placeholder(kind, section = 0) {
  // transparent; data-hit = the area that plays the scene instead of turning
  return `<svg data-popup3d="${kind}" data-section="${section}" viewBox="0 0 1600 900" data-fit="0 0 1600 900" data-hit="200 60 1200 700" xmlns="http://www.w3.org/2000/svg"><rect width="1600" height="900" fill="none"/></svg>`;
}

function resize() {
  if (!renderer || !world) return;
  const w = wrap.clientWidth || innerWidth, h = wrap.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.max(0.5, Math.min(devicePixelRatio || 1, TIER ? 2 : 1) * quality));
  renderer.setSize(w, h, false);
  // the caption sits at the bottom (CSS above): frame the scene above it.
  // The CSS alone can't move it (the slot sits in the book's transformed
  // layout box), so the text block is shifted down to just above the nav
  // buttons, then measured.
  const cap = document.querySelector('.book-scene3d .obj-slot.is-caption .text-block');
  let top = 0;
  if (cap) {
    cap.style.position = 'relative';
    cap.style.top = '0px';
    const r = cap.getBoundingClientRect(), nav = document.querySelector('.page-btn');
    // nav row under the caption (portrait) or a column at the side (landscape)
    const navTop = nav ? nav.getBoundingClientRect().top : h;
    const floor = (navTop > h * 0.7 ? navTop : h) - 14;
    const dy = Math.max(0, floor - r.bottom);
    cap.style.top = dy + 'px';
    top = r.top + dy;
  }
  world.resize(w, h, top > h * 0.4 ? top - 8 : h);
  world.dirty = true;
}

const sectionOf = svg => +(svg.getAttribute('data-section') || 0);
const kindOf = svg => (FACTORY[svg.getAttribute('data-popup3d')] ? svg.getAttribute('data-popup3d') : firstKind);
// the mounted placeholder that is not the current one (if two are in the DOM mid-turn)
function findHolder() {
  const all = Array.from(document.querySelectorAll('.obj-host .layer > svg[data-popup3d]')).filter(s => !s.closest('.obj-prerender'));
  return all.filter(s => s !== holder).pop() || null;
}

function open(svg) {
  const kind = kindOf(svg);
  if (!kind) return;
  if (liveKind === kind && world && world.show) {        // same world: continue the shot
    holder = svg; lostAt = 0;
    world.show(sectionOf(svg));
    requestAnimationFrame(resize);   // the new page's caption: move it down too
    return;
  }
  holder = svg;
  if (TIER < 0) return;
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: TIER > 0, alpha: false, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = TIER > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('role', 'img');
    wrap = document.createElement('div');
    wrap.className = 'popup3d-wrap';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0;transition:opacity 300ms ease';
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    new ResizeObserver(resize).observe(wrap);
  }
  liveKind = kind; lostAt = 0;
  world = worlds[kind] || (worlds[kind] = FACTORY[kind](renderer));
  renderer.domElement.setAttribute('aria-label', world.label || 'A live 3D picture.');
  // just above the table backdrop (.winter-bg, z-index 1), below the book chrome
  const bg = document.querySelector('.winter-bg');
  if (bg) bg.after(wrap); else document.body.prepend(wrap);
  document.body.classList.add('book-scene3d');
  resize();
  requestAnimationFrame(resize);   // again once the caption is laid out
  world.enter(sectionOf(svg), lastDir < 0);
  let last = performance.now(), slow = 0;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (!holder || !holder.isConnected) {
      const next = findHolder();
      if (next) { open(next); if (liveKind !== kindOf(next)) return; }
      else if (document.querySelector('.obj-host .layer > svg:not([data-popup3d])')) { close(); return; }   // a normal page is up
      else if (!lostAt) lostAt = now;
      else if (now - lostAt > GRACE_MS) { close(); return; }
    }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) return;                     // paused while the tab is hidden
    if (world.update(dt) || world.dirty) {
      world.dirty = false;
      renderer.render(world.scene, world.camera);
      wrap.style.opacity = '1';
    }
    // adaptive resolution: frames slower than ~30 fps for a while lower it
    slow = dt > 0.034 ? slow + dt : Math.max(0, slow - dt * 0.5);
    if (slow > 2.5 && quality > 0.55) { quality *= 0.85; slow = 0; resize(); }
  };
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function close() {
  cancelAnimationFrame(raf);
  holder = null; liveKind = null; lostAt = 0;
  document.body.classList.remove('book-scene3d');
  if (wrap) { wrap.style.opacity = '0'; wrap.remove(); }
}

new MutationObserver(() => {
  const svg = findHolder();
  if (svg) open(svg);
}).observe(document.documentElement, { childList: true, subtree: true });

// tap on the WebGL picture / Space / Enter: play it (worlds without steps)
function hostOf(t) {
  const h = t && t.closest ? t.closest('.obj-host') : null;
  return h && h.querySelector('svg[data-popup3d]') ? h : null;
}
window.addEventListener('picture-activate', e => { if (world && !world.forward && hostOf(e.target)) world.play(null); });
window.addEventListener('pointerdown', e => { if (world && !world.forward && holder && hostOf(e.target)) world.play(null); }, true);

// ---- story steps ------------------------------------------------------------------
// Nothing waits: a step still running is snapped to its end (or undone, going
// back) by the world and the next starts at once. Off the WebGL pages Space /
// Enter keep the engine's behaviour (play the picture only).
const FWD_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown']);
const BACK_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'Backspace', 'PageUp']);
let lastDir = 1;          // direction of the last input: a page entered going back starts at its end
const live = () => !!(world && holder && holder.isConnected && world.forward);
const onControl = t => t && t.closest && t.closest('button, a, input, textarea, select');
function eat(e) { e.preventDefault(); e.stopImmediatePropagation(); }
function stepIn(dir) {
  lastDir = dir;
  return live() && (dir > 0 ? world.forward() : world.back());
}
let relay = false;
const turnForward = () => { relay = true; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); relay = false; };

window.addEventListener('keydown', e => {
  if (relay) return;
  const space = e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter';
  const dir = space || FWD_KEYS.has(e.key) ? 1 : BACK_KEYS.has(e.key) ? -1 : 0;
  if (!dir || onControl(e.target) && (space || e.key === 'Backspace')) return;
  if (space && !live()) return;
  if (e.repeat) { if (live()) eat(e); return; }
  if (stepIn(dir)) { eat(e); return; }
  if (space) { eat(e); turnForward(); }    // nothing left on this page: Space turns forward
}, true);

window.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.page-btn.next, .page-btn.prev');
  if (!btn) return;
  if (stepIn(btn.classList.contains('next') ? 1 : -1)) eat(e);
}, true);

let downAt = null;
window.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; }, true);
window.addEventListener('pointerup', e => {
  const d = downAt; downAt = null;
  if (!d || onControl(e.target)) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  let dir = 0;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 60) dir = dx < 0 ? 1 : -1;
  const tap = Math.hypot(dx, dy) < 10;
  if (tap && hostOf(e.target)) {                 // tap on the picture: always forward
    if (!live()) return;
    eat(e);
    if (!stepIn(1)) turnForward();
    return;
  }
  if (tap) dir = e.clientX >= innerWidth / 2 ? 1 : -1;
  if (dir && stepIn(dir)) eat(e);
}, true);

window.addEventListener('pagehide', () => {
  if (renderer) { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* leaving */ } }
});

window.WEBGL_STAGE = {
  THREE, TIER, canvas, texture, normalFromHeight, env, placeholder,
  register(kind, factory) { FACTORY[kind] = factory; if (!firstKind) firstKind = kind; }
};
})();
