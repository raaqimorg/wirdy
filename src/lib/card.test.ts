import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { cardFile, cardOf as cardEffect } from './card';
import type { Dhikr } from './schema';

const base: Dhikr = {
  title: 'سيد الاستغفار',
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

const cardOf = (data: Dhikr, body: string) => Effect.runSync(cardEffect(data, body));

describe('cardOf', () => {
  it('carries the moment, the count, and the takhrij with the text', () => {
    const card = cardOf({ ...base, count: 3, when: 'إذا أمسى' }, 'سبحان الله\n');
    expect(card).toMatchObject({
      heading: 'أذكار الصباح والمساء',
      lead: 'إذا أمسى',
      count: '٣ مرات',
      takhrij: 'صحيح البخاري (١)',
      blocks: [['سبحان الله']],
      evening: null,
      cut: false,
    });
  });

  it('carries the context apart from the name', () => {
    const card = cardOf(
      { ...base, title: 'أعوذ بكلمات الله التامات', context: 'في المساء' },
      'سبحان الله'
    );
    expect(card).toMatchObject({ title: 'أعوذ بكلمات الله التامات', context: 'في المساء' });
    expect(cardOf(base, 'سبحان الله').context).toBeNull();
  });

  it('carries each phrase with its own count', () => {
    const card = cardOf({ ...base, counts: [33, 34] }, 'سبحان الله، والله أكبر');
    expect(card.phrases).toEqual([
      { text: 'سبحان الله', count: 33 },
      { text: 'والله أكبر', count: 34 },
    ]);
    expect(cardOf(base, 'سبحان الله')).not.toHaveProperty('phrases');
  });

  it('shows the morning form, and the evening form under it', () => {
    const card = cardOf(base, '{{أصبحنا|أمسينا}} لله');
    expect(card.blocks).toEqual([['أصبحنا لله']]);
    expect(card.evening).toBe('أمسينا لله');
  });

  it('says that the آيات go on when it stops before the last one', () => {
    const card = cardOf({ ...base, quran: true }, `${'أ ب '.repeat(60)}\n${'ج د '.repeat(60)}`);
    expect(card.cut).toBe(true);
    expect(card.blocks[0]).toHaveLength(1);
    expect(card.lead).toBe('وتتمة الآيات في الصفحة');
  });
  it('shares its letters among the سور of a folded card, so two سور fit as one does', () => {
    const ayah = 'ب'.repeat(60);
    const surah = [ayah, ayah, ayah, ayah, ayah].join('\n');
    const card = cardOf({ ...base, quran: true, ayat: 'fold' }, `${surah}\n\n${surah}`);
    expect(card.blocks).toEqual([
      [ayah, ayah],
      [ayah, ayah],
    ]);
  });

  it('shows the آيات that show on the page of a folded سورة, and says the rest is there', () => {
    const ayah = 'ب'.repeat(100);
    const card = cardOf({ ...base, quran: true, ayat: 'fold' }, [ayah, ayah, ayah].join('\n'));
    expect(card.blocks).toEqual([[ayah, ayah]]);
    expect(card.lead).toBe('وتتمة الآيات في الصفحة');
  });
});

describe('cardFile', () => {
  it('names the card after its place and what it says', () => {
    const card = cardOf(base, 'سبحان الله');
    const file = cardFile(card, 'sabah-masaa', 'tasbih');
    expect(file).toMatch(/^og\/sabah-masaa\/tasbih-[0-9a-f]{8}\.png$/u);
    expect(cardFile(card, 'sabah-masaa', 'tasbih')).toBe(file);
    expect(cardFile(cardOf(base, 'الحمد لله'), 'sabah-masaa', 'tasbih')).not.toBe(file);
  });
});
