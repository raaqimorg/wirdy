import { Effect, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { eveningTitle as eveningEffect, fullTitle, isOpening, titleIn } from './title';

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

describe('isOpening', () => {
  it('knows a name that the text opens with, whatever its diacritics and commas', () => {
    expect(isOpening('ما أنزل الله داء', 'مَا أَنْزَلَ اللَّهُ دَاءً إِلاَّ أَنْزَلَ لَهُ شِفَاءً')).toBe(true);
    expect(isOpening('لا بأس، طهور', 'لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ')).toBe(true);
  });

  it('knows a name that says what the text is about', () => {
    expect(isOpening('تداووا', 'أَتَيْتُ النَّبِيَّ ﷺ')).toBe(false);
  });

  it.each(['سبحان الله وبحمده مئة مرة', 'سبحان الله وبحمده عشرًا', 'سبحان الله وبحمده عشر مرات'])(
    'reads past the count that ends a name: %s',
    (title) => {
      expect(isOpening(title, 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ')).toBe(true);
    }
  );

  it('keeps a name whose words the text does not open with, count or not', () => {
    expect(isOpening('التهليل عشرًا', 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ')).toBe(false);
  });
});

describe('titleIn', () => {
  it('drops a context that names the section the reader is already in', () => {
    expect(titleIn({ title: 'آية الكرسي', context: 'عند النوم' }, 'عند النوم')).toBe('آية الكرسي');
    expect(titleIn({ title: 'آية الكرسي', context: 'في الصباح والمساء' }, 'الصباح والمساء')).toBe(
      'آية الكرسي'
    );
  });

  it('keeps a context that says more than the section', () => {
    expect(titleIn({ title: 'رب اغفر لي', context: 'بين السجدتين' }, 'أثناء الصلاة')).toBe(
      'رب اغفر لي (بين السجدتين)'
    );
  });
});
