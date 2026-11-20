// THE TOY SHOP AFTER MIDNIGHT: the pictures (viewBox 0..300), one builder per
// page id, built with the kit in assets/js/toys.js. Each builder is side-effect
// free (a fresh kit / uid per call), puts its pieces on the flat `ts-*` depth
// layers (used as roles: ts-soldier = mid character, ts-doll = front
// character) and embeds its own one-shot tap motion (<= 2.4 s, one long
// animation runs from 0 s, everything ends in the start pose).
// Branch-dependent pictures read window.MINIGAME.flags() at build time:
// companion ('soldier' | 'ballerina') and helped ('duck' | 'mouse' | '').
(function () {
'use strict';
const T = window.TOYS;
const PLAY = T.PLAY;
const f1 = window.DRAWKIT.f1;
const S = {};

// ---- flags ------------------------------------------------------------------------------------
const flags = () => (window.MINIGAME && window.MINIGAME.flags && window.MINIGAME.flags()) || {};
const isBal = () => flags().companion === 'ballerina';
const helped = () => flags().helped || '';

// ---- shared little motions --------------------------------------------------------------------
const hop = (k, name, h = 6, delay = 0, dur = 0.7) => k.anim(name, `0%,100%{transform:none}35%{transform:translateY(${-h}px)}60%{transform:translateY(1px)}80%{transform:none}`, { dur, delay });
const hops = (k, name, h = 5, delay = 0, n = 3) => k.anim(name, `0%,100%{transform:none}40%{transform:translateY(${-h}px)}`, { dur: 0.6, delay, count: n, ease: 'ease-out' });
const wave = (k, name, delay = 0, n = 3) => k.origin(name, '50% 0%') + k.anim(name, '0%,100%{transform:rotate(0)}50%{transform:rotate(-26deg)}', { dur: 0.6, delay, count: n });
const nod = (k, name, delay = 0, deg = 8) => k.origin(name, '50% 90%') + k.anim(name, `0%,100%{transform:none}30%{transform:rotate(${-deg}deg)}65%{transform:rotate(${deg * 0.6}deg)}`, { dur: 1.2, delay });
const sway = (k, name, deg = 4, delay = 0, n = 3) => k.origin(name, '50% 100%') + k.anim(name, `0%,100%{transform:rotate(0)}25%{transform:rotate(${deg}deg)}75%{transform:rotate(${-deg}deg)}`, { dur: 0.8, delay, count: n });
const glint = (k, name, delay = 0.4) => k.anim(name, '0%,100%{transform:none;opacity:1}35%{transform:scale(1.25) rotate(-8deg);opacity:1}60%{transform:scale(.95)}', { dur: 1.4, delay });
// the tin soldier marches on the spot while his key spins (2.4 s)
const march = (k, n) => k.spin(n + '-key', 4, 0.6, 0) +
  k.anim(n + '-body', '0%,100%{transform:none}50%{transform:translateY(-2.5px)}', { dur: 0.4, count: 6, ease: 'steps(2,end)' }) +
  k.anim(n + '-legL', '0%,100%{transform:none}50%{transform:translateY(-4px)}', { dur: 0.4, count: 6, ease: 'steps(2,end)' }) +
  k.anim(n + '-legR', '0%,100%{transform:translateY(-4px)}50%{transform:none}', { dur: 0.4, count: 6, ease: 'steps(2,end)' });
// the ballerina's pirouette: two full turns (2.4 s)
const twirl = (k, n) => k.anim(n, '0%,100%{transform:scaleX(1)}25%{transform:scaleX(.04)}50%{transform:scaleX(-1)}75%{transform:scaleX(.04)}', { dur: 1.2, count: 2, ease: 'linear' }) +
  k.origin(n + '-arms', '50% 100%') + k.anim(n + '-arms', '0%,100%{transform:none}50%{transform:scale(1.06,1.08)}', { dur: 0.6, count: 4 });
// the music box plays: pins slide, comb buzzes, key turns (2.4 s)
const play = (k, n = 'mb') => k.anim(n + '-pins', 'to{transform:translateX(-52.8px)}', { ease: 'linear' }) +
  k.anim(n + '-comb', '50%{transform:translateY(.5px)}', { dur: 0.16, count: 15, ease: 'steps(2,end)' }) +
  k.origin(n + '-key', '0% 50%') + k.anim(n + '-key', '0%{transform:scaleX(1)}25%{transform:scaleX(.15)}50%{transform:scaleX(-1)}75%{transform:scaleX(-.15)}100%{transform:scaleX(1)}', { dur: 0.6, count: 4, ease: 'linear' }) +
  k.anim(n + '-gear', 'to{transform:rotate(360deg)}', { ease: 'linear' });
// the companion chosen on the music-box page (soldier when unset)
function comp(k, part, x, y, s = 1, o = {}) {
  if (isBal()) { k.add(part, k.ballerina(x, y, s * 1.05, Object.assign({ name: 'co' }, o.bal || {}))); return o.still ? '' : twirl(k, 'co'); }
  k.add(part, k.soldier(x, y, s * 0.82, Object.assign({ name: 'co' }, o.so || {}))); return o.still ? '' : march(k, 'co');
}
// the usual lamplit shelf room
function room(k, y = 224, o = {}) {
  k.wall('ts-wall', o.wall || {});
  if (o.back !== false) k.backShelf('ts-back', o.backY || 108, o.backO || {});
  k.under('ts-back', y + 20);
  k.shelf('ts-shelf', y);
}
// the shopkeeper's hand from the upper right, fingertips holding a card at the origin
function shopHand(k, x, y, s = 1, text = 'Not for sale') {
  const C = k.C;
  let h = '';
  h += `<path d="M-40 6L40 6L36 34L-36 34Z" fill="#f6ecd4"/><path d="M-40 6L40 6L36 34L-36 34Z" fill="none" stroke="${C.goldD}" stroke-width="1"/>`;
  h += `<text x="0" y="25" font-size="10.5" font-weight="700" font-family="Georgia, serif" text-anchor="middle" fill="${C.redD}">${text}</text>`;
  h += `<path d="M20 -6L120 -110L170 -66L60 26Z" fill="#5a4a3e"${k.F('felt')}/><path d="M20 -6L60 26L52 34L12 2Z" fill="#7a6656"${k.F('felt')}/>`;
  h += `<path d="M30 -2C10 -10 -6 -4 -4 6C-2 14 14 18 34 14Z" fill="${k.U('tinS')}"/>`;
  h += `<path d="${k.rbox(-10, 0, 20, 7, 3.4)}" fill="${C.skin}"/><path d="${k.rbox(-8, 7, 22, 13.5, 3.2)}" fill="${C.skin}"/>`;
  h += `<path d="M2 -2C-4 -2 -8 2 -6 6" stroke="${C.skinD}" stroke-width=".8" fill="none"/>`;
  return k.place(x, y, s, h);
}
// little icons for the choice buttons (flat, the toy palette)
const C0 = T.C;

// =============================================================================================
// start: the shop at midnight, the clock strikes twelve; tap: the pendulum swings, the
// chimes ring out and the sleepy toys stir
S.start = function () {
  const k = T.kit(11), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.45, 0.02], glowOp: 0.45 });
  k.shopWindow('ts-wall', 200, 22, 84, 118);
  k.backShelf('ts-back', 170, { opacity: 0.9 });
  // the shop clock: carved case, white face, both hands at twelve, a pendulum
  let ck = `<path d="M44 96H88V170H44Z" fill="${C.woodD}"${k.F('wood')}/><path d="M50 102H82V164H50Z" fill="#2a140a"/>`;
  ck += k.g('pend', `<path d="M66 102V146" stroke="${C.goldD}" stroke-width="1.6"/><circle cx="66" cy="150" r="7" fill="url(#${k.uid}-goldV)"/><circle cx="64" cy="148" r="2" fill="#fff" opacity=".5"/>`);
  ck += `<circle cx="66" cy="64" r="34" fill="${C.wood}"${k.F('wood')}/><circle cx="66" cy="64" r="28" fill="${C.white}"/><circle cx="66" cy="64" r="28" fill="none" stroke="${C.gold}" stroke-width="1.4"/>`;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ck += `<path d="M${f1(66 + Math.sin(a) * 23)} ${f1(64 - Math.cos(a) * 23)}L${f1(66 + Math.sin(a) * 26)} ${f1(64 - Math.cos(a) * 26)}" stroke="${C.ink}" stroke-width="${i % 3 ? 0.8 : 1.8}"/>`;
  }
  ck += `<text x="66" y="50" font-size="7" font-weight="700" font-family="Georgia, serif" text-anchor="middle" fill="${C.ink}">XII</text>`;
  ck += k.g('hands', `<path d="M66 64V46" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M66 64V40" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/><circle cx="66" cy="64" r="2" fill="${C.gold}"/>`);
  ck += `<path d="M30 40Q66 8 102 40" stroke="${C.woodL}" stroke-width="5" fill="none"${k.F('wood')}/>`;
  k.add('ts-shelf', ck);
  // the chimes: gold rings from the clock face
  for (let i = 0; i < 4; i++) {
    k.add('ts-fx', k.g('ring' + i, `<circle cx="66" cy="64" r="34" fill="none" stroke="${C.lamp}" stroke-width="2"/>`, ' opacity="0"'));
    css += k.anim('ring' + i, '0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.7)}', { dur: 0.8, delay: i * 0.5, ease: 'ease-out' });
  }
  css += k.origin('pend', '50% 0%') + k.anim('pend', '0%,100%{transform:rotate(0)}25%{transform:rotate(12deg)}75%{transform:rotate(-12deg)}', { dur: 0.8, count: 3 });
  css += k.anim('hands', '0%,100%{transform:none}10%{transform:rotate(3deg)}20%{transform:none}', { dur: 0.5, count: 4 });
  k.shelf('ts-shelf', 224);
  k.under('ts-back', 244);
  // the toys asleep on the front shelf: soldier, the closed music box (for sale), Button
  k.add('ts-box', k.musicBox(176, 224, 0.74, { open: false, tag: 'SALE' }));
  k.add('ts-soldier', k.shadow(76, 224, 13) + k.soldier(76, 224, 0.66, { sleep: true }));
  k.add('ts-doll', k.shadow(258, 224, 18) + k.button(258, 224, 0.82, { sit: true, sleep: true }));
  css += nod(k, 'btn-head', 1.0, 6) + nod(k, 'so-head', 1.3, 5);
  // drifting z's over the sleepers
  ['zz0', 'zz1'].forEach((nm, i) => {
    const x = i ? 264 : 84, y = i ? 150 : 140;
    k.add('ts-fx', k.g(nm, `<text x="${x}" y="${y}" font-size="11" font-weight="700" font-family="Georgia, serif" fill="${C.lamp}" opacity=".8">z</text><text x="${x + 7}" y="${y - 8}" font-size="8" font-weight="700" font-family="Georgia, serif" fill="${C.lamp}" opacity=".6">z</text>`));
    css += k.anim(nm, '0%,100%{transform:none;opacity:1}50%{transform:translate(4px,-8px);opacity:.3}', { dur: 1.2, delay: i * 0.3, count: 2 - i });
  });
  css += k.twinkles('ts-fx', [[222, 52, 3], [262, 70, 2.6], [238, 96, 2.2]], { delay: 0.3, step: 0.4 });
  k.lamp('ts-light', 150, 10, { op: 0.2 });
  k.light('ts-light');
  return k.end({ css });
};

