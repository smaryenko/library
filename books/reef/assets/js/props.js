// "A Day on the Reef" — the page scenes.
//
// Built the RACE-BOOK way (see books/race/assets/js/props.js): every spread is
// ONE flat scene SVG (designed in 0 0 360 300; rendered through a padded
// viewBox so it fits the half page — see VIEWBOX below). Characters are emitted into it by
// the draw*() helpers in reeflife.js, each layer inside its own flat,
// role-named `<g data-part="...">` (never nested), with placement on a plain
// no-data-part <g> inside. All gradients/clip-paths go in the root <defs> so
// every split layer has them.
//
// Motion comes from the shared library (assets/js/motion.js): each scene
// composes its own one-shot from Motion primitives with Motion.rig(). Limbs
// `follow` their body, so a flipper or claw rides along exactly while doing
// its own stroke/wave — no part is ever left behind.
//
// Whenever the clownfish shares a page with the shell (or the crab who lives
// in it), she faces it and tilts toward it (reefFaceToward).

(function () {
  'use strict';

  const M = window.Motion;
  const shade = reefShade;
  const FISH = ['fish-back', 'fish', 'fish-front'];

  // ---- scene plumbing ------------------------------------------------------
  // FIT TO THE HALF PAGE. The engine's image slot is a square 58% of the
  // spread wide and lifted above centre, so a scene drawn edge-to-edge in
  // 0 0 360 300 spills past the page edge and above the top (unlike the xmas /
  // race art, which carries its own margins). Instead of re-authoring every
  // scene, the viewBox is padded: all art and animation coordinates stay in
  // the 360x300 design space, which now renders ~80% size, nudged down and
  // centred on the page half. (transform-box:view-box origins are measured
  // from user-space 0,0, so padding the viewBox doesn't move any pivot.)
  const VIEWBOX = '-25 -78 452 377';
  function svg(defs, style, body) {
    return `<svg viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs.join('')}</defs>
      ${style}
      ${body}
    </svg>`;
  }
  const part = (name, inner) => `<g data-part="${name}">${inner}</g>`;
  const fx = (name, inner) => `<g data-part="${name}" opacity="0">${inner}</g>`;

  // the clownfish as three depth layers
  function fish(D, o) {
    const c = drawClownfish(o);
    D.push(c.defs);
    return part('fish-back', c.back) + part('fish', c.body) + part('fish-front', c.front);
  }
  // clownfish placed at (x,y), facing + tilted toward a target point
  function fishLooking(D, x, y, s, tx, ty, pose, max) {
    const look = reefFaceToward(x, y, tx, ty, max);
    return { svg: fish(D, { x, y, s, flip: look.flip, tilt: look.tilt, pose }), look };
  }
  function conch(D, o) {
    const c = drawConch(o);
    D.push(c.defs);
    return c;
  }
  function crab(D, o) {
    const c = drawHermitCrab(o);
    D.push(c.defs);
    return c;
  }
  const ellipseShadow = (name, cx, cy, rx, ry) =>
    part(name, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(4,40,58,0.24)"/>`);

  // ---- scenery -------------------------------------------------------------
  function sandStrip(cy, rx, ry) {
    return part('sand', `
      <ellipse cx="180" cy="${cy}" rx="${rx}" ry="${ry}" fill="#e4d2a0" opacity="0.92"/>
      <ellipse cx="180" cy="${cy - ry * 0.35}" rx="${rx * 0.8}" ry="${ry * 0.4}" fill="#f1e2b6" opacity="0.6"/>
      <g fill="#cdb67e" opacity="0.6">
        <circle cx="${180 - rx * 0.6}" cy="${cy + 4}" r="2"/><circle cx="${180 - rx * 0.2}" cy="${cy + 8}" r="1.6"/>
        <circle cx="${180 + rx * 0.3}" cy="${cy + 2}" r="2.2"/><circle cx="${180 + rx * 0.64}" cy="${cy + 7}" r="1.6"/>
      </g>`);
  }

  function anemone(cx, baseY, s, color) {
    const tipCol = color || '#e46a86';
    const tipLt = shade(tipCol, 0.3);
    let tips = '';
    for (let i = 0; i < 22; i++) {
      const u = (i / 21) * 2 - 1;
      const x = cx + u * 70 * s;
      const h = (44 + Math.abs(Math.cos(i)) * 30) * s;
      const bend = (i % 2 ? 1 : -1) * 10 * s;
      tips += `<path d="M${x.toFixed(1)} ${baseY}
                 q${bend} ${-h * 0.6} ${bend * 0.3} ${-h}
                 q${6 * s} ${4 * s} ${10 * s} 0
                 q${-bend * 0.3} ${h * 0.6} ${bend} ${h} z"
               fill="${i % 3 ? tipCol : tipLt}" opacity="0.92"/>`;
    }
    return {
      base: part('anemone', `
          <ellipse cx="${cx}" cy="${baseY}" rx="${80 * s}" ry="${26 * s}" fill="${shade(tipCol, -0.2)}"/>
          <ellipse cx="${cx}" cy="${baseY - 6 * s}" rx="${64 * s}" ry="${18 * s}" fill="${tipCol}" opacity="0.6"/>`),
      tips: part('anemone-tips', tips)
    };
  }

  function coralHead(cx, baseY, s, col) {
    const lt = shade(col, 0.28), dk = shade(col, -0.24);
    return `
      <path d="M${cx - 60 * s} ${baseY}
               q-${6 * s} -${70 * s} ${30 * s} -${74 * s}
               q${20 * s} -${30 * s} ${34 * s} 0
               q${18 * s} -${40 * s} ${32 * s} 2
               q${16 * s} ${30 * s} ${24 * s} ${72 * s} z" fill="${col}"/>
      <path d="M${cx - 30 * s} ${baseY - 40 * s} q${20 * s} -${30 * s} ${40 * s} 0 q-${20 * s} -${14 * s} -${40 * s} 0 z"
            fill="${lt}" opacity="0.6"/>
      <g fill="${dk}" opacity="0.5">
        <circle cx="${cx - 20 * s}" cy="${baseY - 20 * s}" r="${5 * s}"/>
        <circle cx="${cx + 14 * s}" cy="${baseY - 34 * s}" r="${5 * s}"/>
        <circle cx="${cx + 2 * s}" cy="${baseY - 6 * s}" r="${5 * s}"/>
      </g>`;
  }

  function staghorn(cx, baseY, s, col) {
    return `<path d="M${cx} ${baseY} q-${4 * s} -${50 * s} -${20 * s} -${64 * s}
               M${cx} ${baseY} q${2 * s} -${54 * s} ${18 * s} -${70 * s}
               M${cx - 14 * s} ${baseY - 44 * s} q-${16 * s} -${8 * s} -${22 * s} -${28 * s}
               M${cx + 12 * s} ${baseY - 48 * s} q${16 * s} -${10 * s} ${22 * s} -${30 * s}"
            fill="none" stroke="${col}" stroke-width="${12 * s}" stroke-linecap="round"/>
      <path d="M${cx} ${baseY} q${2 * s} -${54 * s} ${18 * s} -${70 * s}"
            fill="none" stroke="${shade(col, 0.3)}" stroke-width="${4 * s}" stroke-linecap="round" opacity="0.6"/>`;
  }

  function kelpBlade(x, baseY, h, col) {
    const bend = (Math.sin(x) > 0 ? 1 : -1) * 22;
    return `<path d="M${x} ${baseY}
               q${bend} ${-h * 0.4} ${bend * 0.5} ${-h * 0.75}
               q${-bend * 0.4} ${-h * 0.3} ${bend * 0.3} ${-h}
               q10 6 16 0
               q${-bend * 0.3} ${h * 0.3} ${bend * 0.4} ${h * 0.75}
               q${-bend * 0.5} ${h * 0.4} ${-bend} ${h} z" fill="${col}"/>
      <path d="M${x + 8} ${baseY} q${bend} ${-h * 0.4} ${bend * 0.5} ${-h * 0.75} q${-bend * 0.4} ${-h * 0.3} ${bend * 0.3} ${-h * 0.98}"
            fill="none" stroke="${shade(col, 0.3)}" stroke-width="2" opacity="0.5"/>`;
  }

  // a ring of rising bubbles around (x,y)
  function bubbles(x, y, n, spread, seed) {
    const rnd = reefRand(seed || 77);
    let out = '';
    for (let i = 0; i < n; i++) {
      const bx = x + (rnd() - 0.5) * spread, by = y + (rnd() - 0.5) * spread * 0.6, r = 2.5 + rnd() * 5;
      out += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(234,255,255,0.18)" stroke="#eaffff" stroke-width="1.6"/>
              <circle cx="${(bx - r * 0.35).toFixed(1)}" cy="${(by - r * 0.35).toFixed(1)}" r="${(r * 0.25).toFixed(1)}" fill="#ffffff"/>`;
    }
    return out;
  }
  // a four-point glint
  function glint(x, y, r) {
    return `<path d="M${x} ${y - r} L${x + r * 0.22} ${y - r * 0.22} L${x + r} ${y} L${x + r * 0.22} ${y + r * 0.22}
                     L${x} ${y + r} L${x - r * 0.22} ${y + r * 0.22} L${x - r} ${y} L${x - r * 0.22} ${y - r * 0.22} Z" fill="#fffbe6"/>
            <circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="#ffffff"/>`;
  }
  function ripple(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e6fbff" stroke-width="3" opacity="0.8"/>
            <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="none" stroke="#e6fbff" stroke-width="2" opacity="0.6"/>`;
  }
  // a tiny blue-green chromis (background school on page 1), faces left
  function chromis(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-18 0 C-14 -9 4 -10 12 -3 L22 -9 L19 0 L22 9 L12 3 C4 10 -14 9 -18 0 Z" fill="#5fc7c9"/>
      <path d="M-14 -3 C-6 -8 4 -8 10 -3 C2 -5 -6 -5 -14 -1 Z" fill="#c6f2ee" opacity="0.7"/>
      <circle cx="-11" cy="-1.5" r="2.4" fill="#fff"/><circle cx="-11.4" cy="-1.5" r="1.4" fill="#10202a"/>
    </g>`;
  }

  // ==========================================================================
  // PAGE 1 — THE REEF: anemone, corals, a little chromis school whisks by.
  function buildReefHome() {
    const D = [];
    const an = anemone(180, 244, 1.2, '#e46a86');
    const style = M.rig({ dur: 2.0, parts: {
      'anemone-tips': { stops: M.osc('kx', 6, { n: 4 }), pivot: [180, 244] },
      'coral-mid': { stops: M.osc('r', 3, { n: 3 }), pivot: [312, 258] },
      'coral-front': { stops: M.osc('r', -3, { n: 3, from: 10 }), pivot: [44, 268] },
      school: { stops: M.dash({ dir: -1, dist: 420, tilt: 0, out: 40, back: 58, over: 10 }), pivot: [250, 104] },
      'fx-bubbles': { stops: M.rise({ h: 130, dx: 12, from: 6, to: 92 }), pivot: [180, 200] }
    } });
    return svg(D, style, `
      ${sandStrip(266, 180, 34)}
      ${part('coral-back', coralHead(56, 262, 0.9, '#7b6fbf'))}
      ${part('coral-mid', coralHead(312, 258, 1.0, '#e08a4a'))}
      ${an.base}${an.tips}
      ${part('school', chromis(222, 92, 1) + chromis(250, 110, 0.9) + chromis(276, 94, 1.05) + chromis(240, 128, 0.8) + chromis(292, 120, 0.85))}
      ${part('coral-front', staghorn(44, 268, 0.9, '#e2a0c0') + staghorn(330, 272, 0.7, '#5fbf8a'))}
      ${fx('fx-bubbles', bubbles(180, 196, 7, 60, 11))}`);
  }

  // PAGE 2 — THE CLOWNFISH darts out of her anemone: a quick out-and-back
  // figure with two turns (she flips round at each end), bubbles behind.
  function buildClownfishSolo() {
    const D = [];
    const an = anemone(180, 262, 1.05, '#e46a86');
    const FX = 186, FY = 120;
    const style = M.rig({ dur: 1.8, parts: {
      dart: { parts: FISH, pivot: [FX, FY], stops: M.path([
        [0], [20, -104, -20, 6], [28, -116, -10, 0, { sx: -1 }], [50, 64, 16, -4, { sx: -1 }],
        [58, 72, 8, 0], [82, -8, -4, 2], [100]]) },
      'anemone-tips': { stops: M.osc('kx', 7, { n: 4, from: 10 }), pivot: [180, 262] },
      'fx-bubbles': { stops: M.rise({ h: 90, dx: -10, from: 8, to: 80 }), pivot: [FX, FY] }
    } });
    return svg(D, style, `
      ${sandStrip(276, 176, 26)}
      ${an.base}${an.tips}
      ${fx('fx-bubbles', bubbles(FX + 60, FY + 10, 6, 40, 23))}
      ${fish(D, { x: FX, y: FY, s: 0.78, pose: 'calm' })}`);
  }

  // PAGE 3 — THE SHELL on the sand; she turns to it and swims over for a
  // nose-bump; it rocks, and glints twice.
  function buildShellSpot() {
    const D = [];
    const SX = 252, SY = 228, SS = 0.46;
    const sh = conch(D, { x: SX, y: SY, s: SS });
    const f = fishLooking(D, 104, 140, 0.5, SX, SY - 6, 'spot');
    const g1 = sh.pt(64, -92), g2 = sh.pt(-122, -66);
    const style = M.rig({ dur: 1.8, parts: {
      swim: { parts: FISH, pivot: [104, 140],
        stops: M.approach({ dx: f.look.ux * 64, dy: f.look.uy * 64, bump: 0.2, arrive: 32, leave: 66 }) },
      shell: { stops: M.osc('r', 7, { n: 4, from: 40, to: 82 }), pivot: [SX, SY + 28] },
      'fx-spark': { stops: M.spark({ at: 24, s: 1.3 }), pivot: g1 },
      'fx-front': { stops: M.spark({ at: 66, s: 1.1 }), pivot: g2 },
      'coral-back': { stops: M.osc('r', 2, { n: 3 }), pivot: [56, 262] }
    } });
    return svg(D, style, `
      ${sandStrip(272, 182, 30)}
      ${part('coral-back', coralHead(56, 262, 0.7, '#6f9fbf'))}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 30, 66, 8)}
      ${part('shell', sh.shell)}
      ${fx('fx-spark', glint(g1[0], g1[1], 12))}
      ${fx('fx-front', glint(g2[0], g2[1], 9))}
      ${f.svg}`);
  }

  // PAGE 4 — THE TIDE tugs the shell away (it tumbles off on the current);
  // she lunges after it, bubbles streaming from her tail.
  function buildCurrent() {
    const D = [];
    const SX = 100, SY = 132;
    const sh = conch(D, { x: SX, y: SY, s: 0.36, rot: -14 });
    const f = fishLooking(D, 262, 158, 0.5, SX, SY, 'chase');
    let swirl = '';
    for (let i = 0; i < 5; i++) {
      const y = 86 + i * 34;
      swirl += `<path d="M30 ${y} q60 -16 120 0 t160 0" fill="none" stroke="#bfeefc" stroke-width="3" opacity="0.5" stroke-linecap="round"/>
                <path d="M${60 + i * 40} ${y - 8} l-10 -5 m10 5 l-10 5" stroke="#d8f6ff" stroke-width="2" opacity="0.55" stroke-linecap="round"/>`;
    }
    const style = M.rig({ dur: 1.8, parts: {
      swirl: { stops: M.path([[0], [45, -50, 0, 0, { o: 0 }], [47, 50, 0, 0, { o: 0 }], [100]]) },
      shell: { stops: M.tumble({ dx: -74, dy: -30, turns: 1 }), pivot: [SX, SY] },
      chase: { parts: FISH, pivot: [262, 158],
        stops: M.path([[0], [16, 12, 0, 0], [48, -88, -12, 0, { ease: 'out' }], [66, -72, -10, 0], [100]]) },
      'fx-bubbles': { stops: M.rise({ h: 60, dx: 40, from: 16, to: 78 }), pivot: [300, 160] }
    } });
    return svg(D, style, `
      ${sandStrip(272, 188, 28)}
      ${part('swirl', swirl)}
      ${part('shell', sh.shell)}
      ${fx('fx-bubbles', bubbles(300, 160, 6, 36, 31))}
      ${f.svg}`);
  }


  // PAGE 5 — THE PUFFERFISH swims up, gulps water and PUFFS into a prickly
  // ball that bumps the shell; the shell rolls to the clownfish, she catches
  // it and nudges it back while he deflates.
  function buildPufferScene() {
    const D = [];
    const SX = 178, SY = 232, PX = 288, PY = 176;
    const sh = conch(D, { x: SX, y: SY, s: 0.36 });
    const f = fishLooking(D, 70, 146, 0.4, SX, SY - 6, 'spot');
    const pf = drawPuffer({ x: PX, y: PY, s: 0.5 });
    D.push(pf.defs);
    const shellRoll = M.roll({ dx: -44, radius: 22, from: 38, hold: 76 });
    const style = M.rig({ dur: 2.0, parts: {
      'puffer-path': { parts: [], pivot: [PX, PY],
        stops: M.path([[0], [22, -12, 0], [36, -26, -2, 0, { ease: 'snap' }], [46, -14, 0], [80, -14, 0], [100]]) },
      puffer: { follow: 'puffer-path', pivot: [PX, PY], stops: [
        { at: 0 }, { at: 16, sx: 1.05, sy: 1.14 }, { at: 26, s: 1.25, o: 0 },
        { at: 78, s: 1.25, o: 0 }, { at: 90, s: 1, o: 1 }, { at: 100 }] },
      'puffer-ball': { follow: 'puffer-path', pivot: [PX, PY], stops: [
        { at: 0, s: 0.7, o: 0 }, { at: 20, s: 0.7, o: 0, ease: 'snap' }, { at: 30, s: 1.1, o: 1 },
        { at: 36, s: 0.96, o: 1 }, { at: 42, s: 1.04, o: 1 }, { at: 50, s: 1, o: 1 },
        { at: 74, s: 1, o: 1 }, { at: 84, s: 0.7, o: 0 }, { at: 100, s: 0.7, o: 0 }] },
      'fx-ripple': { stops: M.puff({ from: 32, to: 70, s0: 0.3, s1: 1.8 }), pivot: [236, 204] },
      shell: { stops: shellRoll, pivot: [SX, SY] },
      'shell-shadow': { stops: M.pick(shellRoll, ['x']) },
      catch: { parts: FISH, pivot: [70, 146],
        stops: M.path([[0], [56, 0, 0], [66, 8, -6, -6], [78, 16, 4, 0], [92, 4, 0, 0], [100]]) }
    } });
    return svg(D, style, `
      ${sandStrip(272, 190, 28)}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 26, 52, 7)}
      ${part('shell', sh.shell)}
      ${fx('fx-ripple', ripple(236, 204, 24))}
      ${part('puffer', pf.puffer)}
      ${fx('puffer-ball', pf.ball)}
      ${f.svg}`);
  }

  // PAGE 6 — THE OCTOPUS leans in and SWEEPS its arms, sliding the shell
  // across to the clownfish, who gives a happy little hop.
  function buildOctopusScene() {
    const D = [];
    const SX = 176, SY = 232, OX = 292, OY = 186;
    const sh = conch(D, { x: SX, y: SY, s: 0.34 });
    const f = fishLooking(D, 68, 140, 0.4, SX, SY - 6, 'chase');
    const oc = drawOctopus({ x: OX, y: OY, s: 0.5 });
    D.push(oc.defs);
    const slide = M.path([[0], [40, 0, 0, 0], [62, -58, 0, -50, { ease: 'out' }], [76, -62, 0, -54], [100]]);
    const style = M.rig({ dur: 1.8, parts: {
      'octo-path': { parts: [], pivot: [OX, OY + 28],
        stops: M.path([[0], [24, -8, 0, -6], [44, -34, 6, -16], [64, -22, 2, -6], [100]]) },
      octo: { follow: 'octo-path' },
      'octo-arms': { follow: 'octo-path', pivot: oc.pt(0, 16), stops: [
        { at: 0 }, { at: 24, kx: 10 }, { at: 44, kx: -20, sx: 1.1 }, { at: 64, kx: 6 }, { at: 100 }] },
      shell: { stops: slide, pivot: [SX, SY] },
      'shell-shadow': { stops: M.pick(slide, ['x']) },
      happy: { parts: FISH, pivot: [68, 140], stops: M.within(M.hop({ h: 18, tilt: 4 }), 58, 98) },
      'fx-bubbles': { stops: M.rise({ h: 80, dx: -8, from: 40, to: 96 }), pivot: oc.pt(0, -90) }
    } });
    return svg(D, style, `
      ${sandStrip(272, 190, 28)}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 24, 50, 7)}
      ${part('shell', sh.shell)}
      ${part('octo-arms', oc.arms)}
      ${part('octo', oc.mantle)}
      ${fx('fx-bubbles', bubbles(OX, OY - 50, 5, 30, 41))}
      ${f.svg}`);
  }

  // PAGE 7 — THE CORAL GARDEN: the shell drifts ahead on the current; she
  // weaves up and down through the coral after it.
  function buildCoralGarden() {
    const D = [];
    const SX = 70, SY = 150;
    const sh = conch(D, { x: SX, y: SY, s: 0.3, rot: 20 });
    const f = fishLooking(D, 236, 124, 0.44, SX, SY, 'chase');
    const style = M.rig({ dur: 1.9, parts: {
      shell: { pivot: [SX, SY], stops: M.mix(M.path([[0], [50, -22, 0, -22], [100]]), M.osc('y', 8, { n: 4 })) },
      weave: { parts: FISH, pivot: [236, 124], stops: M.path([
        [0], [18, -30, 24, -12], [40, -70, -6, 10], [60, -100, 12, -8], [80, -44, 6, 0], [100]]) },
      'coral-front': { stops: M.osc('r', 3, { n: 3 }), pivot: [180, 286] },
      'coral-back': { stops: M.osc('kx', 2, { n: 3 }), pivot: [180, 262] }
    } });
    return svg(D, style, `
      ${sandStrip(272, 188, 30)}
      ${part('coral-back', coralHead(72, 262, 0.9, '#6f9fbf') + coralHead(300, 256, 0.85, '#7b6fbf'))}
      ${part('shell', sh.shell)}
      ${f.svg}
      ${part('coral-front', coralHead(150, 286, 1.5, '#e2574e') + staghorn(320, 276, 0.8, '#5fbf8a') + staghorn(36, 280, 0.7, '#e2a0c0'))}`);
  }

  // PAGE 8 — THE SEA TURTLE gives her a lift: with the clownfish riding on
  // its shell it powers off the page with big flipper strokes, and glides
  // back in from the other side.
  function buildTurtleScene() {
    const D = [];
    const TX = 194, TY = 174;
    const tu = drawTurtle({ x: TX, y: TY, s: 0.9 });
    D.push(tu.defs);
    const FX = 206, FY = 96;
    const voyage = M.mix(M.dash({ dir: -1, dist: 470, tilt: 3, out: 34, back: 50, over: 14 }), M.osc('y', -6, { n: 6 }));
    const stroke = M.osc('r', 26, { n: 5, decay: 1 });
    const style = M.rig({ dur: 2.0, parts: {
      'turtle-path': { parts: [], pivot: [TX, TY], stops: voyage },
      turtle: { follow: 'turtle-path' },
      'turtle-far': { follow: 'turtle-path', pivot: tu.pt(-48, 10), stops: M.amp(stroke, 0.8) },
      'turtle-flipper': { follow: 'turtle-path', pivot: tu.pt(-56, 16), stops: stroke },
      rider: { parts: FISH, follow: 'turtle-path', pivot: [FX, FY], stops: M.osc('r', 6, { n: 4 }) },
      'turtle-shadow': { stops: M.pick(voyage, ['x', 'o']) },
      'fx-bubbles': { stops: M.rise({ h: 70, dx: 30, from: 4, to: 50 }), pivot: tu.pt(-150, 0) }
    } });
    return svg(D, style, `
      ${sandStrip(272, 196, 26)}
      ${ellipseShadow('turtle-shadow', TX - 6, 262, 118, 9)}
      ${part('turtle-far', tu.far)}
      ${part('turtle', tu.body)}
      ${fish(D, { x: FX, y: FY, s: 0.3, pose: 'ride', tilt: 0 })}
      ${part('turtle-flipper', tu.flipper)}
      ${fx('fx-bubbles', bubbles(tu.pt(-150, 0)[0], tu.pt(-150, 0)[1], 6, 34, 51))}`);
  }

  // PAGE 9 — THE SEAHORSE rises on a little corkscrew and POINTS twice with
  // its snout (fan fin fluttering); a trail of bubbles shows the way, and the
  // clownfish turns round to look where it points.
  function buildSeahorseScene() {
    const D = [];
    const HX = 118, HY = 150;
    const sh = drawSeahorse({ x: HX, y: HY, s: 0.6 });
    D.push(sh.defs);
    const snout = sh.pt(76, -44);
    const f = fishLooking(D, 282, 112, 0.4, sh.pt(30, -110)[0], sh.pt(30, -110)[1], 'spot');
    const style = M.rig({ dur: 2.0, parts: {
      'sea-path': { parts: [], pivot: [HX, HY + 10], stops: M.mix(
        M.spiralRise({ h: 26, rx: 10, tilt: 0 }),
        M.path([[0], [30, 0, 0, 0], [42, 0, 0, 14], [52, 0, 0, 6], [62, 0, 0, 16], [78, 0, 0, 0], [100]])) },
      seahorse: { follow: 'sea-path' },
      'seahorse-fin': { follow: 'sea-path', pivot: sh.pt(-53, 14), stops: M.osc('sx', 0.45, { n: 8, decay: 1 }) },
      'fx-trail': { pivot: snout, stops: [
        { at: 0, o: 0 }, { at: 40, o: 0 }, { at: 48, o: 1, x: 20, y: 6 },
        { at: 86, o: 0, x: 170, y: 56 }, { at: 100, o: 0, x: 170, y: 56 }] },
      look: { parts: FISH, pivot: [282, 112], stops: M.path([
        [0], [44, 0, 0, 0], [54, 6, 0, 0, { sx: -1 }], [74, 20, 10, 0, { sx: -1 }], [88, 0, 0, 0], [100]]) }
    } });
    const trail = [0, 1, 2, 3, 4].map(i =>
      `<circle cx="${(snout[0] + 8 + i * 12).toFixed(1)}" cy="${(snout[1] + 4 + i * 4).toFixed(1)}" r="${(4.5 - i * 0.6).toFixed(1)}"
               fill="rgba(234,255,255,0.2)" stroke="#eaffff" stroke-width="1.6"/>`).join('');
    return svg(D, style, `
      ${sandStrip(272, 188, 28)}
      ${part('coral-back', staghorn(300, 272, 0.8, '#7b6fbf') + coralHead(40, 270, 0.7, '#e08a4a'))}
      ${part('seahorse-fin', sh.fin)}
      ${part('seahorse', sh.body)}
      ${fx('fx-trail', trail)}
      ${f.svg}`);
  }

  // PAGE 10 — THE KELP FOREST: the front kelp swings apart like curtains and
  // she pushes through toward the shell glinting on the sand.
  function buildKelpForest() {
    const D = [];
    const SX = 290, SY = 236;
    const sh = conch(D, { x: SX, y: SY, s: 0.3 });
    const f = fishLooking(D, 96, 150, 0.42, SX, SY - 4, 'chase');
    const greens = ['#2e9c6e', '#3bb17d', '#278a5f', '#49b98a'];
    let back = '', left = '', right = '';
    for (let i = 0; i < 7; i++) back += kelpBlade(40 + i * 48, 290, 220 + (i % 3) * 30, shade(greens[i % 4], -0.14));
    [60, 110, 150].forEach((x, i) => { left += kelpBlade(x, 300, 250 + (i % 2) * 26, greens[i % 4]); });
    [220, 268, 316].forEach((x, i) => { right += kelpBlade(x, 300, 250 + ((i + 1) % 2) * 26, greens[(i + 2) % 4]); });
    const g = sh.pt(64, -92);
    const curtain = r => M.path([[0], [24, 0, 0, 0], [44, 0, 0, r], [72, 0, 0, r * 0.85], [92, 0, 0, -r * 0.12], [100]]);
    const style = M.rig({ dur: 1.9, parts: {
      'kelp-back': { stops: M.osc('kx', 4, { n: 3 }), pivot: [180, 290] },
      'kelp-left': { stops: curtain(-14), pivot: [110, 300] },
      'kelp-right': { stops: curtain(14), pivot: [268, 300] },
      push: { parts: FISH, pivot: [96, 150], stops: M.path([[0], [24, 8, 4, 0], [52, 98, 40, 0], [70, 108, 44, 0], [100]]) },
      shell: { stops: M.osc('r', 4, { n: 3, from: 56, to: 90 }), pivot: [SX, SY + 18] },
      'fx-spark': { stops: M.spark({ at: 60, s: 1.4 }), pivot: g }
    } });
    return svg(D, style, `
      ${sandStrip(286, 190, 26)}
      ${part('kelp-back', back)}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 20, 44, 6)}
      ${part('shell', sh.shell)}
      ${fx('fx-spark', glint(g[0], g[1], 12))}
      ${f.svg}
      ${part('kelp-left', left)}
      ${part('kelp-right', right)}`);
  }

  // PAGE 11 — THE MORAY EEL leans out from its rock and nudges the shell
  // with its nose; the shell rolls to the clownfish; the eel gives a friendly
  // wiggle-wave and a blink while she wriggles with joy.
  function buildEelScene() {
    const D = [];
    const EX = 258, EY = 160, SX = 128, SY = 232;
    const ee = drawEel({ x: EX, y: EY, s: 0.74 });
    D.push(ee.defs);
    const sh = conch(D, { x: SX, y: SY, s: 0.32 });
    const f = fishLooking(D, 60, 140, 0.38, SX, SY - 6, 'spot');
    const shellRoll = M.roll({ dx: -46, radius: 20, from: 42, hold: 76 });
    const style = M.rig({ dur: 1.9, parts: {
      eel: { pivot: [312, 204], stops: M.path([
        [0], [20, 0, 0, 5, { ease: 'snap' }], [38, -6, 4, -25], [46, -4, 3, -22], [58, 0, 0, -2],
        [66, 0, 0, 5], [76, 0, 0, -5], [86, 0, 0, 3], [100]]) },
      'eel-eye': { follow: 'eel', pivot: ee.pt(-96, -60), stops: M.blink({ at: 72, w: 5 }) },
      shell: { stops: shellRoll, pivot: [SX, SY] },
      'shell-shadow': { stops: M.pick(shellRoll, ['x']) },
      joy: { parts: FISH, pivot: [60, 140], stops: M.mix(
        M.within(M.osc('r', 8, { n: 4 }), 56, 96), M.within(M.hop({ h: 10, tilt: 0 }), 56, 96)) }
    } });
    return svg(D, style, `
      ${sandStrip(272, 200, 26)}
      ${part('rock', `
        <path d="M226 266 C222 214 258 182 300 180 C340 178 366 204 368 266 Z" fill="#8a9bb0" stroke="#3a4656" stroke-width="3" stroke-linejoin="round"/>
        <path d="M240 254 C238 216 266 194 300 192 C326 190 344 200 352 214 C320 200 282 204 262 226 C248 240 244 252 240 254 Z" fill="#a9b8ca" opacity="0.6"/>
        <g fill="#6f8096" opacity="0.6"><circle cx="252" cy="240" r="5"/><circle cx="350" cy="244" r="6"/><circle cx="284" cy="252" r="4"/></g>
        <path d="M262 262 q10 -16 22 -4 q8 -12 18 0" fill="none" stroke="#e46a86" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="322" cy="206" rx="18" ry="13" fill="#1c2733"/>`)}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 22, 46, 6)}
      ${part('shell', sh.shell)}
      ${part('eel', ee.body)}
      ${part('eel-eye', ee.eye)}
      ${part('rock-front', `<path d="M300 206 C306 220 336 222 344 206 C350 226 334 238 318 238 C302 238 294 224 300 206 Z"
            fill="#8a9bb0" stroke="#3a4656" stroke-width="2.4" stroke-linejoin="round"/>`)}
      ${f.svg}`);
  }

  // PAGE 12 — THE HERMIT CRAB: the shell was his house! He ducks inside (the
  // shell wobbles), then POPS out in a puff of sand and waves his big claw —
  // and the clownfish jumps back, startled.
  function buildCrabReveal() {
    const D = [];
    const c = crab(D, { x: 236, y: 212, s: 0.56, flip: true });
    const face = c.pt(104, -36);
    const f = fishLooking(D, 70, 136, 0.4, face[0], face[1], 'startle');
    const body = c.pt(80, 8), hole = c.pt(62, -14);
    const style = M.rig({ dur: 2.0, parts: {
      'crab-path': { parts: [], pivot: c.pt(0, 70), stops: M.path([[0], [50, 0, 0], [56, 0, -10], [62, 0, 0], [100]]) },
      'crab-shell': { follow: 'crab-path', pivot: c.pt(-6, 40), stops: M.within(M.osc('r', 5, { n: 4 }), 18, 50) },
      crab: { follow: 'crab-path', pivot: body,
        stops: M.duck({ dx: (hole[0] - body[0]) * 1.4, dy: (hole[1] - body[1]) * 1.4, s: 0.5, hide: 18, pop: 54 }) },
      'crab-claw': { follow: 'crab', pivot: c.pt(94, 16), stops: M.within(M.osc('r', 30, { n: 4, decay: 0.9 }), 64, 96) },
      'fx-sand': { pivot: c.pt(110, 70), stops: M.puff({ from: 52, to: 82, s0: 0.5, s1: 1.6, dy: -6 }) },
      startle: { parts: FISH, pivot: [70, 136], stops: M.recoil({ dx: -26, dy: -8, r: -12, at: 52 }) },
      'fx-front': { pivot: [118, 108], stops: M.spark({ at: 58, s: 1.2, spin: 0 }) }
    } });
    const sand = c.pt(110, 70);
    return svg(D, style, `
      ${sandStrip(270, 190, 26)}
      ${part('coral-back', coralHead(330, 262, 0.7, '#7b6fbf'))}
      ${ellipseShadow('crab-shadow', 226, 252, 84, 9)}
      ${part('crab-shell', c.shell)}
      ${part('crab', c.crab)}
      ${part('crab-claw', c.claw)}
      ${fx('fx-sand', `<ellipse cx="${sand[0].toFixed(1)}" cy="${sand[1].toFixed(1)}" rx="34" ry="12" fill="#f1e2b6" opacity="0.9"/>
        <circle cx="${(sand[0] - 22).toFixed(1)}" cy="${(sand[1] - 10).toFixed(1)}" r="8" fill="#f1e2b6" opacity="0.8"/>
        <circle cx="${(sand[0] + 20).toFixed(1)}" cy="${(sand[1] - 12).toFixed(1)}" r="9" fill="#f1e2b6" opacity="0.8"/>`)}
      ${fx('fx-front', `<g stroke="#fff7d0" stroke-width="3" stroke-linecap="round">
        <path d="M118 96 l0 -10"/><path d="M128 100 l7 -7"/><path d="M108 100 l-7 -7"/></g>`)}
      ${f.svg}`);
  }

  // THE JELLYFISH light the water one after another, each blooming with its
  // own soft glow — and in that light the clownfish (bottom-left, facing the
  // shell) sees the shell on the sand begin to wiggle, leaning in to look.
  function buildJellyParade() {
    const D = [];
    const J = [
      { x: 84, y: 92, s: 0.4, body: '#c58be0', glow: 'rgba(230,200,255,0.95)', name: 'jelly-a' },
      { x: 276, y: 100, s: 0.36, body: '#8bd3e0', glow: 'rgba(170,240,255,0.95)', name: 'jelly-b' },
      { x: 180, y: 126, s: 0.3, body: '#f3a7c8', glow: 'rgba(255,200,230,0.95)', name: 'jelly-c' }
    ];
    const SX = 252, SY = 238;
    const sh = conch(D, { x: SX, y: SY, s: 0.32 });
    const f = fishLooking(D, 82, 206, 0.36, SX, SY - 6, 'spot');
    const parts = {
      glow: { pivot: [180, 130], stops: [
        { at: 0, o: 0.45 }, { at: 30, o: 0.9, s: 1.1 }, { at: 60, o: 0.6 }, { at: 80, o: 0.9, s: 1.08 }, { at: 100, o: 0.45 }] },
      'fx-bubbles': { stops: M.rise({ h: 110, dx: 8, from: 10, to: 95 }), pivot: [180, 250] },
      // the shell wiggles in the jelly light (a hint of what's inside)…
      shell: { pivot: [SX, SY + 20], stops: M.mix(
        M.osc('r', 7, { n: 6, decay: 0.9, from: 50, to: 94 }), M.osc('x', 3, { n: 6, decay: 0.9, from: 50, to: 94 })) },
      // …and the fish leans in for a closer look, then backs off a touch
      peek: { parts: FISH, pivot: [82, 206], stops: M.approach({
        dx: f.look.ux * 26, dy: f.look.uy * 26, bump: 0, arrive: 56, leave: 84 }) }
    };
    let body = '';
    J.forEach((j, i) => {
      const d = drawJellyfish({ x: j.x, y: j.y, s: j.s, body: j.body });
      D.push(d.defs);
      const from = i * 20, to = from + 60;
      parts[j.name] = { pivot: [j.x, j.y], glow: j.glow, stops: M.mix(
        M.within(M.jet({ h: 34, squeeze: 0.82, dx: i === 1 ? -6 : 4 }), from, to),
        [{ at: 0 }, { at: from }, { at: from + 24, g: 16 }, { at: to }, { at: 100 }]) };
      body += part(j.name, d.jelly);
    });
    D.push(`<radialGradient id="jglow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="rgba(220,200,255,0.9)"/><stop offset="100%" stop-color="rgba(220,200,255,0)"/></radialGradient>`);
    return svg(D, M.rig({ dur: 2.0, parts }), `
      <g data-part="glow" opacity="0.45"><circle cx="180" cy="130" r="150" fill="url(#jglow)"/></g>
      ${sandStrip(278, 190, 26)}
      ${ellipseShadow('shell-shadow', SX + 4, SY + 22, 46, 6)}
      ${part('shell', sh.shell)}
      ${body}
      ${f.svg}
      ${fx('fx-bubbles', bubbles(180, 250, 8, 120, 61))}`);
  }

  // PAGE 14 — A NEW FRIEND: the clownfish does a joyful loop-the-loop while
  // the hermit crab scuttles a happy side-to-side dance waving his big claw;
  // the reef glows and bubbles rise.
  function buildReefAwake() {
    const D = [];
    const c = crab(D, { x: 250, y: 214, s: 0.52, flip: true });
    const face = c.pt(104, -36);
    const f = fishLooking(D, 96, 124, 0.42, face[0], face[1], 'happy', 16);
    const dance = M.scuttle({ dist: 16, n: 6, hop: 5, from: 6, to: 90 });
    D.push(`<radialGradient id="aglow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="rgba(255,244,196,0.9)"/><stop offset="100%" stop-color="rgba(255,244,196,0)"/></radialGradient>`);
    const style = M.rig({ dur: 2.0, parts: {
      loop: { parts: FISH, pivot: [96, 78], stops: M.orbit({ dir: -1, from: 8, to: 78 }) },
      'crab-path': { parts: [], pivot: c.pt(0, 70), stops: dance },
      'crab-shell': { follow: 'crab-path' },
      crab: { follow: 'crab-path' },
      'crab-claw': { follow: 'crab', pivot: c.pt(94, 16), stops: M.osc('r', 26, { n: 6, decay: 1, from: 10, to: 92 }) },
      'crab-shadow': { stops: M.pick(dance, ['x']) },
      glow: { pivot: [180, 120], stops: [{ at: 0, o: 0.5 }, { at: 50, o: 1, s: 1.12 }, { at: 100, o: 0.5 }] },
      'coral-back': { stops: M.osc('r', 2, { n: 4 }), pivot: [180, 266] },
      'fx-bubbles': { stops: M.rise({ h: 130, dx: -6, from: 4, to: 96 }), pivot: [180, 240] }
    } });
    return svg(D, style, `
      <g data-part="glow" opacity="0.5"><circle cx="180" cy="120" r="130" fill="url(#aglow)"/></g>
      ${sandStrip(274, 190, 30)}
      ${part('coral-back', coralHead(60, 266, 0.9, '#7b6fbf') + coralHead(320, 260, 0.8, '#6f9fbf'))}
      ${ellipseShadow('crab-shadow', 240, 252, 80, 9)}
      ${part('crab-shell', c.shell)}
      ${part('crab', c.crab)}
      ${part('crab-claw', c.claw)}
      ${f.svg}
      ${fx('fx-bubbles', bubbles(180, 236, 12, 220, 71))}`);
  }

  window.buildReefHome      = buildReefHome;
  window.buildClownfishSolo = buildClownfishSolo;
  window.buildShellSpot     = buildShellSpot;
  window.buildCurrent       = buildCurrent;
  window.buildPufferScene   = buildPufferScene;
  window.buildOctopusScene  = buildOctopusScene;
  window.buildCoralGarden   = buildCoralGarden;
  window.buildTurtleScene   = buildTurtleScene;
  window.buildSeahorseScene = buildSeahorseScene;
  window.buildKelpForest    = buildKelpForest;
  window.buildEelScene      = buildEelScene;
  window.buildCrabReveal    = buildCrabReveal;
  window.buildJellyParade   = buildJellyParade;
  window.buildReefAwake     = buildReefAwake;
})();
