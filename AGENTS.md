# Wirdy Agent Guidelines

This repo holds [wirdy.site](https://wirdy.site) (وِردي): a small static Arabic site of the daily adhkar that are authentic from the Prophet ﷺ: a home page of eight occasions, one page for each occasion, one page for each dhikr, a page of the hadiths of الطب النبوي, a page of the well-known adhkar that did not come in («ما لم يثبت»), and a search page. Under each dhikr is its takhrij, linked to dorar.net. Astro builds the pages, and Cloudflare Pages serves them. There is no server, no client framework, one small inline script on every page, and one small module script for search.

## Layout

- `src/content/adhkar/<occasion>/`: one Markdown file for each dhikr. The frontmatter holds the count, the occasion, the takhrij, and optionally its `context`, its manner (`how`), its `counts`, a `group` heading, a `form`, and its `fadl`. The body is the text. [`docs/content.md`](docs/content.md) is the standard every file meets.
- `src/content/tibb/`: the sound hadiths of الطب النبوي, one Markdown file each, shown on one page. [`docs/content.md`](docs/content.md), "الطب النبوي", has the rules.
- `src/content/unproven/`: the well-known adhkar that stay out, each with its al-Albani ruling, shown on the «ما لم يثبت» page.
- `src/lib/`: the content schema (`schema.ts`), the morning and evening markers (`variants.ts`), the occasions (`occasions.ts`), the color of each occasion from its place on the list (`tone.ts`), the grouping of a page into headed runs (`groups.ts`), Arabic numerals and labels (`arabic.ts`), the count's ring of beads (`beads.ts`), the takhrij sentence under each dhikr (`takhrij.ts`), the name of a dhikr with its context and its evening form (`title.ts`), the lead line and the fold of a long سورة (`lead.ts`), the phrases with their counts (`phrases.ts`), what the copy button gives (`copy.ts`), the place of a sound form (`sound.ts`), the permanent links (`permalink.ts`, `permalinks.json`), the sharing card and its excerpt (`card.ts`, `excerpt.ts`), the folding, matching, and marking of a search (`search.ts`), the occasion emblems (`emblems.ts`), the sunflower mark (`mark.ts`), and the points of a ring (`ring.ts`). Each one has a test next to it (`content.test.ts` covers the schema). `icons.ts` holds the icons, and `palette.ts` holds the colors that the code shares with the styles. `collection.ts` reads the collection for the pages, and the build test covers it. The proofs are in `proof.ts` (the record's schema), `matching.ts`, `fingerprint.ts`, `verification.ts` (the status of a dhikr), and `baseline.ts`. `records.ts` reads the files, and `proofs.test.ts` covers it.
- `src/components/`, `src/layouts/`, `src/styles/`: the design system. Each component's stylesheet has its name, and `tokens.css` holds every value. [`docs/design-system.md`](docs/design-system.md) has the rules. The design follows [Laws of UX](https://lawsofux.com/), and the README credits it.
- `src/pages/`: the home page (`index.astro`), the occasion pages (`[occasion].astro`), a page for each dhikr (`[occasion]/[dhikr].astro`), the الطب النبوي page (`al-tibb-al-nabawi.astro`), the «ما لم يثبت» page (`ma-lam-yathbut.astro`), the search page (`bahth.astro`), the 404 page (`404.astro`), the search index (`search/[version].json.ts`), and the `robots.txt`, `sitemap.xml`, and `site.webmanifest` endpoints.
- `src/scripts/`: the module script of search (`search.ts`), shared by the search page and the search sheet.
- `public/`: the icons, the OpenGraph cards (one for the home page and one for each occasion), and `_headers`, the Cloudflare Pages response headers. The icons and the cards are generated. Run `bun run icons` (it draws `favicon.svg` from `src/lib/mark.ts`), `bun run opengraph`, or `bun run opengraph:adhkar` (one card for each dhikr, in `public/og/`), and do not edit them by hand.
- `scripts/`: the icon and OpenGraph generators (headless Chromium), `scripts/check/`, the git guards, and `run.ts`, which runs each script as an Effect program with the Node services.
- `verification/`: one JSON record for each proven dhikr, with the text of the pages that prove it, and `pending.json`, the adhkar that are not proven yet. The site does not read it. [`docs/content.md`](docs/content.md), "The proof", has the rules.
- `docs/`: [`README.md`](docs/README.md) is the index, with one line for each doc and when to read it. It lists [`branding/`](docs/branding/README.md) (the name, the mark, the colors, and the metadata, the source of truth for the visuals), [`content.md`](docs/content.md) (what goes in, and how to check it), [`code-conventions.md`](docs/code-conventions.md), [`naming.md`](docs/naming.md), [`testing.md`](docs/testing.md), [`design-system.md`](docs/design-system.md), [`exceptions.md`](docs/exceptions.md), [`development.md`](docs/development.md), [`writing.md`](docs/writing.md), and [`emblem-ideas.md`](docs/emblem-ideas.md).

