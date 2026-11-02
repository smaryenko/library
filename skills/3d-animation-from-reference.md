# Skill: pseudo-3D animation from a reference image

**When to use:** you have a flat style-reference image (a character, a prop, a
scene) and need to produce a layered SVG that "pops out of the page" with the
project's pointer-tilt + parallax + idle-sway rig.

This is the core visual technique of the whole project. Follow it in order.

## 0. The rig you are targeting

The runtime (`assets/js/pseudo3d-object.js`, `mountObject(host, svg)`) takes
**any** SVG string whose visual parts are tagged with `data-part`, splits each
part onto its own DOM layer, assigns it a Z depth, then on pointer tilt rotates
the whole stack and shifts each layer by its depth (parallax). An idle sway
drives the same `apply(x, y)` when there is no pointer.

So your job is to produce: **one SVG, many `data-part` groups, authored so
depth ordering reads correctly** — plus a short one-shot **click animation**
embedded in that same SVG (see §7). You do not write the tilt/parallax code (the
rig handles that); you DO author the per-object click animation as scoped CSS.

## 1. Read the reference as *style*, never as pixels

- The image tells you pose, proportion, palette, and silhouette. That's all.
- **Redraw everything as original vector.** Never trace pixel-for-pixel, embed,
  or ship the reference. See `asset-licensing.md`.
- Reference origin is often unknown (possibly AI-generated); keep it out of the
  committed repo (local only, under a gitignored folder).
- **Aim for detailed & believable (kid-friendly).** Redraw toward real volume,
  real materials, and faces with real structure. It can stay warm and a touch
  stylised for children, but it must be **richly detailed, never a flat,
  under-detailed placeholder** (no one-rectangle rug, no two-dot face). See
  `svg-character-authoring.md`.

## 2. Decompose into depth layers BEFORE drawing

List the parts from furthest-back to closest. A good decomposition is the whole
game — if two things need to parallax independently, they are different parts.

Typical ordering (back → front):
`shadow` → background/base geometry → body → mid detail → accessories →
head → face → nose/front-most highlight → hat/top-most.

Give each a `data-part` group name and a Z depth in the `OBJ_DEPTH` map in
`pseudo3d-object.js`. Shadow sits furthest back; the nose/star/top ornament sits
closest. Reuse existing shared keys (`shadow`, `head`, `face`, `ears`, `hat`,
`gifts`, `garland`) where the semantics match so you don't bloat the map.

## 3. Draw each part as a solid, fill-first shape with real volume

- **Filled silhouettes, then shade for realism.** Avoid stroked squiggle lines
  and busy inner scribble — but DO carry believable volume inside each fill.
- Volume comes from **layered gradients** (lit side → core → shadow rim), soft
  contact/occlusion shadows at joins, and considered highlights — the look of a
  painted illustration. This lives inside one part's fill, NOT in extra
  Z-splits.
- **Faces with real structure** — eyes with lids, a catchlight and iris depth, a
  nose with bridge/shadow/highlight, natural brows, soft non-circular cheeks.
  Big friendly cartoon eyes are fine, but drawn with structure — no flat dots or
  sticker features.
- **Detailed & believable beats flat/minimal.** It may stay kid-friendly and a
  touch stylised, but every object must carry the detail a real version would
  (texture, trim, strands, fringe, highlights). A flat one-fill placeholder
  isn't done.

## 4. The hard case: branching organic geometry (antlers, twigs, flames)

Learned the slow way on the reindeer antlers:

- Build a limb by **offsetting a centre-line polyline by a width function**
  (`offsetStrip`), then smoothing with Catmull-Rom. Because both edges are
  offsets of one line, the limb **cannot self-intersect**. Do NOT hand-place
  Bézier handles.
- Enforce a **hard directional constraint**: all tines/branches must point
  *away* from the symmetry axis (outward / down-and-out). Nudging endpoints
  does not fix a part that fans the wrong way — the constraint does.
- Author one side, **mirror** for the other, and place the pair with an authored
  gap between bases, then scale the whole rack onto the host.

## 5. Iterate cheaply — but respect the project's check policy

- Default working method elsewhere: self-render each iteration headless and look
  at it, showing several candidates (A/B/C/D) and extremes at once, because
  defects hide at the base/centre.
- **In this repo, honour `.kiro/steering/no-checks.md` when it is active:** do
  NOT start servers, run headless Chrome, or build preview harnesses unless the
  user explicitly asks for a render in that specific message. Make the edit and
  describe it; the user renders.
- When you *are* allowed to render: scratch files go to `/tmp`, never the repo;
  size the window to the content or the screenshot crops.

## 6. After two failed attempts at one approach, change method

Every clean win on this project came from a **rewrite**, not another tweak
(stroked squiggle → filled taper → outward-fanning silhouette → reference
trace). Expect the spec to arrive incrementally ("too big", "wrong material",
"take this as reference") — cheap loops make each "no, like this" cost one
change, not a rebuild.

## 7. Give the object a one-shot click animation (REQUIRED)

Every pop-up object must also ship a short **click animation** that lives inside
its own SVG — tapping the image plays it (the engine routes image taps to the
object's `play()`; taps elsewhere turn the page). This is a hard requirement for
every picture.

- Use the shared helper `buildAnim(uid, { tracks: [...] })`
  (`assets/js/anim.js`): each track names the `parts` that move, a
  `transform-origin`, the keyframe body, and the timing. It returns a scoped
  `<style>` (keyframe names carry the object's `uid`). Drop the result inside
  the `<svg>` right after `</defs>`.
- By default origins are in the SVG's own viewBox coordinates
  (`transform-box: view-box`), so several parts can share one pivot; pass
  `box: 'fill-box'` on a track for a part that should spin about itself
  (a wheel, a spinning ornament).
- **The animation may spawn new elements**, not just move existing parts — a
  crack under a stomp, exhaust clouds from a revving car, a sparkle burst. Draw
  each as its own `data-part="fx-…"` group, hidden at rest (`opacity="0"`), and
  reveal/move/fade it only while `is-playing` (give it an `fx-*` depth in
  `OBJ_DEPTH`). These extras are what make a beat feel rich.
- Make the motion **express the character** and fit the page caption, make it
  rich and full-page, and return to rest. No shared/global animations — each
  object authors its own. Full rules + examples in
  `svg-character-authoring.md` ("Click animation").

## Checklist

- [ ] Parts listed back-to-front, each a `data-part` group.
- [ ] Z depth per part added to `OBJ_DEPTH` (reusing shared keys where sensible).
- [ ] Fill-first shapes with REAL volume (layered gradients + occlusion); faces
      with real structure; no stroked squiggles.
- [ ] Detailed & believable, kid-friendly — never a flat, under-detailed
      placeholder.
- [ ] Organic limbs via offset-strip + mirror, tines pointing outward.
- [ ] A one-shot click animation embedded via `buildAnim`, fitting the object.
- [ ] Reference used for style only; nothing traced, embedded, or shipped.
