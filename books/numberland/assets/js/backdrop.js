// Backdrop for NUMBER CUBE LAND: the world's own soft sky and far green
// hills, so the edges match while the WebGL canvas fades in.
// Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountNumberland = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nlSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8fd1f6"/><stop offset="70%" stop-color="#e6f6ff"/><stop offset="100%" stop-color="#e6f6ff"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#nlSky)"/>
      <g fill="#ffffff" opacity=".9">
        <ellipse cx="260" cy="170" rx="90" ry="34"/><ellipse cx="330" cy="150" rx="70" ry="38"/>
        <ellipse cx="1220" cy="120" rx="100" ry="36"/><ellipse cx="1300" cy="105" rx="70" ry="34"/>
      </g>
      <ellipse cx="200" cy="900" rx="520" ry="230" fill="#a9de7c"/>
      <ellipse cx="900" cy="930" rx="640" ry="250" fill="#86cc5e"/>
      <ellipse cx="1500" cy="900" rx="480" ry="220" fill="#9bd870"/>
    </svg>`;
    document.body.prepend(bg);
  };
})();
