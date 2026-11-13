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
    // top-right corner label: fiction / non-fiction
    if (story.category) {
      const tag = document.createElement('span');
      tag.className = 'category ' + story.category;
      tag.textContent = story.category === 'fiction' ? 'Fiction' : 'Non-fiction';
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
      else { raf = 0; last = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function by(k) { target = Math.round(target) + k; kick(); }
    function goTo(i) { target = Math.round(p + offset(i)); kick(); }

    prev.addEventListener('click', () => by(-1));
    next.addEventListener('click', () => by(1));

    // ---- drag / swipe (window listeners, no pointer capture, so a plain tap
    // still lands as a normal click on the card link) ----
    let dragging = false, downX = 0, startP = 0, moved = false;
    let samples = [];
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      dragging = true; moved = false;
      downX = e.clientX; startP = p;
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
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (moved) {
        const a = samples[0], b = samples[samples.length - 1];
        const dtm = Math.max(1, b.t - a.t);
        const fresh = e.timeStamp - b.t < 80;          // held still = no fling
        const v = fresh ? -(b.x - a.x) / dtm / (ring.offsetWidth * 1.05) : 0; // cards/ms
        // fling carries on a bit, capped so it never races off
        const fling = Math.max(-4, Math.min(4, v * 260));
        target = Math.round(p + fling);
      } else {
        target = Math.round(p);
        // Touch tap: Safari's hit-testing on 3D-transformed links is flaky
        // (taps land on nothing or on a hidden back card), so pick the card
        // from its on-screen box ourselves. Front card first; it opens.
        if (e.type === 'pointerup' && e.pointerType !== 'mouse') {
          const inside = c => {
            const r = c.getBoundingClientRect();
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          };
          const order = cards.map((c, i) => i)
            .filter(i => cards[i].style.visibility !== 'hidden')
            .sort((a, b) => Math.abs(offset(a)) - Math.abs(offset(b)));
          const hit = order.find(i => inside(cards[i]));
          if (hit != null) {
            touchTapAt = performance.now();
            if (hit === front) { location.href = cards[hit].href; return; }
            goTo(hit); return;
          }
        }
      }
      kick();
    }
    let touchTapAt = 0;
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    // clicks: a drag never opens a book; a side card spins to the front first
    cards.forEach((c, i) => c.addEventListener('click', e => {
      if (moved) { e.preventDefault(); moved = false; return; }
      // the touch tap was already handled on pointerup: don't act twice
      if (performance.now() - touchTapAt < 700) { e.preventDefault(); return; }
      if (i !== front) { e.preventDefault(); goTo(i); }
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

  // Web fonts, non-blocking: a stylesheet added from script doesn't hold up
  // rendering, so the shelf paints at once in system fonts and swaps to
  // Fredoka / Nunito when (if) Google Fonts answers.
  const FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap';
  if (!document.querySelector('link[data-webfonts]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONTS;
    l.setAttribute('data-webfonts', '');
    document.head.appendChild(l);
  }

  function start() {
    const root = document.getElementById('shelf');
    if (root) mountShelf(root);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
