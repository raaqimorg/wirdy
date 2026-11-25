import { describe, expect, it } from 'vitest';
import { claimsOf, fingerprintOf } from './fingerprint';
import type { Proof } from './proof';
import type { Dhikr } from './schema';
import { statusOf } from './verification';

type Present = Extract<Proof['sources'][number], { state: 'present' }>;

const BODY = 'سُبْحَانَ اللَّهِ، وَبِحَمْدِهِ';
const WORDS = 'من قال حين يصبح: سبحان الله، وبحمده، مائة مرة، حطت خطاياه';
const URL_OF_DORAR = 'https://dorar.net/h/abc';

const dhikr: Dhikr = {
  title: 'سبحان الله وبحمده',
  occasion: 'sabah-masaa',
  order: 16,
  count: 100,
  mode: 'sabah',
  quran: false,
  ayat: 'all',
  fadl: 'حطت خطاياه',
  takhrij: {
    grader: 'مسلم',
    source: 'صحيح مسلم ٢٦٩٢',
    ruling: 'صحيح',
    url: URL_OF_DORAR,
  },
};

const page = { state: 'present', book: 'صحيح مسلم', number: '2692', date: '2026-11-25' } as const;

const dorar: Present = {
  ...page,
  site: 'dorar',
  url: URL_OF_DORAR,
  text: WORDS,
  grader: 'مسلم',
  ruling: 'صحيح',
};
const shamela: Present = {
  ...page,
  site: 'shamela',
  url: 'https://shamela.ws/book/1/1',
  text: WORDS,
  edition: 'ط التركية',
  volume: '8',
  page: '69',
};
const hdith: Present = {
  ...page,
  site: 'hdith',
  url: 'https://hdith.com/encyclopedia/book/b-2/h/1',
  text: WORDS,
};
const sunnah: Present = {
  ...page,
  site: 'sunnah',
  url: 'https://sunnah.com/muslim:2692',
  text: WORDS,
};
const alukah: Present = { ...page, site: 'alukah', url: 'https://www.alukah.net/a/1', text: WORDS };
const tanzil: Present = { ...page, site: 'tanzil', url: 'https://tanzil.net/', text: BODY };

const absent = (site: 'hdith' | 'sunnah') => ({
  state: 'absent' as const,
  site,
  date: '2026-11-25',
  searches: ['أ', 'ب'],
});

const pagesWith = (text: string): Proof['sources'] => [
  { ...dorar, text },
  { ...shamela, text },
  { ...hdith, text },
  { ...sunnah, text },
];

const SOURCES = pagesWith(WORDS);

function proofOf(data: Dhikr, body: string, sources = SOURCES): Proof {
  const everywhere = sources.flatMap((source, index) =>
    source.state === 'present' ? [{ source: index, text: source.text }] : []
  );
  const claims = Object.fromEntries(
    claimsOf(data).map((claim) => [
      claim,
      { fingerprint: fingerprintOf(claim, data, body), spans: everywhere },
    ])
  );
  return { sources, claims, differences: [], rulings: [] };
}

const valid = proofOf(dhikr, BODY);
const status = (proof: Proof, data = dhikr, body = BODY) => statusOf(data, body, proof);
const withSources = (...sources: Proof['sources']) => proofOf(dhikr, BODY, sources);

const countSpan = (text: string) => ({
  ...valid,
  claims: { ...valid.claims, count: { ...valid.claims.count!, spans: [{ source: 0, text }] } },
});

const cited = (change: Partial<Present>) =>
  withSources({ ...dorar, ...change }, ...SOURCES.slice(1));

const without = (site: 'hdith' | 'sunnah') =>
  withSources(...SOURCES.filter((source) => source.site !== site));

