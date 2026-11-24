<h1 align="center">وِردي 🌻</h1>

<p align="center">The daily adhkar that are authentic from the Prophet ﷺ, in seven occasions, each with its takhrij.</p>

<p align="center">
  <a href="https://wirdy.site"><img alt="Live site" src="https://img.shields.io/website?url=https%3A%2F%2Fwirdy.site&label=wirdy.site"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-blue.svg"></a>
</p>

Wirdy is a small static Arabic site at [wirdy.site](https://wirdy.site). It shows 103 adhkar in seven occasions, with full tashkil. The home page has a card for each occasion, and each occasion has its own page. A dhikr shows its count, the moment it is for, and its virtue when the hadith states one. Under each dhikr is its source and ruling, linked to the page of its hadith on [dorar.net](https://dorar.net/hadith). There are no ads, no accounts, and no tracking. No page makes a request to another site.

| Occasion             | Adhkar |
| -------------------- | -----: |
| أذكار الصباح والمساء |     16 |
| أذكار الأذان والمسجد  |     11 |
| أذكار أدبار الصلوات  |     20 |
| أذكار النوم          |     15 |
| أذكار الاستيقاظ       |      4 |
| أذكار مطلقة          |     15 |
| أذكار الأحوال         |     22 |

## What goes in

A dhikr is on the site only when dorar.net shows that one of these is true:

1. It is in Sahih al-Bukhari or Sahih Muslim.
2. al-Albani grades it صحيح or حسن.

The same rule applies to its count and its time. A dhikr that al-Albani grades ضعيف stays out, even when another scholar accepts it. So some well-known adhkar are not here, such as «رضيت بالله ربا» three times in the morning and evening, and «حسبي الله» seven times. The page [«ما لم يثبت»](https://wirdy.site/ma-lam-yathbut/) lists them, each with its ruling. [`docs/content.md`](docs/content.md) is the full standard.

The text of the Quran is the Uthmani text from [Tanzil](https://tanzil.net), in the riwayah of Hafs.

## Report a mistake

If a word, a count, or a ruling is wrong, or an authentic dhikr is missing, [open a Dhikr correction](https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml). Give the dorar.net page that shows it.

## Development

Wirdy is an [Astro](https://astro.build) site. Each dhikr is a Markdown file in `src/content/adhkar/<occasion>/`. The build turns them into a home page and one page for each occasion, and [Cloudflare Pages](https://pages.cloudflare.com) serves them. The design follows [Laws of UX](https://lawsofux.com/) by Jon Yablonski.

```bash
bun install      # dependencies, and the git hooks
bun run dev      # http://localhost:4321
bun run ci       # format, lint, types, tests, and the build test
```

Each dhikr that changes between the morning and the evening shows both forms: the form for now leads, and the other is muted and struck through. `?w=s` and `?w=m` in the URL lead with the morning or the evening form. Without them, the page picks the morning before noon and the evening after.

[`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) covers issues, pull requests, and keeping your email private. [`AGENTS.md`](AGENTS.md) holds the rules for AI agents.

## License

The code is under the [MIT license](LICENSE). The adhkar are the words of the Prophet ﷺ, and belong to no one. The Quran text comes from the [Tanzil Project](https://tanzil.net), under Tanzil's terms, not under MIT: copy it as it is, and do not change it. [`NOTICE`](NOTICE) holds Tanzil's notice.
