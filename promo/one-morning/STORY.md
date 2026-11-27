# One morning on the site

## The one thing

«أذكار يومك في مكان، ومع كل ذكر مصدره. افتح wirdy.site.»

The viewer already reads adhkar from a booklet or another app. The film shows what is different: one page for each occasion, the morning and evening forms, and the source under every dhikr. The owner cut the search scene from the first cut, then asked for a longer walk: the sections menu, a group, a dhikr page, copy, the image, the theme, and the footer's «صدقة جارية عن شروق». The third cut dropped the call to action and most titles, made every change move, and ends by zooming into the footer's line and lifting it out as the last frame. The fourth cut is one take and shorter: every section down to الطب النبوي, back through the sections menu to الصباح والمساء, from the evening the page opens on to the morning, a dhikr's page, copy, the theme, and the same ending. It dissolves across each of the site's instant changes, so nothing flickers. The owner then cut two of its four titles, «والطب النبوي», which set the tibb apart as something different, and «نهارا أو ليلا», which the theme already shows: the screens tell the rest.

## The storylines

**A. One morning on the site** (picked by the owner). One continuous walk through the real site, with one line of title above the screen naming each step. Frame 0 is the home page under «أذكار يومك في مكان واحد». Beats: home → open «الصباح والمساء» → switch to المساء → open «التخريج» → end card «احفظه في شاشتك الرئيسية». Light paper, the section's color, the site's motion.

**B. Find it in three seconds.** One question, answered on screen. Frame 0 is the search sheet with «النوم» being typed. Beats: type → open a result → push into its takhrij → «افتح wirdy.site». Night theme, the sleep section's blue.

**C. The source first.** The proof, then the pull back. Frame 0 is a close-up of «صححه الألباني» on a card. Beats: the card → its section → the home page → the end card.

## The spec

Silent, 1080 by 1920, 26 seconds, light until the theme turns, centered. One take and one scene: one phone (`--screen: 520px`) that never moves until the end, and two general titles that take turns above it, each entering from the right over a second and leaving to the left. The screens show the steps; no title names a tap, and there is no call to action. Footage from the live site, opened from its home screen icon on an iPhone 17 Pro simulator, the status bar at 9:41. Titles carry no tashkil; only «وِردي» keeps its kasra.

The take is two recordings, `walk-a` and `walk-b`, cut where the screen stands still, so no cut shows. `walk-a` plays from 5.58 s (`data-start="-5.5833"`, half a frame past 167 frames, so every seek lands inside a frame) until 12.89, then from frame 840 (`data-start="-15.1167"`), which skips the 9.5 s the screen held after the morning swipe. `walk-b` takes over at 15.49 (`data-start="12.4833"`), on the same still frame of the dhikr page.

| Seconds      | Title              | Screen                                                                                                                                                 |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 to 3.5     | أذكار يومك في مكان | the home page under «لا ذكر هنا إلا ما صح عن النبي ﷺ، بدرجته ومصدره», two flicks down through every section, past الجمعة, to الطب النبوي                 |
| 3.5 to 7.8   | none               | الطب النبوي opens at 4.1, its first hadith's «التخريج»: «صحيح مسلم (٢٢٠٠)»                                                                             |
| 7.8 to 16.4  | مع كل ذكر تخريجه   | «الأقسام» at 7.22, «الصباح والمساء» at 8.76 (open on المساء, the clock's choice), «الصباح» at 10.15, «التخريج» of آية الكرسي at 13.41, its page at 15.1 |
| 16.4 to 19.8 | none               | a scroll to the foot of the page at 15.73, «نسخ» at 17.43, «المظهر» turns it dark at 18.97                                                             |
| 19.8 to 21.8 | none               | the camera zooms 3.917 times into «صدقة جارية عن شروق», and the frame turns to the dark paper                                                          |
| 21.8 to 26   | none               | the line is lifted out as type, the phone fades, the line brightens; the mark and «وِردي» at 22.6, wirdy.site at 23                                     |

Each of the site's instant changes (the tibb page, the sections menu, the morning page, the dhikr page, the theme) is covered by the frame before it, `a-<frame>.png` or `b-<frame>.png`, fading out (`data-motion="cover"`), so the change dissolves. The stills inherit the screen's `--for: 2`, so each dissolve takes 2 s. The cut inside `walk-a` is covered the same way, so the scroll bar fades across it.

### Measured

From rendered frames (grayscale ink against the paper):

- The phone's black body at x 260 to 819 and y 452 to 1621 at every title, centered to the pixel. Each title's ink centered within 1 px.
- The dedication in the footer: ink at x 417 to 787 and y 2215 to 2260 of the 1206 by 2622 clip, the same in `walk-b` as in the earlier takes, so the zoom turns about (280.3, 985.5) px of the phone's box.
- At 21.79 s the zoomed line's ink is x 226 to 852, y 743 to 821; the typeset line's is x 226 to 853, y 744 to 821. Same size, same place, within 1 px.
- The last frame: the line, the mark with «وِردي», and the domain each within 1 px of the center; their ink from y 744 to 1177, its middle at 960.5.
- No flicker: no frame in either clip or the render differs from both its neighbours while they match, and none is blank. In the render, no frame jumps but the zoom. Across both cuts the frames differ only in single pixels of compression noise.

### The take

Recorded with `showTouches: false` and `trimStatic: false`, from the home page at the top, light, in the evening (the page of الصباح والمساء opens on المساء by the clock; it does not remember a choice). Two `run-sequence` calls, because a swipe with no momentum still stops a little differently each time, so the taps after it are read off the screen. The first, recorded as `walk-a`:

hold 1.2 s; flick up 0.8 to 0.3 in 100 ms, twice, 450 ms apart (they reach the bottom and bounce); hold 2.2 s; tap «الطب النبوي» (0.5, 0.748), wait for «الرقية», hold 1 s; tap «التخريج» (0.847, 0.812), hold 1.5 s; tap «الأقسام» (0.286, 0.101), wait for the menu, hold 0.8 s; tap «الصباح والمساء» (0.556, 0.172), wait for «أصبحنا وأمسينا», hold 1.1 s; tap «الصباح» (0.725, 0.395), hold 1.4 s; swipe up 0.88 to 0.18 over 0.9 s, no momentum, hold 1.5 s. Read where «التخريج» of آية الكرسي landed (0.500 here), then: tap it (0.847, 0.5), hold 1.5 s; tap «صفحة الذكر» (0.227, 0.694), and wait for the title «آية الكرسي» on its page.

The second, recorded as `walk-b` from that still page: hold 1.5 s; swipe up 0.88 to 0.12 over 1 s, no momentum, hold 0.6 s; tap «نسخ» (0.5, 0.663), hold 1.4 s; tap «المظهر» (0.559, 0.89), hold 5.5 s.

Afterwards tap «المظهر» again to leave the theme light.
