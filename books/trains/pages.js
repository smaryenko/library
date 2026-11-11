// TRAINS THROUGH TIME — the page roster.
//
// Intro clock, fourteen real trains (photo cut-outs, oldest to newest), and a
// toy-train ending: 16 spreads. Builders live in assets/js/scenes*.js.
(function () {
  'use strict';
  const T = window.TRAINS;
  window.BOOK_PAGES = [
    { title: "Time to Travel", body: "Tick, tock. Let’s ride through time and watch trains grow up.", build: T.clock },
    { title: "Horse Tram", body: "Long ago, before engines, a horse pulled the car along iron rails.", build: T.horse },
    { title: "The Rocket", body: "Then came steam! In 1829 the Rocket pulled a train with no horse at all.", build: T.rocket },
    { title: "Jupiter", body: "Steam engines grew bigger. Jupiter rang its bell as rails crossed America.", build: T.jupiter },
    { title: "Mail Car", body: "Soon trains carried more than people: letters were sorted on the way.", build: T.mail },
    { title: "Logging Engine", body: "Steam engines worked hard in the forests too, hauling heavy logs up steep hills.", build: T.alberni },
    { title: "Mallard", body: "Steam got sleek and fast. Mallard set a record: 126 miles an hour!", build: T.mallard },
    { title: "Diesel", body: "Then diesel engines took over: no coal, no smoke puffs, just a loud honk.", build: T.diesel },
    { title: "Electric", body: "Next, electricity! These trains take their power from a wire up high.", build: T.electric },
    { title: "Shinkansen", body: "Electric trains got faster still. Japan’s bullet trains zoom past the blossoms.", build: T.shinkansen },
    { title: "Underground", body: "Cities filled up, so trains went under the streets, through tunnels.", build: T.underground },
    { title: "Funicular", body: "And up steep hills, with a strong cable pulling the little car.", build: T.funicular },
    { title: "Monorail", body: "Some trains went up above the street, riding on just one beam.", build: T.monorail },
    { title: "Maglev", body: "High tracks got even cleverer: magnets lift this train so it floats and flies.", build: T.maglev },
    { title: "Double-Decker", body: "More riders? Add a floor! Seats upstairs and seats downstairs.", build: T.doubledecker },
    { title: "The Next Train", body: "And the next train? Maybe you’ll build it. Let’s start with this one.", build: T.toy }
  ];

  // Prerender every photo as soon as the book opens, so flipping to a page
  // never waits for its picture. The image list is read from the built pages
  // themselves (every href="img/….jpg"), so new pages are picked up for free.
  // The first page loads first; the rest follow one by one, each fetched and
  // decoded off the main thread. The Image objects are kept so the browser
  // holds them in its memory cache.
  const hrefs = [];
  window.BOOK_PAGES.forEach(p => {
    const svg = p.build();
    (svg.match(/href="img\/[^"]+\.jpg"/g) || []).forEach(m => {
      const h = m.slice(6, -1);
      if (!hrefs.includes(h)) hrefs.push(h);
    });
  });
  const keep = window.TRAINS_PRELOADED = [];
  const load = href => new Promise(done => {
    const img = new Image();
    img.decoding = 'async';
    img.src = href;
    keep.push(img);
    (img.decode ? img.decode() : Promise.resolve()).then(done, done);
  });
  hrefs.reduce((chain, h) => chain.then(() => load(h)), Promise.resolve());
})();
