// Shared MOTION LIBRARY — parametric, composable one-shot moves.
//
// The xmas and race books hand-wrote every keyframe string. That works for one
// part, but it breaks down as soon as a limb has to travel WITH its body and
// ALSO do its own thing (a turtle's flipper stroking while the turtle swims
// off the page): CSS `animation` is not additive, so a part can only run one
// track. This file solves that once, for every book:
//
//   * A move is plain data — a list of STOPS:
//       { at: 0..100, x, y, r, s | sx, sy, kx, o, g, ease }
//     x/y = translate (viewBox units), r = rotate (deg), s/sx/sy = scale,
//     kx = skewX (deg), o = opacity, g = glow radius (px, drop-shadow),
//     ease = how to travel from THIS stop to the next
//     ('smooth' default | 'linear' | 'in' | 'out' | 'snap').
//   * Motion.rig({ dur, parts }) turns named moves into ONE scoped <style>
//     (via the shared buildAnim). Each member may `follow` another member:
//     its transform is then parent-move ∘ own-move, each about its own pivot,
//     written out explicitly (transform-origin 0 0, view-box), so a flipper
//     rides the turtle exactly and still flaps about its own root.
//   * Every track in a rig is sampled on the SAME time grid with the SAME
//     (linear) CSS timing, so parent and child can never drift apart.
//
// The primitives below are distilled from the shipped books (dash = Dasher /
// vroom, hop = Vixen, salto = Blitzen, osc = shimmy / wave / flutter,
// pulse = Cupid, glowPulse = Rudolph, orbit = the loop car) plus new ones
// (approach, tumble, roll, jet, spiralRise, scuttle, recoil, duck, blink,
// puff, spark, rise…). They are BUILDING BLOCKS, not finished animations:
// each picture still composes its own motion from them (with its own
// parameters, timing windows and mixes), and two characters should not end
// up doing the same thing.
//
// Usage (inside a scene builder):
//   const style = Motion.rig({ dur: 1.8, parts: {
//     turtle:   { stops: Motion.dash({ dir: -1 }), pivot: [190, 168] },
//     flipper:  { follow: 'turtle', pivot: [140, 186],
//                 stops: Motion.osc('r', 24, { n: 5 }) },
//     'fx-bubbles': { stops: Motion.rise({ h: 90 }), pivot: [300, 170] }
//   }});
//   // a member with `parts: []` is a virtual parent (no layer of its own).
//   // `parts: ['a','b']` drives several layers with one track.

