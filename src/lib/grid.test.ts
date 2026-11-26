import { describe, expect, it } from 'vitest';
import { widthsOf } from './grid';

const COUNTS = Array.from({ length: 19 }, (_, index) => index + 2);
const unitsOf = (count: number) => widthsOf(count).map((width) => (width === 'wide' ? 2 : 1));
const sum = (units: ReadonlyArray<number>) => units.reduce((total, unit) => total + unit, 0);
const widesStartingMidRow = (count: number) => {
  const units = unitsOf(count);
  return units.filter((unit, index) => unit === 2 && sum(units.slice(0, index)) % 2 === 1);
};
const narrowRuns = (count: number) =>
  widthsOf(count)
    .join(' ')
    .split('wide')
    .map((run) => run.trim().split(' ').filter(Boolean).length);

describe('the widths of a card grid', () => {
  it.each(COUNTS)('gives each of %i cards a width', (count) => {
    expect(widthsOf(count)).toHaveLength(count);
  });

  it.each(COUNTS)('fills every row of two and of four with %i cards', (count) => {
    expect(sum(unitsOf(count)) % 4).toBe(0);
  });

  it.each(COUNTS)('starts no wide card in the middle of a row, with %i cards', (count) => {
    expect(widesStartingMidRow(count)).toEqual([]);
  });

  it.each(COUNTS)('keeps narrow cards in pairs, with %i cards', (count) => {
    expect(narrowRuns(count).filter((run) => run % 2 === 1)).toEqual([]);
  });

  it('starts with a wide card', () => {
    expect(widthsOf(8)[0]).toBe('wide');
  });
});
