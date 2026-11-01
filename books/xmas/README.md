# Book: xmas — Christmas Storybook

This is the first book on the shelf. It owns everything specific to the
Christmas story; the page-turn engine, tilt rig, and music player are shared
(top-level `assets/`). See `skills/book-authoring.md`.

## Contents

```
books/xmas/
  index.html                entry page (so books/xmas/ is a short link)
  pages.js                  the 14-page roster (tree → Santa → elf → reindeer → fireplace)
  cover.svg                 shelf-card preview art
  favicon.svg               reindeer-head icon (moved from assets/favicon.svg)
  og.svg                    social preview image (raster og.png: nice-to-have)
  assets/
    js/
      backdrop.js           winter night + snow scene (mountWinter; was winter.js)
      reindeer.js           buildReindeer(cfg) — the nine reindeer
      tree.js               buildTree
      santa.js              buildSanta
      elf.js                buildElf
      fireplace.js          buildFireplace
    audio/
      carol_of_the_bells.mp3  looping track (moved from assets/)
```

## Status

Migrated and wired. The top-level `index.html` is the shelf; this book runs
from `books/xmas/index.html` (so `books/xmas/` is a short link), which loads the
shared engine (`../../assets/`) plus the per-book content here. `og.svg` is in
place and referenced by the `og:image` meta; a raster `og.png` export is a
nice-to-have for the widest social-scraper support. See `.kiro/TODO.md` for the
migration checklist and the remaining folder-rename step.
