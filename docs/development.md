# Development

The setup, the commands, the git hooks, and the generated files.

## Setup

1. Install [Bun](https://bun.sh) 1.4 or later.
2. Run `bun install`. It also turns on the git hooks in `.githooks/`.
3. Run `bun run dev`, and open `http://localhost:4321`.

The icon, card, and promo scripts need a Chromium browser (Brave, Chrome, Chromium, or Edge). Set `CHROME` to its path if it is not in `/Applications`. The promo scripts also need [ffmpeg](https://ffmpeg.org) on `PATH`, and a browser that plays H.264 (Brave or Chrome, not plain Chromium).

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
| `bun run promo:check <f>`  | Names what in a promo film breaks its rules.                   |
| `bun run promo:sheet <f>`  | Draws a promo film's contact sheet into `out/sheet.png`.       |
| `bun run promo:render <f>` | Renders a promo film to `out/<slug>.mp4` (`--draft`: half).    |
| `bun run promo:clip`       | Turns a simulator recording into a clip a film can seek.       |
| `bun run visits`           | Sends the owner the visits of the last half hour on Telegram.  |
| `bun run visits:deploy`    | Deploys the Worker that sends the visits every half hour.      |

The `verification:*` scripts write a dhikr's proof. The `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`) says when to run each.

The `promo:*` scripts make a promo film from `promo/<slug>/` (`<f>` is that folder). The `making-a-promo` skill (`.claude/skills/making-a-promo/SKILL.md`) is the procedure, and its `template/` is the film to start from.

Never run `bun run deploy`, `bun run visits:deploy`, or a `wrangler` command that changes the live site or the Worker, unless the owner asks for that deploy.

## Scripts

- Every script in `scripts/` is TypeScript that Bun runs directly. Each is an Effect program that ends with `run(program)` from `scripts/run.ts`. The verification scripts read and write a record through `scripts/verification/record.ts`, which decodes it before writing.
- `scripts/verification/capture.js` is the one JavaScript file in `scripts/`. It runs in the browser on dorar.net or sunnah.com ([`exceptions.md`](exceptions.md#the-proofs-are-json-files-in-git)).
- A script imports from `src/lib/` with the `.ts` extension: `import { markSvg } from '../../src/lib/mark.ts'`.
- On wrong arguments, a script prints its usage and exits with 1.

## The visit reports

The Worker `wirdy-visits` (`scripts/visits/worker.ts`, configured by `scripts/visits/wrangler.toml`) sends the owner the site's visits on Telegram. A Cron Trigger runs it. It reads Cloudflare's own count, so no page changes ([`exceptions.md`](exceptions.md#a-scheduled-job-sends-the-owner-the-visits)).

- At minute 00 and 30 of every hour (the same minutes in Riyadh): the visits of the half hour up to the run, and of the day so far in Riyadh time. The run at Riyadh midnight gives the whole day, as yesterday. A half hour with no visits arrives silently.
- Cloudflare's count lags a few minutes, so the last half hour can come up a little short. The day is counted again in every run, so the next report holds the missed visits.
- `bun run visits --silent` sends the report from this machine, silently, for the last half hour.
- The secrets: `CLOUDFLARE_API_TOKEN` (Zone, Analytics, Read, for wirdy.site only), `CLOUDFLARE_ZONE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `RECIPIENT_NAME`, the names a report greets, separated by underscores, as in `الأولى_الثانية` (each report picks one at random, and a name may hold spaces). Set each on the Worker with `bunx wrangler secret put <NAME> --config scripts/visits/wrangler.toml`. To run a report locally, put them in `.env`, which git ignores.
- The Worker logs no number. A failed run shows as an error in the Worker's logs (dashboard, Workers, `wirdy-visits`, Logs). No one is emailed.
- To try the Worker locally, run `bunx wrangler dev --test-scheduled --config scripts/visits/wrangler.toml` with the secrets in `scripts/visits/.dev.vars`, then open `http://localhost:8787/__scheduled`. It sends a real message.

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
