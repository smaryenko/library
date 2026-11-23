// THE ANT AND THE CRUMB: the clay renderer. One shared WebGL canvas laid over the
// shown page's placeholder SVG (data-anthill="<page>"), transparent except
// for the clay and its contact shadow.
//
// A raymarched signed distance field (same approach as books/athome and the
// approved preview books/preview/assets/js/antclay.js): the cutaway mound
// and everything in it (world.js generates that part of the shader), plus up
// to MAXA detailed ants posed on the CPU every picture (tripod gait), the
// crumb, carried items, the beetle, the worm, falling soil. Ants, rooms and
// props each sit behind a bounding check, so only what is near the ray costs.
//
// Each page is a camera stop in the one world; turning the page flies the
// camera to the next stop. Tap (or Space / Enter) plays the page's action;
// tap while it plays snaps to the end; tap at the end plays it again.
// Animated on twos (12 pictures/s) with a fresh surface boil each picture.
(function () {
'use strict';
const THREE = window.THREE;
const A = window.ANTHILL;

// ---- tune by eye -------------------------------------------------------------
const STEP = 1 / 12;                 // on twos
const SHADOW_DARK = 0.42, EDGE_FADE = 0.06;
const LEG_REACH = 0.07;              // how far a foot may stretch down to a sloped floor (unit ant)
// painted backdrop inside the picture (shader background branch), so the mound
// doesn't float on the page: warm sky, a hazy meadow floor, soft bokeh
const BG_RADIUS = 0.05;              // rounded corners, fraction of the short side
const BG_FEATHER = 0.035;            // soft edge width, fraction of the short side
const BG_SKY_TOP = [158, 196, 222], BG_SKY_LOW = [250, 230, 190];     // day sky, top / horizon
const BG_DUSK_TOP = [100, 92, 152], BG_DUSK_LOW = [246, 170, 124];    // dusk (last page)
const BG_MEADOW_NEAR = [176, 184, 110], BG_MEADOW_FAR = [214, 210, 150]; // ground plane
const BG_HAZE = 0.09;                // how quickly the meadow fades into the horizon haze
const BG_BOKEH = 7, BG_BOKEH_GAIN = 0.07;                             // soft light circles in the sky
const SLOW_MS = 40;                  // a picture slower than this counts as slow
const MIN_QUALITY = 0.45;            // adaptive resolution floor
const FLY_PULL = 0.6, FLY_PULL_MAX = 2.5;  // the camera backs off a little mid-flight
const { MAXA, NC } = A;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpV = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ease = t => (t = clamp(t, 0, 1), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const TIER = (() => {
  if (!THREE) return -1;
  const c = document.createElement('canvas'), gl = c.getContext('webgl2');
  if (!gl) return -1;
  const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  const touch = matchMedia('(pointer: coarse)').matches;
  if (mem <= 2 || cores <= 2) return 0;
  if (!touch && mem >= 8 && cores >= 8) return 2;
  return 1;
})();
const QUALITY = [
  { steps: 80, shadow: 12, ao: 2, dpr: 0.7 },
  { steps: 110, shadow: 20, ao: 3, dpr: 1 },
  { steps: 150, shadow: 28, ao: 4, dpr: 1.5 }
][Math.max(0, TIER)];

const v3 = a => `vec3(${(+a[0]).toFixed(4)}, ${(+a[1]).toFixed(4)}, ${(+a[2]).toFixed(4)})`;
const fl = v => (+v).toFixed(4);
const W = A.WORM;
const WD = (() => { const d = [W.b[0] - W.a[0], W.b[1] - W.a[1], 0], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l, 0]; })();
const WN = [-WD[1], WD[0], 0];
const BOX0 = [A.SLAB.x0 - 0.4, -0.02, A.SLAB.z0 - 0.2], BOX1 = [A.SLAB.x1 + 0.1, A.HILL.top + 0.6, A.SLAB.z1 + 0.35];
const pellets = A.PELLETS.map((q, i) => `
    { float k = clamp(uFall.x * 1.6 - ${fl(i * 0.25)}, 0.0, 1.0); k *= k;
      float sc = uFall[${i + 1}];
      if (sc > 0.01) U(r, sdEll(p - vec3(${fl(q.x)}, mix(${fl(q.top)}, ${fl(q.floor)}, k), ${fl(q.z)}), vec3(${fl(q.r * 1.1)}, ${fl(q.r * 0.85)}, ${fl(q.r)}) * sc), 12.0); }`).join('');

const FRAG = `
precision highp float;
#define MAXA ${MAXA}
#define NC ${NC}
uniform vec2 uRes;
uniform vec4 uAP[MAXA];            // ant: x, y, pitch, facing (mirrors x)
uniform vec4 uAQ[MAXA];            // ant: scale (0 = off), z, pale, gaster scale
uniform vec4 uLA[MAXA * NC], uLB[MAXA * NC];  // ant capsules, ant-local: A.xyz -> B.xyz, radius B.w
uniform vec4 uCrumb;               // world xyz, radius
uniform vec4 uItem[2];             // carried things: xyz, radius (0 = none)
uniform vec2 uItemM;               // their materials
uniform vec4 uBeetle, uWorm, uCocoon, uLarva, uFall;
uniform vec2 uTrail;
uniform float uSeed, uSteps, uShadowSteps, uAO, uFocal, uShadowDark, uEdge, uDusk, uT;
uniform vec3 uCam, uTgt;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCap(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
void U(inout vec2 r, float d, float m) { if (d < r.x) r = vec2(d, m); }

// materials: 1 soil, 2 pebble, 3.x ant (fraction = pale), 4 ant eye, 5 egg, 6 grass, 7 seed, 8 root,
// 9 bread crumb, 10 needle crust, 11 rubbish, 12 soil pellet, 13 scent dot, 14 blanket,
// 15 strawberry, 16 worm, 17 beetle, 18 larva, 19 cocoon
${A.glsl()}

// ---- the ants (ant-local, unit size, forward +x, up +y) ----
vec2 antLocal(vec3 q, int a, float gs) {
  float b = sdEll(q - vec3(-0.135 - (gs - 1.0) * 0.075, 0.012 + (gs - 1.0) * 0.01, 0.0),
                  vec3(0.085 * gs, 0.064 * mix(1.0, gs, 0.8), 0.06 * mix(1.0, gs, 0.8)));   // gaster
  float pt = sdEll(q - vec3(-0.048, 0.004, 0.0), vec3(0.018, 0.026, 0.016));          // petiole node
  float th = sdEll(q - vec3(0.008, 0.004, 0.0), vec3(0.05, 0.027, 0.026));            // thorax
  th = smin(th, sdEll(q - vec3(0.045, 0.014, 0.0), vec3(0.03, 0.028, 0.026)), 0.012);  // pronotum
  float hd = sdEll(q - vec3(0.105, 0.012, 0.0), vec3(0.042, 0.04, 0.036));            // head
  float d = smin(b, pt, 0.008);
  d = smin(d, th, 0.008);
  d = smin(d, hd, 0.01);
  for (int j = 0; j < NC; j++) d = smin(d, sdCap(q, uLA[a * NC + j].xyz, uLB[a * NC + j].xyz, uLB[a * NC + j].w), 0.006);
  vec3 qe = vec3(q.x, q.y, abs(q.z));
  float eye = sdEll(qe - vec3(0.113, 0.024, 0.03), vec3(0.013, 0.011, 0.01));
  vec2 r = vec2(d, 3.0);
  U(r, eye, 4.0);
  return r;
}
vec2 ants(vec3 p) {
  vec2 r = vec2(1e3, 3.0);
  for (int a = 0; a < MAXA; a++) {
    vec4 Q = uAQ[a];
    if (Q.x <= 0.0) continue;
    vec4 P = uAP[a];
    vec3 q = p - vec3(P.xy, Q.y);
    float far = length(q) - (0.27 + 0.12 * (Q.w - 1.0)) * Q.x;       // bounding sphere
    if (far > 0.05) { if (far < r.x) r = vec2(far, 3.0); continue; }
    float fx = P.w;
    q.x /= fx;
    float c = cos(P.z), s = sin(P.z);
    q.xy = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
    vec2 h = antLocal(q / Q.x, a, Q.w);
    h.x *= Q.x * min(abs(fx), 1.0);
    if (h.y < 3.5) h.y = 3.0 + Q.z * 0.45;
    if (h.x < r.x) r = h;
  }
  return r;
}

// ---- the beetle (faces -x, ~0.22 long) ----
float beetle(vec3 q) {
  float d = sdEll(q - vec3(0.025, 0.012, 0.0), vec3(0.075, 0.045, 0.058));          // wing cases
  d = smin(d, sdEll(q - vec3(-0.06, 0.008, 0.0), vec3(0.03, 0.03, 0.045)), 0.01);   // pronotum
  d = smin(d, sdEll(q - vec3(-0.095, 0.0, 0.0), vec3(0.022, 0.02, 0.028)), 0.008);  // head
  vec3 qs = vec3(q.x, q.y, abs(q.z));
  d = min(d, sdCap(qs, vec3(-0.05, -0.01, 0.03), vec3(-0.08, -0.05, 0.075), 0.007));
  d = min(d, sdCap(qs, vec3(0.0, -0.01, 0.04), vec3(0.0, -0.05, 0.085), 0.007));
  d = min(d, sdCap(qs, vec3(0.05, -0.01, 0.035), vec3(0.09, -0.05, 0.075), 0.007));
  d = min(d, sdCap(qs, vec3(-0.11, 0.005, 0.012), vec3(-0.15, 0.03, 0.04), 0.005));  // antennae
  return d;
}

vec2 map2(vec3 p) {
  vec2 r = world(p);
  // the beetle
  if (length(p - uBeetle.xyz) < 0.2) U(r, beetle(p - uBeetle.xyz), 17.0);
  // the fed larva
  if (length(p - uLarva.xyz) < 0.14) U(r, larva(p - uLarva.xyz, uLarva.w), 18.0);
  // the opening cocoon flattens to an empty husk
  if (uCocoon.w < 0.98 && length(p - uCocoon.xyz) < 0.12) {
    float o = uCocoon.w;
    vec3 c = uCocoon.xyz - vec3(0.0, 0.034 * 0.6 * o, 0.0);
    U(r, sdEll(p - c, vec3(0.072 + 0.01 * o, 0.034 * (1.0 - 0.6 * o), 0.036 + 0.006 * o)), 19.0);
  }
  // the worm, in its own tunnel
  if (uWorm.y > 0.5) {
    vec3 pa = p - ${v3(W.a)};
    float h = clamp(dot(pa, ${v3(WD)}), -0.1, ${fl(W.len + 0.1)});
    if (length(pa - ${v3(WD)} * h) < 0.14) {
      float w = 1e3;
      for (int i = 0; i < 10; i++) {
        float s = uWorm.x - float(i) * 0.042;
        if (s < 0.0 || s > ${fl(W.len)}) continue;
        vec3 c = ${v3(W.a)} + ${v3(WD)} * s + ${v3(WN)} * sin(s * 22.0 - uT * 5.0) * 0.014;
        float rr = 0.048 * (1.0 - 0.35 * abs(float(i) - 3.0) / 6.0);
        w = smin(w, length(p - c) - rr, 0.025);
      }
      U(r, w, 16.0);
    }
  }
  // soil trickling down where the worm went by
  if (uFall.x > 0.0) {${pellets}
  }
  // things carried in mandibles (eggs, husk, pellet, a crumb piece)
  if (uItem[0].w > 0.001) U(r, sdEll(p - uItem[0].xyz, vec3(1.0, 0.8, 0.9) * uItem[0].w), uItemM.x);
  if (uItem[1].w > 0.001) U(r, sdEll(p - uItem[1].xyz, vec3(1.0, 0.8, 0.9) * uItem[1].w), uItemM.y);
  // the crumb
  if (uCrumb.w > 0.0 && length(p - uCrumb.xyz) < uCrumb.w * 1.5 + 0.05) {
    vec3 c = p - uCrumb.xyz;
    float k = sdEll(c, vec3(1.15, 0.85, 1.0) * uCrumb.w) + (noise(c * 60.0) - 0.5) * 0.01;
    U(r, k, 9.0);
  }
  vec2 a = ants(p);
  if (a.x <= r.x) r = a;

  // hand-made surface: lumps, boil, drag marks, fingerprints
  if (r.x < 0.05) {
    int mi = int(floor(r.y + 0.5));
    float n = noise(p * 9.0 + uSeed) * 0.6 + noise(p * 23.0 + uSeed * 1.7) * 0.4;
    float amp = (mi == 3 || mi == 4 || mi == 17) ? 0.004 : (mi == 13 || mi == 14 ? 0.003 : 0.011);
    if (mi == 10) r.x += (noise(vec3(p.x * 60.0 + p.y * 40.0, p.y * 60.0 - p.x * 40.0, p.z * 25.0)) - 0.5) * 0.016;
    r.x += (n - 0.5) * amp;
    if (mi == 1 && p.z > ${fl(A.TZ - 0.07)}) {
      r.x += sin(p.y * 70.0 + noise(p * 3.0) * 4.0) * 0.0012 * smoothstep(0.35, 0.7, noise(p * 1.5 + 3.0));
      r.x += prints(p);
    }
  }
  return r;
}
float map(vec3 p) { return map2(p).x; }

vec3 hexc(float r, float g, float b) { return pow(vec3(r, g, b) / 255.0, vec3(2.2)); }
vec3 albedo(vec3 p, float m) {
  int mi = int(floor(m + 0.5));
  if (mi == 10) {                                            // needle-and-twig crust: streaks down the slope
    float st = noise(vec3(p.x * 70.0 + p.y * 45.0, p.y * 70.0 - p.x * 45.0, p.z * 30.0));
    vec3 col = mix(hexc(78.0, 48.0, 28.0), hexc(150.0, 100.0, 58.0), smoothstep(0.3, 0.8, st));
    return col * (0.85 + 0.3 * noise(p * 12.0));
  }
  if (mi == 1) {                                             // packed sandy soil, gently marbled
    vec3 col = mix(hexc(214.0, 178.0, 128.0), hexc(188.0, 148.0, 98.0), noise(p * 3.0 + 2.0));
    col *= 0.92 + 0.16 * noise(p * 14.0);
    float sp = step(0.86, noise(p * 46.0));
    col = mix(col, col * 1.45 + 0.03, sp * 0.6);
    col *= mix(0.82, 1.0, smoothstep(0.1, 0.24, p.z));      // tunnel walls a bit darker
    return col;
  }
  if (mi == 2) return mix(hexc(140.0, 138.0, 130.0), hexc(96.0, 98.0, 102.0), noise(p * 18.0));
  if (mi == 3) {
    float pale = clamp((m - 3.0) / 0.45, 0.0, 1.0);
    vec3 dark = mix(hexc(98.0, 36.0, 22.0), hexc(58.0, 20.0, 12.0), smoothstep(0.3, 0.7, noise(p * 30.0)));
    vec3 light = mix(hexc(238.0, 204.0, 160.0), hexc(214.0, 172.0, 124.0), noise(p * 30.0));
    return mix(dark, light, pale);
  }
  if (mi == 4) return hexc(22.0, 16.0, 14.0);
  if (mi == 5) return mix(hexc(246.0, 240.0, 222.0), hexc(230.0, 220.0, 196.0), noise(p * 40.0));
  if (mi == 6) return mix(hexc(92.0, 150.0, 60.0), hexc(60.0, 118.0, 46.0), noise(p * 12.0));
  if (mi == 7) return mix(hexc(214.0, 176.0, 104.0), hexc(184.0, 140.0, 76.0), noise(p * 25.0));
  if (mi == 8) return mix(hexc(132.0, 96.0, 64.0), hexc(100.0, 70.0, 46.0), noise(p * 30.0));   // roots: brown, not pale
  if (mi == 9) return mix(hexc(232.0, 186.0, 104.0), hexc(196.0, 140.0, 70.0), noise(p * 35.0));
  if (mi == 11) return mix(hexc(104.0, 80.0, 56.0), hexc(66.0, 52.0, 40.0), noise(p * 28.0));
  if (mi == 12) return mix(hexc(196.0, 156.0, 104.0), hexc(162.0, 124.0, 82.0), noise(p * 30.0));
  if (mi == 13) return hexc(250.0, 238.0, 176.0);
  if (mi == 14) {                                            // red and white gingham
    float a = step(0.5, fract(p.x * 7.0)), b = step(0.5, fract(p.z * 7.0));
    return mix(hexc(246.0, 238.0, 226.0), hexc(200.0, 56.0, 50.0), (a + b) * 0.5) * (0.94 + 0.1 * noise(p * 20.0));
  }
  if (mi == 15) {
    vec3 col = mix(hexc(220.0, 44.0, 50.0), hexc(176.0, 26.0, 36.0), noise(p * 14.0));
    return mix(col, hexc(246.0, 214.0, 110.0), step(0.8, noise(p * 75.0)));
  }
  if (mi == 16) return mix(hexc(206.0, 128.0, 122.0), hexc(172.0, 94.0, 94.0), 0.5 + 0.5 * sin(dot(p, ${v3(WD)}) * 160.0));
  if (mi == 17) return mix(hexc(40.0, 46.0, 66.0), hexc(26.0, 30.0, 42.0), noise(p * 30.0));
  if (mi == 18) return mix(hexc(248.0, 242.0, 226.0), hexc(232.0, 222.0, 200.0), noise(p * 40.0));
  return mix(hexc(224.0, 198.0, 152.0), hexc(200.0, 170.0, 124.0), noise(p * 34.0));   // 19 cocoon
}

vec3 normal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0012;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float shadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 40; i++) {
    if (float(i) >= uShadowSteps) break;
    float h = map(ro + rd * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.02, 0.25);
    if (res < 0.01 || t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++) {
    if (float(i) > uAO) break;
    float h = 0.035 * float(i) * float(i);
    o += (h - map(p + n * h)) * w; w *= 0.6;
  }
  return clamp(1.0 - o * 2.4, 0.0, 1.0);
}
float edgeMask() {
  vec2 e = gl_FragCoord.xy / uRes;
  vec2 m = smoothstep(vec2(0.0), vec2(uEdge), e) * smoothstep(vec2(0.0), vec2(uEdge), 1.0 - e);
  return m.x * m.y;
}
// the whole picture: a rounded rectangle with a soft edge
float bgMask() {
  float s = min(uRes.x, uRes.y);
  vec2 hs = 0.5 * uRes, rr = vec2(${fl(BG_RADIUS)} * s);
  vec2 q = abs(gl_FragCoord.xy - hs) - (hs - rr);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr.x;
  return smoothstep(0.0, ${fl(BG_FEATHER)} * s, -d);
}
vec3 rgb(vec3 c) { return pow(c / 255.0, vec3(2.2)); }
// warm painted sky behind the mound, with a low sun glow and soft bokeh
vec3 bgSky(vec3 rd, vec2 uv) {
  vec3 top = mix(rgb(${v3(BG_SKY_TOP)}), rgb(${v3(BG_DUSK_TOP)}), uDusk);
  vec3 low = mix(rgb(${v3(BG_SKY_LOW)}), rgb(${v3(BG_DUSK_LOW)}), uDusk);
  vec3 c = mix(low, top, smoothstep(-0.03, 0.5, rd.y));
  float sun = max(dot(rd, normalize(vec3(-0.6, 0.35, -0.7))), 0.0);
  c += vec3(1.0, 0.86, 0.6) * (pow(sun, 6.0) * 0.28 + pow(sun, 40.0) * 0.3);
  for (int i = 0; i < ${BG_BOKEH}; i++) {
    float fi = float(i);
    vec2 bc = vec2(hash(vec3(fi, 3.1, 7.7)) * 1.8 - 0.9, hash(vec3(fi, 5.3, 1.9)) * 0.5 + 0.02);
    float br = 0.04 + 0.07 * hash(vec3(fi, 9.4, 2.2));
    float k = smoothstep(br, br * 0.55, length(uv - bc));
    c += vec3(1.0, 0.93, 0.75) * k * ${fl(BG_BOKEH_GAIN)};
  }
  return c;
}
// the meadow floor the mound stands on: soft, out of focus, fading into haze
vec3 bgGround(vec3 p, float dist, vec3 rd, vec2 uv) {
  float n = noise(vec3(p.xz * 2.2, 0.5)) * 0.6 + noise(vec3(p.xz * 6.0, 1.5)) * 0.4;
  vec3 c = mix(rgb(${v3(BG_MEADOW_NEAR)}), rgb(${v3(BG_MEADOW_FAR)}), n);
  c *= mix(1.0, 0.72, uDusk);
  return mix(c, bgSky(vec3(rd.x, 0.0, rd.z), uv), 1.0 - exp(-dist * ${fl(BG_HAZE)}));
}
vec2 boxHit(vec3 ro, vec3 rd) {
  vec3 s = vec3(abs(rd.x) < 1e-5 ? 1e-5 : rd.x, abs(rd.y) < 1e-5 ? 1e-5 : rd.y, abs(rd.z) < 1e-5 ? 1e-5 : rd.z);
  vec3 t0 = (${v3(BOX0)} - ro) / s, t1 = (${v3(BOX1)} - ro) / s;
  vec3 a = min(t0, t1), b = max(t0, t1);
  return vec2(max(max(a.x, a.y), a.z), min(min(b.x, b.y), b.z));
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCam, fw = normalize(uTgt - uCam), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 rd = normalize(fw * uFocal + uv.x * rt + uv.y * up);
  vec3 L = normalize(vec3(-0.55, 0.85, 0.6));
  float tG = rd.y < 0.0 ? -ro.y / rd.y : 1e4;
  float hit = -1.0;
  vec2 bx = boxHit(ro, rd);
  if (bx.y > max(bx.x, 0.0)) {
    float t = max(bx.x, 0.0);
    for (int i = 0; i < 200; i++) {
      if (float(i) >= uSteps) break;
      float d = map(ro + rd * t);
      if (d < 0.0006 * t + 0.0002) { hit = t; break; }
      t += d * 0.85;
      if (t > bx.y || t > tG) break;
    }
  }
  vec3 key = mix(vec3(1.0, 0.92, 0.80) * 1.45, vec3(1.0, 0.6, 0.38) * 1.05, uDusk);
  vec3 sky = mix(vec3(0.72, 0.80, 0.95) * 0.42, vec3(0.45, 0.42, 0.72) * 0.4, uDusk);
  vec3 bounce = mix(vec3(0.95, 0.82, 0.66) * 0.30, vec3(0.8, 0.55, 0.45) * 0.22, uDusk);
  if (hit > 0.0 && hit < tG) {
    vec3 p = ro + rd * hit;
    float m = map2(p).y;
    int mi = int(floor(m + 0.5));
    vec3 n = normal(p);
    float sh = shadow(p + n * 0.01, L);
    float oc = ao(p, n);
    vec3 alb = albedo(p, m);
    float dif = clamp((dot(n, L) + 0.45) / 1.45, 0.0, 1.0);
    vec3 col = alb * (key * dif * mix(0.32, 1.0, sh) + sky * (0.55 + 0.45 * n.y) * oc + bounce * clamp(0.5 - 0.5 * n.y, 0.0, 1.0) * oc);
    col += alb * alb * (1.0 - dif) * 0.28 * oc;                          // waxy wrap
    vec3 hv = normalize(L - rd);
    float gloss = mi == 3 ? 0.16 : mi == 4 ? 0.45 : mi == 17 ? 0.35 : mi == 15 ? 0.25 : (mi == 5 || mi == 18) ? 0.12 : 0.07;
    float pw = (mi == 4 || mi == 17) ? 60.0 : 18.0;
    col += pow(clamp(dot(n, hv), 0.0, 1.0), pw) * gloss * sh * vec3(1.0, 0.95, 0.88);
    col += pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0) * 0.05 * sky;
    if (mi == 13) col += vec3(1.0, 0.85, 0.45) * 0.35 * uTrail.y * (1.0 - smoothstep(uTrail.x - 0.02, uTrail.x + 0.25, p.x));
    gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)), bgMask());
  } else if (tG < 1e3) {
    vec3 p = ro + rd * tG;
    vec2 qd = abs(p.xz - vec2(${fl((A.SLAB.x0 + A.SLAB.x1) / 2)}, ${fl((A.SLAB.z0 + A.SLAB.z1) / 2)})) - vec2(${fl((A.SLAB.x1 - A.SLAB.x0) / 2)}, ${fl((A.SLAB.z1 - A.SLAB.z0) / 2)});
    float near = 1.0 - smoothstep(0.0, 0.8, length(max(qd, 0.0)));
    float dark = 0.0;
    if (near > 0.0) {
      float sh = shadow(p + vec3(0, 0.002, 0), L);
      float oc = ao(p, vec3(0, 1, 0));
      dark = clamp((1.0 - sh) * 0.75 + (1.0 - oc) * 0.9, 0.0, 1.0) * near * uShadowDark;
    }
    // contact shadow darkens the painted meadow floor
    vec3 gc = bgGround(p, tG, rd, uv) * (1.0 - dark * 1.4);
    gl_FragColor = vec4(pow(clamp(gc, 0.0, 1.0), vec3(1.0 / 2.2)), bgMask());
  } else {
    gl_FragColor = vec4(pow(clamp(bgSky(rd, uv), 0.0, 1.0), vec3(1.0 / 2.2)), bgMask());
  }
}`;

// ---- ant pose (CPU): legs, antennae, mandibles into the capsule arrays ----------------
const HIPS = [0.035, 0.01, -0.015], FEET = [0.12, 0.015, -0.11];
function pose(a, base, LA, LB, clock) {
  let k = base;
  const cap = (p, q, r) => { LA[k].set(p[0], p[1], p[2], 0); LB[k].set(q[0], q[1], q[2], r); k++; };
  const amp = a.amp, st = A.STRIDE;
  // the floor in ant-local space: sloped by what's left after the body's pitch,
  // and further down by the lift that keeps the body clear of it (world.js at())
  const res = a.res || 0, lift = a.lift || 0;
  const floorY = x => clamp(-0.064 + x * res - lift, -0.064 - LEG_REACH, -0.064 + 0.03);
  for (let side = -1; side <= 1; side += 2) {
    for (let j = 0; j < 3; j++) {
      const groupA = (j === 1) === (side > 0);                       // tripod gait
      const ph = a.phase + (groupA ? 0 : Math.PI);
      const hip = [HIPS[j], -0.014, side * 0.02];
      const fx = FEET[j] - Math.sin(ph) * st * 0.5 * amp;
      const foot = [fx, floorY(fx) + Math.max(0, Math.cos(ph)) * 0.025 * amp, side * 0.1];
      const knee = [lerp(hip[0], foot[0], 0.45) + (j === 2 ? -0.02 : 0.01), 0.032, side * 0.075];
      cap(hip, knee, 0.011);
      cap(knee, foot, 0.0085);
    }
  }
  const tt = clock + a.seed * 3.7;
  for (let side = -1; side <= 1; side += 2) {
    const tw = Math.sin(tt * 3.1 + side * 1.7) * 0.012 + Math.sin(tt * 7.3 + side) * 0.006 + a.wave * Math.sin(tt * 14 + side) * 0.022;
    const sn = a.sniff;
    const b0 = [0.125, 0.034, side * 0.018];
    const elbow = [0.15, lerp(0.094 + tw * 0.3, 0.07, sn), side * 0.045];
    const tip = [lerp(0.215, 0.2, sn), lerp(0.068 + tw, -0.035 + tw * 0.3, sn), side * 0.062];
    cap(b0, elbow, 0.0075);
    cap(elbow, tip, 0.0068);
  }
  for (let side = -1; side <= 1; side += 2) cap([0.13, -0.008, side * 0.018], [0.164, -0.02, side * 0.006], 0.009);
}

// ---- renderer -----------------------------------------------------------------------
let renderer = null, uniforms = null, quad = null, ortho = null, active = null;
let cam = null, fly = null, lastPage = -1, clock = 0;
const arr = n => Array.from({ length: n }, () => new THREE.Vector4());
function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  const V4 = () => ({ value: new THREE.Vector4() });
  uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uAP: { value: arr(MAXA) }, uAQ: { value: arr(MAXA) },
    uLA: { value: arr(MAXA * NC) }, uLB: { value: arr(MAXA * NC) },
    uCrumb: V4(), uItem: { value: arr(2) }, uItemM: { value: new THREE.Vector2(5, 5) },
    uBeetle: V4(), uWorm: V4(), uCocoon: V4(), uLarva: V4(), uFall: V4(),
    uTrail: { value: new THREE.Vector2() },
    uSeed: { value: 0 }, uSteps: { value: QUALITY.steps }, uShadowSteps: { value: QUALITY.shadow }, uAO: { value: QUALITY.ao },
    uFocal: { value: 1 }, uShadowDark: { value: SHADOW_DARK }, uEdge: { value: EDGE_FADE }, uDusk: { value: 0 }, uT: { value: 0 },
    uCam: { value: new THREE.Vector3() }, uTgt: { value: new THREE.Vector3() }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fragmentShader: FRAG,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    depthTest: false, depthWrite: false, toneMapped: false, blending: THREE.NoBlending
  });
  quad = new THREE.Scene();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false; quad.add(m);
  ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}

