// Generalised pseudo-3D object renderer.
//
// Takes ANY layered SVG string whose visual parts are tagged with `data-part`,
// splits each part onto its own DOM layer, assigns a Z depth per part, and
// tilts the whole stack toward the pointer while shifting each layer by its
// depth (parallax). Generalised from the reindeer-only mountReindeer so the
// book, tree, sleigh, etc. can all pop out of the page the same way.
//
// Differences from the original pseudo3d.js:
//  - accepts a pre-built SVG string (not a cfg), so any builder can feed it;
//  - does NOT attach its own pointer listeners — the storybook drives tilt
//    centrally (one pointer source for the whole spread) and adds an idle sway;
//  - exposes apply(px,py) plus the scene element so the caller can compose.

const OBJ_DEPTH = {
  // reindeer parts (same intent as the original DEPTH map)
  shadow: -60, 'back-legs': -18, body: 0, belly: 6,
  'front-legs': 14, accessory: 20, head: 30, ears: 26,
  antlers: 44, face: 38, nose: 46, hat: 50,

  // tree parts: trunk sits back, foliage mid, decorations pop forward
  trunk: -20, 'tree-back': -30, tree: 0, garland: 24,
  baubles: 34, lights: 40, star: 52,

  // santa-in-a-sleigh: runners furthest back, Santa + hat closest
  runners: -50, 'sleigh-back': -30, gifts: 10, sleigh: 0,
  'santa-body': 20, 'santa-arm': 30, 'santa-head': 38,
  'santa-face': 44, 'santa-hat': 50,

  // elf: legs back, tunic mid, held gift + head + hat forward
  legs: -14, 'side-gift': -24, tunic: 8, arms: 18,
  'held-gift': 28, hair: 42,
  // elf reuses shared keys: head 30, ears 26, face 38, hat 50

  // fireplace: surround + firebox deep, fire mid, mantel dressing forward
  surround: -50, firebox: -40, logs: -10, fire: 0,
  glow: 6, mantel: 20, stockings: 34,
  // fireplace reuses shared keys: shadow -60, garland 24, gifts 10

  // race — toy car parts: shadow back (reuses shared `shadow`), wheels and
  // undercarriage low, body mid, cabin/windows/number forward, spoiler highest.
  undercarriage: -20, 'wheel-back': -12, 'car-body': 0, 'side-stripe': 8,
  cabin: 16, window: 20, headlight: 24, number: 26, spoiler: 40,

  // race — track props: base/ground back, road mid, kerbs + car forward,
  // signage/finish banner highest.
  'prop-base': -40, road: -10, ramp: 0, loop: 0, tiles: -6,
  kerb: 14, 'finish-line': 16, car: 24, bunting: 46, podium: 6, trophy: 30,

  // reef — "A Day on the Reef". Every spread is one flat scene SVG; each
  // movable layer is a flat, role-named group (books/reef/assets/js/props.js).
  // Back → front. These keys are reef-only (no xmas/race part uses them).
  sand: -46, 'shell-shadow': -44, 'crab-shadow': -44, 'turtle-shadow': -44,
  swirl: -40, 'coral-back': -34, 'kelp-back': -34, rock: -28,
  anemone: -12, 'coral-mid': -8, 'turtle-far': -6, 'anemone-tips': -4,
  'seahorse-fin': 2, 'crab-shell': 2, shell: 4, 'octo-arms': 6, turtle: 6,
  'fish-back': 8, eel: 8, 'eel-eye': 9, seahorse: 10, puffer: 12, octo: 12,
  'puffer-ball': 14, crab: 14, fish: 16, school: 18, 'coral-front': 20,
  'turtle-flipper': 20, 'kelp-left': 22, 'kelp-right': 22, 'crab-claw': 22,
  'fish-front': 24, 'rock-front': 26,
  'jelly-a': -10, 'jelly-b': 6, 'jelly-c': 18,
  // reef effect layers (hidden at rest, like every fx-*)
  'fx-sand': -20, 'fx-ripple': 10, 'fx-trail': 28, 'fx-bubbles': 30,

  // dino — "Dinosaurs" (books/dino/assets/js/dino.js). Three-quarter view:
  // tail + far leg recede behind the body, near leg / neck / head come toward
  // the viewer, the scale child stands closest. Dino-only keys.
  'dino-ground': -50, 'dino-tail': -30, 'dino-leg-far': -18, 'dino-arm-far': -4,
  'dino-body': 0, 'dino-neck': 14, 'dino-leg-near': 18, 'dino-arm-near': 22,
  'dino-jaw': 29, 'fx-mouth': 30, 'dino-head': 32, human: 40, 'fx-breath': 44,
  // more dino-book parts (other species, scenery, effects, closing pages)
  'dino-water': -46, 'dino-neck-back': -2, 'dino-leg-under': -1, 'dino-tree': -36, 'dino-tail-tip': -32,
  'dino-wing-far': -14, 'dino-flipper-far': -12, 'dino-plates-far': -8,
  'dino-plates': 6, 'dino-flipper-hind': 16, 'dino-leg-front': 20,
  'dino-flipper-near': 20, 'dino-frill': 24, 'dino-wing-near': 28,
  'fx-dust': 21, 'fx-ring': 34, 'fx-leaves': 36, 'fx-feathers': 34,
  'fx-star': 50, 'fx-flash': 38, 'fx-cloud': 14,
  'ladder-c': -24, 'ladder-b': -4, 'ladder-a': 16,
  'space-stars': -50, earth: 0, 'earth-clouds': 6, asteroid: 30,
  'sv-ground': -46, 'sv-rock': -26, 'sv-bird': -10, 'sv-bird-wing': -6,
  'sv-turtle-limbs': 4, 'sv-turtle-shell': 10, 'sv-croc': 16, 'sv-croc-head': 20,

  // click-animation EFFECT parts (hidden at rest, revealed only while playing).
  // Any `data-part` whose name starts with `fx-` is an effect spawned by the
  // object's own animation (a ground crack, exhaust clouds, a sparkle burst) —
  // not part of the resting picture. Placed on sensible planes: ground effects
  // sit back near the shadow, mid puffs float around the body, sparkles pop
  // closest. Builders may also use these generic keys directly.
  'fx-ground': -55, 'fx-back': -24, 'fx-mid': 12, 'fx-front': 36,
  'fx-spark': 56,
  // a ground crack sits on the floor plane (just above the shadow)
  'fx-crack': -52,
  // car exhaust clouds sit just behind the body (over the shadow, under the car)
  'fx-smoke1': -16, 'fx-smoke2': -18, 'fx-smoke3': -20,

  // generic fallbacks for future builders
  base: -40, mid: 0, fore: 30, top: 50
};

