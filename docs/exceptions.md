# Exceptions

Wirdy is meant to look boring: Markdown in, static HTML pages out. Anything that does not look like that needs a reason here, so the next person (human or agent) does not try to "fix" it. See `AGENTS.md`, "Keep it boring".

This list is short on purpose. If you find unusual code that is not here, say so. Either it belongs here, or the code should change.

## One page serves the morning and the evening

The morning and evening forms of a dhikr differ in a few words (أصبحنا or أمسينا). The page shows both, so the reader rarely has to switch. A switch under the title («الصباح»، «المساء») shows either form at once, without loading the page again, and the script marks the one that shows with `aria-current`. An inline script in `src/layouts/Paper.astro` sets `data-wird` on `<html>` before the first paint, and CSS leads with the form for now (`src/styles/components/variant-text.css`). Each word of that form is followed by its other form, muted and struck through, so the reader sees the other wording and the eye skips it.

- The script picks the morning from 03:00 to 11:59 local time, and the evening otherwise. `?w=s` or `?w=m` in the URL overrides it. The choice is kept in `sessionStorage`, with the form that was due when it was made, so it holds from page to page and ends when the next form is due. Returning to a page with the back button shows the last choice. The switch is at noon, not at Asr, because in winter Asr comes before 15:00 (about 14:43 in Riyadh, 14:27 in Dammam, and 13:38 in London in December). Between Dhuhr and Asr, the next set, the evening, is the right guess.
- It is inline, not a module, so the right form leads on the first paint, with no flash.
- Without JavaScript, the page leads with the morning form, and the switch is hidden (`<noscript>`), because it would change nothing.
- The struck form is `aria-hidden` and cannot be selected, so VoiceOver and copying give the form for now only. Each struck word is joined to its word with a no-break space, not `white-space: nowrap`, because Safari does not wrap before a `nowrap` span in right-to-left text and the line runs past the screen.
- A dhikr for one time only (`mode: "sabah"` or `"masaa"`) always shows, under «في الصباح» or «في المساء». At the other time its text is muted and struck through, like a word of the other form. Its own page shows it plain.

## An empty touch listener turns on the press state on iPhones

A card shrinks to 97% while it is pressed (`src/styles/components/occasion-card.css`), and every other link and button dims to 60% (`src/styles/base.css`), so a tap answers on the first frame. iOS Safari applies `:active` only when the page listens for touches, so the inline script in `src/layouts/Paper.astro` adds a `touchstart` listener that does nothing.

- Without it, an iPhone tap gives no feedback at all, because `a` turns off the grey tap highlight (`-webkit-tap-highlight-color: transparent`).
- The listener is `passive`, so it never delays scrolling.
- The ordinary way is to bring back the grey tap highlight. It is a flat flash on the link's box, not the press of an iOS control.

## A button switches between light and dark

The site follows the device's light or dark mode. The moon or sun button in the top bar (`components/ThemeToggle.astro`) flips it, and the browser remembers the choice in `localStorage` under `theme`. The owner asked for the button.

- The ordinary way is to follow the device only, with no button and no script.
- The inline script in `src/layouts/Paper.astro` applies a saved choice as `data-theme` on `<html>` before the first paint, so the page never flashes the other mode. It also sets both `theme-color` metas to the chosen paper, so the browser bar matches.
- The button has two states. It starts from the device's mode, and a click flips to the other one. When a click lands on the device's own mode, the script forgets the saved choice, so the site follows the device again. There is no third «automatic» state.
- The button is named «الوضع الداكن», and its `aria-pressed` says whether the dark mode is on. The script sets it when the page loads, on each click, and when the device's mode changes.
- The dark colors appear twice in `src/styles/tokens.css`: once for a device in dark mode with no saved light choice, and once for a saved dark choice. A test fails when they differ. Each block also sets `--tone-shade`, which darkens the occasion colors by 12% so they do not glare at night.
- Without JavaScript, the button is hidden (`<noscript>`), and the page follows the device.

## The `{{morning|evening}}` markers

A dhikr that changes between the morning and the evening is one file with markers, not two files. Two files would drift apart. `src/lib/variants.ts` parses the markers, and it throws on any malformed marker, so a typo fails the build instead of reaching the page. `pairWords` then pairs the two forms of a marker word by word, so a word that both forms share shows once (`components/WordForm.astro`).

## The Quran ornaments live in CSS

The brackets ﴿ ﴾ and the آية mark ۝ are CSS `content` with empty alternative text (`content: "﴿" / ""`). The HTML holds only the text of the آيات. Copying the text, or reading it with a screen reader, gives the words without the ornaments.

- Consecutive سور are parted by an empty gap (`src/styles/components/surah.css`), not by ۞. In the مصحف, ۞ marks the start of a ربع الحزب (its Unicode name is «ARABIC START OF RUB EL HIZB»), so between سور it suggests a division that is not there. Each سورة already opens with ﴿.

## A share link opens the device's share sheet

