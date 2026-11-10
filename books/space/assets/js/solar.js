// SOLAR — real rotating spheres for the "Our Solar System" book.
//
// Unlike the other books this one does NOT use layered pseudo-3D SVG art.
// Each body is a true sphere rendered per-pixel onto a <canvas>: every frame
// the planet's real equirectangular surface map (assets/textures/*.jpg) is
// projected onto a lit disk and scrolled in longitude, so the planet spins on
// its own axis (with its real axial tilt). Saturn gets a canvas-drawn ring.
//
// How it plugs into the shared engine WITHOUT engine edits:
//  - pages.js build() returns a plain SVG (dark space window, orbits, stars)
//    tagged `data-solar`, containing invisible marker circles
//    `<circle data-body="earth" cx cy r [data-a data-b data-period ...]>`.
//  - a MutationObserver spots that SVG once the engine mounts it and lays a
//    `.solar-layer` of sphere canvases over the markers (positions in %, so
//    it follows the slot's size).
//  - a tap anywhere on the picture is caught in the capture phase: the WHOLE
//    picture flies to the middle of the screen, fills the viewport and keeps
//    moving; a second tap (or Esc) flies it back. The page doesn't turn.
//  - planets.css switches the engine's tilt/parallax off for this book.

(function () {
  'use strict';

  // textures live next to this script: books/space/assets/textures/
  const TEX_BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? new URL('../textures/', s).href : 'assets/textures/';
  })();
  const TW = 1024, TH = 512;            // working texture size (downsampled)

  // ---- body catalogue ---------------------------------------------------
  // spin: seconds per turn on screen (negative = retrograde, like Venus,
  // Uranus, Pluto). tilt: axial tilt in degrees (roll in the picture plane).
  // incl: how far the north pole leans toward the viewer.
  const BODIES = {
    sun:     { name: 'The Sun', tex: 'sun', spin: 30, tilt: 7, emissive: true, color: '#ffb43a' },
    mercury: { name: 'Mercury', tex: 'mercury', spin: 40, tilt: 0, color: '#9a948c' },
    venus:   { name: 'Venus', tex: 'venus_atmosphere', spin: -60, tilt: 3, color: '#e8c98a',
               atmo: 'rgba(255,225,160,0.45)' },
    earth:   { name: 'Earth', tex: 'earth_daymap', clouds: 'earth_clouds', spin: 16, tilt: 23.4,
               color: '#3b6fb5', atmo: 'rgba(120,180,255,0.6)' },
    moon:    { name: 'The Moon', tex: 'moon', spin: 36, tilt: 6.7, color: '#aaaaaa' },
    mars:    { name: 'Mars', tex: 'mars', spin: 17, tilt: 25, color: '#c1440e',
               atmo: 'rgba(255,170,120,0.3)' },
    jupiter: { name: 'Jupiter', tex: 'jupiter', spin: 8, tilt: 3, color: '#c9a77c' },
    saturn:  { name: 'Saturn', tex: 'saturn', enhance: 'saturn', spin: 9, tilt: 26.7, incl: 20, ring: 'saturn',
               color: '#e3cf9a' },   // ring map: tex/saturn_ring.js
    // Uranus' real map is almost featureless, so the faint real banding and
    // bright methane clouds (as Hubble/Keck see them) are enhanced onto it so
    // the spin shows. Seen side-on (low incl) so the clouds sweep right across
    // the disc, and it turns twice as fast as the calm default to read clearly.
    uranus:  { name: 'Uranus', tex: 'uranus', enhance: 'uranus', spin: -10, tilt: 82, incl: 10,
               spinBoost: 2, color: '#9fd8e0',
               atmo: 'rgba(170,240,255,0.45)' },
    neptune: { name: 'Neptune', tex: 'neptune', spin: 11, tilt: 28, color: '#3f5fd6',
               atmo: 'rgba(110,150,255,0.45)' },
    // The New Horizons map is sharp in the north but blurry/blank in the far
    // south (never imaged), so the north pole leans toward us to hide it.
    pluto:   { name: 'Pluto', tex: 'pluto', spin: -26, tilt: 8, incl: 42, color: '#c9b29a' },
    charon:  { name: 'Charon', tex: 'moon', spin: -26, tilt: 30, color: '#8d8a86',
               tint: [0.82, 0.8, 0.8] },
    // ---- small bodies ---------------------------------------------------
    // Asteroids and Kuiper Belt objects are NOT spheres: `shape` gives them a
    // lumpy, cratered, potato-like form (or two lobes, like Arrokoth), drawn
    // by the irregular-body renderer below. Ceres is big enough to be round,
    // and wears its real Dawn map.
    ceres:   { name: 'Ceres', tex: 'ceres', spin: 9, tilt: 4, color: '#8e8a84' },
    vesta:   { name: 'Vesta', tex: 'mercury', spin: 5, tilt: 29, color: '#9a9088',
               tint: [0.9, 0.86, 0.8],
               // squat, with the giant Rheasilvia crater flattening its south
               shape: { seed: 3, lobes: [{ ax: 1, ay: 0.82, az: 0.94 }], bump: 0.12, cuts: 2,
                        dents: [[0, -1, 0, -0.22, 0.35]] } },
    // rockA: a "rubble pile" peanut like Itokawa — a big and a small lobe
    rockA:   { name: 'An asteroid', tex: 'mercury', spin: 4, tilt: 50, color: '#7a6a5c',
               tint: [0.78, 0.7, 0.6],
               shape: { seed: 11, bump: 0.18, cuts: 5, lobes: [
                 { cx: -0.38, ax: 0.72, ay: 0.5, az: 0.55 },
                 { cx: 0.55, cy: 0.06, ax: 0.48, ay: 0.4, az: 0.42 }] } },
    // rockB: a long, bent, chipped rock like Eros
    rockB:   { name: 'An asteroid', tex: 'moon', spin: -6, tilt: 20, color: '#6a625a',
               tint: [0.66, 0.62, 0.58],
               shape: { seed: 29, bump: 0.22, cuts: 7, lobes: [
                 { cx: -0.45, cy: 0.05, ax: 0.62, ay: 0.36, az: 0.4 },
                 { cx: 0.42, cy: -0.04, ax: 0.6, ay: 0.32, az: 0.36 }] } },
    // Kuiper Belt: dark-red icy bodies, egg-shaped Haumea, snowman Arrokoth
    kboRed:  { name: 'An icy world', tex: 'moon', spin: 14, tilt: 40, color: '#a58a78',
               tint: [1.02, 0.78, 0.64],
               shape: { seed: 5, lobes: [{ ax: 1.1, ay: 0.8, az: 0.85 }], bump: 0.2, cuts: 4 } },
    kboBlue: { name: 'An icy world', tex: 'mercury', spin: -19, tilt: 12, color: '#9aa6b8',
               tint: [0.8, 0.86, 0.98],
               shape: { seed: 17, lobes: [{ ax: 1.2, ay: 0.7, az: 0.8 }], bump: 0.24, cuts: 6 } },
    kboPale: { name: 'Haumea', tex: 'pluto', spin: 22, tilt: 65, color: '#d8d0c8',
               tint: [1.05, 1.03, 1.06],
               shape: { seed: 8, lobes: [{ ax: 1.3, ay: 0.68, az: 0.96 }], bump: 0.03 } },
    kboDark: { name: 'Arrokoth', tex: 'moon', spin: -11, tilt: 18, color: '#6e625a',
               tint: [0.86, 0.62, 0.5],
               shape: { seed: 21, bump: 0.06, lobes: [
                 { cx: -0.52, ax: 0.62, ay: 0.4, az: 0.58 },
                 { cx: 0.5, ax: 0.48, ay: 0.38, az: 0.44 }] } }
  };
  window.SOLAR_BODIES = BODIES;
  // (textures are preloaded right after the loaders below are defined)

  // ---- texture loading (cached; falls back to a flat colour) -------------
  const texCache = {};
  function loadTex(name, enhance) {
    const key = name + (enhance ? ':' + enhance : '');
    if (texCache[key]) return texCache[key];
    const entry = { ready: false, data: null };
    texCache[key] = entry;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = TW; c.height = TH;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, TW, TH);
        entry.data = new Uint32Array(g.getImageData(0, 0, TW, TH).data.buffer);
        if (enhance) enhanceBands(entry.data, enhance);
      } catch (e) {
        // file:// pages taint the canvas; serve over http to see the maps.
        entry.data = null;
      }
      entry.ready = true;
    };
    img.onerror = () => { entry.ready = true; };
    // Prefer the baked data-URI copy (assets/js/tex/*.js): data URIs never
    // taint the canvas, so the real surfaces also show when opened via file://.
    const baked = window.SOLAR_TEX && window.SOLAR_TEX[name];
    img.src = baked || (TEX_BASE + name + '.jpg');
    return entry;
  }

  // Gas giants whose real maps are the same all the way round (Uranus,
  // Saturn) get their real kinds of weather added so their spin is visible:
  // Uranus — faint bands, a brighter south pole, bright methane clouds;
  // Saturn — pale storm ovals (like its "Great White Spots") and a few
  // darker eddies in the belts. The poles are left as the real map has them.
  function enhanceBands(D, kind) {
    const uranus = kind === 'uranus';
    let seed = uranus ? 77 : 41;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const spots = [];
    const add = (u, v, su, sv, a, col) => spots.push({ u, v, su, sv, a, col });
    if (uranus) {
      // bright methane clouds: big puffs and long streaks, plus dark spots
      for (let k = 0; k < 8; k++) add(rnd() * TW, TH * (0.18 + rnd() * 0.6),
        40 + rnd() * 70, 7 + rnd() * 10, 0.75 + rnd() * 0.25, [255, 255, 255]);
      for (let k = 0; k < 5; k++) add(rnd() * TW, TH * (0.25 + rnd() * 0.5),
        110 + rnd() * 120, 3 + rnd() * 3, 0.7, [245, 255, 255]);
      for (let k = 0; k < 3; k++) add(rnd() * TW, TH * (0.3 + rnd() * 0.4),
        26 + rnd() * 20, 10 + rnd() * 6, 0.7, [40, 90, 120]);
    } else {
      // Saturn: a Great White Spot storm with its trailing plume, white
      // ovals, dark eddies in the belts
      add(TW * 0.3, TH * 0.36, 70, 12, 0.95, [255, 250, 232]);
      add(TW * 0.3 + 120, TH * 0.36, 160, 6, 0.7, [255, 248, 228]);
      for (let k = 0; k < 9; k++) add(rnd() * TW, TH * (0.25 + rnd() * 0.5),
        22 + rnd() * 40, 6 + rnd() * 8, 0.6 + rnd() * 0.3, [255, 248, 230]);
      for (let k = 0; k < 6; k++) add(rnd() * TW, TH * (0.3 + rnd() * 0.4),
        20 + rnd() * 30, 6 + rnd() * 6, 0.6, [95, 70, 45]);
    }
    for (let y = 0; y < TH; y++) {
      const lat = (0.5 - y / TH) * Math.PI;
      const band = uranus
        ? 1 + 0.16 * Math.sin(lat * 9) + 0.08 * Math.sin(lat * 23 + 1)
          + 0.15 * Math.max(0, -Math.sin(lat) - 0.55)
        : 1;
      for (let x = 0; x < TW; x++) {
        const o = y * TW + x, c = D[o];
        let r = (c & 255) * band, g = ((c >> 8) & 255) * band, b = ((c >> 16) & 255) * band;
        const lon = (x / TW) * Math.PI * 2;
        if (uranus) {
          // wavy band edges so the bands themselves show the turning
          const wv = Math.sin(lon * 3 + lat * 6) * Math.cos(lat * 7);
          r *= 1 + 0.08 * wv; g *= 1 + 0.08 * wv; b *= 1 + 0.05 * wv;
        } else {
          // ripples along the belts
          // (kept away from the poles so the real map's polar cap stays clean)
          const wv = 0.07 * Math.sin(lon * 5 + lat * 30) * Math.max(0, Math.cos(lat * 2));
          r *= 1 + wv; g *= 1 + wv; b *= 1 + wv;
        }
        for (const sp of spots) {
          let du = Math.abs(x - sp.u); if (du > TW / 2) du = TW - du;
          const w = sp.a * Math.exp(-(du * du) / (2 * sp.su * sp.su) - ((y - sp.v) ** 2) / (2 * sp.sv * sp.sv));
          if (w > 0.002) { r += (sp.col[0] - r) * w; g += (sp.col[1] - g) * w; b += (sp.col[2] - b) * w; }
        }
        r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
        D[o] = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
      }
    }
  }

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ---- per-size projection table ----------------------------------------
  // For every pixel of an N×N disk: its texture column (before spin), row
  // offset, surface normal and edge coverage. Built once per sphere.
  function buildLUT(N, tiltDeg, inclDeg) {
    const R = N / 2;
    const t = tiltDeg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    const i = inclDeg * Math.PI / 180, ci = Math.cos(i), si = Math.sin(i);
    const idx = [], u0 = [], vr = [], nxA = [], nyA = [], nzA = [], al = [];
    for (let py = 0; py < N; py++) {
      for (let px = 0; px < N; px++) {
        const dx = (px + 0.5 - R) / R;
        const dy = (R - (py + 0.5)) / R;           // up = positive
        const d = Math.sqrt(dx * dx + dy * dy);
        const a = Math.min(1, Math.max(0, (1 - d) * R + 0.5));
        if (a <= 0) continue;
        let nx = dx, ny = dy;
        if (d > 1) { nx /= d; ny /= d; }
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        // undo axial roll, then undo the pole's lean toward the viewer
        const x1 = nx * c + ny * s, y1 = -nx * s + ny * c;
        const y2 = y1 * ci + nz * si, z2 = -y1 * si + nz * ci;
        const lat = Math.asin(Math.max(-1, Math.min(1, y2)));
        const lon = Math.atan2(x1, z2);
        idx.push(py * N + px);
        u0.push((lon / (2 * Math.PI) + 0.5) * TW);
        vr.push(Math.min(TH - 1, Math.floor((0.5 - lat / Math.PI) * TH)) * TW);
        nxA.push(nx); nyA.push(ny); nzA.push(nz); al.push(a);
      }
    }
    return {
      n: idx.length,
      idx: Int32Array.from(idx), u0: Float32Array.from(u0), vr: Int32Array.from(vr),
      nx: Float32Array.from(nxA), ny: Float32Array.from(nyA), nz: Float32Array.from(nzA),
      al: Float32Array.from(al)
    };
  }

  // ---- sphere objects + the shared animation loop -------------------------
  const CHILL_SPIN = 45;       // seconds per full turn, same for all bodies
  const RING_RATIO = 2.4;      // canvas side / planet diameter for ringed bodies
  const ATMO_RATIO = 1.12;     // room for the atmosphere halo
  const DEFAULT_LIGHT = norm3(-0.4, 0.35, 0.85);    // upper-left, mostly in front
  const live = new Set();

  function norm3(x, y, z) {
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  }

  // Create a sphere canvas for `key` whose PLANET diameter is `pxDiam` CSS px.
  function createSphere(key, pxDiam, maxN) {
    const body = BODIES[key] || BODIES.moon;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cap = body.shape ? 300 : (maxN || 520);       // splatting costs more
    const N = Math.max(16, Math.min(cap, maxN || 520, Math.round(pxDiam * dpr)));
    const ratio = body.shape ? 1 : body.ring ? RING_RATIO : ATMO_RATIO;   // rings need room
    const S = Math.round(N * ratio);

    const canvas = document.createElement('canvas');
    canvas.className = 'solar-canvas';
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d');

    const off = document.createElement('canvas');
    off.width = N; off.height = N;
    const offCtx = off.getContext('2d');
    const img = offCtx.createImageData(N, N);

    const sp = {
      key, body, N, S, ratio, canvas, ctx, off, offCtx, img,
      buf: new Uint32Array(img.data.buffer),
      lut: buildLUT(N, body.tilt || 0, body.incl == null ? 12 : body.incl),
      tex: loadTex(body.tex, body.enhance),
      clouds: body.clouds ? loadTex(body.clouds) : null,
      flat: hexToRgb(body.color || '#888888'),
      light: DEFAULT_LIGHT
    };
    if (body.ring) buildRing(sp);
    if (body.shape) buildLumpy(sp);
    live.add(sp);
    return sp;
  }

  function drawSphere(sp, t) {
    if (sp.lumpy) { drawLumpy(sp, t); return; }
    const { lut, buf, body } = sp;
    const T = sp.tex.data;
    const C = sp.clouds && sp.clouds.data;
    // One calm spin speed for every body (not the real day lengths); only
    // the direction comes from `spin` (negative = retrograde).
    const per = CHILL_SPIN / (body.spinBoost || 1) * Math.sign(body.spin || 1);
    const turn = ((t / per) % 1 + 1) % 1;
    const off = turn * TW;
    const coff = C ? (((t / (per * 0.85)) % 1 + 1) % 1) * TW : 0;
    const [lx, ly, lz] = sp.light;
    const tint = body.tint || null;
    const [fr, fg, fb] = sp.flat;
    const emissive = !!body.emissive;

    for (let k = 0; k < lut.n; k++) {
      let r, g, b;
      if (T) {
        let u = lut.u0[k] - off; u %= TW; if (u < 0) u += TW;
        const c = T[lut.vr[k] + (u | 0)];
        r = c & 255; g = (c >> 8) & 255; b = (c >> 16) & 255;
      } else { r = fr; g = fg; b = fb; }

      if (C) {
        let cu = lut.u0[k] - coff; cu %= TW; if (cu < 0) cu += TW;
        const a = (C[lut.vr[k] + (cu | 0)] & 255) / 255 * 0.9;
        r += (255 - r) * a; g += (255 - g) * a; b += (255 - b) * a;
      }

      let s;
      const nz = lut.nz[k];
      if (emissive) {
        s = 0.62 + 0.55 * Math.sqrt(nz);           // limb darkening
      } else {
        const d = lut.nx[k] * lx + lut.ny[k] * ly + nz * lz;
        // soft "wrapped" light: the far side fades to a dim glow, never pitch black
        s = 0.14 + 1.0 * Math.max(0, Math.min(1, (d + 0.3) / 1.2));
      }
      if (tint) { r *= tint[0]; g *= tint[1]; b *= tint[2]; }
      r = Math.min(255, r * s); g = Math.min(255, g * s); b = Math.min(255, b * s);
      const a = (lut.al[k] * 255) | 0;
      buf[lut.idx[k]] = (a << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
    }
    sp.offCtx.putImageData(sp.img, 0, 0);

    const ctx = sp.ctx, S = sp.S, cx = S / 2, R = sp.N / 2;
    ctx.clearRect(0, 0, S, S);
    const ringOk = body.ring && renderRing(sp, t);
    if (ringOk) ctx.drawImage(sp.ringBack.cv, 0, 0);
    ctx.drawImage(sp.off, cx - R, cx - R);
    if (body.atmo) {
      const gr = ctx.createRadialGradient(cx, cx, R * 0.9, cx, cx, R * 1.1);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.45, body.atmo);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx, cx, R * 1.1, 0, Math.PI * 2); ctx.fill();
    }
    if (ringOk) ctx.drawImage(sp.ringFront.cv, 0, 0);
  }


  // ---- irregular bodies (asteroids, Kuiper Belt objects) ------------------
  // A lat/lon grid of surface points is displaced into a lumpy, cratered
  // shape once; every frame the points are spun about the body's axis,
  // tilted like the spheres, lit, and splatted into a z-buffer. The texture
  // colour comes from a real cratered map at each point's lat/lon.
  function buildLumpy(sp) {
    const { body, N } = sp;
    const cfg = body.shape;
    let seed = cfg.seed || 1;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const randDir = () => {
      const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, q = Math.sqrt(1 - z * z);
      return [q * Math.cos(a), z, q * Math.sin(a)];
    };
    // big lumps/dents, then lots of small crater dimples
    const feats = [];
    for (let k = 0; k < 14; k++) {          // lumps and broad hollows
      const [x, y, z] = randDir();
      feats.push([x, y, z, (rnd() * 2 - 1.2) * (cfg.bump || 0.15), 0.06 + rnd() * 0.3]);
    }
    for (let k = 0; k < 30; k++) {          // crater bowls
      const [x, y, z] = randDir();
      feats.push([x, y, z, -(0.03 + rnd() * 0.06) * Math.min(1, (cfg.bump || 0.15) * 5), 0.004 + rnd() * 0.02]);
    }
    (cfg.dents || []).forEach(d => feats.push(d));
    // flat facets: random cutting planes chip the body into angular faces,
    // which is what makes real small asteroids look like broken rock.
    const cuts = [];
    for (let k = 0; k < (cfg.cuts || 0); k++) cuts.push([...randDir(), 0.72 + rnd() * 0.22]);
    const radius = (x, y, z) => {
      let r = 1;
      for (const f of feats) r += f[3] * Math.exp((x * f[0] + y * f[1] + z * f[2] - 1) / f[4]);
      for (const c of cuts) {
        const d = x * c[0] + y * c[1] + z * c[2];
        if (d > 0) r = Math.min(r, c[3] / d);
      }
      return Math.max(0.3, r);
    };

    const G = Math.max(24, Math.ceil(N * 1.15)), M = 2 * G;   // lat × lon samples
    const lobes = cfg.lobes;
    const total = lobes.length * G * M;
    const P = new Float32Array(total * 3), Nn = new Float32Array(total * 3);
    const U = new Int32Array(total);
    let ext = 0.01, o = 0;
    lobes.forEach(lb => {
      const grid = new Float32Array(G * M * 3);
      for (let j = 0; j < G; j++) {
        const lat = Math.PI * ((j + 0.5) / G - 0.5);
        for (let i = 0; i < M; i++) {
          const lon = (i / M) * Math.PI * 2 - Math.PI;
          const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
          const r = radius(x, y, z);
          const g = (j * M + i) * 3;
          grid[g] = (lb.cx || 0) + x * r * lb.ax;
          grid[g + 1] = (lb.cy || 0) + y * r * lb.ay;
          grid[g + 2] = (lb.cz || 0) + z * r * lb.az;
          ext = Math.max(ext, Math.hypot(grid[g], grid[g + 1], grid[g + 2]));
          U[o + j * M + i] = Math.min(TH - 1, Math.floor((0.5 - lat / Math.PI) * TH)) * TW +
            Math.min(TW - 1, Math.floor((lon / (2 * Math.PI) + 0.5) * TW));
        }
      }
      for (let j = 0; j < G; j++) {
        for (let i = 0; i < M; i++) {
          const g = (j * M + i) * 3;
          const iL = ((j * M + (i + M - 1) % M)) * 3, iR = ((j * M + (i + 1) % M)) * 3;
          const jD = ((Math.max(0, j - 1) * M + i)) * 3, jU = ((Math.min(G - 1, j + 1) * M + i)) * 3;
          const ax = grid[iR] - grid[iL], ay = grid[iR + 1] - grid[iL + 1], az = grid[iR + 2] - grid[iL + 2];
          const bx = grid[jU] - grid[jD], by = grid[jU + 1] - grid[jD + 1], bz = grid[jU + 2] - grid[jD + 2];
          // outward normal = (d/dlat) × (d/dlon)
          let nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax;
          let l = Math.hypot(nx, ny, nz);
          const px = grid[g] - (lb.cx || 0), py = grid[g + 1] - (lb.cy || 0), pz = grid[g + 2] - (lb.cz || 0);
          if (l < 1e-9) { nx = px; ny = py; nz = pz; l = Math.hypot(nx, ny, nz) || 1; }
          if (nx * px + ny * py + nz * pz < 0) l = -l;   // keep it pointing outward
          const q = (o + j * M + i) * 3;
          P[q] = grid[g]; P[q + 1] = grid[g + 1]; P[q + 2] = grid[g + 2];
          Nn[q] = nx / l; Nn[q + 1] = ny / l; Nn[q + 2] = nz / l;
        }
      }
      o += G * M;
    });
    const S = sp.S;
    sp.lumpy = { n: total, P, Nn, U, scale: (S / 2 - 1) / ext,
      z: new Float32Array(S * S), out: new Uint32Array(sp.ctx.createImageData(S, S).data.buffer) };
    sp.lumpyImg = new ImageData(new Uint8ClampedArray(sp.lumpy.out.buffer), S, S);
  }

  function drawLumpy(sp, t) {
    const L = sp.lumpy, { body, S } = sp;
    const T = sp.tex.data;
    const per = CHILL_SPIN * Math.sign(body.spin || 1);
    const ph = (t / per) * Math.PI * 2;
    const cp = Math.cos(ph), spn = Math.sin(ph);
    const tr = (body.tilt || 0) * Math.PI / 180, c = Math.cos(tr), s = Math.sin(tr);
    const ir = (body.incl == null ? 12 : body.incl) * Math.PI / 180, ci = Math.cos(ir), si = Math.sin(ir);
    const [lx, ly, lz] = sp.light;
    const tint = body.tint || [1, 1, 1];
    const [fr, fg, fb] = sp.flat;
    const Z = L.z, out = L.out, k = L.scale, C = S / 2;
    Z.fill(-1e9); out.fill(0);
    // body -> view: spin about y, lean the pole toward us, roll by the tilt
    const toView = (x, y, z, res) => {
      const x1 = x * cp + z * spn, z1 = -x * spn + z * cp;
      const y1 = y * ci - z1 * si, z2 = y * si + z1 * ci;
      res[0] = x1 * c - y1 * s; res[1] = x1 * s + y1 * c; res[2] = z2;
    };
    const pv = [0, 0, 0], nv = [0, 0, 0];
    for (let q = 0; q < L.n; q++) {
      const i3 = q * 3;
      toView(L.Nn[i3], L.Nn[i3 + 1], L.Nn[i3 + 2], nv);
      if (nv[2] < -0.2) continue;                         // facing away
      toView(L.P[i3], L.P[i3 + 1], L.P[i3 + 2], pv);
      const ix = (C + pv[0] * k) | 0, iy = (C - pv[1] * k) | 0;
      if (ix < 0 || iy < 0 || ix >= S - 1 || iy >= S - 1) continue;
      const zz = pv[2];
      let r, g, b;
      if (T) { const col = T[L.U[q]]; r = col & 255; g = (col >> 8) & 255; b = (col >> 16) & 255; }
      else { r = fr; g = fg; b = fb; }
      const d = nv[0] * lx + nv[1] * ly + nv[2] * lz;
      const sh = 0.06 + 1.1 * Math.max(0, Math.min(1, d * 1.1 + 0.04));
      r = Math.min(255, r * tint[0] * sh); g = Math.min(255, g * tint[1] * sh); b = Math.min(255, b * tint[2] * sh);
      const px = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
      // 2×2 splat so the sampled surface has no pinholes
      let a = iy * S + ix;
      if (zz > Z[a]) { Z[a] = zz; out[a] = px; }
      if (zz > Z[a + 1]) { Z[a + 1] = zz; out[a + 1] = px; }
      a += S;
      if (zz > Z[a]) { Z[a] = zz; out[a] = px; }
      if (zz > Z[a + 1]) { Z[a + 1] = zz; out[a + 1] = px; }
    }
    sp.ctx.putImageData(sp.lumpyImg, 0, 0);
  }

  // ---- Saturn's rings: the real ring map, ray-traced per pixel ----------
  // The ring map (saturn_ring.png, Solar System Scope) is a radial strip from
  // the inner C ring (left) to the outer A ring (right), with alpha. Every
  // ring pixel is projected onto the tilted ring plane to get its distance
  // from Saturn (-> strip column) and its angle around the planet. The ring
  // particles orbit (inner faster than outer, like real Kepler orbits); faint
  // clumps along each ringlet make that motion visible. Saturn's shadow falls
  // across the rings, and the near half is drawn over the planet, the far
  // half behind it.
  // radii in planet radii; Uranus' rings are narrow, dark and synthesised
  // from their measured radii (6, 5, 4, alpha, beta, eta, gamma, delta, epsilon).
  const RING_SPAN = { saturn: [1.11, 2.33], uranus: [1.60, 2.06] };
  const RW = 1024;
  let ringTex = null, uranusRingTex = null;
  function loadRingTex(type) {
    if (type === 'uranus') {
      if (uranusRingTex) return uranusRingTex;
      const d = new Uint8ClampedArray(RW * 4);
      const [a0, a1] = RING_SPAN.uranus;
      const rings = [[1.637, .004, 70], [1.652, .004, 70], [1.666, .004, 80], [1.750, .006, 110],
        [1.786, .006, 110], [1.846, .004, 90], [1.863, .004, 100], [1.891, .005, 120], [2.000, .014, 210]];
      for (let k = 0; k < RW; k++) {
        const rad = a0 + (k + 0.5) / RW * (a1 - a0);
        let al = 0;
        rings.forEach(([rc, hw, op]) => { if (Math.abs(rad - rc) < hw) al = Math.max(al, op); });
        d[k * 4] = 150; d[k * 4 + 1] = 160; d[k * 4 + 2] = 170; d[k * 4 + 3] = al;
      }
      uranusRingTex = { ready: true, data: d };
      return uranusRingTex;
    }
    if (ringTex) return ringTex;
    ringTex = { ready: false, data: null };
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = RW; c.height = img.height || 1;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, RW, c.height);
        ringTex.data = g.getImageData(0, Math.floor(c.height / 2), RW, 1).data;
      } catch (e) { ringTex.data = null; }
      ringTex.ready = true;
    };
    img.onerror = () => { ringTex.ready = true; };
    img.src = (window.SOLAR_TEX && window.SOLAR_TEX.saturn_ring) || (TEX_BASE + 'saturn_ring.png');
    return ringTex;
  }

  function buildRing(sp) {
    const { S, N, body } = sp;
    const R = N / 2, C = S / 2;
    const t = (body.tilt || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    const i = (body.incl == null ? 12 : body.incl) * Math.PI / 180;
    const ci = Math.cos(i), si = Math.max(1e-3, Math.sin(i));
    const [RIN, ROUT] = RING_SPAN[body.ring] || RING_SPAN.saturn;
    const L = { idx: [], u: [], ang: [], w: [], px: [], py: [], pz: [], front: [] };
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = (x + 0.5 - C) / R, dy = (C - (y + 0.5)) / R;
        const x1 = dx * c + dy * s, y1 = -dx * s + dy * c;
        const z = -y1 * ci / si;              // depth of the ring plane here
        const z2 = -y1 / si;
        const rad = Math.hypot(x1, z2);
        if (rad < RIN || rad > ROUT) continue;
        L.idx.push(y * S + x);
        L.u.push(Math.min(RW - 1, Math.floor((rad - RIN) / (ROUT - RIN) * RW)));
        L.ang.push(Math.atan2(x1, z2));
        L.w.push(0.9 * Math.pow(rad, -1.5));  // angular speed, rad/s (calm)
        L.px.push(dx); L.py.push(dy); L.pz.push(z);
        L.front.push(z > 0 ? 1 : 0);
      }
    }
    // per-ringlet random phases for the orbiting clumps
    const ph1 = new Float32Array(RW), ph2 = new Float32Array(RW);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < RW; k++) { ph1[k] = rnd() * 6.283; ph2[k] = rnd() * 6.283; }

    const mk = () => {
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      const g = cv.getContext('2d'); const im = g.createImageData(S, S);
      return { cv, g, im, buf: new Uint32Array(im.data.buffer) };
    };
    sp.ringLut = {
      n: L.idx.length, idx: Int32Array.from(L.idx), u: Int32Array.from(L.u),
      ang: Float32Array.from(L.ang), w: Float32Array.from(L.w),
      px: Float32Array.from(L.px), py: Float32Array.from(L.py), pz: Float32Array.from(L.pz),
      front: Uint8Array.from(L.front), ph1, ph2
    };
    sp.ringBack = mk(); sp.ringFront = mk();
    sp.ringTex = loadRingTex(body.ring);
  }

  // Uranus' real rings, drawn live instead of from a strip: nine narrow dark
  // ringlets at their measured radii, several slightly ECCENTRIC (off-centre
  // ovals), and the bright epsilon ring that is thin on one side and ~5×
  // wider on the other. The ovals swing round as the particles orbit, so the
  // rings visibly turn. [radius, half-width, eccentricity, brightness]
  const URANUS_RINGS = [
    [1.637, .0025, .010, .35], [1.652, .0025, .010, .35], [1.666, .0025, .006, .4],
    [1.750, .004, .008, .5], [1.786, .004, .010, .5], [1.846, .0025, .002, .4],
    [1.863, .003, .004, .45], [1.891, .004, .003, .55]
  ];
  function renderUranusRing(sp, t) {
    const RL = sp.ringLut;
    const [RIN, ROUT] = RING_SPAN.uranus;
    const [lx, ly, lz] = sp.light;
    const bb = sp.ringBack.buf, fb = sp.ringFront.buf;
    for (let k = 0; k < RL.n; k++) {
      const rad = RIN + (RL.u[k] + 0.5) / RW * (ROUT - RIN);
      const a = RL.ang[k] + t * RL.w[k] * 1.6;
      const ca = Math.cos(a);
      let al = 0, br = 0;
      for (let q = 0; q < URANUS_RINGS.length; q++) {
        const R0 = URANUS_RINGS[q];
        const rc = R0[0] * (1 + R0[2] * ca);
        const w = R0[1] * (1 + 0.8 * ca);
        const d = Math.abs(rad - rc);
        if (d < w) { al = Math.max(al, 1 - d / w); br = Math.max(br, R0[3]); }
      }
      // epsilon: eccentric, 20 km wide at one end, ~100 km at the other
      const ecc = 2.0 * (1 + 0.008 * ca);
      const ew = 0.004 + 0.012 * (1 + ca) / 2;
      const de = Math.abs(rad - ecc);
      if (de < ew) { al = Math.max(al, 1 - (de / ew) ** 2); br = Math.max(br, 0.75 + 0.2 * Math.sin(a * 5)); }
      const out = RL.front[k] ? fb : bb;
      if (al <= 0) { out[RL.idx[k]] = 0; continue; }
      const px = RL.px[k], py = RL.py[k], pz = RL.pz[k];
      const b = px * lx + py * ly + pz * lz, cc = px * px + py * py + pz * pz - 1;
      const sh = (b < 0 && b * b - cc > 0) ? 0.3 : 1;
      const v = br * sh;
      const r = 150 * v + 25, g = 165 * v + 28, bl = 180 * v + 32;
      out[RL.idx[k]] = (((al * 235) | 0) << 24) | ((bl | 0) << 16) | ((g | 0) << 8) | (r | 0);
    }
    sp.ringBack.g.putImageData(sp.ringBack.im, 0, 0);
    sp.ringFront.g.putImageData(sp.ringFront.im, 0, 0);
    return true;
  }

  function renderRing(sp, t) {
    if (sp.body.ring === 'uranus') return renderUranusRing(sp, t);
    const RL = sp.ringLut, T = sp.ringTex.data;
    if (!T) return false;
    const [lx, ly, lz] = sp.light;
    const bb = sp.ringBack.buf, fb = sp.ringFront.buf;
    for (let k = 0; k < RL.n; k++) {
      const u = RL.u[k], o = u * 4;
      const ta = T[o + 3];
      const out = RL.front[k] ? fb : bb;
      if (ta < 3) { out[RL.idx[k]] = 0; continue; }
      const a = RL.ang[k] + t * RL.w[k];
      // orbiting clumps: brightness ripples that travel round each ringlet
      const m = 0.8 + 0.13 * Math.sin(a * 7 + RL.ph1[u]) + 0.07 * Math.sin(a * 23 + RL.ph2[u]);
      // Saturn's shadow: does a ray from this ring point toward the light hit the planet?
      const px = RL.px[k], py = RL.py[k], pz = RL.pz[k];
      const b = px * lx + py * ly + pz * lz;
      const cc = px * px + py * py + pz * pz - 1;
      const sh = (b < 0 && b * b - cc > 0) ? 0.22 : 1;
      const f = m * sh;
      const r = Math.min(255, T[o] * f), g = Math.min(255, T[o + 1] * f), bl = Math.min(255, T[o + 2] * f);
      out[RL.idx[k]] = (ta << 24) | ((bl | 0) << 16) | ((g | 0) << 8) | (r | 0);
    }
    sp.ringBack.g.putImageData(sp.ringBack.im, 0, 0);
    sp.ringFront.g.putImageData(sp.ringFront.im, 0, 0);
    return true;
  }

  // Decode every map up front (they're baked in the page already), so by the
  // time a spread opens its textures are usually ready and it shows at once.
  Object.keys(BODIES).forEach(k => {
    const b = BODIES[k];
    loadTex(b.tex, b.enhance);
    if (b.clouds) loadTex(b.clouds);
    if (b.ring === 'saturn') loadRingTex('saturn');
  });

  // ---- scenes: mount spheres over the SVG markers ------------------------
  // The sphere holder is sized/centred in px to EXACTLY the box the SVG's
  // viewBox renders into (preserveAspectRatio "meet"), refreshed every frame,
  // so planets sit on their drawn orbit lines at any slot size.
  const scenes = new Set();

  function fitBox(layer, vb) {
    const W = layer.clientWidth || 1, H = layer.clientHeight || 1;
    const s = Math.min(W / vb.width, H / vb.height);
    return { s, w: vb.width * s, h: vb.height * s,
      x: (W - vb.width * s) / 2, y: (H - vb.height * s) / 2 };
  }

  function mountScene(svg, maxN) {
    svg.setAttribute('data-mounted', '1');
    const layer = svg.parentElement;
    const vb = svg.viewBox.baseVal;
    const fit = fitBox(layer, vb);

    const holder = document.createElement('div');
    holder.className = 'solar-layer';
    layer.appendChild(holder);

    // hidden until EVERY body (and Saturn's ring map) is ready, then drawn
    // and revealed in one frame — no planet or ring pops in late
    holder.style.visibility = 'hidden';
    const scene = { holder, layer, vb, items: {}, list: [], shown: false };
    svg.querySelectorAll('[data-body]').forEach(m => {
      const key = m.getAttribute('data-body');
      const id = m.getAttribute('data-id') || key;
      const r = +m.getAttribute('r');
      const sp = createSphere(key, 2 * r * fit.s, maxN || 520);

      const wrap = document.createElement('div');
      wrap.className = 'solar-body' + (sp.body.emissive ? ' is-star' : '');
      wrap.style.width = (2 * r / vb.width * 100) + '%';
      sp.canvas.style.width = (sp.ratio * 100) + '%';
      wrap.appendChild(sp.canvas);
      holder.appendChild(wrap);

      const item = {
        id, sp, wrap,
        x: +m.getAttribute('cx'), y: +m.getAttribute('cy'),
        a: +m.getAttribute('data-a') || 0,
        b: +m.getAttribute('data-b') || 0,
        period: +m.getAttribute('data-period') || 0,
        phase: (+m.getAttribute('data-phase') || 0) * Math.PI / 180,
        around: m.getAttribute('data-around'),
        lit: m.getAttribute('data-lit')       // id of the body that lights it
      };
      item.ox = item.x; item.oy = item.y;     // orbit centre (if no `around`)
      scene.items[id] = item;
      scene.list.push(item);
    });
    scenes.add(scene);
    updateScene(scene, performance.now() / 1000);
  }

  function updateScene(scene, t) {
    const { vb, holder } = scene;
    const fit = fitBox(scene.layer, vb);
    holder.style.left = fit.x + 'px';
    holder.style.top = fit.y + 'px';
    holder.style.width = fit.w + 'px';
    holder.style.height = fit.h + 'px';

    // orbits (parents before children: list order = marker order)
    scene.list.forEach(it => {
      if (it.period) {
        const centre = it.around ? scene.items[it.around] : null;
        const cx = centre ? centre.x : it.ox, cy = centre ? centre.y : it.oy;
        const th = it.phase + (t / it.period) * Math.PI * 2;
        it.x = cx + it.a * Math.cos(th);
        it.y = cy + it.b * Math.sin(th);
      }
      it.wrap.style.left = ((it.x - vb.x) / vb.width * 100) + '%';
      it.wrap.style.top = ((it.y - vb.y) / vb.height * 100) + '%';
      // a moon in front of its planet when on the near side, behind otherwise
      it.wrap.style.zIndex = String(1000 + Math.round(it.y * 4));
    });
    // light each body from its star (direction in the picture plane)
    scene.list.forEach(it => {
      const src = it.lit && scene.items[it.lit];
      if (!src) return;
      it.sp.light = norm3(src.x - it.x, it.y - src.y,
        0.35 * Math.hypot(src.x - it.x, src.y - it.y) + 1e-3);
    });
  }

  function spReady(sp) {
    return sp.tex.ready && (!sp.clouds || sp.clouds.ready) &&
      (!sp.ringTex || sp.ringTex.ready);
  }

  function frame(now) {
    const t = now / 1000;
    scenes.forEach(sc => {
      if (!sc.holder.isConnected) { scenes.delete(sc); return; }
      updateScene(sc, t);
      if (!sc.shown && sc.list.every(it => spReady(it.sp))) {
        sc.list.forEach(it => drawSphere(it.sp, t));
        sc.holder.style.visibility = '';
        sc.shown = true;
      }
    });
    live.forEach(sp => {
      if (!sp.canvas.isConnected) { live.delete(sp); return; }
      if (spReady(sp)) drawSphere(sp, t);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function scan() {
    document.querySelectorAll('.obj-host .layer > svg[data-solar]:not([data-mounted])')
      .forEach(svg => mountScene(svg, 520));
  }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });

  // ---- zoom: the WHOLE picture flies to the centre and fills the screen ---
  // Tapping anywhere on a page's picture rebuilds the same scene at screen
  // size (sharp, high-res spheres) in a fixed overlay, flown from the
  // picture's spot. Orbits and spins are driven by the shared clock, so the
  // big copy is in step with the small one. Tap again (or Esc) to fly back.
  let zoom = null;     // { overlay, box, host, busy }
  const ZOOM_MS = 900;   // fly time, both ways

  // Deep-space backdrop for the zoom: stars of a few sizes plus soft, coloured
  // nebula clouds. Built once (seeded, so it's the same every time).
  let skyHTML = null;
  function zoomSky() {
    if (skyHTML) return skyHTML;
    let s = 2024;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const neb = [
      [260, 220, 420, 'rgba(120,70,200,0.32)'], [1300, 260, 380, 'rgba(40,120,210,0.30)'],
      [1180, 760, 460, 'rgba(200,70,130,0.24)'], [420, 760, 360, 'rgba(40,160,170,0.22)'],
      [800, 120, 300, 'rgba(230,140,70,0.14)']
    ];
    let defs = '', clouds = '';
    neb.forEach(([x, y, r, c], i) => {
      defs += `<radialGradient id="zn${i}"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient>`;
      // each nebula = a few overlapping, stretched blobs so it isn't a plain disc
      for (let k = 0; k < 4; k++) {
        const bx = x + (rnd() - 0.5) * r, by = y + (rnd() - 0.5) * r * 0.6;
        const rx = r * (0.5 + rnd() * 0.6), ry = rx * (0.35 + rnd() * 0.5);
        clouds += `<ellipse cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="url(#zn${i})" transform="rotate(${(rnd() * 180).toFixed(0)} ${bx.toFixed(0)} ${by.toFixed(0)})"/>`;
      }
    });
    let stars = '';
    for (let i = 0; i < 700; i++) {
      const x = rnd() * 1600, y = rnd() * 900, r = 0.3 + rnd() * rnd() * 1.9;
      const hue = rnd() < 0.15 ? '#ffd9b0' : (rnd() < 0.2 ? '#bcd4ff' : '#ffffff');
      stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" fill="${hue}" opacity="${(0.3 + rnd() * 0.7).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 14; i++) {      // a few bright stars with a glow
      const x = rnd() * 1600, y = rnd() * 900;
      stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="rgba(255,255,255,0.12)"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="1.8" fill="#fff"/>`;
    }
    skyHTML = `<svg class="solar-zoom-sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${clouds}${stars}</svg>`;
    return skyHTML;
  }

  function flyFrom(rect, box, D) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = rect.width / D;
    const dx = rect.left + rect.width / 2 - vw / 2;
    const dy = rect.top + rect.height / 2 - vh / 2;
    box.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${s})`;
  }

  function openZoom(host) {
    if (zoom) return;
    finishClose();
    const srcLayer = host.querySelector('.layer');
    const srcSvg = srcLayer && srcLayer.querySelector('svg[data-solar]');
    if (!srcSvg) return;

    // Zoom so the picture's CONTENT fills the screen. Wide, flat scenes (the
    // intro's orbits) declare their content box in data-zoom-fit="x y w h"
    // (viewBox units, centred on the viewBox) so they aren't letterboxed.
    const vw = window.innerWidth, vh = window.innerHeight;
    const vb = srcSvg.viewBox.baseVal;
    const fitAttr = srcSvg.getAttribute('data-zoom-fit');
    const [, , fw, fh] = fitAttr ? fitAttr.split(/\s+/).map(Number) : [0, 0, vb.width, vb.height];
    const D = Math.min(vw * 0.96 * vb.width / fw, vh * 0.96 * vb.height / fh);
    const overlay = document.createElement('div');
    overlay.className = 'solar-zoom';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Enlarged picture (tap to return)');
    overlay.innerHTML = zoomSky();
    const box = document.createElement('div');
    box.className = 'solar-zoom-box';
    box.style.width = D + 'px';
    box.style.height = D + 'px';
    const svg = srcSvg.cloneNode(true);
    svg.removeAttribute('data-mounted');
    box.appendChild(svg);
    overlay.appendChild(box);
    // the name of what's shown (the spread's title), along the bottom
    const titleEl = document.querySelector('.obj-slot.is-text .title-line');
    if (titleEl && titleEl.textContent.trim()) {
      const label = document.createElement('div');
      label.className = 'solar-zoom-name';
      label.textContent = titleEl.textContent.trim();
      overlay.appendChild(label);
      overlay.setAttribute('aria-label', label.textContent + ' (tap to return)');
    }
    document.body.appendChild(overlay);
    mountScene(svg, 900);

    const rect = srcLayer.getBoundingClientRect();
    box.style.transition = 'none';
    flyFrom(rect, box, D);
    srcLayer.style.visibility = 'hidden';
    void box.offsetWidth;
    box.style.transition = `transform ${ZOOM_MS}ms cubic-bezier(.2,.8,.2,1)`;
    box.style.transform = 'translate(-50%, -50%)';
    overlay.classList.add('is-open');

    // two-finger pinch inside the zoom (touch screens only). It moves a
    // full-screen wrapper whose transform-origin IS the screen centre, so the
    // gesture maths in pinch.js maps 1:1 and the zoom stays under the fingers.
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const pan = document.createElement('div');
    pan.className = 'solar-zoom-pan';
    overlay.insertBefore(pan, box);
    pan.appendChild(box);
    const pz = touch && window.Pinch ? window.Pinch({
      max: 3,
      apply: (s, x, y) => { pan.style.transform = `translate(${x}px, ${y}px) scale(${s})`; }
    }) : null;
    zoom = { overlay, box, pan, D, srcLayer, busy: true, pz };
    setTimeout(() => { if (zoom) zoom.busy = false; }, ZOOM_MS);
  }

  // Closing hands the page back at once: the overlay stops catching input
  // (and drops the zoom-out cursor) the moment you tap, while the picture
  // finishes flying home underneath — so you can keep reading/turning.
  let closing = null;
  function finishClose() {
    if (!closing) return;
    clearTimeout(closing.timer);
    closing.srcLayer.style.visibility = '';
    closing.overlay.remove();
    closing = null;
  }
  function closeZoom() {
    if (!zoom || zoom.busy) return;
    const z = zoom;
    zoom = null;
    finishClose();
    z.pan.style.transition = 'transform 300ms ease'; z.pan.style.transform = '';   // back to 1x
    z.overlay.classList.add('is-closing');
    if (z.srcLayer.isConnected) flyFrom(z.srcLayer.getBoundingClientRect(), z.box, z.D);
    else z.box.style.opacity = '0';
    z.overlay.classList.remove('is-open');
    closing = z;
    z.timer = setTimeout(finishClose, ZOOM_MS);
  }

  // Capture-phase listeners run before the engine's window listeners, so a
  // tap on the picture (or anywhere while zoomed) never turns the page.
  // Swipes that start on the picture still reach the engine and turn it.
  function solarHost(target) {
    const h = target && target.closest ? target.closest('.obj-host') : null;
    return h && h.querySelector('svg[data-solar]') ? h : null;
  }

  let press = null;
  window.addEventListener('pointerdown', e => {
    if (zoom && zoom.pz) zoom.pz.feed(e);
    if (zoom && press) { e.stopImmediatePropagation(); return; }   // a 2nd finger
    press = { x: e.clientX, y: e.clientY, host: solarHost(e.target) };
    if (zoom || press.host) e.stopImmediatePropagation();   // engine ignores it
  }, true);

  window.addEventListener('pointermove', e => {
    if (!zoom || !zoom.pz) return;
    zoom.pz.feed(e);
    e.stopImmediatePropagation();
  }, true);
  window.addEventListener('pointercancel', e => {
    if (zoom && zoom.pz) zoom.pz.feed(e);
    if (zoom && zoom.pz && !zoom.pz.active()) press = null;
  }, true);

  window.addEventListener('pointerup', e => {
    const p = press; press = null;
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    const tap = Math.hypot(dx, dy) < 10;
    if (zoom) {
      e.stopImmediatePropagation();
      if (zoom.pz) {
        zoom.pz.feed(e);
        if (zoom.pz.active()) { press = p; return; }      // fingers still down
        if (zoom.pz.gestured()) return;                    // it was a pinch / pan
      }
      if (tap) closeZoom();
      return;
    }
    if (!p.host) return;
    e.stopImmediatePropagation();
    if (tap) { if (solarHost(e.target) === p.host) openZoom(p.host); return; }
    // a swipe that began on the picture: turn the page via the keyboard path
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) {
      window.dispatchEvent(new KeyboardEvent('keydown',
        { key: dx < 0 ? 'ArrowRight' : 'ArrowLeft' }));
    }
  }, true);

  // iOS Safari ignores the viewport's no-zoom setting and pinch-zooms the
  // whole page via gesture* events; cancel those while the zoom is open
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t =>
    window.addEventListener(t, e => { if (zoom) e.preventDefault(); }, { passive: false, capture: true }));

  window.addEventListener('keydown', e => {
    if (!zoom) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeZoom();
  }, true);
})();
