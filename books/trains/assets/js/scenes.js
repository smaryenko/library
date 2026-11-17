// TRAINS book — trains 1-7: cut polygons (crop px, 1500×1000), effects and
// each train's own one-shot tap animation. Built on buildTrain (photocut.js).
(function () {
  'use strict';
  const T = window.TRAINS = window.TRAINS || {};
  const fade = '0%{opacity:0}15%{opacity:1}75%{opacity:1}100%{opacity:0}';

  // 1 — horse tram: the horse trots in place, the tram rolls up behind it
  T.horse = () => buildTrain({
    img: 'horse',
    cuts: {
      'tr-body': [[840,220],[930,120],[1200,105],[1455,205],[1455,560],[1210,650],[1100,705],[840,705]],
      'tr-near': [[100,600],[175,400],[350,335],[560,345],[700,380],[880,470],[885,620],[820,860],[640,1000],[330,1000],[220,760],[150,690]]
    },
    fx: {
      'fx-tr': `<g fill="#cdb79a">
        <circle cx="490" cy="985" r="26" opacity=".7"/><circle cx="530" cy="970" r="18" opacity=".6"/>
        <circle cx="660" cy="840" r="22" opacity=".7"/><circle cx="700" cy="830" r="14" opacity=".6"/></g>`
    },
    tracks: [
      { parts: 'tr-near', timing: '1.4s ease-in-out',
        keyframes: '0%,100%{transform:translate(0,0)}12%{transform:translate(6px,-16px)}25%{transform:translate(12px,0)}' +
          '37%{transform:translate(18px,-16px)}50%{transform:translate(24px,0)}62%{transform:translate(18px,-14px)}' +
          '75%{transform:translate(10px,0)}87%{transform:translate(4px,-10px)}' },
      { parts: 'tr-body', timing: '1.4s ease-in-out',
        keyframes: '0%,100%{transform:translateX(0)}50%{transform:translateX(-22px)}' },
      { parts: 'fx-tr', timing: '1.4s ease-out',
        keyframes: '0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-40px)}' }
    ]
  });

  // 2 — Stephenson's Rocket: puffs of smoke billow out of the tall chimney
  //     and drift back over the train while the chimney shakes
  T.rocket = () => buildTrain({
    img: 'rocket',
    cuts: {
      'tr-body': [[100,560],[160,445],[390,440],[600,430],[650,440],[700,500],[1110,500],[1118,90],[1212,90],[1212,620],[1240,700],[1220,985],[880,985],[650,910],[500,905],[100,865]],
      'tr-front': [[875,650],[1035,640],[1190,700],[1215,810],[1180,940],[1035,985],[890,940],[860,810]],
      'tr-top': [[1112,80],[1215,80],[1212,620],[1118,620]]
    },
    fx: {
      'fx-tr': plume({ x: 1165, y: 70, dx: -300, dy: -330, n: 12, r: 38, grow: 3.4, life: 1.9, every: 0.13, color: '#ecebe7', shade: '#9a9893', seed: 3 })
    },
    tracks: [
      plumeTrack('fx-tr', 3.5),
      { parts: 'tr-top', timing: '1.6s linear',
        keyframes: '0%,100%{transform:translateY(0)}' + [10, 25, 40, 55, 70, 85].map(p => `${p}%{transform:translateY(-5px)}${p + 7}%{transform:translateY(0)}`).join('') }
    ]
  });

  // 3 — Jupiter: the brass bell swings, ding-ding, and the big lamp flickers
  T.jupiter = () => buildTrain({
    img: 'jupiter',
    cuts: {
      'tr-body': [[215,725],[230,570],[410,540],[420,430],[640,420],[680,355],[800,395],[900,330],[905,205],[1098,205],[1100,330],[1160,330],[1168,452],[1112,452],[1112,600],[1170,650],[1278,655],[1278,785],[1000,792],[215,798]],
      'tr-front': [[905,205],[1098,205],[1100,330],[1165,330],[1168,452],[1112,452],[1112,600],[1170,650],[1278,655],[1278,785],[1000,792],[960,600],[905,460]],
      'tr-top': [[908,375],[958,375],[965,445],[902,445]]
    },
    fx: {
      'fx-tr': g => `<circle cx="1110" cy="383" r="70" fill="#ffe9a0" filter="${g}" opacity=".95"/>
        <circle cx="1110" cy="383" r="34" fill="#fff8d8"/>
        <path d="M880 360 q-30 -30 0 -60 M860 380 q-50 -50 0 -100 M985 360 q30 -30 0 -60 M1005 380 q50 -50 0 -100"
          fill="none" stroke="#fff3b0" stroke-width="7" stroke-linecap="round"/>`,
      'fx-tr-2': plume({ x: 1000, y: 190, dx: -340, dy: -240, n: 11, r: 36, grow: 3.2, life: 2, every: 0.15, color: '#f2f1ee', shade: '#a7a6a2', seed: 5 })
    },
    tracks: [
      TM.track('tr-top', 1.8, t => TM.tf(0, 0, 24 * TM.spring(t, 0, 2.6, 2.4) * TM.sm(0, 0.06, t)), { origin: '932px 378px' }),
      { parts: 'fx-tr', timing: '1.6s linear',
        keyframes: '0%{opacity:0}10%{opacity:1}20%{opacity:.3}30%{opacity:1}45%{opacity:.5}60%{opacity:1}100%{opacity:0}' },
      plumeTrack('fx-tr-2', 3.7)
    ]
  });

  // 4 — mail car: a flurry of real-looking envelopes flies out of the door
  // (two groups on their own tracks so they scatter apart).
  const envelope = (x, y, r, k, tint) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})">
      <rect x="-42" y="-27" width="84" height="54" rx="2" fill="#000" opacity=".22" transform="translate(4 6)"/>
      <rect x="-42" y="-27" width="84" height="54" rx="2" fill="${tint}" stroke="#b9ad97" stroke-width="1.5"/>
      <path d="M-42 -27 L0 6 L42 -27" fill="none" stroke="#c9bea9" stroke-width="2"/>
      <path d="M-42 27 L-8 0 M42 27 L8 0" fill="none" stroke="#d8cfbe" stroke-width="1.5"/>
      <rect x="22" y="-21" width="14" height="17" fill="#c8102e" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 1.5"/>
      <circle cx="18" cy="-11" r="9" fill="none" stroke="#555" stroke-width="1.2" opacity=".6"/>
      <g stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity=".7">
        <path d="M-16 8 H18"/><path d="M-16 14 H12"/><path d="M-16 20 H16"/></g>
      <rect x="-42" y="-27" width="84" height="54" rx="2" fill="url(#mailShade)"/></g>`;
  const mailShade = `<defs><linearGradient id="mailShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>`;
  T.mail = () => buildTrain({
    img: 'mail',
    cuts: {
      'tr-body': [[55,370],[120,300],[300,292],[1380,408],[1500,422],[1500,680],[700,700],[400,722],[55,722]],
      'tr-front': [[300,620],[720,625],[720,725],[300,725]]
    },
    fx: {
      'fx-tr': `${mailShade}<g transform="translate(500 560)">
        ${envelope(-40, -20, -18, 1.1, '#fbf7ee')}${envelope(60, -70, 12, 1, '#f3ead6')}
        ${envelope(-120, -110, 26, .9, '#fdfbf6')}</g>`,
      'fx-tr-2': `<g transform="translate(520 560)">
        ${envelope(20, 10, -6, 1.05, '#eef3f8')}${envelope(-90, 40, 34, .95, '#fbf7ee')}
        ${envelope(110, -20, -28, .9, '#f6efe0')}</g>`
    },
    tracks: [
      { parts: 'fx-tr', timing: '2.2s cubic-bezier(.25,.6,.4,1)',
        keyframes: '0%{opacity:0;transform:translate(0,0) rotate(0) scale(.6)}10%{opacity:1}' +
          '45%{transform:translate(-150px,-230px) rotate(-14deg) scale(1)}70%{transform:translate(-250px,-170px) rotate(8deg) scale(1)}' +
          '85%{opacity:1}100%{opacity:0;transform:translate(-330px,-40px) rotate(-10deg) scale(1)}' },
      { parts: 'fx-tr-2', timing: '2.4s .15s cubic-bezier(.25,.6,.4,1) both',
        keyframes: '0%{opacity:0;transform:translate(0,0) rotate(0) scale(.6)}10%{opacity:1}' +
          '40%{transform:translate(120px,-260px) rotate(16deg) scale(1)}70%{transform:translate(220px,-180px) rotate(-6deg) scale(1)}' +
          '85%{opacity:1}100%{opacity:0;transform:translate(300px,-50px) rotate(12deg) scale(1)}' },
      { parts: 'tr-body', timing: '.6s ease-in-out',
        keyframes: '0%,100%{transform:translateX(0)}30%{transform:translateX(-8px)}60%{transform:translateX(5px)}' }
    ]
  });

  // 5 — Alberni Pacific No. 2: chug-chug shake, dark smoke, a white steam hiss
  T.alberni = () => buildTrain({
    img: 'alberni',
    cuts: {
      'tr-body': [[100,870],[100,600],[288,600],[288,300],[410,288],[412,168],[508,168],[515,330],[540,250],[640,250],[685,300],[860,278],[1180,298],[1262,370],[1332,400],[1322,760],[1100,772],[700,832],[430,872]],
      'tr-front': [[288,300],[410,288],[505,300],[505,760],[400,872],[100,872],[100,600],[288,600]],
      'tr-top': [[408,160],[512,160],[512,385],[408,385]]
    },
    fx: {
      'fx-tr': plume({ x: 460, y: 150, dx: -200, dy: -330, n: 12, r: 40, grow: 3.4, life: 1.9, every: 0.12, color: '#5a5653', shade: '#2b2928', opacity: 0.9, seed: 8 }),
      'fx-tr-2': plume({ x: 330, y: 810, dx: -280, dy: -60, n: 9, r: 30, grow: 3, life: 1.1, every: 0.09, color: '#ffffff', shade: '#cfd2d6', billow: 26, seed: 11 })
    },
    tracks: [
      TM.track(['tr-body', 'tr-front', 'tr-top'], 1.8, t => TM.tf(-4 * TM.chuff(t, 6) * TM.env(t), 2 * TM.chuff(t, 6) * TM.env(t))),
      plumeTrack('fx-tr', 3.4),
      plumeTrack('fx-tr-2', 2)
    ]
  });

  // 6 — Mallard, the fastest steam engine: leans into the wind, speed lines
  T.mallard = () => buildTrain({
    img: 'mallard',
    cuts: {
      'tr-body': [[85,370],[230,300],[400,250],[650,200],[958,178],[968,72],[1146,78],[1200,168],[1340,248],[1442,400],[1500,520],[1500,700],[1382,832],[1100,842],[800,782],[400,732],[85,662]],
      'tr-front': [[1080,180],[1146,78],[1200,168],[1340,248],[1442,400],[1500,520],[1500,700],[1382,832],[1100,842],[1060,600]]
    },
    fx: {
      'fx-tr': `<g stroke="#fff" stroke-linecap="round" opacity=".85">
        <line x1="0" y1="330" x2="260" y2="330" stroke-width="8"/><line x1="40" y1="420" x2="340" y2="420" stroke-width="11"/>
        <line x1="0" y1="510" x2="220" y2="510" stroke-width="7"/><line x1="60" y1="600" x2="300" y2="600" stroke-width="10"/>
        <line x1="10" y1="690" x2="200" y2="690" stroke-width="6"/></g>`,
      'fx-tr-2': plume({ x: 1050, y: 80, dx: -760, dy: -50, n: 14, r: 30, grow: 3, life: 1.3, every: 0.09, color: '#f4f4f1', shade: '#b4b7bc', billow: 30, seed: 6 })
    },
    tracks: [
      TM.track(['tr-body', 'tr-front'], 1.8, t => { const [jx, jy] = TM.jitter(t, 1.2 * TM.env(t), 20, 2); return TM.tf(26 * TM.out(t, 0.35, 0.72) + jx, jy, -0.6 * TM.out(t, 0.35, 0.72)); }, { origin: '1300px 820px' }),
      plumeTrack('fx-tr-2', 2.6),
      TM.track('fx-tr', 1.8, t => TM.tf(140 - 420 * t) + ';' + TM.op(TM.env(t, 0.15, 0.7)))
    ]
  });

  // 7 — Rio Grande diesel: HONK — sound waves from the horn, a cab shudder
  T.diesel = () => buildTrain({
    img: 'diesel',
    cuts: {
      'tr-body': [[165,560],[188,300],[230,198],[330,138],[540,118],[720,188],[1000,448],[1500,598],[1500,762],[1200,772],[700,762],[165,742]],
      'tr-front': [[165,560],[188,300],[230,198],[330,138],[540,118],[720,188],[760,420],[760,742],[165,742]]
    },
    fx: {
      'fx-tr': g => `<g fill="#fff6d0" filter="${g}"><circle cx="352" cy="195" r="46"/><circle cx="338" cy="330" r="40"/></g>
        <g fill="#ffffff"><circle cx="352" cy="195" r="20"/><circle cx="338" cy="330" r="17"/></g>`,
      'fx-tr-2': plume({ x: 900, y: 300, dx: 120, dy: -300, n: 9, r: 26, grow: 3.4, life: 1.6, every: 0.14, color: '#6a6a6a', shade: '#2e2e2e', opacity: 0.75, seed: 12 }),
      'fx-tr-back': `<g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="9" opacity=".9">
        <path d="M480 90 q60 -50 120 0"/><path d="M450 60 q90 -80 180 0"/><path d="M420 30 q120 -110 240 0"/></g>`
    },
    tracks: [
      TM.track(['tr-front', 'tr-body'], 2, t => { const [x, y] = TM.jitter(t, 2.4 * TM.env(t, 0.1, 0.7), 26, 4); return TM.tf(x, y); }),
      TM.track('fx-tr', 2, t => TM.op(TM.lamp(t, 0.02, 0.8))),
      plumeTrack('fx-tr-2', 2.8),
      TM.track('fx-tr-back', 1.4, t => { const u = (t * 2) % 1; return TM.tf(0, -30 * u, 0, 0.5 + u) + ';' + TM.op(t < 0.95 ? 1 - u : 0); }, { box: 'fill-box', origin: '50% 100%' })
    ]
  });
})();
