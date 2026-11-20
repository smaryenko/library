# Number Cube Land
Fiction, puzzle journey, ages 6-10, 14 stops. A wind blew the Rainbow Gate
apart; little One wakes in a green valley, walks the land, meets number
friends (in the style of the Numberblocks, user's decision) and gathers them;
at the gate they fit themselves in to rebuild it.

One continuous three.js world, laid out left to right (like `books/longway`).
Page i is stop i; the page turn is the walk on. Each page has a puzzle in the
minigame panel under the caption (`assets/js/minigame.js`); next is locked
until it is solved, then the world plays that stop's result.

- `assets/js/friends.js` (`window.NUMBER_FRIENDS`): colours, a face STYLE per
  friend and MOODS (sleep, happy, surprised, joy, look-up, brave, sad, think),
  `friend(n, { cols })` for 1..16 (Four 2x2, Six 2x3 with dice dots, Nine 3x3,
  Ten white with red edges, 11-16 = Ten + the rest on top, Seven rainbow,
  Eight mask + eight arms, Five star hand, Three crown + dots), layouts
  `{ cols, flat }`, `place` / `morph` (split, merge, rearrange cube by cube),
  `icon(n)` SVG for the panel, `shadowSvg` / `shadowCanvas` silhouettes.
- `assets/js/tasks.js` (`window.NUMBERLAND_TASKS`): one seeded generator per
  stop (n1..n14). Each spec carries `data`, which the world rebuilds the
  stop from (it calls the same generator with the same seed).
- `assets/js/world.js`: kind `numberland`. The land (grass, river gap,
  path, instanced hills / trees / bushes / flowers / clouds) and the 14 stops,
  each `{ arr, post, route, cam, dur, lead(k), setup(data), pose(k, cur, t) }`.
  Everything is a pure function of the current stop, its result progress and
  the solved flags. The party: One, + Two and Three after the river, + Six
  after the low door; the others wave and stay.
- Inputs: the puzzle is answered in the panel only. `forward()` ignores taps
  from the panel, swallows a tap in the first 0.3 s of a result (the tap that
  solved a 'tap' task), else snaps a running result to its end; with nothing
  running it lets the engine turn (the kit blocks it while unsolved).

| # | Stop | Puzzle (kind) | Result in the world |
|---|---|---|---|
| 1 | Valley | tap One awake (tap) | One wakes, stretches, hops |
| 2 | River | friends filling a gap of 3-6 (pick) | they lie in the gap, One crosses, all hop out |
| 3 | Low door | how Six splits to fit under (choice) | Six splits, both walk under, join again |
| 4 | Shadow wall | whose shadow (choice) | the friend steps out from behind the sheet |
| 5 | Garden | Twelve's rectangle for the bed (choice) | Twelve rearranges flat into the bed, flowers |
| 6 | Seesaw | balance the sum (pick) | two friends hop on, the seesaw levels |
| 7 | Stepping stones | count in 2s / 3s (order) | the stones glow, the party hops across |
| 8 | Cube yard | how many more make 10, ten-frame (choice) | the missing cubes drop in, the row flies to the gate |
| 9 | Square pond | square numbers (pick) | 1 / 4 / 9 hop onto lily pads, stand as squares |
| 10 | Glow cave | count rows × columns of crystals (choice) | the crystals light up row by row |
| 11 | Mirror lake | the mirror half (cells) | the twin tower rises from the lake |
| 12 | Staircase hill | which friend is the missing step (choice) | the missing tower rises and shines |
| 13 | Odd camp | who has a cube left over (choice) | everyone pairs up, the lonely cube bounces |
| 14 | Rainbow Gate | friends into gaps by size (drag) | they fill the gaps, the gate glows, a rainbow |

Needs WebGL2; without it only the captions and puzzles show. No sounds.
All art is made in code (characters after the show, user's decision).
