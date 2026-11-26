# Color

Every brand color, and the rule that makes each section's color. Read it before you add or change a color. [`design-system.md`](../design-system.md#color-of-an-occasion) has the full rule and its CSS.

## The palette

`src/lib/palette.ts` holds these, and `src/styles/tokens.css` the same values for CSS. A test keeps the two equal, and `src/lib/branding.test.ts` keeps this table equal to them.

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

Dark mode changes the paper, the panel, and the ink in `tokens.css`, not the mark, the eggshell, or a section's hue. At night a section color takes 10% black, so it does not glare.

## The color of a section

No section color is typed by hand. `src/lib/tone.ts` computes each in OKLCH from the section's place on the list:

- Lightness `0.52` and chroma `0.086` for every section, so eggshell text keeps 4.5:1 or more, and no section looks louder.
- The hue walks a 300° arc that skips the olive tones, from 47° for the first section, in steps near the golden ratio, so neighbours differ.

The rule gives these now. A new section changes them all.

| Section       | Heading        | Color     | Hue  |
| ------------- | -------------- | --------- | ---- |
| `sabah-masaa` | الصباح والمساء | `#91593c` | 47°  |
| `masjid`      | الأذان والمسجد  | `#337095` | 238° |
| `fi-al-salah` | أثناء الصلاة    | `#93535e` | 10°  |
| `salah`       | بعد الصلاة      | `#0c777d` | 201° |
| `nawm`        | عند النوم      | `#86567f` | 332° |
| `istiqaz`     | عند الاستيقاظ   | `#31785b` | 163° |
| `mutlaq`      | كل وقت         | `#6c5f95` | 295° |
| `mawasim`     | المواسم والحج  | `#8b5e2e` | 66°  |
| `taam`        | الطعام والشراب | `#486a9a` | 257° |
| `bayt`        | البيت والأهل    | `#94554c` | 28°  |
| `safar`       | الخروج والسفر  | `#1c748b` | 220° |
| `nas`         | الناس والمجالس | `#8e536f` | 351° |
| `hamm`        | الهم والغضب    | `#1a796d` | 182° |
| `marad`       | المرض والرقية  | `#7a5a8c` | 313° |
| `janaiz`      | الجنائز        | `#487649` | 145° |
| `matar`       | المطر والريح   | `#5b649a` | 276° |
| `tibb`        | الطب النبوي    | `#836328` | 80°  |

«الطب النبوي» has the same lightness as the occasions, and chroma at the petals' hue (80°), the yellow the arc skips, so it sits apart from the adhkar and beside the mark.

## Where the colors go

- A section color fills its bar, banner, card, emblem tile, and sharing card, with eggshell text.
- The paper and the panel carry the rest. On the paper, the mark keeps its two colors.
- The home card is on the paper, a section card on its section's color, and a dhikr card has a band of its section's color over a panel.
