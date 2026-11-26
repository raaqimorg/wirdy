# Metadata

What each page tells search engines and link previews: the title, the description, the card, the breadcrumbs, and the files around them. Read it before you add a page or change a title. `src/layouts/Paper.astro` writes every head, and `src/build.test.ts` checks it.

## Each page

| Page                         | Title                                  | Description                                           | Card        | Breadcrumbs                          | Indexed |
| ---------------------------- | -------------------------------------- | ----------------------------------------------------- | ----------- | ------------------------------------ | ------- |
| `/`                          | `tagline` \| وِردي                      | `description`                                         | Home        | None                                 | Yes     |
| `/<id>/`                     | section `title` \| وِردي                | The title, the count, and what the page holds         | The section | وِردي › section `title`               | Yes     |
| `/<id>/<slug>/`              | dhikr title \| section `title` \| وِردي | Its lead, its first words, count, virtue, and takhrij | The dhikr   | وِردي › section `title` › dhikr title | Yes     |
| `/ma-lam-yathbut/`           | ما لم يثبت \| وِردي                     | The count, and why each one stays out                 | Home        | وِردي › ما لم يثبت                    | Yes     |
| `/al-tibb-al-nabawi/`        | الطب النبوي \| وِردي                    | The count of its hadiths, and their topics            | Home        | وِردي › الطب النبوي                   | Yes     |
| `/al-tibb-al-nabawi/<slug>/` | hadith title \| الطب النبوي \| وِردي    | Its first words, its narrator, and its takhrij        | Home        | وِردي › الطب النبوي › hadith title    | Yes     |
| `/bahth/`                    | البحث \| وِردي                          | `description`                                         | Home        | None                                 | No      |
| 404                          | الصفحة غير موجودة \| وِردي              | A way back to the sections                            | Home        | None                                 | No      |

The dhikr title is its `title` with its `context` in brackets (`fullTitle` in `src/lib/title.ts`).

A dhikr or hadith description quotes its first words in «», so a search for the words finds the page (`src/lib/description.ts`). The words stop at a clause end near 110 letters, or between words when no clause ends in time, and a cut ends in «…». A قرآن quote keeps whole آيات, as the card does. A dhikr whose phrases each have a count gives them in the count instead.

On a dhikr or hadith page, the line over the title is the way back to its place in its section, in a `<nav>` named «مسار الصفحة». It is the visible trail: the bar's mark leads home, and the title is the page itself, so the name shows once.

## The head of every page

- `<html lang="ar" dir="rtl">`.
- `<title>`: the topic, then « | وِردي». No two indexed pages share a title.
- `description`: one or two sentences in the voice of [Identity](identity.md). A section page keeps it between 90 and 160 letters.
- `canonical`: the page's absolute URL, with its trailing slash, on an indexed page only. An unindexed page has `<meta name="robots" content="noindex">` and no canonical.
- `og:title`, `twitter:title`, `og:image:alt`, and `twitter:image:alt` are the title. `og:description` and `twitter:description` are the description. `og:url` is the page's URL.
- `og:image` and `twitter:image` are the card's absolute URL, with `og:image:width` 2400 and `og:image:height` 1260. `twitter:card` is `summary_large_image`.
- `og:type` is `website`, `og:locale` is `ar_AR`, and `og:site_name` is «وِردي».
- `theme-color` is `paper` in light mode and `paperDark` in dark mode. The theme script changes both when the reader picks a mode.
- Every page links the icons and the manifest ([Logo](logo.md#the-icons)).

## Structured data

An indexed page has one JSON-LD graph with:

- `WebSite`: `@id` `https://wirdy.site/#website`, the `name`, the `title` as `alternateName`, the `description`, and `inLanguage` `ar`.
- `WebPage`: the URL, the title as `name`, the description, the card as `primaryImageOfPage`, and `isPartOf` the site.
- `BreadcrumbList`, on every page with breadcrumbs: from «وِردي» (`/`) to the page itself. Each item links to a real page.

## The files around the pages

- `sitemap.xml` lists every indexed page and no other, with no dates.
- `robots.txt` allows every page and points at the sitemap.
- `site.webmanifest`: `name` is `title`, `short_name` is `name`, the colors are `paper`, the icons are 192 and 512 (and 512 maskable), and the shortcuts are the sections by `title`.
- `public/_headers` caches the dhikr cards and the search index for a year, the icons for a week, and the home and section cards for a day.
