# Verification baseline: implementation plan

> **For agentic workers:** use superpowers:executing-plans, task by task. Steps use checkboxes. `AGENTS.md` forbids subagents unless the owner asks for them in that request.

**Goal:** Save a tested proof for each of the 196 adhkar, so that only what is new, changed, or unproven is checked again.

**Architecture:** One JSON record for each dhikr in `verification/`. Pure functions in `src/lib/` calculate its status from the record and the content file. A command prints the status, another command imports a page's text, and tests and a git guard enforce the rules.

**Tech stack:** TypeScript, zod, gray-matter, Vitest, Bun. No new dependency.

**Spec:** [`2026-11-25-verification-baseline.md`](2026-11-25-verification-baseline.md), approved with decision 1, option A.

## Global constraints

- Every dhikr is proven, or is in `verification/pending.json`. Nothing stores a status.
- Proven needs dorar.net and Shamela always. hdith.com and sunnah.com are both looked up, and at least one must carry the wording where its collections cover the book.
- Only dorar.net gives a ruling. alukah.net proves nothing alone.
- No content file is edited. A disagreement is a finding for the owner.
- Source text is never retyped. Pages are read one at a time, at least 3 seconds apart. A block is never worked around.
- A download from the browser needs the owner's yes first, with the file name, the site, and the size.
- Code has no comments. No em-dashes. Commits are local, with no push, no deploy, and no `Co-authored-by:` trailer.
- `bun run ci` passes at the end of each task.

## Changes to the spec, found while planning

1. A Quran text is proven by a source with `site: "tanzil"`, so the reason `quran` is not needed. The reasons are `commanded`, `carried`, and `narration`.
2. Each required site must cover the whole text by itself, or name a difference for that site. Two half matches do not make one proof.
3. `main` has an uncommitted `context` field (28 files). It tells the reader a moment, so it belongs to the `moment` claim. The owner commits it, and this branch rebases on it, before Task 4. Otherwise 28 fingerprints expire at the merge.

## Review focus

1. A short phrase («سبحان الله») matches far from its place: phrases must match in order (Task 2).
2. A dhikr with morning and evening markers where only one form is proven: not proven (Task 3).
3. An edit to tashkil only: the `text` claim expires (Task 2).
4. A renamed or deleted dhikr leaves an orphan record: the test fails and names it (Task 4).
5. A page whose text has no-break spaces, Persian letters, or ﷺ between phrases: the import keeps it, and matching ignores the spaces (Tasks 2 and 5).

## Files

| File                                               | Job                                                             |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `src/lib/proof.ts`                                 | The record's schema                                             |
| `src/lib/matching.ts`                              | Normalizing, and finding the phrases in a text                  |
| `src/lib/fingerprint.ts`                           | The fingerprint of each claim                                   |
| `src/lib/verification.ts`                          | The status of a dhikr                                           |
| `src/lib/capture.ts`                               | From a captured page to a source entry                          |
| `src/lib/proofs.test.ts`                           | Every record against its content file                           |
| `scripts/verification/{status,import,pending}.mjs` | The commands                                                    |
| `scripts/verification/capture/<site>.js`           | The script that saves a page's hadith block, run in the browser |
| `scripts/check/pending-list.mjs` and its test      | The git guard                                                   |
| `verification/`                                    | The records and `pending.json`                                  |

Each file in `src/lib/` has its test next to it.

---

### Task 1: Try the saving step

**Files:** `scripts/verification/capture/{dorar,shamela,sunnah}.js`, `src/lib/fixtures/capture-<site>.json`

**Produces:** the capture file `{ site, url, capturedAt, title, text }`, all strings. `capturedAt` is `YYYY-MM-DD`. `text` is the `textContent` of the hadith block, unchanged.

- [ ] Ask the owner for the downloads: one JSON file for each of the three browser sites, under 20 KB each.
- [ ] Open صحيح البخاري ٦٣٠٦ (`sabah-masaa/sayyid-al-istighfar`) on dorar.net, Shamela, and sunnah.com in the owner's browser. Write each capture script, and run it. It saves `wirdy-capture-<site>.json`.
- [ ] Find a hadith page on hdith.com, and read its `.md` with `curl`. Write down how a hadith URL is found from its book and number.
- [ ] Compare each saved text with the page by a character count and a SHA-256 taken in the page. Expected: both equal.
- [ ] **Gate:** if a site fails, stop and tell the owner. Otherwise commit `chore: capture scripts for the verification sources`.

