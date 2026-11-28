# Exceptions

Wirdy is boring on purpose: Markdown in, static HTML out. Each choice below breaks that, with its reason, so nobody "fixes" it. If you find unusual code not listed here, say so: it belongs here, or it changes.

## One page serves the morning and the evening

The two forms differ in a few words (أصبحنا, أمسينا). The page holds both and shows one. A switch at the top («الصباح»، «المساء») changes the form in place, and the script marks the shown one with `aria-current`. An inline script in `src/layouts/Paper.astro` sets `data-wird` on `<html>` before the first paint, and CSS hides the other form (`src/styles/components/variant-text.css`). The owner asked for it.

- The script picks the morning before local noon, the evening after. `?w=s` or `?w=m` overrides it. `sessionStorage` keeps the choice with the form due when it was made, so it holds across pages and ends when the next form is due. The back button shows the last choice. The switch is at noon, not Asr, because winter Asr comes before 15:00 (about 14:43 in Riyadh, 14:27 in Dammam, 13:38 in London in December). Between Dhuhr and Asr, the evening is the right guess.
- It is inline, not a module, so the right form shows on the first paint, with no flash.
- Without JavaScript, the page shows the morning, and `<noscript>` hides the switch.
- A one-time dhikr (`mode: "sabah"` or `"masaa"`) hides at the other time, and the page count follows. A `#slug` link still shows it, through `:target`. Its own page always shows it.
- A title made of the text's first words follows the evening form too (`eveningTitle` in `src/lib/title.ts`). The card and search keep the morning form.

## An empty touch listener turns on the press state on iPhones

A pressed card shrinks to 97% (`src/styles/components/occasion-card.css`), and every other control answers by its shape (`src/styles/base.css`), so a tap answers on the first frame. iOS Safari applies `:active` only when the page listens for touches, so the inline script in `src/layouts/Paper.astro` adds an empty `touchstart` listener.

- Without it, an iPhone tap shows nothing, because `-webkit-tap-highlight-color: transparent` turns off the grey highlight.
- The listener is `passive`, so it never delays scrolling.
- The ordinary way is the grey highlight: a flat flash on the link's box, not an iOS press.

## The motion ignores the device's reduce motion setting

The site moves the same for every reader: the emblems, the cards, the menus, the sun, and the chevrons. No rule sits under `prefers-reduced-motion`, and the inline script does not read it. The owner chose it, so the site keeps one feel on a device set to reduce motion too.

- The ordinary way is to drop or soften motion when the device asks, as Apple's apps do: a dissolve in place of a move. WCAG 2.3.3 (level AAA) asks for a way to turn off motion that an interaction such as a scroll starts.
- The motion stays small and short, 500 ms at most for a move, and nothing loops, flashes, or moves the page itself.
- The build test refuses `prefers-reduced-motion` in the shipped CSS and pages, so it does not creep back into one component alone.

## An emblem's lit shape enters each time it comes into view

On a page's banner and on the home page's cards, an emblem's one lit shape enters its own way over `--duration-enter` with `--spring` whenever at least half of the emblem is on screen: on load for what shows, and on scroll for what comes in. Once the emblem has left the screen entirely, the shape resets, so it enters again when the reader comes back. The owner asked for it, so the emblems feel alive and not only fade.

