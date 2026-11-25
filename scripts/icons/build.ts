import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Console, Effect, FileSystem, Path } from 'effect';
import { markSvg } from '../../src/lib/mark.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { screenshot } from '../chromium.ts';
import { run } from '../run.ts';

const PUBLIC = join(import.meta.dirname, '..', '..', 'public');
const SOURCE = pathToFileURL(join(PUBLIC, 'favicon.svg')).href;

const ICO_SIZES = [16, 32, 48] as const;
const PNG_SIZE = 32;
const TOUCH_SIZE = 180;
const MANIFEST_SIZES = [192, 512] as const;
const TOUCH_INSET = 0.72;
const TOUCH_BACKGROUND = PALETTE.eggshell;

const page = (
  size: number,
  background: string | undefined
) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}
html,body{width:${size}px;height:${size}px;background:${background ?? 'transparent'};overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
img{display:block;width:${Math.round(size * (background === undefined ? 1 : TOUCH_INSET))}px;height:auto}
</style></head><body><img src="${SOURCE}"></body></html>`;

const render = (size: number, background?: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const out = path.join(yield* fs.makeTempDirectory({ prefix: 'icons-' }), `${String(size)}.png`);
    yield* screenshot({
      html: page(size, background),
      width: size,
      height: size,
      out,
      transparent: background === undefined,
    });
    return yield* fs.readFile(out);
  });

const ico = (images: ReadonlyArray<{ readonly size: number; readonly data: Uint8Array }>) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
};

const write = (name: string, data: string | Uint8Array) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    if (typeof data === 'string') yield* fs.writeFileString(join(PUBLIC, name), data);
    else yield* fs.writeFile(join(PUBLIC, name), data);
    yield* Console.log(join('public', name));
  });

const program = Effect.gen(function* () {
  yield* write('favicon.svg', markSvg());
  const images = yield* Effect.forEach(ICO_SIZES, (size) =>
    Effect.map(render(size), (data) => ({ size, data }))
  );
  yield* write('favicon.ico', ico(images));
  yield* write(`favicon-${String(PNG_SIZE)}x${String(PNG_SIZE)}.png`, yield* render(PNG_SIZE));
  yield* write('apple-touch-icon.png', yield* render(TOUCH_SIZE, TOUCH_BACKGROUND));
  for (const size of MANIFEST_SIZES) {
    yield* write(`icon-${String(size)}.png`, yield* render(size, TOUCH_BACKGROUND));
  }
});

run(program);
