# Skill: town step books (live 3D town, one animation per page)

**When to use:** a routine / journey story in a live toy-diorama world
(`one-world-books.md` look) where every animation is its own page, like the
story steps of `cube-world-books.md`. Reference: `books/myday/` ("My Day").

## Pages and steps

- `window.BOOK_SCENE` + `window.BOOK_PRERENDER = false`. Each page names a
  `stop` and a `step`: `arrive` (camera flies there, the figure walks to the
  spot and settles in a neutral pose) or `act` (the routine).
- Turning to a page **auto-plays** its step; back plays it in reverse.
- **Space / Enter / tap always go to the next page.** A running step is
  finished at once first; nothing ever waits on input.
- A jump of more than one page (first / last) sets that page's end state at
  once: figure, camera, time of day, doors, cutaways, props. Nothing replays.
- State is a pure function of (page, t): every stop's `play(t, P, ctx)` maps
  time to the pose, so snap / reverse / instant are the same code.
- No next-page props early: an `arrive` page ends empty for the place; an
  act's props appear just after it starts and are put away before it ends.

## Walking

- Natural child gait as named constants: step = 0.68 × leg length at 1.9
  steps/s (~0.53 units/s); thigh swing solved from step length so the planted
  foot does not slide; knee bends on the swing leg, arms opposite, a little bob.
- Cap walking per page (~2.2 s); a longer route is skipped ahead while the
  camera flies, except keep a front door near the end so he walks in.
- A road crossing is walked in full, kerb to kerb, briskly (3 s, 2.4
  steps/s, longer stride). Look the local way: Malta drives on the left, so
  look right, left, right.
- Doors swing open when the figure is near.

## Cutaways

- Front wall fade + roof lift is a pure function of the step: open while
  the active stop is inside that building, except while the figure is still
  outdoors walking up (test his position against the footprint).
- Build-order bug: the town builds in chunks; a "settle at once" flag
  cleared on a frame before the figure existed left cutaways mid-fade after a
  jump. Clear such flags only once everything they affect is built.

## Characters

- Appealing, never creepy: child proportions (head ~1/4.3 of height),
  continuous capsule limbs with joint balls (no gaps), mitten hands, a
  lathed torso.
- Eyes: white, coloured iris, pupil, highlight, and an upper lid that blinks
  and closes. Eyebrows, small nose, closed smile line.
- Mouth opens only as a small dark shape: no visible tongue, no lip colour.
- Real hair from overlapping shells and tufts, a style per person.
- Eating: solve each bite pose once so the hand stops in front of the mouth
  and aim the held food at it. Give each classmate a different food.
- End the day properly: at bedtime he actually lies down.
- No names unless asked.
