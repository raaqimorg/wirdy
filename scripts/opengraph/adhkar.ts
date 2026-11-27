import { Console, Effect, FileSystem, Path } from 'effect';
import { toArabicDigits } from '../../src/lib/arabic.ts';
import { cardFile, cardOf, hadithCardOf, type Card } from '../../src/lib/card.ts';
import type { EmblemName } from '../../src/lib/emblems.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import type { Phrase } from '../../src/lib/phrases.ts';
import { readAdhkar, readHadiths } from '../../src/lib/records.ts';
import { GUIDE_IDS, SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.ts';
import { run } from '../run.ts';
import { emblemSvg, hafs, naskh, plexArabic, plexLatin, root } from './shared.ts';

const WIDTH = 1200;
const HEIGHT = 630;

const ENTITIES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

const escape = (text: string) => text.replaceAll(/[&<>]/gu, (c) => ENTITIES[c] ?? c);

const ayatOf = ({ blocks, from }: Card) =>
  blocks
    .map(
      (ayat, surah) =>
        `<p><i>﴿</i>${ayat.map((ayah, i) => `${escape(ayah)}<i class="end">۝${toArabicDigits((from[surah] ?? 1) + i)}</i>`).join(' ')}<i>﴾</i></p>`
    )
    .join('');

const phrasesRows = (phrases: ReadonlyArray<Phrase>) =>
  phrases
    .map(
      ({ text, count }) =>
        `<p class="phrase"><span>${escape(text)}</span><b>${toArabicDigits(count)}</b></p>`
    )
    .join('');

const textOf = (card: Card) => {
  if (card.quran) return ayatOf(card);
  if (card.phrases) return phrasesRows(card.phrases);
  return `<p>${escape(card.blocks[0]?.[0] ?? '')}${card.cut ? ' …' : ''}</p>`;
};

const leading = (card: Card) => {
  if (card.quran) return 2.15;
  return card.phrases ? 1.7 : 1.85;
};

const page = (
  card: Card,
  occasion: EmblemName
) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
${plexArabic(500)}
${plexArabic(700)}
${plexLatin(500)}
${naskh()}
${hafs()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body.unfit{outline:12px solid red;outline-offset:-12px}
body{--tone:${card.color};--tone-text:color-mix(in oklab,var(--tone),${PALETTE.ink} ${PALETTE.toneInk});font-family:"Plex",sans-serif;font-weight:500;background:${PALETTE.panel};color:${PALETTE.ink};display:flex;flex-direction:column}
.top{flex:none;display:flex;align-items:center;gap:26px;height:152px;padding:0 56px;background:var(--tone);color:${PALETTE.eggshell}}
.top svg{flex:none;width:104px;height:104px}
.names{flex:1;min-width:0;padding-bottom:8px}
.heading{font-size:26px;line-height:1.35;opacity:.85}
.title{font-weight:700;line-height:1.4;white-space:nowrap}
.context{font-size:.6em;font-weight:500;opacity:.82}
.stacked .context{display:block;font-size:26px;line-height:1.3}
.count{flex:none;padding:8px 30px 13px;font-size:36px;font-weight:700;line-height:1.35;color:color-mix(in oklab,var(--tone),${PALETTE.shade} 35%);background:${PALETTE.eggshell};border-radius:99px}
.main{flex:1;min-height:0;display:flex;flex-direction:column;padding:22px 56px 0}
.lead{font-size:28px;font-weight:700;line-height:1.5;color:var(--tone-text)}
.box{flex:1;min-height:0;display:flex;align-items:center}
.text{width:100%;font-family:"Naskh";line-height:${leading(card)};text-wrap:balance}
.text i{font-style:normal;color:var(--tone-text)}
.text i.end{font-family:"Hafs";margin-inline-start:.15em}
.phrase{display:flex;align-items:center;justify-content:space-between;gap:28px}
.phrase b{flex:none;min-width:max(84px,1.4em);padding:.1em .4em .22em;font:700 max(28px,.5em)/1.35 "Plex";text-align:center;color:${PALETTE.eggshell};background:var(--tone);border-radius:99px}
.evening{font-size:max(32px,min(.6em,44px));line-height:1.7;color:${PALETTE.inkMuted}}
.evening b{font:700 26px/1 "Plex";color:var(--tone-text)}
.foot{flex:none;display:flex;align-items:center;gap:14px;height:78px;margin:0 56px;padding-bottom:4px;font-size:23px;color:${PALETTE.inkMuted};border-top:2px solid color-mix(in oklab,${PALETTE.inkMuted},transparent 80%)}
.foot svg{width:42px;height:42px;translate:0 2px}
.foot b{font-size:29px;font-weight:700;color:${PALETTE.ink};translate:0 -7px}
.foot .site{direction:ltr}
.foot .source{margin-inline-start:auto;text-align:left}
</style></head><body class="unfit">
<div class="top">${emblemSvg(occasion)}<div class="names"><p class="heading">${card.heading}</p><p class="title">${escape(card.title)}${card.context !== null && card.context !== '' ? ` <span class="context">${escape(card.context)}</span>` : ''}</p></div>${card.count !== null && card.count !== '' ? `<p class="count">${card.count}</p>` : ''}</div>
<div class="main">${card.lead ? `<p class="lead">${escape(card.lead)}</p>` : ''}
<div class="box"><div class="text">${textOf(card)}${card.evening !== null && card.evening !== '' ? `<p class="evening"><b>وفي المساء:</b> ${escape(card.evening)}</p>` : ''}</div></div></div>
<div class="foot">${markSvg()}<b>${SITE.name}</b><span class="site">${SITE.domain}</span><span class="source">${escape(card.takhrij)}${card.quran ? '. النص: tanzil.net' : ''}</span></div>
<script>
const [band,names,title,box,text,foot]=['.top','.names','.title','.box','.text','.foot'].map((name)=>document.querySelector(name));
const titleFits=()=>title.scrollWidth<=title.clientWidth&&names.offsetHeight<=band.clientHeight;
const fit=(element,largest,smallest,fits)=>{
  for(let size=largest;size>=smallest;size--){element.style.fontSize=size+'px';if(fits())return true}
  return false;
};
document.fonts.ready.then(()=>{
  if(title.querySelector('.context')&&!fit(title,48,48,titleFits))title.classList.add('stacked');
  const fits=[
    fit(title,48,36,titleFits),
    fit(text,92,31,()=>text.scrollHeight<=box.clientHeight-14&&text.scrollWidth<=box.clientWidth),
    foot.scrollWidth<=foot.clientWidth,
  ];
  if(fits.every(Boolean))document.body.classList.remove('unfit');
});
</script></body></html>`;

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const publicDir = path.join(root, 'public');

  const adhkar = yield* Effect.forEach(yield* readAdhkar, ({ id, data, body }) =>
    Effect.map(cardOf(data, body), (card) => ({
      card,
      occasion: data.occasion,
      file: cardFile(card, data.occasion, id.slice(data.occasion.length + 1)),
    }))
  );
  const hadiths = yield* Effect.forEach(GUIDE_IDS, (guide) =>
    Effect.map(readHadiths(guide), (entries) =>
      entries.map(({ slug, data, body }) => {
        const card = hadithCardOf(guide, data, body);
        return { card, occasion: guide, file: cardFile(card, guide, slug) };
      })
    )
  );
  const entries: ReadonlyArray<{ card: Card; occasion: EmblemName; file: string }> = [
    ...adhkar,
    ...hadiths.flat(),
  ];

  const wanted = new Set(entries.map(({ file }) => file));
  const ogDir = path.join(publicDir, 'og');
  if (yield* fs.exists(ogDir)) {
    for (const file of yield* fs.readDirectory(ogDir, { recursive: true })) {
      if (file.endsWith('.png') && !wanted.has(`og/${file}`)) {
        yield* fs.remove(path.join(ogDir, file));
      }
    }
    const sections = new Set<string>(entries.map(({ occasion }) => occasion));
    for (const dir of yield* fs.readDirectory(ogDir)) {
      if (!sections.has(dir)) {
        yield* fs.remove(path.join(ogDir, dir), { recursive: true });
      }
    }
  }

  for (const { card, occasion, file } of entries) {
    const out = path.join(publicDir, file);
    if (yield* fs.exists(out)) continue;
    yield* fs.makeDirectory(path.dirname(out), { recursive: true });
    yield* screenshot({ html: page(card, occasion), width: WIDTH, height: HEIGHT, scale: 2, out });
    yield* Console.log(file);
  }
});

run(program);
