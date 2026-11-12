// DINOSAURS book — the page roster (14 spreads).
//
// 1   the size ladder (child, Velociraptor, Triceratops, T. rex at one scale);
//     tapping it zooms into the full to-scale line-up — the only zoom.
// 2–12 one animal per spread, each with a child at true scale and its own
//     tap animation (dino.js + animals.js).
// 13  the asteroid; 14 the survivors (scenes.js).
// Long names carry soft hyphens (\u00AD) so the title can break on phones.

(function () {
  'use strict';

  // face the other way: the whole picture is mirrored on its root <svg>, so
  // every layer copy flips while the animations inside stay untouched
  const mirror = svg => svg.replace('<svg ', '<svg style="transform:scaleX(-1)" ');


  window.BOOK_PAGES = [
    { title: 'Dinosaurs',
      bodyHtml: 'lived millions of years ago. Some were small, and some were giants!',
      build: () => buildSizeLadder() },
    { title: 'T. rex',
      bodyHtml: 'Tyrannosaurus rex was as long as a bus, with teeth as big as bananas.',
      build: () => buildTRex() },
    { title: 'Tri\u00ADcera\u00ADtops',
      bodyHtml: 'had three horns, a big bony frill, and weighed as much as two elephants.',
      build: () => mirror(buildTriceratops()) },
    { title: 'Brachio\u00ADsaurus',
      bodyHtml: 'was as tall as a four-storey house, so it could eat leaves from the tops of trees.',
      build: () => mirror(buildBrachiosaurus()) },
    { title: 'Stego\u00ADsaurus',
      bodyHtml: 'had tall plates on its back and sharp spikes on its tail.',
      build: () => buildStegosaurus() },
    { title: 'Veloci\u00ADraptor',
      bodyHtml: 'was only as tall as a turkey, and it was covered in feathers.',
      build: () => mirror(buildVelociraptor()) },
    { title: 'Diplo\u00ADdocus',
      bodyHtml: 'was longer than a tennis court, with a tail it could crack like a whip.',
      build: () => buildDiplodocus() },
    { title: 'Allo\u00ADsaurus',
      bodyHtml: 'was a big hunter that lived millions of years before T. rex.',
      build: () => mirror(buildAllosaurus()) },
    { title: 'Iguan\u00ADodon',
      bodyHtml: 'had a sharp spike on each thumb, and could walk on two legs or four.',
      build: () => buildIguanodon() },
    { title: 'Pachy\u00ADcephalo\u00ADsaurus',
      bodyHtml: 'had a skull with a thick, bony dome on top, like a crash helmet.',
      build: () => buildPachycephalosaurus() },
    { title: 'Pter\u00ADanodon',
      bodyHtml: 'was not a dinosaur but a flying reptile, with wings wider than a car is long.',
      build: () => mirror(buildPteranodon()) },
    { title: 'Plesio\u00ADsaurus',
      bodyHtml: 'was not a dinosaur either. It was a sea reptile that swam with four big flippers.',
      build: () => buildPlesiosaurus() },
    { title: 'The Asteroid',
      bodyHtml: '66 million years ago, a giant space rock hit Earth, and most dinosaurs died out.',
      build: () => buildAsteroid() },
    { title: 'Survivors',
      bodyHtml: 'not all of them disappeared! Birds are living dinosaurs, and crocodiles and turtles are their cousins.',
      build: () => buildSurvivors() }
  ];
})();
