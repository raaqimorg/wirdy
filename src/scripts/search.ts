import { resultsLabel } from '../lib/arabic';
import type { SearchRow } from '../lib/collection';
import { match, ranges, rowOf, windowOf, type Range } from '../lib/search';

const KEY = 'search';

const find = <T extends HTMLElement>(name: string, root: ParentNode) =>
  root.querySelector<T>(`[data-search-${name}]`);

export function fillRow(template: HTMLTemplateElement, row: SearchRow): HTMLElement {
  const item = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  const link = item.querySelector('a')!;
  link.href = row.href;
  link.style.setProperty('--tone', row.color);
  find('tile', item)!.dataset.searchTile = row.emblem;
  find('title', item)!.textContent = row.title;
  const words = find('words', item)!;
  words.textContent = row.words;
  if (row.also) words.dataset.also = row.also;
  else delete words.dataset.also;
  find('where', item)!.textContent = row.group ? `${row.heading} · ${row.group}` : row.heading;
  const ruling = find('ruling', item)!;
  if (row.ruling) ruling.textContent = row.ruling;
  else ruling.remove();
  return item;
}

function paint(element: HTMLElement, text: string, found: Range[], from = 0, to = text.length) {
  const parts: (string | Node)[] = [from > 0 ? '… ' : ''];
  let at = from;
  for (const [start, end] of found) {
    const a = Math.max(start, from);
    let b = Math.min(end, to);
    if (a >= b) continue;
    while (b > a && text[b - 1] === ' ') b--;
    const mark = document.createElement('mark');
    mark.textContent = text.slice(a, b);
    parts.push(text.slice(at, a), mark);
    at = b;
  }
  parts.push(text.slice(at, to), to < text.length ? ' …' : '');
  element.replaceChildren(...parts);
}

export function mountSearch(root: HTMLElement, { restore = false } = {}): void {
  const input = find<HTMLInputElement>('input', root)!;
  const clear = find<HTMLButtonElement>('clear', root)!;
  const list = find('list', root)!;
  const status = find('status', root)!;
  const empty = find('empty', root)!;
  const asked = find('query', root)!;
  const browse = find('browse', root);

  const entries = [...list.querySelectorAll<HTMLElement>('[data-search-row]')].map((item) => {
    const title = find('title', item)!;
    const words = find('words', item)!;
    const text = { title: title.textContent!.trim(), words: words.textContent!.trim() };
    const place = find('place', item)!.textContent!.trim();
    return { item, title, words, text, row: rowOf({ ...text, also: words.dataset.also, place }) };
  });
  const rows = entries.map(({ row }) => row);

  const draw = (item: HTMLElement) => {
    const tile = find('tile', item);
    if (!tile || tile.firstChild) return;
    const art = root.querySelector<HTMLTemplateElement>(
      `template[data-search-art="${tile.dataset.searchTile}"]`
    );
    if (art) tile.append(art.content.cloneNode(true));
  };

  const save = (query: string) => {
    if (!restore) return;
    try {
      if (query) sessionStorage.setItem(KEY, query);
      else sessionStorage.removeItem(KEY);
    } catch {}
  };

  const render = () => {
    const query = input.value;
    clear.hidden = !query;
    save(query);
    const found = match(rows, query);
    if (browse) browse.hidden = Boolean(found);
    empty.hidden = !found || found.hits.length > 0;
    list.hidden = !found?.hits.length;
    status.textContent = found?.hits.length ? resultsLabel(found.hits.length) : '';
    if (!found?.hits.length) {
      asked.textContent = query.trim();
      return;
    }
    const shown = new Set(found.hits);
    entries.forEach(({ item }, index) => {
      item.hidden = !shown.has(index);
    });
    list.append(...found.hits.map((index) => entries[index]!.item));
    for (const index of found.hits) {
      const { item, title, words, text, row } = entries[index]!;
      draw(item);
      paint(title, text.title, ranges(text.title, row.title, found.words));
      const marked = ranges(text.words, row.words, found.words);
      const { from, to } = windowOf(text.words, marked);
      paint(words, text.words, marked, from, to);
    }
  };

  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (restore && navigation?.type === 'back_forward' && !input.value) {
    try {
      input.value = sessionStorage.getItem(KEY) ?? '';
    } catch {}
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') input.blur();
  });
  for (const word of root.querySelectorAll<HTMLButtonElement>('[data-search-try]')) {
    word.addEventListener('click', () => {
      input.value = word.textContent!.trim();
      render();
    });
  }
  clear.addEventListener('click', () => {
    input.value = '';
    render();
    input.focus();
  });
  render();
}
