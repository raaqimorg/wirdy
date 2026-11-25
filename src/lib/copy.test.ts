import { describe, expect, it } from 'vitest';
import { copyOf } from './copy';
import type { Dhikr } from './schema';

const base: Dhikr = {
  title: 'ذكر',
  occasion: 'sabah-masaa',
  order: 1,
  count: 1,
  mode: 'both',
  quran: false,
  ayat: 'all',
  takhrij: {
    grader: 'البخاري',
    source: 'صحيح البخاري ١',
    ruling: 'صحيح',
    url: 'https://dorar.net/hadith/sharh/1',
  },
};

describe('copyOf', () => {
  it('gives the words, then a blank line, then the takhrij', () => {
    expect(copyOf(base, 'أ ب').sabah).toBe('أ ب\n\nصحيح البخاري (١)');
  });

  it('puts the count and the moment before the takhrij', () => {
    const data: Dhikr = { ...base, count: 3, when: 'في اليوم' };
    expect(copyOf(data, 'أ').sabah).toBe('أ\n\n٣ مرات، في اليوم\nصحيح البخاري (١)');
  });

  it('gives each form of a dhikr that changes, and one form of a dhikr that does not', () => {
    expect(copyOf(base, '{{أ|ب}} ج')).toEqual({
      sabah: 'أ ج\n\nصحيح البخاري (١)',
      masaa: 'ب ج\n\nصحيح البخاري (١)',
    });
    expect(copyOf(base, 'أ').masaa).toBeNull();
  });

  it('gives each آية a line, each سورة a blank line, and no ornaments', () => {
    const data: Dhikr = { ...base, quran: true };
    expect(copyOf(data, 'أ\nب\n\nج').sabah).toBe('أ\nب\n\nج\n\nصحيح البخاري (١)');
  });

  it('gives only the first آية of each سورة, and says to read on, when only it shows', () => {
    const data: Dhikr = { ...base, quran: true, ayat: 'first' };
    expect(copyOf(data, 'أ\nب\n\nج\nد').sabah).toBe(
      'أ\n\nج\n\nتُقرأ كل سورة إلى آخرها\nصحيح البخاري (١)'
    );
  });

  it('names the time of a dhikr that has one, and changes no word of it', () => {
    const data: Dhikr = { ...base, mode: 'masaa' };
    expect(copyOf(data, 'أَ ب، ج.\n')).toEqual({
      sabah: 'أَ ب، ج.\n\nفي المساء\nصحيح البخاري (١)',
      masaa: null,
    });
  });

  it('gives each phrase a line with its count', () => {
    const data: Dhikr = { ...base, counts: [33, 34] };
    expect(copyOf(data, 'أ، ب').sabah).toBe('أ (٣٣ مرة)\nب (٣٤ مرة)\n\nصحيح البخاري (١)');
  });
});
