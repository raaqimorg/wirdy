# Code conventions

oxlint (`.oxlintrc.json`), stylelint (`.stylelintrc.json`), oxfmt (`.oxfmtrc.json`), Prettier for the Astro files (`.prettierrc.json`), and `astro check` enforce most of the code rules. `bun run ci` runs them all. This doc covers what no tool checks. [`design-system.md`](design-system.md) covers the styles and the components.

## Code

- Astro components render. Logic that can be a plain function goes in `src/lib/`, with a test next to it.
- Validate content once, at the schema (`src/lib/schema.ts`). After that, trust the types.
- A build-time error is better than a wrong page. If content is malformed, throw during the build, as `parseVariants` does.
- Prefer CSS to JavaScript. Each page has one inline script (see [`exceptions.md`](exceptions.md)), and it must stay small enough to read at a glance.
- No page makes a third-party request. Fonts come from `@fontsource` (Amiri, Amiri Quran, and IBM Plex Sans Arabic), and Astro bundles them. `src/styles/fonts.css` declares them, as WOFF2 only.
- Nothing moves while a page loads, except the animations below. `src/layouts/Paper.astro` preloads the faces that a page uses (`faces`), and the browser keeps them for a year, so they are ready before the first paint. On a first visit the text shows at once in the device's face, and the site's face replaces it when it arrives.
- A file that can be kept for a year has its content in its name: Astro hashes `_astro/`, and `src/lib/card.ts` names the sharing cards. `public/_headers` keeps those for a year, and the icons for a week. A page itself is asked for again on each visit, so a correction shows at once. The emblems are inline, so they cost no request.

## Motion

The motion follows Apple's rules (WWDC18 "Designing Fluid Interfaces", WWDC23 "Animate with springs").

- Animate only `transform` and `opacity`, in CSS. Add no motion library. The one exception is the browser's own view transition (below).
- Move with `--spring`, Apple's spring with no bounce, written as CSS `linear()`. Its duration sets the speed: 607 ms (a 0.45 s spring) for the emblems, 405 ms (0.3 s) for the hover, and 270 ms (0.2 s) for the press to return. Fade with `--ease-out`. The fade between two pages is linear, so it keeps pace with Safari's own fade of the status bar.
- Respond on the first frame. Never use an ease-in or an ease-in-out, which start slowly.
- Grow a shape from 60%, not from nothing. This is Apple's Replace for SF Symbols.
- Move only what is lit. An emblem fades in as a whole, and its dark shapes stay still. After 180 ms its lit shapes enter, each in its own way (`enter` in `src/lib/emblems.ts`).
- Animate nothing out of sight. On the home page only the first 3 cards animate, or the first 5 on a wide screen. The «بقية الأقسام» cards do not animate.
- On hover the card's color brightens and the card grows 2%, as on Laws of UX. A press shrinks the card to 97% at once, on iPhones too (see [`exceptions.md`](exceptions.md)).
- A press on any other link or button dims it to 60% at once, with no transition.
- The bar title fades in with the scroll (see [`exceptions.md`](exceptions.md)).
- With reduced motion, the emblem only fades, and nothing scales or moves. On hover, the color still brightens, so the pointer gets an answer.
- A page fades into the next one in 200 ms, with nothing moving, so no element has a `view-transition-name`. A browser without view transitions between pages opens the page as usual. With reduced motion there is no transition.

## Tests

- A rule that matters goes in a test, not in a comment. `src/lib/content.test.ts` checks every content file. `src/build.test.ts` builds the site and checks the HTML that ships.
- Name a test as a full sentence about the behavior: `"opens no سورة with the بسملة"`, not `"basmalah test"`.
- `scripts/check/*.test.ts` test the git guards. They run with `bun test`, not Vitest.

## Comments

Code has no comments. Names, types, and tests carry the intent. A non-obvious reason goes in [`exceptions.md`](exceptions.md).

Two kinds of comment are allowed, each on one line:

- A lint directive, with its reason on the same line.
- In a shell script or a configuration file that has no types or tests, a short note on a directive that is not obvious.

## Writing

These rules apply to docs, `AGENTS.md`, issues, pull requests, and commit messages. Many readers read Arabic first and English second.

- Write short sentences, with one idea in each.
- Write an instruction as a command: "Run `bun run ci`."
- Use the active voice and the present tense.
- Use one word for one meaning. The terms in [`content.md`](content.md) (dhikr, occasion, takhrij, ruling) are the names for the domain.
- A number is evidence: "60 adhkar", not "many adhkar".
- Do not use em-dashes. Use a period, a comma, or parentheses.

## Commits

Write the subject as `type: what changed`, in lowercase, with no period. The types are `feat`, `fix`, `content`, `docs`, `test`, `refactor`, `chore`, and `ci`. Use `content` for a change under `src/content/`, and name the dhikr and the dorar.net page in the body.
