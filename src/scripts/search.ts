import { Data, Effect, Option, Schema } from 'effect';
import { resultsLabel } from '../lib/arabic';
import {
  match,
  ranges,
  rowOf,
  searchRowSchema,
  windowOf,
  type Range,
  type SearchRow,
} from '../lib/search';

const KEY = 'search';

export class MissingElement extends Data.TaggedError('MissingElement')<{
  readonly message: string;
}> {}

export class IndexUnavailable extends Data.TaggedError('IndexUnavailable')<{
  readonly message: string;
}> {}

type Kind<T extends Element> = abstract new () => T;

const lookup = <T extends Element>(root: ParentNode, selector: string, kind: Kind<T>) =>
  Option.liftPredicate(root.querySelector(selector), (found): found is T => found instanceof kind);

export const element = <T extends Element>(
  root: ParentNode,
  selector: string,
  kind: Kind<T>
): Effect.Effect<T, MissingElement> =>
  Option.match(lookup(root, selector, kind), {
    onSome: Effect.succeed,
    onNone: () => Effect.fail(new MissingElement({ message: `no ${kind.name} at ${selector}` })),
  });

const part = <T extends Element>(root: ParentNode, name: string, kind: Kind<T>) =>
  element(root, `[data-search-${name}]`, kind);

const textOf = (node: Node): string => (node.textContent ?? '').trim();

export const fillRow = (
  template: HTMLTemplateElement,
  row: SearchRow
): Effect.Effect<HTMLElement, MissingElement> =>
  Effect.gen(function* () {
    const first = template.content.firstElementChild;
    if (!(first instanceof HTMLElement)) {
      return yield* new MissingElement({ message: 'the search template has no row' });
    }
    const item = first.cloneNode(true);
    if (!(item instanceof HTMLElement)) {
      return yield* new MissingElement({ message: 'the search row did not clone' });
    }
    const link = yield* element(item, 'a', HTMLAnchorElement);
    link.href = row.href;
    link.style.setProperty('--tone', row.color);
    (yield* part(item, 'tile', HTMLElement)).dataset['searchTile'] = row.emblem;
    (yield* part(item, 'title', HTMLElement)).textContent = row.title;
    const words = yield* part(item, 'words', HTMLElement);
    words.textContent = row.words;
    if (row.also === undefined) delete words.dataset['also'];
    else words.dataset['also'] = row.also;
    (yield* part(item, 'where', HTMLElement)).textContent =
      row.group === undefined ? row.heading : `${row.heading} · ${row.group}`;
    const ruling = yield* part(item, 'ruling', HTMLElement);
    if (row.ruling === undefined) ruling.remove();
    else ruling.textContent = row.ruling;
    return item;
  });

const decodeRows = Schema.decodeUnknownEffect(Schema.Array(searchRowSchema));

const unavailableAt = (url: string) => (cause: unknown) =>
  new IndexUnavailable({ message: `${url}: ${String(cause)}` });

export const loadRows = (url: string): Effect.Effect<ReadonlyArray<SearchRow>, IndexUnavailable> =>
  Effect.gen(function* () {
    const unavailable = unavailableAt(url);
    const response = yield* Effect.tryPromise({ try: () => fetch(url), catch: unavailable });
    if (!response.ok) return yield* unavailable(response.statusText);
    const body = yield* Effect.tryPromise({
      try: (): Promise<unknown> => response.json(),
      catch: unavailable,
    });
    return yield* Effect.mapError(decodeRows(body), unavailable);
  });

function paint(
  target: HTMLElement,
  text: string,
  found: ReadonlyArray<Range>,
  from = 0,
  to = text.length
): void {
  const parts: (string | Node)[] = [from > 0 ? '… ' : ''];
  let at = from;
  for (const [start, end] of found) {
    const a = Math.max(start, from);
    let b = Math.min(end, to);
    if (a >= b) continue;
    while (b > a && text.charAt(b - 1) === ' ') b -= 1;
    const mark = document.createElement('mark');
    mark.textContent = text.slice(a, b);
    parts.push(text.slice(at, a), mark);
    at = b;
  }
  parts.push(text.slice(at, to), to < text.length ? ' …' : '');
  target.replaceChildren(...parts);
}

const storage = {
  read: (): Option.Option<string> =>
    Option.flatMap(Option.liftThrowable(() => sessionStorage.getItem(KEY))(), Option.fromNullishOr),
  write: (query: string): void => {
    Option.liftThrowable(() => {
      if (query === '') sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, query);
    })();
  },
};

const isBackForward = (): boolean => {
  const [navigation] = performance.getEntriesByType('navigation');
  return navigation instanceof PerformanceNavigationTiming && navigation.type === 'back_forward';
};

type Entry = {
  readonly item: HTMLElement;
  readonly title: HTMLElement;
  readonly words: HTMLElement;
  readonly text: { readonly title: string; readonly words: string };
  readonly row: ReturnType<typeof rowOf>;
};

