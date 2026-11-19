// THE LONG WAY HOME: the toy-cube kit. Every cube is a printed 16x16 pixel
// picture with a light/dark printed bevel and a thin rim, satin plastic
// (refs: .kiro/reference/minecraft/, magnetic toy cubes, not the game).
// Textures are drawn in code and scaled up with NearestFilter.
// Exposes window.LONGWAY_CUBES: { M(name), skin(type), box, figure(opts) }.
(function () {
'use strict';
const G = window.WEBGL_STAGE, D = window.DRAWKIT;
const { THREE } = G;
const { rng } = D;

const TP = 16, UP = 4;   // 16 art pixels a side, 4 texels each
const pick = (R, a) => a[Math.floor(R() * a.length)];
const each = f => { for (let j = 0; j < TP; j++) for (let i = 0; i < TP; i++) f(i, j); };
// draws a 16x16 picture, scales it up and prints the bevel; `bevel: false`
// for flat printed details (faces stay framed like the toy's head cubes)
function pix(draw, seed, { bevel = true } = {}) {
  const s = G.canvas(TP, TP), x = s.getContext('2d'), R = rng(seed);
  draw((i, j, c) => { x.fillStyle = c; x.fillRect(i, j, 1, 1); }, R);
  const n = TP * UP, c = G.canvas(n, n), ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(s, 0, 0, n, n);
  if (bevel) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(0, 0, n, 2); ctx.fillRect(0, 0, 2, n);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, n - 2, n, 2); ctx.fillRect(n - 2, 0, 2, n);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, n - 1, n - 1);
  }
  const t = G.texture(c, { aniso: 4 });
  t.magFilter = THREE.NearestFilter;
  return t;
}
const PAL = {
  grass: ['#5d9b3a', '#6aac43', '#4f8a32', '#79b94d'],
  dirt: ['#8a5a36', '#7a4e2e', '#9b6a40', '#6b4428'],
  stone: ['#9a9a98', '#8b8b89', '#a8a8a5', '#939391'],
  brick: ['#b8432f', '#a83a28', '#c24e36'],
  white: ['#f2f2ee', '#e6e6e0', '#fafaf6'],
  plaster: ['#f4efe4', '#ece5d6', '#f8f4ec'],
  tile: ['#c4553a', '#b44a32', '#d06244'],
  plank: ['#a87a48', '#9a6d3d', '#b48650'],
  roof: ['#8a5a32', '#7a4c2a', '#9b6838'],
  bark: ['#6b4a2b', '#5a3d22', '#7a5634'],
  leaf: ['#3f7d2a', '#4c9132', '#356b24', '#5ca03c'],
  water: ['#3d7fd0', '#4a8ee0', '#356fc0', '#4487d8'],
  deep: ['#244f8a', '#2b5c9c', '#1f467c'],
  path: ['#c9a96e', '#b89a60', '#d6b97c', '#a88c58'],
  sand: ['#e8d39a', '#dcc58a', '#f0dca8', '#d2ba7c'],
  wool: ['#efefef', '#e2e2e2', '#f7f7f7', '#e9e9e9'],
  glass: ['#a9d6ee', '#9ccbe6', '#b7def2'],
  warm: ['#ffd27a', '#ffc65e', '#ffe09a'],
  door: ['#7a4e2c', '#6e4526', '#86582f'],
  skin: ['#c99a74', '#bf8f6a'], hair: ['#4a2f1d', '#3f2818'],
  shirt: ['#2fb0b0', '#29a0a0'], pants: ['#3a3aa8', '#33339a'],
  grey: ['#7d848c', '#727980', '#8a9199'], dolphin: ['#6f8fa8', '#7a9ab3', '#6687a0'],
  pink: ['#e46a8f', '#d95e84', '#ef7a9c'], storm: ['#5d6273', '#525767', '#686d7e'],
  moon: ['#f4f0d0', '#ece6c0', '#faf6dc'], sack: ['#b58a55', '#a67c4a', '#c29862'],
  red: ['#d23a3a', '#c43232', '#de4a4a'], crust: ['#d9a05a', '#c88f4a', '#e6b06a'],
  fur: ['#9a6a3c', '#8a5c32', '#a8784a'], navy: ['#2b3a66', '#25335c', '#334474'],
  tunic: ['#7a5a34', '#6e5030', '#86643a'], gskin: ['#d6a07a', '#cc9670'],
  green: ['#3f9a5a', '#378c50', '#47a462'], blue: ['#3a6ec0', '#3466b4']
};
const F = pal => (put, R) => each((i, j) => put(i, j, pick(R, pal)));
const flowers = (put, R, n) => { for (let k = 0; k < n; k++) put(1 + Math.floor(R() * 14), 1 + Math.floor(R() * 14), R() < 0.6 ? '#ffffff' : '#ffe35a'); };
const MORTAR = '#d8cfc2', GROUT = '#6e6e6c';
// a face on a head cube: hair rows at the top, two eyes, a mouth
function face(skin, hair, { eyes = '#3b5bd6', beard = null, cap = null, one = false, shut = false, long = false } = {}) {
  return (put, R) => {
    each((i, j) => put(i, j, j < 4 || (j < (long ? 12 : 6) && (i < 1 || i > 14)) ? pick(R, hair) : pick(R, skin)));
    if (cap) each((i, j) => { if (j < 3) put(i, j, pick(R, cap)); });
    if (one) {                                         // the giant: one big eye in the middle
      if (shut) for (let i = 5; i < 11; i++) put(i, 8, '#5a3a28');
      else { for (let j = 6; j < 10; j++) for (let i = 6; i < 10; i++) put(i, j, '#ffffff'); put(7, 7, '#2a2a2a'); put(8, 7, '#2a2a2a'); put(7, 8, '#2a2a2a'); put(8, 8, '#2a2a2a'); }
      for (let i = 5; i < 11; i++) put(i, 5, pick(R, hair));
    } else for (const j of [8, 9]) { put(3, j, '#ffffff'); put(4, j, eyes); put(11, j, eyes); put(12, j, '#ffffff'); }
    put(7, 10, '#b07f5c'); put(8, 10, '#b07f5c');
    for (let i = 6; i < 10; i++) put(i, 12, '#8a5a40');
    if (beard) each((i, j) => { if (j > 10 && (j > 12 || i < 5 || i > 10)) put(i, j, pick(R, beard)); });
  };
}
const side = (skin, hair, { cap = null, long = false } = {}) => (put, R) => each((i, j) => put(i, j, cap && j < 3 ? pick(R, cap) : j < 6 || (j < (long ? 12 : 9) && i > 11) ? pick(R, hair) : pick(R, skin)));
const outfit = (top, bottom, split = 9, extra) => (put, R) => { each((i, j) => put(i, j, j < split ? pick(R, top) : pick(R, bottom))); if (extra) extra(put, R); };

