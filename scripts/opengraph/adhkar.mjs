import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { cardFile, cardOf } from '../../src/lib/card.ts';
import { EMBLEMS } from '../../src/lib/emblems.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { slugOf } from '../../src/lib/permalink.ts';
import { dhikrSchema } from '../../src/lib/schema.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.mjs';

const WIDTH = 1200;
const HEIGHT = 630;

const root = join(import.meta.dirname, '..', '..');
const publicDir = join(root, 'public');
const content = join(root, 'src', 'content', 'adhkar');
const font = (pkg, file) =>
  pathToFileURL(join(root, 'node_modules', '@fontsource', pkg, 'files', file)).href;

const escape = (text) =>
  text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const emblem = (id) =>
  `<svg viewBox="0 0 240 240">${EMBLEMS[id]
    .map(
      ({ tag, attrs }) =>
        `<${tag} ${Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`
    )
    .join('')}</svg>`;

const ayatOf = (blocks) =>
  blocks.map((ayat) => `<p>﴿ ${ayat.map(escape).join(' <i>۝</i> ')} ﴾</p>`).join('');

const page = (
  card,
  occasion
) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:"Plex";font-weight:500;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-500-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:700;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-arabic-700-normal.woff2')}") format("woff2")}
@font-face{font-family:"Plex";font-weight:500;unicode-range:U+0000-00FF;src:url("${font('ibm-plex-sans-arabic', 'ibm-plex-sans-arabic-latin-500-normal.woff2')}") format("woff2")}
@font-face{font-family:"Amiri";src:url("${font('amiri', 'amiri-arabic-400-normal.woff2')}") format("woff2")}
@font-face{font-family:"Amiri Quran";src:url("${font('amiri-quran', 'amiri-quran-arabic-400-normal.woff2')}") format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{font-family:"Plex",sans-serif;font-weight:500;background:${card.color};color:#f4f1d0;padding:40px 56px 36px;display:flex;flex-direction:column;gap:16px}
.top{display:flex;align-items:center;gap:20px;font-size:25px}
.top svg{width:64px;height:64px}
.top b{display:block;font-size:32px;line-height:1.35}
.count{margin-inline-start:auto;font-size:27px;font-weight:700;border:2px solid #f4f1d0;border-radius:99px;padding:4px 22px;white-space:nowrap}
.lead{font-size:24px;line-height:1.5;opacity:.88}
.box{flex:1;min-height:0;display:flex;align-items:center}
.text{width:100%;font-family:"${card.quran ? 'Amiri Quran' : 'Amiri'}";line-height:${card.quran ? 2.15 : 1.85}}
.text i{font-style:normal;opacity:.75}
.evening{font-family:"Plex";font-size:.5em;line-height:1.6;opacity:.75}
.evening span{font-family:"Amiri";font-size:1.5em}
.foot{display:flex;align-items:center;gap:14px;font-size:22px;border-top:2px solid rgb(244 241 208 / .3);padding-top:14px}
.foot svg{width:36px;height:36px;background:#f4f1d0;border-radius:50%;padding:4px}
.foot b{font-size:26px}
.foot .site{direction:ltr}
.foot .tk{margin-inline-start:auto;text-align:left}
</style></head><body>
<div class="top">${emblem(occasion)}<div>${card.heading}<b>${escape(card.title)}</b></div>${card.count ? `<span class="count">${card.count}</span>` : ''}</div>
${card.lead ? `<p class="lead">${escape(card.lead)}</p>` : ''}
<div class="box"><div class="text">${card.quran ? ayatOf(card.blocks) : `<p>${escape(card.blocks[0][0])}${card.cut ? ' …' : ''}</p>`}${card.evening ? `<p class="evening">وفي المساء: <span>${escape(card.evening)}</span></p>` : ''}</div></div>
<div class="foot">${markSvg()}<b>${SITE.name}</b><span class="site">wirdy.site</span><span class="tk">${card.quran ? 'النص من مشروع تنزيل (tanzil.net). ' : ''}${escape(card.takhrij)}</span></div>
<script>
const box=document.querySelector('.box'),text=document.querySelector('.text');
document.fonts.ready.then(()=>{for(const size of [64,58,52,46,42,38,34,31]){text.style.fontSize=size+'px';if(text.scrollHeight<=box.clientHeight-8)return}document.body.style.outline='12px solid red';document.body.style.outlineOffset='-12px'});
</script></body></html>`;

const entries = readdirSync(content, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.md'))
  .toSorted()
  .map((path) => {
    const file = matter(readFileSync(join(content, path), 'utf8'));
    const data = dhikrSchema.parse(file.data);
    const card = cardOf(data, file.content);
    const slug = slugOf(path.replace(/\.md$/, ''));
    return { card, occasion: data.occasion, file: cardFile(card, data.occasion, slug) };
  });

const wanted = new Set(entries.map(({ file }) => file));
const ogDir = join(publicDir, 'og');
if (existsSync(ogDir)) {
  for (const path of readdirSync(ogDir, { recursive: true, encoding: 'utf8' })) {
    if (path.endsWith('.png') && !wanted.has(`og/${path}`)) rmSync(join(ogDir, path));
  }
}

for (const { card, occasion, file } of entries) {
  const out = join(publicDir, file);
  if (existsSync(out)) continue;
  mkdirSync(dirname(out), { recursive: true });
  screenshot({ html: page(card, occasion), width: WIDTH, height: HEIGHT, out });
  console.log(file);
}
