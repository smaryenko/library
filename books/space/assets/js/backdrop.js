// Backdrop for "Our Solar System": a deep starfield with a faint Milky Way
// band, behind the book. Reuses the shared `.winter-bg` chrome (fixed,
// full-bleed, behind the book). Exposes window.mountSpace(), named by the
// manifest's `backdrop`.

(function () {
  'use strict';

  function sceneSVG() {
    let s = 9;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    let stars = '';
    for (let i = 0; i < 420; i++) {
      const x = rand() * 1600, y = rand() * 900;
      const r = 0.4 + rand() * rand() * 1.8;
      stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.25 + rand() * 0.7).toFixed(2)}"/>`;
    }
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spMilky" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(140,150,255,0)"/>
          <stop offset="50%" stop-color="rgba(170,160,255,0.10)"/>
          <stop offset="100%" stop-color="rgba(140,150,255,0)"/>
        </linearGradient>
      </defs>
      <rect x="-200" y="300" width="2000" height="260" fill="url(#spMilky)" transform="rotate(-18 800 450)"/>
      ${stars}
    </svg>`;
  }

  function mountSpace() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }

  window.mountSpace = mountSpace;
})();
