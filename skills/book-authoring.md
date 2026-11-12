# Skill: authoring a new book for the shelf

**When to use:** adding a new story to the `stories` project — a new book that
shows up as a card on the landing shelf and opens into the shared page-turn
engine.

The engine (book stage, page-turn flip, navigation, pseudo-3D tilt, opt-in next-page
prerender, music button) is **shared and content-agnostic**. A book is just:
its own folder, a manifest entry, per-book assets, and a page roster. You should
not have to touch the engine to add a book.

## 1. Layering model: shared engine vs. per-book content

```
stories/
  index.html                 shelf landing page (the card grid)
  assets/                     SHARED — the engine + global controls + chrome
    og.svg                    shelf's own social preview image
    favicon.svg               shelf favicon (a bookshelf; book-neutral)
    css/   shelf.css, book.css, fullview.css
    js/    stories.js         the manifest: list of available books
           boot.js            generic boot: reads manifest, mounts a book
           shelf.js           builds the shelf card grid
           storybook.js       the page-turn engine (content-agnostic) + opt-in next-page prerender
           pseudo3d-object.js the tilt / parallax rig (+ the shared OBJ_DEPTH map)
           anim.js            buildAnim(uid, {tracks}) → scoped click-animation <style>
           motion.js          optional Motion library (Motion.rig + move primitives)
           color.js           optional shade(hex, pct) colour helper
           fullview.js        optional tap-to-full-screen (+ pinch.js for touch zoom)
           music.js           generic looping-audio player (feed it a track)
  books/
    <book-id>/               ONE folder per book, everything it needs inside
      index.html             book entry page (so books/<id>/ is a short link)
      pages.js               this book's page roster (title/body/build per page)
      preview.js             optional node scene for cover.svg / og.svg (tools/build-previews.js)
      cover.svg|png          the shelf-card preview art
      favicon.svg            per-book favicon
      og.svg|png             per-book Open Graph / social preview image
      assets/                book-specific media + character builders
        js/    backdrop.js   this book's backdrop scene (e.g. winter night)
               <character>.js builders returning layered data-part SVG
        css/   <book>.css     optional book-specific layout (dino, space, trains)
        audio/ <track>.mp3    this book's music track
```

Rule of thumb: **anything reused by every book is shared (top-level `assets/`);
anything specific to one story lives under `books/<book-id>/`.** Shared: the
flip engine, nav controls, tilt rig, shelf, and the *generic* music **player**.
Per-book: favicon, og image, cover art, character art, the page roster, the
**backdrop scene**, and the music **track** the player loops.

> Note on music: the player (`assets/js/music.js`) is shared and content-agnostic — it just loops whatever
> track it is given. The actual audio file is a per-book asset under
> `books/<id>/assets/audio/`. The xmas book feeds it `carol_of_the_bells.mp3`.

> Note on the backdrop: the night-sky/snow scene (`mountWinter`) is **xmas
> specific**, so it lives at `books/xmas/assets/js/backdrop.js`, not in shared
> `assets/`. Each book supplies its own backdrop builder; the engine mounts
> whichever the manifest points at. A book with no backdrop just skips it.

## 2. Register the book in the manifest

Add one entry to `assets/js/stories.js`. The shelf reads this to render cards;
the book page reads it for title/favicon/og. Keep it declarative:

```js
window.STORIES = [
  {
    id: 'xmas',                         // folder name under books/
    title: 'Christmas Storybook',
    blurb: 'Meet Santa, a merry elf, and nine reindeer on a snowy night!', // kid-friendly line under the card title
    category: 'fiction',                // card corner label: 'fiction' | 'non-fiction'
    cover: 'books/xmas/cover.svg',      // card preview art
    favicon: 'books/xmas/favicon.svg',
    og: 'books/xmas/og.svg',
    url: 'books/xmas/',                 // short link (folder's index.html)
    accent: '#ffd36e',                  // shelf-card title colour (light, readable on dark)
    theme: '#0a1b3a',                   // theme-color
    backdrop: 'mountWinter',            // name of the backdrop fn (optional)
    track: 'books/xmas/assets/audio/carol_of_the_bells.mp3'  // looping music
    // hint: '…'                        // optional: replaces the default hint line
  }
  // ...more books
];
```

## 3. Author the page roster

Each book's `pages.js` sets `window.BOOK_PAGES`, the array `storybook.js`
renders. Each page is either:

