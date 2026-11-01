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

So your job is only to produce: **one SVG, many `data-part` groups, authored so
depth ordering reads correctly.** You do not write any animation code.

## 1. Read the reference as *style*, never as pixels

- The image tells you pose, proportion, palette, and silhouette. That's all.
- **Redraw everything as original vector.** Never trace pixel-for-pixel, embed,
  or ship the reference. See `asset-licensing.md`.
- Reference origin is often unknown (possibly AI-generated); keep it out of the
  committed repo (local only, under a gitignored folder).

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

## 3. Draw each part as a flat, solid, fill-first shape

- Flat-cartoon style: **filled silhouettes, fill-only.** Avoid stroked squiggle
  lines and busy inner shading lines — they read as cheap cartoon scribble.
- Volume comes from **radial gradients** (highlight top-left, darker lower-right
  rim) and soft contact shadows at joins — NOT from many Z-splits. Shading that
  sells roundness lives inside one part's fill.
- Keep the shape **chunky and scaled to its host**. Oversized "realistic"
  detail looks wrong against the cute flat body. Small-and-chunky wins.

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
trace). Expect the spec to arrive incrementally ("too big", "too realistic",
"take this as reference") — cheap loops make each "no, like this" cost one
change, not a rebuild.

## Checklist

- [ ] Parts listed back-to-front, each a `data-part` group.
- [ ] Z depth per part added to `OBJ_DEPTH` (reusing shared keys where sensible).
- [ ] Every shape fill-first, volume via gradients, no stroked squiggles.
- [ ] Organic limbs via offset-strip + mirror, tines pointing outward.
- [ ] Scaled chunky-to-host, not realistically large.
- [ ] Reference used for style only; nothing traced, embedded, or shipped.
