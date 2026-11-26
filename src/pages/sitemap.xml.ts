import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { Effect } from 'effect';
import { OCCASIONS } from '../lib/occasions';
import { tibbEntries } from '../lib/collection';
import { dhikrPath, hadithPath, slugOf } from '../lib/permalink';
import { TIBB } from '../lib/site';

const sitemap = (site: URL | undefined) =>
  Effect.map(
    Effect.all([Effect.promise(() => getCollection('adhkar')), tibbEntries]),
    ([adhkar, tibb]) => {
      const paths = [
        '/',
        ...OCCASIONS.map((occasion) => `/${occasion.id}/`),
        ...adhkar.map((entry) => dhikrPath(entry.data.occasion, slugOf(entry.id))),
        TIBB.path,
        ...tibb.map((entry) => hadithPath(slugOf(entry.id))),
      ];
      const urls = paths
        .map(
          (path) => `  <url>
    <loc>${new URL(path, site).href}</loc>
  </url>`
        )
        .join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
    }
  );

export const GET: APIRoute = async ({ site }) =>
  new Response(await Effect.runPromise(sitemap(site)), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
