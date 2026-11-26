import { Array, Effect, FileSystem, Order, Path, Schema } from 'effect';
import matter from 'gray-matter';
import type { Entry } from './baseline';
import { slugOf } from './permalink';
import { decodeProof, type Proof } from './proof';
import { decodeDhikr, decodeTibb, STRICT } from './schema';

export const RECORDS = 'verification';
export const PENDING = `${RECORDS}/pending.json`;
const ADHKAR = 'src/content/adhkar';
const TIBB = 'src/content/tibb';

const pendingSchema = Schema.Record(Schema.String, Schema.String);

export type Pending = typeof pendingSchema.Type;

export const decodePending = Schema.decodeUnknownEffect(pendingSchema, STRICT);

export const parseJson = Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Unknown));

const filesUnder = (folder: string, extension: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    if (!(yield* fs.exists(folder))) return [];
    const paths = yield* fs.readDirectory(folder, { recursive: true });
    return Array.sort(
      Array.filter(paths, (path) => path.endsWith(extension)),
      Order.String
    );
  });

export const readJson = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    return yield* parseJson(yield* fs.readFileString(path));
  });

export const readAdhkar = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const files = yield* filesUnder(ADHKAR, '.md');
  return yield* Effect.forEach(files, (file) =>
    Effect.gen(function* () {
      const { data: frontmatter, content } = matter(
        yield* fs.readFileString(path.join(ADHKAR, file))
      );
      const data = yield* decodeDhikr(frontmatter);
      const entry: Entry = {
        id: `${data.occasion}/${slugOf(file.slice(0, -3))}`,
        data,
        body: content,
      };
      return entry;
    })
  );
});

export const readTibb = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const files = yield* filesUnder(TIBB, '.md');
  return yield* Effect.forEach(files, (file) =>
    Effect.gen(function* () {
      const { data: frontmatter, content } = matter(
        yield* fs.readFileString(path.join(TIBB, file))
      );
      return {
        slug: slugOf(file.slice(0, -3)),
        data: yield* decodeTibb(frontmatter),
        body: content,
      };
    })
  );
});

export const readProofs = Effect.gen(function* () {
  const path = yield* Path.Path;
  const files = Array.filter(
    yield* filesUnder(RECORDS, '.json'),
    (file) => file !== 'pending.json'
  );
  const proofs = yield* Effect.forEach(files, (file) =>
    Effect.map(
      Effect.flatMap(readJson(path.join(RECORDS, file)), decodeProof),
      (proof): readonly [string, Proof] => [file.slice(0, -5), proof]
    )
  );
  return Object.fromEntries(proofs);
});

export const readPending = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  if (!(yield* fs.exists(PENDING))) return {};
  return yield* Effect.flatMap(readJson(PENDING), decodePending);
});
