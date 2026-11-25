import { Data, Effect, Option, Record, Schema } from 'effect';
import type { Present } from './proof';
import { STRICT } from './schema';

export const captureSchema = Schema.Struct({
  site: Schema.Literals(['dorar', 'shamela', 'hdith', 'sunnah', 'tanzil']),
  url: Schema.String,
  capturedAt: Schema.String,
  title: Schema.String,
  text: Schema.String,
});

export type Capture = typeof captureSchema.Type;

export const decodeCaptures = Schema.decodeUnknownEffect(
  Schema.Union([captureSchema, Schema.Array(captureSchema)]),
  STRICT
);

export class CaptureError extends Data.TaggedError('CaptureError')<{ readonly message: string }> {}

const RULING_LABEL = 'خلاصة حكم المحدث';

const COLLECTIONS: Readonly<Record<string, string>> = {
  bukhari: 'صحيح البخاري',
  muslim: 'صحيح مسلم',
  abudawud: 'سنن أبي داود',
  tirmidhi: 'جامع الترمذي',
  nasai: 'سنن النسائي',
  ibnmajah: 'سنن ابن ماجه',
  adab: 'الأدب المفرد',
};

const NAMED_COLLECTIONS: Readonly<Record<string, string>> = {
  'Sahih Ibn Hibban': 'صحيح ابن حبان',
  'Sahih Ibn Khuzayma': 'صحيح ابن خزيمة',
  "Sunan an-Nasa'i al-Kubra": 'السنن الكبرى للنسائي',
  'Mustadrak al-Hakim': 'المستدرك على الصحيحين',
  'Musannaf Ibn Abi Shayba': 'مصنف ابن أبي شيبة',
  'As-Sunan al-Kubra li al-Bayhaqi': 'السنن الكبرى للبيهقي',
  'Sunan ad-Darimi': 'سنن الدارمي',
};

const FIRST = /(\d+) \d+(?: \([^)]*\))? (?:- )?\p{L}/u;
const SECOND = /\d+ (\d+)(?: \([^)]*\))? (?:- )?\p{L}/u;
const USUAL: Readonly<Record<string, RegExp>> = {
  'صحيح مسلم': FIRST,
  'سنن أبي داود': FIRST,
  'المستدرك على الصحيحين': /(\d+) - \p{L}/u,
  'سنن النسائي': /(\d+) \d+ \/ \d+ (?:- )?\p{L}/u,
};

const find = (text: string, pattern: RegExp, label: string): Effect.Effect<string, CaptureError> =>
  Option.match(
    Option.filter(Option.fromNullishOr(pattern.exec(text)?.[1]?.trim()), (value) => value !== ''),
    {
      onSome: Effect.succeed,
      onNone: () => Effect.fail(new CaptureError({ message: `no ${label} in the captured page` })),
    }
  );

const group = (text: string, pattern: RegExp, at: number): Option.Option<string> =>
  Option.fromNullishOr(pattern.exec(text)?.[at]);

function base({ site, url, capturedAt }: Capture) {
  return { state: 'present' as const, site, url, date: capturedAt };
}

const fromDorar = (capture: Capture): Effect.Effect<Present, CaptureError> =>
  Effect.gen(function* () {
    const ruling = yield* find(
      capture.text,
      /خلاصة حكم المحدث\s*:\s*([\s\S]*?)\s*الراوي\s*:/u,
      RULING_LABEL
    );
    return {
      ...base(capture),
      book: yield* find(capture.text, /المصدر\s*:\s*([\s\S]*?)\s*الصفحة أو الرقم/u, 'المصدر'),
      number: yield* find(capture.text, /الصفحة أو الرقم\s*:\s*(\S+)/u, 'الصفحة أو الرقم'),
      grader: yield* find(capture.text, /\|\s*المحدث\s*:\s*([\s\S]*?)\s*\|/u, 'المحدث'),
      ruling: ruling.replace(/^\[([\s\S]*)\]$/u, '$1').trim(),
      text: capture.text.slice(0, capture.text.indexOf(RULING_LABEL)),
    };
  });

