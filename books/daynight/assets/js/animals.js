// Bunny Day, Owl Night: the supporting cast and story items.
//
// Every drawing sits at its origin = where it touches the ground (or, for
// fliers, its body centre), faces LEFT, and is about life size next to
// Bunny (scene.js scales and places it). Colours come from the gradients in
// animalDefs(u). scene.js wraps a whole cast in one paper-rim filter.
//   DN_ANIMALS.<name>(u, opt) -> SVG string
(function () {
  'use strict';
  const n = v => (Math.round(v * 10) / 10);
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }
  const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#120a06"/><circle cx="${n(x - r * 0.35)}" cy="${n(y - r * 0.35)}" r="${n(r * 0.36)}" fill="#fff"/>`;

  function animalDefs(u) {
    const rg = (id, a, b, c, cx, cy) => `<radialGradient id="${u}${id}" cx="${cx || 0.4}" cy="${cy || 0.3}" r="0.8">
      <stop offset="0%" stop-color="${a}"/><stop offset="55%" stop-color="${b}"/><stop offset="100%" stop-color="${c}"/></radialGradient>`;
    return rg('hgB', '#9a7a52', '#6a5034', '#3a2a1a') + rg('hgF', '#e6cba2', '#c9a47a', '#9a7650') +
      rg('sqB', '#e08a44', '#c0602a', '#7e3412') + rg('sqT', '#e8904a', '#b8582a', '#6a2a10', 0.6, 0.3) +
      rg('sqW', '#fbf0de', '#f0dcc0', '#d6b890') + rg('rbB', '#9a8a64', '#72623e', '#4a3e24') +
      rg('rbR', '#ffa060', '#e8642a', '#b0401a') + rg('snS', '#e8c27a', '#c08a44', '#7a4a1e', 0.35, 0.3) +
      rg('snB', '#d8ccb4', '#b4a68a', '#7a6c54') + rg('btB', '#7a5a4a', '#4a3430', '#24181a') +
      rg('btW', '#5a4448', '#3a2a30', '#1e1418') + rg('bdB', '#a8a8a6', '#7a7a78', '#4a4a48') +
      rg('mtW', '#fff6e0', '#e8dcbe', '#b8a888') + rg('msB', '#b8b0a4', '#948a80', '#5e564e') +
      rg('ckC', '#fffaf0', '#f4e6cc', '#d8c4a0', 0.4, 0.2) + rg('ckS', '#f6c48a', '#d89a5a', '#a86a34') +
      rg('gfB', '#5a8ae8', '#3a64c8', '#1e3a8a') +
      `<linearGradient id="${u}fth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e8d4"/><stop offset=".6" stop-color="#c9a476"/><stop offset="1" stop-color="#8a6440"/></linearGradient>`;
  }

  // Hedgehog: a dome of spines (dark roots, pale tips), a tan pointed face
  function hedgehog(u, o) {
    const r = rng(17);
    let sp = '';
    for (let i = 0; i < 90; i++) {
      const a = Math.PI * (1.02 + r() * 0.96);
      const rad = 30 + r() * 26;
      const x0 = 8 + Math.cos(a) * rad * 0.8, y0 = -18 + Math.sin(a) * rad * 0.6;
      const len = 14 + r() * 10;
      const x1 = x0 + Math.cos(a - 0.35) * len, y1 = y0 + Math.sin(a - 0.35) * len;
      sp += `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}" stroke="#2e2014" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M${n((x0 + x1 * 2) / 3)} ${n((y0 + y1 * 2) / 3)}L${n(x1)} ${n(y1)}" stroke="#e6d6b4" stroke-width="2" stroke-linecap="round"/>`;
    }
    // a carrot carried on its back, stuck in the spines (clear of the face)
    const carry = o && o.carrot
      ? `<g transform="translate(14 -66) rotate(14)"><path d="M-30 -5 C-14 -7 16 -3 30 0 C16 3 -14 7 -30 5Z" fill="#f07a1e"/>
         <path d="M-20 -3 h4 M-6 -4 h3 M8 -2 h3" stroke="#c85a10" stroke-width="1.4"/>
         <path d="M-30 -2 q-12 -14 -20 -16 M-30 0 q-16 -4 -24 -2 M-30 2 q-12 8 -18 14" stroke="#4e9a2c" stroke-width="3" fill="none" stroke-linecap="round"/></g>` : '';
    // face: a fur-covered pointed snout (not a cone), pale cheek, dark
    // mask round a bright round eye, small round ear, glossy wet nose
    let fur = '';
    for (let i = 0; i < 22; i++) {
      const t = r(), x = -76 + t * 44, y = -20 + r() * 18 + t * -4;
      fur += `<path d="M${n(x)} ${n(y)}l${n(4 + r() * 3)} ${n(1 + r() * 2)}" stroke="${i % 2 ? '#b08a62' : '#e8d2ae'}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`;
    }
    return `<ellipse cx="-30" cy="-2" rx="8" ry="5" fill="#3a2a1a"/><ellipse cx="34" cy="-2" rx="8" ry="5" fill="#3a2a1a"/>
      <path d="M-52 0 C-58 -40 -20 -66 20 -64 C58 -60 70 -26 62 0Z" fill="url(#${u}hgB)"/>${sp}
      <path d="M-26 -40 C-48 -40 -66 -30 -80 -18 C-88 -12 -92 -6 -88 -2 C-80 2 -62 4 -46 4 C-34 4 -24 -2 -20 -12 C-18 -24 -20 -34 -26 -40Z" fill="url(#${u}hgF)"/>
      <path d="M-46 4 C-34 4 -24 -2 -20 -12 C-28 -6 -40 -2 -56 -2Z" fill="#9a7650" opacity=".6"/>
      ${fur}
      <ellipse cx="-50" cy="-20" rx="11" ry="8" fill="#6a4a30" opacity=".55"/>
      <circle cx="-50" cy="-21" r="5" fill="#120a06"/><circle cx="-52" cy="-23" r="1.8" fill="#fff"/><circle cx="-48.4" cy="-19.4" r=".8" fill="#fff" opacity=".6"/>
      <path d="M-30 -36 C-32 -46 -20 -48 -20 -38Z" fill="#b08a62"/><path d="M-28 -38 C-29 -44 -22 -45 -22 -39Z" fill="#7a5a3a"/>
      <ellipse cx="-89" cy="-6" rx="5.4" ry="4.4" fill="#1a1010"/><ellipse cx="-90.6" cy="-7.6" rx="1.8" ry="1.2" fill="#fff" opacity=".7"/>
      <path d="M-86 -2 Q-78 2 -70 1" stroke="#6a4a30" stroke-width="1.2" fill="none"/>
      <path d="M-84 -6 L-100 -12 M-84 -4 L-101 -4 M-84 -2 L-98 4" stroke="#f4ead8" stroke-width=".7" opacity=".7"/>${carry}`;
  }

  // Red squirrel, sitting up, paws at the chest
  function squirrel(u, o) {
    const r = rng(23);
    let tuft = '';
    for (let i = 0; i < 30; i++) {
      const t = r();
      const x = 40 + Math.sin(t * 5) * 30, y = -10 - t * 130;
      tuft += `<path d="M${n(x)} ${n(y)}l${n(8 + r() * 8)} ${n(-4 + r() * 8)}" stroke="#f0a060" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    }
    // both front paws held together at the chest, as squirrels sit
    const arm = `<path d="M-16 -54 C-26 -46 -28 -38 -24 -32" stroke="#b4562a" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M-6 -54 C-14 -46 -18 -38 -16 -32" stroke="#a24e26" stroke-width="7" stroke-linecap="round" fill="none"/>
      <ellipse cx="-22" cy="-30" rx="5" ry="4" fill="#9a4a24"/>`;
    return `<g class="${u}tail"><path d="M18 0 C70 -6 92 -64 64 -110 C46 -140 70 -168 96 -154 C126 -120 118 -36 64 4Z" fill="url(#${u}sqT)"/>${tuft}</g>
      <ellipse cx="2" cy="-36" rx="30" ry="38" fill="url(#${u}sqB)"/>
      <ellipse cx="-10" cy="-34" rx="15" ry="26" fill="url(#${u}sqW)"/>
      <ellipse cx="14" cy="-8" rx="22" ry="10" fill="#9a4a24"/><ellipse cx="-14" cy="-3" rx="16" ry="5" fill="#8a4020"/>
      <circle cx="-14" cy="-84" r="22" fill="url(#${u}sqB)"/>
      <path d="M-24 -100 L-30 -128 L-12 -104Z" fill="#b4562a"/><path d="M-2 -100 L2 -130 L10 -102Z" fill="#a4502a"/>
      <path d="M-30 -126 l-2 -8 M2 -128 l2 -8" stroke="#c86a3a" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="-24" cy="-76" rx="12" ry="9" fill="url(#${u}sqW)"/>
      ${eye(-20, -88, 4.2)}<ellipse class="${u}lid" cx="-20" cy="-88" rx="5.4" ry="5.4" fill="#c0602a"/><circle cx="-36" cy="-80" r="3" fill="#3a1a10"/>
      ${arm}`;
  }

  // Robin on the ground: olive back, orange breast
  function robin(u) {
    return `<path d="M-2 -2 l-4 -14 M8 -2 l2 -14" stroke="#8a6a4a" stroke-width="2.2"/>
      <path d="M20 -26 L46 -34 L44 -22Z" fill="#5a4a2e"/>
      <ellipse cx="4" cy="-28" rx="28" ry="20" fill="url(#${u}rbB)"/>
      <ellipse cx="-10" cy="-28" rx="17" ry="16" fill="url(#${u}rbR)"/>
      <circle cx="-14" cy="-48" r="14" fill="url(#${u}rbB)"/>
      <path d="M-24 -50 C-28 -40 -20 -34 -10 -36 C-16 -40 -20 -46 -18 -52Z" fill="url(#${u}rbR)"/>
      <path d="M-28 -50 L-40 -48 L-28 -45Z" fill="#3a2a1a"/>${eye(-18, -52, 2.8)}
      <path d="M6 -40 C20 -38 28 -30 30 -22" stroke="#4a3e24" stroke-width="2" fill="none" opacity=".6"/>`;
  }

  // Garden snail: a spiral shell on a long pale foot
  function snail(u) {
    return `<path d="M-46 0 C-50 -10 -44 -16 -34 -16 L30 -12 C40 -10 42 0 34 0Z" fill="url(#${u}snB)"/>
      <path d="M-40 -14 C-46 -30 -48 -40 -50 -44 M-34 -15 C-36 -30 -36 -40 -36 -46" stroke="#a89a7e" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      <circle cx="-50" cy="-45" r="3" fill="#4a3a2a"/><circle cx="-36" cy="-47" r="3" fill="#4a3a2a"/>
      <circle cx="6" cy="-34" r="26" fill="url(#${u}snS)"/>
      <path d="M6 -34 m0 -4 a4 4 0 1 1 -4 6 a9 9 0 1 1 13 -12 a15 15 0 1 1 -22 18 a21 21 0 1 1 30 -26" stroke="#6a3a14" stroke-width="2.4" fill="none" opacity=".7"/>
      <path d="M-14 -48 C-4 -58 16 -58 26 -48" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>
      ${eye(-42, -12, 0)}<path d="M-44 -6 q4 3 8 0" stroke="#7a6c54" stroke-width="1.4" fill="none"/>`;
  }

  // Bat in flight (origin = body centre)
  function bat(u) {
    const wing = s => `<path d="M${s * 10} -6 C${s * 30} -34 ${s * 70} -40 ${s * 96} -26 C${s * 86} -14 ${s * 80} -4 ${s * 84} 8
        C${s * 70} 0 ${s * 60} 4 ${s * 58} 14 C${s * 46} 6 ${s * 34} 8 ${s * 30} 16 C${s * 22} 6 ${s * 14} 6 ${s * 10} 8Z" fill="url(#${u}btW)"/>
      <path d="M${s * 12} -4 L${s * 96} -26 M${s * 20} 0 L${s * 84} 8 M${s * 20} 2 L${s * 58} 14" stroke="#6a5458" stroke-width="1.4" opacity=".7"/>`;
    return `${wing(-1)}${wing(1)}
      <ellipse cx="0" cy="2" rx="14" ry="20" fill="url(#${u}btB)"/>
      <path d="M-10 -14 L-12 -30 L-2 -18Z M10 -14 L12 -30 L2 -18Z" fill="#4a3430"/>
      <circle cx="0" cy="-12" r="11" fill="url(#${u}btB)"/>
      <circle cx="-4" cy="-13" r="2.4" fill="#fff6c8"/><circle cx="4" cy="-13" r="2.4" fill="#fff6c8"/>
      <circle cx="-4" cy="-13" r="1.2" fill="#120a06"/><circle cx="4" cy="-13" r="1.2" fill="#120a06"/>
      <path d="M-3 -6 q3 3 6 0" stroke="#e8a0a0" stroke-width="1.4" fill="none"/>`;
  }

  // Badger: grey body, black legs, the striped black-and-white face
  function badger(u, o) {
    const basket = o && o.basket
      ? `<g transform="translate(-92 0)"><path d="M-26 -26 H26 L20 0 H-20Z" fill="#a8783a"/>
         <path d="M-26 -26 H26 M-22 -16 H22 M-20 -6 H20" stroke="#7a5022" stroke-width="2"/>
         <path d="M-20 -26 C-20 -52 20 -52 20 -26" stroke="#7a5022" stroke-width="4" fill="none"/>
         ${[[-14, -30], [-4, -32], [6, -31], [14, -29], [0, -36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#7a1a3a"/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.4" fill="#fff" opacity=".6"/>`).join('')}</g>` : '';
    const r = rng(41);
    let fur = '';
    for (let i = 0; i < 40; i++) fur += `<path d="M${n(-30 + r() * 100)} ${n(-70 + r() * 50)}l${n(6 + r() * 6)} 3" stroke="#d8d8d4" stroke-width="1.4" opacity=".45"/>`;
    return `<path d="M-28 -18 L-30 0 L-16 0 L-14 -18Z M44 -18 L46 0 L60 0 L58 -18Z" fill="#1e1e1e"/>
      <path d="M-40 -30 C-40 -70 10 -80 50 -72 C84 -66 92 -40 80 -20 C60 -10 -20 -10 -40 -30Z" fill="url(#${u}bdB)"/>${fur}
      <path d="M78 -40 C92 -40 100 -32 98 -24" stroke="#5a5a58" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M-34 -24 L-38 0 L-24 0 L-20 -22Z" fill="#141414"/>
      <path d="M-30 -60 C-50 -66 -74 -50 -88 -30 C-80 -24 -50 -22 -30 -30Z" fill="#f4f2ec"/>
      <path d="M-36 -58 C-52 -60 -66 -48 -78 -34 C-70 -32 -60 -40 -40 -48Z" fill="#141414"/>
      <path d="M-34 -36 C-50 -34 -66 -32 -80 -30 C-70 -26 -50 -26 -32 -30Z" fill="#141414" opacity=".9"/>
      <path d="M-30 -62 C-26 -70 -18 -70 -16 -62Z" fill="#f4f2ec"/>
      <circle cx="-90" cy="-30" r="5" fill="#141414"/>${eye(-60, -44, 3)}${basket}`;
  }

  // Moth in flight (origin = body centre)
  function moth(u) {
    return `<path d="M0 0 C-14 -30 -50 -34 -56 -14 C-58 0 -30 6 0 4Z" fill="url(#${u}mtW)"/>
      <path d="M0 0 C14 -30 50 -34 56 -14 C58 0 30 6 0 4Z" fill="url(#${u}mtW)"/>
      <path d="M0 4 C-12 14 -34 24 -38 16 C-34 6 -14 4 0 4Z M0 4 C12 14 34 24 38 16 C34 6 14 4 0 4Z" fill="#d8caa6"/>
      <circle cx="-30" cy="-14" r="5" fill="#a89070" opacity=".7"/><circle cx="30" cy="-14" r="5" fill="#a89070" opacity=".7"/>
      <ellipse cx="0" cy="2" rx="4" ry="12" fill="#8a7a5a"/>
      <path d="M-2 -10 C-8 -22 -14 -26 -18 -26 M2 -10 C8 -22 14 -26 18 -26" stroke="#8a7a5a" stroke-width="1.4" fill="none"/>`;
  }

  // Wood mouse (awake), sitting up
  function mouse(u, o) {
    const plates = o && o.plates
      ? `<g transform="translate(-62 0)">${[0, 1, 2].map(i => `<ellipse cx="0" cy="${-4 - i * 6}" rx="22" ry="6" fill="#f4f0e6" stroke="#c8c0b0" stroke-width="1.2"/>`).join('')}</g>` : '';
    return `${plates}<path d="M20 -6 C46 -2 58 -16 64 -30" stroke="#a89a8e" stroke-width="2.4" fill="none"/>
      <ellipse cx="6" cy="-20" rx="22" ry="22" fill="url(#${u}msB)"/>
      <ellipse cx="-2" cy="-16" rx="11" ry="15" fill="#efe6da"/>
      <circle cx="-12" cy="-46" r="14" fill="url(#${u}msB)"/>
      <circle cx="-4" cy="-62" r="10" fill="#b0a69a"/><circle cx="-4" cy="-62" r="6" fill="#e0a8b4"/>
      <circle cx="-22" cy="-60" r="8" fill="#b0a69a"/><circle cx="-22" cy="-60" r="4.6" fill="#e0a8b4"/>
      ${eye(-18, -48, 3.2)}<circle cx="-28" cy="-42" r="2.4" fill="#c48a9a"/>
      <path d="M-26 -42 L-44 -46 M-26 -41 L-44 -40" stroke="#fff" stroke-width=".8" opacity=".7"/>
      <ellipse cx="-12" cy="-2" rx="8" ry="3" fill="#d8b8b0"/>`;
  }

  // ---- items ---------------------------------------------------------
  // Owl's clue: a barred tawny feather stuck in the ground, red ribbon bow
  function feather(u) {
    let bars = '';
    for (let i = 0; i < 6; i++) bars += `<path d="M${-11 + i * 0.6} ${-22 - i * 13} Q0 ${-26 - i * 13} ${11 - i * 0.8} ${-20 - i * 13}" stroke="#6a4626" stroke-width="2.4" fill="none" opacity=".55"/>`;
    return `<path d="M0 0 C-2 -30 -4 -60 2 -98" stroke="#d8c8a8" stroke-width="2" fill="none"/>
      <path d="M0 -12 C-18 -30 -16 -70 2 -100 C16 -76 18 -34 2 -12Z" fill="url(#${u}fth)"/>${bars}
      <path d="M1 -14 C0 -40 0 -70 2 -98" stroke="#fff6e8" stroke-width="1.4" fill="none"/>
      <path d="M0 -10 C-14 -20 -18 -6 -6 -6 Z M0 -10 C14 -20 18 -6 6 -6Z" fill="#d42a3a"/>
      <path d="M-2 -8 L-8 8 M2 -8 L8 6" stroke="#d42a3a" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="0" cy="-9" r="3.4" fill="#a81e2c"/>`;
  }
  // the birthday cake: two layers, cream, a carrot on top, one candle
  function cake(u, o) {
    const lit = o && o.lit;
    return `<ellipse cx="0" cy="-2" rx="60" ry="10" fill="#e8e0d0" stroke="#c8bca8" stroke-width="1.6"/>
      <path d="M-48 -4 V-44 H48 V-4Z" fill="url(#${u}ckS)"/>
      <ellipse cx="0" cy="-44" rx="48" ry="10" fill="url(#${u}ckC)"/>
      <path d="M-48 -44 q8 14 16 0 q8 14 16 0 q8 14 16 0 q8 14 16 0 q8 14 16 0 q8 14 16 0" fill="url(#${u}ckC)"/>
      <path d="M-32 -50 V-80 H32 V-50Z" fill="url(#${u}ckS)"/>
      <ellipse cx="0" cy="-80" rx="32" ry="8" fill="url(#${u}ckC)"/>
      <path d="M-32 -80 q8 12 16 0 q8 12 16 0 q8 12 16 0 q8 12 16 0" fill="url(#${u}ckC)"/>
      <ellipse cx="0" cy="-50" rx="32" ry="6" fill="#d8c4a0" opacity=".5"/>
      <g transform="translate(-16 -86) rotate(-14)"><path d="M0 -5 C10 -6 28 -2 36 0 C28 2 10 6 0 5Z" fill="#f07a1e"/>
        <path d="M0 -2 q-10 -8 -16 -8 M0 0 q-12 -1 -18 2" stroke="#4e9a2c" stroke-width="2.4" fill="none"/></g>
      ${[[-36, -24], [-12, -30], [14, -26], [36, -22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#7a1a3a"/>`).join('')}
      <rect x="10" y="-112" width="6" height="26" rx="2" fill="#5a8ae8"/><path d="M10 -106 l6 -4 M10 -98 l6 -4 M10 -90 l6 -4" stroke="#fff" stroke-width="1.6"/>
      ${lit ? `<path class="${u}flame" d="M13 -126 C6 -118 8 -112 13 -112 C18 -112 20 -118 13 -126Z" fill="#ffd24a"/><circle cx="13" cy="-118" r="14" fill="#ffe27a" opacity=".3"/>` : ''}`;
  }
  // a wrapped present with a big bow
  function gift(u) {
    return `<rect x="-36" y="-56" width="72" height="56" rx="4" fill="url(#${u}gfB)"/>
      <rect x="-6" y="-56" width="12" height="56" fill="#f6c63a"/><rect x="-36" y="-34" width="72" height="10" fill="#f6c63a"/>
      <path d="M0 -56 C-24 -82 -40 -64 -12 -58Z M0 -56 C24 -82 40 -64 12 -58Z" fill="#f6c63a" stroke="#d8a020" stroke-width="1.4"/>
      <circle cx="0" cy="-57" r="6" fill="#e8b02a"/>
      <path d="M-30 -52 V-6" stroke="#fff" stroke-width="3" opacity=".25"/>`;
  }

  window.DN_ANIMALS = { hedgehog, squirrel, robin, snail, bat, badger, moth, mouse, feather, cake, gift };
  window.dnAnimalDefs = animalDefs;
})();
