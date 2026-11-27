import { describe, expect, it } from 'vitest';
import {
  canonicalPathsOf,
  dhikrAnchor,
  dhikrPath,
  hadithAnchor,
  hadithPath,
  slugOf,
} from './permalink';

describe('slugOf', () => {
  it('drops the folder and the order, so a reorder keeps the link', () => {
    expect(slugOf('nawm/02-ayat-al-kursi')).toBe('ayat-al-kursi');
    expect(slugOf('nawm/14-ayat-al-kursi')).toBe('ayat-al-kursi');
  });

  it('keeps a number that is not the order', () => {
    expect(slugOf('salah/05-tasbih-33')).toBe('tasbih-33');
  });
});

describe('the links of a dhikr', () => {
  it('has its own page', () => {
    expect(dhikrPath('nawm', 'ayat-al-kursi')).toBe('/nawm/ayat-al-kursi/');
  });

  it('has its place in the occasion page', () => {
    expect(dhikrAnchor('nawm', 'ayat-al-kursi')).toBe('/nawm/#ayat-al-kursi');
  });
});

describe('the links of a hadith of الطب النبوي', () => {
  it('has its own page under the section', () => {
    expect(hadithPath('tibb', 'tadawaw')).toBe('/al-tibb-al-nabawi/tadawaw/');
  });

  it('has its place in the section page', () => {
    expect(hadithAnchor('tibb', 'tadawaw')).toBe('/al-tibb-al-nabawi/#tadawaw');
  });
});

describe('the canonical page of a dhikr', () => {
  const canonical = canonicalPathsOf([
    { path: '/sabah-masaa/ayat-al-kursi/', headline: 'آية الكرسي' },
    { path: '/salah/ayat-al-kursi/', headline: 'آية الكرسي' },
    { path: '/nawm/ayat-al-kursi/', headline: 'آية الكرسي' },
    { path: '/nawm/bismika-amutu-wa-ahya/', headline: 'باسمك اللهم أموت وأحيا' },
  ]);

  it('is the first page in site order that shares its headline', () => {
    expect(canonical.get('/sabah-masaa/ayat-al-kursi/')).toBe('/sabah-masaa/ayat-al-kursi/');
    expect(canonical.get('/salah/ayat-al-kursi/')).toBe('/sabah-masaa/ayat-al-kursi/');
    expect(canonical.get('/nawm/ayat-al-kursi/')).toBe('/sabah-masaa/ayat-al-kursi/');
  });

  it('is the page itself when no other page shares its headline', () => {
    expect(canonical.get('/nawm/bismika-amutu-wa-ahya/')).toBe('/nawm/bismika-amutu-wa-ahya/');
  });
});
