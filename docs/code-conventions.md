# Code conventions

oxlint (`.oxlintrc.json`), oxfmt (`.oxfmtrc.json`), and `astro check` enforce most of the code rules. `bun run ci` runs all three. This doc covers what no tool checks.

## Code

- Astro components render. Logic that can be a plain function goes in `src/lib/`, with a test next to it.
- Validate content once, at the schema (`src/lib/schema.ts`). After that, trust the types.
- A build-time error is better than a wrong page. If content is malformed, throw during the build, as `parseVariants` does.
- Prefer CSS to JavaScript. Each page has one inline script (see [`exceptions.md`](exceptions.md)), and it must stay small enough to read at a glance.
- No page makes a third-party request. Fonts come from `@fontsource` (Amiri, Amiri Quran, and IBM Plex Sans Arabic), and Astro bundles them.

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
