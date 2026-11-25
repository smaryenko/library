// Offline support: service worker for the whole site (library + every book).
//
// Registered by shelf.js (library page) and boot.js (book pages), always with
// the site root as scope. Two ways files get into the cache:
//   1) precache, from offline-manifest.json (tools/build-offline.js):
//      the library page posts {type:'cache'}         -> the shell list;
//      a book page posts {type:'cache', book:'<id>'} -> shell + that book;
//      the shelf's "Save all books" button posts {type:'cache-all'}.
//      Runs after the page's own load, files already cached are skipped.
//      The shelf shows each card's state (green dot = saved) from 'status'.
//   2) runtime: every same-origin GET the pages make is stored as it passes.
//
// Serving:
//   URL with a query (?v=N cache-busters): cache first, these never change.
//     A new ?v= misses, comes from the network and replaces the old entry;
//     offline, the old version (same path, any query) is served instead.
//   Page navigations (index.html): network first, cache only when offline.
//   Other URLs without a query (photos): cache first, refreshed in the
//     background, so an update shows on the next visit.
//
// Never cached (requests pass straight to the network): other origins, og
// images, music (.mp3, also range requests). The shelf fonts are self-hosted
// in assets/fonts/, so they are part of the shell and work offline.
// Keep SKIP in step with tools/build-offline.js.
//
// Bump VERSION to drop every cached file (e.g. after a big rename).
'use strict';
const VERSION = 1;   // the cache name; changing sw.js code alone keeps the files
const CACHE = 'library-v' + VERSION;
const SCOPE = self.registration.scope;
const MANIFEST = SCOPE + 'offline-manifest.json';
const SKIP = /\/og\.(png|svg)$|\.mp3$/i;
// Offline: don't try the network just to see it fail (each try is a red
// "failed" row). navigator.onLine alone isn't enough: it stays true on a
// network without internet, and in the worker under DevTools' "Offline"
// throttle. So any failed request also marks the network as down for a
// short while; the first success clears it. A page load still tries the
// network once (network-first), which is what notices it's back.
let netDownUntil = 0;
const DOWN_MS = 15000;
const online = () => self.navigator.onLine !== false && Date.now() >= netDownUntil;
async function net(req, init) {
  try {
    const r = await fetch(req, init);
    netDownUntil = 0;
    return r;
  } catch (err) {
    // a cancelled request (page left mid-load) says nothing about the network
    if (!err || err.name !== 'AbortError') netDownUntil = Date.now() + DOWN_MS;
    throw err;
  }
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(precache([]).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('library-') && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Messages from the pages:
//   {type:'cache', book?}  shell (+ that book), then status to every tab
//   {type:'cache-all'}     shell + every book, with progress, then status
//   {type:'status'}        status to the asking tab
// Replies: {type:'offline-progress', done, total}
//          {type:'offline-status', shell, books:{id:true|false}, bytes, missing}
//          (bytes = everything, missing = what is not cached yet)
//          (books[id] is true only when the shell is complete too)
self.addEventListener('message', e => {
  const d = e.data || {};
  const src = e.source;
  if (d.type === 'cache') e.waitUntil(precache(d.book ? [d.book] : []).then(broadcastStatus, () => {}));
  else if (d.type === 'cache-all') e.waitUntil(precache('all', progress).then(broadcastStatus, () => {}));
  else if (d.type === 'status') e.waitUntil(status().then(s => { if (s && src) src.postMessage(s); }));
});

async function broadcast(msg) {
  // includeUncontrolled: a tab opened before this worker took over (first
  // visit, right after clearing site data) is not "controlled" yet, and
  // would otherwise never hear the progress / done messages
  const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  tabs.forEach(c => c.postMessage(msg));
}
function progress(done, total) { return broadcast({ type: 'offline-progress', done, total }); }
async function broadcastStatus() { const s = await status(); if (s) await broadcast(s); }

// stored manifest first: the status answer never waits on the network
// (offline, or a slow connection); a fresh copy is fetched by precache runs
async function storedManifest() {
  const old = await caches.match(MANIFEST);
  return old ? old.json() : manifest();
}

// path -> hash from the newest manifest this worker has seen; kept in memory
// so serving a file doesn't parse the manifest each time. Refreshed by
// manifest() on every precache run (each library / book page load).
let hashes = null;
async function knownHashes() {
  if (!hashes) {
    try { const r = await caches.match(MANIFEST); hashes = (r && (await r.json()).hashes) || {}; }
    catch (err) { hashes = {}; }
  }
  return hashes;
}

async function status() {
  const m = await storedManifest();
  if (!m) return null;
  const cache = await caches.open(CACHE);
  const all = [...new Set((m.shell || []).concat(...Object.values(m.books || {})))];
  // each file checked once: cached AND the same content as the manifest
  const ok = {};
  await Promise.all(all.map(async p => { ok[p] = await fresh(cache, p, m); }));
  const has = list => list.every(p => ok[p]);
  const shell = has(m.shell || []);
  const books = {};
  for (const id of Object.keys(m.books || {})) books[id] = shell && has(m.books[id]);
  // bytes still to download for "save all" (new + changed files)
  const sizes = m.sizes || {};
  const missing = all.reduce((s, p) => s + (ok[p] ? 0 : sizes[p] || 0), 0);
  return { type: 'offline-status', shell, books, bytes: m.bytes || 0, missing };
}

// ---- precache --------------------------------------------------------------
async function manifest() {
  if (online()) try {
    const r = await net(MANIFEST, { cache: 'no-cache' });
    if (r.ok) {
      await (await caches.open(CACHE)).put(MANIFEST, r.clone());
      const m = await r.json();
      hashes = (m && m.hashes) || {};
      return m;
    }
  } catch (err) { /* offline: use the stored copy */ }
  const old = await caches.match(MANIFEST);
  return old ? old.json() : null;
}

// books: array of ids, or 'all'. The shell is always included.
let busy = Promise.resolve();
function precache(books, onProgress) {
  // one run at a time, so two tabs don't download the same files twice
  busy = busy.catch(() => {}).then(async () => {
    const m = await manifest();
    if (!m) return;
    const ids = books === 'all' ? Object.keys(m.books || {}) : (books || []);
    const list = [...new Set((m.shell || []).concat(...ids.map(id => (m.books || {})[id] || [])))];
    await fill(list, onProgress, m);
  });
  return busy;
}

// Content fingerprints: tools/build-offline.js writes `hashes` (first 16 hex
// of each file's SHA-1) into the manifest; every cached copy carries the
// SHA-1 of what was actually stored in an x-hash header. A copy whose hash
// differs (the file changed in a deploy) counts as missing: the card goes
// red, "Save all" fetches just those files. Same scheme in shelf.js.
async function fresh(cache, p, m) {
  const r = await cache.match(new URL(p, SCOPE).href, { ignoreSearch: true });
  if (!r) return false;
  const want = m && m.hashes && m.hashes[p];
  return !want || r.headers.get('x-hash') === want;
}

async function fill(paths, onProgress, m) {
  const cache = await caches.open(CACHE);
  const todo = [];
  for (const p of paths) {
    if (!(await fresh(cache, p, m))) todo.push(new URL(p, SCOPE).href);
  }
  // a few at a time: keeps the connection free for what the reader is doing
  let done = 0;
  if (onProgress) await onProgress(0, todo.length);
  if (!online()) return;   // offline: try again on the next online load
  for (let i = 0; i < todo.length; i += 4) {
    if (!online()) return;   // the connection dropped mid-way
    await Promise.all(todo.slice(i, i + 4).map(async url => {
      try {
        // no-cache: a changed file must not come from the HTTP cache
        const r = await net(url, { cache: 'no-cache' });
        if (r.ok && r.type === 'basic') {
          await cache.put(url, await clean(r));
          await dropOthers(cache, new Request(url));
        }
      } catch (err) { /* offline or gone: try again on the next load */ }
    }));
    done = Math.min(todo.length, i + 4);
    if (onProgress) await onProgress(done, todo.length);
  }
}

// Every stored copy is rebuilt with an x-hash header (SHA-1 of its body,
// first 16 hex). That also makes a redirected response (books/x -> books/x/)
// a plain one, which a page navigation can use.
async function clean(r) {
  const buf = await r.arrayBuffer();
  const d = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
  const h = Array.from(d, b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const headers = new Headers(r.headers);
  headers.set('x-hash', h);
  return new Response(buf, { status: r.status, statusText: r.statusText, headers });
}

// ---- serving ---------------------------------------------------------------
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(SCOPE)) return;
  const url = new URL(req.url);
  if (SKIP.test(url.pathname) || req.headers.has('range')) return;
  // the shelf's "Save all" stores these itself (shelf.js saveAll)
  if (req.headers.has('x-offline-save')) return;
  // the manifest: a page that asks for it wants the live copy (shelf.js
  // saveAll / localStatus). Serving it cache-first here handed back the old
  // copy AND fired a second, background request to refresh it.
  if (url.origin + url.pathname === MANIFEST) return;
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

  // network known to be down: any stored copy (another ?v=) beats a failed try
  const offlineCopy = async () => !online() && await cache.match(req, { ignoreSearch: true });

  if (url.search) {
    const hit = await cache.match(req);
    if (hit) return hit;
    const old = await offlineCopy();
    if (old) return old;
    try {
      return await store(await net(req));
    } catch (err) {
      const old = await cache.match(req, { ignoreSearch: true });
      if (old) return old;
      throw err;
    }
  }

  // pages (index.html): network first, so a deploy (new book, new ?v= in the
  // script tags) shows on the very next load; the cached copy only offline
  if (req.mode === 'navigate') {
    // only the browser's own offline flag skips it: this request is the probe
    if (self.navigator.onLine === false) {
      const old = await cache.match(req, { ignoreSearch: true });
      if (old) return old;
    }
    try {
      return await store(await net(req));
    } catch (err) {
      const old = await cache.match(req, { ignoreSearch: true });
      if (old) return old;
      throw err;
    }
  }

  const hit = await cache.match(req);
  if (hit) {
    // a manifest file whose stored copy has the manifest's hash is current:
    // no background refresh (that downloaded every image a second time on
    // each load). Unknown or changed files still refresh in the background.
    const want = (await knownHashes())[url.href.slice(SCOPE.length)];
    if (online() && (!want || hit.headers.get('x-hash') !== want)) e.waitUntil(net(req).then(store).catch(() => {}));
    return hit;
  }
  const old = await offlineCopy();
  if (old) return old;
  try {
    return await net(req).then(store);
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
