# Imagery

The section emblems, the sharing cards, and the promo films. Read it before you draw an emblem, change a card, or make a film. [`emblem-ideas.md`](../emblem-ideas.md) keeps the emblems drawn and not chosen.

## The emblems

Each section has one emblem in `src/lib/emblems.ts`. Every emblem is:

- A 240-unit square of flat geometric shapes.
- Dark shapes in black at a low opacity, and one lit shape in full eggshell.
- Drawn on its section's color. Only the lit shape moves on entry ([`code-conventions.md`](../code-conventions.md#motion)).

| Section       | Emblem                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| `sabah-masaa` | Two half suns on one line: a dark one sets under it, a lit one rises over it |
| `masjid`      | Arches inside arches, with a lit door at the foot                            |
| `fi-al-salah` | A prayer mat from above, with a lit niche at its head                        |
| `salah`       | 100 beads in rows: 99 in three shades of 33, and the hundredth lit           |
| `nawm`        | A crescent among stars over a dark hill                                      |
| `istiqaz`     | A sun rising at the foot, with its rays                                      |
| `mutlaq`      | One unbroken line that turns inward, with no end                             |
| `mawasim`     | Three rings around a lit square, as the طواف goes around the Kaaba           |
| `taam`        | A bowl with a lit lid over it                                                |
| `bayt`        | A house with two windows, and a lit door at its foot                         |
| `safar`       | A road that climbs and falls, lit at its highest pass                        |
| `nas`         | Squares turned every way around one lit square that holds still              |
| `hamm`        | Darkness inside darkness inside darkness, with a lit point at the heart      |
| `marad`       | A block with a round gap, and the lit piece that fits it                     |
| `janaiz`      | Lives of different lengths from one edge, and one lit, ended at its term     |
| `matar`       | Clouds rising over the horizon, the lit one nearest                          |
| `tibb`        | A honeycomb of hexagons, with the centre cell lit                            |

## The sharing cards

Every page has a card for link previews: 1200 by 630, drawn at twice the scale (2400 by 1260), so it stays sharp after a chat app compresses it.

| Card           | File                                | What it shows                                                                                                 | Made by                    |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Home           | `public/opengraph/home-<print>.png` | The mark, the name, and the domain on paper, beside every section's emblem in a 3 by 3 mosaic of their colors | `bun run opengraph`        |
| A section      | `public/opengraph/<id>-<print>.png` | The navbar's mark and name, the section `title`, its count, and its emblem, on its color                      | `bun run opengraph`        |
| A dhikr        | `public/og/<id>/<slug>-<print>.png` | The section, the title, the count, the words, the moment, and the takhrij                                     | `bun run opengraph:adhkar` |
| A hadith       | `public/og/tibb/<slug>-<print>.png` | The section, the title, the words, the narrator, and the takhrij                                              | `bun run opengraph:adhkar` |
| Search and 404 | `public/opengraph/home-<print>.png` | The home card                                                                                                 |                            |

- Every card shows the mark, «وِردي», and `wirdy.site`.
- A dhikr card carries its takhrij, because an image travels without its page ([`exceptions.md`](../exceptions.md#each-dhikr-has-a-card-named-by-its-fingerprint)).
- Every card is named by its fingerprint, a hash of what it prints (`src/lib/card.ts`), so a changed card gets a new URL that no chat app or cache has kept. A page links the name it computes, and the build test fails when that file is missing: run `bun run opengraph` when a section's title, color, count, or emblem changes, and `bun run opengraph:adhkar` for a dhikr. Raise `SITE_TEMPLATE` or `TEMPLATE` when only the drawing changes.
- Every element sits 64 px from the sides and 56 px from the top and bottom (at 1x), so X's 2:1 crop and rounded corners cut nothing but color. A section card draws the mark as its navbar does, in cream, and counts the adhkar as the home page does, leaving out the evening-only forms.

## The promo films

A promo film is a short vertical video of the site, or one of its features, for X, TikTok, and Snapchat: 1080 by 1920, 30 fps, 15 to 30 seconds, with no music and no voice.

- Every screen in it is the real site, recorded on an iPhone simulator.
- Its titles, colors, emblems, mark, fonts, and motion are the site's own, drawn from `src/lib/` and `src/styles/tokens.css` by `scripts/promo/`.
- Its words follow [`identity.md`](identity.md): they say what a thing is and never claim more.
- The `making-a-promo` skill (`.claude/skills/making-a-promo/SKILL.md`) is the procedure, and [`exceptions.md`](../exceptions.md#promo-films-render-from-html-in-a-headless-browser) says why it renders from HTML.
