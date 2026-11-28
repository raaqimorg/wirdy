import { Array, Data, Effect, Option, Record } from 'effect';
import type { FORMS } from './schema';

type FormNumber = (typeof FORMS)[number];

export type Run<T> = {
  readonly group: Option.Option<string>;
  readonly items: Array.NonEmptyReadonlyArray<T>;
};
export type Form<T> = { readonly form: FormNumber; readonly items: Array.NonEmptyReadonlyArray<T> };

export class UnknownGroup extends Data.TaggedError('UnknownGroup')<{ readonly message: string }> {}

export class MissingForm extends Data.TaggedError('MissingForm')<{ readonly message: string }> {}

function runsBy<T, K>(
  entries: ReadonlyArray<T>,
  keyOf: (entry: T) => K
): ReadonlyArray<{ readonly key: K; readonly items: Array.NonEmptyReadonlyArray<T> }> {
  if (!Array.isReadonlyArrayNonEmpty(entries)) return [];
  return Array.map(
    Array.groupWith(entries, (one, other) => keyOf(one) === keyOf(other)),
    (items) => ({ key: keyOf(Array.headNonEmpty(items)), items })
  );
}

export function runsByGroup<T extends { readonly data: { readonly group?: string } }>(
  entries: ReadonlyArray<T>
): ReadonlyArray<Run<T>> {
  return Array.map(
    runsBy(entries, ({ data }) => data.group),
    ({ key, items }) => ({ group: Option.fromUndefinedOr(key), items })
  );
}

export const formsOf = <T extends { readonly data: { readonly form?: FormNumber } }>(
  entries: ReadonlyArray<T>
): Effect.Effect<ReadonlyArray<Form<T>>, MissingForm> =>
  Effect.forEach(
    runsBy(entries, ({ data }) => data.form),
    ({ key, items }) =>
      key === undefined
        ? Effect.fail(new MissingForm({ message: 'A dhikr among choices has no form.' }))
        : Effect.succeed({ form: key, items })
  );

