# Identity

The name, its meaning, the words that present the site, and its voice. Read it before you write a title, a description, a heading, or any sentence that presents the site.

## The name

«وِردي» means "my wird": a portion of dhikr or Quran kept every day, at its time. The site is a Muslim's daily wird, only from what is authentic from the Prophet ﷺ.

- Write «وِردي», with the kasra under the waw, so no one reads «وَردي» (rosy).
- Write Wirdy only where Arabic cannot go: the domain, the repository, file names, and English docs.

## The words

`src/lib/site.ts` holds these. `src/lib/branding.test.ts` checks each against the code.

| Key           | Value                                                                                                | Where it shows                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`        | وِردي                                                                                                 | The bar, the end of every title, the sharing cards, the touch icon          |
| `url`         | https://wirdy.site                                                                                   | `astro.config.ts`, every absolute URL                                       |
| `domain`      | wirdy.site                                                                                           | The sharing cards                                                           |
| `tagline`     | أذكار اليوم والليلة                                                                                  | The title of the home page, and the home sharing card                       |
| `promise`     | لا ذكر هنا إلا ما صح عن النبي ﷺ، بدرجته ومصدره                                                         | The large line of the home page; `more`, from «بدرجته», is in the faint ink |
| `title`       | وِردي: أذكار الصباح والمساء والنوم وأدبار الصلوات                                                     | The installed app (`name` in the manifest), and the site in JSON-LD         |
| `description` | أذكار الصباح والمساء والنوم والصلاة، والطعام والسفر والهم والمرض، مما ثبت عن النبي ﷺ، مع تخريج كل ذكر | The home page, the manifest, and the site in JSON-LD                        |

The `title` and `description` name the most searched occasions, in the searchers' words. The `tagline` and `promise` say what the site is in the fewest words.

## What the site is

- Each dhikr is authentic: in Sahih al-Bukhari or Sahih Muslim, or graded صحيح or حسن by al-Albani ([`content.md`](../content.md)).
- Each dhikr carries its takhrij, linked to dorar.net.
- No ads, no accounts, no tracking. No page requests another site.

Say these plainly where they help the reader. Never claim more.

## The sections

Each section has three names in `src/lib/occasions.ts` ([`design-system.md`](../design-system.md) has the rules):

- `heading`: two words at most, for the top of its page and its card («عند النوم»).
- `title`: with «أذكار», for the browser tab, search engines, the sharing cards, and the breadcrumbs («أذكار النوم»).

Two guides hold sound hadiths to read, not adhkar to say. «الجمعة» holds the sunan of Friday, from its virtue to what is forbidden on it: `heading` «الجمعة», `title` «سنن الجمعة». «الطب النبوي» holds the sound hadiths on treatment and keeping well: `heading` and `title` «الطب النبوي». `GUIDES` in `src/lib/site.ts` holds their pages.

## The voice

- Write Arabic first, with the words of the content: ذكر، أذكار، تخريج، حكم.
- Write short and plain ([`writing.md`](../writing.md)). Say what a thing is, not how good it is.
- Write the words of the interface with no tashkil: labels, buttons, headings, counts, and the line of the home page. Only «وِردي» keeps its kasra. The adhkar, the hadiths, and what their proofs cover (the moment, the virtue) keep the marks of their source, and so does the takhrij line («صحّحه الألباني»), which the sharing cards print. A build test checks the home, 404, and section pages.
- Never state a virtue, a count, or a ruling the takhrij does not prove ([`content.md`](../content.md)).
- The line under a title never states a virtue or a ruling ([`design-system.md`](../design-system.md#components)).
