import { join } from 'node:path';
import { Console, Effect, FileSystem } from 'effect';
import { adhkarLabel } from '../../src/lib/arabic.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { OCCASIONS, type Section } from '../../src/lib/occasions.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.ts';
import { run } from '../run.ts';
import { amiri, emblemSvg, plexArabic, plexLatin, root } from './shared.ts';

const WIDTH = 2400;
const HEIGHT = 1260;
const MARGIN = 132;

const outDir = process.argv[2] ?? join(root, 'public');
const ADHKAR = join(root, 'src', 'content', 'adhkar');

const countOf = (id: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    return (yield* fs.readDirectory(join(ADHKAR, id))).filter((file) => file.endsWith('.md'))
      .length;
  });

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

const home = `${head}
body{background:${PALETTE.paper};color:${PALETTE.ink};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.brand{display:flex;align-items:center;gap:56px}
.brand svg{width:240px;height:240px}
.name{font-size:240px;font-weight:700;line-height:1;translate:0 -60px}
.tagline{margin-top:40px;font-size:96px;font-weight:500}
.domain{position:absolute;bottom:${MARGIN}px;margin:0;color:${PALETTE.inkMuted}}
</style></head><body>
<div class="brand">${markSvg()}<span class="name">${SITE.name}</span></div>
<p class="tagline">${SITE.tagline}</p>
<span class="domain">${SITE.domain}</span>
</body></html>`;

const occasion = ({ id, title, color }: Section, count: number) => `${head}
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
<div class="brand"><span class="disc">${markSvg()}</span><span class="name">${SITE.name}</span><span class="domain">${SITE.domain}</span></div>
<div class="text"><p class="heading">${title}</p><p class="count">${adhkarLabel(count)}</p></div>
<div class="emblem">${emblemSvg(id)}</div>
</body></html>`;

const program = Effect.gen(function* () {
  const cards = [
    { file: 'opengraph.png', html: home },
    ...(yield* Effect.forEach(OCCASIONS, (section) =>
      Effect.map(countOf(section.id), (count) => ({
        file: `opengraph-${section.id}.png`,
        html: occasion(section, count),
      }))
    )),
  ];

  for (const { file, html } of cards) {
    const out = join(outDir, file);
    yield* screenshot({ html, width: WIDTH, height: HEIGHT, out });
    yield* Console.log(out);
  }
});

run(program);
