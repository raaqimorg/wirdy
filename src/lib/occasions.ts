import { Array, Record } from 'effect';
import { toneOf } from './tone';

const SECTIONS = {
  'sabah-masaa': { heading: 'أذكار الصباح والمساء', lede: 'ما يقال حين تصبح وحين تمسي' },
  masjid: { heading: 'أذكار الأذان والمسجد', lede: 'الأذان، والوضوء، والمسجد' },
  'fi-al-salah': { heading: 'أذكار داخل الصلاة', lede: 'من الاستفتاح إلى التشهد، والوتر' },
  salah: { heading: 'أذكار أدبار الصلوات', lede: 'بعد السلام: تسبيح وقراءة ودعاء' },
  nawm: { heading: 'أذكار النوم', lede: 'عند الفراش، وآخر ما يقال' },
  istiqaz: { heading: 'أذكار الاستيقاظ', lede: 'عند الاستيقاظ، وما يعرض في الليل' },
  mutlaq: { heading: 'أذكار عامة', lede: 'تسبيح وتهليل واستغفار ودعاء' },
  ahwal: { heading: 'أذكار الأحوال', lede: 'الطعام، والسفر، والكرب، وغيرها' },
} as const;

export type Occasion = keyof typeof SECTIONS;

export type Section = {
  readonly id: Occasion;
  readonly heading: string;
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