### Task 2: Match and fingerprint

**Files:** `src/lib/matching.ts`, `src/lib/fingerprint.ts`, and their tests

**Produces:**

- `normalize(text: string): string`: NFC, without tashkil, Quran marks, tatweel, and punctuation. `ٱ` becomes `ا`. Each run of any white space becomes one space. Hamza stays.
- `phrasesIn(text: string): string[]`: parts between `،`, `.`, and line ends, normalized, with no empty part.
- `missingPhrases(text: string, spans: string[]): string[]`: the phrases that are not found, whole words only, in order, in the joined spans.
- `type Claim = 'text' | 'count' | 'moment' | 'manner' | 'fadl' | 'takhrij'`
- `claimsOf(data: Dhikr): Claim[]`: `text` and `takhrij` always. `count` when `counts` is set or `count > 1`. `moment` when `when` or `context` is set, or the occasion is not `mutlaq`. `manner` when `how` is set. `fadl` when `fadl` is set.
- `fingerprintOf(claim: Claim, data: Dhikr, body: string): string`: the first 16 hex characters of the SHA-256 of sorted-key JSON, without undefined fields. `text`: body (NFC, trimmed), `quran`. `count`: `count`, `counts`. `moment`: `occasion`, `mode`, `when`, `context`. `manner`: `how`. `fadl`: `fadl`. `takhrij`: `takhrij`.
- `wholeFingerprint(data: Dhikr, body: string): string`: the same hash, over the six claim fingerprints.

- [ ] Write the failing tests:

```ts
expect(normalize('لَا إِلَهَ، إِلَّا ٱللَّهُ')).toBe('لا إله إلا الله');
expect(missingPhrases('أَنَّ الحمد', ['إن الحمد'])).toEqual(['أن الحمد']);
expect(missingPhrases('ب، أ', ['أ ب'])).toEqual(['أ']);
expect(missingPhrases('حمد', ['الحمد'])).toEqual(['حمد']);
expect(missingPhrases('أ، ب', ['أ ﷺ ب'])).toEqual([]);
```

- [ ] Add fingerprint tests by name: "expires the text when only tashkil changes", "keeps every fingerprint when order, title, group, form, ayat, or note changes", "expires the count alone when the count changes", "does not change when an optional field is absent".
- [ ] Run `bun run test`. Expected: fails, modules not found. Implement. Run again. Expected: passes. Commit `feat: match and fingerprint a dhikr`.

### Task 3: The record and its status

**Files:** `src/lib/proof.ts`, `src/lib/verification.ts`, and their tests

**Consumes:** Task 2.

**Produces:**

- `proofSchema` (zod strict). `sources`: a discriminated union on `state`.
  - `present`: `site` (`dorar`, `shamela`, `hdith`, `sunnah`, `alukah`, `tanzil`), `url`, `book`, `number`, `date`, `text`, and optional `grader`, `ruling`, `edition`, `volume`, `page`. dorar.net must have `grader` and `ruling`. Shamela must have `edition`, `volume`, and `page`.
  - `absent`: `site` (`hdith` or `sunnah` only), `date`, and `searches` (at least 2).
- `claims`: a partial record from `Claim` to `{ fingerprint, spans: { source: number, text: string }[] }`, with at least one span. `takhrij` may have no span.
- `differences`: `{ site, phrase, reason: 'commanded' | 'carried' | 'narration', shown: { source, text } }[]`
- `rulings`: `{ grader, book, number, ruling, url }[]`
- `type Status = { state: 'proven' | 'changed' | 'unproven'; problems: string[] }`
- `statusOf(data: Dhikr, body: string, proof?: Proof): Status`: `unproven` with no record, `changed` when the only problems are expired fingerprints, `unproven` for any other problem.

- [ ] Write the failing tests, on one small valid record, with one change in each:
  - "is proven when every rule holds"
  - "is changed, and names the claim, when a fingerprint expires"
  - unproven when: a span is not in its source, a claim is missing or extra, dorar.net or Shamela is missing, a required site misses a phrase with no difference, the evening form is not covered, `takhrij.url` is not the dorar.net entry's URL, `book` and `number` differ from `takhrij.source` (digits in either script are equal), or `grader` or `ruling` differs from `takhrij`
  - for a covered book (صحيح البخاري، صحيح مسلم، صحيح أبي داود، صحيح الترمذي، صحيح النسائي، صحيح ابن ماجه، صحيح الأدب المفرد): unproven when hdith.com or sunnah.com has no entry, or when neither covers the text
  - for another book: proven with both `absent`
  - unproven when a claim's only spans are from alukah.net, or `fadl` has a span from a site other than the one that proves the text
  - for a Quran text: Tanzil must cover it, and dorar.net and Shamela need not cover the text but must be present
