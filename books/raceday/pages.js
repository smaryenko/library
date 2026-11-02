// RACE DAY book — the page roster.
//
// The only content the shared storybook engine needs for this book: an ordered
// list of pages on window.BOOK_PAGES. Each page is either an OBJECT page
// { title, body, build } (build() returns a layered data-part SVG via this
// book's builders) or a TEXT-ONLY page { textOnly, left, right }. The engine
// (assets/js/storybook.js) handles layout, flipping, tilt, backdrop and music.
//
// Story: one lap of a toy-car race around a cozy living room. Four cars share
// one buildCar(cfg) DNA (varied by colour / cabin / number / spoiler / stripe),
// just like the nine reindeer. They dash the hallway, jump a book-stack ramp,
// skid the kitchen tiles, cross the shaggy rug, loop-the-loop, and finish in a
// friendly TIE — both win together on a shared podium.
//
// 14 pages. Image/text sides alternate automatically (engine-handled).

(function () {
  'use strict';

  const car = cfg => () => buildCar(cfg);

  window.BOOK_PAGES = [
    {
      // 1 — the starting grid: all four cars lined up on a 4-lane track
      title: 'Race Day', body: 'the toy cars line up!',
      build: () => buildStartGrid()
    },
    {
      // 2 — Turbo (red): first off the line — a hard wheelie launch.
      title: 'Turbo', body: 'is first off the line.',
      build: car({ body: '#E23B2E', cabin: '#b2271c', number: '1',
        spoiler: 'wing', stripe: 'center', anim: 'wheelie' })
    },
    {
      // 3 — Bolt (blue), the chaser: a quick vroom forward and back.
      title: 'Bolt', body: 'is right on his tail!',
      build: car({ body: '#2F7DE0', cabin: '#235fab', number: '7',
        spoiler: 'tall', stripe: 'center', anim: 'vroom' })
    },
    {
      // 4 — Rusty (yellow/orange), the underdog: rattles and shakes.
      title: 'Rusty', body: 'rattles up from the back.',
      build: car({ body: '#E0B24A', cabin: '#b98a2c', number: '3',
        spoiler: 'low', stripe: 'flames', anim: 'shake' })
    },
    {
      // 5 — Jade (green), clever on the corners: a revving squat.
      title: 'Jade', body: 'takes the corners clean.',
      build: car({ body: '#5AA469', cabin: '#3f7d4e', number: '8',
        spoiler: 'wing', stripe: 'center', anim: 'rev' })
    },
    {
      // 6 — text-only start interlude: the countdown + the rev line
      textOnly: true,
      left:  { bodyHtml: '<span class="hl">R-R-R-R-Rev</span> your engines…' },
      right: { title: 'GO!', body: 'and they\u2019re off!' }
    },
    {
      // 7 — the hallway straight
      title: 'The Hallway', body: 'a long straight dash!',
      build: () => buildHallway()
    },
    {
      // 8 — the book-stack ramp
      title: 'The Ramp', body: 'built from a stack of books!',
      build: () => buildRamp()
    },
    {
      // 9 — the kitchen tiles
      title: 'The Kitchen', body: 'slippery tiles \u2014 skiiid!',
      build: () => buildKitchen()
    },
    {
      // 10 — the SHAGGY carpet (the requested word, highlighted). Draws its own
      // rug on the floor so it never relies on the faint backdrop rug.
      title: 'The Carpet',
      bodyHtml: 'the cars hit the <span class="hl">shaggy</span> rug!',
      build: () => buildCarpet()
    },
    {
      // 11 — the loop-the-loop
      title: 'The Loop', body: 'whoosh \u2014 upside down!',
      build: () => buildLoop()
    },
    {
      // 12 — text-only: the final chase, neck and neck
      textOnly: true,
      left:  { bodyHtml: '<span class="hl">Bolt</span> is catching up to <span class="hl">Turbo</span>,' },
      right: { bodyHtml: 'neck and <span class="hl">neck!</span>' }
    },
    {
      // 13 — photo finish: both cars cross together
      title: 'Photo Finish', body: 'both cars cross together!',
      build: () => buildFinish(false)
    },
    {
      // 14 — friendly tie finale: shared podium
      title: 'Everybody Wins!', body: '',
      build: () => buildFinish(true)
    }
  ];
})();
