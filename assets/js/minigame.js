// SHARED minigame + branching kit for interactive books (no storybook.js
// edits: like webgl-stage.js it works with capture-phase listeners and
// replayed arrow keys). Load AFTER storybook.js and BEFORE webgl-stage.js
// (its capture listeners must run first), boot.js last.
//
// Page fields it reads from window.BOOK_PAGES (the engine ignores them):
//   id        string, unique (default 'p<index>')
//   task      (seed, ctx) => spec   a puzzle on this page; the forward inputs
//             are locked (next arrow dimmed) until it is solved.
//             ctx = { rng, level (0..1 through the book), flags, solved }
//   choice    { prompt, options: [{ key, html, to: pageId | flags => pageId,
//             sets: {flag: v} }] }  a branch: forward is locked until a pick;
//             the pick jumps to `to`. flags() also holds { [choicePageId]: key }.
//   title / body may be getters that read MINIGAME.flags() (branch-dependent
//             text); such books should set BOOK_PRERENDER = false.
//   next      pageId | flags => pageId   where forward goes (branching books)
//   ending    'key'   an ending page: shows "Endings found n / N" + Start over
//
// The panel is appended under the page's text (.obj-slot.is-text
// .text-block), so it sits on the text page (or in the caption on pop-up /
// WebGL pages). Answers are picked, never typed; feedback is visual only, no
// timers, no sounds: a wrong pick wobbles; after 3 misses a soft hint shows.
// ↻ gives the page a new seed (new numbers). Progress lives in localStorage
// under 'minigame:<bookId>': { solved, seeds, choices, path, endings };
// "Start over" (cover / endings) clears the run but keeps the endings.
//
// Branching mode (any page has `choice` or `next`): every turn input is
// taken over. Forward follows the page's choice / next; back follows the
// saved path, so going back never erases a choice (the earlier pick shows
// highlighted). Picking the other option rewrites the story from that page:
// later path entries and later choices (and their flags) are dropped.
// The page counter shows the position in the run (window.BOOK_RUN_LENGTH).
//
// Task kinds (spec.kind) — every spec may add `prompt`, `art` (svg/html
// shown above the controls) and `hint` (text shown after 3 misses):
//   tap     solved by tapping the picture (or Space / Enter)
//   choice  { options: [{ html, ok }], cols }
//   pick    { items: [{ html, value }], target, count?, answer?: [indices] }
//           select items until their values add up to target (exactly
//           `count` items if given)
//   order   { items: [{ html, x?, y? }], order: [indices], free?, lines?,
//             aspect? }  tap the items in that order (x, y in % for free
//           layouts like dot-to-dot; `lines` joins the done items)
//   drag    { pieces: [{ html, key }], slots: [{ html, key, multi? }] }
//           drag (or tap, then tap the slot) every piece onto its slot
//   cells   { cols, rows, given: ['c,r'], target: ['c,r'], color }
//           tap the cells that complete the picture (e.g. its mirror half)
//   maze    { cols, rows, seed, start?, goal?, startSvg?, goalSvg?, color }
//           trace a path with the finger from start to goal
//   push    { map: ['#####', '#@$.#', ...] }  push the crates onto the marks
//           (# wall, . mark, $ crate, * crate on mark, @ you, + you on mark)
//
// Events on window: 'minigame-mounted' { id, index, solved } after a panel
// mounts, 'minigame-solved' { id, index, picked?, pickedIndex? } when a task
// is first solved (pick tasks add the values / item indices the child chose).
// API: window.MINIGAME = { isSolved(id), picked(id), flags(), current(), state(), rng }
(function () {
'use strict';
const PAGES = () => window.BOOK_PAGES || [];
const bookId = window.MINIGAME_BOOK || ((location.pathname.match(/books\/([^/]+)\//) || [])[1]) || 'book';
const KEY = 'minigame:' + bookId;
const HINT_AFTER = 3;

// ---- seeded random --------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }

// ---- state ------------------------------------------------------------------------
let S = null;
// pageId -> { values, index } the child picked (pick tasks), saved with S
const P_ = () => (S.picks || (S.picks = {}));
function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; }
  S = Object.assign({ seeds: {}, choices: {}, path: [], endings: [], solved: {} }, raw || {});
  if (!S.solved || typeof S.solved !== 'object') S.solved = {};
}
// solved puzzles are saved too; ↻ (a new puzzle) removes the page's entry
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
}
load();

const pageId = i => (PAGES()[i] && PAGES()[i].id) || ('p' + i);
const indexOf = id => { const P = PAGES(); for (let i = 0; i < P.length; i++) if (pageId(i) === id) return i; return -1; };
const branching = () => PAGES().some(p => p.choice || p.next);
function flags() {
  const f = {};
  for (const pid of Object.keys(S.choices)) {
    const p = PAGES()[indexOf(pid)], key = S.choices[pid];
    const o = p && p.choice && p.choice.options.find(x => x.key === key);
    f[pid] = key;
    if (o && o.sets) Object.assign(f, o.sets);
  }
  return f;
}
function locked(i) {
  const p = PAGES()[i];
  if (!p) return false;
  const id = pageId(i);
  // always a real boolean: classList.toggle(x, undefined) is a plain toggle,
  // which made Next flicker on every re-check of a solved page
  return !!((p.task && !S.solved[id]) || (p.choice && !S.choices[id]));
}

// ---- where are we ---------------------------------------------------------------------
let cur = 0, pos = 0;              // branching: kit-tracked page index / position in S.path
function statusIndex() {
  const s = document.querySelector('.page-status');
  const n = s ? parseInt(s.textContent, 10) : NaN;
  return n > 0 ? n - 1 : 0;
}
const curIndex = () => (branching() ? cur : statusIndex());
// the page whose puzzle is on screen: the lock follows the panel the child
// sees (solve it and Next opens), falling back to the engine's page
// One source only: the engine's current page. (Mixing in the mounted panel's
// index made the lock flip between two answers while a picture animation ran,
// so Next flickered. A panel mounted for the wrong page is fixed by settle().)
const here = () => curIndex();

// ---- moving the engine: replayed arrow keys -----------------------------------------------
let relay = false;
function jump(target) {
  const from = curIndex(), delta = target - from;
  relay = true;
  for (let k = 0; k < Math.abs(delta); k++) window.dispatchEvent(new KeyboardEvent('keydown', { key: delta > 0 ? 'ArrowRight' : 'ArrowLeft', bubbles: true }));
  relay = false;
  cur = target;
  counter();
  updateLocks();
  settle();
}
// the engine re-sets its own button states during and after a flip: check
// ours again once the turn has landed
let settleT = 0;
function settle() {
  clearTimeout(settleT);
  settleT = setTimeout(() => {
    // a panel mounted for another page than the one now shown would leave the
    // shown page locked after "solving": mount the right one
    const tb = currentTextBlock();
    if (tb && !tb.__mgStale && tb.__mgIndex != null && tb.__mgIndex !== curIndex()) remount();
    counter(); updateLocks(); fit();
  }, 900);
}
function nextOf(i) {
  const p = PAGES()[i], id = pageId(i);
  if (!p) return -1;
  if (p.ending) return -1;
  if (p.choice) {
    const o = p.choice.options.find(x => x.key === S.choices[id]);
    return o ? indexOf(typeof o.to === 'function' ? o.to(flags()) : o.to) : -1;
  }
  if (p.next) return indexOf(typeof p.next === 'function' ? p.next(flags()) : p.next);
  return i + 1 < PAGES().length ? i + 1 : -1;
}
function ensurePath() {
  if (!S.path.length || S.path[0] !== pageId(0)) { S.path = [pageId(0)]; save(); }
}
function forward() {
  const i = cur;
  if (locked(i)) { nudge(); return; }
  const t = nextOf(i);
  if (t < 0) { nudge(); return; }
  const tid = pageId(t);
  if (S.path[pos + 1] !== tid) S.path = S.path.slice(0, pos + 1).concat(tid);
  pos++;
  save();
  jump(t);
}
function back() {
  if (pos <= 0) { nudge(); return; }
  pos--;
  jump(indexOf(S.path[pos]));
}
function toFirst() { pos = 0; jump(0); }
function toLast() { pos = S.path.length - 1; jump(indexOf(S.path[pos])); }
function choose(pid, key) {
  if (S.choices[pid] !== key) {
    // the other option rewrites the story from here: drop what came after
    const later = S.path.slice(pos + 1);
    for (const q of later) delete S.choices[q];
    S.path = S.path.slice(0, pos + 1);
    S.choices[pid] = key;
    save();
  }
  forward();
}
// ↺ in the corner: forget everything for this book (puzzles, choices, path,
// endings found) and start again from the cover
function resetAll() {
  if (!window.confirm('Start the whole game again? Solved puzzles, choices and endings found will be cleared.')) return;
  try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
  location.reload();
}
document.addEventListener('DOMContentLoaded', () => {
  const b = el('button', 'mg-reset-all', '\u21ba');
  b.type = 'button';
  b.setAttribute('aria-label', 'Start the whole game again');
  b.title = 'Start the whole game again';
  b.addEventListener('click', e => { e.stopPropagation(); resetAll(); });
  ['pointerdown', 'pointerup'].forEach(t => b.addEventListener(t, e => e.stopPropagation()));
  document.body.appendChild(b);
});
function startOver() {
  S.solved = {}; S.seeds = {}; S.picks = {}; S.choices = {}; S.path = [pageId(0)];
  seedAll();
  save();
  pos = 0;
  if (curIndex() !== 0) jump(0);
  remount();
}

// ---- page counter (branching: position in the run) and the locked arrows --------------------
function counter() {
  if (!branching()) return;
  const s = document.querySelector('.page-status');
  if (!s) return;
  const txt = `${pos + 1} / ${Math.max(window.BOOK_RUN_LENGTH || PAGES().length, S.path.length, pos + 1)}`;
  if (s.textContent !== txt) s.textContent = txt;
  const first = document.querySelector('.page-btn.first'), prev = document.querySelector('.page-btn.prev');
  const atStart = pos === 0;
  [first, prev].forEach(b => b && b.classList.toggle('is-disabled', atStart));
  const end = nextOf(cur) < 0 && !locked(cur);
  const nx = document.querySelector('.page-btn.next'), last = document.querySelector('.page-btn.last');
  if (nx) nx.classList.toggle('is-disabled', end);
  if (last) last.classList.toggle('is-disabled', pos >= S.path.length - 1);
}
// every puzzle in the book solved (and every choice made, outside branching)
function allSolved() {
  const P = PAGES();
  for (let i = 0; i < P.length; i++) {
    if (P[i].task && !S.solved[pageId(i)]) return false;
    if (!branching() && P[i].choice && !S.choices[pageId(i)]) return false;
  }
  return true;
}
// Next: open as soon as this page is solved. Last (»): open only when the
// whole book is solved. Re-applied on every pointer move and on a slow tick
// as well, so nothing else (a re-render, a hover) can leave a stale look.
function updateLocks() {
  const next = locked(here()), last = !branching() && !allSolved() || next;
  const set = (b, lock) => {
    if (b.classList.contains('mg-locked') !== lock) b.classList.toggle('mg-locked', lock);
    const a = lock ? 'true' : 'false';
    if (b.getAttribute('aria-disabled') !== a) b.setAttribute('aria-disabled', a);
  };
  document.querySelectorAll('.page-btn.next').forEach(b => set(b, next));
  document.querySelectorAll('.page-btn.last').forEach(b => set(b, last));
}
let lockRaf = 0;
window.addEventListener('pointermove', () => {
  if (lockRaf) return;
  lockRaf = requestAnimationFrame(() => { lockRaf = 0; updateLocks(); });
}, { passive: true });
setInterval(updateLocks, 500);
function nudge() {
  const p = document.querySelector('.mg-panel');
  if (p) { p.classList.remove('mg-nudge'); void p.offsetWidth; p.classList.add('mg-nudge'); }
  const nx = document.querySelector('.page-btn.next');
  if (nx) { nx.classList.remove('mg-nudge-btn'); void nx.offsetWidth; nx.classList.add('mg-nudge-btn'); }
}

// ---- input interception (capture phase, before the engine and webgl-stage) ------------------------
const FWD = new Set(['ArrowRight', 'ArrowDown', 'PageDown']);
const BACK = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']);
const eat = e => { e.preventDefault(); e.stopImmediatePropagation(); };
const inPanel = t => !!(t && t.closest && t.closest('.mg-panel'));
const onChrome = t => !!(t && t.closest && t.closest('.page-nav, .music-btn, .library-btn'));
window.addEventListener('keydown', e => {
  if (relay) return;
  const typing = e.target && e.target.closest && e.target.closest('input, textarea, select');
  if (typing) return;
  // Space / Enter on an unsolved tap task: solve it here and play the picture.
  // (webgl-stage.js would otherwise turn Space into a forward step, which the
  // lock then refuses: Space could never wake One in Number Cube Land.)
  if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && live && live.spec && live.spec.kind === 'tap' && !S.solved[live.id]) {
    if (e.target && e.target.closest && e.target.closest('button, a')) return;
    eat(e);
    if (e.repeat) return;
    tappedPicture();
    document.querySelectorAll('.obj-overlay .obj-slot .obj-host').forEach(h => { if (h.__obj && typeof h.__obj.play === 'function') h.__obj.play(); });
    return;
  }
  const dir = FWD.has(e.key) ? 1 : BACK.has(e.key) ? -1 : 0;
  if (!dir) return;
  if (e.key === 'Backspace' && e.target && e.target.closest && e.target.closest('button, a')) return;
  if (branching()) { eat(e); if (e.repeat) return; if (dir > 0) forward(); else back(); return; }
  if (dir > 0 && locked(here())) { eat(e); nudge(); }
}, true);
window.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.page-btn');
  if (!b) return;
  const k = ['next', 'last', 'prev', 'first'].find(c => b.classList.contains(c));
  if (!k) return;
  if (branching()) {
    eat(e);
    ({ next: forward, last: toLast, prev: back, first: toFirst })[k]();
    return;
  }
  if (k === 'next' && locked(here())) { eat(e); nudge(); }
  else if (k === 'last' && !allSolved()) { eat(e); nudge(); }   // » opens only when every puzzle is solved
}, true);
let down = null;
const API = { pointerInPanel: false };
window.addEventListener('pointerdown', e => {
  down = { x: e.clientX, y: e.clientY, panel: inPanel(e.target), chrome: onChrome(e.target) };
  API.pointerInPanel = down.panel;
  // a drag inside a puzzle (tracing the maze, dragging a piece) is not a
  // pull-to-refresh: storybook.js drops its pull on a window pointercancel
  // (storybook.js wires its pull listeners AFTER this file loads, so they run
  // after ours on this same event: cancel on the pointer's moves instead)
  if (down.panel) down.cancelPull = { pointerId: e.pointerId, pointerType: e.pointerType };
}, true);
window.addEventListener('pointermove', e => {
  if (!down || !down.cancelPull) return;
  window.dispatchEvent(new PointerEvent('pointercancel', down.cancelPull));
}, true);
window.addEventListener('pointerup', e => {
  const d = down; down = null;
  setTimeout(() => { API.pointerInPanel = false; }, 0);
  if (!d || d.panel || d.chrome || onChrome(e.target)) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  const tap = Math.hypot(dx, dy) < 10;
  let dir = 0;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 60) dir = dx < 0 ? 1 : -1;
  else if (tap) {
    const host = e.target.closest && e.target.closest('.obj-slot .obj-host');
    if (host) { tappedPicture(e); return; }          // a tap on the picture plays it (and may solve a tap task)
    const curl = e.target.closest && e.target.closest('.page-curl');
    dir = curl ? (curl.dataset.dir === '1' ? 1 : -1) : (e.clientX >= innerWidth / 2 ? 1 : -1);
  }
  if (!dir) return;
  if (branching()) { eat(e); if (dir > 0) forward(); else back(); return; }
  if (dir > 0 && locked(here())) { eat(e); nudge(); }
}, true);
window.addEventListener('picture-activate', () => tappedPicture(), true);