The page of each dhikr has a share button, next to «نسخ» and «الصورة». It is a link to the page itself. The inline script in `src/layouts/Paper.astro` opens the device's share sheet with that link. Where there is no share sheet, it copies the link and says «نُسخ الرابط». The owner asked for it. In a list, the foot of a card has a copy button and a plain link to the dhikr's page, drawn as a chevron. A third button would put 100 of the 196 takhrij lines on two lines at 390 px, and two buttons put 16.

- The ordinary way is the link alone. It still is one: without JavaScript, or with a modifier key, it opens the dhikr's page.
- It shares the link, not the image. Some apps drop the link when an image comes with it. The dhikr's page has a plain download link for the image.
- A place in an occasion page is a plain `#slug`, marked with `:target` in CSS. The text after `#` never reaches the server, so only a page of its own can have its own sharing card.
- Switching between the morning and the evening form keeps the `#slug`.

## A button copies a dhikr with its takhrij

Each dhikr has a copy button, in the foot of its card and on its own page. It copies the words, then the count and the moment when there are any, then the takhrij, so a dhikr does not travel without its source. The owner asked for it.

- The ordinary way is to select the text. That still works, and it also gives the count once.
- `src/lib/copy.ts` writes what to copy at build time, into `data-copy`. A dhikr with a morning and an evening form also has `data-copy-masaa`, and the script copies the form that shows. So the words are in the page twice.
- قرآن is copied as Tanzil gives it: one آية on each line, a blank line between سور, and no ornaments. A dhikr with `counts` gives one phrase on each line, with its count.
- The message («نُسخ الذكر», or «تعذّر النسخ» when the browser refuses) is a `role="status"`. In a card it lies over the foot, beside the buttons, so nothing moves under the finger.
- Without JavaScript, the button is hidden (`<noscript>`), because it would do nothing.
- «ما لم يثبت» has no copy button, so a weak dhikr does not travel without its ruling.

## A colored layer sits behind the top of a page with a color

When an iPhone bounces at the top of a page, it uncovers what is above the page and paints it in the color of `body`. On an occasion page that put a band of paper between the status bar and the colored bar, both in the occasion's color. So `.page::before` (`src/styles/utilities.css`) is a fixed layer in the color of the bar, behind the page. A fixed layer stays in place while the page bounces, so the bounce uncovers it.

- The ordinary way is to let the page color show there, as on most sites.
- `.page` has the paper color and is at least as tall as the layer, so the layer shows only in the bounce. The bounce at the end of a page stays paper.
- A colored `body` would fix the top only. The bounce at the end of the page, and the area behind Safari's bottom bar, would turn that color too.
- `html { background }` does not change the color of the bounce, and an element above the page with a negative offset is not painted there.
- The home and 404 pages have no color, so they have no layer.

## The bar shows the page title after a scroll

The bar of an occasion page repeats the heading, so the reader knows the page after the heading scrolls away. CSS fades it in with a scroll timeline (`animation-timeline: scroll(root)` in `src/styles/components/bar.css`), inside `@supports`. The owner asked for it.

- The ordinary way is a title that always shows, next to the same heading. A browser without scroll timelines still does that.
- The timeline sits in its own rule, apart from the `animation` shorthand. In one rule, the CSS minifier merges the two into a shorthand that browsers refuse. A build test checks it.
- The bar of a dhikr's own page has no title, because the page is short and its heading stays near.

## Each dhikr has a card, named by its fingerprint

`scripts/opengraph/adhkar.mjs` draws `public/og/<occasion>/<slug>-<fingerprint>.png` for each dhikr, 1200 by 630. `src/lib/card.ts` decides what the card says and computes the fingerprint from it.

- The name changes when the card changes, so an app that cached the old image fetches the new one, and a test fails when a card was not redrawn. Run `bun run opengraph:adhkar`. It draws only the cards that changed.
- Raise `TEMPLATE` in `src/lib/card.ts` when only the drawing changes.
- The card looks like the dhikr's page: a band in the occasion's color with the name and the count, the words in ink on the panel, and a muted foot. The size of the words is the largest that fits. A text that does not fit gets a red outline, and a build test refuses a card that has one.
- A long text stops at the end of a clause, and قرآن at the end of an آية, never inside one (`src/lib/excerpt.ts`). CSS line clamping cut the Quran marks, and could end a card on «لا إله».
- The card carries the moment, the count, and the takhrij, because an image travels without its page. A قرآن card says «النص: tanzil.net» in its foot.

## The icons and the OpenGraph cards come from a headless browser

`scripts/icons/build.mjs` and `scripts/opengraph/build.mjs` render HTML in a local Chromium-based browser (`scripts/chromium.mjs`) and save screenshots. `scripts/icons/build.mjs` also writes `favicon.ico` by hand, because the format is a short header and a list of PNGs, and it writes `favicon.svg` from `src/lib/mark.ts`, so the header mark and the favicon cannot drift apart.

- The ordinary way is an image library such as `sharp`. That adds a native dependency for two scripts that run only when the mark or the card changes.
- The OpenGraph cards draw the same mark, colors, and emblems as the site, from `src/lib/`, in the site's own fonts from `@fontsource`. The home card shows every occasion. Each occasion card shows its heading, its count, and its emblem on its color, as its page banner does. Run `bun run opengraph` after you change any of them, or after you add or remove a dhikr, because the cards print the count.
