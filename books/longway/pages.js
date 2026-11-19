// THE LONG WAY HOME: a kids' odyssey in toy building cubes. Theo travels
// LEFT to RIGHT through one continuous world (assets/js/world.js): each page
// is a camera stop, a page turn is the journey on (walk or sail).
// Every animation is its own page turn: 22 pages, a turn plays one step
// (an event or the journey on), back plays it in reverse.
// Original retelling of public-domain Odyssey motifs; no peril beyond mild.
(function () {
  'use strict';
  const at = i => () => window.WEBGL_STAGE.placeholder('longway', i);
  window.BOOK_PRERENDER = false;   // the WebGL placeholder must mount only when shown
  window.BOOK_PAGES = [
    { title: 'Bread for home', body: 'Mum and Dad sent Theo across the sea to the town baker. \u201cBring bread home. We\u2019ll keep the lamp lit for you!\u201d' },
    { title: 'Off he goes', body: 'The baker tosses him a big loaf. Theo runs down to his boat and puts up the sail.' },
    { title: 'The lighthouse', body: 'At the harbour mouth the old lighthouse keeper opens his door.' },
    { title: 'The bag of winds', body: 'He gives Theo a sack. \u201cAll the winds are inside but one. Never open it!\u201d' },
    { title: 'Out at sea', body: 'Out at sea, something splashes. A young dolphin is caught in a net!' },
    { title: 'Free!', body: 'Theo cuts the net. The dolphin leaps away with its family.' },
    { title: 'So close', body: 'Theo can see the lamp of home! He waves and waves.' },
    { title: 'The winds', body: 'Behind him, a gull pecks the sack open, and whoosh! The winds blow him far away.' },
    { title: 'A hilly island', body: 'Theo lands on a hilly island. A grumpy one-eyed giant lives here.' },
    { title: 'The hungry giant', body: 'Theo breaks his loaf in two and gives the giant half. The giant smiles and gives him soft wool.' },
    { title: 'The orchard', body: 'On the next island the fruit is sweet and the air is warm. Theo feels sleepy...' },
    { title: 'Wake up!', body: 'A bee buzzes Theo awake. He picks some fruit and runs back to the boat.' },
    { title: 'The singing seals', body: 'Seals sing on the rocks. Their song makes sailors forget home.' },
    { title: 'Wool in his ears', body: 'Theo pushes the giant\u2019s wool into his ears and sails past.' },
    { title: 'The strait', body: 'The sea gets narrow. Ahead, the water swirls.' },
    { title: 'The whirlpool', body: 'The boat spins round! Theo throws fruit to the octopus, and she pulls him free.' },
    { title: 'Night', body: 'Night comes, and the waves grow tall.' },
    { title: 'The storm', body: 'The mast snaps! The dolphins he saved push his boat through the dark.' },
    { title: 'A beach', body: 'At dawn the boat reaches a beach.' },
    { title: 'This rock, this tree', body: 'Theo knows this rock and this tree. It is his own island!' },
    { title: 'The road home', body: 'Theo runs up the road to his white house.' },
    { title: 'Home', body: 'His dog races to meet him. Mum and Dad kept the lamp burning all night. And the bread is home too!' }
  ].map((p, i) => Object.assign(p, { layout: 'popup', build: at(i) }));
})();
