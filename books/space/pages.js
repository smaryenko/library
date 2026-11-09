// "OUR SOLAR SYSTEM" — the page roster.
//
// 14 pages, all picture pages. Page 1 shows the whole system turning on its
// orbits; then we travel outward from the Sun, one world per spread, in real
// order (Mercury … Mars, the asteroid belt, Jupiter … Neptune, Pluto, then the Kuiper Belt beyond).
// Every body is a real rotating sphere (solar.js). Tap a picture to fly the
// whole picture to the middle of the screen; tap again to send it back.

(function () {
  'use strict';

  window.BOOK_PAGES = [
    { title: 'Our Solar System',
      bodyHtml: 'eight planets, one minor planet and two belts of space rocks circle one star. <br /> <span class="hl">Tap</span> to look closer!',
      build: () => buildSolarSystem() },
    { title: 'The Sun', body: 'a giant ball of glowing gas that lights and warms every planet.',
      build: () => buildBody('sun', { r: 100 }) },
    { title: 'Mercury', body: 'the smallest planet, closest to the Sun, covered in craters.',
      build: () => buildBody('mercury', { r: 70 }) },
    { title: 'Venus',
      bodyHtml: 'the hottest planet, wrapped in yellow clouds — and it spins <span class="hl">backwards</span>, the other way to Earth!',
      build: () => buildBody('venus', { r: 86 }) },
    { title: 'Earth',
      bodyHtml: 'blue oceans, green land, white clouds — <span class="hl">our home</span>.',
      build: () => buildEarth() },
    { title: 'The Moon', body: 'Earth\u2019s rocky companion, always showing us the same face.',
      build: () => buildBody('moon', { r: 72 }) },
    { title: 'Mars', body: 'the red planet, with dusty deserts and giant volcanoes.',
      build: () => buildBody('mars', { r: 80 }) },
    { title: 'The Asteroid Belt', body: 'millions of space rocks tumble between Mars and Jupiter. The big round one is Ceres!',
      build: () => buildAsteroids() },
    { title: 'Jupiter', body: 'the biggest planet, with a storm larger than Earth.',
      build: () => buildBody('jupiter', { r: 112 }) },
    { title: 'Saturn', body: 'wears bright rings made of ice and rock.',
      build: () => buildBody('saturn', { r: 54 }) },
    { title: 'Uranus',
      bodyHtml: 'an icy giant that rolls along on its side — and spins <span class="hl">backwards</span>, like Venus.',
      build: () => buildBody('uranus', { r: 84 }) },
    { title: 'Neptune', body: 'the windiest planet, deep blue and far away.',
      build: () => buildBody('neptune', { r: 84 }) },
    { title: 'Pluto',
      bodyHtml: 'a little <span class="hl">minor planet</span> made of ice, with a heart on its face, dancing with its moon Charon.',
      build: () => buildPluto() },
    { title: 'The Kuiper Belt', body: 'a cold ring of icy worlds beyond Neptune.',
      build: () => buildKuiper() }
  ];
})();
