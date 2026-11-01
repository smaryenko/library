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
  characters (flat-cartoon style, `data-part` grouping, gradients, no traced
  stock art).
- `asset-licensing.md` — reference-vs-shipped rules; keeping stock art out of
  the repo and redrawing everything as original vector.

## How to use a skill

Open the relevant file before starting that kind of work. The guides encode
hard-won lessons (especially the antler/offset-strip technique and the
reference-only licensing rule) so they are not re-learned each session.
