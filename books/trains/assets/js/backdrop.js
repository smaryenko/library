// Backdrop for the TRAINS book: a railway at dusk. A warm sunset glow on the
// horizon, first stars, layered hills, a stone viaduct with a little train
// silhouette crossing it, telegraph poles with sagging wires, and a pair of
// rails running towards the vanishing point. Muted and low-contrast so the
// photos stay the hero. Reuses the shared .winter-bg chrome.
(function () {
  'use strict';
  // small deterministic random so the stars don't jump between loads
  let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;

  function sceneSVG() {
    const HY = 640;              // horizon line
    const VX = 980;              // vanishing point x

    const stars = Array.from({ length: 70 }, () => {
      const x = rnd() * 1600, y = rnd() * 330, r = .6 + rnd() * 1.4;
      return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(.25 + rnd() * .6).toFixed(2)}"/>`;
    }).join('');

    // viaduct: deck + arches across the middle distance
    const arches = Array.from({ length: 11 }, (_, i) => {
      const x = 40 + i * 70;
      return `<path d="M${x} 600 V${HY} H${x + 70} V600 A35 35 0 0 0 ${x} 600Z" fill="#1f2638"/>`;
    }).join('');
    const viaduct = `<g opacity=".85">
      <rect x="20" y="548" width="800" height="16" fill="#2a3246"/>
      <rect x="20" y="564" width="800" height="${HY - 564}" fill="#2a3246"/>
      ${arches}
      <rect x="20" y="544" width="800" height="5" fill="#3a4560"/></g>`;

    // little train silhouette on the viaduct, with lit windows
    const coach = x => `<rect x="${x}" y="522" width="74" height="24" rx="4" fill="#161b29"/>` +
      [8, 24, 40, 56].map(w => `<rect x="${x + w}" y="528" width="10" height="7" rx="1" fill="#ffcf7a" opacity=".85"/>`).join('');
    const train = `<g>
      <path d="M440 546 V516 H468 V506 H480 V516 H520 Q536 516 538 532 V546Z" fill="#161b29"/>
      <rect x="498" y="522" width="12" height="9" fill="#ffcf7a" opacity=".85"/>
      <circle cx="540" cy="534" r="3" fill="#fff3c4"/>
      ${coach(360)}${coach(280)}${coach(200)}
      <g fill="#cfd5e3" opacity=".35"><circle cx="474" cy="494" r="9"/><circle cx="462" cy="478" r="13"/><circle cx="444" cy="462" r="17"/><circle cx="420" cy="452" r="20"/></g></g>`;

    // rails converging on the vanishing point, sleepers spaced in perspective
    const sleepers = Array.from({ length: 22 }, (_, i) => {
      const t = Math.pow((i + 1) / 22, 1.9);          // 0 near horizon → 1 at the bottom
      const y = HY + t * (900 - HY);
      const half = 30 + t * 620;
      const h = 2 + t * 22;
      const cx = VX + (800 - VX) * t;
      return `<rect x="${(cx - half).toFixed(0)}" y="${y.toFixed(0)}" width="${(half * 2).toFixed(0)}" height="${h.toFixed(1)}" fill="#3a2f28" opacity=".85"/>`;
    }).join('');
    const rail = side => {
      const near = 800 + side * 430, far = VX + side * 14;
      return `<path d="M${far} ${HY} L${near - 10} 900 L${near + 10} 900 L${far + 1} ${HY}Z" fill="url(#tbRail)"/>`;
    };

    // telegraph poles shrinking towards the horizon, wires sagging between
    const poles = [0, 1, 2, 3, 4, 5].map(i => {
      const t = Math.pow(1 - i / 6, 1.6);
      return { x: VX + 70 + (1480 - VX - 70) * t, top: HY - (40 + 420 * t), w: 2 + 9 * t, bot: HY + 6 + 120 * t };
    });
    const poleSvg = poles.map(p => `<rect x="${(p.x - p.w / 2).toFixed(0)}" y="${p.top.toFixed(0)}" width="${p.w.toFixed(1)}" height="${(p.bot - p.top).toFixed(0)}" fill="#1a1f2c"/>` +
      `<rect x="${(p.x - p.w * 4).toFixed(0)}" y="${(p.top + p.w * 2).toFixed(0)}" width="${(p.w * 8).toFixed(0)}" height="${(p.w * .8).toFixed(1)}" fill="#1a1f2c"/>`).join('');
    const wires = [0, 1].map(k => poles.slice(1).map((p, i) => {
      const a = poles[i];
      const ay = a.top + a.w * 2 + k * a.w * 3, by = p.top + p.w * 2 + k * p.w * 3;
      const mx = (a.x + p.x) / 2, my = (ay + by) / 2 + 6 + 30 * (a.w / 11);
      return `<path d="M${a.x.toFixed(0)} ${ay.toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${p.x.toFixed(0)} ${by.toFixed(0)}" fill="none" stroke="#1a1f2c" stroke-width="1.4" opacity=".8"/>`;
    }).join('')).join('');

    // signal with a warm green lamp at the trackside
    const signal = `<g>
      <rect x="1238" y="470" width="8" height="250" fill="#161b29"/>
      <rect x="1222" y="440" width="40" height="70" rx="8" fill="#161b29"/>
      <circle cx="1242" cy="460" r="9" fill="#5a2a2a"/>
      <circle cx="1242" cy="488" r="9" fill="#9dffb8"/>
      <circle cx="1242" cy="488" r="28" fill="#9dffb8" opacity=".18"/></g>`;

    return `<svg class="winter-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tbSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2540"/><stop offset=".45" stop-color="#3f4d72"/>
      <stop offset=".75" stop-color="#9a7f95"/><stop offset="1" stop-color="#f0b27a"/></linearGradient>
    <radialGradient id="tbSun" cx="${VX}" cy="${HY}" r="520" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd59a" stop-opacity=".95"/><stop offset=".25" stop-color="#ffb36b" stop-opacity=".5"/>
      <stop offset="1" stop-color="#ffb36b" stop-opacity="0"/></radialGradient>
    <linearGradient id="tbGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b3a44"/><stop offset="1" stop-color="#1c1a20"/></linearGradient>
    <linearGradient id="tbRail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd59a"/><stop offset=".3" stop-color="#b9b4b0"/><stop offset="1" stop-color="#6d6a6a"/></linearGradient>
    <linearGradient id="tbBallast" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a5050"/><stop offset="1" stop-color="#2e2828"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#tbSky)"/>
  ${stars}
  <rect width="1600" height="${HY}" fill="url(#tbSun)"/>
  <circle cx="${VX}" cy="${HY - 6}" r="46" fill="#ffe2b0" opacity=".9"/>
  <path d="M0 ${HY - 70} Q200 ${HY - 130} 420 ${HY - 80} T860 ${HY - 70} T1300 ${HY - 110} T1600 ${HY - 80} V${HY} H0Z" fill="#4a4f6e" opacity=".75"/>
  <path d="M0 ${HY - 30} Q260 ${HY - 70} 560 ${HY - 34} T1120 ${HY - 40} T1600 ${HY - 50} V${HY} H0Z" fill="#363a54" opacity=".9"/>
  ${viaduct}
  ${train}
  <rect y="${HY}" width="1600" height="${900 - HY}" fill="url(#tbGround)"/>
  <path d="M${VX - 20} ${HY} L${800 - 640} 900 H${800 + 640} L${VX + 20} ${HY}Z" fill="url(#tbBallast)"/>
  ${sleepers}
  ${rail(-1)}${rail(1)}
  ${wires}${poleSvg}
  ${signal}
  <rect width="1600" height="900" fill="#0b1020" opacity=".18"/>
</svg>`;
  }
  function mountTrains() {
    const bg = document.createElement('div');
    bg.className = 'winter-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = sceneSVG();
    document.body.prepend(bg);
  }
  window.mountTrains = mountTrains;
})();
