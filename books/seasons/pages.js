// SEASONS book — "A Fox's Year", the page roster (12 spreads, three per season).
// One red fox carried through the year, with a small woodland neighbour on
// most spreads. Builders live in assets/js/scenes.js.
(function () {
  'use strict';
  window.BOOK_PAGES = [
    { title: 'Spring',
      body: 'The snow has melted. The fox wakes up at its den, and a little mouse hides in the grass.',
      build: () => buildSpringDen() },
    { title: 'Kits',
      body: 'Three fox kits tumble and play in the daisies while their mother keeps watch.',
      build: () => buildKits() },
    { title: 'Bluebells',
      body: 'The woods turn blue with flowers. A bumblebee tickles the fox\u2019s nose... ah-choo!',
      build: () => buildBluebells() },
    { title: 'Summer',
      body: 'In the warm summer grass a butterfly flutters by. The fox jumps up to play, but the butterfly floats away!',
      build: () => buildMeadow() },
    { title: 'The stream',
      body: 'On a hot day the fox splashes across a cool stream, and a dragonfly zips over the water.',
      build: () => buildStream() },
    { title: 'Night',
      body: 'On warm summer nights the fireflies glow, and the fox\u2019s eyes shine in the dark.',
      build: () => buildNight() },
    { title: 'Autumn',
      body: 'The leaves turn red and gold, just like the fox\u2019s coat. A squirrel watches from its branch.',
      build: () => buildAutumn() },
    { title: 'Geese',
      body: 'Honk, honk! Geese fly south for the winter, and the fox watches them pass.',
      build: () => buildGeese() },
    { title: 'Saving food',
      body: 'The fox digs a hole and hides an apple to eat later. A hedgehog snuffles by.',
      build: () => buildCache() },
    { title: 'Winter',
      body: 'Now the fox\u2019s coat is thick and fluffy. It shakes off the snow, and a robin hops away.',
      build: () => buildWinter() },
    { title: 'Listening',
      body: 'The fox hears a mouse under the snow. It jumps up high and dives in nose-first!',
      build: () => buildSnowDive() },
    { title: 'Goodnight',
      body: 'Curled up in the snow, the fox wraps its tail around its nose and sleeps until spring.',
      build: () => buildSleep() }
  ];
})();
