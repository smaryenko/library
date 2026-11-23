// Backdrop for MY DAY: a soft dawn-sky wash behind the canvas. The 3D scene
// paints its own sky colour once it is ready; this is what shows while it
// loads (and around the still picture when there is no WebGL). Reuses the
// shared `.winter-bg` / `.winter-scene` classes like books/city.
(function () {
  'use strict';
  function sceneSVG() {
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mdSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cfe3f0"/><stop offset="60%" stop-color="#f6dcc6"/><stop offset="100%" stop-color="#f1c9a8"/>
        </linearGradient>
        <radialGradient id="mdVig" cx="0.5" cy="0.5" r="0.78">
          <stop offset="62%" stop-color="#3a3428" stop-opacity="0"/><stop offset="100%" stop-color="#3a3428" stop-opacity=".18"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#mdSky)"/>
      <rect width="1600" height="900" fill="url(#mdVig)"/>
    </svg>`;
  }
  function mountMyDay() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountMyDay = mountMyDay;
})();
