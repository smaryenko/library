# Skill: photo cut-out books (real photos as pop-ups)

**When to use:** a book whose pictures should be *real photos* (trains,
vehicles, buildings…) that still pop off the page in pseudo-3D. Reference
book: `books/trains/`.

## The technique

One flat scene SVG per page (same rule as the race book), built by
`buildTrain(cfg)` in `books/trains/assets/js/photocut.js`. The same photo is
stacked several times as `data-part` layers, and the shared engine parallaxes
them:

- `tr-photo`: the whole photo, slightly darkened, furthest back (the "page").
- `tr-body`: the subject, clipped by a `<clipPath>` polygon, lifted with an
  `feDropShadow`.
- `tr-near` / `tr-front` / `tr-top`: optional smaller cuts (nose, chimney,
  front wagon) lifted further forward.
- `fx-*`: effect-only drawings (smoke, sparks, envelopes), hidden at rest.
- `parts`: extra *visible* drawn layers on top of the photo (e.g. clock hands).

```js
T.mail = () => buildTrain({
  img: 'mail',                                  // img/mail.jpg, 1500×1000
  cuts: { 'tr-body': [[x, y], …], 'tr-front': [[x, y], …] },
  fx: { 'fx-tr': '<g>…</g>' },                  // or fn(glowFilterUrl)
  parts: { 'tr-hand-min': '<g>…</g>' },         // optional
  tracks: [ /* buildAnim tracks, one per element */ ]
});
```

Depth keys live in `OBJ_DEPTH` (`assets/js/pseudo3d-object.js`); only ADD keys.

Why not a canvas cut-out with feathered edges? It needs pixel reads, which
fail on `file://`, plus a custom mount. The SVG clip approach needs no engine
changes. The cost is hard edges, so trace carefully.

## Workflow

1. Find photos (Wikimedia Commons API, set a `User-Agent`, sleep between
   requests). Show a numbered contact sheet and let the user pick. **Colour
   photos only.**
2. Crop to 3:2 and resize to 1500×1000 (PIL). Save as `img/<key>.jpg`.
3. Draw a labelled 50 px grid over the crop, view it, and trace polygons in
   crop pixels. Zoom into tricky edges (noses, wheels) with a finer grid.
4. One element, one track. If two things need different motions, give them
   different parts (`fx-tr` and `fx-tr-2`).
5. Need to move something that's *in* the photo (clock hands)? Paint it out of
   the image (fill only the masked pixels from the nearby clean background,
   ignoring dark detail like numerals as donors), then redraw it as a `parts`
   layer at its original pose. Keep the mask tight, or nearby detail gets
   erased.

## Layout

Photos are 3:2, not square. No per-book CSS is needed: the engine's picture
wrapper reads the SVG's viewBox (`0 0 1500 1000`, plus any padding) and fills
the page width at that ratio, centred on the page (`book-authoring.md`,
placement).

## Previews

`cover.png` and `og.png` are composited with PIL from the book's own cut
polygons (dimmed photo + lifted, shadowed cut-out), so the preview looks like
the page does in the book.

## Loading

Photos are big, so the first paint of a page can stall a turn. The shared
engine's next-page prerender (`book-authoring.md` §4b; on by default) mounts the next
picture in a hidden, slot-sized box, so its photo is downloaded, decoded and
painted before the turn; no per-book warm-up code is needed (trains used to
carry its own in `pages.js`).
