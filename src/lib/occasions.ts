import { Array, Record } from 'effect';
import { toneOf } from './tone';

const SECTIONS = {
  'sabah-masaa': {
    heading: 'الصباح والمساء',
    title: 'أذكار الصباح والمساء',
    lede: 'القرآن، والاستغفار، والتسبيح',
  },
  masjid: {
    heading: 'الأذان والمسجد',
    title: 'أذكار الأذان والمسجد',
    lede: 'إجابة المؤذن، والوضوء، والدخول',
  },
  'fi-al-salah': {
    heading: 'أثناء الصلاة',
    title: 'أذكار أثناء الصلاة',
    lede: 'الركوع، والسجود، والتشهد',
  },
  salah: { heading: 'بعد الصلاة', title: 'أذكار بعد الصلاة', lede: 'التسبيح، والقرآن، والدعاء' },
  nawm: { heading: 'عند النوم', title: 'أذكار النوم', lede: 'القرآن، والتسبيح، وآخر ما يقال' },
  istiqaz: {
    heading: 'عند الاستيقاظ',
    title: 'أذكار الاستيقاظ',
    lede: 'يقظة الليل، والفزع، والرؤيا المكروهة',
  },
  mutlaq: { heading: 'كل وقت', title: 'أذكار كل وقت', lede: 'التسبيح، والتهليل، والاستغفار' },
  ahwal: { heading: 'أحوال متفرقة', title: 'أذكار الأحوال', lede: 'الطعام، والسفر، والكرب' },
} as const;

export type Occasion = keyof typeof SECTIONS;

export type Section = {
  readonly id: Occasion;
  readonly heading: string;
  readonly title: string;
  readonly lede: string;
  readonly color: string;
};

export const OCCASION_IDS: ReadonlyArray<Occasion> = Record.keys(SECTIONS);

export const OCCASIONS: ReadonlyArray<Section> = Array.map(OCCASION_IDS, (id, index) => ({
  id,
  ...SECTIONS[id],
  color: toneOf(index, OCCASION_IDS.length),
}));

export function sectionOf(id: Occasion): Section {
  return {
    id,
    ...SECTIONS[id],
    color: toneOf(OCCASION_IDS.indexOf(id), OCCASION_IDS.length),
  };
}
