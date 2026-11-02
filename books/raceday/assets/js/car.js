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
// Facing: 3/4 from the front-left, screen-facing, like the reindeer.

const CAR_PARTS = ['shadow', 'undercarriage', 'wheel-back', 'car-body',
  'side-stripe', 'cabin', 'window', 'headlight', 'number', 'wheel-front',
  'spoiler'];

function buildCar(cfg) {
  cfg = cfg || {};
  const body = cfg.body || '#E23B2E';

  // --- shade helper: lighten (pct>0) / darken (pct<0) a hex colour ----------
  function shade(hex, pct) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16),
          g = parseInt(h.slice(2, 4), 16),
          b = parseInt(h.slice(4, 6), 16);
    const f = v => Math.max(0, Math.min(255,
      Math.round(v + (pct < 0 ? v * pct : (255 - v) * pct))));
    const to = v => f(v).toString(16).padStart(2, '0');
    return '#' + to(r) + to(g) + to(b);
  }

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

  return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
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

    <g data-part="shadow">
      <ellipse cx="180" cy="236" rx="130" ry="20" fill="rgba(0,0,0,0.14)"/>
    </g>

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
