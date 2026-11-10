// Shared full-screen picture view for every book.
//
// Any book can opt a picture in: give the SVG its build() returns a
// `data-fullview` attribute. Tapping that picture opens it full screen:
//   data-fullview=""            -> shows the same picture, larger
//   data-fullview="buildLineup" -> calls window.buildLineup() and shows the
//                                  SVG markup it returns (a bigger scene)
//   data-fullview-title="…"     -> optional heading (default: the spread title)
//   data-fullview-zoom="touch"   -> two-finger pinch zoom on touch screens
//                                  (off by default; never on mouse/trackpad)
//   data-fullview-close="off"    -> no × button (a tap or Esc still closes)
// Books can also open it directly: FullView.open({ svg, title }).
//
// In the view:
//   - the picture fits the screen (SVG "meet"); anything the SVG draws past
//     its viewBox (e.g. sky / ground that runs on) fills the leftover space;
//   - if the picture opts in (data-fullview-zoom="touch"), TWO-finger pinch
//     zooms on touch screens (assets/js/pinch.js), and once zoomed one finger pans.
//     There's no wheel / double-tap / keyboard zoom: on a computer it simply
//     fits the window;
//   - cheap + sharp zoom: the scene is drawn ONCE as an image covering the
//     screen; a pinch only scales / moves that image (GPU, no re-render, so
//     no flicker or missing tiles). When the fingers lift, ONE screen-sized
//     image of just the visible part is rendered from the vector source and
//     laid on top, so the zoomed view is sharp again;
//   - one tap (without moving), the × button or Esc closes it.
//
// Taps on an opted-in picture are caught in the capture phase so the page
// engine never turns the page for them; a horizontal swipe that starts on the
// picture is re-sent as an arrow key so swiping still turns pages.

