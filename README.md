<h1 align="center">وِردي 🌻</h1>

<p align="center">The daily adhkar that are authentic from the Prophet ﷺ, in eight occasions, each with its takhrij.</p>

<p align="center">
  <a href="https://wirdy.site"><img alt="Live site" src="https://img.shields.io/website?url=https%3A%2F%2Fwirdy.site&label=wirdy.site"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-blue.svg"></a>
</p>

Wirdy is a small static Arabic site at [wirdy.site](https://wirdy.site). It shows 196 adhkar in eight occasions, with full tashkil. The home page has a card for each occasion, and each occasion has its own page. Each dhikr has its own page too, with a share link and a card. A button copies a dhikr with its count, its moment, and its takhrij. A search field on every page finds a dhikr by its name or its words as you type, with or without diacritics, and finds the entries of «ما لم يثبت» with their rulings. It opens in place: on a phone the bar turns into the field, and on a wide screen the field in the bar grows into a panel. [/bahth/](https://wirdy.site/bahth/) holds the same search as a page. A dhikr shows its count, the moment it is for, and its virtue when the hadith states one. Under each dhikr is its source and ruling, linked to the page of its hadith on [dorar.net](https://dorar.net/hadith). There are no ads, no accounts, and no tracking. No page makes a request to another site.

| Occasion             | Adhkar |
| -------------------- | -----: |
| أذكار الصباح والمساء |     16 |
| أذكار الأذان والمسجد  |     13 |
| أذكار داخل الصلاة     |     36 |
| أذكار أدبار الصلوات  |     20 |
| أذكار النوم          |     18 |
| أذكار الاستيقاظ       |      7 |
| أذكار عامة           |     23 |
| أذكار الأحوال         |     63 |

## What goes in

A dhikr is on the site only when dorar.net shows that one of these is true:

1. It is in Sahih al-Bukhari or Sahih Muslim.
2. al-Albani grades it صحيح or حسن.

The same rule applies to its count and its time. A dhikr that al-Albani grades ضعيف stays out, even when another scholar accepts it. So some well-known adhkar are not here, such as «رضيت بالله ربا» three times in the morning and evening, and «حسبي الله» seven times. The page [«ما لم يثبت»](https://wirdy.site/ma-lam-yathbut/) lists them, each with its ruling. [`docs/content.md`](docs/content.md) is the full standard. `verification/` holds the saved proof of each dhikr that has been checked, with the text of its pages.

The text of the Quran is the Uthmani text from [Tanzil](https://tanzil.net), in the riwayah of Hafs.

## Report a mistake

If a word, a count, or a ruling is wrong, or an authentic dhikr is missing, [open a Dhikr correction](https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml). Give the dorar.net page that shows it.

## Development

Wirdy is an [Astro](https://astro.build) site, and its TypeScript is written with [Effect](https://effect.website). Each dhikr is a Markdown file in `src/content/adhkar/<occasion>/`. The build turns them into a home page, one page for each occasion, one page for each dhikr, and a search page, and [Cloudflare Pages](https://pages.cloudflare.com) serves them. The design follows [Laws of UX](https://lawsofux.com/) by Jon Yablonski, and [`docs/design-system.md`](docs/design-system.md) says how the code holds it.

```bash
bun install      # dependencies, and the git hooks
bun run dev      # http://localhost:4321
bun run ci       # format, lint, types, tests, and the build test
bun run verification  # which adhkar have a saved proof, and what the others lack
```

Each dhikr that changes between the morning and the evening shows both forms: the form for now leads, and the other is muted and struck through. A dhikr for the other time is muted and struck through too. A switch at the top changes the form at once. `?w=s` and `?w=m` in the URL do the same. Without a choice, the page picks the morning from 03:00 to 11:59, and the evening otherwise.

[`docs/README.md`](docs/README.md) is the index of the docs, and [`docs/development.md`](docs/development.md) has every command. [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) covers issues, pull requests, and keeping your email private. [`AGENTS.md`](AGENTS.md) holds the rules for AI agents.

## License

The code is under the [MIT license](LICENSE). The adhkar are the words of the Prophet ﷺ, and belong to no one. The Quran text comes from the [Tanzil Project](https://tanzil.net), under Tanzil's terms, not under MIT: copy it as it is, and do not change it. [`NOTICE`](NOTICE) holds Tanzil's notice.
