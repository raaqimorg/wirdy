import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { cardFile, cardOf } from './card';
import { OCCASION_IDS } from './occasions';
import { dhikrPath, slugOf } from './permalink';
import permalinks from './permalinks.json';
import { dhikrSchema, unprovenSchema, type Dhikr } from './schema';
import { phrasesOf } from './phrases';
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

  it('sits under a group', () => {
    expect(data.group).toBeTruthy();
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

describe.each(entries.filter((entry) => entry.data.counts))(
  '$path, with a count for each phrase',
  ({ body, data }) => {
    it('has one count for each phrase, and no count of the whole', () => {
      expect(phrasesOf(body.trim(), data.counts!)).toHaveLength(data.counts!.length);
      expect(data.count).toBe(1);
    });
  }
);

describe('the alternative forms', () => {
  const forms = entries.filter((entry) => entry.data.form);

  it('are numbered from one, in the order of the page', () => {
    const numbers = forms
      .toSorted((a, b) => a.data.order - b.data.order)
      .map(({ data }) => data.form!);
    expect([...new Set(numbers)]).toEqual([1, 2, 3, 4]);
    expect(numbers).toEqual(numbers.toSorted((a, b) => a - b));
  });

  it('sit under a group heading', () => {
    expect(forms.filter(({ data }) => !data.group)).toEqual([]);
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

const UNPROVEN = join(process.cwd(), 'src/content/unproven');

const unproven = readdirSync(UNPROVEN, { encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .toSorted()
  .map((path) => {
    const file = matter(readFileSync(join(UNPROVEN, path), 'utf8'));
    return { path, raw: file.data, body: file.content };
  });

it('lists at least one dhikr that did not come in', () => {
  expect(unproven.length).toBeGreaterThan(0);
});

describe.each(unproven)('unproven/$path', ({ path, raw, body }) => {
  const data = unprovenSchema.parse(raw);

  it('has valid frontmatter', () => {
    expect(unprovenSchema.safeParse(raw).error?.issues).toBeUndefined();
  });

  it('starts its file name with its order', () => {
    const order = String(data.order).padStart(2, '0');
    expect(path).toMatch(new RegExp(`^${order}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`));
  });

  it('carries a ruling of weakness', () => {
    expect(data.takhrij.ruling).toMatch(/ضعيف|موضوع|منكر|لا أصل|شاذ|باطل|دون/);
  });

  it('has a text on one line', () => {
    expect(body.trim().length).toBeGreaterThan(0);
    expect(body.trim()).not.toContain('\n');
  });
});

const pathOf = ({ path, data }: (typeof entries)[number]) =>
  dhikrPath(data.occasion, slugOf(path.replace(/\.md$/, '')));

describe('the permalinks', () => {
  const current = entries.map(pathOf);

  it('gives each dhikr its own link', () => {
    expect(new Set(current).size).toBe(current.length);
  });

  it('lists every link in permalinks.json', () => {
    expect(current.filter((path) => !permalinks.includes(path))).toEqual([]);
  });

  it('redirects every link that was ever published and is gone', () => {
    const file = join(process.cwd(), 'public/_redirects');
    const redirects = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const gone = permalinks.filter((path) => !current.includes(path));
    expect(gone.filter((path) => !redirects.includes(`${path} `))).toEqual([]);
  });

  it('gives each dhikr its own title', () => {
    const titles = entries.map((entry) => entry.data.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('the sharing cards', () => {
  const og = join(process.cwd(), 'public/og');
  const drawn = readdirSync(og, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.png'))
    .map((path) => `og/${path}`);
  const wanted = entries.map(({ path, body, data }) =>
    cardFile(cardOf(data, body), data.occasion, slugOf(path.replace(/\.md$/, '')))
  );

  it('is drawn for each dhikr as it is now (run bun run opengraph:adhkar)', () => {
    expect(wanted.filter((file) => !drawn.includes(file))).toEqual([]);
  });

  it('keeps no card of an older text', () => {
    expect(drawn.filter((file) => !wanted.includes(file))).toEqual([]);
  });

  it('ends no text on a negation', () => {
    const last = entries
      .map(({ body, data }) => cardOf(data, body))
      .filter((card) => card.cut)
      .flatMap((card) => card.blocks.map((block) => block.at(-1)!.split(' ').at(-1)!));
    expect(last.filter((word) => /^(لَا|لَآ|إِلَّا|إِلَهَ|إِلَـٰهَ|لَمْ|لَنْ|مَا)$/.test(word))).toEqual([]);
  });
});