// shrink: the kid shrinks to toy size between a giant cotton reel and a table leg;
// tap: the faint big outline shrinks into the little kid, sparkles, a happy hop
S.shrink = function () {
  const k = T.kit(12), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.5, 0] });
  k.floorboards('ts-back', 196);
  k.add('ts-back', `<g${k.F('dof')}><rect x="14" y="0" width="38" height="210" fill="${C.woodD}"/><rect x="18" y="0" width="8" height="210" fill="${C.woodL}" opacity=".4"/></g>`);
  k.add('ts-shelf', k.shadow(246, 258, 34) + k.spool(246, 258, 2.1, '#c8303a'));
  k.add('ts-shelf', `<path d="${straightish([[28, 262], [96, 262], [104, 248], [92, 238], [40, 240]])}" fill="${C.slipper}"${k.F('felt')}/><path d="M40 240Q62 232 92 238" stroke="#f4d0dc" stroke-width="3" fill="none"${k.F('felt')}/><circle cx="96" cy="244" r="6" fill="#f4d0dc"${k.F('felt')}/>`);
  k.add('ts-box', k.block(54, 232, 0.9, C.blue, 'A'));
  // the faint big outline (the kid's real size) shrinks into the little one
  k.add('ts-soldier', k.g('ghost', k.kid(150, 262, 2.9, { name: 'gk' }), ' opacity=".16"'));
  css += k.origin('ghost', '50% 100%') + k.anim('ghost', '0%{transform:scale(1);opacity:.16}50%{transform:scale(.29);opacity:.55}62%{transform:scale(.29);opacity:0}85%{transform:scale(1);opacity:0}100%{transform:scale(1);opacity:.16}', { ease: 'ease-in-out' });
  k.add('ts-doll', k.shadow(150, 262, 14) + k.g('me', k.kid(150, 262, 0.84, { armsUp: true, open: true })));
  css += hop(k, 'me', 10, 1.3, 0.7);
  css += k.twinkles('ts-fx', [[124, 198, 5], [178, 206, 4], [136, 240, 3.4], [170, 176, 4.4], [114, 226, 3], [186, 236, 3.6]], { delay: 0.9, step: 0.12 });
  k.light('ts-light');
  return k.end({ css });
};
// a soft blob path through points (closed)
function straightish(pts) {
  return window.DRAWKIT.smoothPath ? window.DRAWKIT.smoothPath(pts, true) : window.DRAWKIT.straight(pts);
}

// button: meet Button the rag doll on the shelf edge; tap: she waves, the kid waves back
S.button = function () {
  const k = T.kit(13), C = k.C;
  let css = '';
  room(k, 224);
  k.add('ts-box', k.shadow(46, 224, 18) + k.spool(46, 224, 1.2, C.felt));
  k.add('ts-box', k.block(270, 224, 0.8, C.jackY, 'B'));
  k.add('ts-soldier', k.shadow(112, 224, 12) + k.kid(112, 224, 0.82, { reach: true }));
  k.add('ts-doll', k.shadow(194, 224, 22) + k.button(194, 224, 0.98, { sit: true, wave: true }));
  css += wave(k, 'btn-armR', 0, 4) + wave(k, 'kid-armR', 0.3, 3);
  css += nod(k, 'btn-head', 0.2, 6) + k.origin('btn-hair', '50% 0%') + k.anim('btn-hair', '0%,100%{transform:none}30%{transform:scaleY(1.08) rotate(3deg)}60%{transform:scaleY(.95) rotate(-2deg)}', { dur: 1.2, delay: 0.2 });
  k.light('ts-light');
  return k.end({ css });
};

// musicbox: the broken music box with a SALE tag, its three missing parts marked;
// the soldier and the ballerina offer to help; tap: the box tries to play and clunks,
// the soldier marches, the ballerina spins
S.musicbox = function () {
  const k = T.kit(14), C = k.C;
  let css = '';
  room(k, 224);
  k.add('ts-box', k.g('mbw', k.musicBox(150, 224, 1.22, { missing: { key: true, gear: true, tooth: true }, tag: 'SALE' })));
  css += k.anim('mbw', '0%,100%{transform:none}10%{transform:translateX(-1.4px)}20%{transform:translateX(1.4px)}30%{transform:translateX(-1px)}40%{transform:none}', { dur: 1, delay: 0.1 });
  // the three empty places glow faintly
  css += k.twinkles('ts-fx', [[115.8, 199.6, 5], [222, 199.6, 5], [156, 166, 4]], { delay: 0.5, step: 0.25, fill: '#ffe7a0' });
  // one dull note drops out of the box
  k.add('ts-fx', `<g transform="translate(150 160)">${k.g('dull', k.note('#8a8070'), ' opacity="0"')}</g>`);
  css += k.anim('dull', '0%{opacity:0;transform:none}20%{opacity:1;transform:translateY(-8px)}100%{opacity:0;transform:translateY(16px) rotate(30deg)}', { dur: 1.2, delay: 0.2 });
  k.add('ts-soldier', k.shadow(36, 224, 13) + k.soldier(36, 224, 0.7));
  css += march(k, 'so');
  k.add('ts-doll', k.shadow(264, 224, 12) + k.ballerina(264, 224, 1.0));
  css += twirl(k, 'bal');
  k.light('ts-light');
  return k.end({ css });
};

// way: up the tall shelves to the puppet theatre, or down through the loose floorboard;
// tap: the signs wobble, the glints at the top and in the gap twinkle
S.way = function () {
  const k = T.kit(15), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.3, 0] });
  // the tall shelves on the left, the puppet theatre peeping out at the top
  k.add('ts-back', `<g${k.F('dof')}><rect x="0" y="0" width="150" height="200" fill="#2a170c"/>` +
    `<path d="M96 22H140V70H96Z" fill="#8e2a22"/><path d="M102 30H134V64H102Z" fill="#1d2448"/><path d="M102 30H116V64H102ZM120 30H134V64H120Z" fill="${C.red}"/><path d="M92 22Q118 6 144 22Z" fill="${C.gold}"/>` +
    `<circle cx="30" cy="52" r="14" fill="#8a5a32"/><rect x="50" y="40" width="28" height="30" fill="${C.green}"/><rect x="20" y="114" width="36" height="34" fill="${C.purple}"/><circle cx="90" cy="134" r="14" fill="${C.jackR}"/></g>`);
  k.shelf('ts-shelf', 70, { x0: -4, x1: 150, th: 8 });
  k.shelf('ts-shelf', 148, { x0: -4, x1: 150, th: 8 });
  // a toy ladder leaning on the shelves
  let lad = `<path d="M118 236L146 60M140 236L168 60" stroke="${C.woodL}" stroke-width="4" stroke-linecap="round"${k.F('wood')}/>`;
  for (let i = 1; i < 10; i++) { const t = i / 10; lad += `<path d="M${f1(118 + 28 * t)} ${f1(236 - 176 * t)}H${f1(140 + 28 * t)}" stroke="${C.wood}" stroke-width="3"/>`; }
  k.floorboards('ts-shelf', 214);
  k.add('ts-shelf', lad);
  // the loose board on the right with a dark gap and a wet shine below
  k.add('ts-box', `<path d="M196 252L286 248L292 262L200 268Z" fill="#120804"/><path d="M206 258Q240 254 280 256" stroke="${C.waterL}" stroke-width="1.4" opacity=".5" fill="none"/>` +
    `<path d="M200 268L292 262L296 250L286 248L196 252Z" fill="none" stroke="${C.woodD}" stroke-width="1.6"/><path d="M286 248L304 236L304 246L296 250Z" fill="${C.woodL}"${k.F('wood')}/>`);
  // the signpost of ice-lolly sticks
  let sg = `<path d="M246 238V170" stroke="${C.cardL}" stroke-width="4" stroke-linecap="round"/>`;
  sg += k.g('up', `<path d="M222 176H262V188H222L214 182Z" fill="${C.cardL}"/><text x="240" y="185.6" font-size="8" font-weight="800" font-family="Georgia, serif" text-anchor="middle" fill="${C.boxD}">UP</text>`);
  sg += k.g('dn', `<path d="M230 196H270L278 202L270 208H230Z" fill="${C.cardL}"/><text x="252" y="205.6" font-size="8" font-weight="800" font-family="Georgia, serif" text-anchor="middle" fill="${C.boxD}">DOWN</text>`);
  k.add('ts-box', sg);
  css += k.origin('up', '100% 50%') + k.anim('up', '0%,100%{transform:none}30%{transform:rotate(-8deg)}60%{transform:rotate(4deg)}', { dur: 1, delay: 0.1 });
  css += k.origin('dn', '0% 50%') + k.anim('dn', '0%,100%{transform:none}30%{transform:rotate(8deg)}60%{transform:rotate(-4deg)}', { dur: 1, delay: 0.5 });
  css += comp(k, 'ts-soldier', 72, 240, 0.6);
  k.add('ts-doll', k.shadow(170, 242, 12) + k.kid(170, 242, 0.66, { point: 'up' }) + k.shadow(200, 244, 12) + k.button(200, 244, 0.6, {}));
  css += hop(k, 'kid', 5, 0.3) + nod(k, 'btn-head', 0.6, 7);
  css += k.twinkles('ts-fx', [[118, 38, 5], [240, 258, 4], [262, 256, 3]], { delay: 0.4, step: 0.35 });
  k.light('ts-light');
  return k.end({ css });
};

