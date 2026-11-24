export type Excerpt = { text: string; cut: boolean };

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const CLAUSE_END = /(?<=[،.])\s+/;

export function letters(text: string): number {
  return text.replace(MARKS, '').length;
}

function fill(parts: string[], limit: number, join: string): Excerpt {
  const kept = [parts[0]!];
  for (const part of parts.slice(1)) {
    if (letters([...kept, part].join(join)) > limit) break;
    kept.push(part);
  }
  return { text: kept.join(join), cut: kept.length < parts.length };
}

export function excerptClauses(text: string, limit: number): Excerpt {
  if (letters(text) <= limit) return { text, cut: false };
  const { text: kept, cut } = fill(text.split(CLAUSE_END), limit, ' ');
  return { text: kept.replace(/[،.]$/, ''), cut };
}

export function excerptAyat(ayat: string[], limit: number): { ayat: string[]; cut: boolean } {
  const { text, cut } = fill(ayat, limit, '\n');
  return { ayat: text.split('\n'), cut };
}
