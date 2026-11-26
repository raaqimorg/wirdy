import { describe, expect, test } from 'bun:test';
import { Option } from 'effect';
import {
  hourlyText,
  hourlyWindowsOf,
  isSilent,
  messageOf,
  morningText,
  morningWindowsOf,
  occasionOf,
  topOccasionOf,
} from './report.ts';

const at = (iso: string) => new Date(iso);
const span = (from: string, to: string) => ({ from: at(from), to: at(to) });
const DAY = 86_400_000;

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

describe('morningWindowsOf', () => {
  const days = morningWindowsOf(at('2026-11-26T04:07:00Z'));

  test('covers 28 Riyadh days, yesterday first', () => {
    expect(days).toHaveLength(28);
    expect(days[0]).toEqual(span('2026-11-24T21:00:00Z', '2026-11-25T21:00:00Z'));
    expect(days[27]).toEqual(span('2026-10-28T21:00:00Z', '2026-10-29T21:00:00Z'));
  });

  test('makes every window one day wide', () => {
    for (const day of days) expect(day.to.getTime() - day.from.getTime()).toBe(DAY);
  });

  test('gives a late run the same days', () => {
    expect(morningWindowsOf(at('2026-11-26T08:59:00Z'))).toEqual(days);
  });
});

describe('hourlyText', () => {
  test('gives today so far and the last hour', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T11:17:00Z')), 18, 342)).toBe(
      'اليوم حتى الآن: ٣٤٢ زيارة\nالساعة الماضية: +١٨'
    );
  });

  test('names a quiet hour in words', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T00:17:00Z')), 0, 6)).toBe(
      'اليوم حتى الآن: ٦ زيارات\nالساعة الماضية: لا زيارات'
    );
  });

  test('calls the total of a finished day the day before', () => {
    expect(hourlyText(hourlyWindowsOf(at('2026-11-26T21:17:00Z')), 3, 412)).toBe(
      'مجموع أمس: ٤١٢ زيارة\nالساعة الأخيرة منه: +٣'
    );
  });
});

describe('morningText', () => {
  const top = Option.some('أذكار الصباح والمساء');

  test('gives the harvest, the change, the top occasion, and a best day', () => {
    expect(morningText([412, 361, 300], top)).toBe(
      'حصاد أمس: ٤١٢ زيارة\n↑ ١٤٪ عن اليوم الذي قبله\nأكثرها: أذكار الصباح والمساء\nأفضل يوم في آخر ٤ أسابيع'
    );
  });

  test('shows a fall with a down arrow and no best day', () => {
    expect(morningText([300, 400, 500], Option.none())).toBe(
      'حصاد أمس: ٣٠٠ زيارة\n↓ ٢٥٪ عن اليوم الذي قبله'
    );
  });

  test('says when the day equals the one before', () => {
    expect(morningText([50, 50, 80], Option.none())).toBe(
      'حصاد أمس: ٥٠ زيارة\nمثل اليوم الذي قبله'
    );
  });

  test('leaves out the change after a day with no visits', () => {
    expect(morningText([5, 0], Option.none())).toBe('حصاد أمس: ٥ زيارات\nأفضل يوم في آخر ٤ أسابيع');
  });

  test('gives no best day to a tie with an earlier day', () => {
    expect(morningText([90, 10, 90], Option.none())).not.toContain('أفضل يوم');
  });

  test('gives no best day to a day with no visits', () => {
    expect(morningText([0, 0], Option.none())).toBe('حصاد أمس: لا زيارات');
  });
});

describe('occasionOf', () => {
  test.each([
    ['/sabah-masaa/', 'أذكار الصباح والمساء'],
    ['/sabah-masaa/ayat-al-kursi/', 'أذكار الصباح والمساء'],
    ['/nawm/', 'أذكار النوم'],
    ['/al-tibb-al-nabawi/x/', 'الطب النبوي'],
  ])('names the section of %s', (path, title) => {
    expect(Option.getOrNull(occasionOf(path))).toBe(title);
  });

  test.each(['/', '/search/1.json', '/nope/', ''])('names no section for %p', (path) => {
    expect(Option.isNone(occasionOf(path))).toBe(true);
  });
});

describe('topOccasionOf', () => {
  test('sums the visits of each section', () => {
    const rows = [
      { path: '/salah/', visits: 30 },
      { path: '/nawm/', visits: 20 },
      { path: '/nawm/a/', visits: 15 },
      { path: '/', visits: 99 },
    ];
    expect(Option.getOrNull(topOccasionOf(rows))).toBe('أذكار النوم');
  });

  test('gives a tie to the earlier section', () => {
    const rows = [
      { path: '/nawm/', visits: 10 },
      { path: '/sabah-masaa/', visits: 10 },
    ];
    expect(Option.getOrNull(topOccasionOf(rows))).toBe('أذكار الصباح والمساء');
  });

  test('names none when no path is a section', () => {
    expect(Option.isNone(topOccasionOf([]))).toBe(true);
    expect(Option.isNone(topOccasionOf([{ path: '/', visits: 9 }]))).toBe(true);
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

describe('messageOf', () => {
  test('greets the reader by name every hour', () => {
    expect(messageOf('hourly', Option.some('الأولى'), 'نص')).toBe('أهلًا يا الأولى 👋\n\nنص');
  });

  test('wishes the reader a good morning', () => {
    expect(messageOf('morning', Option.some('الأولى'), 'نص')).toBe('صباح الخير يا الأولى ☀️\n\nنص');
  });

  test('sends the body alone when no name is set', () => {
    expect(messageOf('hourly', Option.none(), 'نص')).toBe('نص');
  });
});
