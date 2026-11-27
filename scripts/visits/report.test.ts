import { describe, expect, test } from 'bun:test';
import { Option } from 'effect';
import {
  SOURCE_IDS,
  alertText,
  countryLabel,
  isFinished,
  isSilent,
  nameOf,
  pageLabel,
  reportText,
  sourceLine,
  timesAccusativeLabel,
  toCount,
  windowsOf,
} from './report.ts';
import type { Details, Totals } from './report.ts';

const at = (iso: string) => new Date(iso);
const span = (from: string, to: string) => ({ from: at(from), to: at(to) });
const first = Option.some('الأولى');

const noon = windowsOf(at('2026-11-26T11:00:00Z'));
const midnight = windowsOf(at('2026-11-26T21:00:00Z'));

const totalsOf = (given: Partial<Totals>): Totals => ({
  hour: 0,
  day: 0,
  hourBefore: 0,
  dayBefore: 0,
  hourFromX: 0,
  ...given,
});

const detailsOf = (given: Partial<Details>): Details => ({
  countries: [],
  pages: [],
  sources: [],
  posters: 0,
  missing: [],
  failures: 0,
  ...given,
});

describe('windowsOf', () => {
  test('reports the hour up to the run and the Riyadh day up to it', () => {
    expect(noon.hour).toEqual(span('2026-11-26T10:00:00Z', '2026-11-26T11:00:00Z'));
    expect(noon.day).toEqual(span('2026-11-25T21:00:00Z', '2026-11-26T11:00:00Z'));
  });

  test('compares with the same hour a day before, and the whole Riyadh day before', () => {
    expect(noon.hourBefore).toEqual(span('2026-11-25T10:00:00Z', '2026-11-25T11:00:00Z'));
    expect(noon.dayBefore).toEqual(span('2026-11-24T21:00:00Z', '2026-11-25T21:00:00Z'));
  });

  test('reports the same hour from a late run', () => {
    expect(windowsOf(at('2026-11-26T11:59:00Z'))).toEqual(noon);
  });

  test('reports the whole day before from the run at Riyadh midnight', () => {
    expect(midnight.hour).toEqual(span('2026-11-26T20:00:00Z', '2026-11-26T21:00:00Z'));
    expect(midnight.day).toEqual(span('2026-11-25T21:00:00Z', '2026-11-26T21:00:00Z'));
    expect(midnight.dayBefore).toEqual(span('2026-11-24T21:00:00Z', '2026-11-25T21:00:00Z'));
  });

  test('starts a new day from the first run after Riyadh midnight', () => {
    expect(windowsOf(at('2026-11-26T22:00:00Z')).day).toEqual(
      span('2026-11-26T21:00:00Z', '2026-11-26T22:00:00Z')
    );
  });
});

