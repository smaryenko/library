// THE LITTLE WIZARD'S LOST SPELLBOOK: the cut-paper kit (the approved style
// from books/preview/assets/js/papercut.js, moved into a book kit). Every
// shape is a separate piece of coloured card with a slightly uneven scissor
// edge (jittered smoothPath), faint paper grain and its own soft drop shadow
// (the `-pp` filter); gold parts are foil paper (the `-gold` gradient).
//
// window.PAPER = { C, PLAY, ORDER, kit(seed), scene({ uid, parts, css, defs, sky }) }
// kit(seed) gives one picture's toolbox (a fresh uid per call, so two
// pictures in the DOM never share ids or keyframes):
//   piece(part, pts, fill, { soft, j, flat })   add one card piece to a layer
//   p(...) the same but returns the string (for groups), disc, ring, box, star,
//   foil (a gold foil star), glow (soft radial light), g(name, inner) a class
//   group `${uid}-${name}`, place(x, y, s, inner, { rot, flip }),
//   anim(name, keyframes, { dur, delay, ease }) one tap rule + keyframes,
//   characters: wizard(x, y, s, pose), pip(x, y, s, pose), goldPage, spellbook,
//   castle; room pieces: wall, floor, archWindow, candle, torch, bottle,
//   bookRow, shelf, pine, hills.
//   end({ css, sky, defs }) returns the final <svg>.
// Every class group gets transform-box: fill-box and a centre origin by
// default, so tap motions work inside translated / scaled groups.
(function () {
'use strict';
const D = window.DRAWKIT;
const { rng, smoothPath, straight, f1 } = D;
// ---- tune by eye -------------------------------------------------------------
const PLAY = 2.4;                        // must stay under the engine's 2.5 s cap
const SHADOW = { dx: 1.1, dy: 1.8, blur: 1.5, opacity: 0.5 };
const GRAIN = 0.55;
const C = {
  sky0: '#130b33', sky1: '#3b2a78', glow: '#5d4aa3',
  far: '#4b3b90', farD: '#3e3080',
  castle: '#c9b9f0', castleD: '#a08cd9', roof: '#6b48ba', roofD: '#53379c', win: '#ffd76a',
  cloud: '#e6ddfb', cloudD: '#cbbdf2',
  near: '#2b1e5e', nearD: '#1f1548', tree: '#170f3c', treeD: '#120b30',
  robe: '#3c5cc6', robeD: '#2c459c', skin: '#f3c8a2', cheek: '#f29a8f', hair: '#7a4422',
  cat: '#ef8d2c', catD: '#c96b16', white: '#fbf4e6', eye: '#7fdc6a', ink: '#24163f',
  book: '#7d2f9e', bookD: '#5e2179', stone: '#8678b9', stoneD: '#685b9c', page: '#fff4d2',
  // rooms
  wall: '#3a2a72', wallD: '#2e2160', wallL: '#4a3a8a', lilac: '#b9a6ee', lilacD: '#9a84dc',
  floor: '#2a1d58', floorD: '#1e1444', wood: '#8a5634', woodD: '#653c22', woodL: '#a86d44',
  iron: '#4a4266', candle: '#fff1d0', candleD: '#e9d6ae', flame: '#ffd35e', flameD: '#ff9a3a',
  green: '#5fbf7a', greenD: '#3f9a5e', leaf: '#7fd38a', teal: '#4fc6c0', tealD: '#33a09c',
  pink: '#f07fb0', pinkD: '#c95a8c', red: '#e0605a', redD: '#b94642', blue: '#5aa0e8', blueD: '#3d7cc4',
  goblin: '#94cf6a', goblinD: '#6fa84c', dragon: '#4fb89a', dragonD: '#358c74', belly: '#f6dc9a',
  glass: '#8fa6e8', cookie: '#d99a52', cookieD: '#a86a2c', choc: '#5a3420', brass: '#d8a94a', brassD: '#a87a2a'
};
const ORDER = ['pp-sky', 'pp-moon', 'pp-far', 'pp-castle', 'pp-cloud', 'pp-near', 'pp-trees', 'pp-chars', 'pp-pages'];
let seq = 0;

// ---- the final picture: layers, style, defs (gold foil, sky, the paper filter) --------
function scene({ uid, parts, css = '', defs = '', sky = [C.sky0, C.sky1] }) {
  const body = ORDER.map(p => `<g data-part="${p}">${parts[p] || ''}</g>`).join('');
  return `<svg data-spellbook="${uid}" viewBox="0 0 300 300" data-fit="0 0 300 300" data-hit="10 10 280 280" xmlns="http://www.w3.org/2000/svg">
    <style>[class^="${uid}-"]{transform-box:fill-box;transform-origin:50% 50%}
    ${css}
    @media (prefers-reduced-motion: reduce){svg.is-playing *{animation-duration:.01s!important;animation-delay:0s!important}}</style>
    <defs>
      <linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
      </linearGradient>
      <linearGradient id="${uid}-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#9a7524"/><stop offset=".28" stop-color="#f7dd86"/><stop offset=".45" stop-color="#c2973a"/>
        <stop offset=".62" stop-color="#fff0b5"/><stop offset=".8" stop-color="#b1882f"/><stop offset="1" stop-color="#e9c96a"/>
      </linearGradient>
      <filter id="${uid}-pp" x="-15%" y="-15%" width="135%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
        <feDiffuseLighting in="n" surfaceScale="${GRAIN}" diffuseConstant="1.12" lighting-color="#ffffff" result="lt"><feDistantLight azimuth="235" elevation="62"/></feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="lt" operator="arithmetic" k1="1.06" k2="0" k3="0" k4="0" result="tex"/>
        <feComposite in="tex" in2="SourceAlpha" operator="in" result="card"/>
        <feGaussianBlur in="SourceAlpha" stdDeviation="${SHADOW.blur}" result="b"/>
        <feOffset in="b" dx="${SHADOW.dx}" dy="${SHADOW.dy}" result="bo"/>
        <feFlood flood-color="#0d0624" flood-opacity="${SHADOW.opacity}"/>
        <feComposite in2="bo" operator="in" result="sh"/>
        <feMerge><feMergeNode in="sh"/><feMergeNode in="card"/></feMerge>
      </filter>
      ${defs}
    </defs>
    ${body}
  </svg>`;
}

function kit(seed) {
  const uid = 'sb' + (++seq), R = rng(seed || 1);
  const parts = {};
  let defs = '', nDef = 0;
  const F = ` filter="url(#${uid}-pp)"`;
  const GOLD = `url(#${uid}-gold)`;
  const SKY = `url(#${uid}-sky)`;
  const rnd = (a, b) => a + R() * (b - a);
  const jit = (pts, a) => pts.map(([x, y]) => [x + (R() - 0.5) * a, y + (R() - 0.5) * a]);
  const dd = (pts, soft, j) => (soft ? smoothPath(jit(pts, j), true) : straight(jit(pts, j)));
  // one piece of card as a string: uneven edge, grain and its own shadow
  function p(pts, fill, o = {}) {
    const { soft = true, j = 0.5, flat = false, extra = '' } = o;
    return `<path d="${dd(pts, soft, j)}" fill="${fill}"${flat ? '' : F}${extra}/>`;
  }
  const add = (part, s) => { parts[part] = (parts[part] || '') + s; return s; };
  const piece = (part, pts, fill, o) => add(part, p(pts, fill, o));
  const ring = (cx, cy, rx, ry = rx, n = 16, a0 = 0) => Array.from({ length: n }, (_, i) => [cx + Math.cos(a0 + i / n * 6.2832) * rx, cy + Math.sin(a0 + i / n * 6.2832) * ry]);
  const disc = (cx, cy, r, fill, o = {}) => p(ring(cx, cy, r, o.ry || r, o.n || 16), fill, Object.assign({ j: r * 0.06 }, o));
  const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const star = (cx, cy, r, n = 4, k = 0.32) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.2832 - Math.PI / 2, rr = i % 2 ? r * k : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return pts;
  };
  const foil = (cx, cy, r, o = {}) => `<path d="${straight(star(cx, cy, r, o.n || 4, o.k || 0.32))}" fill="${o.fill || GOLD}"${o.flat ? '' : F}/>`;
  const cls = name => `${uid}-${name}`;
  const g = (name, inner, extra = '') => `<g class="${cls(name)}"${extra}>${inner}</g>`;
  const place = (x, y, s, inner, o = {}) => `<g transform="translate(${f1(x)} ${f1(y)})${o.rot ? ` rotate(${o.rot})` : ''} scale(${o.flip ? -s : s} ${s})"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>${inner}</g>`;
  function radial(color, op = 0.8) {
    const id = `${uid}-r${++nDef}`;
    defs += `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
    return `url(#${id})`;
  }
  function linear(c0, c1, horizontal = false) {
    const id = `${uid}-l${++nDef}`;
    defs += `<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
    return `url(#${id})`;
  }
  function clip(inner) {
    const id = `${uid}-c${++nDef}`;
    defs += `<clipPath id="${id}">${inner}</clipPath>`;
    return `url(#${id})`;
  }
  const glow = (cx, cy, r, color, op = 0.7, ry = r) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(ry)}" fill="${radial(color, op)}"/>`;
  // one tap rule + its keyframes for a class group (total must stay <= PLAY)
  function anim(name, frames, o = {}) {
    const { dur = PLAY, delay = 0, ease = 'ease-in-out' } = o;
    return `svg.is-playing .${cls(name)}{animation:${cls(name)}-k ${(+dur).toFixed(2)}s ${ease} ${(+delay).toFixed(2)}s both}@keyframes ${cls(name)}-k{${frames}}`;
  }
  const origin = (name, o) => `.${cls(name)}{transform-origin:${o}}`;

  // ---- the little wizard (feet centre at the local origin, ~88 units tall) ----------
  // pose: { flip, name, robe, wand (false = no wand), wandUp (raise the wand), open (open mouth) }
  function wizard(x, y, s = 1, o = {}) {
    const n = o.name || 'wiz', robe = o.robe || C.robe, robeD = o.robeD || C.robeD;
    let w = '';
    const W = (pts, fill, soft = true, j = 0.4) => { w += p(pts, fill, { soft, j }); };
    W([[59, 214], [62, 196], [66, 178], [72, 172], [78, 178], [82, 196], [86, 214]], robe);
    W([[73, 173], [78, 178], [82, 196], [86, 214], [74, 214]], robeD);
    for (const [sx, sy] of [[66, 200], [76, 192], [70, 208], [80, 205]]) w += foil(sx, sy, 2, { flat: true });
    // little shoes peeking out
    W([[61, 214], [62, 210.5], [68, 210.5], [69.5, 214]], C.ink, true, 0.2);
    W([[75, 214], [76, 210.5], [82, 210.5], [84, 214]], C.ink, true, 0.2);
    let arm = '';
    arm += p([[76, 181], [89, 174], [91.5, 178], [78.5, 187]], robe, { soft: false, j: 0.4 });
    arm += p([[89, 173], [93, 173], [93, 178], [89, 178]], C.skin, { j: 0.3 });
    if (o.wand !== false) {
      const wand = `<path d="M91 176L101 161" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"${F}/>` +
        `<path d="${straight(star(101.5, 160, 4))}" fill="${GOLD}"${F}/>`;
      arm += g(n + '-wand', wand);
    }
    // the static raise sits on a plain wrapper: a transform attribute on a class
    // group would be shifted by the CSS transform-origin
    w += o.wandUp ? `<g transform="rotate(-28 78 182)">${g(n + '-arm', arm)}</g>` : g(n + '-arm', arm);
    // head: hair, face, dot eyes, rosy cheeks, small smile
    let head = '';
    head += p([[64.5, 168], [66, 160], [72, 158], [78, 160], [79.5, 168], [72, 172.5]], C.hair, { j: 0.4 });
    head += p([[65.5, 166], [66.5, 160.5], [72, 159], [77.5, 160.5], [78.5, 166], [76, 171.5], [68, 171.5]], C.skin, { j: 0.4 });
    head += `<circle cx="69.4" cy="165.6" r="1.1" fill="${C.ink}"/><circle cx="74.8" cy="165.6" r="1.1" fill="${C.ink}"/>`;
    head += `<circle cx="67.8" cy="168.6" r="1.6" fill="${C.cheek}" opacity=".7"/><circle cx="76.4" cy="168.6" r="1.6" fill="${C.cheek}" opacity=".7"/>`;
    head += o.open ? `<ellipse cx="72.1" cy="169.4" rx="1.3" ry="1" fill="${C.ink}"/>`
      : `<path d="M70.4 168.8Q72.1 170.6 73.8 168.8" fill="none" stroke="${C.ink}" stroke-width=".7" stroke-linecap="round"/>`;
    // pointed hat with a bent tip, gold band, a foil star
    let hat = '';
    hat += p([[59, 161], [85, 161], [79, 150], [75, 140], [80, 128], [86, 126], [72, 134], [66, 148]], robe, { j: 0.4 });
    hat += p(box(58, 158, 86, 162.5), GOLD, { soft: false, j: 0.3 });
    hat += foil(73, 148, 2.4, { flat: true });
    head += g(n + '-hat', hat);
    w += g(n + '-head', head);
    return place(x, y, s, `<g transform="translate(-72 -214)">${g(n, w)}</g>`, o);
  }

  // ---- Pip the ginger cat (sitting, feet centre at the local origin, ~36 tall) ----------
  function pip(x, y, s = 1, o = {}) {
    const n = o.name || 'pip';
    let c = '';
    const K = (pts, fill, j = 0.35) => p(pts, fill, { j });
    c += g(n + '-tail', `<path d="M129 212C138 210 140 198 134 192" fill="none" stroke="${C.catD}" stroke-width="3.4" stroke-linecap="round"${F}/>`);
    c += K([[114, 214], [130, 214], [130, 203], [125, 193], [118, 195], [115, 203]], C.cat);
    for (const yy of [200, 205, 210]) c += K([[125, yy], [130.5, yy - 1.5], [130.5, yy + 1.2], [126, yy + 2]], C.catD, 0.2);
    c += K([[116.5, 212.5], [121.5, 212.5], [120.5, 202], [117, 204]], C.white);
    let h = '';
    h += K([[112.5, 190], [113.5, 184.5], [113.6, 178], [117.5, 182.5], [121, 182.5], [124.8, 178], [125, 184.5], [126, 190], [119.3, 195.5]], C.cat);
    h += K([[115, 182.6], [115.4, 180], [117, 182]], C.cheek, 0.1);
    h += K([[121.5, 182], [123.2, 180], [123.4, 182.6]], C.cheek, 0.1);
    h += `<ellipse cx="116.6" cy="188" rx="1.5" ry="1.8" fill="${C.eye}"/><ellipse cx="121.9" cy="188" rx="1.5" ry="1.8" fill="${C.eye}"/>`;
    h += `<circle cx="116.6" cy="188.2" r=".8" fill="${C.ink}"/><circle cx="121.9" cy="188.2" r=".8" fill="${C.ink}"/>`;
    h += `<path d="M118.4 190.6h1.8l-.9 1z" fill="${C.cheek}"/>`;
    h += `<path d="M118.2 192.2Q118.8 193 119.3 192.2Q119.8 193 120.4 192.2" fill="none" stroke="${C.ink}" stroke-width=".45" stroke-linecap="round"/>`;
    c += g(n + '-head', h);
    c += g(n + '-paw', p([[112, 206], [117, 204.5], [118.5, 207.5], [113, 209]], C.cat, { j: 0.2 }));
    return place(x, y, s, `<g transform="translate(-122 -214)">${g(n, c)}</g>`, o);
  }

  // ---- one recovered gold page (centred, ~18 x 22, with a soft foil glow) --------------
  function goldPage(x, y, s = 1, o = {}) {
    const n = o.name || 'gp';
    let pg = glow(0, 0, 20, '#ffe48a', 0.55);
    pg += p(box(-8, -10.5, 8, 10.5), C.page, { soft: false, j: 0.4 });
    pg += p(box(-8, -10.5, 8, -6.5), GOLD, { soft: false, j: 0.2, flat: true });
    pg += `<path d="M-5 -3h10M-5 0h8M-5 3h10M-5 6h6" stroke="${C.roof}" stroke-width=".9" stroke-linecap="round"/>`;
    pg += foil(5, 6.5, 2, { flat: true });
    pg += foil(-12, -12, 2.4, { flat: true }) + foil(12, -9, 1.8, { flat: true }) + foil(11, 12, 1.6, { flat: true });
    return place(x, y, s, g(n, pg), { rot: o.rot || 0 });
  }

  // ---- the spellbook: closed (centred) or open (spread, centred on the spine) -------------
  function spellbook(x, y, s = 1, o = {}) {
    const n = o.name || 'book';
    let b = '';
    if (o.open) {
      b += p([[-30, 4], [0, 8], [30, 4], [30, -16], [0, -12], [-30, -16]], C.bookD, { soft: false, j: 0.3 });
      b += p([[-27, 1], [0, 5], [0, -14], [-27, -18]], C.page, { soft: false, j: 0.3 });
      b += p([[27, 1], [0, 5], [0, -14], [27, -18]], C.page, { soft: false, j: 0.3 });
      b += `<path d="M-23 -11L-4 -8M-23 -6L-4 -3M-23 -1L-8 1.5M4 -8L23 -11M4 -3L23 -6M4 1.5L19 -1" stroke="${C.roof}" stroke-width="1" stroke-linecap="round"/>`;
      b += foil(-14, -14, 2.4, { flat: true }) + foil(14, -14, 2.4, { flat: true });
    } else {
      b += p(box(-12, 0, 12, 5), C.bookD, { soft: false, j: 0.3 });
      b += p(box(-10.5, -2, 10.5, 1.6), C.page, { soft: false, j: 0.25 });
      b += p(box(-12, -5.5, 12, -1.6), C.book, { soft: false, j: 0.25 });
      b += foil(0, -3.6, 2.6, { flat: true });
      b += `<path d="M-12 -5.5V5" stroke="${GOLD}" stroke-width="1.4"/>`;
    }
    return place(x, y, s, g(n, b), { rot: o.rot || 0 });
  }

  // ---- castle (papercut castle, gate centre bottom at the local origin) -------------------
  function tower(tx, base, w, h, roof, col) {
    const top = base - h;
    let t = '';
    t += p(box(tx - w / 2, top, tx + w / 2, base), col.castle, { soft: false, j: 0.4 });
    t += p(box(tx + w * 0.12, top, tx + w / 2, base), col.castleD, { soft: false, j: 0.3 });
    t += p([[tx - w / 2 - 2.5, top + 1], [tx + w / 2 + 2.5, top + 1], [tx + 0.6, top - roof], [tx - 0.6, top - roof]], col.roof, { soft: false, j: 0.4 });
    t += p([[tx + 0.6, top - roof], [tx + w / 2 + 2.5, top + 1], [tx + w * 0.1, top + 1]], col.roofD, { soft: false, j: 0.3 });
    const wy = top + h * 0.3;
    t += p([[tx - 2, wy + 6], [tx - 2, wy], [tx, wy - 2.5], [tx + 2, wy], [tx + 2, wy + 6]], C.win, { soft: false, j: 0.2, flat: true });
    return t;
  }
  function castle(x, y, s = 1, o = {}) {
    const col = Object.assign({ castle: C.castle, castleD: C.castleD, roof: C.roof, roofD: C.roofD }, o);
    let c = '';
    c += p(box(150, 132, 236, 182), col.castle, { soft: false, j: 0.5 });
    c += p(box(196, 132, 236, 182), col.castleD, { soft: false, j: 0.4 });
    for (let bx = 150; bx < 236; bx += 9) c += p(box(bx, 127, bx + 5, 133), col.castle, { soft: false, j: 0.3 });
    c += p([[184, 182], [184, 166], [190, 160], [196, 166], [196, 182]], C.ink, { soft: false, j: 0.3 });
    for (const [wx, wy] of [[162, 148], [174, 148], [208, 146], [222, 150]]) c += p([[wx - 2.2, wy + 7], [wx - 2.2, wy], [wx, wy - 2.6], [wx + 2.2, wy], [wx + 2.2, wy + 7]], C.win, { soft: false, j: 0.2, flat: true });
    c += tower(146, 182, 16, 74, 30, col);
    c += tower(240, 182, 15, 62, 26, col);
    c += tower(178, 132, 12, 34, 24, col);
    c += tower(212, 132, 13, 46, 28, col);
    c += `<path d="M212 58V48" stroke="${C.ink}" stroke-width="1.2"/>`;
    c += p([[212, 48], [224, 51], [212, 54]], GOLD, { soft: false, j: 0.2 });
    return place(x, y, s, `<g transform="translate(-190 -182)">${c}</g>`);
  }

  // ---- landscape bits ------------------------------------------------------------------
  const wave = (y0, amp, step, sd, bottom = 300) => {
    const r = rng(sd), pts = [[-6, bottom]];
    for (let x = -6; x <= 306; x += step) pts.push([x, y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.03 + sd)) - r() * amp * 0.4]);
    pts.push([306, bottom]);
    return pts;
  };
  function pine(x, b, h, fill = C.tree) {
    const pts = [[x, b - h]];
    for (let k = 1; k <= 4; k++) { const yy = b - h + h * k / 4, w = 5 + k * 3.4 * h / 50; pts.push([x + w, yy], [x + w * 0.45, yy - 1.5]); }
    const left = pts.slice(1).map(([px, py]) => [2 * x - px, py]).reverse();
    return p(pts.concat([[x + 1.5, b], [x - 1.5, b]], left), fill, { soft: false, j: 0.4 });
  }
  function nightSky(part, nStars = 14, avoid = null) {
    add(part, `<rect width="300" height="300" fill="${SKY}"/>`);
    for (let i = 0; i < nStars; i++) {
      const sx = 10 + R() * 280, sy = 10 + R() * 130;
      if (avoid && Math.hypot(sx - avoid[0], sy - avoid[1]) < avoid[2]) continue;
      add('pp-moon', foil(sx, sy, 1.8 + R() * 2.4, { flat: true }));
    }
  }
  function moon(cx, cy, r) {
    add('pp-moon', p(ring(cx, cy, r * 1.44, r * 1.44, 24), C.glow, { j: r * 0.06 }));
    add('pp-moon', p(ring(cx, cy, r, r, 24), GOLD, { j: r * 0.06 }));
  }

  // ---- rooms -----------------------------------------------------------------------
  // back wall card with stone mortar lines (lines are flat, so the wall stays light)
  function wall(part, col = C.wall, colD = C.wallD, y1 = 236, o = {}) {
    add(part, `<rect width="300" height="300" fill="${col}"/>`);
    const rh = o.row || 22;
    let dl = '';
    for (let yy = rh, row = 0; yy < y1; yy += rh, row++) {
      dl += `M0 ${f1(yy + rnd(-0.6, 0.6))}H300`;
      for (let xx = (row % 2) * 20 + rnd(0, 6); xx < 300; xx += 40 + rnd(-4, 4)) dl += `M${f1(xx)} ${f1(yy - rh)}V${f1(yy)}`;
    }
    add(part, `<path d="${dl}" stroke="${colD}" stroke-width="1.6" fill="none" opacity=".75"/>`);
  }
  // floor card from y to the bottom: planks, flagstones or a checker
  function floor(part, y, col = C.floor, colD = C.floorD, style = 'planks') {
    piece(part, [[-6, 306], [-6, y], [80, y - 1], [180, y + 1], [306, y], [306, 306]], col, { soft: false, j: 0.8 });
    let dl = '';
    if (style === 'planks') {
      for (let yy = y + 10; yy < 300; yy += 12 + (yy - y) * 0.15) dl += `M0 ${f1(yy)}H300`;
      for (let xx = 20; xx < 300; xx += 46) dl += `M${xx} ${f1(y + 10)}L${f1(150 + (xx - 150) * 1.5)} 300`;
      add(part, `<path d="${dl}" stroke="${colD}" stroke-width="1.4" fill="none"/>`);
    } else if (style === 'flags') {
      for (let yy = y + 12; yy < 300; yy += 16) dl += `M0 ${f1(yy)}H300`;
      for (let row = 0; y + (row ? 12 + 16 * (row - 1) : 0) < 300; row++) {
        const y0 = y + (row ? 12 + 16 * (row - 1) : 0), len = row ? 16 : 12;
        for (let xx = row % 2 * 18; xx < 300; xx += 36) dl += `M${xx} ${f1(y0)}v${len}`;
      }
      add(part, `<path d="${dl}" stroke="${colD}" stroke-width="1.6" fill="none"/>`);
    } else {
      let ch = '';
      for (let r = 0; r < 6; r++) {
        const y0 = y + r * (300 - y) / 6, y1 = y + (r + 1) * (300 - y) / 6;
        for (let c = -6; c < 12; c++) {
          if ((r + c) % 2) continue;
          const sp0 = 24 + r * 6, sp1 = 24 + (r + 1) * 6;
          const x0 = 150 + (c - 3) * sp0, x1 = 150 + (c - 2) * sp0, x2 = 150 + (c - 2) * sp1, x3 = 150 + (c - 3) * sp1;
          ch += `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y0)}L${f1(x2)} ${f1(y1)}L${f1(x3)} ${f1(y1)}Z`;
        }
      }
      add(part, `<path d="${ch}" fill="${colD}"/>`);
    }
  }
  // arched window: lilac frame, a night inside, a foil star or two, mullion bars
  function archWindow(part, x, y, w, h, o = {}) {
    const fr = o.frame || C.lilac, arch = n => {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; pts.push([x + w / 2 + Math.cos(a) * w / 2 * n, y + w / 2 + Math.sin(a) * w / 2 * n]); }
      return pts;
    };
    const pad = 4;
    piece(part, arch((w + pad * 2) / w).concat([[x + w + pad, y + h + pad], [x - pad, y + h + pad]]), fr, { soft: false, j: 0.5 });
    piece(part, arch(1).concat([[x + w, y + h], [x, y + h]]), o.inside || C.sky0, { soft: false, j: 0.3 });
    if (o.stars !== false) for (let i = 0; i < 3; i++) add(part, foil(x + w * (0.2 + 0.3 * i), y + w * 0.5 + R() * (h - w * 0.5) * 0.6, 1.6 + R() * 1.4, { flat: true }));
    if (o.bars !== false) add(part, `<path d="M${f1(x + w / 2)} ${f1(y + 2)}V${f1(y + h)}M${f1(x)} ${f1(y + h * 0.58)}H${f1(x + w)}" stroke="${fr}" stroke-width="2.6"/>`);
    piece(part, box(x - pad - 3, y + h + pad - 1, x + w + pad + 3, y + h + pad + 4), o.sill || C.lilacD, { soft: false, j: 0.3 });
  }
  // a candle with a drip and a flame in its own class group (name), feet at y
  function candle(x, y, s = 1, name = 'flame', o = {}) {
    const h = o.h || 16;
    let c = '';
    c += p(box(-3.4, -h, 3.4, 0), o.col || C.candle, { soft: false, j: 0.3 });
    c += p([[-3.4, -h], [-1, -h], [-1.2, -h + 5], [-2.4, -h + 6]], o.colD || C.candleD, { j: 0.15, flat: true });
    c += p(box(-5.5, -1.5, 5.5, 1.6), C.brass, { soft: false, j: 0.2 });
    c += `<path d="M0 ${-h}v-2.2" stroke="${C.ink}" stroke-width=".8"/>`;
    const fl = glow(0, -h - 6, 13, '#ffd56a', 0.5) + p([[0, -h - 11], [2.6, -h - 5], [1.6, -h - 2], [-1.6, -h - 2], [-2.6, -h - 5]], C.flameD, { j: 0.2, flat: true }) +
      p([[0, -h - 8.5], [1.5, -h - 4.5], [0.9, -h - 2.6], [-0.9, -h - 2.6], [-1.5, -h - 4.5]], C.flame, { j: 0.1, flat: true });
    c += g(name, fl);
    return place(x, y, s, c);
  }
  // a wall torch: iron bracket, a wooden stick, a big flame (name)
  function torch(x, y, s = 1, name = 'flame') {
    let t = '';
    t += p([[-2, 0], [2, 0], [3, -18], [-3, -18]], C.wood, { soft: false, j: 0.3 });
    t += p(box(-4.5, -20, 4.5, -16), C.iron, { soft: false, j: 0.3 });
    t += p(box(-1.5, 0, 1.5, 8), C.iron, { soft: false, j: 0.2 });
    const fl = glow(0, -28, 24, '#ffbf5a', 0.55) + p([[0, -38], [5, -28], [3.5, -21], [-3.5, -21], [-5, -28]], C.flameD, { j: 0.4, flat: true }) +
      p([[0, -33], [3, -26], [2, -22], [-2, -22], [-3, -26]], C.flame, { j: 0.2, flat: true });
    t += g(name, fl);
    return place(x, y, s, t);
  }
  // a potion bottle (bottom centre at x, y): round flask or tall bottle, cork, a shine
  function bottle(x, y, w, h, col, o = {}) {
    let b = '';
    const nw = Math.max(2.4, w * 0.26), nh = h * 0.28;
    if (o.round) b += p(ring(0, -h * 0.36, w / 2, h * 0.36, 14), col, { j: 0.3 });
    else b += p([[-w / 2, 0], [-w / 2, -h * 0.62], [-nw, -h * 0.72], [nw, -h * 0.72], [w / 2, -h * 0.62], [w / 2, 0]], col, { soft: false, j: 0.3 });
    b += p(box(-nw, -h, nw, -h * 0.66), col, { soft: false, j: 0.2 });
    b += p(box(-nw * 0.9, -h - 3, nw * 0.9, -h + 0.5), C.woodL, { soft: false, j: 0.2 });
    b += `<path d="M${f1(-w * 0.28)} ${f1(-h * 0.18)}V${f1(-h * 0.5)}" stroke="#fff" stroke-width="${f1(Math.max(1, w * 0.1))}" stroke-linecap="round" opacity=".45"/>`;
    if (o.label) b += p(box(-w * 0.32, -h * 0.42, w * 0.32, -h * 0.2), C.page, { soft: false, j: 0.2, flat: true });
    return place(x, y, 1, b);
  }
  // a row of book spines standing on y between x0 and x1
  function bookRow(part, x0, x1, y, hMin = 16, hMax = 26) {
    const cols = [C.red, C.blue, C.green, C.book, C.teal, C.pink, C.robe, C.brassD];
    for (let x = x0; x < x1 - 4;) {
      const w = rnd(4.5, 8), h = rnd(hMin, hMax), col = cols[Math.floor(R() * cols.length)];
      if (R() < 0.12 && x + h < x1) {   // one lying flat
        add(part, p(box(x, y - w, x + h, y), col, { soft: false, j: 0.3 }));
        x += h + 1; continue;
      }
      add(part, p(box(x, y - h, x + w, y), col, { soft: false, j: 0.3 }));
      add(part, `<path d="M${f1(x + 0.6)} ${f1(y - h * 0.78)}h${f1(w - 1.2)}M${f1(x + 0.6)} ${f1(y - h * 0.3)}h${f1(w - 1.2)}" stroke="${GOLD}" stroke-width="1.1"/>`);
      x += w + rnd(0.3, 1.2);
    }
  }
  const shelf = (part, x0, x1, y, col = C.wood, colD = C.woodD) => {
    piece(part, box(x0, y, x1, y + 5), col, { soft: false, j: 0.4 });
    piece(part, box(x0, y + 3.5, x1, y + 5), colD, { soft: false, j: 0.2, flat: true });
  };
  // a little friendly goblin (feet centre at origin): green, big ears, dot eyes, smile
  function goblin(x, y, s = 1, o = {}) {
    const n = o.name || 'gob', col = o.col || C.goblin, colD = o.colD || C.goblinD;
    let b = '';
    b += p([[-10, 0], [-9, -14], [-5, -20], [5, -20], [9, -14], [10, 0]], o.coat || C.red, { j: 0.4 });
    b += p(box(-8, -9, 8, -6), C.white, { soft: false, j: 0.2 });
    b += p([[-11, -30], [-21, -36], [-12, -24]], col, { j: 0.3 }) + p([[11, -30], [21, -36], [12, -24]], col, { j: 0.3 });
    b += p(ring(0, -28, 10.5, 9.5, 16), col, { j: 0.4 });
    b += p(ring(0, -24.5, 4, 2.6, 10), colD, { j: 0.2, flat: true });
    b += `<circle cx="-4" cy="-30" r="1.3" fill="${C.ink}"/><circle cx="4" cy="-30" r="1.3" fill="${C.ink}"/>`;
    b += `<circle cx="-6.6" cy="-26" r="1.6" fill="${C.cheek}" opacity=".6"/><circle cx="6.6" cy="-26" r="1.6" fill="${C.cheek}" opacity=".6"/>`;
    b += `<path d="M-2.6 -22.6Q0 -20.4 2.6 -22.6" fill="none" stroke="${C.ink}" stroke-width=".8" stroke-linecap="round"/>`;
    if (o.hat) b += p([[-8, -36], [-9, -44], [-4, -48], [0, -45], [4, -48], [9, -44], [8, -36]], C.white, { j: 0.4 });
    b += p(box(-8, 0, -2, 2.5), C.ink, { soft: false, j: 0.2 }) + p(box(2, 0, 8, 2.5), C.ink, { soft: false, j: 0.2 });
    return place(x, y, s, g(n, b), o);
  }
  // a round cookie with chocolate chips
  function cookie(x, y, r, o = {}) {
    let c = p(ring(0, 0, r, r, 12), C.cookie, { j: r * 0.12, flat: o.flat });
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + R(); c += `<circle cx="${f1(Math.cos(a) * r * 0.5)}" cy="${f1(Math.sin(a) * r * 0.5)}" r="${f1(r * 0.16)}" fill="${C.choc}"/>`; }
    return place(x, y, 1, o.name ? g(o.name, c) : c);
  }
  // a gear: n teeth, outer radius r, centred, its own class group (name)
  function gear(x, y, r, nT, fill, name, o = {}) {
    const pts = [], depth = r * 0.18;
    for (let i = 0; i < nT; i++) {
      const a0 = i / nT * 6.2832, a1 = a0 + 0.5 / nT * 6.2832, step = 6.2832 / nT;
      const ri = r - depth;
      pts.push([Math.cos(a0) * ri, Math.sin(a0) * ri], [Math.cos(a0 + step * 0.12) * r, Math.sin(a0 + step * 0.12) * r],
        [Math.cos(a1 - step * 0.12) * r, Math.sin(a1 - step * 0.12) * r], [Math.cos(a1) * ri, Math.sin(a1) * ri]);
    }
    let gr = `<path d="${straight(pts)}" fill="${fill}"${F}/>`;
    gr += `<circle r="${f1(r * 0.55)}" fill="none" stroke="${o.dark || C.brassD}" stroke-width="${f1(r * 0.1)}"/>`;
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4; gr += `<circle cx="${f1(Math.cos(a) * r * 0.33)}" cy="${f1(Math.sin(a) * r * 0.33)}" r="${f1(r * 0.09)}" fill="${o.dark || C.brassD}"/>`; }
    gr += `<circle r="${f1(r * 0.16)}" fill="${C.ink}"/>`;
    return `<g transform="translate(${f1(x)} ${f1(y)})">${g(name, gr)}</g>`;
  }
  // a folded paper bird (centred, faces right), wings in a class group
  function paperBird(x, y, s = 1, name = 'bird', o = {}) {
    let b = '';
    b += p([[-12, 0], [10, -2], [14, -5], [12, 1], [-6, 4]], o.col || C.white, { soft: false, j: 0.3 });
    b += p([[-12, 0], [-16, -6], [-6, 1]], o.colD || C.cloudD, { soft: false, j: 0.2 });
    b += g(name + '-w', p([[-4, 0], [6, -1], [0, -13]], o.colD || C.cloud, { soft: false, j: 0.3 }));
    b += `<circle cx="9.5" cy="-2.2" r=".9" fill="${C.ink}"/>`;
    if (o.letter) b += p(box(2, 3, 11, 9), C.page, { soft: false, j: 0.2 }) + `<path d="M2 3L6.5 6.5L11 3" stroke="${C.roof}" stroke-width=".7" fill="none"/>` + `<circle cx="6.5" cy="7.4" r="1" fill="${C.red}"/>`;
    return place(x, y, s, g(name, b), o);
  }
  // the friendly dragon (feet centre at origin, faces left, ~80 tall)
  function dragon(x, y, s = 1, o = {}) {
    const n = o.name || 'dragon', col = C.dragon, colD = C.dragonD;
    let d = '';
    d += g(n + '-tail', p([[18, -6], [36, -4], [52, -14], [60, -26], [56, -12], [44, 4], [20, 4]], colD, { j: 0.6 }) + p([[56, -26], [66, -32], [62, -20]], C.pink, { j: 0.3 }));
    d += g(n + '-wing', p([[4, -40], [22, -66], [40, -72], [34, -58], [44, -54], [30, -46], [34, -36], [12, -34]], C.tealD, { j: 0.6 }) +
      `<path d="M8 -38L38 -70M10 -36L42 -54M14 -35L33 -37" stroke="${colD}" stroke-width="1.2" fill="none"/>`);
    d += p([[-26, 0], [-30, -24], [-20, -44], [0, -50], [18, -44], [26, -22], [22, 0]], col, { j: 0.8 });
    d += p([[-18, 0], [-20, -22], [-12, -36], [2, -38], [10, -24], [8, 0]], C.belly, { j: 0.6 });
    for (let i = 0; i < 4; i++) d += `<path d="M${-17 + i} ${-8 - i * 7}Q${-6} ${-5 - i * 7} ${7 - i} ${-8 - i * 7}" stroke="${C.cookieD}" stroke-width=".9" fill="none" opacity=".6"/>`;
    // head
    let h = '';
    h += p([[-24, -48], [-42, -52], [-50, -62], [-46, -76], [-30, -84], [-14, -78], [-10, -62]], col, { j: 0.7 });
    h += p([[-46, -64], [-56, -62], [-58, -56], [-50, -52], [-40, -54]], col, { j: 0.4 });
    h += `<circle cx="-52" cy="-60" r="1.2" fill="${colD}"/><circle cx="-56" cy="-58" r="1.2" fill="${colD}"/>`;
    h += p([[-30, -82], [-34, -94], [-26, -84]], C.belly, { j: 0.2 }) + p([[-20, -80], [-18, -92], [-14, -80]], C.belly, { j: 0.2 });
    h += `<ellipse cx="-34" cy="-68" rx="3" ry="3.6" fill="${C.white}"/><circle cx="-34.6" cy="-67.4" r="2" fill="${C.ink}"/><circle cx="-35.4" cy="-68.4" r=".7" fill="#fff"/>`;
    h += `<circle cx="-40" cy="-58" r="3" fill="${C.cheek}" opacity=".55"/>`;
    h += `<path d="M-50 -54Q-42 -49 -34 -55" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-linecap="round"/>`;
    d += g(n + '-head', h);
    d += p([[-22, 0], [-22, -10], [-12, -10], [-12, 0]], colD, { j: 0.4 }) + p([[6, 0], [6, -10], [16, -10], [16, 0]], colD, { j: 0.4 });
    d += p([[-28, -30], [-36, -26], [-34, -20], [-24, -24]], colD, { j: 0.3 });
    return place(x, y, s, g(n, d), o);
  }

  function end({ css = '', sky, defs: extra = '' } = {}) {
    return scene({ uid, parts, css, defs: defs + extra, sky });
  }

  return {
    uid, R, rnd, C, PLAY, GOLD, SKY, F, parts,
    p, add, piece, ring, disc, box, star, foil, cls, g, place, radial, linear, clip, glow, anim, origin,
    wizard, pip, goldPage, spellbook, castle, tower: (part, ...a) => add(part, tower(...a, C)),
    wave, pine, nightSky, moon, wall, floor, archWindow, candle, torch, bottle, bookRow, shelf,
    goblin, cookie, gear, paperBird, dragon, end
  };
}

