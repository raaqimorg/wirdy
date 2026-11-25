import { Array, Console, Effect, FileSystem, Order } from 'effect';
import { wholeFingerprint } from '../../src/lib/fingerprint.ts';
import { PENDING, readAdhkar, RECORDS } from '../../src/lib/records.ts';
import { run, UsageError } from '../run.ts';

const byId = Order.mapInput(Order.String, ([id]: readonly [string, string]) => id);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  if (yield* fs.exists(PENDING)) {
    return yield* new UsageError({
      message: 'verification/pending.json exists, and it only shrinks',
    });
  }

  const entries = Array.sort(
    Array.map(yield* readAdhkar, ({ id, data, body }): readonly [string, string] => [
      id,
      wholeFingerprint(data, body),
    ]),
    byId
  );

  yield* fs.makeDirectory(RECORDS, { recursive: true });
  yield* fs.writeFileString(PENDING, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
  yield* Console.log(`${String(entries.length)} pending`);
});

run(program);
