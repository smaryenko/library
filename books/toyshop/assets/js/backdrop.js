// Backdrop for THE TOY SHOP AFTER MIDNIGHT: dark warm wallpaper with faint
// stripes, a pool of lamplight in the middle and a dark wooden floor edge.
// Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountToyshop = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    let stripes = '';
    for (let x = 20; x < 1600; x += 74) stripes += `<rect x="${x}" y="0" width="24" height="900" fill="#4a2c1c" opacity=".5"/>`;
    let dots = '';
    for (let x = 57; x < 1600; x += 74) for (let y = 40 + ((x / 74) % 2) * 60; y < 760; y += 120) dots += `<path d="M${x} ${y - 8}L${x + 5} ${y}L${x} ${y + 8}L${x - 5} ${y}Z" fill="#e6b84c" opacity=".1"/>`;
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tsbW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a2216"/><stop offset="100%" stop-color="#1e110a"/>
        </linearGradient>
        <radialGradient id="tsbL" cx="0.5" cy="0.25" r="0.65">
          <stop offset="0%" stop-color="#ffd59a" stop-opacity=".32"/><stop offset="50%" stop-color="#f0a050" stop-opacity=".1"/><stop offset="100%" stop-color="#1e110a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#tsbW)"/>
      ${stripes}${dots}
      <rect y="780" width="1600" height="120" fill="#4a2a14"/>
      <rect y="776" width="1600" height="8" fill="#6e3f20"/>
      <rect width="1600" height="900" fill="url(#tsbL)"/>
    </svg>`;
    document.body.prepend(bg);
  };
})();
