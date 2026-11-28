import { Effect, Option } from 'effect';
import { fold } from './search';
import { formOf, hasVariants, type Form, type MalformedMarker } from './variants';

const TASHKEEL = /[\u064B-\u0652\u0670]/gu;

const lettersOf = (text: string): string =>
  fold(text)
    .out.replaceAll(/[^\p{L}\s]/gu, '')
    .replaceAll(/\s+/gu, ' ')
    .trim();

const COUNT_TAIL = /\s+(مئة مرة|مائة مرة|عشرًا|عشرا|عشر مرات)$/u;

export const isOpening = (title: string, text: string): boolean => {
  const name = lettersOf(title.replace(COUNT_TAIL, ''));
  const opening = lettersOf(text)
    .split(' ')
    .slice(0, name.split(' ').length + 2)
    .join(' ');
  return opening.includes(name);
};

export function fullTitle({
  title,
  context,
}: {
  readonly title: string;
  readonly context?: string;
}): string {
  return context === undefined ? title : `${title} (${context})`;
}

export function contextIn(
  { context }: { readonly context?: string | undefined },
  heading: string
): string | undefined {
  return context?.includes(heading) === true ? undefined : context;
}

export function titleIn(
  data: { readonly title: string; readonly context?: string | undefined },
  heading: string
): string {
  return fullTitle({ title: data.title, ...optional(contextIn(data, heading)) });
}

const optional = (context: string | undefined) => (context === undefined ? {} : { context });

const openingOf = (
  text: string,
  form: Form,
  length: number
): Effect.Effect<string, MalformedMarker> =>
  Effect.map(formOf(text, form), (words) =>
    words.replaceAll(TASHKEEL, '').split(' ').slice(0, length).join(' ').replace(/،$/u, '')
  );

export const eveningTitle = (
  title: string,
  body: string
): Effect.Effect<Option.Option<string>, MalformedMarker> =>
  Effect.gen(function* () {
    const text = body.trim();
    if (!hasVariants(text)) return Option.none();
    const { length } = title.split(' ');
    const morning = yield* openingOf(text, 'sabah', length);
    const evening = yield* openingOf(text, 'masaa', length);
    return morning === title ? Option.some(evening) : Option.none();
  });
