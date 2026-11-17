# Skill: clay books (morphing plasticine objects)

**When to use:** a book whose pictures are 3D clay objects that morph.
Reference: `books/athome/` ("How Things Work at Home").

## How it works

- Normal object pages: `build()` returns a transparent placeholder
  `<svg data-clay3d data-machine="i">`. A MutationObserver lays ONE shared
  WebGL canvas over the shown placeholder (never the prerendered copy), so
  the engine's tilt, layout and page turn still work.
- The canvas draws only the clay and its contact shadow (straight alpha,
  `premultipliedAlpha: false`); everything else is transparent. Its outer
  edge fades out so nothing is ever cut hard. Do not oversize the canvas
  past its box: the framing broke when that was tried.
- Clay = raymarched SDF of up to 16 pieces (`ell`, `box`, `cap`, `tor`,
  `cyl`, `cylz`) joined by smooth union; colours marble at the seams.
  Pieces carry colour, softness `k`, turns `rz` / `ry` and glow `e`.
- 12 pictures a second (on twos) with a fresh surface boil each; rendering
  happens only on those ticks.

## Morphing

- Slot i of the previous page's object morphs into slot i of the next.
  Same kind: parameters flow; different kinds: the two shapes blend;
  missing pieces grow out of / sink into slot 0 (the main body). So order
  slots by role (body first, then base, lid, handle, small parts, effects).
- Clay logic: squash before, mass dips through the body mid-way, small
  overshoot, a wobble to settle. Liquids, steam and air are clay blobs that
  grow and shrink away (clay never fades).
- Keep the object and its effects inside the camera frame with margin.
