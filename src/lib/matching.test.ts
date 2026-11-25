import { describe, expect, it } from 'vitest';
import { missingPhrases, normalize, phrasesIn, spanOf, spansOf } from './matching';

describe('normalize', () => {
  it('drops tashkil and punctuation, and writes the wasla as a plain alif', () => {
    expect(normalize('لَا إِلَهَ، إِلَّا ٱللَّهُ')).toBe('لا إله إلا الله');
  });

  it('keeps the hamza', () => {
    expect(normalize('أَنَّ')).not.toBe(normalize('إِنَّ'));
  });

  it('drops tatweel and the small Quranic letters', () => {
    expect(normalize('لَهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ')).toBe('له ما فى السموت');
  });

  it('joins a lone waw to its word, as dorar.net writes a space there', () => {
    expect(normalize('و بكَ نَحيا، و إليكَ')).toBe('وبك نحيا وإليك');
    expect(normalize('هو و')).toBe('هو و');
  });

  it('reads both spellings of السماوات as one word', () => {
    expect(normalize('رَبَّ السَّمَواتِ')).toBe(normalize('رَبَّ السَّمَاوَاتِ'));
    expect(normalize('السماء')).not.toBe(normalize('السماوات'));
  });

  it('reads ﷺ, its words, and neither as the same text', () => {
    const plain = normalize('ودين نبينا محمد وملة أبينا');
    expect(normalize('ودين نبينا محمد ﷺ وملة أبينا')).toBe(plain);
    expect(normalize('ودين نبينا محمد صلَّى اللهُ عليه وسلَّم وملة أبينا')).toBe(plain);
    expect(normalize('اللهم صل على محمد')).toBe('اللهم صل على محمد');
  });

  it('skips the footnote and page numbers of a printed book', () => {
    expect(normalize('لا إله إلا الله (١) وحده ⦗٢٣٢٤⦘ لا شريك')).toBe('لا إله إلا الله وحده لا شريك');
  });

  it('reads the old spellings of شيء as one word', () => {
    expect(normalize('على كل شئ قدير')).toBe('على كل شيء قدير');
    expect(normalize('على كُلِّ شَىْءٍ قدير')).toBe('على كل شيء قدير');
    expect(normalize('شئت')).toBe('شئت');
  });

  it('splits no word at a small Quranic letter', () => {
    expect(normalize('دَاوُۥدَ')).toBe('داود');
  });

  it('writes any run of white space as one space', () => {
    expect(normalize('  سبحان \n\tالله ')).toBe('سبحان الله');
  });
});

describe('phrasesIn', () => {
  it('splits at commas, full stops, and line ends', () => {
    expect(phrasesIn('سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ.\nاللَّهُ أَكْبَرُ')).toEqual([
      'سبحان الله',
      'والحمد لله',
      'الله أكبر',
    ]);
  });
});

describe('missingPhrases', () => {
  it('finds every phrase, whatever the spaces and signs between them', () => {
    expect(missingPhrases('أ، ب', ['أ ﷺ ب'])).toEqual([]);
  });

  it('refuses another hamza', () => {
    expect(missingPhrases('أَنَّ الحمد', ['إن الحمد'])).toEqual(['أن الحمد']);
  });

  it('refuses phrases in another order', () => {
    expect(missingPhrases('ب، أ', ['أ ب'])).toEqual(['أ']);
  });

  it('matches whole words only', () => {
    expect(missingPhrases('حمد', ['الحمد'])).toEqual(['حمد']);
  });

  it('matches no phrase across two spans', () => {
    expect(missingPhrases('أ ب', ['أ', 'ب'])).toEqual(['أ ب']);
  });

  it('goes on after a phrase that is missing', () => {
    expect(missingPhrases('أ، ج، ب', ['أ ب'])).toEqual(['ج']);
  });
});

describe('spanOf', () => {
  const page = '- قالَ: سُبْحانَ اللَّهِ ، وبِحَمدِه ؛ مِائةَ مَرَّةٍ.';

  it('cuts the exact part of a text that holds the words', () => {
    expect(spanOf(page, 'سبحان الله وبحمده')).toBe('سُبْحانَ اللَّهِ ، وبِحَمدِه');
    expect(page).toContain(spanOf(page, 'مائة مرة')!);
  });

  it('cuts across a lone waw', () => {
    expect(spanOf('قال: بكَ أصبَحْنَا، و بكَ أمْسَيْنَا.', 'بك أصبحنا وبك أمسينا')).toBe(
      'بكَ أصبَحْنَا، و بكَ أمْسَيْنَا'
    );
    expect(spanOf('نحيا، و بكَ نموت', 'وبك نموت')).toBe('و بكَ نموت');
  });

  it('cuts across the words of ﷺ', () => {
    expect(spanOf('ومحمد صلى الله عليه وسلم حق', 'ومحمد ﷺ حق')).toBe('ومحمد صلى الله عليه وسلم حق');
    expect(spanOf('ومحمد ﷺ حق', 'ومحمد صلى الله عليه وسلم حق')).toBe('ومحمد ﷺ حق');
  });

  it('cuts across a footnote number', () => {
    expect(spanOf('قال وحده (١) لا شريك له', 'وحده لا شريك')).toBe('وحده (١) لا شريك');
  });

  it('cuts at whole words only', () => {
    expect(spanOf(page, 'بحان الله')).toBeUndefined();
    expect(spanOf(page, 'سبحان الل')).toBeUndefined();
  });

  it('finds nothing for words that are not there, or are in another order', () => {
    expect(spanOf(page, 'الحمد لله')).toBeUndefined();
    expect(spanOf(page, 'الله سبحان')).toBeUndefined();
  });

  it('keeps the marks at the end of the last word', () => {
    expect(spanOf(page, 'اللَّهِ')).toBe('اللَّهِ');
  });

  it('finds nothing for no words', () => {
    expect(spanOf(page, ' ، ')).toBeUndefined();
  });
});

describe('spansOf', () => {
  it('cuts the whole text in one part when it is together', () => {
    expect(spansOf('قال: أ ، ب.', 'أ، ب')).toEqual(['أ ، ب']);
  });

  it('cuts each phrase that is there when it is not together', () => {
    expect(spansOf('أ، ثم قال: ب', 'أ، ج، ب')).toEqual(['أ', 'ب']);
  });
});
