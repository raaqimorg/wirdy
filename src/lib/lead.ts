import { Array, Option } from 'effect';
import { excerptAyat, type Ayat } from './excerpt';
import type { Dhikr, Mode } from './schema';

export type Suwar = ReadonlyArray<Ayat>;

const TIME: Readonly<Record<Mode, Option.Option<string>>> = {
  sabah: Option.some('في الصباح'),
  masaa: Option.some('في المساء'),
  both: Option.none(),
};
const FOLD = 250;
export const REST = 'وتتمة الآيات في الصفحة';

const ayatOf = (surah: string): ReadonlyArray<string> =>
  surah
    .split('\n')
    .map((ayah) => ayah.trim())
    .filter((ayah) => ayah !== '');

export function suwarOf(data: Dhikr, text: string): Option.Option<Suwar> {
  if (!data.quran) return Option.none();
  return Option.some(
    Array.getSomes(
      Array.map(text.split(/\n\s*\n/u), (surah) =>
        Option.map(Option.liftPredicate(ayatOf(surah), Array.isReadonlyArrayNonEmpty), (ayat) =>
          data.ayat === 'first' ? Array.of(Array.headNonEmpty(ayat)) : ayat
        )
      )
    )
  );
}

export function foldOf(ayat: Ayat): { readonly shown: Ayat; readonly rest: ReadonlyArray<string> } {
  const shown = excerptAyat(ayat, FOLD).ayat;
  return { shown, rest: ayat.slice(shown.length) };
}

export const timeOf = (mode: Mode): string | undefined => Option.getOrUndefined(TIME[mode]);

const present = (value: string | undefined): Option.Option<string> =>
  Option.filter(Option.fromUndefinedOr(value), (text) => text !== '');

const untilEndOf = (data: Dhikr, suwar: Option.Option<Suwar>): Option.Option<string> => {
  if (!data.quran || data.ayat !== 'first') return Option.none();
  const many = Option.exists(suwar, (all) => all.length > 1);
  return Option.some(many ? 'تقرأ كل سورة إلى آخرها' : 'تقرأ إلى آخر السورة');
};

const cueOf = (cues: ReadonlyArray<string | undefined>, data: Dhikr): string =>
  Array.getSomes([TIME[data.mode], ...Array.map(cues, present)]).join('، ');

export function momentOf(data: Dhikr): string {
  return cueOf([data.when], data);
}

export function mannerOf(data: Dhikr, suwar: Option.Option<Suwar>): string {
  return Array.getSomes([present(data.how), untilEndOf(data, suwar)]).join('. ');
}

export function leadOf(data: Dhikr, suwar: Option.Option<Suwar>): string {
  return Array.getSomes([present(momentOf(data)), untilEndOf(data, suwar)]).join('. ');
}

export function fullLeadOf(data: Dhikr, suwar: Option.Option<Suwar>): string {
  return Array.getSomes([
    present(cueOf([data.when, data.how], data)),
    untilEndOf(data, suwar),
  ]).join('. ');
}
