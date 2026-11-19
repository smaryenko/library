// WHERE DOES RAIN COME FROM?: the nine crayon pictures (viewBox 0..300),
// drawn as a child's own drawings with the kit (assets/js/crayon.js). Each
// builder lists its parts in drawing order (they appear one by one) and adds
// its own stepped tap motion that shows the page's science.
(function () {
'use strict';
const K = window.CRAYON;
const { C, PLAY } = K;
const T = PLAY + 's';

const S = {};

// 1 me splashing in a big puddle after the rain; tap: I jump, the drops splash
S.puddle = function () {
  const k = K.page(11);
  k.skyBand('cr-sky', '#7fa8d8');
  k.cloud('cr-cloud', 70, 46, 46, 16, { fill: C.grey, edge: C.greyD });
  k.cloud('cr-cloud', 186, 40, 34, 12, { fill: C.grey, edge: C.greyD });
  k.sun('cr-sun', 262, 46, 20);
  k.grass('cr-grass', 236);
  k.group('cr-water', 'pud', () => { k.scribble('cr-water', k.oval(150, 258, 88, 18, 20), C.water, { a: 0.1, gap: 4 }); k.line('cr-water', k.oval(150, 258, 90, 19, 20), C.blue, { closed: true }); }, 'transform-origin:150px 258px');
  // a tree and a little flower so it is our garden
  k.shape('cr-tree', k.rect(30, 150, 44, 240), C.brown, C.brownD, { a: 1.3, gap: 4 });
  k.shape('cr-tree', k.oval(37, 128, 30, 28), C.green, C.greenD, { a: 0.6, gap: 5 });
  k.group('cr-people', 'me', () => { k.person('cr-people', 150, 168, 74, { dress: C.yellow, hair: C.brownD, arm: 'up', boots: C.red }); k.word('cr-people', 118, 150, 14, 'ME', C.blue); }, 'transform-origin:150px 250px');
  k.group('cr-fx', 'splash', () => { for (const [x, y] of [[96, 244], [110, 232], [190, 232], [206, 244], [124, 224], [178, 222]]) k.drop('cr-fx', x, y, 0.9); }, 'transform-origin:150px 256px');
  k.word('cr-fx', 214, 196, 16, 'SPLASH!', C.red);
  const c = k.cls;
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-cloud', 'cr-grass', 'cr-water', 'cr-tree', 'cr-people', 'cr-fx'],
    reveal: ['cr-people', 'cr-water', 'cr-fx', 'cr-grass', 'cr-tree', 'cr-sky', 'cr-cloud', 'cr-sun'], css: `
    svg.is-playing .${c('me')}{animation:${c('jp')} 0.8s steps(4,end) 3 both}
    svg.is-playing .${c('splash')}{animation:${c('sp')} 0.8s steps(4,end) 3 both}
    @keyframes ${c('jp')}{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
    @keyframes ${c('sp')}{0%,40%{transform:scale(0.6);opacity:0}70%{transform:scale(1.3) translateY(-8px);opacity:1}100%{transform:scale(1.5) translateY(-2px);opacity:0}}` });
};

