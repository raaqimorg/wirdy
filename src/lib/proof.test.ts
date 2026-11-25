import { describe, expect, it } from 'vitest';
import { Effect, Exit } from 'effect';
import { decodeProof } from './proof';

const dorar = {
  state: 'present',
  site: 'dorar',
  url: 'https://dorar.net/h/abc',
  book: 'صحيح مسلم',
  number: '2692',
  date: '2026-11-25',
  text: 'نص',
  grader: 'مسلم',
  ruling: 'صحيح',
};

const shamela = {
  state: 'present',
  site: 'shamela',
  url: 'https://shamela.ws/book/1/1',
  book: 'صحيح مسلم',
  number: '2692',
  date: '2026-11-25',
  text: 'نص',
  edition: 'ط التركية',
  volume: '8',
  page: '69',
};

const absent = {
  state: 'absent',
  site: 'sunnah',
  date: '2026-11-25',
  searches: ['بحث', 'بحث آخر'],
};

const proof = (...sources: object[]) => ({
  sources,
  claims: {},
  differences: [],
  rulings: [],
});

const accepts = (value: object) => Exit.isSuccess(Effect.runSyncExit(decodeProof(value)));

describe('the record of a dhikr', () => {
  it('holds pages that were read, and pages that were not found', () => {
    expect(accepts(proof(dorar, shamela, absent))).toBe(true);
  });

  it('refuses a dorar.net page with no grader or no ruling', () => {
    expect(accepts(proof({ ...dorar, grader: undefined }))).toBe(false);
    expect(accepts(proof({ ...dorar, ruling: undefined }))).toBe(false);
  });

  it('refuses a ruling from any other site', () => {
    expect(accepts(proof({ ...shamela, ruling: 'صحيح' }))).toBe(false);
  });

  it('refuses a Shamela page with no edition, volume, or page', () => {
    expect(accepts(proof({ ...shamela, edition: undefined }))).toBe(false);
    expect(accepts(proof({ ...shamela, volume: undefined }))).toBe(false);
    expect(accepts(proof({ ...shamela, page: undefined }))).toBe(false);
  });

  it('refuses dorar.net or Shamela as not found', () => {
    expect(accepts(proof({ ...absent, site: 'dorar' }))).toBe(false);
    expect(accepts(proof({ ...absent, site: 'shamela' }))).toBe(false);
  });

  it('refuses a page as not found after one search', () => {
    expect(accepts(proof({ ...absent, searches: ['بحث'] }))).toBe(false);
  });

  it('refuses a page with no text', () => {
    expect(accepts(proof({ ...dorar, text: ' ' }))).toBe(false);
  });

  it('refuses an unknown site, and an address that is not of its site', () => {
    expect(accepts(proof({ ...dorar, site: 'blog' }))).toBe(false);
    expect(accepts(proof({ ...dorar, url: 'https://example.com/h/abc' }))).toBe(false);
  });

  it('refuses a claim with no span, except the takhrij', () => {
    const fingerprint = '0123456789abcdef';
    const claims = (claim: string) => ({
      ...proof(dorar),
      claims: { [claim]: { fingerprint, spans: [] } },
    });
    expect(accepts(claims('text'))).toBe(false);
    expect(accepts(claims('takhrij'))).toBe(true);
  });

  it('refuses a difference with a reason outside the list', () => {
    const difference = {
      site: 'dorar',
      phrase: 'نص',
      reason: 'other',
      shown: { source: 0, text: 'نص' },
    };
    expect(accepts({ ...proof(dorar), differences: [difference] })).toBe(false);
    expect(accepts({ ...proof(dorar), differences: [{ ...difference, reason: 'carried' }] })).toBe(
      true
    );
  });

  it('has no field for a status', () => {
    expect(accepts({ ...proof(dorar), verified: true })).toBe(false);
  });
});
