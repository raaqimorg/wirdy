import { Array, Option } from 'effect';
import { rememberersLabel, toArabicDigits } from '../../src/lib/arabic.ts';

export type Window = { readonly from: Date; readonly to: Date };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RIYADH = 3 * HOUR;
const HOURLY_MINUTE = 41 * 60_000;

const riyadhMidnightOf = (time: number) => Math.floor((time + RIYADH) / DAY) * DAY - RIYADH;

export function hourlyWindowsOf(now: Date): { readonly hour: Window; readonly day: Window } {
  const to = Math.floor((now.getTime() - HOURLY_MINUTE) / HOUR) * HOUR;
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
  const given = names
    .split('_')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  return Array.get(given, Math.min(Math.floor(random * given.length), given.length - 1));
}

const escaped = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const bold = (text: string) => `<b>${text}</b>`;

const BLESSING = 'كتب الله أجرك\n\nهنيئا لك هذا الأجر';

export function hourlyText(
  windows: { readonly hour: Window; readonly day: Window },
  hourVisits: number,
  dayVisits: number,
  name: Option.Option<string>
): string {
  const title = Option.match(name, { onNone: () => 'وردي', onSome: escaped });
  const finished = windows.day.to.getTime() - windows.day.from.getTime() === DAY;
  const day = finished ? 'أمس' : 'اليوم';
  const dayCount = hourVisits === 0 ? rememberersLabel(dayVisits) : toArabicDigits(dayVisits);
  return `${bold(title)} 🌻\n\n${bold(rememberersLabel(hourVisits))} في آخر ساعة، و${bold(dayCount)} ${day}\n${BLESSING}`;
}

export function morningText(visits: number, name: Option.Option<string>): string {
  const greeting = Option.match(name, {
    onNone: () => 'صباح الخير',
    onSome: (someone) => `صباح الخير يا ${escaped(someone.replace(/^ال/u, ''))}`,
  });
  return `${bold(greeting)} 🌻\n\n${bold(rememberersLabel(visits))} أمس\n${BLESSING}`;
}

export function isSilent(hourVisits: number, forced: boolean): boolean {
  return forced || hourVisits === 0;
}
