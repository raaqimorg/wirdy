import { Array, Option, Order, Record } from 'effect';
import { OCCASIONS } from '../../src/lib/occasions.ts';
import { FORMATS, THEME_TITLES, type ThemeName } from '../../src/lib/poster.ts';
import { GUIDE_IDS, GUIDES } from '../../src/lib/site.ts';

export type Size = { readonly width: number; readonly height: number };

export type Image = {
  readonly path: string;
  readonly bytes: number;
  readonly size: Option.Option<Size>;
};

export type Shelf = {
  readonly id: string;
  readonly title: string;
  readonly images: ReadonlyArray<Image>;
};

export type Group = {
  readonly id: string;
  readonly title: string;
  readonly shelves: ReadonlyArray<Shelf>;
};

const GROUP_TITLES: Readonly<Record<string, string>> = {
  opengraph: 'بطاقات الأقسام',
  og: 'بطاقات الأذكار والأحاديث',
  posters: 'الملصقات',
  icons: 'الأيقونات',
};

const GROUP_ORDER = ['opengraph', 'og', 'posters'];

const HEADINGS: Readonly<Record<string, string>> = {
  home: 'الرئيسية',
  sabah: 'الصباح',
  masaa: 'المساء',
  ...Object.fromEntries(OCCASIONS.map(({ id, heading }) => [id, heading])),
  ...Object.fromEntries(
    GUIDE_IDS.flatMap((id) => [
      [id, GUIDES[id].heading],
      [GUIDES[id].path.replaceAll('/', ''), GUIDES[id].heading],
    ])
  ),
};

const isTheme = (word: string): word is ThemeName => word in THEME_TITLES;

export const nameOf = (path: string): string =>
  (path.split('/').at(-1) ?? path).replace(/(?:-[0-9a-f]{8})?\.[a-z]+$/u, '');

export const headingOf = (slug: string): Option.Option<string> =>
  Option.fromUndefinedOr(HEADINGS[slug]);

export const imageLabel = (path: string): string => {
  const name = nameOf(path);
  const [format, theme] = name.split('-');
  const title = FORMATS.find((each) => each.name === format)?.title;
  if (title !== undefined && theme !== undefined && isTheme(theme))
    return `${title} · ${THEME_TITLES[theme]}`;
  return Option.getOrElse(headingOf(name), () => name);
};

const groupRank = (id: string): number => {
  const rank = GROUP_ORDER.indexOf(id);
  if (id === 'icons') return GROUP_ORDER.length + 1;
  return rank === -1 ? GROUP_ORDER.length : rank;
};

const SITE_ORDER = Object.keys(HEADINGS);

const siteRank = (slug: string): number => {
  const rank = SITE_ORDER.indexOf(slug);
  return rank === -1 ? SITE_ORDER.length : rank;
};

const bySite = Order.combine(Order.mapInput(Order.Number, siteRank), Order.String);

const byPath = Order.combine(
  Order.mapInput(bySite, (image: Image) => nameOf(image.path)),
  Order.mapInput(Order.String, (image: Image) => image.path)
);

const entriesOf = (
  images: ReadonlyArray<Image>,
  key: (image: Image) => string
): ReadonlyArray<readonly [string, ReadonlyArray<Image>]> =>
  Record.toEntries(Array.groupBy(images, key));

const shelvesOf = (group: string, images: ReadonlyArray<Image>): ReadonlyArray<Shelf> =>
  entriesOf(images, (image) => image.path.split('/').slice(1, -1).join('/'))
    .toSorted(Order.mapInput(bySite, ([folder]) => folder))
    .map(([folder, shelf]) => ({
      id: folder === '' ? group : `${group}-${folder.replaceAll('/', '-')}`,
      title: folder === '' ? '' : Option.getOrElse(headingOf(folder), () => folder),
      images: shelf.toSorted(byPath),
    }));

const groupIdOf = (image: Image): string =>
  image.path.includes('/') ? (image.path.split('/')[0] ?? '') : 'icons';

export const groupsOf = (images: ReadonlyArray<Image>): ReadonlyArray<Group> =>
  entriesOf(images, groupIdOf)
    .toSorted(
      Order.combine(
        Order.mapInput(Order.Number, ([id]: readonly [string, unknown]) => groupRank(id)),
        Order.mapInput(Order.String, ([id]: readonly [string, unknown]) => id)
      )
    )
    .map(([id, members]) => ({
      id,
      title: GROUP_TITLES[id] ?? id,
      shelves: shelvesOf(id, members),
    }));