- The ordinary way is CSS alone. A scroll-driven animation (`animation-timeline: view()`) ties the shape to the scroll position, so it never moves by itself: the owner saw it as a fade. A timed animation that starts on scroll needs `animation-trigger`, which Safari lacks.
- The inline script in `src/layouts/Paper.astro` sets `data-emblems` on `<html>` before the first paint, then watches every `[data-live]` emblem with an `IntersectionObserver` and sets `data-shown` on it at half in view, and removes it at none. `src/styles/components/emblem.css` hides a lit shape that is not shown, and runs its entrance when it is.
- Without JavaScript the script sets nothing, and every emblem shows whole and still. A device set to reduce motion still sees the entrance, as it sees all the site's motion ([`code-conventions.md`](code-conventions.md#motion)).
- The emblems in the section menu, in search, and on the «بقية الأقسام» cards stay still (`motion="still"`).

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
- The search module carries the Effect runtime and `Schema`: about 30 KB gzipped, against 2 KB before. `components/SearchSheet.astro` loads it on every page, and the browser keeps it for a year.
- Three files stay plain JavaScript. The inline script in `src/layouts/Paper.astro` runs before the first paint, `src/scripts/service-worker.js` runs as the service worker, and `scripts/verification/capture.js` is pasted into the browser on dorar.net or sunnah.com. None can import a module.
- A test runs the Effect at its edge (`Effect.runSync`, or `Effect.runPromise` with the Node services), so its assertions stay plain ([`testing.md`](testing.md#how-to-write-one)).

## The `{{morning|evening}}` markers

A dhikr that changes between morning and evening is one file with markers, because two files drift apart. `src/lib/variants.ts` parses the markers and fails with `MalformedMarker`, so a typo fails the build, not the page.

## The Quran ornaments live in CSS

﴿ ﴾ and the numbered ۝ are CSS `content` with empty alternative text (`content: "﴿" / ""`). The HTML holds only the آيات, so copy and screen readers give the words alone.

- Each آية ends with its number in ۝, in the section's color. A space follows each number but the last, so a screen reader and a selection keep the آيات apart, and a line breaks only after a number, never between a آية and its number. The number sits whole in `data-ayah` («۝٢٥٥») and CSS draws it with `content: attr(data-ayah)`: generated content split into two parts shapes them apart, and the digits fall outside the ornament. `from` in the frontmatter gives each سورة's first number ([`content.md`](content.md#the-file)).
- The ۝ is set in KFGQPC Hafs (`--font-ayah-end`), the one face that draws the number inside it. The آيات are in KFGQPC Naskh: Hafs is built for the Complex's own Quran text, and on Tanzil's text it breaks the dagger alef after a tatweel and the rounded zero after an alef.
- A folded سورة (`ayat: "fold"`) ends its shown part with its last ۝, not ﴾, because it goes on. Its ﴾ follows the last آية inside the `<details>` (`.surah__ayat::after`), so it shows only when open. When a dhikr holds more than one سورة, each button carries its order in hidden words («السورة الثانية», `surahLabel`), so a screen reader does not hear two buttons by one name. The content holds no names of سور.
- A gap parts consecutive سور (`src/styles/components/surah.css`), not ۞. In the مصحف, ۞ marks a ربع الحزب («ARABIC START OF RUB EL HIZB»), so between سور it suggests a false division. Each سورة already opens with ﴿.

## The KFGQPC faces ship as TTF, unchanged

The adhkar and the Quran are set in the faces of the King Fahd Glorious Quran Printing Complex (qurancomplex.gov.sa/fonts): KFGQPC Uthman Taha Naskh 2.0, regular and bold, and KFGQPC Hafs 3.0 for the numbered ۝. They sit in `src/fonts/` byte for byte as the Complex gives them. The owner asked for them.

- The ordinary way is a subset WOFF2, as `@fontsource` gives Plex. The Complex's license forbids modifying the font, so there is no subset and no WOFF2. Cloudflare compresses the TTF on the way (Naskh about 67 KB, Hafs about 125 KB with brotli).
- Their letters are smaller than their size says, so each face takes `size-adjust: 112%` (`src/styles/fonts.css`), which brings its alef to Amiri's height.
- KFGQPC Naskh has no glyphs for 14 Uthmani marks in Tanzil's text (ٱ, ۟, the waqf signs, the small و and ي). Each device draws them in its own Arabic face. Hafs has them, but breaks on Tanzil's text (above), and adding them to Naskh is a modification.

## A share link opens the device's share sheet

Each dhikr page and each hadith page has a share button beside «نسخ» and «الصورة». It links to the page itself. The inline script in `src/layouts/Paper.astro` opens the share sheet with that link, or, with no share sheet, copies it and turns its icon into a check for a moment. The owner asked for it. In a list, a card's foot has «نسخ» and a plain link, «صفحة الذكر» or «صفحة الحديث», on their own line under the takhrij.

- The ordinary way is the plain link. It still is one: without JavaScript, or with a modifier key, it opens the page.
- It shares the link, not the image, because some apps drop a link sent with an image. The page has a plain download link for the image.
- A place on an occasion page is a plain `#slug`, marked with `:target`. The fragment never reaches the server, so only a page of its own can have its own card.
- Switching between morning and evening keeps the `#slug`.

## A button copies a dhikr with its takhrij

Each dhikr has a copy button, in its card's foot and on its page. It copies the words, then the count and moment when present, then the takhrij, so a dhikr never travels without its source. A hadith copies its words, its narrator, and its takhrij. The owner asked for it.

- The ordinary way is to select the text. That still works, and gives the count once.
- `src/lib/copy.ts` writes the copy at build time into `data-copy`, and `data-copy-masaa` for an evening form. The script copies the shown form. So the words are in the page twice.
- قرآن copies as Tanzil gives it: one آية on each line, a blank line between سور, no ornaments. A dhikr with `counts` gives one phrase on each line, with its count.
- When the copy works, the button's icon turns into a check and grows from 60%, and its label reads «نسخ الذكر». When it fails, the icon turns into an alert and the label reads «تعذر النسخ», so a failure shows in words, not by an icon alone. Both turn back after 2.5 seconds (`data-copied`, and `icon--idle`, `icon--done`, and `icon--fail` in `icon.css`). A screen reader hears the same words from a hidden `role="status"`.
- Without JavaScript, `<noscript>` hides the button.

## A colored layer sits behind the top of a page with a color

An iPhone bounce at the top uncovers the area above the page, painted in the color of `body`. On an occasion page that showed a paper band between the status bar and the colored bar. So `.page::before` (`src/styles/utilities.css`) is a fixed layer in the bar's color, behind the page. It stays in place while the page bounces, so the bounce uncovers it.

- The ordinary way is to let the page color show, as on most sites.
- `.page` has the paper color and is at least as tall as the layer, so the layer shows only in the bounce. The bottom bounce stays paper.
- A colored `body` fixes the top only: the bottom bounce and the area behind Safari's bottom bar take that color too.
- `html { background }` does not change the bounce color, and an element above the page with a negative offset is not painted there.
- The home, search, and 404 pages have no color and no layer.
- Safari on iOS 26 paints the status bar in the sticky bar's color only when the bar is solid with no `backdrop-filter`, so the bar is solid on every page.

## Each dhikr has a card, named by its fingerprint

`scripts/opengraph/adhkar.ts` draws `public/og/<occasion>/<slug>-<fingerprint>.png` for each dhikr, and `public/og/<guide>/` for each hadith (`hadithCardOf`), 2400 by 1260: 1200 by 630 at twice the scale, so the text stays sharp on a phone and after a chat app compresses it. One card serves the link preview and the «الصورة» download. `src/lib/card.ts` decides what the card says and computes the fingerprint from it.

- A changed card gets a new name, so an app with the old image cached fetches the new one, and a test fails when a card was not redrawn. Run `bun run opengraph:adhkar`. It draws only changed cards.
- Raise `TEMPLATE` in `src/lib/card.ts` when only the drawing changes.
- The card mirrors the page: a band in the occasion's color with the name, its context (lighter, on the name's line when it fits, under it otherwise), and the count; the words in ink on the panel; a muted foot. The words take the largest size that fits. A text that does not fit gets a red outline, and a build test refuses it.
- A long text stops at a clause end, and قرآن at an آية end (`src/lib/excerpt.ts`). CSS line clamping cut the Quran marks and could end a card on «لا إله».
- The card carries the moment, count, and takhrij, because an image travels without its page. A قرآن card says «النص: tanzil.net» in its foot.

## Each section has posters, named by their fingerprint

`scripts/posters/build.ts` draws a poster of each section in five formats and two papers into `public/posters/<slug>/<format>-<paper>-<print>.png`: the whole section, with each count and takhrij ([`branding/imagery.md`](branding/imagery.md#the-posters)). A share icon in the section page's bar opens a menu (`PosterMenu`, a dialog shaped like the section menu: a sheet from the bottom edge on a phone, a menu under the bar from `40rem`): the format and the paper as checked rows, each with its shape, or a rounded square of its paper, beside its name, then a foot with «حفظ الصورة», one filled button. The owner chose it from five designs, then asked for the filled button and for no words that explain, so the menu itself shows what to do.

- The ordinary way is to let the reader take a screenshot, or to draw the image in the browser with a canvas. A screenshot holds one screen, not the section, and a canvas needs a script and the fonts on every phone. Drawing ahead also lets each poster take the largest type that fits.
- `src/lib/poster.ts` decides what a poster says and computes its fingerprint, as `src/lib/card.ts` does for the cards. The page, the script, and `content.test.ts` all call it, so a changed dhikr changes the names, and the test fails until `bun run posters` draws them. Raise `POSTER_TEMPLATE` when only the drawing changes.
- The page fits itself in the browser: it tries one to eight columns, takes the largest type that fits with lines at least 13 times the type size, then widens the space between adhkar to fill the frame. The script reads the result with `--dump-dom` before it takes the screenshot, and stops on a poster that does not fit.
- The browser takes the screenshot at three times the scale, so the words stay sharp when a reader zooms in, and `sharp` (which Astro already installs) saves it as a 256-color PNG: the same text at about a third of the size of a full-color PNG. It only compresses: the drawing is still the browser's ([the icons and the cards](#the-icons-and-the-opengraph-cards-come-from-a-headless-browser)).
- The inline script in `src/layouts/Paper.astro` moves the checks on a tap, a click, Space, Enter, or an arrow key (down and left go to the next row, up and right to the one before, past a disabled row, and round to the first), and points «حفظ الصورة» at the chosen file. On a touch screen that can share files (Safari on iOS), it fetches the chosen file once, keeps it for the page's life, and opens the share sheet with the image when the reader taps: on an iPhone that is how a reader saves it to Photos. It opens the sheet only when the file is already in hand, inside the tap itself, because Safari refuses a share sheet that opens after the tap has passed. A tap that comes before the file arrives follows the plain download link instead. iOS says nothing when the sheet saves the image, so when the sheet closes on a save or a send, the row says «تم» and shows a check for a moment, as «نسخ» does. A computer, and any other browser, gets a plain download link, and fetches nothing until the reader saves. If sharing fails for any reason but the reader's cancel, the page opens the image itself, to save with a long press.
- The ordinary way is plain download links. On an iPhone a download goes to Files, not Photos, and the reader then has to attach it by hand.
- The menu needs JavaScript to open, as the section menu does, and its icon hides without it ([the bar's menus are modal dialogs](#the-bars-menus-are-modal-dialogs-the-inline-script-opens)).
- The service worker never keeps a poster, and `_headers` keeps `/posters/` for a year.

## The icons and the OpenGraph cards come from a headless browser

`scripts/icons/build.ts` and `scripts/opengraph/build.ts` render HTML in a local Chromium browser (`scripts/chromium.ts`) and save screenshots. `scripts/icons/build.ts` also writes `favicon.ico` by hand (a short header and a list of PNGs) and `favicon.svg` from `src/lib/mark.ts`, so the header mark and the favicon cannot drift.

- The ordinary way is an image library such as `sharp`: a native dependency for two scripts that run only when the mark or a card changes.
- The cards draw the site's mark, colors, and emblems from `src/lib/`, in the site's fonts. The home card sets the name large on the paper, with the mark, the tagline, and the domain, and nothing else. Each section card shows its title, count, and emblem on its color, like its page banner ([`branding/imagery.md`](branding/imagery.md#the-sharing-cards)).

## A census reads the built pages in two headless browsers

`bun run drift` (`scripts/drift/`) builds the site, serves `dist/` from a small Bun server, and opens each state in `states.ts` in Chromium and in WebKit with `playwright-core`, at four widths and in both modes. In each it reads the computed style of every visible element, resolves each token in the page, and lists the values that match none. It saves a screenshot of each, and `drift:check` lists only what changed. The owner asked for it, so the rendered pages never drift from the design system.

- The ordinary way is a visual test runner, such as Playwright Test with `toHaveScreenshot`, or a hosted service. Playwright Test brings its own runner beside Vitest and Bun, and keeps its baselines in git. This keeps the screenshots out of git, in `.drift/`, and is one Effect script like the others.
- WebKit is Playwright's build, installed once with `bunx playwright-core install webkit`, because Safari cannot be driven headless. Chromium is the installed browser, as for the cards.
- The census reads computed values, so a value written as a `calc` of tokens that lands off the scale (`calc((var(--size-touch) - var(--size-icon-bar)) / -2)`) is listed too. A value equal to a token, or to its negative, passes. A color passes when it equals a color token in its `.tone`, the element's own color, or a `PALETTE` color (the emblems draw in them).
- Each state runs in a new context with service workers blocked, a fixed clock (09:00 in Riyadh), and finished animations, so two runs of the same build match.

## Promo films render from HTML in a headless browser

A promo film for X, TikTok, or Snapchat is one HTML page, `promo/<slug>/film.html`, timed by CSS animations. `scripts/promo/page.ts` opens it in the installed Brave or Chrome with `playwright-core`, adds the site's tokens, fonts, emblems, mark, and section colors, and seeks it to any frame. `scripts/promo/render.ts` screenshots every frame and pipes them to ffmpeg. The owner asked for it, so the films look and move like the site ([`branding/imagery.md`](branding/imagery.md#the-promo-films)).

- The ordinary way is a video editor, or Remotion. An editor redraws the site by hand, and Remotion brings React and its own renderer. This reuses the site's own CSS, with no third party at render time.
- `playwright-core` is a dev dependency. It drives the installed browser and downloads none. Plain Chromium cannot play H.264, so the page refuses it with a clear message.
- The clips are recorded on an iPhone simulator with Argent, and `bun run promo:clip` makes every frame a key frame, so a seek lands on the exact frame.
- `promo/*/clips/` and `promo/*/out/` are ignored. A film keeps `STORY.md`, `film.html`, and `post.md`, and is made again by recording its clips again.

## The bar's menus are modal dialogs the inline script opens

The section menu and the poster menu are each a `<dialog>` (`data-sheet`), as search is. A tap on the bar's icon (`data-sheet-open`) opens it with `showModal()`, so while it is open the page behind takes no tap and no Tab. It does not scroll either: `:root:has(.<menu>__panel[open])` hides the root's overflow, because a modal dialog stops taps but not a swipe, and on iOS a swipe beside the sheet scrolled the page and folded Safari's toolbar (measured on 2026-11-28). A tap outside it only closes it, and never reaches what lies under, as on Apple's sheets. Esc and the close icon (`data-sheet-close`) close it too. The dialog dims nothing behind it, at any width, but it is still modal. The owner asked for it, after a tap on the page outside the menu closed it and also switched the morning and the evening, and later asked for no dim on a phone either: it darkened the bar and Safari's status bar above the sheet.

- The ordinary way is a `popover` opened by `popovertarget`, with no script, which the menus were before. A popover never blocks the page: the tap that closes it goes through to the page.
- Without JavaScript `<noscript>` in `src/layouts/Paper.astro` hides both icons, because nothing could open the menus.
- The script calls the poster menu's setup when it opens, so its paper follows the page's theme until the reader picks one.

### A drag closes the sheets on a phone, and grows the section menu

On a phone the section menu and the poster menu rise from the bottom edge as sheets of one height, `--size-sheet`, which fits the poster menu, and the head of each (`data-sheet-handle`) takes a drag. Down by 80 pixels closes either one. Up by 60 pixels grows the section menu (`data-expandable`) to the top of the screen, to show every section, and down shrinks it back. The poster menu fits, so it does not grow. The sheet follows the finger while it moves, then settles over `--duration-release`. The owner asked for it, to match the sheets of the owner's other app.

- The ordinary way is a sheet that only opens and closes, with a close button and a tap outside it. Both stay: the drag is an extra, for a reader who expects a phone's sheet to move.
- The inline script in `src/layouts/Paper.astro` listens to pointer events on the head. It ignores a mouse, a press on the close button, and any screen from `40rem`, where the menu opens under the bar and has no grabber. It sets the height and the `translate` while the finger moves, and `data-size="expanded"` once the sheet grows. A sheet that closes forgets its size.
- The head has `touch-action: none`, so the page does not scroll under the drag. The body scrolls inside the panel and hides its scrollbar at every width, as the owner asked. It still scrolls with a finger, a wheel, a trackpad, or the keys.

### The sheet's color goes on under Safari's toolbar

On a phone the backdrop of each sheet is clear, except its lowest `--size-sheet-floor`, which is `--color-panel`. Safari on iOS 26 draws the page under its floating toolbar, below the edge a fixed sheet sits on, and there it shows only the backdrop: the sheet looked cut off above a band of the page. The owner reported it from an iPhone, and asked that nothing above the sheet change color.

- The ordinary way is a sheet that ends at the bottom edge. Safari leaves no way to put the sheet itself under its toolbar: a fixed element, its shadow, and anything it overflows stop at that edge, and only the backdrop goes on.
- The sheet covers the colored band everywhere but under Safari's toolbar, so on other browsers it shows only while a drag moves the sheet down. Safari's toolbar glass still tints what it covers.
- Each dialog has `autofocus`, so `showModal()` focuses the sheet, not its close icon, and a tap opens it with no focus ring. The dialog draws no outline of its own. A first Tab still reaches the close icon.

## Search opens over the page, from a module script

Every bar ends in a search icon (`components/Bar.astro`). A tap opens search over the page (`components/SearchSheet.astro`, a `<dialog>`). On a phone it fills the screen, and its first row takes the page color, because Safari keeps that color behind the clock. On a wide screen it is a centered panel over a dimmed page. Before typing, it lists six suggestions. Results update as the reader types, grouped by section, each under its emblem, name, and count. Arrow keys move between the field and the results. A tap on a result closes it and goes to the dhikr. `/`, ⌘K, or Ctrl+K opens it. On a wide screen an empty field shows «Esc», in the place the clear button takes once the reader types. The clear button is an eraser, not a cross, so it does not read as «إلغاء», which closes search beside it. The owner asked for it.

- The ordinary way is a link to a search page. There is none: the icon is a button, and without JavaScript `<noscript>` in `src/layouts/Paper.astro` hides it. A tap before the module has loaded is not lost: the inline script in `Paper.astro` marks it with `data-search-pending` on `<html>`, and the module opens the sheet when it mounts.
- The rows come from one file at a fixed path, `/search/index.json` (`src/pages/search/index.json.ts`). `_headers` sends it with `no-cache`, so the browser asks again and Cloudflare answers `304` when it has not changed. The worker keeps it by its fingerprint, so a reader with the worker never asks. The sheet fetches it a second after the page loads, so results are ready as the reader types. If the fetch fails, the sheet says «تعذر تحميل البحث، فأعد تحميل الصفحة».
- The path has no version in it on purpose. A versioned path was in every page, so one dhikr change changed the fingerprint of all 303 pages, and every returning reader downloaded the sections again and lost the pages kept on opening (measured on 2026-11-27, [`proposals/2026-11-27-cache-prefetch-search/`](proposals/2026-11-27-cache-prefetch-search/index.html)).
- Each group head comes from one `<template>` per section in the page, so the index carries the section id, not its drawing.
- An ordinary Astro `<script>` imports `src/scripts/search.ts`, which imports `src/lib/search.ts`, so folding, matching, and marking have unit tests. Astro bundles it into `_astro/`, cached for a year. Nothing in it runs before the first paint.
- The sheet keeps its last query in `sessionStorage` under `search-sheet`, and an empty field that opens takes it back, selected, so typing replaces it.
- A row carries `about`: the `when`, `how`, and `fadl` of a dhikr, or the `rawi` of a hadith, so «إذا دخل المسجد», «من قالها», and «عائشة» find theirs. Western digits read as Arabic-Indic, so «33» finds «٣٣ مرة». It carries `source`, the takhrij source, so «البخاري» finds the adhkar from his صحيح. A match in the title comes first, then the words, then the place and `about`, then the source. A query drops «دعاء», «ذكر», «أذكار», «عند», and «إذا» when it has other words, reads Persian ک and ی as ك and ي, and knows a short list of other forms (`SYNONYMS` in `src/lib/search.ts`): «دخول» finds «دخل», «الأكل» finds «الطعام», «أبو» finds «أبي» (a `rawi` is in the genitive), «المعوذتين» finds «المعوذات». The list is short on purpose, because a stemmer turned «اية الكرسي» from 3 results into 40.
- A query word of one or two letters matches only at the start of a word, so «يس» does not find «ليست». A longer word matches anywhere, so «الله» finds «بالله».
- When the words together find nothing, search shows the rows that have the most of the other words, under a line that names them. It skips a word in more than 20% of the rows, so «حسبي الله» says no result instead of listing 220 rows for «الله».
- A result row has `content-visibility: auto`, so the browser lays out only the rows on screen. One typed letter shows all 285 rows: at 6x CPU throttling it took 825 ms from the key to the paint, and takes 159 ms with it (measured on 2026-11-27).
- A reader does not type Tanzil's Uthmani spelling, so a سورة is found by its name. A قرآن row carries only the آيات its card shows folded, and shows only its name, so no آية is cut.
- Without JavaScript there is no search. A reader can still find words on a section page with the browser's find.

## Search remembers the results the reader opens

Before typing, search lists «آخر ما فتحت»: the last results opened from search, newest first, with «مسح السجل» to forget them. `localStorage` keeps them under `search-history`. They never leave the device. The owner asked for it.

- The ordinary way is no history, or the browser's own field history.
- It keeps the link of an opened result, not the typed words, because an opened result is a search that found its dhikr.
- `src/lib/history.ts` holds the rules, with tests. The value is `{ "version": 1, "hrefs": [...] }`. Raise `HISTORY_VERSION` when the shape changes. A value of another version is removed, and the list starts empty.
- The stored text is untrusted. It is refused when over 4 KB (before parsing), not JSON, or holding an unknown field, more than 8 links, or a link that is not a site path. A refused value is removed.
- It keeps 8 links, each once. A link with no row in the index (a removed or renamed dhikr) does not show, and the next read drops it.
- Each list row copies its index row, so a stored link never becomes markup. Every read and write is in a `try`, because Safari's private mode and a full storage throw.
- Another tab's opened result updates the list through the `storage` event.

## A service worker keeps the sections on the device

The home page, the sections its cards open, and search open at once, and with no connection. A service worker (`src/scripts/service-worker.js`) keeps them on the device. Any other page is kept once it opens. A deploy drops only the pages it changed. With no connection, a page not kept opens «لا اتصال» (`src/pages/bila-ittisal.astro`), which leads to the kept sections. The owner asked for it.

- The ordinary way is the browser's cache alone. It cannot do this, measured on 2026-11-26 in Chrome, Brave, and Safari on iOS 26.4. Cloudflare Pages sends a page with `max-age=0, must-revalidate` and no `ETag`, so each visit downloads the whole page. Speculation rules prefetch only in Chrome (Brave turns them off, Safari has none). No browser applies `stale-while-revalidate` to a page.
- The ordinary way to write a worker is Workbox (`@vite-pwa/astro`). It drops a prefetched page when its revision changes, but it knows no revision for a page kept on opening. This worker knows the fingerprint of every page.
- `astro.config.ts` runs `writeServiceWorker` (`src/lib/offline.ts`) after the build. It writes `dist/service-worker.js`: one line naming the files to keep and `/offline/<hash>.json`, then the worker. That file holds the SHA-256 of every page and of the search index, and its name is the hash of its content, so a changed page changes the worker.
- On the first visit to any page, the worker downloads the home page, each section its cards open, the offline page, the search index, and every file in `_astro/`: about 270 KB, most of it in the browser's cache already. With Save-Data on, it downloads nothing ahead. It never keeps a card image (`/og/`).
- A page comes from the device when its fingerprint matches, and from the network otherwise. With no connection, every kept page opens.
- The worker hashes each page before it keeps it, and keeps it only when the hash equals its fingerprint. Back and Forward let the browser answer from its HTTP cache without asking the server, so after a deploy the worker got the old page and kept it under the new fingerprint, for good (reproduced on 2026-11-27). Now it shows that page once, as any browser does on Back, and fetches the page again with `cache: 'no-cache'` to keep. The hash takes 0.08 ms for the largest page.
- The check needs Cloudflare to serve the built bytes. It does (each page compared on 2026-11-27). A Cloudflare feature that rewrites HTML, such as email obfuscation or an injected analytics script, would make the worker keep no page: the site would still work, but not offline.
- The caches are `kept` (pages and the index, by fingerprint) and `files` (`_astro/`, by name). The worker deletes any other cache when it takes over, so the old `pages` cache, which may hold a page kept under the wrong fingerprint, goes on the first deploy of this change.
- `_headers` asks for `service-worker.js` again on each visit (`no-cache`), and keeps `offline/` for a year. The browser compares the worker on each navigation: 1.4 KB, or a `304`. After a deploy, the first page opened still comes from the old worker. The new worker downloads only the changed pages, and the next page opened is new.
- `bun run dev` renders a script that removes any worker, so a worker from `bun run preview` never serves old pages to the dev server. The choice reads `import.meta.env.PROD`. Vitest sets `DEV` and `PROD` in the environment, which turns it off, so `src/build.test.ts` builds without them: that build is the one `bun run deploy` ships.
- To turn it off on the live site, remove the registration from `src/layouts/Paper.astro`, and ship a `service-worker.js` that deletes every cache and calls `self.registration.unregister()`.
- Without JavaScript, or in a browser with no service workers, the site works as before.

## A press or a hover keeps the page a link opens

When a reader presses a link to a page of the site, or holds the mouse on it for 65 ms, the inline script in `src/layouts/Paper.astro` posts its path to the service worker (`{ keep: path }`). The worker downloads the page, checks its fingerprint, and keeps it, so the click opens it from the device. The owner asked for a fast site.

- The ordinary way is Speculation Rules (`<script type="speculationrules">`). Only Chrome uses them: Brave turns them off, and Safari has none.
- A tap starts about 100 ms before its click. With 150 ms per request and a 100 ms press, the next dhikr's page arrived at 65 ms instead of 192 ms, and was ready at 95 ms instead of 233 ms (median of 10, measured on 2026-11-27). A 30 ms press still gains (140 ms instead of 180 ms), because the click waits for the download already under way instead of starting another. A hover gives 21 ms.
- The worker keeps only a path it has a fingerprint for, never with Save-Data, and each path once per page. A press that does not end in a click costs one page, about 7 KB.
- Without JavaScript, or with no worker yet, nothing is posted and the link works as before.

## The proofs are JSON files in git

`verification/` holds a record for each proven dhikr. The tests read them; the site does not. The owner asked for saved proofs, so a check never starts from zero.

- The ordinary way is a database such as SQLite, or no record. In git, each proof change is readable and reviewed, and branches merge.
- `scripts/verification/capture.js` runs in the browser on the site itself, because dorar.net and sunnah.com refuse scripted requests. It reads one page every 3 seconds, and one button copies all of them, because a download opens a dialog for each file.
- oxfmt ignores `src/lib/fixtures`, because a captured text stays as its page gave it.

## A scheduled job sends the owner the visits

A Cloudflare Worker, `scripts/visits/worker.ts`, runs on a Cron Trigger every hour. It reads the readers, their countries, the pages they opened first, and the missing pages from Cloudflare's GraphQL Analytics API, and sends them to the owner's Telegram group ([`development.md`](development.md#the-visit-reports)). The owner asked for it, to see that people read.

- The ordinary way is a web analytics script in each page. It would make a third-party request and track readers, which `docs/branding/identity.md` refuses. Cloudflare counts the visits at its edge anyway, so the pages stay as they are.
- A beacon to a Pages Function would add a script to every page and a server to a static site.
- The Worker serves no request: it has no `fetch` handler and no URL (`workers_dev` and `preview_urls` are off). Pages has no schedule of its own, so the Worker is a second deploy beside the site.
- It ran on a GitHub Actions schedule before. GitHub dropped and delayed runs, and turned the schedule off after 60 days with no commit.
- The job keeps no state. Each run asks Cloudflare again, so a run that is dropped or delayed changes nothing after it. The hour reported is fixed by the run's scheduled time, and a retry of a Telegram send never happens, so nothing is sent twice.
- `.dev.vars` holds the secrets for `wrangler dev`, and `.gitignore` keeps it out of git.
- Every window is at most one day back. The free plan keeps 31.

## The palette reads the tokens

`src/lib/palette.ts` reads the colors it needs (the paper, the panel, the inks, and the line, by day and night, eggshell, and the shares of ink and black a section color takes) from `src/styles/tokens.css` when the build loads it, so each color is written once. The theme-color metas, the mark, the manifest, the generated cards, and the posters use it.

- The ordinary way is to write the colors twice, in the CSS and in TypeScript, and keep them equal with a test.
- It runs only at build time, in Node. No page ships it.
- Three values stay in it: the black of a shade, and the petal and the disc of the mark, which no stylesheet uses.
