# The Toy Shop After Midnight
Branching fiction picture book, ages 6-10, in the approved toy-shop style
(`books/preview/assets/js/toyshop.js`): warm lamplight, dark wallpaper,
wood-grain shelves, a blurred back shelf, felt, yarn, glossy tin, gold and
steel. At midnight the toys wake; the kid shrinks to toy size and, with
Button the rag doll, finds the broken music box's three missing parts (the
winding key, a little brass gear, a tooth of the steel comb) before it is
sold in the morning. No puzzles: one tap (shrink) and four two-way choices,
so 2^4 = 16 endings; one run is 15 pages (16 with a detour). Every page
body stays short (about 110 characters) so the caption fits on phones.

## Flow
```
start -> shrink (tap) -> button -> musicbox  CHOICE 1 companion: soldier | ballerina
  -> way  CHOICE 2 high | low
     high: h-theatre -> h-jigsaw -> h-dollhouse CHOICE 3
             help (helped: duck) -----> h-jack
             hurry -> h-attic --------> h-jack
     low:  u-boat -> u-marbles -> u-spider CHOICE 3
             help (helped: mouse) ----> u-climb
             hurry -> u-dark ---------> u-climb
  h-jack / u-climb -> counter -> soldier ? hide-march : hide-freeze
  -> fix -> rescue (duck / mouse / Button)
  -> final  CHOICE 4 dance | secret
  -> end-<soldier|ballerina>-<high|low>-<help|hurry>-<dance|secret>   (16)
```
The 16 ending pages are generated in `pages.js`; they reuse the four
`end-<companion>-<dance|secret>` pictures, with title and text from the way
and from who came along (duck, mouse, torch, glow star).
Parts found: high: gear (theatre), tooth (dollhouse), key (jack); low: tooth
(marbles), gear (spider), key (climb).

## Files
- `assets/js/toys.js`: the kit `window.TOYS` (`C` palette, `kit(seed)`,
  `gearD`). One picture = one `kit()` with a fresh uid: materials as defs
  (wood, felt, yarn, dof, soft shadow, gold, steel, tin, porcelain, glass),
  room pieces (`wall`, `backShelf`, `shelf`, `under`, `floorboards`,
  `shopWindow` night / dawn, `lamp`, `light` with dark / dawn overlays), the
  cast at any position and scale (`kid`, `button`, `soldier` with the key
  spinning round its stem, `ballerina`, `jack`, `spider`, `duck`, `mouse`,
  `cat` sleepy / awake, `catPaw`, `musicBox` open / closed with parts in or
  missing), props (`gear`, `windKey`, `combTooth`, `marble`, `spool`,
  `block`) and tap helpers (`anim`, `origin`, `spin`, `notes`, `twinkles`).
- `assets/js/scenes.js`: `window.TOYSHOP_SCENES`, one builder per page id
  (25) plus `icons` for the choice buttons. Branch pictures read
  `MINIGAME.flags()` (`companion`, `helped`) at build time.
- `assets/js/tasks.js`: `window.TOYSHOP_TASKS`, seeded `(seed, ctx) => spec`
  generators; only `shrink` (tap) is used now, the rest are unused.
- `assets/js/backdrop.js`: `window.mountToyshop` (`.winter-bg`).
- `pages.js`: `BOOK_PAGES` with `id`, `next`, `choice`, `task`, `ending`;
  `title` / `body` getters on flag-dependent pages; `BOOK_PRERENDER = false`,
  `BOOK_RUN_LENGTH = 15`, `BOOK_ENDINGS_TOTAL = 16`.
- `cover.svg`, `favicon.svg` (music box), `og.svg`: hand-written static SVG.

## Notes
- Depth: the shared `ts-*` keys in `OBJ_DEPTH`, used as roles (`ts-soldier`
  mid character, `ts-doll` front character, `ts-fx` sparkles and notes,
  `ts-light` vignette, dark overlays and torch beams).
- Tap motions: each picture's own `<style>`, classes keyed by the uid, at
  most 2.4 s, one animation runs from 0 s, all end in the start pose.
- Faces: dot / small oval eyes with a light catch, soft brows, small smiles;
  Button has no button eyes or cross stitches, the soldier no cheeks. The
  cat is curious, never scary; peril stays mild.
- No sounds, no timers; all art is original and drawn in code.
