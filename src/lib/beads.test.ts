import { describe, expect, it } from 'vitest';
import { beadRing } from './beads';

describe('beadRing', () => {
  it('draws one bead for each time up to ten', () => {
    expect(beadRing(3).beads).toHaveLength(3);
    expect(beadRing(10).beads).toHaveLength(10);
  });

  it('starts the ring at the top', () => {
    expect(beadRing(3).beads[0]).toEqual({ cx: '16.00', cy: '3.00' });
  });

  it('spaces the beads evenly around the ring', () => {
    const [, right, left] = beadRing(3).beads;
    expect(Number(right!.cy)).toBeCloseTo(Number(left!.cy));
    expect(Number(right!.cx) - 16).toBeCloseTo(16 - Number(left!.cx));
  });

  it('writes a count above ten as a number, with no beads', () => {
    expect(beadRing(100)).toEqual({ beads: [], label: '١٠٠' });
  });

  it('writes the number inside the beads too', () => {
    expect(beadRing(10).label).toBe('١٠');
  });
});
