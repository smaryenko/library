// Generic book boot. Shared across all books — content-agnostic.
//
// Resolves which book is being shown, then:
//   1) configures the shared music player with that book's track;
//   2) mounts that book's backdrop (named in the manifest, e.g. mountWinter);
//   3) inits the shared storybook engine over window.BOOK_PAGES.
//
// Kept as an external file (not an inline <script>) so it runs under strict
// Content-Security-Policy where inline scripts are blocked.
//
// How the book is resolved (first match wins):
//   - window.BOOK_ID set by the book page, else
//   - ?book=<id> on the URL, else
//   - the book folder name inferred from the path (books/<id>/), else
//   - the first entry in the manifest.
(function () {
  'use strict';

  function resolveEntry() {
    var stories = window.STORIES || [];
    if (!stories.length) return null;

    var id = window.BOOK_ID;
    if (!id) {
      try {
        var p = new URLSearchParams(window.location.search);
        id = p.get('book');
      } catch (e) { /* no URLSearchParams -> fall through */ }
    }
    if (!id) {
      var m = window.location.pathname.match(/books\/([^/]+)\//);
      if (m) id = m[1];
    }
    if (id) {
      for (var i = 0; i < stories.length; i++) {
        if (stories[i].id === id) return stories[i];
      }
    }
    return stories[0];
  }

  // Manifest asset paths (cover, og, track) are written relative to the SHELF
  // root (so the shelf cards resolve them). A book page lives two levels deeper
  // at books/<id>/, so the same paths must be prefixed with ../../ there.
  // Returns the given shelf-root-relative path made correct for THIS page.
  function fromShelfRoot(path) {
    if (!path) return path;
    // absolute URLs / rooted paths are left as-is
    if (/^([a-z]+:)?\/\//i.test(path) || path.charAt(0) === '/') return path;
    // on a book page (…/books/<id>/…), hop back up to the shelf root
    if (/books\/[^/]+\//.test(window.location.pathname)) return '../../' + path;
    return path;
  }

  // Shared page chrome: the "Library" back button, the stage and the hint
  // line. Every book page used to repeat this markup; now a book's <body>
  // only needs its <script> tags. Anything the page already has (e.g. a
  // hand-written #stage) is left alone. A book can override the hint text
  // with `hint` in its manifest entry.
  var DEFAULT_HINT = 'Tap/click the right half \u2192 next \u00b7 left half \u2192 back \u00b7 ' +
    'swipe right-to-left = next, left-to-right = back \u00b7 arrows/Space/PageUp\u00b7Down \u00b7 hover to tilt';
  function ensureChrome(entry) {
    var body = document.body, first = body.firstChild;
    if (!document.querySelector('.library-btn')) {
      var a = document.createElement('a');
      a.className = 'library-btn';
      a.href = fromShelfRoot('index.html');
      a.setAttribute('aria-label', 'Back to the library');
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" ' +
        'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="label">Library</span>';
      body.insertBefore(a, first);
    }
    if (!document.getElementById('stage')) {
      var stage = document.createElement('div');
      stage.className = 'book-stage';
      stage.id = 'stage';
      stage.tabIndex = 0;
      body.insertBefore(stage, first);
    }
    if (!document.querySelector('.hint')) {
      var hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = (entry && entry.hint) || DEFAULT_HINT;
      body.insertBefore(hint, first);
    }
  }
  function start() {
    var entry = resolveEntry();
    try { ensureChrome(entry); } catch (e) { /* non-fatal */ }

    // Each step is independent and guarded, so a failure in one (e.g. no music
    // player yet) can never silently suppress the others (like the backdrop).

    // 1) music track (optional). The shared player just loops whatever it gets.
    try {
      if (entry && entry.track && window.MusicPlayer &&
          typeof window.MusicPlayer.setTrack === 'function') {
        window.MusicPlayer.setTrack(fromShelfRoot(entry.track));
      }
    } catch (e) { /* non-fatal */ }

    // 2) backdrop (optional). The manifest names a global fn the book defines
    // (e.g. mountWinter); a book without one just has no backdrop.
    try {
      var backdropFn =
        (entry && entry.backdrop && typeof window[entry.backdrop] === 'function')
          ? window[entry.backdrop] : null;
      if (backdropFn) var backdropReady = backdropFn();
    } catch (e) { /* non-fatal */ }

    // 3) the book itself.
    try {
      var stage = document.getElementById('stage');
      if (stage && window.StorybookPOC) {
        window.StorybookPOC.init(stage);
        stage.focus();
      }
    } catch (e) { /* non-fatal */ }

    // 4) heavy books show a .book-loading screen from the first paint (it is
    // in their HTML, scripts are deferred). Fade it out once the page has
    // fully loaded, the backdrop is ready (a backdrop may return a Promise
    // for async work) and two frames have drawn (WebGL first frame is up).
    hideLoading(backdropReady);

    // 5) offline: register the site-wide service worker (sw.js at the shelf
    // root) and ask it to cache the library shell plus this book's files.
    wireOffline(entry);
  }

  // The book id comes from the folder (books/<id>/), so a page not in the
  // manifest (books/preview/) still caches its own files, not stories[0]'s.
  function wireOffline(entry) {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;
    var m = window.location.pathname.match(/books\/([^/]+)\//);
    var id = m ? m[1] : (entry && entry.id);
    function go() {
      navigator.serviceWorker.register(fromShelfRoot('sw.js'), { scope: fromShelfRoot('./') })
        .catch(function () {});
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg.active) reg.active.postMessage({ type: 'cache', book: id || null });
      });
    }
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }

  function hideLoading(ready) {
    var el = document.querySelector('.book-loading');
    if (!el) return;
    var loaded = new Promise(function (res) {
      if (document.readyState === 'complete') res(); else window.addEventListener('load', res);
    });
    var bd = ready && typeof ready.then === 'function' ? ready.catch(function () {}) : null;
    var safety = new Promise(function (res) { setTimeout(res, 20000); });   // never stuck behind a failed load
    Promise.race([Promise.all([loaded, bd]), safety]).then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add('is-done');
          el.setAttribute('aria-hidden', 'true');
          setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
