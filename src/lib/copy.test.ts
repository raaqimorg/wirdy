import { Effect, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { copyOf } from './copy';
import type { Dhikr } from './schema';

const copy = (data: Dhikr, body: string) => {
  const { sabah, masaa } = Effect.runSync(copyOf(data, body));
  return { sabah, masaa: Option.getOrNull(masaa) };
};

const base: Dhikr = {
  title: 'ذكر',
  headline: 'ذكر',
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
    expect(copy(base, 'أ ب').sabah).toBe('أ ب\n\nصحيح البخاري (١)');
  });

  it('puts the count and the moment before the takhrij', () => {
    const data: Dhikr = { ...base, count: 3, when: 'في اليوم' };
    expect(copy(data, 'أ').sabah).toBe('أ\n\n٣ مرات، في اليوم\nصحيح البخاري (١)');
  });

  it('gives each form of a dhikr that changes, and one form of a dhikr that does not', () => {
    expect(copy(base, '{{أ|ب}} ج')).toEqual({
      sabah: 'أ ج\n\nصحيح البخاري (١)',
      masaa: 'ب ج\n\nصحيح البخاري (١)',
    });
    expect(copy(base, 'أ').masaa).toBeNull();
  });

  it('gives each آية a line, each سورة a blank line, and no ornaments', () => {
    const data: Dhikr = { ...base, quran: true };
    expect(copy(data, 'أ\nب\n\nج').sabah).toBe('أ\nب\n\nج\n\nصحيح البخاري (١)');
  });

  it('gives only the first آية of each سورة, and says to read on, when only it shows', () => {
    const data: Dhikr = { ...base, quran: true, ayat: 'first' };
    expect(copy(data, 'أ\nب\n\nج\nد').sabah).toBe(
      'أ\n\nج\n\nتقرأ كل سورة إلى آخرها\nصحيح البخاري (١)'
    );
  });

  it('gives the آيات that show of a folded سورة, and says the rest is on the page', () => {
    const data: Dhikr = { ...base, quran: true, ayat: 'fold' };
    const ayah = 'ب'.repeat(100);
    const text = [ayah, ayah, ayah].join('\n');
    expect(copy(data, text).sabah).toBe(
      `${ayah}\n${ayah}\n\nوتتمة الآيات في الصفحة\nصحيح البخاري (١)`
    );
    expect(copy(data, 'أ\nب').sabah).toBe('أ\nب\n\nصحيح البخاري (١)');
  });

  it('names the time of a dhikr that has one, and changes no word of it', () => {
    const data: Dhikr = { ...base, mode: 'masaa' };
    expect(copy(data, 'أَ ب، ج.\n')).toEqual({
      sabah: 'أَ ب، ج.\n\nفي المساء\nصحيح البخاري (١)',
      masaa: null,
    });
  });

  it('gives each phrase a line with its count', () => {
    const data: Dhikr = { ...base, counts: [33, 34] };
    expect(copy(data, 'أ، ب').sabah).toBe('أ (٣٣ مرة)\nب (٣٤ مرة)\n\nصحيح البخاري (١)');
  });
});
