// Original layered toy race car, flat-cartoon house style (style reference
// only: generic chunky toy cars — never a branded casting or logo). Each visual
// part is its own SVG group so the shared pseudo-3D rig can offset parts in Z
// for the tilt / parallax pop.
//
// buildCar(cfg) -> SVG string.
// cfg (independent axes — keep them separate, never merge shape vs colour):
//   body       : main paint hex              (e.g. '#E23B2E')
//   bodyDark   : rim / lower-body shade hex   (defaults to a darkened body)
//   cabin      : roof / cabin paint hex       (defaults to a darkened body)
//   windowTint : windshield glass hex         (default '#bfe3f2')
//   wheel      : tyre hex                      (default '#23242a')
//   rim        : wheel-hub hex                 (default '#e9edf2')
//   number     : racing number string | ''    (drawn on the door, '' = none)
//   numberColor: number ink hex                (default '#1d2330')
//   spoiler    : 'none' | 'low' | 'tall' | 'wing'
//   stripe     : 'none' | 'center' | 'flames'
//   anim       : the click animation this car performs, shipped INSIDE the SVG
//                (see animStyle below). One of 'rev' (default) | 'wheelie' |
//                'vroom' | 'shake'. Every picture gets one.
// Facing: 3/4 from the front-left, screen-facing, like the reindeer.

const CAR_PARTS = ['shadow', 'undercarriage', 'wheel-back', 'car-body',
  'side-stripe', 'cabin', 'window', 'headlight', 'number', 'wheel-front',
  'spoiler'];

