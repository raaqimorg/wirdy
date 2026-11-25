const INSIDE_A_WORD = /[\p{M}ـۥۦ]/gu;
const WORD = /[\p{L}\p{M}\p{N}]+/gu;
const BETWEEN_WORDS = /[^\p{L}\p{N}]+/gu;

export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replaceAll(INSIDE_A_WORD, '')
    .replaceAll('ٱ', 'ا')
    .replaceAll(BETWEEN_WORDS, ' ')
    .trim();
}

export function phrasesIn(text: string): string[] {
  return text
    .split(/[،.\n]/)
    .map(normalize)
    .filter((phrase) => phrase !== '');
}

export function spanOf(text: string, words: string): string | undefined {
  const wanted = normalize(words).split(' ');
  const found = [...text.matchAll(WORD)]
    .map(({ 0: word, index }) => ({ word: normalize(word), from: index, to: index + word.length }))
    .filter(({ word }) => word !== '');

  const start = found.findIndex((_, at) =>
    wanted.every((word, offset) => found[at + offset]?.word === word)
  );
  if (start === -1) return undefined;
  return text.slice(found[start]!.from, found[start + wanted.length - 1]!.to);
}

export function spansOf(text: string, words: string): string[] {
  const whole = spanOf(text, words);
  if (whole !== undefined) return [whole];
  return phrasesIn(words).flatMap((phrase) => spanOf(text, phrase) ?? []);
}

export function missingPhrases(text: string, spans: string[]): string[] {
  const haystack = spans.map((span) => ` ${normalize(span)} `).join('\n');
  const missing: string[] = [];
  let from = 0;

  for (const phrase of phrasesIn(text)) {
    const at = haystack.indexOf(` ${phrase} `, from);
    if (at === -1) missing.push(phrase);
    else from = at + phrase.length + 1;
  }

  return missing;
}
