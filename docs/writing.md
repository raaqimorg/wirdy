# Writing

This doc holds the rules for docs, `AGENTS.md`, issues, pull requests, and commit messages. Read it before you write any of them.

## The rules

Many readers read Arabic first and English second. The rules follow the spirit of [ASD-STE100](https://www.asd-ste100.org) (Simplified Technical English).

- Write short sentences, with one idea in each.
- Write an instruction as a command: "Run `bun run ci`."
- Use the active voice and the present tense.
- Use one word for one meaning. The terms in [`content.md`](content.md) (dhikr, occasion, takhrij, ruling) are the names for the domain.
- A number is evidence: "60 adhkar", not "many adhkar".
- Do not use em-dashes. Use a period, a comma, or parentheses.

## Docs

- [`README.md`](README.md) is the index of `docs/`. Add a new doc to it in the same commit.
- Give each doc one topic, and open it with one sentence that says what it holds and when to read it.
- Write a pointer to a doc as a Markdown link, not in backticks. Add the heading's anchor when the pointer names a heading: [`content.md`](content.md#the-proof).
- Keep backticks for a command, a symbol, and a code path.
- When a change alters what a doc describes, update the doc in the same commit. This includes `README.md` at the root and `AGENTS.md`.
- Write a reason that the code cannot say in [`exceptions.md`](exceptions.md), not in a comment.
- `AGENTS.md` is the guide for agents. `CLAUDE.md` and `GEMINI.md` are symlinks to it, so edit only `AGENTS.md`.

## Commits

- Write the subject as `type: what changed`, in lowercase, with no period.
- The types are `feat`, `fix`, `content`, `docs`, `test`, `refactor`, `chore`, and `ci`.
- Use `content` for a change under `src/content/` or `verification/`, and name the dhikr and the dorar.net page in the body.
- Keep one concern in each commit.
- Commit with the address in `wirdy.allowedEmail`. [`CONTRIBUTING.md`](../.github/CONTRIBUTING.md#keeping-your-email-private) has the steps. Add no `Co-authored-by:` trailer.

## Pull requests

- Link the issue: put `Closes #<issue>` in the description, and fill in the template.
- Keep each pull request small, with one concern.
- For a content change, give the dorar.net page of each dhikr that you changed, and what it shows.
