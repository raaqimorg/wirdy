import { describe, expect, it } from 'vitest';
import { OCCASIONS } from './occasions';
import { PALETTE } from './palette';
import { UNPROVEN } from './site';
import { contrast, hueOf } from './tone';

const COLORS = [...OCCASIONS.map(({ id, color }) => [id, color]), ['unproven', UNPROVEN.color]];

describe('the occasion colors', () => {
  it.each(COLORS)('keeps the eggshell text readable on %s', (_, color) => {
    expect(contrast(color, PALETTE.eggshell)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps neighbours on the list at least 100 degrees apart', () => {
    const hues = OCCASIONS.map(({ color }) => hueOf(color));
    for (const [index, hue] of hues.slice(1).entries()) {
      const turn = Math.abs(hue - hues[index]!) % 360;
      expect(Math.min(turn, 360 - turn)).toBeGreaterThanOrEqual(100);
    }
  });

  it('gives every occasion its own color', () => {
    expect(new Set(OCCASIONS.map(({ color }) => color)).size).toBe(OCCASIONS.length);
  });
});