describe('isFinished', () => {
  test('finishes the day only at the run at Riyadh midnight', () => {
    expect(isFinished(midnight)).toBe(true);
    expect(isFinished(noon)).toBe(false);
    expect(isFinished(windowsOf(at('2026-11-26T22:00:00Z')))).toBe(false);
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

describe('toCount', () => {
  test('rounds a sampled count to a whole one', () => {
    expect(toCount(7.6)).toBe(8);
    expect(toCount(7.4)).toBe(7);
  });

  test('never gives a negative or an endless count', () => {
    expect(toCount(-3)).toBe(0);
    expect(toCount(Number.NaN)).toBe(0);
    expect(toCount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('timesAccusativeLabel', () => {
  test.each([
    [1, 'مرة واحدة'],
    [2, 'مرتين'],
    [3, '٣ مرات'],
    [10, '١٠ مرات'],
    [11, '١١ مرة'],
    [24, '٢٤ مرة'],
    [100, '١٠٠ مرة'],
    [103, '١٠٣ مرات'],
    [111, '١١١ مرة'],
  ])('counts %i times as %s', (n, label) => {
    expect(timesAccusativeLabel(n)).toBe(label);
  });
});

describe('countryLabel', () => {
  test.each([
    ['SA', 'السعودية'],
    ['US', 'أمريكا'],
    ['PS', 'فلسطين'],
    ['MM', 'ميانمار'],
    ['CD', 'الكونغو الديمقراطية'],
  ])('gives %s the short name readers say, %s', (code, name) => {
    expect(Option.getOrNull(countryLabel(code))).toBe(name);
  });

  test('names any other country in Arabic', () => {
    expect(Option.getOrNull(countryLabel('EG'))).toBe('مصر');
  });

  test.each(['XX', 'T1', 'XA', 'ZZ', 'QO', '', 'sa'])(
    'names no country for %p, a code Cloudflare gives without one',
    (code) => {
      expect(Option.isNone(countryLabel(code))).toBe(true);
    }
  );
});

describe('pageLabel', () => {
  test('names the home page', () => {
    expect(Option.getOrNull(pageLabel('/'))).toBe('الرئيسية');
  });

  test('names a section and a dhikr in it by the section', () => {
    expect(Option.getOrNull(pageLabel('/sabah-masaa/'))).toBe('الصباح والمساء');
    expect(Option.getOrNull(pageLabel('/sabah-masaa/ayat-al-kursi/'))).toBe('الصباح والمساء');
  });

  test('names a guide and a hadith in it by the guide', () => {
    expect(Option.getOrNull(pageLabel('/al-jumuah/'))).toBe('سنن الجمعة');
    expect(Option.getOrNull(pageLabel('/al-tibb-al-nabawi/al-asal/'))).toBe('الطب النبوي');
  });

  test('names no other page', () => {
    expect(Option.isNone(pageLabel('/wp-login.php'))).toBe(true);
    expect(Option.isNone(pageLabel('/sabah-masaa/a/b/'))).toBe(true);
    expect(Option.isNone(pageLabel('sabah-masaa/'))).toBe(true);
  });
});

describe('sourceLine', () => {
  test('says nothing for an hour with no one, or with few from X', () => {
    expect(Option.isNone(sourceLine(0, 0))).toBe(true);
    expect(Option.isNone(sourceLine(10, 5))).toBe(true);
    expect(Option.isNone(sourceLine(2, 1))).toBe(true);
  });

  test.each([
    [1, 1, 'جاء من إكس'],
    [2, 2, 'كلاهما من إكس'],
    [5, 5, 'كلهم من إكس'],
    [5, 6, 'كلهم من إكس'],
    [10, 6, 'أغلبهم من إكس'],
  ])('says, for %i readers with %i from X, %s', (visits, fromX, line) => {
    expect(Option.getOrNull(sourceLine(visits, fromX))).toBe(line);
  });
});

describe('reportText', () => {
  test('gives the last hour, today so far, and the same hour a day before', () => {
    expect(
      reportText(noon, totalsOf({ hour: 18, day: 342, hourBefore: 7 }), Option.none(), first)
    ).toBe(
      '<b>الأولى</b> 🌻\n\n<b>١٨ ذاكرا</b> في آخر ساعة، و<b>٣٤٢</b> اليوم\n↑ أمس في مثل هذه الساعة: ٧ ذاكرين\nكتب الله أجرك\n\nهنيئا لك هذا الأجر'
    );
  });

  test('points down for an hour quieter than the day before, and not at all for an equal one', () => {
    expect(
      reportText(noon, totalsOf({ hour: 1, day: 9, hourBefore: 2 }), Option.none(), first)
    ).toContain('\n↓ أمس في مثل هذه الساعة: ذاكران\n');
    expect(
      reportText(noon, totalsOf({ hour: 4, day: 9, hourBefore: 4 }), Option.none(), first)
    ).toContain('\nأمس في مثل هذه الساعة: ٤ ذاكرين\n');
  });

  test('compares a quiet hour with a busy one a day before', () => {
    expect(reportText(noon, totalsOf({ day: 6, hourBefore: 1 }), Option.none(), first)).toContain(
      '<b>لا أحد</b> في آخر ساعة، و<b>٦ ذاكرين</b> اليوم\n↓ أمس في مثل هذه الساعة: ذاكر واحد\n'
    );
  });

  test('leaves out the comparison when both hours had no one', () => {
    expect(reportText(noon, totalsOf({}), Option.none(), first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>لا أحد</b> في آخر ساعة، و<b>لا أحد</b> اليوم\nكتب الله أجرك\n\nهنيئا لك هذا الأجر'
    );
  });

  test('names one and two in words', () => {
    expect(reportText(noon, totalsOf({ hour: 1, day: 9 }), Option.none(), first)).toContain(
      '<b>ذاكر واحد</b> في آخر ساعة، و<b>٩</b> اليوم'
    );
    expect(reportText(noon, totalsOf({ hour: 2, day: 9 }), Option.none(), first)).toContain(
      '<b>ذاكران</b> في آخر ساعة، و<b>٩</b> اليوم'
    );
  });

  test('says when most of the hour came from X', () => {
    expect(
      reportText(noon, totalsOf({ hour: 63, day: 222, hourFromX: 40 }), Option.none(), first)
    ).toContain('\n↑ أمس في مثل هذه الساعة: لا أحد\nأغلبهم من إكس\nكتب الله أجرك');
  });

  test('calls the total of a finished day yesterday, against the day before it', () => {
    expect(
      reportText(midnight, totalsOf({ hour: 3, day: 412, dayBefore: 301 }), Option.none(), first)
    ).toBe(
      '<b>الأولى</b> 🌻\n\n<b>٣ ذاكرين</b> في آخر ساعة، و<b>٤١٢</b> أمس\n↑ أول أمس: ٣٠١ ذاكر\nكتب الله أجرك\n\nهنيئا لك هذا الأجر'
    );
  });

  test('compares no hour at midnight, only the day', () => {
    const text = reportText(
      midnight,
      totalsOf({ hour: 3, day: 3, hourBefore: 9, hourFromX: 3 }),
      Option.none(),
      first
    );
    expect(text).not.toContain('في مثل هذه الساعة');
    expect(text).not.toContain('كلهم');
  });

  test('sums up the day at midnight', () => {
    const details = detailsOf({
      countries: [
        { key: 'SA', count: 133 },
        { key: 'US', count: 33 },
        { key: 'SG', count: 12 },
        { key: 'DE', count: 7 },
      ],
      pages: [
        { key: '/', count: 154 },
        { key: '/al-jumuah/', count: 7 },
        { key: '/taam/', count: 3 },
        { key: '/taam/bismillah/', count: 2 },
      ],
      sources: [
        { id: 'X', count: 87 },
        { id: 'Instagram', count: 9 },
        { id: 'Snapchat', count: 0 },
      ],
      posters: 22,
    });
    expect(
      reportText(
        midnight,
        totalsOf({ hour: 3, day: 224, dayBefore: 301 }),
        Option.some(details),
        first
      )
    ).toBe(
      [
        '<b>الأولى</b> 🌻',
        '',
        '<b>٣ ذاكرين</b> في آخر ساعة، و<b>٢٢٤</b> أمس',
        '↓ أول أمس: ٣٠١ ذاكر',
        '',
        '🌍 السعودية ١٣٣، أمريكا ٣٣، سنغافورة ١٢، بلدان أخرى ٤٦',
        '🚪 الرئيسية ١٥٤، سنن الجمعة ٧، الطعام والشراب ٥، صفحات أخرى ٥٨',
        '🔗 إكس ٨٧، إنستغرام ٩، مصادر أخرى ١٢٨',
        '🖼 فتح الملصق ٢٢ مرة',
        'كتب الله أجرك',
        '',
        'هنيئا لك هذا الأجر',
      ].join('\n')
    );
  });

  test('counts a country it cannot name with the others', () => {
    const details = detailsOf({
      countries: [
        { key: 'XX', count: 3 },
        { key: 'SA', count: 2 },
      ],
    });
    expect(reportText(midnight, totalsOf({ day: 5 }), Option.some(details), first)).toContain(
      '\n🌍 السعودية ٢، بلدان أخرى ٣\n'
    );
  });

  test('adds no others when every reader is named', () => {
    const details = detailsOf({ countries: [{ key: 'SA', count: 5 }] });
    expect(reportText(midnight, totalsOf({ day: 5 }), Option.some(details), first)).toContain(
      '\n🌍 السعودية ٥\n'
    );
  });

  test('names every app with readers, not only the first three', () => {
    const details = detailsOf({
      sources: [
        { id: 'X', count: 4 },
        { id: 'Snapchat', count: 3 },
        { id: 'TikTok', count: 2 },
        { id: 'Telegram', count: 1 },
      ],
    });
    expect(reportText(midnight, totalsOf({ day: 10 }), Option.some(details), first)).toContain(
      '\n🔗 إكس ٤، سناب شات ٣، تيك توك ٢، تيليجرام ١\n'
    );
  });

  test('leaves out each empty part of the summary', () => {
    const details = detailsOf({
      posters: 2,
      pages: [{ key: '/wp-login.php', count: 9 }],
      countries: [{ key: 'XX', count: 5 }],
      sources: [{ id: 'X', count: 0 }],
    });
    const text = reportText(midnight, totalsOf({ day: 5 }), Option.some(details), first);
    expect(text).toContain('\n\n🖼 فتح الملصق مرتين\nكتب الله أجرك');
    expect(text).not.toContain('🌍');
    expect(text).not.toContain('🚪');
    expect(text).not.toContain('🔗');
  });

  test('sums up nothing for a day with no one', () => {
    expect(reportText(midnight, totalsOf({}), Option.some(detailsOf({})), first)).toBe(
      '<b>الأولى</b> 🌻\n\n<b>لا أحد</b> في آخر ساعة، و<b>لا أحد</b> أمس\nكتب الله أجرك\n\nهنيئا لك هذا الأجر'
    );
  });

  test('gives the summary only at midnight', () => {
    const details = detailsOf({ sources: [{ id: 'X', count: 4 }] });
    expect(reportText(noon, totalsOf({ hour: 4 }), Option.some(details), first)).not.toContain(
      '🔗'
    );
  });

  test('uses the site name when no name is set', () => {
    expect(reportText(noon, totalsOf({ hour: 1, day: 2 }), Option.none(), Option.none())).toMatch(
      /^<b>وردي<\/b> 🌻/u
    );
  });

  test('escapes a name that looks like markup', () => {
    expect(
      reportText(noon, totalsOf({ hour: 1, day: 2 }), Option.none(), Option.some('<i>&'))
    ).toContain('<b>&lt;i&gt;&amp;</b>');
  });

  test('carries no diacritics', () => {
    const details = detailsOf({
      countries: [{ key: 'EG', count: 3 }],
      pages: [{ key: '/', count: 3 }],
      sources: SOURCE_IDS.map((id) => ({ id, count: 1 })),
      posters: 3,
    });
    expect(
      reportText(midnight, totalsOf({ hour: 18, day: 342 }), Option.some(details), Option.none())
    ).not.toMatch(/[ً-ْ]/u);
  });
});

describe('alertText', () => {
  test('sends no alert for a day with no problem', () => {
    expect(Option.isNone(alertText(detailsOf({})))).toBe(true);
  });

  test('leaves out a missing page asked for fewer than 3 times', () => {
    expect(Option.isNone(alertText(detailsOf({ missing: [{ key: '/karb/', count: 2 }] })))).toBe(
      true
    );
  });

  test('names one missing page', () => {
    expect(Option.getOrNull(alertText(detailsOf({ missing: [{ key: '/karb/', count: 3 }] })))).toBe(
      '<b>وردي</b> 🔧\n\nلم يجد الزوار أمس هذا الرابط:\n• ٣ مرات: <code>/karb/</code>'
    );
  });

  test('names two missing pages', () => {
    const missing = [
      { key: '/a/', count: 24 },
      { key: '/b/', count: 3 },
    ];
    expect(Option.getOrNull(alertText(detailsOf({ missing })))).toContain(
      'لم يجد الزوار أمس هذين الرابطين:\n• ٢٤ مرة: <code>/a/</code>\n• ٣ مرات: <code>/b/</code>'
    );
  });

  test('names three or more missing pages', () => {
    const missing = [
      { key: '/a/', count: 5 },
      { key: '/b/', count: 4 },
      { key: '/c/', count: 3 },
    ];
    expect(Option.getOrNull(alertText(detailsOf({ missing })))).toContain(
      'لم يجد الزوار أمس هذه الروابط:'
    );
  });

  test('says when the site answered with an error, alone or after the missing pages', () => {
    expect(Option.getOrNull(alertText(detailsOf({ failures: 1 })))).toBe(
      '<b>وردي</b> 🔧\n\nأجاب الموقع أمس بخطأ مرة واحدة'
    );
    expect(
      Option.getOrNull(
        alertText(detailsOf({ failures: 2, missing: [{ key: '/karb/', count: 3 }] }))
      )
    ).toContain('<code>/karb/</code>\nوأجاب الموقع بخطأ مرتين');
  });

  test('escapes and shortens a long path', () => {
    const text = Option.getOrNull(
      alertText(detailsOf({ missing: [{ key: `/<b>${'x'.repeat(80)}`, count: 3 }] }))
    );
    expect(text).toContain(`<code>/&lt;b&gt;${'x'.repeat(56)}…</code>`);
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
