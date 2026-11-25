import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EMBLEMS, type EmblemName } from '../../src/lib/emblems.ts';

export const root = join(import.meta.dirname, '..', '..');

const face = (family: string, pkg: string, subset: string, weight: number, rule = '') => {
  const path = join('node_modules', '@fontsource', pkg, 'files');
  const href = pathToFileURL(join(root, path, `${pkg}-${subset}-${weight}-normal.woff2`)).href;
  return `@font-face{font-family:"${family}";${rule}src:url("${href}") format("woff2")}`;
};

const plex = (subset: string, weight: number, rule = '') =>
  face('Plex', 'ibm-plex-sans-arabic', subset, weight, `font-weight:${weight};${rule}`);

export const plexArabic = (weight: number) => plex('arabic', weight);
export const plexLatin = (weight: number) => plex('latin', weight, 'unicode-range:U+0000-00FF;');
export const amiri = () => face('Amiri', 'amiri', 'arabic', 400);
export const amiriQuran = () => face('Amiri Quran', 'amiri-quran', 'arabic', 400);

export const emblemSvg = (id: EmblemName) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;
