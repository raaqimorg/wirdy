import { Data, Effect } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';

export class FfmpegFailed extends Data.TaggedError('FfmpegFailed')<{ readonly message: string }> {}

export const ffmpeg = (args: ReadonlyArray<string>) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const code = yield* spawner.exitCode(
      ChildProcess.make('ffmpeg', ['-y', '-loglevel', 'error', '-nostdin', ...args], {
        stdout: 'ignore',
        stderr: 'inherit',
      })
    );
    if (code !== 0)
      return yield* new FfmpegFailed({ message: `ffmpeg exited with ${String(code)}` });
  });
