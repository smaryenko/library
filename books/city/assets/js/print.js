// HARBOR CITY: the PRINTED artwork on the two open pages (one canvas for the
// whole spread). Everything flat lives here: sea, quay, roads with markings,
// the construction site's dirt, parks, the runway and the race track. The 3D
// pieces stand on top of it, like a pop-up book.
//
// World → canvas: x -20..20, z -13..13 (the spread), PX px per unit.
(function () {
'use strict';
const { canvas, seeded } = window.CITY;

const SPREAD = { x0: -20, x1: 20, z0: -13, z1: 13 };
const PX = 48;
const W = 40 * PX, H = 26 * PX;
const X = x => (x + 20) * PX, Z = z => (z + 13) * PX;

// shared layout numbers, also used by world.js
const LAYOUT = {
  quayX: -9, quayInner: -6.8, quayRoadX: -6.4,
  mainZ: 1, mainW: 1.1,
  ring: { x0: -5.6, x1: 5.6, z0: -7.6, z1: -1.6, w: 0.7 },
  avenueX: 7.2,
  runwayZ: -11, runwayX0: 8.4, runwayX1: 19.4, taxiZ: -8.8,
  apron: { x0: 8, x1: 19.6, z0: -4.6, z1: -0.7 },
  track: { c1: [12.2, 7.6], c2: [16.4, 7.6], r: 2.8, w: 0.9 },
  jettyZ: 7.6
};

function drawSpread() {
  const [c, g] = canvas(W, H);
  const r = seeded(3);
  const L = LAYOUT;
  const rect = (x0, z0, x1, z1, fill) => { g.fillStyle = fill; g.fillRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX); };
  const line = (pts, w, stroke, dash) => {
    g.save(); g.strokeStyle = stroke; g.lineWidth = w * PX; g.lineCap = 'butt'; g.lineJoin = 'round';
    if (dash) g.setLineDash(dash.map(d => d * PX));
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke(); g.restore();
  };
  const speckle = (x0, z0, x1, z1, n, colors, size = 2) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[i % colors.length];
      g.fillRect(X(x0 + r() * (x1 - x0)), Z(z0 + r() * (z1 - z0)), size, size);
    }
  };

  // paper + grass: mottled patches of different greens, then fine blades
  g.fillStyle = '#efe7d4'; g.fillRect(0, 0, W, H);
  rect(-19.6, -12.6, 19.6, 12.6, '#768f4e');
  for (let i = 0; i < 700; i++) {
    const x = X(-19.6 + r() * 39.2), z = Z(-12.6 + r() * 25.2), rr = (0.3 + r() * 1.2) * PX;
    const gr = g.createRadialGradient(x, z, 0, x, z, rr);
    const col = r() < 0.5 ? '96,122,62' : r() < 0.7 ? '66,92,44' : '138,150,84';
    gr.addColorStop(0, `rgba(${col},.35)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - rr, z - rr, rr * 2, rr * 2);
  }
  speckle(-19.6, -12.6, 19.6, 12.6, 16000, ['#62803f', '#8eaa62', '#6e8a48', '#9bb070'], 2);

  // sea, with a breakwater line printed under the 3D one
  const sea = g.createLinearGradient(0, 0, X(L.quayX), 0);
  sea.addColorStop(0, '#1f4f6e'); sea.addColorStop(1, '#2f6f8c');
  g.fillStyle = sea; g.fillRect(X(-19.6), Z(-12.6), X(L.quayX) - X(-19.6), 25.2 * PX);
  g.strokeStyle = 'rgba(220,240,248,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 260; i++) {
    const x = X(-19.4 + r() * 10.2), z = Z(-12.4 + r() * 24.8);
    g.beginPath(); g.moveTo(x, z); g.quadraticCurveTo(x + 8, z - 4, x + 16, z); g.stroke();
  }

  // quay (concrete) with crane rails and a yellow safety edge
  rect(L.quayX, -12.6, L.quayInner, 12.6, '#b9b2a4');
  speckle(L.quayX, -12.6, L.quayInner, 12.6, 2500, ['#a9a294', '#c6c0b3'], 2);
  line([[L.quayX + 0.08, -12.6], [L.quayX + 0.08, 12.6]], 0.08, '#e0b31a');
  [-8.6, -7.2].forEach(x => line([[x, -3.2], [x, 6.2]], 0.05, '#6d6a64'));
  // container yard markings
  for (let z = -2.4; z < 4.6; z += 0.36) line([[-8.2, z], [-7.0, z]], 0.02, 'rgba(255,255,255,.55)');

  // roads
  const road = '#4b4d50';
  rect(L.quayRoadX - 0.4, -12.6, L.quayRoadX + 0.4, 12.6, road);               // quay road
  rect(-6.8, L.mainZ - L.mainW / 2, 19.6, L.mainZ + L.mainW / 2, road);         // main road
  const R = L.ring;
  // town blocks (pavement) inside / around the ring, then the ring road
  rect(R.x0 - 0.5, -12.6, 6.6, L.mainZ - L.mainW / 2, '#c9c3b6');
  speckle(R.x0 - 0.5, -12.6, 6.6, 0.4, 3000, ['#bdb7aa', '#d6d0c3'], 2);
  line([[R.x0, R.z0], [R.x1, R.z0], [R.x1, R.z1], [R.x0, R.z1], [R.x0, R.z0]], R.w, road);
  line([[R.x0, R.z1], [R.x0, L.mainZ]], R.w, road);
  line([[R.x1, R.z1], [R.x1, L.mainZ]], R.w, road);
  rect(L.avenueX - 0.45, -0.7, L.avenueX + 0.45, L.mainZ, road);               // airport access
  // markings: dashed centre lines, a zebra at the bus stop
  line([[-6.8, L.mainZ], [19.6, L.mainZ]], 0.05, '#efe9d8', [0.4, 0.35]);
  line([[L.quayRoadX, -12.6], [L.quayRoadX, 12.6]], 0.05, '#efe9d8', [0.4, 0.35]);
  line([[R.x0, R.z0], [R.x1, R.z0], [R.x1, R.z1], [R.x0, R.z1], [R.x0, R.z0]], 0.04, '#efe9d8', [0.3, 0.3]);
  for (let i = 0; i < 6; i++) rect(8.2 + i * 0.16, L.mainZ - L.mainW / 2 + 0.05, 8.28 + i * 0.16, L.mainZ + L.mainW / 2 - 0.05, '#efe9d8');
  // asphalt grain, repair patches, manholes and drain grates
  speckle(-6.8, L.mainZ - L.mainW / 2, 19.6, L.mainZ + L.mainW / 2, 9000, ['#3f4144', '#56585b', '#606265'], 2);
  speckle(L.quayRoadX - 0.4, -12.6, L.quayRoadX + 0.4, 12.6, 5000, ['#3f4144', '#56585b', '#606265'], 2);
  for (let i = 0; i < 12; i++) {
    g.fillStyle = 'rgba(30,30,32,.35)';
    g.fillRect(X(-6 + r() * 25), Z(L.mainZ - 0.45 + r() * 0.6), (0.3 + r() * 0.6) * PX, (0.15 + r() * 0.2) * PX);
  }
  for (let x = -5; x < 19; x += 2.7) {
    g.fillStyle = '#2e2f31'; g.beginPath(); g.arc(X(x), Z(L.mainZ + 0.22), 0.09 * PX, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#6a6c6f'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#2a2b2d'; g.fillRect(X(x + 1.2), Z(L.mainZ - L.mainW / 2 + 0.02), 0.16 * PX, 0.06 * PX);
  }
  // pavements along the main road
  rect(-6.0, L.mainZ + L.mainW / 2, 19.6, L.mainZ + L.mainW / 2 + 0.35, '#cfc9bb');
  rect(-6.0, L.mainZ - L.mainW / 2 - 0.35, 19.6, L.mainZ - L.mainW / 2, '#cfc9bb');
  // paving slab joints on both pavements
  g.strokeStyle = 'rgba(90,84,72,.25)'; g.lineWidth = 1;
  for (let x = -6; x < 19.6; x += 0.18) [L.mainZ + L.mainW / 2, L.mainZ - L.mainW / 2 - 0.35].forEach(z0 => {
    g.beginPath(); g.moveTo(X(x), Z(z0)); g.lineTo(X(x), Z(z0 + 0.35)); g.stroke();
  });

  // construction site: dirt, tyre tracks, a dug pit
  rect(-5.8, 2.1, 1.8, 12.4, '#a88559');
  speckle(-5.8, 2.1, 1.8, 12.4, 5000, ['#94744c', '#b89566', '#7d603f'], 3);
  for (let i = 0; i < 14; i++) {
    const z = 2.6 + r() * 9.4;
    line([[-5.6, z], [1.6, z + (r() - 0.5) * 1.5]], 0.06, 'rgba(70,52,32,.35)');
  }
  g.fillStyle = 'rgba(70,50,30,.55)';
  g.beginPath(); g.ellipse(X(-2.6), Z(4.3), 0.7 * PX, 0.5 * PX, 0, 0, Math.PI * 2); g.fill();
  // fresh-road bed for the roller
  rect(-1.4, 11.0, 1.6, 11.8, '#6f6a62');

  // hospital lot and park paths
  rect(2.4, 1.9, 6.6, 5.8, '#cfcac0');
  line([[3.0, 9.0], [5.0, 8.0], [7.2, 9.4]], 0.18, '#d8c7a0');
  line([[4.2, 6.2], [5.0, 8.0], [4.4, 12.2]], 0.18, '#d8c7a0');

  // airport: apron, taxiway, runway with markings
  rect(L.apron.x0, L.apron.z0, L.apron.x1, L.apron.z1, '#bdb8ae');
  speckle(L.apron.x0, L.apron.z0, L.apron.x1, L.apron.z1, 2200, ['#b0aba1', '#cbc6bc'], 2);
  rect(8.6, L.taxiZ - 0.4, 19.4, L.taxiZ + 0.4, '#5a5c5e');
  [9.6, 13.8, 18.6].forEach(x => rect(x - 0.4, L.taxiZ, x + 0.4, L.apron.z0, '#5a5c5e'));
  line([[8.6, L.taxiZ], [19.4, L.taxiZ]], 0.04, '#e8c22a');
  rect(L.runwayX0, L.runwayZ - 0.85, L.runwayX1, L.runwayZ + 0.85, '#38393b');
  line([[L.runwayX0 + 1.2, L.runwayZ], [L.runwayX1 - 1.2, L.runwayZ]], 0.06, '#f2f0ea', [0.5, 0.4]);
  [L.runwayX0 + 0.15, L.runwayX1 - 0.65].forEach(x0 => {
    for (let i = 0; i < 8; i++) rect(x0, L.runwayZ - 0.7 + i * 0.18, x0 + 0.5, L.runwayZ - 0.62 + i * 0.18, '#f2f0ea');
  });
  g.save(); g.fillStyle = '#f2f0ea'; g.font = `bold ${0.5 * PX}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.translate(X(L.runwayX0 + 1.0), Z(L.runwayZ)); g.rotate(Math.PI / 2); g.fillText('09', 0, 0); g.restore();
  g.save(); g.fillStyle = '#f2f0ea'; g.font = `bold ${0.5 * PX}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.translate(X(L.runwayX1 - 1.0), Z(L.runwayZ)); g.rotate(-Math.PI / 2); g.fillText('27', 0, 0); g.restore();
  line([[L.runwayX0, L.runwayZ - 0.8], [L.runwayX1, L.runwayZ - 0.8]], 0.03, '#f2f0ea');
  line([[L.runwayX0, L.runwayZ + 0.8], [L.runwayX1, L.runwayZ + 0.8]], 0.03, '#f2f0ea');

  // race track: stadium loop, red-white kerbs on the bends, start grid
  const T = L.track;
  const loop = () => {
    g.beginPath();
    g.moveTo(X(T.c1[0]), Z(T.c1[1] + T.r));
    g.lineTo(X(T.c2[0]), Z(T.c2[1] + T.r));
    g.arc(X(T.c2[0]), Z(T.c2[1]), T.r * PX, Math.PI / 2, -Math.PI / 2, true);
    g.lineTo(X(T.c1[0]), Z(T.c1[1] - T.r));
    g.arc(X(T.c1[0]), Z(T.c1[1]), T.r * PX, -Math.PI / 2, Math.PI / 2, true);
    g.closePath();
  };
  g.save();
  g.lineWidth = (T.w + 0.24) * PX; g.strokeStyle = '#d9d3c4'; loop(); g.stroke();       // run-off
  g.lineWidth = T.w * PX; g.strokeStyle = '#3a3b3d'; loop(); g.stroke();
  g.lineWidth = 0.035 * PX; g.strokeStyle = '#f2f0ea'; g.setLineDash([]); loop(); g.stroke();
  g.restore();
  [[T.c1, Math.PI / 2, Math.PI * 1.5], [T.c2, -Math.PI / 2, Math.PI / 2]].forEach(([cc, a0, a1]) => {
    [T.r + T.w / 2, T.r - T.w / 2].forEach(rr => {
      const n = 22;
      for (let i = 0; i < n; i++) {
        g.strokeStyle = i % 2 ? '#f2f0ea' : '#c4231b'; g.lineWidth = 0.1 * PX;
        g.beginPath(); g.arc(X(cc[0]), Z(cc[1]), rr * PX, a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n); g.stroke();
      }
    });
  });
  // chequered start / finish at x 15.2
  const fz0 = T.c1[1] + T.r - T.w / 2;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
    g.fillStyle = (i + j) % 2 ? '#111' : '#f2f0ea';
    g.fillRect(X(15.2) + j * 0.08 * PX, Z(fz0) + i * (T.w / 8) * PX, 0.08 * PX, (T.w / 8) * PX);
  }
  for (let i = 0; i < 4; i++) {
    const x = 14.8 - i * 0.55, z = T.c1[1] + T.r + (i % 2 ? 0.2 : -0.2);
    g.strokeStyle = '#f2f0ea'; g.lineWidth = 0.025 * PX;
    g.strokeRect(X(x - 0.25), Z(z - 0.12), 0.5 * PX, 0.24 * PX);
  }

  // helipad on the page is on the hospital roof (3D); spine shading + grain
  const sp = g.createLinearGradient(X(-0.9), 0, X(0.9), 0);
  sp.addColorStop(0, 'rgba(40,30,15,0)'); sp.addColorStop(0.5, 'rgba(40,30,15,.28)'); sp.addColorStop(1, 'rgba(40,30,15,0)');
  g.fillStyle = sp; g.fillRect(X(-0.9), 0, 1.8 * PX, H);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  return c;
}

Object.assign(window.CITY, { SPREAD, LAYOUT, drawSpread });
})();
