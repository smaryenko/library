# Our Solar System

A picture book that travels outward from the Sun: the whole system on its
orbits, then the Sun, Mercury, Venus, Earth, the Moon, Mars, the Asteroid Belt, Jupiter, Saturn,
Uranus, Neptune, the Kuiper Belt and Pluto (with Charon).

Unlike the other books, the pictures are **not pseudo-3D SVG layers**. Each
body is a real sphere rendered per-pixel on a `<canvas>` (`assets/js/solar.js`)
from its real surface map, spinning on its axis with its axial tilt. Tapping a
picture flies the whole picture to the centre of the screen at full size,
still moving; tap again (or Esc) to send it back. The book lies on a starfield backdrop. Engine tilt/parallax is disabled in
`assets/css/planets.css`; no engine files are changed.

Textures are baked as 1024×512 JPEG data URIs in `assets/js/tex/*.js`, so the
real surfaces show both over http and when opened straight from `file://`.

## Texture credits (exception to the "original vector only" rule)

This book deliberately ships real imagery, so it is the one documented
exception in `skills/asset-licensing.md`.

- Sun, Mercury, Venus, Earth (+ clouds), Moon, Mars, Jupiter, Saturn, Uranus,
  Neptune, Saturn's rings: **Solar System Scope** — https://www.solarsystemscope.com/textures/ —
  licensed **CC BY 4.0** (based on NASA mission data). Attribution required.
- Pluto: **NASA / Johns Hopkins APL / SwRI** (New Horizons colour map mosaic,
  via Wikimedia Commons) — public domain.
- Ceres: **NASA / JPL-Caltech / UCLA / MPS / DLR / IDA** (Dawn global map
  PIA19606, via Wikimedia Commons) — public domain.
- Asteroids and Kuiper Belt objects are irregular (lumpy, cratered, Haumea's
  egg shape, Arrokoth's two lobes) and drawn with a point-splat renderer.
- Charon and the asteroid / Kuiper Belt rocks reuse the Moon / Mercury / Pluto maps,
  tinted. Saturn's rings use the Solar System Scope ring map (CC BY 4.0), ray-traced onto the ring plane.

## Cover + social preview

`cover.png` (shelf card) and `og.png` (1200×630) are rendered from the same
real texture maps by `python3 books/space/preview.py` (Pillow + numpy). Re-run
it if the textures change.
