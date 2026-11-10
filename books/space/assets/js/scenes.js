// Scene SVGs for the "Our Solar System" book.
//
// Each builder returns ONE plain SVG (no data-part — this book has no
// pseudo-3D layers) with NO background: the bodies sit straight on the page.
// It holds only orbit lines and invisible marker circles `data-body="…"` that
// solar.js replaces with real, rotating sphere canvases. Orbit markers carry
// data-a / data-b (ellipse radii), data-period (seconds per lap), data-phase
// (start angle, degrees), data-around (id of the body they circle) and
// data-lit (id of the light).

(function () {
  'use strict';

  // tiny seeded RNG so the belt specks are identical on every render
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  const ORBIT = 'rgba(70,80,110,0.35)';     // reads on the cream paper
  const SPECK = '#7d8597';

  function marker(o) {
    const attrs = Object.keys(o)
      .filter(k => k !== 'body' && k !== 'cx' && k !== 'cy' && k !== 'r')
      .map(k => ` data-${k}="${o[k]}"`).join('');
    return `<circle data-body="${o.body}" cx="${o.cx}" cy="${o.cy}" r="${o.r}" fill="none"${attrs}/>`;
  }

  // ---- intro: the whole system on elliptical orbits ----------------------
  // Distances and sizes are squeezed to fit one page (true scale would leave
  // the inner planets as dust next to the Sun); order and look are real.
  function buildSolarSystem() {
    const cx = 200, cy = 200, K = 0.42;            // ellipse squash (seen at an angle)
    const P = [
      // body,   a,   r,    period, phase
      ['mercury', 40, 3.4,  8,   20],
      ['venus',   54, 5.0,  13, 150],
      ['earth',   70, 5.4,  20, 250],
      ['mars',    86, 4.2,  32,  80],
      ['jupiter', 118, 12,  64, 200],
      ['saturn',  132, 9.2, 100, 320],
      ['uranus',  152, 6.6, 150,  40],
      ['neptune', 168, 6.4, 200, 120]
    ];
    const rand = rng(7);
    let orbits = '', marks = '';
    marks += marker({ body: 'sun', id: 'sun', cx, cy, r: 24 });
    P.forEach(([body, a, r, period, phase]) => {
      orbits += `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${(a * K).toFixed(1)}" fill="none" stroke="${ORBIT}" stroke-width="0.7"/>`;
      // marker cx/cy = the ORBIT CENTRE (the Sun); solar.js places the planet on it
      marks += marker({ body, id: body, cx, cy, r, a, b: (a * K).toFixed(1), period, phase, lit: 'sun' });
      if (body === 'earth') {
        marks += marker({ body: 'moon', id: 'moon', cx: cx + a + 9, cy, r: 1.4, a: 9, b: 3.8,
          period: 3, phase: 0, around: 'earth', lit: 'sun' });
      }
    });

    // Main asteroid belt: rocky specks between Mars and Jupiter
    let asteroids = '';
    for (let i = 0; i < 480; i++) {
      const a = 93 + rand() * 11, th = rand() * Math.PI * 2;
      const x = cx + a * Math.cos(th), y = cy + a * K * Math.sin(th);
      asteroids += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.4 + rand() * 0.75).toFixed(2)}" fill="#6f5d4b" opacity="${(0.45 + rand() * 0.5).toFixed(2)}"/>`;
    }

    // Kuiper Belt: a band of icy specks just beyond Neptune's orbit, centred
    // on the Sun and squashed like the orbits; Pluto's orbit runs inside it.
    let belt = '';
    for (let i = 0; i < 320; i++) {
      const a = 176 + rand() * 20, th = rand() * Math.PI * 2;
      const x = cx + a * Math.cos(th), y = cy + a * K * Math.sin(th);
      belt += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.35 + rand() * 0.7).toFixed(2)}" fill="${SPECK}" opacity="${(0.3 + rand() * 0.5).toFixed(2)}"/>`;
    }

    // Pluto: an off-centre, more stretched orbit that dips inside Neptune's
    const pox = cx + 10, poy = cy + 3, pa = 182, pb = 66;
    orbits += `<ellipse cx="${pox}" cy="${poy}" rx="${pa}" ry="${pb}" fill="none" stroke="rgba(140,100,70,0.4)" stroke-width="0.7" stroke-dasharray="2 2.5"/>`;
    marks += marker({ body: 'pluto', id: 'pluto', cx: pox, cy: poy, r: 3, a: pa, b: pb,
      period: 260, phase: 200, lit: 'sun' });

    return `
    <svg data-solar data-pinch data-zoom-fit="2 112 396 176" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g>${orbits}</g>
      <g>${asteroids}</g>
      <g>${belt}</g>
      ${marks}
    </svg>`;
  }

  // ---- one body on its own page ------------------------------------------
  // opts.orbit: extra orbit line; opts.extra: more markers (e.g. Charon)
  function buildBody(body, opts = {}) {
    const r = opts.r || 92;
    return `
    <svg data-solar viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      ${opts.orbit || ''}
      ${marker({ body, id: body, cx: 150, cy: opts.cy || 150, r })}
      ${opts.extra || ''}
    </svg>`;
  }

  function buildPluto() {
    // Pluto and its big moon Charon circle each other
    return buildBody('pluto', {
      r: 70,
      orbit: `<ellipse cx="150" cy="150" rx="118" ry="34" fill="none" stroke="${ORBIT}" stroke-width="0.8"/>`,
      extra: marker({ body: 'charon', id: 'charon', cx: 268, cy: 150, r: 18, a: 118, b: 34,
        period: 16, phase: 30, around: 'pluto' })
    });
  }

  // ---- a belt page: a curved band of specks with a few real-looking rocks --
  function buildBelt(seed, speck, worldList) {
    const rand = rng(seed);
    let dust = '';
    for (let i = 0; i < 260; i++) {
      const t = rand();
      const x = 10 + t * 280;
      const y = 200 - Math.sin(t * Math.PI) * 90 + (rand() - 0.5) * 70;
      dust += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.3 + rand() * 1.1).toFixed(2)}" fill="${speck}" opacity="${(0.3 + rand() * 0.5).toFixed(2)}"/>`;
    }
    const worlds = worldList
      .map(([b, x, y, r], i) => marker({ body: b, id: 'w' + i, cx: x, cy: y, r })).join('');
    return `
    <svg data-solar viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <g>${dust}</g>
      ${worlds}
    </svg>`;
  }

  // ---- the main asteroid belt: Ceres, Vesta and rocky asteroids -----------
  function buildAsteroids() {
    return buildBelt(17, '#6f5d4b', [
      ['ceres', 150, 120, 34],
      ['vesta', 72, 172, 20],
      ['rockA', 226, 166, 15],
      ['rockB', 118, 220, 9],
      ['rockA', 200, 226, 7],
      ['rockB', 40, 120, 6],
      ['rockA', 262, 102, 8]
    ]);
  }

  // ---- Earth with the Moon going round it --------------------------------
  // Sizes to true scale (the Moon is 0.27 × Earth's width); the distance is
  // squeezed to fit the page (really ~30 Earth-widths away).
  function buildEarth() {
    const R = 66;
    return buildBody('earth', {
      r: R,
      orbit: `<ellipse cx="150" cy="150" rx="128" ry="36" fill="none" stroke="rgba(70,80,110,0.35)" stroke-width="0.8"/>`,
      extra: marker({ body: 'moon', id: 'moon', cx: 278, cy: 150, r: (R * 0.273).toFixed(1),
        a: 128, b: 36, period: 24, phase: 20, around: 'earth' })
    });
  }

  // ---- the Kuiper Belt: a field of small icy worlds ----------------------
  function buildKuiper() {
    const rand = rng(42);
    let dust = '';
    for (let i = 0; i < 220; i++) {
      // a curved band sweeping across the picture
      const t = rand();
      const x = 10 + t * 280;
      const y = 200 - Math.sin(t * Math.PI) * 90 + (rand() - 0.5) * 70;
      dust += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.3 + rand() * 1.1).toFixed(2)}" fill="${SPECK}" opacity="${(0.3 + rand() * 0.5).toFixed(2)}"/>`;
    }
    const worlds = [
      ['kboPale', 70, 168, 26],
      ['kboRed', 150, 112, 34],
      ['kboBlue', 228, 160, 22],
      ['kboDark', 108, 222, 22],
      ['kboRed', 196, 222, 11],
      ['kboBlue', 40, 120, 9],
      ['kboPale', 262, 98, 10]
    ].map(([b, x, y, r], i) => marker({ body: b, id: 'w' + i, cx: x, cy: y, r })).join('');

    return `
    <svg data-solar viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <g>${dust}</g>
      ${worlds}
    </svg>`;
  }

  window.buildSolarSystem = buildSolarSystem;
  window.buildBody = buildBody;
  window.buildPluto = buildPluto;
  window.buildEarth = buildEarth;
  window.buildKuiper = buildKuiper;
  window.buildAsteroids = buildAsteroids;
})();
