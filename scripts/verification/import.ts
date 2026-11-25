import { parseArgs } from 'node:util';
import { Array, Console, Data, Effect, Option, Schema } from 'effect';
import {
  captureOfMarkdown,
  decodeCaptures,
  sourceOf,
  type Capture,
} from '../../src/lib/capture.ts';
import { readAdhkar, readJson } from '../../src/lib/records.ts';
import { argumentsOf, run, today, UsageError } from '../run.ts';
import { readProofOrEmpty, writeProof } from './record.ts';

class FetchFailed extends Data.TaggedError('FetchFailed')<{ readonly message: string }> {}

const USAGE =
  'bun run verification:import <id> <file or hdith.com url> [url in the file] [--number <n>]';

const fetchMarkdown = (from: string) =>
  Effect.gen(function* () {
    const url = `${from.replace(/\.md$/u, '')}.md`;
    const failed = (cause: unknown) => new FetchFailed({ message: `${url}: ${String(cause)}` });
    const response = yield* Effect.tryPromise({ try: () => fetch(url), catch: failed });
    if (!response.ok) return yield* failed(`answered ${String(response.status)}`);
    return yield* Effect.tryPromise({ try: () => response.text(), catch: failed });
  });

const readCapture = (from: string, url: Option.Option<string>) =>
  Effect.gen(function* () {
    if (from.startsWith('https://hdith.com/')) {
      return yield* captureOfMarkdown(yield* fetchMarkdown(from), yield* today);
    }
    const captures = Array.ensure(yield* Effect.flatMap(readJson(from), decodeCaptures));
    const found: ReadonlyArray<Capture> = Option.match(url, {
      onNone: () => captures,
      onSome: (wanted) => captures.filter((capture) => capture.url === wanted),
    });
    const [only, ...rest] = found;
    if (only === undefined || rest.length > 0) {
      return yield* new UsageError({
        message: `${String(found.length)} captures match; name one url`,
      });
    }
    return only;
  });

const program = Effect.gen(function* () {
  const { values, positionals } = yield* Effect.try({
    try: () => parseArgs({ allowPositionals: true, options: { number: { type: 'string' } } }),
    catch: () => new UsageError({ message: `usage: ${USAGE}` }),
  });
  const [id, from, url] = yield* argumentsOf(
    Schema.Tuple([Schema.String, Schema.String, Schema.optionalKey(Schema.String)]),
    USAGE,
    positionals
  );
  if (!(yield* readAdhkar).some((dhikr) => dhikr.id === id)) {
    return yield* new UsageError({ message: `usage: ${USAGE}` });
  }

  const proof = yield* readProofOrEmpty(id);
  const source = yield* sourceOf(
    yield* readCapture(from, Option.fromUndefinedOr(url)),
    Option.fromUndefinedOr(values.number)
  );
  const held = proof.sources.findIndex(
    (other) => other.state === 'present' && other.url === source.url
  );
  const index = held === -1 ? proof.sources.length : held;
  const sources = [...proof.sources];
  sources[index] = source;

  yield* writeProof(id, { ...proof, sources });
  yield* Console.log(
    `${id}: source ${String(index)} is ${source.site}, ${source.book} ${source.number}`
  );
});

run(program);
