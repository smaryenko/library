# Pop-up Castle

A pop-up book on the shared engine (`popup` layout). It's a pilot for now:
one spread, Harbourtown, built the way a real pop-up is made. A printed
ground lies on the paper and separate die-cut pieces stand on it at
different depths. There's no background rectangle, so the paper shows
between the pieces.

**Story (planned).** On the day of the Great Fair, Tom the apprentice and his
dog Pip carry the mended banner across Harbourtown to the castle, with a
detour through a sleeping dragon's den.

## How a spread is built (`assets/js/popup.js`)

- `ground()`: the printed page art (meadow, cobbled road, harbour, quay)
  as flat SVG. storybook.js puts it inside the tilted book, so it lies in
  perspective.
- `build()`: one SVG with `data-floor="520"`. Each piece is a `<g data-part>`
  holding a die-cut photo, a contact shadow and a cast shadow on the
  ground. Pieces are placed by where they stand on the ground, `(u, v)`.
  The engine maps scene rows 520..1000 onto the page, far edge to near edge.
- On a page turn each piece folds up from its base (`popup-fold` in
  book.css). Tapping the spread rocks the cog and sways the oaks.

## Making a cut-out

The pipeline is local only, in `.kiro/` (gitignored):
1. Remove the background with `rembg` (`isnet-general-use` model).
2. Run `die.py`: it hardens the alpha, fills holes (except for the tree and
   the ship), keeps the largest piece, takes colours from the original
   photo, and adds a white paper rim with a thin grey cut line.
3. Save as WebP in `assets/img/`.

## Photo credits

All photos are from Wikimedia Commons, cut out and given a paper rim.

| File | Source | Author | Licence |
|------|--------|--------|---------|
| castle.webp | [Castle Neuschwanstein.jpg](https://commons.wikimedia.org/wiki/File:Castle_Neuschwanstein.jpg) | Softeis | CC BY-SA 3.0 |
| cog.webp | [Ubena von Bremen Kiel2007 1.jpg](https://commons.wikimedia.org/wiki/File:Ubena_von_Bremen_Kiel2007_1.jpg) | VollwertBIT | CC BY-SA 2.5 |
| house-corner.webp | [Plönlein, Rothenburg ob der Tauber, 2023-06-17, DD 38.jpg](https://commons.wikimedia.org/wiki/File:Pl%C3%B6nlein,_Rothenburg_ob_der_Tauber,_Alemania,_2023-06-17,_DD_38.jpg) | Diego Delso | CC BY-SA 4.0 |
| house-hall.webp | [Ötisheim - Schönenberger Straße 1 - Giebel und Traufe - 2020-07-18.jpg](https://commons.wikimedia.org/wiki/File:%C3%96tisheim_-_Sch%C3%B6nenberger_Stra%C3%9Fe_1_-_Giebel_und_Traufe_-_2020-07-18.jpg) | SteveK | CC BY-SA 4.0 |
| house-red.webp | [Ötisheim - Schönenberger Straße 9 - Giebel - 2020-07-18.jpg](https://commons.wikimedia.org/wiki/File:%C3%96tisheim_-_Sch%C3%B6nenberger_Stra%C3%9Fe_9_-_Giebel_-_2020-07-18.jpg) | SteveK | CC BY-SA 4.0 |
| house-narrow.webp | [Quedlinburg, Fachwerk-Wohngebäude 2023, 04.jpg](https://commons.wikimedia.org/wiki/File:Quedlinburg,_Fachwerk-Wohngeb%C3%A4ude_2023,_04.jpg) | Wilhelm Zimmerling PAR | CC BY-SA 4.0 |
| oak.webp | [Hain Eiche Herbst 121696.jpg](https://commons.wikimedia.org/wiki/File:Hain_Eiche_Herbst_121696.jpg) | Ermell | CC BY-SA 4.0 |

The CC BY-SA licences also apply to the derived cut-outs. The printed
ground, the backdrop and `cover.png` / `og.png` (composited from these
cut-outs) are original to this project. The `.kiro/reference/` images were
used for composition only.

No music track yet.