const fromShamela = (
  capture: Capture,
  number: Option.Option<string>
): Effect.Effect<Present, CaptureError> =>
  Effect.gen(function* () {
    const { title, text } = capture;
    const name = yield* find(title, / كتاب (.+?) - /u, 'book');
    const edition = /^(.+?) ((?:ط|ت) .+)$/u;
    return {
      ...base(capture),
      book: Option.getOrElse(group(name, edition, 1), () => name),
      edition: Option.getOrElse(group(name, edition, 2), () => 'بلا طبعة مذكورة'),
      volume: Option.getOrElse(group(title, /^ج(\S+) - /u, 1), () => 'بلا جزء'),
      page: yield* find(title, /(?:^| )ص(\S+) - /u, 'page'),
      number: Option.isSome(number)
        ? number.value
        : latin(yield* find(text, /^\s*([٠-٩]+)\s*-/u, 'number')),
      text,
    };
  });

const fromSunnah = (capture: Capture): Effect.Effect<Present, CaptureError> => {
  const named = capture.url.includes('sunnah.com/urn/');
  const titled = / » (.+) » Hadith (\w+)$/u;
  const placed = /sunnah\.com\/([a-z]+):(\w+)$/u;
  const book = named
    ? Option.flatMap(group(capture.title, titled, 1), (name) => Record.get(NAMED_COLLECTIONS, name))
    : Option.flatMap(group(capture.url, placed, 1), (name) => Record.get(COLLECTIONS, name));
  const number = named ? group(capture.title, titled, 2) : group(capture.url, placed, 2);
  return Option.match(Option.all({ book, number }), {
    onSome: ({ book: found, number: at }) =>
      Effect.succeed({ ...base(capture), book: found, number: at, text: capture.text }),
    onNone: () =>
      Effect.fail(new CaptureError({ message: `no primary collection at ${capture.url}` })),
  });
};

const fromHdith = (capture: Capture): Effect.Effect<Present, CaptureError> =>
  Effect.gen(function* () {
    const book = yield* find(capture.title, /\| ([^|(]+?) \(\d+\)$/u, 'book');
    const usual = Option.getOrElse(Record.get(USUAL, book), () => SECOND);
    return {
      ...base(capture),
      book,
      number: yield* find(capture.text, usual, 'number'),
      text: capture.text,
    };
  });

const fromTanzil = (capture: Capture): Effect.Effect<Present, CaptureError> =>
  Effect.map(
    find(capture.title, /^(\d+:\d+(?:-\d+:\d+)?(?:, \d+:\d+(?:-\d+:\d+)?)*)$/u, 'ayat'),
    (number) => ({ ...base(capture), book: 'القرآن الكريم', number, text: capture.text })
  );

function latin(text: string): string {
  return text.replaceAll(/[٠-٩]/gu, (digit) => String((digit.codePointAt(0) ?? 0x0660) - 0x0660));
}

export const captureOfMarkdown = (
  markdown: string,
  date: string
): Effect.Effect<Capture, CaptureError> =>
  Effect.gen(function* () {
    return {
      site: 'hdith' as const,
      url: yield* find(markdown, /^canonical: '(.+)'$/mu, 'canonical'),
      capturedAt: date,
      title: yield* find(markdown, /^title: '(.+)'$/mu, 'title'),
      text: yield* find(markdown, /^## نص الحديث\n\n> (.+)$/mu, 'نص الحديث'),
    };
  });

export const sourceOf = (
  capture: Capture,
  number: Option.Option<string> = Option.none()
): Effect.Effect<Present, CaptureError> => {
  switch (capture.site) {
    case 'dorar':
      return fromDorar(capture);
    case 'shamela':
      return fromShamela(capture, number);
    case 'sunnah':
      return fromSunnah(capture);
    case 'tanzil':
      return fromTanzil(capture);
    case 'hdith':
      return fromHdith(capture);
  }
};
