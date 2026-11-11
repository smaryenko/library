// SEASONS book — the red fox (realistic, painted fur).
//
// buildFox(cfg) draws an adult red fox (Vulpes vulpes) with FurPaint: every
// body region is a silhouette polygon filled with thousands of hair strokes
// whose direction, colour and light follow real fox anatomy and markings
// (rufous back, white bib + cheeks + tail tip, black ear backs and
// "stockings", grizzled dark tail). Eyes / nose / mouth are crisp vector on
// top. Proportions taken from the reference photos (never shipped).
//
// Fox-local coordinates: ground at y = 0, facing RIGHT, ~390 x 330 units.
// Config axes are SEPARATE fields:
//   pose  'stand' | 'sit' | 'curl'
//   coat  'summer' | 'winter'        (fur length + fullness)
//   light 'day' | 'golden' | 'night' (palette)
//   eyes  'open' | 'closed'
//   head  { dx, dy, rot }  extra head offset/rotation about the neck
//   flip  true = facing left;  x, y, s = placement in scene coords
//   splitFront  near front leg as its own part (for pawing)
// Returns { defs, parts, P, Pxy }. Parts are FLAT data-part groups, each with
// its own no-data-part placement <g>; P / Pxy map fox-local -> scene coords.
(function () {
  'use strict';
  const FP = window.FurPaint;
  const mix = FP.mix;
  const clamp = v => Math.max(0, Math.min(1, v));

  const PAL = {
    day:    { back: '#a9441a', coat: '#dc742f', pale: '#efa765', white: '#f4f0ea', belly: '#d6c9bc',
              black: '#1c1411', ear: '#251812', tailDk: '#5a3320', grizzle: '#b9aa98', light: [1.16, 0.74] },
    golden: { back: '#a8401a', coat: '#e47a30', pale: '#f6b25e', white: '#f7eee2', belly: '#dccab2',
              black: '#1e1410', ear: '#271811', tailDk: '#5e321c', grizzle: '#d8bd96', light: [1.2, 0.72] },
    kit:    { back: '#5a473c', coat: '#866b5a', pale: '#a68c76', white: '#cbbcad', belly: '#b3a292',
              black: '#3a2c26', ear: '#33261f', tailDk: '#4a3a32', grizzle: '#9a8a7c', light: [1.12, 0.78] },
    night:  { back: '#4a2a22', coat: '#7c4636', pale: '#9a6352', white: '#b8bccb', belly: '#9a96a2',
              black: '#0f0d10', ear: '#120e10', tailDk: '#2a1c1c', grizzle: '#7c7a88', light: [1.05, 0.7] }
  };

  // ---------------- standing pose: anatomy polygons ------------------------
  const ST = {
    tail: [[-98, -198], [-130, -188], [-166, -160], [-196, -122], [-218, -84], [-230, -52], [-226, -30],
           [-212, -26], [-198, -36], [-180, -60], [-156, -94], [-128, -128], [-104, -152], [-94, -172]],
    body: [[-104, -200], [-70, -216], [-20, -222], [30, -230], [70, -246], [96, -258], [116, -252],
           [130, -232], [146, -200], [154, -170], [150, -140], [138, -118], [116, -108], [88, -114],
           [50, -118], [10, -112], [-30, -120], [-60, -116], [-86, -112], [-106, -126], [-116, -156], [-114, -182]],
    frontNear: [[101, -118], [125, -116], [121, -92], [117, -40], [118, -12], [127, -5], [125, 0],
                [102, 0], [104, -12], [104, -42], [103, -92]],
    bib: [[104, -240], [150, -238], [155, -212], [155, -180], [151, -148], [142, -124], [130, -112],
          [124, -132], [117, -162], [111, -196], [105, -222]],
    thigh: [[-116, -176], [-96, -194], [-64, -190], [-44, -164], [-44, -134], [-56, -112], [-84, -108], [-108, -124], [-118, -150]],
    hindNear: [[-100, -150], [-60, -150], [-54, -120], [-60, -96], [-66, -76], [-62, -40], [-60, -12],
               [-52, -5], [-54, 0], [-76, 0], [-76, -12], [-80, -40], [-86, -72], [-94, -100], [-102, -126]],
    head: [[88, -282], [104, -292], [132, -292], [148, -282], [154, -264], [164, -244], [150, -236],
           [136, -226], [120, -220], [104, -226], [90, -236], [74, -244], [82, -264]],
    earL: [[88, -280], [72, -318], [78, -322], [108, -290]],
    earR: [[132, -290], [160, -324], [166, -318], [152, -278]]
  };
  const SIT = {
    body: [[-70, -4], [-88, -40], [-90, -90], [-76, -130], [-50, -160], [-16, -190], [12, -214], [40, -222],
           [64, -208], [70, -180], [66, -140], [58, -90], [50, -40], [40, -4]],
    bib: [[2, -232], [58, -230], [66, -200], [64, -160], [58, -120], [48, -90], [36, -66], [26, -90], [16, -140], [8, -190]],
    thigh: [[-86, -30], [-90, -80], [-66, -112], [-34, -100], [-26, -60], [-40, -22]],
    legNear: [[10, -112], [30, -110], [28, -60], [27, -12], [34, -4], [32, 0], [8, 0], [10, -12], [10, -60]],
    paw: [[-82, -14], [-42, -16], [-30, -6], [-34, 0], [-86, 0]],
    tail: [[-98, -6], [-72, -26], [-30, -30], [20, -26], [70, -22], [104, -16], [114, -4], [102, 6], [40, 10], [-20, 10], [-82, 8]]
  };
  const CURL = {
    body: [[-130, -6], [-136, -50], [-110, -92], [-60, -118], [0, -124], [60, -114], [104, -86], [124, -46], [118, -8]],
    tail: [[-128, -8], [-100, -30], [-40, -36], [30, -32], [86, -40], [118, -60], [138, -54], [136, -28], [114, -6], [60, 8], [0, 12], [-80, 10]]
  };
  const NOSE = [119, -236], EYE_L = [104, -262], EYE_R = [134, -262];
  const shift = (pts, dx, dy) => pts.map(p => [p[0] + dx, p[1] + dy]);

  function lightFn(p) {
    const [hi, lo] = p.light;
    return (x, y) => hi + (lo - hi) * clamp((y + 300) / 300) - 0.0004 * x;
  }

  // the white throat / chest bib: soft creamy white, cool grey in shadow,
  // feathered into the orange by interleaved hairs (no hard edge)
  function bibPaint(u, p, pts, E, seed, dens, light) {
    const shadow = mix(p.white, '#9c968f', 0.5);
    const d = (x, y) => Math.hypot((x - E[0]) / E[2], (y - E[1]) / E[3]);
    return FP.paint({ pts, seed, density: dens * 2.4, len: [4, 8], width: [0.35, 0.8], jitter: 0.04,
      base: `url(#${u}-gBib)`, light: (x, y) => 1,
      flow: (x, y) => Math.PI / 2 + (x - E[0]) / E[2] * 0.5,
      color: (x, y, r) => {
        const q = d(x, y), down = clamp((y - E[1] + E[3]) / (2 * E[3]));
        const side = clamp((x - E[0]) / E[2] * 0.5 + 0.5);           // right side = away from light
        let c = mix(mix(p.white, '#efe3d2', 0.35), shadow, clamp(down * 0.6 + side * 0.4));
        if (q > 0.8 && r() < (q - 0.8) * 2.2) c = mix(p.coat, p.pale, r() * 0.5);
        return c;
      } });
  }

  function paintStand(u, p, cfg, rngSeed) {
    const W = cfg.coat === 'winter';
    const L = W ? [5, 10] : [3.5, 7.5];
    const light = lightFn(p);
    const dens = W ? 7 : 8;
    const tailAxis = [[-98, -180], [-222, -34]];
    const ta = Math.atan2(tailAxis[1][1] - tailAxis[0][1], tailAxis[1][0] - tailAxis[0][0]);
    const tailT = (x, y) => {
      const dx = tailAxis[1][0] - tailAxis[0][0], dy = tailAxis[1][1] - tailAxis[0][1];
      return clamp(((x - tailAxis[0][0]) * dx + (y - tailAxis[0][1]) * dy) / (dx * dx + dy * dy));
    };
    const tailPts = W ? ST.tail.map(q => [q[0] + (q[0] + 98) * 0.06, q[1] + (q[1] + 110) * 0.08]) : ST.tail;
    const tail = FP.paint({ pts: tailPts, seed: rngSeed + 1, density: dens * 2, len: [L[0] + 2, L[1] + 4], width: [0.5, 1.2], jitter: 0.07,
      base: p.back, light,
      flow: () => ta,
      color: (x, y, r) => {
        const t = tailT(x, y);
        if (t > 0.9) return p.white;
        if (t > 0.84) return mix(p.tailDk, p.white, (t - 0.84) / 0.06);
        const g = r() > 0.88;
        if (t < 0.4) return g ? p.pale : mix(p.coat, p.back, t / 0.4);
        return g ? p.grizzle : mix(p.back, p.tailDk, (t - 0.4) / 0.44);
      } });

    const legCol = (top, blk) => (x, y) => {
      if (y < top) return p.coat;
      if (y < blk) return mix(p.back, p.black, (y - top) / (blk - top));
      return p.black;
    };
    const legFar = (pts, seed) => FP.paint({ pts, seed, density: dens + 6, len: [2, 4], width: [0.4, 0.9], jitter: 0.06,
      base: `url(#${u}-gLegFar)`, overlay: `url(#${u}-gLegShade)`, light: (x, y) => light(x, y) * 0.78, flow: () => Math.PI / 2, color: legCol(-120, -78) });
    const farLegs = legFar(shift(ST.frontNear, -32, -5), rngSeed + 2) + legFar(shift(ST.hindNear, 28, -5), rngSeed + 3);

    const BIB_E = [132, -182, 22, 64];
    const bib = (x, y) => Math.hypot((x - BIB_E[0]) / BIB_E[2], (y - BIB_E[1]) / BIB_E[3]);
    // with the head lowered (sniffing / digging) the tall neck hump would
    // poke up above the back, so flatten it into the painted neck bridge
    const low = cfg.pose === 'stand' && ((cfg.head || {}).dy || 0) > 20;
    const bodyPts = low ? ST.body.map(q => q[0] >= 60 && q[0] <= 120 && q[1] < -230
      ? [q[0], -230 + (q[0] - 60) * 0.12] : q) : ST.body;
    const body = FP.paint({ pts: bodyPts, seed: rngSeed + 4, density: dens * 2.2, len: L, width: [0.4, 0.95], jitter: 0.06,
      base: `url(#${u}-gBody)`, overlay: `url(#${u}-gShade)`, light,
      flow: (x, y) => x > 112 ? Math.PI / 2 - 0.2 : Math.PI + 0.25 + clamp((y + 160) / 60) * 0.9,
      color: (x, y, r) => {
        const b = bib(x, y);
        if (b < 1.4 && r() < (1.4 - b) * 1.3) return mix(p.white, '#c9c2bc', r() * 0.4);   // white hairs feather out
        if (r() < 0.02) return mix(p.back, '#6a2a12', 0.4);                                  // dark guard hairs
        let c = mix(p.back, p.coat, clamp((y + 236) / 60));                                  // rufous back -> orange
        const flank = Math.exp(-(((y + 168) / 26) ** 2)) * clamp((x + 70) / 60) * clamp((110 - x) / 40);
        c = mix(c, p.pale, flank * 0.35);                                                    // sunlit flank
        if (x > 66 && x < 108 && y > -214) c = mix(c, p.back, 0.22 * Math.exp(-(((x - 86) / 14) ** 2)));  // shoulder crease
        if (y > -132 && x < 100) c = mix(c, p.belly, clamp((y + 132) / 18) * (0.6 + r() * 0.4));          // greyish belly
        return c;
      } });
    // a few long guard hairs along the back + rump for a real silhouette
    const guard = FP.paint({ pts: shift(bodyPts.slice(0, 6), 0, 3).concat([[60, -228], [-20, -206], [-100, -184]]),
      seed: rngSeed + 5, density: 2, len: [L[1], L[1] + 6], width: [0.5, 0.9], base: 'none', light,
      flow: () => Math.PI + 0.3, color: () => p.back, opacity: 0.8 });

    const legNear = (pts, seed, top, blk, g) => FP.paint({ pts, seed, density: dens + 6, len: [2, 4.5], width: [0.4, 0.9], jitter: 0.06,
      base: `url(#${u}-${g})`, overlay: `url(#${u}-gLegShade)`, light, flow: () => Math.PI / 2, color: legCol(top, blk) });
    const bibP = bibPaint(u, p, low ? ST.bib.map(q => [q[0], Math.max(q[1], -222)]) : ST.bib, BIB_E, rngSeed + 8, dens, light);
    const thigh = FP.paint({ pts: ST.thigh, seed: rngSeed + 9, density: dens * 2, len: L, width: [0.45, 1.0], jitter: 0.07,
      base: 'none', light, opacity: 0.55,
      flow: (x, y) => Math.PI / 2 + 0.6 + (y + 190) / 220, color: (x, y) => mix(p.back, p.coat, clamp((y + 200) / 60)) });
    const frontNear = legNear(ST.frontNear, rngSeed + 6, -112, -84, 'gLegF');
    const hindNear = legNear(ST.hindNear, rngSeed + 7, -104, -70, 'gLegH');

    return { tail, farLegs, body: body + guard + bibP, frontNear, hindNear: hindNear + thigh };
  }

  function paintSitCurl(u, p, cfg, seed) {
    const W = cfg.coat === 'winter';
    const L = W ? [5, 10] : [3.5, 7.5];
    const light = lightFn(p), dens = W ? 14 : 16;
    const coatBody = (pts, sd, flow) => FP.paint({ pts, seed: sd, density: dens, len: L, width: [0.45, 1.0], jitter: 0.07,
      base: `url(#${u}-gSit)`, overlay: `url(#${u}-gShadeSit)`, light, flow,
      color: (x, y, r) => {
        if (r() < 0.02) return mix(p.back, '#6a2a12', 0.4);
        let c = mix(p.back, p.coat, clamp((y + 220) / 70));
        c = mix(c, p.pale, 0.35 * Math.exp(-(((x + 40) / 30) ** 2 + ((y + 90) / 50) ** 2)));   // sunlit haunch
        return mix(c, p.back, 0.3 * clamp((x - 20) / 40));                                      // shaded chest side
      } });
    const tailPaint = (pts, sd, tipX) => FP.paint({ pts, seed: sd, density: dens, len: [L[0] + 2, L[1] + 3], width: [0.5, 1.2], jitter: 0.07,
      base: p.back, light: (x, y) => light(x, y) * 1.25, flow: () => 0.04,
      color: (x, y, r) => {
        if (x > tipX + 10) return p.white;
        if (x > tipX) return mix(p.tailDk, p.white, (x - tipX) / 10);
        const t = clamp((x + 100) / (tipX + 100));
        return r() > 0.92 ? p.grizzle : t < 0.6 ? mix(p.coat, p.back, t / 0.6 * 0.6) : mix(p.back, p.tailDk, (t - 0.6) * 2.5);
      } });
    if (cfg.pose === 'sit') {
      const legC = (x, y) => y < -96 ? p.coat : y < -64 ? mix(p.back, p.black, (y + 96) / 32) : p.black;
      const leg = (pts, sd, k) => FP.paint({ pts, seed: sd, density: dens + 6, len: [2, 4.5], width: [0.4, 0.9], jitter: 0.06,
        base: `url(#${u}-gLegF)`, light: (x, y) => light(x, y) * k, flow: () => Math.PI / 2, color: legC });
      return {
        far: leg(shift(SIT.legNear, 24, -3), seed + 1, 0.8) +
          FP.paint({ pts: SIT.paw, seed: seed + 2, density: 20, len: [2, 4], width: [0.4, 0.9], base: p.black, light, flow: () => 0, color: () => p.black }),
        body: coatBody(SIT.body, seed + 3, (x, y) => Math.PI / 2 + 0.25 - clamp((x + 60) / 120) * 0.4) +
          FP.paint({ pts: SIT.thigh, seed: seed + 4, density: dens, len: L, width: [0.45, 1.0], base: 'none', light, opacity: 0.55,
            flow: (x, y) => Math.PI / 2 + 0.7, color: (x, y) => mix(p.back, p.coat, 0.6) }) +
          bibPaint(u, p, SIT.bib, [36, -160, 26, 76], seed + 5, dens / 2, light),
        near: leg(SIT.legNear, seed + 6, 1),
        tailFront: tailPaint(SIT.tail, seed + 7, 88)
      };
    }
    return {
      body: coatBody(CURL.body, seed + 3, (x, y) => Math.atan2(y + 20, x) + Math.PI / 2),
      tailFront: tailPaint(CURL.tail, seed + 7, 110)
    };
  }

  // ---------------- head (shared by every pose) -----------------------------
  function paintHead(u, p, cfg, seed) {
    const light = lightFn(p);
    const W = cfg.coat === 'winter';
    const ear = (pts, s, inner) => FP.paint({ pts, seed: s, density: 12, len: [2, 4], width: [0.6, 1.1],
        base: p.ear, light, flow: () => -Math.PI / 2, color: () => p.ear }) +
      FP.paint({ pts: inner, seed: s + 50, density: 14, len: [3, 6], width: [0.4, 0.8], base: '#d9c7b4',
        light: () => 1, flow: (x, y) => -Math.PI / 2 + (x < 118 ? 0.5 : -0.5), color: () => p.white, opacity: 0.9 });
    const earL = ear(ST.earL, seed + 1, [[92, -282], [79, -310], [100, -288]]);
    const earR = ear(ST.earR, seed + 2, [[136, -288], [158, -314], [149, -282]]);
    const headPts = W ? ST.head.map(q => [q[0] + (q[0] - 119) * 0.06, q[1] + (q[1] + 250) * 0.04]) : ST.head;
    const head = FP.paint({ pts: headPts, seed: seed + 3, density: 26, len: [2, 4], width: [0.4, 0.9], jitter: 0.06,
      base: p.coat, light,
      flow: (x, y) => Math.atan2(y - NOSE[1] + 4, x - NOSE[0]),
      color: (x, y) => {
        const dxc = Math.abs(x - 119);
        if (y > -232) return p.white;                         // chin
        if (y > -250 && dxc > 13) return p.white;             // white cheeks / lips
        if (y > -254 && dxc > 9) return mix(p.coat, p.white, (y + 254) / 6);
        if (dxc < 8 && y > -262) return p.pale;               // lighter muzzle
        return mix(p.back, p.coat, clamp((y + 292) / 24));
      } });
    const lower = FP.paint({ pts: [[78, -244], [96, -252], [106, -246], [112, -240], [119, -236], [126, -240], [132, -246],
        [142, -252], [160, -244], [150, -234], [136, -224], [119, -218], [102, -224], [88, -234]],
      seed: seed + 6, density: 26, len: [2, 4], width: [0.4, 0.8], jitter: 0.04, base: p.white, light,
      flow: (x, y) => Math.atan2(y - NOSE[1] + 4, x - NOSE[0]), color: () => p.white });
    // cheek ruffs: long white hairs flaring out to the sides
    const ruff = (side, s) => FP.paint({
      pts: side < 0 ? [[96, -252], [70, -246], [64, -238], [92, -232]] : [[142, -252], [168, -246], [172, -238], [146, -232]],
      seed: s, density: 5, len: [4, 8], width: [0.4, 0.8], base: 'none', light,
      flow: () => (side < 0 ? Math.PI + 0.3 : -0.3), color: () => p.white, opacity: 0.9 });
    return earL + earR + head + lower + ruff(-1, seed + 4) + ruff(1, seed + 5);
  }

  function face(u, p, closed) {
    const eye = (c, dir) => {
      const [x, y] = c;
      if (closed) return `<path d="M${x - 8} ${y} Q${x} ${y + 3.5} ${x + 8} ${y - 2 * dir}" fill="none" stroke="#130d0b" stroke-width="1.8" stroke-linecap="round"/>`;
      // almond slanting up to the outside, black rim, amber iris, slit pupil
      const ox = x + 9 * dir, ix = x - 8 * dir;
      return `<path d="M${ix} ${y + 2} Q${x - 1 * dir} ${y - 7} ${ox} ${y - 4} Q${x + 2 * dir} ${y + 6} ${ix} ${y + 2} Z" fill="#120c0a"/>
        <ellipse cx="${x + 0.6 * dir}" cy="${y - 0.6}" rx="5" ry="4.4" fill="url(#${u}-iris)"/>
        <ellipse cx="${x + 0.6 * dir}" cy="${y - 0.6}" rx="1.1" ry="3.8" fill="#0d0907"/>
        <path d="M${ix} ${y + 2} Q${x - 1 * dir} ${y - 7} ${ox} ${y - 4}" fill="none" stroke="#120c0a" stroke-width="1.6"/>
        <circle cx="${x + 2.4 * dir}" cy="${y - 2.4}" r="1.1" fill="#fff" opacity="0.92"/>
        <path d="M${ix + 1 * dir} ${y + 3} Q${x - 4 * dir} ${y + 12} ${x - 6 * dir} ${y + 22}" fill="none" stroke="#5a2a14" stroke-width="1.4" opacity="0.3"/>`;
    };
    const [nx, ny] = NOSE;
    return `${eye(EYE_L, -1)}${eye(EYE_R, 1)}
      <path d="M${nx - 7.5} ${ny - 3} C${nx - 7} ${ny - 9} ${nx + 7} ${ny - 9} ${nx + 7.5} ${ny - 3}
               C${nx + 7} ${ny + 2} ${nx + 2} ${ny + 4} ${nx} ${ny + 4} C${nx - 2} ${ny + 4} ${nx - 7} ${ny + 2} ${nx - 7.5} ${ny - 3} Z" fill="url(#${u}-nose)"/>
      <ellipse cx="${nx - 3.5}" cy="${ny - 1}" rx="1.6" ry="1.1" fill="#000"/><ellipse cx="${nx + 3.5}" cy="${ny - 1}" rx="1.6" ry="1.1" fill="#000"/>
      <ellipse cx="${nx - 1.5}" cy="${ny - 5.5}" rx="3" ry="1.2" fill="#fff" opacity="0.4"/>
      <path d="M${nx} ${ny + 4} L${nx} ${ny + 8} M${nx - 9} ${ny + 9} Q${nx - 4} ${ny + 11} ${nx} ${ny + 8} Q${nx + 4} ${ny + 11} ${nx + 9} ${ny + 9}"
            fill="none" stroke="#1d1310" stroke-width="1.3" stroke-linecap="round"/>
      <g stroke="#f4f0ea" stroke-width="0.5" opacity="0.7" fill="none">
        <path d="M${nx - 8} ${ny + 6} Q${nx - 28} ${ny + 2} ${nx - 46} ${ny + 6}"/><path d="M${nx - 8} ${ny + 8} Q${nx - 26} ${ny + 10} ${nx - 42} ${ny + 18}"/>
        <path d="M${nx + 8} ${ny + 6} Q${nx + 28} ${ny + 2} ${nx + 46} ${ny + 6}"/><path d="M${nx + 8} ${ny + 8} Q${nx + 26} ${ny + 10} ${nx + 42} ${ny + 18}"/>
      </g>
      <g fill="#2a1a14" opacity="0.6">${[-1, 1].map(s => [0, 1, 2].map(i =>
        `<circle cx="${nx + s * (7 + i * 3)}" cy="${ny + 4 + i * 0.8}" r="0.5"/>`).join('')).join('')}</g>`;
  }
  function yawnMouth() {
    const [nx, ny] = NOSE;
    return `<path d="M${nx - 10} ${ny + 7} C${nx - 8} ${ny + 26} ${nx + 8} ${ny + 26} ${nx + 10} ${ny + 7} C${nx + 4} ${ny + 10} ${nx - 4} ${ny + 10} ${nx - 10} ${ny + 7} Z" fill="#4a1616"/>
      <path d="M${nx - 6} ${ny + 16} C${nx - 3} ${ny + 23} ${nx + 3} ${ny + 23} ${nx + 6} ${ny + 16} C${nx + 2} ${ny + 18} ${nx - 2} ${ny + 18} ${nx - 6} ${ny + 16} Z" fill="#d4707c"/>
      <path d="M${nx - 9} ${ny + 8} l1.6 4 1.2 -4 M${nx + 9} ${ny + 8} l-1.6 4 -1.2 -4" fill="#f6f1ea"/>`;
  }

  function defs(u, p) {
    const v = (id, y0, y1, stops) => `<linearGradient id="${u}-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}">${
      stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] == null ? 1 : s[2]}"/>`).join('')}</linearGradient>`;
    const kitEye = p === PAL.kit;
    return `<radialGradient id="${u}-iris" cx="0.45" cy="0.4" r="0.6">${kitEye
        ? '<stop offset="0" stop-color="#8fa3b4"/><stop offset="0.6" stop-color="#4a5a6a"/><stop offset="1" stop-color="#1e252c"/>'
        : '<stop offset="0" stop-color="#f9d36a"/><stop offset="0.6" stop-color="#df8f26"/><stop offset="1" stop-color="#7a3e10"/>'}</radialGradient>` +
      v('gBody', -250, -108, [[0, p.back], [0.35, p.coat], [0.85, p.coat], [1, p.belly]]) +
      v('gLegF', -118, 0, [[0, p.coat, 0], [0.08, p.coat], [0.22, p.back], [0.42, p.black], [1, p.black]]) +
      v('gLegH', -150, 0, [[0, p.coat, 0], [0.12, p.coat], [0.3, p.back], [0.55, p.black], [1, p.black]]) +
      v('gLegFar', -140, 0, [[0, p.back], [0.35, p.black], [1, p.black]]) +
      `<radialGradient id="${u}-gBib" cx="0.45" cy="0.4" r="0.62">
        <stop offset="0" stop-color="${p.white}"/><stop offset="0.65" stop-color="${mix(p.white, '#b8b4b4', 0.3)}"/>
        <stop offset="0.9" stop-color="${p.coat}" stop-opacity="0.6"/><stop offset="1" stop-color="${p.coat}" stop-opacity="0"/></radialGradient>` +
      v('gSit', -222, 0, [[0, p.back], [0.4, p.coat], [1, p.coat]]) +
      v('gShadeSit', -230, 0, [[0, '#fff', 0.1], [0.4, '#000', 0], [1, '#000', 0.28]]) +
      v('gShade', -260, -100, [[0, '#fff', 0.12], [0.35, '#000', 0], [0.75, '#000', 0.12], [1, '#000', 0.32]]) +
      v('gThigh', -194, -108, [[0, '#fff', 0.1], [0.5, '#000', 0], [1, '#000', 0.25]]) +
      v('gLegShade', -150, 0, [[0, '#000', 0], [0.3, '#000', 0], [1, '#000', 0.1]]) +
      `<radialGradient id="${u}-nose" cx="0.4" cy="0.3" r="0.7">
        <stop offset="0" stop-color="#3a2e2c"/><stop offset="1" stop-color="#0c0909"/></radialGradient>
      <radialGradient id="${u}-shine" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#fbffd8"/><stop offset="0.4" stop-color="#d8f08a" stop-opacity="0.8"/>
        <stop offset="1" stop-color="#b8e05a" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}-ao" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
  }

  // cache painted fur per look so revisiting a page doesn't repaint
  const cache = {};

  function buildFox(cfg) {
    cfg = Object.assign({ pose: 'stand', coat: 'summer', light: 'day', eyes: 'open',
      head: null, flip: false, x: 180, y: 260, s: 0.5, uid: 'fx', splitFront: false }, cfg || {});
    const u = cfg.uid, p = PAL[cfg.light] || PAL.day;
    const sx = (cfg.flip ? -1 : 1) * cfg.s;
    const place = `translate(${cfg.x.toFixed(1)} ${cfg.y.toFixed(1)}) scale(${sx.toFixed(3)} ${cfg.s.toFixed(3)})`;
    const P = (lx, ly) => `${(cfg.x + sx * lx).toFixed(1)}px ${(cfg.y + cfg.s * ly).toFixed(1)}px`;
    const Pxy = (lx, ly) => [cfg.x + sx * lx, cfg.y + cfg.s * ly];
    // cfg.as: merge the whole animal into ONE data-part (e.g. a kit), no fx
    const part = (name, inner, extra) => cfg.as
      ? (/^fx-/.test(name) ? '' : `<g transform="${place}">${inner}</g>`)
      : `<g data-part="${name}"${extra || ''}><g transform="${place}">${inner}</g></g>`;

    const key = [cfg.pose, cfg.coat, cfg.light, u, ((cfg.head || {}).dy || 0) > 20 ? 'low' : ''].join('/');
    const ck = cache[key] || (cache[key] = { st: cfg.pose === 'stand' ? paintStand(u, p, cfg, 100) : paintSitCurl(u, p, cfg, 200),
      head: paintHead(u, p, cfg, 300) });

    let parts = part('fox-shadow', `<ellipse cx="0" cy="0" rx="${cfg.pose === 'sit' ? 110 : 150}" ry="12" fill="url(#${u}-ao)"/>`);
    let headAt = [0, 0];
    if (cfg.pose === 'stand') {
      const st = ck.st;
      parts += part('fox-tail', st.tail);
      parts += part('fox-leg-far', st.farLegs);
      parts += part('fox-body', st.body);
      parts += part('fox-leg-near', st.hindNear + (cfg.splitFront ? '' : st.frontNear));
      if (cfg.splitFront) parts += part('fox-leg-front', st.frontNear);
    } else if (cfg.pose === 'sit') {
      parts += part('fox-leg-far', ck.st.far);
      parts += part('fox-body', ck.st.body);
      parts += part('fox-leg-near', ck.st.near);
      headAt = [-89, 6];
    } else {
      parts += part('fox-body', ck.st.body);
      headAt = [-52, 200];
    }
    const hd = cfg.head || {};
    const NECK = [118, -226];
    const hr = (hd.rot || 0) + (cfg.pose === 'curl' ? -14 : 0);
    const headT = `translate(${headAt[0] + (hd.dx || 0)} ${headAt[1] + (hd.dy || 0)})` +
      (hr ? ` rotate(${hr} ${NECK[0]} ${NECK[1]})` : '');
    const hsK = cfg.light === 'kit' ? 1.5 : cfg.pose === 'curl' ? 1.0 : 1.22;
    const HS = `translate(119 -246) scale(${hsK}) translate(-119 246)`;
    // a lowered head (sniffing / digging) gets a painted neck that bridges the
    // shoulders to the head, so the head never floats free of the body
    let neck = '';
    if (cfg.pose === 'stand' && (hd.dy || 0) > 20) {
      const ax = 118 + (hd.dx || 0), ay = -226 + hd.dy;
      const pts = [[76, -230], [102, -226], [ax - 4, ay - 22], [ax + 22, ay - 2], [ax + 14, ay + 16],
        [152, -172], [146, -206]];
      const light = lightFn(p);
      neck = FP.paint({ pts, seed: 777, density: 22, len: [3, 6.5], width: [0.4, 0.95], jitter: 0.06,
        base: p.coat, light, flow: (x, y) => Math.atan2(ay - (-250), ax - 90),
        color: (x, y, r) => {
          // the throat / underside of the neck is white, like the bib
          const under = (y - (-252 + (x - 76) * (ay + 20 + 252) / (ax - 76))) / 26;
          if (under > 0.9) return mix(p.white, '#c9c2bc', r() * 0.4);
          if (under > 0.6 && r() < (under - 0.6) * 3) return p.white;
          return mix(p.back, p.coat, clamp(under + 0.4));
        } });
    }
    parts += part('fox-head', `${neck}<g transform="${headT}"><g transform="${HS}">${ck.head}${face(u, p, cfg.eyes === 'closed')}</g></g>`);
    parts += part('fx-yawn', `<g transform="${headT}"><g transform="${HS}">${yawnMouth()}</g></g>`, ' opacity="0"');
    parts += part('fx-eyeshine', `<g transform="${headT}"><g transform="${HS}">
        <circle cx="${EYE_L[0]}" cy="${EYE_L[1]}" r="7" fill="url(#${u}-shine)"/>
        <circle cx="${EYE_R[0]}" cy="${EYE_R[1]}" r="7" fill="url(#${u}-shine)"/></g></g>`, ' opacity="0"');
    if (cfg.pose !== 'stand') parts += part('fox-tail-front', ck.st.tailFront);
    if (cfg.as) parts = `<g data-part="${cfg.as}">${parts}</g>`;
    return { defs: defs(u, p), parts, P, Pxy };
  }

  window.FoxArt = { buildFox, PAL, NOSE, EYE_L, EYE_R };
})();
