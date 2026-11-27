# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr.

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → search «النوم» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 19 seconds, light. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

| Seconds      | Scene | Title                   | Screen                                                                                 |
| ------------ | ----- | ----------------------- | -------------------------------------------------------------------------------------- |
| 0 to 3.6     | paper | أذكار يومك في مكان واحد | `home`: the home page at the top, then a slow scroll through the cards                 |
| 3.6 to 5.8   | paper | افتح أي قسم             | `section`: a tap on «الصباح والمساء», its page opens                                   |
| 5.8 to 8.2   | paper | اختر الصباح أو المساء   | `section`, on: a tap on «المساء», the sun turns, ١٥ becomes ١٤                         |
| 8.2 to 12.2  | paper | مع كل ذكر تخريجه        | `takhrij`: scroll to the foot of آية الكرسي, open «التخريج», push in on «صحّحه الألباني» |
| 12.2 to 15.6 | paper | ابحث عن أي ذكر          | `search`: the search sheet opens, a tap on «النوم», 19 results                         |
| 15.6 to 19   | paper | احفظه في شاشتك الرئيسية | the end card: the mark and «وِردي», then wirdy.site                                     |

### The takes

Each take is one `run-sequence`, recorded with `showTouches: false` and `trimStatic: false`, so the clip keeps real time.

1. `home`: from the home page at the top. Hold 1 s, swipe up from 0.85 to 0.45 over 1.6 s with no momentum, hold 1.5 s.
2. `section`: from the home page at the top, the morning form chosen. Hold 0.6 s, tap the «الصباح والمساء» card (0.5, 0.5), hold 2 s, tap «المساء» (0.276, 0.395), hold 2 s.
3. `takhrij`: from the evening page at the top. Hold 0.4 s, swipe up from 0.85 to 0.35 over 0.7 s with no momentum, hold 0.8 s, tap «التخريج» (0.847, 0.687), hold 2.5 s.
4. `search`: from the end of `takhrij`. Hold 0.4 s, tap the search icon (0.067, 0.101), hold 1.1 s, tap the suggestion «النوم» (0.5, 0.399), hold 2.2 s.

Between takes, outside the recording: back to the home page at the top for `section`; after `search`, clear the field (مسح, then إلغاء) so the next run starts empty, and choose الصباح again.
