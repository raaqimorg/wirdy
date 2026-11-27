import { Effect, Schema } from 'effect';
import type { SchemaAST } from 'effect';
import { OCCASION_IDS } from './occasions';

export const STRICT: SchemaAST.ParseOptions = { onExcessProperty: 'error', errors: 'all' };

const DORAR = /^https:\/\/dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+$/u;

const text = Schema.NonEmptyString;
const positive = Schema.Int.check(Schema.isGreaterThan(0));

const dorarUrl = Schema.String.check(
  Schema.isPattern(DORAR, { message: 'must be a dorar.net hadith page, not a search' })
);

const withDefault = <const L extends string | boolean>(literals: Schema.Codec<L>, value: L) =>
  literals.pipe(Schema.withDecodingDefaultKey(Effect.succeed(value)));

export const MODES = ['both', 'sabah', 'masaa'] as const;
export const FORMS = [1, 2, 3, 4] as const;

export const dhikrSchema = Schema.Struct({
  title: text,
  context: Schema.optionalKey(text),
  occasion: Schema.Literals(OCCASION_IDS),
  order: positive,
  count: positive,
  counts: Schema.optionalKey(Schema.Array(positive).check(Schema.isMinLength(2))),
  mode: withDefault(Schema.Literals(MODES), 'both'),
  quran: withDefault(Schema.Boolean, false),
  ayat: withDefault(Schema.Literals(['all', 'first', 'fold']), 'all'),
  when: Schema.optionalKey(text),
  how: Schema.optionalKey(text),
  group: Schema.optionalKey(text),
  form: Schema.optionalKey(Schema.Literals(FORMS)),
  fadl: Schema.optionalKey(text),
  takhrij: Schema.Struct({
    grader: Schema.Literals(['البخاري', 'مسلم', 'الألباني']),
    source: text,
    ruling: text,
    url: dorarUrl,
  }),
  note: Schema.optionalKey(text),
});

export type Dhikr = typeof dhikrSchema.Type;
export type Mode = Dhikr['mode'];
export type Takhrij = Dhikr['takhrij'];

const SOURCE =
  /^https:\/\/(dorar\.net\/(hadith\/sharh|h)\/[A-Za-z0-9]+|sunnah\.com\/[a-z]+:[0-9]+[a-z]?|shamela\.ws\/book\/[0-9]+\/[0-9]+|usul\.ai\/t\/[a-z0-9-]+\/[0-9]+)$/u;

const sourceUrl = Schema.String.check(
  Schema.isPattern(SOURCE, {
    message: 'must be a hadith page on dorar.net, sunnah.com, shamela.ws, or usul.ai',
  })
);

export const hadithSchema = Schema.Struct({
  title: text,
  order: positive,
  group: text,
  rawi: text,
  takhrij: Schema.Struct({
    grader: Schema.Literals(['البخاري', 'مسلم', 'الألباني']),
    source: text,
    ruling: text,
    url: sourceUrl,
    also: Schema.optionalKey(sourceUrl),
  }),
  note: Schema.optionalKey(text),
});

export type Hadith = typeof hadithSchema.Type;

export const decodeDhikr = Schema.decodeUnknownEffect(dhikrSchema, STRICT);

export const decodeHadith = Schema.decodeUnknownEffect(hadithSchema, STRICT);
