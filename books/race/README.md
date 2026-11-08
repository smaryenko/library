# Book: race — Race Day

The second book on the shelf. A toy-car race told as one lap around a cozy
living room. It owns everything specific to this story; the page-turn engine,
tilt rig, and music player are shared (top-level `assets/`). See
`skills/book-authoring.md`.

## Contents

```
books/race/
  index.html                entry page (so books/race/ is a short link)
  pages.js                  the 14-page roster (cars → race sections → friendly tie)
  cover.svg                 shelf-card preview art (orange loop + two cars)
  favicon.svg               red-car-in-a-loop icon
  og.svg                    social preview image
  assets/
    js/
      backdrop.js           cozy living-room scene (mountLivingRoom)
      car.js                buildCar(cfg) — the four racers (one DNA, varied)
      props.js              buildHallway / buildRamp / buildKitchen / buildLoop /
                            buildFinish (the track-section scene pages)
```

## Cast (one buildCar DNA, varied by cfg)

- **Turbo** — red front-runner (number 1, flame stripe, wing).
- **Bolt** — blue chaser (number 7, tall spoiler).
- **Rusty** — yellow underdog (number 3, low spoiler, flames).
- **Jade** — green corner-carver (number 8, wing).

`buildCar(cfg)` keeps independent axes separate (never merged): `body`,
`bodyDark`, `cabin`, `windowTint`, `wheel`, `rim`, `number`, `numberColor`,
`spoiler` (`none|low|tall|wing`), `stripe` (`none|center|flames`).

## Story (14 pages)

Race Day → Turbo → Bolt → Rusty → Jade → *"r-r-r-r-rev your engines… GO!"* →
The Hallway → The Ramp → The Kitchen → The Carpet (*shaggy* rug) → The Loop →
*"neck and neck!"* → Photo Finish → **Everybody Wins!** (friendly tie, shared
podium).

## Notes

- Depth keys for the new car / prop parts were added **additively** to
  `OBJ_DEPTH` in the shared `assets/js/pseudo3d-object.js` (no existing key
  repurposed, so the xmas book is unaffected).
- **Music:** no cleared track yet. The manifest `track` is empty, so the music
  button stays idle for this book until a public-domain / original loop is
  supplied under `books/race/assets/audio/`.
- **Licensing:** all art is original vector authored here. The Hot Wheels brand,
  logo, and specific castings are deliberately NOT used — the cars are generic
  chunky toy racers. Reference images live only in gitignored `.kiro/reference/`.
  See `skills/asset-licensing.md`.
