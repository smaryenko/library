# skills — portable authoring guides

These are **committed, project-agnostic skill files** for the `stories` project
(the pseudo-3D storybook shelf). Unlike `.kiro/steering/` (local, gitignored,
IDE-specific), everything in `skills/` is meant to:

- ship in the repo (do NOT add to `.gitignore`);
- be readable by a human or any AI assistant, not just Kiro;
- stay engine-agnostic so they survive refactors and new books.

Each skill is a standalone Markdown guide with a short "when to use" header.

## Index

- `3d-animation-from-reference.md` — how to turn a flat style-reference image
  into a layered, pseudo-3D `data-part` SVG object (the core visual technique).
- `book-authoring.md` — how to add a new book to the shelf: folder layout,
  manifest entry, per-book assets (favicon, og image, cover), and page roster.
- `svg-character-authoring.md` — conventions for drawing original vector
  characters (**detailed & believable, kid-friendly — never flat/minimal**,
  `data-part` grouping, layered gradients/shading, the required per-object click
  animation, no traced stock art).
- `asset-licensing.md` — reference-vs-shipped rules; keeping stock art out of
  the repo and redrawing everything as original vector.

## Project-wide preferences (apply to all visual work)

- **Detailed & believable, kid-friendly — never flat or under-detailed.** Art
  may stay warm and a little stylised for children, but it must have the detail
  and shading of a real illustration: believable form, materials, lighting, and
  faces with real structure. The thing to avoid is placeholder-flat art (a
  one-rectangle rug, a two-dot face) — push toward realistic detail.
- **Every picture ships its own one-shot click animation**, embedded in the
  object's SVG via the shared `buildAnim` helper (`assets/js/anim.js`), usually
  composed from the shared Motion library primitives (`assets/js/motion.js`). Tapping
  a pop-up image plays it; no shared or global animations. Make it rich and
  full-page, and feel free to **spawn effect-only elements** for the beat (a
  ground crack, exhaust clouds, a sparkle) — drawn as `fx-*` parts hidden at
  rest and revealed only while playing.

## How to use a skill

Open the relevant file before starting that kind of work. The guides encode
hard-won lessons (especially the antler/offset-strip technique and the
reference-only licensing rule) so they are not re-learned each session.
