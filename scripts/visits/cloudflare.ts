import { Array, Data, Effect, Option, Redacted, Schedule, Schema } from 'effect';
import type { Window } from './report.ts';

export class AnalyticsFailed extends Data.TaggedError('AnalyticsFailed')<{
  readonly message: string;
}> {}

export type Analytics = { readonly token: Redacted.Redacted; readonly zone: string };

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const filterOf = (window: Window) =>
  `{ datetime_geq: "${window.from.toISOString()}", datetime_lt: "${window.to.toISOString()}", requestSource: "eyeball" }`;

const queryOf = (fields: string) =>
  `query ($zone: string!) { viewer { zones(filter: { zoneTag: $zone }) { ${fields} } } }`;

export function totalsQueryOf(windows: ReadonlyArray<Window>): string {
  return queryOf(
    windows
      .map(
        (window, index) =>
          `w${String(index)}: httpRequestsAdaptiveGroups(limit: 1, filter: ${filterOf(window)}) { sum { visits } }`
      )
      .join(' ')
  );
}

const groupSchema = Schema.Struct({
  sum: Schema.Struct({ visits: Schema.Number }),
});

type Group = typeof groupSchema.Type;

const answerSchema = Schema.Struct({
  data: Schema.NullOr(
    Schema.Struct({
      viewer: Schema.Struct({
        zones: Schema.Array(Schema.Record(Schema.String, Schema.Array(groupSchema))),
      }),
    })
  ),
  errors: Schema.optionalKey(
    Schema.NullOr(Schema.Array(Schema.Struct({ message: Schema.String })))
  ),
});

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

const groupsOf = (zone: Readonly<Record<string, ReadonlyArray<Group>>>, key: string) =>
  Option.match(Option.fromUndefinedOr(zone[key]), {
    onNone: () => Effect.fail(failed(`no ${key} in the answer`)),
    onSome: Effect.succeed,
  });

export const decodeTotals = (json: unknown, count: number) =>
  Effect.gen(function* () {
    const zone = yield* zoneOf(json);
    return yield* Effect.forEach(Array.range(0, count - 1), (index) =>
      Effect.map(groupsOf(zone, `w${String(index)}`), (groups) =>
        Option.match(Array.head(groups), { onNone: () => 0, onSome: (group) => group.sum.visits })
      )
    );
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

export const visitsOf = (analytics: Analytics, windows: ReadonlyArray<Window>) =>
  Effect.flatMap(post(analytics, totalsQueryOf(windows)), (json) =>
    decodeTotals(json, windows.length)
  );
