import { describe, expect, test } from 'bun:test';
import { Effect } from 'effect';
import { decodeDetails, decodeTotals, detailsQueryOf, totalsQueryOf } from './cloudflare.ts';
import { windowsOf } from './report.ts';

const failureOf = <A>(effect: Effect.Effect<A, Error>): Promise<string> =>
  Effect.runPromise(Effect.map(Effect.flip(effect), (error) => error.message));

const fixture = (name: string): Promise<unknown> =>
  Bun.file(`${import.meta.dir}/fixtures/${name}.json`).json();

const windows = windowsOf(new Date('2026-11-26T11:00:00Z'));

const zoneWith = (parts: Readonly<Record<string, unknown>>) => ({
  data: { viewer: { zones: [parts] } },
  errors: null,
});

describe('totalsQueryOf', () => {
  const query = totalsQueryOf(windows);

  test('asks each window by name', () => {
    for (const alias of ['hour', 'day', 'hourBefore', 'dayBefore', 'hourFromX']) {
      expect(query).toContain(` ${alias}: httpRequestsAdaptiveGroups(limit: 1, filter: {`);
    }
  });

  test('asks the hour, and the same hour a day before', () => {
    expect(query).toContain(
      'hour: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-11-26T10:00:00.000Z", datetime_lt: "2026-11-26T11:00:00.000Z"'
    );
    expect(query).toContain(
      'hourBefore: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-11-25T10:00:00.000Z", datetime_lt: "2026-11-25T11:00:00.000Z"'
    );
  });

  test('counts only pages served to readers, not bots', () => {
    expect(query).toContain(
      'requestSource: "eyeball", verifiedBotCategory: "", edgeResponseStatus: 200'
    );
    expect(query).toContain('{ userAgent_like: "Mozilla/5.0 (%" }');
    expect(query).toContain('{ userAgent_notlike: "%bot%" }');
    expect(query).toContain('{ userAgent_notlike: "%compatible;%" }');
  });

  test('takes the zone as a variable', () => {
    expect(query).toContain('zones(filter: { zoneTag: $zone })');
  });
});

describe('detailsQueryOf', () => {
  const query = detailsQueryOf(windows.day);

  test('asks the countries and the pages by visits', () => {
    expect(query).toContain(
      'countries: httpRequestsAdaptiveGroups(limit: 10, orderBy: [sum_visits_DESC]'
    );
    expect(query).toContain('dimensions { clientCountryName }');
    expect(query).toContain(
      'pages: httpRequestsAdaptiveGroups(limit: 200, orderBy: [sum_visits_DESC]'
    );
  });

  test('asks the readers of each app by the name of its browser', () => {
    expect(query).toContain(' fromX: httpRequestsAdaptiveGroups(limit: 1, filter: {');
    expect(query).toContain(
      '{ OR: [{ userAgent_like: "%musical_ly%" }, { userAgent_like: "%BytedanceWebview%" }, { userAgent_like: "%TikTok%" }] }'
    );
    expect(query).toContain(' fromPinterest: httpRequestsAdaptiveGroups(limit: 1, filter: {');
  });

  test('asks the missing pages of readers, and leaves out scans for files the site never had', () => {
    expect(query).toContain('edgeResponseStatus: 404');
    expect(query).toContain('{ clientRequestPath_notlike: "%.php%" }');
    expect(query).toContain('{ clientRequestPath_notlike: "%/.%" }');
  });

  test('asks every server error, from anyone', () => {
    expect(query).toContain(
      'failures: httpRequestsAdaptiveGroups(limit: 1, filter: { datetime_geq: "2026-11-25T21:00:00.000Z", datetime_lt: "2026-11-26T11:00:00.000Z", requestSource: "eyeball", edgeResponseStatus_geq: 500 }) { count }'
    );
  });
});

describe('decodeTotals', () => {
  test('reads each window, rounds a sampled count, and takes an empty one as 0', async () => {
    expect(await Effect.runPromise(decodeTotals(await fixture('totals')))).toEqual({
      hour: 18,
      day: 342,
      hourBefore: 8,
      dayBefore: 290,
      hourFromX: 0,
    });
  });

  test('fails when a window is missing from the answer', async () => {
    const answer = zoneWith({ hour: [], day: [], hourBefore: [], dayBefore: [] });
    expect(await failureOf(decodeTotals(answer))).toContain('no hourFromX');
  });

  test('fails when a window has another shape', async () => {
    const answer = zoneWith({
      hour: [{ sum: { visits: '5' } }],
      day: [],
      hourBefore: [],
      dayBefore: [],
      hourFromX: [],
    });
    expect(await failureOf(decodeTotals(answer))).toContain('hour of an unknown shape');
  });

  test('fails with the message Cloudflare gives', async () => {
    expect(await failureOf(decodeTotals(await fixture('errors')))).toContain(
      'unknown arg visits_gt'
    );
  });

  test('fails on an answer of another shape', async () => {
    expect(await failureOf(decodeTotals({ data: { viewer: { zones: [] } } }))).toContain(
      'cloudflare'
    );
    expect(await failureOf(decodeTotals('<html>'))).toContain('unknown shape');
  });
});

describe('decodeDetails', () => {
  test('reads the countries, pages, sources, posters, and errors of the day', async () => {
    expect(await Effect.runPromise(decodeDetails(await fixture('details')))).toEqual({
      countries: [
        { key: 'SA', count: 133 },
        { key: 'US', count: 33 },
      ],
      pages: [
        { key: '/', count: 154 },
        { key: '/al-jumuah/', count: 7 },
      ],
      sources: [
        { id: 'X', count: 87 },
        { id: 'Instagram', count: 9 },
        { id: 'Snapchat', count: 0 },
        { id: 'TikTok', count: 0 },
        { id: 'Facebook', count: 0 },
        { id: 'Threads', count: 0 },
        { id: 'Google', count: 0 },
        { id: 'LinkedIn', count: 0 },
        { id: 'Telegram', count: 0 },
        { id: 'Pinterest', count: 0 },
      ],
      posters: 22,
      missing: [{ key: '/apple-touch-icon-precomposed.png', count: 24 }],
      failures: 0,
    });
  });

  test('fails when a part is missing from the answer', async () => {
    expect(await failureOf(decodeDetails(zoneWith({})))).toContain('no countries');
  });
});
