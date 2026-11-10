// Backdrop for the DINO book: a hazy Late Cretaceous plain. Warm sky, a
// distant smoking volcano, layered hills, araucaria (monkey-puzzle) conifers
// and cycads, a dusty floodplain. Low contrast so the dinosaur stays the hero.
// Reuses the shared `.winter-bg` / `.winter-scene` chrome (full-bleed, behind
// the book). Exposes window.mountDino().

(function () {
  'use strict';

  // tall conifer with a flat umbrella crown
  function araucaria(x, base, h, col) {
    const w = h * 0.34;
    return `<g fill="${col}">
      <rect x="${x - h * 0.012}" y="${base - h}" width="${h * 0.024}" height="${h}"/>
      <path d="M${x - w} ${base - h * 0.78} q${w} -${h * 0.3} ${w * 2} 0 q-${w} -${h * 0.08} -${w * 2} 0 z"/>
      <path d="M${x - w * 0.8} ${base - h * 0.88} q${w * 0.8} -${h * 0.22} ${w * 1.6} 0 q-${w * 0.8} -${h * 0.06} -${w * 1.6} 0 z"/>
    </g>`;
  }

  // cycad: a fan of stiff fronds on a short trunk
  function cycad(x, base, s, col) {
    let fr = '';
    for (let i = -3; i <= 3; i++) {
      const a = i * 22;
      fr += `<path d="M0 0 q${(8 * s).toFixed(1)} -${(30 * s).toFixed(1)} 0 -${(56 * s).toFixed(1)} q-${(8 * s).toFixed(1)} ${(26 * s).toFixed(1)} 0 ${(56 * s).toFixed(1)} z" transform="rotate(${a})"/>`;
    }
    return `<g fill="${col}" transform="translate(${x} ${base - 18 * s})">
      <rect x="${-5 * s}" y="0" width="${10 * s}" height="${18 * s}"/>${fr}</g>`;
  }

  function sceneSVG() {
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dinoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9fc0c8"/>
          <stop offset="55%" stop-color="#e8d5ab"/>
          <stop offset="100%" stop-color="#f0dcb0"/>
        </linearGradient>
        <linearGradient id="dinoPlain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c9b385"/>
          <stop offset="100%" stop-color="#a98f62"/>
        </linearGradient>
        <radialGradient id="dinoSun" cx="72%" cy="34%" r="40%">
          <stop offset="0%" stop-color="#fff4d4" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#fff4d4" stop-opacity="0"/>
        </radialGradient>
        <filter id="dinoHaze"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>

      <rect width="1600" height="900" fill="url(#dinoSky)"/>
      <rect width="1600" height="900" fill="url(#dinoSun)"/>

      <!-- distant volcano with a soft smoke plume -->
      <path d="M180 560 L420 330 q30 -18 60 0 L760 560 Z" fill="#a8a294" opacity="0.7"/>
      <g filter="url(#dinoHaze)" fill="#cfc6b4" opacity="0.7">
        <ellipse cx="450" cy="290" rx="60" ry="40"/><ellipse cx="500" cy="220" rx="90" ry="50"/>
        <ellipse cx="580" cy="160" rx="120" ry="55"/>
      </g>

      <!-- layered hills -->
      <path d="M0 560 Q 300 470 640 540 T 1240 520 T 1600 530 L1600 900 L0 900 Z" fill="#b5ab8c" opacity="0.85"/>
      <path d="M0 610 Q 380 560 820 600 T 1600 590 L1600 900 L0 900 Z" fill="#a9a07c"/>

      <!-- far conifers -->
      ${araucaria(1080, 610, 210, '#7f8466')}
      ${araucaria(1160, 606, 170, '#868a6c')}
      ${araucaria(1420, 600, 240, '#7a7f61')}
      ${araucaria(140, 614, 190, '#7f8466')}

      <!-- floodplain -->
      <path d="M0 660 Q 500 630 900 660 T 1600 650 L1600 900 L0 900 Z" fill="url(#dinoPlain)"/>

      <!-- foreground cycads + ferns -->
      ${cycad(90, 900, 2.6, '#6f7a50')}
      ${cycad(1520, 880, 2.2, '#6a754c')}
      ${cycad(1340, 760, 1.2, '#7c865c')}
      ${cycad(260, 740, 1.0, '#7c865c')}
    </svg>`;
  }

  function mountDino() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }

  window.mountDino = mountDino;
})();
