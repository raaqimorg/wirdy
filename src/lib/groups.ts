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
  'أدعية بعد الصلاة': 'adiyat-adbar-al-salawat',
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
