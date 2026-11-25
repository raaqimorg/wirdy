const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]!);
}

export function adhkarLabel(n: number): string {
  if (n === 1) return 'ذكر واحد';
  if (n === 2) return 'ذكران';
  if (n >= 3 && n <= 10) return `${toArabicDigits(n)} أذكار`;
  return `${toArabicDigits(n)} ذكرًا`;
}

const ORDINALS = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'];

export function formLabel(n: number): string {
  return `الصيغة ${ORDINALS[n - 1]}`;
}

export function timesUnit(n: number): string {
  if (n === 2) return 'مرتان';
  return n >= 3 && n <= 10 ? 'مرات' : 'مرة';
}

export function timesLabel(n: number): string {
  if (n === 2) return timesUnit(n);
  return `${toArabicDigits(n)} ${timesUnit(n)}`;
}

export function ayatLabel(n: number): string {
  if (n === 1) return 'آية واحدة';
  if (n === 2) return 'آيتان';
  if (n >= 3 && n <= 10) return `${toArabicDigits(n)} آيات`;
  return `${toArabicDigits(n)} آية`;
}

export function resultsLabel(n: number): string {
  if (n === 1) return 'نتيجة واحدة';
  if (n === 2) return 'نتيجتان';
  if (n >= 3 && n <= 10) return `${toArabicDigits(n)} نتائج`;
  return `${toArabicDigits(n)} نتيجة`;
}