function buildCar(cfg) {
  cfg = cfg || {};
  const body = cfg.body || '#E23B2E';


  const bodyLight = shade(body, 0.26);   // top highlight
  const bodyMid   = body;
  const bodyDark  = cfg.bodyDark || shade(body, -0.30);   // lower rim shade
  const cabin     = cfg.cabin || shade(body, -0.16);
  const cabinDark = shade(cabin, -0.22);
  const windowTint = cfg.windowTint || '#bfe3f2';
  const wheel      = cfg.wheel || '#23242a';
  const wheelDark  = shade(wheel, -0.35);
  const rim        = cfg.rim || '#e9edf2';
  const rimDark    = shade(rim, -0.28);
  const spoiler    = cfg.spoiler || 'low';
  const stripe     = cfg.stripe || 'none';
  const number     = (cfg.number != null ? String(cfg.number) : '');
  const numberColor = cfg.numberColor || '#1d2330';

  // unique gradient id suffix so several cars on one spread don't collide
  const uid = 'c' + Math.random().toString(36).slice(2, 8);

  // --- spoiler variants (drawn behind the body as a rear wing) --------------
  function spoilerSVG() {
    if (spoiler === 'none') return '<g data-part="spoiler"></g>';
    if (spoiler === 'tall') {
      return `<g data-part="spoiler">
        <rect x="250" y="150" width="10" height="46" rx="3" fill="${bodyDark}"/>
        <rect x="236" y="138" width="54" height="14" rx="6" fill="${body}"/>
        <rect x="236" y="138" width="54" height="5" rx="2.5" fill="${bodyLight}"/>
      </g>`;
    }
    if (spoiler === 'wing') {
      return `<g data-part="spoiler">
        <rect x="246" y="156" width="9" height="40" rx="3" fill="${bodyDark}"/>
        <rect x="280" y="156" width="9" height="40" rx="3" fill="${bodyDark}"/>
        <rect x="232" y="146" width="64" height="12" rx="6" fill="${body}"/>
        <rect x="232" y="146" width="64" height="4" rx="2" fill="${bodyLight}"/>
      </g>`;
    }
    // low lip spoiler hugging the tail
    return `<g data-part="spoiler">
      <path d="M252 188 q22 -10 40 -2 l0 12 q-20 -6 -40 2 z" fill="${bodyDark}"/>
    </g>`;
  }

  // --- side stripe / flames across the door --------------------------------
  function stripeSVG() {
    if (stripe === 'none') return '<g data-part="side-stripe"></g>';
    if (stripe === 'flames') {
      return `<g data-part="side-stripe">
        <path d="M70 196 q24 -8 40 2 q16 -12 34 -2 q18 -10 36 2 q16 -8 30 0
                 l0 10 q-88 -8 -170 4 z" fill="${shade(body, 0.4)}" opacity="0.92"/>
      </g>`;
    }
    // simple center racing band along the flank
    return `<g data-part="side-stripe">
      <path d="M64 190 l188 -2 l0 12 l-188 4 z" fill="${shade(body, 0.4)}"/>
      <path d="M64 196 l188 -2 l0 4 l-188 3 z" fill="${shade(body, -0.12)}" opacity="0.6"/>
    </g>`;
  }

  function numberSVG() {
    if (!number) return '<g data-part="number"></g>';
    return `<g data-part="number">
      <circle cx="150" cy="178" r="20" fill="#ffffff" opacity="0.92"/>
      <text x="150" y="186" text-anchor="middle"
            font-family="system-ui, Segoe UI, Roboto, sans-serif"
            font-weight="800" font-size="24" fill="${numberColor}">${number}</text>
    </g>`;
  }

  // --- click animation (ships INSIDE this car's SVG) ------------------------
  // Every car carries its OWN one-shot animation via cfg.anim. On tap the
  // engine adds `is-playing` to each layer's <svg>; these keyframes run once
  // then clear on animationend. Built with the shared buildAnim helper, keyed
  // to this car's uid so several cars on one spread never collide.
  const CAR_ALL = ['shadow','undercarriage','wheel-back','car-body',
    'side-stripe','cabin','window','headlight','number','wheel-front','spoiler'];
  // the car WITHOUT its shadow — for the drive-off-the-page move so the shadow
  // can stay grounded (own track) instead of streaking across with the body.
  const CAR_NS = ['undercarriage','wheel-back','car-body','side-stripe',
    'cabin','window','headlight','number','wheel-front','spoiler'];
  function animStyle() {
    const key = cfg.anim || 'rev';
    // body cluster (everything that rides on the chassis) and the two wheels.
    const BODY = ['car-body','side-stripe','cabin','window','headlight','number','spoiler','undercarriage'];
    const WHEELS = ['wheel-front','wheel-back'];
    // reusable exhaust-cloud tracks: three staggered puffs drifting back + up
    // as they fade (see animFX for the spawned fx-smoke* elements). `dur` is
    // the animation duration string so it matches the owning move.
    const SMOKE = dur => ([
      { parts: 'fx-smoke1', box: 'fill-box', origin: '50% 50%', timing: `${dur} ease-out`,
        keyframes: '0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:.8}100%{opacity:0;transform:translate(26px,-18px) scale(1.6)}' },
      { parts: 'fx-smoke2', box: 'fill-box', origin: '50% 50%', timing: `${dur} ease-out`,
        keyframes: '0%,18%{opacity:0;transform:translate(0,0) scale(.4)}34%{opacity:.75}100%{opacity:0;transform:translate(34px,-26px) scale(1.7)}' },
      { parts: 'fx-smoke3', box: 'fill-box', origin: '50% 50%', timing: `${dur} ease-out`,
        keyframes: '0%,32%{opacity:0;transform:translate(0,0) scale(.4)}48%{opacity:.7}100%{opacity:0;transform:translate(42px,-34px) scale(1.8)}' }
    ]);
    const SPECS = {
      // rev: squats hard on its back wheels — front end rears UP and bounces —
      // while the wheels spin and the shadow stretches. A big engine-revving
      // beat, not a tiny shudder.
      rev: { tracks: [
        { parts: BODY, origin: '226px 214px', timing: '1.1s cubic-bezier(.3,.8,.3,1)',
          keyframes: '0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-16deg) translateY(-10px)}45%{transform:rotate(-6deg) translateY(-2px)}65%{transform:rotate(-13deg) translateY(-7px)}85%{transform:rotate(-3deg)}' },
        { parts: WHEELS, box: 'fill-box', origin: '50% 50%', timing: '1.1s ease-in-out',
          keyframes: '0%{transform:rotate(0)}100%{transform:rotate(300deg)}' },
        { parts: 'shadow', origin: '180px 236px', timing: '1.1s ease-in-out',
          keyframes: '0%,100%{transform:scaleX(1)}30%{transform:scaleX(1.14)}' },
        // SPAWNED EFFECT: exhaust clouds billow from the tailpipe (see SMOKE).
        ...SMOKE('1.1s')
      ] },
      // wheelie: the FRONT of the car rears UP while the REAR wheel stays
      // planted on the ground. Pivot at the rear-wheel ground contact
      // (~226,244) and rotate CLOCKWISE (positive) so the nose (left side)
      // lifts and the back stays down — a proper wheelie, not a rear-lift.
      wheelie: { tracks: [
        { parts: CAR_ALL, origin: '226px 244px', timing: '1.3s cubic-bezier(.3,.7,.3,1)',
          keyframes: '0%{transform:rotate(0)}40%{transform:rotate(26deg)}62%{transform:rotate(32deg)}80%{transform:rotate(29deg)}100%{transform:rotate(0)}' },
        { parts: WHEELS, box: 'fill-box', origin: '50% 50%', timing: '1.3s linear',
          keyframes: '0%{transform:rotate(0)}100%{transform:rotate(-520deg)}' },
        // smoke belches as the nose lifts
        ...SMOKE('1.3s')
      ] },
      // vroom: BLASTS off the page to the left, then rockets back in from the
      // right and settles — a full drive-through, wheels spinning fast. It
      // FADES OUT while fully off-screen so the left→right teleport is never
      // seen (no blink), and the shadow stays grounded on its own track.
      vroom: { tracks: [
        { parts: CAR_NS, origin: '180px 220px', timing: '1.2s cubic-bezier(.5,0,.3,1)',
          keyframes: '0%{opacity:1;transform:translateX(0) rotate(0)}28%{opacity:1}34%{opacity:0;transform:translateX(-460px) rotate(-6deg)}38%{opacity:0;transform:translateX(460px) rotate(-6deg)}44%{opacity:1;transform:translateX(320px) rotate(-4deg)}72%{opacity:1;transform:translateX(26px) rotate(3deg)}100%{opacity:1;transform:translateX(0) rotate(0)}' },
        { parts: WHEELS, box: 'fill-box', origin: '50% 50%', timing: '1.2s linear',
          keyframes: '0%{transform:rotate(0)}100%{transform:rotate(-900deg)}' },
        { parts: 'shadow', origin: '180px 236px', timing: '1.2s ease-in-out',
          keyframes: '0%,28%{opacity:1;transform:scaleX(1)}35%,43%{opacity:0}72%{opacity:1;transform:scaleX(1.08)}100%{opacity:1;transform:scaleX(1)}' },
        // a cloud left behind as it blasts off the line
        ...SMOKE('1.2s')
      ] },
      // shake: Rusty rattles himself to bits — the whole car judders hard and
      // the wheels wobble, with a little hop as a bolt almost shakes loose.
      shake: { tracks: [
        { parts: BODY, origin: '180px 220px', timing: '.9s ease-in-out',
          keyframes: '0%,100%{transform:translate(0,0) rotate(0)}10%{transform:translate(-6px,-2px) rotate(-3deg)}22%{transform:translate(6px,1px) rotate(3deg)}34%{transform:translate(-5px,-6px) rotate(-2deg)}46%{transform:translate(5px,0) rotate(2deg)}60%{transform:translate(-4px,-2px) rotate(-2deg)}74%{transform:translate(4px,1px) rotate(1.5deg)}88%{transform:translate(-2px,0) rotate(-1deg)}' },
        { parts: WHEELS, box: 'fill-box', origin: '50% 50%', timing: '.9s ease-in-out',
          keyframes: '0%,100%{transform:rotate(0)}25%{transform:rotate(-16deg)}50%{transform:rotate(14deg)}75%{transform:rotate(-10deg)}' },
        { parts: 'shadow', origin: '180px 236px', timing: '.9s ease-in-out',
          keyframes: '0%,100%{transform:translateX(0) scaleX(1)}30%{transform:translateX(4px) scaleX(.96)}60%{transform:translateX(-3px) scaleX(1.03)}' },
        // SPAWNED EFFECT: a single sickly cough of smoke from the bad engine
        { parts: 'fx-smoke1', box: 'fill-box', origin: '50% 50%', timing: '.9s ease-out',
          keyframes: '0%,15%{opacity:0;transform:translate(0,0) scale(.5)}40%{opacity:.7;transform:translate(10px,-10px) scale(1.1)}100%{opacity:0;transform:translate(22px,-20px) scale(1.5)}' }
      ] }
    };
    return buildAnim(uid, SPECS[key] || SPECS.rev);
  }

  // Effect elements the click animation SPAWNS (not part of the resting car).
  // Exhaust/gas clouds that puff from the tailpipe when the engine works hard.
  // Each puff is its own `data-part="fx-…"` group, hidden at rest and revealed
  // by the keyframes while `is-playing`. rev / wheelie / vroom all blow smoke;
  // shake (Rusty) coughs out a single sputtering cloud. Drawn behind the car.
  function animFX() {
    const key = cfg.anim || 'rev';
    const puff = (cx, cy, r) =>
      `<g>
         <circle cx="${cx}" cy="${cy}" r="${r}" fill="#cfd4da" opacity="0.5"/>
         <circle cx="${cx - r * 0.5}" cy="${cy + r * 0.2}" r="${r * 0.7}" fill="#dfe3e8" opacity="0.45"/>
         <circle cx="${cx + r * 0.4}" cy="${cy - r * 0.3}" r="${r * 0.6}" fill="#e7eaee" opacity="0.4"/>
       </g>`;
    if (key === 'rev' || key === 'wheelie' || key === 'vroom') {
      // three staggered clouds billowing back from the tailpipe (rear-right)
      return `<g data-part="fx-smoke1" opacity="0">${puff(272, 212, 13)}</g>
              <g data-part="fx-smoke2" opacity="0">${puff(292, 206, 16)}</g>
              <g data-part="fx-smoke3" opacity="0">${puff(312, 212, 19)}</g>`;
    }
    if (key === 'shake') {
      // one sickly cough of smoke
      return `<g data-part="fx-smoke1" opacity="0">${puff(278, 210, 15)}</g>`;
    }
    return '';
  }

  return `<svg data-zoom="sm" viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- body volume: light top-left to dark lower-right -->
      <linearGradient id="carBody-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="${bodyLight}"/>
        <stop offset="48%" stop-color="${bodyMid}"/>
        <stop offset="100%" stop-color="${bodyDark}"/>
      </linearGradient>
      <linearGradient id="carCabin-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="${shade(cabin, 0.2)}"/>
        <stop offset="100%" stop-color="${cabinDark}"/>
      </linearGradient>
      <linearGradient id="carGlass-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#ffffff"/>
        <stop offset="40%" stop-color="${windowTint}"/>
        <stop offset="100%" stop-color="${shade(windowTint, -0.25)}"/>
      </linearGradient>
      <radialGradient id="carTyre-${uid}" cx="38%" cy="34%" r="70%">
        <stop offset="0%"  stop-color="${shade(wheel, 0.25)}"/>
        <stop offset="70%" stop-color="${wheel}"/>
        <stop offset="100%" stop-color="${wheelDark}"/>
      </radialGradient>
      <radialGradient id="carSoft-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="rgba(0,0,0,0.22)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    ${animStyle()}

    <g data-part="shadow">
      <ellipse cx="180" cy="236" rx="130" ry="20" fill="rgba(0,0,0,0.14)"/>
    </g>
    ${animFX()}

    <g data-part="undercarriage">
      <rect x="60" y="196" width="196" height="26" rx="12" fill="${bodyDark}"/>
    </g>

    <!-- back wheel sits behind the body; front wheel in front (own layer) -->
    <g data-part="wheel-back">
      <circle cx="226" cy="214" r="30" fill="url(#carTyre-${uid})"/>
      <circle cx="226" cy="214" r="14" fill="${rim}"/>
      <circle cx="226" cy="214" r="14" fill="none" stroke="${rimDark}" stroke-width="2"/>
    </g>

    ${spoilerSVG()}

    <g data-part="car-body">
      <!-- lower hull -->
      <path d="M56 200
               q4 -34 44 -40
               l44 -6
               q22 -30 60 -30
               q46 0 66 36
               l22 6
               q24 6 24 34
               q0 10 -12 12
               l-236 0
               q-14 -2 -12 -14 z"
            fill="url(#carBody-${uid})"/>
      <!-- top highlight sweep -->
      <path d="M72 168 q60 -40 150 -26 q24 4 36 20 q-120 -18 -186 18 z"
            fill="${bodyLight}" opacity="0.55"/>
      <!-- lower-right rim shade for roundness -->
      <path d="M60 206 l236 0 q-120 14 -236 0 z" fill="url(#carSoft-${uid})" opacity="0.6"/>
    </g>

    ${stripeSVG()}

    <g data-part="cabin">
      <!-- rounded cabin / roof -->
      <path d="M126 150 q18 -34 56 -34 q40 0 56 32 l-6 10 q-54 -22 -100 0 z"
            fill="url(#carCabin-${uid})"/>
    </g>

    <g data-part="window">
      <path d="M136 150 q16 -24 46 -24 q32 0 46 22 q-46 -16 -92 2 z"
            fill="url(#carGlass-${uid})"/>
      <path d="M142 146 q14 -16 36 -16 l-26 18 z" fill="#ffffff" opacity="0.5"/>
    </g>

    <g data-part="headlight">
      <ellipse cx="66" cy="178" rx="9" ry="7" fill="#fff6cf"/>
      <ellipse cx="66" cy="178" rx="9" ry="7" fill="none" stroke="${bodyDark}" stroke-width="1.5"/>
    </g>

    ${numberSVG()}

    <g data-part="wheel-front">
      <circle cx="110" cy="216" r="32" fill="url(#carTyre-${uid})"/>
      <circle cx="110" cy="216" r="15" fill="${rim}"/>
      <circle cx="110" cy="216" r="15" fill="none" stroke="${rimDark}" stroke-width="2"/>
      <circle cx="110" cy="216" r="4" fill="${rimDark}"/>
    </g>
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildCar, CAR_PARTS };
