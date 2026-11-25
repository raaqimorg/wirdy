import { describe, expect, it } from 'vitest';
import { baselineProblems } from './baseline';
import { readAdhkar, readPending, readProofs } from './records';

describe('the proofs of the adhkar', () => {
  it('prove each dhikr that is not pending, and name only adhkar that exist', () => {
    expect(baselineProblems(readAdhkar(), readProofs(), readPending())).toEqual([]);
  });

  it('cover every dhikr, each with its own id', () => {
    const ids = readAdhkar().map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it('keep the pending list sorted', () => {
    const ids = Object.keys(readPending());
    expect(ids).toEqual(ids.toSorted());
  });
});
