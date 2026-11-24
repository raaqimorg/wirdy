# Exceptions

Wirdy is meant to look boring: Markdown in, static HTML pages out. Anything that does not look like that needs a reason here, so the next person (human or agent) does not try to "fix" it. See `AGENTS.md`, "Keep it boring".

This list is short on purpose. If you find unusual code that is not here, say so. Either it belongs here, or the code should change.

## One page serves the morning and the evening

The morning and evening forms of a dhikr differ in a few words (أصبحنا or أمسينا). The page shows both, and the reader never has to switch. An inline script in `src/layouts/Paper.astro` sets `data-wird` on `<html>` before the first paint, and CSS leads with the form for now (`src/styles/paper.css`). Each word of that form is followed by its other form, muted and struck through, so the reader sees the other wording and the eye skips it.

- The script picks the morning from 03:00 to 11:59 local time, and the evening otherwise. `?w=s` or `?w=m` in the URL overrides it. The switch is at noon, not at Asr, because in winter Asr comes before 15:00 (about 14:43 in Riyadh, 14:27 in Dammam, and 13:38 in London in December). Between Dhuhr and Asr, the next set, the evening, is the right guess.
- It is inline, not a module, so the right form leads on the first paint, with no flash.
- Without JavaScript, the page leads with the morning form.
- The struck form is `aria-hidden` and cannot be selected, so VoiceOver and copying give the form for now only. Each struck word is joined to its word with a no-break space, not `white-space: nowrap`, because Safari does not wrap before a `nowrap` span in right-to-left text and the line runs past the screen.
- A dhikr for one time only (`mode: "sabah"` or `"masaa"`) always shows, under «في الصباح» or «في المساء», and its text is muted at the other time.

## The `{{morning|evening}}` markers

A dhikr that changes between the morning and the evening is one file with markers, not two files. Two files would drift apart. `src/lib/variants.ts` parses the markers, and it throws on any malformed marker, so a typo fails the build instead of reaching the page. `pairWords` then pairs the two forms of a marker word by word, so a word that both forms share shows once (`components/WordForm.astro`).

## The Quran ornaments live in CSS

The brackets ﴿ ﴾, the آية mark ۝, and the سورة divider ۞ are CSS `content` with empty alternative text (`content: "﴿" / ""`). The HTML holds only the text of the آيات. Copying the text, or reading it with a screen reader, gives the words without the ornaments.

## The icons and the OpenGraph cards come from a headless browser

`scripts/icons/build.mjs` and `scripts/opengraph/build.mjs` render HTML in a local Chromium-based browser (`scripts/chromium.mjs`) and save screenshots. `scripts/icons/build.mjs` also writes `favicon.ico` by hand, because the format is a short header and a list of PNGs, and it writes `favicon.svg` from `src/lib/mark.ts`, so the header mark and the favicon cannot drift apart.

- The ordinary way is an image library such as `sharp`. That adds a native dependency for two scripts that run only when the mark or the card changes.
- The OpenGraph cards draw the same mark, colors, and emblems as the site, from `src/lib/`, in the site's own fonts from `@fontsource`. The home card shows all six occasions. Each occasion card shows its heading, its count, and its emblem on its color, as its page banner does. Run `bun run opengraph` after you change any of them, or after you add or remove a dhikr, because the cards print the count.
