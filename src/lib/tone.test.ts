import { describe, expect, it } from 'vitest';
import { PALETTE } from './palette';
import {
  ARC,
  CHROMA,
  FIRST_HUE,
  LIGHTNESS,
  NIGHT,
  contrast,
  hexFromOklch,
  hueAt,
  linearFromOklch,
  strideFor,
} from './tone';

const ARC_HUES = Array.from({ length: ARC.span + 1 }, (_, step) => (ARC.from + step) % 360);
const DAY_AND_NIGHT = [
  ['by day', LIGHTNESS, CHROMA],
  ['by night', LIGHTNESS * NIGHT, CHROMA * NIGHT],
] as const;
const COUNTS = Array.from({ length: 15 }, (_, index) => index + 2);
const huesFor = (count: number) => Array.from({ length: count }, (_, index) => hueAt(index, count));
const gap = (one: number, other: number) => {
  const turn = Math.abs(one - other) % 360;
  return Math.min(turn, 360 - turn);
};

describe('the tone of a section', () => {
  it.each(COUNTS)('gives the first of %i sections the first hue', (count) => {
    expect(hueAt(0, count)).toBeCloseTo(FIRST_HUE, 6);
  });

  it.each(DAY_AND_NIGHT)('keeps every hue on the arc inside sRGB %s', (_, lightness, chroma) => {
    for (const hue of ARC_HUES) {
      for (const channel of linearFromOklch(lightness, chroma, hue)) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  });

  it.each(DAY_AND_NIGHT)(
    'keeps the eggshell text readable on every hue on the arc %s',
    (_, lightness, chroma) => {
      for (const hue of ARC_HUES) {
        const tone = hexFromOklch(lightness, chroma, hue);
        expect(contrast(tone, PALETTE.eggshell)).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  it('uses the lightest lightness that keeps the eggshell text readable', () => {
    const lighter = ARC_HUES.map((hue) => hexFromOklch(LIGHTNESS + 0.01, CHROMA, hue));
    expect(lighter.some((tone) => contrast(tone, PALETTE.eggshell) < 4.5)).toBe(true);
  });

  it.each(COUNTS)('keeps every hue of %i sections out of the olive band', (count) => {
    for (const hue of huesFor(count)) {
      expect(hue >= ARC.from || hue <= (ARC.from + ARC.span) % 360).toBe(true);
    }
  });

  it.each(COUNTS)('spaces %i sections evenly along the arc', (count) => {
    const hues = huesFor(count);
    const gaps = hues.flatMap((hue, index) =>
      hues.slice(index + 1).map((other) => gap(hue, other))
    );
    expect(Math.min(...gaps)).toBeCloseTo(ARC.span / count, 6);
  });

  it('steps through the arc by the whole number nearest the golden ratio', () => {
    expect([5, 8, 13].map((count) => strideFor(count))).toEqual([2, 3, 5]);
  });
});
