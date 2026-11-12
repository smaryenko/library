// Backdrop for POP-UP CASTLE: the book lies on an old oak table in a warm,
// candle-lit study — dark wood grain, a soft pool of light under the book and
// a deep vignette, so the bright pop-up scenes are the only colour on screen.
// Reuses the shared `.winter-bg` / `.winter-scene` full-bleed chrome classes.
(function () {
  'use strict';
  function sceneSVG() {
    let grain = '';
    let s = 1234567;
    const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 70; i++) {
      const y = r() * 900, a = 0.03 + r() * 0.07;
      grain += `<path d="M-20 ${y.toFixed(0)}Q400 ${(y + (r() - 0.5) * 30).toFixed(0)} 800 ${(y + (r() - 0.5) * 20).toFixed(0)}T1620 ${(y + (r() - 0.5) * 30).toFixed(0)}" stroke="${r() < 0.5 ? '#000' : '#c08a50'}" stroke-opacity="${a.toFixed(3)}" stroke-width="${(1 + r() * 4).toFixed(1)}" fill="none"/>`;
    }
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="csTable" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a1a10"/><stop offset="55%" stop-color="#4a2e1a"/><stop offset="100%" stop-color="#2e1c10"/>
        </linearGradient>
        <radialGradient id="csPool" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0%" stop-color="#ffcf8a" stop-opacity=".28"/><stop offset="100%" stop-color="#ffcf8a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="csVig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".7"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#csTable)"/>
      ${grain}
      <rect width="1600" height="900" fill="url(#csPool)"/>
      <rect width="1600" height="900" fill="url(#csVig)"/>
    </svg>`;
  }
  function mountCastle() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountCastle = mountCastle;
})();
