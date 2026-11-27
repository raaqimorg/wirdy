import { toArabicDigits } from '../../src/lib/arabic.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import type { Format, Poster, PosterItem, ThemeName } from '../../src/lib/poster.ts';
import { SITE } from '../../src/lib/site.ts';
import { emblemSvg, hafs, naskh, plexArabic, plexLatin } from '../opengraph/shared.ts';

const ENTITIES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

const escape = (text: string) => text.replaceAll(/[&<>]/gu, (c) => ENTITIES[c] ?? c);

const DAY = {
  panel: PALETTE.panel,
  ink: PALETTE.ink,
  muted: PALETTE.inkMuted,
  line: 'hsl(200 30% 20% / .22)',
};

const NIGHT = {
  panel: 'hsl(200 32% 15%)',
  ink: 'hsl(55 62% 89%)',
  muted: 'hsl(60 10% 72%)',
  line: 'hsl(60 10% 82% / .18)',
};

const theme = ({ color }: Poster, name: ThemeName) => {
  const dark = name === 'dark';
  const { panel, ink, muted, line } = dark ? NIGHT : DAY;
  const tone = dark ? `color-mix(in oklab,${color},black 10%)` : color;
  const toneText = `color-mix(in oklab,${color},${ink} ${dark ? 55 : 30}%)`;
  return `--panel:${panel};--ink:${ink};--muted:${muted};--line:${line};--tone:${tone};--tone-text:${toneText};`;
};

const wordsOf = ({ suwar, from, rest, phrases, words }: PosterItem) => {
  if (suwar.length > 0) {
    const ayat = suwar
      .map(
        (surah, index) =>
          `<p><i>﴿</i>${surah.map((ayah, i) => `${escape(ayah)}<i class="end">۝${toArabicDigits((from[index] ?? 1) + i)}</i>`).join(' ')}${rest === '' ? '<i>﴾</i>' : ' …'}</p>`
      )
      .join('');
    return `<div class="words quran">${ayat}</div>${rest === '' ? '' : `<p class="rest">وتتمتها في <span class="site">${escape(rest)}</span></p>`}`;
  }
  if (phrases.length > 0) {
    return `<div class="words">${phrases
      .map(
        ({ text, count }) =>
          `<p class="phrase"><span>${escape(text)}</span><b>${toArabicDigits(count)}</b></p>`
      )
      .join('')}</div>`;
  }
  return `<div class="words"><p>${escape(words)}</p></div>`;
};

const itemOf = (item: PosterItem) =>
  `<article class="item"><header><span class="no">${toArabicDigits(item.number)}</span><span class="title">${escape(item.title)}</span>${item.choice === '' ? '' : `<span class="choice">${item.choice}</span>`}${item.times === '' ? '' : `<span class="times">${item.times}</span>`}</header>${item.lead === '' ? '' : `<p class="lead">${escape(item.lead)}</p>`}${wordsOf(item)}<p class="src">${escape(item.source)}</p></article>`;

const flowOf = (items: ReadonlyArray<PosterItem>) =>
  items
    .map((item, index) => {
      const opens = index === 0 || items[index - 1]?.group !== item.group;
      if (!opens || item.group === '') return itemOf(item);
      const note = item.choice === '' ? '' : '<p class="note">تكفي واحدة منها</p>';
      return `<h2>${escape(item.group)}</h2>${note}${itemOf(item)}`;
    })
    .join('');

