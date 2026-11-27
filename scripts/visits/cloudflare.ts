import { Array, Data, Effect, Option, Redacted, Schedule, Schema } from 'effect';
import { toCount } from './report.ts';
import type { Details, Tally, Totals, Window, Windows } from './report.ts';

export class AnalyticsFailed extends Data.TaggedError('AnalyticsFailed')<{
  readonly message: string;
}> {}

export type Analytics = { readonly token: Redacted.Redacted; readonly zone: string };

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const NOT_READER_AGENTS = [
  '%bot%',
  '%Bot%',
  '%crawl%',
  '%Crawl%',
  '%spider%',
  '%Spider%',
  '%Headless%',
  '%externalhit%',
  '%compatible;%',
  '%+http%',
];

const NOT_SITE_PATHS = ['%.php%', '%wp-%', '%/.%'];

const READER_AGENT = [
  '{ userAgent_like: "Mozilla/5.0 (%" }',
  ...NOT_READER_AGENTS.map((pattern) => `{ userAgent_notlike: "${pattern}" }`),
];

const FROM_X = '{ userAgent_like: "%Twitter%" }';

const windowFilterOf = (window: Window) =>
  `datetime_geq: "${window.from.toISOString()}", datetime_lt: "${window.to.toISOString()}", requestSource: "eyeball"`;

const readersOf = (window: Window, status: string, more: ReadonlyArray<string> = []) =>
  `{ ${windowFilterOf(window)}, verifiedBotCategory: "", ${status}, AND: [${[...READER_AGENT, ...more].join(', ')}] }`;

const readsOf = (window: Window, more: ReadonlyArray<string> = []) =>
  readersOf(window, 'edgeResponseStatus: 200', more);

const groups = (alias: string, options: string, selection: string) =>
  `${alias}: httpRequestsAdaptiveGroups(${options}) { ${selection} }`;

const VISITS = 'sum { visits }';

const queryOf = (parts: ReadonlyArray<string>) =>
  `query ($zone: string!) { viewer { zones(filter: { zoneTag: $zone }) { ${parts.join(' ')} } } }`;

export function totalsQueryOf(windows: Windows): string {
  return queryOf([
    groups('hour', `limit: 1, filter: ${readsOf(windows.hour)}`, VISITS),
    groups('day', `limit: 1, filter: ${readsOf(windows.day)}`, VISITS),
    groups('hourBefore', `limit: 1, filter: ${readsOf(windows.hourBefore)}`, VISITS),
    groups('dayBefore', `limit: 1, filter: ${readsOf(windows.dayBefore)}`, VISITS),
    groups('hourFromX', `limit: 1, filter: ${readsOf(windows.hour, [FROM_X])}`, VISITS),
  ]);
}

export function detailsQueryOf(day: Window): string {
  const sitePaths = NOT_SITE_PATHS.map((pattern) => `{ clientRequestPath_notlike: "${pattern}" }`);
  return queryOf([
    groups(
      'countries',
      `limit: 10, orderBy: [sum_visits_DESC], filter: ${readsOf(day)}`,
      `${VISITS} dimensions { clientCountryName }`
    ),
    groups(
      'pages',
      `limit: 200, orderBy: [sum_visits_DESC], filter: ${readsOf(day)}`,
      `${VISITS} dimensions { clientRequestPath }`
    ),
    groups('fromX', `limit: 1, filter: ${readsOf(day, [FROM_X])}`, VISITS),
    groups(
      'posters',
      `limit: 1, filter: ${readsOf(day, ['{ clientRequestPath_like: "/posters/%" }'])}`,
      'count'
    ),
    groups(
      'missing',
      `limit: 5, orderBy: [count_DESC], filter: ${readersOf(day, 'edgeResponseStatus: 404', sitePaths)}`,
      'count dimensions { clientRequestPath }'
    ),
    groups(
      'failures',
      `limit: 1, filter: { ${windowFilterOf(day)}, edgeResponseStatus_geq: 500 }`,
      'count'
    ),
  ]);
}

const answerSchema = Schema.Struct({
  data: Schema.NullOr(
    Schema.Struct({
      viewer: Schema.Struct({
        zones: Schema.Array(Schema.Record(Schema.String, Schema.Array(Schema.Unknown))),
      }),
    })
  ),
  errors: Schema.optionalKey(
    Schema.NullOr(Schema.Array(Schema.Struct({ message: Schema.String })))
  ),
});