const camOf = st => ({ pos: st.pos.slice(), tgt: st.tgt.slice(), fov: st.fov, dusk: st.dusk });
function cameraNow() {
  if (!fly) return cam;
  const e = ease(fly.u), a = fly.from, b = fly.to;
  const pos = lerpV(a.pos, b.pos, e), tgt = lerpV(a.tgt, b.tgt, e);
  const dist = Math.hypot(b.tgt[0] - a.tgt[0], b.tgt[1] - a.tgt[1]);
  pos[2] += Math.sin(Math.PI * e) * Math.min(dist * FLY_PULL, FLY_PULL_MAX);
  return { pos, tgt, fov: lerp(a.fov, b.fov, e), dusk: lerp(a.dusk, b.dusk, e) };
}

// one picture (on twos)
function tick(s) {
  if (s.state === 'run') {
    s.t += STEP;
    if (s.t >= A.PAGES[s.page].dur) { s.t = A.PAGES[s.page].dur; s.state = 'done'; }
  }
  if (fly) {
    fly.u += STEP / A.FLY_TIME;
    if (fly.u >= 1) { cam = camOf(fly.to); fly = null; }
  }
}

function draw(s) {
  const c = s.svg.parentNode;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * QUALITY.dpr * (s.quality || 1));
  renderer.setSize(c.clientWidth || 300, c.clientHeight || 300, false);
  uniforms.uRes.value.copy(renderer.getDrawingBufferSize(new THREE.Vector2()));
  const fr = A.frame(s.page, s.t, clock);
  const U = uniforms;
  for (let i = 0; i < MAXA; i++) {
    const a = fr.ants[i];
    if (!a) { U.uAQ.value[i].set(0, 0, 0, 1); continue; }
    pose(a, i * NC, U.uLA.value, U.uLB.value, clock);
    U.uAP.value[i].set(a.x, a.y, a.pitch, A.fxOf(a.face));
    U.uAQ.value[i].set(a.scale, a.z, a.pale, a.gs);
  }
  U.uCrumb.value.set(fr.crumb[0], fr.crumb[1], fr.crumb[2], fr.crumb[3]);
  for (let i = 0; i < 2; i++) {
    const it = fr.items[i];
    if (it && it.r > 0) U.uItem.value[i].set(it.p[0], it.p[1], it.p[2], it.r); else U.uItem.value[i].set(0, -9, 0, 0);
    if (it) U.uItemM.value.setComponent(i, it.m);
  }
  U.uBeetle.value.set(fr.beetle[0], fr.beetle[1], fr.beetle[2], 1);
  U.uWorm.value.set(fr.worm, fr.worm >= 0 ? 1 : 0, 0, 0);
  U.uCocoon.value.set(A.COCOON[0], A.COCOON[1], A.COCOON[2], fr.cocoon);
  U.uLarva.value.set(A.LARVA[0], A.LARVA[1], A.LARVA[2], fr.larva);
  U.uFall.value.set(fr.fall[0], fr.fall[1], fr.fall[2], fr.fall[3]);
  U.uTrail.value.set(fr.trail[0], fr.trail[1]);
  const cv = cameraNow();
  const sh = fr.shake ? [Math.sin(clock * 61) * fr.shake, Math.cos(clock * 47) * fr.shake, 0] : [0, 0, 0];
  U.uCam.value.set(cv.pos[0] + sh[0], cv.pos[1] + sh[1], cv.pos[2]);
  U.uTgt.value.set(cv.tgt[0] + sh[0] * 0.6, cv.tgt[1] + sh[1] * 0.6, cv.tgt[2]);
  U.uFocal.value = 0.5 / Math.tan(cv.fov * Math.PI / 360);
  U.uDusk.value = cv.dusk;
  U.uT.value = clock % 1000;
  U.uSeed.value = (s.frame % 997) * 0.37;
  renderer.render(quad, ortho);
}

