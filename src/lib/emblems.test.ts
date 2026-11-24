import { describe, expect, it } from 'vitest';
import { EMBLEMS } from './emblems';
import { OCCASION_IDS } from './occasions';

const POSITIONS = ['cx', 'cy', 'x', 'y'];

describe('EMBLEMS', () => {
  it.each(OCCASION_IDS)('draws an emblem for %s', (occasion) => {
    expect(EMBLEMS[occasion].length).toBeGreaterThan(0);
  });

  it('keeps every shape inside the 240 unit stage', () => {
    const positions = Object.values(EMBLEMS)
      .flat()
      .flatMap(({ attrs }) =>
        POSITIONS.filter((key) => key in attrs).map((key) => Number(attrs[key]))
      );
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.filter((value) => value < 0 || value > 240)).toEqual([]);
  });
});
