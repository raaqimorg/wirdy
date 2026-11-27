# Development

The setup, the commands, the git hooks, and the generated files.

## Setup

1. Install [Bun](https://bun.sh) 1.4 or later.
2. Run `bun install`. It also turns on the git hooks in `.githooks/`.
3. Run `bun run dev`, and open `http://localhost:4321`.

The icon, card, poster, and promo scripts need a Chromium browser (Brave, Chrome, Chromium, or Edge). Set `CHROME` to its path if it is not in `/Applications`. The promo scripts also need [ffmpeg](https://ffmpeg.org) on `PATH`, and a browser that plays H.264 (Brave or Chrome, not plain Chromium).

## Commands

| Command                    | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `bun run dev`              | Serves the site locally.                                          |
| `bun run build`            | Builds the site into `dist/`.                                     |
| `bun run preview`          | Serves the built site.                                            |
| `bun run ci`               | The full gate: format, lint, types, and the three test suites.    |
| `bun run format`           | Formats the code (oxfmt, and Prettier for `.astro`).              |
| `bun run lint`             | Generates the Astro types, then runs oxlint and stylelint.        |
| `bun run check`            | Runs `astro check`, the type check.                               |
| `bun run test`             | Runs the unit tests ([`testing.md`](testing.md)).                 |
| `bun run verification`     | Lists the proven adhkar, and what the others lack.                |
| `bun run icons`            | Draws the favicons from `src/lib/mark.ts`.                        |
| `bun run opengraph`        | Draws the cards of the home page and each section.                |
| `bun run opengraph:adhkar` | Draws each missing dhikr card, and deletes stale ones.            |
| `bun run posters`          | Draws each missing section poster, and deletes stale ones.        |
| `bun run gallery`          | Serves every image in `public/` on one page, at `localhost:4400`. |
| `bun run promo:check <f>`  | Names what in a promo film breaks its rules.                      |
| `bun run promo:sheet <f>`  | Draws a promo film's contact sheet into `out/sheet.png`.          |
| `bun run promo:render <f>` | Renders a promo film to `out/<slug>.mp4` (`--draft`: half).       |
| `bun run promo:clip`       | Turns a simulator recording into a clip a film can seek.          |
| `bun run visits`           | Sends the owner the visits of the last hour on Telegram.          |
| `bun run visits:deploy`    | Deploys the Worker that sends the visits every hour.              |

The `verification:*` scripts write a dhikr's proof. The `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`) says when to run each.

The `promo:*` scripts make a promo film from `promo/<slug>/` (`<f>` is that folder). The `making-a-promo` skill (`.claude/skills/making-a-promo/SKILL.md`) is the procedure, and its `template/` is the film to start from.

Never run `bun run deploy`, `bun run visits:deploy`, or a `wrangler` command that changes the live site or the Worker, unless the owner asks for that deploy.

Both deploys sign in with your own `wrangler login`. `.env` holds the visit reports' `CLOUDFLARE_API_TOKEN`, which may only read analytics, and Bun loads `.env` into every script and Wrangler reads it too, so a deploy that used it would fail. The two scripts unset it and give Wrangler an empty env file (`--env-file=/dev/null`). Any other `wrangler` command run from the repo needs the same.

## Scripts

- Every script in `scripts/` is TypeScript that Bun runs directly. Each is an Effect program that ends with `run(program)` from `scripts/run.ts`. The verification scripts read and write a record through `scripts/verification/record.ts`, which decodes it before writing.
- `scripts/verification/capture.js` is the one JavaScript file in `scripts/`. It runs in the browser on dorar.net or sunnah.com ([`exceptions.md`](exceptions.md#the-proofs-are-json-files-in-git)).
- A script imports from `src/lib/` with the `.ts` extension: `import { markSvg } from '../../src/lib/mark.ts'`.
- On wrong arguments, a script prints its usage and exits with 1.

## The visit reports

The Worker `wirdy-visits` (`scripts/visits/worker.ts`, configured by `scripts/visits/wrangler.toml`) sends the owner the site's visits on Telegram. A Cron Trigger runs it. It reads Cloudflare's own count, so no page changes ([`exceptions.md`](exceptions.md#a-scheduled-job-sends-the-owner-the-visits)).

- It counts readers, not bots: a visit to a page that answered 200, from a browser (a user agent that starts `Mozilla/5.0 (`), that Cloudflare does not list as a verified bot, and whose user agent names no bot, crawler, spider, headless browser, or link preview (`NOT_READER_AGENTS` in `scripts/visits/cloudflare.ts`). The X app's browser is a reader. On 2026-11-27 this left 224 of the 508 visits of the day: one SEO crawler alone made 136 in an hour.
- At minute 00 of every hour: the readers of the hour up to the run, and of the day so far in Riyadh time. Below them, the same hour a day before (↑ more now, ↓ fewer, no arrow when equal, no line when both had no one), and a line when more than half of the hour came from X. An hour with no readers arrives silently.
- The run at Riyadh midnight gives the whole day, as yesterday, against the day before it, and a summary: the 3 countries, the 3 pages people opened first (a dhikr or hadith page counts for its section or guide), every app the readers came from, and how often a poster file was fetched (the poster menu fetches it on a phone when a format is picked, and a computer when it saves). Each list ends with the rest of the day's readers as «بلدان أخرى», «صفحات أخرى», or «مصادر أخرى», so it adds up to the day: the readers past the top 3, and any it cannot name (a country code that is no country, such as `XX` or `T1`, a path that is no page). A list with nothing named is left out, and so is a line with nothing to say.
- The same run sends a second, silent message when readers asked for a missing path 3 times or more that day (the 5 most asked, leaving out paths with `.php`, `wp-`, or `/.`, which only scanners ask for), or when the site answered anyone with a 5xx error. A day with neither sends none.
- If the summary's query fails, the midnight report goes without it, and the error goes to the Worker's logs. If the totals fail, no report goes, and the run fails.
- The site's service worker keeps the sections on the device, so a section opened from the site reaches Cloudflare only when it is not kept yet. Only the first page of a visit is counted reliably. Cloudflare's free plan gives no referrer (`clientRefererHost` answers `authz`, tried on 2026-11-28), so an app is known only by the name its in-app browser gives (`SOURCE_AGENTS` in `scripts/visits/cloudflare.ts`): X, Instagram, Snapchat, TikTok, Facebook, Threads, the Google app, LinkedIn, Telegram, and Pinterest. An app that opens links in the device's browser (WhatsApp, Telegram on iOS) and a reader who typed the address count among «مصادر أخرى».
- Cloudflare samples its data, so a count may be estimated. Each count is rounded to a whole number.
- Cloudflare's count lags a few minutes, so the last hour can come up a little short. The day is counted again in every run, so the next report holds the missed visits.
- `bun run visits --silent` sends the report from this machine, silently, for the last hour.
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
- `public/posters/<slug>/<format>-<fingerprint>.png`: `bun run posters`.
- `.astro/` and `dist/`: Astro writes them, and git ignores them.
