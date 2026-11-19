// HOW A LIGHTHOUSE WORKS: nonfiction in coloured pencil. Picture on one page,
// text on the other. Each picture is finished from the first frame; a tap
// plays one small motion that shows the page's fact (assets/js/scenes.js).
// Facts kept general (no exact ranges or dates).
(function () {
  'use strict';
  const S = () => window.LIGHTHOUSE_SCENES;
  window.BOOK_PAGES = [
    { title: 'Night is coming', build: () => S().dusk(),
      body: 'As night falls, the lighthouse lamp comes on. It tells every ship: rocks here, keep away!' },
    { title: 'Up the tower', build: () => S().cutaway(),
      body: 'The lamp sits at the top of a tall tower, so ships far away can see it over the curve of the Earth.' },
    { title: 'The big lens', build: () => S().lens(),
      body: 'Around the small lamp, rings of glass prisms bend its light into one strong beam.' },
    { title: 'Every light is different', build: () => S().codes(),
      body: 'Each lighthouse flashes its own pattern, so sailors know which one they see.' },
    { title: 'Hidden rocks', build: () => S().tides(),
      body: 'The Moon pulls the sea in and out: the tides. At low tide hidden rocks appear, the rocks the light warns about.' },
    { title: 'Waves', build: () => S().waves(),
      body: 'Wind makes waves. Near the rocks they grow tall and crash, so lighthouses are built of strong stone.' },
    { title: 'Fog', build: () => S().fog(),
      body: 'In thick fog the light is hard to see, so many lighthouses had a foghorn to sound a warning.' },
    { title: 'Finding the way', build: () => S().chart(),
      body: 'On board, sailors match the flashes they see with their chart and compass to find their way.' },
    { title: 'Morning', build: () => S().dawn(),
      body: 'At dawn the lamp goes off and the ships are safe. Today most lights switch on and off by themselves.' }
  ];
})();
