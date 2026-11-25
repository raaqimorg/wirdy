import { excerptAyat } from './excerpt';
import type { Dhikr } from './schema';

const TIME = { sabah: 'في الصباح', masaa: 'في المساء', both: null };
const FOLD = 250;
export const REST = 'وتتمة الآيات في الصفحة';

export function suwarOf(data: Dhikr, text: string): string[][] | null {
  if (!data.quran) return null;
  return text
    .split(/\n\s*\n/)
    .map((surah) =>
      surah
        .split('\n')
        .map((ayah) => ayah.trim())
        .filter(Boolean)
    )
    .filter((surah) => surah.length > 0)
    .map((ayat) => (data.ayat === 'first' ? ayat.slice(0, 1) : ayat));
}

export function foldOf(ayat: string[]): { shown: string[]; rest: string[] } {
  const shown = excerptAyat(ayat, FOLD).ayat;
  return { shown, rest: ayat.slice(shown.length) };
}

function leadWith(cues: (string | null | undefined)[], data: Dhikr, suwar: string[][] | null) {
  const cue = [TIME[data.mode], ...cues].filter(Boolean).join('، ');
  const untilEnd = suwar && suwar.length > 1 ? 'تُقرأ كل سورة إلى آخرها' : 'تُقرأ إلى آخر السورة';
  const whole = data.quran && data.ayat === 'first' ? untilEnd : null;
  return [cue, whole].filter(Boolean).join('. ');
}

export function leadOf(data: Dhikr, suwar: string[][] | null): string {
  return leadWith([data.when], data, suwar);
}

export function fullLeadOf(data: Dhikr, suwar: string[][] | null): string {
  return leadWith([data.when, data.how], data, suwar);
}
