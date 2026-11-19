# Skill: crayon books (a child's own drawings)
**When to use:** pictures that should look drawn by a five-year-old with wax
crayons. Reference: `books/rain/` ("Where Does Rain Come From?").

## Look
- A blue sky band along the top, a sun with a face in a corner, square
  houses with triangle roofs, people as tall as the door (round head,
  triangle dress, stick arms and legs), wonky capital letters.
- Zig-zag scribble colouring that runs over the lines and leaves paper
  showing; wobbly thick outlines whose loops don't quite close.
- Bright crayon colours, no shading, no perspective.

## How it works (`assets/js/crayon.js`)
- `k = CRAYON.page(seed)`: `k.line` (jittered polyline), `k.scribble` (one
  back-and-forth path through the shape's scan lines, overshooting both
  ends), `k.shape` (both), `k.dot`, `k.oval`, `k.ring`, `k.rect`.
- Things children draw: `skyBand`, `sun` (rays in a `rays` group that turns
  on tap), `cloud`, `drop`, `grass`, `person` (arm `'wave'` gets a stepped
  wave), `word` (letters M E S P L A H !).
- `k.group(part, cls, fn, style)` wraps a drawing for its tap motion.
- `k.end({ order, reveal, css })`: `order` = layers back to front, `reveal`
  = the order a child would draw them; parts appear one by one in steps.
  One wax filter (turbulence alpha mask + small displacement) per part.

## Rules
- All motion is stepped (`steps(n)`), like stop motion; 2.4 s per tap.
- The tap shows the page's science (drops rise, rain falls, the rainbow
  arcs in colour by colour), not just decoration.
- Layers sort by `OBJ_DEPTH` (`cr-sky` -30 ... `cr-arrow` 24).
- Words on the page are the child's own: first person, simple, true.
