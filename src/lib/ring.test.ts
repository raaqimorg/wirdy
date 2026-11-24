import { describe, expect, it } from 'vitest';
import { ringPoints } from './ring';

describe('ringPoints', () => {
  it('starts at the top and goes clockwise', () => {
    expect(ringPoints(4, 16, 10)).toEqual([
      { cx: '16.00', cy: '6.00' },
      { cx: '26.00', cy: '16.00' },
      { cx: '16.00', cy: '26.00' },
      { cx: '6.00', cy: '16.00' },
    ]);
  });

  it('draws no points for a count of zero', () => {
    expect(ringPoints(0, 16, 10)).toEqual([]);
  });
});
