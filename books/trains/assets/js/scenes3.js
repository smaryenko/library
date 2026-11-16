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
  T.plow = () => buildTrain({
    img: 'plow',
    cuts: {
      'tr-body': [[48,385],[60,370],[215,350],[245,300],[255,265],[320,230],[350,215],[480,215],[600,245],[610,275],[650,335],[760,365],[850,395],[990,445],[1000,470],[990,485],[1100,505],[1180,540],[1195,560],[1200,700],[1195,740],[1000,760],[800,790],[560,800],[500,815],[410,810],[400,795],[50,790]],
      'tr-front': [[48,385],[60,370],[215,350],[400,350],[410,450],[415,800],[50,790]],
      'tr-top': ring(245, 580, 150)
    },
    fx: {
      'fx-tr': `<g fill="#fff">${[[230,330,60],[150,300,48],[300,290,44],[90,350,40],[200,240,52],[110,250,36]].map(p =>
          `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" opacity=".9"/>`).join('')}</g>`,
      'fx-tr-2': `<g fill="#fff" opacity=".95">${[[120,120],[260,60],[380,140],[60,200],[330,20],[180,170],[440,60]].map(([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`
    },
    tracks: [
      { parts: 'tr-top', origin: '245px 580px', timing: '2.4s cubic-bezier(.5,0,.3,1)',
        keyframes: '0%{transform:rotate(0)}100%{transform:rotate(-720deg)}' },
      { parts: 'fx-tr', box: 'fill-box', origin: '70% 100%', timing: '1.8s .4s ease-out both',
        keyframes: '0%{opacity:0;transform:translate(0,40px) scale(.3)}20%{opacity:1}100%{opacity:0;transform:translate(-140px,-190px) scale(1.7)}' },
      { parts: 'fx-tr-2', timing: '2.2s .6s ease-in both',
        keyframes: '0%{opacity:0;transform:translate(60px,-40px)}20%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate(-80px,260px)}' }
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
      { parts: 'tr-top', timing: '1.4s ease-out',
        keyframes: '0%,100%{transform:translateY(0)}15%{transform:translateY(-22px)}30%{transform:translateY(0)}45%{transform:translateY(-10px)}60%{transform:translateY(0)}75%{transform:translateY(-4px)}' },
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
      { parts: 'tr-top', timing: '1.5s ease-out',
        keyframes: '0%,100%{transform:translateY(0)}18%{transform:translateY(-14px)}36%{transform:translateY(3px)}54%{transform:translateY(-6px)}72%{transform:translateY(1px)}' },
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
        <circle r="24" fill="#8a9098" stroke="#5f646b" stroke-width="5"/><circle r="8" fill="#3d4046"/></g>`
    },
    tracks: [
      { parts: ['tr-body', 'tr-front'], timing: '2.4s ease-in-out',
        keyframes: '0%,100%{transform:translate(0,0)}12%,18%{transform:translate(-10px,-4px)}30%,36%{transform:translate(-20px,-8px)}' +
          '48%,54%{transform:translate(-30px,-12px)}66%,74%{transform:translate(-40px,-16px)}' },
      { parts: 'fx-tr', box: 'fill-box', origin: '50% 50%', timing: '2.4s ease-in-out',
        keyframes: '0%{opacity:0;transform:rotate(0)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:rotate(-300deg)}' }
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
