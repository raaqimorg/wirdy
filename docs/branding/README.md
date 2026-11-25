# Branding

This folder defines how Wirdy looks and speaks: its name, its words, its mark, its colors, its type, its images, and what each page says to search engines and to the apps that preview a link. Read it before you change anything a reader sees or a link preview shows.

The code holds the values, and this folder says what they are and why. `src/lib/branding.test.ts` fails when a value here and its value in the code differ, so change both in the same commit.

| Doc                         | What it holds                                                       | Where the code holds it                               |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| [Identity](identity.md)     | The name and its meaning, the tagline, the title, the voice         | `src/lib/site.ts`, `src/lib/occasions.ts`             |
| [Logo](logo.md)             | The sunflower mark, the wordmark, and the icons drawn from them     | `src/lib/mark.ts`, `components/Mark.astro`, `public/` |
| [Color](color.md)           | The paper, the ink, the mark, and the color of each section         | `src/lib/palette.ts`, `src/lib/tone.ts`, `tokens.css` |
| [Typography](typography.md) | The three faces and where each one goes                             | `src/styles/fonts.css`, `tokens.css`                  |
| [Imagery](imagery.md)       | The emblems of the sections and the sharing cards                   | `src/lib/emblems.ts`, `src/lib/card.ts`, `scripts/`   |
| [Metadata](metadata.md)     | Titles, descriptions, cards, breadcrumbs, the sitemap, the manifest | `src/layouts/Paper.astro`, `src/pages/`               |

## The rules in one place

- The name is «وِردي», always with its kasra. In Latin letters it is Wirdy, and the site is `wirdy.site`.
- The mark is the sunflower. It sits before the name at the start of the bar, and it is the favicon.
- No color is typed by hand outside `tokens.css` and `palette.ts`. The color of a section comes from its place on the list ([Color](color.md)).
- The words of the adhkar are in Amiri, the Quran in Amiri Quran, and everything else in IBM Plex Sans Arabic.
- Every page title ends with « | وِردي». Every link preview carries a card of 2400 by 1260.
- Generated files are never edited by hand: run `bun run icons`, `bun run opengraph`, and `bun run opengraph:adhkar`.
