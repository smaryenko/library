# Book: reef — A Day on the Reef

The third book on the shelf. A gentle undersea story: a clownfish finds a
pretty spiral shell, loses it to the current, and chases it across the reef —
meeting a whole cast of neighbours who help along the way — only to discover
the shell was a hermit crab's house all along. The fish lets it go and makes a new
friend instead. It owns everything specific to this story; the page-turn
engine, tilt rig, and music player are shared (top-level `assets/`). See
`skills/book-authoring.md`.

## Contents

```
books/reef/
  index.html                entry page (so books/reef/ is a short link)
  pages.js                  the 14-page roster (all object pages, no text-only)
  cover.svg                 shelf-card preview art (clownfish + shell on a reef)
  favicon.svg               clownfish-on-a-teal-disc icon
  og.svg                    social preview image
  assets/
    js/
      backdrop.js           sunlit reef scene + drifting bubbles (mountReef)
      reeflife.js           draw helpers per species (see Cast) — each returns
                            { defs, <layers>, pt() } for a flat scene SVG
      props.js              the 14 page scenes (one flat SVG each, race-book
                            style), animated with the shared Motion library
```

## Cast (one draw helper per species; real names, no nicknames)

- **Clownfish** — `drawClownfish` — the protagonist (art kept). Three depth
  layers (`fish-back` / `fish` / `fish-front`). On every page with the shell
  (or the crab who lives in it) the fish faces it and tilts toward it
  (`reefFaceToward`).
- **Conch shell** — `drawConch` — matches the reference conch: knobbly stepped
  spire left, big shoulder knobs, flared cream lip with a ridged orange-pink
  aperture and a pointed siphon at lower right.
- **Hermit crab** — `drawHermitCrab` — wears the SAME conch (the twist). Crab
  after the reference: jointed speckled legs with dark tips, one big plum-brown
  claw + a small one, glossy eyes on stalks, long antennae. Layers
  `crab-shell` / `crab` / `crab-claw`.
- **Pufferfish** — `drawPuffer` — a white-spotted puffer in two forms: the
  slim deflated fish and a prickly inflated ball; the scene cross-fades them.
- **Octopus** — `drawOctopus` (art kept) — `octo-arms` / `octo`.
- **Green sea turtle** — `drawTurtle` — real scutes with radiating streaks and
  cream seams, marginal rim, scaled head with beak, long wing-like flippers.
  Layers `turtle-far` / `turtle` / `turtle-flipper`.
- **Seahorse** — `drawSeahorse` — matches the reference: coronet, long
  down-angled snout, spiny back ridge, bony rings, red-tipped fan fin, tail
  curling into a spiral. Layers `seahorse-fin` / `seahorse`.
- **Moray eel** — `drawEel` — matches the reference S-pose and dense dark
  reticulated mottling on olive-gold, yellow-green head, dorsal ridge; friendly
  closed smile and a big pale eye (`eel-eye`, blinks).
- **Jellyfish** — `drawJellyfish` (art kept).

## Story (14 pages, NO text-only pages)

The Reef → The Clownfish → The Shell → The Tide → The Seahorse → The Sea Turtle →
The Coral Garden → The Pufferfish → The Octopus → The Kelp Forest →
The Moray Eel (friendly!) → The Jellyfish → The Hermit Crab
(the shell was his house!) → **A New Friend** (the reef lights up).

The single caption line on each spread carries the narrative; image/text sides
alternate automatically.

## Notes

- Depth keys for the reef layer roles live in the reef block of `OBJ_DEPTH`
  (`assets/js/pseudo3d-object.js`); they are reef-only, so the xmas and race
  books are unaffected.
- **Animations** are composed per page from the shared Motion library
  (`assets/js/motion.js`) with `Motion.rig`; limbs `follow` their body (the
  turtle's flippers stroke while it swims off the page, the crab's claw waves
  while he pops out of his shell). Every page does something different: dart
  with turns, nose-bump + glint, tumble on the current, puff-up bump + roll,
  arm sweep + slide, weave, voyage off-page, corkscrew + point, kelp curtains,
  nudge + wiggle-wave + blink, duck-and-pop + startle, staggered jelly jets with
  glow, loop-the-loop + scuttle dance.
- **Music:** `assets/audio/seaside.mp3` — the looping track the shared player
  plays (off by default; starts on the reader's click). Confirm this track is
  public-domain or original before shipping (see `skills/asset-licensing.md`).
- **Licensing:** all art is original vector authored here. A clownfish, a
  seahorse, a conch shell, a hermit crab, and a moray-eel photo were used only as local
  **style references** (in gitignored `.kiro/reference/underwater/`) — never
  traced, embedded, or shipped. See `skills/asset-licensing.md`.
