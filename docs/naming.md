# Naming

This doc holds the names of folders, files, functions, types, constants, tests, and scripts. Read it before you name or place anything. [`content.md`](content.md) names the content files, and [`design-system.md`](design-system.md#names) names the CSS classes.

## Principles

- A name says what the thing holds or does. Rename a name that is vague or no longer true.
- Use one word for one idea, everywhere. A dhikr is a `dhikr` in the schema, the page, the route, and the test.
- Use the domain words of [`content.md`](content.md): dhikr (plural adhkar), occasion, takhrij, ruling, proof, source, claim, span.
- Write an Arabic word in its transliteration, with no diacritics and words joined by `-`: `sabah-masaa`, `ma-lam-yathbut`, `ayat-al-kursi`.
- If a function or a type is hard to name, do not add it.

## Folders

- `src/lib/`: plain TypeScript, one topic in each file.
- `src/components/`: one Astro component in each file.
- `src/layouts/`: the page shells.
- `src/pages/`: the routes. Astro maps each file to a URL.
- `src/styles/`: the tokens, the base styles, and `components/`, one stylesheet for each component.
- `src/scripts/`: the module script of search.
- `scripts/<topic>/`: the scripts that Bun runs (`check`, `icons`, `opengraph`, `verification`).
- `src/lib/fixtures/`: the saved pages that the tests read.

## Files

- Name a file in `src/lib/` for its topic, in one lowercase word: `arabic.ts`, `takhrij.ts`, `matching.ts`.
- Do not add a `utils.ts`, `helpers.ts`, `constants.ts`, or `types.ts`. Put a helper, a constant, or a type in the file that uses it, and move it when a second file needs it.
- Put a type next to its schema: `Dhikr` sits in `schema.ts` with `dhikrSchema`.
- Name a component file in PascalCase for its component: `OccasionCard.astro`.
- Name its stylesheet in kebab-case for the same name: `src/styles/components/occasion-card.css`.
- Name a page for its URL, in transliterated Arabic: `bahth.astro` serves `/bahth/`. Name a route parameter for what it holds: `[occasion]`, `[dhikr]`.
- Name an endpoint for the file it serves: `robots.txt.ts`, `sitemap.xml.ts`.
- Name a script for the work it does: `scripts/verification/claim.ts` records a claim.
- Move a file with `git mv`, so its history follows.

## Functions

A function name is a noun with a short word that says what it does. Use the word that the code already uses for that work:

| Name             | Use it when the function                      | Example                                   |
| ---------------- | --------------------------------------------- | ----------------------------------------- |
| `<noun>Of`       | derives a value from its input                | `cardOf`, `slugOf`, `statusOf`, `formOf`  |
| `<noun>sOf`      | derives a list                                | `phrasesOf`, `claimsOf`, `spansOf`        |
| `read<Noun>`     | reads files from the disk                     | `readAdhkar`, `readProofs`, `readPending` |
| `parse<Noun>`    | turns text into a typed value                 | `parseVariants`                           |
| `to<Noun>`       | converts a value into another form            | `toArabicDigits`                          |
| `<noun>Label`    | writes the Arabic words for a person          | `adhkarLabel`, `timesLabel`, `formLabel`  |
| `<noun>Svg`      | returns an SVG string                         | `markSvg`, `emblemSvg`                    |
| `is<Adjective>`  | answers yes or no                             | `isOneWord`                               |
| `<noun>Problems` | returns what is wrong, as a list of sentences | `baselineProblems`                        |

- Prefer these words to `get`, `fetch`, `build`, and `handle`.

## Types and values

- Name a type in PascalCase with its domain word: `Dhikr`, `Proof`, `Occasion`, `Card`.
- Name a schema in camelCase with the `Schema` suffix, and its type without it: `proofSchema` and `Proof`.
- Name a union of names with `Name`: `IconName`, `EmblemName`.
- Name a module constant in `SCREAMING_SNAKE_CASE`: `OCCASIONS`, `PALETTE`, `RECORDS`.
- Name a local value in camelCase.
- A frontmatter field is one plain word, as the content needs it: `count`, `quran`, `mode`, `fadl`.

## Tests

- Put a test next to its source, with `.test.ts`: `src/lib/arabic.ts` and `src/lib/arabic.test.ts`.
- Name a test file for a whole collection for what it reads: `content.test.ts` reads the content, and `proofs.test.ts` reads `verification/`.
- Name a `describe` for the function it tests (`describe('spanOf')`), or for the thing it checks (`describe('the adhkar collection')`).
- Name each test as a sentence about the behavior: `it('opens no سورة with the بسملة')`. [`testing.md`](testing.md) has the rest.

## Package scripts

- Name a script for its task, and a family of scripts `<group>:<task>`: `verification:claim`, `opengraph:adhkar`, `test:build`.
- Name a script that only reports with `:check`: `format:check`.

## How to rename

- Rename a symbol through the TypeScript language service, so every caller changes.
- In the same commit, rename its test file, its `describe`, and every doc that names it.
- Never rename a dhikr's slug without a redirect. [`content.md`](content.md#the-file) has the rule.
