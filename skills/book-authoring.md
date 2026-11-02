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
    theme: '#0a1b3a',                   // theme-color / card accent
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

## 4. Per-book assets

- **cover** — the shelf card preview. A single flat SVG scene is ideal (crisp,
  tiny, themeable). Draw it original (see `svg-character-authoring.md`).
- **favicon.svg** — original vector icon for this book's tab.
- **og image** — social/link preview (1200×630). An original `og.svg` works and
  is committable now; a raster `og.png` is the most broadly-supported form for
  social scrapers, so export one when you can render (see the no-checks note).
  Reference it from the book's `<meta property="og:image">` and the manifest.
- **backdrop.js** — this book's backdrop scene builder (the xmas book's winter
  night + snow). Optional: a book with no backdrop just omits it from the
  manifest. The backdrop is NOT shared — each book brings its own.
- **audio** — every book brings its own looping track under
  `books/<id>/assets/audio/`; the shared `music.js` player just loops whatever
  the manifest's `track` points at. Public-domain or original audio only.

## 5. Checklist for a new book

- [ ] `books/<id>/` folder created with `index.html`, `pages.js`, `cover`,
      `favicon.svg`, `og` image, and `assets/js/` character builders.
- [ ] The book page includes the top-left **back-to-library** link
      (`<a class="library-btn" href="../../index.html">…</a>`, styled by the
      shared `book.css`) so readers can always return to the shelf.
- [ ] The manifest `blurb` is a short, **kid-friendly** line (what a child
      will see/meet), not a technical description of the tech.
- [ ] One entry added to `assets/js/stories.js`.
- [ ] Characters authored as layered `data-part` SVG (follow
      `3d-animation-from-reference.md` + `svg-character-authoring.md`).
- [ ] **Detailed & believable look** — real form, materials, and faces with
      real structure; kid-friendly but never flat/under-detailed.
- [ ] **Every picture ships a one-shot click animation** (via `buildAnim`,
      embedded in its own SVG, fitting the character/caption).
- [ ] Depth keys for any NEW parts added to `OBJ_DEPTH` in
      `pseudo3d-object.js` (shared, so additive only — don't break other books).
- [ ] Card shows on the shelf and links to the book; favicon + og resolve.
- [ ] No stock art traced, embedded, or shipped (see `asset-licensing.md`).

## 6. Engine boundaries — keep content out of the engine

- `storybook.js` must stay content-agnostic: it takes a `PAGES` roster, it does
  not hard-code any story. If you find yourself editing it to add a book, stop —
  the content belongs in `books/<id>/pages.js`.
- `OBJ_DEPTH` is the one shared map books extend; only ADD keys, never repurpose
  an existing key's meaning (that would shift depth in other books).
