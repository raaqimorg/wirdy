import { createHash } from 'node:crypto';
import { timesLabel } from './arabic';
import { EMBLEMS } from './emblems';
import { excerptAyat, excerptClauses, letters } from './excerpt';
import { fullLeadOf, REST, suwarOf } from './lead';
import { markSvg } from './mark';
import { OCCASIONS } from './occasions';
import { phrasesOf, type Phrase } from './phrases';
import type { Dhikr } from './schema';
import { takhrijLine } from './takhrij';
import { formOf } from './variants';

const TEMPLATE = 3;
const LIMIT = 250;
const EVENING_LIMIT = 90;

export type Card = {
  heading: string;
  color: string;
  title: string;
  context: string | null;
  lead: string;
  quran: boolean;
  blocks: string[][];
  evening: string | null;
  cut: boolean;
  count: string | null;
  phrases?: Phrase[];
  takhrij: string;
};

export function cardOf(data: Dhikr, body: string): Card {
  const text = body.trim();
  const occasion = OCCASIONS.find(({ id }) => id === data.occasion)!;
  const suwar = suwarOf(data, text);
  const morning = suwar ? null : excerptClauses(formOf(text, 'sabah'), LIMIT);
  const evening = text.includes('{{') ? formOf(text, 'masaa') : null;

  let blocks = [[morning?.text ?? '']];
  let cut = morning?.cut ?? false;
  if (suwar) {
    const share = data.ayat === 'fold' ? Math.floor(LIMIT / suwar.length) : LIMIT;
    const excerpts = suwar.map((ayat) => excerptAyat(ayat, share));
    blocks = excerpts.map(({ ayat }) => ayat);
    cut = excerpts.some((excerpt) => excerpt.cut);
  }

  return {
    heading: occasion.heading,
    color: occasion.color,
    title: data.title,
    context: data.context ?? null,
    lead: [fullLeadOf(data, suwar), suwar && cut && REST].filter(Boolean).join('، '),
    quran: data.quran,
    blocks,
    evening:
      evening &&
      excerptClauses(evening, EVENING_LIMIT).text + (letters(evening) > EVENING_LIMIT ? ' …' : ''),
    cut,
    count: data.count > 1 ? timesLabel(data.count) : null,
    ...(data.counts && { phrases: phrasesOf(text, data.counts) }),
    takhrij: takhrijLine(data.takhrij),
  };
}

export function cardFile(card: Card, occasion: Dhikr['occasion'], slug: string): string {
  const print = createHash('sha256')
    .update(JSON.stringify([TEMPLATE, card, EMBLEMS[occasion], markSvg()]))
    .digest('hex')
    .slice(0, 8);
  return `og/${occasion}/${slug}-${print}.png`;
}
