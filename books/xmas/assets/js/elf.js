// Original layered Christmas elf, rich flat-cartoon-plus-shading style. Style
// reference only (a cute elf: green tunic with a red zigzag collar + belt and
// a gold bell button, a red/green striped floppy hat with a white pompom,
// red/white striped tights, curled green boots with bells, holding a wrapped
// gift with another beside him). Redrawn as original vector; nothing from the
// reference is traced or embedded.
//
// buildElf() -> SVG string. data-part layers, back -> front:
//   shadow, legs, side-gift, tunic, arms, held-gift, head, ears, face, hair, hat

function buildElf() {
  const uid = 'e' + Math.random().toString(36).slice(2, 8);
  // darker, richer forest green for the costume
  const GREEN = '#1F7A3D', GREEND = '#145A2B', GREENL = '#2E9A52';
  const RED = '#D2322A', REDD = '#A8281F';
  const SKIN = '#F5CDA9', SKIND = '#DCAC88';
  const HAIR = '#5E4126', HAIRD = '#47301C';

  // striped tights column with a light rim so it reads as a rounded leg
  function stripedLeg(x, y, w, h) {
    let bands = '';
    for (let i = 0; i < h; i += 13) {
      bands += `<rect x="${x}" y="${y + i}" width="${w}" height="6.5" fill="${RED}"/>`;
    }
    return `
      <clipPath id="leg-${uid}-${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/></clipPath>
      <g clip-path="url(#leg-${uid}-${x})">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F6F3EC"/>
        ${bands}
        <rect x="${x}" y="${y}" width="${w * 0.3}" height="${h}" fill="rgba(255,255,255,0.3)"/>
        <rect x="${x + w * 0.72}" y="${y}" width="${w * 0.28}" height="${h}" fill="rgba(0,0,0,0.1)"/>
      </g>`;
  }

  // curled pointed boot with a rolled cuff + jingle bell at the tip
  function boot(x, y, flip) {
    const s = flip ? -1 : 1;
    return `<g transform="translate(${x} ${y}) scale(${s} 1)">
      <path d="M0 2 q-6 24 22 28 q28 4 36 -12 q-12 -8 -26 -5 q6 -14 -8 -17 z"
            fill="url(#bootGrad-${uid})" stroke="${GREEND}" stroke-width="1.5"/>
      <path d="M-6 -2 q16 6 20 20 l-10 2 q-6 -12 -14 -14 z" fill="${GREENL}" opacity="0.5"/>
      <rect x="-8" y="-6" width="22" height="12" rx="4" fill="#E7DBC0"/>
      <circle cx="54" cy="18" r="5" fill="#E3B543"/>
      <circle cx="53" cy="16" r="1.6" fill="#FBE59C"/>
    </g>`;
  }

  // detailed wrapped gift
  function gift(x, y, w, h, col, colD, rib) {
    return `
      <ellipse cx="${x + w / 2}" cy="${y + h + 1}" rx="${w * 0.6}" ry="4" fill="rgba(0,0,0,0.16)"/>
      <rect x="${x}" y="${y + 5}" width="${w}" height="${h - 5}" rx="2" fill="${col}"/>
      <rect x="${x - 2}" y="${y}" width="${w + 4}" height="9" rx="2" fill="${colD}"/>
      <rect x="${x + w / 2 - 3}" y="${y + 5}" width="6" height="${h - 5}" fill="${rib}"/>
      <rect x="${x - 2}" y="${y + 2}" width="${w + 4}" height="5" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q-13 -11 -20 -3 q-2 6 5 6 q9 1 15 -3 z" fill="${rib}"/>
      <path d="M${x + w / 2} ${y + 2} q13 -11 20 -3 q2 6 -5 6 q-9 1 -15 -3 z" fill="${rib}"/>
      <circle cx="${x + w / 2}" cy="${y + 2}" r="3" fill="${rib}"/>`;
  }

  // red zigzag collar points
  const collar = (() => {
    let d = 'M148 194 ';
    for (let i = 0; i <= 7; i++) d += `L${148 + i * 9} ${i % 2 ? 216 : 200} `;
    d += 'L211 194 Z';
    return `<path d="${d}" fill="${RED}"/><path d="${d}" fill="${REDD}" opacity="0.25" transform="translate(0 2)"/>`;
  })();

  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="tunicGrad-${uid}" cx="42%" cy="28%" r="80%">
        <stop offset="0%" stop-color="${GREENL}"/><stop offset="60%" stop-color="${GREEN}"/>
        <stop offset="100%" stop-color="${GREEND}"/>
      </radialGradient>
      <linearGradient id="bootGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GREENL}"/><stop offset="100%" stop-color="${GREEND}"/>
      </linearGradient>
      <radialGradient id="faceGrad-${uid}" cx="42%" cy="32%" r="76%">
        <stop offset="0%" stop-color="#FCE1CA"/><stop offset="65%" stop-color="${SKIN}"/>
        <stop offset="100%" stop-color="${SKIND}"/>
      </radialGradient>
      <linearGradient id="hatR-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E0574E"/><stop offset="100%" stop-color="${REDD}"/>
      </linearGradient>
      <linearGradient id="hatG-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${GREENL}"/><stop offset="100%" stop-color="${GREEND}"/>
      </linearGradient>
    </defs>

    <g data-part="shadow"><ellipse cx="180" cy="326" rx="94" ry="15" fill="rgba(0,0,0,0.16)"/></g>

    <g data-part="legs">
      ${stripedLeg(150, 266, 20, 48)}
      ${stripedLeg(190, 266, 20, 48)}
      ${boot(148, 306, false)}
      ${boot(212, 306, true)}
    </g>

    <g data-part="side-gift">
      ${gift(92, 256, 52, 46, '#3FA35B', '#2E7C45', '#D2322A')}
    </g>

    <!-- green tunic: rounded body, zigzag collar, belt + gold bell button -->
    <g data-part="tunic">
      <path d="M148 194 q32 -18 64 0 q16 46 7 84 q-38 16 -78 0 q-9 -42 7 -84 z"
            fill="url(#tunicGrad-${uid})"/>
      <path d="M148 194 q32 -18 64 0 l-2 10 q-30 -14 -60 0 z" fill="rgba(255,255,255,0.14)"/>
      <path d="M150 230 q6 32 2 48 q-16 -4 -22 -18 q-2 -20 20 -30 z" fill="rgba(0,0,0,0.1)"/>
      ${collar}
      <!-- belt -->
      <rect x="148" y="250" width="64" height="11" rx="2" fill="#3A2E22"/>
      <rect x="148" y="250" width="64" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
      <rect x="172" y="247" width="16" height="17" rx="2.5" fill="#E3B543"/>
      <rect x="176" y="251" width="8" height="9" rx="1" fill="#A87B20"/>
      <!-- gold bell button -->
      <circle cx="166" cy="228" r="6" fill="#E3B543"/>
      <circle cx="166" cy="228" r="6" fill="none" stroke="#A87B20" stroke-width="1"/>
      <line x1="162" y1="228" x2="170" y2="228" stroke="#A87B20" stroke-width="1"/>
      <circle cx="166" cy="231" r="1.4" fill="#A87B20"/>
    </g>

    <g data-part="arms">
      <path d="M150 208 q-18 18 -10 46 l17 -4 q-6 -24 7 -38 z" fill="url(#tunicGrad-${uid})"/>
      <path d="M210 208 q18 18 10 46 l-17 -4 q6 -24 -7 -38 z" fill="url(#tunicGrad-${uid})"/>
      <!-- white cuffs -->
      <path d="M146 250 l20 -5 l3 11 l-20 5 z" fill="#F6F3EC"/>
      <path d="M214 250 l-20 -5 l-3 11 l20 5 z" fill="#F6F3EC"/>
      <!-- hands -->
      <circle cx="156" cy="263" r="7.5" fill="url(#faceGrad-${uid})"/>
      <circle cx="204" cy="263" r="7.5" fill="url(#faceGrad-${uid})"/>
    </g>

    <g data-part="held-gift">
      ${gift(158, 246, 44, 38, '#E3B543', '#C0961F', '#D2322A')}
    </g>

    <g data-part="head">
      <circle cx="180" cy="148" r="35" fill="url(#faceGrad-${uid})"/>
      <path d="M180 113 a35 35 0 0 1 0 70 q18 -35 0 -70 z" fill="rgba(0,0,0,0.05)"/>
    </g>

    <!-- pointed elf ears: triangular overall but with a ROUNDED tip and gently
         curved edges so they read soft, not razor-sharp. Inner shade echoes
         the shape. -->
    <g data-part="ears">
      <!-- left ear: base on the head (150,138)-(150,162), curves out to a
           rounded tip near (122,130) -->
      <path d="M150 138 Q134 130 124 129 Q118 130 121 136 Q132 150 150 162 Z"
            fill="url(#faceGrad-${uid})" stroke="${SKIND}" stroke-width="1.4"
            stroke-linejoin="round"/>
      <path d="M150 143 Q138 138 131 138 Q134 148 150 156 Z" fill="${SKIND}" opacity="0.4"/>
      <!-- right ear (mirror) -->
      <path d="M210 138 Q226 130 236 129 Q242 130 239 136 Q228 150 210 162 Z"
            fill="url(#faceGrad-${uid})" stroke="${SKIND}" stroke-width="1.4"
            stroke-linejoin="round"/>
      <path d="M210 143 Q222 138 229 138 Q226 148 210 156 Z" fill="${SKIND}" opacity="0.4"/>
    </g>

    <g data-part="face">
      <!-- brows: short, natural, raised a touch for a friendly look -->
      <path d="M165 139 q6 -3 12 -0.5" stroke="${HAIRD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M183 138.5 q6 -2.5 12 0.5" stroke="${HAIRD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <!-- eyes: natural almond shape, green iris, soft upper lid line -->
      <ellipse cx="171" cy="148" rx="3.6" ry="4.2" fill="#263B31"/>
      <ellipse cx="191" cy="148" rx="3.6" ry="4.2" fill="#263B31"/>
      <circle cx="171" cy="147.6" r="1.8" fill="#3F8463"/>
      <circle cx="191" cy="147.6" r="1.8" fill="#3F8463"/>
      <circle cx="172.3" cy="146.4" r="1.2" fill="#fff"/>
      <circle cx="192.3" cy="146.4" r="1.2" fill="#fff"/>
      <path d="M166 143.5 q5 -2.4 10 0" stroke="rgba(0,0,0,0.16)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M186 143.5 q5 -2.4 10 0" stroke="rgba(0,0,0,0.16)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <!-- small upturned button nose with a soft shadow + highlight -->
      <path d="M180 150 q-4 6 -3 10 q1 3.5 5 3.5 q4 0 5 -3.5 q1 -4 -3 -10 q-2 -2 -4 0 z" fill="#E7A98A"/>
      <path d="M177 159 q5 3 8 0 q-2 2.6 -4 2.6 q-2 0 -4 -2.6 z" fill="#D9936F"/>
      <ellipse cx="178.8" cy="153" rx="1.4" ry="2" fill="rgba(255,255,255,0.5)"/>
      <!-- faint natural cheek warmth (soft blush, not hard circles) -->
      <ellipse cx="161" cy="158" rx="6.5" ry="4.5" fill="rgba(222,120,96,0.18)"/>
      <ellipse cx="201" cy="158" rx="6.5" ry="4.5" fill="rgba(222,120,96,0.18)"/>
      <!-- gentle friendly smile -->
      <path d="M170 166 q11 9 22 0" stroke="#B5543E" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </g>

    <!-- brown swept hair with a few strands under the hat -->
    <g data-part="hair">
      <path d="M148 134 q30 -26 64 0 q-4 -18 -32 -20 q-28 -2 -32 20 z" fill="${HAIR}"/>
      <path d="M150 132 q12 -8 24 -8 q-8 6 -10 14 q-10 0 -14 -6 z" fill="${HAIRD}"/>
      <path d="M208 130 q12 2 14 14 q-11 -1 -16 -9 z" fill="${HAIR}"/>
      <path d="M200 120 q10 2 14 10" stroke="${HAIRD}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>

    <!-- red/green striped floppy pointed hat with a white pompom -->
    <g data-part="hat">
      <path fill="url(#hatG-${uid})" d="M148 128 q32 -30 64 -6 q-32 -46 -90 -20 q-14 8 -16 24 q18 10 42 2 z"/>
      <path fill="url(#hatR-${uid})" d="M148 128 q-22 4 -36 -4 q4 -14 20 -20 q10 12 16 24 z"/>
      <path fill="url(#hatG-${uid})" d="M122 98 q18 -16 42 -12 q-12 10 -18 24 q-16 4 -24 -12 z"/>
      <path fill="url(#hatR-${uid})" d="M164 86 q24 2 50 36 q-22 10 -40 2 q-6 -22 -10 -38 z"/>
      <path fill="url(#hatG-${uid})" d="M206 110 q14 4 22 20 q-14 4 -24 -6 z"/>
      <!-- fabric fold highlights -->
      <path d="M140 118 q30 10 70 -2" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none"/>
      <circle cx="122" cy="96" r="12" fill="#F6F3EC"/>
      <circle cx="118" cy="92" r="4" fill="#fff"/>
    </g>
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildElf };
