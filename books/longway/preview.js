// Preview scene for "The Long Way Home": consumed by tools/build-previews.js
// (node only; not loaded by the book page). The book itself is a live
// three.js world, so the cover and og image draw the same toy cubes in
// isometric SVG: the hill town, the lighthouse, Theo in his boat with its
// white sail, a dolphin. Colours follow assets/js/cubes.js.
module.exports = (h) => {
  // top, left side, right side of each cube type (printed bevel = lighter top edge)
  const COL = {
    grass: ['#79b94d', '#7a4e2e', '#6b4428'], dirt: ['#9b6a40', '#7a4e2e', '#6b4428'],
    water: ['#4a8ee0', '#356fc0', '#2c5fa8'], sand: ['#f0dca8', '#d2ba7c', '#c2aa6c'],
    brick: ['#c24e36', '#a83a28', '#902e20'], roof: ['#9b6838', '#7a4c2a', '#6a4022'],
    wool: ['#f7f7f7', '#e2e2e2', '#cfcfcf'], plank: ['#b48650', '#9a6d3d', '#86603a'],
    leaf: ['#5ca03c', '#4c9132', '#3f7d2a'], log: ['#b48650', '#6b4a2b', '#5a3d22'],
    stone: ['#a8a8a5', '#939391', '#7e7e7c'], white: ['#fafaf6', '#e6e6e0', '#d2d2cc'],
    lamp: ['#fff0a8', '#ffd24a', '#f0b830'], shirt: ['#2fb0b0', '#29a0a0', '#228888'],
    head: ['#4a2f1d', '#c99a74', '#b88a64'], window: ['#b48650', '#9ccbe6', '#86b8d6'],
    dolphin: ['#7a9ab3', '#6f8fa8', '#5f7f98'], path: ['#d6b97c', '#7a4e2e', '#6b4428']
  };
  const f = v => v.toFixed(1);
  function cube(x, y, t, a) {
    const [top, l, r] = COL[t], hh = a * 0.575, sw = f(a * 0.05);
    const p = pts => pts.map(([px, py]) => f(px) + ',' + f(py)).join(' ');
    let s = `<polygon points="${p([[x, y], [x + a, y - hh], [x + 2 * a, y], [x + a, y + hh]])}" fill="${top}"/>`;
    s += `<polygon points="${p([[x, y], [x + a, y + hh], [x + a, y + 3 * hh], [x, y + 2 * hh]])}" fill="${l}"/>`;
    s += `<polygon points="${p([[x + a, y + hh], [x + 2 * a, y], [x + 2 * a, y + 2 * hh], [x + a, y + 3 * hh]])}" fill="${r}"/>`;
    // printed bevel: a light line on the top's far edges, a dark rim on the near ones
    s += `<polyline points="${p([[x, y], [x + a, y - hh], [x + 2 * a, y]])}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="${sw}"/>`;
    s += `<polyline points="${p([[x, y], [x + a, y + hh], [x + 2 * a, y]])}" fill="none" stroke="#000" stroke-opacity="0.2" stroke-width="${sw}"/>`;
    s += `<line x1="${f(x + a)}" y1="${f(y + hh)}" x2="${f(x + a)}" y2="${f(y + 3 * hh)}" stroke="#000" stroke-opacity="0.2" stroke-width="${sw}"/>`;
    if (t === 'head') {   // Theo's face on the left side
      s += `<polygon points="${p([[x + a * 0.2, y + hh * 0.9], [x + a * 0.4, y + hh * 1.0], [x + a * 0.4, y + hh * 1.2], [x + a * 0.2, y + hh * 1.1]])}" fill="#3b5bd6"/>`;
      s += `<polygon points="${p([[x + a * 0.6, y + hh * 1.1], [x + a * 0.8, y + hh * 1.2], [x + a * 0.8, y + hh * 1.4], [x + a * 0.6, y + hh * 1.3]])}" fill="#3b5bd6"/>`;
    }
    return s;
  }
  // cells: [i, j, k, type]; i runs right-down, j left-down, k up
  function scene(ox, oy, a, cells) {
    const hh = a * 0.575;
    return cells.slice().sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]) || p[2] - q[2])
      .map(([i, j, k, t]) => cube(ox + (i - j) * a, oy + (i + j) * hh - k * 2 * hh, t, a)).join('');
  }
  function world() {
    const c = [];
    for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) {
      if (i + j < 7) {
        const hgt = 1 + (i + j < 4 ? 1 : 0) + (i + j < 2 ? 1 : 0);
        for (let k = 0; k < hgt; k++) c.push([i, j, k, k < hgt - 1 ? 'dirt' : (i === 2 && j < 4) || (j === 3 && i < 3) ? 'path' : 'grass']);
      } else if (i + j === 7) c.push([i, j, 0, 'sand']);
      else c.push([i, j, 0, 'water']);
    }
    for (let k = 3; k < 5; k++) for (const [i, j] of [[0, 1], [1, 1], [0, 2], [1, 2]]) c.push([i, j, k, k === 3 && i === 1 && j === 2 ? 'window' : 'brick']);
    for (const [i, j] of [[0, 1], [1, 1], [0, 2], [1, 2]]) c.push([i, j, 5, 'roof']);
    c.push([0, 1, 6, 'roof'], [0, 2, 6, 'roof']);
    c.push([4, 0, 2, 'log'], [4, 0, 3, 'log'], [4, 0, 4, 'leaf'], [3, 0, 4, 'leaf'], [5, 0, 4, 'leaf'], [4, 1, 4, 'leaf'], [4, 0, 5, 'leaf']);
    c.push([8, 0, 0, 'stone'], [9, 0, 0, 'stone'], [8, 1, 0, 'stone']);
    for (let k = 1; k < 6; k++) c.push([8, 0, k, Math.floor((k - 1) / 2) % 2 ? 'brick' : 'white']);
    c.push([8, 0, 6, 'lamp'], [8, 0, 7, 'roof']);
    c.push([5, 4, 1, 'plank'], [6, 4, 1, 'plank'], [4, 4, 1, 'plank'], [4, 4, 2, 'plank'],
      [5, 4, 2, 'wool'], [5, 4, 3, 'wool'], [5, 4, 4, 'wool'], [6, 4, 2, 'shirt'], [6, 4, 3, 'head']);
    c.push([8, 5, 1, 'dolphin'], [9, 5, 1, 'dolphin']);
    return c;
  }
  const W0 = world();
  const bg = (W, H, cx, cy, rx, ry) => `<defs>
    <radialGradient id="pvBg" cx="0.5" cy="0.35" r="0.85"><stop offset="0" stop-color="#f6f1e6"/><stop offset="1" stop-color="#d9cfbd"/></radialGradient>
    <radialGradient id="pvSh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#5a4a30" stop-opacity="0.35"/><stop offset="1" stop-color="#5a4a30" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#pvBg)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pvSh)"/>`;
  return {
    cover: () => {
      const { W, H } = h.COVER;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Preview art for "The Long Way Home": generated by tools/build-previews.js
       from books/longway/preview.js (toy cubes in isometric SVG). Original. -->
  ${bg(W, H, 210, 236, 190, 40)}
  ${scene(178, 96, 20, W0)}
</svg>
`;
    },
    og: () => {
      const { W, H } = h.OG;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${bg(W, H, 840, 480, 330, 70)}
  ${scene(800, 210, 34, W0)}
  ${h.title(['The Long', 'Way Home'], ['#2f74c0', '#c24e36'], '#ffffff', 60, 260)}
</svg>
`;
    }
  };
};