// =============================================================================================
// HIGH SHELVES
// h-theatre: the puppet theatre, the gear hidden behind the right curtain;
// tap: the curtains draw back, the gear shines, the puppet bows
S['h-theatre'] = function () {
  const k = T.kit(21), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.5, 0] });
  // the theatre frame, painted and gilded
  let th = `<path d="M56 40H244V214H56Z" fill="#8e2a22"${k.F('wood')}/><path d="M50 48Q150 -4 250 48Z" fill="#b8862a"${k.F('wood')}/>`;
  th += `<path d="M64 46Q150 6 236 46" stroke="${C.gold}" stroke-width="1.4" fill="none"/>` + k.sparkle(150, 30, 7, C.gold);
  th += `<path d="M76 64H224V186H76Z" fill="#1d2448"/>`;
  // painted backdrop: a moon and stars
  th += `<circle cx="196" cy="92" r="11" fill="${C.moon}" opacity=".85"/><circle cx="201" cy="89" r="10" fill="#1d2448"/>`;
  for (const [x, y] of [[96, 84], [124, 100], [150, 78], [176, 112], [212, 130], [104, 124]]) th += k.sparkle(x, y, 3, '#e9d58a');
  th += `<path d="M76 186L224 186L236 200L64 200Z" fill="${C.woodL}"${k.F('wood')}/>`;
  th += `<path d="M64 200H236V214H64Z" fill="#6a1a14"/>`;
  for (let i = 0; i < 7; i++) th += `<circle cx="${84 + i * 22}" cy="194" r="2.2" fill="#ffe7a0"/>` + k.glow(84 + i * 22, 192, 9, C.lamp, 0.5);
  k.add('ts-back', th);
  // the gear on the stage, behind the right curtain
  k.add('ts-shelf', k.glow(196, 172, 20, '#ffe48a', 0.5) + k.g('gear', k.gear(196, 174, 10, { n: 9 })));
  css += k.anim('gear', '0%{transform:none}100%{transform:rotate(360deg)}', { delay: 0.5, dur: 1.9, ease: 'ease-out' });
  // the marionette: a felt dancer on strings
  let pp = `<path d="M122 66H158" stroke="${C.woodL}" stroke-width="3" stroke-linecap="round"/><path d="M126 66L132 146M154 66L148 146M140 66V126" stroke="#e8d8b0" stroke-width=".5"/>`;
  pp += `<path d="M128 180L140 142L152 180Z" fill="${C.purple}"${k.F('felt')}/><path d="M131 172H149" stroke="#c49ad0" stroke-width="1.4"/>`;
  pp += `<path d="M134 148L124 160M146 148L156 160" stroke="${C.skin}" stroke-width="2.4" stroke-linecap="round"/>`;
  pp += `<path d="M136 180V186M144 180V186" stroke="${C.skin}" stroke-width="2.2" stroke-linecap="round"/>`;
  pp += `<circle cx="140" cy="134" r="8" fill="${C.skin}"${k.F('felt')}/><path d="M132 132C132 122 148 122 148 132C145 128 135 128 132 132Z" fill="${C.yarn}"${k.F('yarn')}/>`;
  pp += `<circle cx="137.4" cy="134.6" r="1" fill="${C.ink}"/><circle cx="142.6" cy="134.6" r="1" fill="${C.ink}"/><path d="M137.8 138Q140 139.8 142.2 138" stroke="#c4505a" stroke-width=".8" fill="none"/>`;
  k.add('ts-shelf', k.g('pup', pp));
  css += k.origin('pup', '50% 0%') + k.anim('pup', '0%,100%{transform:none}25%{transform:translateY(-6px) rotate(-4deg)}50%{transform:translateY(2px) rotate(6deg)}75%{transform:translateY(-3px)}', { dur: 1.6, delay: 0.3 });
  // velvet curtains with folds and a gold-fringed pelmet
  const folds = (x0, x1) => { let s = ''; for (let x = x0 + 5; x < x1; x += 9) s += `<path d="M${x} 66V186" stroke="#7a0c14" stroke-width="3" opacity=".6"/>`; return s; };
  k.add('ts-box', k.g('curL', `<path d="M76 64H114Q108 126 116 186H76Z" fill="${C.red}"${k.F('felt')}/>${folds(76, 110)}`));
  k.add('ts-box', k.g('curR', `<path d="M224 64H168Q174 126 166 186H224Z" fill="${C.red}"${k.F('felt')}/>${folds(170, 224)}`));
  let pel = `<path d="M72 60H228V74H72Z" fill="#a8121c"${k.F('felt')}/>`;
  for (let x = 72; x < 228; x += 12) pel += `<path d="M${x} 74Q${x + 6} 84 ${x + 12} 74" fill="#a8121c"/><path d="M${x + 6} 79V83" stroke="${C.gold}" stroke-width="1.4"/>`;
  k.add('ts-box', pel + `<path d="M72 60H228" stroke="${C.gold}" stroke-width="2"/>`);
  css += k.origin('curL', '0% 50%') + k.anim('curL', '0%,100%{transform:none}30%,75%{transform:scaleX(.55)}', { dur: 2.2 });
  css += k.origin('curR', '100% 50%') + k.anim('curR', '0%,100%{transform:none}30%,75%{transform:scaleX(.3)}', { dur: 2.2 });
  // the audience on the front shelf
  k.shelf('ts-shelf', 246);
  k.under('ts-back', 266);
  css += comp(k, 'ts-soldier', 258, 246, 0.56);
  k.add('ts-doll', k.shadow(56, 246, 11) + k.kid(56, 246, 0.56, { point: 'up' }) + k.shadow(92, 246, 10) + k.button(92, 246, 0.5));
  css += hop(k, 'kid', 4, 0.7) + nod(k, 'btn-head', 0.9);
  k.light('ts-light');
  return k.end({ css });
};

// h-jigsaw: a jigsaw bridge between two shelves, two pieces still missing;
// tap: the star and heart pieces drop into their gaps and float back, the kid hops
S['h-jigsaw'] = function () {
  const k = T.kit(22), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.5, 0.05] });
  k.backShelf('ts-back', 108, { flip: true });
  k.under('ts-back', 210);
  k.shelf('ts-shelf', 200, { x0: -4, x1: 92 });
  k.shelf('ts-shelf', 200, { x0: 208, x1: 304 });
  k.add('ts-shelf', `<rect x="80" y="222" width="12" height="80" fill="${C.woodD}"${k.F('wood')}/><rect x="208" y="222" width="12" height="80" fill="${C.woodD}"${k.F('wood')}/>`);
  // the bridge: five pieces with knobs; the 2nd and 4th are gaps with a shape
  const cols = ['#3d6fa8', '#3f9a5a', '#e0a83a', '#c8303a', '#7a3d8a'];
  const shapes = { 1: 'star', 3: 'heart' };
  const star = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr); } return d + 'Z'; };
  const heart = (cx, cy, r) => `M${cx} ${f1(cy + r)}C${f1(cx - r * 1.3)} ${cy} ${f1(cx - r * 0.7)} ${f1(cy - r * 1.1)} ${cx} ${f1(cy - r * 0.45)}C${f1(cx + r * 0.7)} ${f1(cy - r * 1.1)} ${f1(cx + r * 1.3)} ${cy} ${cx} ${f1(cy + r)}Z`;
  const piece = (x, col, sym) => `<path d="M${x} 198H${x + 10}A3 3 0 0 0 ${x + 14} 198H${x + 24}V210H${x + 14}A3 3 0 0 1 ${x + 10} 210H${x}Z" fill="${col}"${k.F('wood')}/><path d="M${x} 198H${x + 24}" stroke="#fff" stroke-width=".8" opacity=".35"/>` +
    (sym === 'star' ? `<path d="${star(x + 12, 204, 4)}" fill="#fff" opacity=".7"/>` : sym === 'heart' ? `<path d="${heart(x + 12, 203.6, 3.6)}" fill="#fff" opacity=".7"/>` : '');
  let br = '';
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 24;
    if (shapes[i]) br += `<rect x="${x}" y="198" width="24" height="12" fill="#120804" opacity=".7"/><path d="${shapes[i] === 'star' ? star(x + 12, 204, 4.4) : heart(x + 12, 203.6, 4)}" fill="none" stroke="${C.gold}" stroke-width=".8" stroke-dasharray="1.4 1"/>`;
    else br += piece(x, cols[i]);
  }
  k.add('ts-box', br);
  [1, 3].forEach((i, j) => {
    const x = 90 + i * 24;
    k.add('ts-fx', k.g('pz' + j, k.glow(x + 12, 160, 16, '#ffe48a', 0.5) + `<g transform="translate(0 -44)">${piece(x, cols[i], shapes[i])}</g>`));
    k.add('ts-fx', `<path d="M${x + 12} 170V194" stroke="${C.lamp}" stroke-width=".8" stroke-dasharray="2 2" opacity=".6"/>`);
    css += k.anim('pz' + j, '0%,100%{transform:none}30%,65%{transform:translateY(44px)}', { dur: 2.2, delay: j * 0.15 });
  });
  css += comp(k, 'ts-soldier', 258, 200, 0.6);
  k.add('ts-doll', k.shadow(62, 200, 11) + k.kid(62, 200, 0.6, { point: 'fwd' }) + k.shadow(28, 200, 10) + k.button(28, 200, 0.54));
  css += hop(k, 'kid', 6, 1.0) + nod(k, 'btn-head', 0.4);
  k.light('ts-light');
  return k.end({ css });
};

