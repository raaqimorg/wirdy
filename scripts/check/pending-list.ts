import { Console, Data, Effect, Option, Record } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { decodePending, parseJson, type Pending } from '../../src/lib/records.ts';
import { run } from '../run.ts';

const LIST = 'verification/pending.json';

class PendingGrew extends Data.TaggedError('PendingGrew')<{ readonly message: string }> {}

const listAt = (revision: string) =>
  Effect.gen(function* () {
    const git = yield* ChildProcessSpawner.ChildProcessSpawner;
    const object = `${revision}:${LIST}`;
    const code = yield* git.exitCode(ChildProcess.make('git', ['cat-file', '-e', object]));
    if (code !== 0) return Option.none<Pending>();
    const text = yield* git.string(ChildProcess.make('git', ['show', object]));
    return Option.some(yield* Effect.flatMap(parseJson(text), decodePending));
  });

const program = Effect.gen(function* () {
  const allowed = yield* listAt('main');
  const staged = yield* listAt('');
  if (Option.isNone(allowed) || Option.isNone(staged)) return;

  const added = Record.keys(staged.value).filter((id) => staged.value[id] !== allowed.value[id]);
  for (const id of added) yield* Console.error(`[pending-list] ${id} is not in the list of main`);
  if (added.length > 0) {
    return yield* new PendingGrew({ message: `${String(added.length)} entries are not in main` });
  }
});

run(program);
