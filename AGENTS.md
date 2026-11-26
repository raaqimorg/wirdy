# Wirdy Agent Guidelines

[wirdy.site](https://wirdy.site) (وِردي) is a static Arabic site of the daily adhkar authentic from the Prophet ﷺ: a home page of eight occasions, a page per occasion, a page per dhikr, and a page of الطب النبوي with a page per hadith. Search opens over any page. Each dhikr shows its takhrij, linked to dorar.net. Astro builds it, and Cloudflare Pages serves it: no server, no client framework, a small inline script per page, one module script for search, and a service worker that keeps the sections on the device.

## Layout

- `src/content/adhkar/<occasion>/`: one Markdown file per dhikr. The frontmatter holds the count, the occasion, the takhrij, and optional fields; the body is the text. [`docs/content.md`](docs/content.md) is the standard.
- `src/content/tibb/`: the hadiths of الطب النبوي, one file each, on one page and a page per hadith ([`docs/content.md`](docs/content.md#الطب-النبوي)).
- `src/lib/`: one topic per file, each with a test beside it (`content.test.ts` covers `schema.ts`, the build test covers `collection.ts`, `proofs.test.ts` covers `records.ts`). The proofs are `proof.ts`, `matching.ts`, `fingerprint.ts`, `verification.ts`, `baseline.ts`, and `records.ts`.
- `src/components/`, `src/layouts/`, `src/styles/`: the design system ([`docs/design-system.md`](docs/design-system.md)).
- `src/pages/`: the routes, the search index (`search/[version].json.ts`), and the `robots.txt`, `sitemap.xml`, `llms.txt`, and `site.webmanifest` endpoints.
- `src/scripts/search.ts`: the search module behind the search sheet.
- `src/scripts/service-worker.js`: the service worker. `src/lib/offline.ts` writes it into `dist/` after the build, with the fingerprint of every page ([`docs/exceptions.md`](docs/exceptions.md#a-service-worker-keeps-the-sections-on-the-device)).
- `public/`: the generated icons and cards, and `_headers`. Run `bun run icons`, `bun run opengraph`, or `bun run opengraph:adhkar`. Never edit them by hand.
- `scripts/`: the icon and card generators (headless Chromium), the verification scripts, the visit reports to Telegram (`visits/`), the git guards (`check/`), and `run.ts`, which runs each script as an Effect program.
- `verification/`: one JSON proof per proven dhikr, and `pending.json`, the adhkar not proven yet. The site does not read it ([`docs/content.md`](docs/content.md#the-proof)).
- `docs/`: [`README.md`](docs/README.md) indexes every doc and says when to read it.

## Commands

```bash
bun install          # also turns on the git hooks
bun run dev          # the local site
bun run ci           # the full gate: format, lint, types, tests, build test
bun run test         # the unit and content tests
bun run verification # the proven adhkar, and what the others lack (add an id for one)
```

## Hard rules

- Never add a dhikr, or change its text, count, or ruling, from memory. Cite a dorar.net page you opened in this session, or two agreeing pages on two other sites you opened in this session ([`docs/content.md`](docs/content.md#what-goes-in)). Use the `verifying-a-dhikr` skill.
- Never add or refresh an entry in `verification/pending.json`. It only shrinks. Never write a source text in a record by hand: capture it from its page.
- Never add a dhikr that al-Albani grades ضعيف or worse, even when another scholar accepts it.
- Never deploy unless the user asks for that deploy: `bun run deploy`, or any `wrangler` command that changes the live site. One approval covers one deploy.
- Never start subagents, workflows, or other multi-agent tooling unless the user asks in that request.
- Code has no comments ([`docs/code-conventions.md`](docs/code-conventions.md#comments)).
- No em-dashes anywhere: code, docs, commits, or chat. Use a period, a comma, or parentheses.

## Keep it boring

- Write what an experienced Astro developer expects, with Effect ([`docs/exceptions.md`](docs/exceptions.md#the-code-is-written-with-effect), [`docs/code-conventions.md`](docs/code-conventions.md#typescript)).
- Ship HTML and CSS. Add client JavaScript only when CSS cannot do the job, inline and small. Search is the one exception. No page makes a third-party request, and a build test enforces it.
- Unusual code is a warning sign. Before you build it, say it is unusual and why, show the normal way, and wait for the user's decision.
- Read [`docs/exceptions.md`](docs/exceptions.md) before you build. Anything it does not list is standard. When the user approves an unusual approach, add its entry in the same change.

## Agent workflow

- For a review, use the `reviewing` skill.
- Before you check any dhikr, run `bun run verification`. Check only what it lists, never a proven dhikr, and save each record before you start the next.
- To check or add a dhikr, use the `verifying-a-dhikr` skill. Use the user's browser for dorar.net, which blocks scripted requests.
- Commits: the hooks refuse any author, committer, or trailer email but `wirdy.allowedEmail` ([`CONTRIBUTING.md`](.github/CONTRIBUTING.md#keeping-your-email-private)). Add no `Co-authored-by:` trailer.
- Run `bun run ci` before you call a change done, and report each failure from its output.
- Update `README.md` and `docs/` in the same change as what they describe.
- Read [`docs/naming.md`](docs/naming.md) before you name a file or a function, and [`docs/testing.md`](docs/testing.md) before you write a test.
