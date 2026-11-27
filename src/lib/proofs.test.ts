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

  it('number each قرآن آية as its Tanzil source does', async () => {
    const [adhkar, proofs] = await run(Effect.all([readAdhkar, readProofs]));
    const quran = adhkar.filter(({ data }) => data.quran);
    expect(quran.length).toBeGreaterThan(0);
    for (const { id, data, body } of quran) {
      const tanzil = proofs[id]!.sources.find((source) => source.site === 'tanzil');
      const ranges = [
        ...(tanzil?.state === 'present' ? tanzil.number : '').matchAll(
          /\d+:(\d+)(?:-\d+:(\d+))?/gu
        ),
      ].map(([, from, to]) => ({
        from: Number(from),
        length: Number(to ?? from) - Number(from) + 1,
      }));
      const suwar = body
        .trim()
        .split(/\n\s*\n/u)
        .map((surah) => surah.split('\n').filter((ayah) => ayah.trim() !== '').length);
      expect({ id, from: data.from }).toEqual({ id, from: ranges.map(({ from }) => from) });
      expect({ id, suwar }).toEqual({ id, suwar: ranges.map(({ length }) => length) });
    }
  });

  it('keep the pending list sorted', async () => {
    const ids = Object.keys(await run(readPending));
    expect(ids).toEqual(ids.toSorted(Order.String));
  });
});
