import { Array, Option } from 'effect';
import { toArabicDigits, visitsUnit } from '../../src/lib/arabic.ts';

export type Window = { readonly from: Date; readonly to: Date };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RIYADH = 3 * HOUR;

const riyadhMidnightOf = (time: number) => Math.floor((time + RIYADH) / DAY) * DAY - RIYADH;

export function hourlyWindowsOf(now: Date): { readonly hour: Window; readonly day: Window } {
  const to = Math.floor(now.getTime() / HOUR) * HOUR;
  const from = to - HOUR;
  return {
    hour: { from: new Date(from), to: new Date(to) },
    day: { from: new Date(riyadhMidnightOf(from)), to: new Date(to) },
  };
}

export function yesterdayOf(now: Date): Window {
  const today = riyadhMidnightOf(now.getTime());
  return { from: new Date(today - DAY), to: new Date(today) };
}

export function nameOf(names: string, random: number): Option.Option<string> {
  const given = names.split(/\s+/u).filter((name) => name !== '');
  return Array.get(given, Math.min(Math.floor(random * given.length), given.length - 1));
}

const escaped = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const bold = (visits: number) => `<b>${toArabicDigits(visits)}</b>`;

export function hourlyText(
  windows: { readonly hour: Window; readonly day: Window },
  hourVisits: number,
  dayVisits: number,
  name: Option.Option<string>
): string {
  const title = Option.match(name, { onNone: () => 'وِردي', onSome: escaped });
  const finished = windows.day.to.getTime() - windows.day.from.getTime() === DAY;
  const day = finished ? 'أمس' : 'اليوم';
  return `<b>${title}</b> 🌻\nآخر ساعة ${bold(hourVisits)} · ${day} ${bold(dayVisits)}\nكتب الله أجرك`;
}

export function morningText(visits: number, name: Option.Option<string>): string {
  const greeting = Option.match(name, {
    onNone: () => 'صباح الخير',
    onSome: (someone) => `صباح الخير يا ${escaped(someone)}`,
  });
  return `<b>${greeting}</b> 🌻\nأمس ${bold(visits)} ${visitsUnit(visits)}\nكتب الله أجرك، قرأتِ أذكارك؟`;
}

export function isSilent(hourVisits: number, forced: boolean): boolean {
  return forced || hourVisits === 0;
}
