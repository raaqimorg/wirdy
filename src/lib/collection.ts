import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import { Array, Effect, Option, Order } from 'effect';
import { adhkarLabel, hadithLabel } from './arabic';
import type { EmblemName } from './emblems';
import { foldOf, suwarOf } from './lead';
import { OCCASIONS, type Occasion } from './occasions';
import { dhikrAnchor, slugOf } from './permalink';
import type { Dhikr } from './schema';
import { TIBB, UNPROVEN } from './site';
import type { SearchRow } from './search';
import { fullTitle } from './title';
import { formOf, hasVariants, type MalformedMarker } from './variants';

export type { SearchRow } from './search';

export type AdhkarEntry = CollectionEntry<'adhkar'>;
export type UnprovenEntry = CollectionEntry<'unproven'>;
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

export const unprovenEntries: Effect.Effect<ReadonlyArray<UnprovenEntry>> = Effect.map(
  Effect.promise(() => getCollection('unproven')),
  (entries) => Array.sort(entries, byOrder)
);

export const tibbEntries: Effect.Effect<ReadonlyArray<TibbEntry>> = Effect.map(
  Effect.promise(() => getCollection('tibb')),
  (entries) => Array.sort(entries, byOrder)
);

export const occasionTiles: Effect.Effect<ReadonlyArray<Tile>> = Effect.forEach(
  OCCASIONS,
  ({ id, heading, color }) =>
    Effect.map(adhkarOf(id), ({ length }) => ({
      id,
      heading,
      color,
      note: adhkarLabel(length),
      href: `/${id}/`,
    })),
  { concurrency: 'unbounded' }
);

export const sectionTiles: Effect.Effect<ReadonlyArray<Tile>> = Effect.map(
  Effect.all([occasionTiles, tibbEntries]),
  ([tiles, tibb]) => {
    const { heading, color, lede: note, path: href } = UNPROVEN;
    return [
      ...tiles,
      {
        id: 'tibb',
        heading: TIBB.heading,
        color: TIBB.color,
        note: hadithLabel(tibb.length),
        href: TIBB.path,
      },
      { id: 'unproven', heading, color, note, href },
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
    return {
      title: fullTitle(data),
      words,
      ...Option.match(also, { onNone: () => ({}), onSome: (evening) => ({ also: evening }) }),
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
    const unproven = Array.map(yield* unprovenEntries, ({ id, data, body }): SearchRow => ({
      title: data.what,
      words: bodyOf({ body }).trim(),
      heading: placeOf(UNPROVEN),
      color: UNPROVEN.color,
      emblem: 'unproven',
      ruling: data.takhrij.ruling,
      href: `${UNPROVEN.path}#${slugOf(id)}`,
    }));
    const tibb = Array.map(yield* tibbEntries, ({ id, data, body }): SearchRow => ({
      title: data.title,
      words: bodyOf({ body }).trim(),
      heading: TIBB.heading,
      color: TIBB.color,
      emblem: 'tibb',
      group: data.group,
      href: `${TIBB.path}#${slugOf(id)}`,
    }));
    return [...adhkar.flat(), ...tibb, ...unproven];
  }
);

export type SearchIndex = {
  readonly rows: ReadonlyArray<SearchRow>;
  readonly version: string;
  readonly path: string;
};

export const searchIndex: Effect.Effect<SearchIndex, MalformedMarker> = Effect.map(
  searchRows,
  (rows) => {
    const version = createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 12);
    return { rows, version, path: `/search/${version}.json` };
  }
);
