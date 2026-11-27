# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr. The owner cut the search scene from the first cut, then asked for a longer walk: the sections menu, a group, a dhikr page, copy, the image, the theme, and the footer's «صدقة جارية عن شروق». The third cut dropped the call to action and most titles, made every change move, and ends by zooming into the footer's line and lifting it out as the last frame. The fourth cut is one take and shorter: every section down to الطب النبوي, back through the sections menu to الصباح والمساء, from the evening the page opens on to the morning, a dhikr's page, copy, the theme, and the same ending. It dissolves across each of the site's instant changes, so nothing flickers.

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 26 seconds, light until the theme turns, centered. One take and one scene: one phone (`--screen: 520px`) that never moves until the end, and four general titles that take turns above it, each entering from the right over a second and leaving to the left. The screens show the steps; no title names a tap, and there is no call to action. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

`walk` plays from 11.25 s (`data-start="-11.25"`, half a frame past 337 frames, so every seek lands inside a frame).

| Seconds      | Title              | Screen                                                                                                                                        |
| ------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 to 3.5     | أذكار يومك في مكان | the home page, two flicks down through every section to الطب النبوي                                                                           |
| 4.1 to 7.3   | والطب النبوي       | الطب النبوي opens at 4.07, its first hadith's «التخريج»: «صحيح مسلم (٢٢٠٠)»                                                                   |
| 7.8 to 16.4  | مع كل ذكر تخريجه   | «الأقسام» at 7.2, «الصباح والمساء» at 8.63 (open on المساء, the clock's choice), «الصباح» at 10.03, «التخريج» of آية الكرسي, its page at 14.67 |
| 17 to 19.45  | نهارا أو ليلا       | a scroll to the foot of the page, «نسخ» at 17.43, «المظهر» turns it dark at 18.97                                                             |
| 19.8 to 21.8 | none               | the camera zooms 3.917 times into «صدقة جارية عن شروق», and the frame turns to the dark paper                                                 |
| 21.8 to 26   | none               | the line is lifted out as type, the phone fades, the line brightens; the mark and «وِردي» at 22.6, wirdy.site at 23                            |

Each of the site's instant changes (the tibb page, the sections menu, the morning page, the dhikr page, the theme) is covered by the frame before it, `before-<frame>.png`, fading out over 0.35 s (`data-motion="cover"`), so the change dissolves.

### Measured

From rendered frames (grayscale ink against the paper):

- The phone's black body at x 260 to 819 and y 452 to 1621 at every title, centered to the pixel. Each title's ink centered within 1 px.
- The dedication in the footer: ink at x 417 to 787 and y 2215 to 2260 of the 1206 by 2622 clip, the same as the earlier take, so the zoom turns about (280.3, 985.5) px of the phone's box.
- At 21.79 s the zoomed line's ink is x 226 to 852, y 743 to 821; the typeset line's is x 226 to 853, y 744 to 821. Same size, same place, within 1 px.
- The last frame: the line, the mark with «وِردي», and the domain each within 1 px of the center; their ink from y 744 to 1177, its middle at 960.5.
- No flicker: no frame in `walk` differs from both its neighbours while they match, and none is blank. In the render, no frame jumps but the zoom.

### The take

Recorded with `showTouches: false` and `trimStatic: false`, from the home page at the top, light, in the evening (the page of الصباح والمساء opens on المساء by the clock; it does not remember a choice). One `run-sequence`:

hold 1.2 s; flick up 0.8 to 0.3 in 100 ms, twice, 450 ms apart (they reach the bottom and bounce); hold 2.2 s; tap «الطب النبوي» (0.5, 0.748), wait for «الرقية», hold 1 s; tap «التخريج» (0.847, 0.803), hold 1.5 s; tap «الأقسام» (0.176, 0.101), wait for the menu, hold 0.8 s; tap «الصباح والمساء» (0.556, 0.172), wait for «أصبحنا وأمسينا», hold 1.1 s; tap «الصباح» (0.725, 0.395), hold 1.4 s; swipe up 0.88 to 0.18 over 0.9 s, no momentum, hold 0.5 s; tap «التخريج» (0.847, 0.527), hold 1.5 s; tap «صفحة الذكر» (0.227, 0.72), wait for «في الصباح والمساء», hold 1 s; swipe up 0.88 to 0.12 over 1 s, no momentum, hold 0.6 s; tap «نسخ» (0.5, 0.663), hold 1.4 s; tap «المظهر» (0.559, 0.89), hold 5.5 s.

Afterwards tap «المظهر» again to leave the theme light.
