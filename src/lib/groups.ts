export type Run<T> = { group?: string; items: T[] };
export type Form<T> = { form?: number; items: T[] };

function runsBy<T, K>(entries: T[], keyOf: (entry: T) => K): { key: K; items: T[] }[] {
  const runs: { key: K; items: T[] }[] = [];
  for (const entry of entries) {
    const key = keyOf(entry);
    const last = runs.at(-1);
    if (last && last.key === key) {
      last.items.push(entry);
    } else {
      runs.push({ key, items: [entry] });
    }
  }
  return runs;
}

export function runsByGroup<T extends { data: { group?: string } }>(entries: T[]): Run<T>[] {
  return runsBy(entries, ({ data }) => data.group).map(({ key, items }) => ({ group: key, items }));
}

export function formsOf<T extends { data: { form?: number } }>(entries: T[]): Form<T>[] {
  return runsBy(entries, ({ data }) => data.form).map(({ key, items }) => ({ form: key, items }));
}

export function groupId(group: string): string {
  return group.replaceAll(' ', '-');
}
