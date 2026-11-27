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

| Prefix                                   | What it holds                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `--color-*`                              | Colors by role: `paper`, `panel`, `ink`, `ink-muted`, `ink-faint`, `line`           |
| `--tone-*`                               | Colors from the occasion's color                                                    |
| `--font-*`, `--weight-*`                 | Families and weights                                                                |
| `--text-*`, `--leading-*`                | Type sizes and line heights                                                         |
| `--space-*`                              | Spacing on a 4 px step: 4, 8, 12, 16, 24, 32, 40, 64 px                             |
| `--size-*`                               | Shared widths and heights: the page, the reading measure and column, targets, icons |
| `--radius-*`, `--border-*`, `--ring-*`   | Corners by size (`small` to `full`), lines, and focus rings                         |
| `--opacity-*`, `--shadow-*`              | The hover and press states, and the raised panels                                   |
| `--ease-out`, `--spring`, `--duration-*` | Motion. See [`code-conventions.md`](code-conventions.md#motion)                     |

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
- The guides («سنن الجمعة» and «الطب النبوي») are not occasions, so each keeps its own color and moves no other, in the band the rule skips. «الطب النبوي» has 80°, the hue of honey, at the depth after the last hue on the arc; its emblem is a honeycomb with one lit cell. «سنن الجمعة» has 115° at the deep lightness, a moss green, the tone farthest from all the others; its emblem is a perfume bottle, its tall glass stopper lit: «أو يمس من طيب بيته».

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

| Component                                                                                                                                                                          | What it is                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Icon`, `Mark`, `Emblem`                                                                                                                                                           | Drawings. Their shapes are in `src/lib/`                                               |
| `Button`, `Badge`                                                                                                                                                                  | Small parts. A button without `href` is a `<button>`                                   |
| `ThemeToggle`, `WirdSwitch`, `Takhrij`                                                                                                                                             | Controls and links with one job                                                        |
| `Entry`                                                                                                                                                                            | The card around a text: count, lead, text, notes, and foot                             |
| `Dhikr`, `Hadith`                                                                                                                                                                  | What fills an `Entry`                                                                  |
| `Surah`, `Phrase`, `VariantText`                                                                                                                                                   | The text inside an `Entry`                                                             |
| `EntryList`, `Group`, `GroupIndex`, `Choices`, `Closing`                                                                                                                           | How entries sit on a page                                                              |
| `OccasionCard`, `CardGrid`, `Related`                                                                                                                                              | The occasion cards, and the grid of the home page                                      |
| `Search`, `SearchField`, `SearchHead`, `SearchRow`, `SearchSheet`                                                                                                                  | Search: the field, the results under each section head, the empty state, the sheet     |
| `SkipLink`, `Bar`, `SectionMenu`, `Banner`, `Hero`, `PageTools`, `PosterMenu` (a section's posters, from the bar), `DhikrActions` (share, copy, image), `Neighbours`, `SiteFooter` | The parts of a page                                                                    |
| `ReadingProgress`                                                                                                                                                                  | The reading timeline, from the first group to the closing line; the bar draws its line |

The home page and the 404 page are one pattern: the bar with no section menu, one sentence in a `Hero` (its second half faint), and every section in one `CardGrid`, in the order of `src/lib/occasions.ts`, with no headings: the cards and their emblems say what each is. Only the first card leads and moves. `widthsOf` (`src/lib/grid.ts`) sets which cards are wide from one fixed pattern, `ROWS`, so the grid looks varied but is the same on every visit: in rows of four, a wide card with a pair, two wide cards, a pair with a wide card, four narrow cards, and never the same shape twice in a row. Every row of two and of four is full, and the grid of two never stacks three wide cards. A phone shows one column, so the pattern does not reach it.

A card in a list shows its name in a small line above its lead, unless the text opens with that name (`isOpening` in `src/lib/title.ts`), so no words show twice. In a list the foot folds under the words behind one quiet line, «التخريج» (a `<details>`, no script), which reads «إخفاء» while open: the rows, then «نسخ» and «صفحة الذكر», all show only while it is open, so a closed card is the words and one line. The card is one column at every width. A folded سورة closes with the same «إخفاء», and both chevrons turn the same way. On the page of a dhikr or a hadith the foot is always open, and on a wide screen it is the card's side column.

The foot of an `Entry` is a list of labelled rows, in one order on every card: «الفضل» when the hadith states a virtue, «التخريج», and «النص» (موقع تنزيل) under every قرآن. The labels share one column, so values line up across cards. Below the rows, «نسخ» and «صفحة الذكر» (or «صفحة الحديث») sit at the two ends of their own line. Each link in the foot is as tall as a touch target, and a row of plain text («الفضل») takes the same height with padding, so the words of every row are the same distance apart.

One bar, with the same places on every page and width: the sunflower and «وِردي» lead home at the start, and the section and search icons sit at the end. On a long page «وِردي» gives way to the sunflower alone once the reading line starts ([motion](code-conventions.md#motion)). The home page drops the sections, because it shows them. The bar is solid: the paper, or the section's color, with the mark and icons in eggshell. The bar's two menus, the section menu and the poster menu, are one pattern, and `styles.test.ts` keeps their panel styles the same. Each is a modal `<dialog>`, as search is: while it is open the page behind takes no tap and no Tab, and a tap outside only closes it. Each has a head with its title and a body that scrolls inside the panel's rounded edge. Neither shows a scrollbar. On a phone each rises from the bottom edge as a sheet, full width over the page, which it does not dim, and its color goes on under Safari's toolbar ([exceptions](exceptions.md#the-sheets-color-goes-on-under-safaris-toolbar)), because Apple keeps popovers for wide views, and both are `--size-sheet` tall, the height that fits the poster menu. Its head has a grabber and a close icon, bare like every icon button, and a drag down on the head closes it. Only the section menu grows: a drag up takes it to the top of the screen, and a drag down shrinks it back. From `40rem` each opens under the bar, with no grabber and no close button. The poster menu explains nothing in words: its rows show the choices, and its foot holds one filled button, «حفظ الصورة», and nothing else. Its format and paper rows are two radio groups, and every row is its own Tab stop, picked with Space or Enter, so a keyboard reaches each choice without knowing to press an arrow.

The top of a page is at least `--size-banner` tall, or `--size-banner-wide` on a wide screen, and grows with its text, so large text never runs under the first card. On a screen under `30rem` tall, a phone on its side, it shrinks to its text and hides the emblem. It holds a short line (the count, or a dhikr's section as the way back), the title, and on a dhikr or hadith page, one line under it. A title over 24 letters takes a smaller size. A section has two names in `src/lib/occasions.ts`: `heading` (exactly two words, held by a test) for the pages, and `title`, which says «أذكار», for the tab, search engines, the cards, and notes that name a section. The guides keep their heading as their title, «سنن الجمعة» and «الطب النبوي», because they hold hadiths, not adhkar. A section has no line under its title. A dhikr's line is its `context` or its `group`, and its count when over one. It never repeats the `heading` above the title: a `context` that holds it («في الصباح والمساء») gives way to the `group`. A group named after its section («أدعية بعد الصلاة») may still hold it. It falls back to the section's `title`, and never states a virtue or a ruling. The home page has one sentence in their place, at the same height.

On a phone, a page's group index is one row that scrolls sideways to the screen edge. While there is more to scroll, its end fades (a CSS scroll-driven animation on the row), so a row whose last chip ends at the edge still says there is more. The fade goes at the end of the row, and a row that fits has none. From `40rem` the chips wrap. The row keeps room above, below, and at its ends for a focus ring, so a focused chip is never cut. A group's title above its cards is secondary to the words: body size, bold, in `ink-muted`. An occasion page ends with one line, «تمت» and the section's title, before «بقية الأقسام».

The top of a page sits `--space-6` under its banner at every width. On a wide screen a list page is one column, `--size-column` wide at the start: the switch, the group index, the cards, and «تمت», which is centred over the cards it ends. «بقية الأقسام» is four columns of compact cards in a fixed grid, so a last row that is not full keeps each card one column wide, and its cards sit as far apart as the home grid's.

A count is words in the section's color («٣٣ مرة»), never a shape that looks like a button. The counts of a dhikr's phrases sit in one column beside the longest phrase.

### The labels of a card

Each label of a card has one meaning and one look, on every card and page, so a reader learns it once. `src/build.test.ts` refuses any other label, another order, a number outside the count, a moment that says how to read, and «١ مرة».

| Label        | Class                         | Says                                                      | Shows when                                            | Type            | Ink                                                               | Space below |
| ------------ | ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | --------------- | ----------------------------------------------------------------- | ----------- |
| الاسم         | `entry__name`                 | What the dhikr or hadith is called                        | Its words do not open with its name (`isOpening`)     | `small`, bold   | `ink-muted`                                                       | `space-1`   |
| العدد والوقت | `entry__lead`, `entry__count` | How many times, then when: the time of day and the moment | A count over one, a time, or a moment (`momentOf`)    | `note`, bold    | The count in `tone-text`, the comma and the moment in `ink-muted` | `space-2`   |
| الكيفية      | `entry__how`                  | What to do while saying it, and to read a سورة to its end | A `how`, or a سورة whose first آية shows (`mannerOf`) | `note`, regular | `ink-muted`                                                       | `space-2`   |
| الراوي       | `entry__rawi`                 | Who narrates a hadith, «عن …»                             | Every hadith                                          | `note`, regular | `ink-muted`                                                       | `space-2`   |

The first label sits `space-6` under the top of the card (`space-1` in a card inside a choice), and the words follow the last. A count reads the same everywhere it shows (`timesLabel`): «مرة واحدة»، «مرتان»، «٣ مرات»، «٣٣ مرة». The count of a phrase (`badge--count`) is the same words in the same type and ink.

Under the words, the foot has a control and fields, not labels: «التخريج» (`small`, bold, `ink-muted`, with its chevron) opens it, each row names its field (`small`, medium, `ink-faint`) beside its value (`small`, medium, `ink-muted`; «الفضل» in `note`, regular), and «نسخ» and «صفحة الذكر» are actions, bold in `tone-text`, each with its icon. In a card the section's color means a count, or an action with an icon, and nothing else.

Above a set of cards, a title is `body`, bold, `ink-muted`: a group's title, and in a choice the title of each wording («الصيغة الأولى»). The note of a choice («تكفي واحدة منها») is `note`, medium, `ink-muted`.

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

- `stylelint` (`.stylelintrc.json`) refuses a raw color, spacing, corner, type size, line, line height, weight, or duration outside `tokens.css`, any `px`, a physical direction (`margin-top`, not `margin-block-start`), a class of another shape, `!important`, and any other breakpoint. A spacing, a corner, or a type size takes no unit at all (`em`, `%`, `lh`, `vw` included), only a token, `0`, or a `calc` of tokens. A color takes no color function (`oklch`, `color-mix`, and the rest) and no name. `styles.test.ts` proves each refusal. The three values that break it carry a `stylelint-disable` with their reason: the visually hidden box in `utilities.css`, the padding of a plain foot row in `entry.css`, and the gap before ۝ in `surah.css`.
- `bun run drift` reads the computed styles of every page in each state, in Chromium and WebKit, at four widths and in both modes, and lists each value that resolves to no token ([`development.md`](development.md#commands)). `bun run drift:check` lists what a change moved on screen.
- `prettier` with `prettier-plugin-astro` formats the Astro files, because oxfmt does not.
- `src/styles/styles.test.ts` checks that each token is defined and used, that the dark values and the palette match, and that each stylesheet styles only its own component.
- `src/build.test.ts` checks that the classes in the pages and in the CSS are the same.