export const pageOf = (poster: Poster, format: Format, name: ThemeName) => {
  const { width, height } = format;
  const unit = Math.min(width, height) / 1080;
  const px = (value: number) => `${(value * unit).toFixed(1)}px`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
${plexArabic(500)}
${plexArabic(700)}
${plexLatin(500)}
${naskh()}
${hafs()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${width}px;height:${height}px;overflow:hidden}
body{${theme(poster, name)}display:flex;flex-direction:column;font-family:"Plex",sans-serif;font-weight:500;color:var(--ink);background:var(--panel);-webkit-font-smoothing:antialiased}
svg{display:block;width:100%;height:100%}
.site{direction:ltr;unicode-bidi:isolate}
.band{flex:none;display:flex;align-items:center;gap:${px(28)};padding:${px(30)} ${px(56)};background:var(--tone);color:${PALETTE.eggshell}}
.emblem{flex:none;width:${px(118)};height:${px(118)}}
.band h1{font-size:${px(62)};font-weight:700;line-height:1.25}
.band p{font-size:${px(25)};opacity:.85;line-height:1.5}
.brand{flex:none;margin-inline-start:auto;display:flex;align-items:center;gap:${px(12)};font-size:${px(26)}}
.mark{width:${px(48)};height:${px(48)}}
.name{font-size:${px(34)};translate:0 -${px(5)}}
.wrap{flex:1;min-height:0;display:flex;padding:${px(30)} ${px(56)} ${px(10)}}
.flow{flex:1;min-width:0;height:100%;column-gap:1.5em;column-rule:1px solid var(--line);column-fill:balance;overflow:hidden}
h2{break-after:avoid;font-size:.62em;font-weight:700;color:var(--tone-text);padding-bottom:.25em;margin-bottom:.4em;border-bottom:2px solid var(--tone)}
h2:not(:first-child){margin-top:.5em}
.note{break-after:avoid;font-size:.46em;color:var(--muted);margin:-.2em 0 .4em}
.item{break-inside:avoid;margin-bottom:var(--space,.75em)}
.item header{display:flex;align-items:baseline;gap:.4em;font-size:.56em;line-height:1.4;font-weight:700}
.no{flex:none;color:var(--tone-text)}
.title{flex:1}
.choice{flex:none;font-size:.85em;color:var(--tone-text)}
.times{flex:none;font-size:.9em;padding:0 .6em .1em;border-radius:99px;color:${PALETTE.eggshell};background:var(--tone)}
.lead{font-size:.46em;line-height:1.45;color:var(--tone-text)}
.words{font-family:"Naskh";line-height:1.9}
.words.quran{line-height:2.1}
.words i{font-style:normal;color:var(--tone-text)}
.words i.end{font-family:"Hafs";margin-inline-start:.15em}
.words p+p{margin-top:.35em}
.phrase{display:flex;align-items:center;gap:.5em}
.phrase+.phrase{margin-top:0!important}
.phrase b{flex:none;min-width:2.4em;padding:0 .4em .1em;font:700 .56em/1.5 "Plex";text-align:center;color:${PALETTE.eggshell};background:var(--tone);border-radius:99px}
.rest{font-size:.46em;color:var(--tone-text);font-weight:700}
.src{font-size:.42em;line-height:1.45;color:var(--muted)}
.foot{flex:none;display:flex;align-items:center;gap:${px(18)};height:${px(72)};margin:0 ${px(56)};border-top:2px solid var(--line);font-size:${px(21)};color:var(--muted)}
.foot .site{margin-inline-start:auto;color:var(--tone-text);font-size:${px(22)}}
</style></head><body>
<header class="band"><span class="emblem">${emblemSvg(poster.emblem)}</span><div><h1>${escape(poster.heading)}</h1><p>${escape(poster.summary)}</p></div><div class="brand"><span class="mark">${markSvg()}</span><b class="name">${SITE.name}</b><span class="site">${SITE.domain}</span></div></header>
<div class="wrap"><main class="flow">${flowOf(poster.items)}</main></div>
<footer class="foot"><span>${escape(poster.promise)}</span><span class="site">${SITE.domain}${poster.path}</span></footer>
<script>
const flow=document.querySelector('.flow');
const over=()=>flow.scrollWidth>flow.clientWidth+1||flow.scrollHeight>flow.clientHeight+1;
document.fonts.ready.then(()=>{
  let best={size:0,cols:1};
  for(let cols=1;cols<=8;cols++){
    flow.style.columnCount=cols;
    let low=4,high=90;
    while(high-low>0.25){
      const size=(low+high)/2;
      flow.style.fontSize=size+'px';
      const gap=parseFloat(getComputedStyle(flow).columnGap);
      const column=(flow.clientWidth-(cols-1)*gap)/cols;
      if(!over()&&column>=13*size)low=size;else high=size;
    }
    if(low>best.size)best={size:low,cols};
  }
  flow.style.columnCount=best.cols;
  flow.style.fontSize=best.size+'px';
  let low=0.75,high=2.5;
  while(high-low>0.02){
    const space=(low+high)/2;
    flow.style.setProperty('--space',space+'em');
    if(over())high=space;else low=space;
  }
  flow.style.setProperty('--space',low+'em');
  document.body.dataset.space=low.toFixed(2);
  Object.assign(document.body.dataset,{size:best.size.toFixed(1),cols:String(best.cols),fits:String(!over())});
});
</script></body></html>`;
};
