import { Effect, Record } from 'effect';
import { wholeFingerprint } from './fingerprint';
import type { Proof } from './proof';
import type { Dhikr } from './schema';
import type { MalformedMarker } from './variants';
import { statusOf } from './verification';

export type Entry = { readonly id: string; readonly data: Dhikr; readonly body: string };

export const baselineProblems = (
  entries: ReadonlyArray<Entry>,
  proofs: Readonly<Record<string, Proof>>,
  pending: Readonly<Record<string, string>>
): Effect.Effect<ReadonlyArray<string>, MalformedMarker> =>
  Effect.gen(function* () {
    const ids = new Set(entries.map(({ id }) => id));

    const ofDhikr = yield* Effect.forEach(entries, ({ id, data, body }) =>
      Effect.map(statusOf(data, body, Record.get(proofs, id)), ({ state }) => {
        const listed = pending[id];
        if (state === 'proven') {
          return listed === undefined ? [] : [`${id} is proven and must leave the pending list`];
        }
        if (listed === undefined) return [`${id} is ${state} and not pending`];
        return listed === wholeFingerprint(data, body)
          ? []
          : [`${id} changed while pending and must be proven`];
      })
    );

    const orphanRecords = Record.keys(proofs)
      .filter((id) => !ids.has(id))
      .map((id) => `${id} has a record but no dhikr`);
    const orphanPending = Record.keys(pending)
      .filter((id) => !ids.has(id))
      .map((id) => `${id} is pending but no dhikr`);

    return [...ofDhikr.flat(), ...orphanRecords, ...orphanPending];
  });
