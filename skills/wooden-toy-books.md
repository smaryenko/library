# Skill: wooden toy books (realistic three.js toys on a table)

**When to use:** a concept book (prepositions, opposites, counting) shown
with toys that should read as a photo of real handmade wooden toys, not a 3D
cartoon. Reference: `books/wherecat/` ("Where Is the Cat?"); style preview
`books/preview/assets/js/woodtoys.js`.

## Setup

- One three.js renderer laid over each page's empty placeholder SVG
  (`data-wherecat="i"`), moved onto the shown page only, never onto
  `.obj-prerender`. Build every prop ONCE; pages only pose them.
- Each page is a pure function of one number: opposites `pose(u)` (u = 0
  first word, 1 second word; tap plays to the other end, tap while playing
  snaps). So snapping, replaying and jumping are free.

## Realism recipe

- Materials: `MeshPhysicalMaterial` with satin oil (roughness ~0.45-0.5, low
  clearcoat), a bump map from the grain, `RoomEnvironment` for reflections,
  one warm key light from the window side, soft shadows.
- Shapes: everything bevelled or lathed (`RoundedBoxGeometry`, `LatheGeometry`);
  no hard CG edges. Toys sparingly painted.
- Procedural seamless wood: periodic value noise whose lattice wraps every
  `px / py` cells, and every frequency a whole number of cells across the
  texture, so it tiles without seams. Rings + rays, per-wood palette
  (`WOOD.oak / pine / beech`), random offset per piece.
- Paint over wood: paint is a tint on top of the grain texture (with a
  little more clearcoat), so the grain still shows through thin paint.
- Background: `scene.background` = a tiny canvas (wall, window light from
  the key-light side, blurred plant, vignette, grain) scaled up so smoothing
  does the blur. The table top ends at a visible back edge. **No fog** (it
  washed the toys out). A calm SVG playroom backdrop sits behind the book.

## Camera

- Tight auto-fit: project the props and poses in use to the screen and move
  in until they fill the frame, with a small margin and extra room at the
  bottom for the word label. Frame per station, ease between framings during
  a move. Swing to the side only when a word needs depth ("behind").

## Motion

- A wooden toy is pushed by hand: it **slides** along the table with a small
  lean and a tiny rock as it stops. Height changes are short straight lifts
  just clearing an edge. No arcs, no jumps, no air time.
- Props a step needs grow in; props it no longer needs shrink away.

## Faces

- Friendly toy faces: closed smiling eyes (two painted arcs) by default.
  Only where the word needs it (awake) use small painted dot eyes with a
  highlight. Never big staring pupils.

## Words

- Every key word in the text is red and bold (`#c8231e`) via the page's
  `bodyHtml` (trusted static markup); the word label on the picture uses the
  same red.
- Cycling one page: page 1 holds every preposition as stations. Each tap
  moves to the next station (cycles round) and changes BOTH the label and the
  page sentence: `pages.js` exports the sentences (`window.WHERECAT_PREP`, same
  order as `STATIONS`) and wraps the shown one in `[data-wherecat-text]`; the
  scene rewrites it halfway through the move. Each page opens already posed
  on its first word.
- No names unless asked: "the cat", "the kitten".
