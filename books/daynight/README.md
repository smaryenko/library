# Bunny Day, Owl Night

A toddler book with a day | night divider on every spread. Built like a real
pop-up (castle style): a printed meadow on the paper (`page.ground()`,
placed into `.spread` by slider.js) and standing die-cut pieces with paper
rims (`page.build()`, `data-floor`): sky card, hills, the big oak, props,
Bunny, Owl, a grass strip. Every piece has a day twin (`dn-d-*`) and a night
twin (`dn-n-*`); day ones are clipped right of the seam, night ones left.

- Pages 1-10: the scene opens split on the oak's trunk, night on the left
  (Owl), day on the right (Bunny). Drag the line right for night, left for
  day. Past 80% the side's text shows at the bottom of its page (night left,
  day right); extras fade in from 60%. Release snaps to night / day / middle.
  Tap the moon or sun on the grip to jump there. Arrow keys work too.
- Page 11: sunset finale, no slider, both friends together.

Story: two parallel stories that meet at the end. Night: Owl and the night
friends (hedgehog, frog, bat, mouse, badger, moth, fireflies) get Bunny's
surprise birthday party ready and leave a feather clue at each place. Day:
Bunny and the day friends (squirrel, duck, butterfly, robin, snail) follow
the feathers. Finale: the sunset party, everyone together. The divider
keeps its position across page turns, so either story reads start to end.
Taps on the outer ~12% strips turn the page (`data-hit`).

Files:
- `assets/js/animals.js`: the supporting cast and story items (feather,
  cake, gift), each drawn at its ground point, facing left.
- `assets/js/scene.js`: the art. `buildDayNight(cfg)` / `groundDayNight(cfg)`
  draw the day and night twins from one seeded layout; `buildDusk()` /
  `groundDusk()` are the finale (`dn-k-*`, no slider).
- `assets/js/slider.js`: attaches the divider to each slider picture (spots
  it with a MutationObserver; no engine change). Sets `--dn-seam`,
  `--dn-nfx`, `--dn-dfx` on the host.
- `assets/css/daynight.css`: the night clip, the divider, the two texts.
- `pages.js`: `night` / `day` text per page, scene options.

Not yet: music. `cover.png` (shelf, 800x600) and `og.png` (1200x630) are stills of
the first spread, night | day.