describe('statusOf', () => {
  it('is proven when every rule holds', () => {
    expect(status(valid)).toEqual({ state: 'proven', problems: [] });
  });

  it('is unproven with no record', () => {
    expect(statusOf(dhikr, BODY)).toEqual({ state: 'unproven', problems: ['has no record'] });
  });

  it('is changed, and names the claim, when a fingerprint expires', () => {
    expect(status(valid, { ...dhikr, count: 10 })).toEqual({
      state: 'changed',
      problems: ['count changed since it was proven'],
    });
  });

  it('is unproven when something else is wrong beside a change', () => {
    const { text: _, ...claims } = valid.claims;
    expect(status({ ...valid, claims }, { ...dhikr, count: 10 }).state).toBe('unproven');
  });
});

describe('the claims', () => {
  it('are proven by exact parts of a source', () => {
    expect(status(countSpan('مائة مرة')).state).toBe('proven');
    expect(status(countSpan('ألف مرة')).problems).toEqual(['count: a span is not in its source']);
  });

  it('point to a source that was read', () => {
    const proof = withSources(dorar, shamela, hdith, absent('sunnah'));
    proof.claims.count!.spans = [{ source: 3, text: 'مائة' }];
    expect(status(proof).problems).toContain('count: a span is not in its source');
    proof.claims.count!.spans = [{ source: 9, text: 'مائة' }];
    expect(status(proof).problems).toContain('count: a span is not in its source');
  });

  it('are all that the dhikr makes', () => {
    const { count: _, ...claims } = valid.claims;
    expect(status({ ...valid, claims }).problems).toEqual(['count is not proven']);
  });

  it('are none that the dhikr does not make', () => {
    const { fadl: _, ...plain } = dhikr;
    expect(status(valid, plain).problems).toEqual(['fadl is proven but not stated']);
  });

  it('are not proven by alukah.net alone', () => {
    const proof = withSources(...SOURCES, alukah);
    proof.claims.count!.spans = [{ source: 4, text: 'مائة مرة' }];
    expect(status(proof).state).toBe('unproven');
  });

  it.each(['count', 'moment', 'fadl'] as const)('give the %s in the cited page', (claim) => {
    const proof = proofOf(dhikr, BODY);
    proof.claims[claim]!.spans = [{ source: 1, text: WORDS }];
    expect(status(proof).problems).toEqual([`${claim}: no span is from the cited dorar.net page`]);
  });
});

describe('the sources', () => {
  it('have dorar.net and Shamela', () => {
    expect(status(withSources(shamela, hdith, sunnah)).state).toBe('unproven');
    expect(status(withSources(dorar, hdith, sunnah)).problems).toContain('shamela is missing');
  });

  it.each([
    ['dorar', 0],
    ['shamela', 1],
  ] as const)('cover the whole text in %s by itself', (site, index) => {
    const proof = proofOf(dhikr, BODY);
    const spans = proof.claims.text!.spans.filter(({ source }) => source !== index);
    proof.claims.text!.spans = [...spans, { source: index, text: 'سبحان الله' }];
    expect(status(proof).problems).toEqual([`text: ${site} does not cover «وبحمده»`]);
  });

  it('may differ, when the difference is named and shown', () => {
    const proof = withSources(dorar, { ...shamela, text: 'سبحان الله' }, hdith, sunnah);
    expect(status(proof).state).toBe('unproven');
    const difference = {
      site: 'shamela',
      phrase: 'وَبِحَمْدِهِ',
      reason: 'narration',
      shown: { source: 1, text: 'سبحان الله' },
    } as const;
    expect(status({ ...proof, differences: [difference] }).state).toBe('proven');
    const unseen = { ...difference, shown: { source: 1, text: 'غير موجود' } };
    expect(status({ ...proof, differences: [unseen] }).problems).toEqual([
      'difference «وَبِحَمْدِهِ»: what shows it is not in its source',
    ]);
  });

  it('keep no difference that is not there', () => {
    const difference = {
      site: 'shamela',
      phrase: 'سُبْحَانَ اللَّهِ',
      reason: 'narration',
      shown: { source: 1, text: 'سبحان الله' },
    } as const;
    expect(status({ ...valid, differences: [difference] }).problems).toEqual([
      'difference «سُبْحَانَ اللَّهِ»: shamela has this phrase',
    ]);
  });

  it('cover both the morning and the evening form', () => {
    const body = '{{أصبحنا|أمسينا}} على الفطرة';
    const data: Dhikr = { ...dhikr, mode: 'both' };
    const morning = pagesWith('أصبحنا على الفطرة');
    const both = pagesWith('أصبحنا على الفطرة، أمسينا على الفطرة');
    expect(status(proofOf(data, body, morning), data, body).problems).toContain(
      'text: dorar does not cover «أمسينا على الفطرة»'
    );
    expect(status(proofOf(data, body, both), data, body).state).toBe('proven');
  });
});

