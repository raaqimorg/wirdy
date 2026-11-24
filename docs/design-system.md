# Design system

The design follows [Laws of UX](https://lawsofux.com/). This doc says how the code holds it. The shape is the usual one: tokens, then base styles, then one stylesheet for each component. `bun run ci` enforces it.

## Where things are

- `src/styles/tokens.css`: every color, font, size, space, radius, and duration. No other stylesheet holds a raw value.
- `src/styles/base.css`: the reset, the elements, the focus ring, the press, and the view transitions.
- `src/styles/utilities.css`: three classes that belong to no component (`container`, `visually-hidden`, `salawat`).
- `src/styles/components/`: one file for each component, with the same name (`EntryList.astro` and `entry-list.css`).
- `src/styles/index.css`: the imports, in order. A small component comes before one that uses it.
- `src/lib/palette.ts`: the colors that TypeScript and the scripts need too. A test keeps it equal to the tokens.
- `src/layouts/`: `Paper` (the document), `Home` (the home and 404 pages), and `Section` (every page with a color).

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

There are two type scales. `--text-title-1` to `--text-title-4` grow by a ratio of 1.333. `--text-reading-1` to `--text-reading-5` hold the words of the adhkar, and grow by 4 px. Three text sizes are for everything else: `small`, `note`, and `body`.

## Color of an occasion

An element that has an occasion's color carries the class `tone` and sets `--tone` in its `style`. Everything inside it uses the mixes that `.tone` defines:

- `--tone-fill`: a colored surface (the bar, the banner, the card stage, a badge).
- `--tone-text`: colored text and beads on a panel.
- `--tone-deep`: dark text of the same color on eggshell.
- `--tone-wash` and `--tone-flash`: the background of a dhikr that a link points at.

The colors themselves are in `src/lib/occasions.ts` and `src/lib/site.ts`.

## Dark mode

The dark values appear twice in `tokens.css`: once for a device in dark mode, and once for a saved choice. A test fails when the two differ. A component has no dark rules of its own.

## Names

- A class is `block__element--modifier`. The block is the component's name: `OccasionCard.astro` has `occasion-card`, `occasion-card__stage`, and `occasion-card--row`.
- A stylesheet names only its own block. To change a component from outside, pass it a prop, or set a custom property that it reads (`--icon-size`, `--mark-size`).
- A state is an attribute or a pseudo-class (`aria-current`, `data-wird`, `:target`), not a class.
- A script finds an element by a `data-*` attribute, never by a class.
- Every class in a page has a rule, and every rule has a class in a page.

## Components

| Component                                                                                  | What it is                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `Icon`, `Mark`, `Emblem`                                                                   | Drawings. Their shapes are in `src/lib/`          |
| `Button`, `IconButton`, `Badge`, `BeadRing`                                                | Small parts                                       |
| `ThemeToggle`, `WirdSwitch`, `ShareLink`, `Takhrij`                                        | Controls and links with one job                   |
| `Entry`                                                                                    | The card around a text, with its lead and takhrij |
| `Dhikr`, `Unproven`                                                                        | What fills an `Entry`                             |
| `Surah`, `Phrase`, `VariantText`, `WordForm`                                               | The text inside an `Entry`                        |
| `EntryList`, `Group`, `GroupIndex`, `Choices`                                              | How entries sit on a page                         |
| `OccasionCard`, `CardGrid`, `Related`                                                      | The cards of the occasions                        |
| `SiteHeader`, `Bar`, `Tools`, `Banner`, `Hero`, `DhikrActions`, `Neighbours`, `SiteFooter` | The parts of a page                               |

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
