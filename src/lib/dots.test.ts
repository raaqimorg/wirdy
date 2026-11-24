import { describe, expect, it } from 'vitest';
import { dotGrid } from './dots';

describe('dotGrid', () => {
  it('draws a small count as one row of large dots', () => {
    expect(dotGrid(3)).toEqual({ cols: 3, rows: 1, fine: false });
  });

  it('keeps ten in one row', () => {
    expect(dotGrid(10)).toEqual({ cols: 10, rows: 1, fine: false });
  });

  it('draws a hundred as five rows of twenty fine dots', () => {
    expect(dotGrid(100)).toEqual({ cols: 20, rows: 5, fine: true });
  });

  it('refuses a count it cannot draw evenly', () => {
    expect(() => dotGrid(33)).toThrow(/No dot grid/);
  });
});
