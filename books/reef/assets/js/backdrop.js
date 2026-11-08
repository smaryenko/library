// Backdrop for the REEF book ("A Day on the Reef"): a sunlit underwater scene.
// A layered SVG scene (bright surface up top fading to deep teal below, soft
// slanting light rays, a distant coral-reef silhouette, a gentle sandy floor,
// a few swaying weeds) plus animated drifting bubbles on a full-screen canvas.
// Dependency-free; sits behind everything else. Per-book art — the shared
// engine just mounts whichever backdrop the manifest names.
//
// Reuses the shared `.winter-bg` / `.winter-scene` / `.snow` chrome classes
// from book.css (fixed, full-bleed, behind the book) so no engine or CSS
// change is needed. Exposes window.mountReef(), the name the stories manifest's
// `backdrop` field points at for this book.
//
// Style reference (local only, never traced/shipped): generic coral-reef and
// underwater-light photos. Redrawn original, low-contrast so the popped-up
// sea creatures stay the hero.

(function () {
  'use strict';

  function sceneSVG() {
    return `
    <svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- water column: bright sunlit top -> deep teal bottom -->
        <linearGradient id="reefWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#5fd3e0"/>
          <stop offset="34%"  stop-color="#1f9fc4"/>
          <stop offset="70%"  stop-color="#0c6f98"/>
          <stop offset="100%" stop-color="#064a6e"/>
        </linearGradient>
        <!-- shimmer band just under the surface -->
        <linearGradient id="reefSurface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="rgba(224,255,255,0.75)"/>
          <stop offset="100%" stop-color="rgba(224,255,255,0)"/>
        </linearGradient>
        <linearGradient id="reefSand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#e9d9a8"/>
          <stop offset="100%" stop-color="#cdb87f"/>
        </linearGradient>
        <linearGradient id="reefFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#0a6283"/>
          <stop offset="100%" stop-color="#074f6e"/>
        </linearGradient>
      </defs>

      <!-- full water column -->
      <rect x="0" y="0" width="1600" height="900" fill="url(#reefWater)"/>

      <!-- bright, slightly rippled surface band at the top -->
      <rect x="0" y="0" width="1600" height="150" fill="url(#reefSurface)"/>
      <path d="M0 60 q120 26 240 0 t240 0 t240 0 t240 0 t240 0 t160 0 L1600 0 L0 0 Z"
            fill="rgba(255,255,255,0.18)"/>

      <!-- soft slanting sunbeams from the surface -->
      ${lightRays()}

      <!-- distant reef silhouette along the floor -->
      <path d="M0 640 Q 240 560 520 630 T 1040 610 T 1600 600 L1600 900 L0 900 Z"
            fill="url(#reefFar)" opacity="0.65"/>

      <!-- a few far coral humps -->
      ${farCoral(300, 650, 1.0)}
      ${farCoral(780, 632, 1.25)}
      ${farCoral(1230, 648, 0.9)}

      <!-- gentle sandy floor -->
      <path d="M0 760 Q 480 710 940 760 T 1600 752 L1600 900 L0 900 Z"
            fill="url(#reefSand)"/>

      <!-- swaying weeds rooted in the sand -->
      ${weed(170, 772, 1.1)}
      ${weed(1440, 766, 1.2)}
      ${weed(620, 778, 0.85)}
    </svg>`;
  }

  // Soft god-rays slanting down from the surface. A handful of translucent
  // wedges, lighter at the top where the sun enters.
  function lightRays() {
    const rays = [
      { x: 260,  w: 120, skew: 150 },
      { x: 560,  w: 180, skew: 220 },
      { x: 900,  w: 140, skew: 180 },
      { x: 1240, w: 200, skew: 260 }
    ];
    let out = '';
    rays.forEach(r => {
      out += `<path d="M${r.x} -20 l${r.w} 0 l${r.skew} 760 l-${r.w + 60} 0 z"
                 fill="rgba(226,255,255,0.10)"/>`;
    });
    return `<g>${out}</g>`;
  }

  // A rounded coral hump in the mid distance (just a soft lump of colour).
  function farCoral(x, baseY, s) {
    const w = 180 * s, h = 90 * s;
    return `<g opacity="0.7">
      <path d="M${x - w / 2} ${baseY}
               q${w * 0.1} -${h} ${w * 0.3} -${h * 0.9}
               q${w * 0.12} -${h * 0.4} ${w * 0.2} 0
               q${w * 0.12} -${h * 0.7} ${w * 0.3} 0
               q${w * 0.1} ${h * 0.4} ${w * 0.2} ${h * 0.9} z"
            fill="#0e7a9c"/>
    </g>`;
  }

  // A clump of soft sea-weed blades rising from the sand.
  function weed(x, baseY, s) {
    const cols = ['#2e9c6e', '#3bb17d', '#278a5f'];
    let out = '';
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 16 * s;
      const h = (90 + (i % 3) * 36) * s;
      const bend = (i % 2 ? 1 : -1) * 26 * s;
      out += `<path d="M${x + dx} ${baseY}
                 q${bend} -${h * 0.5} ${bend * 0.4} -${h}
                 q-${10 * s} ${8 * s} -${16 * s} 0
                 q${bend * 0.5} ${h * 0.5} -${bend} ${h} z"
               fill="${cols[i % cols.length]}" opacity="0.8"/>`;
    }
    return `<g>${out}</g>`;
  }

  // Animated rising bubbles on a full-screen canvas. Same structure as the
  // xmas snow (density scales with area, honours reduced-motion), but bubbles
  // rise, wobble, and are drawn as soft rings with a highlight.
  function startBubbles(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, bubbles = [];

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
      h = canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const count = Math.min(120, Math.round((w * h) / (42000 * devicePixelRatio)));
      bubbles = Array.from({ length: count }, makeBubble);
    }

    function makeBubble() {
      const r = (Math.random() * 6 + 2) * devicePixelRatio;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        // bigger bubbles rise faster
        vy: (r * 0.18 + 0.3) * devicePixelRatio,
        phase: Math.random() * Math.PI * 2,
        sway: Math.random() * 0.8 + 0.3,
        drift: (Math.random() * 0.5 + 0.2) * devicePixelRatio,
        alpha: Math.random() * 0.35 + 0.2
      };
    }

    function drawBubble(b) {
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = '#eaffff';
      ctx.lineWidth = Math.max(1, b.r * 0.18);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      // little highlight
      ctx.globalAlpha = b.alpha * 1.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, Math.max(0.6, b.r * 0.22), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(40, now - last); last = now;
      ctx.clearRect(0, 0, w, h);
      for (const b of bubbles) {
        b.phase += 0.003 * dt * b.sway;
        b.y -= b.vy * (dt / 16.7);
        b.x += Math.sin(b.phase) * b.drift * (dt / 16.7);
        if (b.y + b.r < 0) { b.y = h + b.r; b.x = Math.random() * w; }
        drawBubble(b);
      }
      requestAnimationFrame(frame);
    }

    function drawStill() {
      ctx.clearRect(0, 0, w, h);
      for (const b of bubbles) drawBubble(b);
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

  function mountReef() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';         // reuse shared full-bleed backdrop chrome
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);

    const canvas = document.createElement('canvas');
    canvas.className = 'snow';           // reuse shared full-bleed canvas chrome
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    startBubbles(canvas);
  }

  window.mountReef = mountReef;
})();
