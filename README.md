# stories — pseudo-3D pop-up storybooks

A small, dependency-free web toy: a **shelf of storybooks**. The landing page
shows a grid of cards, one per book; open a book and it becomes an open
storybook lying flat in perspective. You page through it, and on each spread a
flat-cartoon character is drawn entirely in SVG and pops off the page with a
layered parallax "pseudo-3D" tilt. No WebGL, no build step, no libraries.

The first book is **xmas** (Christmas): a Christmas tree, Santa in his sleigh,
an elf, the nine reindeer, and a cozy fireplace.

> **Status: restructuring.** The project is moving from a single Christmas toy
> to a multi-book `stories` shelf. The engine, controls, and generic music
> player are shared; each book owns its folder (page roster, backdrop, character
> art, favicon, og image, cover, audio). The shelf landing page and the
> `books/xmas/` scaffold exist; the content migration is tracked in
> `.kiro/TODO.md` ("Restructure to stories"). Until it lands, the live site
> still runs from the original flat layout described under "How it works".

## Project layout (target)

```
stories/
  index.html                 shelf landing page (grid of story cards)
  assets/                     SHARED, content-agnostic
    favicon.svg, og.svg       shelf icon (a bookshelf) + shelf social image
    css/  shelf.css, book.css
    js/   stories.js (manifest), shelf.js, storybook.js,
          pseudo3d-object.js, boot.js, music.js
  books/
    xmas/
      index.html, pages.js, backdrop.js, favicon.svg, og.svg, cover.svg
      assets/ js/{reindeer,tree,santa,elf,fireplace}.js  audio/*.mp3
  skills/                      committed authoring guides (NOT gitignored)
```

Each book lives at `books/<id>/index.html`, so `books/<id>/` is a short link.

Shared vs per-book: the page-turn engine, tilt rig, shelf, boot, and the generic
music **player** are shared; the page roster, **backdrop scene**, character art,
favicon, og image, cover, and the music **track** are per-book.

## Adding a book

A book is a folder under `books/<id>/` (with an `index.html`) plus one entry in
`assets/js/stories.js`.
You should not need to touch the engine. Full steps and the folder contract are
in [`skills/book-authoring.md`](skills/book-authoring.md); the visual technique
(turning a reference into a layered pop-up object) is in
[`skills/3d-animation-from-reference.md`](skills/3d-animation-from-reference.md).

## Run

It's a static site. Serve the folder and open it:

```sh
python3 -m http.server 8777
# then open http://localhost:8777/
```

- **Turn pages:** click the right/left half of the book, swipe/drag, use the
  arrow keys / Space / PageUp / PageDown, or the on-screen nav bar
  (jump-to-first · prev · next · jump-to-last) at the bottom.
- **Tilt:** hover the pointer over a character — each part (antlers, nose,
  face, body, shadow, …) floats at a different depth, so it reads as a shallow
  3D object. With no pointer it keeps a gentle idle sway.
- **Music:** the button in the bottom-right toggles a looping "Carol of the
  Bells". It's off by default and starts on your click.

## The story (14 pages)

Christmas tree → Santa → Elf → a short text-only interlude → the nine reindeer
(Dasher … Rudolph) → a "Merry Christmas!" fireplace finale. Each spread shows
one character on one page and its line of text on the other; the image/text
side alternates as you turn.

## How it works

The shared engine is content-agnostic; each book supplies its own content.

- **Shelf (the library)** — `index.html` is a warm wooden bookcase: each book
  stands on a shelf plank as a "book" card (cover art + a kid-friendly title and
  blurb). `assets/js/stories.js` is the manifest (one entry per book: title,
  cover, favicon, og, theme, backdrop fn, track); `assets/js/shelf.js` renders
  the books into the bookcase; `assets/css/shelf.css` styles the wood, planks,
  and books. Each book links to `books/<id>/`.
- **Book page** — `books/<id>/index.html` loads the shared engine plus that
  book's content and boots via `assets/js/boot.js`. A top-left "Library" button
  (styled by `book.css`) returns to the shelf. Boot resolves the book from the
  URL path (`books/<id>/`), sets the music track, mounts the book's
  backdrop, and inits the engine.