// 2 the sun warms the puddle and it gets smaller; tap: wavy lines rise (it evaporates)
S.sunny = function () {
  const k = K.page(21);
  k.skyBand('cr-sky', C.sky);
  k.sun('cr-sun', 66, 64, 34);
  k.grass('cr-grass', 236);
  k.group('cr-water', 'pud', () => { k.scribble('cr-water', k.oval(176, 258, 46, 10, 16), C.water, { a: 0.1, gap: 4 }); k.line('cr-water', k.oval(176, 258, 48, 11, 16), C.blue, { closed: true }); }, 'transform-origin:176px 258px');
  // a damp ring where the puddle was
  k.line('cr-water', k.oval(176, 258, 86, 18, 20), C.waterL, { closed: true, w: 2, o: 0.7 });
  for (let i = 0; i < 4; i++) {
    const x = 146 + i * 20;
    k.group('cr-fx', 'up' + i, () => k.line('cr-fx', [[x, 236], [x + 5, 226], [x - 3, 216], [x + 5, 206], [x - 2, 196], [x + 4, 186]], C.waterL, { w: 2.6, amp: 0.5 }), `transform-origin:${x}px 236px`);
  }
  k.person('cr-people', 60, 164, 76, { dress: C.pink, hair: C.brownD, arm: 'out', boots: C.red });
  k.shape('cr-flower', k.rect(250, 196, 262, 244), C.brown, C.brownD, { a: 1.3, gap: 4 });
  for (const [x, y, col] of [[256, 186, C.red], [100, 268, C.purple], [266, 270, C.pink]]) for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; k.dot('cr-flower', x + Math.cos(a) * 5, y + Math.sin(a) * 5, 3.6, col); }
  const c = k.cls;
  const ups = [0, 1, 2, 3].map(i => `svg.is-playing .${c('up' + i)}{animation:${c('ev')} 1.2s steps(6,end) ${(i * 0.3).toFixed(1)}s 2 both}`).join('\n');
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-grass', 'cr-water', 'cr-flower', 'cr-people', 'cr-fx'],
    reveal: ['cr-sun', 'cr-water', 'cr-fx', 'cr-people', 'cr-grass', 'cr-flower', 'cr-sky'], css: `
    ${ups}
    svg.is-playing .${c('pud')}{animation:${c('sh')} ${T} steps(6,end) both}
    @keyframes ${c('ev')}{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-50px);opacity:0}}
    @keyframes ${c('sh')}{0%{transform:scale(1)}60%{transform:scale(0.7)}100%{transform:scale(1)}}` });
};

// 3 a cold window with drops on it; tap: the drops run down
S.window = function () {
  const k = K.page(31);
  // outside: a cold blue night, a bit of snow on the ground
  k.scribble('cr-sky', k.rect(70, 34, 230, 196), '#3a5ab8', { a: -0.2, gap: 4.6, o: 0.8 });
  k.dot('cr-sky', 110, 60, 2.6, C.yellow); k.dot('cr-sky', 140, 90, 2, C.yellow); k.dot('cr-sky', 200, 120, 2.4, C.yellow);
  k.scribble('cr-grass', k.rect(70, 176, 230, 196), C.white, { a: 0.1, gap: 3.6, o: 0.95 });
  // the window frame: thick brown, a cross in the middle
  k.line('cr-house', k.rect(70, 34, 230, 196), C.brown, { closed: true, w: 7 });
  k.line('cr-house', [[150, 34], [150, 196]], C.brown, { w: 6 });
  k.line('cr-house', [[70, 115], [230, 115]], C.brown, { w: 6 });
  // the room inside: wall colour round the window, a sill, a mug with steam
  k.scribble('cr-tree', [[8, 10], [292, 10], [292, 34], [8, 34]], C.wall, { a: 0.3, gap: 6, o: 0.6 });
  k.scribble('cr-tree', [[8, 34], [70, 34], [70, 290], [8, 290]], C.wall, { a: 0.3, gap: 6, o: 0.6 });
  k.scribble('cr-tree', [[230, 34], [292, 34], [292, 290], [230, 290]], C.wall, { a: 0.3, gap: 6, o: 0.6 });
  k.shape('cr-house', k.rect(56, 196, 244, 212), C.brown, C.brownD, { a: 0.2, gap: 4 });
  k.shape('cr-flower', k.rect(196, 172, 220, 196), C.red, C.red, { a: 1, gap: 3.6 });
  k.line('cr-flower', [[220, 178], [228, 182], [220, 190]], C.red, { w: 2.6 });
  k.line('cr-flower', [[202, 168], [198, 158], [206, 150], [202, 140]], C.grey, { w: 2.2 });
  k.line('cr-flower', [[212, 168], [216, 160], [210, 152]], C.grey, { w: 2.2 });
  // the drops on the glass (and the face I drew in them)
  const drops = [[92, 56], [120, 74], [176, 52], [206, 82], [100, 140], [130, 160], [186, 136], [214, 158], [164, 92]];
  drops.forEach(([x, y], i) => k.group('cr-rain', 'd' + i, () => k.drop('cr-rain', x, y, 0.8), `transform-origin:${x}px ${y}px`));
  k.line('cr-fx', k.ring(110, 90, 14, 14), C.white, { closed: true, w: 2.4 });
  k.dot('cr-fx', 105, 86, 2, C.white); k.dot('cr-fx', 115, 86, 2, C.white);
  k.line('cr-fx', [[103, 95], [110, 99], [117, 95]], C.white, { w: 2 });
  k.person('cr-people', 40, 200, 86, { dress: C.purple, hair: '#f2c21b', arm: 'up' });
  const c = k.cls;
  const runs = drops.map((_, i) => `svg.is-playing .${c('d' + i)}{animation:${c('run')} ${(1.4 + (i % 3) * 0.3).toFixed(1)}s steps(7,end) ${(i * 0.09).toFixed(2)}s both}`).join('\n');
  return k.end({ order: ['cr-sky', 'cr-grass', 'cr-tree', 'cr-house', 'cr-flower', 'cr-rain', 'cr-fx', 'cr-people'],
    reveal: ['cr-house', 'cr-sky', 'cr-grass', 'cr-rain', 'cr-fx', 'cr-people', 'cr-flower', 'cr-tree'], css: `
    ${runs}
    @keyframes ${c('run')}{0%{transform:translateY(0) scaleY(1)}30%{transform:translateY(6px) scaleY(1.2)}100%{transform:translateY(34px) scaleY(1.4);opacity:0.2}}` });
};

