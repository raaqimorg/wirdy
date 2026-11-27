# Design system

The shape of the styles and the components: tokens, then base styles, then one stylesheet for each component. `bun run ci` enforces it.

## Where things are

- `src/styles/tokens.css`: every color, font, size, space, radius, and duration. No other stylesheet holds a raw value.
- `src/styles/base.css`: the reset, the elements, the focus ring, and the hover and press of every control ([States](#states)).
- `src/styles/utilities.css`: four classes of no component: `container`, `visually-hidden`, `salawat`, and `page` (the paper of a page with a color).
- `src/styles/components/`: one file for each component, with its name (`EntryList.astro`, `entry-list.css`).
- `src/styles/index.css`: the imports, in order. A component comes before the ones that use it.
- `src/lib/palette.ts`: the colors TypeScript and the scripts need. It reads them from `tokens.css` at build time ([`exceptions.md`](exceptions.md#the-palette-reads-the-tokens)).
- `src/layouts/`: `Paper` (the document), `Home` (the home, search, and 404 pages), and `Section` (every page with a color).

## Tokens

The names follow Tailwind's namespaces.

| Prefix                                   | What it holds                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `--color-*`                              | Colors by role: `paper`, `panel`, `ink`, `ink-muted`, `ink-faint`, `line` |
| `--tone-*`                               | Colors from the occasion's color                                          |
| `--font-*`, `--weight-*`                 | Families and weights                                                      |
| `--text-*`, `--leading-*`                | Type sizes and line heights                                               |
| `--space-*`                              | Spacing on a 4 px step: 4, 8, 12, 16, 24, 32, 40, 64 px                   |
| `--size-*`                               | Shared widths and heights: the page, the reading measure, targets, icons  |
| `--radius-*`, `--border-*`, `--ring-*`   | Corners by size (`small` to `full`), lines, and focus rings               |
| `--opacity-*`, `--shadow-*`              | The hover and press states, and the raised panels                         |
| `--ease-out`, `--spring`, `--duration-*` | Motion. See [`code-conventions.md`](code-conventions.md#motion)           |

One type scale, shared by the interface and the adhkar: 13, 15, 17, 20, 24, 28, 34, and 48 px (`small`, `note`, `body`, `title-1`, `reading-2`, `title-2`, `title-3`, `title-4`), after iOS's text styles. Two fluid titles move with the width between two steps of the scale: `title-fluid` from 20 to 28 px, and `title-long` from 17 to 20 px.

A size that only one component needs (a card's stage, the hero's measure, the search panel) is written in that component in `rem`, not made a token. `stylelint` allows `rem` only on widths, heights, and grid tracks, and never `px`; spacing, corners, type, color, and time always come from the tokens.

Four line heights: `tight` for headings, `snug` for the interface, `reading` for the adhkar, and `quran` for قرآن.

IBM Plex Sans Arabic sits low in its line, so `src/styles/fonts.css` corrects its vertical metrics once, with `ascent-override` and `descent-override`: the middle of a label's ink meets the middle of its box and of the icon beside it, as iOS sets an Arabic label. No component nudges its text. «وِردي» hangs lower, with its kasra and the dots of its ي, so the bar raises it alone by `0.13em` and leaves the mark.

Icons are drawn on one 24-unit grid. They take the size of the text beside them, `1em`, and their stroke follows the weight of that text: `--stroke-icon` beside regular text and `--stroke-icon-bold` beside bold.

## Color of an occasion

An element in an occasion's color (its page `body`, or its card) has the class `tone` and sets `--tone` in its `style`. Everything inside uses the mixes `.tone` defines:

- `--tone-fill`: a colored surface (the bar, the banner, the card stage, a badge).
- `--tone-text`: colored text on a panel, such as a count.
- `--tone-select`: the selected segment of the morning and evening switch. At night it lifts the color by 3% so the segment keeps 3:1 against its track, with its label at 4.5:1.
- `--tone-deep`: dark text of the same color on eggshell.
- `--tone-wash` and `--tone-flash`: the background of a dhikr a link points at.

No occasion color is typed by hand. `src/lib/tone.ts` computes each from a rule in OKLCH (lightness, chroma, hue):

- Lightness has two depths. 0.52 is the lightest at which eggshell text keeps 4.5:1 on every hue the rule gives. 0.46 is the deepest at which `--tone-text` keeps 4.5:1 on the panel and on `--tone-wash` at night, where it mixes 45% ink.
- Chroma is 0.086 at 0.52: the most every hue on the arc holds at that lightness. At 0.46 it keeps the same share of the lightness (0.0761), so no occasion looks louder.
- The depths alternate along the arc in hue order, and the first occasion is light. Two hues next to each other on the arc never share a depth, so no two occasions look alike: any two tones sit at least 0.045 apart in OKLab.
- The hue comes from the place on the list. The hues sit evenly on a 300° arc that starts at 135° and skips 75° to 135°, where tones turn olive. The first occasion has 47°, and the sunflower's disc takes its color (`PALETTE.disc`, kept equal by a test). The petals (`PALETTE.petal`, `#d2a249`, OKLCH 0.74 0.12 80°) are the one color outside the rule, because the rule skips yellow. The list walks the arc by the whole step nearest the golden ratio (3 of 8 places for 8 occasions), so neighbours sit about 112° apart and any two at least 300° ÷ their count apart.
- At night, `--tone-shade` mixes 10% black in OKLab, which multiplies lightness and chroma by 0.9, so the hue does not glare on dark paper.
- «الطب النبوي» is not an occasion, so it keeps its own color and moves no other: 80°, the hue of honey, in the band the rule skips. It takes the depth after the last hue on the arc. Its emblem is a honeycomb with one lit cell.

To add an occasion, put it in its place in `src/lib/occasions.ts`. Every color follows from the new count, and `src/lib/tone.test.ts` proves the rule for 2 to 16 occasions. `src/styles/styles.test.ts` reads the tokens and proves the tone text by day and night at both depths.

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
| `Button`, `Badge`                                                                                                                | Small parts. A button without `href` is a `<button>`                               |
| `ThemeToggle`, `WirdSwitch`, `Takhrij`                                                                                           | Controls and links with one job                                                    |
| `Entry`                                                                                                                          | The card around a text: count, lead, text, notes, and foot                         |
| `Dhikr`, `Hadith`                                                                                                                | What fills an `Entry`                                                              |
| `Surah`, `Phrase`, `VariantText`                                                                                                 | The text inside an `Entry`                                                         |
| `EntryList`, `Group`, `GroupIndex`, `Choices`, `Closing`                                                                         | How entries sit on a page                                                          |
| `OccasionCard`, `CardGrid`, `Related`                                                                                            | The occasion cards, and the grid of the home page                                  |
| `Search`, `SearchField`, `SearchHead`, `SearchRow`, `SearchSheet`                                                                | Search: the field, the results under each section head, the empty state, the sheet |
| `SkipLink`, `Bar`, `SectionMenu`, `Banner`, `Hero`, `PageTools`, `DhikrActions` (share, copy, image), `Neighbours`, `SiteFooter` | The parts of a page                                                                |
| `ReadingProgress`                                                                                                                | A line under the bar that grows from the first group to the closing line           |

The home page and the 404 page show every section in one `CardGrid`, in the order of `src/lib/occasions.ts`, with no headings: the cards and their emblems say what each is. Only the first card leads and moves. `widthsOf` (`src/lib/grid.ts`) sets which cards of a grid are wide, so every row of two and of four is full.

A card in a list shows its name in a small line above its lead, unless the text opens with that name (`isOpening` in `src/lib/title.ts`), so no words show twice. In a list the takhrij folds under the words behind one quiet line, «التخريج» (a `<details>`, no script), which reads «إخفاء» while open, and «نسخ» and «صفحة الذكر» stay in view under it. The card is one column at every width. A folded سورة closes with the same «إخفاء», and both chevrons turn the same way. On the page of a dhikr or a hadith the foot is always open, and on a wide screen it is the card's side column.

The foot of an `Entry` is a list of labelled rows, in one order on every card: «الفضل» when the hadith states a virtue, «التخريج», and «النص» (موقع تنزيل) under every قرآن. The labels share one column, so values line up across cards. Below the rows, «نسخ» and «صفحة الذكر» (or «صفحة الحديث») sit at the two ends of their own line. Each link in the foot is as tall as a touch target, and a row of plain text («الفضل») takes the same height with padding, so the words of every row are the same distance apart.

One bar, with the same places on every page and width: the sunflower and «وِردي» lead home at the start, and the section and search icons sit at the end. The home page drops the sections, because it shows them. The bar is solid: the paper, or the section's color, with the mark and icons in eggshell. The section menu does not dim the page.

The top of a page is at least `--size-banner` tall, or `--size-banner-wide` on a wide screen, and grows with its text, so large text never runs under the first card. On a screen under `30rem` tall, a phone on its side, it shrinks to its text and hides the emblem. It holds a short line (the count, or a dhikr's section as the way back), the title, and on a dhikr or hadith page, one line under it. A title over 24 letters takes a smaller size. A section has two names in `src/lib/occasions.ts`: `heading` (two words at most) for the pages, and `title`, which says «أذكار», for the tab, search engines, the cards, and notes that name a section. «الطب النبوي» keeps its heading as its title, because it holds hadiths, not adhkar. A section has no line under its title. A dhikr's line is its `context` or its `group`, and its count when over one. It never repeats the `heading` above the title, falls back to the section's `title`, and never states a virtue or a ruling. The home page has one sentence in their place, at the same height.

On a phone, a page's group index is one row that scrolls sideways to the screen edge. While there is more to scroll, its end fades (a CSS scroll-driven animation on the row), so a row whose last chip ends at the edge still says there is more. The fade goes at the end of the row, and a row that fits has none. From `40rem` the chips wrap. The row keeps room above, below, and at its ends for a focus ring, so a focused chip is never cut. A group's title above its cards is secondary to the words: body size, bold, in `ink-muted`. An occasion page ends with one line, «تمّت» and the section's title, before «بقية الأقسام».

A count is words in the section's color («٣٣ مرة»), never a shape that looks like a button. The counts of a dhikr's phrases sit in one column beside the longest phrase.

The section cards are rows on a phone, under a large first card. Each counts what its page holds, and «الصباح والمساء» counts its morning list. On a wide screen they sit in four columns, and in each row one card spans two: the first, then the last, then the middle.

## Breakpoints

Three widths. The base rules are for a phone. From `40rem`, a tablet, the switch, the tools, the action buttons, and the group index take their wide arrangement. From `64rem` is a wide screen. `63.99rem` is only for what must stop right before it. One height: under `30rem` tall the top of a page shrinks.

What depends on the pointer asks the pointer, not the width. Search on a wide screen shows the «Esc» hint only with a mouse (`hover: hover` and `pointer: fine`), and «إلغاء» everywhere else, so the two never show together and a touch screen always has a way out.

## States

Every control answers the pointer by its shape, and nothing it shows can be cut by a parent:

- A control with its own fill (`data-hover="fill"`: buttons, chips, the switch, menu and search rows) tints inside its own rounded shape on hover, `--shadow-hover`, and more when pressed, `--shadow-pressed`. `Button` sets it for its filled variants.
- A text control (`data-hover="line"`: links, text buttons, the disclosure lines, «المظهر») underlines on hover and darkens to ink when pressed. `Button` sets it for `text`.
- Any other control, an icon or the mark, dims to `--opacity-hover` on hover and `--opacity-pressed` when pressed.
- A card (`data-hover="self"`) keeps its own brighten and press.

The focus ring is one rule in `base.css`: two pixels of `--ring-color` (ink by default, `currentColor` on a colored bar) at `--ring-offset` (`--ring-gap` outside by default). A borderless button, a row, or anything inside a parent that hides its overflow draws it inside, with `--ring-inset`. A component sets the two properties, never its own `:focus-visible` rule. The search field draws its ring on its box, and in the wide search panel the box sits `--space-2` inside the panel, so its corners (`--radius-large`) are concentric with the panel's (`--radius-xlarge`) and the ring is never cut. A list with rounded corners that clips its rows (`search__tries`, `search-row`) rounds its first and last rows to match, and each row's control takes `border-radius: inherit`, so a ring on the first or last row follows the corner. The mark in the bar has inline padding and draws its ring inside, because the bar starts at the top of the screen.

## To add a component

1. Write `src/components/Name.astro`.
2. For styles, write `src/styles/components/name.css` and import it in `src/styles/index.css`.
3. Use the tokens. If none fits, take the nearest. Add a token only for a new value the design needs.

## What checks it

- `stylelint` (`.stylelintrc.json`) refuses a raw color, spacing, corner, line height, weight, or duration outside `tokens.css`, any `px`, a physical direction (`margin-top`, not `margin-block-start`), a class of another shape, `!important`, and any other breakpoint.
- `prettier` with `prettier-plugin-astro` formats the Astro files, because oxfmt does not.
- `src/styles/styles.test.ts` checks that each token is defined and used, that the dark values and the palette match, and that each stylesheet styles only its own component.
- `src/build.test.ts` checks that the classes in the pages and in the CSS are the same.