// h-dollhouse: the dollhouse, the comb tooth on the little table, a toy duck stuck
// head-up in the chimney; tap: the duck wiggles, a puff of soot, the tooth shines
S['h-dollhouse'] = function () {
  const k = T.kit(23), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.45, 0] });
  k.backShelf('ts-back', 80, { opacity: 0.8 });
  k.under('ts-back', 256);
  // the duck first, clipped to above the chimney top, then the chimney over it
  const cp = k.clip(`<rect x="150" y="-10" width="100" height="36"/>`);
  k.add('ts-shelf', `<g clip-path="${cp}">${k.duck(194, 47, 0.9, { string: false })}</g>`);
  css += k.origin('dk-body', '50% 100%') + k.anim('dk-body', '0%,100%{transform:none}20%{transform:rotate(-8deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-5deg)}80%{transform:rotate(3deg)}', { dur: 1.6 });
  let h = `<path d="M182 28H212V70H182Z" fill="#9a4a3a"${k.F('wood')}/><path d="M178 24H216V32H178Z" fill="#7a3a2e"/>`;
  for (let y = 38; y < 70; y += 8) h += `<path d="M182 ${y}H212" stroke="#6a2a20" stroke-width=".8"/>`;
  // roof with rows of painted tiles
  h += `<path d="M58 88L150 22L242 88Z" fill="#8e3a2a"${k.F('wood')}/>`;
  for (let r = 0; r < 4; r++) { const y = 40 + r * 13, half = 25 + r * 18; for (let x = 150 - half; x < 150 + half; x += 10) h += `<path d="M${x} ${y}Q${x + 5} ${y + 6} ${x + 10} ${y}" stroke="#6a2618" stroke-width="1" fill="none"/>`; }
  h += `<path d="M58 88L150 22L242 88" stroke="${C.white}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
  // the house front, open: four little rooms
  h += `<path d="M68 88H232V236H68Z" fill="#f0e2c4"${k.F('wood')}/>`;
  const rooms = [[78, 96, '#e8c98a'], [154, 96, '#9ac0a8'], [78, 166, '#d9a0a0'], [154, 166, '#a8b8e0']];
  for (const [x, y, c] of rooms) {
    h += `<path d="M${x} ${y}H${x + 68}V${y + 64}H${x}Z" fill="${c}"/>`;
    for (let xx = x + 6; xx < x + 68; xx += 10) h += `<path d="M${xx} ${y}V${y + 56}" stroke="#fff" stroke-width="1.4" opacity=".25"/>`;
    h += `<path d="M${x} ${y + 56}H${x + 68}V${y + 64}H${x}Z" fill="${C.woodL}"/>`;
  }
  // furniture: a bed, a picture and a lamp, a table (the tooth on it), an armchair
  h += `<path d="M84 136H130V152H84Z" fill="${C.woodD}"/><path d="M86 140H128V148H86Z" fill="#f4f0ff"/><path d="M86 136H100V144H86Z" fill="#fff"/><path d="M100 138H128V148H100Z" fill="${C.pj}"/>`;
  h += `<path d="M170 110H196V128H170Z" fill="${C.gold}"/><path d="M173 113H193V125H173Z" fill="#5a8ac0"/><path d="M173 125L180 117L186 122L193 115V125Z" fill="#3f8a4f"/>`;
  h += `<path d="M206 136L212 120L218 136Z" fill="#f2d07a"/><path d="M212 136V152M206 152H218" stroke="${C.woodD}" stroke-width="1.6"/>` + k.glow(212, 132, 14, C.lamp, 0.5);
  h += `<path d="M94 208H134V212H94Z" fill="${C.woodD}"/><path d="M98 212V222M130 212V222" stroke="${C.woodD}" stroke-width="2"/><path d="M96 206H132" stroke="#fff" stroke-width="2" opacity=".8"/>`;
  h += `<path d="M168 196H198V222H168Z" fill="#7a3d8a"/><path d="M166 192H172V222H166ZM194 192H200V222H194Z" fill="#5a2a6a"/><path d="M172 206H194" stroke="#9a5aaa" stroke-width="3"/>`;
  h += `<path d="M68 88H232V236H68Z" fill="none" stroke="${C.white}" stroke-width="3"/><path d="M150 92V232M70 162H230" stroke="${C.white}" stroke-width="3"/>`;
  k.add('ts-shelf', h);
  k.add('ts-box', k.glow(114, 204, 14, '#ffe48a', 0.6) + k.g('tooth', k.combTooth(114, 203, 0.9, -6)));
  css += glint(k, 'tooth', 0.5);
  // a puff of soot from the chimney
  k.add('ts-fx', k.g('soot', `<circle cx="188" cy="18" r="5" fill="#5a5048"/><circle cx="182" cy="12" r="4" fill="#6a6058"/><circle cx="192" cy="9" r="3.4" fill="#5a5048"/>`, ' opacity="0"'));
  css += k.anim('soot', '0%{opacity:0;transform:scale(.4)}25%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:translate(-14px,-14px) scale(1.6)}', { dur: 1.3, delay: 0.5, ease: 'ease-out' });
  k.shelf('ts-shelf', 236);
  css += comp(k, 'ts-soldier', 282, 236, 0.46);
  k.add('ts-doll', k.shadow(38, 236, 10) + k.kid(38, 236, 0.55, { point: 'up' }) + k.shadow(252, 236, 10) + k.button(252, 236, 0.5));
  css += hop(k, 'kid', 4, 0.9) + nod(k, 'btn-head', 0.3);
  k.light('ts-light');
  return k.end({ css });
};

// h-attic: the dark attic of boxes on the top shelf; tap: the torch beam sweeps the
// boxes, a far crack of lamplight twinkles
S['h-attic'] = function () {
  const k = T.kit(24), C = k.C;
  let css = '';
  k.wall('ts-wall', { color: '#24160e', stripe: '#2c1b10', lamp: [0.8, 0.1], glowOp: 0.3 });
  // the sloping attic roof boards
  let rf = '';
  for (let i = 0; i < 6; i++) rf += `<path d="M${-10 + i * 30} 0L${150 + i * 6} 60" stroke="${C.woodD}" stroke-width="6" opacity=".7"/>`;
  k.add('ts-wall', rf + `<path d="M258 0H272V120H258Z" fill="#ffd59a" opacity=".35"${k.F('blur')}/>`);
  // stacks of cardboard boxes
  const boxes = [[-6, 150, 64, 112, C.card], [8, 96, 48, 54, C.cardL], [62, 186, 44, 76, C.cardD], [196, 162, 58, 100, C.card], [208, 112, 40, 50, C.cardD], [252, 190, 56, 72, C.cardL], [150, 214, 40, 48, C.card]];
  let bx = '';
  boxes.forEach(([x, y, w, h, c], i) => {
    bx += `<path d="M${x} ${y}H${x + w}V${y + h}H${x}Z" fill="${c}"${k.F('felt')}/><path d="M${x} ${y}L${x + 6} ${y - 5}H${x + w + 6}L${x + w} ${y}Z" fill="${C.cardL}" opacity=".9"/>`;
    bx += `<path d="M${x + w / 2 - 4} ${y}H${x + w / 2 + 4}V${y + h * 0.45}H${x + w / 2 - 4}Z" fill="#e8d8a8" opacity=".6"/>`;
    if (i % 2 === 0) bx += `<path d="M${x + 6} ${y + h * 0.62}H${x + w * 0.5}" stroke="${C.ink}" stroke-width="1.2" opacity=".45"/><path d="M${x + 6} ${y + h * 0.72}H${x + w * 0.38}" stroke="${C.ink}" stroke-width="1.2" opacity=".35"/>`;
  });
  k.add('ts-back', bx);
  k.shelf('ts-shelf', 262, { th: 12 });
  css += comp(k, 'ts-soldier', 52, 262, 0.5);
  k.add('ts-doll', k.shadow(100, 262, 11) + k.kid(100, 262, 0.62, { torch: true }) + k.shadow(136, 262, 9) + k.button(136, 262, 0.48));
  css += nod(k, 'btn-head', 0.8);
  k.light('ts-light', { dark: 0.35, motes: 0 });
  // the torch beam (on top of the dark), sweeping
  const beam = k.radial('#fff0c0', 0.55, { cx: 0, cy: 0.5, r: 1 });
  k.add('ts-light', k.g('beam', `<path d="M128 234L300 160V262Z" fill="${beam}"/>`));
  css += k.origin('beam', '0% 50%') + k.anim('beam', '0%,100%{transform:none}30%{transform:rotate(-9deg)}70%{transform:rotate(5deg)}');
  css += k.twinkles('ts-light', [[264, 40, 4], [266, 78, 3]], { delay: 0.6, step: 0.5 });
  return k.end({ css });
};

// h-jack: the jack-in-the-box springs everyone up to the top shelf where the winding
// key lies; the companion crosses the gap (the soldier marches over a narrow ruler, the
// ballerina leaps it); tap: the spring bounces, the companion crosses, the key glints
S['h-jack'] = function () {
  const k = T.kit(25), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.7, 0] });
  k.backShelf('ts-back', 196, { opacity: 0.85 });
  k.shelf('ts-shelf', 250, { th: 12 });
  k.shelf('ts-shelf', 96, { x0: 150, x1: 204, th: 10 });
  k.shelf('ts-shelf', 96, { x0: 240, x1: 304, th: 10 });
  k.add('ts-box', k.shadow(68, 250, 26) + k.jack(68, 250, 1, { open: true, spring: 60 }));
  css += k.origin('jk-spring', '50% 100%') + k.anim('jk-spring', '0%,100%{transform:none}20%{transform:scaleY(.6)}40%{transform:scaleY(1.12)}60%{transform:scaleY(.9)}80%{transform:scaleY(1.04)}', { dur: 1.4 });
  css += k.anim('jk-head', '0%,100%{transform:none}20%{transform:translateY(24px)}40%{transform:translateY(-7px)}60%{transform:translateY(6px)}80%{transform:translateY(-2.4px)}', { dur: 1.4 });
  // Button still in mid-air on the way up, the kid already on top
  k.add('ts-doll', k.g('fly', k.button(126, 128, 0.42, { armsUp: true })));
  css += k.anim('fly', '0%,100%{transform:none}50%{transform:translate(4px,-8px) rotate(6deg)}', { dur: 1.2, count: 2 });
  k.add('ts-doll', k.shadow(176, 96, 8) + k.kid(176, 96, 0.5, { armsUp: true }));
  css += hop(k, 'kid', 5, 0.6);
  // the winding key on the far side
  k.add('ts-fx', k.glow(270, 88, 22, '#ffe48a', 0.55) + k.g('wkey', k.windKey(262, 89, 1.3)));
  css += glint(k, 'wkey', 0.6);
  if (isBal()) {
    k.add('ts-soldier', k.g('leap', k.ballerina(222, 70, 0.56, { name: 'co', leap: true, armsOut: true })));
    css += k.anim('leap', '0%,100%{transform:none}35%{transform:translate(-14px,10px)}70%{transform:translate(10px,-8px)}', { dur: 2.2 });
  } else {
    let ru = `<path d="M194 92H250V97H194Z" fill="#e8d48a"${k.F('wood')}/>`;
    for (let x = 196; x < 250; x += 3) ru += `<path d="M${x} 92V${x % 15 === 1 ? 95 : 93.6}" stroke="${C.ink}" stroke-width=".4"/>`;
    k.add('ts-shelf', ru);
    k.add('ts-soldier', k.g('cross', k.soldier(222, 92, 0.42, { name: 'co' })));
    css += march(k, 'co') + k.anim('cross', '0%,100%{transform:none}50%{transform:translateX(10px)}');
  }
  k.light('ts-light');
  return k.end({ css });
};

// =============================================================================================
// UNDER THE FLOORBOARDS
// slits of lamplight through the boards overhead (shared by the low pages)
function boardsAbove(k, part, o = {}) {
  const C = k.C;
  let b = `<path d="M-4 -4H304V${o.h || 34}H-4Z" fill="#2a170c"${k.F('wood')}/>`;
  for (const x of o.slits || [64, 152, 236]) {
    b += `<path d="M${x} -4V${o.h || 34}" stroke="${C.lamp}" stroke-width="1.6" opacity=".9"/>`;
    b += `<path d="M${x - 1} ${o.h || 34}L${x - 18} 260H${x + 18}L${x + 1} ${o.h || 34}Z" fill="${C.lamp}" opacity=".07"/>`;
  }
  for (const x of o.joists || [20, 270]) b += `<path d="M${x} 30H${x + 16}V220H${x}Z" fill="#3a2214"${k.F('wood')}/>`;
  return k.add(part, b);
}
const lowWall = k => k.wall('ts-wall', { color: '#1f140c', stripe: '#24170e', dots: false, lamp: [0.5, 0], glowOp: 0.25 });

// u-boat: the cork boat on spilled water; tap: the boat rocks, ripples spread, the
// sail flutters
S['u-boat'] = function () {
  const k = T.kit(31), C = k.C;
  let css = '';
  lowWall(k);
  boardsAbove(k, 'ts-back');
  // the puddle: a long sheet of water with lamplit reflections
  const wat = k.linear(['#2a4a64', C.water, '#1f3a52']);
  k.add('ts-shelf', `<rect x="-4" y="214" width="308" height="90" fill="#2a1a10"/><ellipse cx="150" cy="252" rx="176" ry="46" fill="${wat}"/>`);
  for (const [x, y, w] of [[60, 236, 30], [208, 244, 40], [110, 270, 36], [236, 276, 24]]) k.add('ts-shelf', `<path d="M${x} ${y}H${x + w}" stroke="${C.waterL}" stroke-width="1.2" opacity=".45" stroke-linecap="round"/>`);
  // floating things: bottle caps, a match
  const cap = (x, y, c) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="3.4" fill="${c}"/><ellipse cx="${x}" cy="${y - 2}" rx="9" ry="3" fill="${c}"/><ellipse cx="${x}" cy="${y - 2}" rx="6" ry="1.8" fill="#fff" opacity=".25"/>`;
  k.add('ts-box', k.g('cap0', cap(50, 262, C.red)) + k.g('cap1', cap(250, 232, C.green)) + `<path d="M216 272L250 266" stroke="#e8c88a" stroke-width="2.4" stroke-linecap="round"/><circle cx="251" cy="265.8" r="2.4" fill="${C.red}"/>`);
  css += k.anim('cap0', '0%,100%{transform:none}50%{transform:translateY(-2px)}', { dur: 0.8, count: 3 }) + k.anim('cap1', '0%,100%{transform:none}50%{transform:translateY(2px)}', { dur: 0.8, count: 3 });
  // ripples round the boat
  for (let i = 0; i < 3; i++) {
    k.add('ts-box', k.g('rp' + i, `<ellipse cx="150" cy="240" rx="66" ry="12" fill="none" stroke="${C.waterL}" stroke-width="1" opacity=".5"/>`, ' opacity="0"'));
    css += k.anim('rp' + i, '0%{opacity:.7;transform:scale(.9)}100%{opacity:0;transform:scale(1.5)}', { dur: 1, delay: i * 0.5, ease: 'ease-out' });
  }
  // the boat: everyone aboard, then the cork hull over their legs, a paper sail
  let bt = '';
  bt += `<path d="M158 226V150" stroke="#e8d4a0" stroke-width="2" stroke-linecap="round"/>`;
  bt += k.g('sail', `<path d="M160 152L160 194L192 190Z" fill="#f6ecd4"/><path d="M164 164L184 188" stroke="#d8c8a0" stroke-width=".6"/>` + k.sparkle(169, 180, 3.6, C.red));
  bt += isBal() ? k.ballerina(110, 232, 0.44, { name: 'co', stand: false }) : k.soldier(110, 232, 0.36, { name: 'co' });
  bt += k.kid(138, 234, 0.46, { point: 'fwd' });
  bt += k.button(184, 234, 0.42);
  const cork = `M92 222Q150 214 208 222L202 240Q150 254 98 240Z`;
  bt += `<path d="${cork}" fill="#c9a06a"${k.F('felt')}/><path d="M92 222Q150 214 208 222Q150 230 92 222Z" fill="#dcb880"/>`;
  for (let i = 0; i < 18; i++) bt += `<circle cx="${f1(100 + k.R() * 100)}" cy="${f1(226 + k.R() * 14)}" r="${f1(0.6 + k.R() * 0.8)}" fill="#8a6038" opacity=".7"/>`;
  k.add('ts-doll', k.g('boat', bt));
  css += k.origin('boat', '50% 100%') + k.anim('boat', '0%,100%{transform:none}25%{transform:rotate(-4deg) translateY(-2px)}75%{transform:rotate(4deg)}', { dur: 1.2, count: 2 });
  css += k.origin('sail', '0% 100%') + k.anim('sail', '0%,100%{transform:none}50%{transform:skewY(-6deg) scaleX(1.06)}', { dur: 0.6, count: 4 });
  k.light('ts-light', { dark: 0.12 });
  return k.end({ css });
};

