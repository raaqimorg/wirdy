import { Console, Data, Effect, Record, Schema } from 'effect';
import { baselineProblems } from '../../src/lib/baseline.ts';
import { readAdhkar, readPending, readProofs } from '../../src/lib/records.ts';
import { statusOf, type Status } from '../../src/lib/verification.ts';
import { argumentsOf, run, UsageError } from '../run.ts';

class BaselineBroken extends Data.TaggedError('BaselineBroken')<{ readonly message: string }> {}

const program = Effect.gen(function* () {
  const [only] = yield* argumentsOf(
    Schema.Tuple([Schema.optionalKey(Schema.String)]),
    'bun run verification [id]'
  );
  const entries = yield* readAdhkar;
  const proofs = yield* readProofs;
  const pending = yield* readPending;

  const states = yield* Effect.forEach(entries, ({ id, data, body }) =>
    Effect.map(statusOf(data, body, Record.get(proofs, id)), (status) => ({ id, ...status }))
  );

  if (only !== undefined) {
    const found = states.find(({ id }) => id === only);
    if (found === undefined)
      return yield* new UsageError({ message: `no dhikr has the id ${only}` });
    yield* Console.log([`${only}: ${found.state}`, ...found.problems].join('\n  '));
    return;
  }

  const count = (state: Status['state']) =>
    String(states.filter((dhikr) => dhikr.state === state).length);
  yield* Console.log(
    `${count('proven')} proven, ${count('changed')} changed, ${count('unproven')} unproven, ${String(Record.size(pending))} pending`
  );
  for (const { id, state, problems } of states) {
    if (state !== 'proven') yield* Console.log(`${id}: ${state} (${problems.join('; ')})`);
  }
  const broken = yield* baselineProblems(entries, proofs, pending);
  if (broken.length > 0) return yield* new BaselineBroken({ message: broken.join('\n') });
});

run(program);
