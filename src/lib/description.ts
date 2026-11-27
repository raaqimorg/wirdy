import { Array, Option } from 'effect';
import type { Card } from './card';
import { excerptAyat, excerptClauses, excerptWords, letters } from './excerpt';
import { phrasesLabel } from './phrases';
import type { Tibb } from './schema';
import { takhrijLine } from './takhrij';

const LENGTH = 200;
const WORDS = 110;
const STEP = 10;
const LIMITS = Array.makeBy(WORDS / STEP, (index) => WORDS - index * STEP);
const PAUSE = /\s+[ۖ-ۜ]$/u;

const closed = (text: string) =>
  text + '»'.repeat(Math.max(0, text.split('«').length - text.split('»').length));

const quoted = (text: string, cut: boolean) =>
  `«${closed(`${text.trim().replace(/[،.:؛]+$/u, '')}${cut ? '…' : ''}`)}»`;

const clauses = (text: string, cut: boolean, limit: number) => {
  const byClause = excerptClauses(text.trim(), limit);
  const excerpt =
    letters(byClause.text) > limit
      ? excerptWords(byClause.text, limit)
      : { text: byClause.text, cut: false };
  return quoted(excerpt.text, cut || byClause.cut || excerpt.cut);
};

const ayatOf = (block: Array.NonEmptyReadonlyArray<string>, limit: number) => {
  const excerpt = excerptAyat(block, limit);
  const [first] = excerpt.ayat;
  if (excerpt.ayat.length > 1 || letters(first) <= limit) {
    return { text: excerpt.ayat.join(' '), cut: excerpt.cut };
  }
  const words = excerptWords(first, limit);
  return { text: words.text.replace(PAUSE, ''), cut: excerpt.cut || words.cut };
};

const wordsOf = (card: Card, limit: number): Option.Option<string> => {
  if (card.phrases !== undefined) return Option.none();
  return Option.map(
    Option.filter(Array.head(card.blocks), Array.isReadonlyArrayNonEmpty),
    (block) => {
      if (!card.quran) return clauses(block.join(' '), card.cut, limit);
      const excerpt = ayatOf(block, limit);
      return quoted(excerpt.text, card.cut || excerpt.cut || card.blocks.length > 1);
    }
  );
};

const countOf = (card: Card, limit: number): string | null => {
  if (card.phrases === undefined) return card.count;
  const excerpt = excerptClauses(phrasesLabel(card.phrases), limit);
  return excerpt.cut ? `${excerpt.text}…` : excerpt.text;
};

const unstopped = (text: string) => text.trim().replace(/[.،:؛]+$/u, '');

const sentences = (parts: ReadonlyArray<string | null | undefined>) =>
  parts
    .filter((part): part is string => part !== undefined && part !== null && part !== '')
    .map((part) => unstopped(part))
    .filter((part) => part !== '')
    .join('. ')
    .replaceAll('…. ', '… ');

const shortest = (write: (limit: number) => string) => {
  const tries = LIMITS.map((limit) => write(limit));
  return tries.find((text) => text.length <= LENGTH) ?? tries.at(-1) ?? write(WORDS);
};

export function descriptionOf(card: Card, fadl?: string): string {
  return shortest((limit) =>
    sentences([
      card.lead,
      Option.getOrUndefined(wordsOf(card, limit)),
      countOf(card, limit),
      fadl,
      card.takhrij,
    ])
  );
}

export function hadithDescriptionOf(data: Tibb, body: string): string {
  return shortest((limit) =>
    sentences([clauses(body, false, limit), `عن ${data.rawi}`, takhrijLine(data.takhrij)])
  );
}
