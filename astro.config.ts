import { NodeServices } from '@effect/platform-node';
import { defineConfig } from 'astro/config';
import { Effect } from 'effect';
import { fileURLToPath } from 'node:url';
import { writeServiceWorker } from './src/lib/offline';
import { SITE } from './src/lib/site';

export default defineConfig({
  output: 'static',
  site: SITE.url,
  integrations: [
    {
      name: 'wirdy:service-worker',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await Effect.runPromise(
            Effect.provide(writeServiceWorker(fileURLToPath(dir)), NodeServices.layer)
          );
        },
      },
    },
  ],
});
