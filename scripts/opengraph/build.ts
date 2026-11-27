import { join } from 'node:path';
import { Console, Effect, FileSystem } from 'effect';
import { adhkarLabel, hadithLabel } from '../../src/lib/arabic.ts';
import {
  HOME_SWATCHES,
  homeCardFile,
  sectionCardFile,
  type SectionCard,
} from '../../src/lib/card.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { listed, OCCASIONS } from '../../src/lib/occasions.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { readAdhkar, readHadiths } from '../../src/lib/records.ts';
import { GUIDE_IDS, GUIDES, SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.ts';
import { run } from '../run.ts';
import { amiri, emblemSvg, plexArabic, plexLatin, root } from './shared.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const SAFE_X = 64;
const SAFE_Y = 56;
const NAME = 1.333 / 1.75;
const GAP = 0.5 / 1.75;
const LIFT = 0.2;
const MARK_HOME = 96;
const MARK_SECTION = 64;

const outDir = process.argv[2] ?? join(root, 'public');

const head = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
${plexArabic(500)}
${plexArabic(700)}
${plexLatin(500)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
body{font-family:"Plex",sans-serif;font-weight:500;padding:${SAFE_Y}px ${SAFE_X}px}
.domain{direction:ltr;font-size:24px;letter-spacing:.01em}`;

const home = `${head}
${amiri()}
body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) ${HEIGHT}px repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));padding:0;background:${PALETTE.paper};color:${PALETTE.ink}}
.side{grid-column:3;grid-row:1 / -1;display:flex;flex-direction:column;justify-content:center;padding:${SAFE_Y}px ${SAFE_X}px}
.brand{display:flex;align-items:center;gap:${MARK_HOME * GAP}px}
.brand svg{width:${MARK_HOME}px;height:${MARK_HOME}px}
.name{font-size:${MARK_HOME * NAME}px;font-weight:700;line-height:1;translate:0 -${LIFT}em}
.promise{margin-top:40px;font-size:34px;font-weight:700;line-height:1.5}
.salawat{font-family:"Amiri",serif;font-weight:400}
.more{color:${PALETTE.inkFaint};font-weight:500}
.domain{align-self:flex-start;margin-top:28px;color:${PALETTE.inkMuted}}
.tile{display:grid;place-items:center;background:var(--tone)}
.tile svg{width:82%;height:82%}
</style></head><body>
<div class="side"><div class="brand">${markSvg()}<span class="name">${SITE.name}</span></div>
<p class="promise">${SITE.promise.before}&nbsp;<span class="salawat">ﷺ</span>${SITE.promise.after} <span class="more">${SITE.promise.more}</span></p>
<span class="domain">${SITE.domain}</span></div>
${HOME_SWATCHES.map(({ id, color }) => `<span class="tile" style="--tone:${color}">${emblemSvg(id)}</span>`).join('')}
</body></html>`;

const section = ({ id, title, color, note }: SectionCard) => `${head}
body{display:grid;grid-template-columns:minmax(0,1fr) 452px;column-gap:48px;background:${color};color:${PALETTE.eggshell}}
.text{display:flex;flex-direction:column;min-width:0}
.brand{display:flex;align-items:center;gap:${MARK_SECTION * GAP}px}
.brand svg{width:${MARK_SECTION}px;height:${MARK_SECTION}px}
.name{font-size:${MARK_SECTION * NAME}px;font-weight:700;line-height:1;translate:0 -${LIFT}em}
.heading{margin-top:auto;font-size:80px;font-weight:700;line-height:1.3;text-wrap:balance}
.note{margin-top:14px;font-size:36px;opacity:.88}
.domain{align-self:flex-start;margin-top:34px;opacity:.78}
.emblem{align-self:center;width:452px;height:452px}
.emblem svg{width:100%;height:100%}
</style></head><body>
<div class="text"><div class="brand">${markSvg('stage')}<span class="name">${SITE.name}</span></div>
<p class="heading">${title}</p><p class="note">${note}</p><span class="domain">${SITE.domain}</span></div>
<div class="emblem">${emblemSvg(id)}</div>
</body></html>`;

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const adhkar = yield* readAdhkar;
  const guides = yield* Effect.forEach(GUIDE_IDS, (id) =>
    Effect.map(readHadiths(id), (entries) => ({ id, count: entries.length }))
  );
  const sections: ReadonlyArray<SectionCard> = [
    ...OCCASIONS.map(({ id, title, color }) => ({
      id,
      title,
      color,
      note: adhkarLabel(
        adhkar.filter(({ data }) => data.occasion === id && listed(data.mode)).length
      ),
    })),
    ...guides.map(({ id, count }) => ({
      id,
      title: GUIDES[id].title,
      color: GUIDES[id].color,
      note: hadithLabel(count),
    })),
  ];
  const cards = [
    { file: homeCardFile(), html: home },
    ...sections.map((card) => ({ file: sectionCardFile(card), html: section(card) })),
  ];

  const dir = join(outDir, 'opengraph');
  yield* fs.makeDirectory(dir, { recursive: true });
  const wanted = new Set(cards.map(({ file }) => file));
  for (const file of yield* fs.readDirectory(dir)) {
    if (!wanted.has(`opengraph/${file}`)) yield* fs.remove(join(dir, file));
  }
  for (const { file, html } of cards) {
    const out = join(outDir, file);
    yield* screenshot({ html, width: WIDTH, height: HEIGHT, scale: 2, out });
    yield* Console.log(out);
  }
});

run(program);
