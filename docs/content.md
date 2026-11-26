# Content

The standard every file in `src/content/adhkar/` meets. The content tests check what a test can check. A reviewer checks the rest against dorar.net.

## What goes in

A dhikr goes in when dorar.net, or two other sources that agree, show one of these:

1. It is in Sahih al-Bukhari or Sahih Muslim.
2. al-Albani grades it صحيح or حسن.

A Companion's dhikr goes in only when the same hadith shows that the Prophet ﷺ heard and approved it, such as «لقد سأل الله باسمه الأعظم». The approval is in the hadith, not inferred from silence, and the hadith passes the same rule.

The rule covers the count, the time, and each phrase. A count, time, or phrase that only a weak narration gives stays out, even when the rest of the hadith is sound.

## What stays out

- A dhikr that al-Albani grades ضعيف, ضعيف جدا, منكر, موضوع, or لا أصل له, even when another scholar accepts it. Examples: «رضيت بالله ربا» three times, «اللهم إني أصبحت أشهدك», «اللهم ما أصبح بي من نعمة», and «حسبي الله» seven times morning and evening.
- A count that no sound narration states. A stated number counts, as a command or as what the Prophet ﷺ did, such as «وإني لأستغفر الله في اليوم مائة مرة».
- A phrase that al-Albani excludes from a ruling he otherwise accepts. Example: «يحيي ويميت» in the tahlil said 100 times a day.

## When scholars disagree

When al-Albani accepts a dhikr and another major grader weakens it, or al-Albani has two rulings that disagree, the dhikr stays. `note` records the dispute and its source. The card does not show it.

When al-Albani changed his ruling (dorar.net shows «تراجع الشيخ»), the later ruling decides. Example: the tahlil ten times after Fajr (weakened, then accepted) is in; the ten salawat morning and evening (accepted, then weakened) is out.

## Occasions

Each dhikr belongs to one occasion: its folder and its `occasion` field. `src/lib/occasions.ts` holds the order and the headings.

| Folder        | Heading        |
| ------------- | -------------- |
| `sabah-masaa` | الصباح والمساء |
| `masjid`      | الأذان والمسجد  |
| `fi-al-salah` | أثناء الصلاة    |
| `salah`       | بعد الصلاة      |
| `nawm`        | عند النوم      |
| `istiqaz`     | عند الاستيقاظ   |
| `mutlaq`      | كل وقت         |
| `ahwal`       | أحوال متفرقة   |

A dhikr of two occasions, such as آية الكرسي, has one file in each, with the takhrij of that occasion's hadith.

## The order of a page

`order` follows these rules, in this order:

1. The order a hadith states. Examples: «تمام المائة» after the tasbih, and «اجعلهن آخر ما تتكلم به» last before sleep.
2. The sequence of the moment: the adhan, then wudu, then going out, entering, and leaving the mosque.
3. Adhkar of one kind stay together under a `group`. Every dhikr on a page has a `group`, so the page shows its index.

Each group has a Latin slug, such as `/sabah-masaa/#al-hifz`, in `GROUP_SLUGS` (`src/lib/groups.ts`), or the build fails. A slug is lowercase words joined by hyphens, and never equals a dhikr's slug on the same page.

Where no hadith states an order, the order is for reading only. It is not a sunnah, and the site never says it is.

## The file

The name is `<order>-<slug>.md`, such as `01-sayyid-al-istighfar.md`. The slug is the permanent id: `nawm/02-ayat-al-kursi.md` has the page `/nawm/ayat-al-kursi/` and the place `/nawm/#ayat-al-kursi`. A new order keeps the link. Never rename a slug without a redirect in `public/_redirects`. `src/lib/permalinks.json` lists every published link, and the tests refuse a missing one. `src/lib/schema.ts` is the full schema.

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

