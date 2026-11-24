import { describe, expect, it } from 'vitest';
import { phrasesLabel, phrasesOf } from './phrases';

describe('phrasesOf', () => {
  it('gives each phrase its own count', () => {
    expect(phrasesOf('سبحان الله، والحمد لله', [33, 34])).toEqual([
      { text: 'سبحان الله', count: 33 },
      { text: 'والحمد لله', count: 34 },
    ]);
  });

  it('refuses counts that do not match the phrases', () => {
    expect(() => phrasesOf('سبحان الله، والحمد لله', [33])).toThrow('1 counts for 2 phrases');
  });
});

describe('phrasesLabel', () => {
  it('says each phrase with its count', () => {
    expect(phrasesLabel(phrasesOf('سبحان الله، والله أكبر', [10, 33]))).toBe(
      'سبحان الله ١٠ مرات، والله أكبر ٣٣ مرة'
    );
  });
});
