// Generic looping background-music player. Content-agnostic: it loops whatever
// track it is given, so every book supplies its own audio file (per-book, under
// books/<id>/assets/audio/) via the manifest. No libraries.
//
// MusicPlayer:
//   .setTrack(url)   set/replace the looping source (call before first play)
//   .toggle()        start/stop playback (lazily creates the <audio> element on
//                    the first user gesture, satisfying autoplay policies)
//   .isPlaying()     -> bool
//   .onChange(fn)    register a callback fired with the new playing state
//
// Disabled by default: nothing plays until toggle() is called from a click.
//
// `window.CarolPlayer` is kept as a backwards-compatible alias so the existing
// storybook music button keeps working after the carol.js -> music.js rename.

(function () {
  'use strict';

  let src = null;             // the track to loop (set via setTrack / manifest)
  let audio = null;
  let playing = false;
  const listeners = [];

  function fire() { listeners.forEach(fn => { try { fn(playing); } catch (e) {} }); }

  function setTrack(url) {
    if (url === src) return;
    src = url;
    // if the element already exists, swap its source
    if (audio) {
      const wasPlaying = playing;
      audio.src = src;
      if (wasPlaying) audio.play().catch(() => { playing = false; fire(); });
    }
  }

  function ensureAudio() {
    if (audio) return;
    audio = new Audio(src || '');
    audio.loop = true;          // seamless repeat for as long as it's on
    audio.preload = 'auto';
    audio.volume = 0.6;
    // if playback ends or is interrupted, reflect that in the UI state
    audio.addEventListener('pause', () => {
      if (playing) { playing = false; fire(); }
    });
  }

  function start() {
    if (!src) return;           // no track configured -> nothing to play
    ensureAudio();
    const p = audio.play();
    playing = true;
    fire();
    // if the browser blocks playback, roll the state back
    if (p && typeof p.catch === 'function') {
      p.catch(() => { playing = false; fire(); });
    }
  }

  function stop() {
    if (audio) audio.pause();
    playing = false;
    fire();
  }

  const MusicPlayer = {
    setTrack,
    toggle() { playing ? stop() : start(); return playing; },
    isPlaying() { return playing; },
    onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }
  };

  window.MusicPlayer = MusicPlayer;
  window.CarolPlayer = MusicPlayer;  // backwards-compatible alias
})();
