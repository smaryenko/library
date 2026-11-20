// Preview scene for "Number Cube Land": consumed by tools/build-previews.js
// (node only; not loaded by the book page). The book is a live three.js
// world, so the cover and og image draw the number friends in SVG: chunky
// plastic cubes (front, lit top and shaded side), the faces from
// assets/js/friends.js (tall oval eyes, big pupils, One's single eye,
// Three's lashes and crown), their numerals floating above, walking over
// soft green hills to the Rainbow Gate. Original art.
module.exports = (h) => {
  const f = v => v.toFixed(1);
  const INK = '#1c1c28';
  // colour, darker side, lighter top
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const RAINBOW = ['#e5232c', '#f6921e', '#ffd41c', '#3cb44b', '#3cc6ef', '#3f51b5', '#8e44ad'];

  // one plastic cube: front face at (x, y) size s, depth d to the upper right
  function cube(x, y, s, col, d) {
    const top = shade(col, 0.32), side = shade(col, -0.28), r = s * 0.12;
    return `<path d="M${f(x)} ${f(y)}l${f(d)} ${f(-d)}h${f(s)}l${f(-d)} ${f(d)}z" fill="${top}"/>` +
      `<path d="M${f(x + s)} ${f(y)}l${f(d)} ${f(-d)}v${f(s)}l${f(-d)} ${f(d)}z" fill="${side}"/>` +
      `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(r)}" fill="${col}"/>` +
      `<rect x="${f(x + s * 0.08)}" y="${f(y + s * 0.07)}" width="${f(s * 0.84)}" height="${f(s * 0.12)}" rx="${f(s * 0.06)}" fill="#fff" opacity=".22"/>` +
      `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(r)}" fill="none" stroke="${side}" stroke-width="${f(s * 0.03)}" opacity=".6"/>`;
  }
  function eye(cx, cy, rx, ry, look, s) {
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#fff" stroke="${INK}" stroke-width="${f(s * 0.045)}"/>` +
      `<circle cx="${f(cx + look[0] * rx * 0.25)}" cy="${f(cy + look[1] * ry * 0.25)}" r="${f(rx * 0.52)}" fill="${INK}"/>` +
      `<circle cx="${f(cx + look[0] * rx * 0.25 - rx * 0.18)}" cy="${f(cy + look[1] * ry * 0.25 - ry * 0.2)}" r="${f(rx * 0.16)}" fill="#fff"/>`;
  }
  // a number friend. cols: cubes per column (left to right), feet at (x, y)
  function friend(n, x, y, s, { cols = [n], color, colors, limb, eyes = 2, mouth = 'grin', crown, dots, lashes, wave = 0, look = [0.3, 0.4] } = {}) {
    const d = s * 0.28, W = cols.length * s, H = Math.max(...cols) * s, leg = s * 0.34;
    const y0 = y - leg - H;
    let out = '';
    // legs
    const lc = limb || shade(color || colors[0], -0.3);
    out += `<g stroke="${lc}" stroke-width="${f(s * 0.17)}" stroke-linecap="round"><path d="M${f(x + W * 0.3)} ${f(y - leg)}v${f(leg * 0.85)}M${f(x + W * 0.7)} ${f(y - leg)}v${f(leg * 0.85)}"/></g>`;
    // cubes: back to front so tops overlap correctly (top rows first is fine for the oblique view)
    let k = 0;
    const cubes = [];
    cols.forEach((h0, c) => { for (let r = 0; r < h0; r++) cubes.push([c, r]); });
    cubes.sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]));
    cubes.forEach(([c, r]) => {
      const col = colors ? colors[r % colors.length] : color;
      out += cube(x + c * s, y - leg - (r + 1) * s, s, col, d);
      k++;
    });
    // arms (from the top cube's sides)
    const ay = y0 + s * 0.62;
    out += `<g stroke="${lc}" stroke-width="${f(s * 0.14)}" stroke-linecap="round" fill="none">` +
      `<path d="M${f(x)} ${f(ay)}q${f(-s * 0.3)} ${f(s * 0.25)} ${f(-s * 0.32)} ${f(s * 0.55)}"/>` +
      (wave ? `<path d="M${f(x + W)} ${f(ay)}q${f(s * 0.35)} ${f(-s * 0.2)} ${f(s * 0.42)} ${f(-s * 0.62)}"/>` : `<path d="M${f(x + W)} ${f(ay)}q${f(s * 0.3)} ${f(s * 0.25)} ${f(s * 0.32)} ${f(s * 0.55)}"/>`) + '</g>';
    // face on the top cube(s)
    const fw = Math.min(W, s * 1.0), fx = x + W / 2, fy = y0 + s * 0.38;
    if (eyes === 1) out += eye(fx, fy, s * 0.24, s * 0.29, look, s);
    else {
      const gap = s * 0.2;
      out += eye(fx - gap, fy, s * 0.17, s * 0.23, look, s) + eye(fx + gap, fy, s * 0.17, s * 0.23, [-look[0], look[1]], s);
      if (lashes) for (const sx of [-1, 1]) for (const a of [-0.5, 0, 0.5]) {
        const ex = fx + sx * gap + Math.sin(a) * s * 0.12, ey = fy - s * 0.22;
        out += `<path d="M${f(ex)} ${f(ey)}l${f(Math.sin(a - sx * 0.3) * s * 0.08)} ${f(-s * 0.09)}" stroke="${INK}" stroke-width="${f(s * 0.035)}" stroke-linecap="round"/>`;
      }
    }
    const my = y0 + s * 0.78;
    if (mouth === 'grin') out += `<path d="M${f(fx - s * 0.16)} ${f(my - s * 0.05)}q${f(s * 0.16)} ${f(s * 0.03)} ${f(s * 0.32)} 0q${f(-s * 0.04)} ${f(s * 0.2)} ${f(-s * 0.16)} ${f(s * 0.2)}q${f(-s * 0.12)} 0 ${f(-s * 0.16)} ${f(-s * 0.2)}z" fill="#3a1418" stroke="${INK}" stroke-width="${f(s * 0.03)}"/><ellipse cx="${f(fx)}" cy="${f(my + s * 0.1)}" rx="${f(s * 0.07)}" ry="${f(s * 0.04)}" fill="#e8566a"/>`;
    else if (mouth === 'cheeky') out += `<path d="M${f(fx - s * 0.18)} ${f(my - s * 0.02)}q${f(s * 0.14)} ${f(s * 0.2)} ${f(s * 0.36)} ${f(-s * 0.1)}" fill="none" stroke="${INK}" stroke-width="${f(s * 0.045)}" stroke-linecap="round"/>`;
    else out += `<path d="M${f(fx - s * 0.12)} ${f(my - s * 0.04)}q${f(s * 0.12)} ${f(s * 0.14)} ${f(s * 0.24)} 0" fill="none" stroke="${INK}" stroke-width="${f(s * 0.045)}" stroke-linecap="round"/>`;
    // extras: Three's crown and dots, Six's dice dots
    if (crown) {
      let p = '';
      for (let i = 0; i < 3; i++) { const cx = x + s * (0.2 + i * 0.3); p += `M${f(cx - s * 0.13)} ${f(y0 + 1)}L${f(cx)} ${f(y0 - s * 0.3)}L${f(cx + s * 0.13)} ${f(y0 + 1)}Z`; }
      out = `<path d="${p}" fill="${crown}" stroke="${shade(crown, -0.3)}" stroke-width="${f(s * 0.025)}"/>` + out;
    }
    if (dots) for (let r = 0; r < Math.max(...cols) - 1; r++) out += `<circle cx="${f(x + W / 2)}" cy="${f(y - leg - (r + 0.5) * s)}" r="${f(s * 0.11)}" fill="${dots}"/>`;
    // numeral above the head
    const ny = y0 - (crown ? s * 0.55 : s * 0.3) - d * 0.4;
    out += `<text x="${f(x + W / 2 + d * 0.4)}" y="${f(ny)}" font-family="'Arial Rounded MT Bold','Nunito','Trebuchet MS',sans-serif" font-weight="800" font-size="${f(s * 0.55)}" text-anchor="middle" fill="${INK}">${n}</text>`;
    // soft contact shadow
    return `<ellipse cx="${f(x + W / 2 + d * 0.4)}" cy="${f(y + s * 0.04)}" rx="${f(W * 0.62 + d)}" ry="${f(s * 0.13)}" fill="#2d6a2a" opacity=".22"/>` + out;
  }

  // the land: sky, clouds, hills, the far hill with the Rainbow Gate, a path
  function land(W, H, gx, gy, gs) {
    let s = `<defs><linearGradient id="nlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec8f4"/><stop offset=".7" stop-color="#dff3ff"/><stop offset="1" stop-color="#f2fbff"/></linearGradient>
      <radialGradient id="nlSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#fff0a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff0a8" stop-opacity="0"/></radialGradient>
      <linearGradient id="nlHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9e07c"/><stop offset="1" stop-color="#7cc457"/></linearGradient>
      <linearGradient id="nlNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad86c"/><stop offset="1" stop-color="#6fb84c"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#nlSky)"/>`;
    s += `<circle cx="${f(W * 0.9)}" cy="${f(H * 0.16)}" r="${f(H * 0.2)}" fill="url(#nlSun)"/>`;
    const cloud = (x, y, k) => `<g fill="#fff"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(52 * k)}" ry="${f(20 * k)}"/><ellipse cx="${f(x + 26 * k)}" cy="${f(y - 12 * k)}" rx="${f(32 * k)}" ry="${f(22 * k)}"/><ellipse cx="${f(x - 22 * k)}" cy="${f(y - 6 * k)}" rx="${f(26 * k)}" ry="${f(16 * k)}"/></g>`;
    s += cloud(W * 0.12, H * 0.16, H / 520) + cloud(W * 0.55, H * 0.1, H / 700) + cloud(W * 0.78, H * 0.3, H / 800);
    // far hills
    s += `<path d="M0 ${f(H * 0.62)}C${f(W * 0.2)} ${f(H * 0.5)} ${f(W * 0.35)} ${f(H * 0.56)} ${f(W * 0.5)} ${f(H * 0.58)}S${f(W * 0.85)} ${f(H * 0.44)} ${W} ${f(H * 0.52)}V${H}H0Z" fill="#b5e48c"/>`;
    // the far hill with the gate (an arch of rainbow cubes)
    s += `<ellipse cx="${f(gx)}" cy="${f(gy + gs * 3.2)}" rx="${f(gs * 7)}" ry="${f(gs * 2.6)}" fill="url(#nlHill)"/>`;
    const n = 11, R = gs * 2.6;
    for (let i = 0; i < n; i++) {
      const a = Math.PI - i / (n - 1) * Math.PI, cx = gx + Math.cos(a) * R - gs / 2, cy = gy + gs * 0.9 - Math.sin(a) * R;
      s += cube(cx, cy, gs, RAINBOW[i % 7], gs * 0.25);
    }
    for (const side of [-1, 1]) for (let k = 0; k < 2; k++) s += cube(gx + side * R - gs / 2, gy + gs * 0.9 + (k + 1) * gs * 0.95, gs, RAINBOW[(side > 0 ? 6 : 0) - side * k], gs * 0.25);
    // round trees
    const tree = (x, y, k) => `<rect x="${f(x - 5 * k)}" y="${f(y - 40 * k)}" width="${f(10 * k)}" height="${f(42 * k)}" rx="${f(3 * k)}" fill="#9a6a3e"/><circle cx="${f(x)}" cy="${f(y - 62 * k)}" r="${f(34 * k)}" fill="#4fae47"/><circle cx="${f(x - 12 * k)}" cy="${f(y - 74 * k)}" r="${f(14 * k)}" fill="#6cc75f" opacity=".7"/><circle cx="${f(x - 16 * k)}" cy="${f(y - 56 * k)}" r="${f(4.5 * k)}" fill="#e5323a"/><circle cx="${f(x + 14 * k)}" cy="${f(y - 66 * k)}" r="${f(4.5 * k)}" fill="#e5323a"/><circle cx="${f(x + 4 * k)}" cy="${f(y - 44 * k)}" r="${f(4.5 * k)}" fill="#e5323a"/>`;
    return { s, tree, cloud };
  }
  function ground(W, H, y) {
    return `<path d="M0 ${f(y)}C${f(W * 0.3)} ${f(y - H * 0.06)} ${f(W * 0.6)} ${f(y + H * 0.02)} ${W} ${f(y - H * 0.05)}V${H}H0Z" fill="url(#nlNear)"/>` +
      `<path d="M${f(-W * 0.05)} ${f(y + H * 0.2)}C${f(W * 0.3)} ${f(y + H * 0.08)} ${f(W * 0.6)} ${f(y + H * 0.12)} ${f(W * 1.05)} ${f(y + H * 0.02)}l0 ${f(H * 0.06)}C${f(W * 0.6)} ${f(y + H * 0.2)} ${f(W * 0.3)} ${f(y + H * 0.17)} ${f(-W * 0.05)} ${f(y + H * 0.28)}Z" fill="#eedfae"/>`;
  }
  function flowers(W, H, y0, seed) {
    const R = h.rand(seed); let s = '';
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = y0 + R() * (H - y0), c = ['#ffffff', '#ffe25a', '#ff8fc0'][i % 3], r = 3 + R() * 3;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.4)}" fill="#f0a020"/>`;
    }
    return s;
  }
  // the walking line-up
  function cast(x, y, s) {
    let o = '';
    o += friend(5, x + s * 7.1, y - s * 0.15, s * 0.92, { color: '#3cc6ef', look: [-0.4, 0.3], mouth: 'smile' });
    o += friend(4, x + s * 5.0, y, s * 0.92, { cols: [2, 2], color: '#3cb44b', mouth: 'grin', look: [-0.3, 0.4] });
    o += friend(3, x + s * 3.5, y + s * 0.1, s, { color: '#ffd41c', limb: '#d6a400', crown: '#e5232c', dots: '#e5232c', lashes: true, mouth: 'cheeky' });
    o += friend(2, x + s * 1.9, y + s * 0.2, s, { color: '#f6921e', mouth: 'grin' });
    o += friend(1, x + s * 0.3, y + s * 0.3, s * 1.08, { color: '#e5232c', eyes: 1, mouth: 'grin', wave: 1, look: [0.2, 0.3] });
    return o;
  }

  return {
    cover: () => {
      const W = h.COVER.W, H = h.COVER.H;
      const L = land(W, H, 335, 78, 12);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Cover for "Number Cube Land" (built by tools/build-previews.js from books/numberland/preview.js). Original. -->
  ${L.s}
  ${L.tree(36, 214, 0.75)}${L.tree(372, 208, 0.6)}
  ${ground(W, H, 214)}
  ${flowers(W, H, 236, 7)}
  ${cast(30, 266, 30)}
</svg>`;
    },
    og: () => {
      const W = h.OG.W, H = h.OG.H;
      const L = land(W, H, 770, 118, 30);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Share card for "Number Cube Land" (built by tools/build-previews.js from books/numberland/preview.js). Original. -->
  ${L.s}
  ${L.tree(1150, 430, 1.3)}${L.tree(640, 420, 1.0)}
  ${ground(W, H, 440)}
  ${flowers(W, H, 470, 11)}
  ${cast(600, 590, 66)}
  ${h.title(['Number', 'Cube Land'], ['#e5232c', '#2f6fd0'], '#ffffff', 56, 230)}
</svg>`;
    }
  };
};
