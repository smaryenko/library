// Shared colour helper for SVG builders.
//
//   shade(hex, pct)  lighten (pct > 0, towards white) or darken (pct < 0,
//                    towards black) a "#rrggbb" colour by a fraction (-1..1).
//
// Loaded as a plain script by the books that use it (window.shade) and set as
// a global by tools/build-previews.js so the same builders run under node.
function shade(hex, pct) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16),
        g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
  const f = v => Math.max(0, Math.min(255,
    Math.round(v + (pct < 0 ? v * pct : (255 - v) * pct))));
  const to = v => f(v).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

if (typeof module !== 'undefined') module.exports = { shade };
if (typeof window !== 'undefined') window.shade = shade;
