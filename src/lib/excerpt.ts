import { Array, String } from 'effect';

export type Excerpt = { readonly text: string; readonly cut: boolean };

export type Ayat = Array.NonEmptyReadonlyArray<string>;

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/gu;
const CLAUSE_END = /(?<=[،.])\s+/u;

export function letters(text: string): number {
  return text.replaceAll(MARKS, '').length;
}

function fill(parts: Array.NonEmptyReadonlyArray<string>, limit: number, join: string) {
  const kept: Array.NonEmptyArray<string> = [Array.headNonEmpty(parts)];
  for (const part of Array.tailNonEmpty(parts)) {
    if (letters([...kept, part].join(join)) > limit) break;
    kept.push(part);
  }
  return { kept, cut: kept.length < parts.length };
}

export function excerptClauses(text: string, limit: number): Excerpt {
  if (letters(text) <= limit) return { text, cut: false };
  const { kept, cut } = fill(String.split(text, CLAUSE_END), limit, ' ');
  return { text: kept.join(' ').replace(/[،.]$/u, ''), cut };
}

export function excerptWords(text: string, limit: number): Excerpt {
  if (letters(text) <= limit) return { text, cut: false };
  const { kept, cut } = fill(String.split(text, /\s+/u), limit, ' ');
  return { text: kept.join(' '), cut };
}

export function excerptAyat(
  ayat: Ayat,
  limit: number
): { readonly ayat: Ayat; readonly cut: boolean } {
  const { kept, cut } = fill(ayat, limit, '\n');
  return { ayat: kept, cut };
}
