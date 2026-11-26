# Contributing

## Start with an issue

Every pull request links an [issue](https://github.com/raaqimorg/wirdy/issues). For a security vulnerability, see [SECURITY.md](SECURITY.md).

For a wrong word, count, time, or ruling, or a missing authentic dhikr, use the **Dhikr correction** form. It asks for the dorar.net page that shows the correction. Only that page can change the content: another app or a printed book is context, not proof.

For a change to the site, use the **Bug report** form. For a larger change, agree on the approach in the issue before you write code. Keep each pull request small, with one concern.

## Adding or changing a dhikr

The work is evidence, not code. [`docs/content.md`](../docs/content.md) is the full standard.

1. Find the hadith on [dorar.net](https://dorar.net/hadith). It is in al-Bukhari or Muslim, or al-Albani grades it صحيح or حسن.
2. Check the text, the count, and the time against that page, phrase by phrase.
3. Search dorar.net for other rulings on the hadith. Record a dispute in `note`.
4. Add or change the file under `src/content/adhkar/<occasion>/`, with the dorar.net page in `takhrij.url`.
5. In the pull request, give each changed dhikr's dorar.net page and what it shows.

## Making changes

1. Fork the repo, and branch off `main`.
2. Run `bun install`. It also turns on the git hooks in `.githooks/`.
3. Run `bun run dev`, and open `http://localhost:4321`.
4. Add a test for every behavior change: a content rule in `src/lib/content.test.ts`, a built-page rule in `src/build.test.ts`.
5. Run `bun run ci` before you open a pull request: format, lint, types, tests, and the build test. GitHub Actions runs the same.
6. Open the pull request into `main`, with `Closes #<issue>` in its description, and fill in the template.

[`docs/README.md`](../docs/README.md) indexes the docs. Read [`code-conventions.md`](../docs/code-conventions.md), [`naming.md`](../docs/naming.md), [`testing.md`](../docs/testing.md), and [`writing.md`](../docs/writing.md) before your first change. [`exceptions.md`](../docs/exceptions.md) lists the few unusual choices, and why.

## Working with an AI agent

`AGENTS.md` (also `CLAUDE.md` and `GEMINI.md`) holds the agent rules. `.claude/skills/` holds two workflows: `reviewing` and `verifying-a-dhikr`.

Install the [GitHub CLI](https://cli.github.com) and run `gh auth login`, so an agent can read an issue (`gh issue view <number> --comments`) and open a pull request (`gh pr create`).

An agent never adds or changes a dhikr from memory. It opens the dorar.net page, as a person does.

## Keeping your email private

Every commit carries an author email, and a push publishes it. These steps make this clone commit only with the address you choose, such as your GitHub no-reply address.

1. Set the address for this clone: `git config --local user.email <address>`.
2. Turn on the guard: `git config --local wirdy.allowedEmail "$(git config --local user.email)"`.
   - The hooks then refuse any commit or push with another address as author, committer, or trailer (such as `Co-authored-by:`), including one an agent or a script sets.
   - The address stays in `.git/config`, never committed.
3. Optional: list words that must never leave your machine, one regular expression per line, in `.git/info/forbidden-terms`. The hooks refuse a commit or push that holds one in a file, a file name, or a message.
4. On GitHub, in Settings, then Emails, turn on "Keep my email addresses private" and "Block command line pushes that expose my email".

## License

You license your contributions under the project's [MIT license](../LICENSE).
