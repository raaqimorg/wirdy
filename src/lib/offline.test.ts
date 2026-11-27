import { describe, expect, it } from 'vitest';
import { Option } from 'effect';
import { manifestOf, pathOf, prefetchOf, serviceWorkerOf, type Built } from './offline';

const bytes = (text: string) => new TextEncoder().encode(text);
const card = (href: string) => `<a class="occasion-card occasion-card--featured" href="${href}">`;
const built = (nawm: string, index = '[]'): Built => ({
  pages: [
    [
      'index.html',
      bytes(`${card('/sabah-masaa/')}${card('/nawm/')}<a class="bar__brand" href="/">`),
    ],
    ['nawm/index.html', bytes(nawm)],
    ['nawm/ayat-al-kursi/index.html', bytes('ayat')],
    ['sabah-masaa/index.html', bytes('sabah')],
    ['bila-ittisal/index.html', bytes('offline')],
    ['search/index.json', bytes(index)],
  ],
  files: ['_astro/site.abcdefgh.css'],
});

describe('pathOf', () => {
  it.each([
    ['index.html', '/'],
    ['nawm/index.html', '/nawm/'],
    ['nawm/ayat-al-kursi/index.html', '/nawm/ayat-al-kursi/'],
    ['search/index.json', '/search/index.json'],
  ])('serves %s at %s', (file, path) => {
    expect(Option.getOrNull(pathOf(file))).toBe(path);
  });

  it('gives no path to a page no link opens', () => {
    expect(Option.isNone(pathOf('404.html'))).toBe(true);
  });
});

describe('prefetchOf', () => {
  it('takes each card the home page opens with, once, in its order', () => {
    const home = `${card('/sabah-masaa/')}<a class="bar__brand" href="/">${card('/nawm/')}${card('/nawm/')}`;
    expect(prefetchOf(home)).toEqual(['/sabah-masaa/', '/nawm/']);
  });
});

describe('manifestOf', () => {
  it('fingerprints every page by its bytes', () => {
    const before = manifestOf(built('nawm'));
    const after = manifestOf(built('nawm, changed'));
    expect(Object.keys(before.pages)).toEqual([
      '/',
      '/bila-ittisal/',
      '/nawm/',
      '/nawm/ayat-al-kursi/',
      '/sabah-masaa/',
      '/search/index.json',
    ]);
    expect(after.pages['/nawm/']).not.toBe(before.pages['/nawm/']);
    expect({ ...after.pages, '/nawm/': '' }).toEqual({ ...before.pages, '/nawm/': '' });
  });

  it('fingerprints the search index, so a changed index changes no page', () => {
    const before = manifestOf(built('nawm'));
    const after = manifestOf(built('nawm', '[{}]'));
    expect(after.pages['/search/index.json']).not.toBe(before.pages['/search/index.json']);
    expect({ ...after.pages, '/search/index.json': '' }).toEqual({
      ...before.pages,
      '/search/index.json': '',
    });
  });

  it('prefetches the home page, its cards, the offline page, the index, and every bundle file', () => {
    expect(manifestOf(built('nawm')).prefetch).toEqual([
      '/',
      '/sabah-masaa/',
      '/nawm/',
      '/bila-ittisal/',
      '/search/index.json',
      '/_astro/site.abcdefgh.css',
    ]);
  });
});

describe('serviceWorkerOf', () => {
  it('names the fingerprints file by its content, so a changed page renames it', () => {
    const before = serviceWorkerOf(manifestOf(built('nawm')), '');
    const after = serviceWorkerOf(manifestOf(built('nawm, changed')), '');
    const same = serviceWorkerOf(manifestOf(built('nawm')), '');
    expect(before.file).toMatch(/^offline\/[0-9a-f]{16}\.json$/u);
    expect(after.file).not.toBe(before.file);
    expect(same.file).toBe(before.file);
    expect(JSON.parse(before.hashes)).toEqual(manifestOf(built('nawm')).pages);
  });

  it('puts the files and the fingerprints file in the worker, before its code', () => {
    const manifest = manifestOf(built('nawm'));
    const { file, worker } = serviceWorkerOf(manifest, 'const MANIFEST = self.MANIFEST;\n');
    const [first, second] = worker.split('\n');
    expect(JSON.parse(first!.replaceAll(/^self\.MANIFEST = |;$/gu, ''))).toEqual({
      hashes: `/${file}`,
      files: manifest.files,
      index: '/search/index.json',
      offline: '/bila-ittisal/',
      prefetch: manifest.prefetch,
    });
    expect(second).toBe('const MANIFEST = self.MANIFEST;');
  });
});
