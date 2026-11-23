// THE ANT AND THE CRUMB: a small worker ant carries a bread crumb from a picnic
// blanket down through her anthill to the deepest store. Fiction with true
// ant facts (one per page, kept simple; recheck before changing the wording).
// No names: always "the ant" / "the little ant".
// Every picture is a camera stop in one clay world (assets/js/world.js +
// clay.js); tap plays what happens on that page.
(function () {
  'use strict';
  const m = i => () => window.buildAnthill(i);
  window.BOOK_PAGES = [
    { title: 'The crumb', build: m(0),
      body: 'A little worker ant finds a bread crumb as big as she is. Ants can carry many times their own weight, so up it goes.' },
    { title: 'The scent trail', build: m(1),
      body: 'The ant can\u2019t see the nest from here, so she follows the scent trail her sisters left on the ground.' },
    { title: 'The door', build: m(2),
      body: 'The guards tap the ant with their antennae. She smells like family, so they let her in.' },
    { title: 'The first tunnel', build: m(3),
      body: 'The tunnel winds down through soft soil and roots. A beetle is in the way, so the ant squeezes round it.' },
    { title: 'The rubbish room', build: m(4),
      body: 'Old food and empty shells go in the rubbish room. Ants keep their nest clean.' },
    { title: 'The diggers', build: m(5),
      body: 'Diggers carry the soil out grain by grain. One stops to help the little ant lift her crumb over a bump.' },
    { title: 'The nursery', build: m(6),
      body: 'Nurses move the eggs and larvae to the warmest spot. The ant gives a hungry larva a tiny piece of her crumb.' },
    { title: 'The pupae room', build: m(7),
      body: 'A new ant wiggles out of her cocoon. Young ants come out pale and soft, and slowly turn darker.' },
    { title: 'The worm', build: m(8),
      body: 'A worm wriggles across the tunnel and a little soil trickles down. The ant waits, because worms and ants share the soil.' },
    { title: 'The queen', build: m(9),
      body: 'The ant passes the queen and her helpers. The queen lays all the eggs for the whole colony.' },
    { title: 'The store', build: m(10),
      body: 'Deep down it stays cool and dry, so the food keeps. The ant adds her crumb to the seeds and crumbs.' },
    { title: 'One big family', build: m(11),
      body: 'At dusk the whole colony rests, working together like one big family. And up top, another ant has found a strawberry!' }
  ];
})();
