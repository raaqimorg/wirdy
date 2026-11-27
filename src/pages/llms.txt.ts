import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { sectionTiles } from '../lib/collection';
import { RAAQIM, SITE } from '../lib/site';

const llms = (site: URL | undefined) =>
  Effect.map(sectionTiles, (tiles) => {
    const sections = tiles
      .map(({ heading, href, note }) => `- [${heading}](${new URL(href, site).href}): ${note}`)
      .join('\n');
    return `# Wirdy (${SITE.name})

> The daily adhkar authentic from the Prophet ﷺ, each with its takhrij linked to dorar.net. A project of [${RAAQIM.name} (${RAAQIM.arabic})](${RAAQIM.url})

Wirdy holds the adhkar of the morning, the evening, sleep, prayer, and the rest of the day, and the hadiths of الطب النبوي. A dhikr is in Sahih al-Bukhari or Sahih Muslim, or al-Albani grades it صحيح or حسن. Each dhikr has a page of its own with its text, its count, its moment, and its takhrij. The site is in Arabic, free, and has no ads or tracking

## Sections

${sections}

## Source

- [Source code](${SITE.repo}): MIT-licensed, on GitHub
- [Report a mistake](${SITE.repo}/issues/new?template=dhikr-correction.yml): a correction needs a dorar.net page
- [Sitemap](${new URL('/sitemap.xml', site).href}): every page of a dhikr and of a hadith

## Raaqim

Wirdy is built and maintained by [${RAAQIM.name} (${RAAQIM.arabic})](${RAAQIM.url}). ${RAAQIM.about} Its projects are open source, and contributions are welcome

- [${RAAQIM.name}](${RAAQIM.url}): who Raaqim is, and its other projects
- [${RAAQIM.name} llms.txt](${RAAQIM.url}/llms.txt): machine-readable index of Raaqim
- [Qafiyah (قافية)](https://qafiyah.com): another Raaqim project, a reference for Arabic poetry
- [GitHub](${RAAQIM.github}), [X](${RAAQIM.x}), and ${RAAQIM.email}
`;
  });

export const GET: APIRoute = async ({ site }) =>
  new Response(await Effect.runPromise(llms(site)), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