// 4 up high it is cold: lots of tiny drops make a cloud; tap: the cloud puffs up
S.cloud = function () {
  const k = K.page(41);
  k.skyBand('cr-sky', C.sky, 120);
  k.sun('cr-sun', 50, 50, 22);
  k.group('cr-cloud', 'puff', () => {
    const pts = k.cloud('cr-cloud', 170, 120, 96, 34, { edge: C.blue, lw: 3.2 });
    for (let i = 0; i < 40; i++) {
      const x = 90 + k.R() * 160, y = 82 + k.R() * 60;
      if (window.DRAWKIT.inside(pts, x, y)) k.group('cr-cloud', 'j' + (i % 3), () => k.dot('cr-cloud', x, y, 2.4 + k.R() * 1.4, C.water), `transform-origin:${x.toFixed(0)}px ${y.toFixed(0)}px`);
    }
  }, 'transform-origin:170px 120px');
  // little arrows: the invisible water going up from the sea
  k.scribble('cr-water', k.rect(8, 236, 292, 290), C.water, { a: -0.1, gap: 4.4 });
  k.line('cr-water', [[8, 236], [40, 232], [80, 238], [120, 232], [160, 238], [200, 232], [240, 238], [292, 234]], C.blue, { w: 2.6 });
  for (const x of [70, 150, 230]) { k.line('cr-arrow', [[x, 226], [x + 4, 206], [x, 186]], C.purple, { w: 2.6 }); k.line('cr-arrow', [[x - 6, 194], [x, 184], [x + 6, 194]], C.purple, { w: 2.6 }); }
  // a bird flying past the cloud
  k.line('cr-tree', [[40, 140], [48, 134], [54, 140], [60, 134], [68, 140]], C.black, { w: 2.4 });
  const c = k.cls;
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-water', 'cr-cloud', 'cr-tree', 'cr-arrow'],
    reveal: ['cr-cloud', 'cr-water', 'cr-arrow', 'cr-sun', 'cr-sky', 'cr-tree'], css: `
    svg.is-playing .${c('puff')}{animation:${c('pf')} ${T} steps(8,end) both}
    svg.is-playing .${c('j0')}{animation:${c('jg')} 0.4s steps(2,end) 6 both}
    svg.is-playing .${c('j1')}{animation:${c('jg')} 0.4s steps(2,end) 0.2s 5 both}
    @keyframes ${c('pf')}{0%,100%{transform:scale(1)}50%{transform:scale(1.16,1.1)}}
    @keyframes ${c('jg')}{0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-2px)}}` });
};

