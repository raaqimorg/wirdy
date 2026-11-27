import { describe, expect, it } from 'bun:test';
import { Option } from 'effect';
import { groupsOf, headingOf, imageLabel, nameOf, pageOf } from './page.ts';

const image = (path: string) => ({
  path,
  bytes: 2048,
  size: Option.some({ width: 1200, height: 630 }),
});

describe('nameOf', () => {
  it.each([
    ['opengraph/bayt-1b04d840.png', 'bayt'],
    ['og/bayt/ityan-al-ahl-6178b407.png', 'ityan-al-ahl'],
    ['favicon.svg', 'favicon'],
  ])('drops the folder, the fingerprint, and the extension of %s', (path, name) => {
    expect(nameOf(path)).toBe(name);
  });
});

describe('headingOf', () => {
  it('names a section, a guide by its id or its page, and the two forms', () => {
    expect(Option.getOrNull(headingOf('bayt'))).toBe('البيت والأهل');
    expect(Option.getOrNull(headingOf('jumuah'))).toBe('سنن الجمعة');
    expect(Option.getOrNull(headingOf('al-tibb-al-nabawi'))).toBe('الطب النبوي');
    expect(Option.getOrNull(headingOf('masaa'))).toBe('المساء');
  });

  it('names nothing it does not know', () => {
    expect(Option.isNone(headingOf('ityan-al-ahl'))).toBe(true);
  });
});

describe('imageLabel', () => {
  it('labels a poster with its format and paper', () => {
    expect(imageLabel('posters/bayt/story-dark-577f39b2.png')).toBe('حالة · داكن');
  });

  it('labels a section card with its heading and a dhikr card with its slug', () => {
    expect(imageLabel('opengraph/home-c7956c83.png')).toBe('الرئيسية');
    expect(imageLabel('og/bayt/ityan-al-ahl-6178b407.png')).toBe('ityan-al-ahl');
  });
});

describe('groupsOf', () => {
  const groups = groupsOf([
    image('favicon.svg'),
    image('posters/bayt/story-dark-577f39b2.png'),
    image('og/nawm/b-1.png'),
    image('og/bayt/a-1.png'),
    image('opengraph/home-c7956c83.png'),
  ]);

  it('orders the section cards, the dhikr cards, the posters, then the icons', () => {
    expect(groups.map((group) => group.id)).toEqual(['opengraph', 'og', 'posters', 'icons']);
  });

  it('orders the shelves and the section cards as the site does', () => {
    const shelves = groupsOf([image('posters/al-jumuah/a-1.png'), image('posters/sabah/a-1.png')]);
    expect(shelves[0]?.shelves.map((shelf) => shelf.id)).toEqual([
      'posters-sabah',
      'posters-al-jumuah',
    ]);
    const cards = groupsOf([
      image('opengraph/bayt-1b04d840.png'),
      image('opengraph/home-c7956c83.png'),
    ]);
    expect(cards[0]?.shelves[0]?.images.map((card) => nameOf(card.path))).toEqual(['home', 'bayt']);
  });

  it('puts each folder on its own shelf, named for its section', () => {
    expect(groups[1]?.shelves.map((shelf) => [shelf.id, shelf.title])).toEqual([
      ['og-nawm', 'عند النوم'],
      ['og-bayt', 'البيت والأهل'],
    ]);
  });
});

describe('pageOf', () => {
  it('links every image to its full size', () => {
    const html = pageOf(groupsOf([image('og/bayt/a-1.png'), image('favicon.svg')]));
    expect(html).toContain('href="/images/og/bayt/a-1.png"');
    expect(html).toContain('src="/images/favicon.svg"');
  });

  it('gives every image its size, so a lazy image waits until it is near the screen', () => {
    expect(pageOf(groupsOf([image('og/bayt/a-1.png')]))).toContain('width="1200" height="630"');
  });
});
