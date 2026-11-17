// TRAINS book — the second batch of real trains: working and freight trains,
// street trains, a rack railway and two helper trains. Cut polygons are in
// crop px (1500×1000), traced from gridded photos. Built on buildTrain.
(function () {
  'use strict';
  const T = window.TRAINS = window.TRAINS || {};

  // polygon helpers: a circle (for clips) and a cog wheel (for drawings)
  const ring = (cx, cy, r, n = 40) => Array.from({ length: n }, (_, i) => {
    const a = i * 2 * Math.PI / n;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
  });
  const cog = (cx, cy, r, teeth) => Array.from({ length: teeth * 4 }, (_, i) => {
    const a = (i - .5) * Math.PI / (teeth * 2), rr = (i % 4 < 2) ? r : r * .8;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  // a four-point sparkle star
  const star = (x, y, s) => `<path d="M${x} ${y - s} L${x + s * .25} ${y - s * .25} L${x + s} ${y} L${x + s * .25} ${y + s * .25}
    L${x} ${y + s} L${x - s * .25} ${y + s * .25} L${x - s} ${y} L${x - s * .25} ${y - s * .25}Z"/>`;
  const glowDots = (g, fill, dots) => `<g fill="${fill}" filter="${g}">${dots.map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g fill="#fff">${dots.map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${Math.round(r * .4)}"/>`).join('')}</g>`;

  // C&S rotary snowplow: the big red fan spins and throws a cloud of snow
  // rotary snowplow: the photo's own red rotor is cut out as a circle
  // (as large as the rotor's width allows) and spins. Snow sprays out of
  // the chute and flakes fall back.
  const ellipse = (cx, cy, rx, ry, n = 48) => Array.from({ length: n }, (_, i) => {
    const a = i * 2 * Math.PI / n; return [Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))];
  });
  const ROTOR = { cx: 255, cy: 598, r: 155 };   // a circle touching the rotor's left and right edges in the photo
  T.plow = () => buildTrain({
    img: 'plow',
    cuts: {
      'tr-body': [[48,385],[60,370],[215,350],[245,300],[255,265],[320,230],[350,215],[480,215],[600,245],[610,275],[650,335],[760,365],[850,395],[990,445],[1000,470],[990,485],[1100,505],[1180,540],[1195,560],[1200,700],[1195,740],[1000,760],[800,790],[560,800],[500,815],[410,810],[400,795],[50,790]],
      'tr-front': [[48,385],[60,370],[215,350],[400,350],[410,450],[415,800],[50,790]],
      'tr-top': ellipse(ROTOR.cx, ROTOR.cy, ROTOR.r, ROTOR.r, 72)
    },
    fx: {
      'fx-tr': plume({ x: 235, y: 300, dx: -260, dy: -330, n: 14, r: 34, grow: 3.4, life: 1.6, every: 0.11, color: '#ffffff', shade: '#d6e0ea', billow: 30, seed: 4 }),
      'fx-tr-2': spray({ x: 235, y: 300, n: 34, vx: [-420, -120], vy: [-620, -320], g: 1100, life: 1.25, every: 0.05, size: [5, 13], color: ['#ffffff', '#eef4fa', '#dbe6f0'], seed: 9 })
    },
    tracks: [
      // spins up through three turns and slows down again
      TM.track('tr-top', 2.6, t => TM.tf(0, 0, -1080 * (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t))), { origin: `${ROTOR.cx}px ${ROTOR.cy}px`, n: 90 }),
      { parts: ['tr-body', 'tr-front'], timing: '2.6s linear',
        keyframes: '0%,100%{transform:translate(0,0)}' + [15, 30, 45, 60, 75].map(p => `${p}%{transform:translate(-2px,1px)}${p + 7}%{transform:translate(2px,0)}`).join('') },
      plumeTrack('fx-tr', 3.4),
      plumeTrack('fx-tr-2', 3.2)
    ]
  });

  // CN freight: three engines rumble closer, their lights flashing
  T.freight = () => buildTrain({
    img: 'freight',
    cuts: {
      'tr-body': [[150,700],[170,580],[200,555],[205,490],[250,480],[400,485],[470,500],[600,515],[680,540],[720,540],[770,555],[860,560],[900,565],[960,575],[1000,595],[1100,605],[1200,615],[1350,630],[1460,640],[1460,660],[1350,680],[1200,700],[1100,722],[1000,735],[900,750],[800,770],[700,790],[600,800],[420,840],[330,848],[160,840],[150,800]],
      'tr-front': [[150,700],[170,580],[200,555],[205,490],[250,480],[400,485],[470,500],[475,560],[480,850],[330,848],[160,840],[150,800]]
    },
    fx: {
      'fx-tr': g => glowDots(g, '#fff4c2', [[288,491,22],[306,491,22],[192,690,26],[315,690,26]])
    },
    tracks: [
      { parts: 'tr-front', timing: '1.8s ease-in-out',
        keyframes: '0%,100%{transform:translate(0,0)}40%,70%{transform:translate(-14px,8px)}' },
      { parts: 'tr-body', timing: '1.8s linear',
        keyframes: '0%,100%{transform:translate(0,0)}10%,30%,50%,70%,90%{transform:translate(-2px,1px)}20%,40%,60%,80%{transform:translate(2px,0)}' },
      { parts: 'fx-tr', timing: '1.8s linear',
        keyframes: '0%{opacity:0}10%{opacity:1}25%{opacity:.2}40%{opacity:1}55%{opacity:.2}70%{opacity:1}100%{opacity:0}' }
    ]
  });

  // Union Pacific stack train: the double-stacked containers hop and settle
  T.container = () => buildTrain({
    img: 'container',
    cuts: {
      'tr-body': [[45,470],[50,430],[70,345],[105,325],[110,285],[135,268],[250,265],[320,282],[420,295],[480,300],[600,310],[645,318],[720,325],[800,335],[900,340],[1000,350],[1100,360],[1185,365],[1190,340],[1310,345],[1320,355],[1450,370],[1500,378],[1500,475],[1300,490],[1100,500],[900,510],[700,518],[500,530],[300,545],[200,550],[60,548]],
      'tr-front': [[45,470],[50,430],[70,345],[105,325],[110,285],[135,268],[250,265],[320,282],[420,295],[430,550],[200,550],[60,548]],
      'tr-top': [[1190,340],[1312,345],[1318,352],[1440,368],[1500,372],[1500,450],[1240,455],[1236,370],[1190,365]]
    },
    fx: {
      'fx-tr': g => glowDots(g, '#fff4c2', [[138,345,18],[80,435,20],[162,435,20]])
    },
    tracks: [
      TM.track('tr-top', 1.4, t => TM.tf(0, -22 * Math.abs(TM.spring(t, 0, 2.2, 3)))),
      { parts: ['tr-body', 'tr-front'], timing: '1.6s ease-in-out',
        keyframes: '0%,100%{transform:translateX(0)}50%{transform:translateX(-18px)}' },
      { parts: 'fx-tr', timing: '1.6s ease-in-out',
        keyframes: '0%{opacity:0}20%{opacity:1}80%{opacity:1}100%{opacity:0}' }
    ]
  });

  // DB car carrier: the new car on the top deck bounces on its springs and
  // the shiny cars sparkle
  T.carcarrier = () => buildTrain({
    img: 'carcarrier',
    cuts: {
      'tr-body': [[0,40],[110,60],[140,40],[250,38],[400,60],[560,110],[690,185],[760,240],[800,290],[900,280],[1000,310],[1060,360],[1150,370],[1200,410],[1260,430],[1330,450],[1400,485],[1500,505],[1500,600],[1400,625],[1300,650],[1200,680],[1000,720],[800,740],[640,750],[560,760],[450,800],[400,860],[300,860],[200,830],[0,800]],
      'tr-top': [[110,140],[115,100],[140,45],[250,38],[380,55],[480,80],[560,110],[640,160],[690,185],[740,225],[790,260],[815,300],[810,350],[760,380],[700,360],[600,330],[500,310],[400,300],[300,270],[200,230],[140,200]]
    },
    fx: {
      'fx-tr': g => `<g fill="#fff">${star(300, 110, 30)}${star(700, 250, 24)}${star(950, 520, 28)}${star(1120, 400, 22)}</g>
        <g fill="#fff" filter="${g}" opacity=".8"><circle cx="300" cy="110" r="18"/><circle cx="700" cy="250" r="14"/>
        <circle cx="950" cy="520" r="16"/><circle cx="1120" cy="400" r="13"/></g>`
    },
    tracks: [
      TM.track('tr-top', 1.5, t => TM.tf(0, -14 * Math.abs(TM.spring(t, 0, 2.6, 3.2)))),
      { parts: 'fx-tr', box: 'fill-box', origin: '50% 50%', timing: '1.6s ease-in-out',
        keyframes: '0%{opacity:0;transform:scale(.6)}30%{opacity:1;transform:scale(1.05)}50%{opacity:.4}70%{opacity:1}100%{opacity:0;transform:scale(1)}' }
    ]
  });

  // LA Metro light rail: ding-ding goes the bell and the headlights shine
  T.lightrail = () => buildTrain({
    img: 'lightrail',
    cuts: {
      'tr-body': [[70,215],[90,195],[300,185],[560,190],[850,185],[1080,172],[1200,175],[1300,190],[1330,215],[1345,330],[1385,370],[1385,430],[1345,440],[1340,840],[1300,840],[1240,850],[1060,860],[900,850],[820,845],[810,800],[600,770],[560,720],[400,680],[350,640],[290,640],[100,520],[70,480]],
      'tr-front': [[850,190],[1080,172],[1200,175],[1300,190],[1330,215],[1345,330],[1385,370],[1385,430],[1345,440],[1340,840],[1300,840],[1240,850],[1060,860],[900,850],[820,845],[830,700],[840,330],[860,260]]
    },
    fx: {
      'fx-tr': g => glowDots(g, '#fff4c2', [[1020,683,30],[1240,680,30],[1118,255,26]]),
      'fx-tr-2': `<g fill="none" stroke="#fff" stroke-linecap="round">
        <path d="M1060 200 q-30 -30 0 -60" stroke-width="9"/><path d="M1030 220 q-50 -50 0 -100" stroke-width="7"/>
        <path d="M1176 200 q30 -30 0 -60" stroke-width="9"/><path d="M1206 220 q50 -50 0 -100" stroke-width="7"/></g>`
    },
    tracks: [
      { parts: ['tr-body', 'tr-front'], timing: '1.6s ease-in-out',
        keyframes: '0%,100%{transform:translate(0,0)}50%{transform:translate(10px,6px)}' },
      { parts: 'fx-tr', timing: '1.6s ease-in-out',
        keyframes: '0%{opacity:0}20%{opacity:1}80%{opacity:1}100%{opacity:0}' },
      { parts: 'fx-tr-2', timing: '1s linear',
        keyframes: '0%{opacity:0}10%{opacity:1}35%{opacity:0}50%{opacity:0}60%{opacity:1}85%{opacity:0}100%{opacity:0}' }
    ]
  });

  // Kassel RegioTram: the tram-train sways round the curve, lights on
  T.tramtrain = () => buildTrain({
    img: 'tramtrain',
    cuts: {
      'tr-body': [[60,350],[70,318],[150,300],[200,298],[400,250],[510,195],[520,170],[575,150],[1020,150],[1025,180],[1075,185],[1095,205],[1110,350],[1145,360],[1150,395],[1112,400],[1110,700],[1095,770],[1050,795],[900,805],[770,800],[750,770],[620,760],[560,740],[450,700],[300,660],[200,640],[65,590],[58,560]],
      'tr-front': [[730,190],[745,175],[1020,175],[1075,185],[1095,205],[1110,350],[1145,360],[1150,395],[1112,400],[1110,700],[1095,770],[1050,795],[900,805],[770,800],[750,770],[760,600],[740,450],[730,260]]
    },
    fx: {
      'fx-tr': g => glowDots(g, '#fff4c2', [[862,660,28],[1018,662,28],[908,276,20]])
    },
    tracks: [
      { parts: ['tr-body', 'tr-front'], origin: '900px 800px', timing: '2s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}30%{transform:rotate(-1.4deg)}65%{transform:rotate(1deg)}85%{transform:rotate(-.3deg)}' },
      { parts: 'fx-tr', timing: '2s ease-in-out',
        keyframes: '0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}' }
    ]
  });

  // Pilatus rack railway: the car clicks up the slope as a cog wheel turns
  T.rack = () => buildTrain({
    img: 'rack',
    cuts: {
      'tr-body': [[655,330],[668,315],[730,310],[735,285],[770,288],[780,310],[840,320],[1000,410],[1110,495],[1122,520],[1122,670],[1100,672],[1050,640],[900,575],[800,540],[700,510],[655,490]],
      'tr-front': [[655,330],[668,315],[730,310],[735,285],[770,288],[780,310],[800,320],[815,520],[700,510],[655,490]]
    },
    fx: {
      'fx-tr': `<g transform="translate(880 650)"><polygon points="${cog(0, 0, 62, 12)}" fill="#c9ccd1" stroke="#5f646b" stroke-width="5"/>
        <circle r="24" fill="#8a9098" stroke="#5f646b" stroke-width="5"/><circle r="8" fill="#3d4046"/></g>`,
      'fx-tr-2': g => glowDots(g, '#fff4c2', [[700, 435, 22]])
    },
    tracks: [
      // up the slope (direction of the track in the photo) and gently back down
      TM.track(['tr-body', 'tr-front'], 2.8, t => { const d = 44 * TM.out(t, 0.6, 0.8) + 1.2 * TM.chuff(t, 14) * TM.env(t); return TM.tf(-0.93 * d, -0.36 * d); }),
      TM.track('fx-tr', 2.8, t => TM.tf(0, 0, -340 * TM.out(t, 0.6, 0.8)) + ';' + TM.op(TM.env(t, 0.08, 0.85)), { box: 'fill-box', origin: '50% 50%' }),
      TM.track('fx-tr-2', 2.8, t => TM.op(TM.lamp(t, 0.04, 0.85)))
    ]
  });

  // track work train: the crane lifts its arm, the roof beacon flashes
  T.worktrain = () => buildTrain({
    img: 'worktrain',
    cuts: {
      'tr-body': [[30,800],[65,690],[165,680],[150,600],[150,450],[185,420],[250,410],[255,320],[235,280],[240,240],[330,190],[380,160],[470,165],[670,170],[720,200],[750,250],[820,265],[860,270],[880,290],[940,255],[1000,270],[1100,300],[1190,345],[1205,380],[1212,590],[1240,620],[1245,690],[1150,720],[1100,790],[1050,800],[1000,760],[640,860],[600,900],[500,900],[380,880],[300,880],[150,900],[60,880]],
      'tr-top': [[235,280],[240,240],[330,190],[380,160],[470,165],[670,170],[720,200],[760,260],[800,300],[880,380],[880,430],[850,440],[780,360],[700,280],[640,250],[560,240],[480,230],[400,240],[360,300],[360,560],[270,560],[255,320]]
    },
    fx: {
      'fx-tr': g => `<circle cx="838" cy="282" r="60" fill="#ffb020" filter="${g}"/><circle cx="838" cy="282" r="24" fill="#fff3c0"/>`
    },
    tracks: [
      { parts: 'tr-top', origin: '310px 550px', timing: '2.2s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}35%,65%{transform:rotate(-4deg)}' },
      { parts: 'fx-tr', timing: '2.2s linear',
        keyframes: '0%{opacity:0}8%{opacity:1}20%{opacity:0}32%{opacity:1}44%{opacity:0}56%{opacity:1}68%{opacity:0}80%{opacity:1}100%{opacity:0}' }
    ]
  });

  // Prague Tatra tram: blue sparks crackle on the wire, it rolls on, lights on
  T.tram = () => buildTrain({
    img: 'tram',
    cuts: {
      'tr-body': [[175,580],[205,550],[300,525],[450,490],[610,465],[620,480],[760,440],[900,400],[1030,375],[1150,372],[1210,378],[1240,400],[1250,445],[1300,520],[1325,600],[1330,700],[1345,760],[1340,790],[1290,800],[1240,840],[1150,860],[1050,880],[900,870],[820,870],[760,890],[640,870],[560,840],[420,820],[260,820],[190,780],[178,700]],
      'tr-front': [[995,385],[1150,372],[1210,378],[1240,400],[1250,445],[1300,520],[1325,600],[1330,700],[1345,760],[1340,790],[1290,800],[1240,840],[1150,860],[1050,880],[1000,870],[990,600],[1000,460]]
    },
    fx: {
      'fx-tr': g => `<circle cx="760" cy="82" r="56" fill="#8fdcff" filter="${g}"/>
        <path d="M760 32 L772 70 L812 66 L780 90 L800 128 L760 102 L722 128 L740 90 L708 66 L748 70Z" fill="#fff"/>`,
      'fx-tr-2': g => glowDots(g, '#fff4c2', [[1215,728,26],[1330,716,22]])
    },
    tracks: [
      { parts: 'fx-tr', timing: '1.4s linear',
        keyframes: '0%{opacity:0}8%{opacity:1}14%{opacity:.1}24%{opacity:1}32%{opacity:.2}44%{opacity:1}52%{opacity:0}100%{opacity:0}' },
      { parts: ['tr-body', 'tr-front'], timing: '1.8s ease-in-out',
        keyframes: '0%,100%{transform:translate(0,0)}50%{transform:translate(16px,4px)}' },
      { parts: 'fx-tr-2', timing: '1.8s ease-in-out',
        keyframes: '0%{opacity:0}20%{opacity:1}80%{opacity:1}100%{opacity:0}' }
    ]
  });

  // railway crane: the big hook swings on its cables. The hook was painted
  // out of img/crane.jpg and is drawn back as its own layer (crane-hook.png)
  // at its original spot, so it can move without leaving a copy behind.
  T.crane = () => buildTrain({
    img: 'crane',
    cuts: {
      'tr-body': [[40,800],[45,620],[60,580],[100,550],[160,520],[200,485],[240,480],[290,465],[340,455],[600,360],[900,250],[1050,210],[1250,130],[1300,115],[1380,115],[1420,120],[1480,210],[1440,240],[1360,280],[1250,330],[1170,370],[1100,420],[1000,460],[900,450],[830,480],[700,500],[580,570],[560,620],[600,640],[770,700],[780,740],[760,800],[700,880],[560,890],[420,870],[200,830],[100,830]]
    },
    parts: {
      'tr-top': `<defs><filter id="craneHookLift" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter></defs>
        <image href="img/crane-hook.png" x="1205" y="240" width="240" height="375" filter="url(#craneHookLift)"/>`
    },
    fx: {
      'fx-tr': g => `<circle cx="1432" cy="140" r="50" fill="#fff2b0" filter="${g}"/><circle cx="1432" cy="140" r="18" fill="#fff"/>`
    },
    tracks: [
      TM.track('tr-top', 2.6, t => TM.tf(0, 0, 9 * TM.spring(t, 0, 2.2, 2.2) * TM.sm(0, 0.08, t)), { origin: '1340px 262px' }),
      { parts: 'fx-tr', timing: '2.6s linear',
        keyframes: '0%{opacity:0}10%{opacity:1}25%{opacity:.3}40%{opacity:1}55%{opacity:.3}70%{opacity:1}100%{opacity:0}' }
    ]
  });

  // Speno rail grinder: stones grind the rails smooth, sparks fly
  const sparks = (pts) => `<g stroke-linecap="round">${pts.map(([x, y]) =>
    [[-60,-34],[-30,-50],[10,-56],[40,-40],[-70,-8],[60,-14]].map(([dx, dy], i) =>
      `<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="${i % 2 ? '#ffd24a' : '#ff8a1f'}" stroke-width="${i % 3 ? 4 : 6}"/>`).join('')).join('')}</g>`;
  T.grinder = () => buildTrain({
    img: 'grinder',
    cuts: {
      'tr-body': [[50,640],[55,410],[65,380],[110,360],[160,345],[210,325],[260,265],[340,250],[345,235],[450,190],[550,175],[560,145],[700,115],[860,130],[990,75],[1050,40],[1200,25],[1500,0],[1500,830],[1300,800],[1050,800],[800,770],[600,745],[400,725],[200,710],[60,690]],
      'tr-front': [[1040,45],[1200,25],[1500,0],[1500,830],[1300,800],[1050,800],[1035,500]]
    },
    fx: {
      'fx-tr': g => `<g filter="${g}" fill="#ffb347" opacity=".9"><ellipse cx="520" cy="742" rx="70" ry="22"/><ellipse cx="1200" cy="806" rx="90" ry="26"/></g>
        ${sparks([[520, 742], [1200, 806]])}`,
      'fx-tr-2': g => `<g filter="${g}" fill="#ffb347" opacity=".9"><ellipse cx="250" cy="716" rx="60" ry="20"/><ellipse cx="900" cy="776" rx="80" ry="24"/><ellipse cx="1420" cy="816" rx="80" ry="24"/></g>
        ${sparks([[250, 716], [900, 776], [1420, 816]])}`
    },
    tracks: [
      TM.track(['tr-body', 'tr-front'], 1.6, t => { const [x, y] = TM.jitter(t, 2.2 * TM.env(t), 30, 3); return TM.tf(x, y); }),
      { parts: 'fx-tr', timing: '1.6s linear',
        keyframes: '0%{opacity:0}10%{opacity:1}20%{opacity:.2}35%{opacity:1}50%{opacity:.2}65%{opacity:1}85%{opacity:.6}100%{opacity:0}' },
      { parts: 'fx-tr-2', timing: '1.6s .1s linear both',
        keyframes: '0%{opacity:0}15%{opacity:.2}25%{opacity:1}40%{opacity:.2}55%{opacity:1}70%{opacity:.3}85%{opacity:1}100%{opacity:0}' }
    ]
  });

  // black tank car: it rocks on its springs and a shine slides along the
  // glossy tank. (Cropped right of the photo's rail worker so he's not in it.)
  T.tankcar = () => buildTrain({
    img: 'tankcar',
    cuts: {
      'tr-body': [[0,165],[95,130],[335,185],[600,110],[900,50],[1080,20],[1150,10],[1230,25],[1300,80],[1340,150],[1370,250],[1385,360],[1420,390],[1440,480],[1500,520],[1500,860],[1450,940],[1300,950],[1150,950],[1000,920],[820,940],[730,900],[500,860],[0,860]],
      'tr-near': [[720,780],[760,745],[900,735],[1150,730],[1250,740],[1310,790],[1330,870],[1300,940],[1200,955],[1100,940],[1000,920],[820,940],[740,900],[720,840]],
      'tr-front': [[1050,40],[1080,20],[1150,10],[1230,25],[1300,80],[1340,150],[1370,250],[1385,360],[1380,480],[1340,560],[1250,620],[1150,640],[1080,600],[1050,450],[1040,250]]
    },
    fx: {
      'fx-tr': g => `<ellipse cx="280" cy="235" rx="150" ry="20" fill="#fff" opacity=".8" filter="${g}" transform="rotate(-12 280 235)"/>
        <ellipse cx="280" cy="235" rx="80" ry="6" fill="#fff" transform="rotate(-12 280 235)"/>`
    },
    tracks: [
      TM.track(['tr-body', 'tr-front'], 1.8, t => TM.tf(0, 0, -1 * TM.spring(t, 0, 2, 2.6)), { origin: '1000px 900px' }),
      { parts: 'fx-tr', timing: '1.6s .1s ease-in-out both',
        keyframes: '0%{opacity:0;transform:translate(0,0)}20%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(760px,-165px)}' }
    ]
  });

  // CPG500 track-laying machine: it inches forward and drops new sleepers
  // under its gantry, one after another. (Two tiny workers in the photo's
  // background were painted out of img/tracklayer.jpg.)
  const sleeper = x => `<rect x="${x}" y="676" width="58" height="16" rx="3" fill="#6b4a2e"/>
    <rect x="${x}" y="676" width="58" height="5" rx="2" fill="#8a6542"/>`;
  T.tracklayer = () => buildTrain({
    img: 'tracklayer',
    cuts: {
      'tr-body': [[30,640],[60,530],[100,510],[200,495],[290,470],[450,450],[540,435],[600,428],[680,440],[695,455],[690,490],[745,490],[748,455],[785,455],[800,420],[740,420],[760,408],[1020,368],[1105,375],[1150,360],[1185,358],[1260,375],[1310,385],[1360,400],[1420,440],[1475,600],[1470,645],[1420,650],[1420,690],[1380,700],[1000,700],[700,695],[400,695],[150,690],[40,670]],
      'tr-front': [[1150,360],[1185,358],[1260,375],[1310,385],[1360,400],[1420,440],[1475,600],[1470,645],[1420,650],[1420,690],[1380,700],[1200,700],[1180,600],[1170,450]]
    },
    fx: {
      'fx-tr': sleeper(70) + sleeper(150),
      'fx-tr-2': sleeper(230) + sleeper(310)
    },
    tracks: [
      TM.track(['tr-body', 'tr-front'], 2.8, t => { const [x, y] = TM.jitter(t, 0.9 * TM.env(t), 22, 6); return TM.tf(-24 * TM.out(t, 0.45, 0.75) + x, y, 0.25 * TM.spring(t, 0.45, 3, 6)); }, { origin: '800px 700px' }),
      // a sleeper falls (speeding up), lands, bounces twice and stays
      ...[['fx-tr', 0.12], ['fx-tr-2', 0.32]].map(([p, t0]) => TM.track(p, 2.8, t => {
        const u = Math.max(0, t - t0) * 2.8, fall = Math.min(1, u / 0.35);
        const y = u < 0.35 ? -90 * (1 - fall * fall) : -8 * Math.abs(TM.spring(u - 0.35, 0, 2.2, 7));
        return TM.tf(0, y) + ';' + TM.op(t < t0 ? 0 : TM.env(t, t0 + 0.02, 0.88));
      }))
    ]
  });

  // SBB fire and rescue train: the roof water cannon sprays a big arc
  T.firetrain = () => buildTrain({
    img: 'firetrain',
    cuts: {
      'tr-body': [[40,450],[55,420],[90,400],[200,370],[260,345],[400,320],[450,300],[560,290],[640,255],[760,230],[900,215],[1000,190],[1040,175],[1050,135],[1145,135],[1145,195],[1100,210],[1110,245],[1250,250],[1280,275],[1300,300],[1308,450],[1305,600],[1350,620],[1352,700],[1300,740],[1290,830],[1200,840],[900,840],[860,830],[800,780],[560,760],[420,720],[200,660],[45,630]],
      'tr-front': [[800,300],[870,250],[1000,240],[1110,245],[1250,250],[1280,275],[1300,300],[1308,450],[1305,600],[1350,620],[1352,700],[1300,740],[1290,830],[1200,840],[900,840],[860,830],[820,700],[800,500]],
      'tr-top': [[1040,130],[1150,130],[1150,200],[1090,250],[1050,250],[1040,200]]
    },
    fx: {
      'fx-tr': g => `<path d="M1080 135 Q900 -80 560 70" fill="none" stroke="#9fd8ff" stroke-width="34" stroke-linecap="round" filter="${g}"/>
        <path d="M1080 135 Q900 -80 560 70" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-dasharray="40 30"/>`,
      'fx-tr-2': `<g fill="#cfeaff">${[[560,110,12],[520,150,9],[600,160,10],[540,210,8],[480,190,11],[590,240,7]].map(p =>
          `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}"/>`).join('')}</g>`
    },
    tracks: [
      { parts: 'tr-top', origin: '1095px 220px', timing: '2.2s ease-in-out',
        keyframes: '0%,100%{transform:rotate(0)}20%,80%{transform:rotate(-6deg)}' },
      { parts: 'fx-tr', timing: '2.2s linear',
        keyframes: '0%{opacity:0;stroke-dashoffset:0}20%{opacity:1}80%{opacity:1}100%{opacity:0;stroke-dashoffset:-350}' },
      { parts: 'fx-tr-2', timing: '1.6s .5s ease-in both',
        keyframes: '0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(160px)}' }
    ]
  });
})();
