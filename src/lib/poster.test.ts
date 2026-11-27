import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  adhkarPosterOf as adhkarPosterEffect,
  FORMATS,
  occasionPostersOf,
  posterDownload,
  posterFile,
  themesOf,
  hadithPosterOf,
  type Format,
} from './poster';
import type { Dhikr, Hadith } from './schema';
import { SITE } from './site';

const base: Dhikr = {
  title: 'سيد الاستغفار',
  headline: 'سيد الاستغفار',
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

const hadith: Hadith = {
  title: 'الحبة السوداء',
  headline: 'الحبة السوداء',
  order: 1,
  group: 'الأدوية',
  rawi: 'أبي هريرة',
  takhrij: {
    grader: 'البخاري',
    source: 'صحيح البخاري ٥٦٨٨',
    ruling: 'صحيح',
    url: 'https://dorar.net/h/abc',
  },
};

const formatOf = (name: Format['name']) => FORMATS.find((format) => format.name === name)!;

const posterOf = (
  entries: ReadonlyArray<{ data: Dhikr; body: string }>,
  form: 'sabah' | 'masaa' = 'sabah',
  occasion: Dhikr['occasion'] = 'sabah-masaa'
) => Effect.runSync(adhkarPosterEffect(occasion, entries, form));

describe('adhkarPosterOf', () => {
  it('writes the evening words, and leaves out what belongs to the morning', () => {
    const entries = [
      { data: base, body: '{{أصبحنا|أمسينا}} لله' },
      { data: { ...base, order: 2, mode: 'sabah' as const }, body: 'رضيت بالله ربا' },
    ];
    expect(posterOf(entries).items.map(({ words }) => words)).toEqual([
      'أصبحنا لله',
      'رضيت بالله ربا',
    ]);
    const evening = posterOf(entries, 'masaa');
    expect(evening.heading).toBe('أذكار المساء');
    expect(evening.items.map(({ words }) => words)).toEqual(['أمسينا لله']);
  });

  it('keeps the order of the section, and numbers from one', () => {
    const entries = [
      { data: { ...base, order: 2, title: 'ثان' }, body: 'ب' },
      { data: { ...base, order: 1, title: 'أول' }, body: 'أ' },
    ];
    expect(posterOf(entries).items.map(({ number, title }) => [number, title])).toEqual([
      [1, 'أول'],
      [2, 'ثان'],
    ]);
  });

  it('carries each phrase with its count, and the form of a choice', () => {
    const [item] = posterOf([
      { data: { ...base, counts: [33, 34], form: 2 }, body: 'سبحان الله، والله أكبر' },
    ]).items;
    expect(item?.phrases).toEqual([
      { text: 'سبحان الله', count: 33 },
      { text: 'والله أكبر', count: 34 },
    ]);
    expect(item?.choice).toBe('الصيغة الثانية');
  });

  it('gives the Quran in full, and only the opening of a long folded سورة', () => {
    const quran = { ...base, quran: true, occasion: 'nawm' as const };
    const short = posterOf([{ data: quran, body: 'آية\nآية\n\nآية' }], 'sabah', 'nawm');
    expect(short.items[0]).toMatchObject({ suwar: [['آية', 'آية'], ['آية']], rest: '' });
    const long = posterOf(
      [{ data: { ...quran, ayat: 'fold' }, body: 'آية طويلة '.repeat(400) }],
      'sabah',
      'nawm'
    );
    expect(long.items[0]?.rest).toBe('wirdy.site/nawm/');
    expect(long.items[0]?.suwar[0]?.[0]?.length).toBeLessThan(400 * 'آية طويلة '.length);
  });
});

describe('the promise at the foot of a poster', () => {
  it('ends as the home page ends it', () => {
    const ending = `${SITE.promise.after} ${SITE.promise.more}`;
    expect(posterOf([{ data: base, body: 'رضيت بالله ربا' }]).promise).toBe(
      `${SITE.promise.before} ﷺ${ending}`
    );
    expect(
      hadithPosterOf('tibb', [{ data: hadith, body: 'في الحبة السوداء شفاء\n' }]).promise
    ).toMatch(new RegExp(`${ending}$`, 'u'));
  });
});

describe('occasionPostersOf', () => {
  it('gives الصباح والمساء a poster for each time, and any other section one', () => {
    const entries = [{ data: base, body: 'سبحان الله' }];
    const timed = Effect.runSync(occasionPostersOf('sabah-masaa', entries));
    expect(timed.map(({ slug, form }) => [slug, form])).toEqual([
      ['sabah', 'sabah'],
      ['masaa', 'masaa'],
    ]);
    const single = Effect.runSync(
      occasionPostersOf('taam', [{ data: { ...base, occasion: 'taam' }, body: 'بسم الله' }])
    );
    expect(single.map(({ slug, form }) => [slug, form])).toEqual([['taam', undefined]]);
  });
});

describe('hadithPosterOf', () => {
  it('carries each hadith with its narrator and source, and no count', () => {
    const poster = hadithPosterOf('tibb', [{ data: hadith, body: 'في الحبة السوداء شفاء\n' }]);
    expect(poster.slug).toBe('al-tibb-al-nabawi');
    expect(poster.items[0]).toMatchObject({
      lead: 'عن أبي هريرة',
      words: 'في الحبة السوداء شفاء',
      times: '',
    });
  });
});

describe('themesOf', () => {
  it('offers both themes in every format but print, which is always light', () => {
    expect(themesOf(formatOf('story'))).toEqual(['light', 'dark']);
    expect(themesOf(formatOf('print'))).toEqual(['light']);
  });
});

describe('posterFile', () => {
  const poster = posterOf([{ data: base, body: 'سبحان الله' }]);

  it('names a poster by its section, format, theme, and what it prints', () => {
    expect(posterFile(poster, formatOf('story'), 'dark')).toMatch(
      /^posters\/sabah\/story-dark-[0-9a-f]{8}\.png$/u
    );
    expect(posterDownload(poster, formatOf('print'), 'light')).toBe('wirdy-sabah-print.png');
    expect(posterDownload(poster, formatOf('story'), 'dark')).toBe('wirdy-sabah-story-dark.png');
  });

  it('changes when a word changes, and only then', () => {
    const story = formatOf('story');
    const same = posterOf([{ data: base, body: 'سبحان الله' }]);
    const changed = posterOf([{ data: base, body: 'سبحان الله وبحمده' }]);
    expect(posterFile(same, story, 'light')).toBe(posterFile(poster, story, 'light'));
    expect(posterFile(changed, story, 'light')).not.toBe(posterFile(poster, story, 'light'));
  });

  it('gives each format and theme its own file', () => {
    const files = FORMATS.flatMap((format) =>
      themesOf(format).map((theme) => posterFile(poster, format, theme))
    );
    expect(files).toHaveLength(9);
    expect(new Set(files).size).toBe(files.length);
  });
});
