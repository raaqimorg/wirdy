import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Dhikr from './Dhikr.astro';
import type { Dhikr as DhikrData } from '../lib/schema';

const base: DhikrData = {
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

async function render(data: DhikrData, body: string) {
  const container = await AstroContainer.create();
  return container.renderToString(Dhikr, { props: { data, body } });
}

describe('Dhikr', () => {
  it('renders each form with the other form struck after it', async () => {
    const html = await render(base, '{{أَصْبَحْنَا|أَمْسَيْنَا}} بِكَ');
    expect(html).toContain(
      '<span class="v-s"><span class="pair">أَصْبَحْنَا\u00a0<span class="alt" aria-hidden="true">أَمْسَيْنَا</span></span></span>'
    );
    expect(html).toContain(
      '<span class="v-m"><span class="pair">أَمْسَيْنَا\u00a0<span class="alt" aria-hidden="true">أَصْبَحْنَا</span></span></span>'
    );
  });

  it('keeps the two variant spans adjacent with no stray whitespace', async () => {
    const html = await render(base, '{{أ|ب}}');
    expect(html).toMatch(/<\/span><\/span><\/span><span class="v-m">/);
  });

  it('strikes each word that differs, right after its own word', async () => {
    const html = await render(base, '{{هَذَا الْيَوْمِ|هَذِهِ اللَّيْلَةِ}}');
    const morning = html.match(/<span class="v-s">([\s\S]*?)<\/span><span class="v-m">/)![1];
    expect(morning.replace(/<[^>]+>/g, '')).toBe('هَذَا\u00a0هَذِهِ الْيَوْمِ\u00a0اللَّيْلَةِ');
    expect(morning.match(/class="alt"/g)).toHaveLength(2);
  });

  it('shows a word that both forms share once, with nothing struck', async () => {
    const html = await render(base, '{{رَبِّ أَسْأَلُكَ|رَبِّ أَعُوذُ}}');
    const morning = html.match(/<span class="v-s">([\s\S]*?)<\/span><span class="v-m">/)![1];
    expect(morning.match(/رَبِّ/g)).toHaveLength(1);
    expect(morning.match(/class="alt"/g)).toHaveLength(1);
  });

  it('suppresses the badge when the count is one', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('item__count');
  });

  it('shows an agreeing badge when the count is above one', async () => {
    const html = await render({ ...base, count: 3 }, 'سبحان الله');
    expect(html).toContain('٣ مرات');
  });

  it('uses the singular for counts above ten', async () => {
    const html = await render({ ...base, count: 100 }, 'سبحان الله');
    expect(html).toContain('١٠٠ مرة');
  });

  it('puts no درجة marker on the card', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('dhikr--daif');
    expect(html).not.toContain('dhikr__daif');
  });

  it('flags Quran cards for the Uthmanic face', async () => {
    const html = await render({ ...base, quran: true }, 'سبحان الله');
    expect(html).toContain('is-quran');
  });

  it('shows only the first آية of each سورة when asked', async () => {
    const html = await render(
      { ...base, quran: true, ayat: 'first' },
      'قُلْ هُوَ\nٱللَّهُ ٱلصَّمَدُ\n\nقُلْ أَعُوذُ\nمِن شَرِّ'
    );
    expect(html).toContain('<span class="ayat">قُلْ هُوَ</span>');
    expect(html).toContain('<span class="ayat">قُلْ أَعُوذُ</span>');
    expect(html).not.toContain('ٱلصَّمَدُ');
    expect(html).not.toContain('مِن شَرِّ');
    expect(html).not.toContain('ayah-end');
  });

  it('wraps each سورة of a قرآن card in its own element', async () => {
    const html = await render({ ...base, quran: true }, 'قُلْ هُوَ\n\nقُلْ أَعُوذُ');
    expect(html).toContain('<span class="ayat">قُلْ هُوَ</span>');
    expect(html).toContain('<span class="ayat">قُلْ أَعُوذُ</span>');
  });

  it('parts consecutive سور with ۞، and does not trail one', async () => {
    const html = await render({ ...base, quran: true }, 'أ\n\nب\n\nج');
    expect(html.match(/class="ayat-sep"/g)).toHaveLength(2);
    expect(html).not.toMatch(/ayat-sep[^>]*><\/span>\s*<\/p>/);
  });

  it('closes each آية inside a سورة with ۝ but not the last', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب\nج\nد');
    expect(html.match(/class="ayat"/g)).toHaveLength(1);
    expect(html.match(/class="ayah-end"/g)).toHaveLength(3);
    expect(html).not.toContain('ayat-sep');
    expect(html).toMatch(/<span class="ayat">أ<span class="ayah-end"><\/span>ب/);
  });

  it('leaves a single آية unmarked', async () => {
    const html = await render({ ...base, quran: true }, 'قُلْ هُوَ ٱللَّهُ أَحَدٌ');
    expect(html).not.toContain('ayat-sep');
    expect(html).not.toContain('ayah-end');
  });

  it('keeps the ﴿﴾ ۝ ۞ out of the markup', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب\n\nج');
    for (const ornament of ['﴿', '﴾', '۝', '۞']) {
      expect(html).not.toContain(ornament);
    }
  });

  it('leaves non-قرآن text unwrapped', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('class="ayat"');
  });

  it('tags mode-specific cards and names their time', async () => {
    const html = await render({ ...base, mode: 'masaa' }, 'سبحان الله');
    expect(html).toContain('is-masaa');
    expect(html).not.toContain('is-sabah');
    expect(html).toContain('<span class="item__cue">في المساء</span>');
  });

  it('draws the count as dots beside its label', async () => {
    const html = await render({ ...base, count: 3 }, 'سبحان الله');
    expect(html).toMatch(
      /٣ مرات<span class="dots" style="--cols: 3; --rows: 1" aria-hidden="true">/
    );
  });

  it('links the تخريج with its source and its ruling', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('href="https://dorar.net/hadith/sharh/1"');
    expect(html).toContain('<span class="source__label">التخريج</span>');
    expect(html).toContain('<span class="source__value">صحيح البخاري ١ · أخرجه البخاري</span>');
  });

  it('names al-Albani in the source line when he is the grader', async () => {
    const html = await render(
      {
        ...base,
        takhrij: { ...base.takhrij, grader: 'الألباني', source: 'صحيح أبي داود ١', ruling: 'صحيح' },
      },
      'سبحان الله'
    );
    expect(html).toContain('الألباني · صحيح أبي داود ١ · صحيح');
  });

  it('keeps an optional note off the card', async () => {
    const html = await render({ ...base, note: 'ملاحظة' }, 'سبحان الله');
    expect(html).not.toContain('ملاحظة');
    expect(html).not.toContain('item__note');
  });

  it('puts the cue above the text when there is one', async () => {
    const html = await render({ ...base, when: 'عند الخروج من المنزل' }, 'بِسْمِ اللَّهِ');
    expect(html).toMatch(/<span class="item__cue">عند الخروج من المنزل<\/span>[\s\S]*dhikr__text/);
  });

  it('omits the cue when there is none', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('item__cue');
  });
});
