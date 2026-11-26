# Content audit brief (shared by every agent)

Repo: the worktree `/Users/alwaleed.alqahani/Developer/wirdy/.claude/worktrees/content-audit` (branch `content-audit`). Wirdy (وِردي) is a static Arabic site of authentic daily adhkar. Read `CLAUDE.md` and `docs/content.md` first: they are the content standard (what goes in, what stays out, every frontmatter field). `src/lib/occasions.ts` holds the sections.

The owner believes the content is verified (195 of 196 adhkar have proofs in `verification/<occasion>/<slug>.json`), but found mistakes a proof cannot catch, and wants a critical, adversarial review. Two things the owner raised:

1. `src/content/tibb/33-ma-malaa-adamiyyun-wiaan.md` has `rawi: "المقدام بن معديكرب"`. The owner thinks the name is mishandled (two words treated as one). Establish from sources what is correct, and say plainly if the owner's concern is right, partly right, or wrong.
2. `src/content/adhkar/ahwal/58-man-halafa-bi-al-lat.md` (who swears by al-Lat and al-Uzza): the owner thinks items with no place in modern life should go. Find every item like it in your scope.

## Rules (hard)

- READ ONLY. Never edit anything under `src/`, `verification/`, `public/`, `scripts/`. Never commit. Write only your own output file named below.
- Never write a hadith text, ruling, number, or name from memory. Every claim cites a URL you fetched in this session, with the exact words you saw. If you could not fetch a page, say so; never guess its contents.
- dorar.net blocks curl and fetch tools: do not try it, and do not use any browser tool (the main session owns the browser). Use instead: hdith.com (`.md` pages via curl, one request every 3 s at most; ids are its own), shamela.ws (try curl, slowly, 1 per 2 s), usul.ai API (`https://api.usul.ai/search?q=<book>` then `https://api.usul.ai/search/content?bookId=<id>&versionId=<edition>&q=<words>`), islamweb.net, and web search. sunnah.com returns 403 to curl. Where only dorar.net can settle a point, mark it `needs_dorar` with the exact question; the main session will check it in the browser.
- al-Albani's ruling decides (see docs/content.md). A dhikr he grades ضعيف or worse is out.
- Verification records are large (full captured pages). Do not cat them. Extract what you need with a short python3 script, e.g. each `sources[i].site`, `url`, and `text`, and the `claims`. The proof matches text loosely (it likely ignores tashkil and punctuation), so the tashkil, punctuation, titles, `when`, `how`, `fadl`, `note`, `context`, `rawi`, grouping, and Arabic language are where errors hide.
- Challenge yourself. For each finding, try to disprove it before you keep it (another narration, another edition, a scholar's spelling). Keep a finding only if it survives, and say what you tried. Prefer fewer, solid findings over many weak ones, but miss nothing real.
- No em-dashes in anything you write. Arabic for every user-facing field.
- Budget: be efficient. Batch file reading with shell (e.g. print all frontmatter of a folder in one command). Do not re-fetch pages.

## What to look for

- Errors: wrong word, wrong tashkil (compare against the tashkil'd Shamela or hdith.com text in the record), dropped or added phrase, wrong count, wrong moment/mode, a `fadl` not in the cited hadith, a `when`/`how` the hadith does not state, a wrong book/number/ruling, a wrong or misspelled Companion name, a `note` that misstates its source, Arabic grammar or spelling errors in titles and fields.
- Doubts: a ruling al-Albani weakened elsewhere, a wording only a weak narration gives, a Companion's words with no proof of the Prophet's ﷺ approval.
- Relevance: items with no practical use today (like the al-Lat one), and duplicates or near-duplicates.
- Presentation: a title that misleads, a `when` cue that is unclear, a group name that does not fit.
- The good: note briefly what is done well and worth keeping as the model for the rest.

## Output

Write one JSON file (path given in your task) with this shape, then reply with a short summary (counts by severity, the top 5 findings in one line each):

{
"scope": "...",
"files_reviewed": <n>,
"findings": [
{
"id": "A-01",
"file": "src/content/...md",
"field": "body|title|when|how|fadl|note|count|mode|takhrij|rawi|group|context|other",
"kind": "error|doubt|relevance|duplicate|presentation|language",
"severity": "critical|major|minor",
"current": "the exact current value (short)",
"issue_ar": "the problem, in Arabic, plainly",
"evidence": [{"url": "...", "quote": "exact words from the page"}],
"disproof_tried_ar": "what you checked to try to refute it",
"options_ar": ["أ: ...", "ب: ..."],
"recommended": "أ",
"needs_dorar": "question for dorar.net, or empty"
}
],
"good_ar": ["..."],
"unchecked_ar": ["what you could not check and why"]
}
