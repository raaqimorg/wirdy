export const OCCASIONS = [
  { id: 'sabah-masaa', heading: 'أذكار الصباح والمساء', color: '#c53a05' },
  { id: 'masjid', heading: 'أذكار الأذان والمسجد', color: '#b02e7c' },
  { id: 'fi-al-salah', heading: 'أذكار داخل الصلاة', color: '#6b6b0f' },
  { id: 'salah', heading: 'أذكار أدبار الصلوات', color: '#1b764a' },
  { id: 'nawm', heading: 'أذكار النوم', color: '#3a67c4' },
  { id: 'istiqaz', heading: 'أذكار الاستيقاظ', color: '#0a6d73' },
  { id: 'mutlaq', heading: 'أذكار عامة', color: '#764ba5' },
  { id: 'ahwal', heading: 'أذكار الأحوال', color: '#bf2f52' },
] as const;

export type Occasion = (typeof OCCASIONS)[number]['id'];

export const OCCASION_IDS = OCCASIONS.map((occasion) => occasion.id) as [Occasion, ...Occasion[]];
