// NUMBER CUBE LAND: a puzzle journey (ages 6-10). One continuous three.js
// world (assets/js/world.js, kind 'numberland'): each page is a stop, the
// page turn is the walk to the next stop. Every page has a puzzle in the
// panel under the caption (assets/js/tasks.js, kit assets/js/minigame.js);
// next is locked until it is solved, then the world plays the result.
(function () {
  'use strict';
  const at = i => () => window.WEBGL_STAGE.placeholder('numberland', i);
  const task = id => (seed, ctx) => window.NUMBERLAND_TASKS[id](seed, ctx);
  window.BOOK_PRERENDER = false;   // the WebGL placeholder must mount only when shown
  window.BOOK_PAGES = [
    { title: 'Wake up, One!', body: 'A big wind blew the Rainbow Gate apart, and little One is still asleep in the valley.' },
    { title: 'The river', body: 'Two, Three, Four and Five wait at a river with no bridge.' },
    { title: 'The low door', body: 'Six is too tall for the little door in the hedge.' },
    { title: 'The shadow wall', body: 'Someone is hiding behind the big white sheet.' },
    { title: 'The garden', body: 'Twelve wants to lie in the empty flower bed.' },
    { title: 'The seesaw', body: 'The seesaw is stuck down on one side.' },
    { title: 'Stepping stones', body: 'Only some stones are safe to hop on.' },
    { title: 'The cube yard', body: 'The gate needs a full row of ten cubes, but some are still lost.' },
    { title: 'The square pond', body: 'Only square friends can stand on the lily pads.' },
    { title: 'The glow cave', body: 'Rows of crystal cubes sleep in the dark cave. Count them to wake them up!' },
    { title: 'Mirror lake', body: 'The magic lake wants a twin for the cube tower.' },
    { title: 'Staircase hill', body: 'The friends build a staircase up the hill, but one step is missing.' },
    { title: 'The odd camp', body: 'At the camp, everyone makes pairs.' },
    { title: 'The Rainbow Gate', body: 'Here is the gate! Every friend has a place in it.' }
  ].map((p, i) => Object.assign(p, { id: 'n' + (i + 1), layout: 'popup', build: at(i), task: task('n' + (i + 1)) }));
  // the end: the same stop as the gate (no walk), no puzzle
  window.BOOK_PAGES.push({ id: 'end', layout: 'popup', build: at(13), title: 'The gate shines again',
    body: 'Every friend jumps into place and the Rainbow Gate glows in all its colours. Well done, number friends! The end.' });

  // landscape: caption + puzzle in a column on the right, so the stop stays
  // in view (world.js frames the scene in the space to its left)
  document.head.insertAdjacentHTML('beforeend', `<style>
    @media (min-aspect-ratio: 1/1) {
      .book-scene3d .obj-slot.is-caption{left:auto!important;right:16px!important;top:auto!important;bottom:84px!important;
        transform:none!important;width:min(400px,36vw)!important}
      .book-scene3d .obj-slot.is-caption .text-block{max-height:calc(100vh - 110px);overflow:auto;pointer-events:auto}
      .book-scene3d .mg-panel{max-width:none;font-size:clamp(12px,1.2vw,16px)}
      .book-scene3d .mg-art svg{max-height:20vh}
    }
    @media (max-aspect-ratio: 1/1) {
      .book-scene3d .mg-panel{font-size:clamp(11px,3vw,14px)}
      .book-scene3d .mg-art svg{max-height:13vh}
      .book-scene3d .mg-opt svg{max-height:8vh}
    }
  </style>`);
})();
