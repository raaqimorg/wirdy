import { Array, Console, Effect, Option, Schema } from 'effect';
import { decodeCaptures, sourceOf } from '../../src/lib/capture.ts';
import { readJson } from '../../src/lib/records.ts';
import { argumentsOf, run, UsageError } from '../run.ts';
import { readProof, writeProof } from './record.ts';

const program = Effect.gen(function* () {
  const [id, from, url] = yield* argumentsOf(
    Schema.Tuple([Schema.String, Schema.String, Schema.String]),
    'bun run verification:ruling <id> <file> <dorar.net url in the file>'
  );

  const proof = yield* readProof(id);
  const captures = Array.ensure(yield* Effect.flatMap(readJson(from), decodeCaptures));
  const capture = Array.findFirst(captures, (page) => page.url === url);
  if (Option.isNone(capture)) return yield* new UsageError({ message: `no capture of ${url}` });
  const { grader, book, number, ruling } = yield* sourceOf(capture.value);
  const rulings = [
    ...proof.rulings.filter((other) => other.url !== url),
    { grader, book, number, ruling, url },
  ];

  yield* writeProof(id, { ...proof, rulings });
  yield* Console.log(`${id}: ${grader ?? ''}, ${book} ${number}: ${ruling ?? ''}`);
});

run(program);