- an **object page**: `{ title, body, build }`, where `build()` returns a
  layered `data-part` SVG string (via your character builders). Every object
  page's picture must be **detailed & believable** (kid-friendly but never a
  flat, under-detailed placeholder) and must ship its **own one-shot click
  animation** inside the SVG — see `svg-character-authoring.md`; or
- a **text-only page**: `{ textOnly: true, left: {...}, right: {...} }`.

Text format per page is two lines: a big **title** word/name and a smaller
**body** line that does NOT repeat the title. Image/text sides alternate each
turn — the engine handles that; you only supply content.

### The story is free — there is no required shape

Some of the books that ship (xmas, race) happen to parade a big cast one
character per spread, but **that is not a template to copy.** A book can be any
story you like:

- **Any number of characters.** One or two protagonists carried through the
  whole book is perfectly good — you do NOT need a large cast introduced one by
  one. Tell a real little story with the character(s) you have.
- **Use real names.** A clownfish is a clownfish, a fox is a fox. Don't invent
  cutesy nicknames (no "Pearl the clownfish", "Bolt the car") unless the user
  asks for named characters. Plain species/role names read best.
- **No bounds on length, cast size, plot, or animations.** Page count, how many
  characters appear, what happens, and what each picture's click animation does
  are all open. Fit them to the story, not to a formula.
- **Text-only pages are optional.** They're one tool for an interlude, not a
  requirement; a book of all object pages is fine, and so is using the single
  caption line on each spread to carry the whole narrative.

### Not every book has to be pseudo-3D SVG

If the pictures should be *real* objects (planets, globes) showing real
imagery, follow `real-sphere-books.md` (the `space` book). Same engine and
roster; the book brings its own canvas renderer and tap-to-zoom, and turns
the tilt off for itself only. If they should be *real photos* that still pop
off the page, follow `photo-cutout-books.md` (the `trains` book): same engine,
the photo is stacked as clipped `data-part` layers.

Pick the page count and structure that serve the story. Don't pad to match the
other books' 14 pages, and don't add characters just to have more cards.

### Multiple characters on one page — COPY the race book, don't reinvent it

> Hard-won lesson (the reef book). Putting two+ characters on one spread and
> animating them is **already solved** by the `race` book. Read
> `books/race/assets/js/props.js` and mirror it. A clever-looking alternative
> (wrapping each creature's whole SVG, stripping its parts, nesting groups) is
> how the reef book got slow and buggy. Don't.

The pattern that works, and why:

- **Author the whole spread as ONE flat scene SVG.** One `viewBox="0 0 360 300"`,
  all characters and scenery drawn directly into it in the SAME coordinate
  space. The four cars on the start grid are just four `carAway(...)` calls
  emitted into one SVG — not four embedded sub-SVGs.
- **Tag each movable thing as a top-level `data-part` group named by ROLE**
  (`car`, `bunting`, `fire`, `star`). The rig splits each `data-part` onto its
  own Z layer. **Keep `data-part` groups FLAT — never nest one inside another.**
  The splitter removes every other `data-part` node, so a nested child gets
  deleted with its parent and the layer comes out empty. (This was the reef
  "character vanished, only the shadow shows" bug.)
- **One shared animation per scene via a tiny `sceneAnim([...tracks])` helper**
  (see the bottom of `race/props.js`): it just hands `buildAnim` a fresh uid and
  returns the `<style>`. Drop it right after the opening `<svg>` tag. Each track
  targets a role name (`parts:'car'`) and moves ALL layers with that name
  together. Several cars can share `data-part="car"` and animate as one.
- **Place/scale a character with a plain `<g transform="translate() scale()">`
  wrapper that has NO `data-part`.** `carAway()` does exactly this. A no-data-part
  wrapper is never removed by the splitter, so the placement survives on every
  layer.

**Placement is generic: the engine's picture wrapper does it.** The image
slot (`.obj-slot.is-image`) wraps every book's picture, and `storybook.js`
(`fitImageSlot`) sizes and places it on every render and resize:

- **Fill the page width.** The picture spans its page half on screen, minus
  a small even side margin (`PIC_MARGIN`, 4% each side).
- **Real aspect ratio.** The wrapper takes the ratio from the picture's own
  SVG `viewBox` (or `width`/`height`), so square art, 3:2 photos and wide
  scenes all fit without per-book CSS. Don't add `.obj-slot` overrides.
- **Centred vertically on the page.** The wrapper's centre is the centre of
  the page as seen: the tilted page is a trapezoid on screen, so the engine
  measures its projected corners and uses the mid-height width, so the space above and below is equal.
- **Never off the page.** Height is capped at the page's on-screen height
  (minus the same margin) and at `PIC_MAX_H` (78%) of the stage; on phones
  and tablets the tilted page is short, so the picture gets narrower instead.

The wrapper fits and centres the **drawn content**, not the bare viewBox: it
measures the union of every layer's `getBBox()` (skipping hidden `fx-*`
parts, clamped to the viewBox) and scales/offsets the slot so that box fills
the page width and sits centred on the page. Art drawn low in its viewBox (a
tree on the ground line, empty sky above) still ends up centred. Full-bleed
scene SVGs (a background rect over the whole viewBox) simply fit by their
viewBox. If the visible content isn't plain SVG geometry (space's canvas planets
sit on invisible marker circles; seasons' scenes are masked plates whose
blurred over-draw `getBBox` still counts, since it ignores masks and clips),
declare it on the root: `<svg
data-fit="x y w h">` in viewBox units, and the wrapper uses that instead of
measuring. Empty viewBox padding is therefore harmless for placement; pad it
when a character needs room to animate into (e.g. reef's
`viewBox="-25 -78 452 377"`). Padding is safe for
animations (view-box pivots are measured from user-space 0,0). Look at the
first and last pages and a phone-width layout when you can render.

