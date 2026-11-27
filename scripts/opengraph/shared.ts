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
const kfgqpc = (family: string, file: string) => {
  const href = pathToFileURL(join(root, 'src', 'fonts', file)).href;
  return `@font-face{font-family:"${family}";size-adjust:112%;src:url("${href}") format("truetype")}`;
};

export const naskh = () => kfgqpc('Naskh', 'kfgqpc-naskh-regular.ttf');
export const hafs = () => kfgqpc('Hafs', 'kfgqpc-hafs.ttf');

export const emblemSvg = (id: EmblemName) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;
