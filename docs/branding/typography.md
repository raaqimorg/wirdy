# Typography

The three faces and where each goes. Read it before you set any text. Sizes and line heights are tokens ([`design-system.md`](../design-system.md#tokens)).

| Face                 | Token             | Weights       | Where it goes                                                                      |
| -------------------- | ----------------- | ------------- | ---------------------------------------------------------------------------------- |
| IBM Plex Sans Arabic | `--font-ui`       | 400, 500, 700 | Everything but a dhikr: the bar, titles, notes, the takhrij, buttons, the wordmark |
| KFGQPC Naskh         | `--font-naskh`    | 400, 700      | The words of the adhkar                                                            |
| KFGQPC Naskh         | `--font-quran`    | 400           | The Quran                                                                          |
| KFGQPC Hafs          | `--font-ayah-end` | 400           | The numbered ۝ that ends each آية                                                  |

- Plex comes from `@fontsource` as WOFF2. The KFGQPC faces come from the Quran Complex and ship as TTF, unchanged, from `src/fonts/` ([`exceptions.md`](../exceptions.md#the-kfgqpc-faces-ship-as-ttf-unchanged)). No page asks another site for a font.
- A page preloads only the faces it uses (`faces` in `src/layouts/Paper.astro`).
- The sharing cards use the same files, so a card matches its page.
- ﷺ inside Plex text is set in KFGQPC Naskh, with the class `salawat`.
- The weights are tokens: `--weight-regular` (400) for text, `--weight-medium` (500) for small labels, `--weight-bold` (700) for titles and the wordmark.
