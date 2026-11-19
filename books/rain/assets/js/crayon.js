// WHERE DOES RAIN COME FROM?: the crayon kit (from the style preview).
// Drawn the way a five-year-old draws with wax crayons: wobbly thick lines
// whose loops don't quite close, zig-zag scribble colouring that runs over
// the lines and leaves paper showing, bright colours, no shading, no
// perspective. A wax filter breaks every stroke up with paper grain.
// Parts appear one after another in the order a child would draw them
// (stop-motion steps); a tap plays small stepped motions.
// Exposes window.CRAYON: { C, page(seed) }.
(function () {
'use strict';
const D = window.DRAWKIT;
const { rng, spans, blob, f1 } = D;

// ---- tune by eye -------------------------------------------------------------
const W_LINE = 3.2, W_FILL = 3.6;        // crayon widths (viewBox 0..300)
const PLAY = 2.4;                        // tap motion length (engine clears at 2.5 s)
const REVEAL_START = 0.3, REVEAL_STEP = 0.42;   // parts appear in drawing order
const C = {
  blue: '#2f74e0', sky: '#4a8ff0', yellow: '#ffd21f', orange: '#ff8a1f', red: '#e0242a',
  brown: '#8b4a1f', brownD: '#5e2f12', green: '#23a63a', greenD: '#137a2a', pink: '#ff5fa8',
  purple: '#8a4fd8', peach: '#f7a77a', black: '#2a2a2a', grey: '#8a8a8a', greyD: '#5a5a66',
  wall: '#ffb43a', window: '#36a3ff', water: '#2a8ee8', waterL: '#7cc4ff', white: '#ffffff', ice: '#9ad8ff'
};
let seq = 0;

function page(seed = 5) {
  const uid = 'cr' + (++seq);
  const R = rng(seed);
  const parts = {};
  const out = (part, s) => { parts[part] = (parts[part] || '') + s; };
  // a wobbly crayon line through pts (kids' hands shake a little)
  function wobble(pts, closed, amp = 0.9) {
    const src = closed ? pts.concat([pts[0]]) : pts, res = [];
    for (let i = 0; i < src.length - 1; i++) {
      const [ax, ay] = src[i], [bx, by] = src[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 7));
      for (let k = 0; k < n; k++) { const t = k / n; res.push([ax + (bx - ax) * t + (R() - 0.5) * amp * 2, ay + (by - ay) * t + (R() - 0.5) * amp * 2]); }
    }
    const last = src[src.length - 1];
    res.push(closed ? [last[0] + (R() - 0.5) * 3, last[1] + (R() - 0.5) * 3] : last);   // loops don't quite close
    return 'M' + res.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L');
  }
  const K = {
    uid, R, C, PLAY, wobble,
    cls: n => `${uid}-${n}`,
    line(part, pts, c, { closed = false, w = W_LINE, o = 0.95, amp = 0.9 } = {}) {
      out(part, `<path d="${wobble(pts, closed, amp)}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}" stroke-linecap="round" stroke-linejoin="round"/>`);
    },
    // back-and-forth scribble colouring, running past the edges a bit
    scribble(part, poly, c, { a = 0.5, gap = 5.5, w = W_FILL, o = 0.85, over = 3 } = {}) {
      const sp = spans(poly, a, gap, R());
      if (!sp.length) return;
      const pts = [];
      sp.forEach(([p, q], i) => {
        const [s, e] = i % 2 ? [q, p] : [p, q];
        const dx = e[0] - s[0], dy = e[1] - s[1], L = Math.hypot(dx, dy) || 1;
        const os = over * R(), oe = over * R();
        pts.push([s[0] - dx / L * os, s[1] - dy / L * os], [e[0] + dx / L * oe, e[1] + dy / L * oe]);
      });
      out(part, `<path d="${wobble(pts, false, 0.6)}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}" stroke-linecap="round" stroke-linejoin="round"/>`);
    },
    // colour a shape and draw round it
    shape(part, poly, fill, edge, o = {}) { K.scribble(part, poly, fill, o); K.line(part, poly, edge || fill, { closed: true, w: o.lw || W_LINE }); },
    dot: (part, x, y, r, c) => out(part, `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${c}"/>`),
    raw: (part, s) => out(part, s),
    rect: (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
    ring: (cx, cy, r, n = 14) => blob(cx, cy, r, r, R, n, 0.06),
    oval: (cx, cy, rx, ry, n = 16) => blob(cx, cy, rx, ry, R, n, 0.07),
    // wrap what fn() adds to `part` in a group (for tap motions)
    group(part, cls, fn, style = '') {
      const before = (parts[part] || '').length;
      fn();
      const all = parts[part] || '';
      parts[part] = all.slice(0, before) + `<g class="${uid}-${cls}"${style ? ` style="transform-box:view-box;${style}"` : ' style="transform-box:view-box"'}>${all.slice(before)}</g>`;
    },

    // ---- things children draw ----------------------------------------------------
    // the sky: a blue band along the top with a bumpy lower edge
    skyBand(part = 'cr-sky', c = C.sky, y = 40) {
      const poly = [[8, 10], [292, 10], [292, y + 4]];
      for (let x = 292; x >= 8; x -= 20) poly.push([x, y + R() * 8]);
      K.scribble(part, poly, c, { a: -0.15, gap: 4.5, o: 0.8 });
    },
    // a sun with a face; rays in their own group (class `rays`) so they can turn
    sun(part, cx, cy, r = 24, { face = true } = {}) {
      K.scribble(part, K.ring(cx, cy, r), C.yellow, { a: 0.8, gap: 4.2 });
      K.line(part, K.ring(cx, cy, r, 16), C.orange, { closed: true });
      let rays = '';
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * Math.PI * 2 + 0.2, r0 = r + 6, r1 = r + 18 + R() * 8;
        rays += `<path d="${wobble([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], false, 0.6)}" fill="none" stroke="${C.orange}" stroke-width="${W_LINE}" stroke-linecap="round"/>`;
      }
      out(part, `<g class="${uid}-rays" style="transform-box:view-box;transform-origin:${cx}px ${cy}px">${rays}</g>`);
      if (face) {
        K.dot(part, cx - r * 0.33, cy - r * 0.2, 2.6, C.black); K.dot(part, cx + r * 0.3, cy - r * 0.25, 2.6, C.black);
        out(part, `<path d="M${f1(cx - r * 0.42)} ${f1(cy + r * 0.25)}Q${cx} ${f1(cy + r * 0.66)} ${f1(cx + r * 0.46)} ${f1(cy + r * 0.2)}" fill="none" stroke="${C.red}" stroke-width="2.6" stroke-linecap="round"/>`);
      }
    },
    // a bumpy cloud: outline only (white is the paper) or coloured in
    cloud(part, cx, cy, w, h, { fill = null, edge = C.blue, lw = 2.8 } = {}) {
      const pts = [], n = 7;
      for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; pts.push([cx + Math.cos(a) * w, cy + Math.sin(a) * h - (i % 2 ? h * 0.5 : 0)]); }
      pts.push([cx + w * 0.95, cy + h * 0.6], [cx - w * 0.95, cy + h * 0.6]);
      if (fill) K.scribble(part, pts, fill, { a: 0.2, gap: 4.4, o: 0.8 });
      K.line(part, pts, edge, { closed: true, w: lw });
      return pts;
    },
    // a teardrop (raindrop), point up
    drop(part, x, y, s = 1, c = C.water) {
      const pts = [[x, y - 7 * s], [x + 4 * s, y], [x + 3 * s, y + 4 * s], [x, y + 5 * s], [x - 3 * s, y + 4 * s], [x - 4 * s, y]];
      K.scribble(part, pts, c, { a: 1.2, gap: 2.6 * s, w: 2.4 * s, over: 1 });
      K.line(part, pts, C.blue, { closed: true, w: 1.8 * s, amp: 0.4 });
    },
    // a strip of grass with zig-zag blades
    grass(part, y = 250, y1 = 288) {
      const top = [];
      for (let x = 6; x <= 294; x += 6) top.push([x, y - (x / 6 % 2 ? 10 + R() * 5 : 0)]);
      K.scribble(part, [[6, y], [294, y], [294, y1], [6, y1]], C.green, { a: -0.35, gap: 4.6 });
      K.line(part, top, C.greenD, { w: 2.6 });
    },
    // a person: round head, triangle dress / coat, stick arms and legs.
    // arm: 'down' | 'wave' (class `wave`) | 'up' | 'out'; returns hand points
    person(part, x, top, h, { dress = C.purple, hair = '#f2c21b', arm = 'down', boots = null, hat = null, smile = true } = {}) {
      const hr = h * 0.13, hy = top + hr, neck = hy + hr, hem = top + h * 0.72, foot = top + h;
      K.scribble(part, [[x, neck], [x + h * 0.2, hem], [x - h * 0.2, hem]], dress, { a: 1.1, gap: 3.6 });
      K.line(part, [[x, neck], [x + h * 0.2, hem], [x - h * 0.2, hem]], dress, { closed: true, w: 2.6 });
      K.line(part, [[x - 5, hem], [x - 6, foot]], C.black, { w: 2.6 });
      K.line(part, [[x + 5, hem], [x + 6, foot]], C.black, { w: 2.6 });
      if (boots) for (const dx of [-6, 6]) K.shape(part, K.rect(x + dx - 4, foot - 7, x + dx + 4, foot), boots, boots, { gap: 2.4, lw: 2 });
      K.line(part, K.ring(x, hy, hr, 12), C.peach, { closed: true, w: 2.6 });
      for (let i = 0; i < 6; i++) { const a = Math.PI * (1.05 + i * 0.18); K.line(part, [[x + Math.cos(a) * hr, hy + Math.sin(a) * hr], [x + Math.cos(a) * (hr + 6), hy + Math.sin(a) * (hr + 5) + 2]], hair, { w: 2.4 }); }
      if (hat) K.shape(part, [[x - hr - 2, hy - hr * 0.4], [x + hr + 2, hy - hr * 0.4], [x, hy - hr * 2.2]], hat, hat, { gap: 2.6, lw: 2.2 });
      K.dot(part, x - hr * 0.35, hy - 1, 1.7, C.black); K.dot(part, x + hr * 0.35, hy - 1, 1.7, C.black);
      if (smile) out(part, `<path d="M${f1(x - hr * 0.45)} ${f1(hy + hr * 0.35)}Q${x} ${f1(hy + hr * 0.8)} ${f1(x + hr * 0.45)} ${f1(hy + hr * 0.35)}" fill="none" stroke="${C.red}" stroke-width="2" stroke-linecap="round"/>`);
      const sy = neck + h * 0.1, L = [x - h * 0.32, sy + h * 0.12];
      K.line(part, [[x - 4, sy], L], C.black, { w: 2.6 });
      let Rh;
      if (arm === 'wave') { Rh = [x + h * 0.3, sy - h * 0.2]; K.group(part, 'wave', () => K.line(part, [[x + 4, sy], Rh], C.black, { w: 2.6, amp: 0.5 }), `transform-origin:${x + 4}px ${f1(sy)}px`); }
      else if (arm === 'up') { Rh = [x + h * 0.18, sy - h * 0.3]; K.line(part, [[x + 4, sy], Rh], C.black, { w: 2.6 }); }
      else if (arm === 'out') { Rh = [x + h * 0.36, sy]; K.line(part, [[x + 4, sy], Rh], C.black, { w: 2.6 }); }
      else { Rh = [x + h * 0.32, sy + h * 0.12]; K.line(part, [[x + 4, sy], Rh], C.black, { w: 2.6 }); }
      return { L, R: Rh, head: [x, hy], foot };
    },
    // wonky capital letters (a child's spelling): polylines per letter
    word(part, x, y, s, letters, c = C.blue) {
      const G = {
        M: [[[0, 1], [0.1, 0], [0.5, 0.7], [0.9, 0], [1, 1]]], E: [[[0.9, 0], [0, 0], [0, 1], [0.9, 1]], [[0, 0.5], [0.7, 0.5]]],
        S: [[[0.9, 0.1], [0.5, 0], [0.05, 0.25], [0.5, 0.5], [0.95, 0.75], [0.5, 1], [0.05, 0.9]]],
        P: [[[0, 1], [0, 0], [0.8, 0.1], [0.8, 0.45], [0, 0.5]]], L: [[[0, 0], [0, 1], [0.8, 1]]],
        A: [[[0, 1], [0.45, 0], [0.9, 1]], [[0.2, 0.6], [0.7, 0.6]]], H: [[[0, 0], [0, 1]], [[0.8, 0], [0.8, 1]], [[0, 0.5], [0.8, 0.5]]],
        '!': [[[0.3, 0], [0.3, 0.7]], [[0.3, 0.92], [0.32, 1]]]
      };
      let cx = x;
      for (const ch of letters) {
        for (const stroke of G[ch] || []) K.line(part, stroke.map(([u, v]) => [cx + u * s * 0.7, y + v * s + (R() - 0.5) * 2]), c, { w: 2.4, amp: 0.4 });
        cx += s * 0.75 + R() * 2;
      }
    },

    // order: data-part layers in drawing order (back to front); reveal: the
    // same parts in the order they are drawn
    end({ order, reveal = order, css = '', fit = '4 6 292 286', hit = '10 10 280 280' }) {
      const at = p => {
        const i = reveal.indexOf(p), d = REVEAL_START + Math.max(0, i) * REVEAL_STEP;
        return `data-part="${p}" class="${uid}-in" style="animation-delay:${d.toFixed(2)}s" filter="url(#${uid}-wax)"`;
      };
      const body = order.map(p => `<g ${at(p)}>${parts[p] || ''}</g>`).join('');
      const base = `
    .${uid}-in{opacity:0;animation:${uid}-in 0.34s steps(1,end) both}
    @keyframes ${uid}-in{0%{opacity:0}33%{opacity:.4}66%{opacity:.75}100%{opacity:1}}
    @media (prefers-reduced-motion: reduce){.${uid}-in{opacity:1;animation:none}}
    svg.is-playing .${uid}-rays{animation:${uid}-ry ${PLAY}s steps(12,end) both}
    svg.is-playing .${uid}-wave{animation:${uid}-wv 0.6s steps(4,end) 4 both}
    @keyframes ${uid}-ry{to{transform:rotate(60deg)}}
    @keyframes ${uid}-wv{0%,100%{transform:rotate(0)}50%{transform:rotate(-40deg)}}`;
      return `<svg data-crayon="${uid}" viewBox="0 0 300 300" data-fit="${fit}" data-hit="${hit}" xmlns="http://www.w3.org/2000/svg">
    <style>${base}${css}</style>
    <defs>
      <filter id="${uid}-wax" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.95" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in" result="g"/>
        <feDisplacementMap in="g" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    ${body}
  </svg>`;
    }
  };
  return K;
}

window.CRAYON = { C, PLAY, page };
})();
