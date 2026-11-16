# Skill: one-world books (one live 3D scene, a camera stop per page)

**When to use:** a book that is ONE continuous place (a city, a farm, a
harbour, a castle) built once as a live 3D pop-up on an open book, where each
page is a camera stop in that world with its own tap animation. Turning a
page flies the camera; nothing is rebuilt. The reference implementation is
`books/city/` ("Harbor City").

## Engine hook: `window.BOOK_SCENE`

```js
window.BOOK_SCENE = { mount(host), show(i, { instant }), play(i), tilt(x, y), destroy };
```

- `init()` sees `BOOK_SCENE`, adds `body.book-scene3d` (hides the CSS book;
  the scene draws its own), creates one `.scene3d-host` and calls `mount`
  **once**. `renderSpread` only re-appends that host; it's never destroyed.
- First `show` is `instant` (snap); later ones fly. There's no leaf flip: the
  caption fades out / in (`cap-out` / `cap-in`, 240 ms).
- Tap inside the hit box (`x .12 y .06 w .76 h .8` of the stage) calls
  `play(index)`; the outer side strips still turn the page.
- The engine's idle sway calls `tilt(x, y)` every frame.
- CSS lives in `book.css` ("Live 3D scene books"): full-stage canvas,
  fade-in on `.is-ready`, bottom-centre caption.

## Files

- `index.html`: `book.css`, the shared engine scripts, the vendored
  `assets/vendor/three/three.global.min.js` (plain global `window.THREE` with
  addons; works from `file://`, no modules), then the book's scripts in
  dependency order: `backdrop.js`, `pages.js`, `kit.js`, model files
  (`vehicles.js`), `print.js`, `world.js`, `scene.js`, and `boot.js` last.
  `scene.js` must set `BOOK_SCENE` before `boot.js`. `?v=N` on everything.
- `pages.js`, `kit.js` (copy city's), `print.js`, `world.js`, `scene.js`,
  `backdrop.js`, `README.md`, `favicon.svg`, `cover.svg`, `og.svg`, `og.png`,
  `preview.js`, shelf entry in `assets/js/stories.js` (see `book-authoring.md`).

## Page data

```js
window.BOOK_LAYOUT = 'popup';
window.BOOK_PRERENDER = false;   // nothing to prerender: one live scene
window.BOOK_PAGES = [
  { stop: 'overview', title: 'Harbor City', body: '…' },
  { stop: 'cruise',   title: 'The cruise ship', body: '…' },
];
```

- `stop` is a key into `world.stops`; unknown keys fall back to `overview`.
  Several pages may share a stop.
- No `build()`. Text (`body`, or trusted `bodyHtml`) must describe what that
  stop's tap animation **actually does**.

## The world (`world.js`)

`buildWorld(scene)` returns `{ root, chunks, stops, night, W, update(dt, t, activeKey) }`.

- **One map.** `print.js` `LAYOUT` holds shared coordinates (city: x −20..20,
  z −13..13) and `drawSpread()` paints the printed pages on one canvas
  (48 px/unit). `world.js` places every model on those coordinates, so the
  print and the 3D pieces line up. Add a tileable grain / bump layer to the
  page material: the print alone goes soft up close.
- **Chunks.** `chunks` is an array of build closures. Chunk 1 (the book and
  printed pages) runs before the first frame; the rest run one per frame.
- **`W`** is a bag of named objects shared between chunks and stops.
- **Stops**, registered with `S(key, cam, play, reset, extra)`:
  - `cam = { t: [x, y, z], d, yaw, pitch }`: target, distance, yaw
    (0 = seen from the near edge), pitch (radians above the page);
  - `play(t)`: a **pure function of time** since the tap; returns `true` when
    done. Poses from `seg(t, a, b, ease)` ranges + `lerp`; one-shot bursts via
    `crossed(key, t, t0)` with a per-stop `lastT` record;
  - `reset()`: restores the exact rest pose and clears `lastT` (or replays
    skip their bursts). All resets run once after the build;
  - `extra`: `{ night: 1 }` (dusk lighting), `{ follow: t => vec3 | null }`
    (camera follows a subject, e.g. the jet taking off).
- **Ambient life**: `updaters` run every frame with the active stop key
  (traffic, gulls, smoke, blinking lights; e.g. fire burns only on its page).
- **Mascot**: one character that flies to every stop and hovers at a perch
  computed from the stop's camera (in front, offset right and up, scaled by
  `d`), side-on so it reads in profile.