const escape = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const sizeLabel = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${String(Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const countOf = (group: Group): number =>
  group.shelves.reduce((total, shelf) => total + shelf.images.length, 0);

const figure = (image: Image): string => {
  const href = `/images/${image.path}`;
  const box = Option.match(image.size, {
    onNone: () => ({ attributes: ' width="1" height="1"', label: '' }),
    onSome: ({ width, height }) => ({
      attributes: ` width="${String(width)}" height="${String(height)}"`,
      label: ` · ${String(width)}×${String(height)}`,
    }),
  });
  return `<figure><a href="${escape(href)}" target="_blank" rel="noopener"><img src="${escape(href)}" alt=""${box.attributes} loading="lazy" decoding="async"></a><figcaption><span>${escape(imageLabel(image.path))}</span><small dir="ltr">${escape(nameOf(image.path))}${box.label} · ${sizeLabel(image.bytes)}</small></figcaption></figure>`;
};

const shelfHtml = (group: Group, shelf: Shelf): string => {
  const heading =
    shelf.title === ''
      ? ''
      : `<h3 id="${escape(shelf.id)}">${escape(shelf.title)} <small>${String(shelf.images.length)}</small></h3>`;
  return `<section class="shelf shelf--${escape(group.id)}">${heading}<div class="grid">${shelf.images.map((image) => figure(image)).join('')}</div></section>`;
};

const shelfLinks = (group: Group): string => {
  const named = group.shelves.filter((shelf) => shelf.title !== '');
  return named.length === 0
    ? ''
    : `<p class="shelves">${named.map((shelf) => `<a href="#${escape(shelf.id)}">${escape(shelf.title)}</a>`).join('')}</p>`;
};

const groupHtml = (group: Group): string =>
  `<section class="group"><h2 id="${escape(group.id)}">${escape(group.title)} <small>${String(countOf(group))}</small></h2>${shelfLinks(group)}${group.shelves.map((shelf) => shelfHtml(group, shelf)).join('')}</section>`;

const navHtml = (groups: ReadonlyArray<Group>): string =>
  `<nav>${groups
    .map(
      (group) =>
        `<a href="#${escape(group.id)}">${escape(group.title)} <small>${String(countOf(group))}</small></a>`
    )
    .join('')}</nav>`;

const STYLE = `
:root{color-scheme:light dark;--paper:#d6d6cd;--ink:hsl(200 50% 5%);--muted:hsl(200 12% 35%);--line:color-mix(in oklab,var(--ink),transparent 85%)}
@media (prefers-color-scheme:dark){:root{--paper:#060f13;--ink:hsl(55 62% 89%);--muted:hsl(200 14% 57%)}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
header{position:sticky;top:0;z-index:1;background:var(--paper);border-block-end:1px solid var(--line);padding:12px 16px}
header h1{margin:0 0 8px;font-size:20px}
nav{display:flex;flex-wrap:wrap;gap:8px 24px}
nav a,.shelves a{color:inherit}
.shelves{display:flex;flex-wrap:wrap;gap:4px 16px;margin:8px 0 0;font-size:14px}
main{padding:0 16px 64px}
small{color:var(--muted);font-weight:400}
h2{margin:40px 0 0;font-size:24px;scroll-margin-top:96px}
h3{margin:24px 0 8px;font-size:18px;scroll-margin-top:96px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:12px}
.shelf--posters .grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));align-items:end}
.shelf--icons .grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr));align-items:end}
figure{margin:0;display:flex;flex-direction:column;gap:6px}
figure img{display:block;width:100%;height:auto;border:1px solid var(--line);background:repeating-conic-gradient(var(--line) 0 25%,transparent 0 50%) 0 0/16px 16px}
figcaption{display:flex;flex-direction:column;font-size:14px}
figcaption small{font-size:12px;overflow-wrap:anywhere}
`;

export const pageOf = (groups: ReadonlyArray<Group>): string => {
  const total = groups.reduce((sum, group) => sum + countOf(group), 0);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>صور وِردي</title><style>${STYLE}</style></head><body><header><h1>صور وِردي <small>${String(total)}</small></h1>${navHtml(groups)}</header><main>${groups.map((group) => groupHtml(group)).join('')}</main></body></html>`;
};