Two CSS gotchas that bit the reef book (worth stating so nobody re-discovers
them the hard way):

- **A CSS `animation` that sets `transform` REPLACES the element's static
  `transform` attribute while playing.** So never put the placement transform
  and an animated transform on the SAME element — the element will jump to the
  origin and (if the keyframe scales) just balloon in place. Keep placement on
  an outer no-data-part `<g>` and animate the inner group, OR bake the travel
  into the keyframes from a known home position (as race does: the `car` sits at
  its drawn spot and the keyframes translate from there).
- **Scale once.** If a draw helper already applies `scale(s)`, don't wrap it in
  another `scale(s)` — you get s² and a squashed shape (the reef shell bug).

Follow this and a multi-character page is as easy as the race scenes were:
emit the shapes into one SVG, name the movers, write a few keyframe tracks.

## 4. Per-book assets

- **cover** — the shelf card preview. A single flat SVG scene is ideal (crisp,
  tiny, themeable). Draw it original (see `svg-character-authoring.md`).
- **favicon.svg** — original vector icon for this book's tab.
- **og image** — social/link preview (1200×630). An original `og.svg` works and
  is committable now; a raster `og.png` is the most broadly-supported form for
  social scrapers, so export one when you can render (see the no-checks note).
  Reference it from the book's `<meta property="og:image">` and the manifest.
- **preview.js** — node-only scene for the cover + og image, built from the
  book's own builders. `node tools/build-previews.js [id…]` regenerates
  `cover.svg` / `og.svg` for every book that has one (the generic tool lives in
  `tools/`; the scene stays with the book). Re-run it whenever character art
  changes. `og.png` is a separate raster export of `og.svg`.
- **backdrop.js** — this book's backdrop scene builder (the xmas book's winter
  night + snow). Optional: a book with no backdrop just omits it from the
  manifest. The backdrop is NOT shared — each book brings its own.
- **audio** — every book brings its own looping track under
  `books/<id>/assets/audio/`; the shared `music.js` player just loops whatever
  the manifest's `track` points at. Public-domain or original audio only.

## 4a. Index.html and cache-busting

