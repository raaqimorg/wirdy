import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { adhkarLabel } from '../../src/lib/arabic.ts';
import { EMBLEMS } from '../../src/lib/emblems.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { OCCASIONS } from '../../src/lib/occasions.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.mjs';

const WIDTH = 2400;
const HEIGHT = 1260;
const MARGIN = 132;
const EGGSHELL = '#f4f1d0';

const here = import.meta.dirname;
const root = join(here, '..', '..');
const font = (pkg, file) =>
  pathToFileURL(join(root, 'node_modules', '@fontsource', pkg, 'files', file)).href;
const outDir = process.argv[2] ?? join(root, 'public');
const ADHKAR = join(root, 'src', 'content', 'adhkar');

const emblem = (id) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;

const count = (id) => readdirSync(join(ADHKAR, id)).filter((file) => file.endsWith('.md')).length;

const head = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:"Plex";font-weight:400;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-400-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:500;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-500-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:700;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-700-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:400;unicode-range:U+0000-00FF;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-latin-400-normal.woff2')}") format("woff2")}
@font-face{font-family:"Amiri";src:url("${font('amiri', 'amiri-arabic-400-normal.woff2')}") format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{font-family:"Plex",sans-serif;padding:${MARGIN}px}
.domain{position:absolute;left:${MARGIN}px;direction:ltr;font-size:54px}`;

const tiles = OCCASIONS.map(
  ({ id, color }) => `<div class="tile" style="background:${color}">${emblem(id)}</div>`
).join('');

const home = `${head}
body{background:${SITE.paper};color:hsl(200 50% 5%);display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:44px}
.brand svg{width:208px;height:208px}
.name{font-size:200px;font-weight:700;line-height:1.1}
.hero{margin-top:56px;font-size:84px;line-height:1.5;white-space:nowrap}
.salla{font-family:"Amiri",serif}
.tiles{margin-top:auto;display:grid;grid-template-columns:repeat(${OCCASIONS.length},1fr);gap:36px}
.tile{aspect-ratio:1;border-radius:26px;display:grid;place-items:center;padding:44px}
.tile svg{height:100%}
.domain{top:${MARGIN + 70}px;color:hsl(200 40% 22%)}
</style></head><body>
<div class="brand">${markSvg()}<span class="name">${SITE.name}</span></div>
<p class="hero">أذكار اليوم والليلة، مما ثبت عن النبي&nbsp;<span class="salla">ﷺ</span>، ومع كل ذكر تخريجُه</p>
<div class="tiles">${tiles}</div>
<div class="domain">wirdy.site</div>
</body></html>`;

const occasion = ({ id, heading, color }) => `${head}
body{background:${color};color:${EGGSHELL};display:grid;
  grid-template-columns:minmax(0,1fr) 820px;grid-template-rows:auto 1fr;column-gap:96px}
.brand{grid-column:1/-1;display:flex;align-items:center;gap:36px}
.disc{width:150px;height:150px;border-radius:50%;background:${EGGSHELL};display:grid;place-items:center}
.disc svg{width:112px;height:112px}
.name{font-size:120px;font-weight:700;line-height:1}
.text{align-self:end;padding-bottom:24px}
.heading{font-size:150px;font-weight:700;line-height:1.3;text-wrap:balance}
.count{margin-top:28px;font-size:72px;font-weight:500}
.emblem{align-self:end;width:820px;height:820px}
.emblem svg{width:100%;height:100%}
.domain{top:${MARGIN + 46}px}
</style></head><body>
<div class="brand"><span class="disc">${markSvg()}</span><span class="name">${SITE.name}</span></div>
<div class="text"><p class="heading">${heading}</p><p class="count">${adhkarLabel(count(id))}</p></div>
<div class="emblem">${emblem(id)}</div>
<div class="domain">wirdy.site</div>
</body></html>`;

const cards = [
  { file: 'opengraph.png', html: home },
  ...OCCASIONS.map((o) => ({ file: `opengraph-${o.id}.png`, html: occasion(o) })),
];

for (const { file, html } of cards) {
  const out = join(outDir, file);
  screenshot({ html, width: WIDTH, height: HEIGHT, out });
  console.log(out);
}
