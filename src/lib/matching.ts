const INSIDE_A_WORD = /[\p{M}ـۥۦ]/gu;
const WORD = /[\p{L}\p{M}\p{N}]+/gu;
const BETWEEN_WORDS = /[^\p{L}\p{N}]+/gu;
const SAMAWAT = /سموات/g;
const HONORIFIC = ['صلى', 'الله', 'عليه', 'وسلم'];
const HONORIFICS = /(^| )(?:ﷺ|صلى الله عليه وسلم)(?= |$)/g;
const LONE_WAW = /(^| )و (?=\S)/g;

export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replaceAll(INSIDE_A_WORD, '')
    .replaceAll('ٱ', 'ا')
    .replaceAll(BETWEEN_WORDS, ' ')
    .trim()
    .replaceAll(LONE_WAW, '$1و')
    .replaceAll(SAMAWAT, 'سماوات')
    .replaceAll(HONORIFICS, '')
    .trim();
}

export function phrasesIn(text: string): string[] {
  return text
    .split(/[،.\n]/)
    .map(normalize)
    .filter((phrase) => phrase !== '');
}

type Word = { word: string; from: number; to: number };

function wordsIn(text: string): Word[] {
  const found: Word[] = [];
  for (const { 0: match, index } of text.matchAll(WORD)) {
    const word = normalize(match);
    const to = index + match.length;
    const last = found.at(-1);
    if (last?.word === 'و' && word !== '') {
      found[found.length - 1] = { word: `و${word}`, from: last.from, to };
    } else if (word !== '') {
      found.push({ word, from: index, to });
    }
    if (HONORIFIC.every((part, at) => found.at(at - HONORIFIC.length)?.word === part)) {
      found.length -= HONORIFIC.length;
    }
  }
  return found;
}

export function spanOf(text: string, words: string): string | undefined {
  const wanted = normalize(words).split(' ');
  const found = wordsIn(text);

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
