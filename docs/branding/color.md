# Color

Every brand color, and the rule that makes each section's color. Read it before you add or change a color. [`design-system.md`](../design-system.md#color-of-an-occasion) has the full rule and its CSS.

## The palette

`src/lib/palette.ts` holds these, and `src/styles/tokens.css` the same values for CSS. A test keeps the two equal, and `src/lib/branding.test.ts` keeps this table equal to them.

| Key             | Value                     | What it is                                                       |
| --------------- | ------------------------- | ---------------------------------------------------------------- |
| `paper`         | `#d6d6cd`                 | The page in light mode, and the browser bar                      |
| `paperDark`     | `#060f13`                 | The page in dark mode, and the browser bar                       |
| `panel`         | `hsl(60 10% 92%)`         | A card on the paper                                              |
| `panelDark`     | `hsl(200 32% 15%)`        | A card on the paper in dark mode, and a dark poster              |
| `eggshell`      | `#f4f1d0`                 | Text and drawings on a section color, the lit shape of an emblem |
| `ink`           | `hsl(200 50% 5%)`         | Text                                                             |
| `inkDark`       | `hsl(55 62% 89%)`         | Text in dark mode                                                |
| `inkMuted`      | `hsl(200 40% 22%)`        | Secondary text                                                   |
| `inkMutedDark`  | `hsl(60 10% 72%)`         | Secondary text in dark mode                                      |
| `inkFaint`      | `hsl(200 12% 35%)`        | The second ink of the home sentence, on the page and its card    |
| `line`          | `hsl(200 30% 20% / 0.35)` | A rule between parts, and the columns of a poster                |
| `lineDark`      | `hsl(60 10% 82% / 0.3)`   | The same rule in dark mode                                       |
| `toneInk`       | `30%`                     | The ink a section color takes to become text on a panel          |
| `toneInkDark`   | `45%`                     | The same share at night                                          |
| `toneShadeDark` | `10%`                     | The black a section color takes at night                         |
| `shade`         | `#000`                    | The dark shapes of an emblem, always at a low opacity            |
| `petal`         | `#d2a249`                 | The petals of the mark. The one color outside the rule below     |
| `disc`          | `#91593c`                 | The disc of the mark. It equals the color of «الصباح والمساء»    |

Dark mode changes the paper, the panel, the inks, and the line in `tokens.css`, not the mark, the eggshell, or a section's hue. At night a section color takes 10% black, so it does not glare. The dark keys exist for the posters, which draw a dark paper outside the page, so they read the same tokens the page does.

## The color of a section

No section color is typed by hand. `src/lib/tone.ts` computes each in OKLCH from the section's place on the list:

- Two depths: lightness `0.52` with chroma `0.086`, or lightness `0.46` with chroma in the same share (`0.0761`). Eggshell text keeps 4.5:1 or more on both, the colored text keeps 4.5:1 day and night, and no section looks louder.
- The depths alternate along the arc in hue order, starting light at the first section, so the two nearest hues never share a depth and no two sections look alike.
- The hue walks a 300° arc that skips the olive tones, from 47° for the first section, in steps near the golden ratio, so neighbours differ.

The rule gives these now. A new section changes them all.

| Section       | Heading        | Color     | Hue  |
| ------------- | -------------- | --------- | ---- |
| `sabah-masaa` | الصباح والمساء | `#91593c` | 47°  |
| `masjid`      | الأذان والمسجد  | `#295e7e` | 238° |
| `fi-al-salah` | أثناء الصلاة    | `#93535e` | 10°  |
| `salah`       | بعد الصلاة      | `#086469` | 201° |
| `nawm`        | عند النوم      | `#86567f` | 332° |
| `istiqaz`     | عند الاستيقاظ   | `#28654c` | 163° |
| `mutlaq`      | كل وقت         | `#6c5f95` | 295° |
| `mawasim`     | المواسم والحج  | `#754f26` | 66°  |
| `taam`        | الطعام والشراب | `#486a9a` | 257° |
| `bayt`        | البيت والأهل    | `#7d4740` | 28°  |
| `safar`       | الخروج والسفر  | `#1c748b` | 220° |
| `nas`         | الناس والمجالس | `#78465d` | 351° |
| `hamm`        | الهم والغضب    | `#1a796d` | 182° |
| `marad`       | المرض والرقية  | `#674b76` | 313° |
| `janaiz`      | الموت والجنائز | `#487649` | 145° |
| `matar`       | المطر والريح   | `#4c5482` | 276° |
| `jumuah`      | سنن الجمعة     | `#575d28` | 115° |
| `tibb`        | الطب النبوي    | `#836328` | 80°  |

The two guides sit in the band the arc skips, so they move no occasion. «الطب النبوي» takes the depth after the last hue on the arc, at the petals' hue (80°), so it sits beside the mark. «سنن الجمعة» takes the deep lightness at 115°, the moss green farthest from every other tone (0.063 in OKLab).

## Where the colors go

- A section color fills its bar, banner, card, emblem tile, and sharing card, with eggshell text.
- The paper and the panel carry the rest. On the paper, the mark keeps its two colors.
- The home card is on the paper, a section card on its section's color, and a dhikr card has a band of its section's color over a panel.