export const GROUP_SLUGS: Readonly<Record<string, string>> = {
  القرآن: 'al-qiraah',
  'أصبحنا وأمسينا': 'asbahna-wa-amsayna',
  'الاستغفار والدعاء': 'al-istighfar-wa-al-dua',
  الحفظ: 'al-hifz',
  'التهليل والتسبيح': 'al-tahlil-wa-al-tasbih',
  الأذان: 'al-adhan',
  الوضوء: 'al-wudu',
  المسجد: 'al-masjid',
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
  'أدعية بعد الصلاة': 'adiyat-adbar-al-salawat',
  'بعد صلوات بعينها': 'bad-salawat-bi-ayniha',
  'عند الفراش': 'ind-al-firash',
  'الحمد والتسبيح': 'al-hamd-wa-al-tasbih',
  'آخر ما يقال': 'akhir-ma-yuqal',
  'أول اليقظة': 'ind-al-istiqaz',
  'ما يعرض في الليل': 'ma-yarid-fi-al-layl',
  التسبيح: 'al-tasbih',
  التهليل: 'al-tahlil',
  'التحميد والتكبير والحوقلة': 'al-tahmid-wa-al-takbir-wa-al-hawqalah',
  الاستغفار: 'al-istighfar',
  'الصلاة على النبي ﷺ': 'al-salah-ala-al-nabi',
  'الرضا والدعاء': 'al-rida-wa-al-dua',
  'جوامع السؤال': 'jawami-al-sual',
  'جوامع الاستعاذة': 'jawami-al-istiadhah',
  'الهلال والصيام': 'al-hilal-wa-al-siyam',
  الأضحية: 'al-udhiyah',
  'الحج والعمرة': 'al-hajj-wa-al-umrah',
  'قبل الطعام': 'qabla-al-akl',
  'البركة في الطعام': 'al-barakah-fi-al-taam',
  'بعد الطعام': 'bada-al-akl',
  'الضيف والمضيف': 'al-dayf-wa-al-mudif',
  اللباس: 'al-libas',
  'البيت ليلا': 'al-bayt-laylan',
  الخلاء: 'al-khala',
  'الزواج والأولاد': 'al-zawaj-wa-al-awlad',
  'الخروج والسوق': 'al-khuruj-wa-al-suq',
  الركوب: 'al-rukub',
  'وداع المسافر': 'wada-al-musafir',
  'في السفر والرجوع': 'fi-al-safar-wa-al-ruju',
  السلام: 'al-salam-wa-al-radd',
  'المعروف والمودة': 'al-maruf-wa-al-mawaddah',
  'المجلس واللسان': 'al-majlis-wa-al-lisan',
  العطاس: 'al-utas',
  'ما يسر وما يكره': 'ma-yasurr-wa-ma-yakrah',
  'الهم والكرب والدين': 'al-hamm-wa-al-karb-wa-al-dayn',
  الغضب: 'inda-al-ghadab',
  'الخوف والعدو': 'al-khawf-wa-al-aduww',
  'الوسوسة والطيرة': 'al-waswasah-wa-al-tiyarah',
  الاستخارة: 'al-istikharah',
  'إذا مرض أو تألم': 'idha-marida',
  'عيادة المريض والمبتلى': 'iyadat-al-marid-wa-al-mubtala',
  'الاحتضار والموت': 'al-ihtidar-wa-al-mawt',
  'المصيبة والتعزية': 'al-musibah-wa-al-taziyah',
  'صلاة الجنازة': 'salat-al-janazah',
  'الدفن والقبور': 'al-dafn-wa-al-qubur',
  'الريح والسحاب': 'al-rih-wa-al-sahab',
  المطر: 'nuzul-al-matar',
  الاستسقاء: 'al-istisqa',
  'أصوات الحيوان': 'aswat-al-hayawan',
  الرقية: 'al-ruqyah',
  'الحمى وأجر المريض': 'al-humma-wa-ajr-al-marid',
  'مبادئ التداوي': 'mabadi-al-tadawi',
  'العسل والحبة السوداء': 'al-asal-wa-al-habbah-al-sawda',
  'التمر وماء زمزم': 'al-tamr-wa-ma-zamzam',
  'أدوية وأغذية أخرى': 'adwiyah-wa-aghdhiyah-ukhra',
  الحجامة: 'al-hijamah',
  العافية: 'al-afiyah-wa-al-sihhah',
  'الطعام والشراب': 'al-taam-wa-al-sharab',
  'العدوى والأوبئة': 'al-adwa-wa-al-awbiah',
  'فضل يوم الجمعة': 'fadl-yawm-al-jumuah',
  'حكم الجمعة': 'hukm-al-jumuah',
  'ليلتها وفجرها': 'laylatuha-wa-fajruha',
  'الغسل والطيب': 'al-ghusl-wa-al-tib',
  'ثياب الجمعة': 'thiyab-al-jumuah',
  'التبكير إليها': 'al-tabkir',
  'في المسجد': 'fi-al-masjid',
  الخطبة: 'al-khutbah',
  الإنصات: 'al-insat',
  'صلاة الجمعة': 'salat-al-jumuah',
  'بعد صلاة الجمعة': 'bad-salat-al-jumuah',
  'في سائر يومها': 'fi-sair-yawmiha',
  'ساعة الإجابة': 'saat-al-ijabah',
};

export const groupId = (group: string): Effect.Effect<string, UnknownGroup> =>
  Option.match(Record.get(GROUP_SLUGS, group), {
    onSome: Effect.succeed,
    onNone: () =>
      Effect.fail(
        new UnknownGroup({
          message: `No slug for the group «${group}». Add one to GROUP_SLUGS in src/lib/groups.ts.`,
        })
      ),
  });
