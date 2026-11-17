# Up We Go

Nonfiction, 14 pages: a short history of going to space, from the first
telescopes to Webb, each picture stitched in an embroidery hoop.

- `assets/js/stitch.js`: the embroidery kit. Stitch generators (satin /
  long-and-short, back, running, chain, French knots, star stitch) on a
  0..200 art box, and the hoop SVG: navy linen, wooden ring and clamp, one
  thread-relief filter plus a sheen line per stitch.
- `assets/js/scenes.js`: one builder per page.
- Depth: each stitched part is a `data-part` layer (`em-sky`, `em-ground`,
  `em-path`, `em-far`, `em-detail`, `em-main`, `em-mover`, `em-front`, plus
  the hoop's `em-shadow`, `em-cloth`, `em-ringshadow`, `em-ring`,
  `em-clamp`), depths in the shared `OBJ_DEPTH`.
- Opening a page: at most three appearances (setting, subject, details).
- Tap: movers animate for 2.4 s in 12-a-second stop-motion steps.
- No named people anywhere (by choice). Recheck dates before changing text.
- All art is original and drawn in code. No music yet.
