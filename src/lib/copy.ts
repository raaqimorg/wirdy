import { timesLabel } from './arabic';
import { foldOf, leadOf, REST, suwarOf } from './lead';
import { phrasesOf } from './phrases';
import type { Dhikr } from './schema';
import { takhrijLine } from './takhrij';
import { formOf } from './variants';

export type Copy = { sabah: string; masaa: string | null };

function shownOf(data: Dhikr, text: string): string[][] | null {
  const suwar = suwarOf(data, text);
  if (!suwar || data.ayat !== 'fold') return suwar;
  return suwar.map((ayat) => foldOf(ayat).shown);
}

function wordsOf(data: Dhikr, text: string, form: 'sabah' | 'masaa'): string {
  const suwar = shownOf(data, text);
  if (suwar) return suwar.map((ayat) => ayat.join('\n')).join('\n\n');
  if (data.counts) {
    return phrasesOf(text, data.counts)
      .map((phrase) => `${phrase.text} (${timesLabel(phrase.count)})`)
      .join('\n');
  }
  return formOf(text, form);
}

export function copyOf(data: Dhikr, body: string): Copy {
  const text = body.trim();
  const count = data.count > 1 ? timesLabel(data.count) : null;
  const suwar = suwarOf(data, text);
  const folded = data.ayat === 'fold' && (suwar ?? []).some((ayat) => foldOf(ayat).rest.length > 0);
  const lead = [count, leadOf(data, suwar)].filter(Boolean).join('، ');
  const source = [lead, folded && REST, takhrijLine(data.takhrij)].filter(Boolean).join('\n');
  const whole = (form: 'sabah' | 'masaa') => `${wordsOf(data, text, form)}\n\n${source}`;
  return { sabah: whole('sabah'), masaa: text.includes('{{') ? whole('masaa') : null };
}
