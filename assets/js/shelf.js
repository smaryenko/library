// Shelf — build the landing carousel of story cards from the manifest.
//
// Reads window.STORIES (assets/js/stories.js) and renders one rectangular card
// per book (cover + title + blurb) on a spinning 3D ring, random order. Content
// agnostic: adding a book to the manifest adds a card here with no code change.

(function () {
  'use strict';

  function cardEl(story) {
    const a = document.createElement('a');
    a.className = 'story-card';
    a.href = story.url;
    a.setAttribute('aria-label', story.title);
    if (story.accent) a.style.setProperty('--accent', story.accent);

    const cover = document.createElement('img');
    cover.className = 'cover';
    cover.src = story.cover;
    cover.alt = story.title + ' cover';
    cover.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('p');
    name.className = 'name';
    name.textContent = story.title;
    meta.appendChild(name);
    if (story.blurb) {
      const blurb = document.createElement('p');
      blurb.className = 'blurb';
      blurb.textContent = story.blurb;
      meta.appendChild(blurb);
    }

    a.appendChild(cover);
    a.appendChild(meta);
    a.dataset.book = story.id;
    // top-left: saved-for-offline dot (green = whole book cached, red = not
    // yet); hidden until the service worker reports (wireOffline below)
    const dot = document.createElement('span');
    dot.className = 'offline-dot';
    dot.setAttribute('aria-hidden', 'true');
    a.appendChild(dot);
    // top-right corner label: fiction / non-fiction / puzzle
    if (story.category) {
      const tag = document.createElement('span');
      tag.className = 'category ' + story.category;
      tag.textContent = { fiction: 'Fiction', 'non-fiction': 'Non-fiction', puzzle: 'Puzzle' }[story.category] || story.category;
      a.appendChild(tag);
    }
    return a;
  }

  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  // Fisher–Yates: a fresh random order on every load
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Round, infinite carousel. Position `p` is measured in cards (unbounded, so
  // it wraps forever); each card is seated by its offset from p. While not dragging, p
  // eases toward an integer `target`, so every move ends exactly on a card.
  function mountShelf(root) {
    const stories = shuffle((window.STORIES || []).slice());
    const n = stories.length;
    if (!n) return;
    // Cards sit on an arc, SPREAD degrees apart; about five show at once
    // (front + two each side), the rest fade out behind. Each card's seat is
    // computed from its wrapped offset, so the loop is infinite for any n.
    const SPREAD = 26;
    const SHOW = 2.6;          // fully gone beyond this many cards from front
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const wrap = el('section', 'carousel');
    wrap.setAttribute('aria-roledescription', 'carousel');
    wrap.setAttribute('aria-label', 'Books');
    const stage = el('div', 'carousel-stage');
    const ring = el('div', 'carousel-ring');
    const cards = stories.map(cardEl);
    cards.forEach(c => { c.draggable = false; ring.appendChild(c); });
    stage.appendChild(ring);

    const controls = el('div', 'carousel-controls');
    const prev = el('button', 'carousel-btn');
    prev.type = 'button'; prev.textContent = '‹'; prev.setAttribute('aria-label', 'Previous book');
    const next = el('button', 'carousel-btn');
    next.type = 'button'; next.textContent = '›'; next.setAttribute('aria-label', 'Next book');
    controls.append(prev, next);
    wrap.append(stage, controls);
    root.appendChild(wrap);

    let p = 0, target = 0, radius = 0, front = -1;
    let raf = 0, last = 0;

    const mod = (a, m) => ((a % m) + m) % m;
    // signed distance (in cards) from p to card i, the short way round
    const offset = i => { let d = mod(i - p, n); if (d > n / 2) d -= n; return d; };

    function layout() {
      const w = ring.offsetWidth || 240;
      // neighbours just clear each other: chord between seats ≈ 1.08 card widths
      radius = (w * 1.08) / (2 * Math.sin(SPREAD * Math.PI / 360));
      front = -1;
      render();
    }

    function render() {
      const r = radius.toFixed(1);
      cards.forEach((c, i) => {
        const d = offset(i), a = Math.abs(d);
        if (a > SHOW + 0.5) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = '';
        c.style.transform = `translateZ(${-r}px) rotateY(${(d * SPREAD).toFixed(2)}deg) translateZ(${r}px)`;
        // front is full, sides fade, the far edge dissolves to nothing
        const op = a <= 1 ? 1 - 0.18 * a : Math.max(0, 0.82 * (SHOW - a) / (SHOW - 1));
        c.style.opacity = op.toFixed(3);
        c.style.zIndex = String(100 - Math.round(a * 10));
      });
      const f = mod(Math.round(p), n);
      if (f !== front) {
        front = f;
        cards.forEach((c, i) => {
          const on = i === f;
          c.classList.toggle('is-front', on);
          c.tabIndex = on ? 0 : -1;
          c.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
      }
    }

    function tick(t) {
      const dt = Math.min(64, t - (last || t));
      last = t;
      if (!dragging) {
        // exponential ease: smooth, settles in ~0.5s, never overshoots
        const k = reduce ? 1 : 1 - Math.exp(-dt / 110);
        p += (target - p) * k;
        if (Math.abs(target - p) < 0.0005) p = target;
      }
      render();
      if (dragging || p !== target) raf = requestAnimationFrame(tick);
      else { raf = 0; last = 0; updateCursor(); }
    }

    // Mouse cursor: the browser only re-checks what's under a still mouse when
    // it moves, so after a spin settled the cursor stayed "grab" over the new
    // front card until the mouse was nudged. The stage owns the cursor instead
    // (cards inherit it) and we set it ourselves from the card boxes.
    let mouseX = null, mouseY = null;
    function updateCursor() {
      if (mouseX == null) return;
      const c = dragging && moved ? 'grabbing'
        : cardAt(mouseX, mouseY, true) != null ? 'pointer' : 'grab';
      if (stage.style.cursor !== c) stage.style.cursor = c;
    }
    stage.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mouseX = e.clientX; mouseY = e.clientY;
      if (!raf) updateCursor();
    });
    stage.addEventListener('pointerleave', () => { mouseX = mouseY = null; stage.style.cursor = ''; });
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function by(k) { target = Math.round(target) + k; kick(); }
    function goTo(i) { target = Math.round(p + offset(i)); kick(); }

    prev.addEventListener('click', () => by(-1));
    next.addEventListener('click', () => by(1));

    // ---- drag / swipe (window listeners, no pointer capture, so a plain tap
    // still lands as a normal click on the card link) ----
    let dragging = false, downX = 0, downY = 0, startP = 0, moved = false;
    let downType = 'mouse', downId = null, downMod = false;
    // set only for the click that ends a drag; cleared right after, so a stale
    // flag can never swallow a later, real click (that made some clicks after
    // a spin need a second try)
    let eatClick = false;
    let samples = [];
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      // a second finger: ignore it. A mouse can't have two pointers down, so a
      // drag still "on" here lost its pointerup (released outside the window,
      // alt-tab...): drop it and take this press as new
      if (dragging && e.pointerType !== 'mouse' && e.pointerId !== downId) return;
      dragging = true; moved = false;
      downType = e.pointerType || 'mouse'; downId = e.pointerId;
      downMod = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;   // cmd/ctrl-click = new tab: left to the browser
      downX = e.clientX; downY = e.clientY; startP = p;
      samples = [{ x: e.clientX, t: e.timeStamp }];
      kick();
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - downX;
      // a finger wobbles more than a mouse: a bigger threshold before a tap
      // turns into a drag (a drag never opens a book)
      if (!moved && Math.abs(dx) > (e.pointerType === 'mouse' ? 6 : 14)) { moved = true; stage.classList.add('is-dragging'); }
      if (!moved) return;
      // one card width of drag = one card of travel
      p = startP - dx / (ring.offsetWidth * 1.05);
      samples.push({ x: e.clientX, t: e.timeStamp });
      if (samples.length > 6) samples.shift();
    });
    function release(e) {
      if (!dragging || (downId != null && e.pointerId !== downId)) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (moved) {
        eatClick = true;                 // the browser's click for this drag, if any, comes next
        setTimeout(() => { eatClick = false; }, 0);
        const a = samples[0], b = samples[samples.length - 1];
        const dtm = Math.max(1, b.t - a.t);
        const fresh = e.timeStamp - b.t < 80;          // held still = no fling
        const v = fresh ? -(b.x - a.x) / dtm / (ring.offsetWidth * 1.05) : 0; // cards/ms
        // fling carries on a bit, capped so it never races off
        const fling = Math.max(-4, Math.min(4, v * 260));
        target = Math.round(p + fling);
      } else if (!(downType === 'mouse' && downMod)) {
        // TAP / CLICK (touch, pen and mouse): decided entirely here, from what
        // is on screen at this moment. Native clicks on cards are ignored
        // (below). Mouse too: after a spin under a still cursor the browser
        // kept its stale hover / hit target, so the first click did nothing
        // until the mouse moved.
        // Safari's hit-testing on 3D-transformed links is flaky, and a tap
        // during the glide after a swipe used to be judged against a card
        // that wasn't visually in front yet, so it only spun.
        // pointercancel carries no reliable position: use where it went down.
        const x = e.type === 'pointercancel' ? downX : e.clientX;
        const y = e.type === 'pointercancel' ? downY : e.clientY;
        const hit = cardAt(x, y);
        if (hit == null) { target = Math.round(target); kick(); return; }
        // the card nearest the centre right now is the front one, even mid-glide
        const visualFront = mod(Math.round(p), n);
        if (hit === visualFront || hit === mod(Math.round(target), n) && Math.abs(offset(hit)) < 0.75) {
          target = Math.round(p + offset(hit)); p = target; render();   // stop the glide
          location.href = cards[hit].href;
          return;
        }
        goTo(hit);
        return;
      } else {
        target = Math.round(target);
      }
      kick();
    }
    // which visible card is under (x, y): nearest-to-centre cards win where
    // the on-screen boxes overlap (side cards' boxes overlap the front one)
    function cardAt(x, y, strict) {
      const order = cards.map((c, i) => i)
        .filter(i => cards[i].style.visibility !== 'hidden' && Number(cards[i].style.opacity || 1) > 0.05)
        .sort((a, b) => Math.abs(offset(a)) - Math.abs(offset(b)));
      const direct = order.find(i => {
        const r = cards[i].getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      if (direct != null || strict) return direct;
      // a tap in a gap between cards (or just above / below them, within the
      // stage) goes to the card whose middle is horizontally nearest
      const s = stage.getBoundingClientRect();
      if (y < s.top || y > s.bottom || !order.length) return undefined;
      let best, bestD = Infinity;
      order.forEach(i => {
        const r = cards[i].getBoundingClientRect();
        const d = Math.abs(x - (r.left + r.right) / 2);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    // window lost focus mid-drag: no pointerup will come
    window.addEventListener('blur', () => { if (dragging) { dragging = false; stage.classList.remove('is-dragging'); target = Math.round(p); kick(); } });

    // clicks: a drag never opens a book; a side card spins to the front first
    cards.forEach((c, i) => c.addEventListener('click', e => {
      // taps and plain clicks are handled on pointerup (above); the browser's
      // own click for them is ignored. Let through: e.detail 0 = keyboard
      // Enter, and modifier clicks (open in a new tab).
      if (e.detail !== 0 && !(downType === 'mouse' && downMod)) { e.preventDefault(); return; }
      if (eatClick) { e.preventDefault(); eatClick = false; return; }
      // still gliding the last bit after a spin: the card that is (nearly) in
      // front and is where the spin ends opens on the first click
      const arriving = i === mod(Math.round(target), n) && Math.abs(offset(i)) < 0.75;
      if (i !== front && !arriving) { e.preventDefault(); goTo(i); }
    }));

    // wheel / trackpad: accumulate, one card per ~70px, throttled
    let wheelAcc = 0, wheelAt = 0;
    stage.addEventListener('wheel', e => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      wheelAcc += d;
      const now = performance.now();
      if (Math.abs(wheelAcc) >= 70 && now - wheelAt > 90) {
        by(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0; wheelAt = now;
      }
    }, { passive: false });

    // keys: same as the books' page turns
    const NEXT = ['ArrowRight', 'ArrowDown', 'PageDown'];
    const PREV = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
    window.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (NEXT.includes(e.key)) {
        e.preventDefault(); by(1);
      } else if (PREV.includes(e.key)) {
        e.preventDefault(); by(-1);
      } else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') &&
                 !/BUTTON|^A$/.test(tag)) {
        // Enter / Space open the front book (a focused button/link keeps its own)
        e.preventDefault(); cards[front].click();
      }
    });

    let rz = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(layout, 100);
    });
    layout();
  }

  window.Shelf = { mount: mountShelf };

  // Web fonts: Fredoka / Nunito are self-hosted in assets/fonts/ (@font-face
  // in shelf.css, preloaded by index.html, cached offline by sw.js). They used
  // to come from Google Fonts, added here after first paint, so every shelf
  // visit painted system fonts first and then swapped (a visible flick).

  // --- pull to refresh (touch) -------------------------------------------
  // The shelf never scrolls (shelf.css: overflow hidden, overscroll none), so
  // the browser's own pull-to-refresh is gone. Same gesture as the books
  // (storybook.js wirePullToRefresh): drag one finger DOWN from the top part
  // of the screen past the threshold and let go to reload. Mostly-vertical
  // drags only, so sideways carousel spins are unaffected.
  function wirePullToRefresh() {
    const START_MAX_Y = 0.4;   // must start in the top 40% of the screen
    const PULL_PX = 80;        // indicator travel needed to reload
    let start = null, ind = null, ready = false;

    function indicator() {
      if (!ind) {
        ind = document.createElement('div');
        ind.className = 'pull-refresh';
        ind.setAttribute('aria-hidden', 'true');
        ind.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66" ' +
          'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>';
        document.body.appendChild(ind);
      }
      return ind;
    }
    function reset() {
      start = null; ready = false;
      if (ind) { ind.style.transform = ''; ind.style.opacity = ''; ind.classList.remove('is-ready'); }
    }

    window.addEventListener('pointerdown', e => {
      if (start) { reset(); return; }            // a second finger: not a pull
      if (e.pointerType !== 'touch' || e.clientY > window.innerHeight * START_MAX_Y) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    }, true);
    window.addEventListener('pointermove', e => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (dy <= 0 || Math.abs(dx) > dy) { if (ind) ind.style.opacity = ''; ready = false; return; }
      const pull = Math.min(dy * 0.5, PULL_PX * 1.25);
      ready = pull >= PULL_PX;
      const el = indicator();
      el.style.opacity = String(Math.min(1, pull / 30));
      el.style.transform = `translate(-50%, ${pull}px) rotate(${pull * 3}deg)`;
      el.classList.toggle('is-ready', ready);
    }, true);
    window.addEventListener('pointerup', e => {
      if (!start || e.pointerId !== start.id) return;
      if (ready) { indicator().classList.add('is-loading'); location.reload(); return; }
      reset();
    }, true);
    window.addEventListener('pointercancel', reset, true);
  }

  // --- offline -----------------------------------------------------------
  // The site-wide service worker (sw.js, scope = site root) caches the
  // library shell; each book page asks for its own files (boot.js). Waits
  // for the page's own load so it never competes with first paint.
  // UI: a dot on every card (green = saved for offline, red = not yet) and a
  // "Save all books" button that caches everything at once. Both appear only
  // once the worker answers, so browsers without one show neither.
  function wireOffline() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const sw = navigator.serviceWorker;
    let saveBtn = null, saving = false, finished = false, allSaved = false;
    const STATUS_KEY = 'library-offline-status';
    const mb = b => b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB'
      : (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';

    function button(bytes) {
      if (saveBtn) return saveBtn;
      const controls = document.querySelector('.carousel-controls');
      if (!controls) return null;
      saveBtn = el('button', 'offline-save');
      saveBtn.type = 'button';
      saveBtn.dataset.bytes = String(bytes || 0);
      // between the ‹ › buttons
      controls.insertBefore(saveBtn, controls.lastChild);
      saveBtn.addEventListener('click', () => {
        if (saving || allSaved) return;
        saving = true; finished = false;
        saving_(0);
        // a deliberate tap: ask the browser to keep the files even when the
        // device runs low on storage (Chrome / Firefox; Safari still clears
        // sites not opened for ~7 days unless added to the Home Screen)
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        // the page downloads into the worker's cache itself: no message to a
        // worker that may be an older version (one that ignored 'cache-all'
        // left the button on 0% for good)
        saveAll().then(refreshLocal, refreshLocal);
      });
      return saveBtn;
    }
    // Short labels: the pill has one fixed width (shelf.css) for every state,
    // so it never jumps; the long wording goes to aria-label.
    //   idle   'Save offline · 11.3 MB'   saving 'Saving 42%' (+ fill bar)
    //   done   '✓ Saved offline'          failed 'Retry saving'
    function label(text, done, aria, pct) {
      if (!saveBtn) return;
      saveBtn.textContent = text;
      saveBtn.setAttribute('aria-label', aria || text);
      saveBtn.classList.toggle('is-done', !!done);
      saveBtn.classList.toggle('is-saving', pct != null);
      saveBtn.style.setProperty('--p', pct != null ? pct + '%' : '0%');
      saveBtn.disabled = !!done;
    }
    function saving_(pct) { label('Saving ' + pct + '%', false, 'Saving all books for offline, ' + pct + ' percent', pct); }
    function idle(bytes) {
      label('Save offline' + (bytes ? ' · ' + mb(bytes) : ''), false,
        'Save all books for offline' + (bytes ? ', ' + mb(bytes) : ''));
    }

    sw.addEventListener('message', e => {
      const d = e.data || {};
      if (d.type === 'offline-progress' && saving) {
        finished = d.done >= d.total;
        saving_(d.total ? Math.floor(100 * d.done / d.total) : 100);
      } else if (d.type === 'offline-status') {
        try { localStorage.setItem(STATUS_KEY, JSON.stringify(d)); } catch (err) {}
        applyStatus(d);
      }
    });

    function applyStatus(d) {
      {
        let all = true;
        document.querySelectorAll('.story-card[data-book]').forEach(card => {
          const id = card.dataset.book;
          const ok = !!(d.books && d.books[id]);
          if (d.books && !(id in d.books)) return;   // not in the offline list
          if (!ok) all = false;
          card.classList.add('has-offline');
          card.classList.toggle('is-offline-ready', ok);
          const title = card.getAttribute('aria-label').replace(/ \(saved for offline\)$/, '');
          card.setAttribute('aria-label', ok ? title + ' (saved for offline)' : title);
        });
        all = all && d.shell;
        allSaved = all;
        if (!button(d.bytes)) return;
        if (all) { saving = false; label('✓ Saved offline', true, 'All books saved for offline'); }
        // a status from an earlier, smaller run (this page's own shell
        // cache) can land mid-save: only a finished save-all counts
        else if (saving && !finished) return;
        else if (saving) { saving = false; label('Retry saving', false, 'Some books could not be saved. Try again'); }
        // only what is left to download (an older worker sends no `missing`)
        else idle(d.missing != null ? d.missing : d.bytes);
      }
    }

    // The page reads the worker's cache itself (Cache API is available to
    // pages too), so the size and the dots never depend on a worker message
    // arriving (an old worker, a tab it doesn't control yet...). Same shape
    // as sw.js status(); keep the two in step.
    async function localStatus() {
      if (!window.caches) return null;
      const scope = new URL('./', location.href).href;
      const murl = scope + 'offline-manifest.json';
      const names = (await caches.keys()).filter(n => /^library-v/.test(n));
      const cache = names.length ? await caches.open(names[names.length - 1]) : null;
      // stored copy first: the worker's precache run (ask() -> 'cache')
      // already fetches a fresh manifest on every load and stores it here, so
      // fetching it again from the page doubled the request. The network is
      // only used when nothing is stored yet (first visit, no worker).
      let m = null;
      if (cache) { const r = await cache.match(murl); if (r) m = await r.json(); }
      if (!m) { try { const r = await fetch(murl, { cache: 'no-cache' }); if (r.ok) m = await r.json(); } catch (err) {} }
      if (!m) return null;
      const all = [...new Set((m.shell || []).concat(...Object.values(m.books || {})))];
      // cached AND same content as the manifest (x-hash, see sw.js fresh())
      const ok = {};
      await Promise.all(all.map(async p => { ok[p] = await fresh(cache, scope, p, m); }));
      const hasAll = list => list.every(p => ok[p]);
      const shell = hasAll(m.shell || []);
      const books = {};
      for (const id of Object.keys(m.books || {})) books[id] = shell && hasAll(m.books[id]);
      const sizes = m.sizes || {};
      const missing = all.reduce((s, p) => s + (ok[p] ? 0 : sizes[p] || 0), 0);
      return { type: 'offline-status', shell, books, bytes: m.bytes || 0, missing };
    }
    async function fresh(cache, scope, p, m) {
      if (!cache) return false;
      const r = await cache.match(new URL(p, scope).href, { ignoreSearch: true });
      if (!r) return false;
      const want = m.hashes && m.hashes[p];
      return !want || r.headers.get('x-hash') === want;
    }
    // stored copy with x-hash = SHA-1 of the body (first 16 hex); also turns
    // a redirected response into a plain one. Same as sw.js clean().
    async function stamp(r) {
      const buf = await r.arrayBuffer();
      const d = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
      const h = Array.from(d, b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
      const headers = new Headers(r.headers);
      headers.set('x-hash', h);
      return new Response(buf, { status: r.status, statusText: r.statusText, headers });
    }
    // "Save all": every manifest file not cached yet, 4 at a time, progress on
    // the button. Same cache name as sw.js (CACHE = 'library-v' + VERSION).
    async function saveAll() {
      const scope = new URL('./', location.href).href;
      const murl = scope + 'offline-manifest.json';
      const r0 = await fetch(murl, { cache: 'no-cache' });
      if (!r0.ok) throw new Error('manifest');
      const m = await r0.clone().json();
      const names = (await caches.keys()).filter(n => /^library-v/.test(n));
      const cache = await caches.open(names.length ? names[names.length - 1] : 'library-v1');
      await cache.put(murl, r0);
      const all = [...new Set((m.shell || []).concat(...Object.values(m.books || {})))];
      // new or changed files (all checks run at once)
      const ok = await Promise.all(all.map(p => fresh(cache, scope, p, m)));
      const todo = all.filter((p, i) => !ok[i]).map(p => new URL(p, scope).href);
      // files no longer in the manifest (removed from a book): drop them
      const keep = new Set(all.map(p => new URL(p, scope).href).concat(murl));
      (await cache.keys()).forEach(k => { if (!keep.has(k.url.split('?')[0])) cache.delete(k); });
      let done = 0;
      const step = () => { finished = done >= todo.length; saving_(todo.length ? Math.floor(100 * done / todo.length) : 100); };
      step();
      // every file requested at once: GitHub Pages speaks HTTP/2, so they
      // share one connection and the browser schedules them itself. The
      // x-offline-save header tells sw.js to pass the request straight
      // through instead of caching it a second time.
      const one = async url => {
        {
          try {
            // no-cache: a changed file must not come from the HTTP cache
            const r = await fetch(url, { cache: 'no-cache', headers: { 'x-offline-save': '1' } });
            if (r.ok) {
              // old ?v= copies of this file go, the fresh stamped copy stays
              const olds = await cache.keys(url, { ignoreSearch: true });
              await cache.put(url, await stamp(r));
              await Promise.all(olds.filter(k => k.url !== url).map(k => cache.delete(k)));
            }
          } catch (err) { /* offline or gone: "Retry saving" */ }
          done++;
          step();
        }
      };
      await Promise.all(todo.map(one));
      finished = true;
    }

    function refreshLocal() {
      localStatus().then(s => {
        if (!s) return;
        try { localStorage.setItem(STATUS_KEY, JSON.stringify(s)); } catch (err) {}
        applyStatus(s);
      }, () => {});
    }

    // last known state, shown at once (offline too): the dots and the button
    // don't wait for the worker; its fresh status then corrects them
    try {
      const last = JSON.parse(localStorage.getItem(STATUS_KEY) || 'null');
      if (last && last.type === 'offline-status') applyStatus(last);
    } catch (err) {}

    // the button shows at once; the worker's status then fills in the size,
    // the card dots and the "all saved" state
    const ask = () => sw.ready.then(reg => {
      if (!reg.active) return;
      reg.active.postMessage({ type: 'status' });
      reg.active.postMessage({ type: 'cache' });
    });
    const go = () => {
      sw.register('sw.js', { scope: './' }).then(() => {
        if (button(0) && !saving && !allSaved && !saveBtn.textContent) idle(0);
      }, () => {});
      ask();
      refreshLocal();
      // again once the background shell caching has had time to land
      setTimeout(refreshLocal, 4000);
      // an updated sw.js took over (an older worker may not know 'status'):
      // ask the new one
      sw.addEventListener('controllerchange', ask);
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }

  function start() {
    const root = document.getElementById('shelf');
    if (root) mountShelf(root);
    wirePullToRefresh();
    wireOffline();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