(function (root) {
  'use strict';

  const KEYS = ['x', 'y', 'r', 'sx', 'sy', 'kx', 'o', 'g'];
  const REST = { x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 0, o: 1, g: 0 };

  const EASE = {
    linear: p => p,
    smooth: p => (1 - Math.cos(Math.PI * p)) / 2,
    in: p => p * p,
    out: p => 1 - (1 - p) * (1 - p),
    snap: p => 1 - Math.pow(1 - p, 3)
  };

  // ---- stop helpers --------------------------------------------------------

  // expand one authored stop into a full stop (every key present)
  function full(s) {
    const o = { at: +s.at || 0 };
    KEYS.forEach(k => { o[k] = REST[k]; });
    if (s.s != null) { o.sx = s.s; o.sy = s.s; }
    KEYS.forEach(k => { if (s[k] != null) o[k] = s[k]; });
    o.ease = s.ease || null;
    return o;
  }

  // sort, drop duplicate times (last one wins), pad 0% and 100% by holding
  function norm(stops) {
    let list = (stops && stops.length ? stops : [{ at: 0 }]).map(full);
    list.sort((a, b) => a.at - b.at);
    const out = [];
    list.forEach(s => {
      if (out.length && Math.abs(out[out.length - 1].at - s.at) < 1e-6) out[out.length - 1] = s;
      else out.push(s);
    });
    if (out[0].at > 0) out.unshift(Object.assign({}, out[0], { at: 0, ease: null }));
    const last = out[out.length - 1];
    if (last.at < 100) out.push(Object.assign({}, last, { at: 100, ease: null }));
    return out;
  }

  // value of a normalised list at time t (0..100)
  function sample(list, t) {
    if (t <= list[0].at) return list[0];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1];
      if (t <= b.at) {
        const span = b.at - a.at;
        const p = span > 0 ? (t - a.at) / span : 1;
        const e = (EASE[a.ease] || EASE.smooth)(p);
        const v = { at: t };
        KEYS.forEach(k => { v[k] = a[k] + (b[k] - a[k]) * e; });
        return v;
      }
    }
    return list[list.length - 1];
  }

  function num(v, d) {
    const n = +(+v).toFixed(d == null ? 1 : d);
    return Math.abs(n) < 1e-9 ? '0' : String(n);
  }

  function uniqTimes(arr) {
    const seen = new Set(), out = [];
    arr.forEach(t => {
      const k = +t.toFixed(3);
      if (!seen.has(k)) { seen.add(k); out.push(k); }
    });
    return out.sort((a, b) => a - b);
  }

  // which transform functions a level actually needs (decided once per level
  // so every keyframe of a track has the same function list → clean CSS
  // interpolation)
  function shape(list) {
    return {
      r: list.some(s => Math.abs(s.r) > 1e-9),
      s: list.some(s => Math.abs(s.sx - 1) > 1e-9 || Math.abs(s.sy - 1) > 1e-9),
      k: list.some(s => Math.abs(s.kx) > 1e-9)
    };
  }

  // one level of the chain: move about pivot (px,py)
  function seg(v, pivot, sh) {
    const px = pivot[0], py = pivot[1];
    if (!sh.r && !sh.s && !sh.k) return `translate(${num(v.x)}px,${num(v.y)}px) `;
    let out = `translate(${num(px + v.x)}px,${num(py + v.y)}px) `;
    if (sh.r) out += `rotate(${num(v.r, 2)}deg) `;
    if (sh.k) out += `skewX(${num(v.kx, 2)}deg) `;
    if (sh.s) out += `scale(${num(v.sx, 3)},${num(v.sy, 3)}) `;
    out += `translate(${num(-px)}px,${num(-py)}px) `;
    return out;
  }

  // ---- the rig -------------------------------------------------------------

  function rig(spec) {
    spec = spec || {};
    const dur = spec.dur || 1.6;
    const step = spec.step || 4;
    const members = spec.parts || {};
    const names = Object.keys(members);
    const lists = {};
    names.forEach(n => { lists[n] = norm(members[n].stops); });

    function chain(n, seen) {
      const m = members[n];
      if (!m) return [];
      seen = seen || {};
      if (seen[n]) return [];
      seen[n] = true;
      const up = m.follow ? chain(m.follow, seen) : [];
      return up.concat([{ list: lists[n], pivot: m.pivot || [0, 0], sh: shape(lists[n]) }]);
    }

    // ONE time grid for the whole rig, plus every authored stop time, so all
    // tracks share keyframe times (parents and children stay locked).
    const grid = [];
    for (let t = 0; t < 100; t += step) grid.push(t);
    grid.push(100);
    names.forEach(n => lists[n].forEach(s => grid.push(s.at)));
    const T = uniqTimes(grid);

    const tracks = [];
    names.forEach(n => {
      const m = members[n];
      const parts = m.parts !== undefined ? [].concat(m.parts) : [n];
      if (!parts.length) return;                    // virtual parent only
      const ch = chain(n);
      const hasO = ch.some(c => c.list.some(s => Math.abs(s.o - 1) > 1e-9));
      const own = lists[n];
      const hasG = own.some(s => s.g > 0);
      const gc = m.glow || 'rgba(255,240,190,0.95)';
      let kf = '';
      T.forEach(t => {
        let tf = '', op = 1, g = 0;
        ch.forEach((c, i) => {
          const v = sample(c.list, t);
          tf += seg(v, c.pivot, c.sh);
          op *= v.o;
          if (i === ch.length - 1) g = v.g;
        });
        let body = `transform:${tf.trim()}`;
        if (hasO) body += `;opacity:${num(Math.max(0, Math.min(1, op)), 3)}`;
        if (hasG) body += `;filter:drop-shadow(0 0 ${num(Math.max(0, g))}px ${gc})`;
        kf += `${num(t, 3)}%{${body}}`;
      });
      tracks.push({ parts, box: 'view-box', origin: '0px 0px',
        timing: `${dur}s linear`, keyframes: kf });
    });

    if (typeof root.buildAnim !== 'function') return '';
    const uid = spec.uid || ('m' + Math.random().toString(36).slice(2, 8));
    return root.buildAnim(uid, { tracks });
  }

  // ---- combinators ---------------------------------------------------------

  // squeeze a whole move into the window [from, to]% (rest/hold outside it)
  function within(stops, from, to) {
    const L = norm(stops);
    const out = L.map(s => Object.assign({}, s, { at: from + (to - from) * s.at / 100 }));
    if (from > 0) out.unshift(Object.assign({}, L[0], { at: 0, ease: null }));
    if (to < 100) out.push(Object.assign({}, L[L.length - 1], { at: 100, ease: null }));
    return out;
  }

  // layer several moves on one part: translations/rotations add, scales and
  // opacities multiply, glow takes the max. Sampled finely, linear between.
  function mix() {
    const Ls = Array.prototype.slice.call(arguments).map(norm);
    const ts = [];
    for (let t = 0; t <= 100; t += 2) ts.push(t);
    Ls.forEach(L => L.forEach(s => ts.push(s.at)));
    return uniqTimes(ts).map(t => {
      const o = { at: t, x: 0, y: 0, r: 0, kx: 0, sx: 1, sy: 1, o: 1, g: 0, ease: 'linear' };
      Ls.forEach(L => {
        const v = sample(L, t);
        o.x += v.x; o.y += v.y; o.r += v.r; o.kx += v.kx;
        o.sx *= v.sx; o.sy *= v.sy; o.o *= v.o; o.g = Math.max(o.g, v.g);
      });
      return o;
    });
  }

  // mirror a move left↔right (for a character drawn facing the other way)
  function mirror(stops) {
    return norm(stops).map(s => Object.assign({}, s, { x: -s.x, r: -s.r, kx: -s.kx }));
  }

  // keep only some channels of a move (e.g. a ground shadow that slides with
  // its owner — keys ['x','o'] — but never lifts or spins)
  function pick(stops, keys) {
    return norm(stops).map(s => {
      const o = { at: s.at, ease: s.ease };
      keys.forEach(k => { o[k] = s[k]; });
      return o;
    });
  }

  // scale the amplitude of translations/rotations (0..1 = gentler copy)
  function amp(stops, f) {
    return norm(stops).map(s => Object.assign({}, s, {
      x: s.x * f, y: s.y * f, r: s.r * f, kx: s.kx * f,
      sx: 1 + (s.sx - 1) * f, sy: 1 + (s.sy - 1) * f
    }));
  }

  // ---- primitives (each returns stops; all start & end at rest) ------------

  // generic oscillator on one channel: n swings of `a`, decaying, inside
  // [from,to]. key 'r' = flap/shimmy/wave, 'sx' = fin flutter (a = depth),
  // 'x' = side-to-side, 'kx' = sway.
  function osc(key, a, opt) {
    opt = opt || {};
    const n = opt.n || 4, decay = opt.decay == null ? 0.85 : opt.decay;
    const from = opt.from || 0, to = opt.to == null ? 100 : opt.to;
    const base = (key === 'sx' || key === 'sy' || key === 's') ? 1 : 0;
    const out = [{ at: 0 }, { at: from }];
    for (let i = 0; i < n; i++) {
      const at = from + (to - from) * (i + 0.5) / n;
      const v = base + (i % 2 ? -1 : 1) * a * Math.pow(decay, i);
      const s = { at };
      s[key] = v;
      out.push(s);
    }
    out.push({ at: to }, { at: 100 });
    return out;
  }

  // dash (xmas Dasher / race vroom): bolt off one side, fade while gone,
  // re-enter from the other side, overshoot, settle.
  function dash(opt) {
    opt = opt || {};
    const dir = opt.dir || -1, dist = opt.dist || 460, tilt = opt.tilt == null ? 6 : opt.tilt;
    const out = opt.out || 32, back = opt.back || 46, over = opt.over == null ? 18 : opt.over;
    return [
      { at: 0 },
      { at: out - 9, x: dir * dist * 0.38, r: dir * tilt, ease: 'in' },
      { at: out, x: dir * dist, r: dir * tilt, o: 0 },
      { at: out + 2, x: -dir * dist, r: dir * tilt, o: 0 },
      { at: back, x: -dir * dist * 0.5, r: dir * tilt * 0.6, ease: 'out' },
      { at: 78, x: dir * over, r: -dir * tilt * 0.4 },
      { at: 100 }
    ];
  }

  // hop (xmas Vixen): crouch, spring up, land with squash
  function hop(opt) {
    opt = opt || {};
    const h = opt.h || 60, q = opt.squash || 0.9, tilt = opt.tilt == null ? 5 : opt.tilt;
    return [
      { at: 0 },
      { at: 14, y: 4, sx: 2 - q, sy: q },
      { at: 46, y: -h, sx: 0.96, sy: 1.06, r: -tilt, ease: 'in' },
      { at: 70, y: -h * 0.5, r: tilt * 0.6 },
      { at: 86, y: 0, sx: 2 - q, sy: q },
      { at: 100 }
    ];
  }

  // salto (xmas Blitzen): crouch, leap and flip, land
  function salto(opt) {
    opt = opt || {};
    const h = opt.h || 70, dir = opt.dir || -1, turns = opt.turns || 1;
    return [
      { at: 0 }, { at: 12, y: 8, sy: 0.94 },
      { at: 55, y: -h, r: dir * 220 * turns },
      { at: 100, r: dir * 360 * turns }
    ];
  }

  // pulse (xmas Cupid's nose): n heart-beat swells
  function pulse(opt) {
    opt = opt || {};
    const s = opt.s || 1.25, n = opt.n || 2;
    const from = opt.from || 0, to = opt.to == null ? 100 : opt.to;
    const out = [{ at: 0 }, { at: from }];
    for (let i = 0; i < n; i++) {
      out.push({ at: from + (to - from) * (i + 0.4) / n, s: 1 + (s - 1) * Math.pow(0.85, i) });
      out.push({ at: from + (to - from) * (i + 0.85) / n, s: 1.02 });
    }
    out.push({ at: to }, { at: 100 });
    return out;
  }

  // glowPulse (xmas Rudolph): swell + bright drop-shadow bloom, twice
  function glowPulse(opt) {
    opt = opt || {};
    const s = opt.s || 1.3, g = opt.g || 18;
    return [
      { at: 0 }, { at: 30, s, g }, { at: 55, s: 1 + (s - 1) * 0.4, g: g * 0.45 },
      { at: 78, s: 1 + (s - 1) * 0.85, g: g * 0.85 }, { at: 100 }
    ];
  }

  // orbit (race loop): a full circle about the member's pivot (put the pivot
  // at the loop centre). Ends at ±360·turns, which looks identical to rest.
  function orbit(opt) {
    opt = opt || {};
    const turns = opt.turns || 1, dir = opt.dir || -1;
    const from = opt.from || 10, to = opt.to || 85;
    return [{ at: 0 }, { at: from }, { at: to, r: dir * 360 * turns }, { at: 100, r: dir * 360 * turns }];
  }

  // path: free-form keyed poses [[at, x, y, r?, extra?], ...]
  function path(points) {
    return points.map(p => Object.assign({ at: p[0], x: p[1] || 0, y: p[2] || 0, r: p[3] || 0 }, p[4] || {}));
  }

  // approach: swim to (dx,dy), give a little nose-bump, hold, swim back
  function approach(opt) {
    opt = opt || {};
    const dx = opt.dx || 0, dy = opt.dy || 0, r = opt.r || 0, bump = opt.bump == null ? 0.18 : opt.bump;
    const a = opt.arrive || 34, l = opt.leave || 66;
    return [
      { at: 0 },
      { at: a, x: dx, y: dy, r, ease: 'out' },
      { at: a + 7, x: dx * (1 + bump), y: dy * (1 + bump), r },
      { at: a + 14, x: dx, y: dy, r },
      { at: l, x: dx, y: dy, r },
      { at: 100 }
    ];
  }

  // tumble: carried away by a current, spinning, then drifting back
  function tumble(opt) {
    opt = opt || {};
    const dx = opt.dx || -80, dy = opt.dy || -36, turns = opt.turns || 1;
    const R = -360 * turns * Math.sign(dx || -1) * -1;
    return [
      { at: 0 },
      { at: 30, x: dx * 0.5, y: dy * 0.7, r: R * 0.35, ease: 'out' },
      { at: 55, x: dx, y: dy, r: R * 0.75 },
      { at: 82, x: dx * 0.3, y: dy * 0.25, r: R * 0.95 },
      { at: 100, r: R }
    ];
  }

  // roll: roll along the ground by dx (radius sets the spin), pause, roll back
  function roll(opt) {
    opt = opt || {};
    const dx = opt.dx || -50, radius = opt.radius || 24;
    const from = opt.from == null ? 36 : opt.from, hold = opt.hold || 74;
    const r = dx / radius * 180 / Math.PI;
    return [
      { at: 0 }, { at: from },
      { at: from + (hold - from) * 0.7, x: dx * 1.06, r: r * 1.06, ease: 'out' },
      { at: hold, x: dx, r },
      { at: 100 }
    ];
  }

  // jet (jellyfish / octopus swim): contract, shoot up, drift back down
  function jet(opt) {
    opt = opt || {};
    const h = opt.h || 60, q = opt.squeeze || 0.84, dx = opt.dx || 0;
    return [
      { at: 0 },
      { at: 18, sx: 1 + (1 - q) * 0.8, sy: q },
      { at: 42, x: dx, y: -h, sx: 1 - (1 - q) * 0.5, sy: 1 + (1 - q) * 0.6, ease: 'out' },
      { at: 70, x: dx * 0.6, y: -h * 0.7 },
      { at: 100 }
    ];
  }

  // spiralRise (seahorse): bob up along a gentle corkscrew and settle
  function spiralRise(opt) {
    opt = opt || {};
    const h = opt.h || 36, rx = opt.rx || 18, tilt = opt.tilt == null ? 6 : opt.tilt, n = opt.n || 10;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ at: t * 100, x: rx * Math.sin(2 * Math.PI * t),
        y: -h * Math.sin(Math.PI * t), r: tilt * Math.sin(2 * Math.PI * t), ease: 'linear' });
    }
    out[0] = { at: 0 }; out[n] = { at: 100 };
    return out;
  }

  // scuttle (crab): quick sideways steps with tiny hops
  function scuttle(opt) {
    opt = opt || {};
    const dist = opt.dist || 22, n = opt.n || 6, hopH = opt.hop == null ? 6 : opt.hop;
    const from = opt.from || 0, to = opt.to == null ? 100 : opt.to;
    const out = [{ at: 0 }, { at: from }];
    for (let i = 0; i < n; i++) {
      const at0 = from + (to - from) * (i + 0.5) / (n + 1);
      const at1 = from + (to - from) * (i + 1) / (n + 1);
      const x = (i % 2 ? -1 : 1) * dist * (i < n - 1 ? 1 : 0.4);
      out.push({ at: at0, x: x * 0.5, y: -hopH, r: (i % 2 ? -3 : 3) });
      out.push({ at: at1, x });
    }
    out.push({ at: to }, { at: 100 });
    return out;
  }

  // recoil (startle): jolt back on `at`, tremble, recover
  function recoil(opt) {
    opt = opt || {};
    const dx = opt.dx || -26, dy = opt.dy || -6, r = opt.r || -12, at = opt.at || 40;
    return [
      { at: 0 }, { at },
      { at: at + 6, x: dx, y: dy, r, ease: 'out' },
      { at: at + 11, x: dx * 0.9, y: dy, r: r * 0.7 },
      { at: at + 16, x: dx * 1.04, y: dy, r },
      { at: at + 21, x: dx * 0.9, y: dy, r: r * 0.8 },
      { at: Math.min(96, at + 40), x: dx * 0.3, y: dy * 0.3 },
      { at: 100 }
    ];
  }

  // duck (peek-a-boo): shrink toward (dx,dy) and vanish, wait, pop back out
  function duck(opt) {
    opt = opt || {};
    const dx = opt.dx || 0, dy = opt.dy || 0, s = opt.s || 0.5;
    const hide = opt.hide || 18, pop = opt.pop || 54;
    return [
      { at: 0 },
      { at: hide, x: dx, y: dy, s, o: 0, ease: 'in' },
      { at: pop - 6, x: dx, y: dy, s, o: 0 },
      { at: pop, s: 1.1, o: 1, ease: 'snap' },
      { at: pop + 8, s: 0.97 },
      { at: pop + 14 },
      { at: 100 }
    ];
  }

  // blink: eyelids shut for a moment at `at` (scaleY about the eye centre)
  function blink(opt) {
    opt = opt || {};
    const at = opt.at || 50, w = opt.w || 4;
    return [{ at: 0 }, { at: at - w }, { at, sy: 0.1 }, { at: at + w }, { at: 100 }];
  }

  // ---- effect primitives (for fx-* parts hidden at rest, opacity 0) --------

  // show: visible from `a`..`d`, fading in a→b and out c→d
  function show(a, b, c, d) {
    return [{ at: 0, o: 0 }, { at: a, o: 0 }, { at: b, o: 1 }, { at: c, o: 1 }, { at: d, o: 0 }, { at: 100, o: 0 }];
  }

  // puff: a cloud / ripple appears, grows, drifts, fades
  function puff(opt) {
    opt = opt || {};
    const dx = opt.dx || 0, dy = opt.dy || 0, s0 = opt.s0 || 0.4, s1 = opt.s1 || 1.7;
    const from = opt.from || 0, to = opt.to == null ? 100 : opt.to, peak = opt.peak || 0.85;
    return [
      { at: 0, o: 0, s: s0 }, { at: from, o: 0, s: s0 },
      { at: from + (to - from) * 0.25, o: peak, x: dx * 0.3, y: dy * 0.3, s: s0 + (s1 - s0) * 0.4, ease: 'out' },
      { at: to, o: 0, x: dx, y: dy, s: s1 },
      { at: 100, o: 0, x: dx, y: dy, s: s1 }
    ];
  }

  // spark: a star glint pops, spins a little, vanishes
  function spark(opt) {
    opt = opt || {};
    const at = opt.at || 50, s = opt.s || 1.2, spin = opt.spin == null ? 45 : opt.spin, w = opt.w || 10;
    return [
      { at: 0, o: 0, s: 0.2 }, { at: at - w, o: 0, s: 0.2 },
      { at, o: 1, s, r: spin * 0.5, ease: 'out' },
      { at: at + w, o: 0, s: s * 0.6, r: spin },
      { at: 100, o: 0, s: 0.2 }
    ];
  }

  // rise: bubbles float up (and drift) while fading out
  function rise(opt) {
    opt = opt || {};
    const h = opt.h || 110, dx = opt.dx || 0;
    const from = opt.from || 0, to = opt.to == null ? 100 : opt.to;
    return [
      { at: 0, o: 0 }, { at: from, o: 0 },
      { at: from + (to - from) * 0.15, o: 1, y: -h * 0.1, x: dx * 0.1 },
      { at: to, o: 0, y: -h, x: dx, ease: 'linear' },
      { at: 100, o: 0, y: -h, x: dx }
    ];
  }

  const Motion = {
    rig, within, mix, mirror, pick, amp,
    osc, dash, hop, salto, pulse, glowPulse, orbit, path,
    approach, tumble, roll, jet, spiralRise, scuttle, recoil, duck, blink,
    show, puff, spark, rise,
    _norm: norm, _sample: sample
  };

  root.Motion = Motion;
  if (typeof module !== 'undefined') module.exports = Motion;
})(typeof window !== 'undefined' ? window : globalThis);
