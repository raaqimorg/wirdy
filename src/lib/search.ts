import { Array, Option, Order, Schema } from 'effect';
import { OCCASION_IDS } from './occasions';

export const searchRowSchema = Schema.Struct({
  title: Schema.String,
  words: Schema.String,
  also: Schema.optionalKey(Schema.String),
  heading: Schema.String,
  color: Schema.String,
  emblem: Schema.Literals([...OCCASION_IDS, 'tibb', 'unproven']),
  group: Schema.optionalKey(Schema.String),
  ruling: Schema.optionalKey(Schema.String),
  quran: Schema.optionalKey(Schema.Boolean),
  href: Schema.String,
});

export type SearchRow = typeof searchRowSchema.Type;

export type Folded = { readonly out: string; readonly map: ReadonlyArray<number> };

export type Row = {
  readonly title: Folded;
  readonly words: Folded;
  readonly also: string;
  readonly place: string;
};

export type Range = readonly [number, number];

export type Match = { readonly words: ReadonlyArray<string>; readonly hits: ReadonlyArray<number> };

const DROP = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/u;
const FOLD: Readonly<Record<string, string>> = {
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
  for (let index = 0; index < text.length; index += 1) {
    const letter = text.charAt(index);
    if (DROP.test(letter)) continue;
    out += FOLD[letter] ?? letter;
    map.push(index);
  }
  return { out, map };
}

export function rowOf(entry: {
  readonly title: string;
  readonly words: string;
  readonly also?: string | undefined;
  readonly place: string;
}): Row {
  return {
    title: fold(entry.title),
    words: fold(entry.words),
    also: fold(entry.also ?? '').out,
    place: fold(entry.place).out,
  };
}

function rankOf(row: Row, words: ReadonlyArray<string>): Option.Option<number> {
  let rank = 0;
  for (const word of words) {
    if (row.title.out.includes(word)) continue;
    if (row.words.out.includes(word) || row.also.includes(word)) rank = Math.max(rank, 1);
    else if (row.place.includes(word)) rank = 2;
    else return Option.none();
  }
  return Option.some(rank);
}

const byRank = Order.mapInput(Order.Number, (hit: { readonly rank: number }) => hit.rank);

export function match(rows: ReadonlyArray<Row>, query: string): Option.Option<Match> {
  const words = fold(query)
    .out.split(/\s+/u)
    .filter((word) => word !== '');
  if (words.length === 0) return Option.none();
  const ranked = Array.getSomes(
    rows.map((row, index) => Option.map(rankOf(row, words), (rank) => ({ index, rank })))
  );
  return Option.some({ words, hits: Array.sort(ranked, byRank).map(({ index }) => index) });
}

const byStart = Order.mapInput(Order.Number, (range: Range) => range[0]);

export function ranges(
  text: string,
  folded: Folded,
  words: ReadonlyArray<string>
): ReadonlyArray<Range> {
  const found: Range[] = [];
  const original = (at: number) => Option.getOrElse(Array.get(folded.map, at), () => text.length);
  for (const word of words) {
    for (
      let at = folded.out.indexOf(word);
      at !== -1;
      at = folded.out.indexOf(word, at + word.length)
    ) {
      found.push([original(at), original(at + word.length)]);
    }
  }
  const merged: [number, number][] = [];
  for (const [start, end] of Array.sort(found, byStart)) {
    const last = merged.at(-1);
    if (last !== undefined && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

export function windowOf(
  text: string,
  found: ReadonlyArray<Range>
): { readonly from: number; readonly to: number } {
  const start = Option.match(Array.head(found), { onNone: () => 0, onSome: ([at]) => at });
  const from = start > 40 ? text.lastIndexOf(' ', start - 24) + 1 : 0;
  const cut = text.indexOf(' ', from + 130);
  const to = text.length - from > 150 && cut !== -1 ? cut : text.length;
  return { from, to };
}
