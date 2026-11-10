// Shared two-finger pinch-zoom gesture, TOUCH ONLY.
//
// Used by the full-screen picture views (assets/js/fullview.js and the space
// book's planet zoom). It owns no DOM and adds no listeners: the caller feeds
// it pointer events and gets back a zoom state to show however it likes
// (usually a cheap CSS transform on the zoomed picture).
//
//   const pz = Pinch({ max: 4, apply(s, x, y) {...}, end(s, x, y) {...} });
//   pz.feed(e)        // pointerdown / pointermove / pointerup / pointercancel
//   pz.gestured()     // true if the touch that just ended pinched or panned
//                     // (callers skip their "tap closes" action then)
//   pz.reset()        // back to 1x
//
// Rules: only `pointerType === 'touch'` counts (mouse / trackpad never zoom);
// two fingers zoom about their midpoint and move with it; once zoomed in, one
// finger pans. State: screen p' = C + (x, y) + s * (p - C), C = screen centre.

(function () {
  'use strict';

  function Pinch(opts) {
    opts = opts || {};
    const max = opts.max || 4;
    const pts = new Map();
    let s = 1, x = 0, y = 0, pinch = null, start = null, moved = false, raf = 0;

    function clamp() {
      s = Math.max(1, Math.min(max, s));
      const mx = (window.innerWidth / 2) * (s - 1), my = (window.innerHeight / 2) * (s - 1);
      x = Math.max(-mx, Math.min(mx, x));
      y = Math.max(-my, Math.min(my, y));
    }
    function show() {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; clamp(); if (opts.apply) opts.apply(s, x, y); });
    }
    function zoomAbout(f, px, py) {
      const cx = px - window.innerWidth / 2, cy = py - window.innerHeight / 2;
      const ns = Math.max(1, Math.min(max, s * f)), k = ns / s;
      x = cx - k * (cx - x); y = cy - k * (cy - y); s = ns;
    }

    function feed(e) {
      if (e.pointerType !== 'touch') return false;
      const t = e.type;
      if (t === 'pointerdown') {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { moved = false; start = { x: e.clientX, y: e.clientY }; }
        if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
          moved = true;
        }
        return true;
      }
      const p = pts.get(e.pointerId);
      if (!p) return false;
      if (t === 'pointermove') {
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (pts.size >= 2 && pinch) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          x += mx - pinch.mx; y += my - pinch.my;
          zoomAbout(d / pinch.d, mx, my);
          pinch = { d, mx, my };
          show();
        } else if (pts.size === 1) {
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true;
          if (moved && s > 1) { x += dx; y += dy; show(); }
        }
        return true;
      }
      // pointerup / pointercancel
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0 && moved) { clamp(); if (opts.end) opts.end(s, x, y); }
      return true;
    }

    return {
      feed,
      gestured: () => moved,
      active: () => pts.size > 0,
      zoom: () => s,
      reset() { s = 1; x = 0; y = 0; pts.clear(); pinch = null; moved = false; if (opts.apply) opts.apply(1, 0, 0); }
    };
  }

  window.Pinch = Pinch;
})();
