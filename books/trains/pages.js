// TRAINS THROUGH TIME — the page roster.
//
// Intro clock, fourteen real trains (photo cut-outs, oldest to newest), and a
// toy-train ending: 16 spreads. Builders live in assets/js/scenes*.js.
// The next page's photo is prerendered by the shared engine (storybook.js),
// opted in below so big photos are decoded before the turn.
(function () {
  'use strict';
  const T = window.TRAINS;
  window.BOOK_PRERENDER = true;
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

})();
