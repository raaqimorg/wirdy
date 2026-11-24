import { timesLabel } from './arabic';

export type Phrase = { text: string; count: number };

export function phrasesOf(text: string, counts: number[]): Phrase[] {
  const parts = text.split('، ');
  if (parts.length !== counts.length) {
    throw new Error(`${counts.length} counts for ${parts.length} phrases: ${text}`);
  }
  return parts.map((part, index) => ({ text: part, count: counts[index]! }));
}

export function phrasesLabel(phrases: Phrase[]): string {
  return phrases.map(({ text, count }) => `${text} ${timesLabel(count)}`).join('، ');
}
