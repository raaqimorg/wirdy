# Identity

This doc holds the name of the site, what it means, the words that present it, and how it speaks. Read it before you write a title, a description, a heading, or any sentence that presents the site.

## The name

«وِردي» means "my wird". A وِرد is a portion of dhikr or Quran that a person keeps every day, at its time. The site is the daily wird of a Muslim, taken only from what is authentic from the Prophet ﷺ.

- Write it «وِردي», with the kasra under the waw, so no one reads it «وَردي» (rosy).
- In Latin letters it is Wirdy. Use Wirdy only where Arabic cannot go: the domain, the repository, file names, and English docs.

## The words

`src/lib/site.ts` holds these values. `src/lib/branding.test.ts` checks each one against the code.

| Key           | Value                                                                                                                                                          | Where it shows                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `name`        | وِردي                                                                                                                                                           | The bar, the end of every title, the sharing cards, the touch icon    |
| `url`         | https://wirdy.site                                                                                                                                             | `astro.config.ts`, every absolute URL                                 |
| `domain`      | wirdy.site                                                                                                                                                     | The sharing cards                                                     |
| `tagline`     | أذكار اليوم والليلة                                                                                                                                            | The title of the home page                                            |
| `promise`     | أذكار اليوم والليلة، مما ثبت عن النبي ﷺ، ومع كل ذكر تخريجُه                                                                                                     | The large line of the home page, and the home sharing card            |
| `title`       | وِردي: أذكار الصباح والمساء والنوم وأدبار الصلوات                                                                                                               | The installed app (`name` in the manifest), and the site in JSON-LD   |
| `description` | أذكار الصباح والمساء، والأذان والمسجد، والصلاة وأدبارها، والنوم والاستيقاظ، والأحوال، مما ثبت عن النبي ﷺ، بالتشكيل، وتحت كل ذكر تخريجه من الدرر السنية. بلا إعلانات. | The home page, the search page, the manifest, and the site in JSON-LD |

The `title` and the `description` name the occasions that people search for most, in the words they search with. The `tagline` and the `promise` say what the site is in the fewest words.

## What the site is

- Each dhikr on it is authentic: in Sahih al-Bukhari or Sahih Muslim, or graded صحيح or حسن by al-Albani ([`content.md`](../content.md)).
- Each dhikr carries its takhrij, linked to its page on dorar.net.
- It has no ads, no accounts, and no tracking. No page makes a request to another site.

Say these plainly where they help the reader. Never claim more than this.

## The sections

Each section has three names in `src/lib/occasions.ts`. [`design-system.md`](../design-system.md) has the rules for each one.

- `heading`: two words at most, for the top of its page and its card («عند النوم»).
- `title`: with «أذكار», for the browser tab, search engines, the sharing cards, and the breadcrumbs («أذكار النوم»).
- `lede`: three things that are in it, in the order of the page.

«ما لم يثبت» is the page of the well-known adhkar that stay out. Its `heading` is «لم يثبت», and its `title` is «ما لم يثبت». «الطب النبوي» is the page of the sound hadiths on treatment and keeping well. Its `heading` and its `title` are both «الطب النبوي». `src/lib/site.ts` holds both pages.

## The voice

- Write Arabic first. Use the words of the content: ذكر، أذكار، تخريج، حكم.
- Write short and plain, as [`writing.md`](../writing.md) asks. Say what a thing is, not how good it is.
- Never state a virtue, a count, or a ruling that the takhrij does not prove ([`content.md`](../content.md)).
- The line under a title never states a virtue or a ruling ([`design-system.md`](../design-system.md#components)).
