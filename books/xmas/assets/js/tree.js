// Original layered Christmas tree, rich flat-cartoon-plus-shading style. Style
// reference only (a dense decorated-pine look: needled boughs, a gold glitter
// star, glossy red/gold baubles, a shiny gold ribbon and warm lights). Redrawn
// as original vector; nothing from the reference is traced or embedded.
//
// Detail approach (vs the old flat triangles): the foliage is built from many
// overlapping needle SPRIGS drawn along descending tiers, so the silhouette is
// feathered and layered instead of three plain triangles. Shading uses several
// green tones (deep core, mid body, lit top-left edge) plus snow dusting.
//
// buildTree(cfg) -> SVG string. data-part layers, back -> front:
//   shadow, trunk, tree-back, tree, snow, garland, baubles, lights, star

function buildTree(cfg) {
  cfg = cfg || {};
  const green = cfg.green || '#2F7D43';
  const uid = 't' + Math.random().toString(36).slice(2, 8);

  const gLight = shade(green, 0.34);
  const gMid = green;
  const gDeep = shade(green, -0.34);
  const gCore = shade(green, -0.52);

  // One SOLID foliage tier: a filled bough layer with a scalloped lower edge
  // (little rounded dips so it reads as drooping branches), centred on x=180.
  // This is the body of the tree — a real filled silhouette, not loose strokes.
  function tier(cy, halfW, fill) {
    const x0 = 180 - halfW, x1 = 180 + halfW, top = cy - halfW * 1.15;
    const segs = 7, step = (x1 - x0) / segs;
    // left edge up to the tip, then scalloped bottom back to the right edge
    let d = `M180 ${top.toFixed(1)} L${x0.toFixed(1)} ${cy.toFixed(1)} `;
    for (let i = 0; i < segs; i++) {
      const bx = x0 + step * i, nx = x0 + step * (i + 1);
      const dipY = cy + 11;              // how far the scallop dips
      d += `Q${(bx + step * 0.5).toFixed(1)} ${dipY.toFixed(1)} ${nx.toFixed(1)} ${cy.toFixed(1)} `;
    }
    d += 'Z';
    return `<path d="${d}" fill="${fill}"/>`;
  }



  // glossy bauble with cap + specular dot + cast sheen
  function bauble(x, y, r, col) {
    return `
      <ellipse cx="${x}" cy="${y + r * 0.3}" rx="${r * 1.1}" ry="${r * 0.5}" fill="rgba(0,0,0,0.18)"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#bbl-${uid}-${col.slice(1)})"/>
      <path d="M${x - r * 0.7} ${y} a${r * 0.7} ${r * 0.7} 0 0 1 ${r * 1.1} ${-r * 0.5}"
            fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="${r * 0.18}"/>
      <ellipse cx="${x - r * 0.32}" cy="${y - r * 0.38}" rx="${r * 0.26}" ry="${r * 0.18}" fill="rgba(255,255,255,0.85)"/>
      <rect x="${x - 2.5}" y="${y - r - 5}" width="5" height="6" rx="1.5" fill="#C9962B"/>
      <rect x="${x - 1.5}" y="${y - r - 8}" width="3" height="4" rx="1.5" fill="#E7C25A"/>`;
  }
  const bblColors = ['#CE3129', '#E3A92F'];
  const bblGrads = bblColors.map(col => {
    const cl = shade(col, 0.45), cd = shade(col, -0.4);
    return `<radialGradient id="bbl-${uid}-${col.slice(1)}" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="${cl}"/><stop offset="55%" stop-color="${col}"/>
        <stop offset="100%" stop-color="${cd}"/>
      </radialGradient>`;
  }).join('');

  function lightDot(x, y) {
    return `<circle cx="${x}" cy="${y}" r="9" fill="url(#lglow-${uid})"/>
            <circle cx="${x}" cy="${y}" r="3" fill="#FFF6CE"/>
            <circle cx="${x - 0.8}" cy="${y - 0.8}" r="1.1" fill="#fff"/>`;
  }

  // shiny gold ribbon: a wavy band with a brighter inner highlight
  const garland = `
    <path d="M148 150 Q206 166 170 188 Q134 212 200 230 Q146 254 190 276 Q142 298 212 316"
          fill="none" stroke="#B8891F" stroke-width="9" stroke-linecap="round"/>
    <path d="M148 150 Q206 166 170 188 Q134 212 200 230 Q146 254 190 276 Q142 298 212 316"
          fill="none" stroke="url(#ribbon-${uid})" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M148 150 Q206 166 170 188 Q134 212 200 230 Q146 254 190 276 Q142 298 212 316"
          fill="none" stroke="rgba(255,248,210,0.7)" stroke-width="1.8" stroke-linecap="round"/>`;

  // Click animation (ships inside the SVG): the star twinkles with a bright
  // pulse, the lights flash, and the baubles give a little jiggle — a happy
  // "the tree lights up" moment. Built via the shared buildAnim helper.
  const animStyle = buildAnim(uid, { tracks: [
    // the whole tree gives a happy shimmy from its base
    { parts: ['tree','tree-back'], origin: '180px 330px', timing: '1.3s ease-in-out',
      keyframes: '0%,100%{transform:rotate(0)}20%{transform:rotate(2.4deg)}50%{transform:rotate(-2deg)}75%{transform:rotate(1.2deg)}' },
    // the star bursts bright and spins
    { parts: 'star', origin: '180px 105px', timing: '1.3s ease-in-out',
      keyframes: '0%,100%{transform:scale(1) rotate(0);filter:none}35%{transform:scale(1.4) rotate(26deg);filter:drop-shadow(0 0 18px rgba(255,236,150,1))}65%{transform:scale(1.14) rotate(10deg);filter:drop-shadow(0 0 8px rgba(255,236,150,.7))}' },
    // lights twinkle in a lively rhythm
    { parts: 'lights', origin: '180px 230px', timing: '1.3s ease-in-out',
      keyframes: '0%,100%{opacity:1}15%{opacity:.3}30%{opacity:1}45%{opacity:.4}60%{opacity:1}80%{opacity:.5}' },
    // baubles swing on the shimmy; the garland shifts with them
    { parts: 'baubles', origin: '180px 230px', timing: '1.3s ease-in-out',
      keyframes: '0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(6deg) translateY(1px)}60%{transform:rotate(-5deg) translateY(-1px)}' },
    { parts: 'garland', origin: '180px 230px', timing: '1.3s ease-in-out',
      keyframes: '0%,100%{transform:translateX(0)}30%{transform:translateX(3px)}65%{transform:translateX(-2px)}' }
  ] });

  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trunkGrad-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8A5E34"/><stop offset="45%" stop-color="#6E4826"/>
        <stop offset="100%" stop-color="#4E3118"/>
      </linearGradient>
      <radialGradient id="starGrad-${uid}" cx="38%" cy="32%" r="72%">
        <stop offset="0%" stop-color="#FFF2B8"/><stop offset="50%" stop-color="#F3C64B"/>
        <stop offset="100%" stop-color="#C98F20"/>
      </radialGradient>
      <radialGradient id="starGlow-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(255,238,170,0.85)"/>
        <stop offset="100%" stop-color="rgba(255,238,170,0)"/>
      </radialGradient>
      <radialGradient id="lglow-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(255,236,150,0.9)"/>
        <stop offset="100%" stop-color="rgba(255,236,150,0)"/>
      </radialGradient>
      <linearGradient id="ribbon-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFE79B"/><stop offset="50%" stop-color="#E3B543"/>
        <stop offset="100%" stop-color="#C08E24"/>
      </linearGradient>
      <!-- cone body volume: lit upper-left, deeper lower-right -->
      <linearGradient id="foliage-${uid}" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${gLight}"/>
        <stop offset="45%" stop-color="${gMid}"/>
        <stop offset="100%" stop-color="${gDeep}"/>
      </linearGradient>
      ${bblGrads}
    </defs>
    ${animStyle}

    <g data-part="shadow"><ellipse cx="180" cy="328" rx="92" ry="15" fill="rgba(0,0,0,0.16)"/></g>

    <g data-part="trunk">
      <rect x="169" y="300" width="22" height="36" rx="4" fill="url(#trunkGrad-${uid})"/>
      <ellipse cx="180" cy="336" rx="18" ry="5" fill="#3E2713"/>
    </g>

    <!-- dark silhouette pass behind: a hair wider, deepest green, so the main
         tiers sit on a continuous dark body (no gaps showing the page) -->
    <g data-part="tree-back">
      ${tier(308, 100, gCore)}
      ${tier(256, 82, gCore)}
      ${tier(204, 64, gCore)}
      ${tier(154, 44, gCore)}
    </g>

    <!-- main foliage: SOLID gradient-shaded tiers (the real tree body). Clean
         flat fill, no stroke texture. -->
    <g data-part="tree">
      ${tier(306, 94, `url(#foliage-${uid})`)}
      ${tier(254, 77, `url(#foliage-${uid})`)}
      ${tier(202, 60, `url(#foliage-${uid})`)}
      ${tier(152, 41, `url(#foliage-${uid})`)}
    </g>

    <g data-part="garland">${garland}</g>

    <g data-part="baubles">
      ${bauble(166, 180, 8, '#CE3129')}
      ${bauble(204, 202, 9, '#E3A92F')}
      ${bauble(150, 234, 9, '#CE3129')}
      ${bauble(210, 252, 8.5, '#E3A92F')}
      ${bauble(178, 286, 10, '#CE3129')}
      ${bauble(144, 296, 8, '#E3A92F')}
      ${bauble(220, 300, 9, '#CE3129')}
      ${bauble(192, 160, 7, '#E3A92F')}
    </g>

    <g data-part="lights">
      ${lightDot(188, 166)}${lightDot(158, 208)}${lightDot(208, 230)}
      ${lightDot(166, 264)}${lightDot(200, 282)}${lightDot(158, 306)}
      ${lightDot(216, 276)}${lightDot(176, 196)}
    </g>

    <!-- star: centred on the tree TIP (~y105) so it crowns the top -->
    <g data-part="star">
      <circle cx="180" cy="105" r="40" fill="url(#starGlow-${uid})"/>
      <!-- 5-point star, back layer slightly rotated for a double-glint look -->
      <path fill="#C98F20" transform="rotate(10 180 105)"
            d="M180 79 l8 18 20 2 -15 14 5 20 -18 -11 -18 11 5 -20 -15 -14 20 -2 z"/>
      <path fill="url(#starGrad-${uid})"
            d="M180 77 l8.5 19 21 2.2 -15.5 14.5 5 21 -19 -11.5 -19 11.5 5 -21 -15.5 -14.5 21 -2.2 z"/>
      <path d="M180 77 l8.5 19 -8.5 3 z" fill="rgba(255,250,220,0.65)"/>
    </g>
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildTree };
