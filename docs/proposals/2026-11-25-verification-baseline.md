# Verification baseline: design

25 November 2026. Branch: `verification-baseline`, from `ed0c5fd`. Status: waiting for the owner's approval. Nothing is built.

## Why

Each time an agent validates the adhkar, it starts again, because no proof is saved where the next agent looks. The last audit (`.claude/audit/ledger.jsonl`, git-ignored) is too weak to import as proof. 123 of its 820 rows have shortened quotes. 32 of the 151 adhkar it covers have no row with their current takhrij link. 45 adhkar have no row. It stays a list of leads.

## Goals

1. A proven dhikr is not checked again until something in it changes.
2. Each proof can be read and tested without a browser.
3. A stopped session loses at most one dhikr.
4. All 196 adhkar end as proven, or as a finding for the owner.

## Not goals

- The site does not change. No page, style, or script reads the proofs.
- `src/content/unproven/` (16 files) and the search for missing adhkar are out of this work.

What would make it a failure: a record that passes when no page was read, or content edited to match a page without the owner's word.

## Approaches

1. One JSON file for each dhikr, in git. **Picked by the owner.** Every change is readable, and the tests are normal. It adds 196 small files.
2. SQLite. Good for queries, but git cannot show what changed, branches conflict, and it is unusual here.
3. Fields in each content file. One place, but the content files become crowded.

## The sources

The owner asked for five. Decision 1 sets what "proven" needs.

| Source     | What it gives                                                 | How it is read                                                             |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| dorar.net  | The ruling, the grader, the book, the number, and the wording | The owner's browser. It blocks scripts.                                    |
| Shamela    | The wording in the books, with edition, volume, and page      | The owner's browser                                                        |
| hdith.com  | The wording and the number in the primary collections         | A script. It publishes plain-text `.md` pages and its robots.txt allows AI |
| sunnah.com | The wording and the number in the main collections            | The owner's browser. It refused a script (403).                            |
| alukah.net | Articles that discuss a hadith. Support and leads only        | Its own search is disallowed in robots.txt, so reach a page by its link    |

- Only dorar.net gives a ruling. Gradings on the other sites are not recorded as rulings, because `docs/content.md` decides by the dorar.net page.
- An alukah.net article never proves a claim alone. It points to a book, and the book is then opened on Shamela.
- Adhkar collections on these sites (sunnah.com's Hisn al-Muslim, hdith.com's «الأذكار والأدعية المأثورة») are leads only.
- By book names, 168 of the 196 takhrij entries name a collection that sunnah.com and hdith.com should carry (Muslim 53, al-Bukhari 42, Abu Dawud 33, al-Tirmidhi 28, al-Nasai 6, Ibn Majah 5, al-Adab al-Mufrad 1). hdith.com's list of books does not show al-Adab al-Mufrad in the part I read. The other 28 name al-Albani's own books. This counts names. It is not a check of pages.
- al-Albani's numbers can differ from a collection's own numbers, so the match is by wording, and the record keeps both.
- A page that is not found is written as `absent`, with the searches tried.
- Pages are read one at a time, at least 3 seconds apart. A block is never worked around.
- When two sources disagree, the record keeps both, and the owner decides.

## The record

`verification/<occasion>/<slug>.json`. The slug has no order, so reordering a page moves nothing.

- `sources`: one entry for each page, with `site`, `url`, `book`, `number`, `date`, and `text`. dorar.net adds `grader` and `ruling`. Shamela adds `edition`, `volume`, and `page`.
- `claims`: one entry for each thing the card states: `text`, `count`, `moment`, `manner`, `fadl`, `takhrij`. Each holds its fingerprint and the spans of a source `text` that prove it. A claim that the dhikr does not make is left out. The count 1 needs no span, because it can mean that the hadith states none.
- `differences`: a phrase that no span covers, with a reason from a closed list: `quran` (checked against Tanzil), `commanded` (the hadith commands it, and another source gives the words), `carried` (the hadith gives one form and says the other is the same), or `narration` (editions or narrations differ). Each names the source that shows it.
- `rulings`: the other rulings found on dorar.net, so a dispute or «تراجع الشيخ» is not searched for again.

## The rules a test enforces

1. No field says "verified". The status is calculated: proven, changed, or pending.
2. Each span is an exact part of the source text it names.
3. Each phrase of the dhikr, in both forms, is in a span of the `text` claim, or is in `differences`. The comparison drops tashkil, tatweel, and punctuation only. Letters must match, including hamza, because «أن» and «إن» can be two narrations.
4. The dorar.net entry's URL, book, number, and ruling match `takhrij`.
5. Each claim's fingerprint matches the dhikr as it is now. Only the claim that changed expires.
6. The fingerprints cover the text, `count`, `counts`, `mode`, `when`, `how`, `fadl`, `occasion`, and `takhrij`. They do not cover `order`, `title`, `group`, `form`, `ayat`, or `note`.
7. Every dhikr is proven, or is in `verification/pending.json` with its fingerprint. A pending dhikr that changes must be proven, and a proven dhikr must leave the list. A git guard refuses a pending entry that `main` does not have.

## How a source's text gets in

The agent does not retype it. For hdith.com, `bun run verification:import <url>` reads the `.md` page. For a site read in the browser, a script in the page saves the hadith block as a file, and the same command imports that file. **This step is tried first**, because the design leans on it. If it fails on a site, stop and tell the owner.

## The limits

- No test can know that a file came from the page. The owner spot-checks 15 records, chosen at random.
- Whether a page proves the moment or the manner is a reader's judgment. The span makes that judgment visible.

## Work order

1. Try the saving step on one page of each site.
2. Build the record schema, the status, the tests, and the `bun run verification` command. Make the first pending list of 196. Update `AGENTS.md`, `docs/content.md`, `docs/exceptions.md`, `README.md`, and the `verifying-a-dhikr` skill in the same step.
3. Prove 5 varied adhkar: one Quran, one Sahih, one al-Albani, one with morning and evening forms, and one with counts. The owner reviews them.
4. Prove the other 191, and save after each. Any dhikr that disagrees goes to the owner as a finding, unedited.

## Left to the builder

File names inside `src/lib/`, the shape of the command's output, and the shape of the import file. Logic goes in `src/lib/`, with a test next to it.

## Decision

1. **What "proven" needs.**
   - A (recommended): dorar.net and Shamela always. hdith.com and sunnah.com are both looked up, and at least one must carry the wording where its collections cover the book. alukah.net only when a point is open. About 750 page reads, and about 200 of them by script.
   - B: dorar.net, Shamela, hdith.com, and sunnah.com all required where covered. Stricter, but one gap in one site holds a dhikr back.
   - C: dorar.net and Shamela only. The others are extra, so they may be skipped. About 400 page reads.
