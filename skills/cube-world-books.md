# Skill: toy-cube world books (one continuous WebGL world, story steps)
**When to use:** a journey story built of toy building cubes (magnetic toy
cubes on a table, not the video game), where a page turn is travel.
Reference: `books/longway/` ("The Long Way Home").

## How it works
- Hosted by the shared `assets/js/webgl-stage.js`: each page's `build()`
  returns `WEBGL_STAGE.placeholder(kind, i)`; the world registers itself
  with `WEBGL_STAGE.register(kind, renderer => world)`. Consecutive pages of
  the same kind are one world: the turn calls `world.show(i)`, no leaf flip.
  Set `layout: 'popup'` on every page and `window.BOOK_PRERENDER = false`.
- `cubes.js`: textures are 16x16 pixel pictures drawn in code, scaled up with
  `NearestFilter`, with a printed light/dark bevel and thin rim so every cube
  reads as a separate piece. `figure()` = body cube + head cube with a face.
- `world.js`: the ground is a function of (x, z) (town, islands as
  super-ellipses, home); houses, trees, towers are cube stamps. One
  `InstancedMesh` per cube type; cubes boxed in on all six sides are skipped.
  Moving things (boat, people, animals, props) are ordinary meshes.
- One world laid out left to right; page i = camera stop `CAM_X[i]` with its
  own light (`LIGHT[i]`: background/fog, sun colour, strength, height).

## The story as one number
- Segments: event of page 1, travel 1 -> 2, event of page 2, ... Each is a
  list of actions `{ dur, prep?, run(st, k) }` (`walk`, `board`, `ashore`,
  `sail`, `boat(fn)`, `prop(name)`, `face`, `lie`, `wait`, `par`). `run` reads
  the state it starts from, then writes, so it is pure in k.
- At load the segments are simulated once; every action keeps a snapshot of
  its start state. `evalAt(s)` = clone the snapshot, run with the local k.
- Page i rests at s = 2i, its event ends at 2i + 1. forward() / back() move
  the target by one step and return false when the page is done (the engine
  turns the page, show(i) then runs the travel). A running step is snapped to
  its end first, so nothing ever waits; back plays everything in reverse.
- Props are numbers 0..1 in the state (`p.keeper`, `p.storm`...); `apply()`
  turns the whole state into object transforms each frame it changes.

## Rules learned in the preview
- Nothing auto-plays: Theo stands still until the first input.
- Keep each event walk short (about six cubes); long walks go in travel.
- `frustumCulled = false` on the instanced meshes (bounds are taken while
  cubes are hidden / in the air, so whole types vanished when the camera moved).
- Fog scaled to the camera distance; a fixed fog washed phones out.
- Caption at the bottom; the scene is fitted above it. Portrait may crop the
  open sea at the sides, never the town.
- Going back, a walking figure is turned round (it would moonwalk otherwise).
- Drop-in opening only near the first camera stop, bottom layer first; the
  columns under the hero and the boat are there from frame one.
## See also
- `town-step-books.md` (`books/myday/`): the same story-step idea with one
  animation per page, auto-play on turn and Space always advancing.
