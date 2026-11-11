// TRAINS book — trains 8-14, plus the drawn intro clock and toy-train ending.
(function () {
  'use strict';
  const T = window.TRAINS = window.TRAINS || {};

  // 8 — PRR GG1 electric: a blue spark jumps and the wire overhead glows
  T.electric = () => buildTrain({
    img: 'electric',
    cuts: {
      'tr-body': [[0,700],[180,200],[250,58],[500,38],[700,118],[900,280],[1060,318],[1242,500],[1242,622],[1000,802],[700,1000],[0,1000]],
      'tr-front': [[0,700],[180,200],[300,58],[480,58],[560,700],[520,1000],[0,1000]]
    },
    fx: {
      'fx-tr': g => `<path d="M520 10 L700 70 L880 250" fill="none" stroke="#7fd4ff" stroke-width="26" filter="${g}"/>
        <path d="M520 10 L700 70 L880 250" fill="none" stroke="#e8f8ff" stroke-width="6"/>
        <circle cx="880" cy="250" r="60" fill="#8fdcff" filter="${g}"/>
        <path d="M880 190 L895 235 L945 230 L905 260 L930 305 L880 275 L835 305 L855 260 L815 230 L865 235Z" fill="#fff"/>`
    },
    tracks: [
      { parts: 'fx-tr', timing: '1.4s linear',
        keyframes: '0%{opacity:0}8%{opacity:1}14%{opacity:.2}22%{opacity:1}30%{opacity:.4}40%{opacity:1}80%{opacity:.8}100%{opacity:0}' }
    ]
  });

  // 9 — Shinkansen in cherry blossom: the long nose dips, air streams, petals
  const petals = [[300,120],[520,60],[700,180],[900,90],[1100,200],[420,260],[820,300],[1250,120]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="10" fill="#f6c6d8" transform="rotate(${i * 40} ${x} ${y})"/>`).join('');
  T.shinkansen = () => buildTrain({
    img: 'shinkansen',
    cuts: {
      'tr-body': [[360,800],[400,650],[580,450],[700,398],[1000,398],[1372,498],[1372,560],[1000,800],[700,962],[500,962],[368,882]],
      'tr-front': [[360,800],[400,650],[600,478],[800,560],[800,962],[500,962],[368,882]]
    },
    fx: {
      'fx-tr': `<g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="7" opacity=".85">
        <path d="M340 760 q-120 -10 -300 40"/><path d="M380 640 q-140 -20 -320 10"/><path d="M420 900 q-150 10 -340 70"/></g>`,
      'fx-tr-2': petals
    },
    tracks: [
      { parts: 'tr-front', origin: '800px 900px', timing: '1.4s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}35%,60%{transform:rotate(-2.5deg) translateY(6px)}' },
      { parts: 'fx-tr', timing: '1.4s ease-out',
        keyframes: '0%{opacity:0;transform:translateX(60px)}25%{opacity:1}100%{opacity:0;transform:translateX(-120px)}' },
      { parts: 'fx-tr-2', timing: '2.2s ease-in',
        keyframes: '0%{opacity:0;transform:translate(0,-60px)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate(-120px,320px)}' }
    ]
  });

  // 10 — London Underground: the windows light up all along the carriages
  T.underground = () => buildTrain({
    img: 'underground',
    cuts: {
      'tr-body': [[170,520],[250,468],[600,418],[950,358],[1150,308],[1300,302],[1362,370],[1372,780],[1342,1000],[1050,1000],[900,862],[600,702],[300,622],[170,582]],
      'tr-front': [[920,330],[1150,306],[1300,302],[1372,380],[1372,1000],[1050,1000],[920,780]]
    },
    fx: {
      'fx-tr': g => `<g fill="#ffe7a3" filter="${g}">
        <rect x="590" y="490" width="150" height="70" rx="10"/><rect x="400" y="510" width="60" height="70" rx="8"/>
        <rect x="300" y="520" width="60" height="60" rx="8"/><rect x="230" y="530" width="40" height="50" rx="6"/></g>
        <g fill="#fff" opacity=".9"><circle cx="1195" cy="560" r="12"/><circle cx="1300" cy="560" r="12"/></g>`
    },
    tracks: [
      { parts: 'fx-tr', timing: '1.8s ease-in-out',
        keyframes: '0%{opacity:0}20%{opacity:.4}35%{opacity:1}80%{opacity:1}100%{opacity:0}' }
    ]
  });

  // 11 — Kyiv funicular: the car bobs on its cable and yellow leaves tumble
  const leaves = [[200,100],[450,40],[650,160],[860,60],[1050,140],[1300,80],[350,250],[980,280]]
    .map(([x, y], i) => `<path d="M${x} ${y} q18 -22 36 0 q-18 22 -36 0z" fill="${i % 2 ? '#e3a521' : '#f2c84b'}" transform="rotate(${i * 50} ${x + 18} ${y})"/>`).join('');
  T.funicular = () => buildTrain({
    img: 'funicular',
    cuts: {
      'tr-body': [[245,460],[300,400],[400,382],[410,268],[580,268],[600,390],[700,390],[940,480],[940,782],[560,802],[260,782]],
      'tr-near': [[1100,560],[1130,518],[1300,522],[1326,600],[1322,772],[1104,762]]
    },
    fx: { 'fx-tr': leaves },
    tracks: [
      { parts: 'tr-body', timing: '1.5s ease-in-out',
        keyframes: '0%,100%{transform:translateY(0)}25%{transform:translateY(-12px)}50%{transform:translateY(2px)}75%{transform:translateY(-6px)}' },
      { parts: 'tr-near', timing: '1.5s ease-in-out',
        keyframes: '0%,100%{transform:translateY(0)}40%{transform:translateY(5px)}' },
      { parts: 'fx-tr', timing: '2.2s ease-in',
        keyframes: '0%{opacity:0;transform:translate(0,-40px)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate(60px,520px)}' }
    ]
  });

  // 12 — Chongqing monorail: it glides forward as lights race along its one beam
  T.monorail = () => buildTrain({
    img: 'monorail',
    cuts: {
      'tr-body': [[210,330],[290,248],[700,278],[1100,328],[1282,390],[1282,600],[700,762],[680,832],[500,852],[220,702]],
      'tr-front': [[210,330],[290,248],[522,250],[542,800],[500,852],[220,702]]
    },
    fx: {
      'fx-tr': g => `<path d="M1320 610 Q900 760 520 820 L0 840" fill="none" stroke="#7fe0ff" stroke-width="20" stroke-dasharray="30 60" stroke-linecap="round" filter="${g}"/>
        <path d="M1320 610 Q900 760 520 820 L0 840" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="30 60" stroke-linecap="round"/>`
    },
    tracks: [
      { parts: ['tr-body', 'tr-front'], timing: '1.8s ease-in-out',
        keyframes: '0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}' },
      { parts: 'fx-tr', timing: '1.8s linear',
        keyframes: '0%{opacity:0;stroke-dashoffset:0}15%{opacity:1}85%{opacity:1}100%{opacity:0;stroke-dashoffset:-540}' }
    ]
  });

  // 13 — NS double-decker: the top deck lights up, then the bottom deck
  T.doubledecker = () => buildTrain({
    img: 'doubledecker',
    cuts: {
      'tr-body': [[30,500],[400,418],[900,298],[1050,213],[1302,213],[1332,320],[1372,620],[1352,722],[1000,742],[700,682],[30,582]],
      'tr-front': [[1020,240],[1050,213],[1302,213],[1332,320],[1372,620],[1352,722],[1000,742],[960,500]]
    },
    fx: {
      'fx-tr': g => `<polygon points="640,395 900,322 900,368 640,428" fill="#fff1b8" filter="${g}"/><polygon points="160,470 620,400 620,425 160,488" fill="#fff1b8" filter="${g}"/>`,
      'fx-tr-2': g => `<polygon points="640,470 900,410 900,560 640,575" fill="#fff1b8" filter="${g}"/><polygon points="160,520 620,470 620,560 160,560" fill="#fff1b8" filter="${g}"/>`
    },
    tracks: [
      { parts: 'fx-tr', timing: '1.6s ease-in-out',
        keyframes: '0%{opacity:0}20%{opacity:.9}80%{opacity:.9}100%{opacity:0}' },
      { parts: 'fx-tr-2', timing: '1.4s .6s ease-in-out both',
        keyframes: '0%{opacity:0}25%{opacity:.9}80%{opacity:.9}100%{opacity:0}' }
    ]
  });

  // 14 — Shanghai maglev: it lifts off the guideway on a magnetic shimmer
  T.maglev = () => buildTrain({
    img: 'maglev',
    cuts: {
      'tr-body': [[114,288],[150,266],[320,300],[420,345],[560,410],[700,470],[745,478],[770,500],[880,553],[960,590],[1050,660],[1085,740],[1099,830],[1095,882],[1060,906],[880,921],[820,900],[740,862],[600,782],[420,682],[300,602],[200,522],[130,432],[114,352]],
      'tr-front': [[620,560],[700,528],[880,553],[960,590],[1050,660],[1085,740],[1099,830],[1095,882],[1060,906],[880,921],[820,900],[740,862],[640,792],[615,700]]
    },
    fx: {
      'fx-tr-back': g => `<path d="M130 340 L320 620 L700 900 L900 940" fill="none" stroke="#6ff0ff" stroke-width="30" stroke-dasharray="14 22" filter="${g}"/>`
    },
    tracks: [
      { parts: ['tr-body', 'tr-front'], timing: '1.8s ease-in-out',
        keyframes: '0%,100%{transform:translateY(0)}30%,70%{transform:translateY(-24px)}' },
      { parts: 'fx-tr-back', timing: '1.8s linear',
        keyframes: '0%{opacity:0;stroke-dashoffset:0}25%{opacity:1}75%{opacity:1}100%{opacity:0;stroke-dashoffset:-180}' }
    ]
  });

  // intro — a real station clock (Wellington). The photo's own hands were
  // painted out of img/clock.jpg; matching hands are drawn back on top as
  // their own layers at the photo's time (about 4:26). Tap: each hand spins
  // on its own, slowly, at its own speed.
  const HUB = '738px 488px';
  const hand = (w, up, tail, fill, angle) => `<g transform="rotate(${angle} 738 488)">
    <path d="M${738 - w / 2} ${488 + tail} L${738 - w * .4} ${488 - up} L${738 + w * .4} ${488 - up} L${738 + w / 2} ${488 + tail}Z"
      fill="#000" opacity=".25" transform="translate(5 8)"/>
    <path d="M${738 - w / 2} ${488 + tail} L${738 - w * .4} ${488 - up} L${738 + w * .4} ${488 - up} L${738 + w / 2} ${488 + tail}Z"
      fill="${fill}"/></g>`;
  T.clock = () => buildTrain({
    img: 'clock',
    cuts: {
      'tr-body': [[752, 156], [813, 161], [872, 177], [927, 203], [977, 238], [1020, 281], [1055, 331], [1081, 386], [1097, 445], [1102, 506], [1097, 567], [1081, 626], [1055, 681], [1020, 731], [977, 774], [927, 809], [872, 835], [813, 851], [752, 856], [691, 851], [632, 835], [577, 809], [527, 774], [484, 731], [449, 681], [423, 626], [407, 567], [402, 506], [407, 445], [423, 386], [449, 331], [484, 281], [527, 238], [577, 203], [632, 177], [691, 161]],
      'tr-top': [[650,60],[800,60],[810,178],[640,178]]
    },
    parts: {
      'tr-hand-hour': hand(46, 214, 100, '#34342c', 125),
      'tr-hand-min': hand(32, 318, 96, '#2e2e27', 156),
      'tr-hand-sec': hand(6, 300, 80, '#c8102e', 230) + '<circle cx="738" cy="488" r="10" fill="#c8102e"/>'
    },
    tracks: [
      { parts: 'tr-hand-hour', origin: HUB, timing: '4.8s cubic-bezier(.6,0,.4,1)',
        keyframes: '0%{transform:rotate(0)}100%{transform:rotate(90deg)}' },
      { parts: 'tr-hand-min', origin: HUB, timing: '4.5s cubic-bezier(.4,0,.2,1)',
        keyframes: '0%{transform:rotate(0)}100%{transform:rotate(-360deg)}' },
      { parts: 'tr-hand-sec', origin: HUB, timing: '4s linear',
        keyframes: '0%{transform:rotate(0)}100%{transform:rotate(720deg)}' }
    ]
  });

  // ending — a real wooden toy train on beech track: an apple wagon pulling
  // two blue coaches. Tap: the little train rolls forward and rocks back.
  T.toy = () => buildTrain({
    img: 'toy',
    cuts: {
      'tr-body': [[325,520],[335,495],[350,490],[520,486],[540,498],[548,478],[560,448],[745,442],[790,490],[795,470],[805,445],[1010,432],[1030,460],[1018,520],[1000,560],[965,572],[945,556],[905,562],[880,592],[835,596],[815,578],[790,560],[780,590],[748,616],[700,620],[688,604],[650,630],[600,630],[578,610],[548,600],[535,622],[520,650],[480,658],[465,642],[420,648],[408,668],[368,672],[342,660],[322,622]],
      'tr-near': [[325,520],[335,495],[350,490],[520,486],[538,500],[548,600],[535,622],[520,650],[480,658],[465,642],[420,648],[408,668],[368,672],[342,660],[322,622]],
      'tr-top': [[548,478],[560,448],[740,444],[790,492],[780,505],[560,512]]
    },
    tracks: [
      { parts: ['tr-body', 'tr-near', 'tr-top'], timing: '2.2s cubic-bezier(.45,0,.35,1)',
        keyframes: '0%,100%{transform:translate(0,0) rotate(0)}35%{transform:translate(-46px,18px) rotate(-1deg)}55%{transform:translate(-52px,20px) rotate(.6deg)}' }
    ]
  });
})();
