// Backdrop for WHERE IS THE CAT?: a calm, warm playroom behind the book.
// Cream wall, a tall window on the left letting in soft late light, a low
// wooden toy shelf with blurred blocks and a ball, a pot plant, a striped rug
// on a honey floor. Low contrast and slightly blurred so the toys and the
// text stay in front. Reuses the shared `.winter-bg` / `.winter-scene`.
(function () {
  'use strict';
  function playroom() {
    const blocks = [[1080, '#b8402e'], [1128, '#d9a53a'], [1176, '#5f8a4a'], [1104, '#3f74a8', 1]]
      .map(([x, c, up]) => `<rect x="${x}" y="${up ? 494 : 538}" width="44" height="44" rx="6" fill="${c}" opacity="0.7"/>`).join('');
    let stripes = '';
    for (let i = 0; i < 7; i++) stripes += `<rect x="360" y="${776 + i * 14}" width="880" height="7" fill="${i % 2 ? '#d9b48a' : '#c98f6a'}" opacity="0.55"/>`;
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wcWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f1e1c8"/><stop offset="0.5" stop-color="#e6d0b0"/><stop offset="1" stop-color="#cdb08c"/></linearGradient>
        <linearGradient id="wcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6c6"/><stop offset="1" stop-color="#fff6e4"/></linearGradient>
        <linearGradient id="wcFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8955e"/><stop offset="1" stop-color="#9a6a3e"/></linearGradient>
        <linearGradient id="wcBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4dc" stop-opacity="0.5"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></linearGradient>
        <radialGradient id="wcVig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#3a2616" stop-opacity="0"/><stop offset="1" stop-color="#3a2616" stop-opacity="0.35"/></radialGradient>
        <filter id="wcSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#wcWall)"/>
      <g filter="url(#wcSoft)">
        <!-- the window -->
        <rect x="120" y="80" width="330" height="460" rx="10" fill="#f8efe0"/>
        <rect x="140" y="100" width="290" height="420" rx="4" fill="url(#wcSky)"/>
        <path d="M285 100 V520 M140 310 H430" stroke="#f8efe0" stroke-width="12"/>
        <rect x="104" y="536" width="362" height="22" rx="6" fill="#efe2cc"/>
        <!-- the pot plant on the sill -->
        <path d="M380 536 l10 -52 h56 l10 52 z" fill="#c07a52"/>
        <ellipse cx="400" cy="462" rx="16" ry="34" fill="#6f8a5a" transform="rotate(-24 400 462)"/>
        <ellipse cx="436" cy="456" rx="16" ry="38" fill="#7f9a66" transform="rotate(18 436 456)"/>
        <ellipse cx="418" cy="440" rx="13" ry="30" fill="#5f7a4c"/>
        <!-- a framed picture -->
        <rect x="700" y="150" width="200" height="150" rx="6" fill="#c9a77e"/>
        <rect x="716" y="166" width="168" height="118" rx="3" fill="#f3e8d4"/>
        <circle cx="760" cy="216" r="22" fill="#e3b45c" opacity="0.8"/>
        <path d="M716 284 L780 236 L830 270 L884 226 V284 Z" fill="#9cb38a" opacity="0.8"/>
        <!-- the toy shelf -->
        <rect x="1040" y="460" width="380" height="170" rx="8" fill="#b88654"/>
        <rect x="1056" y="476" width="348" height="62" fill="#9a6e44"/>
        <rect x="1056" y="550" width="348" height="64" fill="#9a6e44"/>
        ${blocks}
        <circle cx="1300" cy="590" r="24" fill="#3f74a8" opacity="0.7"/>
        <circle cx="1352" cy="594" r="20" fill="#d9a53a" opacity="0.7"/>
        <rect x="1300" y="486" width="70" height="52" rx="8" fill="#3f74a8" opacity="0.55"/>
      </g>
      <!-- window light across the room -->
      <path d="M450 80 L1100 900 L640 900 L140 540 Z" fill="url(#wcBeam)"/>
      <!-- the floor and a striped rug -->
      <rect x="0" y="640" width="1600" height="260" fill="url(#wcFloor)"/>
      <rect x="0" y="632" width="1600" height="12" fill="#e9d3b4"/>
      <rect x="340" y="760" width="920" height="120" rx="40" fill="#e8d2b2" opacity="0.6"/>
      ${stripes}
      <rect width="1600" height="900" fill="url(#wcVig)"/>
    </svg>`;
  }
  window.mountWherecat = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = playroom();
    document.body.prepend(bg);
  };
})();
