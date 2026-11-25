import { Effect, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  formsOf as formsEffect,
  groupId as groupEffect,
  runsByGroup as runsOption,
} from './groups';

const runsByGroup = (entries: Parameters<typeof runsOption<Entry>>[0]) =>
  runsOption(entries).map(({ group, items }) => ({ group: Option.getOrUndefined(group), items }));
const formsOf = <T extends { readonly data: { readonly form?: 1 | 2 | 3 | 4 } }>(
  entries: ReadonlyArray<T>
) => Effect.runSync(formsEffect(entries));
const groupId = (group: string) => Effect.runSync(groupEffect(group));

type Entry = { readonly id: string; readonly data: { readonly group?: string } };

const entry = (id: string, group?: string): Entry => ({
  id,
  data: group === undefined ? {} : { group },
});

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

describe('formsOf', () => {
  it('keeps the adhkar of one alternative together', () => {
    const forms = formsOf([
      { id: 'a', data: { form: 1 as const } },
      { id: 'b', data: { form: 1 as const } },
      { id: 'c', data: { form: 2 as const } },
    ]);
    expect(forms.map(({ form, items }) => [form, items.map(({ id }) => id)])).toEqual([
      [1, ['a', 'b']],
      [2, ['c']],
    ]);
  });
});

describe('groupId', () => {
  it('gives a group its Latin slug', () => {
    expect(groupId('الحفظ')).toBe('al-hifz');
  });

  it('throws on a group that has no slug', () => {
    expect(() => groupId('بقية الأقسام')).toThrow('بقية الأقسام');
  });
});
