import { Array, Option } from 'effect';
import { rememberersLabel, toArabicDigits } from '../../src/lib/arabic.ts';
import { OCCASION_IDS, sectionOf } from '../../src/lib/occasions.ts';
import { GUIDE_IDS, GUIDES } from '../../src/lib/site.ts';

export type Window = { readonly from: Date; readonly to: Date };

export type Windows = {
  readonly hour: Window;
  readonly day: Window;
  readonly hourBefore: Window;
  readonly dayBefore: Window;
};

export type Totals = {
  readonly hour: number;
  readonly day: number;
  readonly hourBefore: number;
  readonly dayBefore: number;
  readonly hourFromX: number;
};

export type Tally = { readonly key: string; readonly count: number };

export const SOURCE_IDS = [
  'X',
  'Instagram',
  'Snapchat',
  'TikTok',
  'Facebook',
  'Threads',
  'Google',
  'LinkedIn',
  'Telegram',
  'Pinterest',
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export type SourceTally = { readonly id: SourceId; readonly count: number };

export type Details = {
  readonly countries: ReadonlyArray<Tally>;
  readonly pages: ReadonlyArray<Tally>;
  readonly sources: ReadonlyArray<SourceTally>;
  readonly posters: number;
  readonly missing: ReadonlyArray<Tally>;
  readonly failures: number;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RIYADH = 3 * HOUR;

const riyadhMidnightOf = (time: number) => Math.floor((time + RIYADH) / DAY) * DAY - RIYADH;

const spanOf = (from: number, to: number): Window => ({ from: new Date(from), to: new Date(to) });

export function windowsOf(now: Date): Windows {
  const to = Math.floor(now.getTime() / HOUR) * HOUR;
  const from = to - HOUR;
  const dayFrom = riyadhMidnightOf(from);
  return {
    hour: spanOf(from, to),
    day: spanOf(dayFrom, to),
    hourBefore: spanOf(from - DAY, to - DAY),
    dayBefore: spanOf(dayFrom - DAY, dayFrom),
  };
}

export function isFinished(windows: Windows): boolean {
  return windows.day.to.getTime() - windows.day.from.getTime() === DAY;
}

export function nameOf(names: string, random: number): Option.Option<string> {
  const given = names
    .split('_')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  return Array.get(given, Math.min(Math.floor(random * given.length), given.length - 1));
}

export function toCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

const escaped = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const bold = (text: string) => `<b>${text}</b>`;

const isFew = (n: number) => n % 100 >= 3 && n % 100 <= 10;

export function timesAccusativeLabel(n: number): string {
  if (n === 1) return 'مرة واحدة';
  if (n === 2) return 'مرتين';
  return `${toArabicDigits(n)} ${isFew(n) ? 'مرات' : 'مرة'}`;
}

const COUNTRY_NAMES: Readonly<Record<string, string>> = {
  SA: 'السعودية',
  AE: 'الإمارات',
  US: 'أمريكا',
  GB: 'بريطانيا',
  HK: 'هونغ كونغ',
  MO: 'ماكاو',
  PS: 'فلسطين',
  MM: 'ميانمار',
  CD: 'الكونغو الديمقراطية',
  CG: 'الكونغو',
  CF: 'أفريقيا الوسطى',
  DO: 'الدومينيكان',
};

const REGIONS = new Intl.DisplayNames(['ar'], { type: 'region', fallback: 'none' });

const isCountryCode = (code: string) =>
  /^[A-Z]{2}$/u.test(code) && !/^(?:AA|Q[M-Z]|X[A-Z]|ZZ)$/u.test(code);

export function countryLabel(code: string): Option.Option<string> {
  const known = Option.fromUndefinedOr(COUNTRY_NAMES[code]);
  return isCountryCode(code)
    ? Option.orElse(known, () => Option.fromUndefinedOr(REGIONS.of(code)))
    : known;
}

const SOURCE_NAMES: Readonly<Record<SourceId, string>> = {
  X: 'إكس',
  Instagram: 'إنستغرام',
  Snapchat: 'سناب شات',
  TikTok: 'تيك توك',
  Facebook: 'فيسبوك',
  Threads: 'ثريدز',
  Google: 'تطبيق جوجل',
  LinkedIn: 'لينكد إن',
  Telegram: 'تيليجرام',
  Pinterest: 'بنترست',
};

const PAGE_NAMES: ReadonlyMap<string, string> = new Map([
  ...OCCASION_IDS.map((id): [string, string] => [id, sectionOf(id).heading]),
  ...GUIDE_IDS.map((id): [string, string] => [
    GUIDES[id].path.replaceAll('/', ''),
    GUIDES[id].heading,
  ]),
]);

export function pageLabel(path: string): Option.Option<string> {
  if (!path.startsWith('/')) return Option.none();
  const parts = path.split('/').filter((part) => part !== '');
  if (parts.length === 0) return Option.some('الرئيسية');
  if (parts.length > 2) return Option.none();
  return Option.flatMap(Array.head(parts), (part) => Option.fromUndefinedOr(PAGE_NAMES.get(part)));
}

const topOf = (
  tallies: ReadonlyArray<Tally>,
  label: (key: string) => Option.Option<string>,
  limit: number
): ReadonlyArray<Tally> => {
  const named = Array.getSomes(
    tallies.map((tally) =>
      Option.map(
        Option.filter(label(tally.key), () => tally.count > 0),
        (name): Tally => ({ key: name, count: tally.count })
      )
    )
  );
  const sums = new Map<string, number>();
  for (const tally of named) sums.set(tally.key, (sums.get(tally.key) ?? 0) + tally.count);
  return [...sums]
    .map(([key, count]): Tally => ({ key, count }))
    .toSorted((one, other) => other.count - one.count)
    .slice(0, limit);
};

const withOthers = (shown: ReadonlyArray<Tally>, total: number, others: string) => {
  const rest = total - shown.reduce((sum, tally) => sum + tally.count, 0);
  return rest > 0 ? [...shown, { key: others, count: rest }] : shown;
};

const listLine = (mark: string, shown: ReadonlyArray<Tally>, total: number, others: string) =>
  shown.length === 0
    ? Option.none()
    : Option.some(
        `${mark} ${withOthers(shown, total, others)
          .map((tally) => `${escaped(tally.key)} ${toArabicDigits(tally.count)}`)
          .join('، ')}`
      );

const arrowOf = (now: number, before: number) => {
  if (now > before) return '↑ ';
  if (now < before) return '↓ ';
  return '';
};

const comparisonLine = (now: number, before: number, when: string) =>
  now === 0 && before === 0
    ? Option.none()
    : Option.some(`${arrowOf(now, before)}${when}: ${rememberersLabel(before)}`);

export function sourceLine(visits: number, fromX: number): Option.Option<string> {
  if (visits === 0 || fromX * 2 <= visits) return Option.none();
  if (fromX < visits) return Option.some('أغلبهم من إكس');
  if (visits === 1) return Option.some('جاء من إكس');
  if (visits === 2) return Option.some('كلاهما من إكس');
  return Option.some('كلهم من إكس');
}

const TOP = 3;

const sourcesOf = (details: Details): ReadonlyArray<Tally> =>
  details.sources.map((source): Tally => ({ key: SOURCE_NAMES[source.id], count: source.count }));

const summaryLines = (details: Details, day: number) =>
  Array.getSomes([
    listLine('🌍', topOf(details.countries, countryLabel, TOP), day, 'بلدان أخرى'),
    listLine('🚪', topOf(details.pages, pageLabel, TOP), day, 'صفحات أخرى'),
    listLine('🔗', topOf(sourcesOf(details), Option.some, SOURCE_IDS.length), day, 'مصادر أخرى'),
    details.posters > 0
      ? Option.some(`🖼 فتح الملصق ${timesAccusativeLabel(details.posters)}`)
      : Option.none(),
  ]);

const BLESSING = 'كتب الله أجرك\n\nهنيئا لك هذا الأجر';

export function reportText(
  windows: Windows,
  totals: Totals,
  details: Option.Option<Details>,
  name: Option.Option<string>
): string {
  const title = Option.match(name, { onNone: () => 'وردي', onSome: escaped });
  const finished = isFinished(windows);
  const day = finished ? 'أمس' : 'اليوم';
  const dayCount = totals.hour === 0 ? rememberersLabel(totals.day) : toArabicDigits(totals.day);
  const counts = `${bold(rememberersLabel(totals.hour))} في آخر ساعة، و${bold(dayCount)} ${day}`;
  const notes = finished
    ? Array.getSomes([comparisonLine(totals.day, totals.dayBefore, 'أول أمس')])
    : Array.getSomes([
        comparisonLine(totals.hour, totals.hourBefore, 'أمس في مثل هذه الساعة'),
        sourceLine(totals.hour, totals.hourFromX),
      ]);
  const summary = finished
    ? Option.match(details, {
        onNone: () => [],
        onSome: (given) => summaryLines(given, totals.day),
      })
    : [];
  const blocks = [
    `${bold(title)} 🌻`,
    [counts, ...notes].join('\n'),
    ...(summary.length === 0 ? [] : [summary.join('\n')]),
  ];
  return `${blocks.join('\n\n')}\n${BLESSING}`;
}

const MISSING_LIMIT = 3;
const PATH_LENGTH = 60;

const shortPath = (path: string) =>
  path.length > PATH_LENGTH ? `${path.slice(0, PATH_LENGTH)}…` : path;

const missingHeading = (n: number) => {
  if (n === 1) return 'لم يجد الزوار أمس هذا الرابط:';
  if (n === 2) return 'لم يجد الزوار أمس هذين الرابطين:';
  return 'لم يجد الزوار أمس هذه الروابط:';
};

export function alertText(details: Details): Option.Option<string> {
  const missing = details.missing.filter((tally) => tally.count >= MISSING_LIMIT);
  const lines = [
    ...(missing.length === 0
      ? []
      : [
          missingHeading(missing.length),
          ...missing.map(
            (tally) =>
              `• ${timesAccusativeLabel(tally.count)}: <code>${escaped(shortPath(tally.key))}</code>`
          ),
        ]),
    ...(details.failures === 0
      ? []
      : [
          `${missing.length === 0 ? 'أجاب الموقع أمس' : 'وأجاب الموقع'} بخطأ ${timesAccusativeLabel(details.failures)}`,
        ]),
  ];
  return lines.length === 0
    ? Option.none()
    : Option.some(`${bold('وردي')} 🔧\n\n${lines.join('\n')}`);
}

export function isSilent(hourVisits: number, forced: boolean): boolean {
  return forced || hourVisits === 0;
}
