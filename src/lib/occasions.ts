import { Array, Record } from 'effect';
import { toneOf } from './tone';

const SECTIONS = {
  'sabah-masaa': {
    heading: 'الصباح والمساء',
    title: 'أذكار الصباح والمساء',
  },
  masjid: {
    heading: 'الأذان والمسجد',
    title: 'أذكار الأذان والمسجد',
  },
  'fi-al-salah': {
    heading: 'أثناء الصلاة',
    title: 'أذكار أثناء الصلاة',
  },
  salah: { heading: 'بعد الصلاة', title: 'أذكار بعد الصلاة' },
  nawm: { heading: 'عند النوم', title: 'أذكار النوم' },
  istiqaz: {
    heading: 'عند الاستيقاظ',
    title: 'أذكار الاستيقاظ',
  },
  mutlaq: { heading: 'كل وقت', title: 'أذكار كل وقت' },
  ahwal: { heading: 'أحوال متفرقة', title: 'أذكار الأحوال' },
} as const;

export type Occasion = keyof typeof SECTIONS;

export type Section = {
  readonly id: Occasion;
  readonly heading: string;
  readonly title: string;
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

export const listed = (mode: 'both' | 'sabah' | 'masaa'): boolean => mode !== 'masaa';
