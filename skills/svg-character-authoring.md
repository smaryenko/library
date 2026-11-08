# Skill: original SVG character authoring (detailed, kid-friendly style)

**When to use:** drawing any new character or prop builder — a function that
returns a layered `data-part` SVG string for the pseudo-3D rig.

This is the house style. It keeps every book visually consistent and keeps the
parts ready for `mountObject`.

## Detailed & believable, within a kid-friendly style

The target is a **warm, kid-friendly storybook illustration that is RICHLY
DETAILED and believable** — not stark photorealism, and not a flat, minimal
cartoon either. It can still be a little stylised/cute so it's friendly for
children, but it must have the detail and shading of a real illustration.

The thing to avoid is **under-detailed, flat, "placeholder" art**: a rug that is
one plain rectangle, a face that is two dots, an object with a single flat fill.
Those read as unfinished. Push toward detail and volume.

Where the line sits:

- **Detailed over minimal.** A shaggy rug has hundreds of pile strands, a fringe,
  and soft pile shading — not one rectangle. A tree has layered boughs, baubles,
  lights, a star — not a green triangle. Add the small, characterful details a
  real version would have.
- **Believable form and lighting.** Rounded, dimensional shapes built with
  layered gradients, core shadows, occlusion where parts join, and considered
  highlights from a consistent light direction — not a single flat fill.
- **Faces with real structure.** Eyes with lids, a catchlight and a hint of iris
  depth; a nose with bridge, shadow and highlight; natural brows; soft,
  non-circular cheek shading. Big friendly cartoon eyes are fine — but drawn
  with structure, never flat dots or hard sticker-blush circles.
- **Read the material.** Fur, wood, metal, glass, fabric should each look like
  their material (grain, sheen, weave, specular), not a uniform colour swatch.
- **Stylised proportions are OK**; flat/under-detailed execution is not. Keep it
  cute and approachable, but always finish it with real detail and shading.

> This supersedes the earlier "chunky-cute, keep-it-flat/minimal" guidance. If
> you find older notes favouring flat or deliberately simplified shapes, treat
> "detailed & believable, kid-friendly" as the current rule and update them when
> you touch them.

## How to achieve it (technique)

- **Fill-first silhouettes, then shade.** Still build each part as a clean
  filled shape — but carry real volume inside it. **No stroked squiggle
  outlines or scribbly inner hatching**; depth comes from gradient and shadow
  shaping, the way a painted illustration does.
- **Volume via layered gradients + occlusion.** A radial/linear base gradient
  (lit side → core → shadow rim) plus soft contact shadows where parts meet
  (head↔body, body↔belly, object↔ground). Add a secondary bounce/ambient tone
  so shadows aren't dead flat. This is what sells a form as solid.
- **Rich, naturalistic palette.** Give each character a believable base tone
  with a lighter lit value and a darker shadow value (plus subtle hue shift in
  shadow, not just a darker version of the same hex). A warm, friendly palette
  is welcome — just back it with real shading. Families of characters still vary
  by cfg (as the reindeer do), and each should look detailed and material.
- **Details are not optional.** Whatever a real version would have — texture,
  trim, fringe, seams, baubles, strands, catchlights — include a considered
  amount of it. If a part looks like a flat placeholder, it isn't done.

## Builder contract

- A builder is a function returning an **SVG string**, e.g. `buildThing(cfg)`.
- Every visual part is its own group: `<g data-part="...">…</g>`.
- Name parts by role so they slot into the shared `OBJ_DEPTH` map:
  back-to-front, e.g. `shadow`, body/base, mid detail, accessory, `head`,
  `ears`, `face`, `nose`, `hat`, top ornament.
- Prefer a single consistent `viewBox` and author at a fixed canvas size; place
  and scale sub-assemblies with transforms rather than re-authoring at size.

## Config, not forks

- Vary characters by a **cfg object**, not by copy-pasting a builder. The nine
  reindeer are one `buildReindeer(cfg)` driven by `fur` / `furDark` / `belly` /
  `antlerStyle` / `antlerColor` / `nose` / `accessory`.
- **Keep independent concerns as separate fields.** Hard rule learned here:
  antler **style** (`antlerStyle`) and antler **colour** (`antlerColor`) are
  two fields. An earlier version overloaded one `antler` field as both and
  rendered black when a style name was used as a colour. **Never merge them.**
  Apply the same discipline to any new "shape vs colour vs variant" axes.

## Organic branching geometry

