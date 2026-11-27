# Testing

What to test, where a test goes, and which suite runs it. Read it before you write a test.

## The suites

| Suite   | Command                | Runner | What it covers                                                   |
| ------- | ---------------------- | ------ | ---------------------------------------------------------------- |
| Unit    | `bun run test`         | Vitest | `src/**/*.test.ts`: functions, content, proofs, a component      |
| Scripts | `bun run test:scripts` | Bun    | `scripts/**/*.test.ts`: the git guards and the image gallery     |
| Build   | `bun run test:build`   | Vitest | `src/build.test.ts`: builds the site and checks the shipped HTML |

- `bun run ci` runs all three after the format, lint, and type checks. GitHub Actions runs `bun run ci`.
- The `pre-push` hook runs `bun run lint` and `bun run test`.
- The build suite runs a full `astro build`, so it has its own config, `vitest.build.config.ts`, with a long timeout.

## What to test

- Test behavior, not implementation. One idea per test.
- A rule that matters lives in a test, not only in a comment or a doc.
- A pure function in `src/lib/` gets a unit test beside it.
- A content rule goes in `src/lib/content.test.ts`, which reads every file in `src/content/`.
- A proof rule goes in `src/lib/proofs.test.ts`, which reads every record in `verification/`.
- A shipped-page rule goes in `src/build.test.ts`: the HTML, the inline scripts, the links, and no third-party request.
- A style rule goes in `src/styles/styles.test.ts`: the tokens, and one stylesheet per component.
- Render a component with Astro's container API when its HTML is the behavior, as `src/components/Dhikr.test.ts` does.
- Test a git guard in `scripts/check/`, in a temporary repository, as `pending-list.test.ts` does.
- Mock nothing the repo owns. Read a saved page from `src/lib/fixtures/` instead of the network.

## How to write one

- Name each test as a sentence about the behavior: `it('opens no سورة with the بسملة')`, not `it('basmalah test')`.
- Use `it.each` for one rule over many inputs.
- Run an Effect at the test's edge, in a small helper by the imports: `Effect.runSync` for a pure Effect, `Effect.runPromise` with `NodeServices.layer` for one that reads files (`proofs.test.ts`). Expect a failure with `toThrow`, and unwrap an `Option` with `Option.getOrNull`.
- Never weaken a test to pass. Fix the code or the content.

## When to add one

- Add a test for every behavior change, in the same commit.
- When you rename a function, rename its `describe` ([`naming.md`](naming.md#how-to-rename)).
