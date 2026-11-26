import type { FORMS } from './schema';

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(n: number): string {
  return String(n).replaceAll(/\d/gu, (digit) => ARABIC_INDIC.charAt(Number(digit)));
}

const isFew = (n: number) => n >= 3 && n <= 10;

export function adhkarLabel(n: number): string {
  if (n === 1) return 'ذكر واحد';
  if (n === 2) return 'ذكران';
  if (isFew(n)) return `${toArabicDigits(n)} أذكار`;
  return `${toArabicDigits(n)} ذكرًا`;
}

export function hadithLabel(n: number): string {
  if (n === 1) return 'حديث واحد';
  if (n === 2) return 'حديثان';
  if (isFew(n)) return `${toArabicDigits(n)} أحاديث`;
  return `${toArabicDigits(n)} حديثًا`;
}

const ORDINALS: Readonly<Record<(typeof FORMS)[number], string>> = {
  1: 'الأولى',
  2: 'الثانية',
  3: 'الثالثة',
  4: 'الرابعة',
};

export function formLabel(n: (typeof FORMS)[number]): string {
  return `الصيغة ${ORDINALS[n]}`;
}

export function timesUnit(n: number): string {
  if (n === 2) return 'مرتان';
  return isFew(n) ? 'مرات' : 'مرة';
}

export function timesLabel(n: number): string {
  if (n === 2) return timesUnit(n);
  return `${toArabicDigits(n)} ${timesUnit(n)}`;
}

export function ayatLabel(n: number): string {
  if (n === 1) return 'آية واحدة';
  if (n === 2) return 'آيتان';
  if (isFew(n)) return `${toArabicDigits(n)} آيات`;
  return `${toArabicDigits(n)} آية`;
}

export function resultsLabel(n: number): string {
  if (n === 1) return 'نتيجة واحدة';
  if (n === 2) return 'نتيجتان';
  if (isFew(n)) return `${toArabicDigits(n)} نتائج`;
  return `${toArabicDigits(n)} نتيجة`;
}

export function visitsLabel(n: number): string {
  if (n === 0) return 'لا زيارات';
  if (n === 1) return 'زيارة واحدة';
  if (n === 2) return 'زيارتان';
  if (isFew(n % 100)) return `${toArabicDigits(n)} زيارات`;
  return `${toArabicDigits(n)} زيارة`;
}
