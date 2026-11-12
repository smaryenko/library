// TRAINS THROUGH TIME — the page roster.
//
// Intro clock, fourteen real trains (photo cut-outs, oldest to newest), and a
// toy-train ending: 16 spreads. Builders live in assets/js/scenes*.js.
(function () {
  'use strict';
  const T = window.TRAINS;
  window.BOOK_PAGES = [
    { title: "Time to Travel", body: "Tick, tock. Let’s ride through time and watch trains grow up.", build: T.clock },
    { title: "Horse Tram", body: "Long ago, before engines, a horse pulled the tram car along iron rails.", build: T.horse },
    { title: "Steam Locomotive", body: "Then came steam! In 1829 Stephenson’s Rocket pulled a train with no horse at all.", build: T.rocket },
    { title: "American Steam Engine", body: "Steam engines grew bigger. The Jupiter rang its bell as rails crossed America.", build: T.jupiter },
    { title: "Mail Car", body: "Soon trains carried letters too, sorted by hand in a travelling post office.", build: T.mail },
    { title: "Logging Engine", body: "Alberni Pacific No. 2 worked in the forests, hauling heavy logs up steep hills.", build: T.alberni },
    { title: "Streamliner", body: "Steam got sleek and fast. The Mallard set a record: 126 miles an hour!", build: T.mallard },
    { title: "Diesel Locomotive", body: "Then diesel took over: this Rio Grande engine burns no coal, and its horn goes HONK.", build: T.diesel },
    { title: "Electric Locomotive", body: "Next, electricity! The Pennsylvania GG1 took its power from a wire up high.", build: T.electric },
    { title: "Bullet Train", body: "Electric trains got faster still. Japan’s Shinkansen zooms past the blossoms.", build: T.shinkansen },
    { title: "Metro", body: "Cities filled up, so trains went under the streets: London’s Underground runs in tunnels.", build: T.underground },
    { title: "Funicular", body: "And up steep hills: the Kyiv Funicular car is pulled by a strong cable.", build: T.funicular },
    { title: "Monorail", body: "Some trains ride above the street on just one beam, like the Chongqing monorail.", build: T.monorail },
    { title: "Maglev", body: "High tracks got even cleverer: magnets lift the Shanghai Maglev so it floats and flies.", build: T.maglev },
    { title: "Double-Decker Train", body: "More riders? Add a floor! This Dutch NS train has seats upstairs and down.", build: T.doubledecker },
    { title: "The Next Train?", body: "Maybe you’ll build it. Let’s start with this wooden Brio train.", build: T.toy }
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
