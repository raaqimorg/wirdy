import { OCCASION_IDS } from './occasions';
import { toneOf } from './tone';

export const SITE = {
  name: 'وِردي',
  url: 'https://wirdy.site',
  domain: 'wirdy.site',
  tagline: 'أذكار اليوم والليلة',
  promise: {
    before: 'لا ذكرَ هنا إلا ما صحّ عن النبي',
    after: '،',
    more: 'ومع كلٍّ درجتُه (كصحيح البخاري) ورابطُ مصدره، وفضلُه إن ورد',
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

export const TIBB = {
  path: '/al-tibb-al-nabawi/',
  heading: 'الطب النبوي',
  title: 'الطب النبوي',
  color: toneOf(80, OCCASION_IDS.length),
} as const;
