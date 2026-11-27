import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { baselineProblems as problemsEffect, type Entry } from './baseline';
import { claimsOf, fingerprintOf, wholeFingerprint } from './fingerprint';
import type { Proof } from './proof';
import type { Dhikr } from './schema';

const baselineProblems = (...args: Parameters<typeof problemsEffect>) =>
  Effect.runSync(problemsEffect(...args));

const BODY = 'سُبْحَانَ اللَّهِ';

const data: Dhikr = {
  title: 'سبحان الله',
  headline: 'سبحان الله',
  occasion: 'mutlaq',
  order: 1,
  count: 1,
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

const entry: Entry = { id: 'mutlaq/subhan-allah', data, body: BODY };

const page = {
  state: 'present',
  book: 'صحيح مسلم',
  number: '2692',
  date: '2026-11-25',
  text: 'سبحان الله',
} as const;

const proof: Proof = {
  sources: [
    { ...page, site: 'dorar', url: 'https://dorar.net/h/abc', grader: 'مسلم', ruling: 'صحيح' },
    {
      ...page,
      site: 'shamela',
      url: 'https://shamela.ws/book/1/1',
      edition: 'ط التركية',
      volume: '8',
      page: '69',
    },
    { ...page, site: 'hdith', url: 'https://hdith.com/encyclopedia/book/b-2/h/1' },
    { ...page, site: 'sunnah', url: 'https://sunnah.com/muslim:2692' },
  ],
  claims: Object.fromEntries(
    claimsOf(data).map((claim) => [
      claim,
      {
        fingerprint: fingerprintOf(claim, data, BODY),
        spans: [0, 1, 2, 3].map((source) => ({ source, text: 'سبحان الله' })),
      },
    ])
  ),
  differences: [],
  rulings: [],
};

const pending = { [entry.id]: wholeFingerprint(data, BODY) };
const proofs = { [entry.id]: proof };
const broken = { [entry.id]: { ...proof, sources: proof.sources.slice(0, 1) } };

describe('baselineProblems', () => {
  it('accepts a proven dhikr, and a pending one', () => {
    expect(baselineProblems([entry], proofs, {})).toEqual([]);
    expect(baselineProblems([entry], {}, pending)).toEqual([]);
  });

  it('accepts a record in progress while its dhikr is pending', () => {
    expect(baselineProblems([entry], broken, pending)).toEqual([]);
  });

  it('refuses a dhikr with no proof that is not pending', () => {
    expect(baselineProblems([entry], {}, {})).toEqual([
      'mutlaq/subhan-allah is unproven and not pending',
    ]);
    expect(baselineProblems([entry], broken, {})).toEqual([
      'mutlaq/subhan-allah is unproven and not pending',
    ]);
  });

  it('refuses a proven dhikr that changed', () => {
    const edited = { ...entry, body: 'سُبْحَانَ اللَّهُ' };
    expect(baselineProblems([edited], proofs, {})).toEqual([
      'mutlaq/subhan-allah is changed and not pending',
    ]);
  });

  it('refuses a proven dhikr that is still pending', () => {
    expect(baselineProblems([entry], proofs, pending)).toEqual([
      'mutlaq/subhan-allah is proven and must leave the pending list',
    ]);
  });

  it('refuses a pending dhikr that changed', () => {
    const edited = { ...entry, data: { ...data, count: 3 } };
    expect(baselineProblems([edited], {}, pending)).toEqual([
      'mutlaq/subhan-allah changed while pending and must be proven',
    ]);
  });

  it('refuses a record and a pending entry of a dhikr that is gone', () => {
    expect(baselineProblems([], proofs, pending)).toEqual([
      'mutlaq/subhan-allah has a record but no dhikr',
      'mutlaq/subhan-allah is pending but no dhikr',
    ]);
  });

  it('keeps a proof when the order changes', () => {
    expect(baselineProblems([{ ...entry, data: { ...data, order: 9 } }], proofs, {})).toEqual([]);
  });
});
