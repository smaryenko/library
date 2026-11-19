// Backdrop for WHERE DOES RAIN COME FROM?: a kitchen table covered with a
// sheet of paper, a few wax crayons and their paper wrappers lying round.
// Static. Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountRain = function () {
    const crayon = (x, y, a, c) => `<g transform="translate(${x} ${y}) rotate(${a})">
      <rect x="0" y="-11" width="150" height="22" rx="6" fill="${c}"/>
      <rect x="22" y="-11" width="96" height="22" fill="#ffffff" opacity="0.35"/>
      <path d="M150 -11 Q176 -6 182 0 Q176 6 150 11 Z" fill="${c}"/>
      <rect x="0" y="-11" width="150" height="6" rx="3" fill="#ffffff" opacity="0.2"/></g>`;
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rnT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#cfe6f4"/><stop offset="100%" stop-color="#a9cfe6"/></linearGradient>
        <radialGradient id="rnL" cx="0.5" cy="0.4" r="0.65"><stop offset="0%" stop-color="#ffffff" stop-opacity=".45"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <pattern id="rnD" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="10" cy="12" r="5" fill="#ffffff" opacity="0.35"/><circle cx="42" cy="44" r="5" fill="#ffffff" opacity="0.35"/></pattern>
      </defs>
      <rect width="1600" height="900" fill="url(#rnT)"/>
      <rect width="1600" height="900" fill="url(#rnD)"/>
      <rect width="1600" height="900" fill="url(#rnL)"/>
      <g opacity="0.9">${crayon(70, 800, -12, '#e0242a')}${crayon(1360, 110, 160, '#2f74e0')}${crayon(1320, 820, 8, '#ffd21f')}${crayon(90, 90, 18, '#23a63a')}${crayon(220, 850, -4, '#8a4fd8')}</g>
    </svg>`;
    document.body.prepend(bg);
  };
})();
