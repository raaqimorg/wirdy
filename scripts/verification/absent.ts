import { Console, Effect, Schema } from 'effect';
import { argumentsOf, run, today, UsageError } from '../run.ts';
import { readProof, writeProof } from './record.ts';

const program = Effect.gen(function* () {
  const [id, site, ...searches] = yield* argumentsOf(
    Schema.TupleWithRest(Schema.Tuple([Schema.String, Schema.Literals(['hdith', 'sunnah'])]), [
      Schema.String,
    ]).check(Schema.isMinLength(4)),
    'bun run verification:absent <id> <hdith or sunnah> "<search>" "<search>"'
  );
  const proof = yield* readProof(id);
  const absent = { state: 'absent', site, date: yield* today, searches };
  const held = proof.sources.findIndex((source) => source.site === site);
  if (proof.sources[held]?.state === 'present') {
    return yield* new UsageError({ message: `${id} has a page of ${site}` });
  }
  const sources: unknown[] = [...proof.sources];
  sources[held === -1 ? sources.length : held] = absent;

  yield* writeProof(id, { ...proof, sources });
  yield* Console.log(`${id}: ${site} does not have it`);
});

run(program);
