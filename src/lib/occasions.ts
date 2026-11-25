import { Array, Record } from 'effect';
import { toneOf } from './tone';

const HEADINGS = {
  'sabah-masaa': 'أذكار الصباح والمساء',
  masjid: 'أذكار الأذان والمسجد',
  'fi-al-salah': 'أذكار داخل الصلاة',
  salah: 'أذكار أدبار الصلوات',
  nawm: 'أذكار النوم',
  istiqaz: 'أذكار الاستيقاظ',
  mutlaq: 'أذكار عامة',
  ahwal: 'أذكار الأحوال',
} as const;

export type Occasion = keyof typeof HEADINGS;

export type Section = {
  readonly id: Occasion;
  readonly heading: string;
  readonly color: string;
};

export const OCCASION_IDS: ReadonlyArray<Occasion> = Record.keys(HEADINGS);

export const OCCASIONS: ReadonlyArray<Section> = Array.map(OCCASION_IDS, (id, index) => ({
  id,
  heading: HEADINGS[id],
  color: toneOf(index, OCCASION_IDS.length),
}));

export function sectionOf(id: Occasion): Section {
  return {
    id,
    heading: HEADINGS[id],
    color: toneOf(OCCASION_IDS.indexOf(id), OCCASION_IDS.length),
  };
}
