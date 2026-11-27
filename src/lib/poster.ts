import { Array, Effect, Option } from 'effect';
import { createHash } from 'node:crypto';
import { adhkarLabel, formLabel, hadithLabel, timesLabel } from './arabic';
import { EMBLEMS, type EmblemName } from './emblems';
import { foldOf } from './lead';
import { markSvg } from './mark';
import { OCCASIONS, sectionOf, type Occasion } from './occasions';
import { PALETTE } from './palette';
import { phrasesOf, type Phrase, type PhraseCountMismatch } from './phrases';
import type { Dhikr, Tibb } from './schema';
import { SITE, TIBB } from './site';
import { takhrijLine } from './takhrij';
import { eveningTitle } from './title';
import { formOf, type Form, type MalformedMarker } from './variants';

export const POSTER_TEMPLATE = 2;

export type FormatName = 'story' | 'portrait' | 'square' | 'landscape' | 'print';

export type Format = {
  readonly name: FormatName;
  readonly ratio: string;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly use: string;
};

export const FORMATS: ReadonlyArray<Format> = [
  {
    name: 'story',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    title: 'حالة',
    use: 'للقصص والحالات وخلفية الجوال',
  },
  {
    name: 'portrait',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    title: 'منشور',
    use: 'لمنشورات الصور',
  },
  {
    name: 'square',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    title: 'مربع',
    use: 'للمحادثات وأي مكان',
  },
  {
    name: 'landscape',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    title: 'شاشة',
    use: 'لشاشات المساجد والعروض',
  },
  { name: 'print', ratio: 'A4', width: 1240, height: 1754, title: 'للطباعة', use: 'ورقة A4' },
];

export type PosterItem = {
  readonly number: number;
  readonly title: string;
  readonly group: string;
  readonly choice: string;
  readonly lead: string;
  readonly times: string;
  readonly suwar: ReadonlyArray<ReadonlyArray<string>>;
  readonly rest: string;
  readonly phrases: ReadonlyArray<Phrase>;
  readonly words: string;
  readonly source: string;
};

export type Poster = {
  readonly slug: string;
  readonly emblem: EmblemName;
  readonly form: Form | undefined;
  readonly heading: string;
  readonly summary: string;
  readonly promise: string;
  readonly color: string;
  readonly path: string;
  readonly items: ReadonlyArray<PosterItem>;
};

type Entry<T> = { readonly data: T; readonly body?: string | undefined };

const LONG = 3000;
const TIMED: Occasion = 'sabah-masaa';
const QURAN_SOURCE = '. النص: tanzil.net';

const HEADINGS: Readonly<Record<Form, string>> = {
  sabah: 'أذكار الصباح',
  masaa: 'أذكار المساء',
};

const suwarOf = (text: string): ReadonlyArray<ReadonlyArray<string>> =>
  text
    .split(/\n\s*\n/u)
    .map((surah) =>
      surah
        .split('\n')
        .map((ayah) => ayah.trim())
        .filter((ayah) => ayah !== '')
    )
    .filter((ayat) => ayat.length > 0);

const quranOf = (data: Dhikr, text: string, path: string) => {
  const whole = suwarOf(text);
  if (data.ayat !== 'fold' || text.length <= LONG) return { suwar: whole, rest: '' };
  return {
    suwar: whole.map((ayat) => (Array.isReadonlyArrayNonEmpty(ayat) ? foldOf(ayat).shown : ayat)),
    rest: `${SITE.domain}${path}`,
  };
};

const itemOf = (
  { data, body = '' }: Entry<Dhikr>,
  form: Form,
  index: number,
  path: string
): Effect.Effect<PosterItem, MalformedMarker | PhraseCountMismatch> =>
  Effect.gen(function* () {
    const text = body.trim();
    const title =
      form === 'masaa'
        ? Option.getOrElse(yield* eveningTitle(data.title, text), () => data.title)
        : data.title;
    const words = data.quran ? '' : yield* formOf(text, form);
    return {
      number: index + 1,
      title,
      group: data.group ?? '',
      choice: data.form === undefined ? '' : formLabel(data.form),
      lead: [data.when, data.how].filter((part) => part !== undefined).join('. '),
      times: data.count > 1 ? timesLabel(data.count) : '',
      ...(data.quran ? quranOf(data, text, path) : { suwar: [], rest: '' }),
      phrases: data.counts === undefined ? [] : yield* phrasesOf(words, data.counts),
      words,
      source: `${takhrijLine(data.takhrij)}${data.quran ? QURAN_SOURCE : ''}`,
    };
  });

