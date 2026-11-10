// Dinosaurs — the non-animal spreads:
//   buildSizeLadder()  page 1: a child, Velociraptor, Triceratops and T. rex
//                      side by side at one true scale. Tapping it opens the
//                      full to-scale line-up (zoom.js), the book's only zoom;
//   buildLineup()      every animal in the book + the child at ONE scale,
//                      Pteranodon in the sky, Plesiosaurus in the water;
//   buildAsteroid()    the asteroid hitting Earth (flash + dust cloud);
//   buildSurvivors()   a chicken, a crocodile and a turtle.

(function () {
  'use strict';

  const D = window.DinoKit;
  const { G, f, tube, shape, ell, makeKit, child, sceneAnim, hinge, place, rng } = D;
  const META = () => window.DINO_META || {};

  // ---------------------------------------------------------------- ladder --
  function buildSizeLadder() {
    const k = 24, M = META();
    const pl = (key, x) => (M[key] ? place(M[key], k, x, G) : '');
    return `<svg viewBox="-40 -50 450 380" data-fullview="buildLineup" data-fullview-title="Everyone at true scale" data-fullview-zoom="off" data-fullview-close="off" xmlns="http://www.w3.org/2000/svg"
        aria-label="A child, a Velociraptor, a Triceratops and a T. rex at true scale">
      <g data-part="dino-ground"><ellipse cx="190" cy="${G + 2}" rx="186" ry="14" fill="rgba(143,118,80,0.32)"/></g>
      <g data-part="ladder-c">${pl('trex', 172)}</g>
      <g data-part="ladder-b">${pl('tri', 88)}</g>
      <g data-part="ladder-a">${pl('vel', 28)}</g>
      <g data-part="human">${child(12, 1.2 * k)}</g>
    </svg>`;
  }

  // ---------------------------------------------------------------- lineup --
  // a monkey-puzzle conifer (flat-topped crown) and a cycad, for scenery
  function araucaria(x, base, h, col, seed) {
    // tall bare trunk, a few up-curving branches with tufted foliage clumps
    const q = rng(seed || Math.round(x * 7 + h));
    const tw = Math.max(1.2, h * 0.018);
    let crown = '';
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const y = base - h * (0.72 + t * 0.085), span = h * (0.34 - t * 0.06);
      for (let side = -1; side <= 1; side += 2) {
        const bx = x + side * span;
        crown += `<path d="M${f(x)} ${f(y + h * 0.03)} Q${f(x + side * span * 0.5)} ${f(y + h * 0.02)} ${f(bx)} ${f(y - h * 0.01)}" stroke="${col}" stroke-width="${f(tw * 0.6)}" fill="none"/>`;
        for (let c = 0; c < 4; c++) {
          const cx = x + side * span * (0.35 + c * 0.22) + (q() - 0.5) * span * 0.15;
          const cy = y - h * 0.012 + (q() - 0.5) * h * 0.02;
          crown += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(span * (0.16 + q() * 0.08))}" ry="${f(h * (0.022 + q() * 0.012))}"/>`;
        }
      }
    }
    crown += `<ellipse cx="${f(x)}" cy="${f(base - h * 0.99)}" rx="${f(h * 0.08)}" ry="${f(h * 0.03)}"/>`;
    return `<g fill="${col}">
      <path d="M${f(x - tw)} ${f(base)} Q${f(x - tw * 0.6)} ${f(base - h * 0.5)} ${f(x - tw * 0.3)} ${f(base - h)} L${f(x + tw * 0.3)} ${f(base - h)} Q${f(x + tw * 0.6)} ${f(base - h * 0.5)} ${f(x + tw)} ${f(base)} Z"/>
      ${crown}
      <g fill="#000" opacity="0.12">${crown.replace(/<path[^>]*\/>/g, '')}</g>
    </g>`;
  }
  function cycad(x, base, s, col) {
    let fr = '';
    for (let i = -3; i <= 3; i++) {
      fr += `<path d="M0 0 q${f(6 * s)} ${f(-22 * s)} 0 ${f(-42 * s)} q${f(-6 * s)} ${f(20 * s)} 0 ${f(42 * s)} z" transform="rotate(${i * 22})"/>`;
    }
    return `<g fill="${col}" transform="translate(${f(x)} ${f(base - 12 * s)})"><rect x="${f(-4 * s)}" y="0" width="${f(8 * s)}" height="${f(12 * s)}" rx="${f(2 * s)}"/>${fr}</g>`;
  }

  function buildLineup() {
    const k = 16, M = META();
    const gB = 318, gF = 372, H = 470;
    const W = key => (M[key] ? (M[key].w * k) / M[key].s : 0);
    const r = rng(77);

    // ---- labels that never overlap: greedy rows under the feet ---------
    const FS = 11, CW = 6.3;                       // font size, approx char width
    const placed = [];
    const labels = [];
    const label = (txt, x, y, anchor) => {
      const w = txt.length * CW, x0 = anchor === 'start' ? x : x - w / 2;
      placed.push({ x0: x0 - 4, x1: x0 + w + 4, y0: y - FS, y1: y + 3 });
      labels.push(`<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor || 'middle'}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"
        font-size="${FS}" font-weight="700" fill="#33240f" stroke="#f6edd6" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke">${txt}</text>`);
    };
    const free = (x, y, txt) => {
      const w = txt.length * CW, a = { x0: x - w / 2 - 4, x1: x + w / 2 + 4, y0: y - FS, y1: y + 3 };
      return placed.every(b => a.x1 < b.x0 || a.x0 > b.x1 || a.y1 < b.y0 || a.y0 > b.y1);
    };
    const labelFoot = (txt, cx) => {
      for (let y = gF + 15; y < H - 4; y += 15) if (free(cx, y, txt)) return label(txt, cx, y);
      label(txt, cx, gF + 15);
    };

    let back = '', front = '';
    // back row: the two giants, labelled up in the sky beside them
    back += M.dip ? place(M.dip, k, 16, gB) : '';
    back += M.bra ? place(M.bra, k, 470, gB) : '';
    label('Diplodocus 26 m', 16 + W('dip') * 0.62, 176);
    label('Brachiosaurus 22 m', 640, 150);

    // front row, small to big, left to right
    let x = 26;
    front += child(x + 4, 1.2 * k, gF);
    const feet = [['You', x + 4]];
    x += 18;
    [['vel', 'Velociraptor 2 m'], ['pac', 'Pachycephalosaurus 4.5 m'], ['trex', 'T. rex 12 m'],
     ['tri', 'Triceratops 9 m'], ['ste', 'Stegosaurus 9 m'], ['all', 'Allosaurus 9 m'], ['igu', 'Iguanodon 10 m']]
      .forEach(([key, name]) => {
        if (!M[key]) return;
        front += place(M[key], k, x, gF);
        feet.push([name, x + W(key) / 2]);
        x += W(key) + 10;
      });
    feet.forEach(([t, cx]) => labelFoot(t, cx));

    // sky + water reptiles (not dinosaurs!)
    const ptera = M.pte ? place(M.pte, k, 742, 116) : '';
    const plesio = M.ple ? place(M.ple, k, 840, 460) : '';
    label('Pteranodon 7 m wings', 802, 92);
    label('Plesiosaurus 3.5 m', 900, 464);

    // ---- scenery -------------------------------------------------------
    let clouds = '';
    [[150, 60, 90, 16], [420, 40, 120, 18], [700, 70, 80, 12], [930, 46, 110, 16], [300, 96, 70, 10], [80, -90, 110, 18], [560, -110, 140, 20], [880, -60, 100, 16], [330, -40, 90, 14]].forEach(c => {
      clouds += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${c[2]}" ry="${c[3]}"/><ellipse cx="${c[0] + c[2] * 0.3}" cy="${c[1] - c[3] * 0.6}" rx="${c[2] * 0.5}" ry="${c[3]}"/>`;
    });
    let farTrees = '';
    [[60, 300, 70], [110, 302, 54], [400, 298, 80], [446, 300, 60], [700, 296, 86], [760, 298, 64], [880, 296, 74], [960, 298, 58]]
      .forEach(t => { farTrees += araucaria(t[0], t[1], t[2], '#7f8768'); });
    let midTrees = '';
    [[2, 352, 120], [988, 348, 130], [612, 344, 96]].forEach(t => { midTrees += araucaria(t[0], t[1], t[2], '#5f6a48'); });
    let ferns = '';
    [[-6, 474, 0.8], [640, 476, 0.6], [1006, 476, 0.7]].forEach(c => { ferns += cycad(c[0], c[1], c[2], '#5d6b42'); });
    let pebbles = '';
    for (let i = 0; i < 90; i++) {
      const px = r() * 1000, py = 384 + r() * 86;
      if (px > 700 && py > 430) continue;
      pebbles += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(1 + r() * 2.2)}" ry="${f(0.6 + r())}" fill="#8d7450" opacity="${f(0.25 + r() * 0.3)}"/>`;
    }
    let tufts = '';
    for (let i = 0; i < 40; i++) {
      const px = r() * 1000, py = 340 + r() * 40;
      tufts += `<path d="M${f(px)} ${f(py)} l-3 -7 M${f(px)} ${f(py)} l0 -9 M${f(px)} ${f(py)} l3 -7" stroke="#7d8650" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>`;
    }

    return `<svg viewBox="0 -160 1000 ${H + 160}" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet"
        aria-label="Every animal in the book and a child, all at the same true scale">
      <defs>
        <linearGradient id="lnSky" gradientUnits="userSpaceOnUse" x1="0" y1="-900" x2="0" y2="${H}">
          <stop offset="0" stop-color="#7aa8bf"/><stop offset="0.5" stop-color="#9fc0cb"/><stop offset="0.78" stop-color="#cbd8cf"/><stop offset="0.92" stop-color="#e6dcbf"/><stop offset="1" stop-color="#f1dfb6"/></linearGradient>
        <radialGradient id="lnSun">
          <stop offset="0" stop-color="#fff6da" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6da" stop-opacity="0"/></radialGradient>
        <linearGradient id="lnFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9aa6a4"/><stop offset="1" stop-color="#c5c4ae"/></linearGradient>
        <linearGradient id="lnHill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9a77d"/><stop offset="1" stop-color="#c3b48a"/></linearGradient>
        <linearGradient id="lnGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c9b588"/><stop offset="1" stop-color="#b39a6b"/></linearGradient>
        <linearGradient id="lnSea" gradientUnits="userSpaceOnUse" x1="0" y1="420" x2="0" y2="660">
          <stop offset="0" stop-color="#7cc2cf"/><stop offset="0.5" stop-color="#3f93ad"/><stop offset="1" stop-color="#22647f"/></linearGradient>
        <filter id="lnSoft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="lnHaze"><feGaussianBlur stdDeviation="1.4"/></filter>
      </defs>
      <!-- the sky and ground run far past the frame, so when the view is wider
           or taller than the scene there are no empty bars -->
      <rect x="-3000" y="-3000" width="7000" height="${3000 + H}" fill="url(#lnSky)"/>
      <circle cx="820" cy="40" r="420" fill="url(#lnSun)"/>
      <g fill="#ffffff" opacity="0.55" filter="url(#lnSoft)">${clouds}</g>

      <!-- far mountains + a smoking volcano, softened by haze -->
      <g filter="url(#lnHaze)">
        <path d="M-3000 262 L0 262 L70 214 L130 236 L210 190 L290 230 L360 206 L440 244 L520 200 L560 180 L600 200 L680 236 L760 204 L840 232 L920 196 L1000 222 L4000 222 L4000 310 L-3000 310 Z" fill="url(#lnFar)" opacity="0.8"/>
        <g fill="#d9d4c4" opacity="0.6" filter="url(#lnSoft)"><ellipse cx="562" cy="160" rx="26" ry="16"/><ellipse cx="584" cy="128" rx="40" ry="20"/><ellipse cx="624" cy="98" rx="56" ry="22"/></g>
      </g>
      <path d="M-3000 290 L0 290 C 120 262 260 270 380 284 S 640 266 760 278 S 930 270 1000 276 L4000 276 L4000 340 L-3000 340 Z" fill="url(#lnHill)" opacity="0.9"/>
      ${farTrees}
      <path d="M-3000 312 L0 312 C 200 300 420 316 620 306 S 900 304 1000 310 L4000 310 L4000 3000 L-3000 3000 Z" fill="url(#lnGround)"/>
      ${back}
      ${midTrees}
      <path d="M-3000 352 L0 352 C 220 342 460 356 700 348 S 940 344 1000 350 L4000 350 L4000 3000 L-3000 3000 Z" fill="#c3a878"/>
      ${tufts}
      ${pebbles}
      ${front}

      <!-- a lagoon that runs off the right and bottom edges, with a wet shore -->
      <path d="M1000 660 C 800 616 664 556 640 ${H} C 690 438 770 420 880 416 C 940 414 980 416 1000 414 L4000 414 L4000 660 Z" fill="#a08a62" opacity="0.6"/>
      <path d="M1000 646 C 810 604 678 548 654 ${H} C 702 442 780 426 882 422 C 940 420 978 421 1000 420 L4000 420 L4000 646 Z" fill="url(#lnSea)"/>
      <path d="M1000 646 C 810 604 678 548 654 ${H} C 702 442 780 426 882 422 C 940 420 978 421 1000 420 L4000 420" fill="none" stroke="#eefcff" stroke-width="2" opacity="0.85"/>
      <g stroke="#e4f7fb" stroke-width="1" opacity="0.5" stroke-linecap="round">
        <path d="M800 448 l40 0"/><path d="M880 442 l50 0"/><path d="M930 458 l40 0"/></g>
      ${plesio}
      ${ferns}
      ${ptera}
      ${labels.join('')}
    </svg>`;
  }

  // -------------------------------------------------------------- asteroid --
  function buildAsteroid() {
    const K = makeKit({ deepest: '#000' });
    const id = K.id, T = '2.4s cubic-bezier(.5,0,.4,1)';
    const r = rng(42);
    let stars = '';
    for (let i = 0; i < 70; i++) {
      const x = 8 + r() * 354, y = 8 + r() * 276, s = 0.4 + r() * 1.1;
      stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="#fff" opacity="${f(0.4 + r() * 0.6)}"/>`;
    }
    const E = [176, 198], R = 104, IMP = [128, 130];
    // irregular continents: noisy blobs (seeded), clipped to the globe
    const blob = (cx, cy, rr, seed) => {
      const q = rng(seed), ps = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, k = rr * (0.62 + q() * 0.55);
        ps.push([cx + Math.cos(a) * k * 1.15, cy + Math.sin(a) * k * 0.9]);
      }
      return `<path d="${shape(ps).d}"/>`;
    };
    const land = blob(132, 140, 30, 4) + blob(160, 156, 18, 9) + blob(216, 176, 26, 12) + blob(236, 206, 16, 21) +
      blob(138, 232, 22, 30) + blob(120, 252, 12, 33) + blob(250, 248, 15, 40) + blob(196, 118, 10, 47);
    const rock = shape([[306, 44], [316, 38], [328, 42], [332, 54], [326, 64], [312, 66], [304, 58]]);
    const trail = tube([[318, 52], [340, 32], [372, 2]], [12, 7, 1]);

    const anim = sceneAnim([
      { parts: 'asteroid', origin: '318px 52px', timing: T,
        keyframes: `0%{opacity:1;transform:translate(0,0) scale(1)}30%{opacity:1;transform:translate(${IMP[0] - 318}px,${IMP[1] - 52}px) scale(.5)}31%,100%{opacity:0;transform:translate(${IMP[0] - 318}px,${IMP[1] - 52}px) scale(.5)}` },
      { parts: 'fx-flash', origin: `${IMP[0]}px ${IMP[1]}px`, timing: T,
        keyframes: '0%,29%{opacity:0;transform:scale(.2)}33%{opacity:1;transform:scale(1)}55%{opacity:.6;transform:scale(1.6)}75%,100%{opacity:0;transform:scale(2)}' },
      { parts: 'fx-cloud', origin: `${IMP[0]}px ${IMP[1]}px`, timing: T,
        keyframes: '0%,32%{opacity:0;transform:scale(.1)}62%{opacity:.85;transform:scale(.8)}88%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1)}' },
      { parts: ['earth', 'earth-clouds'], timing: T,
        keyframes: '0%,31%,48%,100%{transform:translate(0,0)}34%{transform:translate(-3px,2px)}38%{transform:translate(3px,-2px)}42%{transform:translate(-2px,1px)}' }
    ]);

    return `<svg viewBox="-40 -50 450 380" xmlns="http://www.w3.org/2000/svg"
        aria-label="A giant asteroid streaking toward Earth">
      ${K.defs()}
      <defs>
        <radialGradient id="${id('sea')}" cx="38%" cy="32%" r="75%">
          <stop offset="0" stop-color="#6fc0e6"/><stop offset="0.6" stop-color="#2b78b4"/><stop offset="1" stop-color="#123a66"/></radialGradient>
        <radialGradient id="${id('night')}" cx="30%" cy="26%" r="90%">
          <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020615" stop-opacity="0.8"/></radialGradient>
        <radialGradient id="${id('air')}" cx="50%" cy="50%" r="50%">
          <stop offset="0.86" stop-color="#9fd8ff" stop-opacity="0"/><stop offset="0.95" stop-color="#9fd8ff" stop-opacity="0.55"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id('rock')}" cx="35%" cy="30%" r="80%">
          <stop offset="0" stop-color="#b19a80"/><stop offset="0.6" stop-color="#6e5c4a"/><stop offset="1" stop-color="#3a2f25"/></radialGradient>
        <linearGradient id="${id('fire')}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#fff2b0"/><stop offset="0.4" stop-color="#ffab3d"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id('flash')}">
          <stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#fff0a8"/><stop offset="0.7" stop-color="#ff8a2a" stop-opacity="0.6"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
        <clipPath id="${id('globe')}"><circle cx="${E[0]}" cy="${E[1]}" r="${R}"/></clipPath>
      </defs>
      ${anim}

      <g data-part="earth">
        <circle cx="${E[0]}" cy="${E[1]}" r="${R + 8}" fill="url(#${id('air')})"/>
        <circle cx="${E[0]}" cy="${E[1]}" r="${R}" fill="url(#${id('sea')})"/>
        <g clip-path="url(#${id('globe')})">
          <g fill="#7c8f52">${land}</g>
          <g fill="#b39a68" opacity="0.55" transform="translate(-3 -2)">${land}</g>
          <g fill="#5d7a43" opacity="0.6" transform="translate(3 3) scale(0.99)">${land}</g>
          <circle cx="${E[0]}" cy="${E[1]}" r="${R}" fill="url(#${id('night')})"/>
        </g>
      </g>
      <g data-part="earth-clouds" clip-path="url(#${id('globe')})" fill="#ffffff" filter="url(#${id('mist')})" opacity="0.55">
        <ellipse cx="120" cy="176" rx="34" ry="5" transform="rotate(-8 120 176)"/><ellipse cx="204" cy="124" rx="26" ry="4"/>
        <ellipse cx="226" cy="232" rx="34" ry="5" transform="rotate(6 226 232)"/><ellipse cx="150" cy="268" rx="22" ry="4"/>
        <ellipse cx="250" cy="170" rx="16" ry="3"/><ellipse cx="96" cy="214" rx="14" ry="3"/>
      </g>
      <g data-part="fx-cloud" opacity="0" fill="#6a5a4a" filter="url(#${id('mist')})">
        <ellipse cx="128" cy="130" rx="40" ry="26"/><ellipse cx="160" cy="170" rx="52" ry="34"/>
        <ellipse cx="110" cy="190" rx="34" ry="30"/><ellipse cx="200" cy="140" rx="40" ry="26"/>
        <ellipse cx="196" cy="214" rx="56" ry="36"/><ellipse cx="140" cy="248" rx="36" ry="22"/>
        <ellipse cx="236" cy="182" rx="30" ry="34"/>
      </g>
      <g data-part="asteroid">
        <path d="${trail.d}" fill="url(#${id('fire')})"/>
        <circle cx="318" cy="52" r="20" fill="#ffb347" opacity="0.25"/>
        <path d="${rock.d}" fill="url(#${id('rock')})"/>
        <g fill="#2e251d" opacity="0.5"><circle cx="314" cy="48" r="2.4"/><circle cx="322" cy="58" r="1.8"/><circle cx="326" cy="47" r="1.4"/></g>
      </g>
      <g data-part="fx-flash" opacity="0"><circle cx="${IMP[0]}" cy="${IMP[1]}" r="44" fill="url(#${id('flash')})"/></g>
    </svg>`;
  }

  // ------------------------------------------------------------- survivors --
  function buildSurvivors() {
    const KC = makeKit({ light: '#7f8659', mid: '#5f6641', dark: '#484e31', deep: '#363b25', deepest: '#252918', belly: '#d0c89c', eye: '#c9b23a', claw: '#1f1810' });
    const KT = makeKit({ light: '#9a9a6c', mid: '#76784e', dark: '#5a5c3a', deep: '#44462c', deepest: '#2e301d', belly: '#d8cf9e', eye: '#7a4a1a', claw: '#1f1810' });
    const KB = makeKit({ light: '#cf8a4f', mid: '#a86331', dark: '#814824', deep: '#5f3419', deepest: '#3f2110', belly: '#ecc79d', eye: '#e0a030', claw: '#3a2a10' }, { grain: 1.3, bump: 0.7 });
    const T = '2.4s ease-in-out';

    // crocodile (front), facing left
    const croc = [shape([[80, 262], [110, 250], [160, 246], [210, 252], [230, 264], [210, 278], [160, 284], [110, 282], [84, 276]]),
      tube([[220, 266], [262, 272], [300, 278], [334, 284]], [16, 10, 6, 1.5]),
      tube([[110, 276], [100, 284], [92, 288]], [6, 5, 4.5]), tube([[200, 276], [210, 284], [220, 288]], [7, 6, 5]),
      shape([[20, 268], [40, 264], [80, 262], [94, 270], [80, 278], [44, 278], [24, 274]])];
    const crocHead = shape([[18, 266], [26, 258], [50, 254], [80, 248], [100, 250], [104, 262], [92, 268], [50, 268], [24, 270]]);
    let scutes = '';
    for (let x = 104; x <= 222; x += 9) scutes += `<rect x="${x}" y="${f(249 + Math.abs(x - 160) * 0.05)}" width="6" height="4" rx="1.6" fill="${'#2f3420'}" opacity="0.55"/>`;
    for (let x = 230; x <= 300; x += 9) scutes += `<path d="M${x} ${f(266 + (x - 230) * 0.15)} l3 -5 l3 5 z" fill="#2f3420" opacity="0.6"/>`;
    let teeth = '';
    for (let x = 28; x <= 90; x += 6) teeth += `<path d="M${x} 268 l2.6 0 l-1.3 4 z" fill="#efe6cf"/>`;

    // turtle (back right)
    const shell = shape([[270, 240], [280, 218], [306, 206], [336, 210], [354, 228], [352, 244], [310, 248], [276, 248]]);
    const limbs = [tube([[282, 238], [264, 232], [252, 226]], [7, 6, 6]), ell(246, 225, 9, 7),
      tube([[286, 244], [280, 254]], [6, 5]), tube([[342, 244], [348, 254]], [6, 5]), tube([[352, 240], [362, 244]], [3, 1])];
    const scuteLines = `<g fill="none" stroke="#3a3218" stroke-width="1.2" opacity="0.6">
      <path d="M296 214 l8 12 l-8 14"/><path d="M322 210 l-2 14 l6 16"/><path d="M304 226 l18 -2 l12 6"/>
      <path d="M276 238 q36 8 76 2"/></g>`;

    // chicken on a log (back left)
    const hen = [ell(140, 182, 28, 22, -10), shape([[160, 170], [176, 146], [188, 150], [182, 172], [168, 188]]),
      tube([[126, 172], [114, 158]], [10, 8]), ell(110, 152, 11, 10)];
    const wing = shape([[128, 176], [150, 170], [166, 180], [158, 196], [136, 196]]);

    const anim = sceneAnim([
      { parts: 'sv-croc-head', origin: '98px 262px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}16%{transform:rotate(20deg)}24%{transform:rotate(-1deg)}34%{transform:rotate(18deg)}42%{transform:rotate(-1deg)}52%{transform:rotate(0)}' },
      { parts: 'sv-turtle-limbs', origin: '312px 234px', timing: T,
        keyframes: '0%,8%,100%{transform:scale(1)}22%,72%{transform:scale(.35)}88%{transform:scale(1)}' },
      { parts: 'sv-turtle-shell', timing: T,
        keyframes: '0%,8%,100%{transform:translate(0,0)}22%,72%{transform:translate(0,3px)}88%{transform:translate(0,0)}' },
      { parts: 'sv-bird', timing: T,
        keyframes: '0%,100%{transform:translate(0,0)}12%,36%{transform:translate(0,-10px)}24%{transform:translate(0,-14px)}48%{transform:translate(0,0)}' },
      { parts: 'sv-bird-wing', origin: '132px 178px', timing: T,
        keyframes: '0%,100%{transform:translate(0,0) rotate(0)}8%{transform:translate(0,-8px) rotate(-55deg)}16%{transform:translate(0,-12px) rotate(0)}24%{transform:translate(0,-14px) rotate(-55deg)}32%{transform:translate(0,-12px) rotate(0)}40%{transform:translate(0,-6px) rotate(-40deg)}48%{transform:translate(0,0) rotate(0)}' }
    ]);

    const body =
      `<g data-part="sv-ground">
        <ellipse cx="190" cy="262" rx="190" ry="40" fill="#c8b083" opacity="0.35"/>
        <ellipse cx="150" cy="288" rx="150" ry="12" fill="#6aa8b8" opacity="0.4"/>
      </g>` +
      `<g data-part="sv-rock">
        <path d="M80 216 L180 212 Q188 224 180 236 L82 240 Q74 228 80 216 Z" fill="#7a5a3a"/>
        <path d="M84 218 L178 214 L178 220 L84 224 Z" fill="#9a7a52" opacity="0.7"/>
        <ellipse cx="80" cy="228" rx="7" ry="12" fill="#b08c60"/><ellipse cx="80" cy="228" rx="4" ry="7" fill="none" stroke="#7a5a3a"/>
      </g>` +
      `<g data-part="shadow"><ellipse cx="312" cy="250" rx="46" ry="5" fill="rgba(35,22,8,0.3)"/><ellipse cx="150" cy="288" rx="120" ry="6" fill="rgba(35,22,8,0.25)"/></g>` +
      KB.part('sv-bird', hen, {
        clip: KB.feathers({ x: 110, y: 160, w: 70, h: 44 }, 50, ['#e6a96a', '#6a3a1a'], 21) + KB.hl(130, 172, 16, 8),
        over: `<path d="M104 144 l2 -6 l4 4 l3 -6 l3 6 l3 -4 l1 8 z" fill="#d63a2a"/>` +
          `<path d="M99 151 l-8 3 l8 3 z" fill="#e6b23a"/><ellipse cx="102" cy="161" rx="3" ry="4.5" fill="#d63a2a"/>` +
          KB.eye(108, 150, 1.8) +
          `<g stroke="#d9a63a" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M136 200 l-2 14 l-6 1 M134 214 l4 1"/><path d="M148 200 l2 14 l-5 1 M150 214 l5 1"/></g>` }) +
      KB.part('sv-bird-wing', wing, { tone: 'dark', clip: KB.feathers({ x: 128, y: 170, w: 40, h: 26 }, 18, ['#e6a96a', '#3f2110'], 23) }) +
      KT.part('sv-turtle-limbs', limbs, { over: KT.eye(244, 222, 1.6) }) +
      KT.part('sv-turtle-shell', shell, { colors: ['#9a8a52', '#6e6034', '#463c1e'], clip: scuteLines + KT.hl(304, 216, 22, 6) }) +
      KC.part('sv-croc', croc, { belly: 0.6,
        under: `<path d="M22 268 L94 266 L96 252 C70 252 44 258 24 264 Z" fill="#7a2a24"/>`,
        clip: scutes + KC.hl(150, 252, 50, 4) + KC.cs(160, 280, 60, 6, 0.7) }) +
      KC.part('sv-croc-head', crocHead, { clip: KC.hl(60, 254, 30, 3),
        over: teeth + `<ellipse cx="88" cy="247" rx="6" ry="4" fill="#4f5634"/>` + KC.eye(88, 246, 1.8) +
          `<ellipse cx="24" cy="259" rx="3" ry="2" fill="#4f5634"/>` });

    return `<svg viewBox="-40 -50 450 380" xmlns="http://www.w3.org/2000/svg"
        aria-label="A chicken, a crocodile and a turtle">${KC.defs()}${KT.defs()}${KB.defs()}${anim}${body}</svg>`;
  }

  window.buildSizeLadder = buildSizeLadder;
  window.buildLineup = buildLineup;
  window.buildAsteroid = buildAsteroid;
  window.buildSurvivors = buildSurvivors;
})();
