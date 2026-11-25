import { describe, expect, it } from 'vitest';
import { fullTitle } from './title';

describe('fullTitle', () => {
  it('puts the context in parentheses after the name', () => {
    expect(fullTitle({ title: 'أعوذ بكلمات الله التامات', context: 'في المساء' })).toBe(
      'أعوذ بكلمات الله التامات (في المساء)'
    );
  });

  it('gives the name alone when there is no context', () => {
    expect(fullTitle({ title: 'أعوذ بكلمات الله التامات' })).toBe('أعوذ بكلمات الله التامات');
  });
});
