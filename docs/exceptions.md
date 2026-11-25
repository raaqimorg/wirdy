# Exceptions

Wirdy is boring on purpose: Markdown in, static HTML out. Each choice below breaks that, with its reason, so nobody "fixes" it. If you find unusual code not listed here, say so: it belongs here, or it changes.

## One page serves the morning and the evening

The two forms differ in a few words (أصبحنا, أمسينا). The page holds both and shows one. A switch at the top («الصباح»، «المساء») changes the form in place, and the script marks the shown one with `aria-current`. An inline script in `src/layouts/Paper.astro` sets `data-wird` on `<html>` before the first paint, and CSS hides the other form (`src/styles/components/variant-text.css`). The owner asked for it.

- The script picks the morning before local noon, the evening after. `?w=s` or `?w=m` overrides it. `sessionStorage` keeps the choice with the form due when it was made, so it holds across pages and ends when the next form is due. The back button shows the last choice. The switch is at noon, not Asr, because winter Asr comes before 15:00 (about 14:43 in Riyadh, 14:27 in Dammam, 13:38 in London in December). Between Dhuhr and Asr, the evening is the right guess.
- It is inline, not a module, so the right form shows on the first paint, with no flash.
- Without JavaScript, the page shows the morning, and `<noscript>` hides the switch.
- A one-time dhikr (`mode: "sabah"` or `"masaa"`) hides at the other time, and the page count follows. A `#slug` link still shows it, through `:target`. Its own page always shows it.
- A title made of the text's first words follows the evening form too (`eveningTitle` in `src/lib/title.ts`). The `<title>`, the card, and search keep the morning form.

## An empty touch listener turns on the press state on iPhones

A pressed card shrinks to 97% (`src/styles/components/occasion-card.css`), and every other link and button dims to 60% (`src/styles/base.css`), so a tap answers on the first frame. iOS Safari applies `:active` only when the page listens for touches, so the inline script in `src/layouts/Paper.astro` adds an empty `touchstart` listener.

- Without it, an iPhone tap shows nothing, because `-webkit-tap-highlight-color: transparent` turns off the grey highlight.
- The listener is `passive`, so it never delays scrolling.
- The ordinary way is the grey highlight: a flat flash on the link's box, not an iOS press.

## A button switches between light and dark

The site follows the device's mode. The «المظهر» button in every footer (`components/ThemeToggle.astro`) flips it, and `localStorage` keeps the choice under `theme`. The owner asked for it.

- The ordinary way is to follow the device only, with no button and no script.
- The inline script in `src/layouts/Paper.astro` sets a saved choice as `data-theme` on `<html>` before the first paint, so the page never flashes. It also sets both `theme-color` metas to the chosen paper.
- Two states: the button starts from the device's mode, and a click flips it. A click back to the device's mode forgets the choice. There is no «automatic» state.
- The label «المظهر» never changes. `aria-pressed` says whether dark is on. The script sets it on load, on click, and when the device's mode changes.
- `src/styles/tokens.css` holds the dark colors twice: for a dark device with no saved light choice, and for a saved dark choice. A test fails when they differ. Each block sets `--tone-shade`, which darkens the occasion colors by 10% (the night step in [`design-system.md`](design-system.md)).
- Without JavaScript, `<noscript>` hides the button, and the page follows the device.

## The code is written with Effect

