// Preview art for "Where Is the Cat?" — consumed by tools/build-previews.js
// (node only; not loaded by the book page). Hand-built vector of the book's
// wooden toys on the dark walnut table, lit by soft window light from the
// upper left: the black painted beech cat (closed smiling cream eyes, pink
// nose, red collar with a gold tag) sitting IN the blue painted box with its
// hinged lid open, and the little beech table beside it. The key word is set
// in the book's red bold (#c8231e).
//
// One scene is drawn in the 1200 × 630 og frame; the cover reuses it through
// a 4:3 viewBox, without the title (but with the red "in" word chip).
module.exports = (h) => {
  const R = h.rand(77);
  const f = n => n.toFixed(1);
  const RED = '#c8231e';
  const defs = `
  <defs>
    <linearGradient id="wcWall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#efe3cc"/><stop offset=".55" stop-color="#dccbad"/><stop offset="1" stop-color="#b9a283"/>
    </linearGradient>
    <linearGradient id="wcLight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf0" stop-opacity=".75"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="wcWalnut" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6e4a2e"/><stop offset=".5" stop-color="#4e321e"/><stop offset="1" stop-color="#352113"/>
    </linearGradient>
    <linearGradient id="wcWalnutEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a5434"/><stop offset=".25" stop-color="#3a2414"/><stop offset="1" stop-color="#22140a"/>
    </linearGradient>
    <radialGradient id="wcSheen" cx=".3" cy=".1" r=".8">
      <stop offset="0" stop-color="#ffe6c0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe6c0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wcBlue" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4f8fd0"/><stop offset=".35" stop-color="#2f6fb6"/><stop offset="1" stop-color="#1d4c86"/>
    </linearGradient>
    <linearGradient id="wcBlueSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c4579"/><stop offset="1" stop-color="#14345e"/>
    </linearGradient>
    <linearGradient id="wcBlueLid" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#2a62a6"/><stop offset="1" stop-color="#4c8bcc"/>
    </linearGradient>
    <linearGradient id="wcBeech" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f3d6a6"/><stop offset=".5" stop-color="#e6c28a"/><stop offset="1" stop-color="#c89f66"/>
    </linearGradient>
    <linearGradient id="wcBeechDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d9b47c"/><stop offset="1" stop-color="#a98050"/>
    </linearGradient>
    <linearGradient id="wcInside" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a5a36"/><stop offset="1" stop-color="#c9a470"/>
    </linearGradient>
    <radialGradient id="wcBlack" cx=".32" cy=".28" r=".85">
      <stop offset="0" stop-color="#5a5652"/><stop offset=".35" stop-color="#24211f"/><stop offset="1" stop-color="#0b0a09"/>
    </radialGradient>
    <radialGradient id="wcGold" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#e0b040"/><stop offset="1" stop-color="#9a6e16"/>
    </radialGradient>
    <linearGradient id="wcCollar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2392c"/><stop offset="1" stop-color="#9a1610"/>
    </linearGradient>
    <filter id="wcBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="wcBlur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>`;
  // ---- room ---------------------------------------------------------------
  const room = `
    <rect x="-200" y="-200" width="1600" height="1100" fill="url(#wcWall)"/>
    <!-- window light falling on the wall from the upper left -->
    <g filter="url(#wcBlur)" opacity=".9">
      <path d="M520 20 L780 20 L700 330 L440 330 Z" fill="url(#wcLight)"/>
    </g>
    <g filter="url(#wcBlur2)" opacity=".18" fill="#6a5338">
      <path d="M640 20 L656 20 L576 330 L560 330 Z"/><path d="M500 170 L740 170 L736 184 L496 184 Z"/>
    </g>
    <!-- walnut tabletop -->
    <path d="M-200 430 H1400 V700 H-200 Z" fill="url(#wcWalnut)"/>
    ${Array.from({ length: 26 }, (_, i) => {
      const y = 438 + i * 7.6 + R() * 3, a = (R() - 0.5) * 10, b = (R() - 0.5) * 10;
      return `<path d="M-20 ${f(y)} C 300 ${f(y + a)}, 700 ${f(y - b)}, 1220 ${f(y + a * 0.5)}" fill="none" stroke="${R() > 0.4 ? '#2a180c' : '#8a6040'}" stroke-width="${f(0.8 + R() * 1.6)}" opacity="${f(0.25 + R() * 0.3)}"/>`;
    }).join('')}
    <path d="M180 470 C 240 462, 300 480, 360 470 C 330 492, 220 494, 180 470 Z" fill="none" stroke="#2a180c" stroke-width="1.4" opacity=".4"/>
    <rect x="-200" y="430" width="1600" height="270" fill="url(#wcSheen)"/>
    <rect x="-200" y="428" width="1600" height="4" fill="#8a6444" opacity=".7"/>
    <rect x="-200" y="604" width="1600" height="40" fill="url(#wcWalnutEdge)"/>`;
  // ---- little beech table (right) -----------------------------------------
  const grain = (x, y, w, hh, n, col = '#b48650') => Array.from({ length: n }, (_, i) => {
    const yy = y + (i + 0.5) * hh / n + (R() - 0.5) * 2;
    return `<path d="M${x + 3} ${f(yy)} C ${f(x + w * 0.3)} ${f(yy + (R() - 0.5) * 4)}, ${f(x + w * 0.7)} ${f(yy + (R() - 0.5) * 4)}, ${x + w - 3} ${f(yy)}" fill="none" stroke="${col}" stroke-width=".9" opacity=".55"/>`;
  }).join('');
  const leg = (x, y, hh) => `<rect x="${x}" y="${y}" width="16" height="${hh}" rx="5" fill="url(#wcBeech)"/>
    <rect x="${x + 3}" y="${y}" width="3" height="${hh}" rx="1.5" fill="#fff6e0" opacity=".45"/>`;
  const table = `
    <ellipse cx="1060" cy="548" rx="120" ry="14" fill="#140a04" opacity=".45" filter="url(#wcBlur2)"/>
    <path d="M1100 548 L1210 560 L1180 520 Z" fill="#140a04" opacity=".18" filter="url(#wcBlur)"/>
    ${leg(1112, 430, 104)}${leg(1006, 430, 104)}
    <rect x="985" y="388" width="170" height="16" rx="5" fill="url(#wcBeechDark)"/>
    <path d="M985 396 L1015 372 H1180 L1155 396 Z" fill="#ecd0a0"/>
    ${grain(1000, 374, 165, 20, 5)}
    <rect x="970" y="394" width="190" height="22" rx="7" fill="url(#wcBeech)"/>
    ${grain(972, 396, 186, 18, 4, '#a87a46')}
    <rect x="974" y="396" width="182" height="3" rx="1.5" fill="#fff6e0" opacity=".6"/>
    ${leg(980, 414, 132)}${leg(1134, 414, 132)}
    <ellipse cx="988" cy="546" rx="14" ry="4" fill="#140a04" opacity=".5"/><ellipse cx="1142" cy="546" rx="14" ry="4" fill="#140a04" opacity=".5"/>`;
  // ---- the blue box with the hinged lid open, cat inside ------------------
  // front face x 600..900, top y 380, bottom 560; depth offset (70,-46)
  const bx = 600, bw = 300, bt = 380, bb = 560, dx = 70, dy = -46;
  const box = `
    <!-- contact + cast shadow (light from upper left) -->
    <path d="M${bx + bw} ${bb} L${bx + bw + dx} ${bb + dy} L${bx + bw + 190} ${bb - 4} L${bx + bw + 40} ${bb + 20} Z" fill="#140a04" opacity=".35" filter="url(#wcBlur)"/>
    <ellipse cx="${bx + bw / 2 + 20}" cy="${bb + 4}" rx="${bw / 2 + 30}" ry="14" fill="#140a04" opacity=".55" filter="url(#wcBlur2)"/>
    <!-- the open lid, hinged at the back top edge, tilted back -->
    <path d="M${bx + dx} ${bt + dy} L${bx + dx + 40} ${bt + dy - 170} L${bx + bw + dx + 40} ${bt + dy - 170} L${bx + bw + dx} ${bt + dy} Z" fill="url(#wcBlueLid)"/>
    <path d="M${bx + dx + 12} ${bt + dy - 6} L${bx + dx + 46} ${bt + dy - 160} L${bx + bw + dx + 30} ${bt + dy - 160} L${bx + bw + dx - 4} ${bt + dy - 6} Z" fill="#e8c890"/>
    ${grain(bx + dx + 30, bt + dy - 150, bw - 30, 140, 9, '#b48650')}
    <path d="M${bx + dx + 40} ${bt + dy - 170} L${bx + bw + dx + 40} ${bt + dy - 170}" stroke="#7fb2e6" stroke-width="4" stroke-linecap="round"/>
    <rect x="${bx + dx + 60}" y="${bt + dy - 6}" width="26" height="9" rx="2" fill="url(#wcGold)"/><rect x="${bx + dx + bw - 90}" y="${bt + dy - 6}" width="26" height="9" rx="2" fill="url(#wcGold)"/>
    <!-- side face -->
    <path d="M${bx + bw} ${bt} L${bx + bw + dx} ${bt + dy} L${bx + bw + dx} ${bb + dy} L${bx + bw} ${bb} Z" fill="url(#wcBlueSide)"/>
    <!-- open top: inner back wall + rim -->
    <path d="M${bx} ${bt} L${bx + dx} ${bt + dy} H${bx + bw + dx} L${bx + bw} ${bt} Z" fill="url(#wcInside)"/>
    <path d="M${bx + 10} ${bt - 2} L${bx + dx + 6} ${bt + dy + 4} H${bx + bw + dx - 8} L${bx + bw - 6} ${bt - 2} Z" fill="#3a2614" opacity=".55"/>`;
  // the cat: head + chest above the front rim, paws over the rim, tail over the side
  const cx = 750, cy = 288;
  const cat = `
    <!-- body in the box -->
    <path d="M${cx - 78} ${bt + 4} C ${cx - 86} ${cy + 40}, ${cx - 50} ${cy + 22}, ${cx} ${cy + 22} C ${cx + 50} ${cy + 22}, ${cx + 86} ${cy + 40}, ${cx + 78} ${bt + 4} Z" fill="url(#wcBlack)"/>
    <!-- tail curling over the right side of the box -->
    <path d="M${bx + bw - 30} ${bt - 6} C ${bx + bw + 30} ${bt - 40}, ${bx + bw + 76} ${bt - 10}, ${bx + bw + 62} ${bt + 60}" fill="none" stroke="#14110f" stroke-width="22" stroke-linecap="round"/>
    <path d="M${bx + bw - 20} ${bt - 14} C ${bx + bw + 26} ${bt - 40}, ${bx + bw + 62} ${bt - 20}, ${bx + bw + 60} ${bt + 30}" fill="none" stroke="#6a6662" stroke-width="4" stroke-linecap="round" opacity=".55"/>
    <!-- ears -->
    <path d="M${cx - 70} ${cy - 30} C ${cx - 78} ${cy - 80}, ${cx - 70} ${cy - 108}, ${cx - 58} ${cy - 112} C ${cx - 40} ${cy - 100}, ${cx - 22} ${cy - 84}, ${cx - 14} ${cy - 66} Z" fill="url(#wcBlack)"/>
    <path d="M${cx + 70} ${cy - 30} C ${cx + 78} ${cy - 80}, ${cx + 70} ${cy - 108}, ${cx + 58} ${cy - 112} C ${cx + 40} ${cy - 100}, ${cx + 22} ${cy - 84}, ${cx + 14} ${cy - 66} Z" fill="#141110"/>
    <path d="M${cx - 60} ${cy - 54} C ${cx - 64} ${cy - 80}, ${cx - 60} ${cy - 96}, ${cx - 56} ${cy - 98} C ${cx - 44} ${cy - 88}, ${cx - 34} ${cy - 78}, ${cx - 28} ${cy - 66} Z" fill="#3a2a28"/>
    <!-- head -->
    <ellipse cx="${cx}" cy="${cy - 10}" rx="84" ry="72" fill="url(#wcBlack)"/>
    <ellipse cx="${cx - 34}" cy="${cy - 50}" rx="30" ry="14" fill="#fff" opacity=".22" transform="rotate(-20 ${cx - 34} ${cy - 50})"/>
    <ellipse cx="${cx - 46}" cy="${cy - 54}" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-24 ${cx - 46} ${cy - 54})"/>
    <!-- closed smiling eyes (cream) -->
    <path d="M${cx - 50} ${cy - 14} Q${cx - 34} ${cy - 32} ${cx - 18} ${cy - 14}" fill="none" stroke="#f3e4c0" stroke-width="7" stroke-linecap="round"/>
    <path d="M${cx + 18} ${cy - 14} Q${cx + 34} ${cy - 32} ${cx + 50} ${cy - 14}" fill="none" stroke="#f3e4c0" stroke-width="7" stroke-linecap="round"/>
    <!-- pink nose + mouth -->
    <path d="M${cx - 10} ${cy + 4} Q${cx} ${cy} ${cx + 10} ${cy + 4} Q${cx + 8} ${cy + 12} ${cx} ${cy + 15} Q${cx - 8} ${cy + 12} ${cx - 10} ${cy + 4} Z" fill="#ec8fa2"/>
    <ellipse cx="${cx - 3}" cy="${cy + 5}" rx="3.5" ry="2" fill="#fff" opacity=".6"/>
    <path d="M${cx} ${cy + 15} v6 M${cx} ${cy + 21} q-9 9 -17 1 M${cx} ${cy + 21} q9 9 17 1" fill="none" stroke="#f3e4c0" stroke-width="3.4" stroke-linecap="round"/>
    <g stroke="#e9dcc0" stroke-width="2" stroke-linecap="round" opacity=".55">
      <path d="M${cx - 40} ${cy + 12} L${cx - 92} ${cy + 4}"/><path d="M${cx - 40} ${cy + 20} L${cx - 90} ${cy + 24}"/>
      <path d="M${cx + 40} ${cy + 12} L${cx + 92} ${cy + 4}"/><path d="M${cx + 40} ${cy + 20} L${cx + 90} ${cy + 24}"/>
    </g>
    <!-- red collar + gold tag -->
    <path d="M${cx - 66} ${cy + 46} Q${cx} ${cy + 74} ${cx + 66} ${cy + 46} L${cx + 64} ${cy + 62} Q${cx} ${cy + 90} ${cx - 64} ${cy + 62} Z" fill="url(#wcCollar)"/>
    <path d="M${cx - 60} ${cy + 50} Q${cx - 20} ${cy + 70} ${cx + 10} ${cy + 70}" fill="none" stroke="#ff8a7a" stroke-width="2.5" opacity=".7"/>
    <circle cx="${cx}" cy="${cy + 94}" r="15" fill="url(#wcGold)"/><circle cx="${cx}" cy="${cy + 94}" r="9" fill="none" stroke="#a87a1e" stroke-width="1.5" opacity=".6"/>
    <ellipse cx="${cx - 5}" cy="${cy + 88}" rx="5" ry="3" fill="#fff" opacity=".7"/>
    <!-- paws over the rim -->
    <ellipse cx="${cx - 42}" cy="${bt + 4}" rx="26" ry="16" fill="url(#wcBlack)"/>
    <ellipse cx="${cx + 42}" cy="${bt + 4}" rx="26" ry="16" fill="url(#wcBlack)"/>
    <ellipse cx="${cx - 50}" cy="${bt - 3}" rx="10" ry="4" fill="#fff" opacity=".25"/>
    <ellipse cx="${cx + 34}" cy="${bt - 3}" rx="10" ry="4" fill="#fff" opacity=".2"/>`;
  const boxFront = `
    <rect x="${bx}" y="${bt + 8}" width="${bw}" height="${bb - bt - 8}" rx="8" fill="url(#wcBlue)"/>
    <rect x="${bx}" y="${bt + 8}" width="${bw}" height="10" rx="4" fill="#7fb2e6" opacity=".8"/>
    <rect x="${bx + 2}" y="${bt + 8}" width="6" height="${bb - bt - 16}" rx="3" fill="#a8cdf0" opacity=".5"/>
    <path d="M${bx + 6} ${bb - 4} H${bx + bw - 6}" stroke="#d9b47c" stroke-width="2" opacity=".6"/>
    <rect x="${bx + 30}" y="${bt + 40}" width="${bw - 60}" height="${bb - bt - 70}" rx="10" fill="none" stroke="#1a477e" stroke-width="3" opacity=".5"/>
    <path d="M${bx + 30} ${bt + 50} Q${bx + 30} ${bt + 40} ${bx + 40} ${bt + 40} H${bx + 160}" fill="none" stroke="#a8cdf0" stroke-width="2" opacity=".55"/>
    <rect x="${bx}" y="${bt + 8}" width="${bw}" height="${bb - bt - 8}" rx="8" fill="url(#wcSheen)" opacity=".6"/>`;
  // a word chip in the book's red bold
  const chip = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-62" y="-36" width="124" height="60" rx="18" fill="#fbf3e4" opacity=".95"/>
    <rect x="-62" y="-36" width="124" height="60" rx="18" fill="none" stroke="${RED}" stroke-width="3" opacity=".35"/>
    <text x="0" y="10" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="44" fill="${RED}">in</text></g>`;
  const scene = room + table + box + cat + boxFront;
  const note = `
  <!-- Preview art for "Where Is the Cat?" — generated by
       tools/build-previews.js from books/wherecat/preview.js. Original vector
       of the book's wooden toys; nothing traced. -->`;
  return {
    cover: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="540 150 640 480" width="400" height="300">${note}${defs}${scene}${chip(760, 600, 1)}</svg>\n`,
    og: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">${note}${defs}${scene}
  ${h.title(['Where Is', 'the Cat?'], ['#fff6e6', '#ffd27a'], '#3a2616', 50, 130)}
  <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="46" fill="${RED}" style="paint-order:stroke fill" stroke="#fbf3e4" stroke-width="8" stroke-linejoin="round">
    <text x="60" y="340">in · on · under</text><text x="60" y="400">behind · next to</text>
  </g>
</svg>\n`
  };
};
