---
name: verifying-a-dhikr
description: Use when adding, changing, or auditing a dhikr under src/content/adhkar/, or when a Dhikr correction issue arrives. Checks the text, count, time, and ruling against dorar.net in the user's browser.
---

# Verifying a dhikr

`docs/content.md` is the standard, and this skill is the procedure. Never write a text, a count, or a ruling from memory.

## Start with the records

Run `bun run verification`. Check only what it lists, and leave a proven dhikr alone. `docs/content.md`, "The proof", has the record rules.

## Open dorar.net in the user's browser

dorar.net blocks scripted requests (`curl`, fetch tools). Use the browser extension (`mcp__claude-in-chrome__*`) in a new tab.

For many adhkar, open one dorar.net page, fetch the others from that tab with the page's own `fetch` (same origin), and parse them with `DOMParser`. On a `/hadith/sharh/<id>` page, the text and its ruling block (الراوي، المحدث، المصدر، الصفحة أو الرقم، خلاصة حكم المحدث) sit near the top of the main content. Return a short JSON summary, not the page.

## Check each dhikr

1. Open its `takhrij.url`. If it is a search page, find the hadith's own `/hadith/sharh/<id>` or `/h/<id>` page and use that.
2. Compare the body with the hadith, phrase by phrase. Ignore tashkil that dorar.net leaves out, and report every other difference.
3. Check that the page states the occasion and the time: the folder, `mode`, and `when`. A page that proves the text but not the moment is the wrong page, even when another hadith gives the moment: find and cite the one that does. Then check `count`: 1 when the page states none.
4. Check the grade: al-Bukhari or Muslim, or al-Albani with صحيح or حسن. Copy the book, number, and ruling into `takhrij`.
5. Search dorar.net for the hadith's first words. Record in `note`, with its source, another major grader who weakens it or a second al-Albani ruling.
6. Where narrations differ, or the takhrij is an al-Albani book and not the primary collection, check the wording in the books on [Turath](https://app.turath.io) or [al-Maktaba al-Shamela](https://shamela.ws), in the same tab. Turath's page never finishes loading, so read it by script (`document.body.innerText`) after a few seconds.
7. To find a hadith inside one book, use [usul.ai](https://usul.ai). It serves the Turath and Shamela editions, and its API answers `curl`: `https://api.usul.ai/search?q=<book name>` gives the book's `id` and each edition's `id` (`source: "turath"`, `value` is the Shamela book number), and `https://api.usul.ai/search/content?bookId=<id>&versionId=<edition>&q=<words>` gives the text with volume and page. Then open that page on Shamela, the source a proof cites. Its page `index` is not Shamela's page number.

## Save the proof

1. Put one site's paths in `PATHS` of `scripts/verification/capture.js` (never commit that change), and run it in a tab of that site without waiting, because a run over 45 seconds times out. Click the yellow button, which copies the pages as JSON, and write them with `pbpaste > <file>` (`LC_ALL=en_US.UTF-8`). Compare the page's SHA-256 with the file's. Back up the user's clipboard text first and restore it after. Never download: Brave opens a dialog for each file, and the user must not have to press it.
2. Read hdith.com as `.md` pages with `curl`, one every 3 seconds. Its ids are its own: the text opens with two numbers, and the second is the usual one (the first in صحيح مسلم). Guess an id from a known one, and step to it.
3. Run `bun run verification:import` for each page and `bun run verification:claim` for each claim, which cuts its words from the page. `verification:difference` names a phrase a site lacks, `verification:absent` a missing page, and `verification:ruling` keeps another dorar.net ruling. Before `absent`, read hdith.com's full book list (`/encyclopedia/books.md`): an empty search can be a page that did not load. For a Quran text, set Tanzil's text type to Uthmani, capture the ayat titled by place (`2:255`, or `112:1-114:6`), and set the type back. Then run `bun run verification <id>`. Once proven, remove its entry from `verification/pending.json`.
4. Save each record before the next dhikr. Never write a source text by hand, and never edit a dhikr to pass a proof.

## Report

One line per dhikr: the file, "ok" or what differs, and the URL opened. Make no edit the user did not ask for. Name any page you could not open, and never guess its content.
