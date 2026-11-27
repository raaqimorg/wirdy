<h1 align="center">Wirdy <sub dir="rtl">وِردي</sub></h1>

<p align="center" dir="rtl"><b>أذكار اليوم والليلة، مما ثبت عن النبي ﷺ</b></p>
<p align="center">The daily adhkar authentic from the Prophet ﷺ</p>

<p align="center">
  <a href="https://wirdy.site"><img alt="Live site" src="https://img.shields.io/website?url=https%3A%2F%2Fwirdy.site&label=wirdy.site"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
</p>

The adhkar of the morning, the evening, sleep, prayer, and the rest of the day, each with its takhrij linked to [dorar.net](https://dorar.net/hadith). Read it at [wirdy.site](https://wirdy.site).

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

A dhikr is in Sahih al-Bukhari or Sahih Muslim, or al-Albani grades it صحيح or حسن. [`docs/content.md`](docs/content.md) has the full standard.

Found a mistake? [Open a Dhikr correction](https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml).

## Run it locally

You need [Bun](https://bun.sh).

```bash
git clone https://github.com/raaqimorg/wirdy.git
cd wirdy
bun install
bun run dev   # http://localhost:4321
```

## Contributing

Run `bun run ci` before you open a pull request. [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) has the steps, and [`docs/`](docs/README.md) explains the rest.

## License

The code is [MIT](LICENSE). The Quran text is under [Tanzil's terms](NOTICE). IBM Plex Sans Arabic is under the SIL Open Font License 1.1. The KFGQPC faces are the King Fahd Glorious Quran Printing Complex's, used under its license (see `NOTICE`).

Maintained by [Raaqim](https://raaqim.org).
