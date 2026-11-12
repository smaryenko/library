// TRAINS book — photo cut-out builder.
//
// Each train page is ONE flat scene SVG (viewBox = the 1500×1000 photo crop)
// fed to the shared engine's mountObject, like every other book. The pop-up
// look comes from layering the same photo several times:
//   tr-photo  the whole photo, furthest back (the "page");
//   tr-body   the train cut out with a polygon clip, lifted forward;
//   tr-front  the nearest end (nose, big wheel, horse…) lifted further;
//   tr-top / tr-near  optional extra cuts (chimney, bell, horse);
//   fx-*      effect-only drawings, hidden at rest, shown by the tap animation.
// The engine splits each data-part onto its own Z layer and parallaxes them,
// so no engine edits are needed. Polygons are in crop pixels (1500×1000).
//
// Animation rules are scoped to this picture's own class (uid): buildAnim's
// selectors match by part name only, so two trains in the page at once (the
// shown page + the prerendered next one) would otherwise run each other's
// keyframes on their fx-tr parts.
//
// Placement never shares an element with an animated transform: the data-part
// group is the animated element, the clip + image sit inside it untransformed.
(function () {
  'use strict';
  let seq = 0;
  const W = 1500, H = 1000;
  const pts = a => a.map(p => p.join(',')).join(' ');

  // cfg: { img, cuts: { 'tr-body': [[x,y]…], 'tr-front': […], … },
  //        fx: { 'fx-tr': '<svg markup>', … }, parts: { name: markup },
  //        tracks: [buildAnim tracks] }
  function buildTrain(cfg) {
    const uid = 'tr' + (++seq);
    const href = 'img/' + cfg.img + '.jpg';
    const image = `<image href="${href}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
    const order = ['tr-body', 'tr-near', 'tr-front', 'tr-top'];
    const cutNames = order.filter(n => cfg.cuts[n]);
    const defs = cutNames.map(n =>
      `<clipPath id="${uid}-${n}"><polygon points="${pts(cfg.cuts[n])}"/></clipPath>`).join('');
    const cuts = cutNames.map(n =>
      `<g data-part="${n}"><g filter="url(#${uid}-lift)"><g clip-path="url(#${uid}-${n})">${image}</g></g></g>`).join('');
    // fx values are markup strings, or functions given the glow-filter url
    const glowUrl = `url(#${uid}-glow)`;
    const fx = Object.keys(cfg.fx || {}).map(n => {
      const v = cfg.fx[n];
      return `<g data-part="${n}" opacity="0">${typeof v === 'function' ? v(glowUrl) : v}</g>`;
    }).join('');
    // parts: extra visible layers drawn over the photo (e.g. clock hands)
    const parts = Object.keys(cfg.parts || {}).map(n =>
      `<g data-part="${n}">${cfg.parts[n]}</g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -30 ${W + 60} ${H + 60}" data-train="${cfg.img}" class="${uid}">
<defs>
  <clipPath id="${uid}-page"><rect x="0" y="0" width="${W}" height="${H}" rx="28"/></clipPath>
  <filter id="${uid}-lift" x="-10%" y="-10%" width="120%" height="125%">
    <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/>
  </filter>
  <filter id="${uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="8"/>
  </filter>
  ${defs}
</defs>
${buildAnim(uid, { tracks: cfg.tracks || [] }).replace(/svg\.is-playing /g, `svg.${uid}.is-playing `)}
<g data-part="tr-photo"><g clip-path="url(#${uid}-page)">${image}<rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".12"/></g></g>
${cuts}
${parts}
${fx}
</svg>`;
  }

  window.buildTrain = buildTrain;
})();
