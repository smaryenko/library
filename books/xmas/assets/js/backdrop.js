// Backdrop for the XMAS book: a winter night. A layered SVG scene (night sky
// glow, moon, distant snowy hills, decorated pines, a string of Christmas
// lights) plus animated falling snow on a full-screen canvas. Dependency-free;
// sits behind everything else. This is per-book art — each book brings its own
// backdrop; the shared engine just mounts whichever one the manifest names.
//
// Exposes window.mountWinter() (the name the stories manifest's `backdrop`
// field points at). mountWinter() injects:
//   .winter-bg   — the static SVG scene (behind the book)
//   canvas.snow  — the animated snowfall (in front of the scene, behind book)

(function () {
  'use strict';

  function sceneSVG() {
    // Original vector scene. Soft, low-contrast so the book stays the hero.
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stop-color="rgba(224,238,255,0.9)"/>
          <stop offset="35%" stop-color="rgba(200,224,255,0.35)"/>
          <stop offset="100%" stop-color="rgba(200,224,255,0)"/>
        </radialGradient>
        <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#24416b"/>
          <stop offset="100%" stop-color="#1b3254"/>
        </linearGradient>
        <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#32598c"/>
          <stop offset="100%" stop-color="#274669"/>
        </linearGradient>
        <linearGradient id="snowField" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#dfecff"/>
          <stop offset="100%" stop-color="#b9cdeb"/>
        </linearGradient>
      </defs>


      <!-- a string of warm Christmas lights swagging across the top -->
      ${lightString()}

      <!-- distant hills -->
      <path d="M0 560 Q 300 470 650 540 T 1600 500 L1600 900 L0 900 Z"
            fill="url(#hillBack)"/>
      <path d="M0 650 Q 420 560 820 640 T 1600 620 L1600 900 L0 900 Z"
            fill="url(#hillFront)"/>

      <!-- foreground snow field -->
      <path d="M0 740 Q 500 690 900 740 T 1600 730 L1600 900 L0 900 Z"
            fill="url(#snowField)"/>

      <!-- a few pine trees, soft and snow-dusted -->
      ${pine(150, 720, 1.15)}
      ${pine(300, 745, 0.8)}
      ${pine(1330, 710, 1.25)}
      ${pine(1470, 745, 0.85)}
    </svg>`;
  }

  // A festive string of Christmas lights swagging across the top of the scene:
  // a draped wire with evenly-spaced coloured bulbs, each with a soft glow.
  function lightString() {
    const COLORS = ['#e2574e', '#f2c94c', '#6fb7d6', '#5fbf6a', '#d98cc4'];
    // three draped spans across the width; each dips in the middle
    const spans = [
      { x0: -40, x1: 560, dip: 150, y: 70 },
      { x0: 540, x1: 1080, dip: 150, y: 60 },
      { x0: 1060, x1: 1640, dip: 150, y: 72 }
    ];
    let out = '';
    let colorIdx = 0;
    spans.forEach(sp => {
      const midx = (sp.x0 + sp.x1) / 2, cy = sp.y + sp.dip;
      // the draped wire (a quadratic swag)
      out += `<path d="M${sp.x0} ${sp.y} Q${midx} ${cy} ${sp.x1} ${sp.y}"
                 fill="none" stroke="#1d3a2b" stroke-width="3" opacity="0.8"/>`;
      // bulbs along the swag, sampled on the quadratic Bezier
      const N = 9;
      for (let i = 1; i < N; i++) {
        const t = i / N;
        const bx = (1 - t) * (1 - t) * sp.x0 + 2 * (1 - t) * t * midx + t * t * sp.x1;
        const by = (1 - t) * (1 - t) * sp.y + 2 * (1 - t) * t * cy + t * t * sp.y;
        const c = COLORS[colorIdx++ % COLORS.length];
        out += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + 10).toFixed(1)}" stroke="#1d3a2b" stroke-width="2"/>
                <circle cx="${bx.toFixed(1)}" cy="${(by + 16).toFixed(1)}" r="12" fill="${c}" opacity="0.28"/>
                <circle cx="${bx.toFixed(1)}" cy="${(by + 16).toFixed(1)}" r="6" fill="${c}"/>
                <circle cx="${(bx - 1.6).toFixed(1)}" cy="${(by + 14).toFixed(1)}" r="1.8" fill="rgba(255,255,255,0.8)"/>`;
      }
    });
    return `<g>${out}</g>`;
  }

  // One snow-dusted, lightly-decorated pine at (x,baseY) scaled by s. Festive
  // touches: a few warm baubles tucked in the boughs and a small gold star on
  // top, so the distant trees read as decorated Christmas trees.
  function pine(x, baseY, s) {
    const w = 70 * s, h = 150 * s;
    const trunkW = 14 * s, trunkH = 26 * s;
    const tiers = [0, 1, 2];
    const topY = baseY - trunkH - (2 * h * 0.26) - h * 0.42; // apex of the top tier
    const layers = tiers.map(i => {
      const ty = baseY - trunkH - (i * h * 0.26);
      const tw = w * (1 - i * 0.22);
      const th = h * 0.42;
      return `<path d="M${x} ${ty - th} L${x + tw / 2} ${ty} L${x - tw / 2} ${ty} Z"
                    fill="#2b6a4a"/>
              <path d="M${x} ${ty - th} L${x + tw / 2} ${ty} L${x} ${ty} Z"
                    fill="#327a55"/>
              <path d="M${x} ${ty - th} q${tw * 0.18} ${th * 0.3} ${tw * 0.32} ${th * 0.5}
                       l-${tw * 0.32} 0 z" fill="#eaf3ff" opacity="0.8"/>`;
    }).join('');
    // a handful of baubles across the lower tiers
    const dot = (dx, dy, c) =>
      `<circle cx="${x + dx * s}" cy="${baseY - trunkH - dy * s}" r="${2.6 * s}" fill="${c}"/>`;
    const baubles =
      dot(-14, 10, '#e2574e') + dot(12, 22, '#f2c94c') + dot(-6, 40, '#6fb7d6') +
      dot(16, 54, '#e2574e') + dot(-18, 66, '#f2c94c');
    return `<g>
      <rect x="${x - trunkW / 2}" y="${baseY - trunkH}" width="${trunkW}"
            height="${trunkH}" rx="${3 * s}" fill="#4a3520"/>
      ${layers}
      ${baubles}
      <!-- gold star topper -->
      <circle cx="${x}" cy="${topY}" r="${7 * s}" fill="rgba(255,236,160,0.55)"/>
      <path d="M${x} ${topY - 6 * s} l${1.8 * s} ${4 * s} ${4.4 * s} .4 -${3.4 * s} ${3 * s} 1.1 ${4.4 * s} -${3.9 * s} -${2.4 * s} -${3.9 * s} ${2.4 * s} 1.1 -${4.4 * s} -${3.4 * s} -${3 * s} ${4.4 * s} -.4 z"
            fill="#f3c64b"/>
    </g>`;
  }

  // Animated falling snow on a full-screen canvas.
  function startSnow(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, flakes = [];

    // Honour the OS "reduce motion" preference: draw a still, sparse scatter of
    // flakes once and skip the animation loop entirely.
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
      h = canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      // density scales with area; cap so it never gets heavy
      const count = Math.min(220, Math.round((w * h) / (26000 * devicePixelRatio)));
      flakes = Array.from({ length: count }, makeFlake);
    }

    function makeFlake() {
      const r = (Math.random() * 2.4 + 0.8) * devicePixelRatio;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        // bigger flakes fall faster (parallax-ish depth)
        vy: (r * 0.28 + 0.25) * devicePixelRatio,
        drift: (Math.random() * 0.6 + 0.2) * devicePixelRatio,
        phase: Math.random() * Math.PI * 2,
        sway: Math.random() * 0.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.5
      };
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(40, now - last); last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (const f of flakes) {
        f.phase += 0.002 * dt * f.sway;
        f.y += f.vy * (dt / 16.7);
        f.x += Math.sin(f.phase) * f.drift * (dt / 16.7);
        if (f.y - f.r > h) { f.y = -f.r; f.x = Math.random() * w; }
        if (f.x > w + f.r) f.x = -f.r;
        if (f.x < -f.r) f.x = w + f.r;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    // Draw the current flakes once, without advancing them (used for the
    // reduced-motion still frame, re-drawn on resize).
    function drawStill() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (const f of flakes) {
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    resize();
    if (reduceMotion) {
      drawStill();
      window.addEventListener('resize', () => { resize(); drawStill(); });
      return;
    }
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  function mountWinter() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);

    // Moon as its own CSS-positioned element (not baked into the sliced scene)
    // so it stays visible on any aspect ratio, portrait phones included.
    const moon = document.createElement('div');
    moon.className = 'moon';
    moon.setAttribute('aria-hidden', 'true');
    moon.innerHTML =
      '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="mGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="rgba(224,238,255,0.9)"/>' +
      '<stop offset="38%" stop-color="rgba(200,224,255,0.35)"/>' +
      '<stop offset="100%" stop-color="rgba(200,224,255,0)"/>' +
      '</radialGradient></defs>' +
      '<circle cx="100" cy="100" r="100" fill="url(#mGlow)"/>' +
      '<circle cx="100" cy="100" r="34" fill="#eef5ff"/>' +
      '<circle cx="114" cy="90" r="34" fill="#dbe8ff" opacity="0.5"/>' +
      '</svg>';
    bg.appendChild(moon);

    const canvas = document.createElement('canvas');
    canvas.className = 'snow';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);  // behind book (z-index in CSS), over scene

    startSnow(canvas);
  }

  window.mountWinter = mountWinter;
})();
