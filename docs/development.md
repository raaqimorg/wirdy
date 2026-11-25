# Development

This doc holds the setup, the commands, the git hooks, and the generated files. Read it when you set up the repo or run a script.

## Setup

1. Install [Bun](https://bun.sh) 1.4 or later.
2. Run `bun install`. It installs the dependencies and turns on the git hooks in `.githooks/`.
3. Run `bun run dev`, and open `http://localhost:4321`.

The icon and card scripts need a Chromium-based browser (Brave, Chrome, Chromium, or Edge). Set `CHROME` to its path if it is not in `/Applications`.

## Commands

| Command                    | What it does                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| `bun run dev`              | Serves the site locally.                                             |
| `bun run build`            | Builds the site into `dist/`.                                        |
| `bun run preview`          | Serves the built site.                                               |
| `bun run ci`               | The full gate: format, lint, types, and the three test suites.       |
| `bun run format`           | Formats the code (oxfmt, and Prettier for `.astro`).                 |
| `bun run lint`             | Runs oxlint and stylelint.                                           |
| `bun run check`            | Runs `astro check`, the type check.                                  |
| `bun run test`             | Runs the unit tests. [`testing.md`](testing.md) has the suites.      |
| `bun run verification`     | Lists which adhkar are proven, and what the others lack.             |
| `bun run icons`            | Draws the favicons from `src/lib/mark.ts`.                           |
| `bun run opengraph`        | Draws the card of the home page and of each occasion.                |
| `bun run opengraph:adhkar` | Draws the card of each dhikr that has none, and deletes stale cards. |

The `verification:*` scripts write the proof of a dhikr. The `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`) says when to run each one.

Never run `bun run deploy` or a `wrangler` command that changes the live site unless the owner asks for that deploy.

## Scripts

- Every script in `scripts/` is TypeScript, and Bun runs it as it is, with no build step.
- `scripts/verification/capture.js` is the one JavaScript file. It runs in the browser, on dorar.net or sunnah.com ([`exceptions.md`](exceptions.md#the-proofs-are-json-files-in-git)).
- A script imports from `src/lib/` with the `.ts` extension: `import { markSvg } from '../../src/lib/mark.ts'`.
- A script prints its usage and exits with 1 when its arguments are wrong.

## Git hooks

| Hook         | What it runs                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `pre-commit` | The commit identity, the forbidden terms, the pending list, and the format check.                          |
| `commit-msg` | The forbidden terms in the message.                                                                        |
| `pre-push`   | The commit identity and the forbidden terms of each pushed commit, then `bun run lint` and `bun run test`. |

The guards are in `scripts/check/`. [`CONTRIBUTING.md`](../.github/CONTRIBUTING.md#keeping-your-email-private) explains the email guard and the forbidden terms.

## Generated files

Do not edit these by hand. Run their script again.

- `public/favicon.svg`, `favicon.ico`, the PNG icons, and `apple-touch-icon.png`: `bun run icons`.
- `public/opengraph.png` and `public/opengraph-<occasion>.png`: `bun run opengraph`.
- `public/og/<occasion>/<slug>-<fingerprint>.png`: `bun run opengraph:adhkar`.
- `.astro/` and `dist/`: Astro writes them, and git ignores them.
