import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { dhikrSchema } from './lib/schema';

const adhkar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/adhkar' }),
  schema: dhikrSchema,
});

export const collections = { adhkar };
