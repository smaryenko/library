// Backdrop for THE ANT AND THE CRUMB: a calm summer meadow seen low, at ant
// level. Warm sky, soft bokeh light, a far blurred tree line, wildflowers in
// the middle distance, and big out-of-focus grass blades and clover right in
// front at the bottom. Everything soft and rounded to sit with the clay look,
// low contrast so the book stays in front. Reuses the shared `.winter-bg` / `.winter-scene`.
(function () {
  'use strict';

  // ---- tune by eye -------------------------------------------------------------
  const W = 1600, H = 900;
  const SKY = ['#bcd9ea', '#e8eed8', '#fbe7c0'];          // top, middle, horizon
  const SUN = { x: 1180, y: 210, r: 520, color: '#fff2cc', alpha: 0.85 };
  const BOKEH = { n: 22, rMin: 18, rMax: 70, blur: 10, alpha: [0.18, 0.45] };
  const FAR = { y: 560, color: '#b9cf9e', blur: 14 };    // far hedge / tree line
  const MID = { y: 640, color: '#a6c486', blur: 6 };     // the meadow floor behind the flowers
  const FLOWERS = { n: 26, blur: 1.6 };                  // middle distance wildflowers
  const FLOWER_COLS = ['#fbf6ea', '#f4d35e', '#e9a6b8', '#c9b6e4', '#f6b26b'];
  const NEAR_GRASS = { n: 46, blur: 9, cols: ['#86ad66', '#79a35c', '#95ba72', '#6d9852'] };
  const CLOVER = { n: 7, blur: 5, col: '#7fa862', flower: '#f1d6e2' };
  const GROUND = ['#c8b48a', '#a98d64'];                 // warm earth under the book

  // a fixed, repeatable scatter (same picture every load)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + (b - a) * rnd();
  const n1 = v => v.toFixed(1);

  function bokeh() {
    let s = '';
    for (let i = 0; i < BOKEH.n; i++) {
      const x = R(0, W), y = R(40, FAR.y - 40), r = R(BOKEH.rMin, BOKEH.rMax);
      s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="#fff8e4" opacity="${R(BOKEH.alpha[0], BOKEH.alpha[1]).toFixed(2)}"/>`;
    }
    return s;
  }
  function flowers() {
    let s = '';
    for (let i = 0; i < FLOWERS.n; i++) {
      const x = R(20, W - 20), y = R(MID.y - 20, MID.y + 70), k = 0.6 + (y - MID.y + 20) / 90 * 0.7;
      const col = FLOWER_COLS[i % FLOWER_COLS.length], pr = 7 * k;
      s += `<path d="M${n1(x)} ${n1(y)} q${n1(R(-8, 8))} ${n1(40 * k)} ${n1(R(-6, 6))} ${n1(110 * k)}" stroke="#8fb371" stroke-width="${n1(3 * k)}" fill="none" stroke-linecap="round"/>`;
      for (let p = 0; p < 6; p++) {
        s += `<ellipse cx="${n1(x)}" cy="${n1(y - pr)}" rx="${n1(pr * 0.55)}" ry="${n1(pr)}" fill="${col}" transform="rotate(${p * 60} ${n1(x)} ${n1(y)})"/>`;
      }
      s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(pr * 0.55)}" fill="${i % 2 ? '#f2c94c' : '#e8b04a'}"/>`;
    }
    return s;
  }
  function nearGrass() {
    let s = '';
    for (let i = 0; i < NEAR_GRASS.n; i++) {
      const x = R(-40, W + 40), h = R(160, 420), w = R(14, 30), lean = R(-90, 90);
      const col = NEAR_GRASS.cols[i % NEAR_GRASS.cols.length];
      // a soft, wide blade: two curves meeting at a rounded tip
      s += `<path d="M${n1(x - w)} ${H} Q${n1(x - w * 0.4 + lean * 0.4)} ${n1(H - h * 0.55)} ${n1(x + lean)} ${n1(H - h)} Q${n1(x + w * 0.4 + lean * 0.4)} ${n1(H - h * 0.55)} ${n1(x + w)} ${H} Z" fill="${col}" opacity="${R(0.75, 0.95).toFixed(2)}"/>`;
    }
    return s;
  }
  function clover() {
    let s = '';
    for (let i = 0; i < CLOVER.n; i++) {
      const x = R(60, W - 60), y = R(H - 150, H - 40), r = R(26, 44);
      for (let k = 0; k < 3; k++) {
        const a = (k * 120 - 90) * Math.PI / 180;
        s += `<circle cx="${n1(x + Math.cos(a) * r * 0.8)}" cy="${n1(y + Math.sin(a) * r * 0.8)}" r="${n1(r * 0.72)}" fill="${CLOVER.col}"/>`;
      }
      if (i % 3 === 0) s += `<circle cx="${n1(x + r * 1.4)}" cy="${n1(y - r * 1.8)}" r="${n1(r * 0.7)}" fill="${CLOVER.flower}" opacity="0.9"/>`;
    }
    return s;
  }

  function meadow() {
    return `
    <svg class="winter-scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ahSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${SKY[0]}"/><stop offset="0.45" stop-color="${SKY[1]}"/><stop offset="0.7" stop-color="${SKY[2]}"/>
        </linearGradient>
        <radialGradient id="ahSun" gradientUnits="userSpaceOnUse" cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}">
          <stop offset="0" stop-color="${SUN.color}" stop-opacity="${SUN.alpha}"/><stop offset="1" stop-color="${SUN.color}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="ahGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GROUND[0]}"/><stop offset="1" stop-color="${GROUND[1]}"/></linearGradient>
        <linearGradient id="ahWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1d0" stop-opacity="0"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0.35"/></linearGradient>
        <filter id="ahBokeh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${BOKEH.blur}"/></filter>
        <filter id="ahFar" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="${FAR.blur}"/></filter>
        <filter id="ahMid" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="${MID.blur}"/></filter>
        <filter id="ahFlower"><feGaussianBlur stdDeviation="${FLOWERS.blur}"/></filter>
        <filter id="ahNear" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${NEAR_GRASS.blur}"/></filter>
        <filter id="ahClover" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${CLOVER.blur}"/></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#ahSky)"/>
      <rect width="${W}" height="${H}" fill="url(#ahSun)"/>
      <g filter="url(#ahBokeh)">${bokeh()}</g>
      <g filter="url(#ahFar)">
        <path d="M-40 ${FAR.y} C120 ${FAR.y - 90} 260 ${FAR.y - 40} 380 ${FAR.y - 80} S640 ${FAR.y - 30} 780 ${FAR.y - 70} S1080 ${FAR.y - 110} 1220 ${FAR.y - 60} S1500 ${FAR.y - 90} 1640 ${FAR.y - 50} V${H} H-40 Z" fill="${FAR.color}"/>
      </g>
      <g filter="url(#ahMid)">
        <path d="M-40 ${MID.y} Q400 ${MID.y - 40} 800 ${MID.y - 10} T1640 ${MID.y - 20} V${H} H-40 Z" fill="${MID.color}"/>
      </g>
      <g filter="url(#ahFlower)">${flowers()}</g>
      <rect x="0" y="${H - 190}" width="${W}" height="190" fill="url(#ahGround)" opacity="0.55"/>
      <g filter="url(#ahNear)">${nearGrass()}</g>
      <g filter="url(#ahClover)">${clover()}</g>
      <rect width="${W}" height="${H}" fill="url(#ahWarm)"/>
    </svg>`;
  }
  window.mountAnthill = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = meadow();
    document.body.prepend(bg);
  };
})();
