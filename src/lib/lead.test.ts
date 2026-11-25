import { Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { foldOf, fullLeadOf, leadOf, suwarOf as suwarOption } from './lead';
import type { Dhikr } from './schema';

const suwarOf = (data: Dhikr, text: string) => Option.getOrNull(suwarOption(data, text));

const base: Dhikr = {
  title: 'ذكر',
  occasion: 'nawm',
  order: 1,
  count: 1,
  mode: 'both',
  quran: true,
  ayat: 'all',
  takhrij: {
    grader: 'البخاري',
    source: 'صحيح البخاري ١',
    ruling: 'صحيح',
    url: 'https://dorar.net/hadith/sharh/1',
  },
};

describe('suwarOf', () => {
  it('parts سور at a blank line, and آيات at a line', () => {
    expect(suwarOf(base, 'أ\nب\n\nج')).toEqual([['أ', 'ب'], ['ج']]);
  });

  it('keeps the first آية of each سورة when only it shows', () => {
    expect(suwarOf({ ...base, ayat: 'first' }, 'أ\nب\n\nج\nد')).toEqual([['أ'], ['ج']]);
  });

  it('keeps every آية of a سورة that folds', () => {
    expect(suwarOf({ ...base, ayat: 'fold' }, 'أ\nب\n\nج\nد')).toEqual([
      ['أ', 'ب'],
      ['ج', 'د'],
    ]);
  });

  it('is nothing for a text that is not قرآن', () => {
    expect(suwarOf({ ...base, quran: false }, 'أ')).toBeNull();
  });
});

describe('foldOf', () => {
  it('shows the whole آيات that fit 250 letters, and folds the rest', () => {
    const ayah = 'ب'.repeat(100);
    expect(foldOf([ayah, ayah, ayah, ayah])).toEqual({ shown: [ayah, ayah], rest: [ayah, ayah] });
  });

  it('shows at least one آية, however long', () => {
    const long = 'ب'.repeat(300);
    expect(foldOf([long, 'أ'])).toEqual({ shown: [long], rest: ['أ'] });
  });

  it('folds nothing when the whole سورة fits', () => {
    expect(foldOf(['أ', 'ب'])).toEqual({ shown: ['أ', 'ب'], rest: [] });
  });
});

describe('leadOf', () => {
  it('joins the time, the moment, and the read-to-the-end line', () => {
    const data: Dhikr = { ...base, mode: 'masaa', when: 'إذا أوى إلى فراشه', ayat: 'first' };
    expect(leadOf(data, Option.some([['أ']]))).toBe(
      'في المساء، إذا أوى إلى فراشه. تُقرأ إلى آخر السورة'
    );
  });

  it('says nothing of reading to the end for a سورة that folds, because the page holds it', () => {
    expect(
      leadOf({ ...base, ayat: 'fold', when: 'إذا أوى إلى فراشه' }, Option.some([['أ'], ['ب']]))
    ).toBe('إذا أوى إلى فراشه');
  });

  it('leaves the manner to its own line', () => {
    expect(leadOf({ ...base, when: 'إذا أخذ مضجعه', how: 'متوضئًا' }, Option.none())).toBe(
      'إذا أخذ مضجعه'
    );
  });

  it('is empty when there is nothing to say', () => {
    expect(leadOf({ ...base, quran: false }, Option.none())).toBe('');
  });
});

describe('fullLeadOf', () => {
  it('adds the manner after the moment, for a card that stands alone', () => {
    const data: Dhikr = { ...base, when: 'إذا أخذ مضجعه', how: 'متوضئًا', ayat: 'first' };
    expect(fullLeadOf(data, Option.some([['أ']]))).toBe(
      'إذا أخذ مضجعه، متوضئًا. تُقرأ إلى آخر السورة'
    );
  });
});
