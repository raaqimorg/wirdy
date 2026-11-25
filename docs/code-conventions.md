# Code conventions

oxlint (`.oxlintrc.json`), stylelint (`.stylelintrc.json`), oxfmt (`.oxfmtrc.json`), Prettier for the Astro files (`.prettierrc.json`), and `astro check` enforce most of the code rules. `bun run ci` runs them all. This doc covers what no tool checks. [`naming.md`](naming.md) covers the names, [`testing.md`](testing.md) the tests, [`writing.md`](writing.md) the docs and the commits, and [`design-system.md`](design-system.md) the styles and the components.

## Code

- Astro components render. Logic that can be a plain function goes in `src/lib/`, with a test next to it.
- Validate content once, at the schema (`src/lib/schema.ts`). After that, trust the types.
- A build-time error is better than a wrong page. If content is malformed, throw during the build, as `parseVariants` does.
- Prefer CSS to JavaScript. Each page has one inline script (see [`exceptions.md`](exceptions.md)), and it must stay small enough to read at a glance. Search has one module script, `src/scripts/search.ts`, which imports `src/lib/search.ts` (see [`exceptions.md`](exceptions.md)).
- No page makes a third-party request. Fonts come from `@fontsource` (Amiri, Amiri Quran, and IBM Plex Sans Arabic), and Astro bundles them. `src/styles/fonts.css` declares them, as WOFF2 only.
- Nothing moves while a page loads, except the animations below. `src/layouts/Paper.astro` preloads the faces that a page uses (`faces`), and the browser keeps them for a year, so they are ready before the first paint. On a first visit the text shows at once in the device's face, and the site's face replaces it when it arrives.
- A file that can be kept for a year has its content in its name: Astro hashes `_astro/`, and `src/lib/card.ts` names the sharing cards. `public/_headers` keeps those for a year, and the icons for a week. A page itself is asked for again on each visit, so a correction shows at once. The emblems are inline, so they cost no request.

## TypeScript

`tsconfig.json` extends Astro's strict config, and oxlint refuses `any`.

- Use `type`, not `interface`. An Astro component's `interface Props` is the one exception, because Astro reads it.
- Do not use `enum`. Use an `as const` array and the union derived from it, as `OCCASIONS` and `Occasion` do in `src/lib/occasions.ts`.
- Use a discriminated union for a value that has kinds: a source is `present` or `absent` (`src/lib/proof.ts`).
- Check outside data with a zod schema where it enters: a content file (`schema.ts`), a proof (`proof.ts`). Trust the type after that.
- Prefer a check that narrows to a cast. Keep a cast for the DOM, where the element is known.
- Import a type with `import type`, and a Node module with `node:`.
- Use named exports. A default export is only for a file a tool reads, such as `astro.config.ts`.

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
- The menu of the sections grows from the bar, from 94% to full size, as it fades in. With reduced motion it appears at once.
- With reduced motion, the emblem only fades, and nothing scales or moves. On hover, the color still brightens, so the pointer gets an answer.
- A page fades into the next one in 200 ms, with nothing moving, so no element has a `view-transition-name`. A browser without view transitions between pages opens the page as usual. With reduced motion there is no transition.

## Comments

Code has no comments. Names, types, and tests carry the intent. A non-obvious reason goes in [`exceptions.md`](exceptions.md).

Two kinds of comment are allowed, each on one line:

- A lint directive, with its reason on the same line.
- In a shell script or a configuration file that has no types or tests, a short note on a directive that is not obvious.
