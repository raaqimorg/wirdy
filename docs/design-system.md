# Design system

The design follows [Laws of UX](https://lawsofux.com/). This doc says how the code holds it. The shape is the usual one: tokens, then base styles, then one stylesheet for each component. `bun run ci` enforces it.

## Where things are

- `src/styles/tokens.css`: every color, font, size, space, radius, and duration. No other stylesheet holds a raw value.
- `src/styles/base.css`: the reset, the elements, the focus ring, the press, and the view transitions.
- `src/styles/utilities.css`: four classes that belong to no component (`container`, `visually-hidden`, `salawat`, and `page`, the paper of a page with a color).
- `src/styles/components/`: one file for each component, with the same name (`EntryList.astro` and `entry-list.css`).
- `src/styles/index.css`: the imports, in order. A small component comes before one that uses it.
- `src/lib/palette.ts`: the colors that TypeScript and the scripts need too. A test keeps it equal to the tokens.
- `src/layouts/`: `Paper` (the document), `Home` (the home, search, and 404 pages), and `Section` (every page with a color).

## Tokens

The names follow the namespaces of Tailwind.

| Prefix                                   | What it holds                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `--color-*`                              | Colors by role: `paper`, `panel`, `ink`, `ink-muted`, `ink-faint`, `line`  |
| `--tone-*`                               | Colors that come from the color of the occasion                            |
| `--font-*`, `--weight-*`                 | Families and weights                                                       |
| `--text-*`, `--leading-*`                | Type sizes and line heights                                                |
| `--space-*`                              | Spacing. The number is in quarters of a rem, so `--space-4` is `1rem`      |
| `--size-*`                               | Widths and heights: the page, the reading measure, the touch target, icons |
| `--radius-*`, `--border-*`, `--ring-*`   | Corners, lines, and focus rings                                            |
| `--ease-out`, `--spring`, `--duration-*` | Motion. See [`code-conventions.md`](code-conventions.md), "Motion"         |

There are two type scales. `--text-title-1` to `--text-title-4` grow by a ratio of 1.333. `--text-reading-2` to `--text-reading-4` hold the words of the adhkar, and grow by 4 px. Three text sizes are for everything else: `small`, `note`, and `body`.

There are seven line heights. `tight` is for headings, `snug` for short lines, `body` for the page, `relaxed` for notes, `reading-small` and `reading` for the words of the adhkar, and `quran` for قرآن.

IBM Plex Sans Arabic sits low in its line, so text in a row of fixed height is lifted by `--space-lift` under it, and an icon beside it is put back by `--drop`. The rule is the one iOS follows beside an Arabic label: the middle of the text's ink meets the middle of the icon, within a point. The name «وِردي» hangs lower than most words, with its kasra and the dots of its ي, so the bar raises it by `--space-lift-brand` alone and leaves the mark where it is. Both values were measured on the ink, in Safari on an iPhone simulator.

## Color of an occasion

An element that has an occasion's color (the `body` of its page, or its card) carries the class `tone` and sets `--tone` in its `style`. Everything inside it uses the mixes that `.tone` defines:

- `--tone-fill`: a colored surface (the bar, the banner, the card stage, a badge).
- `--tone-text`: colored text and beads on a panel.
- `--tone-deep`: dark text of the same color on eggshell.
- `--tone-wash` and `--tone-flash`: the background of a dhikr that a link points at.

No occasion color is typed by hand. `src/lib/tone.ts` computes each one from a rule in OKLCH (lightness, chroma, hue):

- Lightness is 0.52 for every occasion. It is the lightest value at which the eggshell text keeps 4.5:1 on every hue the rule can give.
- Chroma is 0.086 for every occasion. It is the most that every hue on the arc can hold at that lightness, so no occasion looks louder than another.
- The hue comes from the place on the list. The hues sit evenly on an arc of 300° that starts at 135° and skips 75° to 135°, where the tones turn olive. The first occasion has the hue 47°, and the disc of the sunflower mark takes its color (`PALETTE.disc`, which a test keeps equal). The petals (`PALETTE.petal`, `#d2a249`, OKLCH 0.74 0.12 80°) are the one color outside the rule, because the rule skips yellow. The list walks the arc by the whole step nearest the golden ratio (3 of 8 places for 8 occasions), so neighbours on the list sit about 112° apart and any two sit at least 300° ÷ their count apart.
- At night, `--tone-shade` mixes the tone with 10% black in OKLab. That multiplies its lightness and its chroma by 0.9, so the same hue does not glare on the dark paper.
- «الطب النبوي» is not an occasion, so it keeps its own color and does not move the others: the same lightness and chroma at 80°, the hue of honey. That hue is in the band the rule skips, so no occasion can take it. Its emblem is a honeycomb with one lit cell.

To add an occasion, put it in its place in `src/lib/occasions.ts`. Every color follows from the new count, and `src/lib/tone.test.ts` proves the rule for 2 to 16 occasions.

## Dark mode

The dark values appear twice in `tokens.css`: once for a device in dark mode, and once for a saved choice. A test fails when the two differ. A component has no dark rules of its own.

## Names

- A class is `block__element--modifier`. The block is the component's name: `OccasionCard.astro` has `occasion-card`, `occasion-card__stage`, and `occasion-card--row`.
- A stylesheet names only its own block. To change a component from outside, pass it a prop, or set a custom property that it reads (`--icon-size`, `--icon-drop`).
- A state is an attribute or a pseudo-class (`aria-current`, `data-wird`, `:target`), not a class.
- A script finds an element by a `data-*` attribute, never by a class.
- Every class in a page has a rule, and every rule has a class in a page.

## Components

| Component                                                                                                            | What it is                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Icon`, `Mark`, `Emblem`                                                                                             | Drawings. Their shapes are in `src/lib/`                                                                                |
| `Button`, `Badge`, `BeadRing`                                                                                        | Small parts. A button without `href` is a `<button>`                                                                    |
| `ThemeToggle`, `WirdSwitch`, `Takhrij`                                                                               | Controls and links with one job                                                                                         |
| `Entry`                                                                                                              | The card around a text: its count, lead, text, notes, and foot                                                          |
| `Dhikr`, `Hadith`, `Unproven`                                                                                        | What fills an `Entry`                                                                                                   |
| `Surah`, `Phrase`, `VariantText`                                                                                     | The text inside an `Entry`                                                                                              |
| `EntryList`, `Group`, `GroupIndex`, `Choices`, `Closing`                                                             | How entries sit on a page                                                                                               |
| `OccasionCard`, `CardGrid`, `Related`                                                                                | The cards of the occasions                                                                                              |
| `Search`, `SearchField`, `SearchHead`, `SearchRow`, `SearchSheet`                                                    | Search: its field, its results under the head of each section, its empty state, and the sheet that holds it over a page |
| `Bar`, `SectionMenu`, `Banner`, `Hero`, `PageTools`, `DhikrActions` (share, copy, image), `Neighbours`, `SiteFooter` | The parts of a page                                                                                                     |
| `ReadingProgress`                                                                                                    | A line under the bar that grows as a long page is read                                                                  |

A card in a list shows the name of its dhikr or hadith in a small line above its lead, unless the text opens with that name (`isOpening` in `src/lib/title.ts`), so no words show twice.

In a list, the foot of a card is folded under the words behind one quiet line, «التخريج والمزيد» (a `<details>`, so it needs no script), which reads «إخفاء» while it is open. A card in a list is one column at every width. On the page of a dhikr or a hadith the foot is always open, and on a wide screen it is the side column of the card.

The foot of an `Entry` is a list of labelled rows, in the same order on every card: «الفضل» when the hadith states a virtue, «التخريج», and «النص» (موقع تنزيل) under every قرآن. The labels sit in one column, so the values line up from card to card. Under the rows, «نسخ» and «صفحة الذكر» (or «صفحة الحديث») sit at the two ends of their own line. Each link in the foot is as tall as a touch target.

There is one bar, with the same places on every page and at every width: the sunflower and «وِردي» lead home at the start, and the icons of the sections and of search are at the end. The home page leaves out the sections, because it shows them. The bar is a solid color: the paper, or the color of the section, with the mark and the icons in eggshell. The menu of the sections does not dim the page behind it.

The top of a page has one height at each width, `--size-banner` and `--size-banner-wide`. It holds a short line (the count, or the section of a dhikr as the way back to its place), the title, and on a page of a dhikr or a hadith, one line under it. A title of more than 24 letters takes a smaller size. A section has two names in `src/lib/occasions.ts`: `heading`, of two words at most, for the pages, and `title`, which says «أذكار», for the browser tab, search engines, the sharing cards, and the notes that name a section. «الطب النبوي» keeps its heading as its title, because it holds hadiths, not adhkar. A section has no line under its title. The line of a dhikr is its `context`, or its `group`, and its count when it is more than one. It never repeats the `heading` above the title, and falls back to the `title` of the section. It never states a virtue or a ruling. The home page has one sentence in place of them, at the same height.

On a phone, the index of the groups of a page is one row that scrolls sideways, and it runs to the edge of the screen. While there is more to scroll, its end fades out (a CSS scroll-driven animation on the row itself), so a row whose last chip happens to end at the edge still says there are more. The fade goes when the row reaches its end, and a row that fits has none. On a wide screen the chips wrap. An occasion page ends with one line, «تمّت» and the title of the section, before «بقية الأقسام».

The cards of the sections are rows on a phone, under a large first card. Each card counts what its page holds, and «الصباح والمساء» counts its morning list. On a wide screen they sit in four columns, and in each row one card is two columns wide: the first, then the last, then the middle.

## Breakpoints

There are two. Below `40rem` is a phone, and from `64rem` is a wide screen. The base rules are for a phone. `63.99rem` is only for what must stop right before the wide screen.

## To add a component

1. Write `src/components/Name.astro`.
2. If it has styles, write `src/styles/components/name.css`, and import it in `src/styles/index.css`.
3. Use the tokens. If no token fits, first look for the nearest one. Add a token only when the design needs a new value.

## What checks it

- `stylelint` (`.stylelintrc.json`) refuses a raw color, length, line height, weight, or duration outside `tokens.css`, a class name of another shape, `!important`, and any other breakpoint.
- `prettier` with `prettier-plugin-astro` formats the Astro files, because oxfmt does not.
- `src/styles/styles.test.ts` checks that each token is defined and used, that the dark values match, that the palette matches, and that each stylesheet styles only its own component.
- `src/build.test.ts` checks that the classes in the pages and in the CSS are the same.