- [ ] Run `bun run test`. Expected: fails. Implement. Expected: passes. Commit `feat: calculate the status of a dhikr from its record`.

### Task 4: The baseline, the commands, and the guard

**Precondition:** the owner's `context` change is committed on `main`, and this branch is rebased on it.

**Files:** `scripts/verification/{status,pending}.mjs`, `src/lib/proofs.test.ts`, `scripts/check/pending-list.mjs` and its test, `.githooks/pre-commit`, `verification/pending.json`, `package.json`, `AGENTS.md`, `docs/content.md`, `docs/exceptions.md`, `README.md`, `.claude/skills/verifying-a-dhikr/SKILL.md`

**Produces:** `pending.json` as `{ "<occasion>/<slug>": "<wholeFingerprint>" }`, sorted. `bun run verification` prints the three counts, then each dhikr that is not proven with its problems. `bun run verification <id>` prints one.

- [ ] Write the failing tests in `proofs.test.ts`: "has a proof or a pending entry for each dhikr, never both", "keeps no record or pending entry of a dhikr that is gone", "refuses a pending dhikr that changed", "proves each dhikr that has a record and is not pending". A record that is not yet proven may exist only while its dhikr is pending, so work can be saved.
- [ ] Write the guard's failing tests, in the style of `forbidden-terms.test.ts`: passes when `main` has no list, passes when an entry is removed, and refuses a new entry or a new fingerprint.
- [ ] Implement. `pending.mjs` writes the first list once, and refuses to run when the list exists. Run it. Expected: 196 entries.
- [ ] Update the docs. The skill starts with `bun run verification`, and ends each dhikr with a saved record. `AGENTS.md` adds the hard rule: "Never add or refresh an entry in `verification/pending.json`." `exceptions.md` says why the proofs are in git and not in SQLite.
- [ ] Run `bun run ci` and `bun run verification`. Expected: passes, and `0 proven, 0 changed, 196 unproven`. Commit `feat: the verification baseline, with 196 adhkar pending`.

### Task 5: Import a page

**Files:** `src/lib/capture.ts` and its test, `scripts/verification/import.mjs`, `package.json`

**Consumes:** the capture files of Task 1, and `proofSchema`.

**Produces:** `sourceOf(capture: Capture): PresentSource`, which reads `book`, `number`, `grader`, and `ruling` from the captured labels (`المحدث`, `المصدر`, `الصفحة أو الرقم`, `خلاصة حكم المحدث`) and throws when one is missing. `bun run verification:import <id> <file or hdith.com url>` adds the source to the record, replaces one with the same URL, and prints its index.

- [ ] Write the failing tests on the four fixtures: each gives the book and the number 6306, dorar.net gives `البخاري` and `صحيح`, `text` is unchanged character for character, and a capture without a ruling label throws.
- [ ] Run. Expected: fails. Implement. Expected: passes. The `claims` and `differences` are written by hand in the record, and the span test keeps them honest. Commit `feat: import a captured page into a record`.

### Task 6: Prove 5 adhkar

- [ ] Choose one of each: Quran (`nawm/ayat-al-kursi`), Sahih (`sabah-masaa/sayyid-al-istighfar`), al-Albani (`sabah-masaa/bika-asbahna`), both forms (`sabah-masaa/asbahna-wa-asbaha-al-mulk`), and one with `counts`.
- [ ] For each: read the old audit rows as leads, capture the pages, import them, write the claims, and run `bun run verification <id>`. Remove the pending entry when it is proven.
- [ ] Build an Arabic HTML page with the 5 records for the owner. It lists every difference and every finding.
- [ ] **Gate:** the owner reviews them. Measure the time for each, and report it. Commit `content: prove 5 adhkar`.

### Task 7: Prove the rest

- [ ] Go occasion by occasion, and commit after each occasion: `content: prove <occasion>`. Write each record as soon as it is proven.
- [ ] Keep a dhikr that disagrees pending, and list it as a finding. Do not edit it.
- [ ] At the end, draw 15 records at random for the owner's spot-check, and give the findings as numbered decisions on an Arabic HTML page.
- [ ] Expected at the end: `bun run verification` shows 196 proven, less the findings that wait for the owner.
