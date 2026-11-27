# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr. The owner cut the search scene from the first cut.

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 16 seconds, light, centered, the screen in its phone frame. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

| Seconds     | Title                   | Screen                                                                                       |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| 0 to 3.6    | أذكار يومك في مكان      | `home` from 4.5 s: the home page, then a slow scroll through the cards                       |
| 3.6 to 5.8  | افتح أي قسم             | `section` from 3.33 s: a tap on «الصباح والمساء», its page opens                             |
| 5.8 to 8.2  | الصباح أو المساء        | `section` from 4.9 s: a tap on «المساء», the sun turns, ١٥ becomes ١٤                        |
| 8.2 to 12.6 | لكل ذكر تخريجه          | `takhrij` from 4.33 s: scroll to the foot of آية الكرسي, open «التخريج», push 1.5 at 79% 93% |
| 12.6 to 16  | احفظه في شاشتك الرئيسية | the end card: the mark and «وِردي», then wirdy.site                                           |

### The takes

Each take is one `run-sequence`, recorded with `showTouches: false` and `trimStatic: false`, so the clip keeps real time.

1. `home`: from the home page at the top. Hold 1 s, swipe up from 0.85 to 0.45 over 1.6 s with no momentum, hold 1.5 s.
2. `section`: from the home page at the top, the morning form chosen. Hold 0.6 s, tap the «الصباح والمساء» card (0.5, 0.5), hold 2 s, tap «المساء» (0.276, 0.395), hold 2 s.
3. `takhrij`: from the evening page at the top, the takhrij closed. Hold 0.4 s, swipe up from 0.88 to 0.18 over 0.9 s with no momentum, hold 0.8 s, tap «التخريج» (0.847, 0.527), hold 2.5 s. The line then sits at 0.61 of the screen.

Between takes, outside the recording: back to the home page at the top for `section` and الصباح chosen; for `takhrij`, close its panel first (إخفاء), because the page keeps it open.
