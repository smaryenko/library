# Where Does Rain Come From?
Nonfiction, 9 pages: the water cycle (evaporation, condensation, clouds,
rain, rainbows, snow, rivers, round again), told as a child's own crayon
drawings and words. Picture on one page, text on the other.
- `assets/js/crayon.js`: the crayon kit. `page(seed)` collects one
  picture: wobbly lines (`line`), zig-zag scribble colouring (`scribble`,
  `shape`), `group()` for tap motions, and the things a child draws (`skyBand`,
  `sun` with a face, `cloud`, `drop`, `grass`, `person`, wonky `word`s). One
  wax filter gives every stroke paper grain.
- `assets/js/scenes.js`: one builder per page. Each lists its parts in
  drawing order (`reveal`): they appear one by one, in stop-motion steps.
  A tap plays small stepped motions that show the page's science.
- Depth: `cr-*` layers in the shared `OBJ_DEPTH`; layers sort by depth.
- No music yet. All art is original and drawn in code.
- `preview.js`: cover + og scene for `node tools/build-previews.js rain`.