describe('the takhrij', () => {
  it('links to a dorar.net page of the record', () => {
    expect(status(cited({ url: 'https://dorar.net/h/other' })).problems).toContain(
      'takhrij: the cited dorar.net page is missing'
    );
  });

  it.each([
    ['book', { book: 'صحيح البخاري' }],
    ['number', { number: '2693' }],
    ['grader', { grader: 'الألباني' }],
    ['ruling', { ruling: 'حسن' }],
  ])('has the %s of that page', (_, change) => {
    expect(status(cited(change)).state).toBe('unproven');
  });

  it('reads the digits of either script as equal', () => {
    expect(status(cited({ number: '٢٦٩٢' })).state).toBe('proven');
  });
});

describe('hdith.com and sunnah.com', () => {
  it('are both looked up', () => {
    expect(status(without('hdith')).problems).toEqual(['hdith is not looked up']);
    expect(status(without('sunnah')).problems).toEqual(['sunnah is not looked up']);
  });

  it('need one of the two to carry the text, where they have the book', () => {
    expect(status(withSources(dorar, shamela, hdith, absent('sunnah'))).state).toBe('proven');
    expect(status(withSources(dorar, shamela, absent('hdith'), sunnah)).state).toBe('proven');
    expect(status(withSources(dorar, shamela, absent('hdith'), absent('sunnah'))).problems).toEqual(
      ['neither hdith nor sunnah carries the text']
    );
  });

  it('do not carry the text when a phrase is missing', () => {
    const short = { ...sunnah, text: 'سبحان الله' };
    expect(status(withSources(dorar, shamela, absent('hdith'), short)).problems).toEqual([
      'neither hdith nor sunnah carries the text',
    ]);
  });

  it('may both be without a book that they do not have', () => {
    const data: Dhikr = {
      ...dhikr,
      takhrij: { ...dhikr.takhrij, grader: 'الألباني', source: 'السلسلة الصحيحة ٣/٥٤' },
    };
    const albani: Present = {
      ...dorar,
      book: 'السلسلة الصحيحة',
      number: '3/54',
      grader: 'الألباني',
    };
    const proof = proofOf(data, BODY, [albani, shamela, absent('hdith'), absent('sunnah')]);
    expect(status(proof, data)).toEqual({ state: 'proven', problems: [] });
  });
});

describe('a Quran text', () => {
  const data: Dhikr = { ...dhikr, quran: true };
  const hadith = pagesWith('اقرأ آية الكرسي');

  it('is proven by Tanzil, with the hadith of its moment', () => {
    expect(status(proofOf(data, BODY, [...hadith, tanzil]), data).state).toBe('proven');
  });

  it('is unproven with no Tanzil text, or a text that differs', () => {
    expect(status(proofOf(data, BODY, hadith), data).problems).toContain('tanzil is missing');
    const other = { ...tanzil, text: 'سبحان الله' };
    expect(status(proofOf(data, BODY, [...hadith, other]), data).problems).toContain(
      'text: tanzil does not cover «وبحمده»'
    );
  });

  it('still needs dorar.net and Shamela', () => {
    const proof = proofOf(data, BODY, [...hadith.slice(0, 1), ...hadith.slice(2), tanzil]);
    expect(status(proof, data).problems).toContain('shamela is missing');
  });
});
