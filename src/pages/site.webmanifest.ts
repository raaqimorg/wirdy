import type { APIRoute } from 'astro';
import { OCCASIONS } from '../lib/occasions';
import { PALETTE } from '../lib/palette';
import { SITE } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const manifest = {
    id: new URL('/', site).pathname,
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    lang: 'ar',
    dir: 'rtl',
    start_url: new URL('/', site).pathname,
    scope: new URL('/', site).pathname,
    display: 'standalone',
    background_color: PALETTE.paper,
    theme_color: PALETTE.paper,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: OCCASIONS.map(({ id, title }) => ({ name: title, url: `/${id}/` })),
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
};
