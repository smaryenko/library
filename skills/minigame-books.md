# Skill: minigame and branching books (`assets/js/minigame.js`)

When to use: a book where pages hold small puzzles that unlock the next page,
or a choose-your-way story with choices and several endings. References:
`books/spellbook` (puzzle per page, caption under the book),
`books/toyshop` (branching, a tap + choices only, 16 endings, text on the
page), `books/numberland` (puzzles inside a three.js world).

The kit needs no `storybook.js` edits: like `webgl-stage.js` it works with
capture-phase listeners and replayed arrow keys. Load order in `index.html`:
`storybook.js`, then `minigame.js`, then (if any) `webgl-stage.js`, then the
book's files, `pages.js`, `boot.js` last.

## Page fields (in `window.BOOK_PAGES`, the engine ignores them)

- `id`: unique string (default `p<index>`). Saved progress is keyed by it, so
  renaming ids drops saved state for that page.
- `task: (seed, ctx) => spec`: a puzzle. Forward input is locked (next and »
  dimmed) until it is solved. `ctx = { rng, seed, level (0..1), flags, solved }`.
  Draw everything from `ctx.rng`; never `Math.random()` inside a generator.
- `choice: { prompt, options: [{ key, html, to, sets }] }`: a branch. `to` is
  a page id or `flags => pageId`; `sets` adds flags.
- `next`: page id or `flags => pageId` (branching books).
- `ending: 'key'`: shows "Endings found n / N" (stars on one line) + Start over.
- `title` / `body` may be getters reading `MINIGAME.flags()`; such books set
  `window.BOOK_PRERENDER = false`.

Book globals: `MINIGAME_CAPTION` (see Layout), `BOOK_RUN_LENGTH` (counter
length for branching), `BOOK_ENDINGS_TOTAL`.

## Task kinds (`spec.kind`)

Every spec may add `prompt`, `art` (svg shown above the controls), `hint`
(after 3 misses) and `data` (anything the book's picture / world needs).

| kind | spec | solved when |
|---|---|---|
| tap | `hit: [x,y,w,h]` in viewBox units (optional) | the picture is tapped (or Space / Enter) |
| choice | `options: [{ html, ok }]`, `cols` | the `ok` option is tapped |
| pick | `items: [{ html, value }]`, `target`, `count?`, `answer?` | picked values add up to `target` (exactly `count` items) |
| order | `items: [{ html, x?, y? }]`, `order`, `free?`, `lines?`, `closeLoop?` | items tapped in order |
| drag | `pieces: [{ html, key }]`, `slots: [{ html, key, multi? }]` | every piece in its slot |
| cells | `cols, rows, given, target, color, axis?` | all target cells tapped |
| maze | `cols, rows, seed, start?, goal?, startSvg?, goalSvg?` | traced start to goal |
| push | `map: ['#####', '#@$.#']` | every crate on a mark |

A solved puzzle shown again draws its answer in place (right option green,
the child's picks, the order with badges and lines, pieces in slots, the
maze way, crates home).

## Progress (`localStorage['minigame:<bookId>']`)

`{ seeds, solved, picks, choices, path, endings }`, all saved.
- Every task gets a random seed on first load (`seedAll()`), so a reload
  keeps the same puzzles and a new game gets new ones.
- ↻ on a puzzle: new seed, the page becomes unsolved again (locks forward).
- Start over (cover / endings): clears the run, keeps endings found.
- The round ↺ button (top right, next to music): confirm, remove the whole
  key, reload. Endings saved under ids that no longer exist are dropped.

## Locks

- Next opens as soon as the current page is solved / chosen; » only when
  every puzzle in the book is solved (branching: » follows the saved path).
- `locked()` must return a real boolean: `classList.toggle(c, undefined)` is
  a plain toggle and made Next flicker on every re-check.
- The lock is re-applied on DOM changes, pointer moves and a 500 ms tick,
  always from the engine's current page (one source only).

## Layout (`window.MINIGAME_CAPTION`)

- unset: the panel sits under the page's text on the text page.
- `'below'` (spellbook): on pages with a puzzle / choice the title + text
  move to a caption right under the book (kept above the nav; phone
  landscape: only the screen bottom limits it) and the puzzle sits in a
  fixed box over the visible part of the text page, scaled (binary search,
  max 1.25x) so it is 92 % of that width and never taller than the page.
- `'panel'` (toyshop): the page keeps its text; the tap note, choices,
  endings and Start over sit in a dock right under the book.
- Both set `body.mg-book` (phone landscape lifts the book a little). The
  book size is otherwise the same as every other book.

## Rules learned

- No spoilers: neither the picture nor a world may show the answer before it
  is solved. Generators keep distractors honest (e.g. a potion's extra
  bottles are always below the target; seesaw needs exactly two).
- Worlds show the child's own pick (`MINIGAME.picked(id)`), not the textbook
  answer, and must reset cleanly when ↻ is pressed mid-animation or mid-walk.
- A drag inside a puzzle must never start pull-to-refresh (the kit cancels
  the engine's pull on the pointer's moves).
- Keep page text short for phones: about 110 characters per body.
- Branching with n two-way choices that all matter = 2^n endings; generate
  the ending pages in `pages.js` and reuse pictures where only text differs.
- Grid buttons use `minmax(0, 1fr)` and wrap long words; dot-to-dot dots size
  with container units so they never overlap.

## Events / API

`'minigame-mounted' { id, index, solved }`, `'minigame-solved' { id, index,
picked?, pickedIndex? }`. `window.MINIGAME = { isSolved, picked, flags,
current, state, rng, hash, pointerInPanel }`.
