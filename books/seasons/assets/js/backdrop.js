// Backdrop for the SEASONS book: a calm, open countryside behind the book.
// Sharp (no blur) but gentle: one smooth sky gradient with no bands, soft
// rolling hills, and only a LOW, distant tree line along the horizon. Tree
// colours drift smoothly from spring green (left) through summer and autumn
// to frosted winter (right), interpolated per tree so there are no hard
// colour switches. A wide meadow fills the bottom; a light vignette keeps the
// book the brightest thing. Reuses the shared `.winter-bg` / `.winter-scene`
// chrome. Exposes window.mountSeasons().
(function () {
  'use strict';
  const f1 = n => n.toFixed(1);
  function rng(seed) {
    let s = seed;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { a = hex(a); b = hex(b); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
  // season stops across the width: [x 0..1, light, mid, dark]
  const SEASON = [
    [0.00, '#b9d48a', '#86ac5a', '#5a8040'],
    [0.30, '#a9bc62', '#7c9640', '#56702e'],
    [0.62, '#e8b552', '#cf7a2c', '#9a4a1e'],
    [1.00, '#eef2f4', '#a9b8b4', '#6a7a74']
  ];
  function seasonAt(t, k) {
    for (let i = 0; i < SEASON.length - 1; i++) {
      const a = SEASON[i], b = SEASON[i + 1];
      if (t <= b[0]) return mix(a[k], b[k], (t - a[0]) / (b[0] - a[0]));
    }
    return SEASON[SEASON.length - 1][k];
  }

  function sceneSVG() {
    const r = rng(7);
    const W = 400, H = 225, HZ = 132;            // horizon line (tree bases)
    // far, hazy row then a nearer row; each tree a trunk + leafy crown
    let trees = '';
    [[0.55, 8, 0.55], [1, 0, 1]].forEach(([k, dy, op]) => {
      let row = '';
      for (let x = -6; x < W + 8; x += (7 + r() * 7) * (0.7 + k * 0.3)) {
        const t = Math.max(0, Math.min(1, x / W));
        const h = (10 + r() * 9) * k, base = HZ - dy + r() * 2;
        const rx = h * (0.32 + r() * 0.12), ry = h * 0.5, cy = base - h * 0.62;
        const L = seasonAt(t, 1), M = seasonAt(t, 2), D = seasonAt(t, 3);
        row += `<rect x="${f1(x - 0.5)}" y="${f1(cy)}" width="1" height="${f1(base - cy)}" fill="#4a3c2e"/>
          <ellipse cx="${f1(x)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${M}"/>
          <ellipse cx="${f1(x + rx * 0.25)}" cy="${f1(cy + ry * 0.3)}" rx="${f1(rx * 0.7)}" ry="${f1(ry * 0.55)}" fill="${D}" opacity="0.6"/>
          <ellipse cx="${f1(x - rx * 0.3)}" cy="${f1(cy - ry * 0.35)}" rx="${f1(rx * 0.5)}" ry="${f1(ry * 0.4)}" fill="${L}" opacity="0.85"/>`;
        for (let i = 0; i < 6; i++) {
          const a = r() * Math.PI * 2, d = 0.6 + r() * 0.4;
          row += `<circle cx="${f1(x + Math.cos(a) * rx * d)}" cy="${f1(cy + Math.sin(a) * ry * d)}" r="${f1(0.8 + r() * 1.4)}" fill="${r() > 0.5 ? L : M}"/>`;
        }
      }
      trees += `<g opacity="${op}">${row}</g>`;
    });
    // meadow tufts, sparse, tinted by season
    let tufts = '';
    for (let i = 0; i < 220; i++) {
      const x = r() * W, y = HZ + 6 + Math.pow(r(), 0.7) * (H - HZ - 6);
      const t = x / W, near = (y - HZ) / (H - HZ), h = 1.5 + near * 7;
      const c = mix(seasonAt(t, 3), '#4c5a2c', 0.5);
      tufts += `<path d="M${f1(x)} ${f1(y)} l${f1(-h * 0.3)} ${f1(-h)} M${f1(x)} ${f1(y)} l${f1(h * 0.1)} ${f1(-h * 1.1)} M${f1(x)} ${f1(y)} l${f1(h * 0.35)} ${f1(-h * 0.9)}"
        stroke="${c}" stroke-width="${f1(0.3 + near * 0.5)}" opacity="0.7"/>`;
    }
    return `
    <svg class="winter-scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="snSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8fb0c8"/><stop offset="0.35" stop-color="#b9cfdc"/>
          <stop offset="0.6" stop-color="#e2e6e0"/><stop offset="1" stop-color="#efe8d6"/>
        </linearGradient>
        <linearGradient id="snMeadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7f9a4c"/><stop offset="0.35" stop-color="#8c9a48"/>
          <stop offset="0.65" stop-color="#a08a46"/><stop offset="1" stop-color="#c9ced0"/>
        </linearGradient>
        <linearGradient id="snMeadowShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/>
        </linearGradient>
        <linearGradient id="snHill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#9fb490"/><stop offset="0.6" stop-color="#b8ae90"/><stop offset="1" stop-color="#c9d0d4"/>
        </linearGradient>
        <radialGradient id="snSun" cx="0.3" cy="0.22" r="0.5">
          <stop offset="0" stop-color="#fff8e0" stop-opacity="0.7"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="snVig" cx="0.5" cy="0.55" r="0.8">
          <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#snSky)"/>
      <rect width="${W}" height="${H}" fill="url(#snSun)"/>
      <path d="M0 122 Q70 106 150 116 Q230 100 310 114 Q360 108 400 112 L400 140 L0 140 Z" fill="url(#snHill)" opacity="0.75"/>
      ${trees}
      <path d="M0 131 Q200 127 400 131 L400 ${H} L0 ${H} Z" fill="url(#snMeadow)"/>
      <path d="M0 131 Q200 127 400 131 L400 ${H} L0 ${H} Z" fill="url(#snMeadowShade)"/>
      ${tufts}
      <rect width="${W}" height="${H}" fill="url(#snVig)"/>
    </svg>`;
  }
  function mountSeasons() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountSeasons = mountSeasons;
})();