function mount(svg) {
  if (TIER < 0) return;
  if (!renderer) setup();
  const page = clamp(parseInt(svg.getAttribute('data-anthill'), 10) || 0, 0, A.count - 1);
  const layer = svg.parentNode;
  if (getComputedStyle(layer).position === 'static') layer.style.position = 'relative';
  layer.appendChild(renderer.domElement);
  const pages = window.BOOK_PAGES || [];
  renderer.domElement.setAttribute('aria-label', 'Clay picture: ' + ((pages[page] && pages[page].body) || 'a cutaway anthill.'));
  const target = A.STOPS[page];
  if (!cam) cam = camOf(target);
  else if (page !== lastPage) { fly = { from: cameraNow(), to: camOf(target), u: 0 }; }
  lastPage = page;
  active = { svg, page, t: 0, state: 'idle', frame: 0, quality: active ? active.quality : 1, acc: 0 };
  draw(active);
}

let last = performance.now(), slow = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const s = active;
  if (!s || document.hidden) return;
  if (!s.svg.isConnected) { active = null; return; }
  s.acc += dt;
  let ticked = false;
  while (s.acc >= STEP) { s.acc -= STEP; s.frame++; clock += STEP; tick(s); ticked = true; }
  if (ticked) {
    const t0 = performance.now();
    draw(s);
    slow = performance.now() - t0 > SLOW_MS ? slow + 1 : Math.max(0, slow - 0.5);
    if (slow > 6 && s.quality > MIN_QUALITY) { s.quality *= 0.8; slow = 0; }
  }
}
if (TIER >= 0) requestAnimationFrame(loop);

