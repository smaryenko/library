// Backdrop for THE LONG WAY HOME: a pale, softly lit table, the colour of
// the world's own table, so the edges match while the WebGL canvas fades in.
// Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountLongway = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lwT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e4ded3"/><stop offset="100%" stop-color="#cfc6b6"/>
        </linearGradient>
        <radialGradient id="lwL" cx="0.45" cy="0.35" r="0.7">
          <stop offset="0%" stop-color="#fff6e6" stop-opacity=".5"/><stop offset="100%" stop-color="#fff6e6" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#lwT)"/>
      <rect width="1600" height="900" fill="url(#lwL)"/>
    </svg>`;
    document.body.prepend(bg);
  };
})();
