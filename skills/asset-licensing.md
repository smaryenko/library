# Skill: asset licensing — reference vs. shipped

**When to use:** any time you bring in external art, audio, or fonts, or decide
what goes in the committed repo.

The project ships **only original or clearly-licensed assets.** Stock art is
reference material, not source material.

## The rule

- **All visual art is original vector SVG authored in this repo.** Characters,
  props, backdrops, covers, favicons — drawn here, not imported.
- **Stock images are style references only.** Look at them for pose, proportion,
  palette, and silhouette. Then redraw as original vector.
  - Never copy, trace pixel-for-pixel, embed, or ship a reference image.
  - Reference origin is often unknown (possibly AI-generated). Keep references
    out of the committed repo — local only, under a gitignored folder
    (e.g. `.kiro/reference/`).
- **Audio** must be public domain or original. Example: the "Carol of the Bells"
  melody ("Shchedryk", Leontovych, 1914) is public domain; the bundled mp3 is
  the audio actually played and lives with the book that uses it.
- **Fonts:** prefer the system font stack (dependency-free). If a custom font is
  added, it must be openly licensed and the license noted.

## Documented exception: real planet maps (`books/space`)

The solar-system book intentionally renders **real surface maps** on canvas
spheres. Those textures are clearly licensed (Solar System Scope, CC BY 4.0;
NASA New Horizons Pluto map, public domain) and credited in
`books/space/README.md`. Any new real imagery must be similarly licensed and
credited there; everything else in the repo stays original vector.

## Where things live

- References (do NOT commit): a gitignored folder, with a README stating they
  are reference-only and why they are excluded.
- Shipped assets (committed): original vector art and licensed audio, inside the
  book folder that uses them (`books/<id>/...`) or shared `assets/` if truly
  global.

## Do NOT gitignore

- `skills/` — these guides ship with the repo.
- Original art and licensed audio that the site actually loads.

## Checklist

- [ ] Every shipped image is original vector (nothing traced/embedded).
- [ ] Reference images stay in a gitignored folder with a README.
- [ ] Audio is public-domain or original, noted in the README/license section.
- [ ] Fonts are system or openly licensed.
