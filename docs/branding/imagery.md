# Imagery

The section emblems and the sharing cards. Read it before you draw an emblem or change a card. [`emblem-ideas.md`](../emblem-ideas.md) keeps the emblems drawn and not chosen.

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
| `ahwal`       | A grid of turning roads, with one lit path across it                         |
| `tibb`        | A honeycomb of hexagons, with the centre cell lit                            |
| `unproven`    | Three chains of narrators, and a fourth with a missing link                  |

## The sharing cards

Every page has a card for link previews: 1200 by 630, drawn at twice the scale (2400 by 1260), so it stays sharp after a chat app compresses it.

| Card                                     | File                                | What it shows                                                                   | Made by                    |
| ---------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| Home                                     | `public/opengraph.png`              | The mark and name, the `promise`, and every occasion's emblem                   | `bun run opengraph`        |
| A section                                | `public/opengraph-<id>.png`         | The mark and name, the section `title`, its count, and its emblem, on its color | `bun run opengraph`        |
| A dhikr                                  | `public/og/<id>/<slug>-<print>.png` | The section, the title, the count, the words, the moment, and the takhrij       | `bun run opengraph:adhkar` |
| Search, ما لم يثبت, الطب النبوي, and 404 | `public/opengraph.png`              | The home card                                                                   |                            |

- Every card shows the mark, «وِردي», and `wirdy.site`.
- A dhikr card carries its takhrij, because an image travels without its page ([`exceptions.md`](../exceptions.md#each-dhikr-has-a-card-named-by-its-fingerprint)).
- A section card shows its count, so run `bun run opengraph` when a dhikr comes in or goes out. A dhikr card is named by its fingerprint, and `content.test.ts` fails when one is missing.
