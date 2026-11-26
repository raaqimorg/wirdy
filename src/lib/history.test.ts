import { Option } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  encodeHistory,
  HISTORY_SIZE,
  HISTORY_VERSION,
  known,
  parseHistory,
  remember,
} from './history';

const stored = (value: unknown) => JSON.stringify(value);
const parsed = (text: string) => Option.getOrNull(parseHistory(text));
const many = (count: number) =>
  Array.from({ length: count }, (_, index) => `/hamm/#dhikr-${String(index)}`);

describe('parseHistory', () => {
  it('reads what encodeHistory wrote', () => {
    const history = ['/nawm/#ayat-al-kursi', '/al-tibb-al-nabawi/#al-ayn-haqq'];
    expect(parsed(encodeHistory(history))).toEqual(history);
  });

  it('refuses a history of another version, so a new shape never reads an old one', () => {
    expect(parsed(stored({ version: HISTORY_VERSION + 1, hrefs: ['/nawm/'] }))).toBeNull();
    expect(parsed(stored({ hrefs: ['/nawm/'] }))).toBeNull();
  });

  it('refuses text that is not JSON', () => {
    expect(parsed('{"version":1,')).toBeNull();
    expect(parsed('')).toBeNull();
  });

  it('refuses a history with a field it does not know', () => {
    expect(parsed(stored({ version: HISTORY_VERSION, hrefs: [], extra: 1 }))).toBeNull();
  });

  it('refuses a link that is not a path on the site', () => {
    for (const href of ['https://evil.test/', 'javascript:alert(1)', '//evil.test/', '/a b/', 7]) {
      expect(parsed(stored({ version: HISTORY_VERSION, hrefs: [href] }))).toBeNull();
    }
  });

  it('refuses more links than it keeps', () => {
    const hrefs = many(HISTORY_SIZE + 1);
    expect(parsed(stored({ version: HISTORY_VERSION, hrefs }))).toBeNull();
  });

  it('refuses a stored text too long to be a history, before it parses it', () => {
    expect(parsed(`${encodeHistory([])}${' '.repeat(5000)}`)).toBeNull();
  });

  it('keeps one copy of a link that was stored twice', () => {
    const twice = stored({ version: HISTORY_VERSION, hrefs: ['/nawm/', '/nawm/'] });
    expect(parsed(twice)).toEqual(['/nawm/']);
  });
});

describe('remember', () => {
  it('puts the newest link first', () => {
    expect(remember(['/nawm/#a'], '/salah/#b')).toEqual(['/salah/#b', '/nawm/#a']);
  });

  it('moves a link that is there already to the front, once', () => {
    expect(remember(['/nawm/#a', '/salah/#b'], '/salah/#b')).toEqual(['/salah/#b', '/nawm/#a']);
  });

  it('keeps only the newest links', () => {
    const history = remember(many(HISTORY_SIZE), '/nawm/#new');
    expect(history).toHaveLength(HISTORY_SIZE);
    expect(history[0]).toBe('/nawm/#new');
    expect(history).not.toContain(`/hamm/#dhikr-${String(HISTORY_SIZE - 1)}`);
  });

  it('ignores a link that is not a path on the site', () => {
    expect(remember(['/nawm/#a'], 'https://evil.test/')).toEqual(['/nawm/#a']);
  });
});

describe('known', () => {
  it('drops a link that no row of the index has, as a dhikr that was removed', () => {
    expect(known(['/nawm/#gone', '/nawm/#here'], new Set(['/nawm/#here']))).toEqual([
      '/nawm/#here',
    ]);
  });
});

describe('encodeHistory', () => {
  it('writes the version with the links', () => {
    expect(JSON.parse(encodeHistory(['/nawm/']))).toEqual({
      version: HISTORY_VERSION,
      hrefs: ['/nawm/'],
    });
  });
});
