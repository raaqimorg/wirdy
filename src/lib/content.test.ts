import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { Effect, Exit, Schema } from 'effect';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { cardFile, cardOf as cardEffect } from './card';
import { GROUP_SLUGS } from './groups';
import { OCCASION_IDS } from './occasions';
import { dhikrPath, hadithPath, slugOf } from './permalink';
import permalinks from './permalinks.json';
import { dhikrSchema, STRICT, tibbSchema, unprovenSchema, type Dhikr } from './schema';
import { phrasesOf as phrasesEffect } from './phrases';
import { fullTitle } from './title';
import { parseVariants as variantsEffect } from './variants';

const cardOf = (data: Dhikr, body: string) => Effect.runSync(cardEffect(data, body));
const phrasesOf = (text: string, counts: ReadonlyArray<number>) =>
  Effect.runSync(phrasesEffect(text, counts));
const parseVariants = (text: string) => Effect.runSync(variantsEffect(text));
const issuesOf = (schema: Schema.Decoder<unknown>, raw: unknown) => {
  const exit = Effect.runSyncExit(Schema.decodeUnknownEffect(schema, STRICT)(raw));
  return Exit.isSuccess(exit) ? undefined : String(exit.cause);
};

const ROOT = join(process.cwd(), 'src/content/adhkar');

const entries = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .toSorted()
  .map((path) => {
    const file = matter(readFileSync(join(ROOT, path), 'utf8'));
    return {
      path,
      raw: file.data,
      body: file.content,
      data: Schema.decodeUnknownSync(dhikrSchema, STRICT)(file.data),
    };
  });

const TIBB = join(process.cwd(), 'src/content/tibb');

