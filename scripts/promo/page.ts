import { Data, Effect, FileSystem, Path, Schema } from 'effect';
import type { Scope } from 'effect';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright-core';
import { EMBLEMS } from '../../src/lib/emblems.ts';
import { markSvg } from '../../src/lib/mark.ts';
import { OCCASION_IDS, sectionOf } from '../../src/lib/occasions.ts';
import { GUIDE_IDS, GUIDES } from '../../src/lib/site.ts';
import { browser, NoBrowser } from '../chromium.ts';
import { root } from '../opengraph/shared.ts';
import { argumentsOf } from '../run.ts';
import { FPS, HEIGHT, WIDTH, type ClipState, type Sample, type TextBox } from './rules.ts';

export class NoH264 extends Data.TaggedError('NoH264')<{ readonly message: string }> {}

export class FilmBroken extends Data.TaggedError('FilmBroken')<{ readonly message: string }> {}

export type Film = {
  readonly duration: number;
  readonly seek: (time: number) => Effect.Effect<void, FilmBroken>;
  readonly shot: () => Effect.Effect<Uint8Array, FilmBroken>;
  readonly sample: (time: number) => Effect.Effect<Sample, FilmBroken>;
};

const H264 = 'video/mp4; codecs="avc1.42E01E"';
const SETTLE = 250;
const LOAD = 15_000;

const STYLES = [
  'src/styles/fonts.css',
  'src/styles/tokens.css',
  'src/styles/components/emblem.css',
  'scripts/promo/film.css',
] as const;

type Drawn = {
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly enter: string | null;
};

type Drawings = {
  readonly emblems: Readonly<Record<string, ReadonlyArray<Drawn>>>;
  readonly marks: Readonly<Record<string, string>>;
  readonly tones: Readonly<Record<string, string>>;
  readonly load: number;
};

type Prepared = { readonly duration: number; readonly problems: ReadonlyArray<string> };

type Seen = {
  readonly texts: ReadonlyArray<TextBox>;
  readonly clips: ReadonlyArray<ClipState>;
  readonly stills: ReadonlyArray<string>;
};

export const filmArguments = Effect.map(
  argumentsOf(
    Schema.Tuple([Schema.String, Schema.optionalKey(Schema.Literal('--draft'))]),
    'bun run promo:<check|sheet|render> <folder> [--draft]'
  ),
  ([folder, draft]) => ({ folder, draft: draft !== undefined })
);

const DRAWINGS: Drawings = {
  emblems: Object.fromEntries(
    Object.entries(EMBLEMS).map(([name, shapes]) => [
      name,
      shapes.map(({ tag, attrs, enter }) => ({ tag, attrs, enter: enter ?? null })),
    ])
  ),
  marks: { own: markSvg('own'), stage: markSvg('stage') },
  tones: {
    ...Object.fromEntries(OCCASION_IDS.map((id) => [id, sectionOf(id).color])),
    ...Object.fromEntries(GUIDE_IDS.map((id) => [id, GUIDES[id].color])),
  },
  load: LOAD,
};

const prepare = async ({ emblems, marks, tones, load }: Drawings): Promise<Prepared> => {
  const problems: Array<string> = [];
  const svgNs = 'http://www.w3.org/2000/svg';
  for (const svg of document.querySelectorAll('svg[data-emblem]')) {
    if (!(svg instanceof SVGSVGElement)) continue;
    const name = svg.dataset['emblem'] ?? '';
    const shapes = emblems[name];
    if (shapes === undefined) {
      problems.push(`no emblem named «${name}»`);
      continue;
    }
    svg.setAttribute('viewBox', '0 0 240 240');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('emblem');
    svg.replaceChildren(
      ...shapes.map(({ tag, attrs, enter }) => {
        const shape = document.createElementNS(svgNs, tag);
        for (const [key, value] of Object.entries(attrs)) shape.setAttribute(key, String(value));
        if (enter !== null) shape.dataset['enter'] = enter;
        return shape;
      })
    );
  }
  for (const svg of document.querySelectorAll('svg[data-mark]')) {
    if (!(svg instanceof SVGSVGElement)) continue;
    const inks = svg.dataset['mark'] === 'stage' ? 'stage' : 'own';
    const drawn = new DOMParser().parseFromString(marks[inks] ?? '', 'image/svg+xml');
    svg.setAttribute('viewBox', drawn.documentElement.getAttribute('viewBox') ?? '0 0 64 64');
    svg.setAttribute('aria-hidden', 'true');
    svg.replaceChildren(...drawn.documentElement.children);
  }
  for (const element of document.querySelectorAll('[data-occasion]')) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue;
    const name = element.dataset['occasion'] ?? '';
    const tone = tones[name];
    if (tone === undefined) {
      problems.push(`no occasion named «${name}»`);
      continue;
    }
    element.style.setProperty('--tone', tone);
    element.classList.add('tone');
  }
  const film = document.querySelector('[data-film]');
  if (!(film instanceof HTMLElement)) return { duration: 0, problems: ['no [data-film] element'] };
  const theme = film.dataset['theme'];
  if (theme !== undefined) document.documentElement.dataset['theme'] = theme;
  const duration = Number(film.dataset['duration']);
  if (!Number.isFinite(duration) || duration <= 0) problems.push('data-duration is not a number');
  const loads: Array<Promise<void>> = [];
  for (const video of document.querySelectorAll('video[data-clip]')) {
    if (!(video instanceof HTMLVideoElement)) continue;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error !== null) continue;
    loads.push(
      new Promise<void>((resolve) => {
        video.addEventListener(
          'loadeddata',
          () => {
            resolve();
          },
          { once: true }
        );
        video.addEventListener(
          'error',
          () => {
            resolve();
          },
          { once: true }
        );
        setTimeout(resolve, load);
        video.preload = 'auto';
        video.load();
      })
    );
  }
  await Promise.all(loads);
  await Promise.all([...document.fonts].map((face) => face.load()));
  await document.fonts.ready;
  return { duration, problems };
};

