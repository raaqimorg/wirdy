import { Array, Effect, FileSystem, Option, Order, Path } from 'effect';
import { createHash } from 'node:crypto';
import { SEARCH_INDEX } from './search';

export const SERVICE_WORKER = 'service-worker.js';
export const MANIFESTS = 'offline';
export const OFFLINE_PAGE = '/bila-ittisal/';
const TEMPLATE = 'src/scripts/service-worker.js';
const FILES = ['_astro/'];
const KEPT = new Set([SEARCH_INDEX.slice(1)]);

export type Manifest = {
  readonly pages: Readonly<Record<string, string>>;
  readonly files: ReadonlyArray<string>;
  readonly prefetch: ReadonlyArray<string>;
};

export type Built = {
  readonly pages: ReadonlyArray<readonly [file: string, bytes: Uint8Array]>;
  readonly files: ReadonlyArray<string>;
};

export function pathOf(file: string): Option.Option<string> {
  if (KEPT.has(file)) return Option.some(`/${file}`);
  if (file === 'index.html') return Option.some('/');
  if (!file.endsWith('/index.html')) return Option.none();
  return Option.some(`/${file.slice(0, -'index.html'.length)}`);
}

export function prefetchOf(home: string): ReadonlyArray<string> {
  return Array.dedupe(
    [...home.matchAll(/<a class="occasion-card [^"]*" href="(\/[^"]*)"/gu)].map(
      ([, href]) => href ?? ''
    )
  );
}

function hashOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16);
}

export function manifestOf({ pages, files }: Built): Manifest {
  const hashed = Array.getSomes(
    pages.map(([file, bytes]) =>
      Option.map(pathOf(file), (path): readonly [string, string] => [path, hashOf(bytes)])
    )
  );
  const home = pages.find(([file]) => file === 'index.html');
  const sections = home ? prefetchOf(new TextDecoder().decode(home[1])) : [];
  const kept = [OFFLINE_PAGE, SEARCH_INDEX].filter((path) =>
    hashed.some(([known]) => known === path)
  );
  const assets = Array.sort(
    files.map((file) => `/${file}`),
    Order.String
  );
  return {
    pages: Object.fromEntries(
      Array.sort(
        hashed,
        Order.mapInput(Order.String, (entry: readonly [string, string]) => entry[0])
      )
    ),
    files: assets,
    prefetch: ['/', ...sections, ...kept, ...assets],
  };
}

export function serviceWorkerOf({ pages, files, prefetch }: Manifest, template: string) {
  const hashes = `${JSON.stringify(pages)}\n`;
  const file = `${MANIFESTS}/${hashOf(new TextEncoder().encode(hashes))}.json`;
  const worker = `self.MANIFEST = ${JSON.stringify({
    hashes: `/${file}`,
    files,
    index: SEARCH_INDEX,
    offline: OFFLINE_PAGE,
    prefetch,
  })};\n${template}`;
  return { file, hashes, worker };
}

export const readBuilt = (dist: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const all = Array.sort(yield* fs.readDirectory(dist, { recursive: true }), Order.String);
    const kept = Array.filter(all, (file) => file.endsWith('index.html') || KEPT.has(file));
    const pages = yield* Effect.forEach(kept, (file) =>
      Effect.map(fs.readFile(path.join(dist, file)), (bytes): readonly [string, Uint8Array] => [
        file,
        bytes,
      ])
    );
    const files = yield* Effect.filter(
      Array.filter(all, (file) => FILES.some((folder) => file.startsWith(folder))),
      (file) => Effect.map(fs.stat(path.join(dist, file)), (info) => info.type === 'File')
    );
    const built: Built = { pages, files };
    return built;
  });

export const writeServiceWorker = (dist: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const manifest = manifestOf(yield* readBuilt(dist));
    const { file, hashes, worker } = serviceWorkerOf(manifest, yield* fs.readFileString(TEMPLATE));
    yield* fs.makeDirectory(path.join(dist, MANIFESTS), { recursive: true });
    yield* fs.writeFileString(path.join(dist, file), hashes);
    yield* fs.writeFileString(path.join(dist, SERVICE_WORKER), worker);
    return manifest;
  });