Copy an existing book's `index.html`: the meta block, then only `<script>`
tags (shared engine, this book's builders, `pages.js`, shared `boot.js` last).
Load optional shared modules (`motion.js`, `color.js`, `fullview.*`,
`pinch.js`) only if the book uses them. Every shared `../../assets/` reference
carries the SAME `?v=N` in every book; when a shared file changes, bump that
number in all seven `index.html` files together. Book-local files keep their
own `?v=`, bumped when they change.

## 4b. Next-page prerender (shared, opt-in)

Off by default; a book turns it on with `window.BOOK_PRERENDER = true` in
`pages.js`. Use it only for photo books (trains), where decoding big images
stalls the turn; for SVG books the extra build cost more than it saved and
made every book feel slower. When on, `storybook.js` builds the next page's picture in a hidden, slot-sized box once
a spread settles, and moves that host into the slot on the turn. Builders need
nothing special, but:

- `build()` may now run twice per page (once parked, once if the reader jumps
  elsewhere), so keep it free of side effects and give every call a fresh uid.
- Parked pictures have their `<style>`s disabled (`media="not all"`), so the
  name-only `buildAnim` selectors can't leak onto the shown picture. Don't put
  `media` on your own `<style>`s.
- Code that scans the DOM for mounted pictures sees parked ones too: they sit
  in `.obj-prerender`, their host has no `is-tappable` class, and they move
  into `.obj-slot` when shown.
- Don't turn it on for pictures that do live work once mounted (space's
  canvas spheres would spin in the parked copy).

## 4c. Full-screen view (shared, optional)

Any picture can open full screen on tap: add `assets/css/fullview.css`,
`assets/js/pinch.js` and `assets/js/fullview.js` to the book page, then put `data-fullview` on the SVG
a page's `build()` returns. `data-fullview=""` shows the same picture larger;
`data-fullview="someBuilder"` shows the SVG markup `window.someBuilder()`
returns (e.g. the dino book's to-scale line-up); `data-fullview-title` sets the
heading; every full-screen view pinch-zooms with two fingers on touch screens
(the shared `assets/js/pinch.js`, never mouse / trackpad; on a computer it just
fits the window), and `data-fullview-zoom="off"` turns that off;
`data-fullview-close="off"` hides the × button. A tap or Esc closes it. Draw the scene's sky / ground
past its viewBox so it fills any spare space. The space book's own planet zoom
uses the same `pinch.js` on every zoomed view.

## 5. Checklist for a new book

- [ ] `books/<id>/` folder created with `index.html`, `pages.js`, `cover`,
      `favicon.svg`, `og` image, and `assets/js/` character builders.
- [ ] The book page `<body>` holds **only `<script>` tags**. The shared
      `boot.js` adds the back-to-library button, the `#stage` and the hint
      line. Set `hint` in the manifest entry only if the book needs
      different hint text (as `space` does). Set `category`
      (`'fiction'` | `'non-fiction'`) for the shelf-card label.
- [ ] The manifest `blurb` is a short, **kid-friendly** line (what a child
      will see/meet), not a technical description of the tech.
- [ ] One entry added to `assets/js/stories.js`.
- [ ] (Real-object books: follow `real-sphere-books.md` instead of the three
      SVG items below, and credit every texture in the book README.)
- [ ] Characters authored as layered `data-part` SVG (follow
      `3d-animation-from-reference.md` + `svg-character-authoring.md`).
- [ ] **Detailed & believable look** — real form, materials, and faces with
      real structure; kid-friendly but never flat/under-detailed.
- [ ] **Every picture ships a one-shot click animation** (via `buildAnim`,
      embedded in its own SVG, fitting the character/caption). Animations are
      **not** a fixed catalogue — the existing books' motions (wheelie, stomp,
      glow…) are examples, not a menu. Invent whatever new one-shot best fits
      each character; see `svg-character-authoring.md`.
- [ ] Multi-character pages authored the **race-book way**: one flat scene SVG,
      flat `data-part` groups named by role, `sceneAnim([...])` — NOT embedded
      sub-SVGs or nested data-parts (see §3 and `svg-character-authoring.md`).
- [ ] Depth keys for any NEW parts added to `OBJ_DEPTH` in
      `pseudo3d-object.js` (shared, so additive only — don't break other books).
- [ ] If a reference image was given, the art actually **matches its distinctive
      features**, verified by rendering (and by freezing animations mid-play).
- [ ] Card shows on the shelf and links to the book; favicon + og resolve.
- [ ] No stock art traced, embedded, or shipped (see `asset-licensing.md`).

## 6. Engine boundaries — keep content out of the engine

- `storybook.js` must stay content-agnostic: it takes the `BOOK_PAGES` roster, it does
  not hard-code any story. If you find yourself editing it to add a book, stop —
  the content belongs in `books/<id>/pages.js`.
- `OBJ_DEPTH` is the one shared map books extend; only ADD keys, never repurpose
  an existing key's meaning (that would shift depth in other books).
