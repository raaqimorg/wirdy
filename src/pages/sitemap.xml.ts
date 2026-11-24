import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { OCCASIONS } from '../lib/occasions';
import { dhikrPath, slugOf } from '../lib/permalink';
import { UNPROVEN } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const adhkar = await getCollection('adhkar');
  const paths = [
    '/',
    ...OCCASIONS.map((occasion) => `/${occasion.id}/`),
    ...adhkar.map((entry) => dhikrPath(entry.data.occasion, slugOf(entry.id))),
    UNPROVEN.path,
  ];
  const urls = paths
    .map(
      (path) => `  <url>
    <loc>${new URL(path, site).href}</loc>
  </url>`
    )
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
