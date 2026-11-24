import { describe, expect, it } from 'vitest';
import { runsByGroup } from './groups';

const entry = (id: string, group?: string) => ({ id, data: { group } });

describe('runsByGroup', () => {
  it('keeps entries without a group in one run', () => {
    const runs = runsByGroup([entry('a'), entry('b')]);
    expect(runs).toEqual([{ group: undefined, items: [entry('a'), entry('b')] }]);
  });

  it('starts a new run each time the group changes', () => {
    const runs = runsByGroup([
      entry('a'),
      entry('b', 'التسبيح'),
      entry('c', 'التسبيح'),
      entry('d'),
      entry('e', 'الطعام'),
    ]);
    expect(runs.map((run) => [run.group, run.items.map((item) => item.id)])).toEqual([
      [undefined, ['a']],
      ['التسبيح', ['b', 'c']],
      [undefined, ['d']],
      ['الطعام', ['e']],
    ]);
  });

  it('returns no runs for no entries', () => {
    expect(runsByGroup([])).toEqual([]);
  });
});
