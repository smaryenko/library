// Original layered cozy fireplace, rich flat-cartoon-plus-shading style. Style
// reference only (a Christmas hearth: rounded stone surround, red brick firebox
// with mortar, a glowing log, tall layered fire, a wooden mantel dressed with
// pine garland + baubles + a red bow, four distinct hanging stockings, and a
// wooden hearth floor crowded with wrapped gifts). Redrawn as original vector;
// nothing from the reference is traced or embedded.
//
// buildFireplace() -> SVG string. data-part layers, back -> front:
//   shadow, hearth, surround, firebox, log, embers, fire, glow, mantel,
//   garland, stockings, gifts

function buildFireplace() {
  const uid = 'f' + Math.random().toString(36).slice(2, 8);

  // rounded stone blocks filling a rect, with per-stone tone + soft top light
  function stones(x, y, w, h, bw, bh) {
    const tones = ['#CDBB9C', '#C2AE8E', '#D6C6AB', '#B8A281'];
    let out = '';
    for (let yy = 0, row = 0; yy < h - 2; yy += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let xx = -off; xx < w; xx += bw) {
        const cx = x + xx, cy = y + yy;
        const c = tones[(row * 3 + Math.floor((xx + off) / bw)) % tones.length];
        out += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${bw - 3}" height="${bh - 3}" rx="6" fill="${c}"/>
                <rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${bw - 3}" height="${(bh - 3) * 0.4}" rx="6" fill="rgba(255,255,255,0.14)"/>`;
      }
    }
    return `<clipPath id="stc-${uid}-${x}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath>
      <g clip-path="url(#stc-${uid}-${x}-${y})">${out}</g>`;
  }

  // one wavy flame tongue built from a smooth closed path
  function flame(cx, baseY, h, w, fill, op) {
    const d = `M${cx} ${baseY}
      C${cx - w} ${baseY - h * 0.25} ${cx - w * 0.5} ${baseY - h * 0.55} ${cx - w * 0.6} ${baseY - h * 0.7}
      C${cx - w * 0.7} ${baseY - h * 0.85} ${cx - w * 0.1} ${baseY - h * 0.8} ${cx} ${baseY - h}
      C${cx + w * 0.1} ${baseY - h * 0.8} ${cx + w * 0.7} ${baseY - h * 0.85} ${cx + w * 0.6} ${baseY - h * 0.7}
      C${cx + w * 0.5} ${baseY - h * 0.55} ${cx + w} ${baseY - h * 0.25} ${cx} ${baseY} Z`;
    return `<path d="${d}" fill="${fill}" opacity="${op == null ? 1 : op}"/>`;
  }

  // a stocking: ONE clean body (leg + foot) + a single fur cuff + an optional
  // pattern clipped to the body. No duplicate cuff / stray toe shapes.
  const STK_BODY = 'M4 16 L44 16 L44 58 ' +            // leg sides
    'Q44 72 60 78 Q78 86 68 102 Q60 114 42 106 ' +      // foot/toe curl
    'Q24 98 20 80 L20 16 Z';
  function stocking(x, top, body, pattern) {
    return `<g transform="translate(${x} ${top})">
      <!-- hanging loop -->
      <path d="M40 2 q10 -6 10 8" fill="none" stroke="#C9962B" stroke-width="2.5"/>
      <path d="${STK_BODY}" fill="${body}"/>
      ${pattern ? `<g clip-path="url(#stkc-${uid}-${x})">${pattern()}</g>
                   <clipPath id="stkc-${uid}-${x}"><path d="${STK_BODY}"/></clipPath>` : ''}
      <!-- soft inner shade on the foot -->
      <path d="M20 60 Q22 80 42 92 Q30 96 22 82 L20 70 Z" fill="rgba(0,0,0,0.12)"/>
      <!-- single fur cuff -->
      <rect x="0" y="0" width="48" height="18" rx="6" fill="#E7DBC0"/>
      <rect x="0" y="12" width="48" height="6" rx="3" fill="#CFC0A0"/>
    </g>`;
  }
  const checkPattern = () => {
    let p = '';
    for (let i = 0; i < 7; i++) for (let j = 0; j < 10; j++)
      if ((i + j) % 2) p += `<rect x="${i * 8}" y="${16 + j * 10}" width="8" height="10" fill="rgba(255,255,255,0.5)"/>`;
    return p;
  };

  // detailed wrapped gift: lid overhang, ribbon cross, loopy bow, soft shadow
  function gift(x, y, w, h, col, colD, rib) {
    return `
      <ellipse cx="${x + w / 2}" cy="${y + h + 2}" rx="${w * 0.6}" ry="5" fill="rgba(0,0,0,0.18)"/>
      <rect x="${x}" y="${y + 5}" width="${w}" height="${h - 5}" rx="2" fill="${col}"/>
      <rect x="${x}" y="${y + 5}" width="${w}" height="${h - 5}" rx="2" fill="url(#giftsh-${uid})"/>
      <rect x="${x - 2}" y="${y}" width="${w + 4}" height="9" rx="2" fill="${colD}"/>
      <rect x="${x + w / 2 - 3}" y="${y + 5}" width="6" height="${h - 5}" fill="${rib}"/>
      <rect x="${x - 2}" y="${y + 2}" width="${w + 4}" height="5" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q-14 -12 -22 -4 q-2 6 6 7 q10 1 16 -3 z" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q14 -12 22 -4 q2 6 -6 7 q-10 1 -16 -3 z" fill="${rib}"/>
      <circle cx="${x + w / 2}" cy="${y + 2}" r="3.5" fill="${rib}"/>`;
  }

  // pine garland swag: a thick needled rope with baubles + a red bow
  const garland = (() => {
    let s = '';
    // base swag stroke
    s += `<path d="M40 110 Q180 156 320 110" fill="none" stroke="#1C5E39" stroke-width="22" stroke-linecap="round"/>`;
    // needle tufts sticking out of the swag
    for (let i = 0; i <= 28; i++) {
      const t = i / 28, x = 40 + t * 280;
      const y = 110 + Math.sin(Math.PI * t) * 46 - 46 + 46 * (1 - Math.abs(0.5 - t) * 2) * 0 + (Math.sin(Math.PI * t) * 46);
      const yy = 110 + (Math.sin(Math.PI * t) * 46);
      const a = (t - 0.5) * 2; // -1..1 across
      s += `<line x1="${x}" y1="${yy}" x2="${x - 9 + a * 4}" y2="${yy + 14}" stroke="#2E8B57" stroke-width="2.4" stroke-linecap="round"/>`;
      s += `<line x1="${x}" y1="${yy}" x2="${x + 9 + a * 4}" y2="${yy + 14}" stroke="#256F46" stroke-width="2.4" stroke-linecap="round"/>`;
      s += `<line x1="${x}" y1="${yy}" x2="${x + a * 10}" y2="${yy - 12}" stroke="#39A063" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    // baubles tucked in the garland
    [[96, 150, '#CE3129'], [138, 160, '#E3A92F'], [222, 160, '#CE3129'], [266, 150, '#E3A92F'], [120, 156, '#CE3129']]
      .forEach(([x, y, c]) => {
        s += `<circle cx="${x}" cy="${y}" r="7" fill="${c}"/>
              <ellipse cx="${x - 2.2}" cy="${y - 2.4}" rx="2.4" ry="1.6" fill="rgba(255,255,255,0.75)"/>`;
      });
    // centre red bow
    s += `<g transform="translate(180 120)">
      <path d="M0 0 q-26 -18 -34 -4 q-6 12 8 16 q16 4 26 -8 z" fill="#D2322A"/>
      <path d="M0 0 q26 -18 34 -4 q6 12 -8 16 q-16 4 -26 -8 z" fill="#D2322A"/>
      <path d="M0 0 q-26 18 -34 4 q-6 -12 8 -16 q16 -4 26 8 z" fill="#B5281F"/>
      <path d="M0 0 q26 18 34 4 q6 -12 -8 -16 q-16 -4 -26 8 z" fill="#B5281F"/>
      <circle cx="0" cy="0" r="8" fill="#E24139"/>
      <ellipse cx="-3" cy="-3" rx="3" ry="2" fill="rgba(255,255,255,0.4)"/>
    </g>`;
    return s;
  })();

  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="fireGlow-${uid}" cx="50%" cy="62%" r="55%">
        <stop offset="0%" stop-color="rgba(255,190,90,0.9)"/>
        <stop offset="50%" stop-color="rgba(255,150,50,0.4)"/>
        <stop offset="100%" stop-color="rgba(255,150,50,0)"/>
      </radialGradient>
      <linearGradient id="mantelGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9A6B3C"/><stop offset="50%" stop-color="#7A5230"/>
        <stop offset="100%" stop-color="#5E3E22"/>
      </linearGradient>
      <linearGradient id="hearthGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8A5E34"/><stop offset="100%" stop-color="#6B4624"/>
      </linearGradient>
      <linearGradient id="brickGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8E3A26"/><stop offset="100%" stop-color="#5C2214"/>
      </linearGradient>
      <linearGradient id="giftsh-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.12)"/>
      </linearGradient>
    </defs>
    ${buildAnim(uid, { tracks: [
      // the fire ROARS up and flickers hard, licking and bending side to side
      { parts: 'fire', origin: '180px 306px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:scaleY(1) scaleX(1) rotate(0)}18%{transform:scaleY(1.32) scaleX(.9) rotate(-2deg)}40%{transform:scaleY(1.05) scaleX(1.04) rotate(2deg)}62%{transform:scaleY(1.24) scaleX(.93) rotate(-1.5deg)}82%{transform:scaleY(1.1) scaleX(1)}' },
      // the glow swells and the embers brighten with each flare-up
      { parts: ['glow','embers'], origin: '180px 296px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{opacity:.85;transform:scale(1)}20%{opacity:1;transform:scale(1.2)}55%{opacity:.7;transform:scale(1.05)}80%{opacity:1;transform:scale(1.16)}' },
      // the warm draught stirs the stockings into a bigger swing
      { parts: 'stockings', origin: '180px 120px', timing: '1.4s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}25%{transform:rotate(5deg)}60%{transform:rotate(-4.5deg)}85%{transform:rotate(2deg)}' },
      // the pine garland + mantel dressing sway with the heat
      { parts: 'garland', origin: '180px 110px', timing: '1.4s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0) translateY(0)}30%{transform:rotate(1.4deg) translateY(1px)}65%{transform:rotate(-1.2deg)}' }
    ] })}

    <!-- scale the whole scene down so it sits within the viewBox like the
         other objects (it was overflowing the page). Scaling an ancestor <g>
         keeps each data-part layer intact for the pseudo-3D splitter. -->
    <g transform="translate(180 184) scale(0.82) translate(-180 -184)">

    <g data-part="shadow"><ellipse cx="180" cy="340" rx="140" ry="14" fill="rgba(0,0,0,0.18)"/></g>

    <!-- wooden hearth floor the whole thing stands on -->
    <g data-part="hearth">
      <rect x="40" y="308" width="280" height="30" rx="4" fill="url(#hearthGrad-${uid})"/>
      <line x1="180" y1="312" x2="180" y2="336" stroke="#5A3A1E" stroke-width="1.5"/>
      <rect x="40" y="308" width="280" height="5" fill="#A6774440" />
    </g>

    <!-- rounded stone surround: two legs + a lintel -->
    <g data-part="surround">
      <rect x="48" y="96" width="264" height="216" rx="8" fill="#C2AE8E"/>
      ${stones(48, 96, 58, 216, 24, 22)}
      ${stones(254, 96, 58, 216, 24, 22)}
      ${stones(48, 96, 264, 44, 26, 22)}
      <!-- subtle inner edge shadow around the opening -->
      <path d="M106 140 h148 v172 h-148 z" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="4"/>
    </g>

    <!-- red brick firebox with mortar lines + a warm back wash -->
    <g data-part="firebox">
      <rect x="106" y="140" width="148" height="172" fill="url(#brickGrad-${uid})"/>
      <rect x="106" y="140" width="148" height="172" fill="url(#fireGlow-${uid})" opacity="0.5"/>
      <g stroke="rgba(30,10,6,0.45)" stroke-width="1.6">
        ${Array.from({ length: 7 }, (_, r) => `<line x1="106" y1="${158 + r * 22}" x2="254" y2="${158 + r * 22}"/>`).join('')}
        ${Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => {
        const off = r % 2 ? 18 : 0;
        const x = 124 + c * 36 + off;
        return x < 252 ? `<line x1="${x}" y1="${158 + r * 22}" x2="${x}" y2="${158 + (r + 1) * 22}"/>` : '';
      }).join('')).join('')}
      </g>
    </g>

    <!-- the burning log + its cradle -->
    <g data-part="log">
      <ellipse cx="180" cy="300" rx="58" ry="14" fill="#4A2F18"/>
      <rect x="124" y="288" width="112" height="16" rx="8" fill="#5E3C20"/>
      <ellipse cx="124" cy="296" rx="9" ry="8" fill="#7A5230"/>
      <circle cx="124" cy="296" r="4.5" fill="#9A6B3C"/>
      <ellipse cx="236" cy="296" rx="9" ry="8" fill="#7A5230"/>
      <circle cx="236" cy="296" r="4.5" fill="#9A6B3C"/>
      <path d="M130 290 q50 -6 100 0" fill="none" stroke="#3A2614" stroke-width="2"/>
    </g>

    <!-- glowing embers along the log -->
    <g data-part="embers">
      ${Array.from({ length: 11 }, (_, i) => {
      const x = 134 + i * 10, y = 300 + (i % 2 ? 2 : 0);
      return `<circle cx="${x}" cy="${y}" r="2.6" fill="${i % 3 ? '#FF7A2A' : '#FFC24D'}"/>
                <circle cx="${x}" cy="${y}" r="5" fill="rgba(255,140,40,0.35)"/>`;
    }).join('')}
    </g>

    <!-- fire: a tall hot core with licking tongues, layered light->dark->light -->
    <g data-part="fire">
      ${flame(180, 294, 118, 40, '#D4541A', 0.95)}
      ${flame(164, 290, 86, 28, '#F47A1E')}
      ${flame(198, 290, 92, 28, '#F47A1E')}
      ${flame(180, 288, 104, 26, '#FFA62B')}
      ${flame(174, 286, 70, 18, '#FFD24A')}
      ${flame(188, 286, 64, 16, '#FFD24A')}
      ${flame(180, 284, 52, 12, '#FFF0A8')}
    </g>

    <g data-part="glow">
      <ellipse cx="180" cy="276" rx="120" ry="96" fill="url(#fireGlow-${uid})"/>
    </g>

    <!-- wooden mantel shelf with a lit edge -->
    <g data-part="mantel">
      <rect x="40" y="92" width="280" height="26" rx="5" fill="url(#mantelGrad-${uid})"/>
      <rect x="40" y="92" width="280" height="6" rx="3" fill="#B07C46"/>
      <rect x="40" y="112" width="280" height="6" rx="3" fill="rgba(0,0,0,0.25)"/>
    </g>

    <g data-part="garland">${garland}</g>

    <!-- four distinct stockings (plain red, red gingham, green, gold) -->
    <g data-part="stockings">
      ${stocking(74, 118, '#C73A30', null)}
      ${stocking(138, 118, '#D2322A', checkPattern)}
      ${stocking(202, 118, '#2E8B57', null)}
      ${stocking(266, 118, '#D3A12F', null)}
    </g>

    <!-- gifts crowding the hearth floor, left and right of the fire -->
    <g data-part="gifts">
      ${gift(50, 282, 46, 34, '#C73A30', '#A52820', '#E3B543')}
      ${gift(60, 254, 32, 30, '#F2E6CE', '#D9C9A8', '#C9962B')}
      ${gift(96, 290, 34, 26, '#2E8B57', '#1F6B41', '#E3B543')}
      ${gift(258, 280, 48, 36, '#2E8B57', '#1F6B41', '#E3B543')}
      ${gift(300, 288, 28, 28, '#C73A30', '#A52820', '#F2C94C')}
      ${gift(282, 256, 30, 26, '#C73A30', '#A52820', '#E3B543')}
    </g>

    </g>
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildFireplace };
