import { z } from 'zod';
import type { Claim } from './fingerprint';

const HOSTS = {
  dorar: ['dorar.net'],
  shamela: ['shamela.ws'],
  hdith: ['hdith.com'],
  sunnah: ['sunnah.com'],
  alukah: ['www.alukah.net'],
  tanzil: ['tanzil.net'],
} as const;

const ONLY_ON = {
  dorar: ['grader', 'ruling'],
  shamela: ['edition', 'volume', 'page'],
} as const;

const words = z.string().trim().min(1);
const exact = z.string().refine((text) => text.trim() !== '', { message: 'must not be empty' });
const date = z.iso.date();
const site = z.enum(['dorar', 'shamela', 'hdith', 'sunnah', 'alukah', 'tanzil']);

const presentSchema = z
  .strictObject({
    state: z.literal('present'),
    site,
    url: z.url(),
    book: words,
    number: words,
    date,
    text: exact,
    grader: words.optional(),
    ruling: words.optional(),
    edition: words.optional(),
    volume: words.optional(),
    page: words.optional(),
  })
  .superRefine((source, context) => {
    const hosts: readonly string[] = HOSTS[source.site];
    if (!hosts.includes(new URL(source.url).hostname)) {
      context.addIssue({ code: 'custom', path: ['url'], message: `must be on ${hosts[0]}` });
    }
    for (const owner of ['dorar', 'shamela'] as const) {
      for (const field of ONLY_ON[owner]) {
        if ((source[field] !== undefined) !== (source.site === owner)) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: `must be on a ${owner} page, and on no other`,
          });
        }
      }
    }
  });

const absentSchema = z.strictObject({
  state: z.literal('absent'),
  site: z.enum(['hdith', 'sunnah']),
  date,
  searches: z.array(words).min(2),
});

const spanSchema = z.strictObject({ source: z.number().int().nonnegative(), text: exact });

const fingerprint = z.string().regex(/^[0-9a-f]{16}$/);
const claimSchema = z.strictObject({ fingerprint, spans: z.array(spanSchema).min(1) }).optional();
const takhrijSchema = z.strictObject({ fingerprint, spans: z.array(spanSchema) }).optional();

export const proofSchema = z.strictObject({
  sources: z.array(z.discriminatedUnion('state', [presentSchema, absentSchema])),
  claims: z.strictObject({
    text: claimSchema,
    count: claimSchema,
    moment: claimSchema,
    manner: claimSchema,
    fadl: claimSchema,
    takhrij: takhrijSchema,
  } satisfies Record<Claim, unknown>),
  differences: z.array(
    z.strictObject({
      site,
      phrase: words,
      reason: z.enum(['commanded', 'carried', 'narration', 'reported']),
      shown: spanSchema,
    })
  ),
  rulings: z.array(
    z.strictObject({ grader: words, book: words, number: words, ruling: words, url: z.url() })
  ),
});

export type Proof = z.infer<typeof proofSchema>;
export type Source = Proof['sources'][number];
export type Present = Extract<Source, { state: 'present' }>;
export type Span = z.infer<typeof spanSchema>;
