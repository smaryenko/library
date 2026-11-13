// Backdrop for HARBOR CITY: a bright, pale studio table, like the photos of
// real pop-up books (white sweep, soft light from above, a gentle vignette).
// The 3D canvas is transparent above the pop-up, so this is what shows
// around the skyline. Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  function sceneSVG() {
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ctSweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e9eef2"/><stop offset="58%" stop-color="#f4f2ec"/><stop offset="100%" stop-color="#e3ddd0"/>
        </linearGradient>
        <radialGradient id="ctPool" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".75"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="ctVig" cx="0.5" cy="0.5" r="0.78">
          <stop offset="62%" stop-color="#3a3428" stop-opacity="0"/><stop offset="100%" stop-color="#3a3428" stop-opacity=".22"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ctSweep)"/>
      <rect width="1600" height="900" fill="url(#ctPool)"/>
      <rect width="1600" height="900" fill="url(#ctVig)"/>
    </svg>`;
  }
  function mountCity() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountCity = mountCity;
})();
