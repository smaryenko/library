// HARBOR CITY: the page roster. One live 3D pop-up city (assets/js/scene.js,
// window.BOOK_SCENE); each page is a camera stop. `stop` names the stop in
// assets/js/world.js. No leaf flip: the camera flies between stops.
(function () {
  'use strict';
  window.BOOK_LAYOUT = 'popup';
  window.BOOK_PRERENDER = false;     // the scene builds and warms up on its own
  window.BOOK_PAGES = [
    // Fiction: Skipper, a small seagull in a captain's cap, flies round
    // the city asking each machine what it does. The machines' actions match
    // the stop animations in world.js; Skipper is drawn in world.js and hovers at every stop.
    { stop: 'overview', title: 'Harbor City',
      body: 'wakes up by the sea, and so does Skipper the seagull. "Everyone here has a job," he says. "Today I will find my job!"' },
    { stop: 'cruise', title: 'The cruise ship',
      body: 'is too big to park by itself. "Can I push?" asks Skipper. The little tugboat laughs and pushes, and the ship toots hello.' },
    { stop: 'freight', title: 'The container crane',
      body: 'lifts a heavy box off the freight ship. Skipper tries to lift one too. It will not budge. "One down, hundreds to go!" hums the crane.' },
    { stop: 'tanker', title: 'The oil tanker',
      body: 'is full and ready to go. Skipper waves his wing as the hoses come off. "Good luck at sea!" he calls after it.' },
    { stop: 'exdoz', title: 'The excavator and the bulldozer',
      body: 'dig and push. Skipper digs with his beak and gets a mouthful of mud. "Digging is not my job," he sputters.' },
    { stop: 'bhdump', title: 'The backhoe and the dump truck',
      body: 'work together. Scoop, scoop, into the truck, then the truck tips its load. "Teamwork!" they rumble. Skipper thinks about that.' },
    { stop: 'mixroll', title: 'The cement mixer and the road roller',
      body: 'make a new road. The drum spins, the roller rolls. Skipper lands on the wet road by mistake, and now it has tiny footprints forever.' },
    { stop: 'fire', title: 'Fire on the dock!',
      body: 'Skipper sees the smoke first and squawks as loud as he can. The fire truck raises its ladder, the fireboat sprays. Whoosh, the fire is out!' },
    { stop: 'police', title: 'The police car and the tow truck',
      body: 'help a car that broke down. "Thank you for the warning at the dock, Skipper," says the police car. Skipper puffs up his chest.' },
    { stop: 'hospital', title: 'The ambulance and the helicopter',
      body: 'hurry to the hospital. Skipper flies beside the helicopter and shows it the roof. One lands up top, the other stops at the door.' },
    { stop: 'bus', title: 'The red bus and the taxi',
      body: 'take people where they need to go. Skipper rides on the bus roof, then follows the taxi all the way to the airport.' },
    { stop: 'race', title: 'Race day!',
      body: 'Five red lights... and go! Two bikes, a Formula 1 car and a racing car zoom round the track. Skipper races them from the sky, and wins.' },
    { stop: 'jet', title: 'The passenger jet',
      body: 'rolls to the runway. "Watch out, little bird!" Skipper flies clear just in time, and the jet takes off over the harbor.' },
    { stop: 'cargo', title: 'The cargo plane',
      body: 'opens its nose wide to swallow the boxes. The airport fire truck sprays a water salute, and Skipper has a splashy bath.' },
    { stop: 'evening', title: 'Good night, Harbor City',
      body: 'The lights come on. Skipper knows his job now: he watches over the whole city from the sky. Good night, Skipper.' }
  ];
})();
