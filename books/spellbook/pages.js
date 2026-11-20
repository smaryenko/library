// THE LITTLE WIZARD'S LOST SPELLBOOK: a minigame picture book (ages 6-10). On
// the first day at wizard school Pip the cat knocks the spellbook out of the
// window; its 12 pages scatter round the castle. Every solved puzzle wins one
// page back (the next arrow stays dimmed until then), and the finished book
// casts the first big spell. Pictures: assets/js/scenes.js (cut paper, kit in
// assets/js/paper.js); puzzles: assets/js/tasks.js (shared assets/js/minigame.js).
(function () {
  'use strict';
  const S = () => window.SPELLBOOK_SCENES;
  const T = () => window.SPELLBOOK_TASKS;
  window.MINIGAME_CAPTION = 'below';   // title + text under the book, the page holds the puzzle
  window.BOOK_PAGES = [
    { id: 'classroom', title: 'The first day', build: () => S().classroom(), task: (seed, ctx) => T().intro(seed, ctx),
      body: 'Today is my first day at wizard school, and Pip came too. Oh no, Pip! The spellbook is on the window sill.' },
    { id: 'potions', title: 'The potion room', build: () => S().potions(), task: (seed, ctx) => T().potion(seed, ctx),
      body: 'Out flew the book, and its twelve gold pages scattered round the castle. The first one landed by a bubbling cauldron.' },
    { id: 'library', title: 'The library', build: () => S().library(), task: (seed, ctx) => T().library(seed, ctx),
      body: 'In the library the books fly about like birds. One of them is holding our page.' },
    { id: 'corridor', title: 'The long corridors', build: () => S().corridor(), task: (seed, ctx) => T().corridor(seed, ctx),
      body: 'Something gold is shining at the far end of the hall. Which way do we go?' },
    { id: 'door', title: 'The locked door', build: () => S().door(), task: (seed, ctx) => T().door(seed, ctx),
      body: 'A page is stuck under a big old door. It has four keyholes, and every one is a different shape.' },
    { id: 'post', title: 'The paper-bird post', build: () => S().post(), task: (seed, ctx) => T().post(seed, ctx),
      body: 'Paper birds carry the castle letters. The bird with the right time on its clock will give us a page.' },
    { id: 'greenhouse', title: 'The greenhouse', build: () => S().greenhouse(), task: (seed, ctx) => T().greenhouse(seed, ctx),
      body: 'Magic seeds glow in the greenhouse. A page has grown right on top of the tallest plant.' },
    { id: 'circle', title: 'The spell circle', build: () => S().circle(), task: (seed, ctx) => T().circle(seed, ctx),
      body: 'A page floats above the old spell circle. The runes go round in a pattern, but one is missing.' },
    { id: 'kitchen', title: 'The castle kitchen', build: () => S().kitchen(), task: (seed, ctx) => T().kitchen(seed, ctx),
      body: 'The kitchen goblins found a page under their cookies. They will give it back if we share the cookies fairly.' },
    { id: 'stairs', title: 'The tower stairs', build: () => S().stairs(), task: (seed, ctx) => T().stairs(seed, ctx),
      body: 'Up and up the winding stairs. A page is caught between the clock gears.' },
    { id: 'observatory', title: 'The observatory', build: () => S().observatory(), task: (seed, ctx) => T().observatory(seed, ctx),
      body: 'At the top of the tower the roof opens to the sky. Pip spots a page twinkling among the stars.' },
    { id: 'mirrors', title: 'The mirror hall', build: () => S().mirrors(), task: (seed, ctx) => T().mirrors(seed, ctx),
      body: 'In the mirror hall I see two of me and two of Pip. The magic mirror only gives back a page to a finished picture.' },
    { id: 'dragon', title: "The dragon's nest", build: () => S().dragon(), task: (seed, ctx) => T().dragon(seed, ctx),
      body: 'The last page is on a friendly dragon\u2019s pile of gold. She will trade it for the right coins.' },
    { id: 'fireworks', title: 'The big spell', build: () => S().fireworks(), task: (seed, ctx) => T().fireworks(seed, ctx),
      body: 'All twelve pages are home again! Put them in order, then tap the picture for my very first big spell.' },
    // the end: no puzzle, so the text is back on the page
    { id: 'end', title: 'My first big spell', build: () => S().fireworks(),
      body: 'Whoosh! Fireworks burst over the castle, and Pip purrs. Tap the picture to cast the spell again. The end.' }
  ];
})();
