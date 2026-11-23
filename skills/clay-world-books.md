# Skill: clay world books (one SDF clay world, camera stops, creatures)

**When to use:** a story told in ONE stop-motion clay set (a cutaway
anthill, a burrow, a reef) where each page is a camera stop and small
creatures walk through it. Reference: `books/anthill/` ("The Ant and the
Crumb"); style preview `books/preview/assets/js/antclay.js`. For single
morphing objects see `clay-books.md` (same renderer idea).

## Structure

- `world.js` holds the numbers: rooms, tunnels, props, camera stops
  (`stop(pos, tgt, fov, dusk)`), the page scripts, and GENERATES the GLSL for
  the static world from the same numbers, so carved tunnels and walking paths
  always agree.
- `clay.js`: one shared WebGL canvas over the shown placeholder
  (`data-anthill="i"`, never the `.obj-prerender` copy). Turning the page
  flies the camera to the next stop. Tap / Space / Enter plays the page;
  tap while playing snaps to the end; tap at the end replays.
- Page scripts are pure functions of time, so a snap is free. Things that
  change (crumb delivered, opened cocoon) stay changed on later pages.
- Animate on twos (12 pictures/s) with a fresh surface boil each picture;
  render only on those ticks.

## Cost control

- Every creature behind a bounding sphere, every room's contents behind its
  own bounding check: only what is near the ray costs. Cap creatures per
  shot (4 ants).
- Tiers lower raymarch steps, shadow steps, AO and resolution; resolution
  also drops if pictures render slowly. Without WebGL2, show a flat drawing
  of the same place.

## Creature rig (ant)

- Segmented body (gaster, petiole, thorax, head) as smooth-unioned
  ellipsoids, 6 legs as capsules in a tripod gait posed on the CPU, elbowed
  antennae. Uniform per ant: x, y, pitch, facing.
- **Pitch clamp:** body pitch follows the path slope but is clamped
  (~30°) and eases to a flatter rest pitch when stopped, so a creature is
  never head-down. Legs reach down to what is left of the slope (with a
  reach limit) so feet still touch a steep floor.
- Blend facing and pitch over a short distance at path corners.

## Background in the shader

- Paint the picture's own background in the shader's miss branch (a
  rounded, feathered card: sky with sun glow and soft bokeh, a hazy ground
  plane with the contact shadow on it). Without it the set floats on the
  page. Dusk = one uniform mixing every colour.
- The book backdrop (SVG behind the book) matches: soft, low contrast, at
  creature level (e.g. a meadow seen from the ground).

## Story

- No names unless asked ("the ant", "the little ant"). One simple true fact
  per page in fiction; recheck facts before changing wording.
- The set must read as what it is: a hill is domed, not a slab.
