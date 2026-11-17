# Skill: embroidery books (stitched pictures in a hoop)

**When to use:** a book whose pictures should look hand-embroidered.
Reference: `books/upwego/` ("Up We Go").

## How it works

- `assets/js/stitch.js` is the kit. A design is a list of stitches on a
  0..200 art box; the hoop's inside is the circle at 100,100, r 100.
  Generators: `satin` / `fillPoly` / `fillCirc` / `fillEll` / `fillRect`
  (satin and long-and-short fills, colour may be a function of x, y),
  `back`, `running`, `chain`, `knot` (French knot), `star`, `stars(n, free)`,
  `earthCurve()`.
- Each stitch is an SVG line plus its own thin, lighter sheen line; one
  shared filter adds relief and a small cast shadow. Satin threads are
  thinner than the row spacing (`SATIN_FILL`) so a dark line of linen shows
  between them; without that gap the filter melts neighbours into one patch.
- The hoop (wood bands, grain, clamp, two page shadows) is drawn by the kit.
- Depth: `d.part(role, group)` puts the next stitches on a `data-part`
  layer `em-<role>` (sky, ground, path, far, detail, main, mover, front);
  depths live in the shared `OBJ_DEPTH`. Add new roles there (additive only).

## Rules learned the hard way

- **At most three appearances per page** (`group` 0 setting, 1 subject,
  2 details). One reveal per stitch or per small group made pieces vanish.
- **Show the finished picture**; no sewing-needle animation.
- Tap: `d.mover(name, origin)` groups stitches drawn round `origin`; give
  `anims[name].frame(f)` (f 0..1, sampled at 12 a second, 2.4 s total, the
  engine's `.is-playing` run) and optionally `rest`.
- Keep a page under ~5,000 SVG elements: large flat areas (sky, ground) get
  a longer `max` and a slightly bigger `gap`.
- Every moving thing must read as what it is and where it is going (the
  Moon page's capsule orbit had to dip behind the horizon to make sense).
