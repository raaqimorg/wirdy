import { defineConfig } from 'astro/config';
import { SITE } from './src/lib/site';

export default defineConfig({
  output: 'static',
  site: SITE.url,
});
