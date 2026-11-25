import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { OCCASIONS, OCCASION_IDS } from './lib/occasions';
import { adhkarLabel } from './lib/arabic';
import { PALETTE } from './lib/palette';
import { UNPROVEN } from './lib/site';

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

const cornerOf = (file: string) => {
  const png = readFileSync(file);
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length; at += png.readUInt32BE(at) + 12) {
    if (png.toString('latin1', at + 4, at + 8) !== 'IDAT') continue;
    chunks.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
  }
  return [...inflateSync(Buffer.concat(chunks)).subarray(1, 4)];
};
const unescaped = (text: string) =>
  text
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
const plain = (text: string) => text.replace(/\s+/g, ' ').trim();

const own = (path: string) => readFileSync(join(DIST, path, 'index.html'), 'utf8');
const facesOf = (page: string) =>
  [...page.matchAll(/<link rel="preload" href="\/_astro\/([a-z0-9-]+)-normal\./g)].map(
    ([, name]) => name!
  );

const cardTo = (path: string) => new RegExp(`<a class="occasion-card [^"]*" href="${path}"`);

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
      expect(html).toMatch(cardTo(`/${id}/`));
    }
    expect(html).toMatch(cardTo('/ma-lam-yathbut/'));
    expect(html.match(/class="occasion-card /g)).toHaveLength(OCCASION_IDS.length + 1);
    expect(html.match(/occasion-card--band/g)).toHaveLength(1);
  });

  it('fades one page into the next with nothing moving, and not with reduced motion', () => {
    expect(all + css).not.toContain('view-transition-name');
    const motion = css.match(
      /@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}([^{}]*)\{([^{}]*)\}\}/
    )!;
    expect(motion[1]).toBe(
      '::view-transition-group(root),::view-transition-old(root),::view-transition-new(root)'
    );
    expect(motion[2]).toContain('animation-duration:var(--duration-fade)');
    expect(motion[2]).toContain('animation-timing-function:linear');
    expect(css.match(/@view-transition/g)).toHaveLength(1);
  });

  it('gives a page with a color its tone on the body, over a layer behind its top', () => {
    for (const { id, color } of [...OCCASIONS, { id: 'ma-lam-yathbut', color: UNPROVEN.color }]) {
      expect(own(id)).toMatch(
        new RegExp(`<body class="tone" style="--tone: ${color}"> ?<div class="page">`)
      );
    }
    expect(own('nawm/ayat-al-kursi')).toMatch(
      /<body class="tone" style="--tone: #[0-9a-f]{6}"> ?<div class="page">/
    );
    for (const page of [html, notFound]) {
      expect(page).toContain('<body>');
      expect(page).not.toContain('class="page"');
    }
    expect(css).toMatch(/\.page:{1,2}before\{[^}]*position:fixed/);
  });

  it('gives each occasion its own page with one heading and a way back', () => {
    for (const id of OCCASION_IDS) {
      const page = pages[id]!;
      expect(page.match(/<h1[ >]/g)).toHaveLength(1);
      expect(page).toMatch(/<nav class="bar" aria-label="التنقّل"><a class="bar__back" href="\/">/);
      expect(page.match(/class="occasion-card /g)).toHaveLength(OCCASION_IDS.length - 1);
      expect(page).not.toMatch(cardTo(`/${id}/`));
    }
  });

  it('ships both wird variants, each with the other form struck', () => {
    const page = pages['sabah-masaa']!;
    expect(page).toContain('class="variant-text variant-text--sabah"');
    expect(page).toContain('class="variant-text variant-text--masaa"');
    expect(page).toMatch(/<span class="word-form__other" aria-hidden="true">/);
  });

  it('inlines the wird script, and switches to the evening at noon', () => {
    expect(html).toMatch(/<script>[\s\S]*?dataset\.wird[\s\S]*?<\/script>/);
    expect(html).toContain('hour >= 3 && hour < 12');
  });

  it('switches the form in place, and keeps the choice until the next form is due', () => {
    expect(html).toContain("sessionStorage.setItem('wird', period() + form)");
    expect(html).toContain('saved[0] === period() ? saved[1] : null');
    expect(html).not.toContain('form.hash');
  });

  it('listens for touches, passively, so iOS Safari shows the press state', () => {
    expect(html).toMatch(
      /<script>[\s\S]*?addEventListener\('touchstart', function \(\) \{\}, \{ passive: true \}\)[\s\S]*?<\/script>/
    );
  });

  it('applies a saved theme before the first paint, and hides the buttons without script', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.getItem\('theme'\)[\s\S]*?<\/script>/);
    expect(head).toMatch(
      /<noscript><style>\s*\[data-theme-toggle\],\s*\[data-wird-switch\],\s*\[data-copy\]\s*\{\s*display: none !important;\s*\}\s*<\/style><\/noscript>/
    );
  });

  it('forgets a saved theme once it matches the device again, and says whether dark is on', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.removeItem\('theme'\)[\s\S]*?<\/script>/);
    expect(head).toMatch(/<script>[\s\S]*?setAttribute\('aria-pressed'[\s\S]*?<\/script>/);
  });

  it('puts the theme button at the top of every page', () => {
    for (const page of [html, ...Object.values(pages), notFound]) {
      const top = page.match(
        /<(header class="site-header container"|nav class="bar")[\s\S]*?<\/(header|nav)>/
      )![0];
      expect(top).toMatch(
        /<button class="icon-button icon-button--(panel|glass)" type="button" aria-label="الوضع الداكن" aria-pressed="false" data-theme-toggle/
      );
    }
  });

  it('keeps the GitHub link on the home and 404 pages, and out of the reading bar', () => {
    const github =
      '<a class="icon-button icon-button--panel" href="https://github.com/raaqimorg/wirdy" aria-label="الشيفرة على GitHub" rel="noopener">';
    for (const page of [html, notFound]) {
      expect(page.match(/<header class="site-header container">[\s\S]*?<\/header>/)![0]).toContain(
        github
      );
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
        /<a class="icon-button" href="\/" aria-label="وِردي، الرئيسية"><span class="icon-button__face"><svg class="mark"/
      );
    }
  });

  it('draws the bar mark in the two inks of the emblems, and the home mark in its own', () => {
    const home = html.match(/<svg class="mark"[\s\S]*?<\/svg>/)![0];
    expect(home).toContain(PALETTE.petal);
    for (const page of [...Object.values(pages), own('ma-lam-yathbut')]) {
      const mark = page.match(/<svg class="mark"[\s\S]*?<\/svg>/)![0];
      expect([...new Set([...mark.matchAll(/ fill="([^"]+)"/g)].map(([, ink]) => ink))]).toEqual([
        PALETTE.eggshell,
        PALETTE.shade,
      ]);
    }
  });

  it('switches between the morning and the evening form, and marks the one that shows', () => {
    const page = pages['sabah-masaa']!;
    const group = page.match(/<div class="wird-switch" role="group"[\s\S]*?<\/div>/)![0];
    expect(group).toContain(
      '<a class="wird-switch__option" href="?w=s" data-wird-form="s">الصباح</a>'
    );
    expect(group).toContain(
      '<a class="wird-switch__option" href="?w=m" data-wird-form="m">المساء</a>'
    );
    expect(page).toMatch(/<script>[\s\S]*?setAttribute\('aria-current'[\s\S]*?<\/script>/);
  });

  it('describes what did not come in, without counting it as adhkar', () => {
    const card = html.match(
      /<a class="occasion-card [^"]*" href="\/ma-lam-yathbut\/"[\s\S]*?<\/a>/
    )![0];
    expect(card).toContain('أذكار مشهورة لم تدخل الموقع، مع حكم كل واحد منها');
    expect(card).not.toMatch(/[٠-٩]/);
  });

  it('fades the bar title in on scroll, with the timeline apart from the shorthand', () => {
    expect(css).toContain('animation-timeline:scroll(root)');
    expect(css).not.toMatch(/animation:[^;}]*scroll\(/);
  });

  it('lists the groups of each page', () => {
    for (const id of OCCASION_IDS) {
      const groups = [...pages[id]!.matchAll(/<h2 class="group__title" id="([^"]+)"/g)];
      const jumps = pages[id]!.match(/<nav class="group-index"[\s\S]*?<\/nav>/)![0];
      expect([...jumps.matchAll(/href="#([^"]+)"/g)].map(([, at]) => at)).toEqual(
        groups.map(([, at]) => at)
      );
    }
  });

  it('shows the forms of tasbih as one choice of four, each phrase with its count', () => {
    const page = pages['salah']!;
    expect(page.match(/<li class="choices__item"/g)).toHaveLength(4);
    expect(page).toContain('تكفي واحدة منها');
    const counts = page.match(
      /<span class="badge badge--count">\s*<span aria-hidden="true">[٠-٩]+/g
    )!;
    expect(counts.map((c) => c.match(/[٠-٩]+$/)![0]).join(' ')).toBe(
      '٣٣ ٣٣ ٣٣ ٣٣ ٣٣ ٣٤ ١٠ ١٠ ١٠ ٢٥ ٢٥ ٢٥ ٢٥'
    );
  });

  it('numbers no card', () => {
    expect(css).not.toContain('counter(');
  });

  it('strikes a dhikr of the other time, in a list only', () => {
    const alone = own('sabah-masaa/fitrat-al-islam');
    expect(pages['sabah-masaa']).toContain('entry--masaa');
    expect(alone).not.toContain('entry--masaa');
    expect(css).toMatch(/\.entry--masaa \.entry__text[^{]*\{[^}]*line-through/);
  });

  it('gives each dhikr on an occasion page a heading', () => {
    for (const id of OCCASION_IDS) {
      expect(pages[id]!.match(/<h[234] class="visually-hidden">/g)).toHaveLength(countOf(id));
    }
  });

  it('names no form on a page whose adhkar have one form', () => {
    for (const id of OCCASION_IDS.filter((other) => other !== 'sabah-masaa')) {
      expect(pages[id]).not.toContain('class="wird-switch"');
    }
  });

  it('writes no takhrij with a middle dot', () => {
    const values = all.match(/<a class="takhrij"[^>]*><span>[^<]*<\/span>/g) ?? [];
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
      const footer = page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)![1]!;
      expect(footer.trim()).toMatch(
        /<p class="site-footer__line site-footer__line--dedication">صدقة جارية عن شروق، تقبّلها الله<\/p>$/
      );
    }
  });

  it('leaves no unparsed variant markers', () => {
    expect(all).not.toContain('{{');
  });

  it('says in one line where the adhkar come from, on every page', () => {
    for (const page of [html, ...Object.values(pages), notFound]) {
      const footer = page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)![1]!;
      const text = footer
        .match(/<p class="site-footer__line">([\s\S]*?)<\/p>/)![1]!
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ');
      expect(text.trim()).toBe(
        'من الصحيحين وما صحّحه الألباني أو حسّنه، عن الدرر وتنزيل. أبلغ عن خطأ.'
      );
    }
  });

  it('renders every ذكر in the collection once', () => {
    const items =
      Object.values(pages)
        .join('')
        .match(/<li class="entry[ "]/g) || [];
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
    const source = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    expect(source).toContain('--color-paper: #d6d6cd');
    expect(source).toContain('--color-paper: #060f13');
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

  it('lists what did not come in, each with its weak ruling on dorar.net, linked from home', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    const files = readdirSync(join(process.cwd(), 'src/content/unproven')).filter((f) =>
      f.endsWith('.md')
    );
    expect(page.match(/<h1[ >]/g)).toHaveLength(1);
    expect(page.match(/<li class="entry entry--split entry--unproven"/g)).toHaveLength(
      files.length
    );
    expect(
      page.match(/href="https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+"/g)
    ).toHaveLength(files.length);
    expect(html).toContain('href="/ma-lam-yathbut/"');
  });

  it('gives «ما لم يثبت» the same bar, leads, and ruling sentences as an occasion page', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    const bar = page.match(/<nav class="bar"[\s\S]*?<\/nav>/)![0];
    expect(bar).toContain('<span class="bar__title" aria-hidden="true">ما لم يثبت</span>');
    expect(bar).toContain('<a class="icon-button" href="/" aria-label="وِردي، الرئيسية">');
    expect(bar).not.toContain('github.com');
    const rulings = page.match(/<span class="badge">[^<]+<\/span>/g)!;
    expect(
      rulings.map((r) => r.replace(/<[^>]+>/g, '')).filter((r) => !/^(ضعيف|موضوع)$/.test(r))
    ).toEqual([]);
    expect(page.indexOf('class="badge"')).toBeLessThan(page.indexOf('class="entry__text"'));
    const values = page.match(/<a class="takhrij"[^>]*><span>[^<]*<\/span>/g) ?? [];
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value).not.toContain('·');
    expect(page).toContain('ضعّفه الألباني في ضعيف أبي داود (');
  });

  it('leads from each dhikr to the next and the previous in its occasion', () => {
    const list = contentFiles
      .filter((f) => f.startsWith('nawm/'))
      .toSorted()
      .map((f) => `/${f.replace(/\.md$/, '').replace(/\/\d+-/, '/')}/`);
    list.forEach((path, index) => {
      const page = readFileSync(join(DIST, path, 'index.html'), 'utf8');
      const links = [
        ...page.match(/<nav class="neighbours"[\s\S]*?<\/nav>/)![0].matchAll(/href="([^"]+)"/g),
      ];
      expect(links.map((link) => link[1])).toEqual(
        [list[index + 1], list[index - 1]].filter(Boolean)
      );
    });
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
      expect(page.match(/<h1[ >]/g)).toHaveLength(1);
      expect(page).toContain(`href="/${occasion}/#${name}"`);
      const crumbs = graphOf(page).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(crumbs.itemListElement).toHaveLength(3);
      expect(page).not.toContain('class="crumbs"');
      expect(page).not.toContain('bar__title');
      expect(page.match(/data-share-title=/g)).toHaveLength(1);
      expect(page.match(/ data-copy=/g)).toHaveLength(1);
      expect(page.match(/ data-status/g)).toHaveLength(1);
      expect(page).toMatch(/<a class="button" href="\/og\/[^"]+" download="wirdy-/);
      expect(pages[occasion!]).toMatch(
        new RegExp(
          `<a class="icon-button icon-button--quiet" href="/${slug}/" aria-label="صفحة الذكر: `
        )
      );
      expect(pages[occasion!]).toContain(`id="${name}"`);
    }
    expect(images.size).toBe(expected);
  });

  it('shares and copies nothing from «ما لم يثبت»', () => {
    const page = readFileSync(join(DIST, 'ma-lam-yathbut', 'index.html'), 'utf8');
    expect(page).not.toContain('data-share-title=');
    expect(page).not.toContain('data-copy=');
  });

  it('copies each dhikr as it shows, with its takhrij last', () => {
    for (const id of OCCASION_IDS) {
      const cards = pages[id]!.match(/<li class="entry[ "][\s\S]*?<\/li>/g)!;
      expect(cards).toHaveLength(countOf(id));
      for (const card of cards) {
        const copied = unescaped(card.match(/ data-copy="([^"]*)"/)![1]!);
        const takhrij = card.match(/<a class="takhrij"[^>]*><span>([^<]*)<\/span>/)![1]!;
        expect(copied.split('\n').at(-1)).toBe(unescaped(takhrij));
        const shown = card
          .match(/<p class="entry__text">([\s\S]*?)<\/p>/)![1]!
          .replace(/<span class="badge[\s\S]*?<\/span>\s*<\/span>/g, ' ')
          .replace(
            /<span class="variant-text variant-text--masaa">[\s\S]*?<\/span><\/span><\/span>/g,
            ''
          )
          .replace(/\u00a0<span class="word-form__other"[^>]*>[^<]*<\/span>/g, '')
          .replace(/<span class="surah(__ayah-end)?">/g, ' ');
        const words = copied
          .split('\n\n')
          .slice(0, -1)
          .join(' ')
          .replace(/ \([٠-٩]+ مر(ة|ات)\)$/gm, '');
        expect(plain(words)).toBe(plain(unescaped(shown.replace(/<[^>]+>/g, ''))));
      }
    }
  });

  it('carries the evening form to copy where a dhikr has one, and nowhere else', () => {
    const forms = contentFiles.filter((f) => readFileSync(join(ADHKAR, f), 'utf8').includes('{{'));
    expect(all.match(/ data-copy-masaa="/g)).toHaveLength(forms.length);
  });

  it('draws no card with the red outline of a text that does not fit', () => {
    const cards = readdirSync(join(DIST, 'og'), { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.png')
    );
    expect(cards).toHaveLength(expected);
    expect(cards.filter((f) => cornerOf(join(DIST, 'og', f)).join() === '255,0,0')).toEqual([]);
  });

  it('marks the shared dhikr without script, clear of the bar', () => {
    expect(css).toMatch(/\.entry:target[^{]*\{[^}]*outline:/);
    expect(css).toMatch(/\.entry\{[^}]*scroll-margin-top:var\(--space-16\)/);
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
      expect(notFound).toMatch(cardTo(`/${id}/`));
    }
    for (const page of [html, ...Object.values(pages)]) {
      expect(page).not.toContain('name="robots"');
    }
  });

  it('keeps what is named by its content for a year, and asks for a page again on each visit', () => {
    const headers = readFileSync(join(DIST, '_headers'), 'utf8');
    for (const path of ['/_astro/*', '/og/*']) {
      expect(headers).toContain(`${path}\n  Cache-Control: public, max-age=31536000, immutable\n`);
    }
    expect(headers.match(/^\/\*\n((?:  .*\n)+)/)![1]).not.toContain('Cache-Control');
    for (const file of readdirSync(join(DIST, '_astro'))) {
      expect(file).toMatch(/\.[A-Za-z0-9_-]{8}\.(css|woff2)$/);
    }
  });

  it('preloads the faces a page uses, and no others', () => {
    const ui = [400, 500, 700].map((weight) => `ibm-plex-sans-arabic-arabic-${weight}`);
    const naskh = 'amiri-arabic-400';
    const quran = 'amiri-quran-arabic-400';
    expect(facesOf(html)).toEqual([...ui, naskh]);
    expect(facesOf(notFound)).toEqual(ui);
    expect(facesOf(pages['ahwal']!)).toEqual([...ui, naskh]);
    expect(facesOf(pages['nawm']!)).toEqual([...ui, naskh, quran]);
    expect(facesOf(own('nawm/ayat-al-kursi'))).toEqual([...ui, quran]);
    expect(facesOf(own('ahwal/al-karb'))).toEqual([...ui, naskh]);
  });

  it('keeps short and long pages the same width where a scroll bar takes space', () => {
    expect(css).toContain('scrollbar-gutter:stable');
  });

  it('asks browsers to keep to HTTPS for a year', () => {
    const headers = readFileSync(join(DIST, '_headers'), 'utf8');
    expect(headers).toMatch(/^\/\*\n  Strict-Transport-Security: max-age=31536000\n/);
  });

  it('links its sources and the place to report a mistake, on every page', () => {
    const report = 'https://github.com/raaqimorg/wirdy/issues/new?template=dhikr-correction.yml';
    for (const page of [html, ...Object.values(pages), notFound]) {
      const footer = page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)![1]!;
      for (const href of ['https://dorar.net/hadith', 'https://tanzil.net/', report]) {
        expect(footer).toContain(`href="${href}"`);
      }
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
    expect(all.match(/class="surah"/g)?.length).toBeGreaterThanOrEqual(quran);
    expect(css).toMatch(/\.surah::?before\{[^}]*content:"﴿"/);
    expect(css).toMatch(/\.surah::?after\{[^}]*content:"﴾"/);
    expect(css).toMatch(/\.surah__ayah-end::?before\{[^}]*content:"۝"/);
    expect(css).not.toContain('۞');
    expect(css).toMatch(/--font-quran:\s*"Amiri Quran",\s*"Amiri"/);
  });

  it('shows the first آية of each of المعوذات, and no more', () => {
    for (const id of ['sabah-masaa', 'salah', 'nawm']) {
      const cards = pages[id]!.match(/<p class="entry__text">[\s\S]*?<\/p>/g) || [];
      const card = cards.find((c) => c.includes('ٱلْفَلَقِ'))!;
      expect(card).toBeDefined();
      expect(card.match(/class="surah"/g)).toHaveLength(3);
      expect(card).not.toContain('surah__ayah-end');
      expect(card).not.toContain('ٱلْوَسْوَاسِ');
    }
  });

  it('keeps آية الكرسي whole', () => {
    const file = readFileSync(join(ADHKAR, 'nawm/04-ayat-al-kursi.md'), 'utf8').trim();
    const ending = file.slice(file.lastIndexOf(' ', file.length - 12) + 1);
    expect(pages['nawm']).toContain(ending);
  });

  it('opens no سورة with the بسملة', () => {
    const suwar = all.match(/<span class="surah">([\s\S]*?)<\/span>/g) || [];
    expect(suwar.length).toBeGreaterThan(0);
    expect(suwar.filter((s) => s.includes('بِسْمِ'))).toEqual([]);
  });

  it('ships every face from this origin, once', () => {
    const fonts = readdirSync(join(DIST, '_astro')).filter((f) => !f.endsWith('.css'));
    expect(fonts).toHaveLength(5);
    expect(fonts.some((f) => /^amiri-quran-arabic-.*\.woff2$/.test(f))).toBe(true);
    expect(fonts.some((f) => /^amiri-arabic-.*\.woff2$/.test(f))).toBe(true);
    expect(fonts.some((f) => /^ibm-plex-sans-arabic-arabic-.*\.woff2$/.test(f))).toBe(true);
  });

  it('styles every class that a page uses, and uses every class that it styles', () => {
    const shipped = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(DIST, file), 'utf8'))
      .join('');
    const used = new Set(
      [...shipped.matchAll(/class="([^"]*)"/g)].flatMap(([, names]) => names!.split(' '))
    );
    const rules = css.replace(/"[^"]*"|url\([^)]*\)/g, '');
    const styled = new Set([...rules.matchAll(/\.([a-z][\w-]*)/g)].map(([, name]) => name!));
    const withParts = new Set([...styled].flatMap((name) => [name, name.split(/__|--/)[0]!]));
    expect([...used].filter((name) => !withParts.has(name))).toEqual([]);
    expect([...styled].filter((name) => !used.has(name))).toEqual([]);
  });

  it('makes no third-party requests', () => {
    const external =
      all.match(
        /(?:src|href)="https?:\/\/(?!(?:dorar\.net|tanzil\.net|wirdy\.site|github\.com)[/"])[^"]+"/g
      ) || [];
    expect(external).toEqual([]);
  });
});
