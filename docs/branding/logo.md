# Logo

The sunflower mark, the wordmark, and the icons drawn from them. Read it before you draw, place, or export the mark.

## The mark

A sunflower from the front: a ring of 12 round petals around a round disc. A young sunflower follows the sun from rise to set, so it keeps the morning and the evening, as a wird does.

`src/lib/mark.ts` draws it, and every other drawing comes from that file.

| Part   | Value                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| Canvas | `64` by `64`, centred on `32, 32`                                                  |
| Petals | `12` circles of radius `6.4`, on a ring of radius `21.5`, the first one at the top |
| Disc   | `1` circle of radius `12.5` in the centre                                          |
| Colors | Petals `PALETTE.petal`, disc `PALETTE.disc` ([Color](color.md))                    |

- The disc takes the color of the first section, «الصباح والمساء», so the mark and the first card match.
- On a colored bar (`<Mark inks="stage">`), the petals are eggshell and the disc black at 24%, so the shape holds on any section color.
- On the home page's bar, once the cards reach it, the mark turns to `<Mark inks="plain">`: the petals in the text color (`currentColor`) and the disc black at 24%, the stage mark on the paper.
- On a section's sharing card, the mark sits on an eggshell disc, in its own colors.
- Never rotate, stretch, or outline the mark, change the petal count, or recolor one part alone.

## The wordmark

«وِردي» in IBM Plex Sans Arabic, weight 700, after the mark (to its left in right-to-left text), `--space-2` apart. The bar raises the name by `--space-lift-brand`, because its kasra and the dots of its ي hang low ([`design-system.md`](../design-system.md#tokens)).

- The mark and the name lead home, at the start of every bar.
- The mark alone stands for the site where the name does not fit: the favicon, the touch icon, and a dhikr card's foot.

## The icons

`bun run icons` draws every icon from `markSvg()`. Never edit them by hand.

| File                   | Size           | What it is                                                           |
| ---------------------- | -------------- | -------------------------------------------------------------------- |
| `favicon.svg`          | any            | `markSvg()` itself                                                   |
| `favicon.ico`          | 16, 32, and 48 | The mark on a clear ground                                           |
| `favicon-32x32.png`    | 32 by 32       | The mark on a clear ground                                           |
| `apple-touch-icon.png` | 180 by 180     | The mark at 72% on eggshell, opaque, so iOS does not put it on black |
| `icon-192.png`         | 192 by 192     | The touch icon, for the manifest                                     |
| `icon-512.png`         | 512 by 512     | The touch icon, for the manifest, also maskable                      |

`src/build.test.ts` checks that the header mark and the favicon share their petals, every declared icon ships, and the touch icon is opaque.
