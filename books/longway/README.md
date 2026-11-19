# The Long Way Home
Fiction, 11 pages: Theo sails from a far harbour back to his island home, an
original kids' retelling of public-domain Odyssey motifs (bag of winds,
cyclops, lotus eaters, sirens, Scylla and Charybdis, the storm, Argos).
Every page sets up or pays off another: the lamp Mum and Dad keep lit
for him (1 -> 4 -> 11), the bag of winds (2 -> 4), the freed dolphin (3 -> 9),
the loaf (1 -> 5), the giant's wool (5 -> 7), the orchard fruit (6 -> 8).
Built of toy magnetic cubes on a table, in one continuous three.js world.
- `assets/js/cubes.js`: the cube kit. 16x16 pixel textures drawn in code
  (printed bevel + rim), materials, `figure()` (body cube + face cube).
- `assets/js/world.js`: the world laid out left to right (terrain, islands,
  houses, lighthouse, props) and the story. Page i is a camera stop
  (`CAM_X`), with its own light (`LIGHT`). The story is a list of 21
  segments (event of page 1, travel 1 -> 2, event of page 2, ...) made of
  small actions (`walk`, `board`, `ashore`, `sail`, `prop`, `face`, `lie`,
  `boat`, `par`); everything shown is a pure function of one number `s`.
- Hosted by the shared `assets/js/webgl-stage.js` (kind `longway`).
- 22 pages: page j rests at story step j; each turn plays one step (event or
  travel), back plays it in reverse; a running step snaps to its end.
- Needs WebGL2; without it only the captions show. No music yet.
- All art is original and made in code.
- `preview.js`: cover + og scene for `node tools/build-previews.js longway`.
