import { describe, it, expect } from 'vitest';
import { adhkarLabel, toArabicDigits, timesLabel } from './arabic';

describe('adhkarLabel', () => {
  it('names a single dhikr in words', () => {
    expect(adhkarLabel(1)).toBe('ذكر واحد');
  });

  it('uses the dual for two', () => {
    expect(adhkarLabel(2)).toBe('ذكران');
  });

  it('uses the plural from three to ten', () => {
    expect(adhkarLabel(3)).toBe('٣ أذكار');
    expect(adhkarLabel(10)).toBe('١٠ أذكار');
  });

  it('uses the accusative singular above ten', () => {
    expect(adhkarLabel(14)).toBe('١٤ ذكرًا');
  });
});

describe('toArabicDigits', () => {
  it('converts single digits', () => {
    expect(toArabicDigits(3)).toBe('٣');
  });

  it('converts multi-digit numbers', () => {
    expect(toArabicDigits(100)).toBe('١٠٠');
  });

  it('converts zero', () => {
    expect(toArabicDigits(0)).toBe('٠');
  });
});

describe('timesLabel', () => {
  it('uses the dual for two', () => {
    expect(timesLabel(2)).toBe('مرتان');
  });

  it('uses the plural for three through ten', () => {
    expect(timesLabel(3)).toBe('٣ مرات');
    expect(timesLabel(7)).toBe('٧ مرات');
    expect(timesLabel(10)).toBe('١٠ مرات');
  });

  it('reverts to the singular above ten', () => {
    expect(timesLabel(11)).toBe('١١ مرة');
    expect(timesLabel(100)).toBe('١٠٠ مرة');
  });

  it('labels one, though the card suppresses the badge', () => {
    expect(timesLabel(1)).toBe('١ مرة');
  });
});
