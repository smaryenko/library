// Backdrop for UP WE GO: a deep night sky behind the book: a soft blue
// glow of the Milky Way across it, a few coloured nebula clouds, many
// small stars and a handful of bright twinkling ones, and the curve of a
// blue planet rising at the bottom. Static except for a slow twinkle.
// Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  function sky() {
    let s = 1977;
    const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    let stars = '';
    for (let i = 0; i < 260; i++) {
      const x = R() * 1600, y = R() * 900, r = 0.4 + R() * R() * 1.8;
      const c = R() < 0.15 ? '#ffe2b8' : (R() < 0.2 ? '#c4d8ff' : '#ffffff');
      stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" fill="${c}" opacity="${(0.35 + R() * 0.6).toFixed(2)}"/>`;
    }
    let bright = '';
    for (let i = 0; i < 12; i++) {
      const x = R() * 1600, y = R() * 620, d = (R() * 4).toFixed(1);
      bright += `<g class="uwbg-tw" style="animation-delay:-${d}s"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="#fff" opacity="0.12"/>` +
        `<path d="M${(x - 9).toFixed(0)} ${y.toFixed(0)} H${(x + 9).toFixed(0)} M${x.toFixed(0)} ${(y - 9).toFixed(0)} V${(y + 9).toFixed(0)}" stroke="#fff" stroke-width="1" opacity="0.6"/>` +
        `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="1.8" fill="#fff"/></g>`;
    }
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <style>
        .uwbg-tw{animation:uwbg-tw 4s ease-in-out infinite}
        @keyframes uwbg-tw{0%,100%{opacity:1}50%{opacity:.35}}
        @media (prefers-reduced-motion: reduce){.uwbg-tw{animation:none}}
      </style>
      <defs>
        <linearGradient id="uwSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070b1c"/><stop offset="0.6" stop-color="#101a3a"/><stop offset="1" stop-color="#1a2450"/>
        </linearGradient>
        <linearGradient id="uwMilky" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#6f8fd8" stop-opacity="0"/><stop offset="0.45" stop-color="#8aa6e8" stop-opacity="0.16"/>
          <stop offset="0.55" stop-color="#c9b8ec" stop-opacity="0.14"/><stop offset="1" stop-color="#6f8fd8" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="uwN1"><stop offset="0" stop-color="#8a5fd0" stop-opacity="0.32"/><stop offset="1" stop-color="#8a5fd0" stop-opacity="0"/></radialGradient>
        <radialGradient id="uwN2"><stop offset="0" stop-color="#2f8fc9" stop-opacity="0.28"/><stop offset="1" stop-color="#2f8fc9" stop-opacity="0"/></radialGradient>
        <radialGradient id="uwN3"><stop offset="0" stop-color="#d06a8a" stop-opacity="0.2"/><stop offset="1" stop-color="#d06a8a" stop-opacity="0"/></radialGradient>
        <radialGradient id="uwPlanet" cx="0.45" cy="0.1" r="0.7">
          <stop offset="0" stop-color="#5fa0e6"/><stop offset="0.5" stop-color="#2b5ea8"/><stop offset="1" stop-color="#0d2246"/>
        </radialGradient>
        <radialGradient id="uwAir" cx="0.5" cy="1" r="0.55">
          <stop offset="0.82" stop-color="#8fc6ff" stop-opacity="0"/><stop offset="0.9" stop-color="#8fc6ff" stop-opacity="0.45"/><stop offset="1" stop-color="#8fc6ff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#uwSky)"/>
      <path d="M-100 820 Q500 520 1700 80 L1700 300 Q700 700 -100 980 Z" fill="url(#uwMilky)"/>
      <ellipse cx="260" cy="200" rx="420" ry="220" fill="url(#uwN1)"/>
      <ellipse cx="1320" cy="260" rx="380" ry="200" fill="url(#uwN2)"/>
      <ellipse cx="1180" cy="700" rx="360" ry="180" fill="url(#uwN3)"/>
      ${stars}${bright}
      <ellipse cx="800" cy="1840" rx="1500" ry="1000" fill="url(#uwAir)"/>
      <ellipse cx="800" cy="1850" rx="1420" ry="980" fill="url(#uwPlanet)"/>
    </svg>`;
  }
  window.mountUpWeGo = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sky();
    document.body.prepend(bg);
  };
})();
