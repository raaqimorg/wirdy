import { createHash } from 'node:crypto';
import { Array, Effect, Option, Schema } from 'effect';
import { timesLabel } from './arabic';
import { EMBLEMS, type EmblemName } from './emblems';
import { excerptAyat, excerptClauses, letters } from './excerpt';
import { fullLeadOf, REST, suwarOf } from './lead';
import { markSvg } from './mark';
import { OCCASIONS, sectionOf } from './occasions';
import { phrasesOf, type PhraseCountMismatch } from './phrases';
import type { Dhikr, Tibb } from './schema';
import { SITE, TIBB } from './site';
import { takhrijLine } from './takhrij';
import { formOf, hasVariants, type MalformedMarker } from './variants';

const TEMPLATE = 4;
const SITE_TEMPLATE = 1;
const HOME_TEMPLATE = 2;
const LIMIT = 250;
const EVENING_LIMIT = 90;

export const cardSchema = Schema.Struct({
  heading: Schema.String,
  color: Schema.String,
  title: Schema.String,
  context: Schema.NullOr(Schema.String),
  lead: Schema.String,
  quran: Schema.Boolean,
  blocks: Schema.Array(Schema.Array(Schema.String)),
  evening: Schema.NullOr(Schema.String),
  cut: Schema.Boolean,
  count: Schema.NullOr(Schema.String),
  phrases: Schema.optionalKey(
    Schema.Array(Schema.Struct({ text: Schema.String, count: Schema.Number }))
  ),
  takhrij: Schema.String,
});

export type Card = typeof cardSchema.Type;

type Body = { readonly blocks: ReadonlyArray<ReadonlyArray<string>>; readonly cut: boolean };

const bodyOf = (data: Dhikr, text: string): Effect.Effect<Body, MalformedMarker> =>
  Option.match(suwarOf(data, text), {
    onSome: (suwar) => {
      const share = data.ayat === 'fold' ? Math.floor(LIMIT / suwar.length) : LIMIT;
      const excerpts = Array.map(suwar, (ayat) => excerptAyat(ayat, share));
      return Effect.succeed({
        blocks: Array.map(excerpts, ({ ayat }) => ayat),
        cut: excerpts.some((excerpt) => excerpt.cut),
      });
    },
    onNone: () =>
      Effect.map(formOf(text, 'sabah'), (morning) => {
        const { text: shown, cut } = excerptClauses(morning, LIMIT);
        return { blocks: [[shown]], cut };
      }),
  });

const eveningOf = (text: string): Effect.Effect<string | null, MalformedMarker> =>
  hasVariants(text)
    ? Effect.map(
        formOf(text, 'masaa'),
        (evening) =>
          excerptClauses(evening, EVENING_LIMIT).text +
          (letters(evening) > EVENING_LIMIT ? ' …' : '')
      )
    : Effect.succeed(null);

export const cardOf = (
  data: Dhikr,
  body: string
): Effect.Effect<Card, MalformedMarker | PhraseCountMismatch> =>
  Effect.gen(function* () {
    const text = body.trim();
    const { title: heading, color } = sectionOf(data.occasion);
    const suwar = suwarOf(data, text);
    const { blocks, cut } = yield* bodyOf(data, text);
    const rest = Option.isSome(suwar) && cut ? [REST] : [];
    const lead = [fullLeadOf(data, suwar), ...rest].filter((part) => part !== '').join('، ');
    const evening = yield* eveningOf(text);
    const phrases = data.counts === undefined ? undefined : yield* phrasesOf(text, data.counts);

    return {
      heading,
      color,
      title: data.title,
      context: data.context ?? null,
      lead,
      quran: data.quran,
      blocks,
      evening,
      cut,
      count: data.count > 1 ? timesLabel(data.count) : null,
      ...(phrases !== undefined && { phrases }),
      takhrij: takhrijLine(data.takhrij),
    };
  });

export const hadithCardOf = (data: Tibb, body: string): Card => {
  const { text, cut } = excerptClauses(body.trim(), LIMIT);
  return {
    heading: TIBB.title,
    color: TIBB.color,
    title: data.title,
    context: null,
    lead: `عن ${data.rawi}`,
    quran: false,
    blocks: [[text]],
    evening: null,
    cut,
    count: null,
    takhrij: takhrijLine(data.takhrij),
  };
};

export function cardFile(card: Card, occasion: EmblemName, slug: string): string {
  const print = createHash('sha256')
    .update(JSON.stringify([TEMPLATE, card, EMBLEMS[occasion], markSvg()]))
    .digest('hex')
    .slice(0, 8);
  return `og/${occasion}/${slug}-${print}.png`;
}

export type SectionCard = {
  readonly id: EmblemName;
  readonly title: string;
  readonly color: string;
  readonly note: string;
};

const fingerprint = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 8);

export const HOME_SWATCHES: ReadonlyArray<{ readonly id: EmblemName; readonly color: string }> =
  OCCASIONS.map(({ id, color }) => ({ id, color }));

export function sectionCardFile(card: SectionCard): string {
  const print = fingerprint([SITE_TEMPLATE, card, EMBLEMS[card.id], markSvg('stage')]);
  return `opengraph/${card.id}-${print}.png`;
}

export function homeCardFile(): string {
  const print = fingerprint([
    HOME_TEMPLATE,
    SITE.name,
    SITE.domain,
    SITE.promise,
    HOME_SWATCHES.map(({ id, color }) => [id, color, EMBLEMS[id]]),
    markSvg(),
  ]);
  return `opengraph/home-${print}.png`;
}