new MutationObserver(() => {
  // the shown picture, not the next page's copy parked by the prerender
  const svg = [...document.querySelectorAll('.obj-host .layer > svg[data-anthill]')].find(x => !x.closest('.obj-prerender'));
  if (svg && (!active || active.svg !== svg)) mount(svg);
}).observe(document.documentElement, { childList: true, subtree: true });

function hostOf(t) {
  const h = t && t.closest ? t.closest('.obj-host') : null;
  return h && !h.closest('.obj-prerender') && h.querySelector('svg[data-anthill]') ? h : null;
}
function act() {
  const s = active;
  if (!s) return;
  if (s.state === 'idle') s.state = 'run';
  else if (s.state === 'run') { s.t = A.PAGES[s.page].dur; s.state = 'done'; }
  else { s.t = 0; s.state = 'run'; }
}
window.addEventListener('picture-activate', e => { if (hostOf(e.target)) act(); });
window.addEventListener('pointerdown', e => { if (hostOf(e.target)) act(); }, true);
window.addEventListener('pagehide', () => { if (renderer) { try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* leaving */ } } });

// ---- without WebGL2: a flat drawing of the same place --------------------------------
function fallbackArt(page) {
  const st = A.STOPS[page], wide = page === A.count - 1;
  const vw = wide ? 8.2 : 1.7, cx = st.tgt[0], cy = st.tgt[1] + (wide ? 0.1 : 0);
  const k = 300 / vw, X = x => ((x - cx + vw / 2) * k).toFixed(1), Y = y => ((cy + vw / 2 - y) * k).toFixed(1);
  let ground = `M${X(A.SLAB.x0)} ${Y(0)}`;
  for (let x = A.SLAB.x0; x <= A.SLAB.x1 + 1e-6; x += 0.05) ground += ` L${X(x)} ${Y(A.surfY(x))}`;
  ground += ` L${X(A.SLAB.x1)} ${Y(0)} Z`;
  const tunnels = A.TUNNELS.map(([a, b, r]) => `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke-width="${(r * 1.7 * k).toFixed(1)}"/>`).join('');
  const rooms = Object.values(A.ROOMS).map(r => `<ellipse cx="${X(r.x)}" cy="${Y(r.y)}" rx="${(r.rx * k).toFixed(1)}" ry="${(r.ry * k).toFixed(1)}"/>`).join('');
  const fr = A.frame(page, 0, 0), m = fr.ants[0];
  const sz = (0.18 * k).toFixed(1), dir = m.face >= 0 ? 1 : -1;
  const mila = `<g transform="translate(${X(m.x)} ${Y(m.y)}) scale(${dir} 1)"><ellipse cx="${-0.6 * sz}" cy="0" rx="${0.5 * sz}" ry="${0.36 * sz}" fill="#5a2216"/><ellipse cx="0" cy="0" rx="${0.32 * sz}" ry="${0.2 * sz}" fill="#6e2a1a"/><circle cx="${0.55 * sz}" cy="${-0.05 * sz}" r="${0.24 * sz}" fill="#5a2216"/></g>`;
  const crumb = `<circle cx="${X(fr.crumb[0])}" cy="${Y(fr.crumb[1])}" r="${(fr.crumb[3] * k).toFixed(1)}" fill="#e0b46a" stroke="#b07c3c" stroke-width="1.5"/>`;
  return `<path d="${ground}" fill="#d2b07c" stroke="#7a5030" stroke-width="${(0.06 * k).toFixed(1)}" stroke-linejoin="round"/>
    <g stroke="#9c7648" stroke-linecap="round" fill="#9c7648">${tunnels}${rooms}</g>${crumb}${mila}`;
}

window.buildAnthill = function (page) {
  const head = `<svg data-anthill="${page}" viewBox="0 0 300 300" data-fit="0 0 300 300" data-hit="20 20 260 260" xmlns="http://www.w3.org/2000/svg">`;
  if (TIER >= 0) return head + '<rect width="300" height="300" fill="none"/></svg>';
  return head + '<defs><clipPath id="ahClip' + page + '"><rect x="6" y="6" width="288" height="288" rx="18"/></clipPath></defs>' +
    '<g clip-path="url(#ahClip' + page + ')">' + fallbackArt(page) + '</g></svg>';
};
})();
