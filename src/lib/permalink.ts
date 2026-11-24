import type { Occasion } from './occasions';

export function slugOf(id: string): string {
  return id.split('/').at(-1)!.replace(/^\d+-/, '');
}

export function dhikrPath(occasion: Occasion, slug: string): string {
  return `/${occasion}/${slug}/`;
}

export function dhikrAnchor(occasion: Occasion, slug: string): string {
  return `/${occasion}/#${slug}`;
}
