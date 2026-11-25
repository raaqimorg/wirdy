# Contributing

## Start with an issue

Every pull request links to an [issue](https://github.com/raaqimorg/wirdy/issues). For a security vulnerability, see [SECURITY.md](SECURITY.md) instead.

If a dhikr has a wrong word, count, time, or ruling, or an authentic dhikr is missing, use the **Dhikr correction** form. It asks for the dorar.net page that shows the correction. Only that page can change the content. Another app or a printed book is useful context, but it is not enough on its own.

For a change to the site itself, use the **Bug report** form. Wait until the maintainers agree on the approach in the issue before you write code for a larger change. Keep each pull request small, with one concern.

## Adding or changing a dhikr

Most of the work is evidence, not code. [`docs/content.md`](../docs/content.md) is the full standard.

1. Find the hadith on [dorar.net](https://dorar.net/hadith). It must be in al-Bukhari or Muslim, or al-Albani must grade it صحيح or حسن.
2. Check the text, the count, and the time against that page, phrase by phrase.
3. Search dorar.net for other rulings on the same hadith. Record a dispute in the `note` field.
4. Add or change the file under `src/content/adhkar/<occasion>/`, with the dorar.net page in `takhrij.url`.
5. In the pull request, give the dorar.net page for each dhikr that you changed, and what it shows.

## Making changes

1. Fork the repo, and create a branch off `main`.
2. Run `bun install`. It installs the dependencies and turns on the git hooks in `.githooks/`.
3. Run `bun run dev` to see the site at `http://localhost:4321`.
4. Add a test for every change in behavior. A content rule goes in `src/lib/content.test.ts`. A rule about the built page goes in `src/build.test.ts`.
5. Run `bun run ci` before you open a pull request. It runs the formatter, the linter, the type check, the tests, and the build test. GitHub Actions runs the same steps.
6. Open the pull request into `main`. Put `Closes #<issue>` in its description, and fill in the template.

[`docs/README.md`](../docs/README.md) is the index of the docs. Read [`code-conventions.md`](../docs/code-conventions.md), [`naming.md`](../docs/naming.md), [`testing.md`](../docs/testing.md), and [`writing.md`](../docs/writing.md) before your first change. [`docs/exceptions.md`](../docs/exceptions.md) lists the few unusual choices, and why.

## Working with an AI agent

`AGENTS.md` (also `CLAUDE.md` and `GEMINI.md`) holds the rules for an AI agent. The `.claude/skills/` folder holds two workflows: `reviewing` and `verifying-a-dhikr`.

Install the [GitHub CLI](https://cli.github.com) (`gh`), and run `gh auth login`. Then an agent can read an issue (`gh issue view <number> --comments`) and open a pull request (`gh pr create`).

An agent must not add or change a dhikr from memory. It opens the dorar.net page, as a person does.

## Keeping your email private

Every commit carries an author email, and a push publishes it. Use these steps to make this clone commit only with the address that you choose, such as your GitHub no-reply address.

1. Set that address for this clone only: `git config --local user.email <address>`.
2. Turn on the guard: `git config --local wirdy.allowedEmail "$(git config --local user.email)"`.
   - The git hooks then refuse every commit and every push that uses a different address as author, committer, or trailer (such as `Co-authored-by:`). This includes an address that an AI agent or a script sets.
   - The address stays in `.git/config`. It is never committed.
3. Optional: list words that must never leave your machine, one regular expression on each line, in `.git/info/forbidden-terms`. The hooks then refuse a commit or a push that contains one, in a file, a file name, or a commit message.
4. On GitHub, go to Settings, then Emails. Turn on "Keep my email addresses private" and "Block command line pushes that expose my email".

## License

By contributing, you agree that your contributions are licensed under the project's [MIT license](../LICENSE).
