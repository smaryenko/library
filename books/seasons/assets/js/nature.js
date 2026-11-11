// SEASONS book — realistic scenery + small woodland creatures.
//
// Landscapes read "photographic" through depth of field, not detail: the far
// plate is softly blurred (bokeh light, blurred trees and hills), the middle
// ground is gently soft, and only the foreground blades / leaves / snow are
// crisp. Each scene's plate fades into the page with a soft feathered mask.
//
// Creatures (wood mouse, peacock butterfly, red squirrel, hedgehog, robin)
// are small, realistic-proportioned and drawn around a local ground point
// (0,0) facing RIGHT; scenes place them with a no-data-part wrapper.
//
// Also: Nature.anim(tracks) — like race's sceneAnim / buildAnim, but a track
// may target a CSS selector (`sel`) instead of data-part names, for things
// that move INSIDE a part (butterfly wings).
(function () {
  'use strict';

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }
  const f1 = n => n.toFixed(1);

  // ---------- shared scene defs: blur levels + the feathered plate mask -----
  function sceneDefs(u) {
    return `
      <filter id="${u}-b1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
      <filter id="${u}-b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${u}-b8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="${u}-b16" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="${u}-mf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
      <mask id="${u}-m" maskUnits="userSpaceOnUse" x="-40" y="-60" width="440" height="400">
        <rect x="4" y="58" width="352" height="238" rx="14" fill="#fff"/>
      </mask>
      <radialGradient id="${u}-glowY" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#f6ffb0"/><stop offset="0.35" stop-color="#d9f56a" stop-opacity="0.85"/>
        <stop offset="1" stop-color="#c6ec4e" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${u}-vig" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/>
      </radialGradient>`;
  }

  // the far plate: sky gradient stops + blurred content, feathered at the edge
  function plate(u, skyStops, blurred) {
    const stops = skyStops.map((c, i) =>
      `<stop offset="${(i / (skyStops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('');
    return `<linearGradient id="${u}-sky" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
      <g data-part="sn-plate" mask="url(#${u}-m)">
        <rect x="-10" y="-10" width="380" height="320" fill="url(#${u}-sky)"/>
        ${blurred}
        <rect x="0" y="0" width="360" height="300" fill="url(#${u}-vig)"/>
      </g>`;
  }

  // soft out-of-focus light discs
  function bokeh(r, n, box, rmin, rmax, cols, op) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = box[0] + r() * (box[2] - box[0]);
      const y = box[1] + r() * (box[3] - box[1]);
      const rad = rmin + r() * (rmax - rmin);
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="${cols[(r() * cols.length) | 0]}"
               opacity="${f1((op || 0.5) * (0.5 + r() * 0.5))}"/>`;
    }
    return s;
  }

  // tapered grass blades rising from y=yb
  function blades(r, n, x0, x1, yb, hmin, hmax, cols, w) {
    w = w || 2.6;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), h = hmin + r() * (hmax - hmin);
      const lean = (r() * 2 - 1) * h * 0.35, ww = w * (0.6 + r() * 0.8);
      const y = yb + r() * 6;
      s += `<path d="M${f1(x - ww / 2)} ${f1(y)} Q${f1(x + lean * 0.3)} ${f1(y - h * 0.6)} ${f1(x + lean)} ${f1(y - h)}
               Q${f1(x + lean * 0.3 + ww * 0.25)} ${f1(y - h * 0.6)} ${f1(x + ww / 2)} ${f1(y)} Z"
               fill="${cols[(r() * cols.length) | 0]}"/>`;
    }
    return s;
  }

  function buttercup(x, y, s) {
    let p = '';
    for (let i = 0; i < 5; i++) {
      const a = i * 72 - 90;
      p += `<ellipse cx="0" cy="-3.2" rx="2.4" ry="3.4" transform="rotate(${a + 90})" fill="#f6c81e"/>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">
      <path d="M0 2 Q1 14 -1 30" stroke="#5f8a2c" stroke-width="1" fill="none"/>
      ${p}<circle r="1.6" fill="#d89a10"/><ellipse cx="-1.2" cy="-1.6" rx="1.4" ry="0.8" fill="#fff6b0" opacity="0.7"/></g>`;
  }
  function daisy(x, y, s) {
    let p = '';
    for (let i = 0; i < 14; i++) p += `<ellipse cx="0" cy="-4.4" rx="1.1" ry="3.4" transform="rotate(${i * 25.7})" fill="#fbfbf6"/>`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">
      <path d="M0 2 Q-1 12 1 26" stroke="#4f7d2a" stroke-width="1" fill="none"/>
      ${p}<circle r="2.2" fill="#f0bd22"/><circle cx="-0.6" cy="-0.6" r="0.9" fill="#ffe27a"/></g>`;
  }
  function primrose(x, y, s) {
    let p = '';
    for (let i = 0; i < 5; i++) p += `<path d="M0 0 C-4 -3 -4 -8 0 -8.5 C4 -8 4 -3 0 0 Z" transform="rotate(${i * 72})" fill="#f6eba0"/>`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})">${p}
      <circle r="1.8" fill="#e6b52c"/></g>`;
  }

  // a bracken / fern frond: curving stem with alternate pinnae
  function frond(x, y, len, ang, col, col2) {
    let pin = '';
    const n = 11;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), py = -len * t, pl = len * 0.32 * (1 - t * 0.85);
      const c = i % 2 ? col : (col2 || col);
      pin += `<path d="M0 ${f1(py)} q${f1(pl * 0.5)} ${f1(-pl * 0.25)} ${f1(pl)} ${f1(-pl * 0.05)} q${f1(-pl * 0.5)} ${f1(pl * 0.22)} ${f1(-pl)} ${f1(pl * 0.12)} z
               M0 ${f1(py)} q${f1(-pl * 0.5)} ${f1(-pl * 0.25)} ${f1(-pl)} ${f1(-pl * 0.05)} q${f1(pl * 0.5)} ${f1(pl * 0.22)} ${f1(pl)} ${f1(pl * 0.12)} z" fill="${c}"/>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${ang})">
      <path d="M0 0 Q${f1(len * 0.08)} ${f1(-len * 0.5)} 0 ${f1(-len)}" stroke="${col}" stroke-width="1.4" fill="none"/>${pin}</g>`;
  }

  // a fallen leaf (oak-ish lobed or simple pointed) with a midrib
  function leaf(x, y, s, rot, col, vein) {
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${s})">
      <path d="M0 -10 C4 -9 3 -6 6 -5 C9 -4 6 -1 8 1 C10 3 6 4 6 6 C5 8 2 8 0 10
               C-2 8 -5 8 -6 6 C-6 4 -10 3 -8 1 C-6 -1 -9 -4 -6 -5 C-3 -6 -4 -9 0 -10 Z" fill="${col}"/>
      <path d="M0 -9 L0 13" stroke="${vein || 'rgba(60,30,10,0.45)'}" stroke-width="0.7"/></g>`;
  }
  function leafScatter(r, n, box, cols, smin, smax) {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += leaf(box[0] + r() * (box[2] - box[0]), box[1] + r() * (box[3] - box[1]),
        smin + r() * (smax - smin), r() * 360, cols[(r() * cols.length) | 0]);
    }
    return s;
  }

  // a sharp distant tree line: two rows (the far one hazier), each tree a
  // trunk + a crown of many small leaf clusters lit from the top-left.
  function forest(r, x0, x1, base, h, cols, trunk, haze) {
    let out = '';
    [[0.75, 0.55, -16], [1, 1, 0]].forEach(([k, op, dy]) => {
      let row = '';
      for (let x = x0 - 10; x < x1 + 20; x += 12 + r() * 12) {
        const th = h * k * (0.7 + r() * 0.5), cx = x, cy = base + dy - th * 0.62;
        const rx = th * (0.26 + r() * 0.1), ry = th * 0.44;
        row += `<rect x="${f1(cx - 1.4)}" y="${f1(cy)}" width="2.8" height="${f1(base + dy - cy)}" fill="${trunk}"/>
          <ellipse cx="${f1(cx + rx * 0.1)}" cy="${f1(cy + ry * 0.1)}" rx="${f1(rx * 0.92)}" ry="${f1(ry * 0.9)}" fill="${cols[Math.floor(cols.length * 0.7)]}"/>`;
        for (let i = 0; i < 110; i++) {
          const a = r() * Math.PI * 2, d = Math.sqrt(r());
          const px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d;
          const lt = (px - cx) / rx + (py - cy) / ry;            // -2 (lit) .. 2 (shade)
          const ci = Math.max(0, Math.min(cols.length - 1, Math.round((lt + 2) / 4 * (cols.length - 1) + (r() - 0.5))));
          row += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(1.2 + r() * 2.4 * k)}" fill="${cols[cols.length - 1 - ci]}"/>`;
        }
      }
      out += `<g opacity="${op}">${row}</g>`;
      if (k < 1 && haze) out += `<rect x="${x0 - 20}" y="${base - h * 1.4}" width="${x1 - x0 + 40}" height="${h * 1.4}" fill="${haze}" opacity="0.35"/>`;
    });
    return out;
  }

  // a snow-laden conifer silhouette (for blurred backgrounds)
  function snowPine(x, base, h, dark, snow) {
    let t = '';
    for (let i = 0; i < 5; i++) {
      const y = base - h * (0.18 + i * 0.17), w = h * (0.34 - i * 0.055);
      t += `<path d="M${f1(x - w)} ${f1(y)} L${f1(x)} ${f1(y - h * 0.26)} L${f1(x + w)} ${f1(y)} Z" fill="${dark}"/>
            <path d="M${f1(x - w * 0.9)} ${f1(y - 1)} Q${f1(x)} ${f1(y - h * 0.08)} ${f1(x + w * 0.9)} ${f1(y - 1)} Q${f1(x)} ${f1(y - h * 0.03)} ${f1(x - w * 0.9)} ${f1(y - 1)} Z" fill="${snow}"/>`;
    }
    return `<rect x="${f1(x - h * 0.02)}" y="${f1(base - h * 0.2)}" width="${f1(h * 0.04)}" height="${f1(h * 0.2)}" fill="${dark}"/>${t}`;
  }

  // ---------- small creatures (local ground (0,0), facing right) -----------
  // Painted with FurPaint (fine hair / feather strokes over a shaded base),
  // eyes + noses crisp vector. Each is memoised — they never change.
  const memo = {};
  const once = (k, fn) => memo[k] || (memo[k] = fn());
  const FPp = o => window.FurPaint.paint(o);
  const lit = (top, bot, hi, lo) => (x, y) => hi + (lo - hi) * Math.max(0, Math.min(1, (y - top) / (bot - top)));
  const glossEye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#0b0807"/>
      <circle cx="${x + r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.35}" fill="#fff" opacity="0.9"/>
      <circle cx="${x - r * 0.3}" cy="${y + r * 0.35}" r="${r * 0.18}" fill="#fff" opacity="0.35"/>`;

  function mouseDefs() { return ''; }
  // wood mouse: sandy-brown back, white belly, big ears, huge dark eye, long tail
  function mouse() {
    return once('mouse', () => {
      const L = lit(-30, 0, 1.15, 0.8);
      const body = FPp({ pts: [[-24, -2], [-30, -12], [-24, -24], [-8, -31], [8, -30], [20, -24], [30, -17], [41, -9], [38, -4], [22, 0], [-10, 0]],
        seed: 5, density: 70, len: [1.4, 2.6], width: [0.3, 0.6], jitter: 0.07, base: '#8a5e3c', light: L,
        flow: (x, y) => Math.PI + 0.25, color: (x, y) => y > -7 && x > -18 ? '#e8ddcf' : (y > -11 ? '#b08a62' : '#835834') });
      const ear = FPp({ pts: [[8, -26], [6, -36], [12, -42], [19, -38], [19, -28]], seed: 6, density: 60, len: [0.8, 1.6], width: [0.25, 0.5],
        base: '#c79a86', light: L, flow: () => -1.4, color: () => '#b9877a' });
      return `<path d="M-24 -4 C-40 -2 -54 -10 -70 -2" stroke="#b8927e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${body}${ear}<path d="M11 -29 C10 -35 14 -39 17 -36" fill="none" stroke="#a87064" stroke-width="1.2"/>
        ${glossEye(24, -18, 3.1)}
        <ellipse cx="41" cy="-8" rx="1.8" ry="1.4" fill="#cf8a88"/>
        <g stroke="#3a2a20" stroke-width="0.3" opacity="0.7" fill="none"><path d="M35 -8 q8 -4 14 -4 M35 -7 q8 0 13 3 M34 -6 q6 3 10 7"/></g>
        <path d="M-4 0 l-2 1.4 h5 z M20 0 l2 1.4 h-5 z" fill="#e0b3a6"/>`;
    });
  }

  // peacock butterfly, wings open, seen from above; two flap groups
  function butterfly() {
    return once('bf', () => {
      const wingCol = (x, y) => {
        const e1 = Math.hypot(x + 24, y + 13), e2 = Math.hypot(x + 18, y + 10);
        if (y < -2) return e1 < 2.2 ? '#151012' : e1 < 4 ? '#f1d878' : e1 < 6.5 ? '#3f73bf' : e1 < 8 ? '#1c1424' : (x < -30 ? '#4a1a14' : '#9a241c');
        return e2 < 4 ? '#5a76a6' : e2 < 6 ? '#121014' : '#5a1e18';
      };
      const w = FPp({ pts: [[0, 0], [-6, -14], [-20, -22], [-33, -18], [-36, -10], [-28, -3], [-20, 0], [-30, 6], [-28, 16], [-18, 19], [-6, 10]],
        seed: 9, density: 140, len: [0.8, 1.6], width: [0.4, 0.8], jitter: 0.05, base: '#8a2219', light: () => 1,
        flow: (x, y) => Math.atan2(y, x), color: wingCol, opacity: 0.95 });
      const spots = `<g filter="url(#bfSoft)"><circle cx="-24" cy="-13" r="7.5" fill="#1c1424"/><circle cx="-24" cy="-13" r="5.8" fill="#3f73bf"/>
          <circle cx="-24" cy="-13" r="3.6" fill="#f1d878"/><circle cx="-23.5" cy="-13" r="1.8" fill="#151012"/>
          <circle cx="-19" cy="10" r="5.6" fill="#121014"/><circle cx="-19" cy="10" r="3.8" fill="#5a76a6"/><circle cx="-19" cy="10" r="1.5" fill="#cfd8e8"/>
          <path d="M-8 -10 Q-16 -18 -30 -18" stroke="#f0e6d0" stroke-width="1" opacity="0.6" fill="none"/></g>`;
      const w2 = w + spots;
      return `<defs><filter id="bfSoft"><feGaussianBlur stdDeviation="0.5"/></filter></defs><g class="bfw-l">${w2}</g><g class="bfw-r"><g transform="scale(-1 1)">${w2}</g></g>
        <ellipse cx="0" cy="3" rx="1.7" ry="10" fill="#1d1612"/><circle cx="0" cy="-7.5" r="2" fill="#1d1612"/>
        <path d="M-0.6 -9 Q-3 -16 -6 -19 M0.6 -9 Q3 -16 6 -19" stroke="#1d1612" stroke-width="0.6" fill="none"/>
        <circle cx="-6" cy="-19" r="0.8" fill="#1d1612"/><circle cx="6" cy="-19" r="0.8" fill="#1d1612"/>`;
    });
  }

  // red squirrel sitting up with a hazelnut; ear tufts, big bushy tail
  function squirrel() {
    return once('sq', () => {
      const L = lit(-74, 0, 1.15, 0.78);
      const tail = FPp({ pts: [[-8, -4], [-26, -10], [-38, -28], [-36, -52], [-26, -70], [-10, -76], [2, -68], [-4, -58], [-14, -48], [-18, -30], [-10, -14]],
        seed: 21, density: 40, len: [3, 6], width: [0.4, 0.9], jitter: 0.1, base: '#a5461b', light: L,
        flow: (x, y) => Math.atan2(y + 40, x + 20) + Math.PI / 2, color: (x, y, r) => r() > 0.8 ? '#d27a3a' : '#a8461c' });
      const body = FPp({ pts: [[-12, 0], [-16, -16], [-8, -32], [6, -36], [16, -28], [19, -12], [13, 0]],
        seed: 22, density: 60, len: [1.6, 3], width: [0.3, 0.7], base: '#b6531f', light: L, flow: () => Math.PI / 2,
        color: (x, y) => x > 6 && y > -30 ? '#f1e4d2' : '#b5521e' });
      const head = FPp({ pts: [[2, -32], [3, -44], [11, -50], [21, -47], [27, -39], [21, -33], [11, -30]],
        seed: 23, density: 70, len: [1.2, 2.4], width: [0.3, 0.6], base: '#bf5a22', light: L,
        flow: (x, y) => Math.atan2(y + 39, x - 27), color: (x, y) => y > -36 && x > 14 ? '#f1e4d2' : '#bd5822' });
      const ears = FPp({ pts: [[6, -46], [3, -60], [8, -55], [12, -47]], seed: 24, density: 80, len: [2, 5], width: [0.3, 0.6],
        base: '#8a3a16', light: L, flow: () => -Math.PI / 2 - 0.2, color: () => '#7a3214' }) +
        FPp({ pts: [[13, -48], [14, -62], [18, -55], [18, -47]], seed: 25, density: 80, len: [2, 5], width: [0.3, 0.6],
          base: '#8a3a16', light: L, flow: () => -Math.PI / 2 + 0.1, color: () => '#7a3214' });
      return `${tail}${body}${head}${ears}${glossEye(17, -41, 2.2)}
        <ellipse cx="26.5" cy="-38" rx="1.3" ry="1" fill="#2a1a14"/>
        <ellipse cx="15" cy="-22" rx="4" ry="4.4" fill="#9a6a2c"/><path d="M11 -23.5 Q15 -28 19 -23.5 Z" fill="#6a4320"/>
        <path d="M9 -24 q4 -3 7 2 M11 -18 q4 0 6 -4" stroke="#a84c1c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M-10 0 l-3 1 h8 z M8 0 l3 1 h-8 z" fill="#7a3a18"/>`;
    });
  }

  // hedgehog: banded cream/brown spines over a dome, soft brown face fur
  function hedgehog() {
    return once('hh', () => {
      const spines = FPp({ pts: [[-32, -2], [-34, -16], [-24, -28], [-6, -32], [10, -28], [20, -18], [22, -6], [10, -2]],
        seed: 31, density: 34, len: [6, 10], width: [0.6, 1.1], jitter: 0.12, base: '#4a3a2c', light: lit(-32, 0, 1.15, 0.75),
        flow: (x, y) => Math.atan2(y + 2, x + 6) + Math.PI + 0.6,
        color: (x, y, r) => { const q = r(); return q > 0.66 ? '#e2d3bc' : q > 0.33 ? '#6a5240' : '#2e241c'; } });
      const face = FPp({ pts: [[10, -20], [22, -20], [32, -13], [42, -6], [40, -2], [24, -1], [12, -4]],
        seed: 32, density: 70, len: [1, 2.2], width: [0.3, 0.6], base: '#a88466', light: lit(-18, 0, 1.1, 0.8),
        flow: (x, y) => Math.atan2(y + 6, x - 40) , color: (x, y) => y > -7 ? '#c4a588' : '#9a785c' });
      return `${spines}${face}${glossEye(25, -12, 1.8)}
        <circle cx="42" cy="-4.6" r="2" fill="#140d0b"/><circle cx="41.5" cy="-5.4" r="0.6" fill="#fff" opacity="0.5"/>
        <path d="M-16 -1 l1 2 h5 l-1 -2 z M14 -1 l1 2 h5 l-1 -2 z" fill="#3a2a20"/>`;
    });
  }

  // European robin: olive-brown back, orange-red breast bordered grey, white belly
  function robin() {
    return once('rb', () => {
      const body = FPp({ pts: [[-18, -14], [-14, -26], [-2, -34], [10, -33], [17, -26], [17, -14], [10, -5], [-4, -3], [-14, -7]],
        seed: 41, density: 90, len: [1.4, 2.8], width: [0.3, 0.7], jitter: 0.06, base: '#7a6444', light: lit(-34, 0, 1.12, 0.82),
        flow: (x, y) => Math.PI + 0.35, color: (x, y) => {
          const br = Math.hypot((x - 9) / 9, (y + 20) / 12);
          if (br < 1) return '#e0612c';
          if (br < 1.15) return '#a9aaa4';
          if (y > -12 && x > -8) return '#efe9df';
          return '#7a6444';
        } });
      const wing = FPp({ pts: [[-17, -15], [-11, -22], [-1, -22], [1, -16], [-9, -11]], seed: 42, density: 90, len: [2, 4], width: [0.3, 0.7],
        base: '#6a5638', light: () => 0.95, flow: () => Math.PI + 0.25, color: (x, y, r) => r() > 0.8 ? '#a08a62' : '#665234' });
      const tail = FPp({ pts: [[-14, -16], [-30, -15], [-33, -10], [-28, -7], [-14, -9]], seed: 43, density: 90, len: [3, 5], width: [0.3, 0.7],
        base: '#5f4b36', light: () => 0.9, flow: () => Math.PI + 0.1, color: () => '#5f4b36' });
      return `${tail}${body}${wing}
        ${glossEye(11, -26, 1.7)}
        <path d="M16 -27 L21.5 -25.6 L16 -24.4 Z" fill="#2a201a"/>
        <path d="M-1 -4 L-2 0 M5 -4 L6 0" stroke="#8a6a52" stroke-width="0.9"/>`;
    });
  }

  // bumblebee: fuzzy banded body (painted), glassy wings in a .bw group
  function bee() {
    return once('bee', () => {
      const body = FPp({ pts: [[-9, 0], [-8, -6], [-2, -8], [5, -7], [9, -3], [8, 2], [2, 4], [-5, 4]], seed: 51, density: 260,
        len: [0.6, 1.3], width: [0.25, 0.5], base: '#2a2218', light: () => 1, flow: (x, y) => Math.atan2(y + 2, x),
        color: (x, y) => x < -5 ? '#f4efe2' : x < -1 ? '#1e1a14' : x < 3 ? '#f2c230' : '#1e1a14' });
      return `<g class="bw" opacity="0.75"><ellipse cx="0" cy="-9" rx="4" ry="6.5" transform="rotate(-25 0 -9)" fill="#e6f0f6" stroke="#9aa8b4" stroke-width="0.3"/>
          <ellipse cx="3" cy="-8" rx="3" ry="5" transform="rotate(20 3 -8)" fill="#e6f0f6" stroke="#9aa8b4" stroke-width="0.3"/></g>
        ${body}<circle cx="9" cy="-2" r="2.4" fill="#16120e"/><circle cx="9.8" cy="-2.8" r="0.6" fill="#fff" opacity="0.7"/>`;
    });
  }
  // dragonfly (golden-ringed style), seen from above, wings in .dfw
  function dragonfly() {
    const wing = (a, l) => `<ellipse cx="0" cy="${-l / 2}" rx="${l * 0.16}" ry="${l / 2}" transform="rotate(${a})" fill="#dfeef4" opacity="0.55" stroke="#8aa0aa" stroke-width="0.25"/>
      <path d="M0 0 L0 ${-l}" transform="rotate(${a})" stroke="#6a7e88" stroke-width="0.25"/>`;
    let seg = '';
    for (let i = 0; i < 8; i++) seg += `<rect x="${-1.3}" y="${4 + i * 3.2}" width="2.6" height="3" rx="1" fill="${i % 2 ? '#1a1612' : '#e8c23a'}"/>`;
    return `<g class="dfw">${wing(-70, 16)}${wing(70, 16)}${wing(-110, 15)}${wing(110, 15)}</g>
      ${seg}<ellipse cx="0" cy="0" rx="2.4" ry="4" fill="#3a3a1e"/><circle cx="-1.5" cy="-4" r="1.8" fill="#4a8a5a"/><circle cx="1.5" cy="-4" r="1.8" fill="#4a8a5a"/>`;
  }
  // greylag goose in flight, side view facing right, wings in .gw
  function goose() {
    return `<path d="M-16 0 C-10 -5 6 -5 14 -2 C18 -1 22 -3 26 -3 L30 -2 L26 0 C20 1 16 2 12 3 C2 5 -10 4 -16 0 Z" fill="#8a8478"/>
      <path d="M-16 0 C-10 3 2 4 12 3 C2 6 -10 5 -16 0 Z" fill="#d8d2c4"/>
      <path d="M-18 -1 L-24 -3 L-23 1 Z" fill="#6a6458"/>
      <path d="M26 -3 L31 -2.4 L26 -1.4 Z" fill="#e88a3a"/><circle cx="24.6" cy="-3" r="0.6" fill="#111"/>
      <g class="gw"><path d="M-4 -2 C-8 -14 -2 -24 6 -28 C6 -18 6 -10 4 -2 Z" fill="#6f695e"/>
        <path d="M-2 -6 C-4 -14 0 -20 5 -24" stroke="#4a463e" stroke-width="0.6" fill="none"/></g>`;
  }

  // like buildAnim, but a track may target `sel` (any CSS selector)
  function anim(tracks) {
    const uid = 's' + Math.random().toString(36).slice(2, 8);
    let kf = '', rules = '';
    tracks.forEach((t, i) => {
      const name = `n${i}-${uid}`;
      kf += `@keyframes ${name}{${t.keyframes}}`;
      const sels = t.sel ? [t.sel] : (Array.isArray(t.parts) ? t.parts : [t.parts]).map(p => `[data-part="${p}"]`);
      const origin = t.origin ? `transform-origin:${t.origin};` : '';
      sels.forEach(sl => {
        rules += `svg.is-playing ${sl}{transform-box:${t.box || 'view-box'};${origin}animation:${name} ${t.timing}}`;
      });
    });
    return `<style>${kf}${rules}</style>`;
  }

  // rotate(A) about O, then rotate(B) about point N — one transform list that
  // shares O as transform-origin (N and O in scene coords).
  function rot2(O, N, A, B) {
    const dx = N[0] - O[0], dy = N[1] - O[1];
    return `rotate(${A}deg) translate(${f1(dx)}px,${f1(dy)}px) rotate(${B}deg) translate(${f1(-dx)}px,${f1(-dy)}px)`;
  }

  window.Nature = { rng, sceneDefs, plate, bokeh, blades, buttercup, daisy, primrose,
    frond, leaf, leafScatter, forest, snowPine, mouseDefs, mouse, butterfly, squirrel,
    hedgehog, robin, bee, dragonfly, goose, anim, rot2 };
})();
