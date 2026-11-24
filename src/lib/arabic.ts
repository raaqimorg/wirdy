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

export function timesLabel(n: number): string {
  if (n === 2) return 'مرتان';
  if (n >= 3 && n <= 10) return `${toArabicDigits(n)} مرات`;
  return `${toArabicDigits(n)} مرة`;
}
