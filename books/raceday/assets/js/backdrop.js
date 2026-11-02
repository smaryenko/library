// Backdrop for the RACE DAY book: a cozy, sunlit living room. A single layered
// SVG scene (warm wall, window with daylight, a low bookshelf, a couch, a
// coffee table, a soft shaggy rug, a wood floor). Low-contrast so the popped-up
// cars stay the hero. Dependency-free; sits behind everything else.
//
// Reuses the shared `.winter-bg` / `.winter-scene` chrome classes from book.css
// (fixed, full-bleed, behind the book) so no engine or CSS change is needed —
// each book just brings its own scene. Exposes window.mountLivingRoom(), the
// name the stories manifest's `backdrop` field points at for this book.
//
// Style reference (local only, never traced/shipped): the living-room photos
// with the red toy track over a book stack on a shaggy rug. Redrawn original.

(function () {
  'use strict';

  function sceneSVG() {
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rdWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#efe7d8"/>
          <stop offset="100%" stop-color="#e3d8c3"/>
        </linearGradient>
        <linearGradient id="rdFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#d9bd92"/>
          <stop offset="100%" stop-color="#c7a677"/>
        </linearGradient>
        <linearGradient id="rdWindow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#d8f0ff"/>
          <stop offset="55%" stop-color="#bfe6ff"/>
          <stop offset="100%" stop-color="#e9f7e2"/>
        </linearGradient>
        <radialGradient id="rdSun" cx="50%" cy="40%" r="60%">
          <stop offset="0%"  stop-color="rgba(255,248,214,0.85)"/>
          <stop offset="100%" stop-color="rgba(255,248,214,0)"/>
        </radialGradient>
        <linearGradient id="rdRug" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#efeae1"/>
          <stop offset="100%" stop-color="#ddd4c6"/>
        </linearGradient>
      </defs>

      <!-- warm wall -->
      <rect x="0" y="0" width="1600" height="620" fill="url(#rdWall)"/>
      <!-- wood floor -->
      <rect x="0" y="600" width="1600" height="300" fill="url(#rdFloor)"/>
      <g stroke="#b9975f" stroke-width="3" opacity="0.6">
        <line x1="0" y1="660" x2="1600" y2="648"/>
        <line x1="0" y1="730" x2="1600" y2="716"/>
        <line x1="0" y1="810" x2="1600" y2="796"/>
      </g>
      <!-- baseboard -->
      <rect x="0" y="592" width="1600" height="16" fill="#f3efe6"/>

      <!-- big sunny window (right) with daylight + muntins -->
      <g>
        <rect x="1120" y="120" width="360" height="330" rx="10" fill="#f5f1e6"/>
        <rect x="1140" y="140" width="320" height="290" rx="6" fill="url(#rdWindow)"/>
        <!-- soft foliage silhouette outside -->
        <circle cx="1210" cy="360" r="70" fill="#9ccb7e" opacity="0.7"/>
        <circle cx="1300" cy="340" r="90" fill="#8bbd6d" opacity="0.6"/>
        <!-- muntins -->
        <g stroke="#f5f1e6" stroke-width="10">
          <line x1="1300" y1="140" x2="1300" y2="430"/>
          <line x1="1140" y1="285" x2="1460" y2="285"/>
        </g>
      </g>
      <!-- sunbeam pooling on the floor -->
      <ellipse cx="1180" cy="700" rx="360" ry="120" fill="url(#rdSun)"/>

      <!-- a low bookshelf on the left -->
      <g>
        <rect x="90" y="300" width="300" height="300" rx="8" fill="#b98a52"/>
        <rect x="104" y="314" width="272" height="272" fill="#a9763f"/>
        <g stroke="#8a5e30" stroke-width="8">
          <line x1="104" y1="404" x2="376" y2="404"/>
          <line x1="104" y1="496" x2="376" y2="496"/>
        </g>
        <!-- spines -->
        ${bookRow(116, 320, 80)}
        ${bookRow(116, 412, 80)}
        ${bookRow(116, 504, 80)}
      </g>

      <!-- a soft couch (centre-right, behind) -->
      <g>
        <rect x="560" y="360" width="470" height="150" rx="40" fill="#dfd8cb"/>
        <rect x="560" y="420" width="470" height="150" rx="30" fill="#d3cabb"/>
        <rect x="560" y="420" width="70" height="150" rx="26" fill="#cabfae"/>
        <rect x="960" y="420" width="70" height="150" rx="26" fill="#cabfae"/>
        <!-- cushions -->
        <rect x="650" y="372" width="150" height="120" rx="20" fill="#e7e1d6"/>
        <rect x="810" y="372" width="150" height="120" rx="20" fill="#5f7fb0"/>
      </g>

      <!-- a wooden coffee table (left of centre, foreground-ish) -->
      <g>
        <rect x="360" y="560" width="300" height="24" rx="6" fill="#c08a4a"/>
        <rect x="360" y="560" width="300" height="8" rx="4" fill="#d6a867"/>
        <rect x="378" y="584" width="18" height="70" rx="4" fill="#a9763f"/>
        <rect x="624" y="584" width="18" height="70" rx="4" fill="#a9763f"/>
      </g>

      <!-- soft shaggy rug across the foreground -->
      <g>
        <ellipse cx="800" cy="800" rx="720" ry="150" fill="url(#rdRug)"/>
        ${rugFuzz()}
      </g>
    </svg>`;
  }

  // a row of coloured book spines inside the shelf
  function bookRow(x, y, h) {
    const cols = ['#cf5b4e', '#e0b24a', '#5aa469', '#4e79b5', '#8a6fb0',
      '#cf5b4e', '#d98cc4', '#5aa469', '#e0b24a'];
    let out = '', cx = x;
    cols.forEach((c, i) => {
      const w = 22 + (i % 3) * 6;
      out += `<rect x="${cx}" y="${y + (i % 2) * 4}" width="${w}" height="${h - (i % 2) * 4}" fill="${c}"/>`;
      cx += w + 4;
    });
    return `<g>${out}</g>`;
  }

  // light fuzzy pile marks so the rug reads "shaggy", not a flat oval
  function rugFuzz() {
    let out = '';
    for (let i = 0; i < 90; i++) {
      const x = 120 + Math.random() * 1360;
      const y = 700 + Math.random() * 190;
      const len = 5 + Math.random() * 10;
      out += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${x.toFixed(0)}" y2="${(y - len).toFixed(0)}" stroke="#cfc6b6" stroke-width="2" opacity="0.5"/>`;
    }
    return `<g>${out}</g>`;
  }

  function mountLivingRoom() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';        // reuse shared full-bleed backdrop chrome
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }

  window.mountLivingRoom = mountLivingRoom;
})();
