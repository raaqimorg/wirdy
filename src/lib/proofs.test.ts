import { NodeServices } from '@effect/platform-node';
import { Effect, Order } from 'effect';
import { describe, expect, it } from 'vitest';
import { baselineProblems } from './baseline';
import { readAdhkar, readPending, readProofs } from './records';

const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(Effect.provide(effect, NodeServices.layer));

describe('the proofs of the adhkar', () => {
  it('prove each dhikr that is not pending, and name only adhkar that exist', async () => {
    const problems = await run(
      Effect.flatMap(
        Effect.all([readAdhkar, readProofs, readPending]),
        ([adhkar, proofs, pending]) => baselineProblems(adhkar, proofs, pending)
      )
    );
    expect(problems).toEqual([]);
  });

  it('cover every dhikr, each with its own id', async () => {
    const ids = (await run(readAdhkar)).map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it('keep the pending list sorted', async () => {
    const ids = Object.keys(await run(readPending));
    expect(ids).toEqual(ids.toSorted(Order.String));
  });
});
