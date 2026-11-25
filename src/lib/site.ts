import { NEUTRAL } from './tone';

export const SITE = {
  name: 'وِردي',
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
