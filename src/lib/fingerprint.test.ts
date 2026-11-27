import { describe, expect, it } from 'vitest';
import { claimsOf, fingerprintOf, wholeFingerprint, type Claim } from './fingerprint';
import type { Dhikr } from './schema';

const CLAIMS: Claim[] = ['text', 'count', 'moment', 'manner', 'fadl', 'takhrij'];
const BODY = 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ';

const dhikr: Dhikr = {
  title: 'سبحان الله وبحمده',
  headline: 'سبحان الله وبحمده',
  occasion: 'sabah-masaa',
  order: 16,
  count: 100,
  mode: 'both',
  quran: false,
  ayat: 'all',
  takhrij: {
    grader: 'مسلم',
    source: 'صحيح مسلم ٢٦٩٢',
    ruling: 'صحيح',
    url: 'https://dorar.net/h/abc',
  },
};

const prints = (data: Dhikr, body = BODY) =>
  CLAIMS.map((claim) => fingerprintOf(claim, data, body));

const changed = (data: Dhikr, body = BODY) => {
  const before = prints(dhikr);
  const after = prints(data, body);
  return CLAIMS.filter((_, index) => before[index] !== after[index]);
};

describe('fingerprintOf', () => {
  it('is 16 hex characters', () => {
    expect(fingerprintOf('text', dhikr, BODY)).toMatch(/^[0-9a-f]{16}$/u);
  });

  it('expires the text when only tashkil changes', () => {
    expect(changed(dhikr, BODY.replace('سُ', 'سَ'))).toEqual(['text']);
  });

  it('keeps the text when only white space around it changes', () => {
    expect(changed(dhikr, `\n${BODY}\n`)).toEqual([]);
  });

  it('expires the count alone when the count changes', () => {
    expect(changed({ ...dhikr, count: 10 })).toEqual(['count']);
  });

  it('expires the moment when when, mode, context, or occasion changes', () => {
    expect(changed({ ...dhikr, when: 'بعد الفجر' })).toEqual(['moment']);
    expect(changed({ ...dhikr, mode: 'sabah' })).toEqual(['moment']);
    expect(changed({ ...dhikr, occasion: 'nawm' })).toEqual(['moment']);
    expect(changed(Object.assign({}, dhikr, { context: 'عند النوم' }))).toEqual(['moment']);
  });

  it('expires the manner, the fadl, or the takhrij alone', () => {
    expect(changed({ ...dhikr, how: 'بيده' })).toEqual(['manner']);
    expect(changed({ ...dhikr, fadl: 'حطت خطاياه' })).toEqual(['fadl']);
    expect(changed({ ...dhikr, takhrij: { ...dhikr.takhrij, ruling: 'حسن' } })).toEqual([
      'takhrij',
    ]);
  });

  it('keeps every fingerprint when order, title, group, form, ayat, or note changes', () => {
    const data: Dhikr = {
      ...dhikr,
      order: 2,
      title: 'اسم',
      group: 'باب',
      form: 1,
      ayat: 'first',
      note: 'قول',
    };
    expect(changed(data)).toEqual([]);
  });

  it('does not change when an optional field is absent or undefined', () => {
    expect(changed({ ...dhikr, when: undefined, counts: undefined } as unknown as Dhikr)).toEqual(
      []
    );
  });

  it('does not depend on the order of the fields', () => {
    const { url, ruling, source, grader } = dhikr.takhrij;
    expect(changed({ ...dhikr, takhrij: { url, ruling, source, grader } })).toEqual([]);
  });
});

describe('wholeFingerprint', () => {
  it('changes with any claim', () => {
    expect(wholeFingerprint({ ...dhikr, count: 10 }, BODY)).not.toBe(wholeFingerprint(dhikr, BODY));
  });

  it('stays when nothing proven changes', () => {
    expect(wholeFingerprint({ ...dhikr, order: 1 }, BODY)).toBe(wholeFingerprint(dhikr, BODY));
  });
});

describe('claimsOf', () => {
  const general: Dhikr = { ...dhikr, occasion: 'mutlaq', count: 1 };

  it('is the text and the takhrij for a general dhikr said once', () => {
    expect(claimsOf(general)).toEqual(['text', 'takhrij']);
  });

  it('adds the count when it is more than one, or for each phrase', () => {
    expect(claimsOf({ ...general, count: 3 })).toContain('count');
    expect(claimsOf({ ...general, counts: [33, 33] })).toContain('count');
  });

  it('adds the moment for an occasion, a cue, or a context', () => {
    expect(claimsOf({ ...general, occasion: 'nawm' })).toContain('moment');
    expect(claimsOf({ ...general, when: 'عند الغضب' })).toContain('moment');
    expect(claimsOf(Object.assign({}, general, { context: 'عند النوم' }))).toContain('moment');
  });

  it('adds the manner and the fadl when they are stated', () => {
    expect(claimsOf({ ...general, how: 'بيده', fadl: 'فضل' })).toEqual([
      'text',
      'manner',
      'fadl',
      'takhrij',
    ]);
  });
});
