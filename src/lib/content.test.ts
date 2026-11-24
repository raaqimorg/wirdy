import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { OCCASION_IDS } from './occasions';
import { dhikrSchema, type Dhikr } from './schema';
import { parseVariants } from './variants';

const ROOT = join(process.cwd(), 'src/content/adhkar');

const entries = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .toSorted()
  .map((path) => {
    const file = matter(readFileSync(join(ROOT, path), 'utf8'));
    return { path, raw: file.data, body: file.content, data: dhikrSchema.parse(file.data) };
  });

const quran = entries.filter((entry) => entry.data.quran);
const prose = entries.filter((entry) => !entry.data.quran);
const albani = entries.filter((entry) => entry.data.takhrij.grader === 'الألباني');
const outsideMorningAndEvening = entries.filter((entry) => entry.data.occasion !== 'sabah-masaa');
const oneTimeOnly = entries.filter((entry) => entry.data.mode !== 'both');

const byOccasion = (occasion: Dhikr['occasion']) =>
  entries.filter((entry) => entry.data.occasion === occasion);

describe('the adhkar collection', () => {
  it.each(OCCASION_IDS)('has at least one dhikr in %s', (occasion) => {
    expect(byOccasion(occasion).length).toBeGreaterThan(0);
  });

  it.each(OCCASION_IDS)('gives each dhikr in %s its own order', (occasion) => {
    const orders = byOccasion(occasion).map((entry) => entry.data.order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});

describe.each(entries)('$path', ({ path, raw, body, data }) => {
  it('has valid frontmatter', () => {
    expect(dhikrSchema.safeParse(raw).error?.issues).toBeUndefined();
  });

  it('sits in the folder of its occasion', () => {
    expect(dirname(path)).toBe(data.occasion);
  });

  it('starts its file name with its order', () => {
    const order = String(data.order).padStart(2, '0');
    expect(basename(path)).toMatch(new RegExp(`^${order}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`));
  });

  it('has a text', () => {
    expect(body.trim().length).toBeGreaterThan(0);
  });

  it('has well-formed variant markers', () => {
    expect(() => parseVariants(body)).not.toThrow();
  });

  it('keeps its text on lines without stray spaces', () => {
    expect(
      body
        .trim()
        .split('\n')
        .filter((line) => line !== line.trim())
    ).toEqual([]);
  });
});

describe.each(outsideMorningAndEvening)(
  '$path, outside the morning and evening',
  ({ body, data }) => {
    it('uses no morning and evening markers', () => {
      expect(parseVariants(body).some((segment) => segment.type === 'variant')).toBe(false);
    });

    it('belongs to both times', () => {
      expect(data.mode).toBe('both');
    });
  }
);

describe.each(oneTimeOnly)('$path, for one time only', ({ body }) => {
  it('uses no morning and evening markers', () => {
    expect(parseVariants(body).some((segment) => segment.type === 'variant')).toBe(false);
  });
});

describe.each(albani)('$path, graded by al-Albani', ({ data }) => {
  it('carries a ruling of صحيح or حسن', () => {
    expect(data.takhrij.ruling).toMatch(/صحيح|حسن/);
  });

  it('carries no ruling of weakness', () => {
    expect(data.takhrij.ruling).not.toMatch(/ضعيف|موضوع|منكر|لا أصل|شاذ/);
  });
});

describe.each(quran)('$path, as قرآن', ({ body }) => {
  it('spells آ the Uthmanic way', () => {
    expect(body).not.toContain('آ');
  });

  it('opens no سورة with the بسملة', () => {
    expect(body).not.toMatch(/^بِسْمِ ٱللَّهِ/m);
  });
});

describe.each(prose)('$path, as a hadith text', ({ body, data }) => {
  it('keeps to one paragraph', () => {
    expect(body.trim()).not.toMatch(/\n\s*\n/);
  });

  it('shows its whole text', () => {
    expect(data.ayat).toBe('all');
  });
});

it('reads every file under the adhkar folder', () => {
  const files = readdirSync(ROOT, { recursive: true, encoding: 'utf8' }).filter((path) =>
    path.endsWith('.md')
  );
  expect(entries.map((entry) => relative(ROOT, join(ROOT, entry.path)))).toEqual(files.toSorted());
});
