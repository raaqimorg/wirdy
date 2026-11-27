import { Array, Record } from 'effect';
import { hueAt, toneOf } from './tone';

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
  mawasim: { heading: 'المواسم والحج', title: 'أذكار المواسم والحج' },
  taam: { heading: 'الطعام والشراب', title: 'أذكار الطعام والشراب' },
  bayt: { heading: 'البيت والأهل', title: 'أذكار البيت والأهل' },
  safar: { heading: 'الخروج والسفر', title: 'أذكار الخروج والسفر' },
  nas: { heading: 'الناس والمجالس', title: 'أذكار الناس والمجالس' },
  hamm: { heading: 'الهم والغضب', title: 'أذكار الهم والغضب' },
  marad: { heading: 'المرض والرقية', title: 'أذكار المرض والرقية' },
  janaiz: { heading: 'الموت والجنائز', title: 'أذكار الجنائز' },
  matar: { heading: 'المطر والريح', title: 'أذكار المطر والريح' },
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
  color: toneOf(hueAt(index, OCCASION_IDS.length), OCCASION_IDS.length),
}));

export function sectionOf(id: Occasion): Section {
  return {
    id,
    ...SECTIONS[id],
    color: toneOf(hueAt(OCCASION_IDS.indexOf(id), OCCASION_IDS.length), OCCASION_IDS.length),
  };
}

export const listed = (mode: 'both' | 'sabah' | 'masaa'): boolean => mode !== 'masaa';
