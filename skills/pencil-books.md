# Skill: coloured-pencil books (an illustrator's finished pencil piece)
**When to use:** pictures that should look like a professional coloured-pencil
illustration. Reference: `books/lighthouse/` ("How a Lighthouse Works").

## Look: what works / what to avoid
- Tone, not outlines: dense fine strokes of uneven pressure with small
  breaks over a colour gradient, so forms are modelled (light, core shadow,
  reflected light).
- Two or three colour layers per area in different stroke directions (warm
  base, cool shadow), paper tooth showing through. Strong, saturated colour.
- Contours only where an illustrator draws them: sepia on warm things,
  indigo on cool ones, two passes. No outline on sky, sea, fog or glow.
- Atmospheric perspective: far pale and cool, near warm and dark.
- Small observed detail (lit windows, foam, tufts, cracks, gulls).
- Avoid (read as amateur): widely spaced straight hatching, geometric
  outlines round everything, flat single colours, pale colour, drawing-in.

## How it works (`assets/js/pencil.js`)
- `P = PENCIL.page(seed)` collects one picture. Four stroke tiles (`h1`
  up-right, `h2` cross, `h3` steep, `h4` near-horizontal) are SVG patterns
  used as masks: `P.tone(part, d, bbox, fill, hatch, o)` = a gradient rect
  masked by (strokes ∩ shape). `P.area(part, pts, ...)` does it for a point
  list (Catmull-Rom smoothed with `soft`).
- `P.lin` / `P.rad` add gradients (`P.gname(base)` for unique names),
  `P.contour`, `P.accent`, `P.raw`; `P.group(part, cls, fn, style)` wraps
  what `fn` draws in a class for the tap motion.
- `PENCIL.tower(P, { cx, base, top, ... })` draws a shaded lighthouse at any
  size; `PENCIL.gulls()` and `gullCss()` add flapping gulls.
- `P.end({ order, css, fit, hit })`: one `data-part` layer per part, one
  paper-tooth filter on each.

## Rules
- Picture complete from the first frame; a tap plays ONE small motion that
  shows the fact (2.4 s, `svg.is-playing`).
- Layers sort by `OBJ_DEPTH`, not markup order (`pc-paper` -34 ... `pc-gulls`
  22): whatever must be in front goes on a deeper key.
- Keep the stroke tiles shared per page; never generate strokes per area.
