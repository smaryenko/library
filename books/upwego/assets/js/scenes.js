// UP WE GO: the 13 stitched pictures. Each builder returns one hoop SVG
// (see stitch.js). Parts are depth layers: sky / ground / path / far /
// detail / main / mover / front. Reveal groups: 0 = the setting, 1 = the
// subject, 2 = the last details. Movers animate on tap (2.4 s, 12 steps/s).
(function () {
'use strict';
const { design, C, tr, lerp } = window.Stitch;
const S = {};
const TAU = Math.PI * 2;
const night = (d, n, free) => d.part('sky', 0).stars(n, free);

// 1. Looking up: a hill at night, a child and a tree, the Moon and stars
S.lookUp = function () {
  const d = design(101);
  const hill = x => 150 - 22 * Math.exp(-Math.pow((x - 70) / 45, 2)) + 6 * Math.sin(x * 0.05);
  night(d, 60, (x, y) => y < hill(x) - 6 && Math.hypot(x - 148, y - 55) > 26);
  d.part('far', 0);
  d.fillCirc(148, 55, 18, 20, C.moonHi, { max: 8 });
  d.fillCirc(156, 50, 16, 20, C.navy, { max: 8 });               // crescent: the dark part
  d.part('ground', 0);
  d.satin((x, y) => d.hoop(x, y) && y > hill(x), [0, 120, 200, 200], 6, (x, y) => (d.fbm(x * 0.05, y * 0.05, 4) > 0.55 ? C.grassD : C.grass), { max: 10 });
  d.part('main', 1);
  // the tree
  d.fillRect(128, 112, 133, 140, 90, C.bark, { max: 8 });
  d.fillEll(130, 102, 16, 13, 30, C.grassD, { max: 7 });
  d.fillEll(124, 98, 8, 6, 30, C.grass, { max: 6 });
  // the child, looking up, pointing
  const cx = 72, cy = 128;
  d.fillCirc(cx, cy - 16, 4.2, 90, C.skin, { max: 6 });
  d.fillEll(cx - 1, cy - 18.5, 4.6, 2.4, 0, C.hair, { max: 6 });
  d.fillRect(cx - 3.8, cy - 11.5, cx + 3.8, cy - 1, 90, C.red, { max: 6 });
  d.back([[cx - 2, cy - 1], [cx - 2.6, cy + 8]], 2, C.navy, { w: 2.4 });
  d.back([[cx + 2, cy - 1], [cx + 2.6, cy + 8]], 2, C.navy, { w: 2.4 });
  d.back([[cx + 3.5, cy - 10], [cx + 11, cy - 21]], 2, C.red, { w: 2 });   // pointing arm
  d.back([[cx - 3.5, cy - 10], [cx - 6, cy - 3]], 2, C.red, { w: 2 });
  // a shooting star crossing on tap
  d.part('mover', 2).mover('shoot', [40, 40]);
  d.back([[-8, -3], [0, 0]], 2, C.star, { w: 0.8 }).back([[-16, -6], [-8, -3]], 2, C.cream, { w: 0.6 });
  d.knot(0, 0, C.star, 1.8);
  return d.svg({ anims: { shoot: { rest: 'translate(40px,40px) scale(0.001)', frame: f => f < 0.85 ? tr(lerp(40, 120, f / 0.85), lerp(40, 75, f / 0.85)) : tr(120, 75, 0, 0.001) } } });
};

// 2. The first telescopes: a hilltop telescope, the cratered Moon, Jupiter and its moons
S.telescope = function () {
  const d = design(202);
  const hill = x => 158 + 10 * Math.sin(x * 0.03 + 1);
  night(d, 45, (x, y) => y < hill(x) - 6 && Math.hypot(x - 62, y - 62) > 34 && Math.hypot(x - 145, y - 60) > 20);
  d.part('far', 0);
  const mc = (x, y) => {
    for (const [cx, cy, r] of [[52, 52, 7], [70, 70, 5], [60, 78, 4], [76, 50, 4], [46, 72, 5]]) if (Math.hypot(x - cx, y - cy) < r) return C.moon3;
    return d.fbm(x * 0.06, y * 0.06, 8) > 0.55 ? C.moon2 : C.moon1;
  };
  d.satin(d.inCirc(62, 62, 28), [33, 33, 91, 91], 40, mc, { max: 8 });
  d.chain(d.ring(62, 62, 28.8, 28.8, 44), 2.6, C.moonHi);
  d.fillEll(145, 60, 12, 11, 0, (x, y) => (Math.floor((y - 49) / 3.2) % 2 ? C.jup1 : C.jup2), { max: 8 });
  d.fillEll(149, 64, 2.4, 1.5, 0, C.redD, { max: 4 });
  d.part('ground', 0);
  d.satin((x, y) => d.hoop(x, y) && y > hill(x), [0, 140, 200, 200], 4, C.grassD, { max: 10 });
  d.part('main', 1);
  // brass telescope on a wooden tripod, pointing up at the Moon
  d.back([[118, 128], [104, 162]], 2.4, C.bark, { w: 1.8 });
  d.back([[118, 128], [132, 162]], 2.4, C.bark, { w: 1.8 });
  d.back([[118, 128], [119, 164]], 2.4, C.bark, { w: 1.6 });
  d.fillPoly([[98, 106], [140, 130], [136, 137], [94, 113]], 30, C.gold, { max: 6 });
  d.fillPoly([[94, 104], [101, 108], [96, 117], [89, 113]], 30, C.goldD, { max: 4 });
  d.back([[108, 112], [108, 120]], 1.5, C.goldD, { w: 0.6 }).back([[124, 121], [123, 129]], 1.5, C.goldD, { w: 0.6 });
  // Jupiter's four big moons, in a line; they slide along it on tap
  d.part('mover', 2);
  [[-24, 0], [-15, 0], [17, 0], [27, 0]].forEach(([x], i) => { d.mover('io' + i, [145 + x, 60]); d.knot(0, 0, C.cream, 1.6); });
  const anims = {};
  [-24, -15, 17, 27].forEach((x, i) => {
    anims['io' + i] = { frame: f => tr(145 + x * Math.cos(f * TAU * (1 + i * 0.3)), 60) };
  });
  return d.svg({ anims });
};

// 3. 1926: the first liquid-fuel rocket in a snowy field. A slim rocket
// with a pointed nose and fins, held in a tall A-shaped launch frame of
// thin pipes (not a ladder), two fuel tanks at its side.
S.rocket1926 = function () {
  const d = design(303);
  night(d, 25, (x, y) => y < 120);
  d.part('ground', 0);
  const field = x => 150 + 4 * Math.sin(x * 0.04);
  d.satin((x, y) => d.hoop(x, y) && y > field(x), [0, 140, 200, 200], 2, (x, y) => (d.fbm(x * 0.05, y * 0.08, 3) > 0.6 ? C.greyL : C.white), { max: 10 });
  d.fillEll(40, 124, 30, 9, 0, C.greyD, { max: 10 });            // dark woods on the horizon
  d.fillEll(165, 128, 26, 7, 0, C.greyD, { max: 10 });
  d.part('detail', 1);
  // the A-frame: two pipe legs leaning in to a crossbar, a third behind, guy wires
  d.back([[74, 154], [94, 64]], 2.4, C.grey, { w: 1.3 }).back([[126, 154], [106, 64]], 2.4, C.grey, { w: 1.3 });
  d.back([[94, 64], [106, 64]], 2, C.grey, { w: 1.3 });
  d.back([[86, 110], [114, 110]], 2.4, C.grey, { w: 0.9 });
  d.back([[100, 156], [100, 128]], 2.4, C.greyD, { w: 1.1 });
  d.running([[94, 64], [52, 154]], 2, 2, C.greyL, { w: 0.5 }).running([[106, 64], [148, 154]], 2, 2, C.greyL, { w: 0.5 });
  // the oxygen and petrol tanks on a little stand beside it
  d.fillCirc(140, 140, 7, 0, C.silver, { max: 6 }).fillCirc(152, 142, 6, 0, C.greyL, { max: 6 });
  d.back([[140, 133], [104, 104]], 2.4, C.greyD, { w: 0.6 });   // the fuel hose
  // the rocket itself (rises on tap)
  d.part('main', 1).mover('rocket', [100, 0]);
  d.fillPoly([[0, 66], [5, 78], [-5, 78]], 90, C.red, { max: 4 });                  // pointed nose
  d.fillRect(-5, 78, 5, 116, 90, (x, y) => (y > 96 && y < 100 ? C.red : C.white), { max: 8 }); // white body, red band
  d.back([[-5, 88], [5, 88]], 2, C.greyL, { w: 0.6 });
  d.fillPoly([[-5, 104], [-13, 118], [-5, 116]], 90, C.red, { max: 4 });             // fins
  d.fillPoly([[5, 104], [13, 118], [5, 116]], 90, C.red, { max: 4 });
  d.fillPoly([[-3, 116], [3, 116], [4, 120], [-4, 120]], 90, C.greyD, { max: 3 });   // nozzle
  d.part('mover', 2).mover('flame', [100, 0]);
  d.fillPoly([[-4, 120], [4, 120], [6, 128], [0, 140], [-6, 128]], 90, C.flame, { max: 4 });
  d.fillPoly([[-2.2, 121], [2.2, 121], [3, 127], [0, 134], [-3, 127]], 90, C.yellow, { max: 3 });
  const rise = f => { const k = Math.min(1, f * 1.3); return -k * k * 58; };
  return d.svg({ anims: {
    rocket: { frame: f => tr(100 + (f > 0.15 ? Math.sin(f * 40) * 0.6 : 0), rise(f)) },
    flame: { rest: 'translate(100px,0px) scale(0.001)', frame: f => tr(100, rise(f), 0, f < 0.03 ? 0.001 : 1 + 0.2 * Math.sin(f * 70)) }
  } });
};

// 4. 1958: Explorer 1 flies its long orbit through the radiation belts;
// the satellite points along the dashed path and follows it on tap
S.explorer = function () {
  const d = design(404);
  night(d, 50, (x, y) => y < 120);
  d.part('ground', 0).earthCurve(270, 140, { seed: 2 });
  d.part('path', 0);
  for (const [r, c] of [[150, C.orange], [162, C.flame], [176, C.red]]) d.running(d.ring(100, 270, r, r * 0.92, 60, Math.PI * 1.15, Math.PI * 1.85), 2, 2.6, c, { w: 1 });
  // its orbit: a tall ellipse round Earth; only the part above Earth is sewn
  const O = { cx: 100, cy: 230, rx: 88, ry: 160 };
  const pt = a => [O.cx + Math.cos(a) * O.rx, O.cy + Math.sin(a) * O.ry];
  const ang = a => { const [x, y] = pt(a), [x2, y2] = pt(a + 0.02); return Math.atan2(y2 - y, x2 - x) * 180 / Math.PI; };
  const path = []; for (let i = 0; i <= 60; i++) { const p = pt(Math.PI * (1.08 + 0.84 * i / 60)); if (Math.hypot(p[0] - 100, p[1] - 270) > 142 && d.hoop(...p)) path.push(p); }
  d.running(path, 1.6, 2.2, C.cream, { w: 0.85 });
  // the satellite, drawn pointing +x: nose cone, instruments, rocket stage, four whip aerials
  d.part('main', 1).mover('sat', [0, 0]);
  d.fillPoly([[20, 0], [10, -3.5], [10, 3.5]], 0, C.silver, { max: 4 });
  d.fillRect(-2, -3.5, 10, 3.5, 0, C.greyL, { max: 5 });
  d.back([[4, -3.5], [4, 3.5]], 2, C.red, { w: 0.9 });
  d.fillRect(-24, -3, -2, 3, 0, C.silver, { max: 8 });
  d.back([[-13, -3], [-13, 3]], 2, C.navy, { w: 0.9 });
  d.fillPoly([[-24, -3], [-24, 3], [-30, 5], [-30, -5]], 0, C.grey, { max: 4 });
  for (const [dx, dy] of [[6, -14], [6, 14], [-8, -12], [-8, 12]]) d.back([[0, 0], [dx, dy]], 3, C.white, { w: 0.6 });
  const REST = Math.PI * 1.42, [rx, ry] = pt(REST);
  return d.svg({ anims: { sat: {
    rest: `translate(${rx}px,${ry}px) rotate(${ang(REST)}deg)`,
    frame: f => { const a = Math.PI * (1.12 + 0.76 * f), [x, y] = pt(a); return tr(x, y, ang(a)); }
  } } });
};

// 5. Early 1960s: a small capsule on its path, first up and down, then round Earth
S.capsule = function () {
  const d = design(505);
  night(d, 45, (x, y) => y < 140);
  d.part('ground', 0).earthCurve(250, 120, { seed: 6 });
  d.part('path', 0);
  const hop = []; for (let i = 0; i <= 30; i++) { const t = i / 30; hop.push([30 + t * 60, 148 - Math.sin(t * Math.PI) * 70]); }
  d.running(hop, 1.6, 2.4, C.cream, { w: 0.85 });
  d.running(d.ring(100, 250, 150, 162, 70, Math.PI * 1.2, Math.PI * 1.8), 1.6, 2.4, C.star, { w: 0.85 });
  d.part('main', 1).mover('cap', [140, 64]);
  // the cone capsule, blunt heat shield down-left, nose up-right
  d.fillPoly([[-7, 6], [7, 6], [3, -8], [-3, -8]], 90, C.greyD, { max: 6 });
  d.fillRect(-3, -12, 3, -8, 90, C.greyD, { max: 4 });
  for (let y = -6; y < 6; y += 2.4) d.back([[-6 + (6 - y) * 0.15, y], [6 - (6 - y) * 0.15, y]], 3, C.grey, { w: 0.5 });
  d.fillEll(0, 7, 8, 1.8, 0, C.bark, { max: 6 });
  d.knot(0, -2, C.sky, 1.6);
  return d.svg({ anims: { cap: {
    rest: 'translate(140px,64px) rotate(35deg)',
    frame: f => { const a = Math.PI * (1.2 + 0.6 * f); return tr(100 + Math.cos(a) * 150, 250 + Math.sin(a) * 162, 35 + f * 60); }
  } } });
};

// 6. 1965: a spacewalk. A two-seat spacecraft (dark cone with a white
// service section behind it), its hatch open; an astronaut floats outside
// on a gold cord, a little gas gun in hand.
S.spacewalk = function () {
  const d = design(606);
  night(d, 40, (x, y) => y < 128 && !(x < 112 && y > 54 && y < 126));
  d.part('ground', 0).earthCurve(280, 140, { seed: 9 });
  d.part('main', 1);
  // spacecraft, nose to the left (the two-seat kind of 1965): a dark cone
  // lit from the top, ribbed, with two windows and the open hatch on top;
  // a white service section widening behind it with stripes and thrusters
  const ax = 14, ay = 92;
  const lit = (top, mid, low) => (x, y) => (y < ay - 6 ? top : (y < ay + 6 ? mid : low));
  d.fillRect(ax, ay - 6, ax + 9, ay + 6, 0, lit(C.grey, C.greyD, C.black), { max: 5 });                       // nose drum
  d.fillPoly([[ax + 9, ay - 9], [ax + 46, ay - 19], [ax + 46, ay + 19], [ax + 9, ay + 9]], 90, lit(C.greyD, '#2a2b30', C.black), { max: 7 });   // cone
  for (let x = ax + 13; x < ax + 46; x += 3) { const h = 9 + (x - ax - 9) * 0.27; d.back([[x, ay - h], [x, ay + h]], 4, C.grey, { w: 0.4 }); }
  d.fillPoly([[ax + 20, ay - 11], [ax + 27, ay - 13], [ax + 27, ay - 7], [ax + 20, ay - 5.5]], 90, C.sky, { max: 3 });   // windows
  d.fillPoly([[ax + 31, ay - 14], [ax + 38, ay - 16], [ax + 38, ay - 9.5], [ax + 31, ay - 8]], 90, C.sky, { max: 3 });
  d.fillPoly([[ax + 29, ay - 15], [ax + 40, ay - 18], [ax + 44, ay - 31], [ax + 33, ay - 28]], 70, C.greyD, { max: 4 }); // open hatch
  d.back([[ax + 29, ay - 15], [ax + 40, ay - 18]], 2, C.grey, { w: 0.6 });
  d.fillPoly([[ax + 46, ay - 19], [ax + 56, ay - 21], [ax + 56, ay + 21], [ax + 46, ay + 19]], 90, lit(C.white, C.greyL, C.grey), { max: 7 });  // retro section
  d.fillPoly([[ax + 56, ay - 21], [ax + 84, ay - 30], [ax + 84, ay + 30], [ax + 56, ay + 21]], 90, lit(C.white, C.white, C.greyL), { max: 8 }); // adapter
  for (const x of [ax + 63, ax + 70, ax + 77]) { const h = 21 + (x - ax - 56) * 0.32; d.back([[x, ay - h], [x, ay + h]], 3, C.greyL, { w: 0.5 }); }
  d.back([[ax + 56, ay - 21], [ax + 56, ay + 21]], 3, C.grey, { w: 0.7 });
  for (const y of [ay - 24, ay + 24]) d.knot(ax + 86, y, C.greyD, 1.6);                                     // thrusters
  d.chain([[ax + 84, ay - 30], [ax + 84, ay + 30]], 2.6, C.greyL);
  // the gold cord from the hatch to the astronaut
  d.part('path', 1);
  const cord = []; for (let i = 0; i <= 18; i++) { const t = i / 18; cord.push([ax + 36 + t * 80, ay - 17 - Math.sin(t * Math.PI) * 22 + t * 6]); }
  d.chain(cord, 2.4, C.gold);
  // the astronaut: helmet with gold visor, white suit, chest pack, gloves, boots
  d.part('front', 2).mover('astro', [136, 84]);
  d.fillCirc(0, -14, 5.6, 90, C.white, { max: 6 });
  d.fillEll(1.2, -14, 3.8, 3, 90, C.gold, { max: 4 });
  d.fillRect(-6, -8, 6, 7, 90, C.white, { max: 7 });
  d.fillRect(-3.5, -6, 3.5, -1, 0, C.greyL, { max: 4 });                     // chest pack
  d.knot(-1.5, -3.5, C.red, 0.9).knot(1.5, -3.5, C.blue, 0.9);
  d.back([[-6, -6], [-12, -12]], 2, C.white, { w: 2.6 }).knot(-12.5, -12.5, C.greyD, 1.6);   // arm holding the cord
  d.back([[6, -6], [12, -2]], 2, C.white, { w: 2.6 }).knot(12.8, -1.6, C.greyD, 1.6);
  d.back([[12.8, -1.6], [17, -4]], 2, C.silver, { w: 0.8 });                 // little gas gun
  d.back([[-3, 7], [-6, 16]], 2, C.white, { w: 3 }).back([[3, 7], [7, 15]], 2, C.white, { w: 3 });
  d.knot(-6.4, 17, C.greyD, 2).knot(7.5, 16, C.greyD, 2);
  return d.svg({ anims: { astro: { frame: f => tr(136 + Math.sin(f * TAU) * 6, 84 - Math.sin(f * TAU * 2) * 4, Math.sin(f * TAU) * 18) } } });
};

// 7. 20 July 1969: the Moon landing
S.moonLanding = function () {
  const d = design(1969);
  const H = x => 141 + 4.5 * Math.sin(x * 0.045) + 2.5 * Math.sin(x * 0.12 + 1.3);
  const ORB = { cx: 112, cy: 152, rx: 68, ry: 104 };
  const orbitPt = a => [ORB.cx + Math.cos(a) * ORB.rx, ORB.cy + Math.sin(a) * ORB.ry];
  const onOrbit = (x, y) => Math.abs(Math.hypot((x - ORB.cx) / ORB.rx, (y - ORB.cy) / ORB.ry) - 1) < 0.07;
  const EX = 46, EY = 50, ER = 19;
  night(d, 46, (x, y) => y < H(x) - 8 && Math.hypot(x - EX, y - EY) > ER + 6 && Math.hypot(x - 100, y - 105) > 24 &&
    Math.hypot(x - 152, y - 105) > 14 && Math.hypot(x - 60, y - 125) > 14 && !onOrbit(x, y));
  d.part('ground', 0);
  const craters = [[40, 164, 9], [150, 157, 11], [118, 183, 7], [76, 187, 6], [152, 180, 5], [26, 150, 4.5], [98, 166, 4]];
  const moonCol = (x, y) => {
    for (const [cx, cy, r] of craters) { const e = ((x - cx) / r) ** 2 + ((y - cy) / (r * 0.4)) ** 2; if (e < 1) return e < 0.55 ? C.moon3 : C.moon2; }
    const n = d.fbm(x * 0.035, y * 0.06, 3);
    return n > 0.6 ? C.moon2 : (n < 0.36 ? C.moonHi : C.moon1);
  };
  d.satin((x, y) => d.hoop(x, y) && y > H(x), [0, 125, 200, 200], 3, moonCol, { max: 10, gap: 1.05 });
  for (const [cx, cy, r] of craters) d.chain(d.ring(cx, cy - 0.5, r * 1.05, r * 0.45, 16, Math.PI * 1.05, Math.PI * 1.95), 2.2, C.moonHi);
  const hz = []; for (let x = 4; x <= 196; x += 4) if (d.hoop(x, H(x))) hz.push([x, H(x)]);
  d.chain(hz, 2.4, C.moonHi);
  // Earth: Africa, Europe and Arabia, ice caps, clouds, shadow on the right
  d.part('far', 0);
  const land = [
    [[-0.38, -0.12], [-0.15, -0.22], [0.05, -0.2], [0.2, -0.1], [0.38, 0.02], [0.45, 0.12], [0.3, 0.25], [0.25, 0.45], [0.12, 0.68], [0.02, 0.75], [-0.05, 0.6], [-0.08, 0.35], [-0.2, 0.15], [-0.4, 0.08], [-0.45, -0.02]],
    [[-0.3, -0.35], [-0.2, -0.6], [0.0, -0.72], [0.2, -0.7], [0.35, -0.55], [0.3, -0.42], [0.12, -0.4], [0.02, -0.3], [-0.15, -0.32]],
    [[0.38, -0.12], [0.62, -0.05], [0.56, 0.15], [0.45, 0.12], [0.4, 0.0]],
    [[0.5, 0.45], [0.58, 0.42], [0.6, 0.6], [0.52, 0.66]],
    [[-0.99, 0.05], [-0.8, 0.1], [-0.74, 0.3], [-0.9, 0.52], [-0.99, 0.3]]
  ].map(p => d.inPoly(p.map(([x, y]) => [EX + x * ER, EY + y * ER])));
  const earthCol = (x, y) => {
    const u = (x - EX) / ER, v = (y - EY) / ER, dark = u * 0.75 + v * 0.65 > 0.42;
    if (v < -0.86 || v > 0.88) return dark ? C.grey : C.white;
    if (land.some(f => f(x, y))) return (v > -0.24 && v < 0.12 && u > -0.4 && u < 0.62) ? (dark ? C.sandD : C.sand) : (dark ? C.landD : C.land);
    return dark ? C.seaD : C.sea;
  };
  d.fillCirc(EX, EY, ER, 32, earthCol, { max: 8, gap: 0.95 });
  d.back(d.ring(EX - 3, EY - 6, 11, 3.5, 12, Math.PI * 0.95, Math.PI * 1.75), 2, C.white, { w: 0.85 });
  d.back(d.ring(EX + 2, EY + 9, 8, 2.4, 10, Math.PI * 0.7, Math.PI * 1.4), 2, C.white, { w: 0.85 });
  d.chain(d.ring(EX, EY, ER + 0.9, ER + 0.9, 48), 2.6, C.sky);
  // the lander
  d.part('main', 1);
  const foil = (x, y) => (d.fbm(x * 0.4, y * 0.4, 21) > 0.5 ? C.gold : C.goldD);
  d.fillPoly([[86, 113], [114, 113], [115, 128], [85, 128]], 90, foil, { max: 7 });
  const asc = [[89, 113], [89, 101], [94, 93], [106, 93], [112, 99], [112, 113]];
  d.fillPoly(asc, 4, C.silver, { max: 9 });
  d.fillRect(94, 98, 99, 104, 0, C.black, { max: 6 });
  d.fillRect(102, 103, 108, 111, 90, C.grey, { max: 8 });
  d.back(asc.concat([asc[0]]), 2.4, C.grey, { w: 0.85 });
  d.back([[87, 125], [74, 145]], 2.6, C.silver).back([[113, 125], [126, 145]], 2.6, C.silver);
  d.back([[92, 128], [86, 147]], 2.6, C.grey).back([[108, 128], [114, 147]], 2.6, C.grey);
  for (const [x, y] of [[74, 146], [126, 146], [86, 148], [114, 148]]) d.fillEll(x, y, 3.4, 1.3, 0, C.silver, { max: 8 });
  d.back([[106, 93], [110, 85]], 2, C.silver, { w: 0.8 });
  d.fillEll(110.5, 84, 3.2, 1.2, 0, C.white, { max: 8 });
  d.back([[86, 120.5], [114.5, 120.5]], 2, C.goldD, { w: 0.6 }).back([[100, 113.5], [100, 127.5]], 2, C.goldD, { w: 0.6 });
  for (let i = 0; i < 5; i++) { const y = 130 + i * 2.2, dx = (y - 128) * 0.25; d.back([[96.5 - dx, y], [99.5 - dx, y]], 3, C.silver, { w: 0.5 }); }
  // the flag
  d.part('detail', 1);
  d.back([[142, 142], [142, 99]], 2.4, C.silver).back([[142, 99.5], [161, 99.5]], 2.4, C.silver, { w: 0.8 });
  d.fillRect(143, 100.5, 161, 112, 0, (x, y) => (x < 150.5 && y < 106) ? C.navy : (Math.floor((y - 100.5) / (11.5 / 7)) % 2 ? C.white : C.red), { max: 9, gap: 0.92 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) d.knot(144.5 + c * 2.8, 102.2 + r * 2.5, C.white, 0.75);
  d.running([[84, 149], [77, 148.5], [70, 147.5], [66, 146.5]], 1.1, 1.8, C.moon3, { w: 1.3 });
  // the astronaut (hops on tap)
  d.part('front', 1).mover('astro', [60, 136]);
  d.fillRect(-7, -12, -2.5, -1.5, 90, C.grey, { max: 8 });
  d.fillRect(-4.5, -9.5, 4.5, 1, 90, C.white, { max: 9 });
  d.fillCirc(0, -14, 4.6, 90, C.white, { max: 9 });
  d.fillEll(1, -13.6, 3.0, 2.3, 90, C.gold, { max: 6 });
  d.back([[-4, -8], [-8.5, -1]], 2.2, C.white, { w: 2.2 }).back([[4, -8], [8.5, -2.5]], 2.2, C.white, { w: 2.2 });
  d.back([[-2.5, 1], [-3.5, 9]], 2.4, C.white, { w: 2.6 }).back([[2.5, 1], [3.5, 9]], 2.4, C.white, { w: 2.6 });
  d.knot(-3.7, 9.6, C.grey, 1.9).knot(3.7, 9.6, C.grey, 1.9);
  // the command module's orbit over the horizon, and the module
  d.part('path', 2).still();
  const orb = []; for (let i = 0; i <= 80; i++) { const p = orbitPt(Math.PI + i / 80 * Math.PI); if (p[1] < H(p[0]) - 1.5) orb.push(p); }
  d.running(orb, 1.6, 2.2, C.cream, { w: 0.9 });
  d.part('mover', 2).mover('csm', [0, 0]);
  d.fillRect(-12, -5, 2, 5, 90, C.silver, { max: 6 });
  d.fillPoly([[2, -5], [11, -1.6], [11, 1.6], [2, 5]], 90, C.white, { max: 6 });
  d.fillPoly([[-12, -2.4], [-17.5, -4.2], [-17.5, 4.2], [-12, 2.4]], 90, C.grey, { max: 6 });
  d.back([[-6, -5], [-6, 5]], 2, C.grey, { w: 0.6 }).knot(6.5, -1.2, C.navy, 1.2);
  const tang = a => { const [x, y] = orbitPt(a), [x2, y2] = orbitPt(a + 0.03); return Math.atan2(y2 - y, x2 - x) * 180 / Math.PI; };
  const REST = Math.PI * 1.62, [rx, ry] = orbitPt(REST);
  const HOP = [0, -1.5, -3.5, -5, -5.6, -5, -3.5, -1.5, 0];
  return d.svg({ anims: {
    astro: { frame: f => tr(60, 136 + (HOP[Math.round(f * 28) % 10] || 0)) },
    csm: {
      rest: `translate(${rx}px,${ry}px) rotate(${tang(REST)}deg)`,
      frame: f => { const a = Math.PI * (1.02 + 0.96 * f), [x, y] = orbitPt(a); return tr(x, y, tang(a)) + `;opacity:${y > H(x) - 3 ? 0 : 1}`; }
    }
  } });
};

// 8. 1977: Voyager on its long path past Jupiter and Saturn
S.voyager = function () {
  const d = design(808);
  night(d, 70, (x, y) => Math.hypot(x - 52, y - 140) > 22 && Math.hypot(x - 128, y - 82) > 26);
  d.part('path', 0);
  const path = []; for (let i = 0; i <= 40; i++) { const t = i / 40; path.push([18 + t * 170, 168 - t * 150 + Math.sin(t * Math.PI) * 30]); }
  d.running(path, 1.6, 2.4, C.cream, { w: 0.85 });
  d.part('far', 0);
  d.fillCirc(52, 140, 16, 0, (x, y) => (Math.floor((y - 124) / 3.4) % 2 ? C.jup1 : C.jup2), { max: 8 });
  d.fillEll(57, 145, 3, 1.8, 0, C.redD, { max: 4 });
  d.fillCirc(128, 82, 11, 0, (x, y) => (Math.floor((y - 71) / 3) % 2 ? C.sat1 : C.sat2), { max: 7 });
  d.chain(d.ring(128, 82, 24, 6, 32, Math.PI * -0.05, Math.PI * 1.05), 2.4, C.sat1);
  d.back(d.ring(128, 82, 24, 6, 20, Math.PI * 1.05, Math.PI * 1.95), 2.4, C.sat2, { w: 0.8 });
  d.part('main', 1).mover('probe', [92, 96]);
  // dish, body, long boom, power unit and the golden record
  d.fillEll(0, -4, 11, 4, 0, C.white, { max: 8 });
  d.back([[0, -4], [0, -10]], 2, C.greyL, { w: 0.7 });
  d.fillRect(-4, 0, 4, 5, 90, C.greyD, { max: 4 });
  d.back([[4, 2], [24, 10]], 2.4, C.silver, { w: 0.6 }).back([[-4, 2], [-15, 6]], 2.4, C.silver, { w: 0.6 });
  d.fillRect(-18, 4, -13, 8, 0, C.grey, { max: 4 });
  d.knot(0, 3, C.gold, 2.2);
  return d.svg({ anims: { probe: { frame: f => tr(92 + f * 60, 96 - f * 50 + Math.sin(f * Math.PI) * -10, f * 20) } } });
};

// 9. 1981: the Space Shuttle lifts off
S.shuttle = function () {
  const d = design(909);
  d.part('sky', 0);
  d.satin((x, y) => d.hoop(x, y) && y < 60, [0, 0, 200, 62], 0, (x, y) => (y < 30 ? C.navy : C.seaD), { max: 12, gap: 1.4 });
  night(d, 20, (x, y) => y < 50);
  d.part('ground', 0);
  d.satin((x, y) => d.hoop(x, y) && y > 168, [0, 166, 200, 200], 0, C.grassD, { max: 10 });
  // launch tower
  d.back([[140, 168], [140, 70]], 2.4, C.red, { w: 1.2 }).back([[150, 168], [150, 70]], 2.4, C.red, { w: 1.2 });
  for (let y = 76; y < 168; y += 9) d.back([[140, y], [150, y + 6]], 3, C.red, { w: 0.6 });
  d.part('main', 1).mover('stack', [100, 0]);
  // orange tank, two white boosters, the orbiter on its front
  d.fillPoly([[-5, 70], [5, 70], [8, 80], [8, 150], [-8, 150], [-8, 80]], 90, C.orange, { max: 9 });
  d.fillPoly([[-14, 84], [-10, 84], [-10, 150], [-14, 150]], 90, C.white, { max: 9 }).fillPoly([[-12, 78], [-10, 84], [-14, 84]], 90, C.white, { max: 3 });
  d.fillPoly([[10, 84], [14, 84], [14, 150], [10, 150]], 90, C.white, { max: 9 }).fillPoly([[12, 78], [14, 84], [10, 84]], 90, C.white, { max: 3 });
  d.fillPoly([[-4, 96], [4, 96], [6, 140], [16, 152], [-16, 152], [-6, 140]], 90, C.white, { max: 8 });
  d.fillPoly([[-6, 140], [6, 140], [16, 152], [-16, 152]], 0, C.black, { max: 8, gap: 1.4 });
  d.knot(0, 102, C.black, 1.4);
  d.part('mover', 2).mover('fire', [100, 0]);
  for (const x of [-12, 0, 12]) d.fillPoly([[x - 3, 153], [x + 3, 153], [x, 168]], 90, C.flame, { max: 5 });
  d.part('front', 2).still();
  for (let i = 0; i < 26; i++) { const a = d.R() * Math.PI, r = 6 + d.R() * 14; d.knot(100 + Math.cos(a) * (20 + r * 1.6), 168 - Math.sin(a) * r * 0.6, d.R() < 0.5 ? C.white : C.greyL, 2.4 + d.R() * 2); }
  const rise = f => -Math.pow(f, 1.8) * 90;
  return d.svg({ anims: { stack: { frame: f => tr(100, rise(f)) }, fire: { frame: f => tr(100, rise(f), 0, 1 + 0.15 * Math.sin(f * 60)) } } });
};

// 10. 1990: Hubble in orbit
S.hubble = function () {
  const d = design(1990);
  night(d, 60, (x, y) => y < 150 && Math.hypot(x - 100, y - 85) > 38);
  d.part('ground', 0).earthCurve(300, 150, { seed: 4 });
  d.part('main', 1).mover('hst', [100, 86]);
  // silver tube with its open door, two blue solar wings on arms
  d.fillRect(-28, -9, 22, 9, 0, (x, y) => (Math.abs(y) > 6.5 ? C.greyL : C.silver), { max: 9 });
  d.back([[-6, -9], [-6, 9]], 2, C.grey, { w: 0.6 }).back([[8, -9], [8, 9]], 2, C.grey, { w: 0.6 });
  d.fillEll(22, 0, 2.2, 9, 0, C.black, { max: 5 });
  d.fillPoly([[22, -9], [34, -14], [34, -11], [24, -6]], 20, C.silver, { max: 5 });   // aperture door, open
  for (const s of [-1, 1]) {
    d.back([[-8, s * 9], [-8, s * 16]], 2, C.grey, { w: 0.6 });
    d.fillRect(-22, s > 0 ? 16 : -38, 6, s > 0 ? 38 : -16, 0, (x, y) => ((Math.floor((x + 22) / 4) + Math.floor(y / 4)) % 2 ? C.blue : C.navy), { max: 4 });
    d.back([[-22, s * 27], [6, s * 27]], 2.4, C.gold, { w: 0.5 });
  }
  return d.svg({ anims: { hst: { frame: f => tr(100 + Math.sin(f * TAU) * 4, 86 + Math.sin(f * TAU) * 2, Math.sin(f * TAU) * 12) } } });
};

// 11. Since 2000: the International Space Station
S.station = function () {
  const d = design(2000);
  night(d, 50, (x, y) => y < 150 && Math.abs(y - 88) > 34);
  d.part('ground', 0).earthCurve(290, 140, { seed: 12 });
  d.part('main', 1).mover('iss', [100, 88]);
  // long truss, modules across the middle, four pairs of gold solar wings, radiators
  d.back([[-70, 0], [70, 0]], 2.4, C.silver, { w: 1.6 });
  for (let x = -66; x <= 66; x += 6) d.back([[x, -2], [x + 3, 2]], 3, C.grey, { w: 0.5 });
  d.fillRect(-6, -2, 6, 22, 90, C.white, { max: 8 }).fillRect(-4, -22, 4, -2, 90, C.white, { max: 8 });
  d.fillRect(-16, 12, 16, 18, 0, C.white, { max: 9 });
  d.fillRect(-3, -8, 3, -4, 0, C.greyL, { max: 3 });
  for (const x of [-60, -44, 44, 60]) for (const s of [-1, 1]) {
    d.fillRect(x - 5, s > 0 ? 3 : -33, x + 5, s > 0 ? 33 : -3, 90, (xx, yy) => (Math.floor(Math.abs(yy) / 5) % 2 ? C.gold : C.goldD), { max: 5 });
  }
  d.fillRect(-28, -14, -14, -4, 0, C.white, { max: 5 }).fillRect(14, 4, 28, 14, 0, C.white, { max: 5 });
  return d.svg({ anims: { iss: { frame: f => tr(100 + (f - 0.5) * 30, 88 + Math.sin(f * Math.PI) * -6, (f - 0.5) * 8) } } });
};

// 11b. Rockets that come back: a booster lands upright on its pad, legs
// out and engine firing. Tap: it comes down from the sky and touches down.
S.landing = function () {
  const d = design(2015);
  d.part('sky', 0);
  d.satin((x, y) => d.hoop(x, y) && y < 150, [0, 0, 200, 152], 0, (x, y) => (y < 70 ? C.navy : (y < 120 ? C.seaD : '#c9744a')), { max: 22, gap: 1.3 });
  d.stars(25, (x, y) => y < 70);
  d.part('ground', 0);
  d.satin((x, y) => d.hoop(x, y) && y >= 150, [0, 148, 200, 200], 0, (x, y) => (d.fbm(x * 0.06, y * 0.1, 4) > 0.55 ? C.grassD : '#6b6f5e'), { max: 14 });
  // the landing pad: a pale circle with a big X
  d.fillEll(100, 164, 42, 8, 0, C.greyL, { max: 10 });
  d.chain(d.ring(100, 164, 42, 8, 32), 2.4, C.white);
  d.back([[84, 160], [116, 168]], 2.4, C.yellow, { w: 1.4 }).back([[84, 168], [116, 160]], 2.4, C.yellow, { w: 1.4 });
  // the booster, drawn round the centre of its engines (0,0)
  d.part('main', 1).mover('booster', [100, 158]);
  d.fillRect(-5.5, -92, 5.5, -4, 90, (x, y) => (x < -1.5 ? C.white : (x < 3 ? C.greyL : C.grey)), { max: 9 });   // white body, lit from the left
  d.fillRect(-5.5, -100, 5.5, -92, 90, C.black, { max: 4 });                                                  // black top band
  d.back([[-5.5, -60], [5.5, -60]], 2, C.grey, { w: 0.5 }).back([[-5.5, -30], [5.5, -30]], 2, C.grey, { w: 0.5 });
  d.fillRect(-11, -98, -5.5, -94, 0, C.greyD, { max: 3 }).fillRect(5.5, -98, 11, -94, 0, C.greyD, { max: 3 });     // grid fins
  d.back([[-5, -16], [-17, 2]], 2.4, C.black, { w: 1.4 }).back([[5, -16], [17, 2]], 2.4, C.black, { w: 1.4 });     // landing legs
  d.back([[-3, -10], [-11, 2]], 2.4, C.greyD, { w: 0.9 }).back([[3, -10], [11, 2]], 2.4, C.greyD, { w: 0.9 });
  d.fillRect(-4.5, -4, 4.5, 0, 0, C.greyD, { max: 3 });                                                        // engines
  // its flame and the dust it blows up (only while it comes down)
  d.part('mover', 1).mover('flame', [100, 158]);
  d.fillPoly([[-4, 0], [4, 0], [6, 10], [0, 26], [-6, 10]], 90, C.flame, { max: 4 });
  d.fillPoly([[-2.2, 1], [2.2, 1], [3, 8], [0, 18], [-3, 8]], 90, C.yellow, { max: 3 });
  d.part('front', 2).mover('dust', [100, 166]);
  for (let i = 0; i < 16; i++) { const a = d.R() * Math.PI, r = 8 + d.R() * 22; d.knot(Math.cos(a) * r * 1.8, -Math.sin(a) * r * 0.35, d.R() < 0.5 ? C.greyL : C.cream, 2.2 + d.R() * 2); }
  const y = f => -110 * Math.pow(1 - Math.min(1, f / 0.85), 2);      // slows down as it nears the pad
  return d.svg({ anims: {
    booster: { frame: f => tr(100, 158 + y(f)) },
    flame: { rest: 'translate(100px,158px) scale(0.001)', frame: f => tr(100, 158 + y(f), 0, f < 0.88 ? 1 + 0.2 * Math.sin(f * 80) : 0.001) },
    dust: { rest: 'translate(100px,166px) scale(0.001)', frame: f => tr(100, 166, 0, f < 0.45 ? 0.001 : Math.min(1.2, (f - 0.45) * 3)) + `;opacity:${f > 0.92 ? 0 : 1}` }
  } });
};

// 12. Mars: a six-wheeled rover and its little helicopter
S.mars = function () {
  const d = design(2021);
  d.part('sky', 0);
  d.satin((x, y) => d.hoop(x, y) && y < 120, [0, 0, 200, 122], 0, (x, y) => (y < 60 ? '#c9946a' : '#ddb08a'), { max: 20, gap: 1.25 });
  d.part('ground', 0);
  const g = x => 124 + 6 * Math.sin(x * 0.05) + 3 * Math.sin(x * 0.13);
  d.satin((x, y) => d.hoop(x, y) && y > g(x), [0, 115, 200, 200], 3, (x, y) => (d.fbm(x * 0.06, y * 0.06, 7) > 0.58 ? C.marsD : (d.fbm(x * 0.06, y * 0.06, 7) < 0.4 ? C.marsL : C.mars)), { max: 16 });
  for (const [x, y, r] of [[40, 160, 6], [150, 175, 8], [170, 140, 4], [64, 182, 5]]) d.fillEll(x, y, r, r * 0.55, 0, C.marsD, { max: 6 });
  d.part('main', 1).mover('rover', [92, 150]);
  // body, mast with a camera head, arm, six wheels on rocker legs
  d.fillRect(-26, -16, 20, -6, 0, C.white, { max: 9 });
  d.fillRect(-26, -20, -12, -16, 0, C.greyL, { max: 5 });
  d.back([[12, -16], [12, -38]], 2.4, C.greyL, { w: 1.4 });
  d.fillRect(6, -44, 20, -38, 0, C.white, { max: 5 }).knot(10, -41, C.black, 1.4).knot(15, -41, C.black, 1.4);
  d.back([[20, -10], [30, -4], [32, 6]], 2.4, C.greyL, { w: 1 });
  d.back([[-22, -6], [-12, 2], [0, -6], [12, 2], [18, -6]], 2.4, C.grey, { w: 1.2 });
  for (const x of [-24, -6, 14]) { d.fillCirc(x, 5, 5, 0, C.greyD, { max: 5 }); d.chain(d.ring(x, 5, 5.3, 5.3, 14), 2, C.grey, { w: 0.7 }); }
  // the helicopter: two stacked rotors, a body, four legs; it hops on tap
  d.part('mover', 2).mover('heli', [150, 96]);
  d.fillRect(-4, -3, 4, 3, 90, C.greyL, { max: 4 });
  d.back([[0, -3], [0, -10]], 2, C.grey, { w: 0.7 });
  d.back([[-14, -9], [14, -11]], 3, C.white, { w: 1 }).back([[-14, -12], [14, -10]], 3, C.white, { w: 1 });
  for (const x of [-6, -2, 2, 6]) d.back([[x * 0.5, 3], [x, 9]], 2, C.greyL, { w: 0.6 });
  d.fillRect(-3, -6, 3, -4, 0, C.gold, { max: 3 });
  return d.svg({ anims: {
    rover: { frame: f => tr(92 + f * 14, 150) },
    heli: { frame: f => tr(150, 96 - Math.sin(f * Math.PI) * 34, Math.sin(f * TAU * 3) * 4) }
  } });
};

// 13. Webb, the way it is usually pictured: a big diamond-shaped
// sunshield of five layers (silver on top, purple edges showing below),
// and standing on it a large gold mirror of 18 hexagons, its small
// secondary mirror held out in front on three thin struts. Under the
// shield sits the spacecraft box with its solar panel. Tap: the gold
// mirror catches the light.
S.webb = function () {
  const d = design(2512);
  night(d, 80, (x, y) => !(y > 40 && y < 182 && x > 10 && x < 190 && (y > 108 || Math.abs(x - 100) < 46)));
  d.part('far', 0);
  d.fillCirc(32, 52, 8, 30, (x, y) => (d.fbm(x * 0.4, y * 0.4, 3) > 0.52 ? C.land : C.sea), { max: 5 });   // Earth, far away
  // the sunshield: five stacked diamonds, the top one silver, the edges below purple
  d.part('ground', 1);
  const kite = (o, sh) => [[14 + sh, 140 + o], [100, 114 + o], [186 - sh, 140 + o], [100, 172 + o]];
  for (let i = 4; i >= 1; i--) d.fillPoly(kite(i * 2.6, i * 1.5), 8, i % 2 ? C.purple : '#b7a6d6', { max: 16, gap: 1.3 });
  d.fillPoly(kite(0, 0), 8, (x, y) => (d.fbm(x * 0.05, y * 0.12, 6) > 0.58 ? C.white : C.silver), { max: 16, gap: 1.15 });
  d.back([[14, 140], [100, 114], [186, 140]], 3, C.white, { w: 0.6 });
  d.back([[14, 140], [100, 172], [186, 140]], 3, C.greyD, { w: 0.6 });
  // the spacecraft box and solar panel under the shield
  d.part('detail', 1);
  d.fillRect(90, 176, 110, 186, 0, C.greyL, { max: 6 });
  d.fillRect(110, 179, 140, 184, 0, (x) => (Math.floor((x - 110) / 5) % 2 ? C.navy : C.blue), { max: 5 });
  // the gold mirror, standing up on the shield
  d.part('main', 2).mover('mirror', [100, 84]);
  const r = 8.6, w = r * Math.sqrt(3), sq = 0.92;
  const hex = (cx, cy) => Array.from({ length: 6 }, (_, k) => [cx + (r - 0.8) * Math.cos(Math.PI / 6 + k * Math.PI / 3), cy + (r - 0.8) * Math.sin(Math.PI / 6 + k * Math.PI / 3) * sq]);
  for (let row = -2; row <= 2; row++) {
    const n = 5 - Math.abs(row);
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * w, y = row * r * 1.5 * sq;
      if (x === 0 && y === 0) continue;                       // the hole in the middle
      const lit = x + y < 0;
      d.fillPoly(hex(x, y), 70, (xx, yy) => (d.fbm(xx * 0.25 + i * 3, yy * 0.25 + row, 11) > 0.6 ? C.yellow : (lit ? C.gold : C.goldD)), { max: 6, gap: 0.95 });
    }
  }
  d.fillCirc(0, 0, 3.4, 0, C.black, { max: 3 });
  // three struts holding the small secondary mirror out in front
  d.back([[-30, 20], [0, -8]], 2.4, C.greyL, { w: 0.7 }).back([[30, 20], [0, -8]], 2.4, C.greyL, { w: 0.7 }).back([[0, -34], [0, -8]], 2.4, C.greyL, { w: 0.7 });
  d.fillCirc(0, -8, 3.6, 0, C.silver, { max: 4 }).knot(-1, -9, C.white, 1);
  return d.svg({ anims: { mirror: { frame: f => tr(100, 84) + `;opacity:${(0.7 + 0.3 * Math.cos(f * TAU * 3)).toFixed(2)}` } } });
};

window.UPWEGO_SCENES = S;
})();