// 5 drops get big and heavy and fall: rain; tap: the rain falls
S.rain = function () {
  const k = K.page(51);
  k.cloud('cr-cloud', 150, 60, 130, 32, { fill: C.grey, edge: C.greyD, lw: 3.4 });
  k.grass('cr-grass', 246);
  k.scribble('cr-water', k.oval(80, 266, 40, 8, 14), C.water, { a: 0.1, gap: 3.6 });
  k.scribble('cr-water', k.oval(230, 270, 34, 7, 14), C.water, { a: 0.1, gap: 3.6 });
  // two rows of rain lines, the second a copy a step lower, so the fall loops
  const rain = dy => { for (let i = 0; i < 26; i++) { const x = 20 + (i * 37) % 262, y = 106 + ((i * 53) % 110) + dy; k.line('cr-rain', [[x, y], [x - 4, y + 12]], C.blue, { w: 2.6, amp: 0.3 }); } };
  k.group('cr-rain', 'fall', () => { rain(0); rain(-30); }, '');
  // me under my red umbrella, and Biscuit the dog
  const me = k.person('cr-people', 150, 186, 70, { dress: C.yellow, hair: C.brownD, arm: 'up', boots: C.green });
  const [ux, uy] = me.R;
  const umb = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; umb.push([ux + Math.cos(a) * 36, uy - 6 + Math.sin(a) * 22]); }
  k.shape('cr-people', umb, C.red, C.red, { a: 0.3, gap: 4 });
  k.line('cr-people', [[ux, uy - 28], [ux, uy + 2], [ux - 4, uy + 6]], C.black, { w: 2.4 });
  k.shape('cr-dog', k.oval(232, 248, 14, 7), C.brown, C.brownD, { a: 0.2, gap: 3.4 });
  k.shape('cr-dog', k.ring(248, 238, 7.5, 12), C.brown, C.brownD, { a: 0.9, gap: 3.2 });
  for (const x of [224, 230, 238, 242]) k.line('cr-dog', [[x, 253], [x, 262]], C.brownD, { w: 2.4 });
  k.dot('cr-dog', 250, 236, 1.5, C.black);
  const c = k.cls;
  return k.end({ order: ['cr-cloud', 'cr-grass', 'cr-water', 'cr-rain', 'cr-dog', 'cr-people'],
    reveal: ['cr-cloud', 'cr-rain', 'cr-people', 'cr-grass', 'cr-water', 'cr-dog'], css: `
    svg.is-playing .${c('fall')}{animation:${c('fl')} 0.4s steps(3,end) 6 both}
    @keyframes ${c('fl')}{from{transform:translateY(0)}to{transform:translateY(30px)}}` });
};

