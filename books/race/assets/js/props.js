// Race Day — track-section PROP builders. Each returns a layered data-part SVG
// string in the flat-cartoon house style (fill-first, volume via gradients).
// These are the "scene" pages between the cars: the hallway straight, the
// book-stack ramp, the kitchen tiles, the shaggy carpet, the loop, the finish.
//
// PERSPECTIVE: every floor scene is drawn from a FLOOR-LEVEL view — as if the
// camera is lying on the floor looking across the room. The floor recedes
// BOTTOM-to-TOP: its near edge is WIDE at the bottom of the frame and its far
// edge is NARROW near the top. Tracks/tiles/finish lines run away from the
// viewer (down→up), and cars head away up the track (seen from behind/above).
//
// Style references (local, never traced/shipped): the orange loop set, the red
// track draped over a book stack on a shaggy rug, and the checkered finish band
// with pennant bunting. All redrawn original here.

(function () {
  'use strict';

  const TRACK = '#f4621f';
  const TRACK_DK = '#c84a12';
  const TRACK_LT = '#ff8a4a';

  // Receding-floor geometry (shared by every floor scene). The near (bottom)
  // edge spans the full width low in the frame; the far (top) edge is a narrow
  // band high in the frame. Everything that sits on the floor is placed between
  // these using a simple linear interpolation by depth d (0 = near/bottom,
  // 1 = far/top).
  const NEAR_Y = 276, FAR_Y = 118;          // bottom (near) and top (far) of floor
  const NEAR_HALF = 176, FAR_HALF = 64;     // half-width of floor at near / far
  const CX = 180;                           // horizontal centre
  function fy(d) { return NEAR_Y + (FAR_Y - NEAR_Y) * d; }        // y at depth d
  function fhalf(d) { return NEAR_HALF + (FAR_HALF - NEAR_HALF) * d; } // half-width
  // x of a point at depth d and lateral position u (-1 = left edge, +1 = right)
  function fx(d, u) { return CX + u * fhalf(d); }

  // The floor trapezoid itself (wide at bottom, narrow at top) plus receding
  // floorboard seams. No back wall — the area above the far edge is left
  // transparent so the page/backdrop shows through (keeps the scene a floor,
  // not a boxed-in room). `wallFill` kept in the signature but unused.
  function floorBase(wallFill, floorFill, boardSeam) {
    const bl = `${fx(0,-1)} ${fy(0)}`, br = `${fx(0,1)} ${fy(0)}`;
    const tr = `${fx(1,1)} ${fy(1)}`, tl = `${fx(1,-1)} ${fy(1)}`;
    // a few floorboard seams converging toward the far edge
    let seams = '';
    [-0.66, -0.33, 0, 0.33, 0.66].forEach(u => {
      seams += `<line x1="${fx(0,u).toFixed(1)}" y1="${fy(0)}"
                      x2="${fx(1,u).toFixed(1)}" y2="${fy(1)}"
                      stroke="${boardSeam}" stroke-width="2" opacity="0.5"/>`;
    });
    return `
      <!-- the receding floor trapezoid (no back wall) -->
      <path d="M${bl} L${br} L${tr} L${tl} Z" fill="${floorFill}"/>
      ${seams}`;
  }

  // A straight track lane running away up the floor (near depth d0 to far d1),
  // with lane half-width that shrinks with perspective. Returns the orange
  // track with a dashed centre line. `col`/`dk`/`lt` default to the toy orange.
  function recedingLane(d0, d1, halfU0, halfU1, col, dk, lt) {
    col = col || TRACK; dk = dk || TRACK_DK; lt = lt || TRACK_LT;
    // outer edges of the lane as a trapezoid (narrower than the floor)
    const nL = `${fx(d0,-halfU0).toFixed(1)} ${fy(d0).toFixed(1)}`;
    const nR = `${fx(d0, halfU0).toFixed(1)} ${fy(d0).toFixed(1)}`;
    const fR = `${fx(d1, halfU1).toFixed(1)} ${fy(d1).toFixed(1)}`;
    const fL = `${fx(d1,-halfU1).toFixed(1)} ${fy(d1).toFixed(1)}`;
    // dashed centre line: three dashes receding and shrinking
    let dashes = '';
    [0.12, 0.40, 0.70].forEach((t, i) => {
      const d = d0 + (d1 - d0) * t;
      const dEnd = d + (d1 - d0) * 0.12;
      const wNear = (halfU0 + (halfU1 - halfU0) * t) * 0.10;
      const wFar = (halfU0 + (halfU1 - halfU0) * (t + 0.12)) * 0.10;
      dashes += `<path d="M${fx(d,-wNear).toFixed(1)} ${fy(d).toFixed(1)}
                        L${fx(d, wNear).toFixed(1)} ${fy(d).toFixed(1)}
                        L${fx(dEnd, wFar).toFixed(1)} ${fy(dEnd).toFixed(1)}
                        L${fx(dEnd,-wFar).toFixed(1)} ${fy(dEnd).toFixed(1)} Z"
                        fill="#fff"/>`;
    });
    return `
      <path d="M${nL} L${nR} L${fR} L${fL} Z" fill="${col}"/>
      <path d="M${nL} L${fx(d0,-halfU0*0.72).toFixed(1)} ${fy(d0).toFixed(1)}
               L${fx(d1,-halfU1*0.72).toFixed(1)} ${fy(d1).toFixed(1)} L${fL} Z"
            fill="${dk}"/>
      <path d="M${nR} L${fx(d0, halfU0*0.72).toFixed(1)} ${fy(d0).toFixed(1)}
               L${fx(d1, halfU1*0.72).toFixed(1)} ${fy(d1).toFixed(1)} L${fR} Z"
            fill="${dk}"/>
      ${dashes}`;
  }

  // Mini car seen FROM BEHIND, heading away up the track. Placed at floor depth
  // d; it scales down with depth so it reads as "far up the lane". `color` is
  // the body, `dark` the roof/shade, `roofShown` adds a little cabin hump.
  // opts: { x, y, scale } explicitly place/scale the car (overriding the depth
  // projection) — used by the loop and podium where the car isn't on the floor.
  function carAway(d, u, color, dark, opts) {
    dark = dark || color;
    opts = opts || {};
    const s = opts.scale != null ? opts.scale : (0.9 - 0.5 * d);
    const x = opts.x != null ? opts.x : fx(d, u);
    const y = opts.y != null ? opts.y : fy(d);
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})">
      <ellipse cx="0" cy="20" rx="46" ry="9" fill="rgba(0,0,0,0.16)"/>
      <!-- rear deck + body (viewed from behind) -->
      <path d="M-42 12 q0 -22 12 -30 l60 0 q12 8 12 30 q0 8 -10 10 l-64 0 q-12 -2 -10 -10 z"
            fill="${color}"/>
      <path d="M-30 -16 q4 -12 30 -12 q26 0 30 12 l-6 10 q-24 -8 -48 0 z" fill="${dark}"/>
      <!-- rear window -->
      <path d="M-20 -14 q6 -8 20 -8 q14 0 20 8 q-20 -6 -40 0 z" fill="#cfeaf6"/>
      <!-- tail lights -->
      <rect x="-40" y="2" width="12" height="7" rx="2" fill="#ffd0c6"/>
      <rect x="28" y="2" width="12" height="7" rx="2" fill="#ffd0c6"/>
      <!-- rear tyres peeking at the sides -->
      <rect x="-50" y="2" width="12" height="18" rx="5" fill="#23242a"/>
      <rect x="38" y="2" width="12" height="18" rx="5" fill="#23242a"/>
    </g>`;
  }

  // --- Page 1: THE STARTING GRID — all four cars lined up -------------------
  // Floor-level view of a 4-lane starting grid: the track recedes away, split
  // into four lanes by white lines, with the four racers side by side on the
  // start, each seen from behind ready to launch.
  function buildStartGrid() {
    const LANES = 4;
    const halfN = 0.60, halfF = 0.60;   // track lateral half-width near/far
    const d0 = 0.02, d1 = 0.98;
    const nL = `${fx(d0,-halfN).toFixed(1)} ${fy(d0).toFixed(1)}`;
    const nR = `${fx(d0, halfN).toFixed(1)} ${fy(d0).toFixed(1)}`;
    const fR = `${fx(d1, halfF).toFixed(1)} ${fy(d1).toFixed(1)}`;
    const fL = `${fx(d1,-halfF).toFixed(1)} ${fy(d1).toFixed(1)}`;
    // the 4 lane boundary lines (5 lines total: edges + 3 inner dividers)
    let lines = '';
    for (let i = 0; i <= LANES; i++) {
      const u = -1 + (2 * i) / LANES;                 // -1..1 across the track
      const uN = u * halfN, uF = u * halfF;
      const w = (i === 0 || i === LANES) ? 0 : 0.018; // inner dividers are thin
      if (w === 0) continue;
      lines += `<path d="M${fx(d0,uN-w).toFixed(1)} ${fy(d0).toFixed(1)}
                        L${fx(d0,uN+w).toFixed(1)} ${fy(d0).toFixed(1)}
                        L${fx(d1,uF+w*0.6).toFixed(1)} ${fy(d1).toFixed(1)}
                        L${fx(d1,uF-w*0.6).toFixed(1)} ${fy(d1).toFixed(1)} Z"
                        fill="#f2f2f2" opacity="0.9"/>`;
    }
    // a start stripe (checker) across the near part of the grid
    const stripe = perspChecker(0.18, 0.26, halfN * 0.98, halfF * 0.9, 12);
    // four cars, one per lane, on the start line (near-ish depth)
    const carD = 0.34;
    const cars =
      carAway(carD, -0.78, '#e23b2e', '#b2271c') +   // Turbo
      carAway(carD, -0.26, '#2f7de0', '#235fab') +   // Bolt
      carAway(carD,  0.26, '#e0b24a', '#b98a2c') +   // Rusty
      carAway(carD,  0.78, '#5aa469', '#3f7d4e');    // Jade
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // all four cars rev hard and strain forward on the line — bouncing on
        // their suspension and lunging up the track, then snapping back as if
        // held at the start, over and over.
        { parts: 'car', box: 'fill-box', origin: '50% 100%', timing: '1.1s ease-in-out',
          keyframes: '0%,100%{transform:translateY(0) scaleY(1)}20%{transform:translateY(-10px) scaleY(1.02)}38%{transform:translateY(-2px) scaleY(.99)}58%{transform:translateY(-12px) scaleY(1.03)}78%{transform:translateY(-3px)}' },
        // the pennant bunting swings and ripples overhead
        { parts: 'bunting', origin: '180px 56px', timing: '1.1s ease-in-out',
          keyframes: '0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(4px) rotate(-1.2deg)}65%{transform:translateY(-2px) rotate(1deg)}' }
      ])}
      <g data-part="prop-base">
        ${floorBase('#efe7d8', '#e7d3b1', '#d3b98d')}
      </g>
      <g data-part="road">
        <!-- dark asphalt grid receding away -->
        <path d="M${nL} L${nR} L${fR} L${fL} Z" fill="#3b4049"/>
        ${lines}
      </g>
      <g data-part="finish-line">${stripe}</g>
      ${carLayer(cars)}
      ${buntingSVG()}
    </svg>`;
  }

  // --- Page 7: THE HALLWAY — a long straight dash ---------------------------
  // Detail: a runner rug under the track, a framed picture + a wall sconce on
  // the far-left wall, a tall potted plant near the viewer on the right, and a
  // pair of slippers knocked aside.
  function buildHallway() {
    // a narrow hallway rug (runner) under the track, slightly wider than it
    const runner = (() => {
      const L0 = fx(0.0, -0.66), R0 = fx(0.0, 0.66);
      const L1 = fx(1.0, -0.62), R1 = fx(1.0, 0.62);
      return `<path d="M${L0.toFixed(1)} ${fy(0).toFixed(1)}
                     L${R0.toFixed(1)} ${fy(0).toFixed(1)}
                     L${R1.toFixed(1)} ${fy(1).toFixed(1)}
                     L${L1.toFixed(1)} ${fy(1).toFixed(1)} Z"
                     fill="#c9b79a" opacity="0.7"/>`;
    })();
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // the car weaves down the hall then ZOOMS away up the straight —
        // shrinking into the distance and off the far end of the page — then
        // comes roaring back to the viewer. Travels the whole hallway.
        { parts: 'car', box: 'fill-box', origin: '50% 60%', timing: '1.6s cubic-bezier(.5,0,.4,1)',
          keyframes: '0%{transform:translate(0,0) rotate(0) scale(1)}18%{transform:translate(-30px,0) rotate(-9deg) scale(.96)}34%{transform:translate(30px,0) rotate(9deg) scale(.9)}60%{transform:translate(0,-150px) rotate(0) scale(.28)}72%{transform:translate(0,-150px) rotate(0) scale(.28)}100%{transform:translate(0,0) rotate(0) scale(1)}' }
      ])}
      <g data-part="prop-base">
        ${floorBase('#efe7d8', '#e7d3b1', '#d3b98d')}
        ${runner}
        <!-- framed picture on the far wall (small, up near the vanishing area) -->
        <g transform="translate(96 96)">
          <rect x="-16" y="-14" width="32" height="26" rx="2" fill="#8a5a2c"/>
          <rect x="-12" y="-10" width="24" height="18" fill="#cfe3ef"/>
          <path d="M-12 8 l8 -10 5 5 6 -8 5 13 z" fill="#9ccb7e"/>
        </g>
        <!-- a little wall sconce glow on the right wall -->
        <circle cx="266" cy="108" r="10" fill="#ffe9a8" opacity="0.7"/>
        <circle cx="266" cy="108" r="4" fill="#ffd45e"/>
      </g>
      <g data-part="road">
        <!-- orange track running straight AWAY up the hall (near→far) -->
        ${recedingLane(0.02, 0.98, 0.52, 0.52)}
      </g>
      ${carLayer(carAway(0.18, 0, '#2f7de0', '#235fab'))}
      <g data-part="fore">
        <!-- tall potted plant near the viewer, right side -->
        <g transform="translate(316 228)">
          <path d="M-16 20 l4 -34 l24 0 l4 34 z" fill="#c67b4b"/>
          <path d="M-12 -14 l28 0 l-2 -8 l-24 0 z" fill="#a9623a"/>
          <g fill="#4f9e5e">
            <path d="M0 -14 q-26 -20 -22 -54 q16 14 22 54 z"/>
            <path d="M0 -14 q26 -20 22 -54 q-16 14 -22 54 z"/>
            <path d="M0 -14 q-6 -34 2 -62 q10 30 -2 62 z"/>
          </g>
        </g>
        <!-- a pair of slippers knocked to the left of the track, near -->
        <g transform="translate(70 250)" fill="#d98c96">
          <path d="M0 0 q-22 2 -30 10 q-2 8 10 10 q22 2 28 -6 q2 -10 -8 -14 z"/>
          <path d="M20 14 q-22 2 -30 10 q-2 8 10 10 q22 2 28 -6 q2 -10 -8 -14 z"
                fill="#c97b86"/>
        </g>
      </g>
    </svg>`;
  }

  // --- Page 8: THE RAMP — built from a stack of books -----------------------
  // Side view (reverted to the version that read well): a red track draped over
  // a stack of books, the car cresting it. Not a floor-recession scene.
  function buildRamp() {
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // the car (facing down-ramp) noses over the crest and rolls down to
        // the floor, hangs a beat at the bottom, then climbs back up to the
        // top. A big trip across the whole ramp, not a short slide.
        { parts: 'car', box: 'fill-box', origin: '50% 50%', timing: '1.5s cubic-bezier(.45,0,.4,1)',
          keyframes: '0%{transform:translate(0,0) rotate(0)}12%{transform:translate(2px,-6px) rotate(4deg)}55%{transform:translate(132px,108px) rotate(4deg)}70%{transform:translate(132px,108px) rotate(4deg)}100%{transform:translate(0,0) rotate(0)}' }
      ])}
      <g data-part="prop-base">
        <ellipse cx="180" cy="262" rx="150" ry="20" fill="rgba(0,0,0,0.10)"/>
        <!-- stacked books forming the ramp support -->
        <g>
          <rect x="70" y="214" width="120" height="20" rx="3" fill="#4e79b5"/>
          <rect x="78" y="196" width="112" height="20" rx="3" fill="#cf5b4e"/>
          <rect x="74" y="178" width="118" height="20" rx="3" fill="#e0b24a"/>
          <rect x="82" y="160" width="106" height="20" rx="3" fill="#5aa469"/>
          <!-- page edges -->
          <g fill="rgba(255,255,255,0.6)">
            <rect x="184" y="217" width="6" height="14"/>
            <rect x="184" y="199" width="6" height="14"/>
            <rect x="182" y="181" width="6" height="14"/>
            <rect x="182" y="163" width="6" height="14"/>
          </g>
        </g>
      </g>
      <g data-part="ramp">
        <!-- red track draped from the book stack down to the floor -->
        <path d="M96 150 q40 6 70 34 q30 28 110 86 l-16 10 q-80 -56 -108 -84
                 q-26 -24 -62 -34 z" fill="${TRACK}"/>
        <path d="M96 150 q40 6 70 34 q30 28 110 86 l-5 3 q-82 -57 -110 -85
                 q-26 -24 -62 -34 z" fill="${TRACK_DK}"/>
        <path d="M96 150 q40 6 70 34 q30 28 108 84 l-4 -5 q-80 -55 -106 -81
                 q-26 -24 -60 -34 z" fill="${TRACK_LT}" opacity="0.7"/>
      </g>
      ${carLayer(
        // Mirror the car HORIZONTALLY about its own centre (x=150) so it faces
        // the opposite direction, then the ramp rotation tips that nose down
        // the slope — the car points down-ramp (facing down), not upside-down.
        '<g transform="rotate(32 150 150) translate(300 0) scale(-1 1)">' +
        miniCarSide(150, 150, 0.6, '#e23b2e', '#b2271c') + '</g>')}
    </svg>`;
  }

  // Side-profile mini car (used only by the ramp, which is a side view). This
  // is the original simple silhouette from before the perspective rewrite.
  function miniCarSide(x, y, s, color, dark) {
    dark = dark || color;
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="26" rx="52" ry="8" fill="rgba(0,0,0,0.16)"/>
      <path d="M-50 14 q2 -20 28 -24 l20 -2 q14 -18 34 -16 q26 2 32 22
               q16 2 16 20 q0 6 -8 8 l-148 0 q-8 -2 -6 -8 z"
            fill="${color}"/>
      <path d="M-18 -8 q12 -16 32 -10 q14 4 18 14 q-34 -10 -50 -4 z" fill="${dark}"/>
      <path d="M-14 -6 q10 -10 26 -6 q-18 0 -26 6 z" fill="#cfeaf6"/>
      <circle cx="-26" cy="24" r="16" fill="#23242a"/>
      <circle cx="-26" cy="24" r="7" fill="#e9edf2"/>
      <circle cx="30" cy="24" r="16" fill="#23242a"/>
      <circle cx="30" cy="24" r="7" fill="#e9edf2"/>
    </g>`;
  }

  // --- Page 9: THE KITCHEN — slippery tiles, skiiid! ------------------------
  // Floor-level checkerboard that recedes up the frame (rows get shorter and
  // narrower toward the top), with a car skidding sideways across it.
  function buildKitchen() {
    const cols = 6, rows = 6;
    let tiles = '';
    for (let r = 0; r < rows; r++) {
      const d0 = r / rows, d1 = (r + 1) / rows;
      for (let c = 0; c < cols; c++) {
        const u0 = -1 + (2 * c) / cols, u1 = -1 + (2 * (c + 1)) / cols;
        const fill = (r + c) % 2 === 0 ? '#eef2f6' : '#cfd8e0';
        tiles += `<path d="M${fx(d0,u0).toFixed(1)} ${fy(d0).toFixed(1)}
                         L${fx(d0,u1).toFixed(1)} ${fy(d0).toFixed(1)}
                         L${fx(d1,u1).toFixed(1)} ${fy(d1).toFixed(1)}
                         L${fx(d1,u0).toFixed(1)} ${fy(d1).toFixed(1)} Z"
                         fill="${fill}"/>`;
      }
    }
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // the car SLIPS wildly on the slick tiles: skates right across the
        // whole floor while spinning a full 360, slides back, and fishtails to
        // a stop. A big, funny loss of grip across the page.
        { parts: 'car', box: 'fill-box', origin: '50% 55%', timing: '1.7s cubic-bezier(.3,.5,.3,1)',
          keyframes: '0%{transform:translate(0,0) rotate(0)}30%{transform:translate(120px,-10px) rotate(220deg)}50%{transform:translate(90px,6px) rotate(360deg)}70%{transform:translate(-40px,-4px) rotate(300deg)}85%{transform:translate(10px,2px) rotate(372deg)}100%{transform:translate(0,0) rotate(360deg)}' }
      ])}
      <g data-part="prop-base">
        ${floorBase('#efe7d8', '#e7d3b1', '#d3b98d')}
      </g>
      <g data-part="tiles">
        ${tiles}
        <!-- curved skid mark, drawn ON the tiles so it stays visible (a -10
             road layer would sit behind the tiles and vanish) -->
        <path d="M${fx(0.1,-0.7)} ${fy(0.1)} Q${fx(0.4,0.1)} ${fy(0.4)} ${fx(0.3,0.75)} ${fy(0.3)}"
              fill="none" stroke="#3a3f47" stroke-width="7"
              stroke-linecap="round" opacity="0.45"/>
      </g>
      ${carLayer('<g transform="rotate(-18 ' + fx(0.44,-0.1).toFixed(1) + ' ' + fy(0.44).toFixed(1) + ')">' +
        carAway(0.44, -0.1, '#e0b24a', '#b98a2c') + '</g>')}
      <g data-part="fore">
        <!-- OBSTACLES on the kitchen floor to dodge. In the fore layer so the
             rig renders them IN FRONT of the tiles (they were hidden behind the
             tiles layer before). -->
        <!-- a spilled milk puddle (far-left) -->
        <g transform="translate(${fx(0.6,-0.52).toFixed(1)} ${fy(0.6).toFixed(1)})">
          <path d="M0 0 q-20 -8 -30 2 q-10 10 4 16 q22 10 34 -2 q10 -10 -8 -16 z"
                fill="#eef3f7" opacity="0.92"/>
          <path d="M-4 4 q-10 -4 -16 1 q-5 5 2 8 q11 5 17 -1 z" fill="#dce7ef"/>
        </g>
        <!-- a rolling soup can (mid-right) -->
        <g transform="translate(${fx(0.52,0.56).toFixed(1)} ${fy(0.52).toFixed(1)})">
          <ellipse cx="0" cy="12" rx="16" ry="4" fill="rgba(0,0,0,0.12)"/>
          <rect x="-14" y="-12" width="28" height="22" rx="3" fill="#d14b3c"/>
          <ellipse cx="0" cy="-12" rx="14" ry="4.5" fill="#f0f2f4"/>
          <rect x="-14" y="-4" width="28" height="8" fill="#f4f0e4"/>
        </g>
        <!-- a dropped apple (near-left) -->
        <g transform="translate(${fx(0.24,-0.5).toFixed(1)} ${fy(0.24).toFixed(1)})">
          <ellipse cx="0" cy="12" rx="12" ry="4" fill="rgba(0,0,0,0.12)"/>
          <circle cx="0" cy="0" r="14" fill="#58b24e"/>
          <circle cx="-5" cy="-5" r="5" fill="#7cd06e" opacity="0.7"/>
          <rect x="-1.4" y="-19" width="3" height="8" rx="1.5" fill="#6b4a2a"/>
        </g>
        <!-- a cereal bowl that tipped, spilling bits (near-right) -->
        <g transform="translate(${fx(0.2,0.56).toFixed(1)} ${fy(0.2).toFixed(1)})">
          <ellipse cx="0" cy="12" rx="24" ry="6" fill="rgba(0,0,0,0.12)"/>
          <ellipse cx="0" cy="0" rx="22" ry="9" fill="#5a7fb0"/>
          <ellipse cx="0" cy="-2" rx="18" ry="6" fill="#cfe0f2"/>
          <g fill="#e6b84a">
            <circle cx="12" cy="9" r="2.6"/><circle cx="22" cy="12" r="2.6"/>
            <circle cx="28" cy="8" r="2.6"/><circle cx="18" cy="15" r="2.6"/>
          </g>
        </g>
      </g>
    </svg>`;
  }

  // --- Page 10: THE CARPET — the cars hit the shaggy rug! -------------------
  // A realistic plush/shaggy rug laid on the floor (receding). Built from:
  //   - a soft radially-shaded rug body (lighter centre, darker toward the
  //     edges) so it reads as thick pile catching light, not a flat shape;
  //   - a dense scatter of short pile strands across the WHOLE surface (varied
  //     tone + length) so the texture reads as fabric, longer near the viewer;
  //   - a fringe of tassels along the near edge;
  //   - a soft drop shadow beneath, so the rug sits ON the floor.
  // A car bounds onto it. Deterministic PRNG so the pile is stable per render.
  function buildCarpet() {
    const uid = 'rug' + Math.random().toString(36).slice(2, 7);
    // seeded RNG so the scatter doesn't jitter between the layer passes the rig
    // makes when it re-parses the SVG per data-part.
    let seed = 1337;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const dN = 0.04, dF = 0.86;              // near / far depth of the rug
    const halfN = 0.9, halfF = 0.52;         // rug half-width near / far
    const ru = (d) => halfN + (halfF - halfN) * ((d - dN) / (dF - dN)); // half-width at d
    const L0 = fx(dN, -halfN), R0 = fx(dN, halfN);
    const L1 = fx(dF, -halfF), R1 = fx(dF, halfF);
    const y0 = fy(dN), y1 = fy(dF);
    const rugPath =
      `M${L0.toFixed(1)} ${y0.toFixed(1)} L${R0.toFixed(1)} ${y0.toFixed(1)}
       L${R1.toFixed(1)} ${y1.toFixed(1)} L${L1.toFixed(1)} ${y1.toFixed(1)} Z`;

    // dense pile strands across the surface — near strands longer, far shorter
    let pile = '';
    const PILE_COLORS = ['#f2ede3', '#e7e0d3', '#dcd3c3', '#efe9de'];
    for (let i = 0; i < 520; i++) {
      const d = dN + (dF - dN) * Math.sqrt(rnd());   // denser toward the far edge visually
      const u = (rnd() * 2 - 1) * ru(d) * 0.98;
      const x = fx(d, u), y = fy(d);
      const depthScale = 1 - (d - dN) / (dF - dN);    // 1 near -> 0 far
      const len = (2 + rnd() * 4) * (0.5 + depthScale);
      const lean = (rnd() * 2 - 1) * 1.6;
      const c = PILE_COLORS[(rnd() * PILE_COLORS.length) | 0];
      pile += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}"
                     x2="${(x + lean).toFixed(1)}" y2="${(y - len).toFixed(1)}"
                     stroke="${c}" stroke-width="${(0.8 + depthScale).toFixed(1)}"
                     stroke-linecap="round" opacity="0.7"/>`;
    }
    // tassel fringe along the near (bottom) edge
    let fringe = '';
    const nTass = 46;
    for (let i = 0; i <= nTass; i++) {
      const u = -halfN + (2 * halfN) * (i / nTass);
      const x = fx(dN, u), len = 7 + rnd() * 5;
      fringe += `<line x1="${x.toFixed(1)}" y1="${y0.toFixed(1)}"
                       x2="${(x + (rnd() * 2 - 1)).toFixed(1)}" y2="${(y0 + len).toFixed(1)}"
                       stroke="#e4ddce" stroke-width="2" stroke-linecap="round"/>`;
    }

    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${uid}-body" cx="50%" cy="42%" r="62%">
          <stop offset="0%"  stop-color="#f4efe6"/>
          <stop offset="68%" stop-color="#e5ddcd"/>
          <stop offset="100%" stop-color="#cfc4b0"/>
        </radialGradient>
      </defs>
      ${sceneAnim([
        // the car bogs into the shaggy pile and HEAVES across it — big lurches,
        // the nose pitching up and down as it fights for grip, hauling itself
        // from one side of the rug to the other and back.
        { parts: 'car', box: 'fill-box', origin: '50% 100%', timing: '1.8s ease-in-out',
          keyframes: '0%{transform:translate(0,0) rotate(0)}15%{transform:translate(-18px,-14px) rotate(-9deg)}30%{transform:translate(-30px,6px) rotate(4deg)}50%{transform:translate(-8px,-12px) rotate(-7deg)}68%{transform:translate(24px,6px) rotate(6deg)}84%{transform:translate(10px,-8px) rotate(-3deg)}100%{transform:translate(0,0) rotate(0)}' },
        // the whole shaggy rug ripples and springs under the car's weight (the
        // road layer holds the rug body + all the pile strands + fringe).
        { parts: 'road', origin: '180px 276px', timing: '1.8s ease-in-out',
          keyframes: '0%,100%{transform:scaleY(1) translateX(0)}20%{transform:scaleY(.97) translateX(-3px)}45%{transform:scaleY(1.03) translateX(3px)}70%{transform:scaleY(.98) translateX(-2px)}' }
      ])}
      <g data-part="prop-base">
        ${floorBase('#efe7d8', '#d9bd92', '#c7a677')}
        <!-- soft contact shadow so the rug sits on the floor -->
        <ellipse cx="180" cy="${(y0 - 6).toFixed(1)}" rx="150" ry="22"
                 fill="rgba(0,0,0,0.12)"/>
      </g>
      <g data-part="road">
        <!-- rug body with a soft radial pile shading -->
        <path d="${rugPath}" fill="url(#${uid}-body)"/>
        <!-- a subtle woven border inset -->
        <path d="M${fx(dN+0.04,-ru(dN+0.04)*0.9).toFixed(1)} ${fy(dN+0.04).toFixed(1)}
                 L${fx(dN+0.04, ru(dN+0.04)*0.9).toFixed(1)} ${fy(dN+0.04).toFixed(1)}
                 L${fx(dF-0.04, ru(dF-0.04)*0.9).toFixed(1)} ${fy(dF-0.04).toFixed(1)}
                 L${fx(dF-0.04,-ru(dF-0.04)*0.9).toFixed(1)} ${fy(dF-0.04).toFixed(1)} Z"
              fill="none" stroke="#d8cdb9" stroke-width="2" opacity="0.6"/>
        ${pile}
        ${fringe}
      </g>
      ${carLayer('<g transform="rotate(-6 ' + fx(0.35,-0.05).toFixed(1) + ' ' + fy(0.35).toFixed(1) + ')">' +
        carAway(0.35, -0.05, '#5aa469', '#3f7d4e') + '</g>')}
      <g data-part="fore">
        <!-- TOYS scattered across the rug (with soft contact shadows) -->
        <!-- a red bouncy ball (near-right) -->
        ${toyShadow(fx(0.22, 0.6), fy(0.22), 20)}
        <g transform="translate(${fx(0.22,0.6).toFixed(1)} ${(fy(0.22)-14).toFixed(1)})">
          <circle cx="0" cy="0" r="18" fill="#e14b57"/>
          <path d="M-18 0 a18 18 0 0 1 36 0" fill="#f2d14a"/>
          <circle cx="-6" cy="-7" r="5" fill="#fff" opacity="0.5"/>
        </g>
        <!-- an ABC building block (near-left) -->
        ${toyShadow(fx(0.26, -0.56), fy(0.26), 18)}
        <g transform="translate(${fx(0.26,-0.56).toFixed(1)} ${(fy(0.26)-10).toFixed(1)}) rotate(-8)">
          <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#e9b949"/>
          <rect x="-16" y="-16" width="32" height="32" rx="4" fill="none" stroke="#c6952f" stroke-width="2"/>
          <text x="0" y="8" text-anchor="middle" font-family="system-ui,sans-serif"
                font-weight="800" font-size="22" fill="#b23b2e">A</text>
        </g>
        <!-- a little stacking-ring toy (mid-left) -->
        ${toyShadow(fx(0.5, -0.42), fy(0.5), 14)}
        <g transform="translate(${fx(0.5,-0.42).toFixed(1)} ${(fy(0.5)-6).toFixed(1)})">
          <ellipse cx="0" cy="8" rx="16" ry="5" fill="#4e79b5"/>
          <ellipse cx="0" cy="2" rx="12" ry="4" fill="#5aa469"/>
          <ellipse cx="0" cy="-3" rx="8" ry="3" fill="#e0b24a"/>
          <rect x="-1.5" y="-12" width="3" height="12" rx="1.5" fill="#8a5a2c"/>
        </g>
        <!-- a plush teddy bear sitting up (mid-right, small with distance) -->
        ${toyShadow(fx(0.56, 0.44), fy(0.56), 13)}
        <g transform="translate(${fx(0.56,0.44).toFixed(1)} ${(fy(0.56)-8).toFixed(1)}) scale(0.9)">
          <ellipse cx="0" cy="4" rx="13" ry="12" fill="#b98a52"/>
          <circle cx="0" cy="-12" r="9" fill="#c69a60"/>
          <circle cx="-7" cy="-19" r="4" fill="#b98a52"/>
          <circle cx="7" cy="-19" r="4" fill="#b98a52"/>
          <circle cx="-3" cy="-13" r="1.4" fill="#3a2616"/>
          <circle cx="3" cy="-13" r="1.4" fill="#3a2616"/>
          <circle cx="0" cy="-9" r="2" fill="#7a5433"/>
          <circle cx="-9" cy="6" r="4" fill="#c69a60"/>
          <circle cx="9" cy="6" r="4" fill="#c69a60"/>
        </g>
        <!-- scattered toy bricks (near-centre) -->
        ${toyShadow(fx(0.16, 0.08), fy(0.16), 16)}
        <g transform="translate(${fx(0.16,0.08).toFixed(1)} ${(fy(0.16)-6).toFixed(1)}) rotate(6)">
          <rect x="-18" y="-7" width="36" height="14" rx="2" fill="#3f8fd0"/>
          <circle cx="-11" cy="-10" r="4" fill="#5aa6e0"/>
          <circle cx="0" cy="-10" r="4" fill="#5aa6e0"/>
          <circle cx="11" cy="-10" r="4" fill="#5aa6e0"/>
        </g>
      </g>
    </svg>`;
  }

  // a soft elliptical contact shadow under a toy at (x,y) with radius r
  function toyShadow(x, y, r) {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r}" ry="${(r*0.34).toFixed(1)}" fill="rgba(0,0,0,0.12)"/>`;
  }

  // --- Page 11: THE LOOP — whoosh, upside down! -----------------------------
  // Reverted to the standalone version: a big orange vertical loop (concentric
  // rings) rising off a grey launcher base, with a car near the top of the ring.
  function buildLoop() {
    return `<svg data-zoom="sm" viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // the car charges in, then races TWO full laps around the loop —
        // accelerating up and over — before settling. It orbits the loop
        // centre (186,128) in the SVG's own coordinate space, so use the
        // view-box transform-box with that point as the origin.
        { parts: 'car', box: 'view-box', origin: '186px 128px', timing: '1.8s cubic-bezier(.4,0,.5,1)',
          keyframes: '0%{transform:rotate(0)}12%{transform:rotate(0)}100%{transform:rotate(720deg)}' }
      ])}
      <g data-part="prop-base">
        <ellipse cx="180" cy="276" rx="140" ry="16" fill="rgba(0,0,0,0.10)"/>
        <!-- grey launcher base -->
        <path d="M40 250 l40 -26 l210 0 l30 26 z" fill="#aeb4bc"/>
        <path d="M40 250 l40 -26 l12 0 l-30 26 z" fill="#8c929b"/>
        <rect x="70" y="236" width="40" height="16" rx="4" fill="#7f868f"/>
      </g>
      <g data-part="loop">
        <!-- the big orange vertical loop (two concentric rings) -->
        <circle cx="186" cy="128" r="92" fill="none" stroke="${TRACK}" stroke-width="22"/>
        <circle cx="186" cy="128" r="92" fill="none" stroke="${TRACK_LT}"
                stroke-width="8" opacity="0.7"/>
        <circle cx="186" cy="128" r="70" fill="none" stroke="${TRACK_DK}" stroke-width="4"/>
        <!-- feed ramp into the loop base -->
        <path d="M96 232 q40 -20 96 -16 l0 18 q-54 -4 -92 14 z" fill="${TRACK}"/>
      </g>
      ${carLayer('<g transform="rotate(170 232 70)">' +
        miniCarSide(232, 70, 0.5, '#e0b24a', '#b98a2c') + '</g>')}
    </svg>`;
  }

  // --- Page 13: PHOTO FINISH — two cars SIDE BY SIDE crossing the line ------
  // Floor-level view down the track: two lanes running away, the checkered
  // finish line stretched across the track ahead, cars side by side on it.
  function buildFinish(withPodium) {
    if (withPodium) return buildPodium();
    // track trapezoid (wide near, narrow far)
    const nL = `${fx(0.0,-0.62)} ${fy(0.0)}`, nR = `${fx(0.0,0.62)} ${fy(0.0)}`;
    const fR = `${fx(0.95,0.34)} ${fy(0.95)}`, fL = `${fx(0.95,-0.34)} ${fy(0.95)}`;
    // the finish line lies ACROSS the track at depth d=0.5
    const fin = perspChecker(0.44, 0.56, 0.5, 0.42, 12);
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // both cars surge up the track and BURST across the finish line
        // together, dipping as they cross — then roll back to the start. A
        // proper dash to the line, not a tiny hop.
        { parts: 'car', box: 'fill-box', origin: '50% 50%', timing: '1.4s cubic-bezier(.4,0,.3,1)',
          keyframes: '0%{transform:translate(0,0) scale(1)}45%{transform:translate(0,-96px) scale(.6)}58%{transform:translate(0,-96px) scale(.6)}100%{transform:translate(0,0) scale(1)}' },
        // the checkered finish line flashes as they cross
        { parts: 'finish-line', origin: '180px 150px', timing: '1.4s ease-in-out',
          keyframes: '0%,38%,100%{transform:scale(1);filter:none}48%{transform:scale(1.06);filter:brightness(1.6)}60%{transform:scale(1)}' },
        { parts: 'bunting', origin: '180px 56px', timing: '1.4s ease-in-out',
          keyframes: '0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(4px) rotate(-1.2deg)}70%{transform:translateY(-2px) rotate(1deg)}' }
      ])}
      <g data-part="road">
        ${floorBase('#efe7d8', '#e7d3b1', '#d3b98d')}
        <!-- dark asphalt track running away -->
        <path d="M${nL} L${nR} L${fR} L${fL} Z" fill="#3b4049"/>
        <!-- yellow lane edges -->
        <path d="M${nL} L${fx(0.0,-0.56)} ${fy(0.0)} L${fx(0.95,-0.30)} ${fy(0.95)} L${fL} Z" fill="#efc63d"/>
        <path d="M${nR} L${fx(0.0,0.56)} ${fy(0.0)} L${fx(0.95,0.30)} ${fy(0.95)} L${fR} Z" fill="#efc63d"/>
        <!-- centre lane divider (dashed, receding) -->
        ${['0.08','0.26','0.70','0.86'].map(t => {
          const d = +t, dE = d + 0.06, w = 0.03;
          return `<path d="M${fx(d,-w).toFixed(1)} ${fy(d).toFixed(1)}
                           L${fx(d,w).toFixed(1)} ${fy(d).toFixed(1)}
                           L${fx(dE,w*0.9).toFixed(1)} ${fy(dE).toFixed(1)}
                           L${fx(dE,-w*0.9).toFixed(1)} ${fy(dE).toFixed(1)} Z" fill="#fff"/>`;
        }).join('')}
      </g>
      <g data-part="finish-line">${fin}</g>
      ${carLayer(
        carAway(0.40, -0.26, '#e23b2e', '#b2271c') +
        carAway(0.40, 0.26, '#2f7de0', '#235fab'))}
      ${buntingSVG()}
    </svg>`;
  }

  // Finale: a friendly tie — reverted to the previous version. A checkered
  // finish band on the track, one shared "1" podium step both cars sit on, a
  // trophy, and the bunting overhead.
  function buildPodium() {
    return `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg">
      ${sceneAnim([
        // the two winners hop and cheer on the shared podium step — big happy
        // bounces with a little wiggle.
        { parts: 'car', box: 'fill-box', origin: '50% 100%', timing: '1.3s cubic-bezier(.3,.7,.3,1)',
          keyframes: '0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-26px) rotate(-3deg)}40%{transform:translateY(0) rotate(0)}60%{transform:translateY(-20px) rotate(3deg)}80%{transform:translateY(0)}' },
        // the trophy is hoisted up high and sparkles with pride.
        { parts: 'trophy', box: 'fill-box', origin: '50% 100%', timing: '1.3s ease-in-out',
          keyframes: '0%,100%{transform:translateY(0) scale(1) rotate(0);filter:none}35%{transform:translateY(-16px) scale(1.3) rotate(-8deg);filter:drop-shadow(0 0 12px rgba(243,198,75,.95))}60%{transform:translateY(-8px) scale(1.12) rotate(6deg)}' },
        // bunting streams and ripples across the top in celebration.
        { parts: 'bunting', origin: '180px 56px', timing: '1.3s ease-in-out',
          keyframes: '0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(5px) rotate(-1.6deg)}65%{transform:translateY(-3px) rotate(1.4deg)}' }
      ])}
      <g data-part="road">
        <rect x="40" y="206" width="280" height="64" rx="6" fill="#3b4049"/>
        ${checkerBand(60, 206, 240, 18, 10)}
      </g>
      <g data-part="podium">
        <!-- one shared top step: a friendly tie, both cars win together -->
        <rect x="118" y="150" width="124" height="60" rx="6" fill="#e7c23c"/>
        <rect x="118" y="150" width="124" height="10" rx="5" fill="#f4da6a"/>
        <text x="180" y="190" text-anchor="middle"
              font-family="system-ui, Segoe UI, Roboto, sans-serif"
              font-weight="800" font-size="20" fill="#7a5c10">1</text>
      </g>
      ${carLayer(miniCarSide(150, 150, 0.52, '#e23b2e', '#b2271c') +
        miniCarSide(214, 150, 0.52, '#2f7de0', '#235fab'))}
      <g data-part="trophy">
        <path d="M172 112 q8 14 16 0 l-2 14 l-12 0 z" fill="#f3c64b"/>
        <rect x="174" y="126" width="12" height="6" fill="#d8a62e"/>
        <rect x="170" y="132" width="20" height="5" rx="2" fill="#c89326"/>
      </g>
      ${buntingSVG()}
    </svg>`;
  }

  // A checkered band laid ACROSS the track in perspective (between depths d0
  // near and d1 far, spanning lateral half-width `half`), `cols` squares wide.
  function perspChecker(d0, d1, half, halfFar, cols) {
    let sq = '';
    for (let i = 0; i < cols; i++) {
      const u0 = -half + (2 * half * i) / cols;
      const u1 = -half + (2 * half * (i + 1)) / cols;
      // two rows (near strip / far strip) of the band
      for (let row = 0; row < 2; row++) {
        const da = d0 + (d1 - d0) * (row / 2);
        const db = d0 + (d1 - d0) * ((row + 1) / 2);
        const col = (i + row) % 2 === 0 ? '#ffffff' : '#1b1e24';
        sq += `<path d="M${fx(da,u0).toFixed(1)} ${fy(da).toFixed(1)}
                     L${fx(da,u1).toFixed(1)} ${fy(da).toFixed(1)}
                     L${fx(db,u1).toFixed(1)} ${fy(db).toFixed(1)}
                     L${fx(db,u0).toFixed(1)} ${fy(db).toFixed(1)} Z" fill="${col}"/>`;
      }
    }
    return `<g>${sq}</g>`;
  }

  // A flat (non-perspective) black/white checkered band, `cols` squares wide,
  // two rows tall. Used by the finale podium's finish stripe.
  function checkerBand(x, y, w, h, cols) {
    const cw = w / cols;
    let sq = '';
    for (let i = 0; i < cols; i++) {
      for (let row = 0; row < 2; row++) {
        if ((i + row) % 2 === 0) {
          sq += `<rect x="${x + i * cw}" y="${y + row * (h / 2)}" width="${cw}" height="${h / 2}" fill="#fff"/>`;
        }
      }
    }
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b1e24"/>${sq}</g>`;
  }

  // red + checkered pennant bunting strung across the top (the far wall)
  function buntingSVG() {
    const span = { x0: 34, x1: 326, y: 56, dip: 24 };
    const midx = (span.x0 + span.x1) / 2, cy = span.y + span.dip;
    let flags = '';
    const N = 11;
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const bx = (1 - t) * (1 - t) * span.x0 + 2 * (1 - t) * t * midx + t * t * span.x1;
      const by = (1 - t) * (1 - t) * span.y + 2 * (1 - t) * t * cy + t * t * span.y;
      const col = i % 2 === 0 ? '#e23b2e' : '#ffffff';
      const edge = i % 2 === 0 ? '#b2271c' : '#c9ced6';
      flags += `<path d="M${(bx - 8).toFixed(1)} ${by.toFixed(1)}
                 L${(bx + 8).toFixed(1)} ${by.toFixed(1)}
                 L${bx.toFixed(1)} ${(by + 15).toFixed(1)} Z"
                 fill="${col}" stroke="${edge}" stroke-width="1"/>`;
    }
    return `<g data-part="bunting">
      <path d="M${span.x0} ${span.y} Q${midx} ${cy} ${span.x1} ${span.y}"
            fill="none" stroke="#9aa0a8" stroke-width="2"/>
      ${flags}
    </g>`;
  }

  // wrap inline car markup as the `car` depth layer
  function carLayer(inner) {
    return `<g data-part="car">${inner}</g>`;
  }

  // Each track scene ships its OWN one-shot click animation inside its SVG
  // (like the cars/reindeer do). This thin wrapper hands buildAnim a fresh uid
  // so two scenes never share keyframe names, and no-ops gracefully if the
  // shared helper isn't present. Scenes call sceneAnim([...tracks]) and drop
  // the result right after their opening <svg ...> tag.
  function sceneAnim(tracks) {
    if (typeof buildAnim !== 'function') return '';
    const uid = 'p' + Math.random().toString(36).slice(2, 8);
    return buildAnim(uid, { tracks });
  }

  window.buildStartGrid = buildStartGrid;
  window.buildHallway = buildHallway;
  window.buildRamp = buildRamp;
  window.buildKitchen = buildKitchen;
  window.buildCarpet = buildCarpet;
  window.buildLoop = buildLoop;
  window.buildFinish = buildFinish;
})();
