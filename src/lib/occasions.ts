import { toneOf } from './tone';

const SECTIONS = [
  { id: 'sabah-masaa', heading: 'أذكار الصباح والمساء' },
  { id: 'masjid', heading: 'أذكار الأذان والمسجد' },
  { id: 'fi-al-salah', heading: 'أذكار داخل الصلاة' },
  { id: 'salah', heading: 'أذكار أدبار الصلوات' },
  { id: 'nawm', heading: 'أذكار النوم' },
  { id: 'istiqaz', heading: 'أذكار الاستيقاظ' },
  { id: 'mutlaq', heading: 'أذكار عامة' },
  { id: 'ahwal', heading: 'أذكار الأحوال' },
] as const;

export const OCCASIONS = SECTIONS.map(({ id, heading }, index) => ({
  id,
  heading,
  color: toneOf(index, SECTIONS.length),
}));

export type Occasion = (typeof SECTIONS)[number]['id'];

export const OCCASION_IDS = OCCASIONS.map((occasion) => occasion.id) as [Occasion, ...Occasion[]];
