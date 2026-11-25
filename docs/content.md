# Content

Wirdy shows only the adhkar that are authentic from the Prophet ﷺ, with the fewest words around them. This doc is the standard that every file in `src/content/adhkar/` meets. The content tests check the parts a test can check. A reviewer checks the rest against dorar.net.

## What goes in

A dhikr goes in when dorar.net shows that one of these is true:

1. It is in Sahih al-Bukhari or Sahih Muslim.
2. al-Albani grades it صحيح or حسن.

A dhikr that a Companion said goes in when the same hadith shows that the Prophet ﷺ heard it and approved it, such as «لقد سأل الله باسمه الأعظم». The approval is in the hadith, not inferred from silence, and the hadith passes the same rule. A Companion's own saying, with no such approval, stays out.

The same rule applies to its count, to its time, and to each phrase of its text. A count, a time, or a phrase that only a weak narration gives stays out, even when the rest of the hadith is sound.

## What stays out

- A dhikr that al-Albani grades ضعيف, ضعيف جدا, منكر, موضوع, or لا أصل له. It stays out even when another scholar accepts it. Examples: «رضيت بالله ربا» three times, «اللهم إني أصبحت أشهدك», «اللهم ما أصبح بي من نعمة», and «حسبي الله» seven times in the morning and evening.
- A count that no sound narration states. Repeating a dhikr is good, but a fixed number needs a sound text. A number that a sound narration states counts, whether it is a command or a description of what the Prophet ﷺ did, such as «وإني لأستغفر الله في اليوم مائة مرة».
- A phrase that al-Albani excludes from a ruling he otherwise accepts. Example: «يحيي ويميت» in the tahlil said 100 times a day.

## When scholars disagree

When al-Albani accepts a dhikr and another major grader weakens it, or al-Albani has two rulings that disagree, the dhikr stays. The `note` field records the dispute with its source. The card does not show it.

When al-Albani states that he changed his ruling (dorar.net shows «تراجع الشيخ»), his later ruling decides, in either direction. Example: the tahlil ten times after Fajr, which he weakened and then accepted, is in; the ten salawat in the morning and evening, which he accepted and then weakened, is out.

## Occasions

Each dhikr belongs to one occasion. The occasion is its folder and its `occasion` field. `src/lib/occasions.ts` holds the order and the Arabic heading of each.

| Folder        | Heading              |
| ------------- | -------------------- |
| `sabah-masaa` | أذكار الصباح والمساء |
| `masjid`      | أذكار الأذان والمسجد  |
| `fi-al-salah` | أذكار داخل الصلاة     |
| `salah`       | أذكار أدبار الصلوات  |
| `nawm`        | أذكار النوم          |
| `istiqaz`     | أذكار الاستيقاظ       |
| `mutlaq`      | أذكار عامة           |
| `ahwal`       | أذكار الأحوال         |

A dhikr that belongs to two occasions, such as آية الكرسي, has one file in each, with the takhrij of that occasion's hadith.

## The order of a page

A reader goes through a page from top to bottom, so `order` follows these rules, in this order:

1. The order that a hadith states. Examples: «تمام المائة» after the tasbih, and «اجعلهن آخر ما تتكلم به» last before sleep.
2. The sequence of the moment. Examples: the adhan, then wudu, then going out, entering, and leaving the mosque.
3. Adhkar of one kind stay together under a `group`. Every dhikr on a page has a `group`, so the page shows its index.

Each group links by a Latin slug, such as `/sabah-masaa/#al-hifz`. A new group needs its slug in `GROUP_SLUGS` (`src/lib/groups.ts`), or the build fails. A slug is lowercase Latin words joined by hyphens, and it never equals the slug of a dhikr on the same page.

Where no hadith states an order, the order is only an arrangement for reading. It is not a sunnah, and the site never says that it is.

## The file

The file name is `<order>-<slug>.md`, for example `01-sayyid-al-istighfar.md`. The slug without the order is the dhikr's permanent id: `nawm/02-ayat-al-kursi.md` has the page `/nawm/ayat-al-kursi/` and the place `/nawm/#ayat-al-kursi`. Changing the order keeps the link. Never rename a slug without a redirect in `public/_redirects`. `src/lib/permalinks.json` lists every link ever published, and the tests refuse a missing one. `src/lib/schema.ts` is the full schema.

```markdown
---
title: "سيد الاستغفار"
occasion: "sabah-masaa"
order: 1
count: 1
mode: "both"
quran: false
takhrij:
  grader: "البخاري"
  source: "صحيح البخاري ٦٣٠٦"
  ruling: "صحيح"
  url: "https://dorar.net/h/1Xe5exzh"
---
اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، ...
```

