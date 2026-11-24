import { describe, expect, it } from 'vitest';
import { excerptAyat, excerptClauses, letters } from './excerpt';

describe('letters', () => {
  it('counts no tashkil', () => {
    expect(letters('سُبْحَانَ')).toBe(letters('سبحان'));
  });
});

describe('excerptClauses', () => {
  it('keeps a text that fits whole', () => {
    expect(excerptClauses('سبحان الله، والحمد لله', 100)).toEqual({
      text: 'سبحان الله، والحمد لله',
      cut: false,
    });
  });

  it('stops at the end of a clause, and drops its comma', () => {
    expect(excerptClauses('لا إله إلا الله، وحده لا شريك له، له الملك', 20)).toEqual({
      text: 'لا إله إلا الله',
      cut: true,
    });
  });

  it('keeps the first clause whole, even when it is past the limit', () => {
    expect(excerptClauses('لا إله إلا الله العظيم الحليم، رب العرش', 5).text).toBe(
      'لا إله إلا الله العظيم الحليم'
    );
  });
});

describe('excerptAyat', () => {
  it('stops at the end of an آية', () => {
    expect(excerptAyat(['أ ب ج', 'د ه و', 'ز ح ط'], 11)).toEqual({
      ayat: ['أ ب ج', 'د ه و'],
      cut: true,
    });
  });

  it('never breaks the first آية', () => {
    expect(excerptAyat(['أ ب ج د', 'ه'], 2)).toEqual({ ayat: ['أ ب ج د'], cut: true });
  });
});
