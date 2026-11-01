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
    title: 'Christmas Storybook',
    blurb: 'Meet Santa, a merry elf, and nine reindeer on a snowy night!',
    cover: 'books/xmas/cover.svg',
    favicon: 'books/xmas/favicon.svg',
    og: 'books/xmas/og.svg',
    url: 'books/xmas/',   // short link: the folder's index.html serves the book
    theme: '#0a1b3a',
    backdrop: 'mountWinter', // name of the backdrop fn (books/xmas/assets/js/backdrop.js)
    track: 'books/xmas/assets/audio/carol_of_the_bells.mp3'
  }
  // Add more books here as they are authored. Keep xmas first for now.
];
