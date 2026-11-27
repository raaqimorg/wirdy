import { Console, Data, Effect, FileSystem, Path } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { FORMATS, posterFile, postersOf, themesOf, type Format } from '../../src/lib/poster.ts';
import { readAdhkar, readTibb } from '../../src/lib/records.ts';
import { browser } from '../chromium.ts';
import { root } from '../opengraph/shared.ts';
import { run } from '../run.ts';
import { pageOf } from './page.ts';

class RenderFailed extends Data.TaggedError('RenderFailed')<{ readonly message: string }> {}

class Unfit extends Data.TaggedError('Unfit')<{ readonly message: string }> {}

const SCALE = 3;
const TIMEOUT = '2 minutes';

const flags = ({ width, height }: Format, scale: number) => [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-sandbox',
  '--virtual-time-budget=20000',
  `--window-size=${String(width)},${String(height)}`,
  `--force-device-scale-factor=${String(scale)}`,
];

const pageUrl = (html: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const file = path.join(yield* fs.makeTempDirectory({ prefix: 'wirdy-poster-' }), 'page.html');
    yield* fs.writeFileString(file, html);
    return pathToFileURL(file).href;
  });

const fitOf = (html: string, format: Format) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const dom = yield* spawner.string(
      ChildProcess.make(yield* browser, [...flags(format, 1), '--dump-dom', yield* pageUrl(html)])
    );
    const body = /<body([^>]*)>/u.exec(dom)?.[1] ?? '';
    const size = /data-size="([^"]*)"/u.exec(body)?.[1];
    if (size === undefined)
      return yield* new RenderFailed({ message: 'the page reported no size' });
    return {
      size,
      columns: /data-cols="([^"]*)"/u.exec(body)?.[1] ?? '',
      fits: body.includes('data-fits="true"'),
    };
  }).pipe(Effect.timeout(TIMEOUT), Effect.retry({ times: 3 }));

const shoot = (html: string, format: Format, out: string) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const code = yield* spawner.exitCode(
      ChildProcess.make(yield* browser, [
        ...flags(format, SCALE),
        `--screenshot=${out}`,
        yield* pageUrl(html),
      ])
    );
    if (code !== 0) {
      return yield* new RenderFailed({
        message: `${out}: the browser exited with ${String(code)}`,
      });
    }
    return out;
  }).pipe(Effect.timeout(TIMEOUT), Effect.retry({ times: 3 }));

const compress = (out: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const png = yield* Effect.tryPromise({
      try: () =>
        sharp(out)
          .png({ palette: true, quality: 100, colours: 256, dither: 0, compressionLevel: 9 })
          .toBuffer(),
      catch: () => new RenderFailed({ message: `${out}: the PNG could not be compressed` }),
    });
    yield* fs.writeFile(out, new Uint8Array(png));
  });

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const publicDir = path.join(root, 'public');
  const postersDir = path.join(publicDir, 'posters');
  const posters = yield* postersOf(yield* readAdhkar, yield* readTibb);
  const entries = posters.flatMap((poster) =>
    FORMATS.flatMap((format) =>
      themesOf(format).map((theme) => ({
        poster,
        format,
        theme,
        file: posterFile(poster, format, theme),
      }))
    )
  );

  const wanted = new Set(entries.map(({ file }) => file));
  if (yield* fs.exists(postersDir)) {
    for (const file of yield* fs.readDirectory(postersDir, { recursive: true })) {
      if (file.endsWith('.png') && !wanted.has(`posters/${file}`)) {
        yield* fs.remove(path.join(postersDir, file));
      }
    }
    const slugs = new Set(posters.map(({ slug }) => slug));
    for (const dir of yield* fs.readDirectory(postersDir)) {
      if (!slugs.has(dir)) yield* fs.remove(path.join(postersDir, dir), { recursive: true });
    }
  }

  for (const { poster, format, theme, file } of entries) {
    const out = path.join(publicDir, file);
    if (yield* fs.exists(out)) continue;
    const html = pageOf(poster, format, theme);
    const { size, columns, fits } = yield* fitOf(html, format);
    if (!fits) {
      return yield* new Unfit({
        message: `${poster.heading} (${theme}) does not fit the ${format.ratio} frame, even at ${size} px`,
      });
    }
    yield* fs.makeDirectory(path.dirname(out), { recursive: true });
    yield* shoot(html, format, out);
    yield* compress(out);
    yield* Console.log(`${file} ${size} px, ${columns} columns`);
  }
});

run(program);
