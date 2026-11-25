<p align="center">
  <img alt="وِردي: أذكار اليوم والليلة، مما ثبت عن النبي ﷺ، ومع كل ذكر تخريجُه" src="public/opengraph.png">
</p>

<p align="center">
  <a href="https://wirdy.site"><img alt="Live site" src="https://img.shields.io/website?url=https%3A%2F%2Fwirdy.site&label=wirdy.site"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-blue.svg"></a>
</p>

The daily adhkar authentic from the Prophet ﷺ, in eight occasions. Each dhikr links to its hadith on [dorar.net](https://dorar.net/hadith).

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/readme_screenshot_home_darkmode.webp">
    <img alt="The home page" src=".github/readme_screenshot_home_lightmode.webp" width="32%">
  </picture>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/readme_screenshot_occasion_darkmode.webp">
    <img alt="The page of an occasion" src=".github/readme_screenshot_occasion_lightmode.webp" width="32%">
  </picture>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/readme_screenshot_dhikr_darkmode.webp">
    <img alt="The page of a dhikr" src=".github/readme_screenshot_dhikr_lightmode.webp" width="32%">
  </picture>
</p>

## What goes in

A dhikr is in Sahih al-Bukhari or Sahih Muslim, or al-Albani grades it صحيح or حسن, with its count and its time. [`docs/content.md`](docs/content.md) has the full standard.

Found a mistake? [Open a Dhikr correction](https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml).

## Development

```bash
bun install
bun run dev   # http://localhost:4321
bun run ci    # before a pull request
```

See [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) and [`docs/`](docs/README.md).

## License

The code is [MIT](LICENSE). The Quran text is under [Tanzil's terms](NOTICE). The fonts are under the SIL Open Font License 1.1.

Maintained by [Raaqim](https://raaqim.org).
