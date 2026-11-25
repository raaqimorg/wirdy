# Testing

This doc says what to test, where a test goes, and which suite runs it. Read it before you write a test.

## The suites

| Suite   | Command                | Runner | What it covers                                                          |
| ------- | ---------------------- | ------ | ----------------------------------------------------------------------- |
| Unit    | `bun run test`         | Vitest | `src/**/*.test.ts`: the functions, the content, the proofs, a component |
| Scripts | `bun run test:scripts` | Bun    | `scripts/**/*.test.ts`: the git guards                                  |
| Build   | `bun run test:build`   | Vitest | `src/build.test.ts`: builds the site, and checks the HTML that ships    |

- `bun run ci` runs all three, after the format, lint, and type checks. GitHub Actions runs `bun run ci`.
- The `pre-push` hook runs `bun run lint` and `bun run test`.
- The build suite is slow (a full `astro build`), so it has its own config, `vitest.build.config.ts`, with a long timeout.

## What to test

- Test behavior, not implementation. Put one idea in each test.
- A rule that matters goes in a test, not in a comment or a doc alone.
- Test a pure function in `src/lib/` with a unit test next to it.
- Test a rule of the content in `src/lib/content.test.ts`. It reads every file in `src/content/`.
- Test a rule of the proofs in `src/lib/proofs.test.ts`. It reads every record in `verification/`.
- Test a rule of the shipped page in `src/build.test.ts`: the HTML, the inline scripts, the links, and that no page makes a third-party request.
- Test a rule of the styles in `src/styles/styles.test.ts`: the tokens, and one stylesheet for each component.
- Render a component with Astro's container API when its HTML is the behavior, as `src/components/Dhikr.test.ts` does.
- Test a git guard in `scripts/check/`, in a temporary repository, as `pending-list.test.ts` does.
- Mock nothing that the repo owns. Read a saved page from `src/lib/fixtures/` in place of the network.

## How to write one

- Name each test as a full sentence about the behavior: `it('opens no سورة with the بسملة')`, not `it('basmalah test')`.
- Use `it.each` for one rule over many inputs.
- Run an Effect at the edge of the test, in a small helper next to the imports: `Effect.runSync` for a pure Effect, and `Effect.runPromise` with `NodeServices.layer` for one that reads files (`proofs.test.ts`). Expect a failure with `toThrow`, and turn an `Option` into a value with `Option.getOrNull`.
- Never weaken a test to make it pass. Fix the code or the content.

## When to add one

- Add a test for every change in behavior, in the same commit.
- When you rename a function, rename its `describe` too ([`naming.md`](naming.md#how-to-rename)).
