# Writing

The rules for docs, `AGENTS.md`, issues, pull requests, and commit messages. Read it before you write any of them.

## The rules

Many readers read Arabic first and English second. The rules follow [ASD-STE100](https://www.asd-ste100.org) (Simplified Technical English).

- Write short sentences, one idea each.
- Say only what matters. Cut every word that adds nothing.
- Write an instruction as a command: "Run `bun run ci`."
- Use the active voice and the present tense.
- Use one word for one meaning. The terms in [`content.md`](content.md) (dhikr, occasion, takhrij, ruling) name the domain.
- A number is evidence: "60 adhkar", not "many adhkar".
- No em-dashes. Use a period, a comma, or parentheses.

## Docs

- [`README.md`](README.md) indexes `docs/`. Add a new doc to it in the same commit.
- Give each doc one topic, and open it with one sentence on what it holds and when to read it.
- Link a doc in Markdown, not in backticks, with the heading's anchor when you name a heading: [`content.md`](content.md#the-proof).
- Keep backticks for a command, a symbol, and a code path.
- When a change alters what a doc describes, update the doc in the same commit, including the root `README.md` and `AGENTS.md`.
- Write a reason the code cannot say in [`exceptions.md`](exceptions.md), not in a comment.
- `AGENTS.md` is the agent guide. `CLAUDE.md` and `GEMINI.md` are symlinks to it, so edit only `AGENTS.md`.

## Commits

- Write the subject as `type: what changed`, lowercase, with no period.
- The types are `feat`, `fix`, `content`, `docs`, `test`, `refactor`, `chore`, and `ci`.
- Use `content` for a change under `src/content/` or `verification/`, and name the dhikr and the dorar.net page in the body.
- One concern per commit.
- Commit with the address in `wirdy.allowedEmail` ([`CONTRIBUTING.md`](../.github/CONTRIBUTING.md#keeping-your-email-private)). Add no `Co-authored-by:` trailer.

## Pull requests

- Put `Closes #<issue>` in the description, and fill in the template.
- One small concern per pull request.
- For a content change, give each changed dhikr's dorar.net page and what it shows.