const tibb = readdirSync(TIBB, { encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .toSorted()
  .map((path) => {
    const file = matter(readFileSync(join(TIBB, path), 'utf8'));
    return {
      path,
      raw: file.data,
      body: file.content,
      data: Schema.decodeUnknownSync(tibbSchema, STRICT)(file.data),
    };
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

describe('the group links', () => {
  const groups = new Set([
    ...entries.flatMap(({ data }) => data.group ?? []),
    ...tibb.map(({ data }) => data.group),
  ]);

  it.each([...groups])('give %s a slug', (group) => {
    expect(Object.hasOwn(GROUP_SLUGS, group)).toBe(true);
  });

  it('are lowercase Latin words joined by hyphens', () => {
    for (const slug of Object.values(GROUP_SLUGS)) expect(slug).toMatch(/^[a-z][a-z0-9-]*$/u);
  });

  it('name no group that the content does not have', () => {
    expect(Object.keys(GROUP_SLUGS).filter((group) => !groups.has(group))).toEqual([]);
  });

  it.each(OCCASION_IDS)('are unique in %s, and never the slug of one of its adhkar', (occasion) => {
    const onPage = byOccasion(occasion);
    const slugs = [...new Set(onPage.flatMap(({ data }) => data.group ?? []))].map(
      (group) => GROUP_SLUGS[group]
    );
    expect(new Set(slugs).size).toBe(slugs.length);
    const adhkar = new Set(onPage.map(({ path }) => slugOf(path.replace(/\.md$/u, ''))));
    expect(slugs.filter((slug) => adhkar.has(slug!))).toEqual([]);
  });
});

describe.each(entries)('$path', ({ path, raw, body, data }) => {
  it('has valid frontmatter', () => {
    expect(issuesOf(dhikrSchema, raw)).toBeUndefined();
  });

  it('sits in the folder of its occasion', () => {
    expect(dirname(path)).toBe(data.occasion);
  });

  it('sits under a group', () => {
    expect(data.group).toBeTruthy();
  });

  it('starts its file name with its order', () => {
    const order = String(data.order).padStart(2, '0');
    expect(basename(path)).toMatch(new RegExp(`^${order}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`, 'u'));
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
    expect(data.takhrij.ruling).toMatch(/صحيح|حسن/u);
  });

  it('carries no ruling of weakness', () => {
    expect(data.takhrij.ruling).not.toMatch(/ضعيف|موضوع|منكر|لا أصل|شاذ/u);
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
    expect(forms.filter(({ data }) => data.group === undefined || data.group === '')).toEqual([]);
  });
});

describe.each(quran)('$path, as قرآن', ({ body }) => {
  it('spells آ the Uthmanic way', () => {
    expect(body).not.toContain('آ');
  });

  it('opens no سورة with the بسملة', () => {
    expect(body).not.toMatch(/^بِسْمِ ٱللَّهِ/mu);
  });
});

describe.each(prose)('$path, as a hadith text', ({ body, data }) => {
  it('keeps to one paragraph', () => {
    expect(body.trim()).not.toMatch(/\n\s*\n/u);
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
  const data = Schema.decodeUnknownSync(unprovenSchema, STRICT)(raw);

  it('has valid frontmatter', () => {
    expect(issuesOf(unprovenSchema, raw)).toBeUndefined();
  });

  it('starts its file name with its order', () => {
    const order = String(data.order).padStart(2, '0');
    expect(path).toMatch(new RegExp(`^${order}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`, 'u'));
  });

  it('carries a ruling of weakness', () => {
    expect(data.takhrij.ruling).toMatch(/ضعيف|موضوع|منكر|لا أصل|شاذ|باطل|دون/u);
  });

  it('has a text on one line', () => {
    expect(body.trim().length).toBeGreaterThan(0);
    expect(body.trim()).not.toContain('\n');
  });
});

it('lists at least one hadith of الطب النبوي', () => {
  expect(tibb.length).toBeGreaterThan(0);
});

it('gives each hadith of الطب النبوي its own order', () => {
  const orders = tibb.map(({ data }) => data.order);
  expect(new Set(orders).size).toBe(orders.length);
});

it('gives the groups of الطب النبوي slugs that no hadith there has', () => {
  const slugs = [...new Set(tibb.map(({ data }) => GROUP_SLUGS[data.group]))];
  const hadith = new Set(tibb.map(({ path }) => slugOf(path.replace(/\.md$/u, ''))));
  expect(slugs.filter((slug) => hadith.has(slug!))).toEqual([]);
});

const siteOf = (link: string) => new URL(link).hostname;

describe.each(tibb)('tibb/$path', ({ path, raw, body, data }) => {
  it('has valid frontmatter', () => {
    expect(issuesOf(tibbSchema, raw)).toBeUndefined();
  });

  it('starts its file name with its order', () => {
    const order = String(data.order).padStart(2, '0');
    expect(path).toMatch(new RegExp(`^${order}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`, 'u'));
  });

  it('rests on dorar.net, or on two other sites that agree', () => {
    const { url, also } = data.takhrij;
    if (siteOf(url) === 'dorar.net') return;
    expect(also).toBeDefined();
    expect(siteOf(also!)).not.toBe(siteOf(url));
  });

  it('carries a ruling of صحيح or حسن, and none of weakness', () => {
    expect(data.takhrij.ruling).toMatch(/صحيح|حسن/u);
    expect(data.takhrij.ruling).not.toMatch(/ضعيف|موضوع|منكر|لا أصل|شاذ/u);
  });

  it('has a text on one line', () => {
    expect(body.trim().length).toBeGreaterThan(0);
    expect(body.trim()).not.toContain('\n');
  });
});

const pathOf = ({ path, data }: (typeof entries)[number]) =>
  dhikrPath(data.occasion, slugOf(path.replace(/\.md$/u, '')));

describe('the permalinks', () => {
  const current = [
    ...entries.map((entry) => pathOf(entry)),
    ...tibb.map(({ path }) => hadithPath(slugOf(path.replace(/\.md$/u, '')))),
  ];

  it('gives each dhikr and each hadith of الطب النبوي its own link', () => {
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

  it('gives each dhikr its own title, with its context', () => {
    const titles = entries.map((entry) => fullTitle(entry.data));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives each hadith of الطب النبوي its own title', () => {
    const titles = tibb.map(({ data }) => data.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('the sharing cards', () => {
  const og = join(process.cwd(), 'public/og');
  const drawn = readdirSync(og, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.png'))
    .map((path) => `og/${path}`);
  const wanted = entries.map(({ path, body, data }) =>
    cardFile(cardOf(data, body), data.occasion, slugOf(path.replace(/\.md$/u, '')))
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
    expect(last.filter((word) => /^(لَا|لَآ|إِلَّا|إِلَهَ|إِلَـٰهَ|لَمْ|لَنْ|مَا)$/u.test(word))).toEqual([]);
  });
});
