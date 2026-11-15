// BUNNY DAY, OWL NIGHT: the page roster (pop-up: printed ground + standing
// die-cut pieces, see assets/js/scene.js and animals.js).
//
// Two stories that meet on the last page. The divider keeps its place
// across page turns, so each can be read on its own from start to end:
//   NIGHT (push the line right, text bottom-left): it is Bunny's birthday
//     tomorrow. Owl and the night friends get a surprise party ready; on
//     page 10 Owl puts the last feather clue on the big tree.
//   DAY (push the line left, text bottom-right): it is Bunny's birthday.
//     Bunny finds a feather by his door and follows the clues, helped by
//     the day friends, looking for his present.
//   FINALE (no slider): sunset under the big tree, where both meet.
// Bunny finds a feather on every day page, on the LEFT page (he stands on
// the right, so the feather is always ahead of him, leading the way); on the night side Owl is only
// seen placing one on page 10 (the last feather, on the big tree).
// Day friends stand on the LEFT page and night friends on the RIGHT, so
// each story fills the whole spread once its side is revealed.
// Positions are starting points: scene.js (spaced/settle) moves pieces
// sideways so nothing overlaps or stands on the scenery.
// Ground positions: u 0..1600 across the spread, v 0 (far) .. 800 (near).
(function () {
  'use strict';
  window.BOOK_LAYOUT = 'popup';
  const P = (i, place, night, day, extra) => {
    const cfg = Object.assign({ page: i, place }, extra || {});
    return { night, day, ground: () => groundDayNight(cfg), build: () => buildDayNight(cfg) };
  };
  // the clue, in both halves at the same spot
  const clue = (u, v, k) => ({ a: 'feather', u, v, k: k || 1 });
  window.BOOK_PAGES = [
    P(0, 'burrow',
      'Shh! Tomorrow is Bunny\u2019s birthday. Owl leaves the first feather.',
      'It\u2019s Bunny\u2019s birthday! A feather by his door. Is it a clue?',
      { bunny: { u: 1130, v: 540 },
        dayCast: [clue(670, 520)],
        nightCast: [clue(670, 520)], owl: { ground: true, u: 470, v: 540, k: 0.55 } }),
    P(1, 'carrots',
      'Hedgehog digs up the sweetest carrots for the birthday cake.',
      'A feather by the carrots! Squirrel chatters: that way!',
      { bunny: { u: 1040, v: 560 },
        dayCast: [clue(560, 610), { a: 'squirrel', u: 300, v: 460, k: 0.8, flip: true }],
        nightCast: [{ a: 'hedgehog', u: 1150, v: 745, k: 0.85, opt: { carrot: true } }] }),
    P(2, 'pond',
      'Frog practises the birthday song. Ribbit, ribbit!',
      'Duck finds a feather on the pond. Quack! Keep going!',
      { bunny: { u: 1240, v: 520 },
        dayCast: [clue(560, 700, 0.8), { a: 'duck', u: 700, v: 690, flip: true }, { a: 'snail', u: 260, v: 620, k: 0.8, flip: true }],
        nightCast: [{ a: 'frog', u: 1000, v: 700, k: 1.1 }, { a: 'frog', u: 880, v: 735, k: 0.8 }] }),
    P(3, 'flowers',
      'The fireflies promise to bring their lights. Blink, blink!',
      'Butterfly shows Bunny a feather in the flowers.',
      { dayCast: [clue(410, 640), { a: 'robin', u: 260, v: 700, k: 0.8, flip: true }],
        nightCast: [{ a: 'moth', x: 1150, y: 560, k: 0.7 }, { a: 'hedgehog', u: 1250, v: 700, k: 0.8 }] }),
    P(4, 'hill',
      'Bat flies over the hill to invite everyone to the party.',
      'Bunny hops up the hill. Robin sings: one more feather!',
      { bunny: { u: 1120, v: 520, pose: 'hop' },
        dayCast: [clue(270, 560), { a: 'robin', u: 340, v: 620, k: 0.9, flip: true }],
        nightCast: [{ a: 'bat', x: 1180, y: 330, k: 0.8 }, { a: 'bat', x: 1320, y: 290, k: 0.55 }],
        owl: { x: 420, y: 470, k: 0.6, pose: 'fly' } }),
    P(5, 'puddle',
      'Mouse washes the party plates in the puddle. Splish!',
      'Splash! Bunny finds a feather by the puddle.',
      { bunny: { u: 1110, v: 610, pose: 'hop' },
        dayCast: [clue(310, 680), { a: 'duck', u: 450, v: 660, k: 0.8, flip: true }],
        nightCast: [{ a: 'mouse', u: 1350, v: 690, k: 0.9, opt: { plates: true } }] }),
    P(6, 'bushes',
      'Badger picks juicy berries to put on the cake.',
      'Snail whispers: there is a feather in the bush!',
      { bunny: { u: 1290, v: 590, pose: 'peek' },
        dayCast: [clue(420, 600, 0.9), { a: 'snail', u: 560, v: 680, k: 0.9, flip: true }],
        nightCast: [{ a: 'badger', u: 1080, v: 650, k: 0.9, opt: { basket: true } }, { a: 'mouse', u: 1180, v: 720, k: 0.7 }] }),
    P(7, 'rain',
      'Rain! Owl keeps the birthday cake dry under her wings.',
      'Rain! Bunny and Squirrel stay dry under the big tree.',
      // everyone shelters under the crown (no rain falls under it)
      { bunny: { u: 930, v: 480 },
        dayCast: [{ a: 'squirrel', u: 680, v: 490, k: 0.75, flip: true }],
        nightCast: [{ a: 'cake', u: 900, v: 540, k: 0.7 }, { a: 'hedgehog', u: 1010, v: 500, k: 0.65 }],
        owl: { ground: true, u: 690, v: 480, k: 0.55 } }),
    P(8, 'rainbow',
      'Moth helps Owl hang paper stars in the big tree.',
      'A rainbow! And paper stars in the big tree. Who put them there?',
      { garland: true,
        dayCast: [{ a: 'squirrel', u: 300, v: 600, k: 0.75, flip: true }],
        nightCast: [{ a: 'moth', x: 1040, y: 520, k: 0.7 }, { a: 'moth', x: 1250, y: 470, k: 0.5 }] }),
    P(9, 'meadow',
      'All ready! Owl puts her last feather on the big tree. Now everyone hides. Shh!',
      'The last feather is on the big tree. Bunny runs!',
      { garland: true, daySky: 'evening', nightSky: 'dawn',
        bunny: { u: 1180, v: 560, pose: 'hop' },
        dayCast: [{ a: 'feather', x: 742, y: 700, k: 1.1 }],
        owl: { ground: true, u: 560, v: 490, k: 0.6 },   // left page, as on every page, by the feather
        nightCast: [{ a: 'feather', x: 742, y: 700, k: 1.1 }, { a: 'cake', u: 960, v: 600, k: 0.6 },
          { a: 'hedgehog', u: 1150, v: 520, k: 0.6 }, { a: 'badger', u: 1300, v: 560, k: 0.7 },
          { a: 'mouse', u: 1060, v: 620, k: 0.7 }] }),
    { title: 'Surprise! Happy birthday, Bunny!',
      body: 'Owl hid the feathers, and Bunny found them all. At sunset the day friends and the night friends sing together.',
      ground: () => groundDusk(),
      build: () => buildDusk() }
  ];
})();
