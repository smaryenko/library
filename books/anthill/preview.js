// Preview art for "The Ant and the Crumb" — consumed by tools/build-previews.js
// (node only; not loaded by the book page). The book is a raymarched clay
// scene, so this is a hand-built vector in the same clay look: a tall rounded
// anthill with a pine-needle crust, cut open to show the sandy inside, its
// rounded chambers and tunnels, a pile of eggs, a seed store and the queen,
// with the little ant carrying her bread crumb down the first tunnel.
//
// One scene is drawn in the 1200 × 630 og frame; the cover reuses it through
// a 4:3 viewBox, without the title.
module.exports = (h) => {
  const R = h.rand(4242);
  const f = n => n.toFixed(1);
  const defs = `
  <defs>
    <linearGradient id="ahSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6e2bc"/><stop offset=".6" stop-color="#fbeed4"/><stop offset="1" stop-color="#f3dcb0"/>
    </linearGradient>
    <radialGradient id="ahSun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fffaf0"/><stop offset=".4" stop-color="#ffe9b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9b8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ahSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3dba8"/><stop offset=".6" stop-color="#e6c48a"/><stop offset="1" stop-color="#d4ab6e"/>
    </linearGradient>
    <linearGradient id="ahEarth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d2a66c"/><stop offset="1" stop-color="#a87848"/>
    </linearGradient>
    <linearGradient id="ahCrust" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9a6234"/><stop offset="1" stop-color="#5e3517"/>
    </linearGradient>
    <linearGradient id="ahCham" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5e3a1e"/><stop offset=".55" stop-color="#8c6038"/><stop offset="1" stop-color="#b8895a"/>
    </linearGradient>
    <linearGradient id="ahGrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a7bf6a"/><stop offset="1" stop-color="#6f8d3e"/>
    </linearGradient>
    <radialGradient id="ahAnt" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#a55a36"/><stop offset=".45" stop-color="#6a3019"/><stop offset="1" stop-color="#2e130a"/>
    </radialGradient>
    <radialGradient id="ahQueen" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#b8693c"/><stop offset=".45" stop-color="#7a3a1c"/><stop offset="1" stop-color="#36160a"/>
    </radialGradient>
    <radialGradient id="ahCrumb" cx=".38" cy=".3" r=".8">
      <stop offset="0" stop-color="#fff1cc"/><stop offset=".45" stop-color="#f1d08e"/><stop offset="1" stop-color="#c98b3c"/>
    </radialGradient>
    <radialGradient id="ahEgg" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f6efdd"/><stop offset="1" stop-color="#d8c9a6"/>
    </radialGradient>
    <radialGradient id="ahSeed" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#d9a466"/><stop offset=".6" stop-color="#9a6230"/><stop offset="1" stop-color="#5e3517"/>
    </radialGradient>
    <radialGradient id="ahPeb" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#e9ddc8"/><stop offset=".6" stop-color="#b9a688"/><stop offset="1" stop-color="#857258"/>
    </radialGradient>
    <clipPath id="ahCut"><path d="M512 470 C 532 312, 662 118, 800 118 C 938 118, 1068 312, 1088 470 Z"/><rect x="-200" y="470" width="1600" height="400"/></clipPath>
    <filter id="ahSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="ahSoft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>`;
  const shadow = (cx, cy, rx, ry, o = 0.25) =>
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="#2a1408" opacity="${o}" filter="url(#ahSoft2)"/>`;
  // soft clay highlight
  const hl = (cx, cy, rx, ry, o = 0.45) =>
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}"/>`;
  // ---- a clay ant, facing right; origin = thorax centre; feet at y≈30 ----
  const ant = (x, y, s, opt = {}) => {
    const g = opt.queen ? 'ahQueen' : 'ahAnt';
    const gl = opt.gaster || 26;           // gaster length (queen: longer)
    const flip = opt.flip ? -1 : 1;
    const leg = (hx, hy, kx, ky, fx, fy, far) =>
      `<path d="M${hx} ${hy} Q${kx} ${ky - 6} ${kx} ${ky} L${fx} ${fy}" fill="none" stroke="${far ? '#2a1008' : '#4a2010'}" stroke-width="${far ? 4 : 5}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const far = leg(-4, 2, -20, 14, -30, 30, 1) + leg(2, 3, 2, 18, -4, 30, 1) + leg(8, 2, 22, 14, 30, 30, 1);
    const near = leg(-6, 5, -24, 16, -38, 31) + leg(0, 6, 4, 20, 2, 31) + leg(6, 5, 26, 16, 40, 31);
    const gx = -12 - gl;
    const body = `
      <ellipse cx="${gx}" cy="2" rx="${gl}" ry="${opt.queen ? 22 : 20}" fill="url(#${g})"/>
      ${hl(gx - gl * 0.25, -8, gl * 0.45, 6, 0.4)}
      ${opt.queen ? [0.15, 0.45, 0.75].map(k => `<path d="M${f(gx - gl + gl * 2 * k)} -15 q4 17 0 34" fill="none" stroke="#2a1008" stroke-width="1.6" opacity=".45"/>`).join('') : `<path d="M${gx + 6} -16 q5 18 0 36" fill="none" stroke="#2a1008" stroke-width="1.5" opacity=".4"/>`}
      <circle cx="-11" cy="1" r="6" fill="url(#${g})"/>
      <ellipse cx="2" cy="-1" rx="15" ry="10" fill="url(#${g})"/>
      ${hl(-2, -6, 7, 3, 0.45)}
      <ellipse cx="27" cy="-7" rx="15" ry="13" fill="url(#${g})"/>
      ${hl(23, -14, 6, 3.5, 0.5)}
      <circle cx="33" cy="-10" r="3.6" fill="#140805"/><circle cx="32" cy="-11.3" r="1.3" fill="#fff" opacity=".9"/>
      <path d="M39 -2 q8 2 9 8" fill="none" stroke="#3a180a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M28 -18 L35 -36 L52 -38" fill="none" stroke="#3a180a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 -18 L24 -38 L40 -44" fill="none" stroke="#2a1008" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="52" cy="-38" r="2.6" fill="#3a180a"/><circle cx="40" cy="-44" r="2.3" fill="#2a1008"/>`;
    const crumb = opt.crumb ? `
      <g transform="translate(50 -30)">
        ${shadow(2, 26, 18, 4, 0.18)}
        <path d="M-20 -4 C-22 -22 -4 -30 10 -26 C26 -24 30 -8 26 6 C22 20 4 24 -8 20 C-20 16 -18 8 -20 -4 Z" fill="url(#ahCrumb)"/>
        <path d="M-20 -4 C-22 -22 -4 -30 10 -26 C26 -24 30 -8 26 6" fill="none" stroke="#b8732c" stroke-width="5" stroke-linecap="round" opacity=".7"/>
        ${[[-6, -6, 3], [6, 2, 2.4], [-2, 10, 2.2], [12, -10, 1.8], [-12, 4, 1.8], [16, 8, 1.6]].map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#c99350" opacity=".7"/>`).join('')}
        ${hl(-6, -16, 8, 4, 0.55)}
      </g>` : '';
    return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">
      ${shadow(gx * 0.4 + 6, 32, 30 + gl, 5)}${far}${body}${near}${crumb}</g>`;
  };
  // ---- background -------------------------------------------------------
  const sky = `
    <rect x="-200" y="-200" width="1600" height="1100" fill="url(#ahSky)"/>
    <circle cx="300" cy="380" r="200" fill="url(#ahSun)"/>
    <g fill="#fff" opacity=".7">
      <ellipse cx="1060" cy="70" rx="70" ry="20"/><ellipse cx="1100" cy="58" rx="44" ry="22"/>
      <ellipse cx="420" cy="360" rx="60" ry="14"/><ellipse cx="450" cy="350" rx="34" ry="16"/>
    </g>`;
  // the cut face below ground, across the whole picture
  const earth = `
    <rect x="-200" y="470" width="1600" height="400" fill="url(#ahEarth)"/>
    ${Array.from({ length: 70 }, () => {
      const x = R() * 1300 - 50, y = 485 + R() * 160, r = 1.5 + R() * 4;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${R() > 0.5 ? '#8c5f36' : '#e9cc98'}" opacity=".55"/>`;
    }).join('')}
    ${[[120, 560, 22, 14], [330, 600, 16, 10], [1150, 540, 20, 12], [460, 520, 12, 8]].map(([x, y, rx, ry]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#ahPeb)"/>${hl(x - rx * 0.3, y - ry * 0.4, rx * 0.35, ry * 0.25, 0.5)}`).join('')}
    <path d="M60 640 C 120 590, 180 560, 240 540" fill="none" stroke="#7a5230" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    <path d="M240 540 c 20 -6 30 -16 34 -28 M200 556 c -10 10 -26 14 -40 12" fill="none" stroke="#7a5230" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
  // ---- the mound ---------------------------------------------------------
  // outer contour: two cubic beziers
  const C1 = [[480, 470], [500, 300], [640, 90], [800, 90]];
  const C2 = [[800, 90], [960, 90], [1100, 300], [1120, 470]];
  const bz = (c, t) => {
    const u = 1 - t;
    const p = (i) => u * u * u * c[0][i] + 3 * u * u * t * c[1][i] + 3 * u * t * t * c[2][i] + t * t * t * c[3][i];
    const d = (i) => 3 * u * u * (c[1][i] - c[0][i]) + 6 * u * t * (c[2][i] - c[1][i]) + 3 * t * t * (c[3][i] - c[2][i]);
    return { x: p(0), y: p(1), a: Math.atan2(d(1), d(0)) };
  };
  const needleCols = ['#5a3216', '#7a4a22', '#9b6230', '#b87a3c', '#4a2810', '#c58c48'];
  let needles = '';
  [C1, C2].forEach(c => {
    for (let i = 0; i <= 150; i++) {
      const p = bz(c, i / 150);
      for (let k = 0; k < 2; k++) {
        const inset = 4 + R() * 16;
        const nx = Math.sin(p.a), ny = -Math.cos(p.a);  // outward-ish normal
        const cx = p.x - nx * inset * -1, cy = p.y - ny * inset * -1;
        const a = p.a + (R() - 0.5) * 1.6, L = 12 + R() * 16;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
        needles += `<path d="M${f(cx - dx)} ${f(cy - dy)} L${f(cx + dx)} ${f(cy + dy)}" stroke="${needleCols[(R() * needleCols.length) | 0]}" stroke-width="${f(2.2 + R() * 1.6)}" stroke-linecap="round"/>`;
      }
    }
  });
  const mound = `
    ${shadow(800, 476, 340, 14, 0.35)}
    <path d="M480 470 C 500 300, 640 90, 800 90 C 960 90, 1100 300, 1120 470 Z" fill="url(#ahCrust)"/>
    <path d="M512 470 C 532 312, 662 118, 800 118 C 938 118, 1068 312, 1088 470 Z" fill="url(#ahSand)"/>
    <g>${needles}</g>
    <path d="M560 300 C 600 200, 680 120, 760 104" fill="none" stroke="#ffe7b8" stroke-width="6" stroke-linecap="round" opacity=".35"/>`;
  // grass along the surface outside the mound
  let grass = `<rect x="-200" y="462" width="690" height="12" rx="6" fill="url(#ahGrass)"/><rect x="1110" y="462" width="300" height="12" rx="6" fill="url(#ahGrass)"/>`;
  [[-20, 492], [1110, 1230]].forEach(([a, b]) => {
    for (let x = a; x < b; x += 7 + R() * 6) {
      const hgt = 14 + R() * 26, lean = (R() - 0.5) * 14;
      grass += `<path d="M${f(x)} 468 q${f(lean * 0.4)} ${f(-hgt * 0.6)} ${f(lean)} ${f(-hgt)}" fill="none" stroke="${R() > 0.5 ? '#7d9c46' : '#98b45a'}" stroke-width="${f(3 + R() * 2)}" stroke-linecap="round"/>`;
    }
  });
  // a dandelion and a fallen leaf on the left, sized for the title area
  const props = `
    <path d="M380 466 C 384 420, 376 380, 386 330" fill="none" stroke="#7d9c46" stroke-width="5" stroke-linecap="round"/>
    <circle cx="386" cy="318" r="26" fill="#f6c23a"/><circle cx="386" cy="318" r="16" fill="#f9d45a"/>${hl(378, 308, 9, 5, 0.6)}
    ${shadow(250, 470, 60, 5, 0.25)}
    <path d="M190 466 C 220 440, 290 440, 316 462 C 290 474, 220 476, 190 466 Z" fill="#c9862e"/>
    <path d="M196 465 C 240 458, 280 458, 312 462" fill="none" stroke="#9a5e1c" stroke-width="2.5"/>
    ${hl(240, 452, 22, 4, 0.35)}`;
  // ---- inside: tunnels and chambers (clipped to the cut face) ------------
  const tunnel = (d) => `<path d="${d}" fill="none" stroke="#7a5030" stroke-width="30" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#9c7046" stroke-width="20" stroke-linecap="round"/>`;
  const chamber = (cx, cy, rx, ry) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}" fill="#c99a62"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ahCham)"/>
    <path d="M${cx - rx * 0.85} ${f(cy + ry * 0.5)} Q${cx} ${f(cy + ry * 1.25)} ${cx + rx * 0.85} ${f(cy + ry * 0.5)}" fill="none" stroke="#f6dcaa" stroke-width="3" opacity=".55"/>`;
  const inside = `
    <g clip-path="url(#ahCut)">
      ${Array.from({ length: 90 }, () => {
        const x = 520 + R() * 560, y = 130 + R() * 340, r = 1 + R() * 2.6;
        return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${R() > 0.5 ? '#c99a5e' : '#fff3d6'}" opacity=".6"/>`;
      }).join('')}
      ${tunnel('M800 96 C 800 140, 760 170, 720 220')}
      ${tunnel('M760 250 C 830 260, 880 300, 900 330')}
      ${tunnel('M880 370 C 860 410, 800 420, 770 440')}
      ${tunnel('M760 470 C 760 510, 820 530, 860 560')}
      ${tunnel('M640 270 C 600 320, 610 380, 640 420')}
      ${chamber(700, 256, 112, 52)}
      ${chamber(920, 348, 92, 40)}
      ${chamber(700, 452, 96, 40)}
      ${chamber(880, 576, 150, 52)}
      <ellipse cx="800" cy="98" rx="20" ry="9" fill="#3e2410"/>
    </g>`;
  // eggs (chamber 2) and seeds (chamber 3)
  const eggs = [[880, 372], [898, 368], [916, 372], [934, 370], [952, 373], [890, 358], [908, 356], [926, 357], [944, 360], [900, 346], [918, 344], [936, 347], [910, 334], [928, 334]]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="7" fill="url(#ahEgg)" transform="rotate(${f((R() - 0.5) * 30)} ${x} ${y})"/>`).join('');
  const seeds = [[650, 476], [670, 478], [690, 476], [710, 478], [660, 464], [682, 464], [702, 466], [672, 452]]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="url(#ahSeed)" transform="rotate(${f((R() - 0.5) * 50)} ${x} ${y})"/>${hl(x - 3, y - 3, 3.5, 2, 0.45)}`).join('');
  const ants = `
    ${shadow(915, 382, 70, 5, 0.25)}${eggs}
    ${seeds}
    ${ant(988, 362, 0.55, { flip: 1 })}
    ${ant(760, 466, 0.5)}
    ${ant(860, 590, 1.05, { queen: 1, gaster: 46 })}
    ${ant(996, 594, 0.55, { flip: 1 })}
    ${ant(690, 268, 1.25, { crumb: 1 })}`;
  const scene = sky + earth + mound + grass + props + inside + ants;
  const note = `
  <!-- Preview art for "The Ant and the Crumb" — generated by
       tools/build-previews.js from books/anthill/preview.js. Original vector
       in the book's clay style; nothing traced. -->`;
  return {
    cover: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="433 80 734 550" width="400" height="300">${note}${defs}${scene}</svg>\n`,
    og: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${note}${defs}${scene}
  ${h.title(['The Ant and', 'the Crumb'], ['#fff3d6', '#ffd27a'], '#5a2e14', 50, 120)}
</svg>\n`
  };
};
