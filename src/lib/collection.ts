import { getCollection, type CollectionEntry } from 'astro:content';
import { Array, Effect, Option, Order } from 'effect';
import { adhkarLabel, hadithLabel } from './arabic';
import type { EmblemName } from './emblems';
import { foldOf, suwarOf } from './lead';
import { listed, OCCASIONS, type Occasion } from './occasions';
import { dhikrAnchor, slugOf } from './permalink';
import type { Dhikr } from './schema';
import { TIBB } from './site';
import type { SearchRow } from './search';
import { fullTitle } from './title';
import { formOf, hasVariants, type MalformedMarker } from './variants';

export type { SearchRow } from './search';

export type AdhkarEntry = CollectionEntry<'adhkar'>;
export type TibbEntry = CollectionEntry<'tibb'>;

export type Tile = {
  readonly id: EmblemName;
  readonly heading: string;
  readonly color: string;
  readonly note: string;
  readonly href: string;
};

const byOrder = Order.mapInput(
  Order.Number,
  (entry: { readonly data: { readonly order: number } }) => entry.data.order
);

export const bodyOf = (entry: { readonly body?: string | undefined }): string => entry.body ?? '';

export const adhkarOf = (occasion: Occasion): Effect.Effect<ReadonlyArray<AdhkarEntry>> =>
  Effect.map(
    Effect.promise(() => getCollection('adhkar')),
    (entries) =>
      Array.sort(
        entries.filter((entry) => entry.data.occasion === occasion),
        byOrder
      )
  );

export const tibbEntries: Effect.Effect<ReadonlyArray<TibbEntry>> = Effect.map(
  Effect.promise(() => getCollection('tibb')),
  (entries) => Array.sort(entries, byOrder)
);

export const occasionTiles: Effect.Effect<ReadonlyArray<Tile>> = Effect.forEach(
  OCCASIONS,
  ({ id, heading, color }) =>
    Effect.map(adhkarOf(id), (entries) => ({
      id,
      heading,
      color,
      note: adhkarLabel(entries.filter(({ data }) => listed(data.mode)).length),
      href: `/${id}/`,
    })),
  { concurrency: 'unbounded' }
);

export const sectionTiles: Effect.Effect<ReadonlyArray<Tile>> = Effect.map(
  Effect.all([occasionTiles, tibbEntries]),
  ([tiles, tibb]) => {
    return [
      ...tiles,
      {
        id: 'tibb',
        heading: TIBB.heading,
        color: TIBB.color,
        note: hadithLabel(tibb.length),
        href: TIBB.path,
      },
    ];
  }
);

function shownAyat(data: Dhikr, text: string): string {
  const suwar = Option.getOrElse(suwarOf(data, text), () => []);
  return suwar.flatMap((ayat) => (data.ayat === 'fold' ? foldOf(ayat).shown : ayat)).join(' ');
}

const placeOf = ({ heading, title }: { readonly heading: string; readonly title: string }) =>
  title.includes(heading) ? title : `${title}، ${heading}`;

const adhkarRow = (
  section: (typeof OCCASIONS)[number],
  { id, data, body }: AdhkarEntry
): Effect.Effect<SearchRow, MalformedMarker> =>
  Effect.gen(function* () {
    const text = bodyOf({ body }).trim();
    const words = data.quran ? shownAyat(data, text) : yield* formOf(text, 'sabah');
    const also = hasVariants(text) ? Option.some(yield* formOf(text, 'masaa')) : Option.none();
    const about = [data.when, data.how, data.fadl].filter((part) => part !== undefined).join(' ');
    return {
      title: fullTitle(data),
      words,
      ...Option.match(also, { onNone: () => ({}), onSome: (evening) => ({ also: evening }) }),
      ...(about !== '' && { about }),
      source: data.takhrij.source,
      heading: placeOf(section),
      color: section.color,
      emblem: section.id,
      ...(data.group !== undefined && { group: data.group }),
      ...(data.quran && { quran: true }),
      href: dhikrAnchor(data.occasion, slugOf(id)),
    };
  });

export const searchRows: Effect.Effect<ReadonlyArray<SearchRow>, MalformedMarker> = Effect.gen(
  function* () {
    const adhkar = yield* Effect.forEach(OCCASIONS, (occasion) =>
      Effect.flatMap(adhkarOf(occasion.id), (entries) =>
        Effect.forEach(entries, (entry) => adhkarRow(occasion, entry))
      )
    );
    const tibb = Array.map(yield* tibbEntries, ({ id, data, body }): SearchRow => ({
      title: data.title,
      words: bodyOf({ body }).trim(),
      about: data.rawi,
      source: data.takhrij.source,
      heading: TIBB.heading,
      color: TIBB.color,
      emblem: 'tibb',
      group: data.group,
      href: `${TIBB.path}#${slugOf(id)}`,
    }));
    return [...adhkar.flat(), ...tibb];
  }
);
