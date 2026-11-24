import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EMBLEMS } from '../../src/lib/emblems.ts';

export const root = join(import.meta.dirname, '..', '..');

const face = (family, pkg, subset, weight, rule = '') => {
  const path = join('node_modules', '@fontsource', pkg, 'files');
  const href = pathToFileURL(join(root, path, `${pkg}-${subset}-${weight}-normal.woff2`)).href;
  return `@font-face{font-family:"${family}";${rule}src:url("${href}") format("woff2")}`;
};

const plex = (subset, weight, rule = '') =>
  face('Plex', 'ibm-plex-sans-arabic', subset, weight, `font-weight:${weight};${rule}`);

export const plexArabic = (weight) => plex('arabic', weight);
export const plexLatin = (weight) => plex('latin', weight, 'unicode-range:U+0000-00FF;');
export const amiri = () => face('Amiri', 'amiri', 'arabic', 400);
export const amiriQuran = () => face('Amiri Quran', 'amiri-quran', 'arabic', 400);

export const emblemSvg = (id) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;
