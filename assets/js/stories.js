// Story shelf manifest — the list of books the landing page renders as cards.
//
// This is the single source of truth for "which books exist". The shelf
// (shelf.js) reads it to build the card grid; each book's page reads its own
// entry for title / favicon / og / theme / backdrop / track.
//
// Each book is a folder under books/<id>/ with everything it needs inside
// (page roster, backdrop, character art, favicon, og image, cover, audio).
// The engine (storybook.js + pseudo3d-object.js) and the generic music player
// (music.js) are shared and content-agnostic — adding a book should not touch
// them. See skills/book-authoring.md.
//
// PATHS: cover / favicon / og / url / track are written relative to the SHELF
// ROOT (where index.html lives), so the shelf cards resolve them directly. The
// book page lives two levels deeper at books/<id>/, so boot.js rewrites the
// `track` with a ../../ prefix before handing it to the music player. Keep
// these paths shelf-root-relative.

window.STORIES = [
  {
    id: 'xmas',
    category: 'fiction',  // shelf-card corner label: 'fiction' | 'non-fiction'
    title: 'Christmas Storybook',
    blurb: 'Meet Santa, a merry elf, and nine reindeer on a snowy night!',
    cover: 'books/xmas/cover.svg',
    favicon: 'books/xmas/favicon.svg',
    og: 'books/xmas/og.svg',
    url: 'books/xmas/',   // short link: the folder's index.html serves the book
    accent: '#ffd36e',   // shelf-card title colour
    theme: '#0a1b3a',
    backdrop: 'mountWinter', // name of the backdrop fn (books/xmas/assets/js/backdrop.js)
    track: 'books/xmas/assets/audio/carol_of_the_bells.mp3'
  },
  {
    id: 'race',
    category: 'fiction',
    title: 'Race Day',
    blurb: 'Four toy cars zoom and chase around the living room!',
    cover: 'books/race/cover.svg',
    favicon: 'books/race/favicon.svg',
    og: 'books/race/og.svg',
    url: 'books/race/',
    accent: '#ff9a6a',   // shelf-card title colour
    theme: '#f2f0ea',
    backdrop: 'mountLivingRoom', // books/race/assets/js/backdrop.js
    track: 'books/race/assets/audio/racing.mp3'
  },
  {
    id: 'reef',
    category: 'fiction',
    title: 'A Day on the Reef',
    blurb: 'A clownfish chases a runaway shell and meets the whole reef!',
    cover: 'books/reef/cover.svg',
    favicon: 'books/reef/favicon.svg',
    og: 'books/reef/og.svg',
    url: 'books/reef/',
    accent: '#7fe3dc',   // shelf-card title colour
    theme: '#06384f',
    backdrop: 'mountReef', // books/reef/assets/js/backdrop.js
    track: 'books/reef/assets/audio/seaside.mp3'
  },
  {
    id: 'space',
    category: 'non-fiction',
    title: 'Our Solar System',
    blurb: 'Spin the Sun, the planets and Pluto, and tap each one to see it up close!',
    cover: 'books/space/cover.png',
    favicon: 'books/space/favicon.svg',
    og: 'books/space/og.png',
    url: 'books/space/',
    accent: '#ffd36e',
    theme: '#060914',
    hint: 'Tap a planet to zoom in, tap again to return \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountSpace', // books/space/assets/js/backdrop.js
    track: 'books/space/assets/audio/deep_space.mp3'
  },
  {
    id: 'trains',
    category: 'non-fiction',
    title: 'Trains Through Time',
    blurb: 'From horse trams to floating maglevs: tap each real train to bring it to life!',
    cover: 'books/trains/cover.png',
    favicon: 'books/trains/favicon.svg',
    og: 'books/trains/og.png',
    url: 'books/trains/',
    accent: '#ffb36b',
    theme: '#2d3b55',
    hint: 'Tap a train to bring it to life \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountTrains', // books/trains/assets/js/backdrop.js
    track: 'books/trains/assets/audio/train.mp3'
  },
  {
    id: 'dino',
    category: 'non-fiction',
    title: 'Dinosaurs',
    blurb: 'Meet real dinosaurs and see how big they were next to you!',
    cover: 'books/dino/cover.svg',
    favicon: 'books/dino/favicon.svg',
    og: 'books/dino/og.png',
    url: 'books/dino/',
    accent: '#ffcf7a',
    theme: '#e8d5ab',
    backdrop: 'mountDino', // books/dino/assets/js/backdrop.js
    track: 'books/dino/assets/audio/jurassic_park.mp3'
  },
  {
    id: 'seasons',
    category: 'fiction',
    title: 'A Fox\u2019s Year',
    blurb: 'Follow a red fox through spring, summer, autumn and winter!',
    cover: 'books/seasons/cover.svg',
    favicon: 'books/seasons/favicon.svg',
    og: 'books/seasons/og.png',
    url: 'books/seasons/',
    accent: '#ffb46a',
    theme: '#4a3a22',
    backdrop: 'mountSeasons', // books/seasons/assets/js/backdrop.js
    track: 'books/seasons/assets/audio/cello_concerto.mp3'
    // no track yet: add a public-domain / original loop under assets/audio/
  }
];
