// THE TOY SHOP AFTER MIDNIGHT: a branching picture book (ages 6-10). At
// midnight the toys wake; the kid shrinks to toy size and, with Button the
// rag doll, finds the broken music box's three missing parts (its winding
// key, a little brass gear, a tooth of its steel comb) before it is sold in
// the morning. No puzzles: one tap (shrink) and four two-way choices, the
// companion (soldier / ballerina), the way (high shelves / under the floor),
// help a stuck toy or hurry on, dance now or keep it secret: 2^4 = 16
// endings. Keep every body short (about 110 characters at most): on phones
// the caption under the book has room for two or three lines.
// Pictures: assets/js/scenes.js (kit assets/js/toys.js); the tap:
// assets/js/tasks.js; branching: the shared assets/js/minigame.js.
(function () {
  'use strict';
  const S = () => window.TOYSHOP_SCENES;
  const T = () => window.TOYSHOP_TASKS;
  const I = window.TOYSHOP_SCENES.icons;
  const fl = () => (window.MINIGAME && window.MINIGAME.flags && window.MINIGAME.flags()) || {};
  const bal = () => fl().companion === 'ballerina';
  const helped = () => fl().helped || '';
  const friend = () => (bal() ? 'The ballerina' : 'The tin soldier');
  const opt = (icon, label) => `${icon}<span>${label}</span>`;

  // ---- the 16 endings: companion x way x helped x dance/secret -------------------------
  const COMP = ['soldier', 'ballerina'], WAY = ['high', 'low'], HELP = ['help', 'hurry'], KIND = ['dance', 'secret'];
  const endId = (c, w, h, k) => `end-${c}-${w}-${h}-${k}`;
  const endOf = (f, kind) => endId(f.companion || 'soldier', f.way || 'high', f.helped ? 'help' : 'hurry', kind);
  const TITLE = {
    'soldier-dance': { high: 'Parade on the top shelf', low: 'Parade under the floor' },
    'ballerina-dance': { high: 'Ballet on the top shelf', low: 'Ballet under the floor' },
    'soldier-secret': { high: 'The soldier\u2019s secret', low: 'Our secret parade' },
    'ballerina-secret': { high: 'The ballerina\u2019s secret', low: 'Our secret ballet' }
  };
  // [dance line, secret line] for what this run brought along
  const GUEST = {
    'high-help': ['The little duck dances too.', 'The duck keeps our secret too.'],
    'low-help': ['The toy mouse dances too.', 'The mouse keeps our secret too.'],
    'high-hurry': ['My toy torch lights the floor.', 'I keep the toy torch in my pocket.'],
    'low-hurry': ['Glow stars twinkle above us.', 'I keep one glow star in my pocket.']
  };
  function endingBody(c, w, h, k) {
    const g = GUEST[`${w}-${h}`][k === 'dance' ? 0 : 1];
    if (k === 'dance') return `${c === 'soldier' ? 'The soldier marches' : 'The ballerina twirls'} and Button spins. ${g} At dawn I wake up humming.`;
    return `At dawn the shop sign says \u201cNot for sale.\u201d ${g} ${c === 'soldier' ? 'The soldier winks.' : 'The ballerina twirls, just a little.'}`;
  }
  const endings = [];
  COMP.forEach(c => WAY.forEach(w => HELP.forEach(h => KIND.forEach(k => {
    endings.push({ id: endId(c, w, h, k), title: TITLE[`${c}-${k}`][w], build: () => S()[`end-${c}-${k}`](),
      ending: `${c}-${w}-${h}-${k}`, body: endingBody(c, w, h, k) });
  }))));

  window.BOOK_PRERENDER = false;     // titles, text and pictures follow the choices
  window.BOOK_RUN_LENGTH = 15;       // pages in one run (16 with a detour)
  window.BOOK_ENDINGS_TOTAL = endings.length;   // 16

  window.MINIGAME_CAPTION = 'panel';   // text on the page; tap note, choices, endings and Start over under the book
  window.BOOK_PAGES = [
    { id: 'start', title: 'The Toy Shop After Midnight', build: () => S().start(), next: 'shrink',
      body: 'Dong! The old shop clock strikes twelve. Everything is quiet\u2026 or is it?' },
    { id: 'shrink', title: 'Toy size', build: () => S().shrink(), task: (seed, ctx) => T().shrink(seed, ctx), next: 'button',
      body: 'I tiptoe into the quiet shop in my pyjamas. Something magic is about to happen!' },
    { id: 'button', title: 'Hello, Button', build: () => S().button(), next: 'musicbox',
      body: 'A rag doll waves. \u201cI\u2019m Button! At midnight, all the toys wake up.\u201d' },
    { id: 'musicbox', title: 'The broken music box', build: () => S().musicbox(),
      body: 'The music box lost its key, a gear and a comb tooth. Tomorrow it will be sold!',
      choice: {
        prompt: 'Who comes with us?',
        options: [
          { key: 'soldier', html: opt(I.soldier, 'The tin soldier'), to: 'way', sets: { companion: 'soldier' } },
          { key: 'ballerina', html: opt(I.ballerina, 'The ballerina'), to: 'way', sets: { companion: 'ballerina' } }
        ]
      } },
    { id: 'way', title: 'Which way?', build: () => S().way(),
      get body() { return `${friend()} points up, then down. \u201cHigh shelves, or under the floor?\u201d`; },
      choice: {
        prompt: 'Which way?',
        options: [
          { key: 'high', html: opt(I.high, 'Up high'), to: 'h-theatre' },
          { key: 'low', html: opt(I.low, 'Down below'), to: 'u-boat' }
        ]
      } },

    // ---- high shelves --------------------------------------------------------------------
    { id: 'h-theatre', title: 'The puppet theatre', build: () => S()['h-theatre'](), next: 'h-jigsaw',
      body: 'Behind the puppet theatre curtain, something shines. The little gear!' },
    { id: 'h-jigsaw', title: 'The jigsaw bridge', build: () => S()['h-jigsaw'](), next: 'h-dollhouse',
      body: 'A jigsaw bridge takes us across to the dollhouse, piece by piece.' },
    { id: 'h-dollhouse', title: 'The dollhouse', build: () => S()['h-dollhouse'](),
      body: 'The comb tooth is on the dollhouse table. But a wooden duck is stuck in the chimney!',
      choice: {
        prompt: 'The duck is stuck!',
        options: [
          { key: 'help', html: opt(I.help, 'Help the duck'), to: 'h-jack', sets: { helped: 'duck' } },
          { key: 'hurry', html: opt(I.hurry, 'Hurry on'), to: 'h-attic', sets: { helped: '' } }
        ]
      } },
    { id: 'h-attic', title: 'The dark attic', build: () => S()['h-attic'](), next: 'h-jack',
      body: 'The quick way leads through a dark attic. Good thing I found a toy torch!' },
    { id: 'h-jack', title: 'Boing!', build: () => S()['h-jack'](), next: 'counter',
      get body() {
        return (helped() === 'duck' ? 'The duck waddles off, happy. ' : '') + 'Boing! A jack-in-the-box springs us up to the winding key.';
      } },

    // ---- under the floorboards ---------------------------------------------------------------
    { id: 'u-boat', title: 'The cork boat', build: () => S()['u-boat'](), next: 'u-marbles',
      body: 'Under the floor, spilled water made a lake. We sail across in a cork boat.' },
    { id: 'u-marbles', title: 'The marble cave', build: () => S()['u-marbles'](), next: 'u-spider',
      body: 'In a cave of lost marbles, something steel shines. The comb tooth!' },
    { id: 'u-spider', title: 'The friendly spider', build: () => S()['u-spider'](),
      body: 'The gear is in a kind spider\u2019s web. Below, a toy mouse is tangled in thread!',
      choice: {
        prompt: 'The mouse is stuck!',
        options: [
          { key: 'help', html: opt(I.help, 'Untangle the mouse'), to: 'u-climb', sets: { helped: 'mouse' } },
          { key: 'hurry', html: opt(I.hurry, 'Hurry on'), to: 'u-dark', sets: { helped: '' } }
        ]
      } },
    { id: 'u-dark', title: 'The dark tunnel', build: () => S()['u-dark'](), next: 'u-climb',
      body: 'We hurry into a long dark tunnel. Old glow stars show us the way.' },
    { id: 'u-climb', title: 'Up the thread', build: () => S()['u-climb'](), next: 'counter',
      get body() {
        return (helped() === 'mouse' ? 'The mouse squeaks thank you. ' : '') + 'We climb the spider\u2019s thread up to the winding key.';
      } },

    // ---- together again ----------------------------------------------------------------------
    { id: 'counter', title: 'The shop cat', build: () => S().counter(),
      next: f => (f.companion === 'ballerina' ? 'hide-freeze' : 'hide-march'),
      body: 'We have all three parts! But on the counter, the shop cat opens one green eye\u2026' },
    { id: 'hide-march', title: 'March in line', build: () => S()['hide-march'](), next: 'fix',
      body: '\u201cMarch like toys on parade!\u201d whispers the soldier. The cat only blinks.' },
    { id: 'hide-freeze', title: 'Freeze!', build: () => S()['hide-freeze'](), next: 'fix',
      body: '\u201cFreeze like statues!\u201d whispers the ballerina. The cat sniffs, then looks away.' },
    { id: 'fix', title: 'Mending the music box', build: () => S().fix(), next: 'rescue',
      body: 'Quick! The key, the gear and the comb tooth all click back into place.' },
    { id: 'rescue', build: () => S().rescue(), next: 'final',
      get title() { const h = helped(); return h === 'duck' ? 'The duck to the rescue' : h === 'mouse' ? 'The mouse to the rescue' : 'Button to the rescue'; },
      get body() {
        const h = helped();
        return 'A big soft paw reaches for the box. ' +
          (h === 'duck' ? 'The duck rolls by, and the cat chases it!'
            : h === 'mouse' ? 'The mouse whizzes past, and the cat runs after it!'
              : 'Button rolls some yarn, and the cat bounds after it!');
      } },
    { id: 'final', title: 'It plays!', build: () => S().final(),
      body: 'The music box plays again, sweet and bright. What now?',
      choice: {
        prompt: 'Dance, or keep it a secret?',
        options: [
          { key: 'dance', html: opt(I.dance, 'Play and dance'), to: f => endOf(f, 'dance') },
          { key: 'secret', html: opt(I.secret, 'Keep it secret'), to: f => endOf(f, 'secret') }
        ]
      } }
  ].concat(endings);
})();
