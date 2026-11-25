# Logo

This doc holds the sunflower mark, the wordmark, and the icons drawn from them. Read it before you draw, place, or export the mark.

## The mark

The mark is a sunflower seen from the front: a ring of 12 round petals around a round disc. A young sunflower faces the sun as it rises and follows it until it sets, so it keeps the morning and the evening, as a wird does. The 🌻 in the README is the same idea.

`src/lib/mark.ts` draws it, and every other drawing of it comes from that file.

| Part   | Value                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| Canvas | `64` by `64`, centred on `32, 32`                                                  |
| Petals | `12` circles of radius `6.4`, on a ring of radius `21.5`, the first one at the top |
| Disc   | `1` circle of radius `12.5` in the centre                                          |
| Colors | Petals `PALETTE.petal`, disc `PALETTE.disc` ([Color](color.md))                    |

- The disc has the color of the first section, «الصباح والمساء», so the mark and the first card belong together.
- On a colored bar (`<Mark inks="stage">`), the petals are eggshell and the disc is black at 24%, so the mark keeps its shape on any section color.
- On a sharing card of a section, the mark sits on an eggshell disc, in its own colors.
- Do not rotate the mark, stretch it, add an outline, change the number of petals, or recolor one part alone.

## The wordmark

The wordmark is «وِردي» in IBM Plex Sans Arabic, weight 700, after the mark (to its left in right-to-left text), with `--space-2` between them. The bar raises the name by `--space-lift-brand`, because its kasra and the dots of its ي hang low ([`design-system.md`](../design-system.md#tokens)).

- The mark and the name together lead to the home page, at the start of the bar of every page.
- The mark alone stands for the site where the name does not fit: the favicon, the touch icon, and the foot of a dhikr card.

## The icons

`bun run icons` draws every icon from `markSvg()`. Do not edit them by hand.

| File                   | Size           | What it is                                                           |
| ---------------------- | -------------- | -------------------------------------------------------------------- |
| `favicon.svg`          | any            | `markSvg()` itself                                                   |
| `favicon.ico`          | 16, 32, and 48 | The mark on a clear ground                                           |
| `favicon-32x32.png`    | 32 by 32       | The mark on a clear ground                                           |
| `apple-touch-icon.png` | 180 by 180     | The mark at 72% on eggshell, opaque, so iOS does not put it on black |
| `icon-192.png`         | 192 by 192     | The same as the touch icon, for the manifest                         |
| `icon-512.png`         | 512 by 512     | The same, for the manifest, also as the maskable icon                |

`src/build.test.ts` checks that the header mark and the favicon have the same petals, that every declared icon ships, and that the touch icon is opaque.
