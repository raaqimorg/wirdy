# Exceptions

Wirdy is meant to look boring: Markdown in, static HTML pages out. Anything that does not look like that needs a reason here, so the next person (human or agent) does not try to "fix" it. See `AGENTS.md`, "Keep it boring".

This list is short on purpose. If you find unusual code that is not here, say so. Either it belongs here, or the code should change.

## One page serves the morning and the evening

The morning and evening forms of a dhikr differ in a few words (أصبحنا or أمسينا). The page shows both, so the reader rarely has to switch. A line under the banner says which form leads, and links to the other one with `?w=` («تُعرض صيغة الصباح · اعرض صيغة المساء»). An inline script in `src/layouts/Paper.astro` sets `data-wird` on `<html>` before the first paint, and CSS leads with the form for now (`src/styles/paper.css`). Each word of that form is followed by its other form, muted and struck through, so the reader sees the other wording and the eye skips it.

- The script picks the morning from 03:00 to 11:59 local time, and the evening otherwise. `?w=s` or `?w=m` in the URL overrides it. The switch is at noon, not at Asr, because in winter Asr comes before 15:00 (about 14:43 in Riyadh, 14:27 in Dammam, and 13:38 in London in December). Between Dhuhr and Asr, the next set, the evening, is the right guess.
- It is inline, not a module, so the right form leads on the first paint, with no flash.
- Without JavaScript, the page leads with the morning form, and the line that names the form is hidden (`<noscript>`), because its link would change nothing.
- The struck form is `aria-hidden` and cannot be selected, so VoiceOver and copying give the form for now only. Each struck word is joined to its word with a no-break space, not `white-space: nowrap`, because Safari does not wrap before a `nowrap` span in right-to-left text and the line runs past the screen.
- A dhikr for one time only (`mode: "sabah"` or `"masaa"`) always shows, under «في الصباح» or «في المساء», and its text is muted at the other time.

## An empty touch listener turns on the press state on iPhones

A card shrinks to 97% while it is pressed (`.card:active` in `src/styles/paper.css`), and every other link and button dims to 60%, so a tap answers on the first frame. iOS Safari applies `:active` only when the page listens for touches, so the inline script in `src/layouts/Paper.astro` adds a `touchstart` listener that does nothing.

- Without it, an iPhone tap gives no feedback at all, because `a` turns off the grey tap highlight (`-webkit-tap-highlight-color: transparent`).
- The listener is `passive`, so it never delays scrolling.
- The ordinary way is to bring back the grey tap highlight. It is a flat flash on the link's box, not the press of an iOS control.

## A button switches between light and dark

The site follows the device's light or dark mode. The moon or sun button in the top bar (`components/Tools.astro`) flips it, and the browser remembers the choice in `localStorage` under `theme`. The owner asked for the button.

- The ordinary way is to follow the device only, with no button and no script.
- The inline script in `src/layouts/Paper.astro` applies a saved choice as `data-theme` on `<html>` before the first paint, so the page never flashes the other mode. It also sets both `theme-color` metas to the chosen paper, so the browser bar matches.
- The button has two states. It starts from the device's mode, and a click flips to the other one. When a click lands on the device's own mode, the script forgets the saved choice, so the site follows the device again. There is no third «automatic» state.
- The button is named «الوضع الداكن», and its `aria-pressed` says whether the dark mode is on. The script sets it when the page loads, on each click, and when the device's mode changes.
- The dark colors appear twice in `src/styles/paper.css`: once for a device in dark mode with no saved light choice, and once for a saved dark choice. Change both together. Each block also sets `--deepen`, which darkens the occasion colors by 22% so they do not glare at night.
- Without JavaScript, the button is hidden (`<noscript>`), and the page follows the device.

## The `{{morning|evening}}` markers

A dhikr that changes between the morning and the evening is one file with markers, not two files. Two files would drift apart. `src/lib/variants.ts` parses the markers, and it throws on any malformed marker, so a typo fails the build instead of reaching the page. `pairWords` then pairs the two forms of a marker word by word, so a word that both forms share shows once (`components/WordForm.astro`).

## The Quran ornaments live in CSS

The brackets ﴿ ﴾ and the آية mark ۝ are CSS `content` with empty alternative text (`content: "﴿" / ""`). The HTML holds only the text of the آيات. Copying the text, or reading it with a screen reader, gives the words without the ornaments.

- Consecutive سور are parted by an empty gap (`.ayat-sep`), not by ۞. In the مصحف, ۞ marks the start of a ربع الحزب (its Unicode name is «ARABIC START OF RUB EL HIZB»), so between سور it suggests a division that is not there. Each سورة already opens with ﴿.

## A share link opens the device's share sheet

Each dhikr has a link to its own page, drawn as a share icon. The inline script in `src/layouts/Paper.astro` opens the device's share sheet with that link. Where there is no share sheet, it copies the link and says «نُسخ الرابط». The owner asked for it.

- The ordinary way is the link alone. It still is one: without JavaScript, or with a modifier key, it opens the dhikr's page.
- It shares the link, not the image. Some apps drop the link when an image comes with it. The dhikr's page has a plain download link for the image.
- A place in an occasion page is a plain `#slug`, marked with `:target` in CSS. The text after `#` never reaches the server, so only a page of its own can have its own sharing card.
- The script keeps the `#slug` when the reader switches between the morning and the evening form.

## Each dhikr has a card, named by its fingerprint

`scripts/opengraph/adhkar.mjs` draws `public/og/<occasion>/<slug>-<fingerprint>.png` for each dhikr, 1200 by 630. `src/lib/card.ts` decides what the card says and computes the fingerprint from it.

- The name changes when the card changes, so an app that cached the old image fetches the new one, and a test fails when a card was not redrawn. Run `bun run opengraph:adhkar`. It draws only the cards that changed.
- Raise `TEMPLATE` in `src/lib/card.ts` when only the drawing changes.
- A long text stops at the end of a clause, and قرآن at the end of an آية, never inside one (`src/lib/excerpt.ts`). CSS line clamping cut the Quran marks, and could end a card on «لا إله».
- The card carries the moment, the count, and the takhrij, because an image travels without its page. A قرآن card names Tanzil.

## The icons and the OpenGraph cards come from a headless browser

`scripts/icons/build.mjs` and `scripts/opengraph/build.mjs` render HTML in a local Chromium-based browser (`scripts/chromium.mjs`) and save screenshots. `scripts/icons/build.mjs` also writes `favicon.ico` by hand, because the format is a short header and a list of PNGs, and it writes `favicon.svg` from `src/lib/mark.ts`, so the header mark and the favicon cannot drift apart.

- The ordinary way is an image library such as `sharp`. That adds a native dependency for two scripts that run only when the mark or the card changes.
- The OpenGraph cards draw the same mark, colors, and emblems as the site, from `src/lib/`, in the site's own fonts from `@fontsource`. The home card shows every occasion. Each occasion card shows its heading, its count, and its emblem on its color, as its page banner does. Run `bun run opengraph` after you change any of them, or after you add or remove a dhikr, because the cards print the count.
