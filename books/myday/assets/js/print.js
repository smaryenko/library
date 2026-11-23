// MY DAY: the town layout (shared numbers) and the printed ground (one
// canvas texture on the diorama board): grass, garden paths, the road with
// its zebra crossing, sidewalks, the playground's soft red floor, the sand
// pit, the park paths and pond.
//
// Board coordinates: x -23..23 (left..right), z -16..16 (far..near), y up.
(function () {
'use strict';
const C = window.MYDAY;
if (!C.THREE) return;
const { canvas, seeded, TIER } = C;

const BOARD_W = 46, BOARD_D = 32;
const PX = [14, 20, 26][TIER];           // canvas pixels per unit

// Everything that has to line up between the print, the buildings and the
// boy's walking route lives here.
const LAYOUT = {
  board: { w: BOARD_W, d: BOARD_D, edge: 0.9 },
  house: {
    x0: -19.5, x1: -6.0, z0: -8.0, z1: -3.5, floor: 0.12, h: 2.6,
    // room boundaries along x: bedroom | bathroom | hall | kitchen
    walls: [-15.0, -12.0, -9.2], doorZ: -4.65, doorW: 0.95,
    frontDoorX: -10.6
  },
  road: { x0: -4.5, x1: -1.5, walkW: 0.9 },
  crossZ: 1.5, crossW: 1.7,
  school: { x0: 1.0, x1: 11.0, z0: -9.5, z1: -3.5, floor: 0.12, h: 2.8, classX1: 8.0, frontDoorX: 9.5 },
  play: { x0: 2.0, x1: 14.5, z0: 3.6, z1: 12.5, gateX: 5.0 },
  swing: { x: 6.5, z0: 5.0, z1: 8.0, top: 2.0, seatZ: 5.75, seatY: 0.5 },
  slide: { x: 11.2, z: 8.0 },
  sandpit: { x: 4.2, z: 10.8, w: 2.6, d: 1.8 },
  park: { x0: -21.0, x1: -6.4, z0: 3.6, z1: 14.0 },
  pond: { x: -15.5, z: 9.6, rx: 2.6, rz: 1.6 },
  shop: { x0: 14.0, x1: 20.0, z0: -8.5, z1: -4.0, h: 2.4 },
  // garden path from the house's front door out to the crossing
  homePathZ: 1.5
};

// The ground texture
function drawGround() {
  const L = LAYOUT;
  const W = BOARD_W * PX, H = BOARD_D * PX;
  const [c, g] = canvas(W, H);
  const X = x => (x + BOARD_W / 2) * PX, Z = z => (z + BOARD_D / 2) * PX;
  const rect = (x0, z0, x1, z1, col) => { g.fillStyle = col; g.fillRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX); };
  const rr = (x0, z0, x1, z1, r, col) => {
    g.fillStyle = col; g.beginPath();
    g.roundRect ? g.roundRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX, r * PX) : g.rect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX);
    g.fill();
  };
  const path = (pts, w, col) => {
    g.strokeStyle = col; g.lineWidth = w * PX; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke();
  };
  // grass with speckles of lighter and darker green
  g.fillStyle = '#86b95c'; g.fillRect(0, 0, W, H);
  const r = seeded(5);
  for (let i = 0; i < W * H / 60; i++) {
    const v = r();
    g.fillStyle = v < 0.5 ? 'rgba(60,110,40,.18)' : 'rgba(200,230,140,.18)';
    g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  // the road along z, sidewalks each side, centre dashes
  const R = L.road;
  rect(R.x0 - R.walkW, -16, R.x0, 16, '#d9d3c6');
  rect(R.x1, -16, R.x1 + R.walkW, 16, '#d9d3c6');
  for (let z = -16; z < 16; z += 0.8) {           // paving joints
    rect(R.x0 - R.walkW, z, R.x0, z + 0.03, 'rgba(0,0,0,.12)');
    rect(R.x1, z, R.x1 + R.walkW, z + 0.03, 'rgba(0,0,0,.12)');
  }
  rect(R.x0, -16, R.x1, 16, '#5f636a');
  rect(R.x0 - 0.06, -16, R.x0, 16, '#b8b2a5'); rect(R.x1, -16, R.x1 + 0.06, 16, '#b8b2a5');   // kerbs
  const mid = (R.x0 + R.x1) / 2;
  for (let z = -16; z < 16; z += 1.4) {
    if (Math.abs(z - L.crossZ) < L.crossW) continue;
    rect(mid - 0.05, z, mid + 0.05, z + 0.7, '#f2efe4');
  }
  // the zebra crossing: white bars running along the road
  for (let x = R.x0 + 0.15; x < R.x1 - 0.1; x += 0.6) rect(x, L.crossZ - L.crossW / 2, x + 0.32, L.crossZ + L.crossW / 2, '#f4f1e8');
  rect(R.x0, L.crossZ - L.crossW / 2 - 0.5, R.x1, L.crossZ - L.crossW / 2 - 0.4, '#f4f1e8');   // stop lines
  rect(R.x0, L.crossZ + L.crossW / 2 + 0.4, R.x1, L.crossZ + L.crossW / 2 + 0.5, '#f4f1e8');
  // the house: front garden lawn (lighter), path from the door to the road
  const Hs = L.house;
  rr(Hs.x0 - 0.6, Hs.z0 - 0.6, Hs.x1 + 0.6, Hs.z1 + 3.2, 0.4, '#97c66a');
  path([[Hs.frontDoorX, Hs.z1], [Hs.frontDoorX, L.homePathZ], [R.x0 - R.walkW, L.homePathZ]], 1.0, '#e6d3a3');
  // the school yard and its path
  const S = L.school;
  rr(S.x0 - 0.6, S.z0 - 0.6, S.x1 + 0.6, S.z1 + 1.6, 0.3, '#cfc6b2');
  path([[R.x1 + R.walkW, L.crossZ], [S.frontDoorX, L.crossZ], [S.frontDoorX, S.z1]], 1.0, '#e6d3a3');
  // the shop's forecourt
  const Sh = L.shop;
  rr(Sh.x0 - 0.5, Sh.z1, Sh.x1 + 0.5, Sh.z1 + 1.8, 0.2, '#d9d3c6');
  path([[S.frontDoorX, L.crossZ], [17, L.crossZ], [17, Sh.z1 + 1.6]], 0.9, '#e6d3a3');
  // playground: soft red rubber floor, sand pit, a path to the gate
  const P = L.play;
  rr(P.x0, P.z0, P.x1, P.z1, 0.5, '#c8735a');
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(90,30,20,.18)' : 'rgba(255,200,170,.16)';
    g.fillRect(X(P.x0) + r() * (P.x1 - P.x0) * PX, Z(P.z0) + r() * (P.z1 - P.z0) * PX, 2, 2);
  }
  path([[P.gateX, L.crossZ], [P.gateX, P.z0 + 0.4]], 1.0, '#e6d3a3');
  const SP = L.sandpit;
  rr(SP.x - SP.w / 2, SP.z - SP.d / 2, SP.x + SP.w / 2, SP.z + SP.d / 2, 0.2, '#e8d29a');
  // park: winding paths, pond with a darker rim
  const K = L.park;
  path([[R.x0 - R.walkW, L.crossZ], [-6.5, 4.5], [-9, 8.5], [-12.5, 7.6], [Hs.frontDoorX, 4.4], [Hs.frontDoorX, L.homePathZ]], 0.95, '#e2cf9c');
  path([[-9, 8.5], [-11, 12.5], [-18, 12.6], [-19.5, 6]], 0.8, '#e2cf9c');
  const Pd = L.pond;
  g.fillStyle = '#6c9a4c'; g.beginPath(); g.ellipse(X(Pd.x), Z(Pd.z), (Pd.rx + 0.35) * PX, (Pd.rz + 0.35) * PX, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4f93b8'; g.beginPath(); g.ellipse(X(Pd.x), Z(Pd.z), Pd.rx * PX, Pd.rz * PX, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(X(Pd.x - 0.6), Z(Pd.z - 0.4), Pd.rx * 0.5 * PX, Pd.rz * 0.3 * PX, 0, 0, Math.PI * 2); g.fill();
  // flower dots in the park and gardens
  for (let i = 0; i < 260; i++) {
    const x = K.x0 + r() * (K.x1 - K.x0), z = K.z0 + r() * (K.z1 - K.z0);
    if (Math.hypot((x - Pd.x) / Pd.rx, (z - Pd.z) / Pd.rz) < 1.3) continue;
    g.fillStyle = ['#f6e27a', '#f29bb5', '#ffffff', '#b99cf0'][i % 4];
    g.beginPath(); g.arc(X(x), Z(z), PX * 0.07, 0, Math.PI * 2); g.fill();
  }
  return c;
}

window.MYDAY = Object.assign(window.MYDAY, { LAYOUT, drawGround });
})();
