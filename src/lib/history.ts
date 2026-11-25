import { Array, Option, Result, Schema } from 'effect';

export const HISTORY_KEY = 'search-history';
export const HISTORY_VERSION = 1;
export const HISTORY_SIZE = 8;

const MAX_HREF = 160;
const MAX_STORED = 4096;
const HREF = /^\/[a-z0-9-]+\/(?:#[a-z0-9-]+)?$/u;

const hrefSchema = Schema.String.check(
  Schema.isMaxLength(MAX_HREF),
  Schema.isPattern(HREF, { message: 'must be a path on the site' })
);

const historySchema = Schema.Struct({
  version: Schema.Literal(HISTORY_VERSION),
  hrefs: Schema.Array(hrefSchema).check(Schema.isMaxLength(HISTORY_SIZE)),
});

export type History = ReadonlyArray<string>;

const decode = Schema.decodeUnknownResult(Schema.fromJsonString(historySchema), {
  onExcessProperty: 'error',
});

export function parseHistory(stored: string): Option.Option<History> {
  if (stored.length > MAX_STORED) return Option.none();
  return Option.map(Result.getSuccess(decode(stored)), ({ hrefs }) => Array.dedupe(hrefs));
}

export function encodeHistory(history: History): string {
  return JSON.stringify({ version: HISTORY_VERSION, hrefs: history.slice(0, HISTORY_SIZE) });
}

export function isHistoryHref(href: string): boolean {
  return href.length <= MAX_HREF && HREF.test(href);
}

export function remember(history: History, href: string): History {
  if (!isHistoryHref(href)) return history;
  return [href, ...history.filter((other) => other !== href)].slice(0, HISTORY_SIZE);
}

export function known(history: History, hrefs: ReadonlySet<string>): History {
  return history.filter((href) => hrefs.has(href));
}
