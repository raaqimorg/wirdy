import type { Dhikr } from './schema';

const TIME = { sabah: 'في الصباح', masaa: 'في المساء', both: null };

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

export function leadOf(data: Dhikr, suwar: string[][] | null): string {
  const cue = [TIME[data.mode], data.when].filter(Boolean).join('، ');
  const untilEnd = suwar && suwar.length > 1 ? 'تُقرأ كل سورة إلى آخرها' : 'تُقرأ إلى آخر السورة';
  const whole = data.quran && data.ayat === 'first' ? untilEnd : null;
  return [cue, whole].filter(Boolean).join('. ');
}
