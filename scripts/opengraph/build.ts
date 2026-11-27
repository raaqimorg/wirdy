import { join } from 'node:path';
import { Console, Effect, FileSystem } from 'effect';
import { adhkarLabel, hadithLabel } from '../../src/lib/arabic.ts';
import { homeCardFile, sectionCardFile, type SectionCard } from '../../src/lib/card.ts';
import { markSvg, PETAL_RADIUS, PETALS } from '../../src/lib/mark.ts';
import { listed, OCCASIONS } from '../../src/lib/occasions.ts';
import { PALETTE } from '../../src/lib/palette.ts';
import { readAdhkar, readHadiths } from '../../src/lib/records.ts';
import { GUIDE_IDS, GUIDES, SITE } from '../../src/lib/site.ts';
import { screenshot } from '../chromium.ts';
import { run } from '../run.ts';
import { emblemSvg, plexArabic, plexLatin, root } from './shared.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const SAFE_X = 64;
const SAFE_Y = 56;
const NAME = 1.333 / 1.75;
const GAP = 0.5 / 1.75;
const LIFT = 0.2;
const HOME_X = SAFE_X * 2;
const HOME_Y = SAFE_Y * 2;
const MARK_HOME = 64;
const NAME_HOME = 300;
const TAG_HOME = 32;
const DOMAIN_HOME = 22;
const NAME_INK = { right: 0.0345, top: 0.2879 };
const TAG_INK = { right: -0.0078, baseline: 0.8359, descent: 0.3047 };
const DOMAIN_INK = { left: 0.0227, baseline: 0.8409 };
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

const markInset =
  (MARK_HOME *
    (Math.min(...PETALS.flatMap(({ cx, cy }) => [Number(cx), Number(cy)])) - PETAL_RADIUS)) /
  64;

const baseline = HEIGHT - HOME_Y - TAG_INK.descent * TAG_HOME;

const home = `${head}
body{position:relative;padding:0;background:${PALETTE.paper};color:${PALETTE.ink}}
.mark{position:absolute;left:${HOME_X - markInset}px;top:${HOME_Y - markInset}px;width:${MARK_HOME}px;height:${MARK_HOME}px}
.mark svg{display:block;width:100%;height:100%}
.name,.tag,.domain{position:absolute;line-height:1}
.name{right:${HOME_X - NAME_INK.right * NAME_HOME}px;top:${HOME_Y - NAME_INK.top * NAME_HOME}px;font-size:${NAME_HOME}px;font-weight:700}
.tag{right:${HOME_X - TAG_INK.right * TAG_HOME}px;top:${baseline - TAG_INK.baseline * TAG_HOME}px;font-size:${TAG_HOME}px;color:${PALETTE.inkMuted}}
.domain{left:${HOME_X - DOMAIN_INK.left * DOMAIN_HOME}px;top:${baseline - DOMAIN_INK.baseline * DOMAIN_HOME}px;font-size:${DOMAIN_HOME}px;color:${PALETTE.inkFaint}}
</style></head><body>
<div class="mark">${markSvg()}</div>
<p class="name">${SITE.name}</p>
<p class="tag">${SITE.tagline}</p>
<span class="domain">${SITE.domain}</span>
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
