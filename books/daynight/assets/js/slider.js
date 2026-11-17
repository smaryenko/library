// Bunny Day, Owl Night: the day | night divider.
//
// Every slider page is a pop-up scene (scene.js) whose root <svg> carries
// data-dn-page="i". When the engine puts that picture into its slot, this
// file attaches a divider to it.
//
// The seam lives ON THE PAPER, in perspective: it is a line across the
// printed ground at a fraction s of the ground's width (0 = left edge, 1 =
// right edge). The ground clips its night copy at s in its own (tilted)
// space, so the browser projects it. Each standing piece is clipped where
// that same line passes under its base: the ground's real corners on screen
// are measured (four markers), the seam point at the piece's depth is found
// on screen, and turned into that layer's clip (--dn-cx). So the cut runs
// along the ground and rises straight up through each piece standing on it.
//
//   - the divider is a vertical line on screen; the reveal behind it
//     follows the perspective;
//   - drag the line RIGHT -> night grows, LEFT -> day grows; it follows the
//     finger anywhere along its length;
//   - past 80% towards a side, that side's text shows at the bottom of its
//     page (night bottom-left, day bottom-right); extras fade in from 60%;
//   - release snaps to night, day or the middle; a tap on the moon / sun half
//     of the grip jumps there (again: back to the middle); arrow keys work;
//   - the position is kept across page turns, so either story reads from the
//     first page to the last.
// The divider swallows its own pointer + key events, so dragging it never
// turns the page. No engine changes: a MutationObserver spots each picture
// put into a slot (including a prerendered one).
(function () {
  'use strict';
  const START = 0.5;
  const TEXT_AT = 0.8;
  const FX_FROM = 0.6;
  const SNAP_END = 0.72;
  const GRIP_T = 0.7;          // grip sits this far from the far edge to the near
  const TAP_PX = 8;
  // where each kind of piece stands (ground depth v, 0 far .. 800 near)
  const DEPTH_V = { sky: 22, hill: 70, treeb: 430, tree: 430, owl: 430, decor: 640, prop: 600, cast: 620, fx: 620, bunny: 560, front: 795 };

  const MOON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20.5 4.5a12 12 0 1 0 7 19.8A10 10 0 0 1 20.5 4.5z" fill="#ffe7a3"/><circle cx="12" cy="13" r="1.6" fill="#e9cf86"/><circle cx="15" cy="21" r="2.2" fill="#e9cf86"/></svg>';
  const SUN = '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="#f39a1e" stroke-width="2.6" stroke-linecap="round"><path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4M6.5 6.5l2.8 2.8M22.7 22.7l2.8 2.8M6.5 25.5l2.8-2.8M22.7 9.3l2.8-2.8"/></g><circle cx="16" cy="16" r="7" fill="#ffc531"/></svg>';

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  let shared = START;
  // Where the ground's corners and the picture are on screen. The book and
  // the picture sit in the same place on every page, so this is measured
  // once the page is at rest and reused, instead of measuring mid-turn (the
  // leaf flip and the pop-in animation move things for a moment, which made
  // the divider jump to the right on every turn).
  let geo = null;

  // ---- the printed ground (flat on the paper inside the tilted book) ----
  // The new ground fades in over the old one (which fades out), so a turn
  // never shows a hard swap on the page the leaf is not covering.
  function placeGround(page) {
    const spread = document.querySelector('.book .spread');
    if (!spread) return null;
    spread.querySelectorAll(':scope > .popup-ground:not(.is-out)').forEach(old => {
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 320);
    });
    if (!page || typeof page.ground !== 'function') return null;
    const g = groundCache.get(page) || makeGround(page);
    groundCache.delete(page);
    g.classList.add('is-in');
    spread.appendChild(g);
    return g;
  }
  // The printed grounds of the pages either side are built ahead (when the
  // browser is idle), like the engine's prerendered next picture, so a turn
  // only moves ready elements in instead of parsing two full-spread SVGs.
  const groundCache = new Map();
  function makeGround(page) {
    const g = document.createElement('div');
    g.className = 'popup-ground dn-ground';
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = page.ground() +
      ['tl', 'tr', 'bl', 'br'].map(c => `<i class="dn-corner dn-${c}"></i>`).join('');
    return g;
  }
  let groundIdle = 0;
  function prepareGrounds(i) {
    const pages = window.BOOK_PAGES || [];
    const want = [pages[i + 1], pages[i - 1]].filter(p => p && typeof p.ground === 'function');
    Array.from(groundCache.keys()).forEach(p => { if (want.indexOf(p) < 0) groundCache.delete(p); });
    const todo = want.filter(p => !groundCache.has(p));
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
    const cancel = window.cancelIdleCallback || clearTimeout;
    if (groundIdle) cancel(groundIdle);
    const next = () => {
      groundIdle = 0;
      const p = todo.shift();
      if (!p) return;
      if (!groundCache.has(p)) groundCache.set(p, makeGround(p));
      if (todo.length) groundIdle = idle(next, { timeout: 2500 });
    };
    // after the turn and the engine's own prerender have settled
    setTimeout(() => { groundIdle = idle(next, { timeout: 2500 }); }, 1200);
  }
  function corners(ground) {
    const p = c => { const r = ground.querySelector('.dn-' + c).getBoundingClientRect(); return { x: r.left, y: r.top }; };
    return { tl: p('tl'), tr: p('tr'), bl: p('bl'), br: p('br') };
  }
  // the seam point on screen at ground fraction g, depth t (0 far .. 1 near)
  function seamAt(C, g, t) {
    const lx = lerp(C.tl.x, C.bl.x, t), rx = lerp(C.tr.x, C.br.x, t);
    const ly = lerp(C.tl.y, C.bl.y, t), ry = lerp(C.tr.y, C.br.y, t);
    return { x: lerp(lx, rx, g), y: lerp(ly, ry, g) };
  }
  // the inverse: ground fraction under a screen point
  function fracAt(C, x, y) {
    const t = clamp01((y - (C.tl.y + C.tr.y) / 2) / (((C.bl.y + C.br.y) - (C.tl.y + C.tr.y)) / 2 || 1));
    const lx = lerp(C.tl.x, C.bl.x, t), rx = lerp(C.tr.x, C.br.x, t);
    return clamp01((x - lx) / ((rx - lx) || 1));
  }

  function attach(host) {
    if (host.__dn) return;
    const svg = host.querySelector('.layer svg[data-dn-page]');
    const page = svg && (window.BOOK_PAGES || [])[Number(svg.getAttribute('data-dn-page'))];
    const ground = placeGround(page);
    if (svg) prepareGrounds(Number(svg.getAttribute('data-dn-page')));
    // clip the new ground right away (before the leaf copies it), so the
    // turning page never shows the other half's meadow
    if (ground) { const gw = ground.offsetWidth; reveal(ground.querySelector('.dn-g-night'), 'n', shared, gw); reveal(ground.querySelector('.dn-g-day'), 'd', shared, gw); }
    leafLands(ground);
    // phones (portrait): size the standing scene to the book's near edge, so
    // pieces near the sides (the squirrel) stay on screen
    fitToBook(host, ground);
    if (!svg || svg.hasAttribute('data-dn-still')) {
      document.body.classList.remove('dn-live');
      if (!host.__dnFit) {
        host.__dnFit = true;
        const refit = () => [260, 700].forEach(ms => setTimeout(() => { if (host.isConnected) fitToBook(host, ground); }, ms));
        window.addEventListener('resize', refit);
        window.addEventListener('orientationchange', refit);
      }
      document.body.classList.remove('dn-slider-on');
      captionUnderBook();
      return;
    }
    const scene = host.querySelector('.scene');
    if (!page || !scene) return;
    host.__dn = true;
    if (!isTurning()) setLive(true);
    host.classList.add('dn-host');
    document.body.classList.add('dn-slider-on');

    const nightText = text('dn-text dn-text-night', page.night);
    const dayText = text('dn-text dn-text-day', page.day);

    // the divider: a line drawn on the paper (far edge -> near edge) with a
    // wide invisible grab stroke, and the moon | sun grip on it
    const handle = document.createElement('div');
    handle.className = 'dn-handle';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', 'Night and day. Move right for night, left for day.');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.innerHTML = `<span class="dn-vline" aria-hidden="true"><span class="dn-grab"></span></span><span class="dn-grip">${MOON}${SUN}</span>`;
    // the two story lines sit BELOW the book, so they never cover the
    // characters: a strip under the host's bottom edge (the book's near edge)
    const texts = document.createElement('div');
    texts.className = 'dn-texts';
    texts.append(nightText, dayText);
    host.append(handle, texts);
    const grip = handle.querySelector('.dn-grip');
    const vline = handle.querySelector('.dn-vline');

    // each split layer, with the depth its pieces stand at
    const layers = Array.from(scene.querySelectorAll('.layer')).map(l => {
      const m = /^dn-([dn])-(\w+)/.exec(l.dataset.part || '');
      return m ? { el: l, side: m[1], t: (DEPTH_V[m[2]] == null ? 600 : DEPTH_V[m[2]]) / 800 } : null;
    }).filter(Boolean);

    const gNight = ground && ground.querySelector('.dn-g-night');
    const gDay = ground && ground.querySelector('.dn-g-day');
    const fxN = layers.filter(L => L.el.dataset.part === 'dn-n-fx').map(L => L.el);
    const fxD = layers.filter(L => L.el.dataset.part === 'dn-d-fx').map(L => L.el);
    let s = shared, raf = 0, tween = 0, dragging = false;
    function measure() {
      if (!host.isConnected) return;
      geo = { hr: host.getBoundingClientRect(), C: ground ? corners(ground) : null,
              book: (document.querySelector('.book') || host).getBoundingClientRect(),
              lw: host.clientWidth, gw: ground ? ground.offsetWidth : 0 };
      placeTexts();
    }
    // the texts don't move with the divider: placed once per measure (not
    // every drag frame, which forced a layout each time)
    function placeTexts() {
      const hr = geo.hr;
      // one centred text box (night or day, whichever is revealed), centred
      // on the SCREEN and never wider than it
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const tw = Math.min(vw * 0.92, Math.max(260, geo.book.width * 0.7));
      texts.style.left = `${(vw / 2 - hr.left).toFixed(1)}px`;
      nightText.style.width = dayText.style.width = `${tw.toFixed(0)}px`;
      texts.style.top = `${(textTop(geo.book.bottom + 10, Math.max(nightText.offsetHeight, dayText.offsetHeight), tw) - hr.top).toFixed(1)}px`;
    }
    function render() {
      raf = 0;
      if (!geo) measure();
      const hr = geo.hr;
      const C = ground ? geo.C : null;
      const end = s >= 0.999 ? 1 : s <= 0.001 ? 0 : null;
      // Both scenes stay painted: each half is moved behind a sliding window
      // (translate only), so a drag frame is pure compositing, no repaint
      if (ground) {
        reveal(gNight, 'n', s, geo.gw); reveal(gDay, 'd', s, geo.gw);
      }
      layers.forEach(L => {
        let f = s;
        if (end != null) f = end;
        else if (C && hr.width) f = (seamAt(C, s, L.t).x - hr.left) / hr.width;
        reveal(L.el, L.side, f, geo.lw);
      });
      // the divider stays a plain vertical line on screen; it crosses the
      // ground's seam at the grip's depth (the reveal itself follows the
      // perspective, above)
      // moved with transforms (no layout per frame)
      let gx, gy;
      if (C && hr.width) {
        const g = seamAt(C, s, GRIP_T);
        gx = g.x - hr.left; gy = g.y - hr.top;
      } else { gx = s * geo.lw; gy = host.clientHeight / 2; }
      vline.style.transform = `translate3d(${gx.toFixed(1)}px,0,0)`;
      grip.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)${dragging ? ' scale(1.06)' : ''}`;
      // fx opacity set on the layers themselves (an inherited custom property
      // on the host restyled every node of every layer each frame)
      const nfx = clamp01((s - FX_FROM) / (1 - FX_FROM)).toFixed(3);
      const dfx = clamp01((1 - s - FX_FROM) / (1 - FX_FROM)).toFixed(3);
      fxN.forEach(el => { el.style.opacity = nfx; });
      fxD.forEach(el => { el.style.opacity = dfx; });
      const night = s >= TEXT_AT, day = s <= 1 - TEXT_AT;
      nightText.classList.toggle('is-on', night);
      dayText.classList.toggle('is-on', day);
      nightText.setAttribute('aria-hidden', night ? 'false' : 'true');
      dayText.setAttribute('aria-hidden', day ? 'false' : 'true');
      handle.setAttribute('aria-valuenow', String(Math.round(s * 100)));
      handle.setAttribute('aria-valuetext', night ? 'Night' : day ? 'Day' : 'Half day, half night');
    }
    function set(v) {
      s = clamp01(v);
      shared = s;
      if (!raf) raf = requestAnimationFrame(render);
    }
    // the halves stay on their own GPU layers while the page is shown (see
    // setLive): switching that on at each drag start made a frame where the
    // new layers weren't painted yet, so the grass / meadow blinked
    const live = () => {};
    function animateTo(target) {
      cancelAnimationFrame(tween);
      live(true);
      const from = s, t0 = performance.now(), dur = 280;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        set(from + (target - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) tween = requestAnimationFrame(step);
        else if (!drag) live(false);
      };
      tween = requestAnimationFrame(step);
    }
    const snap = () => animateTo(s >= SNAP_END ? 1 : s <= 1 - SNAP_END ? 0 : START);
    const fromPoint = (x, y) => {
      // read the finger's x at the grip's depth, so the vertical line stays
      // under the finger wherever along it the drag happens
      if (ground && geo && geo.C) { const C = geo.C; return fracAt(C, x, seamAt(C, 0.5, GRIP_T).y); }
      const r = host.getBoundingClientRect();
      return r.width ? (x - r.left) / r.width : s;
    };

    let drag = null;
    const stop = e => e.stopPropagation();
    handle.addEventListener('pointerdown', e => {
      stop(e);
      if (drag) return;              // one finger at a time
      e.preventDefault();
      cancelAnimationFrame(tween);
      drag = { id: e.pointerId, x: e.clientX, moved: false, onGrip: !!e.target.closest('.dn-grip') };
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
      handle.classList.add('is-dragging');
      dragging = true; live(true); if (!raf) raf = requestAnimationFrame(render);
    });
    handle.addEventListener('pointermove', e => {
      stop(e);
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) < TAP_PX) return;
      drag.moved = true;
      set(fromPoint(e.clientX, e.clientY));
    });
    const endDrag = e => {
      stop(e);
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      handle.classList.remove('is-dragging');
      dragging = false; if (!raf) raf = requestAnimationFrame(render);
      if (d.moved || e.type === 'pointercancel') { snap(); return; }
      if (!d.onGrip) { live(false); return; }
      const r = grip.getBoundingClientRect();
      const goal = e.clientX < r.left + r.width / 2 ? 1 : 0;
      animateTo(Math.abs(s - goal) < 0.01 ? START : goal);
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('click', stop);
    handle.addEventListener('keydown', e => {
      const k = e.key;
      let v = null;
      if (k === 'ArrowRight' || k === 'ArrowUp') v = s + (e.shiftKey ? 0.25 : 0.1);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') v = s - (e.shiftKey ? 0.25 : 0.1);
      else if (k === 'End') v = 1;
      else if (k === 'Home') v = 0;
      else if (k === 'PageUp' || k === 'PageDown') { stop(e); return; }
      if (v == null) return;
      stop(e);
      e.preventDefault();
      cancelAnimationFrame(tween);
      set(v);
    });

    // the book moves while the leaf flips and on resize: re-measure for a
    // moment after arriving, and on every resize
    // re-measure a few times while the turn settles (not every frame: each
    // measure forces a layout, which made the turn feel heavy)
    render();
    // re-measure once the turn has fully settled (and on resize)
    setTimeout(() => { if (host.isConnected && !isTurning()) { measure(); render(); } }, 1000);
    // Resize / phone rotation: the engine refits the book and the picture
    // ~120ms after the last resize event (and the browser keeps settling the
    // viewport a bit longer on rotation), so measuring right away read the
    // OLD layout and left the seam, the divider and the text in the wrong
    // place until a reload. Re-measure after the refit, then once more.
    let rz = [];
    const remeasure = () => {
      rz.forEach(clearTimeout);
      rz = [260, 700].map(ms => setTimeout(() => {
        if (!host.isConnected) return;
        geo = null; fitToBook(host, ground); measure(); render();
      }, ms));
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', remeasure);
  }

  // Show the part of a half left (night) or right (day) of fraction f
  // without clip-path (changing a clip repaints the whole layer, very slow on
  // phones). The box (overflow: hidden) slides away and its picture slides
  // back the same amount, so only the window moves: both pictures stay
  // rasterised and a drag is compositing only.
  const CAN_TRANSLATE = !!(window.CSS && CSS.supports && CSS.supports('translate', '1px 0'));
  function reveal(el, side, f, W) {
    if (!el) return;
    if (!CAN_TRANSLATE || !(W > 0)) { clip(el, side, f); return; }
    f = clamp01(f);
    const d = side === 'n' ? -(1 - f) * W : f * W;
    el.style.translate = `${d.toFixed(1)}px 0`;
    const inner = el.firstElementChild;
    if (inner) inner.style.translate = `${(-d).toFixed(1)}px 0`;
  }
  // The engine sizes a pop-up scene from the page's height; on a portrait
  // phone the tilted page is short and wide, so the scene came out about
  // twice the screen's width and pieces near the sides were off-screen.
  // Scene x 0..1600 is the book's near edge (scene.js toScene), so when the
  // scene is clearly wider than that edge, shrink it to the edge (keeping its
  // aspect and its bottom on the near edge). Desktop is left as it is.
  function fitToBook(host, ground) {
    const slot = host.parentElement;
    if (!ground || !slot || !slot.classList.contains('obj-slot')) return;
    const C = corners(ground);
    const near = C.br.x - C.bl.x;
    const w = slot.offsetWidth, h = slot.offsetHeight;
    if (!(near > 0) || !(w > 0) || w <= near * 1.05) return;
    const left = parseFloat(slot.style.left) || 0, top = parseFloat(slot.style.top) || 0;
    const ox = slot.getBoundingClientRect().left - left;
    const nw = near, nh = h * near / w;
    const cx = (C.bl.x + C.br.x) / 2 - ox;
    Object.assign(slot.style, {
      left: `${(cx - nw / 2).toFixed(1)}px`, top: `${(top + h - nh).toFixed(1)}px`,
      width: `${nw.toFixed(1)}px`, height: `${nh.toFixed(1)}px`
    });
  }
  function clip(el, side, f) {
    if (!el) return;
    const p = (Math.max(0, Math.min(1, f)) * 100).toFixed(2);
    const v = side === 'n' ? `inset(0 ${(100 - p).toFixed(2)}% 0 0)` : `inset(0 0 0 ${p}%)`;
    el.style.webkitClipPath = v;
    el.style.clipPath = v;
  }

  // ---- the turning leaf carries the printed ground -----------------------
  // A real page turns WITH its picture. The engine's leaf is plain paper, so
  // during a flip it showed as a blank sheet over the meadow (and the meadow,
  // lying on the paper, could show through it). While a leaf turns, its
  // front face gets a copy of the outgoing ground's half it lifts and, once
  // the new page is in, its back face gets the incoming ground's half it lays
  // down. Cleared when the flip ends.
  // GPU layers for the two halves: on while a slider page is shown, off while
  // a leaf turns (they made every frame of the flip and pop-in costly). The
  // switch happens while the content is dissolved / popping, so it can't
  // show as a blink under the finger.
  let liveT = 0;
  function setLive(on) {
    clearTimeout(liveT);
    if (!on) { document.body.classList.remove('dn-live'); return; }
    liveT = setTimeout(() => {
      if (document.body.classList.contains('dn-slider-on') && !isTurning()) document.body.classList.add('dn-live');
    }, 120);
  }
  const leafEl = () => document.querySelector('.book .leaf');
  const isTurning = () => { const l = leafEl(); return !!(l && l.classList.contains('flipping')); };
  function leafFace(side) {
    return document.querySelector(`.book .leaf .leaf-face.${side}`);
  }
  // paint one face of the leaf with one half ('left' | 'right') of a ground
  // On phones a full copy of the meadow (two big SVGs) on the leaf cost a
  // layout + paint right as the flip starts and again at its middle, inside
  // a rotating 3D layer. There the leaf gets plain day / night colour bands
  // of the meadow instead, split at the divider.
  const LITE = window.matchMedia && matchMedia('(pointer: coarse), (max-width: 800px), (max-aspect-ratio: 3 / 4)').matches;
  const FLAT = {
    day: 'linear-gradient(#8cc04c, #6fa63a 45%, #4f8a2a)',
    night: 'linear-gradient(#1e3a3c, #16302f 45%, #0e2222)',
    dusk: 'linear-gradient(#8a8a3c, #6c7030 45%, #4a5226)'
  };
  function paintLeaf(side, ground, half) {
    const face = leafFace(side);
    if (!face) return;
    face.querySelectorAll('.dn-leaf-ground').forEach(g => g.remove());
    if (!ground) return;
    const wrap = document.createElement('div');
    wrap.className = 'dn-leaf-ground';
    if (LITE) {
      const still = !ground.querySelector('.dn-g-night');
      // night share of this half: the seam is at `shared` across the spread
      const nf = still ? 0 : clamp01(half === 'right' ? (shared - 0.5) * 2 : shared * 2);
      const band = (bg, l, w) => {
        if (w <= 0) return;
        const b = document.createElement('div');
        b.className = 'dn-leaf-flat';
        b.style.cssText = `left:${(l * 100).toFixed(2)}%;width:${(w * 100).toFixed(2)}%;background:${bg};`;
        wrap.appendChild(b);
      };
      band(FLAT.night, 0, nf);
      band(still ? FLAT.dusk : FLAT.day, nf, 1 - nf);
      face.appendChild(wrap);
      return;
    }
    const copy = ground.cloneNode(true);
    copy.classList.remove('is-in', 'is-out', 'popup-ground', 'dn-ground');
    copy.classList.add('dn-ground');
    copy.querySelectorAll('.dn-corner').forEach(c => c.remove());
    copy.querySelectorAll('.dn-g, .dn-g > svg').forEach(e => { e.style.translate = ''; });
    clip(copy.querySelector('.dn-g-night'), 'n', shared);
    clip(copy.querySelector('.dn-g-day'), 'd', shared);
    copy.style.cssText = `position:absolute;top:0;bottom:0;width:200%;left:${half === 'right' ? '-100%' : '0'};`;
    wrap.appendChild(copy);
    face.appendChild(wrap);
  }
  // Forward turn: the right half lifts (front face, the OLD right half) and
  // lands on the left (back face, the NEW left half). Backward turn: the
  // left half lifts (back face, the OLD left half) and lands on the right
  // (front face, the NEW right half).
  function leafLifts() {
    const l = leafEl();
    const old = document.querySelector('.book .spread > .popup-ground:not(.is-out)');
    if (l.classList.contains('forward')) { paintLeaf('front', old, 'right'); paintLeaf('back', null); }
    else { paintLeaf('back', old, 'left'); paintLeaf('front', null); }
  }
  function leafLands(ground) {
    if (!isTurning()) return;
    if (leafEl().classList.contains('forward')) paintLeaf('back', ground, 'left');
    else paintLeaf('front', ground, 'right');
  }
  function watchLeaf() {
    const leaf = leafEl();
    if (!leaf || leaf.__dnWatch) return;
    leaf.__dnWatch = true;
    let was = false;
    new MutationObserver(() => {
      const now = leaf.classList.contains('flipping');
      if (now && !was) { setLive(false); leafLifts(); }
      if (!now) { paintLeaf('front', null); paintLeaf('back', null); if (was) setLive(true); }
      was = now;
    }).observe(leaf, { attributes: true, attributeFilter: ['class'] });
  }

  // finale: the engine puts its caption at the bottom middle of the scene;
  // move it just under the book, so it doesn't cover the party
  function captionUnderBook() {
    const place = () => {
      const cap = document.querySelector('.obj-overlay .obj-slot.is-caption');
      const book = document.querySelector('.book');
      const ov = document.querySelector('.obj-overlay');
      if (!cap || !book || !ov) return;
      const b = book.getBoundingClientRect(), o = ov.getBoundingClientRect();
      cap.style.width = `${Math.min(window.innerWidth * 0.92, b.width * 0.9).toFixed(0)}px`;
      cap.style.top = `${(textTop(b.bottom + 10, cap.offsetHeight, cap.offsetWidth) - o.top).toFixed(1)}px`;
      cap.style.transform = 'translate(-50%, 0)';
    };
    place();
    [150, 400, 750].forEach(ms => setTimeout(place, ms));
    if (!captionUnderBook.wired) {
      captionUnderBook.wired = true;
      const again = () => [260, 700].forEach(ms => setTimeout(() => {
        if (!document.body.classList.contains('dn-slider-on')) place();
      }, ms));
      window.addEventListener('resize', again);
      window.addEventListener('orientationchange', again);
    }
  }

  // just under the book, but never over the page buttons: if the gap is too
  // small, the text moves up so its bottom clears the nav
  // (on phone landscape the buttons are a column at the left edge, not a
  // bar under the book; then they are not in the way and are ignored)
  function textTop(want, h, w) {
    const nav = document.querySelector('.page-nav');
    if (!nav) return want;
    const n = nav.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const half = (w || vw * 0.7) / 2;
    const overlapsX = n.right > vw / 2 - half && n.left < vw / 2 + half;
    if (!overlapsX || n.width < n.height) return want;
    return Math.min(want, n.top - 8 - h);
  }

  function text(cls, str) {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = str || '';
    el.setAttribute('aria-live', 'polite');
    return el;
  }

  function scan(node) {
    if (!(node instanceof Element)) return;
    watchLeaf();
    if (node.matches('.obj-host') && node.closest('.obj-slot')) attach(node);
    else if (node.matches('.obj-slot')) node.querySelectorAll(':scope > .obj-host').forEach(attach);
  }
  new MutationObserver(list => {
    list.forEach(m => m.addedNodes.forEach(scan));
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
