import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { descriptionOf, hadithDescriptionOf } from './description';
import type { Hadith } from './schema';

const card: Card = {
  heading: 'أذكار الأحوال',
  color: '#000000',
  title: 'دعاء الكرب',
  context: null,
  lead: 'عند الكرب',
  quran: false,
  blocks: [['لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم.']],
  from: [],
  evening: null,
  cut: false,
  count: null,
  takhrij: 'صحيح البخاري (٦٣٤٦)',
};

const long = Array.from({ length: 12 }, (_, index) => `جملة طويلة من الدعاء رقم ${String(index)}`);

describe('descriptionOf', () => {
  it('quotes the words of a dhikr between its lead and its takhrij', () => {
    expect(descriptionOf(card)).toBe(
      'عند الكرب. «لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم». صحيح البخاري (٦٣٤٦)'
    );
  });

  it('cuts long words at the end of a clause and marks the cut', () => {
    const words = descriptionOf({ ...card, blocks: [[long.join('، ')]] });
    expect(words).toContain(`«${long[0] ?? ''}،`);
    expect(words).toContain('…»');
    expect(words).not.toContain(long.at(-1) ?? '');
  });

  it('cuts between words a long clause with no clause end', () => {
    const words = descriptionOf({ ...card, blocks: [[long.join(' ')]] });
    expect(words).toContain(`«${long[0] ?? ''} `);
    expect(words).toContain('…»');
    expect(words).not.toContain(long.at(-1) ?? '');
  });

  it('closes a quote the cut leaves open', () => {
    const text = `قال «${long.join(' ')}»`;
    expect(descriptionOf({ ...card, blocks: [[text]] })).toContain('…»»');
  });

  it('marks the cut of a text the card already cut', () => {
    expect(descriptionOf({ ...card, blocks: [['سبحان الله']], cut: true })).toContain(
      '«سبحان الله…»'
    );
  });

  it('quotes the first ayat of a قرآن card, and marks what follows', () => {
    const quran = {
      ...card,
      lead: '',
      quran: true,
      blocks: [['قُلْ هُوَ اللَّهُ أَحَدٌ', 'اللَّهُ الصَّمَدُ'], ['قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ']],
    };
    expect(descriptionOf(quran)).toBe('«قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ…». صحيح البخاري (٦٣٤٦)');
  });

  it('leaves the words to the count when each phrase has its own count', () => {
    const tasbih = { ...card, phrases: [{ text: 'سبحان الله', count: 33 }] };
    expect(descriptionOf(tasbih)).toBe('عند الكرب. سبحان الله ٣٣ مرة. صحيح البخاري (٦٣٤٦)');
  });

  it('cuts one long آية between words, without a pause mark before the cut', () => {
    const ayah = Array.from({ length: 30 }, (_, index) => `كَلِمَةٌ${String(index)} ۚ`).join(' ');
    const quran = { ...card, lead: '', quran: true, blocks: [[ayah]] };
    const description = descriptionOf(quran);
    expect(description).toMatch(/^«كَلِمَةٌ0 .*…»/u);
    expect(description).not.toMatch(/ۚ\s*…/u);
    expect(description).not.toContain('كَلِمَةٌ29');
  });

  it('shortens the words until the whole description fits in 200 characters', () => {
    const fadl = 'غفرت له ذنوبه وإن كانت مثل زبد البحر، وكان له عدل عشر رقاب';
    const description = descriptionOf({ ...card, blocks: [[long.join(' ')]] }, fadl);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).toContain(`. ${fadl}. صحيح البخاري (٦٣٤٦)`);
  });

  it('cuts a long list of counted phrases at a phrase, with no full stop after the cut', () => {
    const phrases = long.map((text) => ({ text, count: 3 }));
    const description = descriptionOf({ ...card, phrases }, 'كفته');
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).toContain(`عند الكرب. ${long[0] ?? ''} ٣ مرات`);
    expect(description).toContain('… كفته. صحيح البخاري (٦٣٤٦)');
  });

  it('carries the count and the virtue after the words', () => {
    expect(descriptionOf({ ...card, count: '٣ مرات' }, 'كفته')).toBe(
      'عند الكرب. «لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم». ٣ مرات. كفته. صحيح البخاري (٦٣٤٦)'
    );
  });
});

describe('hadithDescriptionOf', () => {
  it('quotes the hadith, then its narrator and its takhrij', () => {
    const hadith: Hadith = {
      title: 'ما أنزل الله داء إلا أنزل له شفاء',
      headline: 'ما أنزل الله داء إلا أنزل له شفاء',
      order: 1,
      group: 'مبادئ التداوي',
      rawi: 'أبي هريرة',
      takhrij: {
        grader: 'البخاري',
        source: 'صحيح البخاري ٥٦٧٨',
        ruling: 'صحيح',
        url: 'https://sunnah.com/bukhari:5678',
      },
    };
    expect(hadithDescriptionOf(hadith, 'مَا أَنْزَلَ اللَّهُ دَاءً إِلاَّ أَنْزَلَ لَهُ شِفَاءً\n')).toBe(
      '«مَا أَنْزَلَ اللَّهُ دَاءً إِلاَّ أَنْزَلَ لَهُ شِفَاءً». عن أبي هريرة. صحيح البخاري (٥٦٧٨)'
    );
  });
});
