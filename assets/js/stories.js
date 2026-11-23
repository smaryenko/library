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
    category: 'fiction',  // shelf-card corner label: 'fiction' | 'non-fiction' | 'puzzle'
    title: 'Christmas Storybook',
    blurb: 'Meet Santa, a merry elf, and nine reindeer on a snowy night!',
    cover: 'books/xmas/cover.svg',
    favicon: 'books/xmas/favicon.svg',
    og: 'books/xmas/og.png',
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
    og: 'books/race/og.png',
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
    og: 'books/reef/og.png',
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
  },
  {
    id: 'city',
    category: 'fiction',
    title: 'Up, Up Over Harbor City',
    blurb: 'Skipper the seagull flies round a busy 3D city looking for a job of his own.',
    cover: 'books/city/cover.svg',
    favicon: 'books/city/favicon.svg',
    url: 'books/city/',
    accent: '#ffd27a',
    theme: '#2f6f8c',
    hint: 'Tap the city to make it move \u00b7 tap the edges or swipe to turn \u00b7 Space/Enter to play',
    backdrop: 'mountCity' // books/city/assets/js/backdrop.js (three.js scene, no music yet)
  },
  {
    id: 'daynight',
    category: 'fiction',
    title: 'Bunny Day, Owl Night',
    blurb: 'Two stories in one: Owl gets a birthday surprise ready by night, Bunny follows the clues by day!',
    cover: 'books/daynight/cover.png',
    og: 'books/daynight/og.png',
    favicon: 'books/daynight/favicon.svg',
    url: 'books/daynight/',
    accent: '#ffd98a',
    theme: '#1c2a4a',
    hint: 'Drag the line to the moon or the sun \u00b7 tap the edges or swipe to turn',
    backdrop: 'mountDayNight' // books/daynight/assets/js/backdrop.js (no music yet)
  },
  {
    id: 'upwego',
    category: 'non-fiction',
    title: 'Up We Go',
    blurb: 'Rockets, astronauts, the Moon and Mars, all stitched in thread. Tap to make them move!',
    cover: 'books/upwego/cover.svg',
    favicon: 'books/upwego/favicon.svg',
    og: 'books/upwego/og.png',
    url: 'books/upwego/',
    accent: '#f4e3a6',
    theme: '#1b2440',
    hint: 'Tap the hoop to make it move \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountUpWeGo' // books/upwego/assets/js/backdrop.js (no music yet)
  },
  {
    id: 'athome',
    category: 'non-fiction',
    title: 'How Things Work at Home',
    blurb: 'A lump of clay becomes a kettle, a toaster, a fridge... and shows how each one works!',
    cover: 'books/athome/cover.svg',
    favicon: 'books/athome/favicon.svg',
    og: 'books/athome/og.png',
    url: 'books/athome/',
    accent: '#ffb38a',
    theme: '#efe6d6',
    hint: 'Tap the clay to make it work \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountAtHome' // books/athome/assets/js/backdrop.js (no music yet)
  },
  {
    id: 'longway',
    category: 'fiction',
    title: 'The Long Way Home',
    blurb: 'Sail with Theo through a world of toy cubes: dolphins, a giant, singing seals and a big storm!',
    cover: 'books/longway/cover.svg',
    favicon: 'books/longway/favicon.svg',
    og: 'books/longway/og.png',
    url: 'books/longway/',
    accent: '#9fd0f5',
    theme: '#e4ded3',
    hint: 'Tap or press Space to turn the page \u00b7 arrows go forward and back \u00b7 swipe to turn',
    backdrop: 'mountLongway' // books/longway/assets/js/backdrop.js (three.js world, no music yet)
  },
  {
    id: 'lighthouse',
    category: 'non-fiction',
    title: 'How a Lighthouse Works',
    blurb: 'Climb the tower, light the big lens and see how ships find their way home!',
    cover: 'books/lighthouse/cover.svg',
    favicon: 'books/lighthouse/favicon.svg',
    og: 'books/lighthouse/og.png',
    url: 'books/lighthouse/',
    accent: '#ffd87a',
    theme: '#2a201a',
    hint: 'Tap the picture to make it move \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountLighthouse' // books/lighthouse/assets/js/backdrop.js (no music yet)
  },
  {
    id: 'rain',
    category: 'non-fiction',
    title: 'Where Does Rain Come From?',
    blurb: 'Puddles, clouds, rainbows and snow, drawn in crayon by a curious kid!',
    cover: 'books/rain/cover.svg',
    favicon: 'books/rain/favicon.svg',
    og: 'books/rain/og.png',
    url: 'books/rain/',
    accent: '#7cc4ff',
    theme: '#a9cfe6',
    hint: 'Tap the picture to make it move \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountRain' // books/rain/assets/js/backdrop.js (no music yet)
  },
  {
    id: 'spellbook',
    category: 'puzzle',
    title: "The Little Wizard's Lost Spellbook",
    blurb: 'Pip the cat knocked the spellbook out of the window! Solve a puzzle on every page to win back its gold pages and cast the first big spell.',
    cover: 'books/spellbook/cover.svg',
    favicon: 'books/spellbook/favicon.svg',
    og: 'books/spellbook/og.png',
    url: 'books/spellbook/',
    accent: '#f7dd86',
    theme: '#2a1b52',
    hint: 'Solve the puzzle on each page to unlock the next one \u00b7 tap the picture to see the magic',
    backdrop: 'mountSpellbook' // books/spellbook/assets/js/backdrop.js (puzzles: assets/js/minigame.js)
  },
  {
    id: 'toyshop',
    category: 'fiction',
    title: 'The Toy Shop After Midnight',
    blurb: 'At midnight the toys wake up! Shrink to toy size, fix the broken music box and choose your own way. Sixteen endings to find.',
    cover: 'books/toyshop/cover.svg',
    favicon: 'books/toyshop/favicon.svg',
    og: 'books/toyshop/og.png',
    url: 'books/toyshop/',
    accent: '#e6b84c',
    theme: '#3a2216',
    hint: 'Pick a choice to decide where the story goes \u00b7 tap the picture to see the magic',
    backdrop: 'mountToyshop' // books/toyshop/assets/js/backdrop.js (branching: assets/js/minigame.js)
  },
  {
    id: 'numberland',
    category: 'puzzle',
    title: 'Number Cube Land',
    blurb: 'Wake up little One and walk with the number friends: solve puzzles to rebuild the Rainbow Gate!',
    cover: 'books/numberland/cover.svg',
    favicon: 'books/numberland/favicon.svg',
    og: 'books/numberland/og.png',
    url: 'books/numberland/',
    accent: '#ff8a8f',
    theme: '#dff2fd',
    hint: 'Solve the puzzle under the picture to go on \u00b7 arrows go forward and back',
    backdrop: 'mountNumberland' // books/numberland/assets/js/backdrop.js (three.js world + minigame.js)
  },
  {
    id: 'anthill',
    category: 'fiction',
    title: 'The Ant and the Crumb',
    blurb: 'A little clay ant carries a bread crumb all the way down through her anthill, past the queen!',
    cover: 'books/anthill/cover.svg',
    favicon: 'books/anthill/favicon.svg',
    og: 'books/anthill/og.png',
    url: 'books/anthill/',
    accent: '#f2c98a',
    theme: '#e9dcc2',
    hint: 'Tap the picture to see what happens \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountAnthill' // books/anthill/assets/js/backdrop.js (clay SDF, no music yet)
  },
  {
    id: 'wherecat',
    category: 'non-fiction',
    title: 'Where Is the Cat?',
    blurb: 'In, on, under, behind: a wooden cat and a blue box show little words, one tap at a time!',
    cover: 'books/wherecat/cover.svg',
    favicon: 'books/wherecat/favicon.svg',
    og: 'books/wherecat/og.png',
    url: 'books/wherecat/',
    accent: '#ff9a8a',
    theme: '#3a2616',
    hint: 'Tap the picture to make the cat move \u00b7 tap the right half \u2192 next \u00b7 left half \u2192 back \u00b7 swipe to turn',
    backdrop: 'mountWherecat' // books/wherecat/assets/js/backdrop.js
  },
  {
    id: 'myday',
    category: 'non-fiction',
    title: 'My Day',
    blurb: 'Wake up, brush, school, swings, bath and bed: follow a boy through his whole day in a little 3D town!',
    cover: 'books/myday/cover.svg',
    favicon: 'books/myday/favicon.svg',
    og: 'books/myday/og.png',
    url: 'books/myday/',
    accent: '#ffd98a',
    theme: '#3d6f9e',
    hint: 'Every animation is a page \u00b7 tap or Space to go on (or skip to the end) \u00b7 swipe or arrows to turn',
    backdrop: 'mountMyDay' // books/myday/assets/js/backdrop.js (three.js town, no music yet)
  }
];
