import { describe, expect, test } from 'bun:test';
import { Option } from 'effect';
import { isSilent, nameOf, reportText, windowsOf } from './report.ts';

const at = (iso: string) => new Date(iso);
const span = (from: string, to: string) => ({ from: at(from), to: at(to) });
const first = Option.some('الأولى');

describe('windowsOf', () => {
  test('reports the half hour up to the run and the Riyadh day up to it', () => {
    expect(windowsOf(at('2026-11-26T11:30:00Z'))).toEqual({
      halfHour: span('2026-11-26T11:00:00Z', '2026-11-26T11:30:00Z'),
      day: span('2026-11-25T21:00:00Z', '2026-11-26T11:30:00Z'),
    });
  });

  test('reports the same half hour from a late run', () => {
    expect(windowsOf(at('2026-11-26T11:59:00Z'))).toEqual(windowsOf(at('2026-11-26T11:30:00Z')));
  });

  test('reports the whole day before from the run at Riyadh midnight', () => {
    expect(windowsOf(at('2026-11-26T21:00:00Z'))).toEqual({
      halfHour: span('2026-11-26T20:30:00Z', '2026-11-26T21:00:00Z'),
      day: span('2026-11-25T21:00:00Z', '2026-11-26T21:00:00Z'),
    });
  });

  test('starts a new day from the first run after Riyadh midnight', () => {
    expect(windowsOf(at('2026-11-26T21:30:00Z')).day).toEqual(
      span('2026-11-26T21:00:00Z', '2026-11-26T21:30:00Z')
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

describe('reportText', () => {
  const noon = windowsOf(at('2026-11-26T11:30:00Z'));

  test('gives the last half hour and today so far', () => {
    expect(reportText(noon, 18, 342, first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>١٨ ذاكرا</b> في آخر نصف ساعة، و<b>٣٤٢</b> اليوم\nكتب الله أجرك\n\nهنيئا لك هذا الأجر'
    );
  });

  test('names one and two in words', () => {
    expect(reportText(noon, 1, 9, first)).toContain(
      '<b>ذاكر واحد</b> في آخر نصف ساعة، و<b>٩</b> اليوم'
    );
    expect(reportText(noon, 2, 9, first)).toContain(
      '<b>ذاكران</b> في آخر نصف ساعة، و<b>٩</b> اليوم'
    );
  });

  test('counts today in full after a quiet half hour', () => {
    expect(reportText(windowsOf(at('2026-11-26T00:30:00Z')), 0, 6, first)).toContain(
      '<b>لا أحد</b> في آخر نصف ساعة، و<b>٦ ذاكرين</b> اليوم'
    );
  });

  test('says no one for a quiet day', () => {
    expect(reportText(windowsOf(at('2026-11-26T21:30:00Z')), 0, 0, first)).toContain(
      '<b>لا أحد</b> في آخر نصف ساعة، و<b>لا أحد</b> اليوم'
    );
  });

  test('calls the total of a finished day yesterday', () => {
    expect(reportText(windowsOf(at('2026-11-26T21:00:00Z')), 3, 412, first)).toContain(
      '<b>٣ ذاكرين</b> في آخر نصف ساعة، و<b>٤١٢</b> أمس'
    );
  });

  test('uses the site name when no name is set', () => {
    expect(reportText(noon, 1, 2, Option.none())).toMatch(/^<b>وردي<\/b> 🌻/u);
  });

  test('escapes a name that looks like markup', () => {
    expect(reportText(noon, 1, 2, Option.some('<i>&'))).toContain('<b>&lt;i&gt;&amp;</b>');
  });

  test('carries no diacritics', () => {
    expect(reportText(noon, 18, 342, Option.none())).not.toMatch(/[\u064B-\u0652]/u);
  });
});

describe('isSilent', () => {
  test('silences a half hour with no visits', () => {
    expect(isSilent(0, false)).toBe(true);
  });

  test('rings for a half hour with visits', () => {
    expect(isSilent(5, false)).toBe(false);
  });

  test('silences a run asked to be silent', () => {
    expect(isSilent(5, true)).toBe(true);
  });
});
