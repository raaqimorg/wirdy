import { Array, Console, Effect, Option, Schema } from 'effect';
import { CLAIMS, fingerprintOf } from '../../src/lib/fingerprint.ts';
import { spanOf, spansOf } from '../../src/lib/matching.ts';
import type { Proof } from '../../src/lib/proof.ts';
import { readAdhkar } from '../../src/lib/records.ts';
import { textFormsOf } from '../../src/lib/variants.ts';
import { argumentsOf, run, UsageError } from '../run.ts';
import { readProof, writeProof } from './record.ts';

const USAGE = 'bun run verification:claim <id> <claim> <source> "<words in the source>"';

const cutsOf = (proof: Proof, index: number, words: Option.Option<string>, body: string) =>
  Effect.gen(function* () {
    const page = proof.sources[index];
    if (page?.state !== 'present') return Option.none();
    if (Option.isSome(words)) return Option.map(spanOf(page.text, words.value), Array.of);
    const forms = yield* textFormsOf(body.trim());
    return Option.some(forms.flatMap((form) => spansOf(page.text, form)));
  });

const program = Effect.gen(function* () {
  const [id, claim, at, given] = yield* argumentsOf(
    Schema.Tuple([
      Schema.String,
      Schema.Literals(CLAIMS),
      Schema.NumberFromString,
      Schema.optionalKey(Schema.String),
    ]),
    USAGE
  );
  const words = Option.fromUndefinedOr(given);
  if (claim !== 'takhrij' && claim !== 'text' && Option.isNone(words)) {
    return yield* new UsageError({ message: `usage: ${USAGE}` });
  }
  const dhikr = Array.findFirst(yield* readAdhkar, (entry) => entry.id === id);
  if (Option.isNone(dhikr)) return yield* new UsageError({ message: `no dhikr has the id ${id}` });
  const { data, body } = dhikr.value;

  const proof = yield* readProof(id);
  const found = claim === 'takhrij' ? Option.some([]) : yield* cutsOf(proof, at, words, body);
  if (Option.isNone(found)) {
    return yield* new UsageError({ message: `source ${String(at)} does not have these words` });
  }
  const cuts: ReadonlyArray<string> = found.value;

  const kept = (proof.claims[claim]?.spans ?? []).filter(
    (span) => !(span.source === at && cuts.includes(span.text))
  );
  const claims = {
    ...proof.claims,
    [claim]: {
      fingerprint: fingerprintOf(claim, data, body),
      spans: [...kept, ...cuts.map((text) => ({ source: at, text }))],
    },
  };
  const next = yield* writeProof(id, { ...proof, claims });
  yield* Console.log(`${id}: ${claim} has ${String(next.claims[claim]?.spans.length ?? 0)} spans`);
});

run(program);