- `title`: the short Arabic name of the dhikr, for its own page, its link, and its sharing card. Use its known name, such as «سيد الاستغفار», or its first words. The name holds no place or time.
- `context`: where or when the dhikr is said, such as «عند النوم». Add it only when the same name is in more than one place, so each `title` with its `context` is used once. A heading shows the context under the name, smaller and lighter. Plain text (the browser tab, a share, a link, a button label) joins them as «آية الكرسي (عند النوم)» (`fullTitle` in `src/lib/title.ts`). A title that describes its place stays whole, such as «الدعاء بعد الأذان».
- `count`: the number that the sound narration states. Use 1 when it states none.
- `counts`: one number for each phrase, when the narration gives each its own, such as `[33, 33, 34]`. The phrases are the parts of the text between «، ». Leave `count` at 1. The build fails when the numbers and the phrases do not match.
- `mode`: `sabah` or `masaa` for a dhikr that belongs to one of the two times only. Use `both` everywhere else.
- `ayat`: how much of each سورة shows. The file keeps the whole text in every case. Only قرآن files may use `first` or `fold`.
  - `all`, the default, shows every آية.
  - `first` shows only the first آية of each سورة, for سور that the reader knows by heart, such as المعوذات. The card adds the line «تُقرأ إلى آخر السورة» («تُقرأ كل سورة إلى آخرها» for more than one), so the reader reads on to the end.
  - `fold` is for a long سورة. Each سورة shows the whole آيات that fit 250 letters (at least one), then a button, «أكمل القراءة · ٨ آيات», opens the rest in place. It is a `<details>`, with no script, and it reads «طيّ» while open. Copy gives the آيات that show, with the line «وتتمة الآيات في الصفحة». The sharing card shares its 250 letters among the سور, with the same line.
- `when`: a short Arabic cue for the moment, such as «عند الخروج من المنزل». Leave it out when the occasion heading is enough. It names the moment only: not the manner, not the source, not the virtue. The card shows it first, with the count.
- `how`: what the narration says of the manner, such as «يضع يده اليمنى تحت خدّه». The card shows it on its own line, under the moment.
- `group`: a short Arabic heading, such as «الطعام». Adhkar in a row with the same `group` show under that heading. Use it for one situation inside an occasion, or for alternatives. A page whose adhkar all have a group opens with links to its groups.
- `form`: the number of an alternative, from 1. Adhkar of one group with the same `form` are said together, and one form is enough. The page shows them in one card, under «الصيغة الأولى» and so on, with the line «تكفي واحدة منها». Each keeps its own file, link, and page.
- `fadl`: the virtue in the words of the same hadith, short, such as «كفته من كل شيء». The card shows it under the text, muted. Leave it out when the hadith states none. It never brings in a second source.
- `takhrij.grader`: `البخاري`, `مسلم`, or `الألباني`. It names the reason the dhikr is in (see "What goes in"). The tests refuse any other grader, and an al-Albani ruling that is not صحيح or حسن.
- `takhrij.source`: the book and the number as dorar.net shows them (الصفحة أو الرقم), in Arabic numerals.
- `takhrij.ruling`: the ruling as dorar.net shows it (خلاصة حكم المحدث), and the scholar when the book is not al-Bukhari or Muslim.
- `takhrij.url`: the dorar.net page of that hadith and that ruling (`/hadith/sharh/<id>` or `/h/<id>`). Never a search page. The page must state the occasion and the time, not only the text.
- When the hadith commands a dhikr without giving its words, such as «ثم صلّوا عليّ» after the adhan, the takhrij is the command, and `note` names the source of the words.
- `note`: a wording difference, a dispute, or a weak addition that people often say. The card does not show it.

## The text

- Write the text with full tashkil, as the sound narration gives it.
- Mark the words that change between morning and evening as `{{morning|evening}}`, for example `{{أَصْبَحْنَا|أَمْسَيْنَا}}`. Only `sabah-masaa` files with `mode: "both"` use markers.
- Write قرآن in the Uthmani text from [Tanzil](https://tanzil.net), one آية on each line, with a blank line between سور. Do not add the بسملة, because it is not a counted آية of these سور. Download it with Tanzil's «rub el hizb» option off, so it has no ۞, and change nothing else in it (see `NOTICE`). Use `ayat: "fold"` for a long سورة, such as السجدة and الملك.
- When one hadith gives two texts for two moments, such as on entering and on leaving the mosque, write two files, each with its own `when`.

## How to check a dhikr

1. Open the `takhrij.url` page on dorar.net.
2. Check the text against the hadith on that page, phrase by phrase.
3. Check that the page itself states the occasion, the count, and the time.
4. Check that the book is al-Bukhari or Muslim, or that the scholar is al-Albani and the ruling is صحيح or حسن. Copy the book, the number, and the ruling exactly.
5. Search dorar.net for other rulings on the same hadith. Record a dispute in `note`.

## What did not come in

`src/content/unproven/` holds the well-known adhkar that stay out, shown on the «ما لم يثبت» page, so a reader who misses one knows why. They have no share link, no copy button, and no card, so a weak dhikr never travels as an image without its ruling. Each file holds the text as people say it, `what` (which part is not established: the whole dhikr, its count, or its time), the al-Albani ruling with its dorar.net page, and `sound` when a sound form of it is on the site. When `sound` names an occasion, the page links to it. A ruling of one word shows as a badge above the text. The tests refuse a ruling there that is not one of weakness.
