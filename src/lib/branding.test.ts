import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EMBLEMS } from './emblems';
import { markSvg, PETALS } from './mark';
import { OCCASIONS } from './occasions';
import { PALETTE } from './palette';
import { SITE, TIBB } from './site';
import { hueAt } from './tone';

const doc = (name: string) =>
  readFileSync(join(process.cwd(), 'docs/branding', `${name}.md`), 'utf8');

const rows = (text: string): Map<string, ReadonlyArray<string>> =>
  new Map(
    text
      .split('\n')
      .filter((line) => line.startsWith('| `'))
      .map((line) => {
        const cells = line
          .slice(1, -1)
          .split(' | ')
          .map((cell) => cell.trim().replaceAll(/^`|`$/gu, ''));
        return [cells[0]!, cells.slice(1)];
      })
  );

describe('the identity doc', () => {
  const words = rows(doc('identity'));

  it.each([
    ['name', SITE.name],
    ['url', SITE.url],
    ['domain', SITE.domain],
    ['tagline', SITE.tagline],
    ['promise', `${SITE.promise.before} ﷺ${SITE.promise.after}`],
    ['title', SITE.title],
    ['description', SITE.description],
  ])('says the %s that src/lib/site.ts holds', (key, value) => {
    expect(words.get(key)?.[0]).toBe(value);
  });

  it('names the domain of the URL', () => {
    expect(new URL(SITE.url).host).toBe(SITE.domain);
  });
});

describe('the color doc', () => {
  const colors = rows(doc('color'));

  it.each(Object.entries(PALETTE))('says the %s that src/lib/palette.ts holds', (key, value) => {
    expect(colors.get(key)?.[0]).toBe(value);
  });

  it.each(OCCASIONS.map((section, index) => [section.id, section, index] as const))(
    'says the heading, color, and hue of %s that the rule gives',
    (id, { heading, color }, index) => {
      expect(colors.get(id)).toEqual([
        heading,
        color,
        `${String(Math.round(hueAt(index, OCCASIONS.length)))}°`,
      ]);
    }
  );

  it('says the heading and color of tibb that src/lib/site.ts holds', () => {
    expect(colors.get('tibb')?.slice(0, 2)).toEqual([TIBB.heading, TIBB.color]);
  });

  it('lists every section, and no other', () => {
    const sections = [...colors.keys()].filter((key) => !(key in PALETTE));
    expect(sections).toEqual([...OCCASIONS.map(({ id }) => id), 'tibb']);
  });
});

describe('the logo doc', () => {
  const text = doc('logo');

  it('draws the petals and the disc that src/lib/mark.ts draws', () => {
    const [top] = PETALS;
    expect(PETALS).toHaveLength(12);
    expect(top).toEqual({ cx: '32.00', cy: (32 - 21.5).toFixed(2) });
    expect(markSvg().match(/r="6\.4"/gu)).toHaveLength(12);
    expect(markSvg()).toContain('<circle cx="32" cy="32" r="12.5"');
    expect(text).toContain(
      '`12` circles of radius `6.4`, on a ring of radius `21.5`, the first one at the top'
    );
    expect(text).toContain('`1` circle of radius `12.5` in the centre');
  });
});

describe('the imagery doc', () => {
  it('describes the emblem of every section, and no other', () => {
    expect([...rows(doc('imagery')).keys()]).toEqual(Object.keys(EMBLEMS));
  });
});
