export type Run<T> = { group?: string; items: T[] };

export function runsByGroup<T extends { data: { group?: string } }>(entries: T[]): Run<T>[] {
  const runs: Run<T>[] = [];
  for (const entry of entries) {
    const last = runs.at(-1);
    if (last && last.group === entry.data.group) {
      last.items.push(entry);
    } else {
      runs.push({ group: entry.data.group, items: [entry] });
    }
  }
  return runs;
}
