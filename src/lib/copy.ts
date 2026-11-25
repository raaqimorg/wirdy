import { timesLabel } from './arabic';
import { leadOf, suwarOf } from './lead';
import { phrasesOf } from './phrases';
import type { Dhikr } from './schema';
import { takhrijLine } from './takhrij';
import { formOf } from './variants';

export type Copy = { sabah: string; masaa: string | null };

function wordsOf(data: Dhikr, text: string, form: 'sabah' | 'masaa'): string {
  const suwar = suwarOf(data, text);
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
  const lead = [count, leadOf(data, suwarOf(data, text))].filter(Boolean).join('، ');
  const source = [lead, takhrijLine(data.takhrij)].filter(Boolean).join('\n');
  const whole = (form: 'sabah' | 'masaa') => `${wordsOf(data, text, form)}\n\n${source}`;
  return { sabah: whole('sabah'), masaa: text.includes('{{') ? whole('masaa') : null };
}
