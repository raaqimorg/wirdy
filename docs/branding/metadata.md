# Metadata

What each page tells search engines and link previews: the title, the description, the card, the breadcrumbs, and the files around them. Read it before you add a page or change a title. `src/layouts/Paper.astro` writes every head, and `src/build.test.ts` checks it.

## Each page

| Page               | Title                     | Description                                           | Card        | Breadcrumbs                          | Indexed |
| ------------------ | ------------------------- | ----------------------------------------------------- | ----------- | ------------------------------------ | ------- |
| `/`                | `tagline` \| وِردي         | `description`                                         | Home        | None                                 | Yes     |
| `/<id>/`           | section `title` \| وِردي   | The title, the count, and what the page holds         | The section | وِردي › section `title`               | Yes     |
| `/<id>/<slug>/`    | dhikr `headline` \| وِردي  | Its lead, its first words, count, virtue, and takhrij | The dhikr   | وِردي › section `title` › dhikr title | Yes     |
| `/<guide>/`        | guide `title` \| وِردي     | The count of its hadiths, and their topics            | The section | وِردي › guide `title`                 | Yes     |
| `/<guide>/<slug>/` | hadith `headline` \| وِردي | Its first words, its narrator, and its takhrij        | The hadith  | وِردي › guide `title` › hadith title  | Yes     |
| 404                | الصفحة غير موجودة \| وِردي | A way back to the sections                            | Home        | None                                 | No      |

A dhikr or hadith page stands alone: its title is its `headline`, the words of the dhikr or hadith, with a name only when it is known by one, and never a section, nor a time or place of the site, so a search result or a share shows only what was searched for ([Content](../content.md#the-file)). Adhkar of the same text, such as آية الكرسي in the morning and evening, before sleep, and after the prayer, share one headline, and every one of their pages names the first of them in site order as its `canonical` (`canonicalPathsOf` in `src/lib/permalink.ts`). Only that first page is in the sitemap. `og:url` stays the page itself, so a share opens where it was shared from. The section stays in the breadcrumbs, the banner, and the way back. The dhikr title in the breadcrumbs is its `title` with its `context` in brackets (`fullTitle` in `src/lib/title.ts`).

A dhikr or hadith description quotes its first words in «», so a search for the words finds the page (`src/lib/description.ts`). The words stop at a clause end near 110 letters, or between words when no clause ends in time, and a cut ends in «…». A قرآن quote keeps whole آيات, as the card does, and cuts a single long آية between words. A dhikr whose phrases each have a count gives them in the count instead, with no count for a phrase said once. No description passes 200 characters: when the whole runs longer, the words, or the counted phrases, are cut shorter, and the lead, the virtue, and the takhrij stay whole.

On a dhikr or hadith page, the line over the title is the way back to its place in its section, in a `<nav>` named «مسار الصفحة». It is the visible trail: the bar's mark leads home, and the title is the page itself, so the name shows once.

## The head of every page

- `<html lang="ar" dir="rtl" translate="no">`, and `<meta name="google" content="notranslate">`, so neither Chrome nor Safari offers to translate a page.
- `<title>`: the topic, then « | وِردي». No two indexed pages share a title.
- `description`: one or two sentences in the voice of [Identity](identity.md). A section page keeps it between 90 and 160 letters.
- `canonical`: the page's absolute URL, with its trailing slash, on an indexed page only. An unindexed page has `<meta name="robots" content="noindex">` and no canonical.
- `og:title`, `twitter:title`, `og:image:alt`, and `twitter:image:alt` are the title. `og:description` and `twitter:description` are the description. `og:url` is the page's own URL, even when its canonical is another page.
- `og:image` and `twitter:image` are the card's absolute URL, with `og:image:width` 2400 and `og:image:height` 1260. `twitter:card` is `summary_large_image`, and `twitter:site` is Raaqim's account, `@raaqimorg`.
- `og:type` is `website`, `og:locale` is `ar_AR`, and `og:site_name` is «وِردي».
- `theme-color` is `paper` in light mode and `paperDark` in dark mode. The theme script changes both when the reader picks a mode.
- Every page links the icons and the manifest ([Logo](logo.md#the-icons)), each with `?v=` and `ICON_VERSION` (`src/lib/mark.ts`), a hash of the mark and the touch-icon cream. `_headers` lets Cloudflare and browsers keep an icon for a week, so a changed mark needs a new URL, or the old icon stays.

## Structured data

An indexed page has one JSON-LD graph with:

- `WebSite`: `@id` `https://wirdy.site/#website`, the `name`, the `title` as `alternateName`, the `description`, and `inLanguage` `ar`.
- `WebPage`: the URL, the title as `name`, the description, the card as `primaryImageOfPage`, and `isPartOf` the site.
- `BreadcrumbList`, on every page with breadcrumbs: from «وِردي» (`/`) to the page itself. Each item links to a real page.

## The files around the pages

- `sitemap.xml` lists every indexed page that is its own canonical page, and no other, with no dates.
- `robots.txt` allows every page and points at the sitemap.
- `site.webmanifest`: `name` is `title`, `short_name` is `name`, the colors are `paper`, the icons are 192 and 512 (and 512 maskable), and the shortcuts are the sections by `title`.
- `public/_headers` caches the dhikr cards and the search index for a year, the icons for a week, and the home and section cards for a day.
