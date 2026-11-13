# Harbor City

A live three.js pop-up book. One 3D city stands on the open book like a
pop-up: printed roads, sea, runway and track on the pages, buildings and
vehicles rising off them, nothing behind the skyline but the table (the canvas
is transparent; sun, clouds, gulls and planes float above). Each page is a
camera stop; turning flies the camera, there is no leaf flip. Tap the scene,
or press Space / Enter, to play that page's animation.

## Pages
1. Overview · 2. cruise ship + tugboat · 3. freight ship + container crane ·
4. oil tanker · 5. excavator + bulldozer · 6. backhoe + dump truck ·
7. cement mixer + road roller · 8. fire truck + fireboat · 9. police car + tow
truck · 10. ambulance + helicopter · 11. double-decker bus + taxi + garbage
truck · 12. race day (2 MotoGP bikes, F1, GT car) · 13. passenger jet
take-off · 14. cargo plane + airport fire truck · 15. evening + fireworks.

## Files
```
pages.js                captions; `stop` names the camera stop per page
assets/js/scene.js      renderer, camera flights, evening light, BOOK_SCENE
assets/js/world.js      book, water, buildings, scenery, every stop + animation
assets/js/print.js      the printed artwork on the pages (one canvas) + layout
assets/js/vehicles.js   every vehicle, ship, plane and machine, built in code
assets/js/kit.js        materials, geometry helpers, bake (merge), particles
assets/js/backdrop.js   pale studio table behind the book
```

## Notes
- Uses `assets/vendor/three/three.global.min.js` (three.js 0.170.0, MIT, plus
  the add-ons in use, bundled once with esbuild into a plain script that sets
  `window.THREE`). The book's files are plain scripts sharing `window.CITY`, in
  load order kit → vehicles → print → world → scene. No modules, so it opens
  from `file://` too, and needs no network.
- A static ice cream van stands in the park with a family queuing.
- Load: the book is built before the first frame, the rest one chunk per
  frame, then shaders are compiled (`compileAsync`). Static parts of each model
  are merged per material (`bake`), repeated things are instanced.
- Quality tier (kit.js `TIER`) sets pixel ratio, shadow map size and particle
  counts; the pixel ratio drops automatically if frames run slow.
- Everything is original, modelled in code. Names and numbers are made up.
- `cover.svg` (shelf card, 400×300) and `og.svg` (1200×630) are generated
  from `preview.js` by `node tools/build-previews.js city`: a hand-built
  vector of the pop-up diorama. `og.png` is a raster export of `og.svg`
  (headless Chrome `--screenshot`, 1200×630).
- No music track yet.
