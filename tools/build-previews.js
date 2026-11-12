#!/usr/bin/env node
// Generic preview builder for the shelf.
//
// Regenerates every book's shelf-card cover (books/<id>/cover.svg, 400x300)
// and social / Open Graph image (books/<id>/og.svg, 1200x630) from that
// book's OWN character builders, so the previews always match the in-book
// art. Content-agnostic: the scene for each book lives in that book's
// `books/<id>/preview.js`; this tool only discovers them, supplies shared
// helpers, and writes the files.
//
//   node tools/build-previews.js            # all books with a preview.js
//   node tools/build-previews.js reef xmas  # just these
//
// A book's preview.js exports:
//   module.exports = (h) => ({ cover: () => '<svg…>', og: () => '<svg…>' })
// where `h` is the helper kit below (embed, title, rand, W/H sizes).
//
// The output is static SVG (click-animation <style>s are stubbed out).
// og.png (what the <meta og:image> tags point at) is a raster export of
// og.svg — not produced here.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BOOKS = path.join(ROOT, 'books');

// static previews: builders call buildAnim() for their tap animation — no-op it
global.buildAnim = () => '';
// shared colour helper the builders call as a global (assets/js/color.js)
global.shade = require(path.join(ROOT, 'assets/js/color.js')).shade;

const helpers = {
  ROOT, BOOKS,
  COVER: { W: 400, H: 300 },
  OG: { W: 1200, H: 630 },

  // require a builder file from a book (paths relative to books/<id>/)
  load(id, rel) { return require(path.join(BOOKS, id, rel)); },

  // Embed a builder's full SVG as a positioned nested <svg>, width w (height
  // follows its viewBox). Animation styles and data-part tags are dropped.
  embed(svg, x, y, w, flip) {
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 360 300';
    const [, , vw, vh] = vb.split(/\s+/).map(Number);
    const h = w * vh / vw;
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
      .replace(/<style>[\s\S]*?<\/style>/g, '').replace(/\sdata-part="[^"]*"/g, '');
    const t = flip ? ` transform="translate(${2 * x + w} 0) scale(-1 1)"` : '';
    return `<g${t}><svg x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}" viewBox="${vb}" overflow="visible">${inner}</svg></g>`;
  },

  // The shared two-line storybook title used on og images.
  title(lines, fills, stroke, x, y) {
    return `<g font-family="'Comic Sans MS','Chalkboard SE','Baloo 2','Fredoka','Trebuchet MS',system-ui,sans-serif"
     font-weight="800" font-size="92" style="paint-order:stroke fill" stroke="${stroke}"
     stroke-width="9" stroke-linejoin="round">
    <text x="${x}" y="${y}" fill="${fills[0]}" transform="rotate(-3 ${x} ${y})">${lines[0]}</text>
    <text x="${x}" y="${y + 100}" fill="${fills[1]}" transform="rotate(2 ${x} ${y + 100})">${lines[1]}</text>
  </g>`;
  },

  // seeded PRNG (stable snow / stars / bubbles between runs)
  rand(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  }
};

const wanted = process.argv.slice(2);
const ids = fs.readdirSync(BOOKS)
  .filter(id => fs.existsSync(path.join(BOOKS, id, 'preview.js')))
  .filter(id => !wanted.length || wanted.includes(id));

if (!ids.length) {
  console.error('No matching books with a preview.js found.');
  process.exit(1);
}

ids.forEach(id => {
  const spec = require(path.join(BOOKS, id, 'preview.js'))(helpers);
  ['cover', 'og'].forEach(kind => {
    if (typeof spec[kind] !== 'function') return;
    const out = path.join(BOOKS, id, `${kind}.svg`);
    fs.writeFileSync(out, spec[kind]());
    console.log('wrote', path.relative(ROOT, out));
  });
});
