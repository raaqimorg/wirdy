import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Dhikr from './Dhikr.astro';
import { toArabicDigits } from '../lib/arabic';
import type { Dhikr as DhikrData } from '../lib/schema';

type Extra = { heading?: 'h2' | 'h3' | 'h4'; single?: boolean };

const base: DhikrData = {
  title: 'سيد الاستغفار',
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
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const leadOf = (html: string) => textOf(html.match(/<p class="entry__lead">([\s\S]*?)<\/p>/)![1]!);

describe('Dhikr', () => {
  it('renders each form with the other form struck after it', async () => {
    const html = await render(base, '{{أَصْبَحْنَا|أَمْسَيْنَا}} بِكَ');
    expect(html).toContain(
      '<span class="variant-text variant-text--sabah"><span>أَصْبَحْنَا\u00a0<span class="word-form__other" aria-hidden="true">أَمْسَيْنَا</span></span></span>'
    );
    expect(html).toContain(
      '<span class="variant-text variant-text--masaa"><span>أَمْسَيْنَا\u00a0<span class="word-form__other" aria-hidden="true">أَصْبَحْنَا</span></span></span>'
    );
  });

  it('keeps the two variant spans adjacent with no stray whitespace', async () => {
    const html = await render(base, '{{أ|ب}}');
    expect(html).toMatch(/<\/span><\/span><\/span><span class="variant-text variant-text--masaa">/);
  });

  it('strikes each word that differs, right after its own word', async () => {
    const html = await render(base, '{{هَذَا الْيَوْمِ|هَذِهِ اللَّيْلَةِ}}');
    const morning = html.match(
      /<span class="variant-text variant-text--sabah">([\s\S]*?)<\/span><span class="variant-text variant-text--masaa">/
    )![1];
    expect(morning.replace(/<[^>]+>/g, '')).toBe('هَذَا\u00a0هَذِهِ الْيَوْمِ\u00a0اللَّيْلَةِ');
    expect(morning.match(/class="word-form__other"/g)).toHaveLength(2);
  });

  it('shows a word that both forms share once, with nothing struck', async () => {
    const html = await render(base, '{{رَبِّ أَسْأَلُكَ|رَبِّ أَعُوذُ}}');
    const morning = html.match(
      /<span class="variant-text variant-text--sabah">([\s\S]*?)<\/span><span class="variant-text variant-text--masaa">/
    )![1];
    expect(morning.match(/رَبِّ/g)).toHaveLength(1);
    expect(morning.match(/class="word-form__other"/g)).toHaveLength(1);
  });

  it('suppresses the badge when the count is one', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('class="bead-ring"');
    expect(html).not.toContain('entry__head');
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
      .replace(/<span class="visually-hidden">[\s\S]*?<\/span>/g, '')
      .replace(/<a class="takhrij"[\s\S]*/, '');
    expect(textOf(seen).match(/[٠-٩]+/g)).toEqual([toArabicDigits(count)]);
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
    expect(html).toContain('<span class="surah">قُلْ هُوَ</span>');
    expect(html).toContain('<span class="surah">قُلْ أَعُوذُ</span>');
    expect(html).not.toContain('ٱلصَّمَدُ');
    expect(html).not.toContain('مِن شَرِّ');
    expect(html).not.toContain('surah__ayah-end');
  });

  it('wraps each سورة of a قرآن card in its own element', async () => {
    const html = await render({ ...base, quran: true }, 'قُلْ هُوَ\n\nقُلْ أَعُوذُ');
    expect(html).toContain('<span class="surah">قُلْ هُوَ</span>');
    expect(html).toContain('<span class="surah">قُلْ أَعُوذُ</span>');
  });

  it('gives each سورة its own element, one after the other', async () => {
    const html = await render({ ...base, quran: true }, 'أ\n\nب\n\nج');
    expect(html.match(/class="surah"/g)).toHaveLength(3);
    expect(html).toMatch(/<\/span>\s*<span class="surah">ب<\/span>\s*<span class="surah">/);
  });

  it('closes each آية inside a سورة with ۝ but not the last', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب\nج\nد');
    expect(html.match(/class="surah"/g)).toHaveLength(1);
    expect(html.match(/class="surah__ayah-end"/g)).toHaveLength(3);
    expect(html).toMatch(/<span class="surah">أ<span class="surah__ayah-end"><\/span>ب/);
  });

  it('leaves a single آية unmarked', async () => {
    const html = await render({ ...base, quran: true }, 'قُلْ هُوَ ٱللَّهُ أَحَدٌ');
    expect(html).not.toContain('surah__ayah-end');
  });

  it('keeps the ﴿﴾ ۝ ۞ out of the markup', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب\n\nج');
    for (const ornament of ['﴿', '﴾', '۝', '۞']) {
      expect(html).not.toContain(ornament);
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
    expect(html).toContain('<p class="entry__lead">في المساء</p>');
  });

  it('leads with the count as a ring of beads, before its unit', async () => {
    const html = await render({ ...base, count: 3 }, 'سبحان الله');
    const ring = html.match(
      /<svg class="bead-ring"[^>]*aria-hidden="true">([\s\S]*?)<\/svg>\s*<p class="entry__lead">\s*<span class="visually-hidden">\s*٣\s*<\/span>\s*مرات\s*<\/p>/
    );
    expect(ring).not.toBeNull();
    expect(ring![1].match(/<circle cx=/g)).toHaveLength(3);
    expect(ring![1]).toContain('>٣</text>');
  });

  it('writes a count above ten inside a full ring', async () => {
    const html = await render({ ...base, count: 100 }, 'سبحان الله');
    const ring = html.match(/<svg class="bead-ring bead-ring--full"[^>]*>([\s\S]*?)<\/svg>/)![1];
    expect(ring).toContain('>١٠٠</text>');
    expect(ring.match(/<circle cx=/g)).toBeNull();
  });

  it('links the تخريج with its source and its ruling', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('href="https://dorar.net/hadith/sharh/1"');
    expect(html).toContain('<span>صحيح البخاري (١)</span>');
  });

  it("writes al-Albani's ruling as a sentence when he is the grader", async () => {
    const html = await render(
      {
        ...base,
        takhrij: { ...base.takhrij, grader: 'الألباني', source: 'صحيح أبي داود ١', ruling: 'صحيح' },
      },
      'سبحان الله'
    );
    expect(html).toContain('<span>صحّحه الألباني في صحيح أبي داود (١)</span>');
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
      '<svg class="bead-ring"',
      '<p class="entry__lead">',
      '<p class="entry__how">متوضئًا</p>',
      '<p class="entry__text">',
      '<p class="entry__note">كفته</p>',
      '<a class="takhrij"',
      'data-copy=',
      'href="/sabah-masaa/sayyid-al-istighfar/"',
    ].map((part) => html.indexOf(part));
    expect(leadOf(html)).toBe('٣ مرات، إذا أخذ مضجعه');
    expect(order).not.toContain(-1);
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  it('shows each phrase with its own count, read aloud in full', async () => {
    const html = await render({ ...base, counts: [33, 10] }, 'سبحان الله، والله أكبر');
    expect(html.match(/class="phrase"/g)).toHaveLength(2);
    expect(html).toMatch(
      /<span aria-hidden="true">٣٣<\/span>\s*<span class="visually-hidden">٣٣ مرة<\/span>/
    );
    expect(html).toMatch(
      /<span aria-hidden="true">١٠<\/span>\s*<span class="visually-hidden">١٠ مرات<\/span>/
    );
  });

  it('refuses counts that do not match its phrases', async () => {
    await expect(render({ ...base, counts: [33, 33] }, 'سبحان الله')).rejects.toThrow('2 counts');
  });

  it('carries its title as a hidden heading in a list, and none on its own page', async () => {
    const listed = await render(base, 'سبحان الله', { heading: 'h3' });
    expect(listed).toContain('<h3 class="visually-hidden">سيد الاستغفار</h3>');
    expect(await render(base, 'سبحان الله', { single: true })).not.toMatch(/<h\d/);
  });

  it('leaves the buttons to its own page when it stands alone', async () => {
    const html = await render(base, 'سبحان الله', { single: true });
    expect(html).not.toContain('entry__actions');
    expect(html).not.toContain('data-copy');
  });

  it('omits the lead when there is no cue', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('entry__lead');
  });

  it('says to read each سورة to its end when only its first آية shows', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\n\nج\nد');
    expect(html).toContain('<p class="entry__lead">تُقرأ كل سورة إلى آخرها</p>');
  });

  it('says to read to the end of the سورة when there is one', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\nج');
    expect(html).toContain('<p class="entry__lead">تُقرأ إلى آخر السورة</p>');
  });

  it('joins the read-to-the-end line to a cue as its own sentence', async () => {
    const html = await render(
      { ...base, quran: true, ayat: 'first', when: 'إذا أوى إلى فراشه' },
      'أ\nب'
    );
    expect(html).toContain('<p class="entry__lead">إذا أوى إلى فراشه. تُقرأ إلى آخر السورة</p>');
  });

  it('adds no read-to-the-end line when every آية shows', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب');
    expect(html).not.toContain('entry__lead');
  });

  it('carries its id, copies itself, and opens its own page', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('<li class="entry entry--split" id="sayyid-al-istighfar">');
    expect(html).toMatch(
      /<button class="icon-button icon-button--quiet" type="button" aria-label="نسخ: سيد الاستغفار" data-copy="سبحان الله\n\nصحيح البخاري \(١\)">/
    );
    expect(html).toMatch(
      /<a class="icon-button icon-button--quiet" href="\/sabah-masaa\/sayyid-al-istighfar\/" aria-label="صفحة الذكر: سيد الاستغفار">/
    );
    expect(html).not.toContain('data-share-title');
  });

  it('copies the evening form only when the dhikr has one', async () => {
    const both = await render(base, '{{أَصْبَحْنَا|أَمْسَيْنَا}} بِكَ');
    expect(both).toContain('data-copy="أَصْبَحْنَا بِكَ\n');
    expect(both).toContain('data-copy-masaa="أَمْسَيْنَا بِكَ\n');
    expect(await render(base, 'سبحان الله')).not.toContain('data-copy-masaa');
  });

  it('has an empty status, next to the buttons, for saying that it was copied', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toMatch(
      /<span class="entry__status" role="status" data-status><\/span>\s*<button class="icon-button/
    );
  });
});
