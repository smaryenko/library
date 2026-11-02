// Shared click-animation helper for pseudo-3D objects.
//
// Every picture ships its OWN one-shot "click" animation, and that animation
// lives INSIDE the object's SVG (no central keyframe registry, no sharing
// between objects). This helper just removes the boilerplate of writing the
// scoped <style> block by hand: a builder describes its animation as data and
// gets back a ready-to-embed <style> string.
//
// How the trigger works (see assets/js/pseudo3d-object.js): the engine splits
// each `data-part` onto its own layer, each layer carrying a full copy of the
// SVG — INCLUDING this <style>. When the pop-up image is tapped, the engine
// adds the class `is-playing` to every layer's inner <svg>; these rules fire
// their keyframes once, then the engine clears the class on animationend so the
// next tap can replay. Keyframe names are scoped by the object's unique `uid`
// so several objects on one spread never collide.
//
// Usage from a builder (which already has a per-object `uid`):
//
//   const anim = buildAnim(uid, {
//     // one entry per group of parts that move together
//     tracks: [
//       { parts: ['front-legs'], origin: '180px 270px',
//         keyframes: '0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}',
//         timing: '.7s ease-in-out' }
//     ]
//   });
//   // ...then drop `anim` inside the <svg>, right after </defs>.
//
// Notes:
//   - `origin` sets transform-origin for that track. By default origins are in
//     the SVG's own viewBox coordinates (transform-box:view-box), so several
//     parts can share ONE pivot (e.g. "180px 322px" = the hooves) and swing
//     together as a body. Pass box:'fill-box' on a track for a part that should
//     pivot about ITSELF (e.g. a wheel: origin '50% 50%').
//   - `keyframes` is the BODY of the @keyframes (no name, no @keyframes wrapper);
//     one generated name per track, uid-scoped.
//   - `timing` is everything after the animation name (duration, easing, etc).
//   - Each builder decides its own motion; this file holds NO per-object motion.

function buildAnim(uid, spec) {
  spec = spec || {};
  const tracks = spec.tracks || [];
  if (!tracks.length) return '';

  const kf = [];
  const rules = [];

  tracks.forEach((t, i) => {
    const name = `a${i}-${uid}`;
    kf.push(`@keyframes ${name}{${t.keyframes}}`);
    const parts = Array.isArray(t.parts) ? t.parts : [t.parts];
    const origin = t.origin ? `transform-origin:${t.origin};` : '';
    // transform-box controls what `transform-origin` is measured against.
    // Default here is `view-box`: origins are in the SVG's own viewBox
    // coordinates, so a builder can give several parts ONE shared pivot (e.g.
    // the hooves at "180px 322px") and they rotate together as a body — which
    // is what most character moves want. Pass box:'fill-box' on a track when a
    // part should pivot about ITSELF regardless of where it sits (e.g. a wheel
    // spinning on its own hub: origin '50% 50%').
    const box = `transform-box:${t.box || 'view-box'};`;
    parts.forEach(p => {
      // target the part only while the SVG carries the play flag
      rules.push(
        `svg.is-playing [data-part="${p}"]{${box}${origin}animation:${name} ${t.timing}}`
      );
    });
  });

  // Each rule sets its own transform-box (per track), so no blanket base rule
  // is needed here.
  return `<style>` +
    kf.join('') +
    rules.join('') +
    `</style>`;
}

if (typeof module !== 'undefined') module.exports = { buildAnim };
if (typeof window !== 'undefined') window.buildAnim = buildAnim;
