import { NodeHttpServer } from '@effect/platform-node';
import { Effect, FileSystem, Layer, Option, Path } from 'effect';
import { HttpRouter, HttpServerResponse, HttpStaticServer } from 'effect/http';
import { createServer } from 'node:http';
import sharp from 'sharp';
import { root } from '../opengraph/shared.ts';
import { run } from '../run.ts';
import { groupsOf, pageOf, type Image, type Size } from './page.ts';

const PORT = 4400;
const IMAGE = /\.(?:png|svg|ico|jpg|webp)$/u;

const PUBLIC = `${root}/public`;

const sizeOf = (file: string) =>
  Effect.tryPromise(() => sharp(file).metadata()).pipe(
    Effect.map(({ width, height }): Option.Option<Size> => Option.some({ width, height })),
    Effect.orElseSucceed(() => Option.none<Size>())
  );

const readImages = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const files = yield* fs.readDirectory(PUBLIC, { recursive: true });
  return yield* Effect.forEach(
    files.filter((file) => IMAGE.test(file)).map((file) => file.split(path.sep).join('/')),
    (file) =>
      Effect.all({
        info: fs.stat(path.join(PUBLIC, file)),
        size: sizeOf(path.join(PUBLIC, file)),
      }).pipe(
        Effect.map(({ info, size }): Image => ({ path: file, bytes: Number(info.size), size }))
      ),
    { concurrency: 32 }
  );
});

const gallery = HttpRouter.add(
  'GET',
  '/',
  Effect.map(readImages, (images) => HttpServerResponse.html(pageOf(groupsOf(images))))
);

const images = HttpStaticServer.layer({
  root: PUBLIC,
  prefix: '/images',
  cacheControl: 'no-cache',
});

const server = HttpRouter.serve(Layer.mergeAll(gallery, images), { disableLogger: true }).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: PORT }))
);

run(Layer.launch(server));
