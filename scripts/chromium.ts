import { Array, Data, Effect, FileSystem, Option, Path } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { pathToFileURL } from 'node:url';

export class NoBrowser extends Data.TaggedError('NoBrowser')<{ readonly message: string }> {}

export class ScreenshotFailed extends Data.TaggedError('ScreenshotFailed')<{
  readonly message: string;
}> {}

const BROWSERS: ReadonlyArray<string | undefined> = [
  process.env['CHROME'],
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

type Shot = {
  readonly html: string;
  readonly width: number;
  readonly height: number;
  readonly out: string;
  readonly scale?: number;
  readonly transparent?: boolean;
};

const browser = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const found = yield* Effect.filter(
    Array.filter(BROWSERS, (path): path is string => path !== undefined),
    (path) => fs.exists(path)
  );
  return yield* Option.match(Array.head(found), {
    onSome: Effect.succeed,
    onNone: () =>
      Effect.fail(new NoBrowser({ message: 'no chromium-based browser found; set CHROME to one' })),
  });
});

export const screenshot = ({ html, width, height, out, scale = 1, transparent = false }: Shot) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const binary = yield* browser;
    const page = path.join(yield* fs.makeTempDirectory({ prefix: 'wirdy-' }), 'page.html');
    yield* fs.writeFileString(page, html);
    const code = yield* spawner.exitCode(
      ChildProcess.make(binary, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-sandbox',
        `--window-size=${String(width)},${String(height)}`,
        `--force-device-scale-factor=${String(scale)}`,
        ...(transparent ? ['--default-background-color=00000000'] : []),
        `--screenshot=${out}`,
        pathToFileURL(page).href,
      ])
    );
    if (code !== 0) {
      return yield* new ScreenshotFailed({ message: `${binary} exited with ${String(code)}` });
    }
    return out;
  });
