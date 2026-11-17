// HOW THINGS WORK AT HOME: the 12 clay machines. Each is up to 16 pieces;
// the slot order matters, because turning the page morphs slot i of the
// last machine into slot i of the next one. Slot 0 is always the main body.
//
// Piece kinds (units: about 1 = 25 cm of clay; the page floor is y = 0):
//   { t: 'ell', p: [x,y,z], s: [rx,ry,rz] }              ellipsoid
//   { t: 'box', p, s: [hx,hy,hz], r: round }             rounded box
//   { t: 'cap', a: [x,y,z], b: [x,y,z], r }              capsule (a coil)
//   { t: 'tor', p, R, r, axis: 0 flat / 1 facing us / 2 side-on }  ring
//   { t: 'cyl', p, rad, h, r }  upright cylinder;  'cylz' = facing us
// plus c: colour, k: how softly it melts into the rest (0.01 = separate
// piece, 0.1 = smeared in), rz / ry: turn (radians), e: glow 0..1.
//
// anim(pieces, t, act, G, frame): changes this picture's pieces. t = seconds
// since the morph settled; act = seconds since the action started (tap or
// the automatic first run), -1 when idle; G.jx / G.sy shake / squash it all.
(function () {
'use strict';
const { clamp, lerp, ease, easeBack, smooth } = window.ATHOME_KIT;
const bump = (a, b, t) => smooth(a, a + (b - a) * 0.2, t) * (1 - smooth(b - (b - a) * 0.2, b, t));
const C = {
  red: '#c8513c', red2: '#b5442f', cream: '#ecdcbc', slate: '#3d5a80', teal: '#3f8f8a', yellow: '#f2c14e',
  white: '#f1ede4', grey: '#9a9a96', greyL: '#c9c8c2', dark: '#3a3a3e', brown: '#7a4b2e', tan: '#d9a35a',
  green: '#5a9a4e', greenD: '#3f7a3a', blue: '#5b8fd0', blueL: '#a9c8ec', pink: '#e7a0a8', pinkD: '#cf7f8a',
  orange: '#e48a3a', appliance: '#c3d0d7', applianceL: '#d8e1e6', glow: '#ffd36a', screen: '#8fd0ff', skin: '#e9bf98', hair: '#6b4228', ice: '#cfe8f6'
};
const steamPuffs = (P, from, base, t, level, n) => {
  for (let i = 0; i < n; i++) {
    const f = (t * (0.32 + level * 0.25) + i / n) % 1;
    const r = (0.05 + 0.14 * f) * level * (1 - smooth(0.7, 1, f)) * smooth(0, 0.08, f);
    const q = P[base + i];
    q.p = [from[0] + 0.03 + f * 0.12 + Math.sin(f * 5 + i) * 0.07 * f, from[1] + 0.07 + f, from[2] + Math.cos(f * 4 + i) * 0.07 * f];
    q.s = [r, r, r];
  }
};

window.ATHOME_LUMP = [{ t: 'ell', p: [0, 0.68, 0], s: [0.68, 0.68, 0.68], c: C.red, k: 0.06 }];

const M = [];

// 1. Light switch and bulb
M.push({
  label: 'A clay light switch on a little wall, joined by a cord to a lamp with a round bulb.',
  actTime: 2.6,
  pieces: [
    { t: 'box', p: [-0.75, 0.62, -0.1], s: [0.42, 0.62, 0.16], r: 0.08, c: '#d9c7a4' },       // wall block
    { t: 'box', p: [-0.75, 0.82, 0.08], s: [0.22, 0.3, 0.05], r: 0.05, c: C.cream, k: 0.02 }, // switch plate
    { t: 'box', p: [-0.75, 0.86, 0.16], s: [0.06, 0.13, 0.05], r: 0.03, c: C.grey, k: 0.01, rz: 0.35 }, // toggle
    { t: 'ell', p: [0.6, 1.3, 0], s: [0.4, 0.44, 0.4], c: '#f3e6b4', k: 0.04 },               // bulb
    { t: 'ell', p: [0.6, 0.93, 0], s: [0.2, 0.14, 0.2], c: '#f3e6b4', k: 0.06 },
    { t: 'cyl', p: [0.6, 0.76, 0], rad: 0.17, h: 0.1, r: 0.03, c: C.grey, k: 0.02 },          // screw base
    { t: 'cap', a: [0.6, 0.12, 0], b: [0.6, 0.66, 0], r: 0.06, c: C.slate, k: 0.03 },          // lamp stand
    { t: 'cyl', p: [0.6, 0.06, 0], rad: 0.42, h: 0.06, r: 0.04, c: C.slate, k: 0.03 },
    { t: 'cap', a: [-0.4, 0.2, 0.05], b: [0.05, 0.05, 0.2], r: 0.035, c: C.dark, k: 0.02 },     // cord
    { t: 'cap', a: [0.05, 0.05, 0.2], b: [0.42, 0.08, 0.1], r: 0.035, c: C.dark, k: 0.02 }
  ],
  anim(P, t, act) {
    const on = act >= 0 && act > 0.15 && act < 2.4;
    P[2].rz = on ? -0.35 : 0.35;
    const glow = act >= 0 ? smooth(0.15, 0.35, act) * (1 - smooth(2.2, 2.45, act)) : 0;
    P[3].e = glow; P[4].e = glow * 0.8;
    if (glow > 0) { P[3].c = C.glow; P[4].c = C.glow; }
  }
});

// 2. Kettle
M.push({
  label: 'A clay kettle on its base, with a spout, a handle and a switch.',
  actTime: 4.2,
  pieces: [
    { t: 'cyl', p: [0, 0.74, 0], rad: 0.6, h: 0.56, r: 0.14, c: C.red },                       // body
    { t: 'ell', p: [0, 0.45, 0], s: [0.7, 0.34, 0.7], c: C.red2, k: 0.1 },                    // belly
    { t: 'cyl', p: [0, 0.075, 0], rad: 0.8, h: 0.075, r: 0.045, c: C.slate, k: 0.035 },        // base
    { t: 'ell', p: [0, 1.33, 0], s: [0.46, 0.12, 0.46], c: C.red2, k: 0.06 },                 // lid
    { t: 'ell', p: [0, 1.52, 0], s: [0.095, 0.095, 0.095], c: C.cream, k: 0.03 },             // knob
    { t: 'cap', a: [0.5, 0.62, 0], b: [1.02, 1.18, 0], r: 0.11, c: C.red, k: 0.09 },          // spout
    { t: 'tor', p: [-0.68, 0.82, 0], R: 0.34, r: 0.085, axis: 1, c: C.red2, k: 0.07 },         // handle
    { t: 'box', p: [-0.82, 0.34, 0], s: [0.075, 0.05, 0.1], r: 0.025, c: C.cream, k: 0.02 },  // switch
    { t: 'ell', p: [0.36, 0.13, 0.7], s: [0.05, 0.05, 0.05], c: '#b98a2a', k: 0.01 },          // light
    ...[0, 1, 2, 3, 4].map(() => ({ t: 'ell', p: [1.05, 1.25, 0], s: [0, 0, 0], c: C.white, k: 0.12 }))  // steam
  ],
  anim(P, t, act, G, frame) {
    const boil = act >= 0 ? smooth(0.8, 1.8, act) * (1 - smooth(3.4, 4.2, act)) : 0;
    const press = act >= 0 && act < 3.4 ? smooth(0, 0.15, act) : 0;
    P[7].p[1] -= press * 0.05;
    P[8].e = press; if (press) P[8].c = C.glow;
    steamPuffs(P, [1.04, 1.2, 0], 9, t, Math.max(boil, 0.25), 5);
    const b = act >= 0 ? smooth(0.4, 1.4, act) * (1 - smooth(3.0, 3.6, act)) : 0;
    G.jx = (frame % 2 ? 1 : -1) * 0.008 * b;
    G.sy = 1 + Math.sin(frame * 2.1) * 0.012 * b;
  }
});

// 3. Coffee machine
M.push({
  label: 'A clay coffee machine filling a cup, with beans in the top.',
  actTime: 3.6,
  pieces: [
    { t: 'box', p: [-0.2, 0.85, -0.15], s: [0.6, 0.8, 0.45], r: 0.14, c: C.dark },              // body
    { t: 'box', p: [0.0, 1.42, 0.32], s: [0.42, 0.16, 0.24], r: 0.08, c: C.grey, k: 0.05 },     // head
    { t: 'ell', p: [-0.2, 1.72, -0.15], s: [0.42, 0.16, 0.36], c: C.brown, k: 0.04 },           // beans on top
    { t: 'cyl', p: [0.0, 1.2, 0.42], rad: 0.07, h: 0.08, r: 0.02, c: C.greyL, k: 0.02 },        // spout
    { t: 'box', p: [0.0, 0.07, 0.38], s: [0.46, 0.05, 0.26], r: 0.03, c: C.grey, k: 0.03 },     // tray
    { t: 'cyl', p: [0.0, 0.36, 0.42], rad: 0.24, h: 0.24, r: 0.06, c: C.cream, k: 0.01 },       // cup
    { t: 'tor', p: [0.27, 0.38, 0.42], R: 0.1, r: 0.03, axis: 1, c: C.cream, k: 0.02 },          // cup handle
    { t: 'ell', p: [0.0, 0.5, 0.42], s: [0.2, 0.03, 0.2], c: C.brown, k: 0.01 },                // coffee in the cup
    { t: 'ell', p: [0.0, 0.52, 0.42], s: [0, 0, 0], c: C.cream, k: 0.03 },                      // foam
    { t: 'ell', p: [0.36, 1.05, 0.32], s: [0.06, 0.06, 0.06], c: '#8a6a2a', k: 0.01 },          // button
    ...[0, 1, 2].map(() => ({ t: 'ell', p: [0, 1.1, 0.42], s: [0, 0, 0], c: C.brown, k: 0.04 })) // drips
  ],
  anim(P, t, act) {
    const pour = act >= 0 ? smooth(0.2, 0.5, act) * (1 - smooth(2.4, 2.7, act)) : 0;
    P[9].e = pour; if (pour) P[9].c = C.glow;
    const fill = act >= 0 ? smooth(0.4, 2.6, act) : 1;
    P[7].p[1] = lerp(0.3, 0.55, fill); P[7].s = [0.2, 0.03 + fill * 0.02, 0.2];
    const foam = act >= 0 ? smooth(2.4, 3.2, act) : 1;
    P[8].p[1] = P[7].p[1] + 0.04; P[8].s = [0.18 * foam, 0.05 * foam, 0.18 * foam];
    for (let i = 0; i < 3; i++) {
      const f = (t * 1.6 + i / 3) % 1, q = P[10 + i];
      q.p = [0, lerp(1.1, 0.6, f), 0.42];
      const r = 0.045 * pour; q.s = [r * 0.8, r * 1.3, r * 0.8];
    }
  }
});

// 4. Toaster
M.push({
  label: 'A clay toaster with two slices of bread and a lever on the side.',
  actTime: 3.4,
  pieces: [
    { t: 'box', p: [0, 0.55, 0], s: [0.85, 0.48, 0.5], r: 0.24, c: C.teal },                  // body
    { t: 'box', p: [-0.25, 1.0, 0], s: [0.1, 0.34, 0.36], r: 0.07, c: C.tan, k: 0.02 },       // toast
    { t: 'box', p: [0.25, 1.0, 0], s: [0.1, 0.34, 0.36], r: 0.07, c: C.tan, k: 0.02 },
    { t: 'box', p: [0.95, 0.8, 0], s: [0.1, 0.05, 0.14], r: 0.03, c: C.cream, k: 0.02 },      // lever
    { t: 'ell', p: [0.45, 0.45, 0.5], s: [0.08, 0.08, 0.05], c: C.cream, k: 0.02 },           // dial
    { t: 'box', p: [-0.25, 1.02, 0], s: [0.13, 0.012, 0.38], r: 0.01, c: C.orange, k: 0.01 }, // glowing slots
    { t: 'box', p: [0.25, 1.02, 0], s: [0.13, 0.012, 0.38], r: 0.01, c: C.orange, k: 0.01 },
    { t: 'ell', p: [-0.6, 0.06, 0.3], s: [0.12, 0.06, 0.12], c: C.dark, k: 0.02 },            // feet
    { t: 'ell', p: [0.6, 0.06, 0.3], s: [0.12, 0.06, 0.12], c: C.dark, k: 0.02 }
  ],
  anim(P, t, act) {
    if (act < 0) return;
    const down = smooth(0.1, 0.35, act) * (1 - smooth(2.6, 2.7, act));
    const pop = act > 2.6 ? easeBack((act - 2.6) / 0.35) : 0;
    const y = lerp(1.0, 0.62, down) + 0.28 * pop * (1 - smooth(3.0, 3.4, act));
    P[1].p[1] = y; P[2].p[1] = y;
    P[3].p[1] = lerp(0.8, 0.4, down);
    const heat = smooth(0.4, 0.8, act) * (1 - smooth(2.5, 2.7, act));
    P[5].e = heat; P[6].e = heat;
    if (act > 1) { P[1].c = '#b07436'; P[2].c = '#b07436'; }
  }
});

// 5. Fridge
const FR = { hinge: [-0.68, 1.15, 0.5], w: 0.68 };
const doorAt = (q, a, local) => {                   // place a piece by its offset from the hinge
  const c = Math.cos(a), s = Math.sin(a);
  q.p = [FR.hinge[0] + c * local[0] - s * local[2], FR.hinge[1] + local[1], FR.hinge[2] + s * local[0] + c * local[2]];
  q.ry = a;
};
M.push({
  label: 'A clay fridge; its door opens to show shelves of food inside and cold mist rolls out.',
  actTime: 3.0,
  pieces: [
    { t: 'box', p: [0, 1.15, -0.1], s: [0.68, 1.1, 0.55], r: 0.12, c: C.appliance },          // body
    { t: 'box', p: [0, 1.15, 0.53], s: [0.68, 1.08, 0.05], r: 0.04, c: C.applianceL, k: 0.015 }, // door
    { t: 'box', p: [0.55, 1.15, 0.62], s: [0.035, 0.28, 0.035], r: 0.03, c: C.dark, k: 0.015 },  // handle
    { t: 'box', p: [0, 1.12, 0.42], s: [0.6, 0.98, 0.025], r: 0.03, c: '#b9d7e6', k: 0.01 },      // the cold blue inside
    { t: 'box', p: [0, 0.78, 0.47], s: [0.58, 0.018, 0.07], r: 0.012, c: C.white, k: 0.005 },     // shelves
    { t: 'box', p: [0, 1.32, 0.47], s: [0.58, 0.018, 0.07], r: 0.012, c: C.white, k: 0.005 },
    { t: 'ell', p: [-0.32, 1.45, 0.5], s: [0.13, 0.12, 0.08], c: C.red, k: 0.01 },               // apple
    { t: 'cap', a: [0.3, 1.36, 0.5], b: [0.3, 1.78, 0.5], r: 0.07, c: C.green, k: 0.01 },        // bottle
    { t: 'box', p: [-0.1, 0.88, 0.5], s: [0.18, 0.08, 0.06], r: 0.03, c: C.yellow, k: 0.01 },    // cheese
    { t: 'box', p: [0.32, 0.98, 0.5], s: [0.1, 0.18, 0.06], r: 0.03, c: '#f4f1ea', k: 0.01 },    // milk
    { t: 'ell', p: [-0.38, 0.86, 0.5], s: [0.07, 0.09, 0.06], c: '#f0dcc0', k: 0.01 },           // egg
    { t: 'ell', p: [0, 2.0, 0.42], s: [0.12, 0.04, 0.03], c: C.cream, k: 0.01 },                 // light
    ...[0, 1, 2].map(() => ({ t: 'ell', p: [0, 0.2, 0.6], s: [0, 0, 0], c: C.ice, k: 0.12 }))  // mist
  ],
  anim(P, t, act) {
    const open = act >= 0 ? easeBack(smooth(0.1, 0.6, act)) * (1 - smooth(2.3, 2.8, act)) : 0;
    const a = open * 1.35;
    doorAt(P[1], a, [FR.w, 0, 0.03]);
    doorAt(P[2], a, [FR.w * 2 - 0.13, 0, 0.12]);
    P[11].e = smooth(0.2, 0.4, act) * (1 - smooth(2.3, 2.5, act)); if (P[11].e) P[11].c = C.glow;
    for (let i = 0; i < 3; i++) {
      const f = act >= 0 ? clamp((act - 0.5 - i * 0.25) / 1.8, 0, 1) : 0, r = 0.2 * Math.sin(Math.PI * f);
      P[12 + i].p = [-0.3 + i * 0.3, 0.15 + f * 0.1, 0.6 + f * 0.6];
      P[12 + i].s = [r * 1.4, r * 0.7, r];
    }
  }
});

// 6. Washing machine
M.push({
  label: 'A clay washing machine; clothes tumble behind the round door.',
  actTime: 3.4,
  pieces: [
    { t: 'box', p: [0, 0.82, 0], s: [0.72, 0.8, 0.6], r: 0.14, c: C.appliance },                   // body
    { t: 'tor', p: [0, 0.72, 0.6], R: 0.36, r: 0.07, axis: 1, c: C.grey, k: 0.02 },            // door ring
    { t: 'ell', p: [0, 0.72, 0.6], s: [0.31, 0.31, 0.05], c: C.blueL, k: 0.02 },              // glass
    { t: 'ell', p: [0, 0.9, 0.62], s: [0.1, 0.07, 0.04], c: C.red, k: 0.01 },                  // clothes
    { t: 'ell', p: [0.15, 0.62, 0.62], s: [0.09, 0.07, 0.04], c: C.yellow, k: 0.01 },
    { t: 'ell', p: [-0.15, 0.62, 0.62], s: [0.09, 0.08, 0.04], c: C.green, k: 0.01 },
    { t: 'box', p: [0, 1.42, 0.58], s: [0.6, 0.11, 0.03], r: 0.03, c: C.greyL, k: 0.02 },     // panel
    { t: 'ell', p: [0.42, 1.42, 0.62], s: [0.08, 0.08, 0.04], c: C.blue, k: 0.01 },           // knob
    ...[0, 1, 2].map(i => ({ t: 'ell', p: [-0.15 + i * 0.15, 0.48, 0.63], s: [0.05, 0.05, 0.03], c: '#ffffff', k: 0.04 })) // suds
  ],
  anim(P, t, act, G, frame) {
    const spin = act >= 0 ? smooth(1.4, 1.8, act) * (1 - smooth(3.0, 3.4, act)) : 0;
    const speed = 0.7 + spin * 9;
    for (let i = 0; i < 3; i++) {
      const a = t * speed + i * 2.1;
      P[3 + i].p = [Math.cos(a) * 0.16, 0.72 + Math.sin(a) * 0.16 - (1 - spin) * 0.05, 0.62];
    }
    P[7].rz = t * 0.5;
    for (let i = 0; i < 3; i++) { const r = 0.05 + 0.03 * Math.sin(t * 3 + i * 2); P[8 + i].s = [r, r, r * 0.6]; }
    G.jx = (frame % 2 ? 1 : -1) * 0.012 * spin;
  }
});

// 7. Hair dryer: standing on its handle, drying a wet teddy bear
M.push({
  label: 'A clay hair dryer blowing warm air at a wet teddy bear, whose fluffy tuft lifts and waves.',
  actTime: 3.0,
  pieces: [
    { t: 'ell', p: [-0.5, 1.2, 0], s: [0.5, 0.3, 0.3], c: C.pink },                            // body
    { t: 'cap', a: [-0.1, 1.2, 0], b: [0.3, 1.2, 0], r: 0.18, c: C.pinkD, k: 0.06 },          // nozzle
    { t: 'tor', p: [-0.97, 1.2, 0], R: 0.17, r: 0.05, axis: 2, c: C.dark, k: 0.03 },          // back vent
    { t: 'cap', a: [-0.55, 0.95, 0], b: [-0.62, 0.14, 0.05], r: 0.13, c: C.pink, k: 0.06 },   // handle, standing on the floor
    { t: 'ell', p: [-0.52, 0.75, 0.13], s: [0.05, 0.05, 0.04], c: C.cream, k: 0.01 },         // button
    { t: 'ell', p: [1.0, 0.36, 0], s: [0.32, 0.36, 0.27], c: C.tan },                          // teddy body
    { t: 'ell', p: [1.0, 0.92, 0], s: [0.25, 0.23, 0.22], c: C.tan, k: 0.05 },                // head
    { t: 'ell', p: [0.82, 1.12, 0], s: [0.08, 0.08, 0.06], c: C.brown, k: 0.03 },             // ears
    { t: 'ell', p: [1.18, 1.12, 0], s: [0.08, 0.08, 0.06], c: C.brown, k: 0.03 },
    { t: 'ell', p: [0.9, 0.86, 0.17], s: [0.09, 0.07, 0.07], c: C.cream, k: 0.03 },           // snout, facing the dryer
    { t: 'ell', p: [0.84, 0.1, 0.12], s: [0.11, 0.08, 0.13], c: C.brown, k: 0.04 },           // feet
    { t: 'ell', p: [1.16, 0.1, 0.12], s: [0.11, 0.08, 0.13], c: C.brown, k: 0.04 },
    { t: 'cap', a: [0.96, 1.12, 0], b: [0.92, 1.24, 0], r: 0.035, c: C.brown, k: 0.03 },      // fluffy tuft
    ...[0, 1, 2].map(() => ({ t: 'ell', p: [0.5, 1.2, 0], s: [0, 0, 0], c: '#f6c99a', k: 0.1 })) // warm air
  ],
  anim(P, t, act) {
    const blow = act >= 0 ? smooth(0.1, 0.5, act) * (1 - smooth(2.5, 3.0, act)) : 0.2;
    for (let i = 0; i < 3; i++) {
      const f = (t * (0.8 + blow) + i / 3) % 1, r = (0.05 + 0.07 * f) * blow * Math.sin(Math.PI * f);
      P[13 + i].p = [0.5 + f * 0.25, 1.2 - f * 0.25 + Math.sin(f * 7 + i) * 0.04, Math.cos(f * 5 + i) * 0.05];
      P[13 + i].s = [r * 1.4, r, r];
    }
    const lift = blow * (0.6 + 0.4 * Math.sin(t * 14));
    P[12].b = [0.92 + lift * 0.12, 1.24 + lift * 0.02, 0];        // the tuft streams away from the air
    P[7].rz = -lift * 0.2; P[8].rz = -lift * 0.3;
  }
});

// 8. Vacuum cleaner
M.push({
  label: 'A clay vacuum cleaner sucking crumbs up its hose.',
  actTime: 3.0,
  pieces: [
    { t: 'ell', p: [-0.6, 0.48, 0], s: [0.55, 0.42, 0.44], c: C.red },                         // body
    { t: 'cylz', p: [-0.82, 0.18, 0.42], rad: 0.18, h: 0.05, r: 0.03, c: C.dark, k: 0.02 },    // wheels
    { t: 'cylz', p: [-0.32, 0.18, 0.42], rad: 0.18, h: 0.05, r: 0.03, c: C.dark, k: 0.02 },
    { t: 'cap', a: [-0.6, 0.86, 0], b: [-0.45, 1.1, 0], r: 0.07, c: C.dark, k: 0.04 },          // carry handle
    { t: 'cap', a: [-0.12, 0.6, 0], b: [0.25, 1.05, 0.05], r: 0.08, c: C.grey, k: 0.04 },       // hose
    { t: 'cap', a: [0.25, 1.05, 0.05], b: [0.6, 0.85, 0.05], r: 0.08, c: C.grey, k: 0.04 },
    { t: 'cap', a: [0.6, 0.85, 0.05], b: [0.85, 0.16, 0.05], r: 0.07, c: C.greyL, k: 0.04 },    // wand
    { t: 'box', p: [0.95, 0.08, 0.05], s: [0.3, 0.06, 0.18], r: 0.04, c: C.dark, k: 0.04 },    // nozzle
    { t: 'ell', p: [-0.6, 0.5, 0.4], s: [0.18, 0.16, 0.06], c: C.blueL, k: 0.02 },             // dust bin window
    ...[0, 1, 2, 3].map(i => ({ t: 'ell', p: [1.35 + i * 0.12, 0.04, 0.25 - i * 0.1], s: [0.05, 0.035, 0.05], c: i % 2 ? C.tan : C.cream, k: 0.01 })) // crumbs
  ],
  anim(P, t, act) {
    for (let i = 0; i < 4; i++) {
      const f = act >= 0 ? clamp((act - 0.3 - i * 0.35) / 0.9, 0, 1) : 0;
      if (f <= 0) continue;
      const path = f < 0.4 ? [lerp(1.35 + i * 0.12, 1.0, f / 0.4), 0.04, lerp(0.25 - i * 0.1, 0.05, f / 0.4)]
        : [lerp(0.85, 0.25, (f - 0.4) / 0.6), lerp(0.16, 1.05, (f - 0.4) / 0.6), 0.05];
      P[9 + i].p = path;
      const r = 0.05 * (1 - smooth(0.85, 1, f));
      P[9 + i].s = [r, r * 0.8, r];
    }
    const full = act >= 0 ? smooth(1, 2.6, act) : 0;
    P[8].c = full > 0.5 ? C.tan : C.blueL;
  }
});

// 9. Air conditioner
M.push({
  label: 'A clay air conditioner blowing cool air on a wilting plant and a melting ice cube.',
  actTime: 3.4,
  pieces: [
    { t: 'box', p: [-0.1, 1.78, -0.2], s: [0.95, 0.27, 0.25], r: 0.13, c: C.appliance },           // unit
    { t: 'box', p: [-0.1, 1.53, 0.05], s: [0.8, 0.025, 0.07], r: 0.02, c: C.greyL, k: 0.015 }, // flap
    { t: 'ell', p: [0.7, 1.82, 0.06], s: [0.04, 0.04, 0.02], c: C.green, k: 0.01 },           // light
    { t: 'cyl', p: [0.6, 0.26, 0.25], rad: 0.24, h: 0.26, r: 0.06, c: C.orange },              // pot
    { t: 'ell', p: [0.6, 0.55, 0.25], s: [0.22, 0.05, 0.22], c: C.brown, k: 0.04 },           // soil
    { t: 'ell', p: [0.42, 0.72, 0.25], s: [0.08, 0.22, 0.05], c: C.green, k: 0.05, rz: 1.1 },  // leaves
    { t: 'ell', p: [0.78, 0.72, 0.25], s: [0.08, 0.22, 0.05], c: C.greenD, k: 0.05, rz: -1.1 },
    { t: 'ell', p: [0.6, 0.8, 0.3], s: [0.07, 0.2, 0.05], c: C.green, k: 0.05, rz: 0.6 },
    { t: 'box', p: [-0.5, 0.15, 0.45], s: [0.15, 0.14, 0.15], r: 0.03, c: C.ice, k: 0.02 },    // ice cube
    { t: 'ell', p: [-0.5, 0.01, 0.45], s: [0.0, 0.0, 0.0], c: C.blueL, k: 0.03 },             // puddle
    ...[0, 1, 2, 3].map(() => ({ t: 'ell', p: [0, 1.45, 0.2], s: [0, 0, 0], c: C.blueL, k: 0.1 })) // cool air
  ],
  anim(P, t, act) {
    const run = act >= 0 ? smooth(0.1, 0.4, act) : 0;
    P[1].p = [-0.1, 1.53 - run * 0.05, 0.05 + run * 0.08];
    P[2].e = run; P[2].c = run ? C.blueL : C.green;
    for (let i = 0; i < 4; i++) {
      const f = (t * 0.7 + i / 4) % 1, r = 0.12 * run * Math.sin(Math.PI * f);
      P[10 + i].p = [-0.4 + i * 0.25 + f * 0.25, 1.45 - f * 0.9, 0.2 + f * 0.25];
      P[10 + i].s = [r * 1.3, r * 0.6, r];
    }
    const perk = act >= 0 ? smooth(0.6, 2.2, act) : 0;          // the plant cheers up
    P[5].rz = lerp(1.1, 0.5, perk); P[6].rz = lerp(-1.1, -0.5, perk); P[7].rz = lerp(0.6, 0.05, perk);
    P[5].p = [lerp(0.42, 0.48, perk), lerp(0.72, 0.78, perk), 0.25];
    P[6].p = [lerp(0.78, 0.72, perk), lerp(0.72, 0.78, perk), 0.25];
    P[7].p = [0.6, lerp(0.8, 0.85, perk), 0.3];
    const melt = act >= 0 ? smooth(0.3, 3.0, act) : 0;          // the ice cube cools things down... and melts
    const k = 1 - melt * 0.6;
    P[8].s = [0.15 * k, 0.14 * k, 0.15 * k]; P[8].p = [-0.5, 0.14 * k, 0.45];
    P[9].s = [0.25 * melt, 0.015 * melt, 0.2 * melt];
  }
});

// 10. TV and remote: every press changes the programme
const PROGRAMMES = [
  { sky: '#8fd0ff', ground: C.green, thing: C.yellow },                          // a ball bouncing on grass
  { sky: '#3f7fc9', ground: '#e7c98a', thing: C.orange },                        // a fish swimming over sand
  { sky: '#f2a65a', ground: C.greenD, thing: '#ffe27a' },                        // the sun rising over hills
  { sky: '#1d2550', ground: '#5a5f6a', thing: C.red }                            // a rocket going up
];
let tvChannel = 0, tvLastAct = -1;
M.push({
  label: 'A clay television and remote; each press of the button shows a new programme.',
  actTime: 3.2,
  pieces: [
    { t: 'box', p: [0, 1.2, -0.1], s: [0.98, 0.62, 0.08], r: 0.07, c: C.dark },               // TV
    { t: 'box', p: [0, 1.2, -0.02], s: [0.88, 0.52, 0.012], r: 0.02, c: '#4a4f58', k: 0.01 }, // screen
    { t: 'cap', a: [0, 0.58, -0.1], b: [0, 0.1, -0.1], r: 0.07, c: C.dark, k: 0.04 },           // stand
    { t: 'ell', p: [0, 0.05, -0.1], s: [0.42, 0.05, 0.26], c: C.dark, k: 0.04 },
    { t: 'ell', p: [-0.3, 1.05, 0.01], s: [0, 0, 0], c: C.yellow, k: 0.01 },                  // the programme's star
    { t: 'box', p: [0, 0.82, 0.0], s: [0, 0, 0], r: 0.0, c: C.green, k: 0.01 },               // the programme's ground
    { t: 'box', p: [0.6, 0.07, 0.75], s: [0.12, 0.05, 0.32], r: 0.045, c: C.grey, k: 0.02, ry: 0.4 }, // remote
    { t: 'ell', p: [0.55, 0.13, 0.62], s: [0.045, 0.03, 0.045], c: C.red, k: 0.01 },          // button
    ...[0, 1, 2].map(() => ({ t: 'ell', p: [0.5, 0.2, 0.5], s: [0, 0, 0], c: C.red, k: 0.01 })) // signal
  ],
  anim(P, t, act) {
    if (act >= 0 && (tvLastAct < 0 || act < tvLastAct)) tvChannel = (tvChannel + 1) % PROGRAMMES.length;
    tvLastAct = act;
    const press = act >= 0 && act < 0.3;
    P[7].p[1] = press ? 0.1 : 0.13; P[7].e = press ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const f = act >= 0 ? clamp((act - 0.1 - i * 0.12) / 0.5, 0, 1) : 0, r = f > 0 && f < 1 ? 0.035 : 0;
      P[8 + i].p = [lerp(0.5, 0.2, f), lerp(0.2, 1.0, f), lerp(0.5, 0.05, f)];
      P[8 + i].s = [r, r, r]; P[8 + i].e = 1;
    }
    // a short blink of static, then the new programme
    const on = act >= 0 ? smooth(0.6, 0.8, act) : (t > 0 ? 1 : 0);
    const pr = PROGRAMMES[tvChannel];
    P[1].c = on > 0.5 ? pr.sky : '#4a4f58'; P[1].e = on * 0.7;
    P[5].p = [0, 0.82, 0.0]; P[5].s = [0.86 * on, 0.1 * on, 0.014 * on]; P[5].r = 0.01; P[5].e = on * 0.4; P[5].c = pr.ground;
    let x = 0, y = 1.1, r = 0.1, sx = 1, sy = 1;
    if (tvChannel === 0) { x = Math.sin(t * 1.6) * 0.5; y = 0.95 + Math.abs(Math.sin(t * 4.2)) * 0.35; }
    else if (tvChannel === 1) { x = ((t * 0.35) % 1) * 1.5 - 0.75; y = 1.2 + Math.sin(t * 3) * 0.08; sx = 1.6; sy = 0.8; }
    else if (tvChannel === 2) { const u = (t * 0.12) % 1; x = 0.2; y = 0.85 + u * 0.55; r = 0.14; }
    else { const u = (t * 0.3) % 1; x = -0.3 + u * 0.2; y = 0.85 + u * 0.75; sx = 0.6; sy = 1.6; }
    P[4].p = [x, y, 0.01]; P[4].s = [r * sx * on, r * sy * on, 0.02]; P[4].e = on * 0.5; P[4].c = pr.thing;
  }
});

// 11. Alarm clock and night lamp
const hand = (q, pivot, len, a) => { q.p = [pivot[0] - Math.sin(a) * len, pivot[1] + Math.cos(a) * len, pivot[2]]; q.rz = a; };
M.push({
  label: 'A clay alarm clock with two bells, ticking next to a night lamp.',
  actTime: 2.8,
  pieces: [
    { t: 'cylz', p: [-0.45, 0.78, 0], rad: 0.5, h: 0.18, r: 0.08, c: C.red },                  // clock body
    { t: 'cylz', p: [-0.45, 0.78, 0.17], rad: 0.42, h: 0.02, r: 0.015, c: C.cream, k: 0.02 },  // face
    { t: 'box', p: [-0.45, 0.88, 0.21], s: [0.025, 0.11, 0.012], r: 0.01, c: C.dark, k: 0.005 }, // hour hand
    { t: 'box', p: [-0.45, 0.94, 0.22], s: [0.018, 0.17, 0.012], r: 0.008, c: C.dark, k: 0.005 }, // minute hand
    { t: 'ell', p: [-0.82, 1.28, 0], s: [0.17, 0.15, 0.15], c: C.yellow, k: 0.04 },             // bells
    { t: 'ell', p: [-0.08, 1.28, 0], s: [0.17, 0.15, 0.15], c: C.yellow, k: 0.04 },
    { t: 'cap', a: [-0.45, 1.25, 0], b: [-0.45, 1.42, 0], r: 0.035, c: C.dark, k: 0.03 },       // hammer
    { t: 'ell', p: [-0.75, 0.25, 0.05], s: [0.09, 0.12, 0.09], c: C.dark, k: 0.03 },           // legs
    { t: 'ell', p: [-0.15, 0.25, 0.05], s: [0.09, 0.12, 0.09], c: C.dark, k: 0.03 },
    { t: 'cyl', p: [0.75, 0.05, 0], rad: 0.3, h: 0.05, r: 0.03, c: C.slate, k: 0.03 },          // lamp base
    { t: 'cap', a: [0.75, 0.1, 0], b: [0.75, 1.05, 0], r: 0.04, c: C.slate, k: 0.03 },          // stem
    { t: 'cyl', p: [0.75, 1.15, 0], rad: 0.32, h: 0.18, r: 0.07, c: '#f3e2b0', k: 0.03 },      // shade
    { t: 'ell', p: [0.75, 0.97, 0], s: [0.09, 0.09, 0.09], c: C.glow, k: 0.02, e: 1 }           // bulb
  ],
  anim(P, t, act, G, frame) {
    const piv = [-0.45, 0.78, 0.21];
    hand(P[2], piv, 0.1, -t * 0.05 - 1.0);
    hand(P[3], [piv[0], piv[1], 0.22], 0.16, -Math.floor(t) * (Math.PI / 30));   // ticks once a second
    if (act >= 0) {
      const ring = smooth(0, 0.1, act) * (1 - smooth(1.9, 2.1, act));
      P[6].b = [-0.45 + (frame % 2 ? 0.08 : -0.08) * ring, 1.42, 0];
      P[4].p[0] += (frame % 2 ? 0.01 : -0.01) * ring; P[5].p[0] -= (frame % 2 ? 0.01 : -0.01) * ring;
      G.jx = (frame % 2 ? 0.006 : -0.006) * ring;
      const off = smooth(2.1, 2.2, act);                                            // morning: the lamp clicks off
      P[12].e = 1 - off; if (off > 0.5) P[12].c = C.cream;
    }
  }
});

// 12. Parade: tiny versions of the machines, hopping one after another
const mini = (x) => x;
M.push({
  label: 'A parade of tiny clay machines: a bulb, a kettle, a toaster, a fridge, a television and a clock.',
  actTime: 3.0,
  pieces: [
    { t: 'ell', p: [-0.02, 0.36, 0], s: [0.28, 0.24, 0.28], c: C.red },                       // kettle body
    { t: 'cap', a: [0.18, 0.36, 0], b: [0.36, 0.56, 0], r: 0.05, c: C.red, k: 0.05 },          // kettle spout
    { t: 'ell', p: [-0.02, 0.6, 0], s: [0.18, 0.05, 0.18], c: C.red2, k: 0.04 },              // kettle lid
    { t: 'ell', p: [mini(-1.25), 0.42, 0], s: [0.17, 0.19, 0.17], c: '#f3e6b4', k: 0.02 },    // bulb
    { t: 'cyl', p: [-1.25, 0.15, 0], rad: 0.09, h: 0.12, r: 0.02, c: C.grey, k: 0.03 },
    { t: 'box', p: [-0.72, 0.24, 0], s: [0.26, 0.2, 0.17], r: 0.09, c: C.teal, k: 0.03 },    // toaster
    { t: 'box', p: [-0.72, 0.48, 0], s: [0.1, 0.1, 0.12], r: 0.04, c: C.tan, k: 0.02 },
    { t: 'box', p: [0.62, 0.5, 0], s: [0.2, 0.5, 0.18], r: 0.06, c: C.appliance, k: 0.02 },    // fridge
    { t: 'box', p: [1.1, 0.42, 0], s: [0.26, 0.18, 0.04], r: 0.03, c: C.dark, k: 0.02 },     // TV
    { t: 'box', p: [1.1, 0.42, 0.04], s: [0.22, 0.14, 0.01], r: 0.01, c: C.screen, k: 0.01, e: 0.6 },
    { t: 'cap', a: [1.1, 0.24, 0], b: [1.1, 0.05, 0], r: 0.03, c: C.dark, k: 0.02 },
    { t: 'cylz', p: [1.55, 0.25, 0], rad: 0.2, h: 0.08, r: 0.04, c: C.red, k: 0.02 },        // clock
    { t: 'cylz', p: [1.55, 0.25, 0.08], rad: 0.16, h: 0.01, r: 0.008, c: C.cream, k: 0.01 }
  ],
  anim(P, t, act) {
    // who belongs to which little machine, left to right
    const groups = [[3, 4], [5, 6], [0, 1, 2], [7], [8, 9, 10], [11, 12]];
    groups.forEach((g, n) => {
      const ph = act >= 0 ? clamp((act - n * 0.3) / 0.45, 0, 1) : ((t * 0.5 - n * 0.16) % 1 + 1) % 1;
      const amp = act >= 0 ? 0.35 : 0.06;
      const h = Math.sin(Math.PI * clamp(ph * (act >= 0 ? 1 : 3), 0, 1)) * amp;
      g.forEach(k => {
        const q = P[k], key = q.t === 'cap' ? 'a' : 'p';
        q[key] = [q[key][0], q[key][1] + h, q[key][2]];
        if (q.b) q.b = [q.b[0], q.b[1] + h, q.b[2]];
      });
    });
  }
});

// the parade sits a little left of centre so the clock stays in frame
M[11].pieces.forEach(q => { ['p', 'a', 'b'].forEach(k => { if (q[k]) q[k] = [q[k][0] - 0.15, q[k][1], q[k][2]]; }); });

window.ATHOME_MACHINES = M;
})();
