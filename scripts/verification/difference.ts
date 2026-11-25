import { Console, Effect, Option, Schema } from 'effect';
import { normalize, spanOf } from '../../src/lib/matching.ts';
import { argumentsOf, run, UsageError } from '../run.ts';
import { readProof, writeProof } from './record.ts';

const program = Effect.gen(function* () {
  const [id, site, phrase, reason, at, words] = yield* argumentsOf(
    Schema.Tuple([
      Schema.String,
      Schema.String,
      Schema.String,
      Schema.String,
      Schema.NumberFromString,
      Schema.String,
    ]),
    'bun run verification:difference <id> <site> "<phrase>" <reason> <source> "<words in the source>"'
  );

  const proof = yield* readProof(id);
  const page = proof.sources[at];
  const text = page?.state === 'present' ? spanOf(page.text, words) : Option.none();
  if (Option.isNone(text)) {
    return yield* new UsageError({ message: `source ${String(at)} does not have these words` });
  }

  const kept = proof.differences.filter(
    (other) => other.site !== site || normalize(other.phrase) !== normalize(phrase)
  );
  const differences = [...kept, { site, phrase, reason, shown: { source: at, text: text.value } }];

  yield* writeProof(id, { ...proof, differences });
  yield* Console.log(`${id}: ${site} differs at «${phrase}»`);
});

run(program);
