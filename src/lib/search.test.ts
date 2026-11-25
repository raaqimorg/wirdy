import { Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { fold, match as matchOption, ranges, rowOf, windowOf } from './search';

const words = 'رَضِيتُ بِاللَّهِ';

describe('fold', () => {
  it('drops the diacritics, and maps each letter left to its place in the text', () => {
    expect(fold('رَضِيتُ')).toEqual({ out: 'رضيت', map: [0, 2, 4, 5] });
  });

  it('drops the tatweel', () => {
    expect(fold('\u0627\u0644\u0640\u0647').out).toBe('\u0627\u0644\u0647');
  });

  it('writes every form of alif, and ى, ة, ؤ, and ئ, as one letter each', () => {
    expect(fold('\u0623\u0625\u0622\u0671\u0649\u0629\u0624\u0626').out).toBe(
      '\u0627\u0627\u0627\u0627\u064A\u0647\u0648\u064A'
    );
  });
});

const match = (...args: Parameters<typeof matchOption>) => Option.getOrNull(matchOption(...args));

describe('match', () => {
  const rows = [
    rowOf({ title: 'one', words: 'alpha beta', place: 'home' }),
    rowOf({ title: 'beta two', words: 'gamma', place: 'away' }),
    rowOf({ title: 'three', words: 'beta', also: 'delta', place: 'home' }),
    rowOf({ title: 'four', words: 'epsilon', place: 'beta street' }),
  ];

  it('finds nothing to do for an empty query', () => {
    expect(match(rows, '  ')).toBeNull();
  });

  it('ranks a match in the name first, then in the words, then in the place, in page order', () => {
    expect(match(rows, 'beta')).toEqual({ words: ['beta'], hits: [1, 0, 2, 3] });
  });

  it('needs every word, in any order', () => {
    expect(match(rows, 'gamma two')!.hits).toEqual([1]);
    expect(match(rows, 'alpha gamma')!.hits).toEqual([]);
  });

  it('matches the other form of the words, which does not show', () => {
    expect(match(rows, 'delta')!.hits).toEqual([2]);
  });

  it('folds the query as it folds the rows', () => {
    const arabic = [rowOf({ title: words, words: '', place: '' })];
    expect(match(arabic, 'رَضِيتُ')!.hits).toEqual([0]);
    expect(match(arabic, 'رضيت')!.hits).toEqual([0]);
    expect(match(arabic, 'بالله')!.hits).toEqual([0]);
  });
});

describe('ranges', () => {
  it('marks the match in the text itself, with the diacritics of its last letter', () => {
    expect(ranges(words, fold(words), ['رضيت'])).toEqual([[0, 7]]);
  });

  it('merges matches that touch', () => {
    expect(ranges('abcdef', fold('abcdef'), ['bc', 'cd', 'f'])).toEqual([
      [1, 4],
      [5, 6],
    ]);
  });
});

describe('windowOf', () => {
  const text = Array.from({ length: 80 }, (_, i) => `w${i}`).join(' ');

  it('shows the start of a text when the match is near it', () => {
    expect(windowOf(text, [[3, 5]]).from).toBe(0);
  });

  it('starts at a word shortly before a match far in, and stops at a word', () => {
    const at = text.indexOf('w40');
    const { from, to } = windowOf(text, [[at, at + 3]]);
    expect(from).toBeGreaterThan(0);
    expect(from).toBeLessThan(at);
    expect(text[from - 1]).toBe(' ');
    expect(to).toBeGreaterThan(at + 3);
    expect(text[to]).toBe(' ');
    expect(to - from).toBeLessThanOrEqual(150);
  });
});