See `3d-animation-from-reference.md` §4: offset a centre-line polyline by a
width function (`offsetStrip`), smooth with Catmull-Rom, enforce
branches-point-outward, author one side and mirror. Do not hand-place Bézier
handles for antlers/twigs/flames.

## Click animation — every picture gets one (REQUIRED)

Every builder MUST ship a **one-shot click animation**, and that animation
**lives inside the object's own SVG**. Tapping a pop-up image plays it (instead
of turning the page — the storybook engine routes image taps to the object's
`play()`); tapping anywhere else still flips the page.

- **The animation belongs to the character, and is distinct per character.** It
  expresses who they are: Dancer dances, Prancer prances (airy hoof-paw) while
  Donner's loudest stomp *quakes* the ground, an acrobat does a salto, Rudolph's
  nose glows, Turbo pops a wheelie, the kitchen car slips, the loop car laps the
  loop. Two characters must NOT reuse the same animation — pick a motion that
  fits each one's one-line caption.
- **Use the whole page.** Make the motion rich and large — travel across the
  spread, even off the page and back (cars drive off and return; a reindeer
  bolts off-left and gallops back in from the right). Add secondary motion
  (shadow squash/stretch, trailing parts, a glint) and **spawned effect
  elements** (crack, smoke, sparkles — see below) so it reads as alive, not a
  tiny shudder.
- **Shared building blocks, per-picture animations.** The *finished* animation
  still ships inside each object's own SVG (no global CSS, no keyframe
  registry), and no two characters do the same thing. But the *moves* it is
  composed from may come from the shared **Motion library**
  (`assets/js/motion.js`): parametric primitives distilled from the shipped
  books (`dash`, `hop`, `salto`, `osc`, `pulse`, `glowPulse`, `orbit`) plus newer
  ones (`approach`, `tumble`, `roll`, `jet`, `spiralRise`, `scuttle`, `recoil`,
  `duck`, `blink`, and fx `puff` / `spark` / `rise` / `show`), with combinators
  `within` (time window), `mix` (layer moves), `mirror`, `pick`, `amp`.
  Compose them with your own parameters and windows; add a new primitive to the
  library when a character needs a motion nobody has yet.
- **Limbs that travel AND move: use `Motion.rig` + `follow`.** Since one element
  can only run one track, a flipper can't be in both a "swim off the page"
  track and a "stroke" track. `Motion.rig({ dur, parts: { … } })` solves it:
  a member with `follow: 'turtle'` gets the parent's move composed with its own
  (each about its own pivot, written as one explicit transform), and every
  track in the rig is sampled on one shared time grid, so the limb stays
  attached. A member with `parts: []` is a virtual parent; `parts: [...]`
  drives several layers with one track. See `books/reef/assets/js/props.js`.
- **The animation may SPAWN new elements — it's not limited to the existing
  parts.** Add effect-only bits that appear just for the animation: a crack
  splitting the page under a stomp, exhaust/gas clouds puffing from a revving
  car, a sparkle burst, dust, speed lines, snow kicked up. Draw each as its own
  `data-part="fx-…"` group, **hidden at rest** (`opacity="0"`), and let the
  keyframes reveal + move + fade it only while `is-playing` (end back at
  opacity 0 so it vanishes when idle). Give `fx-*` parts a depth in `OBJ_DEPTH`
  (there are ready-made keys: `fx-ground`, `fx-back`, `fx-mid`, `fx-front`,
  `fx-spark`) so they sit on the right plane. A small helper that emits only the
  FX for the current anim key keeps the builder tidy (see `animFX()` in
  `reindeer.js`/`car.js`). These extras are what make a beat feel rich — lean
  on them.
- **How to author it:** use the shared `buildAnim(uid, { tracks: [...] })`
  helper (`assets/js/anim.js`). Each track names the `parts` that move, a
  `transform-origin`, the keyframe body, and the timing. It returns a scoped
  `<style>` block (keyframe names carry the builder's `uid` so several objects
  on one spread never collide). Drop the returned string inside the `<svg>`,
  right after `</defs>` — it has no `data-part`, so the rig copies it into every
  split layer and the per-part rules fire on the matching layer.
- **How it fires:** the engine adds `is-playing` to each layer's `<svg>` on tap
  and clears it once every track has ended, so it can replay. By default
  `buildAnim` uses `transform-box: view-box`, so a track's `transform-origin` is
  in the SVG's own viewBox coordinates and several parts can share one pivot
  (e.g. all the legs swing about the hooves). Pass `box: 'fill-box'` on a track
  when a part should pivot about ITSELF (a wheel spinning on its hub: origin
  `50% 50%`).
