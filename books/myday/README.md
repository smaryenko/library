# My Day
A live three.js picture book about a boy's daily routines. One small toy
town stands on a wooden board like a diorama: the boy's house as a cutaway
dollhouse (bedroom, bathroom, hall, kitchen), the road with a zebra crossing,
the school with its classroom, the playground, the park with a pond and a
little shop. Every animation is its own page (story steps, as
books/longway): each routine is an `arrive` page (the camera flies there and
the boy walks to the spot) and an `act` page (the routine itself), 27 pages
in all. Turning to a page plays its step on its own; back plays it in
reverse; a jump of more than one page (first / last buttons) sets that
page's state at once (boy, camera, time of day, doors, props), with nothing
replayed. Tap the scene or press Space / Enter: always turns to the next page
(a running step is finished at once first). At the crossing he looks right,
left, right (traffic drives on the left, as in Malta). No leaf flip. The front wall fades and
the roof lifts when the camera goes inside. Time of day moves with the pages:
dawn, morning, noon, afternoon, evening, night (sun arc, sky colour, lit
windows, street lamps, stars). The boy tells the story ("I").
## Pages
Wake (asleep / sits up, yawns, stretches) · wash (to the sink / brush, foam) ·
dress (to the wardrobe / T-shirt drops on) · breakfast (to the table / spoon) ·
walk (to the kerb / looks right, left, right) · cross (walks over the zebra
crossing / waves, the car drives on) · class (to his desk / hand up) · lunch
(the whole class eats, each classmate something different: apple, banana,
yogurt; one page, he is already at his desk) · playground (to
the swing / swings) · home (in through the front door / block tower) ·
dinner (to the table / fork) · bath (into the tub / bubbles, duck) · story
(into bed, empty-handed / the book comes up, pages turn, put away) · sleep (he lies down / yawn, eyes close, light off,
glow stars).
Walk (kid.js): a natural child gait, named constants at the top: each step is
`STEP_FRAC` (0.68) of the leg length at `CADENCE` (1.9 steps/s), so
`WALK_SPEED` is about 0.53 units/s; the thigh swing is solved from the step
length so the planted foot does not slide; the swinging leg bends its knee,
arms swing opposite to the legs, a slight bob at mid-stance.
Walking per page is at most `WALK_MAX_TIME` (world.js); a longer route is
skipped ahead while the camera flies, except that a front door near the end
(within `DOOR_MAX_TIME` of walking) is kept so he walks in through it. The
zebra crossing (`fullWalk`) is always walked in full, kerb to kerb at the
road edges, as a brisk walk: `CROSS_TIME` (3 s) at `CROSS_CADENCE` (2.4
steps/s) with a longer step (`strideAmp` in kid.js swings the thigh to fit).
Front doors (house, school) swing open when he is near. Cutaways (front wall
fade + roof lift) are open whenever the active stop is inside that building,
except while he is still walking up to it outdoors: they open as he passes
the door (the boy's position is tested against the building's footprint), and
land at once on jumps and snaps (the "land at once" flag, `settleNow`, is
only cleared once the boy exists: the town is built in chunks, and clearing
it on an earlier frame left cutaways mid-fade after a jump). The duvet follows him: over his legs when he sits up, up to his
chest when he lies down.
Eating: each arm's bite pose is searched once at build time (`solveReach`) so
the hand stops just in front of the mouth, and the held food or spoon is
pointed at the mouth (`aimTool`); the mouth only opens as a small dark shape.
## Files
```
pages.js                captions; per page `stop` (world.js stop) + `step` ('arrive' | 'act')
assets/js/scene.js      renderer, camera flights, time of day, BOOK_SCENE, still fallback
assets/js/world.js      town, house, school, playground, route, every stop + animation
assets/js/kid.js        the boy (and teacher, classmates): rig, poses, walk cycle, outfits
assets/js/print.js      layout numbers + the printed ground (one canvas)
assets/js/kit.js        materials, geometry helpers, bake (merge), instancing
assets/js/backdrop.js   soft sky wash shown while the scene loads
```
## Notes
- Uses `assets/vendor/three/three.global.min.js` (three.js 0.170.0, MIT). The
  book's files are plain scripts sharing `window.MYDAY`, in load order
  kit → kid → print → world → scene. No modules, so it opens from `file://`
  too, and needs no network. Helpers were copied from `books/city/` (this book
  does not load the city's files).
- Load: the board is built before the first frame, the rest one chunk per
  frame, then shaders are compiled (`compileAsync`). Static parts are merged
  per material (`bake`); trees, fence pickets, lamp posts and pond stones are
  instanced. Classmates are live rigs (they eat at lunch).
- People (kid.js): child proportions, lathed torso, capsule limbs with joint
  balls, mitten hands; eyes with iris, pupil, highlight and a closing upper
  lid; hair styles `tousled`, `bun`, `curly`, `pigtails`, `bob`. The teacher
  uses the same rig with `adult` proportions (`legK`, `torsoK`, `armK`, `headK`).
- Quality tier (kit.js `TIER`) sets pixel ratio (capped at 2), shadow map
  size, print resolution, star and bubble counts; the pixel ratio drops
  automatically if frames run slow. The loop pauses while the tab is hidden.
- No WebGL: the scene shows `cover.svg` as a still picture.
- Each page's state belongs to that page only: an `arrive` page ends in a
  neutral pose for the place (no props of the following act); an act's props
  appear just after it starts (`PROP_IN`) and the story book is put away
  before the act ends, so the next page starts empty-handed.
- Every stop's animation is a pure function of time (`play(t, P, ctx)`), so a
  step can snap to its end, run in reverse, or be set at its end on a jump
  (world.js `setStep`, `snap`, `running`; scene.js `show`, `play`).
- No names: the boy says "I", the others are "my friends".
- Everything is original, modelled in code.
- `cover.svg` (shelf card, 400×300) and `og.svg` (1200×630) are generated
  from `preview.js` by `node tools/build-previews.js myday`: a hand-built
  vector of the book's art. `og.png` is a raster export of `og.svg`
  (headless Chrome `--screenshot`, 1200×630) and is what the og/twitter
  meta tags and the shelf `og` field point at. `favicon.svg` is hand-written.
- No music track yet.