- `title`: the short Arabic name, for the page, the link, and the card. Use the known name, such as «سيد الاستغفار», or the first words. It holds no place or time.
- `context`: where or when it is said, such as «عند النوم». Add it only when the name is in more than one place, so each `title` with its `context` is unique. A heading shows it under the name, smaller and lighter. Plain text (the tab, a share, a link, a button label) joins them as «آية الكرسي (عند النوم)» (`fullTitle` in `src/lib/title.ts`). A title that names its place stays whole, such as «الدعاء بعد الأذان».
- `count`: the number the sound narration states, or 1.
- `counts`: one number for each phrase, when the narration gives each its own, such as `[33, 33, 34]`. The phrases are the parts between «، ». Leave `count` at 1. The build fails when numbers and phrases differ.
- `mode`: `sabah` or `masaa` for a dhikr of one time only, `both` otherwise.
- `ayat`: how much of each سورة shows. The file keeps the whole text. Only قرآن files use `first` or `fold`.
  - `all`, the default, shows every آية.
  - `first` shows the first آية of each سورة, for سور the reader knows by heart, such as المعوذات. The card adds «تُقرأ إلى آخر السورة» («تُقرأ كل سورة إلى آخرها» for more than one).
  - `fold` is for a long سورة. Each سورة shows the whole آيات that fit 250 letters (at least one). A button, «أكمل القراءة · ٨ آيات», opens the rest in place: a `<details>`, no script, reading «طيّ» while open. Copy gives the آيات that show, with «وتتمة الآيات في الصفحة». The card shares its 250 letters among the سور, with the same line.
- `when`: a short Arabic cue for the moment, such as «عند الخروج من المنزل». Leave it out when the occasion heading is enough. It names the moment only, not the manner, source, or virtue. The card shows it first, with the count.
- `how`: the manner the narration gives, such as «يضع يده اليمنى تحت خدّه». The card shows it on its own line, under the moment.
- `group`: a short Arabic heading, such as «الطعام». Adhkar in a row with one `group` show under it. Use it for one situation in an occasion, or for alternatives. A page where every dhikr has a group opens with links to its groups.
- `form`: the number of an alternative, from 1. Adhkar of one group and one `form` are said together, and one form is enough. The page shows them in one card, under «الصيغة الأولى» and so on, with «تكفي واحدة منها». Each keeps its own file, link, and page.
- `fadl`: the virtue in the words of the same hadith, short, such as «كفته من كل شيء». The card shows it under the text, muted. Leave it out when the hadith states none. It never brings in a second source.
- `takhrij.grader`: `البخاري`, `مسلم`, or `الألباني`: the reason the dhikr is in. The tests refuse any other grader, and an al-Albani ruling other than صحيح or حسن.
- `takhrij.source`: the book and number as dorar.net shows them (الصفحة أو الرقم), in Arabic numerals.
- `takhrij.ruling`: the ruling as dorar.net shows it (خلاصة حكم المحدث), with the scholar when the book is not al-Bukhari or Muslim.
- `takhrij.url`: the dorar.net page of that hadith and ruling (`/hadith/sharh/<id>` or `/h/<id>`), never a search page. The page states the occasion and the time, not only the text.
- When the hadith commands a dhikr without its words, such as «ثم صلّوا عليّ» after the adhan, the takhrij is the command, and `note` names the source of the words.
- `note`: a wording difference, a dispute, or a common weak addition. The card does not show it.

## The text

- Write full tashkil, as the sound narration gives it.
- Mark the words that change between morning and evening as `{{morning|evening}}`, such as `{{أَصْبَحْنَا|أَمْسَيْنَا}}`. Only `sabah-masaa` files with `mode: "both"` use markers.
- Write قرآن in Tanzil's Uthmani text ([tanzil.net](https://tanzil.net)), one آية on each line, a blank line between سور. Leave out the بسملة: it is not a counted آية of these سور. Download with «rub el hizb» off, so there is no ۞, and change nothing else (see `NOTICE`). Use `ayat: "fold"` for a long سورة, such as السجدة and الملك.
- When one hadith gives two texts for two moments, such as entering and leaving the mosque, write two files, each with its own `when`.

## How to check a dhikr

1. Open the `takhrij.url` page on dorar.net.
2. Check the text against its hadith, phrase by phrase.
3. Check that the page states the occasion, the count, and the time.
4. Check that the book is al-Bukhari or Muslim, or the scholar is al-Albani with صحيح or حسن. Copy the book, number, and ruling exactly.
5. Search dorar.net for other rulings on the hadith. Record a dispute in `note`.

## The proof

`verification/<occasion>/<slug>.json` holds a dhikr's proof, so a checked dhikr is not checked again. `bun run verification` computes each status. No field says a dhikr is proven.

