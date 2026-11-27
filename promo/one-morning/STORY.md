# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr. The owner cut the search scene from the first cut, then asked for a longer walk: the sections menu, a group, a dhikr page, copy, the image, the theme, and the footer's «صدقة جارية عن شروق». The third cut dropped the call to action and most titles, made every change move, and ends by zooming into the footer's line and lifting it out as the last frame.

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 30 seconds, light until the theme turns, centered. One continuous shot: one scene, one phone (`--screen: 520px`) that never moves until the end, and four general titles that take turns above it, each entering from the right over a second and leaving to the left. The screens show the steps; no title names a tap, and there is no call to action. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

| Seconds      | Title              | Screen                                                                                                                                            |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 to 5.2     | أذكار يومك في مكان | `journey` from 6.8 s: the home page, a tap on «الصباح والمساء», a tap on «المساء»                                                                 |
| 5.8 to 15.4  | مع كل ذكر تخريجه   | «التخريج» of آية الكرسي, the sections menu, «عند النوم», «عند الفراش» and its «التخريج»                                                           |
| 16 to 20.2   | نصا أو صورة        | «صفحة الذكر», «نسخ», «الصورة»; at 18.6 `dhikr.png` (the same frame) replaces the clip, and `card.png` grows over the phone from 18.7 to 20.2      |
| 20.8 to 23.4 | نهارا أو ليلا       | `footer` from 3.2 s crossfades in: scroll to the footer, «المظهر» turns the page dark at 22.9                                                     |
| 23.8 to 25.8 | none               | the camera zooms 3.917 times into «صدقة جارية عن شروق», and the frame turns to the site's dark paper                                              |
| 25.8 to 30   | none               | the line is lifted out as type where the zoom left it, the phone fades, the line brightens; the mark and «وِردي» grow in at 26.6, wirdy.site at 27 |

`card.png` is the file «الصورة» downloads, fetched from the live site (`/og/nawm/bismika-rabbi-wadatu-janbi-524f5279.png`). In the installed app, «الصورة» opens iOS's file screen, so it is the last tap of its take and the film lays the real image over it.

### Measured

From rendered frames (grayscale ink against the paper):

- The phone's black body at x 260 to 819 and y 452 to 1621 at every title, centered to the pixel. Each title's ink centered within 1 px.
- The card: x 101 to 978, centered at 539.5, its middle at y 960.
- The dedication in the footer: ink at x 417 to 787 and y 2215 to 2260 of the 1206 by 2622 clip, so the zoom turns about (280.3, 985.5) px of the phone's box.
- At 25.79 s the zoomed line's ink is x 226 to 852, y 743 to 821; the typeset line's is x 226 to 853, y 743 to 821. Same size, same place, within 1 px.
- The last frame: the line, the mark with «وِردي», and the domain each within 1 px of the center; their ink from y 743 to 1177, its middle at 960.0.

### The takes

Each take is one `run-sequence`, recorded with `showTouches: false` and `trimStatic: false`.

1. `journey`, from the home page at the top, morning chosen: hold 1 s; swipe up 0.8 to 0.55 over 0.9 s, no momentum; hold 0.8 s; tap the card (0.5, 0.3), hold 1.6 s; tap «المساء» (0.276, 0.395), hold 1.4 s; swipe up 0.88 to 0.18 over 0.9 s, hold 0.5 s; tap «التخريج» (0.847, 0.527), hold 1.8 s; swipe down 0.25 to 0.92 over 0.7 s, hold 0.6 s; tap «الأقسام» (0.176, 0.101), hold 1 s; tap «عند النوم» (0.6, 0.392), hold 1.5 s; tap «عند الفراش» (0.658, 0.4), hold 1.3 s; tap «التخريج» (0.847, 0.477), hold 1.3 s; tap «صفحة الذكر» (0.227, 0.62), hold 1.5 s; tap «نسخ» (0.5, 0.882), hold 1.3 s; tap «الصورة» (0.158, 0.882), hold 1.2 s.
2. `footer`, from the top of the same dhikr page, light: hold 0.5 s; swipe up 0.85 to 0.2 over 0.8 s, no momentum; hold 0.9 s; tap «المظهر» (0.559, 0.89), hold 2.5 s.

Between takes: quit the web app (`xcrun simctl terminate <udid> com.apple.webapp`), because the file screen has no way back, and open it again from its icon. After `footer`, tap «المظهر» again to leave the theme light.
