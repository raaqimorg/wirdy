# Design system

The shape of the styles and the components: tokens, then base styles, then one stylesheet for each component. `bun run ci` enforces it.

## Where things are

- `src/styles/tokens.css`: every color, font, size, space, radius, and duration. No other stylesheet holds a raw value.
- `src/styles/base.css`: the reset, the elements, the focus ring, the press, and the view transitions.
- `src/styles/utilities.css`: four classes of no component: `container`, `visually-hidden`, `salawat`, and `page` (the paper of a page with a color).
- `src/styles/components/`: one file for each component, with its name (`EntryList.astro`, `entry-list.css`).
- `src/styles/index.css`: the imports, in order. A component comes before the ones that use it.
- `src/lib/palette.ts`: the colors TypeScript and the scripts need. A test keeps it equal to the tokens.
- `src/layouts/`: `Paper` (the document), `Home` (the home, search, and 404 pages), and `Section` (every page with a color).

## Tokens

The names follow Tailwind's namespaces.

| Prefix                                   | What it holds                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `--color-*`                              | Colors by role: `paper`, `panel`, `ink`, `ink-muted`, `ink-faint`, `line`  |
| `--tone-*`                               | Colors from the occasion's color                                           |
| `--font-*`, `--weight-*`                 | Families and weights                                                       |
| `--text-*`, `--leading-*`                | Type sizes and line heights                                                |
| `--space-*`                              | Spacing, in quarters of a rem: `--space-4` is `1rem`                       |
| `--size-*`                               | Widths and heights: the page, the reading measure, the touch target, icons |
| `--radius-*`, `--border-*`, `--ring-*`   | Corners, lines, and focus rings                                            |
| `--ease-out`, `--spring`, `--duration-*` | Motion. See [`code-conventions.md`](code-conventions.md#motion)            |

Two type scales. `--text-title-1` to `--text-title-4` grow by 1.333. `--text-reading-1` to `--text-reading-5` hold the words of the adhkar and grow by 4 px. Three sizes serve the rest: `small`, `note`, and `body`.

Seven line heights: `tight` for headings, `snug` for short lines, `body` for the page, `relaxed` for notes, `reading-small` and `reading` for the adhkar, and `quran` for قرآن.

IBM Plex Sans Arabic sits low in its line, so text in a fixed-height row rises by `--space-lift`, and an icon beside it drops back by `--drop`. The rule is iOS's beside an Arabic label: the middle of the text's ink meets the middle of the icon, within a point. «وِردي» hangs lower, with its kasra and the dots of its ي, so the bar raises it alone by `--space-lift-brand` and leaves the mark. Both values were measured on the ink, in Safari on an iPhone simulator.

## Color of an occasion

An element in an occasion's color (its page `body`, or its card) has the class `tone` and sets `--tone` in its `style`. Everything inside uses the mixes `.tone` defines:

- `--tone-fill`: a colored surface (the bar, the banner, the card stage, a badge).
- `--tone-text`: colored text and beads on a panel.
- `--tone-deep`: dark text of the same color on eggshell.
- `--tone-wash` and `--tone-flash`: the background of a dhikr a link points at.

No occasion color is typed by hand. `src/lib/tone.ts` computes each from a rule in OKLCH (lightness, chroma, hue):

- Lightness is 0.52: the lightest at which eggshell text keeps 4.5:1 on every hue the rule gives.
- Chroma is 0.086: the most every hue on the arc holds at that lightness, so no occasion looks louder.
- The hue comes from the place on the list. The hues sit evenly on a 300° arc that starts at 135° and skips 75° to 135°, where tones turn olive. The first occasion has 47°, and the sunflower's disc takes its color (`PALETTE.disc`, kept equal by a test). The petals (`PALETTE.petal`, `#d2a249`, OKLCH 0.74 0.12 80°) are the one color outside the rule, because the rule skips yellow. The list walks the arc by the whole step nearest the golden ratio (3 of 8 places for 8 occasions), so neighbours sit about 112° apart and any two at least 300° ÷ their count apart.
- At night, `--tone-shade` mixes 10% black in OKLab, which multiplies lightness and chroma by 0.9, so the hue does not glare on dark paper.
- «ما لم يثبت» has the same lightness and almost no chroma (0.025 at 250°).
- «الطب النبوي» is not an occasion, so it keeps its own color and moves no other: the same lightness and chroma at 80°, the hue of honey, in the band the rule skips. Its emblem is a honeycomb with one lit cell.

To add an occasion, put it in its place in `src/lib/occasions.ts`. Every color follows from the new count, and `src/lib/tone.test.ts` proves the rule for 2 to 16 occasions.

## Dark mode

`tokens.css` holds the dark values twice: for a dark device, and for a saved choice. A test fails when they differ. No component has dark rules of its own.

## Names

- A class is `block__element--modifier`, and the block is the component's name: `OccasionCard.astro` has `occasion-card`, `occasion-card__stage`, and `occasion-card--row`.
- A stylesheet names only its own block. To change a component from outside, pass a prop or set a custom property it reads (`--icon-size`, `--icon-drop`).
- A state is an attribute or a pseudo-class (`aria-current`, `data-wird`, `:target`), not a class.
- A script finds an element by a `data-*` attribute, never a class.
- Every class in a page has a rule, and every rule has a class in a page.

## Components

| Component                                                                                                                        | What it is                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Icon`, `Mark`, `Emblem`                                                                                                         | Drawings. Their shapes are in `src/lib/`                                           |
| `Button`, `Badge`, `BeadRing`                                                                                                    | Small parts. A button without `href` is a `<button>`                               |
| `ThemeToggle`, `WirdSwitch`, `Takhrij`                                                                                           | Controls and links with one job                                                    |
| `Entry`                                                                                                                          | The card around a text: count, lead, text, notes, and foot                         |
| `Dhikr`, `Unproven`                                                                                                              | What fills an `Entry`                                                              |
| `Surah`, `Phrase`, `VariantText`                                                                                                 | The text inside an `Entry`                                                         |
| `EntryList`, `Group`, `GroupIndex`, `Choices`                                                                                    | How entries sit on a page                                                          |
| `OccasionCard`, `CardGrid`, `Related`                                                                                            | The occasion cards                                                                 |
| `Search`, `SearchField`, `SearchHead`, `SearchRow`, `SearchSheet`                                                                | Search: the field, the results under each section head, the empty state, the sheet |
| `SkipLink`, `Bar`, `SectionMenu`, `Banner`, `Hero`, `PageTools`, `DhikrActions` (share, copy, image), `Neighbours`, `SiteFooter` | The parts of a page                                                                |

The foot of an `Entry` is a list of labelled rows, in one order on every card: «الفضل» when the hadith states a virtue, «تنبيه» on «ما لم يثبت» when a note names what is sound, «التخريج», and «النص» (موقع تنزيل) under every قرآن. The labels share one column, so values line up across cards. Below the rows, «نسخ» and «صفحة الذكر» sit at the two ends of their own line. A hadith of الطب النبوي has only «صفحة الحديث», at the same end. On a wide screen the foot is the card's side column, with the buttons at its bottom.

Every page opens with «تخطَّ إلى المحتوى» (`SkipLink`), a link to `#main` that shows only while it has the focus, so a keyboard skips the bar. Every link and button shows the focus ring.

One bar, with the same places on every page and width: the sunflower and «وِردي» lead home at the start, and the section and search icons sit at the end. The home page drops the sections, because it shows them. The bar is solid: the paper, or the section's color, with the mark and icons in eggshell. The section menu does not dim the page.

The top of a page has one height per width, `--size-banner` and `--size-banner-wide`. It holds a short line (the count, or a dhikr's section as the way back), the title, and one line that describes the page. A title over 24 letters takes a smaller size. A section has two names in `src/lib/occasions.ts`: `heading` (two words at most) for the pages, and `title`, which says «أذكار», for the tab, search engines, the cards, and notes that name a section. «لم يثبت» has the title «ما لم يثبت». «الطب النبوي» keeps its heading as its title, because it holds hadiths, not adhkar. A section's line is its `lede`: three things in it, in page order, with no word of its `heading`. A dhikr's line is its `context` or its `group`, and its count when over one. It never repeats the `heading` above the title, falls back to the section's `title`, and never states a virtue or a ruling. The home page has one sentence in their place, at the same height.

The section cards are rows on a phone, under a large first card. On a wide screen they sit in four columns, and in each row one card spans two: the first, then the last, then the middle.

## Breakpoints

Two. Below `40rem` is a phone, from `64rem` a wide screen. The base rules are for a phone. `63.99rem` is only for what must stop right before the wide screen.

## To add a component

1. Write `src/components/Name.astro`.
2. For styles, write `src/styles/components/name.css` and import it in `src/styles/index.css`.
3. Use the tokens. If none fits, take the nearest. Add a token only for a new value the design needs.

## What checks it

- `stylelint` (`.stylelintrc.json`) refuses a raw color, length, line height, weight, or duration outside `tokens.css`, a class of another shape, `!important`, and any other breakpoint.
- `prettier` with `prettier-plugin-astro` formats the Astro files, because oxfmt does not.
- `src/styles/styles.test.ts` checks that each token is defined and used, that the dark values and the palette match, and that each stylesheet styles only its own component.
- `src/build.test.ts` checks that the classes in the pages and in the CSS are the same.