- **Particles**: shared pooled `Spray`s (smoke, steam, water, sparks…) created
  once; counts scaled by `TIER`.

## Models (`vehicles.js` and friends)

- Each builder returns a Group standing on y = 0, +x forward.
- Moving parts are named groups (`kit.part`) in `userData.parts`; wheels in
  `userData.wheels` (spun by distance / radius); blinking lights get their own
  `lamp()` materials in `userData.lamps`; head / tail lights share the night
  lamp materials so dusk brightens them all.
- `bake(root)` merges every static mesh into one mesh per material per moving
  part (~80 boxes → ~6 draw calls). Batch static scenery the same way; instance
  repeats.

## The scene (`scene.js`)

- One `WebGLRenderer({ alpha: true })`, clear alpha 0: the canvas is
  transparent so the table backdrop shows around the pop-up. Soft shadows,
  ACES tone mapping, RoomEnvironment PMREM, `PerspectiveCamera(30)`; strong key
  light + weak fill (flat even light reads as a toy).
- `camera.setViewOffset(…, -h * 0.03, …)` lifts the picture above the caption.
- **Flights.** `show(i)` flies from the *current* camera state, so pressing
  again mid-flight retargets smoothly. Long hops (> 16 units) lift toward the
  overview; short hops arc. Yaw takes the shortest way. Duration
  `clamp(1.1 + jump * 0.028, 1.1, 2.1)` s (0.5 s with reduced motion).
- **Reset the stop being left at mid-flight** (u > 0.5), when the camera is
  away from it, so the pose snap is never seen. Cancel the running animation
  when the stop changes.
- **`play()` queues** until the camera arrives (`anim.waiting`).
- **Night** lerps sun / hemi colour and intensity, environment, emissive
  window maps (random lit rooms), lamps, water, sky sprites.
- Narrow screens back the camera off (`pow(max(1, 1.55 / aspect), 0.9)`) so the
  same width of the world stays in view.

## Performance

- Build in chunks (above), then `renderer.compileAsync(scene, camera)` so later
  turns only draw frames. **Reveal only when fully built** (`.is-ready`): it
  used to fade in on frame 1 and visibly assemble.
- `TIER` (kit.js: 0 small/old phones, 1 phones/tablets, 2 desktop) sets pixel
  ratio cap `[1.25, 1.5, 2]`, shadow map size, antialiasing, particle counts.
- Adaptive resolution: frames over 30 ms for ~3 s drop the pixel ratio by 0.25
  (min 1).
- Cap `dt` at 0.05 s; skip work while `document.hidden`.
- **No camera sway on touch** (`(hover: none)`): it re-rendered the whole scene
  every frame for nothing. On desktop, tilt only after the build.
- **Free WebGL when leaving.** On `pagehide`, Library-button pointerdown
  (capture) and Escape: stop the loop, dispose every geometry / material /
  texture / shadow map / environment, `renderer.dispose()`,
  `forceContextLoss()`, remove the canvas. Otherwise the shelf page starts
  starved of GPU memory on phones. On `pageshow` with `persisted`, reload.

## Previews

`preview.js` is Node-only (`module.exports = h => …`), used by
`node tools/build-previews.js <id>` to write `cover.svg` (400×300) and
`og.svg` (1200×630) as a drawn vector of the diorama; `og.png` is a
screenshot of `og.svg`.
