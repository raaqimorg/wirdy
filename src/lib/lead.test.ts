import { describe, expect, it } from 'vitest';
import { fullLeadOf, leadOf, suwarOf } from './lead';
import type { Dhikr } from './schema';

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

  it('is nothing for a text that is not قرآن', () => {
    expect(suwarOf({ ...base, quran: false }, 'أ')).toBeNull();
  });
});

describe('leadOf', () => {
  it('joins the time, the moment, and the read-to-the-end line', () => {
    const data: Dhikr = { ...base, mode: 'masaa', when: 'إذا أوى إلى فراشه', ayat: 'first' };
    expect(leadOf(data, [['أ']])).toBe('في المساء، إذا أوى إلى فراشه. تُقرأ إلى آخر السورة');
  });

  it('leaves the manner to its own line', () => {
    expect(leadOf({ ...base, when: 'إذا أخذ مضجعه', how: 'متوضئًا' }, null)).toBe('إذا أخذ مضجعه');
  });

  it('is empty when there is nothing to say', () => {
    expect(leadOf({ ...base, quran: false }, null)).toBe('');
  });
});

describe('fullLeadOf', () => {
  it('adds the manner after the moment, for a card that stands alone', () => {
    const data: Dhikr = { ...base, when: 'إذا أخذ مضجعه', how: 'متوضئًا', ayat: 'first' };
    expect(fullLeadOf(data, [['أ']])).toBe('إذا أخذ مضجعه، متوضئًا. تُقرأ إلى آخر السورة');
  });
});
