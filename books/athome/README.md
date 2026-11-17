# How Things Work at Home

Nonfiction, 12 pages: home machines made of clay, each doing its job.
Picture on one page, text on the other.

- `assets/js/clay.js`: one shared WebGL canvas laid over the page's
  placeholder SVG (`data-clay3d`), transparent except for the clay and its
  contact shadow. A raymarched signed distance field of up to 16 pieces
  (ellipsoid, rounded box, capsule, torus, rounded cylinder) joined by
  smooth union; 12 pictures a second with a new surface boil each.
- `assets/js/machines.js`: the 12 machines as piece lists plus `anim()`.
  Slot order matters: turning the page morphs slot i of the machine you
  came from into slot i of the next one (the first page grows from a lump).
- Tap (or Space / Enter) plays the machine's action; it also plays once on
  its own after the morph.
- Quality tiers: fewer raymarch steps and lower resolution on weak devices.
- Needs WebGL2 (without it the picture area is just empty). No music yet.
- All art is original and made in code.
