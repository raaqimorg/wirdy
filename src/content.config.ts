import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { dhikrSchema, unprovenSchema } from './lib/schema';

const adhkar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/adhkar' }),
  schema: dhikrSchema,
});

const unproven = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/unproven' }),
  schema: unprovenSchema,
});

export const collections = { adhkar, unproven };
