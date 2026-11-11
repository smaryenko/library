// SEASONS book — the eight spreads. Each is ONE flat scene SVG (the race-book
// pattern): a blurred landscape plate, a softer middle ground, the fox as flat
// role-named data-part groups, a small woodland creature, a crisp foreground
// and hidden fx-* effects. One Nature.anim([...]) per scene, tracks target
// role names. Placement always lives on no-data-part inner <g>s.
//
// The viewBox is padded (-20 -40 400 360) so the 360x300 design fits the
// half-page image slot without spilling over the page top.
(function () {
  'use strict';
  const N = window.Nature;
  const F = window.FoxArt;
  const VB = 'viewBox="-46 -88 452 377"';
  const f1 = n => n.toFixed(1);
  const uidOf = p => p + Math.random().toString(36).slice(2, 7);
  const px = a => `${f1(a[0])}px ${f1(a[1])}px`;
  // a small creature / prop as a flat data-part with a placement wrapper
  const wrap = (name, x, y, s, inner, flip, extra) =>
    `<g data-part="${name}"${extra || ''}><g transform="translate(${f1(x)} ${f1(y)}) scale(${flip ? -s : s} ${s})">${inner}</g></g>`;
  const FOX_ALL = ['fox-tail', 'fox-leg-far', 'fox-body', 'fox-leg-near', 'fox-head'];

  // ===== 1. SPRING — the fox wakes at its den, a wood mouse peeks out =======
  function buildSpringDen() {
    const u = uidOf('sd'), r = N.rng(11);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'day', flip: true, x: 172, y: 262, s: 0.46 });
    const sg = -1;
    const O = fox.Pxy(-65, 0), NK = fox.Pxy(118, -226);
    let prims = '';
    for (let i = 0; i < 9; i++) prims += N.primrose(200 + r() * 150, 150 + r() * 40, 0.8 + r() * 0.5);
    let frontFl = '';
    for (let i = 0; i < 7; i++) frontFl += N.primrose(-5 + r() * 370, 282 + r() * 14, 0.9 + r() * 0.5);
    const yawnT = rot2 => `0%,100%{transform:none}30%,72%{transform:${rot2}}`;
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: ['fox-body', 'fox-leg-near', 'fox-leg-far', 'fox-tail'], origin: px(O), timing: '2.4s ease-in-out',
          keyframes: `0%,100%{transform:rotate(0)}30%,72%{transform:rotate(${7 * sg}deg)}` },
        { parts: 'fox-head', origin: px(O), timing: '2.4s ease-in-out',
          keyframes: yawnT(N.rot2(O, NK, 7 * sg, -18 * sg)) },
        { parts: 'fx-yawn', origin: px(O), timing: '2.4s ease-in-out',
          keyframes: `0%,100%{transform:none;opacity:0}30%{transform:${N.rot2(O, NK, 7 * sg, -18 * sg)};opacity:0}
            40%,62%{transform:${N.rot2(O, NK, 7 * sg, -18 * sg)};opacity:1}72%{transform:${N.rot2(O, NK, 7 * sg, -18 * sg)};opacity:0}` },
        { parts: 'mouse', origin: '44px 262px', timing: '2.4s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0)}12%{transform:translate(0,-3px)}28%,70%{transform:translate(-6px,16px)}85%{transform:translate(0,-2px)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}${N.mouseDefs(u)}
        <linearGradient id="${u}-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d5a3a"/><stop offset="1" stop-color="#3f2a1a"/></linearGradient>
        <radialGradient id="${u}-hole" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stop-color="#0d0805"/><stop offset="0.75" stop-color="#22160e"/><stop offset="1" stop-color="#4a3220"/></radialGradient>
      </defs>
      ${N.plate(u, ['#e4efd6', '#bcd8a0', '#7aa35b'], `
        <g>
          ${N.forest(r, 0, 360, 196, 90, ['#c3dc8a', '#9cc064', '#76a04a', '#557f36', '#3f6229'], '#4a3c2c', '#e4efd6')}
        </g>
        <g>
          <path d="M-20 200 Q120 170 380 190 L380 320 L-20 320 Z" fill="#6f9447"/>
          
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M150 262 C168 168 250 128 380 132 L380 262 Z" fill="url(#${u}-soil)"/>
        <path d="M150 262 C168 168 250 128 380 132 L380 142 C260 140 180 176 162 262 Z" fill="#5f8a3a"/>
        ${N.blades(r, 60, 160, 380, 140, 6, 16, ['#6f9c40', '#8ab454', '#557d2e'], 2)}
        <ellipse cx="282" cy="210" rx="46" ry="36" fill="url(#${u}-hole)"/>
        <path d="M244 196 q-12 -20 -2 -36 M318 192 q16 -16 10 -40 M262 178 q10 -14 2 -26" stroke="#5a3d26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        ${prims}
      </g>
      ${fox.parts}
      ${wrap('mouse', 44, 262, 0.95, N.mouse(u))}
      <g data-part="sn-front">
        ${N.blades(r, 140, -20, 380, 292, 14, 44, ['#5d8f34', '#79ad46', '#4a7a28', '#93c25e'], 2.6)}
        ${frontFl}
      </g>
    </svg>`;
  }

  // ===== 2. SPRING — three kits tumble, their mother keeps watch ============
  function buildKits() {
    const u = uidOf('kt'), r = N.rng(23);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'day', flip: true, x: 262, y: 262, s: 0.44 });
    const NK = fox.Pxy(118, -226);
    const kit = (as, x, y, sc, flip) => F.buildFox({ uid: u + 'k', as, pose: 'sit', light: 'kit', x, y, s: sc, flip });
    const ka = kit('kit-a', 52, 268, 0.2), kb = kit('kit-b', 130, 266, 0.18, true), kc = kit('kit-c', 92, 292, 0.23);
    let daisies = '';
    for (let i = 0; i < 16; i++) daisies += N.daisy(-10 + r() * 380, 278 + r() * 18, 0.9 + r() * 0.5);
    let midDaisies = '';
    for (let i = 0; i < 14; i++) midDaisies += N.daisy(r() * 360, 236 + r() * 20, 0.6 + r() * 0.3);
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'kit-a', box: 'fill-box', origin: '50% 60%', timing: '2.2s ease-in-out',
          keyframes: '0%{transform:translate(0,0) rotate(0)}22%{transform:translate(10px,-16px) rotate(140deg)}44%{transform:translate(26px,0) rotate(360deg)}70%{transform:translate(18px,0) rotate(360deg)}100%{transform:translate(0,0) rotate(360deg)}' },
        { parts: 'kit-b', box: 'fill-box', origin: '50% 100%', timing: '2.2s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0) rotate(0)}18%{transform:translate(0,-22px) rotate(-12deg)}32%{transform:translate(0,0) rotate(0)}52%{transform:translate(-4px,-18px) rotate(10deg)}66%{transform:translate(0,0)}' },
        { parts: 'kit-c', box: 'fill-box', origin: '50% 100%', timing: '2.2s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-4px,4px) scaleY(.9)}50%{transform:translate(-22px,-26px) rotate(-18deg)}66%{transform:translate(-34px,-2px) rotate(-6deg)}82%{transform:translate(-10px,0)}' },
        { parts: 'fox-head', origin: px(NK), timing: '2.2s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}25%,75%{transform:rotate(-10deg)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}${ka.defs}</defs>
      ${N.plate(u, ['#e8f0d8', '#aed08a', '#5e8c3c'], `
        <g>
          <path d="M-20 140 Q60 60 160 110 Q260 40 380 100 L380 200 L-20 200 Z" fill="#4f7a34"/>
          ${N.forest(r, 0, 360, 192, 80, ['#b9d77e', '#8fb85a', '#6a9a42', '#4c7a32', '#365a24'], '#3e3426', '#e8f0d8')}
        </g>
        <g>
          <path d="M-20 190 Q180 176 380 196 L380 320 L-20 320 Z" fill="#6b9a44"/>
          
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        ${N.blades(r, 90, -20, 380, 256, 10, 26, ['#5f8e37', '#7aac48', '#4c7a2a'], 2.2)}
        ${midDaisies}
      </g>
      ${fox.parts}
      ${kb.parts}${ka.parts}${kc.parts}
      <g data-part="sn-front">
        ${N.blades(r, 150, -20, 380, 296, 12, 40, ['#4f8530', '#6ea342', '#3e6e24', '#88bb56'], 2.6)}
        ${daisies}
      </g>
    </svg>`;
  }

  // ===== 3. SUMMER — tall grass, a butterfly, and the mousing pounce ========
  function buildMeadow() {
    const u = uidOf('md'), r = N.rng(37);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'golden', x: 138, y: 266, s: 0.46,
      head: { dx: 4, dy: 10, rot: 16 } });
    const C = fox.Pxy(0, -150);
    let cups = '', farCups = '';
    for (let i = 0; i < 18; i++) cups += N.buttercup(-10 + r() * 380, 252 + r() * 44, 0.9 + r() * 0.6);
    for (let i = 0; i < 20; i++) farCups += N.buttercup(r() * 360, 214 + r() * 30, 0.5 + r() * 0.3);
    let bits = '';
    for (let i = 0; i < 9; i++) {
      const x = 286 + (r() * 2 - 1) * 26, y = 236 - r() * 30;
      bits += `<path d="M${f1(x)} ${f1(y)} l${f1((r() * 2 - 1) * 8)} ${f1(-6 - r() * 8)}" stroke="#9cbc4a" stroke-width="2" stroke-linecap="round"/>`;
    }
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: FOX_ALL, origin: px(C), timing: '2.2s cubic-bezier(.45,0,.35,1)',
          keyframes: '0%,100%{transform:none}16%{transform:translate(-4px,6px) rotate(3deg)}44%{transform:translate(46px,-50px) rotate(-14deg)}64%{transform:translate(92px,4px) rotate(40deg)}80%{transform:translate(92px,6px) rotate(38deg)}' },
        { parts: 'fx-grass', box: 'fill-box', origin: '50% 100%', timing: '2.2s ease-out',
          keyframes: '0%,60%{opacity:0;transform:translateY(8px) scale(.6)}68%{opacity:1;transform:translateY(-4px) scale(1)}86%{opacity:0;transform:translateY(-16px) scale(1.2)}100%{opacity:0}' },
        { parts: 'butterfly', origin: '282px 172px', timing: '2.2s ease-in-out',
          keyframes: '0%,30%{transform:translate(0,0) rotate(0)}55%{transform:translate(30px,-70px) rotate(20deg)}75%{transform:translate(-10px,-96px) rotate(-14deg)}100%{transform:translate(0,0) rotate(0)}' },
        { sel: '.bfw-l', box: 'fill-box', origin: '100% 50%', timing: '.16s ease-in-out 14 alternate',
          keyframes: 'from{transform:scaleX(1)}to{transform:scaleX(.25)}' },
        { sel: '.bfw-r', box: 'fill-box', origin: '0% 50%', timing: '.16s ease-in-out 14 alternate',
          keyframes: 'from{transform:scaleX(1)}to{transform:scaleX(.25)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}</defs>
      ${N.plate(u, ['#f5ebb8', '#dccf7c', '#8ea546'], `
        <g>
          <path d="M-20 120 Q80 80 180 110 Q290 70 380 110 L380 200 L-20 200 Z" fill="#6e8a3a"/>
          ${N.forest(r, 0, 360, 196, 86, ['#a8b65a', '#7f9640', '#5f7a30', '#465e24', '#33461a'], '#3a3020', '#f5ebb8')}
        </g>
        <g>
          <path d="M-20 196 Q180 180 380 200 L380 320 L-20 320 Z" fill="#9aae4c"/>
          
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        ${N.blades(r, 110, -20, 380, 250, 20, 48, ['#9cb44e', '#b8c862', '#7f9a3a'], 2)}
        ${farCups}
      </g>
      ${fox.parts}
      <g data-part="sn-prop">
        <path d="M284 290 Q280 230 282 176" stroke="#8aa23e" stroke-width="1.6" fill="none"/>
        <path d="M282 180 l-4 -10 M282 182 l5 -9" stroke="#a9b65a" stroke-width="1.4"/>
      </g>
      ${wrap('butterfly', 282, 172, 0.62, N.butterfly())}
      <g data-part="fx-grass" opacity="0">${bits}</g>
      <g data-part="sn-front">
        ${N.blades(r, 190, -20, 380, 298, 30, 84, ['#8eaa42', '#a9c25a', '#6f8e30', '#c4cf6e'], 2.4)}
        ${cups}
      </g>
    </svg>`;
  }

  // ===== 4. SUMMER NIGHT — fireflies, and the fox's eyes shine =============
  function buildNight() {
    const u = uidOf('nt'), r = N.rng(41);
    const fox = F.buildFox({ uid: u + 'f', pose: 'sit', light: 'night', x: 170, y: 270, s: 0.56 });
    const NK = fox.Pxy(29, -220);
    let stars = '';
    for (let i = 0; i < 40; i++) stars += `<circle cx="${f1(r() * 360)}" cy="${f1(r() * 120)}" r="${f1(0.4 + r() * 0.9)}" fill="#fff" opacity="${f1(0.3 + r() * 0.6)}"/>`;
    let flies = '';
    for (let i = 0; i < 14; i++) {
      const x = 20 + r() * 320, y = 90 + r() * 170;
      flies += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(5 + r() * 4)}" fill="url(#${u}-glowY)"/>
                <circle cx="${f1(x)}" cy="${f1(y)}" r="1.3" fill="#fbffe0"/>`;
    }
    const tilt = d => N.rot2(NK, NK, 0, d);
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'sn-fireflies', origin: '180px 180px', timing: '3s ease-in-out',
          keyframes: '0%,100%{opacity:.55;transform:translate(0,0)}20%{opacity:1;transform:translate(8px,-10px)}45%{opacity:.35;transform:translate(-10px,-20px)}70%{opacity:1;transform:translate(4px,-8px)}' },
        { parts: 'fox-head', origin: px(NK), timing: '3s ease-in-out',
          keyframes: `0%,100%{transform:none}25%{transform:${tilt(-12)}}55%{transform:${tilt(9)}}80%{transform:${tilt(-4)}}` },
        { parts: 'fx-eyeshine', origin: px(NK), timing: '3s ease-in-out',
          keyframes: `0%,100%{transform:none;opacity:0}15%{opacity:1}25%{transform:${tilt(-12)};opacity:1}55%{transform:${tilt(9)};opacity:.8}80%{transform:${tilt(-4)};opacity:1}92%{opacity:0}` }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <radialGradient id="${u}-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#f4f2df"/><stop offset="0.25" stop-color="#d8dcef" stop-opacity="0.7"/>
          <stop offset="1" stop-color="#8ea4d8" stop-opacity="0"/></radialGradient>
      </defs>
      ${N.plate(u, ['#0b1730', '#1c2f50', '#25373a'], `
        ${stars}
        <circle cx="292" cy="58" r="60" fill="url(#${u}-moon)"/>
        <circle cx="292" cy="58" r="14" fill="#f3f1de"/>
        <g>
          <path d="M-20 170 Q40 120 90 150 Q140 100 200 150 Q260 120 380 160 L380 320 L-20 320 Z" fill="#101b22"/>
          <path d="M-20 214 Q180 200 380 216 L380 320 L-20 320 Z" fill="#17262a"/>
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        ${N.blades(r, 100, -20, 380, 258, 14, 40, ['#1a2a2a', '#22363a', '#142224'], 2)}
      </g>
      ${fox.parts}
      <g data-part="sn-fireflies" opacity="0.55">${flies}</g>
      <g data-part="sn-front">
        ${N.blades(r, 150, -20, 380, 298, 20, 64, ['#0f1a1c', '#18282a', '#22343a'], 2.4)}
      </g>
    </svg>`;
  }

  // ===== 5. AUTUMN — golden bracken, a tail swish, a red squirrel ==========
  function buildAutumn() {
    const u = uidOf('au'), r = N.rng(53);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'golden', flip: true, x: 210, y: 268, s: 0.46 });
    const TB = fox.Pxy(-98, -185);
    let midF = '', frontF = '';
    for (let i = 0; i < 12; i++) midF += N.frond(r() * 360, 250 + r() * 10, 60 + r() * 50, (r() * 2 - 1) * 40, '#d1782e', '#b9601e');
    for (let i = 0; i < 10; i++) frontF += N.frond(-10 + r() * 380, 300, 50 + r() * 50, (r() * 2 - 1) * 50, '#c8661f', '#e08a36');
    let fall = '';
    for (let i = 0; i < 9; i++) fall += N.leaf(fox.Pxy(-170, -100)[0] + (r() * 2 - 1) * 40, fox.Pxy(-170, -100)[1] + (r() * 2 - 1) * 30, 0.9 + r() * 0.4, r() * 360, ['#d9842c', '#b9441a', '#e8b23a'][i % 3]);
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'fox-tail', origin: px(TB), timing: '2s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}20%{transform:rotate(22deg)}45%{transform:rotate(-16deg)}68%{transform:rotate(12deg)}85%{transform:rotate(-4deg)}' },
        { parts: 'fx-fall-leaves', box: 'fill-box', origin: '50% 50%', timing: '2s ease-out',
          keyframes: '0%{opacity:0;transform:translate(0,0) rotate(0)}18%{opacity:1}100%{opacity:0;transform:translate(26px,60px) rotate(90deg)}' },
        { parts: 'squirrel', origin: '52px 176px', timing: '2s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0)}15%{transform:translate(0,-3px)}35%{transform:translate(-4px,-58px) rotate(-6deg)}60%{transform:translate(-4px,-58px) rotate(-6deg)}80%{transform:translate(0,-4px)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <linearGradient id="${u}-bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2e2016"/><stop offset="0.5" stop-color="#5a4130"/><stop offset="1" stop-color="#2a1d14"/></linearGradient>
      </defs>
      ${N.plate(u, ['#f7dca6', '#e6a65c', '#93461b'], `
        <g>
          <path d="M-20 120 Q120 60 220 100 Q300 60 380 90 L380 210 L-20 210 Z" fill="#b25a22" opacity="0.6"/>
          ${N.forest(r, 0, 360, 200, 100, ['#f2c04a', '#e3922e', '#cf6a22', '#a8461a', '#7a3214'], '#3a2416', '#f7dca6')}
        </g>
        <g>
          <path d="M-20 200 Q180 186 380 204 L380 320 L-20 320 Z" fill="#a85a24"/>
          
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <g>
          <path d="M28 300 C34 220 30 120 34 -10 L70 -10 C70 120 66 220 74 300 Z" fill="url(#${u}-bark)"/>
          <path d="M40 20 q4 40 0 80 M58 60 q-3 50 2 100 M46 160 q4 40 -2 80" stroke="#1e140e" stroke-width="1.4" fill="none" opacity="0.7"/>
          <path d="M70 182 Q110 172 150 150" stroke="#3b2a1d" stroke-width="7" stroke-linecap="round" fill="none"/>
          ${midF}
        </g>
      </g>
      ${fox.parts}
      ${wrap('squirrel', 108, 177, 0.9, N.squirrel())}
      <g data-part="fx-fall-leaves" opacity="0">${fall}</g>
      <g data-part="sn-front">
        ${N.leafScatter(r, 40, [-10, 276, 370, 300], ['#c9631e', '#e09a34', '#a8401a', '#d9b04a'], 0.8, 1.3)}
        ${frontF}
      </g>
    </svg>`;
  }

  // ===== 6. AUTUMN — the fox buries an apple; a hedgehog snuffles past =====
  function buildCache() {
    const u = uidOf('ca'), r = N.rng(61);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'day', x: 140, y: 264, s: 0.46,
      head: { dx: 6, dy: 14, rot: 14 }, splitFront: true });
    const SH = fox.Pxy(112, -116), NK = fox.Pxy(118, -226), PAW = fox.Pxy(114, -4);
    const AP = fox.Pxy(196, -6);
    let dirt = '';
    for (let i = 0; i < 12; i++) {
      dirt += `<circle cx="${f1(PAW[0] - 8 - r() * 30)}" cy="${f1(PAW[1] - 6 - r() * 26)}" r="${f1(1 + r() * 2.2)}" fill="${r() > 0.5 ? '#4a3220' : '#6b4a2e'}"/>`;
    }
    dirt += N.leaf(PAW[0] - 24, PAW[1] - 22, 0.8, 40, '#c9631e') + N.leaf(PAW[0] - 36, PAW[1] - 12, 0.7, 120, '#e09a34');
    const dig = '0%,100%{transform:rotate(0)}8%{transform:rotate(-30deg)}16%{transform:rotate(8deg)}24%{transform:rotate(-30deg)}32%{transform:rotate(8deg)}40%{transform:rotate(-30deg)}48%{transform:rotate(8deg)}56%{transform:rotate(-26deg)}64%{transform:rotate(4deg)}74%{transform:rotate(0)}';
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'fox-leg-front', origin: px(SH), timing: '2.2s ease-in-out', keyframes: dig },
        { parts: 'fox-head', origin: px(NK), timing: '2.2s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}20%,60%{transform:rotate(5deg)}40%{transform:rotate(-3deg)}' },
        { parts: 'fx-dirt', box: 'fill-box', origin: '100% 100%', timing: '2.2s ease-out',
          keyframes: '0%,4%{opacity:0;transform:translate(0,0) scale(.5)}12%,52%{opacity:1;transform:translate(-10px,-10px) scale(1)}66%{opacity:0;transform:translate(-26px,-4px) scale(1.1)}100%{opacity:0}' },
        { parts: 'apple', box: 'fill-box', origin: '50% 100%', timing: '2.2s ease-in-out',
          keyframes: '0%,30%{transform:translateY(0);opacity:1}62%,84%{transform:translateY(9px) scaleY(.4);opacity:0}100%{transform:translateY(0);opacity:1}' },
        { parts: 'hedgehog', origin: '312px 272px', timing: '2.2s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0)}20%{transform:translate(-8px,-2px)}30%{transform:translate(-12px,0)}50%{transform:translate(-20px,-2px)}62%{transform:translate(-22px,0) rotate(-4deg)}74%{transform:translate(-22px,0) rotate(3deg)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <radialGradient id="${u}-apple" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#f06a4a"/><stop offset="0.6" stop-color="#c52a1e"/><stop offset="1" stop-color="#7a1610"/></radialGradient>
        <linearGradient id="${u}-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8a6236"/><stop offset="1" stop-color="#5a3e22"/></linearGradient>
      </defs>
      ${N.plate(u, ['#efd7a6', '#c49456', '#6e4a28'], `
        <g>
          ${N.forest(r, 0, 360, 200, 100, ['#e8b24a', '#c98a34', '#a66226', '#7c441c', '#5a3014'], '#2e1e12', '#efd7a6')}
        </g>
        <g>
          <path d="M-20 200 Q180 186 380 204 L380 320 L-20 320 Z" fill="#8a5a2c"/>
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 238 Q180 226 380 240 L380 320 L-20 320 Z" fill="url(#${u}-floor)"/>
        ${N.leafScatter(r, 70, [-10, 236, 370, 290], ['#c9631e', '#e09a34', '#a8401a', '#d9b04a', '#8a5a24'], 0.6, 1)}
      </g>
      ${fox.parts}
      ${wrap('apple', AP[0], AP[1], 1, `<ellipse cx="0" cy="0" rx="10" ry="3" fill="rgba(0,0,0,0.25)"/>
          <circle cx="0" cy="-9" r="9" fill="url(#${u}-apple)"/>
          <path d="M0 -17 q1 -5 3 -6" stroke="#4a3018" stroke-width="1.4" fill="none"/>
          <path d="M2 -21 q6 -4 9 0 q-5 3 -9 0 z" fill="#5e8a2e"/>
          <ellipse cx="-3.5" cy="-12" rx="2.4" ry="1.4" fill="#fff" opacity="0.4"/>`)}
      ${wrap('hedgehog', 312, 272, 0.95, N.hedgehog(), true)}
      <g data-part="fx-dirt" opacity="0">${dirt}</g>
      <g data-part="sn-front">
        ${N.leafScatter(r, 36, [-10, 280, 370, 302], ['#c9631e', '#e09a34', '#a8401a', '#d9b04a'], 0.9, 1.4)}
        ${N.blades(r, 30, -20, 380, 300, 8, 22, ['#6f7a34', '#8a8a3e'], 2)}
      </g>
    </svg>`;
  }

  // ===== 7. WINTER — the thick-coated fox shakes off the snow; a robin ======
  function buildWinter() {
    const u = uidOf('wi'), r = N.rng(71);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', coat: 'winter', light: 'day', x: 152, y: 264, s: 0.46 });
    const C = fox.Pxy(0, -150), TB = fox.Pxy(-98, -185);
    let pines = '';
    [[10, 230, 200], [70, 220, 150], [250, 226, 180], [330, 232, 220], [170, 216, 120]].forEach(t =>
      pines += N.snowPine(t[0], t[1], t[2], '#2a3b33', '#e6edf2'));
    let puffs = '';
    for (let i = 0; i < 14; i++) {
      const a = fox.Pxy(-110 + r() * 260, -260 + r() * 130);
      puffs += `<circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="${f1(2 + r() * 4)}" fill="#fff" opacity="${f1(0.6 + r() * 0.4)}"/>`;
    }
    let sparkle = '';
    for (let i = 0; i < 26; i++) sparkle += `<circle cx="${f1(r() * 360)}" cy="${f1(250 + r() * 50)}" r="0.9" fill="#fff"/>`;
    const shake = '0%,100%{transform:none}8%{transform:rotate(-4deg) translateX(-3px)}16%{transform:rotate(4deg) translateX(3px)}24%{transform:rotate(-4deg) translateX(-3px)}32%{transform:rotate(4deg) translateX(3px)}40%{transform:rotate(-3deg)}48%{transform:rotate(3deg)}56%{transform:rotate(-2deg)}64%{transform:rotate(1deg)}72%{transform:none}';
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: ['fox-leg-far', 'fox-body', 'fox-leg-near', 'fox-head'], origin: px(C), timing: '1.8s ease-in-out', keyframes: shake },
        { parts: 'fox-tail', origin: px(TB), timing: '1.8s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}10%{transform:rotate(14deg)}22%{transform:rotate(-12deg)}34%{transform:rotate(12deg)}46%{transform:rotate(-8deg)}60%{transform:rotate(4deg)}74%{transform:rotate(0)}' },
        { parts: 'fx-snow', box: 'fill-box', origin: '50% 50%', timing: '1.8s ease-out',
          keyframes: '0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(.9)}70%{opacity:0;transform:scale(1.5) translateY(-6px)}100%{opacity:0}' },
        { parts: 'robin', origin: '292px 118px', timing: '1.8s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0)}15%{transform:translate(0,-12px) rotate(-8deg)}28%{transform:translate(-6px,0)}48%{transform:translate(-10px,-10px) rotate(6deg)}62%{transform:translate(-12px,0)}86%{transform:translate(-4px,0)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <linearGradient id="${u}-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e1ec"/></linearGradient>
        <linearGradient id="${u}-drift" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f8fbff"/><stop offset="0.6" stop-color="#e2ebf4"/><stop offset="1" stop-color="#b9c9db"/></linearGradient>
      </defs>
      ${N.plate(u, ['#cbd8e6', '#e6edf4', '#f3f6fa'], `
        <g>${pines}</g>
        <g>
          <path d="M-20 214 Q100 200 200 214 T380 210 L380 320 L-20 320 Z" fill="url(#${u}-snow)"/>
        </g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 238 Q90 226 190 240 T380 236 L380 320 L-20 320 Z" fill="url(#${u}-snow)"/>
        <path d="M-20 252 Q60 244 130 252" stroke="#c7d5e4" stroke-width="3" fill="none" opacity="0.6"/>
        <path d="M380 112 Q320 118 250 128" stroke="#3a2a20" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M380 108 Q320 114 252 125 Q300 118 380 116 Z" fill="#fbfdff"/>
        <path d="M300 120 l-14 -10 M326 116 l-8 -12" stroke="#3a2a20" stroke-width="2" stroke-linecap="round"/>
      </g>
      ${fox.parts}
      ${wrap('robin', 292, 119, 0.9, N.robin(), true)}
      <g data-part="fx-snow" opacity="0">${puffs}</g>
      <g data-part="sn-front">
        <path d="M0 270 Q60 256 140 270 Q220 284 300 266 Q340 258 360 264 L360 292 Q180 300 0 292 Z" fill="url(#${u}-drift)"/>
        <path d="M-20 272 Q60 256 140 270 Q220 284 300 266 Q340 258 380 266" stroke="#ffffff" stroke-width="2" fill="none"/>
        ${N.blades(r, 14, 0, 360, 280, 10, 24, ['#8a7a5a', '#a08a62'], 1.4)}
        ${sparkle}
      </g>
    </svg>`;
  }

  // ===== 8. WINTER EVENING — curled up asleep; a mouse tiptoes past ========
  function buildSleep() {
    const u = uidOf('sl'), r = N.rng(83);
    const fox = F.buildFox({ uid: u + 'f', pose: 'curl', coat: 'winter', light: 'day', eyes: 'closed', x: 186, y: 266, s: 0.62 });
    const B = fox.Pxy(0, 0), H = fox.Pxy(66, -60), TT = fox.Pxy(-100, -10);
    let pines = '';
    [[20, 220, 180], [90, 214, 130], [270, 220, 170], [340, 226, 210]].forEach(t =>
      pines += N.snowPine(t[0], t[1], t[2], '#1f2a46', '#c4cbe0'));
    let flakes = '';
    for (let i = 0; i < 46; i++) flakes += `<circle cx="${f1(8 + r() * 344)}" cy="${f1(62 + r() * 200)}" r="${f1(0.8 + r() * 1.6)}" fill="#fff" opacity="${f1(0.5 + r() * 0.5)}"/>`;
    const zz = `<g font-family="Georgia,serif" font-style="italic" font-weight="700" fill="#f4f6ff">
        <text x="${f1(H[0] + 6)}" y="${f1(H[1] - 30)}" font-size="13">z</text>
        <text x="${f1(H[0] + 18)}" y="${f1(H[1] - 46)}" font-size="17">z</text>
        <text x="${f1(H[0] + 32)}" y="${f1(H[1] - 66)}" font-size="22">z</text></g>`;
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'fox-body', origin: px(B), timing: '3.6s ease-in-out',
          keyframes: '0%,50%,100%{transform:scaleY(1)}25%,75%{transform:scaleY(1.05) scaleX(1.01)}' },
        { parts: ['fox-head', 'fox-tail-front'], origin: px(TT), timing: '3.6s ease-in-out',
          keyframes: '0%,50%,100%{transform:translateY(0)}25%,75%{transform:translateY(-2.5px)}' },
        { parts: 'fx-zz', box: 'fill-box', origin: '0% 100%', timing: '3.6s ease-out',
          keyframes: '0%{opacity:0;transform:translate(0,6px) scale(.7)}20%{opacity:1}80%{opacity:.8;transform:translate(10px,-14px) scale(1.05)}100%{opacity:0;transform:translate(14px,-20px) scale(1.1)}' },
        { parts: 'mouse', origin: '34px 272px', timing: '3.6s ease-in-out',
          keyframes: '0%{transform:translate(0,0);opacity:1}10%{transform:translate(40px,-2px)}18%,26%{transform:translate(70px,0)}52%{transform:translate(330px,-2px);opacity:1}53%{transform:translate(330px,0);opacity:0}54%{transform:translate(-70px,0);opacity:0}56%{transform:translate(-70px,0);opacity:1}100%{transform:translate(0,0);opacity:1}' },
        { parts: 'sn-snowfall', origin: '180px 140px', timing: '3.6s linear',
          keyframes: '0%{transform:translateY(0)}100%{transform:translateY(26px)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}${N.mouseDefs(u)}
        <linearGradient id="${u}-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e8e6f2"/><stop offset="1" stop-color="#a9b0cf"/></linearGradient>
        <radialGradient id="${u}-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fffbe8"/><stop offset="0.3" stop-color="#e6e2f2" stop-opacity="0.6"/>
          <stop offset="1" stop-color="#a7aed6" stop-opacity="0"/></radialGradient>
      </defs>
      ${N.plate(u, ['#28365e', '#5f6c9c', '#c2bfd6'], `
        <circle cx="80" cy="60" r="46" fill="url(#${u}-moon)"/>
        <circle cx="80" cy="60" r="11" fill="#fbf7e6"/>
        <g>${pines}
          <path d="M-20 212 Q180 198 380 214 L380 320 L-20 320 Z" fill="#b8bdd8"/></g>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 236 Q100 226 200 240 T380 234 L380 320 L-20 320 Z" fill="url(#${u}-snow)"/>
        <ellipse cx="${f1(B[0])}" cy="${f1(B[1] + 2)}" rx="96" ry="10" fill="#8a90b4" opacity="0.5"/>
      </g>
      ${fox.parts}
      ${wrap('mouse', 34, 272, 0.8, N.mouse(u))}
      <g data-part="fx-zz" opacity="0">${zz}</g>
      <g data-part="sn-front">
        <path d="M0 279 Q80 268 170 282 Q260 294 360 278 L360 292 Q180 300 0 292 L0 279 Z" fill="#dcdcec"/>
        <path d="M-20 280 Q80 268 170 282 Q260 294 380 276" stroke="#f6f6ff" stroke-width="2" fill="none"/>
      </g>
      <g data-part="sn-snowfall">${flakes}</g>
    </svg>`;
  }


  // ===== SPRING — bluebells, a bumblebee, and a big sneeze =================
  function buildBluebells() {
    const u = uidOf('bb'), r = N.rng(97);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'day', x: 128, y: 268, s: 0.44,
      head: { dx: 8, dy: 40, rot: 22 } });
    const NK = fox.Pxy(118, -226), NOSE = fox.Pxy(119, -234 + 40 + 6);
    let bells = '', frontBells = '';
    const bell = (x, y, sc) => {
      let b = `<path d="M${f1(x)} ${f1(y)} q2 -14 -2 -26" stroke="#4f7a2c" stroke-width="1" fill="none"/>`;
      for (let i = 0; i < 5; i++) b += `<path d="M${f1(x - 1 + i * 1.2)} ${f1(y - 26 + i * 4)} q${f1(3 * sc)} 1 ${f1(3 * sc)} ${f1(4 * sc)} q${f1(-2 * sc)} 1 ${f1(-4 * sc)} -1 z" fill="${i % 2 ? '#5a62c8' : '#6c74d8'}"/>`;
      return b;
    };
    for (let i = 0; i < 70; i++) bells += bell(r() * 360, 236 + r() * 26, 0.7 + r() * 0.3);
    for (let i = 0; i < 16; i++) frontBells += bell(-5 + r() * 370, 296, 1.2);
    let puff = '';
    for (let i = 0; i < 9; i++) puff += `<circle cx="${f1(NOSE[0] + 6 + r() * 22)}" cy="${f1(NOSE[1] - 6 + r() * 12)}" r="${f1(1.5 + r() * 2.5)}" fill="#fff" opacity="0.8"/>`;
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'fox-head', origin: px(NK), timing: '1.8s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}30%{transform:rotate(-16deg)}38%{transform:rotate(-20deg)}46%{transform:rotate(14deg)}52%{transform:rotate(10deg)}70%{transform:rotate(0)}' },
        { parts: 'fx-sneeze', box: 'fill-box', origin: '0% 50%', timing: '1.8s ease-out',
          keyframes: '0%,44%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}80%{opacity:0;transform:scale(1.6) translateX(10px)}100%{opacity:0}' },
        { parts: 'bee', origin: '236px 210px', timing: '1.8s ease-in-out',
          keyframes: '0%,46%{transform:translate(0,0)}60%{transform:translate(40px,-40px) rotate(20deg)}75%{transform:translate(80px,-20px)}90%{transform:translate(30px,-6px)}100%{transform:translate(0,0)}' },
        { sel: '.bw', box: 'fill-box', origin: '50% 100%', timing: '.06s linear 30 alternate',
          keyframes: 'from{transform:scaleY(1)}to{transform:scaleY(.3)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}</defs>
      ${N.plate(u, ['#dfe9e6', '#c2d6c4', '#86a46a'], `
        ${N.forest(r, 0, 360, 200, 96, ['#c6dc96', '#98bc6a', '#6f984a', '#4f7636', '#375528'], '#3e3426', '#dfe9e6')}
        <path d="M-20 196 Q180 184 380 198 L380 320 L-20 320 Z" fill="#6c8c48"/>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        ${N.blades(r, 90, -20, 380, 250, 8, 20, ['#5f8a38', '#77a248', '#4c7a2a'], 2)}
        ${bells}
      </g>
      ${fox.parts}
      ${wrap('bee', 236, 210, 1.1, N.bee())}
      <g data-part="fx-sneeze" opacity="0">${puff}</g>
      <g data-part="sn-front">
        ${N.blades(r, 140, -10, 370, 298, 12, 36, ['#4f8530', '#6ea342', '#3e6e24'], 2.4)}
        ${frontBells}
      </g>
    </svg>`;
  }

  // ===== SUMMER — splashing across a stream; a dragonfly ===================
  function buildStream() {
    const u = uidOf('st'), r = N.rng(101);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', light: 'golden', x: 120, y: 272, s: 0.44 });
    let ripples = '', splash = '';
    for (let i = 0; i < 18; i++) {
      const x = r() * 360, y = 236 + r() * 60;
      ripples += `<path d="M${f1(x - 8 - r() * 10)} ${f1(y)} q10 -2 ${f1(16 + r() * 10)} 0" stroke="#eef6f8" stroke-width="0.8" fill="none" opacity="0.6"/>`;
    }
    const P1 = fox.Pxy(110, 0), P2 = fox.Pxy(-60, 0);
    [P1, P2].forEach(P => { for (let i = 0; i < 10; i++) {
      const a = -Math.PI * (0.15 + r() * 0.7), d = 6 + r() * 16;
      splash += `<circle cx="${f1(P[0] + 40 + Math.cos(a) * d)}" cy="${f1(P[1] + Math.sin(a) * d)}" r="${f1(1 + r() * 1.8)}" fill="#f2fbff" opacity="0.9"/>`; } });
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: FOX_ALL.concat(['fox-shadow']), origin: px(fox.Pxy(0, -150)), timing: '2s ease-in-out',
          keyframes: '0%,100%{transform:none}14%{transform:translate(-3px,4px) rotate(2deg)}34%{transform:translate(24px,-34px) rotate(-6deg)}50%{transform:translate(48px,0) rotate(2deg)}60%{transform:translate(48px,0)}' },
        { parts: 'fx-splash', box: 'fill-box', origin: '50% 100%', timing: '2s ease-out',
          keyframes: '0%,46%{opacity:0;transform:scale(.5)}52%{opacity:1;transform:scale(1)}72%{opacity:0;transform:scale(1.4) translateY(-6px)}100%{opacity:0}' },
        { parts: 'sn-water', origin: '180px 260px', timing: '2s ease-in-out',
          keyframes: '0%,48%,100%{transform:none}56%{transform:scaleY(1.04)}66%{transform:scaleY(.98)}' },
        { parts: 'dragonfly', origin: '280px 170px', timing: '2s cubic-bezier(.6,0,.3,1)',
          keyframes: '0%,10%{transform:translate(0,0)}22%{transform:translate(-40px,-10px)}24%,34%{transform:translate(-40px,-10px)}46%{transform:translate(20px,-40px)}48%,62%{transform:translate(20px,-40px)}80%{transform:translate(-20px,10px)}100%{transform:translate(0,0)}' },
        { sel: '.dfw', box: 'fill-box', origin: '50% 50%', timing: '.05s linear 40 alternate',
          keyframes: 'from{transform:scaleX(1)}to{transform:scaleX(.82)}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <linearGradient id="${u}-w" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9cc0c4" stop-opacity="0.85"/><stop offset="0.5" stop-color="#5f8f96" stop-opacity="0.85"/><stop offset="1" stop-color="#3e6a70" stop-opacity="0.9"/></linearGradient>
      </defs>
      ${N.plate(u, ['#f4e8b8', '#d8d08a', '#8ea24a'], `
        ${N.forest(r, 0, 360, 196, 90, ['#b0bc5c', '#869c42', '#627e32', '#486226', '#344a1c'], '#3a3020', '#f4e8b8')}
        <path d="M-20 192 Q180 180 380 196 L380 320 L-20 320 Z" fill="#8a9c48"/>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 222 Q180 214 380 226 L380 236 Q180 226 -20 232 Z" fill="#6a5a3a"/>
        ${N.blades(r, 70, -20, 380, 224, 8, 22, ['#8aa042', '#a6b858', '#6e8a32'], 2)}
        <path d="M-20 232 Q180 224 380 236 L380 320 L-20 320 Z" fill="url(#${u}-w)"/>
        ${ripples}
        <g fill="#7a7062">${[[40, 290, 14], [240, 300, 18], [320, 262, 9], [150, 256, 8]].map(q => `<ellipse cx="${q[0]}" cy="${q[1]}" rx="${q[2]}" ry="${q[2] * 0.4}"/><ellipse cx="${q[0] - q[2] * 0.2}" cy="${q[1] - q[2] * 0.15}" rx="${q[2] * 0.6}" ry="${q[2] * 0.2}" fill="#a49a88"/>`).join('')}</g>
      </g>
      ${fox.parts}
      <g data-part="sn-water" mask="url(#${u}-m)">
        <path d="M-20 266 Q100 262 180 268 T380 266 L380 300 L-20 300 Z" fill="url(#${u}-w)" opacity="0.75"/>
        <path d="M60 268 q14 -3 28 0 M150 270 q16 -3 30 0 M250 267 q12 -2 24 0" stroke="#eef6f8" stroke-width="0.9" fill="none" opacity="0.7"/>
      </g>
      ${wrap('dragonfly', 280, 170, 1, `<g transform="rotate(80)">${N.dragonfly()}</g>`)}
      <g data-part="fx-splash" opacity="0">${splash}</g>
      <g data-part="sn-front">
        ${N.blades(r, 60, -10, 70, 298, 20, 60, ['#6f8e30', '#8aa642', '#56742a'], 2.2)}
        ${N.blades(r, 50, 300, 370, 298, 20, 56, ['#6f8e30', '#8aa642', '#56742a'], 2.2)}
      </g>
    </svg>`;
  }

  // ===== AUTUMN — geese fly south; the fox watches them go =================
  function buildGeese() {
    const u = uidOf('gs'), r = N.rng(113);
    const fox = F.buildFox({ uid: u + 'f', pose: 'sit', light: 'golden', x: 210, y: 274, s: 0.5, head: { rot: -14 } });
    const NK = fox.Pxy(29, -220);
    const V = [[0, 0], [-16, -9], [-16, 9], [-32, -18], [-32, 18], [-48, -27]];
    const flock = V.map(q => `<g transform="translate(${q[0]} ${q[1] * 0.6}) scale(0.6)">${N.goose()}</g>`).join('');
    let floor = N.leafScatter(r, 70, [-10, 248, 370, 296], ['#c9631e', '#e09a34', '#a8401a', '#d9b04a'], 0.7, 1.1);
    const tilt = d => N.rot2(NK, NK, 0, d);
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: 'geese', origin: '0px 0px', timing: '3.4s linear',
          keyframes: '0%{transform:translate(0,0)}100%{transform:translate(420px,-24px)}' },
        { sel: '.gw', box: 'fill-box', origin: '50% 100%', timing: '.4s ease-in-out 8 alternate',
          keyframes: 'from{transform:scaleY(1)}to{transform:scaleY(-.7)}' },
        { parts: 'fox-head', origin: px(NK), timing: '3.4s ease-in-out',
          keyframes: `0%{transform:none}15%{transform:${tilt(-14)}}55%{transform:${tilt(0)}}85%{transform:${tilt(14)}}100%{transform:none}` }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}</defs>
      ${N.plate(u, ['#cfdbe6', '#f0dcae', '#d89a56'], `
        <path d="M-20 168 Q90 140 180 160 Q280 136 380 156 L380 220 L-20 220 Z" fill="#b8a68a" opacity="0.7"/>
        ${N.forest(r, 0, 360, 214, 80, ['#f4c450', '#e2962e', '#cb6c22', '#a4461a', '#7a3214'], '#3a2416', '#f0dcae')}
        <path d="M-20 210 Q180 198 380 212 L380 320 L-20 320 Z" fill="#b7853e"/>`)}
      <g mask="url(#${u}-m)"><g data-part="geese"><g transform="translate(-40 96)">${flock}</g></g></g>
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 236 Q180 226 380 238 L380 320 L-20 320 Z" fill="#9a6a30"/>
        ${N.blades(r, 60, -20, 380, 240, 6, 18, ['#a08a42', '#b89a4a', '#86733a'], 1.8)}
      </g>
      ${fox.parts}
      <g data-part="sn-front">${floor}
        ${N.blades(r, 40, -10, 370, 298, 8, 24, ['#8a7a3a', '#a69048'], 1.8)}</g>
    </svg>`;
  }

  // ===== WINTER — listening under the snow, then a nose-first dive =========
  function buildSnowDive() {
    const u = uidOf('sv'), r = N.rng(127);
    const fox = F.buildFox({ uid: u + 'f', pose: 'stand', coat: 'winter', light: 'day', x: 150, y: 268, s: 0.44,
      head: { dx: 6, dy: 24, rot: 18 } });
    const C = fox.Pxy(0, -150), NK = fox.Pxy(118, -226), LAND = fox.Pxy(210, -10);
    let pines = '';
    [[30, 214, 140], [110, 206, 110], [210, 210, 150], [300, 216, 170]].forEach(t => pines += N.snowPine(t[0], t[1], t[2], '#33463c', '#eef3f6'));
    let burst = '';
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * (0.1 + r() * 0.8), d = 8 + r() * 26;
      burst += `<circle cx="${f1(LAND[0] + Math.cos(a) * d)}" cy="${f1(LAND[1] + 6 + Math.sin(a) * d)}" r="${f1(2 + r() * 3.5)}" fill="#fff"/>`;
    }
    const fxAll = FOX_ALL.concat(['fox-shadow']);
    return `<svg ${VB} xmlns="http://www.w3.org/2000/svg">
      ${N.anim([
        { parts: fxAll, origin: px(C), timing: '2.6s cubic-bezier(.45,0,.35,1)',
          keyframes: '0%,100%{transform:none}10%,26%{transform:translate(0,3px)}44%{transform:translate(30px,-58px) rotate(-12deg)}60%{transform:translate(60px,8px) rotate(58deg)}80%{transform:translate(60px,8px) rotate(58deg)}' },
        { parts: 'fx-snowburst', box: 'fill-box', origin: '50% 100%', timing: '2.6s ease-out',
          keyframes: '0%,56%{opacity:0;transform:scale(.4)}62%{opacity:1;transform:scale(1)}82%{opacity:0;transform:scale(1.5) translateY(-10px)}100%{opacity:0}' }
      ])}
      <defs>${N.sceneDefs(u)}${fox.defs}
        <linearGradient id="${u}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4e0ec"/></linearGradient>
      </defs>
      ${N.plate(u, ['#c9d7e6', '#e8eef4', '#f4f7fa'], `${pines}
        <path d="M-20 210 Q100 198 200 210 T380 206 L380 320 L-20 320 Z" fill="url(#${u}-s)"/>`)}
      <g data-part="sn-mid" mask="url(#${u}-m)">
        <path d="M-20 240 Q90 228 190 242 T380 238 L380 320 L-20 320 Z" fill="url(#${u}-s)"/>
        <g fill="#c4d2e0" opacity="0.8">${[60, 120, 250, 300].map(x => `<ellipse cx="${x}" cy="${250 + (x % 7)}" rx="4" ry="1.6"/>`).join('')}</g>
      </g>
      ${fox.parts}
      <g data-part="fx-snowburst" opacity="0">${burst}</g>
      <g data-part="sn-front">
        <path d="M0 268 Q80 254 160 266 Q240 280 300 262 Q340 254 360 262 L360 292 Q180 300 0 292 Z" fill="url(#${u}-s)"/>
        <path d="M0 268 Q80 254 160 266 Q240 280 300 262 Q340 254 360 262" stroke="#fff" stroke-width="2" fill="none"/>
      </g>
    </svg>`;
  }

  Object.assign(window, { buildBluebells, buildStream, buildGeese, buildSnowDive, buildSpringDen, buildKits, buildMeadow, buildNight,
    buildAutumn, buildCache, buildWinter, buildSleep });
})();