(function () {
  'use strict';

  const MAX_ZOOM = 6;
  let view = null;

  // ------------------------------------------------------------ geometry --
  // The base image covers the screen: the picture's viewBox "meet"-fitted,
  // then widened in the short direction to the screen's shape (the scene's
  // own sky / ground that runs past its viewBox fills that extra space).
  function coverBox(vb, W, H) {
    const k = Math.min(W / vb.w, H / vb.h), w = W / k, h = H / k;
    return { x: vb.x - (w - vb.w) / 2, y: vb.y - (h - vb.h) / 2, w, h };
  }

  // zoom state: screen p' = C + t + s * (p - C) over the base image
  function clamp(v) {
    v.s = Math.max(1, Math.min(MAX_ZOOM, v.s));
    const mx = (window.innerWidth / 2) * (v.s - 1), my = (window.innerHeight / 2) * (v.s - 1);
    v.x = Math.max(-mx, Math.min(mx, v.x));
    v.y = Math.max(-my, Math.min(my, v.y));
  }
  // an <img> source of the picture showing viewBox box b at W x H
  function urlFor(v, b, W, H) {
    const svg = v.src.replace(/<svg\b[^>]*>/, tag => {
      let t = tag.replace(/\s(viewBox|width|height|preserveAspectRatio|style|class)="[^"]*"/g, '');
      if (!/xmlns=/.test(t)) t = t.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      return t.replace('<svg', `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${W}" height="${H}" preserveAspectRatio="none"`);
    });
    return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  }

  function setImg(img, url) {
    const old = img.dataset.url;
    img.src = url; img.dataset.url = url;
    if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
  }

  // (re)draw the base image for the current screen size
  function drawBase(v) {
    const W = window.innerWidth, H = window.innerHeight;
    v.box = coverBox(v.vb0, W, H);
    setImg(v.base, urlFor(v, v.box, W, H));
    v.s = 1; v.x = 0; v.y = 0;
    v.stage.style.transform = '';
    v.sharp.classList.remove('is-ready');
  }

  // during a gesture: move / scale the base image only (cheap)
  function live(v) {
    clamp(v);
    v.stage.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    v.sharp.classList.remove('is-ready');
  }

  // after a gesture: render just the visible part sharp, on top
  function commit(v) {
    live(v);
    const token = ++v.token;
    if (v.s <= 1.001) return;
    const W = window.innerWidth, H = window.innerHeight, k = W / v.box.w;
    const b = {
      x: v.box.x + (W / 2 - (W / 2 + v.x) / v.s) / k,
      y: v.box.y + (H / 2 - (H / 2 + v.y) / v.s) / k,
      w: v.box.w / v.s, h: v.box.h / v.s
    };
    const url = urlFor(v, b, W, H), probe = new Image();
    probe.onload = () => {
      if (token !== v.token || view !== v) { URL.revokeObjectURL(url); return; }
      setImg(v.sharp, url);
      v.sharp.classList.add('is-ready');
    };
    probe.src = url;
  }

  const touchScreen = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  // ---------------------------------------------------------------- view --
  const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>';

  function open(opts) {
    if (view || !opts || !opts.svg) return;
    const m = opts.svg.match(/<svg\b[^>]*\sviewBox="([^"]+)"/);
    const n = m ? m[1].trim().split(/[\s,]+/).map(Number) : [0, 0, 1000, 600];
    const ov = document.createElement('div');
    ov.className = 'fullview';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.tabIndex = -1;
    if (opts.title) ov.setAttribute('aria-label', opts.title);
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    ov.innerHTML = `<div class="fullview-stage"><img class="fullview-img" alt="${opts.title || ''}" draggable="false"></div>
      <img class="fullview-img fullview-sharp" alt="" aria-hidden="true" draggable="false">
      ${opts.title ? `<div class="fullview-title">${opts.title}</div>` : ''}
      ${opts.close === false ? '' : `<button class="fullview-close" type="button" aria-label="Close">${CLOSE_ICON}</button>`}
      ${touch && opts.zoom ? '<div class="fullview-hint">Pinch with two fingers to zoom</div>' : ''}`;
    document.body.appendChild(ov);

    const stage = ov.querySelector('.fullview-stage');
    view = { ov, stage, base: stage.querySelector('img'), sharp: ov.querySelector('.fullview-sharp'),
      zoom: !!opts.zoom && touchScreen(), src: opts.svg, vb0: { x: n[0], y: n[1], w: n[2], h: n[3] }, s: 1, x: 0, y: 0, token: 0,
      pts: new Map(), pinch: null, moved: false, start: null, onClose: opts.onClose };
    drawBase(view);
    wire(view);
    void ov.offsetWidth;
    requestAnimationFrame(() => ov.classList.add('is-open'));
    const btn = ov.querySelector('.fullview-close');
    (btn || ov).focus({ preventScroll: true });
  }

  function close() {
    if (!view) return;
    const v = view;
    view = null;
    window.removeEventListener('resize', v.onResize);
    window.removeEventListener('wheel', v.onWheel, { capture: true });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(t =>
      window.removeEventListener(t, v.onGesture, { capture: true }));
    v.ov.classList.remove('is-open');
    v.ov.classList.add('is-closing');
    setTimeout(() => {
      [v.base, v.sharp].forEach(i => i.dataset.url && URL.revokeObjectURL(i.dataset.url));
      v.ov.remove();
    }, 350);
    if (typeof v.onClose === 'function') v.onClose();
  }

  function wire(v) {
    const ov = v.ov;
    // the page engine listens on window; keep the view's events to itself
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click', 'wheel'].forEach(t =>
      ov.addEventListener(t, e => e.stopPropagation()));
    const btn = ov.querySelector('.fullview-close');
    if (btn) btn.addEventListener('click', close);

    // A trackpad pinch on a Mac arrives as ctrl+wheel (Chrome, Firefox) or as
    // gesture* events (Safari) and makes the BROWSER zoom the whole page,
    // re-rasterising the huge scene image (slow, black tiles). Swallow both
    // while the view is open.
    v.onWheel = e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    v.onGesture = e => e.preventDefault();
    window.addEventListener('wheel', v.onWheel, { passive: false, capture: true });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(t =>
      window.addEventListener(t, v.onGesture, { passive: false, capture: true }));

    // two-finger pinch (touch screens only, and only if the picture opted in)
    const pz = v.zoom && window.Pinch ? window.Pinch({
      max: MAX_ZOOM,
      apply: (s, x, y) => { v.s = s; v.x = x; v.y = y; live(v); },
      end: (s, x, y) => { v.s = s; v.x = x; v.y = y; commit(v); }
    }) : null;
    v.pz = pz;

    let down = null;
    ov.addEventListener('pointerdown', e => {
      if (e.target.closest('.fullview-close')) return;
      try { ov.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (pz) pz.feed(e);
      if (!down) down = { x: e.clientX, y: e.clientY, n: 0 };
      down.n++;
    });
    ov.addEventListener('pointermove', e => { if (pz) pz.feed(e); });
    const up = e => {
      if (!down) return;
      if (pz) pz.feed(e);
      if (--down.n > 0) return;                       // other fingers still down
      const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
      down = null;
      if (e.type === 'pointerup' && tap && !(pz && pz.gestured())) close();   // a plain tap closes
    };
    ov.addEventListener('pointerup', up);
    ov.addEventListener('pointercancel', up);

    let rt = 0;
    v.onResize = () => { clearTimeout(rt); rt = setTimeout(() => { drawBase(v); if (pz) pz.reset(); }, 150); };
    window.addEventListener('resize', v.onResize);
  }

  // ------------------------------------- tap an opted-in picture to open --
  function hostOf(t) {
    const h = t && t.closest ? t.closest('.obj-host') : null;
    return h && h.querySelector('svg[data-fullview]') ? h : null;
  }

  function openFromHost(host) {
    const src = host.querySelector('svg[data-fullview]');
    const fn = src.getAttribute('data-fullview');
    let svg = '';
    if (fn && typeof window[fn] === 'function') svg = window[fn]();
    else {
      const copy = src.cloneNode(true);
      copy.classList.remove('is-playing');
      svg = copy.outerHTML;
    }
    const titleEl = document.querySelector('.obj-slot.is-text .title-line');
    const title = src.getAttribute('data-fullview-title') ||
      (titleEl ? titleEl.textContent.replace(/\u00AD/g, '').trim() : '');
    open({ svg, title,
      zoom: src.getAttribute('data-fullview-zoom') === 'touch',
      close: src.getAttribute('data-fullview-close') !== 'off' });
  }

  let press = null;
  window.addEventListener('pointerdown', e => {
    if (view) return;
    press = { x: e.clientX, y: e.clientY, host: hostOf(e.target) };
    if (press.host) e.stopImmediatePropagation();
  }, true);

  window.addEventListener('pointerup', e => {
    if (view) return;
    const p = press; press = null;
    if (!p || !p.host) return;
    e.stopImmediatePropagation();
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (Math.hypot(dx, dy) < 10) { if (hostOf(e.target) === p.host) openFromHost(p.host); return; }
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: dx < 0 ? 'ArrowRight' : 'ArrowLeft' }));
    }
  }, true);

  window.addEventListener('keydown', e => {
    if (!view) return;
    if (e.key === 'Tab') return;                       // keep focus moving normally
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
  }, true);

  window.FullView = { open, close };
})();
