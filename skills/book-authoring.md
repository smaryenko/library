# Skill: authoring a new book for the shelf

**When to use:** adding a new story to the `stories` project — a new book that
shows up as a card on the landing shelf and opens into the shared page-turn
engine.

The engine (book stage, page-turn flip, navigation, pseudo-3D tilt, music
button, winter backdrop) is **shared and content-agnostic**. A book is just:
its own folder, a manifest entry, per-book assets, and a page roster. You should
not have to touch the engine to add a book.

## 1. Layering model: shared engine vs. per-book content

```
stories/
  index.html                 shelf landing page (the card grid)
  assets/                     SHARED — the engine + global controls + chrome
    og.svg                    shelf's own social preview image
    favicon.svg               shelf favicon (a bookshelf; book-neutral)
    css/   shelf.css, book.css
    js/    stories.js         the manifest: list of available books
           boot.js            generic boot: reads manifest, mounts a book
           shelf.js           builds the shelf card grid
           storybook.js       the page-turn engine (content-agnostic)
           pseudo3d-object.js the tilt / parallax rig
           music.js           generic looping-audio player (feed it a track)
  books/
    <book-id>/               ONE folder per book, everything it needs inside
      index.html             book entry page (so books/<id>/ is a short link)
      pages.js               this book's page roster (title/body/build per page)
      cover.svg|png          the shelf-card preview art
      favicon.svg            per-book favicon
      og.svg|png             per-book Open Graph / social preview image
      assets/                book-specific media + character builders
        js/    backdrop.js   this book's backdrop scene (e.g. winter night)
               <character>.js builders returning layered data-part SVG
        audio/ <track>.mp3    this book's music track
```

Rule of thumb: **anything reused by every book is shared (top-level `assets/`);
anything specific to one story lives under `books/<book-id>/`.** Shared: the
flip engine, nav controls, tilt rig, shelf, and the *generic* music **player**.
Per-book: favicon, og image, cover art, character art, the page roster, the
**backdrop scene**, and the music **track** the player loops.

> Note on music: the player (`assets/js/music.js`, generalised from the old
> xmas-only `carol.js`) is shared and content-agnostic — it just loops whatever
> track it is given. The actual audio file is a per-book asset under
> `books/<id>/assets/audio/`. The xmas book feeds it `carol_of_the_bells.mp3`.

> Note on the backdrop: the night-sky/snow scene (`winter.js`) is **xmas
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
    blurb: 'A pop-up Christmas tale.',  // small line under the card title
    cover: 'books/xmas/cover.svg',      // card preview art
    favicon: 'books/xmas/favicon.svg',
    og: 'books/xmas/og.svg',
    url: 'books/xmas/',                 // short link (folder's index.html)
    accent: '#ffd36e',                  // shelf-card title colour (light, readable on dark)
    theme: '#0a1b3a',                   // theme-color
    backdrop: 'mountWinter',            // name of the backdrop fn (optional)
    track: 'books/xmas/assets/audio/carol_of_the_bells.mp3'  // looping music
  }
  // ...more books
];
```

## 3. Author the page roster

Each book's `pages.js` exports a `PAGES` array in the same shape the engine
already consumes (see `storybook.js`). Each page is either:

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

The two books that ship (xmas, race) happen to parade a big cast one
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
the tilt off for itself only.

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

**Fit the half page.** The image slot is a square ~58% of the spread wide,
lifted above centre — wider than one page. Art drawn edge-to-edge in
`0 0 360 300` spills off the page and over its top. Keep the characters'
natural margins (as xmas/race do) or pad the viewBox, e.g. the reef book's
`viewBox="-25 -78 452 377"`: same design coordinates, rendered ~80% and
nudged down. Padding is safe for animations (view-box pivots are measured
from user-space 0,0).

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

## 4b. Full-screen view (shared, optional)

Any picture can open full screen on tap: add `assets/css/fullview.css` and
`assets/js/fullview.js` to the book page, then put `data-fullview` on the SVG
a page's `build()` returns. `data-fullview=""` shows the same picture larger;
`data-fullview="someBuilder"` shows the SVG markup `window.someBuilder()`
returns (e.g. the dino book's to-scale line-up); `data-fullview-title` sets the
heading; `data-fullview-zoom="touch"` turns on two-finger pinch zoom (touch
screens only, via the shared `assets/js/pinch.js`; never mouse / trackpad) and
`data-fullview-close="off"` hides the × button. Without the zoom flag the view
just fits the screen. A tap or Esc closes it. Draw the scene's sky / ground
past its viewBox so it fills any spare space. The space book's own planet zoom
uses the same `pinch.js` for its first page (`data-pinch` on the overview SVG).

## 5. Checklist for a new book

- [ ] `books/<id>/` folder created with `index.html`, `pages.js`, `cover`,
      `favicon.svg`, `og` image, and `assets/js/` character builders.
- [ ] The book page includes the top-left **back-to-library** link
      (`<a class="library-btn" href="../../index.html">…</a>`, styled by the
      shared `book.css`) so readers can always return to the shelf.
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

- `storybook.js` must stay content-agnostic: it takes a `PAGES` roster, it does
  not hard-code any story. If you find yourself editing it to add a book, stop —
  the content belongs in `books/<id>/pages.js`.
- `OBJ_DEPTH` is the one shared map books extend; only ADD keys, never repurpose
  an existing key's meaning (that would shift depth in other books).
