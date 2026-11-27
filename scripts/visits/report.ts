import { Array, Option } from 'effect';
import { rememberersLabel, toArabicDigits } from '../../src/lib/arabic.ts';

export type Window = { readonly from: Date; readonly to: Date };

const HOUR = 3_600_000;
const HALF_HOUR = HOUR / 2;
const DAY = 24 * HOUR;
const RIYADH = 3 * HOUR;

const riyadhMidnightOf = (time: number) => Math.floor((time + RIYADH) / DAY) * DAY - RIYADH;

export function windowsOf(now: Date): { readonly halfHour: Window; readonly day: Window } {
  const to = Math.floor(now.getTime() / HALF_HOUR) * HALF_HOUR;
  const from = to - HALF_HOUR;
  return {
    halfHour: { from: new Date(from), to: new Date(to) },
    day: { from: new Date(riyadhMidnightOf(from)), to: new Date(to) },
  };
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

export function reportText(
  windows: { readonly halfHour: Window; readonly day: Window },
  halfHourVisits: number,
  dayVisits: number,
  name: Option.Option<string>
): string {
  const title = Option.match(name, { onNone: () => 'وردي', onSome: escaped });
  const finished = windows.day.to.getTime() - windows.day.from.getTime() === DAY;
  const day = finished ? 'أمس' : 'اليوم';
  const dayCount = halfHourVisits === 0 ? rememberersLabel(dayVisits) : toArabicDigits(dayVisits);
  return `${bold(title)} 🌻\n\n${bold(rememberersLabel(halfHourVisits))} في آخر نصف ساعة، و${bold(dayCount)} ${day}\n${BLESSING}`;
}

export function isSilent(halfHourVisits: number, forced: boolean): boolean {
  return forced || halfHourVisits === 0;
}
