import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { searchRows } from '../../lib/collection';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await Effect.runPromise(searchRows)), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
