import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { adhkarLabel } from '../../src/lib/arabic.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { OCCASIONS } from '../../src/lib/occasions.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.mjs';
import { amiri, emblemSvg, plexArabic, plexLatin, root } from './shared.mjs';

const WIDTH = 2400;
const HEIGHT = 1260;
const MARGIN = 132;

const outDir = process.argv[2] ?? join(root, 'public');
const ADHKAR = join(root, 'src', 'content', 'adhkar');

const count = (id) => readdirSync(join(ADHKAR, id)).filter((file) => file.endsWith('.md')).length;

const head = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
${plexArabic(400)}
${plexArabic(500)}
${plexArabic(700)}
${plexLatin(400)}
${amiri()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{font-family:"Plex",sans-serif;padding:${MARGIN}px}
.domain{margin-inline-start:auto;direction:ltr;font-size:54px;translate:0 -4px}`;

const tiles = OCCASIONS.map(
  ({ id, color }) => `<div class="tile" style="background:${color}">${emblemSvg(id)}</div>`
).join('');

const home = `${head}
body{background:${PALETTE.paper};color:${PALETTE.ink};display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:44px}
.brand svg{width:208px;height:208px}
.name{font-size:200px;font-weight:700;line-height:1.1;translate:0 -61px}
.hero{margin-top:56px;font-size:84px;line-height:1.5;white-space:nowrap}
.salla{font-family:"Amiri",serif}
.tiles{margin-top:auto;display:grid;grid-template-columns:repeat(${OCCASIONS.length},1fr);gap:36px}
.tile{aspect-ratio:1;border-radius:26px;display:grid;place-items:center;padding:44px}
.tile svg{height:100%}
.domain{color:${PALETTE.inkMuted}}
</style></head><body>
<div class="brand">${markSvg()}<span class="name">${SITE.name}</span><span class="domain">wirdy.site</span></div>
<p class="hero">أذكار اليوم والليلة، مما ثبت عن النبي&nbsp;<span class="salla">ﷺ</span>، ومع كل ذكر تخريجُه</p>
<div class="tiles">${tiles}</div>
</body></html>`;

const occasion = ({ id, heading, color }) => `${head}
body{background:${color};color:${PALETTE.eggshell};display:grid;
  grid-template-columns:minmax(0,1fr) 820px;grid-template-rows:auto 1fr;column-gap:96px}
.brand{grid-column:1/-1;display:flex;align-items:center;gap:36px}
.disc{width:150px;height:150px;border-radius:50%;background:${PALETTE.eggshell};display:grid;place-items:center}
.disc svg{width:112px;height:112px}
.name{font-size:120px;font-weight:700;line-height:1;translate:0 -36px}
.text{align-self:end;padding-bottom:24px}
.heading{font-size:150px;font-weight:700;line-height:1.3;text-wrap:balance}
.count{margin-top:28px;font-size:72px;font-weight:500}
.emblem{align-self:end;width:820px;height:820px}
.emblem svg{width:100%;height:100%}
</style></head><body>
<div class="brand"><span class="disc">${markSvg()}</span><span class="name">${SITE.name}</span><span class="domain">wirdy.site</span></div>
<div class="text"><p class="heading">${heading}</p><p class="count">${adhkarLabel(count(id))}</p></div>
<div class="emblem">${emblemSvg(id)}</div>
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
