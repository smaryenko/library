// XMAS book — the page roster.
//
// This is the only content the shared storybook engine needs for this book:
// an ordered list of pages. Each page is either an OBJECT page
// { title, body, build } where build() returns a layered data-part SVG string
// (via this book's character builders), or a TEXT-ONLY page
// { textOnly, left, right }. The engine (assets/js/storybook.js) reads
// window.BOOK_PAGES and handles layout, flipping, tilt, and the music/backdrop
// (wired from the manifest). Adding/removing a page here does not touch the
// engine.
//
// Story order: tree -> Santa -> elf -> a text-only interlude -> the nine
// reindeer (Dasher ... Rudolph) -> the fireplace finale. The nine reindeer are
// one buildReindeer(cfg) each (same DNA, distinct characters: fur / antlerStyle
// / nose / accessory). Facts are short, kid-friendly. Only Rudolph's nose is
// red.

(function () {
  'use strict';

  const deer = cfg => () => buildReindeer(cfg);

  window.BOOK_PAGES = [
    {
      title: 'Christmas', body: 'is near',
      build: () => buildTree()
    },
    {
      title: 'Santa', body: 'is on his way',
      build: () => buildSanta()
    },
    {
      title: 'Elves', body: 'work hard in the workshop',
      build: () => buildElf()
    },
    {
      // Text-on-both-sides interlude: the sentence flows across the spread,
      // left page -> right page, leading into the reindeer roster.
      textOnly: true,
      left: { bodyHtml: 'To deliver every <span class="hl">present</span>,' },
      right: { bodyHtml: '<span class="hl">Santa</span> needs his <span class="hl">nine reindeer</span>.' }
    },
    {
      title: 'Dasher', body: 'is super speedy!',
      build: deer({ fur: '#A9743B', furDark: '#8A5A28', belly: '#E9CBA0',
        antlerStyle: 'wide', antlerColor: '#7a4a2b',
        nose: 'brown', accessory: 'scarf-ice' })
    },
    {
      title: 'Dancer', body: 'loves to dance.',
      build: deer({ fur: '#C08A4E', furDark: '#9C6C34', belly: '#F0D6AE',
        antlerStyle: 'tall', antlerColor: '#8a5a33',
        nose: 'brown', accessory: 'scarf-plum' })
    },
    {
      title: 'Prancer', body: 'prances about.',
      build: deer({ fur: '#8C6239', furDark: '#6E4A26', belly: '#E4C49A',
        antlerStyle: 'bushy', antlerColor: '#5f3c22',
        nose: 'brown', accessory: 'scarf-pine' })
    },
    {
      title: 'Vixen', body: 'is playful.',
      build: deer({ fur: '#CDA06A', furDark: '#A67C45', belly: '#F3DEBD',
        antlerStyle: 'bushy', antlerColor: '#8a5a33',
        nose: 'brown', accessory: 'collar' })
    },
    {
      title: 'Comet', body: 'zooms by like a star.',
      build: deer({ fur: '#9A9FA8', furDark: '#767C86', belly: '#E6E9EF',
        antlerStyle: 'tall', antlerColor: '#6b7079',
        nose: 'brown', accessory: 'scarf-gold' })
    },
    {
      title: 'Cupid', body: 'is the sweetest.',
      build: deer({ fur: '#B06A52', furDark: '#8C4F3C', belly: '#F2D2C0',
        antlerStyle: 'wide', antlerColor: '#7a4030',
        nose: 'brown', accessory: 'scarf-red' })
    },
    {
      title: 'Donner', body: 'has the loudest stomp.',
      build: deer({ fur: '#6E4A2E', furDark: '#543825', belly: '#D8BB92',
        antlerStyle: 'bushy', antlerColor: '#4a301e',
        nose: 'brown', accessory: 'santa-hat' })
    },
    {
      title: 'Blitzen', body: 'is quick as light.',
      build: deer({ fur: '#7C8796', furDark: '#5C6676', belly: '#DCE2EA',
        antlerStyle: 'tall', antlerColor: '#565f6b',
        nose: 'brown', accessory: 'collar' })
    },
    {
      title: 'Rudolph', body: 'has a shiny red nose.',
      build: deer({ fur: '#A9743B', furDark: '#8A5A28', belly: '#E9CBA0',
        antlerStyle: 'wide', antlerColor: '#7a4a2b',
        nose: 'red', accessory: 'scarf-red' })
    },
    {
      title: 'Merry Christmas!', body: '',
      build: () => buildFireplace()
    }
  ];
})();