// ---- shared symbols (the scenes and the task art draw the same ones) --------------------
// keyhole / key shapes: path d centred on cx, cy with radius r
function shapeD(kind, cx, cy, r) {
  const pt = (x, y) => `${f1(cx + x * r)} ${f1(cy + y * r)}`;
  if (kind === 'star') {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832 - Math.PI / 2, rr = i % 2 ? 0.42 : 1; d += (i ? 'L' : 'M') + pt(Math.cos(a) * rr, Math.sin(a) * rr); }
    return d + 'Z';
  }
  if (kind === 'moon') return `M${pt(0.3, -0.95)}A${f1(r)} ${f1(r)} 0 1 0 ${pt(0.3, 0.95)}A${f1(r * 1.1)} ${f1(r * 1.1)} 0 0 1 ${pt(0.3, -0.95)}Z`;
  if (kind === 'heart') return `M${pt(0, 0.95)}C${pt(-1.3, 0)} ${pt(-0.7, -1.1)} ${pt(0, -0.45)}C${pt(0.7, -1.1)} ${pt(1.3, 0)} ${pt(0, 0.95)}Z`;
  if (kind === 'triangle') return `M${pt(0, -1)}L${pt(0.95, 0.8)}L${pt(-0.95, 0.8)}Z`;
  if (kind === 'square') return `M${pt(-0.8, -0.8)}L${pt(0.8, -0.8)}L${pt(0.8, 0.8)}L${pt(-0.8, 0.8)}Z`;
  return `M${pt(1, 0)}A${f1(r)} ${f1(r)} 0 1 1 ${pt(-1, 0)}A${f1(r)} ${f1(r)} 0 1 1 ${pt(1, 0)}Z`;   // circle
}
const SHAPES = ['star', 'moon', 'heart', 'triangle', 'square', 'circle'];
// rune glyphs (stroke paths in a -1..1 box)
const RUNES = [
  'M0 1V-1M-.6 -.4L0 -1L.6 -.4',
  'M0 -1L.7 0L0 1L-.7 0Z',
  'M-.7 -1L.7 -.33L-.7 .33L.7 1',
  'M-.7 -.7L.7 .7M.7 -.7L-.7 .7M0 -1V1',
  'M0 1V-1M-.7 -1V-.2Q0 .4 .7 -.2V-1',
  'M-.7 -1H.7L-.7 1H.7Z',
  'M.45 -.9A.95 .95 0 1 0 .45 .9'
];
const rune = (i, cx, cy, r, color, w = 2) => `<path d="${RUNES[i % RUNES.length]}" transform="translate(${f1(cx)} ${f1(cy)}) scale(${f1(r)})" fill="none" stroke="${color}" stroke-width="${(w / r).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"/>`;

window.PAPER = { C, PLAY, ORDER, kit, scene, shapeD, SHAPES, RUNES, rune };
})();
