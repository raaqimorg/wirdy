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

const present = (value: string | undefined): Option.Option<string> =>
  Option.filter(Option.fromUndefinedOr(value), (text) => text !== '');

function leadWith(
  cues: ReadonlyArray<string | undefined>,
  data: Dhikr,
  suwar: Option.Option<Suwar>
): string {
  const cue = Array.getSomes([TIME[data.mode], ...Array.map(cues, present)]).join('، ');
  const many = Option.exists(suwar, (all) => all.length > 1);
  const untilEnd = many ? 'تقرأ كل سورة إلى آخرها' : 'تقرأ إلى آخر السورة';
  const whole = data.quran && data.ayat === 'first' ? Option.some(untilEnd) : Option.none();
  return Array.getSomes([present(cue), whole]).join('. ');
}

export function leadOf(data: Dhikr, suwar: Option.Option<Suwar>): string {
  return leadWith([data.when], data, suwar);
}

export function fullLeadOf(data: Dhikr, suwar: Option.Option<Suwar>): string {
  return leadWith([data.when, data.how], data, suwar);
}
