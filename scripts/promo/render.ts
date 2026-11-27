import { Console, Effect, FileSystem, Path } from 'effect';
import { run } from '../run.ts';
import { ffmpeg } from './ffmpeg.ts';
import { filmArguments, openFilm } from './page.ts';
import { FPS, frameCount, timeLabel } from './rules.ts';

const DRAFT_SCALE = 0.5;

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { folder, draft } = yield* filmArguments;
  const dir = path.resolve(folder);
  const film = yield* openFilm(dir, { scale: draft ? DRAFT_SCALE : 1 });
  const frames = yield* fs.makeTempDirectoryScoped({ prefix: 'wirdy-render-' });
  const count = frameCount(film.duration);
  for (let index = 0; index < count; index += 1) {
    const time = index / FPS;
    yield* film.seek(time);
    yield* fs.writeFile(
      path.join(frames, `${String(index).padStart(5, '0')}.png`),
      yield* film.shot()
    );
    if (index % FPS === 0) yield* Console.log(`${timeLabel(time)} of ${timeLabel(film.duration)}`);
  }
  const out = path.join(dir, 'out');
  yield* fs.makeDirectory(out, { recursive: true });
  const file = path.join(out, `${path.basename(dir)}${draft ? '-draft' : ''}.mp4`);
  yield* ffmpeg([
    '-framerate',
    String(FPS),
    '-i',
    path.join(frames, '%05d.png'),
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-shortest',
    '-c:v',
    'libx264',
    '-preset',
    draft ? 'veryfast' : 'slow',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    file,
  ]);
  yield* Console.log(file);
});

run(Effect.scoped(program));
