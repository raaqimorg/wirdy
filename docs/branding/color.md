# Color

This doc holds every color of the brand and the rule that makes the color of each section. Read it before you add or change a color. [`design-system.md`](../design-system.md#color-of-an-occasion) has the rule in full and how the CSS uses it.

## The palette

`src/lib/palette.ts` holds these, and `src/styles/tokens.css` holds the same values for the CSS. A test keeps the two equal, and `src/lib/branding.test.ts` keeps this table equal to them.

| Key         | Value              | What it is                                                       |
| ----------- | ------------------ | ---------------------------------------------------------------- |
| `paper`     | `#d6d6cd`          | The page in light mode, and the browser bar                      |
| `paperDark` | `#060f13`          | The page in dark mode, and the browser bar                       |
| `panel`     | `hsl(60 10% 92%)`  | A card on the paper                                              |
| `eggshell`  | `#f4f1d0`          | Text and drawings on a section color, the lit shape of an emblem |
| `ink`       | `hsl(200 50% 5%)`  | Text                                                             |
| `inkMuted`  | `hsl(200 40% 22%)` | Secondary text                                                   |
| `shade`     | `#000`             | The dark shapes of an emblem, always at a low opacity            |
| `petal`     | `#d2a249`          | The petals of the mark. The one color outside the rule below     |
| `disc`      | `#91593c`          | The disc of the mark. It equals the color of «الصباح والمساء»    |

Dark mode changes the paper, the panel, and the ink in `tokens.css`. It does not change the mark, the eggshell, or the hue of a section. At night a section color is mixed with 10% black, so it does not glare.

## The color of a section

No section color is typed by hand. `src/lib/tone.ts` computes each one in OKLCH from the place of the section on the list:

- Lightness `0.52` and chroma `0.086` for every section, so eggshell text keeps at least 4.5:1 on each, and no section looks louder than another.
- The hue walks an arc of 300° that skips the olive tones, from 47° for the first section, in steps near the golden ratio, so neighbours on the list look different.

These are the colors the rule gives now. Adding a section changes them all.

| Section       | Heading        | Color     | Hue  |
| ------------- | -------------- | --------- | ---- |
| `sabah-masaa` | الصباح والمساء | `#91593c` | 47°  |
| `masjid`      | الأذان والمسجد  | `#1c748b` | 220° |
| `fi-al-salah` | أثناء الصلاة    | `#86567f` | 332° |
| `salah`       | بعد الصلاة      | `#487649` | 145° |
| `nawm`        | عند النوم      | `#486a9a` | 257° |
| `istiqaz`     | عند الاستيقاظ   | `#93535e` | 10°  |
| `mutlaq`      | كل وقت         | `#1a796d` | 182° |
| `ahwal`       | أحوال متفرقة   | `#6c5f95` | 295° |
| `unproven`    | لم يثبت        | `#5e6a77` | 250° |
| `tibb`        | الطب النبوي    | `#836328` | 80°  |

«لم يثبت» has the same lightness and almost no chroma (`0.025`), so it reads as grey beside the sections. «الطب النبوي» has the same lightness and chroma at the hue of the petals (80°), the yellow that the arc skips, so it sits apart from the adhkar and beside the mark.

## Where the colors go

- A section color fills its bar, its banner, its card, its emblem tile, and its sharing card. The text on it is eggshell.
- The paper and the panel carry everything else. The mark keeps its own two colors on the paper.
- The home card is on the paper. A section card is on the color of its section. A dhikr card has a band of the color of its section over a panel.
