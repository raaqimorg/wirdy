import { z } from 'zod';
import { OCCASION_IDS } from './occasions';

const dorarUrl = z
  .url()
  .refine((url) => /^https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+$/.test(url), {
    message: 'must be a dorar.net hadith page, not a search',
  });

export const dhikrSchema = z.strictObject({
  occasion: z.enum(OCCASION_IDS),
  order: z.number().int().positive(),
  count: z.number().int().positive(),
  mode: z.enum(['both', 'sabah', 'masaa']).default('both'),
  quran: z.boolean().default(false),
  ayat: z.enum(['all', 'first']).default('all'),
  when: z.string().min(1).optional(),
  takhrij: z.strictObject({
    grader: z.enum(['البخاري', 'مسلم', 'الألباني']),
    source: z.string().min(1),
    ruling: z.string().min(1),
    url: dorarUrl,
  }),
  note: z.string().min(1).optional(),
});

export type Dhikr = z.infer<typeof dhikrSchema>;
