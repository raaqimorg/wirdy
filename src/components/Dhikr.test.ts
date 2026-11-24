import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Dhikr from './Dhikr.astro';
import type { Dhikr as DhikrData } from '../lib/schema';

type Extra = { heading?: 'h2' | 'h3' | 'h4'; alone?: boolean };

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
    expect(html).not.toContain('class="beads"');
    expect(html).not.toContain('item__head');
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

  it('parts consecutive سور with a gap, and does not trail one', async () => {
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
    expect(html).toContain('<p class="item__lead">في المساء</p>');
  });

  it('draws the count as a ring of beads beside its label', async () => {
    const html = await render({ ...base, count: 3 }, 'سبحان الله');
    const ring = html.match(
      /<p class="item__lead">٣ مرات<\/p>\s*<svg class="beads"[^>]*aria-hidden="true">([\s\S]*?)<\/svg>/
    );
    expect(ring).not.toBeNull();
    expect(ring![1].match(/<circle cx=/g)).toHaveLength(3);
    expect(ring![1]).toContain('>٣</text>');
  });

  it('writes a count above ten inside a full ring', async () => {
    const html = await render({ ...base, count: 100 }, 'سبحان الله');
    const ring = html.match(/<svg class="beads"[^>]*>([\s\S]*?)<\/svg>/)![1];
    expect(ring).toContain('class="beads__string is-full"');
    expect(ring).toContain('>١٠٠</text>');
    expect(ring.match(/<circle cx=/g)).toBeNull();
  });

  it('links the تخريج with its source and its ruling', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('href="https://dorar.net/hadith/sharh/1"');
    expect(html).toContain('<span class="source__value">صحيح البخاري (١)</span>');
  });

  it("writes al-Albani's ruling as a sentence when he is the grader", async () => {
    const html = await render(
      {
        ...base,
        takhrij: { ...base.takhrij, grader: 'الألباني', source: 'صحيح أبي داود ١', ruling: 'صحيح' },
      },
      'سبحان الله'
    );
    expect(html).toContain('<span class="source__value">صحّحه الألباني في صحيح أبي داود (١)</span>');
  });

  it('keeps an optional note off the card', async () => {
    const html = await render({ ...base, note: 'ملاحظة' }, 'سبحان الله');
    expect(html).not.toContain('ملاحظة');
    expect(html).not.toContain('item__note');
  });

  it('reads in order: how many and when, how, the text, the virtue, the takhrij', async () => {
    const html = await render(
      { ...base, count: 3, when: 'إذا أخذ مضجعه', how: 'متوضئًا', fadl: 'كفته' },
      'بِسْمِ اللَّهِ'
    );
    const order = [
      '<p class="item__lead">٣ مرات، إذا أخذ مضجعه</p>',
      '<p class="item__how">متوضئًا</p>',
      '<p class="dhikr__text">',
      '<p class="item__fadl">كفته</p>',
      '<a class="source"',
      '<a class="share"',
    ].map((part) => html.indexOf(part));
    expect(order).not.toContain(-1);
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  it('shows each phrase with its own count, read aloud in full', async () => {
    const html = await render({ ...base, counts: [33, 10] }, 'سبحان الله، والله أكبر');
    expect(html.match(/class="phrase"/g)).toHaveLength(2);
    expect(html).toMatch(/<span aria-hidden="true">٣٣<\/span>\s*<span class="vh">٣٣ مرة<\/span>/);
    expect(html).toMatch(/<span aria-hidden="true">١٠<\/span>\s*<span class="vh">١٠ مرات<\/span>/);
  });

  it('refuses counts that do not match its phrases', async () => {
    await expect(render({ ...base, counts: [33, 33] }, 'سبحان الله')).rejects.toThrow('2 counts');
  });

  it('carries its title as a hidden heading in a list, and none on its own page', async () => {
    const listed = await render(base, 'سبحان الله', { heading: 'h3' });
    expect(listed).toContain('<h3 class="vh">سيد الاستغفار</h3>');
    expect(await render(base, 'سبحان الله', { alone: true })).not.toMatch(/<h\d/);
  });

  it('leaves the share link to its own page when it stands alone', async () => {
    expect(await render(base, 'سبحان الله', { alone: true })).not.toContain('data-title');
  });

  it('omits the lead when there is no cue', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).not.toContain('item__lead');
  });

  it('says to read each سورة to its end when only its first آية shows', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\n\nج\nد');
    expect(html).toContain('<p class="item__lead">تُقرأ كل سورة إلى آخرها</p>');
  });

  it('says to read to the end of the سورة when there is one', async () => {
    const html = await render({ ...base, quran: true, ayat: 'first' }, 'أ\nب\nج');
    expect(html).toContain('<p class="item__lead">تُقرأ إلى آخر السورة</p>');
  });

  it('joins the read-to-the-end line to a cue as its own sentence', async () => {
    const html = await render(
      { ...base, quran: true, ayat: 'first', when: 'إذا أوى إلى فراشه' },
      'أ\nب'
    );
    expect(html).toContain('<p class="item__lead">إذا أوى إلى فراشه. تُقرأ إلى آخر السورة</p>');
  });

  it('adds no read-to-the-end line when every آية shows', async () => {
    const html = await render({ ...base, quran: true }, 'أ\nب');
    expect(html).not.toContain('item__lead');
  });

  it('carries its id, and shares the link of its own page', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toContain('<li class="item" id="sayyid-al-istighfar">');
    expect(html).toMatch(
      /<a class="share" href="\/sabah-masaa\/sayyid-al-istighfar\/" data-title="سيد الاستغفار" aria-label="مشاركة: سيد الاستغفار">/
    );
  });

  it('has an empty status, next to the link, for saying that it was copied', async () => {
    const html = await render(base, 'سبحان الله');
    expect(html).toMatch(/<span class="share__said" role="status"><\/span>\s*<a class="share"/);
  });
});
