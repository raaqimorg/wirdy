# Code conventions

oxlint (`.oxlintrc.json`), stylelint (`.stylelintrc.json`), oxfmt (`.oxfmtrc.json`), Prettier for Astro files (`.prettierrc.json`), and `astro check` enforce most rules, and `bun run ci` runs them all. This doc holds what no tool checks. See also [`naming.md`](naming.md), [`testing.md`](testing.md), [`writing.md`](writing.md), and [`design-system.md`](design-system.md).

## Code

- Astro components render. Logic that can be a plain function goes in `src/lib/`, with a test beside it.
- Validate content once, at the schema (`src/lib/schema.ts`). Then trust the types.
- A build error beats a wrong page. Fail malformed content with a tagged error, as `parseVariants` does. The page runs the Effect, so the build stops.
- Prefer CSS to JavaScript. Each page has one inline script ([`exceptions.md`](exceptions.md)), small enough to read at a glance, and a one-statement script that registers the service worker. Search has one module script, `src/scripts/search.ts`, which imports `src/lib/search.ts`. The service worker is `src/scripts/service-worker.js`.
- No page makes a third-party request. Fonts are bundled by Astro and declared in `src/styles/fonts.css`: IBM Plex Sans Arabic from `@fontsource` as WOFF2, and the KFGQPC faces from `src/fonts/` as TTF, unchanged ([`exceptions.md`](exceptions.md#the-kfgqpc-faces-ship-as-ttf-unchanged)).
- Nothing moves while a page loads, except the animations below. `src/layouts/Paper.astro` preloads the faces a page uses (`faces`), cached for a year, so they are ready before the first paint. On a first visit the text shows at once in the device's face, and the site's face replaces it on arrival.
- A file cached for a year has its content in its name: Astro hashes `_astro/`, and `src/lib/card.ts` names the cards. `public/_headers` caches those for a year and the icons for a week. A service worker keeps pages on the device and drops a page a deploy changes, so a correction shows from the next page opened ([`exceptions.md`](exceptions.md#a-service-worker-keeps-the-sections-on-the-device)). The emblems are inline and cost no request.

## TypeScript

`tsconfig.json` extends Astro's `strictest` and adds `noPropertyAccessFromIndexSignature`, `noUncheckedSideEffectImports`, and `erasableSyntaxOnly`. Its plugin is the Effect language service, run by the editor. `bun run lint` runs oxlint `--type-aware`, with `pedantic` and the type-aware rules on (`no-floating-promises`, `strict-boolean-expressions`, `switch-exhaustiveness-check`, `no-unsafe-*`, and others). Four rules are off:

- `prefer-readonly-parameter-types`: the DOM, Astro, and Effect types are not deeply readonly, so none of their parameters pass.
- `consistent-return`: Effect needs `return yield*` on a failing branch, and this rule refuses it.
- `import/max-dependencies`: a page imports one module per concern, and a count says nothing about that.
- In tests only, `no-conditional-in-test` and `no-unsafe-*`: a test reads raw `JSON.parse` output and loops over the content.

- Use `type`, not `interface`, except an Astro component's `interface Props`, which Astro reads.
- No `enum`. Use an `as const` array and its derived union, as `OCCASIONS` and `Occasion` in `src/lib/occasions.ts`.
- Use a discriminated union for a value with kinds: a source is `present` or `absent` (`src/lib/proof.ts`).
- Check outside data with an Effect `Schema` where it enters: a content file (`schema.ts`), a proof (`proof.ts`), a capture (`capture.ts`), the search index (`search.ts`), and a script's arguments. Then trust the type.
- Write with Effect ([`exceptions.md`](exceptions.md#the-code-is-written-with-effect)). A function that can fail returns an `Effect` with a `Data.TaggedError` and never throws. An absent value is an `Option`, not `null` or `undefined`. A function that cannot fail and has nothing absent stays plain.
- Read and write files with `FileSystem` and `Path`, run a process with `ChildProcess`, and print with `Console`. A script ends with `run(program)` from `scripts/run.ts`, which provides the Node services.
- Run an Effect only at the edge: an Astro page or component (`Effect.runSync`, `Effect.runPromise`), a `<script>`, a script's `run`, or a test.
- Keep a saved or hashed value in its JSON shape (`Card`, `SearchRow`, a proof), so its fingerprint survives code changes.
- Prefer `Array.get`, `Array.head`, and `Option` to an index with `!`. No non-null assertion outside tests.
- Prefer a narrowing check to a cast. In the DOM, check with `instanceof`, as `element` in `src/scripts/search.ts` does.
- Import a type with `import type`, and a Node module with `node:`.
- Use named exports. A default export is only for a file a tool reads, such as `astro.config.ts`.

## Motion

Motion follows Apple (WWDC18 "Designing Fluid Interfaces", WWDC23 "Animate with springs").

- Animate only `transform` and `opacity`, in CSS. No motion library.
- Four durations: 100 ms for a press, 200 ms for a fade, 300 ms for a release or a hover, and 500 ms for an entrance. Move with `--spring`, Apple's bounceless spring as CSS `linear()`. Fade with `--ease-out`. The page fade is linear, to keep pace with Safari's status bar fade.
- Motion is opt-in: it is written under `prefers-reduced-motion: no-preference`, so a rule that forgets reduced motion shows none.
- Respond on the first frame. Never ease in or ease in-out: both start slowly.
- Grow a shape from 60%, not from nothing (Apple's Replace for SF Symbols).
- Move only what is lit. An emblem's dark shapes stay still, and its one lit shape enters its own way (`enter` in `src/lib/emblems.ts`) over 500 ms with `--spring`: it grows from 60%, rises from its base, draws across from the right, or turns 26°, as it fades in over 100 ms, so the movement shows. The spiral of «كل وقت» only fades, over 500 ms.
- A lit shape enters each time its emblem comes into view, on a page's banner and on the home page's cards: on load for what shows, on scroll for what comes in, and again when the reader comes back ([`exceptions.md`](exceptions.md#an-emblems-lit-shape-enters-each-time-it-comes-into-view)).
- Animate nothing out of sight. The «بقية الأقسام» cards and the emblems in the menu and in search stay still (`motion="still"`).
- On hover a card brightens and grows 2%. A press shrinks it to 97% at once, with a mouse over it and on iPhones too ([`exceptions.md`](exceptions.md)). The card scales its face, `.occasion-card__face`, never the link, so the link stays under the pointer: a click near the edge of a shrinking link used to land outside it and open nothing.
- Any other control answers by its shape ([`design-system.md`](design-system.md#states)): a fill tints, text underlines, an icon dims. A press answers at once, with no transition.
- The morning and evening sun turns half a circle when the form changes: its lit half above in the morning, below in the evening.
- The section menu grows from the bar, 94% to full size, as it fades in.
- With reduced motion the emblems show whole and still, the sun and the menu change at once, and nothing scales or moves. Hover still brightens, so the pointer gets an answer.
- On a long page a line under the bar grows from where the first group meets the bar to where the closing line meets the bottom of the screen (`components/ReadingProgress.astro`): a CSS view timeline on the groups and the closing line, so no script, and no line in a browser without them. `timeline-scope` on `body` lends the timeline to the bar, which draws the line under itself, so the line moves with the bar when a page bounces past its end. As the line starts, «وِردي» in the bar fades and wipes into the sunflower over the bar's height of scroll, on the same timeline, so the bar keeps only the mark while the reader reads, and the name comes back at the top. The home page has no reading line, but its bar does the same over the bar's height of scroll from where the cards meet the bar (a view timeline on the card grid, `--cards`), and its sunflower turns from its own colors to the bar's text color, white at night and ink by day, so it matches the eggshell mark of a section's bar. The new petals fade in over the first half, then the old disc fades out, so the mark never thins as it changes.
- A page opens at once, with no cross-page view transition. During one, Safari drops every tap for about 150 ms after the page shows, so a reader had to tap «الرئيسية» or the search icon twice.

## Comments

Code has no comments. Names, types, and tests carry the intent. A non-obvious reason goes in [`exceptions.md`](exceptions.md).

Two kinds are allowed, each on one line:

- A lint directive, with its reason on the same line.
- In a shell script or a config file with no types or tests, a short note on a non-obvious directive.
