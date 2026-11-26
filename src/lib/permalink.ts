import { Array, String } from 'effect';
import type { Occasion } from './occasions';
import { TIBB } from './site';

export function slugOf(id: string): string {
  return Array.lastNonEmpty(String.split(id, '/')).replace(/^\d+-/u, '');
}

export function dhikrPath(occasion: Occasion, slug: string): string {
  return `/${occasion}/${slug}/`;
}

export function dhikrAnchor(occasion: Occasion, slug: string): string {
  return `/${occasion}/#${slug}`;
}

export function hadithPath(slug: string): string {
  return `${TIBB.path}${slug}/`;
}

export function hadithAnchor(slug: string): string {
  return `${TIBB.path}#${slug}`;
}
