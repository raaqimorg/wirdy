import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', site).href}

# LLMs: ${new URL('/llms.txt', site).href}
`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
