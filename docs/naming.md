# Naming

The names of folders, files, functions, types, constants, tests, and scripts. Read it before you name or place anything. [`content.md`](content.md) names the content files, and [`design-system.md`](design-system.md#names) the CSS classes.

## Principles

- A name says what the thing holds or does. Rename a vague or stale name.
- One word for one idea, everywhere: a dhikr is `dhikr` in the schema, the page, the route, and the test.
- Use the domain words of [`content.md`](content.md): dhikr (plural adhkar), occasion, takhrij, ruling, proof, source, claim, span.
- Transliterate an Arabic word with no diacritics, joined by `-`: `sabah-masaa`, `al-tibb-al-nabawi`, `ayat-al-kursi`.
- If a function or a type is hard to name, do not add it.

## Folders

- `src/lib/`: plain TypeScript, one topic per file.
- `src/components/`: one Astro component per file.
- `src/layouts/`: the page shells.
- `src/pages/`: the routes. Astro maps each file to a URL.
- `src/styles/`: the tokens, the base styles, and `components/`, one stylesheet per component.
- `src/scripts/`: the search module script.
- `scripts/<topic>/`: the Bun scripts (`check`, `icons`, `opengraph`, `verification`).
- `src/lib/fixtures/`: the saved pages the tests read.

## Files

- Name a `src/lib/` file for its topic, in one lowercase word: `arabic.ts`, `takhrij.ts`, `matching.ts`.
- No `utils.ts`, `helpers.ts`, `constants.ts`, or `types.ts`. Put a helper, constant, or type in the file that uses it, and move it when a second file needs it.
- Put a type beside its schema: `Dhikr` with `dhikrSchema` in `schema.ts`.
- Name a component file in PascalCase: `OccasionCard.astro`.
- Name its stylesheet in kebab-case: `src/styles/components/occasion-card.css`.
- Name a page for its URL, in transliterated Arabic: `bahth.astro` serves `/bahth/`. Name a route parameter for what it holds: `[occasion]`, `[dhikr]`.
- Name an endpoint for the file it serves: `robots.txt.ts`, `sitemap.xml.ts`.
- Name a script for its work: `scripts/verification/claim.ts` records a claim.
- Move a file with `git mv`, so its history follows.

## Functions

A function name is a noun with a short word for what it does. Use the word the code already uses for that work:

| Name             | Use it when the function            | Example                                   |
| ---------------- | ----------------------------------- | ----------------------------------------- |
| `<noun>Of`       | derives a value from its input      | `cardOf`, `slugOf`, `statusOf`, `formOf`  |
| `<noun>sOf`      | derives a list                      | `phrasesOf`, `claimsOf`, `spansOf`        |
| `read<Noun>`     | reads files from the disk           | `readAdhkar`, `readProofs`, `readPending` |
| `parse<Noun>`    | turns text into a typed value       | `parseVariants`                           |
| `to<Noun>`       | converts a value into another form  | `toArabicDigits`                          |
| `<noun>Label`    | writes Arabic words for a reader    | `adhkarLabel`, `timesLabel`, `formLabel`  |
| `<noun>Svg`      | returns an SVG string               | `markSvg`, `emblemSvg`                    |
| `is<Adjective>`  | answers yes or no                   | `isOpening`                               |
| `<noun>Problems` | returns what is wrong, as sentences | `baselineProblems`                        |

Prefer these words to `get`, `fetch`, `build`, and `handle`.

## Types and values

- A type is PascalCase with its domain word: `Dhikr`, `Proof`, `Occasion`, `Card`.
- A schema is camelCase with `Schema`, and its type drops it: `proofSchema` and `Proof`.
- A union of names ends in `Name`: `IconName`, `EmblemName`.
- A module constant is `SCREAMING_SNAKE_CASE`: `OCCASIONS`, `PALETTE`, `RECORDS`.
- A local value is camelCase.
- A frontmatter field is one plain word: `count`, `quran`, `mode`, `fadl`.

## Tests

- A test sits beside its source, with `.test.ts`: `src/lib/arabic.ts` and `src/lib/arabic.test.ts`.
- A test of a whole collection is named for what it reads: `content.test.ts` reads the content, `proofs.test.ts` reads `verification/`.
- A `describe` names the function (`describe('spanOf')`) or the thing it checks (`describe('the adhkar collection')`).
- Each test is a sentence about the behavior: `it('opens no سورة with the بسملة')`. See [`testing.md`](testing.md).

## Package scripts

- Name a script for its task, and a family `<group>:<task>`: `verification:claim`, `opengraph:adhkar`, `test:build`.
- A script that only reports ends in `:check`: `format:check`.

## How to rename

- Rename a symbol through the TypeScript language service, so every caller changes.
- In the same commit, rename its test file, its `describe`, and every doc that names it.
- Never rename a dhikr's slug without a redirect ([`content.md`](content.md#the-file)).
