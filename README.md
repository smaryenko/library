# stories — pop-up storybooks

A small, dependency-free web toy: a **shelf of storybooks**. The landing page
shows a grid of cards, one per book; open a book and it becomes an open
storybook lying flat in perspective. You page through it, and on each spread a
picture pops off the page with a layered parallax "pseudo-3D" tilt. **Tap a
picture and it plays its own little animation.** No WebGL, no build step, no
libraries.

> **Art direction:** pictures are **detailed & believable but kid-friendly** —
> warm and a touch stylised, yet richly drawn with real volume, materials, and
> faces that have real structure. Never flat, under-detailed placeholder art.
> See [`skills/svg-character-authoring.md`](skills/svg-character-authoring.md).

Pictures can be layered SVG art, real rendered objects (canvas spheres from
real surface maps), or real photos turned into pop-up cut-outs. Every book
lives in its own folder under `books/<id>/`, and its `README.md` describes its
story, cast, files and asset credits. The shelf lists the books from the
manifest in `assets/js/stories.js`.

## Project layout

```
stories/
  index.html                 shelf landing page (grid of story cards)
  assets/                    SHARED, content-agnostic
    favicon.svg, og.svg      shelf icon + shelf social image
    css/  shelf.css, book.css, fullview.css
    js/   stories.js (manifest), shelf.js, storybook.js, boot.js,
          pseudo3d-object.js, anim.js, motion.js, music.js,
          color.js, fullview.js, pinch.js
  tools/
    build-previews.js        regenerates cover.svg + og.svg for every book
                             with a books/<id>/preview.js
  books/<id>/                ONE folder per book (see its README.md)
    index.html, pages.js, README.md, favicon.svg, cover.*, og.*,
    preview.js (optional), assets/{js,css,audio}/
  skills/                    committed authoring guides
```

Each book lives at `books/<id>/index.html`, so `books/<id>/` is a short link.

Shared vs per-book: the page-turn engine, tilt rig, picture wrapper, shelf,
boot, full-screen view and the generic music **player** are shared; the page
roster, backdrop scene, picture builders, favicon, og image, cover, and the
music **track** are per-book.

## Adding a book

A book is a folder under `books/<id>/` (with an `index.html` and a `README.md`)
plus one entry in `assets/js/stories.js`. You should not need to touch the
engine. Full steps and the folder contract are in
[`skills/book-authoring.md`](skills/book-authoring.md); the visual technique
(turning a reference into a layered pop-up object) is in
[`skills/3d-animation-from-reference.md`](skills/3d-animation-from-reference.md).
For real rendered objects instead of SVG art, see
[`skills/real-sphere-books.md`](skills/real-sphere-books.md); for real photos
as pop-up cut-outs, see
[`skills/photo-cutout-books.md`](skills/photo-cutout-books.md).

## Run

It's a static site. Serve the folder and open it:

```sh
python3 -m http.server 8777
# then open http://localhost:8777/
```

- **Turn pages:** click the right/left half of the book, swipe/drag, use the
  arrow keys / Space / PageUp / PageDown, or the on-screen nav bar
  (jump-to-first · prev · next · jump-to-last) at the bottom.
- **Tilt:** hover the pointer over a picture — each part floats at a different
  depth, so it reads as a shallow 3D object. With no pointer it keeps a gentle
  idle sway.
- **Tap to animate:** tap the picture and it plays its own one-shot animation
  (or opens full screen, where a book uses that). Tapping anywhere else turns
  the page.
- **Full screen:** on touch screens, two fingers pinch-zoom and one finger
  pans once zoomed; on a computer the view just fits the window.
- **Music:** the top-right button toggles the book's looping track. It's off
  by default and starts on your click; a book with no track shows no button.

Each spread shows one picture on one page and its text on the other; the
image/text side alternates as you turn. Text-only spreads are optional.

## How it works

The shared engine is content-agnostic; each book supplies its own content.

- **Shelf** — `index.html` is a responsive grid of story cards (cover art + a
  kid-friendly title and blurb). `assets/js/stories.js` is the manifest (one
  entry per book: title, blurb, category, cover, favicon, og, theme, backdrop
  fn, track, optional hint); `assets/js/shelf.js` renders the cards;
  `assets/css/shelf.css` styles them. Each card links to `books/<id>/`.
- **Book page** — `books/<id>/index.html` loads the shared engine plus that
  book's content and boots via `assets/js/boot.js`, which adds the "Library"
  button, stage and hint, sets the music track, mounts the book's backdrop, and
  inits the engine.
- **Engine + flow** — `assets/js/storybook.js` builds the open-book stage, the
  page-turn flip, navigation inputs, content swap, idle motion, nav bar and
  music button. It renders `window.BOOK_PAGES` (the roster from the book's
  `pages.js`) and holds no story data itself.
- **Picture wrapper** — every picture sits in the image slot, which
  `storybook.js` sizes from the picture's viewBox aspect ratio and places on
  its page half: page width minus a 4% margin each side, centred on the page,
  never taller than the page (or 78% of the stage). Books don't add slot CSS.
- **Next-page prerender** — after a spread lands, the next page's picture is
  built and mounted in a hidden, slot-sized box (its `<style>`s parked with
  `media="not all"`), then moved into the slot on the turn instead of being
  rebuilt. On for every book; opt out with `window.BOOK_PRERENDER = false` in
  `pages.js` (space does, for its live canvas spheres).
- **Pseudo-3D** — `assets/js/pseudo3d-object.js` `mountObject(host, svgString,
  opts)` splits a `data-part` SVG into one layer per part, gives each a Z depth
  from the shared `OBJ_DEPTH` map, and parallaxes the stack on tilt. Its
  `play()` runs the picture's embedded one-shot animation.
- **Click animation** — every picture ships its OWN animation inside its SVG.
  Builders write it with `assets/js/anim.js` (`buildAnim(uid, { tracks })`,
  a uid-scoped `<style>`) or compose it from the Motion library
  (`assets/js/motion.js`, `Motion.rig`). The engine toggles `is-playing` on
  tap. Animations can spawn effect-only parts (`data-part="fx-…"`). See
  [`skills/svg-character-authoring.md`](skills/svg-character-authoring.md).
- **Full-screen view** — `assets/js/fullview.js` (+ `fullview.css`) opens a
  `data-fullview` picture full screen; `assets/js/pinch.js` gives every
  full-screen view two-finger zoom on touch screens only
  (`data-fullview-zoom="off"` opts out).
- **Shared helpers** — `assets/js/color.js` provides `shade(hex, pct)`;
  `tools/build-previews.js` sets it as a node global too.
- **Music** — `assets/js/music.js` loops whatever track the manifest names
  (created on first click to satisfy autoplay policies).
- **Styles** — `assets/css/book.css` holds the book/stage/flip/overlay styles,
  the nav bar and the mobile layout.
- **Cache-busting** — every shared `../../assets/` file carries the same
  `?v=N` in every book's `index.html`. When a shared file changes, bump that
  number in all books together; book-local files keep their own.
- **Accessibility** — `prefers-reduced-motion` is honoured: the flip/pop are
  toned down and the idle sway stops; book backdrops freeze their motion.

## License / assets

Art is original by default. Any exception (real texture maps, real photos) and
every audio track is credited in that book's own `README.md`. Reference images
are used only as visual style references — never copied, traced, or shipped;
they live under the gitignored `.kiro/`. The rules are in
[`skills/asset-licensing.md`](skills/asset-licensing.md).
