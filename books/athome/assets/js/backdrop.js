// Backdrop for HOW THINGS WORK AT HOME: a bright, friendly kitchen behind
// the book: pale mint tiles on the wall, a sunny window with a little
// plant, a shelf with jars and cups, and a wooden worktop the book rests
// on. Soft and slightly blurred-looking (low contrast) so the clay and the
// text stay in front. Reuses the shared `.winter-bg` / `.winter-scene`.
(function () {
  'use strict';
  function kitchen() {
    let tiles = '';
    for (let y = 0; y < 640; y += 56) for (let x = (y / 56) % 2 ? -28 : 0; x < 1600; x += 56)
      tiles += `<rect x="${x + 2}" y="${y + 2}" width="52" height="52" rx="4" fill="#e4f0ea"/>`;
    const jar = (x, h, lid, fill) => `<rect x="${x}" y="${300 - h}" width="54" height="${h}" rx="10" fill="#f4f8f6" opacity="0.85"/>
      <rect x="${x + 6}" y="${300 - h * 0.6}" width="42" height="${h * 0.6 - 6}" rx="6" fill="${fill}" opacity="0.75"/>
      <rect x="${x - 3}" y="${300 - h - 10}" width="60" height="14" rx="5" fill="${lid}"/>`;
    const cup = (x, c) => `<path d="M${x} 262 h46 l-5 38 h-36 z" fill="${c}"/><path d="M${x + 46} 270 q16 2 12 14 q-4 8 -14 6" fill="none" stroke="${c}" stroke-width="6"/>`;
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ahWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe2da"/><stop offset="1" stop-color="#bcd3c9"/></linearGradient>
        <linearGradient id="ahSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0f2"/><stop offset="1" stop-color="#e6f4fb"/></linearGradient>
        <linearGradient id="ahTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a873"/><stop offset="0.12" stop-color="#c48d58"/><stop offset="1" stop-color="#9c6a3c"/></linearGradient>
        <radialGradient id="ahSun" cx="0.3" cy="0.25" r="0.75"><stop offset="0" stop-color="#fff6dc" stop-opacity="0.75"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>
        <linearGradient id="ahBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e4" stop-opacity="0.45"/><stop offset="1" stop-color="#fff8e4" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ahWall)"/>
      ${tiles}
      <!-- the window, with a sunny sky, a hill and a tree -->
      <rect x="150" y="70" width="360" height="300" rx="12" fill="#f6f1e6"/>
      <rect x="170" y="90" width="320" height="260" rx="6" fill="url(#ahSky)"/>
      <path d="M170 300 Q300 250 490 290 L490 350 L170 350 Z" fill="#9cc98a"/>
      <circle cx="420" cy="140" r="34" fill="#ffe08a"/>
      <circle cx="250" cy="262" r="30" fill="#6ea85c"/><rect x="246" y="285" width="8" height="30" fill="#7a5638"/>
      <path d="M330 90 V350 M170 220 H490" stroke="#f6f1e6" stroke-width="12"/>
      <rect x="140" y="364" width="380" height="20" rx="6" fill="#ece4d4"/>
      <path d="M520 70 L1100 900 L700 900 L170 370 Z" fill="url(#ahBeam)"/>
      <!-- a pot plant on the sill -->
      <path d="M220 364 l8 -40 h44 l8 40 z" fill="#d77a4a"/>
      <ellipse cx="236" cy="314" rx="12" ry="22" fill="#5a9a4e" transform="rotate(-25 236 314)"/>
      <ellipse cx="262" cy="310" rx="12" ry="24" fill="#6fb05e" transform="rotate(20 262 310)"/>
      <!-- a shelf with jars and cups -->
      <rect x="1040" y="298" width="440" height="16" rx="4" fill="#c99862"/>
      ${jar(1060, 92, '#e48a3a', '#e7c27a')}${jar(1130, 70, '#5b8fd0', '#d9b06a')}${jar(1200, 104, '#c8513c', '#b0d08a')}
      ${cup(1290, '#f2c14e')}${cup(1360, '#3f8f8a')}
      <!-- a clock -->
      <circle cx="1260" cy="150" r="56" fill="#f6f1e6" stroke="#c8513c" stroke-width="10"/>
      <path d="M1260 150 V112 M1260 150 L1286 162" stroke="#3a3a3e" stroke-width="6" stroke-linecap="round"/>
      <!-- the worktop -->
      <rect x="0" y="640" width="1600" height="260" fill="url(#ahTop)"/>
      <rect x="0" y="636" width="1600" height="10" fill="#e8c193"/>
      <rect width="1600" height="900" fill="url(#ahSun)"/>
    </svg>`;
  }
  window.mountAtHome = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = kitchen();
    document.body.prepend(bg);
  };
})();
