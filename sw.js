// Offline support: service worker for the whole site (library + every book).
//
// Registered by shelf.js (library page) and boot.js (book pages), always with
// the site root as scope. Two ways files get into the cache:
//   1) precache, from offline-manifest.json (tools/build-offline.js):
//      the library page posts {type:'cache'}         -> the shell list;
//      a book page posts {type:'cache', book:'<id>'} -> shell + that book.
//      Runs after the page's own load, files already cached are skipped.
//   2) runtime: every same-origin GET the pages make is stored as it passes.
//
// Serving:
//   URL with a query (?v=N cache-busters): cache first, these never change.
//     A new ?v= misses, comes from the network and replaces the old entry;
//     offline, the old version (same path, any query) is served instead.
//   URL without a query (pages, photos): cache first, refreshed in the
//     background, so an update shows on the next visit.
//
// Never cached (requests pass straight to the network): other origins
// (Google Fonts: offline the system fonts show), og images, music (.mp3,
// also range requests). Keep SKIP in step with tools/build-offline.js.
//
// Bump VERSION to drop every cached file (e.g. after a big rename).
'use strict';
const VERSION = 1;
const CACHE = 'library-v' + VERSION;
const SCOPE = self.registration.scope;
const MANIFEST = SCOPE + 'offline-manifest.json';
const SKIP = /\/og\.(png|svg)$|\.mp3$/i;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(precache(null).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('library-') && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'cache') e.waitUntil(precache(d.book || null).catch(() => {}));
});

// ---- precache --------------------------------------------------------------
async function manifest() {
  try {
    const r = await fetch(MANIFEST, { cache: 'no-cache' });
    if (r.ok) {
      await (await caches.open(CACHE)).put(MANIFEST, r.clone());
      return await r.json();
    }
  } catch (err) { /* offline: use the stored copy */ }
  const old = await caches.match(MANIFEST);
  return old ? old.json() : null;
}

let busy = Promise.resolve();
function precache(book) {
  // one run at a time, so two tabs don't download the same files twice
  busy = busy.then(async () => {
    const m = await manifest();
    if (!m) return;
    const list = (m.shell || []).concat(book && m.books && m.books[book] || []);
    await fill(list);
  });
  return busy;
}

async function fill(paths) {
  const cache = await caches.open(CACHE);
  const todo = [];
  for (const p of paths) {
    const url = new URL(p, SCOPE).href;
    if (!(await cache.match(url, { ignoreSearch: true }))) todo.push(url);
  }
  // a few at a time: keeps the connection free for what the reader is doing
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(async url => {
      try {
        const r = await fetch(url);
        if (r.ok && r.type === 'basic') await cache.put(url, await clean(r));
      } catch (err) { /* offline or gone: try again on the next load */ }
    }));
  }
}

// a redirected response (books/x -> books/x/) can't answer a page navigation:
// store a plain copy instead
async function clean(r) {
  if (!r.redirected) return r;
  return new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers });
}

// ---- serving ---------------------------------------------------------------
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(SCOPE)) return;
  const url = new URL(req.url);
  if (SKIP.test(url.pathname) || req.headers.has('range')) return;
  e.respondWith(serve(req, url, e));
});

async function serve(req, url, e) {
  const cache = await caches.open(CACHE);
  const store = async r => {
    if (r.ok && r.type === 'basic') {
      await cache.put(req, await clean(r.clone()));
      if (url.search) await dropOthers(cache, req);
    }
    return r;
  };

  if (url.search) {
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      return await store(await fetch(req));
    } catch (err) {
      const old = await cache.match(req, { ignoreSearch: true });
      if (old) return old;
      throw err;
    }
  }

  const hit = await cache.match(req);
  const net = fetch(req).then(store);
  if (hit) {
    e.waitUntil(net.catch(() => {}));
    return hit;
  }
  try {
    return await net;
  } catch (err) {
    const old = await cache.match(req, { ignoreSearch: true });
    if (old) return old;
    throw err;
  }
}

// a new ?v= replaced a file: drop its older versions
async function dropOthers(cache, req) {
  const keys = await cache.keys(req, { ignoreSearch: true });
  await Promise.all(keys.filter(k => k.url !== req.url).map(k => cache.delete(k)));
}
