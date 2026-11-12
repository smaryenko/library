# Book: trains — Trains Through Time

A non-fiction book: how trains evolved, oldest to newest, told as one
connected story. 16 spreads: a station clock intro, 14 real trains, and a toy
train ending ("And the next train? Maybe you'll build it.").

Unlike the drawn books, every picture is a **real colour photo turned into a
pop-up cut-out** (see `skills/photo-cutout-books.md`).

## Contents

```
books/trains/
  index.html              entry page
  pages.js                the 16-page roster (window.BOOK_PAGES)
  cover.png, og.png       shelf card + social image: the toy-train page as it
                          looks in the book (cut-out lifted off the photo)
  favicon.svg             steam locomotive on rails at dusk
  img/*.jpg               1500×1000 photo crops, one per page (clock, horse,
                          rocket, jupiter, mail, alberni, mallard, diesel,
                          electric, shinkansen, underground, funicular,
                          monorail, maglev, doubledecker, toy)
  assets/
    js/backdrop.js        railway at dusk (viaduct train, rails, poles, signal)
    js/photocut.js        buildTrain(cfg): photo → layered cut-out SVG
    js/scenes.js          trains 1–7 (horse tram … diesel)
    js/scenes2.js         trains 8–14, the station clock, the toy train
    audio/train.mp3       looping train sound
  preview/                early experiments, kept as backups:
                          photo.html (canvas cut-outs), three.html (three.js)
```

## Page order

Clock → Horse Tram → The Rocket → Jupiter → Mail Car → Logging Engine →
Mallard → Diesel → Electric → Shinkansen → Underground → Funicular →
Monorail → Maglev → Double-Decker → The Next Train (wooden toy train).

## Notes

- Cut polygons are hand-traced in 1500×1000 crop pixels from gridded photos.
- The clock photo had its own hands painted out (`img/clock.jpg`); the hands
  are drawn back on top as `tr-hand-*` layers so each can spin on its own.
- Each tap animation is unique: the horse trots, smoke and steam puff, the
  Jupiter bell rings, envelopes fly from the mail car, the GG1 sparks, the
  Underground windows light up, the maglev lifts on a magnetic shimmer, the toy
  train rolls forward…
- Photos come from Wikimedia Commons; the owner chose to ship them without
  credits (see `skills/asset-licensing.md`). The sound is from the owner's own
  reference files.
