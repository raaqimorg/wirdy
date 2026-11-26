import { Array, Data, Effect, Option, Schema } from 'effect';
import { resultsLabel, toArabicDigits } from '../lib/arabic';
import {
  encodeHistory,
  HISTORY_KEY,
  known,
  parseHistory,
  remember,
  type History,
} from '../lib/history';
import {
  fold,
  markedOf,
  match,
  nearestOf,
  ranges,
  rowOf,
  searchRowSchema,
  windowOf,
  type Range,
  type SearchRow,
} from '../lib/search';

const PAGE_KEY = 'search';
const SHEET_KEY = 'search-sheet';

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

const typedOf = (query: string, word: string): string =>
  query.split(/\s+/u).find((typed) => fold(typed).out === word) ?? word;

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
    item.dataset['searchSection'] = row.emblem;
    item.classList.toggle('search-row--quran', row.quran === true);
    (yield* part(item, 'title', HTMLElement)).textContent = row.title;
    const words = yield* part(item, 'words', HTMLElement);
    words.textContent = row.words;
    if (row.also === undefined) delete words.dataset['also'];
    else words.dataset['also'] = row.also;
    if (row.about === undefined) delete words.dataset['about'];
    else words.dataset['about'] = row.about;
    (yield* part(item, 'where', HTMLElement)).textContent =
      row.group === undefined ? row.heading : `${row.heading}، ${row.group}`;
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
  read: (key: string): Option.Option<string> =>
    Option.flatMap(Option.liftThrowable(() => sessionStorage.getItem(key))(), Option.fromNullishOr),
  write: (key: string, query: string): void => {
    Option.liftThrowable(() => {
      if (query === '') sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, query);
    })();
  },
};

const history = {
  read: (): History => {
    const stored = Option.flatMap(
      Option.liftThrowable(() => localStorage.getItem(HISTORY_KEY))(),
      Option.fromNullishOr
    );
    if (Option.isNone(stored)) return [];
    return Option.getOrElse(parseHistory(stored.value), () => {
      history.write([]);
      return [];
    });
  },
  write: (entries: History): void => {
    Option.liftThrowable(() => {
      if (entries.length === 0) localStorage.removeItem(HISTORY_KEY);
      else localStorage.setItem(HISTORY_KEY, encodeHistory(entries));
    })();
  },
};

const isBackForward = (): boolean => {
  const [navigation] = performance.getEntriesByType('navigation');
  return navigation instanceof PerformanceNavigationTiming && navigation.type === 'back_forward';
};

type Entry = {
  readonly item: HTMLElement;
  readonly href: string;
  readonly section: string;
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
    const link = yield* element(item, 'a', HTMLAnchorElement);
    return {
      item,
      href: link.getAttribute('href') ?? '',
      section: item.dataset['searchSection'] ?? '',
      title,
      words,
      text,
      row: rowOf({
        ...text,
        also: words.dataset['also'],
        about: words.dataset['about'],
        place: textOf(place),
      }),
    };
  });

type Head = {
  readonly section: string;
  readonly head: HTMLElement;
  readonly count: HTMLElement;
};

const headOf = (template: Element): Effect.Effect<Head, MissingElement> =>
  Effect.gen(function* () {
    if (!(template instanceof HTMLTemplateElement)) {
      return yield* new MissingElement({ message: 'the head of a section is not a template' });
    }
    const section = template.dataset['searchSectionHead'] ?? '';
    const first = yield* element(template.content, '[data-search-head]', HTMLElement);
    const head = first.cloneNode(true);
    if (!(head instanceof HTMLElement)) {
      return yield* new MissingElement({ message: 'the head of a section did not clone' });
    }
    return { section, head, count: yield* part(head, 'count', HTMLElement) };
  });

