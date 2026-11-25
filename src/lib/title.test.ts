import { Effect, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { eveningTitle as eveningEffect, fullTitle } from './title';

const eveningTitle = (title: string, body: string) =>
  Option.getOrNull(Effect.runSync(eveningEffect(title, body)));

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

describe('eveningTitle', () => {
  it('takes the same opening words from the evening form of the text', () => {
    expect(eveningTitle('اللهم بك أصبحنا', 'اللَّهُمَّ بِكَ {{أَصْبَحْنَا|أَمْسَيْنَا}}، وَبِكَ')).toBe(
      'اللهم بك أمسينا'
    );
  });

  it('gives nothing when the title does not open the text', () => {
    expect(eveningTitle('سيد الاستغفار', '{{أَصْبَحْنَا|أَمْسَيْنَا}} لِلَّهِ')).toBeNull();
  });

  it('gives nothing when the text has one form', () => {
    expect(eveningTitle('سبحان الله', 'سُبْحَانَ اللَّهِ')).toBeNull();
  });
});
