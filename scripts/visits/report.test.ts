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
    expect(Option.getOrNull(nameOf('الأولى الثانية', 0))).toBe('الأولى');
    expect(Option.getOrNull(nameOf('الأولى الثانية', 0.99))).toBe('الثانية');
  });

  test('ignores extra spaces', () => {
    expect(Option.getOrNull(nameOf('  الأولى   الثانية ', 0.6))).toBe('الثانية');
  });

  test('gives no name when none is set', () => {
    expect(Option.isNone(nameOf('', 0.5))).toBe(true);
    expect(Option.isNone(nameOf('   ', 0.5))).toBe(true);
  });
});

describe('hourlyText', () => {
  test('gives the last hour and today so far', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 18, 342, first)).toBe(
      '<b>الأولى</b> 🌻\nآخر ساعة <b>١٨</b> · اليوم <b>٣٤٢</b>\nكتب الله أجرك'
    );
  });

  test('shows a quiet hour as zero', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T00:17:00Z')), 0, 6, first)).toBe(
      '<b>الأولى</b> 🌻\nآخر ساعة <b>٠</b> · اليوم <b>٦</b>\nكتب الله أجرك'
    );
  });

  test('calls the total of a finished day yesterday', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T21:17:00Z')), 3, 412, first)).toBe(
      '<b>الأولى</b> 🌻\nآخر ساعة <b>٣</b> · أمس <b>٤١٢</b>\nكتب الله أجرك'
    );
  });

  test('uses the site name when no name is set', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 1, 2, Option.none())).toBe(
      '<b>وِردي</b> 🌻\nآخر ساعة <b>١</b> · اليوم <b>٢</b>\nكتب الله أجرك'
    );
  });

  test('escapes a name that looks like markup', () => {
    expect(
      hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 1, 2, Option.some('<i>&'))
    ).toContain('<b>&lt;i&gt;&amp;</b>');
  });
});

describe('morningText', () => {
  test('greets with the visits of yesterday and asks about the adhkar', () => {
    expect(morningText(412, first)).toBe(
      '<b>صباح الخير يا الأولى</b> 🌻\nأمس <b>٤١٢</b> زيارة\nكتب الله أجرك، قرأتِ أذكارك؟'
    );
  });

  test('counts a few visits in the plural', () => {
    expect(morningText(5, first)).toContain('أمس <b>٥</b> زيارات');
  });

  test('greets without a name when none is set', () => {
    expect(morningText(0, Option.none())).toBe(
      '<b>صباح الخير</b> 🌻\nأمس <b>٠</b> زيارة\nكتب الله أجرك، قرأتِ أذكارك؟'
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
