// Backdrop for THE LITTLE WIZARD'S LOST SPELLBOOK: a dark night table in deep
// purple, a soft candle glow where the book lies and a few faint foil stars.
// Reuses the shared `.winter-bg` / `.winter-scene` classes.
(function () {
  'use strict';
  window.mountSpellbook = function () {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    let stars = '';
    const pts = [[90, 80], [230, 160], [380, 60], [1250, 90], [1420, 190], [1520, 70], [160, 760], [1460, 780], [60, 420], [1550, 470]];
    for (const [x, y] of pts) stars += `<path d="M${x} ${y - 9}L${x + 2.6} ${y - 2.6}L${x + 9} ${y}L${x + 2.6} ${y + 2.6}L${x} ${y + 9}L${x - 2.6} ${y + 2.6}L${x - 9} ${y}L${x - 2.6} ${y - 2.6}Z" fill="#e9c96a" opacity=".35"/>`;
    bg.innerHTML = `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sbT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a1b52"/><stop offset="100%" stop-color="#140c2e"/>
        </linearGradient>
        <radialGradient id="sbL" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0%" stop-color="#ffd98a" stop-opacity=".22"/><stop offset="60%" stop-color="#7a5ac8" stop-opacity=".12"/><stop offset="100%" stop-color="#140c2e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sbT)"/>
      <rect width="1600" height="900" fill="url(#sbL)"/>
      ${stars}
    </svg>`;
    document.body.prepend(bg);
  };
})();
