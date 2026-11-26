# Development

The setup, the commands, the git hooks, and the generated files.

## Setup

1. Install [Bun](https://bun.sh) 1.4 or later.
2. Run `bun install`. It also turns on the git hooks in `.githooks/`.
3. Run `bun run dev`, and open `http://localhost:4321`.

The icon and card scripts need a Chromium browser (Brave, Chrome, Chromium, or Edge). Set `CHROME` to its path if it is not in `/Applications`.

## Commands

| Command                    | What it does                                                   |
| -------------------------- | -------------------------------------------------------------- |
| `bun run dev`              | Serves the site locally.                                       |
| `bun run build`            | Builds the site into `dist/`.                                  |
| `bun run preview`          | Serves the built site.                                         |
| `bun run ci`               | The full gate: format, lint, types, and the three test suites. |
| `bun run format`           | Formats the code (oxfmt, and Prettier for `.astro`).           |
| `bun run lint`             | Generates the Astro types, then runs oxlint and stylelint.     |
| `bun run check`            | Runs `astro check`, the type check.                            |
| `bun run test`             | Runs the unit tests ([`testing.md`](testing.md)).              |
| `bun run verification`     | Lists the proven adhkar, and what the others lack.             |
| `bun run icons`            | Draws the favicons from `src/lib/mark.ts`.                     |
| `bun run opengraph`        | Draws the cards of the home page and each section.             |
| `bun run opengraph:adhkar` | Draws each missing dhikr card, and deletes stale ones.         |
| `bun run visits hourly`    | Sends the owner the visits of the last hour on Telegram.       |
| `bun run visits morning`   | Sends the owner the visits of the day before on Telegram.      |

The `verification:*` scripts write a dhikr's proof. The `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`) says when to run each.

Never run `bun run deploy`, or a `wrangler` command that changes the live site, unless the owner asks for that deploy.

## Scripts

- Every script in `scripts/` is TypeScript that Bun runs directly. Each is an Effect program that ends with `run(program)` from `scripts/run.ts`. The verification scripts read and write a record through `scripts/verification/record.ts`, which decodes it before writing.
- `scripts/verification/capture.js` is the one JavaScript file in `scripts/`. It runs in the browser on dorar.net or sunnah.com ([`exceptions.md`](exceptions.md#the-proofs-are-json-files-in-git)).
- A script imports from `src/lib/` with the `.ts` extension: `import { markSvg } from '../../src/lib/mark.ts'`.
- On wrong arguments, a script prints its usage and exits with 1.

## The visit reports

`.github/workflows/visits.yml` sends the owner the site's visits on Telegram. It reads Cloudflare's own count, so no page changes ([`exceptions.md`](exceptions.md#a-scheduled-job-sends-the-owner-the-visits)).

- At minute 17 of every hour: the visits of the last whole hour, and of the day so far in Riyadh time. An hour with no visits arrives silently.
- At 07:07 in Riyadh: the visits of the day before, and a question about the adhkar.
- A manual run (Actions, Visits, Run workflow) sends the hourly report silently.
- The secrets: `CLOUDFLARE_API_TOKEN` (Zone, Analytics, Read, for wirdy.site only), `CLOUDFLARE_ZONE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `RECIPIENT_NAME`, the names a report greets, separated by spaces (each report picks one at random). To run a report locally, put them in `.env`, which git ignores.
- The job logs no number. A failed run exits with 1, and GitHub emails the owner.
- GitHub turns off a schedule after 60 days with no commit. When the reports stop, turn it on again in Actions, Visits.

## Git hooks

| Hook         | What it runs                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `pre-commit` | The commit identity, the forbidden terms, the pending list, and the format check.               |
| `commit-msg` | The forbidden terms in the message.                                                             |
| `pre-push`   | The identity and forbidden terms of each pushed commit, then `bun run lint` and `bun run test`. |

The guards are in `scripts/check/`. [`CONTRIBUTING.md`](../.github/CONTRIBUTING.md#keeping-your-email-private) explains the email guard and the forbidden terms.

## Generated files

Never edit these by hand. Run their script.

- `public/favicon.svg`, `favicon.ico`, the PNG icons, and `apple-touch-icon.png`: `bun run icons`.
- `public/opengraph/home-<fingerprint>.png` and `public/opengraph/<section>-<fingerprint>.png`: `bun run opengraph`.
- `public/og/<occasion>/<slug>-<fingerprint>.png`: `bun run opengraph:adhkar`.
- `.astro/` and `dist/`: Astro writes them, and git ignores them.
