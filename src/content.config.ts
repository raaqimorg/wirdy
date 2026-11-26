import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { Result, Schema } from 'effect';
import { dhikrSchema, STRICT, tibbSchema } from './lib/schema';

const fromEffect = <A>(schema: Schema.Decoder<A>) => {
  const decode = Schema.decodeUnknownResult(schema, STRICT);
  return z.unknown().transform((input, context): A => {
    const decoded = decode(input);
    if (Result.isSuccess(decoded)) return decoded.success;
    context.addIssue({ code: 'custom', message: decoded.failure.message });
    return z.NEVER;
  });
};

const adhkar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/adhkar' }),
  schema: fromEffect(dhikrSchema),
});

const tibb = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tibb' }),
  schema: fromEffect(tibbSchema),
});

export const collections = { adhkar, tibb };
