import { Array, String } from 'effect';
import type { Occasion } from './occasions';

export function slugOf(id: string): string {
  return Array.lastNonEmpty(String.split(id, '/')).replace(/^\d+-/u, '');
}

export function dhikrPath(occasion: Occasion, slug: string): string {
  return `/${occasion}/${slug}/`;
}

export function dhikrAnchor(occasion: Occasion, slug: string): string {
  return `/${occasion}/#${slug}`;
}
