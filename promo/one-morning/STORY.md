# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr. The owner cut the search scene from the first cut, then asked for a longer walk: the sections menu, a group, a dhikr page, copy, the image, the theme, and the footer's «صدقة جارية عن شروق».

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 28.6 seconds, light, centered, the screen in its phone frame (`--screen: 520px`). Scenes dissolve over 0.4 s. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

| Seconds      | Title              | Screen                                                                           |
| ------------ | ------------------ | -------------------------------------------------------------------------------- |
| 0 to 2.6     | أذكار يومك في مكان | `journey` (all scenes to 18.6 play it from 6.8 s): the home page, a scroll       |
| 2.6 to 4.2   | افتح أي قسم        | a tap on «الصباح والمساء»                                                        |
| 4.2 to 5.7   | الصباح أو المساء   | a tap on «المساء», the sun turns                                                 |
| 5.7 to 9     | لكل ذكر تخريجه     | scroll to the foot of آية الكرسي, open «التخريج»: «صحّحه الألباني»                 |
| 9 to 12.9    | انتقل بين الأقسام   | back to the top, the sections menu, «عند النوم»                                  |
| 12.9 to 15.6 | وبين المجموعات     | the group «عند الفراش», open «التخريج»: «صحيح البخاري (٦٣٢٠)»                    |
| 15.6 to 17.2 | لكل ذكر صفحته      | «صفحة الذكر»: باسمك رب وضعت جنبي                                                 |
| 17.2 to 18.6 | نصا أو صورة        | a tap on «نسخ», then on «الصورة»                                                 |
| 18.6 to 21.2 | نصا أو صورة        | `dhikr.png` (the page at 25.4 s of `journey`), and `card.png` grows over it      |
| 21.2 to 23.9 | نهارا أو ليلا       | `footer` from 3.2 s: scroll to the footer, «المظهر» turns the page dark          |
| 23.9 to 26   | صدقة جارية عن شروق | the dark footer; 76 px, faded in, its line box kept at 88 px × `--leading-tight` |
| 26 to 28.6   | احفظه في شاشتك     | the end card: the mark and «وِردي», then wirdy.site                               |

`card.png` is the file «الصورة» downloads, fetched from the live site (`/og/nawm/bismika-rabbi-wadatu-janbi-524f5279.png`). In the installed app, «الصورة» opens iOS's file screen, so it is the last tap of its take and the film lays the real image over it.

### Measured

From rendered frames (grayscale ink against the paper):

- Every scene: the phone's black body at x 260 to 819 and y 452 to 1621, centered to the pixel. Each title's ink centered within 1 px.
- The card: x 101 to 978, centered at 539.5, its middle at y 960.
- The end card: the CTA, the mark with «وِردي», and the domain each within 1 px of the center; the group's ink from y 784 to 1136, its middle at 960. The mark and name row sits 4 px left by its ink, so `film__brand` moves it 4 px; this film's end group moves 4 px down.

### The takes

Each take is one `run-sequence`, recorded with `showTouches: false` and `trimStatic: false`.

1. `journey`, from the home page at the top, morning chosen: hold 1 s; swipe up 0.8 to 0.55 over 0.9 s, no momentum; hold 0.8 s; tap the card (0.5, 0.3), hold 1.6 s; tap «المساء» (0.276, 0.395), hold 1.4 s; swipe up 0.88 to 0.18 over 0.9 s, hold 0.5 s; tap «التخريج» (0.847, 0.527), hold 1.8 s; swipe down 0.25 to 0.92 over 0.7 s, hold 0.6 s; tap «الأقسام» (0.176, 0.101), hold 1 s; tap «عند النوم» (0.6, 0.392), hold 1.5 s; tap «عند الفراش» (0.658, 0.4), hold 1.3 s; tap «التخريج» (0.847, 0.477), hold 1.3 s; tap «صفحة الذكر» (0.227, 0.62), hold 1.5 s; tap «نسخ» (0.5, 0.882), hold 1.3 s; tap «الصورة» (0.158, 0.882), hold 1.2 s.
2. `footer`, from the top of the same dhikr page, light: hold 0.5 s; swipe up 0.85 to 0.2 over 0.8 s, no momentum; hold 0.9 s; tap «المظهر» (0.559, 0.89), hold 2.5 s.

Between takes: quit the web app (`xcrun simctl terminate <udid> com.apple.webapp`), because the file screen has no way back, and open it again from its icon. After `footer`, tap «المظهر» again to leave the theme light.
