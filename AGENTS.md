# Wirdy Agent Guidelines

This repo holds [wirdy.site](https://wirdy.site) (وِردي): a small static Arabic site of the daily adhkar that are authentic from the Prophet ﷺ: a home page of seven occasions, one page for each occasion, and a page of the well-known adhkar that did not come in («ما لم يثبت»). Under each dhikr is its takhrij, linked to dorar.net. Astro builds the pages, and Cloudflare Pages serves them. There is no server, no client framework, and one small inline script.

## Layout

- `src/content/adhkar/<occasion>/`: one Markdown file for each dhikr. The frontmatter holds the count, the occasion, the takhrij, and optionally a `group` heading and its `fadl`. The body is the text. [`docs/content.md`](docs/content.md) is the standard every file meets.
- `src/content/unproven/`: the well-known adhkar that stay out, each with its al-Albani ruling, shown on the «ما لم يثبت» page.
- `src/lib/`: the content schema (`schema.ts`), the morning and evening markers and their word pairs (`variants.ts`), the occasions (`occasions.ts`), the grouping of a page into headed runs (`groups.ts`), Arabic numerals and labels (`arabic.ts`), the count's ring of beads (`beads.ts`), the takhrij sentence under each dhikr (`takhrij.ts`), the lead line (`lead.ts`), the permanent links (`permalink.ts`, `permalinks.json`), the sharing card and its excerpt (`card.ts`, `excerpt.ts`), the occasion emblems (`emblems.ts`), and the sunflower mark (`mark.ts`). Each one has a test next to it. `collection.ts` reads the collection for the pages, and the build test covers it.
- `src/components/`, `src/layouts/`, `src/styles/`: the pages. The design follows [Laws of UX](https://lawsofux.com/), and the footer credits it.
- `src/pages/`: the home page (`index.astro`), the occasion pages (`[occasion].astro`), a page for each dhikr (`[occasion]/[dhikr].astro`), the «ما لم يثبت» page (`ma-lam-yathbut.astro`), the 404 page (`404.astro`), and the `robots.txt`, `sitemap.xml`, and `site.webmanifest` endpoints.
- `public/`: the icons, the OpenGraph cards (one for the home page and one for each occasion), and `_headers`, the Cloudflare Pages response headers. The icons and the cards are generated. Run `bun run icons` (it draws `favicon.svg` from `src/lib/mark.ts`), `bun run opengraph`, or `bun run opengraph:adhkar` (one card for each dhikr, in `public/og/`), and do not edit them by hand.
- `scripts/`: the icon and OpenGraph generators (headless Chromium), and `scripts/check/`, the git guards.
- `docs/`: [`content.md`](docs/content.md) (what goes in, and how to check it), [`code-conventions.md`](docs/code-conventions.md), and [`exceptions.md`](docs/exceptions.md).

## Commands

```bash
bun install          # also turns on the git hooks in .githooks/
bun run dev          # the local site
bun run ci           # the full gate: format, lint, types, tests, and the build test
bun run test         # the unit and content tests only
```

## Hard rules

- Never add a dhikr, or change its text, count, or ruling, from memory. Every change cites a dorar.net page that you opened in this session. Follow [`docs/content.md`](docs/content.md), and use the `verifying-a-dhikr` skill.
- Never add a dhikr that al-Albani grades ضعيف or worse, even when another scholar accepts it. The site holds only what passes [`docs/content.md`](docs/content.md), "What goes in".
- Never deploy unless the user asks for that deploy. This covers `bun run deploy` and any `wrangler` command that changes the live site. Approval for one deploy does not carry over to the next.
- Never start subagents, workflows, or other multi-agent tooling unless the user asks for it in that request.
- Code has no comments. See [`docs/code-conventions.md`](docs/code-conventions.md), "Comments".
- Do not use em-dashes anywhere: not in code, docs, commit messages, or chat. Use a period, a comma, or parentheses.

## Keep it boring

- This is a static site of text. Code must look like what an experienced Astro developer expects.
- Ship HTML and CSS. Add client JavaScript only when CSS cannot do the job, and keep it inline and small. No page makes a third-party request, and a build test enforces it.
- Treat anything unusual as a warning sign. If a request would add unusual code, do not build it yet. Say plainly that it is unusual and why, and show the normal way. Then wait for the user's decision.
- Read [`docs/exceptions.md`](docs/exceptions.md) before you build. Anything it does not list must be standard. When the user approves an unusual approach, add its entry there in the same change.

## Agent workflow

- When the user asks for a review, use the `reviewing` skill (`.claude/skills/reviewing/SKILL.md`).
- To check or add a dhikr, use the `verifying-a-dhikr` skill (`.claude/skills/verifying-a-dhikr/SKILL.md`). Use the user's browser for dorar.net, because the site can block scripted requests. Cross-check wording on Turath or al-Maktaba al-Shamela where narrations differ.
- Commits: see [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md), "Keeping your email private". The hooks refuse any author, committer, or trailer email except the one in `wirdy.allowedEmail`. Do not add a `Co-authored-by:` trailer.
- Run `bun run ci` before you say a change is done. Report each failure from its output.
- Update `README.md` and `docs/` in the same change when you change what they describe.