const visitsSchema = Schema.Struct({ sum: Schema.Struct({ visits: Schema.Number }) });
const countSchema = Schema.Struct({ count: Schema.Number });
const countriesSchema = Schema.Struct({
  sum: Schema.Struct({ visits: Schema.Number }),
  dimensions: Schema.Struct({ clientCountryName: Schema.String }),
});
const pathsSchema = Schema.Struct({
  sum: Schema.Struct({ visits: Schema.Number }),
  dimensions: Schema.Struct({ clientRequestPath: Schema.String }),
});
const missingSchema = Schema.Struct({
  count: Schema.Number,
  dimensions: Schema.Struct({ clientRequestPath: Schema.String }),
});

type Zone = Readonly<Record<string, ReadonlyArray<unknown>>>;

const failed = (message: string) => new AnalyticsFailed({ message: `cloudflare: ${message}` });

const zoneOf = (json: unknown) =>
  Effect.gen(function* () {
    const answer = yield* Effect.mapError(Schema.decodeUnknownEffect(answerSchema)(json), () =>
      failed('an answer of an unknown shape')
    );
    const errors = answer.errors ?? [];
    if (errors.length > 0) {
      return yield* failed(errors.map((error) => error.message).join('; '));
    }
    return yield* Option.match(Array.head(answer.data?.viewer.zones ?? []), {
      onNone: () => Effect.fail(failed('no zone in the answer')),
      onSome: Effect.succeed,
    });
  });

const rowsOf = <A>(zone: Zone, key: string, schema: Schema.Codec<A>) =>
  Effect.gen(function* () {
    const rows = yield* Option.match(Option.fromUndefinedOr(zone[key]), {
      onNone: () => Effect.fail(failed(`no ${key} in the answer`)),
      onSome: Effect.succeed,
    });
    return yield* Effect.mapError(Schema.decodeUnknownEffect(Schema.Array(schema))(rows), () =>
      failed(`${key} of an unknown shape`)
    );
  });

const visitsIn = (zone: Zone, key: string) =>
  Effect.map(rowsOf(zone, key, visitsSchema), (rows) =>
    Option.match(Array.head(rows), { onNone: () => 0, onSome: (row) => toCount(row.sum.visits) })
  );

const countIn = (zone: Zone, key: string) =>
  Effect.map(rowsOf(zone, key, countSchema), (rows) =>
    Option.match(Array.head(rows), { onNone: () => 0, onSome: (row) => toCount(row.count) })
  );

export const decodeTotals = (json: unknown) =>
  Effect.gen(function* () {
    const zone = yield* zoneOf(json);
    const totals: Totals = {
      hour: yield* visitsIn(zone, 'hour'),
      day: yield* visitsIn(zone, 'day'),
      hourBefore: yield* visitsIn(zone, 'hourBefore'),
      dayBefore: yield* visitsIn(zone, 'dayBefore'),
      hourFromX: yield* visitsIn(zone, 'hourFromX'),
    };
    return totals;
  });

export const decodeDetails = (json: unknown) =>
  Effect.gen(function* () {
    const zone = yield* zoneOf(json);
    const countries = yield* rowsOf(zone, 'countries', countriesSchema);
    const pages = yield* rowsOf(zone, 'pages', pathsSchema);
    const missing = yield* rowsOf(zone, 'missing', missingSchema);
    const details: Details = {
      countries: countries.map((row): Tally => ({
        key: row.dimensions.clientCountryName,
        count: toCount(row.sum.visits),
      })),
      pages: pages.map((row): Tally => ({
        key: row.dimensions.clientRequestPath,
        count: toCount(row.sum.visits),
      })),
      fromX: yield* visitsIn(zone, 'fromX'),
      posters: yield* countIn(zone, 'posters'),
      missing: missing.map((row): Tally => ({
        key: row.dimensions.clientRequestPath,
        count: toCount(row.count),
      })),
      failures: yield* countIn(zone, 'failures'),
    };
    return details;
  });

const post = (analytics: Analytics, query: string) =>
  Effect.gen(function* () {
    const reason = (cause: unknown) =>
      failed(cause instanceof Error ? cause.message : String(cause));
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${Redacted.value(analytics.token)}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ query, variables: { zone: analytics.zone } }),
          signal: AbortSignal.timeout(30_000),
        }),
      catch: reason,
    });
    if (!response.ok) return yield* failed(`answered ${String(response.status)}`);
    return yield* Effect.tryPromise({
      try: (): Promise<unknown> => response.json(),
      catch: reason,
    });
  }).pipe(Effect.retry({ times: 2, schedule: Schedule.spaced('2 seconds') }));

export const totalsOf = (analytics: Analytics, windows: Windows) =>
  Effect.flatMap(post(analytics, totalsQueryOf(windows)), decodeTotals);

export const detailsOf = (analytics: Analytics, day: Window) =>
  Effect.flatMap(post(analytics, detailsQueryOf(day)), decodeDetails);
