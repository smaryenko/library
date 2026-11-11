// Dinosaurs — layered pseudo-3D builders (the reindeer / reef way).
//
// T. rex in a THREE-QUARTER view, head turned toward the child at the front
// left. Depth comes from the stack: each body part is its own flat data-part
// layer with an OBJ_DEPTH (pseudo3d-object.js). The tail and far leg recede
// behind the body, and the neck, near leg, arms, jaw and head come forward.
// The child stands closest, so a tilt makes the parts slide past each other
// (parallax).
// Volume on every part: a radial gradient (highlight top-left, darker
// lower-right rim), countershading, soft contact shadows at joins and a light
// scaly texture filter.
//
// Flat data-parts only (never nested), one sceneAnim() per scene, placement
// never on an animated element. Scale: ~35 px per metre; ground y = 292, so
// the 1.2 m child is ~43 px tall next to ~3.3 m hips.

(function () {
  'use strict';

  const GROUND = 292;

  // ---- outlines (viewBox units) --------------------------------------------
  // Proportions (3/4 view, ~35 px/m): a long, fairly shallow torso, deepest at
  // the chest and narrowing to the hips. The tail starts thick at the hips
  // and tapers off in a gentle curve. The legs sit under the HIPS, each with a
  // heavy drumstick thigh, a slender shin, a long metatarsus and three toes.
  const TAIL =
    'M214 136 C252 130 296 106 340 92 C346 90 348 94 343 97 ' +
    'C300 122 268 150 244 182 C232 178 220 160 214 136 Z';
  const BODY =
    'M140 132 C165 124 200 128 232 140 C246 146 252 158 248 170 ' +
    'C242 182 228 188 210 192 C192 198 176 206 158 208 ' +
    'C142 209 130 202 126 190 C122 176 126 156 132 144 C134 138 136 134 140 132 Z';
  const NECK =
    'M128 104 C138 100 150 112 156 130 C160 146 150 160 138 166 ' +
    'C130 168 126 160 126 150 C126 138 128 126 132 120 C128 112 126 108 128 104 Z';
  const LEG_NEAR =
    // a heavy, pillar-like hind leg: thick thigh, thick shin and a short stout
    // foot with three broad toes (no slim "ankle" or curvy calf)
    'M178 164 C204 158 224 172 224 196 C224 214 218 226 212 234 ' +
    'C214 248 214 262 210 276 C216 282 222 288 216 293 ' +
    'L198 293 C194 295 184 295 178 293 L160 293 ' +
    'C154 292 154 287 160 285 C170 282 178 278 182 272 ' +
    'C184 262 182 252 178 244 C168 236 160 222 160 204 ' +
    'C160 184 166 168 178 164 Z';
  // far leg: the same leg a step behind and further away (drawn offset)
  const LEG_FAR = LEG_NEAR;
  const FAR_OFFSET = 'translate(34 -4)';
  // far-side cheek (jaw muscle) peeking out behind the skull
  const CHEEK_FAR =
    'M126 98 C138 95 147 104 147 117 C147 128 141 134 134 136 L128 120 Z';
  const HEAD =
    'M128 98 C118 96 100 102 86 112 C74 120 64 126 58 134 ' +
    'C54 139 55 145 60 147 C76 148 96 146 116 142 ' +
    'C126 140 134 134 136 124 C138 112 136 102 128 98 Z';
  const JAW =
    'M60 147 C76 149 96 147 116 142 C126 140 132 140 134 146 ' +
    'C132 156 120 162 100 162 C84 162 70 158 62 153 C58 151 57 148 60 147 Z';

  // ---- helpers ---------------------------------------------------------------
  function sceneAnim(tracks) {
    if (typeof buildAnim !== 'function') return '';
    return buildAnim('d' + Math.random().toString(36).slice(2, 8), { tracks });
  }

  // a radial "volume" gradient: highlight top-left, rim lower-right
  function volume(id, light, mid, deep, cx, cy) {
    return `<radialGradient id="${id}" cx="${cx || '36%'}" cy="${cy || '30%'}" r="78%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </radialGradient>`;
  }

  // small pale scales along a lip line from (x0,y0) to (x1,y1)
  function lipScales(x0, y0, x1, y1, n, col) {
    let out = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const r = 1.1 + 0.9 * t;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 1.4).toFixed(2)}" ry="${r.toFixed(2)}" fill="${col}" opacity="0.7"/>`;
    }
    return out;
  }

  // a row of low scutes along a cubic (p0..p3), shrinking from s0 to s1
  function scutes(p0, p1, p2, p3, n, s0, s1, dark, light) {
    let out = '';
    for (let i = 1; i < n; i++) {
      const t = i / n, u = 1 - t;
      const x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0];
      const y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1];
      const s = s0 + (s1 - s0) * t;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${(y + 0.8).toFixed(1)}" rx="${(s * 1.3).toFixed(2)}" ry="${(s * 0.85).toFixed(2)}" fill="${dark}"/>` +
             `<ellipse cx="${(x - s * 0.3).toFixed(1)}" cy="${(y + 0.1).toFixed(1)}" rx="${(s * 0.7).toFixed(2)}" ry="${(s * 0.35).toFixed(2)}" fill="${light}" opacity="0.55"/>`;
    }
    return out;
  }

  // the 1.2 m child, feet at (x, GROUND), looking right at the T. rex
  function child(x) {
    return `<g transform="translate(${x} ${GROUND})">
      <ellipse cx="2" cy="0.5" rx="10" ry="2" fill="rgba(30,20,10,0.28)"/>
      <g transform="scale(1.3)">
        <circle cx="0.6" cy="-29.6" r="3.6" fill="#2f3640"/>
        <path d="M-2.2 -26 L2.2 -26 C4.6 -25.6 5.4 -23.6 5.6 -20 L6.6 -13.5 L5 -13.2
                 L4 -18.5 L3.8 -12 L3.4 -0.2 L0.8 -0.2 L0.4 -10 L-0.4 -10 L-0.8 -0.2
                 L-3.4 -0.2 L-3.8 -12 L-4 -18.5 L-5 -13.2 L-6.6 -13.5 L-5.6 -20
                 C-5.4 -23.6 -4.6 -25.6 -2.2 -26 Z" fill="#2f3640"/>
      </g>
    </g>`;
  }

  // ---- theropod (cfg = colours + pattern, separate fields) ------------------
  function buildTheropod(cfg) {
    const P = cfg.palette;
    const uid = 'rx' + Math.random().toString(36).slice(2, 7);
    const id = n => `${uid}-${n}`;
    const url = n => `url(#${id(n)})`;

    // ---- roar: head rears, then lunges at the viewer with the jaw open ----
    // Head, mouth and jaw each carry the full head motion about the neck
    // pivot HP; the jaw adds its hinge rotation about HJ in the SAME transform
    // list (one element, one track). + angle = head up, - jaw = open.
    const HP = [132, 122], HJ = [128, 142];
    const jx = HJ[0] - HP[0], jy = HJ[1] - HP[1];
    const F = [ // [%, tx, ty, angle, scale, jaw, mouthOpacity]
      [0, 0, 0, 0, 1, 0, 0], [14, 2, -4, 12, 1, -8, 1], [30, -6, 5, -7, 1.08, -30, 1],
      [42, -4, 4, -4, 1.07, -26, 1], [54, -7, 6, -8, 1.09, -32, 1], [70, -5, 5, -5, 1.07, -28, 1],
      [86, 0, 0, 2, 1, -5, 1], [100, 0, 0, 0, 1, 0, 0]
    ];
    const head = (tx, ty, a, s) => `translate(${tx}px,${ty}px) rotate(${a}deg) scale(${s})`;
    const headKF = F.map(f => `${f[0]}%{transform:${head(f[1], f[2], f[3], f[4])}}`).join('');
    const jawKF = F.map(f => `${f[0]}%{transform:${head(f[1], f[2], f[3], f[4])} translate(${jx}px,${jy}px) rotate(${f[5]}deg) translate(${-jx}px,${-jy}px)}`).join('');
    const mouthKF = F.map(f => `${f[0]}%{opacity:${f[6]};transform:${head(f[1], f[2], f[3], f[4])}}`).join('');
    const neckKF = F.map(f => `${f[0]}%{transform:translate(${(f[1] * 0.5).toFixed(1)}px,${(f[2] * 0.5).toFixed(1)}px) rotate(${(f[3] * 0.35).toFixed(1)}deg)}`).join('');
    const T = '2.4s cubic-bezier(.45,0,.35,1)';
    const origin = `${HP[0]}px ${HP[1]}px`;

    const anim = sceneAnim([
      { parts: 'dino-head', origin, timing: T, keyframes: headKF },
      { parts: 'dino-jaw', origin, timing: T, keyframes: jawKF },
      { parts: 'fx-mouth', origin, timing: T, keyframes: mouthKF },
      { parts: 'dino-neck', origin: '156px 150px', timing: T, keyframes: neckKF },
      { parts: 'dino-tail', origin: '226px 136px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}20%{transform:rotate(-4deg)}45%{transform:rotate(3deg)}70%{transform:rotate(-2deg)}' },
      { parts: 'dino-arm-near', origin: '132px 190px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}30%{transform:rotate(16deg)}45%{transform:rotate(4deg)}60%{transform:rotate(18deg)}80%{transform:rotate(0)}' },
      { parts: 'dino-arm-far', origin: '146px 194px', timing: T,
        keyframes: '0%,100%{transform:rotate(0)}32%{transform:rotate(12deg)}48%{transform:rotate(2deg)}62%{transform:rotate(14deg)}82%{transform:rotate(0)}' },
      { parts: 'fx-breath', timing: T,
        keyframes: '0%,26%{opacity:0;transform:translateX(0)}36%{opacity:.95;transform:translateX(-3px)}72%{opacity:.7;transform:translateX(-12px)}88%,100%{opacity:0;transform:translateX(-15px)}' },
      { parts: 'human', timing: T,
        keyframes: '0%,24%{transform:translate(0,0)}32%{transform:translate(-5px,-8px)}40%{transform:translate(-11px,0)}78%{transform:translate(-11px,0)}100%{transform:translate(0,0)}' }
    ]);

    // a volume fill + the scaly texture, then optional overlays
    const skinned = (d, grad) =>
      `<g filter="${url('skin')}"><path d="${d}" fill="${url(grad)}"/></g>`;

    return `<svg viewBox="-5 -5 380 310" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- light scaly texture: fine noise lit as a bump map, multiplied on -->
        <filter id="${id('skin')}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b"/>
          <feOffset in="b" dx="-3" dy="-3" result="bl"/>
          <feColorMatrix in="bl" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="L"/>
          <feOffset in="b" dx="3" dy="3" result="bd"/>
          <feColorMatrix in="bd" type="matrix" values="0 0 0 -1 1  0 0 0 -1 1  0 0 0 -1 1  0 0 0 0 1" result="rim"/>
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="11" result="n"/>
          <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="grain"/>
          <feComposite in="SourceGraphic" in2="L" operator="arithmetic" k1="0.62" k2="0.5" result="shaded"/>
          <feComposite in="shaded" in2="grain" operator="arithmetic" k1="0.5" k2="0.75" result="lit"/>
          <feComposite in="rim" in2="SourceAlpha" operator="in" result="rim2"/>
          <feComposite in="lit" in2="rim2" operator="arithmetic" k2="1" k3="0.14" result="sum"/>
          <feComposite in="sum" in2="SourceGraphic" operator="in"/>
        </filter>
        <filter id="${id('blur')}" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="${id('mist')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>

        ${volume(id('body'), P.light, P.mid, P.deep, '34%', '26%')}
        ${volume(id('tail'), P.mid, P.dark, P.deepest, '30%', '30%')}
        ${volume(id('neck'), P.light, P.mid, P.deep, '30%', '24%')}
        ${volume(id('head'), P.light, P.mid, P.deep, '40%', '26%')}
        ${volume(id('cheek'), P.mid, P.dark, P.deepest)}
        ${volume(id('legN'), P.mid, P.dark, P.deep, '42%', '30%')}
        ${volume(id('legF'), P.dark, P.deep, P.deepest, '42%', '30%')}
        <!-- countershading: pale belly / throat / jaw underneath -->
        <linearGradient id="${id('belly')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${P.belly}" stop-opacity="0"/>
          <stop offset="55%" stop-color="${P.belly}" stop-opacity="0"/>
          <stop offset="100%" stop-color="${P.belly}" stop-opacity="0.85"/>
        </linearGradient>
        <linearGradient id="${id('jaw')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${P.mid}"/>
          <stop offset="100%" stop-color="${P.belly}"/>
        </linearGradient>
        <!-- soft contact shadow for joins -->
        <radialGradient id="${id('cs')}">
          <stop offset="0%" stop-color="#140d06" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#140d06" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${id('hl')}">
          <stop offset="0%" stop-color="#fff4dc" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#fff4dc" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${id('eye')}" cx="40%" cy="38%">
          <stop offset="0%" stop-color="#f7d57e"/>
          <stop offset="70%" stop-color="${P.eye}"/>
          <stop offset="100%" stop-color="#5a3510"/>
        </radialGradient>
        <radialGradient id="${id('dirt')}">
          <stop offset="0%" stop-color="#8f7650" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#8f7650" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="${id('cBody')}"><path d="${BODY}"/></clipPath>
        <clipPath id="${id('cNeck')}"><path d="${NECK}"/></clipPath>
        <clipPath id="${id('cHead')}"><path d="${HEAD}"/></clipPath>
        <clipPath id="${id('cLegN')}"><path d="${LEG_NEAR}"/></clipPath>
        <clipPath id="${id('cTail')}"><path d="${TAIL}"/></clipPath>
      </defs>
      ${anim}

      ${cfg.scenery === false ? '' : `<g data-part="dino-ground">
        <ellipse cx="180" cy="${GROUND + 2}" rx="175" ry="18" fill="${url('dirt')}"/>
      </g>`}
      <g data-part="shadow">
        <ellipse cx="220" cy="${GROUND - 2}" rx="105" ry="8" fill="rgba(35,22,8,0.32)" filter="${url('blur')}"/>
        <ellipse cx="178" cy="${GROUND}" rx="28" ry="4" fill="rgba(35,22,8,0.45)" filter="${url('blur')}"/>
        <ellipse cx="212" cy="${GROUND - 4}" rx="24" ry="3.5" fill="rgba(35,22,8,0.4)" filter="${url('blur')}"/>
      </g>

      <!-- tail, receding back and up to the right -->
      <g data-part="dino-tail">
        ${skinned(TAIL, 'tail')}
        <g clip-path="${url('cTail')}">
          <path d="M236 168 C266 140 300 116 342 95" fill="none" stroke="${P.belly}" stroke-width="6" stroke-opacity="0.25"/>
          <ellipse cx="226" cy="150" rx="22" ry="20" fill="${url('cs')}"/>
        </g>
        ${scutes([214, 136], [252, 130], [296, 106], [340, 92], 14, 2.0, 0.6, P.deepest, P.light)}
      </g>

      <!-- far leg, behind the body and in shade -->
      <g data-part="dino-leg-far">
        <g transform="${FAR_OFFSET}">
          ${skinned(LEG_FAR, 'legF')}
          <ellipse cx="192" cy="172" rx="24" ry="10" fill="${url('cs')}"/>
          <g fill="${P.claw}"><path d="M157 292 l-5 1 3 -5 z"/><path d="M186 294 l-2 4 -3 -4 z"/><path d="M216 292 l5 1 -3 -5 z"/></g>
        </g>
      </g>

      <!-- far arm, mostly hidden by the chest -->
      <g data-part="dino-arm-far">
        <path d="M146 194 L148 207 L139 212" fill="none" stroke="${P.dark}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M139 212 l-4 2 M139 211 l-4 -1" stroke="${P.claw}" stroke-width="1.2" stroke-linecap="round"/>
      </g>

      <!-- torso -->
      <g data-part="dino-body">
        ${skinned(BODY, 'body')}
        <g clip-path="${url('cBody')}">
          <path d="${BODY}" fill="${url('belly')}"/>
          ${cfg.bands ? `<g fill="${P.deepest}" opacity="0.2">
            <path d="M166 124 q6 18 0 36 l-6 0 q5 -18 -1 -36 z"/>
            <path d="M186 126 q6 18 0 36 l-6 0 q5 -18 -1 -36 z"/>
            <path d="M206 130 q6 16 0 32 l-6 0 q5 -16 -1 -32 z"/>
            <path d="M226 138 q5 14 0 28 l-5 0 q4 -14 -1 -28 z"/></g>` : ''}
          <ellipse cx="176" cy="140" rx="38" ry="10" fill="${url('hl')}"/>
          <!-- rim shade lower-right + contact shadow where the near thigh sits -->
          <ellipse cx="236" cy="182" rx="26" ry="14" fill="${url('cs')}" opacity="0.8"/>
          <ellipse cx="196" cy="182" rx="30" ry="14" fill="${url('cs')}" opacity="0.9"/>
          <!-- belly scale rows -->
          <g fill="none" stroke="${P.belly}" stroke-opacity="0.45" stroke-width="0.7">
            <path d="M134 194 q30 12 64 4"/><path d="M142 201 q24 8 50 2"/>
          </g>
        </g>
        ${scutes([140, 132], [165, 124], [200, 128], [232, 140], 10, 2.2, 1.9, P.deepest, P.light)}
      </g>

      <!-- neck, curving forward to the head -->
      <g data-part="dino-neck">
        ${skinned(NECK, 'neck')}
        <g clip-path="${url('cNeck')}">
          <path d="${NECK}" fill="${url('belly')}" opacity="0.8"/>
          <ellipse cx="152" cy="156" rx="12" ry="10" fill="${url('cs')}"/>
          <g fill="none" stroke="#2a1d10" stroke-opacity="0.3" stroke-width="0.8" stroke-linecap="round">
            <path d="M129 148 q6 2 10 8"/><path d="M131 139 q7 2 12 9"/><path d="M134 131 q7 3 12 10"/>
          </g>
        </g>
        ${scutes([128, 104], [138, 100], [150, 112], [156, 130], 5, 1.6, 2.1, P.deepest, P.light)}
      </g>

      <!-- near leg: big thigh toward the viewer, toes on the ground -->
      <g data-part="dino-leg-near">
        ${skinned(LEG_NEAR, 'legN')}
        <g clip-path="${url('cLegN')}">
          <!-- matte, wrinkled skin: shade at the knee and down the back of the leg -->
          <ellipse cx="216" cy="210" rx="12" ry="26" fill="${url('cs')}" opacity="0.8"/>
          <ellipse cx="190" cy="166" rx="28" ry="8" fill="${url('cs')}" opacity="0.7"/>
          <ellipse cx="178" cy="250" rx="10" ry="22" fill="${url('cs')}" opacity="0.5"/>
          <g fill="none" stroke="#1a1209" stroke-opacity="0.4" stroke-width="0.8" stroke-linecap="round">
            <path d="M200 228 q8 3 14 0"/><path d="M198 234 q8 3 15 0"/><path d="M200 240 q6 2 12 0"/>
            <path d="M186 258 l22 1"/><path d="M185 264 l24 1"/><path d="M185 270 l24 0.6"/><path d="M186 276 l22 0"/>
            <path d="M166 290 l2 -5"/><path d="M190 291 l0 -5"/><path d="M206 291 l-1 -5"/>
            <path d="M170 196 q6 8 4 18"/><path d="M182 190 q6 8 4 18"/><path d="M196 188 q6 8 4 18"/>
          </g>
        </g>
        <g fill="${P.claw}">
          <path d="M157 292 l-6 1 3 -6 z"/><path d="M186 294 l-2 5 -3 -5 z"/><path d="M216 292 l6 1 -3 -6 z"/>
        </g>
      </g>

      <!-- near arm: tiny, two clawed fingers -->
      <g data-part="dino-arm-near">
        <path d="M132 190 L129 204 L119 209" fill="none" stroke="${url('legN')}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M132 190 L129 204 L119 209" fill="none" stroke="${P.mid}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        <path d="M131 192 L129 201" stroke="#fff4dc" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M119 209 l-5 3 M119 208 l-5 -1" stroke="${P.claw}" stroke-width="1.4" stroke-linecap="round"/>
      </g>

      <!-- inside of the mouth + upper teeth (only while roaring) -->
      <!-- upper teeth: shown only while roaring, sit above the jaw layer -->
      <g data-part="fx-mouth" opacity="0">
        <g fill="#efe6cf" stroke="#b5a585" stroke-width="0.3">
          ${[64, 70, 76, 82, 88, 94, 100, 106, 112, 118].map((x, i) => {
            const y = 147 - i * 0.55, l = i < 4 ? 8 : 6;
            return `<path d="M${x} ${y.toFixed(1)} l3.4 0 l-1.4 ${l} z"/>`;
          }).join('')}
        </g>
      </g>

      <!-- lower jaw (pale underneath) -->
      <g data-part="dino-jaw">
        <!-- inside of the mouth rides ON the jaw, rising above its lip line.
             At rest the skull (a higher layer) covers it; as the jaw drops it
             fills the gap exactly, never poking out below the jaw. -->
        <path d="M60 147 L128 141 L132 128 C116 128 92 132 66 140 Z" fill="#5c1d20"/>
        <path d="M74 146 C92 142 112 140 126 138 C116 134 96 136 78 142 Z" fill="#a5464a"/>
        ${skinned(JAW, 'jaw')}
        <g opacity="0.7">${lipScales(64, 148.6, 128, 142.6, 14, P.belly)}</g>
        <ellipse cx="104" cy="160" rx="26" ry="4" fill="${url('cs')}" opacity="0.6"/>
      </g>

      <!-- skull: near side + top of the snout, far cheek peeking behind -->
      <g data-part="dino-head">
        ${skinned(CHEEK_FAR, 'cheek')}
        ${skinned(HEAD, 'head')}
        <g clip-path="${url('cHead')}">
          <!-- lit top plane along the nasal ridge -->
          <path d="M126 100 C106 102 80 116 60 135 C66 131 86 119 106 110 C116 105 122 103 128 102 Z" fill="${P.light}" opacity="0.55"/>
          <!-- rugose bumps on the snout -->
          <g fill="${P.deepest}" opacity="0.35">
            <ellipse cx="72" cy="126" rx="2.2" ry="1"/><ellipse cx="80" cy="120" rx="2.2" ry="1"/>
            <ellipse cx="88" cy="114.5" rx="2.2" ry="1"/><ellipse cx="96" cy="110" rx="2" ry="0.9"/>
          </g>
          <!-- shade under the cheek + lower rim -->
          <ellipse cx="128" cy="136" rx="12" ry="9" fill="${url('cs')}"/>
          <ellipse cx="96" cy="146" rx="34" ry="5" fill="${url('cs')}" opacity="0.6"/>
          <ellipse cx="116" cy="124" rx="10" ry="9" fill="${url('hl')}" opacity="0.6"/>
          ${lipScales(62, 146, 126, 141, 16, P.belly)}
        </g>
        <!-- far eye, mostly hidden under the far brow -->
        <circle cx="127" cy="104" r="1.6" fill="#2a1508"/>
        <path d="M121 102 q6 -4 11 -1" fill="none" stroke="${P.deepest}" stroke-width="2" stroke-linecap="round"/>
        <!-- near eye: small, deep-set, under a heavy brow (lacrimal hornlet) -->
        <ellipse cx="105" cy="117" rx="5.4" ry="3.8" fill="#140d06" opacity="0.4"/>
        <circle cx="105.2" cy="117.4" r="2.7" fill="${url('eye')}"/>
        <circle cx="104.8" cy="117.5" r="1.25" fill="#120b05"/>
        <circle cx="104" cy="116.6" r="0.6" fill="#fffbe8"/>
        <path d="M97 113 q8 -7 17 -3 q-3 1.6 -6 2.4 q-6 -0.6 -11 0.6 z" fill="${P.deepest}"/>
        <path d="M99 111 q6 -4 12 -2" fill="none" stroke="${P.light}" stroke-width="0.7" opacity="0.6"/>
        <!-- nostril -->
        <ellipse cx="63" cy="137" rx="2" ry="1.2" fill="#140d06" opacity="0.85" transform="rotate(-30 63 137)"/>
      </g>

      <!-- the child at true scale, facing the T. rex -->
      ${cfg.child === false ? '' : `<g data-part="human">${child(cfg.childX)}</g>`}

      <!-- roar: sound rings + warm breath mist from the mouth -->
      <g data-part="fx-breath" opacity="0">
        <g filter="${url('mist')}" fill="#f4ecdc" opacity="0.6">
          <ellipse cx="50" cy="156" rx="9" ry="6"/><ellipse cx="40" cy="152" rx="7" ry="5"/>
        </g>
        <g fill="none" stroke="#fff8e6" stroke-linecap="round" stroke-opacity="0.85">
          <path d="M48 140 q-8 14 0 30" stroke-width="2.2"/>
          <path d="M38 134 q-11 20 0 42" stroke-width="1.8"/>
          <path d="M27 128 q-14 26 0 54" stroke-width="1.4"/>
        </g>
      </g>
    </svg>`;
  }

  // opts: { child: false } drops the scale child, { scenery: false } the dirt
  // patch (used when the T. rex is reused in the size ladder / line-up)
  function buildTRex(opts) {
    opts = opts || {};
    return buildTheropod({
      child: opts.child, scenery: opts.scenery,
      palette: {
        light: '#8b7350', mid: '#634e33', dark: '#4a3a26', deep: '#3a2d1d', deepest: '#2a2014',
        belly: '#cbb893', claw: '#1f1810', eye: '#c98a2a'
      },
      bands: true,
      childX: 40
    });
  }

  window.buildTheropod = buildTheropod;
  window.buildTRex = buildTRex;
  // s = px per metre on its page (child = 1.2 m), x0 / w = left edge + width
  window.DINO_META = window.DINO_META || {};
  window.DINO_META.trex = { s: 36, x0: 54, w: 296, build: buildTRex };
})();
