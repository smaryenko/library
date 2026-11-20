# The Little Wizard's Lost Spellbook
Fiction minigame book, ages 6-10, 14 pages, in layered cut paper and gold
foil. On the first day at wizard school Pip the cat knocks the spellbook out
of the window and its 12 gold pages scatter round the castle. Every page has a
small puzzle; solving it wins one page back and unlocks the next arrow. The
finished book casts the first big spell: fireworks over the castle.
- `assets/js/paper.js`: the cut-paper kit `window.PAPER` (the approved style
  from `books/preview/assets/js/papercut.js`). `kit(seed)` gives one picture
  a fresh uid and its helpers: `piece` / `p` (one card piece with a jittered
  scissor edge, grain and its own drop shadow via the `-pp` filter), `disc`,
  `foil` stars, `glow`, class groups `g`, `anim` (one tap rule), and the cast
  and props: `wizard`, `pip`, `goldPage`, `spellbook`, `castle`, `goblin`,
  `dragon`, `paperBird`, `gear`, `candle`, `torch`, `bottle`, `bookRow`,
  `wall`, `floor`, `archWindow`. `end({ css, sky })` returns the `<svg>`.
  Also the shared keyhole `shapeD` and the `RUNES` the tasks draw too.
- `assets/js/scenes.js`: `window.SPELLBOOK_SCENES`, one builder per page.
  Each room is its own setting (classroom, potion room, library, corridors,
  locked door, paper-bird post, greenhouse, spell circle, kitchen, tower
  stairs, observatory, mirror hall, dragon's nest, fireworks) and hides one
  gold page from page 2 on. Each tap motion lives in the picture's own
  `<style>` (classes keyed by the uid), lasts at most 2.4 s and ends in the
  start pose.
- `assets/js/tasks.js`: `window.SPELLBOOK_TASKS`, one `(seed, ctx) => spec`
  per page for `assets/js/minigame.js`. Everything comes from `ctx.rng`, so
  ↻ gives new numbers; `ctx.level` makes later pages harder (bigger maze,
  half hours, longer rune patterns, more gears, 8-wide mirror grid).
  Kinds: tap, pick (bottles, coins), choice (count, clocks, runes, cookies,
  gears), maze, drag (keys, seeds), order (dot-to-dot, page order), cells
  (mirror). Every spec has a kid prompt and a gentle hint (after 3 misses).
- `pages.js`: 14 puzzle pages + the closing page `end` (no puzzle, text back
  on the page), `{ id, title, body, build, task }`, split layout, prerender
  on, `MINIGAME_CAPTION = 'below'`: on a puzzle page the title and text sit
  in a caption right under the book and the puzzle is scaled to fit the
  visible part of the text page.
- Puzzle rules learned while testing: a potion's extra bottles are always
  fewer drops than the recipe (never the target itself); dot-to-dot stars
  closer than a dot are dropped; answer buttons wrap long words.
- Depth: the shared `pp-*` layers in `OBJ_DEPTH` (sky, moon, far, castle,
  cloud, near, trees, chars, pages).
- Style: deep purples and lilac, gold foil, warm candle and lantern light,
  the palette shifts a little per room. Faces are friendly: dot eyes, small
  smiles. No sounds, no timers. All art is original and drawn in code.
- `cover.svg`, `og.svg`, `favicon.svg`: hand-written static SVG in the same
  style.
