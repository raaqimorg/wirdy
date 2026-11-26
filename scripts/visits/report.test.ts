import { describe, expect, test } from 'bun:test';
import { Option } from 'effect';
import {
  hourlyText,
  hourlyWindowsOf,
  isSilent,
  morningText,
  nameOf,
  yesterdayOf,
} from './report.ts';

const at = (iso: string) => new Date(iso);
const span = (from: string, to: string) => ({ from: at(from), to: at(to) });
const first = Option.some('الأولى');

describe('hourlyWindowsOf', () => {
  test('reports the last whole hour and the Riyadh day up to it', () => {
    expect(hourlyWindowsOf(at('2026-11-26T11:17:00Z'))).toEqual({
      hour: span('2026-11-26T10:00:00Z', '2026-11-26T11:00:00Z'),
      day: span('2026-11-25T21:00:00Z', '2026-11-26T11:00:00Z'),
    });
  });

  test('reports the same hour from a late run', () => {
    expect(hourlyWindowsOf(at('2026-11-26T11:50:00Z'))).toEqual(
      hourlyWindowsOf(at('2026-11-26T11:17:00Z'))
    );
  });

  test('reports the whole day before from the run after Riyadh midnight', () => {
    expect(hourlyWindowsOf(at('2026-11-26T21:17:00Z'))).toEqual({
      hour: span('2026-11-26T20:00:00Z', '2026-11-26T21:00:00Z'),
      day: span('2026-11-25T21:00:00Z', '2026-11-26T21:00:00Z'),
    });
  });
});

describe('yesterdayOf', () => {
  test('is the whole Riyadh day before the run', () => {
    expect(yesterdayOf(at('2026-11-26T04:07:00Z'))).toEqual(
      span('2026-11-24T21:00:00Z', '2026-11-25T21:00:00Z')
    );
  });

  test('is the same day for a late run', () => {
    expect(yesterdayOf(at('2026-11-26T08:59:00Z'))).toEqual(
      yesterdayOf(at('2026-11-26T04:07:00Z'))
    );
  });
});

describe('nameOf', () => {
  test('picks one of the names by the random number', () => {
    expect(Option.getOrNull(nameOf('الأولى_الثانية', 0))).toBe('الأولى');
    expect(Option.getOrNull(nameOf('الأولى_الثانية', 0.99))).toBe('الثانية');
  });

  test('keeps the spaces inside a name', () => {
    expect(Option.getOrNull(nameOf('الأولى_أم محمد', 0.6))).toBe('أم محمد');
  });

  test('ignores extra underscores and spaces around a name', () => {
    expect(Option.getOrNull(nameOf('_ الأولى __الثانية _', 0.6))).toBe('الثانية');
  });

  test('gives no name when none is set', () => {
    expect(Option.isNone(nameOf('', 0.5))).toBe(true);
    expect(Option.isNone(nameOf(' _ _', 0.5))).toBe(true);
  });
});

describe('hourlyText', () => {
  test('gives the last hour and today so far', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 18, 342, first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>١٨</b> ذاكرًا في آخر ساعة، و<b>٣٤٢</b> اليوم\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });

  test('shows a quiet hour as zero', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T00:17:00Z')), 0, 6, first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>٠</b> ذاكر في آخر ساعة، و<b>٦</b> اليوم\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });

  test('calls the total of a finished day yesterday', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T21:17:00Z')), 3, 412, first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>٣</b> ذاكرين في آخر ساعة، و<b>٤١٢</b> أمس\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });

  test('uses the site name when no name is set', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 1, 2, Option.none())).toBe(
      '<b>وِردي</b> 🌻\n\n<b>١</b> ذاكر في آخر ساعة، و<b>٢</b> اليوم\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });

  test('escapes a name that looks like markup', () => {
    expect(
      hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 1, 2, Option.some('<i>&'))
    ).toContain('<b>&lt;i&gt;&amp;</b>');
  });
});

describe('morningText', () => {
  test('greets with the visits of yesterday', () => {
    expect(morningText(412, first)).toBe(
      '<b>صباح الخير يا الأولى</b> 🌻\n\n<b>٤١٢</b> ذاكرًا أمس\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });

  test('counts a few rememberers in the plural', () => {
    expect(morningText(5, first)).toContain('<b>٥</b> ذاكرين أمس');
  });

  test('greets without a name when none is set', () => {
    expect(morningText(0, Option.none())).toBe(
      '<b>صباح الخير</b> 🌻\n\n<b>٠</b> ذاكر أمس\nكتب الله أجرك\n\nهنيئًا لكِ هذا الأجر'
    );
  });
});

describe('isSilent', () => {
  test('silences an hour with no visits', () => {
    expect(isSilent(0, false)).toBe(true);
  });

  test('rings for an hour with visits', () => {
    expect(isSilent(5, false)).toBe(false);
  });

  test('silences a run asked to be silent', () => {
    expect(isSilent(5, true)).toBe(true);
  });
});
