import { describe, it, expect } from 'vitest';
import { pairWords, parseVariants } from './variants';

describe('pairWords', () => {
  it('pairs a one-word marker with its other form', () => {
    expect(pairWords('أَصْبَحْنَا', 'أَمْسَيْنَا')).toEqual([{ word: 'أَصْبَحْنَا', alt: 'أَمْسَيْنَا' }]);
  });

  it('pairs each word with its own other form', () => {
    expect(pairWords('هَذَا الْيَوْمِ', 'هَذِهِ اللَّيْلَةِ')).toEqual([
      { word: 'هَذَا', alt: 'هَذِهِ' },
      { word: 'الْيَوْمِ', alt: 'اللَّيْلَةِ' },
    ]);
  });

  it('shows a word once when both forms share it', () => {
    expect(pairWords('رَبِّ أَسْأَلُكَ', 'رَبِّ أَعُوذُ')).toEqual([
      { word: 'رَبِّ' },
      { word: 'أَسْأَلُكَ', alt: 'أَعُوذُ' },
    ]);
  });

  it('keeps forms of different lengths whole', () => {
    expect(pairWords('أ ب', 'ج')).toEqual([{ word: 'أ ب', alt: 'ج' }]);
  });
});

describe('parseVariants', () => {
  it('passes through text with no markers', () => {
    expect(parseVariants('سبحان الله')).toEqual([{ type: 'text', value: 'سبحان الله' }]);
  });

  it('parses a single variant pair', () => {
    expect(parseVariants('{{أصبحنا|أمسينا}}')).toEqual([
      { type: 'variant', sabah: 'أصبحنا', masaa: 'أمسينا' },
    ]);
  });

  it('parses text around a variant', () => {
    expect(parseVariants('قل {{أصبحنا|أمسينا}} ثم')).toEqual([
      { type: 'text', value: 'قل ' },
      { type: 'variant', sabah: 'أصبحنا', masaa: 'أمسينا' },
      { type: 'text', value: ' ثم' },
    ]);
  });

  it('parses multiple variants', () => {
    expect(parseVariants('{{a|b}} و {{c|d}}')).toEqual([
      { type: 'variant', sabah: 'a', masaa: 'b' },
      { type: 'text', value: ' و ' },
      { type: 'variant', sabah: 'c', masaa: 'd' },
    ]);
  });

  it('allows an empty side', () => {
    expect(parseVariants('{{|وَ}}')).toEqual([{ type: 'variant', sabah: '', masaa: 'وَ' }]);
  });

  it('rejects an unclosed marker', () => {
    expect(() => parseVariants('{{أصبحنا|أمسينا')).toThrow(/Malformed variant marker/);
  });

  it('rejects a stray closer', () => {
    expect(() => parseVariants('أصبحنا}} ثم')).toThrow(/Malformed variant marker/);
  });

  it('rejects a bare pipe outside a marker', () => {
    expect(() => parseVariants('أصبحنا | أمسينا')).toThrow(/Malformed variant marker/);
  });

  it('rejects three sides', () => {
    expect(() => parseVariants('{{a|b|c}}')).toThrow(/Malformed variant marker/);
  });

  it('rejects nesting', () => {
    expect(() => parseVariants('{{a{{b|c}}|d}}')).toThrow(/Malformed variant marker/);
  });
});
