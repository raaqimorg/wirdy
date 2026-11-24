import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EMBLEMS } from '../../src/lib/emblems.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { OCCASIONS } from '../../src/lib/occasions.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.mjs';

const WIDTH = 2400;
const HEIGHT = 1260;
const MARGIN = 132;

const here = import.meta.dirname;
const root = join(here, '..', '..');
const font = (pkg, file) =>
  pathToFileURL(join(root, 'node_modules', '@fontsource', pkg, 'files', file)).href;
const out = process.argv[2] ?? join(root, 'public', 'opengraph.png');

const emblem = (id) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;

const tiles = OCCASIONS.map(
  ({ id, color }) => `<div class="tile" style="background:${color}">${emblem(id)}</div>`
).join('');

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:"Plex";font-weight:400;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-400-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:700;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-700-normal.woff2')}") format("woff2")}
@font-face{font-family:"Amiri";src:url("${font('amiri', 'amiri-arabic-400-normal.woff2')}") format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{background:${SITE.paper};color:hsl(200 50% 5%);font-family:"Plex",sans-serif;
  padding:${MARGIN}px ${MARGIN}px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:44px}
.brand svg{width:208px;height:208px}
.name{font-size:200px;font-weight:700;line-height:1.1}
.hero{margin-top:56px;font-size:84px;line-height:1.5;white-space:nowrap}
.salla{font-family:"Amiri",serif}
.tiles{margin-top:auto;display:grid;grid-template-columns:repeat(6,1fr);gap:36px}
.tile{aspect-ratio:1;border-radius:26px;display:grid;place-items:center;padding:44px}
.tile svg{height:100%}
.domain{position:absolute;top:${MARGIN + 70}px;left:${MARGIN}px;direction:ltr;
  font-size:54px;color:hsl(200 40% 22%)}
</style></head><body>
<div class="brand">${markSvg()}<span class="name">${SITE.name}</span></div>
<p class="hero">أذكار اليوم والليلة، مما ثبت عن النبي&nbsp;<span class="salla">ﷺ</span>، ومع كل ذكرٍ تخريجُه</p>
<div class="tiles">${tiles}</div>
<div class="domain">wirdy.site</div>
</body></html>`;

screenshot({ html, width: WIDTH, height: HEIGHT, out });

console.log(out);
