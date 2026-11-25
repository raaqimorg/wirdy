---
name: reviewing
description: Use when the user asks for a review of anything in this repo (a diff, branch, commit, PR, plan, or finished task), including "review this", "look it over", "sanity check", or "does this look right".
---

# Reviewing

One light pass, by you, in this session: read the change, find what is wrong, say it plainly.

It replaces `superpowers:requesting-code-review`, the `code-review` and `simplify` skills, and any subagent or workflow review. Use those only when the user names them.

## The pass

1. Get the change (`git diff`, `git diff main...HEAD`, `gh pr diff <n>`, or the named file). Read it once, with just enough surrounding code to follow it.
2. Ask five questions:
   - Is every dhikr still authentic? A content change meets `docs/content.md`, and its `takhrij.url` is that hadith's dorar.net page. Open the page in the user's browser if a finding needs it.
   - Does it work? Wrong logic, a missed edge case, a broken build or page.
   - Does it break what works? The URL, the head tags, the morning and evening switch.
   - Is it in good taste? Needless abstraction, clever code, client JavaScript CSS could replace, anything "Keep it boring" in `AGENTS.md` rules out.
   - Does it follow the repo rules? No comments, no em-dashes, the conventions in `docs/`.
3. Confirm a finding with one quick check (a grep, a test, a dorar.net page) if needed. Then stop.

## The output

- A one-line verdict: "Ship it", "Ship after fixing X", or "No, because Y".
- The problems that matter, most serious first, each as `file:line` and one sentence on what breaks. Usually zero to five.
- Report, do not fix, unless the user asked for fixes.

Blunt about the code, never about the person.