const entryOf = (item: HTMLElement): Effect.Effect<Entry, MissingElement> =>
  Effect.gen(function* () {
    const title = yield* part(item, 'title', HTMLElement);
    const words = yield* part(item, 'words', HTMLElement);
    const place = yield* part(item, 'place', HTMLElement);
    const text = { title: textOf(title), words: textOf(words) };
    return {
      item,
      title,
      words,
      text,
      row: rowOf({ ...text, also: words.dataset['also'], place: textOf(place) }),
    };
  });

export const mountSearch = (
  root: HTMLElement,
  { restore = false }: { readonly restore?: boolean } = {}
): Effect.Effect<void, MissingElement> =>
  Effect.gen(function* () {
    const input = yield* part(root, 'input', HTMLInputElement);
    const clear = yield* part(root, 'clear', HTMLButtonElement);
    const list = yield* part(root, 'list', HTMLElement);
    const status = yield* part(root, 'status', HTMLElement);
    const empty = yield* part(root, 'empty', HTMLElement);
    const asked = yield* part(root, 'query', HTMLElement);
    const browse = lookup(root, '[data-search-browse]', HTMLElement);

    const items = [...list.querySelectorAll('[data-search-row]')].filter(
      (item): item is HTMLElement => item instanceof HTMLElement
    );
    const entries = yield* Effect.forEach(items, entryOf);
    const rows = entries.map(({ row }) => row);

    const draw = (item: HTMLElement) => {
      const tile = lookup(item, '[data-search-tile]', HTMLElement);
      if (Option.isNone(tile) || tile.value.firstChild !== null) return;
      const name = tile.value.dataset['searchTile'] ?? '';
      const art = lookup(root, `template[data-search-art="${name}"]`, HTMLTemplateElement);
      if (Option.isSome(art)) tile.value.append(art.value.content.cloneNode(true));
    };

    const render = () => {
      const query = input.value;
      clear.hidden = query === '';
      if (restore) storage.write(query);
      const found = match(rows, query);
      const hits = Option.match(found, { onNone: () => [], onSome: ({ hits: all }) => all });
      if (Option.isSome(browse)) browse.value.hidden = Option.isSome(found);
      empty.hidden = Option.isNone(found) || hits.length > 0;
      list.hidden = hits.length === 0;
      status.textContent = hits.length > 0 ? resultsLabel(hits.length) : '';
      if (Option.isNone(found) || hits.length === 0) {
        asked.textContent = query.trim();
        return;
      }
      const shown = new Set(hits);
      for (const [index, { item }] of entries.entries()) item.hidden = !shown.has(index);
      const hitEntries = hits.flatMap((index) => entries.slice(index, index + 1));
      list.append(...hitEntries.map(({ item }) => item));
      for (const { item, title, words, text, row } of hitEntries) {
        draw(item);
        paint(title, text.title, ranges(text.title, row.title, found.value.words));
        const marked = ranges(text.words, row.words, found.value.words);
        const { from, to } = windowOf(text.words, marked);
        paint(words, text.words, marked, from, to);
      }
    };

    if (restore && isBackForward() && input.value === '') {
      input.value = Option.getOrElse(storage.read(), () => '');
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') input.blur();
    });
    for (const word of root.querySelectorAll('[data-search-try]')) {
      word.addEventListener('click', () => {
        input.value = textOf(word);
        render();
      });
    }
    clear.addEventListener('click', () => {
      input.value = '';
      render();
      input.focus();
    });
    render();
  });

export const mountSheet = (sheet: HTMLDialogElement): Effect.Effect<void, MissingElement> =>
  Effect.gen(function* () {
    const root = yield* element(sheet, '[data-search]', HTMLElement);
    const input = yield* part(root, 'input', HTMLInputElement);
    const template = yield* part(root, 'template', HTMLTemplateElement);
    const list = yield* part(root, 'list', HTMLElement);
    const index = sheet.dataset['searchIndex'] ?? '/bahth/';

    const fill = Effect.gen(function* () {
      const rows = yield* loadRows(index);
      list.append(...(yield* Effect.forEach(rows, (row) => fillRow(template, row))));
      yield* mountSearch(root);
    });
    const loading = yield* Effect.cached(fill);
    const run = Effect.runForkWith(yield* Effect.context());

    const open = (fallback: string) => {
      if (!sheet.open) sheet.showModal();
      input.focus();
      run(
        loading.pipe(
          Effect.catch(() =>
            Effect.sync(() => {
              location.href = fallback;
            })
          )
        )
      );
    };

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest('[data-search-open]');
      if (
        trigger instanceof HTMLAnchorElement &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        open(trigger.href);
      }
    });

    document.addEventListener('keydown', (event) => {
      const typing =
        event.target instanceof Element &&
        event.target.closest('input, textarea, [contenteditable]') !== null;
      const slash = event.key === '/' && !typing;
      const command = event.key === 'k' && (event.metaKey || event.ctrlKey);
      if (!slash && !command) return;
      event.preventDefault();
      open('/bahth/');
    });

    sheet.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const { target } = event;
      if (target === sheet || target.closest('[data-search-close]') !== null) sheet.close();
      else if (target.closest('[data-search-row] a') !== null) sheet.close();
    });
  });
