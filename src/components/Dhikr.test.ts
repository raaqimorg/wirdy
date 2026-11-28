import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Dhikr from './Dhikr.astro';
import { ayatLabel, toArabicDigits } from '../lib/arabic';
import type { Dhikr as DhikrData } from '../lib/schema';

type Extra = { heading?: 'h2' | 'h3' | 'h4'; single?: boolean };

const base: DhikrData = {
  title: 'سيد الاستغفار',
  headline: 'سيد الاستغفار',
  occasion: 'sabah-masaa',
  order: 1,
  count: 1,
  mode: 'both',
  quran: false,
  ayat: 'all',
  takhrij: {
    grader: 'البخاري',
    source: 'صحيح البخاري ١',
    ruling: 'أخرجه البخاري',
    url: 'https://dorar.net/hadith/sharh/1',
  },
};

async function render(data: DhikrData, body: string, extra: Extra = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(Dhikr, {
    props: { data, body, slug: 'sayyid-al-istighfar', ...extra },
  });
}

const textOf = (html: string) =>
  html
    .replaceAll(/<[^>]+>/gu, '')
    .replaceAll(/\s+/gu, ' ')
    .trim();
const leadOf = (html: string) => textOf(html.match(/<p class="entry__lead">([\s\S]*?)<\/p>/u)![1]!);

