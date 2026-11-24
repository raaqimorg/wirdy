export const OCCASIONS = [
  { id: 'sabah-masaa', heading: 'أذكار الصباح والمساء', color: '#ad4c0b' },
  { id: 'masjid', heading: 'أذكار الأذان والمسجد', color: '#9a3f6e' },
  { id: 'salah', heading: 'أذكار أدبار الصلوات', color: '#3a7550' },
  { id: 'nawm', heading: 'أذكار النوم', color: '#47598a' },
  { id: 'istiqaz', heading: 'أذكار الاستيقاظ', color: '#1a7482' },
  { id: 'mutlaq', heading: 'أذكار مطلقة', color: '#8356a2' },
  { id: 'ahwal', heading: 'أذكار الأحوال', color: '#ac4543' },
] as const;

export type Occasion = (typeof OCCASIONS)[number]['id'];

export const OCCASION_IDS = OCCASIONS.map((occasion) => occasion.id) as [Occasion, ...Occasion[]];