export const adhkarPosterOf = (
  occasion: Occasion,
  entries: ReadonlyArray<Entry<Dhikr>>,
  form: Form
): Effect.Effect<Poster, MalformedMarker | PhraseCountMismatch> =>
  Effect.gen(function* () {
    const path = `/${occasion}/`;
    const chosen = entries
      .filter(
        ({ data }) => data.occasion === occasion && (data.mode === 'both' || data.mode === form)
      )
      .toSorted((one, other) => one.data.order - other.data.order);
    const items = yield* Effect.forEach(chosen, (entry, index) => itemOf(entry, form, index, path));
    const { title, color } = sectionOf(occasion);
    const timed = occasion === TIMED;
    const slug = timed ? form : occasion;
    return {
      slug,
      emblem: occasion,
      form: timed ? form : undefined,
      heading: timed ? HEADINGS[form] : title,
      summary: `${adhkarLabel(items.length)} مما صح عن النبي ﷺ، ومع كل مصدره`,
      promise: `${SITE.promise.before} ﷺ، ومع كل درجته ومصدره`,
      color,
      path,
      items,
    };
  });

export const occasionPostersOf = (
  occasion: Occasion,
  entries: ReadonlyArray<Entry<Dhikr>>
): Effect.Effect<ReadonlyArray<Poster>, MalformedMarker | PhraseCountMismatch> =>
  Effect.forEach(
    occasion === TIMED ? (['sabah', 'masaa'] as const) : (['sabah'] as const),
    (form) => adhkarPosterOf(occasion, entries, form)
  );

export const tibbPosterOf = (entries: ReadonlyArray<Entry<Tibb>>): Poster => {
  const items = entries
    .toSorted((one, other) => one.data.order - other.data.order)
    .map(({ data, body = '' }, index) => ({
      number: index + 1,
      title: data.title,
      group: data.group,
      choice: '',
      lead: `عن ${data.rawi}`,
      times: '',
      suwar: [],
      rest: '',
      phrases: [],
      words: body.trim(),
      source: takhrijLine(data.takhrij),
    }));
  return {
    slug: TIBB.path.replaceAll('/', ''),
    emblem: 'tibb',
    form: undefined,
    heading: TIBB.title,
    summary: `${hadithLabel(items.length)} مما صح عن النبي ﷺ، ومع كل مصدره`,
    promise: 'لا حديث هنا إلا ما صح عن النبي ﷺ، ومع كل درجته ومصدره',
    color: TIBB.color,
    path: TIBB.path,
    items,
  };
};

export const postersOf = (
  adhkar: ReadonlyArray<Entry<Dhikr>>,
  tibb: ReadonlyArray<Entry<Tibb>>
): Effect.Effect<ReadonlyArray<Poster>, MalformedMarker | PhraseCountMismatch> =>
  Effect.map(
    Effect.forEach(OCCASIONS, ({ id }) => occasionPostersOf(id, adhkar)),
    (posters) => [...posters.flat(), tibbPosterOf(tibb)]
  );

export type ThemeName = 'light' | 'dark';

export const THEME_TITLES: Readonly<Record<ThemeName, string>> = { light: 'فاتح', dark: 'داكن' };

export const themesOf = (format: Format): ReadonlyArray<ThemeName> =>
  format.name === 'print' ? ['light'] : ['light', 'dark'];

export function posterFile(poster: Poster, format: Format, theme: ThemeName): string {
  const print = createHash('sha256')
    .update(
      JSON.stringify([
        POSTER_TEMPLATE,
        poster,
        format.name,
        format.width,
        format.height,
        theme,
        EMBLEMS[poster.emblem],
        markSvg(),
        PALETTE,
      ])
    )
    .digest('hex')
    .slice(0, 8);
  return `posters/${poster.slug}/${format.name}-${theme}-${print}.png`;
}

export const posterDownload = (poster: Poster, format: Format, theme: ThemeName): string =>
  `wirdy-${poster.slug}-${format.name}${theme === 'dark' ? '-dark' : ''}.png`;
