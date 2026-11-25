import { wholeFingerprint } from './fingerprint';
import type { Proof } from './proof';
import type { Dhikr } from './schema';
import { statusOf } from './verification';

export type Entry = { id: string; data: Dhikr; body: string };

export function baselineProblems(
  entries: Entry[],
  proofs: Record<string, Proof>,
  pending: Record<string, string>
): string[] {
  const ids = new Set(entries.map(({ id }) => id));

  const ofDhikr = entries.flatMap(({ id, data, body }) => {
    const { state } = statusOf(data, body, proofs[id]);
    const listed = pending[id];
    if (state === 'proven') {
      return listed ? [`${id} is proven and must leave the pending list`] : [];
    }
    if (!listed) return [`${id} is ${state} and not pending`];
    return listed === wholeFingerprint(data, body)
      ? []
      : [`${id} changed while pending and must be proven`];
  });

  const orphanRecords = Object.keys(proofs)
    .filter((id) => !ids.has(id))
    .map((id) => `${id} has a record but no dhikr`);
  const orphanPending = Object.keys(pending)
    .filter((id) => !ids.has(id))
    .map((id) => `${id} is pending but no dhikr`);

  return [...ofDhikr, ...orphanRecords, ...orphanPending];
}
