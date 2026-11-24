import { getCollection, type CollectionEntry } from 'astro:content';
import { adhkarLabel } from './arabic';
import type { EmblemName } from './emblems';
import { OCCASIONS, type Occasion } from './occasions';

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
