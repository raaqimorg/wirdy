import { Array, Data, Effect, Option } from 'effect';

export type Form = 'sabah' | 'masaa';

export type Segment =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'variant'; readonly sabah: string; readonly masaa: string };

export class MalformedMarker extends Data.TaggedError('MalformedMarker')<{
  readonly message: string;
}> {}

const MARKER = /\{\{([^{}|]*)\|([^{}|]*)\}\}/gu;
const STRAY = /\{\{|\}\}|\|/u;

const textSegment = (value: string, whole: string) =>
  Option.match(Option.fromNullishOr(STRAY.exec(value)), {
    onNone: () => Effect.succeed(value === '' ? [] : [{ type: 'text' as const, value }]),
    onSome: ([stray]) =>
      Effect.fail(
        new MalformedMarker({
          message: `Malformed variant marker: unexpected "${stray}" in ${JSON.stringify(whole)}`,
        })
      ),
  });

export const parseVariants = (
  input: string
): Effect.Effect<ReadonlyArray<Segment>, MalformedMarker> =>
  Effect.gen(function* () {
    const segments: Segment[] = [];
    let last = 0;
    for (const match of input.matchAll(MARKER)) {
      segments.push(...(yield* textSegment(input.slice(last, match.index), input)), {
        type: 'variant',
        sabah: match[1] ?? '',
        masaa: match[2] ?? '',
      });
      last = match.index + match[0].length;
    }
    segments.push(...(yield* textSegment(input.slice(last), input)));
    return segments;
  });

export const formOf = (input: string, form: Form): Effect.Effect<string, MalformedMarker> =>
  Effect.map(parseVariants(input), (segments) =>
    segments.map((segment) => (segment.type === 'text' ? segment.value : segment[form])).join('')
  );

export const textFormsOf = (input: string): Effect.Effect<ReadonlyArray<string>, MalformedMarker> =>
  Effect.map(Effect.all([formOf(input, 'sabah'), formOf(input, 'masaa')]), Array.dedupe);

export const hasVariants = (input: string): boolean => input.includes('{{');
