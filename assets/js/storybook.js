// Storybook engine — shared across every book, content-agnostic.
//
// An open book lying flat in perspective. Renders the current book's roster
// (window.BOOK_PAGES, from books/<id>/pages.js) one spread at a time, driving:
//   - open-book stage (two-page spread, spine in the middle);
//   - page-turn flip animation over the spine, both directions;
//   - every navigation input (click/tap, keys, remote, pointer swipe);
//   - alternating image/text layout (swaps left<->right each turn);
//   - content-swap sequence: old dissolves -> leaf flips -> new pops out;
//   - pseudo-3D objects raised above the page, pointer tilt + idle sway.
//
// Dependency-free. Reuses buildReindeer(cfg) + mountObject(host, svg).

(function () {
  'use strict';

  // --- page roster (per-book, injected) ----------------------------------
  // The engine is content-agnostic: the current book supplies its pages on
  // window.BOOK_PAGES (see books/<id>/pages.js). Each page is either an OBJECT
  // page { title, body, build } (build() returns a layered data-part SVG) or a
  // TEXT-ONLY page { textOnly, left, right }. No story data lives in the engine.
  // Assigned in init() (not at load time) so it's read AFTER the book's
  // pages.js has run, regardless of script order.
  let PAGES = [];

  const FLIP_MS = 650;      // leaf flip duration (keep in sync with CSS)
  const DISSOLVE_MS = 180;  // old content fade-out before the flip

  // --- state -------------------------------------------------------------
  let index = 0;          // current page index
  let busy = false;       // input lock during a flip
  const WRAP = false;     // clamp at the ends (POC default; see TODO)

  let bookEl, spreadEl, leftPanelEl, rightPanelEl, leafEl, statusEl;
  let navFirstBtn, navPrevBtn, navNextBtn, navLastBtn;
  let idleRAF = null, idleT = 0;
  let pointer = { x: 0, y: 0, active: false }; // hover tilt target (-1..1)
  let hoverTimer = null;                       // resets idle motion when the
                                               // pointer stops moving (not just
                                               // when it leaves the stage)
  const HOVER_IDLE_MS = 1100;                  // no movement this long -> resume
                                               // the autonomous sway
  const activeObjects = [];  // mounted pseudo-3D objects to drive on tilt

  let overlayEl, objLeftSlot, objRightSlot;

  // ---------------------------------------------------------------------
  function init(root) {
    PAGES = window.BOOK_PAGES || [];
    bookEl = document.createElement('div');
    bookEl.className = 'book';
    bookEl.innerHTML = `
      <div class="book-stack" aria-hidden="true">
        <span class="cover"></span>
        <span class="half left">
          <span class="sheet s1"></span><span class="sheet s2"></span>
          <span class="sheet s3"></span><span class="sheet s4"></span>
          <span class="sheet s5"></span>
        </span>
        <span class="half right">
          <span class="sheet s1"></span><span class="sheet s2"></span>
          <span class="sheet s3"></span><span class="sheet s4"></span>
          <span class="sheet s5"></span>
        </span>
      </div>
      <div class="spread" aria-live="polite">
        <div class="page-panel left"  data-side="left"></div>
        <div class="page-panel right" data-side="right"></div>
      </div>
      <div class="spine"></div>
      <div class="leaf" aria-hidden="true">
        <div class="leaf-face front"></div>
        <div class="leaf-face back"></div>
      </div>
    `;
    root.appendChild(bookEl);

    // Page nav lives on <body> (NOT inside the transformed book) so its
    // position:fixed is relative to the viewport and it sits at the screen
    // bottom on every resolution. It holds prev / counter / next.
    const navEl = document.createElement('div');
    navEl.className = 'page-nav';
    navEl.innerHTML = `
      <button class="page-btn first" type="button" aria-label="Jump to first page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 5 L11 12 L18 19 M11 5 L4 12 L11 19" fill="none"
            stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="page-btn prev" type="button" aria-label="Previous page">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19"
          fill="none" stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="page-status" aria-hidden="true"></div>
      <button class="page-btn next" type="button" aria-label="Next page">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19"
          fill="none" stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="page-btn last" type="button" aria-label="Jump to last page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5 L13 12 L6 19 M13 5 L20 12 L13 19" fill="none"
            stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `;
    document.body.appendChild(navEl);
    statusEl = navEl.querySelector('.page-status');
    navFirstBtn = navEl.querySelector('.page-btn.first');
    navPrevBtn = navEl.querySelector('.page-btn.prev');
    navNextBtn = navEl.querySelector('.page-btn.next');
    navLastBtn = navEl.querySelector('.page-btn.last');
    navFirstBtn.addEventListener('click', () => goTo(0));
    navPrevBtn.addEventListener('click', () => prev());
    navNextBtn.addEventListener('click', () => next());
    navLastBtn.addEventListener('click', () => goTo(PAGES.length - 1));

    // Music toggle: loops this book's track. Only shown when the book actually
    // HAS a track (manifest `track` set, applied by boot.js before init runs) —
    // a book with no audio shows no music button at all. Disabled by default
    // (nothing plays until clicked — also satisfies browser autoplay policies).
    const hasMusic = window.MusicPlayer &&
      typeof window.MusicPlayer.hasTrack === 'function' &&
      window.MusicPlayer.hasTrack();
    if (hasMusic) {
      const musicBtn = document.createElement('button');
      musicBtn.className = 'music-btn';
      musicBtn.type = 'button';
      musicBtn.setAttribute('aria-label', 'Play music');
      musicBtn.setAttribute('aria-pressed', 'false');
      const ICON_OFF =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/>' +
        '<path d="M17 9 L22 14 M22 9 L17 14" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round"/></svg>';
      const ICON_ON =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/>' +
        '<path d="M16 8 Q19 12 16 16 M18.5 6 Q23 12 18.5 18" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      musicBtn.innerHTML = ICON_OFF;
      document.body.appendChild(musicBtn);
      musicBtn.addEventListener('click', () => {
        if (window.CarolPlayer) window.CarolPlayer.toggle();
      });
      window.CarolPlayer.onChange(on => {
        musicBtn.classList.toggle('is-on', on);
        musicBtn.innerHTML = on ? ICON_ON : ICON_OFF;
        musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
      });
    }

    // Flat, screen-facing overlay for the pop-up object. It is a SIBLING of
    // the tilted .book (NOT a child), so it inherits NONE of the book's
    // perspective/tilt — the deer stands standalone, facing the viewer, like
    // the index.html preview. We just position its slot over a page centre.
    overlayEl = document.createElement('div');
    overlayEl.className = 'obj-overlay';
    overlayEl.innerHTML = `
      <div class="obj-slot left"></div>
      <div class="obj-slot right"></div>
    `;
    root.appendChild(overlayEl);
    objLeftSlot = overlayEl.querySelector('.obj-slot.left');
    objRightSlot = overlayEl.querySelector('.obj-slot.right');

    spreadEl = bookEl.querySelector('.spread');
    leftPanelEl = bookEl.querySelector('.page-panel.left');
    rightPanelEl = bookEl.querySelector('.page-panel.right');
    leafEl = bookEl.querySelector('.leaf');

    renderSpread(index, { animate: false });
    wireInput(root);
    startIdle();
    updateStatus();
  }

  // --- layout: alternate image/text side every turn ---------------------
  // Odd spread index (0-based even/odd per TODO): image LEFT on even pages,
  // image RIGHT on odd pages. (TODO calls page 1 "odd" = image left; page 1
  // is index 0 here, so even index -> image left.)
  function imageOnLeft(i) { return i % 2 === 0; }

  function buildTextPanel(page) {
    const wrap = document.createElement('div');
    wrap.className = 'text-block';
    let html = '';
    if (page.title) html += `<div class="title-line">${escapeHtml(page.title)}</div>`;
    // `bodyHtml` is trusted static markup (used to highlight key words inline);
    // `body` is plain text and gets escaped.
    if (page.bodyHtml) html += `<div class="body-line">${page.bodyHtml}</div>`;
    else if (page.body) html += `<div class="body-line">${escapeHtml(page.body)}</div>`;
    wrap.innerHTML = html;
    return wrap;
  }

  // Fill the spread for `i`, honouring the alternating layout.
  // TEXT lives on the (tilted) page; the pseudo-3D OBJECT lives in the flat
  // overlay slot over that page's centre, so it stands standalone.
  function renderSpread(i, { animate } = {}) {
    activeObjects.length = 0;
    leftPanelEl.innerHTML = '';
    rightPanelEl.innerHTML = '';
    objLeftSlot.innerHTML = '';
    objRightSlot.innerHTML = '';
    [objLeftSlot, objRightSlot].forEach(s => {
      s.classList.remove('is-image', 'is-text');
      clearImageSlot(s);
    });
    fitted = null;

    const page = PAGES[((i % PAGES.length) + PAGES.length) % PAGES.length];

    if (page.textOnly) {
      // Text-on-BOTH-sides page (no pseudo-3D object): a short narrative split
      // across the two pages. Each side is its own text block, both flat in the
      // overlay so neither slants with the book.
      objLeftSlot.appendChild(buildTextPanel(page.left));
      objRightSlot.appendChild(buildTextPanel(page.right));
      objLeftSlot.classList.add('is-text');
      objRightSlot.classList.add('is-text');
      overlayEl.classList.add('img-left', 'img-right');
      if (animate !== false) popIn();
      return;
    }

    const imgLeft = imageOnLeft(i);

    // Both the object AND the text live in the FLAT overlay so neither
    // inherits the book's tilt (text was slanting on the page before).
    // Reuse the prerendered picture if it was built for exactly this page.
    let host, obj;
    const pre = takePrerender(page);
    if (pre) {
      ({ host, obj } = pre);
    } else {
      host = document.createElement('div');
      host.className = 'obj-host is-tappable';   // clickable: taps PLAY, not turn
      obj = mountObject(host, page.build());
    }
    activeObjects.push(obj);
    // Remember this spread's object so a tap on its image can trigger the
    // object's own one-shot animation (instead of a page turn).
    host.__obj = obj;

    const imgSlot = imgLeft ? objLeftSlot : objRightSlot;
    const txtSlot = imgLeft ? objRightSlot : objLeftSlot;
    imgSlot.appendChild(host);
    txtSlot.appendChild(buildTextPanel(page));
    imgSlot.classList.add('is-image');
    txtSlot.classList.add('is-text');

    overlayEl.classList.add('img-left', 'img-right'); // both slots visible now

    fitImageSlot(imgSlot, imgLeft ? leftPanelEl : rightPanelEl, aspectOf(host), page);
    if (animate !== false) popIn();
    schedulePrerender(i + 1, imgSlot);
  }

  // --- the generic picture wrapper: place + scale every image the same way --
  // The image slot is the wrapper around every book's picture. It is sized
  // from the picture's own aspect ratio (its SVG viewBox) and the page half it
  // sits on, following the placement rule in skills/book-authoring.md:
  //   - fill the page width (minus a small even side margin),
  //   - keep the picture's real aspect ratio (square art, 3:2 photos, …),
  //   - centre it vertically on the page as seen (the page's on-screen box),
  //   - never taller than PIC_MAX_H of the stage, so tall art stays on screen.
  // Books don't need per-book slot CSS; art margins come from the viewBox.
  const PIC_MARGIN = 0.04;     // side margin, fraction of the page width
  const PIC_MAX_H = 0.78;      // max picture height, fraction of the stage
  let fitted = null;           // { slot, panel, ar } of the shown picture

  function aspectOf(host) {
    const svg = host.querySelector('svg');
    if (!svg) return 1;
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return vb[2] / vb[3];
    const w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
    return w > 0 && h > 0 ? w / h : 1;
  }

  // The drawn content's box inside the viewBox, as fractions of the viewBox
  // ({ x, y, w, h } in 0..1). Art is often drawn low in its viewBox (a tree
  // standing on y≈290 of 300, empty sky above), so fitting the viewBox alone
  // leaves the picture sitting at the bottom of the page. Union of every
  // layer's getBBox(); effect-only `fx-*` parts (hidden at rest) are skipped.
  // Measured once per host and cached; falls back to the whole viewBox.
  const cboxCache = new WeakMap();   // page -> content box (measured once)
  function contentBox(host, page) {
    if (page && cboxCache.has(page)) return cboxCache.get(page);
    if (host.__cbox) return host.__cbox;
    const whole = { x: 0, y: 0, w: 1, h: 1 };
    const svgs = Array.from(host.querySelectorAll('.layer'))
      .filter(l => !/^fx-/.test(l.dataset.part || ''))
      .map(l => l.querySelector(':scope > svg')).filter(Boolean);
    if (!svgs.length) return whole;
    const vb = (svgs[0].getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !(vb[2] > 0 && vb[3] > 0)) return whole;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    // A builder can declare its content box explicitly (viewBox units), for
    // pictures whose visible content isn't SVG geometry (e.g. canvas planets
    // drawn over invisible markers): <svg data-fit="x y w h" …>.
    const declared = (svgs[0].getAttribute('data-fit') || '').trim().split(/[\s,]+/).map(Number);
    if (declared.length === 4 && declared[2] > 0 && declared[3] > 0) {
      [x0, y0] = declared; x1 = x0 + declared[2]; y1 = y0 + declared[3];
    } else svgs.forEach(s => {
      try {
        const b = s.getBBox();
        if (!b.width || !b.height) return;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      } catch (e) { /* not rendered yet */ }
    });
    if (!(x1 > x0 && y1 > y0)) return whole;
    // clamp to the viewBox: art drawn past it (sky/ground run-ons) doesn't count
    x0 = Math.max(x0, vb[0]); y0 = Math.max(y0, vb[1]);
    x1 = Math.min(x1, vb[0] + vb[2]); y1 = Math.min(y1, vb[1] + vb[3]);
    if (!(x1 > x0 && y1 > y0)) return whole;
    const box = { x: (x0 - vb[0]) / vb[2], y: (y0 - vb[1]) / vb[3],
                  w: (x1 - x0) / vb[2], h: (y1 - y0) / vb[3] };
    host.__cbox = box;
    if (page) cboxCache.set(page, box);
    return box;
  }

  // The page as SEEN. The page is tilted in perspective, so on screen it is a
  // trapezoid (narrow far edge at the top, wide near edge at the bottom); its
  // getBoundingClientRect() is as wide as the bottom edge, which put pictures
  // off-centre towards the outer edge. Four zero-size corner markers inside
  // the panel give the real projected corners; the usable box is the
  // trapezoid's mid-height width between its top and bottom edges.
  function pageBox(panel) {
    let marks = panel.querySelectorAll(':scope > .page-corner');
    if (marks.length !== 4) {
      marks.forEach(m => m.remove());
      ['0 auto auto 0', '0 0 auto auto', 'auto auto 0 0', 'auto 0 0 auto'].forEach(inset => {
        const m = document.createElement('i');
        m.className = 'page-corner';
        m.setAttribute('aria-hidden', 'true');
        m.style.cssText = `position:absolute;inset:${inset};width:0;height:0;pointer-events:none;`;
        panel.appendChild(m);
      });
      marks = panel.querySelectorAll(':scope > .page-corner');
    }
    const [tl, tr, bl, br] = Array.from(marks, m => m.getBoundingClientRect());
    const left = (tl.left + bl.left) / 2, right = (tr.left + br.left) / 2;
    const top = (tl.top + tr.top) / 2, bottom = (bl.top + br.top) / 2;
    return { left, top, width: right - left, height: bottom - top };
  }

  function fitImageSlot(slot, panel, ar, page) {
    if (!page && fitted && fitted.slot === slot) page = fitted.page;
    fitted = { slot, panel, ar, page };
    const o = overlayEl.getBoundingClientRect();
    const p = pageBox(panel);
    if (!(p.width > 0) || !(p.height > 0) || !o.width) return;
    const host = slot.querySelector('.obj-host');
    const c = host ? contentBox(host, page) : { x: 0, y: 0, w: 1, h: 1 };
    // size the DRAWN CONTENT to the rule (page width minus margins, height
    // cap), then grow the slot so the whole viewBox keeps that scale
    const cAr = ar * c.w / c.h;
    let cw = p.width * (1 - 2 * PIC_MARGIN);
    let ch = cw / cAr;
    // never taller than the page as seen (minus the same margin): on phones /
    // tablets the tilted page is short, so height, not width, is the limit
    const maxH = Math.min(o.height * PIC_MAX_H, p.height * (1 - 2 * PIC_MARGIN));
    if (ch > maxH) { ch = maxH; cw = ch * cAr; }
    const w = cw / c.w, h = ch / c.h;
    // centre the content (not the viewBox) on the page as seen
    const cx = p.left + p.width / 2 - o.left;
    const cy = p.top + p.height / 2 - o.top;
    Object.assign(slot.style, {
      left: `${cx - cw / 2 - c.x * w}px`, top: `${cy - ch / 2 - c.y * h}px`,
      width: `${w}px`, height: `${h}px`,
      aspectRatio: 'auto', transform: 'none'
    });
  }

  function clearImageSlot(slot) {
    ['left', 'top', 'width', 'height', 'aspectRatio', 'transform']
      .forEach(k => { slot.style[k] = ''; });
  }

  let refitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(refitTimer);
    refitTimer = setTimeout(() => {
      if (fitted && fitted.slot.classList.contains('is-image')) {
        fitImageSlot(fitted.slot, fitted.panel, fitted.ar);
      }
    }, 120);
  });

  // --- prerender the NEXT page's picture ----------------------------------
  // After a spread lands, the next page's picture is built and mounted for
  // real in a hidden, slot-sized warm-up box, so its SVG parse, layer split,
  // image decode and first paint happen while the reader is still looking at
  // this page. When the turn arrives, renderSpread moves that host into the
  // slot instead of building it again. Only the next page (the common turn)
  // is prepared; any other jump just builds as before.
  //
  // While parked, the picture's <style> blocks are switched off
  // (media="not all"): buildAnim's rules match by part name, so a parked
  // copy's keyframes would otherwise also hit the shown picture's parts.
  // OPT-IN: only books that set `window.BOOK_PRERENDER = true` in pages.js
  // (trains: big photos). For SVG books the extra build cost more than it saved.
  let prerender = null;     // { page, host, obj }
  let prerenderTimer = null;
  let prerenderBox = null;
  let prerenderIdle = null;  // { id, idle } pending idle build
  let leaving = false;       // set once the reader heads back to the library

  function cancelPrerenderWork() {
    if (prerenderTimer) { clearTimeout(prerenderTimer); prerenderTimer = null; }
    if (prerenderIdle) {
      (prerenderIdle.idle ? cancelIdleCallback : clearTimeout)(prerenderIdle.id);
      prerenderIdle = null;
    }
  }

  // Leaving the book (Library button, back gesture, closing the tab): stop
  // all pending work and drop the parked picture right away, so navigation
  // isn't held up by a build or by tearing down two heavy pictures.
  function leaveBook() {
    leaving = true;
    dropPrerender();
  }
  window.addEventListener('pagehide', leaveBook);
  window.addEventListener('pageshow', e => { if (e.persisted) leaving = false; });
  document.addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('.library-btn')) leaveBook();
  }, true);

  function dropPrerender() {
    cancelPrerenderWork();
    if (prerender) { prerender.host.remove(); prerender = null; }
  }

  function takePrerender(page) {
    cancelPrerenderWork();
    const pre = prerender;
    prerender = null;
    if (!pre) return null;
    if (pre.page !== page) { pre.host.remove(); return null; }
    pre.host.removeAttribute('style');
    pre.host.className = 'obj-host is-tappable';
    pre.host.querySelectorAll('style[data-parked]').forEach(s => {
      s.removeAttribute('media');
      s.removeAttribute('data-parked');
    });
    return pre;
  }

  function schedulePrerender(i, slot) {
    dropPrerender();
    if (window.BOOK_PRERENDER !== true || i >= PAGES.length) return;
    const page = PAGES[i];
    if (!page || page.textOnly || typeof page.build !== 'function') return;
    // wait for the current flip + pop to settle, then build only when the
    // main thread is idle so it never competes with a tap, a turn or leaving
    // the book
    prerenderTimer = setTimeout(() => {
      prerenderTimer = null;
      const run = () => { prerenderIdle = null; buildPrerender(page, slot); };
      prerenderIdle = window.requestIdleCallback
        ? { id: requestIdleCallback(run, { timeout: 1500 }), idle: true }
        : { id: setTimeout(run, 0), idle: false };
    }, FLIP_MS * 0.5 + 400);
  }

  function buildPrerender(page, slot) {
    {
      if (leaving) return;
      const r = slot.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (!prerenderBox) {
        prerenderBox = document.createElement('div');
        prerenderBox.className = 'obj-prerender';
        prerenderBox.setAttribute('aria-hidden', 'true');
        prerenderBox.style.cssText =
          'position:fixed;left:0;top:0;width:0;height:0;z-index:0;' +
          'opacity:.01;pointer-events:none;';
        document.body.appendChild(prerenderBox);
      }
      const host = document.createElement('div');
      host.className = 'obj-host';
      host.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;` +
        `width:${r.width}px;height:${r.height}px;`;
      let obj;
      try { obj = mountObject(host, page.build()); } catch (e) { return; }
      host.querySelectorAll('style').forEach(s => {
        if (s.hasAttribute('media')) return;
        s.setAttribute('media', 'not all');
        s.setAttribute('data-parked', '');
      });
      prerenderBox.appendChild(host);
      host.__obj = obj;
      prerender = { page, host, obj };
      // let it paint twice (decode images, rasterise once), then hide it so
      // the parked copy costs no compositing / GPU memory while it waits
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (prerender && prerender.host === host) host.style.visibility = 'hidden';
      }));
    }
  }

  // --- the three-step content swap --------------------------------------
  function popIn() {
    [spreadEl, overlayEl].forEach(el => {
      el.classList.remove('dissolve');
      el.classList.add('pop');
      void el.offsetWidth;            // retrigger the CSS pop animation
      el.classList.add('pop-run');
    });
    setTimeout(() => {
      spreadEl.classList.remove('pop', 'pop-run');
      overlayEl.classList.remove('pop', 'pop-run');
    }, 520);
  }

  function dissolveOut() {
    spreadEl.classList.add('dissolve');
    overlayEl.classList.add('dissolve');
  }

  // --- navigation --------------------------------------------------------
  // Clamp at BOTH ends: can't go back past the first page or forward past the
  // last. The jump-to-first / jump-to-last buttons cover getting to the ends.
  function canGo(dir) {
    if (dir > 0) return index < PAGES.length - 1;
    return index > 0;
  }

  // Pending timers for the in-flight flip, so a new input can cut it short and
  // start the next flip immediately (no waiting for the animation to finish).
  let flipTimers = [];
  function clearFlipTimers() {
    flipTimers.forEach(clearTimeout);
    flipTimers = [];
  }

  // Commit to a target page with the dissolve -> flip -> pop sequence. Factored
  // out so go() and goTo() share one path. Does NOT gate on `busy`: callers
  // decide whether to interrupt a running flip.
  function runFlipTo(target, dir) {
    clearFlipTimers();
    busy = true;

    // Commit the logical page IMMEDIATELY. The visible content swap is still
    // deferred to the flip mid-point for the animation, but `index` must
    // advance now so a rapid follow-up click computes its target from the
    // already-advanced page (current + N clicks), not from a stale index.
    index = target;

    // old content dissolves fast as the leaf lifts
    dissolveOut();

    // flip the leaf over the centre fold (direction-aware). Restart cleanly so
    // a mid-flip interruption doesn't leave the leaf frozen half-turned.
    leafEl.className = 'leaf';
    void leafEl.offsetWidth;
    leafEl.className = 'leaf flipping ' + (dir > 0 ? 'forward' : 'backward');
    updateStatus();

    // Swap the displayed content at the flip mid-point AND immediately start
    // its pop, so the new content appears while the leaf lays down. One
    // continuous appearance — no blink, no empty gap.
    flipTimers.push(setTimeout(() => {
      renderSpread(index, { animate: false });
      popIn();
    }, DISSOLVE_MS + FLIP_MS * 0.5));

    flipTimers.push(setTimeout(() => {
      leafEl.className = 'leaf';
      busy = false;
    }, DISSOLVE_MS + FLIP_MS));
  }

  function go(dir) {
    // Don't wait for the animation: if a flip is in progress, cut it short and
    // start the next step from the (already-advanced) current index. Clicks
    // never get dropped, and `index` already reflects earlier clicks, so N
    // rapid clicks advance N pages (current + N), not just one.
    if (busy) finishFlipNow();
    if (!canGo(dir)) { nudgeEnd(dir); return; }
    runFlipTo(index + dir, dir);
  }

  const next = () => go(+1);
  const prev = () => go(-1);

  // Jump straight to a target page (used by the first/last buttons).
  function goTo(target) {
    if (busy) finishFlipNow();
    target = Math.max(0, Math.min(PAGES.length - 1, target));
    if (target === index) { nudgeEnd(target > index ? 1 : -1); return; }
    runFlipTo(target, target > index ? 1 : -1);
  }

  // Snap the in-flight flip to its finished state right now, so a fresh input
  // can start a new flip immediately instead of being ignored. Lands the
  // current content, clears the leaf, and drops the input lock.
  function finishFlipNow() {
    clearFlipTimers();
    renderSpread(index, { animate: false });
    spreadEl.classList.remove('dissolve', 'pop', 'pop-run');
    overlayEl.classList.remove('dissolve', 'pop', 'pop-run');
    leafEl.className = 'leaf';
    updateStatus();
    busy = false;
  }

  function nudgeEnd(dir) {
    // small visual bump when clamped at an end
    bookEl.classList.remove('bump-l', 'bump-r');
    void bookEl.offsetWidth;
    bookEl.classList.add(dir > 0 ? 'bump-r' : 'bump-l');
    setTimeout(() => bookEl.classList.remove('bump-l', 'bump-r'), 260);
  }

  function updateStatus() {
    statusEl.textContent = `${index + 1} / ${PAGES.length}`;
    // at the first page: first + prev disabled; at the last: next + last disabled
    const atFirst = index === 0, atLast = index === PAGES.length - 1;
    if (navFirstBtn) navFirstBtn.classList.toggle('is-disabled', atFirst);
    if (navPrevBtn) navPrevBtn.classList.toggle('is-disabled', atFirst);
    if (navNextBtn) navNextBtn.classList.toggle('is-disabled', atLast);
    if (navLastBtn) navLastBtn.classList.toggle('is-disabled', atLast);
  }

  // --- input wiring: keys + unified pointer (mouse/touch/pen) -----------
  function wireInput(root) {
    // Keyboard — be generous with remote/presenter aliases.
    const NEXT_KEYS = new Set([
      'ArrowRight', 'ArrowDown', ' ', 'Spacebar', 'Enter', 'PageDown'
    ]);
    const PREV_KEYS = new Set([
      'ArrowLeft', 'ArrowUp', 'Backspace', 'PageUp'
    ]);
    window.addEventListener('keydown', e => {
      if (NEXT_KEYS.has(e.key)) { e.preventDefault(); next(); }
      else if (PREV_KEYS.has(e.key)) { e.preventDefault(); prev(); }
    });

    // Unified Pointer Events over the WHOLE SCREEN (not just the book stage):
    //   - tap / click LEFT half of the viewport  -> previous page
    //   - tap / click RIGHT half of the viewport -> next page
    //     (the divide is the viewport centre line, which runs down the book's
    //      spine since the book is centred)
    //   - swipe right-to-left (dx < 0) -> next; left-to-right (dx > 0) -> back
    //     (same on mouse, touch, and pen; by distance+direction, not speed)
    // Presses that start on an interactive control (nav bar, music, library
    // button) are ignored here so those buttons keep working.
    let down = null;                 // press start, or null
    const SWIPE_PX = 60;             // horizontal distance threshold
    const TAP_PX = 10;               // movement under this = tap/click

    function onControl(target) {
      return !!(target && target.closest &&
        target.closest('.page-nav, .music-btn, .library-btn'));
    }

    // The pop-up pseudo-3D image under the pointer, or null. A tap here PLAYS
    // the object's own animation rather than turning the page.
    function objHostAt(target) {
      return target && target.closest ? target.closest('.obj-host') : null;
    }

    window.addEventListener('pointerdown', e => {
      if (onControl(e.target)) { down = null; return; }  // let controls handle it
      down = {
        x: e.clientX, y: e.clientY, id: e.pointerId, moved: false,
        objHost: objHostAt(e.target)   // press started on the image?
      };
      pointer.active = false;        // a press suppresses hover-tilt
      clearTimeout(hoverTimer);
    });

    window.addEventListener('pointermove', e => {
      if (down) {
        // dragging: track but do not tilt
        if (Math.abs(e.clientX - down.x) > TAP_PX ||
            Math.abs(e.clientY - down.y) > TAP_PX) down.moved = true;
        return;
      }
      // hover with no button/finger down -> tilt only, WHILE MOVING. Tilt is
      // still measured against the STAGE box so the object leans toward the
      // real pointer position over the book.
      const r = root.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.active = true;
      // if the pointer stops, hand control back to the autonomous idle motion.
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { pointer.active = false; }, HOVER_IDLE_MS);
    });

    const endPointer = e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const horizontal = Math.abs(dx) > Math.abs(dy);

      if (horizontal && Math.abs(dx) >= SWIPE_PX) {
        // swipe: distance+direction only, NOT speed. slow drag == flick.
        // A swipe still turns the page even if it started on the image.
        if (dx < 0) next();          // right-to-left -> next
        else prev();                 // left-to-right -> back
      } else if (!down.moved) {
        // tap / click that STAYED on the pop-up image: play that object's own
        // animation and do NOT turn the page. (Confirm the pointer both began
        // and ended on the same image host.)
        const upHost = objHostAt(e.target);
        if (down.objHost && upHost === down.objHost && upHost.__obj &&
            typeof upHost.__obj.play === 'function') {
          upHost.__obj.play();
          down = null;
          return;
        }
        // otherwise: which half of the SCREEN was hit? left -> back,
        // right -> forward. The divide is the viewport centre (the spine).
        if (e.clientX < window.innerWidth / 2) prev();
        else next();
      }
      down = null;
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', () => { down = null; });
    // if the pointer leaves the window entirely, stop the hover tilt
    window.addEventListener('pointerout', e => {
      if (!e.relatedTarget && !down) {
        pointer.active = false;
        clearTimeout(hoverTimer);
      }
    });
  }

  // --- idle auto-sway + pointer tilt applied to every object ------------
  // With no pointer movement the deer keeps a life-of-its-own motion: a gentle
  // left-right sway (rotateY) plus a forward-back bob (rotateX), on two slightly
  // different periods so it traces a soft, organic figure-8 instead of a flat
  // loop. Hovering takes over; when the pointer leaves we EASE back to the idle
  // motion instead of snapping.
  function startIdle() {
    const AMP_X = 0.62;         // left-right reach (-1..1 units)
    const AMP_Y = 0.46;         // forward-back reach
    const SPEED_X = 0.00110;    // rad/ms for the left-right sway
    const SPEED_Y = 0.00150;    // rad/ms for the forward-back bob (faster)
    // Easing is expressed as a per-second smoothing factor (how much of the
    // remaining gap is closed in one second) and converted to the real frame
    // dt below. This makes the motion identical at 30, 60 or 120Hz instead of
    // snapping faster on high-refresh displays. ~0.9998/s ≈ the old 0.06/frame.
    const EASE_PER_SEC = 0.9998;
    let last = performance.now();
    let curX = 0, curY = 0;     // currently-applied tilt (for smooth easing)

    // Respect the OS "reduce motion" setting: hold the deer still, let only the
    // pointer move it. The idle sway and bob are suppressed.
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function frame(now) {
      // clamp dt so a backgrounded tab that resumes doesn't lurch
      const dt = Math.min(50, now - last); last = now; idleT += dt;

      // autonomous motion (disabled when the user prefers reduced motion)
      const sx = reduceMotion ? 0 : Math.sin(idleT * SPEED_X) * AMP_X;
      const sy = reduceMotion ? 0 : Math.sin(idleT * SPEED_Y + Math.PI / 3) * AMP_Y;

      // target: follow the pointer while hovering, else the idle motion
      const tgX = pointer.active ? pointer.x : sx;
      const tgY = pointer.active ? pointer.y : sy;

      // frame-rate independent ease: close the same fraction of the gap per
      // unit time regardless of how long this frame actually took.
      const k = 1 - Math.pow(1 - EASE_PER_SEC, dt / 1000);
      curX += (tgX - curX) * k;
      curY += (tgY - curY) * k;

      activeObjects.forEach(o => o.apply(curX, curY));
      idleRAF = requestAnimationFrame(frame);
    }
    idleRAF = requestAnimationFrame(frame);
  }

  // --- utils -------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // --- boot --------------------------------------------------------------
  window.StorybookPOC = { init };
})();
