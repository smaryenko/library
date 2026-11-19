# How a Lighthouse Works
Nonfiction, 9 pages: what a lighthouse does and the sea around it (height
and the curve of the Earth, the lens, light codes, tides, waves, fog,
charts and compass, lights today), drawn as finished coloured-pencil
illustrations. Picture on one page, text on the other.
- `assets/js/pencil.js`: the pencil kit. `page(seed)` collects one
  picture: stroke-tile masks (`h1`..`h4`, four directions) over tonal
  gradients (`tone`, `area`), two-pass contours, accents, `group()` for tap
  motions, one paper-tooth filter; plus a shared `tower()` (bands, gallery,
  lantern, halo; shaded as a cylinder) and `gulls()`.
- `assets/js/scenes.js`: one builder per page, each with its own tap motion
  (2.4 s, `svg.is-playing`).
- Depth: `pc-*` layers in the shared `OBJ_DEPTH` (sky -30 ... gulls 22).
  Layers sort by depth, not markup order: put what must show in front on a
  deeper key.
- Pictures are complete from the first frame (no drawing-in).
- Facts kept general; recheck before changing the text. No music yet.
- All art is original and drawn in code.
- `preview.js`: cover + og scene for `node tools/build-previews.js lighthouse`.
