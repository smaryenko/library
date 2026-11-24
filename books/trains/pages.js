// TRAINS THROUGH TIME — the page roster.
//
// Intro clock, 28 real trains (photo cut-outs) in three parts: the history
// of the train (horse to bullet train), what trains carry plus the helpers that
// look after the track, then city and passenger trains; a toy-train ending:
// 30 spreads. Builders live in assets/js/scenes*.js.
// The next page's photo is prerendered by the shared engine (storybook.js),
// opted in below so big photos are decoded before the turn.
(function () {
  'use strict';
  const T = window.TRAINS;
  window.BOOK_PRERENDER = true;
  window.BOOK_PAGES = [
    // PART 1: the story of the train, from horses to electric engines
    { title: "Time to Travel", body: "Tick, tock. Let’s ride through time and watch trains grow up.", build: T.clock },
    { title: "Horse Tram", body: "Long ago, before engines, a horse pulled the tram car along iron rails.", build: T.horse },
    { title: "Steam Locomotive", body: "Then came steam! In 1829 Stephenson’s Rocket pulled a train with no horse at all.", build: T.rocket },
    { title: "American Steam Engine", body: "Steam engines grew bigger. The Jupiter rang its bell as rails crossed America.", build: T.jupiter },
    { title: "Mail Car", body: "Soon trains carried letters too, sorted by hand in a travelling post office.", build: T.mail },
    { title: "Logging Engine", body: "Alberni Pacific No. 2 worked in the forests, hauling heavy logs up steep hills.", build: T.alberni },
    { title: "Rotary Snowplow", body: "Snow piled up on the mountain tracks, so the rotary plow spun its giant red fan and threw it away.", build: T.plow },
    { title: "Streamliner", body: "Steam got sleek and fast. The Mallard set a record: 126 miles an hour!", build: T.mallard },
    { title: "Diesel Locomotive", body: "Then diesel took over: this Rio Grande engine burns no coal, and its horn goes HONK.", build: T.diesel },
    { title: "Electric Locomotive", body: "Next, electricity! The Pennsylvania GG1 took its power from a wire up high.", build: T.electric },
    // PART 2: what trains carry, and the helpers that look after the track
    { title: "Freight Train", body: "Trains carry all kinds of things. Three CN diesels pull a long freight train through the Rocky Mountains.", build: T.freight },
    { title: "Container Train", body: "Union Pacific engines haul big boxes called containers, stacked two high, past fields of flowers.", build: T.container },
    { title: "Car Carrier", body: "Some trains carry cars! This one has two decks full of shiny new cars on their way to the shops.", build: T.carcarrier },
    { title: "Tank Car", body: "Liquids ride in tank cars. This shiny black one is like a giant bottle on wheels.", build: T.tankcar },
    { title: "Work Train", body: "Trains have helpers too. This yellow work train fixes the track and lifts heavy loads with its crane.", build: T.worktrain },
    { title: "Track Layer", body: "Building a brand-new line? The track-laying machine puts down sleepers and rails as it rolls along.", build: T.tracklayer },
    { title: "Railway Crane", body: "Something really heavy? The railway crane swings out its long arm and lifts it with a giant hook.", build: T.crane },
    { title: "Rail Grinder", body: "The rail grinder rubs the rails smooth with spinning stones, and sparks fly!", build: T.grinder },
    { title: "Fire Train", body: "And if there’s trouble in a tunnel, the Swiss fire-and-rescue train rushes in with a big tank of water.", build: T.firetrain },
    // PART 3: trains that carry people in and around cities
    { title: "Double-Decker Train", body: "Now let’s ride with people! So many travel to the city that this Dutch NS train has seats upstairs and down.", build: T.doubledecker },
    { title: "Metro", body: "Cities filled up, so trains went under the streets: London’s Underground runs in tunnels.", build: T.underground },
    { title: "Tram", body: "Back up on the street, trams share the road with cars, like this red-and-cream tram in Prague.", build: T.tram },
    { title: "Light Rail", body: "Light rail trains are like bigger, faster trams. This one rides through Los Angeles.", build: T.lightrail },
    { title: "Tram-Train", body: "A tram-train is two in one: a tram in Kassel’s streets, then a train out to the villages.", build: T.tramtrain },
    { title: "Bullet Train", body: "Between big cities, trains go really fast. Japan’s Shinkansen bullet train zooms past the blossoms.", build: T.shinkansen },
    { title: "Monorail", body: "Some trains ride above the street on just one beam, like the Chongqing monorail.", build: T.monorail },
    { title: "Maglev", body: "Magnets lift the Shanghai Maglev off its track, so it floats to the airport at 431 km an hour!", build: T.maglev },
    { title: "Funicular", body: "And up steep hills: the Kyiv Funicular car is pulled by a strong cable.", build: T.funicular },
    { title: "Rack Railway", body: "Even steeper? The Pilatus train climbs on a toothed rail: the steepest rack railway in the world.", build: T.rack },
    { title: "The Next Train?", body: "Maybe you’ll build it. Let’s start with this wooden Brio train.", build: T.toy }
  ];

})();
