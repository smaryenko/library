// "A DAY ON THE REEF" — the page roster.
//
// 14 pages, NO text-only pages. The single caption line per spread carries the
// story. Real species names, no nicknames. Every page is one flat scene SVG
// built in props.js from the draw helpers in reeflife.js, animated with the
// shared Motion library (assets/js/motion.js). Image/text sides alternate
// automatically.
//
// Story: the clownfish finds a pretty spiral shell, but the tide tugs it away.
// The seahorse points the way, the turtle gives the fish a lift to catch up, and the chase winds through
// the coral; each neighbour helps (the pufferfish bumps it back, the octopus
// sweeps it along — a little too far). A glint in the kelp vanishes into a
// rocky cave, and the friendly eel nudges the shell out.
// The jellyfish light up the dark — and the shell starts to wiggle: it was a
// hermit crab's house all along. A new friend, better than any shell.

(function () {
  'use strict';

  window.BOOK_PAGES = [
    { title: 'The Reef', body: 'lies deep down in the warm blue sea.',
      build: () => buildReefHome() },
    { title: 'The Clownfish', body: 'darts out of the anemone to say good morning.',
      build: () => buildClownfishSolo() },
    { title: 'The Shell',
      bodyHtml: 'the fish finds the <span class="hl">prettiest</span> one on the sea floor.',
      build: () => buildShellSpot() },
    { title: 'The Tide', body: 'tugs it away — quick, after it!',
      build: () => buildCurrent() },
    { title: 'The Seahorse', body: 'points the way it went.',
      build: () => buildSeahorseScene() },
    { title: 'The Sea Turtle', body: 'gives the fish a lift to catch up!',
      build: () => buildTurtleScene() },
    { title: 'The Coral Garden', body: 'the fish chases it round and round.',
      build: () => buildCoralGarden() },
    { title: 'The Pufferfish', body: 'puffs up and bumps it back — boing!',
      build: () => buildPufferScene() },
    { title: 'The Octopus', body: 'sweeps it along with a helpful arm.',
      build: () => buildOctopusScene() },
    { title: 'The Kelp Forest', body: 'something glints ahead… then it is gone!',
      build: () => buildKelpForest() },
    { title: 'The Moray Eel',
      bodyHtml: 'a <span class="hl">friendly</span> eel nudges it out and waves!',
      build: () => buildEelScene() },
    { title: 'The Jellyfish', body: 'light up the water… and the shell begins to wiggle.',
      build: () => buildJellyParade() },
    { title: 'The Hermit Crab', body: 'the shell was his house all along!',
      build: () => buildCrabReveal() },
    { title: 'A New Friend', body: 'better than any shell. The reef glows hello!',
      build: () => buildReefAwake() }
  ];
})();