export const mountSearch = (
  root: HTMLElement,
  { restore = false }: { readonly restore?: boolean } = {}
): Effect.Effect<void, MissingElement> =>
  Effect.gen(function* () {
    const key = restore ? PAGE_KEY : SHEET_KEY;
    const input = yield* part(root, 'input', HTMLInputElement);
    const clear = yield* part(root, 'clear', HTMLButtonElement);
    const list = yield* part(root, 'list', HTMLElement);
    const status = yield* part(root, 'status', HTMLElement);
    const empty = yield* part(root, 'empty', HTMLElement);
    const asked = yield* part(root, 'query', HTMLElement);
    const note = yield* part(root, 'note', HTMLElement);
    const noteWord = yield* part(root, 'note-word', HTMLElement);
    const browse = [...root.querySelectorAll('[data-search-browse]')].filter(
      (item): item is HTMLElement => item instanceof HTMLElement
    );

    const items = [...list.querySelectorAll('[data-search-row]')].filter(
      (item): item is HTMLElement => item instanceof HTMLElement
    );
    const entries = yield* Effect.forEach(items, entryOf);
    const rows = entries.map(({ row }) => row);
    const byHref = new Map(entries.map((entry) => [entry.href, entry]));
    const hrefs = new Set(byHref.keys());
    const recent = lookup(root, '[data-search-recent]', HTMLElement);
    const recentList = lookup(root, '[data-search-recent-list]', HTMLElement);

    const plainCopy = ({ item, text }: Entry): Option.Option<HTMLElement> =>
      Option.flatMap(
        Option.liftPredicate(item.cloneNode(true), (copy) => copy instanceof HTMLElement),
        (copy) => {
          const title = lookup(copy, '[data-search-title]', HTMLElement);
          const words = lookup(copy, '[data-search-words]', HTMLElement);
          if (Option.isNone(title) || Option.isNone(words)) return Option.none();
          copy.toggleAttribute('hidden', false);
          paint(title.value, text.title, []);
          const { from, to } = windowOf(text.words, []);
          paint(words.value, text.words, [], from, to);
          return Option.some(copy);
        }
      );

    const showRecent = (query: string) => {
      if (Option.isNone(recent) || Option.isNone(recentList)) return;
      const stored = query === '' ? history.read() : [];
      const shown = known(stored, hrefs);
      if (shown.length !== stored.length) history.write(shown);
      const copies = Array.getSomes(
        shown.map((href) => Option.flatMap(Option.fromUndefinedOr(byHref.get(href)), plainCopy))
      );
      recentList.value.replaceChildren(...copies);
      recent.value.hidden = copies.length === 0;
    };

    const heads = yield* Effect.forEach(
      [...root.querySelectorAll('template[data-search-section-head]')],
      headOf
    );

    const render = () => {
      const query = input.value;
      clear.hidden = query === '';
      showRecent(query.trim());
      storage.write(key, query);
      const exact = match(rows, query);
      const none = Option.match(exact, { onNone: () => false, onSome: (m) => m.hits.length === 0 });
      const near = none ? nearestOf(rows, query) : Option.none();
      const found = Option.isSome(near) ? Option.some(near.value.match) : exact;
      const hits = Option.match(found, { onNone: () => [], onSome: ({ hits: all }) => all });
      for (const section of browse) section.hidden = Option.isSome(found);
      empty.hidden = Option.isNone(found) || hits.length > 0;
      note.hidden = Option.isNone(near);
      noteWord.textContent = Option.match(near, {
        onNone: () => '',
        onSome: ({ word }) => typedOf(query, word),
      });
      list.hidden = hits.length === 0;
      status.textContent = hits.length > 0 ? resultsLabel(hits.length) : '';
      if (Option.isNone(found) || hits.length === 0) {
        asked.textContent = query.trim();
        return;
      }
      const marked = markedOf(found.value.words);
      const shown = new Set(hits);
      for (const [index, { item }] of entries.entries()) item.hidden = !shown.has(index);
      const hitEntries = hits.flatMap((index) => entries.slice(index, index + 1));
      for (const { head } of heads) head.remove();
      const firstHit = new Map<string, number>();
      for (const [index, { section }] of hitEntries.entries()) {
        if (!firstHit.has(section)) firstHit.set(section, index);
      }
      const order = (section: string) => firstHit.get(section) ?? hitEntries.length;
      for (const { section, head, count } of heads.toSorted(
        (a, b) => order(a.section) - order(b.section)
      )) {
        const group = hitEntries.filter((entry) => entry.section === section);
        if (group.length === 0) continue;
        count.textContent = toArabicDigits(group.length);
        list.append(head, ...group.map(({ item }) => item));
      }
      for (const { title, words, text, row } of hitEntries) {
        paint(title, text.title, ranges(text.title, row.title, marked));
        const inWords = ranges(text.words, row.words, marked);
        const { from, to } = windowOf(text.words, inWords);
        paint(words, text.words, inWords, from, to);
      }
    };

    if (restore && isBackForward() && input.value === '') {
      input.value = Option.getOrElse(storage.read(key), () => '');
    }
    if (restore) {
      window.addEventListener('pageshow', (event) => {
        if (!event.persisted || input.value !== '') return;
        input.value = Option.getOrElse(storage.read(key), () => '');
        render();
      });
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') input.blur();
    });
    root.addEventListener('keydown', (event) => {
      if (list.hidden !== false || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
      const stops: HTMLElement[] = [input];
      for (const stop of list.querySelectorAll('[data-search-row]:not([hidden]) a')) {
        if (stop instanceof HTMLElement) stops.push(stop);
      }
      const at = stops.findIndex((stop) => stop === document.activeElement);
      const next = stops[at + (event.key === 'ArrowDown' ? 1 : -1)];
      if (at === -1 || next === undefined) return;
      event.preventDefault();
      next.focus();
    });
    for (const word of root.querySelectorAll('[data-search-try]')) {
      word.addEventListener('click', () => {
        input.value = textOf(word);
        render();
      });
    }
    const opened = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('[data-search-row] a');
      const href = link instanceof HTMLAnchorElement ? link.getAttribute('href') : null;
      if (href !== null && hrefs.has(href)) history.write(remember(history.read(), href));
    };
    root.addEventListener('click', opened);
    root.addEventListener('auxclick', opened);
    for (const forget of root.querySelectorAll('[data-search-forget]')) {
      forget.addEventListener('click', () => {
        history.write([]);
        render();
        input.focus();
      });
    }
    window.addEventListener('storage', (event) => {
      if (event.key === HISTORY_KEY || event.key === null) showRecent(input.value.trim());
    });
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

    const preload = () => {
      setTimeout(() => {
        run(Effect.ignore(loading));
      }, 1000);
    };
    if (document.readyState === 'complete') preload();
    else window.addEventListener('load', preload, { once: true });

    const open = (fallback: string) => {
      if (!sheet.open) sheet.showModal();
      if (input.value === '') {
        input.value = Option.getOrElse(storage.read(SHEET_KEY), () => '');
        input.dispatchEvent(new Event('input'));
      }
      input.focus();
      input.select();
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