// 6 sun behind me, rain in front: a rainbow; tap: the rainbow arcs in colour by colour
S.rainbow = function () {
  const k = K.page(61);
  k.skyBand('cr-sky', C.sky);
  k.sun('cr-sun', 44, 44, 22);
  k.cloud('cr-cloud', 236, 60, 56, 18, { fill: C.grey, edge: C.greyD });
  for (let i = 0; i < 10; i++) { const x = 196 + i * 9, y = 84 + (i % 3) * 14; k.line('cr-rain', [[x, y], [x - 3, y + 12]], C.blue, { w: 2.4, amp: 0.3 }); }
  k.grass('cr-grass', 246);
  const BANDS = [C.red, C.orange, C.yellow, C.green, C.blue, '#3a3aa8', C.purple];
  BANDS.forEach((col, i) => {
    const r = 120 - i * 8, pts = [];
    for (let j = 0; j <= 14; j++) { const a = Math.PI + j / 14 * Math.PI; pts.push([150 + Math.cos(a) * r, 246 + Math.sin(a) * r * 0.95]); }
    k.group('cr-house', 'b' + i, () => k.line('cr-house', pts, col, { w: 7.5, o: 0.9, amp: 0.7 }));
  });
  k.person('cr-people', 150, 176, 70, { dress: C.green, hair: '#f2c21b', arm: 'wave' });
  // arrows: from the sun, past me, into the drops
  k.line('cr-arrow', [[70, 60], [120, 120]], C.orange, { w: 2.4 });
  k.line('cr-arrow', [[110, 118], [120, 120], [118, 108]], C.orange, { w: 2.4 });
  const c = k.cls;
  const kf = BANDS.map((_, i) => `svg.is-playing .${c('b' + i)}{animation:${c('in' + i)} ${T} steps(1,end) both}
    @keyframes ${c('in' + i)}{0%{opacity:0}${(15 + i * 11)}%{opacity:1}100%{opacity:1}}`).join('\n');
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-cloud', 'cr-grass', 'cr-house', 'cr-rain', 'cr-people', 'cr-arrow'],
    reveal: ['cr-people', 'cr-sun', 'cr-cloud', 'cr-rain', 'cr-house', 'cr-grass', 'cr-sky', 'cr-arrow'], css: kf });
};

// 7 very cold: the water freezes into snowflakes; I made a snowman; tap: the flakes fall
S.snow = function () {
  const k = K.page(71);
  k.skyBand('cr-sky', '#9ab0d0');
  k.line('cr-grass', [[6, 236], [60, 226], [120, 232], [180, 224], [240, 230], [294, 222]], C.ice, { w: 3 });
  // snowman: three round balls (white paper, blue edges), carrot nose, buttons, a hat
  for (const [y, r] of [[246, 30], [196, 22], [160, 16]]) k.line('cr-house', k.ring(196, y, r, 16), C.ice, { closed: true, w: 3 });
  k.shape('cr-house', [[196, 158], [214, 162], [196, 164]], C.orange, C.orange, { a: 0, gap: 2.4, lw: 2 });
  k.dot('cr-house', 190, 154, 2.2, C.black); k.dot('cr-house', 202, 154, 2.2, C.black);
  for (const y of [186, 200, 214]) k.dot('cr-house', 196, y, 2.8, C.black);
  k.shape('cr-house', k.rect(182, 126, 210, 144), C.black, C.black, { a: 1.2, gap: 3 });
  k.line('cr-house', [[176, 146], [216, 146]], C.black, { w: 3.4 });
  k.line('cr-house', [[176, 196], [150, 180], [146, 172]], C.brown, { w: 2.6 });
  k.line('cr-house', [[216, 196], [244, 182], [250, 172]], C.brown, { w: 2.6 });
  // me in a hat and scarf
  k.person('cr-people', 90, 170, 76, { dress: C.red, hair: C.brownD, arm: 'wave', hat: C.blue, boots: C.black });
  k.line('cr-people', [[80, 194], [100, 194], [102, 206]], C.green, { w: 3.4 });
  // flakes: little stars of three crossed lines, in two layers so the fall loops
  const flake = (x, y, s) => { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; k.line('cr-rain', [[x - Math.cos(a) * s, y - Math.sin(a) * s], [x + Math.cos(a) * s, y + Math.sin(a) * s]], C.blue, { w: 1.8, amp: 0.2 }); } };
  k.group('cr-rain', 'flakes', () => { for (let i = 0; i < 18; i++) { const x = 16 + (i * 47) % 270, y = 60 + (i * 31) % 150; flake(x, y, 4); flake(x + 10, y - 100, 3.5); } });
  const c = k.cls;
  return k.end({ order: ['cr-sky', 'cr-grass', 'cr-house', 'cr-rain', 'cr-people'],
    reveal: ['cr-house', 'cr-people', 'cr-grass', 'cr-rain', 'cr-sky'], css: `
    svg.is-playing .${c('flakes')}{animation:${c('fl')} 1.2s steps(8,end) 2 both}
    @keyframes ${c('fl')}{from{transform:translate(0,0)}to{transform:translate(-8px,100px)}}` });
};

