import { Array, Option } from 'effect';
import { toArabicDigits, visitsLabel } from '../../src/lib/arabic.ts';
import { OCCASION_IDS, sectionOf } from '../../src/lib/occasions.ts';
import { TIBB } from '../../src/lib/site.ts';

export type Window = { readonly from: Date; readonly to: Date };

export type PathVisits = { readonly path: string; readonly visits: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RIYADH = 3 * HOUR;
const DAYS = 28;

const riyadhMidnightOf = (time: number) => Math.floor((time + RIYADH) / DAY) * DAY - RIYADH;

export function hourlyWindowsOf(now: Date): { readonly hour: Window; readonly day: Window } {
  const to = Math.floor(now.getTime() / HOUR) * HOUR;
  const from = to - HOUR;
  return {
    hour: { from: new Date(from), to: new Date(to) },
    day: { from: new Date(riyadhMidnightOf(from)), to: new Date(to) },
  };
}

export function morningWindowsOf(now: Date): ReadonlyArray<Window> {
  const today = riyadhMidnightOf(now.getTime());
  return Array.makeBy(DAYS, (index) => ({
    from: new Date(today - (index + 1) * DAY),
    to: new Date(today - index * DAY),
  }));
}

const SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ...OCCASION_IDS.map((id) => [id, sectionOf(id).title] as const),
  [TIBB.path.replaceAll('/', ''), TIBB.title],
];

export function occasionOf(path: string): Option.Option<string> {
  const segment = path.split('/').find((part) => part !== '');
  return Option.map(
    Array.findFirst(SECTIONS, ([id]) => id === segment),
    ([, title]) => title
  );
}

export function topOccasionOf(rows: ReadonlyArray<PathVisits>): Option.Option<string> {
  const totals = SECTIONS.map(([, title]) => ({
    title,
    visits: rows
      .filter((row) => Option.getOrNull(occasionOf(row.path)) === title)
      .reduce((sum, row) => sum + row.visits, 0),
  }));
  const top = totals.reduce((best, next) => (next.visits > best.visits ? next : best), {
    title: '',
    visits: 0,
  });
  return top.visits > 0 ? Option.some(top.title) : Option.none();
}

const hourLabel = (visits: number) =>
  visits === 0 ? visitsLabel(0) : `+${toArabicDigits(visits)}`;

export function hourlyText(
  windows: { readonly hour: Window; readonly day: Window },
  hourVisits: number,
  dayVisits: number
): string {
  const finished = windows.day.to.getTime() - windows.day.from.getTime() === DAY;
  return finished
    ? `مجموع أمس: ${visitsLabel(dayVisits)}\nالساعة الأخيرة منه: ${hourLabel(hourVisits)}`
    : `اليوم حتى الآن: ${visitsLabel(dayVisits)}\nالساعة الماضية: ${hourLabel(hourVisits)}`;
}

const changeLabel = (yesterday: number, before: number): Option.Option<string> => {
  if (before === 0) return Option.none();
  const change = Math.round(((yesterday - before) / before) * 100);
  if (change === 0) return Option.some('مثل اليوم الذي قبله');
  const arrow = change > 0 ? '↑' : '↓';
  return Option.some(`${arrow} ${toArabicDigits(Math.abs(change))}٪ عن اليوم الذي قبله`);
};

export function morningText(days: ReadonlyArray<number>, top: Option.Option<string>): string {
  const [yesterday = 0, ...earlier] = days;
  const before = Option.flatMap(Array.head(earlier), (visits) => changeLabel(yesterday, visits));
  const best = yesterday > 0 && earlier.every((visits) => yesterday > visits);
  return [
    Option.some(`حصاد أمس: ${visitsLabel(yesterday)}`),
    before,
    Option.map(top, (title) => `أكثرها: ${title}`),
    best ? Option.some('أفضل يوم في آخر ٤ أسابيع') : Option.none(),
  ]
    .flatMap((line) => Option.toArray(line))
    .join('\n');
}

export function isSilent(hourVisits: number, forced: boolean): boolean {
  return forced || hourVisits === 0;
}
