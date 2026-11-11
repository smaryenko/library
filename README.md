# stories — pop-up storybooks

A small, dependency-free web toy: a **shelf of storybooks**. The landing page
shows a grid of cards, one per book; open a book and it becomes an open
storybook lying flat in perspective. You page through it, and on each spread a
detailed, kid-friendly character is drawn entirely in SVG and pops off the page
with a layered parallax "pseudo-3D" tilt. **Tap a character and it plays its own
little animation.** No WebGL, no build step, no libraries.

> **Art direction:** pictures are **detailed & believable but kid-friendly** —
> warm and a touch stylised, yet richly drawn with real volume, materials, and
> faces that have real structure. Not stark photorealism, and never flat,
> under-detailed placeholder art (no one-rectangle rug, no two-dot face). See
> [`skills/svg-character-authoring.md`](skills/svg-character-authoring.md).

Seven books ship today:

- **xmas** (Christmas): a Christmas tree, Santa in his sleigh, an elf, the nine
  reindeer, and a cozy fireplace.
- **race** (Race Day): four toy cars (Turbo, Bolt, Rusty, Jade) racing one lap
  around a living room — a start grid, the hallway, a book-stack ramp, the
  kitchen tiles, a shaggy rug, a loop-the-loop, and a friendly tie finish.
- **reef** (A Day on the Reef): a clownfish chases a runaway spiral shell across
  a sunlit reef, meeting a pufferfish, an octopus, a sea turtle, a seahorse, a
  friendly moray eel, and a jellyfish — the shell turns out to be a hermit
  crab's house, and the reef lights up to welcome a new friend.
- **space** (Our Solar System): the Sun, eight planets, the Moon, Pluto, and
  both asteroid belts. Unlike the others, these are **real rotating spheres**
  made from real surface maps, not SVG. Tap a picture and it flies up to fill
  the screen.
- **trains** (Trains Through Time): how trains evolved, from a horse tram to a
  maglev, in **real colour photos** turned into pop-up cut-outs, with a station
  clock intro and a wooden toy train ending.