const T = {};
const DEFS = {
  grassTop: [(put, R) => { F(PAL.grass)(put, R); flowers(put, R, 3); }, 1],
  grassSide: [(put, R) => { F(PAL.dirt)(put, R); for (let i = 0; i < TP; i++) { const d = 3 + Math.floor(R() * 3); for (let j = 0; j < d; j++) put(i, j, pick(R, PAL.grass)); } }, 2],
  dirt: [F(PAL.dirt), 3],
  stone: [(put, R) => { F(PAL.stone)(put, R); for (let i = 0; i < TP; i++) { put(i, 0, GROUT); put(i, 8, GROUT); } for (let j = 1; j < TP; j++) if (j !== 8) put(j < 8 ? 0 : 8, j, GROUT); }, 4],
  brick: [(put, R) => { F(PAL.brick)(put, R); for (let j = 0; j < TP; j++) { if (j % 4 === 3) for (let i = 0; i < TP; i++) put(i, j, MORTAR); else put((j >> 2) % 2 ? 3 : 11, j, MORTAR); } }, 5],
  whiteBrick: [(put, R) => { F(PAL.white)(put, R); for (let j = 0; j < TP; j++) { if (j % 4 === 3) for (let i = 0; i < TP; i++) put(i, j, '#c9c9c2'); else put((j >> 2) % 2 ? 3 : 11, j, '#d4d4cc'); } }, 21],
  plaster: [(put, R) => { F(PAL.plaster)(put, R); for (let k = 0; k < 4; k++) put(Math.floor(R() * 16), Math.floor(R() * 16), '#ddd4c2'); }, 22],
  tile: [(put, R) => { F(PAL.tile)(put, R); for (let j = 0; j < TP; j++) { if (j % 4 === 3) for (let i = 0; i < TP; i++) put(i, j, '#8e3424'); else if (j % 4 === 0) for (let i = (j >> 2) % 2 ? 2 : 6; i < TP; i += 8) put(i, j, '#e07a5a'); } }, 23],
  plank: [planks(PAL.plank), 6],
  roof: [planks(PAL.roof), 7],
  logSide: [(put, R) => { const col = []; for (let i = 0; i < TP; i++) col.push(pick(R, PAL.bark)); each((i, j) => put(i, j, R() < 0.8 ? col[i] : pick(R, PAL.bark))); }, 8],
  logTop: [(put, R) => each((i, j) => { const d = Math.max(Math.abs(i - 7.5), Math.abs(j - 7.5)); put(i, j, d > 6.5 ? pick(R, PAL.bark) : Math.floor(d) % 2 ? '#b48650' : '#9a6d3d'); }), 9],
  leaf: [(put, R) => { F(PAL.leaf)(put, R); flowers(put, R, 4); }, 10],
  fruitLeaf: [(put, R) => {
    F(PAL.leaf)(put, R);
    for (let k = 0; k < 3; k++) { const i = 1 + Math.floor(R() * 12), j = 1 + Math.floor(R() * 12), c = R() < 0.5 ? '#ff8a1f' : '#e8342a';
      put(i, j, c); put(i + 1, j, c); put(i, j + 1, c); put(i + 1, j + 1, '#ffd07a'); }
  }, 24],
  water: [(put, R) => { F(PAL.water)(put, R); for (let i = 0; i < TP; i++) for (const b of [3, 11]) put(i, b + Math.round(Math.sin(i * 0.8) * 1.2), '#9fd0f5'); }, 11],
  deep: [(put, R) => { F(PAL.deep)(put, R); for (let i = 0; i < TP; i++) put(i, 7 + Math.round(Math.sin(i * 0.6) * 2), '#5f8fd0'); }, 25],
  path: [F(PAL.path), 12],
  sand: [(put, R) => { F(PAL.sand)(put, R); for (let k = 0; k < 3; k++) put(1 + Math.floor(R() * 14), 1 + Math.floor(R() * 14), '#fff4d6'); }, 20],
  wool: [F(PAL.wool), 13],
  glass: [F(PAL.glass), 63],
  fruit: [(put, R) => { each((i, j) => put(i, j, pick(R, ['#ff8a1f', '#f47a14', '#ff9a34']))); for (let i = 6; i < 10; i++) put(i, 0, '#3f7d2a'); put(4, 4, '#ffd07a'); put(5, 4, '#ffd07a'); }, 64],
  window: [(put, R) => each((i, j) => { const fr = i < 2 || i > 13 || j < 2 || j > 13 || i === 7 || i === 8 || j === 7 || j === 8; put(i, j, fr ? pick(R, PAL.plank) : R() < 0.1 ? '#ffffff' : pick(R, PAL.glass)); }), 14],
  homeWindow: [(put, R) => each((i, j) => { const fr = i < 2 || i > 13 || j < 2 || j > 13 || i === 7 || i === 8 || j === 7 || j === 8; put(i, j, fr ? pick(R, PAL.plaster) : pick(R, PAL.warm)); }), 26],
  // emissive map for the home windows: glass bright, frame black
  homeGlow: [(put) => each((i, j) => { const fr = i < 2 || i > 13 || j < 2 || j > 13 || i === 7 || i === 8 || j === 7 || j === 8; put(i, j, fr ? '#000000' : '#ffffff'); }), 27, { bevel: false }],
  door: [(put, R) => { F(PAL.door)(put, R); each((i, j) => { if (i === 0 || i === 15 || j === 0) put(i, j, '#4e321c'); }); for (let j = 2; j < 6; j++) for (const i of [3, 4, 5, 10, 11, 12]) put(i, j, pick(R, PAL.glass)); put(12, 9, '#d8b44a'); }, 15],
  lamp: [(put, R) => each((i, j) => put(i, j, i < 2 || i > 13 || j < 2 || j > 13 ? '#3c3e4a' : pick(R, ['#ffe27a', '#fff0a8', '#ffd24a']))), 28],
  sack: [(put, R) => { F(PAL.sack)(put, R); each((i, j) => { if ((i + j) % 4 === 0 && R() < 0.6) put(i, j, '#8e6a3c'); }); }, 29],
  rope: [F(['#e8d8a8', '#d8c890']), 30],
  grey: [F(PAL.grey), 31],
  sealFace: [(put, R) => { F(PAL.grey)(put, R); for (const i of [4, 11]) { put(i, 6, '#1a1a1a'); put(i, 7, '#1a1a1a'); } put(7, 9, '#2a2a2a'); put(8, 9, '#2a2a2a'); for (const j of [10, 11]) { put(3, j, '#e8e8e8'); put(12, j, '#e8e8e8'); } }, 32],
  dolphin: [(put, R) => each((i, j) => put(i, j, j > 10 ? '#d8e2ea' : pick(R, PAL.dolphin))), 33],
  dolphinFace: [(put, R) => { each((i, j) => put(i, j, j > 10 ? '#d8e2ea' : pick(R, PAL.dolphin))); put(4, 6, '#1a1a1a'); put(11, 6, '#1a1a1a'); for (let i = 5; i < 11; i++) put(i, 11, '#4a5a6a'); }, 34],
  octo: [(put, R) => { F(PAL.pink)(put, R); for (let k = 0; k < 6; k++) put(1 + Math.floor(R() * 14), 1 + Math.floor(R() * 14), '#ffb0c8'); }, 35],
  octoFace: [(put, R) => { F(PAL.pink)(put, R); for (const i0 of [2, 9]) for (let j = 5; j < 10; j++) for (let i = i0; i < i0 + 5; i++) put(i, j, '#ffffff'); for (const i of [4, 5, 11, 12]) { put(i, 7, '#1a1a1a'); put(i, 8, '#1a1a1a'); } for (let i = 5; i < 11; i++) put(i, 12, '#a0304e'); put(4, 11, '#a0304e'); put(11, 11, '#a0304e'); }, 36],
  storm: [F(PAL.storm), 37],
  moon: [(put, R) => { F(PAL.moon)(put, R); for (const [i, j] of [[4, 4], [10, 6], [6, 11], [11, 12]]) { put(i, j, '#d6cfa4'); put(i + 1, j, '#d6cfa4'); } }, 38],
  bee: [(put) => each((i, j) => put(i, j, Math.floor(i / 4) % 2 ? '#1a1a1a' : '#ffd21f')), 39],
  fur: [F(PAL.fur), 40],
  dogFace: [(put, R) => { F(PAL.fur)(put, R); put(4, 6, '#1a1a1a'); put(11, 6, '#1a1a1a'); for (let i = 6; i < 10; i++) { put(i, 9, '#1a1a1a'); put(i, 10, '#1a1a1a'); } put(7, 12, '#e86a7a'); put(8, 12, '#e86a7a'); put(7, 13, '#e86a7a'); for (let j = 0; j < 6; j++) { put(0, j, '#5e3a1c'); put(15, j, '#5e3a1c'); } }, 41],
  hat: [(put, R) => each((i, j) => put(i, j, j === 12 || j === 13 ? '#f4f4f4' : pick(R, PAL.red))), 42],
  bread: [(put, R) => { F(PAL.crust)(put, R); for (const i of [4, 8, 12]) for (let j = 3; j < 13; j++) if ((i + j) % 3) put(i, j, '#a86a32'); }, 43],
  gull: [(put, R) => each((i, j) => put(i, j, j < 3 ? pick(R, ['#8a9099', '#7e848c']) : pick(R, PAL.wool))), 44],
  windFace: [(put, R) => {
    F(PAL.wool)(put, R);
    for (const i of [4, 11]) { put(i, 5, '#2a2a3a'); put(i, 6, '#2a2a3a'); }
    for (const [i, j] of [[2, 9], [3, 9], [2, 10], [3, 10], [12, 9], [13, 9], [12, 10], [13, 10]]) put(i, j, '#f2a0a8');   // puffed cheeks
    for (const [i, j] of [[7, 9], [8, 9], [6, 10], [9, 10], [6, 11], [9, 11], [7, 12], [8, 12]]) put(i, j, '#3a2a3a');    // "O" mouth
    for (let i = 3; i < 7; i++) put(i, 3, '#8a8a9a'); for (let i = 9; i < 13; i++) put(i, 3, '#8a8a9a');
  }, 45],
  // people
  face: [face(PAL.skin, PAL.hair), 16],
  headSide: [side(PAL.skin, PAL.hair), 17],
  hair: [F(PAL.hair), 18],
  body: [outfit(PAL.shirt, PAL.pants), 19],
  keeperFace: [face(PAL.skin, ['#d8d8d8', '#c8c8c8'], { eyes: '#4a3a2a', beard: ['#f0f0f0', '#e0e0e0'], cap: PAL.navy }), 46],
  keeperSide: [side(PAL.skin, ['#d8d8d8', '#c8c8c8'], { cap: PAL.navy }), 47],
  keeperBody: [outfit(PAL.navy, PAL.navy, 9, put => { for (let j = 1; j < 9; j += 3) put(7, j, '#d8b44a'); }), 48],
  navy: [F(PAL.navy), 49],
  giantAwake: [face(PAL.gskin, ['#7a3a1a', '#6a3216'], { one: true, beard: ['#8a4a22', '#7a3e1a'] }), 50],
  giantSleep: [face(PAL.gskin, ['#7a3a1a', '#6a3216'], { one: true, shut: true, beard: ['#8a4a22', '#7a3e1a'] }), 51],
  giantSide: [side(PAL.gskin, ['#7a3a1a', '#6a3216']), 52],
  giantHair: [F(['#7a3a1a', '#6a3216']), 53],
  gskin: [F(PAL.gskin), 54],
  tunic: [outfit(PAL.tunic, PAL.tunic, 9, (put) => { for (let i = 0; i < 16; i++) { put(i, 10, '#3a2a1a'); put(i, 11, '#3a2a1a'); } put(7, 10, '#d8b44a'); put(8, 10, '#d8b44a'); }), 55],
  sheepFace: [(put, R) => { each((i, j) => put(i, j, j < 3 ? pick(R, PAL.wool) : pick(R, ['#2a2a2a', '#333333']))); put(4, 7, '#ffffff'); put(11, 7, '#ffffff'); }, 56],
  mumFace: [face(PAL.skin, ['#a8642a', '#9a5a24'], { eyes: '#3a7a3a', long: true }), 57],
  mumSide: [side(PAL.skin, ['#a8642a', '#9a5a24'], { long: true }), 58],
  mumHair: [F(['#a8642a', '#9a5a24']), 59],
  mumBody: [outfit(PAL.green, PAL.green), 60],
  dadFace: [face(PAL.skin, PAL.hair, { beard: PAL.hair }), 61],
  dadBody: [outfit(PAL.blue, ['#6a4a2a', '#5e4224']), 62]
};
function planks(pal) {
  return (put, R) => {
    F(pal)(put, R);
    for (let j = 0; j < TP; j++) {
      if (j % 4 === 3) for (let i = 0; i < TP; i++) put(i, j, '#5e3e22');
      else put(((j >> 2) * 5 + 3) % 16, j, '#6e4a28');
    }
  };
}
const tex = name => T[name] || (T[name] = pix(DEFS[name][0], DEFS[name][1], DEFS[name][2]));

