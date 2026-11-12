# Skill: books with real rendered objects (canvas spheres)

**When to use:** a book whose pictures should be *real* objects — planets,
moons, globes, balls — showing real imagery and moving like the real thing,
rather than the house pseudo-3D SVG characters. The reference implementation is
`books/space/` ("Our Solar System").

The shared engine is unchanged: the book still supplies `window.BOOK_PAGES`,
and each `build()` still returns an SVG string. The book adds its own renderer
that takes over once that SVG is mounted.

## How it plugs in (no engine edits)

- **Scene SVG = layout only.** `build()` returns ONE plain SVG tagged
  `data-solar`, with **no `data-part`** (so the rig makes a single layer) and no
  background. It holds orbit lines, belt specks and invisible **marker circles**
  `<circle data-body="earth" cx cy r …>` (see `books/space/assets/js/scenes.js`).
- **Orbits are attributes.** `data-a`/`data-b` (ellipse radii), `data-period`
  (seconds per lap), `data-phase` (start angle, degrees), `data-around` (id of
  the parent body) and `data-lit` (id of the light source). **For an orbiting
  marker, `cx`/`cy` is the orbit CENTRE**, not the start position. That mix-up
  put planets off their orbit lines once.
- **A MutationObserver mounts it.** `solar.js` watches for
  `.obj-host .layer > svg[data-solar]`, then lays a `.solar-layer` of canvases
  over the markers. Size and position the holder **to the SVG's rendered viewBox
  box** (preserveAspectRatio "meet"), refreshed every frame. If it's sized to
  the layer box instead, bodies drift off their drawn orbits.
- **Switch off tilt for the book only.** `planets.css` sets
  `.obj-host .scene, .obj-host .layer { transform: none !important; }`.
- **Catch taps in the capture phase.** `pointerdown` and `pointerup` listeners
  with `capture: true` call `stopImmediatePropagation`, so a tap on the picture
  never turns the page. Re-dispatch a horizontal swipe as an arrow-key
  `keydown` so swipes still turn pages.

## Rendering

- **Spheres:** each sphere has a per-pixel lookup table (lon/lat + normal for
  every disc pixel, with axial `tilt` and the pole's lean `incl` built in).
  Every frame it scrolls the equirectangular map in longitude, lights it and
  `putImageData`s it. The lookup table is built once per sphere size.
- **Lighting:** use soft "wrapped" light (`0.14 + (d+0.3)/1.2`) so night sides
  fade to a dim glow, never pitch black. Light each body from the direction of
  its `data-lit` source.
- **Spin:** one calm shared speed (`CHILL_SPIN`, 45 s per turn). Real day
  lengths look frantic or frozen. `spin` sign gives the direction (Venus,
  Uranus and Pluto are retrograde). `spinBoost` speeds up a body whose features
  are faint.
- **Featureless maps don't show spin.** Uranus, and Saturn's main body, look
  the same all the way round. Add their real kinds of weather on top
  (`enhanceBands`): storm ovals, bright clouds, wavy band edges. Keep these
  away from the poles, where the polar caps distort them into stars and seams.
  Mention in the book README that these features are added, not photographed.
- **Rings:** ray-trace each canvas pixel onto the tilted ring plane to get its
  radius (→ ring-map column) and its angle around the planet. Inner rings orbit
  faster than outer ones. Moving clumps make that orbit visible. Draw the far
  half behind the globe and the near half in front, plus the planet's shadow
  on the rings.
- **Small bodies aren't spheres.** For asteroids and Kuiper Belt objects, use
  `shape`. It takes lobes (a peanut like Itokawa, a two-lobed "snowman" like
  Arrokoth), lumps, crater bowls and flat **cutting planes**. The cuts give the
  angular, broken-rock look; without them they read as eggs or moons. They're
  drawn as splatted points with a z-buffer, capped at a lower resolution.
- **Scale:** sizes can be true to scale (the Moon is 0.27 × Earth's width), but
  distances are squeezed to fit the page.

## Loading without a blink

- **Bake textures as data URIs** in `assets/js/tex/<name>.js`
  (`window.SOLAR_TEX[name] = 'data:image/jpeg;base64,…'`). Data URIs never
  taint a canvas, so `getImageData` works even from `file://`. Downsample to
  1024×512 at JPEG quality ~80.
- **Preload every map at startup**, and **keep a scene hidden until all of its
  bodies (and ring maps) are ready**. Then draw everything and reveal it in one
  frame, so a ring or planet never pops in late.

## Zoom (the click interaction)

- Tapping the **whole picture** (not a single body) clones its SVG into a fixed
  overlay, mounts it again at screen size (sharp, high-resolution canvases) and
  flies it from the picture's spot to the centre (~900 ms).
- Wide scenes declare their content box in `data-zoom-fit="x y w h"` so they
  fill the screen instead of being letterboxed.
- The book is hidden at once by a solid space sky (stars + nebulae) with no
  fade. The page's title fades in at the bottom as the picture lands.
- **On close, give input back at once:** add `.is-closing`
  (`pointer-events: none`, normal cursor) while the picture flies home.

## Previews

Real-imagery books get raster previews. `books/space/preview.py` (Pillow +
numpy) ray-casts the same baked maps into `cover.png` (800×600) and `og.png`
(1200×630).

## Licensing

Real imagery is allowed only under the documented exception in
`asset-licensing.md`. Every map must be clearly licensed (CC BY, public domain)
and credited in the book's README.

## Placement

The engine's picture wrapper fits and centres each picture by its drawn
content, but spheres are canvases over invisible markers. So every
`data-solar` SVG declares its content box: `data-fit="x y w h"` (viewBox
units), covering the body plus any orbit / moon it shows (`buildBody`'s
`opts.fit`; default is the body's own circle).

