# The Ant and the Crumb

Fiction with true ant facts, 12 pages: a small worker ant carries a
bread crumb from a picnic blanket down through her anthill to the deepest
store. Picture on one page, text on the other. No names: always "the ant" /
"the little ant". Each page's true ant fact is kept simple; recheck it
before changing the wording.

- One clay world: a tall rounded mound cut away at the front, a crust of
  pine needles and twigs, packed sandy soil inside, rounded chambers joined
  by passages, grass tufts at the foot, a picnic blanket on the ground.
  Every page is a camera stop in it; turning the page flies the camera to
  the next stop (page 12 pulls right back, at dusk).
- `assets/js/world.js`: the layout (rooms, tunnels, props, camera stops),
  the twelve page scripts (who walks where and when, as pure functions of
  time) and the GLSL for the static world, generated from the same numbers
  so the ants' paths and the carved tunnels agree. Ants follow path
  segments; their body pitch is clamped (`PITCH_MAX`, about 30°) and eases
  to a flatter rest pitch when they stop, so an ant never goes head-down;
  the legs reach down to what is left of the slope (`LEG_REACH`). Camera
  flights between stops take `FLY_TIME`.
- `assets/js/clay.js`: one shared WebGL canvas laid over the shown page's
  placeholder SVG (`data-anthill`). A raymarched signed distance field; up
  to 4 detailed ants per picture (segmented body, 6 legs in a tripod gait,
  elbowed antennae), each behind a bounding sphere, and every room's
  contents behind its own bounding check. 12 pictures a second with a new
  surface boil each. The picture has its own painted background in the
  shader (rounded, feathered card: warm sky with a low sun glow and soft
  bokeh, a hazy meadow floor with the mound's contact shadow on it; dusk
  colours on page 12), so the mound never floats on the page. Constants
  `BG_*` at the top of clay.js.
- `assets/js/backdrop.js`: `mountAnthill`, the scene behind the book, an
  SVG summer meadow seen low at ant level (warm sky, bokeh, blurred tree
  line, wildflowers, big out-of-focus grass and clover in front), soft and
  low contrast.
- Tap (or Space / Enter) plays the page's action; tap again while it plays
  to jump to the end; tap at the end to play it again. The crumb, the
  beetle's niche and the opened cocoon stay as they were on later pages.
- Quality tiers (fewer raymarch steps, shadow steps and AO, lower resolution) on weak devices,
  and the resolution drops further if pictures render slowly. Without
  WebGL2 each page shows a flat drawing of the same place.
- The next-page prerender copy is ignored; only the shown page mounts.
- Style approved from the preview page `books/preview/assets/js/antclay.js`.
- No music yet. All art is original and made in code. The look reference
  the user supplied (a watermarked stock image) was used only for the look;
  nothing from it is copied or shipped.
- `cover.svg` (shelf card, 400×300) and `og.svg` (1200×630) are generated
  from `preview.js` by `node tools/build-previews.js anthill`: a hand-built
  vector of the book's art. `og.png` is a raster export of `og.svg`
  (headless Chrome `--screenshot`, 1200×630) and is what the og/twitter
  meta tags and the shelf `og` field point at. `favicon.svg` is hand-written.
