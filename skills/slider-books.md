# Skill: slider books (two versions of one picture, e.g. day | night)

**When to use:** a book where every spread is ONE pop-up scene in two
versions (day / night, summer / winter, before / after) and the reader drags
a divider across it to reveal one or the other. Each version tells its own
story, so the book reads end to end from either side. The reference
implementation is `books/daynight/` ("Bunny Day, Owl Night").

No engine edits. It's a `BOOK_LAYOUT = 'popup'` book; a self-contained
`slider.js` finds each mounted picture with a MutationObserver and adds the
divider, the texts, the reveal and the leaf painting.

## Files

- `index.html`: engine CSS/JS, then the book's CSS after `book.css`; scripts
  in order: engine → `backdrop.js` → art (`animals.js`, `scene.js`) →
  `slider.js` → `pages.js` → `boot.js` last. `?v=N` on every file; bump on edit.
- `pages.js`: `window.BOOK_LAYOUT = 'popup'` + `window.BOOK_PAGES`.
- `assets/js/scene.js`: `build()` (standing pieces) and `ground()` (printed
  paper) builders, exported on `window`.
- `assets/js/slider.js`: copy daynight's and rename. It hardcodes the `dn-`
  prefix, `DEPTH_V`, grip icons, `FLAT` leaf colours and the aria text.
- `assets/css/<id>.css`, `assets/js/backdrop.js` (registered in
  `assets/js/stories.js` as `backdrop: '<fn>'`), `README.md`, `favicon.svg`,
  `cover.png` 800×600, `og.png` 1200×630, shelf entry in `stories.js`.
  See `book-authoring.md` for the shared parts.

## Page data

```js
const P = (i, place, night, day, extra) => {
  const cfg = Object.assign({ page: i, place }, extra || {});
  return { night, day, ground: () => groundDayNight(cfg), build: () => buildDayNight(cfg) };
};
window.BOOK_PAGES = [ P(0, 'burrow', 'Night text…', 'Day text…', { bunny: { u: 1130, v: 540 }, … }), … ];
```

- `night` / `day`: the two story lines (no `title`/`body`: the engine caption
  is hidden on slider pages via `body.dn-slider-on`).
- `cfg.page` **must equal the array index**: slider.js finds the page through
  `BOOK_PAGES[data-dn-page]`.
- A non-slider page (the finale) is a normal popup page `{ title, body,
  ground, build }` whose SVG carries `data-dn-still`; slider.js moves its
  engine caption under the book.

## The scene contract (`build()`)

- Root: `<svg viewBox="0 0 1600 1000" data-floor="520" data-dn-page="i"
  data-hit="x y w h">`. `data-floor`: rows 520..1000 map onto the page as seen
  (far → near edge). `data-hit`: tap box; taps outside it turn the page.
- Ground coords: `u` 0..1600 across, `v` 0 (far) .. 800 (near).
  `toScene(u, v)` gives the scene point where a piece standing there has its
  base; scene x 0..1600 = the book's near edge.
- Every piece exists twice: `<g data-part="dn-d-KEY">` (day) and
  `<g data-part="dn-n-KEY">` (night), drawn from **one seeded layout** so the
  twins line up exactly at the seam. KEY sets the depth the seam is measured
  at (`DEPTH_V` in slider.js: `sky 22, hill 70, tree 430, cast 620, fx 620,
  front 795`, unknown = 600).
- `dn-*-fx` layers are effects (fireflies, rain); they fade in only past 60%
  towards their side.
- **Few layers.** Every `data-part` becomes a full-size GPU layer. Group pieces
  into ~5 depth layers per side (back, tree, cast, fx, front grass), not one
  per animal.
- Pop-up look without filters: each die-cut piece is shadow + white paper rim
  as **strokes** of its silhouette (`cut()` in scene.js). SVG filters on a
  layer that's re-clipped every drag frame are very slow.
- Prefix every id with a per-build UID (`'dn' + UID++`): the prerendered next
  picture and the leaf copies are in the DOM at the same time.

## The ground (`ground()`)

Returns two full-spread SVGs: `<div class="dn-g dn-g-day">` and
`<div class="dn-g dn-g-night">`. slider.js mounts them in `.book .spread`
(flat on the tilted paper, `translateZ(1px)`), adds four zero-size corner
markers, and cross-fades the old ground out under the new one (the old stays
opaque until removed, so paper never shows through).

## How the divider works

- **Seam on the paper, in perspective.** The ground is cut at fraction `s` in
  its own tilted space (the browser projects it). Each standing layer is cut
  where that line passes under its base: the measured ground corners give the
  screen x of the seam at the layer's depth (`seamAt(C, s, t)`). So the cut
  runs along the ground and rises straight up through each piece.
- **Reveal by translate, not clip-path.** Changing a clip repaints the whole
  layer (slow on phones). Each half sits in an `overflow: hidden` box; the box
  slides by `d` and its picture slides back by `-d` (CSS `translate`), so a
  drag frame is compositing only. `clip-path` is only the fallback.
- Right = night grows, left = day grows. Release snaps to 0 / 0.5 / 1
  (`SNAP_END 0.72`); a tap on the grip's moon / sun half jumps there. A side's
  text shows past 80% (`TEXT_AT`). Arrow keys, Home / End work; the handle is
  `role="slider"` with `aria-valuenow` / `aria-valuetext`.
- The position (`shared`) is kept across page turns.
- **Don't let the drag turn the page.** The engine listens on `window` and
  treats a 60px horizontal move as a swipe, even on the picture. The handle
  calls `stopPropagation` on pointerdown / move / up / cancel / click and on
  its keys, uses `setPointerCapture` and `touch-action: none`. Only the 64px
  grab strip and the grip take pointers; the rest of the picture still gets
  engine taps and swipes.

## The page turn

The engine's leaf is plain paper, so a blank sheet swept over the meadow.
slider.js watches `.leaf` class changes and paints the ground onto the leaf
faces: forward = front gets the old right half, back gets the new left half
(reverse for backward), clipped at the current seam. Clip the new ground
**before** the leaf copies it, or the turning page shows the other version.

## Performance (all learned on phones / school boards)

- GPU layers (`will-change: transform` under `body.dn-live`) stay on the
  whole time a slider page is shown. Turning them on at drag start left one
  unpainted frame: the grass blinked. Turn them off only during the flip.
- Phones get a light leaf: flat day/night colour bands split at the seam
  instead of cloning two full SVGs onto a rotating 3D layer.
- Prebuild the neighbouring pages' grounds (i ± 1) in `requestIdleCallback`
  after the turn has settled; the engine already prerenders the next picture.
- Measure geometry once at rest (~1000 ms after arriving) and reuse it.
  Measuring mid-turn read the moving leaf / pop-in and made the divider jump.
- On resize / rotation re-measure at 260 and 700 ms: the engine refits ~120 ms
  after the last resize, so measuring at once read the old layout.
- Set fx opacity on the layers directly, not through an inherited custom
  property (that restyled every node every frame). One rAF render per frame.
- No `filter` on the slider host (`.dn-host { filter: none !important }`).

## Mobile

- `fitToBook()`: on portrait phones the engine sizes the pop-up from the
  page's height and the scene came out ~2× screen width. If the slot is
  clearly wider than the ground's near edge, shrink it to that edge.
- Texts sit in one centred box just under the book; `textTop()` lifts it
  above the bottom nav when they'd overlap (ignored on phone landscape, where
  the nav is a left column).
- Smaller grip and text under `(max-aspect-ratio: 3/4), (max-width: 800px)`.
