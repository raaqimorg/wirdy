# Typography

This doc holds the three faces of the site and where each one goes. Read it before you set any text. The sizes and line heights are tokens ([`design-system.md`](../design-system.md#tokens)).

| Face                 | Token          | Weights       | Where it goes                                                                              |
| -------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------ |
| IBM Plex Sans Arabic | `--font-ui`    | 400, 500, 700 | Everything that is not a dhikr: the bar, titles, notes, the takhrij, buttons, the wordmark |
| Amiri                | `--font-naskh` | 400           | The words of the adhkar                                                                    |
| Amiri Quran          | `--font-quran` | 400           | The Quran                                                                                  |

- The faces come from `@fontsource` and ship with the site as WOFF2. No page asks another site for a font.
- A page preloads only the faces it uses (`faces` in `src/layouts/Paper.astro`).
- The sharing cards use the same files, so a card and its page look the same.
- ﷺ inside Plex text is set in Amiri, with the class `salawat`.
- The weights are tokens: `--weight-regular` (400) for text, `--weight-medium` (500) for small labels, and `--weight-bold` (700) for titles and the wordmark.
