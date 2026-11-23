// WHERE IS THE CAT? Prepositions and opposites with realistic wooden toys.
// Every page is the same walnut table scene (assets/js/scene.js) set up
// differently; the picture index i matches the page's entry in scene.js PAGES.
// Page 1 holds all the prepositions: each tap moves the cat on and scene.js
// swaps the sentence (WHERECAT_PREP[i], same order as scene.js STATIONS) in
// the element marked [data-wherecat-text].
// No names: always "the cat" / "the kitten". The key words are red and bold
// (bodyHtml is trusted static markup; the engine does not escape it).
(function () {
  'use strict';
  const RED = '#c8231e';
  const w = s => '<span style="color:' + RED + ';font-weight:700">' + s + '</span>';
  window.WHERECAT_PREP = [
    'The cat is ' + w('in') + ' the box.',
    'The cat is ' + w('on') + ' the box.',
    'The cat is ' + w('under') + ' the table.',
    'The cat is ' + w('behind') + ' the box.',
    'The cat is ' + w('in front of') + ' the box.',
    'The cat is ' + w('next to') + ' the box.',
    'The cat is ' + w('between') + ' the box and the table.',
    'The cat is ' + w('above') + '. The ball is ' + w('below') + '.',
    'Whoosh! The cat goes ' + w('over') + ' the box.',
    'The cat walks all the way ' + w('around') + ' the box.',
    'The cat goes ' + w('through') + ' the door.',
    'The cat is ' + w('outside') + ' the box.',
    'Now the cat is ' + w('inside') + ' the box.',
    'The cat walks ' + w('up') + ' the ramp.',
    'Whee! The cat slides ' + w('down') + ' again.'
  ];
  const P = [
    ['Where is the cat?', '<span data-wherecat-text="0">' + window.WHERECAT_PREP[0] + '</span>'],
    ['Open and closed', w('Open') + '. ' + w('Closed') + '.'],
    ['Tall and short', 'This tower is ' + w('tall') + '. That one is ' + w('short') + '.'],
    ['Big and small', 'The cat is ' + w('big') + '. The kitten is ' + w('small') + '.'],
    ['Full and empty', 'The basket is ' + w('full') + '. Tip! Now it is ' + w('empty') + '.'],
    ['Near and far', 'The kitten is ' + w('near') + '. The cat is ' + w('far') + '.'],
    ['Asleep and awake', 'The cat is ' + w('asleep') + '\u2026 now he is ' + w('awake') + '!'],
    ['Together', 'The cat and the kitten are ' + w('together') + ', in the box. Goodnight!']
  ];
  window.BOOK_PAGES = P.map(([title, bodyHtml], i) => ({
    title, bodyHtml, build: () => window.buildWhereCat(i)
  }));
})();
