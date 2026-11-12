# Book: dino — Dinosaurs

Real dinosaurs, each drawn as a layered pseudo-3D SVG and shown to scale next
to a 1.2 m child. The page-turn engine, tilt rig, Motion library, full-screen
view and music player are shared (top-level `assets/`). See
`skills/book-authoring.md`.

## Contents

```
books/dino/
  index.html        entry page; also loads the shared fullview.css/js + pinch.js
  pages.js          the 14-page roster (size ladder → 11 animals → asteroid → survivors)
  preview.js        cover + og scene for tools/build-previews.js
  cover.svg, favicon.svg, og.svg / og.png
  assets/
    audio/jurassic_park.mp3   looping track
    css/dino.css              book-specific layout
    js/
      backdrop.js   hazy Late Cretaceous plain (mountDino)
      kit.js        window.DinoKit: tube/shape/ell primitives, makeKit(palette),
                    seeded rng, child figure, sceneAnim, placement helpers
      dino.js       buildTheropod / buildTRex (three-quarter view)
      animals.js    the other ten animals (buildTriceratops … buildPlesiosaurus);
                    window.DINO_META holds each page's scale and extent
      scenes.js     buildSizeLadder, buildLineup, buildAsteroid, buildSurvivors
```

## Story (14 pages)

A size ladder → eleven animals, each next to a child at true scale → the
asteroid → the survivors.

## Notes

- Page 1's size ladder carries `data-fullview="buildLineup"`, so a tap opens the
  full to-scale line-up through the shared `fullview.js` (pinch zoom on touch).
  It is the book's only zoom.
- Every builder takes `{ child, scenery }` options so the ladder and line-up
  reuse the bare animals.
- Long names carry soft hyphens (`\u00AD`) so titles can break on phones.
- Music: confirm the source/licence of `jurassic_park.mp3` and credit it here
  (see `skills/asset-licensing.md`).
