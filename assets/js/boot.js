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

  function start() {
    var entry = resolveEntry();

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
    // (e.g. mountWinter). Fall back to a global mountWinter if the named one
    // isn't present, so the scene still shows if the manifest drifts.
    try {
      var backdropFn =
        (entry && entry.backdrop && typeof window[entry.backdrop] === 'function')
          ? window[entry.backdrop]
          : (typeof window.mountWinter === 'function' ? window.mountWinter : null);
      if (backdropFn) backdropFn();
    } catch (e) { /* non-fatal */ }

    // 3) the book itself.
    try {
      var stage = document.getElementById('stage');
      if (stage && window.StorybookPOC) {
        window.StorybookPOC.init(stage);
        stage.focus();
      }
    } catch (e) { /* non-fatal */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
