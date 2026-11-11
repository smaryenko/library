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

  // Prerender the NEXT page only: whenever a page appears, the next page's
  // picture is mounted for real in a hidden full-size warm-up stage behind
  // the backdrop. The browser downloads, decodes and paints its photo there
  // (clip + drop shadow, once per layer), so the turn doesn't stall on it.
  // No engine edits: a MutationObserver spots the new picture and reads its
  // data-train key to know which page is showing.
  const keyOf = svg => (svg.match(/data-train="([^"]+)"/) || [])[1];
  const keys = window.BOOK_PAGES.map(p => keyOf(p.build()));
  const warm = document.createElement('div');
  warm.setAttribute('aria-hidden', 'true');
  warm.style.cssText = 'position:fixed;left:26vw;top:20vh;width:48vw;aspect-ratio:1560/1060;' +
    'z-index:0;opacity:.01;pointer-events:none;';
  let warmKey = null;
  function warmUp(i) {
    const page = window.BOOK_PAGES[i];
    if (!page || keys[i] === warmKey || typeof window.mountObject !== 'function') return;
    warmKey = keys[i];
    if (!warm.isConnected) document.body.appendChild(warm);
    warm.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'obj-host';
    host.style.cssText = 'position:absolute;inset:0;';
    warm.appendChild(host);
    window.mountObject(host, page.build());
  }
  let shownKey = null;
  function onChange() {
    const el = document.querySelector('.obj-host:not(#trainsWarm *) svg[data-train]');
    const k = el && !warm.contains(el) ? el.getAttribute('data-train') : null;
    if (!k || k === shownKey) return;
    shownKey = k;
    const i = keys.indexOf(k);
    if (i >= 0) setTimeout(() => warmUp(i + 1), 300);   // after the flip settles
  }
  warm.id = 'trainsWarm';
  new MutationObserver(onChange).observe(document.documentElement, { childList: true, subtree: true });
})();
