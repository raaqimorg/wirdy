import { Array, Option } from 'effect';
import type { Card } from './card';
import { excerptAyat, excerptClauses, excerptWords, letters } from './excerpt';
import { phrasesLabel } from './phrases';
import type { Tibb } from './schema';
import { takhrijLine } from './takhrij';

const WORDS = 110;

const closed = (text: string) =>
  text + '»'.repeat(Math.max(0, text.split('«').length - text.split('»').length));

const quoted = (text: string, cut: boolean) =>
  `«${closed(`${text.trim().replace(/[،.:؛]+$/u, '')}${cut ? '…' : ''}`)}»`;

const clauses = (text: string, cut: boolean) => {
  const byClause = excerptClauses(text.trim(), WORDS);
  const excerpt =
    letters(byClause.text) > WORDS
      ? excerptWords(byClause.text, WORDS)
      : { text: byClause.text, cut: false };
  return quoted(excerpt.text, cut || byClause.cut || excerpt.cut);
};

const wordsOf = (card: Card): Option.Option<string> => {
  if (card.phrases !== undefined) return Option.none();
  return Option.map(
    Option.filter(Array.head(card.blocks), Array.isReadonlyArrayNonEmpty),
    (block) => {
      if (!card.quran) return clauses(block.join(' '), card.cut);
      const excerpt = excerptAyat(block, WORDS);
      return quoted(excerpt.ayat.join(' '), card.cut || excerpt.cut || card.blocks.length > 1);
    }
  );
};

const unstopped = (text: string) => text.trim().replace(/[.،:؛]+$/u, '');

const sentences = (parts: ReadonlyArray<string | null | undefined>) =>
  parts
    .filter((part): part is string => part !== undefined && part !== null && part !== '')
    .map((part) => unstopped(part))
    .filter((part) => part !== '')
    .join('. ');

export function descriptionOf(card: Card, fadl?: string): string {
  const count = card.phrases === undefined ? card.count : phrasesLabel(card.phrases);
  return sentences([card.lead, Option.getOrUndefined(wordsOf(card)), count, fadl, card.takhrij]);
}

export function hadithDescriptionOf(data: Tibb, body: string): string {
  return sentences([clauses(body, false), `عن ${data.rawi}`, takhrijLine(data.takhrij)]);
}
