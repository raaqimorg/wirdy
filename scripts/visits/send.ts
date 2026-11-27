import { Effect, Schema } from 'effect';
import { argumentsOf, run } from '../run.ts';
import { sendVisits } from './visits.ts';

const USAGE = 'bun run visits [--silent]';

const program = Effect.gen(function* () {
  const [silent] = yield* argumentsOf(
    Schema.Tuple([Schema.optionalKey(Schema.Literal('--silent'))]),
    USAGE
  );
  yield* sendVisits(new Date(), silent !== undefined);
});

run(program);
