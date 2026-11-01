// Original layered reindeer, flat cartoon style (style reference only: generic
// "Santa's reindeer" look). Each visual part is its own SVG group so a renderer
// can offset parts in Z for a pseudo-3D tilt/parallax effect.
//
// buildReindeer(cfg) -> SVG string.
// cfg: { fur, furDark, belly, antler, nose, accessory }
//   accessory: one of 'none' | 'scarf-red' | 'scarf-green' | 'collar' | 'vest-green' | 'vest-red' | 'santa-hat'
//   nose: 'brown' | 'red'

const PARTS = ['shadow', 'back-legs', 'body', 'belly', 'front-legs', 'accessory', 'head', 'ears', 'antlers', 'face', 'nose'];

function buildReindeer(cfg) {
  const fur = cfg.fur || '#A9743B';
  const furDark = cfg.furDark || '#8A5A28';
  const belly = cfg.belly || '#E9CBA0';
  // Keep antler STYLE (cfg.antlerStyle: wide/tall/bushy) separate from antler
  // COLOR (cfg.antlerColor) so the two never get confused.
  const antlerColor = cfg.antlerColor || '#7a4a2b';
  const antlerStyleKey = cfg.antlerStyle || 'wide';
  const noseColor = cfg.nose === 'red' ? '#E23B2E' : '#5A3A22';
  const hoof = '#3A2616';

  // --- shading helpers: lighten/darken a hex colour by a percentage ---
  function shade(hex, pct){
    const h=hex.replace('#','');
    const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    const f=v=> Math.max(0, Math.min(255, Math.round(v + (pct<0 ? v*pct : (255-v)*pct))));
    const to=v=>f(v).toString(16).padStart(2,'0');
    return '#'+to(r)+to(g)+to(b);
  }
  const furLight = shade(fur, 0.22);   // highlight
  const furMid   = fur;
  const furDeep  = shade(fur, -0.28);  // rim shadow
  const bellyLight = shade(belly, 0.16);
  const bellyDeep  = shade(belly, -0.18);
  // Unique id suffix so multiple reindeer on one page don't share gradient ids.
  const uid = 'r' + Math.random().toString(36).slice(2, 8);

  // Realistic-cartoon antlers: a tapering beam offset from a centre line, with
  // branching tines. Built here so sides can't self-intersect. Variants differ
  // in beam width / tine count / sweep so reindeer read as distinct.
  function offsetStrip(points, widthFn) {
    const n = points.length, left=[], right=[];
    for (let i=0;i<n;i++){
      const p=points[i], a=points[Math.max(0,i-1)], b=points[Math.min(n-1,i+1)];
      let dx=b.x-a.x, dy=b.y-a.y; const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
      const nx=-dy, ny=dx, w=widthFn(i/(n-1))/2;
      left.push({x:p.x+nx*w,y:p.y+ny*w});
      right.push({x:p.x-nx*w,y:p.y-ny*w});
    }
    const pts=left.concat(right.reverse());
    if(pts.length<3) return 'M'+pts.map(p=>p.x+' '+p.y).join(' L')+'Z';
    let d='M'+pts[0].x.toFixed(1)+' '+pts[0].y.toFixed(1);
    for(let i=0;i<pts.length;i++){
      const p0=pts[(i-1+pts.length)%pts.length], p1=pts[i],
            p2=pts[(i+1)%pts.length], p3=pts[(i+2)%pts.length];
      const c1x=p1.x+(p2.x-p0.x)/6, c1y=p1.y+(p2.y-p0.y)/6;
      const c2x=p2.x-(p3.x-p1.x)/6, c2y=p2.y-(p3.y-p1.y)/6;
      d+=`C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d+'Z';
  }
  // Flat silhouette antlers (fill only, no stroke, no inner shading), traced
  // from the reference: S-curve beam, a down-and-OUT foot at the base, tines
  // that branch up-and-inward, forming a lyre rack. Tines/foot point away from
  // centre so the mirrored left antler can't collide with the right.
  // Authored large (right antler base ~ (150,330)); a transform scales/places
  // the pair onto the head. Style variants differ in beam width.
  const antlerStyleDefs = {
    wide:  { bw:30 },
    tall:  { bw:25 },
    bushy: { bw:34 }
  };
  const aStyle = antlerStyleDefs[antlerStyleKey] || antlerStyleDefs.wide;
  function antlerRightPaths(s){
    const bw=s.bw, P=[];
    // Main beam: S-curve, foot low, up and slightly back, tip leaning back.
    P.push(offsetStrip(
      [{x:150,y:332},{x:132,y:300},{x:138,y:262},{x:168,y:238},{x:196,y:206},
       {x:214,y:168},{x:220,y:120},{x:214,y:74},{x:210,y:30}],
      t=>bw*(1-0.6*t)+7));
    // Bottom foot: short stub down-and-out (down-right for this right antler).
    P.push(offsetStrip(
      [{x:150,y:306},{x:170,y:320},{x:186,y:332}],
      t=>bw*0.46*(1-0.68*t)+6));
    // Low inner tine: up-and-inward.
    P.push(offsetStrip(
      [{x:150,y:252},{x:120,y:238},{x:96,y:216},{x:82,y:196}],
      t=>bw*0.5*(1-0.72*t)+6));
    // Mid tine: branches up-left (inward) and curls.
    P.push(offsetStrip(
      [{x:188,y:214},{x:160,y:196},{x:138,y:168},{x:128,y:140}],
      t=>bw*0.46*(1-0.72*t)+5));
    // Upper tine: near the top, forks up-left.
    P.push(offsetStrip(
      [{x:214,y:150},{x:196,y:120},{x:186,y:88},{x:182,y:58}],
      t=>bw*0.42*(1-0.72*t)+5));
    return P;
  }
  const _ar = antlerRightPaths(aStyle);
  // Placement: author right antler spans x~[82,220], base foot ~ (150,332),
  // tip ~ (210,30). Right antler is drawn shifted right; left is mirrored so
  // the two bases sit `gap` apart. Then the whole pair is scaled onto the head
  // (head cx=180, forehead ~ y=150) and the rack rises above.
  const A_GAP = 80;                 // authored-space gap between the two bases
  const A_BASEX = 150;              // authored base x of the right antler
  const A_SHIFT = 270 + A_GAP;      // move right antler base to this x
  const A_DX = A_SHIFT - A_BASEX;   // translate applied to the right antler
  const A_MIRROR = A_SHIFT - A_GAP; // mirror axis sits gap left of base
  const aScale = 0.46;              // scale authored antler down onto the head
  // After scale, place the pair so its centre (x=A_MIRROR) maps to head cx=180
  // and the base (y≈332) sits at the forehead (~y=150).
  const aTx = 180 - A_MIRROR*aScale;
  const aTy = 150 - 332*aScale;

  // Christmas scarf palette: main colour + a darker shade for the hanging tail.
  // Add new festive colours here; any accessory named `scarf-<key>` uses it.
  const SCARF_COLORS = {
    red:       { c: '#E23B2E', cd: '#B82A20' },
    green:     { c: '#2E8B57', cd: '#226B43' },
    gold:      { c: '#E7B63C', cd: '#C2902A' },
    burgundy:  { c: '#8C2F39', cd: '#6B222A' },
    ice:       { c: '#6FB7D6', cd: '#4E93B0' },
    plum:      { c: '#7D4A8E', cd: '#5F3770' },
    cranberry: { c: '#B2283A', cd: '#8A1C2C' },
    pine:      { c: '#1F6F4A', cd: '#155439' },
    frost:     { c: '#A8CBE0', cd: '#83AEC9' }
  };

  function accessory() {
    if (typeof cfg.accessory === 'string' && cfg.accessory.startsWith('scarf-')) {
      const key = cfg.accessory.slice('scarf-'.length);
      const sc = SCARF_COLORS[key] || SCARF_COLORS.red;
      return `<g data-part="accessory">
          <path fill="${sc.c}" d="M138 212 q42 22 86 0 l0 18 q-43 20 -86 0 z"/>
          <path fill="${sc.cd}" d="M150 228 l-10 42 l20 0 l6 -40 z"/>
          <path fill="${sc.c}" d="M150 228 l-14 40 l18 4 l8 -42 z"/>
        </g>`;
    }
    switch (cfg.accessory) {
      case 'collar':
        return `<g data-part="accessory">
          <path fill="#C62828" d="M140 214 q40 20 80 0 l0 12 q-40 18 -80 0 z"/>
          <circle cx="180" cy="232" r="9" fill="#F2C94C" stroke="#D4A017" stroke-width="2"/>
        </g>`;
      case 'vest-green':
      case 'vest-red': {
        const c = cfg.accessory === 'vest-green' ? '#2E8B57' : '#C62828';
        return `<g data-part="accessory">
          <path fill="${c}" d="M138 214 q42 24 84 0 l6 70 q-48 22 -96 0 z"/>
        </g>`;
      }
      case 'santa-hat':
        return '';
      default:
        return '<g data-part="accessory"></g>';
    }
  }

  function santaHat() {
    if (cfg.accessory !== 'santa-hat') return '';
    return `<g data-part="hat">
      <path fill="#E23B2E" d="M150 96 q30 -42 68 -20 q-8 22 -30 34 q-22 10 -44 2 z"/>
      <path fill="#fff" d="M146 96 q36 20 74 -6 l4 14 q-40 24 -82 6 z"/>
      <circle cx="220" cy="74" r="9" fill="#fff"/>
    </g>`;
  }

  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- body volume: highlight top-left, darker lower-right rim -->
      <radialGradient id="bodyGrad-${uid}" cx="40%" cy="32%" r="75%">
        <stop offset="0%"  stop-color="${furLight}"/>
        <stop offset="55%" stop-color="${furMid}"/>
        <stop offset="100%" stop-color="${furDeep}"/>
      </radialGradient>
      <radialGradient id="headGrad-${uid}" cx="42%" cy="34%" r="78%">
        <stop offset="0%"  stop-color="${furLight}"/>
        <stop offset="60%" stop-color="${furMid}"/>
        <stop offset="100%" stop-color="${furDeep}"/>
      </radialGradient>
      <radialGradient id="bellyGrad-${uid}" cx="50%" cy="30%" r="80%">
        <stop offset="0%"  stop-color="${bellyLight}"/>
        <stop offset="70%" stop-color="${belly}"/>
        <stop offset="100%" stop-color="${bellyDeep}"/>
      </radialGradient>
      <!-- soft contact shadow under the head / behind the belly -->
      <radialGradient id="softShadow-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="rgba(0,0,0,0.22)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
    </defs>
    <g data-part="shadow"><ellipse cx="180" cy="330" rx="86" ry="14" fill="rgba(0,0,0,0.12)"/></g>

    <g data-part="back-legs">
      <rect x="150" y="268" width="18" height="54" rx="9" fill="${furDark}"/>
      <rect x="206" y="268" width="18" height="54" rx="9" fill="${furDark}"/>
      <ellipse cx="159" cy="322" rx="12" ry="8" fill="${hoof}"/>
      <ellipse cx="215" cy="322" rx="12" ry="8" fill="${hoof}"/>
    </g>

    <g data-part="body">
      <ellipse cx="180" cy="236" rx="66" ry="60" fill="url(#bodyGrad-${uid})"/>
      <!-- lower-right rim shade for extra roundness -->
      <ellipse cx="180" cy="236" rx="66" ry="60" fill="url(#softShadow-${uid})"
               transform="translate(22 20) scale(0.62)" opacity="0.5"/>
      <!-- contact shadow cast by the head onto the top of the body -->
      <ellipse cx="180" cy="196" rx="50" ry="18" fill="url(#softShadow-${uid})" opacity="0.5"/>
    </g>
    <g data-part="belly">
      <ellipse cx="180" cy="256" rx="40" ry="38" fill="url(#bellyGrad-${uid})"/>
      <!-- shadow where the belly meets the body at the top -->
      <ellipse cx="180" cy="224" rx="40" ry="16" fill="url(#softShadow-${uid})" opacity="0.6"/>
    </g>

    <g data-part="front-legs">
      <rect x="138" y="270" width="18" height="52" rx="9" fill="${fur}"/>
      <rect x="204" y="270" width="18" height="52" rx="9" fill="${fur}"/>
      <ellipse cx="147" cy="322" rx="12" ry="8" fill="${hoof}"/>
      <ellipse cx="213" cy="322" rx="12" ry="8" fill="${hoof}"/>
    </g>

    ${accessory()}

    <g data-part="antlers">
      <g transform="translate(${aTx.toFixed(2)},${aTy.toFixed(2)}) scale(${aScale})">
        <g fill="${antlerColor}" transform="translate(${2*A_MIRROR},0) scale(-1,1) translate(${A_DX},0)">
          ${_ar.map(d=>`<path d="${d}"/>`).join('')}
        </g>
        <g fill="${antlerColor}" transform="translate(${A_DX},0)">
          ${_ar.map(d=>`<path d="${d}"/>`).join('')}
        </g>
      </g>
    </g>

    <g data-part="ears">
      <ellipse cx="132" cy="168" rx="20" ry="13" fill="${furDark}" transform="rotate(-24 132 168)"/>
      <ellipse cx="228" cy="168" rx="20" ry="13" fill="${furDark}" transform="rotate(24 228 168)"/>
    </g>

    <g data-part="head">
      <ellipse cx="180" cy="186" rx="52" ry="48" fill="url(#headGrad-${uid})"/>
      <!-- lower rim shade on the head -->
      <ellipse cx="184" cy="196" rx="44" ry="40" fill="url(#softShadow-${uid})" opacity="0.4"/>
    </g>

    <g data-part="face">
      <ellipse cx="180" cy="210" rx="30" ry="26" fill="${belly}"/>
      <circle cx="166" cy="180" r="6.5" fill="#2A1A10"/>
      <circle cx="194" cy="180" r="6.5" fill="#2A1A10"/>
      <circle cx="168" cy="178" r="2" fill="#fff"/>
      <circle cx="196" cy="178" r="2" fill="#fff"/>
      <path d="M170 214 q10 10 20 0" fill="none" stroke="#5A3A22" stroke-width="3" stroke-linecap="round"/>
    </g>

    <g data-part="nose">
      <ellipse cx="180" cy="206" rx="13" ry="11" fill="${noseColor}"/>
      ${cfg.nose === 'red' ? '<ellipse cx="176" cy="202" rx="4" ry="3" fill="rgba(255,255,255,0.55)"/>' : ''}
    </g>

    ${santaHat()}
  </svg>`;
}

if (typeof module !== 'undefined') module.exports = { buildReindeer, PARTS };
