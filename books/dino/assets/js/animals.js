// Dinosaurs — the other ten animals, built with the shared kit (kit.js) in
// the same layered pseudo-3D way as the T. rex: one flat scene SVG each, one
// role-named data-part per body part (never nested), far-side limbs darker
// and further back, near-side limbs and heads closest, a 1.2 m child at true
// scale, and one invented tap animation per animal (no two the same).
//
// Every builder takes opts { child: false, scenery: false } so the size
// ladder and the to-scale line-up can reuse the bare animal. DINO_META holds
// each page's scale (s = px per metre) and horizontal extent (x0, w).

(function () {
  'use strict';

  const D = window.DinoKit;
  const { G, f, along, tube, shape, ell, makeKit, child, sceneAnim, hinge, wrap } = D;
  const META = window.DINO_META = window.DINO_META || {};

  const kid = (o, x, h) => (o.child === false ? '' : `<g data-part="human">${child(x, h)}</g>`);
  const kf = (frames, fn) => frames.map(fr => `${fr[0]}%{${fn(fr)}}`).join('');
  const sc = o => o.scenery !== false;

  function ellPt(cx, cy, rx, ry, rot, t) {
    const a = rot * Math.PI / 180, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
  }

  // soft dust puffs (hidden at rest) around (x, y)
  function dust(name, x, y, s) {
    s = s || 1;
    return `<g data-part="${name}" opacity="0" fill="#bfa77c">
      <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(10 * s)}" ry="${f(5 * s)}" opacity="0.7"/>
      <ellipse cx="${f(x - 12 * s)}" cy="${f(y - 3 * s)}" rx="${f(8 * s)}" ry="${f(5 * s)}" opacity="0.55"/>
      <ellipse cx="${f(x + 10 * s)}" cy="${f(y - 4 * s)}" rx="${f(7 * s)}" ry="${f(4 * s)}" opacity="0.5"/>
      <ellipse cx="${f(x - 4 * s)}" cy="${f(y - 9 * s)}" rx="${f(6 * s)}" ry="${f(4 * s)}" opacity="0.4"/>
    </g>`;
  }

  // an n-point star burst at (x, y)
  function star(x, y, R, r, n, col) {
    const ps = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 ? r : R;
      ps.push(f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr));
    }
    return `<path d="M${ps.join('L')}Z" fill="${col}"/>`;
  }

  // whoosh arcs (motion lines) around (x, y)
  function arcs(x, y, r, a0, a1, col) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      const rr = r + i * 7, p0 = [x + Math.cos(a0) * rr, y + Math.sin(a0) * rr], p1 = [x + Math.cos(a1) * rr, y + Math.sin(a1) * rr];
      out += `<path d="M${f(p0[0])} ${f(p0[1])} A${f(rr)} ${f(rr)} 0 0 1 ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${col}" stroke-width="${2.2 - i * 0.5}" stroke-linecap="round" opacity="${0.9 - i * 0.2}"/>`;
    }
    return out;
  }

  // ===================================================================
  // TRICERATOPS — lowers its head, horns forward, and paws the ground
  // ===================================================================
  const PAL_TRI = { light: '#9a9468', mid: '#757149', dark: '#5a5835', deep: '#444427', deepest: '#2e2e1a',
    belly: '#cdc49c', claw: '#2a2418', eye: '#c98a2a', horn: '#efe6cc' };

  function buildTriceratops(o) {
    o = o || {};
    const S = 36, P = PAL_TRI, K = makeKit(P), T = '2.4s ease-in-out';
    const { body } = D;
    // torso + tail in ONE continuous outline: deep barrel, highest over the
    // hips, the tail thick at the root and tapering just above the ground
    const trunk = body([[124, 218], [172, 208], [222, 202], [262, 214], [298, 232], [330, 248], [358, 258]],
      [26, 30, 28, 22, 13, 6, 1.4], [34, 44, 46, 30, 15, 7, 1.2], 64);
    // pillar legs with a heavy thigh / upper arm that blends into the body.
    // body(): first width list = BACK of a downward leg, second = FRONT
    const hind = body([[232, 192.0], [238, 214], [246, 252], [242, 274], [244, 288]], [20.8, 26, 13, 11, 12], [17.6, 22, 11, 10, 12], 40);
    const fore = body([[138, 210.0], [134, 234], [124, 266], [126, 288]], [12, 15, 9, 10], [13.6, 17, 9.5, 11], 36);
    const foot = (x, w) => ell(x, 288, w, 4.2);
    const hooves = (x, w) => [-0.7, 0, 0.7].map(k =>
      `<ellipse cx="${f(x + k * w * 0.8 - w * 0.25)}" cy="289" rx="${f(w * 0.28)}" ry="2.6" fill="#3a3324"/>`).join('');
    // the skull: hooked beak, deep face, cheek horn; frill as its own shield
    const head = shape([[24, 246], [21, 236], [28, 224], [44, 214], [64, 205], [84, 198], [102, 195], [118, 199],
      [128, 212], [131, 230], [124, 242], [108, 250], [86, 254], [62, 254], [42, 251]]);
    const frill = shape([[100, 196], [102, 172], [112, 150], [132, 134], [156, 132], [172, 146], [174, 172], [164, 198], [146, 220], [126, 228]]);
    let knobs = '';
    const edge = [[104, 168], [110, 152], [122, 140], [136, 132], [150, 130], [163, 136], [172, 148], [175, 162], [174, 176], [169, 190], [161, 202], [151, 213]];
    edge.forEach(p => { knobs += `<path d="M${f(p[0] - 3.6)} ${f(p[1] + 1)} Q${f(p[0])} ${f(p[1] - 6)} ${f(p[0] + 3.6)} ${f(p[1] + 1)} Z" fill="url(#${K.id('horn')})"/>`; });

    const NP = '128px 216px';
    const anim = sceneAnim([
      { parts: ['dino-frill', 'dino-head'], origin: NP, timing: T,
        keyframes: '0%,100%{transform:rotate(0)}16%{transform:rotate(4deg)}34%{transform:rotate(-11deg)}48%{transform:rotate(-8deg)}60%{transform:rotate(-12deg)}74%{transform:rotate(-8deg)}88%{transform:rotate(-2deg)}' },
      { parts: 'dino-leg-front', origin: '134px 222px', timing: T,
        keyframes: '0%,14%,100%{transform:translate(0,0) rotate(0)}24%{transform:translate(0,-9px) rotate(9deg)}36%{transform:translate(0,0) rotate(-4deg)}50%{transform:translate(0,-9px) rotate(9deg)}62%{transform:translate(0,0) rotate(-4deg)}74%{transform:translate(0,0) rotate(0)}' },
      { parts: 'dino-body', origin: '240px 288px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}34%,62%{transform:rotate(-1.2deg)}' },
      { parts: 'fx-dust', origin: '114px 284px', timing: T,
        keyframes: '0%,32%{opacity:0;transform:translate(0,0) scale(.6)}38%{opacity:.95;transform:translate(-2px,0) scale(1)}52%{opacity:.2;transform:translate(-14px,-6px) scale(1.3)}60%{opacity:0;transform:translate(0,0) scale(.6)}64%{opacity:.95;transform:translate(-2px,0) scale(1)}82%{opacity:.15;transform:translate(-16px,-8px) scale(1.35)}100%{opacity:0}' }
    ]);

    const legShade = (x, y) => K.cs(x + 10, y + 30, 8, 26, 0.55) + K.creases([`M${x - 10} ${y + 44} q8 3 16 0`, `M${x - 9} ${y + 50} q8 3 15 0`, `M${x - 10} ${y + 70} q9 2 18 0`]);
    const bodyMk =
      K.ground(190, 178, [[256, 289, 15], [244, 290, 18], [114, 289, 13], [126, 290, 15], [190, 292, 100, 7]], sc(o)) +
      K.part('dino-leg-far', [hind, foot(244, 13), fore, foot(126, 11)], { tone: 'dark', transform: 'translate(13 5)' }) +
      K.part('dino-body', trunk, { belly: true,
        clip: `<path d="${trunk.band(-1, -0.6, 0.05, 0.75)}" fill="${P.deepest}" opacity="0.18"/>` +
          K.tubercles({ x: 130, y: 176, w: 150, h: 60 }, 70, 5, 1.7) + K.tubercles({ x: 260, y: 208, w: 90, h: 34 }, 30, 8, 1.1) +
          K.cs(230, 252, 40, 10, 0.7) + K.cs(140, 248, 26, 10, 0.6) + K.creases(['M150 238 q10 6 26 6', 'M246 226 q-6 14 0 26'], 0.25) }) +
      K.part('dino-leg-near', [hind, foot(244, 14)], { clip: legShade(240, 214) + K.tubercles({ x: 220, y: 200, w: 40, h: 40 }, 16, 9, 1.4), over: hooves(244, 14) }) +
      K.part('dino-leg-front', [fore, foot(126, 12)], { clip: legShade(128, 226), over: hooves(126, 12) }) +
      K.part('dino-frill', frill, { colors: ['#a49a6a', '#7d7447', '#4f4a2a'],
        clip: `<path d="M114 196 Q118 160 140 146 Q160 140 166 160 Q166 186 148 208 Z" fill="#c9b98a" opacity="0.22"/>` +
          K.cs(132, 214, 22, 20, 0.9) + K.tubercles({ x: 110, y: 140, w: 60, h: 80 }, 24, 13, 1.2),
        over: knobs + K.horn([[110, 196], [102, 172], [88, 146]], [5, 3.2, 0.5], true) }) +
      K.part('dino-head', head, { belly: 0.5,
        clip: `<path d="M21 236 Q24 222 40 216 L50 226 Q44 246 30 250 Z" fill="#3a3324" opacity="0.6"/>` +
          K.hl(80, 206, 34, 7) + K.cs(116, 240, 18, 12, 0.8) + K.tubercles({ x: 50, y: 200, w: 70, h: 46 }, 26, 17, 1.1) +
          K.creases(['M60 238 q20 6 44 2', 'M104 222 q8 8 6 18'], 0.3),
        over: K.horn([[50, 212], [46, 200], [42, 190]], [6, 3.6, 0.6]) +
          K.horn([[100, 200], [88, 176], [70, 148]], [5.6, 3.6, 0.5]) +
          K.horn([[128, 232], [134, 240], [138, 246]], [3.4, 2.2, 0.5]) +
          K.eye(98, 210, 2.5) +
          `<path d="M32 242 Q50 248 74 246" fill="none" stroke="${P.deepest}" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>` +
          `<ellipse cx="40" cy="220" rx="2.4" ry="1.5" fill="#140d06" opacity="0.75"/>` }) +
      kid(o, 6, 1.2 * S) +
      dust('fx-dust', 114, 284, 1.1);
    return wrap(K, anim, bodyMk);
  }
  META.tri = { s: 36, x0: 20, w: 334, build: buildTriceratops };

  // ===================================================================
  // BRACHIOSAURUS — swings its long neck up into a tree and nibbles
  // ===================================================================
  const PAL_BRA = { light: '#9ea78d', mid: '#7a836c', dark: '#5f6754', deep: '#495040', deepest: '#33392d',
    belly: '#cbcbb2', claw: '#2a2a22', eye: '#b98a3a' };

  function buildBrachiosaurus(o) {
    o = o || {};
    const S = 19, P = PAL_BRA, K = makeKit(P), T = '2.4s ease-in-out';
    const tail = D.body([[236, 172], [268, 186], [300, 198], [334, 216], [366, 236]], [26, 20, 11, 5, 1.2], [36, 22, 11, 5, 1], 40);
    const legF = [D.body([[248, 192], [252, 228], [250, 262], [252, 288]], [10, 13, 9, 10], [9, 12, 8.5, 10], 30), ell(253, 288, 13, 4),
      D.body([[180, 182], [176, 228], [174, 262], [178, 288]], [9, 12, 8.5, 9.5], [9, 11, 8, 9.5], 30), ell(179, 288, 12, 4)];
    const body = D.body([[146, 176], [180, 164], [216, 166], [250, 178], [280, 192], [312, 206], [340, 222], [366, 236]], [20, 28, 26, 20, 13, 8, 4, 1.2], [26, 40, 40, 28, 15, 8, 4, 1], 80);
    const neck = D.body([[176, 168], [152, 128], [130, 90], [112, 58]], [20, 13, 9, 7], [24, 16, 10, 8], 40);
    const head = shape([[72, 60], [80, 52], [92, 46], [100, 34], [112, 32], [120, 42], [118, 54], [104, 62], [84, 66]]);
    const legN = [D.body([[234, 188], [238, 228], [236, 262], [238, 290]], [12, 15, 11, 12], [11, 14, 10, 12], 30), ell(240, 290, 16, 4.5),
      D.body([[166, 176], [160, 226], [156, 262], [158, 290]], [11, 14, 10, 11], [10, 13, 9.5, 11], 30), ell(158, 290, 14, 4.5)];

    const NB = [168, 160], HJ = [106, 60];
    const F = [[0, 0, 0], [26, -12, 0], [36, -11, 9], [44, -12.5, 0], [52, -11, 9], [60, -12, 0], [68, -11, 8], [76, -12, 0], [100, 0, 0]];
    const anim = sceneAnim([
      { parts: 'dino-neck-back', origin: `${NB[0]}px ${NB[1]}px`, timing: T, keyframes: kf(F, fr => `transform:rotate(${fr[1]}deg)`) },
      { parts: 'dino-head', origin: `${NB[0]}px ${NB[1]}px`, timing: T,
        keyframes: kf(F, fr => `transform:${hinge(`rotate(${fr[1]}deg)`, HJ, NB, fr[2])}`) },
      { parts: 'dino-tree', origin: '34px 292px', timing: T,
        keyframes: '0%,30%,100%{transform:rotate(0)}38%{transform:rotate(-1.4deg)}46%{transform:rotate(1deg)}54%{transform:rotate(-1.4deg)}62%{transform:rotate(1deg)}72%{transform:rotate(0)}' },
      { parts: 'dino-tail', origin: '262px 178px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}40%{transform:rotate(4deg)}70%{transform:rotate(-3deg)}' },
      { parts: 'fx-leaves', timing: T,
        keyframes: '0%,32%{opacity:0;transform:translate(0,0) rotate(0)}40%{opacity:1;transform:translate(0,4px) rotate(20deg)}100%{opacity:0;transform:translate(10px,90px) rotate(160deg)}' }
    ]);

    const leaf = (x, y, s) => `<ellipse cx="${x}" cy="${y}" rx="${f(3 * s)}" ry="${f(1.6 * s)}" fill="#6f8a4c"/>`;
    const tree = sc(o) ? `<g data-part="dino-tree">
        <path d="M28 292 L27 140 Q29 90 33 56 L39 56 Q42 100 40 292 Z" fill="#6b5236"/>
        <path d="M30 292 L29 140 Q30 96 33 60 L35 60 Q35 120 34 292 Z" fill="#8a6c48" opacity="0.6"/>
        <g fill="#556a3e">${[[34, 40, 32, 14], [12, 62, 26, 12], [58, 64, 26, 12], [30, 84, 32, 12], [6, 98, 20, 9], [60, 92, 22, 9]]
          .map(e => `<ellipse cx="${e[0]}" cy="${e[1]}" rx="${e[2]}" ry="${e[3]}"/>`).join('')}</g>
        <g fill="#7b9058" opacity="0.8">${[[30, 35, 22, 7], [8, 57, 16, 6], [56, 59, 17, 6], [26, 79, 22, 6], [58, 88, 13, 4]]
          .map(e => `<ellipse cx="${e[0]}" cy="${e[1]}" rx="${e[2]}" ry="${e[3]}"/>`).join('')}</g>
      </g>` : '';

    const bodyMk = tree +
      K.ground(205, 170, [[253, 289, 14], [240, 290, 18], [179, 289, 13], [158, 290, 16], [210, 292, 80, 6]], sc(o)) +
      K.part('dino-leg-far', legF, { tone: 'dark' }) +
      K.part('dino-neck-back', neck, { belly: 0.7, clip: K.hl(130, 100, 8, 34, 0.7) + K.cs(170, 166, 20, 14, 0.8) }) +
      K.part('dino-leg-under', legN, { clip: K.hl(150, 200, 8, 24) + K.hl(228, 214, 8, 20) }) +
      K.part('dino-body', body, { belly: true, clip: K.hl(196, 150, 40, 10) + K.cs(244, 202, 28, 16, 0.8) + K.cs(170, 208, 22, 12, 0.7) }) +
      K.part('dino-head', head, { belly: 0.5,
        clip: K.hl(104, 38, 10, 6, 0.8) + K.cs(100, 62, 18, 6, 0.6),
        over: K.eye(104, 46, 1.9) +
          `<path d="M76 60 q16 4 32 0" fill="none" stroke="${P.deepest}" stroke-width="1" opacity="0.7"/>` +
          `<ellipse cx="106" cy="34" rx="2.4" ry="1.4" fill="#140d06" opacity="0.7"/>` }) +
      kid(o, 72, 1.2 * S) +
      `<g data-part="fx-leaves" opacity="0">${leaf(70, 70, 1.2)}${leaf(62, 76, 1)}${leaf(78, 78, 1.1)}${leaf(66, 84, 0.9)}</g>`;
    return wrap(K, anim, bodyMk);
  }
  META.bra = { s: 19, x0: 70, w: 298, build: buildBrachiosaurus };

  // ===================================================================
  // STEGOSAURUS — swings its spiked tail (the thagomizer)
  // ===================================================================
  const PAL_STE = { light: '#9d925f', mid: '#796e43', dark: '#5d5433', deep: '#484027', deepest: '#302b1a',
    belly: '#d3c8a0', claw: '#2a2418', eye: '#c98a2a', horn: '#eadfc2' };
  const STE_SPINE = [[118, 214], [158, 186], [200, 166], [236, 168], [270, 184], [304, 196], [330, 202]];

  function plates(ts, hs, dx, dy) {
    return ts.map((t, i) => {
      const p = along(STE_SPINE, t), q = along(STE_SPINE, Math.min(1, t + 0.01)), r = along(STE_SPINE, Math.max(0, t - 0.01));
      let tx = q[0] - r[0], ty = q[1] - r[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = ty, ny = -tx, h = hs[i], w = h * 0.8;
      const P0 = [p[0] + dx, p[1] + dy + 3];
      return shape([
        [P0[0] - tx * w * 0.5, P0[1] - ty * w * 0.5],
        [P0[0] - tx * w * 0.55 + nx * h * 0.45, P0[1] - ty * w * 0.55 + ny * h * 0.45],
        [P0[0] + nx * h + tx * h * 0.12, P0[1] + ny * h + ty * h * 0.12],
        [P0[0] + tx * w * 0.45 + nx * h * 0.42, P0[1] + ty * w * 0.45 + ny * h * 0.42],
        [P0[0] + tx * w * 0.5, P0[1] + ty * w * 0.5]
      ]);
    });
  }

  function buildStegosaurus(o) {
    o = o || {};
    const S = 36, P = PAL_STE, K = makeKit(P), T = '2.2s cubic-bezier(.45,0,.3,1)';
    const tail = D.body([[252, 196], [292, 202], [328, 206], [362, 204]], [20, 12, 6, 2], [26, 14, 6, 2], 40);
    const legF = [D.body([[226, 190.0], [232, 216], [242, 248], [236, 270], [240, 288]], [20, 25, 13, 10, 11], [17.6, 22, 12, 10, 11], 36), ell(242, 288, 13, 4),
      D.body([[132, 216.0], [128, 238], [122, 262], [124, 288]], [10.4, 13, 9, 9], [11.2, 14, 9, 10], 30), ell(124, 288, 11, 3.5)];
    const body = D.body([[96, 234], [128, 224], [170, 204], [214, 196], [254, 204], [284, 208]], [9, 14, 26, 30, 20, 8], [11, 18, 38, 44, 28, 10], 50);
    const neck = D.body([[110, 226], [90, 232], [74, 236]], [9, 7, 6], [11, 9, 7], 20);
    const head = shape([[40, 248], [40, 240], [50, 232], [66, 228], [82, 228], [92, 234], [90, 244], [76, 250], [56, 252]]);
    const legN = [D.body([[212, 188.0], [220, 216], [232, 250], [224, 272], [228, 290]], [22.4, 28, 14, 11, 12], [19.2, 24, 12, 10, 12], 36), ell(230, 290, 15, 4.5),
      D.body([[120, 218.0], [118, 240], [112, 264], [114, 290]], [11.2, 14, 9, 9], [12, 15, 9.5, 10], 30), ell(114, 290, 12, 4)];
    const platesN = plates([0.1, 0.2, 0.31, 0.42, 0.53, 0.64, 0.75, 0.86], [14, 22, 30, 36, 38, 32, 24, 14], 0, 0);
    const platesF = plates([0.15, 0.26, 0.37, 0.48, 0.59, 0.7, 0.81], [18, 26, 34, 38, 35, 28, 18], 6, -4);
    const spikes = K.horn([[334, 206], [344, 190], [356, 178]], [3.8, 2.3, 0.4]) +
      K.horn([[344, 210], [358, 198], [370, 190]], [3.4, 2, 0.4]);
    const spikesFar = K.horn([[332, 210], [346, 204], [360, 196]], [3.4, 2, 0.4], true) +
      K.horn([[342, 214], [356, 212], [370, 206]], [3.2, 1.9, 0.4], true);
    const PC = ['#d0955a', '#a46634', '#6e401f'];

    const anim = sceneAnim([
      { parts: 'dino-tail', origin: '252px 200px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}22%{transform:rotate(-15deg)}40%{transform:rotate(12deg) scale(1.05)}52%{transform:rotate(-5deg)}66%{transform:rotate(3deg)}80%{transform:rotate(0)}' },
      { parts: 'dino-head', origin: '100px 226px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}22%{transform:rotate(-6deg)}44%{transform:rotate(4deg)}70%{transform:rotate(0)}' },
      { parts: 'fx-ring', origin: '360px 196px', timing: T,
        keyframes: '0%,34%{opacity:0;transform:scale(.6)}42%{opacity:1;transform:scale(1)}60%{opacity:0;transform:scale(1.3)}100%{opacity:0}' }
    ]);

    const bodyMk =
      K.ground(190, 172, [[248, 289, 14], [230, 290, 18], [148, 289, 12], [133, 290, 14], [190, 292, 90, 7]], sc(o)) +
      K.part('dino-plates-far', platesF, { colors: [PC[1], PC[2], '#3e2410'], texture: false }) +
      K.part('dino-tail', [tail], { belly: 0.5, clip: K.hl(290, 194, 30, 4), under: spikesFar, over: spikes }) +
      K.part('dino-leg-far', legF, { tone: 'dark' }) +
      K.part('dino-neck-back', neck, { belly: 0.7 }) +
      K.part('dino-body', body, { belly: true,
        clip: K.hl(186, 180, 46, 12) + K.cs(244, 226, 28, 18, 0.8) + K.cs(140, 236, 24, 10, 0.7) }) +
      K.part('dino-plates', platesN, { colors: PC, texture: false,
        clip: K.cs(190, 168, 90, 10, 0.5) }) +
      K.part('dino-leg-near', legN, { clip: K.hl(222, 222, 10, 16) + K.hl(132, 238, 6, 12) }) +
      K.part('dino-head', head, { belly: 0.5, clip: K.hl(60, 226, 14, 4),
        over: K.eye(78, 234, 2) + `<path d="M40 240 q14 3 30 0" fill="none" stroke="${P.deepest}" stroke-width="1" opacity="0.7"/>` }) +
      kid(o, 12, 1.2 * S) +
      `<g data-part="fx-ring" opacity="0">${arcs(330, 200, 30, -1.2, 0.4, '#fff6e0')}</g>`;
    return wrap(K, anim, bodyMk);
  }
  META.ste = { s: 36, x0: 36, w: 336, build: buildStegosaurus };

  // ===================================================================
  // VELOCIRAPTOR — fluffs up its feathers and does a quick hop
  // ===================================================================
  const PAL_VEL = { light: '#c08f5c', mid: '#93653a', dark: '#6f4827', deep: '#52341c', deepest: '#372313',
    belly: '#e6d2b0', claw: '#1f1810', eye: '#d9a034' };

  function buildVelociraptor(o) {
    o = o || {};
    const S = 110, P = PAL_VEL, K = makeKit(P, { grain: 1.3, bump: 0.8 }), T = '2s cubic-bezier(.4,0,.3,1)';
    const tail = [      ell(304, 211, 24, 5, -8), ell(306, 222, 24, 5, 8), ell(324, 213, 16, 4, -4), ell(324, 220, 16, 4, 6)];
    const legF = [D.body([[192, 222.0], [190, 238], [182, 258], [194, 276], [188, 289]], [11.2, 14, 7, 4, 3.4], [8.8, 11, 6, 4, 3.4], 30), tube([[190, 289], [174, 291]], [3, 2])];
    const armF = [tube([[142, 226], [134, 238], [120, 244]], [3.5, 3, 2.5]), ell(126, 251, 12, 3, 66), ell(134, 252, 12, 3, 78)];
    const body = D.body([[114, 188], [118, 202], [132, 216], [156, 214], [186, 218], [214, 222], [250, 222], [290, 218], [330, 216]], [6, 6, 8, 13, 13, 10, 6, 5, 4], [6, 7, 12, 24, 18, 11, 6, 5, 4], 90);
    const neck = D.body([[138, 222], [122, 210], [116, 196], [114, 188]], [7, 6, 6, 6], [9, 7, 6, 6], 24);
    const head = shape([[64, 190], [76, 182], [98, 176], [116, 180], [122, 190], [110, 198], [86, 200], [70, 198]]);
    const legN = [D.body([[184, 222.0], [182, 238], [174, 258], [186, 276], [180, 290]], [12, 15, 7, 4, 3.6], [9.6, 12, 6, 4, 3.6], 30), tube([[182, 290], [164, 291]], [3.4, 2.2])];
    const armN = [tube([[134, 226], [126, 240], [110, 246]], [4, 3.5, 3]),
      ell(116, 254, 15, 3.4, 64), ell(124, 256, 16, 3.4, 74), ell(134, 254, 14, 3.2, 86)];

    // a bird-like display: it stays planted, lifts its head, spreads its
    // feathered arms out and up in three flutters and fans its tail
    const SHO = [134, 226];
    const anim = sceneAnim([
      { parts: ['dino-arm-far', 'dino-arm-near'], origin: `${SHO[0]}px ${SHO[1]}px`, timing: T,
        keyframes: '0%,100%{transform:rotate(0)}16%{transform:rotate(80deg)}26%{transform:rotate(62deg)}36%{transform:rotate(84deg)}46%{transform:rotate(64deg)}56%{transform:rotate(84deg)}76%{transform:rotate(10deg)}' },
      { parts: 'dino-head', origin: '118px 190px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}16%{transform:rotate(-9deg)}30%{transform:rotate(-4deg)}44%{transform:rotate(-10deg)}62%{transform:rotate(-3deg)}80%{transform:rotate(0)}' },
      { parts: 'dino-tail', origin: '292px 218px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}18%{transform:rotate(-9deg)}36%{transform:rotate(-5deg)}54%{transform:rotate(-10deg)}80%{transform:rotate(0)}' }
    ]);

    const feather = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="1.6" fill="${P.mid}" transform="rotate(${a} ${x} ${y})"/>`;
    const bodyMk =
      K.ground(190, 160, [[190, 290, 14], [204, 288, 12], [190, 292, 60, 5]], sc(o)) +
      K.part('dino-tail', tail, { clip: K.feathers({ x: 206, y: 208, w: 130, h: 20 }, 40, [P.light, P.deep], 3) + K.cs(212, 234, 14, 8) }) +
      K.part('dino-leg-far', legF, { tone: 'dark', transform: 'translate(12 -2)' }) +
      K.part('dino-arm-far', armF, { tone: 'dark' }) +
      K.part('dino-body', body, { belly: true,
        clip: K.feathers({ x: 124, y: 204, w: 90, h: 50 }, 90, [P.light, P.deep, P.mid], 5) + K.hl(160, 212, 26, 6) + K.cs(200, 244, 16, 10, 0.8) }) +
      K.part('dino-head', head, { belly: 0.6,
        clip: K.hl(96, 180, 18, 4) + K.cs(108, 198, 14, 4, 0.6),
        over: K.eye(108, 186, 2.4) +
          `<path d="M68 196 q22 3 42 0" fill="none" stroke="${P.deepest}" stroke-width="1" stroke-linecap="round"/>` +
          `<ellipse cx="72" cy="186" rx="1.8" ry="1" fill="#140d06" opacity="0.8"/>` +
          `<g fill="none" stroke="${P.deep}" stroke-width="1" stroke-linecap="round"><path d="M112 178 l4 -4"/><path d="M116 180 l5 -3"/><path d="M118 184 l5 -2"/></g>` }) +
      K.part('dino-leg-near', legN, { clip: K.hl(190, 240, 6, 8) + K.feathers({ x: 180, y: 228, w: 22, h: 18 }, 14, [P.light, P.deep], 13),
        over: K.claw(186, 283, 6, -1) + K.claw(165, 291, 3, -1) }) +
      K.part('dino-arm-near', armN, { clip: K.feathers({ x: 104, y: 240, w: 40, h: 22 }, 18, [P.light, P.deep], 17),
        over: K.claw(110, 247, 3, -1) }) +
      kid(o, 26, 1.2 * S);
    return wrap(K, anim, bodyMk);
  }
  META.vel = { s: 110, x0: 62, w: 276, build: buildVelociraptor };

  // ===================================================================
  // DIPLODOCUS — cracks its whip tail, a dust ring on the ground
  // ===================================================================
  const PAL_DIP = { light: '#a69d89', mid: '#827966', dark: '#685f4f', deep: '#4e483b', deepest: '#363229',
    belly: '#d4cbb6', claw: '#2a261e', eye: '#b98a3a' };

  function buildDiplodocus(o) {
    o = o || {};
    const S = 13.5, P = PAL_DIP, K = makeKit(P), T = '2.2s cubic-bezier(.45,0,.3,1)';
    const tail = D.body([[236, 210], [282, 214], [318, 222]], [16, 9, 5.5], [20, 10, 5.5], 30);
    const tip = D.body([[312, 221], [340, 230], [372, 238]], [5.5, 2.6, 0.4], [5.5, 2.6, 0.4], 30);
    const legF = [D.body([[236, 220.0], [238, 250], [238, 288]], [10.4, 13, 9], [9.6, 12, 9], 24), ell(239, 288, 11, 3.5),
      D.body([[180, 222.0], [178, 252], [180, 288]], [8.8, 11, 8], [8.8, 11, 8], 24), ell(181, 288, 10, 3)];
    const body = D.body([[142, 218], [176, 210], [212, 206], [244, 212], [262, 214]], [12, 18, 22, 16, 9], [20, 34, 36, 24, 12], 40);
    const neck = D.body([[168, 214], [124, 202], [82, 190], [46, 183], [24, 180]], [12, 8, 6, 4.6, 4.2], [18, 11, 7, 5.4, 4.6], 50);
    const head = shape([[0, 184], [6, 176], [18, 172], [30, 175], [31, 185], [16, 190], [4, 190]]);
    const legN = [D.body([[224, 216.0], [226, 250], [226, 290]], [12, 15, 10], [11.2, 14, 10], 24), ell(227, 290, 12, 3.5),
      D.body([[170, 218.0], [168, 250], [170, 290]], [10.4, 13, 9], [9.6, 12, 9], 24), ell(170, 290, 11, 3.5)];

    const O = [244, 214], H = [316, 222];
    const F = [[0, 0, 0], [18, -6, -16], [34, 7, 26], [42, 4, -14], [54, -2, 6], [66, 1, -2], [100, 0, 0]];
    const anim = sceneAnim([
      { parts: 'dino-tail', origin: `${O[0]}px ${O[1]}px`, timing: T, keyframes: kf(F, fr => `transform:rotate(${fr[1]}deg)`) },
      { parts: 'dino-tail-tip', origin: `${O[0]}px ${O[1]}px`, timing: T,
        keyframes: kf(F, fr => `transform:${hinge(`rotate(${fr[1]}deg)`, H, O, fr[2])}`) },
      { parts: ['dino-neck-back', 'dino-head'], origin: '160px 214px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}40%{transform:rotate(3deg)}70%{transform:rotate(-1deg)}' },
      { parts: 'fx-star', origin: '362px 226px', timing: T,
        keyframes: '0%,36%{opacity:0;transform:scale(.3) rotate(0)}42%{opacity:1;transform:scale(1.1) rotate(10deg)}56%{opacity:0;transform:scale(1.4) rotate(20deg)}100%{opacity:0}' },
      { parts: 'fx-dust', origin: '330px 288px', timing: T,
        keyframes: '0%,40%{opacity:0;transform:scale(.3)}50%{opacity:.9;transform:scale(1)}80%{opacity:0;transform:scale(1.8)}100%{opacity:0}' }
    ]);

    const bodyMk =
      K.ground(190, 182, [[239, 289, 11], [227, 290, 13], [181, 289, 10], [170, 290, 12], [200, 292, 70, 5]], sc(o)) +
      K.part('dino-tail-tip', tip, { belly: 0.4 }) +
      K.part('dino-tail', tail, { belly: 0.5 }) +
      K.part('dino-leg-far', legF, { tone: 'dark' }) +
      K.part('dino-neck-back', neck, { belly: 0.7, clip: K.hl(90, 188, 50, 4, 0.7) }) +
      K.part('dino-leg-under', legN, { clip: K.hl(166, 244, 5, 14) + K.hl(222, 244, 5, 14) }) +
      K.part('dino-body', body, { belly: true, clip: K.hl(196, 206, 34, 8) + K.cs(240, 240, 20, 12, 0.8) }) +
      K.part('dino-head', head, { belly: 0.5, over: K.eye(23, 177, 1.5) }) +
      kid(o, 40, 1.2 * S) +
      `<g data-part="fx-star" opacity="0">${star(362, 226, 13, 5, 6, '#fff3c8')}${star(362, 226, 7, 3, 6, '#ffffff')}</g>` +
      `<g data-part="fx-dust" opacity="0"><ellipse cx="330" cy="288" rx="26" ry="5" fill="none" stroke="#bfa77c" stroke-width="4" opacity="0.8"/></g>`;
    return wrap(K, anim, bodyMk);
  }
  META.dip = { s: 13.5, x0: -2, w: 372, build: buildDiplodocus };

  // ===================================================================
  // ALLOSAURUS — lunges, snaps twice, then shakes its head
  // ===================================================================
  const PAL_ALL = { light: '#a67b50', mid: '#805936', dark: '#644421', deep: '#4b321a', deepest: '#342210',
    belly: '#ddc5a0', claw: '#1f1810', eye: '#d9a034', horn: '#7a5234' };

  function buildAllosaurus(o) {
    o = o || {};
    const S = 36, P = PAL_ALL, K = makeKit(P), T = '2.4s cubic-bezier(.4,0,.3,1)';
    const tail = D.body([[200, 188], [250, 190], [304, 186], [356, 180], [374, 178]], [22, 14, 7, 2.5, 0.6], [28, 15, 7, 2.5, 0.6], 40);
    const leg = [D.body([[206, 186.0], [204, 206], [196, 234], [210, 262], [204, 280], [196, 290]], [21.6, 27, 15, 8, 6, 5], [17.6, 22, 12, 7, 6, 5], 40), tube([[200, 290], [176, 291]], [5.5, 3])];
    const arm = tube([[142, 206], [136, 222], [124, 230]], [5, 4, 3.5]);
    const body = D.body([[104, 180], [118, 188], [136, 196], [164, 196], [196, 192], [226, 190], [260, 190], [304, 186], [356, 180], [374, 178]], [10, 10, 13, 20, 24, 20, 14, 7, 2.5, 0.6], [11, 13, 20, 32, 30, 22, 15, 7, 2.5, 0.6], 90);
    const neck = D.body([[146, 196], [128, 192], [114, 184], [104, 178]], [12, 11, 10, 10], [16, 14, 12, 11], 30);
    const head = shape([[22, 180], [34, 172], [58, 166], [84, 162], [102, 166], [110, 178], [100, 188], [60, 190], [34, 190], [22, 188]]);
    const jaw = shape([[28, 190], [60, 192], [96, 188], [106, 192], [98, 202], [70, 204], [40, 200], [28, 196]]);

    const HP = [110, 180], HJ = [104, 190];
    // [%, slide x, head deg, jaw deg, mouth opacity]
    const F = [[0, 0, 0, 0, 0], [16, 4, 6, -14, 1], [30, -20, -2, -24, 1], [36, -20, -2, 0, 1], [44, -18, -2, -22, 1], [50, -18, -2, 0, 1],
      [58, -12, 6, 0, 0], [64, -12, -6, 0, 0], [70, -12, 6, 0, 0], [76, -10, -4, 0, 0], [90, -2, 0, 0, 0], [100, 0, 0, 0, 0]];
    const hb = fr => `translate(${fr[1]}px,0px) rotate(${fr[2]}deg)`;
    const anim = sceneAnim([
      { parts: ['shadow', 'dino-tail', 'dino-leg-far', 'dino-arm-far', 'dino-body', 'dino-neck', 'dino-leg-near', 'dino-arm-near'], timing: T,
        keyframes: kf(F, fr => `transform:translate(${fr[1]}px,0px)`) },
      { parts: 'dino-head', origin: `${HP[0]}px ${HP[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${hb(fr)}`) },
      { parts: 'dino-jaw', origin: `${HP[0]}px ${HP[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${hinge(hb(fr), HJ, HP, fr[3])}`) },
      { parts: 'fx-mouth', origin: `${HP[0]}px ${HP[1]}px`, timing: T, keyframes: kf(F, fr => `opacity:${fr[4]};transform:${hb(fr)}`) },
      { parts: 'human', timing: T,
        keyframes: '0%,22%{transform:translate(0,0)}30%{transform:translate(-4px,-7px)}38%{transform:translate(-8px,0)}80%{transform:translate(-8px,0)}100%{transform:translate(0,0)}' }
    ]);

    let teeth = '';
    for (let x = 32; x <= 100; x += 6) teeth += `<path d="M${x} ${f(189.5 - (x - 32) * 0.02)} l3 0 l-1.3 ${x < 60 ? 6.5 : 5} z"/>`;
    const fingers = K.claw(124, 230, 3.2, -1) + K.claw(126, 233, 3, -1) + K.claw(128, 230, 2.6, -1);

    const bodyMk =
      K.ground(190, 172, [[200, 291, 16], [220, 288, 14], [210, 292, 90, 6]], sc(o)) +
      K.part('dino-leg-far', leg, { tone: 'dark', transform: 'translate(16 -3)' }) +
      K.part('dino-arm-far', [arm], { tone: 'dark', transform: 'translate(8 -2)' }) +
      K.part('dino-body', body, { belly: true,
        clip: `<g fill="${P.deepest}" opacity="0.2"><path d="M160 176 q5 16 0 32 l-5 0 q4 -16 -1 -32z"/><path d="M180 177 q5 16 0 32 l-5 0 q4 -16 -1 -32z"/><path d="M200 180 q5 16 0 32 l-5 0 q4 -16 -1 -32z"/></g>` +
          K.hl(176, 186, 36, 8) + K.cs(212, 214, 22, 14, 0.8) }) +
      K.part('dino-leg-near', leg, { clip: K.hl(206, 220, 8, 14) + K.cs(220, 240, 6, 14, 0.6), over: K.claw(177, 291, 4, -1) }) +
      K.part('dino-arm-near', [arm], { over: fingers }) +
      K.part('dino-jaw', jaw, { colors: [P.mid, P.belly, P.belly],
        under: `<path d="M28 190 L104 186 L108 172 C80 172 50 178 30 186 Z" fill="#5c1d20"/><path d="M44 190 C66 186 88 184 100 182 C88 178 66 182 48 188 Z" fill="#a5464a"/>` }) +
      `<g data-part="fx-mouth" opacity="0"><g fill="#efe6cf" stroke="#b5a585" stroke-width="0.3">${teeth}</g></g>` +
      K.part('dino-head', head, {
        clip: K.hl(70, 168, 30, 5) + K.cs(100, 186, 14, 6, 0.6),
        over: K.horn([[84, 166], [88, 158], [92, 154]], [3.4, 2.2, 0.6]) + K.eye(94, 172, 2.5) +
          `<ellipse cx="30" cy="178" rx="2" ry="1.2" fill="#140d06" opacity="0.8"/>` }) +
      kid(o, 6, 1.2 * S);
    return wrap(K, anim, bodyMk);
  }
  META.all = { s: 36, x0: 20, w: 338, build: buildAllosaurus };

  // ===================================================================
  // IGUANODON — rears up on its back legs and shows its thumb spikes
  // ===================================================================
  const PAL_IGU = { light: '#909c6e', mid: '#6e7a52', dark: '#545f3d', deep: '#40492e', deepest: '#2c3220',
    belly: '#d1cea4', claw: '#2a2418', eye: '#c98a2a', horn: '#ece2c6' };

  function buildIguanodon(o) {
    o = o || {};
    const S = 32, P = PAL_IGU, K = makeKit(P), T = '2.4s ease-in-out';
    const tail = D.body([[222, 192], [270, 194], [316, 200], [360, 212]], [24, 15, 7, 1.4], [30, 16, 7, 1.2], 40);
    const leg = [D.body([[220, 182.0], [226, 210], [218, 240], [228, 266], [222, 290]], [21.6, 27, 13, 9, 9], [18.4, 23, 11, 8, 9], 36), ell(220, 290, 15, 4.5)];
    const arm = [D.body([[152, 214.0], [146, 236], [140, 262], [136, 288]], [8.8, 11, 7, 6], [8, 10, 7, 6], 30), ell(134, 288, 8, 3.5)];
    const body = D.body([[100, 172], [112, 178], [132, 190], [166, 196], [200, 190], [236, 192], [270, 194], [316, 200], [360, 212]], [9, 9, 12, 22, 30, 26, 15, 7, 1.4], [10, 12, 18, 34, 42, 30, 16, 7, 1.2], 90);
    const neck = D.body([[150, 196], [128, 186], [110, 176], [100, 172]], [12, 10, 9, 9], [16, 13, 11, 10], 30);
    const head = shape([[44, 178], [52, 166], [72, 158], [96, 156], [110, 166], [106, 180], [84, 184], [58, 186], [46, 186]]);
    const thumb = K.horn([[134, 283], [132, 279], [131, 276]], [2.2, 1.3, 0.2]);

    const HIP = [220, 204], SH = [150, 212];
    const F = [[0, 0, 0], [30, 20, 18], [44, 22, 24], [56, 20, 16], [70, 22, 24], [86, 6, 4], [100, 0, 0]];
    const anim = sceneAnim([
      { parts: ['dino-tail', 'dino-body', 'dino-neck', 'dino-head'], origin: `${HIP[0]}px ${HIP[1]}px`, timing: T,
        keyframes: kf(F, fr => `transform:rotate(${fr[1]}deg)`) },
      { parts: ['dino-arm-far', 'dino-arm-near'], origin: `${HIP[0]}px ${HIP[1]}px`, timing: T,
        keyframes: kf(F, fr => `transform:${hinge(`rotate(${fr[1]}deg)`, SH, HIP, fr[2])}`) },
      { parts: 'fx-spark', origin: '100px 200px', timing: T,
        keyframes: '0%,28%{opacity:0;transform:scale(.3)}36%{opacity:1;transform:scale(1.1)}48%{opacity:.4;transform:scale(.8)}56%{opacity:1;transform:scale(1.1)}70%,100%{opacity:0;transform:scale(.3)}' }
    ]);

    const bodyMk =
      K.ground(200, 170, [[212, 291, 15], [228, 288, 12], [134, 289, 9], [200, 292, 80, 6]], sc(o)) +
      K.part('dino-leg-far', leg, { tone: 'dark', transform: 'translate(16 -3)' }) +
      K.part('dino-arm-far', arm, { tone: 'dark', transform: 'translate(12 -2)', over: thumb }) +
      K.part('dino-body', body, { belly: true, clip: K.hl(184, 186, 38, 8) + K.cs(220, 226, 24, 14, 0.8) }) +
      K.part('dino-leg-near', leg, { clip: K.hl(218, 214, 8, 16) + K.cs(234, 232, 6, 16, 0.6) }) +
      K.part('dino-arm-near', arm, { clip: K.hl(144, 236, 4, 16), over: thumb }) +
      K.part('dino-head', head, { belly: 0.5,
        clip: K.hl(80, 162, 22, 4) + K.cs(100, 180, 14, 6, 0.6) +
          `<path d="M44 178 q4 -8 12 -10 l-2 18 z" fill="${P.deepest}" opacity="0.5"/>`,
        over: K.eye(94, 166, 2.4) + `<path d="M48 184 q22 2 42 -2" fill="none" stroke="${P.deepest}" stroke-width="1" opacity="0.7"/>` +
          `<ellipse cx="52" cy="172" rx="2" ry="1.2" fill="#140d06" opacity="0.8"/>` }) +
      kid(o, 8, 1.2 * S) +
      `<g data-part="fx-spark" opacity="0">${star(100, 200, 5, 1.6, 4, '#fff6ce')}</g>`;
    return wrap(K, anim, bodyMk);
  }
  META.igu = { s: 32, x0: 40, w: 320, build: buildIguanodon };

  // ===================================================================
  // PACHYCEPHALOSAURUS — a dome head-butt, with a star burst
  // ===================================================================
  const PAL_PAC = { light: '#b3935f', mid: '#8e6e41', dark: '#6d522e', deep: '#523c21', deepest: '#392816',
    belly: '#e2cda5', claw: '#1f1810', eye: '#d9a034' };

  function buildPachycephalosaurus(o) {
    o = o || {};
    const S = 66, P = PAL_PAC, K = makeKit(P), T = '2s cubic-bezier(.4,0,.3,1)';
    const tail = D.body([[190, 178], [240, 178], [296, 176], [352, 178], [370, 178]], [17, 11, 5, 2, 0.5], [22, 12, 5, 2, 0.5], 40);
    const leg = [D.body([[184, 176.0], [182, 196], [174, 226], [188, 256], [182, 278], [174, 290]], [20.8, 26, 14, 8, 6, 5], [17.6, 22, 11, 7, 6, 5], 40), tube([[178, 290], [156, 291]], [5.5, 3])];
    const arm = tube([[124, 196], [118, 210], [108, 214]], [4.5, 3.5, 3]);
    const body = D.body([[88, 156], [96, 166], [110, 180], [140, 186], [170, 182], [200, 180], [240, 178], [296, 176], [352, 178], [370, 178]], [9, 9, 10, 18, 22, 18, 11, 5, 2, 0.5], [10, 11, 15, 28, 28, 20, 12, 5, 2, 0.5], 90);
    const neck = D.body([[122, 184], [104, 174], [92, 162], [88, 156]], [10, 9, 9, 9], [14, 12, 11, 10], 30);
    const head = shape([[34, 166], [40, 152], [56, 138], [78, 128], [96, 132], [104, 146], [100, 162], [82, 172], [56, 176], [40, 174]]);
    let knobs = '';
    [[100, 150], [104, 158], [98, 166], [92, 136], [42, 160], [46, 152], [38, 168]].forEach(k => {
      knobs += `<circle cx="${k[0]}" cy="${k[1]}" r="2.4" fill="${P.deep}"/><circle cx="${k[0] - 0.6}" cy="${k[1] - 0.8}" r="1" fill="${P.light}" opacity="0.7"/>`;
    });

    const HIP = [190, 196], NK = [90, 162];
    const F = [[0, 0, 0, 0], [18, 6, 2, 8], [32, -22, -6, -34], [40, -22, -6, -34], [50, -16, -4, -20], [70, -4, -1, -4], [100, 0, 0, 0]];
    const bb = fr => `translate(${fr[1]}px,0px) rotate(${fr[2]}deg)`;
    const anim = sceneAnim([
      { parts: ['dino-tail', 'dino-arm-far', 'dino-body', 'dino-neck', 'dino-arm-near'], origin: `${HIP[0]}px ${HIP[1]}px`, timing: T,
        keyframes: kf(F, fr => `transform:${bb(fr)}`) },
      { parts: ['shadow', 'dino-leg-far', 'dino-leg-near'], timing: T, keyframes: kf(F, fr => `transform:translate(${fr[1]}px,0px)`) },
      { parts: 'dino-head', origin: `${HIP[0]}px ${HIP[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${hinge(bb(fr), NK, HIP, fr[3])}`) },
      { parts: 'fx-star', origin: '30px 132px', timing: T,
        keyframes: '0%,30%{opacity:0;transform:scale(.2) rotate(0)}36%{opacity:1;transform:scale(1.15) rotate(12deg)}52%{opacity:0;transform:scale(1.5) rotate(30deg)}100%{opacity:0}' }
    ]);

    const bodyMk =
      K.ground(190, 160, [[184, 291, 14], [198, 288, 12], [190, 292, 70, 6]], sc(o)) +
      K.part('dino-leg-far', leg, { tone: 'dark', transform: 'translate(14 -3)' }) +
      K.part('dino-arm-far', [arm], { tone: 'dark', transform: 'translate(8 -2)' }) +
      K.part('dino-body', body, { belly: true, clip: K.hl(156, 172, 32, 8) + K.cs(196, 204, 18, 12, 0.8) }) +
      K.part('dino-leg-near', leg, { clip: K.hl(184, 206, 7, 12), over: K.claw(157, 291, 4, -1) }) +
      K.part('dino-arm-near', [arm], { over: K.claw(108, 214, 2.6, -1) }) +
      K.part('dino-head', head, { belly: 0.45,
        clip: `<ellipse cx="80" cy="140" rx="26" ry="16" fill="#e6d3a8" opacity="0.5"/>` + K.hl(76, 134, 16, 7, 0.9) + K.cs(96, 168, 14, 8, 0.6),
        over: knobs + K.eye(64, 156, 2.4) + `<path d="M38 170 q16 4 32 2" fill="none" stroke="${P.deepest}" stroke-width="1" opacity="0.7"/>` }) +
      kid(o, 10, 1.2 * S) +
      `<g data-part="fx-star" opacity="0">${star(30, 132, 16, 6, 8, '#fff1b8')}${star(30, 132, 8, 3.5, 8, '#ffffff')}</g>`;
    return wrap(K, anim, bodyMk);
  }
  META.pac = { s: 66, x0: 30, w: 324, build: buildPachycephalosaurus };

  // ===================================================================
  // PTERANODON (a flying reptile) — one big flap, then a long glide
  // ===================================================================
  const PAL_PTE = { light: '#cdc3ad', mid: '#a69a80', dark: '#80735c', deep: '#5f5444', deepest: '#41392d',
    belly: '#ede5d2', claw: '#2a2418', eye: '#d9a034' };

  function buildPteranodon(o) {
    o = o || {};
    const S = 48, P = PAL_PTE, K = makeKit(P), T = '2.4s ease-in-out';
    const MEM = ['#cc9d6e', '#9c6c43', '#6b4327'];
    const wingF = shape([[202, 120], [240, 100], [290, 88], [330, 84], [364, 94], [322, 108], [272, 124], [228, 140], [206, 146]]);
    const bodyS = [tube([[176, 122], [196, 134], [214, 152]], [9, 8, 4]), tube([[208, 146], [222, 160]], [2.5, 2])];
    const wingN = shape([[180, 120], [140, 106], [92, 102], [50, 110], [16, 126], [58, 130], [108, 140], [158, 150], [196, 152]]);
    const headS = [tube([[184, 120], [172, 96]], [6, 4]), shape([[96, 92], [140, 82], [164, 78], [176, 84], [168, 94], [132, 94]]),
      shape([[162, 80], [188, 62], [220, 50], [200, 72], [176, 88]])];

    // [%, x, y, wing deg]  near wing: - = downstroke; far wing mirrors it
    const F = [[0, 0, 0, 0], [12, 0, -2, 16], [28, -4, -16, -24], [40, -8, -20, 4], [52, -14, -22, 0], [76, -8, -12, -2], [100, 0, 0, 0]];
    const mv = fr => `translate(${fr[1]}px,${fr[2]}px)`;
    const anim = sceneAnim([
      { parts: ['dino-body', 'dino-head'], timing: T, keyframes: kf(F, fr => `transform:${mv(fr)}`) },
      { parts: 'dino-wing-near', origin: '180px 122px', timing: T, keyframes: kf(F, fr => `transform:${mv(fr)} rotate(${fr[3]}deg)`) },
      { parts: 'dino-wing-far', origin: '202px 122px', timing: T, keyframes: kf(F, fr => `transform:${mv(fr)} rotate(${-fr[3] * 0.8}deg)`) },
      { parts: 'shadow', origin: '190px 288px', timing: T, keyframes: kf(F, fr => `transform:translate(${fr[1]}px,0) scale(${(1 + fr[2] / 80).toFixed(2)})`) },
      { parts: 'fx-ring', timing: T,
        keyframes: '0%,22%{opacity:0;transform:translateX(0)}32%{opacity:.9;transform:translateX(6px)}54%{opacity:0;transform:translateX(24px)}100%{opacity:0}' }
    ]);

    const bodyMk =
      (sc(o) ? K.ground(190, 160, [[190, 288, 70, 6]], true) : '') +
      K.part('dino-wing-far', wingF, { colors: [MEM[1], MEM[2], '#45281a'], texture: false,
        clip: `<path d="M206 122 L330 86" stroke="${P.deep}" stroke-width="2.4" opacity="0.6"/>` }) +
      K.part('dino-body', bodyS, { belly: true }) +
      K.part('dino-wing-near', wingN, { colors: MEM, texture: false,
        clip: `<path d="M180 120 Q130 104 92 103 L18 126" fill="none" stroke="${P.mid}" stroke-width="3" opacity="0.8"/>` +
          `<path d="M60 128 Q120 132 180 150" fill="none" stroke="#3e2414" stroke-width="1" opacity="0.4"/>` + K.cs(170, 146, 30, 8, 0.6) }) +
      K.part('dino-head', headS, { belly: 0.4,
        clip: `<path d="M162 80 L190 64 L214 54 L196 72 Z" fill="#c45a3a" opacity="0.85"/>` + K.hl(140, 84, 24, 3),
        over: K.eye(164, 85, 1.9) + `<path d="M100 92 q34 -4 64 -6" fill="none" stroke="${P.deepest}" stroke-width="0.9" opacity="0.6"/>` }) +
      kid(o, 40, 1.2 * S) +
      `<g data-part="fx-ring" opacity="0" fill="none" stroke="#fff8e6" stroke-linecap="round" stroke-width="1.6">
        <path d="M230 160 q20 4 40 0"/><path d="M240 172 q18 3 36 0"/><path d="M260 70 q16 -2 32 0"/></g>`;
    return wrap(K, anim, bodyMk);
  }
  META.pte = { s: 48, x0: 14, w: 352, top: 48, bottom: 160, build: buildPteranodon };

  // ===================================================================
  // PLESIOSAURUS (a sea reptile) — strokes its flippers and dives
  // ===================================================================
  const PAL_PLE = { light: '#8199a2', mid: '#617984', dark: '#4b606a', deep: '#384a51', deepest: '#26343a',
    belly: '#d5dbd4', claw: '#2a2418', eye: '#d9a034' };

  function buildPlesiosaurus(o) {
    o = o || {};
    const S = 80, P = PAL_PLE, K = makeKit(P, { grain: 0.7, bump: 0.8 }), T = '2.4s ease-in-out';
    const flipFar = [shape([[222, 196], [212, 178], [198, 166], [194, 160], [206, 164], [222, 178], [234, 192]]),
      shape([[290, 196], [282, 180], [272, 168], [270, 162], [280, 166], [292, 180], [300, 192]])];
    const tail = D.body([[300, 204], [330, 208], [356, 212]], [12, 6, 1], [14, 7, 1], 24);
    const body = D.body([[212, 200], [240, 198], [270, 200], [300, 204], [314, 206]], [12, 18, 18, 12, 6], [14, 24, 24, 15, 7], 40);
    const neck = D.body([[222, 200], [184, 192], [148, 184], [120, 178], [102, 176]], [11, 9, 7, 6, 5.5], [14, 11, 8, 7, 6], 40);
    const head = shape([[64, 178], [74, 170], [92, 166], [106, 170], [108, 180], [92, 186], [72, 186]]);
    const flipH = shape([[296, 208], [284, 226], [270, 244], [264, 252], [278, 250], [296, 232], [308, 214]]);
    const flipN = shape([[230, 208], [214, 226], [196, 246], [188, 256], [204, 252], [226, 234], [242, 216]]);

    const O = [260, 204];
    const F = [[0, 0, 0, 0, 0], [16, 4, -2, 2, -18], [34, -26, 14, -9, 24], [50, -42, 24, -11, -18], [64, -46, 28, -11, 20], [80, -24, 14, -6, 0], [100, 0, 0, 0, 0]];
    const bm = fr => `translate(${fr[1]}px,${fr[2]}px) rotate(${fr[3]}deg)`;
    const anim = sceneAnim([
      { parts: ['dino-flipper-far', 'dino-tail', 'dino-body', 'dino-neck', 'dino-head'], origin: `${O[0]}px ${O[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${bm(fr)}`) },
      { parts: 'dino-flipper-hind', origin: `${O[0]}px ${O[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${hinge(bm(fr), [298, 210], O, fr[4] * 0.8)}`) },
      { parts: 'dino-flipper-near', origin: `${O[0]}px ${O[1]}px`, timing: T, keyframes: kf(F, fr => `transform:${hinge(bm(fr), [232, 210], O, fr[4])}`) },
      { parts: 'fx-bubbles', timing: T,
        keyframes: '0%,30%{opacity:0;transform:translate(0,0)}40%{opacity:1;transform:translate(-30px,10px)}100%{opacity:0;transform:translate(-40px,-60px)}' }
    ]);

    const water = sc(o) ? `<g data-part="dino-water">
        <defs><linearGradient id="${K.id('sea')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6cc3d4"/><stop offset="0.5" stop-color="#2f8fae"/><stop offset="1" stop-color="#16607e"/></linearGradient></defs>
        <path d="M40 104 Q120 96 200 104 T375 102 L375 292 L40 292 Z" fill="url(#${K.id('sea')})"/>
        <path d="M40 104 Q120 96 200 104 T375 102" fill="none" stroke="#e8fbff" stroke-width="2.5" opacity="0.8"/>
        <g fill="#ffffff" opacity="0.12"><path d="M120 104 l40 0 l60 188 l-40 0 z"/><path d="M260 102 l30 0 l50 190 l-30 0 z"/></g>
        <path d="M40 284 Q200 272 375 282 L375 292 L40 292 Z" fill="#cdb98a"/>
        <path d="M-5 150 Q40 160 70 220 Q86 260 96 292 L-5 292 Z" fill="#e2cf9e"/>
        <path d="M-5 150 Q40 160 70 220" fill="none" stroke="#f6ead0" stroke-width="2" opacity="0.7"/>
      </g>` : '';
    const bub = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#eaffff" stroke-width="1"/>`;
    const bodyMk = water +
      K.part('dino-flipper-far', flipFar, { tone: 'dark' }) +
      K.part('dino-tail', tail, { belly: 0.5 }) +
      K.part('dino-body', body, { belly: true, clip: K.hl(246, 190, 34, 8) + K.cs(276, 220, 30, 8, 0.7) }) +
      K.part('dino-neck', neck, { belly: 0.8, clip: K.hl(150, 180, 40, 3, 0.8) }) +
      K.part('dino-head', head, { belly: 0.6,
        over: K.eye(94, 172, 2.2) + `<path d="M68 182 q18 2 36 -2" fill="none" stroke="#efe6cf" stroke-width="1.2" stroke-dasharray="1.2 1.6"/>` }) +
      K.part('dino-flipper-hind', flipH, { clip: K.hl(290, 222, 6, 10) }) +
      K.part('dino-flipper-near', flipN, { clip: K.hl(222, 222, 6, 10) }) +
      (o.child === false ? '' : `<g data-part="human">${child(20, 1.2 * S, 158)}</g>`) +
      `<g data-part="fx-bubbles" opacity="0">${bub(90, 168, 3)}${bub(80, 158, 2)}${bub(96, 150, 2.5)}${bub(84, 140, 1.6)}</g>`;
    return wrap(K, anim, bodyMk);
  }
  META.ple = { s: 80, x0: 62, w: 292, top: 158, bottom: 258, build: buildPlesiosaurus };

  window.buildTriceratops = buildTriceratops;
  window.buildBrachiosaurus = buildBrachiosaurus;
  window.buildStegosaurus = buildStegosaurus;
  window.buildVelociraptor = buildVelociraptor;
  window.buildDiplodocus = buildDiplodocus;
  window.buildAllosaurus = buildAllosaurus;
  window.buildIguanodon = buildIguanodon;
  window.buildPachycephalosaurus = buildPachycephalosaurus;
  window.buildPteranodon = buildPteranodon;
  window.buildPlesiosaurus = buildPlesiosaurus;
})();