describe('Dhikr', () => {
  it('renders each form whole, and never the other form beside it', async () => {
    const html = await render(base, '{{أَصْبَحْنَا|أَمْسَيْنَا}} بِكَ');
    expect(html).toContain(
      '<span class="variant-text variant-text--sabah">أَصْبَحْنَا</span><span class="variant-text variant-text--masaa">أَمْسَيْنَا</span> بِكَ'
    );
  });

  it('suppresses the badge when the count is one', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('class="bead-ring"');
    expect(html).not.toContain('entry__count');
  });

  it('reads the count in full to a screen reader and in a selection', async () => {
    const few = await render({ ...base, count: 3, when: 'في اليوم' }, 'سبحان الله');
    expect(leadOf(few)).toBe('٣ مرات، في اليوم');
    const many = await render({ ...base, count: 100 }, 'سبحان الله');
    expect(leadOf(many)).toBe('١٠٠ مرة');
  });

  it.each([3, 10, 100])('shows a count of %i once, as the number in the ring', async (count) => {
    const html = await render({ ...base, count }, 'سبحان الله');
    const seen = html
      .replaceAll(/<span class="visually-hidden">[\s\S]*?<\/span>/gu, '')
      .replace(/<a class="takhrij"[\s\S]*/u, '');
    expect(textOf(seen).match(/[٠-٩]+/gu)).toEqual([toArabicDigits(count)]);
  });

  it('says the dual without a hidden number, because the word holds it', async () => {
    expect(leadOf(await render({ ...base, count: 2 }, 'سبحان الله'))).toBe('مرتان');
  });

  it('puts no درجة marker on the card', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('dhikr--daif');
    expect(html).not.toContain('dhikr__daif');
  });

  it('flags Quran cards for the Uthmanic face', async () => {
    const html = await render({ ...base, quran: true }, 'سبحان الله');
    expect(html).toContain('entry--quran');
  });

  it('shows only the first آية of each سورة when asked', async () => {
    const html = await render(
      { ...base, quran: true, ayat: 'first' },
      'قُلْ هُوَ\nٱللَّهُ ٱلصَّمَدُ\n\nقُلْ أَعُوذُ\nمِن شَرِّ'
    );
    expect(html).toContain(
      '<div class="surah">قُلْ هُوَ<span class="surah__ayah-end" data-ayah="۝١"></span></div>'
    );
    expect(html).toContain(
      '<div class="surah">قُلْ أَعُوذُ<span class="surah__ayah-end" data-ayah="۝١"></span></div>'
    );
    expect(html).not.toContain('ٱلصَّمَدُ');
    expect(html).not.toContain('مِن شَرِّ');
  });

  it('wraps each سورة of a قرآن card in its own element', async () => {
    const html = await render({ ...base, quran: true }, 'قُلْ هُوَ\n\nقُلْ أَعُوذُ');
    expect(html).toContain(
      '<div class="surah">قُلْ هُوَ<span class="surah__ayah-end" data-ayah="۝١"></span></div>'
    );
    expect(html).toContain(
      '<div class="surah">قُلْ أَعُوذُ<span class="surah__ayah-end" data-ayah="۝١"></span></div>'
    );
  });

  it('gives each سورة its own element, one after the other', async () => {
    const html = await render({ ...base, quran: true }, 'أ\n\nب\n\nج');
    expect(html.match(/class="surah"/gu)).toHaveLength(3);
    expect(html).toMatch(
      /<\/div>\s*<div class="surah">ب<span [^>]*><\/span><\/div>\s*<div class="surah">/u
    );
  });

  it('folds the rest of a long سورة behind a button that says how many آيات remain', async () => {
    const ayah = 'ب'.repeat(100);
    const html = await render(
      { ...base, quran: true, ayat: 'fold' },
      [ayah, ayah, ayah, ayah, ayah].join('\n')
    );
    expect(html).toContain('<div class="surah surah--fold">');
    expect(html.match(/<details class="surah__rest">/gu)).toHaveLength(1);
    expect(html).toContain(
      `<summary class="surah__more" data-hover="fill"><span class="surah__closed">أكمل القراءة، ${ayatLabel(3)}</span><span class="surah__opened">إخفاء</span><svg class="icon icon--line surah__chevron"`
    );
    expect(html.split('<details')[0]!.match(new RegExp(ayah, 'gu'))).toHaveLength(2);
    expect(html.split('<details')[0]).toMatch(/data-ayah="۝٢"><\/span>$/u);
    expect(html.split('<details')[1]).toContain(
      `${ayah}<span class="surah__ayah-end" data-ayah="۝٣">`
    );
    expect(
      html.split('<details')[1]!.split('</details>')[0]!.match(new RegExp(ayah, 'gu'))
    ).toHaveLength(3);
  });

  it('names each folded سورة by its order, for a reader who hears the buttons', async () => {
    const ayah = 'ب'.repeat(100);
    const surah = [ayah, ayah, ayah, ayah, ayah].join('\n');
    const html = await render({ ...base, quran: true, ayat: 'fold' }, `${surah}\n\n${surah}`);
    const names = [
      ...html.matchAll(/<span class="surah__closed">(.*?)<\/span><span class="surah__opened">/gu),
    ].map(([, label]) => label!.replaceAll(/<[^>]*>/gu, ''));
    expect(names).toEqual([
      `أكمل القراءة، السورة الأولى، ${ayatLabel(3)}`,
      `أكمل القراءة، السورة الثانية، ${ayatLabel(3)}`,
    ]);
    expect(html).toContain('<span class="visually-hidden">، السورة الثانية</span>');
  });

  it('closes each آية with ۝ and its number, counting from its first', async () => {
    const html = await render({ ...base, quran: true, from: [7] }, 'أ\nب\nج\nد');
    expect(html.match(/class="surah"/gu)).toHaveLength(1);
    expect(html).toContain(
      `<div class="surah">أ<span class="surah__ayah-end" data-ayah="۝٧"></span> ب<span class="surah__ayah-end" data-ayah="۝٨"></span> ج<span class="surah__ayah-end" data-ayah="۝٩"></span> د<span class="surah__ayah-end" data-ayah="۝١٠"></span></div>`
    );
  });

  it('numbers each سورة from its own first آية', async () => {
    const html = await render({ ...base, quran: true, from: [255, 1] }, 'أ\n\nب\nج');
    expect(html).toContain(
      `<div class="surah">أ<span class="surah__ayah-end" data-ayah="۝٢٥٥"></span></div>`
    );
    expect(html).toContain(
      `<div class="surah">ب<span class="surah__ayah-end" data-ayah="۝١"></span> ج<span class="surah__ayah-end" data-ayah="۝٢"></span></div>`
    );
  });

  it('keeps each آية a word apart from the next in the text a reader hears', async () => {
    const html = await render({ ...base, quran: true, ayat: 'fold' }, ['أ', 'ب', 'ج'].join('\n'));
    const text = html
      .match(/<div class="surah[^"]*">[\s\S]*?<\/div>/u)![0]
      .replaceAll(/<[^>]*>/gu, '');
    expect(text).toBe('أ ب ج');
  });

  it('keeps the ﴿﴾ ۝ ۞ out of the text a reader copies or hears', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب\n\nج');
    const text = html.replaceAll(/<[^>]*>/gu, '');
    for (const ornament of ['﴿', '﴾', '۝', '۞']) {
      expect(text).not.toContain(ornament);
    }
  });

  it('leaves non-قرآن text unwrapped', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('class="surah"');
  });

  it('tags mode-specific cards and names their time', async () => {
    const html = await render({ ...base, mode: 'masaa' }, 'سبحان الله');
    expect(html).toContain('entry--masaa');
    expect(html).not.toContain('entry--sabah');
    expect(html).toMatch(
      /<p class="entry__lead" data-time-only>\s*<span class="entry__time">\s*في المساء\s*<\/span>\s*<\/p>/u
    );
  });

  it('puts the time after the count on a list, so the switch can hide it alone', async () => {
    const html = await render({ ...base, mode: 'sabah', count: 3 }, 'سبحان الله');
    expect(html).toMatch(
      /<span class="entry__count">٣ مرات<\/span>\s*<span class="entry__time">\s*،\s*في الصباح\s*<\/span>/u
    );
  });

  it('names the time in plain words on the page of the dhikr', async () => {
    const html = await render({ ...base, mode: 'sabah' }, 'سبحان الله', { single: true });
    expect(html).toContain('<p class="entry__lead">في الصباح</p>');
    expect(html).not.toContain('entry__time');
  });

  it('leads with the count in words, with nothing drawn that looks like a button', async () => {
    const html = await render({ ...base, count: 3 }, 'سبحان الله');
    expect(html).toMatch(
      /<p class="entry__lead">\s*<span class="entry__count">٣ مرات<\/span>\s*<\/p>/u
    );
    expect(html).not.toContain('bead-ring');
    expect(html).not.toContain('<svg class="bead');
  });

  it('writes a count above ten in its lead line', async () => {
    const html = await render({ ...base, count: 100 }, 'سبحان الله');
    expect(leadOf(html)).toBe('١٠٠ مرة');
    expect(html).not.toContain('bead-ring');
  });

  it('links the تخريج with its source and its ruling', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('href="https://dorar.net/hadith/sharh/1"');
    expect(html).toContain('<span class="takhrij__text">صحيح البخاري (١)</span>');
  });

  it("writes al-Albani's ruling as a sentence when he is the grader", async () => {
    const html = await render(
      {
        ...base,
        takhrij: { ...base.takhrij, grader: 'الألباني', source: 'صحيح أبي داود ١', ruling: 'صحيح' },
      },
      'سبحان الله'
    );
    expect(html).toContain('<span class="takhrij__text">صحّحه الألباني في صحيح أبي داود (١)</span>');
  });

  it('keeps an optional note off the card', async () => {
    const html = await render({ ...base, note: 'ملاحظة' }, 'سبحان الله');
    expect(html).not.toContain('ملاحظة');
    expect(html).not.toContain('entry__remark');
  });

  it('reads in order: how many and when, how, the text, the virtue, the takhrij', async () => {
    const html = await render(
      { ...base, count: 3, when: 'إذا أخذ مضجعه', how: 'متوضئًا', fadl: 'كفته' },
      'بِسْمِ اللَّهِ'
    );
    const order = [
      '<p class="entry__lead">',
      '<p class="entry__how">متوضئًا</p>',
      '<div class="entry__text">',
      '<dd class="entry__words">كفته</dd>',
      '<a class="takhrij"',
      'data-copy=',
      'href="/sabah-masaa/sayyid-al-istighfar/"',
    ].map((part) => html.indexOf(part));
    expect(leadOf(html)).toBe('٣ مرات، إذا أخذ مضجعه');
    expect(html).toMatch(/<span class="entry__count">٣ مرات<\/span>،\s*إذا أخذ مضجعه/u);
    expect(order).not.toContain(-1);
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  it('shows each phrase with its own count in words, in one column', async () => {
    const html = await render({ ...base, counts: [33, 10] }, 'سبحان الله، والله أكبر');
    expect(html.match(/class="phrase"/gu)).toHaveLength(2);
    expect(html).toMatch(/<li class="entry entry--phrases"/u);
    expect(html).toContain('<span class="badge badge--count">٣٣ مرة</span>');
    expect(html).toContain('<span class="badge badge--count">١٠ مرات</span>');
  });

  it('refuses counts that do not match its phrases', async () => {
    await expect(render({ ...base, counts: [33, 33] }, 'سبحان الله')).rejects.toThrow('2 counts');
  });

  it('shows its name over the card in a list, and no heading on its own page', async () => {
    const listed = await render(base, 'سبحان الله', { heading: 'h3' });
    expect(listed).toMatch(/<h3 class="entry__name">\s*سيد الاستغفار\s*<\/h3>/u);
    expect(await render(base, 'سبحان الله', { single: true })).not.toMatch(/<h\d/u);
  });

  it('hides its name when the text opens with it, so the words are not said twice', async () => {
    const listed = await render({ ...base, title: 'سبحان الله' }, 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', {
      heading: 'h3',
    });
    expect(listed).toContain('<h3 class="visually-hidden">سبحان الله</h3>');
  });

  it('leaves the buttons to its own page when it stands alone', async () => {
    const html = await render(base, 'سبحان الله', { single: true });
    expect(html).not.toContain('entry__acts');
    expect(html).not.toContain('data-copy');
  });

  it('folds its takhrij and its buttons under one line in a list, and keeps all open on its own page', async () => {
    const listed = await render(base, 'سبحان الله', { heading: 'h3' });
    expect(listed).toMatch(
      /<details class="entry__more">\s*<summary class="entry__toggle" data-hover="line">[\s\S]*?التخريج[\s\S]*?<\/summary>\s*<div class="entry__side">[\s\S]*?class="takhrij"[\s\S]*?<div class="entry__acts">[\s\S]*?data-copy=[\s\S]*?<\/details>/u
    );
    expect(listed.slice(listed.indexOf('</details>'))).not.toContain('entry__acts');
    expect(listed).not.toContain('التخريج والمزيد');
    expect(listed).not.toMatch(/<details class="entry__more" open/u);
    const alone = await render(base, 'سبحان الله', { single: true });
    expect(alone).not.toContain('entry__more');
    expect(alone).toContain('class="takhrij"');
  });

  it('omits the lead when there is no count and no moment', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('entry__lead');
  });

  it('says to read each سورة to its end, on the line of how, when only its first آية shows', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\n\nج\nد');
    expect(html).toContain('<p class="entry__how">تقرأ كل سورة إلى آخرها</p>');
    expect(html).not.toContain('entry__lead');
  });

  it('says to read to the end of the سورة when there is one', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\nج');
    expect(html).toContain('<p class="entry__how">تقرأ إلى آخر السورة</p>');
  });

  it('keeps the moment on its line and the read-to-the-end line with how', async () => {
    const html = await render(
      { ...base, quran: true, ayat: 'first', when: 'إذا أوى إلى فراشه', how: 'ينفث' },
      'أ\nب'
    );
    expect(html).toContain('<p class="entry__lead">إذا أوى إلى فراشه</p>');
    expect(html).toContain('<p class="entry__how">ينفث. تقرأ إلى آخر السورة</p>');
  });

  it('adds no read-to-the-end line when every آية shows', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب');
    expect(html).not.toContain('entry__lead');
  });

  it('carries its id, copies itself, and opens its own page', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('<li class="entry" id="sayyid-al-istighfar">');
    expect(html).toMatch(
      /<button type="button" data-hover="line" aria-label="نسخ: سيد الاستغفار" data-copy="سبحان الله\n\nصحيح البخاري \(١\)" class="button button--text entry__act">[\s\S]*?<span data-label>نسخ<\/span>/u
    );
    expect(html).toMatch(
      /<a href="\/sabah-masaa\/sayyid-al-istighfar\/" data-hover="line" aria-label="صفحة الذكر: سيد الاستغفار" class="button button--text entry__act">\s*<span>صفحة الذكر<\/span>/u
    );
    expect(html).not.toContain('data-share-title');
  });

  it('copies the evening form only when the dhikr has one', async () => {
    const both = await render(base, '{{أَصْبَحْنَا|أَمْسَيْنَا}} بِكَ');
    expect(both).toContain('data-copy="أَصْبَحْنَا بِكَ\n');
    expect(both).toContain('data-copy-masaa="أَمْسَيْنَا بِكَ\n');
    expect(await render(base, 'سبحان الله')).not.toContain('data-copy-masaa');
  });

  it('says whether it was copied, on its button and to a screen reader, with an icon for each outcome', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toMatch(
      /<span class="visually-hidden" role="status" data-status><\/span>\s*<button type="button" data-hover="line" aria-label="نسخ: سيد الاستغفار"/u
    );
    expect(html).toMatch(
      /class="icon icon--line icon--idle"[\s\S]*?class="icon icon--line icon--done"[\s\S]*?class="icon icon--line icon--fail"[\s\S]*?<span data-label>نسخ<\/span>/u
    );
  });
});
