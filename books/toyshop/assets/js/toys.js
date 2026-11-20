// THE TOY SHOP AFTER MIDNIGHT: the toy-shop kit (the approved style from
// books/preview/assets/js/toyshop.js, moved into a book kit). Warm lamplight
// on dark wallpaper, wood-grain shelves, a blurred back shelf (depth of
// field), felt (fuzzy fibres), yarn, glossy painted tin, gold and steel.
//
// window.TOYS = { C, PLAY, ORDER, kit(seed), gearD(cx, cy, r, n) }
// kit(seed) gives one picture's toolbox (a fresh uid per call, so two
// pictures in the DOM never share ids or keyframes):
//   add(part, s), F(name) filter attr, U(name) url(), g(name, inner) class
//   group `${uid}-${name}`, place(x, y, s, inner, { flip, rot }),
//   anim(name, frames, { dur, delay, ease, count }), origin(name, o),
//   spin(name, turns, turn, delay) the tin key turning round its stem,
//   radial / linear / clip defs helpers, rbox, shadow, sparkle, note, notes,
//   room: wall, backShelf, shelf, under, floorboards, shopWindow, lamp, light,
//   cast (feet / base centre at the local origin): kid, button, soldier,
//   ballerina, jack, spider, duck, mouse, cat, catPaw, musicBox,
//   props: gear, windKey, combTooth, marble, spool, block,
//   end({ css }) returns the final <svg viewBox="0 0 300 300">.
// Every class group gets transform-box: fill-box and a centre origin by
// default, so tap motions work inside translated / scaled groups. Static
// poses sit on plain wrapper groups (a transform attribute on a class group
// would be replaced by the animated transform).
// Faces: dot / small oval eyes with a light catch, soft brows, small smiles.
// No button eyes, no cross stitches; the soldier has no rosy cheeks.
(function () {
'use strict';
const D = window.DRAWKIT;
const { rng, straight, f1 } = D;
// ---- tune by eye -------------------------------------------------------------
const PLAY = 2.4;                        // must stay under the engine's 2.5 s cap
const BLUR_BACK = 1.6;                   // depth of field on the back shelf
const C = {
  wall: '#3a2216', wallD: '#24140c', stripe: '#4a2c1c', lamp: '#ffd59a',
  wood: '#a8683a', woodL: '#c4844f', woodD: '#6e3f20', shadow: '#1a0d06',
  box: '#9a4326', boxL: '#b85a34', boxD: '#6a2a16', lidIn: '#c87a4a', mirror: '#8fa3b0',
  gold: '#e6b84c', goldD: '#9a7020', steel: '#c9ccd2', steelD: '#7d828c',
  red: '#cf2230', redD: '#8e1018', black: '#14121a', white: '#f4efe6', skin: '#f2c3a0', skinD: '#d89a76', cheek: '#ee8f86',
  felt: '#3fa59a', feltL: '#7fd0c4', lace: '#fbf6ee', yarn: '#e8742a', yarnD: '#b9521a', sock: '#d8393f', ink: '#3a2418',
  pj: '#5b86c4', pjD: '#3f6aa8', pjL: '#b4cdee', hair: '#6a3a1e', hairL: '#8a5530', slipper: '#8a3a5a',
  porc: '#fbeee8', porcD: '#e8cfc6', tights: '#f8dde2', tutu: '#f4a6c0', tutuL: '#ffd3e0', tutuD: '#d9789c', satin: '#f2a8bc', bun: '#5a3420',
  cat: '#d9893e', catD: '#a85e22', catL: '#f4cf96', catEye: '#a8d060', nose: '#e88a8a',
  spider: '#5a3a6e', spiderD: '#3e2650', spiderL: '#8a64a0', bow: '#f27a9a',
  duck: '#f2c230', duckD: '#c9961a', beak: '#ef7f22',
  mouse: '#9a9aa6', mouseD: '#6e6e7a', pink: '#f2a0b0',
  jackR: '#c8303a', jackB: '#2f5fb0', jackY: '#f2c230', green: '#3f9a5a', blue: '#3d6fa8', purple: '#7a3d8a',
  card: '#c99a62', cardD: '#9a6e3e', cardL: '#e0b57e',
  water: '#4f7f9e', waterL: '#a9d4ea', night: '#1b2448', nightL: '#33407a', moon: '#fff3c8', dawn: '#ffc89a', dawnL: '#ffe7c4'
};
const ORDER = ['ts-wall', 'ts-back', 'ts-shelf', 'ts-box', 'ts-soldier', 'ts-doll', 'ts-fx', 'ts-light'];
let seq = 0;

const rbox = (x0, y0, x1, y1, r) => `M${f1(x0 + r)} ${f1(y0)}H${f1(x1 - r)}Q${f1(x1)} ${f1(y0)} ${f1(x1)} ${f1(y0 + r)}V${f1(y1 - r)}Q${f1(x1)} ${f1(y1)} ${f1(x1 - r)} ${f1(y1)}H${f1(x0 + r)}Q${f1(x0)} ${f1(y1)} ${f1(x0)} ${f1(y1 - r)}V${f1(y0 + r)}Q${f1(x0)} ${f1(y0)} ${f1(x0 + r)} ${f1(y0)}Z`;
const sq = (x0, y0, x1, y1) => straight([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
// a toothed gear outline (path d) round cx, cy
function gearD(cx, cy, r, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, w = Math.PI / n;
    for (const [da, rr] of [[-w * 0.95, r * 0.76], [-w * 0.45, r], [w * 0.45, r], [w * 0.95, r * 0.76]]) pts.push([cx + Math.cos(a + da) * rr, cy + Math.sin(a + da) * rr]);
  }
  return straight(pts);
}

// ---- the final picture: layers, style, defs (lamp, materials) ------------------------
function scene({ uid, parts, css = '', defs = '' }) {
  const body = ORDER.map(p => `<g data-part="${p}">${parts[p] || ''}</g>`).join('');
  return `<svg data-toyshop="${uid}" viewBox="0 0 300 300" data-fit="0 0 300 300" data-hit="10 10 280 280" xmlns="http://www.w3.org/2000/svg">
    <style>[class^="${uid}-"]{transform-box:fill-box;transform-origin:50% 50%}
    ${css}
    @media (prefers-reduced-motion: reduce){svg.is-playing *{animation-duration:.01s!important;animation-iteration-count:1!important;animation-delay:0s!important}}</style>
    <defs>
      <radialGradient id="${uid}-vig" cx=".5" cy=".42" r=".75">
        <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0402" stop-opacity=".7"/>
      </radialGradient>
      <linearGradient id="${uid}-mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9c8d2"/><stop offset=".5" stop-color="${C.mirror}"/><stop offset="1" stop-color="#5d6f7c"/></linearGradient>
      <linearGradient id="${uid}-goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".35" stop-color="${C.gold}"/><stop offset=".7" stop-color="${C.goldD}"/><stop offset="1" stop-color="#d9a842"/></linearGradient>
      <linearGradient id="${uid}-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f4f7"/><stop offset=".5" stop-color="${C.steel}"/><stop offset="1" stop-color="${C.steelD}"/></linearGradient>
      <linearGradient id="${uid}-tinR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.redD}"/><stop offset=".3" stop-color="#ff5a60"/><stop offset=".42" stop-color="${C.red}"/><stop offset="1" stop-color="${C.redD}"/></linearGradient>
      <linearGradient id="${uid}-tinK" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".3" stop-color="#4a4858"/><stop offset=".45" stop-color="${C.black}"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="${uid}-tinB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c3a78"/><stop offset=".3" stop-color="#5a8ae0"/><stop offset=".42" stop-color="${C.jackB}"/><stop offset="1" stop-color="#1c3a78"/></linearGradient>
      <radialGradient id="${uid}-tinS" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffe4cf"/><stop offset=".5" stop-color="${C.skin}"/><stop offset="1" stop-color="${C.skinD}"/></radialGradient>
      <radialGradient id="${uid}-porc" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${C.porc}"/><stop offset="1" stop-color="${C.porcD}"/></radialGradient>
      <radialGradient id="${uid}-glass" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
      <filter id="${uid}-dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${BLUR_BACK}"/></filter>
      <filter id="${uid}-soft" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="2.4"/></filter>
      <filter id="${uid}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="${uid}-wood" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.45" numOctaves="3" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0.6 0 0 0 0.62  0.6 0 0 0 0.62  0.6 0 0 0 0.62  0 0 0 0 1" result="g"/>
        <feBlend in="SourceGraphic" in2="g" mode="multiply" result="m"/>
        <feComposite in="m" in2="SourceAlpha" operator="in"/>
      </filter>
      <filter id="${uid}-felt" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0.4 0 0 0 0.8  0.4 0 0 0 0.8  0.4 0 0 0 0.8  0 0 0 0 1" result="g"/>
        <feBlend in="SourceGraphic" in2="g" mode="multiply" result="m"/>
        <feComposite in="m" in2="SourceAlpha" operator="in" result="c"/>
        <feDisplacementMap in="c" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="${uid}-yarn" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      ${defs}
    </defs>
    ${body}
  </svg>`;
}

function kit(seed) {
  const uid = 'tt' + (++seq), R = rng(seed || 1);
  const parts = {};
  let defs = '', nDef = 0;
  const rnd = (a, b) => a + R() * (b - a);
  const add = (part, s) => { parts[part] = (parts[part] || '') + s; return s; };
  const F = n => ` filter="url(#${uid}-${n})"`;
  const U = n => `url(#${uid}-${n})`;
  const cls = name => `${uid}-${name}`;
  const g = (name, inner, extra = '') => `<g class="${cls(name)}"${extra}>${inner}</g>`;
  const place = (x, y, s, inner, o = {}) => `<g transform="translate(${f1(x)} ${f1(y)})${o.rot ? ` rotate(${o.rot})` : ''} scale(${o.flip ? -s : s} ${s})"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>${inner}</g>`;
  function radial(color, op = 0.8, o = {}) {
    const id = `${uid}-r${++nDef}`;
    defs += `<radialGradient id="${id}" cx="${o.cx == null ? 0.5 : o.cx}" cy="${o.cy == null ? 0.5 : o.cy}" r="${o.r || 0.5}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/>` +
      (o.mid ? `<stop offset=".45" stop-color="${o.mid}" stop-opacity="${op * 0.3}"/>` : '') + `<stop offset="1" stop-color="${o.mid || color}" stop-opacity="0"/></radialGradient>`;
    return `url(#${id})`;
  }
  function linear(stops, o = {}) {
    const id = `${uid}-l${++nDef}`;
    const st = stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('');
    defs += `<linearGradient id="${id}" x1="0" y1="0" x2="${o.h ? 1 : 0}" y2="${o.h ? 0 : 1}">${st}</linearGradient>`;
    return `url(#${id})`;
  }
  function clip(inner) {
    const id = `${uid}-c${++nDef}`;
    defs += `<clipPath id="${id}">${inner}</clipPath>`;
    return `url(#${id})`;
  }
  const glow = (cx, cy, r, color, op = 0.7, ry = r) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(ry)}" fill="${radial(color, op)}"/>`;
  const shadow = (cx, y, w, op = 0.55) => `<ellipse cx="${f1(cx)}" cy="${f1(y + 1)}" rx="${f1(w)}" ry="${f1(Math.max(2.4, w * 0.13))}" fill="${C.shadow}" opacity="${op}"${F('soft')}/>`;
  // one tap rule + its keyframes for a class group (total must stay <= PLAY)
  function anim(name, frames, o = {}) {
    const { dur = PLAY, delay = 0, ease = 'ease-in-out', count = 1 } = o;
    return `svg.is-playing .${cls(name)}{animation:${cls(name)}-k ${(+dur).toFixed(2)}s ${ease} ${(+delay).toFixed(2)}s ${count} both}@keyframes ${cls(name)}-k{${frames}}`;
  }
  const origin = (name, o) => `.${cls(name)}{transform-origin:${o}}`;
  // the tin key spins round its stem: seen from the front the wings squash to
  // a line and open again (scaleY = cos), the back face (shade) shows for the
  // second half of every turn
  function spin(name, turns = 4, turn = 0.6, delay = 0) {
    const N = 16;
    let a = '', b = '';
    for (let i = 0; i <= N; i++) {
      const t = i / N * Math.PI * 2, pc = (i / N * 100).toFixed(2);
      a += `${pc}%{transform:scaleY(${Math.cos(t).toFixed(3)})}`;
      b += `${pc}%{opacity:${Math.sin(t) < -0.01 ? (0.35 + 0.25 * Math.abs(Math.sin(t))).toFixed(2) : 0}}`;
    }
    return `svg.is-playing .${cls(name)}{animation:${cls(name)}-k ${turn}s linear ${delay}s ${turns} both}@keyframes ${cls(name)}-k{${a}}` +
      `svg.is-playing .${cls(name)}-sh{animation:${cls(name)}-s ${turn}s linear ${delay}s ${turns} both}@keyframes ${cls(name)}-s{${b}}`;
  }
  const sparkle = (x, y, r, fill = '#fff6c8') => {
    let d = '';
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; d += (i ? 'L' : 'M') + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr); }
    return `<path d="${d}Z" fill="${fill}"/>`;
  };
  const note = (fill = C.gold) => `<path d="M0 0v-8l5-1.4v8" fill="none" stroke="${fill}" stroke-width="1.1"/><ellipse cx="-1.6" cy="0" rx="2" ry="1.5" fill="${fill}"/><ellipse cx="3.4" cy="-1.4" rx="2" ry="1.5" fill="${fill}"/>`;
  // gold notes rising from (x, y) on the tap; returns the css
  function notes(part, pts, o = {}) {
    let css = '';
    pts.forEach(([x0, y0], i) => {
      const nm = `nt${o.tag || ''}${i}`, d = (o.delay || 0.2) + i * (o.step || 0.3), dx = (i % 2 ? 1 : -1) * (8 + i * 3), rise = o.rise || 60;
      add(part, `<g transform="translate(${f1(x0)} ${f1(y0)}) scale(${o.s || 1})"><g class="${cls(nm)}" opacity="0">${note(o.fill)}</g></g>`);
      css += anim(nm, `0%{opacity:0;transform:scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(${dx}px,${-rise}px) scale(1.1) rotate(${dx}deg)}`, { dur: 1.2, delay: d, ease: 'ease-out' });
    });
    return css;
  }
  // twinkling sparkles (hidden at rest); returns the css
  function twinkles(part, pts, o = {}) {
    let css = '';
    pts.forEach(([x, y, r], i) => {
      const nm = `tw${o.tag || ''}${i}`;
      add(part, g(nm, sparkle(x, y, r || 4, o.fill), ' opacity="0"'));
      css += anim(nm, '0%,100%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(1.15) rotate(20deg)}70%{opacity:.6;transform:scale(.8)}', { dur: o.dur || 1.1, delay: (o.delay || 0.1) + i * (o.step || 0.18) });
    });
    return css;
  }

  // ---- room ----------------------------------------------------------------------------------
  // dark warm wallpaper with stripes, faint gold dots, the lamp's glow
  function wall(part, o = {}) {
    const col = o.color || C.wall, st = o.stripe || C.stripe;
    let w = `<rect width="300" height="300" fill="${col}"/>`;
    for (let x = 6; x < 300; x += 22) w += `<rect x="${x}" y="0" width="7" height="300" fill="${st}" opacity=".6"/>`;
    if (o.dots !== false) for (let x = 20.5; x < 300; x += 22) for (let y = 14 + ((x / 22) % 2) * 18; y < 300; y += 36) w += `<path d="M${f1(x)} ${y - 3}L${f1(x + 2)} ${y}L${f1(x)} ${y + 3}L${f1(x - 2)} ${y}Z" fill="${C.gold}" opacity=".12"/>`;
    const [lx, ly] = o.lamp || [0.5, 0.05];
    w += `<rect width="300" height="300" fill="${radial(o.glow || C.lamp, o.glowOp || 0.55, { cx: lx, cy: ly, r: 0.85, mid: '#f0a050' })}"/>`;
    return add(part, w);
  }
  // the back shelf, out of focus: teddy, boxes, a jack-in-the-box, a ball, a top
  function backShelf(part, y = 108, o = {}) {
    let b = '';
    b += `<path d="${sq(-4, 112, 304, 122)}" fill="${C.woodD}"/><path d="${sq(-4, 108, 304, 112)}" fill="${C.wood}"/>`;
    b += `<ellipse cx="38" cy="92" rx="15" ry="16" fill="#8a5a32"/><circle cx="38" cy="68" r="11" fill="#8a5a32"/><circle cx="29" cy="59" r="4.5" fill="#8a5a32"/><circle cx="47" cy="59" r="4.5" fill="#8a5a32"/><ellipse cx="38" cy="71" rx="5" ry="3.6" fill="#c49a6a"/>`;
    for (const [x, yy, w, h, c] of [[70, 76, 30, 32, '#3d6fa8'], [74, 56, 22, 20, '#d9a43a'], [104, 84, 26, 24, '#7a3d8a'], [134, 70, 18, 38, '#3f8a4f']]) b += `<path d="${sq(x, yy, x + w, yy + h)}" fill="${c}"/>`;
    b += `<path d="${sq(196, 78, 222, 108)}" fill="#2f6fd0"/><circle cx="204" cy="90" r="3.5" fill="#f2a23a"/><circle cx="214" cy="100" r="3" fill="#ffd23a"/><circle cx="212" cy="86" r="2.6" fill="#3fbf6a"/>`;
    b += `<path d="${sq(194, 73, 224, 78)}" fill="#245ab0"/><circle cx="209" cy="62" r="9" fill="${C.skin}"/><path d="M200 58Q209 40 219 58Z" fill="#3fbf6a"/><circle cx="209" cy="64" r="2.6" fill="${C.red}"/>`;
    b += `<circle cx="262" cy="94" r="14" fill="#d23a3a"/><path d="M248 94Q262 86 276 94" stroke="#f4efe6" stroke-width="3" fill="none"/>`;
    b += `<rect x="168" y="96" width="18" height="12" rx="3" fill="#e0b04a"/><path d="M160 108L166 92H176L182 108Z" fill="#c45a8a" opacity=".9"/>`;
    const tr = `translate(${o.dx || 0} ${y - 108})${o.flip ? ' translate(300 0) scale(-1 1)' : ''}`;
    return add(part, `<g${F('dof')} opacity="${o.opacity == null ? 1 : o.opacity}"><g transform="${tr}">${b}</g></g>`);
  }
  // a front shelf plank: lit top face, darker front edge, wood grain
  function shelf(part, y = 224, o = {}) {
    const x0 = o.x0 == null ? -4 : o.x0, x1 = o.x1 == null ? 304 : o.x1, th = o.th || 16;
    return add(part, `<path d="${sq(x0, y - 2, x1, y + 8)}" fill="${C.woodL}"${F('wood')}/><path d="${sq(x0, y + 8, x1, y + 8 + th)}" fill="${C.wood}"${F('wood')}/>` +
      `<rect x="${x0}" y="${y + 8}" width="${x1 - x0}" height="1.2" fill="#f0b47a" opacity=".6"/><rect x="${x0}" y="${y + 6 + th}" width="${x1 - x0}" height="2" fill="${C.woodD}"/>`);
  }
  // the dark space under a shelf, with blurred toys
  function under(part, y = 244) {
    return add(part, `<g${F('dof')}><rect x="-4" y="${y}" width="308" height="${304 - y}" fill="${C.wallD}"/><rect x="30" y="${y + 24}" width="46" height="18" rx="6" fill="#7a2a20"/><circle cx="40" cy="${y + 44}" r="6" fill="#111"/><circle cx="66" cy="${y + 44}" r="6" fill="#111"/><circle cx="200" cy="${y + 38}" r="12" fill="#2f5a8a"/></g>`);
  }
  // floorboards in perspective from y0 down
  function floorboards(part, y0 = 200, o = {}) {
    let f = `<rect x="-4" y="${y0}" width="308" height="${304 - y0}" fill="${o.color || C.wood}"${F('wood')}/>`;
    for (let i = -6; i <= 6; i++) f += `<path d="M${150 + i * 26} ${y0}L${150 + i * 70} 304" stroke="${C.woodD}" stroke-width="1.4" opacity=".7"/>`;
    for (const [yy, op] of [[y0 + 18, 0.35], [y0 + 46, 0.3], [y0 + 84, 0.25]]) if (yy < 300) f += `<path d="M-4 ${yy}H304" stroke="${C.woodD}" stroke-width=".8" opacity="${op}"/>`;
    f += `<rect x="-4" y="${y0}" width="308" height="3" fill="${C.woodD}" opacity=".6"/>`;
    return add(part, f);
  }
  // an arched shop window: night sky with the moon, or dawn
  function shopWindow(part, x, y, w, h, o = {}) {
    const sky = o.dawn ? linear(['#6a7ab8', '#f2a98a', C.dawnL]) : linear([C.night, C.nightL]);
    const r = w / 2;
    const arch = `M${x} ${y + h}V${f1(y + r)}A${f1(r)} ${f1(r)} 0 0 1 ${x + w} ${f1(y + r)}V${y + h}Z`;
    let s = `<path d="${arch}" fill="${C.woodD}" transform="translate(0 0)"/>`;
    const ix = x + 5, iw = w - 10, ir = iw / 2;
    const inner = `M${ix} ${y + h - 4}V${f1(y + 5 + ir)}A${f1(ir)} ${f1(ir)} 0 0 1 ${ix + iw} ${f1(y + 5 + ir)}V${y + h - 4}Z`;
    s += `<path d="${inner}" fill="${sky}"/>`;
    const cp = clip(`<path d="${inner}"/>`);
    let v = '';
    if (o.dawn) {
      v += glow(x + w * 0.5, y + h - 8, w * 0.7, '#fff0c0', 0.9) + `<circle cx="${f1(x + w * 0.5)}" cy="${f1(y + h - 6)}" r="${f1(w * 0.14)}" fill="#fff2c8"/>`;
      v += `<path d="M${x} ${y + h - 14}Q${x + w * 0.3} ${y + h - 24} ${x + w * 0.55} ${y + h - 16}T${x + w} ${y + h - 18}V${y + h}H${x}Z" fill="#6a5a8a" opacity=".7"/>`;
    } else {
      v += glow(x + w * 0.68, y + h * 0.3, w * 0.4, C.moon, 0.5) + `<circle cx="${f1(x + w * 0.68)}" cy="${f1(y + h * 0.3)}" r="${f1(w * 0.12)}" fill="${C.moon}"/><circle cx="${f1(x + w * 0.72)}" cy="${f1(y + h * 0.27)}" r="${f1(w * 0.11)}" fill="${C.night}" opacity=".0"/>`;
      for (let i = 0; i < 9; i++) v += `<circle cx="${f1(x + 8 + R() * (w - 16))}" cy="${f1(y + 10 + R() * h * 0.6)}" r="${f1(0.5 + R() * 0.8)}" fill="#fff" opacity="${f1(0.5 + R() * 0.5)}"/>`;
      // rooftops across the street
      v += `<path d="M${x} ${y + h}V${y + h - 22}H${x + w * 0.25}V${y + h - 34}L${x + w * 0.35} ${y + h - 44}L${x + w * 0.45} ${y + h - 34}V${y + h - 26}H${x + w * 0.7}V${y + h - 38}H${x + w * 0.8}V${y + h - 28}H${x + w}V${y + h}Z" fill="#0e1330"/>`;
      v += `<rect x="${f1(x + w * 0.29)}" y="${y + h - 30}" width="3" height="4" fill="#ffd27a" opacity=".8"/><rect x="${f1(x + w * 0.73)}" y="${y + h - 33}" width="3" height="4" fill="#ffd27a" opacity=".7"/>`;
    }
    s += `<g clip-path="${cp}">${o.inner || ''}${v}</g>`;
    s += `<path d="M${f1(x + w / 2)} ${y + 5}V${y + h - 4}M${ix} ${f1(y + h * 0.55)}H${ix + iw}" stroke="${C.woodD}" stroke-width="2.4"/>`;
    s += `<rect x="${x - 4}" y="${y + h - 2}" width="${w + 8}" height="6" fill="${C.woodL}"${F('wood')}/>`;
    return add(part, s);
  }
  // a hanging lamp (shade + warm bulb + its pool of light)
  function lamp(part, x, y, o = {}) {
    let l = `<path d="M${x} -4V${y - 14}" stroke="#2a1a10" stroke-width="1.4"/>`;
    l += glow(x, y + 30, 90, C.lamp, o.op || 0.35, 70);
    l += `<path d="M${x - 22} ${y}Q${x} ${y - 24} ${x + 22} ${y}Z" fill="#2f5a3a"/><path d="M${x - 22} ${y}Q${x} ${y - 24} ${x + 22} ${y}" fill="none" stroke="${C.gold}" stroke-width="1.2"/>`;
    l += `<ellipse cx="${x}" cy="${y}" rx="22" ry="3.4" fill="#ffe7b0"/><ellipse cx="${x}" cy="${y + 2}" rx="6" ry="4" fill="#fff6dc"/>`;
    return add(part, l);
  }
  // lamplight: warm vignette and dust motes; dark / dawn overlays
  function light(part, o = {}) {
    let s = '';
    if (o.dark) s += `<rect width="300" height="300" fill="#05020a" opacity="${o.dark}"/>`;
    if (o.dawn) s += `<rect width="300" height="300" fill="${linear(['#fff0d0', '#ffb88a', '#7a6aa8'], { h: true })}" opacity=".16"/>`;
    s += `<rect width="300" height="300" fill="url(#${uid}-vig)"/>`;
    const n = o.motes == null ? 9 : o.motes;
    for (let i = 0; i < n; i++) s += `<circle cx="${f1(110 + R() * 90)}" cy="${f1(20 + R() * 120)}" r="${f1(0.5 + R() * 0.7)}" fill="${C.lamp}" opacity="${f1(0.3 + R() * 0.4)}"/>`;
    return add(part, s);
  }

  // ---- props -----------------------------------------------------------------------------
  const gear = (cx, cy, r, o = {}) => `<path d="${gearD(cx, cy, r, o.n || 10)}" fill="${o.fill || U('goldV')}" stroke="${C.goldD}" stroke-width="${f1(Math.max(0.4, r * 0.06))}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.5)}" fill="none" stroke="${C.goldD}" stroke-width="${f1(r * 0.08)}" opacity=".7"/><circle cx="${cx}" cy="${cy}" r="${f1(r * 0.2)}" fill="${o.hole || '#3a1a0c'}"/>`;
  // the music box's butterfly winding key, stem end at the local origin, wings to the right
  const windKey = (x, y, s = 1) => place(x, y, s, `<rect x="0" y="-1.2" width="5" height="2.4" fill="${C.goldD}"/>` +
    `<path d="M4 0C4 -8 14 -10 14 -4C14 -1.5 10 -.6 7 0C10 .8 14 1.7 14 4.2C14 10.2 4 8.2 4 0Z" fill="${U('goldV')}" stroke="${C.goldD}" stroke-width=".6"/><circle cx="10" cy="-3.6" r="1.2" fill="#3a1a0c"/><circle cx="10" cy="3.8" r="1.2" fill="#3a1a0c"/>`);
  // the comb's missing tooth: a little steel bar with a shine, centred
  const combTooth = (x, y, s = 1, rot = 0) => place(x, y, s, `<path d="${rbox(-10, -1.4, 10, 1.4, 1.2)}" fill="${U('steel')}" stroke="${C.steelD}" stroke-width=".4"/><rect x="-8" y="-.9" width="12" height=".5" fill="#fff" opacity=".8"/>`, { rot });
  const marble = (x, y, r, col) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}"/><path d="M${f1(x - r * 0.6)} ${f1(y + r * 0.1)}Q${f1(x)} ${f1(y - r * 0.5)} ${f1(x + r * 0.6)} ${f1(y + r * 0.2)}" stroke="#fff" stroke-width="${f1(r * 0.22)}" fill="none" opacity=".45"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${U('glass')}"/>`;
  // a cotton reel, base centre at the origin
  const spool = (x, y, s, col) => place(x, y, s, `<rect x="-14" y="-6" width="28" height="6" rx="1.5" fill="${C.woodL}"${F('wood')}/><rect x="-11" y="-34" width="22" height="28" fill="${col}"/>` +
    Array.from({ length: 9 }, (_, i) => `<path d="M-11 ${-32 + i * 3}H11" stroke="#000" stroke-width=".5" opacity=".18"/>`).join('') +
    `<rect x="-6" y="-34" width="3" height="28" fill="#fff" opacity=".18"/><rect x="-14" y="-40" width="28" height="6" rx="1.5" fill="${C.woodL}"${F('wood')}/>`);
  // a wooden letter block, base centre at the origin
  const block = (x, y, s, col, letter) => place(x, y, s, `<rect x="-14" y="-28" width="28" height="28" rx="2" fill="${col}"${F('wood')}/><path d="M14 -28L19 -32V-4L14 0Z" fill="${col}"/><path d="M14 -28L19 -32V-4L14 0Z" fill="#000" opacity=".3"/><path d="M-14 -28L-9 -32H19L14 -28Z" fill="${col}"/><path d="M-14 -28L-9 -32H19L14 -28Z" fill="#fff" opacity=".22"/>` +
    `<rect x="-11" y="-25" width="22" height="22" rx="1.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/>` +
    (letter ? `<text x="0" y="-9" font-size="17" font-weight="800" font-family="Georgia, serif" text-anchor="middle" fill="#fff" opacity=".9">${letter}</text>` : ''));

  // ---- the kid in pyjamas (feet centre at the origin, ~82 tall) -----------------------------
  // pose: { name, armsUp, reach (right arm up), point: 'up' | 'fwd' | 'down', open, sleep, flip, torch }
  function kid(x, y, s = 1, o = {}) {
    const n = o.name || 'kid';
    let w = '';
    for (const lx of [-8.5, 1]) {
      w += `<path d="${rbox(lx, -31, lx + 7.5, -4, 3)}" fill="${C.pj}"${F('felt')}/>`;
      w += `<path d="M${f1(lx + 3.75)} -30V-6" stroke="${C.pjL}" stroke-width="1.1" opacity=".55"/>`;
      w += `<ellipse cx="${f1(lx + 3.75)}" cy="-2.8" rx="5.6" ry="3.1" fill="${C.slipper}"${F('felt')}/><circle cx="${f1(lx + 6.5)}" cy="-4.6" r="1.6" fill="#f4d0dc"${F('felt')}/>`;
    }
    const armL = `<path d="${rbox(-17, -53, -10.5, -34, 3.2)}" fill="${C.pj}"${F('felt')}/><path d="M-13.75 -51V-36" stroke="${C.pjL}" stroke-width="1" opacity=".5"/><circle cx="-13.75" cy="-33" r="3.2" fill="${U('tinS')}"/>`;
    let armR = `<path d="${rbox(10.5, -53, 17, -34, 3.2)}" fill="${C.pj}"${F('felt')}/><path d="M13.75 -51V-36" stroke="${C.pjL}" stroke-width="1" opacity=".5"/><circle cx="13.75" cy="-33" r="3.2" fill="${U('tinS')}"/>`;
    if (o.torch) armR += `<g transform="translate(13.75 -31) rotate(90)"><path d="M-3 -2L-3 2L9 3.4L9 -3.4Z" fill="${C.jackR}"/><rect x="8.5" y="-4" width="3" height="8" rx="1" fill="${C.steel}"/></g>`;
    const rotL = o.armsUp ? 'rotate(160 -13.75 -51)' : '';
    const rotR = o.armsUp || o.reach || o.point === 'up' ? 'rotate(-160 13.75 -51)' : o.point === 'fwd' || o.torch ? 'rotate(-80 13.75 -51)' : o.point === 'down' ? 'rotate(-35 13.75 -51)' : '';
    w += `<g transform="${rotL}">${g(n + '-armL', armL)}</g>`;
    // the top: soft striped flannel, a collar and three buttons
    w += `<path d="${rbox(-12, -55, 12, -28, 7)}" fill="${C.pj}"${F('felt')}/>`;
    for (const sx of [-7.5, -2.5, 2.5, 7.5]) w += `<path d="M${sx} -53V-30" stroke="${C.pjL}" stroke-width="1.3" opacity=".55"/>`;
    w += `<rect x="-12" y="-31" width="24" height="3" rx="1.4" fill="${C.pjD}"/>`;
    w += `<path d="M-6 -55L0 -48.5L6 -55Z" fill="${C.pjL}"${F('felt')}/>`;
    for (const by of [-45, -39.5, -34]) w += `<circle cx="0" cy="${by}" r=".9" fill="#fff"/>`;
    w += `<g transform="${rotR}">${g(n + '-armR', armR)}</g>`;
    // head: ears, face, short hair with a tuft
    let h = '';
    h += `<circle cx="-12.6" cy="-66" r="3" fill="${C.skin}"/><circle cx="12.6" cy="-66" r="3" fill="${C.skin}"/>`;
    h += `<circle cx="0" cy="-67" r="13" fill="${U('tinS')}"/>`;
    h += `<path d="M-13.4 -66C-15 -84 15 -84 13.4 -66C12.4 -71 9.6 -74 5 -75C1.5 -71.5 -5.5 -71 -9.5 -73.5C-11.5 -71.5 -12.8 -69 -13.4 -66Z" fill="${C.hair}"${F('felt')}/>`;
    h += `<path d="M1 -79.5Q3.5 -86 8.5 -84" stroke="${C.hair}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-7 -76Q-2 -80 3 -77" stroke="${C.hairL}" stroke-width="1" fill="none" opacity=".6"/>`;
    for (const ex of [-4.6, 4.6]) {
      if (o.sleep) h += `<path d="M${ex - 1.8} -65.5Q${ex} -64 ${ex + 1.8} -65.5" stroke="${C.ink}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      else h += `<ellipse cx="${ex}" cy="-65.5" rx="1.6" ry="2" fill="${C.ink}"/><circle cx="${ex - 0.5}" cy="-66.3" r=".55" fill="#fff"/>`;
      h += `<path d="M${ex - 2} -70.2Q${ex} -71.3 ${ex + 2} -70.2" stroke="${C.hairL}" stroke-width=".7" fill="none" stroke-linecap="round"/>`;
    }
    h += o.open ? `<ellipse cx="0" cy="-60.4" rx="1.8" ry="1.5" fill="#8a3030"/>` : `<path d="M-3.4 -61Q0 -58 3.4 -61" stroke="#a84048" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    h += `<circle cx="-8.2" cy="-61.8" r="2.2" fill="${C.cheek}" opacity=".28"/><circle cx="8.2" cy="-61.8" r="2.2" fill="${C.cheek}" opacity=".28"/>`;
    w += g(n + '-head', h);
    return place(x, y, s, g(n, w), o);
  }

  // ---- Button the rag doll (standing: feet at the origin; sit: seat on the edge) -------------
  // pose: { name, sit, sleep, wave (class group on the right arm), armsUp, flip }
  function button(x, y, s = 1, o = {}) {
    const n = o.name || 'btn', yb = o.sit ? 0 : -22;
    let d = '';
    for (const lx of [-9, 1]) {
      const y0 = o.sit ? -10 : -24, y1 = o.sit ? 34 : -3;
      d += `<path d="${rbox(lx, y0, lx + 8, y1, 4)}" fill="${C.lace}"${F('felt')}/>`;
      for (let yy = y0 + 4; yy < y1 - 3; yy += 6.5) d += `<rect x="${lx}" y="${f1(yy)}" width="8" height="3.2" fill="${C.sock}" opacity=".9"/>`;
      d += `<ellipse cx="${lx + 4}" cy="${f1(y1 + 0.6)}" rx="6.2" ry="3.8" fill="${C.black}"${F('felt')}/>`;
    }
    // felt dress with paler stripes, lace collar
    const dress = `M-18 ${yb}C-20 ${yb - 16} -14 ${yb - 34} 0 ${yb - 36}C14 ${yb - 34} 20 ${yb - 16} 18 ${yb}Z`;
    const cp = clip(`<path d="${dress}"/>`);
    d += `<path d="${dress}" fill="${C.felt}"${F('felt')}/>`;
    let st = '';
    for (let yy = yb - 30; yy < yb; yy += 6) st += `<rect x="-22" y="${yy}" width="44" height="1.6" fill="${C.feltL}" opacity=".7"/>`;
    d += `<g clip-path="${cp}">${st}</g>`;
    d += `<path d="M-17.5 ${yb - 1.5}Q0 ${yb + 2.5} 17.5 ${yb - 1.5}" stroke="${C.lace}" stroke-width="1.6" fill="none" stroke-dasharray="2 1.4" opacity=".8"/>`;
    let collar = '';
    for (let i = 0; i < 7; i++) collar += `<circle cx="${f1(-12 + i * 4)}" cy="${f1(yb - 35.5 + Math.sin(i / 6 * Math.PI) * 2.4)}" r="3"/>`;
    d += `<g fill="${C.lace}"${F('felt')}>${collar}</g>`;
    const armL = `<path d="${rbox(-23, yb - 34, -15, yb - 12, 4)}" fill="${C.skin}"${F('felt')}/>`;
    const armR = `<path d="${rbox(15, yb - 34, 23, yb - 12, 4)}" fill="${C.skin}"${F('felt')}/>`;
    d += `<g transform="${o.armsUp ? `rotate(150 -19 ${yb - 32})` : `rotate(14 -19 ${yb - 34})`}">${g(n + '-armL', armL)}</g>`;
    d += `<g transform="${o.armsUp || o.wave ? `rotate(-150 19 ${yb - 32})` : `rotate(-14 19 ${yb - 34})`}">${g(n + '-armR', armR)}</g>`;
    // yarn hair: loops round the head, two bunches
    const hy = yb - 50;
    let yarn = '';
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (0.92 + i / 21 * 1.16), xx = Math.cos(a) * 15, yy = hy - 2 + Math.sin(a) * 15;
      yarn += `<path d="M${f1(xx)} ${f1(yy)}q${f1(Math.cos(a) * 6 + (R() - 0.5) * 3)} ${f1(Math.sin(a) * 6 - 2)} ${f1(Math.cos(a + 0.4) * 2)} ${f1(Math.sin(a + 0.4) * 4 + 3)}" stroke="${i % 3 ? C.yarn : C.yarnD}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }
    let bunches = '';
    for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) bunches += `<path d="M${sd * 15} ${hy - 4}q${sd * (6 + k)} ${4 + k * 2} ${f1(sd * (2 + k * 0.8))} ${f1(14 + k * 1.6)}" stroke="${k % 2 ? C.yarn : C.yarnD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    let h = `<g${F('yarn')}>${yarn}${g(n + '-hair', bunches)}</g>`;
    h += `<circle cx="0" cy="${hy}" r="14.5" fill="${C.skin}"${F('felt')}/>`;
    // friendly embroidered face: small dark oval eyes with a light catch,
    // soft brows, a little solid smile, very faint cheeks
    for (const ex of [-5, 5]) {
      if (o.sleep) h += `<path d="M${ex - 1.8} ${hy - 1}Q${ex} ${hy + 0.6} ${ex + 1.8} ${hy - 1}" stroke="#3a2418" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      else h += `<ellipse cx="${ex}" cy="${hy - 1}" rx="1.7" ry="2.1" fill="#3a2418"/><circle cx="${ex - 0.5}" cy="${f1(hy - 1.8)}" r=".55" fill="#fff"/>`;
      h += `<path d="M${ex - 2} ${f1(hy - 5.4)}Q${ex} ${f1(hy - 6.4)} ${ex + 2} ${f1(hy - 5.4)}" stroke="${C.yarnD}" stroke-width=".7" fill="none" stroke-linecap="round"/>`;
    }
    h += `<path d="M-3.4 ${f1(hy + 4.6)}Q0 ${f1(hy + 7.6)} 3.4 ${f1(hy + 4.6)}" stroke="#c4505a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    h += `<circle cx="-7.5" cy="${f1(hy + 3.5)}" r="2" fill="${C.cheek}" opacity=".3"/><circle cx="7.5" cy="${f1(hy + 3.5)}" r="2" fill="${C.cheek}" opacity=".3"/>`;
    d += g(n + '-head', h);
    return place(x, y, s, g(n, d), o);
  }

  // ---- the tin soldier (base centre at the origin, ~100 tall) --------------------------------
  // pose: { name, salute, sleep, flip, tired (droops a little) }
  function soldier(x, y, s = 1, o = {}) {
    const n = o.name || 'so';
    let so = `<ellipse cx="0" cy="-2" rx="15" ry="3.6" fill="${C.black}"/><ellipse cx="-2" cy="-3" rx="9" ry="1.2" fill="#fff" opacity=".22"/>`;
    so += g(n + '-legL', `<rect x="-8" y="-20" width="7.2" height="18" rx="2" fill="${U('tinK')}"/>`);
    so += g(n + '-legR', `<rect x="0.8" y="-20" width="7.2" height="18" rx="2" fill="${U('tinK')}"/>`);
    let up = '';
    up += `<path d="${rbox(-15, -52, 15, -16, 6)}" fill="${U('tinR')}"/>`;
    up += `<path d="M-13 -48L13 -22M13 -48L-13 -22" stroke="${C.white}" stroke-width="3.6"/>`;
    up += `<rect x="-15" y="-28" width="30" height="4" fill="${C.black}"/><rect x="-3" y="-28.5" width="6" height="5" rx="1" fill="${C.gold}"/>`;
    for (const yy of [-44, -38, -33]) up += `<circle cx="0" cy="${yy}" r="1.2" fill="${C.gold}"/>`;
    up += `<path d="${rbox(-22, -50, -13.5, -24, 4)}" fill="${U('tinR')}"/><circle cx="-17.8" cy="-23" r="3.6" fill="${C.skin}"/>`;
    up += `<path d="M-15.5 -52h9M6.5 -52h9" stroke="${C.gold}" stroke-width="2" stroke-linecap="round"/>`;
    const armR = `<path d="${rbox(13.5, -50, 22, -24, 4)}" fill="${U('tinR')}"/><circle cx="17.8" cy="-23" r="3.6" fill="${C.skin}"/>`;
    up += `<g transform="${o.salute ? 'rotate(-150 17.8 -48)' : ''}">${g(n + '-armR', armR)}</g>`;
    // head and a simple painted smile (no cheeks)
    let hd = `<circle cx="0" cy="-60" r="9.5" fill="${U('tinS')}"/>`;
    for (const ex of [-3.5, 3.5]) {
      if (o.sleep || (o.wink && ex > 0)) hd += `<path d="M${ex - 1.6} -59.5Q${ex} -58.2 ${ex + 1.6} -59.5" stroke="${C.black}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      else hd += `<circle cx="${ex}" cy="-59.5" r="1.4" fill="${C.black}"/><circle cx="${ex + 0.4}" cy="-60" r=".45" fill="#fff"/>`;
    }
    hd += `<path d="M-3.2 -55.6Q0 -52.6 3.2 -55.6" stroke="${C.redD}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    // bearskin hat: tall, rounded, glossy black with a highlight streak and gold strap
    hd += `<path d="M-11 -62C-13 -78 -11 -96 0 -98C11 -96 13 -78 11 -62Z" fill="${U('tinK')}"/>`;
    hd += `<path d="M-7 -68C-8 -78 -7 -88 -3 -93" stroke="#fff" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/>`;
    hd += `<path d="M-9.5 -63Q0 -50 9.5 -63" stroke="${C.gold}" stroke-width="1.3" fill="none"/>`;
    up += g(n + '-head', hd);
    // wind-up key in his side: spins round its stem
    up += `<rect x="-28" y="-39.4" width="6" height="2" fill="${C.steelD}"/>`;
    const kd = 'M-27 -38.4C-27 -46 -36 -47.5 -36 -42.5C-36 -40.4 -32.5 -39.2 -30 -38.4C-32.5 -37.6 -36 -36.4 -36 -34.3C-36 -29.3 -27 -30.8 -27 -38.4Z';
    up += g(n + '-key', `<path d="${kd}" fill="${U('steel')}" stroke="${C.steelD}" stroke-width=".6"/><path class="${cls(n + '-key')}-sh" d="${kd}" fill="#3a3e48" opacity="0"/>`);
    so += `<g transform="${o.tired ? 'rotate(4 0 -20)' : ''}">${g(n + '-body', up)}</g>`;
    return place(x, y, s, g(n, so), o);
  }

  // ---- the jewellery-box ballerina (porcelain, pink tulle; feet at the origin, ~78 tall) -----
  // pose: { name, leap, armsOut, stand (gold pedestal, default true), flip }
  function ballerina(x, y, s = 1, o = {}) {
    const n = o.name || 'bal';
    let b = '';
    if (o.stand !== false && !o.leap) b += `<ellipse cx="0" cy="0" rx="11" ry="3.2" fill="${C.goldD}"/><ellipse cx="0" cy="-1.4" rx="11" ry="3" fill="${U('goldV')}"/>`;
    if (o.leap) {
      b += `<path d="M0 -34L24 -31" stroke="${C.tights}" stroke-width="3.2" stroke-linecap="round"/><path d="M0 -34L-22 -25" stroke="${C.tights}" stroke-width="3.2" stroke-linecap="round"/>`;
      b += `<ellipse cx="25.5" cy="-31" rx="2.6" ry="1.5" fill="${C.satin}"/><ellipse cx="-23.5" cy="-24.4" rx="2.6" ry="1.5" fill="${C.satin}" transform="rotate(-20 -23.5 -24.4)"/>`;
    } else {
      b += `<path d="M-1.7 -34L-1.2 -7Q0 -4.5 1.2 -7L1.7 -34Z" fill="${C.tights}"/>`;
      b += `<path d="M-1.4 -8L1.4 -8L1 -2.6L-1 -2.6Z" fill="${C.satin}"/><path d="M-1.4 -9L1.4 -6.4M1.4 -9L-1.4 -6.4" stroke="${C.tutuD}" stroke-width=".4"/>`;
      b += `<path d="M1 -32L9 -23L2.4 -17.5" stroke="${C.tights}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="2.2" cy="-17.4" rx="1.6" ry="1.2" fill="${C.satin}"/>`;
    }
    // tulle tutu: three translucent scalloped layers
    let tu = '';
    for (let k = 0; k < 3; k++) {
      const rx = 21 - k * 3, ry = 5.6 - k * 1.2, cy = -34 - k * 1.2, nS = 14;
      let d = '';
      for (let i = 0; i <= nS; i++) {
        const a = i / nS * Math.PI * 2, px = Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
        const am = (i + 0.5) / nS * Math.PI * 2, mx = Math.cos(am) * (rx + 2.4), my = cy + Math.sin(am) * (ry + 1.6);
        d += i ? `Q${f1(mx)} ${f1(my)} ${f1(Math.cos(a) * rx)} ${f1(py)}` : `M${f1(px)} ${f1(py)}`;
      }
      tu += `<path d="${d}Z" fill="${k === 2 ? C.tutuL : C.tutu}" opacity="${[0.75, 0.82, 0.9][k]}"/>`;
    }
    tu += `<path d="M-14 -35Q-6 -37 2 -36M4 -33Q10 -34 15 -32" stroke="#fff" stroke-width=".7" opacity=".55" fill="none"/>`;
    b += g(n + '-tutu', tu);
    // bodice with a satin sheen
    b += `<path d="M-5.5 -36C-6 -42 -5 -47 -4.5 -50L4.5 -50C5 -47 6 -42 5.5 -36Z" fill="${C.tutuD}"/><path d="M-3 -38C-3.4 -42 -3 -46 -2.4 -49" stroke="#fff" stroke-width="1" opacity=".4" fill="none"/>`;
    b += `<path d="M-4.5 -50L-3 -52M4.5 -50L3 -52" stroke="${C.tutuD}" stroke-width=".7"/>`;
    // porcelain arms: raised in a ring over the head, or open wide
    const arms = o.armsOut
      ? `<path d="M-4.5 -49Q-13 -51 -21 -46M4.5 -49Q13 -51 21 -46" stroke="${C.porc}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-6 -50Q-12 -52 -18 -48.5" stroke="#fff" stroke-width=".6" fill="none" opacity=".8"/>`
      : `<path d="M-4.5 -49C-13 -54 -11 -68 -2 -71M4.5 -49C13 -54 11 -68 2 -71" stroke="${C.porc}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-6 -51C-11 -55 -10 -64 -4 -68" stroke="#fff" stroke-width=".6" fill="none" opacity=".8"/>`;
    b += g(n + '-arms', arms);
    b += `<path d="${rbox(-1.6, -54, 1.6, -49, 1)}" fill="${C.porc}"/>`;
    let h = `<circle cx="0" cy="-58.5" r="7" fill="${U('porc')}"/>`;
    h += `<path d="M-7 -59C-7.4 -67 7.4 -67 7 -59C5 -63.5 -5 -63.5 -7 -59Z" fill="${C.bun}"/><circle cx="0" cy="-66.6" r="3.4" fill="${C.bun}"/><path d="M-2 -68Q0 -69.5 2 -68" stroke="#8a5a3a" stroke-width=".6" fill="none"/>`;
    h += `<circle cx="4" cy="-65" r="1.4" fill="${C.satin}"/><circle cx="4" cy="-65" r=".5" fill="#fff"/>`;
    for (const ex of [-2.4, 2.4]) h += `<ellipse cx="${ex}" cy="-58.2" rx=".9" ry="1.1" fill="${C.ink}"/><circle cx="${ex - 0.3}" cy="-58.6" r=".32" fill="#fff"/><path d="M${ex - 1.1} -60.6Q${ex} -61.2 ${ex + 1.1} -60.6" stroke="${C.bun}" stroke-width=".45" fill="none"/>`;
    h += `<path d="M-1.6 -55.6Q0 -54.3 1.6 -55.6" stroke="#c4505a" stroke-width=".7" fill="none" stroke-linecap="round"/>`;
    h += `<circle cx="-4" cy="-56" r="1.4" fill="${C.cheek}" opacity=".3"/><circle cx="4" cy="-56" r="1.4" fill="${C.cheek}" opacity=".3"/>`;
    h += `<ellipse cx="-2.6" cy="-62" rx="1.6" ry=".8" fill="#fff" opacity=".6"/>`;
    b += g(n + '-head', h);
    return place(x, y, s, g(n, b), o);
  }

  // ---- jack-in-the-box (base centre at the origin; open: spring + clown up) ----------------
  function jack(x, y, s = 1, o = {}) {
    const n = o.name || 'jk', H = o.spring || 40;
    let j = '';
    if (o.open) {
      j += `<path d="${straight([[-13, -46], [27, -46], [25, -84], [-15, -84]])}" fill="${C.jackY}"${F('wood')}/>` + sparkle(5, -65, 7, C.jackR);
      j += `<path d="${straight([[-20, -40], [20, -40], [27, -46], [-13, -46]])}" fill="#2a1408"/>`;
      // spring + head: the spring squashes, the head rides on top
      let sp = '';
      const top = -43 - H, turns = 7;
      let d = `M0 -43`;
      for (let i = 1; i <= turns * 2; i++) d += `L${i % 2 ? 7 : -7} ${f1(-43 - i * H / (turns * 2))}`;
      sp += `<path d="${d}" stroke="${C.steelD}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="${C.steel}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>`;
      j += g(n + '-spring', sp);
      let hd = '';
      for (let i = 0; i < 9; i++) hd += `<circle cx="${f1(-14 + i * 3.5)}" cy="${f1(top + Math.abs(i - 4) * 0.4)}" r="3.6" fill="${i % 2 ? C.white : C.jackR}"/>`;
      hd += `<circle cx="0" cy="${top - 12}" r="11" fill="${U('tinS')}"/>`;
      hd += `<circle cx="-3.8" cy="${top - 13}" r="1.3" fill="${C.ink}"/><circle cx="3.8" cy="${top - 13}" r="1.3" fill="${C.ink}"/><circle cx="-3.4" cy="${top - 13.5}" r=".4" fill="#fff"/><circle cx="4.2" cy="${top - 13.5}" r=".4" fill="#fff"/>`;
      hd += `<circle cx="0" cy="${top - 9.6}" r="2.6" fill="${C.red}"/><circle cx="-.8" cy="${top - 10.4}" r=".8" fill="#fff" opacity=".7"/>`;
      hd += `<path d="M-5 ${top - 6}Q0 ${top - 1.5} 5 ${top - 6}" stroke="#a84048" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
      hd += `<circle cx="-7" cy="${top - 8}" r="2" fill="${C.cheek}" opacity=".35"/><circle cx="7" cy="${top - 8}" r="2" fill="${C.cheek}" opacity=".35"/>`;
      hd += `<path d="M-10 ${top - 19}L0 ${top - 40}L10 ${top - 19}Z" fill="${C.jackB}"/><path d="M-6.5 ${top - 26}L0 ${top - 40}L3 ${top - 34}Z" fill="${C.jackY}" opacity=".9"/><circle cx="0" cy="${top - 41}" r="3" fill="${C.jackY}"/>`;
      hd += `<path d="M-10.5 ${top - 19}Q0 ${top - 15} 10.5 ${top - 19}" stroke="${C.jackY}" stroke-width="2" fill="none"/>`;
      j += g(n + '-head', hd);
    }
    // the box: painted front, side, (lid on top when closed), crank
    j += `<path d="${straight([[20, 0], [27, -6], [27, -46], [20, -40]])}" fill="${C.jackR}"${F('wood')}/>`;
    j += `<path d="${sq(-20, -40, 20, 0)}" fill="${C.jackB}"${F('wood')}/><rect x="-16" y="-36" width="32" height="32" fill="none" stroke="${C.jackY}" stroke-width="1.4"/>`;
    j += sparkle(0, -20, 11, C.jackY) + `<text x="23.5" y="-19" font-size="9" font-weight="800" font-family="Georgia, serif" text-anchor="middle" fill="${C.jackY}" transform="skewY(-40) translate(0 19)">J</text>`;
    if (!o.open) j += `<path d="${straight([[-20, -40], [20, -40], [27, -46], [-13, -46]])}" fill="${C.jackY}"${F('wood')}/>`;
    j += `<path d="M27 -24H33V-32" stroke="${C.steelD}" stroke-width="2" fill="none"/><circle cx="33" cy="-33" r="2.4" fill="${C.jackR}"/>`;
    return place(x, y, s, g(n, j), o);
  }

  // ---- the friendly shelf spider (body centre at the origin) --------------------------------
  function spider(x, y, s = 1, o = {}) {
    const n = o.name || 'sp';
    let sp = '';
    if (o.thread) sp += `<path d="M0 -14V${-14 - o.thread}" stroke="#f4efe6" stroke-width=".8" opacity=".8"/>`;
    let legs = '';
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
      if (o.wave && sd === 1 && i === 0) continue;
      legs += `<path d="M${sd * 6} ${-3 + i * 3}Q${sd * (17 + i)} ${-16 + i * 5} ${sd * (23 + i * 1.5)} ${-1 + i * 6}" stroke="${C.spiderD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
    sp += legs;
    if (o.wave) sp += g(n + '-wave', `<path d="M6 -3Q14 -12 20 -20" stroke="${C.spiderD}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="20.5" cy="-20.5" r="1.6" fill="${C.spiderD}"/>`);
    sp += `<ellipse cx="0" cy="7" rx="13" ry="11.5" fill="${C.spider}"${F('felt')}/>`;
    sp += `<path d="M-8 4Q0 0 8 4M-9 9Q0 5 9 9" stroke="${C.spiderL}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    let h = `<circle cx="0" cy="-6" r="9" fill="${C.spider}"${F('felt')}/>`;
    for (const ex of [-3.6, 3.6]) h += `<ellipse cx="${ex}" cy="-7" rx="2.7" ry="3.1" fill="#fff"/><circle cx="${ex * 0.9}" cy="-6.4" r="1.5" fill="${C.ink}"/><circle cx="${ex * 0.9 - 0.5}" cy="-7" r=".5" fill="#fff"/>`;
    h += `<path d="M-2.8 -1.6Q0 .8 2.8 -1.6" stroke="#f2c0d0" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    h += `<circle cx="-6" cy="-2.6" r="1.6" fill="${C.cheek}" opacity=".35"/><circle cx="6" cy="-2.6" r="1.6" fill="${C.cheek}" opacity=".35"/>`;
    h += `<path d="M0 -14.5L-5 -17.5V-11.5ZM0 -14.5L5 -17.5V-11.5Z" fill="${C.bow}"/><circle cx="0" cy="-14.5" r="1.4" fill="#ffb0c4"/>`;
    sp += g(n + '-head', h);
    return place(x, y, s, g(n, sp), o);
  }

  // ---- the wooden pull-along duck (base centre at the origin, facing right) -----------------
  function duck(x, y, s = 1, o = {}) {
    const n = o.name || 'dk';
    let d = '';
    if (o.string !== false) d += `<path d="M20 -8Q34 -4 44 -10" stroke="#e8d8b0" stroke-width=".9" fill="none"/>`;
    d += `<path d="${rbox(-20, -13, 20, -6, 2)}" fill="${C.woodL}"${F('wood')}/>`;
    for (const wx of [-13, 13]) d += g(n + (wx < 0 ? '-w0' : '-w1'), `<circle cx="${wx}" cy="-5" r="5" fill="${C.red}"/><circle cx="${wx}" cy="-5" r="1.6" fill="${C.gold}"/><path d="M${wx - 3.5} -5H${wx + 3.5}" stroke="${C.redD}" stroke-width=".8"/>`);
    let body = `<path d="M-19 -22L-27 -32L-14 -27Z" fill="${C.duck}"/>`;
    body += `<path d="M-20 -18C-22 -26 -14 -30 -2 -29C8 -28 16 -26 18 -20C19 -15 12 -12 0 -12C-12 -12 -19 -13 -20 -18Z" fill="${C.duck}"/>`;
    body += `<path d="M-10 -21C-4 -26 4 -25 8 -21C4 -17 -4 -16 -10 -21Z" fill="${C.duckD}"/>`;
    body += `<path d="M-14 -25Q-6 -28 2 -27" stroke="#fff" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>`;
    body += `<circle cx="11" cy="-34" r="8" fill="${C.duck}"/><path d="M18 -36L27 -34L18 -31Z" fill="${C.beak}"/>`;
    body += `<circle cx="13.5" cy="-36" r="1.3" fill="${C.ink}"/><circle cx="13.9" cy="-36.4" r=".4" fill="#fff"/><path d="M8 -39Q11 -41 13 -39.5" stroke="#fff" stroke-width="1" opacity=".5" fill="none"/>`;
    body += `<circle cx="15" cy="-31.5" r="1.4" fill="${C.cheek}" opacity=".35"/>`;
    d += g(n + '-body', body);
    return place(x, y, s, g(n, d), o);
  }

  // ---- the little grey clockwork mouse (base centre at the origin, facing right) -------------
  function mouse(x, y, s = 1, o = {}) {
    const n = o.name || 'ms';
    let m = '';
    m += g(n + '-tail', `<path d="M-16 -3C-26 -2 -30 -12 -22 -13C-18 -13.5 -18 -9 -21 -9" stroke="${C.mouseD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
    m += `<path d="M-17 0C-19 -10 -9 -18 3 -16C11 -14.5 17 -7 21 -2C17 0 -8 0 -17 0Z" fill="${C.mouse}"${F('felt')}/>`;
    m += `<path d="M-12 -4C-6 -9 4 -9 10 -5" stroke="#fff" stroke-width="1" opacity=".3" fill="none"/>`;
    m += `<circle cx="6" cy="-16" r="5" fill="${C.mouseD}"${F('felt')}/><circle cx="6" cy="-16" r="3" fill="${C.pink}"/>`;
    m += `<circle cx="12.5" cy="-9" r="1.2" fill="${C.ink}"/><circle cx="12.9" cy="-9.4" r=".4" fill="#fff"/>`;
    m += `<circle cx="21" cy="-2.6" r="1.6" fill="${C.pink}"/><path d="M19 -3.5L26 -6M19 -2.5L26.5 -2.5M19 -1.5L25.5 1" stroke="${C.ink}" stroke-width=".35" opacity=".7"/>`;
    m += `<path d="M14 -5.5Q15.5 -4.5 17 -5.5" stroke="${C.ink}" stroke-width=".5" fill="none"/>`;
    m += `<rect x="-5.5" y="-20" width="2" height="4" fill="${C.steelD}"/><path d="M-4.5 -20C-9 -20 -10 -26 -7 -26C-6 -26 -5 -24 -4.5 -22.5C-4 -24 -3 -26 -2 -26C1 -26 0 -20 -4.5 -20Z" fill="${U('steel')}" stroke="${C.steelD}" stroke-width=".4"/>`;
    m += `<circle cx="-8" cy="0" r="1.6" fill="${C.mouseD}"/><circle cx="10" cy="0" r="1.6" fill="${C.mouseD}"/>`;
    return place(x, y, s, g(n, m), o);
  }

  // ---- the shop cat (base centre at the origin, head to the left, ~170 wide) ------------------
  // pose: { name, awake, flip }
  function cat(x, y, s = 1, o = {}) {
    const n = o.name || 'cat';
    let c = '';
    // a ginger tabby lying in a loaf: one body with a rounded back and a
    // haunch, the head overlapping the front of the body (raised when awake,
    // resting low when asleep), front paws tucked, a white chest and muzzle,
    // tabby stripes that follow the curve of the back, a thick furry tail
    const fur = linear([C.catL, C.cat, C.cat, C.catD]);
    const furH = linear(['#f6b866', C.cat, '#b8692a']);
    const tailD = o.awake
      ? 'M62 -10C86 -12 98 -30 92 -50C89 -60 80 -62 78 -55'
      : 'M64 -4C56 6 10 8 -26 6C-38 5 -46 1 -50 -4';
    const tail = `<path d="${tailD}" stroke="${C.catD}" stroke-width="13" fill="none" stroke-linecap="round"/>` +
      `<path d="${tailD}" stroke="${C.cat}" stroke-width="10" fill="none" stroke-linecap="round"${F('felt')}/>` +
      (o.awake ? `<path d="M90 -36C92 -44 90 -52 86 -56M76 -16C82 -18 86 -21 89 -25" stroke="${C.catD}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".7"/>`
        : `<path d="M30 6V-1M10 7V0M-10 6.5V-.5" stroke="${C.catD}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
    if (o.awake) c += g(n + '-tail', tail);
    // body: chest low at the front, back rising to the shoulders, a dip, the round haunch
    c += `<path d="M-58 0C-64 -20 -54 -44 -30 -52C-8 -60 16 -54 32 -52C54 -50 74 -36 74 -14C74 -6 72 -2 70 0Z" fill="${fur}"${F('felt')}/>`;
    // the haunch, a softly shaded oval at the back
    c += `<path d="M30 -2C22 -20 30 -44 50 -44C66 -44 76 -28 72 -10C70 -4 66 -1 62 0Z" fill="${furH}" opacity=".9"${F('felt')}/>`;
    c += `<path d="M34 -4C30 -18 36 -36 50 -40" stroke="${C.catD}" stroke-width="1.6" fill="none" opacity=".45"/>`;
    // tabby stripes, curved over the back and round the haunch
    for (const [sx, sy, len, b] of [[-22, -52, 16, 6], [-6, -56, 18, 4], [10, -55, 18, 2], [26, -52, 16, 0]]) c += `<path d="M${sx} ${sy}q${b} ${len * 0.55} ${-2} ${len}" stroke="${C.catD}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    for (const [a, r] of [[-2.2, 22], [-1.7, 24], [-1.2, 22]]) c += `<path d="M${f1(52 + Math.cos(a) * (r - 8))} ${f1(-22 + Math.sin(a) * (r - 8))}L${f1(52 + Math.cos(a) * r)} ${f1(-22 + Math.sin(a) * r)}" stroke="${C.catD}" stroke-width="3.6" stroke-linecap="round" opacity=".6"/>`;
    // light along the top of the back
    c += `<path d="M-40 -46C-20 -56 10 -56 34 -50" stroke="#ffe2b0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>`;
    if (!o.awake) c += g(n + '-tail', tail);
    // white chest fluff and the tucked front paws
    c += `<path d="M-56 -2C-58 -18 -50 -30 -38 -32C-30 -26 -28 -12 -30 -2Z" fill="${C.lace}" opacity=".92"${F('felt')}/>`;
    for (const px of [-48, -26]) {
      c += `<ellipse cx="${px}" cy="-4.5" rx="12" ry="6" fill="${C.lace}"${F('felt')}/>`;
      c += `<path d="M${px - 5} -1.8V-5.2M${px} -1.2V-5.8M${px + 5} -1.8V-5.2" stroke="${C.catD}" stroke-width=".8" stroke-linecap="round" opacity=".55"/>`;
    }
    // head: wide cheeks with fur tufts, rounded ears, tabby "M" on the forehead
    const hx = o.awake ? -40 : -46, hy = o.awake ? -62 : -26;
    let h = '';
    for (const sd of [-1, 1]) {
      const ex = hx + sd * 16;
      h += `<path d="M${ex - sd * 9} ${hy - 12}C${ex - sd * 6} ${hy - 30} ${ex + sd * 2} ${hy - 34} ${ex + sd * 6} ${hy - 32}C${ex + sd * 9} ${hy - 26} ${ex + sd * 10} ${hy - 18} ${ex + sd * 9} ${hy - 10}Z" fill="${C.cat}"${F('felt')}/>`;
      h += `<path d="M${ex - sd * 4} ${hy - 14}C${ex - sd * 2} ${hy - 25} ${ex + sd * 2} ${hy - 28} ${ex + sd * 4} ${hy - 27}C${ex + sd * 6} ${hy - 22} ${ex + sd * 6} ${hy - 17} ${ex + sd * 5} ${hy - 12}Z" fill="${C.nose}" opacity=".55"/>`;
    }
    h += `<path d="M${hx - 26} ${hy + 4}C${hx - 30} ${hy - 8} ${hx - 22} ${hy - 22} ${hx} ${hy - 22}C${hx + 22} ${hy - 22} ${hx + 30} ${hy - 8} ${hx + 26} ${hy + 4}L${hx + 30} ${hy + 8}L${hx + 22} ${hy + 9}C${hx + 14} ${hy + 18} ${hx - 14} ${hy + 18} ${hx - 22} ${hy + 9}L${hx - 30} ${hy + 8}Z" fill="${fur}"${F('felt')}/>`;
    h += `<path d="M${hx - 7} ${hy - 20}L${hx - 4} ${hy - 13}L${hx} ${hy - 18}L${hx + 4} ${hy - 13}L${hx + 7} ${hy - 20}" stroke="${C.catD}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    h += `<path d="M${hx - 24} ${hy - 2}h6M${hx - 25} ${hy + 3}h6M${hx + 24} ${hy - 2}h-6M${hx + 25} ${hy + 3}h-6" stroke="${C.catD}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    // muzzle: white, two round whisker pads, small pink nose, a little "w" mouth
    h += `<path d="M${hx - 13} ${hy + 8}C${hx - 13} ${hy - 1} ${hx - 4} ${hy - 2} ${hx} ${hy + 2}C${hx + 4} ${hy - 2} ${hx + 13} ${hy - 1} ${hx + 13} ${hy + 8}C${hx + 10} ${hy + 15} ${hx - 10} ${hy + 15} ${hx - 13} ${hy + 8}Z" fill="${C.lace}"${F('felt')}/>`;
    h += `<path d="M${hx - 2.8} ${hy + 2.6}H${hx + 2.8}Q${hx + 2.6} ${hy + 4.6} ${hx} ${hy + 5.8}Q${hx - 2.6} ${hy + 4.6} ${hx - 2.8} ${hy + 2.6}Z" fill="${C.nose}"/>`;
    h += `<path d="M${hx} ${hy + 5.8}V${hy + 7.6}M${hx - 4} ${hy + 8.6}Q${hx - 2} ${hy + 10.2} ${hx} ${hy + 7.6}Q${hx + 2} ${hy + 10.2} ${hx + 4} ${hy + 8.6}" stroke="${C.ink}" stroke-width=".8" fill="none" stroke-linecap="round"/>`;
    for (const sd of [-1, 1]) for (const [dy, ey] of [[5, 1], [7.5, 7], [10, 13]]) h += `<path d="M${hx + sd * 8} ${hy + dy}Q${hx + sd * 20} ${hy + dy + (ey - 6) * 0.3 - 1} ${hx + sd * 32} ${hy + ey}" stroke="#fff" stroke-width=".55" fill="none" opacity=".8"/>`;
    // eyes: almond, green-gold, vertical pupils; asleep: soft closed curves
    let eyes = '';
    for (const sd of [-1, 1]) {
      const ex = hx + sd * 10, ey = hy - 6;
      if (o.awake) {
        eyes += `<path d="M${ex - 5.5} ${ey}Q${ex} ${ey - 6.5} ${ex + 5.5} ${ey}Q${ex} ${ey + 5.5} ${ex - 5.5} ${ey}Z" fill="${C.catEye}" stroke="${C.ink}" stroke-width=".9"/>`;
        eyes += `<ellipse cx="${ex}" cy="${ey}" rx="1.6" ry="3.6" fill="${C.ink}"/><circle cx="${ex - 1.5}" cy="${ey - 1.6}" r="1" fill="#fff"/>`;
      } else eyes += `<path d="M${ex - 5} ${ey - 1}Q${ex} ${ey + 3} ${ex + 5} ${ey - 1}" stroke="${C.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
    h += g(n + '-eyes', eyes);
    c += g(n + '-head', h);
    return place(x, y, s, g(n, c), o);
  }
  // the cat's front paw coming down from above (paw tip at the origin)
  function catPaw(x, y, s = 1, o = {}) {
    const n = o.name || 'paw';
    let p = `<path d="M-20 -260L-20 -16C-23 4 23 4 20 -16L20 -260Z" fill="${C.cat}"${F('felt')}/>`;
    for (const sy of [-160, -110, -62]) p += `<path d="M-20 ${sy}Q0 ${sy + 8} 20 ${sy}" stroke="${C.catD}" stroke-width="4.5" fill="none" opacity=".75"/>`;
    p += `<path d="M-16 -12C-18 0 18 0 16 -12" fill="${C.catL}"${F('felt')}/>`;
    p += `<path d="M-7 -6V-.8M0 -6V0M7 -6V-.8" stroke="${C.catD}" stroke-width="1" opacity=".7"/>`;
    return place(x, y, s, g(n, p), o);
  }

  // ---- the music box (base centre at the origin, ~92 wide; open lid up to -116) ---------------
  // o: { name, open (default true), missing: { key, gear, tooth }, tag: 'text', play }
  function musicBox(x, y, s = 1, o = {}) {
    const n = o.name || 'mb', miss = o.missing || {}, open = o.open !== false;
    let mb = '';
    if (open) {
      mb += `<path d="${straight([[-40, -52], [40, -52], [44, -116], [-44, -116]])}" fill="${C.box}"${F('wood')}/>`;
      mb += `<path d="${straight([[-35, -56], [35, -56], [38, -110], [-38, -110]])}" fill="${C.lidIn}"${F('wood')}/>`;
      mb += `<path d="${straight([[-29, -61], [29, -61], [31, -104], [-31, -104]])}" fill="${U('mirror')}"/>`;
      mb += `<path d="M-22 -66L-8 -100M-12 -64L0 -94" stroke="#fff" stroke-width="2" opacity=".25"/>`;
      mb += `<path d="${straight([[-46, -38], [46, -38], [40, -52], [-40, -52]])}" fill="${C.boxD}"${F('wood')}/>`;
      mb += `<path d="${straight([[-40, -48], [40, -48], [43, -40], [-43, -40]])}" fill="#3a1a0c"/>`;
      // gold cylinder with pins (the pins slide round when it plays)
      const cp = clip(`<rect x="-32" y="-48.5" width="40" height="9" rx="4.5"/>`);
      mb += `<rect x="-32" y="-48.5" width="40" height="9" rx="4.5" fill="${U('goldV')}"/>`;
      let pins = '';
      for (let i = 0; i < 24; i++) pins += `<circle cx="${f1(-38 + i * 2.2 + R())}" cy="${f1(-46.5 + R() * 5)}" r=".55" fill="#fff6c8"/>`;
      const pins2 = pins.replace(/cx="(-?[\d.]+)"/g, (m, v) => `cx="${f1(+v + 52.8)}"`);
      mb += `<g clip-path="${cp}">${g(n + '-pins', pins + pins2)}</g>`;
      mb += `<rect x="-36" y="-48" width="5" height="8" rx="1" fill="${C.goldD}"/><rect x="7" y="-48" width="5" height="8" rx="1" fill="${C.goldD}"/>`;
      // steel comb: base block plus teeth reaching over the cylinder
      mb += `<rect x="12" y="-49" width="22" height="9" rx="1" fill="${U('steel')}"/>`;
      let teeth = '';
      for (let i = 0; i < 9; i++) {
        if (miss.tooth && i === 4) { teeth += `<rect x="${f1(-2 + i * 0.4 + 6)}" y="${f1(-48.4 + i * 0.95)}" width="${f1(9 - i * 0.4)}" height=".75" fill="#3a1a0c" opacity=".6"/>`; continue; }
        teeth += `<rect x="${f1(-2 + i * 0.4)}" y="${f1(-48.4 + i * 0.95)}" width="${f1(15 - i * 0.4)}" height=".75" fill="${C.steel}"/>`;
      }
      mb += g(n + '-comb', teeth);
    } else {
      mb += `<path d="${straight([[-48, -44], [48, -44], [42, -56], [-42, -56]])}" fill="${C.boxL}"${F('wood')}/>`;
      mb += `<ellipse cx="0" cy="-50" rx="16" ry="3.6" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".8"/>` + sparkle(0, -50, 3, C.gold);
      mb += `<path d="${rbox(-48, -46, 48, -38, 2)}" fill="${C.box}"${F('wood')}/><rect x="-48" y="-46" width="96" height="1.4" fill="${C.boxL}"/>`;
    }
    // front face with a brass keyhole plate, a little gear window, a rounded rim
    mb += `<path d="${rbox(-46, -38, 46, 0, 3)}" fill="${C.box}"${F('wood')}/>`;
    mb += `<rect x="-46" y="-38" width="92" height="2.4" fill="${C.boxL}" opacity=".8"/><rect x="-46" y="-3" width="92" height="3" fill="${C.boxD}"/>`;
    mb += `<path d="M-40 -8Q0 -4 40 -8" stroke="${C.gold}" stroke-width=".7" fill="none" opacity=".6"/>`;
    mb += `<path d="${rbox(-7, -26, 7, -12, 2.5)}" fill="${U('goldV')}"/><circle cx="0" cy="-20.5" r="1.6" fill="${C.black}"/><path d="M-.7 -19.5h1.4l.6 4h-2.6z" fill="${C.black}"/>`;
    mb += `<circle cx="-28" cy="-20" r="9.4" fill="${U('goldV')}"/><circle cx="-28" cy="-20" r="7.6" fill="#2a140a"/>`;
    if (!miss.gear) mb += g(n + '-gear', gear(-28, -20, 6.4, { n: 9 }));
    mb += `<path d="M-33 -25A7 7 0 0 1 -24 -26" stroke="#fff" stroke-width="1.2" fill="none" opacity=".35"/>`;
    // rosette on the right of the front
    mb += sparkle(28, -20, 6, C.gold) + `<circle cx="28" cy="-20" r="1.6" fill="${C.goldD}"/>`;
    mb += `<path d="${straight([[46, -38], [52, -44], [52, -5], [46, 0]])}" fill="${C.boxD}"${F('wood')}/>`;
    // winding key on the side: turns by squashing across (seen edge-on)
    mb += `<rect x="52" y="-21" width="5" height="2.4" fill="${miss.key ? '#2a140a' : C.goldD}"/>`;
    if (!miss.key) mb += g(n + '-key', `<path d="M56 -19.8C56 -28 66 -30 66 -24C66 -21.5 62 -20.6 59 -19.8C62 -19 66 -18.1 66 -15.6C66 -9.6 56 -11.6 56 -19.8Z" fill="${U('goldV')}" stroke="${C.goldD}" stroke-width=".6"/>`);
    if (o.tag) {
      mb += `<path d="M-46 -30Q-58 -26 -62 -14" stroke="#e8d8b0" stroke-width=".8" fill="none"/>`;
      mb += `<g transform="rotate(-12 -64 -6)"><path d="M-76 -14H-58L-52 -6L-58 2H-76Z" fill="#f4e8cc"/><circle cx="-56" cy="-6" r="1.2" fill="${C.boxD}"/>` +
        `<text x="-67" y="-3.6" font-size="6.4" font-weight="800" font-family="Georgia, serif" text-anchor="middle" fill="${o.tagColor || C.redD}">${o.tag}</text></g>`;
    }
    return place(x, y, s, shadow(0, 0, 52) + g(n, mb), o);
  }

  function end({ css = '', defs: extra = '' } = {}) {
    return scene({ uid, parts, css, defs: defs + extra });
  }

  return {
    uid, R, rnd, C, PLAY, parts,
    add, F, U, cls, g, place, radial, linear, clip, glow, shadow, anim, origin, spin, sparkle, note, notes, twinkles, rbox, sq,
    wall, backShelf, shelf, under, floorboards, shopWindow, lamp, light,
    gear, windKey, combTooth, marble, spool, block,
    kid, button, soldier, ballerina, jack, spider, duck, mouse, cat, catPaw, musicBox, end
  };
}

window.TOYS = { C, PLAY, ORDER, kit, gearD, rbox };
})();
