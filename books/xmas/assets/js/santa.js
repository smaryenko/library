// Original layered "Santa in a sleigh", rich flat-cartoon-plus-shading style.
// Style reference only (a jolly Santa in a red velvet sleigh: fur-trimmed suit,
// big curly white beard, black belt with gold buckle, an ornate gold-scrolled
// red sleigh on curled runners, a stack of wrapped gifts). Redrawn as original
// vector; nothing from the reference is traced or embedded.
//
// buildSanta() -> SVG string. data-part layers, back -> front:
//   shadow, runners, sleigh-back, sleigh, gifts, santa-body, santa-arm,
//   santa-head, santa-face, santa-hat

function buildSanta() {
  const uid = 's' + Math.random().toString(36).slice(2, 8);
  const RED = '#C9332B', REDD = '#9A231C', REDL = '#E0574E';
  const SKIN = '#F3C6A4', SKIND = '#D9A784';

  // fur trim: ONE solid soft-edged white band along a polyline. Drawn as a
  // single filled ribbon (a thick rounded stroke) with a scalloped lower edge
  // and a faint shade line, so it reads as continuous fur — NOT a chain of
  // separate circles.
  function furBand(pts, r) {
    const d = 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L');
    // scallops: small bumps hanging below the band to suggest fur tufts
    let scallops = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      scallops += `<circle cx="${mx.toFixed(1)}" cy="${(my + r * 0.3).toFixed(1)}" r="${(r * 0.72).toFixed(1)}" fill="#F6F3EC"/>`;
    }
    return `
      <path d="${d}" fill="none" stroke="#F6F3EC" stroke-width="${r * 2}"
            stroke-linecap="round" stroke-linejoin="round"/>
      ${scallops}
      <path d="${d}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"
            stroke-linecap="round" transform="translate(0 ${r * 0.5})"/>`;
  }

  // detailed wrapped gift
  function gift(x, y, w, h, col, colD, rib) {
    return `
      <rect x="${x}" y="${y + 5}" width="${w}" height="${h - 5}" rx="2" fill="${col}"/>
      <rect x="${x - 2}" y="${y}" width="${w + 4}" height="9" rx="2" fill="${colD}"/>
      <rect x="${x + w / 2 - 3}" y="${y + 5}" width="6" height="${h - 5}" fill="${rib}"/>
      <rect x="${x - 2}" y="${y + 2}" width="${w + 4}" height="5" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q-13 -11 -20 -3 q-2 6 5 6 q9 1 15 -3 z" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q13 -11 20 -3 q2 6 -5 6 q-9 1 -15 -3 z" fill="${rib}"/>
      <circle cx="${x + w / 2}" cy="${y + 2}" r="3" fill="${rib}"/>`;
  }

  // ornate gold scroll (a spiral flourish) at a point
  function scroll(x, y, s, flip) {
    return `<path transform="translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})"
      d="M0 0 q-14 0 -14 12 q0 10 10 10 q7 0 7 -6 q0 -4 -4 -4 q-3 0 -3 2"
      fill="none" stroke="url(#goldGrad-${uid})" stroke-width="3.2" stroke-linecap="round"/>`;
  }

  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sleighGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${REDL}"/><stop offset="55%" stop-color="${RED}"/>
        <stop offset="100%" stop-color="${REDD}"/>
      </linearGradient>
      <linearGradient id="goldGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FBE59C"/><stop offset="50%" stop-color="#E3B543"/>
        <stop offset="100%" stop-color="#B2851F"/>
      </linearGradient>
      <radialGradient id="suitGrad-${uid}" cx="40%" cy="30%" r="78%">
        <stop offset="0%" stop-color="${REDL}"/><stop offset="60%" stop-color="${RED}"/>
        <stop offset="100%" stop-color="${REDD}"/>
      </radialGradient>
      <radialGradient id="faceGrad-${uid}" cx="42%" cy="34%" r="76%">
        <stop offset="0%" stop-color="#FCDFC8"/><stop offset="65%" stop-color="${SKIN}"/>
        <stop offset="100%" stop-color="${SKIND}"/>
      </radialGradient>
      <radialGradient id="hatGrad-${uid}" cx="40%" cy="30%" r="80%">
        <stop offset="0%" stop-color="${REDL}"/><stop offset="60%" stop-color="${RED}"/>
        <stop offset="100%" stop-color="${REDD}"/>
      </radialGradient>
    </defs>
    ${buildAnim(uid, { tracks: [
      // a big jolly wave: the arm (mitten) swings way up and back
      { parts: 'santa-arm', origin: '206px 198px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}22%{transform:rotate(-46deg)}45%{transform:rotate(-30deg)}68%{transform:rotate(-44deg)}85%{transform:rotate(-20deg)}' },
      // head + hat give a hearty "ho ho ho" belly-laugh bob
      { parts: ['santa-head','santa-face','santa-hat'], origin: '182px 150px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-7px) rotate(-6deg)}50%{transform:translateY(-1px) rotate(4deg)}75%{transform:translateY(-5px) rotate(-3deg)}' },
      // the body shakes with laughter
      { parts: 'santa-body', origin: '182px 240px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-2deg) translateY(-2px)}50%{transform:rotate(1.5deg)}75%{transform:rotate(-1deg)}' },
      // the whole sleigh rocks gently on its runners, gifts jostling
      { parts: ['sleigh','sleigh-back','runners'], origin: '180px 322px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}30%{transform:rotate(-2.4deg)}65%{transform:rotate(1.8deg)}' },
      { parts: 'gifts', origin: '268px 190px', timing: '1.3s ease-in-out',
        keyframes: '0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-3px) rotate(-3deg)}60%{transform:translateY(0) rotate(2deg)}' }
    ] })}

    <g data-part="shadow"><ellipse cx="180" cy="326" rx="128" ry="16" fill="rgba(0,0,0,0.16)"/></g>

    <!-- ornate gold curled runners -->
    <g data-part="runners">
      <path d="M64 304 Q54 322 82 322 L286 322 Q318 322 304 294"
            fill="none" stroke="url(#goldGrad-${uid})" stroke-width="10" stroke-linecap="round"/>
      <path d="M64 304 q-20 2 -16 -18 q2 -14 18 -9" fill="none"
            stroke="url(#goldGrad-${uid})" stroke-width="10" stroke-linecap="round"/>
      <path d="M304 294 q18 4 10 24" fill="none"
            stroke="url(#goldGrad-${uid})" stroke-width="8" stroke-linecap="round"/>
      <!-- support posts with little scroll feet -->
      <rect x="120" y="298" width="7" height="24" rx="3" fill="#B2851F"/>
      <rect x="236" y="298" width="7" height="24" rx="3" fill="#B2851F"/>
      ${scroll(112, 300, 0.8, false)}${scroll(250, 300, 0.8, true)}
    </g>

    <g data-part="sleigh-back">
      <path d="M92 300 Q80 212 150 204 L150 300 Z" fill="${REDD}"/>
    </g>

    <!-- main sleigh body: swooping red hull, gold rails + scrollwork -->
    <g data-part="sleigh">
      <path d="M90 300 Q78 210 150 204 L288 204 Q316 204 302 250 L294 300 Z"
            fill="url(#sleighGrad-${uid})"/>
      <!-- side shading -->
      <path d="M90 300 Q78 210 150 204 L150 300 Z" fill="rgba(0,0,0,0.12)"/>
      <!-- scrolled front lip -->
      <path d="M288 204 Q326 196 314 234 Q302 220 288 226 Z" fill="url(#goldGrad-${uid})"/>
      <!-- gold top rail -->
      <path d="M94 212 Q150 196 290 204" fill="none" stroke="url(#goldGrad-${uid})"
            stroke-width="7" stroke-linecap="round"/>
      <!-- lower gold trim band -->
      <path d="M100 286 Q190 300 292 286" fill="none" stroke="url(#goldGrad-${uid})"
            stroke-width="5" stroke-linecap="round"/>
      <!-- decorative scroll flourishes on the hull -->
      ${scroll(126, 244, 1.1, false)}${scroll(168, 250, 1.1, false)}${scroll(214, 250, 1.1, true)}
      <!-- seat cushion with a tufted button -->
      <ellipse cx="176" cy="208" rx="50" ry="13" fill="#ECE1C8"/>
      <ellipse cx="176" cy="206" rx="46" ry="9" fill="#F6EFDC"/>
      <circle cx="176" cy="206" r="2.4" fill="#C9B78E"/>
    </g>

    <!-- gifts riding at the front, poking above the lip -->
    <g data-part="gifts">
      ${gift(248, 176, 44, 42, '#3FA35B', '#2E7C45', '#E3B543')}
      ${gift(256, 146, 30, 30, '#2E78C7', '#215C99', '#F2C94C')}
      ${gift(238, 200, 26, 22, '#C9332B', '#9A231C', '#E3B543')}
    </g>

    <!-- Santa -->
    <g data-part="santa-body">
      <!-- lap / legs -->
      <path d="M148 232 q42 -14 84 -2 l-4 40 q-40 12 -80 0 z" fill="url(#suitGrad-${uid})"/>
      <path d="M148 232 q42 -14 84 -2 l-2 12 q-40 -10 -80 0 z" fill="rgba(255,255,255,0.08)"/>
      <!-- boots -->
      <path d="M214 266 q24 2 30 20 q-18 10 -34 3 q-4 -12 4 -23 z" fill="#2E2016"/>
      <path d="M214 286 q14 6 30 0 l0 5 q-16 6 -30 0 z" fill="#1C130C"/>
      <!-- torso -->
      <path d="M148 166 q32 -24 66 -2 q12 36 3 76 q-36 14 -74 0 q-9 -40 5 -74 z"
            fill="url(#suitGrad-${uid})"/>
      <!-- coat opening + fur placket down the front -->
      <path d="M176 152 q9 44 2 90 l12 0 q7 -46 -1 -90 z" fill="#F6F3EC"/>
      ${furBand([[178, 160], [180, 176], [181, 194], [181, 212], [180, 230]], 5)}
      <!-- hem fur -->
      ${furBand([[150, 236], [164, 242], [180, 244], [196, 242], [212, 236]], 6)}
      <!-- wrist-to-wrist belt -->
      <rect x="148" y="214" width="68" height="14" rx="3" fill="#241B13"/>
      <rect x="148" y="214" width="68" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
      <rect x="174" y="211" width="18" height="20" rx="3" fill="url(#goldGrad-${uid})"/>
      <rect x="179" y="217" width="8" height="8" rx="1.5" fill="#9A7418"/>
    </g>

    <g data-part="santa-arm">
      <path d="M196 192 q32 6 44 32 q-8 14 -24 11 q-20 -20 -34 -30 z"
            fill="url(#suitGrad-${uid})"/>
      <!-- fur cuff + mitten -->
      ${furBand([[198, 220], [208, 228], [220, 234]], 6)}
      <ellipse cx="232" cy="236" rx="13" ry="11" fill="#2E2016"/>
      <ellipse cx="229" cy="232" rx="5" ry="4" fill="#443225"/>
    </g>

    <g data-part="santa-head">
      <circle cx="182" cy="146" r="31" fill="url(#faceGrad-${uid})"/>
      <!-- ears -->
      <circle cx="152" cy="150" r="7" fill="url(#faceGrad-${uid})"/>
      <circle cx="212" cy="150" r="7" fill="url(#faceGrad-${uid})"/>
      <!-- soft shadow the hat brim casts on the upper forehead -->
      <path d="M153 136 q29 12 58 0 q-4 7 -29 7 q-25 0 -29 -7 z" fill="rgba(0,0,0,0.06)"/>
      <!-- full beard framing the lower face (starts below the cheeks) -->
      <path d="M156 150 q-8 30 10 48 q16 16 34 2 q10 -8 14 -26 q4 -16 0 -24
               q-6 12 -16 8 q-6 10 -18 10 q-12 0 -18 -10 q-8 4 -6 8 z" fill="#F1EDE4"/>
      <path d="M160 158 q0 26 22 40 q-24 -8 -28 -34 z" fill="rgba(0,0,0,0.05)"/>
      <!-- sideburns connecting beard to the hat area -->
      <path d="M154 140 q-4 18 6 30 q-10 -4 -10 -18 q0 -8 4 -12 z" fill="#F1EDE4"/>
      <path d="M210 140 q4 18 -6 30 q10 -4 10 -18 q0 -8 -4 -12 z" fill="#F1EDE4"/>
      <!-- moustache (two soft lobes) -->
      <path d="M182 166 q-6 10 -18 9 q-8 -1 -8 -8 q10 4 18 -3 q4 -3 8 2 z" fill="#FBFAF6"/>
      <path d="M182 166 q6 10 18 9 q8 -1 8 -8 q-10 4 -18 -3 q-4 -3 -8 2 z" fill="#FBFAF6"/>
    </g>

    <g data-part="santa-face">
      <!-- brows: short, a touch lowered, natural -->
      <path d="M166 138 q6 -3 12 -0.5" stroke="#E2DDD2" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M186 137.5 q6 -2.5 12 0.5" stroke="#E2DDD2" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <!-- eyes (open, clearly below the brim) with a soft upper lid line -->
      <ellipse cx="172" cy="145" rx="3.4" ry="3.8" fill="#3A2A1E"/>
      <ellipse cx="192" cy="145" rx="3.4" ry="3.8" fill="#3A2A1E"/>
      <circle cx="173.3" cy="143.6" r="1.2" fill="#fff"/>
      <circle cx="193.3" cy="143.6" r="1.2" fill="#fff"/>
      <path d="M167 141 q5 -2 10 0" stroke="rgba(0,0,0,0.15)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M187 141 q5 -2 10 0" stroke="rgba(0,0,0,0.15)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- realistic nose: longer, soft, with a subtle shadow + highlight (no
           flat round button, no big pink cheek circles) -->
      <path d="M180 148 q-5 8 -4 13 q1 5 6 5 q5 0 6 -5 q1 -5 -4 -13 q-2 -3 -4 0 z"
            fill="#E7A98A"/>
      <path d="M176 161 q6 4 12 0 q-3 4 -6 4 q-3 0 -6 -4 z" fill="#D9936F"/>
      <ellipse cx="179" cy="153" rx="1.8" ry="2.6" fill="rgba(255,255,255,0.45)"/>
      <!-- faint natural cheek warmth (soft blush, not hard circles) -->
      <ellipse cx="163" cy="156" rx="7" ry="5" fill="rgba(222,120,96,0.18)"/>
      <ellipse cx="201" cy="156" rx="7" ry="5" fill="rgba(222,120,96,0.18)"/>
    </g>

    <g data-part="santa-hat">
      <!-- Classic Santa hat (per reference): ONE solid red cone leaning right.
           FLAT base at the brim line (y122) from left temple (x150) to right
           (x236), so the cone sits ON the fur brim with NO gap. Left side rises
           to a rounded apex; right side sweeps up then the tip droops over to
           the pompom. A single convex closed outline => fills solid. -->
      <path fill="url(#hatGrad-${uid})"
            d="M150 122
               L236 122
               Q260 120 258 140
               Q256 156 244 162
               Q250 146 240 134
               Q236 128 232 126
               Q248 100 214 86
               Q184 74 164 90
               Q150 102 150 122 Z"/>
      <!-- shading on the right flank + highlight sheen on the left -->
      <path fill="${REDD}" opacity="0.3"
            d="M214 86 Q248 100 232 126 Q236 110 212 94 Q210 88 214 86 z"/>
      <path fill="${REDL}" opacity="0.5"
            d="M164 90 Q150 102 150 122 Q158 100 180 92 Q172 88 164 90 z"/>
      <!-- thick soft white FUR BRIM; bottom edge ~y128, clearly above the
           eyes (y145). Its top overlaps the cone base so there is no gap. -->
      <path fill="#F6F3EC"
            d="M144 116
               Q150 106 164 108 Q182 112 200 109 Q224 106 234 112
               Q244 118 238 129 Q231 138 214 136 Q182 142 156 135
               Q141 130 144 116 Z"/>
      <path fill="rgba(0,0,0,0.05)"
            d="M150 128 Q182 138 236 124 Q229 135 214 136 Q182 142 156 135 Q152 133 150 128 z"/>
      <!-- big white pompom at the drooping tip -->
      <circle cx="248" cy="166" r="13" fill="#F6F3EC"/>
      <circle cx="244" cy="161" r="4.5" fill="#fff"/>
    </g>
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildSanta };
