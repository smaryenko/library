// Bunny Day, Owl Night: pop-up scene art.
//
// Built like a real pop-up (as books/castle on wip/popup-castle): no
// rectangle picture. Each spread is
//   1) page.ground(): the PRINTED meadow, flat on the paper inside the tilted
//      book (slider.js puts it in .spread). A day copy and a night copy; the
//      night one is clipped to the left of the seam.
//   2) page.build(): the STANDING die-cut pieces, each with a white paper rim
//      and a contact shadow: a sky card at the back, hills, the big oak,
//      props, Bunny / Owl, a grass strip at the near edge. Every piece has a
//      day twin (dn-d-*) and a night twin (dn-n-*), drawn from one seeded
//      layout so they line up; slider.js clips day pieces to the right of
//      the seam and night pieces to the left. At 50% the seam is the trunk.
//      Pieces are grouped into a few depth layers per side (back: sky +
//      hills; tree: oak + Owl on his branch; cast: props + animals + Bunny;
//      fx; front grass): every data-part becomes a full-size GPU layer, so
//      fewer parts keep page turns and the slider light on phones.
// Scene SVG: viewBox 1600x1000 with data-floor=520, so rows 520..1000 map
// onto the page as seen (far edge .. near edge). toScene(u, v) turns a ground
// point (u 0..1600 across, v 0 far .. 800 near) into the scene point where a
// piece standing there has its base.
//
// cfg: { page, place, bunny:{u,v,pose,prop}, owl:{x,y,pose},
//        daySky:'clear'|'rain'|'evening', nightSky:'clear'|'rain'|'dawn' }
(function () {
  'use strict';
  let UID = 0;
  const n = v => (Math.round(v * 10) / 10);
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }

  // ---- palettes -------------------------------------------------------
  const PAL = {
    day: {
      hillFar: '#a9c9a4', hillFar2: '#93bb8c', hillNear: '#7fb15c',
      ground: ['#8cc04c', '#6fa63a', '#4f8a2a'],
      grass: ['#6fa83a', '#87bd48', '#4e8a2c', '#9ccc5a', '#5d9a34'],
      bark: '#6e4c30', barkDark: '#3c2818', barkLight: '#a27a50',
      leaf: ['#4f8f2f', '#69a83c', '#3c7a26'], leafLight: '#b6dc6c', leafDark: '#2c5a1c',
      dab: ['#8cc452', '#a4d462', '#5f9e36', '#76b244'],
      shadow: 'rgba(28,48,12,.34)', water: ['#9fd6ee', '#5fa8cf', '#3f84ad'],
      lightX: 1, flower: 1
    },
    night: {
      hillFar: '#22335a', hillFar2: '#1d2d4e', hillNear: '#1a3340',
      ground: ['#1e3a3c', '#16302f', '#0e2222'],
      grass: ['#1f3d3a', '#2a4a44', '#17302e', '#355a52', '#22423c'],
      bark: '#2c2a3c', barkDark: '#141320', barkLight: '#5a6488',
      leaf: ['#173230', '#1e3c3a', '#122826'], leafLight: '#4a7682', leafDark: '#0b1a19',
      dab: ['#24443f', '#2e5250', '#1a3432', '#3a6466'],
      shadow: 'rgba(0,4,16,.45)', water: ['#3a5486', '#22365e', '#152440'],
      lightX: -1, flower: 0.45
    },
    dusk: {
      hillFar: '#9a6a86', hillFar2: '#7d5878', hillNear: '#6a6a48',
      ground: ['#8a8a3c', '#6c7030', '#4a5226'],
      grass: ['#7a8436', '#96923e', '#58602a', '#a89a48', '#6a7430'],
      bark: '#5c3c2a', barkDark: '#2e1c14', barkLight: '#d08e58',
      leaf: ['#4e5a28', '#64702e', '#3c4620'], leafLight: '#e8a454', leafDark: '#2a3016',
      dab: ['#8a8a3a', '#a49440', '#6a7230', '#c09a48'],
      shadow: 'rgba(40,16,10,.36)', water: ['#f0a878', '#b86a6a', '#6a4a6a'],
      lightX: 1, flower: 0.8
    }
  };
  const SKY = {
    clear: ['#4f9fdc', '#9fd0f0', '#f3efd8'],
    rain: ['#7d8ea2', '#a8b4c0', '#d4d6cc'],
    evening: ['#6f9bd0', '#e7c39a', '#ffcf8c'],
    nclear: ['#050b22', '#121e48', '#2c3b6c'],
    nrain: ['#080e24', '#18203c', '#2a3250'],
    ndawn: ['#0a1232', '#2c3668', '#8c6c8c'],
    dusk: ['#2c3270', '#93598a', '#f2986a', '#ffd38c']
  };

  // ---- defs -----------------------------------------------------------
  function defs(u, skyKey, mode, dusk) {
    const P = PAL[mode];
    const sky = SKY[skyKey];
    const stops = sky.map((c, i) => `<stop offset="${(i / (sky.length - 1) * 100).toFixed(0)}%" stop-color="${c}"/>`).join('');
    const lx = P.lightX > 0 ? 0.72 : 0.28;
    const lf = P.leaf.map((c, i) => `
      <radialGradient id="${u}${mode}lf${i}" cx="${lx}" cy="0.28" r="0.85">
        <stop offset="0%" stop-color="${P.leafLight}"/><stop offset="38%" stop-color="${c}"/><stop offset="100%" stop-color="${P.leafDark}"/>
      </radialGradient>`).join('');
    const trunk = P.lightX > 0
      ? `<stop offset="0%" stop-color="${P.barkDark}"/><stop offset="45%" stop-color="${P.bark}"/><stop offset="82%" stop-color="${P.barkLight}"/><stop offset="100%" stop-color="${P.bark}"/>`
      : `<stop offset="0%" stop-color="${P.bark}"/><stop offset="16%" stop-color="${P.barkLight}"/><stop offset="50%" stop-color="${P.bark}"/><stop offset="100%" stop-color="${P.barkDark}"/>`;
    return `
      <linearGradient id="${u}${mode}sky" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
      <linearGradient id="${u}${mode}gr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${P.ground[0]}"/><stop offset="45%" stop-color="${P.ground[1]}"/><stop offset="100%" stop-color="${P.ground[2]}"/>
      </linearGradient>
      <linearGradient id="${u}${mode}tr" x1="0" y1="0" x2="1" y2="0">${trunk}</linearGradient>
      <linearGradient id="${u}${mode}wt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${P.water[0]}"/><stop offset="55%" stop-color="${P.water[1]}"/><stop offset="100%" stop-color="${P.water[2]}"/>
      </linearGradient>
      ${lf}`;
  }
  function sharedDefs(u) {
    return `
      <radialGradient id="${u}sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#fffbe6"/><stop offset="18%" stop-color="#fff0a8" stop-opacity=".95"/>
        <stop offset="40%" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="100%" stop-color="#ffe08a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${u}moon" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#fffbe8"/><stop offset="24%" stop-color="#f4ecd0" stop-opacity=".9"/>
        <stop offset="34%" stop-color="#c8d4ff" stop-opacity=".22"/><stop offset="100%" stop-color="#c8d4ff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${u}moonDisc" cx="0.4" cy="0.38" r="0.7">
        <stop offset="0%" stop-color="#fffdf0"/><stop offset="70%" stop-color="#efe6c4"/><stop offset="100%" stop-color="#d6caa2"/>
      </radialGradient>
      <radialGradient id="${u}cloud" cx="0.5" cy="0.3" r="0.75">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="70%" stop-color="#f1f5fa"/><stop offset="100%" stop-color="#c9d6e4"/>
      </radialGradient>
      <radialGradient id="${u}ncloud" cx="0.3" cy="0.3" r="0.8">
        <stop offset="0%" stop-color="#5a6a96"/><stop offset="60%" stop-color="#2c3862"/><stop offset="100%" stop-color="#1a2244"/>
      </radialGradient>
      <radialGradient id="${u}glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#fffcc0"/><stop offset="30%" stop-color="#e8ff7a" stop-opacity=".8"/><stop offset="100%" stop-color="#c8ff5a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${u}bb" cx="0.66" cy="0.28" r="0.85">
        <stop offset="0%" stop-color="#dcb88e"/><stop offset="50%" stop-color="#a97f58"/><stop offset="100%" stop-color="#6c4e36"/>
      </radialGradient>
      <radialGradient id="${u}bc" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0%" stop-color="#f6ead6"/><stop offset="100%" stop-color="#d6bf9c"/>
      </radialGradient>
      <radialGradient id="${u}be" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0%" stop-color="#f4c0b6"/><stop offset="100%" stop-color="#c68478"/>
      </radialGradient>
      <radialGradient id="${u}bt" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#ddd3c4"/>
      </radialGradient>
      <radialGradient id="${u}ob" cx="0.36" cy="0.26" r="0.9">
        <stop offset="0%" stop-color="#a77a50"/><stop offset="55%" stop-color="#6e4a2c"/><stop offset="100%" stop-color="#3a2616"/>
      </radialGradient>
      <radialGradient id="${u}obl" cx="0.42" cy="0.3" r="0.8">
        <stop offset="0%" stop-color="#e2c69c"/><stop offset="100%" stop-color="#a98256"/>
      </radialGradient>
      <radialGradient id="${u}ofd" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0%" stop-color="#efdcb8"/><stop offset="80%" stop-color="#cfae7e"/><stop offset="100%" stop-color="#8a6440"/>
      </radialGradient>
      <radialGradient id="${u}oey" cx="0.45" cy="0.4" r="0.6">
        <stop offset="0%" stop-color="#ffe27a"/><stop offset="70%" stop-color="#f0a21e"/><stop offset="100%" stop-color="#a85e08"/>
      </radialGradient>
      <radialGradient id="${u}orim" cx="0.08" cy="0.2" r="0.75">
        <stop offset="0%" stop-color="#cfe0ff" stop-opacity=".55"/><stop offset="45%" stop-color="#9ab4ff" stop-opacity=".12"/><stop offset="100%" stop-color="#1a2450" stop-opacity=".32"/>
      </radialGradient>
      <filter id="${u}fur" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="4.5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="${u}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>`;
  }


  // ---- pop-up geometry ------------------------------------------------
  const W = 1600, H = 1000, FLOOR = 520;
  const RIM = '#fffaf0';
  function toScene(u, v) {
    const t = v / 800;
    return [800 + (u - 800) * (0.86 + 0.14 * t), FLOOR + t * (H - FLOOR)];
  }
  const depthK = v => 0.86 + 0.14 * v / 800;

  // A die-cut piece: drop shadow + white paper rim from the silhouette
  // (plain shapes, no fill), then the art. Strokes only: no filters, so a
  // piece costs nothing extra while the slider re-clips it.
  function cut(sil, art, base, rw) {
    rw = rw || 5;
    const contact = base
      ? `<ellipse cx="${n(base[0])}" cy="${n(base[1])}" rx="${n(base[2])}" ry="${n(Math.max(5, base[2] * 0.07))}" fill="#1e140a" opacity=".3"/>`
      : '';
    return `<g>${contact}<g transform="translate(3 4)" fill="#1e140a" stroke="#1e140a" stroke-width="${rw}" stroke-linejoin="round" opacity=".18">${sil}</g>` +
      `<g transform="translate(1.6 2.6)" fill="#c9bea8" stroke="#c9bea8" stroke-width="${rw}" stroke-linejoin="round">${sil}</g>` +
      `<g fill="${RIM}" stroke="${RIM}" stroke-width="${rw}" stroke-linejoin="round">${sil}</g>${art}</g>`;
  }
  function popDefs(u) {
    return `<filter id="${u}rim" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/>
        <feFlood flood-color="${RIM}"/><feComposite in2="d" operator="in" result="r"/>
        <feOffset in="d" dx="3" dy="4" result="o"/><feFlood flood-color="#1e140a" flood-opacity=".22"/>
        <feComposite in2="o" operator="in" result="s"/>
        <feOffset in="SourceAlpha" dx="6" dy="-8" result="so"/>
        <feComposite in="SourceAlpha" in2="so" operator="out" result="se"/>
        <feGaussianBlur in="se" stdDeviation="6" result="sb"/>
        <feFlood flood-color="#2a1606" flood-opacity=".5"/><feComposite in2="sb" operator="in" result="sc"/>
        <feComposite in="sc" in2="SourceAlpha" operator="in" result="shade"/>
        <feOffset in="SourceAlpha" dx="-4" dy="5" result="ho"/>
        <feComposite in="SourceAlpha" in2="ho" operator="out" result="he"/>
        <feGaussianBlur in="he" stdDeviation="3.5" result="hb"/>
        <feFlood flood-color="#fff2d0" flood-opacity=".45"/><feComposite in2="hb" operator="in" result="hc"/>
        <feComposite in="hc" in2="SourceAlpha" operator="in" result="lite"/>
        <feMerge><feMergeNode in="s"/><feMergeNode in="r"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="lite"/></feMerge>
      </filter>
      <filter id="${u}rimN" x="-20%" y="-20%" width="140%" height="140%">
        <feColorMatrix in="SourceGraphic" type="matrix" values=".55 0 0 0 0  0 .6 0 0 .02  0 0 .8 0 .06  0 0 0 1 0" result="c"/>
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/>
        <feFlood flood-color="#dfe6f5"/><feComposite in2="d" operator="in" result="r"/>
        <feOffset in="d" dx="3" dy="4" result="o"/><feFlood flood-color="#000814" flood-opacity=".3"/>
        <feComposite in2="o" operator="in" result="s"/>
        <feOffset in="SourceAlpha" dx="-6" dy="-8" result="so"/>
        <feComposite in="SourceAlpha" in2="so" operator="out" result="se"/>
        <feGaussianBlur in="se" stdDeviation="6" result="sb"/>
        <feFlood flood-color="#000814" flood-opacity=".55"/><feComposite in2="sb" operator="in" result="sc"/>
        <feComposite in="sc" in2="SourceAlpha" operator="in" result="shade"/>
        <feOffset in="SourceAlpha" dx="4" dy="5" result="ho"/>
        <feComposite in="SourceAlpha" in2="ho" operator="out" result="he"/>
        <feGaussianBlur in="he" stdDeviation="3.5" result="hb"/>
        <feFlood flood-color="#cfe0ff" flood-opacity=".35"/><feComposite in2="hb" operator="in" result="hc"/>
        <feComposite in="hc" in2="SourceAlpha" operator="in" result="lite"/>
        <feMerge><feMergeNode in="s"/><feMergeNode in="r"/><feMergeNode in="c"/><feMergeNode in="shade"/><feMergeNode in="lite"/></feMerge>
      </filter>`;
  }

  // ---- the shared layout (same in both copies, so the halves line up) --
  function popLayout(seed) {
    const r = rng(seed);
    const L = { clusters: [], dabs: [], bark: [], stars: [], bumps: [], blades: [], marks: [], dots: [] };
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      L.clusters.push({ x: 800 + Math.cos(a) * d * 300, y: 410 + Math.sin(a) * d * 130, r: 44 + r() * 40, c: Math.floor(r() * 3) });
    }
    L.clusters.sort((a, b) => a.y - b.y);
    // the crown, after the reference (.kiro/reference/slider/big_tree...):
    // a wide umbrella dome, much wider than tall, built from many small
    // rounded "poms" in rows, lit on top, dark underneath, flat-ish bottom
    L.poms = [];
    const CX = 800, CY = 400, RX = 370, RY = 230, BOTTOM = 578;
    for (let row = 0; row < 7; row++) {
      const y = 190 + row * 62;
      const t = (y - CY) / RY;
      const half = RX * Math.sqrt(Math.max(0, 1 - t * t)) * (row === 0 ? 0.8 : 1);
      if (half < 40) continue;
      const pr = 46 + row * 3;
      const count = Math.max(2, Math.round((half * 2) / (pr * 1.25)));
      for (let k = 0; k < count; k++) {
        const x = CX - half + pr * 0.6 + (k + (row % 2) * 0.5) * ((half * 2 - pr * 1.2) / Math.max(1, count - 0.5));
        if (x > CX + half - pr * 0.4) continue;
        L.poms.push({ x: x + (r() - 0.5) * 14, y: Math.min(BOTTOM - pr * 0.5, y + (r() - 0.5) * 14),
          r: pr * (0.85 + r() * 0.3), row, c: Math.floor(r() * 3), dots: Array.from({ length: 12 }, () => [r(), r(), r()]) });
      }
    }
    // back rows first, so nearer (lower) poms overlap the ones behind
    L.poms.sort((p1, p2) => p1.y - p2.y);
    for (let i = 0; i < 150; i++) {
      const c = L.clusters[Math.floor(r() * L.clusters.length)];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * c.r * 0.8;
      L.dabs.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, rot: r() * 180, s: 4 + r() * 5, c: Math.floor(r() * 4) });
    }
    for (let i = 0; i < 24; i++) {
      L.bark.push({ x: 762 + r() * 76, y0: 525 + r() * 80, y1: 640 + r() * 130, wob: (r() - 0.5) * 8, dark: r() < 0.6 });
    }
    for (let i = 0; i < 60; i++) L.stars.push({ x: 170 + r() * 1260, y: 150 + r() * 340, r: 0.7 + r() * 1.5, a: 0.4 + r() * 0.6 });
    for (let i = 0; i < 16; i++) L.bumps.push(18 + r() * 34);
    for (let x = -10; x <= 1610; x += 13) L.blades.push({ x, h: 16 + r() * 22, lean: (r() - 0.5) * 10 });
    for (let i = 0; i < 520; i++) L.marks.push({ x: r() * 1600, y: r() * 800, l: 4 + r() * 8, c: Math.floor(r() * 5) });
    for (let i = 0; i < 70; i++) L.dots.push({ x: r() * 1600, y: 80 + r() * 700, c: Math.floor(r() * 3) });
    return L;
  }

  // ---- standing pieces --------------------------------------------------
  // sky card at the back: a scalloped cloud-top card, sun or moon on it
  function skyCard(u, mode, skyKey, L) {
    const x0 = 150, x1 = 1450, yb = toScene(0, 22)[1], yt = 250;
    let d = `M${x0} ${n(yb)} L${x0} ${yt}`;
    const step = (x1 - x0) / L.bumps.length;
    L.bumps.forEach((h, i) => {
      d += ` Q${n(x0 + step * (i + 0.5))} ${n(yt - h * 2)} ${n(x0 + step * (i + 1))} ${yt}`;
    });
    d += ` L${x1} ${n(yb)}Z`;
    const night = mode !== 'day';
    let art = `<clipPath id="${u}${mode}card"><path d="${d}"/></clipPath><g clip-path="url(#${u}${mode}card)">
      <rect x="${x0 - 10}" y="100" width="${x1 - x0 + 20}" height="${n(yb - 90)}" fill="url(#${u}${mode}sky)"/>`;
    if (mode === 'night') {
      art += L.stars.map(t => `<circle cx="${n(t.x)}" cy="${n(t.y)}" r="${n(t.r)}" fill="#fff8e0" opacity="${(skyKey === 'nrain' ? t.a * 0.3 : t.a).toFixed(2)}"/>`).join('');
      if (skyKey !== 'nrain') {
        art += `<circle cx="330" cy="270" r="150" fill="url(#${u}moon)"/>
          <circle cx="330" cy="270" r="44" fill="url(#${u}moonDisc)"/>
          <circle cx="318" cy="260" r="9" fill="#d8cca6" opacity=".55"/><circle cx="344" cy="284" r="7" fill="#d8cca6" opacity=".5"/>
          <circle cx="338" cy="250" r="4" fill="#d8cca6" opacity=".45"/>`;
      }
      art += skyKey === 'nrain'
        ? cloud(260, 260, 1.2, `url(#${u}ncloud)`, 1) + cloud(640, 230, 1.3, `url(#${u}ncloud)`, 1) + cloud(1120, 250, 1.3, `url(#${u}ncloud)`, 1)
        : cloud(560, 330, 0.6, `url(#${u}ncloud)`, 0.6) + cloud(1120, 300, 0.7, `url(#${u}ncloud)`, 0.5);
      if (skyKey === 'ndawn') art += `<rect x="${x0}" y="420" width="${x1 - x0}" height="120" fill="#e8a0a0" opacity=".18"/>`;
    } else if (mode === 'day') {
      if (skyKey !== 'rain') {
        const sy = skyKey === 'evening' ? 430 : 280;
        art += `<circle cx="1270" cy="${sy}" r="170" fill="url(#${u}sun)"/><circle cx="1270" cy="${sy}" r="40" fill="#fff6c8"/>`;
      }
      art += skyKey === 'rain'
        ? cloud(1000, 250, 1.2, '#9aa6b4', 1) + cloud(1260, 230, 1.3, '#aab4c0', 1) + cloud(420, 250, 1.2, '#9ca8b6', 1)
        : cloud(1000, 270, 0.75, `url(#${u}cloud)`, 0.95) + cloud(1120, 400, 0.5, `url(#${u}cloud)`, 0.85) + cloud(380, 320, 0.65, `url(#${u}cloud)`, 0.9);
    } else {
      // dusk: sun going down on the right, pale moon up on the left
      art += `<circle cx="1180" cy="520" r="230" fill="url(#${u}sun)" opacity=".9"/><circle cx="1180" cy="530" r="52" fill="#ffd27a"/>
        <circle cx="360" cy="280" r="110" fill="url(#${u}moon)" opacity=".6"/><circle cx="360" cy="280" r="30" fill="url(#${u}moonDisc)" opacity=".85"/>
        ${cloud(600, 300, 0.7, '#f2a88a', 0.55)}${cloud(980, 360, 0.55, '#ffc29a', 0.5)}`;
    }
    art += `</g><path d="${d}" fill="none" stroke="${night ? '#0a1028' : '#8ab4cc'}" stroke-opacity=".35" stroke-width="2"/>`;
    return cut(`<path d="${d}"/>`, art);
  }

  // rolling hills strip with a far treeline on its top edge
  function hillStrip(u, mode, kind) {
    const P = PAL[mode];
    const yb = toScene(0, 70)[1];
    const x0 = 100, x1 = 1500;
    const top = x => {
      let y = 486 + Math.sin(x * 0.006) * 16 + Math.sin(x * 0.017) * 6;
      if (kind === 'hill') {
        y -= 110 * Math.exp(-Math.pow((x - 330) / 160, 2)) + 120 * Math.exp(-Math.pow((x - 1290) / 170, 2));
      }
      return y;
    };
    let d = `M${x0} ${n(yb)}`;
    for (let x = x0; x <= x1; x += 25) d += ` L${x} ${n(top(x))}`;
    d += ` L${x1} ${n(yb)}Z`;
    let trees = '';
    for (let x = x0 + 20; x < x1; x += 46) {
      if (kind === 'hill' && (Math.abs(x - 330) < 150 || Math.abs(x - 1290) < 160)) continue;
      const y = top(x);
      trees += `<ellipse cx="${x}" cy="${n(y)}" rx="22" ry="${n(14 + Math.abs(Math.sin(x)) * 9)}"/>`;
    }
    const art = `<g fill="${P.hillFar2}">${trees}</g><path d="${d}" fill="${P.hillNear}"/>
      <path d="${d}" fill="${P.hillFar}" opacity=".35" transform="translate(0 -6)"/>
      <path d="M${x0} ${n(yb - 10)} L${x1} ${n(yb - 10)}" stroke="${P.ground[2]}" stroke-width="16" opacity=".4"/>`;
    return cut(`${trees.replace(/<ellipse /g, '<ellipse ')}<path d="${d}"/>`, art);
  }

  // the big oak (owl branch on the left, knot hole, leafy crown)
  // The big oak, in two pop-up layers for depth:
  //   oakBack:  short gnarled trunk with buttress roots, the many limbs
  //             fanning out under the crown, and the whole crown in shade
  //   oakFront: the nearer, lower poms, lit on top and dark underneath
  const OAK = {
    trunk: 'M700 794 C736 784 756 764 762 732 C768 696 756 664 768 634 C776 614 788 604 800 602 C812 604 824 614 832 634 C844 664 832 696 838 732 C844 764 864 784 900 794 C868 800 842 792 822 800 C806 792 790 802 774 796 C750 802 726 800 700 794Z',
    roots: 'M700 794 C676 798 650 804 626 812 C660 812 692 806 716 798Z M900 794 C926 800 954 806 980 814 C948 814 914 808 886 800Z M770 796 C760 806 748 812 736 818 C760 818 776 812 786 802Z',
    owl: 'M774 650 C704 640 640 636 540 618 C532 624 532 632 540 636 C630 652 704 664 774 686Z',
    twig: 'M544 620 C526 610 512 610 500 602 L504 596 C520 600 532 604 548 614Z'
  };
  const LIMBS = [[470, 560], [560, 572], [640, 556], [700, 540], [760, 534], [840, 534], [900, 540], [960, 556], [1040, 572], [1120, 560]];
  function limbs(P, lx) {
    let s = '';
    LIMBS.forEach(([ex, ey], i) => {
      const sx = 800 + (ex - 800) * 0.06, sy = 624;
      const mx = 800 + (ex - 800) * 0.45, my = ey + 40 - Math.abs(ex - 800) * 0.02;
      const d = `M${n(sx)} ${sy} Q${n(mx)} ${n(my)} ${ex} ${ey}`;
      s += `<path d="${d}" stroke="${P.barkDark}" stroke-width="${i % 3 ? 7 : 10}" stroke-linecap="round" fill="none"/>` +
        `<path d="${d}" stroke="${lx > 0 ? P.barkLight : P.bark}" stroke-width="${i % 3 ? 2 : 3}" stroke-linecap="round" fill="none" opacity=".6" transform="translate(${lx > 0 ? 1.5 : -1.5} -1.5)"/>`;
      // a few twigs at the ends, reaching into the crown
      s += `<path d="M${ex} ${ey} l${(ex - 800) * 0.06} -26 M${ex} ${ey} l${(800 - ex) * 0.05} -30" stroke="${P.barkDark}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    });
    return s;
  }
  function pomCircles(L, filter) {
    return L.poms.filter(filter).map(p => `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}"/>`).join('');
  }
  // one pom: shade, leaf body (offset towards the light), a bright sunlit cap
  // with leaf speckle, and a dark band under it where the next pom overlaps
  function pom(u, mode, P, p, lx) {
    const lift = mode === 'night' ? 0.22 : 0.42;
    let s = `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}" fill="${P.leafDark}"/>
      <circle cx="${n(p.x + lx * p.r * 0.08)}" cy="${n(p.y - p.r * 0.1)}" r="${n(p.r * 0.88)}" fill="url(#${u}${mode}lf${p.c})"/>
      <ellipse cx="${n(p.x + lx * p.r * 0.2)}" cy="${n(p.y - p.r * 0.42)}" rx="${n(p.r * 0.55)}" ry="${n(p.r * 0.32)}" fill="${P.leafLight}" opacity="${lift}"/>`;
    p.dots.forEach(([a, d, k], i) => {
      const ang = Math.PI * (1.05 + a * 0.9);           // upper half of the pom
      const x = p.x + Math.cos(ang) * d * p.r * 0.85, y = p.y + Math.sin(ang) * d * p.r * 0.85;
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(2 + k * 2.4)}" fill="${i % 3 ? P.leafLight : P.leafDark}" opacity="${i % 3 ? lift + 0.1 : 0.35}"/>`;
    });
    return s;
  }
  function oakBack(u, mode, L) {
    const P = PAL[mode];
    const lx = P.lightX;
    const sil = `<path d="${OAK.trunk}"/><path d="${OAK.roots}"/><path d="${OAK.owl}"/><path d="${OAK.twig}"/>` +
      LIMBS.map(([ex, ey]) => `<path d="M800 624 Q${n(800 + (ex - 800) * 0.45)} ${n(ey + 40)} ${ex} ${ey}" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('') +
      pomCircles(L, () => true);
    // the whole crown in shade (the far side of the tree)
    const shade = L.poms.map(p => `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}" fill="${P.leafDark}"/>` +
      `<circle cx="${n(p.x + lx * p.r * 0.1)}" cy="${n(p.y - p.r * 0.14)}" r="${n(p.r * 0.78)}" fill="${P.leaf[2]}" opacity=".7"/>`).join('');
    // gnarled bark: twisting ridges that run into the roots and limbs
    const r = rng(77);
    let bark = '';
    for (let i = 0; i < 30; i++) {
      const x = 770 + r() * 60, y0 = 612 + r() * 30, y1 = 740 + r() * 56;
      const w = (r() - 0.5) * 18;
      bark += `<path d="M${n(x)} ${n(y0)}C${n(x + w)} ${n(y0 + 40)} ${n(x - w)} ${n(y1 - 40)} ${n(x + w * 1.6)} ${n(y1)}" stroke="${i % 3 ? P.barkDark : P.barkLight}" stroke-opacity="${i % 3 ? 0.55 : 0.35}" stroke-width="${i % 3 ? 3 : 1.6}" fill="none" stroke-linecap="round"/>`;
    }
    const knot = `<ellipse cx="796" cy="704" rx="11" ry="16" fill="${P.barkDark}"/><path d="M785 700 C786 687 806 687 807 700" stroke="${P.barkLight}" stroke-opacity=".5" stroke-width="2.4" fill="none"/>`;
    const art = `${shade}${limbs(P, lx)}
      <path d="${OAK.trunk}" fill="url(#${u}${mode}tr)"/><path d="${OAK.roots}" fill="${P.bark}"/>${bark}${knot}
      <path d="${OAK.owl}" fill="url(#${u}${mode}tr)"/><path d="${OAK.twig}" fill="${P.bark}"/>
      <path d="M560 626 C640 642 700 652 768 666" stroke="${lx > 0 ? P.barkDark : P.barkLight}" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
    return cut(sil, art, [800, 800, 150], 4);
  }
  function oakFront(u, mode, L, garland) {
    const P = PAL[mode];
    const lx = P.lightX;
    const front = p => p.row >= 3 || (p.row >= 1 && Math.round(p.x / 40) % 2 === 0);
    const sil = pomCircles(L, front);
    const art = L.poms.filter(front).map(p => pom(u, mode, P, p, lx)).join('');
    return cut(sil, art, null, 3) + (garland ? stars(mode, garland === 'lit') : '');
  }

  // paper-star garlands strung through the crown (the night friends hang
  // them; Bunny sees them on the last day page; lit at the party)
  function stars(mode, lit) {
    const col = mode === 'night' ? '#c8b45a' : '#ffd24a';
    let s = '';
    [[560, 560, 1040, 560, 70], [620, 470, 980, 470, 50]].forEach(([x0, y0, x1, y1, sag]) => {
      const cx = (x0 + x1) / 2, cy = y0 + sag * 2;
      s += `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#f4ecd8" stroke-width="2" fill="none"/>`;
      for (let i = 1; i < 9; i++) {
        const t = i / 9, x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y1 + 12;
        const c = i % 3 === 0 ? '#e86a5a' : i % 3 === 1 ? col : '#8ac8f0';
        s += `${lit ? `<circle cx="${n(x)}" cy="${n(y)}" r="20" fill="#ffe8a0" opacity=".3"/>` : ''}
          <path d="M${n(x)} ${n(y - 12)} L${n(x + 3.5)} ${n(y - 3.5)} L${n(x + 12)} ${n(y - 2)} L${n(x + 5)} ${n(y + 4)} L${n(x + 7)} ${n(y + 12)} L${n(x)} ${n(y + 7)} L${n(x - 7)} ${n(y + 12)} L${n(x - 5)} ${n(y + 4)} L${n(x - 12)} ${n(y - 2)} L${n(x - 3.5)} ${n(y - 3.5)}Z" fill="${c}" stroke="#fffaf0" stroke-width="2.4" stroke-linejoin="round"/>`;
      }
    });
    return s;
  }

  // the near-edge grass strip (with a few daisies)
  function grassStrip(mode, L) {
    const P = PAL[mode];
    const yb = 998;
    let d = `M-10 ${yb}`;
    L.blades.forEach(b => { d += ` L${n(b.x + b.lean)} ${n(yb - b.h)} L${n(b.x + 6.5)} ${n(yb - b.h * 0.35)}`; });
    d += ` L1610 ${yb}Z`;
    let daisies = '';
    for (let i = 0; i < 12; i++) {
      const x = 60 + i * 135 + (i % 3) * 20;
      daisies += daisy(x, yb - 20 - (i % 2) * 10, 1.4, i % 4 === 0 ? 1 : 0, mode);
    }
    const art = `<path d="${d}" fill="${P.grass[0]}"/>
      <path d="${d}" fill="${P.grass[2]}" opacity=".6" transform="translate(0 12)"/>${daisies}`;
    return cut(`<path d="${d}"/>`, art, null, 2);
  }

  function daisy(x, y, k, c, mode) {
    const night = mode === 'night';
    const petal = c ? (night ? '#5a4a7a' : '#f6c63a') : (night ? '#8a94b4' : '#ffffff');
    const mid = night ? '#8a7a3a' : '#f4b52a';
    let p = '';
    for (let i = 0; i < 8; i++) p += `<ellipse cx="0" cy="-5" rx="2.2" ry="5" fill="${petal}" transform="rotate(${i * 45})"/>`;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k)})">
      <path d="M0 0 q-2 -10 0 -18" stroke="${night ? '#1e3a34' : '#4f8a2c'}" stroke-width="1.6" fill="none"/>
      <g transform="translate(0 -20)">${p}<circle r="2.8" fill="${mid}"/></g></g>`;
  }

  // a piece standing on the ground at (gu, gv), drawn at its origin by `art`
  // (a function of scale), rimmed by `sil` (same origin)
  function standing(gu, gv, k, sil, art, w, rw) {
    const [x, y] = toScene(gu, gv);
    const s = k * depthK(gv);
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">${cut(sil, art, [0, 0, w || 40], rw || 3)}</g>`;
  }

  function bush(mode, u, gu, gv, k) {
    const P = PAL[mode];
    const blobs = [[-60, -36, 46], [-20, -66, 56], [30, -56, 54], [70, -32, 40], [0, -30, 50]];
    const sil = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
    let art = blobs.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}${mode}lf${i % 3})"/>`).join('');
    // leaf texture: many small leaves over the clumps, lighter on the lit side
    const r = rng(Math.round(gu * 7 + gv));
    for (let i = 0; i < 30; i++) {
      const [bx, by, br] = blobs[i % blobs.length];
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * br * 0.9;
      const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
      const lit = (x * P.lightX) > 0 && y < -40;
      art += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(5 + r() * 4)}" ry="${n(2.4 + r() * 1.6)}" transform="rotate(${n(r() * 180)} ${n(x)} ${n(y)})" fill="${lit ? P.leafLight : P.dab[i % 4]}" opacity="${lit ? 0.7 : 0.85}"/>`;
    }
    art += `<path d="M-100 -10 C-60 4 60 4 106 -8" stroke="${P.leafDark}" stroke-width="18" opacity=".45" fill="none"/>`;
    if (mode === 'day') art += [[-40, -60], [10, -90], [50, -40], [-70, -30], [-10, -40], [80, -50], [30, -100], [-56, -84]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="5.5" fill="#c8283a"/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.5" fill="#fff" opacity=".7"/>`).join('');
    return standing(gu, gv, k, sil, art, 100);
  }

  // ---- decor: small standing things on every page, so no meadow is empty --
  // drawn in daylight colours; the night twin gets the moonlit rim filter
  function mushroom(r) {
    const red = r() < 0.5;
    const cap = red ? '#d8322a' : '#a8784a', capD = red ? '#8a1a14' : '#6a4a2a';
    let spots = '';
    if (red) for (let i = 0; i < 6; i++) spots += `<ellipse cx="${n(-16 + r() * 32)}" cy="${n(-40 + r() * 12)}" rx="3" ry="2.2" fill="#fff6e8"/>`;
    return `<path d="M-6 0 C-8 -14 -7 -26 -5 -32 L5 -32 C7 -26 8 -14 6 0Z" fill="#f2e8d4"/>
      <path d="M-5 -10 C0 -8 4 -10 6 -12" stroke="#d8c8a8" stroke-width="1.4" fill="none"/>
      <path d="M-26 -30 C-26 -50 26 -50 26 -30 C14 -26 -14 -26 -26 -30Z" fill="${cap}"/>
      <path d="M-26 -30 C-14 -26 14 -26 26 -30 C20 -24 -20 -24 -26 -30Z" fill="${capD}"/>
      <path d="M-18 -42 C-10 -48 4 -48 12 -44" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/>${spots}`;
  }
  function stone(r) {
    const w = 30 + r() * 26, h = 16 + r() * 12;
    return `<path d="M${-w} 0 C${-w} ${-h} ${-w * 0.4} ${-h * 1.3} 0 ${-h * 1.2} C${w * 0.6} ${-h * 1.2} ${w} ${-h * 0.6} ${w} 0Z" fill="#8a8a84"/>
      <path d="M${-w * 0.7} ${-h * 0.6} C${-w * 0.3} ${-h * 1.1} ${w * 0.3} ${-h * 1.1} ${w * 0.6} ${-h * 0.7}" stroke="#c8c8c0" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M${-w} 0 C${-w * 0.5} ${-h * 0.35} ${w * 0.5} ${-h * 0.35} ${w} 0" fill="#5a5a54" opacity=".6"/>
      <ellipse cx="${-w * 0.3}" cy="${-h * 0.9}" rx="${w * 0.3}" ry="${h * 0.25}" fill="#6a8a3a" opacity=".75"/>`;
  }
  function fern(r) {
    let s = '';
    for (let f = 0; f < 5; f++) {
      const ang = -60 + f * 30 + (r() - 0.5) * 10;
      let leaves = '';
      for (let i = 1; i < 9; i++) {
        const y = -i * 9, w = 12 - i;
        leaves += `<path d="M0 ${y} q${-w} -2 ${-w * 1.4} -6 M0 ${y} q${w} -2 ${w * 1.4} -6" stroke="#4e8a2c" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
      }
      s += `<g transform="rotate(${n(ang)})"><path d="M0 0 C2 -30 0 -60 -6 -84" stroke="#3e7224" stroke-width="2.4" fill="none"/>${leaves}</g>`;
    }
    return s;
  }
  function clump(r) {
    let s = '';
    for (let i = -6; i <= 6; i++) s += `<path d="M${i * 2.4} 0 q${i * 2} -24 ${i * 4 + (r() - 0.5) * 8} -${n(40 + r() * 26)}" stroke="${['#5d9a34', '#87bd48', '#4e8a2c', '#9ccc5a'][(i + 6) % 4]}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
    return s;
  }
  function wildflowers(r) {
    let s = '';
    const col = ['#f4f0e6', '#f6c63a', '#8a6ad8', '#e86aa8'][Math.floor(r() * 4)];
    for (let i = 0; i < 5; i++) {
      const x = -20 + i * 10, h = 34 + r() * 30;
      s += `<path d="M${x} 0 q${(r() - 0.5) * 10} ${-h / 2} ${(r() - 0.5) * 8} ${-h}" stroke="#4e8a2c" stroke-width="2" fill="none"/>
        <g transform="translate(${n(x + (r() - 0.5) * 8)} ${n(-h)})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4" rx="2.6" ry="4.4" fill="${col}" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#e8a020"/></g>`;
    }
    return s;
  }
  function logPiece() {
    return `<path d="M-90 0 C-96 -20 -86 -38 -70 -38 L80 -34 C96 -32 98 -4 84 0Z" fill="#6a4a2e"/>
      <path d="M-60 -30 H70 M-60 -18 H76 M-56 -8 H70" stroke="#3e2818" stroke-width="2.4" opacity=".55"/>
      <ellipse cx="-74" cy="-19" rx="16" ry="19" fill="#b88a58"/><ellipse cx="-74" cy="-19" rx="10" ry="12" fill="none" stroke="#8a5e34" stroke-width="2"/>
      <ellipse cx="-74" cy="-19" rx="4" ry="5" fill="none" stroke="#8a5e34" stroke-width="2"/>
      <path d="M-40 -38 C-20 -46 20 -46 40 -36" stroke="#6a9a3a" stroke-width="8" stroke-linecap="round" opacity=".8" fill="none"/>
      ${mushroomSmall(30, -36)}${mushroomSmall(48, -34)}`;
  }
  function mushroomSmall(x, y) {
    return `<path d="M${x - 2} ${y} V${y - 10} H${x + 2} V${y}Z" fill="#f2e8d4"/><path d="M${x - 8} ${y - 9} C${x - 8} ${y - 18} ${x + 8} ${y - 18} ${x + 8} ${y - 9}Z" fill="#c8884a"/>`;
  }
  // keep clear of the trunk, the path and the places characters stand
  const DECOR_SPOTS = [[230, 520], [420, 760], [300, 700], [1380, 760], [1490, 640], [150, 610], [1180, 770], [640, 780], [990, 780], [560, 470], [1100, 450], [1450, 500], [330, 470], [1290, 700]];
  function decor(u, mode, kind, seed) {
    const r = rng(seed);
    const kinds = ['mushroom', 'stone', 'fern', 'clump', 'wildflowers', 'clump', 'mushroom', 'fern', 'stone', 'wildflowers', 'clump', 'fern', 'wildflowers', 'stone'];
    let sh = '', art = '';
    DECOR_SPOTS.forEach(([gu, gv], i) => {
      if (kind === 'pond' && gv > 600 && gu > 440 && gu < 1160) return;
      if (kind === 'puddle' && Math.hypot(gu - 1110, (gv - 640) * 3) < 220) return;
      const k = (i === 0 && kind !== 'bushes' ? 1 : 0);
      const [x, y] = toScene(gu, gv);
      const sc = depthK(gv) * (1.1 + r() * 0.4);
      const which = k ? 'log' : kinds[(i + seed) % kinds.length];
      const draw = which === 'mushroom' ? mushroom(r) : which === 'stone' ? stone(r) : which === 'fern' ? fern(r)
        : which === 'clump' ? clump(r) : which === 'log' ? logPiece() : wildflowers(r);
      sh += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(34 * sc)}" ry="${n(5 * sc)}" fill="#1e140a" opacity=".22"/>`;
      art += `<g transform="translate(${n(x)} ${n(y)}) scale(${n(r() < 0.5 ? -sc : sc)} ${n(sc)})"><g class="${u}sway" style="animation-delay:${(r() * 3).toFixed(2)}s">${draw}</g></g>`;
    });
    return sh + `<g filter="url(#${u}${mode === 'night' ? 'rimN' : 'rim'})">${art}</g>`;
  }

  function props(u, mode, kind) {
    const night = mode === 'night';
    let s = '';
    if (kind === 'carrots') {
      let sil = '', art = '';
      for (let i = 0; i < 6; i++) {
        const x = -125 + i * 50, y = (i % 2) * 6;
        for (let k = -2; k <= 2; k++) {
          sil += `<path d="M${x} ${y}q${k * 6} -20 ${k * 10} -40" stroke-width="7"/>`;
          art += `<path d="M${x} ${y}q${k * 6} -20 ${k * 10} -40" stroke="${night ? '#24443a' : '#4e9a2c'}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="${x + k * 10}" cy="${y - 40}" r="4.5" fill="${night ? '#2c4c42' : '#6ab43a'}"/>`;
        }
        art += `<path d="M${x - 8} ${y} L${x} ${y + 8} L${x + 8} ${y}Z" fill="${night ? '#6a3e22' : '#f07a1e'}"/>`;
      }
      s += standing(330, 590, 1.1, sil, art, 150);   // left page: Bunny's feather is by them
    } else if (kind === 'pond') {
      const reed = (i) => {
        const sil = `<path d="M0 0 q${i ? 6 : -6} -60 ${i ? 2 : -2} -110" stroke-width="7"/><rect x="-4" y="-122" width="8" height="26" rx="4"/>`;
        const art = `<path d="M0 0 q${i ? 6 : -6} -60 ${i ? 2 : -2} -110" stroke="${night ? '#203a30' : '#5a8a2a'}" stroke-width="4" fill="none"/>
          <path d="M-6 6 q-10 -40 -24 -60 M6 6 q14 -34 26 -50" stroke="${night ? '#1a3428' : '#6a9a34'}" stroke-width="3" fill="none"/>
          <rect x="-4" y="-122" width="8" height="26" rx="4" fill="${night ? '#2a2418' : '#7a4a22'}"/>`;
        return { sil, art };
      };
      const a = reed(0), b = reed(1);
      s += standing(470, 630, 1, a.sil, a.art, 30) + standing(1140, 630, 1, b.sil, b.art, 30);
    } else if (kind === 'flowers') {
      const r = rng(77);
      for (let i = 0; i < 16; i++) {
        const gu = 180 + r() * 1240, gv = 470 + r() * 280;
        if (Math.abs(gu - 800) < 170 && gv < 600) continue;
        if (gu > 940 && gu < 1100 && gv > 470 && gv < 580) continue;   // Bunny's spot
        const col = ['#e8443a', '#5a7ae8', '#f4c63a', '#e86aa8'][Math.floor(r() * 4)];
        const c = night ? '#3a3a5e' : col;
        const sil = `<path d="M0 0 q-3 -24 2 -48" stroke-width="5"/><circle cx="2" cy="-50" r="12"/>`;
        const art = `<path d="M0 0 q-3 -24 2 -48" stroke="${night ? '#1e3a34' : '#4a8a2a'}" stroke-width="2.6" fill="none"/>
          <ellipse cx="-7" cy="-24" rx="7" ry="3" fill="${night ? '#1e3a34' : '#5a9a30'}" transform="rotate(-30 -7 -24)"/>
          <g transform="translate(2 -50)"><circle cx="-6" cy="0" r="6.5" fill="${c}"/><circle cx="6" cy="0" r="6.5" fill="${c}"/>
          <circle cx="0" cy="-6" r="6.5" fill="${c}"/><circle cx="0" cy="6" r="6.5" fill="${c}"/><circle r="4" fill="${night ? '#5a5030' : '#2a1a10'}"/></g>`;
        s += standing(gu, gv, 1.2, sil, art, 14);
      }
    } else if (kind === 'bushes') {
      s += bush(mode, u, 330, 560, 1.15) + bush(mode, u, 1290, 560, 1.2);
    } else if (kind === 'burrow') {
      // an earth bank under grass, a deep arched hole with roots hanging over
      // it, a worn lip of dug soil and a few pebbles
      const earth = night ? ['#3a3026', '#2a221a', '#1a140e'] : ['#a88456', '#7e5e3a', '#5a3e24'];
      const grass = night ? ['#1f3d3a', '#2a4a44'] : ['#5d9a34', '#87bd48'];
      const bank = 'M-130 0 C-126 -50 -90 -96 -20 -104 C50 -108 112 -78 132 -30 C136 -14 134 -4 130 0Z';
      const sil = `<path d="${bank}"/>`;
      const r = rng(55);
      let crumbs = '', blades = '', roots = '';
      for (let i = 0; i < 18; i++) crumbs += `<ellipse cx="${n(-60 + r() * 130)}" cy="${n(-4 - r() * 18)}" rx="${n(2 + r() * 4)}" ry="${n(1.5 + r() * 2.5)}" fill="${i % 3 ? earth[2] : earth[0]}" opacity=".8"/>`;
      for (let i = 0; i < 26; i++) {
        const x = -118 + i * 9.6, top = -96 + Math.pow((x - 0) / 130, 2) * 70;
        blades += `<path d="M${n(x)} ${n(top + 8)} q${n((r() - 0.5) * 8)} -12 ${n((r() - 0.5) * 12)} -${n(16 + r() * 14)}" stroke="${grass[i % 2]}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
      }
      [[-30, -74], [-6, -78], [22, -76], [44, -70]].forEach(([x, y], i) => {
        roots += `<path d="M${x} ${y} q${i % 2 ? 4 : -4} 12 ${i % 2 ? -2 : 3} ${20 + i * 3}" stroke="${earth[0]}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      });
      const art = `<path d="${bank}" fill="${earth[1]}"/>
        <path d="M-130 0 C-126 -50 -90 -96 -20 -104 C50 -108 112 -78 132 -30 C90 -70 20 -86 -40 -80 C-90 -72 -118 -40 -130 0Z" fill="${earth[0]}" opacity=".7"/>
        <path d="M-110 -30 C-80 -40 -60 -36 -40 -44 M60 -40 C80 -46 100 -40 116 -30 M-90 -10 C-70 -16 -56 -12 -46 -18" stroke="${earth[2]}" stroke-width="2" fill="none" opacity=".5"/>
        <path d="M-52 0 C-54 -44 -30 -74 6 -74 C42 -74 62 -44 60 0Z" fill="${earth[2]}"/>
        <path d="M-40 0 C-42 -36 -22 -62 6 -62 C34 -62 50 -36 48 0Z" fill="${night ? '#050403' : '#140c06'}"/>
        <path d="M-24 0 C-24 -24 -12 -42 6 -42 C24 -42 32 -24 32 0Z" fill="#000" opacity=".7"/>
        <path d="M-52 0 C-54 -44 -30 -74 6 -74 C42 -74 62 -44 60 0" stroke="${earth[0]}" stroke-width="4" fill="none" opacity=".6"/>
        ${roots}${blades}
        <path d="M-70 0 C-40 -12 50 -12 84 0Z" fill="${earth[0]}"/>${crumbs}`;
      s += standing(1000, 470, 1, sil, art, 140);
    } else if (kind === 'rain') {
      const r = rng(31);
      s += `<g class="${u}rain">`;
      for (let i = 0; i < 120; i++) {
        const x = 160 + r() * 1280, y = 200 + r() * 760;
        if (x > 520 && x < 1090 && y > 560) continue;   // dry under the oak's crown
        s += `<path d="M${n(x)} ${n(y)}l-6 28" stroke="${night ? '#8a9ac8' : '#e8f0fa'}" stroke-opacity="${night ? 0.5 : 0.85}" stroke-width="2" stroke-linecap="round"/>`;
      }
      s += '</g>';
    }
    return s;
  }

  // ---- the printed ground (flat on the paper) ---------------------------
  function groundSVG(u, mode, kind, L) {
    const P = PAL[mode];
    const g = `${u}${mode}g`;
    const lx = P.lightX;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${g}m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${P.ground[2]}"/><stop offset=".5" stop-color="${P.ground[1]}"/><stop offset="1" stop-color="${P.ground[0]}"/>
        </linearGradient>
        <radialGradient id="${g}w" cx=".5" cy=".4" r=".6">
          <stop offset="0" stop-color="${P.water[0]}"/><stop offset=".6" stop-color="${P.water[1]}"/><stop offset="1" stop-color="${P.water[2]}"/>
        </radialGradient>
        <radialGradient id="${g}v" cx=".5" cy=".55" r=".75">
          <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${mode === 'night' ? 0.4 : 0.18}"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="800" fill="url(#${g}m)"/>`;
    s += L.marks.map(m => `<path d="M${n(m.x)} ${n(m.y)}l${n(m.l * 0.3)} ${n(-m.l)}" stroke="${P.grass[m.c]}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`).join('');
    // a worn path from the near edge to the oak
    s += `<path d="M700 800 C720 700 640 620 740 470 L860 470 C960 620 880 700 940 800Z" fill="${mode === 'night' ? '#2a3a36' : mode === 'dusk' ? '#a8905a' : '#c8b27a'}" opacity=".55"/>`;
    // the oak's printed shadow, falling away from the light
    s += `<ellipse cx="${800 - lx * 150}" cy="440" rx="300" ry="60" fill="${P.shadow}"/>`;
    s += L.dots.map(d => {
      const col = mode === 'night' ? ['#8a94b4', '#5a4a7a', '#4a6a6a'][d.c] : ['#ffffff', '#f6c63a', '#e86aa8'][d.c];
      return `<circle cx="${n(d.x)}" cy="${n(d.y)}" r="4" fill="${col}"/><circle cx="${n(d.x + 8)}" cy="${n(d.y + 3)}" r="3" fill="${col}"/>`;
    }).join('');
    const night = mode === 'night';
    if (kind === 'pond') {
      s += `<ellipse cx="800" cy="630" rx="350" ry="86" fill="${night ? '#1a2a2a' : '#6a7a3a'}"/>
        <ellipse cx="800" cy="630" rx="334" ry="76" fill="url(#${g}w)"/>
        <path d="M540 620 C700 604 920 604 1060 622" stroke="#fff" stroke-opacity="${night ? 0.14 : 0.4}" stroke-width="4" fill="none"/>`;
      [[620, 640, 34], [700, 670, 22], [930, 668, 26], [1040, 620, 20]].forEach(([x, y, r]) => {
        s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.45}" fill="${night ? '#1e3c30' : '#4f9a3a'}"/>`;
      });
      s += night ? `<ellipse cx="740" cy="626" rx="34" ry="12" fill="#f4ecd0" opacity=".6"/>` : `<ellipse cx="980" cy="624" rx="40" ry="10" fill="#fff6c8" opacity=".7"/>`;
    } else if (kind === 'puddle') {
      [[1110, 640, 150, 40], [470, 660, 110, 32]].forEach(([x, y, rx, ry]) => {
        s += `<ellipse cx="${x}" cy="${y + 4}" rx="${rx + 8}" ry="${ry + 6}" fill="${night ? '#14241e' : '#6a5a34'}"/>
          <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${g}w)"/>`;
      });
      s += night
        ? `<ellipse cx="1090" cy="636" rx="32" ry="12" fill="#fff6d8" opacity=".85"/><ellipse cx="450" cy="656" rx="24" ry="9" fill="#fff6d8" opacity=".75"/>`
        : `<ellipse cx="1150" cy="632" rx="30" ry="8" fill="#fffbe0" opacity=".9"/>`;
    } else if (kind === 'carrots') {
      s += `<ellipse cx="330" cy="596" rx="190" ry="44" fill="${night ? '#2a2420' : '#7a5232'}"/>
        ${[...Array(5)].map((_, i) => `<path d="M${170 + i * 10} ${578 + i * 9} H${490 - i * 10}" stroke="${night ? '#3a3028' : '#9a6a42'}" stroke-width="3" opacity=".7"/>`).join('')}`;
    } else if (kind === 'burrow') {
      // dug soil spread in front of the hole, and a little path worn into it
      s += `<ellipse cx="1000" cy="488" rx="150" ry="36" fill="${night ? '#2a2420' : '#8a6a44'}" opacity=".75"/>
        <ellipse cx="1004" cy="500" rx="80" ry="18" fill="${night ? '#332a22' : '#9a7a50'}" opacity=".8"/>
        <path d="M1004 512 C1020 560 1060 600 1120 620" stroke="${night ? '#2a3a36' : '#b8a070'}" stroke-width="22" stroke-linecap="round" fill="none" opacity=".45"/>`;
    }
    s += `<rect width="1600" height="800" fill="url(#${g}v)"/></svg>`;
    return s;
  }
  // ---- extras -----------------------------------------------------------
  function butterfly(u, x, y, k, col, delay) {
    return `<g transform="translate(${x} ${y}) scale(${k})"><g class="${u}flut" style="animation-delay:${delay}s">
      <path d="M0 0 C-18 -26 -34 -10 -26 4 C-34 18 -14 24 0 4Z" fill="${col}"/>
      <path d="M0 0 C18 -26 34 -10 26 4 C34 18 14 24 0 4Z" fill="${col}"/>
      <circle cx="-16" cy="-6" r="3.6" fill="#fff" opacity=".8"/><circle cx="16" cy="-6" r="3.6" fill="#fff" opacity=".8"/>
      <rect x="-1.6" y="-10" width="3.2" height="20" rx="1.6" fill="#2a1a10"/></g></g>`;
  }
  function fireflies(u, seed, count, area) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < count; i++) {
      const x = area[0] + r() * area[2], y = area[1] + r() * area[3];
      s += `<g transform="translate(${n(x)} ${n(y)})"><g class="${u}ff" style="animation-delay:${(r() * 2.4).toFixed(2)}s">
        <circle r="16" fill="url(#${u}glow)"/><circle r="2.6" fill="#fffde0"/></g></g>`;
    }
    return s;
  }
  function twinkles(u, seed) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < 14; i++) {
      const x = 180 + r() * 1240, y = 170 + r() * 300;
      if (Math.hypot(x - 330, y - 270) < 90) continue;
      const k = 0.6 + r() * 0.8;
      s += `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k)})"><g class="${u}tw" style="animation-delay:${(r() * 3).toFixed(2)}s">
        <path d="M0 -12 L2.4 -2.4 L12 0 L2.4 2.4 L0 12 L-2.4 2.4 L-12 0 L-2.4 -2.4Z" fill="#fff8dc"/></g></g>`;
    }
    return s;
  }
  function bird(x, y, k) {
    return `<path d="M${x - 14 * k} ${y} q${7 * k} ${-8 * k} ${14 * k} 0 q${7 * k} ${-8 * k} ${14 * k} 0" stroke="#3a3a4a" stroke-width="${2.4 * k}" fill="none" stroke-linecap="round"/>`;
  }
  function duck(x, y) {
    return `<g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="6" rx="40" ry="6" fill="#3f84ad" opacity=".5"/>
      <path d="M-34 0 C-34 -20 10 -26 30 -10 C40 -2 34 6 20 6 L-30 6 C-36 6 -36 2 -34 0Z" fill="#f2f0e6"/>
      <path d="M-20 -6 C-6 -18 16 -16 24 -6 C10 -2 -8 0 -20 -6Z" fill="#d8d4c4"/>
      <circle cx="-26" cy="-26" r="14" fill="#f4f2ea"/>
      <path d="M-40 -26 L-54 -22 L-40 -18Z" fill="#f4a024"/>
      <circle cx="-30" cy="-30" r="2.6" fill="#1a1a1a"/><circle cx="-31" cy="-31" r=".9" fill="#fff"/></g>`;
  }
  function frog(x, y) {
    return `<g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="0" rx="24" ry="14" fill="#3a6a3a"/>
      <ellipse cx="0" cy="4" rx="16" ry="8" fill="#6a9a5a"/>
      <circle cx="-11" cy="-12" r="8" fill="#3a6a3a"/><circle cx="11" cy="-12" r="8" fill="#3a6a3a"/>
      <circle cx="-11" cy="-13" r="5" fill="#f4e48a"/><circle cx="11" cy="-13" r="5" fill="#f4e48a"/>
      <circle cx="-11" cy="-13" r="2.6" fill="#111"/><circle cx="11" cy="-13" r="2.6" fill="#111"/>
      <path d="M-10 -2 q10 6 20 0" stroke="#1e3a1e" stroke-width="1.6" fill="none"/>
      <path d="M-24 6 l-10 6 M24 6 l10 6" stroke="#3a6a3a" stroke-width="5" stroke-linecap="round"/></g>`;
  }
  function mouse(x, y) {
    return `<g transform="translate(${x} ${y})">
      <path d="M26 0 C50 4 60 -8 70 -20" stroke="#8a8a9a" stroke-width="2.4" fill="none"/>
      <ellipse cx="6" cy="-10" rx="26" ry="16" fill="#8e8a98"/>
      <circle cx="-18" cy="-14" r="13" fill="#9a96a4"/>
      <circle cx="-14" cy="-28" r="8" fill="#a8a2b2"/><circle cx="-14" cy="-28" r="4.6" fill="#c49aa8"/>
      <path d="M-24 -16 q4 3 8 0" stroke="#2a2a32" stroke-width="1.8" fill="none"/>
      <circle cx="-31" cy="-12" r="2.6" fill="#c48a9a"/>
      <text x="6" y="-40" font-size="18" font-weight="700" fill="#cfd8ff" opacity=".85" font-family="sans-serif">z</text>
      <text x="18" y="-56" font-size="13" font-weight="700" fill="#cfd8ff" opacity=".6" font-family="sans-serif">z</text></g>`;
  }
  function rainbow() {
    const cols = ['#e8443a', '#f4a024', '#f4dc3a', '#5ab84a', '#3a8ae8', '#7a5ad8'];
    return `<g opacity=".72" fill="none">` + cols.map((c, i) =>
      `<path d="M${880 + i * 12} 560 A${300 - i * 12} ${250 - i * 11} 0 0 1 ${1480 - i * 12} 560" stroke="${c}" stroke-width="12"/>`).join('') + '</g>';
  }
  function shootingStar(u) {
    return `<g class="${u}shoot"><path d="M700 200 L480 300" stroke="url(#${u}trail)" stroke-width="5" stroke-linecap="round"/>
      <path d="M700 192 L704 200 L712 202 L704 206 L700 214 L696 206 L688 202 L696 200Z" fill="#fffbe0"/></g>`;
  }
  function carrot(x, y, rot, night) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M0 -7 C14 -8 40 -3 52 0 C40 3 14 8 0 7Z" fill="${night ? '#7a4a28' : '#f07a1e'}"/>
      <path d="M0 -3 q-14 -12 -22 -12 M0 0 q-16 -2 -26 2 M0 3 q-12 10 -20 14" stroke="${night ? '#2c4c42' : '#4e9a2c'}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  }

  // ---- characters ---------------------------------------------------------
  // Bunny: a wild brown rabbit, facing left (towards the tree), origin = the
  // point between its feet on the ground.
  function bunny(u, b) {
    const pose = b.pose || 'sit';
    const fr = rng(911);
    let fur = '';
    for (let i = 0; i < 46; i++) {
      const x = -10 + fr() * 70, y = -92 + fr() * 70;
      fur += `<path d="M${n(x)} ${n(y)}l${n(4 + fr() * 4)} ${n(2 + fr() * 3)}" stroke="${fr() < 0.5 ? 'rgba(80,52,30,.45)' : 'rgba(255,238,210,.4)'}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    const shadow = pose === 'hop'
      ? `<ellipse cx="0" cy="2" rx="48" ry="7" fill="rgba(40,30,10,.28)"/>`
      : `<ellipse cx="8" cy="2" rx="82" ry="11" fill="rgba(40,30,10,.32)"/>`;
    let body;
    if (pose === 'sleep') {
      body = `
        <circle cx="74" cy="-26" r="15" fill="url(#${u}bt)"/>
        <ellipse cx="14" cy="-36" rx="74" ry="38" fill="url(#${u}bb)"/>
        ${fur}
        <ellipse cx="-36" cy="-6" rx="28" ry="8" fill="#8a6446"/>
        <g transform="translate(-48 -40)">
          <path d="M14 -16 C46 -28 86 -22 104 -10 C86 -2 46 -6 12 -4Z" fill="url(#${u}bb)"/>
          <path d="M18 -13 C46 -22 78 -18 94 -10 C78 -6 46 -8 18 -8Z" fill="url(#${u}be)" opacity=".7"/>
          <ellipse cx="0" cy="0" rx="34" ry="27" fill="url(#${u}bb)"/>
          <ellipse cx="-10" cy="9" rx="20" ry="14" fill="rgba(246,232,210,.85)"/>
          <ellipse cx="-26" cy="7" rx="11" ry="9" fill="#efdcc2"/>
          <path d="M-16 -4 q6 5 12 0" stroke="#2a1a10" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path d="M-36 2 q4 -4 8 0 q-4 5 -8 0Z" fill="#c98078"/>
          <path d="M14 -16 C46 -32 90 -30 108 -18" stroke="rgba(255,236,206,.4)" stroke-width="2" fill="none"/>
        </g>
        <text x="-70" y="-90" font-size="26" font-weight="700" fill="#5a4a7a" opacity=".7" font-family="sans-serif">z</text>
        <text x="-48" y="-116" font-size="18" font-weight="700" fill="#5a4a7a" opacity=".5" font-family="sans-serif">z</text>`;
    } else {
      const lift = pose === 'hop' ? 'translate(0 -54) rotate(-12 0 -60)' : '';
      const hind = pose === 'hop'
        ? `<path d="M40 -30 C70 -14 92 4 96 18 C82 20 60 4 30 -12Z" fill="#8a6446"/>`
        : `<ellipse cx="-2" cy="-7" rx="46" ry="10" fill="#8a6446"/><ellipse cx="-30" cy="-9" rx="14" ry="4" fill="rgba(255,236,206,.35)"/>`;
      const earBack = `<path d="M10 -18 C18 -60 32 -100 24 -114 C12 -120 2 -82 -2 -22Z" fill="url(#${u}bb)"/>
            <path d="M10 -26 C16 -60 26 -96 20 -106 C13 -108 7 -78 4 -28Z" fill="url(#${u}be)"/>`;
      const earFront = `<path d="M-8 -20 C-18 -64 -16 -110 -2 -118 C12 -114 10 -66 6 -22Z" fill="url(#${u}bb)"/>
            <path d="M-4 -26 C-12 -64 -10 -102 -1 -108 C7 -104 5 -66 2 -28Z" fill="url(#${u}be)"/>
            <path d="M-2 -118 C12 -114 10 -66 6 -22" stroke="rgba(60,40,24,.5)" stroke-width="2" fill="none"/>`;
      let prop = '';
      if (b.prop === 'carrot') prop = carrot(-86, -36, -10, false);
      if (b.prop === 'leaf') {
        prop = `<path d="M-44 -30 C-40 -90 -30 -150 -22 -200" stroke="#4a7a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M-150 -196 C-110 -262 50 -262 100 -190 C40 -206 -80 -210 -150 -196Z" fill="#5a9a34"/>
          <path d="M-150 -196 C-60 -214 30 -210 100 -190" stroke="#3a6a22" stroke-width="3" fill="none"/>
          <path d="M-100 -220 L-80 -204 M-40 -236 L-30 -208 M20 -232 L10 -206 M64 -214 L50 -200" stroke="#7ab84a" stroke-width="2"/>`;
      }
      body = `<g transform="${lift}">
        <circle cx="66" cy="-36" r="17" fill="url(#${u}bt)"/>
        ${hind}
        <ellipse cx="22" cy="-54" rx="62" ry="50" fill="url(#${u}bb)"/>
        <ellipse cx="38" cy="-50" rx="34" ry="30" fill="rgba(255,232,198,.16)"/>
        ${fur}
        <ellipse cx="-30" cy="-64" rx="30" ry="40" fill="url(#${u}bc)"/>
        <path d="M-48 -44 C-52 -22 -52 -8 -46 -4 L-34 -4 C-32 -16 -34 -32 -36 -46Z" fill="#c09a74"/>
        <path d="M-34 -44 C-36 -22 -36 -8 -30 -4 L-20 -4 C-18 -16 -20 -32 -22 -46Z" fill="#d6b48c"/>
        <g transform="translate(-46 -110)">
          <g class="${u}ears">${earBack}</g>
          <ellipse cx="0" cy="0" rx="36" ry="30" fill="url(#${u}bb)"/>
          <g class="${u}ears" style="animation-delay:.15s">${earFront}</g>
          <ellipse cx="-10" cy="10" rx="22" ry="16" fill="rgba(246,232,210,.85)"/>
          <ellipse cx="-28" cy="8" rx="12" ry="10" fill="#efdcc2"/>
          <ellipse cx="-8" cy="-6" rx="8.4" ry="9.4" fill="#1a0f08"/>
          <ellipse cx="-8" cy="-6" rx="9.6" ry="10.6" fill="none" stroke="#e8d4b4" stroke-width="1.6"/>
          <circle cx="-11" cy="-9.5" r="2.8" fill="#fff"/><circle cx="-5" cy="-2" r="1.2" fill="#fff" opacity=".6"/>
          <ellipse class="${u}lid" cx="-8" cy="-6" rx="10.6" ry="11.6" fill="#a97f58"/>
          <path d="M-40 2 q4 -4 8 0 q-4 5 -8 0Z" fill="#c98078"/>
          <path d="M-36 6 q0 6 -4 8 M-36 6 q2 6 6 7" stroke="#6a4a3a" stroke-width="1.4" fill="none"/>
          <path d="M-34 4 L-70 -4 M-34 6 L-72 6 M-33 8 L-66 16 M-30 5 L-4 0" stroke="rgba(255,255,255,.75)" stroke-width=".9"/>
        </g>
        ${prop}
      </g>`;
    }
    let peek = '';
    if (pose === 'peek' || b.bush) {
      // the front of the bush he hides behind (daylight greens)
      peek = [[-80, -30, 46], [-30, -54, 54], [30, -48, 54], [80, -26, 44], [0, -10, 56]].map(([x, y, r], i) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}daylf${i % 3})"/>`).join('') +
        [[-50, -60], [20, -80], [60, -40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#d8283a"/>`).join('');
    }
    const tuft = [-30, -14, 4, 20].map((x, i) =>
      `<path d="M${x} 4 q${i % 2 ? 4 : -4} -14 ${i % 2 ? 8 : -6} -24" stroke="${['#6fa83a', '#87bd48', '#5d9a34', '#9ccc5a'][i]}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`).join('');
    const sc = b.k || 1;
    return `<g transform="translate(${b.x} ${b.y}) scale(${sc})"><g class="${u}bun">${shadow}<g filter="url(#${u}rim)"><g>${body}</g>${peek}</g>${pose === 'hop' ? '' : tuft}</g></g>`;
  }

  // Owl: a tawny owl, facing the reader, origin = its feet on the branch.
  // `lit`: 'moon' (cool rim light from the left) or 'dusk' (warm).
  function owl(u, o, lit) {
    const pose = o.pose || 'perch';
    const fr = rng(4242);
    let streaks = '';
    for (let i = 0; i < 26; i++) {
      const x = -28 + fr() * 56, y = -88 + fr() * 70;
      streaks += `<path d="M${n(x - 3)} ${n(y)} l3 5 l3 -5" stroke="#6a4626" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>`;
    }
    const scallop = side => {
      let s = '';
      for (let row = 0; row < 4; row++) {
        for (let k = 0; k < 3; k++) {
          const x = side * (40 + k * 7 - row * 2), y = -110 + row * 22 + k * 6;
          s += `<path d="M${x - 8} ${y} q8 9 16 0" stroke="#e2c69c" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`;
        }
      }
      return s;
    };
    const closed = pose === 'sleep';
    const eye = x => closed
      ? `<circle cx="${x}" cy="-136" r="15" fill="#c9a676"/><path d="M${x - 11} -136 q11 8 22 0" stroke="#2a1a0e" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="${x}" cy="-136" r="15.5" fill="#2a1a0e"/><circle cx="${x}" cy="-136" r="13.5" fill="url(#${u}oey)"/>
         <circle cx="${x}" cy="-135" r="7.5" fill="#120a04"/><circle cx="${x - 4.5}" cy="-140.5" r="3.6" fill="#fff"/><circle cx="${x + 4}" cy="-131" r="1.4" fill="#fff" opacity=".7"/>`;
    const lids = closed ? '' : `<ellipse class="${u}lid" cx="-22" cy="-136" rx="16.5" ry="16.5" fill="#7a5232"/><ellipse class="${u}lid" cx="22" cy="-136" rx="16.5" ry="16.5" fill="#7a5232"/>`;
    const head = `<g class="${u}ohead">
      <path d="M-50 -150 L-40 -186 L-26 -160Z" fill="#5a3a20"/><path d="M50 -150 L40 -186 L26 -160Z" fill="#5a3a20"/>
      <ellipse cx="0" cy="-138" rx="58" ry="48" fill="url(#${u}ob)"/>
      <circle cx="-22" cy="-136" r="27" fill="url(#${u}ofd)"/><circle cx="22" cy="-136" r="27" fill="url(#${u}ofd)"/>
      <path d="M-4 -160 C-12 -150 -12 -126 0 -112 C12 -126 12 -150 4 -160Z" fill="#a07a4e"/>
      ${eye(-22)}${eye(22)}
      <path d="M-7 -124 C-6 -112 0 -104 0 -104 C0 -104 6 -112 7 -124 C3 -128 -3 -128 -7 -124Z" fill="#d8b464"/>
      <path d="M-46 -172 C-30 -180 30 -180 46 -172" stroke="#3a2412" stroke-width="2" fill="none" opacity=".5"/>${lids}</g>`;
    let body;
    if (pose === 'fly') {
      const wing = side => `<path d="M${side * 30} -100 C${side * 90} -150 ${side * 150} -150 ${side * 196} -122
          L${side * 182} -110 L${side * 190} -96 L${side * 172} -88 L${side * 178} -72 L${side * 156} -68 L${side * 158} -52
          C${side * 110} -60 ${side * 60} -60 ${side * 30} -60Z" fill="url(#${u}ob)"/>
        <path d="M${side * 60} -104 C${side * 100} -126 ${side * 140} -126 ${side * 170} -112" stroke="#e2c69c" stroke-opacity=".5" stroke-width="2" fill="none"/>
        <path d="M${side * 70} -84 C${side * 100} -96 ${side * 130} -96 ${side * 160} -86" stroke="#e2c69c" stroke-opacity=".4" stroke-width="2" fill="none"/>`;
      body = `<g class="${u}flap">${wing(-1)}${wing(1)}</g>
        <path d="M0 -176 C52 -176 62 -96 50 -50 C42 -20 -42 -20 -50 -50 C-62 -96 -52 -176 0 -176Z" fill="url(#${u}ob)"/>
        <ellipse cx="0" cy="-62" rx="34" ry="34" fill="url(#${u}obl)"/>${streaks}
        <path d="M-12 -24 L-16 -6 M12 -24 L16 -6" stroke="#c8a860" stroke-width="5" stroke-linecap="round"/>
        ${head}`;
    } else {
      body = `
        <path d="M-18 -14 L-10 26 L10 26 L18 -14Z" fill="#4a3018"/>
        <path d="M0 -172 C62 -172 76 -90 62 -32 C52 6 -52 6 -62 -32 C-76 -90 -62 -172 0 -172Z" fill="url(#${u}ob)"/>
        <ellipse cx="0" cy="-52" rx="40" ry="48" fill="url(#${u}obl)"/>
        ${streaks}
        <path d="M-62 -108 C-82 -70 -72 -20 -48 -4 C-40 -40 -42 -84 -50 -112Z" fill="#5a3a20"/>
        <path d="M62 -108 C82 -70 72 -20 48 -4 C40 -40 42 -84 50 -112Z" fill="#5a3a20"/>
        ${scallop(-1)}${scallop(1)}
        ${head}
        <g fill="#c8a860" stroke="#5a4020" stroke-width="1">
          <path d="M-22 -4 C-24 4 -30 8 -30 10 L-24 8 L-20 12 L-16 8 L-10 10 C-12 4 -12 0 -12 -4Z"/>
          <path d="M22 -4 C24 4 30 8 30 10 L24 8 L20 12 L16 8 L10 10 C12 4 12 0 12 -4Z"/></g>`;
    }
    const light = lit === 'dusk'
      ? `<path d="M0 -186 C70 -186 86 -90 66 -30 C54 6 -54 6 -66 -30 C-86 -90 -70 -186 0 -186Z" fill="#ff9a4a" opacity=".12"/>`
      : `<path d="M0 -186 C70 -186 86 -90 66 -30 C54 6 -54 6 -66 -30 C-86 -90 -70 -186 0 -186Z" fill="url(#${u}orim)"/>`;
    const sc = o.k || 1;
    return `<g transform="translate(${o.x} ${o.y}) scale(${sc})"><g class="${u}owl">
      <g filter="url(#${u}rim)"><g>${body}</g>${pose === 'fly' ? '' : light}</g></g></g>`;
  }

  // embedded animations (live in every layer copy; each rule only matches
  // the parts present in that copy). Tap plays: Bunny hops, Owl bobs.
  function style(u) {
    return `<style>
      .${u}ff { animation: ${u}ff 2.6s ease-in-out infinite; }
      @keyframes ${u}ff { 0%,100% { opacity: .25; transform: translate(0,0); } 50% { opacity: 1; transform: translate(6px,-8px); } }
      .${u}tw { animation: ${u}tw 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes ${u}tw { 0%,100% { opacity: .3; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
      .${u}flut { animation: ${u}flut .32s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
      @keyframes ${u}flut { from { transform: scaleX(1); } to { transform: scaleX(.35); } }
      .${u}rain { animation: ${u}rain .7s linear infinite; }
      @keyframes ${u}rain { from { transform: translate(0,0); } to { transform: translate(-12px,60px); } }
      .${u}shoot { animation: ${u}shoot 3.2s ease-in infinite; }
      @keyframes ${u}shoot { 0%,40% { opacity: 0; transform: translate(0,0); } 55% { opacity: 1; } 80%,100% { opacity: 0; transform: translate(-180px,90px); } }
      .${u}flap { animation: ${u}flap 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 70%; }
      @keyframes ${u}flap { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.55); } }
      .${u}bun, .${u}owl { transform-box: fill-box; transform-origin: 50% 100%; }
      .${u}idle, .${u}bun, .${u}owl { transform-box: fill-box; transform-origin: 50% 100%; animation: ${u}breath 2.8s ease-in-out infinite; }
      @keyframes ${u}breath { 0%,100% { transform: none; } 50% { transform: scale(1.025,1.04); } }
      .${u}hover { animation: ${u}hover 1.9s ease-in-out infinite; }
      @keyframes ${u}hover { 0%,100% { transform: translate(0,0); } 50% { transform: translate(8px,-12px); } }
      .${u}flapw { transform-box: fill-box; transform-origin: 50% 50%; animation: ${u}flapw .45s ease-in-out infinite alternate; }
      @keyframes ${u}flapw { from { transform: scaleX(1); } to { transform: scaleX(.6); } }
      .${u}sway { transform-box: fill-box; transform-origin: 50% 100%; animation: ${u}sway 3.4s ease-in-out infinite; }
      @keyframes ${u}sway { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
      svg.is-playing .${u}idle, svg.is-playing .${u}still { transform-box: fill-box; transform-origin: 50% 100%; animation: ${u}hop 900ms cubic-bezier(.3,.7,.4,1); }
      svg.is-playing .${u}bun { animation: ${u}hop 900ms cubic-bezier(.3,.7,.4,1); }
      @keyframes ${u}hop { 0%,100% { transform: none; } 20% { transform: scale(1.06,.92); } 50% { transform: translateY(-60px) scale(.96,1.06); } 80% { transform: scale(1.04,.96); } }
      svg.is-playing .${u}owl { animation: ${u}bob 900ms ease-in-out; }
      /* small life everywhere: blinks, ears, head turns, tails, throats */
      .${u}lid { transform-box: fill-box; transform-origin: 50% 0%; transform: scaleY(0); animation: ${u}blink 5.2s infinite; }
      @keyframes ${u}blink { 0%,93%,100% { transform: scaleY(0); } 96% { transform: scaleY(1); } }
      .${u}ears { transform-box: fill-box; transform-origin: 50% 100%; animation: ${u}ear 4.6s ease-in-out infinite; }
      @keyframes ${u}ear { 0%,78%,100% { transform: none; } 84% { transform: rotate(-8deg); } 90% { transform: rotate(5deg); } }
      .${u}ohead { transform-box: fill-box; transform-origin: 50% 90%; animation: ${u}otilt 6.5s ease-in-out infinite; }
      @keyframes ${u}otilt { 0%,100% { transform: none; } 25%,40% { transform: rotate(-10deg); } 65%,80% { transform: rotate(7deg); } }
      .${u}tail { transform-box: fill-box; transform-origin: 0% 100%; animation: ${u}tail 2.4s ease-in-out infinite; }
      @keyframes ${u}tail { 0%,100% { transform: none; } 50% { transform: rotate(-7deg) scaleY(1.03); } }
      .${u}throat { transform-box: fill-box; transform-origin: 50% 0%; animation: ${u}throat 1.3s ease-in-out infinite; }
      @keyframes ${u}throat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.5,1.6); } }
      .${u}flame { transform-box: fill-box; transform-origin: 50% 100%; animation: ${u}flame .45s ease-in-out infinite alternate; }
      @keyframes ${u}flame { from { transform: rotate(-5deg); } to { transform: scale(.85,1.18) rotate(5deg); } }
      /* each animal's own idle */
      .${u}a-robin { transform-origin: 30% 100%; animation: ${u}peck 3.4s ease-in-out infinite; }
      @keyframes ${u}peck { 0%,66%,100% { transform: none; } 74% { transform: rotate(-24deg); } 80% { transform: none; } 87% { transform: rotate(-20deg); } }
      .${u}a-duck { animation: ${u}paddle 3s ease-in-out infinite; }
      @keyframes ${u}paddle { 0%,100% { transform: translateX(0) rotate(0); } 50% { transform: translateX(-10px) rotate(-2deg); } }
      .${u}a-snail { transform-origin: 80% 100%; animation: ${u}creep 4s ease-in-out infinite; }
      @keyframes ${u}creep { 0%,100% { transform: none; } 50% { transform: scaleX(1.07); } }
      .${u}a-hedgehog, .${u}a-badger { animation: ${u}sniff 2s ease-in-out infinite; }
      @keyframes ${u}sniff { 0%,60%,100% { transform: none; } 70% { transform: translateX(-3px) rotate(-2deg); } 80% { transform: translateX(-1px); } 90% { transform: translateX(-3px) rotate(-2deg); } }
      .${u}a-mouse { animation: ${u}nibble 1s ease-in-out infinite; }
      @keyframes ${u}nibble { 0%,100% { transform: none; } 50% { transform: scale(1.03,.97); } }
      .${u}a-frog { animation: ${u}breath 1.6s ease-in-out infinite; }
      /* each animal's own move when the scene is tapped */
      svg.is-playing .${u}a-frog { animation: ${u}frogjump 900ms cubic-bezier(.3,.7,.4,1); }
      @keyframes ${u}frogjump { 0%,100% { transform: none; } 15% { transform: scale(1.1,.8); } 50% { transform: translate(-40px,-80px) rotate(-12deg); } 85% { transform: scale(1.08,.9); } }
      svg.is-playing .${u}a-hedgehog { animation: ${u}curl 1s ease-in-out; }
      @keyframes ${u}curl { 0%,100% { transform: none; } 30%,60% { transform: scale(1.06,.72) rotate(-14deg); } }
      svg.is-playing .${u}a-duck { transform-origin: 30% 100%; animation: ${u}dip 1s ease-in-out; }
      @keyframes ${u}dip { 0%,100% { transform: none; } 35%,60% { transform: rotate(-38deg); } }
      svg.is-playing .${u}a-robin { animation: ${u}hops 900ms ease-out; }
      @keyframes ${u}hops { 0%,50%,100% { transform: none; } 25% { transform: translateY(-26px); } 75% { transform: translateY(-18px); } }
      svg.is-playing .${u}a-snail { animation: ${u}hide 1.2s ease-in-out; }
      @keyframes ${u}hide { 0%,100% { transform: none; } 30%,70% { transform: scaleX(.7); } }
      svg.is-playing .${u}a-badger { animation: ${u}trot 1s ease-in-out; }
      @keyframes ${u}trot { 0%,100% { transform: none; } 25% { transform: translateX(-24px) translateY(-6px); } 50% { transform: translateX(-30px); } 75% { transform: translateX(-12px) translateY(-6px); } }
      svg.is-playing .${u}a-squirrel { animation: ${u}hop 900ms cubic-bezier(.3,.7,.4,1); }
      svg.is-playing .${u}tail { animation: ${u}flick 900ms ease-in-out; }
      @keyframes ${u}flick { 0%,100% { transform: none; } 30% { transform: rotate(-20deg); } 60% { transform: rotate(10deg); } }
      svg.is-playing .${u}a-bat, svg.is-playing .${u}a-moth { animation: ${u}swoop 1.1s ease-in-out; }
      @keyframes ${u}swoop { 0%,100% { transform: none; } 30% { transform: translate(-60px,40px); } 65% { transform: translate(40px,-30px); } }
      svg.is-playing .${u}a-feather { animation: ${u}twirl 1s ease-in-out; }
      @keyframes ${u}twirl { 0%,100% { transform: none; } 30% { transform: rotate(-16deg); } 65% { transform: rotate(12deg); } }
      svg.is-playing .${u}a-cake, svg.is-playing .${u}a-gift { animation: ${u}wobble 800ms ease-in-out; }
      @keyframes ${u}wobble { 0%,100% { transform: none; } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
      svg.is-playing .${u}ears { animation: ${u}earflop 900ms ease-in-out; }
      @keyframes ${u}earflop { 0%,100% { transform: none; } 40% { transform: rotate(-18deg); } 70% { transform: rotate(10deg); } }
      svg.is-playing .${u}ohead { animation: ${u}oturn 1s ease-in-out; }
      @keyframes ${u}oturn { 0%,100% { transform: none; } 30% { transform: rotate(-28deg); } 70% { transform: rotate(24deg); } }
      @keyframes ${u}bob { 0%,100% { transform: none; } 25% { transform: rotate(-8deg); } 50% { transform: translateY(-14px); } 75% { transform: rotate(8deg); } }
      @media (prefers-reduced-motion: reduce) {
        .${u}ff, .${u}tw, .${u}flut, .${u}rain, .${u}shoot, .${u}flap, .${u}idle, .${u}bun, .${u}owl, .${u}hover, .${u}flapw, .${u}sway,
        .${u}lid, .${u}ears, .${u}ohead, .${u}tail, .${u}throat, .${u}flame, [class*="${u}a-"] { animation: none; }
      }
    </style>`;
  }

  function cloud(x, y, k, fill, op) {
    const puffs = [[0, 0, 46], [44, -16, 54], [96, -4, 44], [132, 10, 32], [-38, 12, 32], [60, 16, 40]];
    return `<g opacity="${op}">` + puffs.map(([dx, dy, r]) =>
      `<circle cx="${n(x + dx * k)}" cy="${n(y + dy * k)}" r="${n(r * k)}" fill="${fill}"/>`).join('') +
      `<ellipse cx="${n(x + 46 * k)}" cy="${n(y + 34 * k)}" rx="${n(120 * k)}" ry="${n(16 * k)}" fill="${fill}"/></g>`;
  }

  // per-page extras on each side (positions in scene units)
  function dayFx(u, kind) {
    let s = bird(1100, 330, 1.1) + bird(1160, 300, 0.8);
    if (kind === 'flowers') s += butterfly(u, 1150, 700, 1.2, '#f4a024', 0) + butterfly(u, 1340, 760, 1, '#5a8ae8', 0.12) + butterfly(u, 980, 660, 0.9, '#e86aa8', 0.2);
    else if (kind === 'rainbow') s += rainbow();
    else if (kind === 'puddle') { const [x, y] = toScene(1110, 640); s += [[-70, -30], [-40, -50], [50, -40], [80, -24]].map(([dx, dy]) => `<circle cx="${n(x + dx)}" cy="${n(y + dy)}" r="5" fill="#cfeaf8"/>`).join(''); }
    else if (kind === 'bushes') { const [x, y] = toScene(1290, 560); s += `<g transform="translate(${n(x + 60)} ${n(y - 90)})"><ellipse rx="9" ry="7" fill="#c8283a"/><circle cx="-7" cy="-1" r="4" fill="#1a1a1a"/><path d="M0 -7 V7" stroke="#1a1a1a" stroke-width="1.4"/><circle cx="3" cy="-2" r="1.6" fill="#1a1a1a"/><circle cx="4" cy="3" r="1.6" fill="#1a1a1a"/></g>`; }
    else if (kind !== 'rain') s += butterfly(u, 1250, 720, 0.9, '#f4c63a', 0);
    return s;
  }
  function nightFx(u, kind) {
    let s = twinkles(u, 5 + kind.length);
    if (kind === 'flowers') s += fireflies(u, 21, 24, [170, 600, 1260, 340]);
    else if (kind !== 'rain') s += fireflies(u, 13, 9, [170, 620, 1260, 300]);
    if (kind === 'rainbow') s += shootingStar(u);
    return s;
  }

  // ---- the cast: supporting animals and story items ---------------------
  // entry: { a: name, u, v (ground) | x, y (scene), k, flip, pose, opt }
  function drawOne(u, c, lit) {
    const A = window.DN_ANIMALS || {};
    if (A[c.a]) return A[c.a](u, c.opt || {});
    if (c.a === 'duck') return duck(0, 0);
    if (c.a === 'frog') return frog(0, 0);
    if (c.a === 'owl') return owl(u, { x: 0, y: 0, k: 1, pose: c.pose }, lit);
    if (c.a === 'bunny') return bunny(u, { x: 0, y: 0, k: 1, pose: c.pose, prop: c.prop });
    if (c.a === 'butterfly') return butterfly(u, 0, 0, 1, c.col || '#f4a024', 0);
    return '';
  }
  const FLIERS = { bat: 1, moth: 1, butterfly: 1 };
  const CAST_K = 1.35;   // supporting animals, a bit larger than life next to Bunny
  function castSVG(u, list, mode) {
    if (!list || !list.length) return '';
    let sh = '', art = '';
    list.forEach(c => {
      let x, y, s;
      if (c.x != null) { x = c.x; y = c.y; s = c.k || 1; }
      else { [x, y] = toScene(c.u, c.v); s = (c.k || 1) * depthK(c.v); }
      if (!FLIERS[c.a] && c.x == null) sh += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(44 * s * CAST_K)}" ry="${n(7 * s * CAST_K)}" fill="#1e140a" opacity=".28"/>`;
      s *= CAST_K;
      const motion = FLIERS[c.a] ? 'hover' : (c.a === 'feather' ? 'sway' : (c.a === 'cake' || c.a === 'gift') ? 'still' : 'idle');
      const delay = ((x * 7 + y * 3) % 2600) / 1000;
      art += `<g transform="translate(${n(x)} ${n(y)}) scale(${n(c.flip ? -s : s)} ${n(s)})"><g class="${u}${motion} ${u}a-${c.a}" style="animation-delay:${delay.toFixed(2)}s">` +
        `${FLIERS[c.a] ? `<g class="${u}flapw">` : ''}${drawOne(u, c, mode === 'night' ? 'moon' : 'dusk')}${FLIERS[c.a] ? '</g>' : ''}</g></g>`;
    });
    return sh + `<g filter="url(#${u}${mode === 'night' ? 'rimN' : 'rim'})">${art}</g>`;
  }

  function bunnyAt(b) {
    const gu = b.u == null ? 1030 : b.u, gv = b.v == null ? 520 : b.v;
    const [x, y] = toScene(gu, gv);
    return Object.assign({}, b, { x: n(x), y: n(y), k: n((b.k || 1.15) * depthK(gv)) });
  }

  // taps on the outer strips (left / right ~12%) turn the page; the rest
  // of the scene plays its animation
  const HIT = '190 60 1220 940';

  // ---- spacing: nothing overlaps, everything stands on open ground ------
  // Footprints (scene units at scale 1, origin = bottom centre). Each page's
  // hand-picked spots are only a starting point: this pass pushes pieces
  // sideways until no two overlap and none stands on the trunk, a bush, the
  // carrot bed, the burrow, a reed or (for land animals) in the pond. The
  // feather clue is placed first against the scenery only, so it lands on
  // the same spot in both halves; then the animals settle around it.
  const SIZE = { bunny: [180, 230], owl: [150, 195], hedgehog: [190, 75], squirrel: [160, 175], robin: [95, 65],
    snail: [105, 62], badger: [210, 90], mouse: [100, 72], duck: [115, 58], frog: [75, 38], feather: [40, 104],
    cake: [125, 135], gift: [85, 85] };
  const SWIMS = { duck: 1, frog: 1, feather: 1 };   // the feather may float on the pond
  function scenery(kind) {
    const o = [{ u: 800, v: 450, w: 240, h: 230, s: 1 }];            // the trunk and roots
    const add = (u, v, w, h, k) => o.push({ u, v, w, h, s: k || 1 });
    if (kind === 'carrots') add(330, 590, 330, 70, 1.1);
    if (kind === 'bushes') { add(330, 560, 250, 140, 1.15); add(1290, 560, 250, 140, 1.2); }
    if (kind === 'burrow') add(1000, 470, 270, 110);
    if (kind === 'pond') { add(470, 630, 40, 130); add(1140, 630, 40, 130); o.push({ pond: true }); }
    return o;
  }
  function boxOf(it) {
    const [x, y] = toScene(it.u, it.v);
    const sc = it.s * depthK(it.v);
    return { x0: x - it.w * sc / 2, x1: x + it.w * sc / 2, y0: y - it.h * sc, y1: y };
  }
  const inPond = it => it.v > 540 && it.v < 730 && it.u > 450 && it.u < 1150;
  // the grass strip along the near edge hides anything standing nearer than
  // this, so pieces are kept just behind it
  const MAX_V = 600;
  const LIFT = 90;        // every character stands this much further back
  function settle(items, obst) {
    const GAP = 14;
    items.forEach(it => {
      if (!it.lifted) { it.v = Math.max(Math.min(it.v, 470), it.v - LIFT); it.lifted = true; }
      const m = SWIMS[it.a] ? 650 : MAX_V; if (it.v > m) it.v = m;
    });
    for (let iter = 0; iter < 120; iter++) {
      let moved = false;
      const depth = (it, dv) => {
        if (it.fixed || !dv) return;
        const m = SWIMS[it.a] ? 650 : MAX_V;
        const nv = Math.max(440, Math.min(m, it.v + dv));
        if (nv !== it.v) { it.v = nv; moved = true; }
      };
      const push = (it, dx) => {
        if (it.fixed || !dx) return;
        it.u = Math.max(150, Math.min(1450, it.u + dx / depthK(it.v)));
        moved = true;
      };
      for (let i = 0; i < items.length; i++) {
        const A = items[i], a = boxOf(A);
        for (let j = i + 1; j < items.length; j++) {
          const B = items[j], b = boxOf(B);
          const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + GAP;
          const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) + GAP;
          if (ox <= GAP || oy <= GAP) continue;
          const share = A.fixed ? 0 : B.fixed ? 1 : 0.5;
          // after a while sideways pushing hasn't worked (no room between
          // the trunk / scenery), so step them apart in depth instead
          if (iter > 40 && oy < ox * 1.5) {
            const nearer = a.y1 > b.y1 ? A : B, farther = nearer === A ? B : A;
            const sh = nearer === A ? share : 1 - share;
            depth(nearer, oy * sh / 0.6); depth(farther, -oy * (1 - sh) / 0.6);
            continue;
          }
          const dir = (a.x0 + a.x1) < (b.x0 + b.x1) ? -1 : 1;
          push(A, dir * ox * share);
          push(B, -dir * ox * (1 - share));
        }
        obst.forEach(O => {
          if (O.pond) {
            if (!SWIMS[A.a] && inPond(A)) push(A, (A.u < 800 ? 450 - 30 - A.u : 1150 + 30 - A.u) * depthK(A.v));
            return;
          }
          const o = boxOf(O), c = boxOf(A);
          const ox = Math.min(c.x1, o.x1) - Math.max(c.x0, o.x0) + GAP;
          const oy = Math.min(c.y1, o.y1) - Math.max(c.y0, o.y0);
          if (ox > 0 && oy > 0) push(A, ((c.x0 + c.x1) < (o.x0 + o.x1) ? -1 : 1) * ox);
        });
      }
      if (!moved) break;
    }
  }
  // turn a page's cast lists into spaced-out copies (the page data is untouched)
  function spaced(cfg, kind, nightCast) {
    const obst = scenery(kind);
    const item = (c, scale) => {
      const sz = SIZE[c.a];
      return sz && c.x == null ? Object.assign({ ref: c, a: c.a, u: c.u, v: c.v, w: sz[0], h: sz[1], s: scale }) : null;
    };
    // the clues first, against the scenery only (same result both halves)
    const clues = {};
    (cfg.dayCast || []).concat(nightCast).filter(c => c.a === 'feather' && c.x == null).forEach(c => {
      const key = c.u + ',' + c.v;
      if (!clues[key]) {
        // Bunny's spot counts as scenery here, so the clue lands beside him
        // (the same spot in both halves), never under him
        const hb = Object.assign({ u: 1030, v: 520 }, cfg.bunny || {});
        const hv = Math.max(Math.min(hb.v, 470), hb.v - LIFT);
        const heroBox = { u: hb.u, v: hv, w: SIZE.bunny[0] + 30, h: SIZE.bunny[1], s: hb.k || 1.15 };
        const it = item(c, (c.k || 1) * CAST_K);
        settle([it], obst.concat([heroBox]));
        clues[key] = [it.u, it.v];
      }
    });
    const side = (list, hero) => {
      const out = list.map(c => Object.assign({}, c));
      const items = [];
      out.forEach(c => {
        let liftedClue = false;
        if (c.a === 'feather' && c.x == null) { [c.u, c.v] = clues[c.u + ',' + c.v]; liftedClue = true; }
        const it = item(c, (c.k || 1) * CAST_K);
        if (it) { it.ref = c; if (c.a === 'feather') it.fixed = true; if (liftedClue) it.lifted = true; items.push(it); }
      });
      if (hero) {
        const sz = SIZE[hero.a];
        const it = { ref: hero.c, a: hero.a, u: hero.c.u, v: hero.c.v, w: sz[0], h: sz[1], s: hero.s, fixed: hero.fixed };
        items.push(it);
      }
      settle(items, obst);   // a fixed piece (the peeking Bunny) never moves
      items.forEach(it => { it.ref.u = it.u; it.ref.v = it.v; });
      return out;
    };
    const b = Object.assign({ u: 1030, v: 520 }, cfg.bunny || {});
    const day = side(cfg.dayCast || [], { a: 'bunny', c: b, s: b.k || 1.15, fixed: b.pose === 'peek' });
    const night = side(nightCast, null);
    return { day, night, bunny: b };
  }

  function buildDayNight(cfg) {
    const u = 'dn' + (UID++) + '_';
    const kind = cfg.place || 'meadow';
    const L = popLayout(1000 + (cfg.page || 0) * 17);
    const dSky = cfg.daySky || (kind === 'rain' ? 'rain' : 'clear');
    const nSky = 'n' + (cfg.nightSky || (kind === 'rain' ? 'rain' : 'clear'));
    const twin = (key, fn) => `<g data-part="dn-d-${key}">${fn('day')}</g><g data-part="dn-n-${key}">${fn('night')}</g>`;
    const owlCfg = cfg.owl || {};
    const owlOnBranch = !owlCfg.ground;
    const nightCast0 = (cfg.nightCast || []).concat(owlOnBranch ? [] : [Object.assign({ a: 'owl', k: 0.6 }, owlCfg)]);
    const S = spaced(cfg, kind, nightCast0);
    const nightCast = S.night;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-floor="${FLOOR}" data-dn-page="${cfg.page}" data-hit="${HIT}">
      <defs>${sharedDefs(u)}${popDefs(u)}${window.dnAnimalDefs ? window.dnAnimalDefs(u) : ''}${defs(u, dSky, 'day')}${defs(u, nSky, 'night')}
        <linearGradient id="${u}trail" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffbe0"/><stop offset="100%" stop-color="#fffbe0" stop-opacity="0"/></linearGradient>
      </defs>
      ${style(u)}
      ${twin('hill', m => skyCard(u, m, m === 'day' ? dSky : nSky, L) + hillStrip(u, m, kind))}
      ${twin('tree', m => oakBack(u, m, L) + oakFront(u, m, L, cfg.garland) +
        (m === 'night' && owlOnBranch ? owl(u, Object.assign({ x: 600, y: 630, k: 0.85 }, owlCfg), 'moon') : ''))}
      <g data-part="dn-d-cast">${props(u, 'day', kind)}${castSVG(u, S.day, 'day')}${bunny(u, bunnyAt(S.bunny))}</g>
      <g data-part="dn-n-cast">${props(u, 'night', kind)}${castSVG(u, nightCast, 'night')}</g>
      <g data-part="dn-d-fx">${dayFx(u, kind)}</g>
      <g data-part="dn-n-fx">${nightFx(u, kind)}</g>
      ${twin('front', m => grassStrip(m, L))}
    </svg>`;
  }
  function groundDayNight(cfg) {
    const u = 'dg' + (UID++) + '_';
    const L = popLayout(1000 + (cfg.page || 0) * 17);
    const kind = cfg.place || 'meadow';
    return `<div class="dn-g dn-g-day">${groundSVG(u, 'day', kind, L)}</div>` +
      `<div class="dn-g dn-g-night">${groundSVG(u, 'night', kind, L)}</div>`;
  }

  // the finale: sunset birthday party under the big tree. Every animal from
  // both stories, the cake the night friends made, Owl's present, the paper
  // stars in the tree; no slider.
  function buildDusk() {
    const u = 'dn' + (UID++) + '_';
    const L = popLayout(4321);
    const [sx, sy] = toScene(800, 600);
    const k = depthK(600);
    const stumpSil = '<path d="M-70 0 V-44 C-70 -56 70 -56 70 -44 V0Z"/>';
    const stumpArt = `<path d="M-70 0 V-44 C-70 -56 70 -56 70 -44 V0 C40 6 -40 6 -70 0Z" fill="#6a4228"/>
      <ellipse cx="0" cy="-46" rx="70" ry="12" fill="#c89a62"/><ellipse cx="0" cy="-46" rx="46" ry="7" fill="none" stroke="#a8784a" stroke-width="2"/>
      <ellipse cx="0" cy="-46" rx="22" ry="3.4" fill="none" stroke="#a8784a" stroke-width="2"/>
      <path d="M-50 -30 V-4 M-20 -36 V0 M30 -34 V-2" stroke="#3e2616" stroke-width="2" opacity=".5"/>`;
    // spread across both pages: night friends to the left of the stump,
    // day friends to the right, a back row and a front row
    const cast = [
      { a: 'badger', u: 230, v: 560, k: 0.85, flip: true },
      { a: 'owl', u: 560, v: 560, k: 0.6 },
      { a: 'hedgehog', u: 380, v: 680, k: 0.8, flip: true },
      { a: 'gift', u: 640, v: 690, k: 0.85 },
      { a: 'mouse', u: 520, v: 740, k: 0.75, flip: true },
      { a: 'frog', u: 230, v: 720, k: 0.9, flip: true },
      { a: 'squirrel', u: 1170, v: 560, k: 0.8 },
      { a: 'duck', u: 1400, v: 590, k: 0.85 },
      { a: 'robin', u: 1060, v: 720, k: 0.85 },
      { a: 'snail', u: 1290, v: 730, k: 0.85 },
      { a: 'bat', x: 560, y: 470, k: 0.7 },
      { a: 'moth', x: 1050, y: 460, k: 0.7 }
    ];
    const bunnyC = { u: 960, v: 620 };
    {
      // same no-overlap pass as the slider pages; the stump with the cake
      // and the trunk are scenery
      const items = cast.filter(c => SIZE[c.a] && c.x == null).map(c =>
        ({ ref: c, a: c.a, u: c.u, v: c.v, w: SIZE[c.a][0], h: SIZE[c.a][1], s: (c.k || 1) * CAST_K }));
      items.push({ ref: bunnyC, a: 'bunny', u: bunnyC.u, v: bunnyC.v, w: SIZE.bunny[0], h: SIZE.bunny[1], s: 1.15 });
      settle(items, [{ u: 800, v: 450, w: 240, h: 230, s: 1 }, { u: 800, v: 600, w: 170, h: 230, s: 1 }]);
      items.forEach(it => { it.ref.u = it.u; it.ref.v = it.v; });
    }
    const b = bunnyAt(bunnyC);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-floor="${FLOOR}" data-dn-page="10" data-dn-still="" data-hit="${HIT}">
      <defs>${sharedDefs(u)}${popDefs(u)}${window.dnAnimalDefs ? window.dnAnimalDefs(u) : ''}${defs(u, 'dusk', 'dusk')}</defs>
      ${style(u)}
      <g data-part="dn-k-hill">${skyCard(u, 'dusk', 'dusk', L)}${hillStrip(u, 'dusk', 'meadow')}</g>
      <g data-part="dn-k-tree">${oakBack(u, 'dusk', L)}${oakFront(u, 'dusk', L, 'lit')}</g>
      <g data-part="dn-k-cast">
        <g transform="translate(${n(sx)} ${n(sy)}) scale(${n(k)})">${cut(stumpSil, stumpArt, [0, 0, 80])}
          <g filter="url(#${u}rim)" transform="translate(0 -48)">${window.DN_ANIMALS ? window.DN_ANIMALS.cake(u, { lit: true }) : ''}</g></g>
        ${castSVG(u, cast, 'dusk')}
        ${bunny(u, b)}
      </g>
      <g data-part="dn-k-fx">${fireflies(u, 99, 16, [170, 560, 1260, 360])}${twinkles(u, 8)}${butterfly(u, 1000, 640, 0.9, '#f4a024', 0)}${butterfly(u, 560, 660, 0.8, '#5a8ae8', 0.15)}</g>
      <g data-part="dn-k-front">${grassStrip('dusk', L)}</g>
    </svg>`;
  }
  function groundDusk() {
    const u = 'dg' + (UID++) + '_';
    return `<div class="dn-g">${groundSVG(u, 'dusk', 'meadow', popLayout(4321))}</div>`;
  }

  window.buildDayNight = buildDayNight;
  window.groundDayNight = groundDayNight;
  window.buildDusk = buildDusk;
  window.groundDusk = groundDusk;
})();
