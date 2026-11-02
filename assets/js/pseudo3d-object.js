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

  // raceday — toy car parts: shadow back (reuses shared `shadow`), wheels and
  // undercarriage low, body mid, cabin/windows/number forward, spoiler highest.
  undercarriage: -20, 'wheel-back': -12, 'car-body': 0, 'side-stripe': 8,
  cabin: 16, window: 20, headlight: 24, number: 26, spoiler: 40,

  // raceday — track props: base/ground back, road mid, kerbs + car forward,
  // signage/finish banner highest.
  'prop-base': -40, road: -10, ramp: 0, loop: 0, tiles: -6,
  kerb: 14, 'finish-line': 16, car: 24, bunting: 46, podium: 6, trophy: 30,

  // generic fallbacks for future builders
  base: -40, mid: 0, fore: 30, top: 50
};

const OBJ_MAX_TILT = 16;   // degrees at the pointer extremes
const OBJ_PARALLAX = 0.12; // px shift per depth unit per pointer unit

// Build a pseudo-3D object inside `host`. Returns { scene, apply }.
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

  apply(0, 0);
  return { scene, apply };
}

if (typeof module !== 'undefined') module.exports = { mountObject, OBJ_DEPTH };
