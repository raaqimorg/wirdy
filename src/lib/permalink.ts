import { Array, String } from 'effect';
import type { Occasion } from './occasions';
import { GUIDES, type Guide } from './site';

export function slugOf(id: string): string {
  return Array.lastNonEmpty(String.split(id, '/')).replace(/^\d+-/u, '');
}

export function dhikrPath(occasion: Occasion, slug: string): string {
  return `/${occasion}/${slug}/`;
}

export function dhikrAnchor(occasion: Occasion, slug: string): string {
  return `/${occasion}/#${slug}`;
}

export function hadithPath(guide: Guide, slug: string): string {
  return `${GUIDES[guide].path}${slug}/`;
}

export function hadithAnchor(guide: Guide, slug: string): string {
  return `${GUIDES[guide].path}#${slug}`;
}

export function canonicalPathsOf(
  pages: ReadonlyArray<{ readonly path: string; readonly headline: string }>
): ReadonlyMap<string, string> {
  const first = new Map(pages.toReversed().map(({ path, headline }) => [headline, path]));
  return new Map(pages.map(({ path, headline }) => [path, first.get(headline) ?? path]));
}
