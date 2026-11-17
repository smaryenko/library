// UP WE GO: a short history of going to space, stitched in a hoop.
// Nonfiction; no named people (user's choice); facts as agreed in
// .kiro/steering/new-book-styles.md. Pictures: assets/js/scenes.js.
(function () {
  'use strict';
  const S = () => window.UPWEGO_SCENES;
  window.BOOK_PAGES = [
    { title: 'Looking up', build: () => S().lookUp(),
      body: 'For thousands of years, people have looked up at the night sky and wondered.' },
    { title: 'The first telescopes', build: () => S().telescope(),
      body: 'About 400 years ago, telescopes showed craters on the Moon and moons around Jupiter.' },
    { title: 'A rocket in the snow', build: () => S().rocket1926(),
      body: 'In 1926 the first rocket burning liquid fuel flew, from a snowy field.' },
    { title: 'Explorer 1', build: () => S().explorer(),
      body: 'In 1958 Explorer 1, the first American satellite, found belts of radiation around Earth.' },
    { title: 'Little capsules', build: () => S().capsule(),
      body: 'In the early 1960s, astronauts rode tiny capsules: first up and down, then around Earth.' },
    { title: 'A walk in space', build: () => S().spacewalk(),
      body: 'In 1965 astronauts began to float outside their spacecraft, tied on by a cord.' },
    { title: 'On the Moon', build: () => S().moonLanding(),
      body: 'On 20 July 1969 two astronauts walked on the Moon while a third circled above.' },
    { title: 'Voyager', build: () => S().voyager(),
      body: 'In 1977 the Voyager probes set off past the giant planets. They are still flying today.' },
    { title: 'The Space Shuttle', build: () => S().shuttle(),
      body: 'In 1981 the Space Shuttle flew for the first time: a spaceship that could fly again.' },
    { title: 'Hubble', build: () => S().hubble(),
      body: 'In 1990 the Hubble telescope went into orbit. It still sends back amazing pictures.' },
    { title: 'A home in space', build: () => S().station(),
      body: 'Since 2000, astronauts from many countries have lived on the space station.' },
    { title: 'Rockets that come back', build: () => S().landing(),
      body: 'In 2015 a rocket booster flew back and landed standing up, so it could fly again.' },
    { title: 'Mars', build: () => S().mars(),
      body: 'Rovers explore Mars. In 2021 a little helicopter flew there for the first time.' },
    { title: 'Webb', build: () => S().webb(),
      body: 'Webb is a giant space telescope. Its gold mirror sees the oldest stars. What will you explore?' }
  ];
})();
