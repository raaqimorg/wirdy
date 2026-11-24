---
name: verifying-a-dhikr
description: Use when adding, changing, or auditing a dhikr under src/content/adhkar/, or when a Dhikr correction issue arrives. Checks the text, count, time, and ruling against dorar.net in the user's browser.
---

# Verifying a dhikr

`docs/content.md` is the standard. This skill is the procedure. Never write a text, a count, or a ruling from memory.

## Open dorar.net in the user's browser

dorar.net can block scripted requests (`curl`, fetch tools). Use the browser extension (`mcp__claude-in-chrome__*`), in a new tab.

To check many adhkar at once, open one dorar.net page, then fetch the others from inside that tab with the page's own `fetch` (same origin), and parse them with `DOMParser`. On a `/hadith/sharh/<id>` page, the hadith text and its ruling block (الراوي، المحدث، المصدر، الصفحة أو الرقم، خلاصة حكم المحدث) are near the top of the main content. Return a short JSON summary, not the whole page.

## Check each dhikr

For each file:

1. Open its `takhrij.url`. If it is a search page, find the hadith's own `/hadith/sharh/<id>` or `/h/<id>` page, and use that.
2. Compare the body with the hadith text, phrase by phrase. Ignore differences in tashkil that dorar.net leaves out, and report every other difference.
3. Check that the page itself states the occasion and the time: the folder, `mode`, and `when`. A page that proves the text but not the moment is the wrong page, even when another hadith gives that moment. Find the hadith that does, and cite it. Then check the `count`. If the page states none, the `count` is 1.
4. Check the grade: the book is al-Bukhari or Muslim, or the scholar is al-Albani and the ruling is صحيح or حسن. Copy the book, the number, and the ruling into `takhrij`.
5. Search dorar.net for the hadith's first words. If another major grader weakens it, or al-Albani has a second ruling, record it in `note`, with its source.
6. Where the wording differs between narrations, or the takhrij is an al-Albani book rather than the primary collection, check the wording in the books themselves on [Turath](https://app.turath.io) or [al-Maktaba al-Shamela](https://shamela.ws). Open their search pages in the same browser tab. Turath's page never finishes loading, so read it with a script (`document.body.innerText`) after a few seconds.

## Report

Give one line for each dhikr: the file, "ok" or what differs, and the URL you opened. Make no edit that the user did not ask for. Name any page that you could not open, and do not guess its content.
