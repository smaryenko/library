// THE LONG WAY HOME: a kids' odyssey in toy building cubes. Theo travels
// LEFT to RIGHT through one continuous world (assets/js/world.js): each page
// is a camera stop, a page turn is the journey on (walk or sail).
// Every page is two steps: its event (tap / Space / next), then the travel.
// Original retelling of public-domain Odyssey motifs; no peril beyond mild.
(function () {
  'use strict';
  const at = i => () => window.WEBGL_STAGE.placeholder('longway', i);
  window.BOOK_PRERENDER = false;   // the WebGL placeholder must mount only when shown
  window.BOOK_PAGES = [
    { title: 'Home by lamp-light', body: 'Theo promised to be home by lamp-light. The baker tosses him a loaf, and off he goes to his little boat.' },
    { title: 'The bag of winds', body: 'The lighthouse keeper gives him a sack. \u201cAll the winds are inside but one. Never open it!\u201d' },
    { title: 'Caught in a net', body: 'A young dolphin is caught in a fishing net. Theo cuts it free, and it leaps away with its family.' },
    { title: 'So close', body: 'Theo can see the lamp of home! He dozes off. A gull pecks the sack open, and the winds blow him far away.' },
    { title: 'The hungry giant', body: 'A grumpy one-eyed giant is hungry. Theo shares his bread, and the giant gives him a handful of soft wool.' },
    { title: 'The sleepy orchard', body: 'The sweet fruit makes everyone sleepy. A bee buzzes Theo awake. He picks some fruit and runs back to the boat.' },
    { title: 'The singing seals', body: 'The seals\u2019 song makes sailors forget home. Theo pushes the giant\u2019s wool into his ears and sails past.' },
    { title: 'The whirlpool', body: 'A whirlpool spins the boat round and round. Theo throws fruit to the octopus, and she pulls him free.' },
    { title: 'The storm', body: 'In the storm the mast snaps. Then the dolphins he saved come and push his broken boat through the dark.' },
    { title: 'This rock, this tree', body: 'At dawn the boat reaches a beach. Theo knows this rock and this tree. It is his own island!' },
    { title: 'Home', body: 'Theo runs up the road. His old dog Argos races down to meet him, just as the lamps come on.' }
  ].map((p, i) => Object.assign(p, { layout: 'popup', build: at(i) }));
})();
