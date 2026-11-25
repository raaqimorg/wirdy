import { Array, Data, Effect } from 'effect';
import { timesLabel } from './arabic';

export type Phrase = { readonly text: string; readonly count: number };

export class PhraseCountMismatch extends Data.TaggedError('PhraseCountMismatch')<{
  readonly message: string;
}> {}

export const phrasesOf = (
  text: string,
  counts: ReadonlyArray<number>
): Effect.Effect<ReadonlyArray<Phrase>, PhraseCountMismatch> => {
  const parts = text.split('، ');
  return parts.length === counts.length
    ? Effect.succeed(
        Array.map(Array.zip(parts, counts), ([part, count]) => ({ text: part, count }))
      )
    : Effect.fail(
        new PhraseCountMismatch({
          message: `${String(counts.length)} counts for ${String(parts.length)} phrases: ${text}`,
        })
      );
};

export function phrasesLabel(phrases: ReadonlyArray<Phrase>): string {
  return phrases.map(({ text, count }) => `${text} ${timesLabel(count)}`).join('، ');
}
