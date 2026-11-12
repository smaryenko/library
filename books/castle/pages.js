// POP-UP CASTLE — the page roster (pop-up layout, photo cut-outs).
//
// Pilot: ONE spread, built the real pop-up way (books/castle/assets/js/popup.js):
// a printed ground on the paper plus separate die-cut photo pieces standing
// on it at different depths. More spreads follow once this one looks right.
// Story: on the day of the Great Fair, Tom the apprentice and his dog Pip
// carry the mended banner across Harbourtown up to the castle.
(function () {
  'use strict';
  window.BOOK_LAYOUT = 'popup';
  window.BOOK_PAGES = [
    { title: 'Harbourtown',
      body: 'wakes up early. Today is the Great Fair, and the road winds all the way up to the castle.',
      ground: () => groundHarbourtown(),
      build: () => buildHarbourtownPopup() }
  ];
})();