Every TypeScript module uses [Effect](https://effect.website): `Effect` for work that can fail, `Option` for an absent value, `Schema` for outside data, and the `FileSystem`, `Path`, and `ChildProcess` services in the scripts. The owner asked for it, for the strictest code.

- The ordinary way for Astro is plain TypeScript, zod at the schema, and `throw` on bad content.
- Astro reads a collection schema only as zod. `src/content.config.ts` wraps each Effect `Schema` in `z.unknown().transform(...)`: Effect is the one source, zod the bridge.
- The decoders refuse unknown fields (`STRICT` in `src/lib/schema.ts`), as zod's `strictObject` did. A record decodes to the same JSON, key for key, so fingerprints and cards do not change.
- The search module carries the Effect runtime and `Schema`: about 30 KB gzipped, against 2 KB before. `components/SearchSheet.astro` loads it on every page but `/bahth/`, and the browser keeps it for a year.
- Two files stay plain JavaScript. The inline script in `src/layouts/Paper.astro` runs before the first paint, and `scripts/verification/capture.js` is pasted into the browser on dorar.net or sunnah.com. Neither can import a module.
- A test runs the Effect at its edge (`Effect.runSync`, or `Effect.runPromise` with the Node services), so its assertions stay plain ([`testing.md`](testing.md#how-to-write-one)).

## The `{{morning|evening}}` markers

A dhikr that changes between morning and evening is one file with markers, because two files drift apart. `src/lib/variants.ts` parses the markers and fails with `MalformedMarker`, so a typo fails the build, not the page.

## The Quran ornaments live in CSS

﴿ ﴾ and ۝ are CSS `content` with empty alternative text (`content: "﴿" / ""`). The HTML holds only the آيات, so copy and screen readers give the words alone.

- A folded سورة (`ayat: "fold"`) ends its shown part with ۝, not ﴾, because it goes on. Its ﴾ follows the last آية inside the `<details>` (`.surah__ayat::after`), so it shows only when open.
- The button of an open سورة is `position: sticky` under the bar, so a long سورة folds from anywhere. `.entry` uses `overflow: clip`, not `hidden`, because a scroll container stops the sticky button.
- A gap parts consecutive سور (`src/styles/components/surah.css`), not ۞. In the مصحف, ۞ marks a ربع الحزب («ARABIC START OF RUB EL HIZB»), so between سور it suggests a false division. Each سورة already opens with ﴿.

## A share link opens the device's share sheet

Each dhikr page has a share button beside «نسخ» and «الصورة». It links to the page itself. The inline script in `src/layouts/Paper.astro` opens the share sheet with that link, or, with no share sheet, copies it and says «نُسخ الرابط». The owner asked for it. In a list, a card's foot has «نسخ» and a plain link, «صفحة الذكر», on their own line under the takhrij.

- The ordinary way is the plain link. It still is one: without JavaScript, or with a modifier key, it opens the page.
- It shares the link, not the image, because some apps drop a link sent with an image. The page has a plain download link for the image.
- A place on an occasion page is a plain `#slug`, marked with `:target`. The fragment never reaches the server, so only a page of its own can have its own card.
- Switching between morning and evening keeps the `#slug`.

## A button copies a dhikr with its takhrij

Each dhikr has a copy button, in its card's foot and on its page. It copies the words, then the count and moment when present, then the takhrij, so a dhikr never travels without its source. The owner asked for it.

- The ordinary way is to select the text. That still works, and gives the count once.
- `src/lib/copy.ts` writes the copy at build time into `data-copy`, and `data-copy-masaa` for an evening form. The script copies the shown form. So the words are in the page twice.
- قرآن copies as Tanzil gives it: one آية on each line, a blank line between سور, no ornaments. A dhikr with `counts` gives one phrase on each line, with its count.
- The message («نُسخ الذكر», or «تعذّر النسخ») is a `role="status"`. In a card it lies over the foot, beside the buttons, so nothing moves under the finger.
- Without JavaScript, `<noscript>` hides the button.
- «ما لم يثبت» has no copy button, so a weak dhikr never travels without its ruling.

## A colored layer sits behind the top of a page with a color

An iPhone bounce at the top uncovers the area above the page, painted in the color of `body`. On an occasion page that showed a paper band between the status bar and the colored bar. So `.page::before` (`src/styles/utilities.css`) is a fixed layer in the bar's color, behind the page. It stays in place while the page bounces, so the bounce uncovers it.

- The ordinary way is to let the page color show, as on most sites.
- `.page` has the paper color and is at least as tall as the layer, so the layer shows only in the bounce. The bottom bounce stays paper.
- A colored `body` fixes the top only: the bottom bounce and the area behind Safari's bottom bar take that color too.
- `html { background }` does not change the bounce color, and an element above the page with a negative offset is not painted there.
- The home, search, and 404 pages have no color and no layer.
- Safari on iOS 26 paints the status bar in the sticky bar's color only when the bar is solid with no `backdrop-filter`, so the bar is solid on every page.

## Each dhikr has a card, named by its fingerprint

`scripts/opengraph/adhkar.ts` draws `public/og/<occasion>/<slug>-<fingerprint>.png` for each dhikr, 2400 by 1260: 1200 by 630 at twice the scale, so the text stays sharp on a phone and after a chat app compresses it. One card serves the link preview and the «الصورة» download. `src/lib/card.ts` decides what the card says and computes the fingerprint from it.

- A changed card gets a new name, so an app with the old image cached fetches the new one, and a test fails when a card was not redrawn. Run `bun run opengraph:adhkar`. It draws only changed cards.
- Raise `TEMPLATE` in `src/lib/card.ts` when only the drawing changes.
- The card mirrors the page: a band in the occasion's color with the name, its context (lighter, on the name's line when it fits, under it otherwise), and the count; the words in ink on the panel; a muted foot. The words take the largest size that fits. A text that does not fit gets a red outline, and a build test refuses it.
- A long text stops at a clause end, and قرآن at an آية end (`src/lib/excerpt.ts`). CSS line clamping cut the Quran marks and could end a card on «لا إله».
- The card carries the moment, count, and takhrij, because an image travels without its page. A قرآن card says «النص: tanzil.net» in its foot.

## The icons and the OpenGraph cards come from a headless browser

`scripts/icons/build.ts` and `scripts/opengraph/build.ts` render HTML in a local Chromium browser (`scripts/chromium.ts`) and save screenshots. `scripts/icons/build.ts` also writes `favicon.ico` by hand (a short header and a list of PNGs) and `favicon.svg` from `src/lib/mark.ts`, so the header mark and the favicon cannot drift.

- The ordinary way is an image library such as `sharp`: a native dependency for two scripts that run only when the mark or a card changes.
- The cards draw the site's mark, colors, and emblems from `src/lib/`, in the site's fonts from `@fontsource`. The home card shows every occasion. Each occasion card shows its heading, count, and emblem on its color, like its page banner. Run `bun run opengraph` after changing any of them, or adding or removing a dhikr, because the cards print the count.

## Search opens over the page, from a module script

Every bar ends in a search icon (`components/Bar.astro`). A tap opens search over the page (`components/SearchSheet.astro`, a `<dialog>`). On a phone it fills the screen, and its first row takes the page color, because Safari keeps that color behind the clock. On a wide screen it is a centered panel over a dimmed page. Before typing, it lists six suggestions. Results update as the reader types, grouped by section, each under its emblem, name, and count. Arrow keys move between the field and the results. A tap on a result closes it and goes to the dhikr. `/`, ⌘K, or Ctrl+K opens it. The owner asked for it.

- The ordinary way is a link to a search page. The icon still is one: without JavaScript, or with a modifier key, it opens `/bahth/`.
- The rows come from one file, `/search/<version>.json` (`src/pages/search/[version].json.ts`). The version is a hash of the rows, so any dhikr change renames it. `_headers` caches it for a year, so no reader sees an old index. The sheet fetches it on first open, so a page only read never loads it. If the fetch fails, the field opens `/bahth/`.
- Each group head comes from one `<template>` per section in the page, so the index carries the section id, not its drawing.
- An ordinary Astro `<script>` imports `src/scripts/search.ts`, which imports `src/lib/search.ts`, so folding, matching, and marking have unit tests. Astro bundles it into `_astro/`, cached for a year. Nothing in it runs before the first paint.
- `/bahth/` holds one row for each dhikr and each «ما لم يثبت» entry in its HTML, so the page is its own index, with the same script. The query never goes in the URL. Back from a result, the back-forward cache shows the page as it was. When the browser dropped the page, the script restores the last query from `sessionStorage`, on a back or forward navigation only.
- A reader does not type Tanzil's Uthmani spelling, so a سورة is found by its name. A قرآن row carries only the آيات its card shows folded, and shows only its name, so no آية is cut.
- Without JavaScript, `/bahth/` hides its field and count (`<noscript>` in `src/layouts/Paper.astro`) and is a plain list of every row for the browser's find. `/bahth/` is `noindex` and out of the sitemap.

## Search remembers the results the reader opens

Before typing, search lists «آخر ما فتحت»: the last results opened from search, newest first, with «مسح» to forget them. `localStorage` keeps them under `search-history`. They never leave the device. The owner asked for it.

- The ordinary way is no history, or the browser's own field history.
- It keeps the link of an opened result, not the typed words, because an opened result is a search that found its dhikr.
- `src/lib/history.ts` holds the rules, with tests. The value is `{ "version": 1, "hrefs": [...] }`. Raise `HISTORY_VERSION` when the shape changes. A value of another version is removed, and the list starts empty.
- The stored text is untrusted. It is refused when over 4 KB (before parsing), not JSON, or holding an unknown field, more than 8 links, or a link that is not a site path. A refused value is removed.
- It keeps 8 links, each once. A link with no row in the index (a removed or renamed dhikr) does not show, and the next read drops it.
- Each list row copies its index row, so a stored link never becomes markup. Every read and write is in a `try`, because Safari's private mode and a full storage throw.
- Another tab's opened result updates the list through the `storage` event.

## The proofs are JSON files in git

`verification/` holds a record for each proven dhikr. The tests read them; the site does not. The owner asked for saved proofs, so a check never starts from zero.

- The ordinary way is a database such as SQLite, or no record. In git, each proof change is readable and reviewed, and branches merge.
- `scripts/verification/capture.js` runs in the browser on the site itself, because dorar.net and sunnah.com refuse scripted requests. It reads one page every 3 seconds, and one button copies all of them, because a download opens a dialog for each file.
- oxfmt ignores `src/lib/fixtures`, because a captured text stays as its page gave it.
