import { Option, Record } from 'effect';
import type { Takhrij } from './schema';

const VERB: Readonly<Record<string, string>> = { صحيح: 'صحّح', حسن: 'حسّن', ضعيف: 'ضعّف' };
const NUMBERED = /^(.+) ([٠-٩]+(?:\/[٠-٩]+)?)$/u;
const EXCEPT = /^(صحيح|حسن) دون (قوله|زيادة): (.+)$/u;

type Except = { readonly verb: string; readonly what: string; readonly words: string };

function cite(source: string): string {
  const match = NUMBERED.exec(source);
  return match ? `${match[1] ?? ''} (${match[2] ?? ''})` : source;
}

const exceptOf = (ruling: string): Option.Option<Except> =>
  Option.flatMap(
    Option.fromNullishOr(EXCEPT.exec(ruling)),
    ([, kind = '', what = '', words = '']) =>
      Option.map(Record.get(VERB, kind), (verb) => ({ verb, what, words }))
  );

export function takhrijLine({ grader, source, ruling }: Takhrij): string {
  const where = cite(source);
  if (grader !== 'الألباني') return where;

  return Option.match(Record.get(VERB, ruling), {
    onSome: (verb) => `${verb}ه الألباني في ${where}`,
    onNone: () =>
      Option.match(exceptOf(ruling), {
        onSome: ({ verb, what, words }) =>
          source.startsWith('ضعيف')
            ? `${verb} الألباني الحديث دون ${what} «${words}» (${source})`
            : `${verb}ه الألباني في ${where} دون ${what} «${words}»`,
        onNone: () => `قال الألباني في ${where}: ${ruling}`,
      }),
  });
}