const OBJ_MAX_TILT = 16;   // degrees at the pointer extremes
const OBJ_PARALLAX = 0.12; // px shift per depth unit per pointer unit

// Build a pseudo-3D object inside `host`. Returns { scene, apply, play }.
//
// Click animation: each object ships its OWN animation inside its SVG — the
// builder embeds a scoped `<style>` (keyed to its unique gradient `uid`) with
// `@keyframes` and rules like `svg.is-playing [data-part="front-leg-r"] {...}`.
// Animations are never shared between objects, so they live with the object
// that uses them (no central keyframe registry). Here we only drive the
// trigger: `play()` mirrors an `is-playing` class onto every split layer's
// inner <svg>, which starts that object's embedded keyframes once, then clears
// it on animationend so a later click can re-trigger. The storybook engine
// calls play() when a tap lands on the pop-up image.
function mountObject(host, svgString, opts = {}) {
  const maxTilt = opts.maxTilt ?? OBJ_MAX_TILT;
  const parallax = opts.parallax ?? OBJ_PARALLAX;

  let scene = host.querySelector('.scene');
  if (!scene) {
    scene = document.createElement('div');
    scene.className = 'scene';
    host.appendChild(scene);
  }
  scene.innerHTML = '';

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgString, 'image/svg+xml');
  const partsInOrder = Array.from(parsed.querySelectorAll('[data-part]'))
    .map(n => n.getAttribute('data-part'));

  // Fallback: no data-part tags at all -> treat the whole SVG as one mid layer.
  if (partsInOrder.length === 0) {
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.dataset.z = 0;
    layer.innerHTML = svgString;
    layer.style.transform = 'translateZ(0px)';
    scene.appendChild(layer);
  } else {
    partsInOrder.forEach(part => {
      const layer = document.createElement('div');
      layer.className = 'layer';
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      doc.querySelectorAll('[data-part]').forEach(n => {
        if (n.getAttribute('data-part') !== part) n.remove();
      });
      layer.innerHTML = new XMLSerializer().serializeToString(doc.documentElement);
      const z = OBJ_DEPTH[part] ?? 0;
      layer.dataset.z = z;
      layer.style.transform = `translateZ(${z}px)`;
      scene.appendChild(layer);
    });
  }

  function apply(px, py) {
    const cx = Math.max(-1, Math.min(1, px));
    const cy = Math.max(-1, Math.min(1, py));
    scene.style.transform =
      `rotateX(${-cy * maxTilt}deg) rotateY(${cx * maxTilt}deg)`;
    scene.querySelectorAll('.layer').forEach(l => {
      const z = +l.dataset.z;
      l.style.transform =
        `translateZ(${z}px) translate(${-cx * z * parallax}px, ${-cy * z * parallax}px)`;
    });
  }

  // Each split layer carries a full copy of the SVG (one part shown, the rest
  // removed) INCLUDING the root <style> the builder embedded. So the object's
  // own keyframes are present in every layer; we just flip the trigger class
  // (`is-playing`) on every inner <svg> at once to start them, and clear it
  // once all tracks have finished (see the start/end counting below).
  const innerSvgs = () => Array.from(scene.querySelectorAll('.layer > svg'));

  // One object can run SEVERAL tracks of different durations at once (e.g. a
  // body move plus a shorter wheel spin). Clearing on the FIRST animationend
  // would cut the longer tracks short, so instead we clear only once EVERY
  // running animation has ended: count starts vs ends and clear at zero. A
  // safety timer also clears in case an animationend is ever missed.
  let running = 0;
  let safety = null;

  function clearPlaying() {
    innerSvgs().forEach(s => s.classList.remove('is-playing'));
    running = 0;
    if (safety) { clearTimeout(safety); safety = null; }
  }

  function play() {
    const svgs = innerSvgs();
    if (!svgs.length) return;
    // Clear first so a mid-run click restarts cleanly, then force reflow and
    // re-add on the next frame so the animation re-fires from 0%.
    clearPlaying();
    void scene.offsetWidth;
    requestAnimationFrame(() => {
      svgs.forEach(s => s.classList.add('is-playing'));
      // hard cap: clear ~2.5s after start even if an end event is lost. Keep
      // this comfortably above the longest keyframe duration used by builders.
      safety = setTimeout(clearPlaying, 2500);
    });
  }

  scene.addEventListener('animationstart', () => { running++; });
  scene.addEventListener('animationend', () => {
    running--;
    if (running <= 0) clearPlaying();
  });

  apply(0, 0);
  return { scene, apply, play };
}

if (typeof module !== 'undefined') module.exports = { mountObject, OBJ_DEPTH };
