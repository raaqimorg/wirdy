import type { APIRoute, GetStaticPaths } from 'astro';
import { searchIndex, type SearchRow } from '../../lib/collection';

export const getStaticPaths = (async () => {
  const { rows, version } = await searchIndex();
  return [{ params: { version }, props: { rows } }];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ rows: SearchRow[] }> = ({ props }) =>
  new Response(JSON.stringify(props.rows), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