// u-marbles: the lost-marbles cave, the comb tooth on top of the pile; tap: three
// marbles roll out and back, the tooth glints, the light shimmers
S['u-marbles'] = function () {
  const k = T.kit(32), C = k.C;
  let css = '';
  lowWall(k);
  boardsAbove(k, 'ts-back', { slits: [190], joists: [10] });
  k.add('ts-back', `<path d="M60 262C60 120 120 70 196 70C270 70 300 140 304 262Z" fill="#160c06" opacity=".7"/>`);
  k.add('ts-shelf', `<rect x="-4" y="252" width="308" height="52" fill="#3a2416"${k.F('felt')}/><path d="M-4 252H304" stroke="#5a3a24" stroke-width="2"/>`);
  // the heap of marbles under the shaft of light
  const cols = ['#d23a3a', '#3d6fa8', '#3fbf6a', '#f2c230', '#7a3d8a', '#ef7f22', '#4fc6c0'];
  let heap = k.glow(190, 200, 80, C.lamp, 0.4);
  const pts = [];
  for (let tries = 0; pts.length < 46 && tries < 3000; tries++) {
    const x = 120 + k.R() * 140, y = 196 + k.R() * 58, h = 254 - 52 * Math.cos((x - 190) / 70 * Math.PI / 2);
    if (Math.abs(x - 190) > 70 || y < h) continue;
    if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > 8)) pts.push([x, y]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  pts.forEach(([x, y], i) => { heap += k.marble(x, y, 5 + k.R() * 1.6, cols[i % cols.length]); });
  k.add('ts-box', heap);
  k.add('ts-fx', k.glow(190, 198, 16, '#fff0c0', 0.7) + k.g('tooth', k.combTooth(190, 198, 1, -12)));
  css += glint(k, 'tooth', 0.4);
  // three marbles roll out to the front and back
  [[150, 256, '#3d6fa8', -36], [214, 258, '#d23a3a', 30], [180, 262, '#f2c230', -14]].forEach(([x, y, c, dx], i) => {
    k.add('ts-box', k.g('rl' + i, k.marble(x, y, 6, c) + `<path d="M${x - 6} ${y}H${x + 6}" stroke="#fff" stroke-width="1" opacity=".5"/>`));
    css += k.anim('rl' + i, `0%,100%{transform:none}50%{transform:translateX(${dx}px) rotate(${dx * 8}deg)}`, { dur: 1.6, delay: i * 0.25 });
  });
  css += comp(k, 'ts-soldier', 108, 262, 0.48);
  k.add('ts-doll', k.shadow(70, 262, 11) + k.kid(70, 262, 0.6, { reach: true }) + k.shadow(36, 262, 10) + k.button(36, 262, 0.52));
  css += wave(k, 'kid-armR', 0.2, 3) + nod(k, 'btn-head', 0.8);
  css += k.twinkles('ts-fx', [[150, 222, 3], [232, 230, 3], [170, 244, 2.6]], { delay: 0.6, step: 0.3 });
  k.light('ts-light', { dark: 0.15 });
  return k.end({ css });
};

