# Where Is the Cat?
Non-fiction concept book, 11 pages, shown with realistic wooden toys on a dark
walnut table in a softly blurred, warm room. No names: always "the cat" and
"the kitten". Picture on one page, text on the other.
- Page 1 "Where is the cat?" holds every preposition: in, on, under, behind,
  in front of, next to, between, above / below, over, around, through,
  outside, inside, up, down. It opens with the cat already in the box; each
  tap slides the cat to the next word and swaps both the red label and
  the sentence (cycles back to "in"; tap while moving snaps to the end).
  Props a word needs (little table, ball, door, ramp) grow in, the ones it no
  longer needs shrink away.
- Pages 2-11 are opposites and little words: open / closed, tall / short,
  big / small, full / empty, near / far, asleep / awake, and, or, not,
  together. Left / right are as the reader sees them (the little table
  shrinks away for those two so only the box is the reference). Each opens on the
  first word of its text; tap plays to the second, the next tap plays back.
- `assets/js/scene.js`: one three.js renderer (vendored
  `assets/vendor/three/three.global.min.js`) laid over each page's empty
  placeholder svg (`buildWhereCat(i)`, `data-wherecat="i"`). All props are
  built once. `STATIONS` (page 1): each has a resting pose (k = 1 is its
  word) and the move from the previous station (`path` of slides / arcs / lifts or a
  custom `move`), `show` / `hide` windows for props, optional camera `cam`.
  `PAGES[1..10]`: `pose(u)`, u = 0 first word, u = 1 second.
- Page 1's sentence: `pages.js` sets `window.WHERECAT_PREP` (same order as
  `STATIONS`) and wraps the shown sentence in `[data-wherecat-text]`;
  scene.js rewrites it halfway through each move (never in `.obj-prerender`).
- Room: `scene.background` is a canvas drawn tiny and scaled up (wall,
  window light from the left, blurred plant, vignette, grain); the table top
  ends at a back edge. No fog. A CSS vignette sits over the canvas.
- Camera auto-fits tightly: the props and cat poses in use are projected
  to the screen and the camera comes in until they fill the frame
  (`FIT_MARGIN`, extra `FIT_MARGIN_BOTTOM` for the word label, `FIT_MIN`).
  Page 1 is framed per station (that station's props + the cat at rest
  there) and the camera eases from one framing to the next during a move.
  It swings to the side for "behind", a little for "through", and dollies
  in low on near / far.
- Cat moves are a wooden toy pushed by hand: it slides along the table with
  a small lean and a tiny rock as it stops; height changes are short straight
  lifts / drops just clearing an edge (`LIFT_CLEAR`), never an arc or a jump
  ("over" is a lift over the box). Timings `MOVE_T`, `LIFT_T` at the top.
- Text: every preposition / opposite is red and bold (`#c8231e`, via
  `bodyHtml`), and the word label on the picture uses the same red.
- Faces: closed smiling eyes by default; asleep / awake switches to painted
  dot eyes with a highlight.
- `assets/js/backdrop.js`: `mountWherecat`, a calm warm playroom behind the
  book (window, toy shelf, plant, rug), SVG.
- Wood grain is drawn in code as seamless periodic textures (every noise
  frequency is a whole number of lattice cells across the texture, so it
  tiles without a seam); paint is a tint over the grain with clearcoat, so
  the wood shows through. Quality tiers as in the style preview
  (`books/preview/assets/js/woodtoys.js`). No WebGL: the picture stays empty.
- `cover.svg` (400×300) and `og.svg` (1200×630) are generated from
  `preview.js` by `node tools/build-previews.js wherecat` (a hand-built
  vector of the cat in the box). `og.png` is a headless Chrome
  `--screenshot` export of `og.svg` (1200×630) and is what the og/twitter
  meta tags and the shelf `og` field point at. `favicon.svg` is hand-written.
- No music yet. All art is original and made in code.
