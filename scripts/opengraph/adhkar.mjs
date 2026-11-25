import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';
import { toArabicDigits } from '../../src/lib/arabic.ts';
import { cardFile, cardOf } from '../../src/lib/card.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { slugOf } from '../../src/lib/permalink.ts';
import { dhikrSchema } from '../../src/lib/schema.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.mjs';
import { amiri, amiriQuran, emblemSvg, plexArabic, plexLatin, root } from './shared.mjs';

const WIDTH = 1200;
const HEIGHT = 630;

const publicDir = join(root, 'public');
const content = join(root, 'src', 'content', 'adhkar');

const escape = (text) =>
  text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const ayatOf = (blocks) =>
  blocks.map((ayat) => `<p>﴿ ${ayat.map(escape).join(' <i>۝</i> ')} ﴾</p>`).join('');

const phrasesRows = (phrases) =>
  phrases
    .map(
      ({ text, count }) =>
        `<p class="phrase"><span>${escape(text)}</span><b>${toArabicDigits(count)}</b></p>`
    )
    .join('');

const textOf = (card) => {
  if (card.quran) return ayatOf(card.blocks);
  if (card.phrases) return phrasesRows(card.phrases);
  return `<p>${escape(card.blocks[0][0])}${card.cut ? ' …' : ''}</p>`;
};

const leading = (card) => {
  if (card.quran) return 2.15;
  return card.phrases ? 1.7 : 1.85;
};

const page = (
  card,
  occasion
) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
${plexArabic(500)}
${plexArabic(700)}
${plexLatin(500)}
${amiri()}
${amiriQuran()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{--tone:${card.color};--tone-text:color-mix(in oklab,var(--tone),${PALETTE.ink} 30%);font-family:"Plex",sans-serif;font-weight:500;background:${PALETTE.panel};color:${PALETTE.ink};display:flex;flex-direction:column}
.top{flex:none;display:flex;align-items:center;gap:26px;height:152px;padding:0 56px;background:var(--tone);color:${PALETTE.eggshell}}
.top svg{flex:none;width:104px;height:104px}
.names{flex:1;min-width:0;padding-bottom:8px}
.heading{font-size:26px;line-height:1.35;opacity:.85}
.title{font-weight:700;line-height:1.4;white-space:nowrap}
.count{flex:none;padding:8px 30px 13px;font-size:36px;font-weight:700;line-height:1.35;color:color-mix(in oklab,var(--tone),black 35%);background:${PALETTE.eggshell};border-radius:99px}
.main{flex:1;min-height:0;display:flex;flex-direction:column;padding:22px 56px 0}
.lead{font-size:28px;font-weight:700;line-height:1.5;color:var(--tone-text)}
.box{flex:1;min-height:0;display:flex;align-items:center}
.text{width:100%;font-family:"${card.quran ? 'Amiri Quran' : 'Amiri'}";line-height:${leading(card)};text-wrap:balance}
.text i{font-style:normal;color:${PALETTE.inkMuted}}
.phrase{display:flex;align-items:center;justify-content:space-between;gap:28px}
.phrase b{flex:none;min-width:max(84px,1.4em);padding:.1em .4em .22em;font:700 max(28px,.5em)/1.35 "Plex";text-align:center;color:${PALETTE.eggshell};background:var(--tone);border-radius:99px}
.evening{font-size:max(32px,min(.6em,44px));line-height:1.7;color:${PALETTE.inkMuted}}
.evening b{font:700 26px/1 "Plex";color:var(--tone-text)}
.foot{flex:none;display:flex;align-items:center;gap:14px;height:78px;margin:0 56px;padding-bottom:4px;font-size:23px;color:${PALETTE.inkMuted};border-top:2px solid color-mix(in oklab,${PALETTE.inkMuted},transparent 80%)}
.foot svg{width:42px;height:42px;translate:0 2px}
.foot b{font-size:29px;font-weight:700;color:${PALETTE.ink};margin-top:-7px}
.foot .site{direction:ltr}
.foot .source{margin-inline-start:auto;text-align:left}
</style></head><body>
<div class="top">${emblemSvg(occasion)}<div class="names"><p class="heading">${card.heading}</p><p class="title">${escape(card.title)}</p></div>${card.count ? `<p class="count">${card.count}</p>` : ''}</div>
<div class="main">${card.lead ? `<p class="lead">${escape(card.lead)}</p>` : ''}
<div class="box"><div class="text">${textOf(card)}${card.evening ? `<p class="evening"><b>وفي المساء:</b> ${escape(card.evening)}</p>` : ''}</div></div></div>
<div class="foot">${markSvg()}<b>${SITE.name}</b><span class="site">wirdy.site</span><span class="source">${escape(card.takhrij)}${card.quran ? '. النص: tanzil.net' : ''}</span></div>
<script>
const [title,box,text,foot]=['.title','.box','.text','.foot'].map((name)=>document.querySelector(name));
const fit=(element,largest,smallest,fits)=>{
  for(let size=largest;size>=smallest;size--){element.style.fontSize=size+'px';if(fits())return true}
  return false;
};
document.fonts.ready.then(()=>{
  const fits=[
    fit(title,48,36,()=>title.scrollWidth<=title.clientWidth),
    fit(text,92,31,()=>text.scrollHeight<=box.clientHeight-14&&text.scrollWidth<=box.clientWidth),
    foot.scrollWidth<=foot.clientWidth,
  ];
  if(fits.every(Boolean))return;
  document.body.style.outline='12px solid red';
  document.body.style.outlineOffset='-12px';
});
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
