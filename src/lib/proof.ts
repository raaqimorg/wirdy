import { Schema } from 'effect';
import type { Claim } from './fingerprint';
import { STRICT } from './schema';

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

const SITES = ['dorar', 'shamela', 'hdith', 'sunnah', 'alukah', 'tanzil'] as const;

export type Site = (typeof SITES)[number];

const words = Schema.Trim.check(Schema.isNonEmpty());
const exact = Schema.String.check(
  Schema.makeFilter((text: string) => text.trim() !== '', { message: 'must not be empty' })
);
const date = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u));
const url = Schema.String.check(
  Schema.makeFilter((text: string) => URL.canParse(text), { message: 'must be a URL' })
);
const site = Schema.Literals(SITES);

const hostname = (text: string) => (URL.canParse(text) ? new URL(text).hostname : '');

const presentSchema = Schema.Struct({
  state: Schema.Literal('present'),
  site,
  url,
  book: words,
  number: words,
  date,
  text: exact,
  grader: Schema.optionalKey(words),
  ruling: Schema.optionalKey(words),
  edition: Schema.optionalKey(words),
  volume: Schema.optionalKey(words),
  page: Schema.optionalKey(words),
}).check(
  Schema.makeFilter((source) => {
    const hosts: ReadonlyArray<string> = HOSTS[source.site];
    const onHost = hosts.includes(hostname(source.url))
      ? []
      : [{ path: ['url'], issue: `must be on ${hosts.join(', ')}` }];
    const placed = (['dorar', 'shamela'] as const).flatMap((owner) =>
      ONLY_ON[owner]
        .filter((field) => (source[field] !== undefined) !== (source.site === owner))
        .map((field) => ({ path: [field], issue: `must be on a ${owner} page, and on no other` }))
    );
    return [...onHost, ...placed];
  })
);

const absentSchema = Schema.Struct({
  state: Schema.Literal('absent'),
  site: Schema.Literals(['hdith', 'sunnah']),
  date,
  searches: Schema.Array(words).check(Schema.isMinLength(2)),
});

const spanSchema = Schema.Struct({
  source: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  text: exact,
});

const fingerprint = Schema.String.check(Schema.isPattern(/^[0-9a-f]{16}$/u));
const claimSchema = Schema.optionalKey(
  Schema.Struct({ fingerprint, spans: Schema.Array(spanSchema).check(Schema.isMinLength(1)) })
);
const takhrijSchema = Schema.optionalKey(
  Schema.Struct({ fingerprint, spans: Schema.Array(spanSchema) })
);

const claimsFields = {
  text: claimSchema,
  count: claimSchema,
  moment: claimSchema,
  manner: claimSchema,
  fadl: claimSchema,
  takhrij: takhrijSchema,
} satisfies Record<Claim, unknown>;

export const proofSchema = Schema.Struct({
  sources: Schema.Array(Schema.Union([presentSchema, absentSchema])),
  claims: Schema.Struct(claimsFields),
  differences: Schema.Array(
    Schema.Struct({
      site,
      phrase: words,
      reason: Schema.Literals(['commanded', 'carried', 'narration', 'reported']),
      shown: spanSchema,
    })
  ),
  rulings: Schema.Array(
    Schema.Struct({ grader: words, book: words, number: words, ruling: words, url })
  ),
});

export type Proof = typeof proofSchema.Type;
export type Source = Proof['sources'][number];
export type Present = Extract<Source, { readonly state: 'present' }>;
export type Span = typeof spanSchema.Type;
export type Difference = Proof['differences'][number];
export type Ruling = Proof['rulings'][number];

export const EMPTY_PROOF: Proof = { sources: [], claims: {}, differences: [], rulings: [] };

export const decodeProof = Schema.decodeUnknownEffect(proofSchema, STRICT);
export const decodeProofSync = Schema.decodeUnknownSync(proofSchema, STRICT);
