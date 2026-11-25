import { getCollection, type CollectionEntry } from 'astro:content';
import { adhkarLabel } from './arabic';
import { foldOf, suwarOf } from './lead';
import type { EmblemName } from './emblems';
import { OCCASIONS, type Occasion } from './occasions';
import { dhikrAnchor, slugOf } from './permalink';
import { UNPROVEN } from './site';
import { fullTitle } from './title';
import { formOf } from './variants';

export type AdhkarEntry = CollectionEntry<'adhkar'>;

export type Tile = { id: EmblemName; heading: string; color: string; note: string; href: string };

export async function adhkarOf(occasion: Occasion): Promise<AdhkarEntry[]> {
  const entries = await getCollection('adhkar');
  return entries
    .filter((entry) => entry.data.occasion === occasion)
    .toSorted((a, b) => a.data.order - b.data.order);
}

export async function unprovenEntries(): Promise<CollectionEntry<'unproven'>[]> {
  const entries = await getCollection('unproven');
  return entries.toSorted((a, b) => a.data.order - b.data.order);
}

export async function occasionTiles(): Promise<Tile[]> {
  return Promise.all(
    OCCASIONS.map(async ({ id, heading, color }) => {
      const { length } = await adhkarOf(id);
      return { id, heading, color, note: adhkarLabel(length), href: `/${id}/` };
    })
  );
}

export async function sectionTiles(): Promise<Tile[]> {
  const { heading, color, note, path: href } = UNPROVEN;
  return [...(await occasionTiles()), { id: 'unproven', heading, color, note, href }];
}

export type SearchRow = {
  title: string;
  words: string;
  also?: string;
  heading: string;
  color: string;
  group?: string;
  ruling?: string;
  href: string;
};

function shownAyat(data: AdhkarEntry['data'], text: string): string {
  const suwar = suwarOf(data, text) ?? [];
  return suwar.flatMap((ayat) => (data.ayat === 'fold' ? foldOf(ayat).shown : ayat)).join(' ');
}

export async function searchRows(): Promise<SearchRow[]> {
  const lists = await Promise.all(OCCASIONS.map(({ id }) => adhkarOf(id)));
  const adhkar = OCCASIONS.flatMap(({ heading, color }, index) =>
    lists[index]!.map(({ id, data, body = '' }) => {
      const text = body.trim();
      return {
        title: fullTitle(data),
        words: data.quran ? shownAyat(data, text) : formOf(text, 'sabah'),
        also: text.includes('{{') ? formOf(text, 'masaa') : undefined,
        heading,
        color,
        group: data.group,
        href: dhikrAnchor(data.occasion, slugOf(id)),
      };
    })
  );
  const unproven = (await unprovenEntries()).map(({ id, data, body = '' }) => ({
    title: data.what,
    words: body.trim(),
    heading: UNPROVEN.heading,
    color: UNPROVEN.color,
    ruling: data.takhrij.ruling,
    href: `${UNPROVEN.path}#${slugOf(id)}`,
  }));
  return [...adhkar, ...unproven];
}
