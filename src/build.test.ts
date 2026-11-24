import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OCCASIONS, OCCASION_IDS } from './lib/occasions';
import { adhkarLabel } from './lib/arabic';

let html = '';
let notFound = '';
let pages: Record<string, string> = {};
let all = '';
let css = '';

const DIST = join(process.cwd(), 'dist');
const ADHKAR = join(process.cwd(), 'src/content/adhkar');
const contentFiles = readdirSync(ADHKAR, { recursive: true, encoding: 'utf8' }).filter((f) =>
  f.endsWith('.md')
);
const expected = contentFiles.length;

const countOf = (id: string) => contentFiles.filter((f) => f.startsWith(`${id}/`)).length;
const graphOf = (page: string) =>
  JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]!)[
    '@graph'
  ] as { '@type': string; [key: string]: unknown }[];
const metaOf = (page: string, attr: string, name: string) =>
  page.match(new RegExp(`<meta ${attr}="${name.replace(/[:+]/g, '\\$&')}" content="([^"]*)"`))?.[1];
const pngSize = (file: string) => {
  const png = readFileSync(join(DIST, file));
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

const petals = (text: string) =>
  (text.match(/<circle cx="[\d.]+" cy="[\d.]+" r="6\.4"/g) || []).map((c) =>
    c.replace(/\s+/g, ' ')
  );

beforeAll(() => {
  execSync('bun run build', { stdio: 'inherit' });
  html = readFileSync(join(DIST, 'index.html'), 'utf8');
  pages = Object.fromEntries(
    OCCASION_IDS.map((id) => [id, readFileSync(join(DIST, id, 'index.html'), 'utf8')])
  );
  all = [html, ...Object.values(pages)].join('\n');
  notFound = existsSync(join(DIST, '404.html')) ? readFileSync(join(DIST, '404.html'), 'utf8') : '';
  css = readdirSync(join(DIST, '_astro'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(DIST, '_astro', f), 'utf8'))
    .join('\n');
});

describe('built site', () => {
  it('is right-to-left Arabic on every page', () => {
    for (const page of [html, ...Object.values(pages)]) {
      expect(page).toContain('lang="ar"');
      expect(page).toContain('dir="rtl"');
    }
  });

  it('opens with a card for each occasion page, and one for what did not come in', () => {
    for (const id of OCCASION_IDS) {
      expect(html).toContain(`<a class="card o-${id}" href="/${id}/"`);
    }
    expect(html).toContain('<a class="card o-unproven" href="/ma-lam-yathbut/"');
    expect(html.match(/class="card /g)).toHaveLength(OCCASION_IDS.length + 1);
  });

  it('gives each occasion its own page with one heading and a way back', () => {
    for (const id of OCCASION_IDS) {
      const page = pages[id]!;
      expect(page.match(/<h1>/g)).toHaveLength(1);
      expect(page).toMatch(/<nav class="bar" aria-label="الرجوع"><a href="\/">/);
      expect(page.match(/class="card /g)).toHaveLength(OCCASION_IDS.length - 1);
      expect(page).not.toContain(`<a class="card o-${id}"`);
    }
  });

  it('ships both wird variants, each with the other form struck', () => {
    const page = pages['sabah-masaa']!;
    expect(page).toContain('class="v-s"');
    expect(page).toContain('class="v-m"');
    expect(page).toMatch(/<span class="alt" aria-hidden="true">/);
  });

  it('inlines the wird script, and switches to the evening at noon', () => {
    expect(html).toMatch(/<script>[\s\S]*?dataset\.wird[\s\S]*?<\/script>/);
    expect(html).toContain('hour >= 3 && hour < 12');
  });

  it('listens for touches, passively, so iOS Safari shows the press state', () => {
    expect(html).toMatch(
      /<script>[\s\S]*?addEventListener\("touchstart", function \(\) \{\}, \{ passive: true \}\)[\s\S]*?<\/script>/
    );
  });

  it('applies a saved theme before the first paint, and hides the button without script', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.getItem\("theme"\)[\s\S]*?<\/script>/);
    expect(head).toContain(
      '<noscript><style>.theme, .wird-now { display: none; }</style></noscript>'
    );
  });

  it('forgets a saved theme once it matches the device again, and says whether dark is on', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.removeItem\("theme"\)[\s\S]*?<\/script>/);
    expect(head).toMatch(/<script>[\s\S]*?setAttribute\("aria-pressed"[\s\S]*?<\/script>/);
  });

  it('puts the theme button at the top of every page', () => {
    for (const page of [html, ...Object.values(pages), notFound]) {
      const top = page.match(/<(header class="top"|nav class="bar")[\s\S]*?<\/(header|nav)>/)![0];
      expect(top).toContain(
        '<button class="tool theme" type="button" aria-label="الوضع الداكن" aria-pressed="false">'
      );
    }
  });

  it('keeps the GitHub link on the home and 404 pages, and out of the reading bar', () => {
    const github =
      '<a class="tool" href="https://github.com/raaqimorg/wirdy" rel="noopener" aria-label="الشيفرة على GitHub">';
    for (const page of [html, notFound]) {
      expect(page.match(/<header class="top">[\s\S]*?<\/header>/)![0]).toContain(github);
    }
    for (const page of Object.values(pages)) {
      expect(page).not.toContain(github);
    }
  });

  it('names the occasion in the bar, and makes the bar mark a link home', () => {
    for (const { id, heading } of OCCASIONS) {
      const bar = pages[id]!.match(/<nav class="bar"[\s\S]*?<\/nav>/)![0];
      expect(bar).toContain(`<span class="bar__title" aria-hidden="true">${heading}</span>`);
      expect(bar).toMatch(
        /<a class="tool" href="\/" aria-label="وِردي، الرئيسية"><span class="tool__face bar__mark"><svg class="mark"/
      );
    }
  });

  it('names the leading form of the morning and evening, with a link to the other', () => {
    const line = pages['sabah-masaa']!.match(/<p class="wird-now">[\s\S]*?<\/p>/)![0];
    const text = line
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ');
    expect(text).toContain('تُعرض صيغة الصباح · اعرض صيغة المساء');
    expect(text).toContain('تُعرض صيغة المساء · اعرض صيغة الصباح');
    expect(line).toMatch(/<a href="\?w=m">اعرض( |&nbsp;)صيغة( |&nbsp;)المساء<\/a>/);
    expect(line).toMatch(/<a href="\?w=s">اعرض( |&nbsp;)صيغة( |&nbsp;)الصباح<\/a>/);
  });

  it('names no form on a page whose adhkar have one form', () => {
    for (const id of OCCASION_IDS.filter((other) => other !== 'sabah-masaa')) {
      expect(pages[id]).not.toContain('class="wird-now"');
    }
  });

  it('writes no takhrij with a middle dot', () => {
    const values = all.match(/<span class="source__value">[^<]*<\/span>/g) ?? [];
    expect(values.length).toBe(expected);
    for (const value of values) expect(value).not.toContain('·');
  });

  it('keeps the Tanzil notice in the repository', () => {
    const notice = readFileSync(join(process.cwd(), 'NOTICE'), 'utf8');
    expect(notice).toContain('Copyright (C) 2007-2021 Tanzil Project');
    expect(notice).toContain('CHANGING IT IS NOT ALLOWED');
  });

  it('ends every footer with the dedication', () => {
    for (const page of [html, ...Object.values(pages), notFound]) {
      const footer = page.match(/<footer class="page-footer">([\s\S]*?)<\/footer>/)![1]!;
      expect(footer.trim()).toMatch(
        /<p class="page-footer__dedication">صدقة جارية عن شروق، تقبّلها الله<\/p>$/
      );
    }
  });

  it('leaves no unparsed variant markers', () => {
    expect(all).not.toContain('{{');
  });

  it('keeps the word space where a link interrupts a footer sentence', () => {
    const footer = html.match(/<footer class="page-footer">([\s\S]*?)<\/footer>/)![1]!;
    const text = footer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    expect(text).toContain('من الموسوعة الحديثية في');
    expect(text).toContain('من مشروع تنزيل');
    expect(text).toContain('مستوحى من Laws of UX. وجدت');
  });

  it('renders every ذكر in the collection once', () => {
    const items =
      Object.values(pages)
        .join('')
        .match(/<li class="item[ "]/g) || [];
    expect(items.length).toBe(expected);
  });

  it('links every ذكر to a dorar.net hadith page', () => {
    const links =
      Object.values(pages)
        .join('')
        .match(/href="https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+"/g) || [];
    expect(links.length).toBe(expected);
  });

  it('declares one canonical URL per page, matching og:url', () => {
    const urls = { '': html, ...pages };
    for (const [id, page] of Object.entries(urls)) {
      const url = `https://wirdy.site/${id ? `${id}/` : ''}`;
      expect(page.match(/rel="canonical"/g)).toHaveLength(1);
      expect(page).toContain(`<link rel="canonical" href="${url}"`);
      expect(page).toContain(`<meta property="og:url" content="${url}"`);
    }
  });

  it('gives each page its own title', () => {
    const titles = [html, ...Object.values(pages)].map(
      (page) => page.match(/<title>([^<]+)<\/title>/)![1]
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(pages['nawm']).toContain('<title>أذكار النوم | وِردي</title>');
  });

  it('names the home page by its topic first and the brand last', () => {
    expect(html).toContain('<title>أذكار اليوم والليلة | وِردي</title>');
  });

  it('describes each occasion page with its count, in a snippet that fits the results page', () => {
    for (const { id, heading } of OCCASIONS) {
      const description = metaOf(pages[id]!, 'name', 'description')!;
      expect(description.startsWith(`${heading}: ${adhkarLabel(countOf(id))} `)).toBe(true);
      expect(description.length).toBeGreaterThanOrEqual(90);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(metaOf(pages[id]!, 'property', 'og:description')).toBe(description);
    }
  });

  it('points the opengraph card at an absolute image that is actually shipped', () => {
    expect(html).toMatch(
      /<meta property="og:image" content="https:\/\/wirdy\.site\/opengraph\.png"/
    );
    expect(existsSync(join(DIST, 'opengraph.png'))).toBe(true);
  });

  it('gives each occasion page its own card, the same size as the home card', () => {
    for (const id of OCCASION_IDS) {
      const url = `https://wirdy.site/opengraph-${id}.png`;
      expect(metaOf(pages[id]!, 'property', 'og:image')).toBe(url);
      expect(metaOf(pages[id]!, 'name', 'twitter:image')).toBe(url);
      expect(pngSize(`opengraph-${id}.png`)).toEqual([2400, 1260]);
    }
  });

  it('keeps the card at 2x the platform minimum so it stays sharp on retina', () => {
    const png = readFileSync(join(DIST, 'opengraph.png'));
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect([width, height]).toEqual([2400, 1260]);
    expect(width / height).toBeCloseTo(1200 / 630, 3);
    expect(html).toMatch(new RegExp(`<meta property="og:image:width" content="${width}"`));
    expect(html).toMatch(new RegExp(`<meta property="og:image:height" content="${height}"`));
  });

  it('declares a raster favicon and a touch icon, and ships every icon it declares', () => {
    expect(html).toMatch(/<link rel="icon" href="\/favicon\.ico" sizes="any"/);
    expect(html).toMatch(/<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"/);
    expect(html).toMatch(
      /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32x32\.png"/
    );
    expect(html).toMatch(
      /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png"/
    );
    expect(html).toMatch(/<meta name="apple-mobile-web-app-title" content="وِردي"/);
    for (const icon of [
      'favicon.ico',
      'favicon.svg',
      'favicon-32x32.png',
      'apple-touch-icon.png',
    ]) {
      expect(existsSync(join(DIST, icon))).toBe(true);
    }
  });

  it('packs favicon.ico at the sizes search engines downscale from', () => {
    const ico = readFileSync(join(DIST, 'favicon.ico'));
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    expect(Array.from({ length: count }, (_, i) => ico.readUInt8(6 + i * 16))).toEqual([
      16, 32, 48,
    ]);
  });

  it('keeps the touch icon opaque so iOS does not composite it on black', () => {
    const png = readFileSync(join(DIST, 'apple-touch-icon.png'));
    expect(png.readUInt8(25)).toBe(2);
  });

  it('draws the header mark from the same petals as the favicon', () => {
    const svg = readFileSync(join(DIST, 'favicon.svg'), 'utf8');
    const mark = html.match(/<svg class="mark"[\s\S]*?<\/svg>/)![0];
    expect(petals(mark)).toEqual(petals(svg));
    expect(petals(svg)).toHaveLength(12);
  });

  it('paints the mobile toolbar with the same paper the page uses, in both schemes', () => {
    expect(html).toMatch(
      /<meta name="theme-color" media="\(prefers-color-scheme: dark\)" content="#060f13"/
    );
    expect(html).toMatch(/<meta name="theme-color" content="#d6d6cd"/);
    const source = readFileSync(join(process.cwd(), 'src/styles/paper.css'), 'utf8');
    expect(source).toContain('--paper: #d6d6cd');
    expect(source).toContain('--paper: #060f13');
  });

  it('describes each page to search engines with structured data that matches the head', () => {
    for (const page of [html, ...Object.values(pages)]) {
      const block = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const graph = JSON.parse(block![1]!)['@graph'];
      const website = graph.find((node: { '@type': string }) => node['@type'] === 'WebSite');
      const webpage = graph.find((node: { '@type': string }) => node['@type'] === 'WebPage');
      expect(website.name).toBe('وِردي');
      expect(website.inLanguage).toBe('ar');
      expect(webpage.url).toBe(page.match(/<link rel="canonical" href="([^"]+)"/)![1]);
      expect(webpage.name).toBe(page.match(/<title>([^<]+)<\/title>/)![1]);
      expect(webpage.primaryImageOfPage.url).toBe(metaOf(page, 'property', 'og:image'));
    }
  });

  it('gives each occasion page a breadcrumb from the home page, and the home page none', () => {
    expect(graphOf(html).some((node) => node['@type'] === 'BreadcrumbList')).toBe(false);
    for (const { id, heading } of OCCASIONS) {
      const crumbs = graphOf(pages[id]!).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(crumbs.itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: 'وِردي', item: 'https://wirdy.site/' },
        { '@type': 'ListItem', position: 2, name: heading, item: `https://wirdy.site/${id}/` },
      ]);
    }
  });

  it('ships a manifest whose name and icons agree with the rest of the head', () => {
    expect(html).toMatch(/<link rel="manifest" href="\/site\.webmanifest"/);
    const manifest = JSON.parse(readFileSync(join(DIST, 'site.webmanifest'), 'utf8'));
    expect(manifest.short_name).toBe(
      html.match(/<meta property="og:site_name" content="([^"]+)"/)![1]
    );
    expect(manifest.dir).toBe('rtl');
    expect(manifest.theme_color).toBe('#d6d6cd');
    for (const icon of manifest.icons) {
      expect(existsSync(join(DIST, icon.src))).toBe(true);
    }
    expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(
      true
    );
  });

  it('gives the installed app a stable id and a shortcut to each occasion', () => {
    const manifest = JSON.parse(readFileSync(join(DIST, 'site.webmanifest'), 'utf8'));
    expect(manifest.id).toBe('/');
    expect(manifest.shortcuts).toEqual(
      OCCASIONS.map(({ id, heading }) => ({ name: heading, url: `/${id}/` }))
    );
  });

  it('ships a sitemap listing the home, every occasion page, and what did not come in', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('<loc>https://wirdy.site/</loc>');
    for (const id of OCCASION_IDS) {
      expect(sitemap).toContain(`<loc>https://wirdy.site/${id}/</loc>`);
    }
    expect(sitemap).toContain('<loc>https://wirdy.site/ma-lam-yathbut/</loc>');
    expect(sitemap.match(/<loc>/g)).toHaveLength(OCCASION_IDS.length + 2 + expected);
  });

  it('lists what did not come in, each with its weak ruling on dorar.net, linked from home and footer', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    const files = readdirSync(join(process.cwd(), 'src/content/unproven')).filter((f) =>
      f.endsWith('.md')
    );
    expect(page.match(/<h1>/g)).toHaveLength(1);
    expect(page.match(/<li class="item is-unproven"/g)).toHaveLength(files.length);
    expect(
      page.match(/href="https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+"/g)
    ).toHaveLength(files.length);
    for (const p of [html, ...Object.values(pages), page]) {
      const footer = p.match(/<footer class="page-footer">([\s\S]*?)<\/footer>/)![1]!;
      expect(footer).toContain('href="/ma-lam-yathbut/"');
    }
  });

  it('gives «ما لم يثبت» the same bar, leads, and ruling sentences as an occasion page', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    const bar = page.match(/<nav class="bar"[\s\S]*?<\/nav>/)![0];
    expect(bar).toContain('<span class="bar__title" aria-hidden="true">ما لم يثبت</span>');
    expect(bar).toContain('<a class="tool" href="/" aria-label="وِردي، الرئيسية">');
    expect(bar).not.toContain('github.com');
    expect(page).not.toContain('item__cue');
    const values = page.match(/<span class="source__value">[^<]*<\/span>/g) ?? [];
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value).not.toContain('·');
    expect(page).toContain('ضعّفه الألباني في ضعيف أبي داود (');
  });

  it('gives each dhikr a page with its own card, breadcrumbs, and a way to its place', () => {
    const slugs = contentFiles.map((f) => f.replace(/\.md$/, '').replace(/\/\d+-/, '/'));
    expect(slugs).toHaveLength(expected);
    const images = new Set<string>();
    for (const slug of slugs) {
      const page = readFileSync(join(DIST, slug, 'index.html'), 'utf8');
      const [occasion, name] = slug.split('/');
      const image = metaOf(page, 'property', 'og:image')!;
      images.add(image);
      expect(existsSync(join(DIST, new URL(image).pathname))).toBe(true);
      expect(pngSize(new URL(image).pathname)).toEqual([1200, 630]);
      expect(metaOf(page, 'property', 'og:image:width')).toBe('1200');
      expect(metaOf(page, 'property', 'og:url')).toBe(`https://wirdy.site/${slug}/`);
      expect(page).toContain(`<link rel="canonical" href="https://wirdy.site/${slug}/">`);
      expect(page.match(/<h1>/g)).toHaveLength(1);
      expect(page).toContain(`href="/${occasion}/#${name}"`);
      const crumbs = graphOf(page).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(crumbs.itemListElement).toHaveLength(3);
      expect(page.match(/<nav class="crumbs"[\s\S]*?<\/nav>/)![0].match(/<li/g)).toHaveLength(3);
      expect(pages[occasion!]).toContain(`id="${name}"`);
    }
    expect(images.size).toBe(expected);
  });

  it('shares nothing from «ما لم يثبت»', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    expect(page).not.toContain('class="share"');
  });

  it('marks the shared dhikr without script, clear of the bar', () => {
    expect(css).toMatch(/\.item:target::?after\{/);
    expect(css).toMatch(/scroll-margin-top:4\.5rem/);
  });

  it('leaves out sitemap dates that would only repeat the build date', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('<lastmod>');
    expect(sitemap).not.toContain('<changefreq>');
  });

  it('ships a 404 page that search engines skip and that leads to every occasion', () => {
    expect(notFound).toContain('lang="ar"');
    expect(notFound).toContain('<title>الصفحة غير موجودة | وِردي</title>');
    expect(notFound).toContain('<meta name="robots" content="noindex">');
    expect(notFound).not.toContain('rel="canonical"');
    expect(notFound).not.toContain('application/ld+json');
    expect(notFound.match(/<h1[ >]/g)).toHaveLength(1);
    for (const id of OCCASION_IDS) {
      expect(notFound).toContain(`<a class="card o-${id}" href="/${id}/"`);
    }
    for (const page of [html, ...Object.values(pages)]) {
      expect(page).not.toContain('name="robots"');
    }
  });

  it('asks browsers to keep to HTTPS for a year', () => {
    const headers = readFileSync(join(DIST, '_headers'), 'utf8');
    expect(headers).toMatch(/^\/\*\n  Strict-Transport-Security: max-age=31536000\n/);
  });

  it('states what goes in, and where to report a mistake, on every page', () => {
    const report = 'https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml';
    for (const page of [html, ...Object.values(pages), notFound]) {
      const footer = page.match(/<footer class="page-footer">([\s\S]*?)<\/footer>/)![1]!;
      const text = footer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
      expect(text).toContain(
        'لا يدخل الموقع إلا ما في صحيحي البخاري ومسلم، أو ما صححه الألباني أو حسّنه، والمشهور الذي لم يثبت في صفحة ما لم يثبت.'
      );
      expect(footer).toContain(`href="${report.replace(/&/g, '&amp;')}"`);
    }
  });

  it('ships a robots.txt that opens the site and points at the sitemap', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://wirdy.site/sitemap.xml');
  });

  it('describes itself in Arabic for the card', () => {
    expect(html).toMatch(/<meta property="og:type" content="website"/);
    expect(html).toMatch(/<meta property="og:locale" content="ar_AR"/);
    expect(html).toMatch(/<meta property="og:title" content="أذكار اليوم والليلة \| وِردي"/);
    expect(html).toMatch(/<meta property="og:description" content="أذكار الصباح والمساء/);
  });

  it('asks for the large twitter card so the image is not cropped to a thumb', () => {
    expect(html).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
    expect(html).toMatch(
      /<meta name="twitter:image" content="https:\/\/wirdy\.site\/opengraph\.png"/
    );
  });

  it('brackets every قرآن card and keeps a face that can draw the brackets', () => {
    const quran = contentFiles.filter((f) =>
      readFileSync(join(ADHKAR, f), 'utf8').includes('quran: true')
    ).length;
    expect(all.match(/class="ayat"/g)?.length).toBeGreaterThanOrEqual(quran);
    expect(css).toMatch(/\.ayat::?before\{[^}]*content:"﴿"/);
    expect(css).toMatch(/\.ayat::?after\{[^}]*content:"﴾"/);
    expect(css).toMatch(/\.ayah-end::?before\{[^}]*content:"۝"/);
    expect(css).not.toContain('۞');
    expect(css).toMatch(/--quran:\s*"Amiri Quran",\s*"Amiri"/);
  });

  it('shows the first آية of each of المعوذات, and no more', () => {
    for (const id of ['sabah-masaa', 'salah', 'nawm']) {
      const cards = pages[id]!.match(/<p class="dhikr__text">[\s\S]*?<\/p>/g) || [];
      const card = cards.find((c) => c.includes('ٱلْفَلَقِ'))!;
      expect(card).toBeDefined();
      expect(card.match(/class="ayat"/g)).toHaveLength(3);
      expect(card.match(/class="ayat-sep"/g)).toHaveLength(2);
      expect(card).not.toContain('ayah-end');
      expect(card).not.toContain('ٱلْوَسْوَاسِ');
    }
  });

  it('keeps آية الكرسي whole', () => {
    const file = readFileSync(join(ADHKAR, 'nawm/02-ayat-al-kursi.md'), 'utf8').trim();
    const ending = file.slice(file.lastIndexOf(' ', file.length - 12) + 1);
    expect(pages['nawm']).toContain(ending);
  });

  it('opens no سورة with the بسملة', () => {
    const suwar = all.match(/<span class="ayat">([\s\S]*?)<\/span>/g) || [];
    expect(suwar.length).toBeGreaterThan(0);
    expect(suwar.filter((s) => s.includes('بِسْمِ'))).toEqual([]);
  });

  it('ships every face from this origin', () => {
    const assets = readdirSync(join(DIST, '_astro'));
    expect(assets.some((f) => /^amiri-quran-arabic-.*\.woff2$/.test(f))).toBe(true);
    expect(assets.some((f) => /^amiri-arabic-.*\.woff2$/.test(f))).toBe(true);
    expect(assets.some((f) => /^ibm-plex-sans-arabic-arabic-.*\.woff2$/.test(f))).toBe(true);
  });

  it('makes no third-party requests', () => {
    const external =
      all.match(
        /(?:src|href)="https?:\/\/(?!(?:dorar\.net|tanzil\.net|wirdy\.site|github\.com)[/"])[^"]+"/g
      ) || [];
    expect(external).toEqual([]);
  });
});
