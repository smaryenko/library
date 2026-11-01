# Skill: original SVG character authoring (flat-cartoon style)

**When to use:** drawing any new character or prop builder — a function that
returns a layered `data-part` SVG string for the pseudo-3D rig.

This is the house style. It keeps every book visually consistent and keeps the
parts ready for `mountObject`.

## House style

- **Flat-cartoon, fill-first.** Solid filled silhouettes. No stroked squiggle
  outlines, no busy inner hatching.
- **Volume via radial gradients**, not many layers: a top-left highlight, a
  darker lower-right rim, and soft contact shadows where parts join (head↔body,
  body↔belly). This is what makes a flat shape read as rounded.
- **Chunky and cute over realistic.** Scale detail down to the body; oversized
  realistic features look wrong. Small, bold shapes win.
- **Warm, saturated-but-soft palette.** Give each character a distinct fur/coat
  tone plus a lighter belly/accent and a darker rim colour, so a family of
  characters reads as varied (as the nine reindeer do via cfg).

## Builder contract

- A builder is a function returning an **SVG string**, e.g. `buildThing(cfg)`.
- Every visual part is its own group: `<g data-part="...">…</g>`.
- Name parts by role so they slot into the shared `OBJ_DEPTH` map:
  back-to-front, e.g. `shadow`, body/base, mid detail, accessory, `head`,
  `ears`, `face`, `nose`, `hat`, top ornament.
- Prefer a single consistent `viewBox` and author at a fixed canvas size; place
  and scale sub-assemblies with transforms rather than re-authoring at size.

## Config, not forks

- Vary characters by a **cfg object**, not by copy-pasting a builder. The nine
  reindeer are one `buildReindeer(cfg)` driven by `fur` / `furDark` / `belly` /
  `antlerStyle` / `antlerColor` / `nose` / `accessory`.
- **Keep independent concerns as separate fields.** Hard rule learned here:
  antler **style** (`antlerStyle`) and antler **colour** (`antlerColor`) are
  two fields. An earlier version overloaded one `antler` field as both and
  rendered black when a style name was used as a colour. **Never merge them.**
  Apply the same discipline to any new "shape vs colour vs variant" axes.

## Organic branching geometry

See `3d-animation-from-reference.md` §4: offset a centre-line polyline by a
width function (`offsetStrip`), smooth with Catmull-Rom, enforce
branches-point-outward, author one side and mirror. Do not hand-place Bézier
handles for antlers/twigs/flames.

## Licensing

Original vector only. Stock images are **style references**, never traced,
embedded, or shipped. See `asset-licensing.md`.

## Checklist

- [ ] One builder, cfg-driven; no forked copies per variant.
- [ ] Every part a `data-part` group, named for the depth map.
- [ ] Fill-first shapes; volume via gradients + contact shadows.
- [ ] Independent axes kept as separate cfg fields (never merged).
- [ ] Chunky-to-host scale; original vector; nothing traced or shipped.
