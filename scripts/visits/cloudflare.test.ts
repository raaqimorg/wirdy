import { describe, expect, test } from 'bun:test';
import { Effect } from 'effect';
import { decodePaths, decodeTotals, pathsQueryOf, totalsQueryOf } from './cloudflare.ts';

const failureOf = <A>(effect: Effect.Effect<A, Error>): Promise<string> =>
  Effect.runPromise(Effect.map(Effect.flip(effect), (error) => error.message));

const fixture = (name: string): Promise<unknown> =>
  Bun.file(`${import.meta.dir}/fixtures/${name}.json`).json();

const hour = {
  from: new Date('2026-11-26T10:00:00Z'),
  to: new Date('2026-11-26T11:00:00Z'),
};
const day = {
  from: new Date('2026-11-25T21:00:00Z'),
  to: new Date('2026-11-26T11:00:00Z'),
};

describe('totalsQueryOf', () => {
  const query = totalsQueryOf([hour, day]);

  test('asks one alias per window, in order', () => {
    expect(query).toContain(
      'w0: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-11-26T10:00:00.000Z", datetime_lt: "2026-11-26T11:00:00.000Z", requestSource: "eyeball" }) { sum { visits } }'
    );
    expect(query).toContain(
      'w1: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-11-25T21:00:00.000Z"'
    );
    expect(query).not.toContain('w2:');
  });

  test('takes the zone as a variable', () => {
    expect(query).toContain('zones(filter: { zoneTag: $zone })');
  });
});

describe('pathsQueryOf', () => {
  test('groups the visits of a window by path, most first', () => {
    expect(pathsQueryOf(day)).toContain(
      'paths: httpRequestsAdaptiveGroups(limit: 10000, orderBy: [sum_visits_DESC], filter: { datetime_geq: "2026-11-25T21:00:00.000Z", datetime_lt: "2026-11-26T11:00:00.000Z", requestSource: "eyeball" }) { sum { visits } dimensions { clientRequestPath } }'
    );
  });
});

describe('decodeTotals', () => {
  test('reads the visits of each window, and an empty one as 0', async () => {
    expect(await Effect.runPromise(decodeTotals(await fixture('totals'), 3))).toEqual([18, 342, 0]);
  });

  test('fails when a window is missing from the answer', async () => {
    expect(await failureOf(decodeTotals(await fixture('totals'), 4))).toContain('w3');
  });

  test('fails with the message Cloudflare gives', async () => {
    expect(await failureOf(decodeTotals(await fixture('errors'), 1))).toContain(
      'unknown arg visits_gt'
    );
  });

  test('fails on an answer of another shape', async () => {
    expect(await failureOf(decodeTotals({ data: { viewer: { zones: [] } } }, 1))).toContain(
      'cloudflare'
    );
  });
});

describe('decodePaths', () => {
  test('reads each path with visits, and drops those with none', async () => {
    expect(await Effect.runPromise(decodePaths(await fixture('paths')))).toEqual([
      { path: '/', visits: 40 },
      { path: '/sabah-masaa/', visits: 12 },
      { path: '/nawm/', visits: 3 },
    ]);
  });

  test('fails with the message Cloudflare gives', async () => {
    expect(await failureOf(decodePaths(await fixture('errors')))).toContain(
      'unknown arg visits_gt'
    );
  });
});
