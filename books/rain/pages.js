// WHERE DOES RAIN COME FROM?: the water cycle told as a child's own crayon
// drawings and words. Picture on one page, text on the other; the parts
// appear in drawing order, a tap shows the page's science
// (assets/js/scenes.js).
(function () {
  'use strict';
  const S = () => window.RAIN_SCENES;
  window.BOOK_PAGES = [
    { title: 'My puddle', build: () => S().puddle(),
      body: 'After the rain I found a big puddle. SPLASH!' },
    { title: 'Where did it go?', build: () => S().sunny(),
      body: 'The sun came out and my puddle got smaller. The water went up into the air, too tiny to see. It evaporated!' },
    { title: 'Drops on the window', build: () => S().window(),
      body: 'When wet air touches something cold, like my window, it turns back into drops.' },
    { title: 'Clouds', build: () => S().cloud(),
      body: 'High in the sky it is cold too, so the water makes tiny drops. Lots of tiny drops make a cloud.' },
    { title: 'Rain!', build: () => S().rain(),
      body: 'The drops bump together and get big and heavy. Then they fall down. Rain! My puddle is coming back.' },
    { title: 'A rainbow', build: () => S().rainbow(),
      body: 'Then the sun shone behind me, through the falling drops, and made a rainbow!' },
    { title: 'Snow', build: () => S().snow(),
      body: 'In winter the clouds are so cold that the water freezes. It falls as snow. I made a snowman!' },
    { title: 'To the sea', build: () => S().river(),
      body: 'Rain and melted snow run down the hills into rivers, and the rivers run to the sea.' },
    { title: 'Round and round', build: () => S().circle(),
      body: 'The sun warms the sea, the water goes up, and new clouds grow. My puddle goes round and round!' }
  ];
})();