- `sources`: each page read, with its text as the page gave it. Only dorar.net gives a ruling. Shamela gives the wording in the books. hdith.com and sunnah.com give the wording in the primary collections. Tanzil gives the Quran. alukah.net proves nothing alone. usul.ai searches inside one book of the Turath and Shamela editions, so it finds a hadith's Shamela page, but its text is Shamela's, and it proves nothing alone.
- A dhikr needs dorar.net and Shamela. Look up hdith.com and sunnah.com, and where they have the book, at least one carries the text. A page not found is `absent`, with the searches tried.
- `claims`: what the card states (`text`, `count`, `moment`, `manner`, `fadl`, `takhrij`), each with the exact words of a source. The count, moment, and fadl are in the cited dorar.net page.
- `differences`: a phrase a source lacks, with the reason. `commanded`: the hadith commands it, and another source gives the words. `carried`: the hadith gives one form and says the other is the same. `narration`: editions or narrations differ. `reported`: the hadith reports he said it, and another source gives the words. A Quran text, and a `commanded` or `reported` text, needs words of its own hadith on each Shamela, hdith.com, and sunnah.com page, so a page of another hadith never passes. Every one of those pages holds words the proof cites. When two sources disagree on a ruling or a wording, ask the owner.
- `rulings`: the other rulings on dorar.net.

A proof ends when what it proves changes. A change of order, title, group, form, ayat, or note ends nothing. `verification/pending.json` lists the adhkar not proven yet. It only shrinks: the tests refuse a dhikr that is neither proven nor pending, and a pending dhikr that changes.

## الطب النبوي

`src/content/tibb/` holds the hadiths of الطب النبوي: what the Prophet ﷺ said and did about treatment, healing, and keeping well (honey, black seed, Zamzam, ajwa dates, cupping, fever, ruqyah, contagion, eating and drinking). They show on one page, `/al-tibb-al-nabawi/`, under a heading for each `group`. Each also has a page of its own, `/al-tibb-al-nabawi/<slug>/`, with its place on the list (`/al-tibb-al-nabawi/#<slug>`), and the previous and next hadith. Its link is permanent like a dhikr's, and is in `src/lib/permalinks.json`. They are hadiths to read, not adhkar to say: no count, moment, copy button, or card of their own.

- The same rule lets a hadith in. The tests refuse a ruling of weakness.
- `title`: a short name, such as «الحبة السوداء». `rawi`: the narrating Companion, in the genitive, since the card reads «عن أبي هريرة». `group`: its heading, with a slug in `GROUP_SLUGS`.
- The body is the matn as the book gives it, cut from the page by script, from where the Companion's words start. Never shorten or join it by hand.
- A hadith of only his ﷺ words has them alone, with no quotation marks, like a dhikr. A narration (an exchange, an act, or a narrator's gloss) keeps «» around his words, so the reader sees where they start.
- The groups run from the principles of treatment, to keeping well and contagion, to the remedies, to fever and the reward of the sick, to ruqyah. In a group, the general hadith comes before the particular.
- `note` records a dispute over a ruling, with its source.
- `takhrij.url` is the dorar.net page, or one of two other sources that agree, with `takhrij.also` the other. Two sources stand for dorar.net only when they are on two sites and each states the book, the number, and, for al-Albani, his ruling. sunnah.com prints his ruling on Abu Dawud and Mishkat al-Masabih, Shamela in its Sunan editions («[حكم الألباني]»), and usul.ai holds his own books, such as «صحيح وضعيف الجامع الصغير». A usul.ai page counts only for another book than the Shamela page, since both serve the Turath editions. The tests refuse a takhrij without dorar.net and without a second source on another site.
- The adhkar of the sick (over a pain, on a visit) stay in `ahwal`, under «المرض والمصيبة». Do not copy them here.

## What did not come in

`src/content/unproven/` holds the well-known adhkar that stay out, on the «ما لم يثبت» page, so a reader who misses one knows why. They have no share link, copy button, or card, so a weak dhikr never travels as an image without its ruling. Each file holds the text as people say it, `what` (the part not established: the whole dhikr, its count, or its time), the al-Albani ruling with its dorar.net page, and `sound` when a sound form is on the site. When `sound` names an occasion, the page links to it. A one-word ruling shows as a badge above the text. The tests refuse any ruling there but one of weakness.