// u-spider: the friendly spider in her web, the gear caught in it, a toy mouse tangled
// in old thread below; tap: the spider bobs and waves, the mouse wriggles, the web shines
S['u-spider'] = function () {
  const k = T.kit(33), C = k.C;
  let css = '';
  lowWall(k);
  boardsAbove(k, 'ts-back', { slits: [120, 236], joists: [6, 276] });
  // the web: spokes and a sagging spiral
  const cx = 186, cy = 118;
  let wb = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; wb += `<path d="M${cx} ${cy}L${f1(cx + Math.cos(a) * 104)} ${f1(cy + Math.sin(a) * 92)}"/>`; }
  for (let r = 14; r < 96; r += 13) {
    let d = '';
    for (let i = 0; i <= 12; i++) {
      const a = i / 12 * Math.PI * 2, am = (i - 0.5) / 12 * Math.PI * 2, rr = r * 0.9;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.88;
      d += i ? `Q${f1(cx + Math.cos(am) * rr)} ${f1(cy + Math.sin(am) * rr * 0.88)} ${f1(px)} ${f1(py)}` : `M${f1(px)} ${f1(py)}`;
    }
    wb += `<path d="${d}"/>`;
  }
  k.add('ts-shelf', k.g('web', `<g fill="none" stroke="#f4efe6" stroke-width=".55" opacity=".55">${wb}</g>`));
  css += k.anim('web', '0%,100%{opacity:1}50%{opacity:.55}', { dur: 0.8, count: 3 });
  k.add('ts-box', k.glow(222, 150, 20, '#ffe48a', 0.5) + k.g('gear', k.gear(222, 150, 10, { n: 9 })));
  css += glint(k, 'gear', 0.6);
  k.add('ts-soldier', k.g('spw', k.spider(116, 94, 1.35, { thread: 90, wave: true })));
  css += k.anim('spw', '0%,100%{transform:none}35%{transform:translateY(10px)}65%{transform:translateY(-3px)}', { dur: 1.8 });
  css += k.origin('sp-wave', '0% 100%') + k.anim('sp-wave', '0%,100%{transform:none}50%{transform:rotate(-22deg)}', { dur: 0.6, count: 4 });
  // the floor, the tangled mouse
  k.add('ts-shelf', `<rect x="-4" y="262" width="308" height="42" fill="#3a2416"${k.F('felt')}/><path d="M-4 262H304" stroke="#5a3a24" stroke-width="2"/>`);
  k.add('ts-doll', k.shadow(238, 262, 18) + k.g('msw', k.mouse(238, 262, 1.3)));
  k.add('ts-doll', `<g fill="none" stroke="#b8b0a0" stroke-width="1" opacity=".9"><ellipse cx="236" cy="250" rx="22" ry="7" transform="rotate(-12 236 250)"/><ellipse cx="240" cy="246" rx="16" ry="9" transform="rotate(20 240 246)"/><path d="M214 262Q226 236 250 240T272 262"/></g>`);
  css += k.origin('msw', '50% 100%') + k.anim('msw', '0%,100%{transform:none}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}', { dur: 0.6, count: 3, delay: 0.4 });
  css += comp(k, 'ts-soldier', 100, 262, 0.46);
  k.add('ts-doll', k.shadow(64, 262, 11) + k.kid(64, 262, 0.6, { point: 'up' }) + k.shadow(30, 262, 10) + k.button(30, 262, 0.52));
  css += hop(k, 'kid', 4, 1.2);
  css += k.twinkles('ts-fx', [[160, 92, 2.4], [204, 74, 2.4], [150, 140, 2.2], [228, 112, 2.2]], { delay: 0.3, step: 0.3 });
  k.light('ts-light', { dark: 0.12 });
  return k.end({ css });
};

// u-dark: the dark tunnel under the boards, lit by lost glow-in-the-dark star stickers;
// tap: the torch beam sweeps, the stars glow brighter
S['u-dark'] = function () {
  const k = T.kit(34), C = k.C;
  let css = '';
  k.wall('ts-wall', { color: '#140c08', stripe: '#180f0a', dots: false, lamp: [0.68, 0.48], glowOp: 0.25 });
  // receding board arches
  let ar = '';
  for (let i = 0; i < 4; i++) {
    const s = 1 - i * 0.22, cx = 150 + i * 16, w = 300 * s, top = 30 + i * 30, bot = 280 - i * 32;
    ar += `<path d="M${f1(cx - w / 2)} ${bot}V${top + 30}Q${cx} ${top - 10} ${f1(cx + w / 2)} ${top + 30}V${bot}" stroke="#3a2214" stroke-width="${f1(14 * s)}" fill="none"${k.F('wood')}/>`;
  }
  k.add('ts-back', ar + k.glow(198, 150, 30, '#ffc070', 0.6));
  k.add('ts-shelf', `<rect x="-4" y="262" width="308" height="42" fill="#2a1a10"/>`);
  css += comp(k, 'ts-soldier', 44, 262, 0.48);
  k.add('ts-doll', k.shadow(100, 262, 11) + k.kid(100, 262, 0.62, { torch: true }) + k.shadow(136, 262, 9) + k.button(136, 262, 0.48));
  css += nod(k, 'btn-head', 0.5);
  k.light('ts-light', { dark: 0.45, motes: 0 });
  // glow-in-the-dark stars stuck on the boards (on top of the dark)
  const stars = [[34, 60, 6], [86, 34, 5], [240, 52, 6.4], [272, 120, 5], [30, 168, 5.4], [262, 196, 4.6], [176, 40, 4.4], [214, 96, 3.6]];
  stars.forEach(([x, y, r]) => k.add('ts-light', k.glow(x, y, r * 3, '#d8f5a0', 0.35) + k.sparkle(x, y, r, '#e4f8b8')));
  css += k.twinkles('ts-light', stars.map(([x, y, r]) => [x, y, r * 1.2]), { delay: 0.1, step: 0.2, fill: '#f4ffd8', tag: 's' });
  const beam = k.radial('#fff0c0', 0.5, { cx: 0, cy: 0.5, r: 1 });
  k.add('ts-light', k.g('beam', `<path d="M128 234L300 170V262Z" fill="${beam}"/>`));
  css += k.origin('beam', '0% 50%') + k.anim('beam', '0%,100%{transform:none}30%{transform:rotate(-12deg)}70%{transform:rotate(4deg)}');
  return k.end({ css });
};

// u-climb: climbing the spider's thread up through the gap, the winding key on the
// edge above; the companion helps from the top; tap: the kid climbs a little, the
// companion moves, the key glints
S['u-climb'] = function () {
  const k = T.kit(35), C = k.C;
  let css = '';
  lowWall(k);
  // the shop floor above, in section, with a bright gap
  k.add('ts-back', `<rect x="-4" y="-4" width="308" height="34" fill="#4a2c1c"/><rect x="-4" y="-4" width="308" height="34" fill="${k.radial(C.lamp, 0.6, { cx: 0.55, cy: 0.2, r: 0.7 })}"/>`);
  k.add('ts-shelf', `<path d="M-4 30H144V48H-4Z" fill="${C.wood}"${k.F('wood')}/><path d="M188 30H304V48H188Z" fill="${C.wood}"${k.F('wood')}/><path d="M-4 30H144M188 30H304" stroke="${C.woodL}" stroke-width="2"/>`);
  k.add('ts-back', `<path d="M146 48L120 300H214L186 48Z" fill="${C.lamp}" opacity=".08"/>`);
  k.add('ts-shelf', `<rect x="-4" y="276" width="308" height="28" fill="#3a2416"/>`);
  k.add('ts-box', `<path d="M164 30V276" stroke="#f4efe6" stroke-width="1" opacity=".85"/>`);
  k.add('ts-fx', k.glow(232, 22, 20, '#ffe48a', 0.6) + k.g('wkey', k.windKey(222, 23, 1.3)));
  css += glint(k, 'wkey', 0.5);
  if (isBal()) {
    k.add('ts-soldier', k.ballerina(196, 30, 0.5, { name: 'co', armsOut: true, stand: false }));
    css += twirl(k, 'co');
  } else {
    k.add('ts-soldier', k.soldier(200, 30, 0.34, { name: 'co' }));
    css += march(k, 'co');
  }
  k.add('ts-doll', k.g('climb', k.kid(160, 208, 0.6, { armsUp: true })));
  css += k.anim('climb', '0%,100%{transform:none}40%,60%{transform:translateY(-16px)}', { dur: 2.2 });
  k.add('ts-doll', k.shadow(136, 276, 10) + k.button(136, 276, 0.52, { wave: true }));
  css += wave(k, 'btn-armR', 0.2, 3);
  k.light('ts-light', { dark: 0.1 });
  return k.end({ css });
};

// =============================================================================================
// REJOINED
// counter: up on the counter the shop cat wakes; tap: the tail swishes, the cat blinks
// and tilts its head, the kid jumps
S.counter = function () {
  const k = T.kit(41), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.4, 0] });
  k.backShelf('ts-back', 150, { opacity: 0.85 });
  k.add('ts-shelf', `<path d="M-4 208H304V224H-4Z" fill="${C.woodL}"${k.F('wood')}/><path d="M-4 224H304V304H-4Z" fill="${C.woodD}"${k.F('wood')}/>` +
    `<path d="M14 236H140V292H14ZM160 236H286V292H160Z" fill="none" stroke="${C.wood}" stroke-width="3"/><rect x="-4" y="222" width="308" height="2" fill="${C.shadow}" opacity=".5"/>`);
  // the shop bell
  k.add('ts-box', k.shadow(30, 212, 16) + `<path d="M14 210H46V212H14Z" fill="${C.goldD}"/><path d="M16 210C16 194 44 194 44 210Z" fill="url(#${k.uid}-goldV)"/><circle cx="30" cy="193" r="2.4" fill="${C.goldD}"/><path d="M22 204C22 199 26 197 30 197" stroke="#fff" stroke-width="1.4" fill="none" opacity=".5"/>`);
  k.add('ts-box', k.shadow(134, 212, 70) + k.cat(134, 212, 0.8, { awake: true }));
  css += k.origin('cat-tail', '0% 100%') + k.anim('cat-tail', '0%,100%{transform:none}25%{transform:rotate(-14deg)}50%{transform:rotate(6deg)}75%{transform:rotate(-8deg)}');
  css += k.origin('cat-eyes', '50% 50%') + k.anim('cat-eyes', '0%,100%{transform:none}45%,55%{transform:scaleY(.1)}', { dur: 0.5, delay: 0.6 });
  css += k.origin('cat-head', '50% 100%') + k.anim('cat-head', '0%,100%{transform:none}40%,70%{transform:rotate(-8deg)}', { dur: 1.8, delay: 0.4 });
  css += comp(k, 'ts-soldier', 224, 212, 0.44);
  k.add('ts-doll', k.shadow(250, 212, 9) + k.kid(250, 212, 0.5, { open: true }) + k.shadow(278, 212, 9) + k.button(278, 212, 0.44));
  css += hop(k, 'kid', 7, 0.1, 0.6) + hop(k, 'btn', 5, 0.2, 0.6);
  k.light('ts-light');
  return k.end({ css });
};

