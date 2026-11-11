# A Fox's Year (`seasons`)

One red fox through the four seasons, three spreads per season, drawn in a
**realistic** style rather than the house cartoon look.

- `assets/js/furpaint.js` is the fur painter. It fills a silhouette with thousands of hair strokes that follow a flow, a colour and a light function.
- `assets/js/fox.js` builds the fox with `buildFox(cfg)`, where `pose`, `coat`, `light`, `eyes`, `head` and `flip`
  are separate fields. It also builds the kits (`kitBody`). Fur comes from SVG turbulence filters
  (furry edges plus streaks that follow the hair direction).
- `assets/js/nature.js` holds the landscape helpers: blurred plates, bokeh, grass, flowers, bracken,
  leaves and snowy pines. It also draws the small creatures (wood mouse, peacock butterfly, red
  squirrel, hedgehog, robin) and `Nature.anim`, which works like `buildAnim` but can also target a CSS selector.
- `assets/js/scenes.js` has the eight flat scene SVGs, built the race-book way.

All art is original vector. The reference photos stay in `.kiro/reference/seasons/`
and are never shipped. Music: `assets/audio/cello_concerto.mp3`, looped by the shared player. **Source/licence: TODO, confirm it is public domain or original and credit it here** (the project rule for audio).