- Keep it **self-contained** (returns to rest) and reasonably snappy
  (~0.8–1.8s). It can be a big, full-page beat — just land back where it
  started so a re-tap always replays cleanly.
- **Off-page travel:** to make an object drive/leap off one side and return
  from the other, jump between two adjacent keyframe stops while it's
  off-screen (e.g. `34%{…translateX(-420px)…} 35%{…translateX(420px)…}`). The
  stage/viewport clips the overflow, so it genuinely exits and re-enters.

A single-page prop/scene (tree, fireplace, a track section) counts as a picture
too — animate its most alive element (the star twinkles, the fire flickers, the
scene's car does the thing the caption says).

### Animation gotchas (these cost a whole session on the reef book)

- **One element = one track.** A CSS `animation` shorthand is NOT additive: a
  second `animation` rule on the same element REPLACES the first. So a part
  cannot be in both a "whole-body move" track and its own "fin flutter" track —
  the flutter wins and the part stops travelling with the body (the reef
  clownfish's tail detaching). Put each part in exactly one track; if you want a
  limb to flutter *and* travel, bake both into that limb's single track, or move
  the whole character as one group and skip the per-limb flutter.
- **Animated transform REPLACES a static `transform` attribute.** If a group has
  `transform="translate() scale()"` for placement AND an animation whose
  keyframes set `transform`, the placement is discarded while playing — the
  thing jumps to the origin and (if the keyframe scales) just enlarges in place.
  Fix: placement on an outer **no-`data-part`** `<g>`, animate the inner group;
  or author the character at its home position and let keyframes translate from
  there (how the car scenes do it).
- **`transform-box`:** `view-box` (default) measures `transform-origin` in the
  SVG's viewBox coords — good for rotating several parts about one shared pivot.
  `fill-box` measures it against the element's own bbox (origin `50% 50%`) —
  good for a part spinning/scaling about ITSELF (a wheel, a puff). Picking the
  wrong one is why a "spin" rotates about the page corner instead of the hub.
- **Verify animation by freezing mid-playback, not just the rest frame.** A
  resting screenshot looks fine while the motion is broken. Render, call the
  object's `play()`, pause the running animations at ~40–60% (set
  `getAnimations()` currentTime), and screenshot THAT. The reef "everything just
  enlarges" bug was only visible mid-animation.

## Match the reference, then check against it

When the user supplies a reference image, the target is to **look like that
reference**, not a generic cute version of the animal. Open the reference
(convert webp/avif via `sips -s format png`), note its distinguishing features
(seahorse: head-right, long down-snout, crown spikes, spiny back ridge, bony
ring segments, forward tail coil), and reproduce those specific features. Then
render your result next to the mental checklist of those features and fix what's
missing. "Reads as roughly a seahorse" is not the bar when a reference exists.

## When something is hard, look at the shipped books FIRST

Before inventing machinery (a new composer, a new animation scheme, a new layer
model), read how `books/race/` and `books/xmas/` already do the same thing. The
reef book got hard and buggy precisely because it reinvented multi-character
composition instead of copying the race book's one-flat-SVG + `data-part` role
+ `sceneAnim` pattern. The engine rewards flat, role-named `data-part` groups in
a single scene SVG; it punishes nesting and per-character sub-SVGs.

## Licensing

Original vector only. Stock images are **style references**, never traced,
embedded, or shipped. See `asset-licensing.md`.

## Checklist

- [ ] **Detailed & believable, kid-friendly** — never a flat, under-detailed
      placeholder (no one-rectangle rug, no two-dot face).
- [ ] **Faces with real structure** (eyes with lids/catchlight, shaded nose,
      natural brows, soft non-circular cheeks) — friendly, but not flat dots.
- [ ] Material + detail present (texture, trim, strands, highlights) as a real
      version would have.
- [ ] One builder, cfg-driven; no forked copies per variant.
- [ ] Every part a `data-part` group, named for the depth map.
- [ ] Fill-first shapes; real volume via layered gradients, core shadows, and
      contact/occlusion at joins (not a single flat fill).
- [ ] Independent axes kept as separate cfg fields (never merged).
- [ ] Original vector; nothing traced or shipped.
- [ ] **A one-shot click animation, authored via `buildAnim`, embedded in the
      object's own SVG, fitting the character/caption. Never shared or global.**
- [ ] Rich & full-page: large travel (off-page OK), secondary motion, and
      **spawned `fx-*` effect elements** (crack, smoke, sparkle…) where they add
      life — hidden at rest, revealed only while playing.
