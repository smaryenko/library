#!/usr/bin/env node
// Offline file list for the service worker (sw.js).
//
// Writes offline-manifest.json at the site root:
//   { shell: [...], books: { <id>: [...] } }
// shell = the library page, every shared file under assets/ and every shelf
// card cover.jpg; books.<id> = everything under books/<id>/ the page can load.
// sw.js caches the shell when the library (or any book) loads, and a book's
// list when that book loads. Paths are relative to the site root, no ?v=.
//
//   node tools/build-offline.js
//
// Re-run it whenever files are added, removed or renamed (a changed file
// with the same name needs nothing: it is refreshed through its ?v=).
//
// Left out on purpose (never cached, see SKIP in sw.js for the runtime twin):
//   og.png / og.svg   social previews, pages never load them
//   *.mp3             music; offline the music button just stays off
//   cover.svg / .png  build sources for cover.jpg (except KEEP below)
//   preview.js / .py  build-time preview scenes (node / python only)
//   *.md, dotfiles    docs and OS litter
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const KEEP = new Set(['books/myday/cover.svg']);   // myday's no-WebGL still picture
const SKIP = [
  /(^|\/)og\.(png|svg)$/i,
  /\.mp3$/i,
  /(^|\/)cover\.(svg|png)$/i,
  /(^|\/)preview\.(js|py)$/i,
  /\.py$/i,
  /\.md$/i,
  /(^|\/)\./,
];
const keep = rel => KEEP.has(rel) || !SKIP.some(re => re.test(rel));

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(path.join(ROOT, dir)).sort()) {
    const rel = dir ? dir + '/' + name : name;
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) { if (name[0] !== '.') out.push(...walk(rel)); }
    else if (keep(rel)) out.push(rel);
  }
  return out;
}

const bookIds = fs.readdirSync(path.join(ROOT, 'books'))
  .filter(n => n[0] !== '.' && fs.statSync(path.join(ROOT, 'books', n)).isDirectory())
  .sort();

const shell = ['./', 'index.html', ...walk('assets')];
bookIds.forEach(id => {
  const c = `books/${id}/cover.jpg`;
  if (fs.existsSync(path.join(ROOT, c))) shell.push(c);
});

const books = {};
bookIds.forEach(id => { books[id] = [`books/${id}/`, ...walk(`books/${id}`)]; });

const size = list => list.reduce((s, p) => {
  const f = path.join(ROOT, p);
  return s + (p.endsWith('/') || !fs.existsSync(f) || fs.statSync(f).isDirectory() ? 0 : fs.statSync(f).size);
}, 0);

fs.writeFileSync(path.join(ROOT, 'offline-manifest.json'),
  JSON.stringify({ shell, books }, null, 1) + '\n');

const mb = b => (b / 1048576).toFixed(2) + ' MB';
console.log(`shell: ${shell.length} files, ${mb(size(shell))}`);
bookIds.forEach(id => console.log(`  ${id}: ${books[id].length} files, ${mb(size(books[id]))}`));
