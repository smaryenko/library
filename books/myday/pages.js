// MY DAY: the page roster. One live 3D toy town (assets/js/scene.js,
// window.BOOK_SCENE). Every animation is its own page (story steps, as
// books/longway): `stop` names the stop in assets/js/world.js, `step` is
// 'arrive' (the camera flies there and the boy walks to it) or 'act' (the
// stop's routine). Turning to a page plays its step; back plays it in reverse.
// Told by the boy, in the first person ("I").
(function () {
  'use strict';
  window.BOOK_LAYOUT = 'popup';
  window.BOOK_PRERENDER = false;     // the scene builds and warms up on its own
  const A = (stop, title, body) => ({ stop, step: 'arrive', title, body });
  const P = (stop, title, body) => ({ stop, step: 'act', title, body });
  window.BOOK_PAGES = [
    A('wake', 'Good morning', 'The sun is coming up. I am still asleep.'),
    P('wake', 'Wake up', 'I open my eyes. I yawn and stretch.'),
    A('wash', 'To the bathroom', 'I go to the bathroom sink.'),
    P('wash', 'Wash and brush', 'I wash my face. I brush my teeth, round and round.'),
    A('dress', 'The wardrobe', 'I go back to my room, to the wardrobe.'),
    P('dress', 'Get dressed', 'On goes my T-shirt. I hop into my trousers and shoes.'),
    A('breakfast', 'To the kitchen', 'I go to the kitchen and sit at the table.'),
    P('breakfast', 'Breakfast', 'I eat my cereal with a big spoon. Yum.'),
    A('walk', 'Off to school', 'I walk to school. At the crossing I stop.'),
    P('walk', 'Look both ways', 'I look right. I look left. I look right again.'),
    A('cross', 'Across the road', 'The road is clear, so I cross.'),
    P('cross', 'Thank you', 'I wave to the car. It drives on.'),
    A('class', 'At school', 'I go into my classroom and sit at my desk.'),
    P('class', 'In class', 'I know the answer! I put my hand up high.'),
    P('lunch', 'Lunch', 'It is lunch time. I eat my sandwich. My friends eat too.'),
    A('playground', 'The playground', 'After school I run to the swings.'),
    P('playground', 'Swinging', 'I swing on the swing. Higher and higher!'),
    A('home', 'Home again', 'I walk home and sit on the rug.'),
    P('home', 'Building blocks', 'I build a tall tower with my blocks.'),
    A('dinner', 'Dinner time', 'I sit at the table. Outside, the sun goes down.'),
    P('dinner', 'Dinner', 'I eat my dinner, every bite.'),
    A('bath', 'Bath time', 'I get into the warm bath.'),
    P('bath', 'Splash', 'Splash! I play with the bubbles and my duck.'),
    A('story', 'Into bed', 'I put on my pajamas and get into bed.'),
    P('story', 'Bedtime story', 'I read a story. I turn the pages one by one.'),
    A('sleep', 'Lie down', 'I lie down and snuggle in.'),
    P('sleep', 'Good night', 'Light off. The stars come out. Good night.')
  ];
})();
