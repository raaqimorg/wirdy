import { Record } from 'effect';
import { OCCASION_IDS } from './occasions';
import { chromaOf, DEEP_LIGHTNESS, hexFromOklch, toneOf } from './tone';

export const SITE = {
  name: 'وِردي',
  url: 'https://wirdy.site',
  domain: 'wirdy.site',
  tagline: 'أذكار اليوم والليلة',
  promise: {
    before: 'لا ذكر هنا إلا ما صح عن النبي',
    after: '،',
    more: 'بدرجته ومصدره',
  },
  title: 'وِردي: أذكار الصباح والمساء والنوم وأدبار الصلوات',
  description:
    'أذكار الصباح والمساء والنوم والصلاة، والطعام والسفر والهم والمرض، مما ثبت عن النبي ﷺ، مع تخريج كل ذكر',
  repo: 'https://github.com/raaqimorg/wirdy',
} as const;

export const RAAQIM = {
  name: 'Raaqim',
  arabic: 'راقم',
  url: 'https://raaqim.org',
  about: 'Raaqim builds Arabic and Islamic digital projects.',
  github: 'https://github.com/raaqimorg',
  x: 'https://x.com/raaqimorg',
  handle: '@raaqimorg',
  email: 'contact@raaqim.org',
} as const;

export const GUIDES = {
  jumuah: {
    path: '/al-jumuah/',
    heading: 'الجمعة',
    title: 'سنن الجمعة',
    topics: 'في فضل يوم الجمعة والغسل والتبكير والخطبة والصلاة وسورة الكهف وساعة الإجابة',
    color: hexFromOklch(DEEP_LIGHTNESS, chromaOf(DEEP_LIGHTNESS), 115),
  },
  tibb: {
    path: '/al-tibb-al-nabawi/',
    heading: 'الطب النبوي',
    title: 'الطب النبوي',
    topics: 'في التداوي والعسل والحبة السوداء وماء زمزم والحجامة والرقية وحفظ الصحة',
    color: toneOf(80, OCCASION_IDS.length),
  },
} as const;

export type Guide = keyof typeof GUIDES;

export const GUIDE_IDS: ReadonlyArray<Guide> = Record.keys(GUIDES);