// hide-march: the soldier leads a line of toys, tallest first, past the puzzled cat;
// tap: everyone marches, the cat tilts its head
S['hide-march'] = function () {
  const k = T.kit(42), C = k.C;
  let css = '';
  k.wall('ts-wall', { lamp: [0.55, 0] });
  k.add('ts-box', k.cat(30, 200, 0.95, { awake: true, flip: true }));
  css += k.origin('cat-head', '50% 100%') + k.anim('cat-head', '0%,100%{transform:none}30%,70%{transform:rotate(10deg)}', { dur: 2.2 });
  css += k.origin('cat-eyes', '50% 50%') + k.anim('cat-eyes', '0%,100%{transform:none}45%,55%{transform:scaleY(.1)}', { dur: 0.5, delay: 1.2 });
  k.add('ts-back', `<path d="M-4 199H170V212H-4Z" fill="${C.woodD}"${k.F('wood')}/>`);
  k.shelf('ts-shelf', 244);
  k.under('ts-back', 264);
  // the marching line: the soldier, then the others by size
  k.add('ts-soldier', k.shadow(252, 244, 14) + k.soldier(252, 244, 0.62));
  css += march(k, 'so');
  [[214, 0.4], [188, 0.34], [166, 0.28]].forEach(([x, s], i) => {
    k.add('ts-soldier', k.shadow(x, 244, 8) + k.soldier(x, 244, s, { name: 'ts' + i }));
    css += march(k, 'ts' + i);
  });
  k.add('ts-doll', k.shadow(132, 244, 10) + k.kid(132, 244, 0.5) + k.shadow(102, 244, 9) + k.button(102, 244, 0.44));
  css += hops(k, 'kid', 3, 0, 4) + hops(k, 'btn', 3, 0.3, 3);
  k.lamp('ts-light', 210, 30, { op: 0.2 });
  k.light('ts-light');
  return k.end({ css });
};

// hide-freeze: everyone stands still as statues; the cat sniffs; tap: the cat leans in
// and blinks, the kid wobbles with a giggle, nobody moves
S['hide-freeze'] = function () {
  const k = T.kit(43), C = k.C;
  let css = '';
  room(k, 236, { backY: 100 });
  k.add('ts-box', k.g('catw', k.cat(262, 236, 1.15, { awake: true })));
  css += k.anim('catw', '0%,100%{transform:none}35%,65%{transform:translate(-10px,3px)}', { dur: 2.2 });
  css += k.origin('cat-eyes', '50% 50%') + k.anim('cat-eyes', '0%,100%{transform:none}45%,55%{transform:scaleY(.1)}', { dur: 0.5, delay: 1.0 });
  k.add('ts-soldier', k.shadow(160, 236, 12) + k.ballerina(160, 236, 0.98, { armsOut: true }));
  k.add('ts-doll', k.shadow(70, 236, 11) + k.kid(70, 236, 0.6, { armsUp: true }) + k.shadow(112, 236, 10) + k.button(112, 236, 0.52, { armsUp: true }));
  css += k.origin('kid', '50% 100%') + k.anim('kid', '0%,100%{transform:none}30%{transform:rotate(2.5deg)}50%{transform:rotate(-2.5deg)}70%{transform:none}', { dur: 1.2, delay: 0.8 });
  k.add('ts-fx', k.g('shh', `<path d="M40 150Q36 140 44 136" stroke="${C.lamp}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M34 156Q26 142 38 130" stroke="${C.lamp}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`, ' opacity="0"'));
  css += k.anim('shh', '0%,100%{opacity:0}30%,70%{opacity:1}', { dur: 1.6, delay: 0.6 });
  k.light('ts-light');
  return k.end({ css });
};

// fix: the three parts hover by their places on the music box; tap: the key, the gear
// and the tooth glide in, hold, and float back out
S.fix = function () {
  const k = T.kit(44), C = k.C;
  let css = '';
  room(k, 240);
  k.add('ts-box', k.glow(150, 160, 110, C.lamp, 0.25) + k.musicBox(150, 240, 1.5, { missing: { key: true, gear: true, tooth: true } }));
  // targets: key socket (235.5, 208.5), gear window (108, 210), comb gap (156, 170)
  const parts = [
    ['pk', k.windKey(246, 182, 1.7), -10.5, 26.5],
    ['pg', k.gear(78, 172, 10, { n: 9 }), 30, 38],
    ['pt', k.combTooth(232, 132, 1.1, -10), -76, 38]
  ];
  parts.forEach(([nm, svg, dx, dy], i) => {
    k.add('ts-fx', k.g(nm, svg));
    css += k.anim(nm, `0%,100%{transform:none}30%,65%{transform:translate(${dx}px,${dy}px)}`, { dur: 2.2, delay: i * 0.08 });
  });
  k.add('ts-fx', `<g fill="none" stroke="${C.lamp}" stroke-width=".8" stroke-dasharray="2 2.4" opacity=".6"><path d="M250 186Q246 200 238 207"/><path d="M84 180Q98 200 106 206"/><path d="M226 134Q190 142 160 166"/></g>`);
  css += k.twinkles('ts-fx', [[252, 176, 4], [74, 164, 4], [236, 126, 3.4]], { delay: 0.1, step: 0.1 });
  css += k.twinkles('ts-fx', [[236, 208, 5], [108, 210, 5], [156, 170, 4]], { delay: 0.9, step: 0.12, tag: 'b' });
  k.light('ts-light');
  return k.end({ css });
};

// rescue: the cat's paw comes down over the box; the helped toy (duck / mouse) or
// Button (with a ball of yarn) draws it away; tap: the paw swings after the rescuer
S.rescue = function () {
  const k = T.kit(45), C = k.C;
  let css = '';
  const h = helped();
  room(k, 250, { backY: 120 });
  k.add('ts-box', k.musicBox(122, 250, 0.95));
  k.add('ts-soldier', k.g('paw', k.catPaw(124, 112, 0.9)));
  css += k.anim('paw', '0%,100%{transform:none}35%,60%{transform:translate(96px,-26px) rotate(-10deg)}', { dur: 2.3 });
  k.add('ts-doll', k.shadow(36, 250, 10) + k.kid(36, 250, 0.54, { open: true }));
  css += hop(k, 'kid', 4, 0.2);
  if (h === 'duck') {
    k.add('ts-doll', k.g('res', k.shadow(232, 250, 22) + k.duck(232, 250, 1.3)));
    css += k.anim('res', '0%,100%{transform:none}45%,60%{transform:translateX(30px)}', { dur: 2.3 });
    css += k.anim('dk-w0', 'to{transform:rotate(360deg)}', { dur: 1.1, count: 2, ease: 'linear' }) + k.anim('dk-w1', 'to{transform:rotate(360deg)}', { dur: 1.1, count: 2, ease: 'linear' });
    css += k.origin('dk-body', '50% 100%') + k.anim('dk-body', '0%,100%{transform:none}50%{transform:rotate(-6deg)}', { dur: 0.4, count: 5 });
  } else if (h === 'mouse') {
    k.add('ts-doll', k.g('res', k.shadow(232, 250, 20) + k.mouse(232, 250, 1.5)));
    css += k.anim('res', '0%,100%{transform:none}45%,60%{transform:translateX(34px)}', { dur: 2.3 });
    css += k.origin('ms-tail', '100% 50%') + k.anim('ms-tail', '0%,100%{transform:none}50%{transform:rotate(14deg)}', { dur: 0.4, count: 5 });
  } else {
    k.add('ts-doll', k.shadow(196, 250, 10) + k.button(196, 250, 0.54, { armsUp: true }));
    let yb = `<circle cx="248" cy="240" r="10" fill="${C.yarn}"${k.F('yarn')}/>`;
    for (let i = 0; i < 5; i++) yb += `<path d="M${240 + i * 1.4} ${232 + i * 0.6}Q${252 - i} ${238 + i * 2} ${244 + i * 2.6} ${249}" stroke="${C.yarnD}" stroke-width="1.1" fill="none"/>`;
    k.add('ts-doll', `<path d="M206 222Q222 252 240 246" stroke="${C.yarn}" stroke-width="1.2" fill="none"/>` + k.g('res', yb));
    css += k.anim('res', '0%,100%{transform:none}45%,60%{transform:translateX(30px) rotate(300deg)}', { dur: 2.3 });
    css += nod(k, 'btn-head', 0.4);
  }
  k.light('ts-light');
  return k.end({ css });
};

// final: the mended music box, everyone gathered; tap: it plays, notes rise, all sway
S.final = function () {
  const k = T.kit(46), C = k.C;
  let css = '';
  const h = helped();
  room(k, 236);
  k.add('ts-back', k.glow(150, 150, 120, C.lamp, 0.35));
  k.add('ts-box', k.musicBox(150, 236, 1.22));
  css += play(k) + k.notes('ts-fx', [[126, 168], [146, 170], [166, 168], [182, 172]], { s: 1.2 });
  css += comp(k, 'ts-soldier', 252, 236, 0.66);
  k.add('ts-doll', k.shadow(50, 236, 11) + k.kid(50, 236, 0.6) + k.shadow(84, 236, 10) + k.button(84, 236, 0.52));
  css += sway(k, 'kid', 4, 0, 3) + sway(k, 'btn', 4, 0.4, 2);
  if (h === 'duck') k.add('ts-doll', k.shadow(282, 236, 16) + k.duck(282, 236, 0.8, { string: false }));
  if (h === 'mouse') k.add('ts-doll', k.shadow(282, 236, 14) + k.mouse(282, 236, 0.9));
  k.light('ts-light');
  return k.end({ css });
};

