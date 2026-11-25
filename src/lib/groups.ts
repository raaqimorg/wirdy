export type Run<T> = { group?: string; items: T[] };
export type Form<T> = { form?: number; items: T[] };

function runsBy<T, K>(entries: T[], keyOf: (entry: T) => K): { key: K; items: T[] }[] {
  const runs: { key: K; items: T[] }[] = [];
  for (const entry of entries) {
    const key = keyOf(entry);
    const last = runs.at(-1);
    if (last && last.key === key) {
      last.items.push(entry);
    } else {
      runs.push({ key, items: [entry] });
    }
  }
  return runs;
}

export function runsByGroup<T extends { data: { group?: string } }>(entries: T[]): Run<T>[] {
  return runsBy(entries, ({ data }) => data.group).map(({ key, items }) => ({ group: key, items }));
}

export function formsOf<T extends { data: { form?: number } }>(entries: T[]): Form<T>[] {
  return runsBy(entries, ({ data }) => data.form).map(({ key, items }) => ({ form: key, items }));
}

export const GROUP_SLUGS: Record<string, string> = {
  القراءة: 'al-qiraah',
  'أصبحنا وأمسينا': 'asbahna-wa-amsayna',
  'الاستغفار والدعاء': 'al-istighfar-wa-al-dua',
  الحفظ: 'al-hifz',
  'التهليل والتسبيح': 'al-tahlil-wa-al-tasbih',
  الأذان: 'al-adhan',
  الوضوء: 'al-wudu',
  المسجد: 'al-masjid',
  'دخول الصف': 'dukhul-al-saff',
  الاستفتاح: 'al-istiftah',
  الركوع: 'al-ruku',
  'الركوع والسجود': 'al-ruku-wa-al-sujud',
  'الرفع من الركوع': 'al-raf-min-al-ruku',
  السجود: 'al-sujud',
  'سجود التلاوة': 'sujud-al-tilawah',
  'بين السجدتين': 'bayn-al-sajdatayn',
  التشهد: 'al-tashahhud',
  'الذكر والدعاء في الصلاة': 'al-dhikr-wa-al-dua-fi-al-salah',
  'ما يعرض في الصلاة': 'ma-yarid-fi-al-salah',
  'قيام الليل والوتر': 'qiyam-al-layl-wa-al-witr',
  'بعد السلام': 'bad-al-salam',
  'صيغ التسبيح': 'siyagh-al-tasbih',
  'أدعية أدبار الصلوات': 'adiyat-adbar-al-salawat',
  'بعد صلوات بعينها': 'bad-salawat-bi-ayniha',
  'عند الفراش': 'ind-al-firash',
  'الحمد والتسبيح': 'al-hamd-wa-al-tasbih',
  'آخر ما يقال': 'akhir-ma-yuqal',
  'عند الاستيقاظ': 'ind-al-istiqaz',
  'ما يعرض في الليل': 'ma-yarid-fi-al-layl',
  التسبيح: 'al-tasbih',
  التهليل: 'al-tahlil',
  'التحميد والتكبير والحوقلة': 'al-tahmid-wa-al-takbir-wa-al-hawqalah',
  الاستغفار: 'al-istighfar',
  'الصلاة على النبي ﷺ': 'al-salah-ala-al-nabi',
  'الرضا والدعاء': 'al-rida-wa-al-dua',
  الخلاء: 'al-khala',
  اللباس: 'al-libas',
  'الخروج من البيت': 'al-khuruj-min-al-bayt',
  الركوب: 'al-rukub',
  السوق: 'al-suq',
  الطعام: 'al-taam',
  'الإفطار من الصيام': 'al-iftar-min-al-siyam',
  العطاس: 'al-utas',
  'مع الناس': 'maa-al-nas',
  الاستخارة: 'al-istikharah',
  'الأهل والأولاد': 'al-ahl-wa-al-awlad',
  'البيت ليلًا': 'al-bayt-laylan',
  السفر: 'al-safar',
  'الهلال والريح والمطر': 'al-hilal-wa-al-rih-wa-al-matar',
  'ما يحب وما يكره': 'ma-yuhibb-wa-ma-yakrah',
  'الكرب والهم والدين': 'al-karb-wa-al-hamm-wa-al-dayn',
  'الغضب والخوف': 'al-ghadab-wa-al-khawf',
  'المرض والمصيبة': 'al-marad-wa-al-musibah',
  المقابر: 'al-maqabir',
  عوارض: 'awarid',
};

export function groupId(group: string): string {
  if (!Object.hasOwn(GROUP_SLUGS, group)) {
    throw new Error(
      `No slug for the group «${group}». Add one to GROUP_SLUGS in src/lib/groups.ts.`
    );
  }
  return GROUP_SLUGS[group]!;
}
