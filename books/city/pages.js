// HARBOR CITY: the page roster. One live 3D pop-up city (assets/js/scene.js,
// window.BOOK_SCENE); each page is a camera stop. `stop` names the stop in
// assets/js/world.js. No leaf flip: the camera flies between stops.
(function () {
  'use strict';
  window.BOOK_LAYOUT = 'popup';
  window.BOOK_PRERENDER = false;     // the scene builds and warms up on its own
  window.BOOK_PAGES = [
    { stop: 'overview', title: 'Harbor City',
      body: 'wakes up by the sea. Ships, cranes, trucks and planes are all getting to work.' },
    { stop: 'cruise', title: 'The cruise ship',
      body: 'is too big to park by itself. A little tugboat gives it a push, and the ship says hello with its horn.' },
    { stop: 'freight', title: 'The container crane',
      body: 'lifts a heavy box off the freight ship and puts it down on the quay. One down, hundreds to go!' },
    { stop: 'tanker', title: 'The oil tanker',
      body: 'has filled up at the jetty. The hoses come off and it heads out to sea.' },
    { stop: 'exdoz', title: 'The excavator and the bulldozer',
      body: 'dig and push. The excavator scoops the soil, the bulldozer flattens the pile.' },
    { stop: 'bhdump', title: 'The backhoe and the dump truck',
      body: 'work together. Scoop, scoop, into the truck, then the truck tips its load.' },
    { stop: 'mixroll', title: 'The cement mixer and the road roller',
      body: 'build something new. The drum spins and pours, the roller makes a smooth, shiny road.' },
    { stop: 'fire', title: 'Fire on the dock!',
      body: 'The fire truck raises its ladder, and the fireboat sprays from the water. Whoosh, the fire is out.' },
    { stop: 'police', title: 'The police car and the tow truck',
      body: 'help a car that broke down. The tow truck lifts it up and takes it to be fixed.' },
    { stop: 'hospital', title: 'The ambulance and the helicopter',
      body: 'hurry to the hospital. One lands on the roof, the other stops at the door.' },
    { stop: 'bus', title: 'The red bus and the taxi',
      body: 'take people where they need to go. The bus picks up riders, the taxi takes a traveller to the airport.' },
    { stop: 'race', title: 'Race day!',
      body: 'Five red lights... and go! Two bikes, a Formula 1 car and a racing car zoom round the track.' },
    { stop: 'jet', title: 'The passenger jet',
      body: 'is pushed back, rolls to the runway, and takes off over the harbor.' },
    { stop: 'cargo', title: 'The cargo plane',
      body: 'opens its nose wide to swallow the boxes. The airport fire truck gives it a water salute.' },
    { stop: 'evening', title: 'Good night, Harbor City',
      body: 'The lights come on, the work is done, and the whole city sparkles in the dark.' }
  ];
})();
