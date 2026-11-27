import { Array, Effect, Option } from 'effect';
import { timesLabel } from './arabic';
import { foldOf, leadOf, REST, suwarOf, type Suwar } from './lead';
import { phrasesOf, type PhraseCountMismatch } from './phrases';
import type { Dhikr, Hadith } from './schema';
import { takhrijLine } from './takhrij';
import { formOf, hasVariants, type Form, type MalformedMarker } from './variants';

export type Copy = { readonly sabah: string; readonly masaa: Option.Option<string> };

const nonEmpty = (text: string): Option.Option<string> =>
  text === '' ? Option.none() : Option.some(text);

function shownOf(data: Dhikr, suwar: Suwar): Suwar {
  return data.ayat === 'fold' ? Array.map(suwar, (ayat) => foldOf(ayat).shown) : suwar;
}

const wordsOf = (
  data: Dhikr,
  text: string,
  form: Form
): Effect.Effect<string, MalformedMarker | PhraseCountMismatch> =>
  Option.match(suwarOf(data, text), {
    onSome: (suwar) =>
      Effect.succeed(
        shownOf(data, suwar)
          .map((ayat) => ayat.join('\n'))
          .join('\n\n')
      ),
    onNone: () =>
      data.counts === undefined
        ? formOf(text, form)
        : Effect.map(phrasesOf(text, data.counts), (phrases) =>
            phrases.map((phrase) => `${phrase.text} (${timesLabel(phrase.count)})`).join('\n')
          ),
  });

export const hadithCopyOf = (data: Hadith, body: string): Copy => ({
  sabah: `${body.trim()}\n\nعن ${data.rawi}\n${takhrijLine(data.takhrij)}`,
  masaa: Option.none(),
});

export const copyOf = (
  data: Dhikr,
  body: string
): Effect.Effect<Copy, MalformedMarker | PhraseCountMismatch> =>
  Effect.gen(function* () {
    const text = body.trim();
    const count = data.count > 1 ? Option.some(timesLabel(data.count)) : Option.none();
    const suwar = suwarOf(data, text);
    const folded =
      data.ayat === 'fold' &&
      Option.exists(suwar, (all) => all.some((ayat) => foldOf(ayat).rest.length > 0));
    const lead = Array.getSomes([count, nonEmpty(leadOf(data, suwar))]).join('، ');
    const source = Array.getSomes([
      nonEmpty(lead),
      folded ? Option.some(REST) : Option.none(),
      Option.some(takhrijLine(data.takhrij)),
    ]).join('\n');
    const whole = (form: Form) =>
      Effect.map(wordsOf(data, text, form), (words) => `${words}\n\n${source}`);
    return {
      sabah: yield* whole('sabah'),
      masaa: hasVariants(text) ? Option.some(yield* whole('masaa')) : Option.none(),
    };
  });
