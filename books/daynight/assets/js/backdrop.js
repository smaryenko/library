// Backdrop for BUNNY DAY, OWL NIGHT: the book lies on a soft blanket that is
// dusk-blue on the left and warm morning cream on the right, echoing the
// night | day split of every page. Reuses the shared `.winter-bg` /
// `.winter-scene` full-bleed chrome classes (like the castle backdrop).
(function () {
  'use strict';
  function sceneSVG() {
    let dots = '';
    let s = 7341;
    const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    // faint stars over the night side only
    for (let i = 0; i < 60; i++) {
      const x = r() * 700, y = r() * 900, a = 0.15 + r() * 0.4;
      dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="#fff6d8" opacity="${a.toFixed(2)}"/>`;
    }
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dnBg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0f1a36"/><stop offset="40%" stop-color="#2b3560"/>
          <stop offset="60%" stop-color="#c9a57a"/><stop offset="100%" stop-color="#f3dfb8"/>
        </linearGradient>
        <radialGradient id="dnPool" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0%" stop-color="#fff2d0" stop-opacity=".22"/><stop offset="100%" stop-color="#fff2d0" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="dnVig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#dnBg)"/>
      ${dots}
      <rect width="1600" height="900" fill="url(#dnPool)"/>
      <rect width="1600" height="900" fill="url(#dnVig)"/>
    </svg>`;
  }
  function mountDayNight() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountDayNight = mountDayNight;
})();
