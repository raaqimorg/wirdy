import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const manifest = {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    lang: 'ar',
    dir: 'rtl',
    start_url: new URL('/', site).pathname,
    scope: new URL('/', site).pathname,
    display: 'standalone',
    background_color: SITE.paper,
    theme_color: SITE.paper,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
};