- **Pseudo-3D** — `assets/js/pseudo3d-object.js` `mountObject(host, svg)` splits
  any `data-part` SVG into one DOM layer per part, assigns each a Z depth
  (`OBJ_DEPTH`), and on tilt rotates the stack while shifting each layer by its
  depth (parallax).
- **Engine + flow** — `assets/js/storybook.js` builds the open-book stage, the
  page-turn flip, all the navigation inputs, the content swap, the idle motion,
  the page nav bar, and the music button. It renders `window.BOOK_PAGES` — the
  roster the current book injects — and holds no story data itself.
- **Music** — `assets/js/music.js` is a generic looping-audio player; it plays
  whatever track the manifest names (created on first click to satisfy autoplay
  policies). The track file is a per-book asset.
- **Styles** — `assets/css/book.css` holds the book/stage/flip/overlay styles,
  the nav bar, and the mobile layout; it's shared by every book.
- **Accessibility** — `prefers-reduced-motion` is honoured: the flip/pop are
  toned down, the idle sway stops, and the snow freezes to a still frame.

### The xmas book (`books/xmas/`)

- `pages.js` — the 14-page roster (`window.BOOK_PAGES`).
- `assets/js/reindeer.js` — `buildReindeer(cfg)` (nine distinct reindeer);
  `assets/js/tree.js`, `santa.js`, `elf.js`, `fireplace.js` — the story art.
- `backdrop.js` — the winter night scene (moon, hills, decorated pines, a
  string of Christmas lights) plus animated canvas snowfall (`mountWinter`).
- `assets/audio/carol_of_the_bells.mp3` — the looping track.
- `favicon.svg` — original reindeer-head icon; `cover.svg` — the shelf-card art;
  `og.svg` — social preview (raster `og.png` export is a nice-to-have).

## Reindeer config

`buildReindeer(cfg)` accepts:

| key           | values                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `fur`         | hex colour of the coat                                                 |
| `furDark`     | hex colour for ears / back legs                                        |
| `belly`       | hex colour of the belly + muzzle patch                                 |
| `antlerStyle` | `wide` \| `tall` \| `bushy`                                            |
| `antlerColor` | hex colour of the antlers                                              |
| `nose`        | `red` (Rudolph) \| `brown`                                             |
| `accessory`   | `none` \| `scarf-<colour>` \| `collar` \| `vest-green` \| `vest-red` \| `santa-hat` |

(antler **style** and antler **colour** are separate fields — don't merge them.)

## Status

- [x] Multi-book shelf: card grid landing page driven by a manifest
- [x] Shared, content-agnostic engine (stage, flip, nav, tilt, idle sway, music)
- [x] Per-book folders: roster, backdrop, character art, favicon, cover, track
- [x] xmas book: tree, Santa, elf, fireplace + the nine distinct reindeer
- [x] Winter backdrop with Christmas lights and animated snow
- [x] Generic looping-music player (off by default), per-book track
- [x] Shelf + per-book favicons (bookshelf shelf icon), reduced-motion support
- [x] OG/social images for the shelf and the xmas book (SVG)
- [ ] Raster `og.png` exports (broadest social-scraper support)
- [ ] A second book (to exercise the shelf with more than one entry)
- [ ] Custom festive font (currently the system stack)
- [ ] Optional character pose variation

## License / assets

All art is original SVG authored in this project. Stock images (a "Santa's
reindeer" group, a tree, a sleigh, an elf, a fireplace, a Santa hat) were used
only as visual *style references* — never copied, traced, or shipped; they live
under the gitignored `.kiro/` and stay out of the repo. The "Carol of the
Bells" melody ("Shchedryk", Leontovych, 1914) is public domain; the bundled
`books/xmas/assets/audio/carol_of_the_bells.mp3` is the audio actually played.
The portable authoring guides in `skills/` (reference → pop-up technique, book
authoring, SVG style, licensing) ship with the repo. See
[`skills/asset-licensing.md`](skills/asset-licensing.md).