## Commands

```bash
bun install          # also turns on the git hooks in .githooks/
bun run dev          # the local site
bun run ci           # the full gate: format, lint, types, tests, and the build test
bun run test         # the unit and content tests only
bun run verification # which adhkar are proven, and what the others lack (add an id for one)
```

## Hard rules

- Never add a dhikr, or change its text, count, or ruling, from memory. Every change cites a dorar.net page that you opened in this session, or two pages on two other sites that agree and that you opened in this session. Two agreeing sources stand for one dorar.net page (see [`docs/content.md`](docs/content.md), "What goes in"). Follow [`docs/content.md`](docs/content.md), and use the `verifying-a-dhikr` skill.
- Never add or refresh an entry in `verification/pending.json`. It only shrinks. Never write a source text in a record by hand: capture it from its page.
- Never add a dhikr that al-Albani grades ضعيف or worse, even when another scholar accepts it. The site holds only what passes [`docs/content.md`](docs/content.md), "What goes in".
- Never deploy unless the user asks for that deploy. This covers `bun run deploy` and any `wrangler` command that changes the live site. Approval for one deploy does not carry over to the next.
- Never start subagents, workflows, or other multi-agent tooling unless the user asks for it in that request.
- Code has no comments. See [`docs/code-conventions.md`](docs/code-conventions.md), "Comments".
- Do not use em-dashes anywhere: not in code, docs, commit messages, or chat. Use a period, a comma, or parentheses.

## Keep it boring

- This is a static site of text. Code must look like what an experienced Astro developer expects, written with Effect ([`docs/exceptions.md`](docs/exceptions.md#the-code-is-written-with-effect), [`docs/code-conventions.md`](docs/code-conventions.md#typescript)).
- Ship HTML and CSS. Add client JavaScript only when CSS cannot do the job, and keep it inline and small. Search is the one exception (see [`docs/exceptions.md`](docs/exceptions.md)). No page makes a third-party request, and a build test enforces it.
- Treat anything unusual as a warning sign. If a request would add unusual code, do not build it yet. Say plainly that it is unusual and why, and show the normal way. Then wait for the user's decision.
- Read [`docs/exceptions.md`](docs/exceptions.md) before you build. Anything it does not list must be standard. When the user approves an unusual approach, add its entry there in the same change.

## Agent workflow

- When the user asks for a review, use the `reviewing` skill (`.claude/skills/reviewing/SKILL.md`).
- Before you check any dhikr, run `bun run verification`. Do not check a proven dhikr again. Check only what it lists, and save the record of each dhikr before you start the next.
- To check or add a dhikr, use the `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`). Use the user's browser for dorar.net, because the site can block scripted requests. Cross-check wording on Turath or al-Maktaba al-Shamela where narrations differ. To find a hadith inside one book, search it on usul.ai, whose API serves the same editions.
- Commits: see [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md), "Keeping your email private". The hooks refuse any author, committer, or trailer email except the one in `wirdy.allowedEmail`. Do not add a `Co-authored-by:` trailer.
- Run `bun run ci` before you say a change is done. Report each failure from its output.
- Update `README.md` and `docs/` in the same change when you change what they describe. Add a new doc to [`docs/README.md`](docs/README.md).
- Before you name a file or a function, read [`docs/naming.md`](docs/naming.md). Before you write a test, read [`docs/testing.md`](docs/testing.md).
