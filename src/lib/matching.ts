const INSIDE_A_WORD = /[\p{M}ـۥۦ]/gu;
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
