import { CHROMA, hexFromOklch, LIGHTNESS, NEUTRAL } from './tone';

export const SITE = {
  name: 'وِردي',
  url: 'https://wirdy.site',
  domain: 'wirdy.site',
  tagline: 'أذكار اليوم والليلة',
  promise: { before: 'أذكار اليوم والليلة، مما ثبت عن النبي', after: '، ومع كل ذكر تخريجُه' },
  title: 'وِردي: أذكار الصباح والمساء والنوم وأدبار الصلوات',
  description:
    'أذكار الصباح والمساء، والأذان والمسجد، والصلاة وأدبارها، والنوم والاستيقاظ، والأحوال، مما ثبت عن النبي ﷺ، بالتشكيل، وتحت كل ذكر تخريجه من الدرر السنية. بلا إعلانات.',
  repo: 'https://github.com/raaqimorg/wirdy',
} as const;

export const UNPROVEN = {
  path: '/ma-lam-yathbut/',
  heading: 'لم يثبت',
  title: 'ما لم يثبت',
  lede: 'أذكار مشهورة، وحكم كل منها',
  color: NEUTRAL,
} as const;

export const TIBB = {
  path: '/al-tibb-al-nabawi/',
  heading: 'الطب النبوي',
  title: 'الطب النبوي',
  lede: 'العسل، والحجامة، والرقية',
  color: hexFromOklch(LIGHTNESS, CHROMA, 80),
} as const;