- **dino** (Dinosaurs): real dinosaurs, each shown to scale next to a child.
- **seasons** (A Fox's Year): one red fox through spring, summer, autumn and
  winter, in a realistic painted-fur style.

The multi-book `stories` shelf is in place: the engine, controls, and generic
music player are shared, and each book owns its folder (page roster, backdrop,
character art, favicon, og image, cover, audio). Adding another book needs no
engine changes.

## Project layout

```
stories/
  index.html                 shelf landing page (grid of story cards)
  assets/                     SHARED, content-agnostic
    favicon.svg, og.svg       shelf icon (a bookshelf) + shelf social image
    css/  shelf.css, book.css
    js/   stories.js (manifest), shelf.js, storybook.js,
          pseudo3d-object.js, anim.js, motion.js, boot.js, music.js
  tools/
    build-previews.js   node tools/build-previews.js → regenerates each book's
                        cover.svg + og.svg from its books/<id>/preview.js
  books/
    xmas/
      index.html, pages.js, favicon.svg, og.svg, cover.svg
      assets/ js/{backdrop,reindeer,tree,santa,elf,fireplace}.js  audio/*.mp3
    race/
      index.html, pages.js, favicon.svg, og.svg, cover.svg
      assets/ js/{backdrop,car,props}.js  audio/*.mp3
    reef/
      index.html, pages.js, favicon.svg, og.svg, cover.svg
      assets/ js/{backdrop,reeflife,props}.js
    space/
      index.html, pages.js, favicon.svg, og.png, cover.png, preview.py
      assets/ js/{backdrop,solar,scenes}.js  js/tex/*.js (baked maps)
              css/planets.css  audio/*.mp3
    trains/
      index.html, pages.js, favicon.svg, og.png, cover.png, img/*.jpg
      assets/ js/{backdrop,photocut,scenes,scenes2}.js  css/trains.css
              audio/train.mp3   preview/ (canvas + three.js backups)
    dino/
      index.html, pages.js, preview.js, favicon.svg, og.*, cover.svg
      assets/ js/{backdrop,kit,dino,animals,scenes}.js  css/dino.css  audio/
    seasons/
      index.html, pages.js, preview.js, favicon.svg, og.*, cover.svg
      assets/ js/{backdrop,furpaint,fox,nature,scenes}.js  audio/
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
- **Tilt:** hover the pointer over a character — each part (antlers, nose,
  face, body, shadow, …) floats at a different depth, so it reads as a shallow
  3D object. With no pointer it keeps a gentle idle sway.
- **Tap to animate:** click/tap the pop-up character and it plays its own
  one-shot animation (the dancer dances, a car pops a wheelie, the loop car
  laps the loop, Rudolph's nose glows). Tapping anywhere else turns the page.
- **Music:** the top-right button toggles the book's looping track (xmas plays
  "Carol of the Bells"; race has its own). It's off by default and starts on
  your click; a book with no track shows no button.

## The stories

- **xmas (14 pages):** Christmas tree → Santa → Elf → a text-only interlude →
  the nine reindeer (Dasher … Rudolph) → a "Merry Christmas!" fireplace finale.
- **race (14 pages):** the starting grid → the four racers (Turbo, Bolt,
  Rusty, Jade) → a "GO!" interlude → the hallway, ramp, kitchen, shaggy carpet,
  and loop → a neck-and-neck interlude → a photo-finish tie where everybody wins.
- **reef (14 pages, no text-only):** the reef at home → the clownfish → the
  shell → the current → the pufferfish, octopus, sea turtle, seahorse → coral
  garden and kelp forest scenes → a friendly moray eel → the hermit-crab reveal
  → the jellyfish → the whole reef lighting up for a new friend.
- **space (14 pages):** the whole system on its orbits → the Sun → Mercury →
  Venus → Earth with the Moon → the Moon → Mars → the Asteroid Belt → Jupiter
  → Saturn → Uranus → Neptune → Pluto with Charon → the Kuiper Belt.
- **trains (16 pages):** a station clock → horse tram → steam (Rocket,
  Jupiter, mail car, logging engine, Mallard) → diesel → electric →
  Shinkansen → Underground → funicular → monorail → maglev → double-decker →
  a wooden toy train ("maybe you'll build the next one").
- **dino (14 pages)** and **seasons (12 pages):** see each book's folder.

Each spread shows one object on one page and its line of text on the other; the
image/text side alternates as you turn.

## How it works

The shared engine is content-agnostic; each book supplies its own content.

- **Shelf (the library)** — `index.html` is a responsive grid of story cards
  (cover art + a kid-friendly title and blurb) over a soft dark mesh-gradient
  background. `assets/js/stories.js` is the manifest (one entry per book: title,
  cover, favicon, og, theme, backdrop fn, track); `assets/js/shelf.js` renders
  the cards; `assets/css/shelf.css` styles the grid and background. Each card
  links to `books/<id>/`.
- **Book page** — `books/<id>/index.html` loads the shared engine plus that
  book's content and boots via `assets/js/boot.js`. A top-left "Library" button
  (styled by `book.css`) returns to the shelf. Boot resolves the book from the
  URL path (`books/<id>/`), sets the music track, mounts the book's
  backdrop, and inits the engine.
- **Pseudo-3D** — `assets/js/pseudo3d-object.js` `mountObject(host, svg)` splits
  any `data-part` SVG into one DOM layer per part, assigns each a Z depth
  (`OBJ_DEPTH`), and on tilt rotates the stack while shifting each layer by its
  depth (parallax). It also exposes `play()`, which the engine calls on an image
  tap to run that object's embedded one-shot animation.
- **Click animation** — every object ships its OWN short animation inside its
  SVG (no central/global keyframes). Builders author it with the shared
  `assets/js/anim.js` helper (`buildAnim(uid, { tracks })`), which returns a
  scoped `<style>` block, or compose moves from the shared Motion library
  (`assets/js/motion.js`, whose `Motion.rig` lets a limb `follow` its body
  while doing its own motion). The engine toggles an `is-playing` class per
  layer on tap and clears it when the motion ends. Animations can also **spawn
  effect-only elements** (`data-part="fx-…"`, hidden at rest) — a ground crack
  under a stomp, exhaust clouds from a revving car, a sparkle burst. See
  [`skills/svg-character-authoring.md`](skills/svg-character-authoring.md).
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
- [x] **Seven books live** (incl. trains: real photo cut-outs; dino; seasons) (incl. space: real canvas planets, tap-to-zoom); xmas (tree, Santa, elf, fireplace + the nine
      distinct reindeer), race (four toy cars + the track scenes around one
      lap), and reef (a clownfish's shell-chase + a reef full of sea creatures)
- [x] Tap-to-animate: every picture plays its own one-shot click animation,
      authored via the shared `anim.js` / `buildAnim` helper — distinct per
      character, rich and full-page (objects can drive/leap off the page and
      back)
- [x] Animations can **spawn effect-only elements** (`fx-*`: a ground crack
      under a stomp, exhaust clouds from a revving car, a sparkle) — hidden at
      rest, shown only while playing
- [x] Art direction: detailed & believable, kid-friendly (never flat/minimal);
      documented in `skills/`
- [x] Winter backdrop with Christmas lights and animated snow (xmas); per-book
      backdrops + looping music track (off by default)
- [x] Shelf + per-book favicons, OG/social images (SVG), reduced-motion support
- [ ] Raster `og.png` exports (broadest social-scraper support)
- [ ] More books (the shelf is built for many; seven exist today)
- [ ] Custom festive font (currently the system stack)

## License / assets

All art is original SVG authored in this project, with one documented
exception: the space book uses real, clearly licensed planet maps (Solar
System Scope CC BY 4.0, NASA public domain), credited in
[`books/space/README.md`](books/space/README.md). The trains book ships real
Wikimedia Commons photos, by the owner's choice without credits (see
[`books/trains/README.md`](books/trains/README.md)). Stock images (a "Santa's
reindeer" group, a tree, a sleigh, an elf, a fireplace, a Santa hat) were used
only as visual *style references* — never copied, traced, or shipped; they live
under the gitignored `.kiro/` and stay out of the repo. The "Carol of the
Bells" melody ("Shchedryk", Leontovych, 1914) is public domain; the bundled
`books/xmas/assets/audio/carol_of_the_bells.mp3` is the audio actually played.
The portable authoring guides in `skills/` (reference → pop-up technique, book
authoring, SVG style, licensing) ship with the repo. See
[`skills/asset-licensing.md`](skills/asset-licensing.md).
