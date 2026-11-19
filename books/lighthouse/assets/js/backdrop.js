// Backdrop for HOW A LIGHTHOUSE WORKS: an illustrator's desk at dusk: dark
// wood with a warm lamp pool, a few loose coloured pencils at the edges.
// Static. Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountLighthouse = function () {
    const pencil = (x, y, a, c) => `<g transform="translate(${x} ${y}) rotate(${a})">
      <rect x="0" y="-7" width="220" height="14" rx="2" fill="${c}"/>
      <rect x="0" y="-7" width="220" height="5" rx="2" fill="#ffffff" opacity="0.18"/>
      <path d="M220 -7 L262 0 L220 7 Z" fill="#e8c9a0"/><path d="M250 -2 L262 0 L250 2 Z" fill="${c}"/>
      <rect x="-14" y="-7" width="14" height="14" fill="#c9b28a"/></g>`;
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lhT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a3a30"/><stop offset="100%" stop-color="#2a201a"/></linearGradient>
        <radialGradient id="lhL" cx="0.5" cy="0.42" r="0.6"><stop offset="0%" stop-color="#ffe0b0" stop-opacity=".3"/><stop offset="100%" stop-color="#ffe0b0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#lhT)"/>
      <g opacity="0.12" stroke="#1a120c" stroke-width="3" fill="none">
        <path d="M0 120 Q800 90 1600 140"/><path d="M0 330 Q800 300 1600 360"/><path d="M0 560 Q800 530 1600 590"/><path d="M0 780 Q800 760 1600 800"/>
      </g>
      <rect width="1600" height="900" fill="url(#lhL)"/>
      <g opacity="0.85">${pencil(40, 820, -8, '#2c3f78')}${pencil(1250, 90, 168, '#c0392b')}${pencil(1300, 840, -14, '#e0a43a')}${pencil(60, 70, 10, '#3a7a5a')}</g>
    </svg>`;
    document.body.prepend(bg);
  };
})();
