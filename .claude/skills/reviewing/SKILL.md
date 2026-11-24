---
name: reviewing
description: Use when the user asks for a review of anything in this repo (a diff, branch, commit, PR, plan, or finished task), including "review this", "look it over", "sanity check", or "does this look right".
---

# Reviewing

A review here is one light sanity pass that you do yourself, in the current session: read the change, spot what is actually wrong, say it plainly, done.

It replaces `superpowers:requesting-code-review`, the `code-review` and `simplify` skills, and any subagent or workflow review. Use those only when the user names them.

## The pass

1. Get the change (`git diff`, `git diff main...HEAD`, `gh pr diff <n>`, or the file the user points at). Read it once, top to bottom, with just enough surrounding code to follow it.
2. Hold it against five questions:
   - Is every dhikr still authentic? A content change meets `docs/content.md`, and its `takhrij.url` is a dorar.net page of that hadith. If one finding needs it, open that page in the user's browser.
   - Does it work? Wrong logic, a missed edge case, anything that breaks the build or the page.
   - Does it break what already works? The URL, the head tags, the morning and evening switch.
   - Is it in good taste? Needless abstraction, clever code, client JavaScript that CSS could replace, anything "Keep it boring" in `AGENTS.md` rules out.
   - Does it follow the repo rules? No comments, no em-dashes, the conventions in `docs/`.
3. If one finding needs confirming, a quick targeted check (a grep, one test, one dorar.net page) is fine. Then stop.

## The output

- A one-line verdict first: "Ship it", "Ship after fixing X", or "No, because Y".
- Then the problems that matter, most serious first, each as `file:line` and one sentence on what breaks. Usually zero to five.
- That is the whole review. Report, don't fix, unless the user asked for fixes.

Blunt about the code, never about the person.
