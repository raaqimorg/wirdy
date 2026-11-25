import type { APIRoute, GetStaticPaths } from 'astro';
import { Effect } from 'effect';
import { searchIndex, type SearchRow } from '../../lib/collection';

export const getStaticPaths = (async () => {
  const { rows, version } = await Effect.runPromise(searchIndex);
  return [{ params: { version }, props: { rows } }];
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ rows: ReadonlyArray<SearchRow> }> = ({ props }) =>
  new Response(JSON.stringify(props.rows), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
