// TRAINS book — photo cut-out builder.
//
// Each train page is ONE flat scene SVG (viewBox = the 1500×1000 photo crop)
// fed to the shared engine's mountObject, like every other book. The pop-up
// look comes from layering the same photo several times:
//   tr-photo  the whole photo, furthest back (the "page");
//   tr-body   the train cut out with a polygon clip, lifted forward;
//   tr-front  the nearest end (nose, big wheel, horse…) lifted further;
//   tr-top / tr-near  optional extra cuts (chimney, bell, horse);
//   fx-*      effect-only drawings, hidden at rest, shown by the tap animation.
// The engine splits each data-part onto its own Z layer and parallaxes them,
// so no engine edits are needed. Polygons are in crop pixels (1500×1000).
//
// Animation rules are scoped to this picture's own class (uid): buildAnim's
// selectors match by part name only, so two trains in the page at once (the
// shown page + the prerendered next one) would otherwise run each other's
// keyframes on their fx-tr parts.
//
// Placement never shares an element with an animated transform: the data-part
// group is the animated element, the clip + image sit inside it untransformed.
(function () {
  'use strict';
  let seq = 0;
  const W = 1500, H = 1000;
  const pts = a => a.map(p => p.join(',')).join(' ');

  // cfg: { img, cuts: { 'tr-body': [[x,y]…], 'tr-front': […], … },
  //        fx: { 'fx-tr': '<svg markup>', … }, parts: { name: markup },
  //        tracks: [buildAnim tracks] }
  function buildTrain(cfg) {
    const uid = 'tr' + (++seq);
    const href = 'img/' + cfg.img + '.jpg';
    const image = `<image href="${href}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
    const order = ['tr-body', 'tr-near', 'tr-front', 'tr-top'];
    const cutNames = order.filter(n => cfg.cuts[n]);
    const defs = cutNames.map(n =>
      `<clipPath id="${uid}-${n}"><polygon points="${pts(cfg.cuts[n])}"/></clipPath>`).join('');
    const cuts = cutNames.map(n =>
      `<g data-part="${n}"><g filter="url(#${uid}-lift)"><g clip-path="url(#${uid}-${n})">${image}</g></g></g>`).join('');
    // fx values are markup strings, or functions given the glow-filter url
    const glowUrl = `url(#${uid}-glow)`;
    const fx = Object.keys(cfg.fx || {}).map(n => {
      const v = cfg.fx[n];
      return `<g data-part="${n}" opacity="0">${typeof v === 'function' ? v(glowUrl) : v}</g>`;
    }).join('');
    // parts: extra visible layers drawn over the photo (e.g. clock hands)
    const parts = Object.keys(cfg.parts || {}).map(n =>
      `<g data-part="${n}">${cfg.parts[n]}</g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 ${W + 60} ${H + 60}" data-train="${cfg.img}" class="${uid}">
<defs>
  <clipPath id="${uid}-page"><rect x="0" y="0" width="${W}" height="${H}" rx="28"/></clipPath>
  <filter id="${uid}-lift" x="-10%" y="-10%" width="120%" height="125%">
    <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/>
  </filter>
  <filter id="${uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="8"/>
  </filter>
  ${defs}
</defs>
${buildAnim(uid, { tracks: cfg.tracks || [] }).replace(/svg\.is-playing /g, `svg.${uid}.is-playing `)}
<g data-part="tr-photo"><g clip-path="url(#${uid}-page)">${image}<rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".12"/></g></g>
${cuts}
${parts}
${fx}
</svg>`;
  }

  window.buildTrain = buildTrain;

  // A billowing plume of steam / smoke / snow for an fx-* part (put it in a
  // part whose track just holds opacity 1 for the whole run, see plumeTrack).
  // Many soft puffs, each with its own delay: born small at the source, they
  // swell, rise and drift with the wind, turn thin and fade. A turbulence
  // filter breaks the round edges up into cloudy ones.
  //   { x, y: source; dx, dy: drift over a puff's life; n: puffs; r: start
  //     radius; grow: end scale; life: seconds per puff; every: seconds
  //     between puffs; color, shade: puff light / shadow; opacity }
  let plumeSeq = 0;
  window.plume = function (o) {
    const k = 'pl' + (++plumeSeq) + Math.random().toString(36).slice(2, 5);
    const n = o.n || 10, life = o.life || 1.6, every = o.every || 0.12, grow = o.grow || 3.2;
    const col = o.color || '#f4f4f2', shade = o.shade || '#b9bcc2', op = o.opacity == null ? 0.92 : o.opacity;
    let rnd = (o.seed || 7) * 9301;
    const R = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
    let css = '', puffs = '';
    for (let i = 0; i < n; i++) {
      const wob = (R() - 0.5) * 0.35;
      const ex = o.dx * (0.8 + R() * 0.4) + (o.dy || 0) * wob, ey = o.dy * (0.8 + R() * 0.4) - (o.dx || 0) * wob;
      const r = o.r * (0.8 + R() * 0.5), g = grow * (0.8 + R() * 0.4);
      css += `@keyframes ${k}-${i}{0%{opacity:0;transform:translate(0,0) scale(.25)}` +
        `12%{opacity:${op}}45%{opacity:${(op * 0.8).toFixed(2)};transform:translate(${(ex * 0.45).toFixed(0)}px,${(ey * 0.45).toFixed(0)}px) scale(${(g * 0.55).toFixed(2)})}` +
        `100%{opacity:0;transform:translate(${ex.toFixed(0)}px,${ey.toFixed(0)}px) scale(${g.toFixed(2)})}}` +
        `svg.is-playing .${k}-${i}{animation:${k}-${i} ${life}s ${(i * every).toFixed(2)}s cubic-bezier(.2,.6,.35,1) both}`;
      puffs += `<circle class="${k}-${i}" cx="${o.x + (R() - 0.5) * o.r * 0.6}" cy="${o.y + (R() - 0.5) * o.r * 0.4}" r="${r.toFixed(0)}" fill="url(#${k}-g)" opacity="0" style="transform-box:fill-box;transform-origin:center"/>`;
    }
    return `<defs>
      <radialGradient id="${k}-g" cx="0.4" cy="0.35" r="0.65">
        <stop offset="0" stop-color="${col}"/><stop offset="0.55" stop-color="${col}" stop-opacity="0.85"/>
        <stop offset="0.85" stop-color="${shade}" stop-opacity="0.45"/><stop offset="1" stop-color="${shade}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${k}-f" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${o.seed || 7}" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="${o.billow || 38}" xChannelSelector="R" yChannelSelector="G"/>
      </filter></defs>
      <style>${css}</style>
      <g filter="url(#${k}-f)">${puffs}</g>`;
  };
  // ---- motion helpers: every tap animation is sampled from small physics
  // functions instead of a few hand keyframes, so moves speed up and slow
  // down, overshoot and settle, engines vibrate and lamps warm up.
  //   track(parts, seconds, t => cssDeclarations, { origin, box })  t = 0..1
  window.TM = (function () {
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const r2 = v => Math.round(v * 100) / 100;
    const kf = (fn, n) => { let s = ''; for (let i = 0; i <= n; i++) s += `${(i / n * 100).toFixed(2)}%{${fn(i / n)}}`; return s; };
    const tf = (x = 0, y = 0, r = 0, s = 1) => `transform:translate(${r2(x)}px,${r2(y)}px) rotate(${r2(r)}deg) scale(${s.toFixed(4)})`;
    // fade-in / hold / fade-out envelope
    const env = (t, a = 0.08, b = 0.85) => sm(0, a, t) * (1 - sm(b, 1, t));
    // out and back: speeds up, arrives with a small overshoot, waits, eases home
    const out = (t, at = 0.4, back = 0.7) => {
      const u = cl((t - at) / (back - at), 0, 1);
      const os = t > at && t < back ? Math.sin(u * Math.PI * 3) * Math.exp(-u * 5) * 0.07 : 0;
      return sm(0, at, t) - sm(back, 1, t) + os;
    };
    // a damped spring kicked at t0 (f: wobbles over the whole run, d: damping)
    const spring = (t, t0 = 0, f = 3, d = 4) => (t < t0 ? 0 : Math.sin((t - t0) * f * 2 * Math.PI) * Math.exp(-(t - t0) * d));
    // engine vibration: a new small random offset rate times over the run
    const jitter = (t, amp, rate = 24, seed = 1) => {
      const k = Math.floor(t * rate);
      const r = x => { const v = Math.sin((k + x) * 127.1 * seed + seed) * 43758.5453; return v - Math.floor(v) - 0.5; };
      return [r(1) * amp * 2, r(2) * amp];
    };
    // a steam engine's chuff: a short jolt n times over the run
    const chuff = (t, n = 6) => Math.pow(Math.max(0, Math.sin(t * Math.PI * n)), 6);
    // a lamp: a quick flicker as it strikes, a steady glow, a fade
    const lamp = (t, on = 0.05, off = 0.85) => {
      const w = sm(on, on + 0.1, t) * (1 - sm(off, 1, t));
      return t > on && t < on + 0.14 ? w * (Math.sin(t * 190) > 0 ? 1 : 0.35) : w;
    };
    const track = (parts, secs, fn, o = {}) => Object.assign({ parts, timing: `${secs}s linear`, keyframes: kf(fn, o.n || Math.max(24, Math.round(secs * 30))) },
      o.origin ? { origin: o.origin } : {}, o.box ? { box: o.box } : {});
    const op = v => `opacity:${cl(v, 0, 1).toFixed(2)}`;
    return { cl, sm, tf, env, out, spring, jitter, chuff, lamp, track, op };
  })();

  // Flying bits (snow lumps, sparks, water drops): each thrown from (x, y)
  // with its own speed and falling under gravity, spinning a little and
  // fading at the end. Like plume(), it plays inside an fx part kept
  // visible by plumeTrack().
  //   { x, y, n, vx: [min, max], vy: [min, max] (px/s), g (px/s²), life,
  //     every, size: [min, max], color(s), streak (draw as short lines) }
  let spraySeq = 0;
  window.spray = function (o) {
    const k = 'sp' + (++spraySeq) + Math.random().toString(36).slice(2, 5);
    const n = o.n || 24, life = o.life || 1.2, every = o.every || 0.04, g = o.g == null ? 900 : o.g;
    const cols = [].concat(o.color || '#ffffff');
    let rnd = (o.seed || 5) * 7919;
    const R = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
    const lerp = (a, b, t) => a + (b - a) * t;
    let css = '', bits = '';
    for (let i = 0; i < n; i++) {
      const vx = lerp(o.vx[0], o.vx[1], R()), vy = lerp(o.vy[0], o.vy[1], R());
      const sz = lerp((o.size || [4, 9])[0], (o.size || [4, 9])[1], R()), spin = (R() - 0.5) * 540;
      let kf = '';
      for (let s = 0; s <= 6; s++) {
        const t = s / 6 * life, x = vx * t, y = vy * t + 0.5 * g * t * t;
        const opa = s === 0 ? 0 : (s >= 5 ? (s === 6 ? 0 : 0.7) : 1);
        kf += `${(s / 6 * 100).toFixed(1)}%{opacity:${opa};transform:translate(${x.toFixed(0)}px,${y.toFixed(0)}px) rotate(${(spin * s / 6).toFixed(0)}deg)}`;
      }
      css += `@keyframes ${k}-${i}{${kf}}svg.is-playing .${k}-${i}{animation:${k}-${i} ${life}s ${(i * every).toFixed(2)}s linear both}`;
      const c = cols[i % cols.length];
      bits += o.streak
        ? `<line class="${k}-${i}" x1="${o.x}" y1="${o.y}" x2="${(o.x - vx * 0.03).toFixed(0)}" y2="${(o.y - vy * 0.03).toFixed(0)}" stroke="${c}" stroke-width="${(sz * 0.5).toFixed(1)}" stroke-linecap="round" opacity="0" style="transform-box:fill-box;transform-origin:center"/>`
        : `<ellipse class="${k}-${i}" cx="${o.x}" cy="${o.y}" rx="${sz.toFixed(1)}" ry="${(sz * 0.75).toFixed(1)}" fill="${c}" opacity="0" style="transform-box:fill-box;transform-origin:center"/>`;
    }
    return `<style>${css}</style><g>${bits}</g>`;
  };

  // the fx track that keeps a plume's part visible while its puffs play
  window.plumeTrack = (part, secs) => ({ parts: part, timing: `${secs}s linear`, keyframes: '0%,100%{opacity:1}' });
})();
