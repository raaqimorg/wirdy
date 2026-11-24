# Content

Wirdy shows only the adhkar that are authentic from the Prophet ﷺ, with the fewest words around them. This doc is the standard that every file in `src/content/adhkar/` meets. The content tests check the parts a test can check. A reviewer checks the rest against dorar.net.

## What goes in

A dhikr goes in when dorar.net shows that one of these is true:

1. It is in Sahih al-Bukhari or Sahih Muslim.
2. al-Albani grades it صحيح or حسن.

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
| `salah`       | أذكار أدبار الصلوات  |
| `nawm`        | أذكار النوم          |
| `istiqaz`     | أذكار الاستيقاظ       |
| `mutlaq`      | أذكار مطلقة          |
| `ahwal`       | أذكار الأحوال         |

A dhikr that belongs to two occasions, such as آية الكرسي, has one file in each, with the takhrij of that occasion's hadith.

## The file

The file name is `<order>-<slug>.md`, for example `01-sayyid-al-istighfar.md`. `src/lib/schema.ts` is the full schema.

```markdown
---
occasion: "sabah-masaa"
order: 1
count: 1
mode: "both"
quran: false
takhrij:
  grader: "البخاري"
  source: "صحيح البخاري ٦٣٠٦"
  ruling: "صحيح"
  url: "https://dorar.net/hadith/sharh/9073"
---
اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، ...
```

- `count`: the number that the sound narration states. Use 1 when it states none.
- `mode`: `sabah` or `masaa` for a dhikr that belongs to one of the two times only. Use `both` everywhere else.
- `ayat`: `first` shows only the first آية of each سورة, as for المعوذات or a long سورة, and the card adds the line «تُقرأ إلى آخر السورة» («تُقرأ كل سورة إلى آخرها» for more than one), so the reader reads on to the end. The file keeps the whole text. Use `all`, the default, everywhere else. Only قرآن files may use `first`.
- `when`: a short Arabic cue for the moment, such as «عند الخروج من المنزل». Leave it out when the occasion heading is enough. It names the moment only: not the source, not the virtue. The card shows it as a line just before the text.
- `group`: a short Arabic heading, such as «الطعام». Adhkar in a row with the same `group` show under that heading. Use it for one situation inside an occasion, or for alternatives, such as «صيغ التسبيح، تكفي واحدة منها».
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
- Write قرآن in the Uthmani text from [Tanzil](https://tanzil.net), one آية on each line, with a blank line between سور. Do not add the بسملة, because it is not a counted آية of these سور. Leave out the ۞ rub al-hizb marks: they are page marks, and the page draws ۞ between سور. Use `ayat: "first"` for a long سورة that the reader knows to read whole, such as السجدة and الملك.
- When one hadith gives two texts for two moments, such as on entering and on leaving the mosque, write two files, each with its own `when`.

## How to check a dhikr

1. Open the `takhrij.url` page on dorar.net.
2. Check the text against the hadith on that page, phrase by phrase.
3. Check that the page itself states the occasion, the count, and the time.
4. Check that the book is al-Bukhari or Muslim, or that the scholar is al-Albani and the ruling is صحيح or حسن. Copy the book, the number, and the ruling exactly.
5. Search dorar.net for other rulings on the same hadith. Record a dispute in `note`.

## What did not come in

`src/content/unproven/` holds the well-known adhkar that stay out, shown on the «ما لم يثبت» page, so a reader who misses one knows why. Each file holds the text as people say it, `what` (which part is not established: the whole dhikr, its count, or its time), the al-Albani ruling with its dorar.net page, and `sound` when a sound form of it is on the site. The tests refuse a ruling there that is not one of weakness.
