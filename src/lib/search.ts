export type Folded = { out: string; map: number[] };

export type Row = { title: Folded; words: Folded; also: string; place: string };

export type Range = [number, number];

const DROP = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/u;
const FOLD: Record<string, string> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ى: 'ي',
  ة: 'ه',
  ؤ: 'و',
  ئ: 'ي',
};

export function fold(text: string): Folded {
  let out = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const letter = text[i]!;
    if (DROP.test(letter)) continue;
    out += FOLD[letter] ?? letter;
    map.push(i);
  }
  return { out, map };
}

export function rowOf(entry: { title: string; words: string; also?: string; place: string }): Row {
  return {
    title: fold(entry.title),
    words: fold(entry.words),
    also: fold(entry.also ?? '').out,
    place: fold(entry.place).out,
  };
}

function rankOf(row: Row, words: string[]): number | null {
  let rank = 0;
  for (const word of words) {
    if (row.title.out.includes(word)) continue;
    if (row.words.out.includes(word) || row.also.includes(word)) rank = Math.max(rank, 1);
    else if (row.place.includes(word)) rank = 2;
    else return null;
  }
  return rank;
}

export function match(rows: Row[], query: string): { words: string[]; hits: number[] } | null {
  const words = fold(query).out.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const ranked = rows.flatMap((row, index) => {
    const rank = rankOf(row, words);
    return rank === null ? [] : [{ index, rank }];
  });
  return { words, hits: ranked.toSorted((a, b) => a.rank - b.rank).map(({ index }) => index) };
}

export function ranges(text: string, folded: Folded, words: string[]): Range[] {
  const found: Range[] = [];
  for (const word of words) {
    for (
      let at = folded.out.indexOf(word);
      at !== -1;
      at = folded.out.indexOf(word, at + word.length)
    ) {
      const end = at + word.length;
      found.push([folded.map[at]!, end < folded.map.length ? folded.map[end]! : text.length]);
    }
  }
  const merged: Range[] = [];
  for (const range of found.toSorted((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

export function windowOf(text: string, found: Range[]): { from: number; to: number } {
  let from = 0;
  let to = text.length;
  if (found.length && found[0]![0] > 40) from = text.lastIndexOf(' ', found[0]![0] - 24) + 1;
  if (to - from > 150) {
    const cut = text.indexOf(' ', from + 130);
    if (cut !== -1) to = cut;
  }
  return { from, to };
}
