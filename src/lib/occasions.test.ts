import { describe, expect, it } from 'vitest';
import { OCCASIONS } from './occasions';
import { UNPROVEN } from './site';

const EGGSHELL = '#f4f1d0';
const PAPER_DARK = '#060f13';

function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(one: string, other: string): number {
  const [dark, light] = [luminance(one), luminance(other)].toSorted((a, b) => a - b) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

const COLORS = [...OCCASIONS.map(({ id, color }) => [id, color]), ['unproven', UNPROVEN.color]];

describe('the occasion colors', () => {
  it.each(COLORS)('keeps the eggshell text readable on %s', (_, color) => {
    expect(contrast(color!, EGGSHELL)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(COLORS)('keeps %s visible on the dark paper', (_, color) => {
    expect(contrast(color!, PAPER_DARK)).toBeGreaterThanOrEqual(3);
  });
});
