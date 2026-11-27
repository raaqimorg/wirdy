import { Option } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  fold,
  markedOf,
  match as matchOption,
  nearestOf,
  ranges,
  rowOf,
  windowOf,
  wordsOf,
} from './search';

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

  it('reads the Persian kaf and yeh as the Arabic letters', () => {
    expect(fold('کرسی').out).toBe('كرسي');
  });
});

describe('wordsOf', () => {
  it('leaves out the words that only say a dhikr is wanted', () => {
    expect(wordsOf('دعاء النوم')).toEqual(['النوم']);
    expect(wordsOf('أذكار عند النوم')).toEqual(['النوم']);
  });

  it('keeps those words when they are all the query has', () => {
    expect(wordsOf('دعاء')).toEqual(['دعاء']);
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

  it('finds a dhikr by the moment it is said, after the words and the place', () => {
    const said = [
      rowOf({ title: 'افتح', words: 'اللهم افتح لي', about: 'إذا دخل المسجد', place: 'masjid' }),
    ];
    expect(match(said, 'المسجد')!.hits).toEqual([0]);
  });

  it('finds a word by another form of it from the list', () => {
    const said = [rowOf({ title: 'افتح', words: '', about: 'إذا دخل المسجد', place: '' })];
    expect(match(said, 'دخول المسجد')!.hits).toEqual([0]);
  });

  it('finds a narrator named in the genitive, and the two last سور by their common name', () => {
    const said = [
      rowOf({ title: 'الرقى', words: '', about: 'أبي سعيد الخدري وأبي هريرة', place: '' }),
      rowOf({ title: 'المعوذات', words: '', place: '' }),
    ];
    expect(match(said, 'أبو هريرة')!.hits).toEqual([0]);
    expect(match(said, 'المعوذتين')!.hits).toEqual([1]);
  });

  it('finds the same rows for a query with or without the word دعاء', () => {
    const arabic = [rowOf({ title: 'النوم', words: 'باسمك', place: '' })];
    expect(match(arabic, 'دعاء النوم')!.hits).toEqual(match(arabic, 'النوم')!.hits);
  });

  it('finds a dhikr by its virtue, narrator, or source, after its words', () => {
    const said = [
      rowOf({
        title: 'سيد',
        words: 'اللهم',
        about: 'من قالها دخل الجنة',
        place: '',
        source: 'صحيح البخاري ٦٣٠٦',
      }),
      rowOf({
        title: 'الرقى',
        words: 'كنا نرقي',
        about: 'عوف بن مالك',
        place: '',
        source: 'صحيح مسلم ٢٢٠٠',
      }),
      rowOf({ title: 'البخاري', words: '', place: '' }),
    ];
    expect(match(said, 'من قالها')!.hits).toEqual([0]);
    expect(match(said, 'عوف')!.hits).toEqual([1]);
    expect(match(said, 'البخاري')!.hits).toEqual([2, 0]);
  });

  it('matches a word of one or two letters only at the start of a word', () => {
    const short = [
      rowOf({ title: 'ليست', words: '', place: '' }),
      rowOf({ title: 'يسر', words: '', place: '' }),
    ];
    expect(match(short, 'يس')!.hits).toEqual([1]);
    expect(match(short, 'يسر')!.hits).toEqual([1]);
  });

  it('folds the query as it folds the rows', () => {
    const arabic = [rowOf({ title: words, words: '', place: '' })];
    expect(match(arabic, 'رَضِيتُ')!.hits).toEqual([0]);
    expect(match(arabic, 'رضيت')!.hits).toEqual([0]);
    expect(match(arabic, 'بالله')!.hits).toEqual([0]);
  });
});

describe('nearestOf', () => {
  const rows = [
    rowOf({ title: 'افتح', words: 'اللهم افتح لي', place: 'المسجد' }),
    rowOf({ title: 'السوق', words: 'اللهم من دخل السوق', place: '' }),
    rowOf({ title: 'الباب', words: 'اللهم افتح الباب في السوق', place: '' }),
    rowOf({ title: 'الصباح', words: 'اللهم بك أصبحنا', place: '' }),
    rowOf({ title: 'المساء', words: 'اللهم بك أمسينا', place: '' }),
    rowOf({ title: 'النوم', words: 'باسمك اللهم أموت', place: '' }),
    ...['الطعام', 'السفر', 'المطر', 'الريح', 'الهم', 'المرض'].map((title) =>
      rowOf({ title, words: 'اللهم', place: '' })
    ),
  ];

  it('shows the rows of the words that find something, when no row has them all', () => {
    expect(Option.getOrNull(nearestOf(rows, 'نسيت المسجد'))).toEqual({
      words: ['المسجد'],
      match: { words: ['المسجد'], hits: [0] },
    });
  });

  it('shows only the rows that have the most of the words', () => {
    expect(Option.getOrNull(nearestOf(rows, 'افتح السوق نسيت'))?.match.hits).toEqual([2]);
  });

  it('skips a word that is in most rows, so it offers nothing rather than every row', () => {
    expect(Option.isNone(nearestOf(rows, 'اللهم حسبي'))).toBe(true);
  });

  it('has nothing to offer for a single word', () => {
    expect(Option.isNone(nearestOf(rows, 'المسجد'))).toBe(true);
  });
});

describe('markedOf', () => {
  it('marks the other forms of a word too', () => {
    expect(markedOf(['دخول'])).toEqual(['دخول', 'دخل']);
  });
});

describe('ranges', () => {
  it('marks the match in the text itself, with the diacritics of its last letter', () => {
    expect(ranges(words, fold(words), ['رضيت'])).toEqual([[0, 7]]);
  });

  it('merges matches that touch', () => {
    expect(ranges('abcdefgh ij', fold('abcdefgh ij'), ['bcd', 'cde', 'ij'])).toEqual([
      [1, 5],
      [9, 11],
    ]);
  });

  it('marks a word of one or two letters only at the start of a word', () => {
    expect(ranges('ليست يسر', fold('ليست يسر'), ['يس'])).toEqual([[5, 7]]);
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
