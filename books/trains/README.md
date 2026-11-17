# Book: trains — Trains Through Time

A non-fiction book: how trains evolved, oldest to newest, told as one
connected story. 30 spreads: a station clock intro, 28 real trains, and a toy
train ending ("And the next train? Maybe you'll build it.").

Unlike the drawn books, every picture is a **real colour photo turned into a
pop-up cut-out** (see `skills/photo-cutout-books.md`).

## Contents

```
books/trains/
  index.html              entry page
  pages.js                the 30-page roster (window.BOOK_PAGES)
  cover.png, og.png       shelf card + social image: the toy-train page as it
                          looks in the book (cut-out lifted off the photo)
  favicon.svg             steam locomotive on rails at dusk
  img/*.jpg               1500×1000 photo crops, one per page (clock, horse,
                          rocket, jupiter, mail, alberni, mallard, diesel,
                          electric, shinkansen, underground, funicular,
                          monorail, maglev, doubledecker, toy, plus plow,
                          freight, container, carcarrier, lightrail,
                          tramtrain, rack, worktrain, firetrain, tram,
                          crane, grinder, tankcar, tracklayer)
  img/crane-hook.png      the crane's hook, cut out with alpha (painted
                          out of crane.jpg so it can swing)
  assets/
    js/backdrop.js        railway at dusk (viaduct train, rails, poles, signal)
    js/photocut.js        buildTrain(cfg): photo → layered cut-out SVG
    js/scenes.js          trains 1–7 (horse tram … diesel)
    js/scenes2.js         trains 8–14, the station clock, the toy train
    js/scenes3.js         second batch: snowplow, freight, container, car
                          carrier, tank car, tram, light rail, tram-train, rack
                          railway, work train, track layer, railway crane, rail grinder,
                          fire train
    audio/train.mp3       looping train sound
```

## Page order

Three parts, then the toy-train ending:

1. History, horse to magnets: Clock → Horse Tram → The Rocket → Jupiter →
   Mail Car → Logging Engine → Rotary Snowplow → Mallard → Diesel →
   Electric → Shinkansen.
2. What trains carry, and the helpers that look after the track:
   Freight (CN) → Container (UP) → Car Carrier → Tank Car → Work Train →
   Track Layer → Railway Crane → Rail Grinder → Fire Train.
3. City and passenger trains: Double-Decker → Underground → Tram (Prague) →
   Light Rail (LA) → Tram-Train (Kassel) → Monorail → Maglev → Funicular →
   Rack Railway (Pilatus).

Then The Next Train (wooden toy train). Each part's first page says what
the part is about. Steam, smoke and snow use the billowing `plume()`
helper in `photocut.js`; the snowplow's rotor is drawn (scoops, hub)
over the photo so it reads clearly while it spins.

## Notes

- Cut polygons are hand-traced in 1500×1000 crop pixels from gridded photos.
- The clock photo had its own hands painted out (`img/clock.jpg`); the hands
  are drawn back on top as `tr-hand-*` layers so each can spin on its own.
  The crane's hook is done the same way: painted out of `img/crane.jpg`
  and drawn back from `img/crane-hook.png` as a `tr-top` part.
- `img/lightrail.jpg` has the orange METRO destination text painted out.
- `img/tankcar.jpg` is cropped just right of the rail worker in the source
  photo, so no person is in it; `img/tracklayer.jpg` had two tiny background
  workers painted out.
- Each tap animation is unique: the horse trots, smoke and steam puff, the
  Jupiter bell rings, envelopes fly from the mail car, the GG1 sparks, the
  Underground windows light up, the maglev lifts on a magnetic shimmer, the
  snowplow fan spins out a snow cloud, the containers hop, the Pilatus car
  clicks uphill on a turning cog, the work-train crane lifts, the big crane hook swings, the
  grinder throws sparks, the tram's pantograph crackles, the fire train's
  roof cannon sprays, the toy train rolls forward…
- Photos come from Wikimedia Commons; the owner chose to ship them without
  credits (see `skills/asset-licensing.md`). The sound is from the owner's own
  reference files.