// 8 rain and melted snow run into rivers, rivers run to the sea; tap: the river flows, a fish jumps
S.river = function () {
  const k = K.page(81);
  k.skyBand('cr-sky', C.sky, 30);
  k.sun('cr-sun', 262, 40, 18);
  // mountains with snow caps
  for (const [x, w, h] of [[60, 60, 110], [128, 50, 80]]) {
    const top = 150 - h;
    k.shape('cr-tree', [[x - w, 150], [x, top], [x + w, 150]], C.purple, C.purple, { a: 0.9, gap: 5 });
    k.line('cr-tree', [[x - w * 0.3, top + h * 0.3], [x - w * 0.12, top + h * 0.22], [x, top + h * 0.32], [x + w * 0.14, top + h * 0.22], [x + w * 0.3, top + h * 0.3]], C.blue, { w: 2.4 });
  }
  k.grass('cr-grass', 150, 290);
  // the sea in the corner
  k.scribble('cr-water', [[190, 290], [210, 250], [250, 230], [294, 222], [294, 290]], C.water, { a: -0.1, gap: 4 });
  k.line('cr-water', [[190, 290], [210, 250], [250, 230], [294, 222]], C.blue, { w: 2.8 });
  // the river: from the snow down to the sea, a wide wiggly band
  const RIVER = [[60, 120], [70, 150], [96, 172], [86, 196], [112, 218], [150, 226], [176, 248], [216, 262]];
  k.line('cr-water', RIVER, C.water, { w: 14, o: 0.85 });
  k.line('cr-water', RIVER, C.blue, { w: 3 });
  k.raw('cr-fx', `<path class="${k.cls('flow')}" d="${k.wobble(RIVER, false, 0.4)}" fill="none" stroke="${C.waterL}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="6 14"/>`);
  // trees, a fish, a boat
  for (const x of [150, 30, 176]) { const y = x === 30 ? 196 : 176; k.shape('cr-flower', k.rect(x - 3, y, x + 3, y + 20), C.brown, C.brownD, { gap: 3 }); k.shape('cr-flower', k.oval(x, y - 6, 12, 14), C.green, C.greenD, { gap: 4 }); }
  k.group('cr-dog', 'fish', () => { k.shape('cr-dog', k.oval(250, 262, 10, 5), C.orange, C.orange, { gap: 2.6, lw: 2 }); k.line('cr-dog', [[240, 262], [234, 256], [234, 268], [240, 262]], C.orange, { w: 2.2 }); k.dot('cr-dog', 255, 260, 1.4, C.black); }, 'transform-origin:250px 262px');
  k.shape('cr-house', [[256, 236], [288, 236], [282, 244], [262, 244]], C.red, C.red, { gap: 3 });
  k.line('cr-house', [[272, 236], [272, 210]], C.black, { w: 2.2 });
  k.shape('cr-house', [[274, 212], [274, 232], [286, 232]], C.yellow, C.orange, { gap: 3, lw: 2 });
  const c = k.cls;
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-tree', 'cr-grass', 'cr-water', 'cr-house', 'cr-flower', 'cr-dog', 'cr-fx'],
    reveal: ['cr-tree', 'cr-water', 'cr-fx', 'cr-grass', 'cr-flower', 'cr-sun', 'cr-house', 'cr-dog', 'cr-sky'], css: `
    svg.is-playing .${c('flow')}{animation:${c('fw')} 0.6s steps(3,end) 4 both}
    svg.is-playing .${c('fish')}{animation:${c('fj')} 1.2s steps(6,end) 2 both}
    @keyframes ${c('fw')}{from{stroke-dashoffset:0}to{stroke-dashoffset:-20}}
    @keyframes ${c('fj')}{0%,100%{transform:translate(0,0) rotate(0)}50%{transform:translate(4px,-26px) rotate(-30deg)}}` });
};