// =============================================================================================
// ENDINGS
// the whole shop dancing (night, warm): the back shelf bounces, notes everywhere
function danceRoom(k) {
  const C = k.C;
  k.wall('ts-wall', { lamp: [0.5, 0.02], glowOp: 0.65 });
  // paper garland of little flags
  let gl = `<path d="M-4 30Q150 70 304 30" stroke="#e8d8b0" stroke-width=".8" fill="none"/>`;
  const fc = [C.red, C.jackY, C.felt, C.jackB, C.tutu];
  for (let i = 0; i < 13; i++) { const x = 8 + i * 23, y = 30 + Math.sin((x + 4) / 308 * Math.PI) * 30; gl += `<path d="M${f1(x - 6)} ${f1(y)}L${f1(x + 6)} ${f1(y)}L${f1(x)} ${f1(y + 12)}Z" fill="${fc[i % 5]}"${k.F('felt')}/>`; }
  k.add('ts-wall', gl);
  // the blurred back shelf in its own group, so the whole shelf can bounce
  const before = k.parts['ts-back'] || '';
  k.parts['ts-back'] = '';
  k.backShelf('ts-back', 140);
  k.parts['ts-back'] = before + k.g('bk', k.parts['ts-back']);
  k.under('ts-back', 256);
  k.shelf('ts-shelf', 236);
  return hops(k, 'bk', 3, 0, 4);
}
S['end-soldier-dance'] = function () {
  const k = T.kit(51), C = k.C;
  let css = danceRoom(k);
  k.add('ts-box', k.musicBox(246, 236, 0.74));
  css += play(k) + k.notes('ts-fx', [[230, 180], [250, 176], [266, 180], [214, 184], [240, 170]], { step: 0.32, rise: 80 });
  k.add('ts-soldier', k.shadow(70, 236, 15) + k.soldier(70, 236, 0.7));
  css += march(k, 'so');
  k.add('ts-doll', k.shadow(126, 236, 12) + k.kid(126, 236, 0.62, { armsUp: true }) + k.shadow(170, 236, 11) + k.button(170, 236, 0.56, { armsUp: true }));
  css += hops(k, 'kid', 7, 0, 4) + hops(k, 'btn', 7, 0.3, 3);
  const h = helped();
  if (h === 'duck') { k.add('ts-doll', k.duck(28, 236, 0.7, { string: false })); css += hops(k, 'dk', 4, 0.15, 3); }
  if (h === 'mouse') { k.add('ts-doll', k.mouse(28, 236, 0.8)); css += hops(k, 'ms', 4, 0.15, 3); }
  css += k.twinkles('ts-fx', [[40, 110, 4], [150, 96, 4], [270, 112, 4], [100, 150, 3]], { delay: 0.2, step: 0.4 });
  k.light('ts-light');
  return k.end({ css });
};
S['end-ballerina-dance'] = function () {
  const k = T.kit(52), C = k.C;
  let css = danceRoom(k);
  k.add('ts-box', k.musicBox(240, 236, 0.74));
  css += play(k) + k.notes('ts-fx', [[224, 180], [244, 176], [260, 180], [208, 184], [234, 170]], { step: 0.32, rise: 80 });
  k.add('ts-fx', k.glow(136, 190, 46, '#ffd0e0', 0.35));
  k.add('ts-soldier', k.shadow(136, 236, 12) + k.ballerina(136, 236, 1.08));
  css += twirl(k, 'bal');
  k.add('ts-doll', k.shadow(66, 236, 12) + k.kid(66, 236, 0.62, { armsUp: true }) + k.shadow(186, 236, 11) + k.button(186, 236, 0.54, { armsUp: true }));
  css += hops(k, 'kid', 7, 0, 4) + hops(k, 'btn', 7, 0.3, 3);
  const h = helped();
  if (h === 'duck') { k.add('ts-doll', k.duck(24, 236, 0.66, { string: false })); css += hops(k, 'dk', 4, 0.15, 3); }
  if (h === 'mouse') { k.add('ts-doll', k.mouse(26, 236, 0.76)); css += hops(k, 'ms', 4, 0.15, 3); }
  css += k.twinkles('ts-fx', [[110, 150, 4], [164, 140, 3.6], [136, 120, 4.4], [60, 110, 3]], { delay: 0.2, step: 0.3, fill: '#ffe0ec' });
  k.light('ts-light');
  return k.end({ css });
};
// dawn: the shopkeeper hangs a "Not for sale" card on the playing box
function dawnRoom(k, winX) {
  k.wall('ts-wall', { lamp: [winX > 150 ? 0.8 : 0.2, 0.3], glow: k.C.dawn, glowOp: 0.6 });
  k.shopWindow('ts-wall', winX, 24, 90, 130, { dawn: true });
  k.add('ts-wall', `<path d="M${winX + 10} 154L${winX - 60} 300H${winX + 150}L${winX + 80} 154Z" fill="${k.C.dawnL}" opacity=".12"/>`);
  k.under('ts-back', 256);
  k.shelf('ts-shelf', 236);
}
S['end-soldier-secret'] = function () {
  const k = T.kit(53), C = k.C;
  let css = '';
  dawnRoom(k, 196);
  k.backShelf('ts-back', 196, { opacity: 0.7, dx: -150 });
  k.add('ts-box', k.musicBox(140, 236, 1.05));
  css += play(k) + k.notes('ts-fx', [[118, 170], [138, 172], [156, 170]], { s: 1.1 });
  k.add('ts-fx', k.g('card', shopHand(k, 150, 102, 0.62)));
  css += k.anim('card', '0%,100%{transform:none}50%{transform:translateY(-4px) rotate(-2deg)}', { dur: 1.2, count: 2 });
  k.add('ts-soldier', k.shadow(36, 236, 13) + k.soldier(36, 236, 0.66, { wink: true }));
  css += k.spin('so-key', 4, 0.6, 0);
  k.add('ts-doll', k.shadow(258, 236, 18) + k.button(258, 236, 0.8, { sit: true }));
  css += nod(k, 'btn-head', 0.6);
  css += k.twinkles('ts-fx', [[220, 60, 4], [260, 90, 3.4], [236, 120, 3]], { delay: 0.2, step: 0.4, fill: '#fff6dc' });
  k.light('ts-light', { dawn: true, motes: 12 });
  return k.end({ css });
};
S['end-ballerina-secret'] = function () {
  const k = T.kit(54), C = k.C;
  let css = '';
  dawnRoom(k, 14);
  k.backShelf('ts-back', 196, { opacity: 0.7, dx: 150 });
  k.add('ts-box', k.musicBox(164, 236, 1.05));
  css += play(k) + k.notes('ts-fx', [[142, 170], [162, 172], [180, 170]], { s: 1.1 });
  k.add('ts-fx', k.g('card', shopHand(k, 172, 102, 0.62)));
  css += k.anim('card', '0%,100%{transform:none}50%{transform:translateY(-4px) rotate(-2deg)}', { dur: 1.2, count: 2 });
  // the ballerina back on her own little pink jewellery box
  k.add('ts-soldier', k.shadow(266, 236, 22) + `<path d="M244 236H288V212H244Z" fill="${C.tutuD}"${k.F('wood')}/><path d="M244 212L250 206H294L288 212Z" fill="${C.tutu}"/><path d="M288 236L294 230V206L288 212Z" fill="#b8607e"/>` +
    `<path d="M252 220H280" stroke="${C.gold}" stroke-width="1"/><circle cx="266" cy="226" r="2" fill="${C.gold}"/>` + k.ballerina(268, 210, 0.82));
  css += twirl(k, 'bal');
  k.add('ts-doll', k.shadow(46, 236, 18) + k.button(46, 236, 0.8, { sit: true }));
  css += nod(k, 'btn-head', 0.6);
  css += k.twinkles('ts-fx', [[40, 60, 4], [80, 96, 3.4], [56, 124, 3]], { delay: 0.2, step: 0.4, fill: '#fff6dc' });
  k.light('ts-light', { dawn: true, motes: 12 });
  return k.end({ css });
};

// ---- small choice icons (flat; used in pages.js option buttons) -----------------------------
const ic = inner => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="width:2.6em;height:2.6em;vertical-align:middle;margin-right:.4em" aria-hidden="true">${inner}</svg>`;
S.icons = {
  soldier: ic(`<path d="M13 15C12 7 15 3 20 3C25 3 28 7 27 15Z" fill="${C0.black}"/><circle cx="20" cy="18" r="5" fill="${C0.skin}"/><circle cx="18.3" cy="17.6" r=".8" fill="${C0.black}"/><circle cx="21.7" cy="17.6" r=".8" fill="${C0.black}"/><path d="M18.4 20Q20 21.4 21.6 20" stroke="${C0.redD}" stroke-width=".7" fill="none"/><path d="M12 24H28V34H12Z" fill="${C0.red}"/><path d="M12.6 24L27.4 34M27.4 24L12.6 34" stroke="#fff" stroke-width="1.6"/><path d="M15 34V38M25 34V38" stroke="${C0.black}" stroke-width="3"/>`),
  ballerina: ic(`<circle cx="20" cy="10" r="4" fill="${C0.porc}" stroke="${C0.porcD}" stroke-width=".5"/><circle cx="20" cy="5.4" r="2" fill="${C0.bun}"/><path d="M17 14H23L22 22H18Z" fill="${C0.tutuD}"/><ellipse cx="20" cy="22" rx="12" ry="3.4" fill="${C0.tutu}"/><path d="M19.4 24V37M20.6 24L26 30L21 32" stroke="${C0.tights}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M17 15C11 12 12 5 18 4M23 15C29 12 28 5 22 4" stroke="${C0.porcD}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`),
  high: ic(`<path d="M6 36H34M6 24H34M6 12H34" stroke="${C0.wood}" stroke-width="3"/><path d="M14 36L22 4M22 36L30 4" stroke="${C0.woodD}" stroke-width="1.6"/><path d="M20 2L14 9H26Z" fill="${C0.gold}"/>`),
  low: ic(`<path d="M2 12H38" stroke="${C0.wood}" stroke-width="5"/><path d="M14 12H26" stroke="#1a0d06" stroke-width="5"/><ellipse cx="20" cy="32" rx="16" ry="4" fill="${C0.water}"/><path d="M12 30Q20 34 28 30L26 34Q20 36 14 34Z" fill="#c9a06a"/><path d="M20 30V22L25 28Z" fill="#f6ecd4"/><path d="M20 38L14 31H26Z" fill="${C0.gold}" transform="translate(0 -18)"/>`),
  help: ic(`<path d="M20 34C8 25 6 15 12 11C16 8 19 11 20 14C21 11 24 8 28 11C34 15 32 25 20 34Z" fill="${C0.sock}"/><path d="M14 16Q16 13 18 14" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/>`),
  hurry: ic(`<path d="M6 20H28M20 11L30 20L20 29" stroke="${C0.felt}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 13H12M2 27H10" stroke="${C0.feltL}" stroke-width="2" stroke-linecap="round"/>`),
  dance: ic(`<path d="M10 30V10l18-4v20" stroke="${C0.gold}" stroke-width="2.4" fill="none"/><ellipse cx="7" cy="30" rx="4" ry="3" fill="${C0.gold}"/><ellipse cx="25" cy="26" rx="4" ry="3" fill="${C0.gold}"/><path d="M30 4L31 7L34 8L31 9L30 12L29 9L26 8L29 7Z" fill="${C0.tutu}"/>`),
  secret: ic(`<path d="M6 34H34V18H6Z" fill="${C0.box}"/><path d="M4 18L20 10L36 18Z" fill="${C0.boxL}"/><circle cx="20" cy="26" r="3" fill="${C0.gold}"/><path d="M28 2A8 8 0 1 0 36 12A6 6 0 1 1 28 2Z" fill="${C0.dawn}"/>`)
};

window.TOYSHOP_SCENES = S;
})();
