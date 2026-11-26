import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { OCCASIONS, OCCASION_IDS } from './lib/occasions';
import { adhkarLabel } from './lib/arabic';
import { PALETTE } from './lib/palette';
import { SITE, TIBB } from './lib/site';

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
const hadiths = readdirSync(join(process.cwd(), 'src/content/tibb'))
  .filter((f) => f.endsWith('.md'))
  .toSorted()
  .map((f) => f.replace(/\.md$/u, '').replace(/^\d+-/u, ''));

const countOf = (id: string) => contentFiles.filter((f) => f.startsWith(`${id}/`)).length;
const graphOf = (page: string) =>
  JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)![1]!)[
    '@graph'
  ] as { '@type': string; [key: string]: unknown }[];
const metaOf = (page: string, attr: string, name: string) =>
  page.match(
    new RegExp(`<meta ${attr}="${name.replaceAll(/[+]/gu, '\\$&')}" content="([^"]*)"`, 'u')
  )?.[1];
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
    .replaceAll(/&#34;|&quot;/gu, '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
const plain = (text: string) => text.replaceAll(/\s+/gu, ' ').trim();

const own = (path: string) => readFileSync(join(DIST, path, 'index.html'), 'utf8');
const facesOf = (page: string) =>
  [...page.matchAll(/<link rel="preload" href="\/_astro\/([a-z0-9-]+)-normal\./gu)].map(
    ([, name]) => name!
  );

const barOf = (page: string) => page.match(/<nav class="bar[ "][\s\S]*?<\/nav>/u)![0];
const onlyAt = (mode: string) =>
  contentFiles.filter(
    (f) =>
      f.startsWith('sabah-masaa/') &&
      readFileSync(join(ADHKAR, f), 'utf8').includes(`mode: "${mode}"`)
  ).length;

const cardTo = (path: string) => new RegExp(`<a class="occasion-card [^"]*" href="${path}"`, 'u');

const petals = (text: string) =>
  (text.match(/<circle cx="[\d.]+" cy="[\d.]+" r="6\.4"/gu) ?? []).map((c) =>
    c.replaceAll(/\s+/gu, ' ')
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

  it('opens with a card for each occasion page and الطب النبوي', () => {
    for (const id of OCCASION_IDS) {
      expect(html).toMatch(cardTo(`/${id}/`));
    }
    expect(html).toMatch(cardTo('/al-tibb-al-nabawi/'));
    expect(html).not.toContain('/ma-lam-yathbut/');
    expect(html.match(/class="occasion-card /gu)).toHaveLength(OCCASION_IDS.length + 1);
    expect(html.match(/occasion-card--lead/gu)).toHaveLength(1);
    expect(html.match(/occasion-card--row/gu)).toHaveLength(OCCASION_IDS.length);
  });

  it('fades one page into the next with nothing moving, and not with reduced motion', () => {
    expect(all + css).not.toContain('view-transition-name');
    const motion = css.match(
      /@media \(prefers-reduced-motion:no-preference\)\{@view-transition\{navigation:auto\}([^{}]*)\{([^{}]*)\}\}/u
    )!;
    expect(motion[1]).toBe(
      '::view-transition-group(root),::view-transition-old(root),::view-transition-new(root)'
    );
    expect(motion[2]).toContain('animation-duration:var(--duration-fade)');
    expect(motion[2]).toContain('animation-timing-function:linear');
    expect(css.match(/@view-transition/gu)).toHaveLength(1);
  });

  it('gives a page with a color its tone on the body, over a layer behind its top', () => {
    for (const { id, color } of [...OCCASIONS, { id: 'al-tibb-al-nabawi', color: TIBB.color }]) {
      expect(own(id)).toMatch(
        new RegExp(
          `<body class="tone" style="--tone: ${color}"> ?<a class="skip-link"[^<]*</a> ?<div class="page">`,
          'u'
        )
      );
    }
    expect(own('nawm/ayat-al-kursi')).toMatch(
      /<body class="tone" style="--tone: #[0-9a-f]{6}"> ?<a class="skip-link"[^<]*<\/a> ?<div class="page">/u
    );
    for (const page of [html, notFound]) {
      expect(page).toContain('<body>');
      expect(page).not.toContain('class="page"');
    }
    expect(css).toMatch(/\.page:{1,2}before\{[^}]*position:fixed/u);
  });

  it('gives each occasion its own page with one heading and a way back', () => {
    for (const id of OCCASION_IDS) {
      const page = pages[id]!;
      expect(page.match(/<h1[ >]/gu)).toHaveLength(1);
      expect(page).toMatch(
        /<nav class="bar bar--stage" aria-label="التنقّل">\s*<div class="bar__inner container">\s*<a class="bar__brand" href="\/" aria-label="وِردي، الرئيسية">/u
      );
    }
  });

  it('ends each list page with the other sections, never itself', () => {
    const sections = [...OCCASION_IDS, 'al-tibb-al-nabawi'];
    for (const id of sections) {
      const page = own(id);
      const related = page.match(/<nav class="related container"[\s\S]*?<\/nav>/gu)!;
      expect(related).toHaveLength(1);
      const links = [...related[0].matchAll(/<a class="occasion-card [^"]*" href="([^"]+)"/gu)];
      expect(links.map(([, href]) => href)).toEqual(
        sections.filter((other) => other !== id).map((other) => `/${other}/`)
      );
      expect(page.slice(page.indexOf('</main>'))).toContain('<nav class="related container"');
    }
    expect(css).toMatch(/\.card-grid--compact\{[^}]*display:flex/u);
    expect(css).toMatch(/\.card-grid--compact>li\{flex:/u);
    expect(css).toMatch(
      /\.occasion-card--compact \.occasion-card__stage\{[^}]*height:calc\(\(100cqi - 3 \* var\(--space-5\)\) \/ 6\)/u
    );
  });

  it('opens a menu of every section from an icon in the bar of each page but home, with no script', () => {
    const sections = [...OCCASION_IDS, 'al-tibb-al-nabawi'];
    for (const path of [...sections, 'nawm/ayat-al-kursi', 'bahth']) {
      const bar = barOf(own(path));
      expect(bar).toMatch(
        /<button class="section-menu__button" type="button" popovertarget="sections" aria-label="الأقسام">\s*<svg class="icon/u
      );
      const panel = bar.match(
        /<div class="section-menu__panel" id="sections" popover>[\s\S]*?<\/div>/u
      )![0];
      const links = [
        ...panel.matchAll(/<a class="section-menu__link[^"]*" href="([^"]+)"[^>]*>/gu),
      ];
      expect(links.map(([, href]) => href)).toEqual(sections.map((other) => `/${other}/`));
      const current = links.filter(([tag]) => tag.includes('aria-current="page"'));
      expect(current.map(([, href]) => href)).toEqual(sections.includes(path) ? [`/${path}/`] : []);
    }
    expect(barOf(html)).not.toContain('section-menu');
    expect(css).toMatch(/@supports selector\(:popover-open\)/u);
    expect(css).toMatch(/\.section-menu__panel::backdrop\{display:none/u);
  });

  it('keeps one bar and one height at the top of every page', () => {
    for (const path of ['nawm', 'nawm/ayat-al-kursi', 'al-tibb-al-nabawi', 'bahth']) {
      const page = own(path);
      expect(page.match(/<nav class="bar[ "]/gu)).toHaveLength(1);
      expect(page.match(/<div class="banner__inner container">/gu)).toHaveLength(1);
    }
    for (const path of ['nawm/ayat-al-kursi', 'bahth']) {
      expect(own(path)).toMatch(/<p class="banner__lede">[^<]+<\/p>/u);
    }
    for (const path of ['nawm', 'al-tibb-al-nabawi']) {
      expect(own(path)).not.toContain('class="banner__lede"');
    }
    expect(css).toMatch(/\.banner__inner\{[^}]*height:var\(--size-banner\)/u);
    expect(css).toMatch(/\.hero\{[^}]*height:var\(--size-banner\)/u);
    expect(css).not.toContain('backdrop-filter');
  });

  it('ships both wird variants, and strikes neither', () => {
    const page = pages['sabah-masaa']!;
    expect(page).toContain('class="variant-text variant-text--sabah"');
    expect(page).toContain('class="variant-text variant-text--masaa"');
    expect(css).not.toContain('line-through');
  });

  it('inlines the wird script, and switches to the evening at noon', () => {
    expect(html).toMatch(/<script>[\s\S]*?dataset\.wird[\s\S]*?<\/script>/u);
    expect(html).toContain("return hour < 12 ? 's' : 'm'");
  });

  it('switches the form in place, and keeps the choice until the next form is due', () => {
    expect(html).toContain("sessionStorage.setItem('wird', period() + form)");
    expect(html).toContain('saved[0] === period() ? saved[1] : null');
    expect(html).not.toContain('form.hash');
  });

  it('listens for touches, passively, so iOS Safari shows the press state', () => {
    expect(html).toMatch(
      /<script>[\s\S]*?addEventListener\('touchstart', function \(\) \{\}, \{ passive: true \}\)[\s\S]*?<\/script>/u
    );
  });

  it('applies a saved theme before the first paint, and hides the buttons without script', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/u)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.getItem\('theme'\)[\s\S]*?<\/script>/u);
    expect(head).toMatch(
      /<noscript><style>\s*\[data-theme-toggle\],\s*\[data-wird-switch\],\s*\[data-copy\],\s*\[data-search-only\]\s*\{\s*display: none !important;\s*\}\s*\[data-search-list\]\s*\{\s*display: block !important;\s*\}\s*<\/style><\/noscript>/u
    );
  });

  it('forgets a saved theme once it matches the device again, and says whether dark is on', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/u)![1]!;
    expect(head).toMatch(/<script>[\s\S]*?localStorage\.removeItem\('theme'\)[\s\S]*?<\/script>/u);
    expect(head).toMatch(/<script>[\s\S]*?setAttribute\('aria-pressed'[\s\S]*?<\/script>/u);
  });

  it('puts the theme button and the GitHub link in the footer of every page, as quiet text', () => {
    const every = [
      html,
      notFound,
      ...Object.values(pages),
      own('al-tibb-al-nabawi'),
      own('nawm/ayat-al-kursi'),
    ];
    for (const page of every) {
      const footer = page.match(/<footer class="site-footer">[\s\S]*?<\/footer>/u)![0];
      const tools = footer.match(/<p class="site-footer__tools">([\s\S]*?)<\/p>/u)![1]!;
      expect(tools.replaceAll(/\s+/gu, ' ').trim()).toBe(
        '<button class="theme-toggle" type="button" aria-pressed="false" data-theme-toggle>المظهر</button><span aria-hidden="true">·</span><a class="site-footer__link" href="https://github.com/raaqimorg/wirdy" rel="noopener">قتهب</a>'
      );
      expect(page.split('data-theme-toggle>').length - 1).toBe(1);
      expect(page.split('href="https://github.com/raaqimorg/wirdy"').length - 1).toBe(1);
      expect(page).not.toContain(
        '<svg class="icon icon--line" viewBox="0 0 24 24" stroke-width="2"'
      );
    }
    expect(css).toMatch(/\.site-footer__tools\{[^}]*color:var\(--color-ink-muted\)/u);
  });

  it('names the section over the title of a dhikr, as the way back to its place', () => {
    expect(own('nawm/ayat-al-kursi')).toMatch(
      /<a class="banner__up" href="\/nawm\/#ayat-al-kursi">\s*<svg[\s\S]*?<span class="banner__up-label">عند النوم<\/span>/u
    );
  });

  it('says the section once at the top of a dhikr', () => {
    for (const file of contentFiles) {
      const path = file.replace(/\.md$/u, '').replace(/\/\d+-/u, '/');
      const top = own(path).match(/<header class="banner[\s\S]*?<\/header>/u)![0];
      const up = top.match(/<span class="banner__up-label">([^<]+)</u)![1];
      const lede = top.match(/<p class="banner__lede">([^<]+)</u)![1];
      expect(`${path}: ${lede}`).not.toBe(`${path}: ${up}`);
    }
  });

  it('counts the adhkar of the time that shows', () => {
    const page = pages['sabah-masaa']!;
    const kicker = page.match(/<p class="banner__kicker">[\s\S]*?<\/p>/u)![0];
    const total = countOf('sabah-masaa');
    expect(kicker).toContain(
      `<span class="variant-text variant-text--sabah">${adhkarLabel(total - onlyAt('masaa'))}</span>`
    );
    expect(kicker).toContain(
      `<span class="variant-text variant-text--masaa">${adhkarLabel(total - onlyAt('sabah'))}</span>`
    );
  });

  it('names a dhikr by the form that shows', () => {
    expect(own('sabah-masaa/bika-asbahna')).toMatch(
      /<h1 class="banner__title">\s*<span class="variant-text variant-text--sabah">اللهم بك أصبحنا<\/span>\s*<span class="variant-text variant-text--masaa">اللهم بك أمسينا<\/span>/u
    );
  });

  it('draws the home mark in its own inks', () => {
    const home = html.match(/<svg class="mark"[\s\S]*?<\/svg>/u)![0];
    expect([...new Set([...home.matchAll(/ fill="([^"]+)"/gu)].map(([, ink]) => ink))]).toEqual([
      PALETTE.petal,
      PALETTE.disc,
    ]);
  });

  it('switches between the morning and the evening form, and marks the one that shows', () => {
    const page = pages['sabah-masaa']!;
    const group = page.match(/<div class="wird-switch" role="group"[\s\S]*?<\/div>/u)![0];
    expect(group).toContain(
      '<a class="wird-switch__option" href="?w=s" data-wird-form="s">الصباح</a>'
    );
    expect(group).toContain(
      '<a class="wird-switch__option" href="?w=m" data-wird-form="m">المساء</a>'
    );
    expect(page).toMatch(/<script>[\s\S]*?setAttribute\('aria-current'[\s\S]*?<\/script>/u);
  });

  it('lists the groups of each page, each with a Latin link', () => {
    for (const id of OCCASION_IDS) {
      const groups = [...pages[id]!.matchAll(/<h2 class="group__title" id="([^"]+)"/gu)];
      expect(groups.length).toBeGreaterThan(0);
      for (const [, at] of groups) expect(at).toMatch(/^[a-z][a-z0-9-]*$/u);
      const jumps = pages[id]!.match(/<nav class="group-index"[\s\S]*?<\/nav>/u)![0];
      expect([...jumps.matchAll(/href="#([^"]+)"/gu)].map(([, at]) => at)).toEqual(
        groups.map(([, at]) => at)
      );
    }
    const shipped = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(DIST, file), 'utf8'))
      .join('');
    expect(shipped.match(/href="[^"]*#[^"]*[^ -~][^"]*"/gu) ?? []).toEqual([]);
  });

  it('shows the forms of tasbih as one choice of four, each phrase with its count', () => {
    const page = pages['salah']!;
    expect(page.match(/<li class="choices__item"/gu)).toHaveLength(4);
    expect(page).toContain('تكفي واحدة منها');
    const counts = page.match(
      /<span class="badge badge--count">\s*<span aria-hidden="true">[٠-٩]+/gu
    )!;
    expect(counts.map((c) => c.match(/[٠-٩]+$/u)![0]).join(' ')).toBe(
      '٣٣ ٣٣ ٣٣ ٣٣ ٣٣ ٣٤ ١٠ ١٠ ١٠ ٢٥ ٢٥ ٢٥ ٢٥'
    );
  });

  it('numbers no card', () => {
    expect(css).not.toContain('counter(');
  });

  it('hides a dhikr of the other time, in a list only, unless a link points at it', () => {
    const alone = own('sabah-masaa/fitrat-al-islam');
    expect(pages['sabah-masaa']).toContain('entry--masaa');
    expect(alone).not.toContain('entry--masaa');
    expect(css).toMatch(/\.entry--masaa:not\(:target\)[^{]*\{[^}]*display:none/u);
  });

  it('gives each dhikr on an occasion page a heading, shown or hidden', () => {
    for (const id of OCCASION_IDS) {
      expect(pages[id]!.match(/<h[234] class="(visually-hidden|entry__name)">/gu)).toHaveLength(
        countOf(id)
      );
    }
  });

  it('names no form on a page whose adhkar have one form', () => {
    for (const id of OCCASION_IDS.filter((other) => other !== 'sabah-masaa')) {
      expect(pages[id]).not.toContain('class="wird-switch"');
    }
  });

  it('holds the text of each takhrij link in its own span, as tall as a touch target', () => {
    const links = (all.match(/<a class="takhrij"[^>]*>[\s\S]*?<\/a>/gu) ?? []).filter(
      (link) => !link.includes('href="https://tanzil.net/"')
    );
    expect(links.length).toBe(expected);
    for (const link of links) expect(link).toMatch(/^<a [^>]*><span class="takhrij__text">/u);
    expect(css).toMatch(/\.takhrij\{[^}]*min-height:var\(--size-touch\)/u);
    expect(css).toMatch(/\.takhrij\{[^}]*overflow-wrap:anywhere/u);
  });

  it('writes no takhrij with a middle dot', () => {
    const values = (
      all.match(/<a class="takhrij"[^>]*><span class="takhrij__text">[^<]*<\/span>/gu) ?? []
    ).filter((value) => !value.includes('href="https://tanzil.net/"'));
    expect(values.length).toBe(expected);
    for (const value of values) expect(value).not.toContain('·');
  });

  it('keeps the Tanzil notice in the repository', () => {
    const notice = readFileSync(join(process.cwd(), 'NOTICE'), 'utf8');
    expect(notice).toContain('Copyright (C) 2007-2021 Tanzil Project');
    expect(notice).toContain('CHANGING IT IS NOT ALLOWED');
  });

  it('opens every footer with the dedication, centered above its tools', () => {
    for (const page of [html, ...Object.values(pages), notFound]) {
      const footer = page.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/u)![1]!;
      expect(footer.trim()).toMatch(
        /^<p class="site-footer__line">صدقة جارية عن شروق<\/p>\s*<p class="site-footer__tools">/u
      );
    }
    expect(css).toMatch(/\.site-footer__tools\{[^}]*justify-content:center/u);
  });

  it('leaves no unparsed variant markers', () => {
    expect(all).not.toContain('{{');
  });

  it('renders every ذكر in the collection once', () => {
    const items =
      Object.values(pages)
        .join('')
        .match(/<li class="entry[ "]/gu) ?? [];
    expect(items.length).toBe(expected);
  });

  it('links every ذكر to a dorar.net hadith page', () => {
    const links =
      Object.values(pages)
        .join('')
        .match(/href="https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+"/gu) ?? [];
    expect(links.length).toBe(expected);
  });

  it('declares one canonical URL per page, matching og:url', () => {
    const urls = { '': html, ...pages };
    for (const [id, page] of Object.entries(urls)) {
      const url = `https://wirdy.site/${id ? `${id}/` : ''}`;
      expect(page.match(/rel="canonical"/gu)).toHaveLength(1);
      expect(page).toContain(`<link rel="canonical" href="${url}"`);
      expect(page).toContain(`<meta property="og:url" content="${url}"`);
    }
  });

  it('gives each page its own title', () => {
    const titles = [html, ...Object.values(pages)].map(
      (page) => page.match(/<title>([^<]+)<\/title>/u)![1]
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(pages['nawm']).toContain('<title>أذكار النوم | وِردي</title>');
  });

  it('names the home page by its topic first and the brand last', () => {
    expect(html).toContain('<title>أذكار اليوم والليلة | وِردي</title>');
  });

  it('describes each occasion page with its count, in a snippet that fits the results page', () => {
    for (const { id, title } of OCCASIONS) {
      const description = metaOf(pages[id]!, 'name', 'description')!;
      expect(description.startsWith(`${title}: ${adhkarLabel(countOf(id))} `)).toBe(true);
      expect(description.length).toBeGreaterThanOrEqual(90);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(metaOf(pages[id]!, 'property', 'og:description')).toBe(description);
    }
  });

  it('points the opengraph card at an absolute image that is actually shipped', () => {
    expect(html).toMatch(
      /<meta property="og:image" content="https:\/\/wirdy\.site\/opengraph\.png"/u
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
    expect(html).toMatch(new RegExp(`<meta property="og:image:width" content="${width}"`, 'u'));
    expect(html).toMatch(new RegExp(`<meta property="og:image:height" content="${height}"`, 'u'));
  });

  it('says the same title, description, and card in every tag of every head', () => {
    const files = readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((file) =>
      file.endsWith('.html')
    );
    for (const file of files) {
      const page = readFileSync(join(DIST, file), 'utf8');
      const title = unescaped(page.match(/<title>([^<]+)<\/title>/u)![1]!);
      const description = unescaped(metaOf(page, 'name', 'description')!);
      const image = metaOf(page, 'property', 'og:image')!;
      expect(title.endsWith(` | ${SITE.name}`)).toBe(true);
      for (const [attr, name] of [
        ['property', 'og:title'],
        ['name', 'twitter:title'],
        ['property', 'og:image:alt'],
        ['name', 'twitter:image:alt'],
      ]) {
        expect(unescaped(metaOf(page, attr!, name!)!)).toBe(title);
      }
      expect(unescaped(metaOf(page, 'property', 'og:description')!)).toBe(description);
      expect(unescaped(metaOf(page, 'name', 'twitter:description')!)).toBe(description);
      expect(metaOf(page, 'name', 'twitter:image')).toBe(image);
      const shipped = image.replace(SITE.url, '');
      expect(existsSync(join(DIST, shipped))).toBe(true);
      expect(pngSize(shipped)).toEqual([
        Number(metaOf(page, 'property', 'og:image:width')),
        Number(metaOf(page, 'property', 'og:image:height')),
      ]);
      if (metaOf(page, 'name', 'robots') === 'noindex') continue;
      const webPage = graphOf(page).find((node) => node['@type'] === 'WebPage')!;
      expect(webPage['name']).toBe(title);
      expect(webPage['description']).toBe(description);
      expect((webPage['primaryImageOfPage'] as { url: string }).url).toBe(image);
    }
  });

  it('lists in the sitemap every page that may be indexed, and no other', () => {
    const indexed = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('index.html'))
      .filter((file) => !readFileSync(join(DIST, file), 'utf8').includes('content="noindex"'))
      .map((file) => `${SITE.url}/${file.replace(/index\.html$/u, '')}`)
      .toSorted();
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(([, loc]) => loc!).toSorted();
    expect(listed).toEqual(indexed);
  });

  it('declares a raster favicon and a touch icon, and ships every icon it declares', () => {
    expect(html).toMatch(/<link rel="icon" href="\/favicon\.ico" sizes="any"/u);
    expect(html).toMatch(/<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"/u);
    expect(html).toMatch(
      /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32x32\.png"/u
    );
    expect(html).toMatch(
      /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png"/u
    );
    expect(html).toMatch(/<meta name="apple-mobile-web-app-title" content="وِردي"/u);
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
    const mark = html.match(/<svg class="mark"[\s\S]*?<\/svg>/u)![0];
    expect(petals(mark)).toEqual(petals(svg));
    expect(petals(svg)).toHaveLength(12);
  });

  it('paints the mobile toolbar with the same paper the page uses, in both schemes', () => {
    expect(html).toMatch(
      /<meta name="theme-color" media="\(prefers-color-scheme: dark\)" content="#060f13"/u
    );
    expect(html).toMatch(/<meta name="theme-color" content="#d6d6cd"/u);
    const source = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    expect(source).toContain('--color-paper: #d6d6cd');
    expect(source).toContain('--color-paper: #060f13');
  });

  it('describes each page to search engines with structured data that matches the head', () => {
    for (const page of [html, ...Object.values(pages)]) {
      const block = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u);
      const graph = JSON.parse(block![1]!)['@graph'];
      const website = graph.find((node: { '@type': string }) => node['@type'] === 'WebSite');
      const webpage = graph.find((node: { '@type': string }) => node['@type'] === 'WebPage');
      expect(website.name).toBe('وِردي');
      expect(website.inLanguage).toBe('ar');
      expect(webpage.url).toBe(page.match(/<link rel="canonical" href="([^"]+)"/u)![1]);
      expect(webpage.name).toBe(page.match(/<title>([^<]+)<\/title>/u)![1]);
      expect(webpage.primaryImageOfPage.url).toBe(metaOf(page, 'property', 'og:image'));
    }
  });

  it('gives each occasion page a breadcrumb from the home page, and the home page none', () => {
    expect(graphOf(html).some((node) => node['@type'] === 'BreadcrumbList')).toBe(false);
    for (const { id, title } of OCCASIONS) {
      const crumbs = graphOf(pages[id]!).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(crumbs['itemListElement']).toEqual([
        { '@type': 'ListItem', position: 1, name: 'وِردي', item: 'https://wirdy.site/' },
        { '@type': 'ListItem', position: 2, name: title, item: `https://wirdy.site/${id}/` },
      ]);
    }
  });

  it('ships a manifest whose name and icons agree with the rest of the head', () => {
    expect(html).toMatch(/<link rel="manifest" href="\/site\.webmanifest"/u);
    const manifest = JSON.parse(readFileSync(join(DIST, 'site.webmanifest'), 'utf8'));
    expect(manifest.short_name).toBe(
      html.match(/<meta property="og:site_name" content="([^"]+)"/u)![1]
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
      OCCASIONS.map(({ id, title }) => ({ name: title, url: `/${id}/` }))
    );
  });

  it('ships a sitemap listing the home, every section page, every dhikr, and every hadith', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('<loc>https://wirdy.site/</loc>');
    for (const id of OCCASION_IDS) {
      expect(sitemap).toContain(`<loc>https://wirdy.site/${id}/</loc>`);
    }
    expect(sitemap).toContain('<loc>https://wirdy.site/al-tibb-al-nabawi/</loc>');
    expect(sitemap).not.toContain('ma-lam-yathbut');
    for (const slug of hadiths) {
      expect(sitemap).toContain(`<loc>https://wirdy.site/al-tibb-al-nabawi/${slug}/</loc>`);
    }
    expect(sitemap.match(/<loc>/gu)).toHaveLength(
      OCCASION_IDS.length + 2 + expected + hadiths.length
    );
  });

  it('leads from each dhikr to the previous and the next in its occasion', () => {
    const list = contentFiles
      .filter((f) => f.startsWith('nawm/'))
      .toSorted()
      .map((f) => `/${f.replace(/\.md$/u, '').replace(/\/\d+-/u, '/')}/`);
    for (const [index, path] of list.entries()) {
      const page = readFileSync(join(DIST, path, 'index.html'), 'utf8');
      const links = [
        ...page.match(/<nav class="neighbours"[\s\S]*?<\/nav>/u)![0].matchAll(/href="([^"]+)"/gu),
      ];
      expect(links.map((link) => link[1])).toEqual(
        [list[index - 1], list[index + 1]].filter(Boolean)
      );
    }
  });

  it('gives each dhikr a page with its own card, breadcrumbs, and a way to its place', () => {
    const slugs = contentFiles.map((f) => f.replace(/\.md$/u, '').replace(/\/\d+-/u, '/'));
    expect(slugs).toHaveLength(expected);
    const images = new Set<string>();
    for (const slug of slugs) {
      const page = readFileSync(join(DIST, slug, 'index.html'), 'utf8');
      const [occasion, name] = slug.split('/');
      const image = metaOf(page, 'property', 'og:image')!;
      images.add(image);
      expect(existsSync(join(DIST, new URL(image).pathname))).toBe(true);
      expect(pngSize(new URL(image).pathname)).toEqual([2400, 1260]);
      expect(metaOf(page, 'property', 'og:image:width')).toBe('2400');
      expect(metaOf(page, 'property', 'og:image:height')).toBe('1260');
      expect(metaOf(page, 'property', 'og:url')).toBe(`https://wirdy.site/${slug}/`);
      expect(page).toContain(`<link rel="canonical" href="https://wirdy.site/${slug}/">`);
      expect(page.match(/<h1[ >]/gu)).toHaveLength(1);
      expect(page).toContain(`href="/${occasion}/#${name}"`);
      const crumbs = graphOf(page).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(crumbs['itemListElement']).toHaveLength(3);
      expect(page).not.toContain('class="crumbs"');
      expect(page.match(/data-share-title=/gu)).toHaveLength(1);
      expect(page.match(/ data-copy=/gu)).toHaveLength(1);
      expect(page.match(/ data-status/gu)).toHaveLength(1);
      expect(page).toMatch(/<a class="button" href="\/og\/[^"]+" download="wirdy-/u);
      expect(pages[occasion!]).toMatch(
        new RegExp(`<a class="entry__act" href="/${slug}/" aria-label="صفحة الذكر: `, 'u')
      );
      expect(pages[occasion!]).toContain(`id="${name}"`);
    }
    expect(images.size).toBe(expected);
  });

  it('gives each hadith of الطب النبوي a page with breadcrumbs, its place, and its neighbours', () => {
    const list = own('al-tibb-al-nabawi');
    for (const [index, slug] of hadiths.entries()) {
      const path = `/al-tibb-al-nabawi/${slug}/`;
      const page = own(path);
      expect(page).toContain(`<link rel="canonical" href="https://wirdy.site${path}">`);
      expect(page.match(/<h1[ >]/gu)).toHaveLength(1);
      expect(page.match(/<li class="entry entry--single"/gu)).toHaveLength(1);
      expect(page).toContain(`href="/al-tibb-al-nabawi/#${slug}"`);
      const crumbs = graphOf(page).find((node) => node['@type'] === 'BreadcrumbList')!;
      expect((crumbs['itemListElement'] as { item: string }[]).map(({ item }) => item)).toEqual([
        'https://wirdy.site/',
        'https://wirdy.site/al-tibb-al-nabawi/',
        `https://wirdy.site${path}`,
      ]);
      const links = [
        ...page.match(/<nav class="neighbours"[\s\S]*?<\/nav>/u)![0].matchAll(/href="([^"]+)"/gu),
      ].map((link) => link[1]);
      expect(links).toEqual(
        [hadiths[index - 1], hadiths[index + 1]]
          .filter(Boolean)
          .map((other) => `/al-tibb-al-nabawi/${other!}/`)
      );
      expect(list).toContain(`<a class="entry__act" href="${path}" aria-label="صفحة الحديث: `);
    }
  });

  it('leads from the top of every page past the bar to its content', () => {
    const files = readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((file) =>
      file.endsWith('.html')
    );
    for (const file of files) {
      const page = readFileSync(join(DIST, file), 'utf8');
      const body = page.slice(page.indexOf('<body'));
      expect(body.indexOf('<a class="skip-link" href="#main">')).toBe(body.indexOf('<a '));
      expect(page.match(/<main [^>]*id="main"/gu)).toHaveLength(1);
    }
  });

  it('marks the way back from a dhikr or a hadith as the trail of the page', () => {
    for (const path of ['nawm/ayat-al-kursi', `al-tibb-al-nabawi/${hadiths[0]!}`]) {
      expect(own(path)).toMatch(
        /<nav class="banner__kicker" aria-label="مسار الصفحة">\s*<a class="banner__up"/u
      );
    }
  });

  it('shows the context of a dhikr under its name, and in parentheses in plain text', () => {
    const page = own('sabah-masaa/kalimat-allah-at-tammat');
    const full = 'أعوذ بكلمات الله التامات (في المساء)';
    const { title } = OCCASIONS.find(({ id }) => id === 'sabah-masaa')!;
    expect(page).toMatch(
      /<h1 class="banner__title">\s*أعوذ بكلمات الله التامات\s*<\/h1>\s*<p class="banner__lede">في المساء/u
    );
    expect(page).toContain(`<title>${full} | ${title} | ${SITE.name}</title>`);
    expect(page).toContain(`data-share-title="${full}"`);
    const crumbs = graphOf(page).find((node) => node['@type'] === 'BreadcrumbList')!;
    expect((crumbs['itemListElement'] as { name: string }[]).at(-1)!.name).toBe(full);
    expect(pages['sabah-masaa']).toContain(`aria-label="نسخ: ${full}"`);
    expect(pages['sabah-masaa']).toContain(`aria-label="صفحة الذكر: ${full}"`);
    expect(pages['sabah-masaa']).toContain(`<h3 class="visually-hidden">${full}</h3>`);
    expect(own('sabah-masaa/ayat-al-kursi')).toMatch(
      /<a class="neighbours__link"[^>]*>[\s\S]*?[^ >] <span class="neighbours__context">[^<]+<\/span>/u
    );
  });

  it('copies each dhikr as it shows, with its takhrij last', () => {
    for (const id of OCCASION_IDS) {
      const cards = pages[id]!.match(/<li class="entry[ "][\s\S]*?<\/li>/gu)!;
      expect(cards).toHaveLength(countOf(id));
      for (const card of cards) {
        const copied = unescaped(card.match(/ data-copy="([^"]*)"/u)![1]!);
        const takhrij = card.match(
          /<a class="takhrij"[^>]*><span class="takhrij__text">([^<]*)<\/span>/u
        )![1]!;
        expect(copied.split('\n').at(-1)).toBe(unescaped(takhrij));
        const shown = card
          .match(
            /<div class="entry__text">([\s\S]*?)<\/div>\s*<\/div>\s*<details class="entry__more">/u
          )![1]!
          .replaceAll(/<details class="surah__rest">[\s\S]*?<\/details>/gu, '')
          .replaceAll(/<span class="badge[\s\S]*?<\/span>\s*<\/span>/gu, ' ')
          .replaceAll(/<span class="variant-text variant-text--masaa">[^<]*<\/span>/gu, '')
          .replaceAll(/<(div|span) class="surah[^"]*">/gu, ' ');
        const words = copied
          .split('\n\n')
          .slice(0, -1)
          .join(' ')
          .replaceAll(/ \([٠-٩]+ مر(ة|ات)\)$/gmu, '');
        expect(plain(words)).toBe(plain(unescaped(shown.replaceAll(/<[^>]+>/gu, ''))));
      }
    }
  });

  it('carries the evening form to copy where a dhikr has one, and nowhere else', () => {
    const forms = contentFiles.filter((f) => readFileSync(join(ADHKAR, f), 'utf8').includes('{{'));
    expect(all.match(/ data-copy-masaa="/gu)).toHaveLength(forms.length);
  });

  it('draws no card with the red outline of a text that does not fit', () => {
    const cards = readdirSync(join(DIST, 'og'), { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.png')
    );
    expect(cards).toHaveLength(expected + hadiths.length);
    expect(cards.filter((f) => cornerOf(join(DIST, 'og', f)).join() === '255,0,0')).toEqual([]);
  });

  it('marks the shared dhikr without script, clear of the bar', () => {
    expect(css).toMatch(/\.entry:target[^{]*\{[^}]*outline:/u);
    expect(css).toMatch(/\.entry\{[^}]*scroll-margin-top:var\(--space-16\)/u);
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
    expect(notFound.match(/<h1[ >]/gu)).toHaveLength(1);
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
    expect(headers.match(/^\/\*\n((?:  .*\n)+)/u)![1]).not.toContain('Cache-Control');
    for (const file of readdirSync(join(DIST, '_astro'))) {
      expect(file).toMatch(/\.[A-Za-z0-9_-]{8}\.(css|woff2|js)$/u);
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
    expect(headers).toMatch(/^\/\*\n  Strict-Transport-Security: max-age=31536000\n/u);
  });

  it('credits Tanzil under every قرآن entry', () => {
    const entries =
      Object.values(pages)
        .join('')
        .match(/<li class="entry[^"]*entry--quran[\s\S]*?<\/li>/gu) ?? [];
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(entry).toContain('href="https://tanzil.net/"');
  });

  it('ships a robots.txt that opens the site and points at the sitemap', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://wirdy.site/sitemap.xml');
  });

  it('describes itself in Arabic for the card', () => {
    expect(html).toMatch(/<meta property="og:type" content="website"/u);
    expect(html).toMatch(/<meta property="og:locale" content="ar_AR"/u);
    expect(html).toMatch(/<meta property="og:title" content="أذكار اليوم والليلة \| وِردي"/u);
    expect(html).toMatch(/<meta property="og:description" content="أذكار الصباح والمساء/u);
  });

  it('asks for the large twitter card so the image is not cropped to a thumb', () => {
    expect(html).toMatch(/<meta name="twitter:card" content="summary_large_image"/u);
    expect(html).toMatch(
      /<meta name="twitter:image" content="https:\/\/wirdy\.site\/opengraph\.png"/u
    );
  });

  it('brackets every قرآن card and keeps a face that can draw the brackets', () => {
    const quran = contentFiles.filter((f) =>
      readFileSync(join(ADHKAR, f), 'utf8').includes('quran: true')
    ).length;
    expect(all.match(/class="surah"/gu)?.length).toBeGreaterThanOrEqual(quran);
    expect(css).toMatch(/\.surah::?before\{[^}]*content:"﴿"/u);
    expect(css).toMatch(/\.surah::?after[,{][^}]*content:"﴾"/u);
    expect(css).toMatch(/\.surah__ayat::?after[^{]*\{[^}]*content:"﴾"/u);
    expect(css).toMatch(/\.surah--fold::?after\{content:none/u);
    expect(css).toMatch(/\.surah__ayah-end::?before\{[^}]*content:"۝"/u);
    expect(css).not.toContain('۞');
    expect(css).toMatch(/--font-quran:\s*"Amiri Quran",\s*"Amiri"/u);
  });

  it('shows the first آية of each of المعوذات, and no more', () => {
    for (const id of ['sabah-masaa', 'salah', 'nawm']) {
      const cards =
        pages[id]!.match(/<div class="entry__text">[\s\S]*?<div class="entry__side">/gu) ?? [];
      const card = cards.find((c) => c.includes('ٱلْفَلَقِ'))!;
      expect(card).toBeDefined();
      expect(card.match(/class="surah"/gu)).toHaveLength(3);
      expect(card).not.toContain('surah__ayah-end');
      expect(card).not.toContain('ٱلْوَسْوَاسِ');
    }
  });

  it('holds every آية of a folded سورة, in order, behind one button for each سورة', () => {
    const folded = contentFiles.filter((f) =>
      readFileSync(join(ADHKAR, f), 'utf8').includes('ayat: "fold"')
    );
    expect(folded.toSorted()).toEqual([
      'istiqaz/03-khawatim-al-imran.md',
      'nawm/01-al-isra-wa-al-zumar.md',
      'nawm/02-al-sajdah-wa-al-mulk.md',
    ]);
    for (const file of folded) {
      const [occasion, name] = file
        .replace(/\.md$/u, '')
        .replace(/\/\d+-/u, '/')
        .split('/');
      const suwar = readFileSync(join(ADHKAR, file), 'utf8')
        .split('---')[2]!
        .trim()
        .split(/\n\s*\n/u)
        .map((surah) => surah.split('\n').map((ayah) => ayah.trim()));
      const card = pages[occasion!]!.match(
        new RegExp(`<li class="entry[^"]*" id="${name}">[\\s\\S]*?</li>`, 'u')
      )![0];
      for (const page of [card, own(`${occasion}/${name}`)]) {
        expect(page.match(/<details class="surah__rest">/gu)).toHaveLength(suwar.length);
        expect(page.match(/<summary class="surah__more">/gu)).toHaveLength(suwar.length);
        let at = 0;
        for (const ayah of suwar.flat()) {
          const next = page.indexOf(ayah, at);
          expect(next).toBeGreaterThan(at);
          at = next + ayah.length;
        }
      }
    }
    expect(css).not.toMatch(/\.surah__more\{[^}]*position:sticky/u);
  });

  it('keeps آية الكرسي whole', () => {
    const file = readFileSync(join(ADHKAR, 'nawm/04-ayat-al-kursi.md'), 'utf8').trim();
    const ending = file.slice(file.lastIndexOf(' ', file.length - 12) + 1);
    expect(pages['nawm']).toContain(ending);
  });

  it('opens no سورة with the بسملة', () => {
    const suwar = all.match(/<div class="surah[^"]*">([\s\S]*?)<\/div>/gu) ?? [];
    expect(suwar.length).toBeGreaterThan(0);
    expect(suwar.filter((s) => s.includes('بِسْمِ'))).toEqual([]);
  });

  it('ships every face from this origin, once', () => {
    const fonts = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.woff2'));
    expect(fonts).toHaveLength(5);
    expect(fonts.some((f) => /^amiri-quran-arabic-.*\.woff2$/u.test(f))).toBe(true);
    expect(fonts.some((f) => /^amiri-arabic-.*\.woff2$/u.test(f))).toBe(true);
    expect(fonts.some((f) => /^ibm-plex-sans-arabic-arabic-.*\.woff2$/u.test(f))).toBe(true);
  });

  it('styles every class that a page uses, and uses every class that it styles', () => {
    const shipped = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(DIST, file), 'utf8'))
      .join('');
    const used = new Set(
      [...shipped.matchAll(/class="([^"]*)"/gu)].flatMap(([, names]) => names!.split(' '))
    );
    const rules = css.replaceAll(/"[^"]*"|url\([^)]*\)/gu, '');
    const styled = new Set([...rules.matchAll(/\.([a-z][\w-]*)/gu)].map(([, name]) => name!));
    const withParts = new Set([...styled].flatMap((name) => [name, name.split(/__|--/u)[0]!]));
    expect([...used].filter((name) => !withParts.has(name))).toEqual([]);
    expect([...styled].filter((name) => !used.has(name))).toEqual([]);
  });

  it('makes no third-party requests, on any page', () => {
    const shipped = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.html'))
      .map((file) => readFileSync(join(DIST, file), 'utf8'))
      .join('');
    expect(shipped).toContain(own('bahth'));
    const external =
      shipped.match(
        /(?:src|href)="https?:\/\/(?!(?:dorar\.net|sunnah\.com|shamela\.ws|usul\.ai|tanzil\.net|wirdy\.site|github\.com)[/"])[^"]+"/gu
      ) ?? [];
    expect(external).toEqual([]);
    expect(shipped.match(/<script[^>]* src="(?!\/_astro\/)[^"]*"/gu) ?? []).toEqual([]);
  });

  it('searches every dhikr and hadith from one page, linked from every page', () => {
    const page = own('bahth');
    const tibb = readdirSync(join(process.cwd(), 'src/content/tibb')).filter((f) =>
      f.endsWith('.md')
    );
    expect(page).toContain('<meta name="robots" content="noindex">');
    expect(page).not.toContain('rel="canonical"');
    expect(page).toMatch(/<script type="module"[^>]*>/u);
    expect(page).toMatch(
      /<input class="search-field__input" type="search"[^>]*enterkeyhint="search"/u
    );
    expect(page).not.toMatch(/<input[^>]* name=/u);
    const rows = [
      ...page.matchAll(/<li class="search-row[^"]*" data-search-row[^>]*>[\s\S]*?<\/li>/gu),
    ].map(([row]) => row);
    expect(rows).toHaveLength(expected + tibb.length);
    const hrefs = rows.map(
      (row) => row.match(/<a class="search-row__link[^"]*" href="([^"]+)"/u)![1]!
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      const [path, id] = href.split('#');
      expect(own(path!.slice(1, -1))).toContain(`id="${id}"`);
    }
    for (const file of contentFiles) {
      expect(hrefs).toContain(`/${file.replace(/\.md$/u, '').replace(/\/\d+-/u, '/#')}`);
    }
    expect(page.match(/href="\/bahth\/"/gu)).toHaveLength(1);
    expect(page).toMatch(/<a class="bar__search" href="\/bahth\/"[^>]* aria-current="page"/u);
    expect(page).not.toContain('data-search-sheet');
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('/bahth/');
  });

  it('opens search in place on every other page, from one index the browser keeps until a deploy', () => {
    const others = [
      html,
      notFound,
      ...Object.values(pages),
      own('al-tibb-al-nabawi'),
      own('nawm/ayat-al-kursi'),
    ];
    const indexes = new Set<string>();
    for (const page of others) {
      expect(page.match(/<nav class="bar[ "][\s\S]*?<\/nav>/u)![0]).toContain(
        '<a class="bar__search" href="/bahth/" aria-label="ابحث في الأذكار" data-search-open>'
      );
      expect(page.match(/<dialog class="search-sheet[^"]*"[^>]*>/gu)).toHaveLength(1);
      indexes.add(page.match(/data-search-index="(\/search\/[0-9a-f]{12}\.json)"/u)![1]!);
    }
    expect(indexes.size).toBe(1);
    const [index] = [...indexes];
    const rows = JSON.parse(readFileSync(join(DIST, index!), 'utf8'));
    const page = own('bahth');
    expect(rows).toHaveLength(page.match(/<li class="search-row[^"]*" data-search-row/gu)!.length);
    const headers = readFileSync(join(DIST, '_headers'), 'utf8');
    expect(headers).toContain('/search/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(own('nawm').match(/<dialog class="search-sheet search-sheet--stage"/gu)).toHaveLength(1);
  });
});
