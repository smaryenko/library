// Shelf — build the landing grid of story cards from the manifest.
//
// Reads window.STORIES (assets/js/stories.js) and renders one rectangular card
// per book: cover preview + title + blurb, linking to the book's page. Content
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
    return a;
  }

  function mountShelf(root) {
    const stories = window.STORIES || [];
    const grid = document.createElement('div');
    grid.className = 'shelf-grid';
    stories.forEach(s => grid.appendChild(cardEl(s)));
    root.appendChild(grid);
  }

  window.Shelf = { mount: mountShelf };

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
