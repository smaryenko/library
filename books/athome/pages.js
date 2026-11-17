// HOW THINGS WORK AT HOME: twelve home machines made of clay. Each page's
// picture is the clay machine (assets/js/clay.js + machines.js); turning
// the page morphs the last machine into the next one. Facts kept simple
// and true (recheck before changing the wording).
(function () {
  'use strict';
  const m = i => () => window.buildClayMachine(i);
  window.BOOK_PAGES = [
    { title: 'The light switch', build: m(0),
      body: 'Flipping the switch closes the circuit, so electricity can flow to the bulb and make it glow.' },
    { title: 'The kettle', build: m(1),
      body: 'A hot coil under the water heats it until it boils. Click! The kettle turns itself off.' },
    { title: 'The coffee machine', build: m(2),
      body: 'Hot water is pushed through ground coffee and carries its taste into the cup.' },
    { title: 'The toaster', build: m(3),
      body: 'Glowing hot wires make heat that turns the bread brown and crunchy. Pop!' },
    { title: 'The fridge', build: m(4),
      body: 'A fridge moves heat from inside to the back, so the food inside stays cold.' },
    { title: 'The washing machine', build: m(5),
      body: 'The drum turns the clothes through soapy water, then spins fast to throw the water out.' },
    { title: 'The hair dryer', build: m(6),
      body: 'A little fan pushes air past hot wires, so warm air blows out of the front.' },
    { title: 'The vacuum cleaner', build: m(7),
      body: 'A fan pulls air in through the hose, and the air drags the dust and crumbs along with it.' },
    { title: 'The air conditioner', build: m(8),
      body: 'It takes heat out of the room air and sends it outside, so the room feels cool.' },
    { title: 'The television', build: m(9),
      body: 'The remote sends invisible light that the television understands.' },
    { title: 'The alarm clock', build: m(10),
      body: 'A small motor or a tiny crystal keeps the clock ticking at a steady beat. Ring! Time to get up.' },
    { title: 'All together', build: m(11),
      body: 'Lots of machines help at home every day. Which one is your favourite?' }
  ];
})();
