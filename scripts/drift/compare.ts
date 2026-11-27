import { Data, Effect, FileSystem, Path } from 'effect';
import sharp from 'sharp';
import { keyOf, type Flag } from './census.ts';

export type Keyed = Pick<Flag, 'selector' | 'property' | 'value'>;

class ImageUnreadable extends Data.TaggedError('ImageUnreadable')<{ readonly message: string }> {}

const CHANNEL_TOLERANCE = 8;

export type Image = {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
};

export type Change =
  | { readonly kind: 'added'; readonly file: string }
  | { readonly kind: 'resized'; readonly file: string; readonly from: string; readonly to: string }
  | {
      readonly kind: 'changed';
      readonly file: string;
      readonly pixels: number;
      readonly share: number;
    };

export const differenceOf = (before: Image, after: Image) => {
  const mask = new Uint8Array(after.width * after.height);
  let pixels = 0;
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(
        (before.pixels[offset + channel] ?? 0) - (after.pixels[offset + channel] ?? 0)
      );
      if (delta > CHANNEL_TOLERANCE) {
        mask[index] = 1;
        pixels += 1;
        break;
      }
    }
  }
  return { pixels, mask };
};

export const flagChangesOf = <A extends Keyed>(
  before: ReadonlyArray<Keyed>,
  after: ReadonlyArray<A>
) => {
  const known = new Set(before.map((finding) => keyOf(finding)));
  const kept = new Set(after.map((finding) => keyOf(finding)));
  return {
    added: after.filter((finding) => !known.has(keyOf(finding))),
    removed: before.filter((finding) => !kept.has(keyOf(finding))),
  };
};

const imageOf = (file: string) =>
  Effect.tryPromise({
    try: async () => {
      const { data, info } = await sharp(file)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      return { width: info.width, height: info.height, pixels: new Uint8Array(data) };
    },
    catch: (cause) => new ImageUnreadable({ message: `${file}: ${String(cause)}` }),
  });

const marked = (after: Image, mask: Uint8Array, out: string) =>
  Effect.tryPromise({
    try: async () => {
      const pixels = Uint8Array.from(after.pixels);
      for (let index = 0; index < mask.length; index += 1) {
        const offset = index * 4;
        if (mask[index] === 1) pixels.set([255, 0, 64, 255], offset);
        else pixels[offset + 3] = 96;
      }
      await sharp(pixels, { raw: { width: after.width, height: after.height, channels: 4 } })
        .png()
        .toFile(out);
    },
    catch: (cause) => new ImageUnreadable({ message: `${out}: ${String(cause)}` }),
  });

const pngsIn = (dir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    if (!(yield* fs.exists(dir))) return [];
    return (yield* fs.readDirectory(dir, { recursive: true })).filter((file) =>
      file.endsWith('.png')
    );
  });

export const changesOf = (baseline: string, current: string, diffs: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const before = new Set(yield* pngsIn(baseline));
    const after = yield* pngsIn(current);
    const changes: Array<Change> = [];
    for (const file of after.toSorted()) {
      if (!before.has(file)) {
        changes.push({ kind: 'added', file });
        continue;
      }
      const old = yield* imageOf(path.join(baseline, file));
      const now = yield* imageOf(path.join(current, file));
      if (old.width !== now.width || old.height !== now.height) {
        changes.push({
          kind: 'resized',
          file,
          from: `${String(old.width)}×${String(old.height)}`,
          to: `${String(now.width)}×${String(now.height)}`,
        });
        continue;
      }
      const { pixels, mask } = differenceOf(old, now);
      if (pixels === 0) continue;
      const out = path.join(diffs, file);
      yield* fs.makeDirectory(path.dirname(out), { recursive: true });
      yield* marked(now, mask, out);
      changes.push({ kind: 'changed', file, pixels, share: pixels / mask.length });
    }
    return changes;
  });

export const changeLabel = (change: Change) => {
  switch (change.kind) {
    case 'changed':
      return `changed  ${change.file} (${String(change.pixels)} px, ${(change.share * 100).toFixed(2)}%)`;
    case 'resized':
      return `resized  ${change.file} (${change.from} to ${change.to})`;
    case 'added':
      return `added    ${change.file}`;
  }
};
