import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { markSvg } from '../../src/lib/mark.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { screenshot } from '../chromium.mjs';

const PUBLIC = join(import.meta.dirname, '..', '..', 'public');
const SOURCE = pathToFileURL(join(PUBLIC, 'favicon.svg')).href;

const ICO_SIZES = [16, 32, 48];
const PNG_SIZE = 32;
const TOUCH_SIZE = 180;
const MANIFEST_SIZES = [192, 512];
const TOUCH_INSET = 0.72;
const TOUCH_BACKGROUND = PALETTE.eggshell;

const page = (size, background) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}
html,body{width:${size}px;height:${size}px;background:${background ?? 'transparent'};overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
img{display:block;width:${Math.round(size * (background ? TOUCH_INSET : 1))}px;height:auto}
</style></head><body><img src="${SOURCE}"></body></html>`;

const render = (size, background) => {
  const out = join(mkdtempSync(join(tmpdir(), 'icons-')), `${size}.png`);
  screenshot({
    html: page(size, background),
    width: size,
    height: size,
    out,
    transparent: !background,
  });
  return readFileSync(out);
};

const ico = (images) => {
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

const write = (name, data) => {
  writeFileSync(join(PUBLIC, name), data);
  console.log(join('public', name));
};

write('favicon.svg', markSvg());
write('favicon.ico', ico(ICO_SIZES.map((size) => ({ size, data: render(size) }))));
write(`favicon-${PNG_SIZE}x${PNG_SIZE}.png`, render(PNG_SIZE));
write('apple-touch-icon.png', render(TOUCH_SIZE, TOUCH_BACKGROUND));
for (const size of MANIFEST_SIZES) {
  write(`icon-${size}.png`, render(size, TOUCH_BACKGROUND));
}
