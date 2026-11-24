import { createHash } from 'node:crypto';
import { timesLabel } from './arabic';
import { EMBLEMS } from './emblems';
import { excerptAyat, excerptClauses, letters } from './excerpt';
import { leadOf, suwarOf } from './lead';
import { OCCASIONS } from './occasions';
import type { Dhikr } from './schema';
import { takhrijLine } from './takhrij';
import { parseVariants } from './variants';

const TEMPLATE = 1;
const LIMIT = 250;
const EVENING_LIMIT = 90;
const REST = 'وتتمة الآيات في الصفحة';

export type Card = {
  heading: string;
  color: string;
  title: string;
  lead: string;
  quran: boolean;
  blocks: string[][];
  evening: string | null;
  cut: boolean;
  count: string | null;
  takhrij: string;
};

function formOf(text: string, form: 'sabah' | 'masaa'): string {
  return parseVariants(text)
    .map((segment) => (segment.type === 'text' ? segment.value : segment[form]))
    .join('');
}

export function cardOf(data: Dhikr, body: string): Card {
  const text = body.trim();
  const occasion = OCCASIONS.find(({ id }) => id === data.occasion)!;
  const suwar = suwarOf(data, text);
  const morning = suwar ? null : excerptClauses(formOf(text, 'sabah'), LIMIT);
  const evening = text.includes('{{') ? formOf(text, 'masaa') : null;

  let blocks = [[morning?.text ?? '']];
  let cut = morning?.cut ?? false;
  if (suwar) {
    const excerpts = suwar.map((ayat) => excerptAyat(ayat, LIMIT));
    blocks = excerpts.map(({ ayat }) => ayat);
    cut = excerpts.some((excerpt) => excerpt.cut);
  }

  return {
    heading: occasion.heading,
    color: occasion.color,
    title: data.title,
    lead: [leadOf(data, suwar), suwar && cut && REST].filter(Boolean).join('، '),
    quran: data.quran,
    blocks,
    evening:
      evening &&
      excerptClauses(evening, EVENING_LIMIT).text + (letters(evening) > EVENING_LIMIT ? ' …' : ''),
    cut,
    count: data.count > 1 ? timesLabel(data.count) : null,
    takhrij: takhrijLine(data.takhrij),
  };
}

export function cardFile(card: Card, occasion: Dhikr['occasion'], slug: string): string {
  const print = createHash('sha256')
    .update(JSON.stringify([TEMPLATE, card, EMBLEMS[occasion]]))
    .digest('hex')
    .slice(0, 8);
  return `og/${occasion}/${slug}-${print}.png`;
}
