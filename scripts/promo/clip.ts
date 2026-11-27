import { Console, Effect, FileSystem, Path, Schema } from 'effect';
import { argumentsOf, run } from '../run.ts';
import { ffmpeg } from './ffmpeg.ts';
import { FPS } from './rules.ts';

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const [folder, recording, name] = yield* argumentsOf(
    Schema.Tuple([Schema.String, Schema.String, Schema.String]),
    'bun run promo:clip <folder> <recording> <name>'
  );
  const clips = path.join(path.resolve(folder), 'clips');
  yield* fs.makeDirectory(clips, { recursive: true });
  const out = path.join(clips, `${name}.mp4`);
  yield* ffmpeg([
    '-i',
    recording,
    '-an',
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-g',
    '1',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    out,
  ]);
  yield* Console.log(out);
});

run(program);
