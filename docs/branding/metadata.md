# Metadata

This doc holds what each page says to search engines and to the apps that preview a link: the title, the description, the card, the breadcrumbs, and the files around them. Read it before you add a page or change a title. `src/layouts/Paper.astro` writes the head of every page, and `src/build.test.ts` checks it.

## Each page

| Page                  | Title                                  | Description                                       | Card        | Breadcrumbs                          | Indexed |
| --------------------- | -------------------------------------- | ------------------------------------------------- | ----------- | ------------------------------------ | ------- |
| `/`                   | `tagline` \| وِردي                      | `description`                                     | Home        | None                                 | Yes     |
| `/<id>/`              | section `title` \| وِردي                | The title, the count, and what the page holds     | The section | وِردي › section `title`               | Yes     |
| `/<id>/<slug>/`       | dhikr title \| section `title` \| وِردي | Its lead, count, virtue, and takhrij              | The dhikr   | وِردي › section `title` › dhikr title | Yes     |
| `/ma-lam-yathbut/`    | ما لم يثبت \| وِردي                     | The count, and why each one stays out             | Home        | وِردي › ما لم يثبت                    | Yes     |
| `/al-tibb-al-nabawi/` | الطب النبوي \| وِردي                    | The count of its hadiths, and what they are about | Home        | وِردي › الطب النبوي                   | Yes     |
| `/bahth/`             | البحث \| وِردي                          | `description`                                     | Home        | None                                 | No      |
| 404                   | الصفحة غير موجودة \| وِردي              | A way back to the sections                        | Home        | None                                 | No      |

The dhikr title is its `title` with its `context` in brackets, as `fullTitle` in `src/lib/title.ts` writes it.

## The head of every page

- `<html lang="ar" dir="rtl">`.
- `<title>`: the topic first, then « | وِردي». No two indexed pages have the same title.
- `description`: one or two sentences in the voice of [Identity](identity.md). A section page keeps its description between 90 and 160 letters.
- `canonical`: the absolute URL of the page, with its trailing slash, on an indexed page only. A page that is not indexed has `<meta name="robots" content="noindex">` and no canonical.
- `og:title`, `twitter:title`, `og:image:alt`, and `twitter:image:alt` are the title. `og:description` and `twitter:description` are the description. `og:url` is the URL of the page.
- `og:image` and `twitter:image` are the absolute URL of the card, with `og:image:width` 2400 and `og:image:height` 1260. `twitter:card` is `summary_large_image`.
- `og:type` is `website`, `og:locale` is `ar_AR`, and `og:site_name` is «وِردي».
- `theme-color` is `paper` in light mode and `paperDark` in dark mode. The theme script changes both when the reader picks a mode.
- The icons and the manifest are linked from every page ([Logo](logo.md#the-icons)).

## Structured data

An indexed page has one JSON-LD graph with:

- `WebSite`, with the `@id` `https://wirdy.site/#website`, the `name`, the `title` as `alternateName`, the `description`, and `inLanguage` `ar`.
- `WebPage`, with the URL, the title as `name`, the description, the card as `primaryImageOfPage`, and `isPartOf` the site.
- `BreadcrumbList`, on every page with breadcrumbs. It starts at «وِردي» (`/`) and ends at the page itself. Each item links to a page that exists.

## The files around the pages

- `sitemap.xml` lists every indexed page, and no other, with no dates.
- `robots.txt` allows every page and points at the sitemap.
- `site.webmanifest`: `name` is `title`, `short_name` is `name`, the colors are `paper`, the icons are 192 and 512 (and 512 maskable), and the shortcuts are the sections by their `title`.
- `public/_headers` keeps the cards of the dhikr and the search index for a year, the icons for a week, and the cards of the home and the sections for a day.