// ---- panel -------------------------------------------------------------------------------------
let live = null;                         // { id, index, spec, api }
// spec.hit = [x, y, w, h] in the picture's viewBox units: only a tap inside
// it solves the task (Space / Enter, which have no position, always do)
function tappedPicture(e) {
  if (!live || !live.spec || live.spec.kind !== 'tap') return;
  const hit = live.spec.hit;
  if (hit && e && e.clientX != null) {
    const svg = document.querySelector('.obj-slot .obj-host .layer svg');
    const vb = svg && (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (svg && vb && vb.length === 4) {
      const r = svg.getBoundingClientRect();
      // the svg keeps its aspect ratio inside the layer box (xMidYMid meet)
      const k = Math.min(r.width / vb[2], r.height / vb[3]);
      const ox = r.left + (r.width - vb[2] * k) / 2, oy = r.top + (r.height - vb[3] * k) / 2;
      const x = vb[0] + (e.clientX - ox) / k, y = vb[1] + (e.clientY - oy) / k;
      if (x < hit[0] || y < hit[1] || x > hit[0] + hit[2] || y > hit[1] + hit[3]) { live.api.miss(); return; }
    }
  }
  live.api.solve();
}
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
function isolate(panel) {
  // the engine listens on window (bubble): stop panel input reaching it
  ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(t => panel.addEventListener(t, e => e.stopPropagation()));
}
function hasProgress() { return Object.keys(S.solved).length > 0 || Object.keys(S.choices).length > 0; }

// take the shown panel away: the one in the text block and, for caption
// books, the page-fitted wrapper it was moved into (else an empty wrapper
// would stay behind and push the next panel down: ↻ moved the puzzle)
function unmountPanel(tb) {
  if (tb) tb.querySelectorAll('.mg-panel').forEach(n => n.remove());
  document.querySelectorAll('.mg-fit, .mg-dock .mg-panel').forEach(n => n.remove());
  fitPanel = null;
}
function mount(tb, i) {
  const p = PAGES()[i], id = pageId(i);
  unmountPanel(null);
  live = null;
  if (!p) return;
  const panel = el('div', 'mg-panel');
  isolate(panel);
  const has = !!(p.choice || p.task || p.ending || (i === 0 && hasProgress()));
  layout(has);
  if (!has) return;
  const host = dockFor(tb);
  if (p.choice) renderChoice(panel, p, id);
  else if (p.task) renderTask(panel, p, id, i);
  else if (p.ending) renderEnding(panel, p);
  else renderStartOver(panel);
  host.appendChild(panel);
  window.dispatchEvent(new CustomEvent('minigame-mounted', { detail: { id, index: i, solved: !!S.solved[id] } }));
}
function remount() {
  const tb = currentTextBlock();
  if (!tb) return;
  unmountPanel(tb);
  tb.__mgIndex = curIndex();
  mount(tb, tb.__mgIndex);
  caption(tb);
  updateLocks();
}
const currentTextBlock = () => document.querySelector('.obj-overlay .obj-slot.is-text .text-block');

function renderStartOver(panel) {
  const b = el('button', 'mg-btn mg-wide', 'Start over');
  b.type = 'button';
  b.addEventListener('click', startOver);
  panel.appendChild(b);
}
function renderEnding(panel, p) {
  if (!S.endings.includes(p.ending)) { S.endings.push(p.ending); save(); }
  const total = window.BOOK_ENDINGS_TOTAL || PAGES().filter(x => x.ending).length;
  // drop endings saved by an older version of the book (renamed / removed)
  const valid = new Set(PAGES().filter(x => x.ending).map(x => x.ending));
  if (S.endings.some(k => !valid.has(k))) { S.endings = S.endings.filter(k => valid.has(k)); save(); }
  const stars = Array.from({ length: total }, (_, k) => `<span class="mg-star${k < S.endings.length ? ' is-on' : ''}" aria-hidden="true">\u2605</span>`).join('');
  panel.appendChild(el('div', 'mg-endings', `<div class="mg-prompt">Endings found: ${S.endings.length} / ${total}</div><div class="mg-stars" style="--n:${total}">${stars}</div>`));
  renderStartOver(panel);
}
function renderChoice(panel, p, id) {
  const c = p.choice;
  if (c.prompt) panel.appendChild(el('div', 'mg-prompt', c.prompt));
  const box = el('div', 'mg-options');
  box.style.gridTemplateColumns = `repeat(${Math.min(2, c.options.length)}, minmax(0, 1fr))`;
  c.options.forEach(o => {
    const b = el('button', 'mg-opt mg-choice' + (S.choices[id] === o.key ? ' is-picked' : ''), o.html);
    b.type = 'button';
    b.addEventListener('click', () => choose(id, o.key));
    box.appendChild(b);
  });
  panel.appendChild(box);
}
function renderTask(panel, p, id, i) {
  const seed = S.seeds[id] != null ? S.seeds[id] : hash(bookId + ':' + id) % 100000;
  const ctx = { rng: rng(seed), seed, level: i / Math.max(1, PAGES().length - 1), flags: flags(), solved: !!S.solved[id] };
  const spec = p.task(seed, ctx) || { kind: 'tap' };
  const head = el('div', 'mg-head');
  head.appendChild(el('div', 'mg-prompt', spec.prompt || ''));
  if (spec.kind !== 'tap') {
    const nb = el('button', 'mg-new', '\u21bb');
    nb.type = 'button'; nb.setAttribute('aria-label', 'New puzzle');
    nb.addEventListener('click', () => {
      // a new puzzle is an unsolved puzzle: forward locks again until it is solved
      S.seeds[id] = seed + 1; delete S.solved[id]; delete P_()[id]; save();
      remount();
      counter(); settle();
    });
    head.appendChild(nb);
  }
  panel.appendChild(head);
  const body = el('div', 'mg-body');
  panel.appendChild(body);
  const hintEl = el('div', 'mg-hint');
  panel.appendChild(hintEl);
  let misses = 0, hinted = false;
  const onHint = [];
  const api = {
    solve(extra) {
      panel.classList.add('is-solved');
      if (!S.solved[id]) {
        S.solved[id] = true;
        // what the child actually picked (pick tasks): the world shows that,
        // not the textbook answer. In memory only, like `solved`.
        if (extra && extra.picked) P_()[id] = { values: extra.picked.slice(), index: (extra.pickedIndex || []).slice() };
        save();
        window.dispatchEvent(new CustomEvent('minigame-solved', { detail: Object.assign({ id, index: i }, extra || {}) }));
      }
      updateLocks();
      counter();
      settle();
    },
    miss(target) {
      misses++;
      const t = target || body;
      t.classList.remove('mg-wobble'); void t.offsetWidth; t.classList.add('mg-wobble');
      if (misses >= HINT_AFTER && !hinted) api.hint();
    },
    hint() {
      hinted = true;
      if (spec.hint) { hintEl.textContent = spec.hint; hintEl.classList.add('is-on'); }
      onHint.forEach(f => f());
    },
    onHint(f) { onHint.push(f); }
  };
  if (spec.art) body.appendChild(el('div', 'mg-art', spec.art));
  api.done = !!S.solved[id];                   // already solved: kinds draw the answer in place
  api.picked = P_()[id] ? P_()[id].index : null;
  (KINDS[spec.kind] || KINDS.tap)(body, spec, api);
  if (S.solved[id]) panel.classList.add('is-solved');
  live = { id, index: i, spec, api, panel };
}

// ---- task kinds ----------------------------------------------------------------------------------
const KINDS = {
  tap(body, spec) {
    body.appendChild(el('div', 'mg-tapnote', spec.note || '\u261d'));
  },
  choice(body, spec, api) {
    const box = el('div', 'mg-options');
    box.style.gridTemplateColumns = `repeat(${spec.cols || Math.min(spec.options.length, spec.options.length > 4 ? 3 : 2)}, minmax(0, 1fr))`;
    const btns = spec.options.map(o => {
      const b = el('button', 'mg-opt', o.html);
      b.type = 'button';
      b.addEventListener('click', () => {
        if (box.classList.contains('is-done')) return;
        if (o.ok) { b.classList.add('is-right'); box.classList.add('is-done'); api.solve(); }
        else { b.classList.add('is-wrong'); api.miss(b); }
      });
      box.appendChild(b);
      return b;
    });
    api.onHint(() => spec.options.forEach((o, k) => { if (o.ok) btns[k].classList.add('is-hint'); }));
    if (api.done) { spec.options.forEach((o, k) => { if (o.ok) btns[k].classList.add('is-right'); }); box.classList.add('is-done'); }
    body.appendChild(box);
  },
  pick(body, spec, api) {
    const box = el('div', 'mg-options mg-pick');
    box.style.gridTemplateColumns = `repeat(${spec.cols || Math.min(4, spec.items.length)}, minmax(0, 1fr))`;
    const on = new Set();
    const read = el('div', 'mg-sum');
    const show = () => { if (spec.showSum !== false) read.textContent = spec.sumText ? spec.sumText(sum()) : `${sum()} / ${spec.target}`; };
    const sum = () => [...on].reduce((s, k) => s + spec.items[k].value, 0);
    const btns = spec.items.map((it, k) => {
      const b = el('button', 'mg-opt', it.html);
      b.type = 'button';
      b.addEventListener('click', () => {
        if (box.classList.contains('is-done')) return;
        if (on.has(k)) { on.delete(k); b.classList.remove('is-on'); show(); return; }
        on.add(k); b.classList.add('is-on'); show();
        const s = sum(), n = on.size;
        const full = spec.count ? n >= spec.count : s >= spec.target;
        if (!full) return;
        if (s === spec.target && (!spec.count || n === spec.count)) {
          box.classList.add('is-done');
          on.forEach(j => btns[j].classList.add('is-right'));
          const idx = [...on].sort((a, b) => a - b);
          api.solve({ picked: idx.map(j => spec.items[j].value), pickedIndex: idx });
        } else {
          api.miss(box);
          setTimeout(() => { on.forEach(j => btns[j].classList.remove('is-on')); on.clear(); show(); }, 450);
        }
      });
      box.appendChild(b);
      return b;
    });
    api.onHint(() => (spec.answer || []).forEach(k => btns[k] && btns[k].classList.add('is-hint')));
    if (api.done) {                          // the child's own pick, else the textbook one
      const idx = api.picked && api.picked.length ? api.picked : (spec.answer || []);
      idx.forEach(k => { if (btns[k]) { on.add(k); btns[k].classList.add('is-on', 'is-right'); } });
      box.classList.add('is-done');
    }
    body.appendChild(box);
    body.appendChild(read);
    show();
  },
  order(body, spec, api) {
    let next = 0;
    const box = el('div', spec.free ? 'mg-free' : 'mg-options');
    if (spec.free) box.style.aspectRatio = String(spec.aspect || 1);
    else box.style.gridTemplateColumns = `repeat(${spec.cols || Math.min(4, spec.items.length)}, minmax(0, 1fr))`;
    let lines = null, pts = [];
    if (spec.free && spec.lines) {
      lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      lines.setAttribute('viewBox', '0 0 100 100');
      lines.setAttribute('preserveAspectRatio', 'none');
      lines.setAttribute('class', 'mg-lines');
      box.appendChild(lines);
    }
    const btns = spec.items.map((it, k) => {
      const b = el('button', 'mg-opt' + (spec.free ? ' mg-dot' : ''), it.html);
      b.type = 'button';
      if (spec.free) { b.style.left = it.x + '%'; b.style.top = it.y + '%'; }
      b.addEventListener('click', () => {
        if (box.classList.contains('is-done') || b.classList.contains('is-right')) return;
        if (k !== spec.order[next]) { api.miss(b); return; }
        b.classList.add('is-right'); b.classList.remove('is-hint');
        if (!spec.free) b.insertAdjacentHTML('beforeend', `<span class="mg-ord" aria-hidden="true">${next + 1}</span>`);   // which tap it was
        if (lines) {
          pts.push([it.x, it.y]);
          if (pts.length > 1) {
            const [a, c] = [pts[pts.length - 2], pts[pts.length - 1]];
            const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]); ln.setAttribute('x2', c[0]); ln.setAttribute('y2', c[1]);
            lines.appendChild(ln);
          }
        }
        next++;
        if (next >= spec.order.length) {
          if (lines && spec.closeLoop && pts.length > 2) {
            const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            ln.setAttribute('x1', pts[pts.length - 1][0]); ln.setAttribute('y1', pts[pts.length - 1][1]); ln.setAttribute('x2', pts[0][0]); ln.setAttribute('y2', pts[0][1]);
            lines.appendChild(ln);
          }
          box.classList.add('is-done'); api.solve();
        }
      });
      box.appendChild(b);
      return b;
    });
    api.onHint(() => { const k = spec.order[next]; if (btns[k]) btns[k].classList.add('is-hint'); });
    if (api.done) {                          // replay the right taps, quietly (no second solve)
      const solve = api.solve; api.solve = () => {};
      spec.order.forEach(k => btns[k] && btns[k].click());
      api.solve = solve;
    }
    body.appendChild(box);
  },
  drag(body, spec, api) {
    const slots = el('div', 'mg-slots'), tray = el('div', 'mg-tray');
    let picked = null, left = spec.pieces.length;
    const slotEls = spec.slots.map(s => {
      const d = el('div', 'mg-slot', `<div class="mg-slot-label">${s.html}</div><div class="mg-slot-in"></div>`);
      d.dataset.key = s.key; if (s.multi) d.dataset.multi = '1';
      d.addEventListener('click', () => { if (picked) place(picked, d); });
      slots.appendChild(d);
      return d;
    });
    function place(piece, slot) {
      const inner = slot.querySelector('.mg-slot-in');
      piece.classList.remove('is-picked'); picked = null;
      if (slot.dataset.key !== piece.dataset.key || (!slot.dataset.multi && inner.children.length)) { api.miss(piece); return false; }
      piece.style.transform = '';
      piece.classList.add('is-placed');
      inner.appendChild(piece);
      if (!slot.dataset.multi) slot.classList.add('is-filled');   // the piece takes the gap's place
      if (--left === 0) api.solve();
      return true;
    }
    spec.pieces.forEach(pc => {
      const b = el('button', 'mg-piece', pc.html);
      b.type = 'button'; b.dataset.key = pc.key;
      let drag = null;
      b.addEventListener('pointerdown', e => {
        if (b.classList.contains('is-placed')) return;
        drag = { x: e.clientX, y: e.clientY, moved: false };
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
      });
      b.addEventListener('pointermove', e => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) { b.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`; b.classList.add('is-dragging'); }
      });
      const end = e => {
        if (!drag) return;
        const moved = drag.moved; drag = null;
        b.classList.remove('is-dragging');
        if (!moved) {                       // tap: pick it, then tap a slot
          if (picked) picked.classList.remove('is-picked');
          picked = picked === b ? null : b;
          if (picked) b.classList.add('is-picked');
          return;
        }
        const hit = slotEls.find(s => { const r = s.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
        b.style.transform = '';
        if (hit) place(b, hit); else api.miss(b);
      };
      b.addEventListener('pointerup', end);
      b.addEventListener('pointercancel', () => { drag = null; b.style.transform = ''; b.classList.remove('is-dragging'); });
      tray.appendChild(b);
    });
    api.onHint(() => {
      const first = tray.querySelector('.mg-piece:not(.is-placed)');
      if (!first) return;
      first.classList.add('is-hint');
      const s = slotEls.find(x => x.dataset.key === first.dataset.key);
      if (s) s.classList.add('is-hint');
    });
    if (api.done) {                          // every piece already in its slot
      const solve = api.solve; api.solve = () => {};
      [...tray.querySelectorAll('.mg-piece')].forEach(pc => {
        const s = slotEls.find(x => x.dataset.key === pc.dataset.key && (x.dataset.multi || !x.querySelector('.mg-slot-in').children.length));
        if (s) place(pc, s);
      });
      api.solve = solve;
    }
    body.appendChild(slots);
    body.appendChild(tray);
  },
  cells(body, spec, api) {
    const grid = el('div', 'mg-cells');
    grid.style.gridTemplateColumns = `repeat(${spec.cols}, minmax(0, 1fr))`;
    const given = new Set(spec.given), target = new Set(spec.target);
    let left = target.size;
    const cells = {};
    if (spec.axis != null) grid.style.setProperty('--mg-axis', (spec.axis / spec.cols * 100) + '%');
    for (let r = 0; r < spec.rows; r++) for (let c = 0; c < spec.cols; c++) {
      const k = c + ',' + r, b = el('button', 'mg-cell');
      b.type = 'button';
      if (given.has(k)) { b.classList.add('is-given'); b.style.background = spec.color || '#7c4dff'; b.disabled = true; }
      b.addEventListener('click', () => {
        if (b.classList.contains('is-on') || given.has(k)) return;
        if (!target.has(k)) { api.miss(b); return; }
        b.classList.add('is-on'); b.classList.remove('is-hint'); b.style.background = spec.color || '#7c4dff';
        if (--left === 0) api.solve();
      });
      cells[k] = b;
      grid.appendChild(b);
    }
    if (spec.axis != null) grid.classList.add('has-axis');
    api.onHint(() => { for (const k of target) if (!cells[k].classList.contains('is-on')) { cells[k].classList.add('is-hint'); break; } });
    if (api.done) for (const k of target) { if (cells[k]) { cells[k].classList.add('is-on'); cells[k].style.background = spec.color || '#7c4dff'; } }
    if (api.done) left = 0;
    body.appendChild(grid);
  },
  maze(body, spec, api) {
    const W = spec.cols, H = spec.rows, R = rng(spec.seed || 1);
    // walls: right[x][y], downW[x][y] (true = wall)
    const right = [], downW = [], seen = [];
    for (let x = 0; x < W; x++) { right[x] = []; downW[x] = []; seen[x] = []; for (let y = 0; y < H; y++) { right[x][y] = true; downW[x][y] = true; seen[x][y] = false; } }
    const stack = [[0, 0]]; seen[0][0] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && !seen[a][b]);
      if (!n.length) { stack.pop(); continue; }
      const [a, b, dx, dy] = n[Math.floor(R() * n.length)];
      if (dx === 1) right[x][y] = false; if (dx === -1) right[a][b] = false;
      if (dy === 1) downW[x][y] = false; if (dy === -1) downW[a][b] = false;
      seen[a][b] = true; stack.push([a, b]);
    }
    const open = (a, b) => {
      const [x0, y0] = a, [x1, y1] = b;
      if (Math.abs(x0 - x1) + Math.abs(y0 - y1) !== 1) return false;
      if (x1 === x0 + 1) return !right[x0][y0];
      if (x1 === x0 - 1) return !right[x1][y1];
      if (y1 === y0 + 1) return !downW[x0][y0];
      return !downW[x1][y1];
    };
    const start = spec.start || [0, 0], goal = spec.goal || [W - 1, H - 1];
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `-0.15 -0.15 ${W + 0.3} ${H + 0.3}`);
    svg.setAttribute('class', 'mg-maze');
    svg.style.aspectRatio = `${W} / ${H}`;
    let walls = `<rect x="0" y="0" width="${W}" height="${H}" fill="${spec.floor || 'rgba(255,255,255,.55)'}" rx=".2"/>`;
    let d = `M0 0H${W}V${H}H0Z`;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      if (right[x][y] && x < W - 1) d += `M${x + 1} ${y}V${y + 1}`;
      if (downW[x][y] && y < H - 1) d += `M${x} ${y + 1}H${x + 1}`;
    }
    walls += `<path d="${d}" fill="none" stroke="${spec.color || '#3b2a78'}" stroke-width=".14" stroke-linecap="round"/>`;
    const mark = (f, [x, y], def) => (f ? f(x + 0.5, y + 0.5) : def);
    walls += `<polyline class="mg-maze-hint" fill="none" stroke="#ffd76a" stroke-width=".18" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`;
    walls += `<polyline class="mg-maze-path" fill="none" stroke="${spec.pathColor || '#ff7a3d'}" stroke-width=".3" stroke-linecap="round" stroke-linejoin="round"/>`;
    walls += mark(spec.goalSvg, goal, `<circle cx="${goal[0] + 0.5}" cy="${goal[1] + 0.5}" r=".32" fill="#ffd23a"/>`);
    walls += mark(spec.startSvg, start, `<circle cx="${start[0] + 0.5}" cy="${start[1] + 0.5}" r=".3" fill="#ff7a3d"/>`);
    svg.innerHTML = walls;
    const line = svg.querySelector('.mg-maze-path');
    const path = [start.slice()];
    let done = false, bumps = 0;
    const draw = () => line.setAttribute('points', path.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' '));
    draw();
    function cellAt(e) {
      const r = svg.getBoundingClientRect();
      const vx = (e.clientX - r.left) / r.width * (W + 0.3) - 0.15, vy = (e.clientY - r.top) / r.height * (H + 0.3) - 0.15;
      return [Math.max(0, Math.min(W - 1, Math.floor(vx))), Math.max(0, Math.min(H - 1, Math.floor(vy)))];
    }
    function step(c) {
      if (done) return;
      const end = path[path.length - 1];
      if (c[0] === end[0] && c[1] === end[1]) return;
      const prev = path[path.length - 2];
      if (prev && c[0] === prev[0] && c[1] === prev[1]) { path.pop(); draw(); return; }
      if (open(end, c)) {
        path.push(c); draw();
        if (c[0] === goal[0] && c[1] === goal[1]) { done = true; svg.classList.add('is-done'); api.solve(); }
      } else if (Math.abs(c[0] - end[0]) + Math.abs(c[1] - end[1]) === 1) {
        bumps++;
        if (bumps % 3 === 0) api.miss(svg);
      }
    }
    let tracing = false;
    svg.addEventListener('pointerdown', e => { tracing = true; try { svg.setPointerCapture(e.pointerId); } catch (err) { /* */ } step(cellAt(e)); });
    svg.addEventListener('pointermove', e => { if (tracing) step(cellAt(e)); });
    svg.addEventListener('pointerup', () => { tracing = false; });
    svg.addEventListener('pointercancel', () => { tracing = false; });
    function way() {                         // start .. goal through the open walls
      const prevOf = {}, q = [start], key = ([x, y]) => x + ',' + y;
      prevOf[key(start)] = null;
      while (q.length) {
        const c = q.shift();
        if (c[0] === goal[0] && c[1] === goal[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = [c[0] + dx, c[1] + dy];
          if (n[0] < 0 || n[1] < 0 || n[0] >= W || n[1] >= H || key(n) in prevOf || !open(c, n)) continue;
          prevOf[key(n)] = c; q.push(n);
        }
      }
      const pts = []; let c = goal;
      while (c) { pts.unshift(c); c = prevOf[key(c)]; }
      return pts;
    }
    if (api.done) { path.length = 0; way().forEach(p => path.push(p)); draw(); done = true; svg.classList.add('is-done'); }
    api.onHint(() => {                       // the way out, faintly
      const prevOf = {}, q = [start], key = ([x, y]) => x + ',' + y;
      prevOf[key(start)] = null;
      while (q.length) {
        const c = q.shift();
        if (c[0] === goal[0] && c[1] === goal[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = [c[0] + dx, c[1] + dy];
          if (n[0] < 0 || n[1] < 0 || n[0] >= W || n[1] >= H || key(n) in prevOf || !open(c, n)) continue;
          prevOf[key(n)] = c; q.push(n);
        }
      }
      const pts = []; let c = goal;
      while (c) { pts.unshift(c); c = prevOf[key(c)]; }
      const h = svg.querySelector('.mg-maze-hint');
      h.setAttribute('points', pts.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' '));
      h.setAttribute('opacity', '.7');
    });
    body.appendChild(svg);
  },
  push(body, spec, api) {
    const rows = spec.map.map(r => r.split(''));
    const H = rows.length, W = Math.max(...rows.map(r => r.length));
    let you = null;
    const crates = new Set(), marks = new Set(), walls = new Set();
    rows.forEach((r, y) => { for (let x = 0; x < W; x++) {
      const c = r[x] || ' ', k = x + ',' + y;
      if (c === '#') walls.add(k);
      if (c === '.' || c === '*' || c === '+') marks.add(k);
      if (c === '$' || c === '*') crates.add(k);
      if (c === '@' || c === '+') you = [x, y];
    } });
    const start = { you: you.slice(), crates: new Set(crates) };
    const grid = el('div', 'mg-push');
    grid.style.gridTemplateColumns = `repeat(${W}, minmax(0, 1fr))`;
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = el('div', 'mg-push-cell'); grid.appendChild(c); cells.push(c); }
    let done = false;
    function draw() {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const k = x + ',' + y, c = cells[y * W + x];
        c.className = 'mg-push-cell' + (walls.has(k) ? ' is-wall' : '') + (marks.has(k) ? ' is-mark' : '');
        c.innerHTML = crates.has(k) ? `<span class="mg-crate${marks.has(k) ? ' is-home' : ''}">${spec.crateHtml || ''}</span>` : (you[0] === x && you[1] === y ? `<span class="mg-you">${spec.youHtml || ''}</span>` : '');
      }
    }
    function move(dx, dy) {
      if (done) return;
      const n = [you[0] + dx, you[1] + dy], nk = n[0] + ',' + n[1];
      if (walls.has(nk)) { api.miss(grid); return; }
      if (crates.has(nk)) {
        const b = [n[0] + dx, n[1] + dy], bk = b[0] + ',' + b[1];
        if (walls.has(bk) || crates.has(bk)) { api.miss(grid); return; }
        crates.delete(nk); crates.add(bk);
      }
      you = n; draw();
      if ([...crates].every(k => marks.has(k))) { done = true; grid.classList.add('is-done'); api.solve(); }
    }
    const pad = el('div', 'mg-pad');
    [['\u2191', 0, -1, 'up'], ['\u2190', -1, 0, 'left'], ['\u2193', 0, 1, 'down'], ['\u2192', 1, 0, 'right']].forEach(([t, dx, dy, n]) => {
      const b = el('button', 'mg-btn mg-arrow mg-' + n, t); b.type = 'button'; b.setAttribute('aria-label', 'Move ' + n);
      b.addEventListener('click', () => move(dx, dy));
      pad.appendChild(b);
    });
    const reset = el('button', 'mg-btn mg-reset', '\u21ba'); reset.type = 'button'; reset.setAttribute('aria-label', 'Start this puzzle again');
    reset.addEventListener('click', () => { you = start.you.slice(); crates.clear(); start.crates.forEach(k => crates.add(k)); done = false; grid.classList.remove('is-done'); draw(); });
    pad.appendChild(reset);
    // swipe on the board
    let sw = null;
    grid.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY }; });
    grid.addEventListener('pointerup', e => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0); else move(0, Math.sign(dy));
    });
    if (api.done) { crates.clear(); marks.forEach(k => crates.add(k)); done = true; grid.classList.add('is-done'); }   // crates home
    draw();
    body.appendChild(grid);
    body.appendChild(pad);
  }
};

// ---- mount panels as the engine renders pages ------------------------------------------------------
function sync() {
  const tb = currentTextBlock();
  if (!tb) return;
  const i = curIndex();
  if (tb.__mgStale || tb.__mgIndex === i) return;
  if (tb.__mgIndex != null) {
    // the index moved on but this is still the OLD page's text (the engine
    // swaps it at the flip mid-point): clear it, mount on the new block only
    unmountPanel(tb);
    tb.__mgStale = true;
    return;
  }
  tb.__mgIndex = i;
  mount(tb, i);
  caption(tb);
  updateLocks();
  counter();
}
// window.MINIGAME_CAPTION = 'below' (per book): on a page with a puzzle /
// choice the page's title and text show in a caption under the book and the
// puzzle has the text page to itself, scaled to fit the page; a page without
// one keeps its text on the page. The book's size never changes between pages
// (body.mg-book is set once, before the engine first lays the book out), so a
// turn never moves the book.
let capEl = null;
// window.MINIGAME_CAPTION = 'panel' (toyshop): the opposite. The page keeps
// its title and text; the tap note / choice / endings / Start over sit in a
// dock right under the book.
function layout(has) {
  if (window.MINIGAME_CAPTION === 'panel') { if (capEl && !has) capEl.style.display = 'none'; return; }
  if (window.MINIGAME_CAPTION !== 'below') return;
  document.body.classList.toggle('mg-below', has);
  if (capEl) capEl.style.display = has ? '' : 'none';
}
const dockFor = tb => tb;
function dock(tb) {
  const panel = tb.querySelector('.mg-panel');
  if (!capEl) { capEl = el('div', 'mg-caption mg-dock'); capEl.setAttribute('aria-live', 'polite'); document.body.appendChild(capEl); }
  capEl.innerHTML = '';
  if (!panel) { capEl.style.display = 'none'; return; }
  capEl.style.display = '';
  capEl.appendChild(panel);
  placeCaption();
  if (!capEl.__ro && window.ResizeObserver) { capEl.__ro = new ResizeObserver(() => placeCaption()); capEl.__ro.observe(capEl); }
}
function caption(tb) {
  if (window.MINIGAME_CAPTION === 'panel') { dock(tb); return; }
  if (window.MINIGAME_CAPTION !== 'below' || !document.body.classList.contains('mg-below')) return;
  if (!capEl) {
    capEl = el('div', 'mg-caption');
    capEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(capEl);
  }
  capEl.style.display = '';
  const t = tb.querySelector('.title-line'), b = tb.querySelector('.body-line');
  capEl.innerHTML = (t ? `<div class="mg-cap-title">${t.innerHTML}</div>` : '') + (b ? `<div class="mg-cap-body">${b.innerHTML}</div>` : '');
  // the puzzle leaves the text slot (whose box is not the page's box) for a
  // fixed wrapper laid exactly over the text page, see fit()
  const panel = tb.querySelector('.mg-panel');
  if (panel) {
    const slot = tb.closest('.obj-slot');
    fitSide = slot && slot.classList.contains('left') ? 'left' : 'right';
    const wrap = el('div', 'mg-fit');
    document.body.appendChild(wrap);
    wrap.appendChild(panel);
    fitPanel = panel;
  }
  fit();
}
// the caption sits right under the book (not at the bottom of the screen)
function placeCaption() {
  const book = document.querySelector('.book');
  if (!capEl || !book) return;
  const br = book.getBoundingClientRect();
  if (!br.height) return;
  // never over the page nav: with the full-size book the gap can be small
  // (phone landscape: the nav is a column at the side, so only the screen
  // bottom limits the caption)
  const nav = document.querySelector('.page-nav');
  const nr = nav && nav.getBoundingClientRect();
  const navBelow = nr && nr.height && nr.top > br.top + br.height * 0.5;
  const limit = (navBelow ? nr.top : innerHeight) - 8 - capEl.offsetHeight;
  capEl.style.top = Math.round(Math.max(0, Math.min(br.bottom + 10, limit))) + 'px';
  capEl.style.bottom = 'auto';
}
// scale the puzzle so it fits inside its page (the page box as seen on
// screen) and centre it on that page: width 90 % of the page, height at most
// 92 %, scaled down (or up to 1.25x) to match
let fitPanel = null, fitSide = 'right';
function fit() {
  placeCaption();
  const panel = fitPanel;
  if (!panel || !panel.isConnected) return;
  const wrap = panel.parentNode;
  const page = document.querySelector('.book .page-panel.' + fitSide);
  if (!page || !wrap) return;
  const raw = page.getBoundingClientRect();
  if (!raw.width) return;
  // only the part of the page that is on screen (portrait phones: the open
  // book is wider than the screen, so the outer page edge is cut off), and
  // never under the caption
  const capTop = capEl && capEl.style.display !== 'none' ? capEl.getBoundingClientRect().top - 6 : innerHeight;
  const L = Math.max(raw.left, 4), R = Math.min(raw.right, innerWidth - 4);
  const T = Math.max(raw.top, 4), B = Math.min(raw.bottom, innerHeight - 4, capTop > raw.top + 80 ? capTop : innerHeight);
  const pr = { left: L, top: T, width: Math.max(0, R - L), height: Math.max(0, B - T) };
  if (pr.width < 60) return;
  const availW = Math.max(60, pr.width * 0.92), availH = Math.max(80, pr.height * 0.92);
  panel.style.transform = ''; panel.style.width = availW + 'px';
  // the biggest scale k at which the panel, laid out availW / k wide, is no
  // taller than availH on screen. Always exactly availW wide on screen (the
  // old "clamp k after the last width change" shrank the width: narrow tasks).
  const fits = k => { panel.style.width = (availW / k) + 'px'; return panel.offsetHeight * k <= availH; };
  let lo = 0.25, hi = 1.25, k;
  if (fits(hi)) k = hi;
  else {
    for (let it = 0; it < 9; it++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    k = lo;
    fits(k);
  }
  panel.style.transform = `scale(${k.toFixed(3)})`;
  const h = panel.offsetHeight * k;               // on screen the panel is availW wide
  wrap.style.left = Math.round(pr.left + (pr.width - availW) / 2) + 'px';
  wrap.style.top = Math.round(pr.top + Math.max(0, (pr.height - h) / 2)) + 'px';
  if (!panel.__ro && window.ResizeObserver) {      // a hint, a placed piece...: fit again
    let last = 0;
    panel.__ro = new ResizeObserver(() => {
      const h = panel.offsetHeight;
      if (Math.abs(h - last) < 2) return;
      last = h; clearTimeout(fitT); fitT = setTimeout(fit, 60);
    });
    panel.__ro.observe(panel);
  }
  wrap.style.width = availW + 'px';
  wrap.style.height = (panel.offsetHeight * k) + 'px';
}
let fitT = 0;
window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fit, 220); });
document.addEventListener('DOMContentLoaded', () => { if (window.MINIGAME_CAPTION === 'below' || window.MINIGAME_CAPTION === 'panel') document.body.classList.add('mg-book'); });
let syncing = false;
new MutationObserver(() => {
  if (syncing) return;
  syncing = true;
  try { sync(); counter(); updateLocks(); } finally { syncing = false; }
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

// every puzzle gets a random seed the first time (saved, so a reload keeps
// it; ↺ / Start over clear them, so a new game gets new puzzles)
function seedAll() {
  let changed = false;
  PAGES().forEach((p, i) => {
    const id = pageId(i);
    if (p.task && S.seeds[id] == null) { S.seeds[id] = Math.floor(Math.random() * 1e5); changed = true; }
  });
  if (changed) save();
}
document.addEventListener('DOMContentLoaded', () => {
  seedAll();
  if (branching()) { ensurePath(); pos = 0; cur = 0; }
});

// ---- styles ------------------------------------------------------------------------------------------
document.head.insertAdjacentHTML('beforeend', `<style>
.mg-panel{pointer-events:auto;margin:.7em auto 0;max-width:30em;padding:.55em .6em .6em;border-radius:14px;
  background:rgba(255,252,244,.92);box-shadow:0 3px 14px rgba(30,18,6,.22);color:#3a2a1c;font-size:clamp(13px,1.5vw,18px);text-align:center;touch-action:none}
.mg-head{display:flex;align-items:center;gap:.5em;justify-content:center}
.mg-prompt{font-weight:700;line-height:1.25;flex:1}
.mg-new{flex:0 0 auto;width:2.2em;height:2.2em;border-radius:50%;border:0;background:#efe4cf;color:#6a4a2a;font-size:1em;cursor:pointer}
.mg-body{margin-top:.5em}
.mg-art{margin:0 auto .5em;max-width:100%}
.mg-art svg{width:100%;height:auto;max-height:28vh;display:block;margin:0 auto}
.mg-options{display:grid;gap:.45em}
.mg-opt,.mg-btn,.mg-piece{min-height:48px;border:0;border-radius:12px;background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.14),0 0 0 2px #e6d8bd inset;
  font:inherit;font-weight:700;color:inherit;cursor:pointer;padding:.35em .5em;display:flex;align-items:center;justify-content:center;gap:.3em;transition:transform .15s,background .2s,opacity .2s}
.mg-opt svg,.mg-piece svg{max-width:100%;height:auto;max-height:12vh}
.mg-opt:active,.mg-btn:active{transform:scale(.95)}
.mg-opt.is-on{background:#fff2c4;box-shadow:0 0 0 3px #f0b43a inset}
.mg-opt.is-right{background:#d9f5c9;box-shadow:0 0 0 3px #5cbf4a inset}
.mg-opt.is-wrong{opacity:.55}
.mg-opt.is-picked{background:#fff2c4;box-shadow:0 0 0 3px #f0b43a inset}
.is-hint{animation:mg-glow 1.2s ease-in-out infinite}
@keyframes mg-glow{50%{box-shadow:0 0 0 4px #ffd23a inset,0 0 14px #ffd23a}}
.mg-wobble{animation:mg-wobble .42s ease-in-out}
@keyframes mg-wobble{20%{transform:translateX(-6px) rotate(-2deg)}40%{transform:translateX(6px) rotate(2deg)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.mg-nudge{animation:mg-wobble .42s ease-in-out}
.mg-hint{display:none;margin-top:.45em;font-size:.9em;color:#7a5a2a;font-style:italic}
.mg-hint.is-on{display:block}
.mg-sum{margin-top:.35em;font-weight:800;color:#7a5a2a}
.mg-panel.is-solved{box-shadow:0 0 0 3px #5cbf4a,0 3px 14px rgba(30,18,6,.22)}
.mg-panel.is-solved .mg-prompt::after{content:" \\2713";color:#3f9a2e}
.mg-free{position:relative;width:100%;max-height:34vh;margin:0 auto}
.mg-free{container-type:inline-size}
.mg-free .mg-dot{position:absolute;transform:translate(-50%,-50%);min-height:0;width:min(2.3em,10cqw);height:min(2.3em,10cqw);border-radius:50%;padding:0;font-size:.85em;z-index:1}
.mg-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.mg-lines line{stroke:#f0b43a;stroke-width:3;vector-effect:non-scaling-stroke;stroke-linecap:round}
.mg-slots{display:flex;gap:.45em;justify-content:center;flex-wrap:wrap}
.mg-slot{flex:1 1 0;min-width:4.5em;min-height:4.4em;border-radius:12px;border:2px dashed #c9b48e;padding:.25em;display:flex;flex-direction:column;align-items:center;gap:.2em;background:rgba(255,255,255,.5)}
.mg-slot-label{font-weight:800;font-size:.9em}
.mg-slot-label svg{height:8vh;width:auto;max-width:100%;display:block;margin:0 auto}
.mg-art svg,.mg-opt svg,.mg-piece svg{min-width:1.5em}
.mg-piece svg{height:2.6em;width:auto}
.mg-opt{position:relative}
/* grid cells may shrink below their content: long words wrap inside the
   button instead of pushing it out of the panel */
.mg-options>.mg-opt{min-width:0;flex-wrap:wrap;overflow-wrap:anywhere;hyphens:auto}
.mg-art{overflow:hidden;border-radius:10px}
.mg-ord{position:absolute;right:.3em;bottom:.2em;min-width:1.5em;height:1.5em;border-radius:50%;background:#fff;color:#3f9a2e;
  box-shadow:0 0 0 2px #5cbf4a inset;font-size:.8em;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1}
.mg-fit{position:fixed;left:0;top:0;z-index:12;pointer-events:none}
.mg-fit>.mg-panel{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;margin:0;pointer-events:auto}
.mg-below .obj-slot.is-text .title-line,.mg-below .obj-slot.is-text .body-line{display:none}
.mg-below .mg-panel{margin-top:0}
.mg-slot.is-filled{border-style:solid;border-color:#5cbf4a;background:#eefae6}
.mg-slot.is-filled .mg-slot-label{display:none}
.mg-slot.is-filled .mg-slot-in{flex:1;align-items:center}
.mg-slot.is-filled .mg-piece{min-height:0;box-shadow:none;background:transparent;padding:0}
.mg-slot.is-filled .mg-piece svg{height:8vh;max-height:none}
.mg-caption{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);width:min(760px,92vw);z-index:11;pointer-events:none;text-align:center;
  background:rgba(255,250,240,.93);border-radius:12px;padding:.45em 1.1em .55em;box-shadow:0 2px 10px rgba(40,24,8,.3);color:#5a4632}
.mg-reset-all{position:fixed;top:24px;right:84px;z-index:30;
  width:44px;height:44px;border-radius:50%;border:0;background:rgba(20,28,48,.6);color:#fff;font-size:22px;line-height:1;cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,.25)}
/* no music button (the book has no track): take the top-right corner itself */
body:not(:has(.music-btn)) .mg-reset-all{right:24px}
.mg-reset-all:hover{background:rgba(28,48,84,.85)}
.mg-reset-all:focus-visible{outline:2px solid #9ec2ff;outline-offset:2px}
.mg-dock{pointer-events:auto;background:none;box-shadow:none;padding:0;width:min(560px,92vw)}
.mg-dock .mg-panel{margin:0 auto}
.mg-dock .mg-tapnote{font-size:1.2em}
.mg-cap-title{font-weight:800;font-size:clamp(18px,2.4vw,32px);color:#7d2a1c;line-height:1.1}
.mg-cap-body{margin-top:.2em;font-size:clamp(13px,1.5vw,19px);line-height:1.3}
.mg-slot-in{display:flex;flex-wrap:wrap;gap:.2em;justify-content:center}
.mg-tray{display:flex;gap:.45em;justify-content:center;flex-wrap:wrap;margin-top:.5em;min-height:48px}
.mg-piece{touch-action:none;min-width:48px;position:relative;z-index:1}
.mg-piece.is-dragging{z-index:5;box-shadow:0 8px 18px rgba(0,0,0,.25);transition:none}
.mg-piece.is-picked{box-shadow:0 0 0 3px #f0b43a inset}
.mg-piece.is-placed{min-height:36px;min-width:36px;cursor:default;background:#d9f5c9}
.mg-cells{display:grid;gap:3px;width:min(100%,18em);margin:0 auto;position:relative}
.mg-cells.has-axis::after{content:"";position:absolute;top:-4px;bottom:-4px;left:var(--mg-axis);border-left:3px dashed #f0b43a;pointer-events:none}
.mg-cell{aspect-ratio:1;border:0;border-radius:4px;background:#f3ead8;cursor:pointer;padding:0;min-width:0}
.mg-cell.is-given{cursor:default}
.mg-maze{width:min(100%,22em);height:auto;max-height:36vh;display:block;margin:0 auto;touch-action:none;cursor:crosshair}
.mg-push{display:grid;gap:2px;width:min(100%,16em);margin:0 auto;touch-action:none}
.mg-push-cell{aspect-ratio:1;border-radius:3px;background:#efe4cf;display:flex;align-items:center;justify-content:center;position:relative}
.mg-push-cell.is-wall{background:#6a5a8a}
.mg-push-cell.is-mark::before{content:"";position:absolute;inset:28%;border-radius:50%;border:3px dashed #e0a030}
.mg-crate{width:82%;height:82%;border-radius:4px;background:#c98a3e;box-shadow:inset 0 0 0 3px #8a5a22;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
.mg-crate.is-home{background:#7fcf5a;box-shadow:inset 0 0 0 3px #3f8a2a}
.mg-you{width:70%;height:70%;border-radius:50%;background:#e5232c;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
.mg-crate svg,.mg-you svg{width:100%;height:100%}
.mg-pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,48px);gap:.3em;justify-content:center;margin-top:.45em}
.mg-pad .mg-up{grid-column:2;grid-row:1}.mg-pad .mg-left{grid-column:1;grid-row:2}.mg-pad .mg-down{grid-column:2;grid-row:2}.mg-pad .mg-right{grid-column:3;grid-row:2}
.mg-pad .mg-reset{grid-column:3;grid-row:1;font-size:1.1em}
.mg-wide{width:100%;margin-top:.4em}
.mg-endings{container-type:inline-size}
.mg-stars{--n:4;font-size:min(1.6em,calc(100cqw / (var(--n) * 1.18)));color:#d8cdb8;line-height:1.2;margin:0 auto;display:flex;flex-wrap:nowrap;justify-content:center;gap:0 .12em;white-space:nowrap}
.mg-star.is-on{color:#f0b43a}
.mg-tapnote{font-size:1.6em}
.page-btn.mg-locked{opacity:.35}
.page-btn.mg-nudge-btn{animation:mg-wobble .42s ease-in-out}
@media (max-aspect-ratio:3/4),(max-width:800px){
  .mg-reset-all{top:12px;right:62px;width:40px;height:40px;font-size:20px}
  body:not(:has(.music-btn)) .mg-reset-all{right:12px}
  .mg-panel{font-size:clamp(11px,3.2vw,15px);padding:.4em .4em .45em}
  .mg-art svg{max-height:20vh}
  .mg-opt,.mg-btn,.mg-piece{min-height:44px}
  .mg-caption{bottom:70px}
  .mg-cap-title{font-size:clamp(15px,4.2vw,22px)}
  .mg-cap-body{font-size:clamp(11px,3.2vw,15px)}
}
@media (orientation:landscape) and (max-height:520px){
  /* phone landscape: lift the book so the caption fits under it */
  .mg-book .book-stage{margin-top:-16vh;margin-top:-16dvh}
  .mg-reset-all{top:10px;right:calc(max(12px, env(safe-area-inset-right, 0px)) + 46px);width:36px;height:36px;font-size:18px}
  body:not(:has(.music-btn)) .mg-reset-all{right:max(12px, env(safe-area-inset-right, 0px))}
  .mg-caption{width:min(620px,70vw);padding:.3em .9em .4em;margin-left:32px}
  .mg-cap-title{font-size:clamp(14px,3.6vh,20px)}
  .mg-cap-body{font-size:clamp(11px,3vh,14px);line-height:1.25}
}
@media (prefers-reduced-motion:reduce){.mg-wobble,.mg-nudge,.is-hint,.page-btn.mg-nudge-btn{animation:none}}
</style>`);

window.MINIGAME = Object.assign(API, {
  rng, hash,
  isSolved: id => !!S.solved[id],
  picked: id => (S.solved[id] && P_()[id] ? P_()[id].values.slice() : null),
  flags,
  state: () => S,
  current: () => ({ index: curIndex(), id: pageId(curIndex()) })
});
})();