// ---- materials ------------------------------------------------------------------
const EMISSIVE = {
  lamp: { color: '#ffd76a', intensity: 1.2 },
  homeWindow: { color: '#ffcf6a', intensity: 0, map: 'homeGlow' }   // lit by the story (lamps come on)
};
const mats = {};
function M(name) {
  if (mats[name]) return mats[name];
  const o = { map: tex(name), roughness: 0.55, metalness: 0 };
  const e = EMISSIVE[name];
  if (e) Object.assign(o, { emissive: new THREE.Color(e.color), emissiveIntensity: e.intensity, emissiveMap: e.map ? tex(e.map) : tex(name) });
  return (mats[name] = new THREE.MeshStandardMaterial(o));
}
// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const SKIN = {
  grass: () => [M('grassSide'), M('grassSide'), M('grassTop'), M('dirt'), M('grassSide'), M('grassSide')],
  path: () => [M('dirt'), M('dirt'), M('path'), M('dirt'), M('dirt'), M('dirt')],
  log: () => [M('logSide'), M('logSide'), M('logTop'), M('logTop'), M('logSide'), M('logSide')]
};
const skin = t => (SKIN[t] ? SKIN[t]() : M(t));
const box = new THREE.BoxGeometry(1, 1, 1);

// a two-cube toy figure (body cube + head cube with a printed face), feet at
// the origin, facing +z. `head` is a group so hats can sit on it.
function figure({ body = 'body', face = 'face', side = 'headSide', top = 'hair', back = 'hair', w = 0.7, h = 1, d = 0.45, hs = 0.8 } = {}) {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(body));
  b.position.y = h / 2;
  const head = new THREE.Group();
  head.position.y = h + hs / 2;
  const hm = new THREE.Mesh(new THREE.BoxGeometry(hs, hs, hs), [M(side), M(side), M(top), M(side), M(face), M(back)]);
  head.add(hm);
  [b, hm].forEach(m => { m.castShadow = m.receiveShadow = true; });
  g.add(b, head);
  return { group: g, body: b, head, headMesh: hm };
}

window.LONGWAY_CUBES = { M, skin, box, figure, tex };
})();
