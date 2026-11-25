# Code conventions

oxlint (`.oxlintrc.json`), stylelint (`.stylelintrc.json`), oxfmt (`.oxfmtrc.json`), Prettier for the Astro files (`.prettierrc.json`), and `astro check` enforce most of the code rules. `bun run ci` runs them all. This doc covers what no tool checks. [`naming.md`](naming.md) covers the names, [`testing.md`](testing.md) the tests, [`writing.md`](writing.md) the docs and the commits, and [`design-system.md`](design-system.md) the styles and the components.

## Code

- Astro components render. Logic that can be a plain function goes in `src/lib/`, with a test next to it.
- Validate content once, at the schema (`src/lib/schema.ts`). After that, trust the types.
- A build-time error is better than a wrong page. If content is malformed, fail with a tagged error, as `parseVariants` does. The page runs the Effect, so the build stops.
- Prefer CSS to JavaScript. Each page has one inline script (see [`exceptions.md`](exceptions.md)), and it must stay small enough to read at a glance. Search has one module script, `src/scripts/search.ts`, which imports `src/lib/search.ts` (see [`exceptions.md`](exceptions.md)).
- No page makes a third-party request. Fonts come from `@fontsource` (Amiri, Amiri Quran, and IBM Plex Sans Arabic), and Astro bundles them. `src/styles/fonts.css` declares them, as WOFF2 only.
- Nothing moves while a page loads, except the animations below. `src/layouts/Paper.astro` preloads the faces that a page uses (`faces`), and the browser keeps them for a year, so they are ready before the first paint. On a first visit the text shows at once in the device's face, and the site's face replaces it when it arrives.
- A file that can be kept for a year has its content in its name: Astro hashes `_astro/`, and `src/lib/card.ts` names the sharing cards. `public/_headers` keeps those for a year, and the icons for a week. A page itself is asked for again on each visit, so a correction shows at once. The emblems are inline, so they cost no request.

## TypeScript

`tsconfig.json` extends Astro's `strictest` config, and adds `noPropertyAccessFromIndexSignature`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`. Its plugin is the Effect language service, which an editor runs. `bun run lint` runs oxlint with type information (`--type-aware`), with the `pedantic` category and the type-aware rules on (`no-floating-promises`, `strict-boolean-expressions`, `switch-exhaustiveness-check`, `no-unsafe-*`, and others). Four rules are off, each for a reason:

- `prefer-readonly-parameter-types`: the DOM, Astro, and Effect types are not deeply readonly, so no parameter of theirs could pass.
- `consistent-return`: Effect asks for `return yield*` on a branch that fails, and this rule refuses it.
- `import/max-dependencies`: a page imports one module for each concern, and a count says nothing about that.
- In tests only, `no-conditional-in-test` and the `no-unsafe-*` rules: a test reads raw `JSON.parse` output and loops over the content.

- Use `type`, not `interface`. An Astro component's `interface Props` is the one exception, because Astro reads it.
- Do not use `enum`. Use an `as const` array and the union derived from it, as `OCCASIONS` and `Occasion` do in `src/lib/occasions.ts`.
- Use a discriminated union for a value that has kinds: a source is `present` or `absent` (`src/lib/proof.ts`).
- Check outside data with an Effect `Schema` where it enters: a content file (`schema.ts`), a proof (`proof.ts`), a capture (`capture.ts`), the search index (`search.ts`), and the arguments of a script. Trust the type after that.
- Write the code with Effect (see [`exceptions.md`](exceptions.md#the-code-is-written-with-effect)). A function that can fail returns an `Effect` with a `Data.TaggedError`, and never throws. A value that can be absent is an `Option`, not `null` or `undefined`. A function that cannot fail and has nothing absent stays a plain function.
- Read and write files with the `FileSystem` and `Path` services, run a process with `ChildProcess`, and print with `Console`. A script ends with `run(program)` from `scripts/run.ts`, which provides the Node services.
- Run an Effect only at the edge: an Astro page or component (`Effect.runSync`, `Effect.runPromise`), a `<script>`, a script's `run`, or a test.
- Keep a value that is saved or hashed in its JSON shape (`Card`, `SearchRow`, a proof). Its fingerprint must not change when the code changes.
- Prefer `Array.get`, `Array.head`, and `Option` to an index with `!`. Do not use the non-null assertion outside tests.
- Prefer a check that narrows to a cast. In the DOM, check an element with `instanceof`, as `element` in `src/scripts/search.ts` does.
- Import a type with `import type`, and a Node module with `node:`.
- Use named exports. A default export is only for a file a tool reads, such as `astro.config.ts`.

## Motion

The motion follows Apple's rules (WWDC18 "Designing Fluid Interfaces", WWDC23 "Animate with springs").

- Animate only `transform` and `opacity`, in CSS. Add no motion library. The one exception is the browser's own view transition (below).
- Move with `--spring`, Apple's spring with no bounce, written as CSS `linear()`. Its duration sets the speed: 607 ms (a 0.45 s spring) for the emblems, 405 ms (0.3 s) for the hover, and 270 ms (0.2 s) for the press to return. Fade with `--ease-out`. The fade between two pages is linear, so it keeps pace with Safari's own fade of the status bar.
- Respond on the first frame. Never use an ease-in or an ease-in-out, which start slowly.
- Grow a shape from 60%, not from nothing. This is Apple's Replace for SF Symbols.
- Move only what is lit. An emblem fades in as a whole, and its dark shapes stay still. After 180 ms its lit shapes enter, each in its own way (`enter` in `src/lib/emblems.ts`).
- Animate nothing out of sight. On the home page only the first 3 cards animate, or the first 6 on a wide screen. The «بقية الأقسام» cards do not animate.
- On hover the card's color brightens and the card grows 2%. A press shrinks the card to 97% at once, on iPhones too (see [`exceptions.md`](exceptions.md)).
- A press on any other link or button dims it to 60% at once, with no transition.
- The sun of the morning and the evening turns half a circle when the form changes, so its lit half is above in the morning and below in the evening. With reduced motion it changes at once.
- The menu of the sections grows from the bar, from 94% to full size, as it fades in. With reduced motion it appears at once.
- With reduced motion, the emblem only fades, and nothing scales or moves. On hover, the color still brightens, so the pointer gets an answer.
- A page fades into the next one in 200 ms, with nothing moving, so no element has a `view-transition-name`. A browser without view transitions between pages opens the page as usual. With reduced motion there is no transition.

## Comments

Code has no comments. Names, types, and tests carry the intent. A non-obvious reason goes in [`exceptions.md`](exceptions.md).

Two kinds of comment are allowed, each on one line:

- A lint directive, with its reason on the same line.
- In a shell script or a configuration file that has no types or tests, a short note on a directive that is not obvious.
