import { getCollection } from 'astro:content';
import type { Occasion } from './occasions';

export async function adhkarOf(occasion: Occasion) {
  const entries = await getCollection('adhkar');
  return entries
    .filter((entry) => entry.data.occasion === occasion)
    .toSorted((a, b) => a.data.order - b.data.order);
}

export async function countsByOccasion(): Promise<Record<Occasion, number>> {
  const entries = await getCollection('adhkar');
  const counts = {} as Record<Occasion, number>;
  for (const entry of entries) {
    counts[entry.data.occasion] = (counts[entry.data.occasion] ?? 0) + 1;
  }
  return counts;
}