// 9 the sun warms the sea and it all starts again: a circle! tap: a drop goes round
S.circle = function () {
  const k = K.page(91);
  k.skyBand('cr-sky', C.sky, 30);
  k.sun('cr-sun', 50, 50, 24);
  k.cloud('cr-cloud', 230, 64, 52, 18, { fill: C.grey, edge: C.greyD });
  for (let i = 0; i < 6; i++) { const x = 206 + i * 10, y = 96 + (i % 2) * 10; k.line('cr-rain', [[x, y], [x - 3, y + 12]], C.blue, { w: 2.4, amp: 0.3 }); }
  // hill on the right with a little house; the river back to the sea
  k.shape('cr-grass', [[150, 290], [200, 170], [250, 150], [294, 160], [294, 290]], C.green, C.greenD, { a: -0.4, gap: 5 });
  k.shape('cr-house', k.rect(240, 128, 268, 152), C.wall, C.orange, { gap: 5 });
  k.shape('cr-house', [[236, 130], [272, 130], [254, 112]], C.red, C.red, { gap: 4 });
  k.line('cr-water', [[256, 160], [236, 196], [214, 228], [176, 256], [130, 270]], C.water, { w: 10, o: 0.85 });
  k.scribble('cr-water', [[8, 250], [150, 262], [160, 290], [8, 290]], C.water, { a: -0.1, gap: 4 });
  k.line('cr-water', [[8, 250], [60, 254], [110, 258], [150, 262]], C.blue, { w: 2.8 });
  // the big circle of arrows: up from the sea, across to the cloud, down as rain, back by the river
  const ARROWS = [
    [[[60, 236], [52, 190], [56, 140]], [[48, 150], [56, 138], [66, 148]]],
    [[[90, 104], [150, 76], [176, 70]], [[166, 62], [178, 70], [166, 80]]],
    [[[276, 104], [282, 150], [276, 190]], [[268, 180], [276, 192], [286, 182]]],
    [[[200, 270], [150, 280], [100, 276]], [[110, 268], [98, 276], [110, 286]]]
  ];
  ARROWS.forEach(([a, h], i) => k.group('cr-arrow', 'a' + i, () => { k.line('cr-arrow', a, C.purple, { w: 3.4 }); k.line('cr-arrow', h, C.purple, { w: 3.4 }); }));
  k.person('cr-people', 118, 166, 66, { dress: C.purple, hair: '#f2c21b', arm: 'wave' });
  // the travelling drop (tap)
  k.group('cr-fx', 'drop', () => k.drop('cr-fx', 60, 236, 1.1), 'transform-origin:60px 236px');
  const c = k.cls;
  const path = [[60, 236], [54, 180], [62, 120], [120, 84], [190, 70], [250, 90], [280, 140], [276, 200], [240, 240], [170, 270], [100, 270], [60, 236]];
  const kf = path.map(([x, y], i) => `${(i / (path.length - 1) * 100).toFixed(1)}%{transform:translate(${x - 60}px,${y - 236}px)}`).join('');
  const pulse = [0, 1, 2, 3].map(i => `svg.is-playing .${c('a' + i)}{animation:${c('pl')} 0.6s steps(2,end) ${(i * 0.6).toFixed(1)}s both}`).join('\n');
  return k.end({ order: ['cr-sky', 'cr-sun', 'cr-cloud', 'cr-grass', 'cr-water', 'cr-house', 'cr-rain', 'cr-people', 'cr-fx', 'cr-arrow'],
    reveal: ['cr-water', 'cr-sun', 'cr-cloud', 'cr-rain', 'cr-grass', 'cr-house', 'cr-people', 'cr-arrow', 'cr-sky', 'cr-fx'], css: `
    svg.is-playing .${c('drop')}{animation:${c('go')} ${T} steps(11,end) both}
    @keyframes ${c('go')}{${kf}}
    ${pulse}
    @keyframes ${c('pl')}{0%,100%{opacity:1}50%{opacity:0.3}}` });
};

window.RAIN_SCENES = S;
})();
