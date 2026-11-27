import { Console, Effect, FileSystem, Path } from 'effect';
import { pathToFileURL } from 'node:url';
import { screenshot } from '../chromium.ts';
import { plexLatin } from '../opengraph/shared.ts';
import { run } from '../run.ts';
import { filmArguments, openFilm } from './page.ts';
import { HEIGHT, timeLabel, timesOf, WIDTH } from './rules.ts';

const SCALE = 0.25;
const STEP = 0.5;
const COLUMNS = 8;
const GAP = 16;
const LABEL = 40;

const frameWidth = WIDTH * SCALE;
const frameHeight = HEIGHT * SCALE;

const sheetOf = (frames: ReadonlyArray<{ readonly time: number; readonly file: string }>) => {
  const rows = Math.ceil(frames.length / COLUMNS);
  const width = COLUMNS * frameWidth + (COLUMNS + 1) * GAP;
  const height = rows * (frameHeight + LABEL + GAP) + GAP;
  const cells = frames
    .map(
      ({ time, file }) =>
        `<figure><img src="${pathToFileURL(file).href}"><figcaption>${timeLabel(time)}</figcaption></figure>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${plexLatin(500)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${String(width)}px;height:${String(height)}px;padding:${String(GAP)}px;background:#222;color:#eee;font:500 24px "Plex",sans-serif;display:grid;grid-template-columns:repeat(${String(COLUMNS)},${String(frameWidth)}px);gap:${String(GAP)}px;align-content:start}
img{display:block;width:${String(frameWidth)}px;height:${String(frameHeight)}px}
figcaption{height:${String(LABEL - 8)}px;margin-top:8px;text-align:center}
</style></head><body>${cells}</body></html>`;
  return { html, width, height };
};

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { folder } = yield* filmArguments;
  const film = yield* openFilm(folder, { scale: SCALE });
  const temp = yield* fs.makeTempDirectoryScoped({ prefix: 'wirdy-sheet-' });
  const frames = yield* Effect.forEach(timesOf(film.duration, STEP), (time, index) =>
    Effect.gen(function* () {
      yield* film.seek(time);
      const file = path.join(temp, `${String(index).padStart(3, '0')}.png`);
      yield* fs.writeFile(file, yield* film.shot());
      return { time, file };
    })
  );
  const out = path.join(path.resolve(folder), 'out');
  yield* fs.makeDirectory(out, { recursive: true });
  const { html, width, height } = sheetOf(frames);
  const sheet = yield* screenshot({ html, width, height, out: path.join(out, 'sheet.png') });
  yield* Console.log(sheet);
});

run(Effect.scoped(program));
