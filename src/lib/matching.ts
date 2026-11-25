import { Array, Option } from 'effect';

const INSIDE_A_WORD = /[\p{M}ـۥۦ]/gu;
const WORD = /[\p{L}\p{M}]+/gu;
const BETWEEN_WORDS = /[^\p{L}]+/gu;
const SHAY = /ش(?:ئ|ىء)(?= |$)/gu;
const SAMAWAT = /سموات/gu;
const HONORIFIC = ['صلى', 'الله', 'عليه', 'وسلم'] as const;
const HONORIFICS = /(^| )(?:ﷺ|صلى الله عليه وسلم)(?= |$)/gu;
const LONE_WAW = /(^| )و (?=\S)/gu;

export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replaceAll(INSIDE_A_WORD, '')
    .replaceAll('ٱ', 'ا')
    .replaceAll(BETWEEN_WORDS, ' ')
    .trim()
    .replaceAll(LONE_WAW, '$1و')
    .replaceAll(SAMAWAT, 'سماوات')
    .replaceAll(SHAY, 'شيء')
    .replaceAll(HONORIFICS, '')
    .trim();
}

export function phrasesIn(text: string): ReadonlyArray<string> {
  return text
    .split(/[،.\n]/u)
    .map((phrase) => normalize(phrase))
    .filter((phrase) => phrase !== '');
}

type Word = { readonly word: string; readonly from: number; readonly to: number };

const endsWithHonorific = (found: ReadonlyArray<Word>): boolean =>
  HONORIFIC.every((part, at) =>
    Option.exists(
      Array.get(found, found.length - HONORIFIC.length + at),
      ({ word }) => word === part
    )
  );

function wordsIn(text: string): ReadonlyArray<Word> {
  const found: Word[] = [];
  for (const { 0: match, index } of text.matchAll(WORD)) {
    const word = normalize(match);
    const to = index + match.length;
    const waw = Option.filter(Array.last(found), (previous) => previous.word === 'و');
    if (Option.isSome(waw) && word !== '') {
      found.splice(-1, 1, { word: `و${word}`, from: waw.value.from, to });
    } else if (word !== '') {
      found.push({ word, from: index, to });
    }
    if (found.length >= HONORIFIC.length && endsWithHonorific(found)) {
      found.length -= HONORIFIC.length;
    }
  }
  return found;
}

export function spanOf(text: string, words: string): Option.Option<string> {
  const wanted = normalize(words).split(' ');
  const found = wordsIn(text);

  return Option.flatMap(
    Array.findFirstIndex(found, (_, at) =>
      wanted.every((word, offset) =>
        Option.exists(Array.get(found, at + offset), (other) => other.word === word)
      )
    ),
    (start) =>
      Option.zipWith(
        Array.get(found, start),
        Array.get(found, start + wanted.length - 1),
        (first, last) => text.slice(first.from, last.to)
      )
  );
}

export function spansOf(text: string, words: string): ReadonlyArray<string> {
  return Option.match(spanOf(text, words), {
    onSome: (whole) => [whole],
    onNone: () => Array.getSomes(Array.map(phrasesIn(words), (phrase) => spanOf(text, phrase))),
  });
}

export function missingPhrases(text: string, spans: ReadonlyArray<string>): ReadonlyArray<string> {
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