const seekTo = async ({
  time,
  fps,
  settle,
}: {
  readonly time: number;
  readonly fps: number;
  readonly settle: number;
}) => {
  for (const animation of document.getAnimations()) {
    animation.pause();
    animation.currentTime = time * 1000;
  }
  const seeks: Array<Promise<void>> = [];
  for (const video of document.querySelectorAll('video[data-clip]')) {
    if (!(video instanceof HTMLVideoElement) || !Number.isFinite(video.duration)) continue;
    const start = Number(video.dataset['start'] ?? '0');
    const target = Math.min(Math.max(time - start, 0), video.duration - 1 / fps);
    if (Math.abs(video.currentTime - target) < 1e-6) continue;
    seeks.push(
      new Promise<void>((resolve) => {
        video.addEventListener(
          'seeked',
          () => {
            video.requestVideoFrameCallback(() => {
              resolve();
            });
            setTimeout(resolve, settle);
          },
          { once: true }
        );
        video.currentTime = target;
      })
    );
  }
  await Promise.all(seeks);
  await document.fonts.ready;
};

const seen = (): Seen => {
  const owners = [...document.querySelectorAll('[data-film] *')].filter((element) =>
    [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
    )
  );
  const texts = owners
    .filter((element) => !owners.some((other) => other !== element && other.contains(element)))
    .filter((element) =>
      element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    )
    .map((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const { x, y, width, height } = range.getBoundingClientRect();
      return {
        x,
        y,
        width,
        height,
        text: element.textContent.trim().replaceAll(/\s+/gu, ' '),
        size: Number(getComputedStyle(element).fontSize.replace('px', '')),
        quote: element.closest('[data-quote]') !== null,
      };
    });
  const clips = [...document.querySelectorAll('video[data-clip]')]
    .filter((video) => video instanceof HTMLVideoElement)
    .filter(
      (video) =>
        Number.isFinite(video.duration) &&
        video.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    )
    .map((video) => ({
      name: video.getAttribute('src') ?? '',
      start: Number(video.dataset['start'] ?? '0'),
      duration: video.duration,
    }));
  const stills = [...document.querySelectorAll('img[data-still]')]
    .filter((image) => image.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
    .map((image) => image.getAttribute('src') ?? '');
  return { texts, clips, stills };
};

const broken = (message: string) => new FilmBroken({ message });

const pageWork = <A>(work: () => Promise<A>) =>
  Effect.tryPromise({ try: work, catch: (cause) => broken(String(cause)) });

const pageOf = (url: string, scale: number) =>
  Effect.gen(function* () {
    const executablePath = yield* Effect.mapError(browser, (error) =>
      error instanceof NoBrowser ? error : broken(error.message)
    );
    const instance = yield* Effect.acquireRelease(
      pageWork(() => chromium.launch({ executablePath, headless: true })),
      (opened) => Effect.promise(() => opened.close())
    );
    const page: Page = yield* pageWork(() =>
      instance.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: scale })
    );
    yield* pageWork(() => page.goto(url));
    return page;
  });

export const openFilm = (
  folder: string,
  options: { readonly scale?: number } = {}
): Effect.Effect<
  Film,
  NoBrowser | NoH264 | FilmBroken,
  Scope.Scope | FileSystem.FileSystem | Path.Path
> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const dir = path.resolve(folder);
    const source = path.join(dir, 'film.html');
    const html = yield* Effect.mapError(fs.readFileString(source), () =>
      broken(`no film at ${source}`)
    );
    const fonts = pathToFileURL(path.join(root, 'node_modules', '@fontsource')).href;
    const styles = yield* Effect.forEach(STYLES, (file) =>
      Effect.mapError(fs.readFileString(path.join(root, file)), () => broken(`cannot read ${file}`))
    );
    const css = styles.join('\n').replaceAll('url("@fontsource/', `url("${fonts}/`);
    const page = [
      '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">',
      `<base href="${pathToFileURL(dir).href}/">`,
      `<style>${css}</style></head><body>${html}</body></html>`,
    ].join('');
    const temp = yield* Effect.mapError(
      fs.makeTempDirectoryScoped({ prefix: 'wirdy-promo-' }),
      () => broken('cannot make a temporary directory')
    );
    const file = path.join(temp, 'film.html');
    yield* Effect.mapError(fs.writeFileString(file, page), () => broken(`cannot write ${file}`));

    const tab = yield* pageOf(pathToFileURL(file).href, options.scale ?? 1);
    const playable = yield* pageWork(() =>
      tab.evaluate((type) => document.createElement('video').canPlayType(type), H264)
    );
    if (playable === '') {
      return yield* new NoH264({
        message: 'this browser cannot play H.264; set CHROME to Brave or Google Chrome',
      });
    }
    const { duration, problems } = yield* pageWork(() => tab.evaluate(prepare, DRAWINGS));
    if (problems.length > 0) return yield* broken(problems.join('\n'));

    const seek = (time: number) =>
      pageWork(() => tab.evaluate(seekTo, { time, fps: FPS, settle: SETTLE }));
    return {
      duration,
      seek,
      shot: () => pageWork(() => tab.screenshot({ type: 'png' })),
      sample: (time: number) =>
        Effect.gen(function* () {
          yield* seek(time);
          const { texts, clips, stills } = yield* pageWork(() => tab.evaluate(seen));
          return {
            time,
            texts,
            clips: [
              ...clips,
              ...stills.map((name) => ({ name, start: 0, duration: Number.POSITIVE_INFINITY })),
            ],
          };
        }),
    };
  });
