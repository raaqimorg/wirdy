export type Segment =
  | { type: 'text'; value: string }
  | { type: 'variant'; sabah: string; masaa: string };

const MARKER = /\{\{([^{}|]*)\|([^{}|]*)\}\}/g;

export function parseVariants(input: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;

  for (const match of input.matchAll(MARKER)) {
    const before = input.slice(last, match.index);
    assertClean(before, input);
    if (before) segments.push({ type: 'text', value: before });
    segments.push({ type: 'variant', sabah: match[1]!, masaa: match[2]! });
    last = match.index + match[0].length;
  }

  const tail = input.slice(last);
  assertClean(tail, input);
  if (tail) segments.push({ type: 'text', value: tail });

  return segments;
}

export function formOf(input: string, form: 'sabah' | 'masaa'): string {
  return parseVariants(input)
    .map((segment) => (segment.type === 'text' ? segment.value : segment[form]))
    .join('');
}

export type Word = { word: string; alt?: string };

export function pairWords(now: string, other: string): Word[] {
  const mine = now.split(' ');
  const theirs = other.split(' ');
  if (mine.length !== theirs.length) return [{ word: now, alt: other }];
  return mine.map((word, index) => {
    const alt = theirs[index]!;
    return alt === word ? { word } : { word, alt };
  });
}

function assertClean(text: string, whole: string): void {
  const stray = text.match(/\{\{|\}\}|\|/);
  if (stray) {
    throw new Error(
      `Malformed variant marker: unexpected "${stray[0]}" in ${JSON.stringify(whole)}`
    );
  }
}
