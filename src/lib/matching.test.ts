import { describe, expect, it } from 'vitest';
import { missingPhrases, normalize, phrasesIn } from './matching';

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
